/**
 * Client HTTP unique de l'application (§ Lot 1 : URL de base, en-têtes, délais
 * d'expiration et traitement des erreurs centralisés).
 *
 * L'authentification est branchée via un fournisseur injectable (Lot 4) : le
 * client reste utilisable sans jeton pour les paliers 10 → 16.
 */
import { ErreurReseau, ErreurValidation } from '@/domain/erreurs';
import type { z } from 'zod';
import { BACKOFF_BASE_MS, DELAI_EXPIRATION_MS, REESSAIS_MAX, URL_BASE } from '../config';
import { erreurDepuisReponse } from './erreurs-http';

/** Contrat d'injection du jeton et de rafraîchissement single-flight (Lot 4). */
export interface FournisseurAuth {
  jetonAcces(): string | null;
  /** Déclenche un rafraîchissement partagé ; résout `true` si un nouveau jeton est disponible. */
  rafraichir(): Promise<boolean>;
}

let fournisseurAuth: FournisseurAuth | null = null;
export function definirFournisseurAuth(f: FournisseurAuth | null): void {
  fournisseurAuth = f;
}

export type OptionsRequete<T> = {
  methode?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  corps?: unknown;
  entetes?: Record<string, string>;
  /** Schéma zod validant le corps de la réponse. Absent = réponse ignorée (204). */
  schema?: z.ZodType<T>;
  ifMatch?: number;
  signal?: AbortSignal;
  delaiMs?: number;
  reessais?: number;
};

function attendre(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Combine le signal d'abandon de l'appelant et celui du minuteur d'expiration.
 * Retourne aussi `nettoyer`, à appeler une fois la requête réglée : sans ça,
 * les deux écouteurs restent attachés à `externe`/`delai` même quand ni l'un
 * ni l'autre n'abandonne jamais — le cas le plus fréquent.
 */
function fusionnerSignaux(
  externe: AbortSignal | undefined,
  delai: AbortSignal,
): { signal: AbortSignal; nettoyer: () => void } {
  if (!externe) return { signal: delai, nettoyer: () => {} };
  const ctrl = new AbortController();
  const relayer = () => ctrl.abort();
  if (externe.aborted) ctrl.abort();
  externe.addEventListener('abort', relayer, { once: true });
  delai.addEventListener('abort', relayer, { once: true });
  return {
    signal: ctrl.signal,
    nettoyer: () => {
      externe.removeEventListener('abort', relayer);
      delai.removeEventListener('abort', relayer);
    },
  };
}

async function executer<T>(chemin: string, options: OptionsRequete<T>, rejeuAuth: boolean): Promise<T> {
  const { methode = 'GET', corps, entetes = {}, schema, ifMatch, signal } = options;
  const delaiMs = options.delaiMs ?? DELAI_EXPIRATION_MS;

  const enteteFinales: Record<string, string> = { Accept: 'application/json', ...entetes };
  if (corps !== undefined) enteteFinales['Content-Type'] = 'application/json';
  if (ifMatch !== undefined) enteteFinales['If-Match'] = String(ifMatch);
  const jeton = fournisseurAuth?.jetonAcces();
  if (jeton) enteteFinales.Authorization = `Bearer ${jeton}`;

  const minuteur = new AbortController();
  const idDelai = setTimeout(() => minuteur.abort(), delaiMs);
  const { signal: signalFusionne, nettoyer } = fusionnerSignaux(signal, minuteur.signal);

  let reponse: Response;
  try {
    reponse = await fetch(`${URL_BASE}${chemin}`, {
      method: methode,
      headers: enteteFinales,
      body: corps !== undefined ? JSON.stringify(corps) : undefined,
      signal: signalFusionne,
    });
  } catch (e) {
    if (signal?.aborted) throw e; // annulation volontaire : laisser remonter
    throw new ErreurReseau(
      minuteur.signal.aborted ? "Délai d'expiration dépassé." : 'Réseau indisponible.',
    );
  } finally {
    clearTimeout(idDelai);
    nettoyer();
  }

  if (reponse.status === 204) return undefined as T;

  const texte = await reponse.text();
  const donnees: unknown = texte ? JSON.parse(texte) : undefined;

  if (reponse.ok) {
    if (!schema) return donnees as T;
    const analyse = schema.safeParse(donnees);
    if (!analyse.success) {
      throw new ErreurValidation('Réponse serveur inattendue (schéma invalide).');
    }
    return analyse.data;
  }

  // 401 : un seul rafraîchissement puis rejeu (single-flight côté fournisseur).
  if (reponse.status === 401 && fournisseurAuth && !rejeuAuth) {
    const rafraichi = await fournisseurAuth.rafraichir();
    if (rafraichi) return executer(chemin, options, true);
  }

  throw erreurDepuisReponse(reponse.status, donnees);
}

/**
 * Point d'entrée unique. Gère les réessais 503/réseau avec back-off exponentiel.
 *
 * Un POST n'est jamais réessayé par défaut (BL-12) : `POST /books` et
 * `POST /books/:id/notes` n'ont aucune clé d'idempotence côté API — si la
 * requête a réellement abouti côté serveur mais que la réponse se perd (vraie
 * coupure réseau, pas le mode chaos qui répond 503 avant `next()`), un
 * réessai aveugle créerait un doublon. `POST /sync`, lui, porte sa propre clé
 * (l'id de mutation) et gère ses réessais autrement (voir services/api/sync.ts,
 * `reessais: 0` explicite + rejeu contrôlé par la file). Un appelant peut
 * toujours forcer un nombre de réessais via `options.reessais`.
 */
export async function requete<T>(chemin: string, options: OptionsRequete<T> = {}): Promise<T> {
  const reessais = options.reessais ?? (options.methode === 'POST' ? 0 : REESSAIS_MAX);
  let tentative = 0;

  for (;;) {
    try {
      return await executer(chemin, options, false);
    } catch (e) {
      // ErreurAuth hérite de ErreurApplicative, pas de ErreurReseau (voir
      // domain/erreurs.ts) : une 401/403 ne peut donc jamais satisfaire ce
      // test, une erreur d'authentification n'est déjà jamais réessayée ici.
      const reessayable = e instanceof ErreurReseau && e.reessayable;
      if (!reessayable || tentative >= reessais || options.signal?.aborted) throw e;
      await attendre(BACKOFF_BASE_MS * 2 ** tentative);
      tentative += 1;
    }
  }
}

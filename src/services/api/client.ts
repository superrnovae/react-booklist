/**
 * Client HTTP unique de l'application (§ Lot 1 : URL de base, en-têtes, délais
 * d'expiration et traitement des erreurs centralisés).
 *
 * L'authentification est branchée via un fournisseur injectable (Lot 4) : le
 * client reste utilisable sans jeton pour les paliers 10 → 16.
 */
import { ErreurAuth, ErreurReseau, ErreurValidation } from '@/domain/erreurs';
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

function fusionnerSignaux(externe: AbortSignal | undefined, delai: AbortSignal): AbortSignal {
  if (!externe) return delai;
  const ctrl = new AbortController();
  const relayer = () => ctrl.abort();
  if (externe.aborted) ctrl.abort();
  externe.addEventListener('abort', relayer);
  delai.addEventListener('abort', relayer);
  return ctrl.signal;
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

  let reponse: Response;
  try {
    reponse = await fetch(`${URL_BASE}${chemin}`, {
      method: methode,
      headers: enteteFinales,
      body: corps !== undefined ? JSON.stringify(corps) : undefined,
      signal: fusionnerSignaux(signal, minuteur.signal),
    });
  } catch (e) {
    if (signal?.aborted) throw e; // annulation volontaire : laisser remonter
    throw new ErreurReseau(
      minuteur.signal.aborted ? "Délai d'expiration dépassé." : 'Réseau indisponible.',
    );
  } finally {
    clearTimeout(idDelai);
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

/** Point d'entrée unique. Gère les réessais 503/réseau avec back-off exponentiel. */
export async function requete<T>(chemin: string, options: OptionsRequete<T> = {}): Promise<T> {
  const reessais = options.reessais ?? REESSAIS_MAX;
  let tentative = 0;

  for (;;) {
    try {
      return await executer(chemin, options, false);
    } catch (e) {
      const reessayable =
        e instanceof ErreurReseau && e.reessayable && !(e instanceof ErreurAuth);
      if (!reessayable || tentative >= reessais || options.signal?.aborted) throw e;
      await attendre(BACKOFF_BASE_MS * 2 ** tentative);
      tentative += 1;
    }
  }
}

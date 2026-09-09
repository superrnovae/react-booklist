/**
 * Session d'authentification — logique hors React (§ Lot 4.1).
 *
 * - le jeton d'accès vit dans une variable mémoire (lisible par l'intercepteur) ;
 * - le jeton de rafraîchissement ne transite JAMAIS par un état React et n'est
 *   jamais journalisé : il vit derrière `stockageSecurise` ;
 * - le rafraîchissement est **single-flight** : un seul refresh part même si dix
 *   requêtes reçoivent un 401 en même temps.
 */
import { rafraichirJeton } from '@/services/api/auth';
import { ecrireSecret, lireSecret, supprimerSecret } from '@/services/stockageSecurise';

const CLE_ACCES = 'booklist.acces';
const CLE_REFRESH = 'booklist.refresh';

let jetonAccesMem: string | null = null;
let refreshEnCours: Promise<boolean> | null = null;
let surExpiration: (() => void) | null = null;

export function jetonAcces(): string | null {
  return jetonAccesMem;
}

/** Enregistre le callback appelé quand le rafraîchissement échoue définitivement. */
export function definirSurExpiration(cb: (() => void) | null): void {
  surExpiration = cb;
}

export async function ouvrirSession(accessToken: string, refreshToken: string): Promise<void> {
  jetonAccesMem = accessToken;
  await ecrireSecret(CLE_ACCES, accessToken);
  await ecrireSecret(CLE_REFRESH, refreshToken);
}

export async function fermerSession(): Promise<void> {
  jetonAccesMem = null;
  await supprimerSecret(CLE_ACCES);
  await supprimerSecret(CLE_REFRESH);
}

/** Restaure le jeton d'accès mémorisé au démarrage (session persistée). */
export async function restaurerAcces(): Promise<string | null> {
  jetonAccesMem = await lireSecret(CLE_ACCES);
  return jetonAccesMem;
}

/**
 * Rafraîchit le jeton d'accès. Single-flight : les appels concurrents partagent
 * la même promesse. Résout `true` si un nouveau jeton est disponible.
 */
export function rafraichir(): Promise<boolean> {
  if (refreshEnCours) return refreshEnCours;

  refreshEnCours = (async () => {
    try {
      const refresh = await lireSecret(CLE_REFRESH);
      if (!refresh) return false;
      const { accessToken } = await rafraichirJeton(refresh);
      jetonAccesMem = accessToken;
      await ecrireSecret(CLE_ACCES, accessToken);
      return true;
    } catch {
      // Le refresh token lui-même est invalide/expiré : session vraiment terminée.
      await fermerSession();
      surExpiration?.();
      return false;
    } finally {
      refreshEnCours = null;
    }
  })();

  return refreshEnCours;
}

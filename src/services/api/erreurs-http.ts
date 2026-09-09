/**
 * Traduction des échecs HTTP bruts en erreurs applicatives discriminées.
 * Centralisé ici pour que le client et l'interception restent lisibles.
 */
import {
    ErreurAuth,
    ErreurConflit,
    ErreurInconnue,
    ErreurReseau,
    ErreurValidation,
    type ErreurApplicative,
} from '@/domain/erreurs';
import { erreurApiSchema } from './schemas';

function corpsErreur(brut: unknown): {
  erreur?: string;
  message?: string;
  champs?: Record<string, string>;
  serveur?: import('@/domain/types').Livre;
  versionAttendue?: number;
} {
  const analyse = erreurApiSchema.safeParse(brut);
  return analyse.success ? analyse.data : {};
}

/** Construit l'erreur applicative correspondant à un statut HTTP et son corps. */
export function erreurDepuisReponse(statut: number, brut: unknown): ErreurApplicative {
  const { erreur, message, champs, serveur, versionAttendue } = corpsErreur(brut);
  const msg = message ?? `Requête refusée (${statut}).`;

  switch (statut) {
    case 401:
      return new ErreurAuth(
        msg,
        erreur === 'jeton_expire' || erreur === 'jeton_invalide' || erreur === 'jeton_absent'
          ? erreur
          : 'jeton_invalide',
        401,
      );
    case 403:
      return new ErreurAuth(msg, 'droits_insuffisants', 403);
    case 409:
      if (serveur && versionAttendue !== undefined) {
        return new ErreurConflit(msg, serveur, versionAttendue);
      }
      return new ErreurReseau(msg, 409, false);
    case 413:
      return new ErreurReseau(msg, 413, false);
    case 415:
      return new ErreurValidation(msg, champs ?? {});
    case 422:
      return new ErreurValidation(msg, champs ?? {});
    case 503:
      return new ErreurReseau(msg, 503, true);
    default:
      if (statut >= 500) return new ErreurReseau(msg, statut, true);
      if (statut === 400 || statut === 404) return new ErreurReseau(msg, statut, false);
      return new ErreurInconnue(msg);
  }
}

/**
 * Endpoints d'authentification (Lot 4). Le rafraîchissement ne dépend d'aucun
 * état React : il prend le refresh token en argument et renvoie un access token.
 */
import { requete } from './client';
import {
    connexionSchema,
    profilSchema,
    rafraichissementSchema,
    type ReponseConnexion,
} from './schemas';

export function connexion(email: string, motDePasse: string): Promise<ReponseConnexion> {
  return requete('/auth/login', {
    methode: 'POST',
    corps: { email, motDePasse },
    schema: connexionSchema,
    reessais: 0,
  });
}

export function rafraichirJeton(refreshToken: string): Promise<{ accessToken: string }> {
  return requete('/auth/refresh', {
    methode: 'POST',
    corps: { refreshToken },
    schema: rafraichissementSchema,
    reessais: 0,
  });
}

export function profil(signal?: AbortSignal) {
  return requete('/me', { schema: profilSchema, signal });
}

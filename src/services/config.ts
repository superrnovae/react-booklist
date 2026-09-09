/**
 * Configuration technique de la couche réseau. Seul endroit où vit l'URL de base.
 * Surchargée par la variable publique `EXPO_PUBLIC_API_URL` (aucun secret ici).
 */
import { Platform } from 'react-native';

function urlParDefaut(): string {
  // Sur navigateur et web, l'API tourne en local sur le même hôte.
  if (Platform.OS === 'web' && typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:3000`;
  }
  return 'http://localhost:3000';
}

export const URL_BASE: string = process.env.EXPO_PUBLIC_API_URL ?? urlParDefaut();

/** Délai d'expiration par défaut d'une requête HTTP (mode dégradé compris). */
export const DELAI_EXPIRATION_MS = 8000;

/** Réessais automatiques sur 503/réseau, avec back-off exponentiel. */
export const REESSAIS_MAX = 2;
export const BACKOFF_BASE_MS = 400;

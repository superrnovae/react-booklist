/**
 * Options de tri et de filtrage, et normalisation des paramètres de requête.
 * Purement métier : partagé entre l'UI (menus) et services (construction d'URL).
 */
import type { ChampTri, RequeteLivres, SensTri, StatutFiltre } from './types';

export const CHAMPS_TRI: readonly ChampTri[] = ['titre', 'auteur', 'annee', 'note', 'updatedAt'];
export const SENS_TRI: readonly SensTri[] = ['asc', 'desc'];
export const STATUTS: readonly StatutFiltre[] = ['lu', 'nonlu'];

export const LIMITE_DEFAUT = 20;
export const LIMITE_MAX = 100;

export function estChampTri(v: unknown): v is ChampTri {
  return typeof v === 'string' && (CHAMPS_TRI as readonly string[]).includes(v);
}

export function estSensTri(v: unknown): v is SensTri {
  return v === 'asc' || v === 'desc';
}

/** Applique les valeurs par défaut et borne les entrées d'une requête. */
export function normaliserRequete(partiel: Partial<RequeteLivres>): RequeteLivres {
  const page = Math.max(1, Math.trunc(partiel.page ?? 1));
  const limitBrute = Math.trunc(partiel.limit ?? LIMITE_DEFAUT);
  const limit = Math.min(LIMITE_MAX, Math.max(1, limitBrute));
  const q = partiel.q?.trim() ? partiel.q.trim() : undefined;

  return {
    page,
    limit,
    q,
    status: partiel.status,
    favori: partiel.favori,
    sort: estChampTri(partiel.sort) ? partiel.sort : 'titre',
    order: estSensTri(partiel.order) ? partiel.order : 'asc',
  };
}

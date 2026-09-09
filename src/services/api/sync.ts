/**
 * Endpoint de synchronisation par lot.
 */
import type { Mutation } from '@/domain/mutations';
import type { ReponseSync } from '@/domain/sync';
import { requete } from './client';
import { corpsLivre } from './livres';
import { reponseSyncSchema } from './schemas';

/** Sérialise une mutation locale vers la charge utile attendue par `POST /sync`. */
function versCharge(m: Mutation): Record<string, unknown> {
  if (m.type === 'create') {
    const { id: _local, ...champs } = m.livre;
    return { id: m.id, type: 'create', livre: corpsLivre(champs) };
  }
  if (m.type === 'update') {
    return { id: m.id, type: 'update', baseVersion: m.baseVersion, livre: corpsLivre(m.livre) };
  }
  return { id: m.id, type: 'delete', livreId: m.livreId, baseVersion: m.baseVersion };
}

export function synchroniser(mutations: Mutation[]): Promise<ReponseSync> {
  return requete('/sync', {
    methode: 'POST',
    corps: { mutations: mutations.map(versCharge) },
    schema: reponseSyncSchema,
    // La synchronisation gère elle-même conflits/erreurs : pas de réessai aveugle.
    reessais: 0,
  });
}

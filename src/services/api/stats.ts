/**
 * Endpoint statistiques du fonds.
 */
import type { Stats } from '@/domain/types';
import { requete } from './client';
import { statsSchema } from './schemas';

export function obtenirStats(signal?: AbortSignal): Promise<Stats> {
  return requete('/stats', { schema: statsSchema, signal });
}

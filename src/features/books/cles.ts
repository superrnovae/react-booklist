/**
 * Clés de cache structurées pour TanStack Query (§ Lot 1 : clés structurées,
 * invalidation après mutation).
 */
import type { RequeteLivres } from '@/domain/types';

export const clesLivres = {
  tout: ['livres'] as const,
  listes: () => [...clesLivres.tout, 'liste'] as const,
  liste: (req: RequeteLivres) => [...clesLivres.listes(), req] as const,
  details: () => [...clesLivres.tout, 'detail'] as const,
  detail: (id: string) => [...clesLivres.details(), id] as const,
  notes: (livreId: string) => [...clesLivres.tout, 'notes', livreId] as const,
};

export const clesStats = { tout: ['stats'] as const };

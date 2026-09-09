/**
 * Hook des statistiques du fonds. Le cache persistant permet la consultation
 * hors ligne (§ Lot 4.4) ; `dataUpdatedAt` fournit la date de dernière mise à jour.
 */
import { obtenirStats } from '@/services/api/stats';
import { useQuery } from '@tanstack/react-query';

export const clesStats = { tout: ['stats'] as const };

export function useStats() {
  return useQuery({
    queryKey: clesStats.tout,
    queryFn: ({ signal }) => obtenirStats(signal),
    staleTime: 60_000,
  });
}

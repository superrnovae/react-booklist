/**
 * Hook d'enrichissement OpenLibrary : cache (staleTime long), annulation via
 * signal, dégradation silencieuse. Ne relance pas en boucle en cas d'échec.
 */
import { enrichirDepuisTitre } from '@/services/openlibrary';
import { useQuery } from '@tanstack/react-query';

export function useEnrichissement(titre: string) {
  return useQuery({
    queryKey: ['openlibrary', titre],
    queryFn: ({ signal }) => enrichirDepuisTitre(titre, signal),
    enabled: titre.trim().length > 0,
    staleTime: 60 * 60_000,
    gcTime: 60 * 60_000,
    retry: false,
  });
}

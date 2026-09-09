/**
 * Hooks de lecture des ouvrages (état serveur via TanStack Query).
 * La pagination serveur est consommée en défilement infini : on ne charge
 * jamais les 500 ouvrages d'un coup.
 */
import { normaliserRequete } from '@/domain/tri';
import type { Livre, RequeteLivres } from '@/domain/types';
import { listerLivres, obtenirLivre } from '@/services/api/livres';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { clesLivres } from './cles';

export type FiltresListe = Omit<RequeteLivres, 'page'>;

export function useLivresInfinis(filtres: Partial<FiltresListe>) {
  const base = normaliserRequete(filtres);

  const requete = useInfiniteQuery({
    queryKey: clesLivres.liste({ ...base, page: 1 }),
    queryFn: ({ pageParam, signal }) =>
      listerLivres({ ...base, page: pageParam }, signal),
    initialPageParam: 1,
    getNextPageParam: (derniere) =>
      derniere.page < derniere.totalPages ? derniere.page + 1 : undefined,
  });

  const livres: Livre[] = requete.data?.pages.flatMap((p) => p.items) ?? [];
  const total = requete.data?.pages[0]?.total ?? 0;

  return { ...requete, livres, total };
}

export function useLivre(id: string) {
  return useQuery({
    queryKey: clesLivres.detail(id),
    queryFn: ({ signal }) => obtenirLivre(id, signal),
    enabled: id.length > 0,
  });
}

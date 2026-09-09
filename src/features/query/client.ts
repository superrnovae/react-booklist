/**
 * Configuration de TanStack Query (état serveur). Le client HTTP gère déjà les
 * réessais et délais : on désactive le retry de Query pour ne pas les cumuler.
 */
import { estErreurApplicative } from '@/domain/erreurs';
import { QueryClient } from '@tanstack/react-query';

export function creerQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 30_000,
        gcTime: 5 * 60_000,
        refetchOnWindowFocus: false,
      },
      mutations: {
        retry: false,
        onError: (e) => {
          if (!estErreurApplicative(e)) console.error('[mutation]', String(e));
        },
      },
    },
  });
}

export const queryClient = creerQueryClient();

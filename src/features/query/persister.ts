/**
 * Persistance du cache TanStack Query (§ Lot 4 : au démarrage, afficher
 * immédiatement les données connues, puis revalider). Adossée à AsyncStorage
 * (localStorage sur navigateur), écriture throttlée pour ne pas saturer le stockage.
 */
import { AsyncStorage } from '@/services/stockage';
import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

const CLE = 'booklist.query-cache';

export function creerPersister(): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      try {
        await AsyncStorage.setItem(CLE, JSON.stringify(client));
      } catch {
        // Stockage plein/indisponible : la persistance est un confort, pas un dû.
      }
    },
    restoreClient: async () => {
      try {
        const brut = await AsyncStorage.getItem(CLE);
        return brut ? (JSON.parse(brut) as PersistedClient) : undefined;
      } catch {
        return undefined;
      }
    },
    removeClient: async () => {
      await AsyncStorage.removeItem(CLE);
    },
  };
}

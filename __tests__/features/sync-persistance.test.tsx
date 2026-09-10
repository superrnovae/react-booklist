/**
 * BL-02 : un conflit non arbitré doit survivre à un rechargement complet de
 * la page. Simulé ici en démontant le fournisseur puis en relisant la file
 * depuis le stockage persisté, sans réutiliser l'état React précédent.
 */
jest.mock('@/services/api/sync', () => ({
  synchroniser: jest.fn(),
}));
jest.mock('@/services/reseau', () => ({
  lireEtatReseau: jest.fn(async () => true),
  surChangementReseau: jest.fn(() => () => {}),
}));

import { act, renderHook, waitFor } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type { Livre } from '@/domain/types';
import type { Mutation } from '@/domain/mutations';
import { FournisseurSync, useSync } from '@/features/sync/SyncProvider';
import { chargerFile, sauverFile } from '@/features/sync/file';
import { AsyncStorage } from '@/services/stockage';
import { synchroniser } from '@/services/api/sync';
import { creerClientTest, EnveloppeQuery } from '../utils/rendu';

const synchroniserMock = synchroniser as jest.MockedFunction<typeof synchroniser>;

function livre(surcharge: Partial<Livre> = {}): Livre {
  return {
    id: 'l1',
    titre: 'Dune',
    auteur: 'Frank Herbert',
    editeur: 'Robert Laffont',
    annee: 1965,
    lu: false,
    favori: false,
    note: null,
    couverture: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    version: 1,
    ...surcharge,
  };
}

const mutationModifiee: Mutation = {
  id: 'm1',
  type: 'update',
  horodatage: '2026-01-01T00:00:00.000Z',
  livre: livre({ titre: 'Dune (modifié en réserve)' }),
  baseVersion: 1,
};

function enveloppe() {
  const client = creerClientTest();
  return ({ children }: { children: ReactNode }) => (
    <EnveloppeQuery client={client}>
      <FournisseurSync>{children}</FournisseurSync>
    </EnveloppeQuery>
  );
}

beforeEach(async () => {
  synchroniserMock.mockReset();
  await AsyncStorage.clear();
});

describe('FournisseurSync — persistance des conflits (BL-02)', () => {
  it('un conflit non arbitré survit à un rechargement complet de la page', async () => {
    await sauverFile([mutationModifiee]);

    synchroniserMock.mockResolvedValue({
      resultats: [
        {
          id: 'm1',
          statut: 'conflit',
          serveur: livre({ version: 2, titre: 'Dune (édité côté serveur)' }),
          versionAttendue: 2,
        },
      ],
      resume: { total: 1, ok: 0, conflits: 1, erreurs: 0 },
      serveurLe: '2026-01-01T00:05:00.000Z',
    });

    const { result, unmount } = await renderHook(() => useSync(), { wrapper: enveloppe() });
    await waitFor(() => expect(result.current.file).toHaveLength(1));

    await act(async () => {
      await result.current.synchroniser();
    });
    expect(result.current.conflits).toHaveLength(1);
    expect(result.current.conflits[0].serveur.titre).toBe('Dune (édité côté serveur)');

    // Rechargement complet de la page : démonter, puis relire depuis le
    // stockage persisté — pas depuis l'état React qui vient de disparaître.
    unmount();
    const relue = await chargerFile();
    expect(relue).toHaveLength(1);
    expect(relue[0].conflit?.serveur.titre).toBe('Dune (édité côté serveur)');

    const { result: apresRechargement, unmount: demonterApres } = await renderHook(() => useSync(), {
      wrapper: enveloppe(),
    });
    await waitFor(() => expect(apresRechargement.current.conflits).toHaveLength(1));
    expect(apresRechargement.current.conflits[0].mutation.id).toBe('m1');

    // Une mutation en conflit ne doit pas être renvoyée à /sync en boucle.
    synchroniserMock.mockClear();
    await act(async () => {
      await apresRechargement.current.synchroniser();
    });
    expect(synchroniserMock).not.toHaveBeenCalled();
    demonterApres();
  });

  it('résoudre un conflit le retire de la file persistée (pas seulement de l’état React)', async () => {
    const mutationEnConflit: Mutation = {
      ...mutationModifiee,
      conflit: { serveur: livre({ version: 2 }), versionAttendue: 2 },
    };
    await sauverFile([mutationEnConflit]);

    const { result } = await renderHook(() => useSync(), { wrapper: enveloppe() });
    await waitFor(() => expect(result.current.conflits).toHaveLength(1));

    await act(async () => {
      result.current.resoudreConflit('m1');
    });
    await waitFor(() => expect(result.current.conflits).toHaveLength(0));

    const relue = await chargerFile();
    expect(relue).toHaveLength(0);
  });
});

/**
 * BL-05 : cœur, statut de lecture et note doivent passer par la file hors
 * ligne comme le reste des écritures, pas appeler l'API directement.
 */
jest.mock('@/features/sync/SyncProvider', () => ({
  useSync: jest.fn(),
}));
jest.mock('@/services/api/livres', () => ({
  modifierLivre: jest.fn(),
}));

import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import type { Livre } from '@/domain/types';
import { useBasculeChamp, useNoterLivre } from '@/features/books/mutations';
import { useSync } from '@/features/sync/SyncProvider';
import { modifierLivre } from '@/services/api/livres';
import { creerClientTest, EnveloppeQuery } from '../utils/rendu';

const useSyncMock = useSync as jest.MockedFunction<typeof useSync>;
const modifierLivreMock = modifierLivre as jest.MockedFunction<typeof modifierLivre>;

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
    version: 3,
    ...surcharge,
  };
}

function contexteSync(surcharge: Partial<ReturnType<typeof useSync>>) {
  return {
    enLigne: true,
    file: [],
    conflits: [],
    enfiler: jest.fn(),
    synchroniser: jest.fn(),
    resoudreConflit: jest.fn(),
    ...surcharge,
  };
}

function wrapper() {
  const client = creerClientTest();
  return ({ children }: { children: ReactNode }) => (
    <EnveloppeQuery client={client}>{children}</EnveloppeQuery>
  );
}

beforeEach(() => {
  modifierLivreMock.mockReset();
});

describe('useBasculeChamp hors ligne (BL-05)', () => {
  it('met la bascule en file plutôt que d’appeler l’API directement', async () => {
    const enfiler = jest.fn().mockResolvedValue(undefined);
    useSyncMock.mockReturnValue(contexteSync({ enLigne: false, enfiler }));

    const l = livre({ favori: false });
    const { result } = await renderHook(() => useBasculeChamp(l, 'favori'), { wrapper: wrapper() });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(modifierLivreMock).not.toHaveBeenCalled();
    expect(enfiler).toHaveBeenCalledTimes(1);
    const mutation = enfiler.mock.calls[0][0];
    expect(mutation.type).toBe('update');
    expect(mutation.livre.favori).toBe(true);
    expect(mutation.baseVersion).toBe(3);
  });

  it('en ligne, continue d’appeler l’API directement (pas de régression)', async () => {
    const enfiler = jest.fn();
    useSyncMock.mockReturnValue(contexteSync({ enLigne: true, enfiler }));
    modifierLivreMock.mockResolvedValue(livre({ favori: true }));

    const l = livre({ favori: false });
    const { result } = await renderHook(() => useBasculeChamp(l, 'favori'), { wrapper: wrapper() });

    await act(async () => {
      await result.current.mutateAsync();
    });

    expect(modifierLivreMock).toHaveBeenCalledWith('l1', { favori: true }, 3);
    expect(enfiler).not.toHaveBeenCalled();
  });
});

describe('useNoterLivre hors ligne (BL-05)', () => {
  it('met l’attribution de note en file plutôt que d’appeler l’API directement', async () => {
    const enfiler = jest.fn().mockResolvedValue(undefined);
    useSyncMock.mockReturnValue(contexteSync({ enLigne: false, enfiler }));

    const l = livre({ note: null });
    const { result } = await renderHook(() => useNoterLivre(l), { wrapper: wrapper() });

    await act(async () => {
      await result.current.mutateAsync(4);
    });

    expect(modifierLivreMock).not.toHaveBeenCalled();
    expect(enfiler).toHaveBeenCalledTimes(1);
    expect(enfiler.mock.calls[0][0].livre.note).toBe(4);
  });
});

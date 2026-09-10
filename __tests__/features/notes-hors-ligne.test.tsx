/**
 * BL-05b : la rédaction d'une note de lecture hors ligne doit être mise en
 * file (comme le reste des écritures), pas perdue par un appel API direct
 * qui échoue. Distincte de BL-05a (favori/lu/note) : une note n'est pas une
 * mutation de Livre et POST /sync ne sait pas la porter — voir domain/notes.ts.
 */
jest.mock('@/features/sync/SyncProvider', () => ({
  useSync: jest.fn(),
}));
jest.mock('@/services/api/livres', () => ({
  ajouterNote: jest.fn(),
  listerNotes: jest.fn(),
  supprimerNote: jest.fn(),
}));

import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';

import { useAjouterNote } from '@/features/notes/hooks';
import { useSync } from '@/features/sync/SyncProvider';
import { ajouterNote } from '@/services/api/livres';
import { creerClientTest, EnveloppeQuery } from '../utils/rendu';

const useSyncMock = useSync as jest.MockedFunction<typeof useSync>;
const ajouterNoteMock = ajouterNote as jest.MockedFunction<typeof ajouterNote>;

function contexteSync(surcharge: Partial<ReturnType<typeof useSync>>) {
  return {
    enLigne: true,
    file: [],
    fileNotes: [],
    conflits: [],
    enfiler: jest.fn(),
    enfilerNote: jest.fn(),
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
  ajouterNoteMock.mockReset();
});

describe('useAjouterNote hors ligne (BL-05b)', () => {
  it('met la note en file plutôt que d’appeler l’API directement', async () => {
    const enfilerNote = jest.fn().mockResolvedValue(undefined);
    useSyncMock.mockReturnValue(contexteSync({ enLigne: false, enfilerNote }));

    const { result } = await renderHook(() => useAjouterNote('l1'), { wrapper: wrapper() });

    await act(async () => {
      await result.current.mutateAsync('Une lecture marquante.');
    });

    expect(ajouterNoteMock).not.toHaveBeenCalled();
    expect(enfilerNote).toHaveBeenCalledTimes(1);
    const mutation = enfilerNote.mock.calls[0][0];
    expect(mutation.type).toBe('note-ajout');
    expect(mutation.livreId).toBe('l1');
    expect(mutation.contenu).toBe('Une lecture marquante.');
  });

  it('en ligne, continue d’appeler l’API directement (pas de régression)', async () => {
    const enfilerNote = jest.fn();
    useSyncMock.mockReturnValue(contexteSync({ enLigne: true, enfilerNote }));
    ajouterNoteMock.mockResolvedValue({
      id: 'n1',
      livreId: 'l1',
      contenu: 'Une lecture marquante.',
      createdAt: '2026-01-01T00:00:00.000Z',
    });

    const { result } = await renderHook(() => useAjouterNote('l1'), { wrapper: wrapper() });

    await act(async () => {
      await result.current.mutateAsync('Une lecture marquante.');
    });

    expect(ajouterNoteMock).toHaveBeenCalledWith('l1', 'Une lecture marquante.');
    expect(enfilerNote).not.toHaveBeenCalled();
  });
});

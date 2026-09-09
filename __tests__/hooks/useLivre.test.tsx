import { renderHook, waitFor } from '@testing-library/react-native';

import { useLivre } from '@/features/books/queries';
import { creerClientTest, EnveloppeQuery } from '../utils/rendu';
import type { Livre } from '@/domain/types';

const livre: Livre = {
  id: 'l1',
  titre: 'Le Hobbit',
  auteur: 'J.R.R. Tolkien',
  editeur: 'Christian Bourgois',
  annee: 1937,
  lu: true,
  favori: false,
  note: 5,
  couverture: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  version: 2,
};

function reponse(status: number, corps: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: () => Promise.resolve(JSON.stringify(corps)),
  } as unknown as Response;
}

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

function enveloppe() {
  const client = creerClientTest();
  return ({ children }: { children: React.ReactNode }) => (
    <EnveloppeQuery client={client}>{children}</EnveloppeQuery>
  );
}

describe('useLivre (API simulée par mock de fetch)', () => {
  it('récupère et valide un ouvrage', async () => {
    fetchMock.mockResolvedValue(reponse(200, livre));
    const { result } = await renderHook(() => useLivre('l1'), { wrapper: enveloppe() });
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data?.titre).toBe('Le Hobbit');
    expect(result.current.data?.version).toBe(2);
  });

  it('remonte une ErreurReseau 404 pour un ouvrage inconnu', async () => {
    fetchMock.mockResolvedValue(reponse(404, { erreur: 'introuvable', message: 'Livre inconnu.' }));
    const { result } = await renderHook(() => useLivre('inconnu'), { wrapper: enveloppe() });
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect((result.current.error as { statut?: number }).statut).toBe(404);
  });
});

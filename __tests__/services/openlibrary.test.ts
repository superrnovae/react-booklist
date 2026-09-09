import { enrichirDepuisTitre } from '@/services/openlibrary';

function reponse(ok: boolean, corps: unknown): Response {
  return {
    ok,
    status: ok ? 200 : 500,
    json: () => Promise.resolve(corps),
  } as unknown as Response;
}

const fetchMock = jest.fn();
beforeEach(() => {
  fetchMock.mockReset();
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

describe('enrichirDepuisTitre (OpenLibrary)', () => {
  it('extrait le nombre d\'éditions et la première année', async () => {
    fetchMock.mockResolvedValue(reponse(true, { numFound: 3, docs: [{ first_publish_year: 1937 }] }));
    await expect(enrichirDepuisTitre('Le Hobbit')).resolves.toEqual({ editions: 3, premiereAnnee: 1937 });
  });

  it('traite « zéro édition » comme une réponse normale', async () => {
    fetchMock.mockResolvedValue(reponse(true, { numFound: 0, docs: [] }));
    await expect(enrichirDepuisTitre('Titre bâclé')).resolves.toEqual({ editions: 0, premiereAnnee: null });
  });

  it('dégrade en silence (null) si OpenLibrary échoue', async () => {
    fetchMock.mockResolvedValue(reponse(false, {}));
    await expect(enrichirDepuisTitre('X')).resolves.toBeNull();
  });

  it('dégrade en silence (null) sur erreur réseau', async () => {
    fetchMock.mockRejectedValue(new Error('offline'));
    await expect(enrichirDepuisTitre('X')).resolves.toBeNull();
  });
});

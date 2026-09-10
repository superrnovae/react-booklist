import { ErreurReseau } from '@/domain/erreurs';
import { definirFournisseurAuth, requete, type FournisseurAuth } from '@/services/api/client';
import { z } from 'zod';

const schema = z.object({ ok: z.boolean() });

function reponse(status: number, corps: unknown): Response {
  return {
    status,
    ok: status >= 200 && status < 300,
    text: () => Promise.resolve(corps === undefined ? '' : JSON.stringify(corps)),
  } as unknown as Response;
}

const fetchMock = jest.fn();

beforeEach(() => {
  fetchMock.mockReset();
  definirFournisseurAuth(null);
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

afterEach(() => definirFournisseurAuth(null));

describe('requete', () => {
  it('valide la réponse avec le schéma zod', async () => {
    fetchMock.mockResolvedValueOnce(reponse(200, { ok: true }));
    await expect(requete('/x', { schema })).resolves.toEqual({ ok: true });
  });

  it('rejette une réponse au schéma invalide (ErreurValidation)', async () => {
    fetchMock.mockResolvedValueOnce(reponse(200, { ok: 'oui' }));
    await expect(requete('/x', { schema })).rejects.toMatchObject({ genre: 'validation' });
  });

  it('réessaie sur 503 puis réussit', async () => {
    fetchMock
      .mockResolvedValueOnce(reponse(503, { erreur: 'service_indisponible' }))
      .mockResolvedValueOnce(reponse(200, { ok: true }));
    await expect(requete('/x', { schema, reessais: 1 })).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('ne réessaie pas une 422', async () => {
    fetchMock.mockResolvedValue(reponse(422, { erreur: 'validation', champs: { titre: 'x' } }));
    await expect(requete('/x', { schema })).rejects.toMatchObject({ genre: 'validation' });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('injecte le jeton d\'accès dans l\'en-tête Authorization', async () => {
    const fournisseur: FournisseurAuth = {
      jetonAcces: () => 'tok-123',
      rafraichir: jest.fn().mockResolvedValue(false),
    };
    definirFournisseurAuth(fournisseur);
    fetchMock.mockResolvedValueOnce(reponse(200, { ok: true }));
    await requete('/x', { schema });
    const entetes = fetchMock.mock.calls[0][1].headers as Record<string, string>;
    expect(entetes.Authorization).toBe('Bearer tok-123');
  });

  it('sur 401 : un seul rafraîchissement puis rejeu de la requête', async () => {
    const rafraichir = jest.fn().mockResolvedValue(true);
    definirFournisseurAuth({ jetonAcces: () => 'expire', rafraichir });
    fetchMock
      .mockResolvedValueOnce(reponse(401, { erreur: 'jeton_expire' }))
      .mockResolvedValueOnce(reponse(200, { ok: true }));
    await expect(requete('/x', { schema })).resolves.toEqual({ ok: true });
    expect(rafraichir).toHaveBeenCalledTimes(1);
  });

  it('mappe un échec fetch en ErreurReseau', async () => {
    fetchMock.mockRejectedValue(new TypeError('Network down'));
    await expect(requete('/x', { schema, reessais: 0 })).rejects.toBeInstanceOf(ErreurReseau);
  });

  it('retire les écouteurs d’abandon une fois la requête réglée (BL-16)', async () => {
    fetchMock.mockResolvedValueOnce(reponse(200, { ok: true }));
    const controleur = new AbortController();
    const retirerSpy = jest.spyOn(AbortSignal.prototype, 'removeEventListener');

    await requete('/x', { schema, signal: controleur.signal });

    // Un retrait pour le signal externe, un pour celui du minuteur interne —
    // sans ça, les deux restent attachés indéfiniment pour toute requête qui
    // n'abandonne jamais (le cas le plus fréquent).
    expect(retirerSpy.mock.calls.filter(([type]) => type === 'abort').length).toBeGreaterThanOrEqual(2);
    retirerSpy.mockRestore();
  });
});

import type { MutationCreation, MutationMaj } from '@/domain/mutations';
import type { Livre } from '@/domain/types';
import { ajouterNote, creerLivre, listerLivres, modifierLivre, supprimerLivre } from '@/services/api/livres';
import { synchroniser } from '@/services/api/sync';

const livre: Livre = {
  id: 'l1',
  titre: 'T',
  auteur: 'A',
  editeur: 'E',
  annee: 2020,
  lu: false,
  favori: false,
  note: null,
  couverture: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  version: 3,
};

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
  globalThis.fetch = fetchMock as unknown as typeof fetch;
});

function urlAppelee(): string {
  return String(fetchMock.mock.calls[0][0]);
}
function optionsAppelees(): { method?: string; headers?: Record<string, string>; body?: string } {
  return fetchMock.mock.calls[0][1];
}

describe('endpoints livres', () => {
  it('listerLivres construit la chaîne de requête serveur (pas de filtrage client)', async () => {
    fetchMock.mockResolvedValue(
      reponse(200, { items: [livre], page: 2, limit: 20, total: 40, totalPages: 2 }),
    );
    const page = await listerLivres({
      page: 2,
      limit: 20,
      sort: 'annee',
      order: 'desc',
      q: 'tolkien',
      status: 'lu',
      favori: true,
    });
    const url = urlAppelee();
    expect(url).toContain('/books?');
    expect(url).toContain('page=2');
    expect(url).toContain('sort=annee');
    expect(url).toContain('order=desc');
    expect(url).toContain('q=tolkien');
    expect(url).toContain('status=lu');
    expect(url).toContain('favori=true');
    expect(page.items[0].titre).toBe('T');
  });

  it('creerLivre poste la saisie et valide la réponse', async () => {
    fetchMock.mockResolvedValue(reponse(201, livre));
    await creerLivre({
      titre: 'T',
      auteur: 'A',
      editeur: 'E',
      annee: 2020,
      lu: false,
      favori: false,
      note: null,
      couverture: null,
    });
    expect(optionsAppelees().method).toBe('POST');
  });

  it('modifierLivre envoie l\'en-tête If-Match pour la détection de conflit', async () => {
    fetchMock.mockResolvedValue(reponse(200, { ...livre, favori: true, version: 4 }));
    await modifierLivre('l1', { favori: true }, 3);
    const opt = optionsAppelees();
    expect(opt.method).toBe('PATCH');
    expect(opt.headers?.['If-Match']).toBe('3');
  });

  it('supprimerLivre appelle DELETE et tolère un 204 sans corps', async () => {
    fetchMock.mockResolvedValue(reponse(204, undefined));
    await expect(supprimerLivre('l1')).resolves.toBeUndefined();
    expect(optionsAppelees().method).toBe('DELETE');
  });

  it('ajouterNote poste le contenu', async () => {
    fetchMock.mockResolvedValue(
      reponse(201, { id: 'n1', livreId: 'l1', contenu: 'super', createdAt: '2026-01-01T00:00:00.000Z' }),
    );
    const note = await ajouterNote('l1', 'super');
    expect(note.contenu).toBe('super');
  });
});

describe('synchroniser', () => {
  it('sérialise les mutations et retire l\'id local sur une création', async () => {
    fetchMock.mockResolvedValue(
      reponse(200, {
        resultats: [{ id: 'm1', statut: 'ok', livre }],
        resume: { total: 1, ok: 1, conflits: 0, erreurs: 0 },
        serveurLe: '2026-01-05T00:00:00.000Z',
      }),
    );
    const creation: MutationCreation = {
      id: 'm1',
      type: 'create',
      horodatage: '2026-01-01T00:00:00.000Z',
      livre: {
        id: 'local-1',
        titre: 'T',
        auteur: 'A',
        editeur: '',
        annee: 2020,
        lu: false,
        favori: false,
        note: null,
        couverture: null,
      },
    };
    const maj: MutationMaj = {
      id: 'm2',
      type: 'update',
      horodatage: '2026-01-02T00:00:00.000Z',
      livre,
      baseVersion: 3,
    };
    await synchroniser([creation, maj]);
    const corps = JSON.parse(optionsAppelees().body as string);
    expect(corps.mutations[0].type).toBe('create');
    expect(corps.mutations[0].livre.id).toBeUndefined();
    expect(corps.mutations[1].baseVersion).toBe(3);
  });
});

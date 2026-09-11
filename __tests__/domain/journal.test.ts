import { ajouterEntree, depuisErreur, filtrerParNiveau, TAILLE_MAX_JOURNAL, type EntreeJournal } from '@/domain/journal';

const entree = (over: Partial<EntreeJournal> = {}): EntreeJournal => ({
  id: 'e1',
  horodatage: '2026-01-01T00:00:00.000Z',
  niveau: 'info',
  message: 'test',
  ...over,
});

describe('ajouterEntree', () => {
  it('ajoute une entrée à la suite du journal', () => {
    const j = ajouterEntree([], entree());
    expect(j).toHaveLength(1);
    expect(j[0].message).toBe('test');
  });

  it('conserve uniquement les TAILLE_MAX_JOURNAL entrées les plus récentes', () => {
    let j: EntreeJournal[] = [];
    for (let i = 0; i < TAILLE_MAX_JOURNAL + 10; i += 1) {
      j = ajouterEntree(j, entree({ id: `e${i}`, message: `msg${i}` }));
    }
    expect(j).toHaveLength(TAILLE_MAX_JOURNAL);
    // Les plus anciennes (e0..e9) ont été évincées, la plus récente est conservée.
    expect(j[0].id).toBe('e10');
    expect(j[j.length - 1].id).toBe(`e${TAILLE_MAX_JOURNAL + 9}`);
  });
});

describe('filtrerParNiveau', () => {
  const journal = [
    entree({ id: 'a', niveau: 'info' }),
    entree({ id: 'b', niveau: 'avertissement' }),
    entree({ id: 'c', niveau: 'erreur' }),
    entree({ id: 'd', niveau: 'erreur' }),
  ];

  it("renvoie tout le journal pour 'tous'", () => {
    expect(filtrerParNiveau(journal, 'tous')).toHaveLength(4);
  });

  it('filtre sur un seul niveau', () => {
    const erreurs = filtrerParNiveau(journal, 'erreur');
    expect(erreurs.map((e) => e.id)).toEqual(['c', 'd']);
  });
});

describe('depuisErreur', () => {
  it('extrait nom, message et pile d\'une instance Error', () => {
    const e = new TypeError('mauvais type');
    const r = depuisErreur(e);
    expect(r.nom).toBe('TypeError');
    expect(r.message).toBe('mauvais type');
    expect(r.pile).toBeDefined();
  });

  it("convertit une valeur rejetée non-Error (cas réel d'un unhandledrejection) en chaîne", () => {
    expect(depuisErreur('chaîne brute')).toEqual({ nom: 'Inconnue', message: 'chaîne brute' });
    expect(depuisErreur(42)).toEqual({ nom: 'Inconnue', message: '42' });
  });
});

import type { Mutation, MutationCreation, MutationMaj, MutationSuppression } from '@/domain/mutations';
import { estLivreLocal, fusionnerFile, livreVise } from '@/domain/mutations';
import type { Livre } from '@/domain/types';

const livre = (over: Partial<Livre> = {}): Livre => ({
  id: 'serveur-1',
  titre: 'Titre',
  auteur: 'Auteur',
  editeur: 'Éditeur',
  annee: 2020,
  lu: false,
  favori: false,
  note: null,
  couverture: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  version: 3,
  ...over,
});

const creation = (id: string, livreId: string): MutationCreation => ({
  id,
  type: 'create',
  horodatage: '2026-01-01T00:00:00.000Z',
  livre: {
    id: livreId,
    titre: 'Local',
    auteur: 'Auteur',
    editeur: '',
    annee: 2021,
    lu: false,
    favori: false,
    note: null,
    couverture: null,
  },
});

const maj = (id: string, l: Livre): MutationMaj => ({
  id,
  type: 'update',
  horodatage: '2026-01-02T00:00:00.000Z',
  livre: l,
  baseVersion: l.version,
});

const suppression = (id: string, livreId: string, baseVersion: number): MutationSuppression => ({
  id,
  type: 'delete',
  horodatage: '2026-01-03T00:00:00.000Z',
  livreId,
  baseVersion,
});

describe('livreVise', () => {
  it('résout l\'id du livre pour chaque type de mutation', () => {
    expect(livreVise(creation('m1', 'l1'))).toBe('l1');
    expect(livreVise(maj('m2', livre({ id: 'l2' })))).toBe('l2');
    expect(livreVise(suppression('m3', 'l3', 1))).toBe('l3');
  });
});

describe('fusionnerFile', () => {
  it('création puis suppression hors ligne : la file redevient vide', () => {
    const f1 = fusionnerFile([], creation('m1', 'local-1'));
    const f2 = fusionnerFile(f1, suppression('m2', 'local-1', 1));
    expect(f2).toHaveLength(0);
  });

  it('création puis modification : reste un seul create fusionné', () => {
    const f1 = fusionnerFile([], creation('m1', 'local-1'));
    const majLocale = maj('m2', livre({ id: 'local-1', titre: 'Nouveau titre', version: 1 }));
    const f2 = fusionnerFile(f1, majLocale);
    expect(f2).toHaveLength(1);
    const seule = f2[0] as MutationCreation;
    expect(seule.type).toBe('create');
    expect(seule.livre.titre).toBe('Nouveau titre');
    expect(seule.livre.id).toBe('local-1');
  });

  it('deux modifications successives : une seule mutation update (dernier état)', () => {
    const f1 = fusionnerFile([], maj('m1', livre({ titre: 'V1' })));
    const f2 = fusionnerFile(f1, maj('m2', livre({ titre: 'V2' })));
    expect(f2).toHaveLength(1);
    expect((f2[0] as MutationMaj).livre.titre).toBe('V2');
    expect(f2[0].id).toBe('m2');
  });

  it('modification puis suppression : la suppression l\'emporte', () => {
    const f1 = fusionnerFile([], maj('m1', livre({ id: 'serveur-1' })));
    const f2 = fusionnerFile(f1, suppression('m2', 'serveur-1', 3));
    expect(f2).toHaveLength(1);
    expect(f2[0].type).toBe('delete');
  });

  it('préserve les mutations visant d\'autres livres', () => {
    const autre: Mutation = maj('m0', livre({ id: 'serveur-9' }));
    const f1 = fusionnerFile([autre], creation('m1', 'local-1'));
    const f2 = fusionnerFile(f1, suppression('m2', 'local-1', 1));
    expect(f2).toHaveLength(1);
    expect(f2[0].id).toBe('m0');
  });

  it('conserve la position chronologique de la mutation fusionnée parmi les autres livres (BL-15)', () => {
    // livre-a arrive avant livre-b dans la file...
    const f1 = fusionnerFile([], maj('m1', livre({ id: 'livre-a', titre: 'A v1' })));
    const f2 = fusionnerFile(f1, maj('m2', livre({ id: 'livre-b', titre: 'B' })));
    expect(f2.map((m) => livreVise(m))).toEqual(['livre-a', 'livre-b']);

    // ...une deuxième modification de livre-a doit fusionner en place, pas
    // repousser la mutation en fin de file derrière livre-b : l'ordre de
    // départ au serveur ne doit pas dépendre de quel livre a été retouché
    // en dernier hors ligne.
    const f3 = fusionnerFile(f2, maj('m3', livre({ id: 'livre-a', titre: 'A v2' })));
    expect(f3.map((m) => livreVise(m))).toEqual(['livre-a', 'livre-b']);
    expect((f3[0] as MutationMaj).livre.titre).toBe('A v2');
  });
});

describe('estLivreLocal', () => {
  it('détecte un livre créé hors ligne non synchronisé', () => {
    const file = [creation('m1', 'local-1')];
    expect(estLivreLocal(file, 'local-1')).toBe(true);
    expect(estLivreLocal(file, 'serveur-1')).toBe(false);
  });
});

import type { Mutation, MutationCreation, MutationMaj } from '@/domain/mutations';
import type { ReponseSync } from '@/domain/sync';
import { champsEnConflit, resoudreSync } from '@/domain/sync';
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
  version: 5,
  ...over,
});

const creation: MutationCreation = {
  id: 'm1',
  type: 'create',
  horodatage: '2026-01-01T00:00:00.000Z',
  livre: {
    id: 'local-1',
    titre: 'Local',
    auteur: 'A',
    editeur: '',
    annee: 2021,
    lu: false,
    favori: false,
    note: null,
    couverture: null,
  },
};

const majConflit: MutationMaj = {
  id: 'm2',
  type: 'update',
  horodatage: '2026-01-02T00:00:00.000Z',
  livre: livre({ id: 'serveur-1', titre: 'Local titre', version: 3 }),
  baseVersion: 3,
};

const file: Mutation[] = [creation, majConflit];

describe('resoudreSync', () => {
  it('retire une mutation en succès et remonte le livre serveur', () => {
    const reponse: ReponseSync = {
      resultats: [{ id: 'm1', statut: 'ok', livre: livre({ id: 'serveur-neuf' }) }],
      resume: { total: 1, ok: 1, conflits: 0, erreurs: 0 },
      serveurLe: '2026-01-05T00:00:00.000Z',
    };
    const [d] = resoudreSync(file, reponse);
    expect(d.sort).toBe('retirer');
    if (d.sort === 'retirer') expect(d.livre?.id).toBe('serveur-neuf');
  });

  it('traite un rejeu idempotent comme un succès (pas de doublon)', () => {
    const reponse: ReponseSync = {
      resultats: [{ id: 'm1', statut: 'ok', rejeu: true, livre: livre() }],
      resume: { total: 1, ok: 1, conflits: 0, erreurs: 0 },
      serveurLe: '2026-01-05T00:00:00.000Z',
    };
    const [d] = resoudreSync(file, reponse);
    expect(d.sort).toBe('retirer');
  });

  it('remonte un conflit avec la fiche serveur pour arbitrage', () => {
    const serveur = livre({ id: 'serveur-1', titre: 'Titre serveur', version: 5 });
    const reponse: ReponseSync = {
      resultats: [{ id: 'm2', statut: 'conflit', serveur, versionAttendue: 5 }],
      resume: { total: 1, ok: 0, conflits: 1, erreurs: 0 },
      serveurLe: '2026-01-05T00:00:00.000Z',
    };
    const [d] = resoudreSync(file, reponse);
    expect(d.sort).toBe('conflit');
    if (d.sort === 'conflit') {
      expect(d.conflit.versionAttendue).toBe(5);
      expect(d.conflit.serveur.titre).toBe('Titre serveur');
    }
  });

  it('retire une erreur de validation définitive mais garde une erreur transitoire', () => {
    const reponse: ReponseSync = {
      resultats: [
        { id: 'm1', statut: 'erreur', champs: { titre: 'obligatoire' } },
        { id: 'm2', statut: 'erreur', message: 'livre introuvable' },
      ],
      resume: { total: 2, ok: 0, conflits: 0, erreurs: 2 },
      serveurLe: '2026-01-05T00:00:00.000Z',
    };
    const decisions = resoudreSync(file, reponse);
    expect(decisions[0].sort).toBe('retirer');
    expect(decisions[1].sort).toBe('garder');
  });

  it('ignore un résultat dont l\'id n\'est pas dans la file', () => {
    const reponse: ReponseSync = {
      resultats: [{ id: 'inconnu', statut: 'ok' }],
      resume: { total: 1, ok: 1, conflits: 0, erreurs: 0 },
      serveurLe: '2026-01-05T00:00:00.000Z',
    };
    expect(resoudreSync(file, reponse)).toHaveLength(0);
  });
});

describe('champsEnConflit', () => {
  it('liste uniquement les champs qui diffèrent', () => {
    const local = livre({ titre: 'Local', note: 4 });
    const serveur = livre({ titre: 'Serveur', note: 4 });
    expect(champsEnConflit(local, serveur)).toEqual(['titre']);
  });

  it('renvoie une liste vide quand les champs comparés sont identiques', () => {
    expect(champsEnConflit(livre(), livre())).toEqual([]);
  });
});

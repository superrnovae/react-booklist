import {
    ErreurAuth,
    ErreurConflit,
    ErreurReseau,
    ErreurValidation,
} from '@/domain/erreurs';
import type { Livre } from '@/domain/types';
import { erreurDepuisReponse } from '@/services/api/erreurs-http';

const serveur: Livre = {
  id: 'l1',
  titre: 'Serveur',
  auteur: 'A',
  editeur: '',
  annee: 2020,
  lu: false,
  favori: false,
  note: null,
  couverture: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
  version: 7,
};

describe('erreurDepuisReponse', () => {
  it('422 → ErreurValidation avec les champs', () => {
    const e = erreurDepuisReponse(422, { erreur: 'validation', champs: { titre: 'obligatoire' } });
    expect(e).toBeInstanceOf(ErreurValidation);
    expect((e as ErreurValidation).champs.titre).toBe('obligatoire');
  });

  it('503 → ErreurReseau réessayable', () => {
    const e = erreurDepuisReponse(503, { erreur: 'service_indisponible' });
    expect(e).toBeInstanceOf(ErreurReseau);
    expect((e as ErreurReseau).reessayable).toBe(true);
  });

  it('409 → ErreurConflit portant la fiche serveur', () => {
    const e = erreurDepuisReponse(409, {
      erreur: 'conflit',
      serveur,
      versionAttendue: 7,
    });
    expect(e).toBeInstanceOf(ErreurConflit);
    expect((e as ErreurConflit).versionAttendue).toBe(7);
    expect((e as ErreurConflit).serveur.titre).toBe('Serveur');
  });

  it('401 jeton_expire → ErreurAuth avec le bon code', () => {
    const e = erreurDepuisReponse(401, { erreur: 'jeton_expire' });
    expect(e).toBeInstanceOf(ErreurAuth);
    expect((e as ErreurAuth).code).toBe('jeton_expire');
  });

  it('403 → ErreurAuth droits_insuffisants', () => {
    const e = erreurDepuisReponse(403, { erreur: 'droits_insuffisants' });
    expect((e as ErreurAuth).code).toBe('droits_insuffisants');
  });

  it('404 → ErreurReseau non réessayable', () => {
    const e = erreurDepuisReponse(404, { erreur: 'introuvable' });
    expect(e).toBeInstanceOf(ErreurReseau);
    expect((e as ErreurReseau).reessayable).toBe(false);
  });
});

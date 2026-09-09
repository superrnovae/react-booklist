import { estChampTri, estSensTri, normaliserRequete } from '@/domain/tri';

describe('normaliserRequete', () => {
  it('applique les valeurs par défaut', () => {
    const r = normaliserRequete({});
    expect(r).toMatchObject({ page: 1, limit: 20, sort: 'titre', order: 'asc' });
    expect(r.q).toBeUndefined();
  });

  it('borne la page à 1 minimum et la limite entre 1 et 100', () => {
    expect(normaliserRequete({ page: -5 }).page).toBe(1);
    expect(normaliserRequete({ limit: 500 }).limit).toBe(100);
    expect(normaliserRequete({ limit: 0 }).limit).toBe(1);
  });

  it('nettoie q et ignore une chaîne vide', () => {
    expect(normaliserRequete({ q: '  tolkien  ' }).q).toBe('tolkien');
    expect(normaliserRequete({ q: '   ' }).q).toBeUndefined();
  });

  it('retombe sur des valeurs sûres pour un tri invalide', () => {
    const r = normaliserRequete({ sort: 'pirate' as never, order: 'oblique' as never });
    expect(r.sort).toBe('titre');
    expect(r.order).toBe('asc');
  });
});

describe('gardes de type', () => {
  it('estChampTri', () => {
    expect(estChampTri('annee')).toBe(true);
    expect(estChampTri('editeur')).toBe(false);
  });
  it('estSensTri', () => {
    expect(estSensTri('desc')).toBe(true);
    expect(estSensTri('down')).toBe(false);
  });
});

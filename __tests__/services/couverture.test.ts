import { URL_BASE } from '@/services/config';
import { resoudreCouverture } from '@/services/couverture';

describe('resoudreCouverture', () => {
  it('préfixe un chemin relatif de couverture générée', () => {
    expect(resoudreCouverture('/covers/abc.svg', 'abc')).toBe(`${URL_BASE}/covers/abc.svg`);
  });

  it('préfixe un média envoyé par un libraire', () => {
    expect(resoudreCouverture('/media/xyz.png', 'xyz')).toBe(`${URL_BASE}/media/xyz.png`);
  });

  it('laisse une URL absolue intacte', () => {
    const url = 'https://exemple.org/couv.jpg';
    expect(resoudreCouverture(url, 'abc')).toBe(url);
  });

  it('replie une valeur nulle sur la couverture générée déterministe', () => {
    expect(resoudreCouverture(null, 'id-42')).toBe(`${URL_BASE}/covers/id-42.svg`);
  });

  it('normalise un chemin sans slash initial', () => {
    expect(resoudreCouverture('media/x.png', 'x')).toBe(`${URL_BASE}/media/x.png`);
  });
});

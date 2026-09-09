jest.mock('@/services/stockageSecurise', () => ({
  lireSecret: jest.fn(async () => 'refresh-token'),
  ecrireSecret: jest.fn(async () => {}),
  supprimerSecret: jest.fn(async () => {}),
}));

jest.mock('@/services/api/auth', () => ({
  rafraichirJeton: jest.fn(),
}));

import { fermerSession, jetonAcces, rafraichir } from '@/features/auth/session';
import { rafraichirJeton } from '@/services/api/auth';

const rafraichirJetonMock = rafraichirJeton as jest.MockedFunction<typeof rafraichirJeton>;

afterEach(async () => {
  await fermerSession();
  rafraichirJetonMock.mockReset();
});

describe('session — rafraîchissement single-flight', () => {
  it('un seul rafraîchissement part même sur appels concurrents', async () => {
    let resoudre: (v: { accessToken: string }) => void = () => {};
    rafraichirJetonMock.mockReturnValue(
      new Promise((r) => {
        resoudre = r;
      }),
    );

    const a = rafraichir();
    const b = rafraichir();
    const c = rafraichir();
    resoudre({ accessToken: 'nouveau-jeton' });

    await expect(Promise.all([a, b, c])).resolves.toEqual([true, true, true]);
    expect(rafraichirJetonMock).toHaveBeenCalledTimes(1);
    expect(jetonAcces()).toBe('nouveau-jeton');
  });

  it('renvoie false et ferme la session si le refresh échoue', async () => {
    rafraichirJetonMock.mockRejectedValue(new Error('refresh invalide'));
    await expect(rafraichir()).resolves.toBe(false);
    expect(jetonAcces()).toBeNull();
  });
});

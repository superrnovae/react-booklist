/**
 * @jest-environment jsdom
 *
 * reseau.web.ts s'appuie sur window/navigator réels (online, offline,
 * navigator.onLine) : l'environnement Jest par défaut (react-native) ne les
 * fournit pas, donc ce fichier bascule sur jsdom.
 */
import { lireEtatReseau, surChangementReseau } from '@/services/reseau.web';

function definirEtatNavigateur(enLigne: boolean) {
  Object.defineProperty(navigator, 'onLine', {
    configurable: true,
    value: enLigne,
  });
}

describe('réseau web', () => {
  beforeEach(() => definirEtatNavigateur(true));

  it('lit l’état courant exposé par navigator.onLine', async () => {
    definirEtatNavigateur(false);

    await expect(lireEtatReseau()).resolves.toBe(false);

    definirEtatNavigateur(true);

    await expect(lireEtatReseau()).resolves.toBe(true);
  });

  it('notifie les transitions online/offline puis retire les écouteurs', () => {
    const changements: boolean[] = [];
    const desabonner = surChangementReseau((enLigne) => changements.push(enLigne));

    window.dispatchEvent(new Event('offline'));
    window.dispatchEvent(new Event('online'));
    desabonner();
    window.dispatchEvent(new Event('offline'));

    expect(changements).toEqual([false, true]);
  });
});
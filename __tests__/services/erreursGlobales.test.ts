/**
 * @jest-environment jsdom
 *
 * erreursGlobales.web.ts s'appuie sur window réel ('error',
 * 'unhandledrejection') : l'environnement Jest par défaut (react-native) ne
 * le fournit pas, donc ce fichier bascule sur jsdom.
 */
import { surErreurGlobale } from '@/services/erreursGlobales.web';

describe('erreurs globales — navigateur', () => {
  it("relaie une exception non attrapée ('error') au rappel", () => {
    const recues: unknown[] = [];
    const desabonner = surErreurGlobale((erreur) => recues.push(erreur));

    const echec = new Error('composant en panne');
    const evenement = new ErrorEvent('error', { error: echec, message: echec.message });
    window.dispatchEvent(evenement);

    expect(recues).toEqual([echec]);
    desabonner();
  });

  it("relaie un rejet de promesse non géré ('unhandledrejection') au rappel", () => {
    const recues: unknown[] = [];
    const desabonner = surErreurGlobale((erreur) => recues.push(erreur));

    const motif = new Error('promesse rejetée sans .catch');
    // PromiseRejectionEvent n'existe pas nativement dans jsdom : reconstruit
    // le strict minimum que le code lit (evenement.reason).
    const evenement = Object.assign(new Event('unhandledrejection'), { reason: motif });
    window.dispatchEvent(evenement);

    expect(recues).toEqual([motif]);
    desabonner();
  });

  it('retire ses écouteurs après désabonnement', () => {
    // Un ErrorEvent 'error' sans écouteur fait remonter jsdom comme un
    // véritable uncaughtException (simulation fidèle du navigateur) : on
    // vérifie donc le désabonnement via 'unhandledrejection', sans ce
    // déclenchement, plutôt que via 'error'.
    const rappel = jest.fn();
    const desabonner = surErreurGlobale(rappel);
    desabonner();

    const evenement = Object.assign(new Event('unhandledrejection'), { reason: new Error('trop tard') });
    window.dispatchEvent(evenement);
    expect(rappel).not.toHaveBeenCalled();
  });
});

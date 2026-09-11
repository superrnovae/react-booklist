/**
 * erreursGlobales.ts (implémentation par défaut / mobile) s'appuie sur
 * globalThis.ErrorUtils, le gestionnaire global de React Native — absent en
 * environnement de test, donc simulé ici.
 */
import { surErreurGlobale } from '@/services/erreursGlobales';

type GlobalRN = typeof globalThis & {
  ErrorUtils?: {
    getGlobalHandler?: () => (e: unknown, fatale?: boolean) => void;
    setGlobalHandler: (h: (e: unknown, fatale?: boolean) => void) => void;
  };
};

describe('erreurs globales — natif (ErrorUtils)', () => {
  afterEach(() => {
    delete (globalThis as GlobalRN).ErrorUtils;
  });

  it("n'échoue pas silencieusement quand ErrorUtils est absent : renvoie un désabonnement inoffensif", () => {
    const desabonner = surErreurGlobale(jest.fn());
    expect(() => desabonner()).not.toThrow();
  });

  it('relaie une erreur capturée par ErrorUtils au rappel, puis au gestionnaire précédent', () => {
    const gestionnairePrecedent = jest.fn();
    let gestionnaireActuel: (e: unknown, fatale?: boolean) => void = gestionnairePrecedent;
    (globalThis as GlobalRN).ErrorUtils = {
      getGlobalHandler: () => gestionnaireActuel,
      setGlobalHandler: (h) => {
        gestionnaireActuel = h;
      },
    };

    const rappel = jest.fn();
    surErreurGlobale(rappel);

    const echec = new Error('crash natif');
    gestionnaireActuel(echec, true);

    expect(rappel).toHaveBeenCalledWith(echec, true);
    // Le gestionnaire RN par défaut (ex. l'écran rouge en dev) continue de s'exécuter.
    expect(gestionnairePrecedent).toHaveBeenCalledWith(echec, true);
  });

  it('restaure le gestionnaire précédent après désabonnement', () => {
    const gestionnaireInitial = jest.fn();
    let gestionnaireActuel: (e: unknown, fatale?: boolean) => void = gestionnaireInitial;
    (globalThis as GlobalRN).ErrorUtils = {
      getGlobalHandler: () => gestionnaireActuel,
      setGlobalHandler: (h) => {
        gestionnaireActuel = h;
      },
    };

    const desabonner = surErreurGlobale(jest.fn());
    desabonner();

    expect(gestionnaireActuel).toBe(gestionnaireInitial);
  });
});

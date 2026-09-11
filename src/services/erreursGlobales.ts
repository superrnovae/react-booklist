/**
 * Capture des erreurs et rejets de promesse non interceptés par React
 * (§ Lot 5) — implémentation par défaut (mobile), via le gestionnaire
 * global de React Native. L'implémentation navigateur vit dans
 * erreursGlobales.web.ts (window 'error' / 'unhandledrejection').
 * Une seule interface, une implémentation par plateforme (§ cible navigateur).
 */
export type RappelErreurGlobale = (erreur: unknown, fatale: boolean) => void;

type GlobalRN = {
  ErrorUtils?: {
    getGlobalHandler?: () => (e: unknown, fatale?: boolean) => void;
    setGlobalHandler: (h: (e: unknown, fatale?: boolean) => void) => void;
  };
};

export function surErreurGlobale(cb: RappelErreurGlobale): () => void {
  const g = globalThis as GlobalRN;
  if (!g.ErrorUtils) return () => {};
  const precedent = g.ErrorUtils.getGlobalHandler?.();
  g.ErrorUtils.setGlobalHandler((erreur, fatale) => {
    cb(erreur, fatale ?? false);
    precedent?.(erreur, fatale);
  });
  return () => {
    if (precedent) g.ErrorUtils?.setGlobalHandler(precedent);
  };
}

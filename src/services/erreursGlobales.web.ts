/**
 * Capture des erreurs et rejets de promesse non interceptés — implémentation
 * navigateur : window 'error' (exception non attrapée) et
 * 'unhandledrejection' (promesse rejetée sans .catch).
 */
export type RappelErreurGlobale = (erreur: unknown, fatale: boolean) => void;

export function surErreurGlobale(cb: RappelErreurGlobale): () => void {
  if (typeof window === 'undefined') return () => {};
  const surErreur = (e: ErrorEvent) => cb(e.error ?? e.message, false);
  const surRejet = (e: PromiseRejectionEvent) => cb(e.reason, false);
  window.addEventListener('error', surErreur);
  window.addEventListener('unhandledrejection', surRejet);
  return () => {
    window.removeEventListener('error', surErreur);
    window.removeEventListener('unhandledrejection', surRejet);
  };
}

/**
 * Abstraction de connectivité — implémentation navigateur.
 * `navigator.onLine` + événements `online` / `offline`.
 */
export type Abonnement = () => void;

export function lireEtatReseau(): Promise<boolean> {
  const enLigne = typeof navigator === 'undefined' ? true : navigator.onLine;
  return Promise.resolve(enLigne);
}

export function surChangementReseau(cb: (enLigne: boolean) => void): Abonnement {
  if (typeof window === 'undefined') return () => {};
  const enLigne = () => cb(true);
  const horsLigne = () => cb(false);
  window.addEventListener('online', enLigne);
  window.addEventListener('offline', horsLigne);
  return () => {
    window.removeEventListener('online', enLigne);
    window.removeEventListener('offline', horsLigne);
  };
}

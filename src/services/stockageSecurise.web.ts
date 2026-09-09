/**
 * Stockage sécurisé des jetons — repli navigateur (documenté).
 *
 * expo-secure-store n'existe pas sur le web : on se rabat sur `localStorage`.
 * Limite assumée et documentée en ADR : sur navigateur, le stockage n'est pas
 * chiffré. Le poste de caisse est un environnement de confiance ; le TTL court
 * du jeton d'accès (120 s) borne l'exposition. Voir docs/ADR/004.
 */
export function lireSecret(cle: string): Promise<string | null> {
  if (typeof localStorage === 'undefined') return Promise.resolve(null);
  return Promise.resolve(localStorage.getItem(cle));
}

export function ecrireSecret(cle: string, valeur: string): Promise<void> {
  if (typeof localStorage !== 'undefined') localStorage.setItem(cle, valeur);
  return Promise.resolve();
}

export function supprimerSecret(cle: string): Promise<void> {
  if (typeof localStorage !== 'undefined') localStorage.removeItem(cle);
  return Promise.resolve();
}

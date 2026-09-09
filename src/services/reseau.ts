/**
 * Abstraction de connectivité — implémentation par défaut (mobile), via netinfo.
 * L'implémentation navigateur vit dans `reseau.web.ts` (navigator.onLine).
 * Une seule interface, une implémentation par plateforme (§ cible navigateur).
 */
import NetInfo from '@react-native-community/netinfo';

export type Abonnement = () => void;

export function lireEtatReseau(): Promise<boolean> {
  return NetInfo.fetch().then((etat) => etat.isConnected !== false);
}

export function surChangementReseau(cb: (enLigne: boolean) => void): Abonnement {
  return NetInfo.addEventListener((etat) => cb(etat.isConnected !== false));
}

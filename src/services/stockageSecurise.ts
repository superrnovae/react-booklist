/**
 * Stockage sécurisé des jetons — implémentation mobile via expo-secure-store
 * (chiffré : Keystore / Keychain). Le repli navigateur vit dans le fichier
 * `stockageSecurise.web.ts`.
 *
 * Le refresh token ne transite jamais par un état React et n'est jamais journalisé.
 */
import * as SecureStore from 'expo-secure-store';

export function lireSecret(cle: string): Promise<string | null> {
  return SecureStore.getItemAsync(cle);
}

export function ecrireSecret(cle: string, valeur: string): Promise<void> {
  return SecureStore.setItemAsync(cle, valeur);
}

export function supprimerSecret(cle: string): Promise<void> {
  return SecureStore.deleteItemAsync(cle);
}

/**
 * Persistance clé-valeur générale (cache, file de mutations). AsyncStorage
 * fonctionne sur navigateur (localStorage) comme sur mobile, derrière une seule
 * interface. Les valeurs sont sérialisées en JSON.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

export async function lireJson<T>(cle: string): Promise<T | null> {
  const brut = await AsyncStorage.getItem(cle);
  if (brut === null) return null;
  try {
    return JSON.parse(brut) as T;
  } catch {
    // Stockage corrompu : on repart proprement plutôt que de planter.
    await AsyncStorage.removeItem(cle);
    return null;
  }
}

export async function ecrireJson<T>(cle: string, valeur: T): Promise<void> {
  await AsyncStorage.setItem(cle, JSON.stringify(valeur));
}

export async function supprimerCle(cle: string): Promise<void> {
  await AsyncStorage.removeItem(cle);
}

export { AsyncStorage };


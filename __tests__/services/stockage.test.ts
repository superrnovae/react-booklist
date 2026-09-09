import { ecrireJson, lireJson, supprimerCle } from '@/services/stockage';

describe('stockage JSON', () => {
  it('écrit puis relit une valeur typée', async () => {
    await ecrireJson('cle', { a: 1, b: 'x' });
    await expect(lireJson<{ a: number; b: string }>('cle')).resolves.toEqual({ a: 1, b: 'x' });
  });

  it('renvoie null pour une clé absente', async () => {
    await supprimerCle('inexistante');
    await expect(lireJson('inexistante')).resolves.toBeNull();
  });

  it('repart proprement sur du JSON corrompu', async () => {
    const AsyncStorage = require('@react-native-async-storage/async-storage');
    await AsyncStorage.setItem('corrompu', '{pas du json');
    await expect(lireJson('corrompu')).resolves.toBeNull();
  });
});

/**
 * Confirmation d'action, une interface pour deux plateformes : `window.confirm`
 * sur navigateur, `Alert.alert` sur mobile.
 */
import { Alert, Platform } from 'react-native';

export function confirmer(titre: string, message: string, valider: string, annuler: string): Promise<boolean> {
  if (Platform.OS === 'web') {
    const ok = typeof window !== 'undefined' ? window.confirm(`${titre}\n\n${message}`) : false;
    return Promise.resolve(ok);
  }
  return new Promise((resoudre) => {
    Alert.alert(titre, message, [
      { text: annuler, style: 'cancel', onPress: () => resoudre(false) },
      { text: valider, style: 'destructive', onPress: () => resoudre(true) },
    ]);
  });
}

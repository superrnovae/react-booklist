/**
 * Garde de routes protégées (§ Lot 4.1) : redirige vers la connexion et
 * revient à l'écran initialement demandé une fois connecté. Extrait de
 * app/_layout.tsx pour rester testable (app/ importe expo-router, que la
 * config Jest de ce projet ne transforme pas).
 *
 * Pendant la résolution du profil (statut 'inconnu'), un squelette thémé est
 * affiché plutôt que rien : en mode dégradé (latence 1,5 s + réessais sur
 * 30 % d'échecs), GET /me peut prendre plusieurs secondes — exactement le
 * premier instant de la démonstration de recette. Ne jamais montrer d'écran
 * blanc (§3.3, BL-11).
 */
import { Squelette } from '@/components';
import { usePalette } from '@/theme/ThemeProvider';
import { Redirect, usePathname } from 'expo-router';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { useAuth } from './AuthProvider';

export function ChargementInitial() {
  const palette = usePalette();
  return (
    <View style={[styles.chargementInitial, { backgroundColor: palette.fond }]}>
      <Squelette hauteur={22} largeur="55%" />
      <Squelette hauteur={14} largeur="35%" />
    </View>
  );
}

export function Garde({ children }: { children: ReactNode }) {
  const { statut } = useAuth();
  const chemin = usePathname();
  const enConnexion = chemin === '/connexion';

  if (statut === 'inconnu') return <ChargementInitial />;
  if (statut === 'deconnecte' && !enConnexion) {
    return <Redirect href={{ pathname: '/connexion', params: { de: chemin } }} />;
  }
  if (statut === 'connecte' && enConnexion) return <Redirect href="/" />;
  return <>{children}</>;
}

const styles = StyleSheet.create({
  chargementInitial: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
});

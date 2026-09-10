/**
 * Bascule « coup de cœur » (UI pure). Icône cœur, bascule instantanée,
 * accessible (rôle, libellé, état). L'action est fournie par l'appelant.
 */
import { usePalette } from '@/theme/ThemeProvider';
import { CIBLE_TACTILE, rayons } from '@/theme/tokens';
import { useEffect, useState } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';
import { Texte } from './Texte';

type Props = {
  actif: boolean;
  onToggle: () => void;
  libelle: string;
};

export function Coeur({ actif, onToggle, libelle }: Props) {
  const palette = usePalette();
  const [echelle] = useState(() => new Animated.Value(1));

  useEffect(() => {
    if (!actif) return;
    Animated.sequence([
      Animated.timing(echelle, { toValue: 1.18, duration: 90, useNativeDriver: true }),
      Animated.timing(echelle, { toValue: 1, duration: 120, useNativeDriver: true }),
    ]).start();
  }, [actif, echelle]);

  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={libelle}
      accessibilityState={{ checked: actif }}
      onPress={onToggle}
      hitSlop={8}
      style={({ pressed }) => [
        styles.zone,
        { backgroundColor: pressed || actif ? palette.dangerConteneur : 'transparent' },
        pressed && styles.presse,
      ]}
    >
      <Animated.View style={{ transform: [{ scale: echelle }] }}>
        <Texte style={{ fontSize: 20, color: actif ? palette.coeur : palette.texteSecondaire }}>
          {actif ? '♥' : '♡'}
        </Texte>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  zone: {
    minWidth: CIBLE_TACTILE,
    minHeight: CIBLE_TACTILE,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: rayons.rond,
  },
  presse: { transform: [{ scale: 0.94 }] },
});

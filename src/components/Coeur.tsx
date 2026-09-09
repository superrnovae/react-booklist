/**
 * Bascule « coup de cœur » (UI pure). Icône cœur, bascule instantanée,
 * accessible (rôle, libellé, état). L'action est fournie par l'appelant.
 */
import { usePalette } from '@/theme/ThemeProvider';
import { CIBLE_TACTILE } from '@/theme/tokens';
import { Pressable, StyleSheet } from 'react-native';
import { Texte } from './Texte';

type Props = {
  actif: boolean;
  onToggle: () => void;
  libelle: string;
};

export function Coeur({ actif, onToggle, libelle }: Props) {
  const palette = usePalette();
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={libelle}
      accessibilityState={{ checked: actif }}
      onPress={onToggle}
      hitSlop={8}
      style={styles.zone}
    >
      <Texte style={{ fontSize: 22, color: actif ? palette.coeur : palette.texteSecondaire }}>
        {actif ? '♥' : '♡'}
      </Texte>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  zone: {
    minWidth: CIBLE_TACTILE,
    minHeight: CIBLE_TACTILE,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

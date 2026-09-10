/**
 * Surface/carte thématisée (UI pure).
 */
import { usePalette } from '@/theme/ThemeProvider';
import { espacements, ombres, rayons } from '@/theme/tokens';
import { StyleSheet, View, type ViewProps } from 'react-native';

export function Carte({ style, ...reste }: ViewProps) {
  const palette = usePalette();
  return (
    <View
      style={[
        styles.carte,
        { backgroundColor: palette.surface, borderColor: palette.bordure, shadowColor: palette.ombre },
        style,
      ]}
      {...reste}
    />
  );
}

const styles = StyleSheet.create({
  carte: {
    borderRadius: rayons.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: espacements.md,
    ...ombres.niveau1,
  },
});

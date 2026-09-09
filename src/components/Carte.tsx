/**
 * Surface/carte thématisée (UI pure).
 */
import { usePalette } from '@/theme/ThemeProvider';
import { espacements, rayons } from '@/theme/tokens';
import { StyleSheet, View, type ViewProps } from 'react-native';

export function Carte({ style, ...reste }: ViewProps) {
  const palette = usePalette();
  return (
    <View
      style={[
        styles.carte,
        { backgroundColor: palette.surface, borderColor: palette.bordure },
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
    padding: espacements.lg,
  },
});

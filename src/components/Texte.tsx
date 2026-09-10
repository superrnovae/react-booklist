/**
 * Texte thématisé. Composant d'UI pure : aucune dépendance à l'API ni au store.
 */
import { usePalette } from '@/theme/ThemeProvider';
import { typographie, type Palette } from '@/theme/tokens';
import { Text, type TextProps, type TextStyle } from 'react-native';

type Variante = keyof typeof typographie;

type Props = TextProps & {
  variante?: Variante;
  couleur?: keyof Palette;
};

export function Texte({ variante = 'corps', couleur = 'texte', style, ...reste }: Props) {
  const palette = usePalette();
  const base: TextStyle = {
    fontSize: typographie[variante].taille,
    lineHeight: typographie[variante].hauteur,
    fontWeight: typographie[variante].poids,
    letterSpacing: typographie[variante].espacement,
    color: palette[couleur],
  };
  return <Text style={[base, style]} {...reste} />;
}

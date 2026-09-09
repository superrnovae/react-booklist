/**
 * Bouton accessible : rôle, libellé, état, zone tactile ≥ 44 pt, désactivation
 * pendant l'envoi. Composant d'UI pure.
 */
import { usePalette } from '@/theme/ThemeProvider';
import { CIBLE_TACTILE, espacements, rayons } from '@/theme/tokens';
import { ActivityIndicator, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { Texte } from './Texte';

type Variante = 'primaire' | 'secondaire' | 'danger' | 'fantome';

type Props = {
  titre: string;
  onPress: () => void;
  variante?: Variante;
  enCours?: boolean;
  desactive?: boolean;
  libelleA11y?: string;
  testID?: string;
  style?: ViewStyle;
};

export function Bouton({
  titre,
  onPress,
  variante = 'primaire',
  enCours = false,
  desactive = false,
  libelleA11y,
  testID,
  style,
}: Props) {
  const palette = usePalette();
  const inactif = desactive || enCours;

  const fonds: Record<Variante, string> = {
    primaire: palette.primaire,
    secondaire: palette.surfaceEnfoncee,
    danger: palette.danger,
    fantome: 'transparent',
  };
  const couleurTexte =
    variante === 'primaire'
      ? 'primaireTexte'
      : variante === 'danger'
        ? 'dangerTexte'
        : 'texte';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelleA11y ?? titre}
      accessibilityState={{ disabled: inactif, busy: enCours }}
      testID={testID}
      disabled={inactif}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: fonds[variante], opacity: inactif ? 0.5 : pressed ? 0.85 : 1 },
        variante === 'fantome' && { borderWidth: 1, borderColor: palette.bordure },
        style,
      ]}
    >
      {enCours ? (
        <ActivityIndicator color={palette[couleurTexte]} />
      ) : (
        <Texte variante="sousTitre" couleur={couleurTexte}>
          {titre}
        </Texte>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: CIBLE_TACTILE,
    paddingHorizontal: espacements.lg,
    paddingVertical: espacements.sm,
    borderRadius: rayons.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

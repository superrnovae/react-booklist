/**
 * Bouton accessible : rôle, libellé, état, zone tactile ≥ 44 pt, désactivation
 * pendant l'envoi. Composant d'UI pure.
 */
import { usePalette } from '@/theme/ThemeProvider';
import { CIBLE_TACTILE, espacements, ombres, rayons } from '@/theme/tokens';
import { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, type ViewStyle } from 'react-native';
import { Icone, type IconeNom } from './Icone';
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
  icone?: IconeNom;
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
  icone,
}: Props) {
  const palette = usePalette();
  const [survol, setSurvol] = useState(false);
  const [focus, setFocus] = useState(false);
  const inactif = desactive || enCours;

  const fonds: Record<Variante, { normal: string; presse: string }> = {
    primaire: { normal: palette.primaire, presse: palette.primaireConteneur },
    secondaire: { normal: palette.primaireConteneur, presse: palette.surfaceEnfoncee },
    danger: { normal: palette.danger, presse: palette.dangerConteneur },
    fantome: { normal: 'transparent', presse: palette.surfaceEnfoncee },
  };
  const couleurTexte =
    variante === 'primaire'
      ? 'primaireTexte'
      : variante === 'danger'
        ? 'dangerTexte'
        : variante === 'secondaire'
          ? 'primaireConteneurTexte'
          : 'primaire';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelleA11y ?? titre}
      accessibilityState={{ disabled: inactif, busy: enCours }}
      testID={testID}
      disabled={inactif}
      onPress={onPress}
      onHoverIn={() => setSurvol(true)}
      onHoverOut={() => setSurvol(false)}
      onFocus={() => setFocus(true)}
      onBlur={() => setFocus(false)}
      style={({ pressed }) => [
        styles.base,
        {
          backgroundColor: (pressed || survol) && !inactif ? fonds[variante].presse : fonds[variante].normal,
          opacity: inactif ? 0.5 : 1,
          shadowColor: palette.ombre,
          transform: [{ translateY: (survol || focus) && !inactif ? -1 : 0 }],
        },
        (variante === 'fantome' || variante === 'secondaire') && {
          borderWidth: StyleSheet.hairlineWidth,
          borderColor: variante === 'fantome' ? palette.bordure : palette.primaireConteneur,
        },
        !inactif && (survol || focus) && styles.survol,
        style,
      ]}
    >
      {enCours ? (
        <ActivityIndicator color={palette[couleurTexte]} />
      ) : (
        <>
          {icone ? <Icone nom={icone} couleur={couleurTexte} taille={15} /> : null}
          <Texte variante="bouton" couleur={couleurTexte}>
            {titre}
          </Texte>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: CIBLE_TACTILE,
    paddingHorizontal: espacements.lg,
    paddingVertical: espacements.xs,
    borderRadius: rayons.rond,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: espacements.sm,
  },
  survol: ombres.niveau1,
});

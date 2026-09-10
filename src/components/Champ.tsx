/**
 * Champ de formulaire étiqueté avec message d'erreur par champ (UI pure).
 * Zone tactile confortable, libellés et états pour l'accessibilité.
 */
import { usePalette } from '@/theme/ThemeProvider';
import { CIBLE_TACTILE, espacements, rayons, typographie } from '@/theme/tokens';
import { forwardRef, useState } from 'react';
import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { Texte } from './Texte';

type Props = TextInputProps & {
  libelle: string;
  erreur?: string;
};

export const Champ = forwardRef<TextInput, Props>(function Champ(
  { libelle, erreur, style, onBlur, onFocus, ...reste },
  ref,
) {
  const palette = usePalette();
  const [actif, setActif] = useState(false);
  const bordure = erreur ? palette.danger : actif ? palette.primaire : palette.bordure;

  return (
    <View style={styles.groupe}>
      <Texte variante="legende" couleur="texteSecondaire">
        {libelle}
      </Texte>
      <TextInput
        ref={ref}
        accessibilityLabel={libelle}
        accessibilityState={{ disabled: reste.editable === false }}
        placeholderTextColor={palette.texteSecondaire}
        style={[
          styles.champ,
          {
            color: palette.texte,
            backgroundColor: palette.surfaceHaute,
            borderColor: bordure,
          },
          style,
        ]}
        onFocus={(e) => {
          setActif(true);
          onFocus?.(e);
        }}
        onBlur={(e) => {
          setActif(false);
          onBlur?.(e);
        }}
        {...reste}
      />
      {erreur ? (
        <Texte variante="legende" couleur="danger" accessibilityRole="alert">
          {erreur}
        </Texte>
      ) : null}
    </View>
  );
});

const styles = StyleSheet.create({
  groupe: { gap: espacements.xs },
  champ: {
    minHeight: CIBLE_TACTILE,
    borderWidth: 1,
    borderRadius: rayons.md,
    paddingHorizontal: espacements.md,
    paddingVertical: espacements.xs,
    fontSize: typographie.corps.taille,
    lineHeight: typographie.corps.hauteur,
  },
});

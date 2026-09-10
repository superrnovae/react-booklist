/**
 * Les quatre états d'un écran de données (§ Lot 1) : chargement (squelette, pas
 * un spinner plein écran), erreur avec réessai, vide contextualisé, succès.
 * Composants d'UI pure ; les libellés viennent de l'appelant (i18n).
 */
import { usePalette } from '@/theme/ThemeProvider';
import { espacements, rayons } from '@/theme/tokens';
import { useEffect, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { Bouton } from './Bouton';
import { Texte } from './Texte';

/** Bloc squelette pulsant, utilisé pour composer des écrans de chargement. */
export function Squelette({ hauteur = 16, largeur = '100%' as number | string, radius = rayons.sm }) {
  const palette = usePalette();
  const [opacite] = useState(() => new Animated.Value(0.4));

  useEffect(() => {
    const boucle = Animated.loop(
      Animated.sequence([
        Animated.timing(opacite, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacite, { toValue: 0.4, duration: 700, useNativeDriver: true }),
      ]),
    );
    boucle.start();
    return () => boucle.stop();
  }, [opacite]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{
        height: hauteur,
        width: largeur as number,
        borderRadius: radius,
        backgroundColor: palette.squelette,
        opacity: opacite,
      }}
    />
  );
}

export function EtatErreur({
  titre,
  message,
  libelleReessai,
  onReessayer,
}: {
  titre: string;
  message?: string;
  libelleReessai: string;
  onReessayer: () => void;
}) {
  const palette = usePalette();

  return (
    <View
      style={[styles.centre, { backgroundColor: palette.dangerConteneur, borderColor: palette.danger }]}
      accessibilityRole="alert"
    >
      <Texte variante="sousTitre" couleur="danger">
        {titre}
      </Texte>
      {message ? (
        <Texte couleur="texteSecondaire" style={styles.message}>
          {message}
        </Texte>
      ) : null}
      <Bouton
        titre={libelleReessai}
        onPress={onReessayer}
        variante="secondaire"
        style={styles.action}
        icone="rafraichir"
      />
    </View>
  );
}

export function EtatVide({ titre, message }: { titre: string; message?: string }) {
  const palette = usePalette();

  return (
    <View style={[styles.centre, { backgroundColor: palette.surfaceHaute, borderColor: palette.bordure }]}>
      <Texte variante="sousTitre">{titre}</Texte>
      {message ? (
        <Texte couleur="texteSecondaire" style={styles.message}>
          {message}
        </Texte>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  centre: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espacements.xl,
    gap: espacements.sm,
    borderRadius: rayons.lg,
    borderWidth: StyleSheet.hairlineWidth,
  },
  message: { textAlign: 'center' },
  action: { marginTop: espacements.md, minWidth: 160 },
});

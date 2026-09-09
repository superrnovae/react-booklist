/**
 * Note interne de 0 à 5 en étoiles (UI pure). Interactive ou en lecture seule.
 * Accessible : rôle ajustable, valeur exposée, zones tactiles suffisantes.
 */
import { usePalette } from '@/theme/ThemeProvider';
import { CIBLE_TACTILE } from '@/theme/tokens';
import { Pressable, StyleSheet, View } from 'react-native';
import { Texte } from './Texte';

type Props = {
  valeur: number | null;
  onChange?: (note: number) => void;
  libelle: string;
  taille?: number;
};

export function EtoilesNote({ valeur, onChange, libelle, taille = 28 }: Props) {
  const palette = usePalette();
  const note = valeur ?? 0;
  const lectureSeule = !onChange;

  return (
    <View
      style={styles.rangee}
      accessibilityRole={lectureSeule ? 'text' : 'adjustable'}
      accessibilityLabel={libelle}
      accessibilityValue={{ min: 0, max: 5, now: note }}
    >
      {[1, 2, 3, 4, 5].map((n) => {
        const pleine = n <= note;
        const etoile = (
          <Texte style={{ fontSize: taille, color: pleine ? palette.etoile : palette.texteSecondaire }}>
            {pleine ? '★' : '☆'}
          </Texte>
        );
        if (lectureSeule) return <View key={n}>{etoile}</View>;
        return (
          <Pressable
            key={n}
            accessibilityRole="button"
            accessibilityLabel={`${libelle} : ${n}`}
            onPress={() => onChange(n === note ? 0 : n)}
            hitSlop={6}
            style={styles.zone}
          >
            {etoile}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rangee: { flexDirection: 'row', alignItems: 'center' },
  zone: { minWidth: CIBLE_TACTILE, minHeight: CIBLE_TACTILE, alignItems: 'center', justifyContent: 'center' },
});

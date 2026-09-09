/**
 * Graphique en barres horizontales (UI pure), sans dépendance de charting lourde.
 * Chaque barre est dimensionnée proportionnellement au maximum.
 */
import { usePalette } from '@/theme/ThemeProvider';
import { espacements, rayons } from '@/theme/tokens';
import { StyleSheet, View } from 'react-native';
import { Texte } from './Texte';

export type Barre = { libelle: string; valeur: number; couleur?: string };

export function GraphiqueBarres({ donnees }: { donnees: Barre[] }) {
  const palette = usePalette();
  const max = Math.max(1, ...donnees.map((d) => d.valeur));

  return (
    <View style={styles.grille} accessibilityRole="summary">
      {donnees.map((d) => (
        <View key={d.libelle} style={styles.ligne}>
          <View style={styles.etiquette}>
            <Texte variante="legende" numberOfLines={1}>
              {d.libelle}
            </Texte>
          </View>
          <View style={[styles.piste, { backgroundColor: palette.surfaceEnfoncee }]}>
            <View
              accessibilityLabel={`${d.libelle} : ${d.valeur}`}
              style={{
                width: `${(d.valeur / max) * 100}%`,
                height: '100%',
                backgroundColor: d.couleur ?? palette.primaire,
                borderRadius: rayons.sm,
              }}
            />
          </View>
          <View style={styles.valeur}>
            <Texte variante="legende" couleur="texteSecondaire">
              {d.valeur}
            </Texte>
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grille: { gap: espacements.sm },
  ligne: { flexDirection: 'row', alignItems: 'center', gap: espacements.sm },
  etiquette: { width: 92 },
  piste: { flex: 1, height: 16, borderRadius: rayons.sm, overflow: 'hidden' },
  valeur: { width: 40, alignItems: 'flex-end' },
});

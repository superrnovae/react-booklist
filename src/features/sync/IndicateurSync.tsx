/**
 * Indicateur de synchronisation visible en permanence (§ Lot 4.2) :
 * en ligne · hors ligne · N modifications en attente · conflit à traiter.
 */
import { Texte } from '@/components';
import { usePalette } from '@/theme/ThemeProvider';
import { useI18n } from '@/theme/formats';
import { espacements, rayons, type Palette } from '@/theme/tokens';
import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSync } from './SyncProvider';

export function IndicateurSync() {
  const palette = usePalette();
  const router = useRouter();
  const { t } = useI18n();
  const { enLigne, file, conflits } = useSync();

  const nbConflits = conflits.length;
  const nbAttente = file.length;

  const fond =
    nbConflits > 0
      ? palette.dangerConteneur
      : !enLigne
        ? palette.avertissementConteneur
        : palette.succesConteneur;
  const couleur: keyof Palette =
    nbConflits > 0 ? 'dangerConteneurTexte' : !enLigne ? 'avertissementTexte' : 'succesTexte';

  const message =
    nbConflits > 0
      ? t('reseau.conflit')
      : !enLigne
        ? nbAttente > 0
          ? `${t('reseau.horsLigne')} · ${t('reseau.enAttente', { count: nbAttente })}`
          : t('reseau.horsLigne')
        : nbAttente > 0
          ? t('reseau.enAttente', { count: nbAttente })
          : t('reseau.enLigne');

  const contenu = (
    <View style={[styles.conteneur, { backgroundColor: palette.surface, borderColor: palette.bordure }]}>
      <View style={[styles.barre, { backgroundColor: fond }]} accessibilityLiveRegion="polite">
        <Texte variante="legende" couleur={couleur}>
          {enLigne ? '●' : '○'} {message}
        </Texte>
      </View>
    </View>
  );

  if (nbConflits > 0) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={t('reseau.conflit')}
        onPress={() => router.push('/conflits')}
      >
        {contenu}
      </Pressable>
    );
  }
  return contenu;
}

const styles = StyleSheet.create({
  conteneur: {
    paddingVertical: espacements.xs,
    alignItems: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  barre: {
    paddingVertical: 2,
    paddingHorizontal: espacements.md,
    alignItems: 'center',
    borderRadius: rayons.rond,
  },
});

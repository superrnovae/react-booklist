/**
 * Écran Journal (§ Lot 5) : consultation du journal structuré côté client
 * — la « remontée d'erreurs » du sujet, faute de service externe (l'API
 * fournie n'expose aucune route d'ingestion, et api-books-v2/ n'est pas
 * modifiable). Un développeur ou le responsable réseau peut y retrouver ce
 * qui a échoué pendant la session, avec le contexte structuré associé.
 */
import { Bouton, EtatVide, Texte } from '@/components';
import type { NiveauJournal } from '@/domain/journal';
import { useConfirmation } from '@/features/ui/Confirmation';
import { usePalette } from '@/theme/ThemeProvider';
import { useI18n } from '@/theme/formats';
import { espacements } from '@/theme/tokens';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { EntreeJournalCarte } from './EntreeJournalCarte';
import { useJournal } from './hooks';

const NIVEAUX: (NiveauJournal | 'tous')[] = ['tous', 'info', 'avertissement', 'erreur'];

function FiltreNiveau({
  niveau,
  actif,
  onPress,
}: {
  niveau: NiveauJournal | 'tous';
  actif: boolean;
  onPress: () => void;
}) {
  const { t } = useI18n();
  const palette = usePalette();
  return (
    <Pressable
      testID={`filtre-niveau-${niveau}`}
      accessibilityRole="radio"
      accessibilityState={{ selected: actif }}
      onPress={onPress}
      style={[
        styles.filtre,
        { borderColor: actif ? palette.primaire : palette.bordure, backgroundColor: actif ? palette.primaireConteneur : 'transparent' },
      ]}
    >
      <Texte variante="legende" couleur={actif ? 'primaireConteneurTexte' : 'texteSecondaire'}>
        {t(`journal.niveau.${niveau}`)}
      </Texte>
    </Pressable>
  );
}

export function EcranJournal() {
  const { t } = useI18n();
  const { demanderConfirmation } = useConfirmation();
  const { entrees, total, niveau, definirNiveau, vider } = useJournal();

  const confirmerVidage = async () => {
    const continuer = await demanderConfirmation({
      titre: t('journal.viderTitre'),
      message: t('journal.viderMessage'),
      valider: t('actions.confirmer'),
      annuler: t('actions.annuler'),
      destructive: true,
    });
    if (continuer) vider();
  };

  return (
    <ScrollView contentContainerStyle={styles.contenu} testID="ecran-journal">
      <View style={styles.filtres}>
        {NIVEAUX.map((n) => (
          <FiltreNiveau key={n} niveau={n} actif={niveau === n} onPress={() => definirNiveau(n)} />
        ))}
      </View>

      {total > 0 ? (
        <Bouton
          titre={t('journal.vider')}
          variante="danger"
          icone="supprimer"
          onPress={() => void confirmerVidage()}
          testID="vider-journal"
        />
      ) : null}

      {entrees.length === 0 ? (
        <EtatVide
          titre={t('journal.titre')}
          message={total === 0 ? t('journal.videTotal') : t('journal.videFiltre')}
        />
      ) : (
        entrees.map((e) => <EntreeJournalCarte key={e.id} entree={e} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenu: { padding: espacements.lg, gap: espacements.md, flexGrow: 1 },
  filtres: { flexDirection: 'row', gap: espacements.sm, flexWrap: 'wrap' },
  filtre: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: espacements.md,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
});

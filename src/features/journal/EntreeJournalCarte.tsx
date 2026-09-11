/**
 * Une entrée du journal structuré (§ Lot 5), repliée par défaut. Extrait de
 * EcranJournal.tsx pour rester sous 250 lignes (§4) — même logique que
 * ConflitCard/PuceFiltre.
 */
import { Icone, Texte, type IconeNom } from '@/components';
import type { EntreeJournal, NiveauJournal } from '@/domain/journal';
import { usePalette } from '@/theme/ThemeProvider';
import { useI18n } from '@/theme/formats';
import { espacements, rayons } from '@/theme/tokens';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

const ICONE_PAR_NIVEAU: Record<NiveauJournal, IconeNom> = {
  info: 'appliquer',
  avertissement: 'horloge',
  erreur: 'fermer',
};

export function EntreeJournalCarte({ entree }: { entree: EntreeJournal }) {
  const { t, formaterDate } = useI18n();
  const palette = usePalette();
  const [ouvert, setOuvert] = useState(false);
  const couleur = entree.niveau === 'erreur' ? 'danger' : entree.niveau === 'avertissement' ? 'avertissement' : 'texteSecondaire';
  const aDetail = Boolean(entree.contexte || entree.erreur);

  return (
    <Pressable
      testID="entree-journal"
      accessibilityRole={aDetail ? 'button' : undefined}
      accessibilityState={aDetail ? { expanded: ouvert } : undefined}
      accessibilityLabel={`${t(`journal.niveau.${entree.niveau}`)} — ${entree.message}`}
      onPress={aDetail ? () => setOuvert((v) => !v) : undefined}
      style={[styles.ligne, { backgroundColor: palette.surface, borderColor: palette.bordure }]}
    >
      <View style={styles.entete}>
        <Icone nom={ICONE_PAR_NIVEAU[entree.niveau]} couleur={couleur} taille={14} />
        <Texte variante="legende" couleur="texteSecondaire" style={styles.horodatage}>
          {formaterDate(entree.horodatage)}
        </Texte>
      </View>
      <Texte>{entree.message}</Texte>
      {ouvert && entree.erreur ? (
        <Texte variante="legende" couleur="danger" style={styles.detail} numberOfLines={6}>
          {entree.erreur.nom} — {entree.erreur.message}
        </Texte>
      ) : null}
      {ouvert && entree.contexte ? (
        <Texte variante="legende" couleur="texteSecondaire" style={styles.detail} numberOfLines={6}>
          {JSON.stringify(entree.contexte)}
        </Texte>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ligne: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: rayons.md,
    padding: espacements.md,
    gap: espacements.xs,
  },
  entete: { flexDirection: 'row', alignItems: 'center', gap: espacements.xs },
  horodatage: { marginLeft: 'auto' as unknown as number },
  detail: { fontFamily: 'monospace' },
});

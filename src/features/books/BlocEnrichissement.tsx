/**
 * Bloc d'enrichissement OpenLibrary sur la fiche (composant de feature).
 * Dégradation silencieuse : jamais d'erreur affichée, « zéro édition » est normal.
 */
import { Squelette, Texte } from '@/components';
import { useI18n } from '@/theme/formats';
import { espacements } from '@/theme/tokens';
import { StyleSheet, View } from 'react-native';
import { useEnrichissement } from './useEnrichissement';

export function BlocEnrichissement({ titre }: { titre: string }) {
  const { t } = useI18n();
  const q = useEnrichissement(titre);

  if (q.isLoading) return <Squelette hauteur={14} largeur="55%" />;

  const editions = q.data?.editions ?? 0;
  const annee = q.data?.premiereAnnee ?? null;

  return (
    <View style={styles.bloc}>
      <Texte variante="legende" couleur="texteSecondaire">
        {editions > 0
          ? t('livre.editionsReferencees', { count: editions })
          : t('livre.aucuneEdition')}
        {annee ? ` · ${annee}` : ''}
      </Texte>
    </View>
  );
}

const styles = StyleSheet.create({
  bloc: { paddingVertical: espacements.xs },
});

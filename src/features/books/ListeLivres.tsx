/**
 * Liste des ouvrages : les quatre états (chargement squelette, erreur+réessai,
 * vide contextualisé, succès), pagination serveur en défilement infini avec un
 * indicateur de page suivante distinct du chargement initial.
 */
import { EtatErreur, EtatVide, Squelette, Texte } from '@/components';
import type { Livre } from '@/domain/types';
import { useI18n } from '@/theme/formats';
import { espacements } from '@/theme/tokens';
import { useCallback } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { LivreCarte } from './LivreCarte';
import { useLivresInfinis, type FiltresListe } from './queries';

type Props = {
  filtres: Partial<FiltresListe>;
  onOuvrir: (id: string) => void;
  entete?: React.ReactElement;
};

function SquelettesListe() {
  return (
    <View style={styles.contenu}>
      {Array.from({ length: 8 }).map((_, i) => (
        <View key={i} style={styles.squeletteLigne}>
          <Squelette hauteur={84} largeur={56} />
          <View style={styles.squeletteInfos}>
            <Squelette hauteur={16} largeur="70%" />
            <Squelette hauteur={12} largeur="45%" />
          </View>
        </View>
      ))}
    </View>
  );
}

export function ListeLivres({ filtres, onOuvrir, entete }: Props) {
  const { t } = useI18n();
  const q = useLivresInfinis(filtres);

  const rendre = useCallback(
    ({ item }: { item: Livre }) => <LivreCarte livre={item} onOuvrir={onOuvrir} />,
    [onOuvrir],
  );

  if (q.isLoading) {
    return (
      <View style={styles.plein}>
        {entete}
        <SquelettesListe />
      </View>
    );
  }

  if (q.isError) {
    return (
      <View style={styles.plein}>
        {entete}
        <EtatErreur
          titre={t('etats.erreurTitre')}
          message={q.error instanceof Error ? q.error.message : undefined}
          libelleReessai={t('actions.reessayer')}
          onReessayer={() => q.refetch()}
        />
      </View>
    );
  }

  const recherche = Boolean(filtres.q || filtres.status || filtres.favori);

  return (
    <FlatList
      data={q.livres}
      keyExtractor={(l) => l.id}
      renderItem={rendre}
      ListHeaderComponent={entete}
      contentContainerStyle={styles.contenu}
      ItemSeparatorComponent={() => <View style={styles.sep} />}
      onEndReachedThreshold={0.4}
      onEndReached={() => {
        if (q.hasNextPage && !q.isFetchingNextPage) void q.fetchNextPage();
      }}
      ListEmptyComponent={
        <EtatVide
          titre={t('etats.videTitre')}
          message={recherche ? t('etats.rechercheVide') : t('etats.fondsVide')}
        />
      }
      ListFooterComponent={
        q.isFetchingNextPage ? (
          <View style={styles.pied}>
            <Squelette hauteur={14} largeur="50%" />
            <Texte variante="legende" couleur="texteSecondaire">
              {t('etats.pageSuivante')}
            </Texte>
          </View>
        ) : null
      }
      refreshing={q.isRefetching && !q.isFetchingNextPage}
      onRefresh={() => q.refetch()}
    />
  );
}

const styles = StyleSheet.create({
  plein: { flex: 1 },
  contenu: { padding: espacements.lg, gap: 0, flexGrow: 1 },
  sep: { height: espacements.sm },
  squeletteLigne: { flexDirection: 'row', gap: espacements.md, marginBottom: espacements.md },
  squeletteInfos: { flex: 1, gap: espacements.sm, justifyContent: 'center' },
  pied: { paddingVertical: espacements.lg, alignItems: 'center', gap: espacements.sm },
});

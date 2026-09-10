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
import type { ModeAffichageLivres } from './useModeAffichageLivres';

type Props = {
  filtres: Partial<FiltresListe>;
  onOuvrir: (id: string) => void;
  entete?: React.ReactElement;
  modeAffichage?: ModeAffichageLivres;
};

function SquelettesListe({ modeAffichage = 'ligne' }: { modeAffichage?: ModeAffichageLivres }) {
  const grille = modeAffichage === 'grille';
  return (
    <View style={[styles.contenu, grille && styles.contenuGrille, grille && styles.squelettesGrille]}>
      {Array.from({ length: grille ? 6 : 8 }).map((_, i) => (
        <View key={i} style={grille ? styles.squeletteGrille : styles.squeletteLigne}>
          <Squelette hauteur={grille ? 190 : 86} largeur={grille ? '100%' : 58} />
          <View style={styles.squeletteInfos}>
            <Squelette hauteur={16} largeur="70%" />
            <Squelette hauteur={12} largeur="45%" />
          </View>
        </View>
      ))}
    </View>
  );
}

export function ListeLivres({ filtres, onOuvrir, entete, modeAffichage = 'ligne' }: Props) {
  const { t } = useI18n();
  const q = useLivresInfinis(filtres);
  const grille = modeAffichage === 'grille';

  const rendre = useCallback(
    ({ item }: { item: Livre }) => (
      <View style={grille ? styles.celluleGrille : undefined}>
        <LivreCarte livre={item} onOuvrir={onOuvrir} mode={modeAffichage} />
      </View>
    ),
    [grille, modeAffichage, onOuvrir],
  );

  if (q.isLoading) {
    return (
      <View style={styles.plein}>
        {entete}
        <SquelettesListe modeAffichage={modeAffichage} />
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
      key={modeAffichage}
      data={q.livres}
      keyExtractor={(l) => l.id}
      renderItem={rendre}
      numColumns={grille ? 2 : 1}
      columnWrapperStyle={grille ? styles.rangeeGrille : undefined}
      ListHeaderComponent={entete}
      contentContainerStyle={[styles.contenu, grille && styles.contenuGrille]}
      ItemSeparatorComponent={() => <View style={grille ? styles.sepGrille : styles.sep} />}
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
  contenu: { padding: espacements.lg, gap: 0, flexGrow: 1, width: '100%', maxWidth: 920, alignSelf: 'center' },
  contenuGrille: { maxWidth: 1120 },
  sep: { height: espacements.sm },
  sepGrille: { height: espacements.md },
  rangeeGrille: { gap: espacements.md },
  celluleGrille: { flex: 1, minWidth: 0 },
  squelettesGrille: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.md },
  squeletteLigne: { flexDirection: 'row', gap: espacements.md, marginBottom: espacements.md },
  squeletteGrille: { width: '48%', minWidth: 220, gap: espacements.sm, marginBottom: espacements.md },
  squeletteInfos: { flex: 1, gap: espacements.sm, justifyContent: 'center' },
  pied: { paddingVertical: espacements.lg, alignItems: 'center', gap: espacements.sm },
});

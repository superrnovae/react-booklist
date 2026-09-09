import { Stack } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Carte, EtatErreur, GraphiqueBarres, Squelette, Texte, type Barre } from '@/components';
import type { Stats } from '@/domain/types';
import { useStats } from '@/features/stats';
import { usePalette } from '@/theme/ThemeProvider';
import { useI18n } from '@/theme/formats';
import { espacements } from '@/theme/tokens';

export default function EcranStats() {
  const { t, formaterDate, formaterNombre } = useI18n();
  const q = useStats();

  return (
    <ScrollView contentContainerStyle={styles.contenu}>
      <Stack.Screen options={{ title: t('stats.titre') }} />

      {q.isLoading && !q.data ? (
        <View style={styles.chargement}>
          <Squelette hauteur={80} />
          <Squelette hauteur={140} />
          <Squelette hauteur={140} />
        </View>
      ) : q.isError && !q.data ? (
        <EtatErreur
          titre={t('etats.erreurTitre')}
          message={q.error instanceof Error ? q.error.message : undefined}
          libelleReessai={t('actions.reessayer')}
          onReessayer={() => q.refetch()}
        />
      ) : q.data ? (
        <Tableau stats={q.data} horsLigne={q.isError} dateMaj={formaterDate(q.data.genereLe)} />
      ) : null}
    </ScrollView>
  );

  function Tableau({ stats, horsLigne, dateMaj }: { stats: Stats; horsLigne: boolean; dateMaj: string }) {
    const palette = usePalette();

    const lecture: Barre[] = [
      { libelle: t('livre.lu'), valeur: stats.lus, couleur: palette.succes },
      { libelle: t('livre.nonLu'), valeur: stats.nonLus, couleur: palette.texteSecondaire },
    ];
    const notes: Barre[] = stats.distributionNotes.map((d) => ({
      libelle: `★ ${d.note}`,
      valeur: d.total,
      couleur: palette.etoile,
    }));

    return (
      <View style={styles.corps}>
        {horsLigne ? (
          <View style={[styles.badge, { backgroundColor: palette.surfaceEnfoncee }]}>
            <Texte variante="legende" couleur="avertissement">
              {t('reseau.horsLigne')} · {t('stats.majLe', { date: dateMaj })}
            </Texte>
          </View>
        ) : null}

        <View style={styles.kpis}>
          <Kpi libelle={t('stats.total')} valeur={formaterNombre(stats.total)} />
          <Kpi libelle={t('stats.favoris')} valeur={formaterNombre(stats.favoris)} />
          <Kpi
            libelle={t('stats.moyenne')}
            valeur={stats.moyenneNotes !== null ? formaterNombre(stats.moyenneNotes) : '—'}
          />
        </View>

        <Carte style={styles.carte}>
          <Texte variante="sousTitre">{t('stats.lusNonLus')}</Texte>
          <GraphiqueBarres donnees={lecture} />
        </Carte>

        <Carte style={styles.carte}>
          <Texte variante="sousTitre">{t('stats.distribution')}</Texte>
          <GraphiqueBarres donnees={notes} />
        </Carte>

        <Texte variante="legende" couleur="texteSecondaire">
          {t('stats.majLe', { date: dateMaj })}
        </Texte>
      </View>
    );
  }

  function Kpi({ libelle, valeur }: { libelle: string; valeur: string }) {
    return (
      <Carte style={styles.kpi}>
        <Texte variante="titre">{valeur}</Texte>
        <Texte variante="legende" couleur="texteSecondaire">
          {libelle}
        </Texte>
      </Carte>
    );
  }
}

const styles = StyleSheet.create({
  contenu: { padding: espacements.lg, gap: espacements.lg, flexGrow: 1 },
  chargement: { gap: espacements.lg },
  corps: { gap: espacements.lg },
  badge: { padding: espacements.sm, borderRadius: 8, alignItems: 'center' },
  kpis: { flexDirection: 'row', gap: espacements.md },
  kpi: { flex: 1, alignItems: 'center', gap: espacements.xs },
  carte: { gap: espacements.md },
});

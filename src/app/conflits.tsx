import { Stack } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Bouton, Carte, EtatVide, Texte } from '@/components';
import { champsEnConflit, type ChampCompare, type Conflit } from '@/domain/sync';
import type { Livre, SaisieLivre } from '@/domain/types';
import { useSync } from '@/features/sync';
import { useSnackbar } from '@/features/ui/Snackbar';
import { remplacerLivre } from '@/services/api/livres';
import { usePalette } from '@/theme/ThemeProvider';
import { useI18n } from '@/theme/formats';
import { espacements, rayons } from '@/theme/tokens';

const ARBITRABLES: ChampCompare[] = ['titre', 'auteur', 'editeur', 'annee', 'note'];

export default function EcranConflits() {
  const { t } = useI18n();
  const { conflits } = useSync();

  return (
    <ScrollView contentContainerStyle={styles.contenu}>
      <Stack.Screen options={{ title: t('conflit.titre') }} />
      {conflits.length === 0 ? (
        <EtatVide titre={t('conflit.titre')} message={t('etats.videTitre')} />
      ) : (
        conflits.map((c) => <CarteConflit key={c.mutation.id} conflit={c} />)
      )}
    </ScrollView>
  );
}

function valeurLocale(conflit: Conflit): Livre | null {
  return conflit.mutation.type === 'update' ? conflit.mutation.livre : null;
}

function CarteConflit({ conflit }: { conflit: Conflit }) {
  const { t } = useI18n();
  const palette = usePalette();
  const { afficher } = useSnackbar();
  const { resoudreConflit } = useSync();
  const local = valeurLocale(conflit);
  const serveur = conflit.serveur;

  const differents = local ? champsEnConflit(local, serveur).filter((c) => ARBITRABLES.includes(c as ChampCompare)) : [];
  const [choix, setChoix] = useState<Record<string, 'local' | 'serveur'>>(
    Object.fromEntries(differents.map((c) => [c, 'local'])),
  );
  const [enCours, setEnCours] = useState(false);

  const appliquer = async () => {
    setEnCours(true);
    try {
      // Base : version serveur. On y superpose les champs choisis « ma valeur ».
      const fusion: SaisieLivre = {
        titre: serveur.titre,
        auteur: serveur.auteur,
        editeur: serveur.editeur,
        annee: serveur.annee,
        lu: serveur.lu,
        favori: serveur.favori,
        note: serveur.note,
        couverture: serveur.couverture,
      };
      if (local) {
        for (const champ of differents) {
          if (choix[champ] === 'local') {
            (fusion as Record<string, unknown>)[champ] = (local as Record<string, unknown>)[champ];
          }
        }
      }
      await remplacerLivre(serveur.id, fusion, serveur.version);
      resoudreConflit(conflit.mutation.id);
      afficher(t('messages.majReussie'));
    } catch (e) {
      afficher(e instanceof Error ? e.message : t('etats.erreurTitre'));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <Carte style={styles.carte}>
      <Texte variante="sousTitre">{serveur.titre}</Texte>
      <Texte variante="legende" couleur="texteSecondaire">
        {t('conflit.intro')}
      </Texte>

      {differents.length === 0 ? (
        <Texte variante="legende" couleur="texteSecondaire">
          {t('conflit.versionServeur')}
        </Texte>
      ) : (
        differents.map((champ) => (
          <View key={champ} style={styles.champ}>
            <Texte variante="legende" couleur="texteSecondaire">
              {t(`livre.${champ}`)}
            </Texte>
            <View style={styles.options}>
              <Option
                actif={choix[champ] === 'local'}
                titre={t('conflit.votreVersion')}
                valeur={String((local as Record<string, unknown>)?.[champ] ?? '—')}
                onPress={() => setChoix((c) => ({ ...c, [champ]: 'local' }))}
                palette={palette}
              />
              <Option
                actif={choix[champ] === 'serveur'}
                titre={t('conflit.versionServeur')}
                valeur={String((serveur as Record<string, unknown>)[champ] ?? '—')}
                onPress={() => setChoix((c) => ({ ...c, [champ]: 'serveur' }))}
                palette={palette}
              />
            </View>
          </View>
        ))
      )}

      <Bouton titre={t('conflit.appliquer')} onPress={appliquer} enCours={enCours} />
    </Carte>
  );
}

function Option({
  actif,
  titre,
  valeur,
  onPress,
  palette,
}: {
  actif: boolean;
  titre: string;
  valeur: string;
  onPress: () => void;
  palette: ReturnType<typeof usePalette>;
}) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{ selected: actif }}
      onPress={onPress}
      style={[
        styles.option,
        { borderColor: actif ? palette.primaire : palette.bordure, backgroundColor: actif ? palette.surfaceEnfoncee : 'transparent' },
      ]}
    >
      <Texte variante="legende" couleur="texteSecondaire">
        {titre}
      </Texte>
      <Texte numberOfLines={2}>{valeur}</Texte>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  contenu: { padding: espacements.lg, gap: espacements.lg, flexGrow: 1 },
  carte: { gap: espacements.md },
  champ: { gap: espacements.xs },
  options: { flexDirection: 'row', gap: espacements.sm },
  option: { flex: 1, padding: espacements.sm, borderRadius: rayons.md, borderWidth: 1, gap: 2 },
});

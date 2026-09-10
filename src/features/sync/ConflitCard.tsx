/**
 * Carte d'arbitrage d'un conflit de synchronisation (§4.3). Extrait de
 * app/conflits.tsx : cette logique fait des appels réseau et n'a rien à
 * faire dans app/, qui ne doit contenir ni logique métier ni appel réseau
 * (§3.2) — et ça la rend testable (app/ ne peut pas l'être, expo-router n'est
 * pas transformable par la config Jest de ce projet).
 */
import { Bouton, Carte, Texte } from '@/components';
import { champsEnConflit, type ChampCompare, type Conflit } from '@/domain/sync';
import type { Livre, SaisieLivre } from '@/domain/types';
import { useSnackbar } from '@/features/ui/Snackbar';
import { remplacerLivre, supprimerLivre } from '@/services/api/livres';
import { usePalette } from '@/theme/ThemeProvider';
import { useI18n } from '@/theme/formats';
import { espacements, rayons } from '@/theme/tokens';
import { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSync } from './SyncProvider';

const ARBITRABLES: ChampCompare[] = ['titre', 'auteur', 'editeur', 'annee', 'note'];

/** Dispatch vers la carte adaptée au type de mutation en conflit. */
export function CarteConflit({ conflit }: { conflit: Conflit }) {
  return conflit.mutation.type === 'delete' ? (
    <CarteConflitSuppression conflit={conflit} />
  ) : (
    <CarteConflitMaj conflit={conflit} />
  );
}

/**
 * Conflit sur une suppression hors ligne (BL-04) : il n'y a pas de « valeur
 * locale » à comparer, la seule question est de confirmer la suppression ou
 * de la retirer. Ne jamais réécrire silencieusement la version serveur sur
 * elle-même : ce serait une fusion à vide qui abandonnerait la suppression
 * en se faisant passer pour une réussite.
 */
function CarteConflitSuppression({ conflit }: { conflit: Conflit }) {
  const { t } = useI18n();
  const { afficher } = useSnackbar();
  const { resoudreConflit } = useSync();
  const serveur = conflit.serveur;
  const [action, setAction] = useState<'confirmer' | 'conserver' | null>(null);

  const confirmerSuppression = async () => {
    setAction('confirmer');
    try {
      await supprimerLivre(serveur.id);
      resoudreConflit(conflit.mutation.id);
      afficher(t('conflit.suppressionConfirmee'));
    } catch (e) {
      afficher(e instanceof Error ? e.message : t('etats.erreurTitre'));
    } finally {
      setAction(null);
    }
  };

  const conserverServeur = () => {
    // Rien à envoyer au serveur : sa version fait déjà foi. On abandonne
    // simplement la suppression locale en retirant la mutation de la file.
    resoudreConflit(conflit.mutation.id);
    afficher(t('conflit.suppressionAbandonnee'));
  };

  return (
    <Carte style={styles.carte} testID="carte-conflit">
      <Texte variante="sousTitre">{serveur.titre}</Texte>
      <Texte variante="legende" couleur="texteSecondaire">
        {t('conflit.introSuppression')}
      </Texte>
      <View style={styles.actionsSuppression}>
        <Bouton
          titre={t('conflit.confirmerSuppression')}
          onPress={confirmerSuppression}
          enCours={action === 'confirmer'}
          desactive={action === 'conserver'}
          variante="danger"
          icone="supprimer"
        />
        <Bouton
          titre={t('conflit.conserverServeur')}
          onPress={conserverServeur}
          enCours={action === 'conserver'}
          desactive={action === 'confirmer'}
          variante="secondaire"
        />
      </View>
    </Carte>
  );
}

function valeurLocale(conflit: Conflit): Livre | null {
  return conflit.mutation.type === 'update' ? conflit.mutation.livre : null;
}

function CarteConflitMaj({ conflit }: { conflit: Conflit }) {
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
    <Carte style={styles.carte} testID="carte-conflit">
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

      <Bouton
        titre={t('conflit.appliquer')}
        onPress={appliquer}
        enCours={enCours}
        icone="appliquer"
        testID="appliquer-conflit"
      />
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
  carte: { gap: espacements.md },
  champ: { gap: espacements.xs },
  options: { flexDirection: 'row', gap: espacements.sm },
  option: { flex: 1, padding: espacements.sm, borderRadius: rayons.md, borderWidth: 1, gap: 2 },
  actionsSuppression: { flexDirection: 'row', gap: espacements.sm },
});

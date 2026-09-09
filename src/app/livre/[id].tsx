import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { ScrollView, StyleSheet, View } from 'react-native';

import {
    Bouton,
    Coeur,
    CouvertureImage,
    EtatErreur,
    EtatVide,
    EtoilesNote,
    Squelette,
    Texte,
} from '@/components';
import { ErreurReseau } from '@/domain/erreurs';
import type { Livre } from '@/domain/types';
import {
    BlocEnrichissement,
    useBasculeChamp,
    useLivre,
    useNoterLivre,
    useSuppressionAnnulable,
} from '@/features/books';
import { confirmer } from '@/features/ui/confirmer';
import { useAuth } from '@/features/auth';
import { SectionNotes } from '@/features/notes';
import { resoudreCouverture } from '@/services/couverture';
import { useI18n } from '@/theme/formats';
import { espacements } from '@/theme/tokens';

export default function EcranFiche() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t, formaterDateCourte } = useI18n();
  const q = useLivre(id ?? '');

  const introuvable = q.error instanceof ErreurReseau && q.error.statut === 404;

  return (
    <ScrollView contentContainerStyle={styles.contenu}>
      <Stack.Screen options={{ title: q.data?.titre ?? t('onglets.fonds') }} />

      {q.isLoading ? (
        <View style={styles.entete}>
          <Squelette hauteur={150} largeur={100} />
          <View style={styles.metaSquelette}>
            <Squelette hauteur={22} largeur="80%" />
            <Squelette hauteur={14} largeur="50%" />
            <Squelette hauteur={14} largeur="40%" />
          </View>
        </View>
      ) : introuvable ? (
        <EtatVide titre={t('etats.videTitre')} message={t('etats.introuvable')} />
      ) : q.isError ? (
        <EtatErreur
          titre={t('etats.erreurTitre')}
          message={q.error instanceof Error ? q.error.message : undefined}
          libelleReessai={t('actions.reessayer')}
          onReessayer={() => q.refetch()}
        />
      ) : q.data ? (
        <Fiche
          livre={q.data}
          onModifier={() =>
            router.push({ pathname: '/livre/[id]/modifier', params: { id: q.data.id } })
          }
          onSupprimer={() => router.back()}
          dateLabel={formaterDateCourte(q.data.updatedAt)}
        />
      ) : null}
    </ScrollView>
  );
}

function Fiche({
  livre,
  onModifier,
  onSupprimer,
  dateLabel,
}: {
  livre: Livre;
  onModifier: () => void;
  onSupprimer: () => void;
  dateLabel: string;
}) {
  const { t } = useI18n();
  const { peutEcrire } = useAuth();
  const lu = useBasculeChamp(livre, 'lu');
  const favori = useBasculeChamp(livre, 'favori');
  const noter = useNoterLivre(livre);
  const supprimer = useSuppressionAnnulable();

  const demanderSuppression = async () => {
    const ok = await confirmer(
      t('actions.supprimer'),
      livre.titre,
      t('actions.supprimer'),
      t('actions.annuler'),
    );
    if (ok) supprimer(livre.id, onSupprimer);
  };

  return (
    <View style={styles.corps}>
      <View style={styles.entete}>
        <CouvertureImage
          uri={resoudreCouverture(livre.couverture, livre.id)}
          titre={livre.titre}
          largeur={100}
          hauteur={150}
        />
        <View style={styles.meta}>
          <Texte variante="titre">{livre.titre}</Texte>
          <Texte couleur="texteSecondaire">{livre.auteur}</Texte>
          {livre.editeur ? <Texte couleur="texteSecondaire">{livre.editeur}</Texte> : null}
          <Texte couleur="texteSecondaire">{livre.annee}</Texte>
          <View style={styles.ligneCoeur}>
            <Coeur actif={livre.favori} onToggle={() => favori.mutate()} libelle={t('livre.favori')} />
          </View>
          <EtoilesNote
            valeur={livre.note}
            onChange={peutEcrire ? (n) => noter.mutate(n) : undefined}
            libelle={t('livre.note')}
            taille={24}
          />
          <BlocEnrichissement titre={livre.titre} />
        </View>
      </View>

      {peutEcrire ? (
        <Bouton
          titre={livre.lu ? t('livre.marquerNonLu') : t('livre.marquerLu')}
          onPress={() => lu.mutate()}
          variante="secondaire"
        />
      ) : null}

      <Texte variante="legende" couleur="texteSecondaire">
        {t('stats.majLe', { date: dateLabel })}
      </Texte>

      {peutEcrire ? (
        <View style={styles.actions}>
          <Bouton titre={t('actions.modifier')} onPress={onModifier} style={styles.flex} />
          <Bouton
            titre={t('actions.supprimer')}
            onPress={demanderSuppression}
            variante="danger"
            style={styles.flex}
          />
        </View>
      ) : null}

      <SectionNotes livreId={livre.id} lectureSeule={!peutEcrire} />
    </View>
  );
}

const styles = StyleSheet.create({
  contenu: { padding: espacements.lg, gap: espacements.lg, flexGrow: 1 },
  corps: { gap: espacements.lg },
  entete: { flexDirection: 'row', gap: espacements.lg },
  meta: { flex: 1, gap: espacements.xs },
  metaSquelette: { flex: 1, gap: espacements.sm, justifyContent: 'center' },
  ligneCoeur: { flexDirection: 'row', alignItems: 'center', gap: espacements.sm, marginTop: espacements.xs },
  actions: { flexDirection: 'row', gap: espacements.md },
  flex: { flex: 1 },
});

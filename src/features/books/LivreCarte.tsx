/**
 * Ligne d'ouvrage dans la liste (composant de feature). Mémoïsée pour la
 * performance sur 500 ouvrages : la frappe dans la recherche ne la re-rend pas.
 */
import { Coeur, CouvertureImage, Icone, Texte } from '@/components';
import type { Livre } from '@/domain/types';
import { useAuth } from '@/features/auth';
import { resoudreCouverture } from '@/services/couverture';
import { usePalette } from '@/theme/ThemeProvider';
import { useI18n } from '@/theme/formats';
import { espacements, ombres, rayons } from '@/theme/tokens';
import { memo, useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useBasculeChamp } from './mutations';
import type { ModeAffichageLivres } from './useModeAffichageLivres';

type Props = { livre: Livre; onOuvrir: (id: string) => void; mode?: ModeAffichageLivres };

function LivreCarteBrut({ livre, onOuvrir, mode = 'ligne' }: Props) {
  const palette = usePalette();
  const { t } = useI18n();
  const { peutEcrire } = useAuth();
  const [survol, setSurvol] = useState(false);
  const favori = useBasculeChamp(livre, 'favori');
  const ouvrir = useCallback(() => onOuvrir(livre.id), [onOuvrir, livre.id]);
  const grille = mode === 'grille';
  const couleurStatut = livre.lu ? 'succesTexte' : 'texteSecondaire';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${livre.titre}, ${livre.auteur}`}
      testID="livre-carte"
      onPress={ouvrir}
      onHoverIn={() => setSurvol(true)}
      onHoverOut={() => setSurvol(false)}
      style={({ pressed }) => [
        styles.carte,
        grille ? styles.grille : styles.ligne,
        {
          backgroundColor: pressed ? palette.surfaceEnfoncee : survol ? palette.surfaceHaute : palette.surface,
          borderColor: palette.bordure,
          shadowColor: palette.ombre,
          transform: [{ translateY: survol ? -2 : 0 }],
        },
        survol && styles.survol,
      ]}
    >
      <View
        style={[
          styles.couverture,
          grille ? styles.couvertureGrille : styles.couvertureLigne,
          { shadowColor: palette.ombre, transform: [{ scale: survol ? 1.025 : 1 }] },
        ]}
      >
        <CouvertureImage
          uri={resoudreCouverture(livre.couverture, livre.id)}
          titre={livre.titre}
          largeur="100%"
          hauteur="100%"
        />
      </View>
      <View style={[styles.infos, grille && styles.infosGrille]}>
        <Texte variante="sousTitre" numberOfLines={grille ? 2 : 1}>
          {livre.titre}
        </Texte>
        <Texte couleur="texteSecondaire" numberOfLines={1}>
          {livre.auteur} · {livre.annee}
        </Texte>
        <View style={styles.badges}>
          <View
            style={[
              styles.puce,
              { backgroundColor: livre.lu ? palette.succesConteneur : palette.surfaceEnfoncee },
            ]}
          >
            <Icone nom={livre.lu ? 'appliquer' : 'horloge'} couleur={couleurStatut} taille={12} />
            <Texte variante="legende" couleur={couleurStatut}>
              {livre.lu ? t('livre.lu') : t('livre.nonLu')}
            </Texte>
          </View>
          {livre.favori ? (
            <View style={[styles.puce, { backgroundColor: palette.dangerConteneur }]}>
              <Icone nom="coeur" couleur="dangerConteneurTexte" taille={12} />
              <Texte variante="legende" couleur="dangerConteneurTexte">
                {t('livre.favori')}
              </Texte>
            </View>
          ) : null}
          {livre.note !== null ? (
            <View style={[styles.puce, { backgroundColor: palette.avertissementConteneur }]}>
              <Icone nom="etoile" couleur="avertissementTexte" taille={12} />
              <Texte variante="legende" couleur="avertissementTexte">
                {livre.note}
              </Texte>
            </View>
          ) : null}
        </View>
      </View>
      {peutEcrire ? (
        <View style={[styles.actions, grille && styles.actionsGrille, { opacity: survol || livre.favori ? 1 : 0.88 }]}>
          <Coeur actif={livre.favori} onToggle={() => favori.mutate()} libelle={t('livre.favori')} />
        </View>
      ) : null}
    </Pressable>
  );
}

export const LivreCarte = memo(LivreCarteBrut);

const styles = StyleSheet.create({
  carte: {
    borderRadius: rayons.lg,
    borderWidth: StyleSheet.hairlineWidth,
    ...ombres.niveau1,
  },
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacements.md,
    padding: espacements.sm,
  },
  grille: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: espacements.md,
    minWidth: 0,
    padding: espacements.sm,
  },
  survol: ombres.niveau2,
  couverture: {
    overflow: 'hidden',
    borderRadius: rayons.md,
    ...ombres.niveau1,
  },
  couvertureLigne: { width: 58, height: 86 },
  couvertureGrille: { width: '100%', height: 190 },
  infos: { flex: 1, gap: 2 },
  infosGrille: { flex: 0, gap: espacements.xs },
  badges: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: espacements.xs, marginTop: 2 },
  puce: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: espacements.sm,
    paddingVertical: 3,
    borderRadius: rayons.rond,
  },
  actions: { alignItems: 'center', justifyContent: 'center' },
  actionsGrille: { position: 'absolute', top: espacements.sm, right: espacements.sm },
});

/**
 * Ligne d'ouvrage dans la liste (composant de feature). Mémoïsée pour la
 * performance sur 500 ouvrages : la frappe dans la recherche ne la re-rend pas.
 */
import { Coeur, CouvertureImage, Texte } from '@/components';
import type { Livre } from '@/domain/types';
import { resoudreCouverture } from '@/services/couverture';
import { usePalette } from '@/theme/ThemeProvider';
import { useI18n } from '@/theme/formats';
import { espacements, rayons } from '@/theme/tokens';
import { memo, useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useBasculeChamp } from './mutations';

type Props = { livre: Livre; onOuvrir: (id: string) => void };

function LivreCarteBrut({ livre, onOuvrir }: Props) {
  const palette = usePalette();
  const { t } = useI18n();
  const favori = useBasculeChamp(livre, 'favori');
  const ouvrir = useCallback(() => onOuvrir(livre.id), [onOuvrir, livre.id]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${livre.titre}, ${livre.auteur}`}
      onPress={ouvrir}
      style={({ pressed }) => [
        styles.ligne,
        { backgroundColor: pressed ? palette.surfaceEnfoncee : palette.surface, borderColor: palette.bordure },
      ]}
    >
      <CouvertureImage uri={resoudreCouverture(livre.couverture, livre.id)} titre={livre.titre} />
      <View style={styles.infos}>
        <Texte variante="sousTitre" numberOfLines={1}>
          {livre.titre}
        </Texte>
        <Texte couleur="texteSecondaire" numberOfLines={1}>
          {livre.auteur} · {livre.annee}
        </Texte>
        <View style={styles.badges}>
          <View style={[styles.puce, { backgroundColor: livre.lu ? palette.succes : palette.surfaceEnfoncee }]}>
            <Texte variante="legende" couleur={livre.lu ? 'texteInverse' : 'texteSecondaire'}>
              {livre.lu ? t('livre.lu') : t('livre.nonLu')}
            </Texte>
          </View>
          {livre.note !== null ? (
            <Texte variante="legende" couleur="texteSecondaire">
              ★ {livre.note}
            </Texte>
          ) : null}
        </View>
      </View>
      <Coeur
        actif={livre.favori}
        onToggle={() => favori.mutate()}
        libelle={t('livre.favori')}
      />
    </Pressable>
  );
}

export const LivreCarte = memo(LivreCarteBrut);

const styles = StyleSheet.create({
  ligne: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacements.md,
    padding: espacements.md,
    borderRadius: rayons.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  infos: { flex: 1, gap: 2 },
  badges: { flexDirection: 'row', alignItems: 'center', gap: espacements.sm, marginTop: 2 },
  puce: { paddingHorizontal: espacements.sm, paddingVertical: 2, borderRadius: rayons.rond },
});

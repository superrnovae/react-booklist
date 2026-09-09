/**
 * Image de couverture (UI pure). Reçoit l'URI déjà résolue (voir
 * services/couverture) : jamais d'URL en dur ici. En cas d'échec de chargement,
 * on affiche un repli coloré plutôt qu'une image cassée.
 */
import { usePalette } from '@/theme/ThemeProvider';
import { rayons } from '@/theme/tokens';
import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, View, type DimensionValue } from 'react-native';
import { Texte } from './Texte';

type Props = {
  uri: string;
  titre: string;
  largeur?: DimensionValue;
  hauteur?: DimensionValue;
};

export function CouvertureImage({ uri, titre, largeur = 56, hauteur = 84 }: Props) {
  const palette = usePalette();
  const [echec, setEchec] = useState(false);

  const cadre = { width: largeur, height: hauteur, borderRadius: rayons.sm };

  if (echec) {
    return (
      <View
        style={[cadre, styles.repli, { backgroundColor: palette.surfaceEnfoncee }]}
        accessibilityRole="image"
        accessibilityLabel={titre}
      >
        <Texte variante="legende" couleur="texteSecondaire" numberOfLines={2} style={styles.repliTexte}>
          {titre}
        </Texte>
      </View>
    );
  }

  return (
    <Image
      source={{ uri }}
      style={cadre}
      contentFit="cover"
      transition={150}
      onError={() => setEchec(true)}
      accessibilityLabel={titre}
      accessible
    />
  );
}

const styles = StyleSheet.create({
  repli: { alignItems: 'center', justifyContent: 'center', padding: 4 },
  repliTexte: { textAlign: 'center' },
});

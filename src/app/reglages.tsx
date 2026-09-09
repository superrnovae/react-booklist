import { Stack } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { Bouton, Carte, Texte } from '@/components';
import { useAuth } from '@/features/auth';
import { usePalette, useTheme, type ModeTheme } from '@/theme/ThemeProvider';
import { useI18n } from '@/theme/formats';
import { changerLangue, type Langue } from '@/theme/i18n';
import { CIBLE_TACTILE, espacements, rayons } from '@/theme/tokens';

function Choix<T extends string>({
  options,
  valeur,
  onChoisir,
}: {
  options: { valeur: T; libelle: string }[];
  valeur: T;
  onChoisir: (v: T) => void;
}) {
  const palette = usePalette();
  return (
    <View style={styles.groupe}>
      {options.map((o) => {
        const actif = o.valeur === valeur;
        return (
          <Pressable
            key={o.valeur}
            accessibilityRole="radio"
            accessibilityState={{ selected: actif }}
            accessibilityLabel={o.libelle}
            onPress={() => onChoisir(o.valeur)}
            style={[
              styles.option,
              { borderColor: actif ? palette.primaire : palette.bordure, backgroundColor: actif ? palette.primaire : 'transparent' },
            ]}
          >
            <Texte couleur={actif ? 'primaireTexte' : 'texte'}>{o.libelle}</Texte>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function EcranReglages() {
  const { mode, definirMode } = useTheme();
  const { t, langue } = useI18n();
  const { utilisateur, authRequise, deconnexion } = useAuth();

  return (
    <ScrollView contentContainerStyle={styles.contenu}>
      <Stack.Screen options={{ title: t('reglages.titre') }} />

      {authRequise && utilisateur ? (
        <Carte style={styles.carte}>
          <Texte variante="sousTitre">{utilisateur.email}</Texte>
          <Texte variante="legende" couleur="texteSecondaire">
            {utilisateur.role === 'editeur' ? t('auth.editeur') : t('auth.lecteur')}
          </Texte>
          <Bouton titre={t('auth.seDeconnecter')} onPress={() => void deconnexion()} variante="danger" />
        </Carte>
      ) : null}

      <Carte style={styles.carte}>
        <Texte variante="sousTitre">{t('reglages.theme')}</Texte>
        <Choix<ModeTheme>
          valeur={mode}
          onChoisir={definirMode}
          options={[
            { valeur: 'clair', libelle: t('reglages.clair') },
            { valeur: 'sombre', libelle: t('reglages.sombre') },
            { valeur: 'systeme', libelle: t('reglages.systeme') },
          ]}
        />
      </Carte>

      <Carte style={styles.carte}>
        <Texte variante="sousTitre">{t('reglages.langue')}</Texte>
        <Choix<Langue>
          valeur={langue}
          onChoisir={(l) => void changerLangue(l)}
          options={[
            { valeur: 'fr', libelle: t('reglages.francais') },
            { valeur: 'en', libelle: t('reglages.anglais') },
          ]}
        />
      </Carte>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenu: { padding: espacements.lg, gap: espacements.lg },
  carte: { gap: espacements.md },
  groupe: { flexDirection: 'row', gap: espacements.sm, flexWrap: 'wrap' },
  option: {
    minHeight: CIBLE_TACTILE,
    justifyContent: 'center',
    paddingHorizontal: espacements.lg,
    borderRadius: rayons.md,
    borderWidth: 1,
  },
});

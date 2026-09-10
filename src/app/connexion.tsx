import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { Bouton, Carte, Champ, Texte } from '@/components';
import { ErreurAuth } from '@/domain/erreurs';
import { useAuth } from '@/features/auth';
import { usePalette } from '@/theme/ThemeProvider';
import { useI18n } from '@/theme/formats';
import { espacements } from '@/theme/tokens';

export default function EcranConnexion() {
  const router = useRouter();
  const { de } = useLocalSearchParams<{ de?: string }>();
  const { t } = useI18n();
  const palette = usePalette();
  const { connexion } = useAuth();

  const [email, setEmail] = useState('');
  const [motDePasse, setMotDePasse] = useState('');
  const [erreur, setErreur] = useState<string>();
  const [enCours, setEnCours] = useState(false);

  const soumettre = async () => {
    setErreur(undefined);
    setEnCours(true);
    try {
      await connexion(email.trim(), motDePasse);
      router.replace((de as '/' | undefined) ?? '/');
    } catch (e) {
      setErreur(
        e instanceof ErreurAuth ? t('auth.identifiantsInvalides') : t('etats.erreurTitre'),
      );
    } finally {
      setEnCours(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: t('auth.connexion'), headerBackVisible: false }} />

      <View style={styles.hero}>
        <View style={[styles.logo, { backgroundColor: palette.primaireConteneur }]}>
          <Texte couleur="primaireConteneurTexte" variante="titre">
            B
          </Texte>
        </View>
        <Texte variante="titre" style={styles.centreTexte}>
          {t('app.titre')}
        </Texte>
        <Texte couleur="texteSecondaire" style={styles.centreTexte}>
          {t('app.sousTitre')}
        </Texte>
      </View>

      <Carte style={styles.carte}>
        <Champ
          libelle={t('auth.email')}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          autoComplete="email"
        />
        <Champ
          libelle={t('auth.motDePasse')}
          value={motDePasse}
          onChangeText={setMotDePasse}
          secureTextEntry
          autoComplete="password"
        />
        {erreur ? (
          <Texte couleur="danger" accessibilityRole="alert">
            {erreur}
          </Texte>
        ) : null}
        <Bouton
          titre={t('auth.seConnecter')}
          onPress={soumettre}
          enCours={enCours}
          desactive={email.trim().length === 0 || motDePasse.length === 0}
          icone="connexion"
        />
      </Carte>

      <View style={styles.aide}>
        <Texte variante="legende" couleur="texteSecondaire">
          {t('auth.editeur')} : editeur@booklist.fr / editeur123
        </Texte>
        <Texte variante="legende" couleur="texteSecondaire">
          {t('auth.lecteur')} : lecteur@booklist.fr / lecteur123
        </Texte>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenu: {
    padding: espacements.lg,
    gap: espacements.md,
    flexGrow: 1,
    justifyContent: 'center',
    width: '100%',
    maxWidth: 520,
    alignSelf: 'center',
  },
  hero: { alignItems: 'center', gap: espacements.xs, marginBottom: espacements.sm },
  logo: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  centreTexte: { textAlign: 'center' },
  carte: { gap: espacements.md },
  aide: { gap: espacements.xs, marginTop: espacements.md },
});

import { Stack, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Icone, Texte } from '@/components';
import { useAuth } from '@/features/auth';
import {
  BarreRecherche,
  ListeLivres,
  useModeAffichageLivres,
  type EtatFiltres,
} from '@/features/books';
import { usePalette } from '@/theme/ThemeProvider';
import { useI18n } from '@/theme/formats';
import { CIBLE_TACTILE, espacements, rayons } from '@/theme/tokens';

export default function EcranFonds() {
  const router = useRouter();
  const { t } = useI18n();
  const palette = usePalette();
  const { peutEcrire } = useAuth();
  const { mode, definirMode } = useModeAffichageLivres();
  const [filtres, setFiltres] = useState<EtatFiltres>({ sort: 'titre', order: 'asc' });

  const ouvrir = useCallback(
    (id: string) => router.push({ pathname: '/livre/[id]', params: { id } }),
    [router],
  );

  const changer = useCallback(
    (patch: Partial<EtatFiltres>) => setFiltres((f) => ({ ...f, ...patch })),
    [],
  );

  return (
    <View style={styles.plein}>
      <Stack.Screen
        options={{
          title: t('onglets.fonds'),
          headerRight: () => (
            <View style={styles.actions}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('stats.titre')}
                onPress={() => router.push('/stats')}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.rond,
                  { backgroundColor: pressed ? palette.surfaceEnfoncee : palette.surfaceHaute },
                ]}
              >
                <Icone nom="stats" taille={17} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('reglages.titre')}
                onPress={() => router.push('/reglages')}
                hitSlop={8}
                style={({ pressed }) => [
                  styles.rond,
                  { backgroundColor: pressed ? palette.surfaceEnfoncee : palette.surfaceHaute },
                ]}
              >
                <Icone nom="reglages" taille={17} />
              </Pressable>
              {peutEcrire ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t('livre.nouveau')}
                  testID="ajouter-livre"
                  onPress={() => router.push('/livre/nouveau')}
                  hitSlop={8}
                  style={({ pressed }) => [
                    styles.ajout,
                    { backgroundColor: pressed ? palette.surfaceEnfoncee : palette.primaireConteneur },
                  ]}
                >
                    <Icone nom="ajouter" couleur="primaireConteneurTexte" taille={16} />
                  <Texte couleur="primaireConteneurTexte" variante="bouton">
                    {t('actions.ajouter')}
                  </Texte>
                </Pressable>
              ) : null}
            </View>
          ),
        }}
      />
      <ListeLivres
        filtres={filtres}
        onOuvrir={ouvrir}
        modeAffichage={mode}
        entete={
          <BarreRecherche
            filtres={filtres}
            onChange={changer}
            modeAffichage={mode}
            onModeAffichageChange={definirMode}
          />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  plein: { flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: espacements.sm },
  rond: {
    minWidth: CIBLE_TACTILE,
    minHeight: CIBLE_TACTILE,
    borderRadius: rayons.rond,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ajout: {
    minHeight: CIBLE_TACTILE,
    paddingHorizontal: espacements.md,
    borderRadius: rayons.rond,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: espacements.xs,
  },
});

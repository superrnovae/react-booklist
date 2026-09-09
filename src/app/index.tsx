import { useRouter, Stack } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';
import { useCallback, useState } from 'react';

import { BarreRecherche, ListeLivres, type EtatFiltres } from '@/features/books';
import { Texte } from '@/components';
import { espacements } from '@/theme/tokens';
import { useI18n } from '@/theme/formats';

export default function EcranFonds() {
  const router = useRouter();
  const { t } = useI18n();
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
              >
                <Texte style={styles.icone}>📊</Texte>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('reglages.titre')}
                onPress={() => router.push('/reglages')}
                hitSlop={8}
              >
                <Texte style={styles.icone}>⚙︎</Texte>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('livre.nouveau')}
                onPress={() => router.push('/livre/nouveau')}
                hitSlop={8}
              >
                <Texte couleur="primaire" variante="sousTitre">
                  ＋ {t('actions.ajouter')}
                </Texte>
              </Pressable>
            </View>
          ),
        }}
      />
      <ListeLivres
        filtres={filtres}
        onOuvrir={ouvrir}
        entete={<BarreRecherche filtres={filtres} onChange={changer} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  plein: { flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: espacements.lg },
  icone: { fontSize: 18 },
});

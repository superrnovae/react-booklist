import { Stack, useRouter } from 'expo-router';
import { useCallback } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Texte } from '@/components';
import { ListeLivres } from '@/features/books';
import { usePalette } from '@/theme/ThemeProvider';
import { useI18n } from '@/theme/formats';
import { espacements } from '@/theme/tokens';

export default function EcranFonds() {
  const router = useRouter();
  const palette = usePalette();
  const { t } = useI18n();

  const ouvrir = useCallback(
    (id: string) => router.push({ pathname: '/livre/[id]', params: { id } }),
    [router],
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
      <ListeLivres filtres={{}} onOuvrir={ouvrir} />
      <View style={[styles.pied, { borderTopColor: palette.bordure }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  plein: { flex: 1 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: espacements.lg },
  icone: { fontSize: 18 },
  pied: { borderTopWidth: 0 },
});

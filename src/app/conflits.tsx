import { Stack } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import { EtatVide } from '@/components';
import { CarteConflit, useSync } from '@/features/sync';
import { useI18n } from '@/theme/formats';
import { espacements } from '@/theme/tokens';

export default function EcranConflits() {
  const { t } = useI18n();
  const { conflits } = useSync();

  return (
    <ScrollView contentContainerStyle={styles.contenu}>
      <Stack.Screen options={{ title: t('conflit.titre') }} />
      {conflits.length === 0 ? (
        <EtatVide titre={t('conflit.titre')} message={t('etats.videTitre')} />
      ) : (
        conflits.map((c) => <CarteConflit key={c.mutation.id} conflit={c} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenu: { padding: espacements.lg, gap: espacements.lg, flexGrow: 1 },
});

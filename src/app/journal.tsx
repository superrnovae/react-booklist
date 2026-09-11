import { Stack } from 'expo-router';

import { EcranJournal } from '@/features/journal';
import { useI18n } from '@/theme/formats';

export default function EcranJournalRoute() {
  const { t } = useI18n();
  return (
    <>
      <Stack.Screen options={{ title: t('journal.titre') }} />
      <EcranJournal />
    </>
  );
}

import { useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { ScrollView, StyleSheet } from 'react-native';

import type { SaisieLivre } from '@/domain/types';
import { ErreurValidation } from '@/domain/erreurs';
import { FormulaireLivre, useActionsLivre } from '@/features/books';
import { useSnackbar } from '@/features/ui/Snackbar';
import { espacements } from '@/theme/tokens';
import { useI18n } from '@/theme/formats';

export default function EcranNouveau() {
  const router = useRouter();
  const { t } = useI18n();
  const { afficher } = useSnackbar();
  const { creer } = useActionsLivre();
  const [erreursServeur, setErreursServeur] = useState<Record<string, string>>();
  const [enCours, setEnCours] = useState(false);

  const soumettre = async (saisie: SaisieLivre) => {
    setErreursServeur(undefined);
    setEnCours(true);
    try {
      await creer(saisie);
      afficher(t('messages.ajoutReussi'));
      router.back();
    } catch (e) {
      if (e instanceof ErreurValidation) setErreursServeur(e.champs);
      else afficher(e instanceof Error ? e.message : t('etats.erreurTitre'));
    } finally {
      setEnCours(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: t('livre.nouveau') }} />
      <FormulaireLivre
        enCours={enCours}
        erreursServeur={erreursServeur}
        libelleAction={t('actions.ajouter')}
        onSoumettre={soumettre}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenu: { padding: espacements.lg },
});

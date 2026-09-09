import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';

import { ErreurValidation } from '@/domain/erreurs';
import type { SaisieLivre } from '@/domain/types';
import { FormulaireLivre, useCreerLivre } from '@/features/books';
import { useSnackbar } from '@/features/ui/Snackbar';
import { useI18n } from '@/theme/formats';
import { espacements } from '@/theme/tokens';

export default function EcranNouveau() {
  const router = useRouter();
  const { t } = useI18n();
  const { afficher } = useSnackbar();
  const creer = useCreerLivre();
  const [erreursServeur, setErreursServeur] = useState<Record<string, string>>();

  const soumettre = (saisie: SaisieLivre) => {
    setErreursServeur(undefined);
    creer.mutate(saisie, {
      onSuccess: () => {
        afficher(t('messages.ajoutReussi'));
        router.back();
      },
      onError: (e) => {
        if (e instanceof ErreurValidation) setErreursServeur(e.champs);
        else afficher(e instanceof Error ? e.message : t('etats.erreurTitre'));
      },
    });
  };

  return (
    <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: t('livre.nouveau') }} />
      <FormulaireLivre
        enCours={creer.isPending}
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

import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { EtatErreur, Squelette } from '@/components';
import { ErreurConflit, ErreurValidation } from '@/domain/erreurs';
import type { SaisieLivre } from '@/domain/types';
import {
    FormulaireLivre,
    useEnregistrerLivre,
    useLivre,
    type ValeursFormulaireLivre,
} from '@/features/books';
import { useSnackbar } from '@/features/ui/Snackbar';
import { useI18n } from '@/theme/formats';
import { espacements } from '@/theme/tokens';

export default function EcranModifier() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { t } = useI18n();
  const { afficher } = useSnackbar();
  const q = useLivre(id ?? '');
  const enregistrer = useEnregistrerLivre(id ?? '');
  const [erreursServeur, setErreursServeur] = useState<Record<string, string>>();

  const soumettre = (saisie: SaisieLivre) => {
    if (!q.data) return;
    setErreursServeur(undefined);
    enregistrer.mutate(
      { saisie: { ...saisie, couverture: q.data.couverture }, version: q.data.version },
      {
        onSuccess: () => {
          afficher(t('messages.majReussie'));
          router.back();
        },
        onError: (e) => {
          if (e instanceof ErreurValidation) setErreursServeur(e.champs);
          else if (e instanceof ErreurConflit) {
            afficher(t('reseau.conflit'));
            void q.refetch();
          } else afficher(e instanceof Error ? e.message : t('etats.erreurTitre'));
        },
      },
    );
  };

  const valeursInitiales: Partial<ValeursFormulaireLivre> | undefined = q.data
    ? {
        titre: q.data.titre,
        auteur: q.data.auteur,
        editeur: q.data.editeur,
        annee: q.data.annee,
        lu: q.data.lu,
        favori: q.data.favori,
        note: q.data.note,
      }
    : undefined;

  return (
    <ScrollView contentContainerStyle={styles.contenu} keyboardShouldPersistTaps="handled">
      <Stack.Screen options={{ title: t('livre.edition') }} />
      {q.isLoading ? (
        <View style={styles.squelette}>
          <Squelette hauteur={44} />
          <Squelette hauteur={44} />
          <Squelette hauteur={44} />
        </View>
      ) : q.isError ? (
        <EtatErreur
          titre={t('etats.erreurTitre')}
          message={q.error instanceof Error ? q.error.message : undefined}
          libelleReessai={t('actions.reessayer')}
          onReessayer={() => q.refetch()}
        />
      ) : (
        <FormulaireLivre
          valeursInitiales={valeursInitiales}
          enCours={enregistrer.isPending}
          erreursServeur={erreursServeur}
          libelleAction={t('actions.enregistrer')}
          onSoumettre={soumettre}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contenu: { padding: espacements.lg },
  squelette: { gap: espacements.lg },
});

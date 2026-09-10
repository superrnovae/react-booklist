/**
 * Suppression avec annulation pendant 5 s (§ Lot 1). La suppression serveur est
 * différée : pendant la fenêtre d'annulation, l'ouvrage disparaît de la liste
 * mais n'est pas encore supprimé côté API ; « Annuler » le fait réapparaître.
 */
import type { Livre } from '@/domain/types';
import { useSnackbar } from '@/features/ui/Snackbar';
import { useI18n } from '@/theme/formats';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { clesLivres } from './cles';
import { useSupprimerLivre } from './mutations';

type PagesInfinies = { pages: { items: Livre[] }[]; pageParams: unknown[] };

export function useSuppressionAnnulable() {
  const qc = useQueryClient();
  const { afficher } = useSnackbar();
  const { t } = useI18n();
  const supprimer = useSupprimerLivre();

  return useCallback(
    (id: string, apres?: () => void) => {
      let annule = false;

      qc.setQueriesData<PagesInfinies>({ queryKey: clesLivres.listes() }, (donnees) =>
        donnees
          ? {
              ...donnees,
              pages: donnees.pages.map((p) => ({
                ...p,
                items: p.items.filter((l) => l.id !== id),
              })),
            }
          : donnees,
      );

      const minuteur = setTimeout(() => {
        if (!annule) supprimer.mutate(id);
      }, 5000);

      afficher(t('messages.suppressionAnnulable'), {
        dureeMs: 5000,
        action: {
          libelle: t('actions.annulerSuppression'),
          onPress: () => {
            annule = true;
            clearTimeout(minuteur);
            void qc.invalidateQueries({ queryKey: clesLivres.listes() });
          },
        },
      });

      apres?.();
    },
    [qc, afficher, t, supprimer],
  );
}

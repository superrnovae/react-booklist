/**
 * Hooks de mutation des ouvrages. Invalidation des listes après écriture ;
 * mise à jour optimiste sur la bascule lu/favori avec retour arrière.
 *
 * Hors ligne (§4.2, BL-05) : la note, le cœur et le statut de lecture sont
 * mis en file au même titre qu'une modification complète, via le même type
 * de mutation 'update' — ce sont des écritures partielles d'un Livre comme
 * les autres. Pas de retour arrière optimiste hors ligne : la mise à jour
 * reste appliquée jusqu'à ce qu'un conflit ou un rejet de synchronisation la
 * contredise (déjà géré par l'écran de conflits et la snackbar de rejet).
 */
import type { Livre, SaisieLivre } from '@/domain/types';
import { useSync } from '@/features/sync/SyncProvider';
import { modifierLivre, supprimerLivre } from '@/services/api/livres';
import { genererId } from '@/services/id';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { clesLivres } from './cles';

export function useSupprimerLivre() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => supprimerLivre(id),
    onSuccess: (_res, id) => {
      qc.removeQueries({ queryKey: clesLivres.detail(id) });
      void qc.invalidateQueries({ queryKey: clesLivres.listes() });
    },
  });
}

type ChampBascule = 'lu' | 'favori';

type PagesInfinies = { pages: { items: Livre[] }[]; pageParams: unknown[] };

function patcherListes(qc: ReturnType<typeof useQueryClient>, id: string, champ: ChampBascule, valeur: boolean) {
  qc.setQueriesData<PagesInfinies>({ queryKey: clesLivres.listes() }, (donnees) => {
    if (!donnees) return donnees;
    return {
      ...donnees,
      pages: donnees.pages.map((p) => ({
        ...p,
        items: p.items.map((l) => (l.id === id ? { ...l, [champ]: valeur } : l)),
      })),
    };
  });
}

/** Attribue une note 0–5 (optimiste sur le détail). */
export function useNoterLivre(livre: Livre) {
  const qc = useQueryClient();
  const { enLigne, enfiler } = useSync();
  return useMutation({
    mutationFn: async (note: number) => {
      if (enLigne) return modifierLivre(livre.id, { note }, livre.version);
      const local: Livre = { ...livre, note, updatedAt: new Date().toISOString() };
      await enfiler({
        id: genererId(),
        type: 'update',
        horodatage: local.updatedAt,
        livre: local,
        baseVersion: livre.version,
      });
      return local;
    },
    onMutate: async (note) => {
      const cle = clesLivres.detail(livre.id);
      await qc.cancelQueries({ queryKey: cle });
      const precedent = qc.getQueryData<Livre>(cle);
      qc.setQueryData<Livre>(cle, (a) => (a ? { ...a, note } : a));
      return { precedent };
    },
    onError: (_e, _v, contexte) => {
      if (contexte?.precedent) qc.setQueryData(clesLivres.detail(livre.id), contexte.precedent);
    },
    onSuccess: (maj) => qc.setQueryData(clesLivres.detail(livre.id), maj),
    onSettled: () => qc.invalidateQueries({ queryKey: clesLivres.listes() }),
  });
}

/** Bascule optimiste d'un champ booléen (cœur, statut de lecture), listes comprises. */
export function useBasculeChamp(livre: Livre, champ: ChampBascule) {
  const qc = useQueryClient();
  const { enLigne, enfiler } = useSync();
  return useMutation({
    mutationFn: async () => {
      const cible = !livre[champ];
      if (enLigne) {
        return modifierLivre(livre.id, { [champ]: cible } as Partial<SaisieLivre>, livre.version);
      }
      const local: Livre = { ...livre, [champ]: cible, updatedAt: new Date().toISOString() };
      await enfiler({
        id: genererId(),
        type: 'update',
        horodatage: local.updatedAt,
        livre: local,
        baseVersion: livre.version,
      });
      return local;
    },
    onMutate: async () => {
      const cle = clesLivres.detail(livre.id);
      await qc.cancelQueries({ queryKey: cle });
      const precedent = qc.getQueryData<Livre>(cle);
      const cible = !livre[champ];
      qc.setQueryData<Livre>(cle, (a) => (a ? { ...a, [champ]: cible } : a));
      patcherListes(qc, livre.id, champ, cible);
      return { precedent };
    },
    onError: (_e, _v, contexte) => {
      if (contexte?.precedent) qc.setQueryData(clesLivres.detail(livre.id), contexte.precedent);
      patcherListes(qc, livre.id, champ, livre[champ]);
    },
    onSuccess: (maj) => qc.setQueryData(clesLivres.detail(livre.id), maj),
    onSettled: () => qc.invalidateQueries({ queryKey: clesLivres.listes() }),
  });
}

/**
 * Actions d'écriture sur un ouvrage, conscientes du réseau (§ Lot 4.2).
 * En ligne : appel direct de l'API. Hors ligne : mise à jour optimiste du cache
 * + mise en file persistée (rejeu idempotent au retour du réseau).
 */
import type { Livre, SaisieLivre } from '@/domain/types';
import { useSync } from '@/features/sync/SyncProvider';
import { creerLivre, remplacerLivre, supprimerLivre } from '@/services/api/livres';
import { genererId } from '@/services/id';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';
import { clesLivres } from './cles';

type Pages = { pages: { items: Livre[] }[]; pageParams: unknown[] };

export function useActionsLivre() {
  const qc = useQueryClient();
  const { enLigne, enfiler } = useSync();

  const patchListes = useCallback(
    (transforme: (items: Livre[], premiere: boolean) => Livre[]) => {
      qc.setQueriesData<Pages>({ queryKey: clesLivres.listes() }, (d) =>
        d
          ? { ...d, pages: d.pages.map((p, i) => ({ ...p, items: transforme(p.items, i === 0) })) }
          : d,
      );
    },
    [qc],
  );

  const creer = useCallback(
    async (saisie: SaisieLivre): Promise<Livre> => {
      if (enLigne) {
        const livre = await creerLivre(saisie);
        void qc.invalidateQueries({ queryKey: clesLivres.listes() });
        return livre;
      }
      const date = new Date().toISOString();
      const id = genererId();
      const local: Livre = { ...saisie, id, createdAt: date, updatedAt: date, version: 0 };
      qc.setQueryData(clesLivres.detail(id), local);
      patchListes((items, premiere) => (premiere ? [local, ...items] : items));
      await enfiler({ id: genererId(), type: 'create', horodatage: date, livre: { ...saisie, id } });
      return local;
    },
    [enLigne, qc, enfiler, patchListes],
  );

  const modifier = useCallback(
    async (livre: Livre, saisie: SaisieLivre): Promise<void> => {
      if (enLigne) {
        const maj = await remplacerLivre(livre.id, saisie, livre.version);
        qc.setQueryData(clesLivres.detail(livre.id), maj);
        void qc.invalidateQueries({ queryKey: clesLivres.listes() });
        return;
      }
      const date = new Date().toISOString();
      const local: Livre = { ...livre, ...saisie, updatedAt: date };
      qc.setQueryData(clesLivres.detail(livre.id), local);
      patchListes((items) => items.map((l) => (l.id === livre.id ? local : l)));
      await enfiler({
        id: genererId(),
        type: 'update',
        horodatage: date,
        livre: local,
        baseVersion: livre.version,
      });
    },
    [enLigne, qc, enfiler, patchListes],
  );

  const supprimer = useCallback(
    async (livre: Livre): Promise<void> => {
      if (enLigne) {
        await supprimerLivre(livre.id);
        void qc.invalidateQueries({ queryKey: clesLivres.listes() });
        return;
      }
      qc.removeQueries({ queryKey: clesLivres.detail(livre.id) });
      patchListes((items) => items.filter((l) => l.id !== livre.id));
      await enfiler({
        id: genererId(),
        type: 'delete',
        horodatage: new Date().toISOString(),
        livreId: livre.id,
        baseVersion: livre.version,
      });
    },
    [enLigne, qc, enfiler, patchListes],
  );

  return { enLigne, creer, modifier, supprimer };
}

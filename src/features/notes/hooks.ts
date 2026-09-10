/**
 * Hooks des notes de lecture (cœur métier). Lecture + ajout + suppression,
 * rattachés à un ouvrage. Ajout optimiste avec retour arrière.
 *
 * Hors ligne (§4.2, BL-05b) : useAjouterNote met la note en file plutôt que
 * d'appeler l'API — voir domain/notes.ts pour pourquoi cette file est
 * distincte de celle des mutations de livre (POST /sync ne sait pas porter
 * une note). Pas de retour arrière optimiste hors ligne : la note reste
 * affichée jusqu'à confirmation, comme le reste des écritures en file.
 */
import type { MutationNote } from '@/domain/notes';
import type { Note } from '@/domain/types';
import { clesLivres } from '@/features/books/cles';
import { useSync } from '@/features/sync/SyncProvider';
import { ajouterNote, listerNotes, supprimerNote } from '@/services/api/livres';
import { genererId } from '@/services/id';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useNotes(livreId: string) {
  return useQuery({
    queryKey: clesLivres.notes(livreId),
    queryFn: ({ signal }) => listerNotes(livreId, signal),
    enabled: livreId.length > 0,
  });
}

export function useAjouterNote(livreId: string) {
  const qc = useQueryClient();
  const { enLigne, enfilerNote } = useSync();
  return useMutation({
    mutationFn: async (contenu: string) => {
      if (enLigne) return ajouterNote(livreId, contenu);
      const horodatage = new Date().toISOString();
      const locale: Note = { id: genererId(), livreId, contenu, createdAt: horodatage };
      const mutation: MutationNote = { id: genererId(), type: 'note-ajout', horodatage, livreId, contenu };
      await enfilerNote(mutation);
      return locale;
    },
    onMutate: async (contenu) => {
      const cle = clesLivres.notes(livreId);
      await qc.cancelQueries({ queryKey: cle });
      const precedent = qc.getQueryData<Note[]>(cle);
      const optimiste: Note = { id: genererId(), livreId, contenu, createdAt: new Date().toISOString() };
      qc.setQueryData<Note[]>(cle, (notes) => (notes ? [optimiste, ...notes] : [optimiste]));
      return { precedent };
    },
    onError: (_e, _v, contexte) => {
      if (contexte?.precedent) qc.setQueryData(clesLivres.notes(livreId), contexte.precedent);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: clesLivres.notes(livreId) }),
  });
}

export function useSupprimerNote(livreId: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (noteId: string) => supprimerNote(livreId, noteId),
    onMutate: async (noteId) => {
      const cle = clesLivres.notes(livreId);
      await qc.cancelQueries({ queryKey: cle });
      const precedent = qc.getQueryData<Note[]>(cle);
      qc.setQueryData<Note[]>(cle, (notes) => notes?.filter((n) => n.id !== noteId));
      return { precedent };
    },
    onError: (_e, _v, contexte) => {
      if (contexte?.precedent) qc.setQueryData(clesLivres.notes(livreId), contexte.precedent);
    },
    onSettled: () => qc.invalidateQueries({ queryKey: clesLivres.notes(livreId) }),
  });
}

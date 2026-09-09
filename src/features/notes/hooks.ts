/**
 * Hooks des notes de lecture (cœur métier). Lecture + ajout + suppression,
 * rattachés à un ouvrage. Ajout optimiste avec retour arrière.
 */
import type { Note } from '@/domain/types';
import { clesLivres } from '@/features/books/cles';
import { ajouterNote, listerNotes, supprimerNote } from '@/services/api/livres';
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
  return useMutation({
    mutationFn: (contenu: string) => ajouterNote(livreId, contenu),
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

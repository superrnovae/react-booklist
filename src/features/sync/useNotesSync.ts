/**
 * Rejeu des notes de lecture rédigées hors ligne (§4.2, BL-05b), extrait de
 * SyncProvider.tsx pour rester sous la limite de 250 lignes (§4). Contrairement
 * à /sync, POST /books/:id/notes n'a pas de ledger d'idempotence côté serveur
 * (voir domain/notes.ts) : on n'avance qu'une note à la fois, on ne la retire
 * qu'après une réponse confirmée, et on s'arrête au premier échec plutôt que
 * de risquer un rejeu en désordre.
 */
import type { MutationNote } from '@/domain/notes';
import { chargerFileNotes, enfilerNotePersistante, sauverFileNotes } from '@/features/notes/fileNotes';
import { ajouterNote } from '@/services/api/livres';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useNotesSync(enLigne: boolean, apresEnvoi: () => void) {
  const [fileNotes, setFileNotes] = useState<MutationNote[]>([]);
  const fileNotesRef = useRef<MutationNote[]>([]);
  const enCours = useRef(false);

  useEffect(() => {
    fileNotesRef.current = fileNotes;
  }, [fileNotes]);

  const charger = useCallback(async (): Promise<MutationNote[]> => {
    const fn = await chargerFileNotes();
    setFileNotes(fn);
    fileNotesRef.current = fn;
    return fn;
  }, []);

  const lancerSyncNotes = useCallback(async () => {
    if (enCours.current) return;
    if (fileNotesRef.current.length === 0) return;
    enCours.current = true;
    try {
      let envoyees = false;
      while (fileNotesRef.current.length > 0) {
        const [prochaine, ...reste] = fileNotesRef.current;
        await ajouterNote(prochaine.livreId, prochaine.contenu);
        envoyees = true;
        fileNotesRef.current = reste;
        setFileNotes(reste);
        await sauverFileNotes(reste);
      }
      if (envoyees) apresEnvoi();
    } catch {
      // Réseau/serveur indisponible : on garde le reste pour un prochain essai.
    } finally {
      enCours.current = false;
    }
  }, [apresEnvoi]);

  const enfilerNote = useCallback(
    async (note: MutationNote) => {
      const fusion = await enfilerNotePersistante(fileNotesRef.current, note);
      setFileNotes(fusion);
      fileNotesRef.current = fusion;
      if (enLigne) void lancerSyncNotes();
    },
    [enLigne, lancerSyncNotes],
  );

  const viderFileNotes = useCallback(async () => {
    fileNotesRef.current = [];
    setFileNotes([]);
    await sauverFileNotes([]);
  }, []);

  // Pas de useMemo ici : charger/lancerSyncNotes/enfilerNote/viderFileNotes
  // sont chacun individuellement stables (useCallback à deps minimales), mais
  // memoiser l'objet entier avec fileNotes en dépendance créerait une
  // boucle — tout appelant qui utilise une de ces fonctions dans un effet
  // dont fileNotes fait changer l'identité de l'objet retourné re-déclenche
  // cet effet indéfiniment (appelant → change fileNotes → nouvel objet →
  // dépendance changée → effet rejoué → ...).
  return { fileNotes, fileNotesRef, charger, lancerSyncNotes, enfilerNote, viderFileNotes };
}

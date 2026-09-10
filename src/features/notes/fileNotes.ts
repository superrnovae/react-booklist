/**
 * File de notes de lecture hors ligne, persistée (§4.2, BL-05b). Distincte
 * de features/sync/file.ts : voir domain/notes.ts pour pourquoi.
 */
import type { MutationNote } from '@/domain/notes';
import { ecrireJson, lireJson } from '@/services/stockage';

const CLE_FILE_NOTES = 'booklist.file-notes';

export function chargerFileNotes(): Promise<MutationNote[]> {
  return lireJson<MutationNote[]>(CLE_FILE_NOTES).then((f) => f ?? []);
}

export function sauverFileNotes(file: MutationNote[]): Promise<void> {
  return ecrireJson(CLE_FILE_NOTES, file);
}

/** Chaque note est indépendante : pas de fusion, on ajoute simplement en fin de file. */
export async function enfilerNotePersistante(
  file: MutationNote[],
  note: MutationNote,
): Promise<MutationNote[]> {
  const fusion = [...file, note];
  await sauverFileNotes(fusion);
  return fusion;
}

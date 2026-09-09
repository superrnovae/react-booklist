/**
 * File de mutations hors ligne, persistée (§ Lot 4.2). Survit à un rechargement
 * complet de la page. La fusion (domain) garde la file minimale et cohérente.
 */
import type { Mutation } from '@/domain/mutations';
import { fusionnerFile } from '@/domain/mutations';
import { ecrireJson, lireJson } from '@/services/stockage';

const CLE_FILE = 'booklist.file-mutations';

export function chargerFile(): Promise<Mutation[]> {
  return lireJson<Mutation[]>(CLE_FILE).then((f) => f ?? []);
}

export function sauverFile(file: Mutation[]): Promise<void> {
  return ecrireJson(CLE_FILE, file);
}

/** Ajoute une mutation (fusion domain) et persiste immédiatement. */
export async function enfilerPersistant(file: Mutation[], mutation: Mutation): Promise<Mutation[]> {
  const fusion = fusionnerFile(file, mutation);
  await sauverFile(fusion);
  return fusion;
}

/**
 * Journalisation structurée (§ Lot 5, bonus). Types et fonctions pures :
 * la collecte, la persistance et le miroir console vivent dans
 * services/journal.ts, qui est la seule couche autorisée à connaître
 * console.* et le stockage — comme services/api/client.ts est le seul
 * endroit qui connaît l'API.
 */
export type NiveauJournal = 'info' | 'avertissement' | 'erreur';

export type ErreurJournal = { nom: string; message: string; pile?: string };

export type EntreeJournal = {
  id: string;
  horodatage: string; // ISO 8601
  niveau: NiveauJournal;
  message: string;
  contexte?: Record<string, unknown>;
  erreur?: ErreurJournal;
};

/** Entrées conservées : un journal illimité finirait par saturer le stockage local. */
export const TAILLE_MAX_JOURNAL = 200;

/** Ajoute une entrée en ne conservant que les TAILLE_MAX_JOURNAL plus récentes (FIFO). */
export function ajouterEntree(journal: EntreeJournal[], entree: EntreeJournal): EntreeJournal[] {
  const suite = [...journal, entree];
  return suite.length > TAILLE_MAX_JOURNAL ? suite.slice(suite.length - TAILLE_MAX_JOURNAL) : suite;
}

export function filtrerParNiveau(journal: EntreeJournal[], niveau: NiveauJournal | 'tous'): EntreeJournal[] {
  return niveau === 'tous' ? journal : journal.filter((e) => e.niveau === niveau);
}

/**
 * Normalise une exception JS quelconque (pas nécessairement une instance
 * Error — un rejet de promesse peut porter n'importe quelle valeur) vers la
 * forme structurée conservée dans une entrée.
 */
export function depuisErreur(e: unknown): ErreurJournal {
  if (e instanceof Error) return { nom: e.name, message: e.message, pile: e.stack };
  return { nom: 'Inconnue', message: String(e) };
}

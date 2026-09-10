/**
 * File de notes de lecture rédigées hors ligne (§4.2, BL-05b).
 *
 * Distincte de la file de mutations d'ouvrages (domain/mutations.ts) : une
 * note n'est pas une mutation de Livre et POST /sync ne sait pas la porter
 * (vérifié dans api-books-v2/src/routes-systeme.js — le lot ne reconnaît
 * que create|update|delete appliqués à un livre). Elle est donc rejouée à
 * la reconnexion via l'appel unitaire POST /books/:id/notes, pas via /sync.
 *
 * Conséquence assumée : contrairement aux mutations de livre, cet appel
 * unitaire n'a pas de ledger d'idempotence côté serveur. Une note n'est
 * retirée de la file qu'après une réponse serveur confirmée ; le risque de
 * doublon se limite donc à la fenêtre entre cette réponse et la persistance
 * du retrait (identique à toute écriture non transactionnelle), jamais à un
 * rejeu délibéré.
 */
export type MutationNote = {
  id: string;
  type: 'note-ajout';
  horodatage: string;
  livreId: string;
  contenu: string;
};

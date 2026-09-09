/**
 * Types métier du domaine BookList. Aucune dépendance technique (ni réseau,
 * ni stockage) : ces types décrivent le fonds et ses règles, rien d'autre.
 */

export type Role = 'lecteur' | 'editeur';

export type Utilisateur = {
  id: string;
  email: string;
  role: Role;
};

/** Un ouvrage du fonds, tel que renvoyé par l'API. */
export type Livre = {
  id: string;
  titre: string;
  auteur: string;
  editeur: string;
  annee: number;
  lu: boolean;
  favori: boolean;
  note: number | null;
  couverture: string | null;
  createdAt: string;
  updatedAt: string;
  version: number;
};

/** Champs qu'un libraire peut saisir dans le formulaire d'ajout/édition. */
export type SaisieLivre = {
  titre: string;
  auteur: string;
  editeur: string;
  annee: number;
  lu: boolean;
  favori: boolean;
  note: number | null;
  couverture: string | null;
};

export type Note = {
  id: string;
  livreId: string;
  contenu: string;
  createdAt: string;
};

/** Enveloppe de pagination renvoyée par `GET /books`. */
export type Page<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type StatutFiltre = 'lu' | 'nonlu';
export type ChampTri = 'titre' | 'auteur' | 'annee' | 'note' | 'updatedAt';
export type SensTri = 'asc' | 'desc';

/** Paramètres de recherche/tri/pagination côté serveur. */
export type RequeteLivres = {
  page: number;
  limit: number;
  q?: string;
  status?: StatutFiltre;
  favori?: boolean;
  sort: ChampTri;
  order: SensTri;
};

export type Stats = {
  total: number;
  lus: number;
  nonLus: number;
  favoris: number;
  moyenneNotes: number | null;
  totalNotes: number;
  distributionNotes: { note: number; total: number }[];
  parAnnee: { annee: number; total: number }[];
  parAuteur: { auteur: string; total: number }[];
  genereLe: string;
};

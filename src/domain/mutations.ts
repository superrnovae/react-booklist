/**
 * Modèle de la file de mutations hors ligne et règles pures de fusion.
 *
 * L'`id` d'une mutation est la clé d'idempotence (uuid client, conservée entre
 * deux tentatives de synchronisation). Il est distinct de l'id du livre.
 *
 * Ces fonctions sont **pures** : elles n'ont aucun effet de bord et sont
 * couvertes par des tests unitaires (cas « modifie puis supprime hors ligne »).
 */
import type { Livre, SaisieLivre } from './types';

/**
 * Conflit détecté par le serveur pour une mutation en file (§4.3). Porté par
 * la mutation elle-même plutôt que stocké à part : la mutation persistée
 * *est* le conflit tant qu'il n'est pas arbitré, ce qui le fait survivre à un
 * rechargement complet de la page sans stockage additionnel (BL-02).
 */
export type ConflitInfo = { serveur: Livre; versionAttendue: number };

export type MutationCreation = {
  id: string;
  type: 'create';
  horodatage: string;
  /** Livre local avec id temporaire généré côté client. */
  livre: SaisieLivre & { id: string };
  conflit?: ConflitInfo;
};

export type MutationMaj = {
  id: string;
  type: 'update';
  horodatage: string;
  livre: Livre;
  baseVersion: number;
  conflit?: ConflitInfo;
};

export type MutationSuppression = {
  id: string;
  type: 'delete';
  horodatage: string;
  livreId: string;
  baseVersion: number;
  conflit?: ConflitInfo;
};

export type Mutation = MutationCreation | MutationMaj | MutationSuppression;

/** Identifiant du livre visé par une mutation, quel que soit son type. */
export function livreVise(m: Mutation): string {
  return m.type === 'delete' ? m.livreId : m.livre.id;
}

/** Vrai si le livre a été créé hors ligne et jamais synchronisé. */
export function estLivreLocal(file: Mutation[], livreId: string): boolean {
  return file.some((m) => m.type === 'create' && m.livre.id === livreId);
}

/**
 * Ajoute une mutation à la file en la fusionnant avec les mutations existantes
 * qui visent le même livre. On préserve l'idempotence et on évite les doublons.
 *
 * Règles :
 * - create puis update  → un seul create avec les données fusionnées ;
 * - create puis delete  → les deux disparaissent (livre jamais monté au serveur) ;
 * - update puis update  → un seul update (dernier état) ;
 * - update puis delete  → delete l'emporte (l'update est abandonné).
 */
export function fusionnerFile(file: Mutation[], nouvelle: Mutation): Mutation[] {
  const cible = livreVise(nouvelle);
  const existantes = file.filter((m) => livreVise(m) === cible);
  const autres = file.filter((m) => livreVise(m) !== cible);

  if (nouvelle.type === 'delete') {
    const creationLocale = existantes.find((m) => m.type === 'create');
    if (creationLocale) {
      // Créé puis supprimé hors ligne : rien à envoyer au serveur.
      return autres;
    }
    // Toute mise à jour en attente est rendue caduque par la suppression.
    return [...autres, nouvelle];
  }

  if (nouvelle.type === 'update') {
    const creationLocale = existantes.find(
      (m): m is MutationCreation => m.type === 'create',
    );
    if (creationLocale) {
      // Le livre n'existe pas encore côté serveur : on met à jour le create.
      const fusion: MutationCreation = {
        ...creationLocale,
        horodatage: nouvelle.horodatage,
        livre: { ...creationLocale.livre, ...nouvelle.livre, id: creationLocale.livre.id },
      };
      return [...autres, fusion];
    }
    // Remplace toute mise à jour antérieure par le dernier état.
    return [...autres, nouvelle];
  }

  // create : on suppose un livre neuf, on empile.
  return [...file, nouvelle];
}

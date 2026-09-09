/**
 * Résolution pure du sort d'une mutation face à la réponse du serveur.
 * Aucune I/O : cette fonction décide, la couche services applique.
 */
import type { ChampsErreur } from './erreurs';
import type { Mutation } from './mutations';
import type { Livre } from './types';

export type ResultatMutation =
  | { id: string; statut: 'ok'; rejeu?: boolean; livre?: Livre | null; supprime?: boolean }
  | { id: string; statut: 'conflit'; rejeu?: boolean; serveur: Livre; versionAttendue: number }
  | { id: string; statut: 'erreur'; rejeu?: boolean; message?: string; champs?: ChampsErreur };

export type ReponseSync = {
  resultats: ResultatMutation[];
  resume: { total: number; ok: number; conflits: number; erreurs: number };
  serveurLe: string;
};

export type Conflit = {
  mutation: Mutation;
  serveur: Livre;
  versionAttendue: number;
};

/** Décision par mutation : la retirer de la file, la garder, ou lever un conflit. */
export type Decision =
  | { sort: 'retirer'; id: string; livre?: Livre | null }
  | { sort: 'conflit'; id: string; conflit: Conflit }
  | { sort: 'garder'; id: string; message?: string; champs?: ChampsErreur };

/**
 * Confronte la file envoyée aux résultats reçus et décide du sort de chacune.
 * - `ok` (ou `rejeu`)  → mutation retirée (idempotence : un rejeu vaut un succès) ;
 * - `conflit`          → conflit à arbitrer, mutation conservée jusqu'à résolution ;
 * - `erreur`           → conservée pour réessai/rapport (sauf validation définitive).
 */
export function resoudreSync(file: Mutation[], reponse: ReponseSync): Decision[] {
  const parId = new Map(file.map((m) => [m.id, m]));
  const decisions: Decision[] = [];

  for (const r of reponse.resultats) {
    const mutation = parId.get(r.id);
    if (!mutation) continue;

    if (r.statut === 'ok') {
      decisions.push({ sort: 'retirer', id: r.id, livre: r.livre ?? null });
      continue;
    }
    if (r.statut === 'conflit') {
      decisions.push({
        sort: 'conflit',
        id: r.id,
        conflit: { mutation, serveur: r.serveur, versionAttendue: r.versionAttendue },
      });
      continue;
    }
    // erreur de validation métier : inutile de réessayer à l'identique.
    const validationDefinitive = r.champs !== undefined;
    decisions.push(
      validationDefinitive
        ? { sort: 'retirer', id: r.id }
        : { sort: 'garder', id: r.id, message: r.message },
    );
  }

  return decisions;
}

const CHAMPS_COMPARES = [
  'titre',
  'auteur',
  'editeur',
  'annee',
  'lu',
  'favori',
  'note',
] as const satisfies readonly (keyof Livre)[];

export type ChampCompare = (typeof CHAMPS_COMPARES)[number];

/** Champs dont la valeur diffère entre la version locale et la version serveur. */
export function champsEnConflit(local: Livre, serveur: Livre): ChampCompare[] {
  return CHAMPS_COMPARES.filter((c) => local[c] !== serveur[c]);
}

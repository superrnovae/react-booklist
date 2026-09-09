/**
 * Schéma de validation du formulaire d'ouvrage (react-hook-form + zod).
 * Validation typée, mêmes bornes que l'API (titre/auteur obligatoires,
 * année 1450 → année prochaine, note 0–5).
 */
import type { SaisieLivre } from '@/domain/types';
import { z } from 'zod';

const anneeMax = new Date().getFullYear() + 1;

export const schemaFormulaireLivre = z.object({
  titre: z.string().trim().min(1, 'requis').max(200),
  auteur: z.string().trim().min(1, 'requis').max(200),
  editeur: z.string().trim().max(200).default(''),
  annee: z
    .number({ error: 'invalide' })
    .int('invalide')
    .min(1450, 'invalide')
    .max(anneeMax, 'invalide'),
  lu: z.boolean().default(false),
  favori: z.boolean().default(false),
  note: z.number().min(0).max(5).nullable().default(null),
});

export type ValeursFormulaireLivre = z.input<typeof schemaFormulaireLivre>;

/** Convertit les valeurs validées du formulaire en saisie de domaine. */
export function versSaisie(v: z.output<typeof schemaFormulaireLivre>): SaisieLivre {
  return {
    titre: v.titre,
    auteur: v.auteur,
    editeur: v.editeur,
    annee: v.annee,
    lu: v.lu,
    favori: v.favori,
    note: v.note,
    couverture: null,
  };
}

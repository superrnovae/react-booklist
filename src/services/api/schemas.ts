/**
 * Schémas zod de validation des réponses de l'API (§3.1 : validation à l'exécution).
 * Un type TypeScript ne protège de rien face à une API qui renvoie autre chose.
 * Les schémas produisent exactement les types du domaine.
 */
import type { ReponseSync, ResultatMutation } from '@/domain/sync';
import type {
    Livre,
    Note,
    Page,
    Stats,
    Utilisateur,
} from '@/domain/types';
import { z } from 'zod';

export const livreSchema: z.ZodType<Livre> = z.object({
  id: z.string(),
  titre: z.string(),
  auteur: z.string(),
  editeur: z.string(),
  annee: z.number(),
  lu: z.boolean(),
  favori: z.boolean(),
  note: z.number().nullable(),
  couverture: z.string().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
  version: z.number(),
});

export const noteSchema: z.ZodType<Note> = z.object({
  id: z.string(),
  livreId: z.string(),
  contenu: z.string(),
  createdAt: z.string(),
});

export function pageSchema<T>(item: z.ZodType<T>): z.ZodType<Page<T>> {
  return z.object({
    items: z.array(item),
    page: z.number(),
    limit: z.number(),
    total: z.number(),
    totalPages: z.number(),
  });
}

export const pageLivresSchema = pageSchema(livreSchema);
export const notesSchema = z.array(noteSchema);

export const statsSchema: z.ZodType<Stats> = z.object({
  total: z.number(),
  lus: z.number(),
  nonLus: z.number(),
  favoris: z.number(),
  moyenneNotes: z.number().nullable(),
  totalNotes: z.number(),
  distributionNotes: z.array(z.object({ note: z.number(), total: z.number() })),
  parAnnee: z.array(z.object({ annee: z.number(), total: z.number() })),
  parAuteur: z.array(z.object({ auteur: z.string(), total: z.number() })),
  genereLe: z.string(),
});

export const utilisateurSchema: z.ZodType<Utilisateur> = z.object({
  id: z.string(),
  email: z.string(),
  role: z.union([z.literal('lecteur'), z.literal('editeur')]),
});

export const connexionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.union([z.string(), z.number()]),
  utilisateur: utilisateurSchema,
});
export type ReponseConnexion = z.infer<typeof connexionSchema>;

export const rafraichissementSchema = z.object({
  accessToken: z.string(),
  expiresIn: z.union([z.string(), z.number()]),
});

export const profilSchema = z.object({
  id: z.string(),
  email: z.string(),
  role: z.union([z.literal('lecteur'), z.literal('editeur')]),
  authRequise: z.boolean(),
});

const resultatMutationSchema: z.ZodType<ResultatMutation> = z.union([
  z.object({
    id: z.string(),
    statut: z.literal('ok'),
    rejeu: z.boolean().optional(),
    livre: livreSchema.nullish(),
    supprime: z.boolean().optional(),
  }),
  z.object({
    id: z.string(),
    statut: z.literal('conflit'),
    rejeu: z.boolean().optional(),
    serveur: livreSchema,
    versionAttendue: z.number(),
  }),
  z.object({
    id: z.string(),
    statut: z.literal('erreur'),
    rejeu: z.boolean().optional(),
    message: z.string().optional(),
    champs: z.record(z.string(), z.string()).optional(),
  }),
]);

export const reponseSyncSchema: z.ZodType<ReponseSync> = z.object({
  resultats: z.array(resultatMutationSchema),
  resume: z.object({
    total: z.number(),
    ok: z.number(),
    conflits: z.number(),
    erreurs: z.number(),
  }),
  serveurLe: z.string(),
});

/** Forme normalisée des erreurs de l'API : { erreur, message?, champs?, serveur?, versionAttendue? }. */
export const erreurApiSchema = z.object({
  erreur: z.string(),
  message: z.string().optional(),
  champs: z.record(z.string(), z.string()).optional(),
  serveur: livreSchema.optional(),
  versionAttendue: z.number().optional(),
});
export type ErreurApi = z.infer<typeof erreurApiSchema>;

/**
 * Endpoints « livres » et « notes ». Seule cette couche connaît les routes.
 */
import type { Livre, Note, Page, RequeteLivres, SaisieLivre } from '@/domain/types';
import { requete } from './client';
import { livreSchema, noteSchema, notesSchema, pageLivresSchema } from './schemas';

function chaineRequete(req: RequeteLivres): string {
  const p = new URLSearchParams();
  p.set('page', String(req.page));
  p.set('limit', String(req.limit));
  p.set('sort', req.sort);
  p.set('order', req.order);
  if (req.q) p.set('q', req.q);
  if (req.status) p.set('status', req.status);
  if (req.favori !== undefined) p.set('favori', String(req.favori));
  return p.toString();
}

export function listerLivres(req: RequeteLivres, signal?: AbortSignal): Promise<Page<Livre>> {
  return requete(`/books?${chaineRequete(req)}`, { schema: pageLivresSchema, signal });
}

export function obtenirLivre(id: string, signal?: AbortSignal): Promise<Livre> {
  return requete(`/books/${id}`, { schema: livreSchema, signal });
}

export function creerLivre(saisie: SaisieLivre): Promise<Livre> {
  return requete('/books', { methode: 'POST', corps: saisie, schema: livreSchema });
}

/** Remplacement complet (PUT) avec détection de conflit via If-Match. */
export function remplacerLivre(id: string, livre: SaisieLivre, version: number): Promise<Livre> {
  return requete(`/books/${id}`, {
    methode: 'PUT',
    corps: livre,
    ifMatch: version,
    schema: livreSchema,
  });
}

/** Modification partielle (PATCH) : bascule lu/favori, note, etc. */
export function modifierLivre(
  id: string,
  partiel: Partial<SaisieLivre>,
  version?: number,
): Promise<Livre> {
  return requete(`/books/${id}`, {
    methode: 'PATCH',
    corps: partiel,
    ifMatch: version,
    schema: livreSchema,
  });
}

export function supprimerLivre(id: string): Promise<void> {
  return requete<void>(`/books/${id}`, { methode: 'DELETE' });
}

export function listerNotes(livreId: string, signal?: AbortSignal): Promise<Note[]> {
  return requete(`/books/${livreId}/notes`, { schema: notesSchema, signal });
}

export function ajouterNote(livreId: string, contenu: string): Promise<Note> {
  return requete(`/books/${livreId}/notes`, {
    methode: 'POST',
    corps: { contenu },
    schema: noteSchema,
  });
}

export function supprimerNote(livreId: string, noteId: string): Promise<void> {
  return requete<void>(`/books/${livreId}/notes/${noteId}`, { methode: 'DELETE' });
}

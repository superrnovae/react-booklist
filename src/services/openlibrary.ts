/**
 * Enrichissement bibliographique via OpenLibrary (§ Lot 3).
 * Service externe, isolé dans services/. Délai d'expiration court et
 * dégradation silencieuse : l'indisponibilité d'OpenLibrary ne casse jamais la
 * fiche. « Zéro édition trouvée » est une réponse normale, pas une erreur.
 */
import { z } from 'zod';

const URL_OPENLIBRARY = 'https://openlibrary.org/search.json';
const DELAI_MS = 4000;

const reponseSchema = z.object({
  numFound: z.number().optional(),
  docs: z
    .array(z.object({ first_publish_year: z.number().optional() }))
    .optional(),
});

export type Enrichissement = {
  editions: number;
  premiereAnnee: number | null;
};

/** Résout l'enrichissement, ou `null` en cas d'indisponibilité (dégradation silencieuse). */
export async function enrichirDepuisTitre(
  titre: string,
  signal?: AbortSignal,
): Promise<Enrichissement | null> {
  const minuteur = new AbortController();
  const idDelai = setTimeout(() => minuteur.abort(), DELAI_MS);
  if (signal) signal.addEventListener('abort', () => minuteur.abort());

  try {
    const url = `${URL_OPENLIBRARY}?title=${encodeURIComponent(titre)}&fields=first_publish_year&limit=1`;
    const rep = await fetch(url, { signal: minuteur.signal, headers: { Accept: 'application/json' } });
    if (!rep.ok) return null;
    const analyse = reponseSchema.safeParse(await rep.json());
    if (!analyse.success) return null;

    const { numFound, docs } = analyse.data;
    return {
      editions: numFound ?? docs?.length ?? 0,
      premiereAnnee: docs?.[0]?.first_publish_year ?? null,
    };
  } catch {
    // Réseau, délai dépassé, JSON illisible : on dégrade en silence.
    return null;
  } finally {
    clearTimeout(idDelai);
  }
}

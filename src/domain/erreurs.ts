/**
 * Taxonomie d'erreurs applicative discriminée (§3.3 du sujet).
 * Chaque couche transforme les échecs bruts (fetch, HTTP, zod) en l'une de ces
 * erreurs, que l'interface sait présenter et réessayer.
 */
import type { Livre } from './types';

export type GenreErreur = 'reseau' | 'validation' | 'conflit' | 'auth' | 'inconnue';

/** Erreurs de validation par champ, telles que renvoyées en 422 par l'API. */
export type ChampsErreur = Record<string, string>;

export abstract class ErreurApplicative extends Error {
  abstract readonly genre: GenreErreur;
}

/** Perte de connectivité, délai d'expiration dépassé, 5xx / 503 (mode dégradé). */
export class ErreurReseau extends ErreurApplicative {
  readonly genre = 'reseau' as const;
  constructor(
    message: string,
    readonly statut?: number,
    readonly reessayable: boolean = true,
  ) {
    super(message);
    this.name = 'ErreurReseau';
  }
}

/** 422 : validation métier champ par champ, ou réponse illisible côté client. */
export class ErreurValidation extends ErreurApplicative {
  readonly genre = 'validation' as const;
  constructor(
    message: string,
    readonly champs: ChampsErreur = {},
  ) {
    super(message);
    this.name = 'ErreurValidation';
  }
}

/** 409 : la version envoyée est périmée. Porte la fiche serveur pour arbitrage. */
export class ErreurConflit extends ErreurApplicative {
  readonly genre = 'conflit' as const;
  constructor(
    message: string,
    readonly serveur: Livre,
    readonly versionAttendue: number,
  ) {
    super(message);
    this.name = 'ErreurConflit';
  }
}

/** 401 / 403 : jeton absent/expiré/invalide ou rôle insuffisant. */
export class ErreurAuth extends ErreurApplicative {
  readonly genre = 'auth' as const;
  constructor(
    message: string,
    readonly code: 'jeton_absent' | 'jeton_expire' | 'jeton_invalide' | 'droits_insuffisants' | 'identifiants_invalides',
    readonly statut: number,
  ) {
    super(message);
    this.name = 'ErreurAuth';
  }
}

export class ErreurInconnue extends ErreurApplicative {
  readonly genre = 'inconnue' as const;
  constructor(message: string) {
    super(message);
    this.name = 'ErreurInconnue';
  }
}

export function estErreurApplicative(e: unknown): e is ErreurApplicative {
  return e instanceof ErreurApplicative;
}

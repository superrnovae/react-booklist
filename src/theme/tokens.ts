/**
 * Tokens de design centralisés (§ Lot 2 : thème centralisé, aucune couleur en dur).
 * Deux palettes (clair/sombre) partageant la même forme, plus espacements,
 * rayons, tailles de police et cible tactile minimale (44 pt, a11y).
 */

export type Palette = {
  fond: string;
  fondSecondaire: string;
  surface: string;
  surfaceEnfoncee: string;
  bordure: string;
  texte: string;
  texteSecondaire: string;
  texteInverse: string;
  primaire: string;
  primaireTexte: string;
  danger: string;
  dangerTexte: string;
  succes: string;
  avertissement: string;
  coeur: string;
  etoile: string;
  squelette: string;
};

export const palettes: Record<'clair' | 'sombre', Palette> = {
  clair: {
    fond: '#FBFAF7',
    fondSecondaire: '#F1EEE7',
    surface: '#FFFFFF',
    surfaceEnfoncee: '#F0F0F3',
    bordure: '#E2DED4',
    texte: '#1A1712',
    texteSecondaire: '#6B6558',
    texteInverse: '#FFFFFF',
    primaire: '#8A5A2B',
    primaireTexte: '#FFFFFF',
    danger: '#B3261E',
    dangerTexte: '#FFFFFF',
    succes: '#2E7D46',
    avertissement: '#B26A00',
    coeur: '#C2185B',
    etoile: '#E0A500',
    squelette: '#E7E3DA',
  },
  sombre: {
    fond: '#16130F',
    fondSecondaire: '#1E1A15',
    surface: '#221E19',
    surfaceEnfoncee: '#2A251F',
    bordure: '#38322A',
    texte: '#F3EFE7',
    texteSecondaire: '#B0A897',
    texteInverse: '#16130F',
    primaire: '#D2A06B',
    primaireTexte: '#221E19',
    danger: '#F2B8B5',
    dangerTexte: '#221E19',
    succes: '#84D6A0',
    avertissement: '#E8B168',
    coeur: '#F48FB1',
    etoile: '#F0C044',
    squelette: '#2A251F',
  },
};

export const espacements = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const rayons = { sm: 6, md: 10, lg: 16, rond: 999 } as const;

export const typographie = {
  titre: { taille: 22, poids: '700' as const },
  sousTitre: { taille: 17, poids: '600' as const },
  corps: { taille: 15, poids: '400' as const },
  legende: { taille: 13, poids: '400' as const },
} as const;

/** Zone tactile minimale recommandée (a11y). */
export const CIBLE_TACTILE = 44;

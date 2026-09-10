/**
 * Tokens de design centralisés (§ Lot 2 : thème centralisé, aucune couleur en dur).
 * Les rôles reprennent Material 3 (surface, container, outline, on-color)
 * tout en gardant les noms français utilisés par le reste de l'application.
 */
import type { ViewStyle } from 'react-native';

export type Palette = {
  fond: string;
  fondSecondaire: string;
  surface: string;
  surfaceEnfoncee: string;
  surfaceHaute: string;
  bordure: string;
  texte: string;
  texteSecondaire: string;
  texteInverse: string;
  primaire: string;
  primaireTexte: string;
  primaireConteneur: string;
  primaireConteneurTexte: string;
  danger: string;
  dangerTexte: string;
  dangerConteneur: string;
  dangerConteneurTexte: string;
  succes: string;
  succesConteneur: string;
  succesTexte: string;
  avertissement: string;
  avertissementConteneur: string;
  avertissementTexte: string;
  coeur: string;
  etoile: string;
  squelette: string;
  ombre: string;
  voile: string;
};

export const palettes: Record<'clair' | 'sombre', Palette> = {
  clair: {
    fond: '#FFFBFE',
    fondSecondaire: '#F7F2FA',
    surface: '#FFFFFF',
    surfaceEnfoncee: '#F0EDF4',
    surfaceHaute: '#FEF7FF',
    bordure: '#CAC4D0',
    texte: '#1D1B20',
    texteSecondaire: '#49454F',
    texteInverse: '#FFFFFF',
    primaire: '#6750A4',
    primaireTexte: '#FFFFFF',
    primaireConteneur: '#EADDFF',
    primaireConteneurTexte: '#21005D',
    danger: '#B3261E',
    dangerTexte: '#FFFFFF',
    dangerConteneur: '#F9DEDC',
    dangerConteneurTexte: '#410E0B',
    succes: '#146C2E',
    succesConteneur: '#D8F7DD',
    succesTexte: '#002108',
    avertissement: '#7A4D00',
    avertissementConteneur: '#FFECC0',
    avertissementTexte: '#271900',
    coeur: '#BA1A1A',
    etoile: '#A15C00',
    squelette: '#E7E0EC',
    ombre: '#000000',
    voile: 'rgba(29,27,32,0.32)',
  },
  sombre: {
    fond: '#141218',
    fondSecondaire: '#211F26',
    surface: '#1D1B20',
    surfaceEnfoncee: '#2B2930',
    surfaceHaute: '#2F2B36',
    bordure: '#49454F',
    texte: '#E6E0E9',
    texteSecondaire: '#CAC4D0',
    texteInverse: '#141218',
    primaire: '#D0BCFF',
    primaireTexte: '#381E72',
    primaireConteneur: '#4F378B',
    primaireConteneurTexte: '#EADDFF',
    danger: '#F2B8B5',
    dangerTexte: '#601410',
    dangerConteneur: '#8C1D18',
    dangerConteneurTexte: '#F9DEDC',
    succes: '#9BD9A5',
    succesConteneur: '#00531A',
    succesTexte: '#D8F7DD',
    avertissement: '#FFD99B',
    avertissementConteneur: '#5D3A00',
    avertissementTexte: '#FFECC0',
    coeur: '#FFB4AB',
    etoile: '#FFD99B',
    squelette: '#36323C',
    ombre: '#000000',
    voile: 'rgba(0,0,0,0.48)',
  },
};

export const espacements = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

export const rayons = { sm: 8, md: 12, lg: 18, rond: 999 } as const;

export const typographie = {
  titre: { taille: 22, hauteur: 28, poids: '700' as const, espacement: 0 },
  sousTitre: { taille: 16, hauteur: 22, poids: '600' as const, espacement: 0.1 },
  corps: { taille: 14, hauteur: 20, poids: '400' as const, espacement: 0.15 },
  legende: { taille: 12, hauteur: 16, poids: '500' as const, espacement: 0.3 },
  bouton: { taille: 14, hauteur: 20, poids: '700' as const, espacement: 0.1 },
} as const;

export const ombres: Record<'niveau1' | 'niveau2', ViewStyle> = {
  niveau1: {
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 1,
  },
  niveau2: {
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 2,
  },
};

/** Zone tactile minimale recommandée (a11y). */
export const CIBLE_TACTILE = 44;

/**
 * Icônes textuelles sobres, centralisées pour éviter les libellés dispersés.
 * Elles restent compatibles web/native sans police d'icônes additionnelle.
 */
import { usePalette } from '@/theme/ThemeProvider';
import type { Palette } from '@/theme/tokens';
import { Text, type TextStyle } from 'react-native';

export type IconeNom =
  | 'ajouter'
  | 'annuler'
  | 'appliquer'
  | 'connexion'
  | 'coeur'
  | 'deconnexion'
  | 'enregistrer'
  | 'etoile'
  | 'fermer'
  | 'grille'
  | 'horloge'
  | 'liste'
  | 'modifier'
  | 'noter'
  | 'rafraichir'
  | 'rechercher'
  | 'reglages'
  | 'stats'
  | 'synchroniser'
  | 'supprimer';

const GLYPHES: Record<IconeNom, string> = {
  ajouter: '+',
  annuler: '↩',
  appliquer: '✓',
  connexion: '→',
  coeur: '♥',
  deconnexion: '←',
  enregistrer: '✓',
  etoile: '★',
  fermer: '×',
  grille: '▦',
  horloge: '◷',
  liste: '☰',
  modifier: '✎',
  noter: '★',
  rafraichir: '↻',
  rechercher: '⌕',
  reglages: '⚙',
  stats: '◷',
  synchroniser: '↧',
  supprimer: '🗑',
};

export function Icone({
  nom,
  couleur = 'texte',
  taille = 16,
  style,
}: {
  nom: IconeNom;
  couleur?: keyof Palette;
  taille?: number;
  style?: TextStyle;
}) {
  const palette = usePalette();
  return (
    <Text
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={[{ color: palette[couleur], fontSize: taille, lineHeight: taille + 2 }, style]}
    >
      {GLYPHES[nom]}
    </Text>
  );
}

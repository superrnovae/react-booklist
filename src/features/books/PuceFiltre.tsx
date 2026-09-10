/**
 * Puce de filtre rapide (chips Tous / Coups de cœur / Lus / Non lus / Mieux
 * notés / Récents) et ses tables de correspondance vers les filtres serveur.
 * Extrait de BarreRecherche pour rester sous la limite de 250 lignes (§4).
 */
import { Icone, Texte, type IconeNom } from '@/components';
import type { ChampTri, SensTri, StatutFiltre } from '@/domain/types';
import { usePalette } from '@/theme/ThemeProvider';
import { espacements, ombres, rayons } from '@/theme/tokens';
import { useState } from 'react';
import { Pressable, StyleSheet } from 'react-native';

export type EtatFiltres = {
  q?: string;
  status?: StatutFiltre;
  favori?: boolean;
  sort: ChampTri;
  order: SensTri;
};

export type Vue = 'tous' | 'favoris' | 'lus' | 'nonlus' | 'mieuxNotes' | 'recents';

export function vueCourante(f: EtatFiltres): Vue {
  if (f.favori) return 'favoris';
  if (f.status === 'lu') return 'lus';
  if (f.status === 'nonlu') return 'nonlus';
  if (f.sort === 'note' && f.order === 'desc') return 'mieuxNotes';
  if (f.sort === 'updatedAt' && f.order === 'desc') return 'recents';
  return 'tous';
}

export const VUES: Record<Vue, Partial<EtatFiltres>> = {
  tous: { status: undefined, favori: undefined, sort: 'titre', order: 'asc' },
  favoris: { status: undefined, favori: true },
  lus: { status: 'lu', favori: undefined },
  nonlus: { status: 'nonlu', favori: undefined },
  mieuxNotes: { status: undefined, favori: undefined, sort: 'note', order: 'desc' },
  recents: { status: undefined, favori: undefined, sort: 'updatedAt', order: 'desc' },
};

export const ICONES_VUES: Record<Vue, IconeNom> = {
  tous: 'liste',
  favoris: 'coeur',
  lus: 'appliquer',
  nonlus: 'horloge',
  mieuxNotes: 'etoile',
  recents: 'rafraichir',
};

export function Puce({
  actif,
  libelle,
  onPress,
  icone,
}: {
  actif: boolean;
  libelle: string;
  onPress: () => void;
  icone?: IconeNom;
}) {
  const palette = usePalette();
  const [survol, setSurvol] = useState(false);
  const couleur = actif ? 'primaireConteneurTexte' : 'texteSecondaire';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: actif }}
      accessibilityLabel={libelle}
      onPress={onPress}
      onHoverIn={() => setSurvol(true)}
      onHoverOut={() => setSurvol(false)}
      style={({ pressed }) => [
        styles.puce,
        {
          borderColor: actif ? palette.primaireConteneur : palette.bordure,
          backgroundColor: actif
            ? palette.primaireConteneur
            : pressed || survol
              ? palette.surfaceEnfoncee
              : palette.surface,
          shadowColor: palette.ombre,
          transform: [{ translateY: survol && !actif ? -1 : 0 }],
        },
        survol && !actif && styles.puceSurvol,
      ]}
    >
      {icone ? <Icone nom={icone} couleur={couleur} taille={12} /> : null}
      <Texte variante="legende" couleur={couleur}>
        {libelle}
      </Texte>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  puce: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: espacements.md,
    borderRadius: rayons.rond,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacements.xs,
  },
  puceSurvol: ombres.niveau1,
});

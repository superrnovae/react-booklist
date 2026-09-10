/**
 * Barre de recherche, filtres et tri — tout côté serveur (§ Lot 2).
 * L'anti-rebond de 300 ms limite les requêtes ; l'annulation de la requête
 * précédente est assurée par le signal d'abandon de TanStack Query.
 */
import { Icone, Texte, type IconeNom } from '@/components';
import { CHAMPS_TRI } from '@/domain/tri';
import type { ChampTri, SensTri, StatutFiltre } from '@/domain/types';
import { useDebounce } from '@/hooks/useDebounce';
import { usePalette } from '@/theme/ThemeProvider';
import { useI18n } from '@/theme/formats';
import { CIBLE_TACTILE, espacements, ombres, rayons } from '@/theme/tokens';
import { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';
import type { ModeAffichageLivres } from './useModeAffichageLivres';

export type EtatFiltres = {
  q?: string;
  status?: StatutFiltre;
  favori?: boolean;
  sort: ChampTri;
  order: SensTri;
};

type Vue = 'tous' | 'favoris' | 'lus' | 'nonlus' | 'mieuxNotes' | 'recents';

function vueCourante(f: EtatFiltres): Vue {
  if (f.favori) return 'favoris';
  if (f.status === 'lu') return 'lus';
  if (f.status === 'nonlu') return 'nonlus';
  if (f.sort === 'note' && f.order === 'desc') return 'mieuxNotes';
  if (f.sort === 'updatedAt' && f.order === 'desc') return 'recents';
  return 'tous';
}

const VUES: Record<Vue, Partial<EtatFiltres>> = {
  tous: { status: undefined, favori: undefined, sort: 'titre', order: 'asc' },
  favoris: { status: undefined, favori: true },
  lus: { status: 'lu', favori: undefined },
  nonlus: { status: 'nonlu', favori: undefined },
  mieuxNotes: { status: undefined, favori: undefined, sort: 'note', order: 'desc' },
  recents: { status: undefined, favori: undefined, sort: 'updatedAt', order: 'desc' },
};

const ICONES_VUES: Record<Vue, IconeNom> = {
  tous: 'liste',
  favoris: 'coeur',
  lus: 'appliquer',
  nonlus: 'horloge',
  mieuxNotes: 'etoile',
  recents: 'rafraichir',
};

function Puce({
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

type Props = {
  filtres: EtatFiltres;
  onChange: (patch: Partial<EtatFiltres>) => void;
  modeAffichage?: ModeAffichageLivres;
  onModeAffichageChange?: (mode: ModeAffichageLivres) => void;
};

function BarreRechercheBrut({ filtres, onChange, modeAffichage, onModeAffichageChange }: Props) {
  const palette = usePalette();
  const { t } = useI18n();
  const [texte, setTexte] = useState(filtres.q ?? '');
  const [rechercheFocus, setRechercheFocus] = useState(false);
  const debounce = useDebounce(texte, 300);

  useEffect(() => {
    const propre = debounce.trim();
    onChange({ q: propre.length ? propre : undefined });
  }, [debounce, onChange]);

  const vue = vueCourante(filtres);
  const vues: Vue[] = ['tous', 'favoris', 'lus', 'nonlus', 'mieuxNotes', 'recents'];
  const libelleVue: Record<Vue, string> = {
    tous: t('filtres.tous'),
    favoris: t('filtres.favoris'),
    lus: t('filtres.lus'),
    nonlus: t('filtres.nonLus'),
    mieuxNotes: t('filtres.mieuxNotes'),
    recents: t('filtres.recents'),
  };

  return (
    <View style={styles.barre}>
      <View
        style={[
          styles.recherche,
          {
            backgroundColor: rechercheFocus ? palette.surface : palette.surfaceHaute,
            borderColor: rechercheFocus ? palette.primaire : palette.bordure,
            shadowColor: palette.ombre,
          },
          rechercheFocus && styles.rechercheFocus,
        ]}
      >
        <Icone nom="rechercher" couleur={rechercheFocus ? 'primaire' : 'texteSecondaire'} taille={18} />
        <TextInput
          value={texte}
          onChangeText={setTexte}
          placeholder={t('filtres.recherche')}
          placeholderTextColor={palette.texteSecondaire}
          accessibilityLabel={t('filtres.recherche')}
          testID="recherche"
          style={[styles.rechercheChamp, { color: palette.texte }]}
          returnKeyType="search"
          onFocus={() => setRechercheFocus(true)}
          onBlur={() => setRechercheFocus(false)}
        />
      </View>

      <View style={styles.ligneEntete}>
        <View style={styles.ligne}>
          {vues.map((v) => (
            <Puce
              key={v}
              actif={vue === v}
              libelle={libelleVue[v]}
              icone={ICONES_VUES[v]}
              onPress={() => onChange(VUES[v])}
            />
          ))}
        </View>
        {modeAffichage && onModeAffichageChange ? (
          <View style={[styles.segment, { backgroundColor: palette.surface, borderColor: palette.bordure }]}>
            {(['ligne', 'grille'] as const).map((mode) => {
              const actif = modeAffichage === mode;
              return (
                <Pressable
                  key={mode}
                  accessibilityRole="button"
                  accessibilityState={{ selected: actif }}
                  accessibilityLabel={t(`affichage.${mode}A11y`)}
                  onPress={() => onModeAffichageChange(mode)}
                  style={[
                    styles.segmentOption,
                    { backgroundColor: actif ? palette.primaireConteneur : 'transparent' },
                  ]}
                >
                  <Icone
                    nom={mode === 'ligne' ? 'liste' : 'grille'}
                    couleur={actif ? 'primaireConteneurTexte' : 'texteSecondaire'}
                    taille={15}
                  />
                  <Texte variante="legende" couleur={actif ? 'primaireConteneurTexte' : 'texteSecondaire'}>
                    {t(`affichage.${mode}`)}
                  </Texte>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </View>

      <View style={styles.ligne}>
        {CHAMPS_TRI.filter((c) => c !== 'updatedAt').map((c) => (
          <Puce
            key={c}
            actif={filtres.sort === c}
            libelle={t(`livre.${c}`)}
            onPress={() => onChange({ sort: c })}
          />
        ))}
        <Puce
          actif
          libelle={filtres.order === 'asc' ? '↑' : '↓'}
          onPress={() => onChange({ order: filtres.order === 'asc' ? 'desc' : 'asc' })}
        />
      </View>
    </View>
  );
}

export const BarreRecherche = memo(BarreRechercheBrut);

const styles = StyleSheet.create({
  barre: { gap: espacements.sm, paddingBottom: espacements.md },
  recherche: {
    minHeight: CIBLE_TACTILE,
    borderWidth: 1,
    borderRadius: rayons.rond,
    paddingHorizontal: espacements.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: espacements.sm,
  },
  rechercheChamp: { flex: 1, minHeight: CIBLE_TACTILE, fontSize: 14 },
  ligneEntete: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: espacements.sm },
  ligne: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.sm },
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
  rechercheFocus: ombres.niveau1,
  segment: {
    flexDirection: 'row',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: rayons.rond,
    padding: 2,
  },
  segmentOption: {
    minWidth: 84,
    minHeight: 32,
    borderRadius: rayons.rond,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: espacements.xs,
    paddingHorizontal: espacements.sm,
  },
});

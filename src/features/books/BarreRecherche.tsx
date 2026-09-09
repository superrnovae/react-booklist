/**
 * Barre de recherche, filtres et tri — tout côté serveur (§ Lot 2).
 * L'anti-rebond de 300 ms limite les requêtes ; l'annulation de la requête
 * précédente est assurée par le signal d'abandon de TanStack Query.
 */
import { Texte } from '@/components';
import { CHAMPS_TRI } from '@/domain/tri';
import type { ChampTri, SensTri, StatutFiltre } from '@/domain/types';
import { useDebounce } from '@/hooks/useDebounce';
import { usePalette } from '@/theme/ThemeProvider';
import { useI18n } from '@/theme/formats';
import { CIBLE_TACTILE, espacements, rayons } from '@/theme/tokens';
import { memo, useEffect, useState } from 'react';
import { Pressable, StyleSheet, TextInput, View } from 'react-native';

export type EtatFiltres = {
  q?: string;
  status?: StatutFiltre;
  favori?: boolean;
  sort: ChampTri;
  order: SensTri;
};

type Vue = 'tous' | 'lus' | 'nonlus' | 'favoris';

function vueCourante(f: EtatFiltres): Vue {
  if (f.favori) return 'favoris';
  if (f.status === 'lu') return 'lus';
  if (f.status === 'nonlu') return 'nonlus';
  return 'tous';
}

const VUES: Record<Vue, Partial<EtatFiltres>> = {
  tous: { status: undefined, favori: undefined },
  lus: { status: 'lu', favori: undefined },
  nonlus: { status: 'nonlu', favori: undefined },
  favoris: { status: undefined, favori: true },
};

function Puce({ actif, libelle, onPress }: { actif: boolean; libelle: string; onPress: () => void }) {
  const palette = usePalette();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: actif }}
      accessibilityLabel={libelle}
      onPress={onPress}
      style={[styles.puce, { borderColor: actif ? palette.primaire : palette.bordure, backgroundColor: actif ? palette.primaire : 'transparent' }]}
    >
      <Texte variante="legende" couleur={actif ? 'primaireTexte' : 'texte'}>
        {libelle}
      </Texte>
    </Pressable>
  );
}

type Props = { filtres: EtatFiltres; onChange: (patch: Partial<EtatFiltres>) => void };

function BarreRechercheBrut({ filtres, onChange }: Props) {
  const palette = usePalette();
  const { t } = useI18n();
  const [texte, setTexte] = useState(filtres.q ?? '');
  const debounce = useDebounce(texte, 300);

  useEffect(() => {
    const propre = debounce.trim();
    onChange({ q: propre.length ? propre : undefined });
  }, [debounce, onChange]);

  const vue = vueCourante(filtres);
  const vues: Vue[] = ['tous', 'lus', 'nonlus', 'favoris'];
  const libelleVue: Record<Vue, string> = {
    tous: t('filtres.tous'),
    lus: t('filtres.lus'),
    nonlus: t('filtres.nonLus'),
    favoris: t('filtres.favoris'),
  };

  return (
    <View style={styles.barre}>
      <TextInput
        value={texte}
        onChangeText={setTexte}
        placeholder={t('filtres.recherche')}
        placeholderTextColor={palette.texteSecondaire}
        accessibilityLabel={t('filtres.recherche')}
        testID="recherche"
        style={[styles.recherche, { color: palette.texte, backgroundColor: palette.surface, borderColor: palette.bordure }]}
        returnKeyType="search"
      />

      <View style={styles.ligne}>
        {vues.map((v) => (
          <Puce key={v} actif={vue === v} libelle={libelleVue[v]} onPress={() => onChange(VUES[v])} />
        ))}
      </View>

      <View style={styles.ligne}>
        {CHAMPS_TRI.filter((c) => c !== 'updatedAt').map((c) => (
          <Puce key={c} actif={filtres.sort === c} libelle={t(`livre.${c}`)} onPress={() => onChange({ sort: c })} />
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
    borderRadius: rayons.md,
    paddingHorizontal: espacements.md,
  },
  ligne: { flexDirection: 'row', flexWrap: 'wrap', gap: espacements.sm },
  puce: {
    minHeight: 32,
    justifyContent: 'center',
    paddingHorizontal: espacements.md,
    borderRadius: rayons.rond,
    borderWidth: 1,
  },
});

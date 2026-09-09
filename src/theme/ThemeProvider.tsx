/**
 * Thème clair/sombre (§ Lot 3) : préférence système par défaut, bascule manuelle,
 * application globale via Context, persistance du choix.
 */
import { ecrireJson, lireJson } from '@/services/stockage';
import {
    createContext,
    useContext,
    useEffect,
    useMemo,
    useState,
    type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import { palettes, type Palette } from './tokens';

export type ModeTheme = 'clair' | 'sombre' | 'systeme';
const CLE_THEME = 'booklist.theme';

type ContexteTheme = {
  mode: ModeTheme;
  estSombre: boolean;
  palette: Palette;
  definirMode: (mode: ModeTheme) => void;
  basculer: () => void;
};

const Contexte = createContext<ContexteTheme | null>(null);

export function FournisseurTheme({ children }: { children: ReactNode }) {
  const systeme = useColorScheme();
  const [mode, setMode] = useState<ModeTheme>('systeme');

  useEffect(() => {
    lireJson<ModeTheme>(CLE_THEME).then((stocke) => {
      if (stocke) setMode(stocke);
    });
  }, []);

  const definirMode = (nouveau: ModeTheme) => {
    setMode(nouveau);
    void ecrireJson(CLE_THEME, nouveau);
  };

  const estSombre = mode === 'systeme' ? systeme === 'dark' : mode === 'sombre';

  const valeur = useMemo<ContexteTheme>(
    () => ({
      mode,
      estSombre,
      palette: estSombre ? palettes.sombre : palettes.clair,
      definirMode,
      basculer: () => definirMode(estSombre ? 'clair' : 'sombre'),
    }),
    [mode, estSombre],
  );

  return <Contexte.Provider value={valeur}>{children}</Contexte.Provider>;
}

export function useTheme(): ContexteTheme {
  const ctx = useContext(Contexte);
  if (!ctx) throw new Error('useTheme doit être utilisé dans FournisseurTheme.');
  return ctx;
}

/** Raccourci pour n'obtenir que la palette courante. */
export function usePalette(): Palette {
  return useTheme().palette;
}

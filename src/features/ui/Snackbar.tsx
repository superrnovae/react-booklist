/**
 * Snackbar global : retour visible pour toute action, avec action optionnelle
 * (ex. « Annuler » d'une suppression pendant 5 s).
 */
import { Texte } from '@/components';
import { usePalette } from '@/theme/ThemeProvider';
import { espacements, rayons } from '@/theme/tokens';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

type Action = { libelle: string; onPress: () => void };
type Options = { action?: Action; dureeMs?: number };

type Contexte = { afficher: (message: string, options?: Options) => void };
const CtxSnackbar = createContext<Contexte | null>(null);

export function FournisseurSnackbar({ children }: { children: ReactNode }) {
  const palette = usePalette();
  const [message, setMessage] = useState<string | null>(null);
  const [action, setAction] = useState<Action | null>(null);
  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);

  const masquer = useCallback(() => {
    setMessage(null);
    setAction(null);
    if (minuteur.current) clearTimeout(minuteur.current);
  }, []);

  const afficher = useCallback(
    (msg: string, options?: Options) => {
      if (minuteur.current) clearTimeout(minuteur.current);
      setMessage(msg);
      setAction(options?.action ?? null);
      minuteur.current = setTimeout(masquer, options?.dureeMs ?? 4000);
    },
    [masquer],
  );

  return (
    <CtxSnackbar.Provider value={{ afficher }}>
      {children}
      {message ? (
        <View style={[styles.barre, { backgroundColor: palette.texte }]} accessibilityLiveRegion="polite">
          <Texte couleur="texteInverse" style={styles.texte}>
            {message}
          </Texte>
          {action ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                action.onPress();
                masquer();
              }}
              hitSlop={8}
            >
              <Texte couleur="primaire" variante="sousTitre">
                {action.libelle}
              </Texte>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </CtxSnackbar.Provider>
  );
}

export function useSnackbar(): Contexte {
  const ctx = useContext(CtxSnackbar);
  if (!ctx) throw new Error('useSnackbar doit être utilisé dans FournisseurSnackbar.');
  return ctx;
}

const styles = StyleSheet.create({
  barre: {
    position: 'absolute',
    left: espacements.lg,
    right: espacements.lg,
    bottom: espacements.xl,
    padding: espacements.lg,
    borderRadius: rayons.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacements.md,
  },
  texte: { flex: 1 },
});

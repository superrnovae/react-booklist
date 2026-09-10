/**
 * Snackbar global : retour visible pour toute action, avec action optionnelle
 * (ex. « Annuler » d'une suppression pendant 5 s).
 */
import { Icone, Texte } from '@/components';
import { usePalette } from '@/theme/ThemeProvider';
import { espacements, ombres, rayons } from '@/theme/tokens';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, StyleSheet } from 'react-native';

type Action = { libelle: string; onPress: () => void };
type Options = { action?: Action; dureeMs?: number };

type Contexte = { afficher: (message: string, options?: Options) => void };
const CtxSnackbar = createContext<Contexte | null>(null);

function SnackbarAffiche({
  message,
  action,
  masquer,
}: {
  message: string;
  action: Action | null;
  masquer: () => void;
}) {
  const palette = usePalette();
  const [entree] = useState(() => new Animated.Value(0));

  useEffect(() => {
    entree.setValue(0);
    Animated.timing(entree, { toValue: 1, duration: 180, useNativeDriver: true }).start();
  }, [entree, message]);

  return (
    <Animated.View
      style={[
        styles.barre,
        {
          backgroundColor: palette.surfaceHaute,
          borderColor: palette.bordure,
          shadowColor: palette.ombre,
          opacity: entree,
          transform: [{ translateY: entree.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) }],
        },
      ]}
      accessibilityLiveRegion="polite"
    >
      <Icone nom="appliquer" couleur="succes" taille={15} />
      <Texte couleur="texte" style={styles.texte}>
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
          style={({ pressed }) => [styles.action, pressed && { backgroundColor: palette.surfaceEnfoncee }]}
        >
          <Texte couleur="primaire" variante="bouton">
            {action.libelle}
          </Texte>
        </Pressable>
      ) : null}
    </Animated.View>
  );
}

export function FournisseurSnackbar({ children }: { children: ReactNode }) {
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
      {message ? <SnackbarAffiche message={message} action={action} masquer={masquer} /> : null}
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
    paddingVertical: espacements.md,
    paddingHorizontal: espacements.lg,
    borderRadius: rayons.lg,
    borderWidth: StyleSheet.hairlineWidth,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: espacements.md,
    ...ombres.niveau2,
  },
  texte: { flex: 1 },
  action: { borderRadius: rayons.rond, paddingHorizontal: espacements.sm, paddingVertical: espacements.xs },
});

/**
 * Boite de confirmation Material-like, sans `window.confirm`, testable et
 * uniforme web/native.
 */
import { Bouton, Texte } from '@/components';
import { usePalette } from '@/theme/ThemeProvider';
import { espacements, ombres, rayons } from '@/theme/tokens';
import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, View } from 'react-native';

type OptionsConfirmation = {
  titre: string;
  message: string;
  valider: string;
  annuler: string;
  destructive?: boolean;
};

type DemanderConfirmation = (options: OptionsConfirmation) => Promise<boolean>;
type ContexteConfirmation = { demanderConfirmation: DemanderConfirmation };

const CtxConfirmation = createContext<ContexteConfirmation | null>(null);

export function FournisseurConfirmation({ children }: { children: ReactNode }) {
  const palette = usePalette();
  const [options, setOptions] = useState<OptionsConfirmation | null>(null);
  const repondre = useRef<((valeur: boolean) => void) | null>(null);

  const fermer = useCallback((valeur: boolean) => {
    repondre.current?.(valeur);
    repondre.current = null;
    setOptions(null);
  }, []);

  const demanderConfirmation = useCallback<DemanderConfirmation>((prochainesOptions) => {
    if (repondre.current) {
      repondre.current(false);
    }
    setOptions(prochainesOptions);
    return new Promise<boolean>((resolve) => {
      repondre.current = resolve;
    });
  }, []);

  return (
    <CtxConfirmation.Provider value={{ demanderConfirmation }}>
      {children}
      <Modal
        transparent
        visible={Boolean(options)}
        animationType="fade"
        onRequestClose={() => fermer(false)}
      >
        <View style={[styles.voile, { backgroundColor: palette.voile }]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={options?.annuler}
            style={StyleSheet.absoluteFill}
            onPress={() => fermer(false)}
          />
          <View
            accessibilityRole="alert"
            style={[
              styles.dialogue,
              { backgroundColor: palette.surfaceHaute, borderColor: palette.bordure, shadowColor: palette.ombre },
            ]}
          >
            <Texte variante="titre">{options?.titre}</Texte>
            <Texte couleur="texteSecondaire">{options?.message}</Texte>
            <View style={styles.actions}>
              <Bouton
                titre={options?.annuler ?? ''}
                onPress={() => fermer(false)}
                variante="fantome"
                style={styles.bouton}
              />
              <Bouton
                titre={options?.valider ?? ''}
                onPress={() => fermer(true)}
                variante={options?.destructive ? 'danger' : 'primaire'}
                style={styles.bouton}
              />
            </View>
          </View>
        </View>
      </Modal>
    </CtxConfirmation.Provider>
  );
}

export function useConfirmation(): ContexteConfirmation {
  const ctx = useContext(CtxConfirmation);
  if (!ctx) throw new Error('useConfirmation doit être utilisé dans FournisseurConfirmation.');
  return ctx;
}

const styles = StyleSheet.create({
  voile: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: espacements.lg,
  },
  dialogue: {
    width: '100%',
    maxWidth: 420,
    padding: espacements.xl,
    borderRadius: rayons.lg,
    borderWidth: StyleSheet.hairlineWidth,
    gap: espacements.md,
    ...ombres.niveau2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: espacements.sm,
    marginTop: espacements.sm,
  },
  bouton: { minWidth: 120 },
});

import '@/global.css';

import { View } from 'react-native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components';
import { queryClient } from '@/features/query/client';
import { creerPersister } from '@/features/query/persister';
import { FournisseurAuthentification, Garde } from '@/features/auth';
import { demarrerCaptureErreursGlobales } from '@/features/journal';
import { FournisseurSync, IndicateurSync } from '@/features/sync';
import { FournisseurConfirmation } from '@/features/ui/Confirmation';
import { FournisseurSnackbar } from '@/features/ui/Snackbar';
import { restaurerLangue } from '@/theme/i18n';
import { FournisseurTheme, usePalette, useTheme } from '@/theme/ThemeProvider';

void SplashScreen.preventAutoHideAsync();

const persister = creerPersister();

function Navigation() {
  const palette = usePalette();
  const { estSombre } = useTheme();
  return (
    <View style={{ flex: 1, backgroundColor: palette.fond }}>
      <StatusBar style={estSombre ? 'light' : 'dark'} />
      <IndicateurSync />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.surface },
          headerTintColor: palette.texte,
          headerTitleStyle: { fontSize: 18, fontWeight: '700' },
          contentStyle: { backgroundColor: palette.fond },
          headerShadowVisible: false,
        }}
      />
    </View>
  );
}

export default function RootLayout() {
  useEffect(() => {
    restaurerLangue().finally(() => SplashScreen.hideAsync());
  }, []);

  // § Lot 5 : capture les erreurs/rejets de promesse qu'aucun composant n'a
  // interceptés (hors du filet de l'ErrorBoundary, qui ne voit que les
  // erreurs de rendu React) et les consigne dans le journal structuré.
  useEffect(() => demarrerCaptureErreursGlobales(), []);

  return (
    <SafeAreaProvider>
      {/* Au sommet de l'arbre (BL-10) : couvre une erreur pendant
          l'initialisation d'un fournisseur, PersistQueryClientProvider
          (I/O de stockage au démarrage) et le thème/i18n compris — voir
          ErrorBoundary.tsx pour pourquoi son rendu de secours n'en dépend pas. */}
      <ErrorBoundary>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister, maxAge: 24 * 60 * 60 * 1000 }}
        >
          <FournisseurTheme>
            <FournisseurSnackbar>
              <FournisseurConfirmation>
                <FournisseurAuthentification>
                  <FournisseurSync>
                    <Garde>
                      <Navigation />
                    </Garde>
                  </FournisseurSync>
                </FournisseurAuthentification>
              </FournisseurConfirmation>
            </FournisseurSnackbar>
          </FournisseurTheme>
        </PersistQueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}

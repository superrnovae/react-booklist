import '@/global.css';

import { View } from 'react-native';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Redirect, Stack, usePathname } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, type ReactNode } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components';
import { queryClient } from '@/features/query/client';
import { creerPersister } from '@/features/query/persister';
import { FournisseurAuthentification, useAuth } from '@/features/auth';
import { FournisseurSync, IndicateurSync } from '@/features/sync';
import { FournisseurConfirmation } from '@/features/ui/Confirmation';
import { FournisseurSnackbar } from '@/features/ui/Snackbar';
import { restaurerLangue } from '@/theme/i18n';
import { FournisseurTheme, usePalette, useTheme } from '@/theme/ThemeProvider';

void SplashScreen.preventAutoHideAsync();

const persister = creerPersister();

/** Routes protégées : redirige vers la connexion et revient à l'écran demandé. */
function Garde({ children }: { children: ReactNode }) {
  const { statut } = useAuth();
  const chemin = usePathname();
  const enConnexion = chemin === '/connexion';

  if (statut === 'inconnu') return null;
  if (statut === 'deconnecte' && !enConnexion) {
    return <Redirect href={{ pathname: '/connexion', params: { de: chemin } }} />;
  }
  if (statut === 'connecte' && enConnexion) return <Redirect href="/" />;
  return <>{children}</>;
}

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

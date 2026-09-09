import '@/global.css';
import '@/theme/i18n';

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
    <>
      <StatusBar style={estSombre ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: palette.fond },
          headerTintColor: palette.texte,
          contentStyle: { backgroundColor: palette.fond },
          headerShadowVisible: false,
        }}
      />
    </>
  );
}

export default function RootLayout() {
  useEffect(() => {
    restaurerLangue().finally(() => SplashScreen.hideAsync());
  }, []);

  return (
    <SafeAreaProvider>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister, maxAge: 24 * 60 * 60 * 1000 }}
      >
        <FournisseurTheme>
          <FournisseurSnackbar>
            <FournisseurAuthentification>
              <ErrorBoundary>
                <Garde>
                  <Navigation />
                </Garde>
              </ErrorBoundary>
            </FournisseurAuthentification>
          </FournisseurSnackbar>
        </FournisseurTheme>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}

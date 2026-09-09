import '@/global.css';
import '@/theme/i18n';

import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components';
import { queryClient } from '@/features/query/client';
import { creerPersister } from '@/features/query/persister';
import { FournisseurSnackbar } from '@/features/ui/Snackbar';
import { restaurerLangue } from '@/theme/i18n';
import { FournisseurTheme, usePalette, useTheme } from '@/theme/ThemeProvider';

void SplashScreen.preventAutoHideAsync();

const persister = creerPersister();

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
            <ErrorBoundary>
              <Navigation />
            </ErrorBoundary>
          </FournisseurSnackbar>
        </FournisseurTheme>
      </PersistQueryClientProvider>
    </SafeAreaProvider>
  );
}

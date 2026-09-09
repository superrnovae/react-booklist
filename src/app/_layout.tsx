import '@/global.css';
import '@/theme/i18n';

import { QueryClientProvider } from '@tanstack/react-query';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { ErrorBoundary } from '@/components';
import { queryClient } from '@/features/query/client';
import { FournisseurSnackbar } from '@/features/ui/Snackbar';
import { restaurerLangue } from '@/theme/i18n';
import { FournisseurTheme, usePalette, useTheme } from '@/theme/ThemeProvider';

void SplashScreen.preventAutoHideAsync();

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
      <QueryClientProvider client={queryClient}>
        <FournisseurTheme>
          <FournisseurSnackbar>
            <ErrorBoundary>
              <Navigation />
            </ErrorBoundary>
          </FournisseurSnackbar>
        </FournisseurTheme>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

import { FournisseurTheme } from '@/theme/ThemeProvider';
import '@/theme/i18n';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react-native';
import type { ReactElement, ReactNode } from 'react';

/** Enveloppe un composant dans le thème pour les tests d'UI pure (render async, RTL 14). */
export function rendreAvecTheme(ui: ReactElement) {
  return render(<FournisseurTheme>{ui}</FournisseurTheme>);
}

/** Crée un QueryClient de test (retry désactivé, pas de cache résiduel). */
export function creerClientTest(): QueryClient {
  return new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  });
}

export function EnveloppeQuery({ client, children }: { client: QueryClient; children: ReactNode }) {
  return (
    <QueryClientProvider client={client}>
      <FournisseurTheme>{children}</FournisseurTheme>
    </QueryClientProvider>
  );
}

export { screen };

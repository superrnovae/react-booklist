import { defineConfig, devices } from '@playwright/test';

/**
 * Tests de bout en bout (§ Lot 5) sur le parcours critique, exécutés sur
 * navigateur contre l'app Expo web + l'API BookList.
 *
 * Prérequis (démarrés séparément, réutilisés s'ils tournent déjà) :
 *  - API   : `cd api-books-v2 ; npm start`   (http://localhost:3000)
 *  - Web   : `npm run web`                   (http://localhost:8081)
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: 'http://localhost:8081',
    trace: 'on-first-retry',
    // Le premier bundle Metro peut être long (surtout en CI, à froid).
    navigationTimeout: 120_000,
    actionTimeout: 20_000,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
  webServer: {
    command: 'npx expo start --web --port 8081',
    url: 'http://localhost:8081',
    reuseExistingServer: true,
    timeout: 240_000,
  },
});

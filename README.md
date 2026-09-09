# BookList Pro

[![CI](https://github.com/OWNER/booklist-pro/actions/workflows/ci.yml/badge.svg)](https://github.com/OWNER/booklist-pro/actions/workflows/ci.yml)

> Remplacez `OWNER/booklist-pro` par le chemin réel du dépôt pour activer le badge.

Le cahier de lecture numérique des Comptoirs du Livre. Application **React Native
(Expo Router)** ciblant en priorité le **navigateur**, cliente de l'API fournie
`api-books-v2`.

## Démarrage en moins de 5 minutes

Prérequis : Node ≥ 20.

```bash
# 1) L'API (dans un premier terminal)
cd api-books-v2
npm install
npm run seed          # 500 ouvrages + 2 comptes
npm start             # http://localhost:3000

# 2) L'application (dans un second terminal, à la racine)
npm install
npm run web           # ouvre http://localhost:8081
```

L'application détecte l'API sur `http://<hôte>:3000`. Pour pointer ailleurs :

```bash
# .env  (jamais de secret ici, variable publique)
EXPO_PUBLIC_API_URL=http://localhost:3000
```

### Comptes de test (lot 4, authentification)

| Email | Mot de passe | Rôle |
|---|---|---|
| `editeur@booklist.fr` | `editeur123` | Libraire titulaire (écriture) |
| `lecteur@booklist.fr` | `lecteur123` | Libraire saisonnier (lecture seule) |

## Scripts

| Commande | Effet |
|---|---|
| `npm run web` | Lance l'app sur navigateur |
| `npm test` | Tests unitaires et composants (Jest) |
| `npm run test:coverage` | Tests + couverture |
| `npm run e2e` | Tests de bout en bout (Playwright, cible navigateur) |
| `npm run export:web` | Génère l'export web statique dans `dist/` |
| `npm run typecheck` | Vérification TypeScript (`tsc --noEmit`) |
| `npm run lint` | Lint Expo |

### Lancer l'API dans ses différents modes (Windows PowerShell)

Les scripts `chaos`/`auth`/`final` de l'API utilisent une syntaxe Unix. Sous
Windows, définissez les variables puis lancez le serveur :

```powershell
cd api-books-v2
$env:AUTH_REQUIRED='true'; $env:CHAOS_LATENCE='1500'; $env:CHAOS_ECHEC='0.3'; node src/server.js
```

## Architecture

Découpage en couches strict (détaillé dans [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)) :

```
src/
  app/         écrans et routing (expo-router) — ni logique métier, ni appel réseau
  components/  UI pure, sans dépendance à l'API ni au store
  features/    logique par domaine (books, notes, auth, sync, stats, ui)
  hooks/       hooks réutilisables
  services/    réseau, stockage, plateforme — seul endroit qui connaît l'API
  domain/      types et règles métier pures (tri, file de mutations, conflits)
  theme/       tokens de design et i18n
```

Règle vérifiée : **aucun `fetch` ni URL en dur** hors de `services/`.

## Contrat de qualité

- TypeScript strict, **zéro `any`**, réponses API **validées à l'exécution avec zod**.
- Erreurs applicatives discriminées (`ErreurReseau`, `ErreurValidation`,
  `ErreurConflit`, `ErreurAuth`), `ErrorBoundary` global, réessai visible.
- 422 (erreur par champ) et 503 (réessai) traités différemment.
- Quatre états sur chaque écran de données : chargement (squelette), erreur,
  vide contextualisé, succès.
- Thème clair/sombre et interface bilingue fr/en, sans couleur ni chaîne en dur.

## Tests

Unitaires/composants avec **Jest** (`npm test`) ; bout en bout avec **Playwright**
(`npm run e2e`).

Le parcours critique E2E (`e2e/parcours-critique.spec.ts`) couvre : chargement de
la liste paginée, recherche serveur, ouverture d'une fiche, et création d'un
ouvrage de bout en bout. Prérequis : l'API et l'app web démarrées (voir plus haut) ;
Playwright réutilise un serveur déjà lancé.

## État des lots livrés

- **Lot 1** — CRUD ouvrages, statut lu, pagination serveur, suppression annulable,
  formulaire react-hook-form + zod, TanStack Query.
- **Lot 2** — Notes de lecture, coups de cœur optimistes, recherche/filtres/tri
  serveur, défilement infini, anti-rebond 300 ms, accessibilité.
- **Lot 3** — Note en étoiles (0–5), couvertures avec repli (jamais d'image
  cassée), enrichissement OpenLibrary (cache/timeout, dégradation silencieuse),
  thème clair/sombre persistant, interface bilingue fr/en, doc de performance.
- **Lot 4** — Authentification + rôles, intercepteur unique à rafraîchissement
  **single-flight**, routes protégées, cache persistant + **file de mutations
  hors ligne** rejouée via `POST /sync` (idempotente), indicateur de
  synchronisation permanent, **résolution de conflits assistée** champ par champ,
  tableau de bord consultable hors ligne.
- **Lot 5** — Intégration continue GitHub Actions (lint, typecheck, tests, E2E)
  avec badge ; export web statique déployable (GitHub Pages / Netlify / Vercel /
  EAS), voir `docs/DEPLOIEMENT.md`.

> Note : l'API fournie n'implémente pas les routes de couverture décrites dans son
> annexe (voir `docs/API-ECARTS.md`) ; l'affichage dégrade proprement et l'upload
> n'est pas branché sur une route inexistante.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — schéma des couches, parcours d'une modification.
- [`docs/ADR/`](docs/ADR/) — décisions d'architecture.
- [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) — mesures de performance sur les 500 ouvrages.
- [`docs/DEPLOIEMENT.md`](docs/DEPLOIEMENT.md) — export web statique et cibles de déploiement.
- [`docs/API-ECARTS.md`](docs/API-ECARTS.md) — écarts constatés dans l'API fournie.
- [`IA.md`](IA.md) — usage de l'assistant de génération de code.

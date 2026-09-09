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

## État des lots livrés

- **Lot 1** — CRUD ouvrages, statut lu, pagination serveur, suppression annulable,
  formulaire react-hook-form + zod, TanStack Query.
- **Lot 2** — Notes de lecture, coups de cœur optimistes, recherche/filtres/tri
  serveur, défilement infini, anti-rebond 300 ms, accessibilité.
- **Lot 3 / 4** — voir `docs/ADR/` pour les décisions et l'état d'avancement.

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — schéma des couches, parcours d'une modification.
- [`docs/ADR/`](docs/ADR/) — décisions d'architecture.
- [`docs/PERFORMANCE.md`](docs/PERFORMANCE.md) — mesures de performance sur les 500 ouvrages.
- [`IA.md`](IA.md) — usage de l'assistant de génération de code.

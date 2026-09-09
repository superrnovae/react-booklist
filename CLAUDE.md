@AGENTS.md

# BookList Pro — Contexte projet

Application React Native (Expo Router v57, **cible navigateur** via `expo start --web`)
cliente de l'API `api-books-v2`. Sujet complet : `SPECIFICATION.md`.

## Règle absolue
- **Ne jamais modifier le code de `api-books-v2/`.** C'est l'API fournie, en production.
- Lire les docs versionnées Expo v57 avant tout code : https://docs.expo.dev/versions/v57.0.0/

## Commandes
| But | Commande |
|---|---|
| API normale | `cd api-books-v2 ; npm start` (http://localhost:3000) |
| API seed | `cd api-books-v2 ; npm run seed` |
| API auth | `cd api-books-v2 ; $env:AUTH_REQUIRED='true'; node src/server.js` |
| API chaos | `$env:CHAOS_LATENCE='1500'; $env:CHAOS_ECHEC='0.3'; node src/server.js` |
| App web | `npm run web` |
| Tests | `npm test` |
| Typecheck | `npx tsc --noEmit` |
| Lint | `npm run lint` |

> Sur Windows, les scripts `npm run chaos/auth/final` de l'API échouent (syntaxe `VAR=val` unix) :
> définir les variables via `$env:` puis lancer `node src/server.js`.

## Architecture en couches (contrat qualité)
`app/` routing → `features/` → `hooks/` → `services/` (seul à connaître l'API) → `domain/` (pur).
`components/` = UI pure. `theme/` = tokens + i18n. **Aucun fetch/URL hors de `services/`.**

## API — points clés
- `GET /books` paginé `{ items, page, limit, total, totalPages }` ; params `page,limit,q,status(lu|nonlu),favori,auteur,sort,order`.
- Champ **`titre`** (pas `nom`). Ouvrage porte `version` + `updatedAt`.
- `PUT` (complet) / `PATCH` (partiel) avec `If-Match: <version>` → 409 `{ erreur, serveur, versionAttendue }`.
- `POST /sync` : `{ mutations:[{id,type,livre,baseVersion,livreId}] }` → résultats `ok|conflit|erreur`, **idempotent** par `id` (rejeu:true).
- Couverture: `/covers/<id>.svg` (préfixer), `/media/<id>.png` (préfixer), `null` (repli), `https://` (tel quel).
- Erreurs: 422 (par champ, `champs`), 503 (chaos, réessai), 409 (conflit), 401 (`jeton_expire` → refresh+rejeu), 403 (`droits_insuffisants`).
- Auth (lot 4): `POST /auth/login`, `POST /auth/refresh`, `GET /me`. Access TTL 120s. Comptes: `editeur@booklist.fr/editeur123`, `lecteur@booklist.fr/lecteur123`.

## État d'avancement
- [x] API vérifiée (install/seed/health)
- [x] Git réinitialisé (repo neuf, commits atomiques)
- [x] Dépendances client
- [x] Fondations: domain + services + theme/i18n
- [x] Lot 1 (CRUD, pagination, 4 états, undo delete, form RHF+zod, TanStack Query)
- [x] Lot 2 (notes, favori optimiste, recherche/filtres/tri serveur, scroll infini, debounce, a11y)
- [x] Lot 3 (note étoiles, couvertures+repli, OpenLibrary, thème clair/sombre, i18n, perf)
- [x] Lot 4 (auth+intercepteur single-flight, cache persistant, file mutations offline, sync idempotent, conflits assistés, dashboard offline)
- [x] Lot 5 partiel (CI GitHub Actions lint/typecheck/tests + E2E Playwright + badge ; export web statique + configs de déploiement GitHub Pages/Netlify/Vercel/EAS)

## Tests
`npm test` — 68 tests Jest verts (domain, services, auth single-flight, form resolver, composants RTL, hook).
`npm run e2e` — 2 tests Playwright (parcours critique : liste→recherche→fiche, et création d'ouvrage).
E2E prérequis : API (`:3000`) + web (`:8081`) démarrés ; Playwright réutilise un serveur lancé.
RTL 14 : `render`/`renderHook` sont **async** (await). Lint 0 erreur, tsc 0 erreur.

## Bugs API contournés côté client (API non modifiée)
- `/covers`, `/books/:id/cover`, `/media` absents → repli image (`docs/API-ECARTS.md`).
- `POST/PUT /books` rejette `couverture: null` (422) → `services/api/livres.ts::corpsLivre` omet le champ null (création, PUT, PATCH, sync). Découvert par l'E2E.

## Déploiement web
- `npm run export:web` → `dist/` (rendu statique, 10 routes). API via `EXPO_PUBLIC_API_URL` au build.
- `app.config.js` injecte `experiments.baseUrl` depuis `EXPO_BASE_URL` (sous-chemin GitHub Pages) sans impacter dev/local.
- Cibles prêtes : `.github/workflows/deploy-web.yml` (Pages), `netlify.toml`, `vercel.json`, `eas.json`. Voir `docs/DEPLOIEMENT.md`.

## Conventions Git
Commits conventionnels : `feat`, `fix`, `refactor`, `test`, `docs`, `chore`. Un commit par fonctionnalité/fix.
Trailer `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`.

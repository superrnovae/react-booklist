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
- [ ] Dépendances client
- [ ] Fondations (domain / services / theme)
- [ ] Lot 1 · Lot 2 · Lot 3 · Lot 4 · Lot 5

## Conventions Git
Commits conventionnels : `feat`, `fix`, `refactor`, `test`, `docs`, `chore`. Un commit par fonctionnalité/fix.
Trailer `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`.

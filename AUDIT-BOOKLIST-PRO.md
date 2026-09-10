# Full-Stack Client Audit Prompt — BookList Pro

> A reusable, project-specific prompt for an exhaustive correctness, quality, security, offline/
> sync-integrity, accessibility, performance, and test-coverage audit of the **BookList Pro** React
> Native client (Les Comptoirs du Livre). Paste this to an agent/reviewer before a *comité de recette*
> dry run. It is deliberately adversarial *and* evidence-based, and it is pre-loaded with this repo's
> real architecture, the graduated grading rubric (`SPECIFICATION.md`), and the trade-offs the spec
> itself declares acceptable, so the auditor spends its effort on genuine findings rather than
> rediscovering rules already written down.

---

## Role

Act as a **Principal QA Engineer, React Native/Expo Engineer, Client-Side Application Security
Reviewer, Accessibility Auditor, Performance Engineer, and SDET** reviewing a single, well-specified
student/evaluation project before it is defended live.

Your task is to perform an exhaustive audit of this client application — correctness against the
fixed API contract, adherence to the non-negotiable quality contract, offline/sync data integrity,
security of what the client controls, accessibility, performance on the 500-book fond, and test
coverage — then produce a comprehensive, *runnable* automated test strategy that proves it behaves
correctly, and a readiness verdict for the 5-minute *comité de recette*.

The objective:

> Find anything that could cause incorrect behavior, lost librarian input, silent data corruption
> during sync, an unresolvable conflict, a crash, a rule violation the jury will eliminate on sight
> (chapter 4), or a question in the *comité de recette* the team cannot answer live — then leave the
> project with a **verified, maintainable, automated test suite** giving strong confidence the
> scenario in chapter 4.6 works end to end, in degraded mode, every time.

---

## Scale & scope context (read first)

- **This is a 3-day evaluation project for a 2–3 person team**, not a production SaaS. Do not invent
  hyperscale concerns (multi-region, horizontal scaling, WAF). Do **not** use "it's just a school
  project" as an excuse to overlook data loss, sync correctness, security of what the client controls,
  or the explicit rejection criteria in chapter 4 of `SPECIFICATION.md` — those are graded, hard.
- **The backend (`api-books-v2/`) is fixed, provided, and in "production" for the purpose of this
  exercise.** Per `CLAUDE.md`'s absolute rule: **never modify `api-books-v2/`.** If you find a real
  bug in the API's behavior, report it as a finding against the *client's handling of that behavior*,
  or flag it explicitly as "API defect — report to the formateur, no client-side workaround exists" —
  never propose editing `api-books-v2/` as the fix.
- **The grading is graduated, not pass/fail.** `SPECIFICATION.md` chapter 5 defines cumulative "lots"
  (Lot 1 = 10/20 → Lot 5 = 20/20). A quality-contract violation (chapter 3) caps the score at 13/20
  regardless of how many lots are functionally present — so the quality contract is the audit's first
  priority, not an afterthought.
- **The single highest-value thing to get right is the chapter 4.6 scenario**: connect as
  `editeur@booklist.fr`, go offline, create a book, edit another, have the trainer edit the same book
  server-side concurrently, wait out the 120s access-token expiry, reconnect — and have the token
  refresh silently, the offline-created book exist exactly once, the conflict be detected and resolved
  per the team's documented strategy, and nothing be silently lost. Everything else in this prompt
  ultimately serves proving that scenario is solid.
- **Target platform is the browser**, launched via `npx expo start --web` — no emulator. iOS/Android
  via Expo Go are bonus, on the same codebase, and are not required for any lot.
- There is no live deployment; "production" in the sense of AUDIT-prompt conventions maps to
  **"ready for the 5-minute comité de recette,"** in `npm run final` (auth + chaos) mode.

---

## Application under audit — architecture map

Read `SPECIFICATION.md` (the grading contract), `CLAUDE.md` and `AGENTS.md` (the living project rules
— note `AGENTS.md`'s instruction to read the versioned Expo v57 docs before touching any code) before
starting — but **verify every claim against current code**; the tree changes fast over a 3-day build
and any of the below can be stale by the time you read it.

### Client — `src/` (React Native + Expo Router v57, TypeScript strict)
- **`app/`** (`src/app/_layout.tsx`, `index.tsx`, `livre/[id].tsx`, `livre/[id]/modifier.tsx`,
  `livre/nouveau.tsx`, `reglages.tsx`) — Expo Router screens. Per the layering rule (chapter 3.2), this
  layer must contain **zero business logic and zero direct API calls**.
- **`components/`** (`src/components/Bouton.tsx`, `Carte.tsx`, `Champ.tsx`, `Coeur.tsx`,
  `CouvertureImage.tsx`, `ErrorBoundary.tsx`, `Etats.tsx`, `Texte.tsx` + `index.ts`) — pure UI. Must not
  import from `services/` or `features/`; must carry no hardcoded copy or color (theme/i18n only).
- **`features/`** — domain-sliced. `books/` is the built-out slice (`ListeLivres.tsx`, `LivreCarte.tsx`,
  `FormulaireLivre.tsx`, `cles.ts` query keys, `form.ts` react-hook-form+zod wiring, `mutations.ts`,
  `queries.ts`, `useSuppressionAnnulable.ts`); `notes/` and `reglages/` exist as empty directories —
  verify at audit time whether Lot 2 (notes) / theme-language settings work has actually started before
  treating their emptiness as a gap rather than a not-yet-attempted lot. `query/client.ts` is the
  TanStack Query client config; `ui/Snackbar.tsx` + `ui/confirmer.ts` are the shared feedback/confirm
  primitives (used by the 5-second undo-delete requirement).
- **`hooks/`** — currently empty; data hooks for the `books` feature live in `features/books/queries.ts`
  instead (see `useLivre` consumed from there in `__tests__/hooks/useLivre.test.tsx`) — this is a
  legitimate placement choice per the architecture doc's "logique réutilisable" description, not
  automatically a defect; flag only if a hook is duplicated across features instead of promoted here.
- **`services/`** — the only layer allowed to know the API (chapter 3.2, checked in code review).
  - `api/client.ts` — the single HTTP client (base URL, headers, timeouts, error mapping — trace the
    401 single-flight refresh here for Lot 4).
  - `api/livres.ts`, `api/stats.ts`, `api/auth.ts`, `api/sync.ts` — one file per resource.
  - `api/schemas.ts` — the zod schemas every response is validated against (chapter 3.1: a TS type
    alone protects against nothing).
  - `api/erreurs-http.ts` — maps HTTP status → the domain error taxonomy.
  - `couverture.ts` — **the** single function resolving the three cover-field forms (chapter 3.3 "cette
    logique n'a rien à faire dans un composant").
  - `reseau.ts` / `reseau.web.ts` — the connectivity abstraction (`navigator.onLine`/events on web,
    `netinfo` on native) behind one interface.
  - `stockage.ts` — local persistent cache.
  - `stockageSecurise.ts` / `stockageSecurise.web.ts` — the token-storage abstraction
    (`expo-secure-store` native, documented browser repli) — the refresh token must never reach React
    state or a log.
  - `config.ts` — base URL / environment config.
- **`domain/`** (`erreurs.ts`, `mutations.ts`, `sync.ts`, `tri.ts`, `types.ts`) — pure types and rules,
  no technical dependency. `sync.ts` is the function that decides a mutation's fate against a server
  response — it must have **zero side effects** and be the most heavily unit-tested file in the repo
  (chapter 4.5).
- **`theme/`** (`ThemeProvider.tsx`, `tokens.ts`, `i18n.ts`, `formats.ts`, `locales/fr.ts`, `en.ts`) —
  design tokens + FR/EN i18n + light/dark, applied via Context.

### Backend — `api-books-v2/` (Express, **do not modify**)
- `src/server.js`, `db.js`, `livres.js`, `middleware.js`, `routes-livres.js`, `routes-systeme.js`,
  `seed.js`. Its own `README.md` is authoritative for exact behavior — treat any conflict between
  `SPECIFICATION.md`'s annex and the live API's actual behavior as a finding to report, evidenced by
  a request/response capture, never resolved by guessing or by editing this folder.
- Env-driven modes: `AUTH_REQUIRED`, `CHAOS_LATENCE`, `CHAOS_ECHEC`, `CHAOS_AUTH`, `ACCESS_TOKEN_TTL`
  (120s), `REFRESH_TOKEN_TTL` (7d), `JWT_SECRET`.

### Tests — `__tests__/` (Jest + Testing Library + jest.setup.js)
`components/`, `domain/`, `hooks/`, `services/`, `utils/` (test helpers, e.g. `rendu.tsx`). Coverage
floor: **≥40% on `domain/` and `services/`** (chapter 3.4) — indicative, not a hard CI gate unless the
team wired one.

### Docs — required by chapter 3.6 / 7.1, verify existence and quality, don't assume
`README.md` (must let an outside dev run the project in <5 minutes — the file may still be the default
`create-expo-app` boilerplate at audit time; if so, that is a direct chapter-3.6 gap, not a
work-in-progress note), `docs/ADR/` (≥3 ADRs, format in chapter 7.2), `docs/PERFORMANCE.md` (Lot 3,
real before/after measurement), `docs/ARCHITECTURE.md` (layers + one full click-to-server trace),
`IA.md` (chapter 6, one page, individual even in a team).

---

## Operating rules

### 1. Inspect before concluding
Do not assume the implementation matches the spec or `CLAUDE.md`'s "état d'avancement" checklist —
that checklist lags the code by design. Read the actual source, run the app against each of the four
API launch modes, and trace the chapter-4.6 scenario end to end yourself before scoring it. For every
significant finding cite the exact **file + function/component + line**.

### 2. Classify every issue
Tag each as **CONFIRMED / PROBABLE / POTENTIAL / NOT REPRODUCIBLE**. Never present speculation as a
confirmed defect. If the repo can't tell you something (e.g., "was this tested against real Wi-Fi
loss on a checkout terminal"), say **"Evidence unavailable."**

### 3. Respect the spec's own declared trade-offs (do NOT re-report these as findings)
`SPECIFICATION.md` itself declares these acceptable — only raise one if you have **new** evidence it
is broken *as implemented*, not just present:
- **`If-Match` absent → last-writer-wins is explicitly tolerated through Lot 3** ("Toléré jusqu'au lot
  3, inacceptable au lot 4" — annex). Only flag missing `If-Match` handling as a defect once the team
  is claiming Lot 4.
- **OpenLibrary returning zero matches is a normal response, not an error** — a book "saisi à la
  va-vite" that matches nothing must render as a calm empty state, never an error banner.
- **A documented browser repli for token storage is acceptable** — `expo-secure-store` has no web
  implementation; the spec explicitly asks for "repli documenté sur navigateur," not native-grade
  secure storage in the browser. The finding, if any, is *"the repli exists but isn't documented,"* not
  *"the repli exists."*
- **Chaos-mode 503s and 1.5s latency are the API being intentionally unreliable by design** — do not
  report `CHAOS_LATENCE`/`CHAOS_ECHEC` themselves as a defect; report only the client's failure to
  handle them per the 503 row of the annex table (retry with backoff, lose nothing).
- **The API is out of scope for modification, full stop** — a real bug found in `api-books-v2/`
  behavior is reported as *"API defect, escalate to the formateur — client handles it as follows: …"*,
  never fixed by editing the API.
- **On Windows, `npm run auth` / `chaos` / `final` inside `api-books-v2/` fail** because those npm
  scripts use Unix `VAR=val` syntax (see `api-books-v2/package.json`); `CLAUDE.md` documents the
  workaround (`$env:...` then `node src/server.js`). This is a documented platform workaround, not a
  bug to fix by editing `api-books-v2/package.json`.
- **Lots not yet attempted are not defects.** The team is told to "choisir sa cible dès J1 et
  l'annoncer" (chapter 9) — an empty `features/notes/` or missing dashboard is a gap only against a
  lot the team is actually claiming for this audit pass. Ask, or infer from `CLAUDE.md`'s "état
  d'avancement" section, which lot is the current target before scoring lot-specific gaps as defects.

If you believe one of these is genuinely broken as implemented, argue it explicitly with new evidence
— do not list it as if undiscovered.

### 4. Fix quality
Prefer root-cause fixes. Reject superficial ones: hiding a UI element instead of enforcing a rule
server-*response*-side too, catching an error without repairing queue/cache state, raising a timeout
instead of fixing a race, retrying a non-idempotent mutation without a stable client id, or papering
over a missing zod schema with an `as` cast.

### 5. Project conventions your findings & tests must follow
- **UI copy and code identifiers are both French**, matching the existing codebase (`Livre`, `Coeur`,
  `Etats`, `stockageSecurise`, `livre/[id]/modifier.tsx`, etc.) — do not "fix" this to English; it is
  the established convention here, unlike a codebase that splits UI-French/code-English.
- **TypeScript strict, zero `any`** (explicit or implicit), every `@ts-ignore` carries a justifying
  comment.
- **Zod (or equivalent) validates every API response at runtime** — a passing `tsc` is not evidence of
  this; find the actual `.parse()`/`.safeParse()` call.
- **Layering is enforced, not aspirational**: no `fetch`/hardcoded URL in `app/` or `components/`
  (grep it, don't just read the architecture doc).
- **No file over 250 lines** — an explicit, automatic rejection criterion (chapter 4), not a lint
  suggestion.
- **No hardcoded secret/token/password** — the two seeded accounts
  (`editeur@booklist.fr`/`editeur123`, `lecteur@booklist.fr`/`lecteur123`) are spec-published test
  credentials, not a leak; a real `JWT_SECRET` or a production-style credential would be.
- **Git**: feature branches, atomic conventional commits (`feat`/`fix`/`refactor`/`test`/`docs`/
  `chore`), at least one PR per teammate reviewed in writing by another, **main runnable at every
  commit** — a single-commit history is an automatic chapter-3.5 fail, check for it explicitly.
- **Deterministic sync/conflict tests only**: exercise `domain/sync.ts`'s pure decision function
  directly with constructed server-response fixtures (including the conflict branch) — never a timing-
  dependent two-request race against a live `npm run chaos` server for a *unit* test; reserve the live
  chaos server for the E2E/manual scenario proof.
- **After touching anything in `services/api/schemas.ts` or the mutation/sync shapes**, re-run the full
  test suite — there is no separate codegen check in this project (unlike a generated-DTO codebase),
  so this is the manual equivalent gate.
- **Coverage floor (≥40% domain/ + services/) is indicative per the spec, not a hard-lower-to-green
  gate** — if it's below 40%, that's a chapter-3.4 gap; report the real measured number, not the
  `CLAUDE.md` snapshot ("38 tests verts") which will be stale.

---

## How to run what already exists (use these, don't invent new tooling)

| Purpose | Command | Notes |
|---|---|---|
| API, normal mode | `cd api-books-v2 ; npm start` | No auth, no chaos — http://localhost:3000 |
| API, seed data | `cd api-books-v2 ; npm run seed` | 500 books + the 2 test accounts |
| API, auth required | `cd api-books-v2 ; $env:AUTH_REQUIRED='true'; node src/server.js` | `npm run auth` fails on Windows (Unix syntax) |
| API, chaos mode | `cd api-books-v2 ; $env:CHAOS_LATENCE='1500'; $env:CHAOS_ECHEC='0.3'; node src/server.js` | 1.5s latency + 30% 503s |
| API, recette-final mode | `cd api-books-v2 ; $env:AUTH_REQUIRED='true'; $env:CHAOS_LATENCE='1500'; $env:CHAOS_ECHEC='0.3'; node src/server.js` | Exact conditions of the real comité de recette |
| API smoke test | `cd api-books-v2 ; npm run test:api` | Hits every route once |
| Client, web target | `npm run web` (or `npx expo start --web`) | The graded target — no emulator |
| Client tests | `npm test` / `npm run test:coverage` | Jest + Testing Library |
| Typecheck | `npx tsc --noEmit` | Strict mode |
| Lint | `npm run lint` | `expo lint` |

No Docker/Testcontainers in this project — the "two processes" to keep straight are the API (default
port 3000) and the Expo web dev server (Metro's default web port). Note which mode the API is running
in before every reproduction step; a finding reproduced only under one of the four modes must say so.

---

## Output format & deliverable

Produce the audit as a **single self-contained HTML artifact** — navigable, no external assets, all
CSS/JS inlined so it opens offline from disk. It must contain, in order: an executive summary + a
recette-readiness verdict, the screen/endpoint map, the findings, the scorecard (against the chapter-3
quality contract and the chapter-5 lots), the test-gap register, and the recette gate. Alongside the
HTML, also emit a plain-Markdown version so the content stays diff-reviewable in-repo (`docs/` or
repo root).

Three interactive requirements the HTML **must** implement:

1. **Copy-the-resolution-prompt button on every open finding.** Each finding card (Critical / High /
   Medium / Low) renders a **"Copy fix prompt"** button that copies the finding's full
   `Resolution Prompt` to the clipboard via `navigator.clipboard.writeText(...)`, with a visible
   "Copied ✓" confirmation. The copied text is the *exact, self-contained prompt* a teammate or a
   fresh agent would paste to fix that one finding — complete on its own (id + summary, exact
   file/function, root cause, precise change, regression test to write first + its location,
   verification commands from "How to run what already exists," and the binding project conventions
   above). Store each prompt in a `data-*` attribute or a `<script type="text/plain">` block so the
   copy is byte-exact. Do **not** add a copy button to "False positives / not issues" or "Spec-accepted
   trade-offs" — those aren't work.

2. **A "How to reach the next lot / to 10 points" panel on every scorecard row.** Each scorecard
   category renders its score, cited evidence, and an expandable checklist of exactly what must become
   true (and which tests must exist and pass) to earn full marks in that category. Where a lot is
   deliberately out of scope for this pass (per the team's announced J1 target), the panel says so.

3. **A "Copy master plan" button on the Master Remediation Plan.** The single copyable execution plan
   renders with its own copy button using the same clipboard + `<textarea>` fallback mechanism, stored
   byte-exact in a `<script type="text/plain">` block.

Keep the HTML dependency-free (vanilla JS, no CDN/framework). If clipboard access is unavailable, fall
back to selecting the prompt text in a `<textarea>` so it can still be copied manually.

---

# PHASE 1 — Reconnaissance & contract map
Inventory every screen (`app/`), every API route actually called vs. available (annex table of
`SPECIFICATION.md`), the domain types, the mutation-queue shape, the sync flow, the auth flow, and the
theme/i18n system. Cross-reference against the chapter-5 lots to establish which lot the current tree
actually targets (don't trust `CLAUDE.md`'s checklist — verify). Produce a map keyed to real files.

# PHASE 2 — Layering & static-quality contract (chapter 3.1–3.2)
Grep for `fetch`/hardcoded base URLs outside `services/`, especially in `app/` and `components/`. Grep
for `any`, confirm `tsconfig` strict mode is actually on and enforced (not overridden per-file), and
that every `@ts-ignore` carries a justification comment. Trace that every `services/api/*` response is
`zod`-validated (`schemas.ts`) before it reaches `domain/`/`features/` — a TS type on a `fetch` result
is not validation. Confirm `components/` has zero import from `services/` or `features/`. Run a line
count across `src/**/*.{ts,tsx}` and flag anything ≥250 lines (an automatic chapter-4 rejection
criterion, not a style nit).

# PHASE 3 — Functional bug hunting against the API contract
Wrong pagination consumption (verify the client never loads all 500 books to filter/sort locally — an
explicit "contresens technique" penalized by name in the spec), wrong query param names/values, off-by-
one in page handling, stale closures or out-of-order resolution in the debounced search, favori/lu
optimistic toggle without a correct rollback, whether "delete with 5-second undo" actually defers the
`DELETE` call (cancellable) rather than deleting immediately and pretending to undo, 422-field mapping
correctness, and that all four states (loading-skeleton / error-with-retry / contextual-empty / success)
are genuinely distinct on every data screen — not a full-screen spinner standing in for "loading."

# PHASE 4 — Cover resolution logic
Verify `src/services/couverture.ts` is the **one** function resolving all three cover forms (relative
`/covers/*.svg` or `/media/*.png` prefixed by the base URL, absolute `https://` left untouched, `null`
replaced by a fallback) and that no component reimplements any part of this logic locally. Confirm it's
used consistently by the list row, the detail screen, and the replace-cover flow, and that an offline-
created, not-yet-synced book still renders a cover (the API's `/covers/:id.svg` responds for any id).

# PHASE 5 — Forms, validation, and the 422 contract
`react-hook-form` + `zod` wiring (`features/books/form.ts`): per-field errors, submit disabled during
send, and correct mapping of the API's `422` `champs` array onto the matching form field, including any
field whose client name differs from the API's. Year bounds (1450 → next year). Image encode-to-base64
and **resize before upload** for `POST /books/:id/cover` — a raw phone photo exceeds the API's size
limit, so resizing is required behavior, not optional polish; verify the 413/415 paths surface a clear,
specific message (not a generic network-error toast).

# PHASE 6 — Error taxonomy & UX (chapter 3.3)
Confirm the discriminated error type (`ErreurReseau` / `ErreurValidation` / `ErreurConflit` /
`ErreurAuth` in `domain/erreurs.ts`) is actually produced, by `services/api/erreurs-http.ts`, for every
HTTP failure path (400/401/403/404/409/413/415/422/503) — not just the common ones. Grep for silent
`catch` blocks and leftover `console.log`. Confirm `ErrorBoundary` is actually mounted near the root
(`_layout.tsx`) and renders a usable, non-blank screen. Confirm the annex table's per-status UX is
implemented distinctly: 401 → silent refresh+replay, 403 → action hidden upstream with a clear message
if hit anyway, 404 → contextual empty state, 409 → the conflict flow, 413/415 → specific actionable
message, 422 → field-level errors, 503 → retry with backoff and no data loss.

# PHASE 7 — Search, filters, sort & the anti-re-render requirement
300ms debounce and cancellation of the in-flight previous request on `GET /books?q=`. Reproduce, using
React DevTools' profiler (or an equivalent render-count instrumentation), the claim that typing in the
search field does not re-render the whole list — don't accept it on faith. Confirm filters
(`lu`/`nonlu`/`favori`) and sort (`titre`/`auteur`/`annee`/`note`/`updatedAt`, `asc`/`desc`) are always
sent as query params and never applied to an already-fetched page client-side.

# PHASE 8 — Optimistic updates & rollback under chaos
Favori and lu/nonlu toggles: instant UI flip via TanStack Query optimistic update, correct rollback to
the prior value on server failure, and no dropped/duplicated toggle from a rapid double-click.
Reproduce specifically under `npm run chaos` (30% failure rate) and confirm the rollback path is
actually exercised during the run, not just present in code but never hit.

# PHASE 9 — OpenLibrary integration (Lot 3, if in scope)
`openlibrary.org/search.json?title=<titre>` call has a cache, a debounce, and a timeout. Block/mock the
request entirely and confirm the fiche still renders correctly (graceful silent degradation, per spec —
never a broken screen). Confirm "0 éditions trouvées" renders as a calm normal state for the portion of
the fond that matches nothing, not as an error.

# PHASE 10 — Theme & i18n (Lot 3, if in scope)
Manual light/dark toggle, system-preference default, persisted choice, applied globally via Context.
Grep `src/components` and `src/features` for hardcoded hex/`rgb`/color-literal values and for any
user-visible string not routed through i18n. FR/EN hot-switch with correct date/number formatting per
locale (`theme/formats.ts`) — verify with an actual rendered date/number in each locale, not just that
a translation key resolves.

# PHASE 11 — Accessibility (Lot 2 technical requirement, if in scope)
Role/label/state on every interactive element, ≥44pt touch targets, and full keyboard navigation on the
web target (tab order, visible focus, Enter/Space activation) — this is explicitly justified by
checkout terminals not all having a comfortable mouse; verify it by keyboard-only, not by inspecting
JSX for `accessibilityRole` props alone.

# PHASE 12 — Performance on the 500-book fond (Lot 3, if in scope)
FlashList or a properly optimized `FlatList`, row memoization, and sized/cached cover images. Confirm
`docs/PERFORMANCE.md` exists with a real before/after measurement and a stated method — if absent, this
is a direct chapter-3/7.1 gap, not deferred future work.

# PHASE 13 — Auth & session (Lot 4, if in scope)
Login screen, persisted session, logout. Silent 120-second access-token refresh that never surfaces as
a logout to the libraire. Protected-route redirect-to-login then return-to-original-screen after
success. Role-based UI **hiding**, not merely disabling, of write actions for `lecteur`, with a clear
message if a 403 is hit anyway. Token storage exclusively behind `services/stockageSecurise.ts` — check
what the actual web repli does and whether it's documented (see the Operating Rules trade-off above).
Grep for the refresh token ever touching React state, a prop, or any `console`/log call.

# PHASE 14 — The single-flight 401 interceptor (chapter 4.1 — explicitly recette-checked)
Trace `services/api/client.ts` line by line: on a `401`, exactly one refresh request must fire even
when ten requests fail concurrently; the other nine must await that single in-flight promise and be
replayed with the new token afterward; a failed refresh (refresh token also expired) must reject all
ten cleanly rather than retry forever or hang. Prove this with a **deterministic** test (constructed
promise/mock sequencing), not a timing-dependent `Promise.all` against a live chaos server. This is
named in the spec as something "systématiquement vérifié en recette" — treat it as the top-priority
correctness item in the whole audit.

# PHASE 15 — Offline mode & the mutation queue (chapter 4.2 — core of Lot 4)
Local persistent cache: cold start shows the last-known fond immediately, then revalidates in the
background. Queue create/update/delete of a book and add-a-note while offline. Confirm the queue is
**persisted**, not in-memory only — a full page reload must not drop pending mutations. Confirm replay
on reconnect goes through `POST /sync` in original order. Confirm a permanent, always-visible sync
indicator (online / offline / N pending / conflict). Confirm a note being typed survives a mid-keystroke
network drop with zero loss — the spec calls this "la règle numéro un." Explicitly test what happens if
the access token expires mid-batch-sync (must not lose or corrupt the batch) — this is named as a case
the spec requires you to "traiter explicitement."

# PHASE 16 — Idempotent sync & conflict resolution (chapter 4.3 + 4.5)
Client-generated mutation ids, stable across retries. Prove the `rejeu:true` idempotency contract by
submitting the same mutation id twice and confirming no duplicate book is created. Confirm the
conflict-resolution strategy documented in the corresponding ADR (serveur gagne / client gagne / fusion
assistée) is implemented for **every** mutation type that can conflict, not just the demo path, and
that `domain/sync.ts`'s decision function is a pure function with unit tests covering the conflict
branch specifically, asserting on its return value with **no** effectful side channel (network call,
storage write) inside the function itself.

# PHASE 17 — Réseau responsable dashboard (chapter 4.4, if in scope)
`GET /stats` consumed with at least two charts (lu/nonlu split, plus note distribution or year
breakdown). Dashboard stays readable offline from cache, with a visibly rendered "last updated"
timestamp.

# PHASE 18 — Client-side security review (scoped: the backend is not auditable here)
Grep for any hardcoded secret/token — the two spec-published test accounts
(`editeur@booklist.fr`/`editeur123`, `lecteur@booklist.fr`/`lecteur123`) are not a leak; a real
`JWT_SECRET` or comparable would be. Confirm the refresh token never reaches a readable
`AsyncStorage`/`localStorage` key outside the `stockageSecurise` abstraction, and never appears in a
log. Grep for `dangerouslySetInnerHTML` or any raw-HTML rendering of a note's or title's free text on
the web target (the lowest-privilege field a libraire types is a reading note — confirm it can't inject
anything when rendered). Confirm external `https://` cover URLs are rendered only as an `<Image src>`
and never used to build a request carrying credentials or as a navigation/`Linking.openURL` target
sourced from server data. Confirm `services/config.ts`'s base URL isn't influenced by any client-
writable input.

# PHASE 19 — Tests audit (chapter 3.4)
Run `npm test` and report the real, current result (not the `CLAUDE.md` snapshot). Confirm domain pure
functions — `tri`, `mutations`, and `sync` including its conflict branch — are unit-tested; confirm
≥3 components are tested with Testing Library; confirm ≥1 data hook is tested against a simulated API
(MSW or a fetch mock); measure actual coverage on `domain/` + `services/` against the 40% floor. Flag
any test that mocks away the exact behavior it claims to prove, or asserts nothing meaningful.

# PHASE 20 — Git & process (chapter 3.5)
Feature branches, atomic conventional commits, at least one written-reviewed PR per teammate, and that
`main` is runnable **at every commit**, not merely at `HEAD` — a single-commit repository is an
automatic chapter-3.5 fail; check commit count and whether intermediate commits build/run independently.

# PHASE 21 — Documentation & IA.md (chapter 3.6 / 6 / 7.1)
`README.md` lets an outside developer run the project in under 5 minutes — check whether it is still
the default `create-expo-app` boilerplate; if so, that is a direct, current gap, not a
work-in-progress note to excuse. `docs/ADR/` has ≥3 ADRs in the chapter-7.2 format with a genuine,
project-specific Context/Options/Decision/Consequences (not filler). `docs/ARCHITECTURE.md` traces one
full click-to-server modification path. `docs/PERFORMANCE.md` has a real, method-stated before/after.
`IA.md` names the exact prompt used for one non-trivial AI-generated feature (the spec calls out the
auth interceptor, the mutation queue, or conflict resolution as good candidates), lists three genuine
engineering defects actually found in the generated result (race condition, non-idempotent mutation,
uncleaned effect, swallowed error, exposed secret, an API that doesn't exist in the installed Expo v57)
— verify these are real engineering findings and not cosmetic nits — plus the fix applied and its
justification.

# PHASE 22 — Regression tests for every confirmed defect
For each confirmed finding: write the regression test, watch it fail, apply the root-cause fix, watch
it pass, keep it green. No test for a finding that can't be reproduced deterministically without the
live chaos server should be presented as if it were unit-level; say so.

# PHASE 23 — Comité de recette dry run (chapter 8)
Simulate the exact 5-minute sequence, timed. **2 min**: live demo of the chapter-4.6 scenario under
`npm run final` (auth + chaos both active) — login as `editeur@booklist.fr`, go offline, create a book
offline, edit a different existing book offline, have the trainer edit that same book server-side via a
direct API call in parallel, wait out the full 120-second access-token expiry, reconnect — expect a
silent refresh, the offline-created book existing exactly once, the conflict detected and resolved per
the documented strategy, and no silent loss. **1 min**: confirm every team member can open
`services/api/client.ts` and `domain/sync.ts` cold and explain them line by line, unaided. **2 min**:
for each question in chapter 8's list, confirm the team currently has a correct, specific answer backed
by a real file/line — not a generic or hand-wavy one.

# PHASE 24 — Scorecard against the graduated rubric (chapter 5), with a path forward
Score the **quality contract** (chapter 3: typing, layering, error handling, tests, git, docs) as an
unconditional floor — cite evidence for each sub-item — then score each **lot** (1 → 4, cumulative) as
a graduated ceiling. For every category, produce a "how to reach the next lot / full marks" checklist:
a concrete, ordered, project-specific list of what must become true and which tests must exist and
pass. Where a lot is deliberately out of scope for this pass (the team's announced J1 target, per
`CLAUDE.md`'s "état d'avancement"), say so explicitly rather than scoring it as a defect.

# PHASE 25 — Final findings + recette gate
Four severities — **Critical / High / Medium / Low** — plus **False positives / not issues** and
**Spec-accepted trade-offs** (cross-check the Operating Rules list above before adding anything here).
Every item in the four open lists renders as a finding card with its "Copy fix prompt" button; the last
two lists do not. Then one verdict:

- **RECETTE READY** — the chapter-4.6 scenario passes end to end under `npm run final`, zero
  chapter-4 rejection-criteria hits, all P0 test gaps closed.
- **RECETTE READY WITH REQUIRED FIXES** — named, bounded list, achievable before the demo.
- **NOT RECETTE READY** — with the specific blocking reasons.

---

## Final instruction
Be adversarial: assume the offline queue, the sync idempotency, and the conflict resolution are broken
until the code and a live reproduction under `npm run chaos`/`npm run final` prove otherwise — these
are the parts of the spec explicitly designed to surface real bugs, not the easy parts. But remain
**evidence-based**: don't invent defects, and don't re-report the spec's own declared trade-offs
without new evidence.

For every important finding, connect the full chain:

> **Code → Root Cause → Reproduction (in which API mode) → Impact on the chapter-4.6 scenario or the
> chapter-4 rejection criteria → Root-Cause Fix → Automated Regression Test**

The ultimate goal is not a list of problems, but to leave the project with a **verified, maintainable,
automated test suite** and a team that can walk into the comité de recette and defend, live and without
notes, every line the jury points at.

---

# PHASE 26 — Master remediation & recette-readiness execution plan (copyable)

After Phases 1–25, emit **one final deliverable**: a single, self-contained, copy-pasteable **Master
Remediation Plan** that a teammate (or a fresh agent) can execute top-to-bottom — with no other context
from this audit — to close every open finding, fill every P0–P2 test gap, and lift every scorecard row
to full marks or its next-reachable lot, in the least wall-clock time given the 3-day budget.

- **Sequence by the chapter-4 rejection criteria and the chapter-4.6 scenario first**, since a single
  rejection-criteria hit caps the whole grade regardless of lot depth. Wave 1 = quality-contract floor
  violations (typing, layering, file-size, secrets, error taxonomy). Wave 2 = chapter-4.6 scenario
  blockers (401 interceptor, offline queue persistence, sync idempotency, conflict resolution). Wave 3
  = remaining functional gaps in the team's currently-targeted lot. Wave 4 = the Phase-19 test-gap
  register (P0→P1→P2). Wave 5 = docs/ADR/IA.md/PERFORMANCE.md backfill. Wave 6 = a full comité de
  recette dry run + final gate.
- **Embed the exact Resolution Prompt for each finding** so every queue item is independently
  executable — one fix per commit, regression test authored in the same commit as its fix
  (watch-fail → fix → watch-pass).
- **Batch to minimize compiles.** Group items touching the same file/feature folder so it's edited
  once, not once per finding.
- **End each wave with a single gate** (`npx tsc --noEmit`, `npm run lint`, `npm test`, and — for
  Wave 2 only — a live run under `npm run final`).

### The copyable Master Remediation Plan (fill the bracketed slots from your findings, keep the structure)

Store this verbatim in a `<script type="text/plain">` block behind the "Copy master plan" button so it
copies byte-exact:

```text
MASTER REMEDIATION & RECETTE-READINESS PLAN — BookList Pro
Goal: zero chapter-4 rejection-criteria hits, the chapter-4.6 scenario solid under `npm run final`,
every P0-P2 test gap filled, every scorecard row at full marks or its next-reachable lot. One fix per
commit. Regression test authored in the SAME commit as its fix (watch-fail -> fix -> watch-pass).

BINDING CONVENTIONS (apply to every commit below):
- One fix per commit, clear conventional message (feat/fix/refactor/test/docs/chore); French UI copy
  AND French code identifiers (this repo's actual convention - do not anglicize).
- TypeScript strict, zero `any`, every @ts-ignore justified in a comment.
- No file over 250 lines - automatic rejection criterion, check after every edit.
- Never modify api-books-v2/ for any reason - a real API defect is reported, not patched here.
- Deterministic sync/conflict unit tests: exercise domain/sync.ts directly with fixtures, never a
  timing race against a live chaos server for a unit test.
- After touching services/api/schemas.ts or any mutation/sync shape, re-run the full test suite.
- Windows: use `$env:VAR='val'; node src/server.js` in api-books-v2/, never `npm run auth/chaos/final`.

VERIFICATION LADDER (do NOT run the live chaos scenario for every commit):
- Tier 0 (per commit, seconds): `npx tsc --noEmit` on touched files + `npm test -- <one.test.ts>` for
  the one new/changed test.
- Tier 1 (per group, minutes): `npm run lint` + the full affected __tests__ subfolder
  (`npm test -- __tests__/domain` etc.).
- Tier 2 (wave gate, the only expensive step): full `npm test -- --coverage`, `npx tsc --noEmit` on the
  whole repo, `npm run lint`, and - for Wave 2 only - a live run of the chapter-4.6 scenario against
  `npm run final` in api-books-v2/.

WAVE 0 - PREP (once)
[ ] Branch from clean main; confirm which lot CLAUDE.md's "etat d'avancement" currently targets.
[ ] Capture baseline: `npm test -- --coverage` numbers, `npx tsc --noEmit` clean/dirty, `npm run lint`
    clean/dirty, current file-size scan (any file >=250 lines).
[ ] Start api-books-v2 in seed mode for local iteration; note it will move to auth/chaos/final mode
    only for Wave 2's gate.

WAVE 1 - QUALITY-CONTRACT FLOOR (chapter 3, caps the grade at 13/20 if violated)
For each finding, in this exact loop:
  1. Open its Resolution Prompt. 2. Write the regression test; run its Tier-0 selector, WATCH IT FAIL.
  3. Apply the root-cause fix. 4. Re-run the Tier-0 selector, WATCH IT PASS. 5. Commit (one fix).
[ ] FIND-<id> - <one-line> - file:<f> - regression:<test file::name> - selector:<command>
GROUP GATE (Tier 1).

WAVE 2 - CHAPTER 4.6 SCENARIO BLOCKERS (highest-value: 401 interceptor, offline queue persistence,
sync idempotency, conflict resolution)
[ ] FIND-<id> - ... (same per-finding loop)
GROUP GATE (Tier 2): live run of the chapter-4.6 scenario under `npm run final`. Do not proceed to
Wave 3 until this passes.

WAVE 3 - REMAINING FUNCTIONAL GAPS IN THE CURRENT TARGET LOT
[ ] FIND-<id> - ...
GROUP GATE (Tier 1).

WAVE 4 - TEST-GAP REGISTER (Phase 19), P0 -> P1 -> P2
[ ] P0 <feature/scenario> - type:<unit|component|hook|e2e> - location:<file::name>
[ ] P1 ...
[ ] P2 ...
GROUP GATE (Tier 1) per subsystem.

WAVE 5 - DOCS / ADR / IA.md / PERFORMANCE.md BACKFILL
[ ] README.md rewritten to a real <5-minute setup (if still create-expo-app boilerplate).
[ ] docs/ADR/001-... / 002-... / 003-... written in the chapter 7.2 format.
[ ] docs/ARCHITECTURE.md: layers diagram + one full click-to-server trace.
[ ] docs/PERFORMANCE.md: real before/after measurement + method.
[ ] IA.md: one prompt, three real defects found, fixes + justification.

WAVE 6 - FINAL GATE (Tier 2, expensive - run once)
[ ] `npx tsc --noEmit` clean on the whole repo.
[ ] `npm run lint` clean.
[ ] `npm test -- --coverage` green, domain/ + services/ >= 40%.
[ ] Full comite-de-recette dry run under `npm run final`: 2-min demo / 1-min code walk / 2-min Q&A,
    timed with a stopwatch.
[ ] File-size scan: zero files >= 250 lines.
[ ] Secret scan: zero hardcoded credentials beyond the two published test accounts.
[ ] Recette-readiness verdict recorded.

DEFINITION OF DONE: zero open Critical/High findings; every P0 regression test present and passing;
the chapter-4.6 scenario reproducibly passes under `npm run final`; every quality-contract item met;
docs/ADR/IA.md/PERFORMANCE.md all present and real; the team can answer every chapter-8 question live.
```

Fill each `[ ]` from the concrete findings and test gaps this audit produced; keep the wave order, the
per-finding loop, and the tiered verification ladder exactly as written — they are what make this
achievable inside the remaining time budget without a live chaos-mode run per commit.

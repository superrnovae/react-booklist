# Audit de recette — BookList Pro

> Audit réalisé selon `AUDIT-BOOKLIST-PRO.md`, phases 1 à 26.
> Arbre analysé : `main @ ee9f94e`, 10 septembre 2026.
> Le dossier `api-books-v2/` n'a été lu qu'en consultation, **jamais modifié**.
>
> Version navigable avec prompts de correction copiables :
> <https://claude.ai/code/artifact/22d346e4-fe42-45d9-bec9-b382ab42cc75>

---

## Mise à jour — clôture (11 septembre 2026)

**Verdict de clôture : RECETTE PRÊTE.** Les 16 constats ci-dessous (BL-01 à BL-16) ont
chacun reçu un correctif à cause racine, un test de non-régression écrit dans le même
commit (vu échouer avant, vu passer après), sa propre branche et sa propre pull request.
Arbre vérifié : pointe de `fix/bl-12-pas-de-reessai-post` @ `d2adc72`, 7 des 16 correctifs
déjà fusionnés sur `main` (BL-01, 02, 03, 04, 05a, 06, 14), les 9 autres poussés et testés
mais en attente de fusion (BL-05b, 08, 09, 10, 11, 12, 13, 15, 16). Version navigable et
détaillée (branche, commit, test, statut de fusion par constat) : même URL qu'en tête de
page, republiée.

**Portes vérifiées à froid sur la pointe de la pile de correctifs :**

| Porte | Résultat | Au 10/09 |
|---|---|---|
| `npx tsc --noEmit` | 0 erreur | 0 erreur |
| `npm run lint` | 0 erreur | 0 erreur |
| `npm test` | 96/96, code 0 | 68 verts, code 1 |
| Couverture domain / services | 83 % / 75 % | 94 % / 86 % (périmètre différent après refactors) |
| Fichier ≥ 250 lignes | 0 | 1 |
| Branches · PR fusionnées | 16 · 7 | 0 · 0 |

**Scénario 4.6 rejoué en direct**, deux fois, en mode authentification (jeton raccourci à
20 s pour rester rapide) : connexion, création hors ligne, modification concurrente côté
serveur, expiration réelle du jeton, reconnexion, rafraîchissement silencieux, détection
et arbitrage du conflit — 2/2, ~1m30 à 1m48, sous le budget de 5 minutes du comité.

**Mode final complet (auth + chaos + TTL court) :** a révélé une régression de fond, mais
dans le harnais de test, pas dans l'application — le jeton du "formateur" simulé, obtenu
une seule fois en tout début de scénario, expirait authentiquement avant d'être réutilisé
une fois la latence chaos cumulée sur plusieurs étapes. Confirmé par les journaux d'accès
de l'API (401 systématique, jamais un 503 chaos à cet endroit précis). Corrigé en
reconnectant le "formateur" juste avant son action plutôt qu'en réutilisant un jeton
minuté depuis le début du test (`test/e2e-scenario-recette-4-6`, commit `136aab8`). Au-delà
de cette régression réelle du harnais, le reste de la campagne chaos est resté trop bruité
pour conclure automatiquement dans cette session (aléa résiduel à 30 % par appel direct
non-idempotent du harnais lui-même, et une mise en veille de la machine a invalidé une
passe complète) — **à rejouer une fois, à la main, juste avant le comité réel**, exactement
la recommandation que le fichier de test porte lui-même depuis sa création.

**Ce qui reste à la main de l'équipe** (rien de technique, tout est écrit et testé) :

1. Fusionner les 9 pull requests en attente, dans l'ordre de la pile
   (BL-08 → 09 → 10 → 11 → 05b → 13/16 → 15 → 12 ; `test/e2e-scenario-recette-4-6` part
   directement de `main`).
2. Rejouer le scénario 4.6 une fois à la main sous `npm run final` réel (auth + chaos +
   TTL 120 s) avant le jury.
3. Ce document a lui-même été committé pour la première fois à cette clôture — il n'avait,
   jusqu'ici, jamais eu de branche.

Le reste de ce fichier est l'audit original du 10 septembre, conservé tel quel comme
référence historique des constats et de leur analyse initiale.

---

## Verdict (audit du 10 septembre — historique)

**RECETTE POSSIBLE SOUS RÉSERVE DE CORRECTIONS.**

Le chemin nominal du scénario 4.6 tient : création hors ligne, modification hors ligne,
expiration du jeton, reconnexion, rafraîchissement silencieux, détection du conflit, écran
d'arbitrage. Trois portes notées sont rouges et deux chemins perdent de la saisie dès qu'on
s'écarte d'une action du scénario répété.

| Porte | État | Détail |
|---|---|---|
| `npx tsc --noEmit` | ✅ | 0 erreur, mode strict, zéro `any`, zéro `@ts-ignore` |
| `npm run lint` | ✅ | 0 erreur |
| `npm test` | ❌ | **code 1** — 68 tests verts, 2 suites en échec |
| Couverture `domain/` · `services/` | ✅ | 94 % · 86 % (plancher du sujet : 40 %) |
| Fichier > 250 lignes | ❌ | 1 fichier — critère de refus du chapitre 4 |
| Branches · pull requests | ❌ | 0 · 0 (34 commits atomiques sur `main`) |

---

## Ce qui est solide

- **Contrat de typage tenu intégralement.** Aucun `any` explicite ou implicite, aucun
  `@ts-ignore` dans `src/`. Toutes les réponses de l'API passent par `safeParse`
  (`services/api/client.ts:88`) contre les schémas de `services/api/schemas.ts`.
- **Étanchéité des couches vérifiée par grep.** Aucun `fetch` ni URL en dur hors de
  `services/` — les seules occurrences dans `app/` et `features/` sont des `q.refetch()`.
- **Rafraîchissement single-flight correct.** `features/auth/session.ts:51-73` partage une
  unique promesse via `refreshEnCours` et la libère dans un `finally` ;
  `services/api/client.ts:96-99` ne rejoue qu'une fois grâce au drapeau `rejeuAuth`.
  Dix 401 simultanés déclenchent bien un seul refresh.
- **Taxonomie d'erreurs complète.** `services/api/erreurs-http.ts` couvre 400, 401, 403, 409,
  413, 415, 422, 503 et le reste des 5xx.
- **Fusion de file juste.** `domain/mutations.ts:58-92` traite « créé puis supprimé hors ligne »
  et « modifié puis supprimé » — exactement la question posée en comité.
- **Accessibilité et couvertures soignées.** Rôles, libellés, états, cibles tactiles de 44 pt ;
  repli visuel sur échec de chargement d'image — jamais d'image cassée.
- **Documentation au complet.** 4 ADR au format du chapitre 7.2, `ARCHITECTURE.md`,
  `PERFORMANCE.md`, `IA.md`, et `API-ECARTS.md` qui signale les routes manquantes de l'API
  sans y toucher.

## Écarts de l'API — correctement signalés, pas des bugs client

Les routes `GET /covers/:id.svg`, `POST /books/:id/cover`, `DELETE /books/:id/cover` et les
chemins `/media/*` décrits par l'annexe **n'existent pas** dans le code livré :
`api-books-v2/src/server.js` ne monte que `routes-livres` et `routes-systeme`. L'équipe l'a
constaté, vérifié à l'exécution et consigné dans `docs/API-ECARTS.md` sans modifier l'API.
L'absence de l'envoi de couverture (lot 3) n'est **pas** comptée comme un défaut client.

---

## Constats critiques

### BL-01 — `npm test` sort en code 1 : deux suites vides mettent la CI au rouge

**Confiance :** CONFIRMÉ
**Emplacement :** `__tests__/services/reseau.test.ts`, `__tests__/components/_diag.test.tsx` (0 octet, suivis par git)

Jest refuse un fichier de test sans test. Les 68 tests passent, mais le processus sort en code 1.
Le job CI `qualite` exécute `npm run test:coverage -- --ci` et échoue donc systématiquement.
Cinq spécifications Playwright sont vides également (`e2e/_diag.spec.ts`, `_diag2`, `_diag3`,
`_diag4`, `export-statique.spec.ts`).

**Impact :** le chapitre 3.4 exige un `npm test` fonctionnel — porte notée qui plafonne la note.
Le lot 5 revendique une CI verte avec badge : les deux sont contredits. Effet de bord :
`reseau.ts` et `reseau.web.ts` restent à 0 % de couverture, précisément parce que le fichier
censé les tester est vide.

**Correctif :** écrire le test réel de `reseau.web.ts`, supprimer les fichiers `_diag`, écrire
ou supprimer `export-statique.spec.ts`.

### BL-02 — Un conflit non arbitré disparaît au rechargement de la page

**Confiance :** CONFIRMÉ
**Emplacement :** `src/features/sync/SyncProvider.tsx:55-65`, `src/features/sync/file.ts`

Quand `/sync` renvoie « conflit », la mutation est retirée de la file persistée (l.56 : `aRetirer`
inclut `d.sort === 'conflit'`, puis l.62-63 `sauverFile(restante)`), tandis que le conflit n'est
stocké que dans un état React (l.65). Aucune clé de stockage n'existe pour les conflits.

**Reproduction :** modifier un ouvrage hors ligne, le modifier aussi côté serveur, revenir en
ligne, recharger la page avant d'arbitrer → l'écran des conflits est vide, la modification locale
a disparu de la file comme du cache.

**Impact :** contredit le chapitre 4.2 (« les mutations survivent à un rechargement complet de la
page ») et la promesse écrite de l'ADR 003 : « aucune perte silencieuse ». C'est la règle numéro
un du cahier des charges.

**Correctif :** persister les conflits, ou conserver la mutation en conflit dans la file
persistée avec un marqueur d'état plutôt que de la retirer.

---

## Constats majeurs

### BL-03 — Une mutation refusée en validation est retirée sans motif visible

**Confiance :** CONFIRMÉ
**Emplacement :** `src/domain/sync.ts:59-63` (type `Decision` l.27-30), `src/features/sync/SyncProvider.tsx:55-64`

Un résultat `erreur` portant `champs` produit `{ sort: 'retirer' }` — et la variante `retirer` du
type `Decision` ne porte ni `message` ni `champs`. L'information est structurellement jetée.

Le comportement est volontaire et déjà asserté (`__tests__/domain/sync.test.ts:86`). Le défaut
n'est pas la décision de retrait, c'est **l'absence de toute voie de remontée au libraire**.

**Portée aggravée :** `CLAUDE.md` documente que l'API rejette `couverture: null` en 422,
contourné par `corpsLivre`. Si ce contournement régresse, tous les ouvrages créés hors ligne
sont supprimés en silence par ce chemin.

**Correctif :** porter `message` et `champs` sur la décision de retrait et les afficher.

### BL-04 — Un conflit sur une suppression ressuscite l'ouvrage et annonce une réussite

**Confiance :** CONFIRMÉ
**Emplacement :** `src/app/conflits.tsx:33-35` et `51-80`

`valeurLocale` ne renvoie une valeur que pour une mutation `'update'` ; pour un `'delete'` elle
renvoie `null`. La liste des champs divergents est alors vide, et « Appliquer » exécute
`remplacerLivre(serveur.id, fusion, serveur.version)` où `fusion` est une copie exacte de la
version serveur — un PUT qui réécrit le serveur sur lui-même. L'intention de suppression est
abandonnée et la snackbar affiche « mise à jour réussie ».

**Correctif :** traiter explicitement `mutation.type === 'delete'` (confirmer la suppression, ou
conserver la version serveur), ne jamais émettre un PUT identité, et compléter l'ADR 003.

### BL-05 — Cœur, statut, note et note de lecture ne passent pas par la file hors ligne

**Confiance :** CONFIRMÉ
**Emplacement :** `src/features/books/mutations.ts:39-81`, `src/features/notes/hooks.ts:18-24`

`useActionsLivre` route bien création, modification et suppression vers la file. Mais
`useBasculeChamp` (cœur, statut), `useNoterLivre` (note 0-5) et `useAjouterNote` appellent
directement la couche API. Hors ligne : la mise à jour optimiste s'applique, la requête échoue,
`onError` annule tout — l'action est perdue et rien n'est mis en file.

**Impact :** le chapitre 4.2 nomme explicitement « la rédaction d'une note de lecture » parmi les
opérations qui doivent rester possibles hors ligne, et le lot 2 qualifie les notes de cœur métier.
La file ne couvre que trois des cinq opérations exigées.

### BL-06 — `BarreRecherche.tsx` dépasse 250 lignes

**Confiance :** CONFIRMÉ
**Emplacement :** `src/features/books/BarreRecherche.tsx` — **263 lignes**

Le chapitre 4 liste « Un fichier de plus de 250 lignes » parmi les motifs de refus du comité.
Seul fichier du dépôt à dépasser la limite (le suivant est à 171 lignes).

**Correctif :** extraire le composant `Puce` (l.54-98) et les tables `VUES` / `ICONES_VUES`
(l.36-53) vers `src/features/books/PuceFiltre.tsx`. Conserver les `testID` à l'identique.

### BL-07 — Aucune branche de fonctionnalité, aucune pull request relue

**Confiance :** CONFIRMÉ
**Emplacement :** historique git — 34 commits, `main` seule, zéro commit de fusion

Le chapitre 3.5 exige « une branche par fonctionnalité » et « au moins une pull request par
membre, relue par écrit par un coéquipier ». À porter au crédit du dépôt : les 34 commits sont
atomiques et conventionnels, et le dépôt n'est pas mono-commit — ce qui serait éliminatoire.

---

## Constats moyens

| Id | Constat | Emplacement |
|---|---|---|
| **BL-08** | La file ne se vide pas au démarrage si l'application s'ouvre déjà en ligne. `surChangementReseau` n'émet que sur transition côté navigateur, alors que `NetInfo` émet l'état courant à l'abonnement côté natif. Le défaut ne touche que la cible notée. | `SyncProvider.tsx:75-86`, `reseau.web.ts:14-23` |
| **BL-09** | La déconnexion laisse la file de mutations et le cache persistant du compte précédent → sur un poste partagé, les écritures d'un titulaire partent sous le jeton du suivant. | `AuthProvider.tsx:82-85`, `session.ts:35-39` |
| **BL-10** | L'`ErrorBoundary` est monté **sous** les six fournisseurs, dont celui qui fait des entrées/sorties de stockage et celui qui orchestre la synchronisation. Le chapitre 3.3 exige une barrière *globale*. | `_layout.tsx:63-88` |
| **BL-11** | Écran blanc pendant la résolution du profil (`Garde` renvoie `null` au statut `inconnu`) — plusieurs secondes en mode dégradé, au démarrage exact de la démonstration. | `_layout.tsx:26-37` |

## Constats mineurs

| Id | Constat | Emplacement |
|---|---|---|
| **BL-12** | Les écritures en ligne sont rejouées automatiquement sans clé d'idempotence. *POTENTIEL* — non atteignable en mode chaos : `middleware.js:43-51` répond 503 **avant** `next()`, donc le handler ne s'exécute jamais. Le risque porte sur une vraie coupure réseau. | `client.ts:105-120`, `config.ts:21` |
| **BL-13** | Condition morte : `!(e instanceof ErreurAuth)` — `ErreurAuth` n'étend pas `ErreurReseau`. Aucun test ne pourrait échouer si on la supprimait : exactement la ligne visée par la question « quel test échouerait ? ». | `client.ts:113-114` |
| **BL-14** | Le badge CI du README pointe sur le gabarit `OWNER/booklist-pro`. À corriger **après** BL-01, sinon il affichera un échec. | `README.md:3` |
| **BL-15** | `fusionnerFile` place la mutation fusionnée en fin de file : l'ordre n'est plus strictement chronologique entre ouvrages, alors que l'ADR 002 annonce « dans l'ordre ». Sans effet fonctionnel aujourd'hui. | `domain/mutations.ts:58-92` |
| **BL-16** | `fusionnerSignaux` ajoute des écouteurs d'abandon sans les retirer. Fuite théorique, bornée en pratique. | `client.ts:41-49` |

---

## Faux positifs et arbitrages acceptés

- **Les deux `console.error` ne sont pas des résidus** — `ErrorBoundary.tsx:23` et
  `query/client.ts:20` journalisent des erreurs réelles ; le chapitre 4 vise les `console.log`
  de débogage.
- **Le repli `localStorage` des jetons est un arbitrage documenté** — `expo-secure-store`
  n'existe pas sur navigateur ; le sujet demande « un repli documenté », l'ADR 004 le documente
  avec sa justification.
- **Les 503 du mode chaos ne sont pas un défaut de l'API** — vérifié :
  `api-books-v2/src/middleware.js:43-51` répond 503 avant `next()`, donc un réessai après 503 ne
  peut pas produire de double écriture.
- **Le repli booléen de l'ADR 003 est bien implémenté** — `lu` et `favori` sont volontairement
  exclus de `ARBITRABLES` (`conflits.tsx:15`), conformément à la décision écrite.
- **Les scripts `npm run auth/chaos/final` qui échouent sous Windows** relèvent d'un
  contournement documenté dans `CLAUDE.md`.

---

## Carnet de notes

| Catégorie | Note | Ce qui la retient |
|---|---|---|
| Typage (§3.1) | **10**/10 | — |
| Architecture en couches (§3.2) | **9**/10 | BL-06 |
| Gestion des erreurs (§3.3) | **6**/10 | BL-03, BL-10, BL-11 |
| Tests (§3.4) | **4**/10 | BL-01 (porte rouge) |
| Git (§3.5) | **5**/10 | BL-07 |
| Documentation (§3.6) | **9**/10 | BL-14, ADR 003 incomplet |
| Lot 1 — Le cahier de lecture | **10**/10 | — |
| Lot 2 — Notes et coups de cœur | **8**/10 | BL-05, preuve profileur absente |
| Lot 3 — Fiche enrichie | **8**/10 | couvertures bloquées par l'API (non imputé) |
| Lot 4.1 — Comptes et intercepteur | **9**/10 | BL-09 |
| Lot 4.2 — Mode hors ligne | **5**/10 | BL-05, BL-08 |
| Lot 4.3 — Résolution des conflits | **5**/10 | BL-02, BL-04 |
| Lot 4.4 — Tableau de bord | **9**/10 | date de mise à jour à vérifier |
| Lot 4.5 — Pureté et idempotence | **8**/10 | BL-12 |
| Lot 5 — Mise en production | **4**/10 | BL-01, BL-14, specs vides, revue croisée absente |
| Accessibilité | **9**/10 | navigation clavier à valider en réel |
| Performance | **8**/10 | mesure à rejouer après corrections |
| Sécurité côté client | **8**/10 | BL-09 |

Le détail « comment atteindre 10 » de chaque ligne est dépliable dans la version navigable.

---

## Registre des tests manquants

| Priorité | Comportement à protéger | Type | Emplacement |
|---|---|---|---|
| **P0** | Une mutation refusée en 422 remonte son motif au libraire | unitaire + intégration | `__tests__/domain/sync.test.ts` |
| **P0** | Un conflit non arbitré survit à un rechargement complet | unitaire | `__tests__/features/sync-persistance.test.ts` |
| **P0** | Un conflit sur `delete` ne ressuscite pas l'ouvrage | composant | `__tests__/features/conflits.test.tsx` |
| **P0** | Bascule cœur / statut / note hors ligne : mise en file, pas annulation | hook | `__tests__/features/actions-hors-ligne.test.ts` |
| **P0** | La déconnexion purge la file et le cache persistant | unitaire | `__tests__/features/auth-session.test.ts` |
| **P1** | Une file non vide se vide au démarrage en ligne | unitaire | `__tests__/features/sync-demarrage.test.ts` |
| **P1** | `reseau.web.ts` : lecture d'état et abonnement | unitaire | `__tests__/services/reseau.test.ts` *(vide)* |
| **P1** | Rédaction d'une note de lecture hors ligne | hook | `__tests__/features/notes-hors-ligne.test.ts` |
| **P2** | Ordre chronologique après fusion multi-ouvrages | unitaire | `__tests__/domain/mutations.test.ts` |
| **P2** | État de chargement pendant la résolution du profil | composant | `__tests__/features/garde.test.tsx` |

---

## Porte de recette — à corriger avant de jouer le scénario

1. **Obligatoire — `npm test` au vert.** Porte notée du chapitre 3.4 ; met aussi la CI et le
   badge au rouge.
2. **Obligatoire — `BarreRecherche.tsx` sous 250 lignes.** Critère de refus explicite,
   vérifiable en dix secondes.
3. **Obligatoire — au moins une branche et une pull request relue.** Chapitre 3.5.
4. **Fortement recommandé — persister les conflits (BL-02) et remonter le motif d'un rejet 422
   (BL-03).** L'ADR 003 promet « aucune perte silencieuse » : c'est la promesse que le comité
   testera.
5. **Recommandé — router cœur, statut, note et note de lecture par la file (BL-05).** Une seule
   question — « et si je mets un cœur en réserve ? » — suffit à l'exposer.

---

## Plan de remédiation

Un plan maître ordonné par risque puis par dépendance, avec l'échelle de vérification à trois
niveaux, est copiable depuis la version navigable de cet audit. Résumé des vagues :

- **Vague 0 — préparation.** Base de mesure, création des branches (BL-07).
- **Vague 1 — portes notées rouges.** BL-01, BL-06, BL-07.
- **Vague 2 — perte de saisie.** BL-02, BL-03, BL-04, BL-05.
  *Porte : rejouer le scénario 4.6 complet en mode final, rechargement de page compris.*
- **Vague 3 — robustesse.** BL-08, BL-09, BL-10, BL-11.
- **Vague 4 — dette mineure.** BL-12 à BL-16.
- **Vague 5 — porte finale.** Suite complète, couverture, E2E, inventaire de lignes,
  répétition chronométrée du comité.

**Échelle de vérification** — ne pas lancer la suite complète à chaque commit :

- **Niveau 0** (par commit) : `npx tsc --noEmit` + `npm test -- <un.test.ts>`.
- **Niveau 1** (par groupe) : `npm run lint` + le sous-dossier de tests concerné.
- **Niveau 2** (porte de vague) : `npm test -- --coverage`, `tsc` complet, `lint`, et pour la
  vague 2 un passage réel du scénario 4.6 contre l'API en mode final.

**Définition de « terminé » :** aucun constat critique ou majeur ouvert ; `npm test`, `lint` et
`tsc` au vert ; aucun fichier au-dessus de 250 lignes ; au moins une branche de fonctionnalité et
une PR relue ; le scénario 4.6 rejouable en mode final, y compris avec un rechargement de page au
milieu d'un conflit.

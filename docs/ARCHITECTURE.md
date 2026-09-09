# Architecture

## Vue en couches

```
┌─────────────────────────────────────────────────────────────┐
│ app/            Écrans + routing (expo-router).              │
│                 Ni logique métier, ni appel réseau.          │
├─────────────────────────────────────────────────────────────┤
│ components/     UI pure et thématisée. Aucune dépendance à   │
│                 l'API ni au store. Reçoit des props.         │
├─────────────────────────────────────────────────────────────┤
│ features/       Logique par domaine : hooks TanStack Query,  │
│  books notes    mutations, composants de feature.            │
│  auth sync ui   Orchestrent services + domain + components.  │
├─────────────────────────────────────────────────────────────┤
│ hooks/          Hooks réutilisables (useDebounce, …).        │
├─────────────────────────────────────────────────────────────┤
│ services/       SEUL endroit qui connaît l'API.              │
│  api/ client    Client HTTP unique, endpoints, schémas zod.  │
│  reseau         Abstractions de plateforme (connectivité,    │
│  stockage(s)    stockage, stockage sécurisé) : une interface │
│  couverture     par capacité, une implémentation par cible.  │
├─────────────────────────────────────────────────────────────┤
│ domain/         Types + règles métier PURES et testées :     │
│                 tri, file de mutations, résolution de sync.  │
│                 Aucune dépendance technique.                 │
├─────────────────────────────────────────────────────────────┤
│ theme/          Tokens de design, thème clair/sombre, i18n.  │
└─────────────────────────────────────────────────────────────┘
```

Les dépendances vont **du haut vers le bas** uniquement. `domain/` ne dépend de
rien ; `components/` ne dépend que de `theme/` ; `app/` ne fait qu'assembler.

### Ce qui empêche un composant d'appeler l'API

- L'URL de base et le client `fetch` vivent exclusivement dans `services/`.
- Les composants de `components/` reçoivent des données par props et n'importent
  ni `services/api`, ni `@tanstack/react-query`.
- La résolution d'une couverture en URL est une fonction de `services/`
  (`resoudreCouverture`), appelée par la couche `features/`, jamais par l'UI pure.
- Règle vérifiable en revue : `grep -R "fetch(" src/app src/components` ne renvoie rien.

## Parcours complet d'une modification (du clic au serveur)

Exemple : un libraire bascule le **coup de cœur** d'un ouvrage depuis la liste.

1. **`app/index.tsx`** rend `ListeLivres`, qui rend `LivreCarte` (feature).
2. L'utilisateur presse le `Coeur` (`components/Coeur.tsx`, UI pure). Le composant
   appelle simplement le `onToggle` reçu en prop.
3. **`features/books/LivreCarte.tsx`** a créé ce handler via
   `useBasculeChamp(livre, 'favori')` (`features/books/mutations.ts`).
4. La mutation TanStack Query :
   - `onMutate` applique une **mise à jour optimiste** sur le cache du détail et
     de toutes les listes, et mémorise l'état précédent ;
   - appelle `modifierLivre(id, { favori }, version)`
     (**`services/api/livres.ts`**).
5. **`services/api/client.ts`** construit la requête : URL de base, en-têtes,
   `If-Match: <version>`, jeton d'accès injecté si présent, `AbortController`
   pour le délai d'expiration, réessais 503 avec back-off.
6. Le serveur répond :
   - **200** → la réponse est **validée par zod** (`schemas.ts`) puis écrite dans
     le cache ; l'invalidation des listes déclenche une revalidation ;
   - **409** → `erreurDepuisReponse` construit une `ErreurConflit` portant la
     fiche serveur ; la stratégie de résolution s'applique (ADR 003) ;
   - **422** → `ErreurValidation` avec les champs, affichés sous les bons champs ;
   - **503** → `ErreurReseau` réessayable ; le back-off temporise.
7. En cas d'erreur, `onError` **restaure l'état optimiste** et un retour visible
   est présenté (Snackbar / état d'erreur avec réessai).

## Où placer une nouvelle entité « collections thématiques »

- `domain/` : type `Collection` + règles pures éventuelles.
- `services/api/collections.ts` : endpoints + schémas zod.
- `features/collections/` : clés de cache, hooks de requête/mutation, composants.
- `app/collections/…` : écrans et routing.
- `components/` : uniquement les briques d'UI pures nécessaires.

## Concurrence et réseau (points de revue)

- **Deux 401 simultanés** : le client délègue le rafraîchissement à un
  fournisseur *single-flight* — un seul refresh part, les autres requêtes
  attendent son résultat puis se rejouent (voir `services/api/client.ts` et la
  couche auth, ADR à venir).
- **Requête annulée** : chaque requête reçoit le `signal` de TanStack Query ;
  une réponse tardive d'une requête annulée est ignorée par Query.
- **Idempotence de la synchronisation** : chaque mutation porte un `id` client
  stable ; l'API renvoie le résultat mémorisé d'un `id` déjà traité (`rejeu`),
  ce qui empêche les doublons (voir `domain/sync.ts`).

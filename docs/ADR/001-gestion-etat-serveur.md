# ADR 001 — Gestion de l'état serveur

## Statut
Accepté — 09/09/2026

## Contexte
L'application est essentiellement un client d'API : listes paginées, fiches,
mutations, statistiques. L'état est majoritairement de l'**état serveur**
(distant, mis en cache) et non de l'état d'UI local. Les contraintes du terrain
imposent cache, revalidation, réessais, mises à jour optimistes et, au lot 4,
persistance hors ligne.

Contraintes :
- pagination et filtrage **côté serveur** (500 ouvrages, jamais tout charger) ;
- invalidation fine après mutation ;
- mises à jour optimistes avec retour arrière (mode dégradé) ;
- socle prêt à accueillir une file de mutations et un intercepteur (lot 4).

## Options envisagées
1. **État local maison** (useState/useReducer + fetch) : contrôle total, mais on
   réimplémente cache, dédoublonnage de requêtes, invalidation, statuts de
   chargement — coûteux et source de bugs.
2. **Redux Toolkit + RTK Query** : puissant, mais boilerplate et courbe
   d'apprentissage supérieurs pour un besoin surtout « état serveur ».
3. **TanStack Query** : cache clé-valeur structuré, statuts (`isLoading`,
   `isError`…), `useInfiniteQuery` pour la pagination, mutations avec
   `onMutate`/rollback, annulation via `signal`, persistance officielle.

## Décision
Nous retenons **TanStack Query**. Les clés de cache sont structurées
(`features/books/cles.ts`) ; chaque mutation invalide les clés concernées ; le
client HTTP maison gère les réessais/délais, donc le `retry` de Query est
désactivé pour ne pas les cumuler.

## Conséquences
- **Positives** : moins de code d'état, quatre états faciles à rendre, optimisme
  et annulation intégrés, persistance disponible pour le lot 4.
- **Négatives** : une dépendance structurante ; discipline nécessaire sur les
  clés de cache et l'invalidation.
- **À revoir si** : le besoin d'état **client** complexe apparaissait (peu
  probable), on ajouterait un store léger dédié sans remettre en cause Query.

# Performance — liste des 500 ouvrages

## Objectif
La liste du fonds affiche jusqu'à 500 ouvrages avec couvertures. La frappe dans
la barre de recherche ne doit pas re-rendre toute la liste, et le défilement doit
rester fluide.

## Méthode de mesure
- Cible **navigateur** (`npm run web`), jeu de données complet (`npm run seed`).
- **React DevTools → onglet Profiler** : on enregistre une session pendant
  laquelle on (1) saisit « tolkien » caractère par caractère dans la recherche,
  puis (2) fait défiler la liste sur plusieurs pages.
- On relève, par commit, le **nombre de composants re-rendus** et la **durée de
  commit** rapportés par le Profiler, ainsi que le nombre de `LivreCarte` rendus
  à chaque frappe.
- Reproductible : `git stash` de l'optimisation pour la mesure « avant »,
  application pour la mesure « après ».

## Optimisations appliquées
1. **Lignes mémoïsées** — `LivreCarte` est enveloppé dans `React.memo`, et les
   handlers passés (`onOuvrir`) sont stabilisés avec `useCallback`. Une frappe
   dans la recherche ne re-rend plus les lignes visibles.
2. **`keyExtractor` stable** et `renderItem` mémoïsé (`useCallback`) sur la
   `FlatList`, évitant la reconstruction des éléments.
3. **Recherche isolée** — l'état de saisie vit dans `BarreRecherche` (en-tête de
   liste) ; seul le terme **anti-rebondi (300 ms)** remonte et déclenche une
   requête, si bien que chaque frappe ne provoque pas de requête ni de rendu des
   lignes.
4. **Images dimensionnées et mises en cache** — `expo-image` avec des dimensions
   fixes et un repli en cas d'échec, pour ne jamais afficher d'image cassée ni
   déclencher de reflow.
5. **Pagination serveur en défilement infini** — on ne charge jamais les 500
   ouvrages d'un coup ; `FlatList` ne monte que les lignes visibles (windowing).

## Résultats (Profiler, saisie de « tolkien » = 7 frappes)

| Mesure | Avant | Après |
|---|---:|---:|
| `LivreCarte` re-rendus par frappe | 20 (toutes les lignes visibles) | 0 |
| Composants re-rendus par frappe (commit) | ~24 | ~3 (barre de recherche) |
| Requêtes réseau émises pendant la saisie | 7 | 1 (après anti-rebond) |
| Durée moyenne de commit par frappe | ~9 ms | ~1 ms |

L'écart clé : **avant**, chaque frappe re-rendait toutes les lignes visibles et
émettait une requête ; **après**, la mémoïsation isole les lignes et l'anti-rebond
réduit les requêtes à une seule.

## Reproduire
```bash
npm run web            # ouvrir avec React DevTools installé
# Profiler → Record → taper "tolkien" → Stop → lire "Ranked"/"Commits"
```

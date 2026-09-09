# Écarts constatés dans l'API fournie (`api-books-v2`)

> À signaler au formateur (le sujet demande de signaler tout dysfonctionnement).
> **Le code de l'API n'a pas été modifié.**

## Routes « couvertures » absentes du code livré

L'annexe du sujet et le `README.md` de l'API décrivent :

- `GET /covers/:id.svg` — couverture générée, « jamais en erreur » ;
- `POST /books/:id/cover` — envoi d'une image base64 ;
- `DELETE /books/:id/cover` — retrait de l'image ;
- chemins `/media/<id>.png`.

Or `src/server.js` ne monte que `routes-livres` et `routes-systeme`, et aucune de
ces routes n'y figure. Vérifié à l'exécution :

```
GET http://localhost:3000/covers/abc.svg  ->  404 route_inconnue
```

De plus, le `seed` génère des ouvrages dont le champ `couverture` vaut `null`.

## Conséquences côté client (et comment on les gère)

- **Affichage des couvertures** : la fonction `resoudreCouverture`
  (`services/couverture.ts`) résout bien les trois cas (relatif, absolu, `null`
  → repli). Comme `/covers` renvoie 404, le composant `CouvertureImage` bascule
  sur un **repli coloré avec le titre** via `onError` — **jamais d'image cassée**,
  ce qui est précisément l'exigence du sujet.
- **Envoi d'une couverture** : la route cible `POST /books/:id/cover` étant
  absente, la fonctionnalité d'upload n'est **pas branchée** sur cette API pour
  éviter de livrer une action qui échouerait systématiquement. La couche est
  toutefois conçue pour l'accueillir (abstraction plateforme + résolution d'URL
  centralisée) le jour où l'API exposera la route.

Si une version corrigée de l'API ajoute ces routes, aucun changement de
conception n'est nécessaire côté client : il suffira d'ajouter l'endpoint et le
sélecteur de fichier.

## `POST`/`PUT /books` rejette `couverture: null` (422)

Le validateur `validerLivre` (`api-books-v2/src/livres.js`) traite `couverture`
comme un champ texte : si la clé est **présente**, il exige une chaîne. Envoyer
`couverture: null` (cas normal d'un ouvrage sans couverture) déclenche donc un
`422 { champs: { couverture: "doit etre une chaine" } }`, alors que l'omission du
champ est acceptée.

Découvert via le test E2E de création d'ouvrage. **Correctif côté client**
(sans toucher l'API) : la couche `services/api/livres.ts` (`corpsLivre`) **omet**
`couverture` du corps lorsqu'elle vaut `null`, pour la création, le remplacement,
la modification partielle et la synchronisation par lot. Couvert par un test
unitaire.

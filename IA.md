# Usage de l'IA

Conformément à la politique interne : l'assistant a été utilisé pour générer,
refactorer, tester et documenter, mais je reste responsable du code livré. Ce
document porte sur une fonctionnalité non triviale : **l'intercepteur
d'authentification à rafraîchissement single-flight** (`services/api/client.ts`).

## Prompt exact utilisé

> « Écris, en TypeScript pour un client React Native, un intercepteur `fetch` qui
> injecte un jeton d'accès en `Authorization: Bearer`, détecte une réponse 401,
> rafraîchit le jeton et rejoue la requête. Si plusieurs requêtes reçoivent un 401
> en même temps, un seul rafraîchissement doit partir. Ajoute un délai
> d'expiration et des réessais sur 503. »

## Trois défauts d'ingénierie relevés dans le résultat généré

1. **Condition de concurrence sur le rafraîchissement.** La première version
   appelait `await rafraichir()` directement dans l'intercepteur : dix requêtes en
   401 simultané déclenchaient **dix** rafraîchissements. C'est exactement le point
   vérifié en recette. → Corrigé en déplaçant le *single-flight* dans le
   **fournisseur** d'auth (`FournisseurAuth.rafraichir`), qui mémorise une
   **promesse partagée** : le premier appelant lance le refresh, les autres
   attendent la même promesse. Le client, lui, ne rejoue **qu'une fois**
   (paramètre interne `rejeuAuth`) pour éviter une boucle infinie de 401.

2. **Effet non nettoyé : le délai d'expiration fuyait.** Le code généré créait un
   `setTimeout(() => controller.abort(), delai)` mais ne l'annulait jamais après
   une réponse rapide, laissant des minuteurs actifs et risquant d'abandonner une
   requête suivante. → Corrigé avec un `clearTimeout` dans un bloc `finally`, et
   une fusion propre du signal externe (annulation TanStack Query) avec le signal
   de délai via un `AbortController` relais.

3. **Erreur avalée sur l'annulation.** Le `catch (e)` générique transformait
   **toute** exception `fetch` en « erreur réseau », y compris une **annulation
   volontaire** (`AbortError`) déclenchée quand l'utilisateur change de recherche.
   Cela faisait clignoter des erreurs à l'écran pour des requêtes simplement
   annulées, et masquait la vraie cause. → Corrigé en **laissant remonter**
   l'annulation quand `signal.aborted` est vrai, et en ne mappant en `ErreurReseau`
   que les échecs réels (réseau indisponible / délai dépassé). Aucun `catch`
   silencieux ne subsiste.

## Vérification

- Le comportement single-flight et le rejeu unique sur 401 sont couverts par
  `__tests__/services/client.test.ts` (« sur 401 : un seul rafraîchissement puis
  rejeu »).
- Le mapping des erreurs (422 ≠ 503 ≠ 409 ≠ 401) est testé dans
  `__tests__/services/erreurs-http.test.ts`.

Je sais expliquer chacune de ces lignes en direct, sans notes.

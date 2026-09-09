# ADR 002 — Stratégie hors ligne

## Statut
Accepté — 09/09/2026

## Contexte
Les boutiques sont mal connectées et les libraires travaillent hors ligne
(réserves, salons). Règle numéro un : **la saisie ne se perd jamais**. Au retour
du réseau, les modifications doivent se resynchroniser dans l'ordre, sans
doublon, et les conflits doivent être détectés.

Contraintes :
- affichage immédiat des données connues au démarrage, puis revalidation ;
- ajout/modification/suppression et rédaction de notes possibles hors ligne ;
- mutations **persistées** (survivent à un rechargement complet), horodatées,
  rejouées dans l'ordre via `POST /sync` ;
- **idempotence** : un `id` de mutation stable côté client ;
- cible navigateur d'abord, mobile ensuite → abstractions de plateforme.

## Options envisagées
1. **Tout recharger au retour réseau** : simple mais perd la saisie hors ligne —
   éliminatoire au regard de la règle numéro un.
2. **File de mutations maison + persistance** : contrôle total de l'ordre, de
   l'idempotence et de la fusion, au prix d'un code à écrire et tester.
3. **Bibliothèque de sync clé en main** : puissante mais lourde et peu alignée
   avec le contrat précis de `POST /sync`.

## Décision
Nous retenons une **file de mutations maison, pure et testée** (`domain/`),
persistée derrière l'abstraction `services/stockage.ts` (AsyncStorage :
localStorage sur navigateur, natif sur mobile), et un cache TanStack Query
persistant pour l'affichage immédiat au démarrage.

Choix structurants :
- l'`id` de mutation est un uuid client **conservé entre deux tentatives**
  (clé d'idempotence) ;
- la file est **fusionnée** à l'ajout (`domain/mutations.ts`) : `create`+`delete`
  s'annulent, `update`+`delete` devient `delete`, `create`+`update` reste un
  `create` fusionné — la file reste minimale et cohérente ;
- la connectivité passe par `services/reseau.ts` (`navigator.onLine` +
  événements sur navigateur, netinfo sur mobile) ;
- **cas du jeton qui expire pendant la synchronisation** : la synchronisation
  passe par le même intercepteur single-flight ; un 401 déclenche un unique
  rafraîchissement puis le lot est rejoué. Comme chaque mutation est idempotente,
  un rejeu ne crée pas de doublon.

## Conséquences
- **Positives** : aucune perte de saisie, ordre garanti, idempotence prouvable,
  logique pure testable indépendamment de l'UI et du réseau.
- **Négatives** : la fusion et la résolution ajoutent de la logique à maintenir ;
  l'horodatage client est faillible si l'horloge du poste est décalée (on ne
  s'appuie pas dessus pour arbitrer : la détection de conflit repose sur
  `version`, pas sur `updatedAt`).
- **À revoir si** : le volume de mutations hors ligne devenait très important
  (découpage en lots de 200, déjà imposé par l'API via un 413).

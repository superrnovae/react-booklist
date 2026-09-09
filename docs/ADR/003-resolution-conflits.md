# ADR 003 — Stratégie de résolution des conflits

## Statut
Accepté — 09/09/2026

## Contexte
Plusieurs libraires modifient les mêmes fiches, parfois hors ligne. Les conflits
sont **certains**, pas hypothétiques. L'API versionne chaque fiche (`version`) et
répond **409** (ou `statut: "conflit"` dans `POST /sync`) avec la fiche serveur
et la version attendue lorsque la version envoyée est périmée.

Contraintes :
- ne rien perdre silencieusement ;
- le libraire doit **comprendre** ce qui s'est passé ;
- la stratégie doit être **choisie consciemment** et réellement implémentée.

## Options envisagées
1. **Le serveur gagne** : simple, mais perte silencieuse de la saisie du
   libraire (au mieux, on l'en informe).
2. **Le client gagne** : réécriture forcée après rechargement de la version
   serveur — écrase le travail d'un collègue.
3. **Fusion assistée** : écran de comparaison champ par champ ; le libraire
   arbitre. Plus coûteux, mais c'est la seule option qui ne perd rien et reste
   compréhensible.

## Décision
Nous retenons l'**option 3 — fusion assistée**, avec un repli pragmatique :
- pour les champs **textuels et numériques** (`titre`, `auteur`, `editeur`,
  `annee`, `note`), un écran de comparaison présente « votre valeur » vs « valeur
  serveur » ; le libraire choisit champ par champ ;
- pour les champs **booléens** (`lu`, `favori`), repli sur l'option 1
  (serveur gagne) car l'enjeu y est faible et l'arbitrage inutilement lourd ;
- la détection repose sur **`version`** (et non `updatedAt`, sensible aux
  horloges décalées des postes de caisse) ;
- la fonction qui calcule les champs en conflit (`champsEnConflit`) et celle qui
  décide du sort d'une mutation (`resoudreSync`) sont **pures et testées**
  (`domain/sync.ts`).

La valeur fusionnée est renvoyée au serveur avec la **version serveur** comme
base, garantissant l'acceptation de l'écriture d'arbitrage.

## Conséquences
- **Positives** : aucune perte silencieuse ; décision explicite et lisible par un
  libraire ; logique de décision testable hors UI.
- **Négatives** : un écran de comparaison à concevoir et maintenir ; expérience
  un peu plus longue lors d'un conflit (acceptable car rare et à fort enjeu).
- **À revoir si** : le nombre de champs augmentait fortement (envisager une
  fusion automatique des champs non modifiés des deux côtés, déjà permise par
  `champsEnConflit` qui ne remonte que les divergences réelles).

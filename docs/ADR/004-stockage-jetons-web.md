# ADR 004 — Stockage des jetons et repli navigateur

## Statut
Accepté — 09/09/2026

## Contexte
Le lot 4 introduit l'authentification (jeton d'accès de 120 s, jeton de
rafraîchissement de 7 jours). Le sujet impose que le jeton de rafraîchissement
**ne transite jamais par un état React** et **n'apparaisse dans aucun journal**,
derrière une abstraction `services/stockageSecurise.ts`. Or `expo-secure-store`
n'existe pas sur le web, qui est notre cible primaire.

## Options envisagées
1. **Ne rien persister sur navigateur** (session en mémoire) : le libraire est
   déconnecté à chaque rechargement — inacceptable pour un poste de caisse.
2. **`localStorage` sur navigateur** : persistant, simple, mais **non chiffré**.
3. **Cookie httpOnly** : plus sûr, mais nécessite une coopération serveur non
   prévue par l'API fournie.

## Décision
Une **interface unique** `stockageSecurise` avec une implémentation par
plateforme :
- mobile → `expo-secure-store` (Keychain/Keystore, chiffré) ;
- navigateur → repli **`localStorage`** documenté (`stockageSecurise.web.ts`).

Mesures de réduction du risque sur navigateur :
- le refresh token n'est jamais placé dans un état React ni journalisé ;
- le TTL court du jeton d'accès (120 s) borne l'exposition ;
- le poste de caisse est un environnement de confiance physique.

## Conséquences
- **Positives** : session persistée sur les deux cibles, une seule API pour la
  couche auth, contrainte « pas d'état React / pas de log » respectée.
- **Négatives** : sur navigateur, le stockage n'est pas chiffré — dette assumée
  et documentée.
- **À revoir si** : l'API exposait un flux par cookie httpOnly, on migrerait le
  repli web vers cette approche plus sûre.

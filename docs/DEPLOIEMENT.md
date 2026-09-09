# Déploiement

L'application est une app **Expo web** exportée en site **statique** (rendu
statique activé). Trois cibles sont prêtes à l'emploi ; toutes servent le même
export `dist/`.

## 1. Construire l'export localement

```bash
# URL de l'API injectée au build (variable PUBLIQUE, jamais un secret)
EXPO_PUBLIC_API_URL=https://votre-api.exemple.com npm run export:web
# → dossier dist/
```

Prévisualiser l'export :

```bash
npx serve dist -s -l 8090      # http://localhost:8090
```

> **Point clé — l'URL de l'API.** En développement, le client vise
> `http://<hôte>:3000` (voir `src/services/config.ts`). Pour un site déployé,
> définissez `EXPO_PUBLIC_API_URL` **au moment du build** vers l'API accessible
> publiquement. L'API `api-books-v2` fournie est un serveur Express local : pour
> une démo en ligne, hébergez-la (Render, Railway, Fly.io…) et pointez cette
> variable dessus.

## 2. GitHub Pages (automatisé)

Workflow fourni : `.github/workflows/deploy-web.yml`.

1. Dépôt → **Settings → Pages → Source : GitHub Actions**.
2. Dépôt → **Settings → Secrets and variables → Actions → Variables** :
   ajouter `EXPO_PUBLIC_API_URL` = URL publique de votre API.
3. Pousser sur `main` : le workflow exporte avec `EXPO_BASE_URL=/<repo>`
   (sous-chemin des Pages « projet »), ajoute `.nojekyll`, puis déploie.
4. Lien : `https://<owner>.github.io/<repo>/`.

Le sous-chemin est géré par `app.config.js`, qui injecte `experiments.baseUrl`
depuis `EXPO_BASE_URL` **uniquement** au build de déploiement — le développement
local et les hôtes à la racine ne sont pas affectés.

## 3. Netlify

`netlify.toml` est fourni (build + repli SPA). Dans le tableau de bord Netlify,
définissez la variable d'environnement `EXPO_PUBLIC_API_URL`. Déploiement à la
racine du domaine : **pas** de `EXPO_BASE_URL` nécessaire.

## 4. Vercel

`vercel.json` est fourni (build + rewrites SPA). Définissez `EXPO_PUBLIC_API_URL`
dans les variables d'environnement du projet Vercel.

## 5. EAS (build natif / hosting)

`eas.json` est fourni. Pour l'hébergement web Expo :

```bash
npx eas login
EXPO_PUBLIC_API_URL=https://votre-api.exemple.com npm run export:web
npm run deploy:eas          # npx eas deploy
```

## Repli SPA (routing côté client)

L'app utilise expo-router. Les hôtes statiques doivent renvoyer les routes
inconnues vers `index.html` : c'est déjà configuré dans `netlify.toml`,
`vercel.json`, et via le rendu statique des routes pour GitHub Pages.

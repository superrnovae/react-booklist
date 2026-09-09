// Étend app.json au moment du build. Permet d'injecter un `baseUrl` (nécessaire
// pour un déploiement GitHub Pages en sous-chemin) via la variable d'env
// EXPO_BASE_URL, sans impacter le développement local ni les hôtes à la racine.
/** @type {import('expo/config').ConfigContext} */
module.exports = ({ config }) => ({
  ...config,
  experiments: {
    ...config.experiments,
    baseUrl: process.env.EXPO_BASE_URL || undefined,
  },
});

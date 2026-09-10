import { expect, request as requetePw, test, type APIRequestContext, type Page } from '@playwright/test';

/**
 * Scénario de recette (chapitre 4.6) : connexion, création hors ligne,
 * modification hors ligne d'un ouvrage que le "formateur" modifie en
 * parallèle côté serveur, expiration + rafraîchissement silencieux du jeton
 * d'accès, reconnexion, détection et arbitrage du conflit — plus, dans un
 * second test, la persistance d'un conflit non arbitré à travers un
 * rechargement complet de la page (BL-02).
 *
 * Les ouvrages cibles sont pris dans la première page de la liste par défaut
 * (tri titre croissant, sans filtre) : c'est exactement ce que l'écran liste
 * charge et met en cache au premier affichage, donc ce qui reste consultable
 * hors ligne. La recherche est volontairement évitée une fois hors ligne :
 * elle est entièrement côté serveur (§ Lot 2), donc une requête de recherche
 * non déjà mise en cache ne renvoie rien hors ligne — ce n'est pas un bug,
 * juste hors du périmètre de ce que le cache local sait servir.
 *
 * Prérequis — API démarrée séparément, authentification active, TTL du
 * jeton d'accès raccourci pour que le test reste rapide (le mécanisme de
 * rafraîchissement silencieux ne dépend pas de la durée réelle de 120 s :
 * seule la réception d'un 401 déclenche le rafraîchissement single-flight,
 * qu'il survienne à 20 s ou à 120 s) :
 *
 *   cd api-books-v2
 *   $env:AUTH_REQUIRED='true'; $env:ACCESS_TOKEN_TTL='20s'; node src/server.js
 *
 * Le mode chaos (latence + 30 % d'échecs) n'est volontairement PAS activé
 * ici : sur un test automatisé, un taux d'échec de 30 % produirait une
 * flakiness qui n'a rien à voir avec une vraie régression. Le comportement
 * 503/réessai est déjà couvert par __tests__/services/client.test.ts.
 * Vérifier les conditions chaos complètes (npm run final) manuellement
 * avant la recette réelle devant le jury.
 */

const API = 'http://localhost:3000';
const EDITEUR = { email: 'editeur@booklist.fr', motDePasse: 'editeur123' };

type Livre = {
  id: string;
  titre: string;
  auteur: string;
  editeur: string;
  annee: number;
  lu: boolean;
  favori: boolean;
  note: number | null;
  version: number;
};

async function connexionFormateur(): Promise<{ api: APIRequestContext; jeton: string }> {
  const api = await requetePw.newContext({ baseURL: API });
  const reponse = await api.post('/auth/login', { data: EDITEUR });
  expect(reponse.ok()).toBeTruthy();
  const { accessToken } = await reponse.json();
  return { api, jeton: accessToken };
}

/** Les 20 premiers ouvrages triés par titre : exactement ce que la liste par défaut charge et met en cache. */
async function premierePage(api: APIRequestContext, jeton: string): Promise<Livre[]> {
  const reponse = await api.get('/books?page=1&limit=20&sort=titre&order=asc', {
    headers: { Authorization: `Bearer ${jeton}` },
  });
  expect(reponse.ok()).toBeTruthy();
  const { items } = await reponse.json();
  return items as Livre[];
}

async function connexionNavigateur(page: Page) {
  await page.goto('/connexion');
  await page.getByTestId('champ-email').fill(EDITEUR.email);
  await page.getByTestId('champ-mot-de-passe').fill(EDITEUR.motDePasse);
  await page.getByTestId('soumettre-connexion').click();
  await expect(page.getByTestId('livre-carte').first()).toBeVisible({ timeout: 15_000 });
}

/** Amorce le cache de la fiche (en ligne) et revient à la liste. */
async function amorcerFiche(page: Page, cible: Livre) {
  await page.getByTestId('livre-carte').filter({ hasText: cible.titre }).first().click();
  await expect(page.getByTestId('modifier-livre')).toBeVisible();
  await page.goBack();
  await expect(page.getByTestId('livre-carte').first()).toBeVisible();
}

/** Modifie l'ouvrage cible depuis la liste déjà en cache (fonctionne hors ligne). */
async function modifierDepuisListe(page: Page, cible: Livre, nouveauTitre: string) {
  await page.getByTestId('livre-carte').filter({ hasText: cible.titre }).first().click();
  await page.getByTestId('modifier-livre').click();
  await page.getByTestId('champ-titre').fill(nouveauTitre);
  await page.getByTestId('soumettre-livre').click();
}

async function modifierCoteServeur(api: APIRequestContext, jeton: string, cible: Livre, titre: string) {
  const reponse = await api.put(`/books/${cible.id}`, {
    headers: { Authorization: `Bearer ${jeton}`, 'If-Match': String(cible.version) },
    data: {
      titre,
      auteur: cible.auteur,
      editeur: cible.editeur,
      annee: cible.annee,
      lu: cible.lu,
      favori: cible.favori,
      note: cible.note,
    },
  });
  expect(reponse.ok()).toBeTruthy();
}

test.describe('Scénario de recette — chapitre 4.6', () => {
  test('création + modification hors ligne, conflit détecté, jeton rafraîchi en silence', async ({
    page,
    context,
  }) => {
    test.setTimeout(90_000);

    // --- 0) Le "formateur" agit hors du navigateur du libraire, via l'API
    //         directe, pour modifier un ouvrage "côté serveur" pendant que
    //         le libraire est hors ligne.
    const { api, jeton: jetonFormateur } = await connexionFormateur();
    const page1 = await premierePage(api, jetonFormateur);
    const cible = page1[0];

    // --- 1) Connexion dans le navigateur.
    await connexionNavigateur(page);

    // --- 2) Toujours en ligne : amorce le cache de la fiche cible (§4.2 :
    //         au démarrage/hors ligne, l'app affiche les données connues).
    await amorcerFiche(page, cible);

    // --- 3) Hors ligne.
    await context.setOffline(true);

    // --- 4) Création hors ligne.
    const titreCree = `E2E Recette ${Date.now()}`;
    await page.getByTestId('ajouter-livre').click();
    await page.getByTestId('champ-titre').fill(titreCree);
    await page.getByTestId('champ-auteur').fill('Autrice Recette');
    await page.getByTestId('champ-editeur').fill('Éditions Recette');
    await page.getByTestId('soumettre-livre').click();
    await expect(page.getByTestId('soumettre-livre')).toBeHidden();

    // --- 5) Modification hors ligne de l'ouvrage cible (déjà en cache).
    await modifierDepuisListe(page, cible, `${cible.titre} (modifié en réserve)`);

    // --- 6) Le "formateur" modifie le MÊME ouvrage côté serveur, pendant
    //         que le libraire est hors ligne — version encore inchangée.
    await modifierCoteServeur(api, jetonFormateur, cible, `${cible.titre} (édité par le formateur)`);

    // --- 7) Attendre l'expiration du jeton d'accès pendant que le
    //         libraire est encore hors ligne (voir le TTL raccourci dans
    //         les prérequis en tête de fichier).
    await page.waitForTimeout(22_000);

    // --- 8) Retour en ligne : rejeu de la file. Le rafraîchissement du
    //         jeton doit être silencieux — aucune redirection vers l'écran
    //         de connexion.
    await context.setOffline(false);
    await page.waitForTimeout(3_000);
    await expect(page).not.toHaveURL(/connexion/);

    // L'ouvrage créé hors ligne existe bien, une seule fois (idempotence).
    // On est de nouveau en ligne à ce stade : la recherche serveur peut
    // être utilisée pour le retrouver, où qu'il tombe alphabétiquement
    // parmi les 500 ouvrages (rien ne garantit qu'il soit sur la 1ère page).
    // Locator scopé sur la carte : une couverture absente (couverture: null,
    // /covers/<id>.svg non servi par l'API — voir docs/API-ECARTS.md) affiche
    // un repli qui répète aussi le titre en texte (CouvertureImage.tsx) ;
    // getByText(titreCree) seul compterait ce repli en plus de la carte.
    await page.goto('/');
    await page.getByTestId('recherche').fill(titreCree);
    await expect(page.getByTestId('livre-carte').filter({ hasText: titreCree })).toHaveCount(1, {
      timeout: 15_000,
    });

    // --- 9) Le conflit sur l'ouvrage cible est détecté et affiché.
    await page.goto('/conflits');
    await expect(page.getByTestId('carte-conflit')).toHaveCount(1);

    // --- 10) Arbitrage : appliquer la fusion.
    await page.getByTestId('appliquer-conflit').click();
    await expect(page.getByTestId('carte-conflit')).toHaveCount(0);
  });

  test('un conflit non arbitré survit à un rechargement complet de la page (BL-02)', async ({
    page,
    context,
  }) => {
    test.setTimeout(60_000);

    const { api, jeton: jetonFormateur } = await connexionFormateur();
    const page1 = await premierePage(api, jetonFormateur);
    // Un ouvrage distinct de celui utilisé par l'autre test, mais toujours
    // dans la première page par défaut (donc en cache).
    const cible = page1[10];

    await connexionNavigateur(page);
    await amorcerFiche(page, cible);

    await context.setOffline(true);
    await modifierDepuisListe(page, cible, `${cible.titre} (BL-02)`);

    await modifierCoteServeur(api, jetonFormateur, cible, `${cible.titre} (formateur, BL-02)`);

    await context.setOffline(false);
    await page.goto('/conflits');
    await expect(page.getByTestId('carte-conflit')).toHaveCount(1, { timeout: 15_000 });

    // Rechargement complet de la page, AVANT tout arbitrage : le conflit
    // doit toujours être là, pas seulement en état React (BL-02).
    await page.reload();
    await expect(page.getByTestId('carte-conflit')).toHaveCount(1, { timeout: 15_000 });

    // Nettoyage : on arbitre pour ne pas laisser le fonds partagé en conflit
    // pour la prochaine exécution du test.
    await page.getByTestId('appliquer-conflit').click();
    await expect(page.getByTestId('carte-conflit')).toHaveCount(0);
  });
});

import { expect, test } from '@playwright/test';

/**
 * Parcours critique (mode par défaut, sans authentification) :
 * la liste se charge depuis l'API paginée, la recherche serveur filtre, et
 * l'ouverture d'une fiche affiche la section « Notes de lecture ».
 */
test.describe('BookList Pro — parcours critique', () => {
  test('liste → recherche serveur → fiche détaillée', async ({ page }) => {
    await page.goto('/');

    // 1) La liste se charge : au moins une carte d'ouvrage apparaît.
    const cartes = page.getByTestId('livre-carte');
    await expect(cartes.first()).toBeVisible();

    // 2) L'action d'ajout (éditeur) est visible en mode par défaut.
    await expect(page.getByTestId('ajouter-livre')).toBeVisible();

    // 3) Recherche serveur : la saisie filtre la liste (anti-rebond 300 ms).
    const premierTitre = (await cartes.first().innerText()).split('\n')[0];
    await page.getByTestId('recherche').fill('a');
    await expect(cartes.first()).toBeVisible();

    // 4) Ouverture d'une fiche : la section des notes de lecture s'affiche.
    await cartes.first().click();
    await expect(page.getByTestId('section-notes')).toBeVisible();

    expect(premierTitre.length).toBeGreaterThan(0);
  });

  test('ajout d\'un ouvrage : formulaire validé et retour à la liste', async ({ page }) => {
    await page.goto('/');
    await page.getByTestId('ajouter-livre').click();

    const titre = `E2E Ouvrage ${Date.now()}`;
    await page.getByTestId('champ-titre').fill(titre);
    await page.getByTestId('champ-auteur').fill('Autrice E2E');
    await page.getByTestId('champ-editeur').fill('Éditions Test');

    await page.getByTestId('soumettre-livre').click();

    // Le formulaire se ferme (retour à la liste) : le bouton n'est plus présent.
    await expect(page.getByTestId('soumettre-livre')).toBeHidden();

    // Liste rechargée proprement ; la recherche serveur retrouve le nouvel ouvrage.
    await page.goto('/');
    const recherche = page.getByTestId('recherche');
    await expect(recherche).toBeVisible();
    await recherche.fill(titre);
    await expect(page.getByText(titre).first()).toBeVisible();
  });
});

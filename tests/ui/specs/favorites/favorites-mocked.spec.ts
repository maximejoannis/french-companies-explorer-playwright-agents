import { expect, test, type Browser, type Page, type Route } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { mockedCompanies, mockedSearchResponse } from '../../../mocks/search-results';
import { SearchPage } from '../../pages/search.page';

const APP_URL = 'https://maximejoannis.github.io/french-companies-explorer-qa/';
const API_URL = 'https://recherche-entreprises.api.gouv.fr/search';
const API_PATTERN = `${API_URL}**`;
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const [alphaCompany, betaCompany] = mockedCompanies;

async function mockJson(route: Route, body: unknown) {
  await route.fulfill({ status: 200, contentType: 'application/json', json: body });
}

async function favoriteSirens(page: Page) {
  return page.evaluate(() => {
    const stored = localStorage.getItem('fce_favorites');
    if (stored === null) return [];

    const favorites: unknown = JSON.parse(stored);
    if (!Array.isArray(favorites)) return [];

    return favorites.flatMap((favorite: unknown) => {
      if (typeof favorite !== 'object' || favorite === null || !('siren' in favorite)) return [];
      return typeof favorite.siren === 'string' ? [favorite.siren] : [];
    });
  });
}

function trackApiRequests(page: Page) {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().startsWith(API_URL)) requests.push(request.method());
  });
  return requests;
}

async function prepareSearch(page: Page) {
  await page.route(API_PATTERN, (route) => mockJson(route, mockedSearchResponse));
  const apiRequests = trackApiRequests(page);
  const search = new SearchPage(page);
  await search.goto();
  expect(await page.evaluate(() => localStorage.getItem('fce_favorites'))).toBeNull();
  await search.submit('favoris synthétiques');
  await expect(search.companyCard(alphaCompany.siren)).toBeVisible();
  await expect(search.companyCard(betaCompany.siren)).toBeVisible();
  return { search, apiRequests };
}

function expectNoFavoriteApiActivity(requests: string[], countBefore: number) {
  expect(requests).toHaveLength(countBefore);
  expect(requests.filter((method) => WRITE_METHODS.has(method))).toEqual([]);
}

test.beforeEach(async () => {
  await allure.epic('French Companies Explorer');
  await allure.feature('Favorites');
  await allure.story('US-FAVORITES-01 — Gérer des entreprises favorites');
});

test('TC-FAVORITES-001 @positive associe correctement et conserve un favori unique', async ({
  page,
}) => {
  // Couvre US-FAVORITES-01 / AC-01, AC-03, AC-04, AC-09
  // Niveau : UI_MOCKED
  const { search, apiRequests } = await prepareSearch(page);
  const alphaFavorite = search.companyFavoriteButton(alphaCompany.siren);
  const betaFavorite = search.companyFavoriteButton(betaCompany.siren);
  await expect(alphaFavorite).not.toHaveClass(/\bactive\b/);
  await expect(betaFavorite).not.toHaveClass(/\bactive\b/);
  const requestsBeforeFavoriteActions = apiRequests.length;

  await alphaFavorite.click();
  await expect(alphaFavorite).toHaveClass(/\bactive\b/);
  await expect(betaFavorite).not.toHaveClass(/\bactive\b/);
  await expect.poll(() => favoriteSirens(page)).toEqual([alphaCompany.siren]);

  await alphaFavorite.click();
  await expect(alphaFavorite).not.toHaveClass(/\bactive\b/);
  await expect.poll(() => favoriteSirens(page)).toEqual([]);

  await alphaFavorite.click();
  await expect(alphaFavorite).toHaveClass(/\bactive\b/);
  await expect(betaFavorite).not.toHaveClass(/\bactive\b/);
  await expect.poll(() => favoriteSirens(page)).toEqual([alphaCompany.siren]);
  expectNoFavoriteApiActivity(apiRequests, requestsBeforeFavoriteActions);
});

test('TC-FAVORITES-002 @positive retire indépendamment plusieurs favoris jusqu’à l’état vide', async ({
  page,
}) => {
  // Couvre US-FAVORITES-01 / AC-02, AC-03, AC-05, AC-08, AC-09
  // Niveau : UI_MOCKED
  const { search, apiRequests } = await prepareSearch(page);
  await search.companyFavoriteButton(alphaCompany.siren).click();
  await search.companyFavoriteButton(betaCompany.siren).click();
  await expect.poll(() => favoriteSirens(page)).toEqual([alphaCompany.siren, betaCompany.siren]);

  await search.openFavorites();
  await expect(search.favoriteCard(alphaCompany.siren)).toHaveCount(1);
  await expect(search.favoriteCard(betaCompany.siren)).toHaveCount(1);
  const requestsBeforeRemovals = apiRequests.length;

  await search.favoriteCardButton(alphaCompany.siren).click();
  await expect(search.favoriteCard(alphaCompany.siren)).toHaveCount(0);
  await expect(search.favoriteCard(betaCompany.siren)).toHaveCount(1);
  await expect.poll(() => favoriteSirens(page)).toEqual([betaCompany.siren]);

  await search.favoriteCardButton(betaCompany.siren).click();
  await expect(search.favoritesView.locator('article.company')).toHaveCount(0);
  await expect(search.favoritesView).toContainText('Aucun favori pour le moment.');
  await expect(search.favoritesView).not.toContainText(/erreur|exception/i);
  await expect.poll(() => favoriteSirens(page)).toEqual([]);
  expectNoFavoriteApiActivity(apiRequests, requestsBeforeRemovals);
});

test('TC-FAVORITES-003 @regression restaure un favori après reload sans lecture API', async ({
  page,
}) => {
  // Couvre US-FAVORITES-01 / AC-03, AC-06, AC-07, AC-09
  // Niveau : UI_MOCKED
  const { search, apiRequests } = await prepareSearch(page);
  await search.companyFavoriteButton(alphaCompany.siren).click();
  await expect.poll(() => favoriteSirens(page)).toEqual([alphaCompany.siren]);
  await expect(search.companyFavoriteButton(betaCompany.siren)).not.toHaveClass(/\bactive\b/);

  await search.clearSearchButton.click();
  apiRequests.length = 0;
  await page.reload();
  await expect.poll(() => favoriteSirens(page)).toEqual([alphaCompany.siren]);

  await search.openFavorites();
  const alphaFavoriteCard = search.favoriteCard(alphaCompany.siren);
  await expect(alphaFavoriteCard).toHaveCount(1);
  await expect(alphaFavoriteCard).toContainText(alphaCompany.nom_complet);
  await expect(alphaFavoriteCard).toContainText(`SIREN ${alphaCompany.siren}`);
  await expect(search.favoriteCardButton(alphaCompany.siren)).toHaveClass(/\bactive\b/);
  await expect(search.favoriteCard(betaCompany.siren)).toHaveCount(0);

  await alphaFavoriteCard.getByRole('button', { name: 'Voir la fiche' }).click();
  await expect(search.detailView).toBeVisible();
  await expect(search.detailContent).toContainText(alphaCompany.nom_complet);
  await expect(search.detailContent).toContainText(`SIREN ${alphaCompany.siren}`);
  await expect(search.detailFavoriteButton()).toHaveClass(/\bactive\b/);
  expect(apiRequests).toEqual([]);
});

test.fixme('TC-FAVORITES-004 @regression BUG-005 synchronise immédiatement le cœur de la fiche', async ({
  page,
}) => {
  // Couvre US-FAVORITES-01 / AC-01, AC-02, AC-03, AC-07, AC-09
  // Niveau : UI_MOCKED
  // Défaut connu : defects/BUG-005-detail-favorite-state-not-refreshed.md
  const { search, apiRequests } = await prepareSearch(page);
  await search.openCompanyDetail(alphaCompany.siren);
  const detailFavorite = search.detailFavoriteButton();
  await expect(detailFavorite).not.toHaveClass(/\bactive\b/);
  const requestsBeforeFavoriteActions = apiRequests.length;

  await detailFavorite.click();
  await expect(detailFavorite).toHaveClass(/\bactive\b/);
  await expect.poll(() => favoriteSirens(page)).toEqual([alphaCompany.siren]);

  await search.backToResults();
  await expect(search.companyFavoriteButton(alphaCompany.siren)).toHaveClass(/\bactive\b/);
  await expect(search.companyFavoriteButton(betaCompany.siren)).not.toHaveClass(/\bactive\b/);
  await search.openFavorites();
  await expect(search.favoriteCard(alphaCompany.siren)).toHaveCount(1);
  await search
    .favoriteCard(alphaCompany.siren)
    .getByRole('button', { name: 'Voir la fiche' })
    .click();

  await expect(search.detailFavoriteButton()).toHaveClass(/\bactive\b/);
  await search.detailFavoriteButton().click();
  await expect(search.detailFavoriteButton()).not.toHaveClass(/\bactive\b/);
  await expect.poll(() => favoriteSirens(page)).toEqual([]);

  await search.openFavorites();
  await expect(search.favoriteCard(alphaCompany.siren)).toHaveCount(0);
  await expect(search.favoritesView).toContainText('Aucun favori pour le moment.');
  expectNoFavoriteApiActivity(apiRequests, requestsBeforeFavoriteActions);
});

test('TC-FAVORITES-005 @regression initialise proprement une collection absente ou vide', async ({
  browser,
}) => {
  // Couvre US-FAVORITES-01 / AC-08, AC-09
  // Niveau : UI_MOCKED
  const verifiedPartitions = [
    await verifyEmptyFavoritesPartition(browser, 'clé absente', () =>
      localStorage.removeItem('fce_favorites'),
    ),
    await verifyEmptyFavoritesPartition(browser, 'liste vide', () =>
      localStorage.setItem('fce_favorites', '[]'),
    ),
  ];
  expect(verifiedPartitions).toEqual(['clé absente', 'liste vide']);
});

async function verifyEmptyFavoritesPartition(
  browser: Browser,
  partition: string,
  initializeStorage: () => void,
) {
  await test.step(partition, async () => {
    const context = await browser.newContext();
    await context.addInitScript(initializeStorage);
    const page = await context.newPage();
    const apiRequests = trackApiRequests(page);
    await page.route(API_PATTERN, (route) => route.abort('blockedbyclient'));
    await page.goto(APP_URL);
    const search = new SearchPage(page);

    await search.openFavorites();
    await expect(search.favoritesView.locator('article.company')).toHaveCount(0);
    await expect(search.favoritesView).toContainText('Aucun favori pour le moment.');
    await expect(search.favoritesView).not.toContainText(/erreur|exception/i);
    expect(apiRequests).toEqual([]);
    await context.close();
  });

  return partition;
}

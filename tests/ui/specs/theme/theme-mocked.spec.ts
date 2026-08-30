import { expect, test, type Page } from '@playwright/test';
import * as allure from 'allure-js-commons';

const APP_URL = 'https://maximejoannis.github.io/french-companies-explorer-qa/';
const API_URL = 'https://recherche-entreprises.api.gouv.fr/search';
const API_PATTERN = `${API_URL}**`;
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const INDEPENDENT_STORAGE = {
  fce_favorites: JSON.stringify([{ siren: '111111111', name: 'Favori sentinelle' }]),
  fce_compare: JSON.stringify([{ siren: '222222222', name: 'Comparaison sentinelle' }]),
  fce_history: JSON.stringify([{ query: 'Historique sentinelle' }]),
  fce_saved: JSON.stringify([{ id: 1, name: 'Sauvegarde sentinelle' }]),
};

interface ApiRequest {
  method: string;
  url: string;
}

function themeButton(page: Page) {
  return page.getByRole('button', { name: 'Changer le thème', exact: true });
}

function trackApiRequests(page: Page) {
  const requests: ApiRequest[] = [];
  page.on('request', (request) => {
    if (request.url().startsWith(API_URL)) {
      requests.push({ method: request.method(), url: request.url() });
    }
  });
  return requests;
}

async function blockSearchApi(page: Page) {
  await page.route(API_PATTERN, (route) => route.abort('blockedbyclient'));
}

async function storageSnapshot(page: Page, keys: string[]) {
  return page.evaluate(
    (storageKeys) => Object.fromEntries(storageKeys.map((key) => [key, localStorage.getItem(key)])),
    keys,
  );
}

async function themeStorage(page: Page) {
  return page.evaluate(() => localStorage.getItem('fce_theme'));
}

function expectNoApiActivity(requests: ApiRequest[]) {
  expect(requests).toEqual([]);
  expect(requests.filter(({ method }) => WRITE_METHODS.has(method))).toEqual([]);
}

test.beforeEach(async () => {
  await allure.epic('French Companies Explorer');
  await allure.feature('Theme');
  await allure.story('US-THEME-01 — Choisir et conserver le thème d’affichage');
});

test('TC-THEME-001 @regression applique et persiste les deux thèmes', async ({ page }) => {
  // Couvre US-THEME-01 / AC-01, AC-02, AC-03, AC-04, AC-09, AC-10, AC-12
  // Niveau : UI_MOCKED
  await page.addInitScript((values) => {
    localStorage.removeItem('fce_theme');
    Object.entries(values).forEach(([key, value]) => localStorage.setItem(key, value));
  }, INDEPENDENT_STORAGE);
  await blockSearchApi(page);
  const apiRequests = trackApiRequests(page);

  await page.goto(APP_URL);
  const toggle = themeButton(page);
  const documentRoot = page.locator('html');

  await expect(toggle).toBeVisible();
  await expect(toggle).toBeEnabled();
  await expect(documentRoot).toHaveAttribute('data-theme', 'light');
  await expect(toggle).toHaveText('☾');
  expect(await themeStorage(page)).toBeNull();
  expectNoApiActivity(apiRequests);

  await toggle.click();
  await expect(documentRoot).toHaveAttribute('data-theme', 'dark');
  await expect(toggle).toHaveText('☀');
  expect(await themeStorage(page)).toBe('dark');

  await toggle.click();
  await expect(documentRoot).toHaveAttribute('data-theme', 'light');
  await expect(toggle).toHaveText('☾');
  expect(await themeStorage(page)).toBe('light');

  expect(await storageSnapshot(page, Object.keys(INDEPENDENT_STORAGE))).toEqual(
    INDEPENDENT_STORAGE,
  );
  expectNoApiActivity(apiRequests);
});

test('TC-THEME-002 @regression restaure le choix après reload et nouvelle visite', async ({
  page,
}) => {
  // Couvre US-THEME-01 / AC-04, AC-05, AC-06, AC-09, AC-10, AC-11, AC-12
  // Niveau : UI_MOCKED
  const independentStorage = {
    fce_saved: JSON.stringify([{ id: 2, name: 'Sentinelle persistante' }]),
  };
  await page.addInitScript((values) => {
    Object.entries(values).forEach(([key, value]) => localStorage.setItem(key, value));
  }, independentStorage);
  await blockSearchApi(page);
  const apiRequests = trackApiRequests(page);

  await page.goto(APP_URL);
  await themeButton(page).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await themeStorage(page)).toBe('dark');

  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(themeButton(page)).toHaveText('☀');
  expect(await themeStorage(page)).toBe('dark');

  await page.getByRole('button', { name: 'Favoris', exact: true }).click();
  await expect(page.locator('#favoritesView')).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  expect(await storageSnapshot(page, Object.keys(independentStorage))).toEqual(independentStorage);

  await page.goto(APP_URL);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  await expect(themeButton(page)).toHaveText('☀');
  expect(await themeStorage(page)).toBe('dark');
  expect(await storageSnapshot(page, Object.keys(independentStorage))).toEqual(independentStorage);
  expectNoApiActivity(apiRequests);
});

test('TC-THEME-003 @regression initialise le thème clair sans écrire de préférence', async ({
  page,
}) => {
  // Couvre US-THEME-01 / AC-07, AC-10, AC-12
  // Niveau : UI_MOCKED
  await page.addInitScript(() => localStorage.removeItem('fce_theme'));
  await blockSearchApi(page);
  const apiRequests = trackApiRequests(page);

  await page.goto(APP_URL);
  const toggle = themeButton(page);

  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(toggle).toBeVisible();
  await expect(toggle).toBeEnabled();
  await expect(toggle).toHaveText('☾');
  expect(await themeStorage(page)).toBeNull();
  expectNoApiActivity(apiRequests);
});

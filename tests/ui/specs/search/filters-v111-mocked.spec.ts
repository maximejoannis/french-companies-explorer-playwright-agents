import { expect, test, type Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { mockedSearchResponse } from '../../../mocks/search-results';
import { SearchPage } from '../../pages/search.page';

const API_PATTERN = 'https://recherche-entreprises.api.gouv.fr/search**';

async function captureRequests(page: Page) {
  const requests: URL[] = [];
  await page.route(API_PATTERN, (route) => {
    const url = new URL(route.request().url());
    if (url.searchParams.get('minimal') === 'true') {
      return route.fulfill({ status: 200, contentType: 'application/json', json: { results: [] } });
    }
    requests.push(url);
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: mockedSearchResponse,
    });
  });
  return requests;
}

test.beforeEach(async () => {
  await allure.epic('French Companies Explorer');
  await allure.feature('FEAT-FILTERS-V111');
  await allure.story('US-FILTERS-02 — Affiner une recherche avec des critères enrichis');
});

test('TC-FILTERS-011 @positive transmet un code NAF valide', async ({ page }) => {
  // Couvre US-FILTERS-02 / AC-01 — UI_MOCKED
  const requests = await captureRequests(page);
  const search = new SearchPage(page);
  await search.goto();
  await search.showAdvancedFilters();
  await search.nafFilter.fill('56.10a');
  await search.submit('restaurant');
  await expect(search.companyCards).not.toHaveCount(0);
  expect(requests[0].searchParams.get('activite_principale')).toBe('56.10A');
});

test('TC-FILTERS-012 @negative refuse un code NAF invalide avant API', async ({ page }) => {
  // Couvre US-FILTERS-02 / AC-02 — UI_MOCKED
  const requests = await captureRequests(page);
  const search = new SearchPage(page);
  await search.goto();
  await search.showAdvancedFilters();
  await search.nafFilter.fill('5610A');
  await search.submit('restaurant');
  await expect(search.searchState).toHaveText('Le code NAF attendu suit le format 56.10A.');
  expect(requests).toHaveLength(0);
});

test('TC-FILTERS-013 @positive accepte les départements numériques, 2A et 2B', async ({ page }) => {
  // Couvre US-FILTERS-02 / AC-03 — UI_MOCKED
  const requests = await captureRequests(page);
  const search = new SearchPage(page);
  await search.goto();
  await search.showAdvancedFilters();
  for (const department of ['75', '2A', '2B']) {
    await search.departmentFilter.fill(department);
    await search.submit('entreprise');
    await expect.poll(() => requests.length).toBeGreaterThan(0);
    expect(requests.at(-1)?.searchParams.get('departement')).toBe(department);
  }
});

test('TC-FILTERS-014 @positive transmet la région', async ({ page }) => {
  // Couvre US-FILTERS-02 / AC-04 — UI_MOCKED
  const requests = await captureRequests(page);
  const search = new SearchPage(page);
  await search.goto();
  await search.showAdvancedFilters();
  await search.regionFilter.fill('11');
  await search.submit('entreprise');
  await expect(search.companyCards).not.toHaveCount(0);
  expect(requests[0].searchParams.get('region')).toBe('11');
});

test('TC-FILTERS-015 @positive transmet la tranche d’effectif', async ({ page }) => {
  // Couvre US-FILTERS-02 / AC-05 — UI_MOCKED
  const requests = await captureRequests(page);
  const search = new SearchPage(page);
  await search.goto();
  await search.showAdvancedFilters();
  await search.workforceFilter.selectOption('12');
  await search.submit('entreprise');
  await expect(search.companyCards).not.toHaveCount(0);
  expect(requests[0].searchParams.get('tranche_effectif_salarie')).toBe('12');
});

test('TC-FILTERS-016 @regression supprime une chip et revient en page 1', async ({ page }) => {
  // Couvre US-FILTERS-02 / AC-06 — UI_MOCKED
  const requests = await captureRequests(page);
  const search = new SearchPage(page);
  await search.goto();
  await search.showAdvancedFilters();
  await search.nafFilter.fill('56.10A');
  await search.submit('entreprise');
  await expect(search.activeFilters).toContainText('Code NAF: 56.10A');
  await search.activeFilters.getByRole('button', { name: /Supprimer le filtre Code NAF/ }).click();
  await expect(search.activeFilters).not.toContainText('Code NAF');
  expect(requests.at(-1)?.searchParams.get('page')).toBe('1');
  expect(requests.at(-1)?.searchParams.has('activite_principale')).toBe(false);
});

test('TC-FILTERS-017 @regression efface les filtres sans effacer la requête', async ({ page }) => {
  // Couvre US-FILTERS-02 / AC-07 — UI_MOCKED
  await captureRequests(page);
  const search = new SearchPage(page);
  await search.goto();
  await search.showAdvancedFilters();
  await search.regionFilter.fill('11');
  await search.workforceFilter.selectOption('12');
  await search.submit('entreprise conservée');
  await search.activeFilters.getByRole('button', { name: 'Effacer tous les filtres' }).click();
  await expect(search.queryInput).toHaveValue('entreprise conservée');
  await expect(search.regionFilter).toHaveValue('');
  await expect(search.workforceFilter).toHaveValue('');
});

test('TC-FILTERS-018 @regression restaure plusieurs filtres depuis l’URL', async ({ page }) => {
  // Couvre US-FILTERS-02 / AC-08 — UI_MOCKED
  const requests = await captureRequests(page);
  await page.goto('./?q=Alpha&naf=56.10A&department=2A&region=11&workforce=12');
  const search = new SearchPage(page);
  await expect(search.companyCards).not.toHaveCount(0);
  await expect(search.nafFilter).toHaveValue('56.10A');
  await expect(search.departmentFilter).toHaveValue('2A');
  await expect(search.regionFilter).toHaveValue('11');
  await expect(search.workforceFilter).toHaveValue('12');
  expect(requests[0].searchParams.get('departement')).toBe('2A');
});

test('TC-FILTERS-019 @negative ignore les filtres URL invalides', async ({ page }) => {
  // Couvre US-FILTERS-02 / AC-09 — UI_MOCKED
  const requests = await captureRequests(page);
  await page.goto('./?q=Alpha&naf=BAD&department=X&region=999&workforce=BAD');
  const search = new SearchPage(page);
  await expect(search.companyCards).not.toHaveCount(0);
  for (const key of ['activite_principale', 'departement', 'region', 'tranche_effectif_salarie']) {
    expect(requests[0].searchParams.has(key)).toBe(false);
  }
});

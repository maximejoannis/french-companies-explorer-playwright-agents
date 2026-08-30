import { expect, test, type Route } from '@playwright/test';
import * as allure from 'allure-js-commons';
import {
  emptySearchResponse,
  mockedCompanies,
  mockedSearchResponse,
} from '../../../mocks/search-results';
import { SearchPage } from '../../pages/search.page';

const API_PATTERN = 'https://recherche-entreprises.api.gouv.fr/search**';

async function mockJson(route: Route, body: unknown) {
  await route.fulfill({ status: 200, contentType: 'application/json', json: body });
}

test.beforeEach(async () => {
  await allure.epic('French Companies Explorer');
  await allure.feature('Filters');
  await allure.story('US-FILTERS-01 — Filtrer les entreprises recherchées');
});

test('TC-FILTERS-005 @positive transmet chaque contrôle sous le bon paramètre API', async ({
  page,
}) => {
  // Couvre US-FILTERS-01 / AC-01, AC-02, AC-03
  const requests: URL[] = [];
  await page.route(API_PATTERN, async (route) => {
    requests.push(new URL(route.request().url()));
    await mockJson(route, mockedSearchResponse);
  });
  const search = new SearchPage(page);
  await search.goto();
  await search.showAdvancedFilters();

  await search.postalCodeFilter.fill('75015');
  await search.submit('entreprise test');
  await expect(search.companyCard(mockedCompanies[0].siren)).toBeVisible();

  await search.postalCodeFilter.fill('');
  await search.cityFilter.fill('Paris');
  await search.searchButton.click();
  await expect.poll(() => requests.length).toBe(2);

  await search.cityFilter.fill('');
  await search.statusFilter.selectOption('A');
  await search.searchButton.click();
  await expect.poll(() => requests.length).toBe(3);

  await search.statusFilter.selectOption('C');
  await search.searchButton.click();
  await expect.poll(() => requests.length).toBe(4);

  expect(requests[0].searchParams.get('code_postal')).toBe('75015');
  expect(requests[0].searchParams.has('commune')).toBe(false);
  expect(requests[0].searchParams.has('etat_administratif')).toBe(false);
  expect(requests[1].searchParams.get('commune')).toBe('Paris');
  expect(requests[1].searchParams.has('code_postal')).toBe(false);
  expect(requests[1].searchParams.has('etat_administratif')).toBe(false);
  expect(requests[2].searchParams.get('etat_administratif')).toBe('A');
  expect(requests[2].searchParams.has('code_postal')).toBe(false);
  expect(requests[2].searchParams.has('commune')).toBe(false);
  expect(requests[3].searchParams.get('etat_administratif')).toBe('C');
  expect(requests[3].searchParams.has('code_postal')).toBe(false);
  expect(requests[3].searchParams.has('commune')).toBe(false);
});

test('TC-FILTERS-006 @positive combine les filtres et remplace les anciens résultats', async ({
  page,
}) => {
  // Couvre US-FILTERS-01 / AC-04, AC-07
  const requests: URL[] = [];
  let responseIndex = 0;
  const responses = [
    { results: [mockedCompanies[0]], total_results: 1 },
    { results: [mockedCompanies[1]], total_results: 1 },
  ];
  await page.route(API_PATTERN, async (route) => {
    requests.push(new URL(route.request().url()));
    await mockJson(route, responses[responseIndex]);
    responseIndex += 1;
  });
  const search = new SearchPage(page);
  await search.goto();
  await search.showAdvancedFilters();
  await search.submit('entreprise test');
  await expect(search.companyCard(mockedCompanies[0].siren)).toBeVisible();

  await search.postalCodeFilter.fill('75015');
  await search.cityFilter.fill('Paris');
  await search.statusFilter.selectOption('A');
  await search.searchButton.click();

  await expect(search.companyCard(mockedCompanies[1].siren)).toBeVisible();
  await expect(search.companyCard(mockedCompanies[0].siren)).toHaveCount(0);
  expect(requests).toHaveLength(2);
  expect(requests[1].searchParams.get('code_postal')).toBe('75015');
  expect(requests[1].searchParams.get('commune')).toBe('Paris');
  expect(requests[1].searchParams.get('etat_administratif')).toBe('A');
});

test('TC-FILTERS-007 conserve et présente les filtres actifs après succès', async ({ page }) => {
  // Couvre US-FILTERS-01 / AC-05
  await page.route(API_PATTERN, (route) => mockJson(route, mockedSearchResponse));
  const search = new SearchPage(page);
  await search.goto();
  await search.showAdvancedFilters();
  await search.postalCodeFilter.fill('75015');
  await search.cityFilter.fill('Paris');
  await search.statusFilter.selectOption('A');
  await search.submit('entreprise test');

  await expect(search.companyCard(mockedCompanies[0].siren)).toBeVisible();
  await expect(search.postalCodeFilter).toHaveValue('75015');
  await expect(search.cityFilter).toHaveValue('Paris');
  await expect(search.statusFilter).toHaveValue('A');
  await expect(search.activeFilters).toContainText('Code postal: 75015');
  await expect(search.activeFilters).toContainText('Commune: Paris');
  await expect(search.activeFilters).toContainText('État: A');
  await expect(
    search.activeFilters.getByRole('button', { name: 'Supprimer Code postal' }),
  ).toBeVisible();
  await expect(
    search.activeFilters.getByRole('button', { name: 'Supprimer Commune' }),
  ).toBeVisible();
  await expect(search.activeFilters.getByRole('button', { name: 'Supprimer État' })).toBeVisible();
});

test('TC-FILTERS-008 conserve le filtre dans un état vide fonctionnel', async ({ page }) => {
  // Couvre US-FILTERS-01 / AC-06, contribution AC-05
  let filteredRequest: URL | undefined;
  await page.route(API_PATTERN, async (route) => {
    filteredRequest = new URL(route.request().url());
    await mockJson(route, emptySearchResponse);
  });
  const search = new SearchPage(page);
  await search.goto();
  await search.showAdvancedFilters();
  await search.postalCodeFilter.fill('99999');
  await search.submit('entreprise test');

  await expect(search.searchState).toHaveText('Aucune entreprise ne correspond à cette recherche.');
  expect(filteredRequest?.searchParams.get('code_postal')).toBe('99999');
  await expect(search.resultsGrid).toBeEmpty();
  await expect(search.postalCodeFilter).toHaveValue('99999');
  await expect(search.activeFilters).toContainText('Code postal: 99999');
});

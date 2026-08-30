import { expect, test, type Page, type Route } from '@playwright/test';
import * as allure from 'allure-js-commons';
import {
  newSearchSortCompanies,
  nextPageSortCompanies,
  sortCompanies,
  sortSearchResponse,
} from '../../../mocks/sort-results';
import { SearchPage } from '../../pages/search.page';

const API_PATTERN = 'https://recherche-entreprises.api.gouv.fr/search**';
const RAW_ORDER = sortCompanies.map(({ siren }) => siren);
const NAME_ASC_ORDER = [
  sortCompanies[1].siren,
  sortCompanies[3].siren,
  sortCompanies[2].siren,
  sortCompanies[0].siren,
];
const NAME_DESC_ORDER = [...NAME_ASC_ORDER].reverse();

async function mockJson(route: Route, body: unknown) {
  await route.fulfill({ status: 200, contentType: 'application/json', json: body });
}

async function routeResponses(page: Page, responses: unknown[], requests: URL[]) {
  let responseIndex = 0;
  await page.route(API_PATTERN, async (route) => {
    requests.push(new URL(route.request().url()));
    await mockJson(route, responses[responseIndex]);
    responseIndex += 1;
  });
}

test.beforeEach(async () => {
  await allure.epic('French Companies Explorer');
  await allure.feature('Sort');
  await allure.story('US-SORT-01 — Trier les résultats');
});

test('TC-SORT-001 vérifie les options et l’ordre initial de pertinence', async ({ page }) => {
  // Couvre US-SORT-01 / AC-01, contribution AC-09
  await page.route(API_PATTERN, (route) => mockJson(route, sortSearchResponse(sortCompanies)));
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('tri synthétique');

  await expect(search.sortSelect.getByRole('option')).toHaveText([
    'Pertinence',
    'Nom A → Z',
    'Nom Z → A',
    'Création récente',
    'Création ancienne',
    'Statut',
  ]);
  await expect(search.sortSelect).toHaveValue('relevance');
  await expect.poll(() => search.visibleSirens()).toEqual(RAW_ORDER);
});

test('TC-SORT-002 @positive trie les noms dans les deux directions', async ({ page }) => {
  // Couvre US-SORT-01 / AC-03, contribution AC-09
  await page.route(API_PATTERN, (route) => mockJson(route, sortSearchResponse(sortCompanies)));
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('tri synthétique');

  await search.selectSort('name-asc');
  await expect(search.sortSelect).toHaveValue('name-asc');
  await expect.poll(() => search.visibleSirens()).toEqual(NAME_ASC_ORDER);

  await search.selectSort('name-desc');
  await expect(search.sortSelect).toHaveValue('name-desc');
  await expect.poll(() => search.visibleSirens()).toEqual(NAME_DESC_ORDER);
});

test('TC-SORT-003 @positive trie les dates et place la valeur absente', async ({ page }) => {
  // Couvre US-SORT-01 / AC-04, contribution AC-09
  // Le placement de la date absente est le comportement déterministe observé, pas une règle métier générale.
  await page.route(API_PATTERN, (route) => mockJson(route, sortSearchResponse(sortCompanies)));
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('tri synthétique');

  await search.selectSort('creation-newest');
  await expect(search.sortSelect).toHaveValue('creation-newest');
  await expect
    .poll(() => search.visibleSirens())
    .toEqual([
      sortCompanies[1].siren,
      sortCompanies[2].siren,
      sortCompanies[0].siren,
      sortCompanies[3].siren,
    ]);

  await search.selectSort('creation-oldest');
  await expect(search.sortSelect).toHaveValue('creation-oldest');
  await expect
    .poll(() => search.visibleSirens())
    .toEqual([
      sortCompanies[3].siren,
      sortCompanies[0].siren,
      sortCompanies[2].siren,
      sortCompanies[1].siren,
    ]);
});

test('TC-SORT-004 @positive trie les statuts A puis C de manière stable', async ({ page }) => {
  // Couvre US-SORT-01 / AC-05, contribution AC-09
  await page.route(API_PATTERN, (route) => mockJson(route, sortSearchResponse(sortCompanies)));
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('tri synthétique');

  await search.selectSort('status');

  await expect(search.sortSelect).toHaveValue('status');
  await expect
    .poll(() => search.visibleSirens())
    .toEqual([
      sortCompanies[1].siren,
      sortCompanies[3].siren,
      sortCompanies[0].siren,
      sortCompanies[2].siren,
    ]);
});

test.fixme('TC-SORT-005 @regression BUG-003 restaure l’ordre brut de pertinence', async ({
  page,
}) => {
  // Couvre US-SORT-01 / AC-02, contributions AC-07, AC-09
  // Défaut connu : defects/BUG-003-relevance-sort-does-not-restore-original-order.md
  let requestCount = 0;
  await page.route(API_PATTERN, async (route) => {
    requestCount += 1;
    await mockJson(route, sortSearchResponse(sortCompanies));
  });
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('tri synthétique');
  await expect.poll(() => search.visibleSirens()).toEqual(RAW_ORDER);

  await search.selectSort('name-asc');
  await expect.poll(() => search.visibleSirens()).toEqual(NAME_ASC_ORDER);
  await search.selectSort('relevance');

  await expect(search.sortSelect).toHaveValue('relevance');
  await expect.poll(() => search.visibleSirens()).toEqual(RAW_ORDER);
  expect(requestCount).toBe(1);
});

test('TC-SORT-006 @positive conserve l’ensemble et trie sans requête supplémentaire', async ({
  page,
}) => {
  // Couvre US-SORT-01 / AC-06, AC-07
  let requestCount = 0;
  await page.route(API_PATTERN, async (route) => {
    requestCount += 1;
    await mockJson(route, sortSearchResponse(sortCompanies));
  });
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('tri synthétique');
  await expect.poll(() => search.visibleSirens()).toEqual(RAW_ORDER);
  const initialSirens = await search.visibleSirens();
  const expectedSet = [...initialSirens].sort();
  const initialRequestCount = requestCount;

  for (const mode of [
    { value: 'name-asc', label: 'Nom A → Z' },
    { value: 'name-desc', label: 'Nom Z → A' },
    { value: 'creation-newest', label: 'Création récente' },
    { value: 'creation-oldest', label: 'Création ancienne' },
    { value: 'status', label: 'Statut' },
  ]) {
    await test.step(mode.label, async () => {
      await search.selectSort(mode.value);
      const currentSirens = await search.visibleSirens();
      expect(currentSirens).toHaveLength(initialSirens.length);
      expect([...currentSirens].sort()).toEqual(expectedSet);
      expect(new Set(currentSirens).size).toBe(initialSirens.length);
      expect(requestCount).toBe(initialRequestCount);
    });
  }
});

test('TC-SORT-007 @positive applique le tri aux nouveaux résultats', async ({ page }) => {
  // Couvre US-SORT-01 / AC-08, AC-09
  const requests: URL[] = [];
  await routeResponses(
    page,
    [
      sortSearchResponse(sortCompanies),
      sortSearchResponse(newSearchSortCompanies),
      sortSearchResponse(sortCompanies, { totalResults: 40 }),
      sortSearchResponse(nextPageSortCompanies, { page: 2, totalResults: 40 }),
    ],
    requests,
  );
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('recherche initiale');
  await expect.poll(() => search.visibleSirens()).toEqual(RAW_ORDER);
  await search.selectSort('name-asc');

  await search.submit('nouvelle recherche');

  await expect(search.sortSelect).toHaveValue('name-asc');
  await expect
    .poll(() => search.visibleSirens())
    .toEqual([newSearchSortCompanies[1].siren, newSearchSortCompanies[0].siren]);
  expect(requests[1].searchParams.get('q')).toBe('nouvelle recherche');
  expect(requests[1].searchParams.has('sort')).toBe(false);

  await search.goto();
  await search.submit('recherche paginée');
  await expect.poll(() => search.visibleSirens()).toEqual(RAW_ORDER);
  await search.selectSort('name-asc');
  await search.nextPageButton.click();

  await expect(search.sortSelect).toHaveValue('name-asc');
  await expect
    .poll(() => search.visibleSirens())
    .toEqual([nextPageSortCompanies[1].siren, nextPageSortCompanies[0].siren]);
  expect(requests[3].searchParams.get('page')).toBe('2');
  expect(requests[3].searchParams.has('sort')).toBe(false);
});

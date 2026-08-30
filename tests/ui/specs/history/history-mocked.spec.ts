import { expect, test, type Browser, type Page, type Route } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { emptySearchResponse, mockedSearchResponse } from '../../../mocks/search-results';
import { SearchPage } from '../../pages/search.page';

const APP_URL = 'https://maximejoannis.github.io/french-companies-explorer-qa/';
const API_URL = 'https://recherche-entreprises.api.gouv.fr/search';
const API_PATTERN = `${API_URL}**`;
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const paginatedResponse = {
  ...mockedSearchResponse,
  total_results: 40,
  page: 1,
  per_page: 20,
  total_pages: 2,
};

interface HistoryEntry {
  query: string;
  postalCode: string;
  city: string;
  status: string;
  at?: string;
}

interface ApiRequest {
  method: string;
  url: string;
}

async function mockJson(route: Route, body: unknown) {
  await route.fulfill({ status: 200, contentType: 'application/json', json: body });
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

function expectNoApiWrites(requests: ApiRequest[]) {
  expect(requests.filter(({ method }) => WRITE_METHODS.has(method))).toEqual([]);
}

async function historyEntries(page: Page): Promise<HistoryEntry[]> {
  return page.evaluate(() => {
    const stored = localStorage.getItem('fce_history');
    if (stored === null) return [];

    const entries: unknown = JSON.parse(stored);
    if (!Array.isArray(entries)) return [];

    return entries.flatMap((entry: unknown) => {
      if (typeof entry !== 'object' || entry === null || !('query' in entry)) return [];
      const candidate = entry as Record<string, unknown>;
      if (typeof candidate.query !== 'string') return [];
      return [
        {
          query: candidate.query,
          postalCode: typeof candidate.postalCode === 'string' ? candidate.postalCode : '',
          city: typeof candidate.city === 'string' ? candidate.city : '',
          status: typeof candidate.status === 'string' ? candidate.status : '',
          ...(typeof candidate.at === 'string' ? { at: candidate.at } : {}),
        },
      ];
    });
  });
}

function identities(entries: HistoryEntry[]) {
  return entries.map(({ query, postalCode, city, status }) => ({
    query,
    postalCode,
    city,
    status,
  }));
}

async function submitAndWait(search: SearchPage, page: Page, query: string) {
  const responsePromise = page.waitForResponse((response) => response.url().startsWith(API_URL));
  await search.submit(query);
  await responsePromise;
}

async function prepareSearch(page: Page, body: unknown = mockedSearchResponse) {
  await page.route(API_PATTERN, (route) => mockJson(route, body));
  const apiRequests = trackApiRequests(page);
  const search = new SearchPage(page);
  await search.goto();
  expect(await page.evaluate(() => localStorage.getItem('fce_history'))).toBeNull();
  return { search, apiRequests };
}

async function setCriteria(
  search: SearchPage,
  criteria: { postalCode?: string; city?: string; status?: string },
) {
  await search.postalCodeFilter.fill(criteria.postalCode ?? '');
  await search.cityFilter.fill(criteria.city ?? '');
  await search.statusFilter.selectOption(criteria.status ?? '');
}

test.beforeEach(async () => {
  await allure.epic('French Companies Explorer');
  await allure.feature('History');
  await allure.story('US-HISTORY-01 — Consulter et réutiliser l’historique des recherches');
});

test('TC-HISTORY-001 @regression enregistre uniquement les recherches éligibles', async ({
  page,
}) => {
  // Couvre US-HISTORY-01 / AC-01, AC-10, AC-11
  // Niveau : UI_MOCKED
  const apiRequests = trackApiRequests(page);
  await page.route(API_PATTERN, async (route) => {
    const query = new URL(route.request().url()).searchParams.get('q');
    if (query === 'recherche en erreur') {
      await route.fulfill({ status: 500, body: 'server error' });
      return;
    }
    await mockJson(route, query === 'recherche vide' ? emptySearchResponse : mockedSearchResponse);
  });
  const search = new SearchPage(page);
  await search.goto();

  await submitAndWait(search, page, 'recherche avec résultats');
  await expect
    .poll(async () => identities(await historyEntries(page)))
    .toEqual([{ query: 'recherche avec résultats', postalCode: '', city: '', status: '' }]);
  await submitAndWait(search, page, 'recherche vide');
  await expect(search.searchState).toHaveText('Aucune entreprise ne correspond à cette recherche.');

  const requestsBeforeInvalid = apiRequests.length;
  await search.submit('12345678');
  await expect(search.searchState).toContainText('Identifiant invalide');
  expect(apiRequests).toHaveLength(requestsBeforeInvalid);

  await submitAndWait(search, page, 'recherche en erreur');
  await expect(search.searchState).toContainText("Impossible de joindre l'API");
  await search.openHistory();

  await expect(search.historyEntry('recherche vide')).toHaveCount(1);
  await expect(search.historyEntry('recherche avec résultats')).toHaveCount(1);
  await expect(search.historyList.locator('article')).toHaveCount(2);
  await expect(search.historyEntry('recherche avec résultats')).toContainText(
    'Sans filtre géographique',
  );
  await expect(search.historyList).not.toContainText(/undefined|null|\[object Object\]|exception/i);
  expect(identities(await historyEntries(page))).toEqual([
    { query: 'recherche vide', postalCode: '', city: '', status: '' },
    { query: 'recherche avec résultats', postalCode: '', city: '', status: '' },
  ]);
  expect(apiRequests.map(({ method }) => method)).toEqual(['GET', 'GET', 'GET']);
  expectNoApiWrites(apiRequests);
});

test.fixme('TC-HISTORY-002 @regression BUG-009 distingue tous les critères d’identité', async ({
  page,
}) => {
  // Couvre US-HISTORY-01 / AC-02, AC-03, AC-04
  // Niveau : UI_MOCKED
  // Défaut connu : defects/BUG-009-history-ignores-status-in-search-identity.md
  const { search } = await prepareSearch(page);
  await search.showAdvancedFilters();

  await setCriteria(search, { status: 'A' });
  await submitAndWait(search, page, 'identité commune');
  await setCriteria(search, { status: 'C' });
  await submitAndWait(search, page, 'identité commune');
  await setCriteria(search, { postalCode: '75001', status: 'A' });
  await submitAndWait(search, page, 'identité commune');
  await setCriteria(search, { city: 'Lyon', status: 'A' });
  await submitAndWait(search, page, 'identité commune');
  await setCriteria(search, {});
  await submitAndWait(search, page, 'recherche incompatible');
  await setCriteria(search, { postalCode: '75001', status: 'A' });
  await submitAndWait(search, page, 'identité commune');

  const expectedIdentities = [
    { query: 'identité commune', postalCode: '75001', city: '', status: 'A' },
    { query: 'recherche incompatible', postalCode: '', city: '', status: '' },
    { query: 'identité commune', postalCode: '', city: 'Lyon', status: 'A' },
    { query: 'identité commune', postalCode: '', city: '', status: 'C' },
    { query: 'identité commune', postalCode: '', city: '', status: 'A' },
  ];
  await expect.poll(async () => identities(await historyEntries(page))).toEqual(expectedIdentities);
  await search.openHistory();
  await expect(search.historyList.locator('article')).toHaveCount(5);
  await expect(search.historyEntry('identité commune', '75001')).toHaveCount(1);
  await expect(search.historyEntry('identité commune', 'Lyon')).toHaveCount(1);
});

test('TC-HISTORY-003 @regression conserve les douze recherches les plus récentes', async ({
  page,
}) => {
  // Couvre US-HISTORY-01 / AC-03, AC-07
  // Niveau : UI_MOCKED
  const { search, apiRequests } = await prepareSearch(page);

  for (let index = 1; index <= 13; index += 1) {
    await submitAndWait(search, page, `historique capacité ${index}`);
  }
  const expectedQueries = Array.from(
    { length: 12 },
    (_, index) => `historique capacité ${13 - index}`,
  );
  await expect
    .poll(async () => (await historyEntries(page)).map(({ query }) => query))
    .toEqual(expectedQueries);
  await search.openHistory();

  await expect(search.historyList.locator('article')).toHaveCount(12);
  await expect(search.historyEntry('historique capacité 1')).toHaveCount(0);
  await expect(search.historyList.locator('article p b')).toHaveText(expectedQueries);
  expect(apiRequests).toHaveLength(13);
  expectNoApiWrites(apiRequests);
});

test('TC-HISTORY-004 @regression restaure et relance uniquement la recherche choisie', async ({
  page,
}) => {
  // Couvre US-HISTORY-01 / AC-02, AC-03, AC-05, AC-11
  // Niveau : UI_MOCKED
  const { search, apiRequests } = await prepareSearch(page);
  await search.showAdvancedFilters();
  await setCriteria(search, { postalCode: '75001', status: 'A' });
  await submitAndWait(search, page, 'Alpha historique');
  await setCriteria(search, { city: 'Lyon', status: 'C' });
  await submitAndWait(search, page, 'Bêta historique');
  await search.openHistory();
  const requestsBeforeReplay = apiRequests.length;

  const replayResponse = page.waitForResponse((response) => response.url().startsWith(API_URL));
  await search.historyRelaunchButton('Alpha historique', '75001').click();
  const response = await replayResponse;

  await expect(search.searchView).toBeVisible();
  await expect(search.queryInput).toHaveValue('Alpha historique');
  await expect(search.postalCodeFilter).toHaveValue('75001');
  await expect(search.cityFilter).toHaveValue('');
  await expect(search.statusFilter).toHaveValue('A');
  const replayUrl = new URL(response.url());
  expect(replayUrl.searchParams.get('page')).toBe('1');
  expect(replayUrl.searchParams.get('q')).toBe('Alpha historique');
  expect(apiRequests).toHaveLength(requestsBeforeReplay + 1);
  await expect
    .poll(async () => (await historyEntries(page)).map(({ query }) => query))
    .toEqual(['Alpha historique', 'Bêta historique']);
  await search.openHistory();
  await expect(search.historyEntry('Alpha historique')).toHaveCount(1);
  expectNoApiWrites(apiRequests);
});

test('TC-HISTORY-005 @regression persiste après un vrai reload sans lecture API', async ({
  page,
}) => {
  // Couvre US-HISTORY-01 / AC-03, AC-06, AC-11
  // Niveau : UI_MOCKED
  const { search, apiRequests } = await prepareSearch(page);
  await submitAndWait(search, page, 'Alpha persistée');
  await submitAndWait(search, page, 'Bêta persistée');
  const expectedIdentities = identities(await historyEntries(page));
  expect(expectedIdentities.map(({ query }) => query)).toEqual([
    'Bêta persistée',
    'Alpha persistée',
  ]);

  await search.clearSearchButton.click();
  apiRequests.length = 0;
  await page.reload();
  await search.openHistory();

  await expect(search.historyList.locator('article p b')).toHaveText([
    'Bêta persistée',
    'Alpha persistée',
  ]);
  expect(identities(await historyEntries(page))).toEqual(expectedIdentities);
  expect(apiRequests).toEqual([]);
});

test('TC-HISTORY-006 @regression initialise et nettoie uniquement History', async ({ browser }) => {
  // Couvre US-HISTORY-01 / AC-08, AC-09, AC-11
  // Niveau : UI_MOCKED
  const emptyPartitions = [
    await verifyEmptyHistoryPartition(browser, 'clé absente', () =>
      localStorage.removeItem('fce_history'),
    ),
    await verifyEmptyHistoryPartition(browser, 'liste vide', () =>
      localStorage.setItem('fce_history', '[]'),
    ),
  ];
  expect(emptyPartitions).toEqual(['clé absente', 'liste vide']);

  await verifyHistoryClearPartition(browser);
});

test.fixme('TC-HISTORY-007 @regression BUG-010 préserve la récence pendant la navigation', async ({
  page,
}) => {
  // Couvre US-HISTORY-01 / AC-01, AC-03, AC-04, AC-11
  // Niveau : UI_MOCKED
  // Défaut connu : defects/BUG-010-pagination-updates-history-recency.md
  const { search, apiRequests } = await prepareSearch(page, paginatedResponse);
  await submitAndWait(search, page, 'Alpha navigation');
  await submitAndWait(search, page, 'Bêta navigation');
  await search.openHistory();
  const replayResponse = page.waitForResponse((response) => response.url().startsWith(API_URL));
  await search.historyRelaunchButton('Alpha navigation').click();
  await replayResponse;
  const historyBeforeNavigation = await page.evaluate(() => localStorage.getItem('fce_history'));

  const requestsBeforeSort = apiRequests.length;
  await search.selectSort('name-desc');
  expect(apiRequests).toHaveLength(requestsBeforeSort);
  expect(await page.evaluate(() => localStorage.getItem('fce_history'))).toBe(
    historyBeforeNavigation,
  );

  const requestsBeforePagination = apiRequests.length;
  const paginationResponse = page.waitForResponse((response) => response.url().startsWith(API_URL));
  await search.nextPageButton.click();
  await paginationResponse;
  expect(apiRequests).toHaveLength(requestsBeforePagination + 1);
  expect(await page.evaluate(() => localStorage.getItem('fce_history'))).toBe(
    historyBeforeNavigation,
  );

  const requestsBeforePageSize = apiRequests.length;
  const pageSizeResponse = page.waitForResponse((response) => response.url().startsWith(API_URL));
  await search.selectPageSize('10');
  await pageSizeResponse;
  expect(apiRequests).toHaveLength(requestsBeforePageSize + 1);
  expect(await page.evaluate(() => localStorage.getItem('fce_history'))).toBe(
    historyBeforeNavigation,
  );
  expectNoApiWrites(apiRequests);
});

async function verifyEmptyHistoryPartition(
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
    await search.openHistory();

    await expect(search.historyList).toHaveText('Aucune recherche enregistrée.');
    await expect(search.historyList.locator('article')).toHaveCount(0);
    await expect(search.historyList).not.toContainText(
      /undefined|null|\[object Object\]|exception/i,
    );
    expect(apiRequests).toEqual([]);
    await context.close();
  });

  return partition;
}

async function verifyHistoryClearPartition(browser: Browser) {
  await test.step('nettoyage global isolé', async () => {
    const initialHistory: HistoryEntry[] = [
      { query: 'Bêta à effacer', postalCode: '', city: 'Lyon', status: 'C', at: 'recent' },
      { query: 'Alpha à effacer', postalCode: '75001', city: '', status: 'A', at: 'older' },
    ];
    const initialSaved = [
      {
        id: 1,
        name: 'Recherche conservée',
        query: 'sauvegardée',
        postalCode: '',
        city: '',
        status: '',
        pageSize: 20,
      },
    ];
    const context = await browser.newContext();
    await context.addInitScript(
      ({ history, saved }) => {
        localStorage.setItem('fce_history', JSON.stringify(history));
        localStorage.setItem('fce_saved', JSON.stringify(saved));
      },
      { history: initialHistory, saved: initialSaved },
    );
    const page = await context.newPage();
    const apiRequests = trackApiRequests(page);
    await page.route(API_PATTERN, (route) => route.abort('blockedbyclient'));
    await page.goto(APP_URL);
    const search = new SearchPage(page);
    await search.openHistory();
    await expect(search.historyList.locator('article')).toHaveCount(2);

    await search.clearHistoryButton.click();

    await expect(search.historyList).toHaveText('Aucune recherche enregistrée.');
    await expect(search.historyList.locator('article')).toHaveCount(0);
    expect(
      await page.evaluate(() => JSON.parse(localStorage.getItem('fce_history') ?? 'null')),
    ).toEqual([]);
    expect(
      await page.evaluate(() => JSON.parse(localStorage.getItem('fce_saved') ?? 'null')),
    ).toEqual(initialSaved);
    expect(apiRequests).toEqual([]);
    await context.close();
  });
}

import { expect, test, type Browser, type Page, type Route } from '@playwright/test';
import { mockedSearchResponse } from '../../../mocks/search-results';
import { SearchPage } from '../../pages/search.page';

const APP_URL = 'https://maximejoannis.github.io/french-companies-explorer-qa/';
const API_URL = 'https://recherche-entreprises.api.gouv.fr/search';
const API_PATTERN = `${API_URL}**`;
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

interface SavedSearch {
  id: unknown;
  name: string;
  query: string;
  postalCode: string;
  city: string;
  status: string;
  pageSize: number;
}

interface ApiRequest {
  method: string;
  url: string;
}

async function mockSearch(route: Route) {
  await route.fulfill({
    status: 200,
    contentType: 'application/json',
    json: mockedSearchResponse,
  });
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

async function savedSearches(page: Page): Promise<SavedSearch[]> {
  return page.evaluate(() => {
    const value: unknown = JSON.parse(localStorage.getItem('fce_saved') ?? '[]');
    return Array.isArray(value) ? value : [];
  });
}

function projectSaved(entries: SavedSearch[]) {
  return entries.map(({ name, query, postalCode, city, status, pageSize }) => ({
    name,
    query,
    postalCode,
    city,
    status,
    pageSize,
  }));
}

async function submitAndWait(search: SearchPage, page: Page, query: string) {
  const responsePromise = page.waitForResponse((response) => response.url().startsWith(API_URL));
  await search.submit(query);
  await responsePromise;
}

async function answerSavePrompt(page: Page, search: SearchPage, name: string | null) {
  const handledDialog = new Promise<void>((resolve, reject) => {
    page.once('dialog', async (dialog) => {
      try {
        expect(dialog.type()).toBe('prompt');
        expect(dialog.message()).toBe('Nom de la recherche sauvegardée :');
        if (name === null) await dialog.dismiss();
        else await dialog.accept(name);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  });
  await search.saveSearchButton.click();
  await handledDialog;
}

async function setCriteria(
  search: SearchPage,
  criteria: {
    postalCode?: string;
    city?: string;
    status?: string;
    pageSize?: string;
  },
) {
  await search.postalCodeFilter.fill(criteria.postalCode ?? '');
  await search.cityFilter.fill(criteria.city ?? '');
  await search.statusFilter.selectOption(criteria.status ?? '');
  await search.resultsPerPageFilter.selectOption(criteria.pageSize ?? '20');
}

async function prepareSearch(page: Page) {
  await page.route(API_PATTERN, mockSearch);
  const apiRequests = trackApiRequests(page);
  const search = new SearchPage(page);
  await search.goto();
  return { search, apiRequests };
}

test('TC-SAVED-001 @regression crée explicitement une recherche sous un nom exploitable', async ({
  page,
}) => {
  // Couvre US-SAVED-SEARCH-01 / AC-01, AC-02, AC-11, AC-12
  // Niveau : UI_MOCKED
  const { search, apiRequests } = await prepareSearch(page);

  await search.saveSearchButton.click();
  await expect(search.toast).toHaveText('Aucune recherche à sauvegarder.');
  expect(await page.evaluate(() => localStorage.getItem('fce_saved'))).toBeNull();

  await submitAndWait(search, page, 'Alpha explicite');
  expect(await page.evaluate(() => localStorage.getItem('fce_saved'))).toBeNull();
  const historyAfterSearch = await page.evaluate(() => localStorage.getItem('fce_history'));
  const requestsAfterSearch = apiRequests.length;

  await answerSavePrompt(page, search, null);
  expect(await page.evaluate(() => localStorage.getItem('fce_saved'))).toBeNull();
  await answerSavePrompt(page, search, '');
  expect(await page.evaluate(() => localStorage.getItem('fce_saved'))).toBeNull();
  await answerSavePrompt(page, search, 'Veille Alpha');

  await expect
    .poll(async () => projectSaved(await savedSearches(page)))
    .toEqual([
      {
        name: 'Veille Alpha',
        query: 'Alpha explicite',
        postalCode: '',
        city: '',
        status: '',
        pageSize: 20,
      },
    ]);
  expect(await page.evaluate(() => localStorage.getItem('fce_history'))).toBe(historyAfterSearch);
  expect(apiRequests).toHaveLength(requestsAfterSearch);
  expectNoApiWrites(apiRequests);
});

test('TC-SAVED-002 @regression applique la règle d’identité indépendamment du nom', async ({
  page,
}) => {
  // Couvre US-SAVED-SEARCH-01 / AC-02, AC-03, AC-05, AC-06, AC-11, AC-12
  // Niveau : UI_MOCKED
  const { search, apiRequests } = await prepareSearch(page);
  await search.showAdvancedFilters();

  await setCriteria(search, { postalCode: '75001', status: 'A', pageSize: '10' });
  await submitAndWait(search, page, 'Alpha identité');
  await answerSavePrompt(page, search, 'Nom Alpha');
  const alphaId = (await savedSearches(page))[0].id;
  const requestsBeforeRename = apiRequests.length;

  await answerSavePrompt(page, search, 'Alpha renommée');
  let stored = await savedSearches(page);
  expect(stored).toHaveLength(1);
  expect(stored[0].id).toEqual(alphaId);
  expect(stored[0].name).toBe('Alpha renommée');
  expect(apiRequests).toHaveLength(requestsBeforeRename);

  await setCriteria(search, { city: 'Lyon', status: 'C', pageSize: '25' });
  await submitAndWait(search, page, 'Bêta identité');
  await answerSavePrompt(page, search, 'Alpha renommée');
  const requestsBeforeRepeat = apiRequests.length;
  await answerSavePrompt(page, search, 'Alpha renommée');

  stored = await savedSearches(page);
  expect(stored).toHaveLength(2);
  expect(new Set(stored.map(({ id }) => id)).size).toBe(2);
  expect(projectSaved(stored)).toEqual([
    {
      name: 'Alpha renommée',
      query: 'Bêta identité',
      postalCode: '',
      city: 'Lyon',
      status: 'C',
      pageSize: 25,
    },
    {
      name: 'Alpha renommée',
      query: 'Alpha identité',
      postalCode: '75001',
      city: '',
      status: 'A',
      pageSize: 10,
    },
  ]);
  expect(stored[1].id).toEqual(alphaId);
  expect(apiRequests).toHaveLength(requestsBeforeRepeat);
  expectNoApiWrites(apiRequests);
});

test('TC-SAVED-003 @regression conserve les douze sauvegardes les plus récentes', async ({
  page,
}) => {
  // Couvre US-SAVED-SEARCH-01 / AC-05, AC-06, AC-12
  // Niveau : UI_MOCKED
  const { search, apiRequests } = await prepareSearch(page);

  for (let index = 1; index <= 13; index += 1) {
    await submitAndWait(search, page, `Sauvegarde ${index}`);
    await answerSavePrompt(page, search, `Nom ${index}`);
  }
  const expectedNames = Array.from({ length: 12 }, (_, index) => `Nom ${13 - index}`);
  const expectedQueries = Array.from({ length: 12 }, (_, index) => `Sauvegarde ${13 - index}`);
  await search.openHistory();

  await expect(search.savedSearchesList.locator('article')).toHaveCount(12);
  await expect(search.savedSearchesList.locator('article .saved-name')).toHaveText(expectedNames);
  await expect(search.savedSearchEntry('Nom 1', 'Sauvegarde 1')).toHaveCount(0);
  expect((await savedSearches(page)).map(({ name }) => name)).toEqual(expectedNames);
  expect((await savedSearches(page)).map(({ query }) => query)).toEqual(expectedQueries);
  expect(apiRequests).toHaveLength(13);
  expectNoApiWrites(apiRequests);
});

test('TC-SAVED-004 @regression restaure et lance la bonne recherche complète', async ({ page }) => {
  // Couvre US-SAVED-SEARCH-01 / AC-03, AC-04, AC-07, AC-11, AC-12
  // Niveau : UI_MOCKED
  const { search, apiRequests } = await prepareSearch(page);
  await search.showAdvancedFilters();
  await setCriteria(search, { postalCode: '75001', status: 'A', pageSize: '10' });
  await submitAndWait(search, page, 'Alpha');
  await answerSavePrompt(page, search, 'Veille Alpha');
  await setCriteria(search, { city: 'Lyon', status: 'C', pageSize: '25' });
  await submitAndWait(search, page, 'Bêta');
  await answerSavePrompt(page, search, 'Veille Bêta');
  await search.openHistory();

  const savedBeforeLaunch = await page.evaluate(() => localStorage.getItem('fce_saved'));
  const historyBeforeLaunch = await page.evaluate(() => localStorage.getItem('fce_history'));
  const requestsBeforeLaunch = apiRequests.length;
  const responsePromise = page.waitForResponse((response) => response.url().startsWith(API_URL));
  await search.savedSearchLaunchButton('Veille Alpha', 'Alpha').click();
  const response = await responsePromise;

  await expect(search.searchView).toBeVisible();
  await expect(search.queryInput).toHaveValue('Alpha');
  await expect(search.postalCodeFilter).toHaveValue('75001');
  await expect(search.cityFilter).toHaveValue('');
  await expect(search.statusFilter).toHaveValue('A');
  await expect(search.resultsPerPageFilter).toHaveValue('10');
  const requestUrl = new URL(response.url());
  expect(requestUrl.searchParams.get('page')).toBe('1');
  expect(apiRequests).toHaveLength(requestsBeforeLaunch + 1);
  expect(await page.evaluate(() => localStorage.getItem('fce_saved'))).toBe(savedBeforeLaunch);
  expect(await page.evaluate(() => localStorage.getItem('fce_history'))).not.toBe(
    historyBeforeLaunch,
  );
  expect(
    (await JSON.parse((await page.evaluate(() => localStorage.getItem('fce_history'))) ?? '[]'))[0],
  ).toMatchObject({ query: 'Alpha', postalCode: '75001', city: '', status: 'A' });
  expectNoApiWrites(apiRequests);
});

test('TC-SAVED-005 @regression persiste les sauvegardes après un vrai reload', async ({ page }) => {
  // Couvre US-SAVED-SEARCH-01 / AC-06, AC-08, AC-12
  // Niveau : UI_MOCKED
  const { search, apiRequests } = await prepareSearch(page);
  await submitAndWait(search, page, 'Alpha persistée');
  await answerSavePrompt(page, search, 'Nom Alpha persisté');
  await submitAndWait(search, page, 'Bêta persistée');
  await answerSavePrompt(page, search, 'Nom Bêta persisté');
  const storedBeforeReload = await page.evaluate(() => localStorage.getItem('fce_saved'));

  await search.clearSearchButton.click();
  apiRequests.length = 0;
  await page.reload();
  await search.openHistory();

  await expect(search.savedSearchesList.locator('article')).toHaveCount(2);
  await expect(search.savedSearchesList.locator('article .saved-name')).toHaveText([
    'Nom Bêta persisté',
    'Nom Alpha persisté',
  ]);
  await expect(search.savedSearchesList.locator('article small')).toHaveText([
    'Bêta persistée',
    'Alpha persistée',
  ]);
  expect(await page.evaluate(() => localStorage.getItem('fce_saved'))).toBe(storedBeforeReload);
  expect(apiRequests).toEqual([]);
});

test('TC-SAVED-006 @regression supprime uniquement la sauvegarde ciblée', async ({ page }) => {
  // Couvre US-SAVED-SEARCH-01 / AC-06, AC-09, AC-10, AC-11, AC-12
  // Niveau : UI_MOCKED
  // BUG-012 : le bouton × reste strictement scopé dans l’article fonctionnellement identifié.
  const { search, apiRequests } = await prepareSearch(page);
  await submitAndWait(search, page, 'Alpha suppression');
  await answerSavePrompt(page, search, 'Nom Alpha');
  await submitAndWait(search, page, 'Bêta suppression');
  await answerSavePrompt(page, search, 'Nom Bêta');
  const historySnapshot = await page.evaluate(() => localStorage.getItem('fce_history'));
  await search.openHistory();
  apiRequests.length = 0;

  await search.savedSearchDeleteButton('Nom Bêta', 'Bêta suppression').click();

  await expect(search.savedSearchEntry('Nom Bêta', 'Bêta suppression')).toHaveCount(0);
  await expect(search.savedSearchEntry('Nom Alpha', 'Alpha suppression')).toHaveCount(1);
  expect(projectSaved(await savedSearches(page))).toEqual([
    {
      name: 'Nom Alpha',
      query: 'Alpha suppression',
      postalCode: '',
      city: '',
      status: '',
      pageSize: 20,
    },
  ]);
  expect(await page.evaluate(() => localStorage.getItem('fce_history'))).toBe(historySnapshot);
  expect(apiRequests).toEqual([]);

  await search.savedSearchDeleteButton('Nom Alpha', 'Alpha suppression').click();
  expect(await savedSearches(page)).toEqual([]);
  await expect(search.savedSearchesList).toHaveText('Aucune recherche sauvegardée.');
  expect(await page.evaluate(() => localStorage.getItem('fce_history'))).toBe(historySnapshot);
  expect(apiRequests).toEqual([]);
  expectNoApiWrites(apiRequests);
});

test('TC-SAVED-007 @regression initialise proprement une collection absente ou vide', async ({
  browser,
}) => {
  // Couvre US-SAVED-SEARCH-01 / AC-10, AC-12
  // Niveau : UI_MOCKED
  const partitions = [
    await verifyEmptyPartition(browser, 'A — clé absente', false),
    await verifyEmptyPartition(browser, 'B — collection vide', true),
  ];
  expect(partitions).toEqual(['A — clé absente', 'B — collection vide']);
});

test.fixme('TC-SAVED-008 @regression BUG-011 refuse un nom composé uniquement d’espaces', async ({
  page,
}) => {
  // Couvre US-SAVED-SEARCH-01 / AC-01, AC-02, AC-11, AC-12
  // Niveau : UI_MOCKED
  // Défaut connu : defects/BUG-011-saved-search-allows-whitespace-only-name.md
  const { search, apiRequests } = await prepareSearch(page);
  await submitAndWait(search, page, 'Alpha espaces');
  const savedBeforeAttempt = await page.evaluate(() => localStorage.getItem('fce_saved'));
  const requestsBeforeAttempt = apiRequests.length;

  await answerSavePrompt(page, search, '   ');

  expect(await page.evaluate(() => localStorage.getItem('fce_saved'))).toBe(savedBeforeAttempt);
  expect(apiRequests).toHaveLength(requestsBeforeAttempt);
  expectNoApiWrites(apiRequests);
});

async function verifyEmptyPartition(browser: Browser, partition: string, initializeEmpty: boolean) {
  await test.step(partition, async () => {
    const context = await browser.newContext();
    await context.addInitScript((setEmpty) => {
      if (setEmpty) localStorage.setItem('fce_saved', '[]');
      else localStorage.removeItem('fce_saved');
    }, initializeEmpty);
    const page = await context.newPage();
    const apiRequests = trackApiRequests(page);
    await page.route(API_PATTERN, (route) => route.abort('blockedbyclient'));
    await page.goto(APP_URL);
    const search = new SearchPage(page);
    await search.openHistory();

    await expect(search.savedSearchesList).toHaveText('Aucune recherche sauvegardée.');
    await expect(search.savedSearchesList.locator('article')).toHaveCount(0);
    await expect(search.savedSearchesList).not.toContainText(
      /undefined|null|\[object Object\]|exception/i,
    );
    expect(apiRequests).toEqual([]);
    await context.close();
  });

  return partition;
}

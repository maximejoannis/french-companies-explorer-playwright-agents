import { expect, test, type Browser, type Page, type Route } from '@playwright/test';
import { mockedCompanies, mockedSearchResponse } from '../../../mocks/search-results';
import { SearchPage } from '../../pages/search.page';

const APP_URL = 'https://maximejoannis.github.io/french-companies-explorer-qa/';
const API_URL = 'https://recherche-entreprises.api.gouv.fr/search';
const API_PATTERN = `${API_URL}**`;
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

interface ApiRequest {
  method: string;
  url: string;
}

const pageTwoZulu = {
  ...mockedCompanies[0],
  siren: '700000001',
  nom_complet: 'ZULU DEEP LINK',
};
const pageTwoBeta = {
  ...mockedCompanies[1],
  siren: '700000002',
  nom_complet: 'BÊTA DEEP LINK',
};

function deepLink(parameters: Record<string, string>) {
  const url = new URL(APP_URL);
  Object.entries(parameters).forEach(([name, value]) => url.searchParams.set(name, value));
  return url.toString();
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

function currentUrlParameters(page: Page) {
  return new URL(page.url()).searchParams;
}

async function storedValues(page: Page, keys: string[]) {
  return page.evaluate((storageKeys) => {
    return Object.fromEntries(storageKeys.map((key) => [key, localStorage.getItem(key)]));
  }, keys);
}

test('TC-DEEP-LINK-001 @regression restaure un deep link complet', async ({ page }) => {
  // Couvre US-DEEP-LINKING-01 / AC-01, AC-02, AC-03, AC-04, AC-05, AC-10, AC-11, AC-12
  // Niveau : UI_MOCKED
  const independentStorage = {
    fce_favorites: JSON.stringify([{ siren: '111111111', name: 'Favori conservé' }]),
    fce_saved: JSON.stringify([
      {
        id: 1,
        name: 'Sauvegarde conservée',
        query: 'Conservée',
        postalCode: '',
        city: '',
        status: '',
        pageSize: 20,
      },
    ]),
    fce_compare: JSON.stringify([{ siren: '222222222', name: 'Comparaison conservée' }]),
  };
  await page.addInitScript((values) => {
    Object.entries(values).forEach(([key, value]) => localStorage.setItem(key, value));
  }, independentStorage);
  await page.route(API_PATTERN, (route) =>
    mockJson(route, {
      results: [pageTwoZulu, pageTwoBeta],
      total_results: 40,
      page: 2,
      per_page: 10,
      total_pages: 4,
    }),
  );
  const apiRequests = trackApiRequests(page);
  const responsePromise = page.waitForResponse((response) => response.url().startsWith(API_URL));

  await page.goto(
    deepLink({
      q: 'Alpha',
      cp: '75001',
      city: 'Lyon',
      status: 'A',
      page: '2',
      size: '10',
      sort: 'name-asc',
    }),
  );
  const response = await responsePromise;
  const search = new SearchPage(page);

  await expect(search.searchView).toBeVisible();
  await search.showAdvancedFilters();
  await expect(search.queryInput).toHaveValue('Alpha');
  await expect(search.postalCodeFilter).toHaveValue('75001');
  await expect(search.cityFilter).toHaveValue('Lyon');
  await expect(search.statusFilter).toHaveValue('A');
  await expect(search.resultsPerPageFilter).toHaveValue('10');
  await expect(search.sortSelect).toHaveValue('name-asc');
  await expect(search.pageLabel).toHaveText('Page 2 / 4');
  await expect.poll(() => search.visibleSirens()).toEqual([pageTwoBeta.siren, pageTwoZulu.siren]);

  const requestParameters = new URL(response.url()).searchParams;
  expect(Object.fromEntries(requestParameters)).toEqual({
    q: 'Alpha',
    page: '2',
    per_page: '10',
    code_postal: '75001',
    commune: 'Lyon',
    etat_administratif: 'A',
  });
  expect(requestParameters.has('sort')).toBe(false);
  expect(apiRequests).toHaveLength(1);
  const urlParameters = currentUrlParameters(page);
  expect(Object.fromEntries(urlParameters)).toEqual({
    q: 'Alpha',
    cp: '75001',
    city: 'Lyon',
    status: 'A',
    page: '2',
    size: '10',
    sort: 'name-asc',
  });
  expect(await storedValues(page, Object.keys(independentStorage))).toEqual(independentStorage);
  const history = JSON.parse(
    (await page.evaluate(() => localStorage.getItem('fce_history'))) ?? '[]',
  ) as Array<Record<string, unknown>>;
  expect(history[0]).toMatchObject({
    query: 'Alpha',
    postalCode: '75001',
    city: 'Lyon',
    status: 'A',
  });
  expectNoApiWrites(apiRequests);
});

test('TC-DEEP-LINK-002 @regression synchronise et retire les paramètres après interaction', async ({
  page,
}) => {
  // Couvre US-DEEP-LINKING-01 / AC-06, AC-10, AC-12
  // Niveau : UI_MOCKED
  await page.route(API_PATTERN, (route) =>
    mockJson(route, {
      ...mockedSearchResponse,
      total_results: 30,
      page: Number(new URL(route.request().url()).searchParams.get('page')),
      per_page: 10,
      total_pages: 3,
    }),
  );
  const apiRequests = trackApiRequests(page);
  const search = new SearchPage(page);
  await search.goto();
  await search.showAdvancedFilters();
  await search.postalCodeFilter.fill('75001');
  await search.cityFilter.fill('Lyon');
  await search.statusFilter.selectOption('C');
  await search.resultsPerPageFilter.selectOption('10');
  const initialResponse = page.waitForResponse((response) => response.url().startsWith(API_URL));
  await search.submit('Synchronisation URL');
  await initialResponse;
  await expect(search.companyCard(mockedCompanies[0].siren)).toBeVisible();

  let urlParameters = currentUrlParameters(page);
  expect(Object.fromEntries(urlParameters)).toEqual({
    q: 'Synchronisation URL',
    cp: '75001',
    city: 'Lyon',
    status: 'C',
    size: '10',
  });
  expect(urlParameters.has('page')).toBe(false);
  expect(urlParameters.has('sort')).toBe(false);

  const requestsBeforeSort = apiRequests.length;
  await search.selectSort('name-desc');
  await expect(page).toHaveURL((url) => url.searchParams.get('sort') === 'name-desc');
  expect(apiRequests).toHaveLength(requestsBeforeSort);

  const secondPageResponse = page.waitForResponse((response) => response.url().startsWith(API_URL));
  await search.nextPageButton.click();
  await secondPageResponse;
  await expect(search.pageLabel).toHaveText('Page 2 / 3');
  urlParameters = currentUrlParameters(page);
  expect(urlParameters.get('page')).toBe('2');
  expect(urlParameters.get('sort')).toBe('name-desc');

  const requestsBeforeReset = apiRequests.length;
  await search.clearSearchButton.click();
  await expect(page).toHaveURL((url) => url.search === '');
  await expect(search.queryInput).toHaveValue('');
  await expect(search.postalCodeFilter).toHaveValue('');
  await expect(search.cityFilter).toHaveValue('');
  await expect(search.statusFilter).toHaveValue('');
  await expect(search.resultsPerPageFilter).toHaveValue('20');
  await expect(search.sortSelect).toHaveValue('relevance');
  await expect(search.pagination).toBeHidden();
  expect(apiRequests).toHaveLength(requestsBeforeReset);
  expect(apiRequests).toHaveLength(2);
  expect(apiRequests.map(({ method }) => method)).toEqual(['GET', 'GET']);
  expectNoApiWrites(apiRequests);
});

test('TC-DEEP-LINK-003 @regression conserve un état initial propre sans requête', async ({
  browser,
}) => {
  // Couvre US-DEEP-LINKING-01 / AC-08, AC-09, AC-10, AC-11
  // Niveau : UI_MOCKED
  const partitions = [
    await verifyInitialPartition(browser, 'A — URL vide', APP_URL, null),
    await verifyInitialPartition(
      browser,
      'B — paramètre inconnu sans q',
      deepLink({ source: 'partage' }),
      'partage',
    ),
  ];
  expect(partitions).toEqual(['A — URL vide', 'B — paramètre inconnu sans q']);
});

test('TC-DEEP-LINK-004 @regression nettoie les options invalides et paramètres inconnus', async ({
  page,
}) => {
  // Couvre US-DEEP-LINKING-01 / AC-01, AC-02, AC-04, AC-05, AC-09, AC-10, AC-12
  // Niveau : UI_MOCKED
  await page.route(API_PATTERN, (route) => mockJson(route, mockedSearchResponse));
  const apiRequests = trackApiRequests(page);
  const responsePromise = page.waitForResponse((response) => response.url().startsWith(API_URL));

  await page.goto(
    deepLink({
      q: 'Alpha',
      size: '999',
      sort: 'ordre-inconnu',
      status: 'X',
      source: 'partage',
    }),
  );
  const response = await responsePromise;
  const search = new SearchPage(page);
  await expect(search.companyCard(mockedCompanies[0].siren)).toBeVisible();

  await search.showAdvancedFilters();
  await expect(search.queryInput).toHaveValue('Alpha');
  await expect(search.resultsPerPageFilter).toHaveValue('20');
  await expect(search.sortSelect).toHaveValue('relevance');
  await expect(search.statusFilter).toHaveValue('');
  await expect(search.pageLabel).toHaveText('Page 1 / 1');
  const requestParameters = new URL(response.url()).searchParams;
  expect(Object.fromEntries(requestParameters)).toEqual({
    q: 'Alpha',
    page: '1',
    per_page: '20',
  });
  expect(requestParameters.has('etat_administratif')).toBe(false);
  expect(requestParameters.has('sort')).toBe(false);
  expect(apiRequests).toHaveLength(1);
  expect(Object.fromEntries(currentUrlParameters(page))).toEqual({ q: 'Alpha' });
  expectNoApiWrites(apiRequests);
});

test('TC-DEEP-LINK-005 @regression valide une requête URL avant tout appel API', async ({
  page,
}) => {
  // Couvre US-DEEP-LINKING-01 / AC-01, AC-02, AC-09, AC-10, AC-11
  // Niveau : UI_MOCKED
  const initialStorage = {
    fce_history: JSON.stringify([
      { query: 'Historique conservé', postalCode: '', city: '', status: '', at: 'initial' },
    ]),
    fce_saved: JSON.stringify([{ id: 1, name: 'Sauvegarde conservée', query: 'Conservée' }]),
  };
  await page.addInitScript((values) => {
    Object.entries(values).forEach(([key, value]) => localStorage.setItem(key, value));
  }, initialStorage);
  const apiRequests = trackApiRequests(page);
  await page.route(API_PATTERN, (route) => route.abort('blockedbyclient'));

  await page.goto(deepLink({ q: '12345678', cp: '75001' }));
  const search = new SearchPage(page);

  await expect(search.searchView).toBeVisible();
  await search.showAdvancedFilters();
  await expect(search.queryInput).toHaveValue('12345678');
  await expect(search.postalCodeFilter).toHaveValue('75001');
  await expect(search.searchState).toHaveText(
    'Identifiant invalide : un SIREN contient 9 chiffres et un SIRET 14 chiffres',
  );
  await expect(search.resultsGrid).toBeEmpty();
  expect(apiRequests).toEqual([]);
  expect(Object.fromEntries(currentUrlParameters(page))).toEqual({
    q: '12345678',
    cp: '75001',
  });
  expect(await storedValues(page, Object.keys(initialStorage))).toEqual(initialStorage);
});

test.fixme('TC-DEEP-LINK-006 @regression BUG-014 normalise une page URL non numérique', async ({
  page,
}) => {
  // Couvre US-DEEP-LINKING-01 / AC-01, AC-03, AC-09, AC-10, AC-12
  // Niveau : UI_MOCKED
  // Défaut connu : defects/BUG-014-deep-link-invalid-page-produces-nan.md
  await page.route(API_PATTERN, (route) =>
    mockJson(route, {
      ...mockedSearchResponse,
      total_results: 40,
      page: 1,
      per_page: 20,
      total_pages: 2,
    }),
  );
  const apiRequests = trackApiRequests(page);
  const responsePromise = page.waitForResponse((response) => response.url().startsWith(API_URL));

  await page.goto(deepLink({ q: 'Alpha', page: 'abc' }));
  const response = await responsePromise;
  const search = new SearchPage(page);

  expect(new URL(response.url()).searchParams.get('page')).toBe('1');
  expect(currentUrlParameters(page).has('page')).toBe(false);
  await expect(search.pageLabel).toHaveText('Page 1 / 2');
  await expect(search.pagination).not.toContainText('NaN');
  expect(apiRequests).toHaveLength(1);
  expectNoApiWrites(apiRequests);
});

async function verifyInitialPartition(
  browser: Browser,
  partition: string,
  url: string,
  expectedSource: string | null,
) {
  await test.step(partition, async () => {
    const initialStorage = { fce_saved: JSON.stringify([{ id: 1, name: 'Conservée' }]) };
    const context = await browser.newContext();
    try {
      await context.addInitScript((values) => {
        Object.entries(values).forEach(([key, value]) => localStorage.setItem(key, value));
      }, initialStorage);
      const page = await context.newPage();
      const apiRequests = trackApiRequests(page);
      await page.route(API_PATTERN, (route) => route.abort('blockedbyclient'));

      await page.goto(url);
      const search = new SearchPage(page);

      await expect(page.locator('#homeView')).toBeVisible();
      await search.searchNavigationButton.click();
      await search.showAdvancedFilters();
      await expect(search.queryInput).toHaveValue('');
      await expect(search.postalCodeFilter).toHaveValue('');
      await expect(search.cityFilter).toHaveValue('');
      await expect(search.statusFilter).toHaveValue('');
      await expect(search.resultsPerPageFilter).toHaveValue('20');
      await expect(search.sortSelect).toHaveValue('relevance');
      await expect(page.locator('body')).not.toContainText(
        /undefined|null|\[object Object\]|exception/i,
      );
      expect(apiRequests).toEqual([]);
      expect(currentUrlParameters(page).get('source')).toBe(expectedSource);
      expect(await storedValues(page, Object.keys(initialStorage))).toEqual(initialStorage);
    } finally {
      await context.close();
    }
  });

  return partition;
}

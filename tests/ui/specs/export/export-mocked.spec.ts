import { readFile } from 'node:fs/promises';
import { expect, test, type Locator, type Page, type Route } from '@playwright/test';
import { alphaCompany, betaCompany } from '../../../mocks/detail-results';
import {
  emptySearchResponse,
  mockedCompanies,
  mockedSearchResponse,
} from '../../../mocks/search-results';
import { SearchPage } from '../../pages/search.page';

const API_URL = 'https://recherche-entreprises.api.gouv.fr/search';
const API_PATTERN = `${API_URL}**`;
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
const CSV_HEADERS = [
  'SIREN',
  'Nom',
  'Statut',
  'Activité',
  'Ville',
  'Code postal',
  'Création',
  'SIRET siège',
];

interface ApiRequest {
  method: string;
  url: string;
}

interface ExportedCompany {
  siren: string;
  name: string;
  activity: string;
  activityLabel: string;
  status: string;
  creation: string;
  legal: string;
  category: string;
  workforce: string;
  siret: string;
  address: string;
  postalCode: string;
  city: string;
  matchingEstablishments: unknown[];
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

async function submitAndWait(search: SearchPage, page: Page, query: string) {
  const responsePromise = page.waitForResponse((response) => response.url().startsWith(API_URL));
  await search.submit(query);
  await responsePromise;
}

async function downloadText(page: Page, button: Locator, expectedFilename: string) {
  const downloadPromise = page.waitForEvent('download');
  await button.click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe(expectedFilename);
  const downloadPath = await download.path();
  if (downloadPath === null) throw new Error(`Chemin indisponible pour ${expectedFilename}`);
  return readFile(downloadPath, 'utf8');
}

function parseCsv(textWithoutBom: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;

  for (let index = 0; index < textWithoutBom.length; index += 1) {
    const character = textWithoutBom[index];
    if (quoted) {
      if (character === '"' && textWithoutBom[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"') {
      quoted = true;
    } else if (character === ';') {
      row.push(cell);
      cell = '';
    } else if (character === '\n') {
      row.push(cell);
      rows.push(row);
      row = [];
      cell = '';
    } else if (character !== '\r') {
      cell += character;
    }
  }

  if (cell !== '' || row.length > 0) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

async function localStorageSnapshot(page: Page) {
  return page.evaluate(() =>
    Object.fromEntries(
      Object.keys(localStorage)
        .sort()
        .map((key) => [key, localStorage.getItem(key)]),
    ),
  );
}

test('TC-EXPORT-001 @regression exporte la représentation JSON normalisée', async ({ page }) => {
  // Couvre US-EXPORT-01 / AC-01, AC-02, AC-08, AC-09, AC-10, AC-11
  // Niveau : UI_MOCKED
  const response = { results: [alphaCompany, betaCompany], total_results: 2 };
  await page.route(API_PATTERN, (route) => mockJson(route, response));
  const apiRequests = trackApiRequests(page);
  const search = new SearchPage(page);
  await search.goto();
  await submitAndWait(search, page, 'export normalisé');
  await expect(search.companyCard(alphaCompany.siren)).toBeVisible();
  await expect(search.exportJsonButton).toBeVisible();
  await expect(search.exportJsonButton).toBeEnabled();
  await expect(search.exportCsvButton).toBeVisible();
  await expect(search.exportCsvButton).toBeEnabled();
  const storageBeforeExport = await localStorageSnapshot(page);
  const requestsBeforeExport = apiRequests.length;

  const text = await downloadText(page, search.exportJsonButton, 'companies-results.json');
  const exported: unknown = JSON.parse(text);

  expect(Array.isArray(exported)).toBe(true);
  expect(exported).toEqual([
    {
      siren: alphaCompany.siren,
      name: alphaCompany.nom_complet,
      activity: alphaCompany.activite_principale,
      activityLabel: alphaCompany.libelle_activite_principale,
      status: alphaCompany.etat_administratif,
      creation: alphaCompany.date_creation,
      legal: alphaCompany.nature_juridique,
      category: alphaCompany.categorie_entreprise,
      workforce: alphaCompany.tranche_effectif_salarie,
      siret: alphaCompany.siege?.siret,
      address: alphaCompany.siege?.adresse,
      postalCode: alphaCompany.siege?.code_postal,
      city: alphaCompany.siege?.libelle_commune,
      matchingEstablishments: alphaCompany.matching_etablissements,
    },
    {
      siren: betaCompany.siren,
      name: betaCompany.nom_complet,
      activity: betaCompany.activite_principale,
      activityLabel: betaCompany.libelle_activite_principale,
      status: betaCompany.etat_administratif,
      creation: betaCompany.date_creation,
      legal: betaCompany.nature_juridique,
      category: betaCompany.categorie_entreprise,
      workforce: betaCompany.tranche_effectif_salarie,
      siret: betaCompany.siege?.siret,
      address: betaCompany.siege?.adresse,
      postalCode: betaCompany.siege?.code_postal,
      city: betaCompany.siege?.libelle_commune,
      matchingEstablishments: betaCompany.matching_etablissements,
    },
  ]);
  expect(Object.keys((exported as ExportedCompany[])[0]).sort()).toEqual(
    [
      'siren',
      'name',
      'activity',
      'activityLabel',
      'status',
      'creation',
      'legal',
      'category',
      'workforce',
      'siret',
      'address',
      'postalCode',
      'city',
      'matchingEstablishments',
    ].sort(),
  );
  await expect(search.queryInput).toHaveValue('export normalisé');
  expect(await localStorageSnapshot(page)).toEqual(storageBeforeExport);
  expect(apiRequests).toHaveLength(requestsBeforeExport);
  expectNoApiWrites(apiRequests);
});

test('TC-EXPORT-002 @regression produit un CSV structuré et correctement associé', async ({
  page,
}) => {
  // Couvre US-EXPORT-01 / AC-01, AC-03, AC-08, AC-09, AC-10, AC-11
  // Niveau : UI_MOCKED
  await page.route(API_PATTERN, (route) => mockJson(route, mockedSearchResponse));
  const apiRequests = trackApiRequests(page);
  const search = new SearchPage(page);
  await search.goto();
  await submitAndWait(search, page, 'export tabulaire');
  await expect(search.companyCard(mockedCompanies[0].siren)).toBeVisible();
  const requestsBeforeExport = apiRequests.length;

  const text = await downloadText(page, search.exportCsvButton, 'companies-results.csv');

  expect(text.startsWith('\uFEFF')).toBe(true);
  const rows = parseCsv(text.slice(1));
  expect(rows).toHaveLength(3);
  expect(rows[0]).toEqual(CSV_HEADERS);
  expect(rows.every((row) => row.length === 8)).toBe(true);
  expect(rows.slice(1)).toEqual(
    mockedCompanies.map((company) => [
      company.siren,
      company.nom_complet,
      company.etat_administratif,
      company.libelle_activite_principale,
      company.siege.libelle_commune,
      company.siege.code_postal,
      company.date_creation,
      company.siege.siret,
    ]),
  );
  expect(apiRequests).toHaveLength(requestsBeforeExport);
  expectNoApiWrites(apiRequests);
});

test('TC-EXPORT-003 @regression échappe les caractères complexes et neutralise les formules', async ({
  page,
}) => {
  // Couvre US-EXPORT-01 / AC-04, AC-05, AC-08, AC-09, AC-10
  // Niveau : UI_MOCKED
  const specialCompany = {
    siren: '900000001',
    nom_complet: '=FORMULE, "nom"\nseconde ligne',
    etat_administratif: '+ACTIF',
    libelle_activite_principale: '  -Activité; spéciale',
    date_creation: '@2024-01-01',
    siege: {
      siret: '90000000100019',
      code_postal: '75001',
      libelle_commune: 'Ville normale',
    },
  };
  await page.route(API_PATTERN, (route) =>
    mockJson(route, { results: [specialCompany], total_results: 1 }),
  );
  const apiRequests = trackApiRequests(page);
  const search = new SearchPage(page);
  await search.goto();
  await submitAndWait(search, page, 'export sécurité');
  await expect(search.companyCard(specialCompany.siren)).toBeVisible();
  const requestsBeforeExport = apiRequests.length;

  const text = await downloadText(page, search.exportCsvButton, 'companies-results.csv');
  const rows = parseCsv(text.slice(1));

  expect(rows).toHaveLength(2);
  expect(rows.every((row) => row.length === 8)).toBe(true);
  expect(rows[1]).toEqual([
    '900000001',
    '\'=FORMULE, "nom"\nseconde ligne',
    "'+ACTIF",
    "'  -Activité; spéciale",
    'Ville normale',
    '75001',
    "'@2024-01-01",
    '90000000100019',
  ]);
  expect(text).toContain('"\'=FORMULE, ""nom""\nseconde ligne"');
  expect(rows[1][4]).toBe('Ville normale');
  expect(apiRequests).toHaveLength(requestsBeforeExport);
  expectNoApiWrites(apiRequests);
});

test('TC-EXPORT-004 @regression exporte uniquement la page courante dans l’ordre du tri', async ({
  page,
}) => {
  // Couvre US-EXPORT-01 / AC-06, AC-08, AC-09, AC-10, AC-11
  // Niveau : UI_MOCKED
  const pageOneAlpha = { ...mockedCompanies[0], nom_complet: 'ALPHA PAGE 1' };
  const pageTwoZulu = { ...mockedCompanies[1], siren: '800000001', nom_complet: 'ZULU PAGE 2' };
  const pageTwoBeta = { ...mockedCompanies[0], siren: '800000002', nom_complet: 'BÊTA PAGE 2' };
  const apiRequests = trackApiRequests(page);
  await page.route(API_PATTERN, (route) => {
    const requestedPage = new URL(route.request().url()).searchParams.get('page');
    return mockJson(route, {
      results: requestedPage === '2' ? [pageTwoZulu, pageTwoBeta] : [pageOneAlpha],
      total_results: 40,
      page: Number(requestedPage),
      per_page: 20,
      total_pages: 2,
    });
  });
  const search = new SearchPage(page);
  await search.goto();
  await submitAndWait(search, page, 'export paginé');
  await expect(search.companyCard(pageOneAlpha.siren)).toBeVisible();
  const secondPageResponse = page.waitForResponse((response) => response.url().startsWith(API_URL));
  await search.nextPageButton.click();
  await secondPageResponse;
  await expect(search.companyCard(pageTwoZulu.siren)).toBeVisible();
  const requestsBeforeSortAndExports = apiRequests.length;

  await search.selectSort('name-asc');
  await expect.poll(() => search.visibleSirens()).toEqual([pageTwoBeta.siren, pageTwoZulu.siren]);
  const storageBeforeExports = await localStorageSnapshot(page);
  const jsonText = await downloadText(page, search.exportJsonButton, 'companies-results.json');
  const csvText = await downloadText(page, search.exportCsvButton, 'companies-results.csv');
  const jsonCompanies = JSON.parse(jsonText) as ExportedCompany[];
  const csvRows = parseCsv(csvText.slice(1));

  expect(jsonCompanies.map(({ siren }) => siren)).toEqual([pageTwoBeta.siren, pageTwoZulu.siren]);
  expect(jsonCompanies.map(({ siren }) => siren)).not.toContain(pageOneAlpha.siren);
  expect(csvRows.slice(1).map((row) => row[0])).toEqual([pageTwoBeta.siren, pageTwoZulu.siren]);
  expect(csvRows.slice(1).map((row) => row[0])).not.toContain(pageOneAlpha.siren);
  await expect(search.pageLabel).toHaveText('Page 2 / 2');
  await expect(search.sortSelect).toHaveValue('name-asc');
  expect(await localStorageSnapshot(page)).toEqual(storageBeforeExports);
  expect(apiRequests).toHaveLength(requestsBeforeSortAndExports);
  expectNoApiWrites(apiRequests);
});

test('TC-EXPORT-005 @regression produit des fichiers vides mais exploitables', async ({ page }) => {
  // Couvre US-EXPORT-01 / AC-07, AC-08, AC-09, AC-10, AC-11
  // Niveau : UI_MOCKED
  await page.route(API_PATTERN, (route) => mockJson(route, emptySearchResponse));
  const apiRequests = trackApiRequests(page);
  const search = new SearchPage(page);
  await search.goto();
  await submitAndWait(search, page, 'export vide');
  await expect(search.searchState).toHaveText('Aucune entreprise ne correspond à cette recherche.');
  await expect(search.resultsGrid).toBeEmpty();
  await expect(search.exportJsonButton).toBeVisible();
  await expect(search.exportJsonButton).toBeEnabled();
  await expect(search.exportCsvButton).toBeVisible();
  await expect(search.exportCsvButton).toBeEnabled();
  const requestsBeforeExports = apiRequests.length;

  const jsonText = await downloadText(page, search.exportJsonButton, 'companies-results.json');
  const csvText = await downloadText(page, search.exportCsvButton, 'companies-results.csv');

  expect(JSON.parse(jsonText)).toEqual([]);
  expect(csvText.startsWith('\uFEFF')).toBe(true);
  expect(parseCsv(csvText.slice(1))).toEqual([CSV_HEADERS]);
  await expect(search.searchState).not.toContainText(/erreur|exception/i);
  expect(apiRequests).toHaveLength(requestsBeforeExports);
  expectNoApiWrites(apiRequests);
});

test.fixme('TC-EXPORT-006 @regression BUG-013 refuse d’exporter une collection précédente', async ({
  page,
}) => {
  // Couvre US-EXPORT-01 / AC-01, AC-06, AC-08, AC-09, AC-11
  // Niveau : UI_MOCKED
  // Défaut connu : defects/BUG-013-export-keeps-stale-results-during-loading-or-error.md
  let requestIndex = 0;
  let signalSecondRequest: (() => void) | undefined;
  const secondRequestReceived = new Promise<void>((resolve) => {
    signalSecondRequest = resolve;
  });
  let releaseBeta: (() => void) | undefined;
  const betaCanResolve = new Promise<void>((resolve) => {
    releaseBeta = resolve;
  });
  const apiRequests = trackApiRequests(page);
  await page.route(API_PATTERN, async (route) => {
    requestIndex += 1;
    if (requestIndex === 2) {
      signalSecondRequest?.();
      await betaCanResolve;
      await mockJson(route, { results: [betaCompany], total_results: 1 });
      return;
    }
    await mockJson(route, { results: [alphaCompany], total_results: 1 });
  });
  const search = new SearchPage(page);
  await search.goto();
  await submitAndWait(search, page, 'Alpha export');
  await expect(search.companyCard(alphaCompany.siren)).toBeVisible();

  await search.submit('Bêta export');
  await secondRequestReceived;
  await expect(search.searchState).toHaveText('Recherche en cours…');
  await expect(search.resultsGrid).toBeEmpty();
  await expect(search.companyCard(alphaCompany.siren)).toHaveCount(0);
  await expect(search.exportJsonButton).toBeEnabled();
  const jsonText = await downloadText(page, search.exportJsonButton, 'companies-results.json');
  const exported = JSON.parse(jsonText) as ExportedCompany[];
  releaseBeta?.();

  expect(apiRequests).toHaveLength(2);
  expectNoApiWrites(apiRequests);
  expect(exported.map(({ siren }) => siren)).not.toContain(alphaCompany.siren);
});

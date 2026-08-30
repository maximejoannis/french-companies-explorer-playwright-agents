import { expect, test, type Browser, type Page, type Route } from '@playwright/test';
import {
  alphaCompareCompany,
  betaCompareCompany,
  compareSearchResponse,
  deltaCompareCompany,
  gammaCompareCompany,
  type CompareCompany,
} from '../../../mocks/compare-results';
import { SearchPage } from '../../pages/search.page';

const APP_URL = 'https://maximejoannis.github.io/french-companies-explorer-qa/';
const API_URL = 'https://recherche-entreprises.api.gouv.fr/search';
const API_PATTERN = `${API_URL}**`;
const WRITE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

async function mockJson(route: Route, body: unknown) {
  await route.fulfill({ status: 200, contentType: 'application/json', json: body });
}

function trackApiRequests(page: Page) {
  const requests: string[] = [];
  page.on('request', (request) => {
    if (request.url().startsWith(API_URL)) requests.push(request.method());
  });
  return requests;
}

async function compareSirens(page: Page) {
  return page.evaluate(() => {
    const stored = localStorage.getItem('fce_compare');
    if (stored === null) return [];

    const companies: unknown = JSON.parse(stored);
    if (!Array.isArray(companies)) return [];

    return companies.flatMap((company: unknown) => {
      if (typeof company !== 'object' || company === null || !('siren' in company)) return [];
      return typeof company.siren === 'string' ? [company.siren] : [];
    });
  });
}

function expectNoCompareApiActivity(requests: string[], countBefore: number) {
  expect(requests).toHaveLength(countBefore);
  expect(requests.filter((method) => WRITE_METHODS.has(method))).toEqual([]);
}

async function prepareSearch(page: Page) {
  await page.route(API_PATTERN, (route) => mockJson(route, compareSearchResponse));
  const apiRequests = trackApiRequests(page);
  const search = new SearchPage(page);
  await search.goto();
  expect(await page.evaluate(() => localStorage.getItem('fce_compare'))).toBeNull();
  await search.submit('comparaison synthétique');
  await expect(search.companyCard(alphaCompareCompany.siren)).toBeVisible();
  await expect(search.companyCard(deltaCompareCompany.siren)).toBeVisible();
  return { search, apiRequests };
}

async function addFromResults(search: SearchPage, companies: CompareCompany[]) {
  for (const company of companies) {
    await search.companyCompareButton(company.siren).click();
  }
}

async function expectCompanyPanel(search: SearchPage, company: CompareCompany) {
  const panel = search.comparePanel(company.siren);
  await expect(panel).toHaveCount(1);
  await expect(panel).toContainText(company.nom_complet);
  await expect(panel).toContainText(`SIREN ${company.siren}`);
}

const expectedRows = new Map<CompareCompany, Record<string, string>>([
  [
    alphaCompareCompany,
    {
      SIREN: alphaCompareCompany.siren,
      Statut: 'En activité',
      Activité: alphaCompareCompany.libelle_activite_principale!,
      Ville: alphaCompareCompany.siege!.libelle_commune!,
      'Code postal': alphaCompareCompany.siege!.code_postal!,
      Création: alphaCompareCompany.date_creation!,
      Catégorie: alphaCompareCompany.categorie_entreprise!,
      Effectif: alphaCompareCompany.tranche_effectif_salarie!,
    },
  ],
  [
    betaCompareCompany,
    {
      SIREN: betaCompareCompany.siren,
      Statut: 'Cessée',
      Activité: betaCompareCompany.libelle_activite_principale!,
      Ville: betaCompareCompany.siege!.libelle_commune!,
      'Code postal': betaCompareCompany.siege!.code_postal!,
      Création: betaCompareCompany.date_creation!,
      Catégorie: betaCompareCompany.categorie_entreprise!,
      Effectif: betaCompareCompany.tranche_effectif_salarie!,
    },
  ],
  [
    gammaCompareCompany,
    {
      SIREN: gammaCompareCompany.siren,
      Statut: 'En activité',
      Activité: gammaCompareCompany.libelle_activite_principale!,
      Ville: gammaCompareCompany.siege!.libelle_commune!,
      'Code postal': gammaCompareCompany.siege!.code_postal!,
      Création: gammaCompareCompany.date_creation!,
      Catégorie: gammaCompareCompany.categorie_entreprise!,
      Effectif: gammaCompareCompany.tranche_effectif_salarie!,
    },
  ],
]);
const OPTIONAL_COMPARE_ROWS = [
  'Statut',
  'Activité',
  'Ville',
  'Code postal',
  'Création',
  'Catégorie',
  'Effectif',
];

async function expectComparisonValues(search: SearchPage, companies: CompareCompany[]) {
  for (const company of companies) {
    const rows = expectedRows.get(company);
    if (rows === undefined) throw new Error(`Valeurs Compare manquantes : ${company.siren}`);
    for (const [label, value] of Object.entries(rows)) {
      await expect(await search.compareCell(label, company.nom_complet)).toHaveText(value);
    }
  }
}

test('TC-COMPARE-001 @positive sélectionne uniquement Alpha sans doublon', async ({ page }) => {
  // Couvre US-COMPARE-01 / AC-01, AC-03, AC-04, AC-12
  // Niveau : UI_MOCKED
  const { search, apiRequests } = await prepareSearch(page);
  const requestsBeforeCompareActions = apiRequests.length;

  await search.companyCompareButton(alphaCompareCompany.siren).click();
  await expect(search.toast).toHaveText('Ajoutée à la comparaison.');
  await search.openCompare();
  await expectCompanyPanel(search, alphaCompareCompany);
  await expect(search.comparePanel(betaCompareCompany.siren)).toHaveCount(0);
  await expect(search.compareView).toContainText('Ajoute une seconde entreprise.');
  await expect.poll(() => compareSirens(page)).toEqual([alphaCompareCompany.siren]);

  await search.openSearch();
  await search.companyCompareButton(alphaCompareCompany.siren).click();
  await expect(search.toast).toHaveText('Déjà dans la comparaison.');
  await expectCompanyPanel(search, alphaCompareCompany);
  await expect.poll(() => compareSirens(page)).toEqual([alphaCompareCompany.siren]);
  expectNoCompareApiActivity(apiRequests, requestsBeforeCompareActions);
});

test('TC-COMPARE-002 @positive unifie les surfaces et refuse une quatrième entreprise', async ({
  page,
}) => {
  // Couvre US-COMPARE-01 / AC-01, AC-03, AC-05, AC-06, AC-08, AC-12
  // Niveau : UI_MOCKED
  const { search, apiRequests } = await prepareSearch(page);
  const requestsBeforeCompareActions = apiRequests.length;

  await search.companyCompareButton(alphaCompareCompany.siren).click();
  await search.openCompanyDetail(betaCompareCompany.siren);
  await search.detailCompareButton().click();
  await search.backToResults();
  await search.companyFavoriteButton(gammaCompareCompany.siren).click();
  await search.openFavorites();
  await search.favoriteCardCompareButton(gammaCompareCompany.siren).click();
  await search.openCompare();

  for (const company of [alphaCompareCompany, betaCompareCompany, gammaCompareCompany]) {
    await expectCompanyPanel(search, company);
  }
  await expect
    .poll(() => compareSirens(page))
    .toEqual([alphaCompareCompany.siren, betaCompareCompany.siren, gammaCompareCompany.siren]);

  await search.openSearch();
  await search.companyCompareButton(deltaCompareCompany.siren).click();
  await expect(search.toast).toHaveText('La comparaison est limitée à trois entreprises.');
  await expect(search.comparePanel(deltaCompareCompany.siren)).toHaveCount(0);
  for (const company of [alphaCompareCompany, betaCompareCompany, gammaCompareCompany]) {
    await expectCompanyPanel(search, company);
  }
  await expect
    .poll(() => compareSirens(page))
    .toEqual([alphaCompareCompany.siren, betaCompareCompany.siren, gammaCompareCompany.siren]);
  expectNoCompareApiActivity(apiRequests, requestsBeforeCompareActions);
});

test('TC-COMPARE-003 @regression associe les colonnes et retire uniquement Bêta', async ({
  page,
}) => {
  // Couvre US-COMPARE-01 / AC-02, AC-03, AC-07, AC-08
  // Niveau : UI_MOCKED
  const { search, apiRequests } = await prepareSearch(page);
  await addFromResults(search, [alphaCompareCompany, betaCompareCompany, gammaCompareCompany]);
  const requestsBeforeRemoval = apiRequests.length;
  await search.openCompare();

  for (const company of [alphaCompareCompany, betaCompareCompany, gammaCompareCompany]) {
    await expectCompanyPanel(search, company);
  }
  await expectComparisonValues(search, [
    alphaCompareCompany,
    betaCompareCompany,
    gammaCompareCompany,
  ]);

  await search.compareRemoveButton(betaCompareCompany.siren).click();
  await expect(search.comparePanel(betaCompareCompany.siren)).toHaveCount(0);
  await expectCompanyPanel(search, alphaCompareCompany);
  await expectCompanyPanel(search, gammaCompareCompany);
  await expect(search.compareTable.locator('thead th')).toHaveText([
    'Critère',
    alphaCompareCompany.nom_complet,
    gammaCompareCompany.nom_complet,
  ]);
  await expectComparisonValues(search, [alphaCompareCompany, gammaCompareCompany]);
  await expect
    .poll(() => compareSirens(page))
    .toEqual([alphaCompareCompany.siren, gammaCompareCompany.siren]);
  expectNoCompareApiActivity(apiRequests, requestsBeforeRemoval);
});

test('TC-COMPARE-004 @regression restaure la sélection après un vrai reload sans API', async ({
  page,
}) => {
  // Couvre US-COMPARE-01 / AC-03, AC-09, AC-12
  // Niveau : UI_MOCKED
  const { search, apiRequests } = await prepareSearch(page);
  await addFromResults(search, [alphaCompareCompany, betaCompareCompany]);
  await expect
    .poll(() => compareSirens(page))
    .toEqual([alphaCompareCompany.siren, betaCompareCompany.siren]);

  await search.clearSearchButton.click();
  apiRequests.length = 0;
  await page.reload();
  await search.openCompare();

  await expectCompanyPanel(search, alphaCompareCompany);
  await expectCompanyPanel(search, betaCompareCompany);
  await expectComparisonValues(search, [alphaCompareCompany, betaCompareCompany]);
  await expect
    .poll(() => compareSirens(page))
    .toEqual([alphaCompareCompany.siren, betaCompareCompany.siren]);
  expect(apiRequests).toEqual([]);
});

test('TC-COMPARE-005 @regression initialise une comparaison absente ou vide', async ({
  browser,
}) => {
  // Couvre US-COMPARE-01 / AC-10, AC-12
  // Niveau : UI_MOCKED
  const verifiedPartitions = [
    await verifyEmptyComparePartition(browser, 'clé absente', () =>
      localStorage.removeItem('fce_compare'),
    ),
    await verifyEmptyComparePartition(browser, 'liste vide', () =>
      localStorage.setItem('fce_compare', '[]'),
    ),
  ];
  expect(verifiedPartitions).toEqual(['clé absente', 'liste vide']);
});

test.fixme('TC-COMPARE-006 @regression BUG-008 neutralise les valeurs absentes', async ({
  page,
}) => {
  // Couvre US-COMPARE-01 / AC-07, AC-11
  // Niveau : UI_MOCKED
  // Défaut connu : defects/BUG-008-missing-status-shown-as-closed-in-compare.md
  const { search } = await prepareSearch(page);
  await addFromResults(search, [alphaCompareCompany, deltaCompareCompany]);
  await search.openCompare();

  await expectCompanyPanel(search, alphaCompareCompany);
  await expectCompanyPanel(search, deltaCompareCompany);
  const deltaStatus = await search.compareCell('Statut', deltaCompareCompany.nom_complet);
  await expect(deltaStatus).not.toHaveText('En activité');
  await expect(deltaStatus).not.toHaveText('Cessée');
  await expect(deltaStatus).toHaveText(/—|non renseign[eé]e?/i);

  for (const label of ['Activité', 'Ville', 'Code postal', 'Création', 'Catégorie', 'Effectif']) {
    await expect(await search.compareCell(label, deltaCompareCompany.nom_complet)).toHaveText(
      /—|non renseign[eé]e?/i,
    );
  }
  const alphaValuesByRow = expectedRows.get(alphaCompareCompany)!;
  for (const label of OPTIONAL_COMPARE_ROWS) {
    await expect(await search.compareCell(label, deltaCompareCompany.nom_complet)).not.toHaveText(
      alphaValuesByRow[label],
    );
  }
  await expect(search.compareView).not.toContainText(/undefined|null|\[object Object\]/);
  await expect(search.compareView).not.toContainText(/erreur|exception/i);
});

async function verifyEmptyComparePartition(
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

    await search.openCompare();
    await expect(search.compareView).toContainText(
      'Ajoute jusqu’à trois entreprises pour les comparer.',
    );
    await expect(search.compareView.locator('article.compare-panel')).toHaveCount(0);
    await expect(search.compareTable).toHaveCount(0);
    await expect(search.compareView).not.toContainText(/erreur|exception/i);
    expect(apiRequests).toEqual([]);
    await context.close();
  });

  return partition;
}

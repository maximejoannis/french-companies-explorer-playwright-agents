import { expect, test, type Page, type Route } from '@playwright/test';
import * as allure from 'allure-js-commons';
import {
  statsAlpha,
  statsBeta,
  statsDelta,
  statsGamma,
  statsMissingValues,
  statsPageTwoGamma,
  statsSearchResponse,
} from '../../../mocks/stats-results';
import { SearchPage } from '../../pages/search.page';

const API_PATTERN = 'https://recherche-entreprises.api.gouv.fr/search**';

interface ExpectedStats {
  displayed: number;
  active: number;
  closed: number;
  cities: number;
  postalCodes: number;
  workforces: number;
  oldestCreation: string;
}

async function mockJson(route: Route, body: unknown) {
  await route.fulfill({ status: 200, contentType: 'application/json', json: body });
}

async function routeResponses(page: Page, responses: unknown[], requests: URL[]) {
  let responseIndex = 0;
  await page.route(API_PATTERN, async (route) => {
    requests.push(new URL(route.request().url()));
    const response = responses[responseIndex];
    expect(response).toBeDefined();
    responseIndex += 1;
    await mockJson(route, response);
  });
}

async function expectStats(search: SearchPage, expected: ExpectedStats) {
  await expect(search.statsBlock('Affichées')).toHaveText(
    new RegExp(`Affichées\\s*${expected.displayed}$`),
  );
  await expect(search.statsBlock('En activité')).toHaveText(
    new RegExp(`En activité\\s*${expected.active}\\s*${expected.closed} cessée\\(s\\)$`),
  );
  await expect(search.statsBlock('Communes distinctes')).toHaveText(
    new RegExp(
      `Communes distinctes\\s*${expected.cities}\\s*${expected.postalCodes} avec code postal$`,
    ),
  );
  await expect(search.statsBlock('Effectif renseigné')).toHaveText(
    new RegExp(
      `Effectif renseigné\\s*${expected.workforces}\\s*Création la plus ancienne : ${expected.oldestCreation}$`,
    ),
  );
}

test.beforeEach(async () => {
  await allure.epic('French Companies Explorer');
  await allure.feature('Stats');
  await allure.story('US-STATS-01 — Consulter les statistiques de la page courante');
});

test('TC-STATS-001 @positive calcule les indicateurs sur la page affichée', async ({ page }) => {
  // Couvre US-STATS-01 / AC-01, AC-02
  // Niveau : UI_MOCKED
  const requests: URL[] = [];
  await routeResponses(
    page,
    [statsSearchResponse([statsAlpha, statsBeta, statsGamma], { totalResults: 30 })],
    requests,
  );
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('statistiques nominales');

  await expect(search.statsPanel).toBeVisible();
  await expectStats(search, {
    displayed: 3,
    active: 2,
    closed: 1,
    cities: 2,
    postalCodes: 2,
    workforces: 2,
    oldestCreation: '2010-05-20',
  });
  expect(requests).toHaveLength(1);
});

test('TC-STATS-002 @regression remplace complètement les statistiques après une nouvelle recherche', async ({
  page,
}) => {
  // Couvre US-STATS-01 / AC-03
  // Niveau : UI_MOCKED
  const requests: URL[] = [];
  await routeResponses(
    page,
    [statsSearchResponse([statsAlpha, statsBeta, statsGamma]), statsSearchResponse([statsDelta])],
    requests,
  );
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('premier ensemble statistique');
  await expect(search.statsPanel).toContainText('2010-05-20');

  await search.submit('nouvel ensemble statistique');

  await expectStats(search, {
    displayed: 1,
    active: 1,
    closed: 0,
    cities: 1,
    postalCodes: 0,
    workforces: 0,
    oldestCreation: '2024-03-01',
  });
  await expect(search.statsPanel).not.toContainText('2010-05-20');
  expect(requests).toHaveLength(2);
});

test('TC-STATS-003 @positive recalcule les statistiques sur la réponse filtrée', async ({
  page,
}) => {
  // Couvre US-STATS-01 / AC-04
  // Niveau : UI_MOCKED
  const requests: URL[] = [];
  await page.route(API_PATTERN, async (route) => {
    const request = new URL(route.request().url());
    requests.push(request);
    const results = request.searchParams.has('code_postal') ? [statsBeta] : [statsAlpha, statsBeta];
    await mockJson(route, statsSearchResponse(results));
  });
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('statistiques filtrables');
  await expect(search.companyCard(statsAlpha.siren)).toBeVisible();
  await search.showAdvancedFilters();
  await search.postalCodeFilter.fill('69002');

  await search.searchButton.click();

  await expect(search.companyCard(statsBeta.siren)).toBeVisible();
  await expect(search.companyCard(statsAlpha.siren)).toHaveCount(0);
  await expectStats(search, {
    displayed: 1,
    active: 0,
    closed: 1,
    cities: 1,
    postalCodes: 1,
    workforces: 0,
    oldestCreation: '2010-05-20',
  });
  expect(requests).toHaveLength(2);
});

test('TC-STATS-004 @regression suit la page courante sans varier lors du tri', async ({ page }) => {
  // Couvre US-STATS-01 / AC-05, AC-06
  // Niveau : UI_MOCKED
  const requests: URL[] = [];
  await routeResponses(
    page,
    [
      statsSearchResponse([statsAlpha, statsBeta], { page: 1, totalResults: 40 }),
      statsSearchResponse([statsPageTwoGamma, statsDelta], { page: 2, totalResults: 40 }),
    ],
    requests,
  );
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('statistiques paginées');
  await expectStats(search, {
    displayed: 2,
    active: 1,
    closed: 1,
    cities: 2,
    postalCodes: 2,
    workforces: 1,
    oldestCreation: '2010-05-20',
  });

  await search.nextPageButton.click();

  await expect(search.companyCard(statsPageTwoGamma.siren)).toBeVisible();
  await expect(search.companyCard(statsDelta.siren)).toBeVisible();
  await expect(search.companyCard(statsAlpha.siren)).toHaveCount(0);
  await expectStats(search, {
    displayed: 2,
    active: 1,
    closed: 1,
    cities: 2,
    postalCodes: 0,
    workforces: 1,
    oldestCreation: '2018-04-12',
  });
  expect(requests).toHaveLength(2);

  const sirensBeforeSort = await search.visibleSirens();
  const statsBeforeSort = await search.statsPanel.textContent();
  const requestsBeforeSort = requests.length;
  await search.selectSort('name-asc');

  const sirensAfterSort = await search.visibleSirens();
  expect(sirensAfterSort).not.toEqual(sirensBeforeSort);
  expect(sirensAfterSort).toEqual([statsDelta.siren, statsPageTwoGamma.siren]);
  await expect.poll(() => search.statsPanel.textContent()).toBe(statsBeforeSort);
  expect(requests).toHaveLength(requestsBeforeSort);
});

test('TC-STATS-005 @regression masque les statistiques après une réponse vide', async ({
  page,
}) => {
  // Couvre US-STATS-01 / AC-07
  // Niveau : UI_MOCKED
  const requests: URL[] = [];
  await routeResponses(
    page,
    [statsSearchResponse([statsAlpha, statsBeta]), statsSearchResponse([])],
    requests,
  );
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('statistiques visibles');
  await expect(search.statsPanel).toBeVisible();
  await expect(search.statsPanel).toContainText('2010-05-20');

  await search.submit('aucune statistique');

  await expect(search.searchState).toHaveText('Aucune entreprise ne correspond à cette recherche.');
  await expect(search.statsPanel).toBeHidden();
  await expect(search.statsPanel).toBeEmpty();
  await expect(search.statsPanel).not.toContainText('2010-05-20');
  await expect(search.searchState).not.toContainText(/erreur|exception/i);
  expect(requests).toHaveLength(2);
});

test.fixme('TC-STATS-006 @regression BUG-007 exclut les valeurs absentes des indicateurs', async ({
  page,
}) => {
  // Couvre US-STATS-01 / AC-02, AC-08
  // Niveau : UI_MOCKED
  // Défaut connu : defects/BUG-007-missing-status-counted-as-closed-in-stats.md
  await page.route(API_PATTERN, (route) =>
    mockJson(route, statsSearchResponse(statsMissingValues)),
  );
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('statistiques incomplètes');

  await expect(search.statsPanel).toBeVisible();
  await expectStats(search, {
    displayed: 2,
    active: 0,
    closed: 0,
    cities: 1,
    postalCodes: 1,
    workforces: 1,
    oldestCreation: '—',
  });
  await expect(search.statsPanel).not.toContainText(/undefined|null|\[object Object\]/);
  await expect(search.statsPanel).not.toContainText(/erreur|exception/i);
});

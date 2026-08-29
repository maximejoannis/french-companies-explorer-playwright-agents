import { expect, test, type Page, type Route } from '@playwright/test';
import { paginatedSearchResponse, paginationCompanies } from '../../../mocks/search-results';
import { SearchPage } from '../../pages/search.page';

const API_PATTERN = 'https://recherche-entreprises.api.gouv.fr/search**';

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

test('TC-PAGINATION-002 @positive représente les limites de première et dernière page', async ({
  page,
}) => {
  // Couvre US-PAGINATION-01 / AC-01, AC-04, contribution AC-08
  const requests: URL[] = [];
  await routeResponses(
    page,
    [
      paginatedSearchResponse(paginationCompanies[0], 1, 60),
      paginatedSearchResponse(paginationCompanies[1], 2, 60),
      paginatedSearchResponse(paginationCompanies[2], 3, 60),
    ],
    requests,
  );
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('entreprise test');

  await expect(search.pageLabel).toHaveText('Page 1 / 3');
  await expect(search.previousPageButton).toBeDisabled();
  await expect(search.nextPageButton).toBeEnabled();
  await search.nextPageButton.click();
  await expect(search.pageLabel).toHaveText('Page 2 / 3');
  await search.nextPageButton.click();
  await expect(search.pageLabel).toHaveText('Page 3 / 3');
  await expect(search.nextPageButton).toBeDisabled();
  await expect(search.previousPageButton).toBeEnabled();

  expect(requests.map((request) => request.searchParams.get('page'))).toEqual(['1', '2', '3']);
});

test('TC-PAGINATION-003 @positive remplace la page courante par la page suivante', async ({
  page,
}) => {
  // Couvre US-PAGINATION-01 / AC-02, AC-08
  const requests: URL[] = [];
  let releaseSecondPage: (() => void) | undefined;
  const secondPageCanResolve = new Promise<void>((resolve) => {
    releaseSecondPage = resolve;
  });
  let responseIndex = 0;
  await page.route(API_PATTERN, async (route) => {
    const request = new URL(route.request().url());
    requests.push(request);
    const responses = [
      paginatedSearchResponse(paginationCompanies[0], 1, 40),
      paginatedSearchResponse(paginationCompanies[1], 2, 40),
    ];
    if (responseIndex === 1) await secondPageCanResolve;
    await mockJson(route, responses[responseIndex]);
    responseIndex += 1;
  });
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('entreprise test');
  await expect(search.companyCard(paginationCompanies[0].siren)).toBeVisible();
  await expect(search.pageLabel).toHaveText('Page 1 / 2');

  await search.nextPageButton.click();
  await expect.poll(() => requests.length).toBe(2);
  await expect(search.resultsGrid).toBeEmpty();
  releaseSecondPage?.();

  await expect(search.companyCard(paginationCompanies[1].siren)).toBeVisible();
  await expect(search.companyCard(paginationCompanies[0].siren)).toHaveCount(0);
  await expect(search.pageLabel).toHaveText('Page 2 / 2');
  expect(requests[1].searchParams.get('page')).toBe('2');
  expect(requests[1].searchParams.get('per_page')).toBe('20');
  expect(requests[1].searchParams.get('q')).toBe('entreprise test');
});

test('TC-PAGINATION-004 retourne à la page précédente et à ses résultats', async ({ page }) => {
  // Couvre US-PAGINATION-01 / AC-03, contribution AC-08
  const requests: URL[] = [];
  await routeResponses(
    page,
    [
      paginatedSearchResponse(paginationCompanies[0], 1, 40),
      paginatedSearchResponse(paginationCompanies[1], 2, 40),
      paginatedSearchResponse(paginationCompanies[0], 1, 40),
    ],
    requests,
  );
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('entreprise test');
  await search.nextPageButton.click();
  await expect(search.companyCard(paginationCompanies[1].siren)).toBeVisible();

  await search.previousPageButton.click();

  await expect(search.companyCard(paginationCompanies[0].siren)).toBeVisible();
  await expect(search.companyCard(paginationCompanies[1].siren)).toHaveCount(0);
  await expect(search.pageLabel).toHaveText('Page 1 / 2');
  expect(requests[2].searchParams.get('page')).toBe('1');
  expect(requests[2].searchParams.get('per_page')).toBe('20');
  expect(requests[2].searchParams.get('q')).toBe('entreprise test');
});

test.fixme('TC-PAGINATION-005 @regression BUG-002 change la taille depuis une page supérieure', async ({
  page,
}) => {
  // Couvre US-PAGINATION-01 / AC-05, AC-06, AC-08
  // Défaut connu : defects/BUG-002-page-size-change-does-not-refresh.md
  const requests: URL[] = [];
  await routeResponses(
    page,
    [
      paginatedSearchResponse(paginationCompanies[0], 1, 40),
      paginatedSearchResponse(paginationCompanies[1], 2, 40),
      paginatedSearchResponse(paginationCompanies[2], 1, 30, 10),
    ],
    requests,
  );
  const search = new SearchPage(page);
  await search.goto();
  await search.showAdvancedFilters();
  await search.postalCodeFilter.fill('75015');
  await search.submit('entreprise test');
  await search.nextPageButton.click();
  await expect(search.companyCard(paginationCompanies[1].siren)).toBeVisible();

  await expect(search.resultsPerPageFilter.getByRole('option')).toHaveText(['10', '20', '25']);
  await expect(search.resultsPerPageFilter).toHaveValue('20');
  await search.selectPageSize('10');

  await expect.poll(() => requests.length).toBe(3);
  await expect(search.companyCard(paginationCompanies[2].siren)).toBeVisible();
  await expect(search.companyCard(paginationCompanies[1].siren)).toHaveCount(0);
  await expect(search.resultsPerPageFilter).toHaveValue('10');
  await expect(search.pageLabel).toHaveText('Page 1 / 3');
  expect(requests[2].searchParams.get('page')).toBe('1');
  expect(requests[2].searchParams.get('per_page')).toBe('10');
  expect(requests[2].searchParams.get('q')).toBe('entreprise test');
  expect(requests[2].searchParams.get('code_postal')).toBe('75015');
});

test('TC-PAGINATION-006 @positive réinitialise la page après changement des critères', async ({
  page,
}) => {
  // Couvre US-PAGINATION-01 / AC-07, contribution AC-08
  const requests: URL[] = [];
  await routeResponses(
    page,
    [
      paginatedSearchResponse(paginationCompanies[0], 1, 40),
      paginatedSearchResponse(paginationCompanies[1], 2, 40),
      paginatedSearchResponse(paginationCompanies[2], 1, 20),
      paginatedSearchResponse(paginationCompanies[0], 1, 40),
      paginatedSearchResponse(paginationCompanies[1], 2, 40),
      paginatedSearchResponse(paginationCompanies[2], 1, 20),
    ],
    requests,
  );
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('première recherche');
  await search.nextPageButton.click();
  await expect(search.companyCard(paginationCompanies[1].siren)).toBeVisible();

  await search.submit('nouvelle recherche');

  await expect(search.companyCard(paginationCompanies[2].siren)).toBeVisible();
  await expect(search.companyCard(paginationCompanies[1].siren)).toHaveCount(0);
  await expect(search.pageLabel).toHaveText('Page 1 / 1');
  expect(requests[2].searchParams.get('page')).toBe('1');
  expect(requests[2].searchParams.get('per_page')).toBe('20');
  expect(requests[2].searchParams.get('q')).toBe('nouvelle recherche');
  expect(requests[2].searchParams.has('code_postal')).toBe(false);

  await search.goto();
  await search.showAdvancedFilters();
  await search.submit('recherche filtrable');
  await search.nextPageButton.click();
  await expect(search.companyCard(paginationCompanies[1].siren)).toBeVisible();

  await search.postalCodeFilter.fill('75015');
  await search.searchButton.click();

  await expect(search.companyCard(paginationCompanies[2].siren)).toBeVisible();
  await expect(search.companyCard(paginationCompanies[1].siren)).toHaveCount(0);
  await expect(search.pageLabel).toHaveText('Page 1 / 1');
  expect(requests[5].searchParams.get('page')).toBe('1');
  expect(requests[5].searchParams.get('per_page')).toBe('20');
  expect(requests[5].searchParams.get('q')).toBe('recherche filtrable');
  expect(requests[5].searchParams.get('code_postal')).toBe('75015');
});

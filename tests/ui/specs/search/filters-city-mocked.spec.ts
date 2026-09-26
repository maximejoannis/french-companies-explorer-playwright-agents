import { expect, test } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { parisGeoResult } from '../../../mocks/geo-results';
import { mockedSearchResponse } from '../../../mocks/search-results';
import { SearchPage } from '../../pages/search.page';

const COMPANY_API = 'https://recherche-entreprises.api.gouv.fr/search**';
const GEO_API = 'https://geo.api.gouv.fr/communes**';

test.beforeEach(async () => {
  await allure.epic('French Companies Explorer');
  await allure.feature('Filters');
  await allure.story('US-FILTERS-01 — Filtrer les entreprises recherchées');
});

test('TC-FILTERS-009 @regression BUG-001 résout une commune en code INSEE', async ({ page }) => {
  // Couvre US-FILTERS-01 / AC-02, AC-07 — Niveau : UI_MOCKED
  let companyRequest: URL | undefined;
  await page.route(GEO_API, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify([parisGeoResult]),
    }),
  );
  await page.route(COMPANY_API, (route) => {
    companyRequest = new URL(route.request().url());
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockedSearchResponse),
    });
  });
  const search = new SearchPage(page);
  await search.goto();
  await search.showAdvancedFilters();
  await search.cityFilter.fill('Paris');
  await expect(search.citySuggestions.getByRole('option')).toHaveCount(1);
  await search.selectCitySuggestion('Paris');
  await search.submit('restaurant');

  await expect(search.companyCards).not.toHaveCount(0);
  expect(companyRequest?.searchParams.get('code_commune')).toBe(parisGeoResult.code);
  expect(companyRequest?.searchParams.has('commune')).toBe(false);
});

test('TC-FILTERS-010 @error affiche une erreur Geo API sans requête Entreprises', async ({
  page,
}) => {
  // Couvre US-FILTERS-01 / AC-02, AC-07 — Niveau : UI_MOCKED
  let companyRequests = 0;
  await page.route(GEO_API, (route) => route.fulfill({ status: 503, body: 'unavailable' }));
  await page.route(COMPANY_API, (route) => {
    companyRequests += 1;
    return route.abort();
  });
  const search = new SearchPage(page);
  await search.goto();
  await search.showAdvancedFilters();
  await search.cityFilter.fill('Paris');
  await search.submit('restaurant');

  await expect(search.searchState).toHaveText(
    'Impossible de valider la commune. Réessaie ou sélectionne une suggestion.',
  );
  expect(companyRequests).toBe(0);
});

import { expect, test } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { SearchPage } from '../../pages/search.page';

const COMPANY_API = 'https://recherche-entreprises.api.gouv.fr/search**';
const GEO_API = 'https://geo.api.gouv.fr/communes**';

test.beforeEach(async () => {
  await allure.epic('French Companies Explorer');
  await allure.feature('FEAT-FILTERS-V111');
  await allure.story('US-FILTERS-02 — Affiner une recherche avec des critères enrichis');
});

test('TC-FILTERS-010 @error affiche une erreur Geo API sans requête Entreprises', async ({
  page,
}) => {
  // Couvre US-FILTERS-02 / AC-11 — Niveau : UI_MOCKED
  let companyRequests = 0;
  await page.route(GEO_API, (route) => route.fulfill({ status: 503, body: 'unavailable' }));
  await page.route(COMPANY_API, (route) => {
    if (new URL(route.request().url()).searchParams.get('minimal') === 'true') {
      return route.fulfill({ status: 200, contentType: 'application/json', json: { results: [] } });
    }
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
  await expect(search.cityFilter).toHaveValue('Paris');
  expect(companyRequests).toBe(0);
});

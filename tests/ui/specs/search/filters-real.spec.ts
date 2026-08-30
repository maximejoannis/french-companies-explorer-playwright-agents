import { expect, test } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { SearchPage } from '../../pages/search.page';

const EMPTY_STATE = 'Aucune entreprise ne correspond à cette recherche.';

interface ApiCompany {
  siren: string;
}

interface SearchResponse {
  results: ApiCompany[];
}

async function expectSuccessfulOutcome(search: SearchPage, companies: ApiCompany[]) {
  const visibleCards = await Promise.all(
    companies.map((company) => search.companyCard(company.siren).isVisible()),
  );
  const stateText = await search.searchState.textContent();
  expect([visibleCards.includes(true), stateText === EMPTY_STATE]).toContain(true);
}

test.beforeEach(async () => {
  await allure.epic('French Companies Explorer');
  await allure.feature('Filters');
  await allure.story('US-FILTERS-01 — Filtrer les entreprises recherchées');
});

test.fixme('TC-FILTERS-009 @regression BUG-001 filtre réellement avec une commune textuelle', async ({
  page,
}) => {
  // Couvre US-FILTERS-01 / AC-02, AC-07
  // Défaut connu : defects/BUG-001-filter-commune-invalid-api-format.md
  const search = new SearchPage(page);
  await search.goto();
  await search.showAdvancedFilters();
  await search.cityFilter.fill('Paris');

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().startsWith('https://recherche-entreprises.api.gouv.fr/search?') &&
      response.request().method() === 'GET',
  );
  await search.submit('restaurant');
  const response = await responsePromise;

  expect(new URL(response.url()).searchParams.get('commune')).toBe('Paris');
  expect(response.ok()).toBe(true);
  const body = (await response.json()) as SearchResponse;
  await expectSuccessfulOutcome(search, body.results);
  await expect(search.cityFilter).toHaveValue('Paris');
});

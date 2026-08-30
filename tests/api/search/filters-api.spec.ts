import { expect, test, type APIResponse } from '@playwright/test';
import * as allure from 'allure-js-commons';

const API_URL = 'https://recherche-entreprises.api.gouv.fr/search';
const GENERIC_QUERY = 'restaurant';
const POSTAL_CODE = '75015';
const COMMUNE_ID = '75115';

interface Establishment {
  code_postal?: string;
  commune?: string;
}

interface ApiCompany {
  etat_administratif?: string;
  siege?: Establishment;
  matching_etablissements?: Establishment[];
}

interface SearchResponse {
  results: ApiCompany[];
  total_results: number;
}

function establishmentsOf(company: ApiCompany) {
  return [company.siege, ...(company.matching_etablissements ?? [])].filter(
    (establishment): establishment is Establishment => establishment !== undefined,
  );
}

async function readSearchResponse(response: APIResponse) {
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('application/json');
  const body: unknown = await response.json();
  expect(body).toEqual(
    expect.objectContaining({
      results: expect.any(Array),
      total_results: expect.any(Number),
    }),
  );
  return body as SearchResponse;
}

test.beforeEach(async () => {
  await allure.epic('French Companies Explorer');
  await allure.feature('Filters');
  await allure.story('US-FILTERS-01 — Filtrer les entreprises recherchées');
});

test('TC-FILTERS-001 @positive filtre réellement par code postal', async ({ request }) => {
  // Couvre US-FILTERS-01 / AC-01, contribution AC-07
  const response = await request.get(API_URL, {
    params: { q: GENERIC_QUERY, code_postal: POSTAL_CODE, per_page: 3 },
  });

  const body = await readSearchResponse(response);
  expect(body.results.length).toBeGreaterThan(0);
  for (const company of body.results) {
    expect(establishmentsOf(company).some(({ code_postal }) => code_postal === POSTAL_CODE)).toBe(
      true,
    );
  }
});

test('TC-FILTERS-002 @positive filtre réellement par identifiant de commune', async ({
  request,
}) => {
  // Couvre US-FILTERS-01 / contribution AC-02, AC-07
  const response = await request.get(API_URL, {
    params: { q: GENERIC_QUERY, commune: COMMUNE_ID, per_page: 3 },
  });

  const body = await readSearchResponse(response);
  expect(body.results.length).toBeGreaterThan(0);
  for (const company of body.results) {
    expect(establishmentsOf(company).some(({ commune }) => commune === COMMUNE_ID)).toBe(true);
  }
});

test('TC-FILTERS-003 @positive filtre réellement par état administratif', async ({ request }) => {
  // Couvre US-FILTERS-01 / AC-03, contribution AC-07
  for (const status of ['A', 'C']) {
    const response = await request.get(API_URL, {
      params: { q: GENERIC_QUERY, etat_administratif: status, per_page: 3 },
    });

    const body = await readSearchResponse(response);
    expect(body.results.length).toBeGreaterThan(0);
    for (const company of body.results) {
      expect(company.etat_administratif).toBe(status);
    }
  }
});

test('TC-FILTERS-004 @positive combine réellement les filtres', async ({ request }) => {
  // Couvre US-FILTERS-01 / AC-04, contribution AC-07
  const response = await request.get(API_URL, {
    params: {
      q: GENERIC_QUERY,
      code_postal: POSTAL_CODE,
      commune: COMMUNE_ID,
      etat_administratif: 'A',
      per_page: 3,
    },
  });

  const body = await readSearchResponse(response);
  expect(body.results.length).toBeGreaterThan(0);
  for (const company of body.results) {
    expect(company.etat_administratif).toBe('A');
    expect(
      establishmentsOf(company).some(
        ({ code_postal, commune }) => code_postal === POSTAL_CODE && commune === COMMUNE_ID,
      ),
    ).toBe(true);
  }
});

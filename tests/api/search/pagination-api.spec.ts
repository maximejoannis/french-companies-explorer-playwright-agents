import { expect, test, type APIResponse } from '@playwright/test';
import * as allure from 'allure-js-commons';

const API_URL = 'https://recherche-entreprises.api.gouv.fr/search';
const PER_PAGE = 2;

interface ApiCompany {
  siren: string;
}

interface PaginatedResponse {
  results: ApiCompany[];
  total_results: number;
  page: number;
  per_page: number;
  total_pages: number;
}

async function readPaginatedResponse(response: APIResponse) {
  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('application/json');
  const body: unknown = await response.json();
  expect(body).toEqual(
    expect.objectContaining({
      results: expect.any(Array),
      total_results: expect.any(Number),
      page: expect.any(Number),
      per_page: expect.any(Number),
      total_pages: expect.any(Number),
    }),
  );
  return body as PaginatedResponse;
}

test.beforeEach(async () => {
  await allure.epic('French Companies Explorer');
  await allure.feature('Pagination');
  await allure.story('US-PAGINATION-01 — Parcourir les pages de résultats');
});

test('TC-PAGINATION-001 @positive expose des pages API cohérentes et distinctes', async ({
  request,
}) => {
  // Couvre US-PAGINATION-01 / contributions AC-01, AC-02, AC-03, AC-04, AC-08
  const query = 'restaurant';
  const firstPage = await readPaginatedResponse(
    await request.get(API_URL, { params: { q: query, page: 1, per_page: PER_PAGE } }),
  );
  const secondPage = await readPaginatedResponse(
    await request.get(API_URL, { params: { q: query, page: 2, per_page: PER_PAGE } }),
  );

  expect(firstPage.page).toBe(1);
  expect(secondPage.page).toBe(2);
  expect(firstPage.per_page).toBe(PER_PAGE);
  expect(secondPage.per_page).toBe(PER_PAGE);
  expect(firstPage.total_pages).toBeGreaterThanOrEqual(2);
  expect(secondPage.total_pages).toBeGreaterThanOrEqual(2);
  expect(firstPage.total_pages).toBe(Math.ceil(firstPage.total_results / PER_PAGE));
  expect(secondPage.total_pages).toBe(Math.ceil(secondPage.total_results / PER_PAGE));
  expect(firstPage.results.length).toBeGreaterThan(0);
  expect(secondPage.results.length).toBeGreaterThan(0);
  expect(firstPage.results.length).toBeLessThanOrEqual(PER_PAGE);
  expect(secondPage.results.length).toBeLessThanOrEqual(PER_PAGE);

  const firstSirens = new Set(firstPage.results.map(({ siren }) => siren));
  const secondSirens = new Set(secondPage.results.map(({ siren }) => siren));
  for (const siren of [...firstSirens, ...secondSirens]) {
    expect(siren).toMatch(/^\d{9}$/);
  }
  expect([...firstSirens].sort()).not.toEqual([...secondSirens].sort());
});

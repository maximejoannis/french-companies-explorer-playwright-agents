import { expect, test } from '@playwright/test';
import * as allure from 'allure-js-commons';

const API_URL = 'https://recherche-entreprises.api.gouv.fr/search';

test.beforeEach(async () => {
  await allure.epic('French Companies Explorer');
  await allure.feature('Search');
  await allure.story('US-SEARCH-01 — Rechercher une entreprise');
});

test('TC-SEARCH-001 @positive contrat minimal d’une recherche textuelle', async ({ request }) => {
  // Couvre US-SEARCH-01 / AC-01
  const response = await request.get(API_URL, {
    params: { q: 'boulangerie', per_page: 2 },
  });

  expect(response.ok()).toBe(true);
  expect(response.headers()['content-type']).toContain('application/json');

  const body: unknown = await response.json();
  expect(body).toEqual(
    expect.objectContaining({
      results: expect.any(Array),
      total_results: expect.any(Number),
    }),
  );

  const results = (body as { results: unknown[] }).results;
  for (const company of results) {
    expect(company).toEqual(
      expect.objectContaining({
        siren: expect.stringMatching(/^\d{9}$/),
        siege: expect.any(Object),
      }),
    );
    expect(company).toEqual(
      expect.objectContaining({
        nom_complet: expect.any(String),
        etat_administratif: expect.stringMatching(/^[AC]$/),
      }),
    );
  }
});

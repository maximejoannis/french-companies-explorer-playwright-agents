import { expect, test } from '@playwright/test';
import { SearchPage } from '../../pages/search.page';

interface ApiCompany {
  siren: string;
  nom_complet?: string;
  nom_raison_sociale?: string;
  nom?: string;
  etat_administratif?: string;
  siege?: { etat_administratif?: string };
}

interface SearchResponse {
  results: ApiCompany[];
}

test('TC-SEARCH-010 @smoke @positive affiche une recherche textuelle réelle cohérente', async ({
  page,
}) => {
  // Couvre US-SEARCH-01 / AC-01, AC-05
  const search = new SearchPage(page);
  await search.goto();

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().startsWith('https://recherche-entreprises.api.gouv.fr/search?') &&
      response.request().method() === 'GET',
  );
  await search.submit('boulangerie');
  const response = await responsePromise;

  expect(response.ok()).toBe(true);
  const body = (await response.json()) as SearchResponse;
  expect(body.results.length).toBeGreaterThan(0);

  const visibleCards = await Promise.all(
    body.results.map((company) => search.companyCard(company.siren).isVisible()),
  );
  const displayedCompany = body.results[visibleCards.indexOf(true)];
  expect(displayedCompany).toBeDefined();
  const company = displayedCompany!;
  const card = search.companyCard(company.siren);
  await expect(card).toBeVisible();
  await expect(card).toContainText(`SIREN ${company.siren}`);
  await expect(card).toContainText(
    company.nom_complet ?? company.nom_raison_sociale ?? company.nom ?? 'Entreprise sans nom',
  );
  const status = company.etat_administratif ?? company.siege?.etat_administratif;
  const expectedStatusLabels: Record<string, string[]> = {
    A: ['En activité'],
    C: ['Cessée'],
  };
  for (const expectedStatusLabel of expectedStatusLabels[status ?? ''] ?? []) {
    await expect(card).toContainText(expectedStatusLabel);
  }
});

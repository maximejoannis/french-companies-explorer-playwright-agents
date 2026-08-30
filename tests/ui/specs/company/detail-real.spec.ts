import { expect, test } from '@playwright/test';
import { SearchPage } from '../../pages/search.page';

interface ApiCompany {
  siren?: unknown;
  nom_complet?: unknown;
  nom_raison_sociale?: unknown;
  nom?: unknown;
  siege?: { siret?: unknown };
}

interface SearchResponse {
  results?: unknown;
}

function companyName(company: ApiCompany) {
  for (const value of [company.nom_complet, company.nom_raison_sociale, company.nom]) {
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
}

test('TC-DETAIL-005 @smoke @positive relie un résultat API réel à sa fiche locale', async ({
  page,
}) => {
  // Couvre US-DETAIL-01 / AC-01, AC-02, contribution AC-03, AC-08
  const search = new SearchPage(page);
  let searchRequestCount = 0;
  page.on('request', (request) => {
    if (
      request.method() === 'GET' &&
      request.url().startsWith('https://recherche-entreprises.api.gouv.fr/search?')
    ) {
      searchRequestCount += 1;
    }
  });
  await search.goto();

  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().startsWith('https://recherche-entreprises.api.gouv.fr/search?') &&
      response.request().method() === 'GET' &&
      response.ok(),
  );
  await search.submit('boulangerie');
  const response = await responsePromise;
  const body = (await response.json()) as SearchResponse;
  expect(Array.isArray(body.results)).toBe(true);
  const companies = body.results as ApiCompany[];

  await expect(search.resultsGrid).not.toBeEmpty();
  let displayedCompany: { name: string; siren: string; siret: string } | undefined;
  await expect
    .poll(async () => {
      for (const company of companies) {
        const name = companyName(company);
        const siren = typeof company.siren === 'string' ? company.siren : undefined;
        const siret = typeof company.siege?.siret === 'string' ? company.siege.siret : undefined;
        if (name && siren && siret && (await search.companyCard(siren).isVisible())) {
          displayedCompany = { name, siren, siret };
          return true;
        }
      }
      return false;
    })
    .toBe(true);

  expect(displayedCompany).toBeDefined();
  const company = displayedCompany!;
  const requestsBeforeOpening = searchRequestCount;
  await search.openCompanyDetail(company.siren);

  await expect(search.detailView).toBeVisible();
  await expect(search.detailContent).toContainText(company.name);
  await expect(search.detailContent).toContainText(`SIREN ${company.siren}`);
  await expect(search.detailContent).toContainText(company.siret);
  expect(searchRequestCount).toBe(requestsBeforeOpening);
});

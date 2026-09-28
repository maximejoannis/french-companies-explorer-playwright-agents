import { expect, test, type Page, type Request, type Response } from '@playwright/test';
import * as allure from 'allure-js-commons';
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

const SEARCH_API_URL = 'https://recherche-entreprises.api.gouv.fr/search';

function isFunctionalSearchRequest(request: Request) {
  const url = new URL(request.url());
  return (
    `${url.origin}${url.pathname}` === SEARCH_API_URL &&
    url.searchParams.get('minimal') !== 'true' &&
    request.method() === 'GET'
  );
}

function companyName(company: ApiCompany) {
  for (const value of [company.nom_complet, company.nom_raison_sociale, company.nom]) {
    if (typeof value === 'string' && value.length > 0) return value;
  }
  return undefined;
}

function trackFunctionalSearchRequests(page: Page) {
  let count = 0;
  const onRequest = (request: Request) => {
    if (isFunctionalSearchRequest(request)) count += 1;
  };
  page.on('request', onRequest);
  return {
    count: () => count,
    dispose: () => page.off('request', onRequest),
  };
}

async function waitForFunctionalSearchResponse(
  page: Page,
  observedRequestCount: () => number,
): Promise<Response> {
  let removeRequestFailedListener = () => {};
  const requestFailedPromise = new Promise<never>((_, reject) => {
    const onRequestFailed = (request: Request) => {
      if (!isFunctionalSearchRequest(request)) return;
      const reason = request.failure()?.errorText ?? 'cause réseau inconnue';
      reject(
        new Error(`API recherche-entreprises : échec réseau (${reason}) sur ${request.url()}`),
      );
    };
    page.on('requestfailed', onRequestFailed);
    removeRequestFailedListener = () => page.off('requestfailed', onRequestFailed);
  });
  const responsePromise = page.waitForResponse((response) =>
    isFunctionalSearchRequest(response.request()),
  );

  try {
    return await Promise.race([responsePromise, requestFailedPromise]);
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('API recherche-entreprises :')) {
      throw error;
    }
    const diagnostic =
      observedRequestCount() === 0
        ? 'aucune requête fonctionnelle observée'
        : 'requête observée, mais aucune réponse HTTP ni erreur réseau reçue';
    throw new Error(`API recherche-entreprises : ${diagnostic} avant le timeout`, {
      cause: error,
    });
  } finally {
    removeRequestFailedListener();
  }
}

test.beforeEach(async () => {
  await allure.epic('French Companies Explorer');
  await allure.feature('Detail');
  await allure.story('US-DETAIL-01 — Consulter le détail d’une entreprise');
});

test('TC-DETAIL-005 @real-api @positive relie un résultat API réel à sa fiche locale', async ({
  page,
}) => {
  // Couvre US-DETAIL-01 / AC-01, AC-02, contribution AC-03, AC-08
  const search = new SearchPage(page);
  const functionalSearchRequests = trackFunctionalSearchRequests(page);
  await search.goto();

  const responsePromise = waitForFunctionalSearchResponse(page, functionalSearchRequests.count);
  await search.submit('boulangerie');
  const response = await responsePromise;

  const httpDiagnostic = `API recherche-entreprises : ${response.status()} ${response.statusText()}`;
  expect(response.status(), httpDiagnostic).toBeGreaterThanOrEqual(200);
  expect(response.status(), httpDiagnostic).toBeLessThan(300);
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
  const requestsBeforeOpening = functionalSearchRequests.count();
  await search.openCompanyDetail(company.siren);

  await expect(search.detailView).toBeVisible();
  await expect(search.detailContent).toContainText(company.name);
  await expect(search.detailContent).toContainText(`SIREN ${company.siren}`);
  await expect(search.detailContent).toContainText(company.siret);
  expect(functionalSearchRequests.count()).toBe(requestsBeforeOpening);
  functionalSearchRequests.dispose();
});

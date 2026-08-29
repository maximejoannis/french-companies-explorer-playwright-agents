import { expect, test, type Route } from '@playwright/test';
import {
  emptySearchResponse,
  mockedCompanies,
  mockedSearchResponse,
} from '../../../mocks/search-results';
import { SearchPage } from '../../pages/search.page';

const API_PATTERN = 'https://recherche-entreprises.api.gouv.fr/search**';

async function mockJson(route: Route, body: unknown) {
  await route.fulfill({ status: 200, contentType: 'application/json', json: body });
}

test('TC-SEARCH-002 @positive reconnaît et autorise un SIREN', async ({ page }) => {
  // Couvre US-SEARCH-01 / AC-02
  let requestedQuery: string | null = null;
  await page.route(API_PATTERN, async (route) => {
    requestedQuery = new URL(route.request().url()).searchParams.get('q');
    await mockJson(route, emptySearchResponse);
  });
  const search = new SearchPage(page);
  await search.goto();

  await search.queryInput.fill('123456789');
  await expect(search.queryHint).toHaveText('SIREN détecté');
  await search.searchButton.click();

  await expect(search.searchState).toHaveText('Aucune entreprise ne correspond à cette recherche.');
  expect(requestedQuery).toBe('123456789');
});

test('TC-SEARCH-003 @positive reconnaît et autorise un SIRET', async ({ page }) => {
  // Couvre US-SEARCH-01 / AC-03
  let requestedQuery: string | null = null;
  await page.route(API_PATTERN, async (route) => {
    requestedQuery = new URL(route.request().url()).searchParams.get('q');
    await mockJson(route, emptySearchResponse);
  });
  const search = new SearchPage(page);
  await search.goto();

  await search.queryInput.fill('12345678901234');
  await expect(search.queryHint).toHaveText('SIRET détecté');
  await search.searchButton.click();

  await expect(search.searchState).toHaveText('Aucune entreprise ne correspond à cette recherche.');
  expect(requestedQuery).toBe('12345678901234');
});

test('TC-SEARCH-004 @negative refuse les longueurs numériques invalides sans appel API', async ({
  page,
}) => {
  // Couvre US-SEARCH-01 / AC-04
  let apiCalls = 0;
  await page.route(API_PATTERN, async (route) => {
    apiCalls += 1;
    await mockJson(route, emptySearchResponse);
  });
  const search = new SearchPage(page);
  await search.goto();

  for (const length of [8, 10, 13, 15]) {
    await search.submit('1'.repeat(length));
    await expect(search.searchState).toHaveText(
      'Identifiant invalide : un SIREN contient 9 chiffres et un SIRET 14 chiffres',
    );
    await expect(search.resultsGrid).toBeEmpty();
  }
  expect(apiCalls).toBe(0);
});

test('TC-SEARCH-005 @positive affiche les informations essentielles de la réponse', async ({
  page,
}) => {
  // Couvre US-SEARCH-01 / AC-05
  await page.route(API_PATTERN, (route) => mockJson(route, mockedSearchResponse));
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('entreprise test');

  await expect(search.resultCount).toHaveText('2 résultat(s)');
  for (const company of mockedCompanies) {
    const card = search.companyCard(company.siren);
    await expect(card).toContainText(company.nom_complet);
    await expect(card).toContainText(`SIREN ${company.siren}`);
    await expect(card).toContainText(company.etat_administratif === 'A' ? 'En activité' : 'Cessée');
    await expect(card).toContainText(company.libelle_activite_principale);
    await expect(card).toContainText(company.siege.libelle_commune);
    await expect(card).toContainText(company.date_creation);
    await expect(card.getByRole('button', { name: 'Comparer' })).toBeVisible();
    await expect(card.getByRole('button', { name: 'Voir la fiche' })).toBeVisible();
  }
});

test('TC-SEARCH-006 distingue une réponse vide d’une erreur', async ({ page }) => {
  // Couvre US-SEARCH-01 / AC-06
  await page.route(API_PATTERN, (route) => mockJson(route, emptySearchResponse));
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('aucun résultat');

  await expect(search.searchState).toHaveText('Aucune entreprise ne correspond à cette recherche.');
  await expect(search.resultCount).toHaveText('0 résultat(s)');
  await expect(search.resultsGrid).toBeEmpty();
  await expect(search.pagination).toBeHidden();
});

test('TC-SEARCH-007 @error distingue une erreur technique d’une réponse vide', async ({ page }) => {
  // Couvre US-SEARCH-01 / AC-07
  await page.route(API_PATTERN, (route) => route.fulfill({ status: 500, body: 'server error' }));
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('recherche valide');

  await expect(search.searchState).toHaveText(
    "Impossible de joindre l'API. Réessaie dans quelques instants.",
  );
  await expect(search.resultCount).toHaveText('Erreur API');
  await expect(search.resultsGrid).toBeEmpty();
  await expect(search.searchState).not.toContainText('Aucune entreprise');
});

test('TC-SEARCH-008 affiche le chargement puis les résultats après succès', async ({ page }) => {
  // Couvre US-SEARCH-01 / AC-08
  let releaseResponse: (() => void) | undefined;
  const responseCanResolve = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  await page.route(API_PATTERN, async (route) => {
    await responseCanResolve;
    await mockJson(route, mockedSearchResponse);
  });
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('chargement succès');

  await expect(search.searchState).toHaveText('Recherche en cours…');
  await expect(search.resultsGrid).toBeEmpty();
  releaseResponse?.();
  await expect(search.companyCard(mockedCompanies[0].siren)).toBeVisible();
  await expect(search.searchState).toBeHidden();
});

test('TC-SEARCH-009 affiche le chargement puis l’erreur après échec', async ({ page }) => {
  // Couvre US-SEARCH-01 / AC-08
  let releaseResponse: (() => void) | undefined;
  const responseCanResolve = new Promise<void>((resolve) => {
    releaseResponse = resolve;
  });
  await page.route(API_PATTERN, async (route) => {
    await responseCanResolve;
    await route.fulfill({ status: 500, body: 'server error' });
  });
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('chargement erreur');

  await expect(search.searchState).toHaveText('Recherche en cours…');
  await expect(search.resultsGrid).toBeEmpty();
  releaseResponse?.();
  await expect(search.searchState).toHaveText(
    "Impossible de joindre l'API. Réessaie dans quelques instants.",
  );
  await expect(search.searchState).not.toHaveText('Recherche en cours…');
});

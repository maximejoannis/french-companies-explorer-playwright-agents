import { expect, test, type Page, type Route } from '@playwright/test';
import * as allure from 'allure-js-commons';
import {
  alphaCompany,
  betaCompany,
  detailSearchResponse,
  partialBetaCompany,
} from '../../../mocks/detail-results';
import { SearchPage } from '../../pages/search.page';

const API_PATTERN = 'https://recherche-entreprises.api.gouv.fr/search**';

async function mockJson(route: Route, body: unknown) {
  await route.fulfill({ status: 200, contentType: 'application/json', json: body });
}

async function routeResponses(page: Page, responses: unknown[], requests: URL[]) {
  let responseIndex = 0;
  await page.route(API_PATTERN, async (route) => {
    requests.push(new URL(route.request().url()));
    const response = responses[responseIndex];
    expect(response).toBeDefined();
    responseIndex += 1;
    await mockJson(route, response);
  });
}

test.beforeEach(async () => {
  await allure.epic('French Companies Explorer');
  await allure.feature('Detail');
  await allure.story('US-DETAIL-01 — Consulter le détail d’une entreprise');
});

test('TC-DETAIL-001 @positive associe la carte choisie à sa fiche complète', async ({ page }) => {
  // Couvre US-DETAIL-01 / AC-01, AC-02, AC-03, AC-04, contribution AC-09
  await page.route(API_PATTERN, (route) =>
    mockJson(route, detailSearchResponse([alphaCompany, betaCompany])),
  );
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('détails synthétiques');
  await expect(search.companyCard(betaCompany.siren)).toBeVisible();

  await search.openCompanyDetail(betaCompany.siren);

  await expect(search.searchView).toBeHidden();
  await expect(search.detailView).toBeVisible();
  await expect(search.detailContent).toContainText(betaCompany.nom_complet);
  await expect(search.detailContent).toContainText(`SIREN ${betaCompany.siren}`);
  await expect(search.detailContent).toContainText(betaCompany.siege!.siret!);
  await expect(search.detailContent).toContainText(betaCompany.activite_principale!);
  await expect(search.detailContent).toContainText(betaCompany.siege!.adresse!);
  await expect(search.detailContent).toContainText(betaCompany.categorie_entreprise!);
  await expect(search.detailContent).toContainText(betaCompany.nature_juridique!);
  await expect(search.detailContent).toContainText(betaCompany.tranche_effectif_salarie!);
  await expect(search.detailContent).toContainText(betaCompany.date_creation!);
  await expect(search.detailContent).toContainText(betaCompany.matching_etablissements![0].siret);
  await expect(search.detailContent).not.toContainText(alphaCompany.nom_complet);
  await expect(search.detailContent).not.toContainText(alphaCompany.siege!.siret!);
  await expect(search.detailContent).not.toContainText(alphaCompany.nature_juridique!);
});

test.fixme('TC-DETAIL-002 @regression BUG-004 neutralise les informations facultatives absentes', async ({
  page,
}) => {
  // Couvre US-DETAIL-01 / AC-03, AC-05
  // Défaut connu : defects/BUG-004-missing-status-displayed-as-closed.md
  await page.route(API_PATTERN, (route) =>
    mockJson(route, detailSearchResponse([partialBetaCompany])),
  );
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('entreprise partielle');

  await search.openCompanyDetail(partialBetaCompany.siren);

  await expect(search.detailView).toBeVisible();
  await expect(search.detailContent).toContainText('Activité non renseignée');
  await expect(search.detailContent).toContainText('Non renseignée');
  await expect(search.detailContent).toContainText('Non renseigné');
  await expect(search.detailContent).toContainText('Localisation');
  await expect(search.detailContent).toContainText('Adresse non renseignée');
  await expect(search.detailContent).toContainText('Aucun établissement pour ce filtre.');
  await expect(search.detailContent).not.toContainText(/undefined|null|\[object Object\]/);
  await expect(search.detailContent).not.toContainText(/erreur|exception/i);
  await expect(search.detailContent).not.toContainText('Cessée');
  await expect(search.detailView.locator('.detail-main .status')).toContainText(
    /non renseign[eé]e?/i,
  );
});

test('TC-DETAIL-003 @positive conserve le contexte après retour depuis la fiche', async ({
  page,
}) => {
  // Couvre US-DETAIL-01 / AC-06, AC-07, contribution AC-09
  const requests: URL[] = [];
  await routeResponses(
    page,
    [
      detailSearchResponse([alphaCompany], { page: 1, totalResults: 40 }),
      detailSearchResponse([betaCompany, alphaCompany], { page: 2, totalResults: 40 }),
    ],
    requests,
  );
  const search = new SearchPage(page);
  await search.goto();
  await search.showAdvancedFilters();
  await search.postalCodeFilter.fill('75011');
  await search.submit('contexte détail');
  await search.selectSort('name-desc');
  await search.nextPageButton.click();
  await expect(search.companyCard(betaCompany.siren)).toBeVisible();

  const sirensBefore = await search.visibleSirens();
  await expect(search.pageLabel).toHaveText('Page 2 / 2');
  const queryBefore = await search.queryInput.inputValue();
  const postalCodeBefore = await search.postalCodeFilter.inputValue();
  const sortBefore = await search.sortSelect.inputValue();
  const requestsBefore = requests.length;

  await search.openCompanyDetail(betaCompany.siren);
  await expect(search.detailView).toBeVisible();
  expect(requests).toHaveLength(requestsBefore);
  await search.backToResults();

  await expect(search.searchView).toBeVisible();
  expect(requests).toHaveLength(requestsBefore);
  await expect.poll(() => search.visibleSirens()).toEqual(sirensBefore);
  await expect(search.pageLabel).toHaveText('Page 2 / 2');
  await expect(search.queryInput).toHaveValue(queryBefore);
  await expect(search.postalCodeFilter).toHaveValue(postalCodeBefore);
  await expect(search.sortSelect).toHaveValue(sortBefore);
});

test('TC-DETAIL-004 @regression utilise uniquement la réponse de recherche courante', async ({
  page,
}) => {
  // Couvre US-DETAIL-01 / AC-04, AC-08
  const requests: URL[] = [];
  await routeResponses(
    page,
    [detailSearchResponse([alphaCompany]), detailSearchResponse([betaCompany])],
    requests,
  );
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('premier ensemble');
  await search.openCompanyDetail(alphaCompany.siren);
  await expect(search.detailContent).toContainText(alphaCompany.siege!.siret!);
  await expect(search.detailContent).toContainText(alphaCompany.nature_juridique!);
  await search.backToResults();

  await search.submit('second ensemble');
  await expect(search.companyCard(betaCompany.siren)).toBeVisible();
  await expect(search.companyCard(alphaCompany.siren)).toHaveCount(0);
  const requestsBeforeOpeningBeta = requests.length;
  await search.openCompanyDetail(betaCompany.siren);

  await expect(search.detailContent).toContainText(betaCompany.nom_complet);
  await expect(search.detailContent).toContainText(betaCompany.siege!.siret!);
  await expect(search.detailContent).toContainText(betaCompany.nature_juridique!);
  await expect(search.detailContent).not.toContainText(alphaCompany.nom_complet);
  await expect(search.detailContent).not.toContainText(alphaCompany.siege!.siret!);
  expect(requests).toHaveLength(requestsBeforeOpeningBeta);
});

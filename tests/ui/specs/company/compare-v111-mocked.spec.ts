import { expect, test, type Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { compareCompanies, compareSearchResponse } from '../../../mocks/compare-results';
import { SearchPage } from '../../pages/search.page';

const API_PATTERN = 'https://recherche-entreprises.api.gouv.fr/search**';

async function prepare(page: Page) {
  await page.route(API_PATTERN, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', json: compareSearchResponse }),
  );
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('comparaison v111');
  return search;
}
async function add(search: SearchPage, count: number) {
  for (const company of compareCompanies.slice(0, count))
    await search.companyCompareButton(company.siren).click();
}

test.beforeEach(async () => {
  await allure.epic('French Companies Explorer');
  await allure.feature('FEAT-COMPARE-V111');
  await allure.story('US-COMPARE-02 — Comparer jusqu’à trois entreprises');
});

test('TC-COMPARE-007 @positive affiche l’état avec une entreprise', async ({ page }) => {
  const search = await prepare(page);
  await add(search, 1);
  await search.openCompare();
  await expect(search.comparePanel(compareCompanies[0].siren)).toBeVisible();
  await expect(search.compareView).toContainText('Ajoute une seconde entreprise.');
});

test('TC-COMPARE-008 @positive compare deux entreprises', async ({ page }) => {
  const search = await prepare(page);
  await add(search, 2);
  await search.openCompare();
  await expect(search.compareTable).toBeVisible();
  await expect(search.compareTable.locator('thead th')).toHaveCount(3);
});

test('TC-COMPARE-009 @regression associe trois colonnes à trois entreprises', async ({ page }) => {
  const search = await prepare(page);
  await add(search, 3);
  await search.openCompare();
  await expect(search.compareTable.locator('thead th')).toHaveText([
    'Critère',
    ...compareCompanies.slice(0, 3).map((c) => c.nom_complet),
  ]);
  for (const company of compareCompanies.slice(0, 3))
    await expect(await search.compareCell('SIREN', company.nom_complet)).toHaveText(company.siren);
});

test('TC-COMPARE-010 @negative refuse la quatrième avec feedback', async ({ page }) => {
  const search = await prepare(page);
  await add(search, 3);
  await search.companyCompareButton(compareCompanies[3].siren).click();
  await expect(search.toast).toHaveText('La comparaison est limitée à trois entreprises.');
  await expect(
    search.compareView.locator('article.compare-panel').filter({ hasText: /SIREN/ }),
  ).toHaveCount(3);
  await expect(search.comparePanel(compareCompanies[3].siren)).toHaveCount(0);
});

test('TC-COMPARE-011 @regression retire la colonne médiane sans désalignement', async ({
  page,
}) => {
  const search = await prepare(page);
  await add(search, 3);
  await search.openCompare();
  await search.compareRemoveButton(compareCompanies[1].siren).click();
  await expect(search.compareTable.locator('thead th')).toHaveText([
    'Critère',
    compareCompanies[0].nom_complet,
    compareCompanies[2].nom_complet,
  ]);
  await expect(await search.compareCell('SIREN', compareCompanies[2].nom_complet)).toHaveText(
    compareCompanies[2].siren,
  );
});

test('TC-COMPARE-012 @regression garde les données manquantes neutres', async ({ page }) => {
  const search = await prepare(page);
  await search.companyCompareButton(compareCompanies[0].siren).click();
  await search.companyCompareButton(compareCompanies[3].siren).click();
  await search.openCompare();
  await expect(await search.compareCell('Statut', compareCompanies[3].nom_complet)).toContainText(
    /Non renseigné|—/,
  );
  await expect(search.compareView).not.toContainText(/undefined|null|Cessée/);
});

test('TC-COMPARE-013 @accessibility signale les différences sans couleur seule', async ({
  page,
}) => {
  const search = await prepare(page);
  await add(search, 2);
  await search.openCompare();
  await expect(search.compareTable.getByText('— valeurs différentes').first()).toHaveClass(
    /sr-only/,
  );
});

test('TC-COMPARE-014 @regression persiste trois entreprises dans localStorage', async ({
  page,
}) => {
  const search = await prepare(page);
  await add(search, 3);
  expect(
    await page.evaluate(() =>
      JSON.parse(localStorage.getItem('fce_compare') ?? '[]').map(
        (item: { siren: string }) => item.siren,
      ),
    ),
  ).toEqual(compareCompanies.slice(0, 3).map((c) => c.siren));
  await page.reload();
  await search.openCompare();
  await expect(search.compareTable.locator('thead th')).toHaveCount(4);
});

test('TC-COMPARE-015 @accessibility nomme chaque bouton Retirer', async ({ page }) => {
  const search = await prepare(page);
  await add(search, 3);
  await search.openCompare();
  for (const company of compareCompanies.slice(0, 3))
    await expect(
      page.getByRole('button', { name: `Retirer ${company.nom_complet} de la comparaison` }),
    ).toBeVisible();
});

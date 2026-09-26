import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { compareCompanies, compareSearchResponse } from '../../../mocks/compare-results';
import { SearchPage } from '../../pages/search.page';

const API_PATTERN = 'https://recherche-entreprises.api.gouv.fr/search**';

async function prepare(page: Page, response: unknown = compareSearchResponse) {
  await page.route(API_PATTERN, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', json: response }),
  );
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('Export Équipe');
  await expect(search.companyCards).not.toHaveCount(0);
  return search;
}
async function download(
  page: Page,
  search: SearchPage,
  format: 'csv' | 'json',
  scope: 'results' | 'compare' = 'results',
) {
  await search.configureExport(format, scope);
  const event = page.waitForEvent('download');
  await search.confirmExportButton.click();
  const item = await event;
  const path = await item.path();
  if (!path) throw new Error('Téléchargement indisponible');
  return { name: item.suggestedFilename(), text: await readFile(path, 'utf8') };
}

test.beforeEach(async () => {
  await allure.epic('French Companies Explorer');
  await allure.feature('FEAT-EXPORT-V111');
  await allure.story('US-EXPORT-02 — Configurer le format et le périmètre d’export');
});

test('TC-EXPORT-007 @positive configure un export CSV', async ({ page }) => {
  const search = await prepare(page);
  await search.configureExport('csv');
  await expect(search.exportFormat).toHaveValue('csv');
  await expect(search.exportScope).toHaveValue('results');
  await expect(search.confirmExportButton).toBeEnabled();
});

test('TC-EXPORT-008 @regression exporte le JSON sans ordre de propriétés imposé', async ({
  page,
}) => {
  const search = await prepare(page);
  const { text } = await download(page, search, 'json');
  const first = JSON.parse(text)[0] as Record<string, unknown>;
  expect(first).toMatchObject({
    siren: compareCompanies[0].siren,
    name: compareCompanies[0].nom_complet,
  });
  expect(new Set(Object.keys(first))).toEqual(
    new Set([
      'siren',
      'name',
      'activity',
      'activityLabel',
      'status',
      'creation',
      'legal',
      'category',
      'workforce',
      'siret',
      'address',
      'postalCode',
      'city',
      'matchingEstablishments',
    ]),
  );
});

test('TC-EXPORT-009 @positive exporte uniquement les entreprises comparées', async ({ page }) => {
  const search = await prepare(page);
  await search.companyCompareButton(compareCompanies[0].siren).click();
  await search.companyCompareButton(compareCompanies[2].siren).click();
  const { text } = await download(page, search, 'json', 'compare');
  expect((JSON.parse(text) as { siren: string }[]).map((item) => item.siren)).toEqual([
    compareCompanies[0].siren,
    compareCompanies[2].siren,
  ]);
});

test('TC-EXPORT-010 @regression échappe séparateur, guillemets, ligne et accents', async ({
  page,
}) => {
  const special = { ...compareCompanies[0], nom_complet: 'École; "Alpha"\nLyon' };
  const search = await prepare(page, { results: [special], total_results: 1 });
  const { text } = await download(page, search, 'csv');
  expect(text).toContain('"École; ""Alpha""\nLyon"');
  expect(text.startsWith('\uFEFF')).toBe(true);
});

test('TC-EXPORT-011 @regression neutralise les quatre préfixes CSV après espaces', async ({
  page,
}) => {
  const dangerous = ['=1+1', ' +SUM(A1)', '  -10', '\t@cmd'].map((name, index) => ({
    ...compareCompanies[0],
    siren: `90000000${index}`,
    nom_complet: name,
  }));
  const search = await prepare(page, { results: dangerous, total_results: 4 });
  const { text } = await download(page, search, 'csv');
  for (const value of dangerous.map((item) => item.nom_complet))
    expect(text).toContain(`'${value}`);
});

test('TC-EXPORT-012 @regression exporte les valeurs manquantes de façon neutre', async ({
  page,
}) => {
  const missing = { siren: '900000099', nom_complet: 'Sans données', siege: {} };
  const search = await prepare(page, { results: [missing], total_results: 1 });
  const { text } = await download(page, search, 'csv');
  expect(text).toContain('"Non renseigné"');
  expect(text).not.toMatch(/undefined|null/);
});

test('TC-EXPORT-013 @regression produit un nom déterministe et la bonne extension', async ({
  page,
}) => {
  const search = await prepare(page);
  const json = await download(page, search, 'json');
  expect(json.name).toBe('entreprises-results-export-equipe.json');
});

test('TC-EXPORT-014 @negative désactive le téléchargement sans résultat', async ({ page }) => {
  await page.route(API_PATTERN, (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: { results: [], total_results: 0 },
    }),
  );
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('vide');
  await search.configureExport('csv');
  await expect(search.confirmExportButton).toBeDisabled();
  await expect(search.exportHelp).toHaveText('Aucun résultat courant exportable.');
});

test('TC-EXPORT-015 @regression désactive l’export pendant une recherche', async ({ page }) => {
  let release: (() => void) | undefined;
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  let count = 0;
  await page.route(API_PATTERN, async (route) => {
    if (new URL(route.request().url()).searchParams.get('minimal') === 'true') {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        json: { results: [] },
      });
      return;
    }
    count += 1;
    if (count === 2) await held;
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: compareSearchResponse,
    });
  });
  const search = new SearchPage(page);
  await search.goto();
  await search.submit('Alpha');
  await expect(search.companyCards).not.toHaveCount(0);
  await search.submit('Beta');
  await expect(search.searchState).toHaveText('Recherche en cours…');
  await expect(search.openExportButton).toBeDisabled();
  release?.();
  await expect(search.companyCards).not.toHaveCount(0);
});

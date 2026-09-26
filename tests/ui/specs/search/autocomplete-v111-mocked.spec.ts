import { expect, test, type Page, type Route } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { SearchPage } from '../../pages/search.page';

const API_PATTERN = 'https://recherche-entreprises.api.gouv.fr/search**';
const company = (name: string, siren: string, city = 'Paris') => ({
  siren,
  nom_complet: name,
  etat_administratif: 'A',
  siege: { libelle_commune: city },
});
const alpha = company('Alpha Conseil', '111111111');
const beta = company('Beta Industrie', '222222222', 'Lyon');

async function mockSuggestions(page: Page, results = [alpha, beta]) {
  const queries: string[] = [];
  await page.route(API_PATTERN, (route) => {
    const url = new URL(route.request().url());
    queries.push(url.searchParams.get('q') ?? '');
    return route.fulfill({ status: 200, contentType: 'application/json', json: { results } });
  });
  return queries;
}

test.beforeEach(async () => {
  await allure.epic('French Companies Explorer');
  await allure.feature('FEAT-AUTOCOMPLETE-V111');
  await allure.story('US-AUTOCOMPLETE-01 — Recevoir des suggestions accessibles');
});

test('TC-AUTO-001 @regression respecte le seuil minimum', async ({ page }) => {
  const queries = await mockSuggestions(page);
  const search = new SearchPage(page);
  await search.goto();
  await search.queryInput.fill('Al');
  await expect(search.queryInput).toHaveAttribute('aria-expanded', 'false');
  expect(queries).toHaveLength(0);
});

test('TC-AUTO-002 @regression applique le debounce sans requêtes intermédiaires', async ({
  page,
}) => {
  const queries = await mockSuggestions(page);
  const search = new SearchPage(page);
  await search.goto();
  await search.queryInput.pressSequentially('Alpha');
  await expect(search.companySuggestions.getByRole('option')).toHaveCount(2);
  expect(queries).toEqual(['Alpha']);
});

test('TC-AUTO-003 @positive affiche nom, SIREN et ville', async ({ page }) => {
  await mockSuggestions(page);
  const search = new SearchPage(page);
  await search.goto();
  await search.queryInput.fill('Alp');
  const option = search.companySuggestions.getByRole('option').first();
  await expect(option).toContainText('Alpha Conseil');
  await expect(option).toContainText('SIREN 111111111');
  await expect(option).toContainText('Paris');
});

test('TC-AUTO-004 @accessibility expose navigation clavier et états ARIA', async ({ page }) => {
  await mockSuggestions(page);
  const search = new SearchPage(page);
  await search.goto();
  await search.queryInput.fill('Alp');
  await expect(search.queryInput).toHaveAttribute('aria-expanded', 'true');
  await search.queryInput.press('ArrowDown');
  await expect(search.companySuggestions.getByRole('option').first()).toHaveAttribute(
    'aria-selected',
    'true',
  );
  await expect(search.queryInput).toHaveAttribute('aria-activedescendant', 'company-option-0');
});

test('TC-AUTO-005 @positive sélectionne une suggestion avec Entrée', async ({ page }) => {
  await mockSuggestions(page);
  const search = new SearchPage(page);
  await search.goto();
  await search.queryInput.fill('Alp');
  await expect(search.companySuggestions.getByRole('option').first()).toBeVisible();
  await search.queryInput.press('ArrowDown');
  await search.queryInput.press('Enter');
  await expect(search.queryInput).toHaveValue('Alpha Conseil');
  await expect(search.companyCard(alpha.siren)).toBeVisible();
});

test('TC-AUTO-006 @accessibility Escape ferme la liste', async ({ page }) => {
  await mockSuggestions(page);
  const search = new SearchPage(page);
  await search.goto();
  await search.queryInput.fill('Alp');
  await expect(search.companySuggestions.getByRole('option').first()).toBeVisible();
  await search.queryInput.press('Escape');
  await expect(search.queryInput).toHaveAttribute('aria-expanded', 'false');
  await expect(search.companySuggestions).toBeHidden();
});

test('TC-AUTO-007 @regression annonce une absence de suggestion', async ({ page }) => {
  await mockSuggestions(page, []);
  const search = new SearchPage(page);
  await search.goto();
  await search.queryInput.fill('Inconnu');
  await expect(search.companySuggestions.getByRole('status')).toHaveText('Aucune suggestion.');
});

test('TC-AUTO-008 @error laisse la recherche classique disponible après erreur réseau', async ({
  page,
}) => {
  let call = 0;
  await page.route(API_PATTERN, (route) => {
    call += 1;
    if (call === 1) return route.abort('failed');
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: { results: [alpha], total_results: 1 },
    });
  });
  const search = new SearchPage(page);
  await search.goto();
  await search.queryInput.fill('Alpha');
  await expect(search.companySuggestions.getByRole('status')).toContainText(
    'Suggestions indisponibles',
  );
  await search.searchButton.click();
  await expect(search.companyCard(alpha.siren)).toBeVisible();
});

test('TC-AUTO-009 @regression conserve B quand A répond tardivement', async ({ page }) => {
  let releaseA: (() => void) | undefined;
  const aHeld = new Promise<void>((resolve) => {
    releaseA = resolve;
  });
  let signalA: (() => void) | undefined;
  const aStarted = new Promise<void>((resolve) => {
    signalA = resolve;
  });
  await page.route(API_PATTERN, async (route: Route) => {
    const query = new URL(route.request().url()).searchParams.get('q');
    if (query === 'Alpha') {
      signalA?.();
      await aHeld;
      await route
        .fulfill({ status: 200, contentType: 'application/json', json: { results: [alpha] } })
        .catch(() => undefined);
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      json: { results: [beta] },
    });
  });
  const search = new SearchPage(page);
  await search.goto();
  await search.queryInput.fill('Alpha');
  await aStarted;
  await search.queryInput.fill('Beta');
  await expect(search.companySuggestions).toContainText('Beta Industrie');
  releaseA?.();
  await expect(search.companySuggestions).toContainText('Beta Industrie');
  await expect(search.companySuggestions).not.toContainText('Alpha Conseil');
});

test('TC-AUTO-010 @negative ne lance pas d’autocomplétion pour SIREN/SIRET', async ({ page }) => {
  const queries = await mockSuggestions(page);
  const search = new SearchPage(page);
  await search.goto();
  await search.queryInput.fill('123456789');
  await expect(search.queryInput).toHaveAttribute('aria-expanded', 'false');
  await search.queryInput.fill('12345678901234');
  await expect(search.queryInput).toHaveAttribute('aria-expanded', 'false');
  expect(queries).toEqual([]);
});

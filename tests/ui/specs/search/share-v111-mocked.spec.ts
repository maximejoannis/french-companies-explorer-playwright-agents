import { expect, test, type Page } from '@playwright/test';
import * as allure from 'allure-js-commons';
import { mockedSearchResponse } from '../../../mocks/search-results';
import { SearchPage } from '../../pages/search.page';

const API_PATTERN = 'https://recherche-entreprises.api.gouv.fr/search**';

async function prepare(page: Page, clipboardFails = false, fallback = true) {
  await page.addInitScript(
    ({ fails, fallbackResult }) => {
      const writes: string[] = [];
      Object.defineProperty(window, '__clipboardWrites', { value: writes });
      Object.defineProperty(navigator, 'clipboard', {
        configurable: true,
        value: {
          writeText: async (text: string) => {
            if (fails) throw new Error('denied');
            writes.push(text);
          },
        },
      });
      Object.defineProperty(document, 'execCommand', {
        configurable: true,
        value: () => fallbackResult,
      });
    },
    { fails: clipboardFails, fallbackResult: fallback },
  );
  await page.route(API_PATTERN, (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', json: mockedSearchResponse }),
  );
  const search = new SearchPage(page);
  await search.goto();
  return search;
}

async function clipboardWrites(page: Page) {
  return page.evaluate(
    () => (window as unknown as { __clipboardWrites: string[] }).__clipboardWrites,
  );
}

test.beforeEach(async () => {
  await allure.epic('French Companies Explorer');
  await allure.feature('FEAT-SHARE-V111');
  await allure.story('US-SHARE-01 — Copier et restaurer un lien de recherche');
});

test('TC-SHARE-001 @positive copie une URL simple', async ({ page }) => {
  const search = await prepare(page);
  await search.submit('Alpha');
  await search.shareSearchButton.click();
  const url = new URL((await clipboardWrites(page))[0]);
  expect(url.searchParams.get('q')).toBe('Alpha');
});

test('TC-SHARE-002 @positive copie une combinaison de critères', async ({ page }) => {
  const search = await prepare(page);
  await search.showAdvancedFilters();
  await search.nafFilter.fill('56.10A');
  await search.regionFilter.fill('11');
  await search.statusFilter.selectOption('A');
  await search.submit('Alpha');
  await search.shareSearchButton.click();
  const url = new URL((await clipboardWrites(page))[0]);
  expect(Object.fromEntries(url.searchParams)).toMatchObject({
    q: 'Alpha',
    naf: '56.10A',
    region: '11',
    status: 'A',
  });
});

test('TC-SHARE-003 @regression restaure la recherche depuis le lien', async ({ page }) => {
  const search = await prepare(page);
  await page.goto('./?q=Alpha&naf=56.10A&region=11');
  await expect(search.companyCards).not.toHaveCount(0);
  await expect(search.queryInput).toHaveValue('Alpha');
  await expect(search.nafFilter).toHaveValue('56.10A');
  await expect(search.regionFilter).toHaveValue('11');
});

test('TC-SHARE-004 @regression encode accents et espaces sans perte', async ({ page }) => {
  const search = await prepare(page);
  await search.submit('École des métiers');
  await search.shareSearchButton.click();
  const url = new URL((await clipboardWrites(page))[0]);
  expect(url.searchParams.get('q')).toBe('École des métiers');
});

test('TC-SHARE-005 @regression utilise navigator.clipboard.writeText', async ({ page }) => {
  const search = await prepare(page);
  await search.submit('Clipboard');
  await search.shareSearchButton.click();
  expect(await clipboardWrites(page)).toHaveLength(1);
});

test('TC-SHARE-006 @error applique le fallback Clipboard sans crash', async ({ page }) => {
  const search = await prepare(page, true, true);
  await search.submit('Fallback');
  await search.shareSearchButton.click();
  await expect(search.toast).toHaveText('Lien de la recherche copié.');
  await expect(search.searchView).toBeVisible();
});

test('TC-SHARE-007 @accessibility expose le feedback par live region', async ({ page }) => {
  const search = await prepare(page);
  await search.submit('Feedback');
  await search.shareSearchButton.click();
  await expect(search.toast).toHaveAttribute('role', 'status');
  await expect(search.toast).toHaveAttribute('aria-live', 'polite');
  await expect(search.toast).toHaveText('Lien de la recherche copié.');
});

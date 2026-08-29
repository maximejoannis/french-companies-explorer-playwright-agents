import type { Page } from '@playwright/test';

export class SearchPage {
  readonly queryInput;
  readonly queryHint;
  readonly searchButton;
  readonly searchState;
  readonly resultCount;
  readonly resultsGrid;
  readonly pagination;

  constructor(readonly page: Page) {
    this.queryInput = page.getByLabel('Recherche d’entreprise');
    this.queryHint = page.locator('#queryHint');
    this.searchButton = page.getByRole('button', { name: 'Rechercher' });
    this.searchState = page.locator('#searchState');
    this.resultCount = page.getByRole('status');
    this.resultsGrid = page.getByTestId('results-grid');
    this.pagination = page.locator('#pagination');
  }

  async goto() {
    await this.page.goto('./');
    await this.page.getByRole('button', { name: 'Recherche', exact: true }).click();
  }

  async submit(query: string) {
    await this.queryInput.fill(query);
    await this.searchButton.click();
  }

  companyCard(siren: string) {
    return this.page.getByTestId(`company-card-${siren}`);
  }
}

import type { Page } from '@playwright/test';

export class SearchPage {
  readonly queryInput;
  readonly queryHint;
  readonly searchButton;
  readonly searchState;
  readonly resultCount;
  readonly resultsGrid;
  readonly pagination;
  readonly postalCodeFilter;
  readonly cityFilter;
  readonly statusFilter;
  readonly activeFilters;
  readonly previousPageButton;
  readonly nextPageButton;
  readonly pageLabel;
  readonly resultsPerPageFilter;

  constructor(readonly page: Page) {
    this.queryInput = page.getByLabel('Recherche d’entreprise');
    this.queryHint = page.locator('#queryHint');
    this.searchButton = page.getByRole('button', { name: 'Rechercher' });
    this.searchState = page.locator('#searchState');
    this.resultCount = page.getByRole('status');
    this.resultsGrid = page.getByTestId('results-grid');
    this.pagination = page.locator('#pagination');
    this.postalCodeFilter = page.getByRole('textbox', { name: 'Code postal', exact: true });
    this.cityFilter = page.getByRole('textbox', { name: 'Commune', exact: true });
    this.statusFilter = page.getByRole('combobox', { name: 'État', exact: true });
    this.activeFilters = page.getByTestId('active-filters');
    this.previousPageButton = page.getByRole('button', { name: 'Précédent' });
    this.nextPageButton = page.getByRole('button', { name: 'Suivant' });
    this.pageLabel = this.pagination.getByText(/^Page \d+ \/ \d+$/);
    this.resultsPerPageFilter = page.getByRole('combobox', {
      name: 'Résultats / page',
      exact: true,
    });
  }

  async goto() {
    await this.page.goto('./');
    await this.page.getByRole('button', { name: 'Recherche', exact: true }).click();
  }

  async submit(query: string) {
    await this.queryInput.fill(query);
    await this.searchButton.click();
  }

  async showAdvancedFilters() {
    await this.page.getByText('Filtres avancés', { exact: true }).click();
  }

  async selectPageSize(size: string) {
    await this.resultsPerPageFilter.selectOption(size);
  }

  companyCard(siren: string) {
    return this.page.getByTestId(`company-card-${siren}`);
  }
}

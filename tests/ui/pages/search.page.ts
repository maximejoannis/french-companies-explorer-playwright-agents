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
  readonly sortSelect;
  readonly companyCards;
  readonly searchView;
  readonly detailView;
  readonly detailContent;
  readonly backToResultsButton;

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
    this.sortSelect = page.getByRole('combobox', { name: 'Trier par', exact: true });
    this.companyCards = this.resultsGrid.locator('[data-testid^="company-card-"]');
    this.searchView = page.locator('#searchView');
    this.detailView = page.locator('#detailView');
    this.detailContent = this.detailView;
    this.backToResultsButton = page.getByRole('button', { name: '← Retour aux résultats' });
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

  async selectSort(value: string) {
    await this.sortSelect.selectOption(value);
  }

  async visibleSirens() {
    const testIds = await this.companyCards.evaluateAll((cards) =>
      cards.map((card) => card.getAttribute('data-testid')),
    );
    return testIds.map((testId) => testId?.replace('company-card-', '') ?? '');
  }

  companyCard(siren: string) {
    return this.page.getByTestId(`company-card-${siren}`);
  }

  async openCompanyDetail(siren: string) {
    await this.companyCard(siren).getByRole('button', { name: 'Voir la fiche' }).click();
  }

  async backToResults() {
    await this.backToResultsButton.click();
  }
}

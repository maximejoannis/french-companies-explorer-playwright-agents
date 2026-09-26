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
  readonly nafFilter;
  readonly departmentFilter;
  readonly regionFilter;
  readonly workforceFilter;
  readonly citySuggestions;
  readonly companySuggestions;
  readonly activeFilters;
  readonly previousPageButton;
  readonly nextPageButton;
  readonly pageLabel;
  readonly resultsPerPageFilter;
  readonly sortSelect;
  readonly companyCards;
  readonly searchView;
  readonly searchNavigationButton;
  readonly detailView;
  readonly detailContent;
  readonly backToResultsButton;
  readonly favoritesView;
  readonly favoritesNavigationButton;
  readonly clearSearchButton;
  readonly statsPanel;
  readonly compareView;
  readonly compareNavigationButton;
  readonly compareTable;
  readonly toast;
  readonly historyView;
  readonly historyNavigationButton;
  readonly historyList;
  readonly clearHistoryButton;
  readonly saveSearchButton;
  readonly savedSearchesList;
  readonly shareSearchButton;
  readonly openExportButton;
  readonly exportDialog;
  readonly exportFormat;
  readonly exportScope;
  readonly confirmExportButton;
  readonly exportHelp;

  constructor(readonly page: Page) {
    this.queryInput = page.getByLabel('Recherche d’entreprise');
    this.queryHint = page.locator('#queryHint');
    this.searchButton = page.getByRole('button', { name: 'Rechercher' });
    this.searchState = page.locator('#searchState');
    this.resultCount = page.getByRole('status');
    this.resultsGrid = page.getByTestId('results-grid');
    this.pagination = page.locator('#pagination');
    this.postalCodeFilter = page.locator('#postalCodeFilter');
    this.cityFilter = page.locator('#cityFilter');
    this.statusFilter = page.locator('#statusFilter');
    this.nafFilter = page.locator('#nafFilter');
    this.departmentFilter = page.locator('#departmentFilter');
    this.regionFilter = page.locator('#regionFilter');
    this.workforceFilter = page.locator('#workforceFilter');
    this.citySuggestions = page.getByRole('listbox', { name: 'Suggestions de communes' });
    this.companySuggestions = page.getByRole('listbox', {
      name: 'Suggestions d’entreprises',
    });
    this.activeFilters = page.getByTestId('active-filters');
    this.previousPageButton = page.getByRole('button', { name: 'Précédent' });
    this.nextPageButton = page.getByRole('button', { name: 'Suivant' });
    this.pageLabel = this.pagination.getByText(/^Page \d+ \/ \d+$/);
    this.resultsPerPageFilter = page.locator('#pageSizeFilter');
    this.sortSelect = page.getByRole('combobox', { name: 'Trier par', exact: true });
    this.companyCards = this.resultsGrid.locator('[data-testid^="company-card-"]');
    this.searchView = page.locator('#searchView');
    this.searchNavigationButton = page.getByRole('button', { name: 'Recherche', exact: true });
    this.detailView = page.locator('#detailView');
    this.detailContent = this.detailView;
    this.backToResultsButton = page.getByRole('button', { name: '← Retour aux résultats' });
    this.favoritesView = page.locator('#favoritesView');
    this.favoritesNavigationButton = page.getByRole('button', { name: 'Favoris', exact: true });
    this.clearSearchButton = page.getByRole('button', { name: 'Réinitialiser', exact: true });
    this.statsPanel = page.getByTestId('results-stats');
    this.compareView = page.locator('#compareView');
    this.compareNavigationButton = page
      .getByRole('navigation')
      .getByRole('button', { name: 'Comparer', exact: true });
    this.compareTable = this.compareView.locator('table');
    this.toast = page.locator('#toast');
    this.historyView = page.locator('#historyView');
    this.historyNavigationButton = page
      .getByRole('navigation')
      .getByRole('button', { name: 'Historique', exact: true });
    this.historyList = this.historyView.locator('#historyList');
    this.clearHistoryButton = this.historyView.getByRole('button', {
      name: 'Effacer',
      exact: true,
    });
    this.saveSearchButton = page.getByRole('button', {
      name: 'Sauvegarder la recherche',
      exact: true,
    });
    this.savedSearchesList = this.historyView.locator('#savedSearchesList');
    this.shareSearchButton = page.getByRole('button', {
      name: 'Copier le lien de cette recherche',
      exact: true,
    });
    this.openExportButton = page.getByRole('button', {
      name: 'Configurer l’export',
      exact: true,
    });
    this.exportDialog = page.getByRole('dialog', { name: 'Configurer l’export' });
    this.exportFormat = this.exportDialog.getByRole('combobox', { name: 'Format' });
    this.exportScope = this.exportDialog.getByRole('combobox', { name: 'Périmètre' });
    this.confirmExportButton = this.exportDialog.getByRole('button', { name: 'Télécharger' });
    this.exportHelp = this.exportDialog.locator('#exportHelp');
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

  companyFavoriteButton(siren: string) {
    return this.companyCard(siren).getByRole('button', { name: /favoris/ });
  }

  companyCompareButton(siren: string) {
    return this.companyCard(siren).getByRole('button', { name: 'Comparer', exact: true });
  }

  detailFavoriteButton() {
    return this.detailView.getByRole('button', { name: /favoris/ });
  }

  detailCompareButton() {
    return this.detailView.getByRole('button', { name: 'Comparer', exact: true });
  }

  favoriteCard(siren: string) {
    return this.favoritesView.locator('article.company').filter({ hasText: `SIREN ${siren}` });
  }

  favoriteCardButton(siren: string) {
    return this.favoriteCard(siren).getByRole('button', { name: /favoris/ });
  }

  favoriteCardCompareButton(siren: string) {
    return this.favoriteCard(siren).getByRole('button', { name: 'Comparer', exact: true });
  }

  comparePanel(siren: string) {
    return this.compareView.locator('article.compare-panel').filter({ hasText: `SIREN ${siren}` });
  }

  compareRemoveButton(siren: string) {
    return this.comparePanel(siren).getByRole('button', { name: /Retirer .* de la comparaison/ });
  }

  async compareCell(rowLabel: string, companyName: string) {
    const headers = await this.compareTable.locator('thead th').allTextContents();
    const columnIndex = headers.findIndex((header) => header.trim() === companyName);
    if (columnIndex < 1) throw new Error(`Colonne Compare introuvable : ${companyName}`);

    return this.compareTable
      .getByRole('row')
      .filter({ has: this.page.getByRole('rowheader', { name: new RegExp(`^${rowLabel}`) }) })
      .getByRole('cell')
      .nth(columnIndex - 1);
  }

  historyEntry(query: string, visibleCriteria?: string) {
    let entry = this.historyList
      .locator('article')
      .filter({ has: this.page.getByText(query, { exact: true }) });
    if (visibleCriteria !== undefined) entry = entry.filter({ hasText: visibleCriteria });
    return entry;
  }

  historyRelaunchButton(query: string, visibleCriteria?: string) {
    return this.historyEntry(query, visibleCriteria).getByRole('button', {
      name: 'Relancer',
      exact: true,
    });
  }

  savedSearchEntry(name: string, query: string) {
    return this.savedSearchesList
      .locator('article')
      .filter({ has: this.page.getByText(name, { exact: true }) })
      .filter({ has: this.page.getByText(query, { exact: true }) });
  }

  savedSearchLaunchButton(name: string, query: string) {
    return this.savedSearchEntry(name, query).getByRole('button', {
      name: 'Lancer',
      exact: true,
    });
  }

  savedSearchDeleteButton(name: string, query: string) {
    return this.savedSearchEntry(name, query).getByRole('button', {
      name: `Supprimer la recherche ${name}`,
      exact: true,
    });
  }

  statsBlock(label: string) {
    return this.statsPanel.locator('article').filter({ hasText: label });
  }

  async openCompanyDetail(siren: string) {
    await this.companyCard(siren).getByRole('button', { name: 'Voir la fiche' }).click();
  }

  async backToResults() {
    await this.backToResultsButton.click();
  }

  async openFavorites() {
    await this.favoritesNavigationButton.click();
  }

  async openCompare() {
    await this.compareNavigationButton.click();
  }

  async openSearch() {
    await this.searchNavigationButton.click();
  }

  async openHistory() {
    await this.historyNavigationButton.click();
  }

  async selectCitySuggestion(name: string) {
    await this.citySuggestions.getByRole('option', { name: new RegExp(name, 'i') }).click();
  }

  async configureExport(format: 'csv' | 'json', scope: 'results' | 'compare' = 'results') {
    await this.openExportButton.click();
    await this.exportFormat.selectOption(format);
    await this.exportScope.selectOption(scope);
  }
}

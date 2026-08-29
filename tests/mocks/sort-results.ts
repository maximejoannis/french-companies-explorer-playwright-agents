export const sortCompanies = [
  {
    siren: '410000001',
    nom_complet: 'ZULU TEST',
    etat_administratif: 'C',
    date_creation: '2019-06-15',
  },
  {
    siren: '410000002',
    nom_complet: 'alpha test',
    etat_administratif: 'A',
  },
  {
    siren: '410000003',
    nom_complet: 'ÉCLAIR TEST',
    etat_administratif: 'C',
    date_creation: '2023-11-20',
  },
  {
    siren: '410000004',
    nom_complet: 'Beta Test',
    etat_administratif: 'A',
    date_creation: '2010-02-01',
  },
] as const;

export const newSearchSortCompanies = [
  {
    siren: '420000001',
    nom_complet: 'ZETA NOUVEAU',
    etat_administratif: 'C',
    date_creation: '2022-03-10',
  },
  {
    siren: '420000002',
    nom_complet: 'ABLE NOUVEAU',
    etat_administratif: 'A',
    date_creation: '2015-08-22',
  },
] as const;

export const nextPageSortCompanies = [
  {
    siren: '430000001',
    nom_complet: 'YANKEE PAGE',
    etat_administratif: 'C',
    date_creation: '2021-01-12',
  },
  {
    siren: '430000002',
    nom_complet: 'BRAVO PAGE',
    etat_administratif: 'A',
    date_creation: '2016-04-30',
  },
] as const;

type SortCompany =
  | (typeof sortCompanies)[number]
  | (typeof newSearchSortCompanies)[number]
  | (typeof nextPageSortCompanies)[number];

export function sortSearchResponse(
  companies: readonly SortCompany[],
  options: { page?: number; perPage?: number; totalResults?: number } = {},
) {
  const page = options.page ?? 1;
  const perPage = options.perPage ?? 20;
  const totalResults = options.totalResults ?? companies.length;
  return {
    results: companies,
    total_results: totalResults,
    page,
    per_page: perPage,
    total_pages: Math.ceil(totalResults / perPage),
  };
}

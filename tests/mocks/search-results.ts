export const mockedCompanies = [
  {
    siren: '111111111',
    nom_complet: 'ALPHA SERVICES',
    etat_administratif: 'A',
    activite_principale: '62.01Z',
    libelle_activite_principale: 'Programmation informatique',
    date_creation: '2018-04-12',
    siege: {
      siret: '11111111100011',
      adresse: '10 RUE DES TESTS 75001 PARIS',
      code_postal: '75001',
      libelle_commune: 'PARIS',
    },
  },
  {
    siren: '222222222',
    nom_complet: 'BETA INDUSTRIE',
    etat_administratif: 'C',
    activite_principale: '25.62B',
    libelle_activite_principale: 'Mécanique industrielle',
    date_creation: '2005-09-30',
    siege: {
      siret: '22222222200022',
      adresse: '20 AVENUE DU MOCK 69002 LYON',
      code_postal: '69002',
      libelle_commune: 'LYON',
    },
  },
] as const;

export const mockedSearchResponse = {
  results: mockedCompanies,
  total_results: mockedCompanies.length,
};

export const emptySearchResponse = {
  results: [],
  total_results: 0,
};

export const paginationCompanies = [
  mockedCompanies[0],
  mockedCompanies[1],
  {
    siren: '333333333',
    nom_complet: 'GAMMA CONSEIL',
    etat_administratif: 'A',
    libelle_activite_principale: 'Conseil pour les affaires',
    date_creation: '2020-01-15',
    siege: {
      siret: '33333333300033',
      code_postal: '33000',
      libelle_commune: 'BORDEAUX',
    },
  },
] as const;

export function paginatedSearchResponse(
  company: (typeof paginationCompanies)[number],
  page: number,
  totalResults: number,
  perPage = 20,
) {
  return {
    results: [company],
    total_results: totalResults,
    page,
    per_page: perPage,
    total_pages: Math.ceil(totalResults / perPage),
  };
}

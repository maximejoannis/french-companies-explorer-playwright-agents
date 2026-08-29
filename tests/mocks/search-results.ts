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

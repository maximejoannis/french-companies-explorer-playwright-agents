export interface CompareCompany {
  siren: string;
  nom_complet: string;
  etat_administratif?: 'A' | 'C';
  activite_principale?: string;
  libelle_activite_principale?: string;
  date_creation?: string;
  categorie_entreprise?: string;
  tranche_effectif_salarie?: string;
  siege?: {
    siret?: string;
    adresse?: string;
    code_postal?: string;
    libelle_commune?: string;
  };
}

export const alphaCompareCompany: CompareCompany = {
  siren: '111111111',
  nom_complet: 'ALPHA COMPARAISON',
  etat_administratif: 'A',
  activite_principale: '11.11A',
  libelle_activite_principale: 'ACTIVITÉ ALPHA DISTINCTE',
  date_creation: '2001-01-11',
  categorie_entreprise: 'CATÉGORIE ALPHA',
  tranche_effectif_salarie: 'EFFECTIF ALPHA',
  siege: {
    siret: '11111111100011',
    adresse: '11 RUE ALPHA 75001 PARIS',
    code_postal: '75001',
    libelle_commune: 'VILLE ALPHA',
  },
};

export const betaCompareCompany: CompareCompany = {
  siren: '222222222',
  nom_complet: 'BÊTA COMPARAISON',
  etat_administratif: 'C',
  activite_principale: '22.22B',
  libelle_activite_principale: 'ACTIVITÉ BÊTA DISTINCTE',
  date_creation: '2002-02-22',
  categorie_entreprise: 'CATÉGORIE BÊTA',
  tranche_effectif_salarie: 'EFFECTIF BÊTA',
  siege: {
    siret: '22222222200022',
    adresse: '22 RUE BÊTA 69002 LYON',
    code_postal: '69002',
    libelle_commune: 'VILLE BÊTA',
  },
};

export const gammaCompareCompany: CompareCompany = {
  siren: '333333333',
  nom_complet: 'GAMMA COMPARAISON',
  etat_administratif: 'A',
  activite_principale: '33.33C',
  libelle_activite_principale: 'ACTIVITÉ GAMMA DISTINCTE',
  date_creation: '2003-03-03',
  categorie_entreprise: 'CATÉGORIE GAMMA',
  tranche_effectif_salarie: 'EFFECTIF GAMMA',
  siege: {
    siret: '33333333300033',
    adresse: '33 RUE GAMMA 33000 BORDEAUX',
    code_postal: '33000',
    libelle_commune: 'VILLE GAMMA',
  },
};

export const deltaCompareCompany: CompareCompany = {
  siren: '444444444',
  nom_complet: 'DELTA COMPARAISON',
};

export const compareCompanies = [
  alphaCompareCompany,
  betaCompareCompany,
  gammaCompareCompany,
  deltaCompareCompany,
];

export const compareSearchResponse = {
  results: compareCompanies,
  total_results: compareCompanies.length,
};

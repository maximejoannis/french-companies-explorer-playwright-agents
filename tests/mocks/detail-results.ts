export interface DetailCompany {
  siren: string;
  nom_complet: string;
  etat_administratif?: 'A' | 'C';
  activite_principale?: string;
  libelle_activite_principale?: string;
  date_creation?: string;
  categorie_entreprise?: string;
  nature_juridique?: string;
  tranche_effectif_salarie?: string;
  siege?: {
    siret?: string;
    adresse?: string;
    code_postal?: string;
    libelle_commune?: string;
  };
  matching_etablissements?: Array<{
    siret: string;
    adresse?: string;
    code_postal?: string;
    libelle_commune?: string;
    etat_administratif?: 'A' | 'C';
  }>;
}

export const alphaCompany: DetailCompany = {
  siren: '101010101',
  nom_complet: 'ALPHA DETAIL COMPLET',
  etat_administratif: 'A',
  activite_principale: '62.01Z',
  libelle_activite_principale: 'Programmation de scénarios synthétiques',
  date_creation: '2012-03-14',
  categorie_entreprise: 'PME-ALPHA',
  nature_juridique: 'ALPHA-JURIDIQUE',
  tranche_effectif_salarie: 'ALPHA-EFFECTIF',
  siege: {
    siret: '10101010100011',
    adresse: '11 RUE ALPHA 75011 PARIS',
    code_postal: '75011',
    libelle_commune: 'PARIS ALPHA',
  },
  matching_etablissements: [
    {
      siret: '10101010100029',
      adresse: '29 AVENUE ALPHA 75012 PARIS',
      code_postal: '75012',
      libelle_commune: 'PARIS ETABLISSEMENT ALPHA',
      etat_administratif: 'A',
    },
  ],
};

export const betaCompany: DetailCompany = {
  siren: '202020202',
  nom_complet: 'BETA DETAIL COMPLET',
  etat_administratif: 'C',
  activite_principale: '25.62B',
  libelle_activite_principale: 'Fabrication de scénarios synthétiques',
  date_creation: '2018-09-21',
  categorie_entreprise: 'ETI-BETA',
  nature_juridique: 'BETA-JURIDIQUE',
  tranche_effectif_salarie: 'BETA-EFFECTIF',
  siege: {
    siret: '20202020200022',
    adresse: '22 RUE BETA 69002 LYON',
    code_postal: '69002',
    libelle_commune: 'LYON BETA',
  },
  matching_etablissements: [
    {
      siret: '20202020200030',
      adresse: '30 AVENUE BETA 69003 LYON',
      code_postal: '69003',
      libelle_commune: 'LYON ETABLISSEMENT BETA',
      etat_administratif: 'A',
    },
  ],
};

export const partialBetaCompany: DetailCompany = {
  siren: '303030303',
  nom_complet: 'BETA DETAIL PARTIEL',
};

export function detailSearchResponse(
  results: DetailCompany[],
  options: { page?: number; perPage?: number; totalResults?: number } = {},
) {
  const page = options.page ?? 1;
  const perPage = options.perPage ?? 20;
  const totalResults = options.totalResults ?? results.length;
  return {
    results,
    total_results: totalResults,
    page,
    per_page: perPage,
    total_pages: Math.ceil(totalResults / perPage),
  };
}

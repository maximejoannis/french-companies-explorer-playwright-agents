export interface StatsCompany {
  siren: string;
  nom_complet: string;
  etat_administratif?: 'A' | 'C';
  date_creation?: string;
  tranche_effectif_salarie?: string;
  siege?: {
    code_postal?: string;
    libelle_commune?: string;
  };
}

export const statsAlpha: StatsCompany = {
  siren: '411111111',
  nom_complet: 'ALPHA STATISTIQUES',
  etat_administratif: 'A',
  date_creation: '2020-01-15',
  tranche_effectif_salarie: '10-19',
  siege: { code_postal: '75001', libelle_commune: 'PARIS' },
};

export const statsBeta: StatsCompany = {
  siren: '422222222',
  nom_complet: 'BETA STATISTIQUES',
  etat_administratif: 'C',
  date_creation: '2010-05-20',
  siege: { code_postal: '69002', libelle_commune: 'LYON' },
};

export const statsGamma: StatsCompany = {
  siren: '433333333',
  nom_complet: 'GAMMA STATISTIQUES',
  etat_administratif: 'A',
  date_creation: '2015-07-10',
  tranche_effectif_salarie: '20-49',
  siege: { libelle_commune: 'PARIS' },
};

export const statsPageTwoGamma: StatsCompany = {
  ...statsGamma,
  etat_administratif: 'C',
  date_creation: '2018-04-12',
  siege: { libelle_commune: 'BORDEAUX' },
};

export const statsDelta: StatsCompany = {
  siren: '444444444',
  nom_complet: 'DELTA STATISTIQUES',
  etat_administratif: 'A',
  date_creation: '2024-03-01',
  siege: { libelle_commune: 'NANTES' },
};

export const statsMissingValues: StatsCompany[] = [
  {
    siren: '455555555',
    nom_complet: 'EPSILON STATUT ABSENT',
    tranche_effectif_salarie: '50-99',
    siege: { code_postal: '31000', libelle_commune: 'TOULOUSE' },
  },
  {
    siren: '466666666',
    nom_complet: 'ZETA DONNEES ABSENTES',
  },
];

export function statsSearchResponse(
  results: StatsCompany[],
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

# Plan de test — US-EXPORT-01

## Références

- User Story : `US-EXPORT-01`
- Application de référence : `https://maximejoannis.github.io/french-companies-explorer-qa/`
- Baselines consultées : Recherche, Filtres, Pagination, Tri, History et Saved Searches

## Synthèse de l’analyse

### Surface et disponibilité

Les contrôles `Exporter JSON` et `Exporter CSV` se trouvent dans la barre d’outils des résultats de la vue Recherche.

Ils sont toujours présents et activés dès que la vue Recherche est ouverte, y compris :

- avant toute recherche ;
- après une réponse vide ;
- pendant un chargement ;
- après une erreur.

Leur disponibilité ne dépend donc pas du nombre de résultats affichés.

### Collection réellement exportée

Les deux formats utilisent la même collection frontend :

```text
S.results
    ↓
normalisation de chaque entreprise
    ↓
ordre client courant
    ↓
téléchargement
```

Le comportement observable est le suivant :

- seule la réponse actuellement chargée est exportée ;
- avec pagination, seule la page courante est exportée ;
- aucune autre page n’est chargée pour compléter le fichier ;
- après un tri client, l’ordre exporté correspond à l’ordre trié ;
- après une nouvelle réponse réussie, l’ancienne collection est remplacée ;
- les filtres n’apparaissent pas directement dans le fichier : ils influencent l’export uniquement par la réponse courante qu’ils ont produite.

### Export JSON

Le nom proposé est :

```text
companies-results.json
```

Le contenu est un tableau JSON formaté avec une indentation de deux espaces.

Chaque élément est la représentation normalisée utilisée par le frontend, avec les propriétés suivantes dans l’ordre observable :

```text
siren
name
activity
activityLabel
status
creation
legal
category
workforce
siret
address
postalCode
city
matchingEstablishments
```

L’export n’est pas une copie brute de la réponse API. Il contient les champs normalisés, les valeurs de repli appliquées par le frontend et la collection d’établissements correspondants issue de `matching_etablissements` ou `etablissements`.

Les tests valideront un petit objet représentatif complet sans transformer les valeurs métier des données publiques en règles backend.

### Export CSV

Le nom proposé est :

```text
companies-results.csv
```

Le fichier commence par un BOM UTF-8 (`U+FEFF`). Le séparateur est le point-virgule (`;`).

Les en-têtes, dans l’ordre exact, sont :

```text
SIREN
Nom
Statut
Activité
Ville
Code postal
Création
SIRET siège
```

La correspondance des colonnes est :

| Colonne     | Champ normalisé |
| ----------- | --------------- |
| SIREN       | `siren`         |
| Nom         | `name`          |
| Statut      | `status`        |
| Activité    | `activityLabel` |
| Ville       | `city`          |
| Code postal | `postalCode`    |
| Création    | `creation`      |
| SIRET siège | `siret`         |

Toutes les cellules, y compris les en-têtes, sont entourées de guillemets doubles. Un guillemet contenu dans une valeur est doublé. Les virgules, points-virgules et retours à la ligne restent à l’intérieur de la cellule citée. Les lignes sont séparées par `\n`.

### Protection contre l’injection CSV

Avant l’échappement CSV, toute valeur correspondant à l’expression suivante est préfixée par une apostrophe :

```text
^\s*[=+\-@]
```

La protection couvre donc `=`, `+`, `-` et `@`, y compris lorsqu’ils sont précédés d’espaces.

Exemples observables :

```text
=CMD()       → '=CMD()
+SUM(A1:A2)  → '+SUM(A1:A2)
  -10        → '  -10
@payload     → '@payload
```

L’apostrophe est ajoutée avant les éventuels espaces initiaux.

### Absence de résultats

Les contrôles restent disponibles et déclenchent un téléchargement :

- JSON : tableau vide `[]` ;
- CSV : BOM UTF-8 suivi uniquement de la ligne d’en-tête.

Aucun message spécifique n’est affiché et aucun contrôle n’est désactivé. Ce comportement observable est retenu pour `AC-07` sans inventer une UX différente.

### Effets de bord et réseau

Le déclenchement d’un export :

- ne modifie pas la recherche ;
- ne modifie pas les filtres, la pagination ou le tri ;
- ne modifie aucune clé `localStorage` ;
- ne déclenche aucun nouveau GET `/search` ;
- ne produit aucun `POST`, `PUT`, `PATCH` ou `DELETE` vers l’API publique.

## Défaut potentiel observé

### BUG-013 — L’export conserve les résultats précédents pendant un chargement ou après une erreur

Lorsqu’une nouvelle recherche commence, l’interface vide la grille mais ne vide pas immédiatement `S.results`.

Si la nouvelle requête est encore en cours ou échoue :

- les anciens résultats ne sont plus affichés ;
- les boutons d’export restent actifs ;
- un export contient encore l’ancienne collection.

Ce comportement semble contredire `AC-06`, puisque le fichier ne correspond plus aux résultats actuellement affichés. Le produit ne doit pas présenter une ancienne collection comme celle de l’état courant.

Le défaut n’est pas créé à ce stade. `TC-EXPORT-006` conservera l’oracle fonctionnel correct et devra rester en `test.fixme` tant que le défaut est ouvert.

## Stratégie de couverture

Tous les scénarios proposés sont `UI_MOCKED` : le téléchargement, la normalisation, l’échappement, la protection CSV, l’ordre client et l’isolation sont des responsabilités frontend exigeant des données déterministes.

Aucun test `API` n’est justifié : l’API ne fournit pas de service d’export et ses règles métier ne constituent pas l’oracle de cette User Story.

Aucun `E2E_REAL` n’est proposé : les baselines Recherche et Filtres couvrent déjà l’intégration avec l’API réelle, tandis que l’usage de données publiques volatiles diminuerait la fiabilité des assertions détaillées sur les fichiers.

Le plan évite :

- un test par propriété JSON ;
- un test par colonne CSV ;
- la répétition de tous les modes de tri ;
- la répétition de tous les filtres et paramètres de pagination ;
- l’ouverture des fichiers dans un logiciel externe.

## Cas de test

### TC-EXPORT-001 — Exporter la représentation JSON normalisée des résultats

- **Objectif principal** : vérifier qu’un téléchargement JSON réel contient la représentation frontend normalisée de la collection chargée.
- **Critères couverts** : `AC-01`, `AC-02`, `AC-08`, `AC-09`, `AC-10`, `AC-11`.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Préconditions** : vue Recherche ouverte ; instrumentation limitée à `/search` ; snapshot des stockages utiles après la recherche.
- **Données** : réponse déterministe de deux entreprises, avec des champs renseignés et quelques champs absents afin de couvrir la normalisation sans créer un test par champ.
- **Étapes** :
  1. Installer le mock `/search`.
  2. Exécuter une recherche et attendre explicitement sa réponse.
  3. Vérifier la présence et l’activation des deux contrôles d’export.
  4. Enregistrer `page.waitForEvent('download')` avant le clic JSON.
  5. Cliquer sur `Exporter JSON`.
  6. Lire le fichier téléchargé.
  7. Parser son contenu avec `JSON.parse`.
- **Assertions principales** :
  - un téléchargement réel est émis ;
  - le nom suggéré vaut `companies-results.json` ;
  - le contenu est syntaxiquement valide et sa racine est un tableau ;
  - les deux objets sont présents dans l’ordre affiché ;
  - chaque objet correspond à la projection normalisée attendue ;
  - la structure observable contient les 14 propriétés documentées ;
  - aucune donnée d’une entreprise n’est associée à l’autre ;
  - la recherche courante et les snapshots `localStorage` sont inchangés.
- **Réseau attendu** : un GET initial légitime ; aucun GET supplémentaire au clic ; aucune écriture API.
- **Défaut associé** : aucun.

### TC-EXPORT-002 — Produire un CSV structuré et correctement associé

- **Objectif principal** : vérifier la structure tabulaire, l’ordre des colonnes et l’association des données.
- **Critères couverts** : `AC-01`, `AC-03`, `AC-08`, `AC-09`, `AC-10`, `AC-11`.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Préconditions** : réponse déterministe de deux entreprises ; recherche terminée ; suivi réseau et stockage capturés.
- **Données** : réponses Recherche synthétiques existantes.
- **Étapes** :
  1. Exécuter la recherche mockée.
  2. Enregistrer l’attente du téléchargement.
  3. Cliquer sur `Exporter CSV`.
  4. Lire le fichier comme texte.
  5. Vérifier puis retirer explicitement le BOM pour l’analyse tabulaire.
  6. Analyser les cellules en tenant compte du séparateur `;` et des guillemets.
- **Assertions principales** :
  - le nom suggéré vaut `companies-results.csv` ;
  - le BOM UTF-8 est présent ;
  - les en-têtes sont exacts et dans le bon ordre ;
  - chaque ligne possède huit colonnes ;
  - une ligne existe par entreprise exportée ;
  - les valeurs restent associées aux bonnes colonnes ;
  - l’ordre des lignes correspond à l’ordre affiché ;
  - l’état UI et `localStorage` restent inchangés.
- **Réseau attendu** : aucun nouvel appel `/search` lors du téléchargement ; aucune écriture API.
- **Défaut associé** : aucun.

### TC-EXPORT-003 — Échapper les caractères spéciaux et neutraliser les formules CSV

- **Objectif principal** : vérifier que les cellules complexes restent structurellement valides et que les quatre préfixes de formule sont neutralisés.
- **Critères couverts** : `AC-04`, `AC-05`, `AC-08`, `AC-09`, `AC-10`.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Préconditions** : petite réponse mockée propre à l’export ; aucun recours à des données publiques réelles.
- **Données** : une ou deux entreprises répartissant une virgule, un point-virgule, un guillemet, un retour à la ligne, les préfixes `=`, `+`, `-`, `@`, un préfixe dangereux précédé d’espaces et une valeur ordinaire de contrôle.
- **Étapes** :
  1. Retourner la réponse synthétique.
  2. Exécuter la recherche.
  3. Télécharger le CSV via l’événement `download`.
  4. Lire le contenu brut.
  5. Analyser les cellules en respectant les guillemets et retours à la ligne internes.
- **Assertions principales** :
  - chaque ligne analysée possède toujours huit colonnes ;
  - les virgules, points-virgules et retours à la ligne restent dans leur cellule ;
  - les guillemets internes sont doublés dans le contenu brut et restaurés après analyse ;
  - chaque valeur dangereuse reçoit exactement une apostrophe de protection ;
  - la valeur ordinaire n’est pas préfixée ;
  - les espaces initiaux d’une valeur dangereuse sont conservés après l’apostrophe ;
  - aucune ligne ou colonne parasite n’est créée.
- **Réseau attendu** : aucun GET supplémentaire ; aucune écriture API.
- **Défaut associé** : aucun.

### TC-EXPORT-004 — Exporter uniquement la page courante dans l’ordre du tri client

- **Objectif principal** : vérifier la frontière de collection exportée sans redoubler les contrats complets de pagination et de tri.
- **Critères couverts** : `AC-06`, `AC-08`, `AC-09`, `AC-10`, `AC-11`.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Préconditions** : deux réponses paginées incompatibles ; seconde page contenant au moins deux entreprises dans un ordre permettant un tri client visible ; suivi réseau actif.
- **Données** : page 1 avec Alpha ; page 2 avec Zulu et Bêta ; tri `Nom A → Z`.
- **Étapes** :
  1. Charger la page 1.
  2. Naviguer vers la page 2 et attendre sa réponse.
  3. Appliquer le tri client.
  4. Vérifier brièvement l’ordre visible.
  5. Capturer le point de référence du suivi réseau.
  6. Télécharger successivement JSON et CSV avec deux événements `download` distincts.
  7. Extraire les identifiants ou noms dans les deux fichiers.
- **Assertions principales** :
  - les deux fichiers contiennent uniquement les entreprises de la page 2 ;
  - aucune entreprise de la page 1 n’est présente ;
  - l’ordre correspond au tri client courant ;
  - JSON et CSV représentent le même ensemble et le même ordre ;
  - les téléchargements ne modifient ni page, ni tri, ni filtres, ni stockages.
- **Réseau attendu** : GET légitimes uniquement pour les pages 1 et 2 ; aucun GET causé par le tri ou les exports ; aucune écriture API.
- **Défaut associé** : aucun.
- **Limite volontaire** : ne pas revérifier tous les paramètres de pagination ni tous les modes de tri déjà couverts par leurs baselines.

### TC-EXPORT-005 — Télécharger des fichiers vides exploitables après une réponse sans résultat

- **Objectif principal** : contractualiser le comportement observable lorsque la collection courante est vide.
- **Critères couverts** : `AC-07`, `AC-08`, `AC-09`, `AC-10`, `AC-11`.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Moyenne.
- **Préconditions** : recherche terminée dans l’état exact `Aucune entreprise ne correspond à cette recherche.`.
- **Données** : réponse `{ "results": [], "total_results": 0 }`.
- **Étapes** :
  1. Exécuter une recherche retournant zéro résultat.
  2. Vérifier l’état vide de la grille.
  3. Télécharger le JSON.
  4. Télécharger le CSV.
  5. Lire les deux fichiers.
- **Assertions principales** :
  - les boutons restent visibles et activés ;
  - le JSON porte le bon nom et son contenu parsé vaut `[]` ;
  - le CSV porte le bon nom, contient le BOM et la ligne d’en-tête exacte, sans ligne de données ;
  - aucun message technique ou exception n’est affiché ;
  - l’état vide et les stockages restent inchangés.
- **Réseau attendu** : un GET initial légitime ; aucun GET au téléchargement ; aucune écriture API.
- **Défaut associé** : aucun.
- **Limite volontaire** : ne pas dupliquer la partition « avant toute recherche », qui produit la même collection vide et répond à la même question fonctionnelle.

### TC-EXPORT-006 — Ne pas exporter une collection précédente pendant une nouvelle recherche

- **Objectif principal** : vérifier que l’export ne présente pas d’anciens résultats comme ceux de l’état courant lorsque la grille a été vidée pour une nouvelle recherche.
- **Critères couverts** : `AC-01`, `AC-06`, `AC-08`, `AC-09`, `AC-11`.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Statut proposé** : `test.fixme`.
- **Préconditions** : première recherche réussie avec Alpha ; seconde recherche dont la réponse est différée ; ancien résultat absent de la grille pendant le chargement.
- **Données** : réponse initiale Alpha ; seconde réponse Bêta maintenue en attente de façon déterministe, sans `waitForTimeout`.
- **Étapes** :
  1. Exécuter la recherche Alpha.
  2. Démarrer la recherche Bêta avec une route différée.
  3. Attendre que la requête Bêta soit reçue et que l’état de chargement soit visible.
  4. Vérifier que la grille ne présente plus Alpha.
  5. Déclencher un export JSON réel.
  6. Lire le fichier avant de libérer la réponse Bêta.
  7. Libérer la réponse afin de terminer proprement le scénario.
- **Oracle fonctionnel correct** :
  - pendant une nouvelle recherche, l’application ne doit jamais permettre d’exporter les anciens résultats comme s’ils correspondaient à l’état courant ;
  - le contrat ne doit pas imposer une solution UX ou technique précise ;
  - une correction valide peut notamment rendre temporairement le contrôle d’export indisponible pendant le chargement ;
  - une correction valide peut également conserver le contrôle disponible mais empêcher que l’ancienne collection soit exportée, par exemple en exportant une collection vide ;
  - la seule exigence commune est qu’Alpha, issu de la recherche précédente, ne puisse pas être exporté comme résultat courant pendant la recherche Bêta ;
  - si un téléchargement reste possible pendant le chargement, le fichier ne doit pas contenir Alpha et l’export ne doit déclencher aucun appel `/search` supplémentaire.
- **Comportement actuel attendu en échec** :
  - Alpha n’est plus visible dans la grille ;
  - le contrôle d’export reste utilisable ;
  - l’export JSON contient encore Alpha via l’ancienne valeur de `S.results`.
- **Important pour la future implémentation Playwright** :
  - ne pas concevoir un scénario conditionnel permissif où un bouton désactivé permettrait de réussir une branche et un téléchargement une autre ;
  - tant que `BUG-013` est ouvert, le test doit rester déterministe et reproduire le comportement actuellement observé : Alpha réussit, Bêta démarre avec une réponse différée, Alpha disparaît de la grille, le contrôle `Exporter JSON` reste actuellement utilisable, le téléchargement est déclenché, puis l’oracle correct vérifie qu’Alpha ne devrait pas être présent ;
  - le test doit rester en `test.fixme` tant que le bug existe ;
  - après une correction produit, le TC pourra être réévalué selon la solution effectivement choisie.
- **Réseau attendu** : exactement les deux GET légitimes des recherches Alpha et Bêta ; aucun troisième GET ; aucune écriture API.
- **Défaut associé** : `BUG-013 — L’export conserve les résultats précédents pendant un chargement ou après une erreur`.
- **Limite volontaire** : la partition « après erreur » reste documentée dans `BUG-013` et ne nécessite pas un second TC tant qu’elle provient de la même cause racine.

## Matrice de traçabilité

| Cas de test     | Critères couverts                                    | Niveau      | Priorité | Statut          |
| --------------- | ---------------------------------------------------- | ----------- | -------- | --------------- |
| `TC-EXPORT-001` | `AC-01`, `AC-02`, `AC-08`, `AC-09`, `AC-10`, `AC-11` | `UI_MOCKED` | Haute    | Actif           |
| `TC-EXPORT-002` | `AC-01`, `AC-03`, `AC-08`, `AC-09`, `AC-10`, `AC-11` | `UI_MOCKED` | Haute    | Actif           |
| `TC-EXPORT-003` | `AC-04`, `AC-05`, `AC-08`, `AC-09`, `AC-10`          | `UI_MOCKED` | Haute    | Actif           |
| `TC-EXPORT-004` | `AC-06`, `AC-08`, `AC-09`, `AC-10`, `AC-11`          | `UI_MOCKED` | Haute    | Actif           |
| `TC-EXPORT-005` | `AC-07`, `AC-08`, `AC-09`, `AC-10`, `AC-11`          | `UI_MOCKED` | Moyenne  | Actif           |
| `TC-EXPORT-006` | `AC-01`, `AC-06`, `AC-08`, `AC-09`, `AC-11`          | `UI_MOCKED` | Haute    | `fixme` BUG-013 |

Tous les critères `AC-01` à `AC-11` sont couverts.

## Risques de duplication avec les tests existants

- Ne pas retester le contrat API ni les règles métier des entreprises.
- Ne pas reprendre tous les modes de tri.
- Ne pas reprendre tous les paramètres de filtres ou de pagination.
- Ne pas créer un test par champ JSON ou colonne CSV.
- Ne pas ajouter d’`E2E_REAL` : les parcours Recherche existants couvrent déjà l’intégration réelle.
- Ne pas tester l’ouverture des fichiers dans Excel, LibreOffice ou un autre logiciel externe.

## Architecture probable pour une future implémentation

- Spec principale : `tests/ui/specs/export/export-mocked.spec.ts`.
- POM : `tests/ui/pages/search.page.ts`, uniquement pour les locators `Exporter JSON` et `Exporter CSV`.
- Mock éventuel : `tests/mocks/export-results.ts` seulement si les mêmes données spéciales sont réellement réutilisées par plusieurs scénarios.
- Aucun nouveau test API.
- Aucun `E2E_REAL`.
- Aucune fixture globale sans répétition structurelle démontrée.
- Les utilitaires de lecture de téléchargement et d’analyse CSV peuvent rester locaux à la spec tant qu’ils ne sont pas réutilisés ailleurs.

## Répartition finale

- Nombre total de TC : 6.
- `API` : 0.
- `UI_MOCKED` : 6.
- `E2E_REAL` : 0.
- Tests actifs proposés : 5.
- `fixme` proposé : 1 (`TC-EXPORT-006`, `BUG-013`).

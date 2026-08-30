# Audit global final — French Companies Explorer Playwright

## 1. Synthèse exécutive

La suite actuelle constitue une couverture QA Playwright cohérente, utile et largement maintenable. Elle respecte bien la séparation des responsabilités : six tests de contrat sur l’API publique, soixante-quinze tests UI avec frontière déterministe, et trois tests UI avec API réelle pour des jonctions d’intégration distinctes. Les fonctionnalités exclusivement frontend ne dépendent pas de données gouvernementales réelles.

La traçabilité est complète : les treize fonctionnalités possèdent une User Story et un plan, les 84 TC sont rattachés à une US, et les seuls AC non automatisés sont explicitement non applicables (`AC-07` Deep Linking et `AC-08` Theme). Les douze `fixme` correspondent exactement à douze défauts ouverts. BUG-006 et BUG-012 sont volontairement documentés sans `fixme`, car ils décrivent une dette d’accessibilité qui n’empêche pas les parcours fonctionnels couverts.

Deux corrections ciblées sont néanmoins recommandées avant clôture : supprimer une assertion sur l’ordre des propriétés d’un objet JSON, qui n’a pas de sémantique JSON, et éviter que le smoke Search transforme implicitement un statut réel absent en « Cessée ». Ces corrections ne nécessitent ni nouveau TC ni nouvelle couverture.

**Décision : B — Projet prêt après quelques corrections ciblées.**

## 2. Périmètre et méthode

Éléments inspectés :

- `AGENTS.md` ;
- les 13 User Stories et 13 plans sous `specs/` ;
- les 14 défauts sous `defects/` ;
- les 6 tests API, 75 tests UI mockés et 3 tests E2E réels ;
- `tests/ui/pages/search.page.ts` ;
- les cinq modules de mocks ;
- les dossiers vides `tests/helpers/`, `tests/fixtures/` et `tests/data/` ;
- `package.json`, `playwright.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `.prettierrc` et `.prettierignore` ;
- recherche globale des synchronisations, routes, locators, tags, stockages et assertions strictes ;
- exécution des quatre quality gates sans modification préalable.

## 3. Inventaire réel

| Niveau      |  Tests | Actifs | `fixme` | Rôle                                                                 |
| ----------- | -----: | -----: | ------: | -------------------------------------------------------------------- |
| `API`       |      6 |      6 |       0 | Contrats HTTP, structure, filtres et pagination de l’API publique    |
| `UI_MOCKED` |     75 |     64 |      11 | Comportements frontend et données déterministes                      |
| `E2E_REAL`  |      3 |      2 |       1 | Intégration navigateur ↔ API sur Search, Detail et le défaut Commune |
| **Total**   | **84** | **72** |  **12** | —                                                                    |

Tags présents dans les titres :

- `@smoke` : 2 ;
- `@regression` : 46 ;
- `@positive` : 29 ;
- `@negative` : 1 ;
- `@error` : 1 ;
- 7 TC sans tag explicite.

Un même test peut porter plusieurs tags ; ces totaux ne sont donc pas additifs.

## 4. Audit de traçabilité global

### 4.1 Vue Feature → US → AC → TC → niveau → tags → défaut

| Feature        | User Story / AC                         | TC                          | Niveau(x)                      | Tags observés                                 | Défaut                                                              |
| -------------- | --------------------------------------- | --------------------------- | ------------------------------ | --------------------------------------------- | ------------------------------------------------------------------- |
| Search         | `US-SEARCH-01`, `AC-01` à `AC-08`       | `TC-SEARCH-001` à `010`     | 1 API, 8 UI_MOCKED, 1 E2E_REAL | positive, negative, error, smoke ; 3 sans tag | Aucun                                                               |
| Filters        | `US-FILTERS-01`, `AC-01` à `AC-07`      | `TC-FILTERS-001` à `009`    | 4 API, 4 UI_MOCKED, 1 E2E_REAL | positive, regression ; 2 sans tag             | BUG-001 → `TC-FILTERS-009` fixme                                    |
| Pagination     | `US-PAGINATION-01`, `AC-01` à `AC-08`   | `TC-PAGINATION-001` à `006` | 1 API, 5 UI_MOCKED             | positive, regression ; 1 sans tag             | BUG-002 → `TC-PAGINATION-005` fixme                                 |
| Sort           | `US-SORT-01`, `AC-01` à `AC-09`         | `TC-SORT-001` à `007`       | 7 UI_MOCKED                    | positive, regression ; 1 sans tag             | BUG-003 → `TC-SORT-005` fixme                                       |
| Detail         | `US-DETAIL-01`, `AC-01` à `AC-09`       | `TC-DETAIL-001` à `005`     | 4 UI_MOCKED, 1 E2E_REAL        | positive, regression, smoke                   | BUG-004 → `TC-DETAIL-002` fixme                                     |
| Favorites      | `US-FAVORITES-01`, `AC-01` à `AC-09`    | `TC-FAVORITES-001` à `005`  | 5 UI_MOCKED                    | positive, regression                          | BUG-005 → `TC-FAVORITES-004` fixme ; BUG-006 documenté sans fixme   |
| Stats          | `US-STATS-01`, `AC-01` à `AC-08`        | `TC-STATS-001` à `006`      | 6 UI_MOCKED                    | positive, regression                          | BUG-007 → `TC-STATS-006` fixme                                      |
| Compare        | `US-COMPARE-01`, `AC-01` à `AC-12`      | `TC-COMPARE-001` à `006`    | 6 UI_MOCKED                    | positive, regression                          | BUG-008 → `TC-COMPARE-006` fixme                                    |
| History        | `US-HISTORY-01`, `AC-01` à `AC-11`      | `TC-HISTORY-001` à `007`    | 7 UI_MOCKED                    | regression                                    | BUG-009 → `TC-HISTORY-002` fixme ; BUG-010 → `TC-HISTORY-007` fixme |
| Saved Searches | `US-SAVED-SEARCH-01`, `AC-01` à `AC-12` | `TC-SAVED-001` à `008`      | 8 UI_MOCKED                    | regression                                    | BUG-011 → `TC-SAVED-008` fixme ; BUG-012 → `TC-SAVED-006` actif     |
| Export         | `US-EXPORT-01`, `AC-01` à `AC-11`       | `TC-EXPORT-001` à `006`     | 6 UI_MOCKED                    | regression                                    | BUG-013 → `TC-EXPORT-006` fixme                                     |
| Deep Linking   | `US-DEEP-LINKING-01`, `AC-01` à `AC-12` | `TC-DEEP-LINK-001` à `006`  | 6 UI_MOCKED                    | regression                                    | BUG-014 → `TC-DEEP-LINK-006` fixme                                  |
| Theme          | `US-THEME-01`, `AC-01` à `AC-12`        | `TC-THEME-001` à `003`      | 3 UI_MOCKED                    | regression                                    | Aucun                                                               |

### 4.2 Cohérence des exigences

- Chaque fonctionnalité listée possède une US identifiable.
- Chaque US possède un plan de test correspondant.
- Chaque TC porte un identifiant unique et un commentaire `Couvre US-… / AC-…`.
- Aucun TC orphelin n’a été détecté.
- Tous les AC importants possèdent au moins un TC, sauf deux non-applicabilités explicites :
  - Deep Linking `AC-07` : l’application utilise `replaceState` et ne crée pas de parcours utilisateur Back/Forward entre états de recherche ;
  - Theme `AC-08` : l’application ne consulte ni `matchMedia` ni `prefers-color-scheme`.
- Aucun défaut nécessitant un oracle automatisé n’est orphelin.
- Aucun `fixme` ne référence un défaut inexistant.
- Les plans et les implémentations conservent les oracles corrects des défauts ; aucun test ne rend le comportement défectueux acceptable.

## 5. Audit des défauts connus

Tous les défauts sont ouverts. Les libellés français/anglais de statut, sévérité et priorité sont sémantiquement cohérents malgré une présentation non uniformisée dans les fichiers les plus récents.

| ID      | Feature                        | Statut | Sévérité / priorité | TC et `fixme`                                         | Oracle correct                                                                                                       | Risque principal                                               |
| ------- | ------------------------------ | ------ | ------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| BUG-001 | Filters / intégration Commune  | Ouvert | Majeure / Haute     | `TC-FILTERS-009`, E2E_REAL, fixme                     | Une commune conforme à l’UI doit produire une requête acceptée et un résultat ou état vide fonctionnel, pas HTTP 400 | Filtre Commune inutilisable malgré des mocks verts             |
| BUG-002 | Pagination / taille            | Ouvert | Majeure / Haute     | `TC-PAGINATION-005`, UI_MOCKED, fixme                 | Changer la taille relance immédiatement page 1 avec le bon `per_page` et remplace les cartes                         | Contrôle, page et résultats incohérents                        |
| BUG-003 | Sort / pertinence              | Ouvert | Majeure / Haute     | `TC-SORT-005`, UI_MOCKED, fixme                       | Revenir à Pertinence restaure l’ordre brut courant, localement et sans perte                                         | Contrôle affiché en contradiction avec l’ordre                 |
| BUG-004 | Detail / statut absent         | Ouvert | Majeure / Haute     | `TC-DETAIL-002`, UI_MOCKED, fixme                     | Un statut absent reste neutre et n’est jamais présenté comme Cessée                                                  | Fausse information métier                                      |
| BUG-005 | Favorites / fiche              | Ouvert | Majeure / Haute     | `TC-FAVORITES-004`, UI_MOCKED, fixme                  | Le cœur de la fiche reflète immédiatement l’ajout/retrait persistant et reste cohérent entre vues                    | UI contredisant le stockage réel                               |
| BUG-006 | Favorites / accessibilité      | Ouvert | Mineure / Moyenne   | Pas de TC dédié, aucun fixme, justification explicite | Le cœur doit exposer un nom et un état accessibles                                                                   | Action et état incompréhensibles aux technologies d’assistance |
| BUG-007 | Stats / statut absent          | Ouvert | Majeure / Haute     | `TC-STATS-006`, UI_MOCKED, fixme                      | Une valeur absente n’est comptée ni active ni cessée                                                                 | Statistiques métier trompeuses                                 |
| BUG-008 | Compare / statut absent        | Ouvert | Majeure / Haute     | `TC-COMPARE-006`, UI_MOCKED, fixme                    | Les valeurs absentes, notamment le statut, restent neutres et associées à la bonne colonne                           | Fausse information dans une comparaison                        |
| BUG-009 | History / identité             | Ouvert | Majeure / Haute     | `TC-HISTORY-002`, UI_MOCKED, fixme                    | Le statut fait partie de l’identité ; A et C restent deux entrées distinctes                                         | Perte silencieuse d’une recherche                              |
| BUG-010 | History / récence              | Ouvert | Mineure / Moyenne   | `TC-HISTORY-007`, UI_MOCKED, fixme                    | Pagination, taille et tri ne changent pas la récence d’une recherche formulée                                        | Chronologie artificiellement réordonnée                        |
| BUG-011 | Saved Searches / nom           | Open   | Minor / Medium      | `TC-SAVED-008`, UI_MOCKED, fixme                      | Un nom uniquement composé d’espaces ne crée ni ne met à jour une entrée                                              | Sauvegardes visuellement non identifiables                     |
| BUG-012 | Saved Searches / accessibilité | Open   | Minor / Medium      | `TC-SAVED-006` actif, aucun fixme                     | Le bouton de suppression doit nommer l’action et sa cible ; la suppression fonctionnelle reste active                | Boutons `×` indifférenciables pour l’assistance                |
| BUG-013 | Export / résultats obsolètes   | Open   | Major / High        | `TC-EXPORT-006`, UI_MOCKED, fixme                     | Pendant Bêta, Alpha ne doit jamais être exportable comme résultat courant ; aucune solution UX particulière imposée  | Fichier ne correspondant pas à l’état affiché                  |
| BUG-014 | Deep Linking / page invalide   | Open   | Major / High        | `TC-DEEP-LINK-006`, UI_MOCKED, fixme                  | `page=abc` est normalisé en page 1 ; aucun `NaN` réseau ou UI                                                        | URL, requête et pagination incohérentes                        |

La correspondance est exacte : BUG-001 à BUG-005, BUG-007 à BUG-011, BUG-013 et BUG-014 représentent les douze `fixme`. BUG-006 et BUG-012 sont les deux dettes d’accessibilité volontairement non bloquantes pour les TC fonctionnels.

## 6. Audit des niveaux de test

### API — 6 tests

Les tests API utilisent uniquement `APIRequestContext` et uniquement des GET. Ils vérifient le statut, le type JSON, la structure minimale, les métadonnées de pagination et la sémantique observable des filtres. Ils ne figent ni entreprise précise, ni total exact, ni ordre de résultats.

Les requêtes génériques `boulangerie` et `restaurant` réduisent la volatilité. Les assertions `> 0` restent une dépendance au service réel, mais elles sont justifiées pour démontrer que les filtres et les pages comparées opèrent sur une collection exploitable. Aucun fait durable concernant une entreprise individuelle n’est supposé.

### UI_MOCKED — 75 tests

Ce niveau porte correctement les responsabilités frontend : validation, rendu, états, tri, stats, persistance, historique, sauvegardes, export, URL et thème. Les mocks fournissent des entrées API ; ils ne reproduisent pas les algorithmes frontend testés. Les tris, projections d’export, calculs de statistiques et identités de stockage restent exécutés par l’application réelle.

### E2E_REAL — 3 tests

- `TC-SEARCH-010` vérifie la jonction critique entre une réponse réelle et une carte.
- `TC-DETAIL-005` vérifie qu’une carte issue de la réponse réelle ouvre sa fiche locale sans second GET.
- `TC-FILTERS-009` conserve la frontière réelle spécifique du défaut de format Commune.

Ces questions sont distinctes des tests API et des mappings mockés. Aucun E2E_REAL superflu n’a été identifié.

### Conclusion sur les niveaux

Aucun comportement purement frontend n’est testé avec l’API réelle. L’API publique n’est pas sur-testée via le navigateur. Aucune migration de niveau n’apporterait actuellement un gain clair.

## 7. Audit des scénarios transverses

| Risque transverse          | Couverture existante                                                                                                 | Suffisance / lacune                                                             |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| HTTP 500                   | `TC-SEARCH-007`, puis transition retardée dans `TC-SEARCH-009`                                                       | Suffisante ; inutile de répéter par feature                                     |
| Erreur réseau              | Même branche frontend documentée que les réponses HTTP non réussies ; le plan Search a retenu 500 comme représentant | Suffisante au regard du code et du risque ; pas de TC supplémentaire recommandé |
| Chargement lent            | `TC-SEARCH-008`, `TC-SEARCH-009`, `TC-EXPORT-006`                                                                    | Suffisante, succès, erreur et interaction à risque couverts                     |
| État vide                  | Search, Filters, Favorites, Stats, Compare, History, Saved Searches, Export, Deep Linking                            | Très suffisante, adaptée à chaque domaine sans exiger un doublon partout        |
| Validation avant API       | `TC-SEARCH-004`, garde Deep Linking `TC-DEEP-LINK-005`                                                               | Suffisante ; la seconde vérifie une frontière URL distincte                     |
| Requête parasite           | Sort, Detail, Favorites, Compare, History, Saved Searches, Export, Deep Linking, Theme                               | Suffisante et généralement ciblée sur `/search`                                 |
| Écriture API               | Assertions dédiées dans les fonctionnalités locales ; aucun code de test n’émet d’écriture                           | Suffisante                                                                      |
| Reload réel                | Favorites, Compare, History, Saved Searches, Deep Linking/persistance locale, Theme                                  | Suffisante ; chaque reload répond à un stockage distinct                        |
| Persistance `localStorage` | Favorites, Compare, History, Saved Searches, Theme                                                                   | Suffisante ; snapshots/projections proportionnés aux contrats                   |
| Navigation entre vues      | Detail retour, Favorites, Compare, History/Saved Searches, Theme                                                     | Suffisante sans test générique par vue                                          |
| Deep linking               | Suite dédiée de 6 TC, dont un défaut                                                                                 | Suffisante avec dette connue BUG-014                                            |
| Isolation des domaines     | History/Saved, Deep Linking, Theme et opérations locales                                                             | Suffisante ; gardes ciblées plutôt que duplication exhaustive                   |

**Nouvelle lacune de couverture significative : aucune.**

## 8. Audit Search et API réelle

Points solides :

- uniquement des GET ;
- assertions structurelles et paramétriques ;
- aucun SIREN, nom ou nombre total réel figé ;
- les E2E sélectionnent dynamiquement une entreprise effectivement reçue et visible ;
- Detail vérifie l’absence de GET supplémentaire au lieu de supposer une donnée métier ;
- les filtres API portent sur le contrat du backend, pas sur le rendu frontend.

Point à corriger : dans `TC-SEARCH-010`, le calcul `status === 'A' ? 'En activité' : 'Cessée'` traite une valeur absente ou inconnue comme Cessée. Il reproduit une décision frontend au lieu de préserver une absence de connaissance métier. L’oracle doit comparer A et C seulement lorsqu’une valeur source exploitable existe, ou utiliser une attente neutre pour une absence. Ce changement ne réduit pas l’objectif du smoke, qui reste l’association réponse ↔ carte.

## 9. Audit des mocks

Les routes visent toutes la frontière exacte `https://recherche-entreprises.api.gouv.fr/search**`. Aucune interception globale de toutes les ressources n’a été trouvée.

Les cinq modules partagés sont petits et spécialisés :

- `search-results.ts` : nominal, vide et pagination minimale ;
- `sort-results.ts` : ordre, accents, dates absentes et pages distinctes ;
- `detail-results.ts` : objets complets et partiels ;
- `compare-results.ts` : associations de colonnes, limite et valeurs absentes ;
- `stats-results.ts` : partitions de calcul et valeurs manquantes.

Les données particulières d’Export et Deep Linking restent locales lorsque leur structure n’est utilisée que par leur spec. Cette décision évite des mocks partagés artificiels.

Aucun mock ne calcule à la place du frontend le tri, les statistiques, la normalisation exportée, la persistance ou l’identité History/Saved Searches. Aucun mock ne masque un défaut connu : les scénarios concernés gardent leur oracle correct en `fixme`.

La répétition des petits helpers `mockJson`, `trackApiRequests` et `submitAndWait` est réelle, mais chaque variante porte des types ou besoins légèrement différents. Elle ne justifie pas à elle seule un helper global.

## 10. Audit des fixtures

`tests/fixtures/` est vide, comme `tests/helpers/` et `tests/data/`. Cela n’est pas un défaut. Les scénarios sont indépendants et leurs préparations divergent suffisamment par feature.

**Aucune fixture globale supplémentaire recommandée.**

## 11. Audit du Page Object

`SearchPage` reste cohérent avec l’application monopage : il représente la recherche et les surfaces accessibles depuis ses résultats. Il expose des actions utilisateur et des locators, sans assertion métier cachée.

Points corrects :

- priorité générale aux rôles, labels et testids ;
- articles History et Saved Searches identifiés par leur contenu, pas par position globale ;
- boutons d’action scopés dans leur article ou carte ;
- méthodes courtes (`submit`, `openHistory`, `openCompare`, etc.) ;
- aucune logique JSON/CSV, URL ou stockage dans le POM ;
- Theme reste volontairement local à sa spec, car le bouton global n’est pas réutilisé.

`compareCell()` emploie `nth(columnIndex - 1)`, mais l’index est dérivé dynamiquement du nom d’en-tête demandé. Ce n’est pas un raccourci positionnel fragile : il exprime l’association sémantique colonne ↔ entreprise.

## 12. Audit des locators

### Acceptables

- Les IDs de vues (`#searchView`, `#detailView`, etc.) identifient des régions stables sans rôle accessible équivalent suffisamment précis.
- Les sélecteurs `article.company`, `article.compare-panel` et les testids de cartes sont scopés et servent à des collections structurées.
- Les sélecteurs de cellules Compare sont adossés à des en-têtes accessibles.

### Limitations produit documentées

- Les favoris utilisent `button.fav` ou `#detailFav`, faute de nom/état accessible : BUG-006.
- La suppression Saved Searches utilise le nom `×`, strictement scopé dans l’article fonctionnel : BUG-012.

Ces locators sont des compromis nécessaires, pas une dette créée par les tests. Aucun XPath ni sélecteur CSS structurel complexe n’a été détecté.

## 13. Audit de synchronisation Playwright

Résultat de la recherche globale :

- aucun `waitForTimeout` ;
- aucun `networkidle` ;
- aucun sleep artificiel ;
- aucun `setTimeout` dans les tests ;
- les réponses lentes utilisent des promesses contrôlées ;
- les `waitForResponse` sont créés avant le clic ou le `goto` déclencheur ;
- les `waitForEvent('download')` sont créés avant le clic ;
- les routes Deep Linking sont installées avant les navigations directes ;
- les états UI reposent sur des assertions Playwright auto-retry ou `expect.poll`.

Aucune race réseau problématique ni attente arbitraire n’a été trouvée.

Une dette optionnelle existe dans quatre helpers de partitions : des `BrowserContext` manuels sont fermés uniquement sur le chemin nominal. Playwright ferme le navigateur à la fin du test, donc il n’y a pas de fuite inter-test durable, mais un `try/finally` rendrait le nettoyage local plus robuste en cas d’assertion échouée.

## 14. Audit des tags

Le smoke set de deux tests est minimal et pertinent : Search prouve le parcours principal avec API réelle ; Detail prouve une seconde frontière critique de mapping et réutilisation locale. Ajouter Theme, persistence ou export au smoke ne fournirait pas une frontière d’intégration aussi critique.

Sept titres n’ont aucun tag : `TC-FILTERS-007`, `TC-FILTERS-008`, `TC-PAGINATION-004`, `TC-SORT-001`, `TC-SEARCH-006`, `TC-SEARCH-008`, `TC-SEARCH-009`. Leur absence n’affecte ni l’exécution par défaut ni la traçabilité par ID, mais rend une sélection par `@regression` ou par type moins complète. Une harmonisation est optionnelle.

Les tags décrivent parfois la nature (`positive`, `negative`, `error`) et parfois la campagne (`regression`). Cette coexistence est admise par `AGENTS.md`; aucun tag manifestement trompeur n’a été trouvé.

## 15. Audit des assertions strictes

| Famille                     | Évaluation                                                                                                                                          |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ordre des propriétés JSON   | **Fragile** dans `TC-EXPORT-001` : `Object.keys()` impose un ordre sans sémantique JSON. La présence exacte/projetée des propriétés est suffisante. |
| Contenu des objets JSON     | Strict nécessaire : la normalisation frontend et l’association entre entreprises sont le contrat principal d’Export.                                |
| En-têtes et ordre CSV       | Strict nécessaire : ordre des colonnes, BOM, séparateur et échappement constituent le format exporté.                                               |
| Chaînes utilisateur exactes | Strict acceptable lorsqu’elles constituent un message fonctionnel demandé : validation, vide, erreur, prompts et états locaux.                      |
| Ordre d’objets              | Strict nécessaire pour tri, page courante, récence History, capacité Saved Searches et associations Compare.                                        |
| `localStorage` brut         | Strict nécessaire dans les TC d’isolation/reload ; projections utilisées ailleurs évitent les détails inutiles.                                     |
| Timestamps                  | Pas de timestamp exact généré contractualisé ; présence, stabilité ou ordre seulement.                                                              |
| IDs générés                 | Aucune valeur exacte imposée ; seules unicité et stabilité sont vérifiées lorsque pertinentes.                                                      |
| Query params                | Inspection par `URLSearchParams`; aucun ordre textuel de query string imposé.                                                                       |
| Données réelles             | Valeurs dérivées de la réponse du run ; aucun fait fixe sur une entreprise gouvernementale.                                                         |

## 16. Audit des duplications fonctionnelles

- Search API, UI mockée et E2E réel : duplication **acceptable**, car ils vérifient respectivement le service, le mapping déterministe et la jonction réelle.
- Filters API/UI : duplication **acceptable**, l’API valide sa sémantique et l’UI son mapping de contrôles ; Commune E2E couvre le défaut d’intégration distinct.
- Pagination API/UI : duplication **acceptable**, métadonnées backend contre navigation frontend.
- Detail et Search E2E : questions distinctes ; Detail ajoute l’ouverture locale sans second GET.
- Reload Favorites/Compare/History/Saved Searches/Theme : **aucune duplication fonctionnelle**, chaque domaine possède une clé et un rendu distincts.
- Deep Linking avec Filters/Pagination/Sort : **acceptable**, valeurs représentatives utilisées comme garde-fous de restauration URL, sans répéter leurs matrices complètes.
- Saved Searches avec History : **acceptable**, les tests vérifient explicitement leur isolation et des responsabilités différentes.
- Theme avec les stockages métier : **acceptable**, seules des sentinelles brutes servent à prouver l’isolation.
- Helpers réseau et stockage locaux : duplication technique mineure, **aucune réduction nécessaire** actuellement.

Aucun TC ne pose essentiellement la même question qu’un autre au point de justifier sa suppression.

## 17. Verdict de couverture par feature

| Feature        | Verdict                                                           | Justification                                                                                                                                             |
| -------------- | ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Search         | Couverture suffisante avec une dette d’oracle                     | Nominal API/UI/E2E, identifiants, validation, vide, 500 et chargement couverts. Corriger le fallback de statut du smoke.                                  |
| Filters        | Couverture suffisante avec dette connue                           | Mapping UI, contrats API, combinaison, persistance visuelle et vide couverts ; BUG-001 protège la vraie frontière Commune.                                |
| Pagination     | Couverture suffisante avec dette connue                           | Métadonnées API, limites, pages, remplacement et reset couverts ; BUG-002 conserve l’oracle taille.                                                       |
| Sort           | Couverture suffisante avec dette connue                           | Tous les tris, stabilité, ensemble, nouvelles réponses et absence de GET couverts ; BUG-003 documenté.                                                    |
| Detail         | Couverture suffisante avec dette connue                           | Association, champs, retour/contexte, réponse courante et jonction réelle couverts ; BUG-004 documenté.                                                   |
| Favorites      | Couverture suffisante avec dette connue                           | Ajout/retrait, doublon, plusieurs entrées, reload, vide et réseau couverts ; BUG-005/006 cohérents.                                                       |
| Stats          | Couverture suffisante avec dette connue                           | Calcul, renouvellement, filtre, page, tri, vide et valeurs absentes couverts ; BUG-007 documenté.                                                         |
| Compare        | Couverture suffisante avec dette connue                           | Sélection, limite, surfaces, colonnes, retrait, reload, vide et valeurs absentes couverts ; BUG-008 documenté.                                            |
| History        | Couverture suffisante avec dette connue                           | Éligibilité, identité, ordre/capacité, relance, reload, vide/nettoyage et navigation couverts ; BUG-009/010 documentés.                                   |
| Saved Searches | Couverture suffisante avec dette connue                           | Création, identité, capacité, relance, reload, suppression, vide et isolation couverts ; BUG-011/012 cohérents.                                           |
| Export         | Couverture suffisante avec une dette de test et une dette produit | JSON, CSV, caractères, injection, page/tri, vide et chargement couverts ; retirer l’ordre des clés ; BUG-013 documenté.                                   |
| Deep Linking   | Couverture suffisante avec dette connue                           | Restauration, mapping réseau, canonicalisation, interactions, vide/inconnu, validation et page invalide couverts ; Back/Forward justement non applicable. |
| Theme          | Couverture suffisante                                             | Bascule, stockage, reload, nouvelle visite, vue globale, défaut fixe et réseau couverts ; préférence système justement non applicable.                    |

Aucune feature n’est en surcouverture et aucune ne présente une lacune réelle non documentée.

## 18. Architecture et maintenabilité

Points forts :

- séparation physique API/UI claire ;
- specs regroupées par responsabilité ;
- noms de fichiers et IDs TC cohérents ;
- POM unique adapté à l’application monopage ;
- données partagées uniquement lorsqu’elles sont réellement réutilisées ;
- parsers et helpers spécialisés laissés locaux ;
- TypeScript strict, ESLint Playwright et Prettier intégrés ;
- exécution parallèle et retries réservés à CI ;
- traces et captures uniquement utiles à l’échec.

Refactorings à valeur réelle seulement :

1. sécuriser par `try/finally` les quatre helpers créant manuellement un contexte ;
2. harmoniser les sept titres sans tag si les campagnes filtrées par tags sont effectivement utilisées.

La centralisation de tous les trackers réseau, snapshots de stockage ou `mockJson` n’est pas recommandée : elle créerait un helper transversal à paramètres multiples pour une duplication locale courte et lisible.

## 19. Quality gates observés

| Commande               | Résultat                                                 |
| ---------------------- | -------------------------------------------------------- |
| `npm run typecheck`    | Réussi                                                   |
| `npm run lint`         | Réussi                                                   |
| `npm run format:check` | Réussi                                                   |
| `npm test`             | Réussi — 84 tests, 72 passed, 12 skipped/fixme, 0 failed |

Baseline conforme à l’attendu.

## 20. Findings classifiés

### AUDIT-001

- **Catégorie** : À CORRIGER AVANT CLÔTURE
- **Fichier** : `tests/ui/specs/search/search-real.spec.ts`
- **Constat** : `TC-SEARCH-010` attend « Cessée » pour toute valeur de statut autre que `A`, y compris une absence.
- **Risque** : le smoke peut valider une fausse information métier et contredit la stratégie neutre attendue pour les données absentes.
- **Recommandation** : ne vérifier le libellé actif/cessé que pour une valeur source explicitement `A`/`C`; conserver un oracle neutre ou structurel si le statut est absent.
- **Impact attendu sur le nombre de tests** : 0.
- **BUG existant lié** : même famille de risque que BUG-004, BUG-007 et BUG-008, sans étendre leur périmètre ni créer de nouveau défaut dans cet audit.

### AUDIT-002

- **Catégorie** : À CORRIGER AVANT CLÔTURE
- **Fichier** : `tests/ui/specs/export/export-mocked.spec.ts`
- **Constat** : `TC-EXPORT-001` compare l’ordre exact retourné par `Object.keys()`.
- **Risque** : une réorganisation interne des propriétés, sans changement du document JSON ni de ses données, ferait échouer le test.
- **Recommandation** : vérifier l’ensemble exact ou la projection des clés sans contractualiser leur ordre ; conserver l’ordre des objets du tableau, qui est fonctionnel.
- **Impact attendu sur le nombre de tests** : 0.
- **BUG existant lié** : aucun.

### AUDIT-003

- **Catégorie** : AMÉLIORATION OPTIONNELLE
- **Fichiers** : `compare-mocked.spec.ts`, `favorites-mocked.spec.ts`, `history-mocked.spec.ts`, `saved-searches-mocked.spec.ts`
- **Constat** : quatre helpers ferment leur `BrowserContext` manuel uniquement sur le chemin nominal, contrairement au helper Deep Linking robuste.
- **Risque** : nettoyage local retardé jusqu’au teardown du navigateur lorsqu’une assertion d’une partition échoue.
- **Recommandation** : entourer le contenu suivant `browser.newContext()` d’un `try/finally` appelant `context.close()`.
- **Impact attendu sur le nombre de tests** : 0.
- **BUG existant lié** : aucun.

### AUDIT-004

- **Catégorie** : AMÉLIORATION OPTIONNELLE
- **Fichiers** : `filters-mocked.spec.ts`, `pagination-mocked.spec.ts`, `sort-mocked.spec.ts`, `search-mocked.spec.ts`
- **Constat** : sept TC ne portent aucun tag, alors que les suites récentes utilisent systématiquement `@regression` et les anciennes souvent `@positive`/`@error`.
- **Risque** : sélection partielle si une campagne s’appuie exclusivement sur `grep @regression` ou sur la nature du scénario.
- **Recommandation** : harmoniser les tags uniquement si des campagnes filtrées les consomment ; ne pas ajouter `@smoke`.
- **Impact attendu sur le nombre de tests** : 0.
- **BUG existant lié** : aucun.

### AUDIT-005

- **Catégorie** : AUCUNE ACTION
- **Fichiers** : `tests/ui/pages/search.page.ts`, specs Favorites et Saved Searches
- **Constat** : locators CSS des cœurs et nom `×` pour suppression.
- **Risque** : dette d’accessibilité produit, mais locators fonctionnels correctement scopés.
- **Recommandation** : conserver jusqu’aux corrections produit de BUG-006 et BUG-012 ; ne pas affaiblir les TC.
- **Impact attendu sur le nombre de tests** : 0.
- **BUG existant lié** : BUG-006, BUG-012.

### AUDIT-006

- **Catégorie** : AUCUNE ACTION
- **Fichiers** : `tests/helpers/`, `tests/fixtures/`, `tests/data/`
- **Constat** : dossiers vides.
- **Risque** : aucun.
- **Recommandation** : ne créer aucune abstraction pour remplir l’arborescence.
- **Impact attendu sur le nombre de tests** : 0.
- **BUG existant lié** : aucun.

### AUDIT-007

- **Catégorie** : AUCUNE ACTION
- **Fichiers** : ensemble des specs UI mockées
- **Constat** : répétition courte de helpers réseau et stockage.
- **Risque** : faible ; les variantes locales restent lisibles et adaptées au scénario.
- **Recommandation** : ne pas factoriser tant qu’une évolution commune ne démontre pas une dette réelle.
- **Impact attendu sur le nombre de tests** : 0.
- **BUG existant lié** : aucun.

### Décompte

- BLOQUANT : 0.
- À CORRIGER AVANT CLÔTURE : 2.
- AMÉLIORATION OPTIONNELLE : 2.
- AUCUNE ACTION : 3.
- Nouvelles lacunes de couverture : 0.

## 21. Décision finale

### B — Projet prêt après quelques corrections ciblées

Liste minimale :

1. rendre `TC-SEARCH-010` neutre face à un statut réel absent ou inconnu ;
2. retirer de `TC-EXPORT-001` l’exigence d’ordre des propriétés JSON.

Ces deux changements préservent les 84 TC, les douze `fixme`, tous les défauts ouverts et toute la couverture fonctionnelle. Les améliorations AUDIT-003 et AUDIT-004 peuvent être traitées séparément et ne conditionnent pas la validité globale de la suite.

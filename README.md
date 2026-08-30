# French Companies Explorer Playwright Agents

[![QA Portal](https://img.shields.io/badge/QA%20Portal-GitHub%20Pages-c7ff4a?logo=github&logoColor=black)](https://maximejoannis.github.io/french-companies-explorer-playwright-agents/)
[![Playwright QA](https://github.com/maximejoannis/french-companies-explorer-playwright-agents/actions/workflows/playwright.yml/badge.svg)](https://github.com/maximejoannis/french-companies-explorer-playwright-agents/actions/workflows/playwright.yml)
![Playwright](https://img.shields.io/badge/Playwright-1.62-45ba4b?logo=playwright&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24%20CI-339933?logo=nodedotjs&logoColor=white)
![Chromium](https://img.shields.io/badge/Browser-Chromium-4285F4?logo=googlechrome&logoColor=white)
![Allure](https://img.shields.io/badge/Report-Allure-ff69b4)
![ESLint](https://img.shields.io/badge/ESLint-10.x-4B32C3?logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-3.x-F7B93E?logo=prettier&logoColor=black)
![Functional Scope](https://img.shields.io/badge/Functional%20Scope-100%25-brightgreen)
![Tests](https://img.shields.io/badge/Playwright%20Tests-84-blue)
![E2E Real](https://img.shields.io/badge/E2E%20Real-3%20tests-brightgreen)

Projet d'automatisation QA de [French Companies Explorer](https://maximejoannis.github.io/french-companies-explorer-qa/) fondé sur **Playwright Test** et **TypeScript**. La suite combine tests sur l'API réelle, tests UI avec API mockée et quelques E2E réels, avec traçabilité métier, reporting consolidé et CI/CD.

## Liens rapides

| Ressource                                                                                  | Usage                                                               |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| [Portail QA](https://maximejoannis.github.io/french-companies-explorer-playwright-agents/) | Point d'entrée principal vers les preuves d'exécution et de qualité |
| [Application testée](https://maximejoannis.github.io/french-companies-explorer-qa/)        | Frontend French Companies Explorer                                  |
| [Sprint Review](./SPRINT-REVIEW.md)                                                        | Démarche, défis, enseignements, résultats et décision finale        |
| [Audit final](./AUDIT-FINAL.md)                                                            | Revue détaillée de la couverture et de l'automatisation             |
| [Repository](https://github.com/maximejoannis/french-companies-explorer-playwright-agents) | Sources du projet                                                   |

---

## Objectif du projet

French Companies Explorer est un frontend statique HTML, CSS et JavaScript qui interroge directement l'API publique française de recherche d'entreprises. Cette API est externe, read-only et évolutive.

Le projet met en œuvre une démarche QA Automation complète :

- analyse fonctionnelle, User Stories et plans de tests ;
- stratégie multi-niveaux fondée sur le risque ;
- tests API avec `APIRequestContext` ;
- tests UI déterministes avec mocks réseau ciblés ;
- quelques intégrations navigateur + API réelle ;
- Page Object Model et contrôle des états `localStorage` ;
- traçabilité Allure ;
- quality gates, reporting, GitHub Actions et GitHub Pages ;
- expérimentation encadrée des Playwright Test Agents et de Codex.

> La couverture correspond au périmètre fonctionnel défini pour cet exercice. Elle ne représente ni du code coverage, ni une couverture exhaustive de French Companies Explorer ou de l'API gouvernementale.

## Résultats clés

| Indicateur                                 |            Résultat |
| ------------------------------------------ | ------------------: |
| Features couvertes                         | **13 / 13 (100 %)** |
| TC présents dans les plans                 |              **83** |
| Tests Playwright automatisés               |              **84** |
| Tests passed                               |              **72** |
| Tests `fixme` / skipped connus             |              **12** |
| Échecs inattendus                          |               **0** |
| Tests API réels                            |               **6** |
| Tests UI mockés                            |              **75** |
| Tests E2E réels                            |               **3** |
| Défauts documentés                         |              **14** |
| Couverture du périmètre fonctionnel défini |           **100 %** |

Les 83 TC présents dans les plans disposent tous d'une automatisation. Le 84e test, `TC-SAVED-008`, est un cas supplémentaire associé à `BUG-011` ; aucun TC planifié n'est manquant.

La couverture fonctionnelle de 100 % signifie qu'aucun Test Case défini dans le périmètre fonctionnel retenu n'est dépourvu d'automatisation. Elle ne représente pas du code coverage et ne garantit pas l'absence de défauts.

## Périmètre fonctionnel

| Feature        | Test Cases |
| -------------- | ---------: |
| Search         |         10 |
| Filters        |          9 |
| Pagination     |          6 |
| Sort           |          7 |
| Detail         |          5 |
| Favorites      |          5 |
| Stats          |          6 |
| Compare        |          6 |
| History        |          7 |
| Saved Searches |          8 |
| Export         |          6 |
| Deep Linking   |          6 |
| Theme          |          3 |
| **Total**      |     **84** |

Les cas détaillés et leurs arbitrages sont disponibles sous [`specs/`](./specs/) et dans la [Sprint Review](./SPRINT-REVIEW.md).

## Stratégie de test

> Utiliser le niveau de test le plus bas qui apporte la confiance utile.

| Niveau      | Nombre | Responsabilité                                                                 |
| ----------- | -----: | ------------------------------------------------------------------------------ |
| `API`       |  **6** | Contrat observable de l'API réelle : HTTP, structure, pagination et paramètres |
| `UI_MOCKED` | **75** | Comportements frontend déterministes, états rares, persistance et erreurs      |
| `E2E_REAL`  |  **3** | Frontières critiques entre le navigateur et la vraie API                       |

### API réel

Les tests utilisent Playwright `APIRequestContext` et uniquement des requêtes `GET` vers l'API gouvernementale réelle. Les assertions sont tolérantes à la volatilité des données : structure, pagination, paramètres et cohérences observables sont vérifiés sans inventer de règles métier ni dépendre inutilement d'une entreprise fixe.

### UI mockée

Le niveau principal utilise `page.route()` pour isoler et vérifier la logique frontend : rendu, erreurs, chargement, tri, statistiques, comparaison, historique, recherches sauvegardées, export, deep linking, thème et persistance `localStorage`.

> Ne jamais mocker ce que l'on cherche précisément à valider.

Une réponse mockée prouve donc le comportement du frontend, pas celui du backend.

### E2E réel

Trois scénarios seulement associent le navigateur à la vraie API pour vérifier des intégrations critiques. Cette couche apporte une preuve de jonction sans dupliquer systématiquement les tests API ou UI.

## Traçabilité

La chaîne fonctionnelle est conservée des exigences jusqu'au code :

```text
User Story (US-*)
→ Acceptance Criteria (AC-*)
→ Test Case (TC-*)
→ Test Playwright
```

Allure présente l'exécution selon la hiérarchie :

```text
Epic : French Companies Explorer
→ Feature
→ Story
→ Test Case
```

Les IDs `US-*`, `AC-*` et `TC-*` relient les spécifications, plans et tests. Les tags Playwright (`@smoke`, `@positive`, `@negative`, `@error`, `@regression`) facilitent les campagnes, mais ne remplacent pas cette traçabilité métier.

## Architecture du projet

```text
.
├── .codex/
│   └── agents/                    # Planner, Generator et Healer
├── .github/
│   └── workflows/
│       └── playwright.yml         # CI/CD et publication GitHub Pages
├── defects/                       # BUG-001 à BUG-014
├── reporting/
│   ├── coverage/                  # Interface du rapport de couverture
│   ├── qa-portal/                 # Portail consolidé HTML/CSS/JavaScript
│   └── scripts/                   # Générateurs couverture et qualité
├── specs/                         # 13 User Stories et 13 plans de tests
├── tests/
│   ├── api/
│   │   └── search/                # APIRequestContext et API réelle
│   ├── mocks/                     # Données déterministes partagées
│   └── ui/
│       ├── pages/
│       │   └── search.page.ts     # Page Object principal
│       └── specs/                 # UI mockée et E2E réel par domaine
├── AGENTS.md                      # Stratégie et règles des agents
├── AUDIT-FINAL.md                 # Audit de clôture
├── SPRINT-REVIEW.md               # Bilan détaillé
├── package.json
└── playwright.config.ts
```

Le projet ne crée pas de fixtures ou helpers globaux sans besoin de mutualisation démontré.

## Page Object Model et mocks

Le Page Object centralise les actions utilisateur et les locators significatifs de la SPA. Les assertions métier restent visibles dans les fichiers `.spec.ts`, afin que chaque scénario conserve une intention lisible.

Les mocks :

- interceptent précisément les routes utiles ;
- restent minimaux et centrés sur le cas métier ;
- représentent la partie du contrat consommée par le frontend ;
- ne réimplémentent ni le tri ni les autres algorithmes testés.

Les locators accessibles (`getByRole`, `getByLabel`, `getByText`) sont privilégiés lorsque l'application le permet. Les limites connues des contrôles Favoris et Saved Searches sont conservées dans les défauts d'accessibilité `BUG-006` et `BUG-012`.

## Installation

### Prérequis

- Git ;
- Node.js et npm ;
- Chromium Playwright.

```powershell
git clone https://github.com/maximejoannis/french-companies-explorer-playwright-agents.git
cd french-companies-explorer-playwright-agents
npm ci
npx playwright install chromium
```

## Exécuter les tests

La configuration cible Chromium et l'application publique définie par `baseURL`.

| Commande              | Usage                                  |
| --------------------- | -------------------------------------- |
| `npm test`            | Suite complète sur Chromium            |
| `npm run test:headed` | Suite complète avec navigateur visible |
| `npm run test:ui`     | Interface Playwright UI Mode           |

Exemples de campagnes directes supportées par les tags existants :

```powershell
npx playwright test --project=chromium --grep "@smoke"
npx playwright test --project=chromium --grep "@regression"
```

## Quality Gates

| Commande                  | Contrôle                                            |
| ------------------------- | --------------------------------------------------- |
| `npm run typecheck`       | Typage TypeScript sans émission de fichiers         |
| `npm run lint`            | Analyse ESLint et règles Playwright                 |
| `npm run lint:fix`        | Corrections ESLint automatiques disponibles         |
| `npm run format:check`    | Conformité Prettier                                 |
| `npm run format`          | Application du formatage Prettier                   |
| `npm run quality:report`  | Rapport consolidé Prettier, ESLint et TypeScript    |
| `npm run coverage:report` | Rapport de couverture QA calculé depuis les sources |

Pour reproduire les contrôles principaux :

```powershell
npm run typecheck
npm run lint
npm run format:check
npm test
```

## Reporting

### Playwright HTML

`npm test` génère le rapport natif dans `playwright-report/`. Il peut être ouvert avec :

```powershell
npx playwright show-report
```

### Allure

Les résultats sont produits dans `allure-results/`. Les scripts disponibles sont :

```powershell
npm run allure:generate
npm run allure:open
```

Le rapport final est généré dans `allure-report/` avec la traçabilité fonctionnelle.

### Couverture QA

```powershell
npm run coverage:report
```

Le rapport `coverage-report/` calcule depuis les US, plans, tests et défauts les Features, TC planifiés et automatisés, niveaux de test, tags et dettes connues.

### Qualité

```powershell
npm run quality:report
```

Le rapport `quality-report/` consolide Prettier, ESLint et TypeScript.

### Portail QA

Le [portail QA public](https://maximejoannis.github.io/french-companies-explorer-playwright-agents/) réunit les rapports Playwright, Allure, couverture et qualité. Il constitue la vue principale des preuves QA publiées.

## CI/CD

Le workflow [`.github/workflows/playwright.yml`](./.github/workflows/playwright.yml) est déclenché par un push sur `main`, une pull request vers `main` ou `workflow_dispatch`.

```text
Push main / PR / workflow_dispatch
→ npm ci
→ qualité
→ couverture QA
→ installation Chromium
→ tests Playwright
→ génération Allure
→ validation des rapports
→ artifact qa-reports
→ GitHub Pages hors PR
→ quality gate final
```

- une **pull request** exécute les validations et produit les artefacts sans déployer Pages ;
- sur **main** ou lors d'un déclenchement approprié hors PR, le portail est construit puis déployé ;
- l'artefact consolidé `qa-reports` conserve les rapports pendant 30 jours ;
- le quality gate exige le succès de la qualité, de la couverture, des tests et d'Allure, ainsi que du déploiement lorsqu'il est attendu.

La CI utilise Node.js 24, Java 17 pour Allure, Chromium, deux retries et un worker Playwright.

## Playwright Test Agents et Codex

Les configurations sont versionnées sous [`.codex/agents/`](./.codex/agents/) et les règles du projet dans [`AGENTS.md`](./AGENTS.md).

| Rôle          | Contribution                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| **Planner**   | Analyse les US, AC et risques, puis aide à construire les plans et choisir le niveau de test          |
| **Generator** | Aide à implémenter les scénarios navigateur pertinents en conservant la traçabilité                   |
| **Healer**    | Aide à diagnostiquer les tests navigateur défaillants sans affaiblir leur intention                   |
| **Codex**     | Assiste l'analyse, l'implémentation, les reviews, l'audit, le reporting, la CI/CD et la documentation |

> Les agents assistent le workflow ; ils ne constituent pas l'oracle métier.

Le projet ne revendique pas Playwright MCP : il ne fait pas partie de la stack finale déclarée.

## Défauts connus

Le dossier [`defects/`](./defects/) documente **14 défauts produit** :

- 12 sont associés à des tests `test.fixme` ;
- 2 sont des dettes d'accessibilité documentées sans `fixme` (`BUG-006` et `BUG-012`) ;
- la baseline finale contient 0 échec inattendu.

> `fixme` signifie qu'un scénario conserve l'oracle attendu mais est explicitement désactivé tant que le défaut produit correspondant reste présent. Il ne s'agit pas d'un test failed.

## Synchronisation et robustesse

La suite privilégie :

- les assertions auto-attendues Playwright ;
- `waitForResponse()` lorsque la réponse réseau fait partie de l'oracle ;
- l'installation du listener avant l'action déclenchante ;
- l'isolation des contextes et états `localStorage`.

Elle n'utilise pas de `waitForTimeout()` arbitraire ni `networkidle` comme solution générique de disponibilité.

## Documentation de clôture

### [Sprint Review](./SPRINT-REVIEW.md)

Présente les objectifs, la méthodologie, les outils, les défis, les solutions, les enseignements, les graphiques chiffrés, les résultats et la décision de clôture.

### [Audit final](./AUDIT-FINAL.md)

Analyse la cohérence de la couverture, l'architecture, les mocks, les locators, la synchronisation, les assertions, les duplications et les corrections finales.

## Limites

- les tests réels dépendent de la disponibilité du réseau et de l'API publique ;
- les données gouvernementales évoluent et imposent des assertions résilientes ;
- les mocks frontend ne prouvent pas le comportement du backend ;
- les E2E réels vérifient uniquement quelques frontières critiques ;
- la couverture est limitée au périmètre fonctionnel défini ;
- les défauts produit documentés restent une dette explicite.

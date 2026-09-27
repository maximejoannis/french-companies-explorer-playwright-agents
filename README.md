# French Companies Explorer Playwright Agents

[![QA Portal](https://img.shields.io/badge/QA%20Portal-GitHub%20Pages-c7ff4a?logo=github&logoColor=black)](https://maximejoannis.github.io/french-companies-explorer-playwright-agents/)
[![Playwright QA](https://github.com/maximejoannis/french-companies-explorer-playwright-agents/actions/workflows/playwright.yml/badge.svg)](https://github.com/maximejoannis/french-companies-explorer-playwright-agents/actions/workflows/playwright.yml)
![Playwright](https://img.shields.io/badge/Playwright-1.62-45ba4b?logo=playwright&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-6.x-3178C6?logo=typescript&logoColor=white)
![Node.js](https://img.shields.io/badge/Node.js-24%20CI-339933?logo=nodedotjs&logoColor=white)
![Chromium](https://img.shields.io/badge/Chromium-Full%20Suite-4285F4?logo=googlechrome&logoColor=white)
![Firefox](https://img.shields.io/badge/Firefox-UI%20Smoke-FF7139?logo=firefoxbrowser&logoColor=white)
![WebKit](https://img.shields.io/badge/WebKit-UI%20Smoke-1F6FEB?logo=safari&logoColor=white)
![Allure](https://img.shields.io/badge/Report-Allure-ff69b4)
![ESLint](https://img.shields.io/badge/ESLint-10.x-4B32C3?logo=eslint&logoColor=white)
![Prettier](https://img.shields.io/badge/Prettier-3.x-F7B93E?logo=prettier&logoColor=black)
![Functional Scope](https://img.shields.io/badge/Functional%20Scope-100%25-brightgreen)
![Tests](https://img.shields.io/badge/Playwright%20Tests-133-blue)
![E2E Real](https://img.shields.io/badge/E2E%20Real-3%20tests-brightgreen)

> État v1.1.1 documenté dans le dépôt : 133 tests découverts, aucun `fixme`. BUG-005, BUG-015 et BUG-016 sont exécutés comme échecs attendus ciblés. Le portail n’affiche « CI conforme avec anomalies connues » que lorsque les contrôles du run publié sont réussis et qu’aucun résultat inattendu n’est observé ; cela ne signifie pas que l’application est dépourvue d’anomalies.

Ce dépôt est le projet d’automatisation QA de [French Companies Explorer](https://maximejoannis.github.io/french-companies-explorer-qa/). Fondée sur **Playwright Test** et **TypeScript**, la suite combine tests de l’API réelle, tests UI avec API mockée et quelques tests E2E réels. Le portail QA publie séparément les rapports d’exécution, de couverture et de qualité produits par cette suite.

## Liens rapides

| Ressource                                                                                  | Usage                                                               |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| [Portail QA](https://maximejoannis.github.io/french-companies-explorer-playwright-agents/) | Point d'entrée principal vers les preuves d'exécution et de qualité |
| [Application testée](https://maximejoannis.github.io/french-companies-explorer-qa/)        | Frontend French Companies Explorer                                  |
| [Dépôt de l'application](https://github.com/maximejoannis/french-companies-explorer-qa)    | Code source du produit testé                                        |
| [Sprint Review](./SPRINT-REVIEW.md)                                                        | Démarche, défis, enseignements, résultats et décision finale        |
| [Audit final](./AUDIT-FINAL.md)                                                            | Revue détaillée de la couverture et de l'automatisation             |
| [Bilan v1.1.1](./BILAN-V1.1.1.md)                                                          | Problèmes rencontrés, solutions et enseignements vulgarisés         |
| [Repository](https://github.com/maximejoannis/french-companies-explorer-playwright-agents) | Sources du projet                                                   |

---

## Objectif du projet

L’application testée, [French Companies Explorer](https://github.com/maximejoannis/french-companies-explorer-qa), est un site statique en HTML, CSS et JavaScript qui interroge directement l’API publique Recherche d’Entreprises. Ce dépôt contient la suite de tests et les rapports QA qui la couvrent.

L’application, sa suite Playwright et le portail de rapports sont donc trois éléments distincts : le produit est déployé sur son propre site GitHub Pages, les tests vivent dans ce dépôt, et le portail QA publie les preuves générées par les exécutions du workflow.

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

## État v1.1.1

| Indicateur                                  |            Résultat |
| ------------------------------------------- | ------------------: |
| User Stories couvertes                      | **13 / 13 (100 %)** |
| TC planifiés                                |             **133** |
| Tests Playwright automatisés                |             **133** |
| Tests actifs                                |             **133** |
| `test.fixme`                                |               **0** |
| Échecs attendus (BUG-005, BUG-015, BUG-016) |               **3** |
| Échecs inattendus                           |               **0** |
| Succès inattendus                           |               **0** |
| Tests instables                             |               **0** |
| Tests ignorés                               |               **0** |
| Tests API réels                             |               **6** |
| Tests UI mockés                             |             **124** |
| Tests E2E réels                             |               **3** |
| Fiches de défaut historiques                |              **16** |
| Anomalies encore ouvertes                   |               **3** |
| Défauts résolus                             |              **13** |

Le résultat Chromium disponible dans `test-results/results.json` indique 133 résultats attendus, aucun résultat inattendu, aucun test ignoré et aucun test instable. Parmi ces résultats attendus, trois oracles sont annotés avec `test.fail()` pour les anomalies produit temporairement acceptées. Le document [`AUDIT-CI-KNOWN-DEFECTS.md`](./AUDIT-CI-KNOWN-DEFECTS.md) consigne par ailleurs une campagne locale Firefox/WebKit de 6 exécutions conformes ; cette preuve historique ne doit pas être interprétée comme le statut d’un run CI plus récent.

## Baseline historique v1.0.0

| Indicateur                                 |            Résultat |
| ------------------------------------------ | ------------------: |
| User Stories couvertes                     | **13 / 13 (100 %)** |
| TC présents dans les plans                 |              **83** |
| Tests Playwright automatisés               |              **84** |
| Tests réussis                              |              **72** |
| Tests `fixme` / skipped connus             |              **12** |
| Échecs inattendus                          |               **0** |
| Tests API réels                            |               **6** |
| Tests UI mockés                            |              **75** |
| Tests E2E réels                            |               **3** |
| Défauts documentés                         |              **14** |
| Couverture du périmètre fonctionnel défini |           **100 %** |

Les 83 TC présents dans les plans disposent tous d'une automatisation. Le 84e test, `TC-SAVED-008`, est un cas supplémentaire associé à `BUG-011` ; aucun TC planifié n'est manquant.

Cette baseline est conservée à titre historique. Sa couverture fonctionnelle de 100 % signifiait qu’aucun Test Case défini dans ce périmètre n’était dépourvu d’automatisation. Elle ne représentait pas du code coverage et ne garantissait pas l’absence de défauts.

## Périmètre fonctionnel v1.1.1

Les 133 Test Cases se répartissent sur 15 domaines fonctionnels. Certains domaines ajoutés en v1.1.1, comme Autocomplete et Share, enrichissent une User Story existante ; c’est pourquoi le dépôt compte 13 User Stories pour 15 lignes fonctionnelles ci-dessous.

| Feature        | Test Cases |
| -------------- | ---------: |
| Search         |         11 |
| Filters        |         20 |
| Pagination     |          6 |
| Sort           |          7 |
| Detail         |          5 |
| Favorites      |          6 |
| Stats          |          6 |
| Compare        |         15 |
| History        |          7 |
| Saved Searches |          8 |
| Export         |         15 |
| Deep Linking   |          7 |
| Autocomplete   |         10 |
| Share          |          7 |
| Theme          |          3 |
| **Total**      |    **133** |

Les cas détaillés et leurs arbitrages sont disponibles sous [`specs/`](./specs/) et dans la [Sprint Review](./SPRINT-REVIEW.md).

## Stratégie de test

> Utiliser le niveau de test le plus bas qui apporte la confiance utile.

| Niveau      |  Nombre | Responsabilité                                                                 |
| ----------- | ------: | ------------------------------------------------------------------------------ |
| `API`       |   **6** | Contrat observable de l'API réelle : HTTP, structure, pagination et paramètres |
| `UI_MOCKED` | **124** | Frontend déterministe, nouvelles fonctionnalités v1.1.1, erreurs et courses    |
| `E2E_REAL`  |   **3** | Frontières critiques entre navigateur, Geo API et API Entreprises              |

### API réelle

Les tests utilisent Playwright `APIRequestContext` et uniquement des requêtes `GET` vers l'API gouvernementale réelle. Les assertions sont tolérantes à la volatilité des données : structure, pagination, paramètres et cohérences observables sont vérifiés sans inventer de règles métier ni dépendre inutilement d'une entreprise fixe.

### UI avec API mockée

Le niveau principal utilise `page.route()` pour isoler et vérifier la logique frontend : rendu, erreurs, chargement, tri, statistiques, comparaison, historique, recherches sauvegardées, export, deep linking, thème et persistance `localStorage`.

> Ne jamais mocker ce que l'on cherche précisément à valider.

Une réponse mockée apporte donc une preuve sur le comportement du frontend, pas sur celui du backend.

### E2E avec API réelles

Trois scénarios seulement associent le navigateur aux API réelles pour vérifier des intégrations critiques, dont la chaîne Commune → Geo API → code INSEE → API Entreprises. Cette couche apporte une preuve de jonction sans dupliquer systématiquement les tests API ou UI.

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
├── defects/                       # BUG-001 à BUG-016
├── reporting/
│   ├── coverage/                  # Interface du rapport de couverture
│   ├── qa-portal/                 # Portail consolidé HTML/CSS/JavaScript
│   └── scripts/                   # Générateurs couverture et qualité
├── specs/                         # 13 User Stories, 13 plans associés et 1 plan transverse v1.1.1
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

Le Page Object centralise les actions utilisateur et les locators significatifs de l’interface testée. Les assertions métier restent visibles dans les fichiers `.spec.ts`, afin que chaque scénario conserve une intention lisible.

Les mocks :

- interceptent précisément les routes utiles ;
- restent minimaux et centrés sur le cas métier ;
- représentent la partie du contrat consommée par le frontend ;
- ne réimplémentent ni le tri ni les autres algorithmes testés.

## Tests

Le projet contient des tests Playwright qui interrogent les API publiques ou interceptent leurs réponses selon la responsabilité vérifiée. La documentation suivante détaille l’organisation de la suite et la différence entre tests réels et tests mockés :

[Documentation des tests](./docs/testing.md)

Les locators accessibles (`getByRole`, `getByLabel`, `getByText`) sont privilégiés lorsque l’application le permet. Les anciens défauts d’accessibilité `BUG-006` et `BUG-012`, désormais résolus, restent documentés et couverts par des tests de non-régression.

## Installation

### Prérequis

- Git ;
- Node.js et npm ;
- Chromium Playwright pour la baseline complète ;
- Firefox et WebKit Playwright pour la campagne cross-browser ciblée.

```powershell
git clone https://github.com/maximejoannis/french-companies-explorer-playwright-agents.git
cd french-companies-explorer-playwright-agents
npm ci
npx playwright install chromium
npx playwright install firefox webkit
```

## Exécuter les tests

La baseline complète cible Chromium. Une campagne complémentaire réexécute les trois tests UI `@smoke` sur Firefox et WebKit, soit six exécutions cross-browser, sans créer de nouveaux Test Cases fonctionnels.

| Commande                     | Usage                                  |
| ---------------------------- | -------------------------------------- |
| `npm test`                   | Suite complète sur Chromium            |
| `npm run test:headed`        | Suite complète avec navigateur visible |
| `npm run test:ui`            | Interface Playwright UI Mode           |
| `npm run test:cross-browser` | Smoke UI ciblé sur Firefox et WebKit   |

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

Le rapport `coverage-report/` calcule depuis les User Stories, plans, tests et fiches de défaut les User Stories couvertes, TC planifiés et automatisés, niveaux de test, tags, anomalies ouvertes et défauts résolus. Un statut de fiche absent ou ambigu est signalé « à clarifier » ; une anomalie associée à `test.fail()` reste classée ouverte.

Les exécutions Firefox et WebKit sont des smokes cross-browser de TC existants. Elles ne portent donc pas le total fonctionnel au-delà de 133 et ne modifient pas la répartition 6 `API` / 124 `UI_MOCKED` / 3 `E2E_REAL`. En CI, leurs rapports Playwright et résultats Allure bruts sont conservés dans des artefacts séparés.

### Qualité

```powershell
npm run quality:report
```

Le rapport `quality-report/` consolide Prettier, ESLint et TypeScript.

### Portail QA

Le [portail QA public](https://maximejoannis.github.io/french-companies-explorer-playwright-agents/) est une interface de consultation générée par ce dépôt. Il réunit les rapports Playwright, Allure, couverture et qualité ; il ne s’agit ni de l’application testée ni d’un second lanceur de tests.

Le portail distingue les réussites, échecs attendus, échecs inattendus, succès inattendus, tests ignorés et tests instables. Un succès inattendu sur un test annoté `test.fail()` fait échouer Playwright afin d’imposer le retrait de l’annotation lorsque le produit est corrigé.

## CI/CD

Le workflow [`.github/workflows/playwright.yml`](./.github/workflows/playwright.yml) est déclenché par un push sur `main`, une pull request vers `main` ou `workflow_dispatch`.

```text
Push main / PR / workflow_dispatch
→ npm ci
→ qualité
→ couverture QA
→ installation Chromium
→ baseline Playwright complète sur Chromium
→ génération Allure
→ validation des rapports
→ artifact qa-reports
→ matrix smoke UI Firefox / WebKit
→ GitHub Pages hors PR
→ quality gate final
```

- une **pull request** exécute les validations et produit les artefacts sans déployer Pages ;
- sur **main** ou lors d'un déclenchement approprié hors PR, le portail est construit puis déployé ;
- l'artefact consolidé `qa-reports` conserve les rapports pendant 30 jours ;
- les artefacts `cross-browser-smoke-firefox` et `cross-browser-smoke-webkit` conservent séparément les preuves ciblées ;
- le quality gate exige aussi le succès des smokes Firefox et WebKit, ainsi que du déploiement lorsqu'il est attendu ;
- le déploiement dépend des sorties réelles des contrôles qualité, couverture, Playwright et Allure, même si leurs étapes utilisent `continue-on-error` pour préserver les rapports.

La CI utilise Node.js 24, Java 17 pour Allure, Chromium pour la baseline, puis une matrix Firefox/WebKit pour les tests UI `@smoke`. Les réglages Playwright conservent deux retries et un worker en CI.

## Playwright Test Agents et Codex

Les configurations sont versionnées sous [`.codex/agents/`](./.codex/agents/) et les règles du projet dans [`AGENTS.md`](./AGENTS.md).

| Rôle          | Contribution                                                                                          |
| ------------- | ----------------------------------------------------------------------------------------------------- |
| **Planner**   | Analyse les US, AC et risques, puis aide à construire les plans et choisir le niveau de test          |
| **Generator** | Aide à implémenter le niveau prévu (`API`, `UI_MOCKED` ou `E2E_REAL`) en conservant la traçabilité    |
| **Healer**    | Aide à diagnostiquer les tests défaillants sans affaiblir leur intention fonctionnelle                |
| **Codex**     | Assiste l'analyse, l'implémentation, les reviews, l'audit, le reporting, la CI/CD et la documentation |

> Les agents assistent le workflow ; ils ne constituent pas l'oracle métier.

Le projet ne revendique pas Playwright MCP : il ne fait pas partie de la stack finale déclarée.

## Défauts connus

Le dossier [`defects/`](./defects/) conserve 16 fiches historiques, de BUG-001 à BUG-016. D’après leurs statuts documentés, 13 défauts sont résolus et trois anomalies restent ouvertes : BUG-005, BUG-015 et BUG-016. Leurs tests restent exécutés avec `test.fail()` placé immédiatement avant l’oracle concerné ; les problèmes de préparation ou d’infrastructure restent donc inattendus et bloquants. Le retrait de `test.fail()` est requis dès qu’un correctif transforme l’échec attendu en succès inattendu.

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
- les trois anomalies produit encore ouvertes restent une dette explicite ; les treize fiches résolues sont conservées pour la traçabilité historique.

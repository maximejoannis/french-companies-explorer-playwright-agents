# Rapport de migration Playwright — French Companies Explorer v1.1.1

> Mise à jour CI : la suite compte désormais 133 tests. BUG-005, BUG-015 et BUG-016 sont des échecs attendus ciblés avec `test.fail()`. La campagne Chromium finale est conforme (133/133, dont 3 anomalies connues, aucun résultat inattendu) et les smokes Firefox/WebKit sont conformes (6/6). Voir [AUDIT-CI-KNOWN-DEFECTS.md](./AUDIT-CI-KNOWN-DEFECTS.md). Les tableaux ci-dessous conservent les résultats de la campagne de migration antérieure à cette politique d’acceptation temporaire.

## Résumé exécutif

- Baseline confirmée : 84 tests, 72 passants, 12 `fixme`, 0 échec inattendu.
- Suite migrée : 131 tests découverts, 0 `fixme`.
- Les 12 tests historiquement désactivés sont désormais réellement exécutés.
- 11 des 12 anomalies historiques associées aux `fixme` sont validées.
- BUG-005 reste reproductible : la carte de résultat ne reflète pas le favori modifié depuis la fiche.
- BUG-006 et BUG-012 disposent de preuves d’accessibilité passantes.
- Les cinq fonctionnalités v1.1.1 sont couvertes aux niveaux proportionnés au risque.
- La course Autocomplétion A/B et la course Export Alpha/Beta passent.
- Le chemin Geo API → code INSEE → API Entreprises passe en mocké et en E2E réel ciblé.
- BUG-015 est confirmé sur Chromium, Firefox et WebKit.
- BUG-016 est nouvellement documenté : Réinitialiser conserve `cityCode` dans l’URL.
- La release n’est pas validée en raison des anomalies produit actives.

## Fichiers modifiés ou créés

| Fichier / groupe                    | Nature             | Justification                                                                  |
| ----------------------------------- | ------------------ | ------------------------------------------------------------------------------ |
| `tests/ui/pages/search.page.ts`     | POM étendu         | Filtres enrichis, suggestions, partage, export configurable et locators v1.1.1 |
| `tests/mocks/geo-results.ts`        | Nouveau mock       | Séparation explicite Geo API / API Entreprises                                 |
| Specs historiques                   | Adaptation ciblée  | Retrait des 12 `fixme`, nouveau contrat Commune, Export et autocomplétion      |
| `*-v111-mocked.spec.ts`             | 5 suites nouvelles | Couverture Filters, Autocomplete, Share, Compare et Export                     |
| `filters-city-mocked.spec.ts`       | Nouvelle suite     | BUG-001 et erreur Geo API déterministes                                        |
| `specs/v1.1.1/REQUIREMENTS.md`      | Traçabilité        | Feature → US → AC → TC                                                         |
| `defects/BUG-015*`, `BUG-016*`      | Défauts nouveaux   | Preuves produit factuelles                                                     |
| `package.json`, `package-lock.json` | Version            | Passage du projet QA à 1.1.1                                                   |

## Fixme historiques

| BUG     | TC                | Fixme retiré | Résultat                         | Statut final |
| ------- | ----------------- | -----------: | -------------------------------- | ------------ |
| BUG-001 | TC-FILTERS-009    |          Oui | Passed                           | VALIDATED    |
| BUG-002 | TC-PAGINATION-005 |          Oui | Passed                           | VALIDATED    |
| BUG-003 | TC-SORT-005       |          Oui | Passed                           | VALIDATED    |
| BUG-004 | TC-DETAIL-002     |          Oui | Passed                           | VALIDATED    |
| BUG-005 | TC-FAVORITES-004  |          Oui | Failed                           | FAILED       |
| BUG-007 | TC-STATS-006      |          Oui | Passed                           | VALIDATED    |
| BUG-008 | TC-COMPARE-006    |          Oui | Passed                           | VALIDATED    |
| BUG-009 | TC-HISTORY-002    |          Oui | Passed                           | VALIDATED    |
| BUG-010 | TC-HISTORY-007    |          Oui | Passed ciblé après stabilisation | VALIDATED    |
| BUG-011 | TC-SAVED-008      |          Oui | Passed                           | VALIDATED    |
| BUG-013 | TC-EXPORT-006     |          Oui | Passed                           | VALIDATED    |
| BUG-014 | TC-DEEP-LINK-006  |          Oui | Passed                           | VALIDATED    |

BUG-006 (`TC-FAVORITES-006`) et BUG-012 (`TC-SAVED-006`) passent avec noms accessibles et états ARIA ciblés.

## Nouveaux tests

| Plage TC            | Feature                  | Niveau    | Risque principal                          | Résultat observé |
| ------------------- | ------------------------ | --------- | ----------------------------------------- | ---------------- |
| TC-FILTERS-010..019 | FEAT-FILTERS-V111        | UI_MOCKED | Validation, mapping API, chips, URL       | Passed           |
| TC-FILTERS-020      | FEAT-FILTERS-V111        | E2E_REAL  | Jonction Geo → INSEE → Entreprises        | Passed ciblé     |
| TC-AUTO-001..010    | FEAT-AUTOCOMPLETE-V111   | UI_MOCKED | ARIA, clavier, erreurs, race A/B          | Passed           |
| TC-SHARE-001..007   | FEAT-SHARE-V111          | UI_MOCKED | URL, Clipboard, fallback, live region     | Passed           |
| TC-COMPARE-007..015 | FEAT-COMPARE-V111        | UI_MOCKED | Trois colonnes, limite, persistance, a11y | Passed           |
| TC-EXPORT-007..015  | FEAT-EXPORT-V111         | UI_MOCKED | Configuration, périmètre, CSV, course     | Passed           |
| TC-FAVORITES-006    | Accessibilité historique | UI_MOCKED | Nom et état du favori                     | Passed           |

## Résultats d’exécution

| Suite                                 | Total |                     Passed | Failed | Skipped/Fixme |       Durée |
| ------------------------------------- | ----: | -------------------------: | -----: | ------------: | ----------: |
| Quality gates finaux                  |     3 |                          3 |      0 |             0 | non agrégée |
| API réelle                            |     6 |                          6 |      0 |             0 |       3,0 s |
| BUG-001..014 + a11y                   |    14 |                         13 |      1 |             0 | non agrégée |
| Nouveaux tests UI v1.1.1              |    46 | 46 après correction ciblée |      0 |             0 | non agrégée |
| Chromium complet, dernier run complet |   131 |                        126 |      5 |             0 |     1,4 min |
| Correctifs techniques post-run        |     3 |                          2 |      1 |             0 | non agrégée |
| Firefox/WebKit smoke                  |     4 |                          2 |      2 |             0 |      13,7 s |

Le dernier Chromium complet contient deux échecs techniques corrigés ensuite et repassés ciblés (`TC-COMPARE-001`, `TC-HISTORY-007`). Trois échecs produit restent démontrés : BUG-005, BUG-015 et BUG-016. Un nouveau Chromium complet après ces deux corrections techniques est `NOT_EXECUTED`.

## Échecs classifiés

| Test             | Classification      | Preuve                                                 | Action recommandée                                          |
| ---------------- | ------------------- | ------------------------------------------------------ | ----------------------------------------------------------- |
| TC-FAVORITES-004 | PRODUCT_REGRESSION  | Carte `aria-pressed=false` après ajout depuis la fiche | Re-rendre les résultats au retour ou synchroniser le bouton |
| TC-SEARCH-010    | NEW_REQUIREMENT_GAP | Texte « deux entreprises » sur 3 navigateurs           | Corriger le contenu d’accueil                               |
| TC-DEEP-LINK-002 | PRODUCT_REGRESSION  | URL finale `?cityCode=69123` après Réinitialiser       | Vider le champ caché avant `syncUrl()`                      |

## Couverture v1.1.1

| Feature             |  TC | Passed | Failed | Risque résiduel                             |
| ------------------- | --: | -----: | -----: | ------------------------------------------- |
| Filtres enrichis    |  10 |     10 |      0 | Disponibilité externe Geo/API               |
| Autocomplétion      |  10 |     10 |      0 | Aucun risque démontré restant               |
| Partage             |   7 |      7 |      0 | Variations de permissions Clipboard réelles |
| Comparaison à 3     |   9 |      9 |      0 | Texte d’accueil incohérent (BUG-015)        |
| Export configurable |   9 |      9 |      0 | Aucun risque démontré restant               |

## Tests unitaires

`positiveInt`, validation des filtres, `statusView`, `neutralizeCsvFormula`, `csvEscape`, identité et tri restent intégrés dans un `app.js` externe non modulaire. Introduire un runner unitaire dans le dépôt QA obligerait à recopier ou extraire la logique du produit. Cette infrastructure n’a pas été ajoutée ; les règles sont couvertes par des tests UI mockés ciblés. Recommandation : extraire ces fonctions en modules testables dans le dépôt applicatif lors d’une évolution dédiée.

## Conclusion factuelle

- Les 12 anciens `fixme` sont exécutés : **oui**.
- BUG-001..014 sont tous couverts : **oui**, mais BUG-005 échoue encore.
- Les cinq fonctionnalités v1.1.1 ont une couverture adaptée : **oui**.
- Régressions produit : **BUG-005 et BUG-016**.
- Tests obsolètes identifiés : **oui**, adaptations de locators, Geo API, Export et filtrage des requêtes d’autocomplétion ; corrigées sans affaiblir les oracles.
- Échecs d’infrastructure finaux : **aucun** ; le premier run API sandboxé a échoué avec `EACCES`, puis 6/6 ont passé avec réseau autorisé.
- Contrôles non exécutés : **nouveau Chromium complet après les deux derniers correctifs techniques**, CI GitHub Actions distante et génération/publication Allure/Pages.
- Release v1.1.1 : **non validée** tant que BUG-005, BUG-015 et BUG-016 restent en échec.

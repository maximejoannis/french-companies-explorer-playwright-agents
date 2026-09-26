# Audit CI — anomalies produit temporairement acceptées

## Observation du run 36263766027

Le run GitHub Actions `36263766027` a terminé avec les jobs Firefox et WebKit en échec et la gate finale en échec. Le job Chromium/reporting est resté vert grâce à `continue-on-error`, tandis que le déploiement a été ignoré. Les reproductions locales ont confirmé BUG-005, BUG-015 et BUG-016 et révélé des défauts de test liés aux requêtes d’autocomplétion et à un filtre avancé masqué.

## Exceptions ciblées

| Anomalie | Test             | Oracle conservé                                                   | Statut Playwright attendu |
| -------- | ---------------- | ----------------------------------------------------------------- | ------------------------- |
| BUG-005  | TC-FAVORITES-004 | Le favori modifié depuis la fiche doit être reflété sur la carte  | Échec attendu             |
| BUG-015  | TC-SEARCH-011    | L’accueil doit annoncer une comparaison jusqu’à trois entreprises | Échec attendu             |
| BUG-016  | TC-DEEP-LINK-002 | Réinitialiser doit retirer `cityCode` de l’URL                    | Échec attendu             |

Les appels `test.fail()` sont placés après la préparation du scénario et immédiatement avant l’oracle défaillant. Un échec de navigation, de mock ou de préparation reste donc un échec inattendu. Un correctif produit transforme le test en succès inattendu, ce qui fait échouer Playwright jusqu’au retrait de l’annotation.

## Défauts de test corrigés

- TC-FAVORITES-001 ignore désormais les requêtes d’autocomplétion `minimal=true` lorsqu’il vérifie l’absence d’activité API liée aux favoris.
- TC-FAVORITES-002 a été reproduit passant et n’a pas été annoté.
- TC-HISTORY-007 rouvre explicitement les filtres avancés avant de changer la taille de page.
- TC-FILTERS-008/009/010 séparent les appels d’autocomplétion des recherches métier.
- TC-SEARCH-007 cible le compteur stable `#resultCount` plutôt qu’un rôle `status` devenu ambigu.
- TC-SEARCH-010 ne contient plus l’assertion BUG-015 et continue à valider la recherche réelle.
- TC-DEEP-LINK-007 conserve les contrôles sains de synchronisation retirés du scénario BUG-016.

## Reporting et gate

`generate-build-info.mjs` produit séparément : `passed`, `expectedFailed`, `unexpectedFailed`, `unexpectedPassed`, `skipped` et `flaky`. Le statut global vaut `known-issues` et le portail affiche « CI conforme avec anomalies connues » uniquement lorsque tous les contrôles sont réussis, qu’aucun résultat inattendu n’existe et qu’au moins un défaut connu échoue comme prévu.

Le déploiement Pages vérifie explicitement les sorties `quality`, `coverage`, `functional` et `allure`, ainsi que les smokes cross-browser. `continue-on-error` reste limité à la conservation des rapports et ne neutralise pas la gate finale.

## Résultats locaux finaux

| Contrôle             | Résultat                                               |
| -------------------- | ------------------------------------------------------ |
| Chromium complet     | 133/133 conformes, dont 3 échecs attendus, 0 inattendu |
| Firefox/WebKit smoke | 6/6 conformes, dont 2 exécutions attendues de BUG-015  |
| TypeScript           | Passed                                                 |
| ESLint               | Passed                                                 |
| Prettier             | Passed                                                 |
| Couverture           | 133 planifiés, 133 automatisés, 0 fixme                |

Conclusion : la CI peut être verte avec les trois anomalies connues, mais la release demeure « conforme avec anomalies connues », pas entièrement validée.

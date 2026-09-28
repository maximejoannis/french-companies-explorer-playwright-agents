# Audit de couverture US → AC → tests Playwright

## Objet et périmètre

Ce document enregistre les conclusions de l’audit de couverture réalisé à partir des exigences, plans de test, tests Playwright et résultats disponibles dans le dépôt.

Le périmètre contient :

- 18 User Stories ;
- 173 critères d’acceptation ;
- 128 AC dans les 13 US historiques ;
- 45 AC dans les 5 US v1.1.1 ;
- 2 AC explicitement non applicables ;
- 171 AC applicables.

L’audit n’assimile pas la présence d’un identifiant AC dans un commentaire ou un tableau à une preuve. La couverture n’est retenue que lorsque les actions, données et assertions du test vérifient effectivement le comportement attendu.

## Méthode de calcul

Trois mesures distinctes sont utilisées :

1. **Présence de tests** : un AC possède au moins un TC et un test Playwright traçable.
2. **Couverture comportementale** : tous les comportements vérifiables de l’AC disposent d’assertions pertinentes. Une assertion placée derrière `test.fail()` constitue une intention de test, mais pas une validation conforme du produit.
3. **Validation effective du produit** : les assertions pertinentes obtiennent un résultat conforme. Un échec attendu ne compte pas comme une validation réussie.

Dans ce document, une US atteint **100 %** lorsque tous ses AC applicables sont entièrement couverts par des assertions pertinentes et disposent d’un résultat conforme. Les AC non applicables sont exclus du dénominateur, avec justification.

Les catégories `@positive`, `@negative` et `@error` décrivent la situation testée, pas le résultat d’exécution. Il n’est donc pas exigé que chaque AC possède artificiellement les trois catégories.

### Résultat global

| Mesure                                              |                                                                Résultat |
| --------------------------------------------------- | ----------------------------------------------------------------------: |
| AC applicables avec au moins une trace vers un test |                                                         171/171 — 100 % |
| AC entièrement prouvés par des assertions conformes |                                                    169/171 — **98,8 %** |
| AC partiellement couverts ou non validés            |                                                                       2 |
| AC non applicables                                  |                                                                       2 |
| Tests Playwright actifs ordinaires                  |                                                                     133 |
| Tests en échec attendu avec `test.fail()`           |                                                                       3 |
| Tests désactivés avec `test.fixme()`                |                                                                       0 |
| Total de tests Playwright                           |                                                                     136 |
| Dernière exécution Chromium                         | 133 succès ordinaires, 3 échecs attendus observés, 0 résultat inattendu |

Les deux AC qui empêchent encore une validation effective à 100 % sont :

- `US-DEEP-LINKING-01 / AC-06` : reset incomplet de l’URL, `BUG-016`, `test.fail()` ;
- `US-FAVORITES-01 / AC-07` : état de la carte non rafraîchi après modification depuis la fiche, `BUG-005`, `test.fail()` ;

## Légende des preuves

| Code       | Fichier de preuve                                                                                                                                                                                                                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `CMP1`     | [`tests/ui/specs/company/compare-mocked.spec.ts`](tests/ui/specs/company/compare-mocked.spec.ts)                                                                                                                                                                                         |
| `CMP2`     | [`tests/ui/specs/company/compare-v111-mocked.spec.ts`](tests/ui/specs/company/compare-v111-mocked.spec.ts)                                                                                                                                                                               |
| `DL`       | [`tests/ui/specs/deep-linking/deep-linking-mocked.spec.ts`](tests/ui/specs/deep-linking/deep-linking-mocked.spec.ts)                                                                                                                                                                     |
| `DETAIL`   | [`tests/ui/specs/company/detail-mocked.spec.ts`](tests/ui/specs/company/detail-mocked.spec.ts), [`tests/ui/specs/company/detail-real.spec.ts`](tests/ui/specs/company/detail-real.spec.ts)                                                                                               |
| `EXP1`     | [`tests/ui/specs/export/export-mocked.spec.ts`](tests/ui/specs/export/export-mocked.spec.ts)                                                                                                                                                                                             |
| `EXP2`     | [`tests/ui/specs/export/export-v111-mocked.spec.ts`](tests/ui/specs/export/export-v111-mocked.spec.ts)                                                                                                                                                                                   |
| `FAV`      | [`tests/ui/specs/favorites/favorites-mocked.spec.ts`](tests/ui/specs/favorites/favorites-mocked.spec.ts)                                                                                                                                                                                 |
| `FILTERS1` | [`tests/api/search/filters-api.spec.ts`](tests/api/search/filters-api.spec.ts), [`tests/ui/specs/search/filters-mocked.spec.ts`](tests/ui/specs/search/filters-mocked.spec.ts), [`tests/ui/specs/search/filters-city-mocked.spec.ts`](tests/ui/specs/search/filters-city-mocked.spec.ts) |
| `FILTERS2` | [`tests/ui/specs/search/filters-v111-mocked.spec.ts`](tests/ui/specs/search/filters-v111-mocked.spec.ts), [`tests/ui/specs/search/filters-real.spec.ts`](tests/ui/specs/search/filters-real.spec.ts)                                                                                     |
| `HIST`     | [`tests/ui/specs/history/history-mocked.spec.ts`](tests/ui/specs/history/history-mocked.spec.ts)                                                                                                                                                                                         |
| `PAG`      | [`tests/api/search/pagination-api.spec.ts`](tests/api/search/pagination-api.spec.ts), [`tests/ui/specs/search/pagination-mocked.spec.ts`](tests/ui/specs/search/pagination-mocked.spec.ts)                                                                                               |
| `SAVED`    | [`tests/ui/specs/saved-searches/saved-searches-mocked.spec.ts`](tests/ui/specs/saved-searches/saved-searches-mocked.spec.ts)                                                                                                                                                             |
| `SEARCH`   | [`tests/api/search/search-api.spec.ts`](tests/api/search/search-api.spec.ts), [`tests/ui/specs/search/search-mocked.spec.ts`](tests/ui/specs/search/search-mocked.spec.ts), [`tests/ui/specs/search/search-real.spec.ts`](tests/ui/specs/search/search-real.spec.ts)                     |
| `AUTO`     | [`tests/ui/specs/search/autocomplete-v111-mocked.spec.ts`](tests/ui/specs/search/autocomplete-v111-mocked.spec.ts)                                                                                                                                                                       |
| `SHARE`    | [`tests/ui/specs/search/share-v111-mocked.spec.ts`](tests/ui/specs/search/share-v111-mocked.spec.ts)                                                                                                                                                                                     |
| `SORT`     | [`tests/ui/specs/search/sort-mocked.spec.ts`](tests/ui/specs/search/sort-mocked.spec.ts)                                                                                                                                                                                                 |
| `STATS`    | [`tests/ui/specs/stats/stats-mocked.spec.ts`](tests/ui/specs/stats/stats-mocked.spec.ts)                                                                                                                                                                                                 |
| `THEME`    | [`tests/ui/specs/theme/theme-mocked.spec.ts`](tests/ui/specs/theme/theme-mocked.spec.ts)                                                                                                                                                                                                 |

Résultats : `P` = passant conforme, `XF` = échec attendu, `NA` = non applicable.

## Matrice US → AC → comportement → preuve

### US-COMPARE-01 — 12/12, 100 %

| AC    | Comportement attendu                   | TC                 | Catégorie   | Résultat | Preuve                                   | Statut                                     |
| ----- | -------------------------------------- | ------------------ | ----------- | -------- | ---------------------------------------- | ------------------------------------------ |
| AC-01 | Ajouter depuis les surfaces prévues    | 001, 002           | `@positive` | P        | `CMP1` : bouton et stockage              | Complète                                   |
| AC-02 | Retirer uniquement l’entreprise ciblée | 003                | `@positive` | P        | `CMP1` : Bêta absente, autres maintenues | Complète                                   |
| AC-03 | Conserver l’identité SIREN/entreprise  | 001–004            | `@positive` | P        | `CMP1` : cartes, colonnes et stockage    | Complète                                   |
| AC-04 | Ne pas créer de doublon                | 001                | `@positive` | P        | `CMP1` : collection unique               | Complète                                   |
| AC-05 | Comparer plusieurs entreprises         | 002, 003           | `@positive` | P        | `CMP1` : plusieurs panneaux/colonnes     | Complète                                   |
| AC-06 | Refuser la quatrième entreprise        | 002                | `@positive` | P        | `CMP1` : sélection inchangée             | Complète ; catégorie historique discutable |
| AC-07 | Afficher les bonnes informations       | 003, 006           | `@positive` | P        | `CMP1` : valeurs associées aux colonnes  | Complète                                   |
| AC-08 | Maintenir la cohérence entre vues      | 002, 003           | `@positive` | P        | `CMP1` : résultats et Compare            | Complète                                   |
| AC-09 | Restaurer la sélection persistée       | 004                | `@positive` | P        | `CMP1` : vrai reload sans API            | Complète                                   |
| AC-10 | Gérer une comparaison vide             | 005                | `@positive` | P        | `CMP1` : clé absente et tableau vide     | Complète                                   |
| AC-11 | Neutraliser les données absentes       | 006                | `@positive` | P        | `CMP1` : aucun statut inventé            | Complète                                   |
| AC-12 | Rester local                           | 001, 002, 004, 005 | `@positive` | P        | `CMP1` : aucune écriture API             | Complète                                   |

### US-DEEP-LINKING-01 — 10/11 applicables, 90,9 %

| AC    | Comportement attendu                 | TC                      | Catégorie                | Résultat                   | Preuve                                                           | Statut                   |
| ----- | ------------------------------------ | ----------------------- | ------------------------ | -------------------------- | ---------------------------------------------------------------- | ------------------------ |
| AC-01 | Restaurer les paramètres valides     | 001, 004–006            | `@positive`, `@negative` | P                          | `DL` : contrôles et URL                                          | Complète                 |
| AC-02 | Déclencher la recherche du deep link | 001, 004, 005           | `@positive`, `@negative` | P                          | `DL` : paramètres GET                                            | Complète                 |
| AC-03 | Restaurer ou normaliser la page      | 001, 006                | `@positive`, `@negative` | P                          | `DL` : page et pagination                                        | Complète                 |
| AC-04 | Restaurer/normaliser la taille       | 001, 004                | `@positive`, `@negative` | P                          | `DL` : contrôle et `per_page`                                    | Complète                 |
| AC-05 | Restaurer le tri client              | 001, 004                | `@positive`, `@negative` | P                          | `DL` : contrôle et ordre                                         | Complète                 |
| AC-06 | Synchroniser l’URL après interaction | 007 ; 002               | `@positive`              | P + XF                     | `DL` : interactions ordinaires conformes, reset commune en échec | **Partielle**            |
| AC-07 | Navigation Back/Forward              | Aucun                   | NA                       | NA                         | Plan : `replaceState`, aucun parcours utilisateur successif      | Non applicable           |
| AC-08 | URL vide vers état initial propre    | 003                     | `@positive`              | P                          | `DL` : contrôles vides, aucun artefact                           | Complète                 |
| AC-09 | Traiter les paramètres invalides     | 003–006                 | `@negative`, `@positive` | P                          | `DL` : valeurs ignorées/normalisées                              | Complète                 |
| AC-10 | Cohérence réseau                     | 001–007                 | `@positive`, `@negative` | P, sauf assertion reset XF | `DL` : nombre de GET et aucune écriture                          | Complète pour le réseau  |
| AC-11 | Isoler les stockages                 | 001, 003, 005           | `@positive`, `@negative` | P                          | `DL` : sentinelles inchangées                                    | Complète                 |
| AC-12 | Rester déterministe                  | 001, 002, 004, 006, 007 | `@positive`, `@negative` | P, un XF                   | `DL` : mocks et ordres exacts                                    | Complète comme stratégie |

### US-DETAIL-01 — 9/9, 100 %

| AC    | Comportement attendu                      | TC            | Catégorie   | Résultat | Preuve                                       | Statut                             |
| ----- | ----------------------------------------- | ------------- | ----------- | -------- | -------------------------------------------- | ---------------------------------- |
| AC-01 | Ouvrir la fiche choisie                   | 001, 005      | `@positive` | P        | `DETAIL` : vue détail visible                | Complète                           |
| AC-02 | Identifier clairement l’entreprise        | 001, 005      | `@positive` | P        | Nom, SIREN, SIRET                            | Complète                           |
| AC-03 | Afficher les informations principales     | 001, 002, 005 | `@positive` | P        | Mock complet, partiel et API réelle          | Complète                           |
| AC-04 | Associer le détail à la bonne carte       | 001, 004      | `@positive` | P        | Bêta sans données Alpha                      | Complète                           |
| AC-05 | Gérer les informations absentes           | 002           | `@positive` | P        | Aucun `null`, `undefined` ou faux statut     | Complète                           |
| AC-06 | Revenir aux résultats                     | 003           | `@positive` | P        | Vue Recherche restaurée                      | Complète                           |
| AC-07 | Préserver le contexte                     | 003           | `@positive` | P        | Requête, filtre, page, tri, cartes et GET    | Complète                           |
| AC-08 | Utiliser la réponse courante              | 004, 005      | `@positive` | P        | Pas de donnée obsolète ni GET supplémentaire | Complète                           |
| AC-09 | Contrôles utilisables de façon accessible | 001, 003      | `@positive` | P        | Locators orientés utilisateur                | Complète dans le périmètre de l’AC |

### US-EXPORT-01 — 11/11, 100 %

| AC    | Comportement attendu                         | TC                | Catégorie                | Résultat | Preuve                                              | Statut   |
| ----- | -------------------------------------------- | ----------------- | ------------------------ | -------- | --------------------------------------------------- | -------- |
| AC-01 | Rendre JSON et CSV disponibles au bon moment | 001, 002, 006     | `@positive`, `@negative` | P        | `EXP1` : contrôles disponibles/désactivés           | Complète |
| AC-02 | Produire un JSON valide                      | 001               | `@positive`              | P        | Téléchargement parsé et comparé                     | Complète |
| AC-03 | Produire un CSV tabulaire                    | 002               | `@positive`              | P        | En-tête, lignes et colonnes                         | Complète |
| AC-04 | Échapper les caractères spéciaux             | 003               | `@positive`              | P        | Virgules, guillemets, retours ligne                 | Complète |
| AC-05 | Neutraliser les formules CSV                 | 003               | `@positive`              | P        | Préfixes dangereux vérifiés                         | Complète |
| AC-06 | Exporter l’état courant                      | 004, 006          | `@positive`, `@negative` | P        | Page/ordre courant et collection obsolète interdite | Complète |
| AC-07 | Refuser l’export sans résultat               | 005               | `@negative`              | P        | Aucun download                                      | Complète |
| AC-08 | Ne pas appeler l’API                         | 001–006           | `@positive`, `@negative` | P        | Compteurs inchangés, aucun write                    | Complète |
| AC-09 | Utiliser un vrai téléchargement              | 001–004, 006      | `@positive`, `@negative` | P        | Événement `download` Playwright                     | Complète |
| AC-10 | Rester déterministe                          | 001–006           | `@positive`, `@negative` | P        | Payloads mockés                                     | Complète |
| AC-11 | Ne pas modifier les autres états             | 001, 002, 004–006 | `@positive`, `@negative` | P        | Snapshots `localStorage`                            | Complète |

### US-FAVORITES-01 — 8/9, 88,9 %

| AC    | Comportement attendu                     | TC            | Catégorie   | Résultat             | Preuve                             | Statut                                   |
| ----- | ---------------------------------------- | ------------- | ----------- | -------------------- | ---------------------------------- | ---------------------------------------- |
| AC-01 | Ajouter un favori                        | 001, 004, 006 | `@positive` | P, 004 XF            | `FAV` : stockage et `aria-pressed` | Complète hors synchronisation inter-vues |
| AC-02 | Retirer un favori                        | 002, 004, 006 | `@positive` | P, 004 XF            | Stockage, cartes et contrôle       | Complète hors synchronisation inter-vues |
| AC-03 | Cibler la bonne entreprise               | 001–004       | `@positive` | P, 004 XF            | SIREN, nom et carte                | Complète                                 |
| AC-04 | Éviter les doublons                      | 001           | `@positive` | P                    | Collection unique                  | Complète                                 |
| AC-05 | Gérer plusieurs favoris                  | 002           | `@positive` | P                    | Retraits indépendants              | Complète                                 |
| AC-06 | Persister après reload                   | 003           | `@positive` | P                    | Vrai reload sans API               | Complète                                 |
| AC-07 | Synchroniser carte, fiche et vue Favoris | 003, 004      | `@positive` | **XF**               | `BUG-005` : carte non rafraîchie   | **Partielle, produit non conforme**      |
| AC-08 | Gérer l’état vide                        | 002, 005      | `@positive` | P                    | Collection absente, vide et vidée  | Complète                                 |
| AC-09 | Ne pas écrire vers l’API                 | 001–006       | `@positive` | P, un XF fonctionnel | Suivi réseau                       | Complète pour le réseau                  |

### US-FILTERS-01 — 7/7, 100 %

| AC    | Comportement attendu                  | TC                     | Catégorie             | Résultat | Preuve                                  | Statut   |
| ----- | ------------------------------------- | ---------------------- | --------------------- | -------- | --------------------------------------- | -------- |
| AC-01 | Filtrer et transmettre le code postal | 001 API, 005 UI        | `@positive`           | P        | `FILTERS1` : résultats et `code_postal` | Complète |
| AC-02 | Filtrer par commune/code INSEE        | 002, 005, 009, 010     | `@positive`, `@error` | P        | API, résolution Geo et erreur Geo       | Complète |
| AC-03 | Filtrer par statut A/C                | 003, 005               | `@positive`           | P        | API réelle et paramètre UI              | Complète |
| AC-04 | Combiner les filtres                  | 004, 006               | `@positive`           | P        | Combinaison API et UI                   | Complète |
| AC-05 | Conserver les filtres visibles        | 007, 008               | `@positive`           | P        | Contrôles et puces                      | Complète |
| AC-06 | Gérer zéro résultat filtré            | 008                    | `@positive`           | P        | État vide distinct d’une erreur         | Complète |
| AC-07 | Assurer requête/résultats cohérents   | 001–004, 006, 009, 010 | `@positive`, `@error` | P        | Paramètres et cartes                    | Complète |

### US-HISTORY-01 — 10/11, 90,9 %

| AC    | Comportement attendu                   | TC           | Catégorie                          | Résultat | Preuve                                                                                                                     | Statut   |
| ----- | -------------------------------------- | ------------ | ---------------------------------- | -------- | -------------------------------------------------------------------------------------------------------------------------- | -------- |
| AC-01 | Enregistrer les recherches éligibles   | 001, 007     | `@positive`                        | P        | `HIST` : succès avec/sans résultat                                                                                         | Complète |
| AC-02 | Conserver l’identité des critères      | 002, 004     | `@positive`                        | P        | Requête, CP, commune, statut                                                                                               | Complète |
| AC-03 | Respecter la récence                   | 002–005, 007 | `@positive`                        | P        | Ordre avant/après replay/reload                                                                                            | Complète |
| AC-04 | Gérer la répétition                    | 002, 007     | `@positive`                        | P        | Déduplication et navigation interne                                                                                        | Complète |
| AC-05 | Réutiliser une entrée                  | 004          | `@positive`                        | P        | Critères restaurés et GET relancé                                                                                          | Complète |
| AC-06 | Persister l’historique                 | 005          | `@positive`                        | P        | Vrai reload sans lecture API                                                                                               | Complète |
| AC-07 | Respecter la capacité de 12            | 003          | `@positive`                        | P        | Plus ancienne entrée évincée                                                                                               | Complète |
| AC-08 | Gérer l’état vide                      | 006          | `@positive`                        | P        | Clé absente et liste vide                                                                                                  | Complète |
| AC-09 | Nettoyer uniquement History            | 006          | `@positive`                        | P        | Autres stockages inchangés                                                                                                 | Complète |
| AC-10 | Rester robuste aux entrées incomplètes | 001, 008–010 | `@positive`, `@negative`, `@error` | P        | `TC-HISTORY-010` injecte une entrée ne contenant que `query` ; rendu neutre, action utilisable et aucun artefact technique | Complète |
| AC-11 | Éviter les opérations API inutiles     | 004–009      | `@positive`, `@negative`, `@error` | P        | Aucun write ; GET seulement au replay                                                                                      | Complète |

### US-PAGINATION-01 — 8/8, 100 %

| AC    | Comportement attendu                      | TC       | Catégorie   | Résultat | Preuve                            | Statut   |
| ----- | ----------------------------------------- | -------- | ----------- | -------- | --------------------------------- | -------- |
| AC-01 | Afficher l’état de pagination             | 001, 002 | `@positive` | P        | `PAG` : page/total et métadonnées | Complète |
| AC-02 | Passer à la page suivante                 | 001, 003 | `@positive` | P        | `page=2` et nouvelles cartes      | Complète |
| AC-03 | Revenir à la page précédente              | 001, 004 | `@positive` | P        | Page 1 et cartes correspondantes  | Complète |
| AC-04 | Respecter les limites                     | 001, 002 | `@positive` | P        | Boutons désactivés                | Complète |
| AC-05 | Choisir la taille de page                 | 005      | `@positive` | P        | `per_page` et contrôle            | Complète |
| AC-06 | Revenir page 1 après changement de taille | 005      | `@positive` | P        | Page et requête                   | Complète |
| AC-07 | Revenir page 1 après nouveaux critères    | 006      | `@positive` | P        | Nouvelle requête                  | Complète |
| AC-08 | Associer requête et résultats             | 001–006  | `@positive` | P        | URL, métadonnées et cartes        | Complète |

### US-SAVED-SEARCH-01 — 12/12, 100 %

| AC    | Comportement attendu                            | TC                      | Catégorie                | Résultat | Preuve                                        | Statut   |
| ----- | ----------------------------------------------- | ----------------------- | ------------------------ | -------- | --------------------------------------------- | -------- |
| AC-01 | Sauvegarder explicitement ; refuser un nom vide | 001, 008                | `@positive`, `@negative` | P        | `SAVED` : stockage inchangé pour nom invalide | Complète |
| AC-02 | Conserver le nom                                | 001, 002, 008           | `@positive`, `@negative` | P        | Nom exact et validation                       | Complète |
| AC-03 | Conserver les critères                          | 002, 004                | `@positive`              | P        | Requête, CP, commune, statut                  | Complète |
| AC-04 | Conserver la taille de page                     | 004                     | `@positive`              | P        | Contrôle restauré                             | Complète |
| AC-05 | Gérer les identités distinctes                  | 002, 003                | `@positive`              | P        | Déduplication, ordre, capacité                | Complète |
| AC-06 | Afficher les sauvegardes                        | 002, 003, 005, 006      | `@positive`              | P        | Noms et critères rendus                       | Complète |
| AC-07 | Relancer la recherche choisie                   | 004                     | `@positive`              | P        | Restauration et GET attendu                   | Complète |
| AC-08 | Persister après reload                          | 005                     | `@positive`              | P        | Vrai reload                                   | Complète |
| AC-09 | Supprimer uniquement la cible                   | 006                     | `@positive`              | P        | Autre sauvegarde préservée                    | Complète |
| AC-10 | Gérer l’état vide                               | 006, 007                | `@positive`              | P        | Clé absente, vide et vidée                    | Complète |
| AC-11 | Isoler Saved Searches de History                | 001, 002, 004, 006, 008 | `@positive`, `@negative` | P        | Snapshot History inchangé                     | Complète |
| AC-12 | Ne pas écrire vers l’API                        | 001–008                 | `@positive`, `@negative` | P        | Aucun write                                   | Complète |

### US-SEARCH-01 — 8/8, 100 %

| AC    | Comportement attendu                       | TC       | Catégorie             | Résultat | Preuve                               | Statut   |
| ----- | ------------------------------------------ | -------- | --------------------- | -------- | ------------------------------------ | -------- |
| AC-01 | Recherche textuelle valide                 | 001, 010 | `@positive`           | P        | `SEARCH` : API réelle et E2E réel    | Complète |
| AC-02 | Recherche SIREN valide                     | 002      | `@positive`           | P        | Requête 9 chiffres transmise         | Complète |
| AC-03 | Recherche SIRET valide                     | 003      | `@positive`           | P        | Requête 14 chiffres transmise        | Complète |
| AC-04 | Refuser les longueurs numériques invalides | 004      | `@negative`           | P        | Message et aucun appel API           | Complète |
| AC-05 | Afficher les informations essentielles     | 005, 010 | `@positive`           | P        | Champs du mock et données réelles    | Complète |
| AC-06 | Gérer zéro résultat                        | 006      | `@positive`           | P        | État vide distinct de l’erreur       | Complète |
| AC-07 | Gérer une erreur de recherche              | 007      | `@error`              | P        | HTTP 500 et message API              | Complète |
| AC-08 | Afficher le chargement                     | 008, 009 | `@positive`, `@error` | P        | Loading avant succès et avant erreur | Complète |

`TC-SEARCH-011` est un `test.fail()` sur le texte d’accueil « deux » contre « trois entreprises ». Il n’est relié à aucun AC de cette US et ne réduit donc pas son calcul, mais signale une lacune de traçabilité.

### US-SORT-01 — 9/9, 100 %

| AC    | Comportement attendu                    | TC           | Catégorie   | Résultat | Preuve                              | Statut   |
| ----- | --------------------------------------- | ------------ | ----------- | -------- | ----------------------------------- | -------- |
| AC-01 | Proposer les options de tri             | 001          | `@positive` | P        | `SORT` : options et valeur initiale | Complète |
| AC-02 | Trier/restaurer la pertinence           | 001, 005     | `@positive` | P        | Ordre brut restauré                 | Complète |
| AC-03 | Trier par nom                           | 002          | `@positive` | P        | Ascendant et descendant             | Complète |
| AC-04 | Trier par date                          | 003          | `@positive` | P        | Récente, ancienne, valeur absente   | Complète |
| AC-05 | Trier par statut                        | 004          | `@positive` | P        | A puis C, ordre stable              | Complète |
| AC-06 | Ne rien supprimer/dupliquer             | 006          | `@positive` | P        | Même ensemble de SIREN              | Complète |
| AC-07 | Réordonner localement                   | 005, 006     | `@positive` | P        | Aucun GET supplémentaire            | Complète |
| AC-08 | Appliquer le tri aux nouveaux résultats | 007          | `@positive` | P        | Deuxième réponse triée              | Complète |
| AC-09 | Cohérence contrôle/ordre                | 001–005, 007 | `@positive` | P        | Valeur du select et cartes          | Complète |

### US-STATS-01 — 8/8, 100 %

| AC    | Comportement attendu                     | TC       | Catégorie   | Résultat | Preuve                           | Statut   |
| ----- | ---------------------------------------- | -------- | ----------- | -------- | -------------------------------- | -------- |
| AC-01 | Afficher les statistiques avec résultats | 001      | `@positive` | P        | `STATS` : panneau visible        | Complète |
| AC-02 | Calculer sur les entreprises affichées   | 001, 006 | `@positive` | P        | Total, statuts, moyenne et dates | Complète |
| AC-03 | Mettre à jour après recherche            | 002      | `@positive` | P        | Anciennes valeurs absentes       | Complète |
| AC-04 | Mettre à jour après filtre               | 003      | `@positive` | P        | Réponse filtrée recalculée       | Complète |
| AC-05 | Mettre à jour après pagination           | 004      | `@positive` | P        | Valeurs de la nouvelle page      | Complète |
| AC-06 | Ne pas varier lors du tri                | 004      | `@positive` | P        | Valeurs inchangées               | Complète |
| AC-07 | Gérer l’absence de résultats             | 005      | `@positive` | P        | Panneau masqué et vidé           | Complète |
| AC-08 | Gérer les valeurs absentes               | 006      | `@positive` | P        | Absences exclues et rendu neutre | Complète |

### US-THEME-01 — 11/11 applicables, 100 %

| AC    | Comportement attendu                 | TC       | Catégorie   | Résultat | Preuve                                    | Statut         |
| ----- | ------------------------------------ | -------- | ----------- | -------- | ----------------------------------------- | -------------- |
| AC-01 | Exposer un contrôle utilisable       | 001      | `@positive` | P        | `THEME` : bouton visible/actif            | Complète       |
| AC-02 | Activer le thème alternatif          | 001      | `@positive` | P        | `data-theme=dark`, glyphe, stockage       | Complète       |
| AC-03 | Revenir au thème clair               | 001      | `@positive` | P        | Document, bouton et stockage              | Complète       |
| AC-04 | Persister le choix                   | 001, 002 | `@positive` | P        | Clé, valeurs et moment d’écriture         | Complète       |
| AC-05 | Restaurer après reload               | 002      | `@positive` | P        | Vrai reload                               | Complète       |
| AC-06 | Restaurer lors d’une nouvelle visite | 002      | `@positive` | P        | Nouvelle navigation, même contexte        | Complète       |
| AC-07 | État initial sans préférence         | 003      | `@positive` | P        | Clair sans écriture automatique           | Complète       |
| AC-08 | Préférence système                   | Aucun    | NA          | NA       | Aucun `matchMedia`/`prefers-color-scheme` | Non applicable |
| AC-09 | Isoler les autres stockages          | 001, 002 | `@positive` | P        | Sentinelles inchangées                    | Complète       |
| AC-10 | Rester indépendant du réseau         | 001–003  | `@positive` | P        | Zéro `/search`                            | Complète       |
| AC-11 | Rester cohérent entre vues           | 002      | `@positive` | P        | Vue Favoris représentative                | Complète       |
| AC-12 | Rester déterministe                  | 001–003  | `@positive` | P        | Pas d’API réelle ni pixel-perfect         | Complète       |

### US-FILTERS-02 — 10/10, 100 %

| AC    | Comportement attendu                         | TC       | Catégorie             | Résultat | Preuve                                 | Statut   |
| ----- | -------------------------------------------- | -------- | --------------------- | -------- | -------------------------------------- | -------- |
| AC-01 | Transmettre un NAF valide                    | 011      | `@positive`           | P        | `FILTERS2` : `activite_principale`     | Complète |
| AC-02 | Refuser un NAF invalide avant API            | 012      | `@negative`           | P        | Aucun appel recherche                  | Complète |
| AC-03 | Accepter les départements, `2A`, `2B`        | 013      | `@positive`           | P        | Paramètres transmis                    | Complète |
| AC-04 | Transmettre la région                        | 014      | `@positive`           | P        | Paramètre `region`                     | Complète |
| AC-05 | Transmettre la tranche                       | 015      | `@positive`           | P        | `tranche_effectif_salarie`             | Complète |
| AC-06 | Retirer une puce et revenir page 1           | 016      | `@positive`           | P        | Autres critères conservés              | Complète |
| AC-07 | Effacer les filtres sans perdre la requête   | 017      | `@positive`           | P        | Requête conservée                      | Complète |
| AC-08 | Restaurer les filtres depuis l’URL           | 018      | `@positive`           | P        | Contrôles et puces                     | Complète |
| AC-09 | Ignorer/normaliser les filtres URL invalides | 019      | `@negative`           | P        | Pas de requête incohérente             | Complète |
| AC-10 | Résoudre une commune via Geo API             | 010, 020 | `@error`, `@positive` | P        | Erreur Geo mockée et chaîne E2E réelle | Complète |

### US-AUTOCOMPLETE-01 — 10/10, 100 %

| AC    | Comportement attendu                    | TC  | Catégorie   | Résultat | Preuve                                 | Statut   |
| ----- | --------------------------------------- | --- | ----------- | -------- | -------------------------------------- | -------- |
| AC-01 | Ne rien demander sous trois caractères  | 001 | `@negative` | P        | `AUTO` : zéro requête                  | Complète |
| AC-02 | Debouncer la saisie                     | 002 | `@positive` | P        | Seule valeur stabilisée demandée       | Complète |
| AC-03 | Afficher nom, SIREN et localisation     | 003 | `@positive` | P        | Contenu de l’option                    | Complète |
| AC-04 | Gérer clavier et ARIA                   | 004 | `@positive` | P        | Flèche, actif, attributs ARIA          | Complète |
| AC-05 | Valider par Entrée                      | 005 | `@positive` | P        | Bonne recherche lancée                 | Complète |
| AC-06 | Fermer par Échap                        | 006 | `@positive` | P        | Liste fermée sans recherche            | Complète |
| AC-07 | Annoncer aucune suggestion              | 007 | `@positive` | P        | Rôle `status`                          | Complète |
| AC-08 | Ne pas bloquer après erreur             | 008 | `@error`    | P        | Erreur annoncée puis recherche réussie | Complète |
| AC-09 | Ignorer une réponse obsolète            | 009 | `@positive` | P        | A tardif ne remplace pas B             | Complète |
| AC-10 | Exclure SIREN/SIRET de l’autocomplétion | 010 | `@negative` | P        | Zéro requête suggestion                | Complète |

### US-SHARE-01 — 7/7, 100 %

| AC    | Comportement attendu                  | TC  | Catégorie   | Résultat | Preuve                     | Statut   |
| ----- | ------------------------------------- | --- | ----------- | -------- | -------------------------- | -------- |
| AC-01 | Produire une URL simple               | 001 | `@positive` | P        | `SHARE` : paramètre `q`    | Complète |
| AC-02 | Représenter les critères supportés    | 002 | `@positive` | P        | Paramètres du lien         | Complète |
| AC-03 | Restaurer la recherche depuis le lien | 003 | `@positive` | P        | Contrôles et résultats     | Complète |
| AC-04 | Préserver accents et espaces          | 004 | `@positive` | P        | Aller-retour URL           | Complète |
| AC-05 | Utiliser Clipboard API                | 005 | `@positive` | P        | `writeText` reçoit l’URL   | Complète |
| AC-06 | Utiliser un fallback sans crash       | 006 | `@error`    | P        | Toast et vue fonctionnelle | Complète |
| AC-07 | Exposer un feedback accessible        | 007 | `@positive` | P        | Live region                | Complète |

### US-COMPARE-02 — 9/9, 100 %

| AC    | Comportement attendu                             | TC  | Catégorie   | Résultat | Preuve                           | Statut   |
| ----- | ------------------------------------------------ | --- | ----------- | -------- | -------------------------------- | -------- |
| AC-01 | Aide avec une sélection                          | 007 | `@positive` | P        | `CMP2` : panneau et texte d’aide | Complète |
| AC-02 | Tableau avec deux entreprises                    | 008 | `@positive` | P        | Tableau et en-têtes              | Complète |
| AC-03 | Associer trois colonnes                          | 009 | `@positive` | P        | Trois noms/SIREN                 | Complète |
| AC-04 | Refuser la quatrième                             | 010 | `@negative` | P        | Toast et stockage inchangé       | Complète |
| AC-05 | Retirer sans désaligner                          | 011 | `@positive` | P        | Colonne médiane supprimée        | Complète |
| AC-06 | Neutraliser les données manquantes               | 012 | `@positive` | P        | Rendu neutre                     | Complète |
| AC-07 | Rendre les différences perceptibles sans couleur | 013 | `@positive` | P        | Indication textuelle             | Complète |
| AC-08 | Persister trois sélections                       | 014 | `@positive` | P        | LocalStorage et reload           | Complète |
| AC-09 | Nommer chaque bouton Retirer                     | 015 | `@positive` | P        | Nom accessible avec entreprise   | Complète |

### US-EXPORT-02 — 9/9, 100 %

| AC    | Comportement attendu                            | TC  | Catégorie   | Résultat | Preuve                                    | Statut   |
| ----- | ----------------------------------------------- | --- | ----------- | -------- | ----------------------------------------- | -------- |
| AC-01 | Choisir CSV ou JSON                             | 007 | `@positive` | P        | `EXP2` : options du dialogue              | Complète |
| AC-02 | Comparer le JSON sémantiquement                 | 008 | `@positive` | P        | Pas d’ordre de propriétés imposé          | Complète |
| AC-03 | Exporter seulement la comparaison               | 009 | `@positive` | P        | SIREN sélectionnés uniquement             | Complète |
| AC-04 | Échapper le CSV                                 | 010 | `@positive` | P        | Séparateur, guillemets, ligne, accents    | Complète |
| AC-05 | Neutraliser les quatre préfixes                 | 011 | `@positive` | P        | Espaces inclus                            | Complète |
| AC-06 | Neutraliser les valeurs absentes                | 012 | `@positive` | P        | Cellules attendues                        | Complète |
| AC-07 | Produire un nom déterministe                    | 013 | `@positive` | P        | Nom et extension                          | Complète |
| AC-08 | Ne pas produire de fichier sans résultat        | 014 | `@negative` | P        | Contrôle désactivé                        | Complète |
| AC-09 | Invalider l’ancien export pendant une recherche | 015 | `@negative` | P        | Ancien export désactivé, nouveau réactivé | Complète |

## Tests en échec attendu

| TC                 | Catégorie                      | Défaut    | Assertion attendue non satisfaite                                      | Impact sur la couverture                              |
| ------------------ | ------------------------------ | --------- | ---------------------------------------------------------------------- | ----------------------------------------------------- |
| `TC-FAVORITES-004` | `@positive @regression`        | `BUG-005` | La carte doit refléter immédiatement le favori modifié depuis la fiche | `US-FAVORITES-01 / AC-07` non validé                  |
| `TC-DEEP-LINK-002` | `@positive @regression`        | `BUG-016` | Après reset, l’URL ne doit plus conserver `cityCode`                   | `US-DEEP-LINKING-01 / AC-06` partiel                  |
| `TC-SEARCH-011`    | `@positive @regression @smoke` | `BUG-015` | L’accueil doit annoncer une comparaison jusqu’à trois entreprises      | Aucun AC Search correspondant ; traçabilité manquante |

Ces tests sont correctement classés par type de situation, mais leur présence ne prouve pas la conformité du produit.

## Bilan par User Story

| User Story         | AC totaux | AC non applicables | AC pleinement conformes | Partiels ou non validés |       Présence de tests |  Couverture effective | 100 % ? |
| ------------------ | --------: | -----------------: | ----------------------: | ----------------------: | ----------------------: | --------------------: | ------- |
| US-COMPARE-01      |        12 |                  0 |                      12 |                       0 |                   12/12 |                 100 % | Oui     |
| US-DEEP-LINKING-01 |        12 |                  1 |                      10 |                       1 |       11/11 applicables |                90,9 % | **Non** |
| US-DETAIL-01       |         9 |                  0 |                       9 |                       0 |                     9/9 |                 100 % | Oui     |
| US-EXPORT-01       |        11 |                  0 |                      11 |                       0 |                   11/11 |                 100 % | Oui     |
| US-FAVORITES-01    |         9 |                  0 |                       8 |                       1 |                     9/9 |                88,9 % | **Non** |
| US-FILTERS-01      |         7 |                  0 |                       7 |                       0 |                     7/7 |                 100 % | Oui     |
| US-HISTORY-01      |        11 |                  0 |                      11 |                       0 |                   11/11 |                 100 % | Oui     |
| US-PAGINATION-01   |         8 |                  0 |                       8 |                       0 |                     8/8 |                 100 % | Oui     |
| US-SAVED-SEARCH-01 |        12 |                  0 |                      12 |                       0 |                   12/12 |                 100 % | Oui     |
| US-SEARCH-01       |         8 |                  0 |                       8 |                       0 |                     8/8 |                 100 % | Oui     |
| US-SORT-01         |         9 |                  0 |                       9 |                       0 |                     9/9 |                 100 % | Oui     |
| US-STATS-01        |         8 |                  0 |                       8 |                       0 |                     8/8 |                 100 % | Oui     |
| US-THEME-01        |        12 |                  1 |                      11 |                       0 |       11/11 applicables | 100 % des applicables | Oui     |
| US-FILTERS-02      |        10 |                  0 |                      10 |                       0 |                   10/10 |                 100 % | Oui     |
| US-AUTOCOMPLETE-01 |        10 |                  0 |                      10 |                       0 |                   10/10 |                 100 % | Oui     |
| US-SHARE-01        |         7 |                  0 |                       7 |                       0 |                     7/7 |                 100 % | Oui     |
| US-COMPARE-02      |         9 |                  0 |                       9 |                       0 |                     9/9 |                 100 % | Oui     |
| US-EXPORT-02       |         9 |                  0 |                       9 |                       0 |                     9/9 |                 100 % | Oui     |
| **Total**          |   **173** |              **2** |                 **169** |                   **2** | **171/171 applicables** |            **98,8 %** | **Non** |

## Distinction entre tests existants et validation du produit

| Axe                          | Conclusion                                                                                                                                                         |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Présence de tests            | Chaque AC applicable possède au moins une trace vers un test existant : 171/171.                                                                                   |
| Couverture des comportements | 169 AC sont entièrement prouvés. Deux autres AC disposent d’un oracle complet mais placé derrière `test.fail()`.                                                   |
| Validation effective         | 169/171 AC applicables sont confirmés. Deep Linking AC-06 et Favorites AC-07 restent non conformes ; ils ne sont pas traités par cette mise à jour.                |
| Catégories                   | L’absence de `@negative` ou `@error` sur de nombreux AC est normale : ces catégories ne s’appliquent pas lorsque le critère ne décrit ni refus ni panne technique. |

## Divergences entre exigences, plans, tests et rapports

1. **Résolu le 2026-09-28** — Le rapport recense désormais 18 US, dont les cinq US définies dans [`specs/v1.1.1/REQUIREMENTS.md`](specs/v1.1.1/REQUIREMENTS.md), sans doublon et avec un lien vers leur source.
2. **Résolu le 2026-09-28** — Le rapport sépare 133 tests actifs ordinaires, trois scénarios annotés `test.fail()` et zéro `test.fixme()`. Les résultats d’exécution sont présentés séparément des annotations du code.
3. **Résolu le 2026-09-28 pour la présentation du rapport** — Le JSON Playwright est analysé sans double comptage et distingue réussites ordinaires, échecs attendus observés, succès inattendus, échecs inattendus, tests ignorés et instables. La campagne Chromium de validation contient 136 exécutions uniques : 133 succès ordinaires, trois échecs attendus observés et aucun résultat inattendu, ignoré ou instable.
4. Le plan Deep Linking associe encore `TC-DEEP-LINK-002` à AC-06 comme test actif, alors que le test porte `BUG-016` et `test.fail()`.
5. **Résolu le 2026-09-28** — Les plans concernés qualifient maintenant les futurs `test.fixme` comme décisions historiques et indiquent le statut actuel daté des défauts résolus.
6. **Résolu le 2026-09-28** — [`specs/v1.1.1/TEST-PLAN-V111.md`](specs/v1.1.1/TEST-PLAN-V111.md) décrit désormais `TC-SAVED-008` comme le refus d’un nom vide ou blanc et attribue la suppression accessible à `TC-SAVED-006`.
7. **Résolu le 2026-09-28** — `TC-HISTORY-010` prépare une entrée locale réellement incomplète et complète la preuve d’AC-10.
8. `TC-SEARCH-011 / BUG-015` porte une exigence de contenu Compare v1.1.1 qui n’est formulée dans aucun AC actuel.

## Informations impossibles à confirmer depuis le dépôt

- La date et la version exacte du produit déployé auxquelles chaque plan historique se réfère ne sont pas formalisées de manière uniforme.
- Le rapport ne conserve pas un statut d’exécution par AC ; il faut le reconstruire depuis les tests, les `test.fail()` et l’exécution Playwright.
- Pour les AC explicitement conditionnels et non applicables (`DEEP-LINKING AC-07`, `THEME AC-08`), aucune validation produit positive n’est revendiquée : le dépôt documente l’absence du contrat correspondant.

## Écarts concrets à traiter

1. Corriger `BUG-005`, retirer `test.fail()` de `TC-FAVORITES-004` et obtenir la synchronisation carte/fiche/favoris attendue.
2. Corriger `BUG-016`, retirer `test.fail()` de `TC-DEEP-LINK-002` et vérifier que le reset supprime réellement `cityCode` de l’URL.
3. **Résolu le 2026-09-28** — `TC-HISTORY-010` initialise `fce_history` avec une entrée incomplète, puis vérifie un rendu neutre, l’action `Relancer`, l’absence d’artefact technique et l’absence d’appel API.
4. Corriger `BUG-015` ou formaliser le texte d’accueil dans une AC appropriée de la comparaison v1.1.1.
5. **Résolu le 2026-09-28** — Le générateur recense 18/18 US, conserve leur source et rejette les doublons ou rattachements vers une US inconnue.
6. **Résolu le 2026-09-28** — Le rapport sépare les annotations statiques et les statuts runtime, y compris les succès inattendus, sans compter les retries comme des tests supplémentaires.
7. **Résolu le 2026-09-28** — Les plans des défauts résolus portent une mise à jour datée ; `TC-SAVED-008` et `TC-SAVED-006` ont retrouvé leurs responsabilités réelles.

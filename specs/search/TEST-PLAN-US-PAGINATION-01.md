# Plan de test — US-PAGINATION-01

## Références et périmètre

- **User Story :** `US-PAGINATION-01` — Parcourir les pages de résultats.
- **Source :** `specs/search/US-PAGINATION-01.md`, lue intégralement sans modification.
- **Application explorée :** version déployée de French Companies Explorer et API publique `GET /search`, en lecture seule.
- **Couvertures prises en compte :** `US-SEARCH-01` et `US-FILTERS-01`, leurs plans et leurs tests existants.
- **Objectif :** couvrir les responsabilités de pagination au niveau le plus bas utile, sans répéter le contrat générique de recherche, le rendu détaillé des cartes, les règles métier des filtres ou l'état vide.

## Synthèse de l'exploration

L'exploration de l'application réelle et des échanges réseau a établi les éléments suivants :

- l'API retourne les propriétés de premier niveau `results`, `total_results`, `page`, `per_page` et `total_pages` ;
- deux appels réels avec une petite valeur `per_page` et des numéros de page consécutifs ont retourné le numéro et la taille demandés, des collections non vides et distinctes ; le total observé reste une donnée volatile et ne doit pas devenir une valeur attendue ;
- le frontend n'utilise que `total_results` pour calculer le maximum avec `Math.ceil(total_results / per_page)` ; il n'utilise pas directement `total_pages` retourné par l'API ;
- l'état visible a la forme « Page n / maximum » ; la pagination est masquée lorsque `total_results <= per_page` ;
- les seuls contrôles de navigation sont « ← Précédent » et « Suivant → » ; il n'existe ni accès direct à un numéro de page, ni contrôle dédié première/dernière page ;
- en première page, « Précédent » est désactivé ; en dernière page, « Suivant » est désactivé ;
- l'appel suivant transmet `page=2` et conserve `per_page` ; le retour transmet `page=1` ; les cartes précédentes sont vidées pendant la requête puis remplacées par celles de la réponse reçue ;
- les tailles proposées sont exactement `10`, `20` et `25`, avec `20` par défaut ;
- une soumission de recherche transmet toujours `q`, `page` et `per_page` ; les filtres non vides sont ajoutés comme déjà couvert dans `US-FILTERS-01` ;
- depuis une page supérieure à 1, soumettre un nouveau texte ou des critères modifiés repart avec `page=1` ;
- **écart observé :** sélectionner une autre taille de page ne déclenche aucune requête. Depuis une page supérieure à 1, l'ancienne page, son libellé et ses résultats restent affichés jusqu'à une nouvelle soumission explicite. Ce comportement contredit `AC-05` et `AC-06` ; le résultat attendu ci-dessous reste celui de la spécification.

## Stratégie de couverture

Le plan retient **un cas `API`** pour le contrat de pagination réel et **cinq cas `UI_MOCKED`** pour les responsabilités du frontend. Aucun nouveau `E2E_REAL` n'est retenu : `TC-SEARCH-010` couvre déjà la jointure générale application ↔ API, tandis que le contrat de pagination réel et le mapping déterministe du frontend sont couverts séparément ci-dessous. La défaillance de changement de taille est reproductible avec le frontend déployé indépendamment des données réelles ; un E2E supplémentaire n'apporterait donc pas une preuve distincte.

Les réponses mockées devront contenir des entreprises synthétiques distinctes par page, ainsi que `total_results`, `page`, `per_page` et `total_pages`. Elles seront installées avant toute action. Les synchronisations devront reposer sur les requêtes/réponses et les états visibles, sans temporisation arbitraire.

## Cas de test

### TC-PAGINATION-001 — Contrat réel et différenciation des pages API

- **Question principale :** l'API expose-t-elle des métadonnées de pagination cohérentes et des résultats réellement différenciés pour deux pages consécutives ?
- **Objectif :** valider le contrat backend de pagination consommé par le frontend sans se limiter à un statut HTTP 200.
- **Critères couverts :** contribution à `AC-01`, `AC-02`, `AC-03`, `AC-04` et `AC-08`.
- **Préconditions :** API publique disponible ; requêtes `GET` uniquement ; terme textuel assez large pour disposer d'au moins deux pages, sans cibler une entreprise.
- **Étapes essentielles :**
  1. Envoyer `GET /search` avec le même `q`, `page=1` et une petite valeur `per_page`.
  2. Vérifier le succès HTTP, la structure de `results` et les métadonnées `total_results`, `page`, `per_page`, `total_pages`.
  3. Exiger que les métadonnées annoncent au moins deux pages et que la première collection contienne au moins un résultat exploitable.
  4. Envoyer la même recherche avec `page=2` et le même `per_page`.
  5. Exiger une seconde collection exploitable, vérifier les métadonnées de page 2, puis comparer les identifiants des collections sans supposer leur ordre.
- **Résultat attendu :** chaque réponse indique le numéro et la taille demandés ; les types et relations de pagination sont cohérents (`total_pages >= 2`, pages dans leurs limites, résultats au plus égaux à `per_page`) ; les deux ensembles de résultats ne sont pas identiques et contiennent au moins une différence. Une collection vide ou deux pages indiscernables ne permettent pas au test de réussir silencieusement. Aucun total, entreprise, SIREN ou ordre exact n'est figé.
- **Niveau :** `API`.
- **Priorité :** Haute.
- **Justification du niveau :** la pagination et ses métadonnées sont assurées par le backend. Un navigateur n'ajouterait pas de confiance à cette question et rendrait la preuve plus coûteuse.

### TC-PAGINATION-002 — État initial et limites de navigation

- **Question principale :** l'interface représente-t-elle correctement les première et dernière pages et empêche-t-elle de dépasser leurs limites ?
- **Objectif :** vérifier le calcul visuel depuis `total_results/per_page`, la visibilité de la pagination et les gardes des contrôles aux deux frontières.
- **Critères couverts :** `AC-01`, `AC-04`, contribution à `AC-08`.
- **Préconditions :** état navigateur vierge ; route API installée ; réponse déterministe de trois pages.
- **Étapes essentielles :**
  1. Soumettre une recherche dont la réponse mockée de page 1 annonce trois pages calculables.
  2. Examiner le libellé courant et les contrôles précédent/suivant.
  3. Naviguer avec les contrôles jusqu'à la troisième page en servant les métadonnées cohérentes correspondantes.
  4. Examiner les contrôles en dernière page et tenter uniquement les actions encore autorisées par l'interface.
- **Résultat attendu :** la pagination est visible ; la page 1 est annoncée sur 3, « Précédent » est désactivé et « Suivant » est disponible ; en page 3 sur 3, « Suivant » est désactivé et « Précédent » reste disponible. Aucune requête de page 0 ou 4 n'est possible depuis ces contrôles.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Haute.
- **Justification du niveau :** le calcul et l'activation des contrôles sont des responsabilités frontend. Des métadonnées synthétiques rendent les deux frontières stables sans figer un total public.

### TC-PAGINATION-003 — Page suivante et remplacement des résultats

- **Question principale :** demander la page suivante envoie-t-il le bon numéro et remplace-t-il intégralement les résultats précédents par ceux de la nouvelle réponse ?
- **Objectif :** prévenir un changement d'étiquette sans changement de requête et le mélange de résultats de pages différentes.
- **Critères couverts :** `AC-02`, `AC-08`.
- **Préconditions :** état navigateur vierge ; routes installées avant la recherche ; page 1 et page 2 possèdent des cartes synthétiques distinctives et des métadonnées cohérentes.
- **Étapes essentielles :**
  1. Lancer la recherche et attendre la réponse mockée de page 1.
  2. Vérifier la carte distinctive de page 1 et l'état « Page 1 / 2 ».
  3. Cliquer sur « Suivant » et observer la nouvelle requête.
  4. Contrôler l'état observable pendant le changement, puis résoudre avec la réponse de page 2.
  5. Examiner le libellé et la grille après résolution.
- **Résultat attendu :** la seconde requête conserve les critères et `per_page`, et transmet `page=2` ; les résultats de page 1 ne restent pas présentés comme appartenant à page 2 ; seule la carte de page 2 est affichée et le libellé devient « Page 2 / 2 ».
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Haute.
- **Justification du niveau :** construction de requête, nettoyage et remplacement du DOM relèvent du frontend. Des pages distinctes et une résolution contrôlée fournissent une preuve déterministe.

### TC-PAGINATION-004 — Retour à la page précédente

- **Question principale :** depuis une page supérieure à 1, le retour demande-t-il la page précédente et restitue-t-il sa réponse ?
- **Objectif :** vérifier le calcul décrémental et la cohérence de l'affichage au retour, responsabilité distincte du bouton suivant.
- **Critères couverts :** `AC-03`, contribution à `AC-08`.
- **Préconditions :** état navigateur vierge ; routes installées ; recherche amenée en page 2 avec deux réponses synthétiques distinctes.
- **Étapes essentielles :**
  1. Afficher la page 2 d'une recherche déterministe.
  2. Cliquer sur « Précédent » et observer la requête produite.
  3. Servir la réponse distinctive de page 1 et attendre son rendu.
- **Résultat attendu :** la requête conserve recherche, filtres éventuels et taille, mais transmet `page=1` ; les résultats affichés correspondent à la réponse de page 1 et le libellé redevient « Page 1 / 2 ».
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Moyenne.
- **Justification du niveau :** le décrément et le rendu au retour sont entièrement contrôlés par l'interface. Le test API précédent démontre déjà que le backend sait servir page 1 et page 2.

### TC-PAGINATION-005 — Changement de taille depuis une page supérieure

- **Défaut connu associé :** `BUG-002 — Le changement de taille de page ne relance pas la recherche` (`defects/BUG-002-page-size-change-does-not-refresh.md`).
- **Question principale :** choisir une taille proposée depuis une page supérieure déclenche-t-il une requête avec le nouveau `per_page`, réinitialise-t-il `page=1` et affiche-t-il la réponse correspondante ?
- **Objectif :** couvrir ensemble l'action utilisateur et sa conséquence indissociable : une taille modifiée rend la position courante potentiellement incohérente.
- **Critères couverts :** `AC-05`, `AC-06`, `AC-08`.
- **Préconditions :** état navigateur vierge ; routes installées ; recherche affichée en page 2 ; réponses distinctives prévues pour l'ancienne page et la page 1 avec la nouvelle taille.
- **Étapes essentielles :**
  1. Vérifier que le contrôle propose `10`, `20` et `25`, avec `20` initialement sélectionné.
  2. Depuis la page 2, sélectionner une autre valeur proposée, par exemple `10`.
  3. Observer la requête déclenchée et résoudre la réponse mockée associée à la nouvelle taille.
  4. Examiner les résultats, le contrôle de taille et l'état de pagination.
- **Résultat attendu :** une nouvelle requête transmet `per_page=10` et `page=1` en conservant les autres critères ; les anciennes cartes sont remplacées par la nouvelle réponse ; la taille sélectionnée reste visible et le libellé correspond à la page 1 recalculée depuis les nouvelles métadonnées.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Haute.
- **Justification du niveau :** les options, l'événement de changement, la réinitialisation et le rendu sont exclusivement frontend. Le mock isole le défaut observé de toute volatilité API. **Ce cas échouerait sur la version explorée, qui ne déclenche aucune requête au changement de sélection ; l'attendu ne doit pas être affaibli pour refléter ce comportement.**
- **Traitement du défaut connu lors de l’automatisation :** tant que `BUG-002` reste ouvert, l’implémentation de `TC-PAGINATION-005` devra être déclarée explicitement avec `test.fixme`, tout en conservant le corps et les assertions du résultat fonctionnel attendu. Ce choix maintient la spécification, rend le défaut visible dans la suite, évite une CI volontairement rouge en permanence et permet de réactiver immédiatement le scénario après correction du produit.

### TC-PAGINATION-006 — Réinitialisation après changement des critères

- **Question principale :** toute nouvelle soumission modifiant les critères déterminants repart-elle de la page 1 et remplace-t-elle l'ancien état de pagination ?
- **Objectif :** vérifier la règle unique de réinitialisation avec des partitions représentatives, sans dupliquer les règles métier de recherche ou de filtrage.
- **Critères couverts :** `AC-07`, contribution à `AC-08`.
- **Préconditions :** état navigateur vierge pour chaque partition ; routes installées ; recherche initiale affichée en page 2 ; réponses synthétiques distinctes pour les nouveaux critères.
- **Étapes essentielles :**
  1. Partition « nouvelle recherche » : depuis page 2, remplacer le texte puis soumettre.
  2. Vérifier la requête et l'affichage issus de la nouvelle recherche.
  3. Partition indépendante « critère de filtre » : depuis page 2, modifier un filtre représentatif puis soumettre.
  4. Vérifier la requête et l'affichage issus des nouveaux critères.
- **Résultat attendu :** dans chaque partition, une seule nouvelle requête transmet `page=1`, la taille courante et uniquement les critères actuels ; les cartes et le libellé de l'ancienne page sont remplacés par ceux de la nouvelle réponse. Les assertions détaillées sur la validité du texte, la sémantique des filtres et leurs libellés ne sont pas répétées.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Haute.
- **Justification du niveau :** la remise à 1 est une règle d'état frontend. Deux partitions dans un même cas suffisent, car elles répondent à la même question métier ; `US-SEARCH-01` et `US-FILTERS-01` couvrent déjà la validité et le mapping détaillé des critères.

## Matrice de traçabilité

| Cas de test         | Critère(s)                                                | Niveau      | Priorité |
| ------------------- | --------------------------------------------------------- | ----------- | -------- |
| `TC-PAGINATION-001` | contributions `AC-01`, `AC-02`, `AC-03`, `AC-04`, `AC-08` | `API`       | Haute    |
| `TC-PAGINATION-002` | `AC-01`, `AC-04`, contribution `AC-08`                    | `UI_MOCKED` | Haute    |
| `TC-PAGINATION-003` | `AC-02`, `AC-08`                                          | `UI_MOCKED` | Haute    |
| `TC-PAGINATION-004` | `AC-03`, contribution `AC-08`                             | `UI_MOCKED` | Moyenne  |
| `TC-PAGINATION-005` | `AC-05`, `AC-06`, `AC-08`                                 | `UI_MOCKED` | Haute    |
| `TC-PAGINATION-006` | `AC-07`, contribution `AC-08`                             | `UI_MOCKED` | Haute    |

## Analyse de couverture

### Critères entièrement couverts

- `AC-01` : le contrat de métadonnées est contrôlé par `TC-PAGINATION-001` et sa représentation navigable par `TC-PAGINATION-002`.
- `AC-02` : `TC-PAGINATION-003` vérifie le paramètre suivant, l'état visible et le remplacement ; `TC-PAGINATION-001` apporte la preuve complémentaire que l'API sert des pages distinctes.
- `AC-03` : `TC-PAGINATION-004` vérifie le calcul précédent et son rendu ; le backend est couvert sans second appel redondant par `TC-PAGINATION-001`.
- `AC-04` : `TC-PAGINATION-002` couvre les deux limites et la cohérence du libellé à partir de métadonnées déterministes.
- `AC-05` et `AC-06` : le comportement attendu est spécifié par `TC-PAGINATION-005`, qui révélera l'écart actuellement observé tant qu'il n'est pas corrigé.
- `AC-07` : `TC-PAGINATION-006` couvre les deux catégories de changement avec des partitions, sans multiplier les tests par filtre.
- `AC-08` : la cohérence est vérifiée au fil des transitions qui peuvent la rompre (`TC-PAGINATION-002`, `003`, `004`, `005`, `006`) plutôt que par un doublon générique supplémentaire.

### Trous de couverture

Aucun critère n'est laissé sans cas planifié. En revanche, `AC-05` et `AC-06` ne sont actuellement pas satisfaits par le produit. Cette situation est tracée par `BUG-002`, et `TC-PAGINATION-005` constitue le test de non-régression associé. Tant que le défaut reste ouvert, son automatisation devra porter un `test.fixme` explicite ; le plan conserve les critères et le résultat attendu inchangés.

### Doublons volontairement évités

- Le statut HTTP et la structure générique d'une recherche ne sont pas répétés au navigateur : `TC-SEARCH-001` les couvre déjà. `TC-PAGINATION-001` ajoute seulement les métadonnées et la différenciation de pages.
- Le rendu détaillé d'une carte n'est pas reproduit : `TC-SEARCH-005` le couvre. Les tests de pagination n'utilisent que des identifiants synthétiques distinctifs pour rattacher une carte à une réponse.
- Le chargement, l'erreur et l'état vide ne sont pas redémontrés : `TC-SEARCH-006` à `009` les couvrent. `TC-PAGINATION-003` contrôle uniquement la disparition de l'ancienne page et l'association à la nouvelle réponse.
- Le mapping détaillé de chaque filtre n'est pas répété : `TC-FILTERS-005` et `006` le couvrent. `TC-PAGINATION-006` ne vérifie que la remise à `page=1`.
- Aucun test UI ne prétend valider la sémantique backend de `page` ou `per_page` ; cette responsabilité reste dans `TC-PAGINATION-001`.

### Scénarios volontairement non automatisés

- Un cas par valeur `10`, `20`, `25` n'est pas proposé : vérifier la liste des options puis exercer une valeur non par défaut suffit à la règle de mapping.
- Toutes les pages intermédiaires et tous les totaux possibles ne sont pas parcourus : les partitions première, intermédiaire et dernière couvrent les risques sans dépendre d'un volume réel.
- Les clics forcés sur un bouton désactivé et les appels programmatiques internes ne représentent pas un parcours utilisateur utile ; l'état désactivé et l'absence de navigation disponible constituent la preuve aux limites.
- Le cas à une seule page n'est pas isolé : l'absence de pagination pour une réponse vide est déjà couverte par `TC-SEARCH-006`, et la règle des limites avec résultats est couverte par `TC-PAGINATION-002`. Il pourra être ajouté uniquement si un risque d'accessibilité ou d'affichage propre à une page unique apparaît.
- La restauration de `page` et `size` depuis l'URL est exclue par la User Story, qui écarte le deep linking complet.
- Le tri, l'historique et les recherches sauvegardées sont hors périmètre ; leurs effets éventuels sur la page seront traités dans leurs User Stories respectives.

### Écarts entre les critères et le comportement observé

- **Écart confirmé sur `AC-05` et `AC-06`, avec contribution à l’incohérence couverte par `AC-08` :** le contrôle de taille affiche bien `10`, `20`, `25`, mais aucun gestionnaire de changement ne relance la recherche. Choisir une valeur depuis page 2 ou 3 conserve l'ancien numéro, l'ancien libellé et les anciennes cartes. Une soumission ultérieure transmet alors la nouvelle valeur et `page=1`, ce qui ne satisfait pas l'exigence « lorsque l'utilisateur choisit ». Le défaut est tracé par `BUG-002` et `TC-PAGINATION-005` en est le test de non-régression associé.
- La pagination affichée est calculée par le frontend avec `Math.ceil(total_results / per_page)` plutôt qu'avec `total_pages`. Les valeurs observées sont cohérentes, mais `TC-PAGINATION-001` doit continuer de vérifier le contrat complet de l'API et `TC-PAGINATION-002` le calcul réellement consommé par l'interface.
- La modification d'un texte ou d'un filtre ne lance pas instantanément une requête ; la remise à page 1 intervient à la soumission du formulaire « Rechercher ». Le plan considère « nouvelle recherche ou modification des critères » comme une modification suivie de sa soumission, conformément au modèle d'interaction actuel. Si `AC-07` exige au contraire une recherche automatique dès chaque saisie, une clarification produit est nécessaire.

### Justification de l'absence d'un nouvel E2E_REAL

`TC-SEARCH-010` démontre déjà qu'une réponse réelle de l'API est consommée et rendue par l'application. `TC-PAGINATION-001` vérifie séparément que l'API réelle fournit des métadonnées cohérentes et des pages distinctes. Les cas `UI_MOCKED` vérifient ensuite exactement les paramètres, limites, remplacements et réinitialisations avec des réponses stables. Aucun risque de jointure supplémentaire ne reste sans preuve au point de justifier un navigateur dépendant de données publiques volatiles. `BUG-002` est purement frontend et reproductible avec une API mockée par `TC-PAGINATION-005` ; un E2E réel supplémentaire serait redondant et moins maintenable.

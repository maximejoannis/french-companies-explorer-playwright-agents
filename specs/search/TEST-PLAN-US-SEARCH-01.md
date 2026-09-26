# Plan de test — US-SEARCH-01 — Rechercher une entreprise

## Objet et stratégie

Ce plan couvre la recherche par texte, SIREN et SIRET, la validation des identifiants numériques et les états de restitution associés. Il applique une stratégie fondée sur les risques : contrat backend au niveau `API`, logique et états frontend au niveau `UI_MOCKED`, et un seul parcours `E2E_REAL` pour vérifier la jointure critique entre l'application et l'API publique.

Les données publiques pouvant évoluer, les contrôles sur l'API réelle portent sur le statut HTTP, la structure et des invariants de contrat. Ils n'imposent ni nombre exact de résultats, ni ordre immuable, ni contenu métier figé d'une entreprise particulière.

## Confrontation avec l'application réelle

Exploration effectuée le 29 août 2026 sur `https://maximejoannis.github.io/french-companies-explorer-qa/`, dans un état navigateur frais.

Comportements constatés :

- le champ de recherche est identifié par le nom accessible « Recherche d’entreprise » et accepte une soumission par le bouton « Rechercher » ou par Entrée ;
- l'application distingue visuellement « Recherche textuelle », « SIREN détecté » et « SIRET détecté » ;
- une valeur uniquement numérique d'une longueur différente de 9 et 14 affiche : « Identifiant invalide : un SIREN contient 9 chiffres et un SIRET 14 chiffres » et la recherche est arrêtée avant l'appel réseau ;
- une recherche autorisée affiche « Recherche en cours… », vide les résultats précédents et masque la pagination pendant l'attente ;
- une réponse contenant des résultats produit des cartes avec, notamment, nom, SIREN, statut, activité, siège et date de création ;
- une réponse vide affiche « Aucune entreprise ne correspond à cette recherche. » ;
- une réponse HTTP non réussie ou une erreur réseau affiche « Impossible de joindre l'API. Réessaie dans quelques instants. » et le compteur « Erreur API » ;
- le paramètre utilisateur est transmis à l'API sous `q`, accompagné de `page` et `per_page` ; SIREN et SIRET suivent le même endpoint de recherche que le texte.

## Cas de test retenus

### TC-SEARCH-001 — Contrat minimal d'une recherche textuelle sur l'API réelle

**Question principale :** l'API publique accepte-t-elle une recherche textuelle valide et retourne-t-elle une réponse exploitable par le frontend ?

- **Critère couvert :** `AC-01`
- **Niveau principal :** `API`
- **Priorité :** Haute
- **Préconditions :** API publique accessible ; contexte `APIRequestContext` neuf ; terme textuel non vide suffisamment générique pour ne pas dépendre d'une société unique.
- **Étapes essentielles :**
  1. Envoyer un `GET /search` avec un paramètre `q` textuel valide et une petite valeur `per_page`.
  2. Examiner le statut, le type et le corps de la réponse.
  3. Si la collection contient des éléments, vérifier sur chacun des éléments examinés uniquement les champs et types du contrat consommés par le frontend.
- **Résultat attendu :** réponse HTTP réussie et JSON lisible ; `results` est un tableau et le total est numérique lorsqu'il est présent ; les résultats présents exposent un SIREN et les objets nécessaires au mapping sans supposer un total, un ordre ou une entreprise fixes.

### TC-SEARCH-002 — Reconnaissance et autorisation d'un SIREN

**Question principale :** le frontend reconnaît-il un identifiant de 9 chiffres comme un SIREN et autorise-t-il sa recherche ?

- **Critère couvert :** `AC-02`
- **Niveau principal :** `UI_MOCKED`
- **Priorité :** Moyenne
- **Préconditions :** état navigateur frais ; interception de l'endpoint de recherche installée avant l'action et renvoyant une petite réponse valide.
- **Étapes essentielles :**
  1. Saisir un identifiant composé exactement de 9 chiffres et constater l'indication « SIREN détecté ».
  2. Lancer la recherche et relever l'unique requête interceptée.
- **Résultat attendu :** le format est explicitement reconnu comme SIREN, aucune validation bloquante n'apparaît et une requête est émise avec les 9 chiffres complets dans `q`. La réponse mockée est ensuite traitée normalement.

### TC-SEARCH-003 — Reconnaissance et autorisation d'un SIRET

**Question principale :** le frontend reconnaît-il un identifiant de 14 chiffres comme un SIRET et autorise-t-il sa recherche ?

- **Critère couvert :** `AC-03`
- **Niveau principal :** `UI_MOCKED`
- **Priorité :** Moyenne
- **Préconditions :** état navigateur frais ; interception de l'endpoint de recherche installée avant l'action et renvoyant une petite réponse valide.
- **Étapes essentielles :**
  1. Saisir un identifiant composé exactement de 14 chiffres et constater l'indication « SIRET détecté ».
  2. Lancer la recherche et relever l'unique requête interceptée.
- **Résultat attendu :** le format est explicitement reconnu comme SIRET, aucune validation bloquante n'apparaît et une requête est émise avec les 14 chiffres complets dans `q`. La réponse mockée est ensuite traitée normalement.

### TC-SEARCH-004 — Refus des longueurs numériques autres que 9 et 14

**Question principale :** le frontend bloque-t-il toute valeur exclusivement numérique située hors des deux longueurs autorisées sans solliciter l'API ?

- **Critère couvert :** `AC-04`
- **Niveau principal :** `UI_MOCKED`
- **Priorité :** Moyenne
- **Préconditions :** état navigateur frais ; compteur d'appels sur l'endpoint installé avant la saisie.
- **Étapes essentielles :**
  1. Soumettre successivement, dans des états indépendants, des valeurs représentatives des partitions et frontières : 8, 10, 13 et 15 chiffres.
  2. Observer le message présenté après chaque soumission.
  3. Contrôler le nombre d'appels à l'endpoint.
- **Résultat attendu :** chaque saisie est refusée avec un message expliquant les longueurs SIREN/SIRET attendues ; aucun appel API n'est émis et aucun ancien résultat n'est présenté comme résultat de cette recherche.

### TC-SEARCH-005 — Rendu déterministe des informations essentielles

**Question principale :** le frontend transforme-t-il correctement une réponse API valide en résultats utilisables ?

- **Critère couvert :** `AC-05`
- **Niveau principal :** `UI_MOCKED`
- **Priorité :** Haute
- **Préconditions :** état navigateur frais ; fixture minimale de deux entreprises aux valeurs distinctes, conforme aux seuls champs consommés par le frontend.
- **Étapes essentielles :**
  1. Installer la réponse mockée puis lancer une recherche textuelle valide.
  2. Examiner le titre, le compteur et les cartes obtenues.
  3. Comparer nom, SIREN, statut, activité, localisation et date de création affichés aux valeurs de la fixture.
- **Résultat attendu :** une carte est affichée par résultat ; les informations essentielles proviennent exactement de la réponse ; les actions de résultat sont disponibles et aucune valeur d'une entreprise n'est attribuée à une autre.

### TC-SEARCH-006 — Distinction explicite d'une réponse sans résultat

**Question principale :** une réponse valide vide est-elle présentée comme une absence de résultat et non comme une erreur ?

- **Critère couvert :** `AC-06`
- **Niveau principal :** `UI_MOCKED`
- **Priorité :** Moyenne
- **Préconditions :** état navigateur frais ; mock HTTP 200 renvoyant `results: []` et un total nul.
- **Étapes essentielles :**
  1. Lancer une recherche textuelle valide.
  2. Attendre le traitement de la réponse vide.
  3. Examiner l'état, le compteur, la grille de résultats et la pagination.
- **Résultat attendu :** le message « Aucune entreprise ne correspond à cette recherche. » est affiché ; aucune carte ni pagination n'apparaît ; aucun libellé d'erreur technique n'est affiché.

### TC-SEARCH-007 — Présentation d'une erreur technique de recherche

**Question principale :** le frontend distingue-t-il une défaillance technique d'une absence de résultat ?

- **Critère couvert :** `AC-07`
- **Niveau principal :** `UI_MOCKED`
- **Priorité :** Haute
- **Préconditions :** état navigateur frais ; endpoint configuré pour répondre avec un statut HTTP 500.
- **Étapes essentielles :**
  1. Lancer une recherche textuelle valide.
  2. Attendre le traitement de la réponse en erreur.
  3. Examiner l'état, le compteur et la grille.
- **Résultat attendu :** un message compréhensible indique l'impossibilité de joindre l'API et invite à réessayer ; le compteur indique « Erreur API » ; aucun message d'absence de résultat ni aucune carte obsolète n'est affiché.

### TC-SEARCH-008 — Chargement suivi d'un succès

**Question principale :** l'état de chargement est-il identifiable pendant l'attente puis remplacé par les résultats après un succès ?

- **Critère couvert :** `AC-08`
- **Niveau principal :** `UI_MOCKED`
- **Priorité :** Moyenne
- **Préconditions :** état navigateur frais ; interception contrôlable permettant de différer puis de résoudre la requête par une réponse valide minimale, sans délai arbitraire dans le test.
- **Étapes essentielles :**
  1. Déclencher une recherche valide en maintenant la réponse interceptée en attente.
  2. Vérifier avant résolution la présence de « Recherche en cours… » et l'absence des résultats précédents.
  3. Libérer une réponse valide, attendre l'apparition du résultat attendu, puis vérifier que l'état de chargement n'est plus présenté.
- **Résultat attendu :** le chargement est visible uniquement tant que la requête reste en attente ; après succès, il disparaît et les résultats attendus le remplacent sans rester bloqué.

### TC-SEARCH-009 — Chargement suivi d'une erreur

**Question principale :** l'état de chargement est-il identifiable pendant l'attente puis remplacé par l'état d'erreur après un échec ?

- **Critère couvert :** `AC-08`
- **Niveau principal :** `UI_MOCKED`
- **Priorité :** Moyenne
- **Préconditions :** état navigateur frais ; interception contrôlable permettant de différer puis de résoudre la requête par une erreur HTTP, sans délai arbitraire dans le test.
- **Étapes essentielles :**
  1. Déclencher une recherche valide en maintenant la réponse interceptée en attente.
  2. Vérifier avant résolution la présence de « Recherche en cours… » et l'absence des résultats précédents.
  3. Résoudre la requête par une erreur HTTP contrôlée, attendre l'état d'erreur, puis vérifier que l'état de chargement n'est plus présenté.
- **Résultat attendu :** le chargement est visible uniquement tant que la requête reste en attente ; après échec, il disparaît et l'état d'erreur le remplace sans rester bloqué.

### TC-SEARCH-010 — Intégration critique entre l'interface et l'API réelle

**Question principale :** l'application déployée peut-elle lancer une vraie recherche textuelle, consommer la réponse publique et afficher ses données essentielles ?

- **Critères couverts :** `AC-01`, `AC-05`
- **Niveau principal :** `E2E_REAL`
- **Priorité :** Haute (`@smoke` pertinent)
- **Préconditions :** application et API publiques accessibles ; état navigateur frais ; terme textuel stable dans sa nature, sans attente sur un total ou un ordre précis.
- **Étapes essentielles :**
  1. Ouvrir l'application déployée et saisir un terme textuel valide.
  2. Lancer la recherche et attendre la réponse réelle associée.
  3. Vérifier qu'au moins un résultat exploitable est rendu.
  4. Pour une carte issue de la réponse observée, vérifier que le SIREN et les informations essentielles affichées correspondent aux données de cette même réponse.
- **Résultat attendu :** la requête réelle aboutit, l'interface quitte le chargement et affiche au moins une carte cohérente avec la réponse reçue. Aucune assertion ne dépend d'un nombre exact, du premier résultat ou d'une société figée.

## Matrice de traçabilité

| Cas de test     | Critère(s)       | Niveau      | Priorité |
| --------------- | ---------------- | ----------- | -------- |
| `TC-SEARCH-001` | `AC-01`          | `API`       | Haute    |
| `TC-SEARCH-002` | `AC-02`          | `UI_MOCKED` | Moyenne  |
| `TC-SEARCH-003` | `AC-03`          | `UI_MOCKED` | Moyenne  |
| `TC-SEARCH-004` | `AC-04`          | `UI_MOCKED` | Moyenne  |
| `TC-SEARCH-005` | `AC-05`          | `UI_MOCKED` | Haute    |
| `TC-SEARCH-006` | `AC-06`          | `UI_MOCKED` | Moyenne  |
| `TC-SEARCH-007` | `AC-07`          | `UI_MOCKED` | Haute    |
| `TC-SEARCH-008` | `AC-08`          | `UI_MOCKED` | Moyenne  |
| `TC-SEARCH-009` | `AC-08`          | `UI_MOCKED` | Moyenne  |
| `TC-SEARCH-010` | `AC-01`, `AC-05` | `E2E_REAL`  | Haute    |

## Analyse de couverture et arbitrages

### Critères couverts

Tous les critères `AC-01` à `AC-08` sont couverts. `AC-02` et `AC-03` disposent chacun d'un cas ciblé afin que la reconnaissance du SIREN et celle du SIRET répondent à des questions indépendantes. `AC-08` est couvert par `TC-SEARCH-008` pour l'issue réussie et `TC-SEARCH-009` pour l'issue en erreur. `AC-01` et `AC-05` disposent volontairement de deux niveaux complémentaires : le premier vérifie respectivement le service ou le mapping déterministe, le second vérifie leur intégration réelle. Les questions posées ne sont donc pas identiques.

### Critères non couverts

Aucun critère de cette User Story n'est laissé sans couverture. Les filtres, le tri, la pagination, le détail, l'historique et la synchronisation URL observés dans l'application restent hors périmètre conformément à la User Story.

### Doublons potentiels évités

- Aucun E2E réel n'est ajouté pour SIREN ou SIRET : leurs cas séparés vérifient la discrimination frontend avec interception, tandis que l'endpoint reçu est le même.
- Aucun test API distinct n'est ajouté pour chaque longueur SIREN/SIRET : l'API reçoit un paramètre `q` générique et ne démontre pas à elle seule la classification effectuée par l'interface.
- Le mapping exhaustif de toutes les cartes n'est pas répété dans l'E2E réel ; le test mocké couvre la transformation détaillée, l'E2E ne contrôle que la jointure critique.
- Les erreurs réseau et HTTP non réussies convergent vers la même branche et le même état observé ; le statut 500 est retenu comme représentant déterministe, sans cas redondant d'interruption réseau.
- `TC-SEARCH-007` et `TC-SEARCH-009` utilisent tous deux une erreur HTTP mais ne posent pas la même question : le premier valide la distinction fonctionnelle de l'état d'erreur, le second uniquement la transition du chargement vers cet état.

### Arbitrage des priorités

La priorité haute est réservée au contrat minimal de la fonctionnalité principale (`TC-SEARCH-001`), au mapping des informations essentielles (`TC-SEARCH-005`), à la distinction d'une panne technique (`TC-SEARCH-007`) et au parcours d'intégration critique candidat `@smoke` (`TC-SEARCH-010`). Les règles de format, l'état vide et les transitions de chargement restent importants mais sont classés en priorité moyenne : ils sont déterministes, isolés au frontend et n'empêchent pas tous l'accès nominal à la recherche.

### Scénarios volontairement non automatisés

- la saisie vide, car elle n'est pas définie par un critère de cette User Story et présente un risque inférieur à la validation numérique explicitement exigée ;
- toutes les longueurs numériques possibles : les partitions et frontières représentatives de `TC-SEARCH-004` suffisent ;
- la vérification du texte exact de chaque libellé hors messages fonctionnellement nécessaires : elle augmenterait la fragilité sans confiance supplémentaire ;
- la disponibilité exhaustive ou la performance de l'API publique, qui relèvent du monitoring et non d'un test fonctionnel déterministe ;
- les recherches réelles dédiées à une entreprise précise, ainsi que les assertions de total et de classement, en raison de la volatilité des données publiques ;
- le chevauchement de deux recherches et l'annulation de la première, comportement observé dans l'implémentation mais non demandé par les critères et de priorité moindre que le cycle de chargement nominal.

### Écarts entre critères et comportement observé

Aucun écart bloquant n'a été constaté pour `AC-01` à `AC-08`.

Deux précisions sont à conserver dans l'automatisation future :

- le texte des critères parle d'un identifiant « interprété » comme SIREN ou SIRET ; l'application rend bien cette interprétation visible par un indice, mais transmet dans les deux cas la valeur sous le paramètre API générique `q` ;
- après une réponse vide, le compteur est construit à partir du total retourné tandis que le message d'état exprime explicitement l'absence d'entreprise. Le test doit valider cette distinction fonctionnelle sans imposer une formulation de compteur non spécifiée.

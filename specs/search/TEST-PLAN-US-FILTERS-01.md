# Plan de test — US-FILTERS-01 — Filtrer les entreprises recherchées

## Objet et stratégie

Ce plan couvre le filtrage par code postal, commune et état administratif, leur combinaison, la construction de la requête, la restitution de la réponse et la visibilité des critères appliqués. La stratégie retient le niveau le plus bas donnant une confiance utile : l’API réelle pour les règles de filtrage du backend, l’UI mockée pour le mapping des contrôles et les états déterministes, et un seul parcours `E2E_REAL` ciblé sur un risque d’intégration effectivement observé pour la commune.

Toutes les interactions avec l’API publique sont des requêtes `GET`. Les contrôles API portent sur le statut, la structure et des invariants observables dans `siege` ou `matching_etablissements`. Ils n’imposent ni entreprise précise, ni total exact, ni ordre fixe. Pour `TC-FILTERS-001` à `004`, une collection vide est insuffisante pour répondre à la question métier : chaque scénario exige donc au moins un résultat exploitable avant de vérifier les invariants. Les données d’entrée doivent être assez génériques pour satisfaire cette précondition sans figer le test sur une entreprise, un SIREN, un nom, un volume ou une position dans la collection.

## Couverture existante prise en compte

- `TC-SEARCH-005` vérifie déjà, avec une réponse déterministe, le mapping détaillé des informations essentielles d’une entreprise. Les cas de filtres ne répètent donc que les identifiants nécessaires pour prouver que la réponse de la recherche filtrée remplace correctement l’affichage.
- `TC-SEARCH-006` vérifie déjà qu’une réponse HTTP 200 vide est présentée comme une absence de résultat et non comme une erreur. Le cas filtré ne répète ce comportement que pour le risque supplémentaire suivant : les filtres sont bien envoyés et restent identifiables pendant l’état vide.
- `TC-SEARCH-010` vérifie la jointure générale entre l’application déployée et l’API réelle pour une recherche textuelle. Aucun E2E n’est ajouté pour le code postal, le statut ou la combinaison générale. Le seul E2E proposé ci-dessous répond à une incompatibilité propre au filtre commune observée pendant l’exploration.

## Confrontation avec l’application réelle

Exploration effectuée le 29 août 2026 sur `https://maximejoannis.github.io/french-companies-explorer-qa/`, depuis un état navigateur frais.

Comportements constatés :

- les filtres avancés proposent « Code postal » (exemple `75015`), « Commune » (exemple `Paris`) et « État » avec les valeurs « Tous », « En activité » et « Cessée » ;
- la requête de recherche contient toujours `q`, `page` et `per_page` ; les filtres non vides ajoutent respectivement `code_postal`, `commune` et `etat_administratif` ;
- les valeurs d’état envoyées sont `A` pour « En activité » et `C` pour « Cessée » ;
- plusieurs filtres sont placés dans la même requête, sans appel séparé par filtre ;
- après une réponse réussie, les champs conservent leurs valeurs et des puces apparaissent sous la forme « Code postal: valeur », « Commune: valeur » et « État: A/C » ; chaque puce peut être supprimée et une réinitialisation globale est proposée ;
- l’URL de l’application utilise des noms distincts de ceux de l’API (`cp`, `city`, `status`) pour représenter l’état local. Cette synchronisation n’altère pas les paramètres API `code_postal`, `commune` et `etat_administratif` ;
- une réponse vide affiche « Aucune entreprise ne correspond à cette recherche. » ;
- l’API réelle expose les établissements ayant contribué au filtre géographique dans `matching_etablissements`. Le siège d’une entreprise ne porte donc pas nécessairement le code postal ou la commune filtrés ; un test API ne doit pas limiter son assertion à `siege` ;
- `code_postal=75015` et `etat_administratif=A` ou `C` sont acceptés par l’API réelle et retournent une structure exploitable ;
- écart important : saisir « Paris » dans le champ Commune produit `commune=Paris`, auquel l’API réelle répond HTTP 400. L’API accepte un identifiant de commune tel qu’un code INSEE, mais l’interface ne fournit ni résolution du libellé ni indication demandant un code. La même incompatibilité fait échouer une combinaison contenant cette commune.

## Cas de test retenus

### TC-FILTERS-001 — Filtrage réel par code postal

**Question principale :** l’API applique-t-elle le paramètre `code_postal` et expose-t-elle les établissements correspondant au code demandé ?

- **Objectif :** valider la règle backend du filtre postal sans passer par le navigateur.
- **Critères couverts :** `AC-01`, contribution à `AC-07`
- **Préconditions :** API publique accessible ; `APIRequestContext` neuf ; terme textuel générique et code postal français valide choisis pour fournir au moins un résultat exploitable, sans cibler une entreprise particulière.
- **Étapes essentielles :**
  1. Envoyer un `GET /search` avec `q`, `code_postal` et une petite valeur `per_page`.
  2. Vérifier le statut, la structure minimale de la réponse et la présence d’au moins un résultat exploitable.
  3. Pour chaque entreprise examinée, rechercher le code demandé dans le siège ou dans au moins un élément de `matching_etablissements`.
- **Résultat attendu :** la réponse est HTTP 200 et `results` contient au moins un élément. Chaque résultat examiné possède un établissement correspondant au code postal demandé ; une collection vide fait échouer le scénario car elle ne prouve pas la règle de filtrage. Aucune hypothèse n’est faite sur le total, le classement, le SIREN ou le nom.
- **Niveau :** `API`
- **Priorité :** Haute
- **Justification du niveau :** l’application ne décide pas quelles entreprises satisfont le code postal ; cette règle appartient à l’API. `APIRequestContext` apporte la confiance nécessaire avec un coût et une fragilité inférieurs à un E2E.

### TC-FILTERS-002 — Filtrage réel par identifiant de commune accepté par l’API

**Question principale :** l’API applique-t-elle son paramètre `commune` lorsqu’elle reçoit une valeur conforme à son contrat ?

- **Objectif :** valider séparément la règle backend de commune et documenter le format effectivement accepté.
- **Critères couverts :** contribution à `AC-02` et `AC-07`
- **Préconditions :** API publique accessible ; `APIRequestContext` neuf ; terme générique et identifiant de commune conforme au contrat de l’API choisis pour fournir au moins un résultat exploitable, sans dépendre d’une entreprise particulière.
- **Étapes essentielles :**
  1. Envoyer un `GET /search` avec `q`, `commune` et une petite valeur `per_page`.
  2. Vérifier le statut, la structure minimale de la réponse et la présence d’au moins un résultat exploitable.
  3. Pour chaque résultat examiné, vérifier que le siège ou au moins un `matching_etablissements` porte l’identifiant de commune demandé.
- **Résultat attendu :** la réponse est HTTP 200 et `results` contient au moins un élément. Chaque résultat examiné peut être relié à un siège ou à un élément de `matching_etablissements` portant l’identifiant de commune demandé ; une collection vide fait échouer le scénario. Aucune assertion ne porte sur un total, une entreprise ou un ordre fixes.
- **Niveau :** `API`
- **Priorité :** Haute
- **Justification du niveau :** la sémantique et le format du filtre commune relèvent du backend. Ce test ne suffit toutefois pas à prouver la compatibilité de la valeur textuelle produite par l’interface ; cette frontière est traitée par `TC-FILTERS-009`.

### TC-FILTERS-003 — Filtrage réel par état administratif

**Question principale :** l’API limite-t-elle les entreprises au statut administratif demandé pour chacune des deux partitions proposées par l’interface ?

- **Objectif :** vérifier la règle backend pour les états `A` et `C` dans un seul cas partitionné.
- **Critère couvert :** `AC-03`, contribution à `AC-07`
- **Préconditions :** API publique accessible ; `APIRequestContext` neuf ; terme générique choisi pour fournir au moins un résultat exploitable dans chacune des partitions `A` et `C`, sans cibler une entreprise particulière.
- **Étapes essentielles :**
  1. Exécuter indépendamment une requête avec `etat_administratif=A`, puis une requête équivalente avec `etat_administratif=C`.
  2. Vérifier pour chaque réponse le statut, la structure et la présence d’au moins un résultat exploitable.
  3. Vérifier que les entreprises présentes portent l’état administratif demandé.
- **Résultat attendu :** chaque requête est HTTP 200 et retourne au moins un résultat exploitable ; tous les résultats examinés dans la partition active ont l’état `A`, et tous ceux de la partition cessée ont l’état `C`. Une collection vide dans l’une des partitions fait échouer le scénario ; aucun volume exact, nom, SIREN ou ordre n’est requis.
- **Niveau :** `API`
- **Priorité :** Moyenne
- **Justification du niveau :** le sens métier des statuts et le filtrage des données sont assurés par l’API. Les deux valeurs constituent des partitions de la même règle et ne justifient pas deux cas distincts.

### TC-FILTERS-004 — Combinaison réelle des filtres au niveau API

**Question principale :** l’API applique-t-elle conjointement tous les critères d’une requête combinée valide ?

- **Objectif :** détecter une interprétation en alternative ou la perte d’un filtre côté backend lorsque plusieurs paramètres sont présents.
- **Critère couvert :** `AC-04`, contribution à `AC-07`
- **Préconditions :** API publique accessible ; `APIRequestContext` neuf ; terme générique, code postal, identifiant de commune cohérent avec ce code postal et statut administratif valides, choisis pour fournir au moins un résultat exploitable sans cibler une entreprise particulière.
- **Étapes essentielles :**
  1. Envoyer une seule requête contenant `q`, `code_postal`, `commune`, `etat_administratif` et une petite valeur `per_page`.
  2. Vérifier le statut, la structure de la réponse et la présence d’au moins un résultat exploitable.
  3. Pour chaque résultat présent, vérifier simultanément l’état de l’entreprise et l’existence d’un siège ou établissement correspondant aux deux critères géographiques.
- **Résultat attendu :** la requête est acceptée et retourne au moins un résultat exploitable ; tous les résultats examinés satisfont simultanément les critères demandés. Une collection vide fait échouer le scénario car elle ne démontre pas l’intersection des filtres. Le test n’exige ni total exact, ni entreprise précise, ni ordre stable.
- **Niveau :** `API`
- **Priorité :** Haute
- **Justification du niveau :** la logique d’intersection des filtres est une responsabilité backend à risque élevé. Le test UI combiné vérifie une question différente : la construction d’une seule requête par le frontend.

### TC-FILTERS-005 — Mapping des contrôles vers les paramètres API

**Question principale :** chaque contrôle de filtre est-il transmis sous le bon nom de paramètre, avec sa valeur intacte ?

- **Objectif :** valider le contrat de construction de requête propre au frontend sans dépendre des données publiques.
- **Critères couverts :** partie frontend de `AC-01`, `AC-02`, `AC-03`
- **Préconditions :** état navigateur frais pour chaque partition ; interception installée avant la soumission ; petite réponse HTTP 200 valide.
- **Étapes essentielles :**
  1. Exécuter trois partitions indépendantes : code postal seul, commune seule, puis chaque option représentative du statut.
  2. Pour chaque partition, lancer une recherche textuelle valide et capturer la requête.
  3. Vérifier le nom et la valeur du paramètre attendu ainsi que l’absence des deux paramètres de filtre non renseignés.
  4. Vérifier par un identifiant minimal que la réponse mockée est traitée.
- **Résultat attendu :** le code postal est transmis par `code_postal`, la commune par `commune`, et les libellés d’état par `etat_administratif=A/C`. Les valeurs saisies ne sont ni perdues ni silencieusement remplacées ; une seule requête est nécessaire par partition.
- **Niveau :** `UI_MOCKED`
- **Priorité :** Haute
- **Justification du niveau :** le risque validé est le câblage UI → requête. Une interception permet de l’observer directement et de manière déterministe ; elle ne prétend pas valider la sémantique backend déjà couverte par les tests API.

### TC-FILTERS-006 — Construction d’une recherche combinée et remplacement des anciens résultats

**Question principale :** le frontend envoie-t-il tous les filtres dans une même requête et remplace-t-il les résultats précédents par la réponse correspondante ?

- **Objectif :** couvrir la combinaison côté client et le risque de conserver des cartes issues d’une recherche antérieure.
- **Critères couverts :** partie frontend de `AC-04`, `AC-07`
- **Préconditions :** état navigateur frais ; interception capable de renvoyer une première fixture puis une seconde fixture minimale, avec des SIREN distincts ; routes installées avant les actions.
- **Étapes essentielles :**
  1. Exécuter une première recherche non filtrée et constater l’identifiant de sa carte.
  2. Renseigner simultanément un code postal, une commune et un état, puis relancer.
  3. Capturer la seconde requête et contrôler qu’elle contient les trois paramètres dans le même appel.
  4. Vérifier que l’identifiant de la seconde réponse est affiché et que celui de la première ne l’est plus.
- **Résultat attendu :** une seule requête filtrée porte les trois critères sans transformation silencieuse ; l’interface affiche la réponse de cette requête et aucune carte obsolète de la recherche précédente.
- **Niveau :** `UI_MOCKED`
- **Priorité :** Haute
- **Justification du niveau :** l’intersection métier reste testée au niveau API. Ici, le mock isole la responsabilité frontend et rend déterministe le remplacement des données.

### TC-FILTERS-007 — Visibilité des filtres appliqués après un succès

**Question principale :** l’utilisateur peut-il toujours identifier tous les filtres appliqués après l’affichage des résultats ?

- **Objectif :** valider la persistance visuelle des critères, indépendamment des données de production.
- **Critère couvert :** `AC-05`
- **Préconditions :** état navigateur frais ; réponse mockée minimale non vide ; filtres code postal, commune et état renseignés.
- **Étapes essentielles :**
  1. Lancer la recherche combinée et attendre le résultat déterministe.
  2. Vérifier que les champs conservent leurs valeurs.
  3. Vérifier que les trois puces de filtres actifs présentent les critères correspondants et que leurs actions de suppression sont identifiables.
- **Résultat attendu :** les valeurs saisies ou sélectionnées restent présentes ; les puces « Code postal », « Commune » et « État » rendent les critères actifs identifiables après le rendu du résultat.
- **Niveau :** `UI_MOCKED`
- **Priorité :** Moyenne
- **Justification du niveau :** il s’agit d’un état exclusivement frontend. Une réponse déterministe suffit et évite qu’une variation de l’API masque le comportement de persistance.

### TC-FILTERS-008 — Réponse vide à une recherche filtrée

**Question principale :** une recherche filtrée sans résultat conserve-t-elle ses critères tout en présentant un état vide non technique ?

- **Objectif :** couvrir uniquement l’incrément de risque par rapport à `TC-SEARCH-006` : la présence effective et visible du filtre pendant l’état vide.
- **Critère couvert :** `AC-06`, contribution à `AC-05`
- **Préconditions :** état navigateur frais ; interception installée avant l’action et renvoyant HTTP 200 avec `results: []` et un total nul.
- **Étapes essentielles :**
  1. Lancer une recherche valide avec au moins un filtre renseigné.
  2. Vérifier que la requête interceptée contient ce filtre.
  3. Attendre le traitement de la réponse vide.
  4. Vérifier le message d’absence de résultat, l’absence de cartes et la conservation du filtre dans le champ et la zone des filtres actifs.
- **Résultat attendu :** « Aucune entreprise ne correspond à cette recherche. » est affiché ; aucune carte n’apparaît ; l’état n’est pas présenté comme une erreur technique et le critère filtrant reste identifiable.
- **Niveau :** `UI_MOCKED`
- **Priorité :** Moyenne
- **Justification du niveau :** la réponse vide doit être forcée pour être fiable. La distinction vide/erreur générique est déjà couverte ; ce cas reste utile pour prouver le contexte filtré et la conservation du critère.

### TC-FILTERS-009 — Compatibilité réelle du filtre commune entre l’interface et l’API

**Question principale :** une commune renseignée selon l’indication de l’interface produit-elle une recherche réelle acceptée et des résultats filtrés, plutôt qu’une erreur technique ?

- **Objectif :** couvrir la frontière d’intégration spécifique que les tests API et UI mockés séparés ne peuvent pas sécuriser.
- **Critères couverts :** `AC-02`, `AC-07`
- **Préconditions :** application déployée et API publique accessibles ; état navigateur frais ; commune textuelle valide choisie comme catégorie de donnée, sans dépendre d’une entreprise précise, d’un total ou d’un ordre.
- **Étapes essentielles :**
  1. Ouvrir la vue Recherche, saisir un terme textuel valide et une commune au format suggéré par l’interface.
  2. Lancer la recherche et observer l’unique réponse API correspondante.
  3. Vérifier que la requête contient le critère de commune attendu et qu’elle est acceptée.
  4. Si la collection est non vide, sélectionner une entreprise réellement affichée parmi la réponse observée et comparer uniquement son SIREN ; sinon vérifier l’état vide fonctionnel.
- **Résultat attendu :** la réponse est réussie ; l’interface affiche une carte cohérente avec la réponse ou un état vide fonctionnel, sans état d’erreur technique. Le critère commune reste visible et inchangé.
- **Niveau :** `E2E_REAL`
- **Priorité :** Haute
- **Justification du niveau :** `TC-SEARCH-010` prouve l’intégration générale pour `q`, mais pas la compatibilité de format du paramètre `commune`. L’exploration a révélé une rupture réelle à cette jointure ; un seul E2E ciblé est donc justifié. Le résultat attendu reste strictement celui de `AC-02` et ne doit pas être affaibli pour refléter le défaut actuel.
- **Traitement du défaut connu lors de l’automatisation :** tant que l’incompatibilité commune textuelle → API n’est pas corrigée, le test doit être déclaré explicitement avec `test.fixme`, accompagné d’un motif mentionnant le défaut connu. Cette neutralisation temporaire conserve la spécification, évite une CI volontairement rouge et permet de réactiver immédiatement le scénario après correction du produit. Le corps et les assertions du test doivent continuer à exprimer le résultat fonctionnel attendu ci-dessus.

## Matrice de traçabilité

| Cas de test      | Critère(s)                    | Niveau      | Priorité |
| ---------------- | ----------------------------- | ----------- | -------- |
| `TC-FILTERS-001` | `AC-01`, contribution `AC-07` | `API`       | Haute    |
| `TC-FILTERS-002` | contribution `AC-02`, `AC-07` | `API`       | Haute    |
| `TC-FILTERS-003` | `AC-03`, contribution `AC-07` | `API`       | Moyenne  |
| `TC-FILTERS-004` | `AC-04`, contribution `AC-07` | `API`       | Haute    |
| `TC-FILTERS-005` | `AC-01`, `AC-02`, `AC-03`     | `UI_MOCKED` | Haute    |
| `TC-FILTERS-006` | `AC-04`, `AC-07`              | `UI_MOCKED` | Haute    |
| `TC-FILTERS-007` | `AC-05`                       | `UI_MOCKED` | Moyenne  |
| `TC-FILTERS-008` | `AC-06`, contribution `AC-05` | `UI_MOCKED` | Moyenne  |
| `TC-FILTERS-009` | `AC-02`, `AC-07`              | `E2E_REAL`  | Haute    |

## Analyse de couverture et arbitrages

### Critères entièrement couverts

- `AC-01` : la règle réelle du code postal est contrôlée par `TC-FILTERS-001` et son mapping frontend par `TC-FILTERS-005`.
- `AC-03` : les deux états proposés sont partitionnés dans `TC-FILTERS-003`, tandis que leurs valeurs envoyées par l’interface sont contrôlées dans `TC-FILTERS-005`.
- `AC-04` : `TC-FILTERS-004` vérifie l’intersection backend et `TC-FILTERS-006` la construction d’un appel unique ainsi que le remplacement de l’ancien affichage.
- `AC-05` : `TC-FILTERS-007` couvre le succès et `TC-FILTERS-008` confirme la conservation dans l’état vide.
- `AC-06` : `TC-FILTERS-008` couvre l’état vide filtré sans reproduire toute la preuve générique de `TC-SEARCH-006`.
- `AC-07` : les tests API contrôlent les invariants de filtrage et `TC-FILTERS-006` vérifie que le frontend restitue la réponse associée sans conserver d’ancien résultat.

### Trou de couverture et critère actuellement non satisfait

`AC-02` dispose d’une couverture planifiée complète (`TC-FILTERS-002`, `005` et `009`), mais n’est pas satisfait par le comportement déployé au moment de l’exploration. Le backend accepte un identifiant de commune, tandis que l’interface suggère et transmet un libellé. Tant que ce défaut connu subsiste, l’automatisation de `TC-FILTERS-009` doit porter un `test.fixme` explicite plutôt que rendre volontairement la CI rouge ; son résultat fonctionnel attendu reste inchangé et le scénario devra être réactivé dès la correction. Par conséquence, une combinaison contenant la valeur textuelle de commune est également en échec réel ; le plan ne modifie pas silencieusement `AC-02` ou `AC-04` pour adopter le comportement actuel.

### Doublons volontairement évités

- Aucun E2E réel n’est ajouté pour le code postal, l’état ou la combinaison générale : les tests API et UI mockés couvrent des responsabilités complémentaires, et `TC-SEARCH-010` sécurise déjà la disponibilité de la jointure générale application ↔ API.
- Le rendu détaillé de chaque champ d’entreprise n’est pas répété : il appartient à `TC-SEARCH-005`. Les cas de filtres utilisent seulement des identifiants distinctifs pour rattacher l’affichage à la bonne réponse.
- L’état vide générique n’est pas redémontré intégralement : `TC-FILTERS-008` se concentre sur l’ajout du filtre envoyé et conservé.
- Les statuts `A` et `C` restent deux partitions d’un même cas API et d’un même cas de mapping UI.
- Chaque filtre n’est pas recopié aux trois niveaux. Le seul chevauchement `API`/`UI_MOCKED` répond à deux questions différentes : « l’API filtre-t-elle ? » et « l’interface construit-elle le bon appel ? ». L’E2E commune existe uniquement parce qu’une incompatibilité entre ces deux contrats a été observée.

### Scénarios volontairement non automatisés

- toutes les combinaisons possibles de filtres : une combinaison représentative à trois critères couvre le risque d’assemblage ; une matrice combinatoire augmenterait fortement le coût sans confiance proportionnelle ;
- les validations de format du code postal et de la commune non définies par les critères : aucun comportement de validation explicite n’a été spécifié ;
- la suppression d’une puce et la réinitialisation globale : ces interactions ont été observées mais ne sont pas exigées par `US-FILTERS-01`, qui demande seulement l’identification et la conservation des critères ;
- la synchronisation et la restauration via les paramètres d’URL `cp`, `city` et `status` : le comportement existe, mais le deep linking relève d’une fonctionnalité frontend distincte ;
- le changement du nombre de résultats, le tri et la pagination, explicitement hors périmètre ;
- les assertions sur un total, un premier résultat ou une entreprise publique fixe, en raison de la volatilité des données ;
- les mutations et la préparation de données, interdites et inutiles sur cette API publique en lecture seule.

### Anomalies et différences entre critères et comportement observé

1. **Anomalie potentiellement bloquante — commune :** le champ présente l’exemple « Paris » et transmet `commune=Paris`, mais l’API répond HTTP 400. L’utilisateur obtient alors l’état d’erreur technique au lieu de résultats filtrés ou d’un état vide. Cela contredit `AC-02` et affecte `AC-04` dès qu’une combinaison contient une commune textuelle.
2. **Limitation de lisibilité — état actif :** la puce affiche la valeur technique « État: A » ou « État: C » plutôt que le libellé « En activité » ou « Cessée ». Le critère reste identifiable au sens minimal de `AC-05`, mais la représentation est moins explicite que le contrôle de sélection.
3. **Précision pour l’automatisation — géographie :** un filtre postal ou communal peut correspondre à un établissement non siège. Vérifier uniquement `result.siege` produirait des faux négatifs ; les assertions API doivent aussi considérer `matching_etablissements`.

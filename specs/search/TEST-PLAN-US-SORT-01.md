# Plan de test — US-SORT-01 — Trier les résultats

## Références et périmètre

- User Story : `specs/search/US-SORT-01.md`
- Couvertures prises en compte : `US-SEARCH-01`, `US-FILTERS-01` et `US-PAGINATION-01`, leurs plans et leurs tests existants
- Défauts connus consultés : `BUG-001` et `BUG-002`, sans impact direct sur la logique de tri
- Application explorée : `https://maximejoannis.github.io/french-companies-explorer-qa/`
- API consommée : `GET https://recherche-entreprises.api.gouv.fr/search`, en lecture seule

Ce plan couvre exclusivement les neuf critères d’acceptation de `US-SORT-01`. Le rendu détaillé des cartes, la sémantique backend de la recherche et des filtres, ainsi que la mécanique de pagination ne sont pas répétés.

## Résultats de l’exploration

### Observations dans l’interface

- le contrôle propose exactement, dans cet ordre : `Pertinence`, `Nom A → Z`, `Nom Z → A`, `Création récente`, `Création ancienne`, `Statut` ;
- `Pertinence` est la valeur sélectionnée par défaut ;
- chaque changement de tri réordonne immédiatement les cartes déjà affichées et le contrôle conserve la valeur choisie ;
- les tris par nom, date et statut observés correspondent aux libellés du contrôle ;
- une nouvelle recherche conserve la sélection et applique effectivement le tri au nouveau jeu de données ;
- un changement de page conserve également la sélection et applique le tri à la nouvelle page ;
- **écart observé :** après avoir appliqué un autre tri, revenir à `Pertinence` laisse les cartes dans leur dernier ordre calculé au lieu de restaurer l’ordre brut de la réponse courante.

### Observations réseau

- changer uniquement le tri ne déclenche aucune nouvelle requête vers l’API ;
- les requêtes de recherche et de pagination ne contiennent aucun paramètre de tri destiné à l’API ;
- une nouvelle recherche ou une nouvelle page déclenche la requête attendue pour charger le nouveau jeu, puis le tri courant est appliqué localement.

### Règles confirmées par la logique frontend

L’inspection du JavaScript public déployé a été nécessaire pour préciser les règles non démontrables de façon fiable avec des données publiques dynamiques :

- `Pertinence` ne calcule aucun score : sur une réponse nouvellement reçue, elle conserve l’ordre du tableau renvoyé par l’API ; cependant, l’application trie ce même tableau en place et ne garde pas de copie de l’ordre brut, cause de l’écart lors du retour à `Pertinence` ;
- `Nom A → Z` compare les noms avec `localeCompare(..., "fr")` ; `Nom Z → A` inverse cette comparaison. La locale française explique le traitement observé de la casse et des accents, sans définir ici une nouvelle règle métier plus fine ;
- `Création récente` compare les représentations textuelles ISO en ordre décroissant ; `Création ancienne` les compare en ordre croissant ;
- une date absente est normalisée en `Non renseignée`. Elle apparaît donc avant les dates ISO pour `Création récente` et après elles pour `Création ancienne`. Cette règle est déterministe, mais son placement n’est pas explicitement prescrit par la User Story ;
- `Statut` compare les codes par ordre lexical croissant : `A` avant `C` pour les statuts exposés par l’API ;
- aucun comparateur secondaire n’est défini en cas d’égalité. Le tri natif stable conserve alors l’ordre d’entrée dans un groupe égal. Ce comportement est déterministe pour le même ordre d’entrée, mais la spécification ne précise pas de départage métier.

Ces constats décrivent le produit exploré ; ils ne transforment pas automatiquement ses détails d’implémentation en exigences métier. Les ordres explicitement libellés et les comportements déterministes sont néanmoins les contrats observables retenus pour les tests.

## Stratégie de couverture

Le plan retient **sept cas `UI_MOCKED`**, **aucun cas `API`** et **aucun nouvel `E2E_REAL`**. Le tri est entièrement calculé par le frontend. Une réponse synthétique permet de contrôler l’ordre brut, les valeurs manquantes, les égalités et chaque ordre attendu, tout en observant l’absence de requête supplémentaire.

Le jeu de base devra contenir quatre entreprises strictement synthétiques, identifiables par quatre SIREN fictifs distincts, dans un ordre de réponse volontairement différent de tous les ordres calculés. Il comprendra notamment :

- des noms tels que `ZULU TEST`, `alpha test`, `ÉCLAIR TEST` et `Beta Test`, afin d’exercer les deux directions et la collation française ;
- des dates ISO ancienne, intermédiaire et récente, plus une date absente ;
- au moins deux statuts `A` et `C`, répartis dans un ordre qui diffère des ordres précédents ;
- une réponse de nouvelle recherche et une réponse de page suivante contenant des entreprises synthétiques distinctes et volontairement non triées selon le critère actif.

Les assertions d’intégrité compareront la liste complète des identifiants avant et après tri : même longueur, même ensemble exact et une occurrence par identifiant. Elles ne se limiteront pas aux première et dernière cartes.

## Cas de test

### TC-SORT-001 — Options disponibles et valeur initiale

- **Question principale :** le contrôle expose-t-il exactement les critères réellement disponibles avec `Pertinence` sélectionné par défaut ?
- **Objectif :** prévenir une option absente, supplémentaire, mal libellée ou une valeur initiale incohérente.
- **Critère couvert :** `AC-01`, contribution à `AC-09`.
- **Préconditions :** état navigateur vierge ; route installée avant la recherche ; réponse déterministe contenant plusieurs entreprises.
- **Étapes essentielles :**
  1. Soumettre une recherche mockée et attendre l’affichage des résultats.
  2. Lire toutes les options et leur ordre dans le contrôle de tri.
  3. Lire la valeur sélectionnée sans changer le contrôle.
- **Résultat attendu :** les six options sont exactement `Pertinence`, `Nom A → Z`, `Nom Z → A`, `Création récente`, `Création ancienne`, `Statut`, dans cet ordre ; `Pertinence` est sélectionné et les cartes suivent l’ordre brut de la réponse initiale.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Moyenne.
- **Justification du niveau :** options, sélection et ordre visible constituent exclusivement un contrat frontend ; le mock fixe l’ordre de référence.

### TC-SORT-002 — Tri par nom dans les deux directions

- **Question principale :** les deux options de nom appliquent-elles des ordres français opposés, déterministes et cohérents avec le contrôle ?
- **Objectif :** détecter une direction inversée, une comparaison incohérente ou un contrôle qui change sans réordonner les cartes.
- **Critères couverts :** `AC-03`, contribution à `AC-09`.
- **Préconditions :** état navigateur vierge ; route installée ; jeu synthétique dont l’ordre brut diffère des deux ordres de nom et contient casse et accent représentatifs.
- **Étapes essentielles :**
  1. Afficher la réponse dans son ordre brut.
  2. Sélectionner `Nom A → Z` et relever la séquence complète des cartes.
  3. Sélectionner `Nom Z → A` et relever de nouveau la séquence complète.
- **Résultat attendu :** l’ordre A → Z correspond à `localeCompare` en locale française ; l’ordre Z → A est son inverse ; la valeur visible du contrôle correspond à chaque ordre effectivement affiché et le résultat est reproductible pour le même jeu.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Haute.
- **Justification du niveau :** le comparateur et le DOM sont locaux. Des noms synthétiques discriminants prouvent les directions sans dépendre de noms publics.

### TC-SORT-003 — Tri par date et placement des dates absentes

- **Question principale :** les tris de création appliquent-ils les deux directions observées et un placement déterministe de la date absente ?
- **Objectif :** couvrir ensemble la règle chronologique et son principal cas limite.
- **Critères couverts :** `AC-04`, contribution à `AC-09`.
- **Préconditions :** état navigateur vierge ; route installée ; dates ISO ancienne, intermédiaire et récente, plus une date absente, dans un ordre brut non chronologique.
- **Étapes essentielles :**
  1. Sélectionner `Création récente` et relever la séquence complète.
  2. Vérifier la position de chaque date, y compris la valeur absente.
  3. Sélectionner `Création ancienne` et répéter la vérification.
- **Résultat attendu :** pour `Création récente`, la valeur normalisée `Non renseignée` précède les dates ISO, puis les dates vont de la plus récente à la plus ancienne ; pour `Création ancienne`, les dates vont de la plus ancienne à la plus récente et la valeur absente est placée en dernier. La sélection visible correspond à l’ordre affiché dans chaque partition.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Haute.
- **Justification du niveau :** la gestion des dates absentes et leur ordre sont calculés côté frontend ; seul un mock minimal garantit la présence stable de cette frontière.

### TC-SORT-004 — Tri par statut administratif

- **Question principale :** le tri par statut regroupe-t-il les statuts dans l’ordre observé de façon déterministe et cohérente avec le contrôle ?
- **Objectif :** valider la règle locale `A` avant `C` et éviter un ordre instable entre groupes.
- **Critères couverts :** `AC-05`, contribution à `AC-09`.
- **Préconditions :** état navigateur vierge ; route installée ; plusieurs entreprises de statuts `A` et `C` entremêlées dans la réponse.
- **Étapes essentielles :**
  1. Afficher l’ordre brut entremêlé.
  2. Sélectionner `Statut`.
  3. Relever le statut et l’identifiant de chaque carte dans l’ordre affiché.
- **Résultat attendu :** toutes les entreprises `A` précèdent toutes les entreprises `C` ; au sein d’un même statut, l’ordre d’entrée est conservé en l’absence de comparateur secondaire ; le contrôle affiche `Statut` et le même jeu produit le même ordre.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Moyenne.
- **Justification du niveau :** l’API fournit les statuts mais ne décide pas de leur ordre dans cette interface. Une réponse synthétique isole le comparateur frontend.

### TC-SORT-005 — Restauration de l’ordre de pertinence

- **Défaut connu associé :** `BUG-003 — Le tri Pertinence ne restaure pas l’ordre brut de la réponse` (`defects/BUG-003-relevance-sort-does-not-restore-original-order.md`).
- **Question principale :** après un tri calculé, revenir à `Pertinence` restaure-t-il exactement l’ordre fourni par la réponse courante ?
- **Objectif :** garantir que le frontend n’invente pas une pertinence et conserve l’ordre de référence reçu.
- **Critères couverts :** `AC-02`, contribution à `AC-07` et `AC-09`.
- **Préconditions :** état navigateur vierge ; route installée ; ordre brut distinct de l’ordre alphabétique.
- **Étapes essentielles :**
  1. Capturer la séquence complète de la réponse rendue avec `Pertinence`.
  2. Appliquer `Nom A → Z` et vérifier qu’un ordre différent est visible.
  3. Revenir à `Pertinence` sans effectuer de nouvelle recherche.
  4. Comparer la séquence complète affichée à l’ordre brut initial et contrôler le réseau.
- **Résultat attendu :** la sélection redevient `Pertinence`, aucune nouvelle requête n’est émise et l’ordre complet redevient exactement celui de la réponse courante.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Haute.
- **Justification du niveau :** restaurer une copie de l’ordre reçu est une responsabilité frontend. Le mock fournit l’unique ordre de pertinence attendu sans recalculer la sémantique de l’API. **Ce cas échoue sur la version explorée et constitue le test de non-régression associé à `BUG-003` ; l’attendu ne doit pas être affaibli pour refléter le défaut.**
- **Traitement du défaut connu lors de l’automatisation :** tant que `BUG-003` reste ouvert, l’implémentation complète de `TC-SORT-005` devra être déclarée avec `test.fixme`. Ce choix conserve l’exigence fonctionnelle, trace le défaut connu, évite une CI volontairement rouge en permanence et permet de réactiver immédiatement le scénario après correction. Le test ne devra être ni vidé, ni remplacé par un placeholder ou par une assertion du comportement défectueux.

### TC-SORT-006 — Intégrité de l’ensemble et tri purement local

- **Question principale :** parcourir les critères de tri conserve-t-il exactement une occurrence de chaque entreprise sans provoquer de requête API ?
- **Objectif :** apporter une preuve complète contre suppression, ajout, duplication ou appel réseau inutile, indépendamment de la correction de chaque comparateur.
- **Critères couverts :** `AC-06`, `AC-07`.
- **Préconditions :** état navigateur vierge ; route installée avec compteur de requêtes ; quatre identifiants synthétiques uniques.
- **Étapes essentielles :**
  1. Capturer la liste complète des identifiants et le nombre de requêtes après le chargement initial.
  2. Pour chaque mode calculé (`Nom A → Z`, `Nom Z → A`, `Création récente`, `Création ancienne`, `Statut`), changer la sélection puis capturer tous les identifiants visibles.
  3. Pour chaque état, comparer longueur, ensemble trié des identifiants et unicité à la collection initiale ; comparer également le compteur réseau.
- **Résultat attendu :** après chaque changement, il existe exactement une carte pour chacun des identifiants reçus, aucune autre carte n’apparaît et le nombre de requêtes API reste inchangé. Seul l’ordre du DOM varie.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Haute.
- **Justification du niveau :** mutations du tableau, rendu du DOM et absence d’appel sont des risques frontend. Un seul cas transversal prouve l’intégrité sans répéter cette assertion détaillée dans tous les tests de comparateur.

### TC-SORT-007 — Application du tri aux nouveaux résultats

- **Question principale :** le tri sélectionné reste-t-il visible et réellement appliqué à chaque nouvel ensemble chargé par une recherche ou une pagination ?
- **Objectif :** distinguer la simple persistance du contrôle de l’application effective du comparateur au nouveau tableau.
- **Critères couverts :** `AC-08`, `AC-09`.
- **Préconditions :** état navigateur vierge pour chaque partition ; routes installées ; réponses initiale, de nouvelle recherche et de page suivante distinctes, chacune volontairement non triée selon le mode choisi.
- **Étapes essentielles :**
  1. Partition « nouvelle recherche » : sélectionner un tri discriminant, soumettre une nouvelle recherche, attendre sa réponse distinctive, puis relever sélection et séquence complète.
  2. Partition indépendante « nouvelle page » : sélectionner le même tri sur une réponse paginée, charger la page suivante et relever sélection, requête de page et séquence complète.
  3. Vérifier uniquement les paramètres de recherche/pagination nécessaires et l’absence de paramètre de tri envoyé à l’API.
- **Résultat attendu :** dans les deux partitions, le contrôle conserve le critère choisi et le nouvel ensemble complet est réordonné selon ce critère, plutôt que de conserver artificiellement l’ordre de l’ancien ensemble. La requête sert uniquement à charger la recherche ou la page demandée et ne délègue pas le tri à l’API.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Haute.
- **Justification du niveau :** le maintien de l’état et l’appel du comparateur après réception sont locaux. Deux partitions dans un même cas couvrent les deux sources de nouveaux résultats sans répéter les tests de recherche ou de pagination.

## Matrice de traçabilité

| Cas de test   | Critère(s)                              | Niveau      | Priorité |
| ------------- | --------------------------------------- | ----------- | -------- |
| `TC-SORT-001` | `AC-01`, contribution `AC-09`           | `UI_MOCKED` | Moyenne  |
| `TC-SORT-002` | `AC-03`, contribution `AC-09`           | `UI_MOCKED` | Haute    |
| `TC-SORT-003` | `AC-04`, contribution `AC-09`           | `UI_MOCKED` | Haute    |
| `TC-SORT-004` | `AC-05`, contribution `AC-09`           | `UI_MOCKED` | Moyenne  |
| `TC-SORT-005` | `AC-02`, contributions `AC-07`, `AC-09` | `UI_MOCKED` | Haute    |
| `TC-SORT-006` | `AC-06`, `AC-07`                        | `UI_MOCKED` | Haute    |
| `TC-SORT-007` | `AC-08`, `AC-09`                        | `UI_MOCKED` | Haute    |

## Analyse de couverture

### Critères entièrement couverts

- `AC-01` : options exactes et valeur initiale par `TC-SORT-001`.
- `AC-02` : ordre brut initial et restauration après un autre tri par `TC-SORT-005`.
- `AC-03` : deux directions de nom et collation observée par `TC-SORT-002`.
- `AC-04` : deux directions de date et valeur absente par `TC-SORT-003`.
- `AC-05` : ordre des statuts et stabilité au sein des égalités par `TC-SORT-004`.
- `AC-06` : égalité exacte et unicité de l’ensemble pour tous les modes calculés par `TC-SORT-006`.
- `AC-07` : absence de requête et réordonnancement local par `TC-SORT-006`, avec restauration locale de pertinence spécifiée par `TC-SORT-005`.
- `AC-08` : nouvelle recherche et nouvelle page par les deux partitions de `TC-SORT-007`.
- `AC-09` : cohérence contrôle/ordre vérifiée avec chaque mécanique pertinente, notamment après réception de nouveaux résultats.

### Trous de couverture

Aucun critère n’est laissé sans cas planifié. `AC-02` n’est toutefois pas satisfait par le produit après passage par un autre tri. Cette situation est tracée par `BUG-003`, et `TC-SORT-005` constitue le test de non-régression associé. La contribution de cet écart à l’incohérence couverte par `AC-09` reste inchangée.

### Doublons volontairement évités

- Aucun test API ne répète le contrat générique, la recherche, les filtres ou la pagination déjà couverts par les suites existantes.
- Aucun E2E réel ne répète `TC-SEARCH-010` : la jointure application ↔ API et le rendu de données réelles y sont déjà démontrés.
- Le rendu détaillé des cartes n’est pas revérifié ; les tests de tri lisent seulement leurs identifiants, noms, dates ou statuts utiles.
- L’intégrité complète et l’absence de requête sont centralisées dans `TC-SORT-006` plutôt que répétées avec le même niveau de détail pour chaque comparateur.
- `TC-SORT-007` ne reteste ni la remise à `page=1`, ni les limites de pagination, ni la validité des nouveaux critères : il vérifie exclusivement l’application du tri courant au nouveau tableau.

### Scénarios volontairement non automatisés

- Aucun ordre n’est vérifié avec des entreprises publiques : des données réelles évolutives ne renforceraient pas la preuve d’un algorithme frontend.
- Toutes les combinaisons de casse, accent, ponctuation et caractères spéciaux ne sont pas proposées. Un échantillon discriminant confirme la locale française observée ; une règle de normalisation métier plus détaillée n’est pas spécifiée.
- Les statuts autres que `A` et `C` ne sont pas inventés, ces codes couvrant le contrat actuellement consommé.
- Les égalités de nom ou de date ne donnent pas lieu à un cas séparé : aucun départage secondaire n’est spécifié. L’intégrité reste couverte, et la stabilité d’entrée est explicitement observée pour le statut.
- Le deep linking du tri est hors périmètre de la User Story ; la synchronisation éventuelle du paramètre URL n’est pas ajoutée au plan.
- Les effets des commandes de remise à zéro des filtres sur le tri ne sont pas inclus : ils relèvent du comportement global des filtres et ne sont pas nécessaires aux neuf critères présents.

### Anomalies observées

- **Écart confirmé sur `AC-02` et contribution à l’incohérence de `AC-09` :** la fonction locale trie `S.results` en place. Le mode `Pertinence` se contente ensuite de ne pas retrier ; il ne restaure donc pas l’ordre brut après un tri par nom, date ou statut. La situation est tracée par `BUG-003 — Le tri Pertinence ne restaure pas l’ordre brut de la réponse`, et `TC-SORT-005` est le test de non-régression associé.
- `BUG-001` et `BUG-002` n’affectent pas directement les comparateurs. La partition pagination de `TC-SORT-007` ne change pas la taille de page et la partition recherche n’utilise pas le filtre commune ; elle ne dépend donc pas de ces défauts.

### Ambiguïtés de spécification

- `AC-03`, `AC-04` et `AC-05` renvoient à la règle « implémentée par l’application » sans formaliser toutes les égalités. Le plan documente les règles observées, mais ne crée pas de départage métier absent de la User Story.
- Le placement d’une date absente est déterministe mais résulte de la comparaison de la chaîne `Non renseignée` avec des dates ISO. Si le produit souhaite toujours placer les données absentes en dernier, quelle que soit la direction, la règle métier doit être clarifiée avant de modifier l’attendu.
- Le tri par statut est lexical sur les codes (`A`, puis `C`) et stable à égalité. Aucun ordre fondé sur les libellés affichés n’est spécifié.
- La locale française utilisée pour les noms est observable dans le code et cohérente avec l’interface, mais la sensibilité exacte aux variantes Unicode, à la ponctuation ou aux chiffres n’est pas contractualisée.

### Justification de l’absence de tests API

La pertinence métier appartient à l’ordre déjà produit par l’API et `AC-02` demande précisément au frontend de le préserver, non de le recalculer. Tous les autres ordres sont calculés localement et aucun paramètre de tri n’est transmis au backend. Un test API ne répondrait donc à aucune question distincte de cette User Story.

### Justification de l’absence d’un nouvel E2E_REAL

`TC-SEARCH-010` couvre déjà la consommation et l’affichage d’une réponse API réelle. Les risques propres au tri — ordre brut connu, comparateurs, valeur absente, intégrité, absence d’appel réseau et application aux nouveaux tableaux — exigent des données contrôlées et sont intégralement prouvés en `UI_MOCKED`. Un E2E réel serait plus volatil sans révéler de frontière d’intégration supplémentaire.

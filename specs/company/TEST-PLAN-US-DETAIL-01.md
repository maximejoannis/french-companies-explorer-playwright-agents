# Plan de test — US-DETAIL-01 — Consulter le détail d’une entreprise

## Périmètre et stratégie

Ce plan couvre l’ouverture de la fiche depuis un résultat, l’association entre la carte choisie et les données détaillées, le rendu des informations disponibles ou absentes, le retour aux résultats, la conservation du contexte et la cohérence avec la réponse courante.

La stratégie retient le niveau le plus bas apportant une confiance utile : **quatre cas `UI_MOCKED`** pour les responsabilités déterministes du frontend, **aucun cas `API`** et **un seul cas `E2E_REAL`** pour la frontière propre au détail que `TC-SEARCH-010` ne parcourt pas.

Les défauts `BUG-001`, `BUG-002` et `BUG-003` ne sont pas impliqués : les scénarios n’utilisent pas de commune textuelle, ne changent pas la taille de page et ne reviennent pas au tri Pertinence après un autre tri.

## Résultats de l’exploration

### Composant et contrôles accessibles

- Une carte expose un bouton de rôle `button` nommé exactement **« Voir la fiche »**.
- L’activation remplace visuellement la vue Recherche par la section `#detailView` de la même page. Il ne s’agit ni d’un dialogue, ni d’un panneau superposé, ni d’une nouvelle page ; la section n’expose pas de rôle ARIA ou de nom accessible propre.
- Le retour est un bouton de rôle `button` nommé exactement **« ← Retour aux résultats »**.
- `Escape` et un clic hors du contenu ne ferment pas la fiche, ce qui est cohérent avec une vue dédiée et non modale.
- Après l’ouverture comme après le retour, le focus observé est porté par `body` : aucun déplacement explicite vers le titre ou le bouton Retour, et aucune restauration vers le bouton d’ouverture, n’est implémenté. `AC-09` exige des contrôles identifiables et utilisables, ce qui est satisfait ; la gestion attendue du focus reste toutefois ambiguë et mérite une clarification d’accessibilité, sans constituer à elle seule un défaut fonctionnel avéré dans cette US.

### Champs et formats affichés

La fiche complète présente :

- le nom en titre principal, le libellé d’activité, le statut **« En activité »** ou **« Cessée »**, et un rappel `SIREN <valeur>` ;
- sous **IDENTIFIANTS** : `SIREN`, `SIRET du siège`, `Code activité` ;
- sous **SIÈGE SOCIAL** : commune, adresse complète et code postal ;
- sous **STRUCTURE** : `Catégorie`, `Nature juridique`, `Effectif` ;
- sous **CRÉATION** : la date de création ;
- sous **ÉTABLISSEMENTS** : les contrôles `Tous`, `Actifs`, `Fermés`, puis pour chaque établissement disponible son SIRET, son adresse ou sa commune et son statut **« En activité »** ou **« Fermé »**.

Les valeurs sont présentées essentiellement dans le format brut reçu : date ISO, code d’activité, code de nature juridique, code de catégorie et code de tranche d’effectif. Aucun nombre total d’établissements n’est affiché. Les actions Favoris, Comparer, copie du SIREN et lien vers l’Annuaire sont visibles mais leurs comportements sont hors périmètre de cette User Story.

La carte expose déjà le nom, le SIREN, le statut, le libellé d’activité, une localisation résumée et la date de création. Les preuves spécifiques au détail se concentreront donc sur le SIRET du siège, le code activité, l’adresse complète, la structure et les établissements, sans répéter exhaustivement `TC-SEARCH-005`.

### Valeurs absentes

La normalisation frontend observée affiche :

- **« Entreprise sans nom »** pour un nom absent ;
- **« Activité non renseignée »** pour le libellé d’activité absent et **« Non renseignée »** pour son code ;
- **« Non renseigné »** pour le SIRET du siège et l’effectif ;
- **« Localisation »** et **« Adresse non renseignée »** lorsque commune et adresse manquent ;
- **« Non renseignée »** pour la catégorie, la nature juridique et la date de création ;
- **« Aucun établissement pour ce filtre. »** lorsque la collection d’établissements est vide.

Ces remplacements évitent `undefined`, `null`, `[object Object]` et les exceptions visibles. En revanche, un statut administratif absent est assimilé à **« Cessée »**. Cette valeur affirme un état métier non reçu et contredit l’intention de `AC-05` de gérer une absence sans présentation incohérente. Cet écart est documenté par **`BUG-004 — Un statut administratif absent est affiché comme Cessée`** ; `TC-DETAIL-002` est le cas de non-régression associé. Le résultat fonctionnel attendu reste une représentation neutre de l’absence.

### Réseau et conservation d’état

- Depuis une carte de résultat, `openDetail(siren)` retrouve l’objet dans le tableau courant, le normalise et rend la fiche localement. L’exploration réseau n’a observé **aucune requête supplémentaire** à l’ouverture.
- Une recherche de repli `GET /search?q=<siren>&per_page=1` existe dans la logique frontend uniquement lorsque l’entreprise ne se trouve ni dans les résultats courants ni dans les favoris. Ce chemin n’est pas celui de `AC-01`, qui part explicitement d’une carte de résultat, et ne justifie donc ni endpoint « détail » ni cas supplémentaire.
- Le bouton Retour réaffiche la vue Recherche sans requête. Les cartes, la page, le tri, les filtres et leurs contrôles restent en mémoire et dans le DOM.
- Une nouvelle recherche remplace le tableau courant. L’ouverture d’une carte de ce nouvel ensemble résout l’entreprise depuis cette réponse, sans réutiliser un objet de l’ensemble précédent.

## Données synthétiques prévues

Les cas mockés utiliseront deux objets minimaux, lisibles et entièrement synthétiques :

- **Entreprise complète Alpha**, avec SIREN et SIRET fictifs uniques, nom, statut `A`, activité et libellé, date ISO, siège complet, catégorie, nature juridique, effectif et au moins un établissement distinctif ;
- **Entreprise partielle Bêta**, avec un autre SIREN fictif et sans SIRET du siège, activité, date, localisation, catégorie, nature juridique, effectif, établissements ni statut.

Leurs noms, identifiants, adresses et codes seront volontairement différents. Les assertions d’association vérifieront plusieurs valeurs du même objet et l’absence de valeurs discriminantes de l’autre objet.

## Cas de test

### TC-DETAIL-001 — Association carte → fiche complète

- **Question principale :** l’ouverture de la deuxième carte affiche-t-elle une fiche complète appartenant exclusivement à l’entreprise choisie ?
- **Objectif :** prouver l’ouverture accessible, l’identification sans ambiguïté, le mapping des principales données détaillées et l’absence de mélange entre deux objets.
- **AC couverts :** `AC-01`, `AC-02`, `AC-03`, `AC-04`, contribution `AC-09`.
- **Préconditions :** état navigateur vierge ; route de recherche installée avant navigation ; réponse déterministe contenant Entreprise Alpha complète puis Entreprise Bêta avec des valeurs complètes mais différentes pour cette partition.
- **Étapes essentielles :**
  1. Ouvrir la Recherche, soumettre un terme valide et attendre les deux cartes.
  2. Dans la deuxième carte identifiée par son SIREN synthétique, activer le bouton **« Voir la fiche »** par son rôle et son nom accessible.
  3. Vérifier que la vue Recherche est masquée et que la vue détail est visible.
  4. Vérifier le nom et le SIREN de Bêta, puis plusieurs valeurs spécifiques au détail du même objet : SIRET du siège, code activité, adresse, catégorie, nature juridique, effectif, date et un établissement.
  5. Vérifier que les valeurs discriminantes d’Alpha ne figurent pas dans la fiche.
- **Résultat attendu :** la fiche visible identifie Bêta et toutes les valeurs contrôlées proviennent de Bêta ; aucune donnée d’Alpha n’est mélangée. Le contrôle d’ouverture est utilisable comme bouton nommé **« Voir la fiche »**.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Haute.
- **Justification du niveau :** l’association et le mapping relèvent du frontend ; deux objets synthétiques permettent de détecter de façon stable une erreur d’index ou de sélection sans dépendre des données publiques.

### TC-DETAIL-002 — Présentation des informations facultatives absentes

- **Question principale :** une entreprise partielle produit-elle une fiche stable et honnête, sans valeur technique ni statut métier inventé ?
- **Objectif :** valider les remplacements observés pour les champs facultatifs et empêcher l’affichage d’une absence comme une donnée métier réelle.
- **AC couverts :** `AC-03`, `AC-05`.
- **Préconditions :** état vierge ; route installée ; réponse contenant Entreprise Bêta partielle sans les champs facultatifs listés dans la section Données synthétiques.
- **Étapes essentielles :**
  1. Rechercher l’entreprise partielle et ouvrir sa fiche.
  2. Vérifier les présentations neutres attendues pour activité, SIRET, localisation/adresse, catégorie, nature juridique, effectif, création et établissements.
  3. Vérifier qu’aucun texte `undefined`, `null`, `[object Object]` ni erreur JavaScript visible n’apparaît.
  4. Vérifier que le statut absent est présenté comme non renseigné et non comme **« Cessée »**.
- **Résultat attendu :** la fiche reste exploitable et toutes les absences sont exprimées de manière neutre ; aucun état métier non fourni n’est inventé.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Haute.
- **Justification du niveau :** les valeurs manquantes sont difficiles à stabiliser dans l’API publique et leur présentation est une responsabilité frontend. Ce cas est le test de non-régression de `BUG-004`. Tant que le défaut reste ouvert, le futur scénario automatisé complet devra conserver l’attendu et être déclaré avec `test.fixme`. Ce choix conserve l’exigence fonctionnelle, trace le défaut connu, évite une CI volontairement rouge en permanence et permet de réactiver immédiatement le scénario après correction en retirant `test.fixme`.

### TC-DETAIL-003 — Retour et conservation d’un contexte non trivial

- **Question principale :** consulter puis quitter une fiche laisse-t-il intact le contexte de recherche courant sans nouvel appel réseau ?
- **Objectif :** valider le mécanisme de retour et prévenir la perte des cartes, de la page, du tri ou des filtres.
- **AC couverts :** `AC-06`, `AC-07`, contribution `AC-09`.
- **Préconditions :** état vierge ; routes paginées déterministes installées ; recherche avec filtre postal synthétique, tri autre que Pertinence et au moins deux pages ; compteur de requêtes de recherche.
- **Étapes essentielles :**
  1. Soumettre la recherche filtrée, sélectionner un tri discriminant puis naviguer en page 2.
  2. Relever la séquence visible des SIREN, le libellé de page, les valeurs de recherche, filtre et tri, ainsi que le compteur réseau.
  3. Ouvrir une fiche et vérifier qu’aucune requête n’est ajoutée.
  4. Constater que `Escape` n’est pas présenté comme mécanisme de fermeture d’une vue non modale ; activer le bouton **« ← Retour aux résultats »** par son rôle et son nom.
  5. Vérifier le compteur réseau et l’ensemble des éléments de contexte relevés.
- **Résultat attendu :** le bouton Retour restaure la vue Recherche ; aucune requête n’est émise à l’ouverture ou au retour ; cartes, page, critères et tri sont inchangés. Les responsabilités propres des filtres, du tri et de la pagination ne sont pas retestées.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Haute.
- **Justification du niveau :** le routage de vues et la conservation de l’état sont purement frontend ; un mock permet un contexte complexe stable et une preuve réseau exacte.

### TC-DETAIL-004 — Utilisation exclusive de la réponse courante

- **Question principale :** après remplacement des résultats, la fiche ouverte utilise-t-elle le nouvel objet plutôt qu’un objet obsolète ?
- **Objectif :** couvrir le risque de stale state lors de recherches successives et confirmer le mécanisme local pour la réponse courante.
- **AC couverts :** `AC-04`, `AC-08`.
- **Préconditions :** état vierge ; route installée avant les actions et pilotée pour retourner d’abord Alpha puis un nouvel ensemble contenant Bêta ; objets aux valeurs détaillées incompatibles entre eux.
- **Étapes essentielles :**
  1. Charger le premier ensemble, ouvrir Alpha, contrôler plusieurs valeurs discriminantes puis revenir.
  2. Soumettre une nouvelle recherche et servir le second ensemble ; vérifier que l’ancienne carte est remplacée.
  3. Ouvrir Bêta et relever le nombre de requêtes.
  4. Vérifier la séquence complète de valeurs discriminantes de Bêta et l’absence de celles d’Alpha.
- **Résultat attendu :** la seconde fiche correspond exclusivement à Bêta issue de la réponse courante ; l’ouverture n’ajoute aucune requête et aucune donnée du premier ensemble ne subsiste.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Moyenne.
- **Justification du niveau :** le risque porte sur la gestion de l’état frontend. Des réponses successives contrôlées prouvent mieux ce remplacement qu’un jeu public volatil.

### TC-DETAIL-005 — Intégration réelle résultat API → fiche cohérente

- **Question principale :** une entreprise réellement reçue de l’API peut-elle être choisie dynamiquement et sa fiche reflète-t-elle ce même objet sans endpoint détail ?
- **Objectif :** sécuriser la frontière d’intégration spécifique au détail, au-delà du rendu de carte déjà couvert par `TC-SEARCH-010`.
- **AC couverts :** `AC-01`, `AC-02`, contribution `AC-03`, `AC-08`.
- **Préconditions :** application déployée et API publique disponibles ; aucune entreprise prédéterminée.
- **Étapes essentielles :**
  1. Lancer une recherche textuelle réelle et capturer la réponse `GET /search` réussie.
  2. Parmi les résultats reçus, sélectionner dynamiquement une entreprise dont la carte est réellement visible et dont le nom et le SIREN sont exploitables.
  3. Dériver de cet objet courant les valeurs essentielles qui sont effectivement disponibles pour la fiche.
  4. Ouvrir sa fiche et vérifier le nom, le SIREN et au moins une information détaillée disponible dérivée du même objet, sans supposer un résultat, un ordre ou une valeur fixe.
  5. Vérifier qu’aucune nouvelle requête vers `/search` n’est déclenchée par l’ouverture.
- **Résultat attendu :** la fiche identifie exactement l’entreprise choisie et les données comparées sont cohérentes avec l’objet réel capturé ; l’ouverture réutilise la réponse courante.
- **Niveau :** `E2E_REAL`.
- **Priorité :** Haute.
- **Justification du niveau :** `TC-SEARCH-010` s’arrête à la carte et ne prouve ni l’action carte → fiche, ni le mapping réel des champs spécifiques au détail. Ce cas unique apporte donc une preuve de jointure distincte. Ses assertions dynamiques limitent le risque lié aux données publiques.

## Matrice de traçabilité

| Cas de test     | Critère(s)                                               | Niveau      | Priorité |
| --------------- | -------------------------------------------------------- | ----------- | -------- |
| `TC-DETAIL-001` | `AC-01`, `AC-02`, `AC-03`, `AC-04`, contribution `AC-09` | `UI_MOCKED` | Haute    |
| `TC-DETAIL-002` | `AC-03`, `AC-05`                                         | `UI_MOCKED` | Haute    |
| `TC-DETAIL-003` | `AC-06`, `AC-07`, contribution `AC-09`                   | `UI_MOCKED` | Haute    |
| `TC-DETAIL-004` | `AC-04`, `AC-08`                                         | `UI_MOCKED` | Moyenne  |
| `TC-DETAIL-005` | `AC-01`, `AC-02`, contribution `AC-03`, `AC-08`          | `E2E_REAL`  | Haute    |

## Analyse de couverture

### Critères entièrement couverts

- `AC-01` et `AC-02` : association déterministe par `TC-DETAIL-001`, complétée par la frontière réelle de `TC-DETAIL-005`.
- `AC-03` : champs principaux complets et absents par `TC-DETAIL-001` et `002`, avec une contribution réelle ciblée de `TC-DETAIL-005`.
- `AC-04` : sélection discriminante de la deuxième carte par `TC-DETAIL-001` et absence de données obsolètes par `TC-DETAIL-004`.
- `AC-06` et `AC-07` : retour et contexte non trivial par `TC-DETAIL-003`.
- `AC-08` : réponses successives contrôlées par `TC-DETAIL-004` et intégration réelle par `TC-DETAIL-005`.
- `AC-09` : rôle et nom accessible des deux contrôles essentiels par `TC-DETAIL-001` et `003`.

### Trou de couverture lié à un écart produit

`AC-05` dispose d’un cas complet planifié, mais n’est actuellement pas satisfait lorsque le statut administratif manque : l’interface affiche **« Cessée »**. Ce comportement est tracé par `BUG-004` et `TC-DETAIL-002` est le test de non-régression associé. Les autres valeurs absentes observées sont correctement neutralisées sans représentation technique.

### Doublons volontairement évités

- Le rendu détaillé des cartes reste dans `TC-SEARCH-005` ; le présent plan ne vérifie leurs champs que pour identifier la carte et établir la relation vers la fiche.
- Les règles de filtre, pagination et tri ne sont pas rejouées dans `TC-DETAIL-003` ; seules leur conservation et l’absence d’appel réseau sont contrôlées.
- Les actions Favoris, Comparer, copie et lien officiel, ainsi que le filtrage des établissements, ne sont pas testés : ils ne répondent pas à la question principale de cette User Story.
- Aucun cas par champ ou libellé n’est créé ; les champs sont regroupés selon les risques « objet complet » et « objet partiel ».
- Le chemin de repli d’ouverture hors résultats n’est pas automatisé, car `AC-01` part d’une carte de résultat et les favoris sont hors périmètre.

### Scénarios volontairement non automatisés

- `Escape` et clic extérieur : la fiche est une vue dédiée, non un dialogue ; ces gestes ne constituent pas ses mécanismes de fermeture.
- Audit approfondi du focus ou WCAG : l’absence de déplacement/restauration du focus est documentée comme ambiguïté, mais `AC-09` est limité à l’utilisabilité observable des contrôles essentiels.
- Validation exhaustive des établissements et de leurs filtres : hors objectif principal et susceptible d’appartenir à une User Story dédiée.
- Tous les formats ou toutes les combinaisons de champs manquants : une partition complète et une partition partielle représentative suffisent.

### Anomalies et ambiguïtés

- **Anomalie documentée `BUG-004` :** un statut absent est présenté comme **« Cessée »** ; `AC-05` n’est donc pas satisfait dans cette situation et `TC-DETAIL-002` est le test de non-régression associé. Le résultat attendu reste une représentation neutre et n’est pas aligné sur le défaut.
- La User Story ne prescrit pas la sémantique de focus d’une navigation interne. L’exploration observe le focus sur `body` à l’ouverture et au retour, sans rôle ni nom accessible pour la section détail elle-même. Une clarification produit/accessibilité est recommandée avant d’en faire une assertion bloquante.
- Les dates et codes administratifs sont affichés bruts. Le plan les vérifie comme mapping de la version observée, sans transformer l’absence de formatage utilisateur en règle métier générale.

### Justification de l’absence de test API

La vue détail ne possède aucun contrat backend distinct. Depuis une carte, elle utilise l’objet déjà reçu par `/search` ; le contrat générique de cette API est déjà couvert par `US-SEARCH-01`. Un test API « détail » serait artificiel et redondant.

### Justification du nouvel E2E_REAL

`TC-SEARCH-010` prouve qu’une réponse réelle peut produire une carte cohérente, mais il n’ouvre pas la fiche. `TC-DETAIL-005` ajoute une seule question distincte : le SIREN choisi dynamiquement dans une carte réelle résout-il le bon objet courant et alimente-t-il les champs spécifiques de la fiche, sans appel réseau additionnel ? Cette frontière justifie un unique `E2E_REAL`; tous les cas limites et la conservation d’état restent au niveau `UI_MOCKED`.

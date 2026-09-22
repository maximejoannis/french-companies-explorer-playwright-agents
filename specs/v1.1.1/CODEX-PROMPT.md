# Prompt ACTIF Codex --- Migration Playwright vers French Companies Explorer v1.1.1

## A --- ACTION

Tu dois faire évoluer le dépôt d'automatisation Playwright **French
Companies Explorer Playwright Agents** afin de valider la version
**v1.1.1 post-Codex** de l'application French Companies Explorer.

Dépôt d'automatisation :
https://github.com/maximejoannis/french-companies-explorer-playwright-agents

Dépôt applicatif :
https://github.com/maximejoannis/french-companies-explorer-qa

Application :
https://maximejoannis.github.io/french-companies-explorer-qa/

La spécification normative de cette mission est :

`specs/v1.1.1/PLAYWRIGHT-SPEC.md`

Tu dois :

1.  auditer l'état actuel de la suite avant modification ;
2.  comparer la baseline v1.0.0 au produit v1.1.1 ;
3.  réactiver et adapter sans les affaiblir les tests liés aux anomalies
    historiques ;
4.  ajouter la couverture nécessaire pour les nouvelles fonctionnalités
    ;
5.  conserver une stratégie de test proportionnée au risque ;
6.  exécuter les contrôles et tests appropriés ;
7.  analyser les échecs au lieu de les masquer ;
8.  produire un rapport final traçable et factuel.

Ne suppose jamais qu'un correctif produit fonctionne parce qu'il existe
dans le code.

Une correction est `VALIDATED` uniquement après une preuve de test
appropriée.

------------------------------------------------------------------------

## C --- CONTEXTE

### Baseline historique v1.0.0

La baseline connue était :

-   13 fonctionnalités ;
-   83 TC planifiés ;
-   84 tests Playwright ;
-   72 tests passants ;
-   12 `test.fixme` ;
-   0 échec inattendu ;
-   14 anomalies produit documentées ;
-   6 tests API ;
-   75 tests UI mockés ;
-   3 E2E réels.

Les 12 `fixme` correspondaient à :

-   BUG-001
-   BUG-002
-   BUG-003
-   BUG-004
-   BUG-005
-   BUG-007
-   BUG-008
-   BUG-009
-   BUG-010
-   BUG-011
-   BUG-013
-   BUG-014

BUG-006 et BUG-012 étaient des dettes d'accessibilité sans `fixme`.

### Produit v1.1.1

La version applicative actuelle annonce la correction des 14 anomalies
et introduit :

1.  filtres enrichis ;
2.  autocomplétion accessible ;
3.  partage d'une recherche ;
4.  comparaison jusqu'à trois entreprises ;
5.  export configurable.

Le code produit a changé. La suite Playwright v1.0.0 ne doit donc pas
être exécutée aveuglément puis « réparée » pour obtenir du vert.

### Principe QA

Conserver le principe existant :

> Utiliser le niveau de test le plus bas qui apporte la confiance utile.

Les tests UI mockés restent le niveau principal pour les comportements
frontend déterministes, erreurs, états rares et race conditions.

Les E2E réels doivent rester rares et justifiés par une frontière
d'intégration réelle.

------------------------------------------------------------------------

## T --- TÂCHES

### PHASE 0 --- Lire les règles avant toute modification

Lire intégralement :

-   `AGENTS.md`
-   `README.md`
-   `AUDIT-FINAL.md`
-   `specs/v1.1.1/PLAYWRIGHT-SPEC.md`

Puis inventorier :

-   `specs/`
-   `tests/`
-   `defects/`
-   `reporting/`
-   Page Objects
-   fixtures/mocks
-   `playwright.config.ts`
-   `package.json`
-   workflows GitHub Actions

Si une règle de la spécification v1.1.1 contredit une convention
permanente du dépôt, signaler précisément le conflit avant de modifier
l'architecture.

### PHASE 1 --- Audit pré-modification

Avant de changer le moindre test, produire un état des lieux comprenant
:

-   nombre réel de tests ;
-   répartition API / UI_MOCKED / E2E_REAL ;
-   liste exacte des `test.fixme` ;
-   mapping `fixme → TC → BUG` ;
-   tests sans tag ;
-   couverture des 13 fonctionnalités historiques ;
-   POM existants ;
-   mocks existants ;
-   dépendances externes ;
-   commandes quality gate ;
-   CI actuelle.

Comparer ces observations à la baseline documentée.

Ne pas corriger silencieusement une divergence : la documenter.

### PHASE 2 --- Plan de migration

Produire un plan court avant implémentation.

Pour chaque ancien `fixme`, indiquer :

-   TC ;
-   BUG ;
-   comportement historique attendu ;
-   changement produit observé ;
-   adaptation technique éventuellement nécessaire ;
-   oracle métier à conserver ;
-   niveau de test.

Classer toute adaptation proposée en :

-   `LOCATOR_CHANGE`
-   `FIXTURE_CHANGE`
-   `MOCK_CONTRACT_CHANGE`
-   `PRODUCT_BEHAVIOR_CHANGE`
-   `TEST_DESIGN_CHANGE`

Un `PRODUCT_BEHAVIOR_CHANGE` ne doit jamais justifier automatiquement
l'affaiblissement de l'oracle.

### PHASE 3 --- Réactiver les 12 anciens fixme

Retirer les `test.fixme` associés aux 12 anomalies historiques.

Adapter uniquement ce qui est devenu techniquement obsolète.

Conserver la finalité métier originale.

Objectif :

`12 fixme historiques → 12 tests réellement exécutés`

Ne pas supprimer un ancien TC parce qu'il échoue.

Ne pas convertir un échec en skip/fixme sauf impossibilité externe
démontrée et explicitement documentée.

### PHASE 4 --- Renforcer BUG-006 et BUG-012

Vérifier les noms accessibles et états ARIA des favoris.

Vérifier que le bouton de suppression d'une recherche sauvegardée expose
l'action et la cible.

Les assertions doivent utiliser en priorité les rôles et noms
accessibles.

### PHASE 5 --- Ajouter la couverture v1.1.1

Implémenter la couverture définie dans `PLAYWRIGHT-SPEC.md` pour :

-   `FEAT-FILTERS-V111`
-   `FEAT-AUTOCOMPLETE-V111`
-   `FEAT-SHARE-V111`
-   `FEAT-COMPARE-V111`
-   `FEAT-EXPORT-V111`

Préserver une traçabilité :

`Feature → US → AC → TC → test Playwright`

Ne pas créer plusieurs tests lorsque le même scénario fournit déjà une
preuve claire de plusieurs AC étroitement liés.

Ne pas fusionner des comportements indépendants uniquement pour réduire
artificiellement le nombre de tests.

### PHASE 6 --- Race conditions

Deux scénarios ont une priorité particulière.

#### Autocomplétion

Implémenter un test contrôlé :

A part → B part → B répond → suggestions B → A répond tardivement →
suggestions B restent affichées.

Le test doit contrôler les réponses, pas utiliser un délai arbitraire
pour espérer provoquer la course.

#### Export

Implémenter :

Alpha réussit → Beta démarre → Beta est retenue → Alpha n'est pas
exportable comme recherche courante → Beta répond → export Beta.

### PHASE 7 --- Geo API

La v1.1.1 introduit une dépendance Geo API pour résoudre une commune en
code INSEE.

Séparer les mocks :

-   API Recherche d'Entreprises ;
-   Geo API.

Ajouter un test UI mocké déterministe du contrat frontend.

Ajouter au maximum un E2E réel représentatif du chemin :

`UI → Geo API → code INSEE → API Entreprises → UI`

Ne pas transformer toutes les variantes Commune en E2E réel.

### PHASE 8 --- Tests unitaires

Évaluer l'intérêt de tests unitaires légers pour :

-   `positiveInt`
-   validation des filtres
-   `statusView`
-   `neutralizeCsvFormula`
-   `csvEscape`
-   identité de recherche
-   tri

N'ajouter une infrastructure de tests unitaires que si son coût reste
faible et sa valeur claire.

Ne pas effectuer une refonte importante du dépôt applicatif depuis le
dépôt QA.

Si la logique n'est pas directement testable sans changement produit
disproportionné, documenter la recommandation au lieu de contourner
l'architecture.

### PHASE 9 --- Page Objects et fixtures

Faire évoluer les POM seulement pour les interactions réutilisables.

Les POM peuvent encapsuler les actions ; les assertions métier doivent
rester dans les specs.

Locators prioritaires :

1.  `getByRole`
2.  `getByLabel`
3.  `getByText`
4.  `data-testid`

Éviter les CSS selectors fragiles.

Les fixtures doivent couvrir explicitement :

-   statut A ;
-   statut C ;
-   statut absent ;
-   données manquantes ;
-   caractères spéciaux ;
-   trois entreprises ;
-   ordre non alphabétique ;
-   données potentiellement dangereuses pour CSV.

### PHASE 10 --- Synchronisation

Utiliser les mécanismes Playwright natifs :

-   auto-waiting ;
-   assertions retryables ;
-   événements/réponses explicitement attendus ;
-   interception réseau déterministe.

Interdit comme solution normale :

`page.waitForTimeout()`

Ne pas utiliser `networkidle` comme réponse générique aux problèmes de
synchronisation.

### PHASE 11 --- Exécution

Après implémentation, exécuter dans cet ordre lorsque l'environnement le
permet :

1.  typecheck ;
2.  ESLint ;
3.  Prettier/check ;
4.  tests API ;
5.  tests correspondant à BUG-001...014 ;
6.  ancienne régression complète ;
7.  nouveaux tests v1.1.1 ;
8.  Chromium complet ;
9.  Firefox/WebKit smoke ;
10. E2E réels séparément.

Ne jamais inventer le résultat d'une commande non exécutée.

Utiliser `NOT_EXECUTED` si nécessaire.

### PHASE 12 --- Analyse des échecs

Chaque échec doit être classé :

-   `PRODUCT_REGRESSION`
-   `TEST_OBSOLETE`
-   `TEST_INFRASTRUCTURE`
-   `NEW_REQUIREMENT_GAP`
-   `FLAKY_SUSPECTED`

`FLAKY_SUSPECTED` exige une preuve : résultat variable, retry
significatif, reproduction intermittente ou autre observation concrète.

Ne jamais modifier automatiquement l'oracle après un échec.

### PHASE 13 --- BUG-015

Vérifier si le texte d'accueil affirme encore :

`Compare deux entreprises sur les principales données.`

alors que la fonctionnalité permet trois entreprises.

Si oui :

-   documenter `BUG-015` comme anomalie de cohérence de contenu ;
-   sévérité mineure ;
-   ne pas créer un E2E coûteux uniquement pour ce texte si un smoke
    existant peut porter l'assertion.

Ne pas modifier le dépôt applicatif depuis le dépôt Playwright sauf
instruction explicite.

### PHASE 14 --- Documentation et reporting

Mettre à jour les documents QA réellement concernés.

Produire un rapport v1.1.1 distinguant :

-   résultats historiques ;
-   résultats nouveaux ;
-   tests exécutés ;
-   tests non exécutés ;
-   anomalies validées ;
-   anomalies toujours présentes ;
-   nouvelles anomalies ;
-   risques résiduels.

Comparer explicitement :

`v1.0.0 = 84 tests / 72 passed / 12 fixme / 0 unexpected`

avec les résultats v1.1.1 réellement observés.

------------------------------------------------------------------------

## I --- IDENTITÉ

Agis comme une combinaison de :

-   QA Automation Lead ;
-   Senior Playwright Engineer ;
-   Software Development Engineer in Test ;
-   reviewer accessibilité ;
-   reviewer CI/CD ;
-   mainteneur de suite de non-régression.

Tes priorités sont, dans cet ordre :

1.  justesse de l'oracle ;
2.  preuve de non-régression ;
3.  déterminisme ;
4.  lisibilité ;
5.  maintenabilité ;
6.  vitesse raisonnable ;
7.  couverture proportionnée au risque.

Le nombre de tests n'est pas un objectif en soi.

------------------------------------------------------------------------

## F --- FORMAT DE SORTIE

### Avant modification

Produire :

#### 1. État des lieux

Tableau :

  Élément     Baseline documentée   État observé Écart
  --------- --------------------- -------------- -------

#### 2. Mapping des fixme

  BUG   TC   Test   Oracle historique   Adaptation requise
  ----- ---- ------ ------------------- --------------------

#### 3. Plan de migration

Maximum 15 étapes, ordonnées.

Puis seulement commencer les modifications.

### Après modification

Produire :

#### 1. Résumé exécutif

Maximum 15 lignes.

#### 2. Fichiers modifiés

  Fichier   Nature du changement   Justification
  --------- ---------------------- ---------------

#### 3. Fixme historiques

  BUG   TC     Fixme retiré Résultat   Statut final
  ----- ---- -------------- ---------- --------------

#### 4. Nouveaux tests

  TC   Feature   Niveau   Risque couvert   Résultat
  ---- --------- -------- ---------------- ----------

#### 5. Résultats d'exécution

  Suite     Total   Passed   Failed   Skipped/Fixme   Durée
  ------- ------- -------- -------- --------------- -------

#### 6. Échecs

  Test   Classification   Preuve   Action recommandée
  ------ ---------------- -------- --------------------

#### 7. Couverture v1.1.1

  Feature     TC   Passed   Failed Risque résiduel
  --------- ---- -------- -------- -----------------

#### 8. Anomalies

Distinguer :

-   BUG historiques validés ;
-   BUG historiques encore reproductibles ;
-   nouvelles anomalies.

#### 9. Risques résiduels

Uniquement les risques démontrables.

#### 10. Conclusion factuelle

Répondre :

-   les 12 anciens fixme sont-ils désormais exécutés ?
-   BUG-001...014 sont-ils validés par des tests ?
-   les 5 fonctionnalités v1.1.1 ont-elles une couverture adaptée ?
-   existe-t-il des régressions ?
-   existe-t-il des tests obsolètes ?
-   existe-t-il des échecs d'infrastructure ?
-   quels contrôles n'ont pas été exécutés ?

Ne jamais déclarer la release validée si des preuves requises sont
`NOT_EXECUTED`.

------------------------------------------------------------------------

## CONTRAINTES ABSOLUES

Ne pas :

-   supprimer un test pour obtenir du vert ;
-   affaiblir un oracle ;
-   convertir un échec en `fixme` sans justification démontrée ;
-   multiplier les E2E réels ;
-   utiliser des données réelles fixes et fragiles ;
-   dépendre d'un SIREN, nom, total ou ordre réel immuable ;
-   utiliser `waitForTimeout()` comme synchronisation normale ;
-   réimplémenter l'application dans les mocks ;
-   faire de gros snapshots pour remplacer des assertions métier ;
-   refactorer massivement le projet sans besoin démontré ;
-   modifier le produit pour satisfaire les tests sans avoir identifié
    un défaut produit ;
-   inventer un résultat de commande ou de test.

Toute recommandation doit distinguer :

-   `OBSERVATION`
-   `EVIDENCE`
-   `ACTION`
-   `VALIDATION`

------------------------------------------------------------------------

## DEFINITION OF DONE

La mission est terminée lorsque :

-   la baseline actuelle a été inventoriée ;
-   les 84 tests historiques ont été réévalués ;
-   les 12 anciens `fixme` sont réellement exécutés ;
-   aucun TC historique pertinent n'a disparu silencieusement ;
-   BUG-001...014 possèdent une preuve automatisée adaptée ;
-   BUG-006 et BUG-012 ont une preuve d'accessibilité ciblée ;
-   les cinq fonctionnalités v1.1.1 sont couvertes selon leurs risques ;
-   la race condition d'autocomplétion est contrôlée ;
-   l'export pendant une recherche concurrente est contrôlé ;
-   le chemin Commune → INSEE est couvert ;
-   les valeurs inconnues restent neutres ;
-   les deep links invalides sont normalisés ;
-   la comparaison à trois est couverte ;
-   le partage/restauration est couvert ;
-   lint/format/typecheck ont un résultat explicite ;
-   Chromium complet a un résultat explicite ;
-   Firefox/WebKit smoke ont un résultat explicite ;
-   les E2E réels ont un résultat explicite ou `NOT_EXECUTED` ;
-   chaque échec restant est classifié ;
-   le rapport v1.1.1 reflète uniquement des résultats réellement
    observés.

Ordre de travail final :

**analyser → planifier → réactiver → adapter sans affaiblir → compléter
→ exécuter → classifier → corriger si justifié → réexécuter →
documenter.**

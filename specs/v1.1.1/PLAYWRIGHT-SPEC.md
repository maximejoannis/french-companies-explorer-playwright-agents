# Spécification QA --- French Companies Explorer v1.1.1

## 1. Objectif

Faire évoluer la suite Playwright v1.0.0 afin de valider **French
Companies Explorer v1.1.1 post-Codex**, sans perdre la valeur de
non-régression de la baseline existante.

### Sources de référence

-   Application :
    https://maximejoannis.github.io/french-companies-explorer-qa/
-   Dépôt applicatif :
    https://github.com/maximejoannis/french-companies-explorer-qa
-   Dépôt Playwright :
    https://github.com/maximejoannis/french-companies-explorer-playwright-agents

### Baseline v1.0.0

-   13 fonctionnalités
-   83 TC planifiés
-   84 tests Playwright
-   72 tests passants
-   12 `fixme` associés à des anomalies connues
-   0 échec inattendu
-   14 anomalies produit documentées
-   6 tests API
-   75 tests UI mockés
-   3 tests E2E réels

La v1.1.1 annonce la correction des 14 anomalies et introduit cinq
évolutions majeures :

1.  filtres enrichis ;
2.  autocomplétion accessible ;
3.  partage d'une recherche ;
4.  comparaison jusqu'à trois entreprises ;
5.  export configurable.

------------------------------------------------------------------------

## 2. Principe fondamental de migration

Ne pas considérer une anomalie comme validée simplement parce qu'une
correction existe dans le code.

Utiliser les statuts :

-   `CODE_FIXED_PENDING_TEST` : correction trouvée dans le code,
    validation automatisée manquante ;
-   `VALIDATED` : comportement validé par la nouvelle campagne ;
-   `FAILED` : anomalie toujours reproductible ou régression observée ;
-   `INCONCLUSIVE` : preuve insuffisante.

Les 12 anciens `fixme` doivent être réactivés.

Il est interdit de faire passer un test en :

-   affaiblissant son oracle ;
-   supprimant une assertion métier pertinente ;
-   adaptant le résultat attendu au bug ;
-   ajoutant un `waitForTimeout()` pour masquer un problème de
    synchronisation ;
-   remplaçant un test défaillant par un test moins exigeant.

Un changement de locator, fixture ou mock est acceptable lorsque
l'interface ou le contrat a légitimement évolué.

------------------------------------------------------------------------

## 3. Phase A --- Validation des 14 anomalies historiques

### BUG-001 --- Filtre Commune

**Ancien test :** `TC-FILTERS-009`\
**Niveau :** `UI_MOCKED` obligatoire ; `E2E_REAL` pour un seul scénario
représentatif.

Scénario UI mocké :

1.  saisir une recherche valide ;
2.  saisir une commune ;
3.  mocker la résolution Geo API ;
4.  retourner un code INSEE déterministe ;
5.  lancer la recherche ;
6.  intercepter la requête Entreprises.

**Oracle :**

-   la requête Entreprises contient `code_commune=<code INSEE>` ;
-   elle n'envoie pas le libellé de commune à la place du code attendu ;
-   elle ne retourne pas artificiellement une HTTP 400 causée par le
    format du filtre.

**Action :** retirer le `fixme` de `TC-FILTERS-009`.

Ajouter `TC-FILTERS-010` pour une erreur Geo API : message explicite et
aucune requête Entreprises incohérente.

### BUG-002 --- Taille de page

**Ancien test :** `TC-PAGINATION-005`\
**Niveau :** `UI_MOCKED`

Depuis une page différente de 1, modifier le nombre de résultats par
page.

**Oracle :**

-   `page=1` ;
-   `per_page=<nouvelle taille>` ;
-   les cartes correspondent à la nouvelle réponse ;
-   l'indicateur de pagination correspond à la page 1.

**Action :** retirer le `fixme`.

### BUG-003 --- Retour au tri Pertinence

**Ancien test :** `TC-SORT-005`\
**Niveau :** `UI_MOCKED`

Retourner au moins trois entreprises dans un ordre volontairement non
alphabétique, par exemple `C → A → B`.

Scénario : recherche → mémoriser l'ordre API → Nom A→Z → Pertinence.

**Oracle :** l'ordre final est exactement celui retourné initialement
par l'API. Ne jamais dépendre de l'ordre des propriétés d'un objet JSON.

**Action :** retirer le `fixme`.

### BUG-004 --- Statut absent dans le détail

**Ancien test :** `TC-DETAIL-002`\
**Niveau :** `UI_MOCKED`

Fixture : entreprise sans `etat_administratif`.

**Oracle :** la fiche affiche un état neutre, par exemple
`Non renseigné`, et jamais `Cessée`.

**Action :** retirer le `fixme`.

### BUG-005 --- Favori depuis le détail

**Ancien test :** `TC-FAVORITES-004`\
**Niveau :** `UI_MOCKED`

Tester ajout puis retrait depuis la fiche.

**Oracle :** UI, `aria-pressed` et `localStorage` restent synchronisés
dans les deux directions.

**Action :** retirer le `fixme`.

### BUG-006 --- Accessibilité du bouton Favori

Ajouter ou renforcer `TC-FAVORITES-006`.

**Niveau :** `UI_MOCKED`

**Oracle :**

-   nom accessible comprenant l'action et l'entreprise ;
-   `aria-pressed=false` avant ajout ;
-   `aria-pressed=true` après ajout ;
-   nom accessible cohérent après changement d'état.

### BUG-007 --- Statistiques et statut inconnu

**Ancien test :** `TC-STATS-006`\
**Niveau :** `UI_MOCKED`

Fixture : une société `A`, une `C`, une sans statut.

**Oracle :** actif = 1, cessé = 1, non renseigné = 1. L'inconnu n'est
jamais comptabilisé comme cessé.

**Action :** retirer le `fixme`.

### BUG-008 --- Comparaison et statut inconnu

**Ancien test :** `TC-COMPARE-006`\
**Niveau :** `UI_MOCKED`

**Oracle :** statut absent = `Non renseigné`, jamais `Cessée`.

**Action :** retirer le `fixme` et rendre le test compatible avec le
comparateur jusqu'à trois entreprises.

### BUG-009 --- Identité de l'historique

**Ancien test :** `TC-HISTORY-002`\
**Niveau :** `UI_MOCKED`

Effectuer deux recherches identiques sauf statut `A` puis `C`.

**Oracle :** deux entrées distinctes existent.

**Action :** retirer le `fixme`.

### BUG-010 --- Récence de l'historique

**Ancien test :** `TC-HISTORY-007`\
**Niveau :** `UI_MOCKED`

Après une recherche, changer de page, de taille puis de tri.

**Oracle :** ces opérations ne créent pas artificiellement une nouvelle
recherche et ne modifient pas sa récence métier.

**Action :** retirer le `fixme`.

### BUG-011 --- Recherche sauvegardée sans nom

**Ancien test :** `TC-SAVED-008`\
**Niveau :** `UI_MOCKED`

Tester chaîne vide, espaces et tabulations si pertinent.

**Oracle :** aucune entrée n'est créée ou mise à jour.

**Action :** retirer le `fixme`.

### BUG-012 --- Suppression accessible d'une recherche sauvegardée

**Test existant :** `TC-SAVED-006`\
**Niveau :** `UI_MOCKED`

**Oracle :** le bouton possède un nom accessible similaire à
`Supprimer la recherche <nom>`. La suppression fonctionnelle reste
testée.

### BUG-013 --- Export de résultats obsolètes

**Ancien test :** `TC-EXPORT-006`\
**Niveau :** `UI_MOCKED`

Scénario de course obligatoire :

1.  Alpha réussit ;
2.  démarrer Beta ;
3.  retenir volontairement la réponse Beta ;
4.  vérifier l'export pendant `loading` ;
5.  retourner Beta ;
6.  exporter.

**Oracle :** Alpha ne peut pas être exportée comme recherche courante
pendant Beta ; après succès, l'export correspond à Beta.

**Action :** retirer le `fixme`.

### BUG-014 --- Deep link avec page invalide

**Ancien test :** `TC-DEEP-LINK-006`\
**Niveau :** `UI_MOCKED`

Entrées minimales : `page=abc`, `page=0`, `page=-1`.

**Oracle :** normalisation vers page 1 ; aucune requête et aucun texte
UI ne contiennent `NaN`.

**Action :** retirer le `fixme`.

------------------------------------------------------------------------

## 4. Phase B --- FEATURE 1 : filtres avancés enrichis

**Feature :** `FEAT-FILTERS-V111`\
**User Story :** `US-FILTERS-02`

> En tant qu'utilisateur, je veux affiner une recherche avec davantage
> de critères métier et géographiques afin d'obtenir des entreprises
> plus pertinentes.

  --------------------------------------------------------------------------
  TC                      Objet                      Niveau
  ----------------------- -------------------------- -----------------------
  `TC-FILTERS-011`        Code NAF valide →          UI_MOCKED
                          paramètre API attendu      

  `TC-FILTERS-012`        Code NAF invalide →        UI_MOCKED
                          validation, pas de requête 
                          incohérente                

  `TC-FILTERS-013`        Département, incluant      UI_MOCKED
                          compatibilité `2A`/`2B`    

  `TC-FILTERS-014`        Région                     UI_MOCKED

  `TC-FILTERS-015`        Tranche d'effectif         UI_MOCKED

  `TC-FILTERS-016`        Chips : visibilité,        UI_MOCKED
                          suppression individuelle,  
                          retour page 1              

  `TC-FILTERS-017`        Effacer tous les filtres   UI_MOCKED
                          sans effacer abusivement   
                          la requête                 

  `TC-FILTERS-018`        Persistance/restauration   UI_MOCKED
                          URL de plusieurs filtres   

  `TC-FILTERS-019`        Filtre URL invalide        UI_MOCKED
                          ignoré/normalisé           

  `TC-FILTERS-020`        Commune réelle : Geo API → E2E_REAL
                          INSEE → API Entreprises →  
                          UI                         
  --------------------------------------------------------------------------

------------------------------------------------------------------------

## 5. Phase C --- FEATURE 2 : autocomplétion accessible

**Feature :** `FEAT-AUTOCOMPLETE-V111`\
**User Story :** `US-AUTOCOMPLETE-01`

> En tant qu'utilisateur, je veux recevoir des suggestions pendant ma
> saisie afin d'accéder plus rapidement à une recherche pertinente.

  -----------------------------------------------------------------------
  TC                      Objet                   Niveau
  ----------------------- ----------------------- -----------------------
  `TC-AUTO-001`           Seuil minimum           UI_MOCKED

  `TC-AUTO-002`           Debounce sans attente   UI_MOCKED
                          arbitraire longue       

  `TC-AUTO-003`           Suggestions : nom,      UI_MOCKED
                          SIREN, données utiles   

  `TC-AUTO-004`           Navigation clavier et   UI_MOCKED
                          états ARIA              

  `TC-AUTO-005`           Sélection avec Enter    UI_MOCKED

  `TC-AUTO-006`           Escape ferme la liste   UI_MOCKED
                          et                      
                          `aria-expanded=false`   

  `TC-AUTO-007`           Aucun résultat          UI_MOCKED

  `TC-AUTO-008`           Erreur réseau sans      UI_MOCKED
                          bloquer la recherche    
                          classique               

  `TC-AUTO-009`           Race condition :        UI_MOCKED
                          réponse A tardive ne    
                          remplace pas B          

  `TC-AUTO-010`           SIREN/SIRET numérique   UI_MOCKED
                          sans autocomplétion     
                          textuelle inutile       
  -----------------------------------------------------------------------

`TC-AUTO-009` est prioritaire et doit contrôler explicitement l'ordre
des réponses.

------------------------------------------------------------------------

## 6. Phase D --- FEATURE 3 : partage de recherche

**Feature :** `FEAT-SHARE-V111`\
**User Story :** `US-SHARE-01`

> En tant qu'utilisateur, je veux copier un lien représentant ma
> recherche afin de pouvoir la conserver ou la transmettre.

  TC               Objet                                    Niveau
  ---------------- ---------------------------------------- -----------
  `TC-SHARE-001`   URL simple                               UI_MOCKED
  `TC-SHARE-002`   URL avec combinaison de critères         UI_MOCKED
  `TC-SHARE-003`   Ouverture du lien et restauration        UI_MOCKED
  `TC-SHARE-004`   Accents, espaces et encodage             UI_MOCKED
  `TC-SHARE-005`   `navigator.clipboard.writeText`          UI_MOCKED
  `TC-SHARE-006`   Échec Clipboard et fallback sans crash   UI_MOCKED
  `TC-SHARE-007`   Feedback exposé par live region          UI_MOCKED

------------------------------------------------------------------------

## 7. Phase E --- FEATURE 4 : comparaison jusqu'à trois entreprises

**Feature :** `FEAT-COMPARE-V111`\
**User Story :** `US-COMPARE-02`

> En tant qu'utilisateur, je veux comparer jusqu'à trois entreprises
> afin d'identifier leurs principales différences.

  -----------------------------------------------------------------------
  TC                      Objet                   Niveau
  ----------------------- ----------------------- -----------------------
  `TC-COMPARE-007`        État avec une           UI_MOCKED
                          entreprise              

  `TC-COMPARE-008`        Deux entreprises        UI_MOCKED

  `TC-COMPARE-009`        Trois entreprises et    UI_MOCKED
                          association correcte    
                          des colonnes            

  `TC-COMPARE-010`        Quatrième refusée +     UI_MOCKED
                          feedback                

  `TC-COMPARE-011`        Retrait sans            UI_MOCKED
                          désalignement           

  `TC-COMPARE-012`        Données manquantes      UI_MOCKED
                          neutres                 

  `TC-COMPARE-013`        Différences             UI_MOCKED
                          identifiables sans      
                          couleur seule           

  `TC-COMPARE-014`        Persistance             UI_MOCKED
                          `localStorage`          

  `TC-COMPARE-015`        Noms accessibles des    UI_MOCKED
                          boutons Retirer         
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 8. Phase F --- FEATURE 5 : export configurable

**Feature :** `FEAT-EXPORT-V111`\
**User Story :** `US-EXPORT-02`

> En tant qu'utilisateur, je veux choisir le format et le périmètre de
> mon export afin de télécharger exactement les données qui
> m'intéressent.

  -----------------------------------------------------------------------
  TC                      Objet                   Niveau
  ----------------------- ----------------------- -----------------------
  `TC-EXPORT-007`         Configuration CSV       UI_MOCKED

  `TC-EXPORT-008`         Configuration JSON sans UI_MOCKED
                          dépendre de l'ordre des 
                          propriétés              

  `TC-EXPORT-009`         Périmètre comparaison   UI_MOCKED
                          uniquement              

  `TC-EXPORT-010`         CSV : séparateurs,      UI_MOCKED
                          guillemets, retours     
                          ligne, accents          

  `TC-EXPORT-011`         CSV injection : `=`,    UI_MOCKED
                          `+`, `-`, `@`, y        
                          compris après espaces   

  `TC-EXPORT-012`         Valeurs manquantes      UI_MOCKED

  `TC-EXPORT-013`         Nom de fichier          UI_MOCKED
                          déterministe et         
                          extension correcte      

  `TC-EXPORT-014`         Aucun résultat          UI_MOCKED

  `TC-EXPORT-015`         Recherche en chargement UI_MOCKED
                          / cohérence avec        
                          BUG-013                 
  -----------------------------------------------------------------------

------------------------------------------------------------------------

## 9. Tests unitaires légers à évaluer

Ne pas introduire une infrastructure lourde uniquement pour augmenter la
couverture.

Candidats :

-   `UNIT-001` --- `positiveInt()`
-   `UNIT-002` --- validation code postal / NAF / département / région
-   `UNIT-003` --- `statusView()` : A, C, vide, inconnu
-   `UNIT-004` --- `neutralizeCsvFormula()`
-   `UNIT-005` --- `csvEscape()`
-   `UNIT-006` --- identité de recherche
-   `UNIT-007` --- logique de tri si extraction légère justifiée

Ne pas refactorer massivement `app.js` uniquement pour rendre ces tests
possibles.

------------------------------------------------------------------------

## 10. E2E réel : rester minimal

Conserver le principe :

> Utiliser le niveau de test le plus bas qui apporte la confiance utile.

Candidats prioritaires :

-   `E2E-REAL-SEARCH` : recherche réelle, assertions stables uniquement
    ;
-   `E2E-REAL-DETAIL` : conserver si la frontière réelle apporte
    toujours une valeur distincte ;
-   `E2E-REAL-CITY` : un scénario UI → Geo API → code INSEE → API
    Entreprises → UI.

Ne pas ajouter un E2E réel pour chaque filtre, l'autocomplétion, les
race conditions, le partage, chaque export ou toutes les comparaisons.

------------------------------------------------------------------------

## 11. Matrice de stratégie

  -----------------------------------------------------------------------------
  Domaine                    UNIT            API       UI_MOCKED       E2E_REAL
  ---------------- -------------- -------------- --------------- --------------
  Régression                ciblé          ciblé   **principal**           rare
  BUG-001...014                                                  

  Filtres enrichis          utile oui si contrat   **principal**      1 commune

  Autocomplétion        optionnel         faible   **principal**     non requis

  Partage            utile si URL            non   **principal**     non requis
                         extraite                                

  Comparaison à 3        utile si            non   **principal**     non requis
                          logique                                
                         extraite                                

  Export                **utile**            non   **principal**     non requis

  Deep linking          **utile**            non   **principal**   exceptionnel
  -----------------------------------------------------------------------------

------------------------------------------------------------------------

## 12. Tags

Conserver autant que possible :

-   `@smoke`
-   `@regression`
-   `@positive`
-   `@negative`
-   `@error`
-   `@accessibility`

Éviter les tags purement décoratifs.

------------------------------------------------------------------------

## 13. Synchronisation Playwright

Privilégier :

-   assertions auto-waiting ;
-   `waitForResponse()` uniquement lorsque la réponse réseau est
    réellement l'oracle ;
-   listener enregistré avant l'action ;
-   routes déterministes ;
-   contrôle explicite des Promises pour les race conditions.

Ne pas utiliser `page.waitForTimeout()` comme solution normale.

Éviter `networkidle` comme mécanisme générique de disponibilité.

Pour `TC-AUTO-009` et `TC-EXPORT-006`, contrôler explicitement l'ordre
des réponses réseau.

------------------------------------------------------------------------

## 14. Mocks

Les mocks représentent des réponses de service ; ils ne doivent pas
réimplémenter la logique métier.

Séparer clairement :

-   API Recherche d'Entreprises ;
-   Geo API ;
-   Clipboard API ;
-   stockage local lorsque nécessaire.

Les fixtures doivent couvrir :

-   statut `A` ;
-   statut `C` ;
-   statut absent ;
-   champs absents ;
-   caractères spéciaux ;
-   au moins trois entreprises ;
-   ordre API non alphabétique ;
-   données CSV potentiellement dangereuses.

------------------------------------------------------------------------

## 15. Page Object Model

Faire évoluer le POM uniquement lorsque les nouvelles interactions le
justifient.

Actions métier candidates :

-   sélectionner un filtre enrichi ;
-   sélectionner une commune proposée ;
-   naviguer dans l'autocomplétion ;
-   partager une recherche ;
-   ouvrir/configurer un export ;
-   ajouter/retirer une entreprise de la comparaison.

Ne pas placer les assertions métier dans le POM.

Priorité aux locators :

1.  `getByRole()`
2.  `getByLabel()`
3.  `getByText()` lorsque pertinent
4.  `data-testid` lorsque nécessaire

Éviter les sélecteurs CSS fragiles.

------------------------------------------------------------------------

## 16. Contrôle des anciens tests

Avant les nouveaux TC :

1.  inventorier les 84 tests existants ;
2.  vérifier qu'aucun TC historique n'a disparu ;
3.  localiser les 12 `fixme` ;
4.  associer chaque `fixme` à BUG-001...014 ;
5.  retirer les `fixme` ;
6.  adapter uniquement ce qui est techniquement obsolète ;
7.  conserver les oracles métier ;
8.  exécuter la suite ;
9.  classifier les échecs.

Classification obligatoire :

-   `PRODUCT_REGRESSION`
-   `TEST_OBSOLETE`
-   `TEST_INFRASTRUCTURE`
-   `NEW_REQUIREMENT_GAP`
-   `FLAKY_SUSPECTED`

Ne jamais utiliser `FLAKY_SUSPECTED` sans preuve.

------------------------------------------------------------------------

## 17. Première campagne v1.1.1

Ordre d'exécution :

1.  TypeScript, ESLint, Prettier, validation configuration ;
2.  tests API ;
3.  régression des 14 bugs ;
4.  ancienne régression complète ;
5.  nouveaux tests v1.1.1 ;
6.  Chromium complet ;
7.  Firefox/WebKit smoke ;
8.  E2E réels séparés.

Objectif critique :

`12 anciens fixme → 12 tests réellement exécutés`

Les E2E réels doivent permettre de distinguer défaut produit, rupture de
contrat et indisponibilité externe.

------------------------------------------------------------------------

## 18. Rapport attendu

Inclure :

-   total ;
-   passed ;
-   failed ;
-   skipped ;
-   fixme ;
-   retries/flaky ;
-   durée ;
-   navigateur.

Comparer explicitement :

**v1.0.0 :** `84 tests / 72 passed / 12 fixme / 0 unexpected`

avec :

**v1.1.1 :** résultats réellement observés.

### Tableau anomalies

  BUG       TC                 Statut code               Résultat Playwright   Statut final
  --------- ------------------ ------------------------- --------------------- --------------
  BUG-001   TC-FILTERS-009     CODE_FIXED_PENDING_TEST   ...                   ...
  ...       ...                ...                       ...                   ...
  BUG-014   TC-DEEP-LINK-006   CODE_FIXED_PENDING_TEST   ...                   ...

Un bug devient `VALIDATED` uniquement après réussite de la preuve
appropriée.

### Tableau fonctionnalités

  Feature                 TC prévus   Passed   Failed Risque résiduel
  --------------------- ----------- -------- -------- -----------------
  Filtres enrichis              ...      ...      ... ...
  Autocomplétion                ...      ...      ... ...
  Partage                       ...      ...      ... ...
  Comparaison à 3               ...      ...      ... ...
  Export configurable           ...      ...      ... ...

------------------------------------------------------------------------

## 19. Nouvelle anomalie identifiée

### BUG-015 --- Texte d'accueil obsolète

Observation : la page d'accueil indique encore :

> Compare deux entreprises sur les principales données.

alors que la v1.1.1 permet d'en comparer jusqu'à trois.

**Sévérité proposée :** mineure.

Corriger la cohérence du contenu. Un test E2E dédié n'est pas nécessaire
si une assertion de smoke/home couvre déjà ce contrat.

------------------------------------------------------------------------

## 20. Definition of Done QA v1.1.1

La campagne est terminée lorsque :

-   les 84 tests historiques ont été réévalués ;
-   aucun ancien TC pertinent n'a été silencieusement supprimé ;
-   les 12 anciens `fixme` ont été exécutés ;
-   BUG-001 à BUG-014 ont chacun une preuve appropriée ;
-   aucun oracle n'a été affaibli ;
-   les cinq nouvelles fonctionnalités sont couvertes selon leurs
    risques ;
-   la race condition d'autocomplétion est testée ;
-   l'export obsolète est testé ;
-   les valeurs inconnues restent neutres ;
-   les URLs invalides sont normalisées ;
-   le partage est restaurable ;
-   la comparaison à trois est testée ;
-   les filtres enrichis sont testés ;
-   le chemin commune → code INSEE est couvert ;
-   les contrôles d'accessibilité ciblés passent ;
-   Chromium complet passe ;
-   Firefox/WebKit smoke passent ;
-   les E2E réels sont distingués des tests déterministes ;
-   lint/format/typecheck passent ;
-   aucun échec inattendu ne reste sans classification ;
-   README, rapports QA et version documentent réellement la v1.1.1.

------------------------------------------------------------------------

## 21. Instructions spécifiques à Codex

Avant toute modification :

1.  lire `AGENTS.md` ;
2.  lire `README.md` ;
3.  lire `AUDIT-FINAL.md` ;
4.  inventorier `specs/`, `tests/`, `defects/`, `reporting/` et la CI ;
5.  identifier exactement les 84 tests existants ;
6.  identifier exactement les 12 `test.fixme` ;
7.  comparer leurs oracles aux corrections v1.1.1 ;
8.  produire un court plan de migration.

Ensuite seulement modifier le projet.

Ne pas réécrire entièrement la suite.

Préserver :

-   traçabilité US → AC → TC → test ;
-   séparation API / UI_MOCKED / E2E_REAL ;
-   POM ;
-   reporting Allure ;
-   quality gates ;
-   stratégie cross-browser.

Pour chaque nouveau TC, documenter Feature, User Story, Acceptance
Criterion, Test Case ID, niveau, priorité, préconditions, données,
étapes, résultat attendu et automatisation correspondante.

À la fin, fournir :

1.  fichiers créés ;
2.  fichiers modifiés ;
3.  `fixme` supprimés ;
4.  anciens tests adaptés et justification ;
5.  nouveaux TC ;
6.  nouveaux tests Playwright ;
7.  éventuels tests unitaires ;
8.  changements CI ;
9.  résultats d'exécution réels ;
10. anomalies découvertes ;
11. risques résiduels.

Ne jamais inventer un résultat d'exécution. Si les tests n'ont pas été
exécutés, écrire `NOT_EXECUTED` et non `PASSED`.

------------------------------------------------------------------------

## 22. Critère final

La question n'est pas :

> Combien de tests avons-nous ajouté ?

Mais :

> Avons-nous une preuve automatisée proportionnée aux risques que les
> corrections v1.0.0 fonctionnent réellement, que les nouvelles
> fonctionnalités v1.1.1 respectent leur contrat et que les
> fonctionnalités historiques n'ont pas régressé ?

Stratégie :

**réactiver → adapter sans affaiblir → compléter selon le risque →
exécuter → analyser → corriger → réexécuter → valider.**

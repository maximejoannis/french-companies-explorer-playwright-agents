# Plan de test — US-STATS-01 — Consulter les statistiques de la page courante

## Périmètre et stratégie

Ce plan couvre l’affichage et le calcul du panneau statistique, son remplacement après une nouvelle recherche ou un filtrage, son recalcul lors de la pagination, son invariance au tri, sa disparition sans résultat et sa robustesse face aux valeurs absentes.

La fonctionnalité observée est un calcul exclusivement frontend effectué sur les objets de la réponse courante. La stratégie retient **six cas `UI_MOCKED`**, **aucun cas `API`** et **aucun cas `E2E_REAL`**. Des réponses synthétiques petites et discriminantes permettent de prouver les calculs sans dépendre des données publiques.

Les baselines Recherche, Filtres, Pagination et Tri valident déjà leurs responsabilités respectives. Les futurs tests Stats ne devront donc pas revérifier exhaustivement les paramètres, les cartes ou les ordres : ils observeront seulement les valeurs du panneau après chaque changement d’ensemble ou d’ordre.

## Résultats de l’exploration

### Emplacement et visibilité

- Le panneau est rendu dans la vue Recherche, entre la barre d’outils et les filtres actifs, avant l’état de recherche et la grille de résultats.
- Son conteneur est `#statsPanel` et expose le contrat existant `data-testid="results-stats"`.
- Il est visible dès que la réponse courante contient au moins une entreprise.
- Si la réponse contient zéro résultat, le panneau est masqué et son contenu est vidé. Les statistiques précédentes ne restent pas dans le DOM visible.
- L’action **« Réinitialiser »** masque et vide également le panneau avec le reste de la recherche.

### Indicateurs affichés et calculs observés

Le panneau contient quatre blocs principaux et six valeurs fonctionnelles :

1. **« Affichées »** : nombre d’objets présents dans la réponse de la page courante ;
2. **« En activité »** : nombre d’entreprises dont le statut normalisé vaut `A` ;
3. **« `<n> cessée(s)` »** : nombre actuellement calculé comme `Affichées - En activité` ;
4. **« Communes distinctes »** : nombre de communes non vides distinctes de la page ;
5. **« `<n> avec code postal` »** : nombre d’entreprises dont le code postal normalisé est non vide ;
6. **« Effectif renseigné »** : nombre d’entreprises dont l’effectif est présent et différent du remplacement **« Non renseigné »**.

Le bloc Effectif affiche aussi **« Création la plus ancienne : `<date>` »**. La valeur retenue est la plus petite date disponible au format ISO `YYYY-MM-DD...`. Si aucune date ne correspond à ce format, l’interface affiche un tiret cadratin `—`.

Les libellés et valeurs sont du texte visible, mais les différents blocs ne disposent pas de noms ou rôles accessibles spécifiques. Le `data-testid` du panneau constitue le meilleur point de scope actuel ; les assertions devront ensuite associer chaque libellé à la valeur de son propre bloc plutôt que rechercher des nombres globalement.

### Page courante, recherche, filtres, pagination et tri

- Le total API `total_results` n’entre pas dans les calculs. Une réponse contenant 3 objets et annonçant 30 résultats produit **« Affichées 3 »** et des indicateurs calculés uniquement sur ces 3 objets.
- Une nouvelle recherche remplace le tableau courant puis reconstruit entièrement le panneau. Aucune valeur du premier ensemble n’est conservée.
- Les filtres sont transmis à la recherche ; le panneau est recalculé à partir des objets de la nouvelle réponse filtrée.
- Changer de page déclenche la requête de page attendue puis recalcule le panneau sur les objets de cette page seulement.
- Le tri réordonne localement le tableau courant et relance le rendu du panneau. Comme l’ensemble ne change pas, toutes les valeurs restent identiques et aucune requête n’est émise pour les statistiques ou pour le tri.

### Valeurs absentes

- Une commune absente ne contribue pas au nombre de communes distinctes.
- Un code postal absent ne contribue pas au compteur **« avec code postal »**.
- Un effectif absent est normalisé en **« Non renseigné »** et ne contribue pas à **« Effectif renseigné »**.
- Une date absente ou non conforme au format ISO attendu est exclue du calcul de la date la plus ancienne ; si toutes les dates sont absentes, `—` est affiché.
- Aucun `undefined`, `null`, `[object Object]` ni erreur visible n’a été observé avec ces absences.
- En revanche, un statut absent est actuellement inclus dans **« cessée(s) »**, car ce compteur inclut tout ce qui n’est pas `A`. Une absence est ainsi transformée en statut métier réel. Cet écart contredit le calcul fidèle des entreprises affichées attendu par `AC-02` et la gestion des valeurs absentes de `AC-08`. Il est proposé comme `BUG-007`.

### Interactions réseau

- Une recherche, un filtrage ou un changement de page utilise la requête `GET /search` déjà nécessaire à l’affichage des cartes.
- Le panneau est calculé localement à partir de cette réponse.
- Aucune requête supplémentaire n’est effectuée pour obtenir ou recalculer les statistiques.
- Un tri ne déclenche aucune requête.

## Données synthétiques prévues

Prévoir un petit jeu d’entreprises aux valeurs faciles à compter :

- **Alpha** : active, commune Paris, code postal présent, effectif renseigné, création `2020-01-15` ;
- **Bêta** : cessée, commune Lyon, code postal présent, effectif absent, création `2010-05-20` ;
- **Gamma** : statut absent, commune Paris, code postal présent, effectif renseigné, création absente ;
- **Delta** : active, commune Bordeaux, code postal absent, effectif absent, création `2024-03-01`.

Les pages et réponses successives utiliseront des sous-ensembles incompatibles de ces objets. Le total annoncé pourra être volontairement supérieur au nombre d’objets retournés pour prouver que le panneau reste limité à la page courante. Les mocks existants pourront être réutilisés lorsqu’ils portent exactement les champs requis ; sinon un fichier minimal dédié aux statistiques sera plus lisible qu’un enrichissement artificiel des mocks d’un autre domaine.

## Cas de test

### TC-STATS-001 — Calculer tous les indicateurs sur la page affichée

- **Question principale :** le panneau visible calcule-t-il exactement ses indicateurs sur les objets de la page courante plutôt que sur le total API ?
- **Objectif :** valider l’affichage, les libellés réels, les calculs nominaux et la frontière page courante.
- **AC couverts :** `AC-01`, `AC-02`.
- **Préconditions :** route installée avant navigation ; réponse contenant trois entreprises complètes aux statuts `A`, `A`, `C`, deux communes distinctes, deux codes postaux, deux effectifs renseignés et des dates ISO distinctes ; `total_results` volontairement supérieur à 3 ; compteur des requêtes `/search`.
- **Étapes essentielles :**
  1. Soumettre une recherche synthétique et attendre les cartes de la page.
  2. Vérifier que le panneau est visible.
  3. Dans chaque bloc scopé par son libellé, vérifier **« Affichées 3 »**, **« En activité 2 »**, **« 1 cessée(s) »**, **« Communes distinctes 2 »**, **« 2 avec code postal »**, **« Effectif renseigné 2 »** et la date la plus ancienne attendue.
  4. Vérifier qu’une seule requête de recherche a fourni à la fois les cartes et les statistiques.
- **Résultat attendu :** tous les libellés et calculs correspondent aux trois objets affichés, jamais au total API annoncé ; aucune requête statistique supplémentaire n’est émise.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Haute.
- **Justification du niveau :** les calculs sont locaux et nécessitent des valeurs déterministes ; l’API réelle ne fournit aucun agrégat statistique distinct à valider.

### TC-STATS-002 — Remplacer complètement les statistiques après une nouvelle recherche

- **Question principale :** une seconde recherche remplace-t-elle toutes les valeurs du premier ensemble sans statistique obsolète ?
- **Objectif :** prévenir le mélange ou la conservation des indicateurs issus d’une réponse antérieure.
- **AC couverts :** `AC-03`.
- **Préconditions :** route à réponses successives ; premier ensemble de plusieurs entreprises avec plusieurs communes et une date ancienne ; second ensemble contenant uniquement Delta avec des valeurs incompatibles ; compteur réseau.
- **Étapes essentielles :**
  1. Charger le premier ensemble et relever toutes les valeurs du panneau.
  2. Soumettre une nouvelle recherche et servir uniquement Delta.
  3. Vérifier **« Affichées 1 »** et chaque indicateur dérivé de Delta.
  4. Vérifier que les valeurs discriminantes propres au premier ensemble, notamment son ancienne date minimale, ne figurent plus dans le panneau.
  5. Vérifier qu’il y a exactement une requête par recherche et aucune requête dédiée aux statistiques.
- **Résultat attendu :** le second panneau décrit exclusivement Delta et ne conserve aucune valeur du premier ensemble.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Haute.
- **Justification du niveau :** le risque porte sur le remplacement de l’état frontend ; deux réponses contrôlées le démontrent sans volatilité.

### TC-STATS-003 — Recalculer les statistiques sur la réponse filtrée

- **Question principale :** après filtrage, le panneau reflète-t-il uniquement le nouvel ensemble retourné ?
- **Objectif :** vérifier la liaison entre remplacement des résultats filtrés et recalcul des statistiques, sans retester le contrat complet de chaque filtre.
- **AC couverts :** `AC-04`.
- **Préconditions :** réponse initiale Alpha/Bêta ; route distinguant la requête sans filtre de celle avec un filtre postal et retournant alors uniquement Bêta ; compteur réseau.
- **Étapes essentielles :**
  1. Charger Alpha et Bêta et vérifier le résumé initial.
  2. Appliquer un filtre postal via le contrôle existant et soumettre la recherche.
  3. Vérifier que la requête filtrée remplace les cartes par Bêta uniquement.
  4. Vérifier que tous les indicateurs correspondent désormais uniquement à Bêta.
  5. Vérifier que seule la requête de recherche filtrée a été ajoutée.
- **Résultat attendu :** le panneau est recalculé sur Bêta, sans mélange avec Alpha ni requête statistique séparée.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Haute.
- **Justification du niveau :** le filtre et le calcul doivent être isolés de l’API publique ; la validité des paramètres de filtre est déjà couverte par le plan Filtres.

### TC-STATS-004 — Suivre la page courante sans varier lors du tri

- **Question principale :** les statistiques changent-elles avec la composition de la page mais restent-elles identiques lorsque seul son ordre change ?
- **Objectif :** couvrir ensemble les deux transformations complémentaires de la page courante : changement d’ensemble par pagination et permutation locale par tri.
- **AC couverts :** `AC-05`, `AC-06`.
- **Préconditions :** deux réponses paginées aux indicateurs incompatibles ; page 1 contenant Alpha/Bêta, page 2 contenant Gamma/Delta ; tri dont l’ordre visible change sur la page 2 ; compteur réseau.
- **Étapes essentielles :**
  1. Charger la page 1 et relever toutes les statistiques.
  2. Activer **« Suivant »**, servir la page 2 et vérifier toutes ses nouvelles valeurs, notamment code postal, effectif et date minimale.
  3. Relever le panneau et le compteur réseau, puis appliquer un tri qui inverse effectivement les cartes de la page 2.
  4. Vérifier que l’ordre des cartes change mais que le contenu complet du panneau reste identique.
  5. Vérifier qu’une requête a été ajoutée pour la pagination et aucune pour le tri ou les statistiques.
- **Résultat attendu :** la page 2 remplace les statistiques de la page 1 ; le tri de cette même page ne modifie ensuite aucune valeur et reste local.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Haute.
- **Justification du niveau :** les valeurs par page et l’invariance d’un agrégat à une permutation exigent des ensembles synthétiques maîtrisés. Les règles propres de pagination et de tri ne sont pas dupliquées.

### TC-STATS-005 — Masquer et vider le panneau sans résultat

- **Question principale :** une réponse vide retire-t-elle complètement les statistiques précédentes ?
- **Objectif :** garantir qu’un état sans résultat ne présente ni panneau incohérent ni valeur obsolète.
- **AC couverts :** `AC-07`.
- **Préconditions :** première réponse non vide produisant un panneau reconnaissable ; seconde réponse avec `results: []` et `total_results: 0`.
- **Étapes essentielles :**
  1. Charger la réponse non vide et vérifier que le panneau est visible.
  2. Soumettre une nouvelle recherche et servir la réponse vide.
  3. Vérifier l’état fonctionnel **« Aucune entreprise ne correspond à cette recherche. »**.
  4. Vérifier que le panneau est masqué, vidé et ne contient plus aucune valeur de la recherche précédente.
- **Résultat attendu :** aucun indicateur n’est visible ou conservé après la réponse vide ; l’absence de résultat n’est pas présentée comme une erreur technique.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Haute.
- **Justification du niveau :** le masquage et la suppression des valeurs obsolètes sont des responsabilités frontend et une réponse vide mockée est parfaitement déterministe.

### TC-STATS-006 — Exclure honnêtement les valeurs absentes des indicateurs

- **Question principale :** les champs absents sont-ils exclus des indicateurs concernés sans erreur technique ni statut métier inventé ?
- **Objectif :** valider les règles de non-contribution pour commune, code postal, effectif et date, et empêcher qu’un statut absent soit compté comme une cessation.
- **AC couverts :** `AC-02`, `AC-08`.
- **Préconditions :** réponse contenant une entreprise Gamma sans statut ni date, avec effectif renseigné, et une autre entreprise aux commune, code postal et effectif absents ; aucune entreprise avec statut `C`.
- **Étapes essentielles :**
  1. Soumettre la recherche et vérifier que le panneau reste visible et stable.
  2. Vérifier les compteurs attendus de communes, codes postaux et effectifs à partir des seules valeurs présentes.
  3. Vérifier que la date minimale ignore les absences et affiche `—` si aucune date exploitable n’existe.
  4. Vérifier qu’aucun `undefined`, `null`, `[object Object]`, message d’erreur ou exception n’apparaît.
  5. Vérifier que **« En activité 0 »** et **« 0 cessée(s) »** : les statuts absents ne doivent appartenir à aucun de ces deux comptes.
- **Résultat attendu :** chaque absence est exclue du calcul qui exige sa valeur ; le panneau reste exploitable et aucun statut absent n’est transformé en cessation.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Haute.
- **Justification du niveau :** les absences sont difficiles à stabiliser avec les données publiques et leur traitement statistique est purement frontend. Ce cas est le test de non-régression proposé pour `BUG-007`.
- **Condition avant implémentation :** documenter `BUG-007`. Tant que le défaut reste ouvert, conserver le scénario complet avec l’attendu fonctionnel et le déclarer avec `test.fixme`. Ne pas compter une absence comme une cessation pour aligner l’oracle sur le comportement défectueux.

## Matrice de traçabilité

| Cas de test    | Critère(s)       | Niveau      | Priorité |
| -------------- | ---------------- | ----------- | -------- |
| `TC-STATS-001` | `AC-01`, `AC-02` | `UI_MOCKED` | Haute    |
| `TC-STATS-002` | `AC-03`          | `UI_MOCKED` | Haute    |
| `TC-STATS-003` | `AC-04`          | `UI_MOCKED` | Haute    |
| `TC-STATS-004` | `AC-05`, `AC-06` | `UI_MOCKED` | Haute    |
| `TC-STATS-005` | `AC-07`          | `UI_MOCKED` | Haute    |
| `TC-STATS-006` | `AC-02`, `AC-08` | `UI_MOCKED` | Haute    |

## Analyse de couverture et doublons évités

- Les six TC couvrent `AC-01` à `AC-08` sans cas API ni E2E réel.
- `TC-STATS-001` prouve la frontière page courante avec un `total_results` supérieur, sans répéter le contrat de pagination de l’API.
- `TC-STATS-002` et `TC-STATS-003` utilisent tous deux des réponses successives, mais posent des questions différentes : remplacement par une nouvelle recherche et recalcul après application explicite d’un filtre.
- `TC-STATS-004` regroupe naturellement pagination et tri : le premier change la composition, le second change seulement l’ordre. Aucun cas distinct par mode de tri n’est nécessaire.
- `TC-STATS-005` couvre à la fois le masquage et l’absence de valeurs obsolètes, sans dupliquer le test générique de réponse vide de la Recherche.
- `TC-STATS-006` regroupe les valeurs absentes selon une seule question de fidélité statistique, sans créer un TC par champ.
- Aucun `API` n’est retenu : le backend ne fournit pas ces agrégats et ses contrats de recherche, filtres et pagination sont déjà couverts.
- Aucun `E2E_REAL` n’est retenu : les baselines Recherche et Détail prouvent déjà l’intégration réelle, tandis que les statistiques n’ajoutent aucune frontière réseau.

## Défaut potentiel et recommandation

### BUG-007 — Un statut absent est compté comme une entreprise cessée

Avec une page contenant une entreprise sans statut administratif, le panneau incrémente actuellement **« cessée(s) »**. L’exploration montre que le compteur est obtenu en soustrayant les entreprises actives du nombre affiché ; toute valeur autre que `A`, y compris une absence, est donc classée comme cessation.

Ce comportement présente une information métier non fournie et contredit `AC-02` et `AC-08`. Le résultat attendu est de compter comme cessées uniquement les entreprises dont le statut vaut explicitement `C`, sans imposer ici l’ajout d’un nouvel indicateur pour les statuts inconnus.

Documenter `BUG-007` avant l’implémentation de `TC-STATS-006`. Tant que le défaut reste ouvert, le futur test doit conserver l’attendu correct derrière `test.fixme`. Aucune correction du produit n’est incluse dans ce plan.

## Fichiers probablement concernés par l’implémentation future

- `tests/ui/specs/stats/stats-mocked.spec.ts` à créer pour les six scénarios ;
- `tests/ui/pages/search.page.ts` à enrichir minimalement avec le locator `data-testid="results-stats"` et, si utile, des locators de blocs statistiques scopés ;
- `tests/mocks/stats-results.ts` à créer si les mocks existants ne portent pas lisiblement toutes les partitions nécessaires ;
- aucun fichier sous `tests/api/` et aucun test réel supplémentaire.

# US-SORT-01 — Trier les résultats

## User Story

**En tant qu’utilisateur,**
je souhaite trier les résultats d’une recherche selon différents critères,
**afin d’organiser les entreprises affichées selon l’information qui m’intéresse le plus.**

## Priorité métier

**Moyenne à haute**

Le tri améliore directement l’exploitation d’une liste de résultats, notamment lorsqu’une recherche retourne plusieurs entreprises.

---

## Périmètre

Cette User Story couvre :

- l’affichage des options de tri proposées par l’interface ;
- le tri par pertinence ;
- le tri par nom ;
- le tri par date de création ;
- le tri par statut administratif ;
- le changement d’ordre visible des cartes après sélection d’un tri ;
- la conservation de l’ensemble des résultats reçus ;
- la cohérence entre le critère sélectionné et l’ordre affiché ;
- le comportement du tri après le chargement de nouveaux résultats ;
- la gestion déterministe des valeurs manquantes lorsque le tri les rencontre.

Cette User Story ne couvre pas :

- les règles de recherche texte ;
- les règles métier des filtres ;
- la pagination elle-même ;
- la taille de page ;
- les favoris ;
- la comparaison ;
- le détail d’une entreprise ;
- l’historique ;
- les recherches sauvegardées ;
- l’export ;
- le deep linking complet ;
- la sémantique métier interne de la pertinence calculée par l’API.

---

# Critères d’acceptation

## AC-01 — Proposer les critères de tri disponibles

**Étant donné** qu’une recherche retourne plusieurs entreprises,
**lorsque** les résultats sont affichés,
**alors** l’utilisateur peut sélectionner les critères de tri proposés par l’application.

Les critères proposés doivent correspondre aux fonctionnalités réellement disponibles dans l’interface.

---

## AC-02 — Trier par pertinence

**Étant donné** que des résultats ont été reçus dans un ordre déterminé,
**lorsque** l’utilisateur sélectionne le tri par pertinence,
**alors** l’application affiche les résultats selon l’ordre de pertinence fourni par la recherche.

Le frontend ne doit pas inventer un score de pertinence différent de celui implicite dans l’ordre reçu.

---

## AC-03 — Trier par nom

**Étant donné** que plusieurs entreprises possèdent des noms différents,
**lorsque** l’utilisateur sélectionne le tri par nom,
**alors** les cartes sont réorganisées selon le nom des entreprises conformément à la règle de tri implémentée par l’application.

Le tri doit être déterministe pour un même jeu de données.

---

## AC-04 — Trier par date de création

**Étant donné** que plusieurs entreprises possèdent des dates de création différentes,
**lorsque** l’utilisateur sélectionne le tri par date de création,
**alors** les cartes sont réorganisées selon la date de création conformément à la règle de tri implémentée par l’application.

Les valeurs manquantes doivent être traitées de manière cohérente et déterministe.

---

## AC-05 — Trier par statut administratif

**Étant donné** que les résultats contiennent plusieurs statuts administratifs,
**lorsque** l’utilisateur sélectionne le tri par statut,
**alors** les cartes sont réorganisées selon le statut administratif conformément à la règle de tri implémentée par l’application.

Le comportement doit rester déterministe pour un même jeu de données.

---

## AC-06 — Le tri ne doit pas supprimer ou dupliquer des résultats

**Étant donné** qu’un ensemble de résultats est affiché,
**lorsque** l’utilisateur change le critère de tri,
**alors** le même ensemble d’entreprises doit rester présent après le tri.

Le tri ne doit :

- ni supprimer une entreprise ;
- ni ajouter une entreprise inexistante ;
- ni dupliquer une carte.

Seul l’ordre d’affichage doit changer.

---

## AC-07 — Changer de tri doit réordonner les résultats déjà chargés

**Étant donné** que les résultats d’une recherche sont déjà présents,
**lorsque** l’utilisateur change le critère de tri,
**alors** l’application réordonne les résultats côté frontend sans dépendre d’une nouvelle réponse API si le comportement prévu est local.

Une requête réseau ne doit pas être ajoutée uniquement pour effectuer un tri client.

---

## AC-08 — Le tri sélectionné s’applique aux nouveaux résultats

**Étant donné** qu’un critère de tri est sélectionné,
**lorsqu’une nouvelle recherche ou une nouvelle page de résultats est chargée,**
**alors** le critère de tri courant doit être appliqué au nouvel ensemble de résultats conformément au comportement défini par l’application.

L’ordre précédent ne doit pas être conservé artificiellement sur un nouvel ensemble de données.

---

## AC-09 — Cohérence entre contrôle de tri et ordre affiché

**Étant donné** qu’un critère de tri est actif,
**lorsque** les résultats sont affichés ou réaffichés,
**alors** la valeur visible dans le contrôle de tri doit correspondre à l’ordre réellement appliqué.

---

# Risques fonctionnels

Les principaux risques sont :

- le contrôle de tri affiche une valeur sans modifier l’ordre des cartes ;
- le frontend envoie inutilement une nouvelle requête API lors d’un tri local ;
- le tri par pertinence ne restaure pas l’ordre reçu initialement ;
- le tri par nom utilise une règle différente selon les données ;
- le tri par date se comporte de manière incohérente lorsque la date est absente ;
- le tri par statut produit un ordre instable ;
- certaines cartes disparaissent ou sont dupliquées lors d’un changement de tri ;
- un tri sélectionné cesse de s’appliquer après une nouvelle recherche ou un changement de page ;
- le contrôle de tri et l’ordre réellement visible deviennent incohérents ;
- les tests deviennent fragiles en utilisant des entreprises publiques réelles dont les données peuvent évoluer.

---

# Stratégie de couverture initiale

Le tri étant réalisé côté frontend, la couverture doit privilégier `UI_MOCKED`.

Les réponses mockées doivent utiliser de petites collections synthétiques spécialement conçues pour produire des ordres distincts selon :

- la pertinence ;
- le nom ;
- la date de création ;
- le statut administratif.

Les données doivent permettre de vérifier l’ordre exact des cartes sans dépendre de données publiques volatiles.

Aucun test `API` supplémentaire ne doit être ajouté uniquement pour vérifier le tri frontend.

Un `E2E_REAL` ne doit pas être ajouté automatiquement.

Le Planner doit seulement proposer un nouvel `E2E_REAL` s’il identifie un risque d’intégration spécifique au tri qui ne peut pas être prouvé avec les tests existants et des réponses UI mockées.

---

# Principes de conception des tests

Le Planner doit :

- tester le tri au niveau le plus bas donnant suffisamment de confiance ;
- privilégier `UI_MOCKED` pour les comportements de tri client ;
- utiliser des entreprises synthétiques dont l’ordre initial est volontairement différent de l’ordre alphabétique, chronologique et administratif ;
- vérifier l’ordre visible des cartes, pas uniquement la valeur du contrôle de tri ;
- vérifier l’intégrité de l’ensemble avant et après tri ;
- éviter un test distinct pour chaque micro-variante si plusieurs partitions peuvent répondre à une même question fonctionnelle ;
- distinguer la restauration de la pertinence d’un nouveau tri calculé ;
- examiner explicitement le comportement des valeurs manquantes ;
- ne pas ajouter d’assertion métier non définie par le comportement réellement observé ;
- ne pas dépendre de noms, dates ou statuts issus de données publiques réelles ;
- ne pas utiliser `waitForTimeout` ;
- utiliser les mécanismes d’auto-waiting et les événements observables de Playwright ;
- conserver une question principale claire par cas de test.

---

# Attendus pour le Planner Playwright

Le Planner doit d’abord explorer l’application réelle avant de figer le plan de test.

Il doit notamment déterminer :

1. les options exactes proposées par le contrôle de tri ;
2. la valeur de tri sélectionnée par défaut ;
3. la règle exacte utilisée pour le tri par pertinence ;
4. la règle exacte utilisée pour le tri par nom ;
5. la direction du tri par nom ;
6. la règle exacte utilisée pour la date de création ;
7. la direction du tri par date ;
8. le comportement lorsqu’une date de création est absente ;
9. la règle exacte utilisée pour le statut administratif ;
10. l’ordre appliqué entre les différents statuts ;
11. si un changement de tri déclenche ou non une nouvelle requête API ;
12. si le tri modifie uniquement l’ordre ou également l’ensemble des résultats ;
13. si le tri sélectionné reste actif après une nouvelle recherche ;
14. si le tri sélectionné reste actif après un changement de page ;
15. si le comportement observé contredit l’un des critères d’acceptation.

Le Planner doit éviter de supposer qu’un tri est ascendant ou descendant avant de l’avoir observé.

Il doit également distinguer :

- l’ordre brut reçu depuis l’API ;
- l’ordre affiché avec le tri par pertinence ;
- les ordres recalculés côté frontend.

---

# Conception des données mockées attendue

Le Planner doit prévoir un petit jeu de données synthétiques permettant d’obtenir des ordres clairement différents.

Par exemple, le jeu doit pouvoir contenir :

- des noms dont l’ordre alphabétique diffère de l’ordre de la réponse ;
- des dates de création anciennes et récentes ;
- au moins deux statuts administratifs ;
- éventuellement une valeur de date absente si le comportement doit être couvert.

Les noms et identifiants doivent être synthétiques.

Les données ne doivent pas être choisies uniquement pour faire passer l’implémentation actuelle : elles doivent permettre de détecter une vraie régression de l’algorithme de tri.

---

# Attendus des cas de test

À partir de l’exploration, dérive des cas :

`TC-SORT-xxx`

Pour chaque cas, indique :

- identifiant ;
- question principale ;
- objectif ;
- AC couvert(s) ;
- préconditions ;
- étapes essentielles ;
- résultat attendu ;
- niveau `API`, `UI_MOCKED` ou `E2E_REAL` ;
- priorité ;
- justification du niveau.

Le Planner doit rechercher un plan compact.

Il peut regrouper plusieurs critères de tri dans un même TC lorsqu’ils répondent réellement à la même question et que les partitions restent lisibles.

Il doit néanmoins isoler un comportement lorsque son risque ou sa mécanique est suffisamment différent, par exemple :

- restauration de l’ordre de pertinence ;
- intégrité de l’ensemble ;
- maintien du tri lors du chargement de nouveaux résultats ;
- valeur manquante créant une règle spécifique.

---

# Traçabilité

Produis une matrice finale :

`TC → AC → niveau → priorité`

Termine par :

- les critères entièrement couverts ;
- les éventuels trous de couverture ;
- les doublons volontairement évités ;
- les scénarios volontairement non automatisés ;
- les éventuelles anomalies observées ;
- les comportements dont la spécification reste ambiguë ;
- la justification explicite de la présence ou de l’absence de tests `API` supplémentaires ;
- la justification explicite de la présence ou de l’absence d’un nouvel `E2E_REAL`.

Ne génère aucun code Playwright pendant cette étape.

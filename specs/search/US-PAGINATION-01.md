# US-PAGINATION-01 — Parcourir les pages de résultats

## User Story

**En tant qu’utilisateur,**
je souhaite parcourir les différentes pages d’une recherche et choisir le nombre de résultats affichés par page,
**afin de consulter progressivement l’ensemble des entreprises correspondant à mes critères.**

## Priorité métier

**Haute**

Une recherche peut retourner un nombre important d’entreprises. La pagination permet de consulter les résultats sans charger ni afficher l’ensemble de la collection en une seule fois.

---

## Périmètre

Cette User Story couvre :

- la pagination des résultats de recherche ;
- le passage à la page suivante ;
- le retour à la page précédente ;
- la transmission du numéro de page à l’API ;
- le choix du nombre de résultats par page ;
- la transmission de `per_page` à l’API ;
- le remplacement des résultats lors d’un changement de page ;
- la cohérence de l’état de pagination affiché ;
- le comportement aux limites de la pagination ;
- la remise à la première page lorsqu’un changement de critère rend la page courante obsolète.

Cette User Story ne couvre pas :

- les règles métier des filtres ;
- le tri des résultats ;
- les favoris ;
- la comparaison ;
- l’historique ;
- les recherches sauvegardées ;
- le détail d’une entreprise ;
- le deep linking complet et la restauration d’une recherche depuis une URL.

---

# Critères d’acceptation

## AC-01 — Afficher l’état de pagination

**Étant donné** qu’une recherche retourne plusieurs pages de résultats,
**lorsque** les résultats sont affichés,
**alors** l’utilisateur peut identifier la page actuellement consultée et naviguer vers les pages disponibles.

---

## AC-02 — Passer à la page suivante

**Étant donné** qu’une page suivante existe,
**lorsque** l’utilisateur demande à la consulter,
**alors** l’application effectue une nouvelle recherche avec le numéro de page correspondant
**et** affiche les résultats retournés pour cette page.

Les résultats de la page précédente ne doivent pas rester affichés comme s’ils appartenaient à la nouvelle page.

---

## AC-03 — Revenir à la page précédente

**Étant donné** que l’utilisateur consulte une page supérieure à la première,
**lorsqu’il demande à revenir à la page précédente,**
**alors** l’application effectue une recherche avec le numéro de page précédent
**et** affiche les résultats correspondants.

---

## AC-04 — Respecter les limites de pagination

**Étant donné** que l’utilisateur consulte la première ou la dernière page disponible,
**alors** l’interface ne doit pas permettre une navigation vers une page inexistante.

La pagination affichée doit rester cohérente avec les informations retournées par la recherche.

---

## AC-05 — Choisir le nombre de résultats par page

**Étant donné** qu’une recherche est affichée,
**lorsque** l’utilisateur choisit une autre taille de page proposée par l’interface,
**alors** la valeur correspondante est transmise à l’API via le paramètre `per_page`
**et** les résultats affichés correspondent à la nouvelle réponse.

---

## AC-06 — Revenir à la première page après un changement de taille de page

**Étant donné** que l’utilisateur consulte une page supérieure à la première,
**lorsqu’il modifie le nombre de résultats par page,**
**alors** la recherche repart de la première page afin d’éviter de conserver une position de pagination devenue incohérente.

---

## AC-07 — Revenir à la première page après une nouvelle recherche ou une modification des critères

**Étant donné** que l’utilisateur consulte une page supérieure à la première,
**lorsqu’il lance une nouvelle recherche ou modifie les critères qui déterminent les résultats,**
**alors** la recherche repart de la première page.

Les résultats et l’état de pagination doivent correspondre à cette nouvelle recherche.

---

## AC-08 — Cohérence entre requête et résultats affichés

**Étant donné** qu’un changement de page ou de taille déclenche une nouvelle requête,
**lorsque** l’API retourne sa réponse,
**alors** l’interface affiche les résultats associés à cette réponse
**et** son état de pagination correspond aux informations de pagination disponibles.

---

# Risques fonctionnels

Les principaux risques sont :

- le bouton suivant modifie l’interface sans modifier le paramètre `page` envoyé à l’API ;
- le bouton précédent envoie un mauvais numéro de page ;
- des résultats de deux pages différentes restent affichés simultanément ;
- l’interface permet de dépasser la dernière page ;
- l’interface permet de revenir avant la première page ;
- `per_page` n’est pas transmis ou utilise une valeur différente de celle sélectionnée ;
- un changement de taille conserve une page qui n’est plus pertinente ;
- une nouvelle recherche conserve accidentellement l’ancien numéro de page ;
- l’état visuel de pagination ne correspond plus à la réponse traitée ;
- les tests deviennent fragiles en dépendant d’un total réel ou d’entreprises publiques précises.

---

# Stratégie de couverture initiale

Les règles du backend concernant `page` et `per_page` doivent être vérifiées au niveau `API` lorsque cela apporte une preuve métier utile.

Les responsabilités propres au frontend doivent être couvertes principalement en `UI_MOCKED`, notamment :

- construction des requêtes ;
- navigation suivante/précédente ;
- remplacement des résultats ;
- état visuel de pagination ;
- limites première/dernière page ;
- changement de taille ;
- réinitialisation de la page.

Les mocks doivent fournir explicitement les métadonnées de pagination nécessaires afin que les scénarios soient déterministes.

Un nouvel `E2E_REAL` ne doit pas être ajouté automatiquement. `TC-SEARCH-010` couvre déjà la jointure générale application ↔ API. Le Planner doit uniquement proposer un nouvel E2E s’il identifie pendant son exploration un risque d’intégration spécifique à la pagination qui ne peut pas être couvert avec suffisamment de confiance par API + UI mockée.

---

# Principes de conception des tests

Le Planner doit :

- tester chaque comportement au niveau le plus bas donnant suffisamment de confiance ;
- distinguer la pagination assurée par l’API de la logique d’interface ;
- éviter de vérifier le même comportement aux niveaux API, UI mockée et E2E réel sans justification ;
- ne dépendre d’aucune entreprise publique précise ;
- ne dépendre d’aucun total exact supposé stable ;
- utiliser de petites tailles de page dans les tests API lorsque cela facilite la comparaison entre pages ;
- éviter de conclure qu’une pagination fonctionne uniquement parce qu’une réponse HTTP 200 est reçue ;
- utiliser des réponses mockées distinctes pour prouver le remplacement des résultats entre deux pages ;
- ne pas utiliser `waitForTimeout` ;
- synchroniser les tests sur des événements observables ;
- conserver une question principale identifiable par cas de test.

---

# Attendus pour le Planner Playwright

Le Planner doit d’abord explorer le comportement réel de l’application avant de finaliser le plan.

Il doit notamment déterminer :

1. les métadonnées de pagination réellement retournées par l’API ;
2. la manière dont l’application calcule le nombre de pages ;
3. les contrôles réellement proposés pour naviguer ;
4. les valeurs réellement proposées pour le nombre de résultats par page ;
5. les paramètres réseau envoyés lors d’un changement de page ;
6. le comportement exact lors du passage page suivante / précédente ;
7. le comportement aux première et dernière pages ;
8. ce qui se passe lorsqu’on change `per_page` depuis une page supérieure à 1 ;
9. ce qui se passe lorsqu’on modifie une recherche ou un filtre depuis une page supérieure à 1 ;
10. si les anciens résultats sont correctement remplacés ;
11. si un comportement observé contredit l’un des critères d’acceptation.

À partir de cette exploration, dérive des cas `TC-PAGINATION-xxx`.

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

Produis ensuite une matrice :

`TC → AC → niveau → priorité`

Termine par :

- les critères entièrement couverts ;
- les éventuels trous de couverture ;
- les doublons volontairement évités ;
- les scénarios volontairement non automatisés ;
- les éventuelles anomalies observées ;
- la justification explicite de la présence ou de l’absence d’un nouvel `E2E_REAL`.

Ne génère aucun code Playwright pendant cette étape.

# US-FILTERS-01 — Filtrer les entreprises recherchées

## User Story

**En tant qu’utilisateur,**
je souhaite affiner une recherche d’entreprises à l’aide de filtres,
**afin de limiter les résultats aux entreprises correspondant à mes critères géographiques ou administratifs.**

## Priorité métier

**Haute**

Les filtres permettent de réduire une liste de résultats potentiellement importante et constituent une fonctionnalité centrale de l’exploration des entreprises.

---

## Périmètre

Cette User Story couvre :

- le filtre par code postal ;
- le filtre par commune ;
- le filtre par état administratif ;
- la combinaison de plusieurs filtres ;
- la transmission correcte des filtres à l’API ;
- la restitution des résultats filtrés ;
- la conservation des critères de recherche visibles dans l’interface ;
- le comportement lorsqu’aucun résultat ne correspond aux filtres.

Cette User Story ne couvre pas :

- le tri des résultats ;
- la pagination ;
- le changement du nombre de résultats par page ;
- les favoris ;
- la comparaison ;
- l’historique ;
- les recherches sauvegardées ;
- le détail d’une entreprise.

Ces fonctionnalités feront l’objet de User Stories dédiées.

---

# Critères d’acceptation

## AC-01 — Filtrer par code postal

**Étant donné** qu’un utilisateur effectue une recherche valide,
**lorsqu’il renseigne un code postal**,
**alors** ce code postal est transmis à l’API comme critère de filtrage
**et** les résultats affichés correspondent à la réponse retournée pour ce filtre.

---

## AC-02 — Filtrer par commune

**Étant donné** qu’un utilisateur effectue une recherche valide,
**lorsqu’il renseigne une commune**,
**alors** la commune est transmise à l’API comme critère de filtrage
**et** les résultats affichés correspondent à la réponse retournée pour ce filtre.

---

## AC-03 — Filtrer par état administratif

**Étant donné** qu’un utilisateur effectue une recherche valide,
**lorsqu’il sélectionne un état administratif**,
**alors** cet état est transmis à l’API comme critère de filtrage
**et** les résultats affichés correspondent à la réponse retournée pour cet état.

Les états proposés par l’application sont notamment :

- entreprise active ;
- entreprise cessée.

---

## AC-04 — Combiner plusieurs filtres

**Étant donné** qu’un utilisateur effectue une recherche valide,
**lorsqu’il renseigne plusieurs filtres simultanément**,
**alors** l’ensemble des critères sélectionnés est transmis à l’API dans une même recherche
**et** les résultats affichés correspondent à la combinaison de ces critères.

---

## AC-05 — Les filtres restent visibles après la recherche

**Étant donné** qu’une recherche filtrée est exécutée,
**lorsque** les résultats sont affichés,
**alors** l’utilisateur peut toujours identifier les critères de filtrage actuellement appliqués.

Les valeurs renseignées ou sélectionnées ne doivent pas être perdues lors de l’affichage des résultats.

---

## AC-06 — Aucun résultat avec filtres

**Étant donné** une recherche valide accompagnée de filtres,
**lorsque** l’API retourne zéro résultat,
**alors** l’application affiche explicitement un état « aucun résultat »
**et** cet état n’est pas présenté comme une erreur technique.

---

## AC-07 — Cohérence entre les filtres transmis et les résultats affichés

**Étant donné** qu’une recherche filtrée est exécutée,
**lorsque** l’API retourne des entreprises,
**alors** l’interface affiche les entreprises issues de cette réponse
**sans modifier silencieusement les critères envoyés à l’API.**

La validation détaillée des règles métier de filtrage appartient principalement aux tests API.

---

# Risques fonctionnels

Les principaux risques associés à cette fonctionnalité sont :

- un filtre visible dans l’interface mais non transmis à l’API ;
- un mauvais paramètre API utilisé pour un filtre ;
- une valeur transformée ou perdue avant l’appel API ;
- plusieurs filtres qui ne sont pas combinés correctement ;
- un filtre conservé visuellement mais absent de la requête ;
- des résultats d’une recherche précédente restant affichés après une nouvelle recherche filtrée ;
- un état vide interprété comme une erreur ;
- une duplication excessive des mêmes règles entre tests API et tests navigateur.

---

# Stratégie de couverture initiale

| Critère | Niveau principal envisagé | Intention                                                                             |
| ------- | ------------------------- | ------------------------------------------------------------------------------------- |
| AC-01   | API + UI_MOCKED           | Vérifier le comportement réel du paramètre code postal et sa transmission depuis l’UI |
| AC-02   | API + UI_MOCKED           | Vérifier le comportement réel du paramètre commune et sa transmission depuis l’UI     |
| AC-03   | API + UI_MOCKED           | Vérifier le comportement réel du statut administratif et sa transmission depuis l’UI  |
| AC-04   | API + UI_MOCKED           | Vérifier la combinaison de plusieurs critères sans ajouter d’E2E redondant            |
| AC-05   | UI_MOCKED                 | Vérifier la conservation et la visibilité des critères appliqués                      |
| AC-06   | UI_MOCKED                 | Vérifier l’état vide de manière déterministe                                          |
| AC-07   | API principalement        | Vérifier les règles de filtrage au niveau le moins coûteux                            |

---

# Principes de conception des tests

Le Planner doit respecter les principes suivants :

- tester chaque règle au niveau le plus bas permettant de la valider avec confiance ;
- privilégier l’API réelle pour vérifier que les paramètres de filtre sont acceptés et produisent une réponse cohérente ;
- utiliser les tests UI mockés pour vérifier que l’interface construit correctement les requêtes et affiche les états attendus ;
- ne pas dupliquer automatiquement chaque filtre dans un test E2E réel ;
- considérer l’E2E réel existant de `US-SEARCH-01` comme couverture d’intégration application ↔ API tant qu’aucun risque spécifique aux filtres ne justifie un nouvel E2E ;
- ne jamais modifier ou préparer de données via l’API publique, celle-ci étant utilisée en lecture seule ;
- éviter toute assertion reposant sur une entreprise publique précise ou sur un nombre de résultats stable ;
- préférer des invariants et des propriétés de réponse ;
- utiliser des mocks minimaux et déterministes pour les tests frontend ;
- une règle métier importante doit avoir une couverture identifiable mais ne doit pas être répétée inutilement aux niveaux API, UI mockée et E2E réel.

---

# Attendus pour le Planner Playwright

À partir de cette User Story, le Planner doit :

1. lire les critères d’acceptation avant d’explorer l’application ;
2. explorer le comportement réel des filtres ;
3. identifier les paramètres réseau réellement utilisés pour :

   - le code postal ;
   - la commune ;
   - l’état administratif ;

4. vérifier comment plusieurs filtres sont combinés dans la requête ;
5. vérifier comment les filtres actifs sont représentés dans l’interface ;
6. dériver des cas de test traçables vers les critères d’acceptation ;
7. attribuer à chaque cas un niveau :

   - `API`
   - `UI_MOCKED`
   - `E2E_REAL`

8. limiter les doublons entre niveaux ;
9. expliquer explicitement si aucun nouvel `E2E_REAL` n’est nécessaire ;
10. produire une matrice de couverture `TC → AC → niveau → priorité` ;
11. signaler tout comportement observé qui contredit les critères d’acceptation ;
12. ne produire aucun code de test pendant cette étape.

## Format attendu pour chaque cas de test

Chaque cas proposé doit préciser au minimum :

- identifiant du cas de test ;
- objectif ;
- critère(s) d’acceptation couvert(s) ;
- préconditions ;
- étapes essentielles ;
- résultat attendu ;
- niveau de test ;
- priorité ;
- justification du niveau choisi.

Le Planner doit viser une suite petite, lisible, maintenable et fondée sur le risque plutôt qu’une couverture exhaustive de toutes les combinaisons possibles.

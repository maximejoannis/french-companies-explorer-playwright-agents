# US-SAVED-SEARCH-01 — Sauvegarder et réutiliser une recherche

## User Story

En tant qu’utilisateur,

je souhaite sauvegarder volontairement une recherche sous un nom identifiable,

afin de pouvoir la retrouver et la relancer ultérieurement avec ses critères.

## Priorité métier

Moyenne.

Les recherches sauvegardées améliorent la réutilisation de recherches fréquentes mais ne conditionnent pas l’accès à la recherche principale.

---

## Périmètre

Cette User Story couvre :

- la création explicite d’une recherche sauvegardée ;
- le nom donné par l’utilisateur ;
- les critères effectivement conservés ;
- l’identité des recherches sauvegardées et les éventuelles règles de doublon ;
- l’affichage des recherches sauvegardées ;
- leur persistance locale ;
- la restauration et la relance d’une recherche sauvegardée ;
- la taille de page si elle fait partie du contrat réellement persisté ;
- la suppression individuelle ;
- l’état vide ;
- l’isolation entre recherches sauvegardées et historique.

Cette User Story ne couvre pas :

- le contrat métier de l’API publique ;
- la validité métier des entreprises retournées ;
- le contrat exhaustif des paramètres `/search` déjà couvert ailleurs ;
- l’historique automatique des recherches ;
- les favoris ;
- la comparaison ;
- les statistiques ;
- les exports ;
- le deep linking.

---

## AC-01 — Sauvegarder explicitement la recherche courante

Une recherche sauvegardée ne doit être créée qu’à la suite de l’action explicite prévue par le produit.

Le Planner doit déterminer :

- depuis quelle surface la sauvegarde est disponible ;
- les préconditions éventuelles ;
- le parcours exact ;
- le comportement lorsque le nom est absent ou invalide.

## AC-02 — Conserver le nom de la recherche

Le nom saisi par l’utilisateur doit permettre d’identifier la recherche sauvegardée lors de sa consultation ultérieure.

Le Planner doit déterminer les règles réellement observables concernant le nom sans inventer de contrainte métier non exposée par le produit.

## AC-03 — Conserver les critères de recherche

Une recherche sauvegardée doit conserver les critères supportés par le produit afin qu’ils puissent être restaurés lors d’une réutilisation.

Le Planner doit déterminer précisément les critères persistés.

Les assertions ne doivent pas redoubler inutilement les contrats Recherche et Filtres.

## AC-04 — Conserver la taille de page si elle appartient au contrat Saved Searches

Si la taille de page est persistée par une recherche sauvegardée, elle doit être restaurée avec cette recherche.

Cette préférence doit rester distincte de la pagination courante et de l’historique automatique.

## AC-05 — Gérer les recherches sauvegardées distinctes

Plusieurs recherches sauvegardées doivent rester correctement associées à leur nom et à leurs propres critères.

Le Planner doit explorer les règles observées concernant :

- noms identiques ;
- critères identiques ;
- noms différents avec critères identiques ;
- même nom avec critères différents.

Aucune règle de déduplication ne doit être inventée avant exploration.

## AC-06 — Afficher les recherches sauvegardées

La vue correspondante doit présenter les recherches sauvegardées de façon suffisamment identifiable pour permettre à l’utilisateur de choisir celle qu’il souhaite relancer ou supprimer.

Le Planner doit déterminer :

- les informations visibles ;
- l’ordre ;
- les actions disponibles ;
- les noms accessibles des contrôles.

## AC-07 — Relancer la recherche choisie

L’action de relance doit restaurer les critères appartenant à la recherche sauvegardée choisie et déclencher la recherche selon le comportement réel du produit.

La restauration ne doit pas mélanger les critères de deux recherches sauvegardées différentes.

Un GET `/search` est légitime si `Lancer` déclenche effectivement une nouvelle recherche.

## AC-08 — Persister les recherches sauvegardées

Les recherches sauvegardées doivent survivre à un vrai rechargement dans le même contexte navigateur si le produit les conserve dans un stockage persistant.

Le Planner doit identifier la clé et le schéma minimal utiles.

## AC-09 — Supprimer uniquement la recherche choisie

Si le produit propose une suppression individuelle, l’action doit supprimer uniquement la recherche ciblée.

Les autres recherches sauvegardées doivent rester présentes.

L’historique automatique ne doit pas être supprimé par cette action.

## AC-10 — Gérer l’état vide

En l’absence de recherche sauvegardée, la surface doit présenter un état vide cohérent, sans donnée obsolète ni représentation technique.

Une clé absente et une collection vide peuvent constituer deux partitions du même comportement si le produit les traite de façon équivalente.

## AC-11 — Isoler Saved Searches de History

Les recherches sauvegardées et l’historique automatique doivent conserver leurs responsabilités et leurs stockages respectifs.

Une action propre à Saved Searches ne doit pas supprimer ou modifier involontairement les entrées History.

## AC-12 — Ne pas effectuer d’écriture vers l’API publique

La création, la consultation, la persistance et la suppression d’une recherche sauvegardée sont des opérations frontend/locales et ne doivent produire aucun `POST`, `PUT`, `PATCH` ou `DELETE` vers l’API publique.

Les GET nécessaires à l’exécution ou à la relance réelle d’une recherche restent légitimes.

---

## Risques fonctionnels

- recherche sauvegardée sans action explicite ;
- mauvais nom associé aux critères ;
- perte d’un critère ;
- mélange de deux recherches sauvegardées ;
- taille de page non restaurée ;
- règle de doublon incorrecte ;
- mauvaise entrée relancée ;
- mauvaise entrée supprimée ;
- suppression de plusieurs entrées ;
- perte après reload ;
- confusion entre `fce_saved` et `fce_history`;
- requête API déclenchée par une opération purement locale.

---

## Stratégie de couverture attendue

Privilégier `UI_MOCKED`.

Saved Searches est principalement une responsabilité frontend et de persistance locale.

Aucun test API ne doit être ajouté sans découverte d’un véritable contrat backend propre à cette fonctionnalité.

Un `E2E_REAL` ne doit être ajouté que s’il prouve une frontière d’intégration nouvelle qui n’est pas déjà couverte par Recherche ou Filtres.

Les données publiques réelles ne doivent pas servir d’oracle pour les règles Saved Searches.

---

## Principes de conception

- une question fonctionnelle principale par TC ;
- créer les recherches sauvegardées via l’interface lorsque le scénario valide le parcours réel de création ;
- utiliser `localStorage` comme oracle complémentaire, pas comme substitut systématique à l’UI ;
- ne contractualiser que le schéma persistant nécessaire ;
- utiliser au moins deux recherches incompatibles pour détecter les mélanges de critères ;
- distinguer les opérations locales des GET légitimes de relance ;
- ne pas inventer de règle concernant les doublons, les noms ou les limites avant exploration ;
- ne pas injecter des structures de stockage impossibles uniquement pour fabriquer un edge case ;
- ne pas dépendre de données publiques volatiles ;
- ne pas utiliser `waitForTimeout` ;
- ne pas utiliser `networkidle` ;
- ne pas transformer un comportement observé incorrect en oracle afin d’obtenir un test vert.

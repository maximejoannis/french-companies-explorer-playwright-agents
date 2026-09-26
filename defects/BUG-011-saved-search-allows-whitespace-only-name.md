# BUG-011 — Une recherche sauvegardée accepte un nom composé uniquement d’espaces

## Statut

Open

## Sévérité

Minor

## Priorité

Medium

## Feature

Saved Searches

## User Story

`US-SAVED-SEARCH-01`

## Critères concernés

- `AC-01`
- `AC-02`

## Observation

Lorsqu’une recherche éligible est sauvegardée, le produit demande un nom via le dialogue :

`Nom de la recherche sauvegardée :`

Une chaîne vide ne crée pas de sauvegarde.

En revanche, une valeur composée uniquement d’espaces, par exemple trois espaces, est acceptée et crée une entrée dans `fce_saved`.

Le nom devient alors visuellement vide dans la liste des recherches sauvegardées.

## Comportement attendu

Un nom ne contenant aucun caractère significatif après prise en compte des espaces ne doit pas permettre de créer ou de mettre à jour une recherche sauvegardée.

Le produit doit conserver la collection `fce_saved` inchangée dans ce cas.

Cette attente n’impose pas de politique générale de normalisation des espaces autour d’un nom valide.

## Impact

L’utilisateur peut créer une recherche sauvegardée dont le nom ne permet pas de l’identifier visuellement.

Plusieurs entrées peuvent ainsi devenir difficiles à distinguer dans la section `RECHERCHES SAUVEGARDÉES`.

## Couverture automatisée prévue

`TC-SAVED-008 — Refuser un nom composé uniquement d’espaces`

Niveau :

`UI_MOCKED`

Le test conserve l’oracle fonctionnel correct et doit rester derrière `test.fixme` tant que le défaut est ouvert.

Les autres validations de création doivent rester couvertes par `TC-SAVED-001` actif.

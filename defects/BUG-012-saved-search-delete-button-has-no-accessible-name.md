# BUG-012 — Le bouton de suppression d’une recherche sauvegardée n’a pas de nom accessible explicite

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

- `AC-06`
- `AC-09`

## Observation

Chaque recherche sauvegardée possède un bouton de suppression.

Le contrôle expose bien le rôle `button`, mais son nom accessible observable est uniquement :

`×`

Aucun `aria-label`, `title` utile ou autre nom accessible n’explique l’action ni n’identifie la recherche ciblée.

## Comportement attendu

Le contrôle de suppression doit exposer un nom accessible compréhensible permettant d’identifier :

- l’action de suppression ;
- suffisamment de contexte pour distinguer la recherche concernée lorsque plusieurs entrées sont présentes.

Par exemple, l’interface pourrait exposer un nom accessible équivalent à :

`Supprimer la recherche Nom Alpha`

La formulation exacte n’est pas contractualisée ici.

## Impact

Une personne utilisant une technologie d’assistance ne peut pas comprendre clairement la fonction du bouton ni distinguer les boutons de suppression de plusieurs recherches sauvegardées.

Le comportement fonctionnel de suppression individuelle reste néanmoins testable en scopant le bouton dans l’article correspondant.

## Couverture automatisée

Le défaut est documenté comme problème d’accessibilité.

`TC-SAVED-006 — Supprimer uniquement la sauvegarde ciblée` reste actif et vérifie le comportement fonctionnel de suppression en utilisant un locator scopé dans l’article ciblé.

Aucun `test.fixme` fonctionnel n’est requis pour ce défaut tant que la suppression elle-même fonctionne correctement.

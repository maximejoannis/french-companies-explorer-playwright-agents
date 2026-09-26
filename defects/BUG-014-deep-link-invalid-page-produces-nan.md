# BUG-014 — Une page URL non numérique produit une recherche et une pagination NaN

## Statut

Open

## Sévérité

Major

## Priorité

High

## Feature

Deep Linking / restauration URL

## User Story

`US-DEEP-LINKING-01`

## Critères concernés

- `AC-01`
- `AC-03`
- `AC-09`
- `AC-10`
- `AC-12`

## Observation

Lorsqu’un deep link contient un paramètre `page` non numérique, l’application convertit directement sa valeur avec `Number()` sans vérifier que le résultat représente une page exploitable.

Par exemple :

`?q=Alpha&page=abc`

produit une valeur interne `NaN`.

Cette valeur est ensuite utilisée lors de la recherche et dans l’état de pagination.

## Exemple reproductible

1. Ouvrir directement l’application avec :

   `?q=Alpha&page=abc`

2. Laisser la recherche déclenchée par le deep link s’exécuter.

3. Inspecter la requête `/search`.

4. Inspecter l’URL après la réponse réussie.

5. Inspecter le libellé de pagination.

## Résultat actuel

Le comportement observable est incohérent :

- la requête `/search` contient `page=NaN` ;
- après une réponse réussie, l’URL canonique ne contient plus `page=abc` ;
- l’état interne de pagination conserve néanmoins la valeur `NaN` ;
- l’interface peut afficher un libellé de type `Page NaN / …`.

L’URL affichée, la requête réseau et l’état de pagination ne représentent donc plus le même état.

## Comportement attendu

Une valeur `page` non numérique ne doit jamais contaminer la requête réseau ou l’état frontend avec `NaN`.

Pour cette partition, la valeur invalide doit être ignorée ou normalisée vers la page par défaut `1`.

Le comportement attendu est donc :

- le GET `/search` utilise `page=1` ;
- la pagination frontend utilise la page `1` ;
- l’URL canonique ne conserve pas `page=abc` ;
- puisque la page `1` est la valeur par défaut, elle peut être omise de l’URL canonique ;
- aucune représentation `NaN` ne doit apparaître dans l’interface.

## Portée du défaut

Ce défaut contractualise uniquement la partition clairement invalide d’une valeur `page` non numérique.

Il ne définit pas de règle générale supplémentaire concernant :

- les pages négatives ;
- `page=0` ;
- les valeurs décimales ;
- les pages supérieures au nombre de pages disponible ;
- les autres valeurs numériques atypiques.

Ces comportements ne doivent pas être ajoutés à la couverture de `BUG-014` sans contrat produit distinct.

## Impact

Un deep link mal formé peut produire :

- une requête contenant une pagination invalide ;
- un état frontend incohérent ;
- un affichage technique `NaN` visible par l’utilisateur ;
- une divergence entre l’URL canonicalisée et l’état réellement conservé par l’application.

Le problème relève de la validation frontend du deep link.

Il ne constitue pas une règle métier de l’API gouvernementale.

## Couverture automatisée

`TC-DEEP-LINK-006 — Normaliser une page URL non numérique`

Niveau :

`UI_MOCKED`

Statut :

`test.fixme`

Le test doit conserver l’oracle fonctionnel correct :

- `page=abc` ne doit jamais devenir `page=NaN` dans le GET ;
- le GET attendu utilise `page=1` ;
- l’URL canonique ne contient plus la valeur invalide ;
- l’interface affiche la page `1` ;
- aucune représentation `NaN` n’est visible.

Tant que le comportement actuel persiste, le test reste en `test.fixme`.

Le test ne doit pas être rendu vert en acceptant `page=NaN` comme comportement attendu.

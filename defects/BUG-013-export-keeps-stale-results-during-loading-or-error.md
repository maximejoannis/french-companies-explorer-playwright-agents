# BUG-013 — L’export conserve les résultats précédents pendant un chargement ou après une erreur

## Statut

Open

## Sévérité

Major

## Priorité

High

## Feature

Export JSON / CSV

## User Story

`US-EXPORT-01`

## Critères concernés

- `AC-01`
- `AC-06`
- `AC-11`

## Observation

Après une première recherche réussie, l’application conserve la collection frontend correspondante dans `S.results`.

Lorsqu’une nouvelle recherche démarre :

- la grille de résultats est vidée ;
- l’interface passe dans un état de chargement ;
- les contrôles d’export restent disponibles ;
- l’ancienne valeur de `S.results` n’est pas immédiatement vidée.

Si l’utilisateur déclenche un export pendant que la nouvelle requête est encore en cours, le fichier peut donc contenir les résultats de la recherche précédente alors que ceux-ci ne sont plus présentés comme les résultats courants dans l’interface.

Le même état résiduel peut être observable lorsqu’une nouvelle recherche échoue avant qu’une nouvelle collection valide ne remplace `S.results`.

## Exemple reproductible

1. Exécuter une recherche Alpha retournant au moins un résultat.
2. Démarrer une recherche Bêta dont la réponse est volontairement différée.
3. Observer que les résultats Alpha disparaissent de la grille et que la nouvelle recherche est en chargement.
4. Déclencher un export avant la réponse Bêta.
5. Examiner le fichier téléchargé.

## Résultat actuel

Le fichier exporté peut encore contenir Alpha à partir de l’ancienne collection conservée dans `S.results`.

Le fichier ne représente donc pas l’état courant présenté à l’utilisateur.

## Comportement attendu

Pendant une nouvelle recherche, l’application ne doit jamais permettre d’exporter les résultats précédents comme s’ils correspondaient à l’état courant.

Plusieurs corrections frontend sont acceptables.

Par exemple :

- rendre temporairement les contrôles d’export indisponibles pendant le chargement ; ou
- conserver les contrôles disponibles mais faire en sorte que la collection exportable ne contienne plus les anciens résultats.

Le défaut ne contractualise pas une solution technique particulière.

Si un téléchargement reste possible pendant le chargement, son contenu ne doit pas contenir les résultats devenus obsolètes de la recherche précédente.

## Impact

L’utilisateur peut télécharger un fichier dont le contenu ne correspond pas à la recherche qu’il vient de lancer ni aux résultats actuellement présentés dans l’interface.

Cela peut conduire à réutiliser ou analyser des données en pensant qu’elles correspondent à la recherche courante alors qu’elles proviennent de la recherche précédente.

## Périmètre

Le défaut concerne la gestion frontend de la collection utilisée par les exports.

Il ne constitue pas une règle métier ni un défaut du backend gouvernemental.

Aucune hypothèse sur les règles métier de l’API publique n’est nécessaire pour reproduire ou vérifier ce problème.

## Couverture automatisée

`TC-EXPORT-006 — Ne pas exporter une collection précédente pendant une nouvelle recherche`

Niveau :

`UI_MOCKED`

Statut :

`test.fixme`

Le test doit conserver l’oracle fonctionnel correct.

Tant que le comportement actuel persiste, il ne doit pas être rendu vert en acceptant l’export des anciens résultats.

Lors d’une future correction du produit, le scénario devra être réévalué selon la solution UX retenue, notamment si les contrôles d’export deviennent indisponibles pendant le chargement.

La partition « après erreur » reste documentée dans ce défaut sans imposer un second test automatisé tant qu’elle provient de la même conservation de la collection précédente.

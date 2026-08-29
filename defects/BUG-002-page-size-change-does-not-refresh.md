# BUG-002 — Le changement de taille de page ne relance pas la recherche

## Statut

**Ouvert**

## Sévérité

**Majeure**

## Priorité

**Haute**

## Fonctionnalité concernée

Pagination des résultats et choix du nombre de résultats par page.

## User Story liée

`US-PAGINATION-01`

## Critères d’acceptation impactés

- `AC-05` — Choisir le nombre de résultats par page
- `AC-06` — Revenir à la première page après un changement de taille de page
- `AC-08` — Cohérence entre requête et résultats affichés

## Environnement

Application :

`https://maximejoannis.github.io/french-companies-explorer-qa/`

API :

`https://recherche-entreprises.api.gouv.fr/search`

Exploration réalisée le 29 août 2026.

## Préconditions

- L’application est accessible.
- L’utilisateur se trouve sur la vue Recherche.
- Une recherche comportant plusieurs pages a été exécutée.
- L’utilisateur consulte une page supérieure à la première.

## Étapes de reproduction

1. Ouvrir l’application et accéder à la vue Recherche.
2. Exécuter une recherche produisant plusieurs pages de résultats.
3. Utiliser « Suivant » pour atteindre une page supérieure à 1.
4. Dans le contrôle « Résultats / page », sélectionner une autre valeur parmi `10`, `20` ou `25`.
5. Observer les requêtes réseau, le libellé de pagination et les cartes affichées.
6. Soumettre ensuite explicitement le formulaire de recherche.

## Résultat observé

Le contrôle propose bien les valeurs `10`, `20` et `25`, mais le changement de sélection ne déclenche aucune nouvelle requête.

L’ancien numéro de page et les anciennes cartes restent affichés. La nouvelle taille sélectionnée n’est transmise via `per_page` et appliquée qu’après une soumission ultérieure du formulaire. Cette soumission repart alors en page 1.

## Résultat attendu

Dès que l’utilisateur choisit une nouvelle taille proposée :

- une nouvelle recherche doit être déclenchée avec la valeur sélectionnée dans `per_page` ;
- la requête doit repartir avec `page=1` ;
- les anciennes cartes doivent être remplacées par les résultats de cette nouvelle réponse ;
- le contrôle et le libellé de pagination doivent représenter la nouvelle taille et la première page recalculée.

Ce résultat reste celui défini par `AC-05`, `AC-06` et `AC-08` de `US-PAGINATION-01`.

## Analyse

Le contrôle de taille met à jour sa valeur dans le DOM, mais aucun traitement du changement ne déclenche immédiatement une recherche. L’état sélectionné, le numéro de page et les cartes ne représentent donc plus une même réponse API jusqu’à la prochaine soumission du formulaire.

Le défaut relève du frontend : il est reproductible avec une API mockée et ne dépend ni des données publiques ni de la sémantique de pagination du backend.

## Impact utilisateur

L’utilisateur peut croire que la nouvelle taille est déjà appliquée alors que les résultats et la pagination affichés correspondent toujours à l’ancienne requête. Depuis une page supérieure à 1, la position affichée peut en outre ne plus être cohérente avec la nouvelle taille sélectionnée.

## Couverture automatisée associée

Cas prévu :

`TC-PAGINATION-005 — Changement de taille depuis une page supérieure`

Niveau :

`UI_MOCKED`

Tant que le défaut est ouvert, le test automatisé doit conserver le comportement fonctionnel attendu tout en étant déclaré explicitement avec `test.fixme`. Après correction, le `fixme` devra être retiré afin que le cas devienne un test actif de non-régression.

## Critère de clôture

Le défaut pourra être considéré comme corrigé lorsque :

1. sélectionner `10`, `20` ou `25` déclenche immédiatement une nouvelle requête de recherche ;
2. cette requête contient la valeur sélectionnée dans `per_page` et `page=1` ;
3. les anciennes cartes sont remplacées par la nouvelle réponse ;
4. le libellé et les contrôles de pagination sont cohérents avec la nouvelle taille ;
5. `TC-PAGINATION-005` peut être exécuté sans `test.fixme` et passe avec succès.

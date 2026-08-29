# BUG-003 — Le tri Pertinence ne restaure pas l’ordre brut de la réponse

## Statut

**Ouvert**

## Sévérité

**Majeure**

## Priorité

**Haute**

## Fonctionnalité concernée

Tri local des résultats de recherche par pertinence.

## User Story liée

`US-SORT-01`

## Critères d’acceptation impactés

- `AC-02` — Trier par pertinence
- `AC-09` — Cohérence entre contrôle de tri et ordre affiché

## Environnement

Application :

`https://maximejoannis.github.io/french-companies-explorer-qa/`

API :

`https://recherche-entreprises.api.gouv.fr/search`

Exploration réalisée le 29 août 2026.

## Préconditions

- L’application est accessible.
- L’utilisateur se trouve sur la vue Recherche.
- Une recherche comportant plusieurs entreprises a été exécutée.
- L’ordre brut de la réponse diffère d’au moins un ordre calculé proposé par l’interface.

## Étapes de reproduction

1. Ouvrir l’application et accéder à la vue Recherche.
2. Exécuter une recherche et relever l’ordre initial des cartes avec `Pertinence`, sélectionné par défaut.
3. Choisir un tri calculé, par exemple `Nom A → Z`, et constater le nouvel ordre.
4. Sélectionner de nouveau `Pertinence`.
5. Observer le contrôle, les requêtes réseau et l’ordre des cartes.

## Résultat observé

Le contrôle affiche bien `Pertinence` et aucune nouvelle requête API n’est envoyée, conformément au caractère local du tri.

Cependant, les cartes restent dans le dernier ordre calculé. Elles ne retrouvent pas l’ordre brut de la réponse courante qui était visible avant l’application du tri par nom, date ou statut.

## Résultat attendu

Après application d’un autre tri, revenir à `Pertinence` doit :

- rester une opération locale et ne pas déclencher de requête API supplémentaire uniquement pour restaurer cet ordre ;
- restaurer exactement l’ordre brut de la réponse courante ;
- conserver exactement le même ensemble d’entreprises, sans ajout, suppression ni duplication ;
- afficher `Pertinence` dans le contrôle ;
- maintenir la cohérence entre le contrôle et l’ordre visible.

Ce résultat reste celui défini par `AC-02` et contribue à satisfaire `AC-09` de `US-SORT-01`.

## Analyse

Sur la version explorée, l’application trie le tableau courant en place et ne conserve pas de copie de l’ordre brut reçu. Sélectionner `Pertinence` revient ensuite à ne plus appliquer de comparateur, mais ne permet pas de reconstruire l’ordre d’origine déjà perdu.

Cette explication décrit l’implémentation observée ; elle ne constitue pas une règle métier attendue.

## Impact utilisateur

L’utilisateur peut sélectionner `Pertinence` sans retrouver l’ordre pertinent fourni par la recherche. Le contrôle et l’ordre réellement affiché deviennent alors incohérents, ce qui peut fausser l’interprétation des résultats.

## Couverture automatisée associée

Cas prévu :

`TC-SORT-005 — Restauration de l’ordre de pertinence`

Niveau :

`UI_MOCKED`

Tant que le défaut reste ouvert, le scénario automatisé complet doit être déclaré avec `test.fixme`. Il ne doit devenir ni un test vide, ni un placeholder, ni une assertion du comportement défectueux actuel.

Après correction, retirer `test.fixme` doit suffire pour réactiver immédiatement le test de non-régression.

## Pistes de correction

Sans préjuger de la solution produit retenue, des approches possibles consistent à :

- conserver une copie de l’ordre brut à chaque nouvelle réponse ;
- restaurer cette copie lorsque `Pertinence` est sélectionné ;
- reconstruire de manière équivalente l’ordre de référence de la réponse courante.

## Critère de clôture

Le défaut pourra être considéré comme corrigé lorsque :

1. une nouvelle réponse est initialement affichée dans son ordre brut avec `Pertinence` ;
2. après un tri par nom, date ou statut, sélectionner `Pertinence` restaure exactement cet ordre brut ;
3. aucune requête API supplémentaire n’est nécessaire pour cette restauration ;
4. l’ensemble des entreprises reste strictement identique et sans doublon ;
5. le contrôle affiche `Pertinence` en cohérence avec l’ordre visible ;
6. `TC-SORT-005` peut être exécuté sans `test.fixme` et passe avec succès.

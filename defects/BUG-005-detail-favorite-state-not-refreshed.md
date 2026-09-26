# BUG-005 — L’état du favori n’est pas actualisé immédiatement dans la fiche

## Statut

**Ouvert**

## Sévérité

**Majeure**

## Priorité

**Haute**

## Fonctionnalité concernée

Favoris dans la fiche détail d’une entreprise.

## User Story liée

`US-FAVORITES-01`

## Critères d’acceptation impactés

- `AC-01` — Ajouter une entreprise aux favoris
- `AC-02` — Retirer une entreprise des favoris
- `AC-07` — Conserver la cohérence entre les vues

## Environnement

Application :

`https://maximejoannis.github.io/french-companies-explorer-qa/`

Exploration réalisée le 30 août 2026.

## Préconditions

- L’application est accessible.
- L’utilisateur se trouve sur la fiche détail d’une entreprise.
- L’entreprise est initialement non favorite pour le parcours d’ajout, ou favorite pour le parcours de retrait.

## Étapes de reproduction

1. Ouvrir l’application et rechercher une entreprise.
2. Ouvrir sa fiche détail.
3. Relever l’état visuel initial du bouton cœur et la valeur de `fce_favorites`.
4. Cliquer sur le cœur pour ajouter ou retirer l’entreprise.
5. Observer immédiatement `fce_favorites` et le contrôle toujours affiché dans la fiche, sans naviguer ni recharger.
6. Naviguer ensuite vers une autre vue ou provoquer un rerendu uniquement pour constater que le nouvel état peut alors devenir visible.

## Résultat observé

Le clic depuis la fiche met correctement à jour `fce_favorites`.

Cependant, le bouton cœur actuellement affiché dans cette même fiche conserve immédiatement son ancien état visuel :

- lors d’un ajout, le stockage indique que l’entreprise est favorite, mais le cœur de la fiche reste visuellement inactif ;
- lors d’un retrait, le stockage indique que l’entreprise n’est plus favorite, mais le cœur de la fiche reste visuellement actif.

Une navigation ou un rerendu peut ensuite faire apparaître le nouvel état. Ce rafraîchissement ultérieur ne corrige pas l’incohérence immédiatement visible après l’action.

## Résultat attendu

Après un ajout ou un retrait effectué depuis la fiche :

- le contrôle de cette même fiche doit refléter immédiatement le nouvel état favori ou non favori ;
- le stockage local doit contenir le même état ;
- les autres vues pertinentes doivent rester cohérentes avec cet état.

Aucune navigation ni aucun rechargement ne doit être nécessaire pour obtenir ce retour visuel immédiat.

## Analyse

L’exploration permet d’établir deux faits distincts :

- la mutation de `fce_favorites` réussit ;
- le contrôle déjà rendu dans la fiche ne reflète pas immédiatement cette mutation.

Le défaut porte donc sur la cohérence observable du contrôle courant après une mise à jour correcte du stockage. L’exploration ne permet pas d’attribuer avec certitude cette absence de rafraîchissement à une cause technique plus précise.

## Impact utilisateur

L’utilisateur reçoit un retour visuel contraire à l’action qui vient de réussir. Il peut alors répéter inutilement l’action ou ne plus savoir si l’entreprise est effectivement favorite. La fiche, le stockage et les autres vues peuvent temporairement présenter des états incohérents.

## Couverture automatisée associée

Cas prévu :

`TC-FAVORITES-004 — Synchroniser immédiatement le cœur de la fiche détail`

Niveau :

`UI_MOCKED`

Tant que `BUG-005` reste ouvert, le scénario automatisé complet doit conserver le comportement fonctionnel attendu et être déclaré avec `test.fixme`.

L’attendu ne doit pas être modifié pour reproduire le comportement défectueux. Le test ne doit pas ajouter de navigation ni de rechargement destiné uniquement à provoquer un rerendu et à masquer le défaut.

Après correction, retirer `test.fixme` doit suffire pour réactiver le test de non-régression.

## Critère de clôture

Le défaut pourra être considéré comme corrigé lorsque :

1. un ajout depuis la fiche rend immédiatement le cœur actif ;
2. un retrait depuis la fiche rend immédiatement le cœur inactif ;
3. le stockage et les autres vues pertinentes restent cohérents avec le contrôle de la fiche ;
4. `TC-FAVORITES-004` peut être exécuté sans `test.fixme` et passe avec succès.

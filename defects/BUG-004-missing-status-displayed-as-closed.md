# BUG-004 — Un statut absent est affiché comme Cessée

## Statut

**Ouvert**

## Sévérité

**Majeure**

## Priorité

**Haute**

## Fonctionnalité concernée

Affichage des informations facultatives dans la vue détail d’une entreprise.

## User Story liée

`US-DETAIL-01`

## Critères d’acceptation impactés

- `AC-05` — Gérer les informations absentes
- `AC-03` — Afficher les informations principales disponibles

## Environnement

Application :

`https://maximejoannis.github.io/french-companies-explorer-qa/`

Exploration réalisée le 29 août 2026.

## Préconditions

- L’application est accessible.
- L’utilisateur se trouve sur la vue Recherche.
- Une réponse de recherche contient une entreprise sans statut administratif et avec plusieurs autres champs facultatifs absents.
- Une carte correspondant à cette entreprise est affichée.

## Étapes de reproduction

1. Ouvrir l’application et accéder à la vue Recherche.
2. Charger une réponse contenant une entreprise dont le statut administratif est absent.
3. Depuis la carte de cette entreprise, activer **« Voir la fiche »**.
4. Observer le statut et les valeurs de remplacement des autres champs absents dans la vue détail.
5. Observer les requêtes réseau pendant l’ouverture.

## Résultat observé

Les autres informations facultatives absentes sont généralement représentées par des valeurs neutres telles que **« Non renseignée »**, **« Non renseigné »** ou **« Adresse non renseignée »**.

En revanche, le statut administratif absent est affiché comme **« Cessée »**. Cette valeur affirme un état métier qui n’existe pas dans la donnée reçue.

L’ouverture depuis la carte réutilise l’objet déjà présent dans la réponse courante et ne déclenche aucune requête réseau supplémentaire.

## Résultat attendu

Lorsqu’aucun statut administratif n’est fourni, la fiche doit :

- rester stable et continuer à afficher correctement les autres informations disponibles ;
- ne présenter ni `undefined`, ni `null`, ni `[object Object]`, ni erreur technique visible ;
- ne pas afficher **« Cessée »** en l’absence de cette information ;
- utiliser une représentation neutre cohérente avec la stratégie générale de l’interface, par exemple **« Non renseigné »** ou **« Non renseignée »**, sans imposer ici une microcopie définitive.

L’exigence essentielle est de ne pas transformer une absence de donnée en statut métier réel.

## Analyse

Sur la version explorée, la normalisation frontend associe l’absence de statut administratif à l’état affiché **« Cessée »**. Cette analyse décrit l’implémentation observée et ne constitue pas une règle métier attendue.

Des pistes de correction possibles consistent à :

- distinguer explicitement les valeurs `A`, `C` et une valeur absente ;
- retourner une représentation neutre lorsque le statut n’est pas fourni ;
- centraliser la normalisation du statut avec un fallback non métier.

## Impact utilisateur

L’utilisateur peut interpréter une entreprise comme administrativement cessée alors que la donnée source ne fournit aucun statut. La fiche présente ainsi une information métier trompeuse et incohérente avec le traitement neutre des autres valeurs absentes.

## Couverture automatisée associée

Cas prévu :

`TC-DETAIL-002 — Présentation des informations facultatives absentes`

Niveau :

`UI_MOCKED`

Tant que `BUG-004` reste ouvert, le scénario automatisé complet doit être déclaré avec `test.fixme`. Il doit continuer à vérifier les remplacements neutres des autres champs, l’absence de valeur technique ou d’erreur visible, l’absence d’un statut **« Cessée »** inventé et la représentation neutre du statut manquant.

Le scénario ne doit devenir ni un test vide, ni un placeholder, ni une assertion du comportement défectueux actuel. Après correction, retirer `test.fixme` doit suffire pour réactiver le test de non-régression.

## Critère de clôture

Le défaut pourra être considéré comme corrigé lorsque :

1. un statut administratif absent est représenté de manière neutre dans la fiche ;
2. l’absence n’est jamais affichée comme **« Cessée »** ;
3. aucune valeur technique ni erreur visible n’apparaît ;
4. les autres informations disponibles et leurs valeurs de remplacement restent correctement affichées ;
5. `TC-DETAIL-002` peut être exécuté sans `test.fixme` et passe avec succès.

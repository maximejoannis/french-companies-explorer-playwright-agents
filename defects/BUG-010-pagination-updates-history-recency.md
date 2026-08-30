# BUG-010 — La pagination actualise artificiellement la récence de l’historique

## Statut

**Ouvert**

## Sévérité

**Mineure**

## Priorité

**Moyenne**

## Fonctionnalité concernée

Historique de recherche.

## User Story liée

`US-HISTORY-01`

## Critères d’acceptation impactés

- `AC-01` — Enregistrer une recherche
- `AC-03` — Présenter les recherches dans l’ordre prévu
- `AC-04` — Gérer une recherche répétée

## Environnement

Application :

`https://maximejoannis.github.io/french-companies-explorer-qa/`

Exploration réalisée le 30 août 2026.

## Préconditions

- L’application est accessible.
- Plusieurs recherches sont déjà enregistrées dans History.
- Une recherche plus ancienne possède suffisamment de résultats pour permettre une pagination.

## Étapes de reproduction

1. Exécuter une première recherche comportant plusieurs pages de résultats.
2. Exécuter une seconde recherche afin qu’elle devienne la plus récente.
3. Revenir naturellement à la première recherche sans la reformuler.
4. Changer de page et observer le GET nécessaire aux nouveaux résultats.
5. Ouvrir History et relever l’ordre ainsi que la récence persistée.
6. Reproduire le contrôle avec un changement de taille de page.
7. Comparer avec un tri local des résultats.

## Résultat observé

Changer de page provoque le GET nécessaire aux résultats, puis réécrit l’entrée History de la recherche courante avec une nouvelle récence.

Changer la taille de page produit le même effet. Le tri local, lui, ne modifie pas History.

Ces interactions peuvent ainsi déplacer une ancienne recherche devant des recherches réellement formulées plus récemment.

## Résultat attendu

Dans le contrat fonctionnel de `US-HISTORY-01`, l’historique représente les recherches formulées par l’utilisateur. La navigation au sein des résultats d’une recherche existante ne doit donc pas modifier sa récence.

En particulier :

- la pagination ne doit créer aucune entrée ni mettre à jour la récence ;
- le changement de taille de page ne doit créer aucune entrée ni mettre à jour la récence ;
- le tri local ne doit produire aucune mutation History.

Les GET nécessaires à l’affichage des résultats paginés ou redimensionnés restent légitimes et ne doivent pas être considérés comme de nouvelles recherches History.

## Analyse

L’exploration établit que la pagination et le changement de taille déclenchent chacun une lecture `/search` attendue pour les résultats, puis que la récence de l’entrée courante est modifiée. Elle établit également que le tri local laisse l’historique inchangé.

Ces faits décrivent le comportement observable sans attribuer le défaut à une cause technique non démontrée.

## Impact utilisateur

L’ordre de récence est artificiellement modifié. Une ancienne recherche peut remonter en tête sans que l’utilisateur ait formulé une nouvelle recherche.

L’historique devient alors moins fidèle à la chronologie des recherches réellement effectuées et moins utile pour retrouver les intentions récentes.

## Couverture automatisée associée

Cas prévu :

`TC-HISTORY-007 — Ne pas modifier la récence lors d’une navigation ou d’un tri`

Niveau :

`UI_MOCKED`

Tant que `BUG-010` reste ouvert, le scénario automatisé complet doit être déclaré avec `test.fixme` et conserver l’ordre ainsi que la récence d’origine comme oracle.

Le GET de pagination ou de changement de taille ne doit jamais être interprété par le test comme une nouvelle recherche History. Après correction, retirer `test.fixme` doit suffire pour réactiver le test de non-régression.

## Critère de clôture

Le défaut pourra être considéré comme corrigé lorsque :

1. paginer ne crée aucune entrée et ne modifie aucune récence History ;
2. changer la taille de page ne crée aucune entrée et ne modifie aucune récence History ;
3. le tri local continue à laisser History inchangé ;
4. les GET nécessaires aux résultats restent fonctionnels ;
5. `TC-HISTORY-007` peut être exécuté sans `test.fixme` et passe avec succès.

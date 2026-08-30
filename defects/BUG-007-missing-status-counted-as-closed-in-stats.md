# BUG-007 — Un statut absent est compté comme une entreprise cessée

## Statut

**Ouvert**

## Sévérité

**Majeure**

## Priorité

**Haute**

## Fonctionnalité concernée

Statistiques de la page courante.

## User Story liée

`US-STATS-01`

## Critères d’acceptation impactés

- `AC-02` — Calculer les statistiques sur les entreprises affichées
- `AC-08` — Gérer les valeurs absentes

## Environnement

Application :

`https://maximejoannis.github.io/french-companies-explorer-qa/`

Exploration réalisée le 30 août 2026.

## Préconditions

- L’application est accessible.
- L’utilisateur se trouve sur la vue Recherche.
- Une réponse de recherche contient au moins une entreprise sans statut administratif exploitable.
- Aucune entreprise de la page n’a explicitement le statut administratif `C` pour la reproduction la plus discriminante.

## Étapes de reproduction

1. Ouvrir l’application et accéder à la vue Recherche.
2. Charger une réponse contenant une entreprise sans statut administratif exploitable et aucune entreprise avec un statut explicite `C`.
3. Observer les cartes de la page courante et le panneau de statistiques.
4. Relever les valeurs **« Affichées »**, **« En activité »** et **« cessée(s) »**.

## Résultat observé

L’entreprise sans statut exploitable n’est pas comptée dans **« En activité »**, ce qui est correct.

Elle est néanmoins comptée dans **« cessée(s) »**.

Le compteur observé est actuellement dérivé de :

`Affichées - En activité`

Toute valeur différente de `A`, y compris une absence, est donc implicitement classée comme cessation dans le résumé statistique.

## Résultat attendu

Le compteur **« cessée(s) »** doit compter uniquement les entreprises dont le statut administratif vaut explicitement `C`.

Un statut absent ou inconnu ne doit être classé ni comme actif ni comme cessé.

Cette User Story n’exige pas l’ajout d’un nouvel indicateur pour les statuts inconnus. L’exigence essentielle est de ne pas transformer une absence de donnée en statut métier réel.

## Analyse

L’exploration permet d’établir que :

- le compteur des entreprises actives retient explicitement le statut `A` ;
- le compteur des entreprises cessées est obtenu en soustrayant ce nombre du total affiché ;
- une entreprise sans statut contribue ainsi au second compteur alors qu’aucun statut `C` n’est fourni.

Ces constats décrivent uniquement le calcul observé. Ils ne permettent pas de déduire une autre cause technique.

## Impact utilisateur

Le panneau invente une information métier qui n’est pas fournie par les données de la page.

Le nombre d’entreprises cessées peut être surévalué dès qu’un statut manque ou n’est pas exploitable. Le résumé statistique devient alors incorrect et peut conduire l’utilisateur à mal interpréter la composition des résultats affichés.

## Couverture automatisée associée

Cas prévu :

`TC-STATS-006 — Exclure honnêtement les valeurs absentes des indicateurs`

Niveau :

`UI_MOCKED`

Tant que `BUG-007` reste ouvert, le scénario automatisé complet doit conserver le comportement fonctionnel attendu et être déclaré avec `test.fixme`.

Lorsque aucune entreprise ne possède explicitement le statut `C`, le test doit conserver l’attendu **« 0 cessée(s) »**. L’oracle ne doit jamais être aligné sur le calcul défectueux actuel.

Après correction, retirer `test.fixme` doit suffire pour réactiver le test de non-régression.

## Critère de clôture

Le défaut pourra être considéré comme corrigé lorsque :

1. seules les entreprises dont le statut administratif vaut explicitement `C` contribuent au compteur des cessées ;
2. un statut absent ou inconnu n’est compté ni comme `A` ni comme `C` ;
3. les autres statistiques de la page courante restent correctes ;
4. `TC-STATS-006` peut être exécuté sans `test.fixme` et passe avec succès.

# BUG-009 — L’historique ignore le statut dans l’identité d’une recherche

## Statut

**Ouvert**

## Sévérité

**Majeure**

## Priorité

**Haute**

## Fonctionnalité concernée

Historique de recherche.

## User Story liée

`US-HISTORY-01`

## Critères d’acceptation impactés

- `AC-02` — Conserver l’identité des critères
- `AC-04` — Gérer une recherche répétée

## Environnement

Application :

`https://maximejoannis.github.io/french-companies-explorer-qa/`

Exploration réalisée le 30 août 2026.

## Préconditions

- L’application est accessible.
- L’historique est initialement vide.
- Deux recherches peuvent être exécutées avec la même requête, le même code postal et la même commune.
- La première recherche utilise le statut administratif `A` et la seconde le statut `C`.

## Étapes de reproduction

1. Ouvrir l’application et accéder à la vue Recherche.
2. Saisir une requête et des critères géographiques déterministes.
3. Sélectionner le statut `A`, puis exécuter la recherche.
4. Conserver la même requête et les mêmes critères géographiques.
5. Sélectionner le statut `C`, puis exécuter la recherche.
6. Ouvrir la vue Historique et examiner les entrées ainsi que `fce_history`.

## Résultat observé

Les deux recherches sont fusionnées dans une seule entrée History.

La seconde recherche remplace silencieusement la première alors que leur statut administratif diffère. Le statut est pourtant réellement persisté dans l’entrée et restauré lorsque l’utilisateur la relance.

## Résultat attendu

Le statut administratif doit faire partie de l’identité fonctionnelle d’une recherche.

Deux recherches qui diffèrent uniquement par leur statut `A` ou `C` doivent subsister comme deux entrées distinctes.

Seule une répétition portant sur tous les critères d’identité peut dédupliquer l’entrée existante et actualiser sa récence.

## Analyse

L’exploration établit que la valeur du statut est enregistrée et utilisée lors de la restauration, mais que deux recherches ne différant que par cette valeur aboutissent à une seule entrée.

Ces constats suffisent à caractériser l’écart d’identité. Ils ne permettent pas de déduire une cause technique plus précise au-delà du comportement observé.

## Impact utilisateur

Le défaut entraîne la perte d’une recherche fonctionnellement distincte. L’utilisateur ne peut plus retrouver séparément une recherche d’entreprises actives et une recherche d’entreprises cessées lorsque leurs autres critères sont identiques.

Le remplacement est silencieux et une restauration ultérieure peut donc ne plus représenter l’intention associée à l’entrée originale.

## Couverture automatisée associée

Cas prévu :

`TC-HISTORY-002 — Distinguer les critères et gérer une répétition`

Niveau :

`UI_MOCKED`

Tant que `BUG-009` reste ouvert, le scénario automatisé complet doit être déclaré avec `test.fixme` et conserver deux identités distinctes pour les statuts `A` et `C`.

L’oracle ne doit jamais être adapté pour accepter leur fusion. Après correction, retirer `test.fixme` doit suffire pour réactiver le test de non-régression.

## Critère de clôture

Le défaut pourra être considéré comme corrigé lorsque :

1. deux recherches ne différant que par leur statut subsistent comme deux entrées distinctes ;
2. chaque entrée restaure le statut qui lui appartient ;
3. seule une répétition exacte de tous les critères déduplique et actualise la récence ;
4. `TC-HISTORY-002` peut être exécuté sans `test.fixme` et passe avec succès.

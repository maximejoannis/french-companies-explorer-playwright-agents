# BUG-001 — Le filtre Commune transmet un format non accepté par l’API

## Statut

**Ouvert**

## Sévérité

**Majeure**

## Priorité

**Haute**

## Fonctionnalité concernée

Filtrage des entreprises par commune.

## User Story liée

`US-FILTERS-01`

## Critères d’acceptation impactés

- `AC-02` — Filtrer par commune
- `AC-04` — Combiner plusieurs filtres
- `AC-07` — Cohérence entre les filtres transmis et les résultats affichés

## Environnement

Application :

`https://maximejoannis.github.io/french-companies-explorer-qa/`

API :

`https://recherche-entreprises.api.gouv.fr/search`

Exploration réalisée le 29 août 2026.

## Préconditions

- L’application est accessible.
- L’API publique Recherche d’Entreprises est accessible.
- L’utilisateur se trouve sur la vue Recherche.

## Étapes de reproduction

1. Ouvrir l’application.
2. Saisir une recherche textuelle valide.
3. Renseigner `Paris` dans le champ **Commune**, conformément à l’exemple présenté par l’interface.
4. Lancer la recherche.
5. Observer la requête envoyée à l’API et sa réponse.

## Résultat observé

L’application construit une requête contenant notamment :

`commune=Paris`

L’API répond avec un statut HTTP `400`.

L’application affiche alors un état d’erreur technique au lieu de résultats filtrés ou d’un état vide fonctionnel.

## Résultat attendu

Une commune saisie selon le format proposé par l’interface doit permettre d’effectuer une recherche valide.

L’application doit transmettre à l’API une valeur compatible avec le contrat du paramètre `commune`.

La recherche doit ensuite :

- afficher les entreprises correspondant au filtre lorsque des résultats existent ;
- ou afficher l’état fonctionnel « aucun résultat » lorsqu’aucune entreprise ne correspond.

Une saisie conforme aux indications de l’interface ne doit pas provoquer une erreur HTTP `400`.

## Analyse

L’interface présente le champ comme une saisie de commune et utilise notamment `Paris` comme exemple.

Lors de la recherche, cette valeur textuelle est transmise directement dans le paramètre API `commune`.

L’exploration de l’API a montré que ce paramètre attend une valeur compatible avec son contrat, telle qu’un identifiant de commune, et non directement le libellé `Paris`.

Il existe donc une incompatibilité entre :

- le format présenté et accepté par l’interface ;
- le format effectivement attendu par l’API.

Le problème se situe à la frontière d’intégration frontend ↔ API.

## Impact utilisateur

Un utilisateur suivant l’indication fournie par l’interface peut provoquer systématiquement une erreur technique en utilisant le filtre Commune.

La fonctionnalité de filtrage par commune n’est donc pas utilisable conformément à son comportement attendu.

Le défaut affecte également les recherches combinant la commune avec d’autres filtres.

## Risque de régression

Élevé.

La construction de la requête peut sembler correcte dans un test frontend utilisant une API mockée, tandis que le paramètre reste incompatible avec l’API réelle.

Un test d’intégration réel est donc justifié pour cette frontière spécifique.

## Couverture automatisée associée

Cas prévu :

`TC-FILTERS-009 — Compatibilité réelle du filtre commune entre l’interface et l’API`

Niveau :

`E2E_REAL`

Tant que le défaut est ouvert, le test automatisé doit conserver le comportement fonctionnel attendu tout en étant explicitement identifié comme défaut connu, par exemple avec `test.fixme`.

Après correction du produit, le `fixme` devra être supprimé afin que le cas devienne un test actif de non-régression.

## Pistes de correction

Plusieurs solutions produit sont possibles, notamment :

- résoudre le libellé saisi par l’utilisateur vers l’identifiant de commune attendu par l’API avant d’effectuer la recherche ;
- proposer un composant de sélection/autocomplétion retournant directement un identifiant compatible avec l’API ;
- modifier explicitement le champ et son aide si le produit souhaite demander directement un identifiant de commune.

La solution retenue doit rester cohérente avec l’expérience utilisateur définie pour l’application.

## Critère de clôture

Le défaut pourra être considéré comme corrigé lorsque :

1. une commune saisie ou sélectionnée conformément à l’interface produit une requête acceptée par l’API ;
2. aucun HTTP `400` n’est provoqué par une valeur conforme aux indications de l’interface ;
3. l’application affiche soit des résultats filtrés, soit un état vide fonctionnel ;
4. `TC-FILTERS-009` peut être exécuté sans `test.fixme` et passe avec succès.

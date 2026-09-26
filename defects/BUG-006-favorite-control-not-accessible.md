# BUG-006 — Le contrôle favori n’expose pas de nom ni d’état accessibles

## Statut

**Ouvert**

## Sévérité

**Mineure**

## Priorité

**Moyenne**

## Fonctionnalité concernée

Favoris et accessibilité des contrôles dans les résultats, la fiche détail et la collection.

## User Story liée

`US-FAVORITES-01`

## Environnement

Application :

`https://maximejoannis.github.io/french-companies-explorer-qa/`

Exploration réalisée le 30 août 2026.

## Préconditions

- L’application est accessible.
- Une carte de résultat, une fiche détail ou une carte de la vue Favoris affiche un contrôle cœur.

## Étapes de reproduction

1. Ouvrir l’application et afficher des résultats de recherche.
2. Inspecter le bouton cœur d’une carte, son nom accessible et son état sémantique.
3. Ajouter l’entreprise aux favoris et inspecter de nouveau ce contrôle.
4. Ouvrir la fiche détail et inspecter son bouton cœur.
5. Ouvrir la vue Favoris et inspecter le bouton cœur de la carte enregistrée.

## Résultat observé

Sur les cartes de résultat, la fiche détail et la collection, les boutons cœur :

- n’exposent pas de libellé métier utile ;
- n’exposent pas d’`aria-label` ;
- n’exposent pas d’`aria-pressed` ;
- n’exposent pas de `title` utile ;
- ont pour nom accessible observable uniquement le caractère `♥` ;
- communiquent leur état actif ou inactif uniquement par la présentation et une classe CSS.

## Résultat attendu

Le contrôle favori doit :

- avoir un nom accessible compréhensible permettant d’identifier son action ou son rôle ;
- exposer sémantiquement son état favori ou non favori de manière appropriée ;
- conserver ces informations accessibles sur les différentes surfaces concernées.

Après correction, les tests pourront privilégier un locator fondé sur un nom métier stable et/ou un état tel que `aria-pressed`.

## Analyse

L’exploration montre que le caractère cœur et la classe CSS sont les seuls indices observables de l’action et de l’état. Elle ne permet pas d’établir qu’une information sémantique équivalente serait fournie par un autre mécanisme.

Le bouton reste visible et activable dans les parcours explorés. Le défaut concerne donc les informations accessibles permettant de comprendre le rôle du contrôle et de distinguer son état.

## Impact utilisateur

Une technologie d’assistance annonce un bouton nommé uniquement `♥`, sans indiquer clairement s’il ajoute ou retire l’entreprise ni si celle-ci est actuellement favorite. Lorsque plusieurs cartes sont visibles, les contrôles sont en outre difficiles à associer à leur entreprise sans contexte supplémentaire.

La fonctionnalité reste utilisable visuellement dans les parcours observés, mais son action et son état ne sont pas communiqués de manière compréhensible aux utilisateurs de technologies d’assistance.

## Justification de la sévérité et de la priorité

La sévérité est classée **Mineure** car l’ajout et le retrait fonctionnent et restent perceptibles visuellement ; le défaut ne corrompt ni les favoris ni leur persistance. Son impact est toutefois réel pour les utilisateurs qui dépendent des informations accessibles.

La priorité est classée **Moyenne** car le même contrôle ambigu est présent sur les trois surfaces principales des favoris. Une correction est souhaitable sans bloquer l’automatisation fonctionnelle des cinq cas déjà planifiés.

## Couverture automatisée associée

`BUG-006` ne crée pas de sixième cas de test dans `US-FAVORITES-01` et aucun des cinq cas existants ne doit être placé derrière `test.fixme` uniquement à cause de ce défaut.

Tant que le produit n’expose pas de nom métier stable, les tests Favorites doivent scoper le bouton `♥` dans la carte ou la fiche de l’entreprise concernée plutôt que d’utiliser un locator global ambigu.

Après correction, les locators devront privilégier le nom accessible métier et/ou un état sémantique tel que `aria-pressed`.

## Critère de clôture

Le défaut pourra être considéré comme corrigé lorsque :

1. chaque contrôle favori expose un nom accessible compréhensible sur les résultats, la fiche et la collection ;
2. son état favori ou non favori est exposé sémantiquement ;
3. les informations accessibles restent cohérentes après un ajout ou un retrait ;
4. les tests peuvent utiliser un locator métier stable et/ou un état tel que `aria-pressed`.

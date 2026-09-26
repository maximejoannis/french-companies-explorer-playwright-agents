# BUG-008 — Un statut absent est affiché comme Cessée dans la comparaison

## Statut

**Ouvert**

## Sévérité

**Majeure**

## Priorité

**Haute**

## Fonctionnalité concernée

Comparaison d’entreprises.

## User Story liée

`US-COMPARE-01`

## Critères d’acceptation impactés

- `AC-07` — Associer correctement les valeurs comparées
- `AC-11` — Gérer les valeurs absentes

## Environnement

Application :

`https://maximejoannis.github.io/french-companies-explorer-qa/`

Exploration réalisée le 30 août 2026.

## Préconditions

- L’application est accessible.
- Au moins deux entreprises sont sélectionnées pour la comparaison afin d’afficher le tableau comparatif.
- L’une des entreprises comparées ne possède aucun statut administratif exploitable.
- Une autre entreprise possède des valeurs discriminantes permettant de vérifier l’association des colonnes.

## Étapes de reproduction

1. Ouvrir l’application et préparer une réponse contenant une entreprise sans statut administratif exploitable.
2. Ajouter cette entreprise et une entreprise témoin à la comparaison.
3. Ouvrir la vue Comparaison.
4. Identifier la colonne de l’entreprise concernée par son nom et son SIREN.
5. Observer la ligne **« Statut »** dans cette colonne.

## Résultat observé

La ligne **« Statut »** affiche **« Cessée »** pour l’entreprise qui ne possède aucun statut administratif exploitable.

Aucune donnée métier disponible ne permet pourtant de conclure que cette entreprise possède explicitement le statut `C`.

## Résultat attendu

Un statut administratif absent ou inconnu doit être présenté de manière neutre.

Il ne doit être affiché ni comme :

- **« En activité »** ;
- **« Cessée »**.

L’interface doit utiliser sa convention neutre pour les valeurs absentes, par exemple `—`, **« Non renseigné »** ou une formulation équivalente. Ce défaut ne contractualise pas une microcopie unique lorsque le produit emploie plusieurs conventions adaptées aux différents champs.

## Analyse

L’exploration permet uniquement d’établir que la vue Comparaison affiche **« Cessée »** dans la colonne d’une entreprise dont le statut administratif est absent ou inexploitable.

Elle ne permet pas de déduire une cause technique plus précise. L’écart porte sur la transformation observable d’une absence de donnée en statut métier explicite.

## Impact utilisateur

Le tableau invente une information métier absente des données disponibles. Il peut ainsi induire l’utilisateur en erreur pendant la comparaison et rendre la colonne concernée factuellement incorrecte.

Le défaut masque également la différence entre une valeur absente ou inconnue et une entreprise réellement cessée, ce qui peut fausser l’interprétation comparative des sociétés affichées.

## Couverture automatisée associée

Cas prévu :

`TC-COMPARE-006 — Valeurs absentes présentées sans fausse information métier`

Niveau :

`UI_MOCKED`

Tant que `BUG-008` reste ouvert, le scénario automatisé complet doit conserver le comportement fonctionnel attendu et être déclaré avec `test.fixme`.

Le statut absent doit continuer à être attendu sous une forme neutre. Cet attendu ne doit jamais être remplacé par **« Cessée »** pour faire passer le test.

Après correction, retirer `test.fixme` doit suffire pour réactiver le test de non-régression.

## Critère de clôture

Le défaut pourra être considéré comme corrigé lorsque :

1. un statut absent ou inconnu n’est affiché ni comme actif ni comme cessé ;
2. les autres champs absents restent présentés proprement ;
3. aucune valeur de l’autre entreprise ne fuit dans la colonne concernée ;
4. `TC-COMPARE-006` peut être exécuté sans `test.fixme` et passe avec succès.

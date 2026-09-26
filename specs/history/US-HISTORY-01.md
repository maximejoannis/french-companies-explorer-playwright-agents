# US-HISTORY-01 — Consulter et réutiliser l’historique des recherches

## User Story

En tant qu’utilisateur,

je souhaite retrouver mes recherches récentes,

afin de pouvoir les consulter et les réutiliser sans ressaisir leurs critères.

## Priorité métier

Moyenne.

L’historique améliore la continuité d’utilisation mais ne conditionne pas l’accès aux fonctions principales de recherche.

---

## Périmètre

Cette User Story couvre :

- l’enregistrement automatique d’une recherche dans l’historique ;
- l’identité d’une entrée d’historique ;
- l’ordre des recherches récentes ;
- le comportement lorsqu’une même recherche est effectuée plusieurs fois ;
- l’affichage de l’historique ;
- la réutilisation d’une entrée ;
- la restauration des critères réellement supportés ;
- la persistance de l’historique si elle fait partie du comportement du produit ;
- l’état vide ;
- les actions de suppression ou de nettoyage si elles existent ;
- la robustesse face aux données historiques incomplètes.

Cette User Story ne couvre pas :

- le contrat de l’API `/search` ;
- la validité métier des résultats retournés par l’API ;
- les règles propres aux filtres déjà couvertes ;
- la pagination ;
- le tri ;
- les statistiques ;
- les favoris ;
- la comparaison ;
- les recherches explicitement sauvegardées par l’utilisateur ;
- les exports.

---

## AC-01 — Enregistrer une recherche

Après une recherche éligible effectuée par l’utilisateur, une entrée correspondante est ajoutée à l’historique selon les règles du produit.

Le Planner devra déterminer précisément :

- à quel moment l’entrée est créée ;
- quelles recherches sont éligibles ;
- quelles informations sont conservées.

## AC-02 — Conserver l’identité des critères

Une entrée d’historique doit représenter les critères de la recherche qui l’a créée.

La réutilisation d’une entrée ne doit pas appliquer les critères d’une autre recherche.

## AC-03 — Présenter les recherches dans l’ordre prévu

Lorsque plusieurs recherches existent, leur ordre doit refléter la règle réellement prévue par le produit, notamment la récence si celle-ci est utilisée.

Le Planner devra confirmer la règle exacte.

## AC-04 — Gérer une recherche répétée

Lorsqu’une recherche déjà présente dans l’historique est effectuée à nouveau, le produit doit appliquer une règle cohérente concernant :

- les doublons ;
- la récence ;
- l’ordre ;
- les éventuelles limites de capacité.

Le Planner devra découvrir et documenter ce comportement avant automatisation.

## AC-05 — Réutiliser une entrée

Lorsqu’un utilisateur choisit une recherche depuis l’historique, les critères correspondants sont restaurés conformément au comportement prévu et la recherche peut être réexécutée.

Les assertions doivent distinguer la restauration de l’état frontend du contrat backend déjà couvert ailleurs.

## AC-06 — Persister l’historique

Si l’historique est conçu pour persister localement, un rechargement ou une nouvelle navigation dans le même contexte navigateur doit conserver les entrées attendues.

Le Planner devra identifier le mécanisme de persistance.

## AC-07 — Respecter la capacité de l’historique

Si le nombre d’entrées est limité, les recherches excédentaires doivent être gérées selon la règle prévue par le produit.

Le Planner devra déterminer :

- la limite exacte ;
- quelles entrées sont conservées ;
- quelles entrées sont supprimées.

## AC-08 — Gérer l’état vide

Lorsqu’aucun historique n’existe, la surface correspondante doit présenter un état vide exploitable, sans donnée obsolète ni erreur technique.

Une absence de clé persistée et une collection vide pourront être considérées comme deux partitions du même comportement si elles sont équivalentes.

## AC-09 — Supprimer l’historique si le produit le permet

Si une action de suppression individuelle ou globale existe, elle doit modifier uniquement les entrées prévues et maintenir une interface cohérente.

Le Planner devra confirmer les actions réellement disponibles.

## AC-10 — Rester robuste aux données incomplètes

Une entrée historique incomplète ne doit pas exposer de représentation technique telle que :

- `undefined`
- `null`
- `[object Object]`

et ne doit pas provoquer d’erreur visible.

Le Planner devra déterminer si cette situation est pertinente et raisonnablement testable au regard du format réellement persisté.

## AC-11 — Éviter les opérations API non nécessaires

La consultation, la persistance et la gestion locale de l’historique ne doivent pas produire d’écriture vers l’API publique en lecture seule.

Une nouvelle requête `GET /search` reste légitime lorsqu’une action de réutilisation déclenche réellement une nouvelle recherche.

---

## Risques fonctionnels

- mauvaise recherche enregistrée ;
- perte d’un filtre lors de l’enregistrement ;
- critères d’une entrée appliqués à une autre ;
- doublons inattendus ;
- ordre de récence incorrect ;
- dépassement incorrect de la capacité ;
- historique perdu après reload ;
- suppression trop large ;
- état vide contenant encore des données ;
- nouvelle recherche déclenchée au mauvais moment ;
- appels API inutiles lors d’actions purement locales.

---

## Stratégie de couverture attendue

Privilégier `UI_MOCKED`.

L’historique est principalement une responsabilité frontend et doit être exercé avec des recherches synthétiques déterministes.

Aucun test API n’est attendu sauf découverte d’un contrat backend propre à l’historique.

Un `E2E_REAL` ne doit être ajouté que s’il valide une frontière d’intégration nouvelle qui n’est pas déjà couverte par les baselines Recherche et Filtres.

Éviter de dupliquer les tests existants sur la syntaxe des paramètres `/search`.

---

## Principes de conception

- une question fonctionnelle principale par TC ;
- utiliser le parcours utilisateur lorsque le scénario valide la création réelle d’une entrée ;
- vérifier d’abord l’interface et utiliser le stockage comme oracle complémentaire ;
- ne pas contractualiser inutilement tout le schéma de persistance ;
- distinguer les actions locales d’une réexécution légitime de `/search` ;
- utiliser des recherches synthétiques incompatibles entre elles pour détecter les restaurations partielles ou croisées ;
- ne pas dépendre de données publiques volatiles ;
- ne pas utiliser `waitForTimeout` ;
- ne pas utiliser `networkidle` ;
- ne pas transformer un comportement observé incorrect en attendu pour obtenir un test vert.

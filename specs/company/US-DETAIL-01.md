# US-DETAIL-01 — Consulter le détail d’une entreprise

## User Story

**En tant qu’utilisateur,**
je souhaite consulter le détail d’une entreprise depuis les résultats de recherche,
**afin d’accéder à ses principales informations administratives et descriptives.**

## Priorité métier

**Haute**

La fiche détail constitue la continuité naturelle d’une recherche : elle permet à l’utilisateur d’examiner une entreprise sélectionnée au-delà des informations résumées dans sa carte.

---

# Périmètre

Cette User Story couvre :

- l’accès au détail depuis un résultat de recherche ;
- l’identification de l’entreprise sélectionnée ;
- l’affichage des principales informations disponibles dans la vue détail ;
- la cohérence entre l’entreprise sélectionnée et le détail affiché ;
- le comportement lorsque certaines informations sont absentes ;
- la fermeture ou le retour depuis le détail, selon le mécanisme réellement proposé ;
- la conservation raisonnable du contexte de recherche après consultation du détail ;
- l’accessibilité observable du mécanisme d’ouverture et de fermeture ;
- la cohérence entre données reçues et données affichées dans le détail.

Cette User Story ne couvre pas :

- les règles de recherche ;
- les règles métier des filtres ;
- le tri ;
- la pagination ;
- les favoris ;
- la comparaison ;
- l’historique ;
- les recherches sauvegardées ;
- l’export JSON ou CSV ;
- la modification d’une entreprise ;
- la création ou suppression de données ;
- une validation exhaustive de tous les champs du contrat API.

---

# Critères d’acceptation

## AC-01 — Ouvrir le détail d’une entreprise

**Étant donné** qu’une recherche affiche plusieurs entreprises,
**lorsque** l’utilisateur choisit de consulter une entreprise,
**alors** l’application ouvre la vue de détail correspondant à cette entreprise.

Le détail affiché doit être associé au résultat explicitement sélectionné.

---

## AC-02 — Identifier clairement l’entreprise consultée

**Étant donné** qu’une fiche détail est ouverte,
**alors** l’utilisateur doit pouvoir identifier sans ambiguïté l’entreprise consultée à partir des informations principales affichées.

L’identification doit s’appuyer sur les données réellement proposées par l’application, par exemple le nom et/ou le SIREN.

Le Planner doit déterminer les informations exactes utilisées par l’interface.

---

## AC-03 — Afficher les informations principales disponibles

**Étant donné** que les données d’une entreprise contiennent les informations nécessaires,
**lorsque** son détail est ouvert,
**alors** la vue affiche correctement les principales informations prévues par l’application.

Le Planner doit explorer précisément les champs réellement présentés dans le détail avant de figer les assertions.

Parmi les informations potentiellement concernées par l’application figurent notamment :

- SIREN ;
- SIRET du siège ;
- activité ;
- statut administratif ;
- date de création ;
- localisation ;
- catégorie d’entreprise ;
- tranche d’effectifs ;
- nombre d’établissements.

Cette liste sert de périmètre d’exploration et ne doit pas être transformée automatiquement en assertion exhaustive si l’interface ne présente pas tous ces champs dans la vue détail.

---

## AC-04 — Conserver la cohérence entre résultat sélectionné et détail

**Étant donné** que plusieurs entreprises distinctes sont affichées,
**lorsque** l’utilisateur ouvre le détail d’une entreprise donnée,
**alors** les informations affichées doivent appartenir à cette entreprise et non à une autre carte du résultat.

Le test doit être capable de détecter une erreur de sélection, un décalage d’index ou la réutilisation de données appartenant à une autre entreprise.

---

## AC-05 — Gérer les informations absentes

**Étant donné** qu’une information facultative n’est pas disponible pour une entreprise,
**lorsque** son détail est affiché,
**alors** l’interface doit gérer cette absence sans afficher une valeur technique incohérente telle que :

- `undefined` ;
- `null` ;
- `[object Object]` ;
- une exception JavaScript visible.

Le comportement attendu exact — valeur de remplacement, champ masqué ou autre présentation — doit être déterminé pendant l’exploration.

---

## AC-06 — Fermer le détail ou revenir aux résultats

**Étant donné** qu’une fiche détail est ouverte,
**lorsque** l’utilisateur utilise le mécanisme de fermeture ou de retour proposé par l’interface,
**alors** il revient à la vue de résultats conformément au comportement de l’application.

Le Planner doit déterminer le mécanisme exact :

- bouton de fermeture ;
- bouton retour ;
- dialogue ;
- panneau ;
- navigation ;
- ou autre comportement observable.

---

## AC-07 — Préserver le contexte utile de la recherche

**Étant donné** que l’utilisateur consulte une entreprise depuis un ensemble de résultats,
**lorsqu’il ferme le détail ou revient aux résultats,**
**alors** le contexte utile précédemment affiché ne doit pas être perdu sans raison fonctionnelle.

Le Planner doit explorer notamment :

- si les résultats restent présents ;
- si la recherche est relancée ;
- si la page courante est conservée ;
- si le tri courant est conservé ;
- si les filtres visibles sont conservés ;
- si une nouvelle requête API est déclenchée.

Ce critère ne demande pas de retester intégralement recherche, filtres, tri ou pagination. Il vérifie uniquement que la consultation du détail ne détruit pas involontairement le contexte existant.

---

## AC-08 — Le détail doit refléter les données de la réponse courante

**Étant donné** qu’une entreprise est présente dans la réponse utilisée par l’interface,
**lorsque** son détail est ouvert,
**alors** les informations affichées doivent être cohérentes avec les données de cette entreprise dans la réponse courante.

Le Planner doit déterminer si l’ouverture du détail :

- réutilise les données déjà chargées ;
- effectue une nouvelle requête ;
- ou combine les deux mécanismes.

Les tests doivent être placés au niveau adapté au comportement réellement observé.

---

## AC-09 — Le mécanisme de détail doit être utilisable de façon accessible

**Étant donné** qu’une entreprise est affichée,
**lorsque** l’utilisateur interagit avec le mécanisme permettant d’ouvrir puis de fermer le détail,
**alors** les contrôles essentiels doivent être identifiables et utilisables par des locators Playwright orientés utilisateur lorsque l’interface fournit la sémantique correspondante.

Le Planner doit observer notamment :

- rôle du contrôle d’ouverture ;
- nom accessible ;
- rôle éventuel du détail ou du dialogue ;
- nom accessible du contrôle de fermeture ;
- comportement du focus si celui-ci est pertinent et observable.

Ce critère ne constitue pas un audit WCAG complet.

---

# Risques fonctionnels

Les principaux risques sont :

- ouverture du détail de la mauvaise entreprise ;
- décalage entre la carte sélectionnée et les données détaillées ;
- données principales manquantes ou incorrectement formatées ;
- affichage de `undefined`, `null` ou d’une représentation technique ;
- fermeture impossible ou peu fiable ;
- perte des résultats après fermeture ;
- nouvelle requête réseau inutile lors d’une simple ouverture/fermeture ;
- perte de la page, du tri ou des filtres courants ;
- données provenant d’une ancienne réponse après une nouvelle recherche ;
- sélecteurs d’automatisation fragiles alors que des contrôles accessibles existent ;
- duplication inutile de tests déjà présents sur le rendu des cartes.

---

# Stratégie de couverture initiale

Le niveau de test doit être déterminé après exploration.

Le Planner doit privilégier `UI_MOCKED` pour :

- le rendu détaillé déterministe ;
- la sélection entre plusieurs entreprises ;
- les valeurs absentes ;
- la fermeture ;
- la préservation du contexte ;
- les états difficiles à garantir avec les données publiques.

Un `E2E_REAL` peut être pertinent pour démontrer une frontière d’intégration réelle entre :

`résultat provenant de l’API → sélection dans l’interface → détail cohérent`

mais il ne doit être ajouté que si cette question n’est pas déjà suffisamment démontrée par la couverture existante.

Le Planner doit examiner notamment `TC-SEARCH-010` avant de proposer un nouvel `E2E_REAL`.

Un test `API` dédié au détail ne doit pas être ajouté automatiquement.

Si la vue détail ne déclenche aucun endpoint distinct et réutilise simplement l’objet déjà obtenu par `/search`, ajouter un test API spécifique serait probablement redondant.

---

# Principes de conception

Le Planner doit :

- tester au niveau le plus bas apportant suffisamment de confiance ;
- explorer avant de supposer le fonctionnement du détail ;
- distinguer données de carte et données uniquement visibles dans le détail ;
- utiliser plusieurs entreprises synthétiques pour détecter une mauvaise association ;
- privilégier des assertions sur les informations métier utiles plutôt qu’une photographie complète du DOM ;
- ne pas vérifier deux fois les informations déjà suffisamment couvertes sur la carte si cela n’apporte pas de confiance supplémentaire ;
- utiliser une entreprise avec des champs complets et une entreprise avec des champs facultatifs absents ;
- éviter toute dépendance à un SIREN réel pour les tests déterministes ;
- tolérer l’évolution des données publiques dans un éventuel `E2E_REAL` ;
- ne pas utiliser `waitForTimeout` ;
- ne pas utiliser `networkidle` comme synchronisation générique ;
- utiliser les mécanismes observables de Playwright ;
- conserver une question fonctionnelle principale par TC.

---

# Données mockées attendues

Le Planner doit prévoir au minimum deux entreprises synthétiques clairement distinctes.

## Entreprise complète

Elle doit disposer de valeurs discriminantes pour les champs réellement affichés dans le détail.

Les données doivent permettre de vérifier que :

- la bonne entreprise a été ouverte ;
- plusieurs informations détaillées proviennent bien du bon objet ;
- aucune donnée de l’autre entreprise n’est mélangée.

## Entreprise partielle

Elle doit volontairement omettre plusieurs informations facultatives réellement prises en charge par l’application.

Elle doit permettre de vérifier le comportement face aux valeurs absentes sans provoquer d’assertions artificielles sur des champs que l’interface ne présente pas.

Tous les identifiants doivent être synthétiques.

---

# Attendus pour le Planner Playwright

Explore l’application réelle et détermine précisément :

1. comment le détail est ouvert depuis une carte ;
2. le rôle et le nom accessible du contrôle d’ouverture ;
3. la nature de la vue détail : dialogue, panneau, nouvelle page ou autre ;
4. les champs exacts affichés ;
5. les libellés exacts utiles aux assertions ;
6. le format visible de chaque information principale ;
7. le comportement d’un champ absent ;
8. la manière dont le détail est fermé ;
9. le rôle et le nom accessible du contrôle de fermeture ;
10. le comportement éventuel de la touche `Escape` si pertinent ;
11. le comportement du focus si pertinent ;
12. si l’ouverture déclenche une requête réseau ;
13. si la fermeture déclenche une requête réseau ;
14. si le détail utilise uniquement l’objet déjà présent dans les résultats ;
15. si ouvrir successivement deux entreprises utilise toujours le bon objet ;
16. si les résultats restent présents après fermeture ;
17. si la page courante est conservée ;
18. si le tri courant est conservé ;
19. si les filtres courants sont conservés ;
20. si le contexte est conservé sans nouvelle recherche ;
21. si le détail reste cohérent après chargement d’un nouveau jeu de résultats ;
22. si l’interface affiche une représentation technique lorsqu’une donnée est absente ;
23. si un comportement observé contredit un critère d’acceptation.

Ne suppose pas que la vue détail appelle un endpoint dédié.

---

# E2E réel

Avant de proposer un nouveau `E2E_REAL`, compare explicitement la question couverte à la couverture existante.

Un éventuel E2E doit répondre à une question distincte telle que :

> Une entreprise réellement reçue depuis l’API peut-elle être sélectionnée et son détail affiche-t-il des informations cohérentes avec cette même entreprise ?

Si cette frontière est déjà suffisamment démontrée par un test existant, n’ajoute pas de nouvel E2E.

Si un E2E est retenu :

- ne dépends pas d’un nom d’entreprise fixe ;
- ne dépends pas d’un SIREN fixe ;
- ne dépends pas d’un nombre exact de résultats ;
- sélectionne dynamiquement une entreprise exploitable ;
- compare uniquement des données observables obtenues pendant le scénario ;
- évite toute assertion volatile non nécessaire.

---

# Cas de test attendus

Dérive des cas :

`TC-DETAIL-xxx`

Pour chaque cas, indique :

- identifiant ;
- question principale ;
- objectif ;
- AC couvert(s) ;
- préconditions ;
- étapes essentielles ;
- résultat attendu ;
- niveau `API`, `UI_MOCKED` ou `E2E_REAL` ;
- priorité ;
- justification du niveau.

Recherche un plan compact.

Plusieurs vérifications peuvent appartenir au même TC lorsqu’elles répondent réellement à la même question.

Évite notamment de créer un TC par champ affiché.

---

# Anomalies

Si l’exploration révèle un défaut produit :

- conserve le résultat attendu de la User Story ;
- ne transforme pas le défaut en exigence ;
- documente l’écart dans le plan ;
- propose le prochain identifiant `BUG-xxx` disponible ;
- associe un TC de non-régression ;
- ne corrige pas le produit pendant la phase Planner.

---

# Traçabilité

Produis une matrice finale :

`TC → AC → niveau → priorité`

Termine par :

- critères entièrement couverts ;
- éventuels trous de couverture ;
- doublons volontairement évités ;
- scénarios volontairement non automatisés ;
- anomalies observées ;
- ambiguïtés de spécification ;
- justification des niveaux choisis ;
- justification explicite de la présence ou de l’absence d’un test `API` ;
- justification explicite de la présence ou de l’absence d’un nouvel `E2E_REAL`.

Ne génère aucun code Playwright pendant cette étape.

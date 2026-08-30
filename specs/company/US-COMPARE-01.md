# US-COMPARE-01 — Comparer plusieurs entreprises

## User Story

En tant qu’utilisateur,

je souhaite sélectionner plusieurs entreprises et les comparer,

afin d’examiner rapidement leurs principales informations côte à côte.

## Priorité métier

Haute.

La comparaison permet d’analyser plusieurs entreprises sans devoir ouvrir successivement leurs fiches individuelles.

---

## Périmètre

Cette User Story couvre :

- l’ajout d’une entreprise à la comparaison depuis les surfaces qui le permettent ;
- le retrait d’une entreprise de la comparaison ;
- la sélection indépendante de plusieurs entreprises ;
- la prévention des doublons ;
- la limite maximale du nombre d’entreprises comparables ;
- l’accès à la vue de comparaison ;
- l’affichage des entreprises effectivement sélectionnées ;
- l’association correcte entre chaque entreprise et ses informations ;
- la cohérence de la sélection entre les vues pertinentes ;
- l’état vide de la comparaison ;
- la persistance et la restauration de la sélection si elles font partie du comportement prévu par l’application ;
- la robustesse lorsque certaines données d’une entreprise sont absentes.

Cette User Story ne couvre pas :

- les règles de recherche ;
- les filtres ;
- la pagination ;
- le tri ;
- le calcul des statistiques ;
- les règles propres aux favoris, sauf interaction nécessaire avec la sélection de comparaison ;
- l’historique ;
- les recherches sauvegardées ;
- les exports ;
- la modification des données de l’API publique.

---

## Critères d’acceptation

### AC-01 — Ajouter une entreprise à la comparaison

Lorsqu’un utilisateur ajoute une entreprise depuis une surface supportée,

alors cette entreprise rejoint la sélection de comparaison et un état observable permet de constater cette sélection.

### AC-02 — Retirer une entreprise de la comparaison

Lorsqu’une entreprise sélectionnée est retirée,

alors elle ne fait plus partie de la comparaison et les autres entreprises sélectionnées restent inchangées.

### AC-03 — Conserver l’identité correcte

Toute action d’ajout ou de retrait concerne uniquement l’entreprise ciblée.

Les entreprises sont distinguées par leur identité stable, notamment leur SIREN lorsque celui-ci est disponible.

### AC-04 — Éviter les doublons

Une même entreprise ne doit pas apparaître plusieurs fois dans la sélection ou dans la vue de comparaison.

### AC-05 — Comparer plusieurs entreprises

Plusieurs entreprises distinctes peuvent être sélectionnées simultanément dans la limite prévue par le produit.

Chaque entreprise sélectionnée apparaît une seule fois dans la vue de comparaison.

### AC-06 — Respecter la limite maximale

Lorsque la limite maximale de comparaison est atteinte,

l’application empêche l’ajout d’une entreprise supplémentaire et fournit un comportement utilisateur cohérent.

Le Planner devra confirmer la limite exacte et la manière dont elle est communiquée.

### AC-07 — Afficher les bonnes informations

La vue de comparaison présente les informations prévues pour chaque entreprise sélectionnée.

Chaque valeur doit rester associée à la bonne entreprise.

Le Planner devra identifier les champs réellement affichés et les cas de valeurs absentes.

### AC-08 — Maintenir la cohérence entre les vues

La sélection de comparaison reste cohérente entre les surfaces pertinentes de l’application.

Ajouter ou retirer une entreprise depuis une surface ne doit pas altérer la sélection d’une autre entreprise.

### AC-09 — Restaurer la sélection si elle est persistante

Si la comparaison est conçue pour être persistante,

un rechargement de l’application restaure les entreprises précédemment sélectionnées sans créer de doublon ni perdre leur identité.

Le Planner devra confirmer le mécanisme réellement utilisé.

### AC-10 — Gérer une comparaison vide

Lorsqu’aucune entreprise n’est sélectionnée,

la vue de comparaison présente un état vide neutre et exploitable, sans erreur technique ni données obsolètes.

### AC-11 — Rester robuste aux données absentes

Une donnée absente pour une entreprise comparée ne doit pas :

- provoquer d’erreur technique visible ;
- afficher `undefined`, `null` ou `[object Object]` ;
- déplacer une valeur vers la mauvaise entreprise.

Le comportement d’affichage attendu sera confirmé pendant l’exploration.

### AC-12 — Rester local pour les actions de comparaison

Ajouter ou retirer une entreprise de la comparaison ne doit provoquer aucune écriture vers l’API publique en lecture seule.

Le Planner devra déterminer si l’ouverture ou la restauration de la comparaison nécessite une lecture réseau ou si les données persistées suffisent.

---

## Risques fonctionnels

- ajout ou retrait de la mauvaise entreprise ;
- doublons dans la sélection ;
- dépassement silencieux de la limite maximale ;
- suppression d’autres entreprises lors du retrait d’une sélection ;
- informations associées à la mauvaise entreprise dans le tableau comparatif ;
- sélection incohérente entre résultats, favoris, détail et comparaison ;
- perte ou duplication de la sélection après rechargement ;
- données obsolètes dans l’état vide ;
- erreur d’affichage en présence de valeurs absentes ;
- appels réseau ou écritures API inutiles lors d’actions purement locales.

---

## Stratégie de couverture attendue

La comparaison est principalement une fonctionnalité frontend.

Le Planner devra privilégier des tests `UI_MOCKED` avec des entreprises synthétiques et discriminantes.

Aucun test API n’est attendu sauf découverte d’un contrat backend spécifique à la comparaison.

Un test `E2E_REAL` ne doit être ajouté que s’il valide une frontière d’intégration distincte qui n’est pas déjà couverte par Recherche ou Détail.

Éviter de reproduire les mêmes scénarios à plusieurs niveaux.

---

## Principes de conception

- une question fonctionnelle principale par TC ;
- sélectionner les entreprises via l’interface lorsque le scénario cherche à valider la sélection ;
- utiliser des entreprises synthétiques faciles à distinguer ;
- vérifier l’interface avant d’utiliser le stockage comme oracle complémentaire ;
- ne pas tester exhaustivement le schéma interne du stockage ;
- ne pas dépendre de données publiques volatiles ;
- ne pas utiliser `waitForTimeout` ;
- ne pas utiliser `networkidle` ;
- ne pas contourner une limite ou un défaut produit pour rendre un test vert.

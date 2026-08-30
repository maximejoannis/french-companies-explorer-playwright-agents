# US-STATS-01 — Consulter les statistiques de la page courante

## User Story

En tant qu’utilisateur,

je souhaite consulter un résumé statistique des entreprises actuellement affichées,

afin d’obtenir rapidement une vue synthétique des résultats de recherche.

## Priorité métier

Haute.

Les statistiques permettent d’interpréter les résultats sans parcourir individuellement toutes les cartes.

---

## Périmètre

Cette User Story couvre :

- l’affichage du panneau de statistiques lorsque des résultats sont disponibles ;
- le calcul des indicateurs à partir des entreprises actuellement affichées ;
- la mise à jour des statistiques après une nouvelle recherche ;
- la mise à jour des statistiques après application de filtres ;
- la mise à jour des statistiques lors d’un changement de page ;
- l’invariance des statistiques lors d’un changement de tri ;
- le comportement lorsqu’aucun résultat n’est affiché ;
- la gestion des valeurs absentes dans les données nécessaires aux statistiques.

Cette User Story ne couvre pas :

- le calcul sur l’ensemble des résultats API ;
- les graphiques historiques ;
- les exports de statistiques ;
- les favoris ;
- la recherche sauvegardée ;
- les appels API supplémentaires.

---

## Critères d’acceptation

### AC-01 — Afficher les statistiques lorsqu’il existe des résultats

Lorsqu’une recherche retourne au moins une entreprise,

alors un panneau de statistiques est affiché.

### AC-02 — Calculer les statistiques sur les entreprises affichées

Les statistiques reflètent uniquement les entreprises visibles sur la page courante.

Le Planner devra confirmer les indicateurs réellement présents dans l’interface.

### AC-03 — Mettre à jour les statistiques après une nouvelle recherche

Une nouvelle recherche remplace entièrement les statistiques précédentes.

### AC-04 — Mettre à jour les statistiques après filtrage

Les statistiques sont recalculées à partir du nouvel ensemble filtré.

### AC-05 — Mettre à jour les statistiques lors d’un changement de page

Les statistiques correspondent toujours à la page affichée.

### AC-06 — Le tri ne modifie pas les statistiques

Changer uniquement l’ordre d’affichage ne modifie aucune valeur statistique.

### AC-07 — Gérer l’absence de résultats

Lorsque la recherche retourne zéro résultat,

le panneau de statistiques est masqué ou présente un état vide cohérent.

Aucune valeur obsolète ne doit rester visible.

### AC-08 — Gérer les valeurs absentes

Les entreprises dont certaines informations sont absentes ne doivent pas provoquer d’erreur de calcul ni de valeur technique visible.

Le comportement exact sera confirmé pendant l’exploration.

---

## Risques fonctionnels

- statistiques calculées sur tous les résultats au lieu de la page courante ;
- statistiques non recalculées après filtre ou pagination ;
- statistiques modifiées par un simple tri ;
- conservation de valeurs obsolètes après une nouvelle recherche ;
- erreurs de calcul en présence de données incomplètes ;
- panneau visible avec des valeurs incohérentes lorsqu’il n’y a aucun résultat.

---

## Stratégie de couverture attendue

Cette fonctionnalité est essentiellement un calcul frontend.

Le Planner devra privilégier des tests `UI_MOCKED`.

Aucun test API ne doit être ajouté sauf découverte d’un contrat spécifique.

Un E2E réel n’est attendu que si une frontière d’intégration distincte est identifiée, ce qui est peu probable.

---

## Principes de conception

- tester une question fonctionnelle principale par TC ;
- utiliser des jeux de données synthétiques faciles à compter ;
- éviter les dépendances aux données publiques ;
- vérifier les valeurs visibles avant de vérifier une représentation interne éventuelle ;
- ne pas utiliser `waitForTimeout` ;
- ne pas utiliser `networkidle`.

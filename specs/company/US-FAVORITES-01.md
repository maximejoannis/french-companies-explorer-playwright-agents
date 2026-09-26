# US-FAVORITES-01 — Gérer des entreprises favorites

## User Story

En tant qu’utilisateur,
je veux pouvoir ajouter et retirer des entreprises de mes favoris,
afin de retrouver facilement les entreprises qui m’intéressent au cours de mon utilisation de l’application.

## Priorité

Haute

## Périmètre

Cette User Story couvre :

- l’ajout d’une entreprise aux favoris depuis les surfaces prévues par l’application ;
- le retrait d’une entreprise des favoris ;
- l’état visuel permettant d’identifier qu’une entreprise est favorite ;
- la cohérence de l’état favori entre les différentes vues pertinentes de l’application ;
- la persistance des favoris lorsque l’application est rechargée, si ce comportement est prévu par l’application ;
- la restauration des favoris depuis le stockage local utilisé par l’application ;
- le comportement avec plusieurs entreprises favorites ;
- l’absence de duplication d’une même entreprise dans les favoris ;
- le comportement lorsque la liste des favoris est vide ;
- la robustesse face à un état de stockage local absent ou vide.

## Hors périmètre

Cette User Story ne couvre pas :

- les règles de recherche ;
- les règles des filtres ;
- le tri des résultats ;
- la pagination ;
- la taille de page ;
- le détail complet d’une entreprise, sauf lorsque cette vue est nécessaire pour vérifier la cohérence de l’état favori ;
- la comparaison d’entreprises ;
- l’historique de recherche ;
- les recherches sauvegardées ;
- les exports JSON ou CSV ;
- le thème clair/sombre ;
- la modification, création ou suppression de données dans l’API publique ;
- la synchronisation des favoris entre plusieurs navigateurs, appareils ou utilisateurs.

## Critères d’acceptation

### AC-01 — Ajouter une entreprise aux favoris

Lorsqu’une entreprise non favorite est affichée sur une surface permettant cette action, l’utilisateur peut l’ajouter aux favoris.

Après l’action, l’interface indique de manière observable que cette entreprise est favorite.

### AC-02 — Retirer une entreprise des favoris

Lorsqu’une entreprise est favorite, l’utilisateur peut la retirer des favoris.

Après l’action, l’interface indique de manière observable que cette entreprise n’est plus favorite.

### AC-03 — Associer le favori à la bonne entreprise

L’ajout ou le retrait d’un favori concerne uniquement l’entreprise sélectionnée.

L’état favori d’une entreprise ne doit pas modifier par erreur celui d’une autre entreprise.

### AC-04 — Éviter les doublons

Ajouter plusieurs fois la même entreprise ne doit pas créer plusieurs entrées représentant le même favori.

Une entreprise ne doit apparaître qu’une seule fois dans l’état persistant des favoris.

### AC-05 — Gérer plusieurs favoris

L’utilisateur peut conserver plusieurs entreprises favorites distinctes.

L’ajout ou le retrait de l’une d’elles ne doit pas supprimer ou modifier les autres favoris sans action explicite de l’utilisateur.

### AC-06 — Persister les favoris

Si l’application utilise un stockage local pour les favoris, les favoris enregistrés doivent être restaurés après un rechargement ou une nouvelle initialisation pertinente de l’application dans le même contexte navigateur.

La vérification doit porter sur le comportement utilisateur observable et, lorsque pertinent, sur la cohérence avec le stockage réellement utilisé par l’application.

### AC-07 — Conserver la cohérence entre les vues

Lorsqu’une entreprise favorite est accessible depuis plusieurs vues pertinentes de l’application, son état favori doit rester cohérent lors du passage d’une vue à l’autre.

Le Planner doit déterminer les vues réellement concernées à partir du comportement actuel de l’application.

### AC-08 — Gérer une liste de favoris vide

Lorsque l’utilisateur ne possède aucun favori, l’application doit présenter un état vide compréhensible si une vue dédiée aux favoris existe.

Cet état ne doit pas être présenté comme une erreur technique.

### AC-09 — Ne pas dépendre d’une écriture API

La gestion des favoris est un comportement local de l’application.

Les tests ne doivent pas nécessiter de POST, PUT, PATCH ou DELETE vers l’API publique Recherche d’Entreprises.

Le Planner doit vérifier si une lecture réseau est nécessaire pour restaurer ou afficher un favori et adapter le niveau de test au comportement réellement observé.

## Stratégie de test attendue

Cette fonctionnalité est principalement frontend.

Privilégier :

- `UI_MOCKED` pour les scénarios déterministes impliquant des résultats de recherche et des actions sur les favoris ;
- l’initialisation contrôlée du stockage navigateur lorsque cela permet d’isoler précisément un comportement ;
- des assertions sur l’interface utilisateur avant de vérifier directement une représentation interne ;
- un test d’intégration réel uniquement si le Planner identifie une frontière API ↔ favoris distincte et suffisamment risquée pour justifier une couverture `E2E_REAL`.

Ne pas ajouter automatiquement de test API : les favoris ne constituent pas une fonctionnalité d’écriture de l’API publique.

## Principes de conception des tests

- Un test doit répondre à une question fonctionnelle principale.
- Utiliser des entreprises synthétiques et discriminantes pour les scénarios mockés.
- Ne pas dépendre d’une entreprise publique fixe.
- Ne pas dépendre de l’ordre ou du volume courant des données de l’API publique.
- Isoler l’état de stockage entre les tests.
- Ne pas partager implicitement les favoris entre tests.
- Ne pas utiliser `waitForTimeout`.
- Ne pas affaiblir une assertion pour faire passer un comportement incorrect.
- Ne pas tester uniquement `localStorage` si le comportement utilisateur observable peut être vérifié.
- Ne pas inventer le nom de la clé, le format ou le schéma du stockage avant exploration de l’application.
- Si le stockage contient des objets métier, vérifier uniquement les propriétés nécessaires au comportement testé.
- Ne jamais modifier l’application source ou le dépôt de référence pour faire passer les tests.

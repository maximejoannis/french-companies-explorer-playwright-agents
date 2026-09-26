# US-DEEP-LINKING-01 — Restaurer une recherche depuis l’URL

## User Story

En tant qu’utilisateur,

je veux pouvoir partager ou rouvrir une URL représentant mon état de recherche,

afin de retrouver directement la recherche, les filtres, la pagination et le tri correspondants sans devoir les ressaisir manuellement.

## Contexte

L’application synchronise une partie de l’état de la vue Recherche avec les paramètres de l’URL.

Cette fonctionnalité est une responsabilité frontend.

Les tests ne doivent pas inventer de règles métier backend ni dépendre de données volatiles provenant de l’API publique.

Les vérifications détaillées de restauration doivent utiliser des réponses mockées déterministes.

## Critères d’acceptation

### AC-01 — Initialisation depuis l’URL

Lorsqu’une URL contenant des paramètres de recherche valides est ouverte directement, l’application restaure les valeurs correspondantes dans la vue Recherche.

Les paramètres observables concernés sont notamment :

- requête ;
- code postal ;
- commune ;
- statut ;
- page ;
- taille de page ;
- tri.

Le Planner doit confirmer les noms exacts des paramètres et leur comportement réel dans l’application avant de les contractualiser.

### AC-02 — Recherche déclenchée depuis un deep link

Si l’URL restaurée représente une recherche exploitable, l’application déclenche la requête nécessaire vers `/search` pour charger les résultats correspondant à cet état.

Le test doit vérifier les paramètres réseau observables sans introduire de règle métier backend.

### AC-03 — Restauration de la pagination

Lorsqu’une page autre que la première est encodée dans l’URL et qu’elle est valide dans le contexte de la réponse mockée, l’application restaure cette page et affiche la collection correspondante.

La pagination ne doit pas provoquer de requête parasite supplémentaire au chargement.

### AC-04 — Restauration de la taille de page

La taille de page encodée dans l’URL est restaurée dans le contrôle correspondant et propagée à la requête `/search` lorsque le comportement observé de l’application le prévoit.

### AC-05 — Restauration du tri

Le tri encodé dans l’URL est restauré dans l’interface.

Si le tri est purement client, il ne doit pas provoquer de requête `/search` supplémentaire.

L’ordre affiché doit correspondre au tri restauré.

### AC-06 — Synchronisation URL après interaction

Lorsque l’utilisateur modifie un état faisant partie du contrat URL, l’URL courante est mise à jour de manière cohérente.

Le Planner doit déterminer précisément quelles actions synchronisent l’URL et lesquelles n’y apparaissent pas.

### AC-07 — Navigation navigateur

Lorsque l’utilisateur modifie successivement l’état de recherche puis utilise l’historique navigateur si l’application le supporte, l’état restauré doit rester cohérent avec l’URL affichée.

Le Planner doit déterminer si `pushState`, `replaceState`, `popstate` ou un autre mécanisme observable rend ce scénario réellement pertinent.

Ne pas inventer un contrat Back/Forward si l’implémentation ne le supporte pas.

### AC-08 — Paramètres absents

Une URL sans paramètres de recherche doit ouvrir l’application dans son état initial observable sans générer de valeur `undefined`, `null`, `[object Object]` ou erreur technique dans l’interface.

### AC-09 — Paramètres invalides ou inconnus

Les paramètres inconnus ou valeurs invalides doivent être traités selon le comportement réellement observable de l’application.

Le Planner doit déterminer si l’application :

- les ignore ;
- applique une valeur par défaut ;
- les conserve dans l’URL ;
- ou les normalise.

Ne pas inventer une validation UX non présente.

### AC-10 — Cohérence réseau

La restauration d’un deep link ne doit déclencher que les requêtes `/search` nécessaires à l’état restauré.

Aucun `POST`, `PUT`, `PATCH` ou `DELETE` ne doit être envoyé à l’API publique.

### AC-11 — Isolation des stockages

La restauration depuis l’URL ne doit pas modifier de manière injustifiée les données indépendantes telles que :

- favoris ;
- historique ;
- recherches sauvegardées ;
- comparaison ;
- autres clés `localStorage`.

Toute interaction qui modifie légitimement l’un de ces domaines doit rester hors de ce scénario.

### AC-12 — Déterminisme

Les assertions détaillées sur les résultats restaurés, l’ordre et les paramètres réseau doivent reposer sur des mocks déterministes.

Aucune entreprise publique réelle ne doit devenir un oracle stable de cette US.

## Hors périmètre

- règles métier internes de l’API gouvernementale ;
- validité métier d’une entreprise réelle ;
- SEO ;
- partage via service externe ;
- raccourcisseurs d’URL ;
- URL générées hors de l’application ;
- tests exhaustifs de toutes les permutations de paramètres ;
- répétition complète des suites Recherche, Filtres, Pagination ou Sort ;
- persistance du thème sombre ;
- restauration des favoris, de l’historique ou des recherches sauvegardées depuis l’URL sauf si le code actuel le fait explicitement.

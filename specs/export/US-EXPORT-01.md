# US-EXPORT-01 — Exporter les résultats de recherche en JSON ou CSV

## User Story

En tant qu’utilisateur de French Companies Explorer,
je veux pouvoir exporter les résultats de ma recherche dans un fichier JSON ou CSV,
afin de pouvoir les réutiliser ou les analyser en dehors de l’application.

## Contexte

L’export est une fonctionnalité frontend basée sur les résultats actuellement disponibles dans l’application.

Les tests ne doivent pas supposer de règles métier internes propres à l’API publique gouvernementale.

Lorsque des données déterministes sont nécessaires pour vérifier précisément le contenu d’un fichier exporté, privilégier des réponses API mockées.

## Critères d’acceptation

### AC-01 — Disponibilité de l’export

Après une recherche retournant des résultats exploitables, l’utilisateur peut déclencher :

- un export JSON ;
- un export CSV.

Les contrôles correspondants doivent être disponibles depuis la vue Recherche au moment pertinent.

### AC-02 — Export JSON

L’export JSON produit un fichier téléchargeable représentant les données exportées par l’application.

Le contenu doit être un JSON valide et exploitable.

Les données exportées doivent correspondre aux résultats que l’application prévoit d’exporter pour l’état courant de la recherche.

Le test ne doit pas contractualiser des champs ou des règles métier non observables dans l’application.

### AC-03 — Export CSV

L’export CSV produit un fichier téléchargeable avec une structure tabulaire exploitable.

Le fichier doit comporter une ligne d’en-tête cohérente avec les colonnes exportées et une ligne de données par élément exporté.

Les valeurs doivent rester correctement associées à leur colonne.

### AC-04 — Caractères spéciaux CSV

Les valeurs contenant des caractères nécessitant un échappement CSV, par exemple :

- virgule ;
- guillemet ;
- retour à la ligne ;

doivent produire un CSV dont la structure reste valide et non ambiguë.

### AC-05 — Protection contre l’injection CSV

Lorsqu’une valeur textuelle exportée commence par un caractère pouvant être interprété comme une formule par un tableur, notamment :

- `=`
- `+`
- `-`
- `@`

l’export doit appliquer la protection prévue par l’application afin que cette valeur ne soit pas interprétée comme une formule active à l’ouverture du fichier.

La vérification doit porter sur le comportement observable du frontend et non sur une règle supposée du backend.

### AC-06 — Cohérence avec l’état courant

L’export doit correspondre à l’état courant effectivement exporté par l’application.

Le Planner doit déterminer à partir du code et du comportement observable si l’application exporte :

- uniquement les résultats actuellement chargés ;
- la page courante ;
- ou une autre collection explicitement maintenue par le frontend.

Les tests doivent contractualiser uniquement ce comportement observable.

### AC-07 — Absence de résultats exploitables

Le Planner doit vérifier le comportement observable lorsque l’utilisateur tente d’exporter sans résultat exploitable.

Le test doit couvrir le comportement réellement attendu par le produit, par exemple contrôle indisponible ou message explicite, sans inventer une UX inexistante.

### AC-08 — Aucun appel API supplémentaire

Une fois les résultats nécessaires déjà chargés, déclencher un export JSON ou CSV est une opération locale.

L’export ne doit pas provoquer de nouvelle requête de recherche vers :

`https://recherche-entreprises.api.gouv.fr/search`

et ne doit générer aucune écriture API.

### AC-09 — Téléchargement réel

Les scénarios d’export doivent valider un véritable événement de téléchargement navigateur avec les APIs Playwright dédiées.

Ils ne doivent pas remplacer le comportement utilisateur par un appel direct aux fonctions internes JavaScript de l’application.

### AC-10 — Isolation et déterminisme

Les assertions détaillées portant sur le contenu JSON ou CSV doivent utiliser des données déterministes lorsque cela est nécessaire.

Ne pas dépendre de données volatiles d’entreprises réelles pour vérifier :

- ordre exact ;
- texte exact ;
- caractères spéciaux ;
- contenu exact des fichiers.

### AC-11 — Non-régression

Les exports ne doivent pas modifier de manière injustifiée :

- la recherche courante ;
- les filtres ;
- les favoris ;
- la comparaison ;
- l’historique ;
- les recherches sauvegardées.

Aucun stockage local sans rapport avec l’export ne doit être modifié par le simple téléchargement d’un fichier.

## Hors périmètre

Cette User Story ne vise pas à tester :

- les règles métier internes de l’API gouvernementale ;
- un système d’import de fichiers ;
- l’ouverture des fichiers dans Excel, LibreOffice ou un logiciel externe ;
- tous les parseurs CSV existants ;
- la compatibilité exhaustive avec tous les tableurs ;
- les performances d’export de volumes arbitrairement importants ;
- les exports provenant directement du backend s’ils n’existent pas dans l’application.

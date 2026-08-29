# US-SEARCH-01 — Rechercher une entreprise

## User Story

En tant qu'utilisateur,

je souhaite rechercher une entreprise par texte, SIREN ou SIRET,

afin d'identifier une entreprise et de consulter les informations disponibles à son sujet.

---

## Valeur métier

La recherche constitue le point d'entrée principal de l'application.

Elle doit permettre à l'utilisateur de retrouver rapidement une ou plusieurs entreprises à partir des informations dont il dispose.

Une défaillance de cette fonctionnalité empêche l'accès à la majorité des autres parcours de l'application.

**Priorité fonctionnelle : Haute**

---

## Périmètre

Cette User Story couvre :

- la recherche textuelle ;
- la recherche par SIREN ;
- la recherche par SIRET ;
- la validation des identifiants numériques ;
- le déclenchement d'une recherche ;
- l'affichage de résultats ;
- l'affichage d'un état sans résultat ;
- l'affichage d'un état d'erreur ;
- l'état de chargement associé à une recherche.

Les filtres avancés, le tri, la pagination et le détail d'une entreprise pourront être couverts par des User Stories ou exigences séparées afin de conserver un périmètre lisible.

---

# Critères d'acceptation

## AC-01 — Recherche textuelle valide

Étant donné que l'utilisateur se trouve sur l'application,

lorsqu'il saisit une recherche textuelle valide et lance la recherche,

alors une requête de recherche est effectuée et l'application peut afficher les entreprises correspondant à la réponse reçue.

---

## AC-02 — Recherche par SIREN valide

Étant donné que l'utilisateur saisit un identifiant composé exactement de 9 chiffres,

lorsqu'il lance la recherche,

alors l'identifiant est interprété comme un SIREN valide et la recherche est autorisée.

---

## AC-03 — Recherche par SIRET valide

Étant donné que l'utilisateur saisit un identifiant composé exactement de 14 chiffres,

lorsqu'il lance la recherche,

alors l'identifiant est interprété comme un SIRET valide et la recherche est autorisée.

---

## AC-04 — Identifiant numérique invalide

Étant donné que l'utilisateur saisit une valeur composée uniquement de chiffres,

lorsque cette valeur ne contient ni 9 ni 14 chiffres,

alors la recherche est refusée et un message de validation compréhensible est présenté à l'utilisateur.

La requête API de recherche ne doit pas être déclenchée pour cette saisie invalide.

---

## AC-05 — Affichage des résultats

Étant donné qu'une recherche valide retourne une ou plusieurs entreprises,

lorsque la réponse est traitée par l'application,

alors les résultats sont affichés de manière exploitable par l'utilisateur.

Les informations essentielles affichées doivent provenir des données retournées par l'API.

---

## AC-06 — Aucun résultat

Étant donné qu'une recherche valide ne retourne aucune entreprise,

lorsque la réponse est traitée,

alors l'application affiche explicitement un état sans résultat.

L'utilisateur ne doit pas confondre cet état avec une erreur technique.

---

## AC-07 — Erreur de recherche

Étant donné qu'une recherche valide est lancée,

lorsque l'API ou le réseau retourne une erreur empêchant la recherche,

alors l'application affiche explicitement un état d'erreur compréhensible.

Une erreur technique ne doit pas être présentée comme une absence de résultat.

---

## AC-08 — État de chargement

Étant donné qu'une recherche valide est en cours,

tant que la réponse nécessaire à l'affichage des résultats n'est pas disponible,

alors l'application présente un état de chargement identifiable.

L'état de chargement disparaît lorsque la recherche aboutit ou échoue.

---

# Risques principaux

Les risques associés à cette User Story sont notamment :

- impossibilité d'effectuer la fonctionnalité principale de l'application ;
- mauvaise distinction entre texte, SIREN et SIRET ;
- appel inutile de l'API pour une valeur invalide ;
- mauvais rendu des données retournées par l'API ;
- confusion entre absence de données et erreur technique ;
- état de chargement absent ou bloqué ;
- dépendance excessive des tests à des données publiques susceptibles d'évoluer.

---

# Orientation initiale de la couverture

Cette section représente une première hypothèse de stratégie.

Le Planner doit la confronter au comportement réel de l'application et peut proposer des ajustements s'ils sont justifiés.

| Critère | Risque principal                  | Niveau privilégié                            |
| ------- | --------------------------------- | -------------------------------------------- |
| `AC-01` | Recherche backend / intégration   | `API` + couverture minimale `E2E_REAL`       |
| `AC-02` | Reconnaissance et recherche SIREN | `API` + couverture critique `E2E_REAL`       |
| `AC-03` | Reconnaissance et recherche SIRET | `API` + couverture critique `E2E_REAL`       |
| `AC-04` | Validation frontend               | `UI_MOCKED`                                  |
| `AC-05` | Mapping API → UI                  | `UI_MOCKED` + couverture minimale `E2E_REAL` |
| `AC-06` | État vide                         | `UI_MOCKED`                                  |
| `AC-07` | Gestion d'erreur                  | `UI_MOCKED`                                  |
| `AC-08` | État de chargement                | `UI_MOCKED`                                  |

---

# Règles de conception associées

Le Planner doit éviter de créer un test E2E réel pour chaque critère.

La vraie API doit être privilégiée lorsqu'il s'agit de vérifier :

- le contrat HTTP ;
- la recherche backend ;
- les données réellement retournées ;
- les comportements gérés par le backend.

Le mocking doit être privilégié lorsqu'il s'agit de vérifier :

- la validation frontend ;
- l'état de chargement ;
- l'état vide ;
- l'état d'erreur ;
- un rendu UI nécessitant des données déterministes.

Les tests `E2E_REAL` doivent rester peu nombreux et valider principalement que l'application et la vraie API continuent à fonctionner ensemble.

Les assertions contre l'API réelle ne doivent pas dépendre inutilement :

- d'un nombre exact de résultats ;
- d'un classement immuable ;
- d'une entreprise précise lorsque ce n'est pas nécessaire.

---

# Attendu du Planner

À partir de cette User Story, le Planner doit :

1. explorer la fonctionnalité réelle ;
2. confronter le comportement observé aux critères d'acceptation ;
3. identifier les cas limites utiles ;
4. proposer les cas de test nécessaires ;
5. rattacher chaque cas à un ou plusieurs critères ;
6. attribuer à chaque cas un niveau :

   - `API`
   - `UI_MOCKED`
   - `E2E_REAL`

7. attribuer une priorité pertinente ;
8. éviter les doublons de couverture ;
9. produire une matrice de traçabilité ;
10. signaler tout comportement observé qui semble contredire un critère d'acceptation.

Le Planner ne doit pas encore générer de code Playwright.

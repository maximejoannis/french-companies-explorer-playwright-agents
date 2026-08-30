# Plan de test — US-DEEP-LINKING-01

## Références

- User Story : `US-DEEP-LINKING-01`
- Application de référence : `https://maximejoannis.github.io/french-companies-explorer-qa/`
- Baselines consultées : Search, Filters, Pagination, Sort, History, Saved Searches et Export

## Synthèse de l’exploration

### Paramètres URL connus

L’application reconnaît les paramètres suivants :

| Paramètre URL | État frontend restauré | Valeurs observables utiles                                                           | Paramètre `/search`  |
| ------------- | ---------------------- | ------------------------------------------------------------------------------------ | -------------------- |
| `q`           | requête                | texte, SIREN ou SIRET selon le contrat Search                                        | `q`                  |
| `cp`          | code postal            | chaîne non vide                                                                      | `code_postal`        |
| `city`        | commune                | chaîne non vide                                                                      | `commune`            |
| `status`      | statut administratif   | `A`, `C` ou valeur vide                                                              | `etat_administratif` |
| `page`        | page courante          | nombre converti par `Number()`                                                       | `page`               |
| `size`        | taille de page         | `10`, `20`, `25`                                                                     | `per_page`           |
| `sort`        | tri client             | `relevance`, `name-asc`, `name-desc`, `creation-newest`, `creation-oldest`, `status` | aucun                |

Les noms URL diffèrent volontairement des noms réseau pour `cp`, `city`, `status` et `size`.

### Valeurs par défaut et paramètres absents

Les valeurs par défaut observables sont :

- requête vide ;
- code postal vide ;
- commune vide ;
- statut vide, correspondant à tous les statuts ;
- page `1` ;
- taille de page `20` ;
- tri `relevance`.

Les valeurs par défaut ne sont pas conservées dans l’URL canonique : `page=1`, `size=20` et `sort=relevance` sont omis lors d’une synchronisation réussie.

Une URL sans `q` non vide ne déclenche aucune recherche. L’application reste sur la vue d’accueil, même si d’autres paramètres connus ou inconnus sont présents.

### Ordre de restauration au chargement direct

Au chargement :

1. `restoreFromUrl()` lit `location.search` ;
2. `q`, `cp`, `city` et `status` sont affectés aux contrôles lorsqu’ils sont non vides ;
3. `size` est affecté uniquement s’il vaut `10`, `20` ou `25` ;
4. `sort` est affecté uniquement s’il appartient à la liste autorisée ;
5. `page` est converti avec `Number()`, ou prend `1` s’il est absent ;
6. si `q` est présent, la vue Recherche est ouverte et `search(page)` est appelée ;
7. `search()` relit les contrôles, fixe la taille de page et construit le GET ;
8. après une réponse réussie, l’URL est réécrite avec `replaceState` ;
9. le tri client restauré est appliqué ;
10. les résultats, la pagination et les statistiques sont rendus ;
11. History est légitimement créé ou actualisé puisque la recherche a réellement été exécutée.

### Déclenchement et frontière réseau

La présence d’un `q` non vide provoque l’appel de `search(page)`. La fonction Search valide ensuite la requête :

- une requête textuelle ou un identifiant reconnu déclenche un GET `/search` ;
- une valeur entièrement numérique d’une longueur invalide ouvre la vue Recherche et affiche l’erreur de validation, mais ne déclenche aucun GET ;
- l’absence de `q` ne déclenche aucun GET.

Pour un deep link exploitable, un seul GET est émis au chargement. Il contient toujours :

- `q` ;
- `page` ;
- `per_page`.

Il contient conditionnellement :

- `code_postal` si `cp` est non vide ;
- `commune` si `city` est non vide ;
- `etat_administratif` si le contrôle `status` possède une valeur.

Le tri n’est jamais envoyé à l’API. Il est appliqué à la collection de la page courante après réception de la réponse.

Aucun `POST`, `PUT`, `PATCH` ou `DELETE` n’est légitime vers l’API publique.

### Synchronisation après interaction

`syncUrl()` reconstruit entièrement les paramètres connus dans l’ordre suivant :

```text
q → cp → city → status → page → size → sort
```

Les valeurs vides et les valeurs par défaut sont omises.

Les synchronisations observables sont :

- après une recherche réussie ;
- après une pagination réussie ;
- immédiatement après un changement de tri client ;
- après la suppression ou la réinitialisation de filtres, soit après la recherche résultante si `q` existe, soit immédiatement sans recherche si `q` est vide ;
- immédiatement après `Réinitialiser`, qui produit l’URL sans paramètres.

La simple saisie d’une requête, d’un filtre ou d’une taille ne synchronise pas l’URL avant une recherche réussie. Une validation locale ou une erreur réseau ne provoque pas non plus de canonicalisation.

Les relances depuis History ou Saved Searches passent par une vraie recherche ; leur URL est donc mise à jour après la réponse réussie selon le même mécanisme. Ces parcours ne seront pas dupliqués dans cette US.

### `replaceState`, `pushState` et navigation Back/Forward

L’application appelle exclusivement :

```text
history.replaceState({}, "", url)
```

Elle n’appelle jamais `history.pushState`.

Un handler `popstate` existe et relit l’URL, puis ouvre la vue Recherche et relance la recherche si `q` est présent, ou ouvre la vue d’accueil dans le cas contraire.

Cependant, les interactions de recherche remplacent l’entrée courante au lieu de créer des entrées successives. L’application ne fournit donc pas de parcours utilisateur Back/Forward entre deux états de recherche successifs. Aucun TC Back/Forward n’est proposé : en créer un nécessiterait de fabriquer artificiellement des entrées d’historique que le produit ne crée pas.

`AC-07` est considéré non applicable au parcours courant plutôt que couvert par un scénario artificiel. L’existence du listener `popstate` reste documentée pour une éventuelle évolution.

### Paramètres invalides et inconnus

- `size` invalide est ignoré et le contrôle reste à `20`.
- `sort` invalide est ignoré et le contrôle reste à `relevance`.
- `status` ne correspondant à aucune option laisse le contrôle sans valeur, donc aucun filtre de statut n’est envoyé.
- après une recherche réussie, `syncUrl()` élimine les valeurs invalides ignorées et tous les paramètres inconnus, car l’URL est reconstruite uniquement depuis l’état reconnu ;
- sans `q`, aucune synchronisation n’a lieu : un paramètre inconnu reste donc présent dans l’URL ;
- avec une requête localement invalide, aucun GET et aucune synchronisation n’ont lieu : l’URL saisie reste affichée.

Le paramètre `page` n’est pas validé au-delà de `Number()`. Ce point produit un défaut potentiel distinct détaillé ci-dessous.

### Effets sur `localStorage`

La restauration des contrôles ne lit ni ne modifie les collections Favorites, Saved Searches ou Compare.

Une recherche deep-link réussie appelle toutefois le comportement normal de History : `fce_history` est créé ou actualisé. Cette mutation est légitime et ne doit pas être présentée comme un défaut d’isolation.

L’isolation utile consiste donc à vérifier que les stockages indépendants préexistants restent strictement inchangés, tout en acceptant l’évolution de `fce_history` correspondant à la recherche exécutée.

## Défaut potentiel

### BUG-014 — Une page URL non numérique produit une recherche et une pagination `NaN`

Avec une URL telle que :

```text
?q=Alpha&page=abc
```

le comportement actuel est :

- `Number('abc')` produit `NaN` ;
- le GET `/search` contient `page=NaN` ;
- après une réponse mockée réussie, l’URL canonique supprime `page`, car `NaN > 1` est faux ;
- l’état interne conserve néanmoins `S.page = NaN` ;
- le libellé de pagination affiche `Page NaN / …`.

L’URL affichée, l’état UI et la requête réseau deviennent contradictoires.

Oracle fonctionnel correct proposé : une page non numérique doit être ignorée ou normalisée vers la page `1`. Le GET doit utiliser `page=1`, l’URL canonique doit omettre la valeur invalide et l’interface ne doit jamais présenter `NaN`.

Le défaut ne contractualise pas une stratégie générale pour toutes les valeurs numériques hors limites. Une seule partition non numérique suffit à démontrer l’absence de validation.

Le fichier de défaut n’est pas créé à ce stade. `TC-DEEP-LINK-006` devra rester en `test.fixme` tant que le défaut est ouvert.

## Stratégie de couverture

Tous les scénarios proposés sont `UI_MOCKED`. La fonctionnalité est exclusivement frontend et les détails de restauration, de canonicalisation et d’ordre doivent être déterministes.

Aucun test API n’est justifié : l’API ne connaît pas les paramètres URL du frontend.

Aucun `E2E_REAL` n’apporte de frontière distincte : les suites Search et Filters couvrent déjà l’intégration réelle, alors que les données publiques seraient un oracle fragile pour le tri et la pagination restaurés.

## Cas de test

### TC-DEEP-LINK-001 — Restaurer un deep link complet et exécuter exactement sa recherche

- **Objectif principal** : vérifier qu’une URL complète restaure les contrôles, dérive le bon GET et applique le tri client à la page demandée.
- **Critères couverts** : `AC-01`, `AC-02`, `AC-03`, `AC-04`, `AC-05`, `AC-10`, `AC-11`, `AC-12`.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Préconditions** : stockages Favorites, Saved Searches et Compare préremplis avec de petites valeurs valides ; instrumentation ciblée de `/search` installée avant la navigation directe.
- **Données** : URL contenant `q=Alpha`, `cp=75001`, `city=Lyon`, `status=A`, `page=2`, `size=10`, `sort=name-asc` ; réponse page 2 contenant Zulu puis Bêta pour rendre le tri observable.
- **Étapes** :
  1. Installer les données locales indépendantes avant le chargement.
  2. Installer le mock et `waitForResponse` avant `page.goto()`.
  3. Ouvrir directement l’URL complète.
  4. Attendre l’unique réponse `/search`.
  5. Vérifier les contrôles restaurés, la vue, la pagination et l’ordre visible.
  6. Inspecter les paramètres du GET et l’URL canonique.
  7. Comparer les stockages indépendants et vérifier l’entrée History légitime.
- **Assertions principales** :
  - vue Recherche visible ;
  - requête, code postal, commune, statut, taille `10` et tri `name-asc` restaurés ;
  - page affichée `2` ;
  - ordre visible Bêta puis Zulu ;
  - exactement un GET ;
  - aucun mélange ou paramètre supplémentaire injustifié ;
  - Favorites, Saved Searches et Compare strictement inchangés ;
  - History contient ou actualise légitimement la recherche Alpha et ses filtres.
- **Réseau attendu** : un GET avec `q=Alpha`, `page=2`, `per_page=10`, `code_postal=75001`, `commune=Lyon`, `etat_administratif=A` ; aucun paramètre de tri ; aucune écriture API.
- **Effets sur l’URL** : URL canonique contenant `q`, `cp`, `city`, `status`, `page=2`, `size=10`, `sort=name-asc`.
- **Effets sur `localStorage`** : History peut évoluer ; les autres collections préexistantes restent inchangées.
- **Défaut associé** : aucun.
- **Limite volontaire / duplication** : une seule valeur représentative par filtre et un seul mode de tri ; ne pas redoubler leurs contrats exhaustifs.

### TC-DEEP-LINK-002 — Synchroniser et retirer les paramètres URL après interaction

- **Objectif principal** : vérifier que les interactions représentatives reconstruisent l’URL avec les paramètres utiles et omettent les valeurs par défaut.
- **Critères couverts** : `AC-06`, `AC-10`, `AC-12`.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Préconditions** : ouverture sans query params ; réponse paginée déterministe ; suivi réseau ciblé.
- **Données** : requête `Synchronisation URL`, code postal `75001`, commune `Lyon`, statut `C`, taille `10`, tri `name-desc`, puis page 2.
- **Étapes** :
  1. Ouvrir la vue Recherche sans paramètres.
  2. Renseigner les critères représentatifs et exécuter la recherche.
  3. Attendre la réponse puis vérifier l’URL.
  4. Modifier le tri et vérifier immédiatement l’URL sans attendre de requête.
  5. Naviguer vers la page 2 et attendre la réponse légitime.
  6. Cliquer sur `Réinitialiser`.
- **Assertions principales** :
  - après succès, l’URL contient `q`, `cp`, `city`, `status` et `size=10`, mais pas `page=1` ni `sort=relevance` ;
  - le tri ajoute `sort=name-desc` sans modifier les autres paramètres ;
  - la pagination ajoute `page=2` après son GET légitime ;
  - `Réinitialiser` retire tous les paramètres, remet les contrôles à leurs valeurs par défaut et ne déclenche aucun GET ;
  - l’ordre des paramètres peut être vérifié via `searchParams`, sans contractualiser la sérialisation textuelle complète.
- **Réseau attendu** : exactement deux GET, un pour la recherche initiale et un pour la page 2 ; aucun GET pour le tri ou la réinitialisation ; aucune écriture API.
- **Effets sur l’URL** : ajout, maintien puis suppression cohérente des paramètres connus ; utilisation de `replaceState` sans nouvelle entrée de recherche.
- **Effets sur `localStorage`** : History peut être actualisé par les recherches ; aucun autre stockage ne doit être touché par le tri ou la réinitialisation.
- **Défaut associé** : aucun.
- **Limite volontaire / duplication** : ne pas répéter tous les filtres, toutes les tailles, toutes les pages ou tous les tris.

### TC-DEEP-LINK-003 — Conserver un état initial propre sans requête

- **Objectif principal** : vérifier les partitions URL vide et paramètre inconnu sans requête, pour lesquelles aucun état de recherche n’est restauré.
- **Critères couverts** : `AC-08`, `AC-09`, `AC-10`, `AC-11`.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Moyenne.
- **Préconditions** : contextes indépendants ; `/search` bloqué ou instrumenté pour rendre toute régression visible.
- **Données** : partition A, URL sans query params ; partition B, URL `?source=partage` sans `q`.
- **Étapes** : pour chaque partition, ouvrir directement l’URL puis inspecter la vue, les contrôles, l’URL, le réseau et les stockages.
- **Assertions principales** :
  - vue d’accueil visible ;
  - valeurs Search par défaut lorsque les contrôles sont inspectés ;
  - état initial sans `undefined`, `null`, `[object Object]` ou exception ;
  - aucun GET `/search` ;
  - le paramètre inconnu reste présent dans la partition B, car aucune synchronisation n’a lieu sans `q`.
- **Réseau attendu** : aucun appel `/search` et aucune écriture API.
- **Effets sur l’URL** : URL vide inchangée en A ; `source=partage` conservé en B.
- **Effets sur `localStorage`** : aucune mutation.
- **Défaut associé** : aucun.
- **Limite volontaire / duplication** : les deux partitions partagent un seul TC car elles répondent à la même question d’absence de recherche.

### TC-DEEP-LINK-004 — Ignorer puis nettoyer les options invalides et paramètres inconnus

- **Objectif principal** : vérifier la canonicalisation d’un deep link exploitable contenant des options non reconnues, sans créer un test invalide par paramètre.
- **Critères couverts** : `AC-01`, `AC-02`, `AC-04`, `AC-05`, `AC-09`, `AC-10`, `AC-12`.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Moyenne.
- **Préconditions** : réponse déterministe réussie ; suivi réseau installé avant navigation.
- **Données** : URL `?q=Alpha&size=999&sort=ordre-inconnu&status=X&source=partage`, sans paramètre `page`.
- **Étapes** :
  1. Ouvrir directement l’URL.
  2. Attendre l’unique réponse `/search`.
  3. Inspecter les contrôles, le GET et l’URL après succès.
- **Assertions principales** :
  - `q=Alpha` est restauré et exécuté ;
  - taille par défaut `20`, tri `relevance` et statut vide ;
  - page par défaut `1` ;
  - aucun artefact technique ;
  - les options invalides et `source` sont absents de l’URL canonique après succès.
- **Réseau attendu** : exactement un GET avec `q=Alpha`, `page=1`, `per_page=20`, sans `etat_administratif` ni tri ; aucune écriture API.
- **Effets sur l’URL** : après succès, seule la requête utile subsiste ; les valeurs par défaut, invalides et inconnues sont supprimées par `replaceState`.
- **Effets sur `localStorage`** : History évolue légitimement ; autres stockages inchangés.
- **Défaut associé** : aucun.
- **Limite volontaire / duplication** : une combinaison compacte couvre plusieurs familles invalides sans prétendre tester toutes les valeurs possibles.

### TC-DEEP-LINK-005 — Refuser localement une requête URL inexploitable sans appel API

- **Objectif principal** : vérifier que la présence de `q` ouvre la vue Recherche mais que la validation Search reste appliquée avant tout appel réseau.
- **Critères couverts** : `AC-01`, `AC-02`, `AC-09`, `AC-10`, `AC-11`.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Moyenne.
- **Préconditions** : `/search` instrumenté ou bloqué ; History et un stockage indépendant capturés avant navigation.
- **Données** : URL contenant `q=12345678`, identifiant numérique invalide selon le contrat Search, et `cp=75001`.
- **Étapes** : ouvrir directement l’URL puis inspecter la vue, la validation, les contrôles, le réseau et l’URL.
- **Assertions principales** :
  - vue Recherche visible ;
  - requête et code postal restaurés ;
  - message exact de validation numérique Search ;
  - grille vide ;
  - aucune requête API ;
  - URL originale conservée puisqu’aucune recherche réussie ne déclenche `syncUrl()` ;
  - aucune mutation History ou autre stockage.
- **Réseau attendu** : aucun GET `/search` et aucune écriture API.
- **Effets sur l’URL** : paramètres conservés sans canonicalisation.
- **Effets sur `localStorage`** : aucune mutation.
- **Défaut associé** : aucun.
- **Limite volontaire / duplication** : ne pas répéter toutes les longueurs invalides déjà couvertes par Search ; une valeur représentative suffit pour la frontière deep link.

### TC-DEEP-LINK-006 — Normaliser une page URL non numérique

- **Objectif principal** : vérifier qu’une page non numérique ne contamine ni la requête réseau ni l’état de pagination restauré.
- **Critères couverts** : `AC-01`, `AC-03`, `AC-09`, `AC-10`, `AC-12`.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Statut proposé** : `test.fixme`.
- **Préconditions** : réponse paginée déterministe ; instrumentation installée avant navigation.
- **Données** : URL `?q=Alpha&page=abc`.
- **Étapes** :
  1. Ouvrir directement l’URL.
  2. Capturer l’unique GET `/search`.
  3. Attendre la réponse mockée.
  4. Inspecter le paramètre réseau, l’URL canonique et le libellé de pagination.
- **Oracle fonctionnel correct** :
  - la valeur non numérique est ignorée ou normalisée vers la page 1 ;
  - le GET contient `page=1` ;
  - l’URL canonique ne contient plus `page=abc` ;
  - le contrôle affiche la page 1 et aucune représentation `NaN`.
- **Comportement actuel attendu en échec** : GET avec `page=NaN`, URL sans `page` après succès mais libellé `Page NaN / …`.
- **Réseau attendu** : exactement un GET légitime après normalisation, aucun appel supplémentaire et aucune écriture API.
- **Effets sur l’URL** : suppression de la valeur invalide et omission de la page 1 par défaut.
- **Effets sur `localStorage`** : History peut évoluer légitimement ; autres stockages inchangés.
- **Défaut associé** : `BUG-014 — Une page URL non numérique produit une recherche et une pagination NaN`.
- **Limite volontaire / duplication** : ne pas ajouter un TC par valeur négative, décimale, nulle ou hors limites tant qu’aucun contrat plus précis n’est défini.

## Matrice de traçabilité

| Cas de test        | Critères couverts                                                         | Niveau      | Priorité | Statut          |
| ------------------ | ------------------------------------------------------------------------- | ----------- | -------- | --------------- |
| `TC-DEEP-LINK-001` | `AC-01`, `AC-02`, `AC-03`, `AC-04`, `AC-05`, `AC-10`, `AC-11`, `AC-12`    | `UI_MOCKED` | Haute    | Actif           |
| `TC-DEEP-LINK-002` | `AC-06`, `AC-10`, `AC-12`                                                 | `UI_MOCKED` | Haute    | Actif           |
| `TC-DEEP-LINK-003` | `AC-08`, `AC-09`, `AC-10`, `AC-11`                                        | `UI_MOCKED` | Moyenne  | Actif           |
| `TC-DEEP-LINK-004` | `AC-01`, `AC-02`, `AC-04`, `AC-05`, `AC-09`, `AC-10`, `AC-12`             | `UI_MOCKED` | Moyenne  | Actif           |
| `TC-DEEP-LINK-005` | `AC-01`, `AC-02`, `AC-09`, `AC-10`, `AC-11`                               | `UI_MOCKED` | Moyenne  | Actif           |
| `TC-DEEP-LINK-006` | `AC-01`, `AC-03`, `AC-09`, `AC-10`, `AC-12`                               | `UI_MOCKED` | Haute    | `fixme` BUG-014 |
| Non applicable     | `AC-07` : aucune navigation Back/Forward entre états créée par le produit | —           | —        | Pas de TC       |

## Risques de duplication

- Ne pas revérifier toutes les règles de validation Search.
- Ne pas tester chaque filtre ou chaque valeur de filtre depuis l’URL.
- Ne pas reprendre toutes les pages et tailles de Pagination.
- Ne pas reprendre tous les modes ou algorithmes de Sort.
- Ne pas répéter les scénarios de relance History et Saved Searches.
- Ne pas ajouter de contrôle détaillé Export : il n’intervient pas dans la restauration URL.
- Ne pas ajouter de test API ou d’`E2E_REAL` pour démontrer un contrat exclusivement frontend.
- Ne pas fabriquer un parcours Back/Forward avec `pushState`, puisque l’application ne crée pas ces entrées.

## Architecture probable pour l’implémentation future

- Spec principale : `tests/ui/specs/deep-linking/deep-linking-mocked.spec.ts`.
- POM : `tests/ui/pages/search.page.ts` devrait déjà exposer les contrôles nécessaires ; aucun ajout n’est actuellement indispensable.
- Mocks : réutilisation probable de `tests/mocks/search-results.ts` et `tests/mocks/sort-results.ts`.
- Un petit payload paginé spécifique peut rester local à la spec si utilisé par un seul TC.
- Helpers locaux possibles : construction d’URL, suivi ciblé des requêtes et projection de `URLSearchParams`.
- Aucun parser URL complexe dans le POM.
- Aucune fixture globale.
- Aucun test API.
- Aucun `E2E_REAL`.

## Fichiers probablement créés ou modifiés lors de l’implémentation

- Création probable : `tests/ui/specs/deep-linking/deep-linking-mocked.spec.ts`.
- Modification POM : probablement aucune ; uniquement si un locator réutilisable manque réellement au moment de l’implémentation.
- Nouveau mock : probablement aucun.
- Défaut futur éventuel : `defects/BUG-014-deep-link-invalid-page-produces-nan.md`, uniquement après validation et demande d’implémentation.

## Répartition finale

- Nombre total de TC proposés : 6.
- `API` : 0.
- `UI_MOCKED` : 6.
- `E2E_REAL` : 0.
- Tests actifs proposés : 5.
- `fixme` proposés : 1 (`TC-DEEP-LINK-006`, `BUG-014`).
- Défauts potentiels : 1 (`BUG-014`).

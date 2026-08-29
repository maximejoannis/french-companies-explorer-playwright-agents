# AGENTS.md

## Projet

Ce dépôt contient la suite de tests automatisés QA pour l'application :

`https://maximejoannis.github.io/french-companies-explorer-qa/`

L'application est un frontend statique HTML/CSS/JavaScript qui consomme directement l'API publique française de recherche d'entreprises :

`https://recherche-entreprises.api.gouv.fr/search`

L'API cible est publique et en lecture seule.

La stack d'automatisation utilisée est :

- Playwright Test
- TypeScript
- Playwright `APIRequestContext`
- Mocking réseau avec Playwright
- Playwright Test Agents
- Codex
- Allure
- ESLint
- Prettier

---

## Stratégie QA principale

Toujours choisir le niveau de test le plus bas qui apporte un niveau de confiance utile.

Ne pas implémenter automatiquement chaque scénario sous forme de test navigateur.

Avant de générer un test, déterminer si le comportement doit principalement être testé avec :

1. un test sur l'API réelle ;
2. un test UI avec API mockée ;
3. un test d'intégration UI + API réelle.

Éviter de tester exactement le même comportement aux trois niveaux, sauf si une raison claire liée au risque le justifie.

---

## Tests sur l'API réelle

Utiliser l'API publique réelle pour valider :

- le comportement HTTP ;
- la disponibilité de l'API ;
- les codes de statut ;
- la structure des réponses ;
- la pagination retournée par le backend ;
- les recherches gérées par le backend ;
- les filtres gérés par le backend ;
- les données métier importantes retournées par l'API ;
- les hypothèses du contrat API utilisées par le frontend.

Utiliser Playwright `APIRequestContext`.

Ne pas utiliser de test navigateur lorsque le navigateur n'apporte pas de niveau de confiance supplémentaire utile.

L'API est en lecture seule.

Ne jamais tenter de préparer ou nettoyer des données de test avec des requêtes `POST`, `PUT`, `PATCH` ou `DELETE` sur l'API cible.

Les données de l'API publique peuvent évoluer dans le temps.

Par conséquent :

- privilégier les assertions structurelles ;
- privilégier les règles métier invariantes ;
- éviter de dépendre inutilement d'une entreprise précise ;
- éviter les assertions basées sur un nombre de résultats susceptible d'évoluer ;
- éviter les hypothèses fragiles concernant l'ordre des résultats, sauf lorsque l'ordre lui-même est précisément ce que le test cherche à valider.

---

## Tests UI avec API mockée

Utiliser le mocking réseau de Playwright pour tester le comportement du frontend indépendamment des données de l'API réelle.

Utiliser notamment des mocks pour tester :

- l'absence de résultats ;
- les erreurs API ;
- les erreurs réseau ;
- les réponses lentes ;
- les états de chargement ;
- le rendu déterministe des cartes d'entreprise ;
- les statistiques déterministes ;
- le tri côté frontend ;
- les cas limites difficiles ou peu fiables à reproduire avec l'API publique.

Les mocks doivent rester volontairement petits, lisibles et compréhensibles.

Ne jamais mocker le comportement que le test cherche précisément à valider.

Si l'objectif du test est de vérifier le contrat de l'API réelle, ne pas mocker cette API.

Éviter une suite entièrement mockée qui pourrait masquer des problèmes d'intégration.

Conserver quelques tests UI + API réelle.

---

## Tests d'intégration UI + API réelle

Utiliser un nombre limité de tests navigateur avec l'API réelle pour les parcours critiques de bout en bout.

Exemples :

- effectuer une véritable recherche d'entreprise et afficher les résultats ;
- rechercher avec un SIREN ou un SIRET valide ;
- ouvrir le détail d'une entreprise provenant de vrais résultats de recherche ;
- vérifier que les données essentielles provenant de l'API sont correctement affichées dans l'interface.

Ces tests servent à vérifier que l'application navigateur et l'API fonctionnent toujours correctement ensemble.

Ne pas reproduire tous les tests API dans le navigateur.

---

## Fonctionnalités côté frontend

Les comportements suivants relèvent principalement du frontend et doivent normalement être testés au niveau UI :

- affichage des résultats ;
- tri côté client ;
- statistiques de la page courante ;
- favoris ;
- comparaison ;
- limite du nombre d'entreprises comparées ;
- historique de recherche ;
- recherches sauvegardées ;
- persistance via `localStorage` ;
- deep linking ;
- export JSON ;
- export CSV ;
- persistance du thème ;
- navigation entre les différentes vues de l'application ;
- état de chargement ;
- état sans résultat ;
- état d'erreur.

Utiliser des réponses API mockées lorsque des données déterministes améliorent réellement la fiabilité ou la lisibilité du test.

---

## Comportements spécifiques à l'application

Le champ de recherche peut contenir :

- du texte classique ;
- un SIREN de 9 chiffres ;
- un SIRET de 14 chiffres.

Un identifiant entièrement numérique d'une autre longueur est invalide et doit déclencher le comportement de validation prévu par le frontend.

Les filtres disponibles incluent :

- code postal ;
- commune ;
- statut administratif ;
- nombre de résultats par page.

Le tri est effectué côté client et propose notamment :

- pertinence ;
- nom de l'entreprise croissant ;
- nom de l'entreprise décroissant ;
- date de création la plus récente ;
- date de création la plus ancienne ;
- statut administratif.

L'application synchronise une partie importante de l'état de recherche avec les paramètres de l'URL.

Les favoris, l'historique, les comparaisons, les recherches sauvegardées et les préférences de thème utilisent `localStorage`.

La comparaison accepte au maximum trois entreprises.

L'export CSV doit protéger contre l'injection de formules dans un tableur pour les valeurs exportées commençant par :

- `=`
- `+`
- `-`
- `@`

---

## Traçabilité des exigences et couverture

La conception des tests doit partir du besoin fonctionnel avant de partir de l'interface ou de l'implémentation technique.

La chaîne de traçabilité attendue est :

```text
Besoin métier
    ↓
User Story
    ↓
Critères d'acceptation
    ↓
Cas de test
    ↓
Niveau de test
    ↓
Test automatisé
```

### User Stories

Les fonctionnalités importantes doivent pouvoir être rattachées à une User Story identifiable.

Utiliser des identifiants stables et explicites, par exemple :

- `US-SEARCH-01`
- `US-FAVORITES-01`
- `US-COMPARE-01`
- `US-HISTORY-01`
- `US-EXPORT-01`

Une User Story doit exprimer le besoin utilisateur et non décrire l'implémentation technique.

Format recommandé :

```text
En tant que <type d'utilisateur>,
je souhaite <objectif>,
afin de <valeur ou bénéfice attendu>.
```

Ne pas inventer artificiellement une User Story uniquement pour justifier un test technique.

Les tests purement techniques, tels que certains contrôles de contrat API, peuvent être rattachés à une exigence technique plutôt qu'à une User Story lorsque cela est plus pertinent.

### Critères d'acceptation

Chaque User Story doit définir des critères d'acceptation observables et vérifiables.

Utiliser des identifiants stables :

- `AC-01`
- `AC-02`
- `AC-03`

Les critères d'acceptation décrivent ce que le produit doit faire.

Ils ne doivent pas imposer inutilement la manière dont le test sera automatisé.

Un critère d'acceptation ne correspond pas obligatoirement à un seul test.

Un critère peut nécessiter plusieurs cas de test lorsque plusieurs risques ou comportements doivent être vérifiés.

Inversement, un même cas de test peut exceptionnellement contribuer à plusieurs critères lorsque le parcours utilisateur le justifie clairement.

### Cas de test

Les cas de test dérivent des critères d'acceptation et des risques identifiés.

Utiliser des identifiants explicites, par exemple :

- `TC-SEARCH-001`
- `TC-SEARCH-002`
- `TC-FAVORITES-001`

Chaque cas de test doit préciser au minimum :

- son identifiant ;
- son objectif ;
- le ou les critères d'acceptation couverts ;
- les préconditions utiles ;
- les étapes essentielles ;
- le résultat attendu ;
- le niveau de test recommandé ;
- sa priorité lorsque cela apporte de la valeur.

Le niveau de test doit être choisi parmi :

- `API`
- `UI_MOCKED`
- `E2E_REAL`

Le choix du niveau dépend du comportement réellement validé et non de la facilité avec laquelle l'agent peut générer un test navigateur.

### Couverture des critères d'acceptation

L'objectif n'est pas d'obtenir le plus grand nombre de tests.

L'objectif est d'obtenir une couverture pertinente des critères d'acceptation et des principaux risques.

Avant d'ajouter un cas de test, vérifier :

1. quel critère d'acceptation ou quel risque il couvre ;
2. si ce comportement est déjà couvert ;
3. si le nouveau test apporte une confiance supplémentaire ;
4. quel est le niveau de test le moins coûteux permettant d'obtenir cette confiance.

Éviter les doublons tels que :

```text
Même règle métier
    ├── test API
    ├── test UI mocké
    └── test E2E réel
```

lorsque les trois tests démontrent essentiellement la même chose.

Une duplication peut être conservée lorsqu'elle répond à des questions différentes.

Exemple :

```text
AC-01 : une recherche textuelle valide retourne et affiche des entreprises.

TC-SEARCH-001
Niveau : API
Question :
"L'API retourne-t-elle une réponse valide pour une recherche textuelle ?"

TC-SEARCH-002
Niveau : E2E_REAL
Question :
"L'application est-elle capable d'utiliser une vraie réponse de l'API
et d'afficher les résultats essentiels à l'utilisateur ?"
```

Ces deux tests utilisent le même parcours métier mais ne valident pas la même responsabilité.

### Matrice de traçabilité

Les plans de test doivent permettre de déterminer facilement quels critères d'acceptation sont couverts.

Format recommandé :

| Cas de test     | Critère | Niveau      | Priorité |
| --------------- | ------- | ----------- | -------- |
| `TC-SEARCH-001` | `AC-01` | `API`       | Haute    |
| `TC-SEARCH-002` | `AC-01` | `E2E_REAL`  | Haute    |
| `TC-SEARCH-003` | `AC-04` | `UI_MOCKED` | Haute    |

La matrice sert à identifier :

- les critères non couverts ;
- les couvertures redondantes ;
- la répartition entre API, UI mockée et E2E réel ;
- les scénarios critiques ;
- les opportunités de réduire le coût de la suite.

### Rôle du Planner

Lorsque tu agis comme Playwright Test Planner, ne te contente pas de transformer chaque interaction découverte dans le navigateur en scénario de test.

Pour chaque fonctionnalité analysée :

1. identifier ou lire la User Story ;
2. identifier les critères d'acceptation ;
3. explorer l'application pour comprendre son comportement réel ;
4. identifier les risques et cas limites pertinents ;
5. dériver les cas de test nécessaires ;
6. rattacher chaque cas aux critères qu'il couvre ;
7. choisir le niveau `API`, `UI_MOCKED` ou `E2E_REAL` ;
8. rechercher les doublons de couverture ;
9. signaler explicitement les critères non couverts.

Si le comportement observé dans l'application semble contredire un critère d'acceptation, ne pas modifier silencieusement le critère pour correspondre à l'application.

Signaler l'écart comme une anomalie potentielle ou comme un point nécessitant clarification.

### Rôle du Generator

Lorsque tu agis comme Playwright Test Generator, conserver la traçabilité avec le plan de test.

Le test généré doit permettre d'identifier le cas de test et le critère d'acceptation concernés sans rendre le code inutilement verbeux.

Exemple :

```ts
test('TC-SEARCH-003 @negative refuse un identifiant numérique invalide', async ({ page }) => {
  // Couvre US-SEARCH-01 / AC-04
});
```

Ne pas générer automatiquement plusieurs tests pour un même critère si cela n'apporte pas de couverture supplémentaire.

### Rôle du Healer

Lorsque tu agis comme Playwright Test Healer, préserver l'intention fonctionnelle du cas de test.

Avant toute correction, identifier :

- le cas de test concerné ;
- le critère d'acceptation couvert ;
- le comportement attendu.

Une réparation ne doit jamais modifier silencieusement le test pour le faire correspondre à un comportement de l'application qui contredit le critère d'acceptation.

Dans ce cas, signaler une régression ou une anomalie potentielle au lieu d'affaiblir le test.

## Règles de conception des tests

Un test doit répondre à une seule question claire.

Les scénarios doivent être indépendants.

Chaque test doit pouvoir être compris et exécuté sans dépendre de l'ordre d'exécution des autres tests.

Privilégier une synchronisation explicite avec le comportement de l'application.

Ne jamais utiliser arbitrairement :

```ts
await page.waitForTimeout(...);
```

lorsqu'un locator Playwright, une assertion, un événement réseau ou un état de l'application permet une synchronisation déterministe.

Privilégier notamment :

- les assertions sur les locators ;
- `expect(...).toBeVisible()` ;
- `expect.poll(...)` lorsque cela est approprié ;
- `page.waitForResponse(...)` lorsqu'une synchronisation avec une réponse réseau est réellement nécessaire.

Ne jamais utiliser `networkidle` comme stratégie générique pour déterminer que la page est prête.

Privilégier les sélecteurs accessibles dans cet ordre lorsque cela est pertinent :

1. `getByRole` ;
2. `getByLabel` ;
3. `getByText` ;
4. les attributs stables `data-testid` lorsqu'ils représentent le contrat le plus clair.

Éviter les sélecteurs CSS ou XPath liés aux détails d'implémentation, sauf nécessité.

---

## Organisation des tests

Les tests sont organisés par responsabilité et domaine fonctionnel.

Structure attendue :

```text
tests/
├── api/
│   ├── search/
│   └── contract/
│
├── ui/
│   ├── specs/
│   │   ├── search/
│   │   ├── favorites/
│   │   ├── compare/
│   │   ├── history/
│   │   ├── export/
│   │   └── navigation/
│   │
│   └── pages/
│
├── mocks/
├── fixtures/
├── helpers/
└── data/
```

Ne pas placer les tests API dans les dossiers de tests UI.

Ne pas placer les Page Objects réutilisables directement dans les fichiers de spécification.

Ne pas créer d'abstraction tant qu'elle n'apporte pas un bénéfice clair en matière de réutilisation ou de lisibilité.

---

## Page Objects

Utiliser des Page Objects pour représenter des concepts UI significatifs et des interactions réutilisables.

Les Page Objects doivent :

- exposer des actions orientées utilisateur ;
- exposer des locators significatifs ;
- éviter de contenir les assertions des tests sauf justification claire ;
- éviter de masquer le comportement important derrière de trop grosses méthodes utilitaires.

Les tests doivent rester lisibles comme des scénarios métier.

Préférer :

```ts
await searchPage.searchFor('Renault');
await expect(searchPage.results).not.toHaveCount(0);
```

à la répétition d'opérations DOM de bas niveau dans plusieurs fichiers de tests.

---

## Données de test

Séparer la logique des tests des données déterministes réutilisables.

Les fixtures de mock doivent représenter des cas métier significatifs plutôt que de grosses copies de réponses de production.

Privilégier des fixtures minimales contenant uniquement les champs nécessaires au scénario.

Ne pas copier aveuglément de gros payloads provenant de l'API réelle dans les mocks.

Maintenir les mocks cohérents avec la partie du contrat API réellement consommée par le frontend.

---

## Tags

Utiliser de manière cohérente, lorsque cela est pertinent :

- `@smoke`
- `@positive`
- `@negative`
- `@error`
- `@regression`

Ne pas ajouter inutilement des tags à tous les tests.

Les tests `@smoke` doivent constituer des vérifications rapides et critiques donnant rapidement confiance dans le fonctionnement principal de l'application.

---

## Instructions pour le Planner

Lorsque tu agis comme Playwright Test Planner :

Ne suppose pas que chaque comportement découvert nécessite un scénario E2E dans le navigateur.

Pendant l'exploration, identifier :

- les fonctionnalités métier ;
- les comportements exclusivement frontend ;
- les comportements backend/API ;
- les frontières d'intégration ;
- les modes d'échec possibles.

Pour chaque scénario proposé, indiquer le niveau de test recommandé parmi :

- `API`
- `UI_MOCKED`
- `E2E_REAL`

Éviter les couvertures redondantes.

Prioriser les scénarios selon :

- le risque métier ;
- l'impact d'un défaut ;
- le coût d'exécution ;
- la maintenabilité ;
- le caractère déterministe du scénario.

L'exploration du navigateur sert à comprendre le produit, et non à justifier le fait de tout tester dans le navigateur.

---

## Instructions pour le Generator

Lorsque tu agis comme Playwright Test Generator :

Respecter le niveau de test défini dans le plan de test.

Si le scénario est `API`, créer un test avec `APIRequestContext` plutôt qu'un test navigateur.

Si le scénario est `UI_MOCKED`, installer le mock réseau nécessaire avant la navigation ou avant le déclenchement de la requête concernée.

Si le scénario est `E2E_REAL`, utiliser l'application réelle et l'API réelle.

Ne pas transformer silencieusement un scénario API en scénario E2E.

Ne pas inventer de données de production fixes lorsque la réponse de l'API est dynamique.

Privilégier des assertions résilientes.

Respecter la structure du dépôt et réutiliser les fixtures, helpers et Page Objects existants lorsque cela est pertinent.

---

## Instructions pour le Healer

Lorsque tu agis comme Playwright Test Healer :

Corriger la cause racine plutôt que de chercher uniquement à faire passer un test en échec.

Avant de modifier une assertion, déterminer si l'échec provient :

- d'une régression de l'application ;
- d'une modification de l'API réelle ;
- de données publiques volatiles ;
- d'un changement de locator ;
- d'une mauvaise synchronisation ;
- d'une hypothèse incorrecte dans le test ;
- d'un mock devenu obsolète ;
- d'un véritable défaut dans le code d'automatisation.

Ne jamais affaiblir une assertion uniquement pour faire passer le test.

Ne jamais remplacer une synchronisation déterministe par un délai arbitraire.

Ne pas marquer automatiquement un test avec `test.fixme()` lorsque l'application semble contenir un véritable défaut.

Si le test révèle correctement un défaut probable du produit, conserver les éléments permettant de reproduire le problème et signaler le défaut suspecté.

---

## Contrôle qualité

Le code généré ou modifié doit passer les commandes suivantes :

```powershell
npm run typecheck
npm run lint
npm run format:check
npm test
```

Si le seul problème concerne le formatage :

```powershell
npm run format
```

Ne pas contourner les erreurs TypeScript ou ESLint avec des casts non sûrs, des désactivations de règles ou des exclusions trop larges sans justification technique documentée.

---

## Comportement général des agents

Avant d'effectuer des modifications importantes :

1. examiner les conventions déjà présentes dans le dépôt ;
2. réutiliser le code existant lorsque cela est pertinent ;
3. éviter les dépendances inutiles ;
4. limiter les modifications au périmètre demandé ;
5. expliquer les décisions architecturales importantes.

Ne pas modifier le dépôt de l'application French Companies Explorer.

Ce dépôt contient uniquement son projet d'automatisation QA.

Ne pas modifier les dépôts externes ou les dépôts utilisés comme références, sauf demande explicite.

L'objectif n'est pas de maximiser le nombre de tests.

L'objectif est de construire une suite de tests automatisés réduite, maintenable et fondée sur les risques, apportant un niveau de confiance élevé.

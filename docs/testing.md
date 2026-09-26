# Comprendre les tests du projet

Ce document explique simplement comment les tests sont organisés dans le projet, pourquoi certains tests utilisent des données simulées (_mocks_) et pourquoi d'autres utilisent la véritable API.

L'objectif n'est pas seulement de savoir lancer les tests, mais de comprendre **ce que chaque type de test cherche à vérifier**.

---

## 1. Pourquoi tester l'application ?

Les tests automatisés permettent de vérifier que l'application continue de fonctionner correctement après une modification du code.

Par exemple, lorsqu'un utilisateur recherche une entreprise, plusieurs choses doivent fonctionner :

1. l'utilisateur saisit sa recherche ;
2. il clique sur **Rechercher** ;
3. l'application contacte l'API ;
4. l'API renvoie des données ;
5. l'application affiche les résultats.

Un test automatisé reproduit ce comportement et vérifie que le résultat obtenu correspond au résultat attendu.

Dans ce projet, les tests UI sont réalisés avec **Playwright**.

Playwright permet de piloter automatiquement un navigateur comme le ferait un utilisateur :

```text
Ouvrir la page
      ↓
Saisir "entreprise test"
      ↓
Cliquer sur "Rechercher"
      ↓
Attendre la réponse
      ↓
Vérifier les résultats affichés
```

---

## 2. Le problème de la dépendance à une API externe

L'application utilise une API externe pour récupérer les informations des entreprises.

Le fonctionnement normal ressemble donc à ceci :

```text
Utilisateur
    ↓
Interface
    ↓
API externe
    ↓
Données
    ↓
Interface
    ↓
Utilisateur
```

Cela pose un problème lorsqu'on veut tester uniquement notre interface.

Un test peut échouer parce que :

- notre application contient un bug ;
- Internet est indisponible ;
- l'API externe est indisponible ;
- l'API répond lentement ;
- les données de l'API ont changé.

Dans ce cas, il devient difficile de savoir immédiatement si le problème vient réellement de notre application.

C'est l'une des raisons pour lesquelles certains tests utilisent des **mocks**.

---

## 3. Qu'est-ce qu'un mock ?

Un **mock** est une simulation d'un élément extérieur à ce que nous voulons tester.

Dans notre cas, nous voulons principalement tester l'interface.

Nous pouvons donc remplacer temporairement la véritable API par une API simulée dont nous contrôlons les réponses.

Au lieu d'avoir :

```text
Interface
    ↓
Vraie API
    ↓
Réponse
```

le test fait :

```text
Interface
    ↓
Playwright intercepte la requête
    ↓
Réponse préparée par le test
    ↓
Interface
```

Le navigateur et l'application restent réels.

**Seule la réponse du serveur est simulée.**

---

## 4. Une analogie simple

Imaginons que nous construisions une voiture et que nous voulions tester son compteur de vitesse.

Normalement :

```text
Voiture roule
     ↓
Capteur mesure la vitesse
     ↓
Compteur affiche 90 km/h
```

Pour tester le compteur, il n'est pas nécessaire de conduire réellement la voiture à 90 km/h.

Nous pouvons envoyer un faux signal :

```text
Faux signal : "90 km/h"
          ↓
       Compteur
          ↓
    affiche 90 km/h ?
```

Si le compteur affiche correctement `90 km/h`, nous savons que cette partie fonctionne.

Le faux signal joue ici le même rôle que notre mock.

Dans notre application :

```text
Fausse réponse API
        ↓
    Interface
        ↓
Affichage correct ?
```

---

## 5. Pourquoi mocker l'API ?

Le principal objectif est de **contrôler le scénario du test**.

Avec un mock, nous pouvons demander à Playwright :

> Fais comme si l'API avait trouvé deux entreprises.

Puis vérifier :

> L'interface affiche-t-elle bien ces deux entreprises ?

Nous pouvons également demander :

> Fais comme si l'API n'avait trouvé aucune entreprise.

Puis vérifier :

> L'interface affiche-t-elle correctement le message indiquant qu'il n'y a aucun résultat ?

Ou encore :

> Fais comme si le serveur était en panne.

Puis vérifier :

> L'utilisateur voit-il un message d'erreur compréhensible ?

Le mock nous permet donc de provoquer volontairement des situations qui seraient difficiles ou imprévisibles avec la véritable API.

---

## 6. Où se trouvent les mocks ?

Les données simulées utilisées par les tests sont principalement placées dans :

```text
tests/
└── mocks/
```

On y trouve notamment des fichiers liés à différents scénarios :

```text
tests/mocks/
├── search-results.ts
├── sort-results.ts
├── detail-results.ts
├── compare-results.ts
└── stats-results.ts
```

Par exemple, `search-results.ts` contient des entreprises fictives utilisées par les tests de recherche.

On peut ainsi préparer une réponse contenant, par exemple :

```text
ALPHA SERVICES
SIREN : 111111111
Ville : PARIS

BETA INDUSTRIE
SIREN : 222222222
Ville : LYON
```

Ces entreprises ne sont pas recherchées sur Internet pendant le test.

Elles sont fournies directement par le test.

Cela rend le résultat **prévisible et reproductible**.

---

## 7. Comment Playwright intercepte-t-il l'API ?

Playwright possède une fonctionnalité permettant d'intercepter les requêtes réseau effectuées par le navigateur.

Dans les tests, on peut rencontrer :

```ts
await page.route(API_PATTERN, async (route) => {
  // ...
});
```

`page.route()` signifie essentiellement :

> Lorsque le navigateur essaie d'appeler cette URL, intercepte la requête avant qu'elle parte réellement.

Le test peut ensuite décider de la réponse à retourner.

Par exemple :

```ts
await route.fulfill({
  status: 200,
  contentType: 'application/json',
  json: mockedSearchResponse,
});
```

Cela signifie :

> Ne contacte pas le vrai serveur.
> Réponds directement avec cette réponse.

Le code de l'application pense donc avoir reçu une véritable réponse HTTP.

---

## 8. Exemple : simuler une recherche réussie

Supposons que le test prépare deux entreprises :

```text
ALPHA SERVICES
BETA INDUSTRIE
```

Le scénario devient :

```text
Playwright prépare la fausse réponse
                ↓
Utilisateur saisit "entreprise test"
                ↓
Utilisateur clique sur "Rechercher"
                ↓
Application tente d'appeler l'API
                ↓
Playwright intercepte la requête
                ↓
Playwright renvoie ALPHA + BETA
                ↓
Application affiche les résultats
                ↓
Le test vérifie l'écran
```

Le test peut ensuite vérifier :

```text
✓ "2 résultats" est affiché
✓ ALPHA SERVICES est affichée
✓ BETA INDUSTRIE est affichée
✓ les SIREN sont affichés
✓ les villes sont affichées
✓ le bouton "Comparer" existe
✓ le bouton "Voir la fiche" existe
```

La question à laquelle répond ce test est donc :

> **Si l'API me renvoie ces entreprises, mon interface sait-elle correctement les afficher ?**

---

## 9. Simuler une recherche sans résultat

Le mock peut également renvoyer :

```json
{
  "results": [],
  "total_results": 0
}
```

Cela signifie :

> La requête s'est bien passée, mais aucune entreprise n'a été trouvée.

Le test vérifie alors que l'interface affiche correctement cet état.

Par exemple :

```text
✓ 0 résultat
✓ message "Aucune entreprise"
✓ aucune carte entreprise
✓ pagination masquée
```

C'est important car :

```text
0 résultat
```

n'est pas la même chose que :

```text
Erreur serveur
```

---

## 10. Simuler une erreur serveur

Playwright peut volontairement simuler une API en panne.

Par exemple :

```ts
await route.fulfill({
  status: 500,
  body: 'server error',
});
```

Le code HTTP `500` signifie qu'une erreur s'est produite côté serveur.

Le scénario devient :

```text
Utilisateur lance une recherche
              ↓
Application appelle l'API
              ↓
Playwright intercepte
              ↓
Playwright répond : ERREUR 500
              ↓
Application reçoit l'erreur
              ↓
Que montre l'interface ?
```

Le test vérifie alors que l'utilisateur reçoit un message adapté.

L'intérêt est important : nous n'avons pas besoin d'attendre que la véritable API tombe en panne pour vérifier le comportement de notre application.

---

## 11. Simuler une API lente

Un mock permet également de contrôler **le moment où l'API répond**.

C'est utile pour tester l'état de chargement.

Le scénario peut être :

```text
Utilisateur clique sur Rechercher
              ↓
API ne répond pas encore
              ↓
"Recherche en cours..." doit apparaître
              ↓
Le test autorise ensuite la réponse
              ↓
Les résultats apparaissent
```

Cela permet de vérifier deux moments différents :

```text
AVANT la réponse
→ état de chargement

APRÈS la réponse
→ affichage des résultats
```

Sans mock, il serait difficile de garantir que la véritable API reste suffisamment longtemps en attente pour observer l'état de chargement.

---

## 12. Vérifier qu'une requête est correctement envoyée

Les mocks ne servent pas uniquement à fabriquer des réponses.

Playwright peut également observer la requête envoyée par l'application.

Par exemple, lorsque l'utilisateur recherche :

```text
123456789
```

le test peut récupérer la valeur du paramètre `q` envoyé à l'API.

L'objectif est de vérifier :

```text
Utilisateur saisit
123456789
      ↓
Application construit la requête
      ↓
?q=123456789
```

Le test peut donc confirmer que la bonne information aurait été envoyée au serveur.

---

## 13. Vérifier qu'aucune requête n'est envoyée

Dans certains cas, l'application doit refuser une saisie avant même de contacter l'API.

Par exemple, si un numéro saisi possède une longueur invalide :

```text
Utilisateur
    ↓
12345678
    ↓
Validation de l'interface
    ↓
ERREUR
```

L'application ne devrait pas faire :

```text
12345678
    ↓
appel API inutile
```

Le test peut donc compter le nombre d'appels effectués.

Résultat attendu :

```text
Nombre d'appels API = 0
```

Cela permet de vérifier non seulement ce qui apparaît à l'écran, mais également que l'application ne fait pas de requête inutile.

---

## 14. Qu'est-ce qu'un test UI mocké ?

On peut maintenant donner une définition simple :

> **Un test UI mocké utilise le vrai navigateur et la vraie interface, mais remplace certains services externes, comme l'API, par des réponses contrôlées par le test.**

Il teste principalement :

```text
Action utilisateur
       ↓
Comportement de l'interface
       ↓
Réaction à une réponse connue
       ↓
Affichage final
```

---

## 15. Pourquoi avoir également des tests avec la vraie API ?

Les mocks ont une limite importante.

Puisque nous inventons nous-mêmes la réponse de l'API, notre mock peut devenir différent de la véritable API.

Imaginons que notre mock renvoie :

```json
{
  "results": []
}
```

mais qu'un jour la véritable API change son format :

```json
{
  "entreprises": []
}
```

Nos tests mockés pourraient continuer à fonctionner alors que l'application réelle ne fonctionne plus correctement.

C'est pour cette raison que le projet possède également des tests utilisant la véritable API.

On retrouve donc par exemple :

```text
search-mocked.spec.ts
search-real.spec.ts
```

Les deux types de tests répondent à des questions différentes.

---

## 16. Tests mockés vs tests réels

### Test mocké

```text
Interface
    ↓
Mock
```

Il répond principalement à la question :

> **Si l'API répond X, mon interface réagit-elle correctement ?**

Avantages :

- rapide ;
- prévisible ;
- reproductible ;
- permet de provoquer facilement des erreurs ;
- permet de simuler une API lente ;
- ne dépend pas d'Internet ;
- ne dépend pas de la disponibilité de l'API.

---

### Test réel

```text
Interface
    ↓
Vraie API
```

Il répond principalement à la question :

> **Mon application fonctionne-t-elle réellement avec le service externe ?**

Avantages :

- vérifie la véritable intégration ;
- permet de détecter une modification de l'API ;
- se rapproche davantage des conditions réelles d'utilisation.

En revanche, il dépend davantage de facteurs extérieurs.

---

## 17. Les deux types de tests sont complémentaires

Il ne faut donc pas penser :

```text
mock OU réel
```

mais plutôt :

```text
mock + réel
```

Ils ne cherchent pas exactement les mêmes problèmes.

Par exemple :

| Situation                                                         | Test mocké |            Test réel |
| ----------------------------------------------------------------- | ---------: | -------------------: |
| Vérifier l'affichage de 2 entreprises                             |         ✅ |             Possible |
| Simuler facilement 0 résultat                                     |         ✅ | Difficile à garantir |
| Simuler une erreur serveur                                        |         ✅ | Difficile à garantir |
| Simuler une réponse lente                                         |         ✅ | Difficile à garantir |
| Vérifier que l'API réelle fonctionne                              |         ❌ |                   ✅ |
| Vérifier que notre code comprend toujours le format réel de l'API |         ❌ |                   ✅ |

---

## 18. Le rôle des Page Objects

Les tests utilisent également des **Page Objects**.

On retrouve notamment :

```text
tests/ui/pages/
```

avec par exemple :

```text
search.page.ts
```

Un Page Object peut être vu comme le **mode d'emploi de la page pour le robot Playwright**.

Au lieu d'écrire partout :

```ts
page.getByLabel('Recherche d’entreprise');
```

ou :

```ts
page.getByRole('button', { name: 'Rechercher' });
```

on centralise ces informations dans une classe.

Le test peut ensuite utiliser des instructions plus lisibles :

```ts
searchPage.submit('entreprise test');
```

Mentalement, on peut voir :

```text
TEST
  ↓
SearchPage
  ↓
Page web
```

Le test dit **ce qu'il veut faire**.

Le Page Object sait **comment le faire dans l'interface**.

---

## 19. Organisation générale des tests

De manière simplifiée, les tests sont organisés ainsi :

```text
tests/
│
├── api/
│   └── tests liés directement à l'API
│
├── mocks/
│   └── données simulées
│
└── ui/
    │
    ├── pages/
    │   └── Page Objects
    │
    └── specs/
        └── scénarios de tests UI
```

Dans les scénarios UI, on retrouve différents domaines fonctionnels, par exemple :

```text
search/
company/
favorites/
history/
stats/
theme/
...
```

Pour la recherche, on trouve notamment :

```text
search/
├── search-mocked.spec.ts
├── search-real.spec.ts
├── filters-mocked.spec.ts
├── filters-real.spec.ts
├── pagination-mocked.spec.ts
└── sort-mocked.spec.ts
```

Cette organisation permet de distinguer clairement les scénarios testés avec des données contrôlées de ceux qui utilisent réellement les services externes.

---

## 20. Comment lire un test mocké du projet ?

Lorsqu'on découvre un test Playwright mocké, on peut le lire en cinq étapes.

### Étape 1 — Quelle situation prépare-t-on ?

Exemple :

```text
L'API va retourner deux entreprises.
```

### Étape 2 — Quelle action utilisateur est effectuée ?

Exemple :

```text
L'utilisateur recherche "entreprise test".
```

### Étape 3 — Quelle requête l'application tente-t-elle d'effectuer ?

Exemple :

```text
GET /search?q=entreprise%20test
```

### Étape 4 — Quelle réponse le mock renvoie-t-il ?

Exemple :

```text
ALPHA SERVICES
BETA INDUSTRIE
```

### Étape 5 — Que vérifie-t-on ?

Exemple :

```text
2 résultats affichés
ALPHA visible
BETA visible
boutons visibles
informations correctes
```

On retrouve donc presque toujours cette logique :

```text
PRÉPARER
   ↓
AGIR
   ↓
SIMULER
   ↓
OBSERVER
   ↓
VÉRIFIER
```

---

## 21. Schéma mental à retenir

Le fonctionnement complet d'un test UI mocké peut être résumé ainsi :

```text
┌───────────────────────┐
│      Test Playwright  │
│                       │
│ prépare une réponse   │
│ API contrôlée         │
└───────────┬───────────┘
            │
            ↓
┌───────────────────────┐
│      Navigateur       │
│                       │
│ vraie application     │
└───────────┬───────────┘
            │
            ↓
      Action utilisateur
            │
            ↓
     Appel vers l'API
            │
            ↓
┌───────────────────────┐
│      Playwright       │
│                       │
│ intercepte l'appel    │
└───────────┬───────────┘
            │
            ↓
      Fausse réponse
            │
            ↓
┌───────────────────────┐
│      Application      │
│                       │
│ traite la réponse     │
│ et met à jour l'écran │
└───────────┬───────────┘
            │
            ↓
┌───────────────────────┐
│       expect(...)     │
│                       │
│ vérifie le résultat   │
└───────────────────────┘
```

---

## 22. Les éléments importants à reconnaître dans le code

Lorsque l'on lit les tests du projet, quelques éléments permettent rapidement de comprendre ce qui se passe.

### `page.route()`

```ts
page.route(...)
```

Signifie :

> Intercepte une requête réseau correspondant à cette URL.

---

### `route.fulfill()`

```ts
route.fulfill(...)
```

Signifie :

> Réponds toi-même à la requête au lieu de laisser le vrai serveur répondre.

---

### `tests/mocks/*.ts`

Contiennent :

> Les données préparées à l'avance pour les scénarios de test.

---

### `SearchPage`

Représente :

> Les actions et les éléments de l'interface de recherche utilisés par Playwright.

---

### `expect(...)`

Signifie :

> Vérifie que ce qui s'est réellement passé correspond à ce que nous attendions.

Par exemple :

```ts
await expect(...).toBeVisible();
```

peut se lire :

> Je m'attends à ce que cet élément soit visible.

---

## 23. Exemple complet en une phrase

Un scénario peut être résumé ainsi :

> **Étant donné que l'API va retourner ALPHA SERVICES et BETA INDUSTRIE, lorsque l'utilisateur recherche "entreprise test", alors l'interface doit afficher deux résultats contenant correctement les informations de ces deux entreprises.**

Cette manière de réfléchir est utile pour comprendre les tests, même sans connaître parfaitement Playwright ou TypeScript.

---

## 24. À retenir

### Un test UI

Teste l'application du point de vue de l'utilisateur.

```text
Utilisateur → Interface → Résultat visible
```

### Un mock

Remplace une dépendance externe par quelque chose que le test contrôle.

```text
Vraie API
   ↓ remplacée par
Fausse réponse contrôlée
```

### Un test UI mocké

Combine les deux :

```text
Vrai navigateur
+
Vraie interface
+
Fausse API contrôlée
```

### Un test avec la vraie API

Teste davantage l'intégration complète :

```text
Vrai navigateur
+
Vraie interface
+
Vraie API
```

---

## Conclusion

Les tests mockés ne cherchent pas à prouver que la véritable API fonctionne.

Ils cherchent principalement à prouver que :

> **notre application réagit correctement lorsque le serveur lui fournit une situation donnée.**

Grâce aux mocks, nous pouvons créer volontairement différentes situations :

```text
Succès
Aucun résultat
Erreur
Chargement
Données particulières
```

et vérifier la réaction de l'interface pour chacune d'elles.

Les tests réels complètent ensuite cette approche en vérifiant que l'application fonctionne toujours avec la véritable API.

La phrase essentielle à retenir est donc :

> **Mocker, c'est remplacer quelque chose que l'on ne veut pas tester par une version factice que l'on contrôle, afin de mieux tester la partie qui nous intéresse.**

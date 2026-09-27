# Bilan QA de la version v1.1.1

## Résumé

L’adaptation de la suite Playwright à French Companies Explorer v1.1.1 a fait passer le projet de 84 à 133 tests automatisés.

La CI — l’exécution automatique des contrôles dans GitHub Actions — peut être verte lorsqu’elle rencontre uniquement des anomalies produit connues et temporairement acceptées. Elle reste bloquante face à un nouvel échec, un problème d’infrastructure ou la réussite imprévue d’un test déclaré en échec attendu.

Le statut obtenu est donc : **CI conforme avec anomalies connues**. Les contrôles se comportent comme prévu, mais la release — la version candidate à la livraison — n’est pas entièrement validée tant que ces anomalies restent ouvertes.

## Situation de départ

La version de référence v1.0.0 comportait :

- 84 tests Playwright ;
- 72 tests réussis ;
- 12 `test.fixme`, c’est-à-dire 12 tests volontairement désactivés à cause d’anomalies produit ;
- 6 tests directs de l’API, 75 tests de l’interface avec réponses API simulées et 3 parcours E2E avec les API réelles ;
- 14 anomalies documentées.

La version v1.1.1 a ajouté des filtres enrichis, l’autocomplétion, le partage, la comparaison jusqu’à trois entreprises et l’export configurable.

## Problèmes rencontrés

### 1. Des anomalies produit faisaient échouer la CI

Trois anomalies restent présentes :

| Anomalie | Symptôme                                                                                | Test concerné      |
| -------- | --------------------------------------------------------------------------------------- | ------------------ |
| BUG-005  | Le favori modifié depuis la fiche n’est pas reflété sur la carte de résultats           | `TC-FAVORITES-004` |
| BUG-015  | L’accueil parle encore de comparaison de deux entreprises alors que la limite est trois | `TC-SEARCH-011`    |
| BUG-016  | La réinitialisation conserve `cityCode` dans l’URL                                      | `TC-DEEP-LINK-002` |

Ces anomalies sont reproduites et documentées côté produit. Elles ne doivent toutefois pas masquer une nouvelle régression, c’est-à-dire la dégradation d’un comportement qui fonctionnait auparavant.

### 2. Un test smoke mélangeait deux responsabilités

Un test `@smoke` est un contrôle court qui vérifie rapidement qu’un parcours essentiel fonctionne.

`TC-SEARCH-010` vérifiait à la fois :

- qu’une recherche réelle fonctionnait avec l’API publique ;
- que le texte d’accueil décrivait correctement la comparaison.

Un seul échec rendait donc le diagnostic ambigu : la recherche pouvait fonctionner alors que seul le texte d’accueil était obsolète.

### 3. Des tests historiques observaient l’autocomplétion sans le vouloir

L’autocomplétion utilise aussi l’API de recherche. Elle ajoute `minimal=true` à l’URL pour demander une réponse légère destinée aux suggestions. Certains tests de favoris et de filtres comptaient ces appels comme s’ils provenaient de l’action principale testée.

Cela produisait de faux échecs : le produit respectait le résultat fonctionnel attendu, mais le test observait une requête réseau secondaire.

### 4. Un locator accessible est devenu ambigu

L’ajout de la zone qui annonce les suggestions aux technologies d’assistance a créé plusieurs éléments avec le rôle ARIA `status`. Le locator `getByRole('status')`, utilisé pour trouver un élément dans la page, ne désignait donc plus un compteur unique.

### 5. Un filtre était manipulé alors qu’il était masqué

`TC-HISTORY-007` revenait à la vue de recherche, puis tentait de changer la taille de page sans rouvrir les filtres avancés. Playwright attendait donc un contrôle toujours présent dans le document, mais masqué et inutilisable.

### 6. Le rapport confondait échec produit et échec inattendu

Le calcul initial du rapport classait tout résultat non réussi comme une régression. Il ne distinguait pas :

- un échec attendu d’une anomalie connue ;
- un échec inattendu ;
- un succès inattendu après correction du produit ;
- un test instable ou ignoré.

### 7. `TC-HISTORY-004` pouvait attendre la mauvaise réponse réseau

- **Symptôme :** le test pouvait récupérer une réponse sans paramètre `page`, puis échouer alors que la recherche relancée demandait bien `page=1`.
- **Cause :** `waitForResponse` attendait toute réponse de l’API de recherche. Une requête d’autocomplétion, envoyée à la même API avec `minimal=true`, pouvait répondre avant la recherche relancée.
- **Solution :** l’attente cible maintenant une requête `GET` vers l’URL exacte de l’API, avec `q=Alpha historique` et `minimal` différent de `true`. L’assertion stricte `page=1` reste inchangée.
- **Enseignement :** attendre le bon serveur ne suffit pas lorsque plusieurs fonctionnalités l’utilisent ; il faut identifier la requête par son intention et ses paramètres.

### 8. Le job principal pouvait sembler vert après un échec Playwright

- **Symptôme :** le job chargé de produire les rapports pouvait apparaître réussi alors que `npm test` avait échoué.
- **Cause :** `continue-on-error` laisse le workflow poursuivre son exécution afin de générer et publier les rapports, même lorsque l’étape Playwright échoue.
- **Solution :** le contrôle final lit le résultat réel des tests. Il bloque la CI et le déploiement GitHub Pages si le résultat fonctionnel, la qualité, la couverture, Allure ou les smokes cross-browser sont en échec.
- **Enseignement :** continuer après une erreur pour conserver les preuves est utile, mais une étape finale indépendante doit décider si la livraison est autorisée.

### 9. Le portail présentait les fiches historiques comme des dettes actives

- **Symptôme :** la section « Tags et défauts » affichait « 16 dettes sans fixme », ce qui pouvait laisser croire que 16 anomalies étaient encore ouvertes.
- **Cause :** le générateur comptait les 16 fiches non associées à `test.fixme`, y compris celles dont le défaut était déjà résolu. Or l’absence de `test.fixme` n’indique pas le statut d’une anomalie.
- **Solution :** le rapport lit désormais le statut documenté dans chaque fiche et affiche séparément 16 fiches historiques, 13 défauts résolus et 3 anomalies ouvertes. Une anomalie liée à `test.fail()` reste classée ouverte.
- **Enseignement :** un indicateur doit porter le nom de ce qu’il mesure réellement ; la traçabilité historique et la dette encore active sont deux informations différentes.

## Solutions apportées

### Exceptions Playwright ciblées

Les trois anomalies connues utilisent `test.fail()` avec une justification contenant leur identifiant BUG. Contrairement à `test.fixme`, qui désactive un test, `test.fail()` exécute le scénario et indique à Playwright que l’assertion ciblée doit encore échouer.

L’annotation est placée juste avant l’assertion qui démontre l’anomalie. Une panne de navigation, une mauvaise réponse simulée ou un problème d’environnement survenant avant cette assertion reste donc un échec inattendu.

Un correctif produit provoquera un **succès inattendu**. Playwright fera alors échouer la suite, ce qui imposera de retirer l’annotation et de valider réellement la correction.

### Séparation des scénarios

- `TC-SEARCH-010` continue à valider la recherche réelle.
- `TC-SEARCH-011` porte exclusivement BUG-015.
- `TC-DEEP-LINK-007` conserve les contrôles URL sains séparés de BUG-016.

Cette séparation permet de savoir immédiatement quelle responsabilité a échoué. Elle évite aussi de déclarer tout un parcours comme « attendu en échec ».

### Mocks réseau plus précis

Les tests ignorent les appels `minimal=true` lorsqu’ils mesurent les requêtes de recherche complètes. Les réponses simulées de la Geo API et de l’API Entreprises restent séparées pour que chaque test sache quel service il remplace.

Le comportement réellement testé n’est donc pas masqué par une requête auxiliaire de suggestion.

### Locators et synchronisation corrigés

- Le compteur utilise désormais `#resultCount`, un sélecteur stable qui désigne uniquement le nombre de résultats.
- Les filtres avancés sont explicitement rouverts avant interaction.
- Les réponses réseau sont attendues avec `waitForResponse` lorsque le test doit vérifier un appel précis. L’attente est installée avant l’action pour ne pas manquer une réponse rapide.
- Aucun `waitForTimeout()` — une pause fixe et fragile — ni `networkidle` — une attente générique de fin d’activité réseau — n’a été ajouté.

### Reporting et portail QA

Le script [generate-build-info.mjs](./reporting/scripts/generate-build-info.mjs) calcule séparément :

- `passed` ;
- `expectedFailed` ;
- `unexpectedFailed` ;
- `unexpectedPassed` ;
- `skipped` ;
- `flaky`.

Le portail affiche **« CI conforme avec anomalies connues »** lorsque les contrôles qualité réussissent, qu’aucun résultat inattendu n’existe et qu’au moins une anomalie connue échoue comme prévu. Ce statut décrit la conformité de l’exécution, pas l’absence de défauts dans le produit.

Le déploiement du portail dépend toujours des résultats réels des contrôles qualité, couverture, Playwright, Allure et cross-browser. `continue-on-error` conserve les rapports, mais ne transforme pas un échec en autorisation de déployer.

## Résultats v1.1.1

| Contrôle             | Résultat                                    |
| -------------------- | ------------------------------------------- |
| Chromium complet     | 133 tests conformes, dont 3 échecs attendus |
| Firefox/WebKit smoke | 6 tests conformes                           |
| Échecs inattendus    | 0                                           |
| Succès inattendus    | 0                                           |
| Tests instables      | 0                                           |
| Tests ignorés        | 0                                           |
| TypeScript           | Réussi                                      |
| ESLint               | Réussi                                      |
| Prettier             | Réussi                                      |
| Couverture           | 133 TC planifiés et automatisés             |

## Ce qui reste à corriger dans le produit

Les trois anomalies suivantes restent ouvertes :

- BUG-005 : synchronisation du favori entre fiche et carte ;
- BUG-015 : texte d’accueil incohérent avec la comparaison à trois ;
- BUG-016 : nettoyage incomplet de `cityCode` lors de la réinitialisation.

Elles sont documentées dans [defects/](./defects/). Les tests continuent de les exécuter et les présentent comme des exceptions connues, au lieu de les masquer avec `test.fixme`.

## Enseignements vulgarisés

### Un test rouge ne signifie pas toujours la même chose

Un test peut échouer parce que le produit est cassé, parce que le test est devenu obsolète, parce que l’environnement est indisponible ou parce qu’une nouvelle exigence n’est pas couverte. Il faut identifier la cause avant de modifier l’assertion.

### Une exception doit être petite et temporaire

Marquer tout un fichier comme « attendu en échec » revient à cacher les problèmes. Une bonne exception vise une seule assertion fonctionnelle, porte un identifiant de défaut et doit être retirée dès que le produit est corrigé.

### Un test doit répondre à une seule question

Si un scénario vérifie à la fois la recherche, le contenu de la page et une autre fonctionnalité, son échec devient difficile à comprendre. Séparer les questions accélère le diagnostic et protège mieux les régressions.

### Les réponses simulées doivent représenter le contexte réel

Une réponse simulée trop large peut intercepter une requête auxiliaire et donner une fausse impression de défaut. Il faut distinguer les appels qui utilisent la même API mais servent des fonctions différentes, comme les suggestions et la recherche complète.

### Une attente réseau doit décrire la requête utile

Une URL commune ne suffit pas toujours à reconnaître la réponse attendue. La méthode HTTP, la requête recherchée et les paramètres permettent d’éviter qu’un appel secondaire plus rapide soit pris pour l’action principale. L’assertion métier peut alors rester stricte au lieu d’être assouplie pour contourner un test instable.

### Les locators accessibles sont un contrat, pas un raccourci

Un rôle ARIA générique peut devenir ambigu lorsque l’interface évolue. Le locator doit représenter précisément l’élément métier observé, avec un nom accessible ou un identifiant stable lorsque cela constitue le contrat le plus clair.

### Une CI verte mesure l’inattendu

Dans une équipe qui connaît certaines anomalies, la bonne question n’est pas « y a-t-il zéro défaut produit ? », mais « un comportement nouveau et non expliqué est-il apparu ? ». Cette distinction permet de conserver une CI utile sans prétendre que le produit est parfait.

### Produire un rapport ne vaut pas validation

Une étape peut continuer après un échec afin de collecter des captures, traces et rapports utiles au diagnostic. La décision finale doit néanmoins se baser sur le résultat réel de cette étape. La conservation des preuves et l’autorisation de déployer répondent à deux besoins différents.

### Un chiffre doit être nommé selon ce qu’il mesure

Le nombre de fiches conservées raconte l’historique du projet ; le nombre d’anomalies ouvertes décrit son risque actuel. Les mélanger produit un indicateur exact sur le plan arithmétique, mais trompeur pour la décision.

## Conclusion

La migration v1.1.1 a renforcé la couverture, séparé les responsabilités des tests et rendu la CI capable de distinguer les anomalies connues des régressions inattendues.

La suite produit des résultats reproductibles sur les contrôles exécutés. La release reste toutefois **non entièrement validée** tant que BUG-005, BUG-015 et BUG-016 ne sont pas corrigés ou explicitement requalifiés.

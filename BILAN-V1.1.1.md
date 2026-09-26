# Bilan QA de la version v1.1.1

## Résumé

La migration de la suite Playwright vers French Companies Explorer v1.1.1 a permis de passer d’une suite historique de 84 tests à 133 tests automatisés.

La CI peut maintenant être verte lorsqu’elle rencontre uniquement des anomalies produit connues et temporairement acceptées. Elle reste bloquante pour tout échec inattendu, tout défaut d’infrastructure et tout succès inattendu d’un test marqué comme échec attendu.

Le statut obtenu est donc : **CI conforme avec anomalies connues**. Cela ne signifie pas que la release est exempte de défauts.

## Situation de départ

La baseline v1.0.0 comportait :

- 84 tests Playwright ;
- 72 tests passants ;
- 12 `test.fixme` liés à des anomalies produit ;
- 6 tests API, 75 tests UI mockés et 3 E2E réels ;
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

Ces anomalies sont connues, reproduites et reportées côté produit. Elles ne doivent toutefois pas masquer une nouvelle régression.

### 2. Un smoke mélangeait deux responsabilités

`TC-SEARCH-010` vérifiait à la fois :

- qu’une recherche réelle fonctionnait avec l’API publique ;
- que le texte d’accueil décrivait correctement la comparaison.

Un seul échec rendait donc ambigu le diagnostic : la recherche pouvait être correcte alors que le contenu d’accueil était obsolète.

### 3. Des tests historiques observaient l’autocomplétion sans le vouloir

L’autocomplétion utilise aussi l’API de recherche, avec le paramètre `minimal=true`. Certains tests de favoris et de filtres comptaient ces requêtes comme si elles provenaient de l’action testée.

Cela produisait de faux échecs : le produit respectait l’oracle métier, mais le test observait un trafic réseau secondaire.

### 4. Un locator accessible est devenu ambigu

L’ajout de la live region de l’autocomplétion a créé plusieurs éléments avec le rôle ARIA `status`. Un test qui utilisait un locator générique `getByRole('status')` ne savait plus quel compteur vérifier.

### 5. Un filtre était manipulé alors qu’il était masqué

`TC-HISTORY-007` revenait à la vue de recherche, mais tentait ensuite de changer la taille de page sans rouvrir les filtres avancés. Playwright attendait un élément visible qui ne pouvait pas être utilisé.

### 6. Le reporting confondait échec produit et échec inattendu

Le reporting initial comptait tout résultat non passant comme une régression. Il ne distinguait pas :

- un échec attendu d’une anomalie connue ;
- un échec inattendu ;
- un succès inattendu après correction du produit ;
- un test instable ou ignoré.

## Solutions apportées

### Exceptions Playwright ciblées

Les trois anomalies connues utilisent `test.fail()` avec une justification explicite contenant l’identifiant BUG.

L’annotation est placée juste avant l’assertion qui démontre l’anomalie. Ainsi, une panne de navigation, de mock ou d’environnement reste un échec inattendu.

Un correctif produit provoquera un **succès inattendu**. Playwright fera alors échouer la suite, ce qui imposera de retirer l’annotation et de valider réellement la correction.

### Séparation des scénarios

- `TC-SEARCH-010` continue à valider la recherche réelle.
- `TC-SEARCH-011` porte exclusivement BUG-015.
- `TC-DEEP-LINK-007` conserve les contrôles URL sains séparés de BUG-016.

Cette séparation rend le diagnostic plus lisible et évite de déclarer tout un parcours comme “attendu en échec”.

### Mocks réseau plus précis

Les tests ignorent les appels `minimal=true` lorsqu’ils mesurent le trafic de recherche métier. Les mocks Geo API et API Entreprises restent séparés.

Le comportement réellement testé n’est donc pas masqué par une requête auxiliaire de suggestion.

### Locators et synchronisation corrigés

- Le compteur utilise désormais `#resultCount`, locator stable et spécifique.
- Les filtres avancés sont explicitement rouverts avant interaction.
- Les réponses réseau sont attendues avec `waitForResponse` lorsque la réponse fait partie de l’oracle.
- Aucun `waitForTimeout()` ni `networkidle` n’a été ajouté.

### Reporting et portail QA

Le script [generate-build-info.mjs](./reporting/scripts/generate-build-info.mjs) calcule séparément :

- `passed` ;
- `expectedFailed` ;
- `unexpectedFailed` ;
- `unexpectedPassed` ;
- `skipped` ;
- `flaky`.

Le portail affiche **« CI conforme avec anomalies connues »** lorsque les contrôles qualité sont réussis, qu’il n’existe aucun résultat inattendu et qu’au moins une anomalie connue échoue comme prévu.

Le déploiement du portail dépend toujours des sorties réelles des contrôles qualité, couverture, Playwright, Allure et cross-browser.

## Résultats v1.1.1

| Contrôle             | Résultat                                    |
| -------------------- | ------------------------------------------- |
| Chromium complet     | 133 tests conformes, dont 3 échecs attendus |
| Firefox/WebKit smoke | 6 tests conformes                           |
| Échecs inattendus    | 0                                           |
| Succès inattendus    | 0                                           |
| Tests instables      | 0                                           |
| Tests ignorés        | 0                                           |
| TypeScript           | Passed                                      |
| ESLint               | Passed                                      |
| Prettier             | Passed                                      |
| Couverture           | 133 TC planifiés et automatisés             |

## Ce qui reste à corriger dans le produit

Les trois anomalies suivantes restent ouvertes :

- BUG-005 : synchronisation du favori entre fiche et carte ;
- BUG-015 : texte d’accueil incohérent avec la comparaison à trois ;
- BUG-016 : nettoyage incomplet de `cityCode` lors de la réinitialisation.

Elles sont documentées dans [defects/](./defects/). Les tests ne les masquent pas : ils les rendent visibles comme exceptions connues.

## Enseignements vulgarisés

### Un test rouge ne signifie pas toujours la même chose

Un test peut échouer parce que le produit est cassé, parce que le test est devenu obsolète, parce que l’environnement est indisponible ou parce qu’une nouvelle exigence n’est pas couverte. Il faut identifier la cause avant de modifier l’assertion.

### Une exception doit être petite et temporaire

Marquer tout un fichier comme “attendu en échec” revient à cacher les problèmes. Une bonne exception vise un seul oracle, porte un identifiant de défaut et doit être retirée dès que le produit est corrigé.

### Un test doit répondre à une seule question

Si un scénario vérifie à la fois la recherche, le contenu de la page et une autre fonctionnalité, son échec devient difficile à comprendre. Séparer les questions accélère le diagnostic et protège mieux les régressions.

### Les mocks doivent représenter le contexte réel

Un mock trop large peut intercepter une requête auxiliaire et donner une fausse impression de défaut. Il faut distinguer les appels qui ont la même URL mais des responsabilités différentes.

### Les locators accessibles sont un contrat, pas un raccourci

Un rôle ARIA générique peut devenir ambigu lorsque l’interface évolue. Le locator doit représenter précisément l’élément métier observé, avec un nom accessible ou un identifiant stable lorsque cela constitue le contrat le plus clair.

### Une CI verte mesure l’inattendu

Dans une équipe qui connaît certaines anomalies, la bonne question n’est pas “y a-t-il zéro défaut produit ?”, mais “un comportement nouveau et non expliqué est-il apparu ?”. Cette distinction permet de conserver une CI utile sans prétendre que le produit est parfait.

## Conclusion

La migration v1.1.1 a renforcé la couverture, séparé les responsabilités des tests et rendu la CI capable de distinguer les anomalies connues des régressions inattendues.

La suite est exploitable et déterministe sur les contrôles exécutés. La release reste toutefois **non entièrement validée** tant que BUG-005, BUG-015 et BUG-016 ne sont pas corrigés ou explicitement requalifiés.

# Plan de test — US-HISTORY-01

## Références

- User Story : `US-HISTORY-01`
- Baselines consultées : Recherche, Filtres, Favoris et Compare
- Application explorée : `https://maximejoannis.github.io/french-companies-explorer-qa/`

## Synthèse de l’exploration

### Surface Historique

L’utilisateur ouvre la vue avec le bouton de navigation `Historique`. La vue porte le titre `Historique de recherche` et rassemble deux sections distinctes : `HISTORIQUE` et `RECHERCHES SAUVEGARDÉES`.

Lorsque l’historique est vide, la section affiche exactement `Aucune recherche enregistrée.`. Le bouton global `Effacer` reste visible.

Chaque entrée d’historique est un `article` qui présente :

- la requête textuelle en évidence ;
- le code postal et/ou la commune, séparés par ` ·` lorsqu’ils existent ;
- `Sans filtre géographique` lorsqu’aucun de ces deux filtres n’est renseigné ;
- un bouton `Relancer`.

Le statut administratif et la date de récence ne sont pas affichés, bien qu’ils soient persistés. Aucune action de suppression individuelle n’existe. La seule action de suppression History est le bouton global `Effacer`.

### Création d’une entrée

Une entrée est ajoutée après une réponse `GET /search` réussie, juste après le traitement de la réponse, que celle-ci contienne ou non des résultats. Une recherche invalide refusée côté frontend et une erreur API ne créent pas d’entrée.

Les événements observés se comportent ainsi :

- soumission d’une recherche textuelle valide : création ou mise à jour d’une entrée ;
- soumission avec filtres : création ou mise à jour avec les filtres courants ;
- répétition volontaire de critères identiques : l’entrée existante est remplacée et replacée en tête avec une nouvelle récence ;
- pagination ou changement de taille de page : une nouvelle exécution de la recherche rafraîchit également l’entrée, alors qu’aucune nouvelle recherche utilisateur n’a été formulée ;
- tri côté client : aucune mutation de l’historique et aucune requête ;
- validation numérique invalide : aucune mutation et aucune requête ;
- réponse vide réussie : entrée créée ;
- échec API ou réseau : aucune entrée créée.

Le rafraîchissement provoqué par la pagination est retenu comme anomalie potentielle `BUG-010`.

### Identité, doublons et récence

Une entrée stocke `query`, `postalCode`, `city`, `status` et `at`. Cependant, l’identité effectivement utilisée pour la déduplication repose seulement sur :

- `query` ;
- `postalCode` ;
- `city`.

Le statut administratif est persisté et restauré, mais il n’entre pas dans la comparaison d’identité. Deux recherches qui ne diffèrent que par `A` ou `C` sont donc fusionnées et seule la plus récente subsiste. Ce comportement perd une recherche fonctionnellement distincte et constitue `BUG-009`.

Une répétition strictement identique ne crée pas de doublon : elle remplace l’ancienne occurrence et la replace en première position. Une recherche identique rejouée après d’autres recherches redevient ainsi la plus récente.

Le nombre de résultats par page, la page et le tri ne font pas partie du schéma History. Le tri est local et hors identité. La page représente une navigation au sein de la même recherche. Le produit ne restaure pas la taille de page depuis History ; cette préférence relève du contrat plus riche des recherches sauvegardées.

### Ordre et capacité

Les entrées sont affichées et stockées de la plus récente à la plus ancienne. La capacité maximale est de 12 entrées. Lorsqu’une treizième identité est ajoutée, l’entrée la plus ancienne, située en fin de collection, est évincée.

### Réutilisation

Le bouton `Relancer`, scopé dans l’article de la recherche concernée, effectue immédiatement les actions suivantes :

1. ouvre la vue Recherche ;
2. restaure la requête, le code postal, la commune et le statut ;
3. exécute automatiquement la recherche à la page 1 ;
4. émet exactement un nouveau `GET /search` avec les critères restaurés ;
5. replace l’entrée rejouée en tête avec une récence mise à jour.

Deux recherches incompatibles sont nécessaires pour contrôler que les champs d’une entrée ne sont pas mélangés à ceux d’une autre. Les futurs tests vérifieront seulement les critères restaurés et la présence de la requête légitime, sans redoubler le contrat exhaustif des paramètres déjà couvert par Recherche et Filtres.

### Persistance et état vide

L’historique est conservé dans `localStorage` sous la clé `fce_history`, sous forme de tableau JSON. Le minimum utile à contractualiser est l’identité des critères (`query`, `postalCode`, `city`, `status`) et leur ordre. Le champ temporel `at` prouve la récence, mais sa valeur exacte ne doit pas être contractualisée.

Un vrai reload dans le même contexte restaure les entrées sans requête API. Une clé absente et une valeur `[]` produisent le même état vide.

Les entrées créées par le produit contiennent toujours les propriétés attendues, avec des chaînes vides pour les critères facultatifs absents. Le cas normal sans géographie est déjà rendu par `Sans filtre géographique`, sans `undefined`, `null` ni `[object Object]`. Fabriquer une structure arbitrairement corrompue ne représenterait pas un état produit observé et n’est donc pas retenu comme scénario distinct pour `AC-10`.

### Suppression

Le bouton `Effacer` supprime immédiatement toutes les entrées History, écrit `[]` dans `fce_history` et affiche `Aucune recherche enregistrée.`. Il ne supprime pas les recherches sauvegardées de `fce_saved`. Aucun appel API n’est émis. Il n’existe ni confirmation ni suppression individuelle pour History.

### Réseau

Les opérations suivantes sont purement locales et ne déclenchent aucune lecture API :

- ouverture de la vue Historique ;
- affichage après reload ;
- tri des résultats ;
- suppression globale ;
- initialisation avec clé absente ou liste vide.

La création intervient à la suite du `GET /search` qui fournit les résultats, sans requête dédiée à History. `Relancer` déclenche légitimement un unique nouveau `GET /search`. Aucune opération History observée n’émet de `POST`, `PUT`, `PATCH` ou `DELETE` vers l’API publique.

### Accessibilité observable

Les contrôles principaux sont des boutons accessibles nommés `Historique`, `Effacer` et `Relancer`. Les entrées sont des articles, mais les boutons `Relancer` ont tous le même nom et ne mentionnent pas leur recherche dans leur nom accessible. Les futurs locators devront donc scoper `Relancer` dans l’article identifié par sa requête et ses critères visibles.

Cette limite est documentée comme observation et ne justifie pas un TC supplémentaire : l’US ne contient pas d’exigence d’accessibilité spécifique. Dans la section Saved Searches, le bouton de suppression porte uniquement le nom `×` ; cette observation devra être réévaluée dans la future US dédiée.

## Relation avec les recherches sauvegardées

Les deux fonctions partagent des concepts de critères et un mécanisme de restauration proche, mais leurs contrats sont distincts :

| Aspect           | Historique                             | Recherches sauvegardées                                      |
| ---------------- | -------------------------------------- | ------------------------------------------------------------ |
| Création         | Automatique après recherche réussie    | Explicite avec `Sauvegarder la recherche` et saisie d’un nom |
| Clé              | `fce_history`                          | `fce_saved`                                                  |
| Critères communs | requête, code postal, commune, statut  | requête, code postal, commune, statut                        |
| Données propres  | récence `at`                           | identifiant, nom utilisateur, taille de page                 |
| Réutilisation    | `Relancer`, puis recherche automatique | `Lancer`, puis recherche automatique                         |
| Suppression      | globale seulement                      | individuelle par `×`                                         |

Une `US-SAVED-SEARCH-01` distincte est recommandée. L’implémentation future pourra partager de petits helpers techniques pour lire les critères, instrumenter `/search` ou scoper une entrée, mais pas un Page Object ou un scénario unique qui masquerait les différences de création, d’identité, de suppression et de persistance.

## Stratégie de couverture

Les sept scénarios sont `UI_MOCKED`. History ne possède aucun contrat backend propre et aucun test `API` n’est justifié. Aucun `E2E_REAL` n’est ajouté : les baselines Recherche et Filtres prouvent déjà l’intégration avec l’API publique, tandis que l’identité, la récence, la capacité, la persistance et la suppression sont des responsabilités frontend nécessitant des critères déterministes.

Les mocks existants de recherche peuvent être réutilisés, car History persiste des critères et non les entreprises retournées. Des réponses minimale non vide, vide et en erreur suffisent ; aucun mock History volumineux n’est nécessaire.

## Cas de test

### TC-HISTORY-001 — Enregistrer uniquement les recherches éligibles

- **Question principale** : quels résultats d’une action de recherche créent réellement une entrée ?
- **Objectif** : vérifier qu’une recherche réussie, avec ou sans résultat, est historisée et que les actions invalides ou en échec ne le sont pas.
- **AC couverts** : `AC-01`, `AC-10`, `AC-11`.
- **Préconditions** : `fce_history` absent ; réponses mockées successives non vide, vide puis erreur ; compteur ciblé sur `/search`.
- **Étapes essentielles** :
  1. Soumettre une recherche textuelle valide avec une réponse non vide.
  2. Ouvrir Historique et vérifier son entrée et `Sans filtre géographique`.
  3. Soumettre une autre recherche valide avec une réponse vide réussie.
  4. Tenter un identifiant numérique invalide, puis une recherche dont la réponse est en erreur.
- **Attendu** : seules les deux réponses réussies créent des entrées ; chacune représente la bonne requête ; aucun texte technique n’est visible ; l’invalide ne provoque aucun GET et l’erreur ne crée aucune entrée ; aucune écriture API n’est émise.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Justification du niveau** : l’éligibilité est décidée par le frontend après la réponse ; des réponses contrôlées isolent précisément chaque branche sans retester le contrat métier de l’API.

### TC-HISTORY-002 — Distinguer les critères et gérer une répétition

- **Question principale** : l’identité et la déduplication conservent-elles chaque recherche fonctionnellement distincte ?
- **Objectif** : vérifier l’identité par requête, code postal, commune et statut, puis la règle de récence d’une répétition exacte.
- **AC couverts** : `AC-02`, `AC-03`, `AC-04`.
- **Préconditions** : historique vide ; recherches synthétiques partageant volontairement certains critères.
- **Étapes essentielles** :
  1. Exécuter le même texte avec le statut `A`, puis avec le statut `C`.
  2. Exécuter ce texte avec un code postal, puis avec une commune différente.
  3. Insérer une autre requête incompatible.
  4. Rejouer exactement l’une des identités précédentes.
- **Attendu** : chaque combinaison de requête, code postal, commune et statut subsiste exactement une fois ; la répétition exacte ne crée pas de doublon et replace seulement l’identité concernée en tête ; aucun critère d’une entrée n’écrase une autre identité.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Justification du niveau** : l’identité et l’ordre sont exclusivement locaux. Le scénario conserve l’attendu fonctionnel correct malgré `BUG-009` et devra être placé derrière `test.fixme` tant que le défaut reste ouvert.

### TC-HISTORY-003 — Conserver les douze recherches les plus récentes

- **Question principale** : la capacité conserve-t-elle exactement les entrées les plus récentes dans le bon ordre ?
- **Objectif** : vérifier l’ordre décroissant de récence, la limite de 12 et l’éviction de la plus ancienne.
- **AC couverts** : `AC-03`, `AC-07`.
- **Préconditions** : historique vide ; 13 requêtes courtes, uniques et numérotées ; réponse mockée minimale commune.
- **Étapes essentielles** : exécuter successivement les 13 recherches, puis ouvrir Historique.
- **Attendu** : exactement 12 articles sont affichés ; la recherche 13 est en tête ; les recherches suivantes suivent l’ordre inverse d’exécution ; la recherche 1, la plus ancienne, est absente ; le stockage porte le même ordre et la même capacité.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Moyenne.
- **Justification du niveau** : la capacité et l’éviction sont des règles `localStorage` déterministes sans frontière backend.

### TC-HISTORY-004 — Restaurer et relancer la bonne recherche

- **Question principale** : `Relancer` restaure-t-il intégralement l’entrée choisie et seulement celle-ci ?
- **Objectif** : détecter une restauration croisée ou partielle et vérifier la réexécution légitime.
- **AC couverts** : `AC-02`, `AC-03`, `AC-05`, `AC-11`.
- **Préconditions** : deux recherches incompatibles dans l’historique : Alpha avec code postal et statut `A`, Bêta avec commune et statut `C` ; instrumentation ciblée de `/search`.
- **Étapes essentielles** :
  1. Ouvrir Historique et identifier l’article Alpha par sa requête et son filtre visible.
  2. Cliquer sur son bouton `Relancer` scopé.
  3. Vérifier les champs Recherche, Code postal, Commune et État.
  4. Attendre la réponse mockée et rouvrir Historique.
- **Attendu** : les critères Alpha sont restaurés sans valeur Bêta ; la recherche est exécutée automatiquement à la page 1 par exactement un GET pertinent ; Alpha est replacée en tête sans doublon ; aucune écriture API n’est émise.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Justification du niveau** : le navigateur est nécessaire pour la restauration des contrôles et la mutation de récence ; le mock évite de dupliquer la validation exhaustive des paramètres backend.

### TC-HISTORY-005 — Persister l’historique après un vrai reload

- **Question principale** : les entrées créées par l’utilisateur survivent-elles à un rechargement sans requête API ?
- **Objectif** : exercer la persistance réelle dans le même contexte navigateur.
- **AC couverts** : `AC-03`, `AC-06`, `AC-11`.
- **Préconditions** : clé absente au départ ; deux recherches incompatibles créées par l’interface.
- **Étapes essentielles** :
  1. Vérifier les deux identités minimales et leur ordre dans `fce_history`.
  2. Se placer sur une URL sans recherche à restaurer et remettre le compteur réseau à zéro.
  3. Effectuer un vrai reload sans réinjecter le stockage.
  4. Ouvrir Historique.
- **Attendu** : les deux entrées et leur ordre sont restaurés ; le stockage reste cohérent ; le reload et l’ouverture History ne produisent aucun `/search` ni aucune écriture API.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Justification du niveau** : un vrai BrowserContext est requis pour prouver `localStorage`; aucune API réelle n’apporte de confiance supplémentaire.

### TC-HISTORY-006 — Initialiser et nettoyer l’état vide

- **Question principale** : les états vides initiaux et celui obtenu après nettoyage restent-ils cohérents et locaux ?
- **Objectif** : couvrir les partitions clé absente et `[]`, puis la portée exacte de `Effacer`.
- **AC couverts** : `AC-08`, `AC-09`, `AC-11`.
- **Préconditions** : partitions indépendantes A, clé `fce_history` absente ; B, clé contenant `[]` ; partition C avec deux entrées History et une recherche sauvegardée distincte dans `fce_saved`.
- **Étapes essentielles** :
  1. Pour A et B, ouvrir Historique dans un contexte propre.
  2. Pour C, cliquer sur `Effacer` après avoir vérifié les entrées existantes.
- **Attendu** : A et B affichent exactement `Aucune recherche enregistrée.`, sans article ni erreur ; C supprime toutes les entrées History, écrit `[]`, affiche immédiatement le même état vide et conserve `fce_saved` inchangé ; aucune requête API n’est nécessaire.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Moyenne.
- **Justification du niveau** : initialisation, portée de suppression et isolation des clés sont entièrement locales. La présence minimale de `fce_saved` contrôle seulement la portée de `Effacer` sans créer un TC Saved Searches.

### TC-HISTORY-007 — Ne pas modifier la récence lors d’une navigation ou d’un tri

- **Question principale** : les interactions internes aux résultats laissent-elles l’historique inchangé ?
- **Objectif** : distinguer une nouvelle recherche utilisateur d’une pagination, d’un changement de taille de page et d’un tri local.
- **AC couverts** : `AC-01`, `AC-03`, `AC-04`, `AC-11`.
- **Préconditions** : Alpha puis Bêta présentes dans l’historique ; Alpha est la recherche courante avec plusieurs pages ; ordre et identités capturés avant les interactions.
- **Étapes essentielles** :
  1. Trier les résultats Alpha et vérifier l’absence de requête et de mutation History.
  2. Passer à la page suivante et vérifier la requête de pagination nécessaire aux résultats.
  3. Modifier la taille de page et vérifier la requête nécessaire aux résultats.
  4. Ouvrir Historique.
- **Attendu** : le tri, la pagination et la taille de page ne créent pas d’entrée et ne modifient ni la récence ni l’ordre des recherches formulées par l’utilisateur ; les requêtes de résultats restent des GET ; aucune écriture API n’est émise.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Justification du niveau** : le scénario porte sur la mutation locale de History, pas sur les contrats Pagination ou Tri. Il conserve l’attendu fonctionnel correct malgré `BUG-010` et devra être placé derrière `test.fixme` tant que le défaut reste ouvert.

## Matrice de traçabilité

| Cas de test      | Critères couverts                  | Niveau      | Priorité |
| ---------------- | ---------------------------------- | ----------- | -------- |
| `TC-HISTORY-001` | `AC-01`, `AC-10`, `AC-11`          | `UI_MOCKED` | Haute    |
| `TC-HISTORY-002` | `AC-02`, `AC-03`, `AC-04`          | `UI_MOCKED` | Haute    |
| `TC-HISTORY-003` | `AC-03`, `AC-07`                   | `UI_MOCKED` | Moyenne  |
| `TC-HISTORY-004` | `AC-02`, `AC-03`, `AC-05`, `AC-11` | `UI_MOCKED` | Haute    |
| `TC-HISTORY-005` | `AC-03`, `AC-06`, `AC-11`          | `UI_MOCKED` | Haute    |
| `TC-HISTORY-006` | `AC-08`, `AC-09`, `AC-11`          | `UI_MOCKED` | Moyenne  |
| `TC-HISTORY-007` | `AC-01`, `AC-03`, `AC-04`, `AC-11` | `UI_MOCKED` | Haute    |

Tous les critères `AC-01` à `AC-11` sont couverts. Aucun scénario API ou E2E réel ne duplique les baselines Recherche, Filtres, Pagination ou Tri.

## Défauts potentiels découverts

### BUG-009 — Le statut administratif est ignoré dans l’identité de l’historique

- **Observation** : deux recherches partageant requête, code postal et commune, mais utilisant respectivement les statuts `A` et `C`, produisent une seule entrée. La seconde remplace la première.
- **Écart** : le statut est un critère réellement exécuté, persisté et restauré. Le fusionner fait perdre une recherche distincte et contredit `AC-02` et `AC-04`.
- **Attendu conservé** : les deux identités doivent subsister ; seule une répétition de tous les critères doit dédupliquer et actualiser la récence.
- **Couverture proposée** : `TC-HISTORY-002`, `UI_MOCKED`, scénario complet derrière `test.fixme` tant que le défaut reste ouvert.
- **Suite recommandée** : documenter `BUG-009` avant automatisation.

### BUG-010 — La pagination actualise artificiellement la récence de l’historique

- **Observation** : passer à la page suivante, et de manière équivalente changer la taille de page, exécute `/search` puis remplace l’entrée courante avec une nouvelle valeur de récence.
- **Écart** : ces actions naviguent au sein des résultats d’une recherche existante ; elles ne représentent pas une nouvelle formulation utilisateur. Elles peuvent donc déplacer artificiellement cette recherche devant des recherches réellement plus récentes, contrairement à `AC-01`, `AC-03` et `AC-04`.
- **Attendu conservé** : la pagination, la taille de page et le tri ne doivent ni créer d’entrée ni modifier la récence ou l’ordre History.
- **Couverture proposée** : `TC-HISTORY-007`, `UI_MOCKED`, scénario complet derrière `test.fixme` tant que le défaut reste ouvert.
- **Suite recommandée** : documenter `BUG-010` avant automatisation.

## Répartition finale

- `API` : 0
- `UI_MOCKED` : 7
- `E2E_REAL` : 0
- Total : 7 cas de test

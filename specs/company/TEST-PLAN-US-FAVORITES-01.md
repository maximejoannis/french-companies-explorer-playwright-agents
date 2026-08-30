# Plan de test — US-FAVORITES-01 — Gérer des entreprises favorites

## Périmètre et stratégie

Ce plan couvre l’ajout et le retrait depuis les surfaces réellement disponibles, l’association du favori à la bonne entreprise, la gestion de plusieurs favoris, l’absence de doublon, la vue dédiée, la persistance et la cohérence entre résultats, fiche et collection.

La fonctionnalité observée est entièrement frontend. Le plan retient **cinq cas `UI_MOCKED`**, **aucun cas `API`** et **aucun cas `E2E_REAL`**. Les objets Alpha et Bêta déjà disponibles dans les mocks de recherche sont suffisamment discriminants ; seule leur réutilisation ou une adaptation minimale de leur réponse sera nécessaire.

## Résultats de l’exploration

### Surfaces et parcours

- Chaque carte de résultat expose un bouton cœur `♥` permettant alternativement l’ajout et le retrait. Son état actif est représenté par la classe CSS `active`.
- La fiche détail expose le même bouton cœur et permet également l’ajout ou le retrait.
- La navigation principale contient un bouton **« Favoris »** qui ouvre une vue dédiée **« Mes favoris »**. Chaque carte de cette vue permet le retrait, l’ouverture de la fiche et l’ajout à la comparaison. La vue offre aussi **« Tout supprimer »**.
- La vue Favoris ne constitue pas une surface d’ajout : elle ne contient que les entreprises déjà enregistrées.
- Aucun contrôle de favori pertinent n’a été observé sur l’accueil, la comparaison ou l’historique.

### État visuel et accessibilité observable

- Après ajout depuis une carte de résultat, le cœur reçoit immédiatement la classe `active`; la carte Bêta voisine reste inactive. Après retrait depuis une carte, cette classe disparaît.
- Dans la vue Favoris, les cœurs sont rendus actifs et le retrait enlève immédiatement la carte concernée.
- Les boutons cœur n’exposent ni libellé métier, ni `aria-label`, ni `aria-pressed`, ni `title`; leur nom accessible se limite au caractère **« ♥ »**. L’état actif/inactif n’est donc pas communiqué sémantiquement aux technologies d’assistance. Ce point est tracé comme `BUG-006`.
- Dans la fiche détail, le clic modifie bien le stockage, mais le bouton cœur affiché conserve sa classe antérieure tant que la fiche n’est pas rerendue. Un ajout reste visuellement inactif et un retrait reste visuellement actif dans la fiche courante. Cette contradiction directe avec `AC-01`, `AC-02` et `AC-07` est tracée comme `BUG-005`.

### Persistance et stockage

- Le stockage principal observé est `localStorage` sous la clé **`fce_favorites`**.
- La valeur est un tableau JSON d’objets entreprise normalisés. L’identité fonctionnelle et la déduplication reposent sur `siren`. L’objet observé contient aussi les données nécessaires au rendu et à l’ouverture locale, notamment `name`, `activity`, `activityLabel`, `status`, `creation`, `legal`, `category`, `workforce`, `siret`, `address`, `postalCode`, `city` et `matchingEstablishments`.
- Les tests ne doivent contractualiser que le minimum utile : tableau JSON, unicité du `siren` choisi et quelques valeurs discriminantes nécessaires à la restauration observable. Le schéma exhaustif n’est pas une exigence de cette US.
- La clé absente et la valeur JSON `[]` produisent le même état neutre **« Aucun favori pour le moment. »**, sans erreur technique.
- Après ajout, un reload conserve `fce_favorites`; la navigation vers Favoris restaure la carte sans nouvelle recherche.
- Le code charge également une clé auxiliaire `fce_favorite_meta`, mais le parcours normal exploré avec les objets complets de recherche n’a pas eu besoin de la créer. Elle ne doit pas devenir l’oracle principal de cette US.

### Cohérence métier

- Ajouter Alpha active uniquement Alpha et laisse Bêta inactive.
- Ajouter ensuite Bêta produit deux objets distincts dans `fce_favorites`.
- Retirer Alpha conserve Bêta, puis retirer Bêta produit `[]` et l’état vide.
- L’action d’ajout est un basculement fondé sur le `siren` : si le `siren` existe déjà, l’action retire l’entrée au lieu d’en pousser une seconde. Le parcours utilisateur ne produit donc pas de doublon.
- La vue Favoris et la fiche peuvent être alimentées directement par les objets persistés. Après reload, ouvrir la fiche d’un favori ne nécessite pas de recherche API.

### Interactions réseau

- Une recherche initiale utilise bien `GET https://recherche-entreprises.api.gouv.fr/search`.
- Ajouter ou retirer un favori depuis un résultat, une fiche ou la vue Favoris ne déclenche aucune requête.
- Restaurer la collection après reload ne déclenche aucune requête API.
- Ouvrir la fiche depuis la vue Favoris réutilise l’objet stocké et ne nécessite pas de lecture API dans le parcours observé.
- Aucune écriture `POST`, `PUT`, `PATCH` ou `DELETE` vers l’API publique n’est utilisée.

## Données synthétiques prévues

Réutiliser `mockedCompanies` de `tests/mocks/search-results.ts` :

- **ALPHA SERVICES**, SIREN `111111111`, active, Paris ;
- **BETA INDUSTRIE**, SIREN `222222222`, cessée, Lyon.

Leurs SIREN, noms, statuts et localisations distincts suffisent à prouver l’association et l’absence de contamination. Pour les scénarios qui ouvrent la fiche depuis un favori, enrichir ces mêmes objets uniquement si un champ déjà consommé par la fiche manque réellement ; ne pas créer de gros payload supplémentaire.

## Cas de test

### TC-FAVORITES-001 — Associer correctement et conserver un favori unique

- **Question principale :** les actions répétées sur la carte Alpha restent-elles associées exclusivement à Alpha et conservent-elles une seule occurrence persistée ?
- **Objectif :** valider l’ajout depuis les résultats, l’association par entreprise, les mises à jour visuelles, l’unicité après un cycle ajout/retrait/réajout et l’absence d’écriture réseau.
- **AC couverts :** `AC-01`, `AC-03`, `AC-04`, `AC-09`.
- **Préconditions :** contexte navigateur vierge, clé `fce_favorites` absente, route de recherche installée avant navigation et réponse contenant Alpha puis Bêta ; compteur des requêtes API.
- **Étapes essentielles :**
  1. Rechercher un terme synthétique et attendre les deux cartes discriminantes.
  2. Relever l’état initial inactif des cœurs d’Alpha et Bêta.
  3. Activer le cœur de la carte Alpha.
  4. Vérifier immédiatement l’état actif d’Alpha et l’état toujours inactif de Bêta.
  5. Vérifier que `fce_favorites` contient exactement un objet dont le `siren` est celui d’Alpha.
  6. Retirer Alpha et vérifier son état inactif ainsi que l’absence de son `siren` dans `fce_favorites`.
  7. Ajouter de nouveau Alpha.
  8. Vérifier qu’Alpha est active, que Bêta reste inactive et que le stockage contient exactement une occurrence dont le `siren` est celui d’Alpha, sans contractualiser les autres propriétés de l’objet.
  9. Vérifier qu’aucune requête supplémentaire, et en particulier aucune écriture API, n’a été émise par ces actions.
- **Résultat attendu :** seule Alpha change d’état au fil du cycle ; Bêta reste inchangée ; le réajout laisse exactement une occurrence Alpha dans le stockage et aucune interaction réseau n’est déclenchée.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Haute.
- **Justification du niveau :** le risque porte sur le routage d’événement, l’état DOM et `localStorage`; deux résultats synthétiques prouvent l’association sans dépendance aux données publiques.

### TC-FAVORITES-002 — Gérer indépendamment plusieurs favoris jusqu’à l’état vide

- **Question principale :** plusieurs favoris restent-ils indépendants lorsque l’utilisateur en retire un puis le dernier depuis la collection ?
- **Objectif :** valider plusieurs favoris, le retrait ciblé dans la vue dédiée, la conservation de l’autre favori et l’état vide final.
- **AC couverts :** `AC-02`, `AC-03`, `AC-05`, `AC-08`, `AC-09`.
- **Préconditions :** contexte vierge ; réponse mockée Alpha/Bêta ; Alpha et Bêta ajoutées par leurs cartes ; vue Favoris non encore ouverte ; compteur réseau.
- **Étapes essentielles :**
  1. Ouvrir **« Favoris »** et vérifier une seule carte Alpha et une seule carte Bêta.
  2. Retirer Alpha depuis sa propre carte de favori.
  3. Vérifier la disparition immédiate d’Alpha, le maintien visible de Bêta et la présence exclusive de Bêta dans `fce_favorites`.
  4. Retirer Bêta depuis sa carte.
  5. Vérifier l’absence de carte, le message neutre **« Aucun favori pour le moment. »** et la valeur `[]` persistée.
  6. Vérifier qu’aucune requête n’a été déclenchée par les retraits.
- **Résultat attendu :** le retrait est ciblé, les autres favoris sont préservés et le retrait du dernier favori conduit à un état vide compréhensible, jamais à une erreur.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Haute.
- **Justification du niveau :** la collection et ses retraits sont exclusivement locaux ; un jeu de deux entreprises est la partition minimale permettant de détecter une suppression trop large.

### TC-FAVORITES-003 — Restaurer un favori après reload et le retrouver dans les vues pertinentes

- **Question principale :** un favori ajouté depuis les résultats est-il restauré après reload et reste-t-il associé au même objet entre collection et fiche, sans lecture API supplémentaire ?
- **Objectif :** valider la persistance observable, la restauration depuis la vraie clé, la cohérence résultat → collection → détail et l’autonomie réseau de l’objet stocké.
- **AC couverts :** `AC-03`, `AC-06`, `AC-07`, `AC-09`.
- **Préconditions :** contexte vierge ; réponse Alpha/Bêta ; Alpha ajoutée depuis sa carte ; Bêta non favorite ; compteur réseau remis à zéro avant reload.
- **Étapes essentielles :**
  1. Recharger l’application dans le même contexte navigateur.
  2. Vérifier que `fce_favorites` contient toujours une seule entrée portant le SIREN d’Alpha.
  3. Ouvrir **« Favoris »** et vérifier une seule carte Alpha, avec son SIREN et son état favori actif ; vérifier l’absence de Bêta.
  4. Ouvrir la fiche depuis cette carte et vérifier le nom, le SIREN et l’état favori actif d’Alpha.
  5. Vérifier qu’aucun appel `/search` n’a été nécessaire à la restauration ou à l’ouverture de cette fiche.
- **Résultat attendu :** Alpha est restaurée de manière cohérente dans la collection et la fiche à partir du stockage local, Bêta ne l’est pas et aucune lecture réseau de repli n’est effectuée.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Haute.
- **Justification du niveau :** la réponse mockée ne simule pas la persistance ; celle-ci est exercée réellement dans le contexte navigateur. Le mock sert uniquement à créer un objet initial stable.

### TC-FAVORITES-004 — Synchroniser immédiatement le cœur de la fiche détail

- **Question principale :** ajouter puis retirer un favori depuis sa fiche actualise-t-il immédiatement l’état observable de cette même fiche et les autres vues ?
- **Objectif :** couvrir la seconde surface d’action et prévenir une divergence entre stockage, fiche, résultat et collection.
- **AC couverts :** `AC-01`, `AC-02`, `AC-03`, `AC-07`, `AC-09`.
- **Préconditions :** contexte vierge ; réponse Alpha/Bêta ; Alpha non favorite ; fiche Alpha ouverte depuis sa carte ; compteur réseau.
- **Étapes essentielles :**
  1. Vérifier que le cœur de la fiche Alpha est initialement inactif.
  2. L’activer et vérifier immédiatement, sans navigation ni reload, que la fiche indique qu’Alpha est favorite.
  3. Revenir aux résultats et vérifier Alpha active et Bêta inactive ; ouvrir Favoris et vérifier l’unique carte Alpha.
  4. Revenir à la fiche Alpha, retirer le favori et vérifier immédiatement que son cœur devient inactif.
  5. Vérifier qu’Alpha disparaît de la collection, que son objet est absent de `fce_favorites` et qu’aucune requête n’a été émise.
- **Résultat attendu :** chaque action de la fiche est reflétée immédiatement sur son propre contrôle et reste cohérente dans toutes les surfaces ; seule Alpha est affectée.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Haute.
- **Justification du niveau :** la synchronisation inter-vues est un comportement DOM/état local déterministe. Ce cas est le test de non-régression de `BUG-005`.
- **Condition avant implémentation :** documenter le défaut produit. Tant que `BUG-005` reste ouvert, conserver le scénario complet avec l’attendu fonctionnel et le déclarer avec `test.fixme` plutôt que d’aligner l’oracle sur l’état visuel obsolète. Ne pas naviguer ni recharger artificiellement la fiche pour masquer le défaut.

### TC-FAVORITES-005 — Initialiser proprement une collection absente ou vide

- **Question principale :** une clé absente ou une liste JSON vide conduit-elle au même état vide utilisateur, sans erreur ni requête ?
- **Objectif :** valider les deux états initiaux explicitement demandés et éviter qu’un stockage non initialisé soit interprété comme un incident.
- **AC couverts :** `AC-08`, `AC-09`.
- **Préconditions :** deux partitions indépendantes dans des contextes frais : A, clé `fce_favorites` absente ; B, clé initialisée à `[]` avant le chargement de l’application.
- **Étapes essentielles :**
  1. Pour chaque partition, ouvrir directement la vue **« Favoris »**.
  2. Vérifier qu’aucune carte n’est rendue.
  3. Vérifier le message neutre **« Aucun favori pour le moment. »** et l’absence de message d’erreur technique.
  4. Vérifier qu’aucune requête API n’est déclenchée pour construire cet état.
- **Résultat attendu :** l’absence de clé et `[]` sont toutes deux acceptées ; la collection vide est compréhensible, stable et entièrement locale.
- **Niveau :** `UI_MOCKED`.
- **Priorité :** Moyenne.
- **Justification du niveau :** aucune donnée backend n’est nécessaire. Une route mockée de sécurité peut interdire tout accès réel et rendre toute requête inattendue immédiatement visible.

## Matrice de traçabilité

| Cas de test        | Critère(s)                                  | Niveau      | Priorité |
| ------------------ | ------------------------------------------- | ----------- | -------- |
| `TC-FAVORITES-001` | `AC-01`, `AC-03`, `AC-04`, `AC-09`          | `UI_MOCKED` | Haute    |
| `TC-FAVORITES-002` | `AC-02`, `AC-03`, `AC-05`, `AC-08`, `AC-09` | `UI_MOCKED` | Haute    |
| `TC-FAVORITES-003` | `AC-03`, `AC-06`, `AC-07`, `AC-09`          | `UI_MOCKED` | Haute    |
| `TC-FAVORITES-004` | `AC-01`, `AC-02`, `AC-03`, `AC-07`, `AC-09` | `UI_MOCKED` | Haute    |
| `TC-FAVORITES-005` | `AC-08`, `AC-09`                            | `UI_MOCKED` | Moyenne  |

## Analyse de couverture et doublons évités

- `AC-01` et `AC-02` sont couverts sur les deux surfaces d’action pertinentes, sans créer un test par simple variation d’entreprise.
- `AC-03`, `AC-04` et `AC-05` utilisent ensemble Alpha/Bêta pour répondre à des risques distincts : association, unicité et indépendance. Aucun test de schéma exhaustif du stockage n’est ajouté.
- `AC-06` et `AC-07` sont réunis dans un parcours naturel de reload puis navigation collection → fiche.
- `AC-08` est vérifié après retrait du dernier favori et, séparément, lors des deux initialisations absent/`[]`; ces partitions répondent respectivement au risque métier et au risque d’initialisation.
- `AC-09` est contrôlé par l’absence de requête autour des actions et de la restauration. Aucun test API n’est créé, car il ne validerait aucune responsabilité des favoris.
- Aucun `E2E_REAL` n’est retenu : les seules frontières API observées servent à obtenir les résultats initiaux. Les objets complets sont ensuite stockés, restaurés et ouverts localement. Les baselines Search et Detail couvrent déjà la consommation réelle de `/search`.

## Défauts potentiels et recommandations

### BUG-005 — La fiche ne reflète pas immédiatement l’ajout ou le retrait

Le clic sur le cœur de la fiche met immédiatement `fce_favorites` à jour, mais le bouton actuellement affiché conserve sa classe précédente. Le stockage et les autres vues peuvent donc indiquer le nouvel état tandis que la fiche affirme visuellement l’ancien. Cela contredit `AC-01`, `AC-02` et `AC-07`.

Documenter ce défaut avant l’implémentation de `TC-FAVORITES-004`. Tant que `BUG-005` reste ouvert, le test complet devra être placé derrière `test.fixme`, conserver le comportement attendu et ne pas masquer l’écart par une navigation ou un reload forcé.

### BUG-006 — Les boutons cœur n’ont pas de nom ni d’état accessible métier

Sur les résultats, la fiche et la collection, le bouton n’expose que **« ♥ »** comme nom accessible. Ni l’entreprise concernée ni l’action **ajouter/retirer**, ni l’état pressé ne sont communiqués. L’état n’est porté que par une classe CSS.

Ce défaut d’accessibilité n’empêche pas un utilisateur voyant de percevoir le changement sur les cartes, mais il rend le contrôle ambigu pour les technologies d’assistance. Cette US ne contient pas de critère d’acceptation accessibilité suffisamment précis pour justifier un TC ou un `test.fixme` supplémentaire. Le documenter avant automatisation. Les tests Favorites ne doivent pas inventer un libellé accessible inexistant ni utiliser un locator global fondé uniquement sur le caractère `♥` ; ils devront scoper le contrôle dans la carte ou la fiche de l’entreprise concernée. Après correction produit, privilégier un nom métier stable et/ou `aria-pressed`.

## Fichiers probablement concernés par l’implémentation future

- `tests/ui/specs/favorites/favorites-mocked.spec.ts` à créer pour les cinq scénarios ;
- `tests/ui/pages/search.page.ts` à enrichir minimalement avec des locators/actions scopés pour les cœurs, la vue Favoris et ses cartes, ou un Page Object `tests/ui/pages/favorites.page.ts` si la vue dédiée justifie cette séparation ;
- `tests/mocks/search-results.ts` à réutiliser en priorité, avec un enrichissement minimal seulement si l’ouverture de fiche l’exige ;
- aucun fichier sous `tests/api/` et aucun test réel supplémentaire.

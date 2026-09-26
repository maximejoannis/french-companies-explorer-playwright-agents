# Plan de test — US-SAVED-SEARCH-01

## Références

- User Story : `US-SAVED-SEARCH-01`
- Baselines consultées : Recherche, Filtres, Pagination et History
- Application explorée : `https://maximejoannis.github.io/french-companies-explorer-qa/`

## Synthèse de l’exploration

### Surface Saved Searches

La section `RECHERCHES SAUVEGARDÉES` apparaît dans la vue `Historique de recherche`, sous la même entrée de navigation `Historique` que l’historique automatique. Elle possède toutefois son propre conteneur et son propre stockage.

Lorsque la collection est vide, le message exact est `Aucune recherche sauvegardée.`.

Chaque entrée est un `article` présentant :

- le nom saisi par l’utilisateur ;
- la requête textuelle ;
- un bouton `Lancer` ;
- un bouton de suppression dont le nom accessible observable est uniquement `×`.

Les filtres et la taille de page ne sont pas visibles dans la liste. Ils sont néanmoins persistés et restaurés. Deux entrées portant le même nom restent distinguables par leur requête si celle-ci diffère, mais les contrôles doivent toujours être scopés dans l’article ciblé.

La création est lancée depuis la vue Recherche par le bouton `Sauvegarder la recherche`, présent dans la barre d’outils des résultats.

### Parcours de création et validation du nom

Une recherche doit avoir été exécutée et contenir au moins un résultat courant. Sans résultat disponible, l’action n’ouvre pas de dialogue et affiche `Aucune recherche à sauvegarder.`.

Après une recherche éligible, `Sauvegarder la recherche` ouvre un dialogue navigateur de type prompt :

- message : `Nom de la recherche sauvegardée :` ;
- valeur proposée : la requête courante.

La sauvegarde n’est créée qu’après cette action explicite. Exécuter une recherche modifie normalement `fce_history`, mais ne crée aucune entrée dans `fce_saved`.

Les comportements observés sur le nom sont :

- annulation ou fermeture du prompt : aucune sauvegarde ;
- chaîne vide : aucune sauvegarde ;
- espaces uniquement : sauvegarde acceptée avec un nom visuellement inexploitable ;
- nom normal : accepté tel quel ;
- espaces autour d’un nom : conservés, sans normalisation.

L’acceptation d’un nom composé uniquement d’espaces contredit le besoin d’un nom identifiable et constitue `BUG-011`. Le plan n’impose pas une normalisation générale des espaces : l’exigence minimale est de refuser un nom qui reste vide après prise en compte des espaces.

### Schéma persistant minimal

Les recherches sauvegardées utilisent `localStorage`, sous la clé `fce_saved`, avec un tableau JSON. Le minimum fonctionnel observé est :

- `id` : identité technique stable utilisée pour la suppression et conservée lors d’une mise à jour ;
- `name` : nom utilisateur ;
- `query` : requête ;
- `postalCode` : code postal ;
- `city` : commune ;
- `status` : statut administratif ;
- `pageSize` : taille de page.

Les tests ne contractualiseront ni le format ni la valeur exacte de `id`. Ils vérifieront uniquement son unicité ou sa stabilité lorsqu’elle est nécessaire à la question fonctionnelle.

### Identité et doublons

L’identité réellement implémentée repose sur l’ensemble suivant :

- requête ;
- code postal ;
- commune ;
- statut administratif ;
- taille de page.

Le nom ne fait pas partie de cette identité.

- mêmes critères et noms différents : l’entrée existante est mise à jour avec le dernier nom, conserve son identifiant et remonte en tête ; aucun dialogue de confirmation supplémentaire n’est affiché ;
- même nom et critères différents : deux entrées distinctes subsistent ;
- même nom et mêmes critères : l’entrée existante est mise à jour, sans doublon ;
- sauvegarde répétée de la même recherche : mise à jour de l’entrée unique selon la même règle.

Cette règle est cohérente avec un favori de recherche identifié par ses critères et nommé par l’utilisateur. Le plan la documente sans la confondre avec l’identité différente de History.

### Ordre et capacité

Une nouvelle entrée est ajoutée en tête. La mise à jour de critères déjà sauvegardés replace également l’entrée en tête. L’action `Lancer` ne modifie ni l’ordre ni le contenu de `fce_saved`.

La capacité maximale observée est de 12 recherches sauvegardées. La treizième identité évince la plus ancienne, située en fin de collection.

### Relance

Le bouton `Lancer`, scopé dans l’article de l’entrée concernée :

1. ouvre la vue Recherche ;
2. restaure la requête, le code postal, la commune, le statut et la taille de page ;
3. exécute automatiquement la recherche à la page 1 ;
4. émet exactement un nouveau `GET /search` avec ces critères ;
5. laisse `fce_saved` et son ordre strictement inchangés ;
6. crée ou actualise légitimement l’entrée correspondante dans `fce_history`, car une recherche est réellement réexécutée.

Deux sauvegardes incompatibles sont nécessaires pour contrôler l’absence de mélange. Le futur test vérifiera les contrôles restaurés, la page 1 et le GET légitime sans redoubler le contrat exhaustif des paramètres API.

### Persistance

Un vrai reload dans le même BrowserContext conserve les entrées, leurs noms, leurs critères et leur ordre. Le reload et l’ouverture de la vue ne nécessitent aucune lecture API.

Une clé `fce_saved` absente et une collection `[]` produisent le même état vide. La suppression de la dernière entrée produit également `[]` et `Aucune recherche sauvegardée.`.

Aucun stockage arbitrairement corrompu n’est retenu : les entrées créées par l’interface possèdent toutes les propriétés nécessaires avec des chaînes vides pour les critères facultatifs absents.

### Suppression et accessibilité

La suppression est individuelle, immédiate et sans confirmation. Elle retire l’entrée par son `id`, conserve les autres recherches sauvegardées et ne modifie pas `fce_history`. La suppression ne déclenche aucune requête API.

Le contrôle expose le rôle `button`, mais son nom accessible est uniquement `×`. Il ne possède ni `aria-label` ni `title` utile et n’identifie ni l’action ni la recherche ciblée. `AC-06` exige des contrôles suffisamment identifiables pour choisir une entrée à supprimer ; cette faiblesse est donc retenue comme `BUG-012` plutôt que comme simple observation.

Tant que le défaut reste ouvert, toute interaction fonctionnelle doit scoper le bouton `×` dans l’article identifié par le nom et la requête. Après correction, un nom accessible métier incluant l’action et le contexte de l’entrée sera préférable.

### Isolation avec History

- exécuter une recherche crée ou actualise normalement `fce_history`, mais pas `fce_saved` ;
- sauvegarder explicitement la recherche courante modifie uniquement `fce_saved` et laisse le snapshot History issu de la recherche inchangé ;
- supprimer une Saved Search ne modifie pas `fce_history` ;
- lancer une Saved Search exécute réellement une recherche et crée ou actualise donc légitimement History ;
- effacer History conserve `fce_saved`, frontière déjà couverte par `TC-HISTORY-006` et non dupliquée ici.

### Réseau

Les actions suivantes sont purement locales et ne produisent aucune lecture API :

- ouverture de la section ;
- création ou mise à jour après que la recherche courante existe déjà ;
- annulation du dialogue ;
- reload et reconstruction de la liste ;
- suppression individuelle ;
- affichage de l’état vide.

`Lancer` déclenche légitimement exactement un nouveau `GET /search`. Aucune opération Saved Searches observée n’émet de `POST`, `PUT`, `PATCH` ou `DELETE` vers l’API publique.

## Stratégie de couverture

Les sept scénarios sont `UI_MOCKED`. Saved Searches est un contrat frontend/localStorage sans backend propre. Aucun test `API` n’est justifié et aucun `E2E_REAL` n’apporterait une frontière d’intégration nouvelle par rapport aux baselines Recherche et Filtres.

Les réponses synthétiques Recherche existantes suffisent. Une réponse minimale non vide permet la création et la relance ; les règles Saved Searches ne dépendent pas du contenu métier des entreprises. Aucun mock dédié volumineux ni aucune fixture ne sont recommandés.

## Cas de test

### TC-SAVED-001 — Créer explicitement une recherche sous un nom exploitable

- **Question principale** : une sauvegarde est-elle créée uniquement après une recherche éligible et la confirmation d’un nom exploitable ?
- **Objectif** : vérifier la précondition, le dialogue, l’annulation et la validation minimale du nom sans inventer de règle supplémentaire.
- **AC couverts** : `AC-01`, `AC-02`, `AC-11`, `AC-12`.
- **Préconditions** : `fce_saved` absent ; instrumentation ciblée de `/search` ; réponse non vide pour la recherche éligible.
- **Étapes essentielles** :
  1. Cliquer sur `Sauvegarder la recherche` avant toute recherche.
  2. Exécuter une recherche non vide et vérifier que `fce_saved` reste absent.
  3. Ouvrir le prompt puis l’annuler.
  4. Recommencer avec une chaîne vide, puis avec des espaces uniquement.
  5. Saisir enfin un nom normal et confirmer.
- **Attendu** : avant une recherche éligible, le message `Aucune recherche à sauvegarder.` est affiché ; la recherche seule et l’annulation ne créent rien ; les noms vide ou composé uniquement d’espaces sont refusés ; le nom normal crée exactement une entrée associée aux critères courants ; la sauvegarde ne modifie pas davantage History et ne produit aucun GET supplémentaire ni écriture API.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Justification du niveau** : le dialogue, la validation et les deux stockages sont des responsabilités navigateur. Le scénario conserve l’attendu fonctionnel correct malgré `BUG-011` et devra être placé derrière `test.fixme` tant que le défaut reste ouvert.

### TC-SAVED-002 — Appliquer la règle d’identité indépendamment du nom

- **Question principale** : les critères, et non le nom, déterminent-ils correctement les doublons ?
- **Objectif** : vérifier les quatre combinaisons noms/critères sans mélanger les sauvegardes.
- **AC couverts** : `AC-02`, `AC-03`, `AC-05`, `AC-06`, `AC-11`, `AC-12`.
- **Préconditions** : collection vide ; recherches synthétiques Alpha et Bêta avec critères incompatibles.
- **Étapes essentielles** :
  1. Sauvegarder les critères Alpha sous `Nom Alpha`.
  2. Sauvegarder les mêmes critères sous `Alpha renommée`.
  3. Sauvegarder les critères Bêta sous le même nom `Alpha renommée`.
  4. Répéter exactement la sauvegarde Bêta.
  5. Ouvrir la section Saved Searches.
- **Attendu** : les critères Alpha restent une entrée unique, renommée et replacée en tête lors de leur mise à jour ; leur identifiant reste stable ; les critères Bêta créent une seconde entrée malgré le même nom ; la répétition exacte de Bêta ne crée pas de doublon ; chaque entrée conserve ses propres critères ; les actions de sauvegarde sont locales et History n’est pas modifié au-delà des recherches préalablement exécutées.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Justification du niveau** : identité, renommage, ordre et isolation sont exclusivement locaux et exigent des critères déterministes.

### TC-SAVED-003 — Conserver les douze sauvegardes les plus récentes

- **Question principale** : la capacité conserve-t-elle exactement les sauvegardes les plus récentes dans le bon ordre ?
- **Objectif** : vérifier l’ordre décroissant, la limite de 12 et l’éviction de la plus ancienne.
- **AC couverts** : `AC-05`, `AC-06`.
- **Préconditions** : collection vide ; 13 requêtes et noms courts, uniques et numérotés ; réponse mockée minimale commune.
- **Étapes essentielles** : exécuter et sauvegarder explicitement les 13 recherches, puis ouvrir Saved Searches.
- **Attendu** : exactement 12 articles sont affichés ; la sauvegarde 13 est en tête ; les sauvegardes 12 à 2 suivent dans l’ordre inverse de création ; la sauvegarde 1 est évincée ; `fce_saved` contient le même ensemble et le même ordre.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Moyenne.
- **Justification du niveau** : capacité et éviction sont des règles frontend déterministes sans contrat backend.

### TC-SAVED-004 — Restaurer et lancer la bonne recherche complète

- **Question principale** : `Lancer` restaure-t-il tous les critères de la sauvegarde choisie sans mélanger deux entrées ?
- **Objectif** : vérifier la requête, les filtres, la taille de page, la page de départ et les effets attendus sur les deux stockages.
- **AC couverts** : `AC-03`, `AC-04`, `AC-07`, `AC-11`, `AC-12`.
- **Préconditions** : Alpha sauvegardée avec code postal, statut `A` et taille 10 ; Bêta sauvegardée avec commune, statut `C` et taille 25 ; instrumentation ciblée de `/search`.
- **Étapes essentielles** :
  1. Ouvrir Saved Searches et identifier l’article Alpha par son nom et sa requête.
  2. Capturer `fce_saved` et l’état History.
  3. Cliquer sur `Lancer` dans l’article Alpha.
  4. Vérifier les contrôles restaurés et attendre le GET.
  5. Rouvrir la vue Historique.
- **Attendu** : la vue Recherche s’ouvre ; query Alpha, code postal Alpha, commune vide, statut `A` et taille 10 sont restaurés ; la recherche repart page 1 avec exactement un GET pertinent ; aucune valeur Bêta ne migre ; `fce_saved` et son ordre restent strictement inchangés ; History est légitimement créé ou actualisé pour Alpha ; aucune écriture API n’est émise.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Justification du niveau** : la responsabilité testée est la restauration de l’état frontend et des stockages. Le mock évite de redoubler le contrat métier de l’API.

### TC-SAVED-005 — Persister les sauvegardes après un vrai reload

- **Question principale** : les sauvegardes et leur ordre survivent-ils à un vrai reload sans lecture API ?
- **Objectif** : exercer la persistance réelle dans le même BrowserContext.
- **AC couverts** : `AC-06`, `AC-08`, `AC-12`.
- **Préconditions** : clé absente au départ ; deux sauvegardes incompatibles créées par l’interface.
- **Étapes essentielles** :
  1. Vérifier le minimum persistant utile et l’ordre dans `fce_saved`.
  2. Se placer sur une URL sans recherche à restaurer et remettre le compteur réseau à zéro.
  3. Effectuer un vrai reload sans réinjecter le stockage.
  4. Ouvrir la vue Historique.
- **Attendu** : les deux articles, leurs noms, leurs requêtes et leur ordre sont restaurés ; le stockage est identique ; le reload et l’ouverture ne provoquent aucun `/search` ni aucune écriture API.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Justification du niveau** : un vrai contexte navigateur est requis pour prouver `localStorage`; aucune donnée publique réelle n’ajoute de confiance.

### TC-SAVED-006 — Supprimer uniquement la sauvegarde ciblée

- **Question principale** : le contrôle de suppression identifiable retire-t-il uniquement la bonne sauvegarde et préserve-t-il History ?
- **Objectif** : vérifier l’accessibilité contextuelle, la portée individuelle et l’isolation de la suppression.
- **AC couverts** : `AC-06`, `AC-09`, `AC-10`, `AC-11`, `AC-12`.
- **Préconditions** : Alpha et Bêta sauvegardées ; History non vide ; compteurs réseau capturés.
- **Étapes essentielles** :
  1. Ouvrir Saved Searches et identifier l’article Bêta.
  2. Utiliser dans cet article un contrôle dont le nom accessible exprime la suppression et identifie suffisamment sa cible.
  3. Supprimer Bêta et vérifier immédiatement les deux stockages et la liste.
  4. Supprimer Alpha avec son propre contrôle.
- **Attendu** : le contrôle de chaque entrée est compréhensible et contextualisable ; Bêta seule disparaît d’abord, Alpha reste inchangée et `fce_history` reste strictement identique ; après suppression d’Alpha, `fce_saved` vaut `[]` et `Aucune recherche sauvegardée.` est affiché ; aucune requête ou écriture API n’est émise.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Justification du niveau** : rendu accessible, suppression et isolation sont locaux. Le scénario fonctionnel complet devra rester derrière `test.fixme` tant que `BUG-012` empêche d’identifier sémantiquement l’action et sa cible.

### TC-SAVED-007 — Initialiser proprement une collection absente ou vide

- **Question principale** : clé absente et collection vide produisent-elles le même état vide local ?
- **Objectif** : vérifier les deux partitions d’initialisation sans données obsolètes.
- **AC couverts** : `AC-10`, `AC-12`.
- **Préconditions** : contextes indépendants A, clé `fce_saved` absente ; B, clé contenant `[]`.
- **Étapes essentielles** : pour chaque partition, ouvrir directement la vue Historique avec `/search` bloqué ou instrumenté.
- **Attendu** : `Aucune recherche sauvegardée.` est affiché exactement ; aucun article Saved Search, aucune donnée technique et aucune erreur visible ne subsistent ; aucune requête API n’est nécessaire.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Moyenne.
- **Justification du niveau** : l’initialisation et le rendu vide sont entièrement locaux ; une structure paramétrée est acceptable si les partitions restent clairement nommées sous ce même TC.

## Matrice de traçabilité

| Cas de test    | Critères couverts                                    | Niveau      | Priorité |
| -------------- | ---------------------------------------------------- | ----------- | -------- |
| `TC-SAVED-001` | `AC-01`, `AC-02`, `AC-11`, `AC-12`                   | `UI_MOCKED` | Haute    |
| `TC-SAVED-002` | `AC-02`, `AC-03`, `AC-05`, `AC-06`, `AC-11`, `AC-12` | `UI_MOCKED` | Haute    |
| `TC-SAVED-003` | `AC-05`, `AC-06`                                     | `UI_MOCKED` | Moyenne  |
| `TC-SAVED-004` | `AC-03`, `AC-04`, `AC-07`, `AC-11`, `AC-12`          | `UI_MOCKED` | Haute    |
| `TC-SAVED-005` | `AC-06`, `AC-08`, `AC-12`                            | `UI_MOCKED` | Haute    |
| `TC-SAVED-006` | `AC-06`, `AC-09`, `AC-10`, `AC-11`, `AC-12`          | `UI_MOCKED` | Haute    |
| `TC-SAVED-007` | `AC-10`, `AC-12`                                     | `UI_MOCKED` | Moyenne  |

Tous les critères `AC-01` à `AC-12` sont couverts. Aucun scénario ne duplique le contrat backend de Recherche/Filtres ni les responsabilités propres à History.

## Défauts potentiels découverts

### BUG-011 — Un nom composé uniquement d’espaces est accepté

- **Observation** : une valeur telle que trois espaces crée une recherche sauvegardée dont le nom est visuellement vide. Les espaces autour d’un nom normal sont également conservés.
- **Écart** : `AC-02` exige un nom permettant d’identifier la recherche et `AC-01` prévoit la gestion d’un nom absent ou invalide. Une valeur uniquement composée d’espaces ne remplit pas ce besoin.
- **Attendu conservé** : annulation, chaîne vide et espaces uniquement ne doivent créer ni mettre à jour une sauvegarde ; un nom contenant des caractères significatifs reste accepté sans imposer ici une politique exhaustive de normalisation.
- **Couverture proposée** : `TC-SAVED-001`, `UI_MOCKED`, scénario complet derrière `test.fixme` tant que le défaut reste ouvert.
- **Suite recommandée** : documenter `BUG-011` avant automatisation.

### BUG-012 — Le bouton de suppression n’expose que `×` comme nom accessible

- **Observation** : chaque bouton de suppression a pour nom accessible `×`, sans `aria-label`, `title` ni référence à la recherche concernée.
- **Écart** : l’utilisateur d’une technologie d’assistance ne peut pas comprendre l’action ni distinguer la cible, alors que `AC-06` exige des contrôles suffisamment identifiables et `AC-09` une suppression ciblée.
- **Attendu conservé** : le contrôle doit exposer un nom accessible compréhensible pour la suppression et permettre d’identifier la sauvegarde concernée. La portée fonctionnelle reste une seule entrée.
- **Couverture proposée** : `TC-SAVED-006`, `UI_MOCKED`, scénario complet derrière `test.fixme` tant que le défaut reste ouvert.
- **Suite recommandée** : documenter `BUG-012` avant automatisation ; avant correction, tout locator d’exploration doit scoper `×` dans l’article ciblé.

## Répartition finale

- `API` : 0
- `UI_MOCKED` : 7
- `E2E_REAL` : 0
- Total : 7 cas de test

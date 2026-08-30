# Plan de test — US-COMPARE-01

## Références

- User Story : `US-COMPARE-01`
- Baselines consultées pour éviter les doublons : Recherche, Détail et Favoris
- Application explorée : `https://maximejoannis.github.io/french-companies-explorer-qa/`

## Synthèse de l'exploration

### Surfaces et contrôles de sélection

Une entreprise peut être ajoutée à la comparaison depuis trois surfaces :

- une carte de résultat, avec le bouton `Comparer` de la carte ;
- la fiche détail, avec le bouton `Comparer` de la fiche ;
- une carte de la vue `Mes favoris`, avec le bouton `Comparer` de cette carte.

Aucune autre surface pertinente n'a été observée. L'ajout produit immédiatement le message `Ajoutée à la comparaison.`. Le bouton à l'origine de l'action conserve toutefois le libellé `Comparer`, la même classe visuelle et ne publie ni état `aria-pressed` ni état désactivé. L'état sélectionné reste observable par le message puis dans la vue Comparaison.

Une seconde tentative d'ajout de la même entreprise ne crée pas de doublon, ouvre la vue Comparaison et affiche `Déjà dans la comparaison.`. L'identité utilisée pour cette unicité est le SIREN.

### Limite de sélection

La collection accepte au maximum trois entreprises. Une tentative d'ajout d'une quatrième entreprise :

- n'ajoute ni ne remplace aucune entreprise ;
- conserve les trois sélections existantes ;
- ouvre la vue Comparaison ;
- affiche `La comparaison est limitée à trois entreprises.`.

Les boutons `Comparer` ne sont pas désactivés une fois la limite atteinte : la limite est appliquée au moment de l'action.

### Vue Comparaison

La vue est ouverte avec l'entrée de navigation `Comparer`.

- Avec zéro sélection, elle affiche `Ajoute jusqu’à trois entreprises pour les comparer.`.
- Avec une sélection, elle affiche un panneau `ENTREPRISE 1`, le nom, le SIREN, un bouton `Retirer` et `Ajoute une seconde entreprise.`. Le tableau comparatif n'est pas encore affiché.
- Avec deux ou trois sélections, elle affiche un panneau numéroté par entreprise et un tableau dont les colonnes portent les noms des entreprises.

Les lignes réellement affichées sont :

- `SIREN` ;
- `Statut` ;
- `Activité` ;
- `Ville` ;
- `Code postal` ;
- `Création` ;
- `Catégorie` ;
- `Effectif`.

Chaque valeur doit être vérifiée dans la colonne de l'entreprise correspondante. Le bouton `Retirer` d'un panneau supprime uniquement cette entreprise, conserve les autres et reconstruit immédiatement le tableau.

Les valeurs absentes sont généralement présentées par `—`, `Non renseignée` ou `Non renseigné` selon le champ. Une anomalie est néanmoins observée pour le statut administratif absent : il est présenté comme `Cessée` au lieu d'une valeur neutre.

### Persistance

La sélection est persistée dans `localStorage`, sous la clé `fce_compare`, sous forme de tableau JSON. Le minimum utile au contrat de test est :

- le SIREN, qui porte l'identité et l'unicité ;
- les données déjà normalisées nécessaires à la reconstruction des panneaux et du tableau.

Le plan ne contractualise pas la totalité des propriétés stockées. Une clé absente et une collection `[]` produisent toutes deux l'état vide. Un rechargement restaure la sélection, et la vue Comparaison peut être reconstruite uniquement depuis ces données persistées.

### Réseau

L'ajout, la tentative de doublon, le refus d'une quatrième entreprise, le retrait, l'ouverture de Comparaison et sa restauration depuis `fce_compare` sont locaux. Aucune lecture `/search` ni autre lecture API n'est nécessaire pour construire la vue à partir du stockage. Aucune action Compare observée n'émet de `POST`, `PUT`, `PATCH` ou `DELETE` vers l'API Recherche d'Entreprises.

Les futures assertions réseau distingueront la requête `GET /search` nécessaire à la préparation des cartes des actions Compare elles-mêmes.

### Accessibilité observable

Les contrôles d'ajout sont des boutons dont le nom accessible est `Comparer`, mais ils n'exposent pas l'état sélectionné avec `aria-pressed` ou un équivalent. Les boutons de retrait ont tous le nom accessible générique `Retirer`, sans inclure l'entreprise concernée.

Cette faiblesse est conservée comme observation : aucun AC de cette US ne définit une exigence d'accessibilité assez précise pour justifier un TC ou un défaut distinct. Les tests devront d'abord scoper le contrôle dans la carte, la fiche ou le panneau de l'entreprise concernée. Une évolution vers un état sémantique et un nom de retrait contextualisé améliorerait l'interface et les locators.

## Stratégie de couverture

Compare est une fonctionnalité frontend fondée sur des objets issus de la recherche puis persistés localement. Les six scénarios sont donc `UI_MOCKED`. Aucun test `API` n'est justifié, car Compare n'introduit aucun contrat backend. Aucun `E2E_REAL` n'est ajouté : les baselines Recherche et Détail couvrent déjà l'intégration avec l'API publique, tandis que les responsabilités propres à Compare sont locales et demandent des données déterministes.

Un mock Compare dédié est recommandé avec quatre entreprises synthétiques et discriminantes : Alpha, Bêta, Gamma et Delta. Leurs SIREN et leurs valeurs de comparaison doivent être tous différents. Une variante minimale doit omettre les champs facultatifs de Delta afin de contrôler les valeurs absentes sans déformer les mocks Recherche ou Favoris.

## Cas de test

### TC-COMPARE-001 — Sélection ciblée et absence de doublon depuis les résultats

- **Question principale** : l'ajout répété d'Alpha sélectionne-t-il exactement la bonne entreprise, une seule fois ?
- **Objectif** : vérifier l'association par SIREN, le retour immédiat et l'unicité de la sélection.
- **AC couverts** : `AC-01`, `AC-03`, `AC-04`, `AC-12`.
- **Préconditions** : clé `fce_compare` absente ; recherche mockée contenant Alpha et Bêta ; instrumentation des seules requêtes vers l'API Recherche d'Entreprises.
- **Étapes essentielles** :
  1. Rechercher les entreprises et identifier chaque carte par son nom et son SIREN.
  2. Ajouter Alpha depuis le bouton `Comparer` scopé dans sa carte.
  3. Vérifier le message d'ajout et ouvrir la vue Comparaison.
  4. Vérifier la présentation d'une seule entreprise et l'invite à en ajouter une seconde.
  5. Revenir aux résultats par le parcours utilisateur et tenter d'ajouter Alpha une seconde fois.
- **Résultats attendus** : Alpha apparaît exactement une fois avec son SIREN ; Bêta n'est pas sélectionnée ; `fce_compare` contient exactement une occurrence du SIREN Alpha ; la seconde action affiche `Déjà dans la comparaison.` sans doublon ; aucune requête supplémentaire et aucune écriture API ne sont émises par les actions Compare.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Justification** : l'identité, le stockage et le rendu sont des responsabilités frontend ; deux entreprises synthétiques rendent une erreur d'association immédiatement visible.

### TC-COMPARE-002 — Sélection depuis les surfaces supportées et limite maximale

- **Question principale** : toutes les surfaces supportées alimentent-elles la même sélection, sans dépasser trois entreprises ?
- **Objectif** : vérifier l'ajout depuis les résultats, la fiche détail et les favoris, puis le refus cohérent d'une quatrième entreprise.
- **AC couverts** : `AC-01`, `AC-03`, `AC-05`, `AC-06`, `AC-08`, `AC-12`.
- **Préconditions** : stockage Compare vide ; réponse mockée avec Alpha, Bêta, Gamma et Delta ; Gamma préparée comme favorite par le parcours utilisateur ; compteurs réseau ciblés.
- **Étapes essentielles** :
  1. Ajouter Alpha depuis sa carte de résultat.
  2. Ouvrir la fiche Bêta et l'ajouter depuis cette fiche.
  3. Ouvrir `Mes favoris` et ajouter Gamma depuis sa carte favorite.
  4. Vérifier dans Comparaison les trois entreprises, chacune une seule fois et avec le bon SIREN.
  5. Depuis une surface naturelle, tenter d'ajouter Delta comme quatrième entreprise.
- **Résultats attendus** : les ajouts des trois surfaces convergent immédiatement vers la même collection ; Alpha, Bêta et Gamma sont conservées ; Delta n'est pas ajoutée ; aucun remplacement ne se produit ; le message `La comparaison est limitée à trois entreprises.` est visible ; le stockage contient exactement les trois SIREN attendus ; les actions locales ne déclenchent aucune lecture supplémentaire ni écriture API.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Justification** : le mock permet de contrôler les quatre identités et d'atteindre la limite sans dépendre de données publiques. Le scénario ne reteste pas le fonctionnement propre des favoris ou du détail, seulement leur intégration à la collection Compare.

### TC-COMPARE-003 — Association des colonnes et retrait ciblé

- **Question principale** : les valeurs et le retrait restent-ils associés à la bonne entreprise ?
- **Objectif** : détecter une inversion de colonnes, une fuite de valeur entre entreprises ou une suppression trop large.
- **AC couverts** : `AC-02`, `AC-03`, `AC-07`, `AC-08`.
- **Préconditions** : Alpha, Bêta et Gamma sélectionnées par le parcours utilisateur ; chaque champ comparé possède une valeur discriminante.
- **Étapes essentielles** :
  1. Ouvrir Comparaison et identifier chaque panneau par le nom et le SIREN.
  2. Vérifier les en-têtes Alpha, Bêta et Gamma.
  3. Pour chacune des huit lignes, vérifier les valeurs dans la colonne de l'entreprise concernée.
  4. Retirer Bêta avec le bouton `Retirer` scopé dans son panneau.
  5. Vérifier immédiatement les panneaux, les colonnes et le stockage restants.
- **Résultats attendus** : aucune valeur d'Alpha, Bêta ou Gamma n'est attribuée à une autre colonne ; Bêta seule disparaît ; Alpha et Gamma gardent leurs valeurs et leur ordre relatif ; `fce_compare` conserve uniquement leurs SIREN ; le retrait ne provoque aucune requête réseau.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Justification** : les données volontairement incompatibles donnent un oracle déterministe sur l'association et la suppression, qui sont exclusivement locales.

### TC-COMPARE-004 — Persistance et restauration après rechargement

- **Question principale** : une sélection réalisée par l'utilisateur est-elle réellement restaurée après reload sans lecture API ?
- **Objectif** : exercer la persistance réelle dans un même contexte navigateur et la reconstruction locale de la vue.
- **AC couverts** : `AC-03`, `AC-09`, `AC-12`.
- **Préconditions** : clé absente au départ ; réponse mockée avec Alpha et Bêta ; instrumentation de `/search` et des méthodes d'écriture vers l'API.
- **Étapes essentielles** :
  1. Ajouter Alpha et Bêta par l'interface.
  2. Vérifier uniquement l'état persistant minimal : une occurrence de chaque SIREN.
  3. Se placer sur une URL sans recherche à restaurer, remettre les compteurs pertinents à zéro et recharger réellement la page sans réinjecter le stockage.
  4. Ouvrir Comparaison.
- **Résultats attendus** : Alpha et Bêta sont restaurées avec leurs identités et valeurs correctement associées ; `fce_compare` reste cohérent ; aucune requête `/search` ou autre lecture API n'est nécessaire à la restauration ou à l'ouverture ; aucune écriture API n'est émise.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Justification** : seul un navigateur permet de vérifier le cycle `localStorage` et reload ; l'API mockée isole ce comportement de la restauration éventuelle d'une recherche par URL.

### TC-COMPARE-005 — Initialisation vide sans dépendance API

- **Question principale** : les deux partitions d'absence de sélection produisent-elles le même état vide fonctionnel ?
- **Objectif** : vérifier une initialisation robuste lorsque la clé est absente ou contient `[]`.
- **AC couverts** : `AC-10`, `AC-12`.
- **Préconditions** : deux partitions indépendantes : A, clé `fce_compare` absente ; B, clé contenant `[]`.
- **Étapes essentielles** : pour chaque partition, ouvrir directement Comparaison dans un nouveau contexte ou après une réinitialisation isolée du stockage.
- **Résultats attendus** : aucun panneau ni tableau d'entreprise ; message exact `Ajoute jusqu’à trois entreprises pour les comparer.` ; aucune erreur technique ; aucune requête API nécessaire à la construction de l'état vide.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Moyenne.
- **Justification** : les partitions portent sur l'initialisation frontend. Une structure paramétrée est acceptable si les deux variantes restent nommées et traçables sous ce même TC.

### TC-COMPARE-006 — Valeurs absentes présentées sans fausse information métier

- **Question principale** : une valeur absente reste-t-elle neutre et confinée à la bonne colonne ?
- **Objectif** : vérifier la robustesse du tableau face aux champs facultatifs absents, sans inventer un statut ni exposer de valeur technique.
- **AC couverts** : `AC-07`, `AC-11`.
- **Préconditions** : Alpha possède des valeurs discriminantes ; Delta possède un SIREN mais aucun statut administratif exploitable et omet les autres champs facultatifs concernés ; les deux sont sélectionnées.
- **Étapes essentielles** :
  1. Ouvrir Comparaison avec Alpha et Delta.
  2. Vérifier chaque ligne dans la colonne Delta, indépendamment de la colonne Alpha.
  3. Contrôler la stabilité et l'absence de représentation technique dans toute la zone Compare.
- **Résultats attendus** : chaque absence est affichée par une présentation neutre telle que `—` ou une formulation non renseignée, sans imposer une microcopie unique ; le statut absent de Delta n'est ni `En activité` ni `Cessée` ; les valeurs Alpha ne migrent pas dans la colonne Delta ; aucun `undefined`, `null` ou `[object Object]` et aucune erreur technique ne sont visibles.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Justification** : ce cas limite doit être construit de manière déterministe. Il conserve l'attendu fonctionnel correct malgré `BUG-008` et devra être déclaré avec un corps complet derrière `test.fixme` tant que le défaut reste ouvert.

## Matrice de traçabilité

| Cas de test      | Critères couverts                                    | Niveau      | Priorité |
| ---------------- | ---------------------------------------------------- | ----------- | -------- |
| `TC-COMPARE-001` | `AC-01`, `AC-03`, `AC-04`, `AC-12`                   | `UI_MOCKED` | Haute    |
| `TC-COMPARE-002` | `AC-01`, `AC-03`, `AC-05`, `AC-06`, `AC-08`, `AC-12` | `UI_MOCKED` | Haute    |
| `TC-COMPARE-003` | `AC-02`, `AC-03`, `AC-07`, `AC-08`                   | `UI_MOCKED` | Haute    |
| `TC-COMPARE-004` | `AC-03`, `AC-09`, `AC-12`                            | `UI_MOCKED` | Haute    |
| `TC-COMPARE-005` | `AC-10`, `AC-12`                                     | `UI_MOCKED` | Moyenne  |
| `TC-COMPARE-006` | `AC-07`, `AC-11`                                     | `UI_MOCKED` | Haute    |

Tous les critères `AC-01` à `AC-12` sont couverts. Aucun scénario ne duplique un contrat API ou les responsabilités déjà validées par les baselines Recherche, Détail et Favoris.

## Défaut potentiel découvert

### BUG-008 — Un statut absent est présenté comme une entreprise cessée dans Compare

- **Observation** : dans la ligne `Statut`, une entreprise sans statut administratif exploitable est affichée comme `Cessée`.
- **Écart** : `AC-07` exige une association fidèle aux données et `AC-11` une présentation robuste des valeurs absentes. Seul un statut explicitement cessé peut porter cette information métier.
- **Attendu conservé** : le statut manquant doit être présenté de manière neutre, sans être classé actif ou cessé.
- **Couverture proposée** : `TC-COMPARE-006`, `UI_MOCKED`, scénario complet derrière `test.fixme` tant que `BUG-008` reste ouvert.
- **Suite recommandée** : documenter `BUG-008` avant l'implémentation automatisée ; ne pas aligner l'oracle sur le comportement observé.

## Répartition finale

- `API` : 0
- `UI_MOCKED` : 6
- `E2E_REAL` : 0
- Total : 6 cas de test

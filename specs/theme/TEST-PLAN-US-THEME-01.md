# Plan de test — US-THEME-01 — Choisir et conserver le thème d’affichage

## 1. Objet et stratégie

Ce plan couvre le contrat frontend observable du choix de thème, sa persistance et sa restauration. Il dérive de `US-THEME-01`, de l’inspection du HTML et du JavaScript actuellement déployés, ainsi que des conventions de la suite Playwright existante.

La fonctionnalité ne dépend d’aucune donnée d’entreprise et n’appelle pas l’API Recherche d’Entreprises. Tous les cas sont donc classés `UI_MOCKED` au sens de l’architecture du projet : tests navigateur déterministes, avec la frontière `/search` bloquée ou instrumentée pour rendre visible toute régression. Aucun payload de recherche n’est nécessaire.

Les oracles principaux sont l’attribut `data-theme` de l’élément `<html>`, la valeur brute de `localStorage` et le contrôle accessible. Aucune capture pixel-perfect ni liste de styles CSS calculés n’est utile.

## 2. Contrat observable identifié

### 2.1 Contrôle et disponibilité

- Le contrôle est un bouton `#themeToggle` placé dans la navigation globale de l’en-tête.
- Son rôle accessible est `button`.
- Son nom accessible est constamment `Changer le thème`, fourni par `aria-label`.
- Le bouton n’expose ni `aria-pressed`, ni `aria-checked`, ni autre état accessible indiquant directement le thème actif.
- Son contenu visible vaut `☾` lorsque l’état applicatif n’est pas `dark`, et `☀` lorsque l’état vaut `dark`. Ce glyphe peut compléter l’oracle mais ne remplace pas `data-theme` et le stockage.
- L’en-tête n’est pas recréé lors des changements de vue. Le contrôle reste donc disponible sur Accueil, Recherche, Favoris, Comparaison, Historique et Détail.

### 2.2 État du document et bascule

- Le thème est représenté par l’attribut `data-theme` sur `document.documentElement`, donc sur `<html>`.
- Les deux valeurs produites par l’interface sont `light` et `dark`.
- Au premier clic depuis `light`, l’application applique `dark`, écrit `dark` dans le stockage et affiche `☀` dans le bouton.
- Au clic inverse, elle applique `light`, écrit `light` et affiche `☾`.
- Le changement est synchrone : une assertion Playwright auto-retry sur l’attribut, le bouton et le stockage suffit.

### 2.3 État initial et préférence système

- La valeur initiale est lue avec `localStorage.getItem('fce_theme') || 'light'`.
- Sans valeur stockée, le thème initial est donc toujours `light`.
- Le premier chargement sans préférence applique `data-theme="light"`, mais n’écrit pas `fce_theme`.
- Le code n’appelle ni `window.matchMedia` ni `prefers-color-scheme`.
- Une préférence système sombre ou claire ne participe donc pas au contrat actuel.
- `AC-08` est non applicable. Aucun TC d’émulation `colorScheme` ne doit être créé.

### 2.4 Persistance et restauration

- Le stockage utilisé est `localStorage`.
- La clé exacte est `fce_theme`.
- Les valeurs écrites par le parcours utilisateur sont les chaînes brutes `dark` et `light`, sans sérialisation JSON.
- L’écriture intervient uniquement lors d’un clic sur le bouton ; aucun choix n’est écrit au chargement initial.
- Une valeur existante est lue avant l’initialisation visuelle, puis appliquée à `<html>` et reflétée par le glyphe du bouton.
- Un vrai `page.reload()` dans le même `BrowserContext` restaure le choix.
- Une nouvelle navigation vers l’application, dans le même contexte et sur la même origine, restaure également le choix grâce à la persistance de `localStorage`.
- Un nouveau `BrowserContext` ne partage pas ce stockage et revient donc au thème initial `light`.

### 2.5 Valeur persistée inconnue

Une chaîne inconnue non vide est actuellement appliquée telle quelle à `data-theme`. Le bouton l’interprète visuellement comme un état non sombre et un premier clic la remplace par `dark`.

Cette valeur ne peut pas être produite par l’interface et aucune règle de validation du stockage externe n’est exprimée par l’US. La contractualiser créerait un oracle sur un état interne arbitrairement corrompu. Aucun TC et aucun défaut ne sont proposés pour cette partition à ce stade.

### 2.6 Isolation, navigation et réseau

- Le changement de thème n’écrit que `fce_theme`.
- Il ne modifie pas `fce_favorites`, `fce_compare`, `fce_history` ou `fce_saved`.
- La restauration du thème ne modifie pas davantage ces collections.
- Le thème étant porté par `<html>`, il reste globalement appliqué pendant les changements de vue. Une navigation représentative suffit ; un TC par vue serait redondant.
- Un chargement sans query `q`, une bascule, un changement de vue et un reload de cet état ne déclenchent aucun `/search`.
- Aucune opération Theme ne produit de `POST`, `PUT`, `PATCH` ou `DELETE` vers l’API publique.
- Les requêtes normales de document, CSS, JavaScript ou police au chargement ne sont pas des appels à l’API Recherche d’Entreprises et ne constituent pas l’oracle de cette US.

## 3. Cas de test proposés

### TC-THEME-001 — Basculer du thème clair au thème sombre puis revenir au thème clair

- **Question fonctionnelle unique** : le contrôle global applique-t-il et persiste-t-il de façon cohérente chacun des deux thèmes proposés ?
- **AC couverts** : `AC-01`, `AC-02`, `AC-03`, `AC-04`, `AC-09`, `AC-10`, `AC-12`.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Statut proposé** : Actif, `@regression`.
- **Préconditions** : contexte navigateur propre sans `fce_theme` ; frontière `/search` instrumentée ou bloquée avant la navigation ; petites valeurs sentinelles préremplies dans une sélection représentative de stockages indépendants.
- **Données** :
  - `fce_favorites` : petite collection sentinelle valide ;
  - `fce_compare`, `fce_history` et `fce_saved` : valeurs brutes déterministes suffisantes pour un snapshot ciblé ;
  - aucun état de recherche et aucune donnée API.
- **Étapes** :
  1. Préremplir les stockages indépendants avant le chargement et conserver leurs valeurs brutes attendues.
  2. Ouvrir l’application sans query params.
  3. Identifier le bouton par son rôle et son nom accessible exact `Changer le thème`.
  4. Vérifier l’état initial clair et l’absence de `fce_theme`.
  5. Cliquer une première fois.
  6. Vérifier le thème sombre, le stockage et l’état minimal du bouton.
  7. Cliquer une seconde fois.
  8. Vérifier le retour au thème clair, le stockage et l’état minimal du bouton.
  9. Comparer les stockages indépendants et le suivi réseau.
- **Assertions principales** :
  - le bouton est visible et activable depuis l’interface réelle ;
  - son nom accessible reste `Changer le thème` ;
  - avant action, `<html>` porte `data-theme="light"`, le bouton affiche `☾` et `fce_theme` est absent ;
  - après le premier clic, `<html>` porte `data-theme="dark"`, le bouton affiche `☀` et `fce_theme` vaut exactement `dark` ;
  - après le clic inverse, `<html>` porte `data-theme="light"`, le bouton affiche `☾` et `fce_theme` vaut exactement `light` ;
  - aucun état ARIA inexistant n’est inventé comme oracle ;
  - les sentinelles des autres domaines restent strictement inchangées.
- **Stockage attendu** : aucune écriture au chargement ; chaque clic écrit uniquement la chaîne correspondant au thème choisi dans `fce_theme`.
- **Réseau attendu** : zéro requête `/search` pendant le chargement initial sans `q` et les deux clics ; aucune écriture API.
- **Préférence système** : aucune ; elle n’est pas consultée.
- **Défaut associé** : aucun.
- **Limite volontaire / risque de duplication** : ne pas contrôler une palette, des propriétés CSS ou chaque vue ; ne pas reproduire les contrats métier des stockages sentinelles.

### TC-THEME-002 — Restaurer un choix explicite après reload et nouvelle visite dans le même contexte

- **Question fonctionnelle unique** : un choix utilisateur réellement effectué est-il restauré sur les frontières de navigation où `localStorage` doit persister ?
- **AC couverts** : `AC-04`, `AC-05`, `AC-06`, `AC-09`, `AC-10`, `AC-11`, `AC-12`.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Haute.
- **Statut proposé** : Actif, `@regression`.
- **Préconditions** : contexte sans préférence Theme ; `/search` instrumenté ou bloqué ; une petite sentinelle de stockage indépendant installée avant le premier chargement.
- **Données** : choix explicite `dark` obtenu exclusivement par clic utilisateur ; sentinelle indépendante conservée sous sa forme brute.
- **Étapes** :
  1. Ouvrir l’application sans query params.
  2. Cliquer sur `Changer le thème` pour choisir réellement `dark`.
  3. Vérifier immédiatement `data-theme="dark"` et `fce_theme=dark`.
  4. Effectuer un vrai `page.reload()` dans le même contexte.
  5. Vérifier la restauration automatique avant toute nouvelle action utilisateur.
  6. Naviguer vers une vue représentative, par exemple Favoris, et vérifier que l’état global reste sombre.
  7. Effectuer une nouvelle visite avec `page.goto()` vers l’URL de base dans le même `BrowserContext`.
  8. Vérifier de nouveau la restauration, le stockage indépendant et le réseau.
- **Assertions principales** :
  - après le reload, `<html>` reste `dark`, le bouton affiche `☀` et `fce_theme` reste `dark` ;
  - aucun clic supplémentaire n’est nécessaire pour restaurer le thème ;
  - le passage à la vue représentative ne remplace ni ne retire `data-theme` ;
  - la nouvelle navigation dans le même contexte restaure encore `dark` ;
  - la sentinelle indépendante reste strictement inchangée.
- **Stockage attendu** : le clic initial écrit `dark` ; reload, changement de vue et nouvelle visite relisent ou conservent la valeur sans mutation injustifiée.
- **Réseau attendu** : zéro `/search` pour le clic, le reload sans `q`, le changement de vue et la nouvelle visite ; aucune écriture API.
- **Préférence système** : aucune ; la restauration dépend uniquement du choix persistant.
- **Défaut associé** : aucun.
- **Limite volontaire / risque de duplication** : la navigation sur une seule vue prouve la portée globale de `<html>` ; ne pas parcourir Recherche, Comparaison, Historique et Détail. Le test ne réinjecte pas directement `fce_theme`, car il doit prouver l’écriture issue du clic.

### TC-THEME-003 — Initialiser chaque nouveau contexte en thème clair sans créer de préférence

- **Question fonctionnelle unique** : en l’absence de préférence persistée, l’application applique-t-elle son état initial fixe sans inventer une persistance entre contextes ?
- **AC couverts** : `AC-07`, `AC-10`, `AC-12`.
- **Niveau** : `UI_MOCKED`.
- **Priorité** : Moyenne.
- **Statut proposé** : Actif, `@regression`.
- **Préconditions** : deux `BrowserContext` séparés, chacun fermé avec `try/finally` ; absence explicite de `fce_theme` ; `/search` bloqué ou instrumenté avant chaque navigation.
- **Données** : aucune donnée API et aucun état de recherche.
- **Étapes** :
  1. Dans un premier contexte vierge, ouvrir l’application sans query params.
  2. Vérifier le thème initial et le stockage sans effectuer de clic.
  3. Fermer ce contexte.
  4. Dans un second contexte vierge, ouvrir la même application.
  5. Vérifier le même état initial indépendant et le réseau.
- **Assertions principales** :
  - chaque contexte applique `<html data-theme="light">` ;
  - le bouton `Changer le thème` est disponible et affiche `☾` ;
  - `fce_theme` reste absent après le chargement ;
  - aucune valeur `undefined`, `null` ou artefact technique n’est présent dans l’état Theme ;
  - aucun choix du premier contexte ne peut être supposé présent dans le second.
- **Stockage attendu** : `fce_theme` absent dans les deux contextes ; aucune écriture automatique.
- **Réseau attendu** : zéro `/search` dans chaque partition et aucune écriture API.
- **Préférence système** : non testée, car non consultée par l’application. Le thème clair est un défaut applicatif fixe, pas le résultat de l’environnement Playwright.
- **Défaut associé** : aucun.
- **Limite volontaire / risque de duplication** : deux contextes constituent deux partitions d’un même TC, pas deux tests. Ne pas émuler clair/sombre au niveau système et ne pas tester une valeur de stockage corrompue.

## 4. Matrice de traçabilité AC → TC

| Critère | Cas de test                                    | Niveau      | Priorité | Statut   |
| ------- | ---------------------------------------------- | ----------- | -------- | -------- |
| `AC-01` | `TC-THEME-001`                                 | `UI_MOCKED` | Haute    | Actif    |
| `AC-02` | `TC-THEME-001`                                 | `UI_MOCKED` | Haute    | Actif    |
| `AC-03` | `TC-THEME-001`                                 | `UI_MOCKED` | Haute    | Actif    |
| `AC-04` | `TC-THEME-001`, `TC-THEME-002`                 | `UI_MOCKED` | Haute    | Actifs   |
| `AC-05` | `TC-THEME-002`                                 | `UI_MOCKED` | Haute    | Actif    |
| `AC-06` | `TC-THEME-002`                                 | `UI_MOCKED` | Haute    | Actif    |
| `AC-07` | `TC-THEME-003`                                 | `UI_MOCKED` | Moyenne  | Actif    |
| `AC-08` | Non applicable                                 | —           | —        | Aucun TC |
| `AC-09` | `TC-THEME-001`, `TC-THEME-002`                 | `UI_MOCKED` | Haute    | Actifs   |
| `AC-10` | `TC-THEME-001`, `TC-THEME-002`, `TC-THEME-003` | `UI_MOCKED` | Haute    | Actifs   |
| `AC-11` | `TC-THEME-002`                                 | `UI_MOCKED` | Moyenne  | Actif    |
| `AC-12` | `TC-THEME-001`, `TC-THEME-002`, `TC-THEME-003` | `UI_MOCKED` | Haute    | Actifs   |

## 5. Critère non applicable

- **`AC-08 — Préférence système`** : non applicable. Le code ne consulte ni `prefers-color-scheme` ni `matchMedia`. En l’absence de stockage, il choisit directement `light`. Une émulation Playwright du système ne testerait donc aucun comportement produit et créerait une couverture artificielle.

## 6. Risques de duplication et limites

- Aucun résultat d’entreprise, filtre, pagination, tri ou deep link n’est requis.
- Les collections Favorites, Compare, History et Saved Searches servent uniquement de sentinelles d’isolation ; leur contenu métier n’est pas réévalué.
- Aucun TC par vue : l’attribut est global sur `<html>` et une navigation représentative couvre cette frontière.
- Aucun TC API ou `E2E_REAL` : aucun contrat backend n’intervient.
- Aucun contrôle pixel-perfect, aucune capture de référence et aucune liste exhaustive de variables CSS.
- Aucun TC `prefers-color-scheme`, puisque le produit ne le consulte pas.
- Aucun TC pour une valeur `fce_theme` arbitrairement corrompue, car elle n’est pas productible par l’interface et n’exprime pas actuellement un risque utilisateur suffisamment distinct.
- Le glyphe du bouton est vérifié uniquement comme reflet minimal complémentaire. Le contrat principal reste `data-theme` avec le stockage correspondant.

## 7. Architecture probable de l’automatisation future

- **Spec probable** : `tests/ui/specs/theme/theme-mocked.spec.ts`.
- **POM** : aucune modification nécessaire a priori. Le contrôle global peut rester un locator local `page.getByRole('button', { name: 'Changer le thème', exact: true })`. L’ajouter à `SearchPage` serait conceptuellement discutable pour un bouton global utilisé dans une seule spec.
- **Helpers locaux possibles** : lecture brute d’un ensemble ciblé de clés `localStorage`, suivi des requêtes vers `/search`, assertion de l’attribut `data-theme`, fermeture robuste des contextes manuels avec `try/finally`.
- **Mocks** : aucun payload ni nouveau fichier de mock nécessaire. La route `/search` peut être bloquée afin qu’un appel inattendu échoue immédiatement.
- **Fixtures** : aucune.
- **Dépendances** : aucune.

## 8. Fichiers probablement créés ou modifiés lors de l’implémentation

- Création probable : `tests/ui/specs/theme/theme-mocked.spec.ts`.
- Modification probable : aucune.
- `tests/ui/pages/search.page.ts` : inchangé sauf démonstration future d’une réutilisation réelle du contrôle global.
- Aucun mock, aucune fixture, aucun fichier de défaut.

## 9. Synthèse

- **Nombre total de TC proposés** : 3.
- **Répartition** : `0 API / 3 UI_MOCKED / 0 E2E_REAL`.
- **Tests actifs proposés** : 3.
- **`fixme` proposés** : 0.
- **AC non applicable** : `AC-08`.
- **Défauts potentiels identifiés** : aucun.

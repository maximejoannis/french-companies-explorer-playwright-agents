# US-THEME-01 — Choisir et conserver le thème d’affichage

## User Story

En tant qu’utilisateur,

je veux pouvoir basculer entre les thèmes d’affichage proposés par l’application,

afin d’utiliser l’interface avec l’apparence qui me convient et de retrouver ce choix lors d’une visite ultérieure.

## Contexte

Le thème est une responsabilité exclusivement frontend.

La fonctionnalité ne doit dépendre ni du contenu de l’API gouvernementale ni de règles métier relatives aux entreprises.

La couverture doit privilégier des tests UI déterministes et se concentrer sur :

- le contrôle permettant de changer de thème ;
- l’état visuel ou sémantique observable du document ;
- la persistance du choix ;
- sa restauration après un vrai rechargement ou une nouvelle visite lorsque le comportement actuel le prévoit ;
- l’absence d'effets de bord sur les autres états persistants de l’application.

Le Planner doit inspecter l’implémentation réelle avant de contractualiser :

- la clé de stockage ;
- les valeurs stockées ;
- l’attribut, la classe ou tout autre mécanisme appliqué au document ;
- le thème initial ;
- l’éventuelle prise en compte de `prefers-color-scheme`;
- le libellé et l’état accessible du contrôle.

## Critères d’acceptation

### AC-01 — Contrôle du thème

L’utilisateur dispose d’un contrôle permettant de changer le thème d’affichage.

Le contrôle doit être utilisable depuis l’interface réelle.

Les tests doivent privilégier son rôle, son nom accessible ou un autre locator utilisateur stable plutôt qu’un détail CSS arbitraire.

### AC-02 — Activation du thème alternatif

Lorsque l’utilisateur active le thème alternatif, l’état observable de l’application change conformément au mécanisme réellement utilisé par le produit.

Le Planner doit déterminer l’oracle frontend stable approprié, par exemple :

- attribut du document ;
- classe ;
- propriété accessible ;
- état du contrôle ;
- combinaison minimale de ces éléments.

Il n’est pas demandé de contractualiser une liste exhaustive de couleurs CSS.

### AC-03 — Retour au thème précédent

L’utilisateur peut revenir au thème précédent via le même contrôle.

L’état frontend et l’état persistant doivent redevenir cohérents avec ce choix.

### AC-04 — Persistance

Lorsque l’utilisateur choisit explicitement un thème et que l’application prévoit de mémoriser ce choix, celui-ci est enregistré dans le mécanisme de persistance réellement utilisé.

Le Planner doit identifier précisément :

- le stockage utilisé ;
- la clé ;
- les valeurs ;
- le moment de l’écriture.

### AC-05 — Restauration après rechargement

Après un vrai rechargement de la page, un thème explicitement mémorisé est restauré automatiquement sans nécessiter une nouvelle action utilisateur.

Le test doit utiliser un vrai reload ou une nouvelle navigation selon le contrat observé, et non simuler directement une fonction interne de restauration.

### AC-06 — Restauration lors d’une nouvelle visite

Si le stockage utilisé par le produit survit à une nouvelle navigation dans le même contexte navigateur, une nouvelle visite de l’application restaure le thème mémorisé.

Ne pas créer artificiellement une persistance entre contextes si le mécanisme réel ne la fournit pas.

### AC-07 — État initial sans préférence enregistrée

En l’absence de préférence persistée, l’application utilise son comportement initial réel.

Le Planner doit déterminer si ce comportement repose sur :

- un thème fixe ;
- la préférence système ;
- une autre valeur par défaut.

Ne pas supposer automatiquement que le thème clair est la valeur par défaut.

### AC-08 — Préférence système

Si l’application utilise `prefers-color-scheme` en l’absence de choix utilisateur, ce comportement doit être vérifié de manière déterministe avec l’émulation Playwright appropriée.

Si l’application ne consulte pas la préférence système, ce critère est non applicable et aucun TC artificiel ne doit être créé.

Une préférence explicitement enregistrée doit conserver la priorité sur la préférence système si tel est le contrat réellement implémenté.

### AC-09 — Isolation des autres états persistants

Changer ou restaurer le thème ne doit pas modifier injustement les autres domaines persistants de l’application, notamment :

- favoris ;
- comparaison ;
- historique ;
- recherches sauvegardées.

La vérification doit rester ciblée et ne pas reproduire les suites fonctionnelles correspondantes.

### AC-10 — Indépendance du réseau

Changer, restaurer ou recharger le thème ne doit pas déclencher de requête `/search` uniquement à cause du thème.

Aucune écriture `POST`, `PUT`, `PATCH` ou `DELETE` vers l’API publique n’est légitime pour cette fonctionnalité.

Une requête de recherche provoquée indépendamment par un état de recherche restauré ne doit pas être attribuée au thème.

### AC-11 — Cohérence avec les vues de l’application

Le thème choisi reste appliqué lorsque l’utilisateur navigue entre des vues représentatives de l’application.

Il n’est pas nécessaire de retester chaque feature ni chaque écran si le thème est appliqué globalement au document.

Le Planner doit déterminer si un scénario spécifique est réellement utile ou si l’oracle global suffit.

### AC-12 — Déterminisme et non-régression

La couverture du thème doit rester déterministe et indépendante :

- des entreprises réelles ;
- de la disponibilité de l’API publique ;
- de captures d’écran pixel-perfect ;
- de valeurs CSS détaillées susceptibles d’évoluer sans modifier le contrat fonctionnel.

## Hors périmètre

- validation exhaustive de la palette de couleurs ;
- comparaison pixel-perfect ;
- conformité complète WCAG des contrastes ;
- tests sur tous les navigateurs ou systèmes d’exploitation uniquement pour cette US ;
- règles métier de l’API gouvernementale ;
- contenu des résultats de recherche ;
- préférences système si l’application ne les utilise pas ;
- persistance artificielle entre contextes navigateurs si le stockage réel ne le permet pas ;
- test de chaque vue ou composant uniquement pour prouver que le CSS sombre s’applique ;
- redesign ou validation esthétique du thème.

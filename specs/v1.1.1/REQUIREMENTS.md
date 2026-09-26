# Exigences fonctionnelles v1.1.1

## FEAT-FILTERS-V111 — US-FILTERS-02

En tant qu’utilisateur, je souhaite affiner une recherche avec davantage de critères métier et géographiques afin d’obtenir des entreprises plus pertinentes.

- `AC-01` Un code NAF valide est transmis sous `activite_principale`.
- `AC-02` Un code NAF invalide est refusé avant l’API Entreprises.
- `AC-03` Les départements numériques, `2A` et `2B` sont acceptés.
- `AC-04` La région est transmise sous `region`.
- `AC-05` La tranche est transmise sous `tranche_effectif_salarie`.
- `AC-06` Chaque filtre actif peut être retiré et relance en page 1.
- `AC-07` Tous les filtres peuvent être effacés sans perdre la requête.
- `AC-08` Les filtres valides sont restaurables depuis l’URL.
- `AC-09` Les filtres URL invalides sont ignorés ou normalisés.
- `AC-10` Une commune est résolue par Geo API puis envoyée en code INSEE.

## FEAT-AUTOCOMPLETE-V111 — US-AUTOCOMPLETE-01

En tant qu’utilisateur, je souhaite recevoir des suggestions pendant ma saisie afin d’accéder plus rapidement à une recherche pertinente.

- `AC-01` Sous trois caractères, aucune suggestion n’est demandée.
- `AC-02` La saisie est debouncée sans requêtes intermédiaires inutiles.
- `AC-03` Une suggestion expose nom, SIREN et localisation disponible.
- `AC-04` La liste est utilisable au clavier avec états ARIA cohérents.
- `AC-05` Entrée sélectionne la suggestion active et lance la recherche.
- `AC-06` Échap ferme la liste.
- `AC-07` L’absence de suggestion est annoncée.
- `AC-08` Une erreur de suggestion ne bloque pas la recherche classique.
- `AC-09` Une réponse obsolète ne remplace jamais la requête la plus récente.
- `AC-10` SIREN et SIRET numériques ne déclenchent pas l’autocomplétion textuelle.

## FEAT-SHARE-V111 — US-SHARE-01

En tant qu’utilisateur, je souhaite copier un lien représentant ma recherche afin de pouvoir la conserver ou la transmettre.

- `AC-01` Une recherche simple produit une URL partageable.
- `AC-02` Tous les critères supportés sont représentés.
- `AC-03` Le lien restaure la recherche et ses critères.
- `AC-04` Accents et espaces survivent à l’encodage.
- `AC-05` Clipboard API est utilisée quand elle est disponible.
- `AC-06` Un fallback sans crash existe lorsque Clipboard échoue.
- `AC-07` Le feedback est exposé par une live region.

## FEAT-COMPARE-V111 — US-COMPARE-02

En tant qu’utilisateur, je souhaite comparer jusqu’à trois entreprises afin d’identifier leurs principales différences.

- `AC-01` Une sélection unique présente un état d’aide.
- `AC-02` Deux entreprises affichent un tableau comparatif.
- `AC-03` Trois entreprises restent correctement associées à leurs colonnes.
- `AC-04` Une quatrième entreprise est refusée avec feedback.
- `AC-05` Un retrait ne désaligne pas les colonnes restantes.
- `AC-06` Les données manquantes restent neutres.
- `AC-07` Les différences sont perceptibles sans dépendre de la couleur.
- `AC-08` Les trois sélections persistent dans `localStorage`.
- `AC-09` Chaque retrait possède un nom accessible incluant l’entreprise.

## FEAT-EXPORT-V111 — US-EXPORT-02

En tant qu’utilisateur, je souhaite choisir le format et le périmètre de mon export afin de télécharger exactement les données qui m’intéressent.

- `AC-01` Le dialogue permet de choisir CSV ou JSON.
- `AC-02` JSON conserve les données sans contractualiser l’ordre des propriétés.
- `AC-03` Le périmètre Comparaison exporte seulement les entreprises sélectionnées.
- `AC-04` CSV échappe séparateurs, guillemets, retours ligne et accents.
- `AC-05` CSV neutralise `=`, `+`, `-`, `@`, y compris après espaces.
- `AC-06` Les valeurs manquantes sont neutres.
- `AC-07` Le nom de fichier et l’extension sont déterministes.
- `AC-08` Aucun résultat ne produit pas un fichier trompeur.
- `AC-09` Une recherche en cours invalide les résultats précédents pour l’export.

## Traçabilité

Les identifiants `TC-FILTERS-011..020`, `TC-AUTO-001..010`, `TC-SHARE-001..007`, `TC-COMPARE-007..015` et `TC-EXPORT-007..015` reprennent le même ordinal que les AC ci-dessus. Chaque test contient le niveau `UI_MOCKED` dans son commentaire ou son plan normatif ; seul `TC-FILTERS-020` est `E2E_REAL`.

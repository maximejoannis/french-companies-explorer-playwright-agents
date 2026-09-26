# Plan de test v1.1.1

Ce plan complète les plans historiques sans dupliquer leurs scénarios. Sauf mention contraire, les préconditions sont un stockage local vierge et des API mockées avant la navigation. Les étapes consistent à ouvrir la vue concernée, réaliser l'action décrite et observer l'oracle. Priorité haute pour les contrats, erreurs et courses ; moyenne pour les variantes de présentation.

## Filtres enrichis — FEAT-FILTERS-V111 / US-FILTERS-02

### TC-FILTERS-010 — Erreur Geo API

AC-10 · `UI_MOCKED` · Haute. Saisir une commune lorsque Geo API échoue ; l'erreur doit être annoncée et l'API Entreprises ne doit pas recevoir de code inventé.

### TC-FILTERS-011 — Code NAF valide

AC-01 · `UI_MOCKED` · Haute. Un code NAF valide doit être transmis sous `activite_principale`.

### TC-FILTERS-012 — Code NAF invalide

AC-02 · `UI_MOCKED` · Haute. Un code invalide doit être refusé avant tout appel de recherche.

### TC-FILTERS-013 — Départements spéciaux

AC-03 · `UI_MOCKED` · Moyenne. Les valeurs numériques, `2A` et `2B` doivent être acceptées.

### TC-FILTERS-014 — Région

AC-04 · `UI_MOCKED` · Moyenne. La région choisie doit être transmise sous `region`.

### TC-FILTERS-015 — Tranche d'effectif

AC-05 · `UI_MOCKED` · Moyenne. La tranche choisie doit être transmise sous `tranche_effectif_salarie`.

### TC-FILTERS-016 — Retrait d'un filtre

AC-06 · `UI_MOCKED` · Haute. Retirer une puce active doit conserver les autres critères et revenir en page 1.

### TC-FILTERS-017 — Effacement global

AC-07 · `UI_MOCKED` · Haute. Effacer les filtres doit conserver la requête textuelle.

### TC-FILTERS-018 — Restauration URL

AC-08 · `UI_MOCKED` · Haute. Un deep link valide doit restaurer les critères et leur représentation visuelle.

### TC-FILTERS-019 — URL invalide

AC-09 · `UI_MOCKED` · Haute. Les valeurs invalides doivent être ignorées ou normalisées sans requête incohérente.

### TC-FILTERS-020 — Chaîne Commune réelle

AC-10 · `E2E_REAL` · Haute. Une commune doit être résolue en code INSEE, transmis à l'API Entreprises, puis produire un rendu UI.

## Autocomplétion — FEAT-AUTOCOMPLETE-V111 / US-AUTOCOMPLETE-01

### TC-AUTO-001 — Seuil minimal

AC-01 · `UI_MOCKED` · Haute. Moins de trois caractères ne doit déclencher aucune suggestion.

### TC-AUTO-002 — Debounce

AC-02 · `UI_MOCKED` · Haute. Une saisie continue ne doit envoyer que la requête stabilisée.

### TC-AUTO-003 — Contenu des suggestions

AC-03 · `UI_MOCKED` · Moyenne. Nom, SIREN et localisation disponible doivent être restitués.

### TC-AUTO-004 — Navigation clavier et ARIA

AC-04 · `UI_MOCKED` · Haute. Flèches, option active et états du combobox doivent rester cohérents.

### TC-AUTO-005 — Validation par Entrée

AC-05 · `UI_MOCKED` · Haute. Entrée doit sélectionner l'option active et lancer la recherche correspondante.

### TC-AUTO-006 — Fermeture par Échap

AC-06 · `UI_MOCKED` · Moyenne. Échap doit fermer la liste sans lancer de recherche.

### TC-AUTO-007 — Aucune suggestion

AC-07 · `UI_MOCKED` · Moyenne. L'absence de résultat doit être annoncée.

### TC-AUTO-008 — Erreur non bloquante

AC-08 · `UI_MOCKED` · Haute. Une erreur d'autocomplétion ne doit pas empêcher la recherche classique.

### TC-AUTO-009 — Réponse obsolète

AC-09 · `UI_MOCKED` · Haute. Après A puis B, une réponse A tardive ne doit jamais remplacer les suggestions B.

### TC-AUTO-010 — Identifiants numériques

AC-10 · `UI_MOCKED` · Haute. Un SIREN ou SIRET ne doit pas déclencher l'autocomplétion textuelle.

## Partage — FEAT-SHARE-V111 / US-SHARE-01

### TC-SHARE-001 — URL simple

AC-01 · `UI_MOCKED` · Haute. Partager une recherche simple doit produire une URL restaurable.

### TC-SHARE-002 — Critères complets

AC-02 · `UI_MOCKED` · Haute. Tous les critères supportés doivent apparaître dans le lien.

### TC-SHARE-003 — Restauration

AC-03 · `UI_MOCKED` · Haute. Ouvrir le lien doit restaurer et exécuter la recherche.

### TC-SHARE-004 — Encodage

AC-04 · `UI_MOCKED` · Moyenne. Accents et espaces doivent survivre à l'aller-retour URL.

### TC-SHARE-005 — Clipboard API

AC-05 · `UI_MOCKED` · Haute. Le presse-papiers disponible doit recevoir l'URL.

### TC-SHARE-006 — Fallback presse-papiers

AC-06 · `UI_MOCKED` · Haute. Un refus du presse-papiers doit utiliser le fallback sans crash.

### TC-SHARE-007 — Feedback accessible

AC-07 · `UI_MOCKED` · Haute. Le succès doit être exposé par une live region.

## Comparaison — FEAT-COMPARE-V111 / US-COMPARE-02

### TC-COMPARE-007 — Une sélection

AC-01 · `UI_MOCKED` · Moyenne. Une seule sélection doit afficher l'aide attendue.

### TC-COMPARE-008 — Deux entreprises

AC-02 · `UI_MOCKED` · Haute. Deux sélections doivent produire le tableau comparatif.

### TC-COMPARE-009 — Trois entreprises

AC-03 · `UI_MOCKED` · Haute. Trois entreprises doivent rester associées à leurs colonnes.

### TC-COMPARE-010 — Limite à trois

AC-04 · `UI_MOCKED` · Haute. Une quatrième sélection doit être refusée avec feedback.

### TC-COMPARE-011 — Retrait

AC-05 · `UI_MOCKED` · Haute. Retirer une entreprise ne doit pas désaligner les colonnes.

### TC-COMPARE-012 — Données manquantes

AC-06 · `UI_MOCKED` · Haute. Les champs absents doivent conserver un rendu neutre.

### TC-COMPARE-013 — Différences perceptibles

AC-07 · `UI_MOCKED` · Moyenne. Une différence doit être exprimée autrement que par la couleur seule.

### TC-COMPARE-014 — Persistance

AC-08 · `UI_MOCKED` · Haute. Les trois sélections doivent survivre à un rechargement.

### TC-COMPARE-015 — Retrait accessible

AC-09 · `UI_MOCKED` · Haute. Chaque bouton de retrait doit nommer l'entreprise cible.

## Export configurable — FEAT-EXPORT-V111 / US-EXPORT-02

### TC-EXPORT-007 — Choix du format

AC-01 · `UI_MOCKED` · Haute. Le dialogue doit permettre CSV et JSON.

### TC-EXPORT-008 — JSON sémantique

AC-02 · `UI_MOCKED` · Haute. L'objet exporté doit conserver les valeurs sans imposer l'ordre des clés.

### TC-EXPORT-009 — Périmètre comparaison

AC-03 · `UI_MOCKED` · Haute. Ce périmètre doit exporter uniquement les entreprises sélectionnées.

### TC-EXPORT-010 — Échappement CSV

AC-04 · `UI_MOCKED` · Haute. Séparateurs, guillemets, retours ligne et accents doivent être échappés.

### TC-EXPORT-011 — Injection CSV

AC-05 · `UI_MOCKED` · Haute. `=`, `+`, `-` et `@`, même après espaces, doivent être neutralisés.

### TC-EXPORT-012 — Valeurs absentes

AC-06 · `UI_MOCKED` · Moyenne. Les valeurs absentes doivent rester neutres.

### TC-EXPORT-013 — Nom de fichier

AC-07 · `UI_MOCKED` · Moyenne. Le nom et l'extension doivent être déterministes.

### TC-EXPORT-014 — Aucun résultat

AC-08 · `UI_MOCKED` · Haute. Aucun fichier trompeur ne doit être produit sans résultat.

### TC-EXPORT-015 — Recherche concurrente

AC-09 · `UI_MOCKED` · Haute. Après Alpha réussi puis Beta en cours, Alpha ne doit plus être exportable ; la réponse Beta doit rendre Beta exportable.

## Renforcements historiques

### TC-FAVORITES-006 — Nom et état accessibles

US-FAVORITES-01 / AC-01 à AC-03 · `UI_MOCKED` · Haute. Le bouton doit nommer l'action et l'entreprise, puis refléter son état avec `aria-pressed`.

### TC-SAVED-008 — Suppression accessible

US-SAVED-01 / AC-06 · `UI_MOCKED` · Haute. Le bouton doit exposer l'action de suppression et le nom de la recherche ciblée.

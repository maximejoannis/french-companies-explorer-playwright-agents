# BUG-016 — Réinitialiser conserve `cityCode` dans l’URL

- **Version observée :** v1.1.1 post-Codex
- **Sévérité :** Majeure
- **Priorité :** Haute
- **Statut :** Ouvert
- **Classification :** `PRODUCT_REGRESSION`

## OBSERVATION

Après une recherche avec commune résolue, le bouton « Réinitialiser » vide les contrôles visibles mais laisse `?cityCode=<code INSEE>` dans l’URL.

## EVIDENCE

`TC-DEEP-LINK-002` attend une URL sans paramètres après réinitialisation et observe `?cityCode=69123`.

## ACTION

Vider explicitement `#cityCodeFilter` lors de la réinitialisation avant `syncUrl()`.

## VALIDATION

`FAILED` sur la campagne Chromium v1.1.1. Le produit externe n’a pas été modifié.

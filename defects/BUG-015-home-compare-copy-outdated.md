# BUG-015 — Texte d’accueil incohérent avec la comparaison à trois

- **Version observée :** v1.1.1 post-Codex
- **Sévérité :** Mineure
- **Priorité :** Basse
- **Statut :** Ouvert
- **Classification :** `NEW_REQUIREMENT_GAP`

## OBSERVATION

La page d’accueil affiche encore « Compare deux entreprises sur les principales données. » alors que le comparateur et son titre autorisent trois entreprises.

## EVIDENCE

Le contrat v1.1.1 exige une comparaison jusqu’à trois entreprises. Le smoke `TC-SEARCH-010` porte une assertion de cohérence de contenu sans ajouter un E2E dédié.

## ACTION

Remplacer le texte d’accueil par « Compare jusqu’à trois entreprises sur les principales données. » dans le dépôt applicatif.

## VALIDATION

`FAILED` tant que l’assertion du smoke ne passe pas sur l’application déployée. Le dépôt applicatif n’est pas modifié par cette suite QA.

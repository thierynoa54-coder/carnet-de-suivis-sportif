# Carnet — Prépa Physique

Appli web de suivi d'entraînement (prépa physique sports de combat). Langue de l'interface et des échanges : **français**.

## Techno
- **Un seul fichier** : `index.html` (HTML + CSS + JS inline, ~165 Ko). Pas de build, pas de serveur, pas de dépendances npm.
- Graphiques : Chart.js (CDN). IA locale : WebLLM via `https://esm.run/`. IA distante : API Claude (`fetch` vers `api.anthropic.com`, clé saisie par l'utilisateur dans Réglages).
- Données : `localStorage` du navigateur ; export / import JSON.

## Lancer / tester
- Ouvrir `index.html` dans un navigateur (double-clic), ou `python -m http.server` puis http://localhost:8000.
- Pas de tests automatiques. Après une modif : vérifier les 6 onglets (Aujourd'hui, Semaine, Programmes, Journal, Analyse, Réglages) et un cycle export → import JSON.

## Règles
- Garder le fichier unique et l'appli hors ligne (sauf l'appel API optionnel).
- **Ne jamais écrire de clé API dans le code** : le dépôt est public.
- Ne pas casser le format JSON d'export (rétrocompatibilité des sauvegardes existantes).
- Lire seulement la partie concernée d'`index.html` (le fichier est gros) : chercher par `id=` ou `data-view=`.
- Messages de commit explicites en français (pas « index »).

## Améliorations en attente
Hydratation · saisie poids du corps / rounds au sac · séances en double dans les exports.

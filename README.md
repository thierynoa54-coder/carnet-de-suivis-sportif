# Carnet — Prépa Physique

Application web de suivi d'entraînement (programmes, séances, pesées, compléments, analyse),
utilisable sur téléphone et sur PC. Les données restent sur l'appareil (stockage local du navigateur).

Ce dépôt est en cours d'évolution vers un tableau de bord complet (agenda, mails, tâches,
second cerveau, bilans), le carnet sportif en devenant un module.

## Lancer l'application

L'application est découpée en modules : elle doit être servie par un serveur web
(l'ouverture directe du fichier `index.html` par double-clic ne fonctionne plus).

```bash
npm run serve
```

Puis ouvrir http://127.0.0.1:8080. En ligne, n'importe quel hébergement statique convient (GitHub Pages par exemple).

## Organisation du code

| Dossier / fichier | Rôle |
| --- | --- |
| `index.html` | Coquille de la page : bandeau, zone d'affichage, barre d'onglets |
| `css/app.css` | Styles |
| `js/main.js` | Démarrage et navigation entre onglets |
| `js/render.js` | Choix de la vue à afficher |
| `js/state.js` | Données du carnet : lecture, sauvegarde, reprise des anciennes sauvegardes |
| `js/seed.js` | Données de départ (programmes, compléments, plan de la semaine) |
| `js/domain/` | Calculs sans affichage : calories, groupes musculaires, rangs |
| `js/views/` | Un fichier par onglet : Jour, Semaine, Progs, Analyse, Carnet, Réglages |
| `js/ai.js` | Analyse par IA (copier-coller, modèle local, API) |
| `tests/` | Tests automatiques |

## Tests

```bash
npm test
```

```bash
npm run test:e2e
```

```bash
npm run lint
```

`npm test` vérifie les calculs et la reprise des données. `npm run test:e2e` pilote l'application
dans un navigateur, en format téléphone et PC. Ces deux dernières commandes demandent Playwright et ESLint
(`npm install --save-dev playwright eslint`).

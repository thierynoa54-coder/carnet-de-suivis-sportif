# Suivi du projet

Référence : cahier des charges validé le 15/11/2026 (document Claude Docs « Cahier des charges – Carnet de suivi sportif »).
Ce fichier permet de reprendre le travail dans n'importe quelle session ou avec n'importe quel modèle.

## Décisions validées

| Sujet | Choix |
| --- | --- |
| Bilan du soir | Dans le Carnet |
| Synchronisation PC ↔ iPhone | Automatique avec Supabase (compte gratuit à créer) |
| Hébergement | GitHub Pages, branche `main`, racine |
| Mails et agenda du tableau de bord | Gmail et Google Agenda (connecteurs Claude) |
| Second cerveau | Dossier sur le PC, synchronisé |
| Questions du bilan du soir | Les 6 proposées dans le cahier des charges |
| Heure du rappel du soir | Autre que 21 h 30 : à préciser |
| Briefing du matin | 7 h, du lundi au vendredi |
| Icône | Nouvelle icône créée avec Canva : description à fournir |
| Mise en ligne | Une pull request par étape, fusionnée par le propriétaire |

## Étapes

- [x] 0. Cadrage : analyse de la vidéo, cahier des charges
- [x] 1. Carnet installable et hors ligne : manifeste, service worker, icônes PNG, test automatique
  - En attente : activation de GitHub Pages (Settings → Pages → Deploy from a branch → `main` / root), icône Canva
- [ ] 2. Agent de bilan quotidien et hebdomadaire : onglet Bilan, grille et graphique de la semaine, analyse IA, rappel Raccourcis, prompt n°3
- [ ] 3. Synchronisation Supabase PC ↔ iPhone
- [ ] 4. Tableau de bord « Ma vie » et briefing du matin, prompt n°1
- [ ] 5. Second cerveau (dossier sur le PC), prompt n°2
- [ ] 6. Recette finale : tests, revues de code et de sécurité, guide d'utilisation

## Repères techniques

- Application : un seul fichier `index.html` (~165 Ko), données dans `localStorage` (clé `carnetCombat_v1`, clé API `carnetCombat_apiKey`). Ne jamais le relire en entier : cibler les fonctions. Nouveaux modules dans des fichiers séparés.
- PWA : `manifest.webmanifest`, `sw.js` (incrémenter `CACHE` à chaque modification d'un fichier mis en cache), `icons/`.
- Test : `node tests/smoke.js` (Playwright) : PC et iPhone simulé, installable, hors ligne, aucune erreur JavaScript.
- Le réseau de la session cloud bloque instagram.com, github.io, les exports Canva et supabase.co.

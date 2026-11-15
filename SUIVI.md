# Suivi du projet

## Nouveau départ (15/11/2026)

Demande : supprimer complètement l'ancien Carnet sportif et créer à partir de zéro un vrai jeu vidéo, installable sur PC et iPhone, basé sur les 3 projets de la vidéo Instagram : tableau de bord de vie avec briefing du matin, second cerveau, agent de bilan quotidien et hebdomadaire.

- [x] Ancien Carnet supprimé du dépôt (il reste récupérable dans l'historique Git)
- [x] Choix : île flottante paisible et cosy, pixel art dessiné en code, RPG à carte, bilan à 21 h
- [x] Conception du jeu « Îlot » dans le cahier des charges (Claude Docs)
- [x] 1. L'île jouable : carte, personnage, Nimbo, jour et nuit, musique, XP et niveaux, Maison, Feu de camp, aperçu de l'Observatoire, installation PC et iPhone hors ligne
- [ ] 2. Potager (habitudes), Tour aux archives (documents et échéances), Observatoire complet
- [ ] 3. Claude dans le jeu : lettre du matin, réponses des archives, analyse de la semaine, les 3 prompts
- [ ] 4. Synchro Supabase PC ↔ iPhone et briefing automatique à 7 h (Gmail, Google Agenda)
- [ ] 5. Recette : tests, revues de code et de sécurité, guide de jeu

## Repères techniques

- Code : `js/state.js` (données, XP), `js/art.js` (pixel art en code), `js/world.js` (scène Phaser), `js/ui.js` (interface), `js/audio.js` (son généré).
- Sauvegarde : `localStorage`, clé `ilot_v1`.
- Service worker `sw.js` : page et code en réseau d'abord, moteur, polices et images en cache d'abord ; changer `CACHE` si la liste `SHELL` change.
- Test : `node tests/smoke.js`. Il laisse l'horloge s'écouler (`clock.install`) : figer l'heure bloque les animations de Phaser.
- Le réseau de la session cloud bloque instagram.com, github.io, les exports Canva et supabase.co.

## Décisions du cahier des charges v1 toujours valables

Synchro Supabase ; hébergement GitHub Pages ; Gmail et Google Agenda ; second cerveau dans un dossier sur le PC ; briefing à 7 h en semaine ; une pull request par étape.

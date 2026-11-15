# Îlot — ta vie, une île qui grandit

Jeu vidéo en pixel art, installable sur PC et iPhone et jouable hors ligne. Il reprend les 3 projets d'une vidéo Instagram sur Claude : tableau de bord de ta vie, second cerveau, bilan quotidien et hebdomadaire. Ta vie devient une île flottante paisible, et chaque lieu de l'île a une fonction. Nimbo, un petit esprit-nuage, t'accompagne.

| Lieu | Ce qu'on y fait |
| --- | --- |
| Maison | Lettre du matin de Nimbo, quêtes du jour, agenda du jour |
| Feu de camp | Bilan du soir à 21 h : 6 questions ; la priorité de demain devient une quête |
| Observatoire | Constellation de la semaine : une étoile par journée réussie |
| Potager | Habitudes qui poussent comme des plantes (étape 2) |
| Archives | Documents et échéances, le second cerveau (étape 2) |

Chaque action rapporte de l'XP et des lucioles ; les niveaux font grandir l'île. L'île suit l'heure réelle, de l'aube à la nuit étoilée.

Adresse, une fois GitHub Pages activé : https://thierynoa54-coder.github.io/carnet-de-suivis-sportif/

## Installer

- iPhone : ouvrir l'adresse dans Safari, bouton Partager, puis « Sur l'écran d'accueil ».
- PC : ouvrir l'adresse dans Chrome ou Edge, puis l'icône « Installer » de la barre d'adresse.

## Tes données

Elles restent sur chaque appareil, jamais dans ce dépôt. Réglages → Exporter / Importer pour les déplacer, en attendant la synchro Supabase (étape 4).

## Développement

- Aucun outil de compilation : HTML, CSS et modules JavaScript ; moteur Phaser 3.90 dans `vendor/` (licence MIT), police Pixelify Sans dans `fonts/` (licence OFL). Tout le pixel art est dessiné en code dans `js/art.js`.
- `node tests/smoke.js` : partie automatique sur PC et iPhone simulé (accueil, quête, bilan, étoile, installation, hors ligne).
- `node tools/render-icons.js` : régénère les icônes depuis le pixel art du jeu.
- Avancement et décisions : [SUIVI.md](SUIVI.md).

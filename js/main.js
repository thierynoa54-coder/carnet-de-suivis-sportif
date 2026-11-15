// Démarrage d'Îlot : données, son, monde (Phaser) puis interface.
import { load, S } from './state.js';
import { initAudio, unlockAudio } from './audio.js';
import { WorldScene } from './world.js';
import { initUI } from './ui.js';

load();
initAudio(S().settings);
const world = new WorldScene();
world.onReady = () => initUI(world);
new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  transparent: true,
  pixelArt: true,
  banner: false,
  scale: { mode: Phaser.Scale.RESIZE, width: innerWidth, height: innerHeight },
  scene: world,
});
for (const ev of ['pointerup', 'touchend', 'keydown']) addEventListener(ev, unlockAudio, { once: true });
if ('serviceWorker' in navigator && location.protocol.startsWith('http')) {
  addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
}

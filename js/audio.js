// Musique douce et bruitages générés en direct (Web Audio) : aucun fichier son.
let ctx, master, music, fx, timer;
let settings = { music: true, sfx: true };
const NOTE = (n) => 440 * 2 ** ((n - 69) / 12);
const PENTA = [0, 2, 4, 7, 9]; // gamme pentatonique : toujours harmonieuse
const ROOTS = [60, 57, 53, 55]; // do, la, fa, sol

export function initAudio(s) {
  settings = s;
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : settings.music && start()));
}

// Le navigateur n'autorise le son qu'après un geste de l'utilisateur.
export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.7;
    master.connect(ctx.destination);
    music = ctx.createGain();
    fx = ctx.createGain();
    const echo = ctx.createDelay();
    echo.delayTime.value = 0.36;
    const feedback = ctx.createGain();
    feedback.gain.value = 0.3;
    music.connect(master);
    music.connect(echo);
    echo.connect(feedback);
    feedback.connect(echo);
    echo.connect(master);
    fx.connect(master);
  }
  if (ctx.state === 'suspended') ctx.resume();
  if (settings.music) start();
}

function tone(freq, at, len, type, vol, out) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.03);
  g.gain.exponentialRampToValueAtTime(0.0001, at + len);
  o.connect(g).connect(out);
  o.start(at);
  o.stop(at + len + 0.05);
}

function start() {
  if (!ctx || timer) return;
  let step = 0;
  timer = setInterval(() => {
    const h = new Date().getHours(), night = h >= 21 || h < 6, t = ctx.currentTime + 0.05;
    const root = ROOTS[Math.floor(step / 8) % ROOTS.length] - (night ? 12 : 0);
    if (step % 8 === 0) {
      tone(NOTE(root - 12), t, 3.4, 'sine', 0.05, music);
      tone(NOTE(root - 5), t, 3.4, 'sine', 0.025, music);
    }
    if (Math.random() < (night ? 0.4 : 0.65)) {
      const n = 60 + PENTA[Math.floor(Math.random() * PENTA.length)] + (Math.random() < 0.4 ? 12 : 0) - (night ? 12 : 0);
      tone(NOTE(n), t, 1.6, 'triangle', 0.04, music);
    }
    step += 1;
  }, 430);
}
function stop() { clearInterval(timer); timer = null; }

export function setMusic(on) { settings.music = on; if (on) unlockAudio(); else stop(); }
export function setSfx(on) { settings.sfx = on; }

function play(notes, type = 'triangle', vol = 0.09) {
  if (!ctx || !settings.sfx) return;
  const t = ctx.currentTime + 0.01;
  for (const [f, delay, len] of notes) tone(f, t + delay, len, type, vol, fx);
}
export const sfx = {
  pop: () => play([[660, 0, 0.09]], 'square', 0.03),
  step: () => play([[150 + Math.random() * 60, 0, 0.05]], 'square', 0.012),
  quest: () => play([[784, 0, 0.18], [1175, 0.09, 0.35]]),
  bilan: () => play([[392, 0, 1.4], [494, 0.05, 1.4], [587, 0.1, 1.4], [784, 0.25, 1.2]], 'sine', 0.06),
  level: () => play([[523, 0, 0.22], [659, 0.12, 0.22], [784, 0.24, 0.22], [1047, 0.36, 0.6]]),
};

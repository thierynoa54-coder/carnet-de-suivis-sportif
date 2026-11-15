// Scène principale d'Îlot : l'île, le personnage, Nimbo, le jour et la nuit.
import { buildTextures, ISLAND, PLAZA, PLACES, TREES, LANTERNS, ROCKS, LIGHTS } from './art.js';
import { S, dayPhase, levelInfo } from './state.js';
import { sfx } from './audio.js';

const PHASES = {
  aube: { tint: 0xff9a70, alpha: 0.14, sky: ['#f7b7a3', '#fde2c8'], night: false },
  jour: { tint: 0x000000, alpha: 0, sky: ['#7ec8ff', '#d6f0ff'], night: false },
  crepuscule: { tint: 0xff6a3d, alpha: 0.18, sky: ['#f08a5d', '#fbd1a2'], night: false },
  soiree: { tint: 0x2a2f6b, alpha: 0.38, sky: ['#3d4a8c', '#b07ab8'], night: true },
  nuit: { tint: 0x0b1633, alpha: 0.55, sky: ['#0b1430', '#1f2f5c'], night: true },
};
const SPEED = 70; // pixels du monde par seconde
const DEPTH = { cloudsFront: 1500, overlay: 1900, lights: 1950, glow: 1960, fx: 1970, bang: 2000, nimbo: 2100 };

export class WorldScene extends Phaser.Scene {
  constructor() {
    super('world');
    this.at = 'maison';
    this.walking = null;
    this.onArrive = () => {};
  }

  create() {
    buildTextures(this);
    this.add.image(0, 0, 'island').setOrigin(0);
    ROCKS.forEach(([x, y]) => this.tweens.add({ targets: this.add.image(x, y, 'rock'), y: y - 3, duration: 2000 + Math.random() * 1500, yoyo: true, repeat: -1, ease: 'Sine.inOut' }));
    this.trees = TREES.map(([x, y]) => this.add.image(x, y, 'tree').setOrigin(0.5, 1).setDepth(y));
    this.lanterns = LANTERNS.map(([x, y]) => this.add.image(x, y, 'lantern').setOrigin(0.5, 1).setDepth(y));
    this.pond = this.add.image(104, 122, 'pond').setDepth(117);
    this.add.image(86, 72, 'mailbox').setOrigin(0.5, 1).setDepth(72).setInteractive({ useHandCursor: true }).on('pointerdown', () => this.goTo('maison'));
    this.flag = this.add.image(90, 60, 'flag').setOrigin(0).setDepth(72.5);

    this.places = {};
    for (const [key, p] of Object.entries(PLACES)) {
      const img = this.add.image(p.x, p.y, p.tex).setOrigin(0.5, 1).setDepth(p.y).setInteractive({ useHandCursor: true });
      img.on('pointerdown', () => this.goTo(key));
      const bang = this.add.image(p.x, p.y - p.h - 1, 'bang').setOrigin(0.5, 1).setDepth(DEPTH.bang).setVisible(false);
      this.tweens.add({ targets: bang, y: bang.y - 3, duration: 450, yoyo: true, repeat: -1, ease: 'Sine.inOut' });
      this.places[key] = { img, bang };
    }
    this.flame = this.add.sprite(144, 108, 'flame').setOrigin(0.5, 1).setDepth(DEPTH.lights).play('flame');

    const start = PLACES[this.at].door;
    this.hero = this.add.sprite(start.x, start.y, 'hero', 'down0').setOrigin(0.5, 1).setDepth(start.y);
    this.nimbo = this.add.sprite(start.x - 13, start.y - 24, 'nimbo', 'n0').setDepth(DEPTH.nimbo);
    this.time.addEvent({ delay: 3800, loop: true, callback: () => { this.nimbo.setFrame('n1'); this.time.delayedCall(150, () => this.nimbo.setFrame('n0')); } });
    this.butterflies = [0xffffff, 0xb3d4ff, 0xfff0a0].map((tint, i) => {
      const b = this.add.sprite(60 + i * 30, 100, 'butterfly').setTint(tint).setDepth(1200).play('butterfly');
      this.wander(b);
      return b;
    });

    this.clouds = [['cloud3', -30, 168, -5], ['cloud2', 240, 30, -5], ['cloud1', 20, 12, -5], ['cloud1', 150, 204, DEPTH.cloudsFront], ['cloud3', 260, 190, DEPTH.cloudsFront]]
      .map(([key, x, y, depth]) => Object.assign(this.add.image(x, y, key).setDepth(depth).setAlpha(depth > 0 ? 0.85 : 0.95), { speed: 2 + Math.random() * 3 }));
    this.stars = Array.from({ length: 70 }, () => Object.assign(this.add.image(-150 + Math.random() * 500, -120 + Math.random() * 420, 'px').setDepth(-20).setAlpha(0), { base: 0.35 + Math.random() * 0.65 }));

    // Nuit : un voile coloré, puis les lumières par-dessus pour qu'elles brillent.
    this.overlay = this.add.rectangle(100, 100, 4000, 4000, 0x000000, 0).setDepth(DEPTH.overlay);
    this.windows = LIGHTS.map(([x, y, w, h]) => this.add.rectangle(x, y, w, h, 0xffd97a).setOrigin(0).setDepth(DEPTH.lights).setAlpha(0));
    this.lamps = LANTERNS.map(([x, y]) => this.add.rectangle(x - 1, y - 11, 3, 3, 0xffe9a3).setOrigin(0).setDepth(DEPTH.lights).setAlpha(0));
    const glow = (x, y, s) => this.add.image(x, y, 'glow').setScale(s).setBlendMode(Phaser.BlendModes.ADD).setDepth(DEPTH.glow).setAlpha(0);
    this.glows = [...LIGHTS.map(([x, y, w, h]) => glow(x + w / 2, y + h / 2, 0.5)), glow(144, 103, 1.3)];
    this.lampGlows = LANTERNS.map(([x, y]) => glow(x, y - 10, 0.45));

    this.fireflies = this.add.particles(0, 0, 'px', {
      emitZone: { type: 'random', source: new Phaser.Geom.Ellipse(ISLAND.cx, ISLAND.cy, ISLAND.rx * 1.9, ISLAND.ry * 1.9) },
      lifespan: { min: 2500, max: 5000 }, speedX: { min: -6, max: 6 }, speedY: { min: -6, max: 4 },
      alpha: { onUpdate: (particle, key, t) => Math.sin(t * Math.PI) },
      tint: 0xf7f06d, blendMode: 'ADD', frequency: 220, emitting: false,
    }).setDepth(DEPTH.fx);
    this.add.particles(70, 39, 'px', {
      lifespan: 2600, speedY: { min: -9, max: -5 }, speedX: { min: -2, max: 3 }, scale: { start: 1, end: 2.5 }, alpha: { start: 0.5, end: 0 }, tint: 0xeeeeee, frequency: 500,
    }).setDepth(80);
    this.sparks = this.add.particles(0, 0, 'px', {
      lifespan: 900, speed: { min: 25, max: 70 }, angle: { min: 200, max: 340 }, gravityY: 70, scale: { start: 1.3, end: 0 },
      tint: [0xf2c14e, 0xffffff, 0xff9db3, 0x8fd17a], emitting: false,
    }).setDepth(DEPTH.fx);

    this.scale.on('resize', () => this.fit());
    this.fit();
    this.applyPhase(true);
    this.time.addEvent({ delay: 60000, loop: true, callback: () => this.applyPhase() });
    this.onReady?.();
  }

  update(time, delta) {
    const k = Math.min(1, delta / 250);
    this.nimbo.x += (this.hero.x - 13 - this.nimbo.x) * k;
    this.nimbo.y += (this.hero.y - 24 + Math.sin(time / 450) * 2 - this.nimbo.y) * k;
    for (const c of this.clouds) { c.x += (c.speed * delta) / 1000; if (c.x > 340) c.x = -140; }
    if (this.isNight) for (const s of this.stars) s.setAlpha(s.base * (0.55 + 0.45 * Math.sin(time / 650 + s.x)));
  }

  // Cadre l'île entre le HUD (en haut) et la barre de voyage (en bas), avec un zoom entier : pixels nets.
  fit() {
    const w = this.scale.width, h = this.scale.height;
    const top = document.getElementById('hud')?.getBoundingClientRect().bottom ?? 60;
    const bottom = h - (document.getElementById('travel')?.getBoundingClientRect().top ?? h - 80);
    const zoom = Math.max(1, Math.floor(Math.min((w - 8) / 184, (h - top - bottom - 8) / 190)));
    this.cameras.main.setZoom(zoom).centerOn(100, 121 - (top - bottom) / 2 / zoom);
    this.onLayout?.();
  }
  toScreen(x, y) {
    const c = this.cameras.main;
    return { x: (x - c.scrollX - c.width / 2) * c.zoom + c.width / 2, y: (y - c.scrollY - c.height / 2) * c.zoom + c.height / 2 };
  }

  goTo(key) {
    if (this.walking === key) return;
    if (this.at === key) { this.onArrive(key); return; }
    this.at = null;
    this.walking = key;
    this.walk([PLAZA, PLACES[key].door], () => { this.at = key; this.walking = null; this.onArrive(key); });
  }
  walk(points, done) {
    this.tweens.killTweensOf(this.hero);
    const next = () => {
      const p = points.shift();
      if (!p) { this.hero.play(`idle-${this.dir === 'up' || this.dir === 'down' ? this.dir : 'side'}`); done(); return; }
      const dx = p.x - this.hero.x, dy = p.y - this.hero.y, dist = Math.hypot(dx, dy);
      this.dir = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'right' : 'left') : dy > 0 ? 'down' : 'up';
      this.hero.setFlipX(this.dir === 'left').play(`walk-${this.dir === 'left' || this.dir === 'right' ? 'side' : this.dir}`, true);
      let steps = 0;
      this.tweens.add({
        targets: this.hero, x: p.x, y: p.y, duration: (dist / SPEED) * 1000, onComplete: next,
        onUpdate: (tween) => {
          this.hero.setDepth(this.hero.y);
          const s = Math.floor((tween.progress * dist) / 9);
          if (s > steps) { steps = s; sfx.step(); }
        },
      });
    };
    next();
  }
  wander(b) {
    this.tweens.add({ targets: b, x: 30 + Math.random() * 140, y: 50 + Math.random() * 80, duration: 2500 + Math.random() * 3000, ease: 'Sine.inOut', onComplete: () => this.wander(b) });
  }

  applyPhase(instant = false) {
    const phase = dayPhase();
    if (phase === this.phase) return;
    this.phase = phase;
    const P = PHASES[phase], duration = instant ? 0 : 2500, on = P.night ? 1 : 0;
    this.isNight = P.night;
    this.overlay.setFillStyle(P.tint, this.overlay.fillAlpha);
    this.tweens.add({ targets: this.overlay, fillAlpha: P.alpha, duration });
    this.tweens.add({ targets: [...this.windows, ...this.lamps], alpha: on, duration });
    this.tweens.add({ targets: [...this.glows, ...this.lampGlows], alpha: on * 0.8, duration });
    if (!P.night) this.stars.forEach((s) => s.setAlpha(0));
    if (P.night) this.fireflies.start(); else this.fireflies.stop();
    this.flame.setVisible(phase !== 'jour' && phase !== 'aube');
    document.getElementById('sky').style.background = `linear-gradient(${P.sky[0]}, ${P.sky[1]})`;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', P.sky[0]);
    this.refreshDecor();
    this.onPhase?.(phase);
  }
  // Ce que l'île gagne avec les niveaux.
  refreshDecor() {
    const level = levelInfo(S().xp).level;
    this.lanterns.forEach((l, i) => [l, this.lamps[i], this.lampGlows[i]].forEach((o) => o.setVisible(level >= 2)));
    this.butterflies.forEach((b) => b.setVisible(level >= 3 && !this.isNight));
    this.trees[1].setTexture(level >= 3 ? 'treefruit' : 'tree');
    this.pond.setVisible(level >= 4);
  }
  setIndicators(marks, letter) {
    for (const [key, p] of Object.entries(this.places)) p.bang.setVisible(Boolean(marks[key]));
    this.flag.setVisible(letter);
  }
  celebrate(kind) {
    if (kind === 'quest') this.sparks.explode(16, 62, 42);
    if (kind === 'level') { this.sparks.explode(40, this.hero.x, this.hero.y - 18); this.cameras.main.flash(300, 255, 244, 214); }
    if (kind === 'bilan') {
      this.sparks.explode(26, 144, 100);
      const star = this.add.image(144, 98, 'staron').setDepth(DEPTH.fx);
      this.tweens.add({ targets: star, x: 104, y: 10, duration: 1500, ease: 'Sine.inOut', onComplete: () => { this.sparks.explode(22, 104, 12); star.destroy(); } });
    }
  }
  hop() { this.tweens.add({ targets: this.nimbo, scaleX: 1.15, scaleY: 0.85, duration: 110, yoyo: true }); }
  iconURL(key) {
    this.iconCache ??= {};
    this.iconCache[key] ??= this.textures.get(key).getSourceImage().toDataURL();
    return this.iconCache[key];
  }
}

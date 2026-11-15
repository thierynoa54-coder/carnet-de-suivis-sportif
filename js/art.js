// Pixel art d'Îlot, entièrement dessiné en code : aucune image externe.
// Coordonnées en pixels du monde (la caméra agrandit l'ensemble par un facteur entier).

export const ISLAND = { cx: 100, cy: 84, rx: 88, ry: 56 };
export const PLAZA = { x: 100, y: 90 };
// x, y = milieu du bas du bâtiment ; door = où le personnage s'arrête.
export const PLACES = {
  maison: { label: 'Maison', tex: 'maison', x: 62, y: 70, w: 36, h: 32, door: { x: 62, y: 75 } },
  potager: { label: 'Potager', tex: 'potager', x: 60, y: 118, w: 44, h: 28, door: { x: 60, y: 89 } },
  archives: { label: 'Archives', tex: 'archives', x: 142, y: 70, w: 24, h: 44, door: { x: 142, y: 75 } },
  feu: { label: 'Feu de camp', tex: 'feu', x: 144, y: 114, w: 28, h: 18, door: { x: 124, y: 110 } },
  observatoire: { label: 'Observatoire', tex: 'observatoire', x: 104, y: 46, w: 30, h: 34, door: { x: 104, y: 50 } },
};
export const TREES = [[30, 74], [28, 106], [168, 64], [174, 90], [166, 112], [84, 136], [122, 136]];
export const LANTERNS = [[88, 80], [112, 80], [88, 98], [100, 104], [96, 62]];
export const ROCKS = [[28, 150], [176, 146], [138, 196], [52, 186]];
// Fenêtres qui s'allument la nuit : [x, y, largeur, hauteur].
export const LIGHTS = [[53, 56, 4, 3], [68, 56, 4, 3], [140, 46, 4, 5], [103, 20, 3, 10]];

const O = '#2b2b3a';
const SHADOW = 'rgba(0,0,0,0.18)';
const FLOWERS = ['#ff9db3', '#ffd166', '#ffffff', '#b39dff', '#ff8a5c'];

// ---------- Sprites en texte : un caractère = un pixel, « . » = transparent ----------
const HERO_PAL = { o: O, h: '#7a4a2a', H: '#a0673e', s: '#f2c7a0', e: O, k: '#f4a3a3', c: '#5b8bd6', C: '#3f6db5', p: '#4a4e69', b: '#6b4229' };
const HERO_TOP = {
  down: ['....oooo....', '..oohhhhoo..', '.ohhhHHhhho.', '.ohhhhhhhho.', '.ohssssssho.', '.osesssseso.', '.okssssssko.', '..osssssso..', '..occCCcco..', '.occcccccco.', 'osccccccccso', '.oCccccccCo.'],
  up: ['....oooo....', '..oohhhhoo..', '.ohhhHHhhho.', '.ohhhhhhhho.', '.ohhhhhhhho.', '.ohhhhhhhho.', '.oshhhhhhso.', '..osssssso..', '..occcccco..', '.occcccccco.', 'osccccccccso', '.oCccccccCo.'],
  side: ['....oooo....', '...ohhhhoo..', '..ohhHHhhho.', '..ohhhhhhho.', '..ohhhsssso.', '..ohhsssseo.', '..ohsssskso.', '...ossssso..', '...occCcco..', '...occccco..', '...ocsccco..', '...oCcccCo..'],
};
const LEGS = {
  front: [
    ['..oppppppo..', '..opp..ppo..', '..obb..bbo..', '..ooo..ooo..'],
    ['..oppppppo..', '..opp..ppo..', '..obb..ooo..', '..ooo.......'],
    ['..oppppppo..', '..opp..ppo..', '..ooo..bbo..', '.......ooo..'],
  ],
  side: [
    ['...oppppo...', '...opp.po...', '...obb.bo...', '...ooo.oo...'],
    ['...oppppo...', '..oppo.ppo..', '..obbo..bbo.', '..ooo...ooo.'],
    ['...oppppo...', '....oppo....', '....obbo....', '....oooo....'],
  ],
};
const NIMBO_PAL = { o: '#8aa0c8', w: '#ffffff', W: '#dbe9ff', e: '#3b4a6b', k: '#ffb3c1' };
const NIMBO = ['...oooooo...', '..owwwwwwo..', '.owwwwwwwwo.', 'owwwwwwwwwwo', 'owwewwwwewwo', 'owkwwwwwwkwo', 'owWwweewwWwo', '.oWWWWWWWWo.', '..ooWooWoo..', '....o..o....'];
const NIMBO_BLINK = NIMBO.map((row, i) => (i === 4 ? 'owwowwwwowwo' : row));
const FLAME_PAL = { y: '#ffe066', r: '#ff8a3d', R: '#e04f2f' };
const FLAME = [
  ['...y....', '..yy....', '..ryy...', '.rryyr..', '.rRyyrr.', 'rRRryRRr', '.RRrrRR.', '..RRRR..'],
  ['....y...', '...yy...', '..yyr...', '..ryyrr.', '.rryyRr.', 'rRryyRRr', '.RRrrRR.', '..RRRR..'],
  ['..y.....', '..yy.y..', '.ryyyy..', '.rryyr..', 'rRryyrR.', 'rRRyyRRr', '.RRrrRR.', '..RRRR..'],
];
const BANG_PAL = { o: O, w: '#ffffff', r: '#e04f2f' };
const BANG = ['.ooooo.', 'owwwwwo', 'owwrwwo', 'owwrwwo', 'owwrwwo', 'owwwwwo', 'owwrwwo', '.ooooo.', '..ooo..', '...o...'];
const STAR = ['....o....', '...oYo...', 'ooooyoooo', 'oYyyyyyyo', '.oyyyyyo.', '..oyyyo..', '.oyyoyyo.', '.oyo.oyo.', '.oo...oo.'];
const STAR_PALS = {
  staron: { o: '#8a6a1f', y: '#f2c14e', Y: '#fff2a8' },
  staroff: { o: '#5b6475', y: '#9aa3b5', Y: '#c5ccd9' },
  starnone: { o: '#b8b0a0' },
};
const LUCIOLE_PAL = { g: '#b6e35a', y: '#f7f06d', Y: '#ffffff' };
const LUCIOLE = ['...g...', '..gyg..', '.gyYyg.', 'gyYYYyg', '.gyYyg.', '..gyg..', '...g...'];
const BUTTERFLY_PAL = { p: '#ff9db3', d: O };
const BUTTERFLY = [['pp.pp', 'ppdpp', '.pdp.', '..d..'], ['.p.p.', '.pdp.', '.pdp.', '..d..']];

export const SPRITE_DATA = { HERO_TOP, LEGS, NIMBO, NIMBO_BLINK, FLAME, BANG, STAR, LUCIOLE, BUTTERFLY };

// ---------- Outils de dessin ----------
function rect(ctx) {
  return (x, y, w, h, c) => {
    if (c === null) ctx.clearRect(x, y, w, h);
    else { ctx.fillStyle = c; ctx.fillRect(x, y, w, h); }
  };
}
const offset = (R, ox, oy) => (x, y, w, h, c) => R(x + ox, y + oy, w, h, c);
function pixels(R, rows, pal, ox = 0, oy = 0) {
  rows.forEach((row, y) => { for (let x = 0; x < row.length; x += 1) if (pal[row[x]]) R(ox + x, oy + y, 1, 1, pal[row[x]]); });
}
// Forme définie ligne par ligne [x, largeur], avec un contour d'un pixel tout autour.
function shape(R, spans, y0, fill, outline) {
  spans.forEach(([x, w], i) => { R(x - 1, y0 + i, w + 2, 1, outline); R(x, y0 + i - 1, w, 1, outline); R(x, y0 + i + 1, w, 1, outline); });
  spans.forEach(([x, w], i) => R(x, y0 + i, w, 1, typeof fill === 'function' ? fill(i) : fill));
}
function ell(R, cx, cy, rx, ry, c) {
  for (let y = -ry; y <= ry; y += 1) { const w = Math.round(rx * Math.sqrt(1 - (y / ry) ** 2)); R(cx - w, cy + y, 2 * w + 1, 1, c); }
}
function distSeg(x, y, a, b) {
  const dx = b.x - a.x, dy = b.y - a.y, t = Math.max(0, Math.min(1, ((x - a.x) * dx + (y - a.y) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(x - a.x - t * dx, y - a.y - t * dy);
}
function mulberry32(seed) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------- L'île ----------
function drawIsland(R, rnd) {
  const { cx, cy, rx, ry } = ISLAND;
  // Dessous : terre, puis strates de roche de plus en plus sombres, lianes et cristaux.
  for (let x = cx - rx + 1; x < cx + rx; x += 1) {
    const t = (x - cx) / rx, top = cy + ry * Math.sqrt(1 - t * t);
    const depth = Math.max(2, (1 - t * t) * 70 * (0.92 + 0.08 * Math.sin(x * 0.5)) + rnd() * 3);
    for (let y = Math.floor(top) - 2; y < top + depth; y += 1) {
      const k = (y - top) / depth, band = Math.floor((y + 2 * Math.sin(x / 7)) / 6) % 3;
      R(x, y, 1, 1, k < 0.1 ? '#8a5a3b' : k < 0.14 ? '#6b4229' : k > 0.8 ? '#4a3f37' : ['#8b7b6b', '#7a6b5d', '#6e5f52'][band]);
    }
    if (rnd() < 0.09) R(x, Math.floor(top + depth) - 1, 1, 2 + Math.floor(rnd() * 6), '#5b7a3a');
    if (rnd() < 0.03) R(x, Math.floor(top + depth * (0.3 + rnd() * 0.4)), 2, 2, '#8fd3ff');
  }
  // Dessus herbeux, liseré clair au fond et sombre devant.
  for (let y = cy - ry; y <= cy + ry; y += 1) {
    for (let x = cx - rx; x <= cx + rx; x += 1) {
      const d = ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2;
      if (d > 1) continue;
      let c = '#7cc36b';
      if (d > 0.94) c = y < cy ? '#a6dc7a' : '#4f9a4a';
      else if ((x + 2 * y) % 9 === 0 && rnd() < 0.6) c = '#8fd17a';
      else if (rnd() < 0.05) c = '#6bb35f';
      R(x, y, 1, 1, c);
    }
  }
  // Chemins de terre vers chaque lieu et place centrale.
  const doors = Object.values(PLACES).map((p) => p.door);
  const seg = (a, b, w, c) => {
    const n = Math.ceil(Math.hypot(b.x - a.x, b.y - a.y));
    for (let i = 0; i <= n; i += 1) R(Math.round(a.x + ((b.x - a.x) * i) / n) - (w >> 1), Math.round(a.y + ((b.y - a.y) * i) / n) - (w >> 1), w, w, c);
  };
  doors.forEach((d) => seg(PLAZA, d, 6, '#b5875a'));
  ell(R, PLAZA.x, PLAZA.y, 12, 7, '#b5875a');
  doors.forEach((d) => seg(PLAZA, d, 4, '#d8ae78'));
  ell(R, PLAZA.x, PLAZA.y, 11, 6, '#d8ae78');
  for (let i = 0; i < 18; i += 1) R(PLAZA.x - 9 + Math.floor(rnd() * 18), PLAZA.y - 4 + Math.floor(rnd() * 9), 2, 1, '#c99a63');
  // Fleurs, touffes et cailloux, à l'écart des chemins et des bâtiments.
  const busy = (x, y) => doors.some((d) => distSeg(x, y, PLAZA, d) < 5)
    || ((x - PLAZA.x) / 14) ** 2 + ((y - PLAZA.y) / 9) ** 2 < 1
    || Object.values(PLACES).some((p) => x > p.x - p.w / 2 - 2 && x < p.x + p.w / 2 + 2 && y > p.y - p.h && y < p.y + 3);
  for (let i = 0; i < 320; i += 1) {
    const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * 0.92;
    const x = Math.round(cx + Math.cos(a) * r * rx), y = Math.round(cy + Math.sin(a) * r * ry);
    if (busy(x, y)) continue;
    const k = rnd();
    if (k < 0.45) { R(x, y, 1, 1, '#4f9a4a'); R(x - 1, y - 1, 1, 1, '#5ea957'); R(x + 1, y - 1, 1, 1, '#5ea957'); }
    else if (k < 0.85) { R(x, y, 1, 1, FLOWERS[Math.floor(rnd() * FLOWERS.length)]); R(x, y + 1, 1, 1, '#4f9a4a'); }
    else { R(x, y, 2, 1, '#9a8f82'); R(x, y - 1, 1, 1, '#c5bcb0'); }
  }
}

// ---------- Bâtiments ----------
function drawMaison(R) {
  R(3, 29, 30, 3, SHADOW);
  R(4, 14, 28, 16, O); R(5, 15, 26, 14, '#f3e3c3'); R(5, 26, 26, 3, '#e2cfa8');
  R(5, 15, 2, 14, '#8a5a3b'); R(29, 15, 2, 14, '#8a5a3b'); R(5, 21, 26, 1, '#8a5a3b');
  const roof = Array.from({ length: 12 }, (_, i) => { const h = Math.round(3 + i * 1.25); return [18 - h, 2 * h]; });
  shape(R, roof, 3, (i) => (i % 3 === 2 ? '#a9473f' : '#d2645a'), O);
  roof.forEach(([x], i) => R(x, 3 + i, 2, 1, '#e8857a'));
  R(24, 2, 5, 7, O); R(25, 3, 3, 6, '#a99886'); R(25, 3, 3, 1, '#c5bcb0');
  R(14, 19, 8, 11, O); R(15, 20, 6, 10, '#8a5a3b'); R(15, 20, 6, 1, '#b07a4f'); R(19, 25, 1, 1, '#f2c14e');
  for (const wx of [8, 23]) {
    R(wx, 17, 6, 5, O); R(wx + 1, 18, 4, 3, '#9fc7e8'); R(wx + 1, 18, 1, 1, '#e6f4ff'); R(wx + 3, 18, 1, 3, O);
    R(wx, 22, 6, 2, '#6b4229'); R(wx + 1, 21, 1, 1, '#ff9db3'); R(wx + 4, 21, 1, 1, '#ffd166');
  }
}
function drawPotager(R) {
  R(2, 25, 40, 3, 'rgba(0,0,0,0.15)');
  for (let i = 0; i < 3; i += 1) {
    const y = 6 + i * 6;
    R(5, y, 34, 5, '#6b4527'); R(5, y, 34, 1, '#8a5a3b');
    for (let x = 7; x < 39; x += 4) R(x, y + 2, 2, 1, '#55361f');
  }
  for (const [x, y] of [[9, 7], [17, 7], [25, 13], [13, 19], [31, 19]]) { R(x, y, 1, 2, '#5fb36a'); R(x - 1, y, 1, 1, '#8fd17a'); R(x + 1, y, 1, 1, '#8fd17a'); }
  const post = (x, y) => { R(x, y, 2, 5, '#6b4229'); R(x, y, 1, 5, '#a8784a'); };
  R(2, 1, 40, 1, '#8a5a3b'); R(2, 3, 40, 1, '#8a5a3b'); R(2, 24, 40, 1, '#8a5a3b'); R(2, 26, 40, 1, '#8a5a3b');
  for (let x = 2; x <= 40; x += 6) { post(x, 0); post(x, 23); }
  R(18, 0, 8, 5, null); post(17, 0); post(25, 0); // portillon ouvert
}
function drawArchives(R) {
  R(2, 41, 20, 3, SHADOW);
  R(3, 14, 18, 28, O); R(4, 15, 16, 26, '#b9b0a3');
  for (let y = 15; y < 41; y += 3) { R(4, y, 16, 1, '#a39a8d'); for (let x = 4 + (y % 2) * 3; x < 20; x += 6) R(x, y + 1, 1, 2, '#a39a8d'); }
  R(4, 15, 2, 26, '#cfc7bb');
  const roof = Array.from({ length: 13 }, (_, i) => { const h = Math.round(1 + i * 0.85); return [12 - h, 2 * h]; });
  shape(R, roof, 2, (i) => (i % 3 === 2 ? '#5444a8' : '#6a5acd'), O);
  roof.forEach(([x], i) => R(x, 2 + i, 1, 1, '#8b7fe0'));
  R(11, 0, 2, 2, '#f2c14e');
  R(9, 19, 6, 7, O); R(10, 20, 4, 5, '#3b4a6b'); R(10, 22, 4, 1, '#8b7fe0');
  R(8, 32, 8, 10, O); R(9, 33, 6, 9, '#6b4229'); R(9, 33, 6, 1, '#8a5a3b'); R(13, 37, 1, 1, '#f2c14e');
  R(15, 28, 7, 4, O); R(16, 29, 5, 2, '#fbf3df'); R(17, 29, 3, 1, '#c9a978');
}
function drawFeu(R) {
  R(4, 14, 20, 3, 'rgba(0,0,0,0.15)');
  for (const bx of [0, 22]) { R(bx, 9, 6, 5, O); R(bx + 1, 10, 4, 3, '#8a5a3b'); R(bx + 1, 10, 4, 1, '#b07a4f'); R(bx + 2, 11, 1, 1, '#6b4229'); }
  for (const [x, y] of [[9, 11], [11, 13], [14, 14], [17, 13], [19, 11], [17, 9], [11, 9], [14, 8]]) { R(x, y, 3, 2, '#7a6b5d'); R(x, y, 2, 1, '#a99886'); }
  R(10, 11, 9, 2, '#6b4229'); R(12, 10, 5, 2, '#8a5a3b');
}
function drawObservatoire(R) {
  R(3, 31, 24, 3, SHADOW);
  R(5, 17, 20, 15, O); R(6, 18, 18, 13, '#c5bcb0');
  for (let y = 21; y < 31; y += 4) R(6, y, 18, 1, '#a99886');
  const dome = Array.from({ length: 10 }, (_, j) => { const h = Math.round(Math.sqrt(100 - (9.5 - j) ** 2)); return [15 - h, 2 * h]; });
  shape(R, dome, 8, '#dfe6f2', O);
  dome.forEach(([x, w], j) => R(x + Math.round(w * 0.62), 8 + j, Math.round(w * 0.38), 1, '#b8c4d9'));
  R(14, 8, 3, 10, '#3b4a6b');
  R(16, 6, 3, 2, O); R(18, 4, 3, 2, O); R(20, 2, 3, 2, O); R(17, 6, 2, 1, '#c9a227'); R(19, 4, 2, 1, '#c9a227'); R(21, 2, 2, 1, '#e8c547');
  R(12, 24, 7, 8, O); R(13, 25, 5, 7, '#6b4229'); R(13, 25, 5, 1, '#8a5a3b');
  R(8, 13, 1, 1, '#f2c14e'); R(22, 12, 1, 1, '#f2c14e');
}

// ---------- Décor ----------
function drawTree(R, fruit) {
  R(6, 22, 8, 2, SHADOW);
  R(8, 13, 4, 10, '#5a3a22'); R(9, 13, 1, 10, '#7a4f2f');
  const spans = [6, 10, 12, 14, 16, 16, 18, 18, 18, 16, 16, 14, 12, 8].map((w) => [10 - w / 2, w]);
  shape(R, spans, 1, '#4f9a4a', '#2f5a35');
  spans.forEach(([x, w], i) => { if (i < 8) R(x + 1, 1 + i, Math.ceil(w / 3), 1, '#6fbf5f'); else R(10, 1 + i, w / 2, 1, '#3f7f3f'); });
  if (fruit) for (const [x, y] of [[5, 5], [12, 4], [8, 8], [14, 9], [5, 11]]) { R(x, y, 2, 2, '#e04f2f'); R(x, y, 1, 1, '#ff9a8a'); }
}
function drawLantern(R) { R(2, 4, 1, 8, '#3b2f2f'); R(0, 0, 5, 5, '#3b2f2f'); R(1, 1, 3, 3, '#ffe9a3'); R(1, 11, 3, 1, '#3b2f2f'); }
function drawMailbox(R) { R(3, 5, 2, 7, '#6b4229'); R(0, 0, 8, 6, O); R(1, 1, 6, 4, '#5b8bd6'); R(1, 1, 6, 1, '#7fa6e6'); R(2, 3, 4, 1, '#3f6db5'); }
function drawRock(R) {
  R(2, 1, 8, 1, O); R(1, 2, 10, 3, O); R(2, 5, 8, 1, O); R(3, 6, 6, 1, O); R(4, 7, 3, 1, O);
  R(2, 2, 8, 3, '#8b7b6b'); R(3, 5, 6, 1, '#6e5f52'); R(4, 6, 4, 1, '#6e5f52'); R(2, 2, 8, 1, '#7cc36b'); R(3, 1, 5, 1, '#a6dc7a');
}
function drawPond(R) {
  ell(R, 13, 6, 12, 5, '#4f9a4a'); ell(R, 13, 6, 11, 4, '#5aa3d8'); ell(R, 13, 5, 9, 2, '#6fb7e8');
  R(6, 4, 4, 1, '#bfe6ff'); R(15, 7, 3, 1, '#bfe6ff'); R(17, 3, 3, 2, '#4f9a4a'); R(18, 3, 1, 1, '#ff9db3');
}
function drawCloud(R, w, h, rnd) {
  const blobs = Array.from({ length: 5 }, (_, i) => [w * (0.18 + (0.64 * i) / 4), h * (0.55 - rnd() * 0.25), h * (0.3 + rnd() * 0.2)]);
  for (let y = 0; y < h; y += 1) {
    for (let x = 0; x < w; x += 1) {
      const inBlob = blobs.some(([bx, by, r]) => (x - bx) ** 2 + (y - by) ** 2 <= r * r);
      if (inBlob || (y >= h * 0.5 && y < h - 1 && x > w * 0.1 && x < w * 0.9)) R(x, y, 1, 1, y > h * 0.72 ? '#dbe7f7' : '#ffffff');
    }
  }
}

// ---------- Textures Phaser ----------
function canvasTex(scene, key, w, h, draw) {
  if (scene.textures.exists(key)) scene.textures.remove(key);
  const t = scene.textures.createCanvas(key, w, h);
  draw(rect(t.getContext()), t.getContext());
  t.refresh();
  return t;
}
function sheet(scene, key, fw, fh, frames, pal) {
  const names = Object.keys(frames);
  const t = canvasTex(scene, key, fw * names.length, fh, (R) => names.forEach((n, i) => pixels(R, frames[n], pal, i * fw, 0)));
  names.forEach((n, i) => t.add(n, 0, i * fw, 0, fw, fh));
}
function heroFrames() {
  const frames = {};
  for (const dir of ['down', 'up', 'side']) LEGS[dir === 'side' ? 'side' : 'front'].forEach((legs, f) => { frames[`${dir}${f}`] = HERO_TOP[dir].concat(legs); });
  return frames;
}

export function buildTextures(scene) {
  const rnd = mulberry32(7);
  canvasTex(scene, 'island', 200, 220, (R) => drawIsland(R, rnd));
  canvasTex(scene, 'maison', 36, 32, drawMaison);
  canvasTex(scene, 'potager', 44, 28, drawPotager);
  canvasTex(scene, 'archives', 24, 44, drawArchives);
  canvasTex(scene, 'feu', 28, 18, drawFeu);
  canvasTex(scene, 'observatoire', 30, 34, drawObservatoire);
  canvasTex(scene, 'tree', 20, 24, (R) => drawTree(R, false));
  canvasTex(scene, 'treefruit', 20, 24, (R) => drawTree(R, true));
  canvasTex(scene, 'lantern', 5, 12, drawLantern);
  canvasTex(scene, 'mailbox', 8, 12, drawMailbox);
  canvasTex(scene, 'flag', 3, 4, (R) => { R(0, 0, 1, 4, O); R(1, 0, 2, 2, '#e04f2f'); });
  canvasTex(scene, 'rock', 12, 8, drawRock);
  canvasTex(scene, 'pond', 26, 12, drawPond);
  for (const [key, w, h] of [['cloud1', 48, 18], ['cloud2', 34, 13], ['cloud3', 64, 22]]) canvasTex(scene, key, w, h, (R) => drawCloud(R, w, h, rnd));
  canvasTex(scene, 'px', 1, 1, (R) => R(0, 0, 1, 1, '#ffffff'));
  canvasTex(scene, 'glow', 48, 48, (R, ctx) => {
    const g = ctx.createRadialGradient(24, 24, 0, 24, 24, 24);
    g.addColorStop(0, 'rgba(255,214,140,0.9)'); g.addColorStop(0.35, 'rgba(255,180,90,0.35)'); g.addColorStop(1, 'rgba(255,160,60,0)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, 48, 48);
  });
  sheet(scene, 'hero', 12, 16, heroFrames(), HERO_PAL);
  sheet(scene, 'nimbo', 12, 10, { n0: NIMBO, n1: NIMBO_BLINK }, NIMBO_PAL);
  canvasTex(scene, 'nimboface', 12, 10, (R) => pixels(R, NIMBO, NIMBO_PAL));
  sheet(scene, 'flame', 8, 8, { f0: FLAME[0], f1: FLAME[1], f2: FLAME[2] }, FLAME_PAL);
  sheet(scene, 'butterfly', 5, 4, { b0: BUTTERFLY[0], b1: BUTTERFLY[1] }, BUTTERFLY_PAL);
  canvasTex(scene, 'bang', 7, 10, (R) => pixels(R, BANG, BANG_PAL));
  for (const [key, pal] of Object.entries(STAR_PALS)) canvasTex(scene, key, 9, 9, (R) => pixels(R, STAR, pal));
  canvasTex(scene, 'luciole', 7, 7, (R) => pixels(R, LUCIOLE, LUCIOLE_PAL));

  const anim = (key, tex, frames, rate) => {
    if (!scene.anims.exists(key)) scene.anims.create({ key, frames: frames.map((frame) => ({ key: tex, frame })), frameRate: rate, repeat: -1 });
  };
  for (const d of ['down', 'up', 'side']) { anim(`idle-${d}`, 'hero', [`${d}0`], 1); anim(`walk-${d}`, 'hero', [`${d}1`, `${d}0`, `${d}2`, `${d}0`], 8); }
  anim('flame', 'flame', ['f0', 'f1', 'f2'], 7);
  anim('butterfly', 'butterfly', ['b0', 'b1'], 6);
}

// Icône de l'application (64 × 64), agrandie sans lissage par tools/render-icons.js.
export function drawIcon(ctx) {
  const R = rect(ctx), rnd = mulberry32(3);
  ['#7ec8ff', '#8fd0ff', '#a3d9ff', '#b9e3ff', '#d0eeff'].forEach((c, i) => R(0, i * 13, 64, 13, c));
  drawCloud(offset(R, 2, 50), 22, 9, rnd);
  drawCloud(offset(R, 42, 54), 18, 8, rnd);
  for (let x = 6; x < 59; x += 1) {
    const t = (x - 32) / 27, top = 44 + 7 * Math.sqrt(Math.max(0, 1 - t * t)), depth = (1 - t * t) * 14;
    for (let y = Math.floor(top) - 1; y < top + depth; y += 1) R(x, y, 1, 1, y < top + 2 ? '#8a5a3b' : (y - top) / depth > 0.7 ? '#6e5f52' : '#8b7b6b');
  }
  ell(R, 32, 44, 27, 7, '#4f9a4a');
  ell(R, 32, 43, 26, 6, '#7cc36b');
  drawTree(offset(R, -1, 21), false);
  drawMaison(offset(R, 15, 14));
  pixels(R, NIMBO, NIMBO_PAL, 48, 10);
  R(8, 8, 1, 1, '#ffffff'); R(56, 4, 1, 1, '#ffffff'); R(40, 6, 1, 1, '#ffffff');
}

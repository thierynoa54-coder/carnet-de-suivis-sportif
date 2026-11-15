// Données d'Îlot : sauvegarde locale, dates, XP et niveaux.
const KEY = 'ilot_v1';

const z2 = (n) => String(n).padStart(2, '0');
export const isoDate = (d) => `${d.getFullYear()}-${z2(d.getMonth() + 1)}-${z2(d.getDate())}`;
export const today = () => isoDate(new Date());
export function addDays(iso, n) {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + n);
  return isoDate(d);
}
// Les 7 jours (lundi → dimanche) de la semaine qui contient `iso`.
export function weekDays(iso) {
  const dow = (new Date(`${iso}T12:00:00`).getDay() + 6) % 7;
  return Array.from({ length: 7 }, (_, i) => addDays(iso, i - dow));
}
// Un bilan fait après minuit compte pour la veille.
export const bilanDate = (d = new Date()) => (d.getHours() < 5 ? addDays(isoDate(d), -1) : isoDate(d));

export function dayPhase(d = new Date()) {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 5 && h < 8) return 'aube';
  if (h >= 8 && h < 18) return 'jour';
  if (h >= 18 && h < 20) return 'crepuscule';
  if (h >= 20 && h < 21.5) return 'soiree';
  return 'nuit';
}

const blank = () => ({
  version: 1, name: '', xp: 0, lucioles: 0, quests: [], agenda: [], bilans: {},
  letterRead: '', bilanPrompt: '', weekSeen: '',
  settings: { music: true, sfx: true, bilanHour: 21 },
});
let state = blank();

const merge = (data) => ({ ...blank(), ...data, settings: { ...blank().settings, ...(data.settings || {}) } });
export function load() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved && typeof saved === 'object') state = merge(saved);
  } catch { /* sauvegarde illisible : l'île repart de zéro */ }
  return state;
}
export const S = () => state;
export function save() {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* stockage plein ou bloqué */ }
}
export function replaceState(data) { state = merge(data); save(); }
export function resetState() { try { localStorage.removeItem(KEY); } catch { /* rien à effacer */ } }

// Il faut 100 × n XP pour passer du niveau n au niveau n + 1.
export function levelInfo(xp) {
  let level = 1, need = 100, rest = xp;
  while (rest >= need) { rest -= need; level += 1; need = 100 * level; }
  return { level, into: rest, need };
}
export function gain(xp, lucioles = 0) {
  const before = levelInfo(state.xp).level;
  state.xp += xp;
  state.lucioles += lucioles;
  save();
  const { level } = levelInfo(state.xp);
  return { level, leveledUp: level > before };
}

export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
export const bilanDue = (d = new Date()) => (d.getHours() >= state.settings.bilanHour || d.getHours() < 5) && !state.bilans[bilanDate(d)];
// Nombre de bilans faits d'affilée jusqu'à aujourd'hui (ou hier si celui du jour manque encore).
export function streak() {
  let d = bilanDate(), n = 0;
  if (!state.bilans[d]) d = addDays(d, -1);
  while (state.bilans[d]) { n += 1; d = addDays(d, -1); }
  return n;
}

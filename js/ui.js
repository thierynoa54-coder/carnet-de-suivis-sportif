// Interface d'Îlot : HUD, barre de voyage, panneaux des lieux et dialogues de Nimbo.
import { S, save, gain, levelInfo, uid, today, addDays, weekDays, bilanDate, bilanDue, streak, replaceState, resetState } from './state.js';
import { sfx, setMusic, setSfx } from './audio.js';
import { PLACES } from './art.js';

let W; // scène du monde
let current = null; // panneau ouvert
let draft = {}; // réponses du bilan en cours
let installPrompt = null;
let queue = Promise.resolve(); // les messages de Nimbo passent l'un après l'autre

const $ = (sel, root = document) => root.querySelector(sel);
const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const fmt = (iso, opts) => new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', opts);
const weekKey = () => weekDays(today())[0];
const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`;
const DAYS = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
const UNLOCKS = { 2: 'Des lanternes éclairent maintenant les chemins.', 3: 'Des papillons arrivent et un arbre donne des fruits.', 4: 'Un petit étang apparaît près de la place.' };
const SOON = {
  potager: ['Le Potager', 'Bientôt, chaque habitude y deviendra une plante qui pousse quand tu la fais : sport, lecture, eau, sommeil…'],
  archives: ['La Tour aux archives', 'Bientôt, tes documents (contrat, bail, assurances) y seront rangés, et leurs échéances deviendront des quêtes.'],
};

addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); installPrompt = e; });

export function initUI(world) {
  W = world;
  W.onArrive = openPanel;
  W.onLayout = placeLabels;
  W.onPhase = refresh;
  $('#luc-ico').src = W.iconURL('luciole');
  $('#nimbo-face').src = W.iconURL('nimboface');
  $('#btn-menu').onclick = () => openPanel('reglages');
  $('#btn-sound').onclick = toggleMusic;
  $('#travel').innerHTML = Object.entries(PLACES).map(([key, p]) => `<button type="button" class="px" data-go="${key}"><img src="${W.iconURL(p.tex)}" alt=""><span>${p.label}</span><i class="dot"></i></button>`).join('');
  $('#travel').addEventListener('click', (e) => { const b = e.target.closest('[data-go]'); if (b) { sfx.pop(); W.goTo(b.dataset.go); } });
  const panel = $('#panel');
  panel.addEventListener('click', onClick);
  panel.addEventListener('change', onChange);
  panel.addEventListener('submit', onSubmit);
  addEventListener('keydown', (e) => { if (e.key === 'Escape') closePanel(); });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) tick(); });
  setInterval(tick, 60000);
  W.fit();
  renderSoundBtn();
  refresh();
  window.__ilot = { ready: true };
  greet();
}

// ---------- HUD, repères et rythme de la journée ----------
function refresh() {
  const s = S(), L = levelInfo(s.xp), t = today();
  $('#lvl').textContent = L.level;
  $('#xpfill').style.width = `${(100 * L.into) / L.need}%`;
  $('#xptxt').textContent = `${L.into}/${L.need}`;
  $('#luc').textContent = s.lucioles;
  const letter = s.letterRead !== t;
  const marks = {
    maison: letter || s.quests.some((q) => q.date === t && !q.done),
    feu: bilanDue(),
    observatoire: new Date().getDay() === 0 && s.weekSeen !== weekKey(),
  };
  W.setIndicators(marks, letter);
  document.querySelectorAll('#travel [data-go]').forEach((b) => b.querySelector('.dot').classList.toggle('on', Boolean(marks[b.dataset.go])));
}
function placeLabels() {
  const box = $('#labels'), list = Object.values(PLACES);
  if (box.children.length !== list.length) box.innerHTML = list.map((p) => `<span>${p.label}</span>`).join('');
  list.forEach((p, i) => { const pos = W.toScreen(p.x, p.y + 1); Object.assign(box.children[i].style, { left: `${pos.x}px`, top: `${pos.y}px` }); });
}
function tick() {
  W.applyPhase();
  refresh();
  const s = S();
  if (bilanDue() && s.bilanPrompt !== bilanDate() && $('#panel').hidden) { s.bilanPrompt = bilanDate(); save(); promptBilan(); }
}
async function greet() {
  const s = S();
  if (!s.name) {
    await say("Bienvenue sur ton îlot ! Moi, c'est Nimbo, un petit nuage qui veille sur toi.");
    s.name = (await ask("Comment t'appelles-tu ?", 'Ton prénom')).trim().slice(0, 24) || 'Voyageur';
    save();
    await say(`Enchanté, ${s.name} ! Chaque matin, je dépose une lettre dans ta boîte. Chaque soir à ${s.settings.bilanHour} h, on fait le point au feu de camp.`);
    await say("Touche un lieu pour t'y rendre. Commence par la Maison : tes quêtes du jour t'y attendent.");
    refresh();
    return;
  }
  if (location.hash === '#bilan' || (bilanDue() && s.bilanPrompt !== bilanDate())) {
    s.bilanPrompt = bilanDate();
    save();
    await promptBilan();
    return;
  }
  if (s.letterRead !== today()) await say(`Bonjour ${s.name} ! Ta lettre du matin t'attend à la Maison.`);
}
async function promptBilan() {
  if (!bilanDue()) return;
  if ((await say("La nuit tombe sur l'îlot… On fait le point sur ta journée ?", ['Allons-y', 'Plus tard'])) === 0) W.goTo('feu');
}
function toggleMusic() {
  const s = S().settings;
  s.music = !s.music;
  save();
  setMusic(s.music);
  renderSoundBtn();
}
function renderSoundBtn() {
  const on = S().settings.music, b = $('#btn-sound');
  b.textContent = on ? '♪' : '–';
  b.setAttribute('aria-label', on ? 'Couper la musique' : 'Activer la musique');
}

// ---------- Nimbo parle ----------
function say(text, choices = ['Continuer']) {
  queue = queue.then(() => new Promise((resolve) => {
    const box = $('#dialog'), txt = $('.txt', box), opts = $('.choices', box);
    let shown = 0;
    box.hidden = false;
    W.hop();
    txt.textContent = '';
    const timer = setInterval(() => { shown += 1; txt.textContent = text.slice(0, shown); if (shown >= text.length) clearInterval(timer); }, 22);
    opts.innerHTML = choices.map((c, k) => `<button type="button" class="btn ${k ? 'alt' : ''}" data-k="${k}">${esc(c)}</button>`).join('');
    box.onclick = (e) => {
      const b = e.target.closest('[data-k]');
      if (b) { clearInterval(timer); box.hidden = true; opts.innerHTML = ''; box.onclick = null; sfx.pop(); resolve(Number(b.dataset.k)); }
      else { clearInterval(timer); shown = text.length; txt.textContent = text; }
    };
  }));
  return queue;
}
function ask(question, placeholder) {
  queue = queue.then(() => new Promise((resolve) => {
    const box = $('#dialog'), opts = $('.choices', box);
    box.hidden = false;
    $('.txt', box).textContent = question;
    opts.innerHTML = `<input type="text" maxlength="24" placeholder="${esc(placeholder)}" aria-label="${esc(placeholder)}"><button type="button" class="btn" data-ok>Valider</button>`;
    const input = $('input', opts);
    setTimeout(() => input.focus(), 50);
    const done = () => { box.hidden = true; box.onclick = null; const v = input.value; opts.innerHTML = ''; resolve(v); };
    box.onclick = (e) => { if (e.target.closest('[data-ok]')) done(); };
    input.onkeydown = (e) => { if (e.key === 'Enter') done(); };
  }));
  return queue;
}
function toast(text, cls = '') {
  const el = document.createElement('div');
  el.className = `px ${cls}`;
  el.textContent = text;
  $('#toast').append(el);
  setTimeout(() => el.remove(), 2700);
}

// ---------- Panneaux ----------
const RENDER = { maison: renderMaison, feu: renderFeu, observatoire: renderObservatoire, reglages: renderReglages };
function openPanel(key) {
  current = key;
  $('#panel .sheet').innerHTML = (RENDER[key] || renderSoon)(key);
  $('#panel').hidden = false;
  sfx.pop();
  const s = S();
  if (key === 'maison' && s.letterRead !== today()) { s.letterRead = today(); save(); refresh(); }
  if (key === 'observatoire' && s.weekSeen !== weekKey()) { s.weekSeen = weekKey(); save(); refresh(); }
}
function closePanel() { $('#panel').hidden = true; current = null; }
function rerender() { if (current) $('#panel .sheet').innerHTML = (RENDER[current] || renderSoon)(current); }
const head = (key, title) => `<header><img src="${W.iconURL(PLACES[key]?.tex || 'nimboface')}" alt=""><h2 id="panel-title">${title}</h2><button type="button" class="px iconbtn" data-act="close" aria-label="Fermer">×</button></header>`;

function letter() {
  const s = S(), t = today(), hier = s.bilans[addDays(t, -1)];
  const todo = s.quests.filter((q) => q.date === t && !q.done);
  const agenda = s.agenda.filter((a) => a.date === t).sort((a, b) => a.time.localeCompare(b.time));
  const prio = todo.find((q) => q.priority);
  const lines = [`Bonjour ${s.name || 'toi'},`, `Nous sommes ${fmt(t, { weekday: 'long', day: 'numeric', month: 'long' })}.`];
  if (agenda.length) lines.push(`Au programme : ${agenda.map((a) => `${a.time} ${a.title}`).join(' ; ')}.`);
  if (todo.length) lines.push(`${plural(todo.length, 'quête')} t'${todo.length > 1 ? 'attendent' : 'attend'}${prio ? `, dont ta priorité d'hier : « ${prio.title.replace(/^Priorité : /, '')} »` : ''}.`);
  else lines.push('Aucune quête en attente : quelle est la chose qui rendrait ta journée réussie ?');
  if (hier?.ko) lines.push(`Hier, ce qui a coincé : « ${hier.ko} ». Aujourd'hui, on fait un pas de plus.`);
  else if (hier?.ok) lines.push(`Hier, ce qui a marché : « ${hier.ok} ». On garde le cap !`);
  lines.push('', 'Nimbo');
  return lines.join('\n');
}
const questRow = (q) => `<div class="quest ${q.done ? 'done' : ''}"><label><input type="checkbox" data-quest="${esc(q.id)}" ${q.done ? 'checked' : ''}><span>${esc(q.title)}</span></label><small>+10 XP</small><button type="button" class="link" data-act="del-q" data-id="${esc(q.id)}" aria-label="Supprimer la quête">×</button></div>`;
function renderMaison() {
  const s = S(), t = today();
  const quests = s.quests.filter((q) => q.date === t);
  const late = s.quests.filter((q) => q.date < t && !q.done);
  const agenda = s.agenda.filter((a) => a.date === t).sort((a, b) => a.time.localeCompare(b.time));
  return `${head('maison', 'La Maison')}
  <div class="letter">${esc(letter())}</div>
  <h3>Quêtes du jour (${quests.filter((q) => q.done).length}/${quests.length})</h3>
  ${quests.map(questRow).join('') || '<p class="muted">Aucune quête pour l\'instant. Ajoute la première !</p>'}
  <form class="row" data-form="quest"><input type="text" name="title" maxlength="80" placeholder="Nouvelle quête…" aria-label="Nouvelle quête" required><button class="btn">Ajouter</button></form>
  ${late.length ? `<h3>En attente (${late.length})</h3>${late.map((q) => `<div class="quest"><span>${esc(q.title)}</span><small>${esc(fmt(q.date, { day: 'numeric', month: 'short' }))}</small><button type="button" class="btn alt" data-act="today" data-id="${esc(q.id)}">Aujourd'hui</button></div>`).join('')}` : ''}
  <h3>Agenda du jour</h3>
  ${agenda.map((a) => `<div class="quest"><b>${esc(a.time)}</b><span>${esc(a.title)}</span><button type="button" class="link" data-act="del-ag" data-id="${esc(a.id)}" aria-label="Supprimer le rendez-vous">×</button></div>`).join('') || '<p class="muted">Rien de prévu.</p>'}
  <form class="row" data-form="agenda"><input type="time" name="time" aria-label="Heure" required><input type="text" name="title" maxlength="80" placeholder="Rendez-vous…" aria-label="Rendez-vous" required><button class="btn">Ajouter</button></form>
  <p class="muted small">Tes mails et ton agenda Google arriveront ici automatiquement à l'étape 4.</p>`;
}
function renderFeu() {
  const b = S().bilans[bilanDate()] || {};
  draft = { ...b };
  const choice = (name, values, labels) => `<div class="scale ${labels ? 'yn' : ''}">${values.map((v, i) => `<button type="button" data-set="${name}" data-v="${v}" class="${b[name] === v ? 'on' : ''}">${labels ? labels[i] : v}</button>`).join('')}</div>`;
  const yesNo = (name) => choice(name, [true, false], ['Oui', 'Non']);
  const scale = (name) => choice(name, [1, 2, 3, 4, 5]);
  return `${head('feu', 'Le Feu de camp')}
  <p class="nimbo-line">« On fait le point sur ta journée ? »</p>
  <form data-form="bilan">
    <div class="field"><label>1. Journée réussie ?</label>${yesNo('reussie')}<span class="sub">Note de la journée</span>${scale('note')}</div>
    <div class="field"><label>2. Énergie</label>${scale('energie')}<span class="sub">Sommeil</span>${scale('sommeil')}</div>
    <div class="field"><label>3. Séance de sport faite ?</label>${yesNo('sport')}</div>
    <div class="field"><label for="ok">4. Ce qui a fonctionné</label><textarea id="ok" name="ok" maxlength="400">${esc(b.ok)}</textarea></div>
    <div class="field"><label for="ko">5. Ce qui n'a pas fonctionné</label><textarea id="ko" name="ko" maxlength="400">${esc(b.ko)}</textarea></div>
    <div class="field"><label for="prio">6. La priorité de demain</label><input type="text" id="prio" name="priorite" maxlength="80" value="${esc(b.priorite)}"></div>
    <div class="row"><button class="btn">${S().bilans[bilanDate()] ? 'Mettre à jour' : 'Allumer une étoile'}</button></div>
  </form>`;
}
function renderObservatoire() {
  const s = S(), days = weekDays(today()), done = days.map((d) => s.bilans[d]).filter(Boolean);
  const avg = (k) => { const v = done.map((b) => b[k]).filter((x) => typeof x === 'number'); return v.length ? (v.reduce((a, b) => a + b, 0) / v.length).toFixed(1) : '–'; };
  const stars = days.map((d, i) => {
    const b = s.bilans[d], key = !b ? 'starnone' : b.reussie ? 'staron' : 'staroff';
    return `<div><img src="${W.iconURL(key)}" alt="${!b ? 'pas de bilan' : b.reussie ? 'journée réussie' : 'journée difficile'}">${DAYS[i]}</div>`;
  }).join('');
  const list = (k) => done.map((b) => b[k]).filter(Boolean).map((v) => `<li>${esc(v)}</li>`).join('') || '<li class="muted">Rien encore.</li>';
  return `${head('observatoire', "L'Observatoire")}
  <p>La constellation de ta semaine : chaque journée réussie allume une étoile.</p>
  <div class="stars">${stars}</div>
  <p><b>${plural(done.filter((b) => b.reussie).length, 'étoile')}</b> cette semaine · série de bilans : <b>${plural(streak(), 'jour')}</b></p>
  <p>Moyennes : note ${avg('note')} · énergie ${avg('energie')} · sommeil ${avg('sommeil')} · sport ${done.filter((b) => b.sport).length} fois</p>
  <h3>Ce qui a fonctionné</h3><ul>${list('ok')}</ul>
  <h3>Ce qui n'a pas fonctionné</h3><ul>${list('ko')}</ul>
  <p class="muted small">L'analyse de ta semaine par Claude arrive à l'étape 3.</p>`;
}
function renderSoon(key) {
  const [title, text] = SOON[key];
  return `${head(key, title)}<p>${text}</p><p class="muted small">Ouverture à l'étape 2.</p>`;
}
function renderReglages() {
  const s = S();
  return `${head('reglages', 'Réglages')}
  <form data-form="settings">
    <div class="field"><label for="nm">Ton prénom</label><input type="text" id="nm" name="name" maxlength="24" value="${esc(s.name)}"></div>
    <div class="field"><label for="bh">Heure du bilan du soir</label><select id="bh" name="bilanHour">${[18, 19, 20, 21, 22, 23].map((h) => `<option value="${h}" ${h === s.settings.bilanHour ? 'selected' : ''}>${h} h</option>`).join('')}</select></div>
    <div class="field"><label><input type="checkbox" name="music" ${s.settings.music ? 'checked' : ''}> Musique</label> <label><input type="checkbox" name="sfx" ${s.settings.sfx ? 'checked' : ''}> Bruitages</label></div>
    <div class="row"><button class="btn">Enregistrer</button></div>
  </form>
  <h3>Installer le jeu</h3>
  <p>iPhone : dans Safari, bouton Partager puis « Sur l'écran d'accueil ». PC : icône « Installer » de la barre d'adresse.</p>
  ${installPrompt ? '<button type="button" class="btn" data-act="install">Installer Îlot</button>' : ''}
  <h3>Rappel du soir sur iPhone</h3>
  <p>App Raccourcis, Automatisation, « Heure de la journée » à ${s.settings.bilanHour} h 00, chaque jour, exécution immédiate, action « Ouvrir les URL » avec l'adresse du jeu suivie de <code>#bilan</code>.</p>
  <h3>Sauvegarde</h3>
  <div class="row"><button type="button" class="btn alt" data-act="export">Exporter (.json)</button><label class="btn alt">Importer<input type="file" accept="application/json,.json" data-import hidden></label></div>
  <div class="row"><button type="button" class="btn danger" data-act="reset">Recommencer à zéro</button></div>`;
}

// ---------- Actions ----------
function reward(xp, lucioles) {
  const r = gain(xp, lucioles);
  refresh();
  toast(`+${xp} XP · +${plural(lucioles, 'luciole')}`);
  if (r.leveledUp) {
    setTimeout(() => {
      sfx.level();
      W.celebrate('level');
      W.refreshDecor();
      toast(`Niveau ${r.level} ! ${UNLOCKS[r.level] || 'Ton îlot grandit.'}`, 'levelup');
    }, 700);
  }
}
function onClick(e) {
  if (e.target.id === 'panel') { closePanel(); return; }
  const b = e.target.closest('[data-act],[data-set]');
  if (!b) return;
  const s = S(), id = b.dataset.id;
  if (b.dataset.set) {
    const v = b.dataset.v;
    draft[b.dataset.set] = v === 'true' ? true : v === 'false' ? false : Number(v);
    b.parentElement.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    sfx.pop();
    return;
  }
  switch (b.dataset.act) {
    case 'close': closePanel(); break;
    case 'today': { const q = s.quests.find((x) => x.id === id); if (q) q.date = today(); save(); rerender(); refresh(); break; }
    case 'del-q': s.quests = s.quests.filter((x) => x.id !== id); save(); rerender(); refresh(); break;
    case 'del-ag': s.agenda = s.agenda.filter((x) => x.id !== id); save(); rerender(); break;
    case 'install': installPrompt?.prompt(); installPrompt = null; break;
    case 'export': exportSave(); break;
    case 'reset': if (confirm('Effacer toute ton île ? Cette action est définitive.')) { resetState(); location.reload(); } break;
    default: break;
  }
}
function onChange(e) {
  const t = e.target;
  if (t.dataset.quest) {
    const q = S().quests.find((x) => x.id === t.dataset.quest);
    if (!q) return;
    q.done = t.checked;
    save();
    if (q.done && !q.rewarded) { q.rewarded = true; save(); reward(10, 1); W.celebrate('quest'); sfx.quest(); }
    rerender();
    refresh();
  }
  if ('import' in t.dataset && t.files?.[0]) importSave(t.files[0]);
}
function onSubmit(e) {
  e.preventDefault();
  const f = e.target, data = new FormData(f), s = S();
  const text = (k) => String(data.get(k) ?? '').trim();
  switch (f.dataset.form) {
    case 'quest':
      if (!text('title')) return;
      s.quests.push({ id: uid(), title: text('title'), date: today(), done: false });
      save(); sfx.pop(); rerender(); refresh();
      $('#panel [data-form="quest"] input')?.focus();
      break;
    case 'agenda':
      if (!text('title') || !text('time')) return;
      s.agenda.push({ id: uid(), date: today(), time: text('time'), title: text('title') });
      save(); rerender();
      break;
    case 'bilan': saveBilan(data); break;
    case 'settings':
      s.name = text('name').slice(0, 24) || s.name;
      s.settings.bilanHour = Number(data.get('bilanHour')) || 21;
      s.settings.music = data.has('music');
      s.settings.sfx = data.has('sfx');
      save(); setMusic(s.settings.music); setSfx(s.settings.sfx); renderSoundBtn(); refresh();
      toast('Réglages enregistrés');
      break;
    default: break;
  }
}
function saveBilan(data) {
  if (typeof draft.reussie !== 'boolean') { toast("Dis-moi d'abord si ta journée est réussie."); return; }
  const s = S(), d = bilanDate(), first = !s.bilans[d];
  const b = { ...draft, ok: String(data.get('ok') ?? '').trim(), ko: String(data.get('ko') ?? '').trim(), priorite: String(data.get('priorite') ?? '').trim(), savedAt: new Date().toISOString() };
  // La priorité de demain devient une quête du lendemain.
  let q = b.prioId && s.quests.find((x) => x.id === b.prioId);
  if (b.priorite) {
    if (q) q.title = `Priorité : ${b.priorite}`;
    else { q = { id: uid(), title: `Priorité : ${b.priorite}`, date: addDays(d, 1), done: false, priority: true }; s.quests.push(q); }
    b.prioId = q.id;
  } else if (q && !q.done) {
    s.quests = s.quests.filter((x) => x !== q);
    delete b.prioId;
  }
  s.bilans[d] = b;
  save();
  closePanel();
  refresh();
  if (!first) { toast('Bilan mis à jour'); return; }
  reward(30, 3);
  W.celebrate('bilan');
  sfx.bilan();
  say(b.reussie ? `Une étoile s'allume à l'observatoire. Belle journée, ${s.name} ! Dors bien.` : `Merci pour ta franchise, ${s.name}. Demain est une nouvelle page. Dors bien.`);
}
function exportSave() {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(S(), null, 2)], { type: 'application/json' }));
  a.download = `ilot-sauvegarde-${today()}.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}
async function importSave(file) {
  try {
    const data = JSON.parse(await file.text());
    if (!data || typeof data.xp !== 'number' || !Array.isArray(data.quests) || typeof data.bilans !== 'object') throw new Error('format');
    replaceState(data);
    location.reload();
  } catch {
    toast("Ce fichier n'est pas une sauvegarde d'Îlot.");
  }
}

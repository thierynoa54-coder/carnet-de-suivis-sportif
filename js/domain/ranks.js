import { MUSCLE_GROUPS, MUSCLE_LABELS } from "../seed.js";
import { saveState, state } from "../state.js";
import { escapeHtml } from "../utils.js";
import { computeMuscleStats } from "./muscles.js";

// ---------- Paliers de rang façon jeu vidéo (XP cumulé à vie, ne redescend jamais) ----------
export const RANK_TIERS = [
  { key:"none",     label:"Non classé",  xp:0,    color:"#B9C0CC" },
  { key:"bronze1",  label:"Bronze I",    xp:15,   color:"#A9713F" },
  { key:"bronze2",  label:"Bronze II",   xp:45,   color:"#A9713F" },
  { key:"bronze3",  label:"Bronze III",  xp:90,   color:"#A9713F" },
  { key:"argent1",  label:"Argent I",    xp:150,  color:"#8891A0" },
  { key:"argent2",  label:"Argent II",   xp:225,  color:"#8891A0" },
  { key:"argent3",  label:"Argent III",  xp:315,  color:"#8891A0" },
  { key:"or1",      label:"Or I",        xp:420,  color:"#C08B2C" },
  { key:"or2",      label:"Or II",       xp:540,  color:"#C08B2C" },
  { key:"or3",      label:"Or III",      xp:675,  color:"#C08B2C" },
  { key:"platine",  label:"Platine",     xp:825,  color:"#3E9C8F" },
  { key:"diamant",  label:"Diamant",     xp:1200, color:"#3E7CD6" },
  { key:"champion", label:"Champion",    xp:1800, color:"#2E5AAC" },
  { key:"legende",  label:"Légende",     xp:2700, color:"#8B3EC7" }
];
export function getRankForXP(xp){
  let idx = 0;
  for(let i=0;i<RANK_TIERS.length;i++){ if(xp >= RANK_TIERS[i].xp) idx = i; }
  const tier = RANK_TIERS[idx];
  const next = RANK_TIERS[idx+1] || null;
  const progressPct = next ? Math.min(100, Math.round(((xp - tier.xp) / (next.xp - tier.xp)) * 100)) : 100;
  return { ...tier, tierIndex:idx, xp, next, progressPct };
}

// ---------- Niveau global du "personnage" (cumul de l'XP de tous les groupes musculaires) ----------
export const LEVEL_TITLES = [
  { level:1,  title:"Débutant" },
  { level:4,  title:"Combattant" },
  { level:8,  title:"Guerrier" },
  { level:13, title:"Vétéran" },
  { level:20, title:"Champion absolu" }
];
export const XP_PER_LEVEL = 150;
export function getLevelForXP(totalXP){
  const level = Math.floor(totalXP / XP_PER_LEVEL) + 1;
  const xpIntoLevel = totalXP % XP_PER_LEVEL;
  const progressPct = Math.round((xpIntoLevel / XP_PER_LEVEL) * 100);
  let title = LEVEL_TITLES[0].title;
  LEVEL_TITLES.forEach(t=>{ if(level >= t.level) title = t.title; });
  return { level, title, xpIntoLevel, xpForNextLevel:XP_PER_LEVEL, progressPct, totalXP };
}
export function getTotalXP(stats){
  return MUSCLE_GROUPS.reduce((sum,m)=> sum + (stats[m] ? stats[m].totalXP : 0), 0);
}

// Détecte les montées de rang / de niveau depuis le dernier calcul, et met à jour l'état sauvegardé.
export function checkRankUps(){
  const stats = computeMuscleStats();
  if(!state.muscleRankState) state.muscleRankState = {};
  const promotions = [];
  MUSCLE_GROUPS.forEach(m=>{
    const rank = getRankForXP(stats[m].totalXP);
    const prevKey = state.muscleRankState[m];
    if(prevKey !== undefined){
      const prevIdx = RANK_TIERS.findIndex(t=>t.key===prevKey);
      if(rank.tierIndex > prevIdx){
        promotions.push({ muscle:m, label:MUSCLE_LABELS[m], rank });
      }
    }
    state.muscleRankState[m] = rank.key;
  });
  const totalXP = getTotalXP(stats);
  const level = getLevelForXP(totalXP);
  const hasPrevLevel = typeof state.globalLevelState === "number";
  const prevLevel = hasPrevLevel ? state.globalLevelState : level.level;
  const levelUp = hasPrevLevel && level.level > prevLevel;
  state.globalLevelState = level.level;
  saveState();
  if(promotions.length || levelUp){
    showRankUpCelebration(promotions, levelUp ? level : null);
  }
}

// ---------- Célébration animée (montée de rang / de niveau) ----------
export function showRankUpCelebration(promotions, levelInfo){
  const overlay = document.createElement("div");
  overlay.className = "rankup-overlay";
  let inner = "";
  if(levelInfo){
    inner += `<div class="rankup-badge" style="background:var(--accent);">★</div>
      <div class="rankup-title">Niveau supérieur</div>
      <div class="rankup-name">Niveau ${levelInfo.level} — ${escapeHtml(levelInfo.title)}</div>`;
  } else {
    const first = promotions[0];
    inner += `<div class="rankup-badge" style="background:${first.rank.color};">▲</div>
      <div class="rankup-title">Rang supérieur</div>
      <div class="rankup-name">${escapeHtml(first.label)} — ${escapeHtml(first.rank.label)}</div>`;
  }
  if(promotions.length){
    inner += `<div class="rankup-list">${promotions.map(p=>`<span style="color:${p.rank.color}; font-weight:700;">${escapeHtml(p.label)}</span> → ${escapeHtml(p.rank.label)}`).join("<br>")}</div>`;
  }
  overlay.innerHTML = `<div class="rankup-card">${inner}<div class="rankup-hint">Tape pour continuer</div></div>`;
  document.body.appendChild(overlay);
  const card = overlay.querySelector(".rankup-card");
  spawnConfetti(card, 20);
  const dismiss = ()=>{
    overlay.classList.add("closing");
    setTimeout(()=> overlay.remove(), 250);
  };
  overlay.addEventListener("click", dismiss);
  setTimeout(dismiss, 4000);
}
export function spawnConfetti(container, count){
  const colors = ["#2E5AAC","#C08B2C","#8891A0","#A9713F","#3E9C8F","#8B3EC7"];
  for(let i=0;i<count;i++){
    const p = document.createElement("div");
    p.className = "confetti-piece";
    const angle = Math.random()*Math.PI*2;
    const dist = 55 + Math.random()*95;
    p.style.setProperty("--dx", (Math.cos(angle)*dist).toFixed(1)+"px");
    p.style.setProperty("--dy", (Math.sin(angle)*dist).toFixed(1)+"px");
    p.style.background = colors[i % colors.length];
    p.style.animationDelay = (Math.random()*0.12).toFixed(2)+"s";
    container.appendChild(p);
  }
}

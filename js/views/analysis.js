import { saveState, state } from "../state.js";
import { escapeHtml, fmtDateHuman, showToast, todayISO } from "../utils.js";
import { estimateSessionKcalDone, getWeightKg } from "../domain/energy.js";
import { daysBetweenISO } from "../domain/muscles.js";
import { render } from "../render.js";
import { copyForFreeAnalysis, localAiChatHistory, refreshLocalAiChatBox, renderLocalAiChatMessages, runAiAnalysis, sendLocalAiMessage, setLocalAiStatus } from "../ai.js";
import { COLS_CLOSE, COLS_OPEN, COLS_SPLIT } from "../layout.js";

// ============================================================
// VUE : ANALYSE (poids, courbe, résumé d'activité, notes)
// ============================================================
export let weightChartRangeDays = 90; // 30 / 90 / Infinity

export function getWeightEntriesSorted(){
  return Object.keys(state.weightLog||{}).sort().map(d=>({ dateISO:d, weight:state.weightLog[d] }));
}
export function filterEntriesByRange(entries, days){
  if(days === Infinity) return entries;
  const today = new Date();
  return entries.filter(e => daysBetweenISO(e.dateISO, today) <= days);
}
export function buildWeightChartSVG(entries){
  const width = 320, height = 130, pad = 12;
  if(entries.length < 2){
    return `<div class="empty" style="padding:30px 10px;">Ajoute au moins 2 pesées pour voir la courbe.</div>`;
  }
  const weights = entries.map(e=>e.weight);
  const minW = Math.min(...weights), maxW = Math.max(...weights);
  const rangeW = Math.max(0.5, maxW - minW);
  const stepX = (width - pad*2) / (entries.length - 1);
  const points = entries.map((e,i)=>{
    const x = pad + i*stepX;
    const y = pad + (height - pad*2) * (1 - (e.weight - minW) / rangeW);
    return { x, y, ...e };
  });
  const pathD = points.map((p,i)=> (i===0?"M":"L") + p.x.toFixed(1) + "," + p.y.toFixed(1)).join(" ");
  const areaD = pathD + ` L${points[points.length-1].x.toFixed(1)},${height-pad} L${points[0].x.toFixed(1)},${height-pad} Z`;
  // Le graphique s'étire sur toute la largeur de la carte : vector-effect garde des traits
  // et des points réguliers quelle que soit la largeur (téléphone ou PC).
  let svg = `<div class="weight-chart"><div class="chart-label">${maxW.toFixed(1)} kg</div>
    <svg viewBox="0 0 ${width} ${height}" width="100%" height="${height}" preserveAspectRatio="none" role="img" aria-label="Courbe de poids : de ${points[0].weight.toFixed(1)} à ${points[points.length-1].weight.toFixed(1)} kg">
    <path d="${areaD}" fill="var(--accent-tint)" stroke="none"/>
    <path d="${pathD}" fill="none" stroke="var(--accent-ink)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke"/>`;
  points.forEach((p,i)=>{
    const isLast = i===points.length-1;
    svg += `<path d="M${p.x.toFixed(1)},${p.y.toFixed(1)} h0" stroke="var(--accent-ink)" stroke-width="${isLast?10:6}" stroke-linecap="round" vector-effect="non-scaling-stroke"/>`;
  });
  svg += `</svg><div class="chart-label">${minW.toFixed(1)} kg</div></div>`;
  return svg;
}
export function computeActivitySummary(){
  const today = new Date();
  function sessionsInRange(minAgo, maxAgo){
    let count = 0;
    Object.keys(state.logs).forEach(dateISO=>{
      const daysAgo = daysBetweenISO(dateISO, today);
      if(daysAgo>=minAgo && daysAgo<=maxAgo){
        if(Object.values(state.logs[dateISO].exercises||{}).some(e=>e.done)) count++;
      }
    });
    return count;
  }
  function avgRPE(minAgo, maxAgo){
    let sum=0, n=0;
    Object.keys(state.logs).forEach(dateISO=>{
      const daysAgo = daysBetweenISO(dateISO, today);
      if(daysAgo>=minAgo && daysAgo<=maxAgo){
        Object.values(state.logs[dateISO].exercises||{}).forEach(e=>{ if(e.done && e.rpe){ sum+=e.rpe; n++; } });
      }
    });
    return n ? sum/n : null;
  }
  let kcal7 = 0;
  Object.keys(state.logs).forEach(dateISO=>{
    if(daysBetweenISO(dateISO, today) <= 6){
      kcal7 += estimateSessionKcalDone(state.logs[dateISO], getWeightKg()).kcal;
    }
  });
  return {
    thisWeek: sessionsInRange(0,6),
    lastWeek: sessionsInRange(7,13),
    rpeRecent: avgRPE(0,13),
    rpePrior: avgRPE(14,27),
    kcal7
  };
}

// Régression linéaire simple (méthode des moindres carrés) sur les pesées -> tendance en kg/semaine
export function computeWeightTrend(entries){
  if(entries.length < 3) return null;
  const today = new Date();
  const xs = entries.map(e => -daysBetweenISO(e.dateISO, today)); // jours écoulés (négatif = passé)
  const ys = entries.map(e => e.weight);
  const n = xs.length;
  const sumX = xs.reduce((a,b)=>a+b,0), sumY = ys.reduce((a,b)=>a+b,0);
  const sumXY = xs.reduce((a,x,i)=>a+x*ys[i],0);
  const sumXX = xs.reduce((a,x)=>a+x*x,0);
  const denom = (n*sumXX - sumX*sumX);
  if(denom === 0) return null;
  const slopePerDay = (n*sumXY - sumX*sumY) / denom; // kg/jour
  return slopePerDay * 7; // kg/semaine
}

// Records personnels + régularité hebdomadaire (8 dernières semaines) — 100% calculé, pas d'IA
export function computePersonalRecords(){
  const weightKg = getWeightKg();
  let bestKcal = 0, bestKcalDate = null, totalKcalAllTime = 0, totalSessions = 0;
  Object.keys(state.logs).forEach(dateISO=>{
    const log = state.logs[dateISO];
    if(!Object.values(log.exercises||{}).some(e=>e.done)) return;
    totalSessions++;
    const kcal = estimateSessionKcalDone(log, weightKg).kcal;
    totalKcalAllTime += kcal;
    if(kcal > bestKcal){ bestKcal = kcal; bestKcalDate = dateISO; }
  });

  const today = new Date();
  let weeksWithConsistency = 0;
  for(let w=0; w<8; w++){
    const minAgo = w*7, maxAgo = w*7+6;
    let count = 0;
    Object.keys(state.logs).forEach(dateISO=>{
      const daysAgo = daysBetweenISO(dateISO, today);
      if(daysAgo>=minAgo && daysAgo<=maxAgo && Object.values(state.logs[dateISO].exercises||{}).some(e=>e.done)) count++;
    });
    if(count >= 2) weeksWithConsistency++;
  }

  return { bestKcal, bestKcalDate, totalKcalAllTime: Math.round(totalKcalAllTime), totalSessions, weeksWithConsistency };
}
export const NOTE_KEYWORDS = ["douleur","blessure","fatigue","épuisé","epuise","crampe","mal au","mal aux","mal a","mal à"];
export function scanRecentNotes(limit){
  const dates = Object.keys(state.logs).filter(d=>state.logs[d].note && state.logs[d].note.trim()).sort((a,b)=>b.localeCompare(a));
  const recent = dates.slice(0, limit).map(d=>({ dateISO:d, note:state.logs[d].note }));
  const flagged = [];
  dates.slice(0,30).forEach(d=>{
    const low = state.logs[d].note.toLowerCase();
    NOTE_KEYWORDS.forEach(k=>{ if(low.includes(k)) flagged.push({ dateISO:d, keyword:k }); });
  });
  return { recent, flagged };
}

export function renderAnalysis(app){
  const allEntries = getWeightEntriesSorted();
  const rangeEntries = filterEntriesByRange(allEntries, weightChartRangeDays);
  const activity = computeActivitySummary();
  const notesInfo = scanRecentNotes(5);

  let html = `<div class="eyebrow">Analyse</div>`;
  html += COLS_OPEN;

  // ---- Poids ----
  html += `<div class="card">
    <div class="section-title" style="margin-bottom:8px;">Poids à la pesée</div>
    <div style="display:flex; gap:8px; align-items:flex-end;">
      <div class="field-row" style="flex:1; margin-bottom:0;"><label>Date</label><input type="date" id="weightDateInput" value="${todayISO()}"></div>
      <div class="field-row" style="flex:1; margin-bottom:0;"><label>Poids (kg)</label><input type="number" step="0.1" id="weightValueInput" placeholder="ex : 106.4"></div>
      <button class="btn accent" id="addWeightBtn" style="min-height:44px;">Ajouter</button>
    </div>
  </div>`;

  if(allEntries.length){
    const last = allEntries[allEntries.length-1];
    const first = rangeEntries[0];
    const delta = first ? (last.weight - first.weight) : 0;
    const deltaStr = delta>0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);
    html += `<div class="card">
      <div class="section-title" style="margin-bottom:2px;">Évolution</div>
      <div class="section-meta" style="margin-bottom:10px;">Dernière pesée : ${last.weight} kg (${fmtDateHuman(last.dateISO)})${rangeEntries.length>1?` · ${deltaStr} kg sur la période affichée`:""}</div>
      <div style="display:flex; gap:6px; margin-bottom:10px;">
        ${[["30",30],["90",90],["Tout",Infinity]].map(([label,val])=>
          `<span class="prog-pill range-pill ${weightChartRangeDays===val?'active':''}" data-range="${val===Infinity?'inf':val}">${label}${val!==Infinity?'j':''}</span>`
        ).join("")}
      </div>
      ${buildWeightChartSVG(rangeEntries)}
    </div>`;
  } else {
    html += `<div class="empty" style="padding:26px 10px;">Aucune pesée enregistrée — ajoute ta première ci-dessus.</div>`;
  }

  // ---- Tendance calculée + records personnels (100% calcul, pas d'IA) ----
  const trend = computeWeightTrend(rangeEntries.length>=3 ? rangeEntries : allEntries);
  const records = computePersonalRecords();
  html += `<div class="card">
    <div class="section-title" style="margin-bottom:8px;">Tendances & records</div>
    ${trend!==null ? `<div class="exo"><div class="exo-desc"><strong>Tendance de poids :</strong> ${trend>0?"+":""}${trend.toFixed(2)} kg/semaine (calculée sur les pesées affichées)</div></div>` : ""}
    <div class="exo"><div class="exo-desc"><strong>Meilleure séance :</strong> ${records.bestKcal ? `≈ ${records.bestKcal} kcal le ${fmtDateHuman(records.bestKcalDate)}` : "—"}</div></div>
    <div class="exo"><div class="exo-desc"><strong>Cumul à vie :</strong> ${records.totalSessions} séances validées · ≈ ${records.totalKcalAllTime} kcal au total</div></div>
    <div class="exo"><div class="exo-desc"><strong>Régularité :</strong> ${records.weeksWithConsistency}/8 dernières semaines avec au moins 2 séances</div></div>
  </div>`;

  // ---- Résumé d'activité ----
  const rpeTrend = (activity.rpeRecent!=null && activity.rpePrior!=null)
    ? (activity.rpeRecent > activity.rpePrior ? "en hausse" : activity.rpeRecent < activity.rpePrior ? "en baisse" : "stable")
    : null;
  html += `<div class="card">
    <div class="section-title" style="margin-bottom:8px;">Résumé d'activité</div>
    <div class="exo">
      <div class="exo-desc"><strong>Séances validées :</strong> ${activity.thisWeek} cette semaine (contre ${activity.lastWeek} la semaine précédente)</div>
    </div>
    <div class="exo">
      <div class="exo-desc"><strong>RPE moyen (14j) :</strong> ${activity.rpeRecent!=null?activity.rpeRecent.toFixed(1):"—"}${rpeTrend?` · ${rpeTrend} par rapport aux 14j précédents`:""}</div>
    </div>
    <div class="exo">
      <div class="exo-desc"><strong>Calories (7 derniers jours) :</strong> ≈ ${Math.round(activity.kcal7)} kcal</div>
    </div>
  </div>`;

  // ---- Analyse détaillée : gratuite (copier/coller), IA locale expérimentale, ou API (payante) ----
  const gpuSupported = typeof navigator !== "undefined" && "gpu" in navigator;
  html += COLS_SPLIT;
  html += `<div class="card">
    <div class="section-title" style="margin-bottom:2px;">Analyse détaillée</div>
    <div class="section-meta">Une lecture plus fine de tes séances et notes.</div>
    <button class="btn ghost block" id="copyForClaudeBtn" style="margin-top:10px;">📋 Copier le résumé (gratuit — à coller dans Claude.ai)</button>
    <div class="exo-desc" style="margin-top:6px;">Colle ensuite ce texte dans n'importe quelle conversation Claude.ai (compte gratuit) pour obtenir une analyse détaillée, sans clé API ni frais.</div>

    <div style="border-top:1px solid var(--line-soft); margin:14px 0;"></div>
    <div class="section-title" style="font-size:13px; margin-bottom:2px;">IA locale — coach personnel (expérimental, gratuit, 100% sur ton appareil)</div>
    ${gpuSupported ? `
      <div class="exo-desc" style="margin-bottom:8px;">Discute librement : demande-lui un compte-rendu, un avis, des conseils. Elle connaît tes séances et ton poids récents à chaque nouvelle conversation. Premier message : téléchargement du modèle (~500 Mo-1 Go, idéalement en Wi-Fi). Réponses plus lentes et moins fines qu'avec Claude — expérimental.</div>
      <div id="localAiChatBox" class="chat-box">${renderLocalAiChatMessages()}</div>
      <div style="display:flex; gap:8px; margin-top:10px;">
        <input type="text" id="localAiChatInput" placeholder="ex : Comment s'est passée ma semaine ?" style="flex:1;">
        <button class="btn accent" id="localAiSendBtn" style="min-height:44px;">Envoyer</button>
      </div>
      <button class="btn ghost small" id="localAiResetBtn" style="margin-top:8px;">🔄 Nouvelle conversation (recharge tes données à jour)</button>
      <div id="localAiStatus" style="margin-top:10px;"></div>
    ` : `
      <div class="exo-desc">Ton navigateur ne supporte pas WebGPU (requis pour l'IA locale) — utilise plutôt le copier-coller ci-dessus.</div>
    `}

    <div style="border-top:1px solid var(--line-soft); margin:14px 0;"></div>
    <button class="btn accent block" id="aiAnalyzeBtn">🔮 Lancer une analyse directement ici (nécessite une clé API, payant)</button>
    <div id="aiAnalysisResult" style="margin-top:12px;"></div>
  </div>`;

  // ---- Notes récentes / alertes ----
  html += `<div class="card">
    <div class="section-title" style="margin-bottom:8px;">Notes de séance récentes</div>`;
  if(notesInfo.flagged.length){
    const uniqueDates = [...new Set(notesInfo.flagged.map(f=>f.dateISO))];
    html += `<div class="divider-note" style="border-left-color:var(--danger);">⚠ Mots-clés à surveiller (douleur/fatigue/blessure) repérés dans ${uniqueDates.length} note(s) récente(s) — relis-les si besoin.</div>`;
  }
  if(notesInfo.recent.length){
    notesInfo.recent.forEach(n=>{
      html += `<div class="exo"><div class="exo-desc"><strong>${fmtDateHuman(n.dateISO)}</strong> — ${escapeHtml(n.note)}</div></div>`;
    });
  } else {
    html += `<div class="exo-desc">Aucune note pour l'instant. Écris ce que tu ressens sur "Aujourd'hui" pour les retrouver ici.</div>`;
  }
  html += `</div>`;
  html += COLS_CLOSE;

  app.innerHTML = html;

  document.getElementById("addWeightBtn").addEventListener("click", ()=>{
    const dateVal = document.getElementById("weightDateInput").value || todayISO();
    const weightVal = parseFloat(document.getElementById("weightValueInput").value);
    if(!weightVal || weightVal<=0){ showToast("Entre un poids valide.", true); return; }
    state.weightLog[dateVal] = weightVal;
    saveState();
    showToast("Pesée enregistrée.");
    render();
  });
  document.querySelectorAll(".range-pill").forEach(pill=>{
    pill.addEventListener("click", ()=>{
      const v = pill.dataset.range;
      weightChartRangeDays = v === "inf" ? Infinity : Number(v);
      render();
    });
  });
  document.getElementById("aiAnalyzeBtn").addEventListener("click", runAiAnalysis);
  document.getElementById("copyForClaudeBtn").addEventListener("click", copyForFreeAnalysis);
  const localAiSendBtn = document.getElementById("localAiSendBtn");
  if(localAiSendBtn){
    localAiSendBtn.addEventListener("click", sendLocalAiMessage);
    document.getElementById("localAiChatInput").addEventListener("keydown", (e)=>{
      if(e.key === "Enter") sendLocalAiMessage();
    });
  }
  const localAiResetBtn = document.getElementById("localAiResetBtn");
  if(localAiResetBtn){
    localAiResetBtn.addEventListener("click", ()=>{
      localAiChatHistory.length = 0;
      setLocalAiStatus("");
      refreshLocalAiChatBox();
    });
  }
}

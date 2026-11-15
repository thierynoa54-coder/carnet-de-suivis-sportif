import { MUSCLE_GROUPS, MUSCLE_LABELS, MUSCLE_ON_DIAGRAM } from "../seed.js";
import { getSessionExercises, isSupTaken, saveState, state } from "../state.js";
import { BODY_SVG, FIST_SVG } from "../assets.js";
import { escapeHtml, fmtDateHuman } from "../utils.js";
import { estimateSessionKcalDone, getWeightKg } from "../domain/energy.js";
import { computeMuscleStats } from "../domain/muscles.js";
import { getLevelForXP, getRankForXP, getTotalXP } from "../domain/ranks.js";
import { render } from "../render.js";
import { bindExerciseLogInputs, bindSupplementsCard, computeSupplementDoseText, formatKcalText, renderProgramCard, renderReadOnlyMainProgram, renderReadOnlyProgram, renderSupplementsCard } from "./today.js";
import { armDangerButton } from "./programs.js";

export function renderMuscleSection(){
  const stats = computeMuscleStats();
  const neglectedList = MUSCLE_GROUPS.filter(m=>stats[m].neglected).map(m=>MUSCLE_LABELS[m]);
  const totalXP = getTotalXP(stats);
  const level = getLevelForXP(totalXP);

  let html = `<div class="eyebrow">Suivi musculaire</div>
  <div class="card">
    <div class="level-card">
      <div class="level-badge">${level.level}</div>
      <div class="level-info">
        <div class="level-title">Niveau ${level.level} <span class="level-subtitle">— ${escapeHtml(level.title)}</span></div>
        <div class="level-bar"><div class="level-bar-fill" style="width:${level.progressPct}%"></div></div>
        <div class="level-xp">${level.xpIntoLevel} / ${level.xpForNextLevel} XP · ${totalXP} XP au total</div>
      </div>
    </div>
  </div>

  <div class="card">
    <div class="section-title" style="margin-bottom:2px;">Régularité par groupe</div>
    <div class="section-meta">Rang à vie (XP cumulé) · alerte sur les 10 derniers jours.</div>`;

  if(neglectedList.length){
    html += `<div class="divider-note" style="border-left-color:var(--danger);">⚠ Délaissé(s) depuis plus de 10 jours (ou jamais travaillé) : <strong>${neglectedList.join(", ")}</strong></div>`;
  }

  html += `<div class="body-map-wrap">${BODY_SVG}</div>
    <div class="muscle-list" id="muscleList">
      ${MUSCLE_GROUPS.map(m=>{
        const st = stats[m];
        const rank = getRankForXP(st.totalXP);
        const lastText = st.lastDaysAgo===null ? "jamais" : (st.lastDaysAgo===0 ? "aujourd'hui" : `il y a ${st.lastDaysAgo} j`);
        return `<div class="muscle-row ${st.neglected?'neglected':''}">
          <div class="muscle-row-top">
            <span class="muscle-name">${MUSCLE_LABELS[m]}</span>
            <span class="rank-pill" style="background:${rank.color}">${rank.label}</span>
            <span class="muscle-last">${lastText}</span>
            ${st.neglected?'<span class="neglect-flag">⚠</span>':'<span class="neglect-flag-spacer"></span>'}
          </div>
          <div class="rank-bar"><div class="rank-bar-fill" style="width:${rank.progressPct}%; background:${rank.color};"></div></div>
          <div class="rank-xp-text">${rank.next ? `${st.totalXP} / ${rank.next.xp} XP vers ${rank.next.label}` : `${st.totalXP} XP · rang maximum`}</div>
        </div>`;
      }).join("")}
    </div>
    <div class="section-meta" style="margin-top:12px;">+15 XP par jour d'entraînement pour un groupe · 14 paliers de Bronze I à Légende.</div>
  </div>`;
  return html;
}

export function bindMuscleSection(){
  const stats = computeMuscleStats();
  MUSCLE_ON_DIAGRAM.forEach(m=>{
    const st = stats[m];
    const rank = getRankForXP(st.totalXP);
    document.querySelectorAll(`.zone-${m}`).forEach(el=>{
      el.setAttribute("fill", rank.color);
      el.classList.toggle("zone-neglected", st.neglected);
    });
  });
}

export function renderJournal(app){
  const dates = Object.keys(state.logs).sort((a,b)=> b.localeCompare(a));
  const weightKg = getWeightKg();
  let html = renderMuscleSection();

  html += `<div class="eyebrow">Historique des séances</div>`;

  if(dates.length===0){
    html += `<div class="empty"><div class="empty-ic">${FIST_SVG}</div>Aucune séance enregistrée pour l'instant.<br>Va dans « Aujourd'hui » pour commencer ton carnet.</div>`;
    app.innerHTML = html;
    bindMuscleSection();
    return;
  }

  // streak simple : nb de jours avec au moins un exercice fait
  const activeDays = dates.filter(d => Object.values(state.logs[d].exercises||{}).some(e=>e.done));
  let totalKcal = 0, anyEstimatedGlobal = false;
  dates.forEach(d=>{
    const log = state.logs[d];
    if(log.programKey || (log.extraPrograms||[]).length){
      const r = estimateSessionKcalDone(log, weightKg);
      totalKcal += r.kcal;
      if(r.reliability === "estimee") anyEstimatedGlobal = true;
    }
  });
  html += `<div class="card"><div class="section-title">Séances enregistrées</div>
    <div class="streak-row"><span class="streak-chip">${activeDays.length} séance(s) validée(s)</span><span class="streak-chip">${dates.length} jour(s) noté(s)</span><span class="streak-chip">≈ ${totalKcal} kcal cumulées${anyEstimatedGlobal?" *":""}</span></div>
    ${anyEstimatedGlobal?'<div class="section-meta" style="margin-top:8px;">* certaines séances sans répétitions notées — calories estimées sur une moyenne du programme.</div>':""}
  </div>`;

  dates.forEach(dateISO=>{
    const log = state.logs[dateISO];
    const prog = state.programs[log.programKey];
    const sessionEx = getSessionExercises(log);
    const doneCount = Object.values(log.exercises||{}).filter(e=>e.done).length;
    const totalCount = sessionEx.length;
    const kcalResult = (prog || (log.extraPrograms||[]).length) ? estimateSessionKcalDone(log, weightKg) : { kcal:0, reliability:"bonne" };
    const supTaken = Object.values(log.supplements||{}).filter(isSupTaken).length;
    const supLine = state.supplements.length ? `<span class="streak-chip" style="margin-top:6px;">💊 ${supTaken}/${state.supplements.length} compléments</span>` : "";
    const progLabel = prog ? escapeHtml(prog.name) : (totalCount>0 ? "Programme non défini" : "Jour de repos");
    html += `<div class="card ${doneCount>0?'done':''}">
      <div class="section-title">${fmtDateHuman(dateISO)}</div>
      <div class="section-meta">${progLabel}${totalCount>0?` — ${doneCount}/${totalCount} exercices validés${kcalResult.kcal?` · ≈ ${kcalResult.kcal} kcal${kcalResult.reliability==="estimee"?" (estim.)":""}`:""}`:""}</div>
      ${supLine}
      ${log.note?`<div class="exo-desc" style="margin-top:8px;">${escapeHtml(log.note)}</div>`:""}
      <button class="btn ghost small" style="margin-top:10px;" data-open="${dateISO}">Voir le détail</button>
    </div>`;
  });

  app.innerHTML = html;
  bindMuscleSection();

  document.querySelectorAll("[data-open]").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      openJournalDetail(btn.dataset.open);
    });
  });
}

export function openJournalDetail(dateISO){
  const app = document.getElementById("app");
  const log = state.logs[dateISO];
  const mainProg = state.programs[log.programKey];
  const weightKg = getWeightKg();
  let html = `<button class="btn ghost on-dark small" id="backBtn">← Retour au carnet</button>
  <div class="eyebrow" style="margin-top:14px;">${fmtDateHuman(dateISO)}</div>`;

  if(mainProg || (log.extraPrograms||[]).length){
    const kcalTotal = estimateSessionKcalDone(log, weightKg);
    html += `<div class="card"><div class="section-meta">${formatKcalText(kcalTotal)} sur cette séance</div></div>`;
  }

  if(log.locked){
    // ---- Lecture seule ----
    if(mainProg) html += renderReadOnlyMainProgram(mainProg, log, weightKg);
    (log.extraPrograms||[]).forEach(key=>{
      const p = state.programs[key];
      if(p) html += renderReadOnlyProgram(p.name, p.exercises, log, weightKg, p.met||5);
    });
    if(log.note){
      html += `<div class="card"><div class="section-title">Note</div><div class="exo-desc" style="margin-top:6px;">${escapeHtml(log.note)}</div></div>`;
    }
    if(state.supplements && state.supplements.length){
      html += `<div class="card"><div class="section-title" style="margin-bottom:6px;">Compléments</div>`;
      state.supplements.forEach(sup=>{
        const supVal = (log.supplements||{})[sup.id];
        const taken = isSupTaken(supVal);
        const time = (typeof supVal === "object" && supVal && supVal.time) ? ` à ${escapeHtml(supVal.time)}` : "";
        html += `<div class="exo"><div class="exo-desc">${taken?"✅":"⬜"} ${escapeHtml(sup.name)} — ${escapeHtml(computeSupplementDoseText(sup, getWeightKg()))}${taken?time:""}</div></div>`;
      });
      html += `</div>`;
    }
    html += `<button class="btn ghost on-dark block" id="editDayBtn" style="margin-top:6px;">✏️ Modifier cette séance</button>`;
    html += `<button class="btn danger on-dark block" id="deleteDayBtn" style="margin-top:10px;">Supprimer cette séance du carnet</button>`;
    app.innerHTML = html;
    document.getElementById("backBtn").addEventListener("click", ()=>render());
    document.getElementById("editDayBtn").addEventListener("click", ()=>{
      log.locked = false;
      saveState();
      openJournalDetail(dateISO);
    });
    armDangerButton(document.getElementById("deleteDayBtn"), "Confirmer la suppression ?", ()=>{
      delete state.logs[dateISO];
      saveState();
      render();
    });
  } else {
    // ---- Édition (poids/reps/RPE/coché, note, compléments) ----
    html += `<div class="divider-note">Mode modification — les changements sont sauvegardés au fur et à mesure. Tape "Terminer la modification" une fois fini.</div>`;
    if(mainProg) html += renderProgramCard(mainProg, dateISO, true, log, log.programKey);
    (log.extraPrograms||[]).forEach(key=>{
      const p = state.programs[key];
      if(p) html += renderProgramCard(p, dateISO, true, log, key);
    });
    html += `<div class="card">
      <div class="section-title">Note de séance</div>
      <textarea id="dayNoteEdit" placeholder="Ressenti général, fatigue, douleurs, motivation...">${escapeHtml(log.note||"")}</textarea>
    </div>`;
    if(state.supplements && state.supplements.length){
      html += renderSupplementsCard(dateISO, log);
    }
    html += `<button class="btn accent block" id="finishEditDayBtn" style="margin-top:6px;">✅ Terminer la modification</button>`;
    app.innerHTML = html;
    document.getElementById("dayNoteEdit").addEventListener("input", (e)=>{ log.note = e.target.value; });
    bindExerciseLogInputs(dateISO);
    bindSupplementsCard(dateISO);
    document.getElementById("finishEditDayBtn").addEventListener("click", ()=>{
      log.locked = true;
      saveState();
      openJournalDetail(dateISO);
    });
  }
}

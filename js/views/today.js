import { getExLog, getLog, getSessionExercises, getSupLog, getVisibleMainPrograms, getVisibleSubPrograms, nowHHMM, saveState, state } from "../state.js";
import { FIST_SVG } from "../assets.js";
import { escapeAttr, escapeHtml, todayDayName, todayISO } from "../utils.js";
import { estimateExerciseKcal, estimateSessionKcalDone, getWeightKg } from "../domain/energy.js";
import { checkRankUps } from "../domain/ranks.js";
import { render } from "../render.js";
import { COLS_CLOSE, COLS_OPEN, COLS_SPLIT } from "../layout.js";

// ============================================================
// VUE : AUJOURD'HUI
// ============================================================
export function renderToday(app){
  const dayName = todayDayName();
  const dateISO = todayISO();
  const planEntry = state.weeklyPlan.find(p => p.day === dayName);
  const log = getLog(dateISO);
  if(!log.programKey && planEntry) log.programKey = planEntry.program;

  let html = `<div class="eyebrow">${dayName} — séance du jour</div>`;

  if(!planEntry && !log.programKey){
    html += `<div class="empty"><div class="empty-ic">${FIST_SVG}</div>Rien de prévu pour ${dayName} dans ton planning.</div>`;
    html += renderSupplementsCard(dateISO, log);
    app.innerHTML = html;
    bindSupplementsCard(dateISO);
    return;
  }

  const weightKg = getWeightKg();
  const sessionEx = getSessionExercises(log);
  const total = sessionEx.length;
  const done = sessionEx.filter(({ex}) => (log.exercises[ex.id]||{}).done).length;
  const pct = total ? done/total : 0;
  const r = 22, circ = 2*Math.PI*r;
  const kcalDone = estimateSessionKcalDone(log, weightKg);

  html += COLS_OPEN;
  html += `<div class="card today">
    <div class="section-title">${planEntry ? planEntry.location+" · "+planEntry.duration : "Séance personnalisée"}</div>
    ${log.locked ? `
      <div class="section-meta" style="margin-top:8px;">🔒 Séance enregistrée — ${escapeHtml((state.programs[log.programKey]||{}).name||"")}</div>
      <button class="btn ghost small" id="unlockBtn" style="margin-top:10px;">Modifier la séance</button>
    ` : `
      <div class="field-row" style="margin-top:10px;">
        <label>Programme prévu / effectué</label>
        <select id="todayProgSelect">${programOptions(log.programKey)}</select>
      </div>
    `}
  </div>`;

  html += `<div class="card">
    <div class="progress-wrap">
      <svg class="progress-ring" width="56" height="56" viewBox="0 0 56 56">
        <circle cx="28" cy="28" r="${r}" fill="none" stroke="var(--line-soft)" stroke-width="5"/>
        <circle id="progressRingFill" cx="28" cy="28" r="${r}" fill="none" stroke="${pct>=1?'var(--success)':'var(--danger)'}" stroke-width="5"
          stroke-dasharray="${circ}" stroke-dashoffset="${circ*(1-pct)}" stroke-linecap="round"
          transform="rotate(-90 28 28)" style="transition:stroke-dashoffset .35s var(--ease), stroke .35s;"/>
      </svg>
      <div class="progress-text" id="progressText"><b id="progressCount">${done}/${total} exercices</b><span id="progressLabel">${pct>=1?"Séance complète — bravo.":"validés pour l'instant"}</span><span id="progressKcal" class="kcal-tag">${formatKcalText(kcalDone)}</span></div>
    </div>
  </div>`;

  const mainProg = state.programs[log.programKey];

  if(log.locked){
    // ---- Mode consultation (verrouillé) ----
    if(mainProg) html += renderReadOnlyMainProgram(mainProg, log, weightKg);
    (log.extraPrograms||[]).forEach(key=>{
      const p = state.programs[key];
      if(p) html += renderReadOnlyProgram(p.name, p.exercises, log, weightKg, p.met||5);
    });
  } else {
    // ---- Mode édition ----
    if(mainProg) html += renderProgramCard(mainProg, dateISO, true, log, log.programKey);

    (log.extraPrograms||[]).forEach(key=>{
      const p = state.programs[key];
      if(!p) return;
      html += renderProgramCard(p, dateISO, true, log, key);
      html += `<button class="btn ghost small remove-extra-btn" data-key="${key}" style="margin:-10px 0 16px;">Retirer « ${escapeHtml(p.name)} » de la séance</button>`;
    });

    const availableExtras = getVisibleSubPrograms().filter(k => !(log.extraPrograms||[]).includes(k));
    if(availableExtras.length){
      html += `<div class="card">
        <div class="section-title" style="margin-bottom:8px;">+ Ajouter un programme complémentaire</div>
        <div style="display:flex; gap:8px;">
          <select id="addExtraSelect" style="flex:1;">
            ${availableExtras.map(k=>`<option value="${k}">${escapeHtml(state.programs[k].name)}</option>`).join("")}
          </select>
          <button class="btn accent small" id="addExtraBtn">Ajouter</button>
        </div>
      </div>`;
    }
  }

  html += COLS_SPLIT;
  html += `<div class="card">
    <div class="section-title">Note de séance</div>
    ${log.locked
      ? `<div class="exo-desc" style="margin-top:6px;">${log.note ? escapeHtml(log.note) : "—"}</div>`
      : `<textarea id="dayNote" placeholder="Ressenti général, fatigue, douleurs, motivation...">${escapeHtml(log.note||"")}</textarea>`}
  </div>`;

  html += renderSupplementsCard(dateISO, log);

  if(!log.locked){
    html += `<button class="btn accent block" id="saveDayBtn">Enregistrer la séance</button>`;
  }
  html += COLS_CLOSE;

  app.innerHTML = html;

  if(log.locked){
    document.getElementById("unlockBtn").addEventListener("click", ()=>{
      log.locked = false;
      saveState();
      render();
    });
    bindSupplementsCard(dateISO);
    return;
  }

  document.getElementById("todayProgSelect").addEventListener("change", (e)=>{
    log.programKey = e.target.value;
    saveState();
    render();
  });
  document.getElementById("dayNote").addEventListener("input", (e)=>{
    log.note = e.target.value;
  });
  document.getElementById("saveDayBtn").addEventListener("click", ()=>{
    log.locked = true;
    saveState();
    render();
  });
  const addExtraBtn = document.getElementById("addExtraBtn");
  if(addExtraBtn){
    addExtraBtn.addEventListener("click", ()=>{
      const key = document.getElementById("addExtraSelect").value;
      if(!log.extraPrograms) log.extraPrograms = [];
      if(!log.extraPrograms.includes(key)) log.extraPrograms.push(key);
      saveState();
      render();
    });
  }
  document.querySelectorAll(".remove-extra-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      log.extraPrograms = (log.extraPrograms||[]).filter(k=>k!==btn.dataset.key);
      saveState();
      render();
    });
  });
  document.querySelectorAll(".sub-toggle-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const exId = btn.dataset.exid;
      if(!log.substitutions) log.substitutions = {};
      log.substitutions[exId] = !log.substitutions[exId];
      saveState();
      render();
    });
  });
  bindSupplementsCard(dateISO);
  bindExerciseLogInputs(dateISO);
}

// ---------- Compléments alimentaires ----------
// Calcule la dose affichée : soit le texte fixe (par défaut), soit une dose
// calculée à partir du poids de corps (facteur x kg), avec un plafond de
// sécurité optionnel pour éviter qu'un calcul automatique dépasse une dose
// maximale raisonnable (ex : magnésium supplémentaire, seuil ~350 mg/j).
export function computeSupplementDoseText(sup, weightKg){
  if(sup.doseMode === "perkg" && sup.doseFactor){
    let amount = parseFloat(sup.doseFactor) * weightKg;
    let capped = false;
    if(sup.doseMax && amount > parseFloat(sup.doseMax)){
      amount = parseFloat(sup.doseMax);
      capped = true;
    }
    const rounded = Math.round(amount*10)/10;
    const unit = sup.doseUnit || "g";
    return `${rounded} ${unit}/jour${capped?" (plafonné)":""} — calculé pour ${weightKg} kg`;
  }
  return sup.dose || "—";
}

export function renderSupplementsCard(dateISO, log){
  if(!state.supplements || !state.supplements.length) return "";
  const weightKg = getWeightKg();
  let html = `<div class="card">
    <div class="section-title" style="margin-bottom:2px;">Compléments du jour</div>
    <div class="section-meta">Coche ce que tu as pris aujourd'hui, précise l'heure si besoin.</div>`;
  state.supplements.forEach(sup=>{
    const supLog = getSupLog(dateISO, sup.id);
    html += `<div class="exo">
      <div class="exo-head">
        <div class="exo-name">${escapeHtml(sup.name)}</div>
        <button class="check-btn sup-check-btn ${supLog.taken?"on":""}" data-supid="${sup.id}">✓</button>
      </div>
      <div class="exo-desc">${escapeHtml(computeSupplementDoseText(sup, weightKg))} — ${escapeHtml(sup.timing)}</div>
      ${sup.note ? `<div class="exo-rest">${escapeHtml(sup.note)}</div>` : ""}
      <div class="sup-time-wrap">
        <div class="field"><label>Heure de prise</label><input type="time" class="sup-time-input" data-supid="${sup.id}" value="${escapeAttr(supLog.time||"")}"></div>
      </div>
    </div>`;
  });
  html += `</div>`;
  return html;
}
export function bindSupplementsCard(dateISO){
  document.querySelectorAll(".sup-check-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const supId = btn.dataset.supid;
      const supLog = getSupLog(dateISO, supId);
      supLog.taken = !supLog.taken;
      btn.classList.toggle("on", supLog.taken);
      if(supLog.taken){
        btn.classList.remove("pop");
        requestAnimationFrame(()=> btn.classList.add("pop"));
        if(!supLog.time){
          supLog.time = nowHHMM();
          const timeInput = document.querySelector(`.sup-time-input[data-supid="${supId}"]`);
          if(timeInput) timeInput.value = supLog.time;
        }
      }
      saveState();
    });
  });
  document.querySelectorAll(".sup-time-input").forEach(input=>{
    input.addEventListener("change", (e)=>{
      const supLog = getSupLog(dateISO, input.dataset.supid);
      supLog.time = e.target.value;
      saveState();
    });
  });
}

// Rendu en lecture seule d'une seule ligne d'exercice
export function renderReadOnlyExerciseRow(ex, log, weightKg, met){
  const exLog = log.exercises[ex.id] || {};
  let kcalStr = "";
  if(exLog.done){
    const r = estimateExerciseKcal(ex, met, weightKg, exLog.reps);
    kcalStr = ` · ≈ ${Math.round(r.kcal)} kcal${r.reliability==="estimee"?" (estim.)":""}`;
  }
  return `<div class="exo">
    <div class="exo-head"><div class="exo-name">${escapeHtml(ex.name)}</div><div class="exo-set">${escapeHtml(ex.sets)}</div></div>
    <div class="exo-desc">Poids : ${escapeHtml(exLog.poids||"—")} · Reps : ${escapeHtml(exLog.reps||"—")} · RPE : ${exLog.rpe||"—"}${exLog.done?" · ✓ validé":""}${kcalStr}</div>
  </div>`;
}

// Rendu en lecture seule d'un programme (utilisé une fois la séance verrouillée)
export function renderReadOnlyProgram(progName, exercises, log, weightKg, met){
  let html = `<div class="card"><div class="section-title">${escapeHtml(progName)}</div>`;
  let lastCategory = null;
  exercises.forEach(ex=>{
    if(ex.category && ex.category !== lastCategory){
      html += `<div class="exo-group-label">${escapeHtml(ex.category)}</div>`;
      lastCategory = ex.category;
    }
    html += renderReadOnlyExerciseRow(ex, log, weightKg, met);
  });
  html += `</div>`;
  return html;
}

// Rendu en lecture seule du programme principal, en respectant les substitutions faites ce jour-là
export function renderReadOnlyMainProgram(mainProg, log, weightKg){
  let html = `<div class="card"><div class="section-title">${escapeHtml(mainProg.name)}</div>`;
  let lastCategory = null;
  mainProg.exercises.forEach(ex=>{
    if(ex.category && ex.category !== lastCategory){
      html += `<div class="exo-group-label">${escapeHtml(ex.category)}</div>`;
      lastCategory = ex.category;
    }
    if(ex.sub && log.substitutions && log.substitutions[ex.id]){
      const subProg = state.programs[ex.sub];
      if(subProg){
        html += `<div class="divider-note">🔁 <strong>${escapeHtml(ex.name)}</strong> remplacé par <strong>${escapeHtml(subProg.name)}</strong></div>`;
        subProg.exercises.forEach(subEx=> html += renderReadOnlyExerciseRow(subEx, log, weightKg, subProg.met||5));
        return;
      }
    }
    html += renderReadOnlyExerciseRow(ex, log, weightKg, mainProg.met||5);
  });
  html += `</div>`;
  return html;
}

export function updateProgressRing(dateISO){
  const ring = document.getElementById("progressRingFill");
  const countEl = document.getElementById("progressCount");
  const labelEl = document.getElementById("progressLabel");
  const kcalEl = document.getElementById("progressKcal");
  if(!ring || !countEl || !labelEl) return; // vue changée entre-temps
  const log = getLog(dateISO);
  const sessionEx = getSessionExercises(log);
  const total = sessionEx.length;
  const done = sessionEx.filter(({ex}) => (log.exercises[ex.id]||{}).done).length;
  const pct = total ? done/total : 0;
  const r = 22, circ = 2*Math.PI*r;
  ring.setAttribute("stroke-dashoffset", circ*(1-pct));
  ring.setAttribute("stroke", pct>=1 ? "var(--success)" : "var(--danger)");
  countEl.textContent = `${done}/${total} exercices`;
  labelEl.textContent = pct>=1 ? "Séance complète — bravo." : "validés pour l'instant";
  if(kcalEl) kcalEl.textContent = formatKcalText(estimateSessionKcalDone(log, getWeightKg()));
}


export function programOptions(selected){
  return getVisibleMainPrograms().map(key=>{
    const p = state.programs[key];
    if(!p) return "";
    return `<option value="${key}" ${key===selected?"selected":""}>${p.name}</option>`;
  }).join("");
}

// Formate un résultat {kcal, reliability} en texte affichable, avec mention de fiabilité
export function formatKcalText(kcalObj){
  const suffix = kcalObj.reliability === "estimee" ? " (estimation)" : "";
  return `≈ ${kcalObj.kcal} kcal brûlées${suffix}`;
}

export function renderProgramCard(prog, dateISO, withLog, log, progKey){
  const met = prog.met || 5;
  const weightKg = getWeightKg();
  const canReorder = withLog && dateISO && log && !log.locked && dateISO === todayISO();
  let html = `<div class="card">
    <div class="section-title">${prog.name}</div>
    <div class="section-meta">${prog.subtitle||""}</div>`;
  if(prog.warmup){
    html += `<div class="divider-note"><strong>Échauffement :</strong> ${escapeHtml(prog.warmup)}</div>`;
  }
  let lastCategory = null;
  prog.exercises.forEach((ex,i)=>{
    if(ex.category && ex.category !== lastCategory){
      html += `<div class="exo-group-label">${escapeHtml(ex.category)}</div>`;
      lastCategory = ex.category;
    }
    if(ex.sub && withLog && log){
      const substituted = !!(log.substitutions && log.substitutions[ex.id]);
      const subProg = state.programs[ex.sub];
      if(substituted && subProg){
        html += `<div class="divider-note sub-active-note">
          <span>🔁 <strong>${escapeHtml(ex.name)}</strong> remplacé par <strong>${escapeHtml(subProg.name)}</strong></span>
          <button class="btn ghost small sub-toggle-btn" data-exid="${ex.id}">Annuler</button>
        </div>`;
        subProg.exercises.forEach((subEx,si)=> html += renderExercise(subEx, dateISO, withLog, subProg.met||5, weightKg, null, canReorder ? { progKey:ex.sub, index:si, total:subProg.exercises.length } : null));
      } else {
        html += renderExercise(ex, dateISO, withLog, met, weightKg, subProg ? { subKey:ex.sub, subLabel:subProg.name } : null, canReorder ? { progKey, index:i, total:prog.exercises.length } : null);
      }
    } else {
      html += renderExercise(ex, dateISO, withLog, met, weightKg, null, canReorder ? { progKey, index:i, total:prog.exercises.length } : null);
    }
  });
  if(prog.cooldown){
    html += `<div class="divider-note"><strong>Retour au calme :</strong> ${escapeHtml(prog.cooldown)}</div>`;
  }
  if(prog.finisher){
    html += `<div class="divider-note"><strong>Finisher :</strong> ${escapeHtml(prog.finisher)}</div>`;
  }
  if(prog.note){
    html += `<div class="divider-note">${escapeHtml(prog.note)}</div>`;
  }
  if(prog.safety){
    html += `<div class="divider-note"><strong>Sécurité :</strong><br>` + prog.safety.map(s=>"• "+escapeHtml(s)).join("<br>") + `</div>`;
  }
  html += `</div>`;
  return html;
}

export function renderExercise(ex, dateISO, withLog, met, weightKg, subInfo, reorderInfo){
  let logHtml = "";
  let checked = false;
  let loggedReps = null;
  if(withLog){
    const exLog = getExLog(dateISO, ex.id);
    checked = exLog.done;
    loggedReps = exLog.reps;
    logHtml = `
      <div class="exo-log" data-exid="${ex.id}">
        <div class="field"><label>Poids</label><input type="text" inputmode="decimal" class="logPoids" value="${escapeHtml(exLog.poids)}" placeholder="kg"></div>
        <div class="field"><label>Reps</label><input type="text" inputmode="numeric" class="logReps" value="${escapeHtml(exLog.reps)}" placeholder="reps"></div>
        <button class="check-btn ${checked?"on":""}" data-exid="${ex.id}">✓</button>
      </div>
      <div class="rpe-label">RPE (difficulté) <span class="rpe-value-badge" data-exid="${ex.id}">${exLog.rpe ? exLog.rpe : "—"}</span></div>
      <input type="range" class="rpe-slider ${exLog.rpe?"touched":""}" min="1" max="10" step="1" value="${exLog.rpe||5}" data-exid="${ex.id}">`;
  }
  const kcalResult = (met && weightKg) ? estimateExerciseKcal(ex, met, weightKg, loggedReps) : null;
  const restText = ex.rest && ex.rest!=="—" ? `Récup : ${escapeHtml(ex.rest)}` : "";
  const kcalText = kcalResult ? `≈ ${Math.round(kcalResult.kcal)} kcal${kcalResult.reliability==="estimee"?" (estim.)":""}` : "";
  const restLine = [restText, kcalText].filter(Boolean).join(" · ");
  const subToggleHtml = (subInfo && withLog && dateISO)
    ? `<button class="btn ghost small sub-toggle-btn" data-exid="${ex.id}" style="margin-top:10px;">🔁 Remplacer par : ${escapeHtml(subInfo.subLabel)}</button>`
    : "";
  const videoUrl = ex.video && ex.video.trim()
    ? ex.video.trim()
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(ex.name + " technique exercice sport de combat")}`;
  const videoLinkHtml = `<a href="${escapeAttr(videoUrl)}" target="_blank" rel="noopener" class="video-link">▶ Voir une démo vidéo</a>`;
  const reorderHtml = reorderInfo ? `
    <div class="reorder-controls">
      <button class="btn ghost small reorder-btn" data-progkey="${escapeAttr(reorderInfo.progKey)}" data-idx="${reorderInfo.index}" data-dir="-1" ${reorderInfo.index===0?"disabled":""} aria-label="Monter">▲</button>
      <button class="btn ghost small reorder-btn" data-progkey="${escapeAttr(reorderInfo.progKey)}" data-idx="${reorderInfo.index}" data-dir="1" ${reorderInfo.index===reorderInfo.total-1?"disabled":""} aria-label="Descendre">▼</button>
    </div>` : "";
  return `<div class="exo">
    <div class="exo-head">
      <div class="exo-name">${escapeHtml(ex.name)}</div>
      <div class="exo-set">${escapeHtml(ex.sets)}</div>
    </div>
    <div class="exo-desc">${escapeHtml(ex.desc)}</div>
    ${restLine ? `<div class="exo-rest">${restLine}</div>` : ""}
    ${videoLinkHtml}
    ${logHtml}
    ${subToggleHtml}
    ${reorderHtml}
  </div>`;
}

// Met à jour le texte "≈ X kcal" d'un exercice sans redessiner toute la page
export function refreshExerciseKcalDisplay(dateISO, exId, rowEl){
  const log = getLog(dateISO);
  const found = getSessionExercises(log).find(item => item.ex.id === exId);
  if(!found) return;
  const { ex, met } = found;
  const exLog = getExLog(dateISO, exId);
  const kcalResult = estimateExerciseKcal(ex, met, getWeightKg(), exLog.reps);
  const restText = ex.rest && ex.rest!=="—" ? `Récup : ${ex.rest}` : "";
  const kcalText = `≈ ${Math.round(kcalResult.kcal)} kcal${kcalResult.reliability==="estimee"?" (estim.)":""}`;
  const restLine = [restText, kcalText].filter(Boolean).join(" · ");
  const exoContainer = rowEl.closest(".exo");
  if(exoContainer){
    const restEl = exoContainer.querySelector(".exo-rest");
    if(restEl) restEl.textContent = restLine;
  }
}

export function bindExerciseLogInputs(dateISO){
  document.querySelectorAll(".exo-log[data-exid]").forEach(row=>{
    const exId = row.dataset.exid;
    const poidsInput = row.querySelector(".logPoids");
    const repsInput = row.querySelector(".logReps");
    const checkBtn = row.querySelector(".check-btn");
    if(!poidsInput || !repsInput || !checkBtn) return; // ligne incomplète, on ignore plutôt que de planter
    // Saisie au clavier : Entrée passe du poids aux reps, puis valide l'exercice et passe au suivant
    poidsInput.addEventListener("keydown", (e)=>{
      if(e.key === "Enter"){ e.preventDefault(); repsInput.focus(); }
    });
    repsInput.addEventListener("keydown", (e)=>{
      if(e.key !== "Enter") return;
      e.preventDefault();
      if(!getExLog(dateISO, exId).done) checkBtn.click();
      const rows = [...document.querySelectorAll(".exo-log[data-exid]")];
      const nextRow = rows[rows.indexOf(row) + 1];
      const nextInput = nextRow && nextRow.querySelector(".logPoids");
      if(nextInput) nextInput.focus();
    });
    poidsInput.addEventListener("input", (e)=>{
      getExLog(dateISO, exId).poids = e.target.value; saveState();
    });
    repsInput.addEventListener("input", (e)=>{
      getExLog(dateISO, exId).reps = e.target.value; saveState();
      refreshExerciseKcalDisplay(dateISO, exId, row);
      updateProgressRing(dateISO);
    });
    checkBtn.addEventListener("click", (e)=>{
      const exLog = getExLog(dateISO, exId);
      exLog.done = !exLog.done;
      e.target.classList.toggle("on", exLog.done);
      if(exLog.done){
        e.target.classList.remove("pop");
        requestAnimationFrame(()=> e.target.classList.add("pop"));
      }
      saveState();
      updateProgressRing(dateISO);
      if(exLog.done) checkRankUps();
    });
  });
  document.querySelectorAll(".rpe-slider").forEach(slider=>{
    slider.addEventListener("input", (e)=>{
      const exId = slider.dataset.exid;
      const val = Number(e.target.value);
      const exLog = getExLog(dateISO, exId);
      exLog.rpe = val;
      saveState();
      slider.classList.add("touched");
      const badge = document.querySelector(`.rpe-value-badge[data-exid="${exId}"]`);
      if(badge) badge.textContent = val;
    });
  });
  document.querySelectorAll(".reorder-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const progKey = btn.dataset.progkey;
      const idx = Number(btn.dataset.idx);
      const dir = Number(btn.dataset.dir);
      moveProgramExercise(progKey, idx, dir);
      render();
    });
  });
}

// Déplace un exercice d'une position dans la liste d'un programme (persistant, comme une modification de programme)
export function moveProgramExercise(progKey, index, dir){
  const prog = state.programs[progKey];
  if(!prog || !prog.exercises) return;
  const newIndex = index + dir;
  if(newIndex < 0 || newIndex >= prog.exercises.length) return;
  const tmp = prog.exercises[index];
  prog.exercises[index] = prog.exercises[newIndex];
  prog.exercises[newIndex] = tmp;
  saveState();
}

// ============================================================

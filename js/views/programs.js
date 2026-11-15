import { getVisibleMainPrograms, getVisibleSubPrograms, saveState, state, ui } from "../state.js";
import { escapeAttr, escapeHtml } from "../utils.js";
import { getWeightKg } from "../domain/energy.js";
import { render } from "../render.js";
import { renderExercise } from "./today.js";

// VUE : PROGRAMMES (liste + édition complète)
// ============================================================
export let selectedProgramKey = "A";

export function renderPrograms(app){
  let html = `<div class="eyebrow">Programmes</div>
  <div style="margin-bottom:4px;">`;
  getVisibleMainPrograms().forEach(key=>{
    const label = state.programs[key].pillLabel || key;
    html += `<span class="prog-pill ${key===selectedProgramKey?"active":""}" data-key="${key}">${escapeHtml(label)}</span>`;
  });
  html += `</div>

  <div class="settings-group-label">Sous-programmes complémentaires</div>
  <div class="section-meta" style="margin-bottom:10px;">Ajoutables à une séance via "+ Ajouter un programme complémentaire" sur Aujourd'hui.</div>
  <div style="margin-bottom:12px;">`;
  getVisibleSubPrograms().forEach(key=>{
    const label = state.programs[key].pillLabel || state.programs[key].name.split(" — ")[0].replace("Programme ","");
    html += `<span class="prog-pill sub-prog-pill ${key===selectedProgramKey?"active":""}" data-key="${key}">${escapeHtml(label)}</span>`;
  });
  html += `</div>`;

  if(!getVisibleMainPrograms().includes(selectedProgramKey) && !getVisibleSubPrograms().includes(selectedProgramKey)){
    selectedProgramKey = getVisibleMainPrograms()[0] || getVisibleSubPrograms()[0] || null;
  }
  const prog = state.programs[selectedProgramKey];
  if(prog){
    html += `<div class="card">
      <button class="edit-toggle" id="editToggleBtn">${ui.editMode?"Terminer":"Modifier"}</button>
      <div class="section-title">${escapeHtml(prog.name)}</div>
      <div class="section-meta">${escapeHtml(prog.subtitle||"")} · ${escapeHtml(prog.location||"")} · ${escapeHtml(prog.duration||"")}</div>`;

    if(ui.editMode){
      html += renderProgramEditForm(prog);
    } else {
      if(prog.warmup) html += `<div class="divider-note"><strong>Échauffement :</strong> ${escapeHtml(prog.warmup)}</div>`;
      let lastCategoryBrowse = null;
      prog.exercises.forEach(ex=>{
        if(ex.category && ex.category !== lastCategoryBrowse){
          html += `<div class="exo-group-label">${escapeHtml(ex.category)}</div>`;
          lastCategoryBrowse = ex.category;
        }
        html += renderExercise(ex, null, false, prog.met||5, getWeightKg());
      });
      if(prog.cooldown) html += `<div class="divider-note"><strong>Retour au calme :</strong> ${escapeHtml(prog.cooldown)}</div>`;
      if(prog.finisher) html += `<div class="divider-note"><strong>Finisher :</strong> ${escapeHtml(prog.finisher)}</div>`;
      if(prog.note) html += `<div class="divider-note">${escapeHtml(prog.note)}</div>`;
      if(prog.safety) html += `<div class="divider-note"><strong>Sécurité :</strong><br>` + prog.safety.map(s=>"• "+escapeHtml(s)).join("<br>") + `</div>`;
    }
    html += `</div>`;
  }

  // Équipement + sécurité générale
  html += `<div class="card"><div class="section-title" style="margin-bottom:8px;">Matériel recommandé</div>`;
  state.equipment.forEach((eq,i)=>{
    html += `<div class="exo"><div class="exo-name">${escapeHtml(eq.name)}</div><div class="exo-desc">${escapeHtml(eq.why)}</div></div>`;
  });
  html += `</div>`;

  html += `<div class="card"><div class="section-title" style="margin-bottom:8px;">Sécurité générale</div>`;
  state.safety.forEach(s=> html += `<div class="exo"><div class="exo-desc">${escapeHtml(s)}</div></div>`);
  html += `</div>`;

  app.innerHTML = html;

  document.querySelectorAll(".prog-pill").forEach(pill=>{
    pill.addEventListener("click", ()=>{
      selectedProgramKey = pill.dataset.key;
      ui.editMode = false;
      render();
    });
  });
  const editBtn = document.getElementById("editToggleBtn");
  if(editBtn) editBtn.addEventListener("click", ()=>{
    if(ui.editMode) saveProgramEditForm(prog); // "Terminer" doit sauvegarder, pas juste fermer
    ui.editMode = !ui.editMode;
    render();
  });
  if(ui.editMode) bindProgramEditForm(prog);
}

// Ajuste le nombre de rounds d'un programme "à rounds" : ajoute des rounds génériques
// si on en veut plus, retire les derniers si on en veut moins (garde toujours au moins 1).
export function applyRoundsCount(prog, newCount){
  newCount = Math.max(1, newCount);
  const current = prog.exercises.length;
  if(newCount > current){
    for(let i=current+1; i<=newCount; i++){
      prog.exercises.push({
        id: "round_extra_"+Date.now()+"_"+i,
        name: `Round ${i} — libre`,
        desc: "Choisis un enchaînement (sac, cardio, technique) à intensité soutenue.",
        sets: "2 min effort",
        rest: "30 s"
      });
    }
  } else if(newCount < current){
    prog.exercises.splice(newCount);
  }
}

export function renderProgramEditForm(prog){
  let html = `<div class="field-row"><label>Nom affiché dans la bulle du menu</label><input type="text" id="ed_pillLabel" value="${escapeAttr(prog.pillLabel||"")}" placeholder="ex : Cardio, Haut du corps..."></div>
  <div class="field-row"><label>Nom du programme</label><input type="text" id="ed_name" value="${escapeAttr(prog.name)}"></div>
  <div class="field-row"><label>Sous-titre</label><input type="text" id="ed_subtitle" value="${escapeAttr(prog.subtitle||"")}"></div>
  <div class="field-row"><label>Lieu</label><input type="text" id="ed_location" value="${escapeAttr(prog.location||"")}"></div>
  <div class="field-row"><label>Durée</label><input type="text" id="ed_duration" value="${escapeAttr(prog.duration||"")}"></div>
  <div class="field-row"><label>Échauffement</label><textarea id="ed_warmup">${escapeHtml(prog.warmup||"")}</textarea></div>
  <div class="field-row"><label>Note</label><textarea id="ed_note">${escapeHtml(prog.note||"")}</textarea></div>`;
  if(prog.roundsConfigurable){
    html += `<div class="divider-note">
      <div class="field-row" style="margin-bottom:8px;"><label>Nombre de rounds</label>
        <div style="display:flex; gap:8px;">
          <input type="number" id="ed_roundsCount" value="${prog.exercises.length}" min="1" style="flex:1;">
          <button class="btn accent small" id="applyRoundsBtn">Appliquer</button>
        </div>
      </div>
      Ajoute ou retire des rounds génériques d'un coup — modifie ensuite leur nom/contenu individuellement ci-dessous si besoin.
    </div>`;
  }
  html += `<hr style="border:none;border-top:1px solid var(--line); margin:14px 0;">
  <div class="section-title" style="margin-bottom:8px;">Exercices</div>
  <div id="editExoList">`;
  prog.exercises.forEach((ex,i)=>{
    html += `<div class="exo" data-exidx="${i}">
      <div class="reorder-controls" style="margin-bottom:10px;">
        <button class="btn ghost small edit-reorder-btn" data-idx="${i}" data-dir="-1" ${i===0?"disabled":""} aria-label="Monter">▲</button>
        <button class="btn ghost small edit-reorder-btn" data-idx="${i}" data-dir="1" ${i===prog.exercises.length-1?"disabled":""} aria-label="Descendre">▼</button>
      </div>
      <div class="field-row"><label>Nom</label><input type="text" class="edEx_name" value="${escapeAttr(ex.name)}"></div>
      <div class="field-row"><label>Description / exécution</label><textarea class="edEx_desc">${escapeHtml(ex.desc||"")}</textarea></div>
      <div style="display:flex; gap:8px;">
        <div class="field-row" style="flex:1;"><label>Séries x reps</label><input type="text" class="edEx_sets" value="${escapeAttr(ex.sets||"")}"></div>
        <div class="field-row" style="flex:1;"><label>Récup</label><input type="text" class="edEx_rest" value="${escapeAttr(ex.rest||"")}"></div>
      </div>
      <div class="field-row"><label>Lien vidéo de démo (optionnel)</label><input type="text" class="edEx_video" placeholder="https://..." value="${escapeAttr(ex.video||"")}"></div>
      <button class="btn danger small" data-remove="${i}">Supprimer cet exercice</button>
    </div>`;
  });
  html += `</div>
  <button class="btn ghost block" id="addExoBtn" style="margin-top:8px;">+ Ajouter un exercice</button>
  <button class="btn accent block" id="saveProgBtn" style="margin-top:12px;">Enregistrer les modifications</button>
  <div class="settings-subtitle" style="color:var(--danger-dark);">Zone à risque</div>
  <button class="btn danger block" id="deleteProgBtn">Supprimer ce programme</button>`;
  return html;
}

// Confirmation en deux temps intégrée à l'appli (remplace window.confirm, peu fiable
// dans les PWA installées sur l'écran d'accueil sur iOS). Premier tap = armement,
// second tap dans les 3s = confirmation réelle.
export function armDangerButton(btn, confirmLabel, onConfirm){
  let armed = false;
  let timer = null;
  const originalText = btn.textContent;
  btn.addEventListener("click", ()=>{
    if(!armed){
      armed = true;
      btn.textContent = confirmLabel;
      btn.classList.add("armed");
      timer = setTimeout(()=>{
        armed = false;
        btn.textContent = originalText;
        btn.classList.remove("armed");
      }, 3000);
    } else {
      clearTimeout(timer);
      armed = false;
      onConfirm();
    }
  });
}

export function bindProgramEditForm(prog){
  document.getElementById("addExoBtn").addEventListener("click", ()=>{
    prog.exercises.push({ id: "custom_"+Date.now(), name:"Nouvel exercice", desc:"", sets:"", rest:"" });
    saveState();
    render();
  });
  const applyRoundsBtn = document.getElementById("applyRoundsBtn");
  if(applyRoundsBtn){
    applyRoundsBtn.addEventListener("click", ()=>{
      const newCount = Number(document.getElementById("ed_roundsCount").value) || 1;
      applyRoundsCount(prog, newCount);
      saveState();
      render();
    });
  }
  document.querySelectorAll(".edit-reorder-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const idx = Number(btn.dataset.idx);
      const dir = Number(btn.dataset.dir);
      const newIdx = idx + dir;
      if(newIdx < 0 || newIdx >= prog.exercises.length) return;
      const tmp = prog.exercises[idx];
      prog.exercises[idx] = prog.exercises[newIdx];
      prog.exercises[newIdx] = tmp;
      saveState();
      render();
    });
  });
  document.querySelectorAll("[data-remove]").forEach(btn=>{
    armDangerButton(btn, "Confirmer ?", ()=>{
      const idx = Number(btn.dataset.remove);
      prog.exercises.splice(idx,1);
      saveState();
      render();
    });
  });
  document.getElementById("saveProgBtn").addEventListener("click", ()=>{
    saveProgramEditForm(prog);
    ui.editMode = false;
    render();
  });
  armDangerButton(document.getElementById("deleteProgBtn"), "Confirmer la suppression ?", ()=>{
    if(!state.deletedPrograms) state.deletedPrograms = [];
    state.deletedPrograms.push(selectedProgramKey);
    ui.editMode = false;
    selectedProgramKey = getVisibleMainPrograms()[0] || getVisibleSubPrograms()[0] || null;
    saveState();
    render();
  });
}

// Lit les valeurs du formulaire d'édition et les applique au programme (utilisée par
// le bouton "Enregistrer les modifications" ET par "Terminer", pour ne jamais perdre de saisie).
export function saveProgramEditForm(prog){
  prog.pillLabel = document.getElementById("ed_pillLabel").value.trim();
  prog.name = document.getElementById("ed_name").value;
  prog.subtitle = document.getElementById("ed_subtitle").value;
  prog.location = document.getElementById("ed_location").value;
  prog.duration = document.getElementById("ed_duration").value;
  prog.warmup = document.getElementById("ed_warmup").value;
  prog.note = document.getElementById("ed_note").value;
  document.querySelectorAll("#editExoList .exo").forEach((row)=>{
    const idx = Number(row.dataset.exidx);
    prog.exercises[idx].name = row.querySelector(".edEx_name").value;
    prog.exercises[idx].desc = row.querySelector(".edEx_desc").value;
    prog.exercises[idx].sets = row.querySelector(".edEx_sets").value;
    prog.exercises[idx].rest = row.querySelector(".edEx_rest").value;
    prog.exercises[idx].video = row.querySelector(".edEx_video").value;
  });
  saveState();
}

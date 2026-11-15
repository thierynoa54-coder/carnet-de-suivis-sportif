import { saveState, state } from "../state.js";
import { escapeHtml } from "../utils.js";
import { programOptions } from "./today.js";

// VUE : SEMAINE
// ============================================================
export function renderWeek(app){
  let html = `<div class="eyebrow">Planning hebdomadaire</div>
  <div class="card"><div class="section-title" style="margin-bottom:6px;">Modifie l'affectation de chaque jour</div>`;
  state.weeklyPlan.forEach((entry, idx)=>{
    html += `<div class="week-day">
      <div class="dname">${entry.day}</div>
      <select data-idx="${idx}" class="weekProgSelect">
        <option value="__REST__" ${!entry.program?"selected":""}>Repos</option>
        ${programOptions(entry.program)}
      </select>
      <div class="dur">${entry.duration||""}</div>
    </div>`;
  });
  html += `</div>`;

  html += `<div class="card"><div class="section-title" style="margin-bottom:8px;">Méthode & progression</div>`;
  state.methode.forEach(m=> html += `<div class="exo"><div class="exo-desc">${escapeHtml(m)}</div></div>`);
  html += `</div>`;

  app.innerHTML = html;

  document.querySelectorAll(".weekProgSelect").forEach(sel=>{
    sel.addEventListener("change", (e)=>{
      const idx = Number(e.target.dataset.idx);
      const val = e.target.value;
      state.weeklyPlan[idx].program = (val === "__REST__") ? null : val;
      saveState();
    });
  });
}

// ============================================================

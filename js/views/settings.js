import { SEED_DATA } from "../seed.js";
import { getStoredApiKey, migrateProgramsData, saveState, setState, setStoredApiKey, state, ui } from "../state.js";
import { escapeAttr, escapeHtml, showToast, todayISO } from "../utils.js";
import { render } from "../render.js";
import { armDangerButton } from "./programs.js";

// ============================================================
// VUE : RÉGLAGES
// ============================================================
export function renderSettings(app){
  // Trois blocs : profil (a), compléments (b), reste (c). Sur PC, (b) occupe la colonne de droite.
  let html = `<div class="eyebrow">Réglages & profil</div><div class="cols cols-settings"><div class="col col-a">`;

  // ==================== GROUPE : PROFIL ====================
  html += `<div class="settings-group-label">Profil</div>
  <div class="card">
    <div class="section-title" style="margin-bottom:8px;">Ton profil</div>
    <div class="field-row"><label>Âge (description libre)</label><input type="text" id="pf_age" value="${escapeAttr(state.profile.age)}"></div>
    <div class="field-row"><label>Taille / Poids (description libre)</label><input type="text" id="pf_taille" value="${escapeAttr(state.profile.taille_poids)}"></div>
    <div class="field-row"><label>Poids (kg) — utilisé pour calculer les calories</label><input type="number" step="0.5" id="pf_poids_kg" value="${escapeAttr(state.profile.poids_kg)}"></div>
    <div class="field-row"><label>Niveau (description libre)</label><input type="text" id="pf_niveau" value="${escapeAttr(state.profile.niveau)}"></div>
    <div class="field-row"><label>Blessures</label><input type="text" id="pf_blessures" value="${escapeAttr(state.profile.blessures)}"></div>
    <div class="field-row"><label>Accès salle</label><input type="text" id="pf_acces" value="${escapeAttr(state.profile.acces_salle)}"></div>
    <button class="btn accent block" id="savePfBtn">Enregistrer le profil</button>
  </div>`;

  // ==================== GROUPE : COMPLÉMENTS ====================
  html += `</div><div class="col col-b"><div class="settings-group-label">Compléments alimentaires</div>
  <div class="card">
    <div class="section-meta">Utilisés pour le suivi quotidien dans "Aujourd'hui".</div>
    <div id="supplementsEditList" style="margin-top:10px;">
      ${state.supplements.map((sup,i)=>`
        <div class="exo" data-supidx="${i}">
          <div class="field-row"><label>Nom</label><input type="text" class="edSup_name" value="${escapeAttr(sup.name)}"></div>
          <div class="field-row">
            <label><input type="checkbox" class="edSup_mode" ${sup.doseMode==="perkg"?"checked":""} style="width:auto; margin-right:6px;">Calculer automatiquement selon mon poids</label>
          </div>
          <div class="field-row"><label>Dose fixe (utilisée si la case ci-dessus est décochée)</label><input type="text" class="edSup_dose" value="${escapeAttr(sup.dose)}"></div>
          <div style="display:flex; gap:8px;">
            <div class="field-row" style="flex:1;"><label>Facteur (par kg)</label><input type="number" step="0.001" class="edSup_factor" value="${escapeAttr(sup.doseFactor||"")}" placeholder="ex : 0.03"></div>
            <div class="field-row" style="flex:1;"><label>Unité</label>
              <select class="edSup_unit">
                <option value="g" ${sup.doseUnit==="g"||!sup.doseUnit?"selected":""}>g</option>
                <option value="mg" ${sup.doseUnit==="mg"?"selected":""}>mg</option>
              </select>
            </div>
            <div class="field-row" style="flex:1;"><label>Plafond max</label><input type="number" step="0.1" class="edSup_max" value="${escapeAttr(sup.doseMax||"")}" placeholder="optionnel"></div>
          </div>
          <div class="field-row"><label>Moment de prise</label><input type="text" class="edSup_timing" value="${escapeAttr(sup.timing)}"></div>
          <div class="field-row"><label>Note</label><input type="text" class="edSup_note" value="${escapeAttr(sup.note||"")}"></div>
          <button class="btn danger small" data-removesup="${i}">Supprimer</button>
        </div>
      `).join("")}
    </div>
    <div class="exo-desc" style="margin-top:6px;">⚠ Le calcul automatique est indicatif. Vérifie toujours la dose maximale indiquée sur l'emballage du produit, et demande conseil à un pharmacien en cas de doute.</div>
    <button class="btn ghost block" id="addSupplementBtn" style="margin-top:10px;">+ Ajouter un complément</button>
    <button class="btn accent block" id="saveSupplementsBtn" style="margin-top:10px;">Enregistrer les compléments</button>
  </div>`;

  // ==================== GROUPE : INTELLIGENCE ARTIFICIELLE ====================
  html += `</div><div class="col col-c"><div class="settings-group-label">Intelligence artificielle (optionnel)</div>
  <div class="card">
    <div class="section-title" style="margin-bottom:2px;">Analyse détaillée (Claude)</div>
    <div class="section-meta">Analyse fine de tes séances/notes dans l'onglet Analyse — payant à l'usage.</div>
    <div class="field-row" style="margin-top:10px;"><label>Clé API Anthropic</label><input type="password" id="apiKeyInput" placeholder="sk-ant-..." value="${escapeAttr(getStoredApiKey())}"></div>
    <button class="btn accent block" id="saveApiKeyBtn">Enregistrer la clé</button>
    <div class="exo-desc" style="margin-top:10px;">⚠ Stockée uniquement sur cet appareil (jamais dans un export/partage). Chaque analyse consomme ta clé (facturation à l'usage sur ton compte Anthropic).</div>
    <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener" class="video-link" style="margin-top:10px;">Obtenir une clé API →</a>
  </div>`;

  // ==================== GROUPE : APPLICATION ====================
  html += `<div class="settings-group-label">Application</div>
  <div class="card">
    <div class="section-title" style="margin-bottom:8px;">Installer l'application</div>
    <div class="exo-desc">
      <strong>PC (Chrome, Edge) :</strong> icône d'installation dans la barre d'adresse, ou menu ⋮ → « Installer Carnet ».<br><br>
      <strong>iPhone (Safari) :</strong> bouton Partager → « Sur l'écran d'accueil ».<br><br>
      <strong>Android (Chrome) :</strong> menu ⋮ → « Ajouter à l'écran d'accueil » ou « Installer l'application ».
    </div>
  </div>`;

  // ==================== GROUPE : PROGRAMMES SUPPRIMÉS ====================
  if((state.deletedPrograms||[]).length){
    html += `<div class="settings-group-label">Programmes supprimés</div>
    <div class="card">
      <div class="section-meta" style="margin-bottom:10px;">Masqués des menus, mais leurs données sont conservées — tu peux les restaurer.</div>
      ${state.deletedPrograms.map(key=>{
        const p = state.programs[key];
        const label = p ? (p.pillLabel || p.name) : key;
        return `<div class="exo"><div class="exo-head"><div class="exo-name">${escapeHtml(label)}</div>
          <button class="btn ghost small restore-prog-btn" data-key="${key}">Restaurer</button></div></div>`;
      }).join("")}
    </div>`;
  }

  // ==================== GROUPE : DONNÉES ====================
  html += `<div class="settings-group-label">Données</div>
  <div class="card">
    <div class="exo-desc">Toutes tes données (programme modifié, carnet, notes) sont stockées uniquement sur ce téléphone, dans ce navigateur — rien n'est envoyé sur internet. Pour les retrouver sur un autre appareil, exporte-les ici puis importe le fichier sur l'autre appareil.</div>
    <button class="btn ghost block" id="exportBtn" style="margin-top:10px;">Exporter mes données (.json)</button>
    <button class="btn ghost block" id="importBtn" style="margin-top:10px;">Importer des données (.json)</button>
    <input type="file" accept=".json,application/json" id="importFileInput" style="display:none">
    <div id="importStatus" class="exo-desc" style="margin-top:8px;"></div>

    <div class="settings-subtitle" style="color:var(--danger-dark);">Zone à risque</div>
    <button class="btn danger block" id="resetBtn">Réinitialiser le programme d'origine</button>
    <button class="btn danger block" id="wipeBtn" style="margin-top:10px;">Effacer tout le carnet</button>
  </div>`;
  html += `</div></div>`;

  app.innerHTML = html;

  document.getElementById("addSupplementBtn").addEventListener("click", ()=>{
    state.supplements.push({ id:"sup_custom_"+Date.now(), name:"Nouveau complément", dose:"", timing:"", note:"" });
    saveState();
    render();
  });
  document.querySelectorAll("[data-removesup]").forEach(btn=>{
    armDangerButton(btn, "Confirmer ?", ()=>{
      const idx = Number(btn.dataset.removesup);
      state.supplements.splice(idx,1);
      saveState();
      render();
    });
  });
  document.getElementById("saveSupplementsBtn").addEventListener("click", ()=>{
    document.querySelectorAll("#supplementsEditList .exo").forEach(row=>{
      const idx = Number(row.dataset.supidx);
      state.supplements[idx].name = row.querySelector(".edSup_name").value;
      state.supplements[idx].dose = row.querySelector(".edSup_dose").value;
      state.supplements[idx].doseMode = row.querySelector(".edSup_mode").checked ? "perkg" : "fixed";
      state.supplements[idx].doseFactor = parseFloat(row.querySelector(".edSup_factor").value) || null;
      state.supplements[idx].doseUnit = row.querySelector(".edSup_unit").value;
      state.supplements[idx].doseMax = parseFloat(row.querySelector(".edSup_max").value) || null;
      state.supplements[idx].timing = row.querySelector(".edSup_timing").value;
      state.supplements[idx].note = row.querySelector(".edSup_note").value;
    });
    saveState();
    showToast("Compléments enregistrés.");
  });

  document.getElementById("savePfBtn").addEventListener("click", ()=>{
    state.profile.age = document.getElementById("pf_age").value;
    state.profile.taille_poids = document.getElementById("pf_taille").value;
    state.profile.poids_kg = parseFloat(document.getElementById("pf_poids_kg").value) || state.profile.poids_kg;
    state.profile.niveau = document.getElementById("pf_niveau").value;
    state.profile.blessures = document.getElementById("pf_blessures").value;
    state.profile.acces_salle = document.getElementById("pf_acces").value;
    saveState();
    document.getElementById("savePfBtn").textContent = "✔ Enregistré";
    setTimeout(()=>{ const b=document.getElementById("savePfBtn"); if(b) b.textContent="Enregistrer le profil"; }, 1400);
  });

  document.querySelectorAll(".restore-prog-btn").forEach(btn=>{
    btn.addEventListener("click", ()=>{
      state.deletedPrograms = (state.deletedPrograms||[]).filter(k=>k!==btn.dataset.key);
      saveState();
      render();
    });
  });

  document.getElementById("exportBtn").addEventListener("click", async ()=>{
    const filename = "carnet-combat-"+todayISO()+".json";
    const json = JSON.stringify(state, null, 2);

    // 1) Web Share API : la méthode la plus fiable sur iOS (ouvre le vrai menu de partage/"Enregistrer dans Fichiers")
    try{
      if(navigator.canShare && navigator.share){
        const file = new File([json], filename, { type: "application/json" });
        if(navigator.canShare({ files:[file] })){
          await navigator.share({ files:[file], title: filename });
          return;
        }
      }
    }catch(err){
      if(err && err.name === "AbortError") return; // l'utilisateur a juste annulé le partage
      console.error(err);
    }

    // 2) Repli : data URI (plus fiable que blob: sur Safari, qui ignore souvent le téléchargement de blobs)
    try{
      const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(json);
      const a = document.createElement("a");
      a.href = dataUri; a.download = filename;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
      showToast("Export lancé — vérifie tes Téléchargements ou le menu de partage.");
    }catch(err){
      // 3) Dernier repli : affichage du texte brut, copiable à la main
      console.error(err);
      const statusEl = document.getElementById("importStatus");
      if(statusEl){
        statusEl.innerHTML = `<div class="section-meta" style="margin-bottom:6px;">Téléchargement automatique impossible — sélectionne et copie ce texte à la main :</div>
          <textarea readonly style="min-height:160px; font-family:var(--mono); font-size:10px;">${escapeHtml(json)}</textarea>`;
        statusEl.querySelector("textarea").select();
      }
    }
  });

  document.getElementById("saveApiKeyBtn").addEventListener("click", ()=>{
    const key = document.getElementById("apiKeyInput").value.trim();
    setStoredApiKey(key);
    showToast(key ? "Clé enregistrée sur cet appareil." : "Clé supprimée.");
  });

  document.getElementById("importBtn").addEventListener("click", ()=>{
    document.getElementById("importFileInput").click();
  });
  document.getElementById("importFileInput").addEventListener("change", (e)=>{
    const file = e.target.files[0];
    if(!file) return;
    const statusEl = document.getElementById("importStatus");
    const reader = new FileReader();
    reader.onload = ()=>{
      let parsed;
      try{
        parsed = JSON.parse(reader.result);
      }catch(err){
        statusEl.innerHTML = `<span style="color:var(--danger-dark);">Fichier illisible : ce n'est pas un export valide de cette appli.</span>`;
        return;
      }
      if(!parsed || typeof parsed !== "object" || !parsed.programs || !parsed.profile){
        statusEl.innerHTML = `<span style="color:var(--danger-dark);">Ce fichier ne ressemble pas à un export du Carnet Combat.</span>`;
        return;
      }
      const nbSeances = parsed.logs ? Object.keys(parsed.logs).length : 0;
      statusEl.innerHTML = `Fichier valide — <strong>${nbSeances} séance(s)</strong> trouvée(s), profil : ${escapeHtml(parsed.profile.age||"")}.<br>⚠ Ceci remplacera toutes les données actuelles de cet appareil.`;
      const confirmBtn = document.createElement("button");
      confirmBtn.className = "btn danger block";
      confirmBtn.style.marginTop = "10px";
      confirmBtn.textContent = "Importer et remplacer mes données";
      statusEl.appendChild(confirmBtn);
      armDangerButton(confirmBtn, "Confirmer le remplacement ?", ()=>{
        if(!parsed.logs) parsed.logs = {};
        if(!parsed.equipment) parsed.equipment = JSON.parse(JSON.stringify(SEED_DATA.equipment));
        if(!parsed.safety) parsed.safety = JSON.parse(JSON.stringify(SEED_DATA.safety));
        if(!parsed.methode) parsed.methode = JSON.parse(JSON.stringify(SEED_DATA.methode));
        if(!parsed.weeklyPlan) parsed.weeklyPlan = JSON.parse(JSON.stringify(SEED_DATA.weeklyPlan));
        if(!parsed.weightLog) parsed.weightLog = {};
        if(!parsed.supplements) parsed.supplements = JSON.parse(JSON.stringify(SEED_DATA.supplements));
        migrateProgramsData(parsed);
        setState(parsed);
        saveState();
        statusEl.innerHTML = `<span style="color:var(--success);">✔ Import réussi.</span>`;
        setTimeout(()=>{ ui.currentView = "today"; render(); }, 600);
      });
    };
    reader.onerror = ()=>{
      statusEl.innerHTML = `<span style="color:var(--danger-dark);">Impossible de lire ce fichier.</span>`;
    };
    reader.readAsText(file);
  });

  armDangerButton(document.getElementById("resetBtn"), "Confirmer le reset ?", ()=>{
    state.programs = JSON.parse(JSON.stringify(SEED_DATA.programs));
    state.weeklyPlan = JSON.parse(JSON.stringify(SEED_DATA.weeklyPlan));
    saveState();
    render();
  });

  armDangerButton(document.getElementById("wipeBtn"), "Confirmer l'effacement ?", ()=>{
    state.logs = {};
    saveState();
    render();
  });
}

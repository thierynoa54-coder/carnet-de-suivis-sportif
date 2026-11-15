import { MUSCLE_GROUPS, MUSCLE_LABELS } from "./seed.js";
import { getStoredApiKey, state } from "./state.js";
import { escapeHtml } from "./utils.js";
import { getWeightKg } from "./domain/energy.js";
import { computeMuscleStats } from "./domain/muscles.js";
import { getRankForXP } from "./domain/ranks.js";
import { computeSupplementDoseText } from "./views/today.js";
import { getWeightEntriesSorted } from "./views/analysis.js";

export function buildFreeAnalysisPrompt(){
  return `Tu es un préparateur physique spécialisé en sports de combat (MMA/Muay Thaï/grappling). Voici mes données d'entraînement. Peux-tu me faire une analyse concrète et bienveillante (pas de jargon médical, pas de diagnostic) :
1) Ce qui va bien dans ma régularité et ma progression
2) Les points de vigilance (surcharge, groupe délaissé, note inquiétante, plateau de poids...)
3) 2-3 conseils concrets pour la suite

Données :
${buildAnalysisPayload()}`;
}

// ---------- IA locale (expérimental) : WebLLM + WebGPU, 100% sur l'appareil ----------
export let localAiEngine = null; // conservé en mémoire pour éviter de recharger le modèle à chaque analyse

export function setLocalAiStatus(html){
  const el = document.getElementById("localAiStatus");
  if(el) el.innerHTML = html;
}

export async function ensureLocalAiEngine(){
  if(localAiEngine) return localAiEngine;
  setLocalAiStatus(`<div class="section-meta">Chargement de la bibliothèque IA locale...</div>`);
  // Chargée depuis un CDN au premier lancement (nécessite internet une fois), puis mise en cache par le navigateur.
  const webllm = await import("https://esm.run/@mlc-ai/web-llm");

  // Sélection dynamique d'un petit modèle disponible plutôt qu'un identifiant figé
  // (évite un échec si la liste de modèles de la bibliothèque a changé entre-temps).
  const allIds = webllm.prebuiltAppConfig.model_list.map(m => m.model_id);
  const small = allIds.filter(id => /Instruct/i.test(id) && /(0\.5B|1B|1\.5B|2B)\b/i.test(id));
  const modelId =
    small.find(id => /Qwen2\.5-1\.5B/i.test(id)) ||
    small.find(id => /Llama-3\.2-1B/i.test(id)) ||
    small.find(id => /Qwen2\.5-0\.5B/i.test(id)) ||
    small[0];
  if(!modelId) throw new Error("Aucun petit modèle disponible dans la bibliothèque.");

  setLocalAiStatus(`<div class="section-meta">Téléchargement du modèle « ${escapeHtml(modelId)} »... (une seule fois)</div>
    <div class="level-bar" style="margin-top:6px;"><div class="level-bar-fill" id="localAiProgressBar" style="width:0%"></div></div>`);

  localAiEngine = await webllm.CreateMLCEngine(modelId, {
    initProgressCallback: (progress)=>{
      const pct = Math.round((progress.progress||0) * 100);
      const bar = document.getElementById("localAiProgressBar");
      if(bar) bar.style.width = pct + "%";
      setLocalAiStatus(`<div class="section-meta">${escapeHtml(progress.text || "Chargement...")} (${pct}%)</div>
        <div class="level-bar" style="margin-top:6px;"><div class="level-bar-fill" id="localAiProgressBar" style="width:${pct}%"></div></div>`);
    }
  });
  return localAiEngine;
}

export let localAiChatHistory = []; // [{role:'user'|'assistant', content}] — en mémoire seulement, remis à zéro au rechargement de page

export function buildLocalAiSystemPrompt(){
  return `Tu es un coach personnel expert en préparation physique pour les sports de combat (MMA, Muay Thaï, grappling/lutte) : périodisation de l'entraînement, gestion de la fatigue/RPE, prévention des blessures, renforcement ciblé (cou, grip, gainage), et compléments alimentaires de base (créatine, oméga-3, vitamine D, électrolytes, magnésium) — leurs usages, dosages typiques et limites de sécurité.

Tu donnes des avis et conseils concrets, personnalisés, bienveillants et directs (tutoiement), sans jargon médical inutile et sans poser de diagnostic médical — tu n'es pas médecin, tu donnes des repères généraux, pas une prescription individuelle. Base-toi sur les données ci-dessous en priorité plutôt que des généralités. Réponds en français, de façon concise sauf si on te demande explicitement un compte-rendu détaillé.

Données actuelles de la personne :
${buildAnalysisPayload()}`;
}

export function renderLocalAiChatMessages(){
  if(localAiChatHistory.length === 0){
    return `<div class="exo-desc">Pose ta première question — par exemple "Fais-moi un compte-rendu de ma semaine" ou "Qu'est-ce que je devrais améliorer ?".</div>`;
  }
  return localAiChatHistory.map(m=>
    `<div class="chat-msg ${m.role}">${escapeHtml(m.content)}</div>`
  ).join("");
}

export function refreshLocalAiChatBox(){
  const box = document.getElementById("localAiChatBox");
  if(box){
    box.innerHTML = renderLocalAiChatMessages();
    box.scrollTop = box.scrollHeight;
  }
}

export async function sendLocalAiMessage(){
  const input = document.getElementById("localAiChatInput");
  const sendBtn = document.getElementById("localAiSendBtn");
  const text = input.value.trim();
  if(!text) return;
  if(!navigator.gpu){
    setLocalAiStatus(`<div class="divider-note" style="border-left-color:var(--danger);">WebGPU indisponible sur ce navigateur/appareil — utilise plutôt le copier-coller vers Claude.ai.</div>`);
    return;
  }
  input.value = "";
  input.disabled = true;
  sendBtn.disabled = true;
  localAiChatHistory.push({ role:"user", content:text });
  refreshLocalAiChatBox();

  try{
    const engine = await ensureLocalAiEngine();
    setLocalAiStatus(`<div class="section-meta">Le modèle réfléchit... (peut prendre 10s à 1 min sur téléphone)</div>`);
    const messages = [
      { role:"system", content: buildLocalAiSystemPrompt() },
      ...localAiChatHistory
    ];
    const reply = await engine.chat.completions.create({ messages, temperature:0.7, max_tokens:400 });
    const replyText = reply.choices[0].message.content.trim();
    localAiChatHistory.push({ role:"assistant", content:replyText });
    setLocalAiStatus("");
  }catch(err){
    console.error(err);
    localAiChatHistory.push({ role:"assistant", content:"⚠ Erreur : "+(err.message||"impossible de répondre. Ton appareil n'a peut-être pas assez de mémoire, ou la connexion a été interrompue pendant le téléchargement du modèle.") });
  }finally{
    refreshLocalAiChatBox();
    input.disabled = false;
    sendBtn.disabled = false;
    input.focus();
  }
}

export async function copyForFreeAnalysis(){
  const text = buildFreeAnalysisPrompt();
  const btn = document.getElementById("copyForClaudeBtn");
  const originalText = btn.textContent;
  try{
    await navigator.clipboard.writeText(text);
    btn.textContent = "✔ Copié — colle-le dans Claude.ai";

  }catch(e){
    // Repli si l'API clipboard est indisponible (ex: certains navigateurs intégrés) :
    // on affiche le texte sélectionnable pour une copie manuelle.
    const resultEl = document.getElementById("aiAnalysisResult");
    resultEl.innerHTML = `<div class="section-meta" style="margin-bottom:6px;">Copie automatique indisponible — sélectionne et copie ce texte à la main :</div>
      <textarea readonly style="min-height:160px; font-family:var(--mono); font-size:11px;">${escapeHtml(text)}</textarea>`;
    resultEl.querySelector("textarea").select();
    btn.textContent = originalText;
    return;
  }
  setTimeout(()=>{ btn.textContent = originalText; }, 2200);
}

// Construit un résumé compact des données récentes à envoyer à l'API (contrôle du volume/coût)
export function buildAnalysisPayload(){
  const weightKg = getWeightKg();
  const entries = getWeightEntriesSorted().slice(-20);
  const weightLines = entries.map(e=>`${e.dateISO}: ${e.weight} kg`).join("\n") || "aucune pesée enregistrée";

  const dates = Object.keys(state.logs).sort((a,b)=>b.localeCompare(a)).slice(0, 25);
  const sessionLines = dates.map(d=>{
    const log = state.logs[d];
    const prog = state.programs[log.programKey];
    const done = Object.values(log.exercises||{}).filter(e=>e.done).length;
    const rpes = Object.values(log.exercises||{}).filter(e=>e.done && e.rpe).map(e=>e.rpe);
    const avgRpe = rpes.length ? (rpes.reduce((a,b)=>a+b,0)/rpes.length).toFixed(1) : "—";
    const note = log.note ? ` | note: "${log.note}"` : "";
    return `${d} — ${prog?prog.name:"?"} — ${done} exos faits, RPE moyen ${avgRpe}${note}`;
  }).join("\n");

  const stats = computeMuscleStats();
  const muscleLines = MUSCLE_GROUPS.map(m=>{
    const st = stats[m];
    const rank = getRankForXP(st.totalXP);
    return `${MUSCLE_LABELS[m]}: rang ${rank.label}${st.neglected?" (délaissé)":""}, dernière fois ${st.lastDaysAgo===null?"jamais":st.lastDaysAgo+"j"}`;
  }).join("\n");

  const supplementLines = (state.supplements||[]).map(s=>`${s.name} (${computeSupplementDoseText(s, weightKg)}, ${s.timing})`).join("\n");

  return `Profil : ${state.profile.age||""}, ${weightKg} kg.

Pesées récentes :
${weightLines}

Séances récentes (les plus récentes en premier) :
${sessionLines || "aucune séance enregistrée"}

État des groupes musculaires :
${muscleLines}

Compléments alimentaires suivis :
${supplementLines || "aucun"}`;
}

export async function runAiAnalysis(){
  const resultEl = document.getElementById("aiAnalysisResult");
  const btn = document.getElementById("aiAnalyzeBtn");
  const apiKey = getStoredApiKey();
  if(!apiKey){
    resultEl.innerHTML = `<div class="divider-note" style="border-left-color:var(--danger);">Aucune clé API configurée. Va dans Réglages → "Analyse IA" pour en ajouter une.</div>`;
    return;
  }
  btn.disabled = true;
  const originalText = btn.textContent;
  btn.textContent = "Analyse en cours...";
  resultEl.innerHTML = `<div class="section-meta">Claude lit tes séances et tes notes...</div>`;

  const payload = buildAnalysisPayload();
  const prompt = `Tu es un préparateur physique spécialisé en sports de combat (MMA/Muay Thaï/grappling). Voici les données d'entraînement d'un pratiquant. Rédige une analyse en français, concrète et bienveillante (pas de jargon médical, pas de diagnostic) :
1) Ce qui va bien dans sa régularité et sa progression
2) Les points de vigilance (surcharge, groupe délaissé, note inquiétante, plateau de poids...)
3) 2-3 conseils concrets pour la suite
Reste sous 200 mots, ton direct et personnel (tutoiement).

Données :
${payload}`;

  try{
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify({
        model: "claude-sonnet-5",
        max_tokens: 700,
        messages: [{ role:"user", content: prompt }]
      })
    });
    const data = await response.json();
    if(!response.ok){
      const msg = (data && data.error && data.error.message) || `Erreur HTTP ${response.status}`;
      resultEl.innerHTML = `<div class="divider-note" style="border-left-color:var(--danger);">Échec de l'analyse : ${escapeHtml(msg)}</div>`;
    } else {
      const text = (data.content||[]).filter(b=>b.type==="text").map(b=>b.text).join("\n").trim();
      resultEl.innerHTML = `<div class="exo-desc" style="white-space:pre-wrap;">${escapeHtml(text)}</div>`;
    }
  }catch(err){
    console.error(err);
    resultEl.innerHTML = `<div class="divider-note" style="border-left-color:var(--danger);">Erreur réseau — vérifie ta connexion et ta clé API.</div>`;
  }finally{
    btn.disabled = false;
    btn.textContent = originalText;
  }
}

import { MAIN_PROGRAM_ORDER, SEED_DATA, SUB_PROGRAM_KEYS } from "./seed.js";
import { showToast } from "./utils.js";

// ============================================================
// ÉTAT ET STOCKAGE — données du carnet, lecture/écriture locale
// Stockage 100% local sur l'appareil (localStorage).
// ============================================================

export const STORAGE_KEY = "carnetCombat_v1";
export const API_KEY_STORAGE = "carnetCombat_apiKey"; // volontairement séparé de STORAGE_KEY : jamais inclus dans export/import
export function getStoredApiKey(){
  try{ return localStorage.getItem(API_KEY_STORAGE) || ""; }catch(e){ return ""; }
}
export function setStoredApiKey(key){
  try{
    if(key) localStorage.setItem(API_KEY_STORAGE, key);
    else localStorage.removeItem(API_KEY_STORAGE);
  }catch(e){ console.error(e); }
}

// État partagé de l'application.
// `state` : les données du carnet (profil, programmes, journal). Remplacé uniquement via setState().
// `ui` : l'état d'affichage courant (onglet, mode édition).
export let state = null;
export function setState(next){ state = next; }
export const ui = { currentView: "today", editMode: false };

// ---------- State ----------
export function loadState(){
  const raw = localStorage.getItem(STORAGE_KEY);
  if(raw){
    try{
      const parsed = JSON.parse(raw);
      if(!parsed.profile.poids_kg){
        const m = (parsed.profile.taille_poids||"").match(/(\d{2,3})\s*(?:-\s*(\d{2,3}))?\s*kg/i);
        parsed.profile.poids_kg = m ? Math.round((parseFloat(m[1]) + parseFloat(m[2]||m[1]))/2) : 75;
      }
      if(!parsed.supplements) parsed.supplements = JSON.parse(JSON.stringify(SEED_DATA.supplements));
      if(!parsed.weightLog) parsed.weightLog = {};
      if(!parsed.deletedPrograms) parsed.deletedPrograms = [];
      migrateProgramsData(parsed);
      return parsed;
    }catch(e){ console.warn("Corrupted state, reseeding", e); }
  }
  return {
    profile: JSON.parse(JSON.stringify(SEED_DATA.profile)),
    methode: JSON.parse(JSON.stringify(SEED_DATA.methode)),
    weeklyPlan: JSON.parse(JSON.stringify(SEED_DATA.weeklyPlan)),
    programs: JSON.parse(JSON.stringify(SEED_DATA.programs)),
    equipment: JSON.parse(JSON.stringify(SEED_DATA.equipment)),
    safety: JSON.parse(JSON.stringify(SEED_DATA.safety)),
    supplements: JSON.parse(JSON.stringify(SEED_DATA.supplements)),
    weightLog: {}, // { "YYYY-MM-DD": poidsKg }
    deletedPrograms: [], // clés de programmes masqués (supprimés par l'utilisateur, restaurables)
    logs: {} // { "YYYY-MM-DD": { programKey, note, locked, extraPrograms:[], substitutions:{}, supplements:{}, exercises:{id:{poids,reps,rpe,done}} } }
  };
}

// Programmes réellement affichables : présents dans les données ET non supprimés par l'utilisateur
export function getVisibleMainPrograms(){
  return MAIN_PROGRAM_ORDER.filter(k => state.programs[k] && !(state.deletedPrograms||[]).includes(k));
}
export function getVisibleSubPrograms(){
  return SUB_PROGRAM_KEYS.filter(k => state.programs[k] && !(state.deletedPrograms||[]).includes(k));
}

// Complète les carnets déjà sauvegardés (avant l'ajout des tags muscles/MET/substitutions)
// avec les nouveaux champs, sans écraser les modifications personnelles déjà faites par l'utilisateur.
export function migrateProgramsData(parsed){
  if(!parsed.programs) return;
  Object.keys(SEED_DATA.programs).forEach(key=>{
    const seedProg = SEED_DATA.programs[key];
    if(!parsed.programs[key]){
      // programme introduit dans une mise à jour ultérieure : on l'ajoute tel quel
      parsed.programs[key] = JSON.parse(JSON.stringify(seedProg));
      return;
    }
    const userProg = parsed.programs[key];
    if(typeof userProg.met === "undefined") userProg.met = seedProg.met;
    if(typeof userProg.roundsConfigurable === "undefined" && seedProg.roundsConfigurable) userProg.roundsConfigurable = true;
    const seedExById = {};
    seedProg.exercises.forEach(ex=> seedExById[ex.id] = ex);
    userProg.exercises.forEach(ex=>{
      const seedEx = seedExById[ex.id];
      if(!seedEx) return; // exercice personnalisé ajouté par l'utilisateur : pas de tag muscle connu
      if(typeof ex.m === "undefined") ex.m = seedEx.m;
      if(typeof ex.sub === "undefined" && seedEx.sub) ex.sub = seedEx.sub;
      if(typeof ex.category === "undefined" && seedEx.category) ex.category = seedEx.category;
    });
  });

  // Rattrapage ciblé : les carnets ayant déjà "Points faibles" (avant l'ajout du bloc poignets/tibias)
  // reçoivent les exercices manquants + le nom/durée à jour, sans perdre les données déjà notées.
  const pf = parsed.programs.points_faibles;
  const seedPf = SEED_DATA.programs.points_faibles;
  if(pf && seedPf && !pf.exercises.some(ex=>ex.id==="rf_pj1")){
    pf.name = seedPf.name;
    pf.subtitle = seedPf.subtitle;
    pf.duration = seedPf.duration;
    pf.note = seedPf.note;
    const missing = seedPf.exercises.filter(ex=> ex.id.startsWith("rf_pj"));
    pf.exercises.push(...JSON.parse(JSON.stringify(missing)));
  }
}

export function saveState(){
  try{
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }catch(e){
    showToast("Impossible de sauvegarder (stockage plein ou indisponible).", true);
    console.error(e);
  }
}

export function getLog(dateISO){
  if(!state.logs[dateISO]) state.logs[dateISO] = { programKey:null, note:"", locked:false, extraPrograms:[], substitutions:{}, supplements:{}, exercises:{} };
  const log = state.logs[dateISO];
  if(typeof log.locked === "undefined") log.locked = false;
  if(!log.extraPrograms) log.extraPrograms = [];
  if(!log.substitutions) log.substitutions = {};
  if(!log.supplements) log.supplements = {};
  return log;
}
export function getExLog(dateISO, exId){
  const log = getLog(dateISO);
  if(!log.exercises[exId]) log.exercises[exId] = { poids:"", reps:"", rpe:null, done:false };
  return log.exercises[exId];
}
// Renvoie {taken, time} pour un complément donné, en migrant en douceur les anciennes
// valeurs booléennes (avant l'ajout de l'heure de prise) vers ce nouveau format.
export function getSupLog(dateISO, supId){
  const log = getLog(dateISO);
  const val = log.supplements[supId];
  if(val === undefined){
    log.supplements[supId] = { taken:false, time:"" };
  } else if(typeof val === "boolean"){
    log.supplements[supId] = { taken: val, time:"" };
  }
  return log.supplements[supId];
}
export function isSupTaken(val){
  if(!val) return false;
  return typeof val === "object" ? !!val.taken : !!val;
}
export function nowHHMM(){
  const d = new Date();
  return String(d.getHours()).padStart(2,"0") + ":" + String(d.getMinutes()).padStart(2,"0");
}

// Renvoie la liste à plat de tous les exercices réellement proposés pour une séance donnée :
// programme principal (avec substitutions appliquées) + programmes complémentaires ajoutés.
// Chaque entrée : { ex, met }
export function getSessionExercises(log){
  const list = [];
  const mainProg = state.programs[log.programKey];
  if(mainProg){
    mainProg.exercises.forEach(ex=>{
      if(ex.sub && log.substitutions && log.substitutions[ex.id]){
        const subProg = state.programs[ex.sub];
        if(subProg) subProg.exercises.forEach(subEx=> list.push({ ex:subEx, met:subProg.met||5 }));
      } else {
        list.push({ ex, met:mainProg.met||5 });
      }
    });
  }
  (log.extraPrograms||[]).forEach(key=>{
    const p = state.programs[key];
    if(p) p.exercises.forEach(ex=> list.push({ ex, met:p.met||5 }));
  });
  return list;
}

import { getSessionExercises, state } from "../state.js";

export function getWeightKg(){
  const w = parseFloat(state.profile.poids_kg);
  return (w && w > 0) ? w : 75;
}

// Analyse le texte "sets" d'un exercice pour déterminer s'il se pratique en
// répétitions (ex: "4 x 12-15") ou sur une durée fixe (ex: "3 min effort", "3 x 20-30 s").
// C'est cette classification qui décide si on utilise les répétitions notées
// par l'utilisateur, ou la durée prévue par le programme.
export function classifyExercise(setsStr){
  if(!setsStr) return { type:"reps", sets:1, perSetReps:10 };
  const s = setsStr.toLowerCase();
  let m = s.match(/^(\d+)\s*x\s*([\d.]+)(?:-([\d.]+))?\s*s\b/);
  if(m) return { type:"duration", sets:parseInt(m[1]), perSetSeconds:(parseFloat(m[2])+parseFloat(m[3]||m[2]))/2 };
  m = s.match(/^(\d+)\s*x\s*([\d.]+)(?:-([\d.]+))?\s*min\b/);
  if(m) return { type:"duration", sets:parseInt(m[1]), perSetSeconds:((parseFloat(m[2])+parseFloat(m[3]||m[2]))/2)*60 };
  m = s.match(/^(\d+)\s*x\s*([\d.]+)(?:-([\d.]+))?/);
  if(m) return { type:"reps", sets:parseInt(m[1]), perSetReps:(parseFloat(m[2])+parseFloat(m[3]||m[2]))/2 };
  m = s.match(/^(\d+)\s*x\s*max/);
  if(m) return { type:"reps", sets:parseInt(m[1]), perSetReps:null };
  m = s.match(/^([\d.]+)(?:-([\d.]+))?\s*min\b/);
  if(m) return { type:"duration", sets:1, perSetSeconds:((parseFloat(m[1])+parseFloat(m[2]||m[1]))/2)*60 };
  m = s.match(/^([\d.]+)(?:-([\d.]+))?\s*s\b/);
  if(m) return { type:"duration", sets:1, perSetSeconds:(parseFloat(m[1])+parseFloat(m[2]||m[1]))/2 };
  m = s.match(/^(\d+)/);
  if(m) return { type:"reps", sets:1, perSetReps:parseFloat(m[1]) };
  return { type:"reps", sets:1, perSetReps:10 };
}
export function parseRestSeconds(restStr){
  if(!restStr || restStr==="—") return 0;
  const s = restStr.toLowerCase();
  if(s.includes("min")){ const m = s.match(/([\d.]+)/); return m ? parseFloat(m[1])*60 : 0; }
  const m = s.match(/([\d.]+)/);
  return m ? parseFloat(m[1]) : 0;
}
export const SECONDS_PER_REP = 2.6; // hypothèse moyenne (phase concentrique + excentrique)

// Estime les calories d'un exercice. Si l'exercice est chronométré (round, gainage, etc.),
// on utilise la durée prévue par le programme (fiable). S'il se compte en répétitions,
// on utilise en priorité les répétitions RÉELLEMENT notées par l'utilisateur (fiable) ;
// à défaut, une moyenne du programme (moins fiable, purement indicative).
// Retourne { kcal, reliability: 'bonne'|'estimee' }
export function estimateExerciseKcal(ex, met, weightKg, loggedReps){
  const info = classifyExercise(ex.sets);
  const restSeconds = parseRestSeconds(ex.rest);
  let totalSeconds, reliability;

  if(info.type === "duration"){
    totalSeconds = info.sets*info.perSetSeconds + Math.max(0, info.sets-1)*restSeconds;
    reliability = "bonne"; // durée fixée par le programme, peu d'incertitude
  } else {
    const loggedNum = parseFloat(loggedReps);
    let repsPerSet;
    if(loggedNum && loggedNum > 0){
      repsPerSet = loggedNum;
      reliability = "bonne"; // basé sur ce que tu as réellement noté
    } else {
      repsPerSet = info.perSetReps || 8;
      reliability = "estimee"; // valeur moyenne par défaut, aucune répétition notée
    }
    totalSeconds = info.sets*repsPerSet*SECONDS_PER_REP + Math.max(0, info.sets-1)*restSeconds;
  }

  const hours = totalSeconds/3600;
  return { kcal: met*weightKg*hours, reliability };
}

// Calories d'une séance : seulement les exercices cochés "fait" (reflète l'effort réellement fourni).
// reliability globale = "bonne" seulement si AUCUN exercice n'a dû être estimé par défaut.
export function estimateSessionKcalDone(log, weightKg){
  let total = 0, anyEstimated = false, anyCounted = false;
  getSessionExercises(log).forEach(({ex, met})=>{
    const exLog = log.exercises ? log.exercises[ex.id] : null;
    if(exLog && exLog.done){
      anyCounted = true;
      const r = estimateExerciseKcal(ex, met, weightKg, exLog.reps);
      total += r.kcal;
      if(r.reliability === "estimee") anyEstimated = true;
    }
  });
  return { kcal: Math.round(total), reliability: anyCounted ? (anyEstimated ? "estimee" : "bonne") : "bonne" };
}

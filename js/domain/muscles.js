import { MUSCLE_GROUPS } from "../seed.js";
import { getSessionExercises, state } from "../state.js";

// ---------- Rangs musculaires ----------
export function daysBetweenISO(iso, refDate){
  const [y,mo,d] = iso.split("-").map(Number);
  const dt = new Date(y, mo-1, d);
  return Math.floor((refDate - dt) / (1000*60*60*24));
}
export function computeMuscleStats(){
  const windowDays = 28;
  const neglectDays = 10;
  const xpPerTrainingDay = 15;
  const today = new Date();
  const stats = {};
  MUSCLE_GROUPS.forEach(m => stats[m] = { count:0, totalXP:0, lastISO:null, lastDaysAgo:null, neglected:false });

  Object.keys(state.logs).forEach(dateISO=>{
    const log = state.logs[dateISO];
    if(!log.programKey && (!log.extraPrograms || !log.extraPrograms.length)) return;
    const daysAgo = daysBetweenISO(dateISO, today);
    const hitToday = new Set();
    getSessionExercises(log).forEach(({ex})=>{
      const exLog = log.exercises[ex.id];
      if(exLog && exLog.done && ex.m) ex.m.forEach(m=> hitToday.add(m));
    });
    hitToday.forEach(m=>{
      if(!stats[m]) return;
      if(daysAgo <= windowDays) stats[m].count++;
      stats[m].totalXP += xpPerTrainingDay; // XP cumulé à vie, ne se réinitialise jamais
      if(stats[m].lastISO===null || dateISO > stats[m].lastISO) stats[m].lastISO = dateISO;
    });
  });

  MUSCLE_GROUPS.forEach(m=>{
    const st = stats[m];
    if(st.lastISO){
      st.lastDaysAgo = daysBetweenISO(st.lastISO, today);
      st.neglected = st.lastDaysAgo > neglectDays;
    } else {
      st.lastDaysAgo = null;
      st.neglected = true; // jamais travaillé = à surveiller aussi
    }
  });
  return stats;
}

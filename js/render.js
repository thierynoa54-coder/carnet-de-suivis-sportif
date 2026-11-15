import { ui } from "./state.js";
import { fmtDateHuman, todayISO } from "./utils.js";
import { renderToday } from "./views/today.js";
import { renderWeek } from "./views/week.js";
import { renderPrograms } from "./views/programs.js";
import { renderAnalysis } from "./views/analysis.js";
import { renderJournal } from "./views/journal.js";
import { renderSettings } from "./views/settings.js";

export function render(){
  const app = document.getElementById("app");
  const sub = document.getElementById("topbarSub");
  sub.textContent = fmtDateHuman(todayISO());
  document.querySelectorAll(".navbar button").forEach(b=>{
    b.classList.toggle("active", b.dataset.view === ui.currentView);
  });
  if(ui.currentView === "today") renderToday(app);
  else if(ui.currentView === "week") renderWeek(app);
  else if(ui.currentView === "programs") renderPrograms(app);
  else if(ui.currentView === "analysis") renderAnalysis(app);
  else if(ui.currentView === "journal") renderJournal(app);
  else if(ui.currentView === "settings") renderSettings(app);
}

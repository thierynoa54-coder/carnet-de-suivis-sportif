import { loadState, setState, ui } from "./state.js";
import { render } from "./render.js";

// ---------- Nav ----------
document.addEventListener("DOMContentLoaded", () => {
  setState(loadState());
  const navButtons = [...document.querySelectorAll(".navbar button")];
  navButtons.forEach(btn => {
    btn.addEventListener("click", () => {
      ui.currentView = btn.dataset.view;
      ui.editMode = false;
      render();
    });
  });

  // Clavier : les touches 1 à 6 changent d'onglet (hors saisie dans un champ)
  document.addEventListener("keydown", (e) => {
    if(e.ctrlKey || e.metaKey || e.altKey) return;
    const el = e.target;
    if(el && (el.isContentEditable || ["INPUT", "TEXTAREA", "SELECT"].includes(el.tagName))) return;
    const btn = navButtons[Number(e.key) - 1];
    if(btn) btn.click();
  });

  render();
});

// ---------- Mode hors connexion ----------
// Le service worker garde une copie de l'application pour qu'elle s'ouvre sans réseau.
if("serviceWorker" in navigator){
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch((err) => console.warn("Mode hors connexion indisponible :", err));
  });
}

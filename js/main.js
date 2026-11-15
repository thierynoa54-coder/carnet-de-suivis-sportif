import { loadState, setState, ui } from "./state.js";
import { render } from "./render.js";

// ---------- Nav ----------
document.addEventListener("DOMContentLoaded", () => {
  setState(loadState());
  document.querySelectorAll(".navbar button").forEach(btn => {
    btn.addEventListener("click", () => {
      ui.currentView = btn.dataset.view;
      ui.editMode = false;
      render();
    });
  });
  render();
});

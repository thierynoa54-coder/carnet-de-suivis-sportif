// Mise en page en deux colonnes sur tablette et PC (une seule sur téléphone, voir css/app.css).
// Les vues assemblent leur HTML par concaténation : ces trois fragments délimitent les colonnes.
export const COLS_OPEN = `<div class="cols"><div class="col col-main">`;
export const COLS_SPLIT = `</div><div class="col col-side">`;
export const COLS_CLOSE = `</div></div>`;

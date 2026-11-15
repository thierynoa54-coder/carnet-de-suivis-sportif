// Vérifie surtout deux choses après le découpage en modules :
// aucun identifiant non défini (import oublié) et aucun import inutile.
const browser = ["document", "window", "navigator", "localStorage", "sessionStorage", "console", "setTimeout", "clearTimeout",
  "requestAnimationFrame", "FileReader", "File", "fetch", "URL", "Blob", "confirm", "alert", "location"];
const node = ["process", "Buffer"];
const asGlobals = (names) => Object.fromEntries(names.map((n) => [n, "readonly"]));

export default [
  {
    files: ["js/**/*.js"],
    languageOptions: { ecmaVersion: 2022, sourceType: "module", globals: asGlobals(browser) },
    rules: { "no-undef": "error", "no-unused-vars": ["error", { args: "none", caughtErrors: "none" }] },
  },
  {
    files: ["tests/**/*.js", "tools/**/*.js"],
    languageOptions: { ecmaVersion: 2022, sourceType: "module", globals: asGlobals([...browser, ...node]) },
    rules: { "no-undef": "error", "no-unused-vars": ["error", { args: "none", caughtErrors: "none" }] },
  },
];

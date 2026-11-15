import { DAY_NAMES } from "./assets.js";

export function todayISO(){
  const d = new Date();
  return d.getFullYear()+"-"+String(d.getMonth()+1).padStart(2,"0")+"-"+String(d.getDate()).padStart(2,"0");
}
export function todayDayName(){
  return DAY_NAMES[new Date().getDay()];
}
export function fmtDateHuman(iso){
  const [y,m,d] = iso.split("-").map(Number);
  const dt = new Date(y, m-1, d);
  return dt.toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long" });
}

// Notification discrète, sans dépendre des boîtes de dialogue natives (peu fiables en PWA installée)
export function showToast(message, isError){
  let toast = document.getElementById("appToast");
  if(!toast){
    toast = document.createElement("div");
    toast.id = "appToast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.className = "app-toast show" + (isError ? " error" : "");
  clearTimeout(showToast._t);
  showToast._t = setTimeout(()=> toast.classList.remove("show"), 3200);
}

// ---------- utils ----------
export function escapeHtml(str){
  if(str===undefined||str===null) return "";
  return String(str)
    .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
    .replace(/\n/g,"<br>");
}
export function escapeAttr(str){
  if(str===undefined||str===null) return "";
  return String(str).replace(/&/g,"&amp;").replace(/"/g,"&quot;");
}

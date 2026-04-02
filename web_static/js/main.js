// main.js — Lite Edition

// ── HTML escape ───────────────────────────────────────────────────────────────

function esc(s) {
  return String(s ?? "")
    .replace(/&/g,  "&amp;")
    .replace(/</g,  "&lt;")
    .replace(/>/g,  "&gt;")
    .replace(/"/g,  "&quot;");
}

// ── Modal helpers ─────────────────────────────────────────────────────────────

function openM(id)  { document.getElementById(id).classList.add("open"); }
function closeM(id) { document.getElementById(id).classList.remove("open"); }

document.querySelectorAll(".mo").forEach(overlay =>
  overlay.addEventListener("click", e => {
    if (e.target === overlay) overlay.classList.remove("open");
  })
);

// ── Navigation ────────────────────────────────────────────────────────────────

document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    document.getElementById("page-" + btn.dataset.page).classList.add("active");

    if (btn.dataset.page !== "mods" && window._stopWorkshopPoll) {
      window._stopWorkshopPoll();
    }

    switch (btn.dataset.page) {
      case "mods":
        loadMods().then(() => {
        if (typeof restoreDownloadBar === 'function') restoreDownloadBar();
        });
        break;
      case "trash":    loadTrash();    break;
      case "settings": loadSettings(); break;
    }
  });
});

// ── Init ──────────────────────────────────────────────────────────────────────
// 1. Load locale from backend config (async)
// 2. Apply locale to DOM
// 3. Wire auto-save listeners
// 4. Load initial data

(async () => {
  await initLocale();
  applyLocale();
  initSettingsAutoSave();
  _initDelModal();
  await loadProfiles();
  if (typeof checkWarnings === 'function') checkWarnings();
  window.dispatchEvent(new Event('rimmod:ready'));
})();

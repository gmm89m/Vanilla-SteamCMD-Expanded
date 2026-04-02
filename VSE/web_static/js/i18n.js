// i18n.js — Locale loader for RimMod Lite
//
// Locales live in lang/*.js — each file sets window.RIMMOD_LOCALE = { ... }
// Flask serves them via the /lang/ route from the lang/ folder next to the exe.
//
// To add a language: drop a new .js file into lang/, restart the app.
// Label shown in Settings = filename stem before first "-", uppercased, max 4 chars.
//   en.js      -> EN
//   ru.js      -> RU
//   RU-loc.js  -> RU
//   UKR-loc.js -> UKR

// ── Active locale ─────────────────────────────────────────────────────────────
let _locale = {};
let _lang    = "en";

// ── Translation helpers ───────────────────────────────────────────────────────

function t(key, ...args) {
  const val = _locale[key] ?? key;
  return typeof val === "function" ? val(...args) : val;
}

function tLog(line) {
  const trimmed = line.trim();
  if (!trimmed.startsWith("log_")) return trimmed;
  const parts = trimmed.split("|");
  const key   = parts[0];
  const params = parts.slice(1);
  const val   = _locale[key];
  if (!val) return trimmed;
  return typeof val === "function" ? val(...params) : val;
}

// ── Load a single locale file ─────────────────────────────────────────────────

function loadLocale(file) {
  return new Promise((resolve, reject) => {
    const old = document.getElementById("_rimmod_locale_script");
    if (old) old.remove();
    window.RIMMOD_LOCALE = null;

    const script   = document.createElement("script");
    script.id      = "_rimmod_locale_script";
    script.src     = `/lang/${file}?_=${Date.now()}`;
    script.onload  = () => {
      if (window.RIMMOD_LOCALE) {
        _locale = window.RIMMOD_LOCALE;
        _lang   = file.replace(/\.js$/i, "");
        resolve();
      } else {
        reject(new Error(`${file} did not set window.RIMMOD_LOCALE`));
      }
    };
    script.onerror = () => reject(new Error(`Failed to load /lang/${file}`));
    document.head.appendChild(script);
  });
}

// ── Startup: load saved locale before anything renders ────────────────────────

async function initLocale() {
  let savedLang = "en";
  let files     = [];

  try {
    const [cfgResp, langResp] = await Promise.all([
      fetch("/api/config").then(r => r.json()),
      fetch("/api/lang-files").then(r => r.json()),
    ]);
    savedLang = cfgResp.language || "en";
    files     = langResp;
  } catch (e) {
    console.warn("initLocale: could not reach backend", e);
  }

  // Find the file matching savedLang (stem match, case-insensitive)
  const match = files.find(
    f => f.file.replace(/\.js$/i, "").toLowerCase() === savedLang.toLowerCase()
  );
  const file = match ? match.file : "en.js";

  try {
    await loadLocale(file);
  } catch (e) {
    console.warn("initLocale: falling back to en.js —", e);
    try { await loadLocale("en.js"); } catch (_) {}
  }
}

// ── Apply locale to static DOM elements ──────────────────────────────────────

function applyLocale() {
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.dataset.i18n;
    const val = t(key);
    if (el.tagName === "INPUT" && el.type !== "checkbox") {
      el.placeholder = val;
    } else if (el.hasAttribute("data-i18n-html")) {
      el.innerHTML = val;
    } else {
      el.textContent = val;
    }
  });
  if (typeof renderMods         === "function") renderMods();
  if (typeof renderTrash        === "function") renderTrash();
  if (typeof renderLangSelector === "function") renderLangSelector();
}

// ── Change language (called from settings selector) ───────────────────────────

async function setLang(file) {
  try {
    await loadLocale(file);
    applyLocale();
    await fetch("/api/config", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ language: _lang }),
    });
    if (typeof checkWarnings === 'function') checkWarnings();
  } catch (e) {
    console.error("setLang failed:", e);
  }
}

function getLang()        { return _lang; }
function availableLangs() { return []; }   // kept for compat

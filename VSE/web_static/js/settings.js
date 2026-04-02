// settings.js — Lite Edition
// Auto-saves on every change. Visual feedback per field (green/red outline).
// No explicit Save button. Steam login is always anonymous (not shown in UI).

// ── Field indicator helpers ───────────────────────────────────────────────────

function _fieldOk(el) {
  el.style.transition = "box-shadow .15s";
  el.style.boxShadow  = "0 0 0 2px var(--green2)";
  setTimeout(function() { el.style.boxShadow = ""; }, 1800);
}

function _fieldErr(el) {
  el.style.transition = "box-shadow .15s";
  el.style.boxShadow  = "0 0 0 2px var(--red2)";
  setTimeout(function() { el.style.boxShadow = ""; }, 2500);
}

// ── Save a single setting immediately ────────────────────────────────────────

async function _saveField(key, value, indicatorEl) {
  try {
    var r = await api("/api/config", { [key]: value });
    if (r.ok) {
      _fieldOk(indicatorEl);
      if (typeof checkWarnings === 'function') checkWarnings();
    } else {
      _fieldErr(indicatorEl);
    }
  } catch (e) {
    _fieldErr(indicatorEl);
  }
}

// ── Load settings from backend ────────────────────────────────────────────────

async function loadSettings() {
  var c = await api("/api/config");
  document.getElementById("c-scmd").value = c.steamcmd_path || "";
  document.getElementById("c-bk").checked = c.require_backup !== false;

  // Новое поле — размер пакета
  var pkgEl = document.getElementById("c-max-package");
  if (pkgEl) pkgEl.value = c.max_package_size || 50;

  renderLangSelector(c.language || "en");
}

// ── Auto-save wiring ──────────────────────────────────────────────────────────

function initSettingsAutoSave() {
  // steamcmd_path and download_dir — save on blur
  [
    ["c-scmd", "steamcmd_path"],
  ].forEach(function(pair) {
    var id  = pair[0];
    var key = pair[1];
    var el  = document.getElementById(id);
    if (!el) return;
    el.addEventListener("blur", function() {
      _saveField(key, el.value.trim(), el);
    });
  });

    // Поле размера пакета — автосохранение как у остальных полей
  var pkgEl = document.getElementById("c-max-package");
  if (pkgEl) {
    pkgEl.addEventListener("blur", function() {
      var val = parseInt(this.value);
      if (isNaN(val) || val < 1) val = 1;
      if (val > 50) val = 50;
      this.value = val;
      _saveField("max_package_size", val, this);
    });
  }

  // Checkbox — save immediately on change
  var bk = document.getElementById("c-bk");
  if (bk) {
    bk.addEventListener("change", function() {
      _saveField("require_backup", bk.checked, bk.parentElement);
    });
  }
}

// ── Browse dialogs ────────────────────────────────────────────────────────────


async function bFile(id, title) {
  var r = await api("/api/browse-file?title=" + encodeURIComponent(title));
  if (r.path) {
    var el = document.getElementById(id);
    el.value = r.path;
    _saveField("steamcmd_path", r.path, el);
  }
}

// ── Detect installed mods ─────────────────────────────────────────────────────

async function detectMods() {
  await api("/api/mods/detect", {});
  pollUntilDone(async function() {
    await loadMods();
    document.querySelector("[data-page=mods]").click();
  });
}

// ── Language selector ─────────────────────────────────────────────────────────

var _langFiles = [];

async function renderLangSelector(activeLang) {
  var sel = document.getElementById("lang-select");
  if (!sel) return;

  if (!_langFiles.length) {
    try {
      _langFiles = await fetch("/api/lang-files").then(function(r) { return r.json(); });
    } catch (e) {
      _langFiles = [];
    }
  }

  var current = activeLang || getLang();
  sel.innerHTML = _langFiles.map(function(item) {
    var stem     = item.file.replace(/\.js$/i, "");
    var selected = stem.toLowerCase() === current.toLowerCase() ? "selected" : "";
    return '<option value="' + item.file + '" ' + selected + '>' + item.label + '</option>';
  }).join("");
}

// Сохранение размера пакета
async function saveMaxPackageSize() {
  var el = document.getElementById("c-max-package");
  if (!el) return;

  var val = parseInt(el.value);
  if (isNaN(val) || val < 1) val = 1;
  if (val > 50) val = 50;
  el.value = val;

  await _saveField("max_package_size", val, el);
}

async function onLangChange(file) {
  await setLang(file);
  renderLangSelector(getLang());
}

async function reinstallSteamcmd() {
  var btn = document.getElementById('btn-reinstall-scmd');
  if (btn) { btn.disabled = true; }
  await api('/api/setup/reinstall-steamcmd', {});
  pollUntilDone(function() {
    loadSettings();
    if (btn) { btn.disabled = false; }
    if (typeof checkWarnings === 'function') checkWarnings();
  });
}

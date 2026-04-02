// profiles.js — profile selector + management

var _profiles = [];
var _activeId = '';

// ── Load & render ─────────────────────────────────────────────────

async function loadProfiles(activateId) {
  var r = await api('/api/profiles');
  _profiles = r.profiles || [];
  _activeId = r.active || '';

  if (activateId && activateId !== _activeId) {
    await api('/api/profiles/activate', { id: activateId });
    _activeId = activateId;
  }

  renderProfileSelect();
  loadMods();
  loadTrash();
  if (typeof loadSettings === 'function') loadSettings();
}

function renderProfileSelect() {
  var bar = document.getElementById('profile-bar');
  if (!bar) return;

  var opts = _profiles.map(function(p) {
    return '<option value="' + p.id + '"' + (p.id === _activeId ? ' selected' : '') + '>' +
      esc(p.name) + '</option>';
  }).join('');

  bar.innerHTML =
    '<select id="profile-select" onchange="switchProfile(this.value)" ' +
      'style="flex:1;font-size:11px;padding:4px 6px;min-width:0;' +
      'background:var(--bg3);border:1px solid var(--border);color:var(--text);border-radius:5px">' +
      opts +
    '</select>' +
    '<button class="btn btn-gh" onclick="editActiveProfile()" ' +
      'style="padding:3px 7px;font-size:12px;flex-shrink:0" title="Edit profile">&#9881;</button>' +
    '<button class="btn btn-gh" onclick="openProfileModal(null)" ' +
      'style="padding:3px 7px;font-size:13px;flex-shrink:0" title="Add game">&#65291;</button>';
}

async function switchProfile(pid) {
  if (pid === _activeId) return;
  await api('/api/profiles/activate', { id: pid });
  _activeId = pid;
  loadMods();
  loadTrash();
  if (typeof loadSettings === 'function') loadSettings();
}

async function editActiveProfile() {
  await loadProfiles();
  var p = _profiles.find(function(x) { return x.id === _activeId; });
  if (p) openProfileModal(p.id);
}

// ── Profile edit modal ─────────────────────────────────────────────

var _editPid        = '';
var _appLookupTimer = null;
var _pendingMods    = null;

function openProfileModal(pid) {
  _editPid     = pid || null;
  _pendingMods = null;

  var p     = pid ? _profiles.find(function(x) { return x.id === pid; }) : null;
  var isNew = !pid;

  var titleEl   = document.getElementById('m-profile-title');
  var nameEl    = document.getElementById('mp-name');
  var appidEl   = document.getElementById('mp-appid');
  var modsdirEl = document.getElementById('mp-modsdir');
  var statusEl  = document.getElementById('mp-appid-status');
  var hintEl   = document.getElementById('mp-appid-label-hint');
  var deleteBtn = document.getElementById('mp-delete-btn');

  if (titleEl)   titleEl.textContent     = isNew ? t('wizard_profile_title') : t('profile_edit_title');
  if (nameEl)    nameEl.value            = p ? p.name     : '';
  if (appidEl)   appidEl.value           = p ? p.app_id   : '';
  if (modsdirEl) modsdirEl.value         = p ? p.mods_dir : '';
  if (statusEl)  statusEl.textContent    = '';
  if (hintEl)    { hintEl.textContent = ''; }
  if (deleteBtn) deleteBtn.style.display = (!isNew && _profiles.length > 1) ? '' : 'none';

  // App ID live lookup
  if (appidEl) {
    appidEl.oninput = function() {
      clearTimeout(_appLookupTimer);
      var val = this.value.trim();
      if (!val.match(/^\d+$/)) { if (hintEl) hintEl.textContent = ''; return; }
      if (hintEl) { hintEl.textContent = t('wizard_appid_checking'); hintEl.style.color = 'var(--text3)'; }
      _appLookupTimer = setTimeout(function() {
        api('/api/profiles/app-info?app_id=' + val).then(function(r) {
          if (!hintEl) return;
          if (r.ok && r.name) {
            hintEl.textContent = '\u2713 ' + r.name;
            hintEl.style.color = 'var(--green2)';
            if (nameEl && !nameEl.value.trim()) nameEl.value = r.name;
          } else {
            hintEl.textContent = t('wizard_appid_notfound');
            hintEl.style.color = 'var(--red2)';
          }
        });
      }, 600);
    };
    if (appidEl.value) setTimeout(function() { if (appidEl) appidEl.dispatchEvent(new Event('input')); }, 100);
  }

  // Browse folder
  var browseBtn = document.getElementById('mp-modsdir-browse');
  if (browseBtn) browseBtn.onclick = function() {
    api('/api/browse-folder?title=' + encodeURIComponent(t('settings_modsdir')))
      .then(function(r) { if (r.path && modsdirEl) modsdirEl.value = r.path; });
  };

  // Save
  var saveBtn = document.getElementById('mp-save-btn');
  if (saveBtn) saveBtn.onclick = async function() {
    var name     = nameEl    ? nameEl.value.trim()    : '';
    var app_id   = appidEl   ? appidEl.value.trim()   : '';
    var mods_dir = modsdirEl ? modsdirEl.value.trim() : '';
    if (!name || !app_id) return;

    var savedProfileId = _editPid;

    if (isNew) {
      var cr = await api('/api/profiles', { name, app_id, mods_dir });
      if (!cr.ok) return;
      savedProfileId = cr.profile.id;
    } else {
      await api('/api/profiles/update', { id: _editPid, name, app_id, mods_dir });
    }

    if (_pendingMods && _pendingMods.length) {
      await api('/api/profiles/import-mods', { profile_id: savedProfileId, mods: _pendingMods });
      _pendingMods = null;
    }

    closeM('m-profile');
    loadProfiles(savedProfileId || undefined);
  };

  // Delete
  if (deleteBtn) deleteBtn.onclick = function() {
    if (!confirm(t('confirm_delete_one'))) return;
    api('/api/profiles/delete', { id: _editPid }).then(function() {
      closeM('m-profile'); loadProfiles();
    });
  };

  // Import from file — заполняет поля модала, не закрывает его
  var importBtn = document.getElementById('mp-import-btn');
  if (importBtn) importBtn.onclick = async function() {
    var r = await api('/api/profiles/import-file', {});
    if (!r.ok) {
      if (r.reason !== 'cancelled') alert(t('profile_import_failed') + ': ' + (r.reason || 'unknown error'));
      return;
    }
    if (nameEl)  nameEl.value  = r.name;
    if (appidEl) {
      appidEl.value = r.app_id;
      appidEl.dispatchEvent(new Event('input'));
    }
    _pendingMods = r.mods;
    if (statusEl) {
      statusEl.textContent = '\u2139\ufe0f ' + t('profile_import_hint', r.mod_count);
      statusEl.style.color = 'var(--text2)';
    }
  };

  openM('m-profile');
}

// Expose
window.loadProfiles      = loadProfiles;
window.editActiveProfile = editActiveProfile;
window.openProfileModal  = openProfileModal;

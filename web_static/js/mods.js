// mods.js — Lite Edition

let mods = [];

// ── Download progress state ───────────────────────────────────────────────────

let _dlTotal           = 0;
let _dlActive          = false;
let _dlLastProgress    = 0;   // не даём прогрессу откатываться назад
let _progressInterval  = null;

function _dlStart(ids) {
  _dlTotal        = ids.length;
  _dlActive       = true;
  _dlLastProgress = 0;

  var wrap = document.getElementById('dl-bar-wrap');
  if (wrap) wrap.style.display = 'flex';

  // Восстанавливаем кнопку Stop на случай если была скрыта
  var stopBtn = document.querySelector('#dl-bar-wrap button');
  if (stopBtn) stopBtn.style.display = '';

  var bar   = document.getElementById('dl-bar-fill');
  var count = document.getElementById('dl-bar-count');
  if (bar)   bar.style.width = '0%';
  if (count) count.textContent = '0 / ' + _dlTotal;

  _startProgressPolling();
}

function _dlStop() {
  _stopProgressPolling();
  _dlActive        = false;
  _dlTotal         = 0;
  _dlLastProgress  = 0;

  var wrap = document.getElementById('dl-bar-wrap');
  if (wrap) wrap.style.display = 'none';

  var bar = document.getElementById('dl-bar-fill');
  if (bar) bar.style.width = '0%';
}

function _startProgressPolling() {
  _stopProgressPolling();
  _progressInterval = setInterval(async function() {
    try {
      var r = await api('/api/download-progress');
      if (!_dlActive) { _stopProgressPolling(); return; }

      // Прогресс не может убывать
      var current = Math.max(r.current || 0, _dlLastProgress);
      var total   = r.total || _dlTotal;
      _dlLastProgress = current;

      var pct = total > 0 ? Math.round(current / total * 100) : 0;

      var bar   = document.getElementById('dl-bar-fill');
      var count = document.getElementById('dl-bar-count');
      if (bar)   bar.style.width = pct + '%';
      if (count) count.textContent = current + ' / ' + total;

    } catch (e) { /* network hiccup — ignore */ }
  }, 1000);
}

function _stopProgressPolling() {
  if (_progressInterval) {
    clearInterval(_progressInterval);
    _progressInterval = null;
  }
}

// Вызывается из api.js при log_batch_finished
window._dlFinish = function() {
  _stopProgressPolling();
  // Показываем 100% перед скрытием
  var bar   = document.getElementById('dl-bar-fill');
  var count = document.getElementById('dl-bar-count');
  if (bar)   bar.style.width = '100%';
  if (count && _dlTotal) count.textContent = _dlTotal + ' / ' + _dlTotal;
  setTimeout(_dlStop, 1500);
};

// ── Load / render ─────────────────────────────────────────────────────────────

async function loadMods() {
  try {
    mods = await api('/api/mods') || [];
  } catch (e) {
    console.error(e);
    mods = [];
  }
  renderMods();
}

function renderMods() {
  const container = document.getElementById('mod-list');
  const query     = document.getElementById('si').value.toLowerCase().trim();

  let filtered = mods.filter(m =>
    !query ||
    (m.name || '').toLowerCase().includes(query) ||
    m.id.includes(query)
  );

  if (!filtered.length) {
    container.innerHTML = `<div class="empty">${t(query ? 'mod_list_no_results' : 'mod_list_empty')}</div>`;
    return;
  }

  // Three groups: outdated, installed, queued
  const outdated  = filtered.filter(m => m.status === 'update_available');
  const installed = filtered.filter(m => m.status === 'installed');
  const queued    = filtered.filter(m => m.status === 'not_downloaded');

  let html = '';
  if (outdated.length) {
    html += sectionHeader('outdated', outdated.map(m => m.id));
    html += `<div class="section-rows-outdated${_collapsed.has('outdated') ? ' section-hidden' : ''}">`;
    html += outdated.map(modRow).join('');
    html += `</div>`;
  }
  if (installed.length) {
    html += sectionHeader('installed', installed.map(m => m.id));
    html += `<div class="section-rows-installed${_collapsed.has('installed') ? ' section-hidden' : ''}">`;
    html += installed.map(modRow).join('');
    html += `</div>`;
  }
  if (queued.length) {
    html += sectionHeader('queued', queued.map(m => m.id));
    html += `<div class="section-rows-queued${_collapsed.has('queued') ? ' section-hidden' : ''}">`;
    html += queued.map(modRow).join('');
    html += `</div>`;
  }

  container.innerHTML = html;

  // Event delegation
  container.querySelectorAll('[data-del-id]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      delSingle(btn.getAttribute('data-del-id'));
    });
  });
  container.querySelectorAll('[data-folder-id]').forEach(function(btn) {
    btn.addEventListener('click', function(e) {
      e.stopPropagation();
      openFolder(e, btn.getAttribute('data-folder-id'));
    });
  });
  // Row click — select / shift-select
  container.querySelectorAll('.mr[data-mod-id]').forEach(function(row) {
    row.addEventListener('click', function(e) {
      _handleRowClick(e, row.getAttribute('data-mod-id'));
    });
  });
}

// ── Section collapse ──────────────────────────────────────────────────────────

const _collapsed = new Set();

function sectionHeader(type, ids) {
  const label    = type === 'installed' ? t('section_installed')
                 : type === 'outdated'  ? t('section_outdated')
                 :                        t('section_queued');
  const cls      = type === 'installed' ? 'section-hdr'
                 : type === 'outdated'  ? 'section-hdr section-hdr-upd'
                 :                        'section-hdr section-hdr-q';
  const idsB64   = btoa(JSON.stringify(ids));
  const collapsed = _collapsed.has(type);
  const arrow    = collapsed ? '▶' : '▼';

  return `
    <div class="${cls}${collapsed ? ' collapsed' : ''}" data-section="${type}">
      <span class="section-toggle" onclick="toggleSection('${type}')" title="Collapse / expand">${arrow}</span>
      <span class="section-lbl" onclick="toggleSection('${type}')" style="cursor:pointer">${label}</span>
      <span class="section-cnt">${ids.length}</span>
      <span style="flex:1"></span>
      <button class="section-sel-btn" onclick="sectionSelAll('${idsB64}',true)">☑ ${t('btn_sel_all')}</button>
      <button class="section-sel-btn" onclick="sectionSelAll('${idsB64}',false)">☐ ${t('btn_sel_none')}</button>
    </div>`;
}

function toggleSection(type) {
  if (_collapsed.has(type)) {
    _collapsed.delete(type);
  } else {
    _collapsed.add(type);
  }
  const hdr  = document.querySelector(`.section-hdr[data-section="${type}"]`);
  const wrap = document.querySelector(`.section-rows-${type}`);
  if (!hdr || !wrap) { renderMods(); return; }

  const isNowCollapsed = _collapsed.has(type);
  hdr.classList.toggle('collapsed', isNowCollapsed);
  hdr.querySelector('.section-toggle').textContent = isNowCollapsed ? '▶' : '▼';
  wrap.classList.toggle('section-hidden', isNowCollapsed);
}

function sectionSelAll(idsB64, checked) {
  const ids = new Set(JSON.parse(atob(idsB64)));
  mods.forEach(m => { if (ids.has(m.id)) m.selected = checked; });
  renderMods();
}

// ── Mod row ───────────────────────────────────────────────────────────────────

function modRow(m) {
  const st    = m.status;
  const badge = st === 'update_available' ? 'b-upd'
              : st === 'installed'        ? 'b-ok'
              :                            'b-miss';
  const txt   = st === 'update_available' ? t('status_update')
              : st === 'installed'        ? t('status_installed')
              :                            t('status_pending');

  const wsUrl     = `https://steamcommunity.com/sharedfiles/filedetails/?id=${m.id}`;
  const hasFolder = !!m.local_path;

  return `
    <div class="mr" data-mod-id="${m.id}" style="cursor:pointer">
      <input type="checkbox" ${m.selected ? 'checked' : ''} style="pointer-events:none">
      <div class="mi">
        <div class="mn">${esc(m.name || 'Mod ' + m.id)}</div>
        <div class="mm">ID: ${m.id}${m.size ? ' • ' + m.size : ''}</div>
      </div>
      <span class="badge ${badge}">${txt}</span>
      <button class="ib" title="${t('tip_copy_link')}"
        onclick="copyWsLink(event,'${wsUrl}')"
        oncontextmenu="openWsLink(event,'${wsUrl}')">🔗</button>
      ${hasFolder
        ? `<button class="ib" data-folder-id="${m.id}" title="${t('tip_open_folder')}">📁</button>`
        : `<button class="ib" style="opacity:.25;cursor:default" disabled title="${t('tip_open_folder')}">📁</button>`}
      <button class="ib del" data-del-id="${m.id}" title="${t('tip_delete')}">🗑</button>
    </div>`;
}

// ── Link / folder helpers ─────────────────────────────────────────────────────

function copyWsLink(e, url) {
  e.preventDefault();
  e.stopImmediatePropagation();
  navigator.clipboard.writeText(url).then(() => {
    const btn  = e.currentTarget;
    const orig = btn.textContent;
    btn.textContent = '✓';
    btn.style.color = 'var(--green2)';
    setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 1000);
  });
}

function openWsLink(e, url) {
  e.preventDefault();
  window.open(url, '_blank');
}

async function openFolder(e, modId) {
  e.stopImmediatePropagation();
  await api('/api/mods/open-folder', { id: modId });
}

// ── Selection ─────────────────────────────────────────────────────────────────

let _lastSelectedId = null;   // id последнего кликнутого мода

// Возвращает плоский массив id модов в том порядке, в каком они отрисованы
function _visibleIds() {
  const query = document.getElementById('si').value.toLowerCase().trim();
  const filtered = mods.filter(m =>
    !query || (m.name || '').toLowerCase().includes(query) || m.id.includes(query)
  );
  const outdated  = filtered.filter(m => m.status === 'update_available');
  const installed = filtered.filter(m => m.status === 'installed');
  const queued    = filtered.filter(m => m.status === 'not_downloaded');
  return [...outdated, ...installed, ...queued].map(m => m.id);
}

function _handleRowClick(e, id) {
  // Игнорируем клики по кнопкам .ib и чекбоксу (у них stopPropagation)
  if (e.target.closest('.ib') || e.target.tagName === 'INPUT') return;

  const mod = mods.find(x => x.id === id);
  if (!mod) return;

  if (e.shiftKey && _lastSelectedId && _lastSelectedId !== id) {
    // Диапазонное выделение
    const ids    = _visibleIds();
    const iCur   = ids.indexOf(id);
    const iLast  = ids.indexOf(_lastSelectedId);
    if (iCur !== -1 && iLast !== -1) {
      const lo = Math.min(iCur, iLast);
      const hi = Math.max(iCur, iLast);
      const targetState = !mod.selected;   // состояние к которому тянем диапазон
      ids.slice(lo, hi + 1).forEach(rid => {
        const m = mods.find(x => x.id === rid);
        if (m) m.selected = targetState;
      });
      renderMods();
      return;
    }
  }

  mod.selected = !mod.selected;
  _lastSelectedId = id;

  // Обновляем только чекбокс без полного ре-рендера
  const row = document.querySelector(`.mr[data-mod-id="${id}"]`);
  if (row) {
    const cb = row.querySelector('input[type=checkbox]');
    if (cb) cb.checked = mod.selected;
    row.style.background = mod.selected ? 'var(--bg4)' : '';
  }
}

function toggleSelect(id, checked) {
  const m = mods.find(x => x.id === id);
  if (m) m.selected = checked;
}

function selAll(v) { mods.forEach(m => m.selected = v); renderMods(); }

// ── Delete confirm modal ──────────────────────────────────────────────────────

let _delPendingIds = [];
let _delIsBulk     = false;

function _openDelModal(ids, isBulk) {
  _delPendingIds = ids;
  _delIsBulk     = isBulk;

  var mod = mods.find(function(m) { return m.id === ids[0]; });

  document.getElementById('del-title').textContent = t('confirm_delete_title');

  var msgEl = document.getElementById('del-msg');
  if (!isBulk && mod) {
    msgEl.innerHTML = t('confirm_delete_one_named') +
      ' <span class="del-name">' + esc(mod.name || mod.id) + '</span>?';
  } else {
    msgEl.innerHTML = t('confirm_delete_many_q') +
      '<span class="del-count">' + ids.length + '</span>';
  }

  document.getElementById('del-cancel-btn').textContent  = t('modal_add_cancel');
  document.getElementById('del-confirm-btn').textContent = t('tip_delete');

  ids.forEach(function(id) {
    var btn = document.querySelector('[data-del-id="' + id + '"]');
    if (btn) {
      var row = btn.closest('.mr');
      if (row) row.classList.add('del-pending');
    }
  });

  document.getElementById('m-del').classList.add('open');
}

function _closeDelModal() {
  document.getElementById('m-del').classList.remove('open');
  document.querySelectorAll('.mr.del-pending').forEach(function(r) {
    r.classList.remove('del-pending');
  });
  _delPendingIds = [];
}

function _initDelModal() {
  var cancelBtn  = document.getElementById('del-cancel-btn');
  var confirmBtn = document.getElementById('del-confirm-btn');
  var overlay    = document.getElementById('m-del');
  if (!cancelBtn || !confirmBtn || !overlay) return;
  cancelBtn.onclick  = _closeDelModal;
  confirmBtn.onclick = _confirmDelete;
  overlay.addEventListener('click', function(e) {
    if (e.target === overlay) _closeDelModal();
  });
}

async function _confirmDelete() {
  var ids  = _delPendingIds.slice();
  var bulk = _delIsBulk;
  _closeDelModal();
  if (bulk) {
    await api('/api/mods/remove-bulk', { ids: ids });
  } else {
    await api('/api/mods/remove', { id: ids[0] });
  }
  loadMods();
}

// ── Delete ────────────────────────────────────────────────────────────────────

function delSingle(id) {
  if (!document.getElementById('m-del')) {
    if (!confirm(t('confirm_delete_one'))) return;
    api('/api/mods/remove', { id: id }).then(loadMods);
    return;
  }
  _openDelModal([id], false);
}

function delSelected() {
  var ids = mods.filter(function(m) { return m.selected; }).map(function(m) { return m.id; });
  if (!ids.length) return;
  if (!document.getElementById('m-del')) {
    if (!confirm(t('confirm_delete_many', ids.length))) return;
    api('/api/mods/remove-bulk', { ids: ids }).then(loadMods);
    return;
  }
  _openDelModal(ids, ids.length > 1);
}

// ── Download ──────────────────────────────────────────────────────────────────

async function downloadSelected() {
  const ids = mods.filter(m => m.selected).map(m => m.id);
  if (!ids.length) return alert(t('alert_select_mods'));

  _dlStart(ids);
  await api('/api/mods/download', { ids });
}

function stopCurrentDownload() {
  api('/api/mods/stop-download', {}).catch(() => {});
  setStatus(t('st_stopping'), true, 'var(--orange2)');
  // Не скрываем бар — текущий батч ещё качается и будет перенесён.
  // Бар исчезнет сам когда придёт log_batch_finished.
  // Только скрываем кнопку Stop чтобы не нажали дважды.
  var stopBtn = document.querySelector('#dl-bar-wrap button');
  if (stopBtn) stopBtn.style.display = 'none';
}

// ── Add mod ───────────────────────────────────────────────────────────────────

function openAddModal() {
  document.getElementById('add-ta').value = '';
  document.getElementById('add-prev').textContent = '';
  openM('m-add');
}

async function addMods() {
  const text = document.getElementById('add-ta').value.trim();
  if (!text) return;
  closeM('m-add');
  await api('/api/mods/add', { text });
  pollUntilDone(loadMods);
}

// ── Check updates ─────────────────────────────────────────────────────────────

async function checkUpdates() {
  const ids = mods.filter(m => m.selected).map(m => m.id);
  if (!ids.length) return alert(t('alert_select_to_check'));

  setStatus(t('check_scope', ids.length), true);
  await api('/api/mods/check-updates', { ids });
  pollUntilDone(() => {
    loadMods();
    setStatus(t('st_check_done'));
  });
}

// ── Update outdated ───────────────────────────────────────────────────────────

async function updateOutdated() {
  const selected = mods.filter(m => m.selected);
  if (!selected.length) return alert(t('alert_select_mods'));

  const outdated = selected.filter(m => m.status === 'update_available');
  if (!outdated.length) return alert(t('alert_no_updates_sel'));
  if (!confirm(t('confirm_update_many', outdated.length))) return;

  const ids = outdated.map(m => m.id);
  setStatus(t('st_updating'), true);
  await api('/api/mods/update-outdated', { ids });
  pollUntilDone(() => {
    loadMods();
    setStatus(t('st_update_done'));
  });
}

// ── Export / Import ───────────────────────────────────────────────────────────

async function exportList() {
  const ids = mods.filter(m => m.selected).map(m => m.id);
  await api('/api/mods/export-list', { ids });
}

async function importList() {
  await api('/api/mods/import-list', {});
  pollUntilDone(loadMods);
}

// ── Workshop browser ──────────────────────────────────────────────────────────

async function openWorkshop() {
  await api('/api/open-workshop', {});
  _startWorkshopPoll();
}

let _wsPollTimer = null;
let _wsPollCount = null;

function _startWorkshopPoll() {
  _wsPollCount = mods.length;
  if (_wsPollTimer) return;
  _wsPollTimer = setInterval(async () => {
    try {
      const s = await api('/api/status');
      if (s.mod_count !== _wsPollCount) {
        _wsPollCount = s.mod_count;
        await loadMods();
      }
    } catch { /* ignore */ }
  }, 3000);
}

function _stopWorkshopPoll() {
  if (_wsPollTimer) { clearInterval(_wsPollTimer); _wsPollTimer = null; }
}

window._stopWorkshopPoll = _stopWorkshopPoll;

// Not used in Lite
function toggleTD() {}

// Global exports
window.loadMods   = loadMods;
window.renderMods = renderMods;

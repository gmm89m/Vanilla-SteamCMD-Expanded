// trash.js — Lite Edition

let trashItems = [];

async function loadTrash() {
  trashItems = await api('/api/trash');
  renderTrash();
}

function renderTrash() {
  const list  = document.getElementById('trash-list');
  const query = (document.getElementById('trash-search')?.value || '').toLowerCase().trim();

  const filtered = trashItems.filter(item =>
    !query ||
    (item.name || '').toLowerCase().includes(query) ||
    item.id.includes(query)
  );

  if (!trashItems.length) {
    list.innerHTML = `<div class="empty">${t('trash_empty')}</div>`;
    return;
  }
  if (!filtered.length) {
    list.innerHTML = `<div class="empty">${t('mod_list_no_results')}</div>`;
    return;
  }

  list.innerHTML = filtered.map(item => `
    <div class="tr">
      <input type="checkbox" id="tcb-${esc(item.id)}">
      <div style="flex:1">
        <div style="font-weight:600">${esc(item.name || item.id)}</div>
        <div style="font-size:11px;color:var(--text3)">
          ID: ${esc(item.id)} &nbsp;•&nbsp; ${(item.deleted_at || '').slice(0, 10)}
        </div>
      </div>
      <button class="btn btn-p btn-sm" onclick="restoreTrash('${esc(item.id)}')">${t('btn_restore')}</button>
      <button class="btn btn-r btn-sm" onclick="deleteTrash('${esc(item.id)}')">${t('btn_delete_perm')}</button>
    </div>`).join('');
}

function tSelAll(v) {
  document.querySelectorAll('#trash-list input[type=checkbox]').forEach(cb => cb.checked = v);
}

async function restoreTrash(id) {
  await api('/api/trash/restore', { id });
  trashItems = trashItems.filter(t => t.id !== id);
  renderTrash();
  await loadMods();
}

async function deleteTrash(id) {
  await api('/api/trash/delete', { id });
  trashItems = trashItems.filter(t => t.id !== id);
  renderTrash();
}

async function tBulk(action) {
  const ids = [...document.querySelectorAll('#trash-list input[type=checkbox]:checked')]
    .map(cb => cb.id.replace('tcb-', ''));
  if (!ids.length) return;
  await api('/api/trash/bulk', { ids, action });
  await loadTrash();
  if (action === 'restore') await loadMods();
}

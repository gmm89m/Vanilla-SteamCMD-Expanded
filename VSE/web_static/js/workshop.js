function wsInit() { /* ничего не нужно */ }

async function wsAddCurrent() {
  let url = document.getElementById('ws-url').value.trim();
  if (!url) return wsToast('❌ Вставьте ссылку', true);

  const r = await api('/api/add-from-url', { url });
  if (r.ok) {
    const msg = r.added_collections 
      ? `📚 Добавлена коллекция (${r.added_collections} модов)` 
      : `✅ Добавлен мод`;
    wsToast(msg);
    pollUntilDone(loadMods);
    document.getElementById('ws-url').value = '';
  } else {
    wsToast('❌ Не удалось добавить', true);
  }
}

function wsOpenBrowser() {
  let url = document.getElementById('ws-url').value.trim();
  if (!url) url = 'https://steamcommunity.com/app/294100/workshop/';
  window.open(url, '_blank');
}

function wsToast(msg, isError = false) {
  const t = document.getElementById('ws-toast');
  t.textContent = msg;
  t.style.background = isError ? 'var(--red)' : 'var(--green)';
  t.style.display = 'block';
  setTimeout(() => t.style.display = 'none', 3200);
}

window.wsInit = wsInit;
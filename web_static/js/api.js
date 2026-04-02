// api.js — Low-level fetch wrapper + SSE log stream

// ── HTTP helper ───────────────────────────────────────────────────────────────

async function api(url, body) {
  const opts = body !== undefined
    ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
    : {};
  const r = await fetch(url, opts);
  return r.json();
}

// ── SSE log stream ────────────────────────────────────────────────────────────

const logBox = document.getElementById('log-box');

// Ключи SSE-сигналов, которые требуют обновления списка модов
const _REFRESH_TRIGGERS = new Set([
  'log_batch_finished',
  'log_detect_done',
  'log_added_mods',
  'log_added_from_collection',
  'log_import_done',
  'log_moved_summary',
  'log_update_complete',
  'log_updates_found',
  'log_all_up_to_date',
]);

// Временный статус в сайдбаре — показывает сообщение и через 3 сек возвращает Ready
let _statusTimer = null;
function _flashStatus(txt, color = 'var(--green2)') {
  setStatus(txt, false, color);
  if (_statusTimer) clearTimeout(_statusTimer);
  _statusTimer = setTimeout(() => {
    setStatus(t('status_ready'));
    _statusTimer = null;
  }, 3000);
}

// Карта: ключ SSE → функция получения текста статуса
const _STATUS_MSGS = {
  log_batch_finished:        () => t('st_update_done'),
  log_detect_done:           (p) => tLog('log_detect_done|' + (p||'')),
  log_added_mods:            (n) => tLog('log_added_mods|' + (n||'')),
  log_added_from_collection: (n) => tLog('log_added_from_collection|' + (n||'')),
  log_import_done:           (n) => tLog('log_import_done|' + (n||'')),
  log_update_complete:       () => t('st_update_done'),
  log_updates_found:         (n) => tLog('log_updates_found|' + (n||'')),
  log_all_up_to_date:        () => tLog('log_all_up_to_date'),
};

const _evtSrc = new EventSource('/api/log-stream');
_evtSrc.onmessage = e => {
  if (!e.data || e.data.includes('ping')) return;

  const lines = e.data.replace(/\\n/g, '\n').split('\n').filter(Boolean);
  lines.forEach(raw => {
    if (!raw.trim()) return;

    const parts = raw.trim().split('|');
    const key   = parts[0];
    const param = parts[1] || '';

    // ── Auto-refresh UI ───────────────────────────────────────────────────────
    if (_REFRESH_TRIGGERS.has(key)) {
      if (typeof loadMods === 'function') loadMods();
    }

    // ── Flash status bar ──────────────────────────────────────────────────────
    if (_STATUS_MSGS[key] && !_pollTimer) {
      const msg = _STATUS_MSGS[key](param);
      if (msg) _flashStatus(msg);
    }

    // ── Batch finished — завершаем прогресс-бар ───────────────────────────────
    if (key === 'log_batch_finished') {
      if (typeof window._dlFinish === 'function') window._dlFinish();
    }

    // ── SteamCMD стал доступен — обновляем баннер ─────────────────────────────
    if (key === 'log_steamcmd_ready') {
      setTimeout(() => {
        if (typeof checkWarnings  === 'function') checkWarnings();
        if (typeof loadSettings   === 'function') loadSettings();
      }, 400);
    }

    // ── Отображаем строку в логе ──────────────────────────────────────────────
    const display = (typeof tLog === 'function') ? tLog(raw) : raw;

    const el = document.createElement('div');
    el.textContent = display;
    el.style.cssText = 'cursor:pointer;padding:2px 4px;border-radius:3px;transition:background 0.15s';
    el.title = 'ЛКМ — копировать строку\nПКМ — копировать весь лог';

    el.onclick = () => {
      navigator.clipboard.writeText(display)
        .then(() => {
          el.style.background = 'rgba(76,175,80,0.3)';
          setTimeout(() => el.style.background = '', 800);
        });
    };

    el.oncontextmenu = (e) => {
      e.preventDefault();
      const fullLog = Array.from(logBox.children)
        .map(child => child.textContent)
        .join('\n');
      navigator.clipboard.writeText(fullLog)
        .then(() => {
          el.style.background = 'rgba(255,193,7,0.3)';
          setTimeout(() => el.style.background = '', 800);
        });
    };

    logBox.appendChild(el);
  });

  logBox.scrollTop = logBox.scrollHeight;
};

// ── Busy / status polling ─────────────────────────────────────────────────────

let _pollTimer = null;

function pollUntilDone(onDone) {
  if (_pollTimer) return;
  setStatus(t('st_working'), true, 'var(--orange2)');
  _pollTimer = setInterval(async () => {
    try {
      const s = await api('/api/status');
      if (!s.busy) {
        clearInterval(_pollTimer);
        _pollTimer = null;
        setStatus(t('status_ready'));
        if (onDone) onDone();
      }
    } catch {
      clearInterval(_pollTimer);
      _pollTimer = null;
      setStatus(t('status_ready'));
    }
  }, 600);
}

// ── Status bar ────────────────────────────────────────────────────────────────

function setStatus(txt, busy = false, color = 'var(--green2)') {
  document.getElementById('status-text').textContent = txt;
  document.getElementById('status-dot').style.background = color;
  document.getElementById('status-dot').style.display    = busy ? 'none'  : 'block';
  document.getElementById('spinner').style.display       = busy ? 'block' : 'none';
}

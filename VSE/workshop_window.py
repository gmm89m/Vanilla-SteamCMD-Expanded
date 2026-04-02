"""
RimMod Workshop Browser — максимально простая версия для диагностики
"""

import os
import sys

if getattr(sys, "frozen", False):
    _internal = os.path.join(os.path.dirname(sys.executable), "_internal")
    os.environ["PATH"] = _internal + os.sep + os.environ.get("PATH", "")
    if hasattr(os, "add_dll_directory"):
        os.add_dll_directory(_internal)

try:
    import webview
except ImportError:
    print("webview is not installed")
    sys.exit(1)

WORKSHOP_BASE = "https://steamcommunity.com/app/{app_id}/workshop/"

def _get_workshop_url() -> str:
    try:
        from core.config import cfg
        app_id = cfg.active.get("app_id", "294100") if cfg.active else "294100"
    except Exception:
        app_id = "294100"
    return WORKSHOP_BASE.format(app_id=app_id)


BAR_JS = r"""
(function(){
  if (document.getElementById('_rm_bar')) return;

  var bar = document.createElement('div');
  bar.id = '_rm_bar';
  bar.style.cssText = 'position:fixed;top:0;left:0;right:0;z-index:2147483647;display:flex;align-items:center;gap:6px;padding:7px 10px;background:rgba(13,13,20,0.97);backdrop-filter:blur(8px);border-bottom:1px solid #2a2a40;font-family:Segoe UI,system-ui,sans-serif;';

  function btn(html, title, css) {
    var b = document.createElement('button');
    b.innerHTML = html;
    b.title = title;
    b.style.cssText = 'padding:5px 10px;border-radius:5px;cursor:pointer;font-size:13px;border:1px solid #2a2a40;transition:all .25s;' + (css || 'background:#1e1e2e;color:#ccc;');
    return b;
  }

  var btnBack = btn('←','Back');
  var btnFwd = btn('→','Forward');
  var btnReload = btn('↻','Reload');
  btnBack.onclick = () => history.back();
  btnFwd.onclick = () => history.forward();
  btnReload.onclick = () => location.reload();

  var urlInput = document.createElement('input');
  urlInput.type = 'text';
  urlInput.value = location.href;
  urlInput.style.cssText = 'flex:1;background:#1a1a2a;border:1px solid #2a2a40;color:#bbb;border-radius:5px;padding:5px 10px;font-size:12px;outline:none;';
  urlInput.addEventListener('keydown', e => { if(e.key==='Enter' && urlInput.value.trim()) location.href = urlInput.value.trim(); });
  urlInput.addEventListener('focus', () => urlInput.select());

  var btnAdd = btn('➕ Add mod', 'Add this mod', 'background:#0d2a50;color:#7ab4ff;border-color:#1a4a8a;white-space:nowrap;font-size:12px;');
  var btnCol = btn('📚 Add collection', 'Add this collection', 'background:#0d2a1a;color:#7abf7a;border-color:#1a5a2a;white-space:nowrap;font-size:12px;');
  var btnForce = btn('⚠️', 'Force add as mod', 'background:#2a0d0d;color:#e05555;border-color:#5a1a1a;');

  function isCollection() {
    if (document.querySelector('.collectionChildren') || document.querySelector('.subscribeCollection')) return true;
    var u = location.href.toLowerCase();
    return u.includes('/collections/') || u.includes('type=collections') || u.includes('workshop/browse');
  }

  function updateBar() {
    urlInput.value = location.href;
    var col = isCollection();
    btnAdd.style.display = col ? 'none' : '';
    btnCol.style.display = col ? '' : 'none';
  }

  // Анимация загрузки (градиентная обводка)
  function setLoading(btnEl, isLoading) {
    if (isLoading) {
      btnEl.style.transition = 'all 0.2s';
      btnEl.style.borderColor = 'transparent';
      btnEl.style.background = 'linear-gradient(90deg, #4ade80, #22d3ee, #4ade80)';
      btnEl.style.backgroundSize = '200% 100%';
      btnEl.style.animation = 'loadingGradient 1.5s linear infinite';
      btnEl.style.opacity = '0.85';
    } else {
      btnEl.style.animation = '';
      btnEl.style.background = '';
      btnEl.style.opacity = '1';
    }
  }

  function highlightButton(btnEl, success) {
    // Снимаем анимацию загрузки
    setLoading(btnEl, false);

    btnEl.style.transition = 'all 0.3s';
    if (success) {
      btnEl.style.borderColor = '#4ade80';
      btnEl.style.boxShadow = '0 0 0 4px rgba(74,222,128,0.5)';
      btnEl.style.transform = 'scale(1.12)';
    } else {
      btnEl.style.borderColor = '#f87171';
      btnEl.style.boxShadow = '0 0 0 4px rgba(248,113,113,0.5)';
      btnEl.style.transform = 'scale(1.08)';
      btnEl.animate([{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(-6px)'},{transform:'translateX(6px)'},{transform:'translateX(0)'}], {duration:500});
    }
    setTimeout(() => {
      btnEl.style.borderColor = '';
      btnEl.style.boxShadow = '';
      btnEl.style.transform = 'scale(1)';
    }, 2600);
  }

  function showToast(msg, isError = false) {
    var t = document.createElement('div');
    t.style.cssText = `position:fixed;bottom:40px;left:50%;transform:translateX(-50%);padding:12px 24px;border-radius:6px;font-size:14px;z-index:2147483647;color:#fff;background:${isError?'#c42b2b':'#15803d'};box-shadow:0 8px 20px rgba(0,0,0,0.6);`;
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => { t.style.opacity='0'; setTimeout(()=>t.remove(),400); }, 2800);
  }

  function sendAdd(url, isCol) {
    const activeBtn = isCol ? btnCol : btnAdd;

    if (window.pywebview && window.pywebview.api) {
      setLoading(activeBtn, true);   // ← включаем индикатор загрузки

      window.pywebview.api.addCurrentPage(url, isCol)
        .then(r => {
          const added = isCol ? (r.added_collections || 0) : (r.added_mods || 0);
          const success = r.ok && added > 0;

          highlightButton(activeBtn, success);

          if (success) {
            showToast(isCol ? `✅ Добавлено ${added} мод(ов) из коллекции` : '✅ Мод успешно добавлен');
          } else if (r.ok) {
            showToast('⚠️ Уже в списке', false);
          } else {
            showToast('❌ Не удалось добавить', true);
          }
        })
        .catch(err => {
          console.error('Error:', err);
          highlightButton(activeBtn, false);
          showToast('❌ Ошибка связи', true);
        });
    } else {
      highlightButton(activeBtn, false);
      showToast('❌ pywebview недоступен', true);
    }
  }

  btnAdd.onclick = () => sendAdd(location.href, false);
  btnCol.onclick = () => sendAdd(location.href, true);
  btnForce.onclick = () => {
    var u = location.href.replace('/workshop/filedetails/', '/sharedfiles/filedetails/');
    sendAdd(u, false);
  };

  bar.append(btnBack, btnFwd, btnReload, urlInput, btnAdd, btnCol, btnForce);
  document.body.appendChild(bar);
  document.body.style.paddingTop = '46px';

  updateBar();

  var lastUrl = location.href;
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      updateBar();
    }
  }, 600);

  // Добавляем CSS-анимацию для градиента
  var style = document.createElement('style');
  style.textContent = `
    @keyframes loadingGradient {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
  `;
  document.head.appendChild(style);

})();
"""


class Api:
    def addCurrentPage(self, url: str, is_collection: bool = False):
        import requests
        from core.state import log
        try:
            resp = requests.post(
                "http://127.0.0.1:7842/api/add-from-url",
                json={"url": url, "is_collection": is_collection},
                timeout=15
            )
            data = resp.json() if resp.status_code == 200 else {"ok": False}
            print("Backend returned:", data)   # вывод в консоль Python для диагностики
            return data
        except Exception as e:
            log(f"log_warning|Workshop add error: {e}\n")
            print("Exception in addCurrentPage:", e)
            return {"ok": False}


_url = _get_workshop_url()

w = webview.create_window(
    title="SCMDMM - Steam Workshop",
    url=_url,
    width=1280,
    height=860,
    resizable=True,
    text_select=True,
    js_api=Api(),
)

def _inject():
    try:
        w.evaluate_js(BAR_JS)
    except Exception as e:
        print("Inject error:", e)

def on_loaded():
    _inject()

w.events.loaded += on_loaded
webview.start()
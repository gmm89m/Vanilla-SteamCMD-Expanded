"""
Vanilla SteamCMD Expanded  -  Lite Edition
--------------------------------------
pip install flask requests pywebview
python web_app.py
"""

import os, sys, threading, time, webbrowser
from flask import Flask, send_from_directory

from routes.system        import bp as bp_system
from routes.config_routes import bp as bp_config
from routes.mods          import bp as bp_mods
from routes.importexport  import bp as bp_ie
from routes.trash         import bp as bp_trash
from routes.workshop      import bp as bp_workshop
from routes.setup         import bp as bp_setup
from routes.profiles      import bp as bp_profiles

from core import dialogs as _dialogs

try:
    import webview
    WEBVIEW = True
except ImportError:
    WEBVIEW = False

PORT = 7842

def _base_dir() -> str:
    if getattr(sys, "frozen", False):
        return os.path.dirname(sys.executable)
    return os.path.dirname(os.path.abspath(__file__))

def _find_dir(name: str) -> str:
    """
    Find a data directory in order:
    1. Next to the .exe / web_app.py  (after build.bat moves it out of _internal)
    2. Inside sys._MEIPASS (_internal) — fallback during development or if move skipped
    3. Next to web_app.py — source mode
    """
    base = _base_dir()
    candidate = os.path.join(base, name)
    if os.path.isdir(candidate):
        return candidate
    if getattr(sys, "frozen", False) and hasattr(sys, "_MEIPASS"):
        meipass_candidate = os.path.join(sys._MEIPASS, name)
        if os.path.isdir(meipass_candidate):
            return meipass_candidate
    return candidate  # return anyway, Flask will 404 gracefully

BASE_DIR   = _base_dir()
WEB_STATIC = _find_dir("web_static")
LANG_DIR   = _find_dir("lang")

app = Flask(__name__, static_folder=WEB_STATIC, template_folder=WEB_STATIC)

for bp in (bp_system, bp_config, bp_mods, bp_ie, bp_trash, bp_workshop, bp_setup, bp_profiles):
    app.register_blueprint(bp)

@app.route("/")
def index():
    return send_from_directory(WEB_STATIC, "index.html")

@app.route("/lang/<path:filename>")
def lang_file(filename):
    return send_from_directory(LANG_DIR, filename)

@app.route("/<path:p>")
def static_file(p):
    return send_from_directory(WEB_STATIC, p)

def _start_flask():
    import logging
    logging.getLogger("werkzeug").setLevel(logging.ERROR)
    app.run(host="127.0.0.1", port=PORT, threaded=True, use_reloader=False)

if __name__ == "__main__":
    threading.Thread(target=_start_flask, daemon=True).start()
    time.sleep(0.9)
    url = f"http://127.0.0.1:{PORT}"
    if WEBVIEW:
        win = webview.create_window(
            "Vanilla SteamCMD Expanded", url,
            width=1200, height=780, resizable=True,
        )
        _dialogs.set_window(win)
        webview.start()
    else:
        print(f"\n  Open: {url}\n")
        webbrowser.open(url)
        try:
            while True: time.sleep(1)
        except KeyboardInterrupt:
            pass

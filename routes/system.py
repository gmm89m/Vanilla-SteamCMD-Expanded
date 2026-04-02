"""
System routes:
  GET  /api/log-stream   — SSE stream of log lines
  GET  /api/status       — busy flag + mod count
  GET  /api/browse-folder
  GET  /api/browse-file
"""

import time
from flask import Blueprint, Response, jsonify, request

from core.config   import cfg
from pathlib import Path
from core.state    import get_log_lines, get_log_lock, is_busy, get_download_progress
from core.dialogs  import pick_folder, pick_file

bp = Blueprint("system", __name__)


@bp.route("/api/log-stream")
def log_stream():
    def generate():
        sent = 0
        while True:
            with get_log_lock():
                chunk = get_log_lines()[sent:]
                sent += len(chunk)
            if chunk:
                text = "".join(chunk).replace("\n", "\\n")
                yield f"data: {text}\n\n"
            else:
                yield ": ping\n\n"
            time.sleep(0.25)

    return Response(
        generate(),
        mimetype="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@bp.route("/api/status")
def status():
    p = cfg.active
    mod_count = len(p["mods"]) if p else 0
    return jsonify({"busy": is_busy(), "mod_count": mod_count})


@bp.route("/api/browse-folder")
def browse_folder():
    title = request.args.get("title", "Select folder")
    return jsonify({"path": pick_folder(title)})


@bp.route("/api/browse-file")
def browse_file():
    title = request.args.get("title", "Select file")
    return jsonify({"path": pick_file(
        title,
        filetypes=["Executables (*.exe)", "All files (*.*)"],
    )})

@bp.route("/api/open-workshop", methods=["POST"])
def open_workshop():
    try:
        import core.workshop_browser
        core.workshop_browser.open_workshop_browser()
        return jsonify({"ok": True})
    except Exception as e:
        return jsonify({"ok": False})


@bp.route("/api/download-progress")
def download_progress():
    total, downloaded = get_download_progress()

    app_id      = cfg.active.get("app_id", "294100") if cfg.active else "294100"
    steamcmd_exe = cfg.get("steamcmd_path", "")
    temp_folder  = Path(steamcmd_exe).parent / "steamapps" / "workshop" / "content" / app_id                    if steamcmd_exe else None

    try:
        temp_count = len([p for p in temp_folder.iterdir() if p.is_dir()])                      if temp_folder and temp_folder.exists() else 0
    except Exception:
        temp_count = 0

    current = min(downloaded + temp_count, total) if total else 0

    return jsonify({
        "total":        total,
        "completed":    downloaded,
        "temp_folders": temp_count,
        "current":      current,
    })

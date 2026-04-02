"""
First-run / new-profile wizard routes:
  GET  /api/setup/status
  POST /api/setup/complete
  GET  /api/setup/steamcmd-ready
"""

import sys
import zipfile
from pathlib import Path

from flask import Blueprint, jsonify, request
from core.config import cfg
from core.state  import log, run_bg, is_busy

bp = Blueprint("setup", __name__)

STEAMCMD_URL = "https://steamcdn-a.akamaihd.net/client/installer/steamcmd.zip"


def _base_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).parent
    return Path(__file__).parent.parent


def _default_dirs() -> dict:
    base = _base_dir()
    return {
        "steamcmd_dir": str(base / "steamcmd"),
    }


@bp.route("/api/setup/status", methods=["GET"])
def setup_status():
    return jsonify({
        "first_run":    not cfg.get("steamcmd_path", ""),
        "has_profiles": len(cfg.profiles) > 0,
        "default_dirs": _default_dirs(),
        "current": {
            "steamcmd_path": cfg.get("steamcmd_path", ""),
            "language":      cfg.get("language", "en"),
        },
    })


@bp.route("/api/setup/complete", methods=["POST"])
def setup_complete():
    d = request.json or {}

    # Global settings
    for key in ("language", "require_backup"):
        if key in d:
            cfg.data[key] = d[key]
    if d.get("steamcmd_path"):
        cfg.data["steamcmd_path"] = d["steamcmd_path"]
    cfg.save()

    # Profile update
    pid      = d.get("profile_id", "").strip()
    pname    = d.get("profile_name", "").strip()
    app_id   = d.get("app_id", "").strip()
    mods_dir = d.get("mods_dir", "")

    p = cfg.profile(pid) if pid else cfg.active
    if p:
        if pname:  p["name"]     = pname
        if app_id: p["app_id"]   = app_id
        p["mods_dir"] = mods_dir
        p.save()

    # SteamCMD download + self-update
    if d.get("download_steamcmd"):
        target = d.get("steamcmd_dir", "") or str(_base_dir() / "steamcmd")
        run_bg(lambda: _download_steamcmd(target))
        return jsonify({"ok": True, "downloading": True})

    return jsonify({"ok": True, "downloading": False})


@bp.route("/api/setup/steamcmd-ready", methods=["GET"])
def steamcmd_ready():
    path = cfg.get("steamcmd_path", "")
    return jsonify({
        "ready": bool(path and Path(path).exists()),
        "busy":  is_busy(),
        "path":  path,
    })


@bp.route("/api/setup/reinstall-steamcmd", methods=["POST"])
def reinstall_steamcmd():
    """Re-download and self-update SteamCMD to the same directory it's already in."""
    current = cfg.get("steamcmd_path", "")
    if current:
        target_dir = str(Path(current).parent)
    else:
        target_dir = str(_base_dir() / "steamcmd")
    run_bg(lambda: _download_steamcmd(target_dir))
    return jsonify({"ok": True})


def _download_steamcmd(target_dir: str) -> None:
    import requests as req
    import subprocess

    dest = Path(target_dir)
    try:
        dest.mkdir(parents=True, exist_ok=True)
    except Exception as e:
        log("log_setup_mkdir_err|" + str(e) + "\n")
        return

    zip_path = dest / "steamcmd.zip"
    log("log_setup_downloading\n")

    try:
        r = req.get(STEAMCMD_URL, stream=True, timeout=60)
        r.raise_for_status()
        total = int(r.headers.get("content-length", 0))
        done  = 0
        with open(zip_path, "wb") as f:
            for chunk in r.iter_content(65536):
                f.write(chunk)
                done += len(chunk)
                if total:
                    log("log_setup_progress|" + str(int(done * 100 / total)) + "\n")
    except Exception as e:
        log("log_setup_download_err|" + str(e) + "\n")
        return

    log("log_setup_extracting\n")
    try:
        with zipfile.ZipFile(zip_path, "r") as zf:
            zf.extractall(dest)
        zip_path.unlink(missing_ok=True)
    except Exception as e:
        log("log_setup_extract_err|" + str(e) + "\n")
        return

    exe = dest / "steamcmd.exe"
    if not exe.exists():
        log("log_setup_steamcmd_missing\n")
        return

    # === SELF-UPDATE STEAMCMD ===
    log("log_setup_steamcmd_updating\n")
    try:
        flags = subprocess.CREATE_NO_WINDOW if hasattr(subprocess, "CREATE_NO_WINDOW") else 0
        proc = subprocess.Popen(
            [str(exe), "+quit"],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            creationflags=flags
        )
        proc.wait(timeout=40)
        log("log_setup_steamcmd_updated\n")
    except Exception as e:
        log("log_setup_steamcmd_update_failed|" + str(e) + "\n")

    cfg.data["steamcmd_path"] = str(exe)
    cfg.save()
    log("log_setup_steamcmd_done|" + str(exe) + "\n")

    # ← НОВОЕ: специальный сигнал для фронтенда, чтобы баннер обновился сразу
    log("log_steamcmd_ready\n")
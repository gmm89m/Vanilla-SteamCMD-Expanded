"""
Config routes:
  GET  /api/config        — return current settings (global + active profile)
  POST /api/config        — update settings
  GET  /api/lang-files    — list available locale files from lang/
"""

import sys
from pathlib import Path
from flask import Blueprint, jsonify, request
from core.config import cfg

bp = Blueprint("config_routes", __name__)

GLOBAL_KEYS = ("steamcmd_path", "require_backup", "language", "max_package_size")
PROFILE_KEYS = ("mods_dir",)


def _lang_dir() -> Path:
    if getattr(sys, "frozen", False):
        base = Path(sys.executable).parent
    else:
        base = Path(__file__).parent.parent
    return base / "lang"


@bp.route("/api/config", methods=["GET"])
def config_get():
    result = {k: cfg.data.get(k, "") for k in GLOBAL_KEYS}
    p = cfg.active
    if p:
        for k in ("mods_dir",):
            result[k] = p.get(k, "")
    else:
        result["mods_dir"] = ""

    # Значение по умолчанию, если ещё не задано
    if "max_package_size" not in result or not result["max_package_size"]:
        result["max_package_size"] = 15

    return jsonify(result)


@bp.route("/api/config", methods=["POST"])
def config_set():
    d = request.json or {}
    changed_global  = False
    changed_profile = False

    for k in GLOBAL_KEYS:
        if k in d:
            cfg.data[k] = d[k]
            changed_global = True

    p = cfg.active
    if p:
        for k in PROFILE_KEYS:
            if k in d:
                p[k] = d[k]
                changed_profile = True

    if changed_global:
        cfg.save()
    if changed_profile and p:
        p.save()

    return jsonify({"ok": True})


@bp.route("/api/lang-files", methods=["GET"])
def lang_files():
    lang_dir = _lang_dir()
    result = []
    if lang_dir.exists():
        for f in sorted(lang_dir.glob("*.js")):
            stem  = f.stem
            label = stem.split("-")[0].upper()[:4]
            result.append({"file": f.name, "label": label})
    return jsonify(result)

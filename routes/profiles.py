"""
Profile routes:
  GET  /api/profiles              — list all profiles + active id
  POST /api/profiles              — create new profile
  POST /api/profiles/activate     — switch active profile
  POST /api/profiles/update       — rename / change app_id / mods_dir
  POST /api/profiles/delete       — delete profile
  GET  /api/profiles/app-info     — lookup Steam app name by id
"""

import requests as req
from pathlib import Path
from flask import Blueprint, jsonify, request
from core.config  import cfg
from core.state   import log
from core.dialogs import pick_file
from core.utils   import fmt_size

bp = Blueprint("profiles", __name__)

STEAM_APP_API = "https://store.steampowered.com/api/appdetails?appids={}&filters=basic"


@bp.route("/api/profiles", methods=["GET"])
def profiles_list():
    return jsonify({
        "active":   cfg.data.get("active_profile", ""),
        "profiles": [p.to_dict() for p in cfg.profiles],
    })


@bp.route("/api/profiles", methods=["POST"])
def profiles_create():
    d       = request.json or {}
    name    = d.get("name", "").strip()
    app_id  = d.get("app_id", "").strip()
    mods_dir= d.get("mods_dir", "").strip()
    if not name or not app_id:
        return jsonify({"ok": False, "reason": "name and app_id required"})
    p = cfg.create_profile(name, app_id, mods_dir)
    return jsonify({"ok": True, "profile": p.to_dict()})


@bp.route("/api/profiles/activate", methods=["POST"])
def profiles_activate():
    pid = (request.json or {}).get("id", "")
    ok  = cfg.set_active(pid)
    return jsonify({"ok": ok})


@bp.route("/api/profiles/update", methods=["POST"])
def profiles_update():
    d   = request.json or {}
    pid = d.get("id", "")
    p   = cfg.profile(pid)
    if not p:
        return jsonify({"ok": False, "reason": "not found"})
    for key in ("name", "app_id", "mods_dir"):
        if key in d:
            p[key] = d[key]
    p.save()
    return jsonify({"ok": True})


@bp.route("/api/profiles/delete", methods=["POST"])
def profiles_delete():
    pid = (request.json or {}).get("id", "")
    if not pid:
        return jsonify({"ok": False})
    cfg.delete_profile(pid)
    return jsonify({"ok": True})


@bp.route("/api/profiles/app-info", methods=["GET"])
def app_info():
    app_id = request.args.get("app_id", "").strip()
    if not app_id or not app_id.isdigit():
        return jsonify({"ok": False})
    try:
        r = req.get(STEAM_APP_API.format(app_id), timeout=8)
        r.raise_for_status()
        data = r.json()
        info = data.get(app_id, {})
        if not info.get("success"):
            return jsonify({"ok": False})
        name = info["data"].get("name", "")
        return jsonify({"ok": True, "name": name})
    except Exception as e:
        return jsonify({"ok": False, "error": str(e)})


@bp.route("/api/profiles/import-file", methods=["POST"])
def profiles_import_file():
    """
    Open a .txt mod-list file, parse it and return the data.
    Does NOT create a profile — the frontend fills the modal and the user saves.
    """
    path = pick_file(
        title="Open mod list",
        filetypes=["Text files (*.txt)", "All files (*.*)"],
    )
    if not path:
        return jsonify({"ok": False, "reason": "cancelled"})

    try:
        text = Path(path).read_text(encoding="utf-8", errors="replace")
    except Exception as e:
        return jsonify({"ok": False, "reason": str(e)})

    profile_name = ""
    app_id       = ""
    mods_data    = {}
    in_mods      = False

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if line.startswith("# Profile:"):
            profile_name = line.split(":", 1)[1].strip()
        elif line.startswith("# AppID:"):
            app_id = line.split(":", 1)[1].strip()
        elif not line or line.startswith("#"):
            continue
        elif line.startswith("[") and line.endswith("]"):
            in_mods = (line[1:-1].lower() == "mods")
        elif in_mods and " # " in line:
            mid, name = line.split(" # ", 1)
            mid = mid.strip()
            if mid.isdigit():
                mods_data[mid] = name.strip()

    return jsonify({
        "ok":          True,
        "name":        profile_name or "Imported Profile",
        "app_id":      app_id or "294100",
        "mod_count":   len(mods_data),
        "mods":        [{"id": mid, "name": name} for mid, name in mods_data.items()],
    })


@bp.route("/api/profiles/import-mods", methods=["POST"])
def profiles_import_mods():
    """
    Add pre-parsed mods list to a profile (called after user confirms modal).
    Expects { profile_id, mods: [{id, name}, ...] }
    """
    d          = request.json or {}
    pid        = d.get("profile_id", "")
    mods_list  = d.get("mods", [])

    p = cfg.profile(pid) if pid else cfg.active
    if not p:
        return jsonify({"ok": False, "reason": "profile not found"})

    existing = {m["id"] for m in p.data["mods"]}
    added    = 0
    for item in mods_list:
        mid = str(item.get("id", "")).strip()
        if not mid or mid in existing:
            continue
        p.data["mods"].append({
            "id":           mid,
            "name":         item.get("name") or f"Mod {mid}",
            "size":         "",
            "status":       "not_downloaded",
            "selected":     False,
            "time_updated": 0,
            "steam_tags":   [],
            "main_tag":     "",
            "side_tags":    [],
            "local_path":   "",
        })
        existing.add(mid)
        added += 1

    p.save()
    log(f"log_import_done|{added}\n")
    return jsonify({"ok": True, "added": added})

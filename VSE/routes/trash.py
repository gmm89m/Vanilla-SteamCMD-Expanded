"""
Trash routes:
  GET  /api/trash
  POST /api/trash/restore
  POST /api/trash/delete
  POST /api/trash/bulk
"""

from flask import Blueprint, jsonify, request
from core.config import cfg


def _profile():
    return cfg.active   # ← исправлено: было ensure_profile()


bp = Blueprint("trash", __name__)


def _restore_item(item: dict) -> None:
    """
    Add item back to the mods list. Safe to call even if the id already
    exists — deduplication is enforced here, not at call sites.
    """
    tid = item["id"]
    # Remove any existing entry with this id first to avoid duplicates
    _profile().data["mods"] = [m for m in _profile().data["mods"] if m["id"] != tid]
    _profile().data["mods"].append({
        "id":         tid,
        "name":       item.get("name", tid),
        "size":       item.get("size", ""),
        "status":     "not_downloaded",
        "selected":   False,
        "steam_tags": [],
        "main_tag":   "",
        "side_tags":  [],
        "local_path": "",
    })


@bp.route("/api/trash", methods=["GET"])
def trash_get():
    return jsonify(_profile()["trash"])


@bp.route("/api/trash/restore", methods=["POST"])
def trash_restore():
    tid  = (request.json or {}).get("id", "")
    item = next((t for t in _profile()["trash"] if t["id"] == tid), None)
    if not item:
        return jsonify({"ok": False})

    _restore_item(item)
    _profile().data["trash"] = [t for t in _profile()["trash"] if t["id"] != tid]
    _profile().save()
    return jsonify({"ok": True})


@bp.route("/api/trash/delete", methods=["POST"])
def trash_delete():
    tid = (request.json or {}).get("id", "")
    _profile().data["trash"] = [t for t in _profile()["trash"] if t["id"] != tid]
    _profile().save()
    return jsonify({"ok": True})


@bp.route("/api/trash/bulk", methods=["POST"])
def trash_bulk():
    d      = request.json or {}
    ids    = set(d.get("ids", []))
    action = d.get("action", "delete")

    if action == "restore":
        for item in _profile()["trash"]:
            if item["id"] in ids:
                _restore_item(item)

    _profile().data["trash"] = [t for t in _profile()["trash"] if t["id"] not in ids]
    _profile().save()
    return jsonify({"ok": True})
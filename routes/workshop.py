"""
Workshop quick-add route:
  POST /api/add-from-url   — supports collections
"""

import re
from flask import Blueprint, jsonify, request

from core.config    import cfg
from core.state     import log
from core.utils     import fmt_size, identify_ids
from core.steam_api import fetch_mod_info, fetch_collection


def _profile():
    return cfg.active


bp = Blueprint("workshop", __name__)


@bp.route("/api/add-from-url", methods=["POST"])
def add_from_url():
    d   = request.json or {}
    url = d.get("url", "").strip()
    if not url:
        return jsonify({"ok": False, "reason": "no_url"})

    if d.get("is_collection"):
        fid  = re.search(r"id=(\d+)", url)
        mids = []
        cids = [fid.group(1)] if fid else []
    else:
        mids, cids = identify_ids(url)

    existing = {m["id"] for m in _profile()["mods"]}
    added_mods = 0
    added_collections = 0

    # Моды
    new_ids = [i for i in mids if i not in existing]
    if new_ids:
        info = fetch_mod_info(new_ids)
        for mid in new_ids:
            _profile().data["mods"].append({
                "id": mid,
                "name": info.get(mid, {}).get("name", f"Mod {mid}"),
                "size": fmt_size(info.get(mid, {}).get("file_size", 0)),
                "status": "not_downloaded",
                "selected": False,
                "time_updated": info.get(mid, {}).get("time_updated", 0),
                "steam_tags": info.get(mid, {}).get("steam_tags", []),
                "main_tag": "",
                "side_tags": [],
            })
        added_mods = len(new_ids)
        log(f"log_added_mods|{added_mods}\n")

    # Коллекции
    for cid in cids:
        log(f"log_loading_collection|{cid}\n")
        children = fetch_collection(cid)
        if not children:
            log("log_collection_empty\n")
            continue
        log(f"log_collection_count|{len(children)}\n")
        new2 = [i for i in children if i not in existing]
        if new2:
            info2 = fetch_mod_info(new2)
            for mid in new2:
                _profile().data["mods"].append({
                    "id": mid,
                    "name": info2.get(mid, {}).get("name", f"Mod {mid}"),
                    "size": fmt_size(info2.get(mid, {}).get("file_size", 0)),
                    "status": "not_downloaded",
                    "selected": False,
                    "time_updated": info2.get(mid, {}).get("time_updated", 0),
                    "steam_tags": info2.get(mid, {}).get("steam_tags", []),
                    "main_tag": "",
                    "side_tags": [],
                })
            added_collections += len(new2)
            log(f"log_added_from_collection|{len(new2)}\n")

    _profile().save()

    total_added = added_mods + added_collections

    return jsonify({
        "ok": True,
        "added_mods": added_mods,
        "added_collections": added_collections,
        "total_added": total_added
    })
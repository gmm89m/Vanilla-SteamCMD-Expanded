"""
Import / Export  —  Lite Edition
─────────────────────────────────
Экспорт теперь включает AppID и имя профиля в название файла.
Импорт проверяет соответствие AppID текущему активному профилю.
"""

from datetime import datetime
from pathlib import Path

from flask import Blueprint, jsonify, request

from core.config    import cfg
from core.state     import log, run_bg
from core.utils     import fmt_size
from core.dialogs   import pick_file, save_file
from core.steam_api import fetch_mod_info


def _profile():
    return cfg.active


bp = Blueprint("importexport", __name__)


# ── Export ────────────────────────────────────────────────────────────────────

@bp.route("/api/mods/export-list", methods=["POST"])
def export_list():
    requested_ids = set((request.json or {}).get("ids", []))

    if requested_ids:
        mods_to_export = [m for m in _profile()["mods"] if m["id"] in requested_ids]
    else:
        mods_to_export = list(_profile()["mods"])

    if not mods_to_export:
        return jsonify({"ok": False, "reason": "nothing_to_export"})

    # Получаем данные текущего профиля
    prof = _profile()
    app_id = prof.get("app_id", "unknown")
    prof_name = prof.get("name", "Profile").replace(" ", "_").replace("/", "-")

    date_str = datetime.now().strftime("%d_%m_%Y")

    initial_filename = f"Modlist_{app_id}_{prof_name}_{date_str}.txt"

    path = save_file(
        title="Save mod list",
        initial=initial_filename,
        filetypes=["Text files (*.txt)", "All files (*.*)"],
    )
    if not path:
        return jsonify({"ok": False})

    lines = [
        "# RimMod Manager — Mod List",
        f"# Profile: {prof.get('name', 'Unknown')}",
        f"# AppID: {app_id}",
        f"# Date: {datetime.now().strftime('%Y-%m-%d')}",
        f"# Mods: {len(mods_to_export)}",
        "",
        "[mods]",
    ]
    for m in mods_to_export:
        name = m.get("name", "").replace("\n", " ").replace("#", "")
        lines.append(f"{m['id']} # {name}")

    Path(path).write_text("\n".join(lines), encoding="utf-8")
    log(f"log_export_done|{len(mods_to_export)}|{path}\n")
    return jsonify({"ok": True})


# ── Import ────────────────────────────────────────────────────────────────────

@bp.route("/api/mods/import-list", methods=["POST"])
def import_list():
    path = pick_file(
        title="Open mod list",
        filetypes=["Text files (*.txt)", "All files (*.*)"],
    )
    if not path:
        return jsonify({"ok": False})

    text = Path(path).read_text(encoding="utf-8", errors="replace")

    def work():
        _parse_and_import(text)

    run_bg(work)
    return jsonify({"ok": True})


def _parse_and_import(text: str) -> None:
    """
    Читает [mods] секцию + проверяет AppID профиля
    """
    mods_data: dict[str, str] = {}
    file_appid = None
    in_mods_section = False

    for raw_line in text.splitlines():
        line = raw_line.strip()
        if not line or line.startswith("#"):
            # Пытаемся извлечь AppID из комментария
            if line.startswith("# AppID:"):
                try:
                    file_appid = line.split(":", 1)[1].strip()
                except:
                    pass
            continue

        if line.startswith("[") and line.endswith("]"):
            in_mods_section = (line[1:-1].lower() == "mods")
            continue

        if in_mods_section and " # " in line:
            mid, name = line.split(" # ", 1)
            mid = mid.strip()
            if mid.isdigit():
                mods_data[mid] = name.strip()

    if not mods_data:
        log("log_import_empty\n")
        return

    current_appid = _profile().get("app_id", "")

    # Проверка AppID
    if file_appid and file_appid != current_appid:
        log(f"log_warning|Import AppID mismatch! File: {file_appid}, Current profile: {current_appid}\n")
        log("log_warning|Import skipped due to AppID mismatch\n")
        return

    existing = {m["id"] for m in _profile()["mods"]}
    new_ids  = [mid for mid in mods_data if mid not in existing]

    if not new_ids:
        log(f"log_import_all_exist|{len(mods_data)}\n")
        return

    log(f"log_import_fetching|{len(new_ids)}|{len(mods_data)}\n")
    info = fetch_mod_info(new_ids)

    for mid in new_ids:
        meta = info.get(mid, {})
        _profile().data["mods"].append({
            "id":           mid,
            "name":         mods_data[mid] or meta.get("name", f"Mod {mid}"),
            "size":         fmt_size(meta.get("file_size", 0)),
            "status":       "not_downloaded",
            "selected":     False,
            "time_updated": meta.get("time_updated", 0),
            "steam_tags":   meta.get("steam_tags", []),
            "main_tag":     "",
            "side_tags":    [],
            "local_path":   "",
        })

    _profile().save()
    log(f"log_import_done|{len(new_ids)}\n")
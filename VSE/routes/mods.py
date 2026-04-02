"""
Mod routes  (Lite Edition):
  GET  /api/mods
  POST /api/mods/add
  POST /api/mods/remove
  POST /api/mods/remove-bulk
  POST /api/mods/download
  POST /api/mods/check-updates
  POST /api/mods/update-outdated
  POST /api/mods/detect
  POST /api/mods/open-folder
"""

import os
import re
import subprocess
import sys
import zipfile
from datetime import datetime
from pathlib import Path

from flask import Blueprint, jsonify, request

from core.config    import cfg
from core.state import log, run_bg, set_busy, request_abort_download, is_abort_requested, set_download_progress, \
    reset_download_state
from core.utils     import fmt_size, parse_ids, identify_ids
from core.steam_api import fetch_mod_info, fetch_collection
from core import steamcmd

MAX_PACKAGE_SIZE = 50

def _profile():
    return cfg.active


bp = Blueprint("mods", __name__)


# ── Helpers ───────────────────────────────────────────────────────────────────

def _local_mod_mtime(mod_folder: Path) -> int:
    """
    Return best available local timestamp for a mod folder.
    - If About/About.xml exists → use its mtime (most accurate for games that have it)
    - Otherwise → use the folder's own mtime (works for games without About.xml)
    - Returns 0 if folder doesn't exist
    """
    if not mod_folder.exists():
        return 0
    about = mod_folder / "About" / "About.xml"
    if about.exists():
        return int(about.stat().st_mtime)
    return int(mod_folder.stat().st_mtime)


def _refresh_local_paths_and_status() -> None:
    """Обновляет local_path и статус для всех модов на основе реального наличия папки"""
    mods_dir = _profile().get("mods_dir", "")
    if not mods_dir:
        return

    mods_path = Path(mods_dir)
    if not mods_path.exists():
        return

    for m in _profile().data["mods"]:
        folder = mods_path / m["id"]
        has_local = folder.exists() and folder.is_dir()

        m["local_path"] = str(folder) if has_local else ""

        # Строгая логика статуса
        if has_local:
            # Не перезаписываем update_available — он выставляется check_updates
            if m.get("status") != "update_available":
                m["status"] = "installed"
        else:
            # Если папки нет — мод считается неустановленным, даже если раньше был "installed"
            if m.get("status") in ("installed", "update_available"):
                m["status"] = "not_downloaded"


def _mark_mods_installed(ids: list) -> None:
    """Force status=installed for mods whose local folder now exists."""
    mods_dir = _profile().get("mods_dir", "")
    if not mods_dir:
        return
    mods_path = Path(mods_dir)
    if not mods_path.exists():
        return
    ids_set = set(ids)
    for m in _profile().data["mods"]:
        if m["id"] in ids_set:
            folder = mods_path / m["id"]
            if folder.exists() and folder.is_dir():
                m["status"] = "installed"
                m["local_path"] = str(folder)


def _make_mod_entry(mid: str, meta: dict, status: str = "not_downloaded") -> dict:
    mods_dir = _profile().get("mods_dir", "")
    folder = Path(mods_dir) / mid if mods_dir else None
    has_local = bool(folder and folder.exists() and folder.is_dir())

    return {
        "id":           mid,
        "name":         meta.get("name", f"Mod {mid}"),
        "size":         fmt_size(meta.get("file_size", 0)),
        "status":       "installed" if has_local else status,
        "selected":     False,
        "time_updated": meta.get("time_updated", 0),
        "steam_tags":   meta.get("steam_tags", []),
        "main_tag":     "",
        "side_tags":    [],
        "local_path":   str(folder) if has_local else "",
    }


# ── Routes ────────────────────────────────────────────────────────────────────

@bp.route("/api/mods", methods=["GET"])
def mods_get():
    _refresh_local_paths_and_status()   # ← обновляем статус перед отдачей списка
    return jsonify(_profile()["mods"])


@bp.route("/api/mods/add", methods=["POST"])
def mods_add():
    raw  = (request.json or {}).get("text", "")
    mids, cids = identify_ids(raw)

    def work():
        existing = {m["id"] for m in _profile()["mods"]}

        new_ids = [i for i in mids if i not in existing]
        if new_ids:
            log(f"log_fetching_info|{len(new_ids)}\n")
            info = fetch_mod_info(new_ids)
            for mid in new_ids:
                _profile().data["mods"].append(_make_mod_entry(mid, info.get(mid, {})))
            _profile().save()
            log(f"log_added_mods|{len(new_ids)}\n")

        for cid in cids:
            log(f"log_loading_collection|{cid}\n")
            children = fetch_collection(cid)
            if not children:
                log("log_collection_empty\n")
                continue
            log(f"log_collection_count|{len(children)}\n")
            existing2 = {m["id"] for m in _profile()["mods"]}
            new2 = [i for i in children if i not in existing2]
            if new2:
                info2 = fetch_mod_info(new2)
                for mid in new2:
                    _profile().data["mods"].append(_make_mod_entry(mid, info2.get(mid, {})))
                _profile().save()
                log(f"log_added_from_collection|{len(new2)}\n")

    run_bg(work)
    return jsonify({"ok": True})


@bp.route("/api/mods/remove", methods=["POST"])
def mods_remove():
    import shutil
    mid = (request.json or {}).get("id", "")
    mod = next((m for m in _profile()["mods"] if m["id"] == mid), None)
    if not mod:
        return jsonify({"ok": False})

    mods_dir = _profile()["mods_dir"]
    folder   = Path(mods_dir) / mid if mods_dir else None
    if folder and folder.exists():
        try:
            shutil.rmtree(folder)
        except Exception as e:
            log(f"log_warning|{e}\n")

    if not any(t["id"] == mid for t in _profile().data["trash"]):
        _profile().data["trash"].append({
            "id":         mid,
            "name":       mod.get("name", mid),
            "deleted_at": datetime.now().isoformat(),
            "size":       mod.get("size", ""),
        })
    _profile().data["mods"] = [m for m in _profile()["mods"] if m["id"] != mid]
    _profile().save()
    return jsonify({"ok": True})


@bp.route("/api/mods/remove-bulk", methods=["POST"])
def mods_remove_bulk():
    import shutil
    ids      = set((request.json or {}).get("ids", []))
    mods_dir = _profile()["mods_dir"]

    for m in _profile()["mods"]:
        if m["id"] not in ids:
            continue
        folder = Path(mods_dir) / m["id"] if mods_dir else None
        if folder and folder.exists():
            try:
                shutil.rmtree(folder)
            except Exception:
                pass
        if not any(t["id"] == m["id"] for t in _profile().data["trash"]):
            _profile().data["trash"].append({
                "id":         m["id"],
                "name":       m.get("name", m["id"]),
                "deleted_at": datetime.now().isoformat(),
                "size":       m.get("size", ""),
            })

    _profile().data["mods"] = [m for m in _profile()["mods"] if m["id"] not in ids]
    _profile().save()
    return jsonify({"ok": True})


@bp.route("/api/mods/download", methods=["POST"])
def mods_download():
    all_ids = (request.json or {}).get("ids", [])
    if not all_ids:
        return jsonify({"ok": False, "reason": "no_ids"})

    package_size = int(cfg.data.get("max_package_size", 15))
    if package_size < 1:  package_size = 1
    if package_size > 50: package_size = 50

    packages = [all_ids[i:i + package_size] for i in range(0, len(all_ids), package_size)]
    total_mods = len(all_ids)

    log(f"log_start_batch_download|{total_mods}|{len(packages)}|{package_size}\n")
    set_download_progress(total_mods, 0)

    def process_packages():
        def run_package(index):
            if index >= len(packages) or is_abort_requested():
                if is_abort_requested():
                    log("log_download_aborted_by_user\n")
                else:
                    log("log_batch_download_complete\n")
                _mark_mods_installed(all_ids)
                _refresh_local_paths_and_status()
                _profile().save()
                reset_download_state()
                log("log_batch_finished\n")          # ← сигнал завершения
                return

            pkg_ids = packages[index]
            log(f"log_download_package|{index+1}|{len(packages)}|{len(pkg_ids)}/{total_mods}\n")

            def done(ok: bool):
                _refresh_local_paths_and_status()
                _profile().save()
                run_package(index + 1)

            set_busy(True)
            steamcmd.download(pkg_ids, done)

        run_package(0)

    run_bg(process_packages)
    return jsonify({"ok": True, "total_mods": total_mods})


@bp.route("/api/mods/check-updates", methods=["POST"])
def check_updates():
    requested = set((request.json or {}).get("ids", []))
    if not requested:
        return jsonify({"ok": False, "reason": "no_ids"})

    mods_dir = _profile().get("mods_dir", "")

    def work():
        target = [m for m in _profile()["mods"] if m["id"] in requested]
        if not target:
            log("log_no_mods_to_check\n")
            return

        log(f"log_checking_updates|{len(target)}\n")
        info = fetch_mod_info([m["id"] for m in target])
        updated_count = 0

        for mod in target:
            mid = mod["id"]
            remote_ts = info.get(mid, {}).get("time_updated", 0)
            if not remote_ts:
                continue

            if mod.get("status") not in ("installed", "update_available"):
                continue

            if mods_dir:
                folder = Path(mods_dir) / mid
                if not folder.exists():
                    mod["status"] = "not_downloaded"
                    mod["local_path"] = ""
                    continue

            local_mtime = _local_mod_mtime(Path(mods_dir) / mid) if mods_dir else 0
            if local_mtime == 0:
                continue

            if remote_ts > local_mtime:
                mod["status"] = "update_available"
                updated_count += 1
                log(f"log_update_available|{mod.get('name', mid)}\n")
            else:
                # Мод актуален, сбрасываем статус если был update_available
                if mod.get("status") == "update_available":
                    mod["status"] = "installed"
                # Опционально: обновляем сохранённый timestamp
                mod["time_updated"] = remote_ts

        _profile().save()

        if updated_count:
            log(f"log_updates_found|{updated_count}\n")
        else:
            log("log_all_up_to_date\n")

    run_bg(work)
    return jsonify({"ok": True})


@bp.route("/api/mods/update-outdated", methods=["POST"])
def update_outdated():
    ids = (request.json or {}).get("ids", [])
    if not ids:
        return jsonify({"ok": False, "reason": "no_ids"})

    def done(ok: bool):
        _refresh_local_paths_and_status()
        _profile().save()
        log("log_update_complete\n" if ok else "log_update_failed\n")

    def work():
        log(f"log_updating|{len(ids)}\n")
        steamcmd.download(ids, done)

    run_bg(work)
    return jsonify({"ok": True})


@bp.route("/api/mods/detect", methods=["POST"])
def mods_detect():
    def work():
        mods_dir = _profile()["mods_dir"]
        if not mods_dir or not Path(mods_dir).exists():
            log("log_mods_dir_missing\n")
            return

        mods_path = Path(mods_dir)

        if cfg["require_backup"]:
            bak = (mods_path.parent /
                   f"Mods_backup_{datetime.now().strftime('%Y%m%d_%H%M%S')}.zip")
            log(f"log_creating_backup|{bak.name}\n")
            try:
                with zipfile.ZipFile(bak, "w", zipfile.ZIP_DEFLATED) as zf:
                    for f in mods_path.rglob("*"):
                        if f.is_file():
                            zf.write(f, f.relative_to(mods_path.parent))
                log("log_backup_done\n")
            except Exception as e:
                log(f"log_backup_failed|{e}\n")
                return

        found = [
            e.name for e in mods_path.iterdir()
            if e.is_dir() and re.fullmatch(r"\d{7,12}", e.name)
        ]
        log(f"log_found_folders|{len(found)}\n")

        existing = {m["id"] for m in _profile()["mods"]}
        new_ids  = [i for i in found if i not in existing]

        if not new_ids:
            log("log_all_already_listed\n")
            return

        log(f"log_new_fetching|{len(new_ids)}\n")
        info = fetch_mod_info(new_ids)
        for mid in new_ids:
            _profile().data["mods"].append(
                _make_mod_entry(mid, info.get(mid, {}), status="installed")
            )

        _refresh_local_paths_and_status()
        _profile().save()
        log(f"log_detect_done|{len(new_ids)}\n")

    run_bg(work)
    return jsonify({"ok": True})


@bp.route("/api/mods/open-folder", methods=["POST"])
def mods_open_folder():
    mid = (request.json or {}).get("id", "")
    mod = next((m for m in _profile()["mods"] if m["id"] == mid), None)
    if not mod:
        return jsonify({"ok": False, "reason": "not_found"})

    path = mod.get("local_path", "")
    if not path or not Path(path).exists():
        mods_dir = _profile().get("mods_dir", "")
        if mods_dir:
            path = str(Path(mods_dir) / mid)

    if not path or not Path(path).exists():
        return jsonify({"ok": False, "reason": "no_local_path"})

    try:
        _open_path(path)
        return jsonify({"ok": True})
    except Exception as e:
        log(f"log_warning|{e}\n")
        return jsonify({"ok": False, "reason": str(e)})


def _open_path(path: str) -> None:
    p = Path(path)
    if not p.exists():
        return
    if sys.platform == "win32":
        os.startfile(str(p))
    elif sys.platform == "darwin":
        subprocess.Popen(["open", str(p)])
    else:
        subprocess.Popen(["xdg-open", str(p)])

@bp.route("/api/mods/stop-download", methods=["POST"])
def stop_download():
    request_abort_download()
    log("log_download_stop_requested\n")
    return jsonify({"ok": True})
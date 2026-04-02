"""
SteamCMD download runner.
SteamCMD downloads to its own default location (next to steamcmd.exe),
then mods are moved to mods_dir and steamapps/ is cleaned up.
No separate download_dir needed.
"""

import shutil
import subprocess
import threading
from pathlib import Path
from typing import Callable

from core.config import cfg
from core.state import log, set_busy, is_abort_requested, increment_downloaded


def download(mod_ids: list[str], done_cb: Callable[[bool], None]) -> None:
    def run():
        set_busy(True)
        try:
            _run(mod_ids, done_cb)
        finally:
            set_busy(False)
    threading.Thread(target=run, daemon=True).start()


def _run(mod_ids: list[str], done_cb: Callable[[bool], None]) -> None:
    exe = cfg.get("steamcmd_path", "")
    if not exe or not Path(exe).exists():
        log("log_steamcmd_not_found\n")
        done_cb(False)
        return

    p = cfg.active
    if not p:
        log("log_mods_dir_missing\n")
        done_cb(False)
        return

    APP_ID   = p.get("app_id", "294100")
    mods_dir = p.get("mods_dir", "")
    if not mods_dir:
        log("log_mods_dir_missing\n")
        done_cb(False)
        return

    mods_path = Path(mods_dir)
    mods_path.mkdir(parents=True, exist_ok=True)

    # SteamCMD downloads to its own directory by default
    exe_path = Path(exe)
    steamcmd_dir = exe_path.parent
    ws_src = steamcmd_dir / "steamapps" / "workshop" / "content" / APP_ID

    # Script without force_install_dir — use SteamCMD default location
    script = "\n".join(
        ["login anonymous"]
        + [f"workshop_download_item {APP_ID} {mid}" for mid in mod_ids]
        + ["quit"]
    )
    script_path = steamcmd_dir / "_script.txt"
    script_path.write_text(script, encoding="utf-8")

    log(f"log_steamcmd_start|{len(mod_ids)}|{mods_dir}\n")

    try:
        flags = (subprocess.CREATE_NO_WINDOW if hasattr(subprocess, "CREATE_NO_WINDOW") else 0)
        proc = subprocess.Popen(
            [exe, "+runscript", str(script_path)],
            stdout=subprocess.PIPE, stderr=subprocess.STDOUT,
            encoding="utf-8", errors="replace", bufsize=1,
            creationflags=flags,
        )

        downloaded = 0
        total = len(mod_ids)
        for line in proc.stdout:
            log(line.strip() + "\n")

            if is_abort_requested():
                log("log_download_aborted_by_user\n")
                proc.terminate()
                break

            if "Success. Downloaded item" in line or ("workshop_download_item" in line.lower() and "downloading" in line.lower()):
                downloaded += 1
                log(f"log_progress_download|{downloaded}|{total}\n")

        proc.wait()

        # If abort was requested, ignore non-zero returncode (proc was terminated intentionally)
        # and proceed to move whatever was downloaded + cleanup
        if proc.returncode != 0 and not is_abort_requested():
            log(f"log_steamcmd_exit_code|{proc.returncode}\n")
            done_cb(False)
            return

    except Exception as e:
        log(f"log_steamcmd_error|{e}\n")
        done_cb(False)
        return

    log("log_moving_mods\n")
    moved = 0
    for mid in mod_ids:
        src = ws_src / mid
        dst = mods_path / mid
        if src.exists():
            try:
                if dst.exists():
                    shutil.rmtree(dst)
                shutil.move(str(src), str(dst))
                moved += 1
                log(f"log_moved_ok|{mid}\n")
                log(f"log_progress_move|{moved}|{len(mod_ids)}\n")
                increment_downloaded()
                # Remove the source folder only after successful move
                if src.exists():
                    try:
                        shutil.rmtree(src)
                    except Exception:
                        pass
            except Exception as e:
                log(f"log_moved_err|{mid}|{e}\n")
        else:
            log(f"log_moved_missing|{mid}\n")

    # Clean up remaining steamapps structure after all mods are moved
    # Only removes what's left (empty dirs, failed downloads) — successfully moved mods
    # were already cleaned up individually above, avoiding WinError 32 on busy files
    try:
        sd = steamcmd_dir / "steamapps"
        if sd.exists():
            shutil.rmtree(sd)
    except Exception:
        pass

    log(f"log_moved_summary|{moved}|{len(mod_ids)}\n")
    done_cb(moved > 0)

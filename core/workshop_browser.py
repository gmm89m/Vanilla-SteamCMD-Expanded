"""
Launch the Workshop Browser as a separate window.

- From source: runs workshop_window.py via current Python interpreter
- From .exe (PyInstaller): runs WorkshopBrowser.exe next to RimMod.exe
"""

import subprocess
import sys
from pathlib import Path
from core.state import log


def open_workshop_browser():
    if getattr(sys, "frozen", False):
        # Compiled mode — WorkshopBrowser.exe sits next to RimMod.exe
        exe_dir = Path(sys.executable).parent
        target  = exe_dir / "WorkshopBrowser.exe"
        if not target.exists():
            log("log_workshop_script_missing\n")
            return
        subprocess.Popen([str(target)])
    else:
        # Source mode — workshop_window.py is in project root (one level above core/)
        script_path = Path(__file__).parent.parent / "workshop_window.py"
        if not script_path.exists():
            log("log_workshop_script_missing\n")
            return
        subprocess.Popen([sys.executable, str(script_path)])

    log("log_workshop_opened\n")

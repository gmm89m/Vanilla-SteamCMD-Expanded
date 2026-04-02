"""
Shared runtime state.
- Log buffer consumed by SSE stream
- busy flag polled by frontend
- _run_bg() helper to wrap any function in a background thread with busy tracking
"""

import threading
from typing import Callable

_log_lines: list[str] = []
_log_lock             = threading.Lock()
_busy                 = False


def log(msg: str) -> None:
    """Append a line to the shared log buffer (thread-safe)."""
    with _log_lock:
        _log_lines.append(msg)


def get_log_lines() -> list[str]:
    return _log_lines


def get_log_lock() -> threading.Lock:
    return _log_lock


def set_busy(v: bool) -> None:
    global _busy
    _busy = v

def get_download_progress():
    with _download_lock:
        return _total_to_download, _downloaded_count

def get_total_to_download():
    with _download_lock:
        return _total_to_download

def get_downloaded_count():
    with _download_lock:
        return _downloaded_count


def is_busy() -> bool:
    return _busy


def run_bg(fn: Callable) -> None:
    """Run *fn* in a daemon thread, setting the busy flag for its duration."""
    def wrapper():
        set_busy(True)
        try:
            fn()
        finally:
            set_busy(False)

    threading.Thread(target=wrapper, daemon=True).start()

# ── Global download progress — исправленная версия ───────────────────────────
_total_to_download: int = 0
_downloaded_count: int  = 0
_abort_requested: bool  = False
_download_lock          = threading.Lock()


def set_download_progress(total: int, current: int = 0) -> None:
    global _total_to_download, _downloaded_count
    with _download_lock:
        _total_to_download = total
        _downloaded_count = current


def increment_downloaded() -> None:
    global _downloaded_count
    with _download_lock:
        _downloaded_count += 1


def get_download_progress() -> tuple[int, int]:
    with _download_lock:
        return _total_to_download, _downloaded_count


def request_abort_download() -> None:
    global _abort_requested
    with _download_lock:
        _abort_requested = True


def is_abort_requested() -> bool:
    with _download_lock:
        return _abort_requested


def reset_download_state() -> None:
    global _total_to_download, _downloaded_count, _abort_requested
    with _download_lock:
        _total_to_download = 0
        _downloaded_count = 0
        _abort_requested = False
"""
File / folder dialog helpers.

When pywebview is active it owns the main thread, so tkinter dialogs
called from Flask worker threads either freeze or crash.
Solution: use webview.create_file_dialog() which is thread-safe.

Call set_window(win) from web_app.py after creating the webview window.
Falls back to tkinter when running in plain browser mode.
"""

from typing import Optional

_window = None   # set from web_app.py


def set_window(win) -> None:
    global _window
    _window = win


# ── Public API ────────────────────────────────────────────────────────────────

def pick_folder(title: str = "Select folder") -> str:
    if _window is not None:
        try:
            import webview
            result = _window.create_file_dialog(
                webview.FOLDER_DIALOG, allow_multiple=False
            )
            return result[0] if result else ""
        except Exception:
            pass
    return _tk_folder(title)


def pick_file(title: str = "Select file",
              filetypes: Optional[list] = None) -> str:
    if _window is not None:
        try:
            import webview
            ft = tuple(filetypes) if filetypes else ("All files (*.*)",)
            result = _window.create_file_dialog(
                webview.OPEN_DIALOG, allow_multiple=False, file_types=ft
            )
            return result[0] if result else ""
        except Exception:
            pass
    return _tk_file(title, filetypes)


def save_file(title: str = "Save file",
              filetypes: Optional[list] = None,
              initial: str = "") -> str:
    if _window is not None:
        try:
            import webview
            ft = tuple(filetypes) if filetypes else ("All files (*.*)",)
            result = _window.create_file_dialog(
                webview.SAVE_DIALOG, allow_multiple=False,
                file_types=ft, save_filename=initial
            )
            return result[0] if result else ""
        except Exception:
            pass
    return _tk_save(title, filetypes, initial)


# ── tkinter fallbacks (browser mode only) ────────────────────────────────────

def _tk_folder(title: str) -> str:
    import tkinter as tk
    from tkinter import filedialog
    root = tk.Tk(); root.withdraw(); root.attributes("-topmost", True)
    try:
        return str(filedialog.askdirectory(title=title, parent=root)) or ""
    finally:
        root.destroy()


def _tk_file(title: str, filetypes=None) -> str:
    import tkinter as tk
    from tkinter import filedialog
    root = tk.Tk(); root.withdraw(); root.attributes("-topmost", True)
    try:
        return str(filedialog.askopenfilename(
            title=title, filetypes=filetypes or [], parent=root)) or ""
    finally:
        root.destroy()


def _tk_save(title: str, filetypes=None, initial: str = "") -> str:
    import tkinter as tk
    from tkinter import filedialog
    root = tk.Tk(); root.withdraw(); root.attributes("-topmost", True)
    try:
        return str(filedialog.asksaveasfilename(
            title=title, filetypes=filetypes or [],
            initialfile=initial, parent=root)) or ""
    finally:
        root.destroy()

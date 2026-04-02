"""
Pure utility functions with no side effects.
No imports from other core modules to avoid circular deps.
"""

import re


def fmt_size(b) -> str:
    """Convert byte count to human-readable string.
    Accepts int or string — Steam API sometimes returns file_size as str."""
    try:
        b = int(b)
    except (ValueError, TypeError):
        return ""
    if not b:
        return ""
    for unit in ("B", "KB", "MB", "GB"):
        if b < 1024:
            return f"{b:.1f} {unit}"
        b /= 1024
    return f"{b:.1f} TB"


def parse_ids(raw: str) -> tuple[list[str], list[str]]:
    """
    Улучшенная версия: правильно различает моды и коллекции по реальным Steam URL.
    - /sharedfiles/filedetails/ → мод
    - /workshop/filedetails/    → коллекция (как в твоём примере)
    """
    seen: set[str] = set()
    mids: list[str] = []
    cids: list[str] = []

    for url in re.findall(r"https?://\S+", raw):
        m = re.search(r"id=(\d+)", url)
        if not m:
            continue
        fid = m.group(1)
        if fid in seen:
            continue
        seen.add(fid)

        lower = url.lower()
        if (any(x in lower for x in ("collections", "type=collections", "workshop/browse")) or
            ('/workshop/filedetails/' in lower and '/sharedfiles/' not in lower)):
            cids.append(fid)
        else:
            mids.append(fid)

    for fid in re.findall(r"\b(\d{7,12})\b", re.sub(r"https?://\S+", " ", raw)):
        if fid not in seen:
            seen.add(fid)
            mids.append(fid)

    return mids, cids


def tk_pick(
    title: str,
    pick_file: bool = False,
    filetypes: list | None = None,
    save: bool = False,
    initial: str = "",
) -> str:
    """
    Open a native OS file/folder dialog via a hidden tkinter root.
    Returns the selected path, or '' if cancelled.
    """
    import tkinter as tk
    from tkinter import filedialog

    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    try:
        if save:
            path = filedialog.asksaveasfilename(
                title=title,
                filetypes=filetypes or [],
                initialfile=initial,
                parent=root,
            )
        elif pick_file:
            path = filedialog.askopenfilename(
                title=title,
                filetypes=filetypes or [],
                parent=root,
            )
        else:
            path = filedialog.askdirectory(title=title, parent=root)
        return str(path) if path else ""
    finally:
        root.destroy()




def identify_ids(raw: str) -> tuple[list[str], list[str]]:
    """
    Extract all IDs from raw text, then classify via Steam API.
    Collections have file_type=18 in GetPublishedFileDetails.
    Falls back to URL heuristic if API fails.
    """
    import re, requests as req

    seen: set[str] = set()
    candidates: list[str] = []

    for url in re.findall(r"https?://\S+", raw):
        m = re.search(r"id=(\d+)", url)
        if m and m.group(1) not in seen:
            seen.add(m.group(1))
            candidates.append(m.group(1))

    for fid in re.findall(r"\b(\d{7,12})\b", re.sub(r"https?://\S+", " ", raw)):
        if fid not in seen:
            seen.add(fid)
            candidates.append(fid)

    if not candidates:
        return [], []

    try:
        params = {"itemcount": len(candidates)}
        for i, fid in enumerate(candidates):
            params[f"publishedfileids[{i}]"] = fid
        r = req.post(
            "https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/",
            data=params, timeout=15,
        )
        r.raise_for_status()
        details = r.json()["response"].get("publishedfiledetails", [])
        mids, cids = [], []
        api_seen: set[str] = set()
        for item in details:
            fid       = item.get("publishedfileid", "")
            file_type = item.get("file_type", 0)
            api_seen.add(fid)
            if file_type == 18:  # Workshop collection
                cids.append(fid)
            else:
                mids.append(fid)
        for fid in candidates:
            if fid not in api_seen:
                mids.append(fid)
        return mids, cids
    except Exception:
        return parse_ids(raw)

"""
Persistent JSON config — multi-profile edition.

Global settings: steamcmd_path, download_dir, language, active_profile, require_backup
Profile data:    name, app_id, mods_dir, mods[], trash[]

On very first start a default "RimWorld" stub profile is created automatically.
The wizard then fills in the real settings (mods_dir etc.) on top of it.
"""

import json
import sys
import uuid
from pathlib import Path


def _base_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).parent
    return Path(__file__).parent.parent


BASE_DIR     = _base_dir()
CONFIG_FILE  = BASE_DIR / "scmdmm_config.json"
PROFILES_DIR = BASE_DIR / "profiles"


# ── Profile ───────────────────────────────────────────────────────────────────

class Profile:
    DEFAULTS = {
        "name":     "RimWorld",
        "app_id":   "294100",
        "mods_dir": "",
        # НЕ используем mutable объекты здесь!
    }

    def __init__(self, pid: str, data: dict = None) -> None:
        self.id   = pid
        self.data = {**self.DEFAULTS, **(data or {})}

        # Гарантируем, что списки всегда новые и независимые
        if not isinstance(self.data.get("mods"), list):
            self.data["mods"] = []
        if not isinstance(self.data.get("trash"), list):
            self.data["trash"] = []

    @property
    def path(self) -> Path:
        return PROFILES_DIR / f"{self.id}.json"

    def save(self) -> None:
        PROFILES_DIR.mkdir(parents=True, exist_ok=True)
        self.path.write_text(
            json.dumps(self.data, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

    def delete(self) -> None:
        if self.path.exists():
            self.path.unlink()

    def to_dict(self) -> dict:
        return {"id": self.id, **self.data}

    def __getitem__(self, key):
        return self.data[key]

    def __setitem__(self, key, value):
        self.data[key] = value

    def get(self, key, default=None):
        return self.data.get(key, default)


# ── Global config ─────────────────────────────────────────────────────────────

class Config:
    DEFAULTS = {
        "steamcmd_path":  "",
        "download_dir":   "",
        "language":       "en",
        "active_profile": "",
        "require_backup": True,
        "steam_login":    "anonymous",
    }

    def __init__(self) -> None:
        self.data: dict = dict(self.DEFAULTS)
        self._profiles: dict = {}
        self._load()
        self._ensure_default_profile()

    # ── persistence ───────────────────────────────────────────────────────────

    def _load(self) -> None:
        if CONFIG_FILE.exists():
            try:
                saved = json.loads(CONFIG_FILE.read_text(encoding="utf-8"))
                self.data.update(saved)
            except Exception:
                pass

        PROFILES_DIR.mkdir(parents=True, exist_ok=True)
        for f in sorted(PROFILES_DIR.glob("*.json")):
            try:
                d   = json.loads(f.read_text(encoding="utf-8"))
                pid = f.stem
                self._profiles[pid] = Profile(pid, d)
            except Exception:
                pass

    def _ensure_default_profile(self) -> None:
        """Create a stub RimWorld profile on very first start."""
        if self._profiles:
            return

        pid = "default"
        p   = Profile(pid, {"name": "RimWorld", "app_id": "294100", "mods_dir": ""})
        p.save()
        self._profiles[pid] = p
        self.data["active_profile"] = pid
        self.save()

    def save(self) -> None:
        CONFIG_FILE.write_text(
            json.dumps(self.data, indent=2, ensure_ascii=False),
            encoding="utf-8",
        )

    # ── profiles ──────────────────────────────────────────────────────────────

    def create_profile(self, name: str, app_id: str, mods_dir: str = "") -> Profile:
        pid = uuid.uuid4().hex[:12]
        p   = Profile(pid, {"name": name, "app_id": app_id, "mods_dir": mods_dir})
        p.save()
        self._profiles[pid] = p

        if not self.data["active_profile"]:
            self.data["active_profile"] = pid
            self.save()

        return p

    def delete_profile(self, pid: str) -> None:
        if len(self._profiles) <= 1:
            return
        p = self._profiles.pop(pid, None)
        if p:
            p.delete()
        if self.data["active_profile"] == pid:
            remaining = list(self._profiles.keys())
            self.data["active_profile"] = remaining[0] if remaining else ""
            self.save()

    @property
    def profiles(self) -> list:
        return list(self._profiles.values())

    @property
    def active(self):
        pid = self.data.get("active_profile", "")
        p   = self._profiles.get(pid)
        if not p and self._profiles:
            p = next(iter(self._profiles.values()))
            self.data["active_profile"] = p.id
            self.save()
        return p

    def set_active(self, pid: str) -> bool:
        if pid not in self._profiles:
            return False
        self.data["active_profile"] = pid
        self.save()
        return True

    def profile(self, pid: str):
        return self._profiles.get(pid)

    # ── dict-like access for global keys ──────────────────────────────────────

    def __getitem__(self, key):
        if key == "steamcmd_path":
            return self._resolve_steamcmd_path()
        return self.data[key]

    def __setitem__(self, key, value):
        if key == "steamcmd_path":
            value = self._normalize_steamcmd_path(value)
        self.data[key] = value
        self.save()

    def get(self, key, default=None):
        if key == "steamcmd_path":
            return self._resolve_steamcmd_path() or default
        return self.data.get(key, default)

    def _normalize_steamcmd_path(self, path: str) -> str:
        """Store relative path if steamcmd is inside BASE_DIR, else absolute."""
        if not path:
            return path
        try:
            p = Path(path).resolve()
            rel = p.relative_to(BASE_DIR)
            return str(rel)          # store as relative, e.g. steamcmd/steamcmd.exe
        except ValueError:
            return str(path)         # outside BASE_DIR — store absolute

    def _resolve_steamcmd_path(self) -> str:
        """Return absolute path, resolving relative ones against BASE_DIR."""
        raw = self.data.get("steamcmd_path", "")
        if not raw:
            return raw
        p = Path(raw)
        if p.is_absolute():
            return str(p)
        return str(BASE_DIR / p)


cfg = Config()

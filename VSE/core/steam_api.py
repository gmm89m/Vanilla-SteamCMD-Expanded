"""
Steam Workshop API helpers.
All network calls are synchronous — call from a background thread.
"""

import requests
from core.state import log

WORKSHOP_API   = "https://api.steampowered.com/ISteamRemoteStorage/GetPublishedFileDetails/v1/"
COLLECTION_API = "https://api.steampowered.com/ISteamRemoteStorage/GetCollectionDetails/v1/"
TIMEOUT        = 20  # seconds


def fetch_mod_info(mod_ids: list[str]) -> dict[str, dict]:
    """
    Returns dict[mod_id -> {name, time_updated, file_size, steam_tags}]
    for all requested IDs. Missing/failed IDs are silently omitted.
    """
    if not mod_ids:
        return {}
    try:
        params = {"itemcount": len(mod_ids)}
        for i, mid in enumerate(mod_ids):
            params[f"publishedfileids[{i}]"] = mid

        r = requests.post(WORKSHOP_API, data=params, timeout=TIMEOUT)
        r.raise_for_status()

        result: dict[str, dict] = {}
        for item in r.json()["response"].get("publishedfiledetails", []):
            fid = item.get("publishedfileid", "")
            result[fid] = {
                "name":         item.get("title", f"Mod {fid}"),
                "time_updated": item.get("time_updated", 0),
                "file_size":    item.get("file_size", 0),
                "steam_tags":   [t["tag"] for t in item.get("tags", []) if "tag" in t],
            }
        return result

    except Exception as e:
        log(f"⚠ Steam API error: {e}\n")
        return {}


def fetch_collection(collection_id: str) -> list[str]:
    """
    Returns list of mod IDs inside a Steam Workshop collection.
    Returns [] on any error.
    """
    try:
        r = requests.post(
            COLLECTION_API,
            data={"collectioncount": 1, "publishedfileids[0]": collection_id},
            timeout=TIMEOUT,
        )
        r.raise_for_status()
        details = r.json()["response"].get("collectiondetails", [])
        if not details:
            return []
        return [
            c["publishedfileid"]
            for c in details[0].get("children", [])
            if "publishedfileid" in c
        ]
    except Exception as e:
        log(f"⚠ Collection API error: {e}\n")
        return []

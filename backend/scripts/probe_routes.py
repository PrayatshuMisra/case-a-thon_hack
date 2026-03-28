from __future__ import annotations

import urllib.request

BASE = "http://127.0.0.1:8000"

for path in ["/", "/openapi.json", "/api/fishers", "/api/supabase-status"]:
    try:
        with urllib.request.urlopen(f"{BASE}{path}", timeout=10) as resp:
            body = resp.read().decode("utf-8", errors="replace")
            print(path, resp.status, body[:220])
    except Exception as exc:  # noqa: BLE001
        print(path, "ERR", exc)

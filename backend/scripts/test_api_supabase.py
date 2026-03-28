from __future__ import annotations

import json
import urllib.error
import urllib.request

BASE = "http://127.0.0.1:8000"


def _get(path: str) -> dict:
    req = urllib.request.Request(f"{BASE}{path}", method="GET")
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _post(path: str, payload: dict) -> dict:
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        f"{BASE}{path}",
        method="POST",
        data=data,
        headers={"Content-Type": "application/json"},
    )
    with urllib.request.urlopen(req, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> int:
    out: dict = {}
    try:
        out["status_before"] = _get("/api/supabase-status")
        out["post_add_fisher"] = _post(
            "/api/add-fisher",
            {
                "name": "UI Path Supabase Test",
                "boat_id": "MALPE-UI-01",
                "species_focus": "Seer Fish",
                "avg_weekly_catch_kg": 120,
                "commitment_level": "High",
                "mobile_number": "9999999999",
            },
        )
        out["status_after"] = _get("/api/supabase-status")
        print(json.dumps(out, indent=2))
        return 0
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="replace")
        print(json.dumps({"error": "http", "status": exc.code, "body": body}, indent=2))
        return 2
    except Exception as exc:  # noqa: BLE001
        print(json.dumps({"error": "runtime", "detail": str(exc)}, indent=2))
        return 1


if __name__ == "__main__":
    raise SystemExit(main())

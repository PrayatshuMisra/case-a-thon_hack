from __future__ import annotations

import json
import sys
from pathlib import Path
from datetime import datetime, timezone
from uuid import uuid4

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.db.supabase_client import get_supabase_client
from app.db.store import get_last_supabase_write_error, store


def main() -> int:
    report: dict = {"probe": {}, "write": {}}

    try:
        client = get_supabase_client()
        probe = client.table("fishers").select("*", count="exact").limit(1).execute()
        report["probe"] = {
            "ok": True,
            "count": probe.count,
            "sample_rows": len(probe.data or []),
        }
    except Exception as exc:  # noqa: BLE001
        report["probe"] = {"ok": False, "error": str(exc)}

    payload = {
        "id": str(uuid4()),
        "name": "Supabase Test Fisher",
        "boat_id": "MALPE-SUPA-01",
        "species_focus": ["Seer Fish"],
        "avg_weekly_catch_kg": 111,
        "commitment_level": "High",
        "mobile_number": "9999999999",
        "income_uplift_pct": 14.0,
        "status": "Onboarded",
        "created_at": datetime.now(timezone.utc),
    }

    store.add_fisher(payload)
    last_error = get_last_supabase_write_error()
    report["write"] = {"ok": last_error is None, "last_error": last_error}

    print(json.dumps(report, indent=2, default=str))
    return 0 if report["probe"].get("ok") and report["write"].get("ok") else 1


if __name__ == "__main__":
    raise SystemExit(main())

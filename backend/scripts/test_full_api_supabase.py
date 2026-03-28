"""
Full end-to-end test: every API route + Supabase table persistence.

Run from project root (with venv active):
    python backend/scripts/test_full_api_supabase.py

Or with a live server:
    python backend/scripts/test_full_api_supabase.py --live

Requirements: fastapi[all], httpx, python-dotenv
"""
from __future__ import annotations

import json
import sys
import time
from pathlib import Path
from datetime import datetime, timezone

# ── allow imports from backend/ ──────────────────────────────────────────────
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from fastapi.testclient import TestClient
from app.main import app
from app.db.supabase_client import get_supabase_client
from app.db.store import get_last_supabase_write_error, store

# ─────────────────────────────────────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────────────────────────────────────

GREEN = "\033[92m"
RED   = "\033[91m"
YELLOW= "\033[93m"
CYAN  = "\033[96m"
RESET = "\033[0m"
BOLD  = "\033[1m"


def _p(label: str, ok: bool, detail: str = "") -> None:
    icon = f"{GREEN}✓{RESET}" if ok else f"{RED}✗{RESET}"
    suffix = f"  {YELLOW}{detail}{RESET}" if detail else ""
    print(f"  {icon}  {label}{suffix}")


def _section(title: str) -> None:
    print(f"\n{BOLD}{CYAN}{'─'*60}{RESET}")
    print(f"{BOLD}{CYAN}  {title}{RESET}")
    print(f"{BOLD}{CYAN}{'─'*60}{RESET}")


# ─────────────────────────────────────────────────────────────────────────────
# 1. Supabase connectivity
# ─────────────────────────────────────────────────────────────────────────────

def test_supabase_connection() -> dict[str, bool]:
    _section("1  Supabase connectivity")
    results: dict[str, bool] = {}
    try:
        client = get_supabase_client()
        results["client_created"] = True
        _p("Client created", True)
    except Exception as exc:
        _p("Client created", False, str(exc))
        results["client_created"] = False
        return results

    for table in ["fishers", "orders", "lois", "shipments", "product_catalog"]:
        try:
            resp = client.table(table).select("*", count="exact").limit(1).execute()
            ok = resp is not None
            results[f"table_{table}"] = ok
            _p(f"Table '{table}' reachable (count={resp.count})", ok)
        except Exception as exc:
            _p(f"Table '{table}' reachable", False, str(exc))
            results[f"table_{table}"] = False

    return results


# ─────────────────────────────────────────────────────────────────────────────
# 2. Direct Supabase write — fishers table
# ─────────────────────────────────────────────────────────────────────────────

def test_supabase_direct_write() -> dict[str, bool]:
    _section("2  Direct Supabase write — fishers table")
    results: dict[str, bool] = {}

    try:
        client = get_supabase_client()

        # Count before
        before = client.table("fishers").select("*", count="exact").limit(1).execute()
        before_count = before.count or 0
        _p(f"Fisher count before write: {before_count}", True)

        # Write a test fisher directly via supabase client
        payload = {
            "name": "DirectWrite TestFisher",
            "boat_id": "MALPE-DW-01",
            "species_focus": "Seer Fish",
            "avg_weekly_catch_kg": 88,
            "commitment_level": "High",
            "mobile_number": "9000000001",
            "income_uplift_pct": 14.0,
            "status": "Onboarded",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }

        try:
            resp = client.table("fishers").insert(payload)
            ok = resp is not None
            results["direct_insert"] = ok
            _p("Direct insert to fishers", ok, f"data={resp.data}")
        except Exception as exc:
            _p("Direct insert to fishers", False, str(exc))
            results["direct_insert"] = False

        # Count after
        try:
            after = client.table("fishers").select("*", count="exact").limit(1).execute()
            after_count = after.count or 0
            grew = (after_count > before_count) if before_count is not None else False
            results["count_increased"] = grew
            _p(f"Fisher count after write: {after_count}", grew,
               "(count did NOT increase!)" if not grew else "")
        except Exception as exc:
            _p("Count check after write", False, str(exc))
            results["count_increased"] = False

    except Exception as exc:
        _p("Direct write setup", False, str(exc))

    return results


# ─────────────────────────────────────────────────────────────────────────────
# 3. API route tests via TestClient
# ─────────────────────────────────────────────────────────────────────────────

def test_all_api_routes() -> dict[str, bool]:
    _section("3  API route tests (all endpoints)")
    results: dict[str, bool] = {}
    client = TestClient(app, raise_server_exceptions=False)

    # ── Health ────────────────────────────────────────────────────────────────
    r = client.get("/")
    ok = r.status_code == 200
    results["GET /"] = ok
    _p("GET /  (health)", ok, r.text[:80] if not ok else "")

    # ── Supabase status ───────────────────────────────────────────────────────
    r = client.get("/api/supabase-status")
    ok = r.status_code == 200
    results["GET /api/supabase-status"] = ok
    body = r.json() if ok else {}
    _p("GET /api/supabase-status", ok,
       f"connected={body.get('connected')} last_write_error={body.get('last_write_error')}")

    # ── Live drop ─────────────────────────────────────────────────────────────
    r = client.get("/api/live-drop")
    ok = r.status_code == 200 and "products" in (r.json() if ok else {})
    results["GET /api/live-drop"] = ok
    _p("GET /api/live-drop", ok, r.text[:80] if not ok else "")

    # ── GET fishers (before onboarding) ───────────────────────────────────────
    r = client.get("/api/fishers")
    ok = r.status_code == 200 and isinstance(r.json(), list)
    results["GET /api/fishers (before)"] = ok
    fishers_before = r.json() if ok else []
    _p(f"GET /api/fishers  (count={len(fishers_before)})", ok, r.text[:80] if not ok else "")

    # ── Add fisher (FisherStudio path) ────────────────────────────────────────
    fisher_payload = {
        "name": "Studio Onboard Fisher",
        "boat_id": "MALPE-STU-99",
        "species_focus": "Pomfret",
        "avg_weekly_catch_kg": 145,
        "commitment_level": "Medium",
        "mobile_number": "9123456789",
    }
    r = client.post("/api/add-fisher", json=fisher_payload)
    ok = r.status_code == 200
    results["POST /api/add-fisher"] = ok
    add_body = r.json() if ok else {}
    _p("POST /api/add-fisher", ok, r.text[:120] if not ok else f"id={add_body.get('id')} status={add_body.get('status')}")

    # ── Check last_write_error after add-fisher ───────────────────────────────
    # This is the KEY check: if supabase write failed silently, this will be non-None
    last_err = get_last_supabase_write_error()
    supabase_write_ok = last_err is None
    results["supabase_write_after_add_fisher"] = supabase_write_ok
    _p("Supabase write succeeded (no last_write_error)", supabase_write_ok,
       f"ERROR: {last_err}" if not supabase_write_ok else "")

    # ── Verify fisher appears in /api/fishers ─────────────────────────────────
    r = client.get("/api/fishers")
    ok_fishers = r.status_code == 200 and isinstance(r.json(), list)
    fishers_after = r.json() if ok_fishers else []
    grew = len(fishers_after) > len(fishers_before)
    results["fisher_in_store_after_add"] = grew
    _p(f"Fisher added to in-memory store (count: {len(fishers_before)}→{len(fishers_after)})", grew)

    # ── Verify in Supabase directly ───────────────────────────────────────────
    try:
        supa = get_supabase_client()
        supa_resp = supa.table("fishers").select("*", count="exact").limit(1).execute()
        _p(f"Fishers in Supabase after add-fisher (count={supa_resp.count})", True,
           "(Check: did count increase vs run-start?)")
        results["supabase_fishers_readable"] = True
    except Exception as exc:
        _p("Fishers in Supabase after add-fisher", False, str(exc))
        results["supabase_fishers_readable"] = False

    # ── Reserve order ─────────────────────────────────────────────────────────
    order_payload = {
        "customer_name": "Test Customer",
        "phone": "9999988888",
        "apartment_name": "Test Apartments",
        "locality": "Whitefield",
        "product_name": "Seer Fish",
        "quantity_kg": 2,
    }
    r = client.post("/api/reserve-order", json=order_payload)
    ok = r.status_code == 200
    results["POST /api/reserve-order"] = ok
    order_body = r.json() if ok else {}
    _p("POST /api/reserve-order", ok, r.text[:120] if not ok else f"order_id={order_body.get('order_id')}")

    # ── Dashboard metrics ─────────────────────────────────────────────────────
    r = client.get("/api/dashboard-metrics")
    ok = r.status_code == 200 and "kpis" in (r.json() if ok else {})
    results["GET /api/dashboard-metrics"] = ok
    _p("GET /api/dashboard-metrics", ok, r.text[:80] if not ok else "")

    # ── LOIs ──────────────────────────────────────────────────────────────────
    r = client.get("/api/lois")
    ok = r.status_code == 200 and isinstance(r.json(), list)
    results["GET /api/lois"] = ok
    _p("GET /api/lois", ok, r.text[:80] if not ok else "")

    loi_payload = {
        "buyer_type": "Restaurant",
        "buyer_name": "Test Bistro",
        "monthly_volume_kg": 80,
        "duration_days": 90,
        "price_note": "Indicative",
        "delivery_terms": "Cold-chain compliant",
        "special_notes": "Test LOI",
        "status": "Draft",
    }
    r = client.post("/api/generate-loi", json=loi_payload)
    ok = r.status_code == 200
    results["POST /api/generate-loi"] = ok
    _p("POST /api/generate-loi", ok, r.text[:120] if not ok else "")

    # ── Recommendations ───────────────────────────────────────────────────────
    r = client.get("/api/recommendation/tomorrow")
    ok = r.status_code == 200
    results["GET /api/recommendation/tomorrow"] = ok
    _p("GET /api/recommendation/tomorrow", ok, r.text[:80] if not ok else "")

    # ── ML traction score ─────────────────────────────────────────────────────
    r = client.get("/api/model/traction-score")
    ok = r.status_code == 200
    results["GET /api/model/traction-score"] = ok
    _p("GET /api/model/traction-score", ok, r.text[:80] if not ok else "")

    # ── Experiments ───────────────────────────────────────────────────────────
    r = client.get("/api/experiment/logs")
    ok = r.status_code == 200
    results["GET /api/experiment/logs"] = ok
    _p("GET /api/experiment/logs", ok, r.text[:80] if not ok else "")

    exp_payload = {
        "arm_id": "test-arm-A",
        "locality": "Whitefield",
        "product_name": "Seer Fish",
        "channel": "WhatsApp",
        "offer": "10% off",
        "impressions": 50,
        "orders": 5,
        "revenue": 3490,
    }
    r = client.post("/api/experiment/log", json=exp_payload)
    ok = r.status_code == 200
    results["POST /api/experiment/log"] = ok
    _p("POST /api/experiment/log", ok, r.text[:80] if not ok else "")

    # ── Tracking ──────────────────────────────────────────────────────────────
    if order_body.get("order_id"):
        r = client.get(f"/api/order-tracking/{order_body['order_id']}")
        ok = r.status_code == 200
        results["GET /api/order-tracking/{id}"] = ok
        _p(f"GET /api/order-tracking/{order_body['order_id']}", ok, r.text[:80] if not ok else "")

    return results


# ─────────────────────────────────────────────────────────────────────────────
# 4. FisherStudio path end-to-end: add → verify in Supabase
# ─────────────────────────────────────────────────────────────────────────────

def test_fisher_studio_to_supabase() -> dict[str, bool]:
    _section("4  FisherStudio → Supabase end-to-end")
    results: dict[str, bool] = {}
    client = TestClient(app, raise_server_exceptions=False)
    supa = get_supabase_client()

    # Snapshot count before
    try:
        before = supa.table("fishers").select("*", count="exact").limit(1).execute()
        count_before = before.count or 0
    except Exception:
        count_before = None

    unique_name = f"E2E Fisher {int(time.time())}"
    payload = {
        "name": unique_name,
        "boat_id": f"MALPE-E2E-{int(time.time()) % 10000}",
        "species_focus": "Prawns",
        "avg_weekly_catch_kg": 200,
        "commitment_level": "High",
        "mobile_number": "8888877777",
    }

    # Call the same route the FisherStudio frontend calls
    r = client.post("/api/add-fisher", json=payload)
    api_ok = r.status_code == 200
    results["api_200"] = api_ok
    _p("POST /api/add-fisher  →  HTTP 200", api_ok, r.text[:120] if not api_ok else "")

    if not api_ok:
        return results

    add_body = r.json()
    fisher_id = add_body.get("id")
    results["has_id"] = bool(fisher_id)
    _p(f"Response has fisher id ({fisher_id})", bool(fisher_id))

    # Check last_write_error
    last_err = get_last_supabase_write_error()
    write_ok = last_err is None
    results["no_supabase_write_error"] = write_ok
    _p("No Supabase write error after onboarding", write_ok,
       f"⚠ SUPABASE ERROR: {last_err}" if not write_ok else "")

    # Verify row in Supabase
    try:
        after = supa.table("fishers").select("*", count="exact").limit(1).execute()
        count_after = after.count or 0
        grew = (count_after > count_before) if count_before is not None else None
        results["supabase_row_count_grew"] = bool(grew)
        if grew is False:
            _p(
                f"Fisher row persisted in Supabase (count {count_before}→{count_after})",
                False,
                "❌ ROW NOT SAVED — this is the bug!"
            )
        elif grew is None:
            _p("Supabase count check (could not compare — count was None)", False)
        else:
            _p(f"Fisher row persisted in Supabase (count {count_before}→{count_after})", True)
    except Exception as exc:
        _p("Supabase row count after onboarding", False, str(exc))
        results["supabase_row_count_grew"] = False

    return results


# ─────────────────────────────────────────────────────────────────────────────
# Summary
# ─────────────────────────────────────────────────────────────────────────────

def _print_summary(all_results: dict[str, dict]) -> int:
    _section("SUMMARY")
    total_pass = 0
    total_fail = 0
    for section, results in all_results.items():
        failures = [k for k, v in results.items() if not v]
        passes   = [k for k, v in results.items() if v]
        total_pass += len(passes)
        total_fail += len(failures)
        status = f"{GREEN}ALL PASS{RESET}" if not failures else f"{RED}{len(failures)} FAIL{RESET}"
        print(f"\n  {BOLD}{section}{RESET}: {status}")
        for f in failures:
            print(f"    {RED}✗  {f}{RESET}")

    print(f"\n{BOLD}  Total: {GREEN}{total_pass} passed{RESET}, {RED}{total_fail} failed{RESET}{BOLD} out of {total_pass+total_fail}{RESET}\n")
    return 0 if total_fail == 0 else 1


if __name__ == "__main__":
    print(f"\n{BOLD}=== Malpe Meen LaunchOS — Full API + Supabase Test ==={RESET}")
    print(f"  {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")

    all_results = {
        "1. Supabase Connectivity": test_supabase_connection(),
        "2. Direct Supabase Write": test_supabase_direct_write(),
        "3. All API Routes": test_all_api_routes(),
        "4. FisherStudio E2E": test_fisher_studio_to_supabase(),
    }

    raise SystemExit(_print_summary(all_results))

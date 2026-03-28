from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4

from app.db.supabase_client import get_supabase_client


LAST_SUPABASE_WRITE_ERROR: str | None = None


def get_last_supabase_write_error() -> str | None:
    return LAST_SUPABASE_WRITE_ERROR


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _serialize_for_db(value: Any) -> Any:
    if isinstance(value, datetime):
        return value.isoformat()
    if isinstance(value, dict):
        return {k: _serialize_for_db(v) for k, v in value.items()}
    if isinstance(value, list):
        return [_serialize_for_db(v) for v in value]
    return value


def _upsert_supabase(table: str, payload: dict[str, Any]) -> None:
    global LAST_SUPABASE_WRITE_ERROR
    try:
        client = get_supabase_client()
        serialized = _serialize_for_db(payload)
        if isinstance(serialized, dict) and serialized.get("id"):
            client.table(table).upsert(serialized, on_conflict="id")
        else:
            client.table(table).insert(serialized)
        LAST_SUPABASE_WRITE_ERROR = None
    except Exception as exc:
        LAST_SUPABASE_WRITE_ERROR = f"{table}: {exc}"
        # Keep the app functional even if Supabase is unavailable or schema differs.
        return


def _seed_shipments() -> list[dict[str, Any]]:
    now = now_utc()
    return [
        {
            # Fixed UUID matches Supabase seed — required for FK on orders.shipment_id
            "id": "11111111-1111-4111-8111-111111111111",
            "product_name": "Seer Fish",
            "source_boat": "MALPE-07",
            "catch_time": now - timedelta(hours=4, minutes=15),
            "landing_time": now - timedelta(hours=3, minutes=10),
            "packing_time": now - timedelta(hours=2, minutes=20),
            "dispatch_time": now - timedelta(hours=1, minutes=45),
            "arrival_eta": now + timedelta(hours=5),
            "species": "Seer Fish",
            "cold_chain_ok": True,
            "created_at": now,
        },
        {
            "id": "22222222-2222-4222-8222-222222222222",
            "product_name": "Pomfret",
            "source_boat": "MALPE-12",
            "catch_time": now - timedelta(hours=5, minutes=10),
            "landing_time": now - timedelta(hours=4, minutes=10),
            "packing_time": now - timedelta(hours=2, minutes=50),
            "dispatch_time": now - timedelta(hours=2, minutes=15),
            "arrival_eta": now + timedelta(hours=6),
            "species": "Pomfret",
            "cold_chain_ok": True,
            "created_at": now,
        },
        {
            "id": "33333333-3333-4333-8333-333333333333",
            "product_name": "Prawns",
            "source_boat": "MALPE-19",
            "catch_time": now - timedelta(hours=6, minutes=5),
            "landing_time": now - timedelta(hours=5, minutes=0),
            "packing_time": now - timedelta(hours=3, minutes=30),
            "dispatch_time": now - timedelta(hours=3, minutes=0),
            "arrival_eta": now + timedelta(hours=6, minutes=30),
            "species": "Prawns",
            "cold_chain_ok": True,
            "created_at": now,
        },
    ]


PRODUCT_CATALOG: dict[str, dict[str, Any]] = {
    "Seer Fish": {"base_price": 349.0, "available_kg": 42.0, "locality_eta": "Tomorrow 7:00 AM"},
    "Pomfret": {"base_price": 429.0, "available_kg": 31.0, "locality_eta": "Tomorrow 7:30 AM"},
    "Prawns": {"base_price": 389.0, "available_kg": 52.0, "locality_eta": "Tomorrow 8:00 AM"},
}


@dataclass
class DataStore:
    orders: list[dict[str, Any]] = field(default_factory=list)
    fishers: list[dict[str, Any]] = field(default_factory=list)
    lois: list[dict[str, Any]] = field(default_factory=list)
    shipments: list[dict[str, Any]] = field(default_factory=_seed_shipments)
    experiments: list[dict[str, Any]] = field(default_factory=list)

    def add_order(self, payload: dict[str, Any]) -> dict[str, Any]:
        self.orders.insert(0, payload)
        _upsert_supabase("orders", payload)
        return payload

    def add_fisher(self, payload: dict[str, Any]) -> dict[str, Any]:
        self.fishers.insert(0, payload)
        _upsert_supabase("fishers", payload)
        return payload

    def add_loi(self, payload: dict[str, Any]) -> dict[str, Any]:
        self.lois.insert(0, payload)
        _upsert_supabase("lois", payload)
        return payload

    def add_experiment(self, payload: dict[str, Any]) -> dict[str, Any]:
        self.experiments.insert(0, payload)
        _upsert_supabase("experiments", payload)
        return payload

    def get_order(self, order_id: str) -> dict[str, Any] | None:
        for order in self.orders:
            if order["id"] == order_id:
                return order
        return None

    def get_shipment(self, shipment_id: str) -> dict[str, Any] | None:
        for shipment in self.shipments:
            if shipment["id"] == shipment_id:
                return shipment
        return None

    def get_shipment_for_product(self, product_name: str) -> dict[str, Any] | None:
        for shipment in self.shipments:
            if shipment["product_name"].lower() == product_name.lower():
                return shipment
        return self.shipments[0] if self.shipments else None


store = DataStore()

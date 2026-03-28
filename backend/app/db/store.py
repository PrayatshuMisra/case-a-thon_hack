from __future__ import annotations

from dataclasses import dataclass, field
from datetime import datetime, timedelta, timezone
from typing import Any
from uuid import uuid4


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def _seed_shipments() -> list[dict[str, Any]]:
    now = now_utc()
    return [
        {
            "id": str(uuid4()),
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
            "id": str(uuid4()),
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
            "id": str(uuid4()),
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

    def add_order(self, payload: dict[str, Any]) -> dict[str, Any]:
        self.orders.insert(0, payload)
        return payload

    def add_fisher(self, payload: dict[str, Any]) -> dict[str, Any]:
        self.fishers.insert(0, payload)
        return payload

    def add_loi(self, payload: dict[str, Any]) -> dict[str, Any]:
        self.lois.insert(0, payload)
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

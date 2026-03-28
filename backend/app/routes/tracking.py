from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException

from app.db.store import store
from app.db.supabase_client import get_supabase_client
from app.schemas.tracking import OrderTrackingResponse

router = APIRouter()


def _get_order(order_id: str) -> dict | None:
    """Fetch order from Supabase first, fall back to in-memory store."""
    try:
        client = get_supabase_client()
        resp = client.table("orders").select("*").execute()
        for row in (resp.data or []):
            if row.get("id") == order_id:
                return row
    except Exception:
        pass
    return store.get_order(order_id)


def _get_shipment(shipment_id: str) -> dict | None:
    """Fetch shipment from Supabase first, fall back to in-memory store."""
    try:
        client = get_supabase_client()
        resp = client.table("shipments").select("*").execute()
        for row in (resp.data or []):
            if row.get("id") == shipment_id:
                return row
    except Exception:
        pass
    return store.get_shipment(shipment_id)


def _parse_dt(value) -> datetime | None:
    """Parse ISO string or return datetime as-is."""
    if value is None:
        return None
    if isinstance(value, datetime):
        return value
    try:
        return datetime.fromisoformat(str(value))
    except Exception:
        return None


@router.get("/api/order-tracking/{order_id}", response_model=OrderTrackingResponse)
def get_tracking(order_id: str):
    order = _get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order {order_id} not found")

    shipment_id = order.get("shipment_id")
    shipment = _get_shipment(shipment_id) if shipment_id else None

    # If shipment is missing (e.g. order from Supabase but shipment not linked),
    # use the first available in-memory shipment as a fallback for tracking display.
    if not shipment:
        shipment = store.shipments[0] if store.shipments else None
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment data not found")

    catch_time    = _parse_dt(shipment.get("catch_time"))
    landing_time  = _parse_dt(shipment.get("landing_time"))
    packing_time  = _parse_dt(shipment.get("packing_time"))
    dispatch_time = _parse_dt(shipment.get("dispatch_time"))
    arrival_eta   = _parse_dt(shipment.get("arrival_eta"))

    stages = [
        ("caught",    "Caught",               catch_time),
        ("landed",    "Landed",               landing_time),
        ("packed",    "Packed",               packing_time),
        ("dispatched","Dispatched",            dispatch_time),
        ("in_transit","In Transit",            None),
        ("arriving",  "Arriving at Apartment", arrival_eta),
    ]

    timeline = [
        {
            "key":       key,
            "label":     label,
            "timestamp": ts.isoformat() if ts else None,
            "completed": i < 4,
            "current":   i == 4,
        }
        for i, (key, label, ts) in enumerate(stages)
    ]

    return {
        "order_id":            order.get("id", order_id),
        "status":              order.get("status", "Reserved"),
        "customer_name":       order.get("customer_name", ""),
        "apartment_name":      order.get("apartment_name", ""),
        "locality":            order.get("locality", ""),
        "product_name":        order.get("product_name", ""),
        "quantity_kg":         float(order.get("quantity_kg", 0)),
        "total_amount":        float(order.get("total_amount", 0)),
        "freshness_score":     float(order.get("freshness_score", 0)),
        "freshness_label":     order.get("freshness_label", "Fresh"),
        "source_boat":         shipment.get("source_boat", "MALPE-07"),
        "catch_zone":          "Arabian Sea - Malpe Zone A",
        "cold_chain_maintained": bool(shipment.get("cold_chain_ok", True)),
        "eta":                 arrival_eta.isoformat() if arrival_eta else "",
        "timeline":            timeline,
    }

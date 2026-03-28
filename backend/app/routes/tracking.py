from fastapi import APIRouter, HTTPException

from app.db.store import store
from app.schemas.tracking import OrderTrackingResponse

router = APIRouter()


@router.get("/api/order-tracking/{order_id}", response_model=OrderTrackingResponse)
def get_tracking(order_id: str):
    order = store.get_order(order_id)
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    shipment = store.get_shipment(order["shipment_id"])
    if not shipment:
        raise HTTPException(status_code=404, detail="Shipment not found")

    stages = [
        ("caught", "Caught", shipment["catch_time"]),
        ("landed", "Landed", shipment["landing_time"]),
        ("packed", "Packed", shipment["packing_time"]),
        ("dispatched", "Dispatched", shipment["dispatch_time"]),
        ("in_transit", "In Transit", None),
        ("arriving", "Arriving at Apartment", shipment["arrival_eta"]),
    ]

    timeline = []
    for i, stage in enumerate(stages):
        key, label, timestamp = stage
        timeline.append(
            {
                "key": key,
                "label": label,
                "timestamp": timestamp.isoformat() if timestamp else None,
                "completed": i < 4,
                "current": i == 4,
            }
        )

    return {
        "order_id": order["id"],
        "status": order["status"],
        "customer_name": order["customer_name"],
        "apartment_name": order["apartment_name"],
        "locality": order["locality"],
        "product_name": order["product_name"],
        "quantity_kg": order["quantity_kg"],
        "total_amount": order["total_amount"],
        "freshness_score": order["freshness_score"],
        "freshness_label": order["freshness_label"],
        "source_boat": shipment["source_boat"],
        "catch_zone": "Arabian Sea - Malpe Zone A",
        "cold_chain_maintained": shipment["cold_chain_ok"],
        "eta": shipment["arrival_eta"].isoformat(),
        "timeline": timeline,
    }

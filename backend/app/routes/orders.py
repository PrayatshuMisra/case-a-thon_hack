from datetime import timezone
from uuid import uuid4

from fastapi import APIRouter, HTTPException

from app.db.store import PRODUCT_CATALOG, now_utc, store
from app.db.supabase_client import get_supabase_client
from app.schemas.order import ReserveOrderRequest, ReserveOrderResponse
from app.services.freshness_engine import calculate_freshness_intelligence
from app.services.pricing_engine import calculate_dynamic_price

router = APIRouter()


@router.post("/api/reserve-order", response_model=ReserveOrderResponse)
def reserve_order(payload: ReserveOrderRequest):
    shipment = store.get_shipment_for_product(payload.product_name)
    if not shipment:
        raise HTTPException(status_code=404, detail="No active shipment found for selected product")

    product = PRODUCT_CATALOG.get(payload.product_name)
    if not product:
        raise HTTPException(status_code=400, detail="Selected product is not available")

    intel = calculate_freshness_intelligence(
        catch_time=shipment["catch_time"],
        landing_time=shipment["landing_time"],
        packing_time=shipment["packing_time"],
        dispatch_time=shipment["dispatch_time"],
        arrival_eta=shipment["arrival_eta"],
        species=shipment["species"],
        cold_chain_ok=shipment["cold_chain_ok"],
    )

    price_per_kg, flash_drop = calculate_dynamic_price(
        base_price=product["base_price"], freshness_score=intel["freshness_score"]
    )
    total_amount = round(payload.quantity_kg * price_per_kg, 2)

    order_id = str(uuid4())
    order_record = {
        "id": order_id,
        "customer_name": payload.customer_name,
        "phone": payload.phone,
        "apartment_name": payload.apartment_name,
        "locality": payload.locality,
        "product_name": payload.product_name,
        "quantity_kg": payload.quantity_kg,
        "price_per_kg": price_per_kg,
        "total_amount": total_amount,
        "freshness_score": intel["freshness_score"],
        "freshness_label": intel["freshness_label"],
        "status": "Reserved",
        "shipment_id": shipment["id"],
        "created_at": now_utc().astimezone(timezone.utc),
    }
    store.add_order(order_record)

    return {
        "order_id": order_id,
        "freshness_score": intel["freshness_score"],
        "freshness_label": intel["freshness_label"],
        "price_per_kg": price_per_kg,
        "total_amount": total_amount,
        "flash_drop": flash_drop,
        "tracking_url": f"/track/{order_id}",
    }


@router.get("/api/orders")
def get_orders():
    """Always reads from Supabase so orders persist across backend restarts."""
    try:
        client = get_supabase_client()
        resp = client.table("orders").select("*").execute()
        if resp.data:
            return resp.data
    except Exception:
        pass
    return store.orders

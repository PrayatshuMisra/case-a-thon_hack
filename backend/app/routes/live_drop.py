from fastapi import APIRouter

from app.db.store import PRODUCT_CATALOG, store
from app.services.freshness_engine import calculate_freshness_intelligence
from app.services.pricing_engine import calculate_dynamic_price

router = APIRouter()


@router.get("/api/live-drop")
def get_live_drop():
    products = []
    for shipment in store.shipments:
        product_name = shipment["product_name"]
        product = PRODUCT_CATALOG.get(product_name, {"base_price": 299, "available_kg": 20})
        intel = calculate_freshness_intelligence(
            catch_time=shipment["catch_time"],
            landing_time=shipment["landing_time"],
            packing_time=shipment["packing_time"],
            dispatch_time=shipment["dispatch_time"],
            arrival_eta=shipment["arrival_eta"],
            species=shipment["species"],
            cold_chain_ok=shipment["cold_chain_ok"],
        )
        current_price, flash_drop = calculate_dynamic_price(
            product["base_price"], intel["freshness_score"]
        )
        products.append(
            {
                "product_name": product_name,
                "base_price": product["base_price"],
                "current_price": current_price,
                "freshness_score": intel["freshness_score"],
                "freshness_label": intel["freshness_label"],
                "flash_drop": flash_drop,
                "available_kg": product["available_kg"],
                "source_boat": shipment["source_boat"],
                "eta": shipment["arrival_eta"].isoformat(),
                "apartment_delivery_eta": product.get("locality_eta", "Tomorrow morning"),
                "timeline": [
                    {"label": "Caught at Sea", "timestamp": shipment["catch_time"].isoformat()},
                    {"label": "Landed at Malpe Harbour", "timestamp": shipment["landing_time"].isoformat()},
                    {"label": "Sorted & Packed", "timestamp": shipment["packing_time"].isoformat()},
                    {"label": "Loaded in Cold Truck", "timestamp": shipment["dispatch_time"].isoformat()},
                    {"label": "Arriving in Bangalore", "timestamp": shipment["arrival_eta"].isoformat()},
                ],
            }
        )

    return {
        "products": products,
        "trust_signals": [
            "ISRO/INCOIS catch intelligence powered",
            "Cold-chain monitored",
            "Direct from Malpe fishers",
            "Delivered to premium Bangalore communities",
        ],
    }

from uuid import uuid4

from fastapi import APIRouter

from app.db.store import now_utc, store
from app.db.supabase_client import get_supabase_client
from app.schemas.loi import GenerateLoiRequest, GenerateLoiResponse

router = APIRouter()


def _export_clauses() -> list[str]:
    return [
        "Pilot procurement subject to sample acceptance, cold-chain handling compliance, third-party lab documentation, and traceability records including source catch timeline and marine condition-linked sourcing evidence.",
        "Sample shipment required before recurring monthly procurement.",
        "Traceability logs and source vessel records to be shared with each batch.",
        "Quality documentation and optional lab test certificate to accompany pilot lots.",
    ]


@router.get("/api/lois")
def get_lois():
    """Always reads from Supabase so LOIs persist across backend restarts."""
    try:
        client = get_supabase_client()
        resp = client.table("lois").select("*").execute()
        if resp.data:
            return resp.data
    except Exception:
        pass
    return store.lois


@router.post("/api/generate-loi", response_model=GenerateLoiResponse)
def generate_loi(payload: GenerateLoiRequest):
    loi_id = str(uuid4())
    buyer_type = payload.buyer_type.strip().title()
    clauses = [
        "Fresh catch supply from Malpe fishing families.",
        "Cold-chain monitored transport and quality-first handling.",
        "Indicative pricing aligned to freshness confidence and pilot demand.",
    ]
    if buyer_type == "Export":
        clauses.extend(_export_clauses())

    preview = {
        "header": "Letter of Intent",
        "buyer_type": buyer_type,
        "buyer_name": payload.buyer_name,
        "monthly_volume_kg": payload.monthly_volume_kg,
        "duration_days": payload.duration_days,
        "price_note": payload.price_note,
        "delivery_terms": payload.delivery_terms,
        "special_notes": payload.special_notes,
        "clauses": clauses,
        "validity": f"Pilot validity: {payload.duration_days} days",
    }

    record = {
        "id": loi_id,
        "buyer_type": buyer_type,
        "buyer_name": payload.buyer_name,
        "monthly_volume_kg": payload.monthly_volume_kg,
        "duration_days": payload.duration_days,
        "price_note": payload.price_note,
        "delivery_terms": payload.delivery_terms,
        "special_notes": payload.special_notes,
        "status": payload.status,
        "created_at": now_utc(),
        "preview": preview,
    }
    store.add_loi(record)

    return {
        "id": loi_id,
        "status": payload.status,
        "message": "LOI generated successfully",
        "preview": preview,
    }

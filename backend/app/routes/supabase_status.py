from fastapi import APIRouter

from app.db.supabase_client import get_supabase_client
from app.db.store import get_last_supabase_write_error

router = APIRouter()


@router.get("/api/supabase-status")
def get_supabase_status():
    result = {
        "connected": False,
        "tables": {},
        "last_write_error": get_last_supabase_write_error(),
    }

    try:
        client = get_supabase_client()
        result["connected"] = True

        for table in ["orders", "fishers", "lois", "shipments", "product_catalog"]:
            try:
                data = client.table(table).select("*", count="exact").limit(1).execute()
                count = getattr(data, "count", None)
                result["tables"][table] = {
                    "ok": True,
                    "count": count,
                }
            except Exception as table_error:
                result["tables"][table] = {
                    "ok": False,
                    "error": str(table_error),
                }
    except Exception as e:
        result["error"] = str(e)

    return result

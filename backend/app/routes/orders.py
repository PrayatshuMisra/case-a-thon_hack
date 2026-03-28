from fastapi import APIRouter
from app.schemas.order import OrderCreate, OrderResponse

router = APIRouter()

@router.get("/")
def get_orders():
    """
    Retrieve all active orders.
    """
    return []

@router.post("/", response_model=OrderResponse)
def create_order(order: OrderCreate):
    """
    Create a new order reservation.
    """
    # Mock response
    return {
        "id": "ord_123",
        "customer_id": order.customer_id,
        "product_name": order.product_name,
        "quantity_kg": order.quantity_kg,
        "status": "reserved",
        "created_at": "2026-03-28T10:00:00Z"
    }

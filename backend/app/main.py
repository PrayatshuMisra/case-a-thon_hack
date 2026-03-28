from fastapi import FastAPI
from app.routes import live_drop, orders, dashboard, fishers, lois, tracking

app = FastAPI(
    title="Malpe Meen LaunchOS API",
    description="Backend API for the Malpe Meen maritime logistics platform.",
    version="1.0.0"
)

app.include_router(live_drop.router, prefix="/api/live-drop", tags=["Live Drop"])
app.include_router(orders.router, prefix="/api/orders", tags=["Orders"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(fishers.router, prefix="/api/fishers", tags=["Fishers"])
app.include_router(lois.router, prefix="/api/lois", tags=["LOIs"])
app.include_router(tracking.router, prefix="/api/tracking", tags=["Tracking"])

@app.get("/")
def read_root():
    return {"status": "online", "message": "Welcome to Malpe Meen LaunchOS API"}

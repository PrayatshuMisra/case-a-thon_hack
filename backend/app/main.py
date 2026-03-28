from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routes import live_drop, orders, dashboard, fishers, lois, tracking, recommendations, experiments, supabase_status

app = FastAPI(
    title="Malpe Meen LaunchOS API",
    description="Backend API for Malpe Meen LaunchOS golden-path MVP.",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(live_drop.router, tags=["Live Drop"])
app.include_router(orders.router, tags=["Orders"])
app.include_router(dashboard.router, tags=["Dashboard"])
app.include_router(fishers.router, tags=["Fishers"])
app.include_router(lois.router, tags=["LOIs"])
app.include_router(tracking.router, tags=["Tracking"])
app.include_router(recommendations.router, tags=["Recommendations"])
app.include_router(experiments.router, tags=["Experiments"])
app.include_router(supabase_status.router, tags=["Supabase"])

@app.get("/")
def read_root():
    return {"status": "online", "message": "Welcome to Malpe Meen LaunchOS API"}

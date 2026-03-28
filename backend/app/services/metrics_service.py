def get_dashboard_metrics() -> dict:
    """
    Retrieves key metrics for the operational dashboard.
    """
    # In a real app, this would query the database
    return {
        "daily_orders": 142,
        "revenue": 42500,
        "repeat_proxy": 84,
        "avg_freshness": 94
    }

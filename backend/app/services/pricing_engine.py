def calculate_dynamic_price(base_price: float, demand_multiplier: float, freshness_score: int) -> float:
    """
    Calculates dynamic pricing based on current demand and freshness score.
    """
    # Adjust price based on freshness
    freshness_multiplier = freshness_score / 100.0
    
    # Calculate final price
    final_price = base_price * demand_multiplier * freshness_multiplier
    return round(final_price, 2)

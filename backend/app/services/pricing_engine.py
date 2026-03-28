from __future__ import annotations


def calculate_dynamic_price(base_price: float, freshness_score: float) -> tuple[float, bool]:
    """Return current price and whether flash-drop mode is active."""
    if freshness_score >= 90:
        multiplier = 1.0
    elif freshness_score >= 80:
        multiplier = 0.95
    elif freshness_score >= 70:
        multiplier = 0.9
    else:
        multiplier = 0.82

    current_price = round(base_price * multiplier, 2)
    flash_drop = freshness_score < 80
    return current_price, flash_drop

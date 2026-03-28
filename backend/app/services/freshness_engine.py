def calculate_freshness_score(temperature_celsius: float, hours_since_catch: float) -> int:
    """
    Calculates a freshness score out of 100 based on temperature and time.
    Optimal temperature is around 2.0°C.
    """
    base_score = 100
    
    # Penalize for temperature deviation
    temp_deviation = abs(temperature_celsius - 2.0)
    temp_penalty = temp_deviation * 5
    
    # Penalize for time
    time_penalty = hours_since_catch * 0.5
    
    final_score = base_score - temp_penalty - time_penalty
    return max(0, min(100, int(final_score)))

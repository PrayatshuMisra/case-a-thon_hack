from datetime import datetime

def format_timestamp(dt: datetime) -> str:
    """Format a datetime object to ISO 8601 string."""
    return dt.isoformat()

def calculate_time_diff_hours(start: datetime, end: datetime) -> float:
    """Calculate the difference between two datetimes in hours."""
    diff = end - start
    return diff.total_seconds() / 3600

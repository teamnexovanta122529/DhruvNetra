"""
DHRUVNETRA - Environment Validation Engine
SIH 2026: Antarctic Digital Twin Platform (Maitri & Bharati)
Physical Sanity & Extreme Polar Boundary Checks
"""

import logging
from typing import Dict, Any, Tuple, Optional

logger = logging.getLogger("dhruvnetra.environment.validation")

# Physical boundary constraints calibrated for Antarctic continent and coastal stations
PHYSICAL_LIMITS = {
    "temperature_2m": (-90.0, 25.0),       # °C (Antarctic record low -89.2°C at Vostok; coastal max ~+15°C)
    "surface_pressure": (850.0, 1085.0),    # hPa (Extreme polar katabatic low / high systems)
    "relative_humidity_2m": (0.0, 100.0),   # %
    "wind_speed_10m": (0.0, 120.0),         # m/s (Category 5 hurricane / extreme katabatic gusts up to ~100 m/s)
    "wind_direction_10m": (0.0, 360.0),     # degrees
    "wind_gusts_10m": (0.0, 150.0),         # m/s
    "cloud_cover": (0.0, 100.0),            # %
    "snowfall": (0.0, 200.0),               # cm
    "precipitation": (0.0, 500.0),          # mm
    "visibility": (0.0, 300000.0),          # meters (up to 300 km in clean polar atmosphere)
}


def validate_raw_weather_payload(raw_data: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """
    Validates that the raw payload from external meteorological API is well-formed
    and contains valid current observations.
    """
    if not isinstance(raw_data, dict):
        return False, "Malformed external API payload: Expected JSON object."

    if "current" not in raw_data or not isinstance(raw_data["current"], dict):
        return False, "External API response is missing mandatory 'current' observation block."

    current = raw_data["current"]

    # Check for required core timestamp
    if "time" not in current or not current["time"]:
        return False, "External API response is missing observation timestamp."

    # Validate physical parameters against Antarctic sanity bounds
    for field_name, (min_val, max_val) in PHYSICAL_LIMITS.items():
        val = current.get(field_name)
        if val is not None:
            try:
                num_val = float(val)
                if not (min_val <= num_val <= max_val):
                    msg = (
                        f"External API returned physically impossible value for {field_name}: {num_val} "
                        f"(Expected polar range: [{min_val}, {max_val}])."
                    )
                    logger.warning(msg)
                    return False, msg
            except (ValueError, TypeError):
                return False, f"Non-numeric value received for {field_name}: {val}"

    return True, None


def sanitize_numeric_field(val: Any, min_val: float, max_val: float) -> Optional[float]:
    """
    Sanitizes an individual numeric field against boundary limits.
    Returns None if missing or outside physical limits.
    """
    if val is None:
        return None
    try:
        num = float(val)
        if min_val <= num <= max_val:
            return round(num, 2)
        logger.warning(f"Sanitizer filtered out-of-bounds value: {val} (Bounds: [{min_val}, {max_val}])")
        return None
    except (ValueError, TypeError):
        return None

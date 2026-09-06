"""
DHRUVNETRA - Environment Service Package
SIH 2026: Digital Platform for Remote Management of Indian Antarctic Research Stations (Maitri & Bharati)
Authoritative Polar Environment & Weather Data Layer
"""

from backend.services.environment.weather_service import EnvironmentService, get_environment_service
from backend.services.environment.schemas import (
    EnvironmentResponse,
    CurrentEnvironment,
    PolarIndices,
    EnvironmentAlert,
    EnvironmentSource,
)

__all__ = [
    "EnvironmentService",
    "get_environment_service",
    "EnvironmentResponse",
    "CurrentEnvironment",
    "PolarIndices",
    "EnvironmentAlert",
    "EnvironmentSource",
]

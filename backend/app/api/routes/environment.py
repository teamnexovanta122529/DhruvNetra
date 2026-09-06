"""
DHRUVNETRA - Environment API Routes
SIH 2026: Antarctic Digital Twin Platform (Maitri & Bharati)
REST Endpoints for Real-Time Antarctic Meteorological Telemetry
"""

import logging
from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status

from backend.services.environment.schemas import (
    EnvironmentResponse,
    AllStationsEnvironmentResponse,
)
from backend.services.environment.weather_service import get_environment_service

logger = logging.getLogger("dhruvnetra.api.environment")

router = APIRouter(
    prefix="/api/environment",
    tags=["Antarctic Environment & Meteorology"],
)


@router.get(
    "",
    response_model=AllStationsEnvironmentResponse,
    summary="Get All Antarctic Stations Environment",
    description="Fetches normalized real-time meteorological observations for both Maitri and Bharati stations.",
)
async def get_all_stations_environment(
    force_refresh: bool = Query(False, description="Bypass backend cache and query external polar model immediately")
):
    service = get_environment_service()
    try:
        data = await service.get_all_stations_environment(force_refresh=force_refresh)
        return data
    except Exception as e:
        logger.error(f"Failed to retrieve all stations environment: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Antarctic meteorological service temporarily unavailable: {str(e)}",
        )


@router.get(
    "/{station}",
    response_model=EnvironmentResponse,
    summary="Get Specific Antarctic Station Environment",
    description=(
        "Fetches normalized real-time environmental observations for a designated Indian Antarctic station "
        "('maitri' or 'bharati'). Features automatic TTL caching, unit normalization, polar wind chill, "
        "blizzard risk scores, and threshold-based operational alerts."
    ),
)
async def get_station_environment(
    station: str,
    force_refresh: bool = Query(False, description="Bypass backend cache and query external polar model immediately")
):
    service = get_environment_service()
    try:
        data = await service.get_environment_data(station, force_refresh=force_refresh)
        return data
    except ValueError as ve:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(ve),
        )
    except Exception as e:
        logger.error(f"Failed to retrieve environment for '{station}': {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Environment data temporarily unavailable for {station}: {str(e)}",
        )

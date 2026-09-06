"""
DHRUVNETRA - Environment Service Pydantic Schemas
SIH 2026: Antarctic Digital Twin Platform (Maitri & Bharati)
Normalized Environmental Data Model
"""

from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field


class LocationMetadata(BaseModel):
    station_name: str = Field(..., description="Canonical station name (Maitri or Bharati)")
    station_code: str = Field(..., description="Short station identifier code (MT or BH)")
    latitude: float = Field(..., description="Geographic latitude in decimal degrees")
    longitude: float = Field(..., description="Geographic longitude in decimal degrees")
    elevation_m: float = Field(..., description="Station elevation above mean sea level (meters)")
    region: str = Field(..., description="Antarctic regional sector")


class CurrentEnvironment(BaseModel):
    temperature_c: Optional[float] = Field(None, description="Ambient 2m air temperature in degrees Celsius")
    pressure_hpa: Optional[float] = Field(None, description="Atmospheric surface pressure in hectopascals (hPa)")
    humidity_percent: Optional[float] = Field(None, description="Relative humidity percentage (0-100%)")
    wind_speed_ms: Optional[float] = Field(None, description="Wind speed in meters per second (m/s)")
    wind_speed_kmh: Optional[float] = Field(None, description="Wind speed in kilometers per hour (km/h)")
    wind_direction_deg: Optional[float] = Field(None, description="Wind azimuth direction in degrees (0-360°)")
    wind_direction_cardinal: Optional[str] = Field(None, description="Compass cardinal direction (e.g., N, ESE, SW)")
    wind_gust_ms: Optional[float] = Field(None, description="Peak wind gust velocity in m/s")
    wind_gust_kmh: Optional[float] = Field(None, description="Peak wind gust velocity in km/h")
    precipitation_mm: Optional[float] = Field(None, description="Total precipitation in millimeters (mm)")
    snowfall_cm: Optional[float] = Field(None, description="Snowfall rate in centimeters (cm)")
    cloud_cover_percent: Optional[float] = Field(None, description="Total cloud fraction (0-100%)")
    visibility_km: Optional[float] = Field(None, description="Horizontal visibility in kilometers (km)")


class WeatherConditions(BaseModel):
    weather: str = Field(..., description="Human-readable WMO weather condition description")
    weather_code: int = Field(..., description="WMO weather interpretation code")
    is_snowing: bool = Field(default=False, description="Whether active snow/precipitation is occurring")
    extreme_weather: bool = Field(default=False, description="Whether extreme polar conditions are active")


class PolarIndices(BaseModel):
    wind_chill_c: Optional[float] = Field(None, description="NOAA Antarctic polar wind chill thermal index (°C)")
    freezing_severity: str = Field(..., description="Severity category (e.g. Extreme Deep Freeze, Severe Freeze, Sub-Zero)")
    blizzard_risk: str = Field(..., description="Blizzard risk status (LOW, MODERATE, HIGH, CRITICAL)")
    blizzard_probability_percent: int = Field(..., description="Calculated blizzard probability score (0-100%)")


class EnvironmentAlert(BaseModel):
    level: str = Field(..., description="Alert severity: NORMAL | WATCH | WARNING | CRITICAL")
    title: str = Field(..., description="Brief alert title")
    description: str = Field(..., description="Detailed operational warning or reassurance statement")
    active_factors: List[str] = Field(default_factory=list, description="List of triggering meteorological factors")


class EnvironmentSource(BaseModel):
    provider: str = Field(default="Open-Meteo Polar NWP", description="Authoritative external weather provider")
    model_type: str = Field(default="ECMWF / DWD ICON / GFS Polar Model Ensemble", description="Numerical weather model")
    is_live: bool = Field(default=True, description="Whether data reflects current live/near-real-time observations")
    telemetry_mode: str = Field(default="EXTERNAL_NUMERICAL_WEATHER_MODEL", description="Data provenance mode")
    station_sensors_connected: bool = Field(default=False, description="Direct hardware IoT sensor telemetry connection status")
    notes: str = Field(
        default="External meteorological model for Antarctic coordinates. Direct station IoT sensors pending SATCOM connection.",
        description="Integrity disclosure"
    )


class EnvironmentResponse(BaseModel):
    success: bool = True
    station: str = Field(..., description="Station name")
    location: LocationMetadata
    current: CurrentEnvironment
    conditions: WeatherConditions
    polar_indices: PolarIndices
    alert: EnvironmentAlert
    timestamp: str = Field(..., description="Observation model timestamp (UTC)")
    retrieved_at: str = Field(..., description="Server fetch timestamp (UTC ISO)")
    cache_age_seconds: int = Field(default=0, description="Age of served cached payload in seconds")
    source: EnvironmentSource


class AllStationsEnvironmentResponse(BaseModel):
    success: bool = True
    retrieved_at: str
    stations: Dict[str, EnvironmentResponse]

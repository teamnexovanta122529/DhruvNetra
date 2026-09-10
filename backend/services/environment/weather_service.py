"""
DHRUVNETRA - Environment Service
SIH 2026: Antarctic Digital Twin Platform (Maitri & Bharati)
Centralized Authoritative Weather Service & Polar Intelligence Engine
"""

import os
import time
import json
import logging
import asyncio
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

import httpx

from backend.services.environment.schemas import (
    LocationMetadata,
    CurrentEnvironment,
    WeatherConditions,
    PolarIndices,
    EnvironmentAlert,
    EnvironmentSource,
    EnvironmentResponse,
    AllStationsEnvironmentResponse,
)
from backend.services.environment.validation import (
    validate_raw_weather_payload,
    sanitize_numeric_field,
    PHYSICAL_LIMITS,
)

logger = logging.getLogger("dhruvnetra.environment.service")

# WMO Weather Code Descriptions
WMO_CODE_MAP = {
    0: ("Clear Sky", False),
    1: ("Mainly Clear", False),
    2: ("Partly Cloudy", False),
    3: ("Overcast", False),
    45: ("Polar Fog", False),
    48: ("Depositing Rime Ice / Polar Fog", False),
    51: ("Light Drizzle", True),
    53: ("Moderate Drizzle", True),
    55: ("Dense Drizzle", True),
    56: ("Light Freezing Drizzle", True),
    57: ("Dense Freezing Drizzle", True),
    61: ("Slight Rain", True),
    63: ("Moderate Rain", True),
    65: ("Heavy Rain", True),
    66: ("Light Freezing Rain", True),
    67: ("Heavy Freezing Rain", True),
    71: ("Light Snowfall", True),
    73: ("Moderate Snowfall", True),
    75: ("Heavy Snowfall", True),
    77: ("Snow Grains / Ice Needles", True),
    80: ("Slight Rain Showers", True),
    81: ("Moderate Rain Showers", True),
    82: ("Violent Rain Showers", True),
    85: ("Slight Snow Showers", True),
    86: ("Heavy Snow Showers", True),
    95: ("Thunderstorm", True),
    96: ("Thunderstorm with Slight Hail", True),
    99: ("Thunderstorm with Heavy Hail", True),
}

# 16-point Compass Cardinals
COMPASS_POINTS = [
    "N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE",
    "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"
]


def deg_to_cardinal(deg: Optional[float]) -> Optional[str]:
    """Convert azimuth degrees (0-360) to 16-point cardinal string."""
    if deg is None:
        return None
    val = int((deg / 22.5) + 0.5)
    return COMPASS_POINTS[val % 16]


def calculate_wind_chill_c(temp_c: Optional[float], wind_kmh: Optional[float]) -> Optional[float]:
    """
    Calculate polar wind chill thermal index using standard NOAA polar formula.
    Valid for temp <= 10°C and wind >= 4.8 km/h.
    """
    if temp_c is None or wind_kmh is None:
        return None
    if temp_c > 10.0 or wind_kmh < 4.8:
        return round(temp_c, 1)
    
    # Polar Wind Chill equation: 13.12 + 0.6215*T - 11.37*(V^0.16) + 0.3965*T*(V^0.16)
    v_exp = wind_kmh ** 0.16
    wc = 13.12 + (0.6215 * temp_c) - (11.37 * v_exp) + (0.3965 * temp_c * v_exp)
    return round(wc, 1)


class EnvironmentService:
    """
    Centralized Antarctic Environment & Weather Service.
    Handles:
    - Canonical station coordinates
    - Asynchronous external meteorological API communication (Open-Meteo)
    - In-memory TTL caching
    - Physical boundary validation
    - Unit normalization (°C, hPa, m/s, km/h, compass points)
    - Polar wind chill and blizzard index computation
    - Rule-based operational alert level generation
    """

    def __init__(self):
        self.base_dir = Path(__file__).resolve().parent.parent.parent
        self.stations_config_path = self.base_dir / "config" / "stations.json"
        self.thresholds_config_path = self.base_dir / "config" / "env_thresholds.json"
        
        self.stations: Dict[str, Dict[str, Any]] = self._load_stations()
        self.thresholds: Dict[str, Any] = self._load_thresholds()
        
        # Cache configuration
        self.cache_ttl_seconds = int(os.getenv("ENVIRONMENT_REFRESH_SECONDS", "300"))
        self.api_timeout_seconds = float(os.getenv("ENVIRONMENT_API_TIMEOUT", "10.0"))
        
        # In-memory cache store: { "STATION_KEY": { "data": EnvironmentResponse, "timestamp": float } }
        self._cache: Dict[str, Dict[str, Any]] = {}
        self._lock = asyncio.Lock()
        
        logger.info(f"EnvironmentService initialized with {len(self.stations)} stations. Cache TTL: {self.cache_ttl_seconds}s")

    def _load_stations(self) -> Dict[str, Dict[str, Any]]:
        if self.stations_config_path.exists():
            try:
                with open(self.stations_config_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    return data.get("stations", {})
            except Exception as e:
                logger.error(f"Failed to load stations config: {e}")
        # Built-in canonical fallback
        return {
            "MAITRI": {
                "name": "Maitri",
                "code": "MT",
                "tagline": "INDIAN ANTARCTIC RESEARCH STATION",
                "region": "Schirmacher Oasis, East Antarctica",
                "latitude": -70.7661,
                "longitude": 11.7358,
                "elevation_m": 117.0,
                "established_year": 1989,
            },
            "BHARATI": {
                "name": "Bharati",
                "code": "BH",
                "tagline": "INDIAN ANTARCTIC RESEARCH STATION",
                "region": "Larsemann Hills, East Antarctica",
                "latitude": -69.4078,
                "longitude": 76.1872,
                "elevation_m": 35.0,
                "established_year": 2012,
            }
        }

    def _load_thresholds(self) -> Dict[str, Any]:
        if self.thresholds_config_path.exists():
            try:
                with open(self.thresholds_config_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                logger.error(f"Failed to load environment thresholds config: {e}")
        return {
            "temperature": {"extreme_cold_critical_c": -35.0, "severe_cold_warning_c": -25.0, "cold_watch_c": -15.0},
            "wind_speed_ms": {"hurricane_force_critical_ms": 32.7, "storm_force_warning_ms": 24.5, "gale_watch_ms": 17.2},
            "wind_chill_c": {"extreme_danger_critical_c": -45.0, "severe_danger_warning_c": -35.0, "caution_watch_c": -25.0},
            "visibility_km": {"zero_whiteout_critical_km": 0.2, "restricted_warning_km": 1.0, "reduced_watch_km": 5.0}
        }

    def get_supported_stations(self) -> Dict[str, Dict[str, Any]]:
        """Return list of canonical supported stations."""
        return self.stations

    def _resolve_station_key(self, station_name: str) -> Optional[str]:
        """Normalize station name/code to canonical station key."""
        clean = station_name.strip().upper()
        if clean in self.stations:
            return clean
        for key, info in self.stations.items():
            if clean in (info.get("name", "").upper(), info.get("code", "").upper()):
                return key
        return None

    async def get_environment_data(self, station_query: str, force_refresh: bool = False) -> EnvironmentResponse:
        """
        Fetch normalized real-time environment data for a given Antarctic station.
        Utilizes caching and external polar model data.
        """
        station_key = self._resolve_station_key(station_query)
        if not station_key:
            raise ValueError(f"Unknown station '{station_query}'. Supported stations: {list(self.stations.keys())}")

        station_info = self.stations[station_key]
        now_epoch = time.time()

        # Check Cache
        async with self._lock:
            cached_entry = self._cache.get(station_key)
            if cached_entry and not force_refresh:
                age = int(now_epoch - cached_entry["timestamp"])
                if age < self.cache_ttl_seconds:
                    logger.debug(f"Serving cached environment for {station_key} (age: {age}s)")
                    # Return copy with updated age
                    resp = cached_entry["data"].model_copy(deep=True)
                    resp.cache_age_seconds = age
                    return resp

        # Fetch Fresh Data from Open-Meteo Polar Models
        try:
            raw_weather = await self._fetch_open_meteo(station_info["latitude"], station_info["longitude"])
            normalized_resp = self._normalize_weather_response(station_key, station_info, raw_weather)

            async with self._lock:
                self._cache[station_key] = {
                    "data": normalized_resp,
                    "timestamp": now_epoch,
                }

            return normalized_resp

        except Exception as e:
            logger.error(f"External weather API error for {station_key}: {e}", exc_info=True)
            # Fallback to stale cache if available
            async with self._lock:
                cached_entry = self._cache.get(station_key)
                if cached_entry:
                    logger.warning(f"Serving STALE cache for {station_key} due to external API failure.")
                    stale_resp = cached_entry["data"].model_copy(deep=True)
                    stale_resp.cache_age_seconds = int(now_epoch - cached_entry["timestamp"])
                    stale_resp.source.is_live = False
                    stale_resp.source.notes = f"Stale cached observation. Fresh fetch failed: {str(e)}"
                    return stale_resp

            # If no cache is present, provide resilient baseline observation
            logger.warning(f"Generating realistic baseline environment observation for {station_info['name']} due to API network timeout.")
            fallback_raw = {
                "current": {
                    "time": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M"),
                    "temperature_2m": -18.2 if station_key == "BHARATI" else -24.3,
                    "surface_pressure": 986.0 if station_key == "BHARATI" else 982.0,
                    "relative_humidity_2m": 68.0 if station_key == "BHARATI" else 71.0,
                    "wind_speed_10m": 7.8 if station_key == "BHARATI" else 9.4,
                    "wind_direction_10m": 70.0 if station_key == "BHARATI" else 315.0,
                    "wind_gusts_10m": 12.5 if station_key == "BHARATI" else 14.2,
                    "precipitation": 0.0,
                    "snowfall": 0.0,
                    "cloud_cover": 40.0 if station_key == "BHARATI" else 60.0,
                    "visibility": 50000.0,
                    "weather_code": 2 if station_key == "BHARATI" else 3,
                }
            }
            fallback_resp = self._normalize_weather_response(station_key, station_info, fallback_raw)
            fallback_resp.source.is_live = False
            fallback_resp.source.notes = f"Simulated baseline observation. Live API fetch timed out: {str(e)}"
            return fallback_resp

    async def get_all_stations_environment(self, force_refresh: bool = False) -> AllStationsEnvironmentResponse:
        """Fetch normalized environment data for all supported stations concurrently."""
        tasks = [
            self.get_environment_data(st_key, force_refresh=force_refresh)
            for st_key in self.stations.keys()
        ]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        station_map: Dict[str, EnvironmentResponse] = {}
        for st_key, res in zip(self.stations.keys(), results):
            if isinstance(res, Exception):
                logger.error(f"Failed to fetch {st_key}: {res}")
            else:
                station_map[st_key] = res

        return AllStationsEnvironmentResponse(
            success=True,
            retrieved_at=datetime.now(timezone.utc).isoformat(),
            stations=station_map,
        )

    async def _fetch_open_meteo(self, lat: float, lon: float) -> Dict[str, Any]:
        """Query Open-Meteo Polar Weather API."""
        url = (
            f"https://api.open-meteo.com/v1/forecast?"
            f"latitude={lat}&longitude={lon}&"
            f"current=temperature_2m,relative_humidity_2m,surface_pressure,wind_speed_10m,"
            f"wind_direction_10m,wind_gusts_10m,weather_code,cloud_cover,snowfall,precipitation,visibility&"
            f"wind_speed_unit=ms&timezone=UTC"
        )
        
        async with httpx.AsyncClient(timeout=self.api_timeout_seconds) as client:
            resp = await client.get(url)
            if resp.status_code != 200:
                raise RuntimeError(f"Open-Meteo returned HTTP {resp.status_code}: {resp.text[:150]}")
            data = resp.json()

        is_valid, err = validate_raw_weather_payload(data)
        if not is_valid:
            raise ValueError(f"Weather data validation error: {err}")

        return data

    def _normalize_weather_response(
        self,
        station_key: str,
        station_info: Dict[str, Any],
        raw_data: Dict[str, Any]
    ) -> EnvironmentResponse:
        """Transform raw Open-Meteo payload into standardized EnvironmentResponse."""
        current_raw = raw_data.get("current", {})
        
        temp_c = sanitize_numeric_field(current_raw.get("temperature_2m"), *PHYSICAL_LIMITS["temperature_2m"])
        pressure_hpa = sanitize_numeric_field(current_raw.get("surface_pressure"), *PHYSICAL_LIMITS["surface_pressure"])
        humidity_pct = sanitize_numeric_field(current_raw.get("relative_humidity_2m"), *PHYSICAL_LIMITS["relative_humidity_2m"])
        wind_ms = sanitize_numeric_field(current_raw.get("wind_speed_10m"), *PHYSICAL_LIMITS["wind_speed_10m"])
        wind_deg = sanitize_numeric_field(current_raw.get("wind_direction_10m"), *PHYSICAL_LIMITS["wind_direction_10m"])
        gust_ms = sanitize_numeric_field(current_raw.get("wind_gusts_10m"), *PHYSICAL_LIMITS["wind_gusts_10m"])
        precip_mm = sanitize_numeric_field(current_raw.get("precipitation"), *PHYSICAL_LIMITS["precipitation"])
        snow_cm = sanitize_numeric_field(current_raw.get("snowfall"), *PHYSICAL_LIMITS["snowfall"])
        cloud_pct = sanitize_numeric_field(current_raw.get("cloud_cover"), *PHYSICAL_LIMITS["cloud_cover"])
        vis_m = sanitize_numeric_field(current_raw.get("visibility"), *PHYSICAL_LIMITS["visibility"])

        # Derived units
        wind_kmh = round(wind_ms * 3.6, 1) if wind_ms is not None else None
        gust_kmh = round(gust_ms * 3.6, 1) if gust_ms is not None else None
        wind_cardinal = deg_to_cardinal(wind_deg)
        vis_km = round(vis_m / 1000.0, 1) if vis_m is not None else None

        # Weather Code Mapping
        w_code = int(current_raw.get("weather_code", 0))
        w_text, is_precip = WMO_CODE_MAP.get(w_code, ("Polar Conditions", False))
        is_snow = (snow_cm is not None and snow_cm > 0.0) or (70 <= w_code <= 79) or (85 <= w_code <= 86)

        # Polar Indices
        wind_chill = calculate_wind_chill_c(temp_c, wind_kmh)
        
        # Freezing severity
        if temp_c is not None:
            if temp_c <= -35.0:
                freezing_cat = "Extreme Deep Freeze"
            elif temp_c <= -25.0:
                freezing_cat = "Severe Polar Freeze"
            elif temp_c <= -15.0:
                freezing_cat = "Moderate Polar Freeze"
            elif temp_c <= 0.0:
                freezing_cat = "Sub-Zero Conditions"
            else:
                freezing_cat = "Above Freezing"
        else:
            freezing_cat = "Thermal Index Unavailable"

        # Blizzard Risk & Probability Calculation
        blizzard_score = 0
        if wind_ms is not None:
            if wind_ms >= 25.0:
                blizzard_score += 50
            elif wind_ms >= 15.0:
                blizzard_score += 30
            elif wind_ms >= 10.0:
                blizzard_score += 15
        
        if is_snow:
            blizzard_score += 30
        
        if vis_km is not None:
            if vis_km <= 0.5:
                blizzard_score += 25
            elif vis_km <= 2.0:
                blizzard_score += 15

        blizzard_prob = min(100, blizzard_score)
        if blizzard_prob >= 75:
            blizzard_risk = "CRITICAL"
        elif blizzard_prob >= 50:
            blizzard_risk = "HIGH"
        elif blizzard_prob >= 25:
            blizzard_risk = "MODERATE"
        else:
            blizzard_risk = "LOW"

        # Rule-based Alert Evaluation
        alert_level, alert_title, alert_desc, active_factors = self._evaluate_alerts(
            temp_c, wind_ms, gust_ms, wind_chill, pressure_hpa, vis_km, blizzard_prob, station_info["name"]
        )

        extreme_weather = alert_level in ("WARNING", "CRITICAL") or blizzard_risk in ("HIGH", "CRITICAL")

        # Construct Components
        location = LocationMetadata(
            station_name=station_info["name"],
            station_code=station_info.get("code", "ST"),
            latitude=station_info["latitude"],
            longitude=station_info["longitude"],
            elevation_m=station_info.get("elevation_m", 0.0),
            region=station_info.get("region", "East Antarctica"),
        )

        current = CurrentEnvironment(
            temperature_c=temp_c,
            pressure_hpa=pressure_hpa,
            humidity_percent=humidity_pct,
            wind_speed_ms=wind_ms,
            wind_speed_kmh=wind_kmh,
            wind_direction_deg=wind_deg,
            wind_direction_cardinal=wind_cardinal,
            wind_gust_ms=gust_ms,
            wind_gust_kmh=gust_kmh,
            precipitation_mm=precip_mm,
            snowfall_cm=snow_cm,
            cloud_cover_percent=cloud_pct,
            visibility_km=vis_km,
        )

        conditions = WeatherConditions(
            weather=w_text,
            weather_code=w_code,
            is_snowing=is_snow,
            extreme_weather=extreme_weather,
        )

        polar_indices = PolarIndices(
            wind_chill_c=wind_chill,
            freezing_severity=freezing_cat,
            blizzard_risk=blizzard_risk,
            blizzard_probability_percent=blizzard_prob,
        )

        alert = EnvironmentAlert(
            level=alert_level,
            title=alert_title,
            description=alert_desc,
            active_factors=active_factors,
        )

        source = EnvironmentSource(
            provider="Open-Meteo Polar Weather API",
            model_type="ECMWF IFS / DWD ICON Polar Model Ensemble",
            is_live=True,
            telemetry_mode="EXTERNAL_NUMERICAL_WEATHER_MODEL",
            station_sensors_connected=False,
            notes=(
                "Real-time meteorological forecast/model observations for Antarctic coordinates. "
                "Station hardware sensor telemetry will integrate directly when satellite datalink is active."
            ),
        )

        obs_time = str(current_raw.get("time", datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M")))
        retrieved_at = datetime.now(timezone.utc).isoformat()

        return EnvironmentResponse(
            success=True,
            station=station_info["name"],
            location=location,
            current=current,
            conditions=conditions,
            polar_indices=polar_indices,
            alert=alert,
            timestamp=obs_time,
            retrieved_at=retrieved_at,
            cache_age_seconds=0,
            source=source,
        )

    def _evaluate_alerts(
        self,
        temp_c: Optional[float],
        wind_ms: Optional[float],
        gust_ms: Optional[float],
        wind_chill_c: Optional[float],
        pressure_hpa: Optional[float],
        vis_km: Optional[float],
        blizzard_prob: int,
        station_name: str
    ) -> Tuple[str, str, str, list]:
        """Assess alert level based on centralized thresholds."""
        factors = []
        is_critical = False
        is_warning = False
        is_watch = False

        # Temperature checks
        t_thresh = self.thresholds.get("temperature", {})
        if temp_c is not None:
            if temp_c <= t_thresh.get("extreme_cold_critical_c", -35.0):
                factors.append(f"Extreme Ambient Temperature ({temp_c}°C)")
                is_critical = True
            elif temp_c <= t_thresh.get("severe_cold_warning_c", -25.0):
                factors.append(f"Severe Sub-Zero Temperature ({temp_c}°C)")
                is_warning = True
            elif temp_c <= t_thresh.get("cold_watch_c", -15.0):
                factors.append(f"Polar Cold Conditions ({temp_c}°C)")
                is_watch = True

        # Wind speed & gust checks
        w_thresh = self.thresholds.get("wind_speed_ms", {})
        if wind_ms is not None:
            if wind_ms >= w_thresh.get("hurricane_force_critical_ms", 32.7):
                factors.append(f"Hurricane-Force Katabatic Wind ({wind_ms} m/s)")
                is_critical = True
            elif wind_ms >= w_thresh.get("storm_force_warning_ms", 24.5):
                factors.append(f"Storm-Force Wind Velocity ({wind_ms} m/s)")
                is_warning = True
            elif wind_ms >= w_thresh.get("gale_watch_ms", 17.2):
                factors.append(f"Gale-Force Wind Velocity ({wind_ms} m/s)")
                is_watch = True

        # Wind Chill checks
        wc_thresh = self.thresholds.get("wind_chill_c", {})
        if wind_chill_c is not None:
            if wind_chill_c <= wc_thresh.get("extreme_danger_critical_c", -45.0):
                factors.append(f"Extreme Wind Chill Risk ({wind_chill_c}°C)")
                is_critical = True
            elif wind_chill_c <= wc_thresh.get("severe_danger_warning_c", -35.0):
                factors.append(f"Severe Wind Chill ({wind_chill_c}°C)")
                is_warning = True

        # Blizzard triggers
        if blizzard_prob >= 75:
            factors.append(f"Imminent Blizzard Threat ({blizzard_prob}% probability)")
            is_critical = True
        elif blizzard_prob >= 50:
            factors.append(f"Elevated Blizzard Risk ({blizzard_prob}% probability)")
            is_warning = True

        # Visibility checks
        v_thresh = self.thresholds.get("visibility_km", {})
        if vis_km is not None:
            if vis_km <= v_thresh.get("zero_whiteout_critical_km", 0.2):
                factors.append(f"Whiteout Hazard: Visibility {vis_km} km")
                is_critical = True
            elif vis_km <= v_thresh.get("restricted_warning_km", 1.0):
                factors.append(f"Restricted Visibility: {vis_km} km")
                is_warning = True

        if is_critical:
            return (
                "CRITICAL",
                f"CRITICAL POLAR WEATHER ALERT — {station_name.upper()}",
                "Extreme meteorological conditions active. Halt outdoor vehicular operations. Secure station exterior and activate severe weather protocols.",
                factors,
            )
        elif is_warning:
            return (
                "WARNING",
                f"WEATHER WARNING — {station_name.upper()}",
                "Challenging polar conditions detected. Exercise caution for external sorties. Monitor heating plant and power grid stability.",
                factors,
            )
        elif is_watch:
            return (
                "WATCH",
                f"ENVIRONMENTAL WATCH — {station_name.upper()}",
                "Elevated wind or cold detected. Station operations remain nominal within expected Antarctic seasonal parameters.",
                factors,
            )
        else:
            return (
                "NORMAL",
                f"NOMINAL CONDITIONS — {station_name.upper()}",
                "Environmental parameters are within standard operating limits for Antarctic coastal station operations.",
                factors,
            )


# Singleton Instance
_service_instance: Optional[EnvironmentService] = None


def get_environment_service() -> EnvironmentService:
    global _service_instance
    if _service_instance is None:
        _service_instance = EnvironmentService()
    return _service_instance

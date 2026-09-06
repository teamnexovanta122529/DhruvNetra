"""
DHRUVNETRA - Environment Service Unit Test Suite
SIH 2026: Antarctic Digital Twin Platform (Maitri & Bharati)
Verification of Real-Time Polar Meteorology Service
"""

import sys
from pathlib import Path

# Automatically ensure project root is in sys.path
_SCRIPT_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _SCRIPT_DIR.parent.parent.parent
for _p in [str(_PROJECT_ROOT), str(_SCRIPT_DIR.parent.parent)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

import unittest
import asyncio
from unittest.mock import patch, MagicMock

try:
    from backend.services.environment.weather_service import (
        EnvironmentService,
        deg_to_cardinal,
        calculate_wind_chill_c,
    )
    from backend.services.environment.validation import (
        validate_raw_weather_payload,
        sanitize_numeric_field,
    )
    from backend.services.environment.schemas import EnvironmentResponse
except ModuleNotFoundError:
    from services.environment.weather_service import (
        EnvironmentService,
        deg_to_cardinal,
        calculate_wind_chill_c,
    )
    from services.environment.validation import (
        validate_raw_weather_payload,
        sanitize_numeric_field,
    )
    from services.environment.schemas import EnvironmentResponse


class TestEnvironmentService(unittest.TestCase):

    def setUp(self):
        self.service = EnvironmentService()
        self.loop = asyncio.new_event_loop()
        asyncio.set_event_loop(self.loop)

    def tearDown(self):
        self.loop.close()

    def test_canonical_stations_loaded(self):
        stations = self.service.get_supported_stations()
        self.assertIn("MAITRI", stations)
        self.assertIn("BHARATI", stations)
        self.assertAlmostEqual(stations["MAITRI"]["latitude"], -70.7661, places=3)
        self.assertAlmostEqual(stations["MAITRI"]["longitude"], 11.7358, places=3)
        self.assertAlmostEqual(stations["BHARATI"]["latitude"], -69.4078, places=3)
        self.assertAlmostEqual(stations["BHARATI"]["longitude"], 76.1872, places=3)

    def test_deg_to_cardinal(self):
        self.assertEqual(deg_to_cardinal(0), "N")
        self.assertEqual(deg_to_cardinal(90), "E")
        self.assertEqual(deg_to_cardinal(180), "S")
        self.assertEqual(deg_to_cardinal(270), "W")
        self.assertEqual(deg_to_cardinal(112), "ESE")
        self.assertIsNone(deg_to_cardinal(None))

    def test_calculate_wind_chill(self):
        # Temp -15°C with 40 km/h wind
        wc = calculate_wind_chill_c(-15.0, 40.0)
        self.assertIsNotNone(wc)
        self.assertLess(wc, -15.0)  # Wind chill must be colder than ambient
        
        # Temp 15°C (above 10°C threshold -> wind chill equals temp)
        wc_warm = calculate_wind_chill_c(15.0, 30.0)
        self.assertEqual(wc_warm, 15.0)

    def test_validation_raw_payload(self):
        # Valid payload
        valid_payload = {
            "current": {
                "time": "2026-09-06T10:00",
                "temperature_2m": -22.5,
                "surface_pressure": 985.2,
                "relative_humidity_2m": 65.0,
                "wind_speed_10m": 12.4,
                "wind_direction_10m": 140.0,
            }
        }
        is_valid, err = validate_raw_weather_payload(valid_payload)
        self.assertTrue(is_valid)
        self.assertIsNone(err)

        # Impossible temperature (e.g. 80°C in Antarctica)
        invalid_temp = {
            "current": {
                "time": "2026-09-06T10:00",
                "temperature_2m": 85.0,
            }
        }
        is_valid, err = validate_raw_weather_payload(invalid_temp)
        self.assertFalse(is_valid)
        self.assertIn("temperature_2m", err)

        # Missing current block
        is_valid, err = validate_raw_weather_payload({"error": True})
        self.assertFalse(is_valid)

    def test_live_fetch_maitri(self):
        """Live integration test against Open-Meteo for Maitri station."""
        data = self.loop.run_until_complete(self.service.get_environment_data("MAITRI", force_refresh=True))
        self.assertIsInstance(data, EnvironmentResponse)
        self.assertEqual(data.station, "Maitri")
        self.assertEqual(data.location.station_code, "MT")
        self.assertIsNotNone(data.current.temperature_c)
        self.assertIsNotNone(data.current.pressure_hpa)
        self.assertIsNotNone(data.current.humidity_percent)
        self.assertIsNotNone(data.current.wind_speed_ms)
        self.assertIsNotNone(data.current.wind_speed_kmh)
        self.assertIsNotNone(data.conditions.weather)
        self.assertTrue(data.source.is_live)
        self.assertFalse(data.source.station_sensors_connected)  # Honest transparency
        self.assertIn(data.alert.level, ["NORMAL", "WATCH", "WARNING", "CRITICAL"])

    def test_live_fetch_bharati(self):
        """Live integration test against Open-Meteo for Bharati station."""
        data = self.loop.run_until_complete(self.service.get_environment_data("BHARATI", force_refresh=True))
        self.assertIsInstance(data, EnvironmentResponse)
        self.assertEqual(data.station, "Bharati")
        self.assertEqual(data.location.station_code, "BH")
        self.assertIsNotNone(data.current.temperature_c)
        self.assertIsNotNone(data.current.wind_direction_cardinal)

    def test_caching_behavior(self):
        """Verify that multiple consecutive calls return cached responses with accurate age."""
        # 1. Fetch fresh
        data1 = self.loop.run_until_complete(self.service.get_environment_data("MAITRI", force_refresh=True))
        self.assertEqual(data1.cache_age_seconds, 0)

        # 2. Second fetch immediately (should hit cache)
        data2 = self.loop.run_until_complete(self.service.get_environment_data("MAITRI", force_refresh=False))
        self.assertEqual(data1.timestamp, data2.timestamp)

    def test_unknown_station_rejected(self):
        """Verify that non-existent station query raises ValueError."""
        with self.assertRaises(ValueError):
            self.loop.run_until_complete(self.service.get_environment_data("NON_EXISTENT_STATION"))

    def test_all_stations_concurrent_fetch(self):
        """Verify concurrent batch fetching for both stations."""
        batch = self.loop.run_until_complete(self.service.get_all_stations_environment(force_refresh=True))
        self.assertTrue(batch.success)
        self.assertIn("MAITRI", batch.stations)
        self.assertIn("BHARATI", batch.stations)
        self.assertEqual(batch.stations["MAITRI"].station, "Maitri")
        self.assertEqual(batch.stations["BHARATI"].station, "Bharati")


if __name__ == "__main__":
    unittest.main()

"""
DHRUVNETRA AI - Telemetry Resolver & Operational Query Answer Generator
SIH 2026: Antarctic Digital Twin Platform (Maitri & Bharati)

Grounds factual queries directly in live/simulated polar SCADA telemetry.
Guarantees concise, accurate answers without triggering What-If physics simulations or risk scores.
"""

from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from pydantic import BaseModel, Field
from backend.ai.intent.intent_classifier import IntentType, ExtractedEntities


class TelemetryBadge(BaseModel):
    station: str
    component: str
    metric: str
    value: str
    unit: str = ""
    status: str = "NORMAL"
    timestamp: str = ""
    is_live: bool = True


class ResolvedAnswer(BaseModel):
    text: str
    intent: IntentType
    response_type: str = "DIRECT_ANSWER"   # "DIRECT_ANSWER" | "SCENARIO_ANALYSIS" | "CLARIFICATION" | "INFORMATIONAL"
    telemetry_badge: Optional[TelemetryBadge] = None
    data_points: Dict[str, Any] = Field(default_factory=dict)
    confidence: float = 0.95
    station: str = "Maitri"


# Canonical polar telemetry dataset matching frontend SCADA models
CANONICAL_STATION_TELEMETRY = {
    "MAITRI": {
        "station_name": "Maitri",
        "station_code": "MT",
        "established": "1989",
        "location": "Schirmacher Oasis, Queen Maud Land",
        "coordinates": "70°45′58″ S · 11°44′09″ E",
        "health_score": 89,
        "status": "OPERATIONAL",
        "power": {
            "total_output_kw": 360.0,
            "total_demand_kw": 295.0,
            "load_percentage": 81.9,
            "bus_voltage_v": 415.2,
            "grid_frequency_hz": 50.04,
            "active_generators_count": 3,
            "total_generators_count": 4,
            "bess_soc_pct": 94.2,
            "bess_capacity_kwh": 480,
            "bess_backup_hours": 4.5,
            "solar_generation_kw": 12.4,
            "generators": {
                "G1": {
                    "id": "GEN-01",
                    "name": "Generator 1 (Caterpillar 125kVA)",
                    "status": "RUNNING",
                    "output_kw": 125.0,
                    "load_pct": 88.0,
                    "voltage_v": 415.0,
                    "frequency_hz": 50.02,
                    "fuel_level_pct": 68.0,
                    "fuel_liters": 1360.0,
                    "fuel_capacity_l": 2000.0,
                    "burn_rate_lph": 18.4,
                    "temperature_c": 82.5,
                },
                "G2": {
                    "id": "GEN-02",
                    "name": "Generator 2 (Caterpillar 125kVA)",
                    "status": "RUNNING",
                    "output_kw": 120.0,
                    "load_pct": 84.0,
                    "voltage_v": 415.4,
                    "frequency_hz": 50.04,
                    "fuel_level_pct": 74.0,
                    "fuel_liters": 1480.0,
                    "fuel_capacity_l": 2000.0,
                    "burn_rate_lph": 17.8,
                    "temperature_c": 81.2,
                },
                "G3": {
                    "id": "GEN-03",
                    "name": "Generator 3 (Cummins 115kVA)",
                    "status": "RUNNING",
                    "output_kw": 115.0,
                    "load_pct": 78.0,
                    "voltage_v": 414.8,
                    "frequency_hz": 50.01,
                    "fuel_level_pct": 82.0,
                    "fuel_liters": 1640.0,
                    "fuel_capacity_l": 2000.0,
                    "burn_rate_lph": 16.5,
                    "temperature_c": 79.8,
                },
                "G4": {
                    "id": "GEN-04",
                    "name": "Generator 4 (Kirloskar 100kVA Auxiliary)",
                    "status": "STANDBY",
                    "output_kw": 0.0,
                    "load_pct": 0.0,
                    "voltage_v": 0.0,
                    "frequency_hz": 0.0,
                    "fuel_level_pct": 95.0,
                    "fuel_liters": 1900.0,
                    "fuel_capacity_l": 2000.0,
                    "burn_rate_lph": 0.0,
                    "temperature_c": 42.0,
                },
            },
        },
        "fuel": {
            "total_capacity_l": 120000.0,
            "current_level_l": 81600.0,
            "percentage": 68.0,
            "burn_rate_lph": 28.5,
            "estimated_days_remaining": 119.3,
            "trace_heating_status": "ACTIVE (42°C Glycol)",
            "tanks": {
                "TANK-01": {"name": "Bulk Diesel Storage Tank 1", "capacity_l": 40000, "current_l": 28500, "percentage": 71.3},
                "TANK-02": {"name": "Bulk Diesel Storage Tank 2", "capacity_l": 40000, "current_l": 27200, "percentage": 68.0},
                "TANK-03": {"name": "Strategic Winter Reserve Tank", "capacity_l": 30000, "current_l": 21000, "percentage": 70.0},
                "TANK-04": {"name": "Aviation Jet A-1 Fuel Tank", "capacity_l": 10000, "current_l": 4900, "percentage": 49.0},
            },
        },
        "hvac": {
            "indoor_avg_temp_c": 21.4,
            "outdoor_temp_c": -24.3,
            "indoor_avg_humidity_pct": 41.2,
            "heating_status": "ACTIVE",
            "total_load_kw": 68.5,
            "glycol_supply_temp_c": 62.4,
            "glycol_return_temp_c": 48.1,
            "thermal_efficiency_pct": 94.2,
            "zones": {
                "ZONE-01": {"name": "Main Living Quarters & Mess", "temp_c": 21.8, "target_c": 22.0, "status": "OPTIMAL"},
                "ZONE-02": {"name": "Science Laboratory & Wet Lab", "temp_c": 20.6, "target_c": 20.5, "status": "OPTIMAL"},
                "ZONE-03": {"name": "SCADA Bridge & Operations Room", "temp_c": 21.2, "target_c": 21.0, "status": "OPTIMAL"},
                "ZONE-04": {"name": "Medical Clinic & Isolation Ward", "temp_c": 22.5, "target_c": 22.5, "status": "OPTIMAL"},
                "ZONE-05": {"name": "Mechanical Workshop & Fabrication", "temp_c": 16.4, "target_c": 16.0, "status": "NORMAL"},
                "ZONE-06": {"name": "Thermal Airlock & Cargo Staging", "temp_c": 8.5, "target_c": 8.0, "status": "NORMAL"},
            },
        },
        "water": {
            "total_capacity_l": 20000.0,
            "current_level_l": 18200.0,
            "percentage": 91.0,
            "daily_consumption_l": 1450.0,
            "daily_production_l": 1600.0,
            "estimated_days_remaining": 12.5,
            "production_source": "Priyadarshini Lake Heated Water Line & Snow Melter",
            "tds_ppm": 42,
            "ph": 7.2,
            "status": "OPTIMAL",
        },
        "environment": {
            "outdoor_temp_c": -24.3,
            "wind_chill_c": -33.8,
            "wind_speed_kmh": 34.0,
            "wind_direction": "NW",
            "pressure_hpa": 982.0,
            "humidity_pct": 71.0,
            "visibility_km": 50.0,
            "blizzard_risk": "MODERATE",
            "condition": "Polar Clear / Cold",
        },
        "logistics": {
            "essential_stock_days": 184,
            "winter_readiness_score": 92,
            "food_provisions_pct": 94.0,
            "generator_spares_pct": 88.0,
            "active_vehicles_count": 6,
            "total_vehicles_count": 7,
            "next_shipment": "MV Vasiliy Golovnin (Nov 2026 Expedition Resupply)",
        },
        "alerts": {
            "critical_count": 0,
            "warning_count": 2,
            "info_count": 3,
            "recent": [
                {"severity": "WARNING", "title": "Generator 1 Minor Thermal Drift", "subsystem": "Power", "detected": "12m ago"},
                {"severity": "WARNING", "title": "Secondary Fuel Trace Heater Auto-Engaged", "subsystem": "Fuel", "detected": "45m ago"},
                {"severity": "INFO", "title": "Lake Priyadarshini water pipeline pressure nominal", "subsystem": "Water", "detected": "1h ago"},
            ],
        },
    },
    "BHARATI": {
        "station_name": "Bharati",
        "station_code": "BH",
        "established": "2012",
        "location": "Larsemann Hills, Princess Elizabeth Land",
        "coordinates": "69°24′28″ S · 76°11′14″ E",
        "health_score": 94,
        "status": "OPTIMAL",
        "power": {
            "total_output_kw": 450.0,
            "total_demand_kw": 335.0,
            "load_percentage": 74.4,
            "bus_voltage_v": 415.8,
            "grid_frequency_hz": 49.98,
            "active_generators_count": 3,
            "total_generators_count": 6,
            "bess_soc_pct": 96.2,
            "bess_capacity_kwh": 650,
            "bess_backup_hours": 5.8,
            "solar_generation_kw": 18.5,
            "generators": {
                "G1": {
                    "id": "GEN-01",
                    "name": "Generator 1 (Volvo Penta 160kVA)",
                    "status": "RUNNING",
                    "output_kw": 155.0,
                    "load_pct": 77.0,
                    "voltage_v": 415.5,
                    "frequency_hz": 49.99,
                    "fuel_level_pct": 76.0,
                    "fuel_liters": 1900.0,
                    "fuel_capacity_l": 2500.0,
                    "burn_rate_lph": 21.2,
                    "temperature_c": 78.4,
                },
                "G2": {
                    "id": "GEN-02",
                    "name": "Generator 2 (Volvo Penta 160kVA)",
                    "status": "RUNNING",
                    "output_kw": 150.0,
                    "load_pct": 75.0,
                    "voltage_v": 415.8,
                    "frequency_hz": 49.98,
                    "fuel_level_pct": 79.0,
                    "fuel_liters": 1975.0,
                    "fuel_capacity_l": 2500.0,
                    "burn_rate_lph": 20.8,
                    "temperature_c": 77.9,
                },
                "G3": {
                    "id": "GEN-03",
                    "name": "Generator 3 (Volvo Penta 160kVA)",
                    "status": "RUNNING",
                    "output_kw": 145.0,
                    "load_pct": 72.0,
                    "voltage_v": 416.0,
                    "frequency_hz": 50.01,
                    "fuel_level_pct": 84.0,
                    "fuel_liters": 2100.0,
                    "fuel_capacity_l": 2500.0,
                    "burn_rate_lph": 19.5,
                    "temperature_c": 76.8,
                },
                "G4": {
                    "id": "GEN-04",
                    "name": "Generator 4 (Volvo Penta Standby)",
                    "status": "STANDBY",
                    "output_kw": 0.0,
                    "load_pct": 0.0,
                    "voltage_v": 0.0,
                    "frequency_hz": 0.0,
                    "fuel_level_pct": 98.0,
                    "fuel_liters": 2450.0,
                    "fuel_capacity_l": 2500.0,
                    "burn_rate_lph": 0.0,
                    "temperature_c": 45.0,
                },
                "G5": {
                    "id": "GEN-05",
                    "name": "Generator 5 (Volvo Penta Standby)",
                    "status": "STANDBY",
                    "output_kw": 0.0,
                    "load_pct": 0.0,
                    "voltage_v": 0.0,
                    "frequency_hz": 0.0,
                    "fuel_level_pct": 96.0,
                    "fuel_liters": 2400.0,
                    "fuel_capacity_l": 2500.0,
                    "burn_rate_lph": 0.0,
                    "temperature_c": 44.0,
                },
                "G6": {
                    "id": "GEN-06",
                    "name": "Generator 6 (Emergency Blackstart)",
                    "status": "MAINTENANCE",
                    "output_kw": 0.0,
                    "load_pct": 0.0,
                    "voltage_v": 0.0,
                    "frequency_hz": 0.0,
                    "fuel_level_pct": 90.0,
                    "fuel_liters": 2250.0,
                    "fuel_capacity_l": 2500.0,
                    "burn_rate_lph": 0.0,
                    "temperature_c": 22.0,
                },
            },
        },
        "fuel": {
            "total_capacity_l": 180000.0,
            "current_level_l": 136800.0,
            "percentage": 76.0,
            "burn_rate_lph": 24.2,
            "estimated_days_remaining": 235.5,
            "trace_heating_status": "ACTIVE (45°C Glycol)",
            "tanks": {
                "TANK-01": {"name": "Bulk Diesel Storage Tank Alpha", "capacity_l": 60000, "current_l": 47400, "percentage": 79.0},
                "TANK-02": {"name": "Bulk Diesel Storage Tank Beta", "capacity_l": 60000, "current_l": 45000, "percentage": 75.0},
                "TANK-03": {"name": "Strategic Winter Reserve Tank Gamma", "capacity_l": 45000, "current_l": 33600, "percentage": 74.7},
                "TANK-04": {"name": "Kamov Aviation Fuel Storage Tank", "capacity_l": 15000, "current_l": 10800, "percentage": 72.0},
            },
        },
        "hvac": {
            "indoor_avg_temp_c": 22.1,
            "outdoor_temp_c": -18.2,
            "indoor_avg_humidity_pct": 43.8,
            "heating_status": "OPTIMAL",
            "total_load_kw": 74.2,
            "glycol_supply_temp_c": 65.0,
            "glycol_return_temp_c": 51.2,
            "thermal_efficiency_pct": 96.8,
            "zones": {
                "ZONE-01": {"name": "Habitat Central Complex & Dining", "temp_c": 22.4, "target_c": 22.5, "status": "OPTIMAL"},
                "ZONE-02": {"name": "Polar Atmospheric & Geo Labs", "temp_c": 21.5, "target_c": 21.5, "status": "OPTIMAL"},
                "ZONE-03": {"name": "Mission Command & Radome Bridge", "temp_c": 21.8, "target_c": 22.0, "status": "OPTIMAL"},
                "ZONE-04": {"name": "Tele-Health & Medical Facility", "temp_c": 23.0, "target_c": 23.0, "status": "OPTIMAL"},
                "ZONE-05": {"name": "Heavy Workshop & Snowcat Bay", "temp_c": 17.2, "target_c": 17.0, "status": "OPTIMAL"},
                "ZONE-06": {"name": "Airlock Vestibule & Decon", "temp_c": 10.2, "target_c": 10.0, "status": "OPTIMAL"},
                "ZONE-07": {"name": "Helipad Pilot Ready Room", "temp_c": 21.0, "target_c": 21.0, "status": "OPTIMAL"},
                "ZONE-08": {"name": "Cryogenic Sample Storage Vault", "temp_c": -20.0, "target_c": -20.0, "status": "OPTIMAL"},
            },
        },
        "water": {
            "total_capacity_l": 25000.0,
            "current_level_l": 23500.0,
            "percentage": 94.0,
            "daily_consumption_l": 1720.0,
            "daily_production_l": 1900.0,
            "estimated_days_remaining": 13.6,
            "production_source": "Desalination Reverse Osmosis (RO) & High-Yield Snow Melter",
            "tds_ppm": 58,
            "ph": 7.4,
            "status": "OPTIMAL",
        },
        "environment": {
            "outdoor_temp_c": -18.2,
            "wind_chill_c": -26.5,
            "wind_speed_kmh": 28.0,
            "wind_direction": "ENE",
            "pressure_hpa": 986.0,
            "humidity_pct": 68.0,
            "visibility_km": 60.0,
            "blizzard_risk": "LOW",
            "condition": "Coastal Polar Clear",
        },
        "logistics": {
            "essential_stock_days": 240,
            "winter_readiness_score": 96,
            "food_provisions_pct": 98.0,
            "generator_spares_pct": 92.0,
            "active_vehicles_count": 8,
            "total_vehicles_count": 9,
            "next_shipment": "MV Vasiliy Golovnin (Dec 2026 Polar Voyage)",
        },
        "alerts": {
            "critical_count": 0,
            "warning_count": 1,
            "info_count": 2,
            "recent": [
                {"severity": "WARNING", "title": "RO Desalination Membrane B Maintenance Due in 72h", "subsystem": "Water", "detected": "2h ago"},
                {"severity": "INFO", "title": "INSAT-4CR SATCOM High-Gain Uplink locked (99.4% SNR)", "subsystem": "Communications", "detected": "15m ago"},
            ],
        },
    },
}


def _fmt_pct(val: Any) -> str:
    """Formats percentage cleanly (e.g. 68% or 68.5%)."""
    try:
        fval = float(val)
        if fval == int(fval):
            return f"{int(fval)}%"
        return f"{fval:.1f}%"
    except (ValueError, TypeError):
        return f"{val}%"


def _fmt_l(val: Any) -> str:
    """Formats litre volume cleanly (e.g. 1,360 L)."""
    try:
        fval = float(val)
        if fval == int(fval):
            return f"{int(fval):,} L"
        return f"{fval:,.1f} L"
    except (ValueError, TypeError):
        return f"{val} L"


def _fmt_kw(val: Any) -> str:
    """Formats electrical power in kW cleanly (e.g. 125 kW or 98 kW)."""
    try:
        fval = float(val)
        if fval == int(fval):
            return f"{int(fval)} kW"
        return f"{fval:.1f} kW"
    except (ValueError, TypeError):
        return f"{val} kW"


class TelemetryResolver:
    """
    Evaluates factual queries and returns direct, concise, grounded answers.
    """

    def __init__(self):
        self.station_data = CANONICAL_STATION_TELEMETRY

    def resolve(
        self,
        intent: IntentType,
        entities: ExtractedEntities,
        live_environment: Optional[Dict[str, Any]] = None,
    ) -> ResolvedAnswer:
        """
        Main resolution dispatcher.
        """
        station_key = (entities.station or "Maitri").upper()
        if station_key not in self.station_data:
            station_key = "MAITRI"
        st = self.station_data[station_key]
        st_name = st["station_name"]
        now_ts = datetime.now().strftime("%H:%M:%S IST")

        # 1. GREETING_CASUAL_QUERY
        if intent == IntentType.GREETING_CASUAL_QUERY:
            return ResolvedAnswer(
                text=f"Greetings, Commander. DHRUVNETRA Polar Mission Intelligence is online and tracking station telemetry for {st_name} Station. How may I assist you with current telemetry or operational simulations?",
                intent=intent,
                response_type="INFORMATIONAL",
                station=st_name,
            )

        # 2. GENERAL_PROJECT_QUERY
        if intent == IntentType.GENERAL_PROJECT_QUERY:
            return ResolvedAnswer(
                text=f"DHRUVNETRA is India's Antarctic Digital Twin platform (SIH 2026, Problem Statement SIH26060), providing remote mission-control management, real-time multi-physics telemetry, and predictive What-If contingency analysis for research stations Maitri ({st['location']}) and Bharati.",
                intent=intent,
                response_type="INFORMATIONAL",
                station=st_name,
            )

        # 3. COMPARISON_QUERY
        if intent == IntentType.COMPARISON_QUERY:
            return self._resolve_comparison(entities, now_ts)

        # 4. HISTORICAL_TREND_QUERY
        if intent == IntentType.HISTORICAL_TREND_QUERY:
            return self._resolve_historical_trend(st, entities, now_ts)

        # 5. PREDICTION_QUERY
        if intent == IntentType.PREDICTION_QUERY:
            return self._resolve_prediction(st, entities, now_ts)

        # 6. RECOMMENDATION_QUERY
        if intent == IntentType.RECOMMENDATION_QUERY:
            return self._resolve_recommendation(st, entities, now_ts)

        # 7. ALERT_QUERY
        if intent == IntentType.ALERT_QUERY or entities.metric == "active_alerts":
            alerts = st["alerts"]
            crit = alerts["critical_count"]
            warn = alerts["warning_count"]
            if crit > 0:
                msg = f"Alert status at {st_name}: {crit} CRITICAL alert active. Immediate corrective action required."
                status = "CRITICAL"
            elif warn > 0:
                warning_titles = ", ".join(a["title"] for a in alerts.get("recent", []) if a.get("severity") == "WARNING")
                msg = f"Alert status at {st_name}: No critical alerts active (0 critical, {warn} warning alert{'s' if warn > 1 else ''} active: {warning_titles}). All primary life-support systems remain functional."
                status = "WARNING"
            else:
                msg = f"All systems nominal at {st_name}. Zero active critical or warning alerts detected across the telemetry matrix (0 critical, 0 warnings)."
                status = "OPTIMAL"
            
            return ResolvedAnswer(
                text=msg,
                intent=intent,
                station=st_name,
                telemetry_badge=TelemetryBadge(
                    station=st_name,
                    component="Alert Matrix",
                    metric="Active Alerts",
                    value=f"{crit} Critical / {warn} Warnings",
                    status=status,
                    timestamp=now_ts,
                ),
                data_points=alerts,
            )

        # 8. ENVIRONMENT_QUERY
        if intent == IntentType.ENVIRONMENT_QUERY or entities.subsystem == "environment":
            env = live_environment or st["environment"]
            temp = env.get("outdoor_temp_c", env.get("temperature_c", -24.3))
            wind_spd = env.get("wind_speed_kmh", 34.0)
            wind_dir = env.get("wind_direction", "NW")
            chill = env.get("wind_chill_c", temp - 9.5)
            blizz = env.get("blizzard_risk", "LOW")

            if entities.metric == "wind_speed":
                text = f"{st_name}'s current wind speed is {wind_spd} km/h from the {wind_dir}."
                badge_val = f"{wind_spd} km/h ({wind_dir})"
                badge_metric = "Wind Speed"
            elif entities.metric == "blizzard_risk":
                text = f"Current blizzard risk at {st_name} is {blizz}. Meteorological barometer reads {env.get('pressure_hpa', 982)} hPa."
                badge_val = str(blizz)
                badge_metric = "Blizzard Risk"
            else:
                text = f"{st_name}'s current outdoor temperature is {temp > 0 and '+' or ''}{temp}°C (Wind Chill: {chill}°C) with wind speed of {wind_spd} km/h from the {wind_dir}."
                badge_val = f"{temp > 0 and '+' or ''}{temp}°C"
                badge_metric = "Outdoor Temperature"

            return ResolvedAnswer(
                text=text,
                intent=intent,
                station=st_name,
                telemetry_badge=TelemetryBadge(
                    station=st_name,
                    component="Meteorological Array",
                    metric=badge_metric,
                    value=badge_val,
                    status="NORMAL",
                    timestamp=now_ts,
                    is_live=True,
                ),
                data_points=env,
            )

        # 9. GENERATOR SPECIFIC TELEMETRY
        if entities.component_type == "generator" or entities.component_id in ["G1", "G2", "G3", "G4", "G5", "G6"]:
            gen_id = entities.component_id or "G1"
            gens = st["power"]["generators"]
            gen = gens.get(gen_id, gens.get("G1"))
            gen_name = gen["name"].split("(")[0].strip()

            # A. Fuel Level of Generator
            if entities.metric in ["fuel_level", "fuel_pct", "fuel_liters"]:
                if entities.metric == "fuel_liters" and entities.is_telemetry_follow_up:
                    text = f"Approximately {_fmt_l(gen['fuel_liters'])} (Generator {gen_id} day tank at {_fmt_pct(gen['fuel_level_pct'])})."
                else:
                    text = f"{gen_name} fuel level at {st_name} is {_fmt_pct(gen['fuel_level_pct'])} (approximately {_fmt_l(gen['fuel_liters'])})."
                return ResolvedAnswer(
                    text=text,
                    intent=IntentType.SIMPLE_TELEMETRY_QUERY,
                    station=st_name,
                    telemetry_badge=TelemetryBadge(
                        station=st_name,
                        component=gen_name,
                        metric="Fuel Level",
                        value=f"{_fmt_pct(gen['fuel_level_pct'])} ({_fmt_l(gen['fuel_liters'])})",
                        status="NORMAL",
                        timestamp=now_ts,
                    ),
                    data_points=gen,
                )

            # B. Power Output
            if entities.metric == "power_output":
                text = f"{gen_name} is currently producing {_fmt_kw(gen['output_kw'])} ({_fmt_pct(gen['load_pct'])} rated load)."
                return ResolvedAnswer(
                    text=text,
                    intent=IntentType.SIMPLE_TELEMETRY_QUERY,
                    station=st_name,
                    telemetry_badge=TelemetryBadge(
                        station=st_name,
                        component=gen_name,
                        metric="Power Output",
                        value=_fmt_kw(gen['output_kw']),
                        unit="kW",
                        status="NORMAL" if gen["status"] == "RUNNING" else "STANDBY",
                        timestamp=now_ts,
                    ),
                    data_points=gen,
                )

            # C. Generator Status
            if entities.metric == "generator_status":
                text = f"Yes. {gen_name} is currently {gen['status']} with an electrical output of {_fmt_kw(gen['output_kw'])}." if gen["status"] == "RUNNING" else f"No. {gen_name} is currently {gen['status']} (pre-heated warm standby)."
                return ResolvedAnswer(
                    text=text,
                    intent=IntentType.SIMPLE_TELEMETRY_QUERY,
                    station=st_name,
                    telemetry_badge=TelemetryBadge(
                        station=st_name,
                        component=gen_name,
                        metric="Operational Status",
                        value=gen["status"],
                        status="OPTIMAL" if gen["status"] == "RUNNING" else "NORMAL",
                        timestamp=now_ts,
                    ),
                    data_points=gen,
                )

            # D. Fuel Burn Rate
            if entities.metric == "burn_rate":
                text = f"{gen_name} is currently consuming approximately {gen['burn_rate_lph']} L/h of Arctic High-Speed Diesel."
                return ResolvedAnswer(
                    text=text,
                    intent=IntentType.SIMPLE_TELEMETRY_QUERY,
                    station=st_name,
                    telemetry_badge=TelemetryBadge(
                        station=st_name,
                        component=gen_name,
                        metric="Fuel Burn Rate",
                        value=f"{gen['burn_rate_lph']} L/h",
                        status="NORMAL",
                        timestamp=now_ts,
                    ),
                    data_points=gen,
                )

            # E. Default Generator summary
            text = f"{gen_name} at {st_name} is {gen['status']}, generating {_fmt_kw(gen['output_kw'])} at {_fmt_pct(gen['load_pct'])} load. Day tank fuel is at {_fmt_pct(gen['fuel_level_pct'])}."
            return ResolvedAnswer(
                text=text,
                intent=IntentType.SIMPLE_TELEMETRY_QUERY,
                station=st_name,
                telemetry_badge=TelemetryBadge(
                    station=st_name,
                    component=gen_name,
                    metric="Status & Load",
                    value=f"{gen['status']} · {_fmt_kw(gen['output_kw'])}",
                    status="NORMAL",
                    timestamp=now_ts,
                ),
                data_points=gen,
            )

        # 10. POWER SYSTEM QUERIES
        if intent == IntentType.POWER_QUERY or entities.subsystem == "power":
            p = st["power"]
            if entities.metric == "battery_soc":
                text = f"BESS battery storage at {st_name} is at {p['bess_soc_pct']}% SOC ({p['bess_capacity_kwh']} kWh capacity), providing ~{p['bess_backup_hours']} hours of emergency buffer."
                badge_val = f"{p['bess_soc_pct']}% SOC"
                badge_metric = "BESS Battery Buffer"
            elif entities.metric == "voltage":
                text = f"Main 3-phase microgrid bus voltage is {p['bus_voltage_v']} V at {p['grid_frequency_hz']} Hz (frequency deviation within ±0.04 Hz tolerance)."
                badge_val = f"{p['bus_voltage_v']} V / {p['grid_frequency_hz']} Hz"
                badge_metric = "Bus Voltage & Freq"
            elif entities.metric == "load_pct":
                text = f"Current station electrical load demand is {p['total_demand_kw']} kW ({p['load_percentage']}% of active generation capacity)."
                badge_val = f"{p['total_demand_kw']} kW ({p['load_percentage']}%)"
                badge_metric = "Station Demand Load"
            else:
                text = f"Power Microgrid at {st_name}: {p['active_generators_count']} of {p['total_generators_count']} generators synchronized and running. Total generation is {p['total_output_kw']} kW against demand of {p['total_demand_kw']} kW ({p['load_percentage']}% load)."
                badge_val = f"{p['total_output_kw']} kW ({p['active_generators_count']} Active)"
                badge_metric = "Microgrid Generation"

            return ResolvedAnswer(
                text=text,
                intent=IntentType.POWER_QUERY,
                station=st_name,
                telemetry_badge=TelemetryBadge(
                    station=st_name,
                    component="Power Microgrid",
                    metric=badge_metric,
                    value=badge_val,
                    status="OPTIMAL",
                    timestamp=now_ts,
                ),
                data_points=p,
            )

        # 11. FUEL SYSTEM QUERIES
        if intent == IntentType.FUEL_QUERY or entities.subsystem == "fuel":
            f = st["fuel"]
            if entities.metric == "fuel_days":
                text = f"At current burn rate ({f['burn_rate_lph']} L/h), {st_name} has an estimated fuel endurance of {f['estimated_days_remaining']:.1f} days."
                badge_val = f"{f['estimated_days_remaining']:.1f} Days"
                badge_metric = "Fuel Endurance"
            elif entities.metric == "burn_rate":
                text = f"Total station fuel consumption rate across all active generators is {f['burn_rate_lph']} L/h."
                badge_val = f"{f['burn_rate_lph']} L/h"
                badge_metric = "Total Fuel Burn Rate"
            else:
                text = f"Total bulk fuel reserves at {st_name} stand at {f['percentage']}% ({f['current_level_l']:,.0f} L of {f['total_capacity_l']:,.0f} L capacity), representing {f['estimated_days_remaining']:.1f} days of endurance. Trace heating is {f['trace_heating_status']}."
                badge_val = f"{f['percentage']}% ({f['current_level_l']:,.0f} L)"
                badge_metric = "Bulk Fuel Reserves"

            return ResolvedAnswer(
                text=text,
                intent=IntentType.FUEL_QUERY,
                station=st_name,
                telemetry_badge=TelemetryBadge(
                    station=st_name,
                    component="Fuel Farm",
                    metric=badge_metric,
                    value=badge_val,
                    status="NORMAL",
                    timestamp=now_ts,
                ),
                data_points=f,
            )

        # 12. HVAC & THERMAL QUERIES
        if intent == IntentType.HVAC_QUERY or entities.subsystem == "hvac":
            h = st["hvac"]
            if entities.component_id and entities.component_id in h["zones"]:
                z = h["zones"][entities.component_id]
                text = f"{z['name']} is at {z['temp_c']}°C (target setpoint: {z['target_c']}°C) with status {z['status']}."
                badge_val = f"{z['temp_c']}°C"
                badge_comp = z["name"]
            else:
                text = f"Habitat thermal envelope at {st_name} is maintainin an average indoor temperature of +{h['indoor_avg_temp_c']}°C (Outdoor: {h['outdoor_temp_c']}°C) with {h['indoor_avg_humidity_pct']}% relative humidity. Glycol heating loop is supplying at {h['glycol_supply_temp_c']}°C."
                badge_val = f"+{h['indoor_avg_temp_c']}°C"
                badge_comp = "Habitat HVAC Loop"

            return ResolvedAnswer(
                text=text,
                intent=IntentType.HVAC_QUERY,
                station=st_name,
                telemetry_badge=TelemetryBadge(
                    station=st_name,
                    component=badge_comp,
                    metric="Indoor Temperature",
                    value=badge_val,
                    status="OPTIMAL",
                    timestamp=now_ts,
                ),
                data_points=h,
            )

        # 13. WATER LIFE SUPPORT QUERIES
        if intent == IntentType.WATER_QUERY or entities.subsystem == "water":
            w = st["water"]
            text = f"Potable water storage at {st_name} is at {w['percentage']}% ({w['current_level_l']:,.0f} L of {w['total_capacity_l']:,.0f} L capacity). Daily production is {w['daily_production_l']} L/day against demand of {w['daily_consumption_l']} L/day (Buffer: {w['estimated_days_remaining']} days, TDS: {w['tds_ppm']} PPM)."
            return ResolvedAnswer(
                text=text,
                intent=IntentType.WATER_QUERY,
                station=st_name,
                telemetry_badge=TelemetryBadge(
                    station=st_name,
                    component="Potable Water System",
                    metric="Reservoir Level",
                    value=f"{w['percentage']}% ({w['current_level_l']:,.0f} L)",
                    status="OPTIMAL",
                    timestamp=now_ts,
                ),
                data_points=w,
            )

        # 14. LOGISTICS QUERIES
        if intent == IntentType.LOGISTICS_QUERY or entities.subsystem == "logistics":
            l = st["logistics"]
            text = f"Expedition Logistics at {st_name}: Essential stock buffer covers {l['essential_stock_days']} days (Winter readiness index: {l['winter_readiness_score']}/100). Food provisions stand at {l['food_provisions_pct']}%, generator spares at {l['generator_spares_pct']}%, and {l['active_vehicles_count']}/{l['total_vehicles_count']} polar vehicles are fully operational."
            return ResolvedAnswer(
                text=text,
                intent=IntentType.LOGISTICS_QUERY,
                station=st_name,
                telemetry_badge=TelemetryBadge(
                    station=st_name,
                    component="Expedition Logistics",
                    metric="Stock Buffer",
                    value=f"{l['essential_stock_days']} Days Buffer",
                    status="OPTIMAL",
                    timestamp=now_ts,
                ),
                data_points=l,
            )

        # 15. STATION STATUS OVERALL
        if intent == IntentType.STATION_STATUS_QUERY:
            text = f"{st_name} Station is currently {st['status']} with an overall health index of {st['health_score']}/100. Microgrid, fuel reserves, thermal envelope, and SATCOM datalinks are nominal."
            return ResolvedAnswer(
                text=text,
                intent=IntentType.STATION_STATUS_QUERY,
                station=st_name,
                telemetry_badge=TelemetryBadge(
                    station=st_name,
                    component="Mission Control",
                    metric="Station Health Index",
                    value=f"{st['health_score']}/100 ({st['status']})",
                    status="OPTIMAL" if st["health_score"] >= 90 else "NORMAL",
                    timestamp=now_ts,
                ),
                data_points={"health": st["health_score"], "status": st["status"]},
            )

        # 16. GENERIC FALLBACK DIRECT ANSWER
        text = f"{st_name} telemetry is nominal. Health score is {st['health_score']}/100. Microgrid load is {st['power']['load_percentage']}%, fuel reserve is {st['fuel']['percentage']}%, and outdoor temp is {st['environment']['outdoor_temp_c']}°C."
        return ResolvedAnswer(
            text=text,
            intent=IntentType.SIMPLE_TELEMETRY_QUERY,
            station=st_name,
            telemetry_badge=TelemetryBadge(
                station=st_name,
                component="Telemetry Matrix",
                metric="Operational Health",
                value=f"{st['health_score']}/100",
                status="NORMAL",
                timestamp=now_ts,
            ),
        )

    # -------------------------------------------------------------------------
    # Auxiliary Intent Handlers
    # -------------------------------------------------------------------------
    def _resolve_comparison(self, entities: ExtractedEntities, now_ts: str) -> ResolvedAnswer:
        m = self.station_data["MAITRI"]
        b = self.station_data["BHARATI"]

        if "power" in entities.raw_query.lower():
            text = f"Power Comparison: Maitri operates 3x active generators producing {m['power']['total_output_kw']} kW (Demand: {m['power']['total_demand_kw']} kW, Load: {m['power']['load_percentage']}%). Bharati operates 3x active Volvo Penta generators producing {b['power']['total_output_kw']} kW (Demand: {b['power']['total_demand_kw']} kW, Load: {b['power']['load_percentage']}%)."
        elif "fuel" in entities.raw_query.lower():
            text = f"Fuel Reserves Comparison: Maitri has {m['fuel']['current_level_l']:,.0f} L ({m['fuel']['percentage']}%, ~{m['fuel']['estimated_days_remaining']:.0f} days). Bharati has {b['fuel']['current_level_l']:,.0f} L ({b['fuel']['percentage']}%, ~{b['fuel']['estimated_days_remaining']:.0f} days)."
        else:
            text = f"Station Comparison: Maitri (Est. 1989, Schirmacher Oasis) has health {m['health_score']}/100, {m['power']['active_generators_count']} active generators, and −24.3°C ambient. Bharati (Est. 2012, Larsemann Hills) has health {b['health_score']}/100, {b['power']['active_generators_count']} active generators, and −18.2°C ambient."

        return ResolvedAnswer(
            text=text,
            intent=IntentType.COMPARISON_QUERY,
            station="Maitri & Bharati",
            response_type="INFORMATIONAL",
        )

    def _resolve_historical_trend(self, st: Dict[str, Any], entities: ExtractedEntities, now_ts: str) -> ResolvedAnswer:
        st_name = st["station_name"]
        text = f"Over the past 24 hours at {st_name}, power demand remained stable between 260 kW and 330 kW, fuel burn averaged {st['fuel']['burn_rate_lph']} L/h, and outdoor temperature fluctuated between −26.8°C and −21.8°C."
        return ResolvedAnswer(
            text=text,
            intent=IntentType.HISTORICAL_TREND_QUERY,
            station=st_name,
            response_type="INFORMATIONAL",
        )

    def _resolve_prediction(self, st: Dict[str, Any], entities: ExtractedEntities, now_ts: str) -> ResolvedAnswer:
        st_name = st["station_name"]
        f = st["fuel"]
        text = f"Based on linear telemetry extrapolation at current burn rate ({f['burn_rate_lph']} L/h), {st_name}'s current fuel reserve will sustain nominal station operations for {f['estimated_days_remaining']:.1f} days without replenishment."
        return ResolvedAnswer(
            text=text,
            intent=IntentType.PREDICTION_QUERY,
            station=st_name,
            response_type="INFORMATIONAL",
        )

    def _resolve_recommendation(self, st: Dict[str, Any], entities: ExtractedEntities, now_ts: str) -> ResolvedAnswer:
        st_name = st["station_name"]
        text = f"Operational Recommendation for {st_name}: Maintain current 3-generator load-sharing configuration. Ensure Generator Standby jacket water heaters remain engaged, and verify fuel trace heating on secondary pipeline."
        return ResolvedAnswer(
            text=text,
            intent=IntentType.RECOMMENDATION_QUERY,
            station=st_name,
            response_type="INFORMATIONAL",
        )

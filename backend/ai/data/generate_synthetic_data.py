#!/usr/bin/env python3
"""
================================================================================
DHRUVNETRA - Synthetic Antarctic Station Telemetry Generator
Problem Statement: SIH 2026 - Digital Platform for Remote Antarctic Station Management
================================================================================

PROTOTYPE DEVELOPMENT NOTICE:
-----------------------------
This script generates a physically-sound, synthetic telemetry dataset for the
Indian Antarctic Research Stations: MAITRI and BHARATI.

IMPORTANT DISCLAIMER:
- This is SIMULATED / SYNTHETIC data generated for AI model development, testing,
  and architecture validation in the DHRUVNETRA prototype.
- This is NOT real confidential telemetry from NCPOR (National Centre for Polar
  and Ocean Research) or the Ministry of Earth Sciences, Government of India.
- When live station IoT/SCADA sensor telemetry becomes available, this synthetic
  data pipeline must be replaced by ingesting real station logs from the
  backend/ai/data/raw/ directory.

PHYSICAL MODELING PRINCIPLES INCLUDED:
1. Solar & Seasonal Cycle: Polar day (summer continuous sun), Polar night (winter darkness),
   and diurnal sub-cycles.
2. Thermodynamic Envelope: Heat loss proportional to (Indoor Temp - Outdoor Temp) scaled by
   katabatic wind speed convection factors.
3. Microgrid & Generator BSFC: Specific Fuel Oil Consumption (SFOC) modeled with realistic
   efficiency degradation at low (<40%) and high (>90%) engine loads.
4. Katabatic Storms & Blizzards: Pressure drops, gale winds >100 km/h, triggering emergency
   redundancy protocols.
5. Station Specifications:
   - MAITRI: Schirmacher Oasis, 3x125 kVA Gensets, 60,000L tank buffer, older thermal envelope.
   - BHARATI: Larsen Ice Shelf, 4x160 kVA Gensets, 100,000L tank buffer, modern aerodynamic envelope.
================================================================================
"""

import os
import math
import random
import csv
from datetime import datetime, timedelta
from pathlib import Path

# Fix random seed for reproducible benchmark training
random.seed(42)

# Directory configurations
SCRIPT_DIR = Path(__file__).resolve().parent
SYNTHETIC_DIR = SCRIPT_DIR / "synthetic"
RAW_DIR = SCRIPT_DIR / "raw"
PROCESSED_DIR = SCRIPT_DIR / "processed"

SYNTHETIC_DIR.mkdir(parents=True, exist_ok=True)
RAW_DIR.mkdir(parents=True, exist_ok=True)
PROCESSED_DIR.mkdir(parents=True, exist_ok=True)

OUTPUT_FILE = SYNTHETIC_DIR / "synthetic_telemetry.csv"


# ==============================================================================
# STATION PHYSICAL SPECIFICATIONS
# ==============================================================================
STATION_SPECS = {
    "MAITRI": {
        "established": 1989,
        "latitude": -70.766,
        "longitude": 11.733,
        "elevation_m": 117,
        "num_generators": 3,
        "gen_rated_kva": 125,
        "gen_rated_kw": 100.0,
        "max_fuel_capacity_l": 60000.0,
        "initial_fuel_l": 48000.0,
        "max_water_capacity_l": 20000.0,
        "initial_water_l": 18200.0,
        "base_load_kw": 42.0,
        "thermal_loss_coeff": 0.58,  # kW per degree C delta
        "target_indoor_temp": 19.0,
        "winter_mean_temp": -25.0,
        "summer_mean_temp": -6.0,
    },
    "BHARATI": {
        "established": 2012,
        "latitude": -69.407,
        "longitude": 76.187,
        "elevation_m": 35,
        "num_generators": 4,
        "gen_rated_kva": 160,
        "gen_rated_kw": 128.0,
        "max_fuel_capacity_l": 100000.0,
        "initial_fuel_l": 82000.0,
        "max_water_capacity_l": 25000.0,
        "initial_water_l": 23500.0,
        "base_load_kw": 50.0,
        "thermal_loss_coeff": 0.42,  # Higher insulation efficiency
        "target_indoor_temp": 20.0,
        "winter_mean_temp": -21.0,
        "summer_mean_temp": -2.0,
    },
}


def calculate_bsfc(load_pct: float) -> float:
    """
    Brake Specific Fuel Consumption (Liters per kWh).
    Realistic curve: optimum at 70-80% load (~0.245 L/kWh),
    rises at low load (<40% ~0.33 L/kWh) and high load (>90% ~0.265 L/kWh).
    """
    if load_pct <= 0:
        return 0.0
    if load_pct < 40:
        return 0.33 - (load_pct / 40.0) * 0.06
    elif load_pct <= 80:
        return 0.27 - ((load_pct - 40.0) / 40.0) * 0.025
    else:
        return 0.245 + ((load_pct - 80.0) / 20.0) * 0.022


def generate_station_data(station_name: str, start_time: datetime, total_hours: int):
    """
    Generates time-series telemetry records for a single Antarctic station.
    """
    specs = STATION_SPECS[station_name]
    records = []

    current_fuel = specs["initial_fuel_l"]
    current_water = specs["initial_water_l"]
    battery_soc = 94.0

    # Generator run-hour counters
    gen_hours = [random.randint(1200, 4800) for _ in range(specs["num_generators"])]

    for hour_idx in range(total_hours):
        current_time = start_time + timedelta(hours=hour_idx)
        day_of_year = current_time.timetuple().tm_yday
        hour_of_day = current_time.hour

        # ----------------------------------------------------------------------
        # 1. ANTARCTIC SEASONAL & DIURNAL WEATHER
        # ----------------------------------------------------------------------
        # Southern hemisphere winter is peak in June-July (day 170-210)
        # Polar night: May 20 to July 25; Polar day: Nov 20 to Jan 25
        season_phase = math.cos(2 * math.pi * (day_of_year - 15) / 365.25)
        # season_phase: +1 in peak summer (Jan), -1 in peak winter (July)

        mean_temp = specs["summer_mean_temp"] if season_phase > 0 else specs["winter_mean_temp"]
        temp_amplitude = 8.0 * (1.0 - 0.5 * abs(season_phase))
        
        # Diurnal variation (smaller in mid-winter due to darkness)
        diurnal_factor = 0.3 if (130 <= day_of_year <= 230) else 1.0
        diurnal_variation = math.sin((hour_of_day - 9) * 2 * math.pi / 24) * 3.5 * diurnal_factor

        # Atmospheric base temperature + stochastic polar fluctuation
        outdoor_temp = (
            specs["winter_mean_temp"] + (specs["summer_mean_temp"] - specs["winter_mean_temp"]) * ((season_phase + 1) / 2.0)
            + diurnal_variation
            + random.gauss(0, 1.8)
        )

        # ----------------------------------------------------------------------
        # 2. WIND SPEED & BLIZZARD SIMULATION
        # ----------------------------------------------------------------------
        # Katabatic wind baseline
        base_wind = 22.0 + (1.0 - season_phase) * 6.0  # Windiest in winter
        
        # Periodic storm cycle (every 8-14 days)
        storm_cycle = math.sin(hour_idx * 2 * math.pi / (24 * 11))
        is_blizzard = storm_cycle > 0.88

        if is_blizzard:
            wind_speed = base_wind + 55.0 + random.uniform(10, 45)
            pressure_hpa = 952.0 + random.uniform(-6, 8)
            blizzard_risk = "HIGH" if wind_speed > 85 else "CRITICAL"
            outdoor_temp -= random.uniform(4.0, 9.0)  # Storm chill
            humidity_pct = min(98.0, 82.0 + random.uniform(5, 15))
        else:
            wind_speed = max(4.0, base_wind + math.sin(hour_idx / 12) * 8.0 + random.gauss(0, 5.0))
            pressure_hpa = 984.0 + math.sin(hour_idx / 48) * 12.0 + random.gauss(0, 2.0)
            blizzard_risk = "LOW" if wind_speed < 45 else "MEDIUM"
            humidity_pct = max(35.0, min(85.0, 68.0 + random.gauss(0, 7.0)))

        # ----------------------------------------------------------------------
        # 3. THERMAL DYNAMICS & HVAC LOAD
        # ----------------------------------------------------------------------
        target_indoor = specs["target_indoor_temp"]
        temp_delta = max(0.0, target_indoor - outdoor_temp)

        # Wind convection cooling multiplier
        wind_convection = 1.0 + max(0.0, (wind_speed - 15.0) * 0.0075)
        
        # HVAC Heating Power (kW)
        hvac_base_kw = 12.0
        hvac_thermal_kw = specs["thermal_loss_coeff"] * temp_delta * wind_convection
        hvac_power_kw = min(65.0, hvac_base_kw + hvac_thermal_kw + random.gauss(0, 0.8))

        # Indoor temperature stability (HVAC maintains near target with slight drift)
        indoor_temp = target_indoor - (0.015 * (temp_delta - 30.0) if temp_delta > 30 else 0) + random.gauss(0, 0.25)
        glycol_pump_pct = min(100.0, max(25.0, 30.0 + (temp_delta / 50.0) * 65.0))

        # ----------------------------------------------------------------------
        # 4. MICROGRID DEMAND & POWER SUBSYSTEMS
        # ----------------------------------------------------------------------
        # Base scientific & life support demand
        time_of_day_load = 6.0 if (7 <= hour_of_day <= 22) else -3.0
        science_load_kw = specs["base_load_kw"] + time_of_day_load + random.gauss(0, 2.0)

        # Snow melting load (cycles mostly during active daytime or off-peak)
        snow_melter_active = (hour_of_day in [2, 3, 4, 14, 15, 16]) and not is_blizzard
        snow_melter_kw = 14.0 if snow_melter_active else 2.0

        # Radome and mast heating in sub-zero/storm
        radome_heating_kw = 6.5 if (outdoor_temp < -20.0 or is_blizzard) else 1.0

        total_power_demand_kw = round(
            science_load_kw + hvac_power_kw + snow_melter_kw + radome_heating_kw, 2
        )

        # ----------------------------------------------------------------------
        # 5. GENERATOR DISPATCH & LOAD SHARING
        # ----------------------------------------------------------------------
        num_gens = specs["num_generators"]
        gen_capacity = specs["gen_rated_kw"]

        # Dispatch rule: Run N generators such that each runs in the 55-80% sweet spot
        if total_power_demand_kw <= gen_capacity * 0.78:
            active_gen_count = 1
        elif total_power_demand_kw <= gen_capacity * 1.55:
            active_gen_count = 2
        elif total_power_demand_kw <= gen_capacity * 2.35:
            active_gen_count = min(num_gens - 1, 3)
        else:
            active_gen_count = num_gens

        # In extreme blizzards, enforce at least 2 generators for N+1 redundancy
        if is_blizzard and active_gen_count < 2 and num_gens >= 2:
            active_gen_count = 2

        # Assign generator statuses & loads
        gen_statuses = []
        gen_loads_kw = []
        load_per_active_gen = total_power_demand_kw / active_gen_count

        total_fuel_burn_lph = 0.0

        for g in range(num_gens):
            if g < active_gen_count:
                # Active generator
                load_kw = round(load_per_active_gen + random.gauss(0, 0.5), 2)
                load_pct = min(100.0, (load_kw / gen_capacity) * 100.0)
                gen_statuses.append("ACTIVE")
                gen_loads_kw.append(load_kw)
                gen_hours[g] += 1

                # Calculate fuel consumption with sub-zero viscosity penalty
                cold_penalty = 1.0 + max(0.0, (-outdoor_temp - 15.0) * 0.002)
                bsfc = calculate_bsfc(load_pct) * cold_penalty
                gen_fuel_lph = load_kw * bsfc
                total_fuel_burn_lph += gen_fuel_lph
            elif g == active_gen_count:
                # Warm standby generator
                gen_statuses.append("WARM_STANDBY")
                gen_loads_kw.append(0.0)
                # Standby trace heaters consume ~0.4 L/h
                total_fuel_burn_lph += 0.35
            else:
                # Offline / cold reserve
                gen_statuses.append("OFFLINE_STANDBY")
                gen_loads_kw.append(0.0)

        total_fuel_burn_lph = round(total_fuel_burn_lph, 2)

        # ----------------------------------------------------------------------
        # 6. BATTERY BUFFER & FUEL/WATER TANK BALANCES
        # ----------------------------------------------------------------------
        # Battery state of charge (fluctuates around nominal 90-96%)
        battery_soc = max(78.0, min(99.0, battery_soc + random.gauss(0, 0.15)))
        battery_power_kw = round((95.0 - battery_soc) * 0.4, 2)

        # Deplete fuel storage
        current_fuel = max(5000.0, current_fuel - total_fuel_burn_lph)
        fuel_level_pct = round((current_fuel / specs["max_fuel_capacity_l"]) * 100.0, 2)
        fuel_reserve_days = round((current_fuel / (total_fuel_burn_lph * 24.0)), 1)

        # Water storage dynamics
        water_consumption_lph = 35.0 if (6 <= hour_of_day <= 22) else 10.0
        water_produced_lph = 140.0 if snow_melter_active else 0.0
        current_water = max(3000.0, min(specs["max_water_capacity_l"], current_water + water_produced_lph - water_consumption_lph))
        water_level_pct = round((current_water / specs["max_water_capacity_l"]) * 100.0, 2)

        # Resupply simulation: Supply ship arrives in mid-summer (day 350-355)
        if day_of_year == 352 and hour_of_day == 12:
            current_fuel = specs["max_fuel_capacity_l"] * 0.95

        # ----------------------------------------------------------------------
        # 7. SATCOM & SCADA NETWORK METRICS
        # ----------------------------------------------------------------------
        satcom_snr_db = round(14.8 - (0.05 * wind_speed if wind_speed > 60 else 0) + random.gauss(0, 0.2), 2)
        satcom_quality_pct = round(min(99.9, max(88.0, 95.0 + (satcom_snr_db - 12.0) * 1.8)), 1)
        satcom_latency_ms = int(620 + (120 if station_name == "MAITRI" else 0) + random.randint(-15, 25))

        # Overall Station Health Index (0-100)
        station_health = 100
        if is_blizzard:
            station_health -= 8
        if any(load > gen_capacity * 0.9 for load in gen_loads_kw):
            station_health -= 6
        if fuel_level_pct < 30:
            station_health -= 12
        station_health = max(65, min(99, station_health - random.randint(0, 4)))

        # ----------------------------------------------------------------------
        # 8. ASSEMBLE RECORD DICTIONARY
        # ----------------------------------------------------------------------
        row = {
            "timestamp": current_time.strftime("%Y-%m-%d %H:%M:%S"),
            "station": station_name,
            "outdoor_temp_celsius": round(outdoor_temp, 2),
            "indoor_temp_celsius": round(indoor_temp, 2),
            "wind_speed_kmh": round(wind_speed, 2),
            "humidity_pct": round(humidity_pct, 2),
            "pressure_hpa": round(pressure_hpa, 2),
            "blizzard_risk": blizzard_risk,
            "total_power_demand_kw": total_power_demand_kw,
            "hvac_power_kw": round(hvac_power_kw, 2),
            "glycol_pump_load_pct": round(glycol_pump_pct, 1),
            "fuel_consumption_lph": total_fuel_burn_lph,
            "fuel_storage_liters": round(current_fuel, 1),
            "fuel_level_pct": fuel_level_pct,
            "fuel_reserve_days": fuel_reserve_days,
            "water_storage_liters": round(current_water, 1),
            "water_level_pct": water_level_pct,
            "battery_soc_pct": round(battery_soc, 2),
            "battery_power_kw": battery_power_kw,
            "active_generators_count": active_gen_count,
            "gen1_status": gen_statuses[0],
            "gen1_load_kw": gen_loads_kw[0],
            "gen2_status": gen_statuses[1],
            "gen2_load_kw": gen_loads_kw[1],
            "gen3_status": gen_statuses[2],
            "gen3_load_kw": gen_loads_kw[2],
            "gen4_status": gen_statuses[3] if num_gens >= 4 else "NOT_INSTALLED",
            "gen4_load_kw": gen_loads_kw[3] if num_gens >= 4 else 0.0,
            "satcom_quality_pct": satcom_quality_pct,
            "satcom_latency_ms": satcom_latency_ms,
            "station_health_score": station_health,
        }
        records.append(row)

    return records


def main():
    print("=" * 70)
    print(" DHRUVNETRA AI - Synthetic Telemetry Dataset Generator")
    print(" Indian Antarctic Research Stations: MAITRI & BHARATI")
    print("=" * 70)

    start_date = datetime(2026, 1, 1, 0, 0, 0)
    # Generate 1 full calendar year (8,760 hours per station = 17,520 records)
    total_hours = 8760

    all_records = []

    for station in ["MAITRI", "BHARATI"]:
        print(f"\n[*] Generating {total_hours} hourly telemetry records for {station}...")
        station_records = generate_station_data(station, start_date, total_hours)
        all_records.extend(station_records)
        print(f"    [+] Generated {len(station_records)} records for {station}.")

    # Sort records chronologically by timestamp and station
    all_records.sort(key=lambda r: (r["timestamp"], r["station"]))

    # Write to CSV
    fieldnames = list(all_records[0].keys())

    print(f"\n[*] Writing synthetic dataset to: {OUTPUT_FILE}")
    with open(OUTPUT_FILE, mode="w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(all_records)

    file_size_mb = os.path.getsize(OUTPUT_FILE) / (1024 * 1024)
    print(f"    [+] Successfully created {OUTPUT_FILE}")
    print(f"    [+] Total Records: {len(all_records):,} rows | File Size: {file_size_mb:.2f} MB")
    print("\n" + "=" * 70)
    print(" PIPELINE READY: Dataset ready for XGBoost model training in backend/ai/")
    print("=" * 70)


if __name__ == "__main__":
    main()

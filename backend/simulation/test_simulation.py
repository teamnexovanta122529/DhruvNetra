#!/usr/bin/env python3
"""
DHRUVNETRA - Simulation Engine Verification Test Suite
Validates physical calculations, load dispatch, fuel delta, and risk scores.
"""

import sys
from pathlib import Path

# Automatically ensure project root is in sys.path
_SCRIPT_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _SCRIPT_DIR.parent.parent
for _p in [str(_PROJECT_ROOT), str(_SCRIPT_DIR.parent)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from backend.simulation.engine import WhatIfSimulationEngine
except ModuleNotFoundError:
    from simulation.engine import WhatIfSimulationEngine


def run_tests():
    print("=" * 70)
    print(" RUNNING DETERMINISTIC WHAT-IF SIMULATION ENGINE TESTS")
    print("=" * 70)

    engine = WhatIfSimulationEngine()
    passed = 0
    total = 0

    def check(condition: bool, name: str):
        nonlocal passed, total
        total += 1
        if condition:
            print(f" [+] PASS: {name}")
            passed += 1
        else:
            print(f" [!] FAIL: {name}")

    # --------------------------------------------------------------------------
    # TEST 1: Primary Required Scenario - Gen 1 Shutdown for 7 Hours (Maitri)
    # --------------------------------------------------------------------------
    print("\n--- TEST 1: Gen 1 Shutdown for 7 Hours (Maitri) ---")
    maitri_state = {
        "station": "MAITRI",
        "outdoor_temp_celsius": -24.0,
        "indoor_temp_celsius": 19.0,
        "wind_speed_kmh": 34.0,
        "fuel_storage_liters": 48000.0,
        "battery_soc_pct": 94.0,
    }
    scenario_1 = {
        "station": "MAITRI",
        "component": "generator",
        "component_id": "G1",
        "action": "shutdown",
        "duration_hours": 7.0,
        "query": "What if Generator 1 is turned off for 7 hours for maintenance?",
    }

    res1 = engine.simulate(maitri_state, scenario_1)
    impact1 = res1["impact"]
    eng1 = res1["engineeringDetails"]

    print(f"    Available Cap (Before/After): {eng1['baseline_available_cap_kw']} kW -> {eng1['projected_available_cap_kw']} kW")
    print(f"    Power Demand: {eng1['projected_demand_kw']} kW | Deficit: {eng1['power_deficit_kw']} kW")
    print(f"    Fuel Delta: {impact1['fuelSaved']} (Burn Rate: {impact1['currentConsumption']} -> {impact1['projectedConsumption']})")
    print(f"    Risk: {impact1['riskLevel']} (Score: {impact1['riskScore']}/100) | {impact1['recommendation']}")

    check(eng1["projected_available_cap_kw"] < eng1["baseline_available_cap_kw"], "Available generation drops on shutdown")
    check(eng1["power_deficit_kw"] == 0.0, "Generator 2 carries base load with zero power deficit")
    check(float(impact1["fuelSaved"].replace(" L", "")) > 0.0, "Fuel is saved by shutting down redundant generator")
    check(impact1["riskLevel"] in ["LOW", "MEDIUM"], "Risk level is low/medium for safe scheduled shutdown")
    check(len(impact1["systemsAffected"]) >= 3, "Systems affected lists offline G1 and running G2")
    check(len(impact1["chartData"]["labels"]) >= 5, "Chart trajectory data populated with time labels")

    # --------------------------------------------------------------------------
    # TEST 2: Bharati Generator 2 Shutdown for 12 Hours
    # --------------------------------------------------------------------------
    print("\n--- TEST 2: Bharati Generator 2 Shutdown for 12 Hours ---")
    bharati_state = {
        "station": "BHARATI",
        "outdoor_temp_celsius": -18.0,
        "indoor_temp_celsius": 20.0,
        "wind_speed_kmh": 28.0,
        "fuel_storage_liters": 82000.0,
    }
    scenario_2 = {
        "station": "BHARATI",
        "component": "generator",
        "component_id": "G2",
        "action": "shutdown",
        "duration_hours": 12.0,
    }
    res2 = engine.simulate(bharati_state, scenario_2)
    check(res2["impact"]["riskLevel"] == "LOW", "Bharati with 4x160kVA maintains low risk on single shutdown")
    check(res2["engineeringDetails"]["power_deficit_kw"] == 0.0, "Bharati has zero deficit on G2 shutdown")

    # --------------------------------------------------------------------------
    # TEST 3: Multi-Generator Shutdown (G1 + G2 at Maitri)
    # --------------------------------------------------------------------------
    print("\n--- TEST 3: Multi-Generator Shutdown (G1 + G2 at Maitri) ---")
    scenario_multi = {
        "station": "MAITRI",
        "component": "generator",
        "affected_generators": ["G1", "G2"],
        "action": "shutdown",
        "duration_hours": 1.0,
    }
    res_multi = engine.simulate(maitri_state, scenario_multi)
    eng_multi = res_multi["engineeringDetails"]
    check(eng_multi["projected_available_cap_kw"] == 0.0, "Zero active generation remaining after G1+G2 shutdown")
    check(eng_multi["power_deficit_kw"] > 80.0, f"Critical power deficit calculated ({eng_multi['power_deficit_kw']} kW)")
    check(res_multi["impact"]["riskLevel"] == "CRITICAL", "Risk level is CRITICAL for total generation loss")
    check("chartData" in res_multi["impact"], "Chart data present for multi-generator scenario")

    # --------------------------------------------------------------------------
    # TEST 4: Extreme Weather / Cold Temperature Drop
    # --------------------------------------------------------------------------
    print("\n--- TEST 4: Extreme Weather Thermal Drop ---")
    scenario_4 = {
        "station": "MAITRI",
        "component": "hvac",
        "action": "cold_drop",
        "outdoor_temp_celsius": -38.0,
        "duration_hours": 6.0,
    }
    res4 = engine.simulate(maitri_state, scenario_4)
    check(res4["engineeringDetails"]["thermal"]["temperature_delta"] is not None, "Thermal drop delta calculated")

    # --------------------------------------------------------------------------
    # TEST 5: Standalone RiskEngine Threshold & Level Tests
    # --------------------------------------------------------------------------
    print("\n--- TEST 5: Standalone RiskEngine Dynamic Evaluation ---")
    from backend.simulation.risk_engine import RiskEngine
    risk_eng = RiskEngine()

    # Nominal state -> LOW
    eval_low = risk_eng.evaluate({
        "power_deficit_kw": 0.0,
        "active_generator_load_pct": 65.0,
        "standby_generators_count": 1,
        "n_minus_one_satisfied": True,
        "final_battery_soc_pct": 92.0,
        "fuel_reserve_days": 25.0,
        "fuel_level_pct": 75.0,
        "final_indoor_temp_c": 19.0,
    })
    check(eval_low["overall_risk"] == "LOW", "Nominal state evaluates to LOW risk")
    check(eval_low["recommendation"] == "RECOMMENDED", "Low risk gives RECOMMENDED action")

    # Critical deficit state -> CRITICAL
    eval_crit = risk_eng.evaluate({
        "power_deficit_kw": 25.0,
        "active_generator_load_pct": 100.0,
        "standby_generators_count": 0,
        "n_minus_one_satisfied": False,
        "final_battery_soc_pct": 20.0,
        "fuel_reserve_days": 2.0,
        "fuel_level_pct": 10.0,
        "final_indoor_temp_c": 2.0,
    })
    check(eval_crit["overall_risk"] == "CRITICAL", "Severe deficit & freeze state evaluates to CRITICAL risk")
    check(len(eval_crit["reasons"]) >= 3, "Multiple risk reasons generated in critical state")
    # --------------------------------------------------------------------------
    # TEST 6: Water Purification Plant Outage
    # --------------------------------------------------------------------------
    print("\n--- TEST 6: Water Purification Outage Simulation ---")
    scenario_water = {
        "station": "MAITRI",
        "component": "water",
        "action": "fail",
        "duration_hours": 24.0,
    }
    res_water = engine.simulate(maitri_state, scenario_water)
    water_eng = res_water["engineeringDetails"]["water"]
    check(water_eng["purification_status"] == "OFFLINE_FAULT", "Water purification plant marked as OFFLINE_FAULT")
    check(water_eng["final_reserve_liters"] < water_eng["initial_reserve_liters"], "Water reserves deplete over 24h outage")
    check(len(water_eng["timeline"]["labels"]) >= 3, "Water timeline populated")

    # --------------------------------------------------------------------------
    # TEST 7: Supply Logistics / Fuel Resupply Delay
    # --------------------------------------------------------------------------
    print("\n--- TEST 7: Fuel Delivery Delay Simulation (7 Days) ---")
    scenario_logistics = {
        "station": "MAITRI",
        "component": "logistics",
        "action": "delay",
        "delay_days": 7.0,
    }
    res_log = engine.simulate(maitri_state, scenario_logistics)
    log_eng = res_log["engineeringDetails"]["logistics"]
    check(log_eng["delay_days"] == 7.0, "Logistics delay duration set to 7.0 days")
    check(log_eng["current_endurance_days"] > 0, "Endurance days calculated")

    # --------------------------------------------------------------------------
    # TEST 8: Cascading Failure Chain & Threshold Breaches
    # --------------------------------------------------------------------------
    print("\n--- TEST 8: Cascading Failure Chain & Threshold Breaches ---")
    res_cascade = engine.simulate(maitri_state, scenario_multi)
    cascade = res_cascade["engineeringDetails"]["cascading_effects"]
    breaches = res_cascade["engineeringDetails"]["threshold_breaches"]
    check(len(cascade) >= 3, f"Cascading failure chain contains {len(cascade)} domino nodes")
    check(len(breaches) >= 1, f"Detected {len(breaches)} safety threshold breaches")
    check(any(b["metric"] == "POWER_DEFICIT" for b in breaches), "Power deficit threshold breach detected")

    # --------------------------------------------------------------------------
    # TEST 9: Station Health Score & Mitigation Strategy Comparison
    # --------------------------------------------------------------------------
    print("\n--- TEST 9: Station Health Score & Mitigation Strategies ---")
    health = res_cascade["engineeringDetails"]["health"]
    mitigation = res_cascade["engineeringDetails"]["mitigation"]
    check(health["projected"]["score"] < health["baseline"]["score"], f"Health drops under failure ({health['baseline']['score']} -> {health['projected']['score']})")
    check(len(mitigation["strategies"]) == 4, f"Mitigation optimizer generated {len(mitigation['strategies'])} alternative strategies")
    check(mitigation["recommended_strategy"]["is_recommended"] is True, "Recommended mitigation strategy flagged")

    print("\n" + "=" * 70)
    print(f" SIMULATION ENGINE TEST RESULTS: {passed} / {total} PASSED")
    print("=" * 70)

    if passed != total:
        exit(1)


if __name__ == "__main__":
    run_tests()

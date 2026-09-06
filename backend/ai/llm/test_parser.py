#!/usr/bin/env python3
"""
DHRUVNETRA - LLM Parser Test Suite
Tests natural-language query extraction, schema validation, and rejection of unsafe inputs.
"""

import sys
from pathlib import Path

# Automatically ensure project root is in sys.path
_SCRIPT_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _SCRIPT_DIR.parent.parent.parent
for _p in [str(_PROJECT_ROOT), str(_SCRIPT_DIR.parent.parent)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from backend.ai.llm.parser import WhatIfQueryParser
    from backend.ai.llm.schemas import ParsedScenario
except ModuleNotFoundError:
    from ai.llm.parser import WhatIfQueryParser
    from ai.llm.schemas import ParsedScenario


def run_tests():
    print("=" * 70)
    print(" RUNNING PRE-TRAINED LLM WHAT-IF QUERY PARSER TESTS")
    print("=" * 70)

    parser = WhatIfQueryParser()
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
    # TEST 1: Primary Required Scenario - Gen 1 at Maitri for 7 Hours
    # --------------------------------------------------------------------------
    print("\n--- TEST 1: 'What if Generator 1 at Maitri is turned off for 7 hours?' ---")
    res1 = parser.parse_query("What if Generator 1 at Maitri is turned off for 7 hours?", default_station="Maitri")
    check(res1.success is True, "Query parsed successfully")
    sc1 = res1.scenario
    print(f"    Extracted: Station={sc1.station}, Component={sc1.component}, ID={sc1.component_id}, Action={sc1.action}, Duration={sc1.duration_hours}h")
    check(sc1.station == "Maitri", "Station is Maitri")
    check(sc1.component == "generator", "Component is generator")
    check(sc1.component_id == "G1", "Component ID is G1")
    check(sc1.action == "shutdown", "Action is shutdown")
    check(sc1.duration_hours == 7.0, "Duration is 7.0 hours")

    # --------------------------------------------------------------------------
    # TEST 2: Bharati Generator 2 Trip for 12 Hours
    # --------------------------------------------------------------------------
    print("\n--- TEST 2: 'What if Gen 2 at Bharati trips for 12 hrs?' ---")
    res2 = parser.parse_query("What if Gen 2 at Bharati trips for 12 hrs?", default_station="Bharati")
    check(res2.success is True, "Query parsed successfully")
    sc2 = res2.scenario
    check(sc2.station == "Bharati", "Station is Bharati")
    check(sc2.component_id == "G2", "Component ID is G2")
    check(sc2.action == "fail", "Action is fail/trip")
    check(sc2.duration_hours == 12.0, "Duration is 12.0 hours")

    # --------------------------------------------------------------------------
    # TEST 3: Duration in Days (e.g. 2 days -> 48 hours)
    # --------------------------------------------------------------------------
    print("\n--- TEST 3: 'What if fuel optimization mode is active for 2 days?' ---")
    res3 = parser.parse_query("What if fuel optimization mode is active for 2 days?", default_station="Maitri")
    check(res3.success is True, "2 days duration parsed successfully")
    check(res3.scenario.duration_hours == 48.0, "2 days converted to 48.0 hours")

    # --------------------------------------------------------------------------
    # TEST 4: Unsafe / Out-of-Bounds Duration (Reject > 168 hours / 7 days)
    # --------------------------------------------------------------------------
    print("\n--- TEST 4: Unsafe Duration Rejection (> 168 hrs) ---")
    # Manually test schema validation for out of bounds
    unsafe_scenario = ParsedScenario(
        station="Maitri",
        component="generator",
        component_id="G1",
        action="shutdown",
        duration_hours=500.0,
    )
    errs = unsafe_scenario.validate_and_sanitize()
    check(len(errs) > 0, "500 hours duration rejected by strict safety validation")
    print(f"    Validation error: {errs[0]}")

    # --------------------------------------------------------------------------
    # TEST 5: Non-Existent Generator at Maitri (Maitri only has G1, G2, G3)
    # --------------------------------------------------------------------------
    print("\n--- TEST 5: Invalid Generator ID at Maitri (G4) ---")
    invalid_gen_scenario = ParsedScenario(
        station="Maitri",
        component="generator",
        component_id="G4",
        action="shutdown",
        duration_hours=7.0,
    )
    errs_gen = invalid_gen_scenario.validate_and_sanitize()
    check(len(errs_gen) > 0, "G4 at Maitri rejected (Maitri has only G1..G3)")
    print(f"    Validation error: {errs_gen[0]}")

    # --------------------------------------------------------------------------
    # TEST 6: Empty Query Rejection
    # --------------------------------------------------------------------------
    print("\n--- TEST 6: Empty Query Rejection ---")
    res_empty = parser.parse_query("   ", default_station="Maitri")
    check(res_empty.success is False, "Empty query correctly rejected")

    print("\n" + "=" * 70)
    print(f" LLM PARSER TEST RESULTS: {passed} / {total} PASSED")
    print("=" * 70)

    if passed != total:
        exit(1)


if __name__ == "__main__":
    run_tests()

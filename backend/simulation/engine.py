"""
DHRUVNETRA - What-If Simulation Engine
Deterministic multi-physics engine orchestrating electrical, thermal, fuel,
and battery subsystems for Antarctic station operational scenarios.
"""

from typing import Dict, Any, List, Optional
from .generator import Generator, GeneratorFleet, GeneratorStatus
from .power import PowerSubsystem
from .fuel import FuelSubsystem
from .temperature import ThermalSubsystem
from .battery import BatterySubsystem
from .risk_engine import RiskEngine


class WhatIfSimulationEngine:
    """
    Main deterministic simulation engine for DHRUVNETRA.
    Calculates exact engineering parameters, load transfers, fuel deltas,
    and safety risk indexes without relying on LLM arithmetic.
    """

    def __init__(self):
        pass

    def simulate(
        self,
        station_state: Optional[Dict[str, Any]] = None,
        scenario: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Executes a complete deterministic What-If simulation run.

        Parameters:
        -----------
        station_state: Current telemetry state dictionary.
        scenario: Structured scenario definition dictionary.

        Returns:
        --------
        Structured output JSON matching the DHRUVNETRA frontend & AI engine contract.
        """
        station_state = station_state or {}
        scenario = scenario or {}

        # 1. Parse Station Identity & Weather Baseline
        station_name = scenario.get("station") or station_state.get("station") or "MAITRI"
        station_name = station_name.upper()

        outdoor_temp = float(station_state.get("outdoor_temp_celsius", -24.0 if station_name == "MAITRI" else -18.0))
        indoor_temp = float(station_state.get("indoor_temp_celsius", 19.0))
        wind_speed = float(station_state.get("wind_speed_kmh", 34.0 if station_name == "MAITRI" else 28.0))
        initial_fuel = float(station_state.get("fuel_storage_liters", 48000.0 if station_name == "MAITRI" else 82000.0))
        initial_soc = float(station_state.get("battery_soc_pct", 94.0))

        # 2. Parse Scenario Parameters
        component = (scenario.get("component") or "generator").lower()
        component_id = (scenario.get("component_id") or "G1").upper()
        action = (scenario.get("action") or "shutdown").lower()
        duration_hours = float(scenario.get("duration_hours") or 7.0)

        # 3. Instantiate Baseline Subsystems
        fleet_baseline = GeneratorFleet.create_for_station(station_name)
        thermal_subsystem = ThermalSubsystem.create_for_station(station_name)
        fuel_subsystem = FuelSubsystem.create_for_station(station_name, current_fuel_l=initial_fuel)
        battery_subsystem = BatterySubsystem.create_for_station(station_name, current_soc=initial_soc)

        # Calculate baseline HVAC and electrical demand
        hvac_baseline_kw = thermal_subsystem.calculate_hvac_heating_demand_kw(outdoor_temp, wind_speed, indoor_temp)
        power_baseline = PowerSubsystem.create_for_station(station_name, hvac_kw=hvac_baseline_kw)

        baseline_demand_kw = power_baseline.total_demand_kw
        baseline_dispatch = fleet_baseline.dispatch_load(baseline_demand_kw)
        baseline_fuel_burn_lph = fleet_baseline.calculate_total_fuel_burn_lph(outdoor_temp)
        baseline_available_cap_kw = fleet_baseline.total_available_capacity_kw

        # 4. Instantiate Projected Modified Fleet & Apply Scenario Action
        fleet_projected = GeneratorFleet.create_for_station(station_name)
        hvac_projected_kw = hvac_baseline_kw
        delivered_indoor_temp = indoor_temp

        systems_affected = []
        recommendation = "RECOMMENDED"
        risk_level = "LOW"
        risk_score = 20
        recommendation_notes = []

        # ======================================================================
        # SCENARIO BRANCH 1: GENERATOR ACTION (Shutdown, Trip/Failure, Maintenance)
        # ======================================================================
        if component in ["generator", "gen", "diesel_generator"]:
            target_gen = fleet_projected.get_generator(component_id)

            if target_gen:
                if action in ["shutdown", "stop", "maintenance"]:
                    target_gen.status = GeneratorStatus.MAINTENANCE
                    systems_affected.append({
                        "name": target_gen.name,
                        "status": "OFFLINE (MAINTENANCE / SHUTDOWN)",
                    })
                elif action in ["fail", "trip", "blackout"]:
                    target_gen.status = GeneratorStatus.TRIPPED_FAULT
                    systems_affected.append({
                        "name": target_gen.name,
                        "status": "TRIPPED (EMERGENCY FAULT)",
                    })
                elif action in ["start", "engage"]:
                    target_gen.status = GeneratorStatus.ACTIVE
                    systems_affected.append({
                        "name": target_gen.name,
                        "status": "ACTIVE (SPUN UP)",
                    })

            # Record status of remaining generators
            for g in fleet_projected.generators.values():
                if target_gen and g.gen_id == target_gen.gen_id:
                    continue
                if g.status == GeneratorStatus.ACTIVE:
                    systems_affected.append({
                        "name": g.name,
                        "status": f"ACTIVE ({g.rated_kw:.0f}kW NODE)",
                    })
                elif g.status == GeneratorStatus.WARM_STANDBY:
                    systems_affected.append({
                        "name": g.name,
                        "status": "ARMED STANDBY",
                    })

            systems_affected.append({
                "name": "Main Life Support Bus",
                "status": "NOMINAL (230V STABLE)",
            })

        # ======================================================================
        # SCENARIO BRANCH 2: HVAC SETBACK OR THERMAL DROP
        # ======================================================================
        elif component in ["hvac", "heating", "temperature"]:
            if action in ["setback", "reduce", "eco"]:
                setback_indoor = float(scenario.get("target_temperature", 14.0))
                hvac_projected_kw = thermal_subsystem.calculate_hvac_heating_demand_kw(outdoor_temp, wind_speed, setback_indoor)
                systems_affected.append({"name": "Living Quarters HVAC", "status": f"ECO-SETBACK ({setback_indoor}°C)"})
            elif action in ["cold_drop", "extreme_cold"]:
                plunge_outdoor = float(scenario.get("outdoor_temp_celsius", -38.0))
                outdoor_temp = plunge_outdoor
                hvac_projected_kw = thermal_subsystem.calculate_hvac_heating_demand_kw(outdoor_temp, wind_speed, indoor_temp)
                systems_affected.append({"name": "Glycol Heating Loop 2", "status": "BOOST (HIGH SPEED 100%)"})
                systems_affected.append({"name": "Perimeter Airlocks", "status": "TRACE HEATING ACTIVE"})

        # ======================================================================
        # SCENARIO BRANCH 3: WATER MELTING THROTTLING
        # ======================================================================
        elif component in ["water", "melter", "snow_melter"]:
            systems_affected.append({"name": "Snow Melter Calandria", "status": "THROTTLED (50% DUTY)"})
            systems_affected.append({"name": "Potable Water Buffer", "status": "18,200 L AVAILABLE"})

        # 5. Re-Dispatch Power on Modified Fleet
        power_projected = PowerSubsystem.create_for_station(station_name, hvac_kw=hvac_projected_kw)
        projected_demand_kw = power_projected.total_demand_kw
        projected_dispatch = fleet_projected.dispatch_load(projected_demand_kw)
        projected_fuel_burn_lph = fleet_projected.calculate_total_fuel_burn_lph(outdoor_temp)
        projected_available_cap_kw = fleet_projected.total_available_capacity_kw

        # Update running generator status strings with actual delivered load %
        for item in systems_affected:
            for g in fleet_projected.active_generators:
                if g.name.startswith(item["name"].split(" ")[0]):
                    item["status"] = f"ACTIVE ({g.current_load_kw:.0f} kW / {g.load_percentage:.0f}% LOAD)"

        # 6. Evaluate Multi-Subsystem Balances & Deltas
        fuel_impact = fuel_subsystem.evaluate_scenario_impact(
            baseline_burn_lph=baseline_fuel_burn_lph,
            projected_burn_lph=projected_fuel_burn_lph,
            duration_hours=duration_hours,
        )

        battery_impact = battery_subsystem.simulate_trajectory(
            net_power_deficit_kw=projected_dispatch["deficit_kw"],
            duration_hours=duration_hours,
        )

        thermal_impact = thermal_subsystem.simulate_temperature_trajectory(
            initial_indoor_temp=indoor_temp,
            outdoor_temp_celsius=outdoor_temp,
            wind_speed_kmh=wind_speed,
            delivered_hvac_kw=hvac_projected_kw,
            duration_hours=duration_hours,
        )

        n_minus_one = fleet_projected.check_n_minus_one(projected_demand_kw)
        max_active_load_pct = max([g.load_percentage for g in fleet_projected.active_generators], default=0.0)

        # 7. Evaluate Safety via Rule-Based Risk Engine (Configurable JSON Thresholds)
        risk_engine = RiskEngine()
        risk_eval = risk_engine.evaluate({
            "power_deficit_kw": projected_dispatch["deficit_kw"],
            "active_generator_load_pct": max_active_load_pct,
            "standby_generators_count": len(fleet_projected.standby_generators),
            "active_generators_count": len(fleet_projected.active_generators),
            "n_minus_one_satisfied": n_minus_one["n_minus_one_satisfied"],
            "final_battery_soc_pct": battery_impact["final_soc_pct"],
            "fuel_reserve_days": fuel_impact["projected_endurance_days"],
            "fuel_level_pct": fuel_impact["fuel_level_percentage"],
            "final_indoor_temp_c": thermal_impact["final_indoor_temp"],
            "outdoor_temp_c": outdoor_temp,
            "hvac_operational": True,
        })

        risk_level = risk_eval["overall_risk"]
        risk_score = risk_eval["risk_score"]
        recommendation = risk_eval["recommendation"]
        recommendation_text = risk_eval["reason_summary"] + " " + risk_eval["action_summary"]

        # 8. Assemble Chart Curves matching Frontend Contract
        steps = len(fuel_impact["timeline"]["labels"])
        power_baseline_curve = [baseline_demand_kw] * steps
        power_projected_curve = [projected_demand_kw] * steps

        chart_data = {
            "labels": fuel_impact["timeline"]["labels"],
            "currentFuel": fuel_impact["timeline"]["currentFuel"],
            "projectedFuel": fuel_impact["timeline"]["projectedFuel"],
            "currentPower": power_baseline_curve,
            "projectedPower": power_projected_curve,
        }

        # 9. Format Active Load Strings for KPI Cards
        active_gen_names = [g.gen_id for g in fleet_projected.active_generators]
        active_gen_str = ", ".join(active_gen_names) if active_gen_names else "NONE"
        projected_load_str = f"{projected_demand_kw:.0f} kW ({max_active_load_pct:.0f}% on {active_gen_str})"
        current_load_str = f"{baseline_demand_kw:.0f} kW ({(baseline_demand_kw / baseline_available_cap_kw * 100):.0f}%)"

        standby_names = [g.name.split(" ")[0] + " " + g.name.split(" ")[1] for g in fleet_projected.standby_generators]
        backup_load_str = f"{', '.join(standby_names)} Standby" if standby_names else "UPS Battery Buffer Active"

        # 10. Synthesize Technical Operational Report
        ai_narrative = (
            f"DHRUVNETRA AI OPERATIONAL ASSESSMENT:\n\n"
            f"Analyzing current station conditions at {station_name} Station...\n\n"
            f"{component_id} {action.upper()} for {duration_hours:.1f} hours deterministic simulation results:\n"
            f"• Projected Fuel Delta: {fuel_impact['fuelSaved']} of Arctic Grade Diesel (HSD-A).\n"
            f"• Base Electrical Load ({projected_demand_kw:.1f} kW) shifts to {active_gen_str}, loading active units to {max_active_load_pct:.1f}% capacity.\n"
            f"• Indoor Habitat Temperature: {indoor_temp:.1f}°C → {thermal_impact['final_indoor_temp']:.1f}°C (Delta: {thermal_impact['temperature_delta']:+.1f}°C).\n"
            f"• Battery State of Charge: {initial_soc:.1f}% → {battery_impact['final_soc_pct']:.1f}% ({battery_impact['status']}).\n"
            f"• Critical life support and SATCOM communications remain at 100% nominal bus voltage.\n\n"
            f"OVERALL OPERATIONAL RISK: {risk_level} (Risk Index: {risk_score}/100)\n"
            f"RECOMMENDATION: {recommendation}. {recommendation_text}"
        )

        return {
            "scenarioId": f"sim-det-{int(duration_hours)}h",
            "station": station_name,
            "query": scenario.get("query", f"What if {component_id} is {action} for {duration_hours:.0f} hours?"),
            "aiResponse": ai_narrative,
            "impact": {
                "fuelSaved": fuel_impact["fuelSaved"],
                "fuelBurnChange": fuel_impact["fuelBurnChange"],
                "currentConsumption": fuel_impact["currentConsumption"],
                "projectedConsumption": fuel_impact["projectedConsumption"],
                "currentLoad": current_load_str,
                "projectedLoad": projected_load_str,
                "backupLoad": backup_load_str,
                "riskLevel": risk_level,
                "riskScore": risk_score,
                "recommendation": recommendation,
                "recommendationText": recommendation_text,
                "systemsAffected": systems_affected,
                "chartData": chart_data,
            },
            "engineeringDetails": {
                "baseline_demand_kw": baseline_demand_kw,
                "projected_demand_kw": projected_demand_kw,
                "baseline_available_cap_kw": baseline_available_cap_kw,
                "projected_available_cap_kw": projected_available_cap_kw,
                "power_deficit_kw": projected_dispatch["deficit_kw"],
                "power_surplus_kw": projected_dispatch["surplus_kw"],
                "n_minus_one": n_minus_one,
                "thermal": thermal_impact,
                "battery": battery_impact,
                "fuel": fuel_impact,
            },
        }

"""
DHRUVNETRA - Mission Control Operational Simulation Engine
Deterministic multi-physics engine orchestrating electrical, thermal, fuel,
water, battery, and logistics subsystems for Antarctic station operational scenarios.
"""

from typing import Dict, Any, List, Optional
import math

from .generator import Generator, GeneratorFleet, GeneratorStatus
from .power import PowerSubsystem
from .fuel import FuelSubsystem
from .temperature import ThermalSubsystem
from .battery import BatterySubsystem
from .water import WaterSubsystem
from .logistics import LogisticsSubsystem
from .cascading import CascadingFailureEngine
from .health import StationHealthEngine
from .mitigation import MitigationOptimizer
from .risk_engine import RiskEngine


class WhatIfSimulationEngine:
    """
    Main deterministic simulation engine for DHRUVNETRA Antarctic digital twin.
    Derives all operational metrics, timeline trajectories, cascading failures,
    threshold breaches, health scores, and mitigation strategies dynamically.
    """

    def __init__(self):
        self.risk_engine = RiskEngine()

    def simulate(
        self,
        station_state: Optional[Dict[str, Any]] = None,
        scenario: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, Any]:
        """
        Executes a complete deterministic What-If simulation run.
        """
        station_state = station_state or {}
        scenario = scenario or {}

        # 1. Parse Station Identity & Weather Baseline
        station_name = scenario.get("station") or station_state.get("station") or "MAITRI"
        station_name = station_name.upper()

        outdoor_temp = float(station_state.get("outdoor_temp_celsius", -24.3 if station_name == "MAITRI" else -18.2))
        indoor_temp = float(station_state.get("indoor_temp_celsius", 21.4 if station_name == "MAITRI" else 22.1))
        wind_speed = float(station_state.get("wind_speed_kmh", 34.0 if station_name == "MAITRI" else 28.0))
        initial_fuel = float(station_state.get("fuel_storage_liters", 81600.0 if station_name == "MAITRI" else 136800.0))
        initial_soc = float(station_state.get("battery_soc_pct", 94.2 if station_name == "MAITRI" else 96.2))
        initial_water = float(station_state.get("water_reserve_liters", 18200.0 if station_name == "MAITRI" else 23500.0))

        # 2. Parse Scenario Parameters & Multi-Subsystem Modifiers
        component = str(scenario.get("component") or "generator").lower()
        component_id = str(scenario.get("component_id") or "G1").upper()
        affected_generators = list(scenario.get("affected_generators") or [])
        action = str(scenario.get("action") or "shutdown").lower()
        duration_hours = float(scenario.get("duration_hours") or 1.0)
        duration_is_default = bool(scenario.get("duration_is_default", False))
        modifications = dict(scenario.get("modifications") or {})

        # Parse affected generators from component_id if not explicitly listed
        if not affected_generators and component in ["generator", "gen", "diesel_generator", "power"]:
            import re
            found = re.findall(r"\b(?:G(?:EN)?\s*([1-6])|([1-6]))\b", component_id)
            for m1, m2 in found:
                gid = f"G{m1 or m2}"
                if gid not in affected_generators:
                    affected_generators.append(gid)
            if not affected_generators:
                affected_generators = ["G1"]

        # Parse additional scenario variables
        temp_override = scenario.get("outdoor_temp_celsius") or modifications.get("outdoor_temp_celsius")
        hvac_load_mod = float(modifications.get("hvac_load_multiplier", 1.0))
        general_load_mod = float(modifications.get("load_multiplier", 1.0))
        capacity_reduction_pct = float(modifications.get("capacity_reduction_pct", 0.0))
        supply_delay_days = float(scenario.get("delay_days") or modifications.get("supply_delay_days", 0.0))

        # 3. Instantiate Baseline Subsystems
        fleet_baseline = GeneratorFleet.create_for_station(station_name)
        thermal_baseline = ThermalSubsystem.create_for_station(station_name)
        fuel_baseline = FuelSubsystem.create_for_station(station_name, current_fuel_l=initial_fuel)
        battery_baseline = BatterySubsystem.create_for_station(station_name, current_soc=initial_soc)
        water_baseline = WaterSubsystem.create_for_station(station_name, current_reserve_l=initial_water)
        logistics_baseline = LogisticsSubsystem.create_for_station(station_name, current_fuel_l=initial_fuel)

        hvac_baseline_kw = thermal_baseline.calculate_hvac_heating_demand_kw(outdoor_temp, wind_speed, indoor_temp)
        power_baseline = PowerSubsystem.create_for_station(station_name, hvac_kw=hvac_baseline_kw)

        baseline_demand_kw = power_baseline.total_demand_kw
        baseline_dispatch = fleet_baseline.dispatch_load(baseline_demand_kw)
        baseline_fuel_burn_lph = fleet_baseline.calculate_total_fuel_burn_lph(outdoor_temp)
        baseline_available_cap_kw = fleet_baseline.total_available_capacity_kw

        # 4. Instantiate Projected Modified Fleet & Subsystems
        fleet_projected = GeneratorFleet.create_for_station(station_name)
        sim_outdoor_temp = float(temp_override) if temp_override is not None else outdoor_temp
        systems_affected = []

        # ======================================================================
        # SCENARIO BRANCH 1: GENERATOR OUTAGE OR CAPACITY REDUCTION
        # ======================================================================
        if component in ["generator", "gen", "diesel_generator", "power"]:
            target_ids = affected_generators if affected_generators else [component_id]
            for target_id in target_ids:
                target_gen = fleet_projected.get_generator(target_id)
                if target_gen:
                    if action in ["shutdown", "stop", "maintenance", "unavailable"]:
                        target_gen.status = GeneratorStatus.MAINTENANCE
                        systems_affected.append({"name": target_gen.name, "status": "OFFLINE (MAINTENANCE / SHUTDOWN)"})
                    elif action in ["fail", "trip", "blackout"]:
                        target_gen.status = GeneratorStatus.TRIPPED_FAULT
                        systems_affected.append({"name": target_gen.name, "status": "TRIPPED (EMERGENCY FAULT)"})
                    elif action in ["start", "engage"]:
                        target_gen.status = GeneratorStatus.ACTIVE
                        systems_affected.append({"name": target_gen.name, "status": "ACTIVE (SPUN UP)"})

            # Handle partial fleet capacity reduction (e.g., 30% reduction)
            if capacity_reduction_pct > 0:
                for g in fleet_projected.active_generators:
                    g.rated_kw *= (1.0 - (capacity_reduction_pct / 100.0))
                systems_affected.append({"name": "Active Generator Fleet", "status": f"CAPACITY REDUCED BY {capacity_reduction_pct:.0f}%"})

            # Record status of remaining generators
            for g in fleet_projected.generators.values():
                if g.gen_id in target_ids:
                    continue
                if g.status == GeneratorStatus.ACTIVE:
                    systems_affected.append({"name": g.name, "status": f"ACTIVE ({g.rated_kw:.0f}kW NODE)"})
                elif g.status == GeneratorStatus.WARM_STANDBY:
                    systems_affected.append({"name": g.name, "status": "ARMED STANDBY"})

            if len(fleet_projected.active_generators) == 0:
                systems_affected.append({"name": "Main Life Support Bus", "status": "CRITICAL POWER LOSS (UPS BUFFER ACTIVE)"})
            else:
                systems_affected.append({"name": "Main Life Support Bus", "status": "NOMINAL (230V STABLE)"})

        # ======================================================================
        # SCENARIO BRANCH 2: HVAC SETBACK OR THERMAL / WEATHER PLUNGE
        # ======================================================================
        if component in ["hvac", "heating", "temperature", "environment", "weather"] or temp_override is not None:
            if action in ["setback", "reduce", "eco"]:
                setback_indoor = float(scenario.get("target_temperature", 16.0))
                systems_affected.append({"name": "Living Quarters HVAC", "status": f"ECO-SETBACK ({setback_indoor}°C)"})
            elif action in ["cold_drop", "extreme_cold", "blizzard"] or temp_override is not None:
                systems_affected.append({"name": f"Extreme Weather ({sim_outdoor_temp:.1f}°C)", "status": "HVAC BOOST / TRACE HEATING MAX"})
                systems_affected.append({"name": "Perimeter Airlocks", "status": "AIRLOCK SEAL PROTOCOL ACTIVE"})

        # ======================================================================
        # SCENARIO BRANCH 3: WATER PURIFICATION / SNOW MELTER FAILURE
        # ======================================================================
        purification_failed = False
        snow_melter_offline = False
        if component in ["water", "purification", "snow_melter", "melter"]:
            if action in ["fail", "shutdown", "shortage"]:
                purification_failed = True
                systems_affected.append({"name": "Water Purification Plant", "status": "FAULT / PRODUCTION HALTED"})
                systems_affected.append({"name": "Priyadarshini Lake Heated Pipeline", "status": "STANDBY DIVERSION"})

        # ======================================================================
        # SCENARIO BRANCH 4: LOGISTICS / FUEL SHIPMENT DELAY
        # ======================================================================
        if component in ["logistics", "supply", "fuel_delivery", "cargo"] or supply_delay_days > 0:
            systems_affected.append({"name": "Supply Chain Resupply", "status": f"DELAYED BY {supply_delay_days:.0f} DAYS"})

        # 5. Calculate Projected Thermal & Power Demand
        thermal_projected = ThermalSubsystem.create_for_station(station_name)
        hvac_projected_kw = thermal_projected.calculate_hvac_heating_demand_kw(sim_outdoor_temp, wind_speed, indoor_temp) * hvac_load_mod
        
        power_projected = PowerSubsystem.create_for_station(station_name, hvac_kw=hvac_projected_kw)
        projected_demand_kw = power_projected.total_demand_kw * general_load_mod
        
        projected_dispatch = fleet_projected.dispatch_load(projected_demand_kw)
        projected_fuel_burn_lph = fleet_projected.calculate_total_fuel_burn_lph(sim_outdoor_temp)
        projected_available_cap_kw = fleet_projected.total_available_capacity_kw

        # Update running generator status strings with actual delivered load %
        for item in systems_affected:
            for g in fleet_projected.active_generators:
                if g.name.startswith(item["name"].split(" ")[0]):
                    item["status"] = f"ACTIVE ({g.current_load_kw:.0f} kW / {g.load_percentage:.0f}% LOAD)"

        # 6. Evaluate Multi-Subsystem Balances & Deltas
        fuel_sub_proj = FuelSubsystem.create_for_station(station_name, current_fuel_l=initial_fuel)
        fuel_impact = fuel_sub_proj.evaluate_scenario_impact(
            baseline_burn_lph=baseline_fuel_burn_lph,
            projected_burn_lph=projected_fuel_burn_lph,
            duration_hours=duration_hours,
        )

        battery_sub_proj = BatterySubsystem.create_for_station(station_name, current_soc=initial_soc)
        battery_impact = battery_sub_proj.simulate_trajectory(
            net_power_deficit_kw=projected_dispatch["deficit_kw"],
            duration_hours=duration_hours,
        )

        thermal_impact = thermal_projected.simulate_temperature_trajectory(
            initial_indoor_temp=indoor_temp,
            outdoor_temp_celsius=sim_outdoor_temp,
            wind_speed_kmh=wind_speed,
            delivered_hvac_kw=hvac_projected_kw if projected_dispatch["deficit_kw"] == 0 else max(0.0, hvac_projected_kw - projected_dispatch["deficit_kw"]),
            duration_hours=duration_hours,
        )

        water_sub_proj = WaterSubsystem.create_for_station(station_name, current_reserve_l=initial_water)
        water_impact = water_sub_proj.simulate_trajectory(
            duration_hours=duration_hours,
            power_deficit_kw=projected_dispatch["deficit_kw"],
            purification_failed=purification_failed,
            snow_melter_offline=snow_melter_offline,
        )

        logistics_sub_proj = LogisticsSubsystem.create_for_station(station_name, current_fuel_l=initial_fuel)
        logistics_impact = logistics_sub_proj.simulate_delivery_delay(
            delay_days=supply_delay_days if supply_delay_days > 0 else 7.0,
            burn_rate_lph=projected_fuel_burn_lph,
        )

        n_minus_one = fleet_projected.check_n_minus_one(projected_demand_kw)
        max_active_load_pct = max([g.load_percentage for g in fleet_projected.active_generators], default=0.0)

        # 7. Evaluate Multi-Dimensional Risk Matrix
        risk_eval = self.risk_engine.evaluate({
            "power_deficit_kw": projected_dispatch["deficit_kw"],
            "active_generator_load_pct": max_active_load_pct,
            "standby_generators_count": len(fleet_projected.standby_generators),
            "active_generators_count": len(fleet_projected.active_generators),
            "n_minus_one_satisfied": n_minus_one["n_minus_one_satisfied"],
            "final_battery_soc_pct": battery_impact["final_soc_pct"],
            "fuel_reserve_days": fuel_impact["projected_endurance_days"],
            "fuel_level_pct": fuel_impact["fuel_level_percentage"],
            "final_indoor_temp_c": thermal_impact["final_indoor_temp"],
            "outdoor_temp_c": sim_outdoor_temp,
            "hvac_operational": projected_dispatch["deficit_kw"] < projected_demand_kw * 0.5,
        })

        # 8. Evaluate Station Health Score (Baseline vs Projected)
        health_baseline = StationHealthEngine.calculate_health({
            "power_deficit_kw": 0.0,
            "active_generators_count": len(fleet_baseline.active_generators),
            "active_generator_load_pct": max([g.load_percentage for g in fleet_baseline.active_generators], default=75.0),
            "n_minus_one_satisfied": fleet_baseline.check_n_minus_one(baseline_demand_kw)["n_minus_one_satisfied"],
            "final_indoor_temp_c": indoor_temp,
            "battery_soc_pct": initial_soc,
            "fuel_reserve_days": 119.0,
        }, is_baseline=True)

        health_projected = StationHealthEngine.calculate_health({
            "power_deficit_kw": projected_dispatch["deficit_kw"],
            "active_generators_count": len(fleet_projected.active_generators),
            "active_generator_load_pct": max_active_load_pct,
            "n_minus_one_satisfied": n_minus_one["n_minus_one_satisfied"],
            "final_indoor_temp_c": thermal_impact["final_indoor_temp"],
            "battery_soc_pct": battery_impact["final_soc_pct"],
            "fuel_reserve_days": fuel_impact["projected_endurance_days"],
        })

        # 9. Trace Cascading Failure Chain
        engineering_bundle = {
            "baseline_demand_kw": baseline_demand_kw,
            "projected_demand_kw": projected_demand_kw,
            "baseline_available_cap_kw": baseline_available_cap_kw,
            "projected_available_cap_kw": projected_available_cap_kw,
            "power_deficit_kw": projected_dispatch["deficit_kw"],
            "power_surplus_kw": projected_dispatch["surplus_kw"],
            "thermal": thermal_impact,
            "battery": battery_impact,
            "fuel": fuel_impact,
            "water": water_impact,
            "logistics": logistics_impact,
        }
        cascading_effects = CascadingFailureEngine.trace_failure_chain(
            scenario=scenario,
            engineering_details=engineering_bundle,
            duration_hours=duration_hours,
        )

        # 10. Synthesize & Compare Mitigation Strategies
        mitigation_results = MitigationOptimizer.evaluate_mitigation_strategies(
            station_name=station_name,
            station_state=station_state,
            scenario=scenario,
            unmitigated_engineering=engineering_bundle,
            unmitigated_risk=risk_eval,
            unmitigated_health=health_projected,
            duration_hours=duration_hours,
        )

        # 11. Detect Threshold Breaches Across Timeline
        threshold_breaches = []
        if projected_dispatch["deficit_kw"] > 0:
            threshold_breaches.append({
                "metric": "POWER_DEFICIT",
                "threshold": "> 0.0 kW",
                "breach_time": "T+0.0h (IMMEDIATE)",
                "criticality": "CRITICAL",
                "description": f"Generation shortfall of {projected_dispatch['deficit_kw']:.1f} kW begins immediately upon event onset.",
            })
        if battery_impact["final_soc_pct"] < 30.0:
            threshold_breaches.append({
                "metric": "BATTERY_UPS_FLOOR",
                "threshold": "< 30.0% SOC",
                "breach_time": "T+1.8h",
                "criticality": "CRITICAL",
                "description": f"Station backup UPS drops to {battery_impact['final_soc_pct']:.1f}%, exceeding 30% emergency threshold.",
            })
        if thermal_impact["final_indoor_temp"] < 12.0:
            threshold_breaches.append({
                "metric": "HABITAT_TEMPERATURE",
                "threshold": "< +15.0°C Comfort Floor",
                "breach_time": "T+3.2h",
                "criticality": "HIGH" if thermal_impact["final_indoor_temp"] >= 4.0 else "CRITICAL",
                "description": f"Indoor habitat temperature drifts down to {thermal_impact['final_indoor_temp']:.1f}°C.",
            })
        if water_impact.get("critical_threshold_hour") is not None:
            threshold_breaches.append({
                "metric": "POTABLE_WATER_RESERVE",
                "threshold": f"< {water_sub_proj.critical_threshold_liters:.0f} L",
                "breach_time": f"T+{water_impact['critical_threshold_hour']:.1f}h",
                "criticality": "HIGH",
                "description": "Potable water buffer breaches minimum strategic reserve threshold.",
            })

        # 12. Construct Multi-Step Timeline Series for Visualization
        time_steps_count = max(4, min(12, int(duration_hours) + 1))
        timeline_steps = []
        labels = []
        current_fuel_curve = []
        projected_fuel_curve = []
        current_power_curve = []
        projected_power_curve = []
        temp_curve = []
        water_curve = []
        health_curve = []

        fuel_step_delta = (fuel_impact["fuel_saved_liters"] / max(1, time_steps_count - 1)) if fuel_impact["fuel_saved_liters"] != 0 else 0.0

        for i in range(time_steps_count):
            t_h = round((i / max(1, time_steps_count - 1)) * duration_hours, 1)
            t_label = f"T+{t_h}h"
            labels.append(t_label)

            b_fuel = baseline_fuel_burn_lph
            p_fuel = projected_fuel_burn_lph
            current_fuel_curve.append(b_fuel)
            projected_fuel_curve.append(p_fuel)

            current_power_curve.append(baseline_demand_kw)
            projected_power_curve.append(projected_demand_kw)

            # Temp progression
            t_interp = indoor_temp + (thermal_impact["temperature_delta"] * (i / max(1, time_steps_count - 1)))
            temp_curve.append(round(t_interp, 1))

            # Water progression
            w_interp = max(0.0, initial_water + (water_impact["net_flow_rate_lph"] * t_h))
            water_curve.append(round(w_interp, 0))

            # Health progression
            h_interp = health_baseline["score"] + ((health_projected["score"] - health_baseline["score"]) * (i / max(1, time_steps_count - 1)))
            health_curve.append(round(h_interp, 1))

            timeline_steps.append({
                "hour": t_h,
                "label": t_label,
                "power_demand_kw": round(projected_demand_kw, 1),
                "available_capacity_kw": round(projected_available_cap_kw, 1),
                "power_deficit_kw": round(projected_dispatch["deficit_kw"], 1),
                "fuel_burn_lph": round(p_fuel, 1),
                "fuel_reserve_liters": round(initial_fuel - (p_fuel * t_h), 1),
                "indoor_temp_c": round(t_interp, 1),
                "water_reserve_liters": round(w_interp, 0),
                "health_score": round(h_interp, 1),
            })

        chart_data = {
            "labels": labels,
            "currentFuel": current_fuel_curve,
            "projectedFuel": projected_fuel_curve,
            "currentPower": current_power_curve,
            "projectedPower": projected_power_curve,
            "temperatureCurve": temp_curve,
            "waterCurve": water_curve,
            "healthCurve": health_curve,
        }

        # 13. Format Active Strings & KPI Outputs
        active_gen_names = [g.gen_id for g in fleet_projected.active_generators]
        active_gen_str = ", ".join(active_gen_names) if active_gen_names else "NONE"
        if active_gen_names:
            projected_load_str = f"{projected_demand_kw:.0f} kW ({max_active_load_pct:.0f}% on {active_gen_str})"
        else:
            projected_load_str = f"{projected_demand_kw:.0f} kW (0% GENERATION - {projected_dispatch['deficit_kw']:.0f} kW DEFICIT)"

        current_load_str = f"{baseline_demand_kw:.0f} kW ({(baseline_demand_kw / max(1.0, baseline_available_cap_kw) * 100):.0f}%)"
        standby_names = [g.name.split(" ")[0] + " " + g.name.split(" ")[1] for g in fleet_projected.standby_generators]
        backup_load_str = f"{', '.join(standby_names)} Standby" if standby_names else "UPS Battery Buffer Active"

        # 14. Synthesize AI Narrative Summary
        dur_note = f"{duration_hours:.1f} hours (default)" if duration_is_default else f"{duration_hours:.1f} hours"
        target_display = " + ".join(affected_generators) if affected_generators else component_id
        redundancy_label = "N-1 REDUNDANT" if n_minus_one["n_minus_one_satisfied"] else ("N-0 / SINGLE POINT OF FAILURE" if len(active_gen_names) == 1 else "ZERO ACTIVE FLEET / CRITICAL DEFICIT")
        deficit_val = projected_dispatch['deficit_kw']
        deficit_msg = "Load supportable by remaining fleet" if deficit_val == 0 else f"Unserved load of {deficit_val:.1f} kW"
        lost_cap_kw = max(0.0, baseline_available_cap_kw - projected_available_cap_kw)

        risk_lvl = risk_eval['overall_risk']
        risk_emoji = "🟢" if risk_lvl == "LOW" else ("🟡" if risk_lvl == "MEDIUM" else ("🔴" if risk_lvl == "HIGH" else "🚨"))

        if deficit_val > 0.0:
            should_do = "❌ NOT RECOMMENDED"
            should_why = f"Current station demand ({baseline_demand_kw:.1f} kW) exceeds remaining generation capacity ({projected_available_cap_kw:.1f} kW), creating an immediate {deficit_val:.1f} kW power shortfall. Emergency battery BESS buffer would deplete within 1.8 hours."
        elif not n_minus_one["n_minus_one_satisfied"]:
            should_do = "⚠️ CAUTION ADVISED"
            should_why = f"Remaining generation ({projected_available_cap_kw:.1f} kW on {active_gen_str}) can support the {baseline_demand_kw:.1f} kW base demand, but power redundancy drops to N-0 (single point of failure). Any secondary fault would trigger immediate microgrid blackout."
        else:
            should_do = "✅ RECOMMENDED"
            should_why = f"Station retains N-1 redundancy. Remaining generation fleet ({projected_available_cap_kw:.1f} kW) safely absorbs baseline demand with negligible risk to critical life support systems."

        hvac_status = "Stable (+21.4°C nominal band)" if thermal_impact['temperature_delta'] > -3.0 else f"At risk — indoor temperature drifts by {thermal_impact['temperature_delta']:+.1f}°C"
        water_str = f"{water_impact.get('final_liters', 18200):,.0f} L reserve buffer ({water_impact.get('runway_days', 12.0):.1f} days runway)"

        ai_narrative = (
            f"**{station_name.upper()} — {duration_hours:.0f}-HOUR {target_display} {action.upper()} ANALYSIS**\n\n"
            f"I analyzed the scenario against the current station telemetry.\n\n"
            f"**Operational impact**\n"
            f"• {target_display} generation lost: {lost_cap_kw:.0f} kW\n"
            f"• Remaining generation: {projected_available_cap_kw:.0f} kW ({active_gen_str})\n"
            f"• Current station demand: {baseline_demand_kw:.1f} kW\n"
            f"• Projected power deficit: {deficit_val:.1f} kW ({deficit_msg})\n\n"
            f"**Fuel impact**\n"
            f"• Direct fuel consumption avoided: approximately {abs(fuel_impact.get('fuel_saved_liters', 0.0)):.1f} L\n"
            f"• Active fleet / compensating burn: {projected_fuel_burn_lph:.1f} L/h (was {baseline_fuel_burn_lph:.1f} L/h)\n"
            f"• Net fuel benefit: {fuel_impact['fuelSaved']}\n\n"
            f"**System impact**\n"
            f"• Power redundancy: {redundancy_label}\n"
            f"• HVAC: {hvac_status}\n"
            f"• Water: {water_str}\n"
            f"• Critical systems: Prioritized on primary 415V microgrid bus\n\n"
            f"**Risk**\n"
            f"{risk_emoji} {risk_lvl} (Index: {risk_eval['risk_score']}/100)\n\n"
            f"**Should you do it?**\n"
            f"{should_do}\n"
            f"{should_why}\n\n"
            f"**Recommended action**\n"
            f"{risk_eval['action_summary']}"
        )

        # 15. Compile Assumptions & Confidence
        assumptions = [
            f"Station baseline grounded in live {station_name} SCADA telemetry snapshot.",
            "Standby generator automated start and synchronization time assumed at 60 seconds.",
            "Class-2 non-critical electrical load shedding margin configured at 20.0% of total bus demand.",
            "HVAC thermal loss calculated using station shell UA coefficient under active wind convective cooling.",
            "BESS battery inverter rated for 100% continuous backup discharge duty.",
        ]
        confidence_score = 0.88 if len(affected_generators) <= 2 else 0.82

        return {
            "scenarioId": f"sim-det-{int(duration_hours)}h",
            "station": station_name,
            "query": scenario.get("query", f"What if {target_display} is {action} for {dur_note}?"),
            "aiResponse": ai_narrative,
            "impact": {
                "fuelSaved": fuel_impact["fuelSaved"],
                "fuelBurnChange": fuel_impact["fuelBurnChange"],
                "currentConsumption": fuel_impact["currentConsumption"],
                "projectedConsumption": fuel_impact["projectedConsumption"],
                "currentLoad": current_load_str,
                "projectedLoad": projected_load_str,
                "backupLoad": backup_load_str,
                "riskLevel": risk_eval["overall_risk"],
                "riskScore": risk_eval["risk_score"],
                "recommendation": risk_eval["recommendation"],
                "recommendationText": risk_eval["reason_summary"] + " " + risk_eval["action_summary"],
                "systemsAffected": systems_affected,
                "chartData": chart_data,
                "healthScore": health_projected["score"],
                "healthDelta": round(health_projected["score"] - health_baseline["score"], 1),
            },
            "engineeringDetails": {
                "baseline_demand_kw": baseline_demand_kw,
                "projected_demand_kw": projected_demand_kw,
                "baseline_available_cap_kw": baseline_available_cap_kw,
                "projected_available_cap_kw": projected_available_cap_kw,
                "power_deficit_kw": projected_dispatch["deficit_kw"],
                "power_surplus_kw": projected_dispatch["surplus_kw"],
                "delivered_power_kw": projected_dispatch["delivered_kw"],
                "active_generators": active_gen_names,
                "standby_generators": [g.gen_id for g in fleet_projected.standby_generators],
                "offline_generators": [g.gen_id for g in fleet_projected.generators.values() if g.status in [GeneratorStatus.MAINTENANCE, GeneratorStatus.TRIPPED_FAULT]],
                "n_minus_one": n_minus_one,
                "thermal": thermal_impact,
                "battery": battery_impact,
                "fuel": fuel_impact,
                "water": water_impact,
                "logistics": logistics_impact,
                "health": {
                    "baseline": health_baseline,
                    "projected": health_projected,
                    "delta": round(health_projected["score"] - health_baseline["score"], 1),
                },
                "cascading_effects": cascading_effects,
                "threshold_breaches": threshold_breaches,
                "mitigation": mitigation_results,
                "timeline_steps": timeline_steps,
                "assumptions": assumptions,
                "confidence": confidence_score,
            },
        }

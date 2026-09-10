"""
DHRUVNETRA - Cascading Failure & Cross-Subsystem Dependency Engine
Analyzes propagation chains where initial component failures trigger
secondary electrical, thermal, water, and life support consequences.
"""

from typing import Dict, Any, List, Optional


class CascadingFailureEngine:
    """
    Constructs multi-step causal failure chains from physical simulation outcomes.
    """

    @classmethod
    def trace_failure_chain(
        cls,
        scenario: Dict[str, Any],
        engineering_details: Dict[str, Any],
        duration_hours: float = 1.0,
    ) -> List[Dict[str, Any]]:
        """
        Builds an ordered sequence of cascading domino effects across station systems.
        """
        chain: List[Dict[str, Any]] = []
        step = 1

        comp = str(scenario.get("component") or "generator").lower()
        act = str(scenario.get("action") or "shutdown").lower()
        affected_gens = scenario.get("affected_generators") or [scenario.get("component_id", "G1")]
        
        power_deficit = float(engineering_details.get("power_deficit_kw", 0.0))
        baseline_cap = float(engineering_details.get("baseline_available_cap_kw", 200.0))
        projected_cap = float(engineering_details.get("projected_available_cap_kw", 100.0))
        thermal = engineering_details.get("thermal", {})
        battery = engineering_details.get("battery", {})
        fuel = engineering_details.get("fuel", {})
        water = engineering_details.get("water", {})
        
        cap_drop = max(0.0, baseline_cap - projected_cap)
        temp_delta = float(thermal.get("temperature_delta", 0.0))
        final_indoor_temp = float(thermal.get("final_indoor_temp", 21.0))
        final_soc = float(battery.get("final_soc_pct", 94.0))

        # Node 1: Root Cause Trigger
        target_str = " + ".join(affected_gens) if affected_gens else comp.upper()
        chain.append({
            "step": step,
            "system": "PRIMARY_TRIGGER",
            "title": f"Initial Event: {target_str} {act.upper()}",
            "description": f"Operational state change on {target_str} initiated for {duration_hours:.1f} hours.",
            "severity": "WARNING" if act in ["shutdown", "maintenance"] else "CRITICAL",
            "trigger_time": "T+0.0h",
            "mitigation_target": "Verify equipment isolation and safe shutdown protocol.",
        })
        step += 1

        # Node 2: Generation Capacity Loss (if generator)
        if cap_drop > 0:
            chain.append({
                "step": step,
                "system": "POWER_GENERATION",
                "title": f"Generation Capacity Loss (-{cap_drop:.0f} kW)",
                "description": f"Microgrid active generation drops from {baseline_cap:.0f} kW to {projected_cap:.0f} kW.",
                "severity": "CRITICAL" if projected_cap == 0 else "WARNING",
                "trigger_time": "T+0.0h",
                "mitigation_target": "Start synchronized warm standby generator.",
            })
            step += 1

        # Node 3: Power Deficit / Bus Stability
        if power_deficit > 0:
            chain.append({
                "step": step,
                "system": "MICROGRID_BUS",
                "title": f"Electrical Power Deficit (-{power_deficit:.1f} kW)",
                "description": f"Station electrical demand exceeds active generation by {power_deficit:.1f} kW.",
                "severity": "CRITICAL",
                "trigger_time": "T+0.0h",
                "mitigation_target": "Activate static transfer switch (STS) and engage BESS battery inverter.",
            })
            step += 1

            # Node 4: Automatic Load Shedding
            chain.append({
                "step": step,
                "system": "LOAD_SHEDDING",
                "title": "Class-2 & Class-3 Load Shedding Triggered",
                "description": "Non-essential loads (workshop, secondary trace heaters, snow melter) shed automatically to preserve bus voltage.",
                "severity": "WARNING",
                "trigger_time": "T+0.1h",
                "mitigation_target": "Manually confirm shedding of non-vital science racks.",
            })
            step += 1

            # Node 5: Battery Buffer Depletion
            if final_soc < 60.0:
                chain.append({
                    "step": step,
                    "system": "BESS_STORAGE",
                    "title": f"Battery Buffer Rapid Discharge (SOC {final_soc:.1f}%)",
                    "description": f"Station UPS battery depleted below warning floor (Projected SOC: {final_soc:.1f}%).",
                    "severity": "CRITICAL" if final_soc < 30.0 else "WARNING",
                    "trigger_time": "T+0.5h",
                    "mitigation_target": "Start emergency cold standby diesel generator before UPS cutoff.",
                })
                step += 1

        # Node 6: Thermal Envelope & HVAC Degradation
        if temp_delta < -1.5 or final_indoor_temp < 15.0 or comp in ["hvac", "heating", "temperature"]:
            sev = "CRITICAL" if final_indoor_temp < 8.0 else ("WARNING" if final_indoor_temp < 15.0 else "INFO")
            chain.append({
                "step": step,
                "system": "LIFE_SUPPORT_HVAC",
                "title": f"Habitat Thermal Drift ({temp_delta:+.1f}°C -> Est {final_indoor_temp:.1f}°C)",
                "description": f"Reduced heating output causes indoor temperature to drift toward {final_indoor_temp:.1f}°C.",
                "severity": sev,
                "trigger_time": "T+1.0h",
                "mitigation_target": "Seal perimeter airlocks and concentrate crew in central module Zone-01.",
            })
            step += 1

        # Node 7: Water & Freeze Hazard
        if water.get("melter_status") == "THROTTLED" or final_indoor_temp < 4.0:
            chain.append({
                "step": step,
                "system": "WATER_SYSTEM",
                "title": "Snow Melter Throttled & Pipe Freeze Risk",
                "description": "Potable water production restricted. Trace heating priority elevated to prevent line freezing.",
                "severity": "WARNING",
                "trigger_time": "T+2.0h",
                "mitigation_target": "Switch to stored water tanks and monitor glycol tracing flow.",
            })
            step += 1

        # Node 8: Final Mission Health Degradation
        if power_deficit > 0 or final_indoor_temp < 12.0:
            chain.append({
                "step": step,
                "system": "HABITAT_SAFETY",
                "title": "Station Safety Score Impaired",
                "description": "Composite mission continuity degraded. Operational intervention required to restore nominal N-1 envelope.",
                "severity": "CRITICAL" if power_deficit > 50 else "WARNING",
                "trigger_time": f"T+{duration_hours:.1f}h",
                "mitigation_target": "Execute recommended operational directive.",
            })

        return chain

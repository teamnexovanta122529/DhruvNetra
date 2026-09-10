"""
DHRUVNETRA - Rule-Based Polar Risk Assessment Engine
Evaluates deterministic simulation outputs against configurable Antarctic safety thresholds.

DISCLAIMER:
-----------
Thresholds and penalties loaded by this engine are prototype assumptions for SIH 2026.
They must be replaced with validated NCPOR/MoES operational standards before real-world deployment.
"""

import json
import os
from pathlib import Path
from typing import Dict, Any, List, Optional

CONFIG_FILE_PATH = Path(__file__).resolve().parent.parent / "config" / "risk_thresholds.json"


class RiskEngine:
    """
    Rule-based safety matrix and risk evaluation engine for Antarctic station simulations.
    """

    def __init__(self, config_path: Optional[Path] = None):
        self.config_path = config_path or CONFIG_FILE_PATH
        self.config = self._load_config()

    def _load_config(self) -> Dict[str, Any]:
        """
        Loads threshold parameters from centralized JSON config file.
        Falls back to safe built-in defaults if file cannot be read.
        """
        if os.path.exists(self.config_path):
            try:
                with open(self.config_path, "r", encoding="utf-8") as f:
                    return json.load(f)
            except Exception as e:
                print(f"[!] Warning: Failed to parse {self.config_path}: {e}. Using internal defaults.")

        # Fallback default configuration
        return {
            "risk_scale": {
                "LOW": {"min_score": 0, "max_score": 30, "default_recommendation": "RECOMMENDED"},
                "MEDIUM": {"min_score": 31, "max_score": 60, "default_recommendation": "CAUTION ADVISED"},
                "HIGH": {"min_score": 61, "max_score": 85, "default_recommendation": "ACTION REQUIRED"},
                "CRITICAL": {"min_score": 86, "max_score": 100, "default_recommendation": "EMERGENCY INTERVENTION"},
            },
            "thresholds": {
                "power_deficit": {"critical_deficit_kw": 0.1, "max_penalty": 70},
                "generator_loading": {"overload_warning_pct": 85.0, "overload_critical_pct": 95.0, "underload_warning_pct": 35.0},
                "generator_redundancy": {"zero_running_reserve_with_warm_standby": 10, "zero_running_reserve_no_standby": 30},
                "battery_soc": {"critical_floor_pct": 30.0, "warning_floor_pct": 60.0},
                "fuel_reserves": {"critical_runway_days": 5.0, "warning_runway_days": 15.0},
                "indoor_temperature": {"crew_comfort_floor_c": 12.0, "freeze_hazard_floor_c": 4.0},
            }
        }

    def reload_config(self):
        """Reloads the threshold configuration from disk."""
        self.config = self._load_config()

    def evaluate(self, simulation_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Evaluates physical simulation metrics and returns overall risk,
        individual risk factor scores, reasons, and recommended operational actions.

        Parameters:
        -----------
        simulation_data: Dictionary containing:
            - power_deficit_kw
            - active_generator_load_pct
            - standby_generators_count
            - n_minus_one_satisfied
            - final_battery_soc_pct
            - fuel_reserve_days
            - fuel_level_pct
            - final_indoor_temp_c
            - outdoor_temp_c
            - hvac_operational
        """
        thresholds = self.config.get("thresholds", {})
        base_score = 10  # Baseline ambient polar risk
        total_score = base_score

        factor_evaluations = {}
        risk_reasons = []
        action_items = []

        # ----------------------------------------------------------------------
        # 1. FACTOR: POWER DEFICIT
        # ----------------------------------------------------------------------
        deficit_cfg = thresholds.get("power_deficit", {})
        power_deficit = float(simulation_data.get("power_deficit_kw", 0.0))
        deficit_score = 0

        if power_deficit > deficit_cfg.get("critical_deficit_kw", 0.1):
            deficit_score = deficit_cfg.get("max_penalty", 70)
            status = "CRITICAL_DEFICIT"
            risk_reasons.append(f"Electrical power deficit of {power_deficit:.1f} kW exceeds generation capacity.")
            action_items.append("Trigger emergency auto-start of cold standby generator and execute Class-3 load shedding.")
        else:
            status = "NOMINAL_BALANCE"

        total_score += deficit_score
        factor_evaluations["power_deficit"] = {
            "name": deficit_cfg.get("name", "Microgrid Power Deficit"),
            "value": f"{power_deficit:.1f} kW",
            "score_impact": deficit_score,
            "status": status,
        }

        # ----------------------------------------------------------------------
        # 2. FACTOR: GENERATOR LOADING
        # ----------------------------------------------------------------------
        gen_cfg = thresholds.get("generator_loading", {})
        load_penalties = gen_cfg.get("penalties", {})
        max_load_pct = float(simulation_data.get("active_generator_load_pct", 0.0))
        gen_score = 0

        if max_load_pct >= gen_cfg.get("overload_critical_pct", 95.0):
            gen_score = load_penalties.get("overload_critical", 35)
            status = "CRITICAL_OVERLOAD"
            risk_reasons.append(f"Running generator operating at {max_load_pct:.1f}% capacity (exceeds 95% threshold).")
            action_items.append("Spin up secondary synchronized generator to share microgrid load.")
        elif max_load_pct >= gen_cfg.get("overload_warning_pct", 85.0):
            gen_score = load_penalties.get("overload_warning", 20)
            status = "HIGH_LOAD_WARNING"
            risk_reasons.append(f"Generator operating at {max_load_pct:.1f}% load (approaching 85% continuous ceiling).")
            action_items.append("Maintain backup generator on pre-heated warm standby ready for auto-transfer.")
        elif 0 < max_load_pct < gen_cfg.get("underload_warning_pct", 35.0):
            gen_score = load_penalties.get("underload_fouling", 10)
            status = "UNDERLOAD_WET_STACKING"
            risk_reasons.append(f"Generators underloaded at {max_load_pct:.1f}% (risk of exhaust carbon fouling).")
            action_items.append("Engage snow melter or dump load resistor to bring generator above 50% load.")
        else:
            status = "OPTIMAL_EFFICIENCY"

        total_score += gen_score
        factor_evaluations["generator_loading"] = {
            "name": gen_cfg.get("name", "Generator Operating Load Factor"),
            "value": f"{max_load_pct:.1f}%",
            "score_impact": gen_score,
            "status": status,
        }

        # ----------------------------------------------------------------------
        # 3. FACTOR: GENERATOR N-1 REDUNDANCY
        # ----------------------------------------------------------------------
        red_cfg = thresholds.get("generator_redundancy", {})
        red_penalties = red_cfg.get("penalties", {})
        n1_satisfied = bool(simulation_data.get("n_minus_one_satisfied", True))
        standby_count = int(simulation_data.get("standby_generators_count", 0))
        active_count = int(simulation_data.get("active_generators_count", 1))
        red_score = 0

        if active_count == 0:
            red_score = 60
            status = "CRITICAL_BLACKOUT_RISK"
            risk_reasons.append("Zero active generators remaining on microgrid bus. Total loss of primary generation.")
            action_items.append("CRITICAL: Engage emergency generator start sequence immediately. Isolate non-essential circuits to preserve UPS battery buffer.")
        elif not n1_satisfied:
            if standby_count > 0:
                red_score = red_penalties.get("zero_running_reserve_with_warm_standby", 10)
                status = "STANDBY_PROTECTED"
                risk_reasons.append("N-1 running reserve depleted; single generator carrying full station load.")
                action_items.append("Verify static transfer switch (STS) and standby jacket water heaters are active.")
            else:
                red_score = red_penalties.get("zero_running_reserve_no_standby", 30)
                status = "NO_RESERVE_EXPOSURE"
                risk_reasons.append("Zero spinning reserve and no standby generator available.")
                action_items.append("Expedite maintenance on offline generators immediately.")
        else:
            status = "N1_REDUNDANT"

        total_score += red_score
        factor_evaluations["generator_redundancy"] = {
            "name": red_cfg.get("name", "N-1 Redundancy"),
            "value": f"{active_count} Active / {standby_count} Standby",
            "score_impact": red_score,
            "status": status,
        }

        # ----------------------------------------------------------------------
        # 4. FACTOR: BATTERY STATE OF CHARGE (BESS)
        # ----------------------------------------------------------------------
        bat_cfg = thresholds.get("battery_soc", {})
        bat_penalties = bat_cfg.get("penalties", {})
        battery_soc = float(simulation_data.get("final_battery_soc_pct", 94.0))
        bat_score = 0

        if battery_soc < bat_cfg.get("critical_floor_pct", 30.0):
            bat_score = bat_penalties.get("critical_soc", 40)
            status = "CRITICAL_DEPLETION"
            risk_reasons.append(f"Battery buffer depleted to {battery_soc:.1f}% (below 30% emergency threshold).")
            action_items.append("Isolate non-critical bus to recharge battery bank.")
        elif battery_soc < bat_cfg.get("warning_floor_pct", 60.0):
            bat_score = bat_penalties.get("warning_soc", 18)
            status = "LOW_SOC_WARNING"
            risk_reasons.append(f"Battery SOC degraded to {battery_soc:.1f}%.")
            action_items.append("Monitor DC bus inverter voltage.")
        else:
            status = "BUFFER_NOMINAL"

        total_score += bat_score
        factor_evaluations["battery_soc"] = {
            "name": bat_cfg.get("name", "BESS Battery State of Charge"),
            "value": f"{battery_soc:.1f}%",
            "score_impact": bat_score,
            "status": status,
        }

        # ----------------------------------------------------------------------
        # 5. FACTOR: FUEL RESERVES
        # ----------------------------------------------------------------------
        fuel_cfg = thresholds.get("fuel_reserves", {})
        fuel_penalties = fuel_cfg.get("penalties", {})
        runway_days = float(simulation_data.get("fuel_reserve_days", 20.0))
        fuel_pct = float(simulation_data.get("fuel_level_pct", 70.0))
        fuel_score = 0

        if runway_days < fuel_cfg.get("critical_runway_days", 5.0) or fuel_pct < fuel_cfg.get("critical_tank_pct", 20.0):
            fuel_score = fuel_penalties.get("critical_runway", 45)
            status = "CRITICAL_LOW_STOCK"
            risk_reasons.append(f"Bulk fuel reserve at {fuel_pct:.1f}% ({runway_days:.1f} days endurance).")
            action_items.append("Engage extreme fuel conservation mode (Protocol 2B) and notify NCPOR Command.")
        elif runway_days < fuel_cfg.get("warning_runway_days", 15.0) or fuel_pct < fuel_cfg.get("warning_tank_pct", 35.0):
            fuel_score = fuel_penalties.get("warning_runway", 20)
            status = "ENDURANCE_WARNING"
            risk_reasons.append(f"Fuel stock endurance stands at {runway_days:.1f} days.")
            action_items.append("Throttle auxiliary heating zones and optimize generator schedules.")
        else:
            status = "STOCK_SUFFICIENT"

        total_score += fuel_score
        factor_evaluations["fuel_reserves"] = {
            "name": fuel_cfg.get("name", "Bulk Fuel Runway"),
            "value": f"{runway_days:.1f} Days ({fuel_pct:.1f}%)",
            "score_impact": fuel_score,
            "status": status,
        }

        # ----------------------------------------------------------------------
        # 6. FACTOR: INDOOR TEMPERATURE & FREEZE RISK
        # ----------------------------------------------------------------------
        temp_cfg = thresholds.get("indoor_temperature", {})
        temp_penalties = temp_cfg.get("penalties", {})
        indoor_temp = float(simulation_data.get("final_indoor_temp_c", 19.0))
        temp_score = 0

        if indoor_temp <= temp_cfg.get("freeze_hazard_floor_c", 4.0):
            temp_score = temp_penalties.get("pipe_freeze_danger", 55)
            status = "FREEZE_HAZARD_CRITICAL"
            risk_reasons.append(f"Habitat temperature plunges to {indoor_temp:.1f}°C (water distribution freeze danger).")
            action_items.append("Activate auxiliary glycol circulation pumps and trace heating on all wet utility conduits.")
        elif indoor_temp <= temp_cfg.get("crew_comfort_floor_c", 12.0):
            temp_score = temp_penalties.get("crew_discomfort", 20)
            status = "THERMAL_DISCOMFORT"
            risk_reasons.append(f"Indoor temperature drops to {indoor_temp:.1f}°C (below comfort band).")
            action_items.append("Seal external airlocks and increase thermal loop output.")
        else:
            status = "HABITAT_COMFORTABLE"

        total_score += temp_score
        factor_evaluations["indoor_temperature"] = {
            "name": temp_cfg.get("name", "Habitat Interior Thermal Retention"),
            "value": f"{indoor_temp:.1f}°C",
            "score_impact": temp_score,
            "status": status,
        }

        # ----------------------------------------------------------------------
        # 7. MAP COMPOSITE SCORE TO RISK LEVEL & SUB-RISKS
        # ----------------------------------------------------------------------
        total_score = min(100, max(0, total_score))
        risk_scale = self.config.get("risk_scale", {})

        if total_score <= risk_scale.get("LOW", {}).get("max_score", 30):
            overall_risk = "LOW"
            default_rec = risk_scale.get("LOW", {}).get("default_recommendation", "RECOMMENDED")
        elif total_score <= risk_scale.get("MEDIUM", {}).get("max_score", 60):
            overall_risk = "MEDIUM"
            default_rec = risk_scale.get("MEDIUM", {}).get("default_recommendation", "CAUTION ADVISED")
        elif total_score <= risk_scale.get("HIGH", {}).get("max_score", 85):
            overall_risk = "HIGH"
            default_rec = risk_scale.get("HIGH", {}).get("default_recommendation", "ACTION REQUIRED")
        else:
            overall_risk = "CRITICAL"
            default_rec = risk_scale.get("CRITICAL", {}).get("default_recommendation", "EMERGENCY INTERVENTION")

        # Specific sub-domain risk mappings
        power_risk_score = min(100, deficit_score + red_score + gen_score)
        power_risk_level = "CRITICAL" if power_deficit > 0.1 or active_count == 0 else ("HIGH" if max_load_pct > 90 else ("MEDIUM" if not n1_satisfied else "LOW"))

        fuel_risk_score = min(100, fuel_score * 2)
        fuel_risk_level = "CRITICAL" if runway_days < 5.0 or fuel_pct < 20.0 else ("HIGH" if runway_days < 15.0 else ("MEDIUM" if runway_days < 30.0 else "LOW"))

        env_risk_score = min(100, temp_score * 2)
        env_risk_level = "CRITICAL" if indoor_temp <= 4.0 else ("HIGH" if indoor_temp <= 12.0 else ("MEDIUM" if indoor_temp <= 18.0 else "LOW"))

        safety_risk_level = "CRITICAL" if (power_deficit > 0 and indoor_temp < 12.0) or indoor_temp <= 4.0 or battery_soc < 25.0 else ("HIGH" if power_deficit > 0 else ("MEDIUM" if max_load_pct > 85.0 else "LOW"))

        mission_risk_level = "CRITICAL" if active_count == 0 or runway_days < 5.0 else ("HIGH" if power_deficit > 0 or not n1_satisfied else ("MEDIUM" if max_load_pct > 85.0 else "LOW"))

        sub_risks = {
            "power_risk": {"level": power_risk_level, "score": power_risk_score},
            "fuel_risk": {"level": fuel_risk_level, "score": fuel_risk_score},
            "environmental_risk": {"level": env_risk_level, "score": env_risk_score},
            "safety_risk": {"level": safety_risk_level, "score": min(100, int(total_score * 0.9))},
            "mission_continuity_risk": {"level": mission_risk_level, "score": min(100, int(total_score * 0.85))},
        }

        # Compile concise summary explanation
        if not risk_reasons:
            reasons_summary = "All monitored station microgrid, thermal, and fuel systems operate within nominal safety thresholds."
        else:
            reasons_summary = " ".join(risk_reasons)

        if not action_items:
            actions_summary = "Continue standard automated SCADA monitoring. Maintain scheduled maintenance rotations."
        else:
            actions_summary = " ".join(action_items)

        return {
            "overall_risk": overall_risk,
            "risk_score": total_score,
            "recommendation": default_rec,
            "recommended_action": default_rec,
            "reasons": risk_reasons,
            "reason_summary": reasons_summary,
            "recommended_actions": action_items,
            "action_summary": actions_summary,
            "factors": factor_evaluations,
            "sub_risks": sub_risks,
            "_metadata": {
                "config_version": self.config.get("version", "1.0.0"),
                "disclaimer": self.config.get("_disclaimer", "PROTOTYPE ASSUMPTION"),
            }
        }

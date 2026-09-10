"""
DHRUVNETRA - Station Health & Mission Integrity Scoring Model
Calculates quantitative health scores (0-100) for Baseline vs Projected states
with itemized point deductions across electrical, thermal, fuel, water, and redundancy vectors.
"""

from typing import Dict, Any, List


class StationHealthEngine:
    """
    Evaluates dynamic Antarctic station health score.
    """

    @classmethod
    def calculate_health(
        cls,
        metrics: Dict[str, Any],
        is_baseline: bool = False,
    ) -> Dict[str, Any]:
        """
        Calculates composite station health score (0-100) and deduction breakdown.
        """
        score = 100.0
        deductions: List[Dict[str, Any]] = []

        # 1. Power Deficit Penalty
        deficit = float(metrics.get("power_deficit_kw", 0.0))
        if deficit > 50.0:
            pen = 45.0
            score -= pen
            deductions.append({"factor": "Critical Microgrid Deficit", "penalty": pen, "reason": f"{deficit:.1f} kW unserved load exceeds backup limits."})
        elif deficit > 0.1:
            pen = 25.0
            score -= pen
            deductions.append({"factor": "Microgrid Power Deficit", "penalty": pen, "reason": f"{deficit:.1f} kW power shortfall requiring load shedding."})

        # 2. Generator Overload & Redundancy
        active_count = int(metrics.get("active_generators_count", 2))
        max_load_pct = float(metrics.get("active_generator_load_pct", 75.0))
        n1_ok = bool(metrics.get("n_minus_one_satisfied", True))

        if active_count == 0:
            pen = 30.0
            score -= pen
            deductions.append({"factor": "Zero Active Generation", "penalty": pen, "reason": "Total loss of running generator fleet."})
        elif not n1_ok and active_count == 1:
            pen = 12.0
            score -= pen
            deductions.append({"factor": "Loss of N-1 Redundancy", "penalty": pen, "reason": "Single generator carrying full station load without running reserve."})

        if max_load_pct > 95.0:
            pen = 15.0
            score -= pen
            deductions.append({"factor": "Generator Severe Overload", "penalty": pen, "reason": f"Running unit loaded at {max_load_pct:.1f}% (exceeds 95% threshold)."})
        elif max_load_pct > 85.0:
            pen = 8.0
            score -= pen
            deductions.append({"factor": "Generator High Load", "penalty": pen, "reason": f"Running unit at {max_load_pct:.1f}% approaching continuous ceiling."})

        # 3. Thermal & Habitat Comfort
        indoor_temp = float(metrics.get("final_indoor_temp_c", metrics.get("indoor_temp_c", 21.0)))
        if indoor_temp < 4.0:
            pen = 35.0
            score -= pen
            deductions.append({"factor": "Severe Freeze Hazard", "penalty": pen, "reason": f"Habitat temperature dropped to {indoor_temp:.1f}°C (risk of hypothermia & pipe rupture)."})
        elif indoor_temp < 12.0:
            pen = 18.0
            score -= pen
            deductions.append({"factor": "Thermal Comfort Violation", "penalty": pen, "reason": f"Indoor temperature at {indoor_temp:.1f}°C below safe 15°C baseline."})
        elif indoor_temp < 18.0:
            pen = 6.0
            score -= pen
            deductions.append({"factor": "Mild Thermal Drift", "penalty": pen, "reason": f"Indoor temperature at {indoor_temp:.1f}°C."})

        # 4. Battery Storage State
        soc = float(metrics.get("battery_soc_pct", 94.0))
        if soc < 30.0:
            pen = 20.0
            score -= pen
            deductions.append({"factor": "Critical Battery Depletion", "penalty": pen, "reason": f"UPS battery reserve at {soc:.1f}% (below 30% emergency floor)."})
        elif soc < 60.0:
            pen = 10.0
            score -= pen
            deductions.append({"factor": "Battery Buffer Discharge", "penalty": pen, "reason": f"UPS battery at {soc:.1f}%."})

        # 5. Fuel Runway
        fuel_days = float(metrics.get("fuel_reserve_days", 110.0))
        if fuel_days < 7.0:
            pen = 25.0
            score -= pen
            deductions.append({"factor": "Critical Fuel Depletion", "penalty": pen, "reason": f"Fuel endurance reduced to {fuel_days:.1f} days."})
        elif fuel_days < 20.0:
            pen = 10.0
            score -= pen
            deductions.append({"factor": "Thin Fuel Reserve", "penalty": pen, "reason": f"Fuel endurance at {fuel_days:.1f} days."})

        final_score = max(5.0, min(100.0, round(score, 1)))
        
        status = "OPTIMAL"
        if final_score < 40.0:
            status = "CRITICAL_IMPAIRED"
        elif final_score < 70.0:
            status = "DEGRADED_OPERATION"
        elif final_score < 85.0:
            status = "CAUTION_REQUIRED"

        return {
            "score": final_score,
            "status": status,
            "deductions_count": len(deductions),
            "deductions": deductions,
        }

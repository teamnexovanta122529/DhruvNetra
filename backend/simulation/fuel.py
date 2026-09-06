"""
DHRUVNETRA - Polar Fuel Storage & Consumption Dynamics Model
Deterministic engineering calculations for Arctic Diesel (HSD-A) burn rates,
bulk storage depletion, and mission endurance runway.
"""

from typing import Dict, Any, List


class FuelSubsystem:
    """
    Simulates Antarctic station bulk fuel reserves, hourly consumption delta,
    and winter stock sustainability.
    """

    def __init__(
        self,
        station_name: str,
        current_storage_liters: float = 48000.0,
        max_storage_liters: float = 60000.0,
        fuel_grade: str = "Arctic HSD-A (Pour Point -45°C)",
    ):
        self.station_name = station_name.upper()
        self.current_storage_liters = current_storage_liters
        self.max_storage_liters = max_storage_liters
        self.fuel_grade = fuel_grade

    @classmethod
    def create_for_station(cls, station_name: str, current_fuel_l: float = None) -> "FuelSubsystem":
        st = station_name.upper()
        if st == "MAITRI":
            max_l = 60000.0
            cur_l = current_fuel_l if current_fuel_l is not None else 48000.0
        elif st == "BHARATI":
            max_l = 100000.0
            cur_l = current_fuel_l if current_fuel_l is not None else 82000.0
        else:
            max_l = 50000.0
            cur_l = current_fuel_l if current_fuel_l is not None else 40000.0
        return cls(station_name=station_name, current_storage_liters=cur_l, max_storage_liters=max_l)

    @property
    def fuel_level_percentage(self) -> float:
        if self.max_storage_liters <= 0:
            return 0.0
        return round((self.current_storage_liters / self.max_storage_liters) * 100.0, 1)

    def calculate_endurance_days(self, burn_rate_lph: float) -> float:
        if burn_rate_lph <= 0.0:
            return 999.9
        return round(self.current_storage_liters / (burn_rate_lph * 24.0), 1)

    def evaluate_scenario_impact(
        self,
        baseline_burn_lph: float,
        projected_burn_lph: float,
        duration_hours: float,
    ) -> Dict[str, Any]:
        """
        Calculates the exact fuel differential between baseline operation
        and the simulated what-if configuration over the scenario duration.
        """
        burn_rate_delta_lph = round(projected_burn_lph - baseline_burn_lph, 2)
        total_fuel_delta_liters = round((baseline_burn_lph - projected_burn_lph) * duration_hours, 1)

        is_saving = total_fuel_delta_liters > 0
        fuel_saved_str = f"{abs(total_fuel_delta_liters):.1f} L" if is_saving else f"-{abs(total_fuel_delta_liters):.1f} L (Extra Burn)"
        burn_change_str = f"{burn_rate_delta_lph:+.1f} L/h"

        baseline_endurance_days = self.calculate_endurance_days(baseline_burn_lph)
        projected_endurance_days = self.calculate_endurance_days(projected_burn_lph)
        endurance_delta_days = round(projected_endurance_days - baseline_endurance_days, 2)

        # Generate temporal trajectory over scenario duration
        steps = max(2, min(8, int(duration_hours) + 1))
        time_labels = []
        baseline_curve = []
        projected_curve = []

        for step in range(steps):
            t_hour = round((step / (steps - 1)) * duration_hours, 1)
            time_labels.append(f"T+{int(t_hour)}h" if t_hour > 0 else "T-0")
            baseline_curve.append(round(baseline_burn_lph, 2))
            projected_curve.append(round(projected_burn_lph, 2))

        # Restore baseline at end of scenario
        if duration_hours > 0:
            time_labels.append(f"T+{int(duration_hours)}h (Restored)")
            baseline_curve.append(round(baseline_burn_lph, 2))
            projected_curve.append(round(baseline_burn_lph, 2))

        return {
            "fuelSaved": fuel_saved_str,
            "fuelBurnChange": burn_change_str,
            "currentConsumption": f"{baseline_burn_lph:.1f} L/h",
            "projectedConsumption": f"{projected_burn_lph:.1f} L/h",
            "baseline_burn_lph": baseline_burn_lph,
            "projected_burn_lph": projected_burn_lph,
            "total_fuel_saved_liters": total_fuel_delta_liters,
            "current_storage_liters": self.current_storage_liters,
            "fuel_level_percentage": self.fuel_level_percentage,
            "baseline_endurance_days": baseline_endurance_days,
            "projected_endurance_days": projected_endurance_days,
            "endurance_delta_days": endurance_delta_days,
            "timeline": {
                "labels": time_labels,
                "currentFuel": baseline_curve,
                "projectedFuel": projected_curve,
            },
        }

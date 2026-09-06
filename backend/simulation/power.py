"""
DHRUVNETRA - Microgrid Power & Electrical Load Balance Model
Deterministic engineering model for Antarctic station power distribution,
load categorization, and priority-based shedding.
"""

from typing import Dict, Any, List
from .generator import GeneratorFleet


class PowerSubsystem:
    """
    Simulates station microgrid electrical load composition and power flow.
    """

    def __init__(
        self,
        station_name: str,
        base_life_support_kw: float = 24.0,
        science_lab_kw: float = 18.0,
        hvac_power_kw: float = 22.0,
        snow_melter_kw: float = 12.0,
        comms_radome_kw: float = 4.0,
        auxiliary_lighting_kw: float = 2.0,
    ):
        self.station_name = station_name.upper()
        self.base_life_support_kw = base_life_support_kw
        self.science_lab_kw = science_lab_kw
        self.hvac_power_kw = hvac_power_kw
        self.snow_melter_kw = snow_melter_kw
        self.comms_radome_kw = comms_radome_kw
        self.auxiliary_lighting_kw = auxiliary_lighting_kw

    @classmethod
    def create_for_station(cls, station_name: str, hvac_kw: float = 22.0) -> "PowerSubsystem":
        st = station_name.upper()
        if st == "MAITRI":
            return cls(
                station_name="MAITRI",
                base_life_support_kw=26.0,
                science_lab_kw=16.0,
                hvac_power_kw=hvac_kw,
                snow_melter_kw=12.0,
                comms_radome_kw=4.0,
                auxiliary_lighting_kw=2.0,
            )
        elif st == "BHARATI":
            return cls(
                station_name="BHARATI",
                base_life_support_kw=28.0,
                science_lab_kw=22.0,
                hvac_power_kw=hvac_kw,
                snow_melter_kw=14.0,
                comms_radome_kw=5.0,
                auxiliary_lighting_kw=3.0,
            )
        else:
            return cls(station_name="GENERIC", hvac_power_kw=hvac_kw)

    @property
    def total_demand_kw(self) -> float:
        return round(
            self.base_life_support_kw
            + self.science_lab_kw
            + self.hvac_power_kw
            + self.snow_melter_kw
            + self.comms_radome_kw
            + self.auxiliary_lighting_kw,
            2
        )

    def calculate_balance(self, fleet: GeneratorFleet) -> Dict[str, Any]:
        """
        Calculates power balance between available generation and demand.
        Determines deficit, surplus, and shed loads if over capacity.
        """
        demand = self.total_demand_kw
        available_cap = fleet.total_available_capacity_kw

        dispatch_result = fleet.dispatch_load(demand)
        delivered_kw = dispatch_result["delivered_kw"]
        deficit_kw = dispatch_result["deficit_kw"]
        surplus_kw = dispatch_result["surplus_kw"]

        # If deficit occurs, execute priority-based load shedding
        shed_loads = []
        unmet_demand_kw = 0.0

        if deficit_kw > 0:
            remaining_deficit = deficit_kw

            # Priority 3: Shed snow melter first
            if self.snow_melter_kw > 0:
                shed_amount = min(remaining_deficit, self.snow_melter_kw)
                shed_loads.append({"name": "Snow Melter Facility", "shed_kw": shed_amount, "priority": "CLASS_3_NON_CRITICAL"})
                remaining_deficit -= shed_amount

            # Priority 2: Shed secondary lab equipment & auxiliary lighting
            if remaining_deficit > 0 and self.science_lab_kw > 6.0:
                non_crit_science = self.science_lab_kw - 6.0
                shed_amount = min(remaining_deficit, non_crit_science)
                shed_loads.append({"name": "Non-Essential Science Labs", "shed_kw": shed_amount, "priority": "CLASS_2_DEFERRABLE"})
                remaining_deficit -= shed_amount

            # Priority 1: Unmet critical load (Life support / HVAC / SATCOM)
            unmet_demand_kw = max(0.0, remaining_deficit)

        return {
            "total_demand_kw": demand,
            "available_generation_kw": available_cap,
            "delivered_power_kw": delivered_kw,
            "power_surplus_kw": surplus_kw,
            "power_deficit_kw": deficit_kw,
            "unmet_critical_demand_kw": unmet_demand_kw,
            "load_shedding_active": len(shed_loads) > 0,
            "shed_loads": shed_loads,
            "per_generator_load_kw": dispatch_result["per_gen_load"],
            "grid_stability": "NOMINAL" if deficit_kw == 0 else ("DEGRADED_SHEDDING" if unmet_demand_kw == 0 else "CRITICAL_DEFICIT"),
        }

    def to_dict(self) -> Dict[str, Any]:
        return {
            "total_demand_kw": self.total_demand_kw,
            "breakdown": {
                "base_life_support_kw": self.base_life_support_kw,
                "science_lab_kw": self.science_lab_kw,
                "hvac_power_kw": self.hvac_power_kw,
                "snow_melter_kw": self.snow_melter_kw,
                "comms_radome_kw": self.comms_radome_kw,
                "auxiliary_lighting_kw": self.auxiliary_lighting_kw,
            },
        }

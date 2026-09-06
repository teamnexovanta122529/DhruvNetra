"""
DHRUVNETRA - Polar Diesel Generator & Fleet Simulation Model
Deterministic engineering model for Antarctic diesel-electric microgrid generators.
"""

from enum import Enum
from typing import List, Dict, Any, Optional


class GeneratorStatus(str, Enum):
    ACTIVE = "ACTIVE"
    WARM_STANDBY = "WARM_STANDBY"
    OFFLINE_STANDBY = "OFFLINE_STANDBY"
    MAINTENANCE = "MAINTENANCE"
    TRIPPED_FAULT = "TRIPPED_FAULT"


class Generator:
    """
    Physical model of an individual Arctic-grade Diesel Generator Set (Genset).
    """

    def __init__(
        self,
        gen_id: str,
        name: str,
        rated_kva: float = 125.0,
        power_factor: float = 0.8,
        status: GeneratorStatus = GeneratorStatus.OFFLINE_STANDBY,
        current_load_kw: float = 0.0,
        run_hours: float = 2400.0,
    ):
        self.gen_id = gen_id.upper()
        self.name = name
        self.rated_kva = rated_kva
        self.power_factor = power_factor
        self.rated_kw = rated_kva * power_factor
        self.max_continuous_kw = self.rated_kw * 0.90  # 90% recommended continuous ceiling
        self.min_load_kw = self.rated_kw * 0.25        # 25% min to prevent wet stacking
        self.status = status
        self.current_load_kw = current_load_kw
        self.run_hours = run_hours

    @property
    def load_percentage(self) -> float:
        if self.rated_kw <= 0:
            return 0.0
        return (self.current_load_kw / self.rated_kw) * 100.0

    @property
    def is_available(self) -> bool:
        return self.status == GeneratorStatus.ACTIVE

    @property
    def is_standby(self) -> bool:
        return self.status == GeneratorStatus.WARM_STANDBY

    def calculate_bsfc(self, load_pct: float) -> float:
        """
        Brake Specific Fuel Consumption (Liters per kWh) based on standard
        marine/polar medium-speed diesel engine efficiency characteristics.
        """
        if load_pct <= 0.0:
            return 0.0
        if load_pct < 40.0:
            # Low load penalty (incomplete combustion & lower cylinder pressure)
            return 0.330 - (load_pct / 40.0) * 0.060
        elif load_pct <= 80.0:
            # Peak thermal efficiency zone
            return 0.270 - ((load_pct - 40.0) / 40.0) * 0.025
        else:
            # Overload boundary (thermal and frictional rise)
            return 0.245 + ((load_pct - 80.0) / 20.0) * 0.022

    def calculate_fuel_consumption_lph(
        self,
        load_kw: Optional[float] = None,
        outdoor_temp_celsius: float = -20.0,
    ) -> float:
        """
        Calculates fuel burn rate in Liters per Hour (L/h).
        Includes Arctic fuel cold-viscosity degradation factor.
        """
        if self.status != GeneratorStatus.ACTIVE:
            if self.status == GeneratorStatus.WARM_STANDBY:
                # Standby trace heaters maintain oil/jacket temp
                return 0.35
            return 0.0

        target_load = self.current_load_kw if load_kw is None else load_kw
        if target_load <= 0.0:
            return 0.0

        load_pct = min(100.0, (target_load / self.rated_kw) * 100.0)
        bsfc_base = self.calculate_bsfc(load_pct)

        # Cold fuel viscosity penalty factor for sub-zero temperatures
        # Arctic Grade Diesel (HSD-A) has minor thermal viscosity drag below -15C
        cold_penalty = 1.0 + max(0.0, (-outdoor_temp_celsius - 15.0) * 0.002)
        fuel_burn = target_load * bsfc_base * cold_penalty
        return round(fuel_burn, 2)

    def set_load(self, load_kw: float):
        if self.status == GeneratorStatus.ACTIVE:
            self.current_load_kw = max(0.0, min(self.rated_kw, load_kw))
        else:
            self.current_load_kw = 0.0

    def to_dict(self) -> Dict[str, Any]:
        return {
            "gen_id": self.gen_id,
            "name": self.name,
            "rated_kva": self.rated_kva,
            "rated_kw": self.rated_kw,
            "status": self.status.value,
            "current_load_kw": round(self.current_load_kw, 2),
            "load_percentage": round(self.load_percentage, 1),
            "max_continuous_kw": self.max_continuous_kw,
            "run_hours": self.run_hours,
        }


class GeneratorFleet:
    """
    Fleet manager coordinating multi-generator load dispatch, spinning reserves,
    and N+1 redundancy across an Antarctic Station.
    """

    def __init__(self, station_name: str, generators: List[Generator]):
        self.station_name = station_name.upper()
        self.generators = {g.gen_id: g for g in generators}

    @classmethod
    def create_for_station(cls, station_name: str) -> "GeneratorFleet":
        st = station_name.upper()
        if st == "MAITRI":
            gens = [
                Generator("G1", "Gen 1 (Diesel 125kVA)", rated_kva=125, status=GeneratorStatus.ACTIVE, current_load_kw=41.0, run_hours=3120),
                Generator("G2", "Gen 2 (Diesel 125kVA)", rated_kva=125, status=GeneratorStatus.ACTIVE, current_load_kw=41.0, run_hours=2840),
                Generator("G3", "Gen 3 (Standby 100kVA)", rated_kva=100, status=GeneratorStatus.WARM_STANDBY, current_load_kw=0.0, run_hours=1450),
            ]
        elif st == "BHARATI":
            gens = [
                Generator("G1", "Gen 1 (Diesel 160kVA)", rated_kva=160, status=GeneratorStatus.ACTIVE, current_load_kw=44.5, run_hours=4100),
                Generator("G2", "Gen 2 (Diesel 160kVA)", rated_kva=160, status=GeneratorStatus.ACTIVE, current_load_kw=44.5, run_hours=3980),
                Generator("G3", "Gen 3 (Diesel 160kVA)", rated_kva=160, status=GeneratorStatus.WARM_STANDBY, current_load_kw=0.0, run_hours=2100),
                Generator("G4", "Gen 4 (Standby 160kVA)", rated_kva=160, status=GeneratorStatus.OFFLINE_STANDBY, current_load_kw=0.0, run_hours=980),
            ]
        else:
            gens = [
                Generator("G1", "Primary Gen (125kVA)", rated_kva=125, status=GeneratorStatus.ACTIVE, current_load_kw=40.0),
                Generator("G2", "Secondary Gen (125kVA)", rated_kva=125, status=GeneratorStatus.ACTIVE, current_load_kw=40.0),
            ]
        return cls(station_name, gens)

    def get_generator(self, gen_id: str) -> Optional[Generator]:
        # Normalize G1, GEN1, GEN_1, 1 -> G1
        clean_id = gen_id.upper().replace("GEN", "G").replace("_", "").replace(" ", "").replace("-", "")
        if clean_id.isdigit():
            clean_id = f"G{clean_id}"
        return self.generators.get(clean_id)

    @property
    def active_generators(self) -> List[Generator]:
        return [g for g in self.generators.values() if g.status == GeneratorStatus.ACTIVE]

    @property
    def standby_generators(self) -> List[Generator]:
        return [g for g in self.generators.values() if g.status in [GeneratorStatus.WARM_STANDBY, GeneratorStatus.OFFLINE_STANDBY]]

    @property
    def total_installed_capacity_kw(self) -> float:
        return sum(g.rated_kw for g in self.generators.values())

    @property
    def total_available_capacity_kw(self) -> float:
        return sum(g.rated_kw for g in self.active_generators)

    @property
    def total_max_continuous_capacity_kw(self) -> float:
        return sum(g.max_continuous_kw for g in self.active_generators)

    @property
    def total_current_load_kw(self) -> float:
        return sum(g.current_load_kw for g in self.active_generators)

    def dispatch_load(self, total_demand_kw: float) -> Dict[str, Any]:
        """
        Dispatches electrical load evenly across all currently active generators.
        Returns dispatch telemetry including per-gen loads and capacity utilization.
        """
        active = self.active_generators
        if not active:
            return {
                "delivered_kw": 0.0,
                "deficit_kw": total_demand_kw,
                "surplus_kw": 0.0,
                "per_gen_load": {g.gen_id: 0.0 for g in self.generators.values()},
                "overloaded": True,
            }

        total_cap = sum(g.rated_kw for g in active)
        delivered_kw = min(total_demand_kw, total_cap)
        deficit_kw = max(0.0, total_demand_kw - total_cap)
        surplus_kw = max(0.0, total_cap - total_demand_kw)

        # Equal proportion dispatch based on rated capacities
        per_gen_load = {}
        for g in active:
            proportion = g.rated_kw / total_cap
            assigned_kw = round(delivered_kw * proportion, 2)
            g.set_load(assigned_kw)
            per_gen_load[g.gen_id] = assigned_kw

        # Set standby/offline to 0
        for g in self.standby_generators:
            g.set_load(0.0)
            per_gen_load[g.gen_id] = 0.0

        return {
            "delivered_kw": round(delivered_kw, 2),
            "deficit_kw": round(deficit_kw, 2),
            "surplus_kw": round(surplus_kw, 2),
            "per_gen_load": per_gen_load,
            "overloaded": deficit_kw > 0.0,
        }

    def calculate_total_fuel_burn_lph(self, outdoor_temp_celsius: float = -20.0) -> float:
        return round(
            sum(g.calculate_fuel_consumption_lph(outdoor_temp_celsius=outdoor_temp_celsius) for g in self.generators.values()),
            2
        )

    def check_n_minus_one(self, current_demand_kw: float) -> Dict[str, Any]:
        """
        Evaluates N-1 redundancy: If the largest currently running generator trips,
        can the remaining active generators handle the current demand without deficit?
        """
        active = self.active_generators
        if len(active) <= 1:
            return {
                "n_minus_one_satisfied": False,
                "largest_gen_kw": active[0].rated_kw if active else 0.0,
                "remaining_capacity_kw": 0.0,
                "deficit_on_trip_kw": current_demand_kw,
                "risk_reason": "Single point of failure: zero running redundancy.",
            }

        largest_gen = max(active, key=lambda g: g.rated_kw)
        remaining_cap = sum(g.rated_kw for g in active if g.gen_id != largest_gen.gen_id)
        satisfied = remaining_cap >= current_demand_kw

        return {
            "n_minus_one_satisfied": satisfied,
            "largest_gen_kw": largest_gen.rated_kw,
            "remaining_capacity_kw": remaining_cap,
            "deficit_on_trip_kw": max(0.0, current_demand_kw - remaining_cap),
            "risk_reason": "N-1 redundancy satisfied." if satisfied else f"Capacity deficit of {current_demand_kw - remaining_cap:.1f} kW if {largest_gen.gen_id} trips.",
        }

    def to_dict(self) -> Dict[str, Any]:
        return {
            "station": self.station_name,
            "total_installed_capacity_kw": self.total_installed_capacity_kw,
            "total_available_capacity_kw": self.total_available_capacity_kw,
            "active_generators_count": len(self.active_generators),
            "generators": [g.to_dict() for g in self.generators.values()],
        }

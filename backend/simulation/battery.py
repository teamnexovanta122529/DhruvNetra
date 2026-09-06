"""
DHRUVNETRA - Battery Energy Storage System (BESS) Simulation Model
Deterministic calculations for station microgrid UPS battery banks,
deficit buffering, and State of Charge (SOC) progression.
"""

from typing import Dict, Any, List


class BatterySubsystem:
    """
    Simulates Antarctic station battery energy storage bank (LiFePO4 / Lead-Crystal),
    providing static transfer buffer and emergency deficit shaving.
    """

    def __init__(
        self,
        station_name: str,
        capacity_kwh: float = 140.0,
        current_soc_pct: float = 94.0,
        max_inverter_power_kw: float = 60.0,
        round_trip_efficiency: float = 0.92,
        min_reserve_soc_pct: float = 25.0,  # Critical emergency floor
    ):
        self.station_name = station_name.upper()
        self.capacity_kwh = capacity_kwh
        self.current_soc_pct = current_soc_pct
        self.max_inverter_power_kw = max_inverter_power_kw
        self.round_trip_efficiency = round_trip_efficiency
        self.min_reserve_soc_pct = min_reserve_soc_pct

    @classmethod
    def create_for_station(cls, station_name: str, current_soc: float = 94.0) -> "BatterySubsystem":
        st = station_name.upper()
        if st == "MAITRI":
            return cls(
                station_name="MAITRI",
                capacity_kwh=120.0,
                current_soc_pct=current_soc,
                max_inverter_power_kw=50.0,
            )
        elif st == "BHARATI":
            return cls(
                station_name="BHARATI",
                capacity_kwh=180.0,
                current_soc_pct=current_soc,
                max_inverter_power_kw=75.0,
            )
        else:
            return cls(station_name="GENERIC", current_soc_pct=current_soc)

    @property
    def current_stored_energy_kwh(self) -> float:
        return (self.current_soc_pct / 100.0) * self.capacity_kwh

    @property
    def usable_energy_kwh(self) -> float:
        usable_soc = max(0.0, self.current_soc_pct - self.min_reserve_soc_pct)
        return (usable_soc / 100.0) * self.capacity_kwh

    def calculate_runtime_hours(self, discharge_power_kw: float) -> float:
        if discharge_power_kw <= 0.0:
            return 999.9
        effective_power = min(discharge_power_kw, self.max_inverter_power_kw)
        runtime = (self.usable_energy_kwh * self.round_trip_efficiency) / effective_power
        return round(runtime, 2)

    def simulate_trajectory(
        self,
        net_power_deficit_kw: float,
        duration_hours: float,
    ) -> Dict[str, Any]:
        """
        Simulates battery State of Charge trajectory over the scenario duration.
        If net_power_deficit_kw > 0, battery discharges to support microgrid.
        If net_power_deficit_kw < 0, battery absorbs surplus charging power.
        """
        steps = max(2, min(8, int(duration_hours) + 1))
        dt = duration_hours / (steps - 1) if steps > 1 else 1.0

        soc_curve = []
        labels = []
        current_soc = self.current_soc_pct
        depleted = False
        depletion_hour = None

        for step in range(steps):
            t_hour = round(step * dt, 1)
            labels.append(f"T+{int(t_hour)}h" if t_hour > 0 else "T-0")
            soc_curve.append(round(current_soc, 1))

            if net_power_deficit_kw > 0:
                # Discharging to cover deficit
                discharge_draw_kw = min(net_power_deficit_kw, self.max_inverter_power_kw)
                energy_discharged_kwh = discharge_draw_kw * dt / self.round_trip_efficiency
                delta_soc = (energy_discharged_kwh / self.capacity_kwh) * 100.0
                current_soc = max(0.0, current_soc - delta_soc)

                if current_soc <= self.min_reserve_soc_pct and not depleted:
                    depleted = True
                    depletion_hour = t_hour
            else:
                # Trickle charge from surplus
                charge_power_kw = min(abs(net_power_deficit_kw), 15.0)
                energy_charged_kwh = charge_power_kw * dt * self.round_trip_efficiency
                delta_soc = (energy_charged_kwh / self.capacity_kwh) * 100.0
                current_soc = min(100.0, current_soc + delta_soc)

        final_soc = round(current_soc, 1)
        soc_delta = round(final_soc - self.current_soc_pct, 1)

        return {
            "initial_soc_pct": self.current_soc_pct,
            "final_soc_pct": final_soc,
            "soc_delta_pct": soc_delta,
            "capacity_kwh": self.capacity_kwh,
            "depleted": depleted,
            "depletion_hour": depletion_hour,
            "status": "DISCHARGING_BUFFER" if net_power_deficit_kw > 0 else "TRICKLE_CHARGING",
            "time_labels": labels,
            "soc_curve": soc_curve,
        }

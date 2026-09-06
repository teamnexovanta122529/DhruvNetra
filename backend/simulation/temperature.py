"""
DHRUVNETRA - Thermal Envelope & HVAC Heat Loss Simulation Model
Deterministic thermodynamic calculations for polar station building envelope,
katabatic wind convection, and indoor habitability.
"""

from typing import Dict, Any, List


class ThermalSubsystem:
    """
    Thermodynamic model simulating heat loss through station walls,
    HVAC heating duty cycle, and internal temperature response.
    """

    def __init__(
        self,
        station_name: str,
        target_indoor_temp: float = 19.0,
        thermal_loss_coeff: float = 0.55,     # kW per degree C delta
        thermal_capacity_kwh_c: float = 18.0,  # Thermal inertia of habitat mass
        min_safe_temp: float = 12.0,           # Lower crew comfort threshold
        freeze_danger_temp: float = 4.0,       # Water pipe freeze risk threshold
    ):
        self.station_name = station_name.upper()
        self.target_indoor_temp = target_indoor_temp
        self.thermal_loss_coeff = thermal_loss_coeff
        self.thermal_capacity_kwh_c = thermal_capacity_kwh_c
        self.min_safe_temp = min_safe_temp
        self.freeze_danger_temp = freeze_danger_temp

    @classmethod
    def create_for_station(cls, station_name: str) -> "ThermalSubsystem":
        st = station_name.upper()
        if st == "MAITRI":
            # 1989 build, modular insulated panels
            return cls(
                station_name="MAITRI",
                target_indoor_temp=19.0,
                thermal_loss_coeff=0.58,
                thermal_capacity_kwh_c=16.5,
            )
        elif st == "BHARATI":
            # 2012 modern aerodynamic stilt envelope with triple-glazing
            return cls(
                station_name="BHARATI",
                target_indoor_temp=20.0,
                thermal_loss_coeff=0.42,
                thermal_capacity_kwh_c=22.0,
            )
        else:
            return cls(station_name="GENERIC")

    def calculate_hvac_heating_demand_kw(
        self,
        outdoor_temp_celsius: float,
        wind_speed_kmh: float,
        target_indoor: float = None,
    ) -> float:
        """
        Calculates electrical power required by HVAC & glycol loop heaters
        to maintain target indoor temperature under polar weather conditions.
        """
        target = target_indoor if target_indoor is not None else self.target_indoor_temp
        delta_t = max(0.0, target - outdoor_temp_celsius)

        # Katabatic wind forced convection multiplier
        wind_factor = 1.0 + max(0.0, (wind_speed_kmh - 15.0) * 0.0075)

        base_ventilation_kw = 8.0
        thermal_loss_kw = self.thermal_loss_coeff * delta_t * wind_factor
        total_hvac_kw = base_ventilation_kw + thermal_loss_kw

        return round(min(70.0, max(5.0, total_hvac_kw)), 2)

    def simulate_temperature_trajectory(
        self,
        initial_indoor_temp: float,
        outdoor_temp_celsius: float,
        wind_speed_kmh: float,
        delivered_hvac_kw: float,
        duration_hours: float,
    ) -> Dict[str, Any]:
        """
        Simulates indoor temperature progression over time using dynamic
        thermal heat balance:
            dT/dt = (Q_in - Q_out) / ThermalCapacity
        """
        current_indoor = initial_indoor_temp
        time_steps = max(2, int(duration_hours * 2) + 1)
        dt = duration_hours / (time_steps - 1) if time_steps > 1 else 1.0

        wind_factor = 1.0 + max(0.0, (wind_speed_kmh - 15.0) * 0.0075)
        temp_curve = []
        labels = []

        for step in range(time_steps):
            t_hour = round(step * dt, 1)
            labels.append(f"T+{t_hour:.1f}h" if t_hour > 0 else "T-0")
            temp_curve.append(round(current_indoor, 2))

            # Thermal balance
            delta_t = current_indoor - outdoor_temp_celsius
            heat_loss_kw = self.thermal_loss_coeff * delta_t * wind_factor
            net_heat_flow_kw = delivered_hvac_kw - heat_loss_kw

            # Temperature change over dt
            d_temp = (net_heat_flow_kw * dt) / self.thermal_capacity_kwh_c
            current_indoor += d_temp

        final_temp = round(current_indoor, 2)
        temp_delta = round(final_temp - initial_indoor_temp, 2)

        # Risk assessment
        if final_temp < self.freeze_danger_temp:
            freeze_risk = "CRITICAL"
        elif final_temp < self.min_safe_temp:
            freeze_risk = "MODERATE"
        else:
            freeze_risk = "NOMINAL"

        return {
            "initial_indoor_temp": initial_indoor_temp,
            "final_indoor_temp": final_temp,
            "temperature_delta": temp_delta,
            "freeze_risk": freeze_risk,
            "glycol_loop_status": "NORMAL" if final_temp >= self.min_safe_temp else "TRACE_HEATING_ENGAGED",
            "time_labels": labels,
            "indoor_temp_curve": temp_curve,
        }

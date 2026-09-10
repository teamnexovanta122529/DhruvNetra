"""
DHRUVNETRA - Potable Water & Life Support Subsystem Model
Simulates water reserves, snow melter production, lake pipelines,
purification system failure, and crew consumption trajectories for Antarctic stations.
"""

from typing import Dict, Any, List, Optional


class WaterSubsystem:
    """
    Deterministic water inventory and production model for Maitri & Bharati stations.
    """

    def __init__(
        self,
        station_name: str,
        total_capacity_liters: float = 20000.0,
        current_reserve_liters: float = 18200.0,
        daily_consumption_liters: float = 1450.0,
        daily_production_liters: float = 1600.0,
        snow_melter_production_lph: float = 45.0,
        lake_line_production_lph: float = 25.0,
        critical_threshold_liters: float = 3000.0,
        warning_threshold_liters: float = 6000.0,
        purification_online: bool = True,
        trace_heating_active: bool = True,
    ):
        self.station_name = station_name.upper()
        self.total_capacity_liters = total_capacity_liters
        self.current_reserve_liters = min(current_reserve_liters, total_capacity_liters)
        self.daily_consumption_liters = daily_consumption_liters
        self.daily_production_liters = daily_production_liters
        self.hourly_consumption_lph = daily_consumption_liters / 24.0
        self.snow_melter_production_lph = snow_melter_production_lph
        self.lake_line_production_lph = lake_line_production_lph
        self.critical_threshold_liters = critical_threshold_liters
        self.warning_threshold_liters = warning_threshold_liters
        self.purification_online = purification_online
        self.trace_heating_active = trace_heating_active

    @classmethod
    def create_for_station(
        cls,
        station_name: str,
        current_reserve_l: Optional[float] = None,
    ) -> "WaterSubsystem":
        st = station_name.upper()
        if st == "MAITRI":
            return cls(
                station_name="MAITRI",
                total_capacity_liters=20000.0,
                current_reserve_liters=current_reserve_l if current_reserve_l is not None else 18200.0,
                daily_consumption_liters=1450.0,
                daily_production_liters=1600.0,
                snow_melter_production_lph=45.0,
                lake_line_production_lph=25.0,
                critical_threshold_liters=3000.0,
                warning_threshold_liters=6000.0,
            )
        elif st == "BHARATI":
            return cls(
                station_name="BHARATI",
                total_capacity_liters=25000.0,
                current_reserve_liters=current_reserve_l if current_reserve_l is not None else 23500.0,
                daily_consumption_liters=1800.0,
                daily_production_liters=2000.0,
                snow_melter_production_lph=55.0,
                lake_line_production_lph=30.0,
                critical_threshold_liters=4000.0,
                warning_threshold_liters=8000.0,
            )
        else:
            return cls(station_name="GENERIC")

    def simulate_trajectory(
        self,
        duration_hours: float = 24.0,
        power_deficit_kw: float = 0.0,
        purification_failed: bool = False,
        snow_melter_offline: bool = False,
        consumption_multiplier: float = 1.0,
    ) -> Dict[str, Any]:
        """
        Simulates step-by-step water inventory over the scenario duration.
        """
        effective_consumption_lph = self.hourly_consumption_lph * max(0.5, consumption_multiplier)
        
        # Determine effective production
        effective_production_lph = 0.0
        if not purification_failed:
            if not snow_melter_offline and power_deficit_kw < 20.0:
                effective_production_lph += self.snow_melter_production_lph
            if self.trace_heating_active and power_deficit_kw < 40.0:
                effective_production_lph += self.lake_line_production_lph

        net_rate_lph = effective_production_lph - effective_consumption_lph
        
        steps = max(3, min(24, int(duration_hours) + 1))
        time_step = duration_hours / max(1, steps - 1)
        
        timeline_labels = []
        timeline_reserves = []
        
        simulated_reserve = self.current_reserve_liters
        critical_hour = None
        warning_hour = None
        
        for i in range(steps):
            t = i * time_step
            timeline_labels.append(f"T+{t:.1f}h")
            timeline_reserves.append(round(max(0.0, simulated_reserve), 1))
            
            if warning_hour is None and simulated_reserve <= self.warning_threshold_liters:
                warning_hour = round(t, 1)
            if critical_hour is None and simulated_reserve <= self.critical_threshold_liters:
                critical_hour = round(t, 1)
                
            simulated_reserve = max(0.0, min(self.total_capacity_liters, simulated_reserve + net_rate_lph * time_step))
        
        final_reserve = timeline_reserves[-1]
        reserve_pct = (final_reserve / self.total_capacity_liters) * 100.0
        
        # Days of endurance remaining under final production/consumption state
        endurance_days = (final_reserve / (effective_consumption_lph * 24.0)) if effective_consumption_lph > 0 else 999.0
        
        status = "OPTIMAL"
        if final_reserve <= self.critical_threshold_liters or (critical_hour is not None and critical_hour <= duration_hours):
            status = "CRITICAL_SHORTAGE"
        elif final_reserve <= self.warning_threshold_liters or (warning_hour is not None and warning_hour <= duration_hours):
            status = "LOW_RESERVE_WARNING"
        elif net_rate_lph < 0:
            status = "DEPLETING_BUFFER"
            
        return {
            "initial_reserve_liters": self.current_reserve_liters,
            "final_reserve_liters": final_reserve,
            "reserve_percentage": round(reserve_pct, 1),
            "net_flow_rate_lph": round(net_rate_lph, 2),
            "production_rate_lph": round(effective_production_lph, 2),
            "consumption_rate_lph": round(effective_consumption_lph, 2),
            "endurance_days_remaining": round(endurance_days, 1),
            "warning_threshold_hour": warning_hour,
            "critical_threshold_hour": critical_hour,
            "purification_status": "OFFLINE_FAULT" if purification_failed else "OPERATIONAL",
            "melter_status": "OFFLINE" if snow_melter_offline else ("THROTTLED" if power_deficit_kw > 0 else "NOMINAL"),
            "status": status,
            "timeline": {
                "labels": timeline_labels,
                "reserves": timeline_reserves,
            },
        }

"""
DHRUVNETRA - Polar Logistics & Supply Chain Contingency Model
Evaluates fuel delivery delays, spare part shortages, food rations,
and operational endurance margins under Antarctic transport interruptions.
"""

from typing import Dict, Any, List, Optional


class LogisticsSubsystem:
    """
    Simulates supply chain buffers and delivery delay contingencies.
    """

    def __init__(
        self,
        station_name: str,
        current_fuel_liters: float = 81600.0,
        nominal_burn_lph: float = 28.5,
        days_to_scheduled_resupply: float = 14.0,
        food_rations_days: float = 90.0,
        critical_spares_stock_pct: float = 85.0,
    ):
        self.station_name = station_name.upper()
        self.current_fuel_liters = current_fuel_liters
        self.nominal_burn_lph = nominal_burn_lph
        self.days_to_scheduled_resupply = days_to_scheduled_resupply
        self.food_rations_days = food_rations_days
        self.critical_spares_stock_pct = critical_spares_stock_pct

    @classmethod
    def create_for_station(
        cls,
        station_name: str,
        current_fuel_l: Optional[float] = None,
        burn_lph: Optional[float] = None,
    ) -> "LogisticsSubsystem":
        st = station_name.upper()
        if st == "MAITRI":
            return cls(
                station_name="MAITRI",
                current_fuel_liters=current_fuel_l if current_fuel_l is not None else 81600.0,
                nominal_burn_lph=burn_lph if burn_lph is not None else 28.5,
                days_to_scheduled_resupply=18.0,
                food_rations_days=110.0,
                critical_spares_stock_pct=88.0,
            )
        elif st == "BHARATI":
            return cls(
                station_name="BHARATI",
                current_fuel_liters=current_fuel_l if current_fuel_l is not None else 136800.0,
                nominal_burn_lph=burn_lph if burn_lph is not None else 32.0,
                days_to_scheduled_resupply=24.0,
                food_rations_days=140.0,
                critical_spares_stock_pct=92.0,
            )
        else:
            return cls(station_name="GENERIC")

    def simulate_delivery_delay(
        self,
        delay_days: float = 7.0,
        resource_type: str = "fuel",
        burn_rate_lph: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Calculates impact of an operational delay on station survival margins.
        """
        active_burn = burn_rate_lph if burn_rate_lph is not None else self.nominal_burn_lph
        daily_fuel_burn = active_burn * 24.0
        
        current_fuel_endurance_days = (self.current_fuel_liters / daily_fuel_burn) if daily_fuel_burn > 0 else 999.0
        new_resupply_target_days = self.days_to_scheduled_resupply + delay_days
        
        margin_days = current_fuel_endurance_days - new_resupply_target_days
        
        # Determine necessary conservation rationing if margin is dangerously thin or negative
        required_rationing_pct = 0.0
        if margin_days < 5.0:
            target_burn = self.current_fuel_liters / max(1.0, new_resupply_target_days + 5.0)
            target_lph = target_burn / 24.0
            required_rationing_pct = max(0.0, min(50.0, (1.0 - (target_lph / active_burn)) * 100.0))
            
        status = "SECURE"
        if margin_days < 0:
            status = "CRITICAL_DEFICIT_BEFORE_RESUPPLY"
        elif margin_days < 7.0:
            status = "WARNING_MARGIN_THIN"
        elif margin_days < 15.0:
            status = "MODERATE_BUFFER"

        recommendations = []
        if required_rationing_pct > 0:
            recommendations.append(f"Execute {required_rationing_pct:.0f}% station power and thermal rationing.")
            recommendations.append("Reduce non-essential research heating loads to extend fuel runway.")
        else:
            recommendations.append(f"Fuel reserves sufficient for {delay_days:.0f}-day delay ({margin_days:.1f} days margin remains).")
            
        return {
            "resource_type": resource_type,
            "delay_days": delay_days,
            "scheduled_resupply_days": self.days_to_scheduled_resupply,
            "new_resupply_target_days": new_resupply_target_days,
            "current_endurance_days": round(current_fuel_endurance_days, 1),
            "safety_margin_days": round(margin_days, 1),
            "required_rationing_pct": round(required_rationing_pct, 1),
            "status": status,
            "recommendations": recommendations,
        }

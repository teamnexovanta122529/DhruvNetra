"""
DHRUVNETRA - XGBoost What-If ML Predictor
Predicts multi-step fuel consumption and thermal degradation trajectories
under simulated operational scenarios.
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
import xgboost as xgb
from typing import Dict, Any, List, Optional


MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "models"))
FUEL_MODEL_PATH = os.path.join(MODELS_DIR, "xgb_fuel_model.json")
TEMP_MODEL_PATH = os.path.join(MODELS_DIR, "xgb_temp_model.json")
FUEL_FEATS_PATH = os.path.join(MODELS_DIR, "fuel_features.joblib")
TEMP_FEATS_PATH = os.path.join(MODELS_DIR, "temp_features.joblib")


class WhatIfMLPredictor:
    """
    ML Inference Engine using trained XGBoost models to predict
    fuel burn rates and thermal behavior during What-If scenarios.
    """

    def __init__(self):
        self.fuel_model: Optional[xgb.XGBRegressor] = None
        self.temp_model: Optional[xgb.XGBRegressor] = None
        self.fuel_features: List[str] = [
            "station_maitri", "total_power_demand_kw", "active_generators_count",
            "outdoor_temp_celsius", "wind_speed_kmh"
        ]
        self.temp_features: List[str] = [
            "station_maitri", "outdoor_temp_celsius", "wind_speed_kmh",
            "hvac_power_kw", "glycol_pump_load_pct", "total_power_demand_kw"
        ]
        self._load_models()

    def _load_models(self):
        try:
            if os.path.isfile(FUEL_MODEL_PATH):
                self.fuel_model = xgb.XGBRegressor()
                self.fuel_model.load_model(FUEL_MODEL_PATH)
            if os.path.isfile(TEMP_MODEL_PATH):
                self.temp_model = xgb.XGBRegressor()
                self.temp_model.load_model(TEMP_MODEL_PATH)
            if os.path.isfile(FUEL_FEATS_PATH):
                self.fuel_features = joblib.load(FUEL_FEATS_PATH)
            if os.path.isfile(TEMP_FEATS_PATH):
                self.temp_features = joblib.load(TEMP_FEATS_PATH)
        except Exception as e:
            print(f"[!] Warning: Could not load XGBoost models ({e}). Deterministic physics will be used.")

    def predict_fuel_consumption(
        self,
        station: str,
        power_demand_kw: float,
        active_gen_count: int,
        outdoor_temp: float = -15.0,
        wind_speed_kmh: float = 35.0,
    ) -> float:
        """
        Predicts hourly fuel consumption rate (L/h) using XGBoost.
        """
        if self.fuel_model is not None:
            try:
                is_maitri = 1 if station.upper() == "MAITRI" else 0
                data = {
                    "station_maitri": [is_maitri],
                    "total_power_demand_kw": [max(0.0, power_demand_kw)],
                    "active_generators_count": [max(0, active_gen_count)],
                    "outdoor_temp_celsius": [outdoor_temp],
                    "wind_speed_kmh": [wind_speed_kmh],
                }
                X = pd.DataFrame(data)[self.fuel_features]
                pred = float(self.fuel_model.predict(X)[0])
                return max(0.0, round(pred, 2))
            except Exception:
                pass

        # Physics-based backup formula (BSFC approx)
        if active_gen_count == 0:
            return 0.0
        kw_per_gen = power_demand_kw / max(1, active_gen_count)
        return round(active_gen_count * (kw_per_gen * 0.26 + 1.5), 2)

    def predict_indoor_temperature(
        self,
        station: str,
        outdoor_temp: float,
        wind_speed_kmh: float,
        hvac_power_kw: float,
        glycol_pump_load_pct: float,
        power_demand_kw: float,
    ) -> float:
        """
        Predicts indoor habitat temperature (°C) using XGBoost.
        """
        if self.temp_model is not None:
            try:
                is_maitri = 1 if station.upper() == "MAITRI" else 0
                data = {
                    "station_maitri": [is_maitri],
                    "outdoor_temp_celsius": [outdoor_temp],
                    "wind_speed_kmh": [wind_speed_kmh],
                    "hvac_power_kw": [max(0.0, hvac_power_kw)],
                    "glycol_pump_load_pct": [max(0.0, glycol_pump_load_pct)],
                    "total_power_demand_kw": [max(0.0, power_demand_kw)],
                }
                X = pd.DataFrame(data)[self.temp_features]
                pred = float(self.temp_model.predict(X)[0])
                return round(pred, 2)
            except Exception:
                pass

        # Physics-based backup
        if hvac_power_kw <= 0.0:
            return round(max(outdoor_temp, 20.0 - (wind_speed_kmh / 20.0)), 2)
        return 20.0

    def generate_ml_trajectory(
        self,
        station: str,
        duration_hours: float,
        baseline_load_kw: float,
        simulated_load_kw: float,
        baseline_gen_count: int,
        simulated_gen_count: int,
        outdoor_temp: float = -15.0,
        wind_speed_kmh: float = 35.0,
    ) -> List[Dict[str, Any]]:
        """
        Generates step-by-step time series trajectory comparing baseline vs ML predicted values.
        """
        steps = max(2, min(24, int(duration_hours)))
        dt = duration_hours / (steps - 1) if steps > 1 else 1.0
        trajectory = []

        for i in range(steps):
            t_hr = round(i * dt, 1)
            # Baseline prediction
            base_fuel = self.predict_fuel_consumption(
                station=station,
                power_demand_kw=baseline_load_kw,
                active_gen_count=baseline_gen_count,
                outdoor_temp=outdoor_temp,
                wind_speed_kmh=wind_speed_kmh,
            )
            # Simulated scenario prediction
            sim_fuel = self.predict_fuel_consumption(
                station=station,
                power_demand_kw=simulated_load_kw,
                active_gen_count=simulated_gen_count,
                outdoor_temp=outdoor_temp,
                wind_speed_kmh=wind_speed_kmh,
            )

            trajectory.append({
                "time": f"+{t_hr}h",
                "hour": t_hr,
                "currentLoad": round(baseline_load_kw, 1),
                "projectedLoad": round(simulated_load_kw, 1),
                "currentFuelBurn": base_fuel,
                "projectedFuelBurn": sim_fuel,
                "fuelSavedRate": round(base_fuel - sim_fuel, 2),
            })

        return trajectory

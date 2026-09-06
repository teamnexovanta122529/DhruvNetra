"""
DHRUVNETRA - Machine Learning Model Training Pipeline
Trains XGBoost regression models on station telemetry to predict:
1. Fuel consumption rate (L/h)
2. Indoor habitat temperature (°C)
"""

import os
import json
import joblib
import pandas as pd
import numpy as np
import xgboost as xgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_absolute_error, root_mean_squared_error, r2_score


DATA_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "synthetic", "synthetic_telemetry.csv"))
MODELS_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "models"))


def train_models():
    print("=" * 70)
    print(" DHRUVNETRA - TRAINING XGBOOST TELEMETRY PREDICTION MODELS")
    print("=" * 70)

    if not os.path.isfile(DATA_PATH):
        raise FileNotFoundError(f"Synthetic dataset not found at {DATA_PATH}. Run generate_synthetic_data.py first.")

    os.makedirs(MODELS_DIR, exist_ok=True)
    df = pd.read_csv(DATA_PATH)
    print(f"Loaded {len(df):,} telemetry records from: {DATA_PATH}")

    # Feature engineering
    df["station_maitri"] = (df["station"] == "MAITRI").astype(int)
    
    # --------------------------------------------------------------------------
    # MODEL 1: Fuel Consumption Regressor
    # --------------------------------------------------------------------------
    print("\n--- Training Model 1: Fuel Consumption Rate (L/h) ---")
    fuel_features = [
        "station_maitri",
        "total_power_demand_kw",
        "active_generators_count",
        "outdoor_temp_celsius",
        "wind_speed_kmh",
    ]
    X_fuel = df[fuel_features]
    y_fuel = df["fuel_consumption_lph"]

    X_f_train, X_f_test, y_f_train, y_f_test = train_test_split(X_fuel, y_fuel, test_size=0.2, random_state=42)

    fuel_model = xgb.XGBRegressor(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        objective="reg:squarederror",
    )
    fuel_model.fit(X_f_train, y_f_train)

    y_f_pred = fuel_model.predict(X_f_test)
    f_mae = mean_absolute_error(y_f_test, y_f_pred)
    f_rmse = root_mean_squared_error(y_f_test, y_f_pred)
    f_r2 = r2_score(y_f_test, y_f_pred)

    print(f"  [+] Fuel Model Test MAE : {f_mae:.4f} L/h")
    print(f"  [+] Fuel Model Test RMSE: {f_rmse:.4f} L/h")
    print(f"  [+] Fuel Model Test R2  : {f_r2:.4f}")

    fuel_model_path = os.path.join(MODELS_DIR, "xgb_fuel_model.json")
    fuel_model.save_model(fuel_model_path)
    joblib.dump(fuel_features, os.path.join(MODELS_DIR, "fuel_features.joblib"))
    print(f"  [OK] Saved Fuel Model to: {fuel_model_path}")

    # --------------------------------------------------------------------------
    # MODEL 2: Indoor Temperature Regressor
    # --------------------------------------------------------------------------
    print("\n--- Training Model 2: Indoor Temperature (deg C) ---")
    temp_features = [
        "station_maitri",
        "outdoor_temp_celsius",
        "wind_speed_kmh",
        "hvac_power_kw",
        "glycol_pump_load_pct",
        "total_power_demand_kw",
    ]
    X_temp = df[temp_features]
    y_temp = df["indoor_temp_celsius"]

    X_t_train, X_t_test, y_t_train, y_t_test = train_test_split(X_temp, y_temp, test_size=0.2, random_state=42)

    temp_model = xgb.XGBRegressor(
        n_estimators=150,
        max_depth=5,
        learning_rate=0.08,
        subsample=0.85,
        colsample_bytree=0.85,
        random_state=42,
        objective="reg:squarederror",
    )
    temp_model.fit(X_t_train, y_t_train)

    y_t_pred = temp_model.predict(X_t_test)
    t_mae = mean_absolute_error(y_t_test, y_t_pred)
    t_rmse = root_mean_squared_error(y_t_test, y_t_pred)
    t_r2 = r2_score(y_t_test, y_t_pred)

    print(f"  [+] Temp Model Test MAE : {t_mae:.4f} deg C")
    print(f"  [+] Temp Model Test RMSE: {t_rmse:.4f} deg C")
    print(f"  [+] Temp Model Test R2  : {t_r2:.4f}")

    temp_model_path = os.path.join(MODELS_DIR, "xgb_temp_model.json")
    temp_model.save_model(temp_model_path)
    joblib.dump(temp_features, os.path.join(MODELS_DIR, "temp_features.joblib"))
    print(f"  [OK] Saved Temp Model to: {temp_model_path}")

    # Save metadata
    metadata = {
        "dataset_records": len(df),
        "fuel_model": {
            "features": fuel_features,
            "mae": round(float(f_mae), 4),
            "rmse": round(float(f_rmse), 4),
            "r2": round(float(f_r2), 4),
        },
        "temp_model": {
            "features": temp_features,
            "mae": round(float(t_mae), 4),
            "rmse": round(float(t_rmse), 4),
            "r2": round(float(t_r2), 4),
        },
    }
    with open(os.path.join(MODELS_DIR, "model_metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)

    print("\n" + "=" * 70)
    print(" XGBOOST MODELS TRAINING COMPLETED SUCCESSFULLY")
    print("=" * 70)


if __name__ == "__main__":
    train_models()

# DHRUVNETRA Antarctic Station Telemetry Dataset

This directory hosts the telemetry dataset pipeline for the **DHRUVNETRA** AI-powered remote management and Digital Twin platform for Indian Antarctic research stations (**Maitri** and **Bharati**).

---

## ⚠️ Important Synthetic Data Disclaimer

> **PROTOTYPE NOTICE:**  
> The dataset in `synthetic/synthetic_telemetry.csv` contains **simulated / synthetic telemetry** generated strictly for machine learning model training, architecture validation, and prototype demonstration for the **Smart India Hackathon (SIH 2026)**.
> 
> It is **NOT** confidential operational data from the **National Centre for Polar and Ocean Research (NCPOR)** or the **Ministry of Earth Sciences (MoES)**.
> When real station IoT/SCADA sensor telemetry becomes available, this synthetic dataset must be replaced by real station log files as documented below.

---

## 1. Directory Structure

```text
backend/ai/data/
├── generate_synthetic_data.py   # Script generating physical synthetic telemetry
├── README.md                    # Data dictionary, feature mapping & migration guide
├── raw/                         # Target folder for unformatted real NCPOR station telemetry logs
├── processed/                   # Cleaned, standardized, and scaled parquet/csv datasets
└── synthetic/
    └── synthetic_telemetry.csv  # 17,520 hourly simulated records (365 days x 2 stations)
```

---

## 2. Dataset Schema & Column Dictionary

| Column Name | Data Type | Physical Unit | Description |
| :--- | :--- | :--- | :--- |
| `timestamp` | String (`YYYY-MM-DD HH:MM:SS`) | UTC / Local | Date and hour of telemetry capture |
| `station` | String (`MAITRI` \| `BHARATI`) | Nominal | Target Indian Antarctic Research Station |
| `outdoor_temp_celsius` | Float | °C | Ambient sub-zero outdoor air temperature |
| `indoor_temp_celsius` | Float | °C | Habitational habitat interior temperature |
| `wind_speed_kmh` | Float | km/h | Katabatic & polar wind velocity |
| `humidity_pct` | Float | % | Relative humidity |
| `pressure_hpa` | Float | hPa | Atmospheric barometric air pressure |
| `blizzard_risk` | Categorical (`LOW` \| `MEDIUM` \| `HIGH` \| `CRITICAL`) | Risk Level | Storm/blizzard category |
| `total_power_demand_kw` | Float | kW | Station-wide aggregate electrical load |
| `hvac_power_kw` | Float | kW | Heating, Ventilation & Glycol loop load |
| `glycol_pump_load_pct` | Float | % | Primary thermal distribution pump rate |
| `fuel_consumption_lph` | Float | Litres/Hour (L/h) | Real-time aggregate Arctic Diesel (HSD-A) burn rate |
| `fuel_storage_liters` | Float | Litres | Remaining fuel in main bulk storage tanks |
| `fuel_level_pct` | Float | % | Tank capacity percentage |
| `fuel_reserve_days` | Float | Days | Estimated winter stock endurance at current burn rate |
| `water_storage_liters` | Float | Litres | Potable water in insulated reservoir |
| `water_level_pct` | Float | % | Water tank percentage |
| `battery_soc_pct` | Float | % | Microgrid battery bank State of Charge |
| `battery_power_kw` | Float | kW | Battery charge (+) / discharge (-) rate |
| `active_generators_count`| Integer | Count | Number of currently synchronized generators |
| `gen1_status` | Categorical | Status | `ACTIVE`, `WARM_STANDBY`, `OFFLINE_STANDBY` |
| `gen1_load_kw` | Float | kW | Real power delivered by Generator 1 |
| `gen2_status` | Categorical | Status | Generator 2 operational state |
| `gen2_load_kw` | Float | kW | Real power delivered by Generator 2 |
| `gen3_status` | Categorical | Status | Generator 3 operational state |
| `gen3_load_kw` | Float | kW | Real power delivered by Generator 3 |
| `gen4_status` | Categorical | Status | Generator 4 state (`NOT_INSTALLED` for Maitri) |
| `gen4_load_kw` | Float | kW | Real power delivered by Generator 4 |
| `satcom_quality_pct` | Float | % | Satellite uplink SNR quality index |
| `satcom_latency_ms` | Integer | ms | Ground terminal round-trip latency |
| `station_health_score` | Integer (0–100) | Index | Multi-subsystem composite health score |

---

## 3. How the Synthetic Data is Generated

The dataset incorporates real physical equations and thermodynamic principles:

1. **Polar Day / Night Solar Seasons:**
   - Evaluates solar declination across the 365-day year ($\cos\left(\frac{2\pi(d-15)}{365.25}\right)$) to model 24-hour polar daylight in January vs 24-hour polar night in July.
2. **Convective Heat Loss & HVAC:**
   - Thermal loss through station envelope:
     $$\Delta T = T_{\text{target, indoor}} - T_{\text{outdoor}}$$
     $$W_{\text{factor}} = 1.0 + \max(0, (\text{wind\_speed} - 15) \times 0.0075)$$
     $$P_{\text{hvac}} = P_{\text{base}} + k_{\text{loss}} \times \Delta T \times W_{\text{factor}}$$
3. **Generator Brake Specific Fuel Consumption (BSFC):**
   - Non-linear specific fuel consumption curve: optimal at $70\text{--}80\%$ load ($0.245\text{ L/kWh}$), degrading at light load $<40\%$ ($0.33\text{ L/kWh}$) and extreme $>90\%$ load ($0.267\text{ L/kWh}$), with cold-viscosity penalties for polar temperatures below $-15^\circ\text{C}$.
4. **Katabatic Storm Cycles:**
   - Periodic barometric drops simulating Class-3 Antarctic blizzards (winds $90\text{--}135\text{ km/h}$, pressure $<960\text{ hPa}$) triggering dual generator redundancy and radome trace heating.

---

## 4. AI / ML Model Feature & Target Mapping

### Model 1: Fuel Consumption Rate Regressor (`XGBoostFuelModel`)
* **Primary Target ($Y$):** `fuel_consumption_lph`
* **Features ($X$):**
  - `outdoor_temp_celsius`, `wind_speed_kmh`, `pressure_hpa`, `humidity_pct`
  - `total_power_demand_kw`, `hvac_power_kw`
  - `active_generators_count`, `gen1_load_kw`, `gen2_load_kw`, `gen3_load_kw`, `gen4_load_kw`
  - `station` (One-hot encoded `MAITRI` / `BHARATI`)

### Model 2: Thermal & HVAC Power Regressor (`XGBoostThermalModel`)
* **Primary Target ($Y$):** `hvac_power_kw`
* **Secondary Target ($Y_2$):** `indoor_temp_celsius`
* **Features ($X$):**
  - `outdoor_temp_celsius`, `wind_speed_kmh`, `humidity_pct`
  - `indoor_temp_celsius` (lagged)
  - `glycol_pump_load_pct`
  - `blizzard_risk` (Encoded `0..3`)
  - `station` (One-hot encoded)

### Model 3: Operational Risk Evaluator (`RuleEngine` / `XGBoostClassifier`)
* **Target ($Y$):** `blizzard_risk` & `risk_score` (0–100)
* **Features:**
  - Microgrid headroom $(\sum P_{\text{rated}} - P_{\text{demand}})$, single-point failure exposure, and fuel reserve runway.

---

## 5. How to Replace with Real Station Telemetry

To transition from prototype synthetic data to production NCPOR data:

1. **Place Raw CSV/Parquet Exports** from Maitri and Bharati SCADA servers into:
   ```text
   backend/ai/data/raw/maitri_scada_2025_2026.csv
   backend/ai/data/raw/bharati_scada_2025_2026.csv
   ```
2. **Run the Preprocessing Script:**
   ```bash
   python backend/ai/data/preprocess_real_data.py
   ```
   *(Maps SCADA sensor tags `KW_GEN1`, `AMB_T`, `TANK_LITERS` to the standardized schema above and stores output in `backend/ai/data/processed/`)*.
3. **Re-train the XGBoost Models:**
   ```bash
   python backend/ai/ml/train_models.py --source real
   ```
   *(Generates updated model weights in `backend/ai/ml/saved_models/`)*.

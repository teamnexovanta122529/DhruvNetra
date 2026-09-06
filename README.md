# DHRUVNETRA — Antarctic Station Digital Twin & AI What-If Analysis Engine
> **SIH 2026**: Digital Platform for Remote Management of Indian Antarctic Research Stations (**Maitri** & **Bharati**).

---

## 🚀 Quick Start Guide (VS Code / Terminal)

### Prerequisites
* **Node.js**: v18+ (tested on v24)
* **Python**: 3.10+ (tested on 3.14)
* **npm**: 9+

---

### Step 1: Install Dependencies

#### Frontend
```bash
cd frontend
npm install
```

#### Backend
```bash
cd backend
pip install -r requirements.txt
```
*(Or from project root: `pip install -r backend/requirements.txt`)*

---

### Step 2: Configure Environment (Optional)
The project includes safe, offline fallback defaults out of the box in `backend/.env`.

If you have a Google Gemini API key:
1. Open `backend/.env`
2. Set:
   ```env
   LLM_PROVIDER=gemini
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

---

### Step 3: Run the Application

You will need **two terminal windows**:

#### Terminal 1 — Start Backend Server (Port 8000)
```bash
# Option A: From backend folder
cd backend
python run.py

# Option B: From project root
python run_backend.py
```
* Backend will be active on: **`http://localhost:8000`**
* Interactive API Documentation (Swagger): **`http://localhost:8000/docs`**
* System Health Diagnostics: **`http://localhost:8000/api/health`**

#### Terminal 2 — Start Frontend Dashboard (Port 5173)
```bash
cd frontend
npm run dev
```
* Frontend will be active on: **`http://localhost:5173`**

---

### Step 4: Access the Dashboard
1. Open your browser and navigate to **`http://localhost:5173`**
2. Click **"Enter Mission Command"** or **"Sign In"**
3. Default login credentials:
   * **Username**: `admin`
   * **Password**: `admin123`
   *(Or Operator: `operator` / `operator123`)*

---

## 🧪 Running Verification Tests

You can verify all subsystems with the built-in test suites:

```bash
# From backend directory:
cd backend

# 1. Complete System Architecture & Functional Audit (All 10 checks)
python audit_system.py

# 2. FastAPI Endpoints & Validation Test Suite
python app/test_api.py

# 3. Deterministic Physics & Multi-Grid Simulation Tests
python simulation/test_simulation.py

# 4. Polar Meteorology & Weather Service Tests
python services/environment/test_environment.py

# 5. Natural-Language LLM Parser & Scenario Validation Tests
python ai/llm/test_parser.py
```

---

## 📁 Project Architecture

```
DhruvNetra/
├── backend/
│   ├── ai/
│   │   ├── data/            # Synthetic polar telemetry dataset
│   │   ├── llm/             # LLM query parser, schema validation & grounded explainer
│   │   └── ml/              # XGBoost multi-step fuel & thermal regression models
│   ├── app/
│   │   ├── api/routes/      # FastAPI routes (/api/what-if, /api/environment, /api/health)
│   │   ├── schemas/         # Pydantic request/response models
│   │   └── main.py          # FastAPI application factory & CORS setup
│   ├── config/              # Centralized JSON risk thresholds & polar station specs
│   ├── services/
│   │   └── environment/     # Open-Meteo Antarctic weather integration & caching
│   ├── simulation/          # Deterministic multi-physics engine (Power, Fuel, HVAC, BESS)
│   ├── audit_system.py      # Automated 10-point system audit
│   ├── requirements.txt     # Backend Python dependencies
│   ├── run.py               # Self-contained backend launcher
│   └── .env.example         # Environment template
│
├── frontend/
│   ├── src/
│   │   ├── components/      # React UI components (Digital Twin, 3D Station, What-If)
│   │   ├── context/         # Auth, Station, and Real-time Environment contexts
│   │   ├── data/            # Station telemetry models & auth definitions
│   │   └── services/        # API clients (whatIfApi.js, environmentApi.js)
│   ├── package.json         # React + Vite dependencies & scripts
│   └── vite.config.js       # Vite build config with /api proxy
│
├── .vscode/                 # VS Code Run & Debug configurations (launch.json, tasks.json)
├── run_backend.py           # Root backend launcher helper
└── README.md                # Project documentation
```

---

## 🛠️ Common Troubleshooting

| Issue | Cause | Fix |
|---|---|---|
| `ModuleNotFoundError: No module named 'backend'` | Python path missing project root | Run using `python backend/run.py` or `python run_backend.py`. The updated code auto-injects `sys.path`. |
| `Port 8000 already in use` | Another process is holding port 8000 | Windows: `netstat -ano \| findstr :8000` then `taskkill /PID <PID> /F` |
| `Port 5173 already in use` | Vite starts on 5174 | Close old Vite process or let Vite select next port (proxy still points to 8000). |
| `Unable to connect to DHRUVNETRA AI Backend` | Backend server not running | Ensure Terminal 1 with `python backend/run.py` is running on port 8000. |
| `Missing Python packages` | Virtual environment missing dependencies | Run `pip install -r backend/requirements.txt` |

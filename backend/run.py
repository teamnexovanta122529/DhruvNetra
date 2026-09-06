"""
DHRUVNETRA - Backend Server Launcher
Starts the FastAPI Digital Twin & What-If Simulation API server.
Can be executed from ANY working directory.
"""

import sys
import os
from pathlib import Path

# Ensure project root and backend dir are in sys.path
BACKEND_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BACKEND_DIR.parent

for p in [str(PROJECT_ROOT), str(BACKEND_DIR)]:
    if p not in sys.path:
        sys.path.insert(0, p)

if __name__ == "__main__":
    import uvicorn

    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", "8000"))

    print("=" * 70)
    print(" DHRUVNETRA - Polar Digital Twin & What-If Simulation Engine")
    print(" Indian Antarctic Stations: Maitri & Bharati")
    print(f" Server URL:      http://localhost:{port}")
    print(f" API Docs:        http://localhost:{port}/docs")
    print(f" Health Check:    http://localhost:{port}/api/health")
    print(f" Environment API: http://localhost:{port}/api/environment")
    print("=" * 70)

    # Use backend.app.main:app when DhruvNetra root is in sys.path, else app.main:app
    app_module = "backend.app.main:app" if str(PROJECT_ROOT) in sys.path else "app.main:app"
    uvicorn.run(app_module, host=host, port=port, reload=True)

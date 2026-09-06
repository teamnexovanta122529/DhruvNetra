"""
DHRUVNETRA - Root Backend Launcher
Run directly with: python run_backend.py
"""

import sys
import os
from pathlib import Path

# Add project root and backend directory to sys.path
ROOT_DIR = Path(__file__).resolve().parent
BACKEND_DIR = ROOT_DIR / "backend"

for p in [str(ROOT_DIR), str(BACKEND_DIR)]:
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

    uvicorn.run("backend.app.main:app", host=host, port=port, reload=True)

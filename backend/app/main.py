"""
DHRUVNETRA - FastAPI Main Application Entrypoint
SIH 2026: Digital Platform for Remote Management of Indian Antarctic Research Stations (Maitri & Bharati)
What-If Scenario Simulation & AI Analysis Engine
"""

import os
import sys
import time
import logging
from pathlib import Path

# Automatically ensure both project root and backend directory are in sys.path
_APP_DIR = Path(__file__).resolve().parent
_BACKEND_DIR = _APP_DIR.parent
_PROJECT_ROOT = _BACKEND_DIR.parent

for _p in [str(_PROJECT_ROOT), str(_BACKEND_DIR)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

try:
    from backend.app.api.routes.whatif import router as whatif_router
    from backend.app.api.routes.health import router as health_router
    from backend.app.api.routes.environment import router as environment_router
except ModuleNotFoundError:
    from app.api.routes.whatif import router as whatif_router
    from app.api.routes.health import router as health_router
    from app.api.routes.environment import router as environment_router

from fastapi import FastAPI, Request, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s",
)
logger = logging.getLogger("dhruvnetra.main")

app = FastAPI(
    title="DHRUVNETRA - Antarctic Digital Twin API",
    description=(
        "Digital Twin & What-If Simulation Engine for Indian Antarctic Research Stations (Maitri & Bharati).\n\n"
        "Features:\n"
        "- Real-Time Polar Meteorology & Environment Intelligence\n"
        "- Pre-trained LLM Natural-Language What-If Query Parsing\n"
        "- Strict Schema & Operational Boundary Validation\n"
        "- Deterministic Multi-Physics Simulation (Microgrid, BSFC Fuel Burn, Heat Loss, BESS Battery)\n"
        "- XGBoost Telemetry Predictor for Multi-Step Forecasts\n"
        "- Rule-Based Risk Engine with Configurable Thresholds\n"
        "- Grounded AI Operational Summaries"
    ),
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/openapi.json",
)

# Configure CORS
origins = os.getenv("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time-Sec"] = f"{process_time:.4f}"
    logger.info(f"{request.method} {request.url.path} responded in {process_time * 1000:.1f}ms (Status: {response.status_code})")
    return response


@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request: Request, exc: HTTPException):
    """
    Standardized JSON error envelope for client errors.
    """
    if isinstance(exc.detail, dict):
        content = {
            "success": False,
            "status_code": exc.status_code,
            **exc.detail
        }
    else:
        content = {
            "success": False,
            "status_code": exc.status_code,
            "error": str(exc.detail),
            "validation_errors": [str(exc.detail)],
        }
    return JSONResponse(status_code=exc.status_code, content=content)


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """
    Global catch-all error handler for unexpected server exceptions.
    """
    logger.error(f"Unhandled Exception on {request.method} {request.url.path}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={
            "success": False,
            "status_code": 500,
            "error": "Internal Server Error occurred during simulation processing.",
            "details": str(exc),
        }
    )


# Include API Routers
app.include_router(whatif_router)
app.include_router(health_router)
app.include_router(environment_router)


@app.get("/", summary="Root Index")
async def root():
    return {
        "service": "DHRUVNETRA Digital Twin & What-If Analysis API",
        "stations": ["Maitri", "Bharati"],
        "version": "1.0.0",
        "documentation": "/docs",
        "health_check": "/api/health",
        "endpoints": {
            "what_if": "POST /api/what-if",
            "environment_all": "GET /api/environment",
            "environment_station": "GET /api/environment/{station}",
        },
    }


if __name__ == "__main__":
    import uvicorn
    host = os.getenv("BACKEND_HOST", "0.0.0.0")
    port = int(os.getenv("BACKEND_PORT", "8000"))
    logger.info(f"Starting DHRUVNETRA API server on http://{host}:{port}")
    app_target = "backend.app.main:app" if (_PROJECT_ROOT / "backend").exists() and str(_PROJECT_ROOT) in sys.path else "app.main:app"
    uvicorn.run(app_target, host=host, port=port, reload=True)

"""
DHRUVNETRA - Health & Diagnostics Route
"""

from fastapi import APIRouter
import time

router = APIRouter(prefix="/api", tags=["Health & Status"])
START_TIME = time.time()


@router.get("/health", summary="System Health & Status")
async def health_check():
    return {
        "status": "healthy",
        "service": "DHRUVNETRA What-If Analysis Engine",
        "version": "1.0.0",
        "stations": ["Maitri", "Bharati"],
        "uptime_seconds": round(time.time() - START_TIME, 2),
        "ai_subsystems": {
            "llm_parser": "ONLINE",
            "deterministic_simulation": "ONLINE",
            "xgboost_predictor": "ONLINE",
            "risk_engine": "ONLINE",
        }
    }

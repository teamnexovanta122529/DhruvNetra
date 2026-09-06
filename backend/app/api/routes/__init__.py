"""
DHRUVNETRA - API Routes Package
"""

from .whatif import router as whatif_router
from .health import router as health_router
from .environment import router as environment_router

__all__ = ["whatif_router", "health_router", "environment_router"]

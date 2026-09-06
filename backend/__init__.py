"""
DHRUVNETRA - Antarctic Digital Twin & What-If Simulation Engine
SIH 2026: Remote Management of Indian Antarctic Research Stations (Maitri & Bharati)
"""

import sys
from pathlib import Path

# Automatically ensure that the project root is in sys.path when backend is imported
_PACKAGE_DIR = Path(__file__).resolve().parent
_PROJECT_ROOT = _PACKAGE_DIR.parent

for _p in [str(_PROJECT_ROOT), str(_PACKAGE_DIR)]:
    if _p not in sys.path:
        sys.path.insert(0, _p)

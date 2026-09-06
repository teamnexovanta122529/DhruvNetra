"""
DHRUVNETRA - LLM Scenario Schemas & Validation Models
Strict schema validation for natural-language What-If scenarios.
"""

from enum import Enum
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field, asdict


class StationName(str, Enum):
    MAITRI = "Maitri"
    BHARATI = "Bharati"


class ComponentType(str, Enum):
    GENERATOR = "generator"
    HVAC = "hvac"
    BATTERY = "battery"
    FUEL = "fuel"
    WATER = "water"
    WEATHER = "weather"


class ScenarioAction(str, Enum):
    SHUTDOWN = "shutdown"
    START = "start"
    FAIL = "fail"
    SETBACK = "setback"
    THROTTLE = "throttle"
    BOOST = "boost"
    COLD_DROP = "cold_drop"
    BLIZZARD_PREP = "blizzard_prep"
    OPTIMIZE = "optimize"


ALLOWED_STATIONS = {"MAITRI", "BHARATI"}
ALLOWED_COMPONENTS = {"GENERATOR", "HVAC", "BATTERY", "FUEL", "WATER", "WEATHER"}
ALLOWED_ACTIONS = {
    "SHUTDOWN", "STOP", "MAINTENANCE",
    "START", "ENGAGE",
    "FAIL", "TRIP", "BLACKOUT",
    "SETBACK", "REDUCE",
    "THROTTLE", "ECO",
    "BOOST", "COLD_DROP", "EXTREME_COLD",
    "BLIZZARD_PREP", "STORM_MODE",
    "OPTIMIZE",
}
ALLOWED_GENERATOR_IDS = {"G1", "G2", "G3", "G4", "GEN1", "GEN2", "GEN3", "GEN4", "ALL"}


@dataclass
class ParsedScenario:
    """
    Validated structured What-If scenario extracted by the LLM.
    """
    station: str
    component: str
    action: str
    duration_hours: float
    component_id: Optional[str] = None
    parameters: Dict[str, Any] = field(default_factory=dict)
    confidence: float = 1.0
    raw_query: str = ""

    def validate_and_sanitize(self) -> List[str]:
        """
        Applies strict validation constraints. Returns list of validation error strings.
        If errors is empty, the scenario is valid and safe to execute.
        """
        errors = []

        # 1. Validate Station
        clean_station = self.station.strip().upper() if self.station else ""
        if clean_station not in ALLOWED_STATIONS:
            errors.append(f"Invalid station '{self.station}'. Allowed stations: MAITRI, BHARATI.")
        else:
            self.station = "Maitri" if clean_station == "MAITRI" else "Bharati"

        # 2. Validate Component
        clean_comp = self.component.strip().upper() if self.component else ""
        if clean_comp not in ALLOWED_COMPONENTS:
            errors.append(f"Invalid component '{self.component}'. Allowed components: {', '.join(sorted(ALLOWED_COMPONENTS))}.")
        else:
            self.component = clean_comp.lower()

        # 3. Validate Action
        clean_action = self.action.strip().upper() if self.action else ""
        if clean_action not in ALLOWED_ACTIONS:
            errors.append(f"Invalid action '{self.action}'. Allowed actions: {', '.join(sorted(ALLOWED_ACTIONS))}.")
        else:
            # Map synonyms to standard canonical actions
            if clean_action in ["STOP", "MAINTENANCE"]:
                self.action = "shutdown"
            elif clean_action in ["TRIP", "BLACKOUT"]:
                self.action = "fail"
            elif clean_action in ["REDUCE", "ECO"]:
                self.action = "setback"
            elif clean_action in ["EXTREME_COLD"]:
                self.action = "cold_drop"
            elif clean_action in ["STORM_MODE"]:
                self.action = "blizzard_prep"
            else:
                self.action = clean_action.lower()

        # 4. Validate Duration
        try:
            dur = float(self.duration_hours)
            if dur <= 0.0:
                errors.append(f"Duration must be greater than 0 hours (got {dur}).")
            elif dur > 168.0:  # Max 7 days
                errors.append(f"Duration exceeds maximum safety limit of 168 hours / 7 days (got {dur}).")
            else:
                self.duration_hours = round(dur, 2)
        except (ValueError, TypeError):
            errors.append(f"Invalid duration value '{self.duration_hours}'. Must be a positive number.")

        # 5. Validate Component ID if generator
        if self.component == "generator":
            if not self.component_id:
                self.component_id = "G1"
            else:
                clean_id = (
                    self.component_id.strip()
                    .upper()
                    .replace("GEN", "G")
                    .replace("_", "")
                    .replace(" ", "")
                    .replace("-", "")
                )
                if clean_id.isdigit():
                    clean_id = f"G{clean_id}"

                if clean_id not in {"G1", "G2", "G3", "G4", "ALL"}:
                    errors.append(f"Invalid generator ID '{self.component_id}'. Allowed IDs: G1, G2, G3, G4.")
                else:
                    # Station specific check (Maitri only has 3 gens)
                    if self.station == "Maitri" and clean_id == "G4":
                        errors.append("Maitri Station has only 3 generators (G1, G2, G3). G4 does not exist at Maitri.")
                    self.component_id = clean_id

        return errors

    def to_dict(self) -> Dict[str, Any]:
        return {
            "station": self.station,
            "component": self.component,
            "component_id": self.component_id,
            "action": self.action,
            "duration_hours": self.duration_hours,
            "parameters": self.parameters,
            "confidence": self.confidence,
            "raw_query": self.raw_query,
        }


@dataclass
class ParseResult:
    """
    Standard envelope returned by WhatIfQueryParser.
    """
    success: bool
    scenario: Optional[ParsedScenario] = None
    error: Optional[str] = None
    validation_errors: List[str] = field(default_factory=list)
    raw_response: Optional[str] = None
    provider_used: str = "unknown"

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "scenario": self.scenario.to_dict() if self.scenario else None,
            "error": self.error,
            "validation_errors": self.validation_errors,
            "provider_used": self.provider_used,
        }

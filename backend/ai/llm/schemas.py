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
ALLOWED_COMPONENTS = {"GENERATOR", "HVAC", "BATTERY", "FUEL", "WATER", "WEATHER", "ENVIRONMENT", "LOGISTICS", "SUPPLY", "POWER"}
ALLOWED_ACTIONS = {
    "SHUTDOWN", "STOP", "MAINTENANCE", "UNAVAILABLE",
    "START", "ENGAGE", "RESTART",
    "FAIL", "TRIP", "BLACKOUT",
    "SETBACK", "REDUCE", "INCREASE",
    "THROTTLE", "ECO",
    "BOOST", "COLD_DROP", "EXTREME_COLD",
    "BLIZZARD_PREP", "STORM_MODE",
    "DELAY", "SHORTAGE",
    "OPTIMIZE",
}
ALLOWED_GENERATOR_IDS = {"G1", "G2", "G3", "G4", "GEN1", "GEN2", "GEN3", "GEN4", "ALL"}


@dataclass
class ParsedScenario:
    """
    Validated structured What-If scenario extracted by the LLM or semantic parser.
    Supports single or multiple affected generators (e.g. G1 + G2).
    """
    station: str
    component: str
    action: str
    duration_hours: float
    component_id: Optional[str] = None
    affected_generators: List[str] = field(default_factory=list)
    duration_is_default: bool = False
    modifications: Dict[str, Any] = field(default_factory=dict)
    assumptions: List[str] = field(default_factory=list)
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
            dur = float(self.duration_hours) if self.duration_hours is not None else 0.0
            if dur <= 0.0:
                self.duration_hours = 1.0
                self.duration_is_default = True
            elif dur > 168.0:  # Max 7 days
                errors.append(f"Duration exceeds maximum safety limit of 168 hours / 7 days (got {dur}).")
            else:
                self.duration_hours = round(dur, 2)
        except (ValueError, TypeError):
            self.duration_hours = 1.0
            self.duration_is_default = True

        # 5. Validate Generators & Multi-Generator Scenarios
        if self.component == "generator":
            station_max_gens = {"Maitri": ["G1", "G2", "G3"], "Bharati": ["G1", "G2", "G3", "G4"]}
            allowed_for_station = station_max_gens.get(self.station, ["G1", "G2", "G3"])

            # If affected_generators is empty, parse from component_id
            if not self.affected_generators and self.component_id:
                raw_id = self.component_id.upper()
                if "ALL" in raw_id:
                    self.affected_generators = list(allowed_for_station)
                else:
                    # Find all generator IDs like G1, G2, GEN1, 1, 2
                    import re
                    found = re.findall(r"\b(?:G(?:EN)?\s*([1-6])|([1-6]))\b", raw_id)
                    gen_ids = []
                    for m1, m2 in found:
                        num = m1 or m2
                        gid = f"G{num}"
                        if gid not in gen_ids:
                            gen_ids.append(gid)
                    if gen_ids:
                        self.affected_generators = gen_ids
                    else:
                        clean_single = raw_id.replace("GEN", "G").replace("_", "").replace(" ", "").replace("-", "")
                        if clean_single.isdigit():
                            clean_single = f"G{clean_single}"
                        self.affected_generators = [clean_single] if clean_single else ["G1"]

            if not self.affected_generators:
                self.affected_generators = ["G1"]

            # Sanitize and validate each generator in affected_generators
            cleaned_gens = []
            for gid in self.affected_generators:
                clean = gid.strip().upper().replace("GEN", "G").replace("_", "").replace(" ", "").replace("-", "")
                if clean.isdigit():
                    clean = f"G{clean}"
                if clean == "ALL":
                    for ag in allowed_for_station:
                        if ag not in cleaned_gens:
                            cleaned_gens.append(ag)
                    continue

                if clean not in allowed_for_station:
                    if clean in ["G4", "G5", "G6"] and self.station == "Maitri":
                        errors.append(f"Maitri Station has only 3 generators (G1, G2, G3). {clean} does not exist at Maitri.")
                    elif clean not in {"G1", "G2", "G3", "G4"}:
                        errors.append(f"Invalid generator ID '{gid}'. Allowed IDs for {self.station}: {', '.join(allowed_for_station)}.")
                    else:
                        errors.append(f"Generator {clean} does not exist at {self.station}.")
                elif clean not in cleaned_gens:
                    cleaned_gens.append(clean)

            if cleaned_gens:
                self.affected_generators = cleaned_gens
                self.component_id = " + ".join(cleaned_gens)
            else:
                self.affected_generators = ["G1"]
                self.component_id = "G1"

        return errors

    def to_dict(self) -> Dict[str, Any]:
        return {
            "station": self.station,
            "component": self.component,
            "component_id": self.component_id,
            "affected_generators": self.affected_generators,
            "duration_is_default": self.duration_is_default,
            "action": self.action,
            "duration_hours": self.duration_hours,
            "modifications": self.modifications,
            "assumptions": self.assumptions,
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

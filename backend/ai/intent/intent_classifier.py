"""
DHRUVNETRA AI - Multi-Intent Classification & Entity Extraction Engine
SIH 2026: Antarctic Digital Twin Platform (Maitri & Bharati)

Provides high-precision intent classification across 18 distinct operational intents,
granular entity extraction (stations, subsystems, generators, tanks, zones, metrics),
scenario context boundary tracking, and follow-up detection.
"""

import re
from enum import Enum
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class IntentType(str, Enum):
    SIMPLE_TELEMETRY_QUERY = "SIMPLE_TELEMETRY_QUERY"
    STATION_STATUS_QUERY = "STATION_STATUS_QUERY"
    SYSTEM_STATUS_QUERY = "SYSTEM_STATUS_QUERY"
    ENVIRONMENT_QUERY = "ENVIRONMENT_QUERY"
    POWER_QUERY = "POWER_QUERY"
    FUEL_QUERY = "FUEL_QUERY"
    HVAC_QUERY = "HVAC_QUERY"
    WATER_QUERY = "WATER_QUERY"
    LOGISTICS_QUERY = "LOGISTICS_QUERY"
    ALERT_QUERY = "ALERT_QUERY"
    HISTORICAL_TREND_QUERY = "HISTORICAL_TREND_QUERY"
    COMPARISON_QUERY = "COMPARISON_QUERY"
    WHAT_IF_SCENARIO = "WHAT_IF_SCENARIO"
    PREDICTION_QUERY = "PREDICTION_QUERY"
    RECOMMENDATION_QUERY = "RECOMMENDATION_QUERY"
    GENERAL_PROJECT_QUERY = "GENERAL_PROJECT_QUERY"
    GREETING_CASUAL_QUERY = "GREETING_CASUAL_QUERY"
    UNKNOWN = "UNKNOWN"


class ExtractedEntities(BaseModel):
    station: Optional[str] = None          # "Maitri" | "Bharati"
    subsystem: Optional[str] = None        # "power" | "fuel" | "hvac" | "water" | "environment" | "logistics" | "alerts"
    component_type: Optional[str] = None   # "generator" | "tank" | "zone" | "battery" | "solar" | "vehicle" | "melter" | "ro"
    component_id: Optional[str] = None     # "G1", "G2", "G3", "G4", "G1 + G2", "TANK-01", etc.
    affected_generators: List[str] = Field(default_factory=list) # ["G1", "G2"]
    metric: Optional[str] = None           # "fuel_level", "fuel_pct", "power_output", "status", "temperature", etc.
    action: Optional[str] = None           # "shutdown", "fail", "start", "setback", "throttle", "blizzard_prep", etc.
    duration_hours: Optional[float] = None
    duration_is_default: bool = False
    is_scenario_follow_up: bool = False
    is_telemetry_follow_up: bool = False
    comparison_targets: List[str] = Field(default_factory=list)
    raw_query: str = ""


class IntentClassificationResult(BaseModel):
    intent: IntentType
    confidence: float
    entities: ExtractedEntities
    is_hypothetical: bool
    requires_simulation: bool
    requires_clarification: bool = False
    clarification_prompt: Optional[str] = None
    reasoning: str = ""


class QueryIntentClassifier:
    """
    Rule-based & semantic query classifier for DHRUVNETRA Polar Mission Assistant.
    Guarantees strict isolation between factual telemetry requests and What-If simulations.
    """

    def __init__(self):
        # Explicit What-If & hypothetical regex markers
        self.what_if_patterns = [
            r"\bwhat\s+if\b",
            r"\bwhat\s+happens\s+if\b",
            r"\bwhat\s+would\s+happen\b",
            r"\bwhat\s+will\s+happen\b",
            r"\bsimulat(e|es|ing|ion)\b",
            r"\bhow\s+will\s+the\s+station\s+be\s+affected\s+if\b",
            r"\bhow\s+(is|would|will)\s+.+\s+affected\s+if\b",
            r"\bsuppose\b",
            r"\bcontingency\s+analysis\b",
            r"\bin\s+case\s+of\s+(shutdown|failure|blackout|trip|delay)\b",
            r"\bassume\s+(that\s+)?(g\d|generator|power|fuel|temp|hvac|water)\b",
            r"\bcan\s+(maitri|bharati|the\s+station|we)\s+survive\b",
            r"\bcan\s+(we|i)\s+(shut\s*down|turn\s*off|stop|isolate|conserve)\b",
            r"\bshould\s+(i|we)\s+(shut\s*down|turn\s*off|stop|isolate|do\s+it)\b",
            r"\bis\s+it\s+safe\s+to\s+(shut\s*down|turn\s*off|stop|isolate)\b",
            r"\bwould\s+(that|it)\s+be\s+safe\b",
            r"\bis\s+that\s+safe\b",
            r"\bwhat\s+should\s+(i|we)\s+do\s+(instead|if\s+g\d\s+fails)\b",
            r"\bwill\s+(shutting|turning\s*off|stopping|taking\s*offline).+\s+save\s+fuel\b",
            r"\bhow\s+much\s+fuel\s+would\s+we\s+save\s+if\b",
            r"\bhow\s+long\s+can\s+(we|the\s+station)\s+(keep|operate|survive|run)\b",
            r"\bwhat\s+is\s+the\s+safest\s+(way|alternative|option)\b",
            r"\bwhich\s+generator\s+is\s+safer\s+to\s+shut\s*down\b",
            r"\bwhich\s+generator\s+should\s+i\s+shut\s*down\b",
            r"\bwhat\s+is\s+the\s+worst-?case\s+scenario\b",
            r"\bwould\s+(shutting|turning\s*off|stopping).+\s+affect\s+(hvac|water|power|fuel)\b",
            r"\bif\s+(g\d|generator\s*\d|generator|hvac|water|fuel|temperature|we\s+turn|we\s+shut|i\s+turn|i\s+shut)\b",
        ]

        # Scenario follow-up markers (references to an ongoing hypothetical scenario)
        self.scenario_followup_patterns = [
            r"\bafter\s+(\d+(\.\d+)?)\s*(hours?|hrs?|mins?|days?)\b",
            r"\bafter\s+(the\s+)?(shutdown|trip|failure|maintenance|simulation|event)\b",
            r"\bduring\s+the\s+(shutdown|outage|failure|scenario)\b",
            r"\bwhat\s+about\s+(after|during)\b",
            r"\bwhat\s+about\s+(generator\s*2|g2|generator\s*3|g3|generator\s*1|g1)\b",
            r"\bwhat\s+if\s+(generator\s*2|g2|generator\s*3|g3|generator\s*1|g1)\s+also\b",
            r"\bwhat\s+about\s+the\s+(battery|fuel|temperature|load|water)\b",
            r"\bwould\s+that\s+save\s+fuel\b",
            r"\bwould\s+that\s+be\s+safe\b",
            r"\bis\s+that\s+safe\b",
            r"\bwhat\s+should\s+i\s+do\s+instead\b",
            r"\bhow\s+much\s+fuel\s+is\s+saved\b",
            r"\bwhat\s+is\s+the\s+risk\s+score\b",
        ]

        # Unit conversion / telemetry follow-up markers
        self.telemetry_followup_patterns = [
            r"\bhow\s+much\s+is\s+that\s+in\s+(litres?|liters?|kw|kwh|percent|%|celsius|fahrenheit)\b",
            r"\band\s+(in\s+)?(litres?|liters?|kw|kwh|percent|%)\b",
            r"\band\s+(g\d|generator\s*\d)\b",
            r"\bis\s+it\s+running\b",
            r"\bwhat\s+is\s+its\s+status\b",
        ]

    def classify(
        self,
        query: str,
        default_station: str = "Maitri",
        active_scenario: Optional[Dict[str, Any]] = None,
        previous_query: Optional[str] = None,
        previous_intent: Optional[str] = None,
    ) -> IntentClassificationResult:
        """
        Classifies user query into one of 18 intents and extracts all operational entities.
        """
        clean_q = (query or "").strip()
        text = clean_q.lower()

        if not clean_q:
            return IntentClassificationResult(
                intent=IntentType.UNKNOWN,
                confidence=1.0,
                entities=ExtractedEntities(raw_query=clean_q),
                is_hypothetical=False,
                requires_simulation=False,
                requires_clarification=True,
                clarification_prompt="Please ask a question about station telemetry or operational status.",
                reasoning="Empty query provided.",
            )

        # 1. Extract Core Entities
        entities = self._extract_entities(clean_q, default_station)

        # 2. Check for Greetings / Casual queries
        if self._is_greeting(text):
            return IntentClassificationResult(
                intent=IntentType.GREETING_CASUAL_QUERY,
                confidence=0.98,
                entities=entities,
                is_hypothetical=False,
                requires_simulation=False,
                reasoning="Query is a greeting or introductory message.",
            )

        # 3. Check for General Project queries
        if self._is_general_project(text):
            return IntentClassificationResult(
                intent=IntentType.GENERAL_PROJECT_QUERY,
                confidence=0.95,
                entities=entities,
                is_hypothetical=False,
                requires_simulation=False,
                reasoning="Query asks about project architecture, station background, or capabilities.",
            )

        # 4. Check for Comparison queries
        if self._is_comparison(text):
            return IntentClassificationResult(
                intent=IntentType.COMPARISON_QUERY,
                confidence=0.92,
                entities=entities,
                is_hypothetical=False,
                requires_simulation=False,
                reasoning="Query asks to compare parameters between stations or components.",
            )

        # 5. Check for Historical / Trend queries
        if self._is_historical_trend(text):
            return IntentClassificationResult(
                intent=IntentType.HISTORICAL_TREND_QUERY,
                confidence=0.92,
                entities=entities,
                is_hypothetical=False,
                requires_simulation=False,
                reasoning="Query asks for historical trajectory, past 24h trends, or curves.",
            )

        # 6. Check for Prediction / Forecast queries (non-hypothetical future projection)
        if self._is_prediction(text) and not self._is_explicit_what_if(text):
            return IntentClassificationResult(
                intent=IntentType.PREDICTION_QUERY,
                confidence=0.90,
                entities=entities,
                is_hypothetical=False,
                requires_simulation=False,
                reasoning="Query asks for linear/XGBoost depletion or weather forecast.",
            )

        # 7. Check for Recommendation queries
        if self._is_recommendation(text) and not self._is_explicit_what_if(text):
            return IntentClassificationResult(
                intent=IntentType.RECOMMENDATION_QUERY,
                confidence=0.90,
                entities=entities,
                is_hypothetical=False,
                requires_simulation=False,
                reasoning="Query requests operational advice or optimization guidance.",
            )

        # 8. Check for Explicit What-If Scenario
        is_what_if = self._is_explicit_what_if(text)
        if is_what_if:
            self._enrich_scenario_entities(clean_q, entities, active_scenario=active_scenario, previous_query=previous_query)
            return IntentClassificationResult(
                intent=IntentType.WHAT_IF_SCENARIO,
                confidence=0.96,
                entities=entities,
                is_hypothetical=True,
                requires_simulation=True,
                reasoning="Query explicitly specifies a hypothetical operational contingency or shutdown simulation.",
            )

        # 9. Check for Scenario Follow-up (ONLY if an active scenario exists AND query explicitly refers to scenario)
        # Note: If query asks for "current", "live", "right now", or asks a direct factual telemetry question, it is NOT a scenario follow-up.
        is_direct_live_query = bool(re.search(r"\b(current|right\s*now|live|latest|present)\b", text))
        if active_scenario and not is_direct_live_query and self._is_scenario_follow_up(text):
            entities.is_scenario_follow_up = True
            self._enrich_scenario_entities(clean_q, entities, active_scenario=active_scenario, previous_query=previous_query)
            return IntentClassificationResult(
                intent=IntentType.WHAT_IF_SCENARIO,
                confidence=0.94,
                entities=entities,
                is_hypothetical=True,
                requires_simulation=True,
                reasoning="Follow-up query specifically referencing the active hypothetical scenario.",
            )

        # 10. Check for Telemetry Follow-up (e.g. "How much is that in litres?", "Is it running?", "And G2?")
        if self._is_telemetry_follow_up(text, previous_intent, previous_query):
            entities.is_telemetry_follow_up = True
            self._enrich_telemetry_follow_up_entities(clean_q, entities, previous_query)
            return IntentClassificationResult(
                intent=IntentType.SIMPLE_TELEMETRY_QUERY,
                confidence=0.92,
                entities=entities,
                is_hypothetical=False,
                requires_simulation=False,
                reasoning="Conversational follow-up extending the previous factual telemetry metric.",
            )

        # 11. System / Subsystem Overall Status Queries (e.g. "How is the power system?", "Status of power system", "Status of HVAC")
        if self._is_system_status(text):
            return IntentClassificationResult(
                intent=IntentType.SYSTEM_STATUS_QUERY,
                confidence=0.94,
                entities=entities,
                is_hypothetical=False,
                requires_simulation=False,
                reasoning=f"Query asking for operational status of {entities.subsystem or 'subsystem'}.",
            )

        # 12. Station Overall Status Queries
        if self._is_station_status(text):
            return IntentClassificationResult(
                intent=IntentType.STATION_STATUS_QUERY,
                confidence=0.94,
                entities=entities,
                is_hypothetical=False,
                requires_simulation=False,
                reasoning="Query asking for overall station operational health or status.",
            )

        # 13. Check Ambiguity: Bare metric queries without component or system context
        if self._is_ambiguous_metric_query(text, entities):
            clarification = self._generate_clarification_prompt(text, entities, default_station)
            return IntentClassificationResult(
                intent=IntentType.SIMPLE_TELEMETRY_QUERY,
                confidence=0.75,
                entities=entities,
                is_hypothetical=False,
                requires_simulation=False,
                requires_clarification=True,
                clarification_prompt=clarification,
                reasoning="Required component or scope is underspecified in user query.",
            )

        # 14. Subsystem / Domain-Specific Factual Queries
        if self._is_alert_query(text):
            return IntentClassificationResult(
                intent=IntentType.ALERT_QUERY,
                confidence=0.95,
                entities=entities,
                is_hypothetical=False,
                requires_simulation=False,
                reasoning="Query asks about active alarms, warnings, or threshold breach events.",
            )

        if self._is_environment_query(text):
            return IntentClassificationResult(
                intent=IntentType.ENVIRONMENT_QUERY,
                confidence=0.95,
                entities=entities,
                is_hypothetical=False,
                requires_simulation=False,
                reasoning="Query asks about ambient polar meteorology, temperature, wind, or blizzards.",
            )

        if self._is_power_query(text):
            # Check if specific generator metric or general power system
            if entities.component_id or entities.metric in ["power_output", "load_pct", "voltage", "frequency", "generator_status"]:
                return IntentClassificationResult(
                    intent=IntentType.SIMPLE_TELEMETRY_QUERY,
                    confidence=0.95,
                    entities=entities,
                    is_hypothetical=False,
                    requires_simulation=False,
                    reasoning="Direct telemetry request for electrical microgrid or generator unit.",
                )
            return IntentClassificationResult(
                intent=IntentType.POWER_QUERY,
                confidence=0.92,
                entities=entities,
                is_hypothetical=False,
                requires_simulation=False,
                reasoning="General electrical microgrid status query.",
            )

        if self._is_fuel_query(text):
            if entities.component_id or entities.metric in ["fuel_level", "fuel_pct", "fuel_liters", "burn_rate", "fuel_days"]:
                return IntentClassificationResult(
                    intent=IntentType.SIMPLE_TELEMETRY_QUERY,
                    confidence=0.95,
                    entities=entities,
                    is_hypothetical=False,
                    requires_simulation=False,
                    reasoning="Direct telemetry request for fuel reserves or generator fuel status.",
                )
            return IntentClassificationResult(
                intent=IntentType.FUEL_QUERY,
                confidence=0.92,
                entities=entities,
                is_hypothetical=False,
                requires_simulation=False,
                reasoning="General fuel reserves and storage status query.",
            )

        if self._is_hvac_query(text):
            if entities.component_id or entities.metric in ["indoor_temp", "humidity", "glycol_temp", "heating_load"]:
                return IntentClassificationResult(
                    intent=IntentType.SIMPLE_TELEMETRY_QUERY,
                    confidence=0.95,
                    entities=entities,
                    is_hypothetical=False,
                    requires_simulation=False,
                    reasoning="Direct telemetry request for habitat thermal envelope or HVAC zone.",
                )
            return IntentClassificationResult(
                intent=IntentType.HVAC_QUERY,
                confidence=0.92,
                entities=entities,
                is_hypothetical=False,
                requires_simulation=False,
                reasoning="General HVAC and thermal control query.",
            )

        if self._is_water_query(text):
            if entities.metric in ["water_level", "water_pct", "water_production", "water_consumption", "water_quality"]:
                return IntentClassificationResult(
                    intent=IntentType.SIMPLE_TELEMETRY_QUERY,
                    confidence=0.95,
                    entities=entities,
                    is_hypothetical=False,
                    requires_simulation=False,
                    reasoning="Direct telemetry request for potable water storage or RO/snowmelt production.",
                )
            return IntentClassificationResult(
                intent=IntentType.WATER_QUERY,
                confidence=0.92,
                entities=entities,
                is_hypothetical=False,
                requires_simulation=False,
                reasoning="General water life support status query.",
            )

        if self._is_logistics_query(text):
            return IntentClassificationResult(
                intent=IntentType.LOGISTICS_QUERY,
                confidence=0.92,
                entities=entities,
                is_hypothetical=False,
                requires_simulation=False,
                reasoning="Query regarding inventory buffers, provisions, fleet, or expedition voyages.",
            )

        # 15. Generic Simple Telemetry Query if metric detected
        if entities.metric or entities.component_id:
            return IntentClassificationResult(
                intent=IntentType.SIMPLE_TELEMETRY_QUERY,
                confidence=0.90,
                entities=entities,
                is_hypothetical=False,
                requires_simulation=False,
                reasoning="Specific component or telemetry metric identified in factual context.",
            )

        # 16. Fallback / Unknown
        return IntentClassificationResult(
            intent=IntentType.UNKNOWN,
            confidence=0.50,
            entities=entities,
            is_hypothetical=False,
            requires_simulation=False,
            requires_clarification=True,
            clarification_prompt=f"Could you clarify your question regarding {entities.station or default_station} station telemetry, status, or a What-If scenario?",
            reasoning="Query could not be mapped unambiguously to an operational category.",
        )

    # -------------------------------------------------------------------------
    # Entity Extraction Helpers
    # -------------------------------------------------------------------------
    def _extract_entities(self, query: str, default_station: str) -> ExtractedEntities:
        text = query.lower()
        entities = ExtractedEntities(raw_query=query)

        # 1. Station
        if "bharati" in text:
            entities.station = "Bharati"
        elif "maitri" in text:
            entities.station = "Maitri"
        else:
            entities.station = default_station.title() if default_station else "Maitri"

        # 2. Generator ID & Multi-Generator Extraction
        gen_numbers = []
        if re.search(r"\b(all\s+generators?|all\s+gens?|every\s+generator)\b", text):
            st_gens = ["G1", "G2", "G3", "G4"] if entities.station == "Bharati" else ["G1", "G2", "G3"]
            gen_numbers = st_gens
        else:
            # Pattern A: "generator 1 and 2", "generators 1, 2, 3", "g1 and g2", "generator 1, 2 and 3"
            multi_gen_m = re.search(r"\b(?:generators?|gens?|g)\s*([1-6](?:\s*(?:,|and|\+|&)\s*(?:generators?|gens?|g)?\s*[1-6])+)\b", text)
            if multi_gen_m:
                sub = multi_gen_m.group(0)
                digits = re.findall(r"\b([1-6])\b", sub)
                for d in digits:
                    gid = f"G{d}"
                    if gid not in gen_numbers:
                        gen_numbers.append(gid)
            else:
                # Pattern B: Individual "generator 1", "g2", "gen 3", etc.
                indiv_matches = re.findall(r"\b(?:generators?|gens?|g)\s*([1-6])\b", text)
                for d in indiv_matches:
                    gid = f"G{d}"
                    if gid not in gen_numbers:
                        gen_numbers.append(gid)

        if gen_numbers:
            entities.component_type = "generator"
            entities.subsystem = "power"
            entities.affected_generators = gen_numbers
            entities.component_id = " + ".join(gen_numbers)
        elif re.search(r"\b(generator\s*alpha|gen\s*alpha)\b", text):
            entities.component_type = "generator"
            entities.component_id = "G1"
            entities.affected_generators = ["G1"]
            entities.subsystem = "power"

        # 3. Battery / BESS
        elif re.search(r"\b(battery|bess|ups|accumulator|storage\s*bank)\b", text):
            entities.component_type = "battery"
            entities.component_id = "BESS_BANK_1"
            entities.subsystem = "power"

        # 4. Solar PV
        elif re.search(r"\b(solar|pv|photovoltaic|inverter)\b", text):
            entities.component_type = "solar"
            entities.component_id = "SOLAR_ARRAY_1"
            entities.subsystem = "power"

        # 5. Fuel Tanks
        elif re.search(r"\b(tank\s*([1-4])|main\s*tank|reserve\s*tank|av-?fuel)\b", text):
            entities.component_type = "tank"
            tank_m = re.search(r"\btank\s*([1-4])\b", text)
            entities.component_id = f"TANK-0{tank_m.group(1)}" if tank_m else "TANK-01"
            entities.subsystem = "fuel"

        # 6. HVAC Zones
        elif re.search(r"\b(living\s*quarters|habitat|mess|lab|laboratory|bridge|control\s*room|clinic|medical|workshop|airlock)\b", text):
            entities.component_type = "zone"
            entities.subsystem = "hvac"
            if "living" in text or "mess" in text or "habitat" in text:
                entities.component_id = "ZONE-01"
            elif "lab" in text:
                entities.component_id = "ZONE-02"
            elif "bridge" in text or "control" in text:
                entities.component_id = "ZONE-03"
            elif "clinic" in text or "medical" in text:
                entities.component_id = "ZONE-04"
            elif "workshop" in text:
                entities.component_id = "ZONE-05"
            elif "airlock" in text:
                entities.component_id = "ZONE-06"

        # 7. Water Melter / RO
        elif re.search(r"\b(melter|snow\s*melt|ro|desalination|lake\s*pump)\b", text):
            entities.component_type = "melter" if ("melt" in text) else "ro"
            entities.subsystem = "water"

        # 8. Metric Identification
        # Fuel metrics
        if re.search(r"\b(fuel\s*level|fuel\s*percentage|how\s*much\s*fuel|fuel\s*remaining|what('s|\s+is)\s+left\s+in|fuel\s*capacity)\b", text):
            entities.metric = "fuel_level"
            if not entities.subsystem:
                entities.subsystem = "fuel"
        elif re.search(r"\b(burn\s*rate|fuel\s*burn|fuel\s*consumption|consumption\s*rate|fuel\s*draw)\b", text):
            entities.metric = "burn_rate"
            if not entities.subsystem:
                entities.subsystem = "fuel"
        elif re.search(r"\b(fuel\s*days|days\s*remaining|fuel\s*endurance|reserve\s*days)\b", text):
            entities.metric = "fuel_days"
            if not entities.subsystem:
                entities.subsystem = "fuel"

        # Power metrics
        elif re.search(r"\b(power\s*output|producing|generation|current\s*output|output\s*power|how\s*much\s*power|kw\b)\b", text):
            entities.metric = "power_output"
            if not entities.subsystem:
                entities.subsystem = "power"
        elif re.search(r"\b(load|station\s*load|demand|electrical\s*load|load\s*percentage)\b", text):
            entities.metric = "load_pct"
            if not entities.subsystem:
                entities.subsystem = "power"
        elif re.search(r"\b(voltage|bus\s*voltage|volts?|v\b)\b", text):
            entities.metric = "voltage"
            if not entities.subsystem:
                entities.subsystem = "power"
        elif re.search(r"\b(frequency|grid\s*frequency|hz\b|hertz)\b", text):
            entities.metric = "frequency"
            if not entities.subsystem:
                entities.subsystem = "power"
        elif re.search(r"\b(battery\s*soc|battery\s*level|battery\s*percentage|charge\s*level|battery\s*hours|bess\s*soc)\b", text):
            entities.metric = "battery_soc"
            if not entities.subsystem:
                entities.subsystem = "power"
        elif re.search(r"\b(is\s+(g\d|generator\s*\d|it)\s+running|is\s+it\s+on|status\s+of\s+(g\d|generator)|running\s+or\s+offline|generator\s*status)\b", text):
            entities.metric = "generator_status"
            if not entities.subsystem:
                entities.subsystem = "power"

        # Environmental metrics
        elif re.search(r"\b(temperature|temp\b|outdoor\s*temp|how\s*cold|how\s*hot|celsius|°c)\b", text):
            entities.metric = "outdoor_temp" if "indoor" not in text else "indoor_temp"
            if not entities.subsystem:
                entities.subsystem = "environment" if "indoor" not in text else "hvac"
        elif re.search(r"\b(wind\s*speed|wind\s*velocity|how\s*windy|km/h|knots?|wind\s*gust)\b", text):
            entities.metric = "wind_speed"
            entities.subsystem = "environment"
        elif re.search(r"\b(wind\s*direction|where\s+is\s+the\s+wind\s+blowing)\b", text):
            entities.metric = "wind_direction"
            entities.subsystem = "environment"
        elif re.search(r"\b(pressure|surface\s*pressure|barometer|barometric|hpa)\b", text):
            entities.metric = "pressure"
            entities.subsystem = "environment"
        elif re.search(r"\b(blizzard|storm|blizzard\s*risk|polar\s*freeze)\b", text):
            entities.metric = "blizzard_risk"
            entities.subsystem = "environment"

        # Water metrics
        elif re.search(r"\b(water\s*level|water\s*storage|potable\s*water|how\s*much\s*water|water\s*buffer)\b", text):
            entities.metric = "water_level"
            entities.subsystem = "water"
        elif re.search(r"\b(water\s*production|snow\s*melt\s*rate|ro\s*production)\b", text):
            entities.metric = "water_production"
            entities.subsystem = "water"
        elif re.search(r"\b(water\s*consumption|daily\s*water\s*use)\b", text):
            entities.metric = "water_consumption"
            entities.subsystem = "water"

        # Logistics metrics
        elif re.search(r"\b(food|provisions|stock\s*buffer|essential\s*stock|spares|spare\s*parts)\b", text):
            entities.metric = "stock_days"
            entities.subsystem = "logistics"
        elif re.search(r"\b(vehicles?|snowmobiles?|pistenbully|snowcats?|helicopter|kamov|fleet)\b", text):
            entities.metric = "fleet_status"
            entities.subsystem = "logistics"
        elif re.search(r"\b(ship|vessel|voyage|vasiliy\s*golovnin|resupply\s*ship)\b", text):
            entities.metric = "incoming_shipment"
            entities.subsystem = "logistics"

        # Alerts metrics
        elif re.search(r"\b(critical\s*alerts?|warnings?|active\s*alarms?|trips?|any\s*alerts?)\b", text):
            entities.metric = "active_alerts"
            entities.subsystem = "alerts"

        return entities

    def _enrich_scenario_entities(
        self,
        query: str,
        entities: ExtractedEntities,
        active_scenario: Optional[Dict[str, Any]] = None,
        previous_query: Optional[str] = None,
    ):
        text = query.lower()
        prev_text = (previous_query or "").lower()

        # Action
        if re.search(r"\b(shut\s*down|shutdown|turn\s*off|turned\s*.*off|turn\s*.*off|stop|disable|isolate|take\s*offline|unavailable|down)\b", text):
            entities.action = "shutdown"
        elif re.search(r"\b(fail(s|ed|ure)?|trip(s|ped)?|blackout|fault)\b", text):
            entities.action = "fail"
        elif re.search(r"\b(start|turn\s*on|spin\s*up|bring\s*online|engage|restart)\b", text):
            entities.action = "start"
        elif re.search(r"\b(delay|delayed|postpone|supply\s*delay)\b", text):
            entities.action = "delay"
        elif re.search(r"\b(setback|reduc(e|ed)|eco|lower)\b", text):
            entities.action = "setback"
        elif re.search(r"\b(throttle|conserve|save)\b", text):
            entities.action = "throttle"
        elif re.search(r"\b(cold\s*drop|temperature\s*falls|temperature\s*drops|drop\s*to|falls?\s*to)\b", text):
            entities.action = "cold_drop"
        elif re.search(r"\b(blizzard|storm|cat-?\s*3|grid\s*harden)\b", text):
            entities.action = "blizzard_prep"
        elif re.search(r"\b(optimiz(e|ation)|safest\s*way|which\s*generator|what\s+should\s+i\s+do\s+instead)\b", text):
            entities.action = "optimize"
        else:
            entities.action = active_scenario.get("action", "shutdown") if active_scenario else "shutdown"

        # Check Component Types
        if re.search(r"\b(water|purification|snow\s*melt|potable|lake\s*line)\b", text):
            entities.component_type = "water"
            entities.subsystem = "water"
            entities.component_id = "WATER_PURIFICATION_UNIT"
        elif re.search(r"\b(logistics|fuel\s*supply|resupply|shipment|fuel\s*delay|cargo)\b", text):
            entities.component_type = "logistics"
            entities.subsystem = "logistics"
            entities.component_id = "SUPPLY_CHAIN"
        elif re.search(r"\b(hvac|heating|heater|hvac\s*unit\s*\d)\b", text) and not entities.affected_generators:
            entities.component_type = "hvac"
            entities.subsystem = "hvac"
            hvac_num = re.search(r"\bhvac\s*(unit\s*)?([1-4])\b", text)
            entities.component_id = f"HVAC-0{hvac_num.group(2)}" if hvac_num else "HVAC-01"
        elif re.search(r"\b(temperature\s*falls|temp\s*drops|outdoor\s*temp|falls\s*to\s*-\d+|-\d+\s*°?c)\b", text) and not entities.affected_generators:
            entities.component_type = "hvac"
            entities.subsystem = "environment"
            entities.component_id = "THERMAL_ENVELOPE"

        # Multi-turn Generator Extension (e.g. "What if Generator 2 also goes off?")
        if active_scenario and ("also" in text or "too" in text or "and" in text or "both" in text or "what about g" in text):
            prev_gens = active_scenario.get("affected_generators") or ([active_scenario.get("component_id")] if active_scenario.get("component_id") in ["G1", "G2", "G3", "G4"] else [])
            combined_gens = list(prev_gens)
            for g in entities.affected_generators:
                if g not in combined_gens:
                    combined_gens.append(g)
            if combined_gens:
                entities.component_type = "generator"
                entities.subsystem = "power"
                entities.affected_generators = combined_gens
                entities.component_id = " + ".join(combined_gens)

        # Multi-turn Scenario & Pronoun Resolution (e.g. "Would that be safe?", "What if I turn it off for 8 hours?")
        if not entities.affected_generators and not entities.component_id:
            if active_scenario and active_scenario.get("affected_generators"):
                entities.component_type = active_scenario.get("component", "generator")
                entities.affected_generators = list(active_scenario.get("affected_generators", ["G1"]))
                entities.component_id = " + ".join(entities.affected_generators)
                if active_scenario.get("action"):
                    entities.action = active_scenario["action"]
            elif prev_text:
                prev_gen_m = re.findall(r"\b(?:generators?|gens?|g)\s*([1-6])\b", prev_text)
                if prev_gen_m:
                    entities.component_type = "generator"
                    entities.subsystem = "power"
                    entities.affected_generators = [f"G{d}" for d in prev_gen_m]
                    entities.component_id = " + ".join(entities.affected_generators)
            elif active_scenario:
                entities.component_type = active_scenario.get("component", "generator")
                entities.component_id = active_scenario.get("component_id", "G1")
                entities.affected_generators = active_scenario.get("affected_generators", ["G1"])

        # Context inheritance for safety / recovery / resource queries without explicit targets
        if not entities.affected_generators and active_scenario:
            entities.component_type = active_scenario.get("component", "generator")
            entities.affected_generators = list(active_scenario.get("affected_generators", ["G1"]))
            entities.component_id = " + ".join(entities.affected_generators)

        # Duration Extraction
        dur_match = re.search(r"(\d+(\.\d+)?)\s*(hours?|hrs?|h\b|days?|d\b|mins?|minutes?)", text)
        if dur_match:
            val = float(dur_match.group(1))
            unit = dur_match.group(3).lower()
            if "day" in unit or unit == "d":
                entities.duration_hours = val * 24.0
            elif "min" in unit:
                entities.duration_hours = max(0.1, val / 60.0)
            else:
                entities.duration_hours = val
            entities.duration_is_default = False
        else:
            delay_m = re.search(r"(\d+(\.\d+)?)\s*days?", text)
            if delay_m:
                entities.duration_hours = float(delay_m.group(1)) * 24.0
                entities.duration_is_default = False
            elif active_scenario and active_scenario.get("duration_hours"):
                # Inherit duration from active scenario if follow-up
                entities.duration_hours = float(active_scenario["duration_hours"])
                entities.duration_is_default = False
            else:
                entities.duration_hours = 1.0
                entities.duration_is_default = True

        if not entities.component_type:
            entities.component_type = "generator"
        if not entities.component_id and entities.component_type == "generator":
            entities.component_id = "G1"
            entities.affected_generators = ["G1"]

    def _enrich_telemetry_follow_up_entities(
        self,
        query: str,
        entities: ExtractedEntities,
        previous_query: Optional[str] = None,
    ):
        """
        Enriches entities for conversational follow-ups using previous context.
        """
        text = query.lower()
        prev_text = (previous_query or "").lower()

        # Check if previous query mentioned a generator
        if not entities.component_id and prev_text:
            prev_gen_m = re.search(r"\b(gen(erator)?\s*([1-6])|g\s*([1-6]))\b", prev_text)
            if prev_gen_m:
                num = prev_gen_m.group(3) or prev_gen_m.group(4)
                entities.component_type = "generator"
                entities.component_id = f"G{num}"
                entities.subsystem = "power"

        # Check for unit conversions or status inquiries
        if re.search(r"\b(litres?|liters?)\b", text):
            entities.metric = "fuel_liters"
        elif re.search(r"\b(running|status|on|offline)\b", text):
            entities.metric = "generator_status"
        elif re.search(r"\b(kw|power|output)\b", text):
            entities.metric = "power_output"

    def _is_ambiguous_metric_query(self, text: str, entities: ExtractedEntities) -> bool:
        """
        Detects if query asks a generic metric without required component or scope.
        """
        # "What is the fuel level?" without specific generator, tank, or "station/total"
        if re.search(r"^(what('s|\s+is)\s+(the\s+)?fuel\s*level\??|how\s+much\s+fuel\s+(is\s+left|remaining|is\s+there)\??)$", text):
            if not entities.component_id and not any(k in text for k in ["total", "station", "overall", "bulk"]):
                return True

        # "What is the status?" without any component or system
        if re.search(r"^(what('s|\s+is)\s+(the\s+)?status\??|how\s+is\s+it\??)$", text):
            if not entities.component_id and not entities.subsystem:
                return True

        return False

    def _generate_clarification_prompt(self, text: str, entities: ExtractedEntities, default_station: str) -> str:
        """
        Generates a concise clarification prompt for ambiguous queries.
        """
        st = entities.station or default_station or "Maitri"
        if "fuel" in text:
            return f"Which component at {st} do you mean — Generator (G1, G2, G3) or Bulk Storage Tanks (Tank 1, Tank 2)?"
        if "generator" in text or "running" in text:
            return f"Which generator at {st} do you mean — G1, G2, G3, or G4?"
        return f"Could you specify which subsystem or component at {st} you would like telemetry for?"

    # -------------------------------------------------------------------------
    # Intent Matchers
    # -------------------------------------------------------------------------
    def _is_greeting(self, text: str) -> bool:
        return bool(re.search(r"^(hi|hello|hey|greetings|good\s*(morning|afternoon|evening)|namaste|dhruvnetra)\b", text)) or text in ["help", "menu", "commands"]

    def _is_general_project(self, text: str) -> bool:
        return bool(re.search(r"\b(what\s+is\s+dhruvnetra|about\s+dhruvnetra|sih\s*26060|who\s+(built|made)\s+this|tell\s+me\s+about\s+(maitri|bharati))\b", text))

    def _is_comparison(self, text: str) -> bool:
        return bool(re.search(r"\b(compare|versus|vs\.?|difference\s+between|which\s+station\s+has\s+more|between\s+maitri\s+and\s+bharati)\b", text))

    def _is_historical_trend(self, text: str) -> bool:
        return bool(re.search(r"\b(trend|history|past\s*24\s*h(ours?)?|over\s+time|curve|last\s*24\s*hours?|historical)\b", text))

    def _is_prediction(self, text: str) -> bool:
        return bool(re.search(r"\b(predict|forecast|when\s+will\s+.+\s+run\s+out|projected\s+endurance|estimated\s+depletion)\b", text))

    def _is_recommendation(self, text: str) -> bool:
        return bool(re.search(r"\b(recommend(ation)?|how\s+to\s+(conserve|save|optimize)|what\s+should\s+we\s+do|advise|best\s+configuration)\b", text))

    def _is_explicit_what_if(self, text: str) -> bool:
        return any(bool(re.search(pattern, text)) for pattern in self.what_if_patterns)

    def _is_scenario_follow_up(self, text: str) -> bool:
        return any(bool(re.search(pattern, text)) for pattern in self.scenario_followup_patterns)

    def _is_telemetry_follow_up(self, text: str, previous_intent: Optional[str], previous_query: Optional[str] = None) -> bool:
        if previous_intent and ("TELEMETRY" in previous_intent or "STATUS" in previous_intent):
            return any(bool(re.search(pattern, text)) for pattern in self.telemetry_followup_patterns)
        if previous_query and any(bool(re.search(pattern, text)) for pattern in self.telemetry_followup_patterns):
            return True
        return False

    def _is_alert_query(self, text: str) -> bool:
        return bool(re.search(r"\b(alerts?|alarms?|critical\s*alerts?|warnings?|trips?|anomal(y|ies)|faults?)\b", text))

    def _is_environment_query(self, text: str) -> bool:
        return bool(re.search(r"\b(weather|temperature|temp\b|wind|blizzard|cold|humidity|pressure|wind\s*chill|forecast|outdoor)\b", text))

    def _is_power_query(self, text: str) -> bool:
        return bool(re.search(r"\b(power|generator|generators|gen\s*\d|g\d|microgrid|load|voltage|frequency|bess|battery|solar|pv|grid)\b", text))

    def _is_fuel_query(self, text: str) -> bool:
        return bool(re.search(r"\b(fuel|diesel|hsd|jet\s*a-?1|tank|tanks|burn\s*rate|consumption|refuel|endurance)\b", text))

    def _is_hvac_query(self, text: str) -> bool:
        return bool(re.search(r"\b(hvac|heating|heater|indoor\s*temp|thermal|glycol|radiator|ventilation|air\s*flow|comfort)\b", text))

    def _is_water_query(self, text: str) -> bool:
        return bool(re.search(r"\b(water|potable|melter|snow\s*melt|ro\b|desalination|lake\s*line|purification|tds)\b", text))

    def _is_logistics_query(self, text: str) -> bool:
        return bool(re.search(r"\b(logistics|food|rations|provisions|spares|inventory|pistenbully|snowcat|snowmobile|helicopter|ship|vessel|voyage|stock)\b", text))

    def _is_system_status(self, text: str) -> bool:
        return bool(re.search(r"\b(status\s+of\s+(power|fuel|hvac|water|logistics|microgrid|thermal|life\s*support)|how\s+is\s+the\s+(power|fuel|hvac|water|logistics)\s+system)\b", text))

    def _is_station_status(self, text: str) -> bool:
        return bool(re.search(r"\b(status\s+of\s+(maitri|bharati|station)|how\s+is\s+(maitri|bharati|the\s+station)|station\s*health|overall\s*health|is\s+(maitri|bharati)\s+(online|operational|ok))\b", text))

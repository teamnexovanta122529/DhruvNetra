"""
DHRUVNETRA - Natural Language What-If Query Parser
Extracts structured scenario parameters using a pre-trained LLM with strict validation.
"""

from typing import Optional, Dict, Any
from .schemas import ParsedScenario, ParseResult
from .client import LLMClient

SYSTEM_EXTRACTION_PROMPT = """
You are the DHRUVNETRA Natural-Language Scenario Parser for Indian Antarctic Stations (Maitri & Bharati).
Your task is ONLY to parse the user's operational what-if query and extract structured JSON parameters.

STRICT INSTRUCTIONS:
1. DO NOT CALCULATE ANY PHYSICS, FUEL CONSUMPTION, OR NUMERICAL ENGINEERING RESULTS.
2. DO NOT ANSWER THE QUESTION OR GENERATE SIMULATION OUTPUTS.
3. EXTRACT ONLY THE SCENARIO PARAMETERS IN THE SPECIFIED JSON SCHEMA.

ALLOWED VALUES:
- station: "Maitri" or "Bharati" (If not explicitly stated in query, default to the active station provided in context).
- component: "generator" | "hvac" | "battery" | "fuel" | "water" | "weather"
- affected_generators: list of generator IDs e.g. ["G1"], ["G1", "G2"], ["G1", "G2", "G3"] (for generators)
- component_id: "G1", "G2", "G3", "G4", "G1 + G2" (for generators) or generic ID
- action: "shutdown" | "start" | "fail" | "setback" | "throttle" | "boost" | "cold_drop" | "blizzard_prep" | "optimize"
- duration_hours: float (e.g. 1.0, 7.0, 24.0, 0.5; default to 1.0 if not specified by user)

JSON OUTPUT STRUCTURE:
{
  "station": "Maitri",
  "component": "generator",
  "component_id": "G1 + G2",
  "affected_generators": ["G1", "G2"],
  "action": "shutdown",
  "duration_hours": 1.0,
  "parameters": {}
}
"""


class WhatIfQueryParser:
    """
    Parser converting user natural language questions into strictly-typed scenario JSON.
    """

    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.client = llm_client or LLMClient()

    def parse_query(
        self,
        query: str,
        default_station: str = "Maitri",
    ) -> ParseResult:
        """
        Parses natural language query into a validated ParsedScenario.
        Rejects invalid or unsafe queries.

        Parameters:
        -----------
        query: User input string (e.g. "What if Generator 1 and 2 at Maitri are turned off for 7 hours?")
        default_station: Active station context ("Maitri" or "Bharati")

        Returns:
        --------
        ParseResult containing the validated ParsedScenario or rejection reason.
        """
        if not query or not query.strip():
            return ParseResult(
                success=False,
                error="Empty query provided.",
                validation_errors=["Query string is empty."],
            )

        user_context_prompt = (
            f"Active Station Context: {default_station}\n"
            f"User Query: \"{query.strip()}\"\n\n"
            f"Extract the structured scenario JSON according to the instructions:"
        )

        try:
            # 1. Call Pre-trained LLM / Client
            raw_dict, provider = self.client.generate_json(
                system_prompt=SYSTEM_EXTRACTION_PROMPT,
                user_prompt=user_context_prompt,
            )

            if not isinstance(raw_dict, dict):
                return ParseResult(
                    success=False,
                    error="LLM returned non-dictionary response.",
                    validation_errors=["Malformed JSON structure from LLM."],
                    provider_used=provider,
                )

            # 2. Map to ParsedScenario
            aff_gens = raw_dict.get("affected_generators", [])
            if not isinstance(aff_gens, list):
                aff_gens = [str(aff_gens)]

            scenario = ParsedScenario(
                station=raw_dict.get("station") or default_station,
                component=raw_dict.get("component") or "generator",
                component_id=raw_dict.get("component_id") or (" + ".join(aff_gens) if aff_gens else "G1"),
                affected_generators=aff_gens,
                action=raw_dict.get("action") or "shutdown",
                duration_hours=float(raw_dict.get("duration_hours", 1.0)),
                duration_is_default=bool(raw_dict.get("duration_is_default", False)),
                modifications=raw_dict.get("modifications", {}),
                assumptions=raw_dict.get("assumptions", []),
                parameters=raw_dict.get("parameters", {}),
                confidence=float(raw_dict.get("confidence", 1.0)),
                raw_query=query,
            )

            # 3. Apply Strict Schema Validation & Sanitization
            validation_errors = scenario.validate_and_sanitize()

            if validation_errors:
                return ParseResult(
                    success=False,
                    scenario=None,
                    error=f"Scenario rejected due to validation constraints: {'; '.join(validation_errors)}",
                    validation_errors=validation_errors,
                    provider_used=provider,
                )

            # 4. Valid scenario
            return ParseResult(
                success=True,
                scenario=scenario,
                error=None,
                validation_errors=[],
                provider_used=provider,
            )

        except Exception as e:
            return ParseResult(
                success=False,
                error=f"Exception during scenario parsing: {str(e)}",
                validation_errors=[str(e)],
                provider_used=self.client.provider,
            )

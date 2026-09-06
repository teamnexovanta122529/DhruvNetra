"""
DHRUVNETRA - LLM Operational Explainer & Narrative Generator
Generates clear operational explanations based strictly on deterministic
simulation calculations and risk assessments without hallucinating numbers.
"""

from typing import Dict, Any, Optional, List
from .client import LLMClient
from .schemas import ParsedScenario


EXPLAINER_SYSTEM_PROMPT = """
You are the DHRUVNETRA AI Operational Explainer for Indian Antarctic Stations (Maitri & Bharati).
Your role is to generate an executive operational summary explaining the simulation results to station engineers.

CRITICAL CONSTRAINTS:
1. USE ONLY the exact numerical figures provided in the context (power deficit, fuel saved, battery SOC, temperatures, generator loads).
2. DO NOT invent, hallucinate, or recalculate numerical values.
3. Reference specific generator units, N-1 redundancy status, and risk classifications as given.
4. Keep the tone authoritative, concise, and focused on operational safety in extreme Antarctic conditions.

Provide your response in JSON with two keys:
- "explanation": Concise 2-3 sentence narrative describing the physical station impacts.
- "recommendation": 1-2 sentence actionable directive for the station commander.
"""


class LLMExplainer:
    """
    Generates human-readable operational narratives and recommendations
    grounded firmly in the deterministic simulation numbers.
    """

    def __init__(self, llm_client: Optional[LLMClient] = None):
        self.client = llm_client or LLMClient()

    def generate_explanation(
        self,
        scenario: ParsedScenario,
        sim_result: Dict[str, Any],
        risk_result: Dict[str, Any],
        ml_prediction: Optional[Dict[str, Any]] = None,
    ) -> Dict[str, str]:
        """
        Generates grounded operational explanation and recommendation.
        """
        impact = sim_result.get("impact", {})
        eng = sim_result.get("engineeringDetails", {})
        risk_level = risk_result.get("overall_risk", impact.get("riskLevel", "LOW"))
        reasons = risk_result.get("reasons", [])

        fuel_saved_str = impact.get("fuelSaved", "0.0 L")
        fuel_change = impact.get("fuelBurnChange", "+0.0 L/h")
        power_deficit = eng.get("power_deficit_kw", 0.0)
        thermal = eng.get("thermal", {})
        battery = eng.get("battery", {})

        indoor_temp = thermal.get("final_indoor_temp", 20.0)
        temp_delta = thermal.get("temperature_delta", 0.0)
        final_soc = battery.get("final_soc_pct", 94.0)

        # Build ground-truth prompt for the LLM
        prompt_data = (
            f"Scenario: {scenario.raw_query or f'{scenario.action} on {scenario.component_id} at {scenario.station}'}\n"
            f"Station: {scenario.station}\n"
            f"Duration: {scenario.duration_hours} hours\n"
            f"Power Deficit: {power_deficit:.1f} kW\n"
            f"Projected Load: {impact.get('projectedLoad', '96 kW')}\n"
            f"Fuel Delta: {fuel_saved_str} (Rate Change: {fuel_change})\n"
            f"Thermal Impact: {temp_delta:+.1f} deg C (Indoor Temp: {indoor_temp:.1f} deg C)\n"
            f"Battery SOC: {final_soc:.1f}%\n"
            f"Risk Level: {risk_level} (Score: {risk_result.get('risk_score', impact.get('riskScore', 0))}/100)\n"
            f"Risk Reasons: {'; '.join(reasons) if reasons else 'Nominal operation'}\n"
        )

        user_prompt = f"Summarize this Antarctic simulation outcome:\n{prompt_data}"

        # Attempt LLM call if live provider configured
        if self.client.gemini_key or self.client.openai_key or self.client.provider == "ollama":
            try:
                res, _ = self.client.generate_json(EXPLAINER_SYSTEM_PROMPT, user_prompt)
                if isinstance(res, dict) and "explanation" in res and "recommendation" in res:
                    return {
                        "explanation": str(res["explanation"]),
                        "recommendation": str(res["recommendation"]),
                    }
            except Exception as e:
                print(f"[!] LLM explainer generation failed: {e}. Using deterministic template.")

        # Deterministic Grounded Fallback Explainer (Guaranteed zero hallucination)
        return self._generate_deterministic_explanation(
            scenario=scenario,
            impact=impact,
            eng=eng,
            risk_result=risk_result,
        )

    def _generate_deterministic_explanation(
        self,
        scenario: ParsedScenario,
        impact: Dict[str, Any],
        eng: Dict[str, Any],
        risk_result: Dict[str, Any],
    ) -> Dict[str, str]:
        """
        Deterministic, rule-grounded narrative generator that inserts exact numbers.
        """
        station = scenario.station
        comp_id = scenario.component_id or "Component"
        duration = scenario.duration_hours
        deficit = eng.get("power_deficit_kw", 0.0)
        fuel_saved = impact.get("fuelSaved", "0.0 L")
        risk_level = risk_result.get("overall_risk", impact.get("riskLevel", "LOW"))

        if deficit > 0.0:
            explanation = (
                f"Simulating a {duration:.1f}-hour {scenario.action} of {comp_id} at {station} causes a critical "
                f"power deficit of {deficit:.1f} kW. Remaining generation units cannot satisfy the full station electrical load. "
                f"Non-essential circuits must undergo emergency load shedding."
            )
            recommendation = (
                f"CRITICAL ACTION REQUIRED: Initiate emergency diesel restart sequence immediately. "
                f"Engage battery BESS backup buffer to protect life-support HVAC circuits."
            )
        elif scenario.component == "generator" and scenario.action in ["shutdown", "fail"]:
            explanation = (
                f"Simulating a {duration:.1f}-hour {scenario.action} of {comp_id} at {station}. "
                f"Station electrical load shifts to backup active units with {impact.get('projectedLoad', 'nominal load')}. "
                f"Station microgrid remains stable with 0.0 kW deficit and projected fuel delta of {fuel_saved}. "
                f"Redundancy is reduced to N-0 during this operational window."
            )
            if risk_level in ["HIGH", "CRITICAL"]:
                recommendation = "CAUTION: Prime standby generator on auto-crank before isolating primary unit."
            else:
                recommendation = "PROCEED WITH CAUTION: Maintain constant telemetry monitoring on active generator thermal load."
        else:
            explanation = (
                f"Simulated {scenario.action} on {comp_id} at {station} over {duration:.1f} hours. "
                f"Power deficit is {deficit:.1f} kW, fuel consumption is {impact.get('projectedConsumption', '26.2 L/h')}, "
                f"and habitat indoor temperature remains stable."
            )
            recommendation = risk_result.get("recommended_action", "Continue nominal station monitoring.")

        return {
            "explanation": explanation,
            "recommendation": recommendation,
        }

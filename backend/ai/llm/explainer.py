"""
DHRUVNETRA - LLM Operational Explainer & Narrative Generator
Generates clear operational explanations based strictly on deterministic
simulation calculations and risk assessments without hallucinating numbers.
"""

from typing import Dict, Any, Optional, List
from .client import LLMClient
from .schemas import ParsedScenario


EXPLAINER_SYSTEM_PROMPT = """
You are the DHRUVNETRA AI Operational Intelligence Explainer for Indian Antarctic Stations (Maitri & Bharati).
Your role is to explain simulation outcomes and operational guidance directly to station commanders.

CRITICAL CONSTRAINTS:
1. USE ONLY the exact numerical figures provided in the context (power deficit, fuel saved, generator loads, temperatures).
2. DO NOT invent or recalculate numbers.
3. Keep the tone authoritative, calm, technical, and decision-oriented.

Provide your response in JSON with two keys:
- "explanation": Formatted operational analysis containing sections: Operational impact, Fuel impact, System impact, Risk, Should you do it?, Recommended action.
- "recommendation": Concise 1-sentence operational recommendation.
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
        # If engine already generated high-fidelity aiResponse, use it directly as ground truth
        ai_resp = sim_result.get("aiResponse")
        if ai_resp:
            rec_text = risk_result.get("recommendation", risk_result.get("recommended_action", "MONITOR_CLOSELY"))
            return {
                "explanation": ai_resp,
                "recommendation": rec_text,
            }

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
        Deterministic, rule-grounded narrative generator matching DHRUVNETRA 6-section template.
        """
        station = scenario.station.upper()
        if scenario.affected_generators:
            comp_id = " + ".join(scenario.affected_generators)
        else:
            comp_id = scenario.component_id or "Component"

        duration = scenario.duration_hours
        deficit = eng.get("power_deficit_kw", 0.0)
        fuel_saved = impact.get("fuelSaved", "0.0 L")
        risk_level = risk_result.get("overall_risk", impact.get("riskLevel", "LOW"))
        active_gens = eng.get("active_generators", [])
        active_str = ", ".join(active_gens) if active_gens else "none"
        demand_kw = eng.get("baseline_demand_kw", 190.0)
        avail_kw = eng.get("projected_available_cap_kw", 98.0)
        lost_kw = max(0.0, eng.get("baseline_available_cap_kw", 223.0) - avail_kw)

        risk_emoji = "🟢" if risk_level == "LOW" else ("🟡" if risk_level == "MEDIUM" else ("🔴" if risk_level == "HIGH" else "🚨"))

        if deficit > 0.0:
            should_do = "❌ NOT RECOMMENDED"
            should_why = f"Current demand ({demand_kw:.0f} kW) exceeds remaining generation ({avail_kw:.0f} kW), creating an estimated {deficit:.0f} kW deficit."
            rec_action = f"Start backup generation before shutting down {comp_id} and maintain sufficient reserve for critical systems."
        elif len(active_gens) == 1:
            should_do = "⚠️ CAUTION ADVISED"
            should_why = f"Remaining generation can support demand, but redundancy is reduced to single-generator operation."
            rec_action = f"Prime standby units on auto-crank and monitor active unit load closely."
        else:
            should_do = "✅ RECOMMENDED"
            should_why = f"Station microgrid retains sufficient redundancy and generation headroom."
            rec_action = f"Proceed with planned operation while logging hourly telemetry."

        explanation = (
            f"**{station} — {duration:.0f}-HOUR {comp_id} {scenario.action.upper()} ANALYSIS**\n\n"
            f"I analyzed the scenario against the current station telemetry.\n\n"
            f"**Operational impact**\n"
            f"• {comp_id} generation lost: {lost_kw:.0f} kW\n"
            f"• Remaining generation: {avail_kw:.0f} kW ({active_str})\n"
            f"• Current station demand: {demand_kw:.0f} kW\n"
            f"• Projected power deficit: {deficit:.0f} kW\n\n"
            f"**Fuel impact**\n"
            f"• Direct fuel consumption avoided: approximately {fuel_saved}\n"
            f"• Net fuel benefit: {fuel_saved}\n\n"
            f"**System impact**\n"
            f"• Power redundancy: {'Reduced (N-0)' if len(active_gens) <= 1 else 'Nominal (N-1)'}\n"
            f"• HVAC: {'At risk if load shedding is required' if deficit > 0 else 'Stable'}\n"
            f"• Critical systems: Must remain prioritized\n"
            f"• Non-critical loads: {'May need to be reduced' if deficit > 0 else 'Nominal'}\n\n"
            f"**Risk**\n"
            f"{risk_emoji} {risk_level}\n\n"
            f"**Should you do it?**\n"
            f"{should_do} under the current operating conditions.\n"
            f"{should_why}\n\n"
            f"**Recommended action**\n"
            f"{rec_action}"
        )

        return {
            "explanation": explanation,
            "recommendation": rec_action,
        }

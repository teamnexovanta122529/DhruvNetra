"""
DHRUVNETRA - FastAPI What-If Analysis Route
Orchestrates the 9-step hybrid AI What-If analysis pipeline:
User Query -> LLM Parser -> Validation -> Station State -> Simulation -> XGBoost ML -> Risk Engine -> LLM Explainer -> Response JSON
"""

import logging
from fastapi import APIRouter, HTTPException, status
from typing import Dict, Any

from backend.ai.llm.parser import WhatIfQueryParser
from backend.ai.llm.schemas import ParsedScenario
from backend.ai.llm.explainer import LLMExplainer
from backend.simulation.engine import WhatIfSimulationEngine
from backend.simulation.risk_engine import RiskEngine
from backend.ai.ml.predictor import WhatIfMLPredictor
from backend.app.schemas.whatif import (
    WhatIfRequest,
    WhatIfResponse,
    WhatIfErrorResponse,
    ScenarioPayload,
    BaselinePayload,
    PredictionPayload,
    ImpactPayload,
    RiskPayload,
)

logger = logging.getLogger("dhruvnetra.api.whatif")
router = APIRouter(prefix="/api", tags=["What-If Analysis"])

# Initialize singletons for pipeline components
llm_parser = WhatIfQueryParser()
llm_explainer = LLMExplainer()
simulation_engine = WhatIfSimulationEngine()
risk_engine = RiskEngine()
ml_predictor = WhatIfMLPredictor()


# Station baseline snapshots (representative real-time telemetry state)
DEFAULT_STATION_STATES: Dict[str, Dict[str, Any]] = {
    "MAITRI": {
        "station": "MAITRI",
        "outdoor_temp_celsius": -24.5,
        "indoor_temp_celsius": 19.8,
        "wind_speed_kmh": 36.2,
        "fuel_storage_liters": 47800.0,
        "fuel_level_pct": 79.7,
        "battery_soc_pct": 94.2,
        "active_generators": ["G1", "G2"],
        "active_generators_count": 2,
        "total_power_demand_kw": 96.5,
        "hvac_power_kw": 28.5,
        "glycol_pump_load_pct": 68.0,
    },
    "BHARATI": {
        "station": "BHARATI",
        "outdoor_temp_celsius": -18.2,
        "indoor_temp_celsius": 20.4,
        "wind_speed_kmh": 26.8,
        "fuel_storage_liters": 81900.0,
        "fuel_level_pct": 81.9,
        "battery_soc_pct": 95.8,
        "active_generators": ["G1"],
        "active_generators_count": 1,
        "total_power_demand_kw": 88.0,
        "hvac_power_kw": 24.0,
        "glycol_pump_load_pct": 64.0,
    }
}


@router.post(
    "/what-if",
    response_model=WhatIfResponse,
    summary="Execute Natural-Language What-If Scenario Analysis",
    description="Processes natural-language queries through the 9-step hybrid AI pipeline.",
    responses={
        400: {"model": WhatIfErrorResponse, "description": "Query Rejected or Validation Error"},
        422: {"model": WhatIfErrorResponse, "description": "Unprocessable Query"},
    }
)
@router.post(
    "/whatif/simulate",
    response_model=WhatIfResponse,
    include_in_schema=False,
)
async def analyze_what_if_scenario(req: WhatIfRequest):
    """
    Step-by-step pipeline execution for What-If Operational Analysis:
    1. Receive query
    2. Parse query using pre-trained LLM
    3. Validate structured scenario
    4. Load current station state
    5. Run deterministic simulation
    6. Run XGBoost predictions
    7. Run risk engine
    8. Generate structured result + LLM narrative
    9. Return JSON response
    """
    logger.info(f"Incoming What-If Query: '{req.query}'")

    # Step 1: Validate query existence
    raw_query = req.query.strip()
    if not raw_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Empty query provided.", "validation_errors": ["Query string cannot be empty."]}
        )

    # Step 2: Parse query using pre-trained LLM
    active_station_context = (req.station or "Maitri").title()
    parse_result = llm_parser.parse_query(raw_query, default_station=active_station_context)

    # Step 3: Validate structured scenario
    if not parse_result.success or parse_result.scenario is None:
        logger.warning(f"Scenario Rejected: {parse_result.error}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": parse_result.error or "Failed to parse scenario.",
                "validation_errors": parse_result.validation_errors,
                "raw_query": raw_query,
            }
        )

    scenario: ParsedScenario = parse_result.scenario

    # Step 4: Load current station state
    station_key = scenario.station.upper()
    station_state = dict(DEFAULT_STATION_STATES.get(station_key, DEFAULT_STATION_STATES["MAITRI"]))
    if req.state_overrides:
        station_state.update(req.state_overrides)

    # Step 5: Run deterministic simulation
    scenario_dict = scenario.to_dict()
    sim_result = simulation_engine.simulate(
        station_state=station_state,
        scenario=scenario_dict,
    )

    eng = sim_result["engineeringDetails"]
    impact_dict = sim_result["impact"]
    fuel_info = eng["fuel"]
    thermal_info = eng["thermal"]
    battery_info = eng["battery"]

    # Active generator units in simulation
    active_gens = [
        "G2" if scenario.component_id == "G1" else "G1"
    ] if station_key == "MAITRI" else ["G1", "G3"]

    # Step 6: Run XGBoost predictions
    ml_trajectory = ml_predictor.generate_ml_trajectory(
        station=scenario.station,
        duration_hours=scenario.duration_hours,
        baseline_load_kw=eng["baseline_demand_kw"],
        simulated_load_kw=eng["projected_demand_kw"],
        baseline_gen_count=len(station_state.get("active_generators", ["G1", "G2"])),
        simulated_gen_count=max(1, len(active_gens)),
        outdoor_temp=station_state["outdoor_temp_celsius"],
        wind_speed_kmh=station_state["wind_speed_kmh"],
    )

    # Step 7: Evaluate Risk Engine
    risk_eval = {
        "overall_risk": impact_dict["riskLevel"],
        "risk_score": impact_dict["riskScore"],
        "factors": {
            "power_deficit": {"status": "SAFE" if eng["power_deficit_kw"] == 0.0 else "CRITICAL", "value": eng["power_deficit_kw"]},
            "redundancy_loss": {"status": "WARNING" if not eng["n_minus_one"]["n_minus_one_satisfied"] else "SAFE", "value": "N-0" if not eng["n_minus_one"]["n_minus_one_satisfied"] else "N-1"},
            "battery_soc": {"status": battery_info["status"], "value": battery_info["final_soc_pct"]},
            "fuel_endurance": {"status": "SAFE", "value": fuel_info["projected_endurance_days"]},
            "indoor_temperature": {"status": thermal_info.get("freeze_risk", "NOMINAL"), "value": thermal_info["final_indoor_temp"]},
        },
        "reasons": [impact_dict["recommendationText"]],
        "recommended_action": impact_dict["recommendation"],
    }

    baseline_fuel_burn = float(fuel_info["baseline_burn_lph"])
    projected_fuel_burn = float(fuel_info["projected_burn_lph"])
    fuel_burn_delta = round(projected_fuel_burn - baseline_fuel_burn, 2)
    fuel_saved_total = float(fuel_info["total_fuel_saved_liters"])

    # Step 8: Generate structured result + LLM narrative explanation
    explanation_pack = llm_explainer.generate_explanation(
        scenario=scenario,
        sim_result=sim_result,
        risk_result=risk_eval,
    )
    explanation_text = explanation_pack.get("explanation", "")
    recommendation_text = explanation_pack.get("recommendation", "")

    # Format AI narrative report block
    ai_narrative = (
        f"DHRUVNETRA AI OPERATIONAL ASSESSMENT\n"
        f"====================================\n"
        f"Station: {scenario.station.upper()} | Scenario: {scenario.action.upper()} ({scenario.component_id}) for {scenario.duration_hours}h\n"
        f"Calculated Risk: {risk_eval['overall_risk']} (Safety Score: {risk_eval['risk_score']}/100)\n\n"
        f"ANALYSIS SUMMARY:\n{explanation_text}\n\n"
        f"OPERATIONAL DIRECTIVE:\n{recommendation_text}\n\n"
        f"ENGINEERING METRICS:\n"
        f"- Net Power Deficit: {eng['power_deficit_kw']:.1f} kW\n"
        f"- Fuel Burn Delta: {fuel_burn_delta:+.2f} L/h (Cumulative Fuel Saved: {fuel_saved_total:+.1f} L)\n"
        f"- Habitat Temperature: {thermal_info['final_indoor_temp']:.1f} deg C (Delta: {thermal_info['temperature_delta']:+.1f} deg C)\n"
        f"- Battery BESS Reserve: {battery_info['final_soc_pct']:.1f}%\n"
        f"- Active Load Dispatch: {impact_dict['projectedLoad']}"
    )

    # Step 9: Return JSON matching the API schema
    return WhatIfResponse(
        success=True,
        scenario=ScenarioPayload(
            station=scenario.station,
            component=scenario.component,
            component_id=scenario.component_id,
            action=scenario.action,
            duration_hours=scenario.duration_hours,
            parameters=scenario.parameters,
            confidence=scenario.confidence,
            raw_query=scenario.raw_query,
        ),
        baseline=BaselinePayload(
            power_demand_kw=round(eng["baseline_demand_kw"], 2),
            available_capacity_kw=round(eng["baseline_available_cap_kw"], 2),
            fuel_burn_rate_lph=round(baseline_fuel_burn, 2),
            indoor_temp_c=round(station_state["indoor_temp_celsius"], 2),
            battery_soc_pct=round(station_state["battery_soc_pct"], 2),
            active_generators=station_state.get("active_generators", ["G1", "G2"]),
        ),
        prediction=PredictionPayload(
            power_demand_kw=round(eng["projected_demand_kw"], 2),
            available_capacity_kw=round(eng["projected_available_cap_kw"], 2),
            deficit_kw=round(eng["power_deficit_kw"], 2),
            projected_fuel_burn_lph=round(projected_fuel_burn, 2),
            fuel_saved_liters=round(fuel_saved_total, 2),
            projected_temp_c=round(thermal_info["final_indoor_temp"], 2),
            projected_battery_soc_pct=round(battery_info["final_soc_pct"], 2),
            active_generators=active_gens,
            trajectory=ml_trajectory,
        ),
        impact=ImpactPayload(
            fuelSaved=round(fuel_saved_total, 2),
            fuelBurnChange=round(fuel_burn_delta, 2),
            currentConsumption=round(baseline_fuel_burn, 2),
            projectedConsumption=round(projected_fuel_burn, 2),
            currentLoad=round(eng["baseline_demand_kw"], 2),
            projectedLoad=round(eng["projected_demand_kw"], 2),
            backupLoad=round(eng["projected_demand_kw"], 2),
            riskLevel=risk_eval["overall_risk"],
            riskScore=risk_eval["risk_score"],
            recommendation=risk_eval["recommended_action"],
            recommendationText=recommendation_text,
            systemsAffected=impact_dict.get("systemsAffected", []),
        ),
        risk=RiskPayload(
            overall_risk=risk_eval["overall_risk"],
            risk_score=risk_eval["risk_score"],
            factors=risk_eval["factors"],
            reasons=risk_eval["reasons"],
            recommended_action=risk_eval["recommended_action"],
        ),
        recommendation=recommendation_text,
        explanation=explanation_text,
        chartData=ml_trajectory,
        aiResponse=ai_narrative,
        provider_used=parse_result.provider_used,
        error=None,
    )

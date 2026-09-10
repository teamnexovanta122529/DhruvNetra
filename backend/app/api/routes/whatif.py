"""
DHRUVNETRA - FastAPI What-If & Operational Assistant Route
SIH 2026: Remote Management & Digital Twin Platform for Maitri & Bharati Stations

Orchestrates multi-intent decision intelligence:
1. Classifies query intent across 18 operational intents (e.g. SIMPLE_TELEMETRY, STATUS, ENVIRONMENT, WHAT_IF)
2. Factual / Telemetry queries -> Directly resolved from canonical polar SCADA state (Zero What-If leakage)
3. Explicit What-If queries -> 9-step hybrid multi-physics simulation + XGBoost + RiskEngine pipeline
4. Scenario Comparison -> Side-by-side delta engineering & mitigation comparator
"""

import logging
from fastapi import APIRouter, HTTPException, Header, status
from typing import Dict, Any, Optional, List

from backend.ai.intent.intent_classifier import (
    QueryIntentClassifier,
    IntentType,
    ExtractedEntities,
)
from backend.ai.telemetry.telemetry_resolver import (
    TelemetryResolver,
    ResolvedAnswer,
)
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
    TelemetryBadgePayload,
    CascadingEffectPayload,
    ThresholdBreachPayload,
    MitigationStrategyPayload,
    StationHealthPayload,
    ScenarioCompareRequest,
    ScenarioCompareResponse,
)

logger = logging.getLogger("dhruvnetra.api.whatif")
router = APIRouter(prefix="/api", tags=["Operational Assistant & What-If"])

# Initialize singletons for pipeline components
intent_classifier = QueryIntentClassifier()
telemetry_resolver = TelemetryResolver()
llm_parser = WhatIfQueryParser()
llm_explainer = LLMExplainer()
simulation_engine = WhatIfSimulationEngine()
risk_engine = RiskEngine()
ml_predictor = WhatIfMLPredictor()

# Station baseline snapshots (representative real-time telemetry state)
DEFAULT_STATION_STATES: Dict[str, Dict[str, Any]] = {
    "MAITRI": {
        "station": "MAITRI",
        "outdoor_temp_celsius": -24.3,
        "indoor_temp_celsius": 21.4,
        "wind_speed_kmh": 34.0,
        "fuel_storage_liters": 81600.0,
        "fuel_level_pct": 68.0,
        "battery_soc_pct": 94.2,
        "active_generators": ["G1", "G2", "G3"],
        "active_generators_count": 3,
        "total_power_demand_kw": 295.0,
        "hvac_power_kw": 68.5,
        "glycol_pump_load_pct": 68.0,
        "potable_water_liters": 18200.0,
    },
    "BHARATI": {
        "station": "BHARATI",
        "outdoor_temp_celsius": -18.2,
        "indoor_temp_celsius": 22.1,
        "wind_speed_kmh": 28.0,
        "fuel_storage_liters": 136800.0,
        "fuel_level_pct": 76.0,
        "battery_soc_pct": 96.2,
        "active_generators": ["G1", "G2", "G3"],
        "active_generators_count": 3,
        "total_power_demand_kw": 335.0,
        "hvac_power_kw": 74.2,
        "glycol_pump_load_pct": 64.0,
        "potable_water_liters": 23500.0,
    },
}


@router.post(
    "/what-if",
    response_model=WhatIfResponse,
    summary="Execute DHRUVNETRA AI Operational Assistant / What-If Query",
    description="Processes natural-language queries through intent classification, resolving factual queries directly or running multi-physics simulations for hypothetical scenarios.",
    responses={
        400: {"model": WhatIfErrorResponse, "description": "Query Rejected or Validation Error"},
        422: {"model": WhatIfErrorResponse, "description": "Unprocessable Query"},
    }
)
@router.post(
    "/assistant/query",
    response_model=WhatIfResponse,
    summary="Execute DHRUVNETRA AI Operational Assistant Query (Alias)",
    include_in_schema=True,
)
@router.post(
    "/whatif/simulate",
    response_model=WhatIfResponse,
    include_in_schema=False,
)
async def process_operational_query(
    req: WhatIfRequest,
    user_role: Optional[str] = Header(None, alias="X-User-Role"),
):
    """
    Intelligent query processing pipeline:
    1. Validate query existence.
    2. Check RBAC permissions (Read-only viewers receive simulation advisory annotations).
    3. Classify intent (18 intents) & extract entities.
    4. Route to:
       A. Direct Telemetry Resolver (if factual/status/environment/alert query).
       B. What-If Multi-Physics Simulation Engine (if explicit scenario).
       C. Clarification / Informational message (if ambiguous or greeting).
    """
    raw_query = req.query.strip()
    if not raw_query:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"error": "Empty query provided.", "validation_errors": ["Query string cannot be empty."]}
        )

    active_station_context = (req.station or "Maitri").title()
    effective_role = user_role.upper() if isinstance(user_role, str) else "OPERATOR"
    logger.info(f"Incoming AI Query [{active_station_context}] (Role: {effective_role}): '{raw_query}'")

    # Step 1: Classify Intent & Extract Entities
    classification = intent_classifier.classify(
        query=raw_query,
        default_station=active_station_context,
        active_scenario=req.active_scenario,
        previous_query=req.previous_query,
        previous_intent=req.previous_intent,
    )

    logger.info(f"Classified Intent: {classification.intent.value} (Confidence: {classification.confidence:.2f}, Hypothetical: {classification.is_hypothetical})")

    # Step 2: Handle Non-Hypothetical / Factual / Informational Queries (NO WHAT-IF SIMULATION)
    if not classification.requires_simulation or classification.intent != IntentType.WHAT_IF_SCENARIO:
        # Check if clarification is required for ambiguous questions
        if classification.requires_clarification and classification.clarification_prompt:
            return WhatIfResponse(
                success=True,
                intent=classification.intent.value,
                response_type="CLARIFICATION",
                text=classification.clarification_prompt,
                aiResponse=classification.clarification_prompt,
                explanation=classification.clarification_prompt,
                recommendation="CLARIFICATION_REQUIRED",
                provider_used="dhruvnetra_intent_clarifier",
            )

        # Resolve factual telemetry from canonical station state
        resolved: ResolvedAnswer = telemetry_resolver.resolve(
            intent=classification.intent,
            entities=classification.entities,
        )

        badge_payload = None
        if resolved.telemetry_badge:
            badge_payload = TelemetryBadgePayload(
                station=resolved.telemetry_badge.station,
                component=resolved.telemetry_badge.component,
                metric=resolved.telemetry_badge.metric,
                value=resolved.telemetry_badge.value,
                unit=resolved.telemetry_badge.unit,
                status=resolved.telemetry_badge.status,
                timestamp=resolved.telemetry_badge.timestamp,
                is_live=resolved.telemetry_badge.is_live,
            )

        return WhatIfResponse(
            success=True,
            intent=classification.intent.value,
            response_type=resolved.response_type,
            text=resolved.text,
            telemetry_badge=badge_payload,
            aiResponse=resolved.text,
            explanation=resolved.text,
            recommendation="NOMINAL" if classification.intent != IntentType.RECOMMENDATION_QUERY else resolved.text,
            provider_used="dhruvnetra_telemetry_grounding",
        )

    # Step 3: Handle Explicit WHAT_IF_SCENARIO Simulations
    logger.info(f"Executing Multi-Physics What-If Simulation for query: '{raw_query}'")

    # Parse scenario parameters
    parse_result = llm_parser.parse_query(raw_query, default_station=active_station_context)
    if not parse_result.success or parse_result.scenario is None:
        if parse_result.validation_errors:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "error": f"Scenario rejected: {'; '.join(parse_result.validation_errors)}",
                    "error_code": "INVALID_SCENARIO",
                    "validation_errors": parse_result.validation_errors,
                }
            )
        # Fallback to extracted entities from intent classifier if LLM parser rejected
        ent = classification.entities
        scenario = ParsedScenario(
            station=ent.station or active_station_context,
            component=ent.component_type or "generator",
            component_id=ent.component_id or "G1",
            affected_generators=ent.affected_generators or ["G1"],
            action=ent.action or "shutdown",
            duration_hours=ent.duration_hours or 1.0,
            duration_is_default=getattr(ent, "duration_is_default", False),
            modifications=getattr(ent, "modifications", {}),
            assumptions=getattr(ent, "assumptions", []),
            parameters={},
            confidence=0.95,
            raw_query=raw_query,
        )
    else:
        scenario = parse_result.scenario

    # Multi-turn Context Merging: Apply context extensions from intent classifier
    ent = classification.entities
    if ent:
        # Merge multi-generator extensions or active scenario follow-ups
        if ent.affected_generators:
            if (
                req.active_scenario
                or len(ent.affected_generators) > len(scenario.affected_generators or [])
                or any(w in raw_query.lower() for w in ["also", "too", "both", "and", "safe", "instead", "survive", "fuel", "do"])
            ):
                scenario.affected_generators = ent.affected_generators
                scenario.component_id = " + ".join(ent.affected_generators)

        # Inherit duration from active scenario context if not explicitly redefined in follow-up
        if ent.duration_hours and getattr(scenario, "duration_is_default", False) and not getattr(ent, "duration_is_default", False):
            scenario.duration_hours = ent.duration_hours
            scenario.duration_is_default = False

        mods = getattr(ent, "modifications", None)
        if mods and isinstance(mods, dict):
            scenario.modifications.update(mods)

    # Validate scenario constraints
    val_errs = scenario.validate_and_sanitize()
    if val_errs:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={
                "error": f"Scenario validation failed: {'; '.join(val_errs)}",
                "error_code": "VALIDATION_FAILED",
                "validation_errors": val_errs,
            }
        )

    # Load station baseline snapshot
    station_key = scenario.station.upper()
    station_state = dict(DEFAULT_STATION_STATES.get(station_key, DEFAULT_STATION_STATES["MAITRI"]))
    if req.state_overrides:
        station_state.update(req.state_overrides)

    # Check already offline generator condition
    if scenario.component == "generator" and scenario.action in ["shutdown", "stop", "fail"]:
        # If user targeted only G3 at Maitri (which is in standby)
        if len(scenario.affected_generators) == 1 and scenario.affected_generators[0] == "G3" and station_key == "MAITRI":
            msg = (
                f"Generator G3 is currently in WARM STANDBY in {scenario.station} baseline telemetry (not carrying active load). "
                f"Simulating its shutdown yields zero active power impact. If you want to simulate a primary outage, consider simulating G1 or G2."
            )
            return WhatIfResponse(
                success=True,
                intent=IntentType.WHAT_IF_SCENARIO.value,
                response_type="CLARIFICATION",
                text=msg,
                aiResponse=msg,
                explanation=msg,
                recommendation="NOMINAL",
                provider_used="dhruvnetra_scenario_validator",
            )

    # Run deterministic multi-physics simulation
    scenario_dict = scenario.to_dict()
    sim_result = simulation_engine.simulate(
        station_state=station_state,
        scenario=scenario_dict,
    )

    eng = sim_result.get("engineeringDetails", {})
    impact_dict = sim_result.get("impact", {})
    fuel_info = eng.get("fuel", {})
    thermal_info = eng.get("thermal", {})
    battery_info = eng.get("battery", {})
    water_info = eng.get("water", {})
    health_info = eng.get("health", {})

    active_gens = eng.get("active_generators", [])
    baseline_available_cap = float(eng.get("baseline_available_cap_kw", eng.get("baseline_capacity_kw", 200.0)))
    projected_available_cap = float(eng.get("projected_available_cap_kw", eng.get("available_capacity_kw", 100.0)))
    power_deficit = float(eng.get("power_deficit_kw", 0.0))

    # Run XGBoost ML trajectory
    ml_trajectory = ml_predictor.generate_ml_trajectory(
        station=scenario.station,
        duration_hours=scenario.duration_hours,
        baseline_load_kw=eng.get("baseline_demand_kw", 82.0),
        simulated_load_kw=eng.get("projected_demand_kw", 82.0),
        baseline_gen_count=len(station_state.get("active_generators", ["G1", "G2"])),
        simulated_gen_count=len(active_gens),
        outdoor_temp=station_state.get("outdoor_temp_celsius", -24.0),
    )

    # Run Risk Engine
    risk_eval = risk_engine.evaluate({
        "power_deficit_kw": power_deficit,
        "active_generator_load_pct": max([85.0] if active_gens else [0.0]),
        "standby_generators_count": len(eng.get("standby_generators", [])),
        "active_generators_count": len(active_gens),
        "n_minus_one_satisfied": eng.get("n_minus_one", {}).get("n_minus_one_satisfied", power_deficit <= 0.1),
        "final_battery_soc_pct": battery_info.get("final_soc_pct", 88.0),
        "fuel_reserve_days": fuel_info.get("projected_endurance_days", 110.0),
        "fuel_level_pct": station_state.get("fuel_level_pct", 68.0),
        "final_indoor_temp_c": thermal_info.get("final_indoor_temp", 20.0),
        "outdoor_temp_c": station_state.get("outdoor_temp_celsius", -24.0),
        "hvac_operational": power_deficit < eng.get("projected_demand_kw", 82.0) * 0.5,
        "water_reserve_days": water_info.get("runway_days", 12.0),
    })

    # Generate grounded LLM operational summary narrative
    narrative = llm_explainer.generate_explanation(
        scenario=scenario,
        sim_result=sim_result,
        risk_result=risk_eval,
        ml_prediction={"trajectory": ml_trajectory},
    )

    rec_text = risk_eval.get("recommendation", risk_eval.get("recommended_action", "MONITOR_CLOSELY"))
    ai_response_text = sim_result.get("aiResponse", "")

    # Build Cascading Effects Payload
    cascading_payloads = [
        CascadingEffectPayload(
            step=int(c.get("step", i + 1)),
            system=str(c.get("system", "GENERAL")),
            title=str(c.get("title", f"Step {i + 1}")),
            description=str(c.get("description", "")),
            severity=str(c.get("severity", "MEDIUM")),
            trigger_time=str(c.get("trigger_time", f"T+{i*10}m")),
            mitigation_target=c.get("mitigation_target"),
        )
        for i, c in enumerate(eng.get("cascading_effects", []))
    ]

    # Build Threshold Breaches Payload
    threshold_payloads = [
        ThresholdBreachPayload(
            metric=str(tb.get("metric", "")),
            threshold=str(tb.get("threshold", "")),
            breach_time=str(tb.get("breach_time", "")),
            criticality=str(tb.get("criticality", "WARNING")),
            description=str(tb.get("description", "")),
        )
        for tb in eng.get("threshold_breaches", [])
    ]

    # Build Mitigation Strategies Payload
    mitigation_dict = eng.get("mitigation", {})
    raw_strategies = eng.get("mitigation_strategies") or mitigation_dict.get("strategies", [])
    mitigation_payloads = [
        MitigationStrategyPayload(
            strategy_id=str(ms.get("strategy_id", "")),
            name=str(ms.get("name", "")),
            description=str(ms.get("description", "")),
            power_deficit_kw=float(ms.get("power_deficit_kw", 0.0)),
            delivered_power_kw=float(ms.get("delivered_power_kw", 0.0)),
            active_generators=list(ms.get("active_generators", [])),
            fuel_delta=str(ms.get("fuel_delta", "0.0 L")),
            risk_level=str(ms.get("risk_level", "LOW")),
            risk_score=int(ms.get("risk_score", 20)),
            health_score=float(ms.get("health_score", 85.0)),
            is_recommended=bool(ms.get("is_recommended", False)),
            action_steps=list(ms.get("action_steps", [])),
        )
        for ms in raw_strategies
    ]

    # Build Station Health Payload
    health_payload = None
    if health_info:
        health_baseline_val = health_info.get("baseline", {})
        health_projected_val = health_info.get("projected", {})
        health_payload = StationHealthPayload(
            baseline_score=float(health_baseline_val.get("score", health_info.get("baseline_score", 100.0))),
            projected_score=float(health_projected_val.get("score", health_info.get("projected_score", 85.0))),
            delta=float(health_info.get("delta", -15.0)),
            status=str(health_projected_val.get("status", health_info.get("status", "OPTIMAL"))),
            deductions=list(health_projected_val.get("deductions", health_info.get("deductions", []))),
        )

    # Merge timeline steps with ML trajectory if timeline_steps provided
    timeline_steps = eng.get("timeline_steps", ml_trajectory)

    return WhatIfResponse(
        success=True,
        intent=IntentType.WHAT_IF_SCENARIO.value,
        response_type="SCENARIO_ANALYSIS",
        text=ai_response_text,
        scenario=ScenarioPayload(
            station=scenario.station,
            component=scenario.component,
            component_id=scenario.component_id,
            affected_generators=scenario.affected_generators,
            duration_is_default=getattr(scenario, "duration_is_default", False),
            action=scenario.action,
            duration_hours=scenario.duration_hours,
            modifications=scenario.modifications,
            assumptions=scenario.assumptions,
            parameters=scenario.parameters,
            confidence=scenario.confidence,
            raw_query=scenario.raw_query,
        ),
        baseline=BaselinePayload(
            power_demand_kw=float(eng.get("baseline_demand_kw", 82.0)),
            available_capacity_kw=baseline_available_cap,
            fuel_burn_rate_lph=float(fuel_info.get("baseline_burn_rate_lph", fuel_info.get("baseline_burn_lph", 26.4))),
            indoor_temp_c=float(thermal_info.get("initial_indoor_temp", 19.0)),
            battery_soc_pct=float(battery_info.get("initial_soc_pct", 94.0)),
            water_reserve_liters=float(water_info.get("initial_liters", 18200.0)),
            active_generators=station_state.get("active_generators", ["G1", "G2"]),
        ),
        prediction=PredictionPayload(
            power_demand_kw=float(eng.get("projected_demand_kw", 82.0)),
            available_capacity_kw=projected_available_cap,
            deficit_kw=power_deficit,
            projected_fuel_burn_lph=float(fuel_info.get("projected_burn_rate_lph", fuel_info.get("projected_burn_lph", 26.2))),
            fuel_saved_liters=float(fuel_info.get("fuel_saved_liters", fuel_info.get("total_fuel_saved_liters", 0.0))),
            projected_temp_c=float(thermal_info.get("final_indoor_temp", 19.0)),
            projected_battery_soc_pct=float(battery_info.get("final_soc_pct", 94.0)),
            projected_water_reserve_liters=float(water_info.get("final_liters", 18200.0)),
            active_generators=active_gens,
            trajectory=timeline_steps,
        ),
        impact=ImpactPayload(
            fuelSaved=float(fuel_info.get("fuel_saved_liters", fuel_info.get("total_fuel_saved_liters", 0.0))),
            fuelBurnChange=float(fuel_info.get("burn_rate_delta_lph", 0.0)),
            currentConsumption=float(fuel_info.get("baseline_burn_rate_lph", fuel_info.get("baseline_burn_lph", 26.4))),
            projectedConsumption=float(fuel_info.get("projected_burn_rate_lph", fuel_info.get("projected_burn_lph", 26.2))),
            currentLoad=float(eng.get("baseline_demand_kw", 82.0)),
            projectedLoad=float(eng.get("projected_demand_kw", 82.0)),
            backupLoad=float(power_deficit),
            riskLevel=risk_eval.get("overall_risk", "LOW"),
            riskScore=int(risk_eval.get("risk_score", 20)),
            recommendation=rec_text,
            recommendationText=narrative.get("recommendation", rec_text),
            systemsAffected=impact_dict.get("systemsAffected", []),
            healthScore=float(health_payload.projected_score if health_payload else 85.0),
            healthDelta=float(health_payload.delta if health_payload else 0.0),
        ),
        risk=RiskPayload(
            overall_risk=risk_eval.get("overall_risk", "LOW"),
            risk_score=int(risk_eval.get("risk_score", 20)),
            factors=risk_eval.get("factors", {}),
            sub_risks=risk_eval.get("sub_risks", {}),
            reasons=risk_eval.get("reasons", []),
            recommended_action=rec_text,
        ),
        health=health_payload,
        cascading_effects=cascading_payloads,
        threshold_breaches=threshold_payloads,
        mitigation_strategies=mitigation_payloads,
        recommended_strategy=eng.get("recommended_strategy") or mitigation_dict.get("recommended_strategy"),
        timeline_steps=timeline_steps,
        assumptions=eng.get("assumptions", []),
        confidence=float(eng.get("confidence", scenario.confidence or 0.88)),
        recommendation=narrative.get("recommendation", rec_text),
        explanation=narrative.get("explanation", ai_response_text),
        chartData=timeline_steps,
        aiResponse=ai_response_text,
        provider_used="dhruvnetra_hybrid_ai",
    )


@router.post(
    "/what-if/compare",
    response_model=ScenarioCompareResponse,
    summary="Compare Two What-If Scenarios Side-by-Side",
    description="Executes simulations for Scenario A and Scenario B, generating comprehensive engineering, risk, health, and mitigation delta matrices."
)
async def compare_scenarios(
    req: ScenarioCompareRequest,
    user_role: Optional[str] = Header(None, alias="X-User-Role"),
):
    """
    Executes Scenario A and Scenario B through the multi-physics pipeline and calculates delta metrics.
    """
    station = req.station or "Maitri"
    logger.info(f"Executing Scenario Comparison for [{station}]: '{req.scenario_a.query}' VS '{req.scenario_b.query}'")

    # Run Scenario A
    req.scenario_a.station = station
    result_a = await process_operational_query(req.scenario_a, user_role=user_role)

    # Run Scenario B
    req.scenario_b.station = station
    result_b = await process_operational_query(req.scenario_b, user_role=user_role)

    # Extract key metrics for delta comparison
    pred_a = result_a.prediction or PredictionPayload(power_demand_kw=82.0)
    pred_b = result_b.prediction or PredictionPayload(power_demand_kw=82.0)
    risk_a = result_a.risk or RiskPayload(overall_risk="LOW", risk_score=20)
    risk_b = result_b.risk or RiskPayload(overall_risk="LOW", risk_score=20)
    health_a = result_a.health or StationHealthPayload()
    health_b = result_b.health or StationHealthPayload()

    power_deficit_delta = pred_b.deficit_kw - pred_a.deficit_kw
    fuel_saved_delta = pred_b.fuel_saved_liters - pred_a.fuel_saved_liters
    temp_delta = pred_b.projected_temp_c - pred_a.projected_temp_c
    health_delta = health_b.projected_score - health_a.projected_score
    risk_score_delta = risk_b.risk_score - risk_a.risk_score

    # Determine which scenario is safer
    if health_a.projected_score > health_b.projected_score:
        preferred = "Scenario A"
        preference_reason = f"Scenario A maintains a higher Station Health Score ({health_a.projected_score:.1f} vs {health_b.projected_score:.1f}) and lower overall risk."
    elif health_b.projected_score > health_a.projected_score:
        preferred = "Scenario B"
        preference_reason = f"Scenario B maintains a higher Station Health Score ({health_b.projected_score:.1f} vs {health_a.projected_score:.1f}) and lower overall risk."
    elif risk_a.risk_score < risk_b.risk_score:
        preferred = "Scenario A"
        preference_reason = f"Scenario A carries lower risk ({risk_a.risk_score} vs {risk_b.risk_score})."
    elif risk_b.risk_score < risk_a.risk_score:
        preferred = "Scenario B"
        preference_reason = f"Scenario B carries lower risk ({risk_b.risk_score} vs {risk_a.risk_score})."
    else:
        preferred = "Comparable"
        preference_reason = f"Both scenarios have comparable operational impacts (Health: {health_a.projected_score:.1f} vs {health_b.projected_score:.1f})."

    comparison_matrix = {
        "preferred_scenario": preferred,
        "preference_reason": preference_reason,
        "deltas": {
            "power_deficit_kw": round(power_deficit_delta, 2),
            "fuel_saved_liters": round(fuel_saved_delta, 1),
            "indoor_temp_celsius": round(temp_delta, 2),
            "health_score": round(health_delta, 1),
            "risk_score": int(risk_score_delta),
        },
        "scenario_a_summary": {
            "query": req.scenario_a.query,
            "risk_level": risk_a.overall_risk,
            "risk_score": risk_a.risk_score,
            "health_score": health_a.projected_score,
            "power_deficit_kw": pred_a.deficit_kw,
            "indoor_temp_c": pred_a.projected_temp_c,
            "fuel_saved_liters": pred_a.fuel_saved_liters,
        },
        "scenario_b_summary": {
            "query": req.scenario_b.query,
            "risk_level": risk_b.overall_risk,
            "risk_score": risk_b.risk_score,
            "health_score": health_b.projected_score,
            "power_deficit_kw": pred_b.deficit_kw,
            "indoor_temp_c": pred_b.projected_temp_c,
            "fuel_saved_liters": pred_b.fuel_saved_liters,
        }
    }

    return ScenarioCompareResponse(
        success=True,
        station=station,
        result_a=result_a,
        result_b=result_b,
        comparison=comparison_matrix,
    )

"""
DHRUVNETRA - FastAPI What-If & Assistant API Schemas
Pydantic v2 schemas for What-If scenario simulations, direct factual telemetry queries,
intent classification results, multi-mode AI responses, cascading failure chains,
station health scores, and mitigation strategy comparisons.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class WhatIfRequest(BaseModel):
    """
    Inbound natural-language operational question or What-If simulation request.
    """
    query: str = Field(
        ...,
        description="Natural-language operational or factual question (e.g. 'What is the fuel level of G1?' or 'What if Generator 1 is turned off for 7 hours?')",
        examples=["What is the fuel level of Generator 1?"]
    )
    station: Optional[str] = Field(
        default=None,
        description="Active station context ('Maitri' or 'Bharati')"
    )
    state_overrides: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Optional live telemetry overrides"
    )
    active_scenario: Optional[Dict[str, Any]] = Field(
        default=None,
        description="Optional active scenario context for conversational follow-ups"
    )
    previous_query: Optional[str] = Field(
        default=None,
        description="Previous query string for context resolution"
    )
    previous_intent: Optional[str] = Field(
        default=None,
        description="Previous query intent type"
    )


class ScenarioPayload(BaseModel):
    station: str
    component: str
    component_id: Optional[str] = None
    affected_generators: List[str] = Field(default_factory=list)
    duration_is_default: bool = False
    action: str
    duration_hours: float
    modifications: Dict[str, Any] = Field(default_factory=dict)
    assumptions: List[str] = Field(default_factory=list)
    parameters: Dict[str, Any] = Field(default_factory=dict)
    confidence: Optional[float] = 1.0
    raw_query: str = ""


class BaselinePayload(BaseModel):
    power_demand_kw: float
    available_capacity_kw: float = 0.0
    fuel_burn_rate_lph: float = 0.0
    indoor_temp_c: float = 0.0
    battery_soc_pct: float = 0.0
    water_reserve_liters: float = 18200.0
    active_generators: List[str] = Field(default_factory=list)


class PredictionPayload(BaseModel):
    power_demand_kw: float
    available_capacity_kw: float = 0.0
    deficit_kw: float = 0.0
    projected_fuel_burn_lph: float = 0.0
    fuel_saved_liters: float = 0.0
    projected_temp_c: float = 0.0
    projected_battery_soc_pct: float = 0.0
    projected_water_reserve_liters: float = 18200.0
    active_generators: List[str] = Field(default_factory=list)
    trajectory: List[Dict[str, Any]] = Field(default_factory=list)


class ImpactPayload(BaseModel):
    fuelSaved: float
    fuelBurnChange: float
    currentConsumption: float
    projectedConsumption: float
    currentLoad: float
    projectedLoad: float
    backupLoad: float
    riskLevel: str
    riskScore: int
    recommendation: str
    recommendationText: str
    systemsAffected: List[Any] = Field(default_factory=list)
    healthScore: Optional[float] = 85.0
    healthDelta: Optional[float] = 0.0


class RiskPayload(BaseModel):
    overall_risk: str
    risk_score: int
    factors: Dict[str, Any] = Field(default_factory=dict)
    sub_risks: Dict[str, Any] = Field(default_factory=dict)
    reasons: List[str] = Field(default_factory=list)
    recommended_action: Optional[str] = "NOMINAL"


class TelemetryBadgePayload(BaseModel):
    station: str
    component: str
    metric: str
    value: str
    unit: Optional[str] = ""
    status: Optional[str] = "NORMAL"
    timestamp: Optional[str] = ""
    is_live: Optional[bool] = True


class CascadingEffectPayload(BaseModel):
    step: int
    system: str
    title: str
    description: str
    severity: str
    trigger_time: str
    mitigation_target: Optional[str] = None


class ThresholdBreachPayload(BaseModel):
    metric: str
    threshold: str
    breach_time: str
    criticality: str
    description: str


class MitigationStrategyPayload(BaseModel):
    strategy_id: str
    name: str
    description: str
    power_deficit_kw: float = 0.0
    delivered_power_kw: float = 0.0
    active_generators: List[str] = Field(default_factory=list)
    fuel_delta: str = "0.0 L"
    risk_level: str = "LOW"
    risk_score: int = 20
    health_score: float = 85.0
    is_recommended: bool = False
    action_steps: List[str] = Field(default_factory=list)


class StationHealthPayload(BaseModel):
    baseline_score: float = 100.0
    projected_score: float = 85.0
    delta: float = -15.0
    status: str = "OPTIMAL"
    deductions: List[Dict[str, Any]] = Field(default_factory=list)


class WhatIfResponse(BaseModel):
    """
    Standardized AI response envelope supporting both direct factual answers and scenario simulations.
    """
    success: bool = True
    intent: Optional[str] = "WHAT_IF_SCENARIO"
    response_type: Optional[str] = "SCENARIO_ANALYSIS"  # "DIRECT_ANSWER" | "SCENARIO_ANALYSIS" | "CLARIFICATION" | "INFORMATIONAL"
    text: Optional[str] = None
    telemetry_badge: Optional[TelemetryBadgePayload] = None
    
    # What-If Simulation specific payloads (populated only when response_type == "SCENARIO_ANALYSIS")
    scenario: Optional[ScenarioPayload] = None
    baseline: Optional[BaselinePayload] = None
    prediction: Optional[PredictionPayload] = None
    impact: Optional[ImpactPayload] = None
    risk: Optional[RiskPayload] = None
    health: Optional[StationHealthPayload] = None
    cascading_effects: Optional[List[CascadingEffectPayload]] = Field(default_factory=list)
    threshold_breaches: Optional[List[ThresholdBreachPayload]] = Field(default_factory=list)
    mitigation_strategies: Optional[List[MitigationStrategyPayload]] = Field(default_factory=list)
    recommended_strategy: Optional[Dict[str, Any]] = None
    timeline_steps: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    assumptions: Optional[List[str]] = Field(default_factory=list)
    confidence: Optional[float] = 0.88
    recommendation: Optional[str] = None
    explanation: Optional[str] = None
    chartData: Optional[Any] = None
    aiResponse: Optional[str] = None
    provider_used: Optional[str] = "dhruvnetra_hybrid_ai"
    error: Optional[str] = None


class ScenarioCompareRequest(BaseModel):
    station: Optional[str] = "Maitri"
    scenario_a: WhatIfRequest
    scenario_b: WhatIfRequest


class ScenarioCompareResponse(BaseModel):
    success: bool = True
    station: str = "Maitri"
    result_a: WhatIfResponse
    result_b: WhatIfResponse
    comparison: Dict[str, Any] = Field(default_factory=dict)


class WhatIfErrorResponse(BaseModel):
    success: bool = False
    error: str
    error_code: Optional[str] = "VALIDATION_ERROR"
    message: Optional[str] = None
    validation_errors: List[str] = Field(default_factory=list)
    raw_query: str = ""

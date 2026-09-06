"""
DHRUVNETRA - FastAPI What-If API Schemas
Pydantic v2 schemas for the What-If analysis request and response contracts.
"""

from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field


class WhatIfRequest(BaseModel):
    """
    Inbound natural-language What-If query request.
    """
    query: str = Field(
        ...,
        description="Natural-language operational question (e.g., 'What if Generator 1 at Maitri is turned off for 7 hours?')",
        examples=["What if Generator 1 at Maitri is turned off for 7 hours?"]
    )
    station: Optional[str] = Field(
        default=None,
        description="Optional station context override ('Maitri' or 'Bharati')"
    )
    state_overrides: Optional[Dict[str, Any]] = Field(
        default_factory=dict,
        description="Optional live telemetry overrides (outdoor_temp, wind_speed, initial_fuel, etc.)"
    )


class ScenarioPayload(BaseModel):
    station: str
    component: str
    component_id: Optional[str] = None
    action: str
    duration_hours: float
    parameters: Dict[str, Any] = Field(default_factory=dict)
    confidence: Optional[float] = 1.0
    raw_query: str = ""


class BaselinePayload(BaseModel):
    power_demand_kw: float
    available_capacity_kw: float
    fuel_burn_rate_lph: float
    indoor_temp_c: float
    battery_soc_pct: float
    active_generators: List[str]


class PredictionPayload(BaseModel):
    power_demand_kw: float
    available_capacity_kw: float
    deficit_kw: float
    projected_fuel_burn_lph: float
    fuel_saved_liters: float
    projected_temp_c: float
    projected_battery_soc_pct: float
    active_generators: List[str]
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


class RiskPayload(BaseModel):
    overall_risk: str
    risk_score: int
    factors: Dict[str, Any] = Field(default_factory=dict)
    reasons: List[str] = Field(default_factory=list)
    recommended_action: str


class WhatIfResponse(BaseModel):
    """
    Standardized What-If simulation response envelope.
    Compatible with frontend digital twin dashboard and AI analytics.
    """
    success: bool = True
    scenario: ScenarioPayload
    baseline: BaselinePayload
    prediction: PredictionPayload
    impact: ImpactPayload
    risk: RiskPayload
    recommendation: str
    explanation: str
    chartData: List[Dict[str, Any]] = Field(default_factory=list)
    aiResponse: str
    provider_used: Optional[str] = "heuristic_fallback"
    error: Optional[str] = None


class WhatIfErrorResponse(BaseModel):
    success: bool = False
    error: str
    validation_errors: List[str] = Field(default_factory=list)
    raw_query: str = ""

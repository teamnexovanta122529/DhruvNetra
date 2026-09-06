/**
 * DHRUVNETRA - What-If Analysis API Client Service
 * Connects frontend to the FastAPI backend POST /api/what-if endpoint.
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

/**
 * Execute natural-language What-If scenario simulation via backend API.
 * 
 * @param {string} query - Natural language query (e.g. "What if Generator 1 is turned off for 7 hours?")
 * @param {string} station - Active station ("Maitri" or "Bharati")
 * @param {object} stateOverrides - Optional live sensor telemetry overrides
 * @returns {Promise<object>} Formatted scenario impact data for dashboard rendering
 */
export async function simulateWhatIfQuery(query, station = "Maitri", stateOverrides = {}) {
  const cleanQuery = query?.trim();
  if (!cleanQuery) {
    throw new Error("Query string cannot be empty.");
  }

  const payload = {
    query: cleanQuery,
    station: station,
    state_overrides: stateOverrides || {},
  };

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 18000); // 18s timeout

  let response;
  try {
    // Try primary backend URL or relative proxy
    try {
      response = await fetch(`${API_BASE_URL}/api/what-if`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (directErr) {
      // Fallback to relative /api/what-if proxy if direct URL fails
      response = await fetch("/api/what-if", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    }
  } catch (netErr) {
    clearTimeout(timeoutId);
    if (netErr.name === "AbortError") {
      throw new Error("Simulation request timed out. The backend server took too long to respond.");
    }
    throw new Error(`Unable to connect to DHRUVNETRA AI Backend: ${netErr.message}. Ensure FastAPI backend is running on port 8000.`);
  } finally {
    clearTimeout(timeoutId);
  }

  const resData = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg = resData?.detail?.error || resData?.error || `API returned status ${response.status}: ${response.statusText}`;
    const validationErrors = resData?.detail?.validation_errors || resData?.validation_errors || [];
    const fullError = validationErrors.length > 0 
      ? `${errorMsg} (${validationErrors.join("; ")})`
      : errorMsg;
    throw new Error(fullError);
  }

  if (!resData || !resData.success) {
    throw new Error(resData?.error || "Invalid response envelope received from simulation engine.");
  }

  return formatBackendResponse(resData, cleanQuery);
}

/**
 * Transforms backend WhatIfResponse into the component's state format.
 */
function formatBackendResponse(data, originalQuery) {
  const { scenario, baseline, prediction, impact, risk, recommendation, explanation, aiResponse, chartData } = data;

  // Build chart curves
  let chartLabels = [];
  let currentFuelCurve = [];
  let projectedFuelCurve = [];
  let currentPowerCurve = [];
  let projectedPowerCurve = [];

  if (Array.isArray(chartData) && chartData.length > 0) {
    chartLabels = chartData.map((d) => d.time || `+${d.hour}h`);
    currentFuelCurve = chartData.map((d) => d.currentFuelBurn ?? baseline.fuel_burn_rate_lph);
    projectedFuelCurve = chartData.map((d) => d.projectedFuelBurn ?? prediction.projected_fuel_burn_lph);
    currentPowerCurve = chartData.map((d) => d.currentLoad ?? baseline.power_demand_kw);
    projectedPowerCurve = chartData.map((d) => d.projectedLoad ?? prediction.power_demand_kw);
  } else {
    chartLabels = ["T-0", `T+${Math.round(scenario.duration_hours / 2)}h`, `T+${scenario.duration_hours}h`];
    currentFuelCurve = [baseline.fuel_burn_rate_lph, baseline.fuel_burn_rate_lph, baseline.fuel_burn_rate_lph];
    projectedFuelCurve = [baseline.fuel_burn_rate_lph, prediction.projected_fuel_burn_lph, prediction.projected_fuel_burn_lph];
    currentPowerCurve = [baseline.power_demand_kw, baseline.power_demand_kw, baseline.power_demand_kw];
    projectedPowerCurve = [baseline.power_demand_kw, prediction.power_demand_kw, prediction.power_demand_kw];
  }

  // Format systems affected
  const systemsAffected = (impact.systemsAffected && impact.systemsAffected.length > 0)
    ? impact.systemsAffected.map((s) => {
        if (typeof s === "string") return { name: s, status: "AFFECTED" };
        return { name: s.name || "Subsystem", status: s.status || s.impact || "ACTIVE" };
      })
    : [
        { name: `${scenario.component.toUpperCase()} ${scenario.component_id || ""}`.trim(), status: scenario.action.toUpperCase() },
        { name: "Main Life Support Microgrid Bus", status: prediction.deficit_kw > 0 ? "DEFICIT WARNING" : "NOMINAL (STABLE)" },
      ];

  const formattedFuelSaved = impact.fuelSaved >= 0 
    ? `${impact.fuelSaved.toFixed(1)} L`
    : `-${Math.abs(impact.fuelSaved).toFixed(1)} L (Extra Burn)`;

  const fuelChangeStr = `${impact.fuelBurnChange >= 0 ? "+" : ""}${impact.fuelBurnChange.toFixed(1)} L/h`;

  return {
    id: `sim-${Date.now().toString().slice(-4)}`,
    title: `${scenario.component.toUpperCase()} ${scenario.component_id || ""} ${scenario.action.toUpperCase()} (${scenario.duration_hours}h)`,
    category: scenario.component.toUpperCase(),
    query: originalQuery,
    scenario: scenario,
    baseline: baseline,
    prediction: prediction,
    risk: risk,
    recommendation: recommendation,
    explanation: explanation,
    aiResponse: aiResponse || explanation,
    impact: {
      fuelSaved: formattedFuelSaved,
      fuelBurnChange: fuelChangeStr,
      currentConsumption: `${baseline.fuel_burn_rate_lph.toFixed(1)} L/h`,
      projectedConsumption: `${prediction.projected_fuel_burn_lph.toFixed(1)} L/h`,
      currentLoad: `${baseline.power_demand_kw.toFixed(0)} kW`,
      projectedLoad: `${prediction.power_demand_kw.toFixed(0)} kW`,
      backupLoad: prediction.deficit_kw > 0 ? `DEFICIT: ${prediction.deficit_kw.toFixed(1)} kW` : "BESS & Microgrid Nominal",
      riskLevel: impact.riskLevel || risk.overall_risk || "LOW",
      riskScore: impact.riskScore ?? risk.risk_score ?? 20,
      recommendation: impact.recommendation || recommendation || "NOMINAL",
      recommendationText: impact.recommendationText || risk.reasons?.join(". ") || explanation,
      systemsAffected: systemsAffected,
      chartData: {
        labels: chartLabels,
        currentFuel: currentFuelCurve,
        projectedFuel: projectedFuelCurve,
        currentPower: currentPowerCurve,
        projectedPower: projectedPowerCurve,
      },
      // Detailed sub-system impact metrics
      powerDeficit: prediction.deficit_kw,
      indoorTemp: prediction.projected_temp_c,
      batterySoc: prediction.projected_battery_soc_pct,
      factors: risk.factors || {},
    },
  };
}

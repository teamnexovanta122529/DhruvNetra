import { useState } from "react";
import PageHeader from "../common/PageHeader";
import MetricCard from "../common/MetricCard";
import TemperatureChart from "../charts/TemperatureChart";
import { useStation } from "../../../context/StationContext";
import { getHvacData } from "../../../services/telemetryService";

export default function HVACSystems() {
  const { station, stationInfo } = useStation();
  const hvac = getHvacData(station);
  const { summary, zones, history24h } = hvac;

  const [selectedZone, setSelectedZone] = useState(zones[0]?.id || "ZONE-01");

  return (
    <div className="dashboard-page hvac-page">
      <PageHeader
        eyebrow={`DHRUVNETRA / CLIMATE & THERMAL CONTROL · ${stationInfo.coordinates || ""}`}
        title={`${station} HVAC & LIFE SUPPORT`}
        description={`MONITORING OF HABITAT THERMAL ENVELOPE, GLYCOL HEATING LOOPS, ZONE TEMPERATURES & AIR QUALITY (${stationInfo.location})`}
        status="THERMAL ENVELOPE STABLE"
      />

      {/* PRIMARY METRICS GRID */}
      <section className="metrics-grid">
        <MetricCard
          label="INDOOR AVERAGE TEMP"
          value={summary.indoorAvgTempC}
          unit="°C"
          status={summary.status}
          trend={`Outdoor: ${summary.outdoorTempC}°C (Δ ${(summary.indoorAvgTempC - summary.outdoorTempC).toFixed(1)}°C)`}
        />

        <MetricCard
          label="RELATIVE HUMIDITY"
          value={summary.indoorAvgHumidityPercent}
          unit="%"
          status="NORMAL"
          trend="Target: 40% - 50% Polar Optimal"
        />

        <MetricCard
          label="HVAC HEATING LOAD"
          value={summary.hvacTotalLoadKw}
          unit="kW"
          status="ACTIVE"
          trend={`${zones.length} ACTIVE THERMAL ZONES`}
        />

        <MetricCard
          label="GLYCOL LOOP SUPPLY"
          value={summary.glycolSupplyTempC}
          unit="°C"
          status="OPTIMAL"
          trend={`Return: ${summary.glycolReturnTempC}°C · ${summary.glycolFlowRateLpm} L/min`}
        />
      </section>

      {/* ZONE TEMPERATURE MONITORING GRID */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span>ENVIRONMENTAL ZONES</span>
            <h2>STATION HABITAT & LABORATORY ZONES</h2>
          </div>
          <span className="section-live">● SENSORS ACTIVE</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {zones.map((zone) => {
            const isSelected = selectedZone === zone.id;
            return (
              <div
                key={zone.id}
                onClick={() => setSelectedZone(zone.id)}
                style={{
                  background: isSelected
                    ? "linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)"
                    : "#ffffff",
                  border: `1px solid ${isSelected ? "#16a34a" : "var(--border-subtle, #e2e8f0)"}`,
                  borderRadius: "8px",
                  padding: "16px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: isSelected ? "0 4px 12px rgba(22, 163, 74, 0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", fontFamily: "var(--font-mono, monospace)", color: "#166534", fontWeight: 700 }}>
                    {zone.id}
                  </span>
                  <span
                    style={{
                      background: "#dcfce7",
                      color: "#166534",
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      border: "1px solid #bbf7d0",
                    }}
                  >
                    ● {zone.heatingState}
                  </span>
                </div>

                <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "var(--text-primary, #0f172a)", fontWeight: 600 }}>{zone.name}</h4>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                  <span style={{ fontSize: "24px", fontWeight: 800, color: "#16a34a" }}>
                    {zone.currentTempC > 0 ? `+${zone.currentTempC}` : zone.currentTempC}°C
                  </span>
                  <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "var(--font-mono, monospace)" }}>
                    Target: {zone.targetTempC}°C · {zone.humidityPercent}% RH
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "6px", fontSize: "10px", color: "#64748b", marginTop: "8px", fontFamily: "var(--font-mono, monospace)" }}>
                  <span>Air Flow: {zone.airFlowM3h} m³/h</span>
                  <span>Radiator: {zone.radiatorLoadKw} kW</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* LOWER GRID: 24-HR TEMPERATURE PROFILE GRAPH & GLYCOL LOOP STATUS */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px", marginTop: "24px" }}>
        {/* GRAPH */}
        <section className="dashboard-panel">
          <div className="panel-heading">
            <span>THERMAL PROFILE</span>
            <h2>24-HOUR INDOOR VS AMBIENT OUTDOOR TEMPERATURE</h2>
          </div>

          <TemperatureChart
            labels={history24h.timestamps}
            indoor={history24h.indoorTempC}
            outdoor={history24h.outdoorTempC}
          />
        </section>

        {/* GLYCOL LOOP & EFFICIENCY */}
        <section className="dashboard-panel">
          <div className="panel-heading">
            <span>HYDRONIC HEATING LOOP</span>
            <h2>PRIMARY GLYCOL & AIR EXCHANGE</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div style={{ background: "var(--bg-subtle, #f8fafc)", border: "1px solid var(--border-subtle, #e2e8f0)", borderRadius: "8px", padding: "14px" }}>
              <div style={{ fontSize: "11px", color: "var(--accent-primary, #0284c7)", fontFamily: "var(--font-mono, monospace)", fontWeight: 700, marginBottom: "8px" }}>
                CLOSED-LOOP GLYCOL HEAT EXCHANGER
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "12px", fontSize: "12px" }}>
                <div>
                  <span style={{ color: "#64748b", fontSize: "10px", display: "block" }}>SUPPLY TEMPERATURE</span>
                  <strong style={{ color: "#d97706", fontSize: "16px", fontFamily: "var(--font-mono, monospace)" }}>{summary.glycolSupplyTempC}°C</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontSize: "10px", display: "block" }}>RETURN TEMPERATURE</span>
                  <strong style={{ color: "#0284c7", fontSize: "16px", fontFamily: "var(--font-mono, monospace)" }}>{summary.glycolReturnTempC}°C</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontSize: "10px", display: "block" }}>CIRCULATION FLOW</span>
                  <strong style={{ color: "var(--text-primary, #0f172a)", fontSize: "16px", fontFamily: "var(--font-mono, monospace)" }}>{summary.glycolFlowRateLpm} L/min</strong>
                </div>
                <div>
                  <span style={{ color: "#64748b", fontSize: "10px", display: "block" }}>THERMAL EFFICIENCY</span>
                  <strong style={{ color: "#16a34a", fontSize: "16px", fontFamily: "var(--font-mono, monospace)" }}>{summary.thermalEfficiencyPercent}%</strong>
                </div>
              </div>
            </div>

            <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "12px 14px", fontSize: "11px", color: "#166534" }}>
              <strong>THERMAL STATUS:</strong> All airlock vestibules and perimeter insulation panels are operating with nominal delta retention.
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
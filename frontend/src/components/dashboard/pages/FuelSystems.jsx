import { useState } from "react";
import PageHeader from "../common/PageHeader";
import MetricCard from "../common/MetricCard";
import ProgressBar from "../common/ProgressBar";
import FuelChart from "../charts/FuelChart";
import { useStation } from "../../../context/StationContext";
import { getFuelData } from "../../../services/telemetryService";

export default function FuelSystems() {
  const { station, stationInfo } = useStation();
  const fuel = getFuelData(station);
  const { summary, tanks, generatorBurnDistribution, history24h } = fuel;

  const [selectedTank, setSelectedTank] = useState(tanks[0]?.id || "TANK-01");

  const isLowFuel = summary.fuelPercentage < 20 || summary.estimatedDaysRemaining < 15;

  return (
    <div className="dashboard-page fuel-page">
      <PageHeader
        eyebrow={`DHRUVNETRA / HYDROCARBON RESERVES · ${stationInfo.coordinates || ""}`}
        title={`${station} FUEL SYSTEMS`}
        description={`MONITORING OF ARCTIC DIESEL & JET A-1 RESERVES, BULK TANK FARMS, PIPELINE TRACE HEATING & DEPLETION RATES (${stationInfo.location})`}
        status="FUEL MONITORING ONLINE"
      />

      {/* LOW FUEL WARNING BANNER IF TRIGGERED */}
      {isLowFuel && (
        <div
          style={{
            background: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            gap: "10px",
            color: "#991b1b",
          }}
        >
          <span style={{ fontSize: "18px" }}>⚠️</span>
          <div>
            <strong style={{ display: "block" }}>CRITICAL FUEL RESERVE WARNING: TANK CAPACITY BELOW SAFETY THRESHOLD</strong>
            <span style={{ fontSize: "12px", color: "#b91c1c" }}>Estimated buffer less than required winter expedition reserve. Expedite tanker scheduling.</span>
          </div>
        </div>
      )}

      {/* PRIMARY METRICS GRID */}
      <section className="metrics-grid">
        <MetricCard
          label="TOTAL FUEL RESERVE"
          value={summary.fuelPercentage}
          unit="%"
          status={isLowFuel ? "WARNING" : "NORMAL"}
          trend={`${summary.currentLevelL.toLocaleString()} L of ${summary.totalCapacityL.toLocaleString()} L`}
        />

        <MetricCard
          label="CONSUMPTION RATE"
          value={summary.consumptionRateLh}
          unit="L/h"
          status="NORMAL"
          trend={`Daily Burn: ${summary.dailyConsumptionL} L/day`}
        />

        <MetricCard
          label="ESTIMATED REMAINING"
          value={Math.round(summary.estimatedDaysRemaining)}
          unit="DAYS"
          status="OPTIMAL"
          trend={summary.reserveDaysFormatted}
        />

        <MetricCard
          label="PIPELINE HEAT TRACING"
          value={summary.pipelineTraceHeating}
          status="ACTIVE"
          trend={`Leak Detection: ${summary.leakageStatus}`}
        />
      </section>

      {/* BULK TANK FARMS BREAKDOWN */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span>STORAGE INFRASTRUCTURE</span>
            <h2>BULK TANK FARM STATUS & VOLUMES</h2>
          </div>
          <span className="section-live">● ULTRASONIC SENSORS ACTIVE</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
          {tanks.map((tank) => {
            const isSelected = selectedTank === tank.id;
            return (
              <div
                key={tank.id}
                onClick={() => setSelectedTank(tank.id)}
                style={{
                  background: isSelected
                    ? "linear-gradient(135deg, #fffbeb 0%, #fef3c7 100%)"
                    : "#ffffff",
                  border: `1px solid ${isSelected ? "#d97706" : "var(--border-subtle, #e2e8f0)"}`,
                  borderRadius: "8px",
                  padding: "16px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: isSelected ? "0 4px 12px rgba(217, 119, 6, 0.12)" : "0 1px 3px rgba(0,0,0,0.04)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                  <span style={{ fontSize: "11px", fontFamily: "var(--font-mono, monospace)", color: "#b45309", fontWeight: 700 }}>
                    {tank.id}
                  </span>
                  <span
                    style={{
                      background: "#fef3c7",
                      color: "#b45309",
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "4px",
                      border: "1px solid #fde68a",
                    }}
                  >
                    ● {tank.valveStatus}
                  </span>
                </div>

                <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "var(--text-primary, #0f172a)", fontWeight: 600 }}>{tank.name}</h4>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                  <span style={{ fontSize: "22px", fontWeight: 800, color: "#d97706" }}>
                    {tank.percentage}%
                  </span>
                  <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "var(--font-mono, monospace)" }}>
                    {tank.currentL.toLocaleString()} / {tank.capacityL.toLocaleString()} L
                  </span>
                </div>

                <ProgressBar value={tank.percentage} max={100} height={5} color="amber" />

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#64748b", marginTop: "8px", fontFamily: "var(--font-mono, monospace)" }}>
                  <span>Temp: {tank.tempC}°C</span>
                  <span>Level: {tank.levelMeters} m</span>
                  <span>Heating: {tank.heatTracing}</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* LOWER GRID: 24-HOUR FUEL BURN GRAPH & GENERATOR DISTRIBUTION */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px", marginTop: "24px" }}>
        {/* GRAPH */}
        <section className="dashboard-panel">
          <div className="panel-heading">
            <span>CONSUMPTION TRAJECTORY</span>
            <h2>24-HOUR FUEL BURN RATE (L/h)</h2>
          </div>

          <FuelChart
            labels={history24h.timestamps}
            burnRates={history24h.burnRateLh}
            unit="L/h"
          />
        </section>

        {/* GENERATOR DISTRIBUTION & REFILL SCHEDULE */}
        <section className="dashboard-panel">
          <div className="panel-heading">
            <span>GENERATOR ALLOCATION</span>
            <h2>BURN SHARE & REFILL SCHEDULE</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Gen-wise burn share */}
            <div style={{ background: "var(--bg-subtle, #f8fafc)", border: "1px solid var(--border-subtle, #e2e8f0)", borderRadius: "8px", padding: "14px" }}>
              <div style={{ fontSize: "11px", color: "var(--accent-primary, #0284c7)", fontFamily: "var(--font-mono, monospace)", fontWeight: 700, marginBottom: "8px" }}>
                GENERATOR-WISE FUEL CONSUMPTION SHARE
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {generatorBurnDistribution.map((gb) => (
                  <div key={gb.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "3px" }}>
                      <span style={{ color: "var(--text-primary, #0f172a)", fontWeight: 500 }}>{gb.name}</span>
                      <strong style={{ color: "#d97706", fontFamily: "var(--font-mono, monospace)" }}>{gb.burnRateLh} L/h ({gb.sharePercent}%)</strong>
                    </div>
                    <ProgressBar value={gb.sharePercent} max={100} height={4} color="amber" />
                  </div>
                ))}
              </div>
            </div>

            {/* Logistics Refill Notice */}
            <div style={{ background: "#f0f9ff", border: "1px solid #bae6fd", borderRadius: "8px", padding: "14px", fontSize: "12px", color: "#475569" }}>
              <div style={{ color: "#0369a1", fontWeight: 700, marginBottom: "4px", fontSize: "11px", fontFamily: "var(--font-mono, monospace)" }}>
                LOGISTICS REPLENISHMENT VOYAGE
              </div>
              <div style={{ marginTop: "2px" }}>Last Bunkering: <strong style={{ color: "#0f172a" }}>{summary.lastRefillDate}</strong></div>
              <div style={{ marginTop: "2px" }}>Next Scheduled Tanker: <strong style={{ color: "#16a34a" }}>{summary.nextScheduledDelivery}</strong></div>
              <div style={{ marginTop: "4px", fontSize: "11px", color: "#64748b" }}>
                Fuel Type: {summary.fuelType}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
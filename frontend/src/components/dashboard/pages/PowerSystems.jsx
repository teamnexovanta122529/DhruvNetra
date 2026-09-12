import React, { useState } from "react";
import PageHeader from "../common/PageHeader";
import MetricCard from "../common/MetricCard";
import StatusBadge from "../common/StatusBadge";
import ProgressBar from "../common/ProgressBar";
import PowerChart from "../charts/PowerChart";
import { useStation } from "../../../context/StationContext";
import { getPowerData } from "../../../services/telemetryService";

export default function PowerSystems() {
  const { station, stationInfo } = useStation();
  const power = getPowerData(station);
  const { summary, generators, bess, renewable, history24h, anomaly } = power;

  const [selectedGenerator, setSelectedGenerator] = useState(generators[0]?.id || "GEN-01");

  const activeGen = generators.find((g) => g.id === selectedGenerator) || generators[0];

  return (
    <div className="dashboard-page power-page">
      <PageHeader
        eyebrow={`DHRUVNETRA / ELECTRICAL MICROGRID · ${stationInfo.coordinates || ""}`}
        title={`${station} POWER MONITORING`}
        description={`CONTINUOUS TELEMETRY OF MULTI-GENERATOR MICROGRID, BESS BATTERY STORAGE & BUS STABILITY (${stationInfo.location})`}
        status="MICROGRID SYNCHRONIZED"
      />

      {/* PRIMARY KPI STRIP */}
      <section className="metrics-grid">
        <MetricCard
          label="ACTIVE GENERATION"
          value={summary.currentGenerationKw}
          unit="kW"
          status={summary.status}
          trend={`${summary.activeGeneratorsCount} OF ${summary.totalGeneratorsCount} RUNNING`}
        />

        <MetricCard
          label="STATION LOAD DEMAND"
          value={summary.loadPercentage}
          unit="%"
          status={summary.loadPercentage > 85 ? "WARNING" : "NORMAL"}
          trend={`${summary.currentLoadKw} kW of ${summary.totalCapacityKw} kW max`}
        />

        <MetricCard
          label="BUS VOLTAGE & FREQ"
          value={summary.busVoltageV}
          unit="V"
          status="STABLE"
          trend={`${summary.gridFrequencyHz} Hz (±0.04 Hz)`}
        />

        <MetricCard
          label="BESS BATTERY RESERVE"
          value={summary.bessReserveSocPercent}
          unit="%"
          status="OPTIMAL"
          trend={`${summary.bessBackupHours} hrs buffer (${summary.bessCapacityKwh} kWh)`}
        />
      </section>

      {/* GENERATOR FLEET STATUS TABLE */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span>GENERATION ASSETS</span>
            <h2>DIESEL GENERATOR CLUSTER STATUS</h2>
          </div>
          <span className="section-live">● TELEMETRY LINKED</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {generators.map((gen) => {
            const isRunning = gen.status === "RUNNING";
            const isSelected = selectedGenerator === gen.id;
            return (
              <div
                key={gen.id}
                onClick={() => setSelectedGenerator(gen.id)}
                style={{
                  background: isSelected
                    ? "#f0f9ff"
                    : "#ffffff",
                  border: `1px solid ${isSelected ? "var(--accent-primary)" : "var(--border-default)"}`,
                  borderRadius: "8px",
                  padding: "16px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: isSelected ? "var(--shadow-md)" : "var(--shadow-xs)",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "10.5px", fontFamily: "monospace", color: "var(--accent-primary)", fontWeight: 800 }}>
                    {gen.id}
                  </span>
                  <span
                    style={{
                      background: isRunning ? "var(--status-normal-bg)" : "var(--surface-muted)",
                      color: isRunning ? "var(--status-normal)" : "var(--text-muted)",
                      border: `1px solid ${isRunning ? "var(--status-normal-border)" : "transparent"}`,
                      fontSize: "9.5px",
                      fontWeight: 800,
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    ● {gen.status}
                  </span>
                </div>

                <h4 style={{ margin: "0 0 10px 0", fontSize: "13.5px", fontWeight: 700, color: "var(--text-primary)" }}>{gen.name}</h4>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", fontSize: "11px", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Output: </span>
                    <strong style={{ color: "var(--accent-primary)" }}>{gen.outputKw} kW</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Load: </span>
                    <strong style={{ color: gen.loadPercent > 85 ? "var(--status-warning)" : "var(--status-normal)" }}>{gen.loadPercent}%</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Coolant: </span>
                    <strong style={{ color: "var(--text-primary)" }}>{gen.coolantTempC}°C</strong>
                  </div>
                  <div>
                    <span style={{ color: "var(--text-muted)" }}>Fuel Burn: </span>
                    <strong style={{ color: "var(--text-primary)" }}>{gen.fuelConsumptionLh} L/h</strong>
                  </div>
                </div>

                <div style={{ marginTop: "10px" }}>
                  <ProgressBar value={gen.loadPercent} max={100} height={5} color={gen.loadPercent > 85 ? "amber" : "cyan"} />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 24-HOUR GENERATION VS DEMAND GRAPH & BESS BUFFER */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px", marginTop: "24px" }}>
        {/* GRAPH */}
        <section className="dashboard-panel">
          <div className="panel-heading">
            <span>TEMPORAL PROFILE</span>
            <h2>24-HOUR GENERATION VS LOAD PROFILE</h2>
          </div>

          <PowerChart
            labels={history24h.timestamps}
            generation={history24h.generationKw}
            demand={history24h.demandLoadKw}
            unit="kW"
          />
        </section>

        {/* BESS & RENEWABLE BUFFER */}
        <section className="dashboard-panel">
          <div className="panel-heading">
            <span>ENERGY STORAGE & RENEWABLES</span>
            <h2>BESS & HYBRID TOPOLOGY</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {/* Battery Box */}
            <div style={{ background: "var(--surface-secondary)", border: "1px solid var(--border-default)", borderRadius: "8px", padding: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "10.5px", color: "var(--accent-primary)", fontFamily: "monospace", fontWeight: 800 }}>
                  🔋 BESS BATTERY CONTAINER
                </span>
                <span style={{ fontSize: "10px", color: "var(--status-normal)", fontWeight: 800, background: "var(--status-normal-bg)", padding: "2px 6px", borderRadius: "4px", border: "1px solid var(--status-normal-border)" }}>
                  ● {bess.status}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "28px", fontWeight: 800, color: "var(--text-primary)" }}>
                  {bess.socPercent}%
                </span>
                <span style={{ fontSize: "11px", color: "var(--text-secondary)", fontFamily: "monospace" }}>
                  {bess.voltageV} V · {bess.currentAmps} A · {bess.temperatureC}°C
                </span>
              </div>
              <ProgressBar value={bess.socPercent} max={100} height={6} color="green" style={{ marginTop: "8px" }} />
              <div style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "6px" }}>
                Inverter: <strong style={{ color: "var(--accent-primary)" }}>{bess.inverterStatus}</strong> · Health: {bess.healthPercent}%
              </div>
            </div>

            {/* Renewable Offset */}
            <div style={{ background: "var(--surface-secondary)", border: "1px solid var(--border-subtle)", borderRadius: "8px", padding: "14px" }}>
              <div style={{ fontSize: "10.5px", color: "#b45309", fontFamily: "monospace", fontWeight: 800, marginBottom: "6px" }}>
                ☀️ POLAR SOLAR PV & WIND TURBINE
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", fontSize: "12px" }}>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "9.5px", display: "block", fontWeight: 700 }}>SOLAR PV</span>
                  <strong style={{ color: "var(--text-primary)", fontSize: "14px" }}>{renewable.solarPvOutputKw} kW</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "9.5px", display: "block", fontWeight: 700 }}>WIND TURBINE</span>
                  <strong style={{ color: "var(--text-primary)", fontSize: "14px" }}>{renewable.windTurbineOutputKw} kW</strong>
                </div>
                <div>
                  <span style={{ color: "var(--text-muted)", fontSize: "9.5px", display: "block", fontWeight: 700 }}>GRID OFFSET</span>
                  <strong style={{ color: "var(--status-normal)", fontSize: "14px" }}>{renewable.contributionPercent}%</strong>
                </div>
              </div>
            </div>

            {/* Anomaly / Diagnostics notice */}
            <div style={{ background: "var(--status-normal-bg)", border: "1px solid var(--status-normal-border)", borderRadius: "6px", padding: "10px 14px", fontSize: "11px", color: "var(--status-normal)", fontWeight: 600 }}>
              <strong>DIAGNOSTICS:</strong> {anomaly.message}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
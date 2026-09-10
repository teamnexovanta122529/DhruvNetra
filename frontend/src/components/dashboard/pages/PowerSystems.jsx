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
                    ? "linear-gradient(135deg, rgba(8, 30, 48, 0.95), rgba(4, 18, 30, 0.95))"
                    : "rgba(10, 22, 34, 0.7)",
                  border: `1px solid ${isSelected ? "#00f0ff" : isRunning ? "rgba(16, 185, 129, 0.3)" : "rgba(255, 255, 255, 0.1)"}`,
                  borderRadius: "8px",
                  padding: "16px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  boxShadow: isSelected ? "0 0 16px rgba(0, 240, 255, 0.2)" : "none",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#67e8f9", fontWeight: 700 }}>
                    {gen.id}
                  </span>
                  <span
                    style={{
                      background: isRunning ? "rgba(16, 185, 129, 0.2)" : "rgba(148, 163, 184, 0.15)",
                      color: isRunning ? "#10b981" : "#94a3b8",
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    ● {gen.status}
                  </span>
                </div>

                <h4 style={{ margin: "0 0 10px 0", fontSize: "13px", color: "#ffffff" }}>{gen.name}</h4>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px", fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>
                  <div>
                    <span>Output: </span>
                    <strong style={{ color: "#38bdf8" }}>{gen.outputKw} kW</strong>
                  </div>
                  <div>
                    <span>Load: </span>
                    <strong style={{ color: gen.loadPercent > 85 ? "#f59e0b" : "#10b981" }}>{gen.loadPercent}%</strong>
                  </div>
                  <div>
                    <span>Coolant: </span>
                    <strong style={{ color: "#e2e8f0" }}>{gen.coolantTempC}°C</strong>
                  </div>
                  <div>
                    <span>Fuel Burn: </span>
                    <strong style={{ color: "#e2e8f0" }}>{gen.fuelConsumptionLh} L/h</strong>
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
            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(0, 240, 255, 0.2)", borderRadius: "8px", padding: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", color: "#67e8f9", fontFamily: "monospace", fontWeight: 700 }}>
                  🔋 BESS BATTERY CONTAINER
                </span>
                <span style={{ fontSize: "11px", color: "#10b981", fontWeight: 700 }}>
                  ● {bess.status}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                <span style={{ fontSize: "28px", fontWeight: 800, color: "#ffffff" }}>
                  {bess.socPercent}%
                </span>
                <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                  {bess.voltageV} V · {bess.currentAmps} A · {bess.temperatureC}°C
                </span>
              </div>
              <ProgressBar value={bess.socPercent} max={100} height={6} color="green" style={{ marginTop: "8px" }} />
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px" }}>
                Inverter: <strong style={{ color: "#38bdf8" }}>{bess.inverterStatus}</strong> · Health: {bess.healthPercent}%
              </div>
            </div>

            {/* Renewable Offset */}
            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "8px", padding: "14px" }}>
              <div style={{ fontSize: "11px", color: "#f59e0b", fontFamily: "monospace", fontWeight: 700, marginBottom: "6px" }}>
                ☀️ POLAR SOLAR PV & WIND TURBINE
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", fontSize: "12px" }}>
                <div>
                  <span style={{ color: "#94a3b8", fontSize: "10px", display: "block" }}>SOLAR PV</span>
                  <strong style={{ color: "#ffffff" }}>{renewable.solarPvOutputKw} kW</strong>
                </div>
                <div>
                  <span style={{ color: "#94a3b8", fontSize: "10px", display: "block" }}>WIND TURBINE</span>
                  <strong style={{ color: "#ffffff" }}>{renewable.windTurbineOutputKw} kW</strong>
                </div>
                <div>
                  <span style={{ color: "#94a3b8", fontSize: "10px", display: "block" }}>GRID OFFSET</span>
                  <strong style={{ color: "#10b981" }}>{renewable.contributionPercent}%</strong>
                </div>
              </div>
            </div>

            {/* Anomaly / Diagnostics notice */}
            <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "6px", padding: "10px 14px", fontSize: "11px", color: "#a7f3d0" }}>
              <strong>DIAGNOSTICS:</strong> {anomaly.message}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
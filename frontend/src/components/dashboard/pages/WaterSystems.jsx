import React, { useState } from "react";
import PageHeader from "../common/PageHeader";
import MetricCard from "../common/MetricCard";
import StatusBadge from "../common/StatusBadge";
import ProgressBar from "../common/ProgressBar";
import ConsumptionChart from "../charts/ConsumptionChart";
import { useStation } from "../../../context/StationContext";
import { getWaterData } from "../../../services/telemetryService";

export default function WaterSystems() {
  const { station, stationInfo } = useStation();
  const water = getWaterData(station);
  const { summary, tanks, productionUnits, history24h } = water;

  return (
    <div className="dashboard-page water-page">
      <PageHeader
        eyebrow={`DHRUVNETRA / POTABLE WATER & LIFE SUPPORT · ${stationInfo.coordinates || ""}`}
        title={`${station} WATER MANAGEMENT`}
        description={`POTABLE WATER RESERVES, SNOW MELT GENERATION, REVERSE OSMOSIS DESALINATION & GREYWATER RECYCLING (${stationInfo.location})`}
        status="POTABLE BUFFER OPTIMAL"
      />

      {/* PRIMARY METRICS GRID */}
      <section className="metrics-grid">
        <MetricCard
          label="POTABLE STORAGE"
          value={summary.percentage}
          unit="%"
          status={summary.status}
          trend={`${summary.currentLevelL.toLocaleString()} L of ${summary.totalCapacityL.toLocaleString()} L`}
        />

        <MetricCard
          label="DAILY PRODUCTION"
          value={summary.dailyProductionL}
          unit="L/day"
          status="NORMAL"
          trend={`Demand: ${summary.dailyConsumptionL} L/day (${summary.netDailyBalanceL})`}
        />

        <MetricCard
          label="BUFFER RESERVE"
          value={summary.estimatedDaysRemaining}
          unit="DAYS"
          status="OPTIMAL"
          trend={`At standard crew consumption`}
        />

        <MetricCard
          label="WATER PURITY (TDS)"
          value={summary.waterQualityTdsPpm}
          unit="PPM"
          status="OPTIMAL"
          trend={`pH ${summary.waterPh} · UV/Ozone Active`}
        />
      </section>

      {/* RESERVOIRS & GENERATION UNITS */}
      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <span>RESERVOIRS & MELT INFRASTRUCTURE</span>
            <h2>POTABLE WATER TANKS & PRODUCTION UNITS</h2>
          </div>
          <span className="section-live">● CONTINUOUS FLOW</span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
          {/* Tanks */}
          {tanks.map((tank) => (
            <div
              key={tank.id}
              style={{
                background: "#ffffff",
                border: "1px solid var(--border-subtle, #e2e8f0)",
                borderRadius: "8px",
                padding: "16px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono, monospace)", color: "var(--accent-primary, #0284c7)", fontWeight: 700 }}>
                  {tank.id}
                </span>
                <StatusBadge status={tank.status} type="normal" />
              </div>

              <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "var(--text-primary, #0f172a)", fontWeight: 600 }}>{tank.name}</h4>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                <span style={{ fontSize: "22px", fontWeight: 800, color: "#0284c7" }}>
                  {tank.percentage}%
                </span>
                <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "var(--font-mono, monospace)" }}>
                  {tank.currentL.toLocaleString()} / {tank.capacityL.toLocaleString()} L
                </span>
              </div>

              <ProgressBar value={tank.percentage} max={100} height={5} color="cyan" />

              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "8px", fontFamily: "var(--font-mono, monospace)" }}>
                Internal Temp: <strong style={{ color: "var(--text-primary, #0f172a)" }}>{tank.tempC}°C</strong> (Heated Buffer)
              </div>
            </div>
          ))}

          {/* Production Units */}
          {productionUnits.map((unit) => (
            <div
              key={unit.id}
              style={{
                background: "#ffffff",
                border: "1px solid var(--border-subtle, #e2e8f0)",
                borderRadius: "8px",
                padding: "16px",
                boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", fontFamily: "var(--font-mono, monospace)", color: "#166534", fontWeight: 700 }}>
                  {unit.id}
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
                  ● {unit.status}
                </span>
              </div>

              <h4 style={{ margin: "0 0 8px 0", fontSize: "14px", color: "var(--text-primary, #0f172a)", fontWeight: 600 }}>{unit.name}</h4>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                <span style={{ fontSize: "22px", fontWeight: 800, color: "#16a34a" }}>
                  {unit.outputLh} L/h
                </span>
                <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "var(--font-mono, monospace)" }}>
                  Power Draw: {unit.energyKw} kW
                </span>
              </div>

              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "12px", fontFamily: "var(--font-mono, monospace)" }}>
                Operational State: <strong style={{ color: "#0284c7" }}>{unit.health}</strong>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* LOWER GRID: 24-HR WATER BALANCE GRAPH & PURIFICATION TECH */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "20px", marginTop: "24px" }}>
        {/* GRAPH */}
        <section className="dashboard-panel">
          <div className="panel-heading">
            <span>WATER BALANCE</span>
            <h2>24-HOUR PRODUCTION VS CONSUMPTION (L/h)</h2>
          </div>

          <ConsumptionChart
            labels={history24h.timestamps}
            consumption={history24h.consumptionRateLh}
            production={history24h.productionRateLh}
            unit="L/h"
            seriesLabels={{ a: "Station Demand (L/h)", b: "Melt/RO Production (L/h)" }}
          />
        </section>

        {/* PURIFICATION & RECYCLING METRICS */}
        <section className="dashboard-panel">
          <div className="panel-heading">
            <span>WATER PURIFICATION</span>
            <h2>QUALITY & RECYCLING METRICS</h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ background: "var(--bg-subtle, #f8fafc)", border: "1px solid var(--border-subtle, #e2e8f0)", borderRadius: "8px", padding: "14px" }}>
              <div style={{ fontSize: "11px", color: "var(--accent-primary, #0284c7)", fontFamily: "var(--font-mono, monospace)", fontWeight: 700, marginBottom: "8px" }}>
                PURIFICATION PROCESS
              </div>
              <div style={{ fontSize: "12px", color: "var(--text-secondary, #475569)", lineHeight: "1.5" }}>
                {summary.purificationMethod}
              </div>
            </div>

            <div style={{ background: "var(--bg-subtle, #f8fafc)", border: "1px solid var(--border-subtle, #e2e8f0)", borderRadius: "8px", padding: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", color: "var(--accent-primary, #0284c7)", fontFamily: "var(--font-mono, monospace)", fontWeight: 700 }}>
                  GREYWATER RECYCLING
                </span>
                <strong style={{ color: "#16a34a", fontSize: "14px", fontFamily: "var(--font-mono, monospace)" }}>{summary.greywaterRecyclingEfficiencyPercent}%</strong>
              </div>
              <ProgressBar value={summary.greywaterRecyclingEfficiencyPercent} max={100} height={5} color="green" />
              <div style={{ fontSize: "11px", color: "#64748b", marginTop: "6px" }}>
                Pipeline Frost Protection: <strong style={{ color: "var(--text-primary, #0f172a)" }}>{summary.pipelineFrostProtection}</strong>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
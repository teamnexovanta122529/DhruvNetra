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
                background: "rgba(10, 22, 34, 0.7)",
                border: "1px solid rgba(0, 240, 255, 0.25)",
                borderRadius: "8px",
                padding: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#67e8f9", fontWeight: 700 }}>
                  {tank.id}
                </span>
                <StatusBadge status={tank.status} type="normal" />
              </div>

              <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#ffffff" }}>{tank.name}</h4>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                <span style={{ fontSize: "22px", fontWeight: 800, color: "#00f0ff" }}>
                  {tank.percentage}%
                </span>
                <span style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>
                  {tank.currentL.toLocaleString()} / {tank.capacityL.toLocaleString()} L
                </span>
              </div>

              <ProgressBar value={tank.percentage} max={100} height={5} color="cyan" />

              <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "8px", fontFamily: "monospace" }}>
                Internal Temp: <strong>{tank.tempC}°C</strong> (Heated Buffer)
              </div>
            </div>
          ))}

          {/* Production Units */}
          {productionUnits.map((unit) => (
            <div
              key={unit.id}
              style={{
                background: "rgba(10, 22, 34, 0.7)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                borderRadius: "8px",
                padding: "16px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#6ee7b7", fontWeight: 700 }}>
                  {unit.id}
                </span>
                <span
                  style={{
                    background: "rgba(16, 185, 129, 0.15)",
                    color: "#10b981",
                    fontSize: "10px",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: "4px",
                  }}
                >
                  ● {unit.status}
                </span>
              </div>

              <h4 style={{ margin: "0 0 8px 0", fontSize: "13px", color: "#ffffff" }}>{unit.name}</h4>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
                <span style={{ fontSize: "22px", fontWeight: 800, color: "#10b981" }}>
                  {unit.outputLh} L/h
                </span>
                <span style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>
                  Power Draw: {unit.energyKw} kW
                </span>
              </div>

              <div style={{ fontSize: "10px", color: "#94a3b8", marginTop: "12px", fontFamily: "monospace" }}>
                Operational State: <strong style={{ color: "#38bdf8" }}>{unit.health}</strong>
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
            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "8px", padding: "14px" }}>
              <div style={{ fontSize: "11px", color: "#67e8f9", fontFamily: "monospace", fontWeight: 700, marginBottom: "8px" }}>
                PURIFICATION PROCESS
              </div>
              <div style={{ fontSize: "12px", color: "#e2e8f0", lineHeight: "1.5" }}>
                {summary.purificationMethod}
              </div>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.03)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "8px", padding: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "11px", color: "#67e8f9", fontFamily: "monospace", fontWeight: 700 }}>
                  GREYWATER RECYCLING
                </span>
                <strong style={{ color: "#10b981", fontSize: "14px" }}>{summary.greywaterRecyclingEfficiencyPercent}%</strong>
              </div>
              <ProgressBar value={summary.greywaterRecyclingEfficiencyPercent} max={100} height={5} color="green" />
              <div style={{ fontSize: "11px", color: "#94a3b8", marginTop: "6px" }}>
                Pipeline Frost Protection: <strong style={{ color: "#38bdf8" }}>{summary.pipelineFrostProtection}</strong>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
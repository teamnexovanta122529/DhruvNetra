import React, { useState } from "react";
import PageHeader from "../common/PageHeader";
import MetricCard from "../common/MetricCard";
import StatusBadge from "../common/StatusBadge";
import ProgressBar from "../common/ProgressBar";
import { useStation } from "../../../context/StationContext";
import { getLogisticsData } from "../../../services/telemetryService";

export default function Logistics() {
  const { station, stationInfo } = useStation();
  const logistics = getLogisticsData(station);
  const { summary, criticalInventory, shipments, vehicles } = logistics;

  const [activeTab, setActiveTab] = useState("inventory"); // 'inventory' | 'shipments' | 'fleet'

  return (
    <div className="dashboard-page logistics-page">
      <PageHeader
        eyebrow={`DHRUVNETRA / EXPEDITION LOGISTICS · ${stationInfo.coordinates || ""}`}
        title={`${station} LOGISTICS & SUPPLY`}
        description={`INVENTORY MANAGEMENT, EXPEDITION ICEBREAKER SHIPMENTS, POLAR VEHICLE FLEET & WINTERING READINESS (${stationInfo.location})`}
        status="SUPPLY BUFFER OPTIMAL"
      />

      {/* PRIMARY METRICS GRID */}
      <section className="metrics-grid">
        <MetricCard
          label="ESSENTIAL STOCK BUFFER"
          value={summary.essentialStockDays}
          unit="DAYS"
          status={summary.status}
          trend={`Winter Readiness: ${summary.winterReadinessScore}/100`}
        />

        <MetricCard
          label="FOOD & PROVISIONS"
          value={summary.foodProvisionsPercent}
          unit="%"
          status="OPTIMAL"
          trend="Adequate for wintering crew"
        />

        <MetricCard
          label="GENERATOR SPARES"
          value={summary.generatorSparesPercent}
          unit="%"
          status="NORMAL"
          trend="Critical filters & oil drums stocked"
        />

        <MetricCard
          label="POLAR FLEET READY"
          value={summary.activeVehiclesCount}
          unit={`/ ${summary.totalVehiclesCount}`}
          status="OPTIMAL"
          trend="PistenBully & snowmobiles green"
        />
      </section>

      {/* SEGMENTED TAB CONTROLS */}
      <div style={{ display: "flex", gap: "8px", margin: "20px 0 16px 0", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", paddingBottom: "10px" }}>
        {[
          { id: "inventory", label: "📦 CRITICAL INVENTORY", count: criticalInventory.length },
          { id: "shipments", label: "🚢 INCOMING SHIPMENTS & FLIGHTS", count: shipments.length },
          { id: "fleet", label: "🚜 POLAR VEHICLE FLEET", count: vehicles.length },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              background: activeTab === tab.id ? "rgba(0, 240, 255, 0.2)" : "rgba(255, 255, 255, 0.04)",
              border: `1px solid ${activeTab === tab.id ? "#00f0ff" : "rgba(255, 255, 255, 0.15)"}`,
              color: activeTab === tab.id ? "#ffffff" : "#94a3b8",
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "monospace",
            }}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* TAB 1: INVENTORY TABLE */}
      {activeTab === "inventory" && (
        <section className="dashboard-panel">
          <div className="panel-heading">
            <span>STOCK REGISTRY</span>
            <h2>MISSION-CRITICAL CONSUMABLES & SPARES</h2>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table className="whatif-table" style={{ width: "100%", fontSize: "12px" }}>
              <thead>
                <tr>
                  <th>ITEM ID</th>
                  <th>INVENTORY DESCRIPTION</th>
                  <th>CURRENT QUANTITY</th>
                  <th>BUFFER</th>
                  <th>MIN THRESHOLD</th>
                  <th>STATUS</th>
                </tr>
              </thead>
              <tbody>
                {criticalInventory.map((item) => (
                  <tr key={item.id}>
                    <td className="mono-cell" style={{ color: "#67e8f9" }}>{item.id}</td>
                    <td style={{ fontWeight: 600, color: "#ffffff" }}>{item.item}</td>
                    <td className="mono-cell">{item.quantity}</td>
                    <td style={{ color: "#10b981", fontWeight: 700 }}>{item.daysSupply} Days</td>
                    <td className="mono-cell" style={{ color: "#94a3b8" }}>{item.minThreshold}</td>
                    <td>
                      <StatusBadge status={item.status} type="normal" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* TAB 2: SHIPMENTS & VOYAGES */}
      {activeTab === "shipments" && (
        <section className="dashboard-panel">
          <div className="panel-heading">
            <span>EXPEDITION PIPELINE</span>
            <h2>INCOMING SEA VOYAGES & AIR DROPS</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px" }}>
            {shipments.map((ship) => (
              <div
                key={ship.id}
                style={{
                  background: "rgba(10, 22, 34, 0.7)",
                  border: "1px solid rgba(0, 240, 255, 0.25)",
                  borderRadius: "8px",
                  padding: "16px",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#67e8f9", fontWeight: 700 }}>
                    {ship.id}
                  </span>
                  <span
                    style={{
                      background: "rgba(0, 240, 255, 0.15)",
                      color: "#00f0ff",
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "4px",
                    }}
                  >
                    ● {ship.status}
                  </span>
                </div>

                <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", color: "#ffffff" }}>{ship.vessel}</h4>

                <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "10px" }}>
                  <div>Origin: <strong style={{ color: "#e2e8f0" }}>{ship.origin}</strong></div>
                  <div>Destination: <strong style={{ color: "#e2e8f0" }}>{ship.destination}</strong></div>
                  <div>ETA: <strong style={{ color: "#10b981" }}>{ship.eta}</strong> ({ship.distanceRemainingNm})</div>
                </div>

                <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "8px", borderRadius: "4px", fontSize: "11px", color: "#cbd5e1", marginBottom: "10px" }}>
                  Manifest: {ship.cargoManifest}
                </div>

                {ship.progressPercent > 0 && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8", marginBottom: "3px" }}>
                      <span>Voyage Progress</span>
                      <span>{ship.progressPercent}%</span>
                    </div>
                    <ProgressBar value={ship.progressPercent} max={100} height={5} color="cyan" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {/* TAB 3: VEHICLE FLEET */}
      {activeTab === "fleet" && (
        <section className="dashboard-panel">
          <div className="panel-heading">
            <span>SURFACE TRANSPORT</span>
            <h2>POLAR SNOWCAT & RECON FLEET</h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            {vehicles.map((v) => {
              const isOp = v.status === "OPERATIONAL";
              return (
                <div
                  key={v.id}
                  style={{
                    background: "rgba(10, 22, 34, 0.7)",
                    border: `1px solid ${isOp ? "rgba(16, 185, 129, 0.25)" : "rgba(245, 158, 11, 0.25)"}`,
                    borderRadius: "8px",
                    padding: "16px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#67e8f9", fontWeight: 700 }}>
                      {v.id}
                    </span>
                    <span
                      style={{
                        background: isOp ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                        color: isOp ? "#10b981" : "#f59e0b",
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "4px",
                      }}
                    >
                      ● {v.status}
                    </span>
                  </div>

                  <h4 style={{ margin: "0 0 6px 0", fontSize: "13px", color: "#ffffff" }}>{v.name}</h4>
                  <div style={{ fontSize: "11px", color: "#94a3b8", marginBottom: "8px" }}>
                    Type: {v.type} · Staging: <strong style={{ color: "#e2e8f0" }}>{v.location}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>
                    <span>Battery: <strong style={{ color: "#10b981" }}>{v.battery}</strong></span>
                    <span>Fuel: <strong style={{ color: "#fbbf24" }}>{v.fuelL} L</strong></span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}
    </div>
  );
}
import { useState } from "react";
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
      <div style={{ display: "flex", gap: "8px", margin: "20px 0 16px 0", borderBottom: "1px solid var(--border-subtle, #e2e8f0)", paddingBottom: "12px", flexWrap: "wrap" }}>
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
              background: activeTab === tab.id ? "var(--accent-primary, #0284c7)" : "#ffffff",
              border: `1px solid ${activeTab === tab.id ? "var(--accent-primary, #0284c7)" : "var(--border-subtle, #cbd5e1)"}`,
              color: activeTab === tab.id ? "#ffffff" : "var(--text-secondary, #475569)",
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "var(--font-mono, monospace)",
              boxShadow: activeTab === tab.id ? "0 2px 6px rgba(2, 132, 199, 0.2)" : "0 1px 2px rgba(0,0,0,0.03)",
              transition: "all 0.15s ease"
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
                    <td className="mono-cell" style={{ color: "var(--accent-primary, #0284c7)" }}>{item.id}</td>
                    <td style={{ fontWeight: 600, color: "var(--text-primary, #0f172a)" }}>{item.item}</td>
                    <td className="mono-cell">{item.quantity}</td>
                    <td style={{ color: "#16a34a", fontWeight: 700, fontFamily: "var(--font-mono, monospace)" }}>{item.daysSupply} Days</td>
                    <td className="mono-cell" style={{ color: "#64748b" }}>{item.minThreshold}</td>
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
                  background: "#ffffff",
                  border: "1px solid var(--border-subtle, #e2e8f0)",
                  borderRadius: "8px",
                  padding: "16px",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <span style={{ fontSize: "11px", fontFamily: "var(--font-mono, monospace)", color: "var(--accent-primary, #0284c7)", fontWeight: 700 }}>
                    {ship.id}
                  </span>
                  <span
                    style={{
                      background: "#e0f2fe",
                      color: "#0369a1",
                      fontSize: "10px",
                      fontWeight: 700,
                      padding: "2px 8px",
                      borderRadius: "4px",
                      border: "1px solid #bae6fd"
                    }}
                  >
                    ● {ship.status}
                  </span>
                </div>

                <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", color: "var(--text-primary, #0f172a)", fontWeight: 600 }}>{ship.vessel}</h4>

                <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "10px" }}>
                  <div>Origin: <strong style={{ color: "var(--text-primary, #0f172a)" }}>{ship.origin}</strong></div>
                  <div>Destination: <strong style={{ color: "var(--text-primary, #0f172a)" }}>{ship.destination}</strong></div>
                  <div>ETA: <strong style={{ color: "#16a34a" }}>{ship.eta}</strong> ({ship.distanceRemainingNm})</div>
                </div>

                <div style={{ background: "var(--bg-subtle, #f8fafc)", border: "1px solid var(--border-subtle, #e2e8f0)", padding: "8px 10px", borderRadius: "6px", fontSize: "11px", color: "#334155", marginBottom: "10px" }}>
                  Manifest: {ship.cargoManifest}
                </div>

                {ship.progressPercent > 0 && (
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#64748b", marginBottom: "3px", fontFamily: "var(--font-mono, monospace)" }}>
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
                    background: "#ffffff",
                    border: `1px solid ${isOp ? "#bbf7d0" : "#fde68a"}`,
                    borderRadius: "8px",
                    padding: "16px",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "11px", fontFamily: "var(--font-mono, monospace)", color: "var(--accent-primary, #0284c7)", fontWeight: 700 }}>
                      {v.id}
                    </span>
                    <span
                      style={{
                        background: isOp ? "#dcfce7" : "#fef3c7",
                        color: isOp ? "#166534" : "#b45309",
                        fontSize: "10px",
                        fontWeight: 700,
                        padding: "2px 6px",
                        borderRadius: "4px",
                        border: `1px solid ${isOp ? "#86efac" : "#fcd34d"}`
                      }}
                    >
                      ● {v.status}
                    </span>
                  </div>

                  <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", color: "var(--text-primary, #0f172a)", fontWeight: 600 }}>{v.name}</h4>
                  <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px" }}>
                    Type: {v.type} · Staging: <strong style={{ color: "var(--text-primary, #0f172a)" }}>{v.location}</strong>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#64748b", fontFamily: "var(--font-mono, monospace)" }}>
                    <span>Battery: <strong style={{ color: "#16a34a" }}>{v.battery}</strong></span>
                    <span>Fuel: <strong style={{ color: "#d97706" }}>{v.fuelL} L</strong></span>
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
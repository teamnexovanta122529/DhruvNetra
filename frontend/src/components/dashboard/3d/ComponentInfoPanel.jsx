import React from "react";
import { useNavigate } from "react-router-dom";
import StatusBadge from "../common/StatusBadge";
import ProgressBar from "../common/ProgressBar";

export default function ComponentInfoPanel({
  station = "MAITRI",
  componentId,
  telemetry,
  onClose,
}) {
  const navigate = useNavigate();
  if (!componentId) return null;

  const isBharati = station.toUpperCase() === "BHARATI";

  // Component metadata mapping
  const componentDetailsMap = {
    powerhouse: {
      title: isBharati ? "Volvo Penta Tri-Generator Microgrid Powerhouse" : "Caterpillar & Cummins Polar Powerhouse Shelter",
      subsystem: "POWER MICROGRID",
      route: "/dashboard/power",
      icon: "ϟ",
      health: isBharati ? 96 : 91,
      status: "RUNNING",
      metrics: [
        { label: "GENERATOR 01", value: isBharati ? "155 kW (77%)" : "125 kW (88%)", state: "RUNNING" },
        { label: "GENERATOR 02", value: isBharati ? "150 kW (75%)" : "120 kW (84%)", state: "RUNNING" },
        { label: "GENERATOR 03", value: isBharati ? "145 kW (72%)" : "115 kW (78%)", state: "RUNNING" },
        { label: "TOTAL OUTPUT", value: isBharati ? "450 kW / 415.8 V" : "360 kW / 415.2 V", state: "OPTIMAL" },
        { label: "GRID FREQUENCY", value: isBharati ? "49.98 Hz" : "50.04 Hz", state: "NOMINAL" },
        { label: "FUEL DRAW", value: isBharati ? "24.2 L/h" : "28.5 L/h", state: "OPTIMAL" },
      ],
      description: "Primary generation node supplying continuous 415V three-phase electrical power with BESS battery backup reserve.",
    },
    habitat: {
      title: isBharati ? "Aerodynamic Elevated Habitat & Central Living Deck" : "Main Living Quarters & Central Accommodation Deck",
      subsystem: "HVAC & LIFE SUPPORT",
      route: "/dashboard/hvac",
      icon: "✣",
      health: isBharati ? 98 : 94,
      status: "OPTIMAL",
      metrics: [
        { label: "INDOOR TEMP", value: isBharati ? "+22.1°C" : "+21.4°C", state: "OPTIMAL" },
        { label: "TARGET SETPOINT", value: "+22.0°C", state: "NOMINAL" },
        { label: "HUMIDITY", value: isBharati ? "43.8%" : "41.2%", state: "NOMINAL" },
        { label: "GLYCOL TEMP", value: isBharati ? "65.0°C (Supply)" : "62.4°C (Supply)", state: "ACTIVE" },
        { label: "HEATING LOAD", value: isBharati ? "74.2 kW" : "68.5 kW", state: "ACTIVE" },
        { label: "AIR EXCHANGES", value: isBharati ? "5.0 / hour" : "4.2 / hour", state: "OPTIMAL" },
      ],
      description: "Thermal insulated habitat envelope maintaining comfortable +21°C shirtsleeve environment against extreme polar blizzards.",
    },
    lab: {
      title: isBharati ? "Atmospheric Science & Cryosphere Spectrometry Labs" : "Environmental Science & Geomagnetic Laboratory Module",
      subsystem: "SCIENTIFIC PAYLOADS",
      route: "/dashboard/environment",
      icon: "△",
      health: 98,
      status: "ACTIVE",
      metrics: [
        { label: "SPECTROMETER", value: "ONLINE (99.8% SNR)", state: "OPTIMAL" },
        { label: "MAGNETOMETER", value: "DATA STREAMING", state: "OPTIMAL" },
        { label: "SEISMIC NODE", value: "TRI-AXIAL RECORDING", state: "OPTIMAL" },
        { label: "LAB TEMP", value: "+21.5°C", state: "OPTIMAL" },
      ],
      description: "Dedicated scientific laboratory conducting real-time upper atmosphere, geomagnetic field, and ice core analysis.",
    },
    satcom: {
      title: isBharati ? "INSAT-4CR Dual Radome High-Gain SATCOM Mast" : "INSAT Parabolic SATCOM & Meteorological Mast",
      subsystem: "COMMUNICATIONS & SATCOM",
      route: "/dashboard/overview",
      icon: "◈",
      health: 99,
      status: "CONNECTED",
      metrics: [
        { label: "CARRIER UPLINK", value: "INSAT-4CR (C-Band)", state: "LOCKED" },
        { label: "LINK QUALITY", value: isBharati ? "99.4% (SNR 14.8 dB)" : "98.7% (SNR 14.1 dB)", state: "OPTIMAL" },
        { label: "ROUND-TRIP LATENCY", value: isBharati ? "612 ms" : "742 ms", state: "OPTIMAL" },
        { label: "TELEMETRY PIPE", value: "AES-256 ENCRYPTED", state: "SECURE" },
      ],
      description: "Continuous encrypted satellite uplink transmitting station SCADA telemetry to NCPOR Headquarters Goa and MoES New Delhi.",
    },
    fuel: {
      title: isBharati ? "Bulk Hydrocarbon Fuel Tank Farm (Tanks 1-4)" : "Insulated Fuel Storage Farm & Heated Pipeline Network",
      subsystem: "FUEL SYSTEMS",
      route: "/dashboard/fuel",
      icon: "◉",
      health: isBharati ? 94 : 88,
      status: "STABLE",
      metrics: [
        { label: "TOTAL STORAGE", value: isBharati ? "136,800 L (76.0%)" : "81,600 L (68.0%)", state: "NORMAL" },
        { label: "DAYS REMAINING", value: isBharati ? "235.5 Days" : "119.3 Days", state: "OPTIMAL" },
        { label: "BURN RATE", value: isBharati ? "24.2 L/h" : "28.5 L/h", state: "NORMAL" },
        { label: "TRACE HEATING", value: "ACTIVE (42°C Glycol)", state: "ENGAGED" },
      ],
      description: "Arctic low-pour Jet A-1 fuel farm equipped with automated level sensors, heat tracing, and containment bunds.",
    },
    water: {
      title: isBharati ? "Seawater Desalination RO & Continuous Snow Melter" : "Priyadarshini Lake Sub-Ice Water Line & Thermal Melter",
      subsystem: "WATER & LIFE SUPPORT",
      route: "/dashboard/water",
      icon: "◌",
      health: isBharati ? 95 : 91,
      status: "OPTIMAL",
      metrics: [
        { label: "POTABLE STORAGE", value: isBharati ? "23,500 L (94%)" : "18,200 L (91%)", state: "OPTIMAL" },
        { label: "DAILY PRODUCTION", value: isBharati ? "1,900 L/day" : "1,600 L/day", state: "ACCUMULATING" },
        { label: "DAILY DEMAND", value: isBharati ? "1,720 L/day" : "1,450 L/day", state: "NORMAL" },
        { label: "PURIFICATION", value: "UV + Ozone Active", state: "OPTIMAL" },
      ],
      description: "Continuous water production and UV filtration maintaining abundant potable buffer for the winter expedition crew.",
    },
    solar: {
      title: "Renewable PV Solar Array & Microgrid Inverters",
      subsystem: "RENEWABLE ENERGY",
      route: "/dashboard/power",
      icon: "☀️",
      health: 98,
      status: "GENERATING",
      metrics: [
        { label: "PV GENERATION", value: isBharati ? "18.5 kW" : "12.4 kW", state: "ONLINE" },
        { label: "INVERTER EFFICIENCY", value: "98.2%", state: "OPTIMAL" },
        { label: "BESS BATTERY BUFFER", value: isBharati ? "96.2% SOC" : "92.4% SOC", state: "FLOAT_CHARGE" },
        { label: "GRID OFFSET", value: isBharati ? "7.2% Load" : "5.3% Load", state: "GREEN" },
      ],
      description: "Bi-facial polar solar array capturing both direct summer insolation and ground albedo reflection.",
    },
    helipad: {
      title: isBharati ? "Helipad Deck & Kamov Ka-32 Refueling Apron" : "Cargo Staging Yard & Snowcat Marshalling Apron",
      subsystem: "LOGISTICS & FLEET",
      route: "/dashboard/logistics",
      icon: "▣",
      health: 96,
      status: "READY",
      metrics: [
        { label: "APRON STATUS", value: "CLEAR / ICE-FREE", state: "READY" },
        { label: "AV-FUEL BOWSER", value: "10,800 L Ready", state: "READY" },
        { label: "ACTIVE VEHICLES", value: isBharati ? "8 Operational" : "6 Operational", state: "OPTIMAL" },
        { label: "WINTER READINESS", value: isBharati ? "96 / 100" : "92 / 100", state: "OPTIMAL" },
      ],
      description: "Heavy aviation helipad and logistics yard connecting station crew with transport helicopters and PistenBully convoys.",
    },
  };

  const details = componentDetailsMap[componentId] || componentDetailsMap.powerhouse;

  return (
    <div
      className="component-info-hud"
      style={{
        position: "absolute",
        bottom: "16px",
        left: "16px",
        right: "16px",
        maxWidth: "520px",
        background: "linear-gradient(135deg, rgba(8, 22, 34, 0.95) 0%, rgba(5, 15, 25, 0.98) 100%)",
        border: "1px solid rgba(0, 240, 255, 0.35)",
        borderRadius: "10px",
        padding: "16px 20px",
        boxShadow: "0 12px 40px rgba(0, 0, 0, 0.7), 0 0 20px rgba(0, 240, 255, 0.15)",
        backdropFilter: "blur(12px)",
        zIndex: 20,
        color: "#f1f5f9",
        animation: "fadeIn 0.25s ease-out",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "12px", borderBottom: "1px solid rgba(100, 200, 240, 0.15)", paddingBottom: "10px", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "6px",
              background: "rgba(0, 240, 255, 0.12)",
              border: "1px solid rgba(0, 240, 255, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              color: "#00f0ff",
            }}
          >
            {details.icon}
          </div>
          <div>
            <div style={{ fontSize: "10px", fontFamily: "monospace", letterSpacing: "1.5px", color: "#00f0ff", fontWeight: 700 }}>
              {details.subsystem} · {station}
            </div>
            <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.3px" }}>
              {details.title}
            </h4>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{
            background: "transparent",
            border: "none",
            color: "#94a3b8",
            cursor: "pointer",
            fontSize: "16px",
            padding: "2px 6px",
            borderRadius: "4px",
            lineHeight: 1,
          }}
          title="Close component telemetry HUD"
        >
          ✕
        </button>
      </div>

      {/* Metrics Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "8px 16px", marginBottom: "12px" }}>
        {details.metrics.map((m, idx) => (
          <div key={idx} style={{ background: "rgba(255, 255, 255, 0.03)", padding: "6px 10px", borderRadius: "4px", border: "1px solid rgba(255, 255, 255, 0.05)" }}>
            <div style={{ fontSize: "10px", color: "#94a3b8", fontFamily: "monospace" }}>{m.label}</div>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#38bdf8", marginTop: "2px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>{m.value}</span>
              <span style={{ fontSize: "9px", color: m.state === "OPTIMAL" || m.state === "RUNNING" || m.state === "LOCKED" ? "#10b981" : "#00f0ff" }}>
                ● {m.state}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Description */}
      <p style={{ fontSize: "11px", color: "#cbd5e1", margin: "0 0 12px 0", lineHeight: "1.4" }}>
        {details.description}
      </p>

      {/* Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "10px", borderTop: "1px solid rgba(255, 255, 255, 0.08)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "#94a3b8" }}>Health Score:</span>
          <strong style={{ fontSize: "12px", color: "#10b981" }}>{details.health}%</strong>
        </div>

        <button
          type="button"
          onClick={() => navigate(details.route)}
          style={{
            background: "linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(2, 132, 199, 0.3))",
            border: "1px solid rgba(0, 240, 255, 0.4)",
            color: "#00f0ff",
            padding: "5px 12px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 700,
            letterSpacing: "0.5px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <span>OPEN SUBSYSTEM</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}

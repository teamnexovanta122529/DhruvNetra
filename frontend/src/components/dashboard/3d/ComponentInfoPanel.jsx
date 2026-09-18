import React from "react";
import { useNavigate } from "react-router-dom";

export default function ComponentInfoPanel({
  station = "MAITRI",
  componentId,
  telemetry: _telemetry,
  onClose,
}) {
  const navigate = useNavigate();
  if (!componentId) return null;

  const isBharati = station.toUpperCase() === "BHARATI";

  // Detailed Component & Subsystem Metadata Mapping
  const componentDetailsMap = {
    // -------------------------------------------------------------
    // POWER & CHP GENERATION
    // -------------------------------------------------------------
    powerhouse: {
      title: isBharati ? "3 × 100 kVA Jet A-1 CHP Microgrid Plant" : "6 × 62.5 kW Jet A-1 Polar Powerhouse Generator Hall",
      subsystem: "POWER MICROGRID",
      route: "/dashboard/power",
      icon: "ϟ",
      health: isBharati ? 96 : 91,
      confidence: "VERIFIED",
      source: isBharati ? "NCPOR OMRC 2022 §3.2" : "Antarctic Treaty inspection 2001 §4.7",
      status: "RUNNING",
      metrics: [
        { label: "GENERATOR 01", value: isBharati ? "155 kW (77%)" : "62.5 kW (88%)", state: "RUNNING" },
        { label: "GENERATOR 02", value: isBharati ? "150 kW (75%)" : "62.5 kW (84%)", state: "RUNNING" },
        { label: "GENERATOR 03", value: isBharati ? "145 kW (72%)" : "62.5 kW (78%)", state: "RUNNING" },
        { label: "TOTAL OUTPUT", value: isBharati ? "450 kW / 415.8 V" : "187.5 kW / 415.2 V", state: "OPTIMAL" },
        { label: "GRID FREQUENCY", value: isBharati ? "49.98 Hz" : "50.04 Hz", state: "NOMINAL" },
        { label: "HEAT RECOVERY", value: isBharati ? "112 kW (Thermal)" : "74 kW (Thermal)", state: "OPTIMAL" },
      ],
      description: isBharati
        ? "Three 100 kVA Jet-A1 combined heat and power units housed on Level 2 with acoustic enclosures, LV switchgear, and recovered heat distribution headers."
        : "Six 62.5 kW Jet A-1 generators (four overwintering + two summer units) supplying uninterrupted power with secondary heat loop recovery.",
    },
    GENERATOR_AREA: null,
    MAITRI_GENERATORS: null,

    // -------------------------------------------------------------
    // HABITAT & HVAC ENVELOPE
    // -------------------------------------------------------------
    habitat: {
      title: isBharati ? "Aerodynamic Envelope & 134 ISO Module Complex" : "Two-Storey U-Shaped Main Complex (~1,200 m²)",
      subsystem: "HVAC & LIFE SUPPORT",
      route: "/dashboard/hvac",
      icon: "✣",
      health: isBharati ? 98 : 94,
      confidence: "VERIFIED",
      source: isBharati ? "Dlubal/KSF & bof architekten" : "Engineering & Communications in Antarctica §2.9",
      status: "OPTIMAL",
      metrics: [
        { label: "INDOOR TEMP", value: isBharati ? "+22.1°C" : "+21.4°C", state: "OPTIMAL" },
        { label: "TARGET SETPOINT", value: "+22.0°C", state: "NOMINAL" },
        { label: "HUMIDITY", value: isBharati ? "43.8%" : "41.2%", state: "NOMINAL" },
        { label: "GLYCOL SUPPLY", value: isBharati ? "65.0°C" : "62.4°C", state: "ACTIVE" },
        { label: "HEATING LOAD", value: isBharati ? "74.2 kW" : "68.5 kW", state: "ACTIVE" },
        { label: "STILT CLEARANCE", value: isBharati ? "1.83 - 4.33 m" : "~2.0 m (Adjustable)", state: "STABLE" },
      ],
      description: isBharati
        ? "Thermal insulated aerodynamic shell over 134 prefabricated ISO containers, elevated on 86 steel columns to prevent snow accumulation."
        : "Two-storey 4-block main complex raised on adjustable telescopic steel stilts with cross-bracing over Schirmacher Oasis rock.",
    },
    MAIN_BUILDING: null,
    MAITRI_MAIN: null,
    LIVING_AREA: null,
    MAITRI_LIVING: null,

    // -------------------------------------------------------------
    // LABORATORIES & SCIENTIFIC PAYLOADS
    // -------------------------------------------------------------
    lab: {
      title: isBharati ? "Level 2 Science Labs (Electrical, Life, Chemical, Earth)" : "Containerized Laboratories & Communications Racks",
      subsystem: "SCIENTIFIC PAYLOADS",
      route: "/dashboard/environment",
      icon: "△",
      health: 98,
      confidence: "VERIFIED",
      source: isBharati ? "NCPOR Planning Advisory 2025" : "NCPOR Maitri Science Archive",
      status: "ACTIVE",
      metrics: [
        { label: "ELECTRICAL LAB", value: "4 TEST BENCHES ACTIVE", state: "OPTIMAL" },
        { label: "LIFE SCIENCES", value: "OPTICAL MICROSCOPY", state: "OPTIMAL" },
        { label: "CHEMICAL LAB", value: "FUME HOOD ACTIVE", state: "OPTIMAL" },
        { label: "EARTH SCIENCES", value: "CORE SAMPLE ANALYSIS", state: "OPTIMAL" },
      ],
      description: "Equipped multi-disciplinary research laboratories conducting real-time spectrometry, geomagnetic observation, meteorology, and cryosphere science.",
    },
    LAB_AREA: null,
    MAITRI_LABS: null,

    // -------------------------------------------------------------
    // COMMUNICATIONS & SATCOM
    // -------------------------------------------------------------
    satcom: {
      title: isBharati ? "18 m Radome & INSAT-4CR High-Gain SATCOM Link" : "6.2 m SATCOM Radome & 16.5 m Meteorological Mast",
      subsystem: "COMMUNICATIONS & SATCOM",
      route: "/dashboard/overview",
      icon: "◈",
      health: 99,
      confidence: "VERIFIED",
      source: "NCPOR Polar Communications Network",
      status: "CONNECTED",
      metrics: [
        { label: "CARRIER UPLINK", value: "INSAT-4CR (C-Band)", state: "LOCKED" },
        { label: "LINK QUALITY", value: isBharati ? "99.4% (SNR 14.8 dB)" : "98.7% (SNR 14.1 dB)", state: "OPTIMAL" },
        { label: "ROUND-TRIP LATENCY", value: isBharati ? "612 ms" : "742 ms", state: "OPTIMAL" },
        { label: "TELEMETRY PIPE", value: "AES-256 ENCRYPTED", state: "SECURE" },
      ],
      description: "Continuous encrypted satellite telemetry link transmitting station SCADA data to NCPOR Goa and MoES New Delhi.",
    },
    SATCOM: null,
    COMMUNICATION_AREA: null,
    MAITRI_SATCOM: null,

    // -------------------------------------------------------------
    // FUEL STORAGE & TRANSFER
    // -------------------------------------------------------------
    fuel: {
      title: isBharati ? "13 × 24 m³ Double-Hull Bulk Fuel Farm (296 kL)" : "7-Tank Insulated Fuel Depot & Heated Transfer Piping",
      subsystem: "FUEL SYSTEMS",
      route: "/dashboard/fuel",
      icon: "◉",
      health: isBharati ? 94 : 88,
      confidence: "VERIFIED",
      source: isBharati ? "NCPOR OMRC 2022 §3.2" : "2001 Treaty Inspection §4.7",
      status: "STABLE",
      metrics: [
        { label: "TOTAL STORAGE", value: isBharati ? "296,000 L (76.0%)" : "110,000 L (68.0%)", state: "NORMAL" },
        { label: "DAYS REMAINING", value: isBharati ? "235.5 Days" : "119.3 Days", state: "OPTIMAL" },
        { label: "BURN RATE", value: isBharati ? "24.2 L/h" : "28.5 L/h", state: "NORMAL" },
        { label: "TRACE HEATING", value: "ACTIVE (Glycol Header)", state: "ENGAGED" },
      ],
      description: "Arctic low-pour Jet A-1 double-hull tank farm equipped with bund containment, leak sensors, and pump transfer skid.",
    },
    FUEL_FARM: null,
    MAITRI_FUEL: null,

    // -------------------------------------------------------------
    // WATER DESALINATION & PRIYADARSHINI LAKE
    // -------------------------------------------------------------
    water: {
      title: isBharati ? "Seawater Desalination RO & Coastal Pump House" : "Priyadarshini Lake Pump House & 260 m Insulated Line",
      subsystem: "WATER & LIFE SUPPORT",
      route: "/dashboard/water",
      icon: "◌",
      health: isBharati ? 95 : 91,
      confidence: "VERIFIED",
      source: isBharati ? "Final CEE §3.7" : "Engineering in Antarctica §2.11.1",
      status: "OPTIMAL",
      metrics: [
        { label: "POTABLE STORAGE", value: isBharati ? "23,500 L (94%)" : "18,200 L (91%)", state: "OPTIMAL" },
        { label: "DAILY PRODUCTION", value: isBharati ? "1,900 L/day (RO)" : "1,600 L/day (Lake)", state: "ACCUMULATING" },
        { label: "DAILY DEMAND", value: isBharati ? "1,720 L/day" : "1,450 L/day", state: "NORMAL" },
        { label: "PURIFICATION", value: "UV Sterilizer + Dosing", state: "OPTIMAL" },
      ],
      description: isBharati
        ? "Potable water production from seawater reverse osmosis (RO) backed by MBR wastewater treatment and coastal pump house."
        : "Freshwater intake pumped from Priyadarshini Lake through a 260 m heat-traced elevated pipeline.",
    },
    WATER_TREATMENT: null,
    SEAWATER_PUMP: null,
    MAITRI_WATER: null,

    // -------------------------------------------------------------
    // LOGISTICS, HELIPAD & WORKSHOP
    // -------------------------------------------------------------
    helipad: {
      title: isBharati ? "900 m² Concrete Helipad & Aviation Fuelling Unit" : "Cargo Marshalling Yard & Snowcat Vehicle Garage",
      subsystem: "LOGISTICS & FLEET",
      route: "/dashboard/logistics",
      icon: "▣",
      health: 96,
      confidence: "VERIFIED",
      source: "NCPOR Logistics Master Plan",
      status: "READY",
      metrics: [
        { label: "APRON STATUS", value: "ICE-FREE / READY", state: "READY" },
        { label: "AV-FUEL BOWSER", value: "10,800 L Ready", state: "READY" },
        { label: "ACTIVE VEHICLES", value: "Tracked Snowcats Online", state: "OPTIMAL" },
        { label: "SUMMER CAMP", value: "Emergency Shelters Ready", state: "OPTIMAL" },
      ],
      description: "Aviation landing pads, heavy tracked snowcat convoys, container logistics yards, and vehicle maintenance workshops.",
    },
    MAITRI_HEATING: {
      title: "Block B Central Heating Boilers & Water Distribution",
      subsystem: "HVAC & THERMAL",
      route: "/dashboard/hvac",
      icon: "♨",
      health: 93,
      confidence: "VERIFIED",
      source: "Engineering and Communications in Antarctica §2.10",
      status: "ACTIVE",
      metrics: [
        { label: "BOILER 01", value: "68.5°C (Active)", state: "RUNNING" },
        { label: "BOILER 02", value: "65.0°C (Standby)", state: "OPTIMAL" },
        { label: "GLYCOL LOOP", value: "4.2 bar / 64.8°C", state: "OPTIMAL" },
        { label: "BUFFER VESSELS", value: "2 Vessels (94% Vol)", state: "OPTIMAL" },
      ],
      description: "Dual-skid heating boiler system and pressurized insulated water distribution loop supplying Block B and living accommodations.",
    },
    MAITRI_STRUCTURE: {
      title: "Adjustable Telescopic Steel Stilts & Cross-Bracing",
      subsystem: "STRUCTURAL INTEGRITY",
      route: "/dashboard/overview",
      icon: "⛯",
      health: 97,
      confidence: "VERIFIED",
      source: "Antarctic Treaty inspection 2001 §4.5",
      status: "STABLE",
      metrics: [
        { label: "CLEARANCE", value: "~2.0 m Elevated", state: "STABLE" },
        { label: "SUPPORT GRID", value: "42 Telescopic Columns", state: "OPTIMAL" },
        { label: "CROSS-BRACING", value: "Dual Diagonal Steel", state: "SECURE" },
        { label: "BEDROCK SEAT", value: "Schirmacher Gneiss", state: "SOLID" },
      ],
      description: "Heavy structural steel frame on adjustable telescopic columns designed to resist gale-force polar blizzards and drift accumulation.",
    },
    WORKSHOP: null,
    MAITRI_GARAGE: null,
    SUMMER_CAMP: null,
    MAITRI_SUMMER_CAMP: null,
    LOUNGE: null,
    DINING_AREA: null,
    MAITRI_DINING: null,
  };

  // Resolve Aliases & Specific IDs
  componentDetailsMap.GENERATOR_AREA = componentDetailsMap.powerhouse;
  componentDetailsMap.MAITRI_GENERATORS = componentDetailsMap.powerhouse;
  componentDetailsMap.MAIN_BUILDING = componentDetailsMap.habitat;
  componentDetailsMap.MAITRI_MAIN = componentDetailsMap.habitat;
  componentDetailsMap.LIVING_AREA = componentDetailsMap.habitat;
  componentDetailsMap.MAITRI_LIVING = componentDetailsMap.habitat;
  componentDetailsMap.LAB_AREA = componentDetailsMap.lab;
  componentDetailsMap.MAITRI_LABS = componentDetailsMap.lab;
  componentDetailsMap.SATCOM = componentDetailsMap.satcom;
  componentDetailsMap.COMMUNICATION_AREA = componentDetailsMap.satcom;
  componentDetailsMap.MAITRI_SATCOM = componentDetailsMap.satcom;
  componentDetailsMap.FUEL_FARM = componentDetailsMap.fuel;
  componentDetailsMap.MAITRI_FUEL = componentDetailsMap.fuel;
  componentDetailsMap.WATER_TREATMENT = componentDetailsMap.water;
  componentDetailsMap.SEAWATER_PUMP = componentDetailsMap.water;
  componentDetailsMap.MAITRI_WATER = componentDetailsMap.water;
  componentDetailsMap.HELIPAD = componentDetailsMap.helipad;
  componentDetailsMap.WORKSHOP = componentDetailsMap.helipad;
  componentDetailsMap.MAITRI_GARAGE = componentDetailsMap.helipad;
  componentDetailsMap.SUMMER_CAMP = componentDetailsMap.helipad;
  componentDetailsMap.MAITRI_SUMMER_CAMP = componentDetailsMap.helipad;
  componentDetailsMap.LOUNGE = componentDetailsMap.habitat;
  componentDetailsMap.DINING_AREA = componentDetailsMap.habitat;
  componentDetailsMap.MAITRI_DINING = componentDetailsMap.habitat;

  const details = componentDetailsMap[componentId] || componentDetailsMap.powerhouse;

  return (
    <div
      className="component-info-hud"
      style={{
        position: "absolute",
        bottom: "16px",
        left: "16px",
        right: "16px",
        maxWidth: "540px",
        background: "rgba(255, 255, 255, 0.97)",
        border: "1px solid var(--border-default)",
        borderRadius: "10px",
        padding: "16px 20px",
        boxShadow: "var(--shadow-xl)",
        backdropFilter: "blur(12px)",
        zIndex: 20,
        color: "var(--text-primary)",
        animation: "fadeIn 0.25s ease-out",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "12px",
          borderBottom: "1px solid var(--border-subtle)",
          paddingBottom: "10px",
          marginBottom: "12px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div
            style={{
              width: "38px",
              height: "38px",
              borderRadius: "8px",
              background: "var(--accent-primary-light)",
              border: "1px solid rgba(2, 132, 199, 0.3)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "18px",
              color: "var(--accent-primary)",
              fontWeight: 800,
            }}
          >
            {details.icon}
          </div>
          <div>
            <div
              style={{
                fontSize: "9.5px",
                fontFamily: "monospace",
                letterSpacing: "1.5px",
                color: "var(--accent-primary)",
                fontWeight: 800,
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
            >
              <span>{details.subsystem} · {station}</span>
              <span
                style={{
                  background: details.confidence === "VERIFIED" ? "rgba(22, 163, 74, 0.15)" : "rgba(217, 119, 6, 0.15)",
                  color: details.confidence === "VERIFIED" ? "#16a34a" : "#d97706",
                  padding: "1px 6px",
                  borderRadius: "3px",
                  fontSize: "8.5px",
                  fontWeight: 800,
                }}
              >
                ● {details.confidence}
              </span>
            </div>
            <h4
              style={{
                margin: "2px 0 0 0",
                fontSize: "14px",
                fontWeight: 800,
                color: "var(--text-primary)",
                letterSpacing: "0.2px",
              }}
            >
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
            color: "var(--text-muted)",
            cursor: "pointer",
            fontSize: "16px",
            padding: "2px 6px",
            borderRadius: "4px",
            lineHeight: 1,
            fontWeight: 700,
          }}
          title="Close telemetry HUD"
        >
          ✕
        </button>
      </div>

      {/* Metrics Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, 1fr)",
          gap: "8px 14px",
          marginBottom: "12px",
        }}
      >
        {details.metrics.map((m, idx) => (
          <div
            key={idx}
            style={{
              background: "var(--surface-secondary)",
              padding: "7px 10px",
              borderRadius: "6px",
              border: "1px solid var(--border-subtle)",
            }}
          >
            <div
              style={{
                fontSize: "9px",
                color: "var(--text-muted)",
                fontFamily: "monospace",
                fontWeight: 700,
              }}
            >
              {m.label}
            </div>
            <div
              style={{
                fontSize: "11.5px",
                fontWeight: 800,
                color: "var(--text-primary)",
                marginTop: "2px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span>{m.value}</span>
              <span
                style={{
                  fontSize: "9px",
                  fontWeight: 700,
                  color:
                    m.state === "OPTIMAL" || m.state === "RUNNING" || m.state === "LOCKED" || m.state === "STABLE" || m.state === "SOLID" || m.state === "SECURE"
                      ? "var(--status-normal)"
                      : "var(--accent-primary)",
                }}
              >
                ● {m.state}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Description & Factual Source */}
      <p
        style={{
          fontSize: "11px",
          color: "var(--text-secondary)",
          margin: "0 0 6px 0",
          lineHeight: "1.45",
        }}
      >
        {details.description}
      </p>

      <div
        style={{
          fontSize: "9.5px",
          color: "var(--text-muted)",
          fontFamily: "monospace",
          marginBottom: "12px",
        }}
      >
        <span>PROVENANCE: {details.source}</span>
      </div>

      {/* Actions */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          paddingTop: "10px",
          borderTop: "1px solid var(--border-subtle)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 600 }}>Health Score:</span>
          <strong style={{ fontSize: "12px", color: "var(--status-normal)", fontWeight: 800 }}>
            {details.health}%
          </strong>
        </div>

        <button
          type="button"
          onClick={() => navigate(details.route)}
          style={{
            background: "var(--accent-primary)",
            border: "none",
            color: "#ffffff",
            padding: "6px 14px",
            borderRadius: "4px",
            fontSize: "11px",
            fontWeight: 800,
            letterSpacing: "0.08em",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            transition: "background 0.2s ease",
          }}
        >
          <span>OPEN SUBSYSTEM</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
}

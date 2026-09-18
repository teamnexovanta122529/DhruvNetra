import React, { Component, useEffect, useRef, useState } from "react";
import PageHeader from "../common/PageHeader";
import StatusBadge from "../common/StatusBadge";
import StationScene from "../3d/StationScene";
import { useStation } from "../../../context/StationContext";
import { useEnvironment } from "../../../context/EnvironmentContext";
import { getStationTelemetry } from "../../../services/telemetryService";

/* =========================================================
   3D DIGITAL TWIN ERROR BOUNDARY
========================================================= */
class DigitalTwinErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("[!] DHRUVNETRA Digital Twin Error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            height: "100%",
            minHeight: "560px",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "radial-gradient(circle at 50% 40%, #0f172a 0%, #020617 100%)",
            color: "#f8fafc",
            padding: "24px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "rgba(220, 38, 38, 0.2)",
              border: "1px solid rgba(220, 38, 38, 0.4)",
              display: "grid",
              placeItems: "center",
              fontSize: "20px",
              color: "#f87171",
              marginBottom: "16px",
            }}
          >
            ⚠️
          </div>
          <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "0 0 8px 0" }}>
            3D DIGITAL TWIN RENDER ADVISORY
          </h3>
          <p style={{ fontSize: "12px", color: "#94a3b8", maxWidth: "460px", margin: "0 0 20px 0" }}>
            {this.state.error?.message || "WebGL context temporarily interrupted or 3D scene reload required."}
          </p>
          <button
            type="button"
            onClick={() => this.setState({ hasError: false, error: null })}
            style={{
              padding: "8px 20px",
              background: "var(--accent-primary, #0284c7)",
              color: "#ffffff",
              border: "none",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            REINITIALIZE 3D TWIN
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function DigitalTwin() {
  const { station, stationInfo } = useStation();
  const { environment, isLoading, isUnavailable, timeSinceUpdate } = useEnvironment();
  const [resetCount, setResetCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState(null);
  const panelRef = useRef(null);

  // 3D Architectural Reconstruction Controls
  const [sceneMode, setSceneMode] = useState("exterior"); // 'exterior' | 'cutaway' | 'interior' | 'structure'
  const [floorMode, setFloorMode] = useState("all"); // 'all' | 'lower' | 'upper'
  const [lightingMode, setLightingMode] = useState("day"); // 'day' | 'overcast' | 'night'
  const [bookmark, setBookmark] = useState("overview");

  // Reset selected component when station changes
  useEffect(() => {
    setSelectedComponent(null);
    setBookmark("overview");
  }, [station]);

  const telemetry = getStationTelemetry(station);
  const isBharati = String(station || "MAITRI").toUpperCase() === "BHARATI";

  // Fullscreen listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      const active = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
      );
      setIsFullscreen(active);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
    document.addEventListener("mozfullscreenchange", handleFullscreenChange);
    document.addEventListener("MSFullscreenChange", handleFullscreenChange);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
      document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
      document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
    };
  }, []);

  // Reset Camera View
  const handleResetView = () => {
    setBookmark("overview");
    setResetCount((prev) => prev + 1);
  };

  // Fullscreen Toggle
  const handleToggleFullscreen = async () => {
    try {
      if (!isFullscreen) {
        const target = panelRef.current;
        if (!target) return;
        if (target.requestFullscreen) await target.requestFullscreen();
        else if (target.webkitRequestFullscreen) await target.webkitRequestFullscreen();
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen) await document.webkitExitFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed:", err);
    }
  };

  const handleBookmarkChange = (bmKey) => {
    setBookmark(bmKey);
    if (bmKey === "overview") {
      setSelectedComponent("habitat");
    } else if (bmKey === "lounge") {
      setSelectedComponent("habitat");
      if (sceneMode === "exterior") setSceneMode("cutaway");
    } else if (bmKey === "laboratory") {
      setSelectedComponent("lab");
      if (sceneMode === "exterior") setSceneMode("cutaway");
      setFloorMode("lower");
    } else if (bmKey === "utilities") {
      setSelectedComponent("powerhouse");
    } else if (bmKey === "entrance") {
      setSelectedComponent("habitat");
    }
  };

  return (
    <div className="dashboard-page digital-twin-page">
      <PageHeader
        eyebrow={`DHRUVNETRA / DIGITAL TWIN · ${stationInfo.coordinates || ""}`}
        title={`${station} 3D DIGITAL TWIN`}
        description={`INTERACTIVE 3D ARCHITECTURAL & MULTI-PHYSICS TELEMETRY TWIN OF ${station} STATION (${stationInfo.location})`}
        status="DIGITAL TWIN ONLINE"
      />

      {/* QUICK INSTRUCTION HINT STRIP */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "var(--surface-card)",
          border: "1px solid var(--border-default)",
          borderRadius: 6,
          padding: "0.6rem 1rem",
          marginBottom: "1rem",
          fontSize: "0.75rem",
          fontFamily: "monospace",
          color: "var(--text-secondary)",
          flexWrap: "wrap",
          gap: "0.5rem",
          boxShadow: "var(--shadow-xs)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ color: "var(--accent-primary)", fontWeight: 800 }}>◈</span>
          <strong style={{ color: "var(--text-primary)" }}>CLICK ANY 3D BUILDING MODULE TO INSPECT LIVE SUBSYSTEM TELEMETRY</strong>
        </div>
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {["powerhouse", "habitat", "lab", "satcom", "fuel", "water", "helipad"].map((mod) => (
            <button
              key={mod}
              type="button"
              onClick={() => setSelectedComponent(mod)}
              style={{
                background: selectedComponent === mod ? "var(--accent-primary-light)" : "var(--surface-secondary)",
                border: `1px solid ${selectedComponent === mod ? "var(--accent-primary)" : "var(--border-subtle)"}`,
                color: selectedComponent === mod ? "var(--accent-primary)" : "var(--text-muted)",
                padding: "3px 9px",
                borderRadius: "4px",
                fontSize: "10px",
                fontWeight: 700,
                cursor: "pointer",
                textTransform: "uppercase",
                fontFamily: "monospace",
                transition: "all 0.15s ease",
              }}
            >
              {mod}
            </button>
          ))}
        </div>
      </div>

      <div className="digital-twin-layout">
        {/* 3D MODEL PANEL - FULL WIDTH PRIMARY VISUAL CENTERPIECE */}
        <section ref={panelRef} className={`station-3d-panel ${isFullscreen ? "is-fullscreen" : ""}`} style={{ position: "relative" }}>
          {/* HEADER WITH CONTROLS */}
          <div className="station-3d-header" style={{ flexWrap: "wrap", gap: "10px" }}>
            <div>
              <span>LIVE DIGITAL TWIN VIEWPORT</span>
              <strong>{station} / EAST ANTARCTICA</strong>
            </div>

            {/* RECONSTRUCTION CONTROLS TOOLBAR */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
              {/* Scene Mode Selector */}
              <div style={{ display: "flex", background: "var(--surface-secondary)", borderRadius: "4px", padding: "2px", border: "1px solid var(--border-subtle)" }}>
                {[
                  { id: "exterior", label: "EXTERIOR" },
                  { id: "cutaway", label: "CUTAWAY" },
                  { id: "interior", label: "INTERIOR" },
                  { id: "structure", label: "STRUCTURE" },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setSceneMode(m.id)}
                    style={{
                      background: sceneMode === m.id ? "var(--accent-primary)" : "transparent",
                      color: sceneMode === m.id ? "#ffffff" : "var(--text-muted)",
                      border: "none",
                      padding: "3px 8px",
                      borderRadius: "3px",
                      fontSize: "9.5px",
                      fontWeight: 800,
                      cursor: "pointer",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Floor Filter (When in interior / cutaway) */}
              {(sceneMode === "cutaway" || sceneMode === "interior") && (
                <div style={{ display: "flex", background: "var(--surface-secondary)", borderRadius: "4px", padding: "2px", border: "1px solid var(--border-subtle)" }}>
                  {[
                    { id: "all", label: "ALL" },
                    { id: "lower", label: isBharati ? "L2" : "LOWER" },
                    { id: "upper", label: isBharati ? "L3" : "UPPER" },
                  ].map((f) => (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFloorMode(f.id)}
                      style={{
                        background: floorMode === f.id ? "var(--accent-primary-light)" : "transparent",
                        color: floorMode === f.id ? "var(--accent-primary)" : "var(--text-muted)",
                        border: `1px solid ${floorMode === f.id ? "var(--accent-primary)" : "transparent"}`,
                        padding: "3px 7px",
                        borderRadius: "3px",
                        fontSize: "9px",
                        fontWeight: 700,
                        cursor: "pointer",
                      }}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
              )}

              {/* Lighting Presets */}
              <div style={{ display: "flex", background: "var(--surface-secondary)", borderRadius: "4px", padding: "2px", border: "1px solid var(--border-subtle)" }}>
                {[
                  { id: "day", icon: "☀️", label: "DAY" },
                  { id: "overcast", icon: "☁️", label: "CLOUDS" },
                  { id: "night", icon: "🌙", label: "NIGHT" },
                ].map((l) => (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => setLightingMode(l.id)}
                    title={`Lighting: ${l.label}`}
                    style={{
                      background: lightingMode === l.id ? "var(--surface-card)" : "transparent",
                      color: lightingMode === l.id ? "var(--accent-primary)" : "var(--text-muted)",
                      border: `1px solid ${lightingMode === l.id ? "var(--border-default)" : "transparent"}`,
                      padding: "3px 6px",
                      borderRadius: "3px",
                      fontSize: "10px",
                      cursor: "pointer",
                    }}
                  >
                    {l.icon}
                  </button>
                ))}
              </div>

              {/* RESET & FULLSCREEN BUTTONS */}
              <div className="model-controls">
                <button
                  type="button"
                  className="control-btn reset-btn"
                  onClick={handleResetView}
                  title="Reset 3D camera to overview (↻)"
                >
                  <span className="control-icon">↻</span>
                  <span>RESET</span>
                </button>

                <button
                  type="button"
                  className={`control-btn fullscreen-btn ${isFullscreen ? "active" : ""}`}
                  onClick={handleToggleFullscreen}
                  title={isFullscreen ? "Exit Fullscreen (Esc)" : "Expand 3D Viewport (⛶)"}
                >
                  <span className="control-icon">{isFullscreen ? "✕" : "⛶"}</span>
                  <span>{isFullscreen ? "EXIT" : "FULLSCREEN"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* BOOKMARK PRESET VIEWPORT BAR */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "5px",
              padding: "5px 14px",
              background: "rgba(241, 245, 249, 0.95)",
              borderBottom: "1px solid var(--border-subtle)",
              overflowX: "auto",
              fontSize: "10px",
              fontFamily: "monospace",
              zIndex: 5,
            }}
          >
            <span style={{ color: "var(--text-muted)", fontWeight: 700, marginRight: "4px" }}>CAM PRESETS:</span>
            {[
              { id: "overview", label: "01 OVERVIEW" },
              { id: "north", label: "02 FAÇADE" },
              { id: "entrance", label: "03 ENTRANCE" },
              { id: "lounge", label: isBharati ? "04 LOUNGE" : "04 DINING" },
              { id: "laboratory", label: "05 LABS" },
              { id: "utilities", label: isBharati ? "06 CHP+WATER" : "06 GENERATORS" },
              { id: "site", label: "07 FULL SITE" },
            ].map((bm) => (
              <button
                key={bm.id}
                type="button"
                onClick={() => handleBookmarkChange(bm.id)}
                style={{
                  background: bookmark === bm.id ? "var(--accent-primary-light)" : "transparent",
                  color: bookmark === bm.id ? "var(--accent-primary)" : "var(--text-secondary)",
                  border: `1px solid ${bookmark === bm.id ? "var(--accent-primary)" : "transparent"}`,
                  padding: "2px 7px",
                  borderRadius: "3px",
                  fontWeight: bookmark === bm.id ? 800 : 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.15s ease",
                }}
              >
                {bm.label}
              </button>
            ))}
          </div>

          <div className="station-3d-view">
            <DigitalTwinErrorBoundary>
              <StationScene
                station={station}
                resetTrigger={resetCount}
                selectedComponent={selectedComponent}
                onSelectComponent={setSelectedComponent}
                telemetry={telemetry}
                sceneMode={sceneMode}
                floorMode={floorMode}
                lightingMode={lightingMode}
                bookmark={bookmark}
              />
            </DigitalTwinErrorBoundary>
          </div>

          <div className="station-3d-footer">
            <span>MODEL STATUS : ONLINE ({stationInfo.status || "OPERATIONAL"})</span>
            <span>ELEVATION : {stationInfo.elevation || "117 m"} · EST. {stationInfo.established || "1989"}</span>
            <span>INTERACTION : CLICK ANY MESH · DRAG TO ORBIT · SCROLL TO ZOOM · SHIFT+DRAG TO PAN</span>
          </div>
        </section>

        {/* OVERVIEW CARDS: COMPUTED STATION HEALTH & WEATHER TELEMETRY */}
        <div className="digital-twin-cards-grid">
          {/* COMPUTED STATION HEALTH */}
          <section className="dashboard-panel digital-twin-health-panel">
            <div className="panel-heading">
              <span>COMPUTED STATION HEALTH</span>
              <StatusBadge status={telemetry.health.status} type={telemetry.health.overallHealth >= 90 ? "normal" : "warning"} />
            </div>

            <div className="health-score">
              <div className="health-circle">
                <strong>{telemetry.health.overallHealth}</strong>
                <span>/100</span>
              </div>
              <div>
                <strong>OPERATIONAL HEALTH</strong>
                <p>Calculated dynamically from live microgrid, fuel burn, thermal, and water life support metrics.</p>
              </div>
            </div>

            <div className="health-list">
              <HealthRow name="POWER MICROGRID" value={`${telemetry.health.breakdown.power}%`} />
              <HealthRow name="FUEL RESERVES" value={`${telemetry.health.breakdown.fuel}%`} />
              <HealthRow name="HVAC LIFE SUPPORT" value={`${telemetry.health.breakdown.hvac}%`} />
              <HealthRow name="POTABLE WATER" value={`${telemetry.health.breakdown.water}%`} />
              <HealthRow name="ENVIRONMENT" value={`${telemetry.health.breakdown.environment}%`} />
              <HealthRow name="LOGISTICS FLEET" value={`${telemetry.health.breakdown.logistics}%`} />
            </div>
          </section>

          {/* WEATHER SNAPSHOT */}
          <section className="dashboard-panel weather-panel digital-twin-weather-panel">
            <div className="panel-heading">
              <span>WEATHER TELEMETRY</span>
              <span className={isUnavailable ? "weather-live offline" : "weather-live"}>
                {isUnavailable ? "● OFFLINE" : "● LIVE POLAR STREAM"}
              </span>
            </div>

            <div className="weather-main">
              <div className="weather-temperature">
                {isLoading
                  ? "..."
                  : isUnavailable
                  ? "N/A"
                  : environment?.current?.temperature_c !== null && environment?.current?.temperature_c !== undefined
                  ? `${environment.current.temperature_c > 0 ? "+" : ""}${environment.current.temperature_c}`
                  : stationInfo.outdoorTemp || "−24"}°
                <small>C</small>
              </div>

              <div className="weather-condition">
                <strong>
                  {isLoading
                    ? "FETCHING METEOROLOGY..."
                    : isUnavailable
                    ? "DATA UNAVAILABLE"
                    : (environment?.conditions?.weather || "POLAR CONDITIONS").toUpperCase()}
                </strong>
                <span>
                  {environment?.polar_indices?.wind_chill_c !== null && environment?.polar_indices?.wind_chill_c !== undefined
                    ? `Wind Chill: ${environment.polar_indices.wind_chill_c}°C · ${stationInfo.location}`
                    : stationInfo.location}
                </span>
              </div>
            </div>

            <div className="weather-grid">
              <WeatherItem
                label="WIND"
                value={isLoading ? "..." : isUnavailable ? "N/A" : environment?.current?.wind_speed_kmh ?? stationInfo.windSpeed}
                unit="KM/H"
              />
              <WeatherItem
                label="DIRECTION"
                value={isLoading ? "..." : isUnavailable ? "N/A" : environment?.current?.wind_direction_cardinal || stationInfo.windDirection}
              />
              <WeatherItem
                label="PRESSURE"
                value={isLoading ? "..." : isUnavailable ? "N/A" : environment?.current?.pressure_hpa ?? stationInfo.pressure}
                unit="HPA"
              />
              <WeatherItem
                label="HUMIDITY"
                value={isLoading ? "..." : isUnavailable ? "N/A" : environment?.current?.humidity_percent ?? stationInfo.humidity}
                unit="%"
              />
            </div>

            <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px solid var(--border-subtle, #e2e8f0)", fontSize: "10px", color: "var(--text-muted, #64748b)", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "var(--font-mono, monospace)" }}>
              <span>PROVENANCE: OPEN-METEO POLAR NWP</span>
              <span>{timeSinceUpdate}</span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

function HealthRow({ name, value }) {
  const num = parseInt(value, 10) || 85;
  return (
    <div className="health-row">
      <span>{name}</span>
      <div className="health-bar">
        <i
          style={{
            width: `${num}%`,
            background:
              num >= 90
                ? "var(--status-normal, #16a34a)"
                : num >= 75
                ? "var(--accent-primary, #0284c7)"
                : "var(--status-warning, #d97706)",
          }}
        />
      </div>
      <strong>{value}</strong>
    </div>
  );
}

function WeatherItem({ label, value, unit }) {
  return (
    <div className="weather-item">
      <span>{label}</span>
      <strong>
        {value}
        {unit && <small> {unit}</small>}
      </strong>
    </div>
  );
}

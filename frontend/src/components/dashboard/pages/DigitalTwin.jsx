import { useEffect, useRef, useState } from "react";
import PageHeader from "../common/PageHeader";
import StatusBadge from "../common/StatusBadge";
import StationScene from "../3d/StationScene";
import ComponentInfoPanel from "../3d/ComponentInfoPanel";
import { useStation } from "../../../context/StationContext";
import { useEnvironment } from "../../../context/EnvironmentContext";
import { getStationTelemetry } from "../../../services/telemetryService";

export default function DigitalTwin() {
  const { station, stationInfo } = useStation();
  const { environment, isLoading, isUnavailable, timeSinceUpdate } = useEnvironment();
  const [resetCount, setResetCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState("powerhouse");
  const panelRef = useRef(null);

  const telemetry = getStationTelemetry(station);

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

  return (
    <div className="dashboard-page digital-twin-page">
      <PageHeader
        eyebrow={`DHRUVNETRA / DIGITAL TWIN · ${stationInfo.coordinates || ""}`}
        title={`${station} 3D DIGITAL TWIN`}
        description={`INTERACTIVE 3D TELEMETRY TWIN OF ${station} ANTARCTIC RESEARCH STATION (${stationInfo.location})`}
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
          {["powerhouse", "habitat", "lab", "satcom", "fuel", "solar", "helipad"].map((mod) => (
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
          <div className="station-3d-header">
            <div>
              <span>LIVE DIGITAL TWIN VIEWPORT</span>
              <strong>{station} / EAST ANTARCTICA</strong>
            </div>

            <div className="model-controls">
              {/* RESET BUTTON */}
              <button
                type="button"
                className="control-btn reset-btn"
                onClick={handleResetView}
                title="Reset 3D camera to default orientation and zoom (↻)"
              >
                <span className="control-icon">↻</span>
                <span>RESET</span>
              </button>

              {/* FULLSCREEN BUTTON */}
              <button
                type="button"
                className={`control-btn fullscreen-btn ${isFullscreen ? "active" : ""}`}
                onClick={handleToggleFullscreen}
                title={isFullscreen ? "Exit Fullscreen (Esc)" : "Expand 3D Viewport to Fullscreen (⛶)"}
              >
                <span className="control-icon">{isFullscreen ? "✕" : "⛶"}</span>
                <span>{isFullscreen ? "EXIT FULLSCREEN" : "FULLSCREEN"}</span>
              </button>
            </div>
          </div>

          <div className="station-3d-view">
            <StationScene
              station={station}
              resetTrigger={resetCount}
              selectedComponent={selectedComponent}
              onSelectComponent={setSelectedComponent}
            />

            {/* FLOATING INTERACTIVE COMPONENT HUD */}
            {selectedComponent && (
              <ComponentInfoPanel
                station={station}
                componentId={selectedComponent}
                telemetry={telemetry}
                onClose={() => setSelectedComponent(null)}
              />
            )}
          </div>

          <div className="station-3d-footer">
            <span>MODEL STATUS : ONLINE ({stationInfo.status || "OPERATIONAL"})</span>
            <span>ELEVATION : {stationInfo.elevation || "117 m"} · EST. {stationInfo.established || "1989"}</span>
            <span>INTERACTION : CLICK MESH TO INSPECT · DRAG TO ROTATE · SCROLL TO ZOOM</span>
          </div>
        </section>

        {/* OVERVIEW CARDS: COMPUTED STATION HEALTH & WEATHER TELEMETRY (SIDE-BY-SIDE ON DESKTOP) */}
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

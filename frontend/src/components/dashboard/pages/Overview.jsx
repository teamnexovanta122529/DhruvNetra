import { useNavigate } from "react-router-dom";
import PageHeader from "../common/PageHeader";
import MetricCard from "../common/MetricCard";
import StatusBadge from "../common/StatusBadge";
import ProgressBar from "../common/ProgressBar";
import { useStation } from "../../../context/StationContext";
import { useEnvironment } from "../../../context/EnvironmentContext";
import { getStationTelemetry } from "../../../services/telemetryService";

export default function Overview() {
  const navigate = useNavigate();
  const { station, stationInfo } = useStation();
  const { environment, isLoading, isUnavailable } = useEnvironment();
  const telemetry = getStationTelemetry(station);

  const { power, fuel, hvac, water, logistics, alerts, health, lastUpdated } = telemetry;

  return (
    <div className="dashboard-page overview-page">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px" }}>
        <PageHeader
          eyebrow={`DHRUVNETRA / MISSION COMMAND · ${stationInfo.coordinates || ""}`}
          title={`${station} STATION OVERVIEW`}
          description={`REAL-TIME OPERATIONAL STATUS & DIGITAL TWIN TELEMETRY OF ${station} ANTARCTIC STATION (${stationInfo.location})`}
          status="STATION ONLINE"
        />

        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "12px" }}>
          <div
            style={{
              background: "rgba(10, 30, 45, 0.7)",
              border: "1px solid rgba(0, 240, 255, 0.3)",
              padding: "6px 12px",
              borderRadius: "20px",
              fontSize: "11px",
              color: "#9cd8e6",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              fontFamily: "monospace",
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#10b981", boxShadow: "0 0 8px #10b981", display: "inline-block" }} />
            <span>LIVE TELEMETRY · {lastUpdated}</span>
          </div>

          <button
            type="button"
            onClick={() => navigate("/dashboard/digital-twin")}
            style={{
              background: "linear-gradient(135deg, rgba(0, 240, 255, 0.25), rgba(2, 132, 199, 0.35))",
              border: "1px solid rgba(0, 240, 255, 0.5)",
              color: "#00f0ff",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            OPEN 3D DIGITAL TWIN ◇
          </button>
        </div>
      </div>

      {/* COMPUTED STATION HEALTH BANNER */}
      <section className="dashboard-panel" style={{ marginTop: "16px", padding: "18px 24px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", alignItems: "center" }}>
          {/* Health Gauge Box */}
          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
            <div
              style={{
                width: "80px",
                height: "80px",
                borderRadius: "50%",
                background: "radial-gradient(circle, rgba(0, 240, 255, 0.15) 0%, rgba(10, 25, 40, 0.8) 100%)",
                border: "2px solid #00f0ff",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 20px rgba(0, 240, 255, 0.3)",
              }}
            >
              <strong style={{ fontSize: "26px", fontWeight: 800, color: "#ffffff", lineHeight: 1 }}>
                {health.overallHealth}
              </strong>
              <span style={{ fontSize: "10px", color: "#67e8f9", fontFamily: "monospace" }}>/ 100</span>
            </div>

            <div>
              <div style={{ fontSize: "11px", fontFamily: "monospace", color: "#67e8f9", letterSpacing: "1.5px", fontWeight: 700 }}>
                STATION OPERATIONAL HEALTH
              </div>
              <h3 style={{ margin: "2px 0 4px 0", fontSize: "18px", color: "#ffffff", fontWeight: 700 }}>
                {health.status} STATUS
              </h3>
              <p style={{ margin: 0, fontSize: "12px", color: "#94a3b8", lineHeight: "1.3" }}>
                Computed dynamically from live multi-physics microgrid, fuel burn, and thermal envelope telemetry.
              </p>
            </div>
          </div>

          {/* Subsystem Health Progress Bars */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px 16px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8", marginBottom: "2px" }}>
                <span>Power</span>
                <strong style={{ color: "#00f0ff" }}>{health.breakdown.power}%</strong>
              </div>
              <ProgressBar value={health.breakdown.power} max={100} height={4} color="cyan" />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8", marginBottom: "2px" }}>
                <span>Fuel</span>
                <strong style={{ color: "#fbbf24" }}>{health.breakdown.fuel}%</strong>
              </div>
              <ProgressBar value={health.breakdown.fuel} max={100} height={4} color="amber" />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8", marginBottom: "2px" }}>
                <span>HVAC</span>
                <strong style={{ color: "#10b981" }}>{health.breakdown.hvac}%</strong>
              </div>
              <ProgressBar value={health.breakdown.hvac} max={100} height={4} color="green" />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8", marginBottom: "2px" }}>
                <span>Water</span>
                <strong style={{ color: "#38bdf8" }}>{health.breakdown.water}%</strong>
              </div>
              <ProgressBar value={health.breakdown.water} max={100} height={4} color="cyan" />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8", marginBottom: "2px" }}>
                <span>Environment</span>
                <strong style={{ color: "#e2e8f0" }}>{health.breakdown.environment}%</strong>
              </div>
              <ProgressBar value={health.breakdown.environment} max={100} height={4} color="cyan" />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#94a3b8", marginBottom: "2px" }}>
                <span>Logistics</span>
                <strong style={{ color: "#a7f3d0" }}>{health.breakdown.logistics}%</strong>
              </div>
              <ProgressBar value={health.breakdown.logistics} max={100} height={4} color="green" />
            </div>
          </div>
        </div>
      </section>

      {/* PRIMARY METRICS GRID */}
      <section className="metrics-grid" style={{ marginTop: "20px" }}>
        <div onClick={() => navigate("/dashboard/power")} style={{ cursor: "pointer" }}>
          <MetricCard
            label="POWER LOAD"
            value={power.summary.loadPercentage}
            unit="%"
            status={power.summary.status}
            trend={`${power.summary.currentGenerationKw} kW (${power.summary.activeGeneratorsCount} Gens Active)`}
          />
        </div>

        <div onClick={() => navigate("/dashboard/fuel")} style={{ cursor: "pointer" }}>
          <MetricCard
            label="FUEL RESERVES"
            value={fuel.summary.fuelPercentage}
            unit="%"
            status={fuel.summary.status}
            trend={`${Math.round(fuel.summary.estimatedDaysRemaining)} Days Buffer (${fuel.summary.consumptionRateLh} L/h)`}
          />
        </div>

        <div onClick={() => navigate("/dashboard/water")} style={{ cursor: "pointer" }}>
          <MetricCard
            label="POTABLE WATER"
            value={water.summary.percentage}
            unit="%"
            status={water.summary.status}
            trend={`${water.summary.currentLevelL.toLocaleString()} L (${water.summary.netDailyBalanceL})`}
          />
        </div>

        <div onClick={() => navigate("/dashboard/hvac")} style={{ cursor: "pointer" }}>
          <MetricCard
            label="INDOOR HVAC TEMP"
            value={hvac.summary.indoorAvgTempC}
            unit="°C"
            status="OPTIMAL"
            trend={`Ambient: ${stationInfo.environment || "−24°C"}`}
          />
        </div>
      </section>

      {/* SUBSYSTEM QUICK MONITORING GRID */}
      <section className="dashboard-section" style={{ marginTop: "24px" }}>
        <div className="section-heading">
          <div>
            <span>INTEGRATED SYSTEM MONITORING</span>
            <h2>CORE SUBSYSTEMS STATUS</h2>
          </div>
          <span className="section-live">● CONTINUOUS SCAN</span>
        </div>

        <div className="system-status-grid">
          <div onClick={() => navigate("/dashboard/power")} style={{ cursor: "pointer" }}>
            <SystemStatus
              name="POWER SYSTEM"
              value={`${power.summary.currentGenerationKw} kW`}
              detail={`${power.summary.activeGeneratorsCount} GENERATORS RUNNING`}
              status={power.summary.status}
            />
          </div>

          <div onClick={() => navigate("/dashboard/fuel")} style={{ cursor: "pointer" }}>
            <SystemStatus
              name="FUEL SYSTEM"
              value={`${fuel.summary.fuelPercentage}%`}
              detail={`${fuel.summary.currentLevelL.toLocaleString()} L STORED`}
              status={fuel.summary.status}
            />
          </div>

          <div onClick={() => navigate("/dashboard/hvac")} style={{ cursor: "pointer" }}>
            <SystemStatus
              name="HVAC SYSTEM"
              value={`+${hvac.summary.indoorAvgTempC}°C`}
              detail={`${hvac.zones.length} ACTIVE THERMAL ZONES`}
              status={hvac.summary.status}
            />
          </div>

          <div onClick={() => navigate("/dashboard/water")} style={{ cursor: "pointer" }}>
            <SystemStatus
              name="WATER SYSTEM"
              value={`${water.summary.percentage}%`}
              detail={`${water.summary.currentLevelL.toLocaleString()} L BUFFER`}
              status={water.summary.status}
            />
          </div>

          <div onClick={() => navigate("/dashboard/environment")} style={{ cursor: "pointer" }}>
            <SystemStatus
              name="ENVIRONMENT"
              value={
                isLoading
                  ? "..."
                  : isUnavailable
                  ? "OFFLINE"
                  : environment?.current?.temperature_c !== null && environment?.current?.temperature_c !== undefined
                  ? `${environment.current.temperature_c > 0 ? "+" : ""}${environment.current.temperature_c}°C`
                  : stationInfo.environment
              }
              detail={
                isLoading
                  ? "FETCHING LIVE..."
                  : isUnavailable
                  ? "DATA UNAVAILABLE"
                  : `WIND ${environment?.current?.wind_speed_kmh || stationInfo.windSpeed} · ${environment?.conditions?.weather || "POLAR"}`.toUpperCase()
              }
              status={isUnavailable ? "WARNING" : "NORMAL"}
            />
          </div>

          <div onClick={() => navigate("/dashboard/overview")} style={{ cursor: "pointer" }}>
            <SystemStatus
              name="SATCOM LINK"
              value={stationInfo.satcom || "CONNECTED"}
              detail={`SNR ${stationInfo.satcomQuality || "98.7%"} · ${stationInfo.latency || "742 ms"}`}
              status="NORMAL"
            />
          </div>
        </div>
      </section>

      {/* LOWER INFORMATION: RECENT ALERTS & SATCOM */}
      <div className="overview-lower-grid" style={{ marginTop: "24px" }}>
        {/* RECENT ALERTS */}
        <section className="dashboard-panel">
          <div className="panel-heading">
            <span>ACTIVE ALERTS ({alerts.length})</span>
            <button
              type="button"
              onClick={() => navigate("/dashboard/alerts")}
              style={{ background: "transparent", border: "none", color: "#00f0ff", cursor: "pointer", fontSize: "11px", fontWeight: 700 }}
            >
              VIEW ALL →
            </button>
          </div>

          <div className="alert-list">
            {alerts.slice(0, 3).map((alt) => (
              <div
                key={alt.id}
                className="alert-item"
                onClick={() => navigate(alt.targetRoute || "/dashboard/alerts")}
                style={{ cursor: "pointer" }}
              >
                <span className={`alert-indicator ${alt.severity.toLowerCase()}`} />
                <div className="alert-content">
                  <strong>{alt.title}</strong>
                  <span>{alt.description}</span>
                </div>
                <time>{alt.detectedAt}</time>
              </div>
            ))}
          </div>
        </section>

        {/* SATCOM TELEMETRY PANEL */}
        <section className="dashboard-panel">
          <div className="panel-heading">
            <span>SATCOM TELEMETRY LINK</span>
            <StatusBadge status="CONNECTED" type="normal" />
          </div>

          <div className="satcom-panel">
            <div className="satcom-main">
              <strong>{stationInfo.satcomQuality || "98.7%"}</strong>
              <span>LINK QUALITY (C-BAND)</span>
            </div>

            <div className="satcom-data">
              <div>
                <span>LATENCY</span>
                <strong>{stationInfo.latency || "742 ms"}</strong>
              </div>
              <div>
                <span>UPLINK</span>
                <strong>ACTIVE (AES-256)</strong>
              </div>
              <div>
                <span>GATEWAY</span>
                <strong>NCPOR GOA</strong>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

function SystemStatus({ name, value, detail, status }) {
  const warning = status === "WARNING";
  return (
    <div className="system-status-card">
      <div className="system-status-top">
        <span className="system-name">{name}</span>
        <span className={warning ? "system-indicator warning" : "system-indicator"} />
      </div>
      <strong>{value}</strong>
      <span className="system-detail">{detail}</span>
      <span className={warning ? "system-state warning" : "system-state"}>{status}</span>
    </div>
  );
}

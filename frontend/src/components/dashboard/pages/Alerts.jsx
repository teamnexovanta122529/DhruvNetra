import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../common/PageHeader";
import { useStation } from "../../../context/StationContext";
import { getAlertsData } from "../../../services/telemetryService";

export default function Alerts() {
  const navigate = useNavigate();
  const { station, stationInfo } = useStation();
  const rawAlerts = getAlertsData(station);

  const [severityFilter, setSeverityFilter] = useState("ALL"); // 'ALL' | 'CRITICAL' | 'WARNING' | 'INFO' | 'RESOLVED'
  const [systemFilter, setSystemFilter] = useState("ALL");
  const [acknowledgedMap, setAcknowledgedMap] = useState({});

  const handleAcknowledge = (id) => {
    setAcknowledgedMap((prev) => ({ ...prev, [id]: true }));
  };

  const filteredAlerts = rawAlerts.filter((item) => {
    if (severityFilter === "RESOLVED") {
      if (!item.resolved) return false;
    } else if (severityFilter !== "ALL") {
      if (item.resolved || item.severity !== severityFilter) return false;
    }

    if (systemFilter !== "ALL" && item.system.toLowerCase() !== systemFilter.toLowerCase()) {
      return false;
    }

    return true;
  });

  const criticalCount = rawAlerts.filter((a) => a.severity === "CRITICAL" && !a.resolved).length;
  const warningCount = rawAlerts.filter((a) => a.severity === "WARNING" && !a.resolved).length;
  const infoCount = rawAlerts.filter((a) => a.severity === "INFO" && !a.resolved).length;
  const resolvedCount = rawAlerts.filter((a) => a.resolved).length;

  return (
    <div className="dashboard-page alerts-page">
      <PageHeader
        eyebrow={`DHRUVNETRA / DIAGNOSTICS & TELEMETRY ALERTS · ${stationInfo.coordinates || ""}`}
        title={`${station} ALERTS & EVENT MATRIX`}
        description={`CENTRALIZED EVENT DETECTOR, REAL-TIME THRESHOLD ANOMALIES & OPERATIONAL CORRECTIVE DIRECTIVES (${stationInfo.location})`}
        status={warningCount > 0 || criticalCount > 0 ? "ATTENTION REQUIRED" : "ALL SYSTEMS NOMINAL"}
      />

      {/* KPI STRIP */}
      <section className="metrics-grid">
        <div
          className="metric-card"
          onClick={() => setSeverityFilter("CRITICAL")}
          style={{ cursor: "pointer", border: severityFilter === "CRITICAL" ? "1px solid #ef4444" : undefined }}
        >
          <div className="metric-card-top">
            <span>CRITICAL ALERTS</span>
            <span style={{ color: "#ef4444", fontWeight: 700 }}>● CODE RED</span>
          </div>
          <div className="metric-value" style={{ color: criticalCount > 0 ? "#ef4444" : "#ffffff" }}>
            {criticalCount}
          </div>
          <div className="metric-trend">Immediate action mandatory</div>
        </div>

        <div
          className="metric-card"
          onClick={() => setSeverityFilter("WARNING")}
          style={{ cursor: "pointer", border: severityFilter === "WARNING" ? "1px solid #f59e0b" : undefined }}
        >
          <div className="metric-card-top">
            <span>WARNING ALERTS</span>
            <span style={{ color: "#f59e0b", fontWeight: 700 }}>● CODE ORANGE</span>
          </div>
          <div className="metric-value" style={{ color: warningCount > 0 ? "#f59e0b" : "#ffffff" }}>
            {warningCount}
          </div>
          <div className="metric-trend">Subsystem threshold drift</div>
        </div>

        <div
          className="metric-card"
          onClick={() => setSeverityFilter("INFO")}
          style={{ cursor: "pointer", border: severityFilter === "INFO" ? "1px solid #00f0ff" : undefined }}
        >
          <div className="metric-card-top">
            <span>INFORMATIONAL</span>
            <span style={{ color: "#00f0ff", fontWeight: 700 }}>● CODE CYAN</span>
          </div>
          <div className="metric-value">
            {infoCount}
          </div>
          <div className="metric-trend">Telemetry sync & cycle updates</div>
        </div>

        <div
          className="metric-card"
          onClick={() => setSeverityFilter("RESOLVED")}
          style={{ cursor: "pointer", border: severityFilter === "RESOLVED" ? "1px solid #10b981" : undefined }}
        >
          <div className="metric-card-top">
            <span>RESOLVED EVENTS</span>
            <span style={{ color: "#10b981", fontWeight: 700 }}>● ARCHIVE</span>
          </div>
          <div className="metric-value" style={{ color: "#10b981" }}>
            {resolvedCount}
          </div>
          <div className="metric-trend">Cleared & validated</div>
        </div>
      </section>

      {/* FILTER CONTROLS TOOLBAR */}
      <section className="dashboard-panel" style={{ marginTop: "20px", padding: "14px 20px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
          {/* Severity Buttons */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {["ALL", "CRITICAL", "WARNING", "INFO", "RESOLVED"].map((sev) => (
              <button
                key={sev}
                type="button"
                onClick={() => setSeverityFilter(sev)}
                style={{
                  background: severityFilter === sev ? "rgba(0, 240, 255, 0.2)" : "rgba(255, 255, 255, 0.04)",
                  border: `1px solid ${severityFilter === sev ? "#00f0ff" : "rgba(255, 255, 255, 0.12)"}`,
                  color: severityFilter === sev ? "#ffffff" : "#94a3b8",
                  padding: "5px 12px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 700,
                  cursor: "pointer",
                  fontFamily: "monospace",
                }}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Subsystem Filter Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontFamily: "monospace" }}>
            <span style={{ color: "#94a3b8" }}>SUBSYSTEM:</span>
            <select
              value={systemFilter}
              onChange={(e) => setSystemFilter(e.target.value)}
              className="gov-select"
              style={{ width: "160px", padding: "4px 8px", fontSize: "11px" }}
            >
              <option value="ALL">ALL SUBSYSTEMS</option>
              <option value="Power">POWER</option>
              <option value="Fuel">FUEL</option>
              <option value="HVAC">HVAC</option>
              <option value="Water">WATER</option>
              <option value="Environment">ENVIRONMENT</option>
              <option value="Logistics">LOGISTICS</option>
              <option value="Satcom">SATCOM</option>
            </select>
          </div>
        </div>
      </section>

      {/* ALERT CARDS LIST */}
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "16px" }}>
        {filteredAlerts.length === 0 ? (
          <div style={{ background: "rgba(10, 22, 34, 0.5)", border: "1px dashed rgba(255, 255, 255, 0.15)", borderRadius: "8px", padding: "32px", textAlign: "center", color: "#94a3b8" }}>
            <span>No alerts match the selected filter criteria for {station} Station.</span>
          </div>
        ) : (
          filteredAlerts.map((alt) => {
            const isCritical = alt.severity === "CRITICAL";
            const isWarning = alt.severity === "WARNING";
            const isResolved = alt.resolved;
            const isAck = acknowledgedMap[alt.id];

            return (
              <div
                key={alt.id}
                style={{
                  background: isCritical
                    ? "linear-gradient(135deg, rgba(50, 15, 20, 0.9), rgba(30, 8, 12, 0.95))"
                    : isWarning
                    ? "linear-gradient(135deg, rgba(40, 25, 10, 0.9), rgba(25, 15, 6, 0.95))"
                    : isResolved
                    ? "rgba(10, 22, 34, 0.5)"
                    : "rgba(10, 26, 40, 0.8)",
                  border: `1px solid ${
                    isCritical
                      ? "rgba(239, 68, 68, 0.45)"
                      : isWarning
                      ? "rgba(245, 158, 11, 0.4)"
                      : isResolved
                      ? "rgba(16, 185, 129, 0.25)"
                      : "rgba(0, 240, 255, 0.25)"
                  }`,
                  borderRadius: "8px",
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  boxShadow: isCritical ? "0 0 16px rgba(239, 68, 68, 0.2)" : "none",
                }}
              >
                {/* Alert Top Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span
                      style={{
                        background: isCritical
                          ? "#ef4444"
                          : isWarning
                          ? "#f59e0b"
                          : isResolved
                          ? "#10b981"
                          : "#00f0ff",
                        color: "#000000",
                        fontWeight: 800,
                        fontSize: "10px",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        letterSpacing: "1px",
                      }}
                    >
                      {alt.severity}
                    </span>

                    <span style={{ fontSize: "11px", color: "#67e8f9", fontFamily: "monospace", fontWeight: 700 }}>
                      [{alt.subsystem}] · {alt.station}
                    </span>
                  </div>

                  <span style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "monospace" }}>
                    Detected: {alt.detectedAt} ({alt.timestamp})
                  </span>
                </div>

                {/* Alert Title & Description */}
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "15px", color: "#ffffff", fontWeight: 700 }}>
                    {alt.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "#cbd5e1", lineHeight: "1.4" }}>
                    {alt.description}
                  </p>
                </div>

                {/* Affected equipment & recommendation */}
                <div style={{ background: "rgba(255, 255, 255, 0.03)", padding: "8px 12px", borderRadius: "6px", fontSize: "11px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "8px" }}>
                  <div>
                    <span style={{ color: "#94a3b8" }}>Affected Component: </span>
                    <strong style={{ color: "#e2e8f0" }}>{alt.affectedComponent}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#94a3b8" }}>Recommended Action: </span>
                    <strong style={{ color: "#38bdf8" }}>{alt.recommendation}</strong>
                  </div>
                </div>

                {/* Actions Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "6px" }}>
                  <div style={{ fontSize: "11px", color: isAck ? "#10b981" : "#94a3b8" }}>
                    {isAck ? "✓ Acknowledged by Station Operator" : "Pending Operator Acknowledgement"}
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    {!isAck && !isResolved && (
                      <button
                        type="button"
                        onClick={() => handleAcknowledge(alt.id)}
                        style={{
                          background: "rgba(255, 255, 255, 0.08)",
                          border: "1px solid rgba(255, 255, 255, 0.2)",
                          color: "#ffffff",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          cursor: "pointer",
                        }}
                      >
                        Acknowledge
                      </button>
                    )}

                    {alt.targetRoute && (
                      <button
                        type="button"
                        onClick={() => navigate(alt.targetRoute)}
                        style={{
                          background: "linear-gradient(135deg, rgba(0, 240, 255, 0.2), rgba(2, 132, 199, 0.3))",
                          border: "1px solid rgba(0, 240, 255, 0.4)",
                          color: "#00f0ff",
                          padding: "4px 12px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 700,
                          cursor: "pointer",
                        }}
                      >
                        Open Subsystem →
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
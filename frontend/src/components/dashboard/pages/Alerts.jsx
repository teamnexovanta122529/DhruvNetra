import { useState } from "react";
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
          style={{ cursor: "pointer", border: severityFilter === "CRITICAL" ? "2px solid #dc2626" : "1px solid var(--border-subtle, #e2e8f0)" }}
        >
          <div className="metric-card-top">
            <span>CRITICAL ALERTS</span>
            <span style={{ color: "#dc2626", fontWeight: 700 }}>● CODE RED</span>
          </div>
          <div className="metric-value" style={{ color: criticalCount > 0 ? "#dc2626" : "var(--text-primary, #0f172a)" }}>
            {criticalCount}
          </div>
          <div className="metric-trend" style={{ color: criticalCount > 0 ? "#dc2626" : "#64748b" }}>Immediate action mandatory</div>
        </div>

        <div
          className="metric-card"
          onClick={() => setSeverityFilter("WARNING")}
          style={{ cursor: "pointer", border: severityFilter === "WARNING" ? "2px solid #d97706" : "1px solid var(--border-subtle, #e2e8f0)" }}
        >
          <div className="metric-card-top">
            <span>WARNING ALERTS</span>
            <span style={{ color: "#d97706", fontWeight: 700 }}>● CODE ORANGE</span>
          </div>
          <div className="metric-value" style={{ color: warningCount > 0 ? "#d97706" : "var(--text-primary, #0f172a)" }}>
            {warningCount}
          </div>
          <div className="metric-trend" style={{ color: warningCount > 0 ? "#d97706" : "#64748b" }}>Subsystem threshold drift</div>
        </div>

        <div
          className="metric-card"
          onClick={() => setSeverityFilter("INFO")}
          style={{ cursor: "pointer", border: severityFilter === "INFO" ? "2px solid #0284c7" : "1px solid var(--border-subtle, #e2e8f0)" }}
        >
          <div className="metric-card-top">
            <span>INFORMATIONAL</span>
            <span style={{ color: "#0284c7", fontWeight: 700 }}>● CODE BLUE</span>
          </div>
          <div className="metric-value" style={{ color: "var(--text-primary, #0f172a)" }}>
            {infoCount}
          </div>
          <div className="metric-trend">Telemetry sync & cycle updates</div>
        </div>

        <div
          className="metric-card"
          onClick={() => setSeverityFilter("RESOLVED")}
          style={{ cursor: "pointer", border: severityFilter === "RESOLVED" ? "2px solid #16a34a" : "1px solid var(--border-subtle, #e2e8f0)" }}
        >
          <div className="metric-card-top">
            <span>RESOLVED EVENTS</span>
            <span style={{ color: "#16a34a", fontWeight: 700 }}>● ARCHIVE</span>
          </div>
          <div className="metric-value" style={{ color: "#16a34a" }}>
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
                  background: severityFilter === sev ? "var(--accent-primary, #0284c7)" : "#ffffff",
                  border: `1px solid ${severityFilter === sev ? "var(--accent-primary, #0284c7)" : "var(--border-subtle, #cbd5e1)"}`,
                  color: severityFilter === sev ? "#ffffff" : "var(--text-secondary, #475569)",
                  padding: "5px 12px",
                  borderRadius: "4px",
                  fontSize: "11px",
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "var(--font-mono, monospace)",
                  transition: "all 0.15s ease"
                }}
              >
                {sev}
              </button>
            ))}
          </div>

          {/* Subsystem Filter Dropdown */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontFamily: "var(--font-mono, monospace)" }}>
            <span style={{ color: "#64748b" }}>SUBSYSTEM:</span>
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
          <div style={{ background: "#ffffff", border: "1px dashed var(--border-subtle, #cbd5e1)", borderRadius: "8px", padding: "32px", textAlign: "center", color: "#64748b" }}>
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
                    ? "#fef2f2"
                    : isWarning
                    ? "#fffbeb"
                    : isResolved
                    ? "#f8fafc"
                    : "#f0f9ff",
                  border: `1px solid ${
                    isCritical
                      ? "#fecaca"
                      : isWarning
                      ? "#fde68a"
                      : isResolved
                      ? "#e2e8f0"
                      : "#bae6fd"
                  }`,
                  borderRadius: "8px",
                  padding: "16px 20px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  boxShadow: isCritical ? "0 4px 12px rgba(220, 38, 38, 0.08)" : "0 1px 3px rgba(0,0,0,0.03)",
                }}
              >
                {/* Alert Top Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span
                      style={{
                        background: isCritical
                          ? "#dc2626"
                          : isWarning
                          ? "#d97706"
                          : isResolved
                          ? "#16a34a"
                          : "#0284c7",
                        color: "#ffffff",
                        fontWeight: 700,
                        fontSize: "10px",
                        padding: "2px 8px",
                        borderRadius: "4px",
                        letterSpacing: "1px",
                        fontFamily: "var(--font-mono, monospace)"
                      }}
                    >
                      {alt.severity}
                    </span>

                    <span style={{ fontSize: "11px", color: "var(--accent-primary, #0284c7)", fontFamily: "var(--font-mono, monospace)", fontWeight: 700 }}>
                      [{alt.subsystem}] · {alt.station}
                    </span>
                  </div>

                  <span style={{ fontSize: "11px", color: "#64748b", fontFamily: "var(--font-mono, monospace)" }}>
                    Detected: {alt.detectedAt} ({alt.timestamp})
                  </span>
                </div>

                {/* Alert Title & Description */}
                <div>
                  <h3 style={{ margin: "0 0 4px 0", fontSize: "15px", color: isCritical ? "#991b1b" : isWarning ? "#92400e" : "var(--text-primary, #0f172a)", fontWeight: 700 }}>
                    {alt.title}
                  </h3>
                  <p style={{ margin: 0, fontSize: "12px", color: isCritical ? "#7f1d1d" : isWarning ? "#78350f" : "var(--text-secondary, #475569)", lineHeight: "1.4" }}>
                    {alt.description}
                  </p>
                </div>

                {/* Affected equipment & recommendation */}
                <div style={{ background: "#ffffff", border: "1px solid rgba(0,0,0,0.06)", padding: "10px 12px", borderRadius: "6px", fontSize: "11px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "8px" }}>
                  <div>
                    <span style={{ color: "#64748b" }}>Affected Component: </span>
                    <strong style={{ color: "var(--text-primary, #0f172a)" }}>{alt.affectedComponent}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Recommended Action: </span>
                    <strong style={{ color: "#0284c7" }}>{alt.recommendation}</strong>
                  </div>
                </div>

                {/* Actions Row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "4px" }}>
                  <div style={{ fontSize: "11px", color: isAck ? "#16a34a" : "#64748b" }}>
                    {isAck ? "✓ Acknowledged by Station Operator" : "Pending Operator Acknowledgement"}
                  </div>

                  <div style={{ display: "flex", gap: "8px" }}>
                    {!isAck && !isResolved && (
                      <button
                        type="button"
                        onClick={() => handleAcknowledge(alt.id)}
                        style={{
                          background: "#ffffff",
                          border: "1px solid #cbd5e1",
                          color: "#334155",
                          padding: "4px 10px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 500,
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
                          background: "var(--accent-primary, #0284c7)",
                          border: "none",
                          color: "#ffffff",
                          padding: "4px 12px",
                          borderRadius: "4px",
                          fontSize: "11px",
                          fontWeight: 600,
                          cursor: "pointer",
                          boxShadow: "0 1px 3px rgba(2, 132, 199, 0.2)"
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
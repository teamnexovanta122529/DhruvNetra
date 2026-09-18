import { useNavigate } from "react-router-dom";
import { useStation } from "../../context/StationContext";
import { getAlertsData } from "../../services/telemetryService";

export default function NotificationCenter({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { station } = useStation();
  const alerts = getAlertsData(station);

  if (!isOpen) return null;

  return (
    <div
      className="notification-dropdown-panel"
      style={{
        position: "absolute",
        top: "60px",
        right: "60px",
        width: "360px",
        background: "#ffffff",
        border: "1px solid var(--border-default)",
        borderRadius: "8px",
        padding: "16px",
        boxShadow: "var(--shadow-xl)",
        zIndex: 100,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "10px", marginBottom: "10px" }}>
        <div>
          <span style={{ fontSize: "9.5px", color: "var(--accent-primary)", letterSpacing: "1.5px", fontWeight: 800 }}>
            {station.toUpperCase()} NOTIFICATIONS
          </span>
          <h4 style={{ margin: "2px 0 0 0", fontSize: "14px", color: "var(--text-primary)", fontWeight: 800 }}>
            Active Telemetry Alerts ({alerts.length})
          </h4>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{ background: "transparent", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "16px", fontWeight: 700 }}
        >
          ✕
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "300px", overflowY: "auto" }}>
        {alerts.map((alt) => {
          const isCrit = alt.severity === "CRITICAL";
          const isWarn = alt.severity === "WARNING";
          return (
            <div
              key={alt.id}
              onClick={() => {
                onClose?.();
                navigate(alt.targetRoute || "/dashboard/alerts");
              }}
              style={{
                background: isCrit ? "var(--status-critical-bg)" : isWarn ? "var(--status-warning-bg)" : "var(--surface-card-subtle)",
                border: `1px solid ${isCrit ? "var(--status-critical-border)" : isWarn ? "var(--status-warning-border)" : "var(--border-subtle)"}`,
                borderRadius: "6px",
                padding: "10px",
                cursor: "pointer",
                transition: "all 0.2s ease",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                <span
                  style={{
                    fontSize: "9px",
                    fontWeight: 800,
                    color: isCrit ? "var(--status-critical)" : isWarn ? "var(--status-warning)" : "var(--accent-primary)",
                  }}
                >
                  ● {alt.severity} · {alt.subsystem}
                </span>
                <span style={{ fontSize: "9px", color: "var(--text-muted)", fontFamily: "monospace" }}>{alt.detectedAt}</span>
              </div>
              <strong style={{ fontSize: "12px", color: "var(--text-primary)", display: "block", marginBottom: "2px", fontWeight: 700 }}>
                {alt.title}
              </strong>
              <span style={{ fontSize: "11px", color: "var(--text-secondary)", lineHeight: "1.35", display: "block" }}>
                {alt.description}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px solid var(--border-subtle)", textAlign: "center" }}>
        <button
          type="button"
          onClick={() => {
            onClose?.();
            navigate("/dashboard/alerts");
          }}
          style={{
            background: "transparent",
            border: "none",
            color: "var(--accent-primary)",
            fontSize: "11px",
            fontWeight: 800,
            cursor: "pointer",
            letterSpacing: "0.5px",
          }}
        >
          VIEW FULL ALERT CENTER →
        </button>
      </div>
    </div>
  );
}

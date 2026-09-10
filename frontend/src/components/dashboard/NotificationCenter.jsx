import React from "react";
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
        background: "linear-gradient(135deg, rgba(8, 22, 34, 0.98) 0%, rgba(4, 15, 24, 0.98) 100%)",
        border: "1px solid rgba(0, 240, 255, 0.35)",
        borderRadius: "10px",
        padding: "16px",
        boxShadow: "0 12px 36px rgba(0, 0, 0, 0.8), 0 0 20px rgba(0, 240, 255, 0.15)",
        zIndex: 100,
        backdropFilter: "blur(12px)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(100, 200, 240, 0.15)", paddingBottom: "10px", marginBottom: "10px" }}>
        <div>
          <span style={{ fontSize: "10px", color: "#67e8f9", fontFamily: "monospace", letterSpacing: "1.5px", fontWeight: 700 }}>
            {station} NOTIFICATIONS
          </span>
          <h4 style={{ margin: 0, fontSize: "14px", color: "#ffffff", fontWeight: 700 }}>
            Active Telemetry Alerts ({alerts.length})
          </h4>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{ background: "transparent", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "16px" }}
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
                background: "rgba(255, 255, 255, 0.03)",
                border: `1px solid ${isCrit ? "rgba(239, 68, 68, 0.3)" : isWarn ? "rgba(245, 158, 11, 0.3)" : "rgba(0, 240, 255, 0.15)"}`,
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
                    fontWeight: 700,
                    color: isCrit ? "#ef4444" : isWarn ? "#f59e0b" : "#00f0ff",
                  }}
                >
                  ● {alt.severity} · {alt.subsystem}
                </span>
                <span style={{ fontSize: "9px", color: "#94a3b8", fontFamily: "monospace" }}>{alt.detectedAt}</span>
              </div>
              <strong style={{ fontSize: "12px", color: "#f1f5f9", display: "block", marginBottom: "2px" }}>
                {alt.title}
              </strong>
              <span style={{ fontSize: "11px", color: "#cbd5e1", lineHeight: "1.3", display: "block" }}>
                {alt.description}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px solid rgba(255, 255, 255, 0.08)", textAlign: "center" }}>
        <button
          type="button"
          onClick={() => {
            onClose?.();
            navigate("/dashboard/alerts");
          }}
          style={{
            background: "transparent",
            border: "none",
            color: "#00f0ff",
            fontSize: "11px",
            fontWeight: 700,
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

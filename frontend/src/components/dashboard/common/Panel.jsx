import React from "react";

export default function Panel({
  title,
  subtitle,
  badge,
  badgeType = "normal",
  children,
  className = "",
  actions,
  style = {},
}) {
  return (
    <section className={`dashboard-panel ${className}`} style={style}>
      {(title || subtitle || badge || actions) && (
        <div className="panel-heading" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <div>
            {subtitle && <span style={{ fontSize: "0.68rem", letterSpacing: "1.5px", color: "var(--color-primary-cyan, #00f0ff)", textTransform: "uppercase", display: "block" }}>{subtitle}</span>}
            {title && <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: 700, color: "#f1f5f9", letterSpacing: "0.5px" }}>{title}</h3>}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {badge && (
              <span className={`status-badge ${badgeType}`}>
                <i />
                {badge}
              </span>
            )}
            {actions}
          </div>
        </div>
      )}

      {children}
    </section>
  );
}

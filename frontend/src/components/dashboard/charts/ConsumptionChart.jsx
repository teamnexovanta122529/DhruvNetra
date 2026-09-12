import React from "react";

export default function ConsumptionChart({
  labels = ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00", "Now"],
  consumption = [25, 20, 45, 95, 110, 85, 90, 75, 60],
  production = [60, 60, 70, 75, 75, 70, 65, 65, 65],
  unit = "L/h",
  seriesLabels = { a: "Consumption Rate", b: "Production Rate" },
}) {
  const height = 180;
  const width = 500;
  const padding = { top: 25, right: 25, bottom: 30, left: 45 };

  const allValues = [...consumption, ...production];
  const minVal = 0;
  const maxVal = Math.ceil(Math.max(...allValues) * 1.2) || 120;

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const getX = (index) => padding.left + (index / (labels.length - 1 || 1)) * chartW;
  const getY = (val) => padding.top + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;

  const consPoints = consumption.map((v, i) => `${getX(i)},${getY(v)}`).join(" ");
  const prodPoints = production.map((v, i) => `${getX(i)},${getY(v)}`).join(" ");

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }} preserveAspectRatio="none">
        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = padding.top + chartH * ratio;
          const val = Math.round(maxVal - ratio * (maxVal - minVal));
          return (
            <g key={idx}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
              <text x={padding.left - 6} y={y + 3} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">
                {val} {unit}
              </text>
            </g>
          );
        })}

        {/* X labels */}
        {labels.map((lbl, idx) => (
          <text key={idx} x={getX(idx)} y={height - 10} fill="#64748b" fontSize="8" textAnchor="middle" fontFamily="monospace">
            {lbl}
          </text>
        ))}

        {/* Production Line (Green) */}
        <polyline fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" points={prodPoints} />

        {/* Consumption Line (Amber dashed) */}
        <polyline fill="none" stroke="#d97706" strokeWidth="2" strokeDasharray="4 2" strokeLinecap="round" strokeLinejoin="round" points={consPoints} />

        {production.map((v, i) => (
          <circle key={`p-${i}`} cx={getX(i)} cy={getY(v)} r="3" fill="#16a34a" stroke="#ffffff" strokeWidth="1.5" />
        ))}
        {consumption.map((v, i) => (
          <circle key={`c-${i}`} cx={getX(i)} cy={getY(v)} r="2.5" fill="#d97706" stroke="#ffffff" strokeWidth="1" />
        ))}
      </svg>

      <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: "0.4rem", fontSize: "0.75rem", fontFamily: "var(--font-mono, monospace)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: 12, height: 2, background: "#16a34a", borderRadius: "1px", display: "inline-block" }} />
          <span style={{ color: "#334155", fontWeight: 500 }}>{seriesLabels.b} ({unit})</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: 12, height: 2, borderTop: "2px dashed #d97706", display: "inline-block" }} />
          <span style={{ color: "#334155", fontWeight: 500 }}>{seriesLabels.a} ({unit})</span>
        </div>
      </div>
    </div>
  );
}

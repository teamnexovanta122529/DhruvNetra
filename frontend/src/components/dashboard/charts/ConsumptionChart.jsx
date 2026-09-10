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
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(100, 200, 240, 0.1)" strokeDasharray="3 3" />
              <text x={padding.left - 6} y={y + 3} fill="rgba(160, 220, 240, 0.6)" fontSize="8" textAnchor="end" fontFamily="monospace">
                {val} {unit}
              </text>
            </g>
          );
        })}

        {/* X labels */}
        {labels.map((lbl, idx) => (
          <text key={idx} x={getX(idx)} y={height - 10} fill="rgba(160, 220, 240, 0.7)" fontSize="8" textAnchor="middle" fontFamily="monospace">
            {lbl}
          </text>
        ))}

        {/* Production Line (Cyan/Green) */}
        <polyline fill="none" stroke="#10b981" strokeWidth="2" points={prodPoints} />

        {/* Consumption Line (Amber dashed) */}
        <polyline fill="none" stroke="#f59e0b" strokeWidth="2" strokeDasharray="4 2" points={consPoints} />

        {production.map((v, i) => (
          <circle key={`p-${i}`} cx={getX(i)} cy={getY(v)} r="3" fill="#10b981" stroke="#051622" strokeWidth="1.5" />
        ))}
        {consumption.map((v, i) => (
          <circle key={`c-${i}`} cx={getX(i)} cy={getY(v)} r="2.5" fill="#f59e0b" stroke="#051622" strokeWidth="1" />
        ))}
      </svg>

      <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: "0.4rem", fontSize: "0.75rem", fontFamily: "monospace" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: 12, height: 2, background: "#10b981", display: "inline-block" }} />
          <span style={{ color: "#a7f3d0" }}>{seriesLabels.b} ({unit})</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: 12, height: 2, borderTop: "2px dashed #f59e0b", display: "inline-block" }} />
          <span style={{ color: "#fde68a" }}>{seriesLabels.a} ({unit})</span>
        </div>
      </div>
    </div>
  );
}

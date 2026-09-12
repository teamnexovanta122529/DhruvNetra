import React from "react";

export default function PowerChart({
  labels = ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00", "Now"],
  generation = [340, 335, 360, 380, 395, 385, 375, 365, 360],
  demand = [270, 260, 290, 310, 330, 315, 305, 295, 295],
  unit = "kW",
}) {
  const height = 190;
  const width = 540;
  const padding = { top: 25, right: 25, bottom: 30, left: 50 };

  const allValues = [...generation, ...demand];
  const minVal = Math.floor(Math.min(...allValues) * 0.85);
  const maxVal = Math.ceil(Math.max(...allValues) * 1.1) || 500;

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const getX = (index) => padding.left + (index / (labels.length - 1 || 1)) * chartW;
  const getY = (val) => padding.top + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;

  const genPoints = generation.map((v, i) => `${getX(i)},${getY(v)}`).join(" ");
  const demandPoints = demand.map((v, i) => `${getX(i)},${getY(v)}`).join(" ");

  // Area under generation
  const genArea = `${padding.left},${padding.top + chartH} ${genPoints} ${getX(generation.length - 1)},${padding.top + chartH}`;

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="powerGenGradLight" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#0284c7" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.33, 0.66, 1].map((ratio, idx) => {
          const y = padding.top + chartH * ratio;
          const val = Math.round(maxVal - ratio * (maxVal - minVal));
          return (
            <g key={idx}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
              <text x={padding.left - 8} y={y + 3} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">
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

        {/* Gen Area */}
        <polygon points={genArea} fill="url(#powerGenGradLight)" />

        {/* Gen line */}
        <polyline fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" points={genPoints} />

        {/* Demand line */}
        <polyline fill="none" stroke="#d97706" strokeWidth="2" strokeDasharray="4 2" strokeLinecap="round" strokeLinejoin="round" points={demandPoints} />

        {/* Data points */}
        {generation.map((v, i) => (
          <circle key={`gen-${i}`} cx={getX(i)} cy={getY(v)} r="3" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
        ))}
        {demand.map((v, i) => (
          <circle key={`dem-${i}`} cx={getX(i)} cy={getY(v)} r="2.5" fill="#d97706" stroke="#ffffff" strokeWidth="1" />
        ))}
      </svg>

      {/* Legend */}
      <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: "0.5rem", fontSize: "0.75rem", fontFamily: "var(--font-mono, monospace)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: 12, height: 3, background: "#0284c7", borderRadius: "1px", display: "inline-block" }} />
          <span style={{ color: "#334155", fontWeight: 500 }}>Power Generation ({unit})</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: 12, height: 2, borderTop: "2px dashed #d97706", display: "inline-block" }} />
          <span style={{ color: "#334155", fontWeight: 500 }}>Station Demand Load ({unit})</span>
        </div>
      </div>
    </div>
  );
}

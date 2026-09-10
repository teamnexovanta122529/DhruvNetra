import React from "react";

export default function FuelChart({
  labels = ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00", "Now"],
  burnRates = [26.8, 26.2, 28.1, 30.2, 31.0, 30.1, 29.4, 28.8, 28.5],
  unit = "L/h",
}) {
  const height = 180;
  const width = 500;
  const padding = { top: 25, right: 25, bottom: 30, left: 45 };

  const minVal = Math.floor(Math.min(...burnRates) * 0.8);
  const maxVal = Math.ceil(Math.max(...burnRates) * 1.15) || 40;

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const getX = (index) => padding.left + (index / (labels.length - 1 || 1)) * chartW;
  const getY = (val) => padding.top + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;

  const points = burnRates.map((v, i) => `${getX(i)},${getY(v)}`).join(" ");
  const areaPoints = `${padding.left},${padding.top + chartH} ${points} ${getX(burnRates.length - 1)},${padding.top + chartH}`;

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="fuelGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = padding.top + chartH * ratio;
          const val = Math.round(maxVal - ratio * (maxVal - minVal));
          return (
            <g key={idx}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="rgba(245, 158, 11, 0.15)" strokeDasharray="3 3" />
              <text x={padding.left - 6} y={y + 3} fill="rgba(245, 158, 11, 0.7)" fontSize="8" textAnchor="end" fontFamily="monospace">
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

        <polygon points={areaPoints} fill="url(#fuelGrad)" />
        <polyline fill="none" stroke="#f59e0b" strokeWidth="2.2" points={points} />

        {burnRates.map((v, i) => (
          <circle key={i} cx={getX(i)} cy={getY(v)} r="3" fill="#f59e0b" stroke="#051622" strokeWidth="1.5" />
        ))}
      </svg>

      <div style={{ display: "flex", justifyContent: "center", gap: "1rem", marginTop: "0.4rem", fontSize: "0.75rem", fontFamily: "monospace", color: "#fbbf24" }}>
        <span>● Hourly Generator Fuel Burn Trajectory ({unit})</span>
      </div>
    </div>
  );
}

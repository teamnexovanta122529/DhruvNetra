
export default function TemperatureChart({
  labels = ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00", "Now"],
  indoor = [21.1, 20.9, 21.2, 21.5, 21.8, 21.6, 21.5, 21.4, 21.4],
  outdoor = [-26.1, -26.8, -25.5, -23.2, -21.8, -22.4, -23.8, -24.1, -24.3],
}) {
  const height = 180;
  const width = 500;
  const padding = { top: 25, right: 25, bottom: 30, left: 45 };

  const allTemps = [...indoor, ...outdoor];
  const minVal = Math.floor(Math.min(...allTemps) - 2);
  const maxVal = Math.ceil(Math.max(...allTemps) + 4);

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const getX = (index) => padding.left + (index / (labels.length - 1 || 1)) * chartW;
  const getY = (val) => padding.top + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;

  const indoorPoints = indoor.map((v, i) => `${getX(i)},${getY(v)}`).join(" ");
  const outdoorPoints = outdoor.map((v, i) => `${getX(i)},${getY(v)}`).join(" ");

  return (
    <div style={{ width: "100%", overflow: "hidden" }}>
      <svg viewBox={`0 0 ${width} ${height}`} style={{ width: "100%", height: "auto" }} preserveAspectRatio="none">
        {/* Zero degree reference line */}
        {minVal < 0 && maxVal > 0 && (
          <line
            x1={padding.left}
            y1={getY(0)}
            x2={width - padding.right}
            y2={getY(0)}
            stroke="#94a3b8"
            strokeDasharray="2 2"
          />
        )}

        {/* Grid lines */}
        {[0, 0.33, 0.66, 1].map((ratio, idx) => {
          const y = padding.top + chartH * ratio;
          const val = Math.round(maxVal - ratio * (maxVal - minVal));
          return (
            <g key={idx}>
              <line x1={padding.left} y1={y} x2={width - padding.right} y2={y} stroke="#e2e8f0" strokeDasharray="3 3" />
              <text x={padding.left - 6} y={y + 3} fill="#64748b" fontSize="8" textAnchor="end" fontFamily="monospace">
                {val > 0 ? `+${val}` : val}°C
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

        {/* Outdoor Ambient Line (Glacier Blue) */}
        <polyline fill="none" stroke="#0284c7" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" points={outdoorPoints} />

        {/* Indoor Target Line (Green) */}
        <polyline fill="none" stroke="#16a34a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" points={indoorPoints} />

        {outdoor.map((v, i) => (
          <circle key={`out-${i}`} cx={getX(i)} cy={getY(v)} r="2.5" fill="#0284c7" stroke="#ffffff" strokeWidth="1" />
        ))}
        {indoor.map((v, i) => (
          <circle key={`in-${i}`} cx={getX(i)} cy={getY(v)} r="3" fill="#16a34a" stroke="#ffffff" strokeWidth="1.5" />
        ))}
      </svg>

      <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", marginTop: "0.4rem", fontSize: "0.75rem", fontFamily: "var(--font-mono, monospace)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: 12, height: 2.5, background: "#16a34a", borderRadius: "1px", display: "inline-block" }} />
          <span style={{ color: "#334155", fontWeight: 500 }}>Indoor Target (+21°C)</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span style={{ width: 12, height: 2, background: "#0284c7", borderRadius: "1px", display: "inline-block" }} />
          <span style={{ color: "#334155", fontWeight: 500 }}>Outdoor Polar Ambient</span>
        </div>
      </div>
    </div>
  );
}

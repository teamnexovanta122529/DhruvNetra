import React from "react";

export default function ProgressBar({
  value = 0,
  max = 100,
  label,
  valueText,
  color = "cyan", // 'cyan' | 'green' | 'amber' | 'red' | 'gradient'
  height = 8,
  showPercentage = false,
  className = "",
  style = {},
}) {
  const percentage = Math.min(100, Math.max(0, (value / (max || 100)) * 100));

  const getColorStyle = () => {
    switch (color) {
      case "green":
        return "linear-gradient(90deg, #16a34a, #22c55e)";
      case "amber":
        return "linear-gradient(90deg, #d97706, #f59e0b)";
      case "red":
        return "linear-gradient(90deg, #dc2626, #ef4444)";
      case "gradient":
        if (percentage < 30) return "linear-gradient(90deg, #dc2626, #ea580c)";
        if (percentage < 70) return "linear-gradient(90deg, #d97706, #16a34a)";
        return "linear-gradient(90deg, #0284c7, #16a34a)";
      case "cyan":
      default:
        return "linear-gradient(90deg, #0284c7, #38bdf8)";
    }
  };

  return (
    <div className={`polar-progress-wrap ${className}`} style={{ width: "100%", ...style }}>
      {(label || valueText || showPercentage) && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.35rem", color: "var(--text-secondary, #64748b)", fontFamily: "var(--font-mono, monospace)" }}>
          {label && <span>{label}</span>}
          <span>{valueText || (showPercentage ? `${percentage.toFixed(1)}%` : `${value}/${max}`)}</span>
        </div>
      )}

      <div
        style={{
          width: "100%",
          height: `${height}px`,
          background: "#e2e8f0",
          borderRadius: "9999px",
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: "100%",
            background: getColorStyle(),
            borderRadius: "9999px",
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

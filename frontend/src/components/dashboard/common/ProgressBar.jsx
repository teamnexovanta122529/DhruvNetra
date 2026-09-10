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
        return "linear-gradient(90deg, #10b981, #34d399)";
      case "amber":
        return "linear-gradient(90deg, #f59e0b, #fbbf24)";
      case "red":
        return "linear-gradient(90deg, #ef4444, #f87171)";
      case "gradient":
        if (percentage < 30) return "linear-gradient(90deg, #ef4444, #f97316)";
        if (percentage < 70) return "linear-gradient(90deg, #f59e0b, #10b981)";
        return "linear-gradient(90deg, #06b6d4, #10b981)";
      case "cyan":
      default:
        return "linear-gradient(90deg, #0284c7, #00f0ff)";
    }
  };

  return (
    <div className={`polar-progress-wrap ${className}`} style={{ width: "100%", ...style }}>
      {(label || valueText || showPercentage) && (
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.75rem", marginBottom: "0.35rem", color: "#94a3b8", fontFamily: "monospace" }}>
          {label && <span>{label}</span>}
          <span>{valueText || (showPercentage ? `${percentage.toFixed(1)}%` : `${value}/${max}`)}</span>
        </div>
      )}

      <div
        style={{
          width: "100%",
          height: `${height}px`,
          background: "rgba(255, 255, 255, 0.08)",
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
            boxShadow: percentage > 0 ? "0 0 8px rgba(0, 240, 255, 0.3)" : "none",
          }}
        />
      </div>
    </div>
  );
}

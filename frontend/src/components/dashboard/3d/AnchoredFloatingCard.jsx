import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getComponentMetadata } from "./stationMetadata";

export default function AnchoredFloatingCard({
  station = "MAITRI",
  componentId,
  telemetry,
  screenPos, // { x, y, isVisible, containerWidth, containerHeight }
  onClose,
}) {
  const navigate = useNavigate();

  const details = useMemo(() => {
    if (!componentId) return null;
    return getComponentMetadata(station, componentId, telemetry);
  }, [station, componentId, telemetry]);

  if (!componentId || !details || !screenPos || !screenPos.isVisible) {
    return null;
  }

  const { x: originX, y: originY, containerWidth = 1000, containerHeight = 650 } = screenPos;

  // Card dimensions for layout computation
  const CARD_WIDTH = 340;
  const CARD_HEIGHT = 280;
  const MARGIN = 16;
  const PIN_OFFSET_X = 75;

  // Intelligent Quadrant Calculation
  // Determine if card sits to the Right or Left of the 3D Anchor
  const placeRight = originX < containerWidth * 0.52;
  let cardX = placeRight
    ? originX + PIN_OFFSET_X
    : originX - PIN_OFFSET_X - CARD_WIDTH;

  // Determine vertical offset
  let cardY = originY - 60;

  // Clamp within viewport container bounds
  cardX = Math.max(MARGIN, Math.min(containerWidth - CARD_WIDTH - MARGIN, cardX));
  cardY = Math.max(MARGIN, Math.min(containerHeight - CARD_HEIGHT - MARGIN, cardY));

  // Determine line attachment point on the card
  const lineCardX = placeRight ? cardX : cardX + CARD_WIDTH;
  const lineCardY = Math.min(cardY + 36, containerHeight - MARGIN);

  // SVG Dogleg Path: Origin -> Corner -> Card Attachment Point
  const elbowX = placeRight ? (originX + lineCardX) / 2 : (originX + lineCardX) / 2;
  const elbowY = originY;

  const pathData = `M ${originX} ${originY} L ${elbowX} ${elbowY} L ${lineCardX} ${lineCardY}`;

  return (
    <div
      className="anchored-overlay-layer"
      style={{
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        zIndex: 25,
        overflow: "hidden",
      }}
    >
      {/* 1. Dynamic 60fps Leader Line SVG Canvas */}
      <svg
        className="leader-line-svg"
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <defs>
          {/* Subtle Glow Filter */}
          <filter id="twin-glow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.75" />
          </linearGradient>
        </defs>

        {/* 3D Anchor Location Pulse Node */}
        <circle
          cx={originX}
          cy={originY}
          r="10"
          fill="none"
          stroke="#38bdf8"
          strokeWidth="1.5"
          opacity="0.6"
        >
          <animate
            attributeName="r"
            values="6;16;6"
            dur="2.4s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            values="0.9;0.1;0.9"
            dur="2.4s"
            repeatCount="indefinite"
          />
        </circle>

        {/* Center Anchor Core Dot */}
        <circle
          cx={originX}
          cy={originY}
          r="3.5"
          fill="#38bdf8"
          filter="url(#twin-glow)"
        />

        {/* Leader Connecting Line */}
        <path
          d={pathData}
          fill="none"
          stroke="url(#line-gradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter="url(#twin-glow)"
        />

        {/* Connection Terminal Node on Card Edge */}
        <circle
          cx={lineCardX}
          cy={lineCardY}
          r="3"
          fill="#0284c7"
          stroke="#ffffff"
          strokeWidth="1.5"
        />
      </svg>

      {/* 2. Anchored Floating Information Card */}
      <div
        className="anchored-twin-card"
        style={{
          position: "absolute",
          left: `${cardX}px`,
          top: `${cardY}px`,
          width: `${CARD_WIDTH}px`,
          pointerEvents: "auto",
          background: "rgba(15, 23, 42, 0.94)",
          border: "1px solid rgba(56, 189, 248, 0.35)",
          borderRadius: "8px",
          padding: "14px 16px",
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.55), 0 0 0 1px rgba(255, 255, 255, 0.08)",
          backdropFilter: "blur(14px)",
          color: "#f8fafc",
          fontFamily: "var(--font-sans, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif)",
          animation: "cardPopIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
          transition: "border-color 0.2s ease, box-shadow 0.2s ease",
        }}
      >
        {/* Top Subsystem & Close Bar */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid rgba(148, 163, 184, 0.16)",
            paddingBottom: "8px",
            marginBottom: "10px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span
              style={{
                width: "7px",
                height: "7px",
                borderRadius: "50%",
                background: "#22c55e",
                boxShadow: "0 0 8px #22c55e",
                display: "inline-block",
              }}
            />
            <span
              style={{
                fontSize: "9.5px",
                fontFamily: "ui-monospace, monospace",
                letterSpacing: "0.14em",
                color: "#38bdf8",
                fontWeight: 800,
                textTransform: "uppercase",
              }}
            >
              {details.subsystem}
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.08)",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              fontSize: "12px",
              width: "22px",
              height: "22px",
              borderRadius: "4px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(239, 68, 68, 0.25)";
              e.currentTarget.style.color = "#ef4444";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "rgba(255, 255, 255, 0.08)";
              e.currentTarget.style.color = "#94a3b8";
            }}
            title="Deselect / Close Card (Esc)"
          >
            ✕
          </button>
        </div>

        {/* Component Title & Status */}
        <div style={{ marginBottom: "10px" }}>
          <h4
            style={{
              margin: 0,
              fontSize: "13.5px",
              fontWeight: 800,
              color: "#f8fafc",
              lineHeight: 1.3,
              letterSpacing: "0.01em",
            }}
          >
            {details.title}
          </h4>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              marginTop: "4px",
              fontSize: "10px",
              fontFamily: "ui-monospace, monospace",
              color: "#94a3b8",
            }}
          >
            <span>STATUS:</span>
            <span
              style={{
                color: "#22c55e",
                fontWeight: 800,
                background: "rgba(34, 197, 94, 0.15)",
                padding: "1px 6px",
                borderRadius: "3px",
              }}
            >
              {details.status || "OPERATIONAL"}
            </span>
            <span style={{ color: "rgba(148, 163, 184, 0.4)" }}>|</span>
            <span style={{ color: "#38bdf8" }}>{station}</span>
          </div>
        </div>

        {/* Live Operational Metrics Grid */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "6px",
            marginBottom: "10px",
          }}
        >
          {details.metrics.slice(0, 4).map((m, idx) => (
            <div
              key={idx}
              style={{
                background: "rgba(30, 41, 59, 0.75)",
                border: "1px solid rgba(148, 163, 184, 0.12)",
                borderRadius: "5px",
                padding: "6px 8px",
              }}
            >
              <div
                style={{
                  fontSize: "8.5px",
                  color: "#94a3b8",
                  fontFamily: "ui-monospace, monospace",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                }}
              >
                {m.label}
              </div>
              <div
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#f1f5f9",
                  marginTop: "2px",
                  fontFamily: "ui-monospace, monospace",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span>{m.value}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Action Button: Open Subsystem */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            paddingTop: "8px",
            borderTop: "1px solid rgba(148, 163, 184, 0.16)",
          }}
        >
          <span
            style={{
              fontSize: "9px",
              fontFamily: "ui-monospace, monospace",
              color: "#64748b",
            }}
          >
            CONFIDENCE: {details.confidence}
          </span>

          <button
            type="button"
            onClick={() => navigate(details.route)}
            style={{
              background: "#0284c7",
              border: "none",
              color: "#ffffff",
              padding: "5px 12px",
              borderRadius: "4px",
              fontSize: "10.5px",
              fontWeight: 800,
              letterSpacing: "0.05em",
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(2, 132, 199, 0.4)",
              transition: "all 0.15s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#0369a1";
              e.currentTarget.style.transform = "translateX(2px)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#0284c7";
              e.currentTarget.style.transform = "translateX(0)";
            }}
          >
            <span>OPEN SUBSYSTEM</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}

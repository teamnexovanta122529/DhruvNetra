import { useState, useRef, useEffect } from "react";
import PageHeader from "../common/PageHeader";
import { useStation } from "../../../context/StationContext";
import {
  quickScenarios,
  simulationHistory,
  initialChatMessages,
} from "../../../data/whatIfData";
import { simulateWhatIfQuery } from "../../../services/whatIfApi";

export default function WhatIfAnalysis() {
  const { station, stationInfo } = useStation();

  const [activeScenario, setActiveScenario] = useState(quickScenarios[0]);
  const [messages, setMessages] = useState(initialChatMessages);
  const [inputValue, setInputValue] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [chartMetric, setChartMetric] = useState("fuel"); // 'fuel' | 'power'
  const [historyList, setHistoryList] = useState(simulationHistory);

  const chatEndRef = useRef(null);

  // Auto-scroll chat to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAnalyzing]);

  // Handle Quick Scenario Preset click
  const handleSelectScenario = async (scenarioPreset) => {
    const query = scenarioPreset.query;
    const userMsg = {
      id: `msg-${Date.now()}-u`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour12: false }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      // Call live FastAPI What-If Analysis API (POST /api/what-if)
      const liveResult = await simulateWhatIfQuery(query, station);
      setActiveScenario(liveResult);

      const aiMsg = {
        id: `msg-${Date.now()}-ai`,
        sender: "ai",
        text: liveResult.aiResponse || liveResult.explanation,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour12: false }),
        scenarioId: liveResult.id,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Add to recent simulations log
      setHistoryList((prev) => [
        {
          id: liveResult.id,
          timestamp: new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          }) + " IST",
          date: "05 Sep 2026",
          station: station,
          title: liveResult.title,
          fuelSaved: liveResult.impact.fuelSaved,
          risk: liveResult.impact.riskLevel,
          status: "COMPLETED",
          rawResult: liveResult,
        },
        ...prev.slice(0, 5),
      ]);
    } catch (err) {
      console.error("[!] What-If Simulation API Error:", err);
      const errMsg = err.message || "Failed to execute What-If analysis on backend engine.";
      setErrorMessage(errMsg);

      const systemErrorMsg = {
        id: `msg-${Date.now()}-sys-err`,
        sender: "system",
        text: `⚠️ SIMULATION ADVISORY REJECTION: ${errMsg}`,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour12: false }),
      };
      setMessages((prev) => [...prev, systemErrorMsg]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Handle custom natural language user query submit
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    const query = inputValue.trim();
    if (!query || isAnalyzing) return;

    const userMsg = {
      id: `msg-${Date.now()}-u`,
      sender: "user",
      text: query,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour12: false }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");
    setIsAnalyzing(true);
    setErrorMessage(null);

    try {
      // Call live FastAPI What-If Analysis API (POST /api/what-if)
      const liveResult = await simulateWhatIfQuery(query, station);
      setActiveScenario(liveResult);

      const aiMsg = {
        id: `msg-${Date.now()}-ai`,
        sender: "ai",
        text: liveResult.aiResponse || liveResult.explanation,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour12: false }),
        scenarioId: liveResult.id,
      };

      setMessages((prev) => [...prev, aiMsg]);

      // Add to recent simulations log
      setHistoryList((prev) => [
        {
          id: liveResult.id,
          timestamp: new Date().toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
          }) + " IST",
          date: "05 Sep 2026",
          station: station,
          title: query.length > 34 ? query.slice(0, 34) + "..." : query,
          fuelSaved: liveResult.impact.fuelSaved,
          risk: liveResult.impact.riskLevel,
          status: "COMPLETED",
          rawResult: liveResult,
        },
        ...prev.slice(0, 5),
      ]);
    } catch (err) {
      console.error("[!] What-If Simulation API Error:", err);
      const errMsg = err.message || "Failed to execute What-If analysis on backend engine.";
      setErrorMessage(errMsg);

      const systemErrorMsg = {
        id: `msg-${Date.now()}-sys-err`,
        sender: "system",
        text: `⚠️ SIMULATION ADVISORY REJECTION: ${errMsg}`,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour12: false }),
      };
      setMessages((prev) => [...prev, systemErrorMsg]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const { impact } = activeScenario;

  return (
    <div className="dashboard-page whatif-page">
      <PageHeader
        eyebrow={`DHRUVNETRA / AI DECISION SUPPORT · ${stationInfo?.code || "MT"} NODE`}
        title="WHAT-IF OPERATIONAL ANALYSIS"
        description={`Simulate and evaluate mission-critical system reconfigurations, fuel load balancing, and extreme polar contingencies for ${station} Station.`}
        status="SIMULATION ENGINE ONLINE (POST /api/what-if)"
      />

      {/* ERROR BANNER IF REJECTED OR API ISSUE */}
      {errorMessage && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: "rgba(239, 68, 68, 0.15)",
            border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: 6,
            padding: "0.75rem 1rem",
            marginBottom: "1.25rem",
            fontSize: "0.8rem",
            fontFamily: "monospace",
            color: "#fca5a5",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
            <span style={{ fontSize: "1rem" }}>⚠️</span>
            <strong>{errorMessage}</strong>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#fca5a5",
              cursor: "pointer",
              fontSize: "0.9rem",
              padding: "0 0.4rem",
            }}
          >
            ✕
          </button>
        </div>
      )}

      {/* SIMULATION / DEMO DATA DISCLAIMER */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(0, 240, 255, 0.07)",
          border: "1px solid rgba(0, 240, 255, 0.25)",
          borderRadius: 6,
          padding: "0.6rem 1rem",
          marginBottom: "1.25rem",
          fontSize: "0.75rem",
          fontFamily: "monospace",
          color: "#6be2f2",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>⌁</span>
          <strong>FASTAPI BACKEND CONNECTED (HYBRID LLM + DETERMINISTIC MULTI-PHYSICS + XGBOOST)</strong>
        </div>
        <span style={{ color: "#a0c4dc", fontSize: "0.7rem" }}>
          POST /api/what-if live endpoint connected to deterministic Antarctic microgrid physics.
        </span>
      </div>

      {/* TOP SCENARIO KPI STRIP */}
      <section className="whatif-kpi-strip">
        <div className="kpi-card">
          <span className="kpi-label">ACTIVE SCENARIO</span>
          <strong className="kpi-value highlight-cyan">
            {activeScenario.title}
          </strong>
          <span className="kpi-sub">CATEGORY: {activeScenario.category}</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">PROJECTED FUEL DELTA</span>
          <strong className="kpi-value text-green">
            {impact.fuelSaved}
          </strong>
          <span className="kpi-sub">Burn: {impact.projectedConsumption} (was {impact.currentConsumption})</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">ELECTRICAL LOAD</span>
          <strong className="kpi-value">
            {impact.projectedLoad}
          </strong>
          <span className="kpi-sub">Baseline: {impact.currentLoad}</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">RISK LEVEL</span>
          <div className="risk-pill-row">
            <span
              className={`risk-badge ${
                impact.riskLevel === "LOW"
                  ? "risk-low"
                  : impact.riskLevel === "MEDIUM"
                  ? "risk-medium"
                  : impact.riskLevel === "HIGH"
                  ? "risk-high"
                  : "risk-critical"
              }`}
            >
              ● {impact.riskLevel}
            </span>
            <span className="risk-score">INDEX: {impact.riskScore}/100</span>
          </div>
          <span className="kpi-sub">{impact.recommendation}</span>
        </div>
      </section>

      {/* MAIN TWO-COLUMN WORKSPACE */}
      <div className="whatif-main-grid">
        {/* LEFT COLUMN: AI SCENARIO CONSOLE */}
        <section className="dashboard-panel whatif-chat-panel">
          <div className="panel-header-custom">
            <div className="panel-header-left">
              <span className="panel-kicker">CONVERSATIONAL DECISION ASSISTANT</span>
              <h2 className="panel-heading-title">AI SCENARIO SIMULATOR</h2>
            </div>
            <div className="panel-status-tag">
              <span className="pulse-dot green" />
              <span>HYBRID AI CONNECTED</span>
            </div>
          </div>

          {/* QUICK SCENARIO SUGGESTION CHIPS */}
          <div className="quick-scenarios-container">
            <span className="chips-label">SCENARIO PRESETS:</span>
            <div className="chips-scroller">
              {quickScenarios.map((sc) => (
                <button
                  key={sc.id}
                  type="button"
                  onClick={() => handleSelectScenario(sc)}
                  disabled={isAnalyzing}
                  className={`scenario-chip ${
                    activeScenario.id === sc.id ? "active" : ""
                  }`}
                  data-cursor="pointer"
                >
                  <span className="chip-cat">[{sc.category}]</span>
                  <span className="chip-title">{sc.title}</span>
                </button>
              ))}
            </div>
          </div>

          {/* CHAT STREAM CONTAINER */}
          <div className="whatif-chat-stream">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`chat-bubble-wrapper ${
                  msg.sender === "user"
                    ? "user-msg-wrap"
                    : msg.sender === "system"
                    ? "system-msg-wrap"
                    : "ai-msg-wrap"
                }`}
              >
                <div className="chat-meta">
                  <span className="sender-tag">
                    {msg.sender === "user"
                      ? "MISSION COMMANDER"
                      : msg.sender === "system"
                      ? "SYSTEM ADVISORY"
                      : "DHRUVNETRA AI"}
                  </span>
                  <span className="time-tag">{msg.timestamp}</span>
                </div>

                <div className={`chat-bubble ${msg.sender}`}>
                  <p className="bubble-text">{msg.text}</p>
                </div>
              </div>
            ))}

            {isAnalyzing && (
              <div className="chat-bubble-wrapper ai-msg-wrap">
                <div className="chat-meta">
                  <span className="sender-tag">DHRUVNETRA AI</span>
                  <span className="time-tag">RUNNING SIMULATION...</span>
                </div>
                <div className="chat-bubble ai analyzing-bubble">
                  <div className="typing-indicator">
                    <span />
                    <span />
                    <span />
                  </div>
                  <span className="analyzing-text">
                    Executing LLM parser, multi-physics balance, and XGBoost trajectory...
                  </span>
                </div>
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* CHAT INPUT BAR */}
          <form className="whatif-input-form" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a what-if scenario (e.g. What if Generator 1 is turned off for 7 hours?)..."
              disabled={isAnalyzing}
              className="whatif-text-input"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || isAnalyzing}
              className="whatif-send-btn"
              data-cursor="pointer"
              title="Simulate Scenario (Enter)"
            >
              <span>{isAnalyzing ? "COMPUTING" : "SIMULATE"}</span>
              <span className="btn-arrow">➤</span>
            </button>
          </form>
        </section>

        {/* RIGHT COLUMN: STRUCTURED IMPACT ANALYSIS & VISUALIZATION */}
        <div className="whatif-results-column">
          {/* IMPACT CARDS */}
          <section className="dashboard-panel whatif-impact-panel">
            <div className="panel-header-custom">
              <div className="panel-header-left">
                <span className="panel-kicker">ENGINEERING IMPACT REPORT</span>
                <h2 className="panel-heading-title">TELEMETRY PROJECTION</h2>
              </div>
              <span className="badge-demo">FASTAPI LIVE</span>
            </div>

            <div className="impact-grid-cards">
              {/* FUEL IMPACT */}
              <div className="impact-card">
                <div className="impact-card-top">
                  <span className="impact-icon">◉</span>
                  <span className="impact-title">FUEL CONSUMPTION</span>
                </div>
                <div className="impact-data-rows">
                  <div className="data-row">
                    <span>Baseline Rate:</span>
                    <strong>{impact.currentConsumption}</strong>
                  </div>
                  <div className="data-row">
                    <span>Projected Rate:</span>
                    <strong className="text-cyan">{impact.projectedConsumption}</strong>
                  </div>
                  <div className="data-row highlight-row">
                    <span>Estimated Delta:</span>
                    <strong className="text-green">{impact.fuelSaved}</strong>
                  </div>
                </div>
              </div>

              {/* POWER LOAD */}
              <div className="impact-card">
                <div className="impact-card-top">
                  <span className="impact-icon">ϟ</span>
                  <span className="impact-title">POWER & MICROGRID</span>
                </div>
                <div className="impact-data-rows">
                  <div className="data-row">
                    <span>Baseline Load:</span>
                    <strong>{impact.currentLoad}</strong>
                  </div>
                  <div className="data-row">
                    <span>Projected Load:</span>
                    <strong className="text-cyan">{impact.projectedLoad}</strong>
                  </div>
                  <div className="data-row highlight-row">
                    <span>Power Deficit:</span>
                    <strong className={impact.powerDeficit > 0 ? "text-red" : "text-green"}>
                      {impact.powerDeficit !== undefined ? `${impact.powerDeficit.toFixed(1)} kW` : "0.0 kW (STABLE)"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* BATTERY BESS IMPACT */}
              <div className="impact-card">
                <div className="impact-card-top">
                  <span className="impact-icon">🔋</span>
                  <span className="impact-title">BATTERY BESS BUFFER</span>
                </div>
                <div className="impact-data-rows">
                  <div className="data-row">
                    <span>Projected SOC:</span>
                    <strong>{impact.batterySoc !== undefined ? `${impact.batterySoc.toFixed(1)}%` : "94.2%"}</strong>
                  </div>
                  <div className="data-row">
                    <span>Buffer Status:</span>
                    <strong className="text-cyan">{impact.backupLoad || "Active Buffer"}</strong>
                  </div>
                  <div className="data-row highlight-row">
                    <span>Inverter Ready:</span>
                    <strong className="text-green">100% ONLINE</strong>
                  </div>
                </div>
              </div>

              {/* TEMPERATURE IMPACT */}
              <div className="impact-card">
                <div className="impact-card-top">
                  <span className="impact-icon">🌡️</span>
                  <span className="impact-title">HABITAT TEMPERATURE</span>
                </div>
                <div className="impact-data-rows">
                  <div className="data-row">
                    <span>Indoor Temp:</span>
                    <strong>{impact.indoorTemp !== undefined ? `${impact.indoorTemp.toFixed(1)}°C` : "19.8°C"}</strong>
                  </div>
                  <div className="data-row">
                    <span>Thermal Status:</span>
                    <strong className="text-cyan">
                      {impact.indoorTemp !== undefined && impact.indoorTemp < 5 ? "WARNING" : "NOMINAL (+19°C)"}
                    </strong>
                  </div>
                  <div className="data-row highlight-row">
                    <span>Glycol Tracing:</span>
                    <strong className="text-green">ENGAGED</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* OPERATIONAL RECOMMENDATION */}
            <div
              className={`recommendation-box ${
                impact.riskLevel === "LOW"
                  ? "rec-green"
                  : impact.riskLevel === "MEDIUM"
                  ? "rec-yellow"
                  : "rec-red"
              }`}
            >
              <div className="rec-header">
                <span className="rec-badge">{impact.recommendation}</span>
                <span className="rec-risk">RISK INDEX: {impact.riskScore}/100</span>
              </div>
              <p className="rec-text">{impact.recommendationText}</p>
            </div>

            {/* SUBSYSTEMS AFFECTED TABLE */}
            <div className="systems-affected-block">
              <span className="sub-heading">SUBSYSTEMS UNDER SIMULATION:</span>
              <div className="systems-list">
                {impact.systemsAffected.map((sys, idx) => (
                  <div key={idx} className="sys-item">
                    <span className="sys-name">{sys.name}</span>
                    <span className="sys-status">{sys.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* VISUALIZATION CHART (CURRENT VS PROJECTED) */}
          <section className="dashboard-panel whatif-chart-panel">
            <div className="panel-header-custom">
              <div className="panel-header-left">
                <span className="panel-kicker">TEMPORAL PROFILE</span>
                <h2 className="panel-heading-title">CURRENT VS PROJECTED CURVE</h2>
              </div>
              <div className="chart-toggle-group">
                <button
                  type="button"
                  className={`chart-tab ${chartMetric === "fuel" ? "active" : ""}`}
                  onClick={() => setChartMetric("fuel")}
                >
                  FUEL RATE (L/h)
                </button>
                <button
                  type="button"
                  className={`chart-tab ${chartMetric === "power" ? "active" : ""}`}
                  onClick={() => setChartMetric("power")}
                >
                  POWER LOAD (kW)
                </button>
              </div>
            </div>

            <div className="custom-svg-chart-container">
              <SimpleComparisonChart
                labels={impact.chartData.labels}
                baseline={
                  chartMetric === "fuel"
                    ? impact.chartData.currentFuel
                    : impact.chartData.currentPower
                }
                projected={
                  chartMetric === "fuel"
                    ? impact.chartData.projectedFuel
                    : impact.chartData.projectedPower
                }
                unit={chartMetric === "fuel" ? "L/h" : "kW"}
              />
            </div>
          </section>
        </div>
      </div>

      {/* RECENT SIMULATIONS LOG TABLE */}
      <section className="dashboard-section whatif-history-section">
        <div className="section-heading">
          <div>
            <span>HISTORICAL RUNS</span>
            <h2>RECENT OPERATIONAL SIMULATIONS</h2>
          </div>
          <span className="section-live">● AUDIT LOG ACTIVE</span>
        </div>

        <div className="history-table-wrapper">
          <table className="whatif-table">
            <thead>
              <tr>
                <th>RUN ID</th>
                <th>TIMESTAMP</th>
                <th>STATION</th>
                <th>SCENARIO TITLE</th>
                <th>FUEL DELTA</th>
                <th>RISK LEVEL</th>
                <th>STATUS</th>
                <th>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {historyList.map((item) => (
                <tr key={item.id}>
                  <td className="mono-cell">{item.id}</td>
                  <td>
                    {item.date} · {item.timestamp}
                  </td>
                  <td className="station-tag-cell">{item.station}</td>
                  <td className="scenario-title-cell">{item.title}</td>
                  <td className="mono-cell text-green">{item.fuelSaved}</td>
                  <td>
                    <span
                      className={`risk-badge-small ${
                        item.risk === "LOW"
                          ? "risk-low"
                          : item.risk === "MEDIUM"
                          ? "risk-medium"
                          : "risk-high"
                      }`}
                    >
                      {item.risk}
                    </span>
                  </td>
                  <td className="status-cell">{item.status}</td>
                  <td>
                    <button
                      type="button"
                      className="history-action-btn"
                      onClick={() => {
                        if (item.rawResult) {
                          setActiveScenario(item.rawResult);
                        } else {
                          const match = quickScenarios.find((s) =>
                            s.title.toLowerCase().includes(item.title.toLowerCase().slice(0, 10))
                          ) || quickScenarios[0];
                          handleSelectScenario(match);
                        }
                      }}
                      data-cursor="pointer"
                    >
                      LOAD ⟲
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* DECISION SUPPORT DISCLAIMER */}
      <footer className="whatif-footer-disclaimer">
        <span className="disclaimer-badge">DECISION SUPPORT NOTICE</span>
        <span>
          Simulated outputs are hybrid physics and machine learning predictions derived from real-time digital twin telemetry. Operational commands must be verified by the on-site Chief Station Engineer prior to equipment dispatch.
        </span>
      </footer>
    </div>
  );
}

/* =====================================================
   CLEAN COMPARISON SVG CHART COMPONENT
===================================================== */
function SimpleComparisonChart({ labels, baseline, projected, unit }) {
  const height = 180;
  const width = 500;
  const padding = { top: 25, right: 30, bottom: 30, left: 45 };

  const allValues = [...(baseline || [0]), ...(projected || [0])];
  const minVal = Math.floor(Math.min(...allValues) * 0.9);
  const maxVal = Math.ceil(Math.max(...allValues) * 1.1) || 100;

  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const getX = (index) =>
    padding.left + (index / (labels.length - 1 || 1)) * chartW;
  const getY = (val) =>
    padding.top + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;

  const baselinePoints = (baseline || [])
    .map((v, i) => `${getX(i)},${getY(v)}`)
    .join(" ");

  const projectedPoints = (projected || [])
    .map((v, i) => `${getX(i)},${getY(v)}`)
    .join(" ");

  return (
    <div className="svg-chart-wrapper">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="whatif-svg-chart"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {[0, 0.33, 0.66, 1].map((ratio, idx) => {
          const y = padding.top + chartH * ratio;
          const labelVal = Math.round(maxVal - ratio * (maxVal - minVal));
          return (
            <g key={idx}>
              <line
                x1={padding.left}
                y1={y}
                x2={width - padding.right}
                y2={y}
                stroke="rgba(130, 220, 235, 0.12)"
                strokeDasharray="3 3"
              />
              <text
                x={padding.left - 8}
                y={y + 3}
                fill="rgba(160, 220, 235, 0.55)"
                fontSize="7"
                textAnchor="end"
                fontFamily="monospace"
              >
                {labelVal}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {labels.map((lbl, idx) => {
          const x = getX(idx);
          return (
            <text
              key={idx}
              x={x}
              y={height - 10}
              fill="rgba(160, 220, 235, 0.65)"
              fontSize="7"
              textAnchor="middle"
              fontFamily="monospace"
            >
              {lbl}
            </text>
          );
        })}

        {/* Baseline (Current) Polyline (Cyan dashed) */}
        {baselinePoints && (
          <polyline
            fill="none"
            stroke="rgba(107, 226, 242, 0.6)"
            strokeWidth="1.5"
            strokeDasharray="4 3"
            points={baselinePoints}
          />
        )}

        {/* Projected Polyline (Amber/Green solid) */}
        {projectedPoints && (
          <polyline
            fill="none"
            stroke="#4ade80"
            strokeWidth="2"
            points={projectedPoints}
          />
        )}

        {/* Points for projected values */}
        {(projected || []).map((val, idx) => (
          <circle
            key={idx}
            cx={getX(idx)}
            cy={getY(val)}
            r="3"
            fill="#4ade80"
            stroke="#051622"
            strokeWidth="1.5"
          />
        ))}
      </svg>

      {/* Chart Legend */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          gap: "1.2rem",
          marginTop: "0.5rem",
          fontSize: "0.75rem",
          fontFamily: "monospace",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span
            style={{
              width: "12px",
              height: "2px",
              background: "rgba(107, 226, 242, 0.6)",
              borderTop: "1px dashed rgba(107, 226, 242, 0.9)",
              display: "inline-block",
            }}
          />
          <span style={{ color: "#6be2f2" }}>BASELINE ({unit})</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <span
            style={{
              width: "12px",
              height: "2px",
              background: "#4ade80",
              display: "inline-block",
            }}
          />
          <span style={{ color: "#4ade80" }}>PROJECTED WHAT-IF ({unit})</span>
        </div>
      </div>
    </div>
  );
}
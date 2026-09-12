import { useState, useRef, useEffect } from "react";
import PageHeader from "../common/PageHeader";
import { useStation } from "../../../context/StationContext";
import { simulateWhatIfQuery } from "../../../services/whatIfApi";

export default function WhatIfAnalysis() {
  const { station, stationInfo, setStation } = useStation();

  // Multi-turn context state
  const [activeScenarioContext, setActiveScenarioContext] = useState(null);
  const [lastQuery, setLastQuery] = useState(null);
  const [lastIntent, setLastIntent] = useState(null);

  // Chat messages
  const [messages, setMessages] = useState([
    {
      id: "msg-init-1",
      sender: "system",
      text: `DHRUVNETRA AI Operational Intelligence online. Grounded in live ${station} Station telemetry and multi-physics simulation models.`,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour12: false }),
    },
    {
      id: "msg-init-2",
      sender: "ai",
      text: `**${station.toUpperCase()} MISSION ASSISTANT READY**\n\nI can analyze real-time station operations, telemetry, and hypothetical contingencies.\n\nYou can ask:\n• Direct telemetry: *"What is the condition of Generator 1?"*, *"What is the fuel level till now?"*, *"What is the outdoor temperature?"*\n• What-If scenarios: *"What if Generator 1 is turned off for 8 hours?"*, *"What if G1 and G2 both fail?"*, *"Can Maitri survive without G1?"*\n• Recommendations: *"Should I turn off G1?"*, *"Will shutting G1 save fuel?"*, *"What should I do instead?"*`,
      timestamp: new Date().toLocaleTimeString("en-IN", { hour12: false }),
      isTelemetry: false,
      suggestions: [
        "What is the condition of Generator 1?",
        "What if Generator 1 is turned off for 8 hours?",
        "What is the fuel level till now?",
        "What is the outdoor temperature?",
      ],
    },
  ]);

  const [inputValue, setInputValue] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll chat to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAnalyzing]);

  // Context-aware follow-up suggestion generator
  const getContextualSuggestions = (query, result) => {
    const qLower = query.toLowerCase();

    if (result?.isTelemetry) {
      if (qLower.includes("generator") || qLower.includes("g1") || qLower.includes("g2")) {
        return [
          "What if I turn it off for 8 hours?",
          "How much fuel does it consume per hour?",
          "Should I turn off G1 for maintenance?",
        ];
      }
      if (qLower.includes("fuel")) {
        return [
          "What is the condition of Generator 1?",
          "How many days of fuel reserve remain?",
          "What if fuel drops below 20%?",
        ];
      }
      return [
        "What is the condition of Generator 1?",
        "What if Generator 1 is turned off for 8 hours?",
        "What is the fuel level till now?",
      ];
    }

    // What-If Scenario follow-up generation
    const affectedGens = result?.scenario?.affected_generators || [];
    const isSingleGen = affectedGens.length === 1 || qLower.includes("generator 1") || qLower.includes("g1");
    const isDualGen = affectedGens.length >= 2 || (qLower.includes("g1") && qLower.includes("g2"));

    if (isDualGen) {
      return [
        "Would that be safe?",
        "What should I do instead?",
        "How long can the station survive on BESS battery?",
        "Can we start Generator 3 as backup?",
      ];
    }

    if (isSingleGen) {
      return [
        "What if Generator 2 also goes off?",
        "Would that be safe?",
        "What should I do instead?",
        "Will shutting G1 save fuel?",
      ];
    }

    if (qLower.includes("fuel") || qLower.includes("save")) {
      return [
        "What should I do instead?",
        "What is the condition of Generator 1?",
        "What if Generator 2 also goes off?",
      ];
    }

    return [
      "What if Generator 2 also goes off?",
      "Would that be safe?",
      "What should I do instead?",
      "Will this save fuel?",
    ];
  };

  // Submit query handler
  const handleQuerySubmit = async (queryText) => {
    const query = (queryText || inputValue).trim();
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
      const liveResult = await simulateWhatIfQuery(
        query,
        station,
        activeScenarioContext,
        lastQuery,
        lastIntent,
        {},
        "OPERATOR"
      );

      setLastQuery(query);
      setLastIntent(liveResult.intent);

      // Track scenario context for follow-up conversational resolution
      if (liveResult.isTelemetry) {
        // If query was direct telemetry, keep prior scenario context if user asks relative follow-up
      } else {
        setActiveScenarioContext(liveResult.scenario || { type: "WHAT_IF", rawQuery: query });
      }

      const suggestions = getContextualSuggestions(query, liveResult);

      const aiMsg = {
        id: `msg-${Date.now()}-ai`,
        sender: "ai",
        text: liveResult.aiResponse || liveResult.text || liveResult.explanation,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour12: false }),
        scenarioId: liveResult.isTelemetry ? null : liveResult.id,
        telemetryBadge: liveResult.telemetryBadge,
        isTelemetry: Boolean(liveResult.isTelemetry),
        responseType: liveResult.responseType,
        simulationData: liveResult.isTelemetry ? null : liveResult,
        suggestions: suggestions,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("[!] DHRUVNETRA AI Assistant Error:", err);
      const errMsg = err.message || "Failed to process operational query.";
      setErrorMessage(errMsg);

      const systemErrorMsg = {
        id: `msg-${Date.now()}-sys-err`,
        sender: "system",
        text: `⚠️ MISSION ADVISORY: ${errMsg}`,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour12: false }),
      };
      setMessages((prev) => [...prev, systemErrorMsg]);
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleClearSession = () => {
    setActiveScenarioContext(null);
    setLastQuery(null);
    setLastIntent(null);
    setErrorMessage(null);
    setMessages([
      {
        id: `msg-${Date.now()}-reset`,
        sender: "system",
        text: `Scenario context cleared. Mission Assistant reset to baseline ${station} telemetry.`,
        timestamp: new Date().toLocaleTimeString("en-IN", { hour12: false }),
      },
    ]);
  };

  // Helper to format Markdown-like bold and headers for clean display
  const renderFormattedContent = (content) => {
    if (!content) return null;

    const paragraphs = content.split("\n\n");

    return paragraphs.map((para, idx) => {
      const trimmed = para.trim();
      if (!trimmed) return null;

      // Handle bold header titles
      if (trimmed.startsWith("**") && trimmed.endsWith("**") && !trimmed.includes("\n")) {
        const titleText = trimmed.replace(/\*\*/g, "");
        return (
          <h4 key={idx} className="chat-msg-header">
            {titleText}
          </h4>
        );
      }

      // Handle bullet list paragraphs
      if (trimmed.includes("•") || trimmed.startsWith("-")) {
        const lines = trimmed.split("\n");
        return (
          <div key={idx} className="chat-bullet-block">
            {lines.map((line, lIdx) => {
              const cleanLine = line.replace(/^[•\-]\s*/, "");
              const isSectionTitle = line.startsWith("**") && line.endsWith("**");

              if (isSectionTitle) {
                return (
                  <div key={lIdx} className="chat-section-label">
                    {line.replace(/\*\*/g, "")}
                  </div>
                );
              }

              return (
                <div key={lIdx} className="chat-bullet-row">
                  <span className="chat-bullet-dot">›</span>
                  <span className="chat-bullet-text">
                    {renderInlineFormatted(cleanLine)}
                  </span>
                </div>
              );
            })}
          </div>
        );
      }

      // Handle standard paragraph
      return (
        <p key={idx} className="chat-paragraph">
          {renderInlineFormatted(trimmed)}
        </p>
      );
    });
  };

  // Inline formatting helper for bold and risk tags
  const renderInlineFormatted = (text) => {
    if (!text) return null;

    // Split on **bold**
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        const boldContent = part.slice(2, -2);

        // Highlight verdicts
        if (boldContent.includes("NOT RECOMMENDED") || boldContent.includes("CRITICAL")) {
          return (
            <span key={i} className="badge-verdict danger">
              {boldContent}
            </span>
          );
        }
        if (boldContent.includes("CAUTION ADVISED") || boldContent.includes("MEDIUM")) {
          return (
            <span key={i} className="badge-verdict warning">
              {boldContent}
            </span>
          );
        }
        if (boldContent.includes("RECOMMENDED") || boldContent.includes("LOW")) {
          return (
            <span key={i} className="badge-verdict success">
              {boldContent}
            </span>
          );
        }

        return (
          <strong key={i} className="chat-strong">
            {boldContent}
          </strong>
        );
      }
      return part;
    });
  };

  return (
    <div className="dashboard-page whatif-page chat-first-layout">
      <PageHeader
        eyebrow={`DHRUVNETRA AI / MISSION CONTROL · ${stationInfo?.code || "MT"} NODE`}
        title="OPERATIONAL INTELLIGENCE & WHAT-IF ASSISTANT"
        description={`Direct natural-language command interface. Ask any operational question or simulate hypothetical contingencies against real-time ${station} digital twin telemetry.`}
        status="DECISION INTELLIGENCE ONLINE"
      />

      {/* TOP CONTEXT BAR */}
      <div className="whatif-toolbar-strip">
        <div className="toolbar-left">
          <div className="engine-status-pill">
            <span className="pulse-dot green" />
            <span>REAL-TIME {station.toUpperCase()} SCADA LINKED</span>
          </div>

          {activeScenarioContext && (
            <span className="active-scenario-tag" title="Active scenario memory in context">
              ◈ CONTEXT: {activeScenarioContext.affected_generators?.join("+") || activeScenarioContext.component_id || "WHAT-IF ACTIVE"}
            </span>
          )}
        </div>

        <div className="toolbar-right">
          <div className="station-switch-group">
            <button
              type="button"
              className={`station-pill-btn ${station.toUpperCase() === "MAITRI" ? "active" : ""}`}
              onClick={() => {
                if (setStation) setStation("Maitri");
              }}
            >
              MAITRI
            </button>
            <button
              type="button"
              className={`station-pill-btn ${station.toUpperCase() === "BHARATI" ? "active" : ""}`}
              onClick={() => {
                if (setStation) setStation("Bharati");
              }}
            >
              BHARATI
            </button>
          </div>

          <button
            type="button"
            className="clear-session-btn"
            onClick={handleClearSession}
            title="Reset active scenario context"
          >
            ↺ RESET CONTEXT
          </button>
        </div>
      </div>

      {/* ERROR BANNER */}
      {errorMessage && (
        <div className="whatif-error-banner">
          <div className="err-left">
            <span className="err-icon">⚠️</span>
            <strong>{errorMessage}</strong>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="err-dismiss"
          >
            ✕
          </button>
        </div>
      )}

      {/* CHAT CONTAINER */}
      <div className="whatif-chat-full-container">
        <div className="whatif-chat-stream">
          {messages.map((msg) => (
            <div key={msg.id} className={`chat-message-row ${msg.sender}`}>
              {/* SENDER AVATAR & HEADER */}
              <div className="msg-avatar-tag">
                {msg.sender === "user" ? (
                  <span className="user-icon">👤 COMMANDER</span>
                ) : msg.sender === "ai" ? (
                  <span className="ai-icon">
                    ◈ DHRUVNETRA AI
                    {msg.isTelemetry ? (
                      <span className="msg-type-badge telemetry">LIVE SCADA</span>
                    ) : msg.simulationData ? (
                      <span className="msg-type-badge simulation">WHAT-IF SIMULATION</span>
                    ) : null}
                  </span>
                ) : (
                  <span className="sys-icon">⚙️ SYS CONSOLE</span>
                )}
                <span className="msg-time">{msg.timestamp}</span>
              </div>

              {/* MESSAGE CONTENT CARD */}
              <div className={`chat-bubble ${msg.sender}`}>
                {/* SCADA TELEMETRY BADGE IF FACTUAL QUERY */}
                {msg.telemetryBadge && (
                  <div className="scada-telemetry-badge">
                    <div className="scada-badge-header">
                      <span className="scada-station">● {msg.telemetryBadge.station} SCADA</span>
                      <span className="scada-live-pulse">LIVE TELEMETRY</span>
                    </div>
                    <div className="scada-badge-body">
                      <div className="scada-metric-title">{msg.telemetryBadge.metric}</div>
                      <div className="scada-metric-val">
                        {msg.telemetryBadge.value}
                        {msg.telemetryBadge.unit ? ` ${msg.telemetryBadge.unit}` : ""}
                      </div>
                      <div className="scada-component-tag">Target: {msg.telemetryBadge.component}</div>
                    </div>
                  </div>
                )}

                {/* TEXT CONTENT */}
                <div className="chat-text-content">
                  {renderFormattedContent(msg.text)}
                </div>

                {/* SUBTLE INLINE TELEMETRY COMPARISON BARS IF WHAT-IF SIMULATION */}
                {msg.simulationData && (
                  <div className="inline-telemetry-impact-box">
                    <div className="impact-box-title">
                      <span>◈ INLINE TELEMETRY DELTA MATRIX</span>
                      <span className="impact-box-station">{msg.simulationData.scenario?.station || station}</span>
                    </div>

                    <div className="impact-mini-grid">
                      {/* POWER IMPACT */}
                      <div className="impact-mini-card">
                        <div className="mini-card-label">⚡ POWER GENERATION</div>
                        <div className="mini-card-vals">
                          <span className="val-before">Before: {msg.simulationData.baseline?.available_capacity_kw || 200} kW</span>
                          <span className="val-arrow">→</span>
                          <span className="val-after">After: {msg.simulationData.prediction?.available_capacity_kw || 100} kW</span>
                        </div>
                        <div className="mini-progress-bar">
                          <div
                            className={`mini-progress-fill ${(msg.simulationData.prediction?.deficit_kw || 0) > 0 ? "deficit" : "normal"}`}
                            style={{
                              width: `${Math.min(100, Math.max(10, ((msg.simulationData.prediction?.available_capacity_kw || 100) / (msg.simulationData.baseline?.available_capacity_kw || 200)) * 100))}%`,
                            }}
                          />
                        </div>
                        <div className="mini-card-sub">
                          {(msg.simulationData.prediction?.deficit_kw || 0) > 0 ? (
                            <span className="text-deficit">Deficit: -{msg.simulationData.prediction?.deficit_kw.toFixed(1)} kW</span>
                          ) : (
                            <span className="text-nominal">Deficit: 0.0 kW (Stable)</span>
                          )}
                        </div>
                      </div>

                      {/* FUEL IMPACT */}
                      <div className="impact-mini-card">
                        <div className="mini-card-label">⛽ FUEL IMPACT</div>
                        <div className="mini-card-vals">
                          <span className="val-before">{msg.simulationData.baseline?.fuel_burn_rate_lph?.toFixed(1) || "26.8"} L/h</span>
                          <span className="val-arrow">→</span>
                          <span className="val-after">{msg.simulationData.prediction?.projected_fuel_burn_lph?.toFixed(1) || "26.9"} L/h</span>
                        </div>
                        <div className="mini-card-sub">
                          <span className="text-highlight">
                            Net Benefit: {msg.simulationData.impact?.fuelSaved || "0.0 L"}
                          </span>
                        </div>
                      </div>

                      {/* HEALTH SCORE */}
                      <div className="impact-mini-card">
                        <div className="mini-card-label">🛡️ STATION HEALTH</div>
                        <div className="mini-card-vals">
                          <span className="val-before">100</span>
                          <span className="val-arrow">→</span>
                          <span className="val-after" style={{ color: (msg.simulationData.health?.projected_score ?? 85) < 60 ? "#dc2626" : "#16a34a" }}>
                            {Math.round(msg.simulationData.health?.projected_score ?? 85)}/100
                          </span>
                        </div>
                        <div className="mini-progress-bar">
                          <div
                            className="mini-progress-fill"
                            style={{
                              width: `${Math.min(100, msg.simulationData.health?.projected_score ?? 85)}%`,
                              background: (msg.simulationData.health?.projected_score ?? 85) < 60 ? "#dc2626" : "#16a34a",
                            }}
                          />
                        </div>
                        <div className="mini-card-sub">
                          <span>Δ {msg.simulationData.health?.delta?.toFixed(0) || "-15"} pts</span>
                        </div>
                      </div>
                    </div>

                    {/* COMPACT EXPANDABLE TECHNICAL DETAILS */}
                    <details className="inline-tech-details">
                      <summary className="tech-details-summary">
                        <span>⚙️ View Detailed Cascading Effects & Alternatives</span>
                      </summary>

                      <div className="tech-details-content">
                        {/* CASCADING EFFECTS */}
                        {msg.simulationData.cascadingEffects?.length > 0 && (
                          <div className="tech-sub-block">
                            <div className="tech-block-title">CASCADING SEQUENCE:</div>
                            <div className="tech-steps-list">
                              {msg.simulationData.cascadingEffects.map((step, sIdx) => (
                                <div key={sIdx} className="tech-step-item">
                                  <span className="tech-step-time">{step.trigger_time}</span>
                                  <span className="tech-step-desc">
                                    <strong>{step.title}:</strong> {step.description}
                                  </span>
                                  <span className={`tech-step-sev ${step.severity?.toLowerCase()}`}>
                                    {step.severity}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* MITIGATION STRATEGIES */}
                        {msg.simulationData.mitigationStrategies?.length > 0 && (
                          <div className="tech-sub-block">
                            <div className="tech-block-title">MITIGATION OPTIONS:</div>
                            <div className="tech-mitigations-list">
                              {msg.simulationData.mitigationStrategies.map((strat, mIdx) => (
                                <div key={mIdx} className={`tech-strat-item ${strat.is_recommended ? "recommended" : ""}`}>
                                  <div className="strat-top">
                                    <span className="strat-name">{strat.name}</span>
                                    {strat.is_recommended && <span className="strat-rec-tag">★ RECOMMENDED</span>}
                                  </div>
                                  <p className="strat-desc">{strat.description}</p>
                                  <button
                                    type="button"
                                    className="strat-action-btn"
                                    onClick={() => handleQuerySubmit(`What if we execute mitigation: ${strat.name}?`)}
                                  >
                                    <span>Simulate this option ›</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* ASSUMPTIONS */}
                        {msg.simulationData.assumptions?.length > 0 && (
                          <div className="tech-sub-block">
                            <div className="tech-block-title">SIMULATION ASSUMPTIONS:</div>
                            <ul className="tech-assumptions-list">
                              {msg.simulationData.assumptions.map((asm, aIdx) => (
                                <li key={aIdx}>{asm}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </details>
                  </div>
                )}

                {/* CONTEXTUAL FOLLOW-UP SUGGESTIONS CHIPS */}
                {msg.suggestions && msg.suggestions.length > 0 && (
                  <div className="chat-suggestions-container">
                    <div className="suggestions-label">SUGGESTED FOLLOW-UPS:</div>
                    <div className="suggestions-chips-row">
                      {msg.suggestions.map((sug, sIdx) => (
                        <button
                          key={sIdx}
                          type="button"
                          className="suggestion-chip"
                          onClick={() => handleQuerySubmit(sug)}
                          disabled={isAnalyzing}
                        >
                          <span>{sug}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* PULSING ANALYZING STATE */}
          {isAnalyzing && (
            <div className="chat-message-row ai analyzing">
              <div className="msg-avatar-tag">
                <span className="ai-icon">◈ DHRUVNETRA AI</span>
                <span className="analyzing-pill">SIMULATING...</span>
              </div>
              <div className="chat-bubble ai analyzing-bubble">
                <div className="analyzing-content">
                  <div className="analyzing-spinner" />
                  <div className="analyzing-text-block">
                    <strong>ANALYZING OPERATIONAL CONTEXT</strong>
                    <span>Reading live {station} SCADA baseline & executing multi-physics simulation...</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* BOTTOM INPUT TERMINAL */}
        <div className="whatif-chat-input-wrapper">
          {/* QUICK PROMPT PILLS ROW */}
          <div className="quick-prompts-bar">
            <span className="quick-label">QUICK PROMPT:</span>
            <button
              type="button"
              className="quick-prompt-pill"
              onClick={() => handleQuerySubmit("What is the condition of Generator 1?")}
              disabled={isAnalyzing}
            >
              G1 Live Status
            </button>
            <button
              type="button"
              className="quick-prompt-pill"
              onClick={() => handleQuerySubmit("What if Generator 1 is turned off for 8 hours?")}
              disabled={isAnalyzing}
            >
              What if G1 is off for 8 hours?
            </button>
            <button
              type="button"
              className="quick-prompt-pill"
              onClick={() => handleQuerySubmit("What if G1 and G2 both fail?")}
              disabled={isAnalyzing}
            >
              What if G1 + G2 fail?
            </button>
            <button
              type="button"
              className="quick-prompt-pill"
              onClick={() => handleQuerySubmit("What is the fuel level till now?")}
              disabled={isAnalyzing}
            >
              Fuel Level
            </button>
            <button
              type="button"
              className="quick-prompt-pill"
              onClick={() => handleQuerySubmit("Will shutting G1 save fuel?")}
              disabled={isAnalyzing}
            >
              Will shutting G1 save fuel?
            </button>
          </div>

          {/* INPUT FORM */}
          <form
            className="whatif-input-form"
            onSubmit={(e) => {
              e.preventDefault();
              handleQuerySubmit();
            }}
          >
            <div className="terminal-prompt-prefix">&gt;</div>
            <input
              ref={inputRef}
              type="text"
              className="whatif-text-input"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Ask any operational or What-If question (e.g. "What if G1 is turned off for 8 hours?", "What is G1 doing?")...`}
              disabled={isAnalyzing}
            />
            <button
              type="submit"
              className="whatif-send-btn"
              disabled={isAnalyzing || !inputValue.trim()}
              title="Submit Query (Enter)"
            >
              <span>➤ SEND</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
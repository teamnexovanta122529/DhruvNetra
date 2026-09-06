import { useState } from "react";
import PageHeader from "../common/PageHeader";
import { useStation } from "../../../context/StationContext";
import {
  commandTypes,
  commandTemplates,
  initialCommandHistory,
} from "../../../data/commandData";

export default function GovernmentCommand() {
  const { station } = useStation();

  const [targetStation, setTargetStation] = useState(station || "MAITRI");
  const [commandType, setCommandType] = useState(commandTypes[0].label);
  const [priority, setPriority] = useState("NORMAL");
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");

  const [history, setHistory] = useState(initialCommandHistory);
  const [selectedCommand, setSelectedCommand] = useState(null);

  // Transmission simulation states
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [transmitStep, setTransmitStep] = useState(0); // 0: Idle, 1: Auth, 2: Channel, 3: Transmitting, 4: Delivered
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [successToast, setSuccessToast] = useState(null);

  // Filter state for history
  const [filterStation, setFilterStation] = useState("ALL");
  const [filterPriority, setFilterPriority] = useState("ALL");

  // Load a preset template
  const handleLoadTemplate = (tpl) => {
    setTitle(tpl.title);
    setTargetStation(tpl.target === "ALL" ? "ALL" : tpl.target);
    setCommandType(tpl.type);
    setPriority(tpl.priority);
    setMessage(tpl.text);
  };

  // Initiate send flow -> Always trigger confirmation modal
  const handleInitiateSend = (e) => {
    e?.preventDefault();
    if (!message.trim() || !title.trim() || isTransmitting) return;
    setShowConfirmModal(true);
  };

  // Perform multi-stage transmission animation
  const executeTransmission = () => {
    setShowConfirmModal(false);
    setIsTransmitting(true);
    setTransmitStep(1); // 1. Authenticating

    setTimeout(() => {
      setTransmitStep(2); // 2. Secure Channel Established
    }, 400);

    setTimeout(() => {
      setTransmitStep(3); // 3. Transmitting
    }, 800);

    setTimeout(() => {
      setTransmitStep(4); // 4. Delivered
    }, 1200);

    setTimeout(() => {
      const newCmd = {
        id: `CMD-${new Date().getFullYear()}-0${Math.floor(800 + Math.random() * 199)}`,
        time: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }) + " IST",
        date: "05 Sep 2026",
        station: targetStation,
        title: title.trim(),
        type: commandType,
        priority: priority,
        status: "DELIVERED",
        statusDetail: `Delivered to Terminal ${targetStation === "ALL" ? "BROADCAST-ALL" : targetStation + "-COMM-1"}`,
        sender: "NCPOR Mission Control · Polar Command Directorate",
        transmission: "INSAT-4CR Satcom (Encrypted AES-256-GCM)",
        receivedAt: new Date().toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }) + " IST",
        latency: targetStation === "BHARATI" ? "612 ms" : "742 ms",
        rawContent: message.trim(),
      };

      setHistory((prev) => [newCmd, ...prev]);
      setIsTransmitting(false);
      setTransmitStep(0);
      setSuccessToast(`Directive "${title}" successfully transmitted to ${targetStation}.`);

      // Clear input fields
      setTitle("");
      setMessage("");

      setTimeout(() => {
        setSuccessToast(null);
      }, 4500);
    }, 1600);
  };

  // Filtered history list
  const filteredHistory = history.filter((item) => {
    if (filterStation !== "ALL" && item.station !== filterStation) return false;
    if (filterPriority !== "ALL" && item.priority !== filterPriority) return false;
    return true;
  });

  return (
    <div className="dashboard-page government-page">
      <PageHeader
        eyebrow="DHRUVNETRA / REMOTE MISSION CONTROL & POLAR GOVERNANCE"
        title="GOVERNMENT COMMAND CONSOLE"
        description="Transmit verified operational directives, maintenance orders, and emergency broadcast protocols to Indian Antarctic Stations via encrypted Satcom."
        status="SECURE CHANNEL ONLINE"
      />

      {/* PROTOTYPE SECURITY & SIMULATION NOTICE */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "rgba(255, 184, 77, 0.08)",
          border: "1px solid rgba(255, 184, 77, 0.25)",
          borderRadius: 6,
          padding: "0.6rem 1rem",
          marginBottom: "1.25rem",
          fontSize: "0.75rem",
          fontFamily: "monospace",
          color: "#ffb84d",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span>⚠</span>
          <strong>SIMULATED SATCOM TRANSMISSION — PROTOTYPE</strong>
        </div>
        <span style={{ color: "#a0c4dc", fontSize: "0.7rem" }}>
          Decision-support & polar telemetry interface. No direct electrical hardware actuation.
        </span>
      </div>

      {/* SECURITY & CRYPTOGRAPHIC GATEWAY STRIP */}
      <section className="gov-security-strip">
        <div className="sec-item">
          <span className="sec-dot green" />
          <div className="sec-content">
            <span className="sec-label">SATCOM LINK</span>
            <strong className="sec-val">CONNECTED (99.4% SNR)</strong>
          </div>
        </div>

        <div className="sec-item">
          <span className="sec-dot cyan" />
          <div className="sec-content">
            <span className="sec-label">COMMAND CHANNEL</span>
            <strong className="sec-val">ENCRYPTED (AES-256-GCM)</strong>
          </div>
        </div>

        <div className="sec-item">
          <span className="sec-dot green" />
          <div className="sec-content">
            <span className="sec-label">AUTHENTICATION</span>
            <strong className="sec-val">LEVEL-4 POLAR COMMAND</strong>
          </div>
        </div>

        <div className="sec-item">
          <span className="sec-dot cyan" />
          <div className="sec-content">
            <span className="sec-label">UPLINK GATEWAY</span>
            <strong className="sec-val">NCPOR GOA · SYNC 14:34 IST</strong>
          </div>
        </div>
      </section>

      {/* SUCCESS TOAST NOTIFICATION */}
      {successToast && (
        <div className="gov-success-toast">
          <span className="toast-icon">✓</span>
          <span>{successToast}</span>
          <button
            type="button"
            className="toast-dismiss"
            onClick={() => setSuccessToast(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* MAIN TWO-COLUMN COMMAND WORKSPACE */}
      <div className="gov-main-grid">
        {/* LEFT COLUMN: COMMAND COMPOSER */}
        <section className="dashboard-panel gov-composer-panel">
          <div className="panel-header-custom">
            <div className="panel-header-left">
              <span className="panel-kicker">OFFICIAL DIRECTIVE TRANSMITTER</span>
              <h2 className="panel-heading-title">COMPOSE COMMAND</h2>
            </div>
            <span className="badge-demo">OFFICIAL TERMINAL</span>
          </div>

          {/* PRESET DIRECTIVE TEMPLATES */}
          <div className="directive-templates-row">
            <span className="tpl-label">PRESET TEMPLATES:</span>
            <div className="tpl-buttons">
              {commandTemplates.map((tpl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleLoadTemplate(tpl)}
                  className="tpl-btn"
                  data-cursor="pointer"
                >
                  <span>{tpl.title}</span>
                </button>
              ))}
            </div>
          </div>

          <form className="gov-form" onSubmit={handleInitiateSend}>
            {/* FORM ROW 1: TARGET & TYPE */}
            <div className="form-row-2col">
              <div className="form-group">
                <label className="form-label">TARGET RESEARCH STATION</label>
                <select
                  value={targetStation}
                  onChange={(e) => setTargetStation(e.target.value)}
                  className="gov-select"
                  disabled={isTransmitting}
                >
                  <option value="MAITRI">MAITRI STATION (Schirmacher Oasis)</option>
                  <option value="BHARATI">BHARATI STATION (Larsen Ice Shelf)</option>
                  <option value="ALL">ALL STATIONS (BROADCAST ALL NODES)</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">DIRECTIVE CLASSIFICATION</label>
                <select
                  value={commandType}
                  onChange={(e) => setCommandType(e.target.value)}
                  className="gov-select"
                  disabled={isTransmitting}
                >
                  {commandTypes.map((t) => (
                    <option key={t.id} value={t.label}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* FORM ROW 2: PRIORITY SELECTOR */}
            <div className="form-group">
              <label className="form-label">TRANSMISSION PRIORITY LEVEL</label>
              <div className="priority-segmented-control">
                {["NORMAL", "HIGH", "CRITICAL"].map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setPriority(lvl)}
                    className={`priority-btn ${lvl.toLowerCase()} ${
                      priority === lvl ? "active" : ""
                    }`}
                    disabled={isTransmitting}
                    data-cursor="pointer"
                  >
                    <span className="prio-indicator" />
                    <span className="prio-text">{lvl}</span>
                    <span className="prio-sub">
                      {lvl === "NORMAL"
                        ? "Routine Telemetry"
                        : lvl === "HIGH"
                        ? "Operational Urgent"
                        : "Emergency Override"}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* FORM ROW 3: SUBJECT LINE */}
            <div className="form-group">
              <label className="form-label">DIRECTIVE SUBJECT / TITLE</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Scheduled Maintenance Order for Generator 2..."
                className="gov-input"
                disabled={isTransmitting}
                required
              />
            </div>

            {/* FORM ROW 4: DIRECTIVE MESSAGE BODY */}
            <div className="form-group">
              <div className="textarea-label-row">
                <label className="form-label">OFFICIAL DIRECTIVE TEXT BODY</label>
                <span className="char-count">{message.length}/1000 CHARS</span>
              </div>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Enter authorized polar directive, parameters, or emergency protocol details..."
                className="gov-textarea"
                rows={5}
                disabled={isTransmitting}
                required
              />
            </div>

            {/* TRANSMISSION PROGRESS INDICATOR */}
            {isTransmitting && (
              <div className="transmission-progress-box">
                <div className="tx-step-labels" style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", fontSize: "0.65rem" }}>
                  <span className={transmitStep >= 1 ? "step-active" : ""}>
                    1. AUTHENTICATING...
                  </span>
                  <span className={transmitStep >= 2 ? "step-active" : ""}>
                    2. SECURE CHANNEL ESTABLISHED
                  </span>
                  <span className={transmitStep >= 3 ? "step-active" : ""}>
                    3. TRANSMITTING...
                  </span>
                  <span className={transmitStep >= 4 ? "step-active" : ""}>
                    4. DELIVERED
                  </span>
                </div>
                <div className="tx-bar-track">
                  <div
                    className="tx-bar-fill"
                    style={{
                      width:
                        transmitStep === 1
                          ? "25%"
                          : transmitStep === 2
                          ? "55%"
                          : transmitStep === 3
                          ? "85%"
                          : "100%",
                    }}
                  />
                </div>
              </div>
            )}

            {/* TRANSMIT ACTION BUTTON */}
            <div className="composer-actions-bar">
              <div className="auth-signature-tag">
                <span className="shield-icon">⛨</span>
                <span>DIGITALLY SIGNED · POLAR MISSION CONTROL</span>
              </div>

              <button
                type="submit"
                disabled={!title.trim() || !message.trim() || isTransmitting}
                className={`gov-submit-btn ${
                  priority === "CRITICAL" ? "btn-critical" : ""
                }`}
                data-cursor="pointer"
              >
                <span>
                  {isTransmitting
                    ? "TRANSMITTING..."
                    : `Authorize & Transmit →`}
                </span>
              </button>
            </div>
          </form>
        </section>

        {/* RIGHT COLUMN: QUICK TELEMETRY & LIVE TRANSMISSION PROTOCOL */}
        <div className="gov-sidebar-column">
          {/* TERMINAL STATUS CARD */}
          <section className="dashboard-panel gov-terminal-panel">
            <div className="panel-header-custom">
              <div className="panel-header-left">
                <span className="panel-kicker">MISSION LINK TELEMETRY</span>
                <h2 className="panel-heading-title">STATION TERMINALS</h2>
              </div>
            </div>

            <div className="terminal-status-list">
              <div className="terminal-card">
                <div className="term-header">
                  <div className="term-id">
                    <span className="pulse-dot green" />
                    <strong>MAITRI PRIMARY</strong>
                  </div>
                  <span className="term-badge">MT-COMM-01</span>
                </div>
                <div className="term-meta">
                  <span>Coordinates: 70°45′58″ S · 11°44′09″ E</span>
                  <span>Satcom Latency: 742 ms · Link Quality 98.7%</span>
                </div>
              </div>

              <div className="terminal-card">
                <div className="term-header">
                  <div className="term-id">
                    <span className="pulse-dot green" />
                    <strong>BHARATI PRIMARY</strong>
                  </div>
                  <span className="term-badge">BH-COMM-01</span>
                </div>
                <div className="term-meta">
                  <span>Coordinates: 69°24′28″ S · 76°11′14″ E</span>
                  <span>Satcom Latency: 612 ms · Link Quality 99.4%</span>
                </div>
              </div>
            </div>
          </section>

          {/* PROTOCOL INSTRUCTIONS */}
          <section className="dashboard-panel gov-protocol-panel">
            <div className="panel-header-custom">
              <div className="panel-header-left">
                <span className="panel-kicker">GOVERNANCE PROTOCOL</span>
                <h2 className="panel-heading-title">RULES OF ENGAGEMENT</h2>
              </div>
            </div>

            <ul className="protocol-list">
              <li>
                <strong>DIRECTIVE RECORDING:</strong> All transmitted orders are archived into the unalterable mission audit log.
              </li>
              <li>
                <strong>EMERGENCY OVERRIDE:</strong> Critical directives trigger automatic SCADA alarm broadcasts across base stations.
              </li>
              <li>
                <strong>ACK TIMEOUT:</strong> Routine directives require digital acknowledgment within 4 hours; emergencies within 15 minutes.
              </li>
            </ul>
          </section>
        </div>
      </div>

      {/* COMMAND AUDIT LOG TABLE */}
      <section className="dashboard-section gov-history-section">
        <div className="section-heading">
          <div>
            <span>OFFICIAL AUDIT TRAIL</span>
            <h2>TRANSMITTED DIRECTIVES & ACKNOWLEDGEMENTS</h2>
          </div>

          <div className="table-filters-group">
            <div className="filter-item">
              <span>STATION:</span>
              <select
                value={filterStation}
                onChange={(e) => setFilterStation(e.target.value)}
                className="filter-select"
              >
                <option value="ALL">ALL</option>
                <option value="MAITRI">MAITRI</option>
                <option value="BHARATI">BHARATI</option>
              </select>
            </div>

            <div className="filter-item">
              <span>PRIORITY:</span>
              <select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                className="filter-select"
              >
                <option value="ALL">ALL</option>
                <option value="NORMAL">NORMAL</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>
          </div>
        </div>

        <div className="history-table-wrapper">
          <table className="whatif-table gov-table">
            <thead>
              <tr>
                <th>DIRECTIVE ID</th>
                <th>TIME</th>
                <th>STATION</th>
                <th>DIRECTIVE TITLE</th>
                <th>CATEGORY</th>
                <th>PRIORITY</th>
                <th>STATUS</th>
                <th>SENDER</th>
                <th>DETAILS</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.map((cmd) => (
                <tr key={cmd.id}>
                  <td className="mono-cell">{cmd.id}</td>
                  <td>{cmd.time}</td>
                  <td className="station-tag-cell">{cmd.station}</td>
                  <td className="scenario-title-cell">{cmd.title}</td>
                  <td className="sub-type-cell">{cmd.type}</td>
                  <td>
                    <span
                      className={`risk-badge-small ${
                        cmd.priority === "NORMAL"
                          ? "risk-low"
                          : cmd.priority === "HIGH"
                          ? "risk-medium"
                          : "risk-critical"
                      }`}
                    >
                      {cmd.priority}
                    </span>
                  </td>
                  <td>
                    <span className="status-cell-badge">
                      <span className="dot-delivered" />
                      {cmd.status}
                    </span>
                  </td>
                  <td className="sender-cell">{cmd.sender}</td>
                  <td>
                    <button
                      type="button"
                      className="history-action-btn"
                      onClick={() => setSelectedCommand(cmd)}
                      data-cursor="pointer"
                    >
                      DOSSIER ⌕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* AUTHORIZED MISSION DIRECTIVE CONFIRMATION MODAL */}
      {showConfirmModal && (
        <div className="modal-backdrop-gov" onClick={() => setShowConfirmModal(false)}>
          <div
            className="modal-card-gov"
            onClick={(e) => e.stopPropagation()}
          >
            <span className="auth-bracket tl" />
            <span className="auth-bracket tr" />
            <span className="auth-bracket bl" />
            <span className="auth-bracket br" />

            <div className="modal-gov-header">
              <span className="modal-gov-icon">🔒</span>
              <div>
                <div style={{ fontFamily: "monospace", fontSize: "0.65rem", color: "#6be2f2", letterSpacing: "0.12em" }}>
                  NCPOR MISSION DIRECTIVE AUTHORIZATION
                </div>
                <h3 className="modal-gov-title">AUTHORIZED COMMAND</h3>
              </div>
            </div>

            <div className="modal-gov-body">
              <p style={{ margin: "0 0 0.5rem 0", color: "#e2f1f8", fontWeight: 600 }}>
                Are you sure you want to transmit this mission directive?
              </p>
              <p style={{ margin: "0 0 0.75rem 0", fontSize: "0.8rem", color: "#8bb0c9" }}>
                This will simulate dispatching an authenticated cryptographic directive package over the INSAT Satcom telemetry channel.
              </p>

              <div className="modal-gov-summary-box">
                <div><span style={{ color: "#6be2f2" }}>TARGET STATION:</span> <strong>{targetStation} STATION</strong></div>
                <div><span style={{ color: "#6be2f2" }}>CLASSIFICATION:</span> <strong>{commandType}</strong></div>
                <div><span style={{ color: "#6be2f2" }}>PRIORITY:</span> <strong style={{ color: priority === "CRITICAL" ? "#ff6b6b" : priority === "HIGH" ? "#ffb84d" : "#00f0ff" }}>{priority}</strong></div>
                <div><span style={{ color: "#6be2f2" }}>DIRECTIVE SUBJECT:</span> <span>{title}</span></div>
              </div>
            </div>

            <div className="modal-gov-actions">
              <button
                type="button"
                className="btn-cancel-gov"
                onClick={() => setShowConfirmModal(false)}
                data-cursor="pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-confirm-gov"
                onClick={executeTransmission}
                data-cursor="pointer"
              >
                Confirm & Transmit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* COMMAND DETAILS DOSSIER MODAL */}
      {selectedCommand && (
        <div className="modal-backdrop" onClick={() => setSelectedCommand(null)}>
          <div
            className="modal-dialog dossier-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <span className="panel-kicker">TRANSMISSION AUDIT RECORD</span>
                <h3>{selectedCommand.id} — DOSSIER</h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedCommand(null)}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <div className="dossier-grid">
                <div>
                  <span className="dossier-label">TARGET:</span>
                  <strong>{selectedCommand.station} STATION</strong>
                </div>
                <div>
                  <span className="dossier-label">TRANSMISSION TIME:</span>
                  <strong>{selectedCommand.date} · {selectedCommand.time}</strong>
                </div>
                <div>
                  <span className="dossier-label">PRIORITY:</span>
                  <strong>{selectedCommand.priority}</strong>
                </div>
                <div>
                  <span className="dossier-label">STATUS:</span>
                  <strong className="text-green">{selectedCommand.status} ({selectedCommand.statusDetail})</strong>
                </div>
                <div>
                  <span className="dossier-label">CHANNEL:</span>
                  <span>{selectedCommand.transmission}</span>
                </div>
                <div>
                  <span className="dossier-label">LATENCY:</span>
                  <span>{selectedCommand.latency}</span>
                </div>
              </div>

              <div className="dossier-content-box">
                <span className="dossier-label">DIRECTIVE BODY:</span>
                <p>{selectedCommand.rawContent}</p>
              </div>

              <div className="dossier-auth-footer">
                <span>ISSUED BY: {selectedCommand.sender}</span>
                <span>AUTHENTICATION: SHA-256 VERIFIED</span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-modal-cancel"
                onClick={() => setSelectedCommand(null)}
              >
                CLOSE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
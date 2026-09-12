import { useState } from "react";
import PageHeader from "../common/PageHeader";
import { useStation } from "../../../context/StationContext";
import { reportTypes, initialReportArchive } from "../../../data/reportsData";

export default function Reports() {
  const { station, stationInfo } = useStation();

  const [selectedReportType, setSelectedReportType] = useState(reportTypes[0]);
  const [selectedStationFilter, setSelectedStationFilter] = useState(station || "MAITRI");
  const [dateRange, setDateRange] = useState("Today");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState(0); // 0: Idle, 1: Collecting, 2: Analyzing, 3: Compiling, 4: Ready
  const [generatedReport, setGeneratedReport] = useState(() =>
    buildReportContent(reportTypes[0], station || "MAITRI", stationInfo, "Today")
  );

  const [archiveList, setArchiveList] = useState(initialReportArchive);
  const [showDownloadToast, setShowDownloadToast] = useState(null);

  // Filter report types by category
  const categories = ["All", "Operations", "Power & Fuel", "Environment", "Logistics"];
  const filteredReportTypes = reportTypes.filter((r) => {
    if (selectedCategory !== "All" && r.category !== selectedCategory) return false;
    return true;
  });

  // Handle Generate Report trigger
  const handleGenerateReport = (repType) => {
    const targetType = repType || selectedReportType;
    setSelectedReportType(targetType);
    setIsGenerating(true);
    setGenerationStep(1); // Collecting

    setTimeout(() => {
      setGenerationStep(2); // Analyzing
    }, 350);

    setTimeout(() => {
      setGenerationStep(3); // Compiling
    }, 700);

    setTimeout(() => {
      const content = buildReportContent(
        targetType,
        selectedStationFilter,
        stationInfo,
        dateRange
      );
      setGeneratedReport(content);
      setIsGenerating(false);
      setGenerationStep(4);

      // Add to archive
      setArchiveList((prev) => [
        {
          id: `REP-${new Date().getFullYear()}-0${Math.floor(900 + Math.random() * 99)}`,
          title: targetType.title,
          station: selectedStationFilter,
          type: targetType.category,
          date: "05 Sep 2026",
          size: `${(1.2 + Math.random() * 2.5).toFixed(1)} MB`,
          status: "APPROVED",
          author: `Station Commander · ${selectedStationFilter}`,
          classification: "OFFICIAL / NCPOR",
        },
        ...prev,
      ]);
    }, 1100);
  };

  // Client-side functional report downloader
  const handleDownloadReport = () => {
    if (!generatedReport) return;

    const fileName = `DHRUVNETRA_${generatedReport.station}_${generatedReport.id}_05SEP2026.txt`;
    const blob = new Blob([generatedReport.rawText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setShowDownloadToast(`Report "${fileName}" exported successfully.`);
    setTimeout(() => setShowDownloadToast(null), 4000);
  };

  return (
    <div className="dashboard-page reports-page">
      <PageHeader
        eyebrow={`DHRUVNETRA / SCIENTIFIC & OPERATIONAL REPORTING · ${stationInfo?.code || "MT"} NODE`}
        title="MISSION INTELLIGENCE & AUDIT REPORTS"
        description="Compile, preview, and export high-fidelity telemetry dossiers, energy audits, and polar expedition logs for NCPOR and the Ministry of Earth Sciences."
        status="REPORTING ENGINE ONLINE"
      />

      {/* CLASSIFICATION & ACCESS LEVEL STRIP */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: "#f0f9ff",
          border: "1px solid #bae6fd",
          borderRadius: 6,
          padding: "0.6rem 1rem",
          marginBottom: "1.25rem",
          fontSize: "0.75rem",
          fontFamily: "var(--font-mono, monospace)",
          color: "var(--text-primary, #0f172a)",
          flexWrap: "wrap",
          gap: "0.5rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <span style={{ color: "#d97706", fontWeight: 700 }}>🔒 RESTRICTED RECORDS</span>
          <span style={{ color: "#0369a1", fontWeight: 600 }}>CLASSIFICATION: OFFICIAL POLAR DOSSIER / NCPOR DIRECTORATE</span>
        </div>
        <span style={{ color: "#0284c7", fontSize: "0.7rem", fontWeight: 600 }}>
          CLEARANCE LEVEL: LEVEL-4 POLAR COMMAND (ADMIN ONLY)
        </span>
      </div>

      {/* TOP REPORT METRICS STRIP */}
      <section className="reports-kpi-strip">
        <div className="kpi-card">
          <span className="kpi-label">TOTAL DOSSIERS ARCHIVED</span>
          <strong className="kpi-value highlight-cyan">
            {archiveList.length + 24} REPORTS
          </strong>
          <span className="kpi-sub">All Stations (2026-27 Season)</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">TELEMETRY SYNC STATUS</span>
          <strong className="kpi-value text-green">
            100% REAL-TIME
          </strong>
          <span className="kpi-sub">Last Batch Sync: 05 Sep 14:30 IST</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">AUTOMATED SCHEDULE</span>
          <strong className="kpi-value">
            DAILY (06:00 UTC)
          </strong>
          <span className="kpi-sub">Next Dispatch in 3h 30m</span>
        </div>

        <div className="kpi-card">
          <span className="kpi-label">AUDIT CLASSIFICATION</span>
          <strong className="kpi-value">
            OFFICIAL / NCPOR
          </strong>
          <span className="kpi-sub">MoES Polar Directorate Sealed</span>
        </div>
      </section>

      {/* SUCCESS TOAST NOTIFICATION */}
      {showDownloadToast && (
        <div className="gov-success-toast">
          <span className="toast-icon">✓</span>
          <span>{showDownloadToast}</span>
          <button
            type="button"
            className="toast-dismiss"
            onClick={() => setShowDownloadToast(null)}
          >
            ✕
          </button>
        </div>
      )}

      {/* FILTER & CUSTOMIZATION TOOLBAR */}
      <section className="dashboard-panel reports-toolbar-panel">
        <div className="toolbar-row">
          {/* Station Selection */}
          <div className="toolbar-group">
            <span className="toolbar-label">TARGET NODE:</span>
            <select
              value={selectedStationFilter}
              onChange={(e) => setSelectedStationFilter(e.target.value)}
              className="toolbar-select"
            >
              <option value="MAITRI">MAITRI STATION</option>
              <option value="BHARATI">BHARATI STATION</option>
              <option value="ALL STATIONS">ALL POLAR STATIONS</option>
            </select>
          </div>

          {/* Date Range */}
          <div className="toolbar-group">
            <span className="toolbar-label">TIME HORIZON:</span>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="toolbar-select"
            >
              <option value="Today">Today (05 Sep 2026)</option>
              <option value="Last 7 Days">Last 7 Days (29 Aug – 05 Sep)</option>
              <option value="Last 30 Days">Last 30 Days (August 2026)</option>
              <option value="Expedition Season">Expedition Season (2026-27)</option>
            </select>
          </div>

          {/* Category Filter Pills */}
          <div className="toolbar-category-pills">
            {categories.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`cat-pill ${selectedCategory === cat ? "active" : ""}`}
                onClick={() => setSelectedCategory(cat)}
                data-cursor="pointer"
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* REPORT CATALOGUE GRID */}
      <section className="report-catalogue-section">
        <div className="section-heading">
          <div>
            <span>INTELLIGENCE SUITE</span>
            <h2>AVAILABLE MISSION REPORT DOSSIERS</h2>
          </div>
          <span className="section-live">● SELECT DOSSIER TO GENERATE</span>
        </div>

        <div className="report-cards-grid">
          {filteredReportTypes.map((rep) => {
            const isSelected = selectedReportType.id === rep.id;
            return (
              <div
                key={rep.id}
                className={`report-card ${isSelected ? "selected-card" : ""}`}
              >
                <div className="report-card-top">
                  <span className="rep-icon">{rep.icon}</span>
                  <span className="rep-cat-badge">{rep.category}</span>
                </div>

                <h3 className="rep-title">{rep.title}</h3>
                <p className="rep-desc">{rep.desc}</p>

                <div className="rep-meta-row">
                  <span>Frequency: {rep.frequency}</span>
                  <span>{rep.estimatedPages}</span>
                </div>

                <button
                  type="button"
                  className={`rep-generate-btn ${isSelected ? "active-btn" : ""}`}
                  onClick={() => handleGenerateReport(rep)}
                  disabled={isGenerating}
                  data-cursor="pointer"
                >
                  <span>
                    {isGenerating && isSelected
                      ? "COMPILING..."
                      : isSelected
                      ? "RE-GENERATE REPORT ⟲"
                      : "GENERATE REPORT →"}
                  </span>
                </button>
              </div>
            );
          })}
        </div>
      </section>

      {/* LIVE REPORT PREVIEW & EXPORT WORKSPACE */}
      <section className="dashboard-panel report-preview-panel">
        <div className="panel-header-custom">
          <div className="panel-header-left">
            <span className="panel-kicker">SCADA DOSSIER VIEWER</span>
            <h2 className="panel-heading-title">
              {generatedReport ? generatedReport.title : "REPORT PREVIEW"}
            </h2>
          </div>

          <div className="preview-action-buttons">
            <button
              type="button"
              className="export-btn"
              onClick={handleDownloadReport}
              data-cursor="pointer"
            >
              <span className="btn-icon">⬇</span>
              <span>DOWNLOAD DOSSIER (.TXT)</span>
            </button>

            <button
              type="button"
              className="print-btn"
              onClick={() => window.print()}
              data-cursor="pointer"
            >
              <span className="btn-icon">🖨</span>
              <span>PRINT REPORT</span>
            </button>
          </div>
        </div>

        {/* GENERATION PROGRESS ANIMATION */}
        {isGenerating ? (
          <div className="report-generating-box">
            <div className="gen-spinner" />
            <div className="gen-steps">
              <span className={generationStep >= 1 ? "step-active" : ""}>
                1. COLLECTING REAL-TIME SCADA TELEMETRY
              </span>
              <span className={generationStep >= 2 ? "step-active" : ""}>
                2. RUNNING SUBSYSTEM ANOMALY AUDIT
              </span>
              <span className={generationStep >= 3 ? "step-active" : ""}>
                3. COMPILING EXECUTIVE INTELLIGENCE DOSSIER
              </span>
            </div>
          </div>
        ) : (
          /* FORMATTED REPORT PREVIEW DOCUMENT */
          <div className="report-document-paper">
            {/* DOCUMENT OFFICIAL HEADER */}
            <div className="doc-official-header">
              <div className="doc-emblem-row">
                <span className="doc-emblem">◈</span>
                <div>
                  <div className="doc-gov-title">GOVERNMENT OF INDIA</div>
                  <div className="doc-ministry">
                    MINISTRY OF EARTH SCIENCES · NATIONAL CENTRE FOR POLAR AND OCEAN RESEARCH
                  </div>
                </div>
              </div>

              <div className="doc-ref-box">
                <div>
                  REF NO: <strong>{generatedReport.refNo}</strong>
                </div>
                <div>
                  DATE: <strong>05 SEPTEMBER 2026</strong>
                </div>
                <div>
                  CLASSIFICATION: <strong>OFFICIAL / NCPOR RESTRICTED</strong>
                </div>
              </div>
            </div>

            <div className="doc-divider" />

            {/* DOSSIER TITLE & STATION IDENTITY */}
            <div className="doc-title-block">
              <h1>{generatedReport.title}</h1>
              <div className="doc-station-tagline">
                STATION: {generatedReport.station} (
                {generatedReport.station === "BHARATI"
                  ? "LARSEN ICE SHELF · 69°24′S 76°11′E"
                  : generatedReport.station === "MAITRI"
                  ? "SCHIRMACHER OASIS · 70°45′S 11°44′E"
                  : "ALL INDIAN ANTARCTIC RESEARCH STATIONS"}
                ) · HORIZON: {dateRange.toUpperCase()}
              </div>
            </div>

            {/* EXECUTIVE SUMMARY */}
            <div className="doc-section">
              <h2 className="doc-sec-heading">1. EXECUTIVE OPERATIONAL SUMMARY</h2>
              <p className="doc-paragraph">{generatedReport.executiveSummary}</p>
            </div>

            {/* KEY METRICS DATA TABLE */}
            <div className="doc-section">
              <h2 className="doc-sec-heading">2. CORE SUBSYSTEM TELEMETRY AUDIT</h2>
              <div className="doc-table-wrapper">
                <table className="doc-data-table">
                  <thead>
                    <tr>
                      <th>SUBSYSTEM</th>
                      <th>PRIMARY TELEMETRY</th>
                      <th>CAPACITY / LOAD</th>
                      <th>HEALTH INDEX</th>
                      <th>OPERATIONAL STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {generatedReport.tableData.map((row, idx) => (
                      <tr key={idx}>
                        <td className="font-semibold">{row.subsystem}</td>
                        <td>{row.metric}</td>
                        <td>{row.capacity}</td>
                        <td>{row.health}</td>
                        <td>
                          <span className="doc-status-badge">{row.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* CRITICAL FINDINGS & RECOMMENDATIONS */}
            <div className="doc-section">
              <h2 className="doc-sec-heading">3. ANOMALIES, ALERTS & DIRECTIVES</h2>
              <ul className="doc-bullet-list">
                {generatedReport.bulletPoints.map((pt, idx) => (
                  <li key={idx}>
                    <strong>{pt.title}:</strong> {pt.desc}
                  </li>
                ))}
              </ul>
            </div>

            {/* OFFICIAL SIGNATURE SEAL */}
            <div className="doc-signature-footer">
              <div className="sig-block">
                <div className="sig-line" />
                <div className="sig-name">CHIEF STATION CONTROLLER</div>
                <div className="sig-title">Indian Antarctic Expedition 2026</div>
              </div>

              <div className="sig-seal-box">
                <div className="seal-circle">
                  <span>NCPOR</span>
                  <small>POLAR COMMAND</small>
                </div>
              </div>

              <div className="sig-block">
                <div className="sig-line" />
                <div className="sig-name">DHRUVNETRA AI SCADA ENGINE</div>
                <div className="sig-title">Automated Cryptographic Validation</div>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* REPORT ARCHIVE HISTORY TABLE */}
      <section className="dashboard-section reports-archive-section">
        <div className="section-heading">
          <div>
            <span>MISSION ARCHIVE</span>
            <h2>PREVIOUSLY GENERATED INTELLIGENCE DOSSIERS</h2>
          </div>
          <span className="section-live">● PERMANENT AUDIT LOG</span>
        </div>

        <div className="history-table-wrapper">
          <table className="whatif-table gov-table">
            <thead>
              <tr>
                <th>DOSSIER ID</th>
                <th>DATE</th>
                <th>STATION</th>
                <th>REPORT TITLE</th>
                <th>CATEGORY</th>
                <th>FILE SIZE</th>
                <th>CLASSIFICATION</th>
                <th>AUTHOR</th>
                <th>ACTIONS</th>
              </tr>
            </thead>
            <tbody>
              {archiveList.map((item) => (
                <tr key={item.id}>
                  <td className="mono-cell">{item.id}</td>
                  <td>{item.date}</td>
                  <td className="station-tag-cell">{item.station}</td>
                  <td className="scenario-title-cell">{item.title}</td>
                  <td className="sub-type-cell">{item.type}</td>
                  <td className="mono-cell">{item.size}</td>
                  <td>
                    <span className="doc-class-pill">{item.classification}</span>
                  </td>
                  <td className="sender-cell">{item.author}</td>
                  <td>
                    <button
                      type="button"
                      className="history-action-btn"
                      onClick={() => {
                        const match = reportTypes.find((r) =>
                          r.title.toLowerCase().includes(item.title.toLowerCase().slice(0, 8))
                        ) || reportTypes[0];
                        handleGenerateReport(match);
                      }}
                      data-cursor="pointer"
                    >
                      VIEW ⌕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

/* =====================================================
   HELPER: BUILD STRUCTURED REPORT CONTENT & RAW TEXT
===================================================== */
function buildReportContent(repType, stationName, stationInfo, dateHorizon) {
  const isBharati = stationName === "BHARATI";
  const refNo = `DHRUV-REP-2026-${Math.floor(1000 + Math.random() * 8999)}`;

  const tableData = [
    {
      subsystem: "POWER MICROGRID",
      metric: isBharati ? "3 Active Gens (89 kW)" : "3 Active / 1 Standby (82 kW)",
      capacity: isBharati ? "89% Nominal" : "82% Nominal",
      health: isBharati ? "96/100" : "91/100",
      status: "OPERATIONAL",
    },
    {
      subsystem: "FUEL STORAGE",
      metric: isBharati ? "Tank Farm 1 (76%)" : "Tank Farm Main (68%)",
      capacity: isBharati ? "18.6 Days Reserve" : "12.4 Days Reserve",
      health: isBharati ? "94/100" : "88/100",
      status: "STABLE",
    },
    {
      subsystem: "HVAC & THERMAL",
      metric: isBharati ? "Indoor −16°C / Living +19°C" : "Indoor −18°C / Living +18°C",
      capacity: "6 Active Zones",
      health: "98/100",
      status: "OPTIMAL",
    },
    {
      subsystem: "WATER & LIFE SUPPORT",
      metric: isBharati ? "24,000 L Potable Tank" : "18,200 L Potable Tank",
      capacity: isBharati ? "94% Capacity" : "91% Capacity",
      health: "95/100",
      status: "NOMINAL",
    },
    {
      subsystem: "METEOROLOGY",
      metric: isBharati ? "−18°C · Wind 28 km/h ENE" : "−24°C · Wind 34 km/h NW",
      capacity: "Pressure 984 hPa",
      health: "100/100",
      status: "MONITORED",
    },
    {
      subsystem: "SATCOM LINK",
      metric: isBharati ? "INSAT-4CR (99.4% SNR)" : "INSAT-4CR (98.7% SNR)",
      capacity: isBharati ? "612 ms Latency" : "742 ms Latency",
      health: "99/100",
      status: "ENCRYPTED",
    },
  ];

  const executiveSummary = `This mission intelligence report compiles real-time telemetry from ${stationName} Indian Antarctic Research Station for the period ${dateHorizon}. Core life support, primary power microgrids, and thermal envelope systems operate within nominal safety thresholds. Telemetry continuity over the encrypted SATCOM channel stands at ${
    isBharati ? "99.4%" : "98.7%"
  }. Fuel reserves and potable water buffers are sufficient to sustain full wintering operations.`;

  const bulletPoints = [
    {
      title: "POWER GENERATION AUDIT",
      desc: "All diesel generator units operating within thermal limits. Bus voltage deviation is under ±0.8%. Secondary generator auto-start relay tested successfully.",
    },
    {
      title: "FUEL CONSUMPTION METRIC",
      desc: `Current daily consumption rate averaged ${isBharati ? "26.4 L/h" : "28.5 L/h"}. Hydrocarbon storage tanks show zero condensation ingress and nominal trace heating.`,
    },
    {
      title: "THERMAL ENVELOPE INTEGRITY",
      desc: "Perimeter airlock seals verified air-tight. Glycol loop primary heat exchanger maintaining +19°C living quarters target against external −24°C ambient delta.",
    },
    {
      title: "SATCOM TELEMETRY INTEGRITY",
      desc: "Continuous 256-bit encrypted data link active with NCPOR Headquarters Goa and Ministry of Earth Sciences New Delhi with zero dropped packet frames.",
    },
  ];

  const rawText = `================================================================================
DHRUVNETRA — AI-POWERED ANTARCTIC DIGITAL TWIN
GOVERNMENT OF INDIA · MINISTRY OF EARTH SCIENCES · NCPOR
================================================================================

DOCUMENT REF: ${refNo}
REPORT TYPE: ${repType.title}
STATION: ${stationName}
DATE: 05 SEPTEMBER 2026
HORIZON: ${dateHorizon}
CLASSIFICATION: OFFICIAL / NCPOR RESTRICTED

--------------------------------------------------------------------------------
1. EXECUTIVE OPERATIONAL SUMMARY
--------------------------------------------------------------------------------
${executiveSummary}

--------------------------------------------------------------------------------
2. CORE SUBSYSTEM TELEMETRY AUDIT
--------------------------------------------------------------------------------
${tableData
  .map(
    (r) =>
      `• ${r.subsystem.padEnd(24)} | ${r.metric.padEnd(30)} | ${r.capacity.padEnd(18)} | ${r.status}`
  )
  .join("\n")}

--------------------------------------------------------------------------------
3. ANOMALIES, ALERTS & DIRECTIVES
--------------------------------------------------------------------------------
${bulletPoints.map((b) => `• [${b.title}]: ${b.desc}`).join("\n\n")}

================================================================================
AUTHENTICATION:
CHIEF STATION CONTROLLER (INDIAN ANTARCTIC EXPEDITION 2026)
DHRUVNETRA SCADA CRYPTOGRAPHIC AUDIT SEAL: SHA256-VERIFIED-OK
================================================================================`;

  return {
    id: refNo,
    refNo,
    title: `${repType.title.toUpperCase()} — ${stationName}`,
    station: stationName,
    executiveSummary,
    tableData,
    bulletPoints,
    rawText,
  };
}
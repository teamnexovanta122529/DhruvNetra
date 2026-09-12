/**
 * DHRUVNETRA - Polar Meteorology & Environmental Intelligence Dashboard
 * SIH 2026: Antarctic Digital Twin Platform (Maitri & Bharati)
 * Live External Weather Telemetry, Polar Wind Chill, and Blizzard Warning Matrix
 */

import { useState } from "react";
import PageHeader from "../common/PageHeader";
import StatusBadge from "../common/StatusBadge";
import { useStation } from "../../../context/StationContext";
import { useEnvironment } from "../../../context/EnvironmentContext";

export default function Environment() {
    const { station, stationInfo } = useStation();
    const {
        environment,
        isLoading,
        isRefreshing,
        isUnavailable,
        timeSinceUpdate,
        refreshEnvironment,
    } = useEnvironment();

    const [copiedInfo, setCopiedInfo] = useState(false);

    const handleCopyCoords = () => {
        const coordText = `${stationInfo.coordinates || ""} (${stationInfo.location || ""})`;
        navigator.clipboard?.writeText(coordText);
        setCopiedInfo(true);
        setTimeout(() => setCopiedInfo(false), 2000);
    };

    const current = environment?.current || {};
    const conditions = environment?.conditions || {};
    const polar = environment?.polar_indices || {};
    const alert = environment?.alert || {};
    const source = environment?.source || {};

    const alertLevel = alert.level || "NORMAL";
    const isAlertCritical = alertLevel === "CRITICAL";
    const isAlertWarning = alertLevel === "WARNING";
    const isAlertWatch = alertLevel === "WATCH";

    return (
        <div className="dashboard-page environment-page">

            {/* =========================================
                PAGE HEADER WITH LIVE REFRESH TRIGGER
            ========================================= */}
            <div className="env-header-wrapper" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "16px" }}>
                <PageHeader
                    eyebrow={`DHRUVNETRA / POLAR METEOROLOGY · ${stationInfo.coordinates || ""}`}
                    title={`${station} ENVIRONMENTAL INTELLIGENCE`}
                    description={`REAL-TIME CONTINENTAL & COASTAL POLAR WEATHER TELEMETRY (${stationInfo.location})`}
                    status={isUnavailable ? "TELEMETRY OFFLINE" : "LIVE POLAR STREAM"}
                />

                <div className="env-header-actions" style={{ display: "flex", alignItems: "center", gap: "12px", marginTop: "12px" }}>
                    <div className="env-freshness-pill" style={{
                        background: "#ffffff",
                        border: "1px solid var(--border-subtle, #e2e8f0)",
                        padding: "6px 14px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        color: "var(--text-secondary, #475569)",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                    }}>
                        <span style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: isUnavailable ? "#ef4444" : "#16a34a",
                            display: "inline-block"
                        }} />
                        <span style={{ fontFamily: "var(--font-mono, monospace)" }}>{isUnavailable ? "OFFLINE" : "LIVE"} · {timeSinceUpdate}</span>
                    </div>

                    <button
                        type="button"
                        onClick={refreshEnvironment}
                        disabled={isRefreshing || isLoading}
                        style={{
                            background: "linear-gradient(135deg, #0284c7 0%, #0369a1 100%)",
                            border: "none",
                            color: "#ffffff",
                            padding: "7px 16px",
                            borderRadius: "6px",
                            cursor: (isRefreshing || isLoading) ? "not-allowed" : "pointer",
                            fontSize: "12px",
                            fontWeight: "600",
                            letterSpacing: "0.5px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            boxShadow: "0 2px 6px rgba(2,132,199,0.25)",
                            transition: "all 0.2s ease"
                        }}
                    >
                        <span style={{ display: "inline-block", transform: isRefreshing ? "rotate(360deg)" : "none", transition: isRefreshing ? "transform 1s linear infinite" : "none" }}>↻</span>
                        <span>{isRefreshing ? "SYNCING..." : "REFRESH DATA"}</span>
                    </button>
                </div>
            </div>

            {/* =========================================
                HERO METEOROLOGICAL OVERVIEW BANNER
            ========================================= */}
            <section className="dashboard-section" style={{ marginTop: "16px" }}>
                <div style={{
                    background: "linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%)",
                    border: "1px solid #bae6fd",
                    borderRadius: "12px",
                    padding: "24px 28px",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: "0 4px 16px rgba(2, 132, 199, 0.06)"
                }}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", alignItems: "center" }}>
                        
                        {/* LEFT: Ambient Temp & Wind Chill */}
                        <div>
                            <div style={{ fontSize: "11px", letterSpacing: "1.5px", color: "#0369a1", fontWeight: "700", marginBottom: "6px", fontFamily: "var(--font-mono, monospace)" }}>
                                AMBIENT POLAR THERMAL STATE · {station.toUpperCase()}
                            </div>

                            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
                                <div style={{ fontSize: "52px", fontWeight: "800", color: "#0f172a", letterSpacing: "-1px", lineHeight: "1" }}>
                                    {isLoading ? "..." : isUnavailable ? "N/A" : current.temperature_c !== null && current.temperature_c !== undefined ? `${current.temperature_c > 0 ? "+" : ""}${current.temperature_c}°C` : "—"}
                                </div>

                                {polar.wind_chill_c !== null && polar.wind_chill_c !== undefined && (
                                    <div style={{
                                        background: "#ffffff",
                                        border: "1px solid #bae6fd",
                                        padding: "4px 10px",
                                        borderRadius: "6px",
                                        fontSize: "13px",
                                        color: "#0369a1",
                                        fontWeight: "500",
                                        boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
                                    }}>
                                        Wind Chill: <strong>{polar.wind_chill_c > 0 ? "+" : ""}{polar.wind_chill_c}°C</strong>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                <span style={{
                                    background: "#dbeafe",
                                    border: "1px solid #93c5fd",
                                    color: "#1e40af",
                                    padding: "3px 8px",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    fontWeight: "600"
                                }}>
                                    {polar.freezing_severity || "Sub-Zero Polar"}
                                </span>

                                <span style={{ fontSize: "12px", color: "#475569" }}>
                                    Elevation: {stationInfo.elevation || "117 m"} · {stationInfo.region || stationInfo.location}
                                </span>
                            </div>
                        </div>

                        {/* CENTER: Weather Condition & Cloud Status */}
                        <div style={{ borderLeft: "1px solid #cbd5e1", paddingLeft: "24px" }}>
                            <div style={{ fontSize: "11px", letterSpacing: "1.5px", color: "#64748b", fontWeight: "700", marginBottom: "6px", fontFamily: "var(--font-mono, monospace)" }}>
                                CURRENT METEOROLOGICAL STATE
                            </div>

                            <div style={{ fontSize: "22px", fontWeight: "700", color: "#0f172a", letterSpacing: "0.5px" }}>
                                {isLoading ? "Fetching Satellite & Model Feeds..." : isUnavailable ? "Data Stream Offline" : (conditions.weather || "Overcast Polar Conditions").toUpperCase()}
                            </div>

                            <div style={{ marginTop: "8px", fontSize: "13px", color: "#64748b", display: "flex", gap: "16px" }}>
                                <span>Cloud Cover: <strong style={{ color: "#0f172a" }}>{current.cloud_cover_percent ?? "—"}%</strong></span>
                                <span>Precipitation: <strong style={{ color: "#0f172a" }}>{current.precipitation_mm ?? 0} mm</strong></span>
                                <span>Snowfall: <strong style={{ color: "#0f172a" }}>{current.snowfall_cm ?? 0} cm</strong></span>
                            </div>
                        </div>

                        {/* RIGHT: Blizzard Risk Indicator */}
                        <div style={{ borderLeft: "1px solid #cbd5e1", paddingLeft: "24px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                <span style={{ fontSize: "11px", letterSpacing: "1.5px", color: "#b45309", fontWeight: "700", fontFamily: "var(--font-mono, monospace)" }}>
                                    BLIZZARD PROBABILITY INDEX
                                </span>
                                <span style={{
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    color: polar.blizzard_risk === "CRITICAL" ? "#dc2626" : polar.blizzard_risk === "HIGH" ? "#ea580c" : polar.blizzard_risk === "MODERATE" ? "#d97706" : "#16a34a"
                                }}>
                                    {polar.blizzard_risk || "LOW"} ({polar.blizzard_probability_percent ?? 15}%)
                                </span>
                            </div>

                            {/* Risk Progress Bar */}
                            <div style={{ width: "100%", height: "8px", background: "#e2e8f0", borderRadius: "4px", overflow: "hidden", marginTop: "8px" }}>
                                <div style={{
                                    width: `${polar.blizzard_probability_percent ?? 15}%`,
                                    height: "100%",
                                    background: polar.blizzard_risk === "CRITICAL" ? "linear-gradient(90deg, #ea580c, #dc2626)" : polar.blizzard_risk === "HIGH" ? "linear-gradient(90deg, #d97706, #ea580c)" : "linear-gradient(90deg, #16a34a, #0284c7)",
                                    transition: "width 0.5s ease"
                                }} />
                            </div>

                            <p style={{ fontSize: "11px", color: "#64748b", marginTop: "8px", lineHeight: "1.4" }}>
                                Evaluated from katabatic wind velocity, snowfall rate, and optical visibility.
                            </p>
                        </div>

                    </div>
                </div>
            </section>


            {/* =========================================
                PRIMARY 4-CARD METRIC GRID
            ========================================= */}
            <section className="dashboard-section" style={{ marginTop: "24px" }}>
                <div className="section-heading">
                    <div>
                        <span>REAL-TIME SENSORS & NUMERICAL MODELS</span>
                        <h2>METEOROLOGICAL PARAMETERS</h2>
                    </div>
                    <span className="section-live">● CONTINUOUS FEED</span>
                </div>

                <div className="metrics-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>

                    {/* CARD 1: THERMAL PROFILE */}
                    <div className="metric-card">
                        <div className="metric-header">
                            <span className="metric-label">AMBIENT & WIND CHILL</span>
                            <span className="metric-badge normal">THERMAL</span>
                        </div>
                        <div className="metric-body">
                            <div className="metric-value">
                                {current.temperature_c !== null && current.temperature_c !== undefined ? current.temperature_c : "—"}
                                <span className="metric-unit">°C</span>
                            </div>
                            <div className="metric-trend">
                                Wind Chill Index: <strong>{polar.wind_chill_c ?? "—"}°C</strong>
                            </div>
                        </div>
                        <div className="metric-footer" style={{ fontSize: "11px", color: "#64748b", marginTop: "8px" }}>
                            Condition: {polar.freezing_severity || "Sub-Zero Polar"}
                        </div>
                    </div>

                    {/* CARD 2: KATABATIC WIND */}
                    <div className="metric-card">
                        <div className="metric-header">
                            <span className="metric-label">KATABATIC WIND SPEED</span>
                            <span className="metric-badge warning">DYNAMICS</span>
                        </div>
                        <div className="metric-body">
                            <div className="metric-value">
                                {current.wind_speed_kmh !== null && current.wind_speed_kmh !== undefined ? current.wind_speed_kmh : "—"}
                                <span className="metric-unit">KM/H</span>
                            </div>
                            <div className="metric-trend">
                                Azimuth: <strong>{current.wind_direction_cardinal || "—"} ({current.wind_direction_deg ?? "—"}°)</strong>
                            </div>
                        </div>
                        <div className="metric-footer" style={{ fontSize: "11px", color: "#64748b", marginTop: "8px" }}>
                            Velocity: {current.wind_speed_ms ?? "—"} m/s · Gust: {current.wind_gust_kmh ?? "—"} km/h
                        </div>
                    </div>

                    {/* CARD 3: SURFACE PRESSURE */}
                    <div className="metric-card">
                        <div className="metric-header">
                            <span className="metric-label">BAROMETRIC PRESSURE</span>
                            <span className="metric-badge normal">BAROMETER</span>
                        </div>
                        <div className="metric-body">
                            <div className="metric-value">
                                {current.pressure_hpa !== null && current.pressure_hpa !== undefined ? current.pressure_hpa : "—"}
                                <span className="metric-unit">HPA</span>
                            </div>
                            <div className="metric-trend">
                                Sea-level ref: 1013.25 hPa ({(current.pressure_hpa ? (current.pressure_hpa - 1013.25).toFixed(1) : 0)} hPa)
                            </div>
                        </div>
                        <div className="metric-footer" style={{ fontSize: "11px", color: "#64748b", marginTop: "8px" }}>
                            System: {current.pressure_hpa && current.pressure_hpa < 975 ? "Deep Polar Low" : "Stable Polar Anticyclone"}
                        </div>
                    </div>

                    {/* CARD 4: HUMIDITY & VISIBILITY */}
                    <div className="metric-card">
                        <div className="metric-header">
                            <span className="metric-label">HUMIDITY & VISIBILITY</span>
                            <span className="metric-badge normal">OPTICAL</span>
                        </div>
                        <div className="metric-body">
                            <div className="metric-value">
                                {current.humidity_percent !== null && current.humidity_percent !== undefined ? current.humidity_percent : "—"}
                                <span className="metric-unit">%</span>
                            </div>
                            <div className="metric-trend">
                                Visibility: <strong>{current.visibility_km ? `${current.visibility_km} km` : "Unrestricted"}</strong>
                            </div>
                        </div>
                        <div className="metric-footer" style={{ fontSize: "11px", color: "#64748b", marginTop: "8px" }}>
                            Cloud Fraction: {current.cloud_cover_percent ?? 0}% · Snow: {conditions.is_snowing ? "Active" : "None"}
                        </div>
                    </div>

                </div>
            </section>


            {/* =========================================
                OPERATIONAL ALERT & SAFETY MATRIX
            ========================================= */}
            <section className="dashboard-section" style={{ marginTop: "24px" }}>
                <div style={{
                    background: isAlertCritical
                        ? "#fef2f2"
                        : isAlertWarning
                        ? "#fffbeb"
                        : "#f0fdf4",
                    border: `1px solid ${isAlertCritical ? "#fecaca" : isAlertWarning ? "#fde68a" : "#bbf7d0"}`,
                    borderRadius: "12px",
                    padding: "20px 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{
                                background: isAlertCritical ? "#dc2626" : isAlertWarning ? "#ea580c" : isAlertWatch ? "#d97706" : "#16a34a",
                                color: "#ffffff",
                                fontWeight: "800",
                                fontSize: "11px",
                                padding: "3px 8px",
                                borderRadius: "4px",
                                letterSpacing: "1px",
                                fontFamily: "var(--font-mono, monospace)"
                            }}>
                                {alertLevel}
                            </span>
                            <strong style={{ fontSize: "15px", color: isAlertCritical ? "#991b1b" : isAlertWarning ? "#92400e" : "#166534" }}>
                                {alert.title || `STATION ENVIRONMENTAL STATUS: ${alertLevel}`}
                            </strong>
                        </div>

                        <span style={{ fontSize: "12px", color: "#64748b" }}>
                            Station Protocol: <strong>{isAlertCritical ? "CODE RED — LOCKDOWN EXTERIOR" : isAlertWarning ? "CODE ORANGE — CAUTIONARY SORTIES" : "CODE GREEN — NOMINAL OPERATIONS"}</strong>
                        </span>
                    </div>

                    <p style={{ margin: 0, fontSize: "13px", color: "#334155", lineHeight: "1.5" }}>
                        {alert.description || "All meteorological indicators are within standard operational envelope for East Antarctic research facilities."}
                    </p>

                    {alert.active_factors && alert.active_factors.length > 0 && (
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                            <span style={{ fontSize: "12px", color: "#64748b", alignSelf: "center" }}>Active Factors:</span>
                            {alert.active_factors.map((factor, idx) => (
                                <span key={idx} style={{
                                    background: "#ffffff",
                                    border: "1px solid var(--border-subtle, #e2e8f0)",
                                    color: "#334155",
                                    padding: "2px 8px",
                                    borderRadius: "4px",
                                    fontSize: "11px"
                                }}>
                                    {factor}
                                </span>
                            ))}
                        </div>
                    )}
                </div>
            </section>


            {/* =========================================
                DATA PROVENANCE & TRANSPARENCY CARD
            ========================================= */}
            <section className="dashboard-section" style={{ marginTop: "24px" }}>
                <div style={{
                    background: "var(--bg-subtle, #f8fafc)",
                    border: "1px solid var(--border-subtle, #e2e8f0)",
                    borderRadius: "10px",
                    padding: "16px 20px",
                    fontSize: "12px",
                    color: "var(--text-secondary, #475569)",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: "16px"
                }}>
                    <div>
                        <span style={{ color: "var(--accent-primary, #0284c7)", fontWeight: "700", display: "block", marginBottom: "4px", fontFamily: "var(--font-mono, monospace)" }}>
                            DATA PROVENANCE & MODEL ATTRIBUTION
                        </span>
                        <span>Provider: <strong style={{ color: "#0f172a" }}>{source.provider || "Open-Meteo Polar Weather API"}</strong></span><br />
                        <span>Ensemble: <strong style={{ color: "#0f172a" }}>{source.model_type || "ECMWF IFS / DWD ICON Polar Models"}</strong></span>
                    </div>

                    <div>
                        <span style={{ color: "var(--accent-primary, #0284c7)", fontWeight: "700", display: "block", marginBottom: "4px", fontFamily: "var(--font-mono, monospace)" }}>
                            STATION HARDWARE SENSORS
                        </span>
                        <span>Direct Sensor Telemetry: <strong style={{ color: source.station_sensors_connected ? "#16a34a" : "#d97706" }}>{source.station_sensors_connected ? "ONLINE" : "PENDING SATCOM LINK"}</strong></span><br />
                        <span style={{ fontSize: "11px", color: "#64748b" }}>
                            External numerical weather models provide real-time boundary observations until direct IoT telemetry is linked.
                        </span>
                    </div>

                    <div>
                        <span style={{ color: "var(--accent-primary, #0284c7)", fontWeight: "700", display: "block", marginBottom: "4px", fontFamily: "var(--font-mono, monospace)" }}>
                            OBSERVATION COORDINATES
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ color: "#0f172a" }}>{stationInfo.coordinates}</span>
                            <button
                                type="button"
                                onClick={handleCopyCoords}
                                style={{
                                    background: "#ffffff",
                                    border: "1px solid #cbd5e1",
                                    color: "#0284c7",
                                    padding: "2px 6px",
                                    borderRadius: "3px",
                                    fontSize: "10px",
                                    fontWeight: 600,
                                    cursor: "pointer"
                                }}
                            >
                                {copiedInfo ? "COPIED" : "COPY"}
                            </button>
                        </div>
                        <span style={{ fontSize: "11px", color: "#64748b" }}>Timestamp: {environment?.timestamp ? `${environment.timestamp} UTC` : "Current UTC"}</span>
                    </div>
                </div>
            </section>

        </div>
    );
}
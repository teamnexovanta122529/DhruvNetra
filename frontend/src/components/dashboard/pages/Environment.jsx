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
                        background: "rgba(10, 30, 45, 0.7)",
                        border: "1px solid rgba(80, 200, 240, 0.25)",
                        padding: "6px 14px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        color: "#9cd8e6",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}>
                        <span style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            background: isUnavailable ? "#ef4444" : "#10b981",
                            boxShadow: isUnavailable ? "0 0 8px #ef4444" : "0 0 8px #10b981",
                            display: "inline-block"
                        }} />
                        <span>{isUnavailable ? "OFFLINE" : "LIVE"} · {timeSinceUpdate}</span>
                    </div>

                    <button
                        type="button"
                        onClick={refreshEnvironment}
                        disabled={isRefreshing || isLoading}
                        style={{
                            background: "linear-gradient(135deg, rgba(20, 50, 75, 0.9), rgba(15, 35, 55, 0.9))",
                            border: "1px solid rgba(100, 220, 255, 0.35)",
                            color: "#e2f8ff",
                            padding: "7px 16px",
                            borderRadius: "8px",
                            cursor: (isRefreshing || isLoading) ? "not-allowed" : "pointer",
                            fontSize: "12px",
                            fontWeight: "600",
                            letterSpacing: "0.5px",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
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
                    background: "linear-gradient(135deg, rgba(12, 28, 42, 0.92) 0%, rgba(8, 20, 32, 0.95) 100%)",
                    border: "1px solid rgba(80, 200, 255, 0.22)",
                    borderRadius: "12px",
                    padding: "24px 28px",
                    position: "relative",
                    overflow: "hidden",
                    boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)"
                }}>
                    {/* Background Subtle Polar Glow */}
                    <div style={{
                        position: "absolute",
                        top: "-50%",
                        right: "-10%",
                        width: "350px",
                        height: "350px",
                        background: "radial-gradient(circle, rgba(56, 189, 248, 0.12) 0%, transparent 70%)",
                        pointerEvents: "none"
                    }} />

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "24px", alignItems: "center" }}>
                        
                        {/* LEFT: Massive Ambient Temp & Wind Chill */}
                        <div>
                            <div style={{ fontSize: "11px", letterSpacing: "1.5px", color: "#67e8f9", fontWeight: "700", marginBottom: "6px" }}>
                                AMBIENT POLAR THERMAL STATE · {station.toUpperCase()}
                            </div>

                            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
                                <div style={{ fontSize: "54px", fontWeight: "800", color: "#ffffff", letterSpacing: "-1px", lineHeight: "1" }}>
                                    {isLoading ? "..." : isUnavailable ? "N/A" : current.temperature_c !== null && current.temperature_c !== undefined ? `${current.temperature_c > 0 ? "+" : ""}${current.temperature_c}°C` : "—"}
                                </div>

                                {polar.wind_chill_c !== null && polar.wind_chill_c !== undefined && (
                                    <div style={{
                                        background: "rgba(30, 58, 80, 0.8)",
                                        border: "1px solid rgba(125, 211, 252, 0.3)",
                                        padding: "4px 10px",
                                        borderRadius: "6px",
                                        fontSize: "13px",
                                        color: "#bae6fd"
                                    }}>
                                        Wind Chill: <strong>{polar.wind_chill_c > 0 ? "+" : ""}{polar.wind_chill_c}°C</strong>
                                    </div>
                                )}
                            </div>

                            <div style={{ marginTop: "10px", display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                                <span style={{
                                    background: "rgba(14, 165, 233, 0.15)",
                                    border: "1px solid rgba(56, 189, 248, 0.35)",
                                    color: "#7dd3fc",
                                    padding: "3px 8px",
                                    borderRadius: "4px",
                                    fontSize: "11px",
                                    fontWeight: "600"
                                }}>
                                    {polar.freezing_severity || "Sub-Zero Polar"}
                                </span>

                                <span style={{ fontSize: "12px", color: "rgba(220, 240, 255, 0.7)" }}>
                                    Elevation: {stationInfo.elevation || "117 m"} · {stationInfo.region || stationInfo.location}
                                </span>
                            </div>
                        </div>

                        {/* CENTER: Weather Condition & Cloud Status */}
                        <div style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", paddingLeft: "24px" }}>
                            <div style={{ fontSize: "11px", letterSpacing: "1.5px", color: "#94a3b8", fontWeight: "700", marginBottom: "6px" }}>
                                CURRENT METEOROLOGICAL STATE
                            </div>

                            <div style={{ fontSize: "24px", fontWeight: "700", color: "#e2e8f0", letterSpacing: "0.5px" }}>
                                {isLoading ? "Fetching Satellite & Model Feeds..." : isUnavailable ? "Data Stream Offline" : (conditions.weather || "Overcast Polar Conditions").toUpperCase()}
                            </div>

                            <div style={{ marginTop: "8px", fontSize: "13px", color: "#94a3b8", display: "flex", gap: "16px" }}>
                                <span>Cloud Cover: <strong style={{ color: "#cbd5e1" }}>{current.cloud_cover_percent ?? "—"}%</strong></span>
                                <span>Precipitation: <strong style={{ color: "#cbd5e1" }}>{current.precipitation_mm ?? 0} mm</strong></span>
                                <span>Snowfall: <strong style={{ color: "#cbd5e1" }}>{current.snowfall_cm ?? 0} cm</strong></span>
                            </div>
                        </div>

                        {/* RIGHT: Blizzard Risk Indicator */}
                        <div style={{ borderLeft: "1px solid rgba(255,255,255,0.08)", paddingLeft: "24px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                                <span style={{ fontSize: "11px", letterSpacing: "1.5px", color: "#f59e0b", fontWeight: "700" }}>
                                    BLIZZARD PROBABILITY INDEX
                                </span>
                                <span style={{
                                    fontSize: "12px",
                                    fontWeight: "700",
                                    color: polar.blizzard_risk === "CRITICAL" ? "#ef4444" : polar.blizzard_risk === "HIGH" ? "#f97316" : polar.blizzard_risk === "MODERATE" ? "#facc15" : "#10b981"
                                }}>
                                    {polar.blizzard_risk || "LOW"} ({polar.blizzard_probability_percent ?? 15}%)
                                </span>
                            </div>

                            {/* Risk Progress Bar */}
                            <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.08)", borderRadius: "4px", overflow: "hidden", marginTop: "8px" }}>
                                <div style={{
                                    width: `${polar.blizzard_probability_percent ?? 15}%`,
                                    height: "100%",
                                    background: polar.blizzard_risk === "CRITICAL" ? "linear-gradient(90deg, #f97316, #ef4444)" : polar.blizzard_risk === "HIGH" ? "linear-gradient(90deg, #eab308, #f97316)" : "linear-gradient(90deg, #10b981, #06b6d4)",
                                    transition: "width 0.5s ease"
                                }} />
                            </div>

                            <p style={{ fontSize: "11px", color: "rgba(200, 220, 240, 0.6)", marginTop: "8px", lineHeight: "1.4" }}>
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
                        <div className="metric-footer" style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px" }}>
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
                        <div className="metric-footer" style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px" }}>
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
                        <div className="metric-footer" style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px" }}>
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
                        <div className="metric-footer" style={{ fontSize: "11px", color: "#94a3b8", marginTop: "8px" }}>
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
                        ? "linear-gradient(135deg, rgba(60, 15, 20, 0.9), rgba(40, 10, 15, 0.95))"
                        : isAlertWarning
                        ? "linear-gradient(135deg, rgba(50, 30, 15, 0.9), rgba(35, 20, 10, 0.95))"
                        : "linear-gradient(135deg, rgba(12, 35, 45, 0.9), rgba(8, 25, 35, 0.95))",
                    border: `1px solid ${isAlertCritical ? "rgba(239, 68, 68, 0.45)" : isAlertWarning ? "rgba(249, 115, 22, 0.4)" : "rgba(16, 185, 129, 0.35)"}`,
                    borderRadius: "12px",
                    padding: "20px 24px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "12px"
                }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <span style={{
                                background: isAlertCritical ? "#ef4444" : isAlertWarning ? "#f97316" : isAlertWatch ? "#f59e0b" : "#10b981",
                                color: "#000",
                                fontWeight: "800",
                                fontSize: "11px",
                                padding: "3px 8px",
                                borderRadius: "4px",
                                letterSpacing: "1px"
                            }}>
                                {alertLevel}
                            </span>
                            <strong style={{ fontSize: "15px", color: "#f8fafc" }}>
                                {alert.title || `STATION ENVIRONMENTAL STATUS: ${alertLevel}`}
                            </strong>
                        </div>

                        <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                            Station Protocol: <strong>{isAlertCritical ? "CODE RED — LOCKDOWN EXTERIOR" : isAlertWarning ? "CODE ORANGE — CAUTIONARY SORTIES" : "CODE GREEN — NOMINAL OPERATIONS"}</strong>
                        </span>
                    </div>

                    <p style={{ margin: 0, fontSize: "13px", color: "#cbd5e1", lineHeight: "1.5" }}>
                        {alert.description || "All meteorological indicators are within standard operational envelope for East Antarctic research facilities."}
                    </p>

                    {alert.active_factors && alert.active_factors.length > 0 && (
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                            <span style={{ fontSize: "12px", color: "#94a3b8", alignSelf: "center" }}>Active Factors:</span>
                            {alert.active_factors.map((factor, idx) => (
                                <span key={idx} style={{
                                    background: "rgba(255,255,255,0.07)",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    color: "#f1f5f9",
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
                    background: "rgba(10, 22, 34, 0.6)",
                    border: "1px solid rgba(80, 200, 255, 0.12)",
                    borderRadius: "10px",
                    padding: "16px 20px",
                    fontSize: "12px",
                    color: "#94a3b8",
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
                    gap: "16px"
                }}>
                    <div>
                        <span style={{ color: "#67e8f9", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                            DATA PROVENANCE & MODEL ATTRIBUTION
                        </span>
                        <span>Provider: <strong>{source.provider || "Open-Meteo Polar Weather API"}</strong></span><br />
                        <span>Ensemble: <strong>{source.model_type || "ECMWF IFS / DWD ICON Polar Models"}</strong></span>
                    </div>

                    <div>
                        <span style={{ color: "#67e8f9", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                            STATION HARDWARE SENSORS
                        </span>
                        <span>Direct Sensor Telemetry: <strong style={{ color: source.station_sensors_connected ? "#10b981" : "#f59e0b" }}>{source.station_sensors_connected ? "ONLINE" : "PENDING SATCOM LINK"}</strong></span><br />
                        <span style={{ fontSize: "11px", color: "rgba(148, 163, 184, 0.8)" }}>
                            External numerical weather models provide real-time boundary observations until direct IoT telemetry is linked.
                        </span>
                    </div>

                    <div>
                        <span style={{ color: "#67e8f9", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                            OBSERVATION COORDINATES
                        </span>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>{stationInfo.coordinates}</span>
                            <button
                                type="button"
                                onClick={handleCopyCoords}
                                style={{
                                    background: "rgba(255,255,255,0.06)",
                                    border: "1px solid rgba(255,255,255,0.15)",
                                    color: "#93c5fd",
                                    padding: "2px 6px",
                                    borderRadius: "3px",
                                    fontSize: "10px",
                                    cursor: "pointer"
                                }}
                            >
                                {copiedInfo ? "COPIED" : "COPY"}
                            </button>
                        </div>
                        <span style={{ fontSize: "11px" }}>Timestamp: {environment?.timestamp ? `${environment.timestamp} UTC` : "Current UTC"}</span>
                    </div>
                </div>
            </section>

        </div>
    );
}
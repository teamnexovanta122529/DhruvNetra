import { useEffect, useRef, useState } from "react";
import PageHeader from "../common/PageHeader";
import StatusBadge from "../common/StatusBadge";
import StationScene from "../3d/StationScene";
import { useStation } from "../../../context/StationContext";
import { useEnvironment } from "../../../context/EnvironmentContext";

export default function DigitalTwin() {
    const { station, stationInfo } = useStation();
    const { environment, isLoading, isUnavailable, timeSinceUpdate } = useEnvironment();
    const [resetCount, setResetCount] = useState(0);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const panelRef = useRef(null);

    // =========================================
    // FULLSCREEN EVENT LISTENER
    // =========================================
    useEffect(() => {
        const handleFullscreenChange = () => {
            const active = Boolean(
                document.fullscreenElement ||
                document.webkitFullscreenElement ||
                document.mozFullScreenElement ||
                document.msFullscreenElement
            );
            setIsFullscreen(active);
        };

        document.addEventListener("fullscreenchange", handleFullscreenChange);
        document.addEventListener("webkitfullscreenchange", handleFullscreenChange);
        document.addEventListener("mozfullscreenchange", handleFullscreenChange);
        document.addEventListener("MSFullscreenChange", handleFullscreenChange);

        return () => {
            document.removeEventListener("fullscreenchange", handleFullscreenChange);
            document.removeEventListener("webkitfullscreenchange", handleFullscreenChange);
            document.removeEventListener("mozfullscreenchange", handleFullscreenChange);
            document.removeEventListener("MSFullscreenChange", handleFullscreenChange);
        };
    }, []);

    // =========================================
    // RESET CAMERA & CONTROLS
    // =========================================
    const handleResetView = () => {
        setResetCount((prev) => prev + 1);
    };

    // =========================================
    // FULLSCREEN TOGGLE
    // =========================================
    const handleToggleFullscreen = async () => {
        try {
            if (!isFullscreen) {
                const target = panelRef.current;
                if (!target) return;

                if (target.requestFullscreen) {
                    await target.requestFullscreen();
                } else if (target.webkitRequestFullscreen) {
                    await target.webkitRequestFullscreen();
                } else if (target.mozRequestFullScreen) {
                    await target.mozRequestFullScreen();
                } else if (target.msRequestFullscreen) {
                    await target.msRequestFullscreen();
                }
            } else {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if (document.webkitExitFullscreen) {
                    await document.webkitExitFullscreen();
                } else if (document.mozCancelFullScreen) {
                    await document.mozCancelFullScreen();
                } else if (document.msExitFullscreen) {
                    await document.msExitFullscreen();
                }
            }
        } catch (err) {
            console.warn("Fullscreen toggle failed:", err);
        }
    };

    return (
        <div className="dashboard-page digital-twin-page">

            <PageHeader
                eyebrow={`DHRUVNETRA / DIGITAL TWIN · ${stationInfo.coordinates || ""}`}
                title={`${station} DIGITAL TWIN`}
                description={`INTERACTIVE 3D REPRESENTATION OF ${station} ANTARCTIC RESEARCH STATION (${stationInfo.location})`}
                status="DIGITAL TWIN ONLINE"
            />

            <div className="digital-twin-layout">

                {/* =====================================
                    3D MODEL PANEL
                ===================================== */}

                <section
                    ref={panelRef}
                    className={`station-3d-panel ${isFullscreen ? "is-fullscreen" : ""}`}
                >

                    <div className="station-3d-header">

                        <div>
                            <span>LIVE STATION MODEL</span>

                            <strong>
                                {station} / ANTARCTICA
                            </strong>
                        </div>

                        <div className="model-controls">

                            {/* RESET BUTTON */}
                            <button
                                type="button"
                                className="control-btn reset-btn"
                                onClick={handleResetView}
                                title="Reset 3D camera to default orientation and zoom (↻)"
                            >
                                <span className="control-icon">↻</span>
                                <span>RESET</span>
                            </button>

                            {/* FULLSCREEN BUTTON */}
                            <button
                                type="button"
                                className={`control-btn fullscreen-btn ${isFullscreen ? "active" : ""}`}
                                onClick={handleToggleFullscreen}
                                title={
                                    isFullscreen
                                        ? "Exit Fullscreen 3D View (Esc or ⛶)"
                                        : "Expand 3D Digital Twin to Fullscreen (⛶)"
                                }
                            >
                                <span className="control-icon">
                                    {isFullscreen ? "✕" : "⛶"}
                                </span>
                                <span>
                                    {isFullscreen ? "EXIT FULLSCREEN" : "FULLSCREEN"}
                                </span>
                            </button>

                        </div>

                    </div>

                    <div className="station-3d-view">
                        <StationScene
                            station={station}
                            resetTrigger={resetCount}
                        />
                    </div>

                    <div className="station-3d-footer">

                        <span>
                            MODEL STATUS : ONLINE ({stationInfo.status || "OPERATIONAL"})
                        </span>

                        <span>
                            ELEVATION : {stationInfo.elevation || "117 m"} · EST. {stationInfo.established || "1989"}
                        </span>

                        <span>
                            CAMERA : ORBIT (DRAG TO ROTATE · SCROLL TO ZOOM)
                        </span>

                    </div>

                </section>


                {/* =====================================
                    SIDEBAR INFORMATION
                ===================================== */}

                <aside className="digital-twin-sidebar">

                    {/* STATION HEALTH */}

                    <section className="dashboard-panel">

                        <div className="panel-heading">
                            <span>STATION HEALTH</span>

                            <StatusBadge
                                status="HEALTHY"
                                type="normal"
                            />
                        </div>

                        <div className="health-score">

                            <div className="health-circle">
                                <strong>{stationInfo.health || 86}</strong>
                                <span>%</span>
                            </div>

                            <div>
                                <strong>
                                    OVERALL HEALTH
                                </strong>

                                <p>
                                    All critical {station} systems are operational within nominal parameters.
                                </p>
                            </div>

                        </div>


                        <div className="health-list">

                            <HealthRow
                                name="POWER"
                                value={`${stationInfo.power || 82}%`}
                            />

                            <HealthRow
                                name="FUEL"
                                value={`${stationInfo.fuel || 68}%`}
                            />

                            <HealthRow
                                name="WATER"
                                value={`${stationInfo.water || 91}%`}
                            />

                            <HealthRow
                                name="HVAC"
                                value={stationInfo.hvac || "NORMAL"}
                            />

                            <HealthRow
                                name="COMMS"
                                value={stationInfo.satcom || "CONNECTED"}
                            />

                        </div>

                    </section>


                    {/* WEATHER */}

                    <section className="dashboard-panel weather-panel">

                        <div className="panel-heading">
                            <span>WEATHER SNAPSHOT</span>

                            <span className={isUnavailable ? "weather-live offline" : "weather-live"}>
                                {isUnavailable ? "● OFFLINE" : "● LIVE"}
                            </span>
                        </div>

                        <div className="weather-main">

                            <div className="weather-temperature">
                                {isLoading
                                    ? "..."
                                    : isUnavailable
                                    ? "N/A"
                                    : environment?.current?.temperature_c !== null && environment?.current?.temperature_c !== undefined
                                    ? `${environment.current.temperature_c > 0 ? "+" : ""}${environment.current.temperature_c}`
                                    : "−"}°
                                <small>C</small>
                            </div>

                            <div className="weather-condition">
                                <strong>
                                    {isLoading
                                        ? "FETCHING METEOROLOGY..."
                                        : isUnavailable
                                        ? "DATA UNAVAILABLE"
                                        : (environment?.conditions?.weather || "POLAR CONDITIONS").toUpperCase()}
                                </strong>

                                <span>
                                    {environment?.polar_indices?.wind_chill_c !== null && environment?.polar_indices?.wind_chill_c !== undefined
                                        ? `Wind Chill: ${environment.polar_indices.wind_chill_c}°C · ${stationInfo.location}`
                                        : stationInfo.location}
                                </span>
                            </div>

                        </div>


                        <div className="weather-grid">

                            <WeatherItem
                                label="WIND"
                                value={
                                    isLoading
                                        ? "..."
                                        : isUnavailable
                                        ? "N/A"
                                        : environment?.current?.wind_speed_kmh ?? "—"
                                }
                                unit="KM/H"
                            />

                            <WeatherItem
                                label="DIRECTION"
                                value={
                                    isLoading
                                        ? "..."
                                        : isUnavailable
                                        ? "N/A"
                                        : environment?.current?.wind_direction_cardinal || "—"
                                }
                            />

                            <WeatherItem
                                label="PRESSURE"
                                value={
                                    isLoading
                                        ? "..."
                                        : isUnavailable
                                        ? "N/A"
                                        : environment?.current?.pressure_hpa ?? "—"
                                }
                                unit="HPA"
                            />

                            <WeatherItem
                                label="HUMIDITY"
                                value={
                                    isLoading
                                        ? "..."
                                        : isUnavailable
                                        ? "N/A"
                                        : environment?.current?.humidity_percent ?? "—"
                                }
                                unit="%"
                            />

                        </div>

                        {/* SOURCE ATTRIBUTION FOOTER */}
                        <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "10px", color: "rgba(160,200,220,0.6)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span>SOURCE: OPEN-METEO POLAR NWP</span>
                            <span>{timeSinceUpdate}</span>
                        </div>

                    </section>

                </aside>

            </div>

        </div>
    );
}


/* =========================================
   HEALTH ROW
========================================= */

function HealthRow({
    name,
    value,
}) {
    return (
        <div className="health-row">

            <span>{name}</span>

            <div className="health-bar">
                <i
                    style={{
                        width:
                            value === "NORMAL" ||
                            value === "OPTIMAL" ||
                            value === "CONNECTED" ||
                            value === "STABLE"
                                ? "88%"
                                : value,
                    }}
                />
            </div>

            <strong>{value}</strong>

        </div>
    );
}


/* =========================================
   WEATHER ITEM
========================================= */

function WeatherItem({
    label,
    value,
    unit,
}) {
    return (
        <div className="weather-item">

            <span>{label}</span>

            <strong>
                {value}

                {unit && (
                    <small>
                        {" "}
                        {unit}
                    </small>
                )}
            </strong>

        </div>
    );
}

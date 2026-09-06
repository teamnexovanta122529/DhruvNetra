import "./StationDashboard.css";
import { useState } from "react";
import { useEnvironment } from "../../context/EnvironmentContext";

const stationData = {
    MAITRI: {
        name: "MAITRI",
        location: "SCHIRMACHER OASIS · EAST ANTARCTICA",
        health: 86,
        power: 82,
        fuel: 68,
        hvac: 88,
        water: 91,
        environment: 79,
        logistics: 84,
        temperature: "-24°C",
        wind: "38 km/h",
        humidity: "71%",
        pressure: "982 hPa",
        satcom: "CONNECTED",
    },

    BHARATI: {
        name: "BHARATI",
        location: "LARSEN ICE SHELF · EAST ANTARCTICA",
        health: 91,
        power: 89,
        fuel: 76,
        hvac: 92,
        water: 94,
        environment: 87,
        logistics: 88,
        temperature: "-18°C",
        wind: "29 km/h",
        humidity: "68%",
        pressure: "986 hPa",
        satcom: "CONNECTED",
    },
};

export default function StationDashboard({
    station = "MAITRI",
    onBack,
}) {
    const [activeSection, setActiveSection] = useState("OVERVIEW");

    const data = stationData[station] || stationData.MAITRI;

    return (
        <main className="station-dashboard">

            {/* =========================================
                TOP HEADER
            ========================================= */}

            <header className="dashboard-header">

                <div className="dashboard-brand">

                    <div className="dashboard-brand-mark">
                        D
                    </div>

                    <div>
                        <h1>DHRUVNETRA</h1>

                        <p>
                            AI-POWERED DIGITAL TWIN
                        </p>
                    </div>

                </div>


                <div className="dashboard-station-title">

                    <span>
                        DIGITAL TWIN DASHBOARD
                    </span>

                    <h2>
                        {data.name} ANTARCTIC STATION
                    </h2>

                    <p>
                        {data.location}
                    </p>

                </div>


                <div className="dashboard-header-status">

                    <div className="online-status">
                        <span className="online-dot" />
                        STATION ONLINE
                    </div>

                    <div className="header-status-item">
                        <span>SATCOM</span>
                        <strong>CONNECTED</strong>
                    </div>

                    <div className="header-status-item">
                        <span>LAST SYNC</span>
                        <strong>14:42:08 UTC</strong>
                    </div>

                </div>

            </header>


            {/* =========================================
                BODY
            ========================================= */}

            <div className="dashboard-body">

                {/* =====================================
                    SIDEBAR
                ===================================== */}

                <aside className="dashboard-sidebar">

                    <DashboardNav
                        active={activeSection}
                        onChange={setActiveSection}
                    />

                    <div className="sidebar-footer">
                        <span>PROJECT</span>
                        <strong>DHRUVNETRA</strong>

                        <span>SIH 2026 · NEXOVANTA</span>
                    </div>

                </aside>


                {/* =====================================
                    MAIN AREA
                ===================================== */}

                <section className="dashboard-main">

                    {/* TOP ROW */}

                    <div className="dashboard-main-grid">

                        {/* 3D DIGITAL TWIN */}

                        <DigitalTwinPreview
                            station={data.name}
                        />


                        {/* RIGHT COLUMN */}

                        <div className="dashboard-right-column">

                            <StationHealth data={data} />

                            <ActiveAlerts />

                            <WeatherSnapshot data={data} />

                        </div>

                    </div>


                    {/* KPI CARDS */}

                    <KpiGrid data={data} />


                    {/* LOWER ROW */}

                    <div className="dashboard-lower-grid">

                        <GeneratorPanel />

                        <PowerTrend />

                        <FuelConsumption />

                    </div>


                    {/* SATCOM */}

                    <SatcomPanel data={data} />


                    {/* ACTIVITY */}

                    <RecentActivity />

                </section>

            </div>


            {/* =========================================
                BACK BUTTON
            ========================================= */}

            <button
                className="dashboard-back"
                onClick={onBack}
                type="button"
            >
                ← STATION SELECT
            </button>

        </main>
    );
}


/* =====================================================
   SIDEBAR NAVIGATION
===================================================== */

function DashboardNav({ active, onChange }) {

    const items = [
        ["OVERVIEW", "⌘"],
        ["3D DIGITAL TWIN", "◇"],
        ["POWER SYSTEMS", "ϟ"],
        ["FUEL SYSTEMS", "◉"],
        ["HVAC SYSTEMS", "✣"],
        ["WATER SYSTEMS", "◌"],
        ["ENVIRONMENT", "△"],
        ["LOGISTICS", "▣"],
        ["ALERTS", "!"],
        ["WHAT-IF ANALYSIS", "⌁"],
        ["REPORTS", "▤"],
        ["SETTINGS", "⚙"],
    ];

    return (
        <nav className="dashboard-nav">

            {items.map(([label, icon]) => (

                <button
                    key={label}
                    type="button"
                    className={
                        active === label
                            ? "dashboard-nav-item active"
                            : "dashboard-nav-item"
                    }
                    onClick={() => onChange(label)}
                >

                    <span className="nav-icon">
                        {icon}
                    </span>

                    <span>
                        {label}
                    </span>

                    {label === "ALERTS" && (
                        <b className="alert-count">
                            3
                        </b>
                    )}

                </button>

            ))}

        </nav>
    );
}


/* =====================================================
   3D DIGITAL TWIN PREVIEW
===================================================== */

function DigitalTwinPreview({ station }) {

    return (
        <div className="digital-twin-panel">

            <div className="panel-heading">

                <div>
                    <span className="panel-kicker">
                        LIVE DIGITAL TWIN
                    </span>

                    <h3>
                        {station} STATION 3D VIEW
                    </h3>
                </div>

                <div className="panel-controls">
                    <button type="button">⌂</button>
                    <button type="button">◈</button>
                    <button type="button">⛶</button>
                </div>

            </div>


            <div className="station-3d-stage">

                <div className="stage-grid" />

                <div className="station-glow" />

                {/* Temporary station model */}

                <div className="station-model">

                    <div className="station-building building-one">
                        <span />
                        <span />
                        <span />
                    </div>

                    <div className="station-building building-two">
                        <span />
                        <span />
                    </div>

                    <div className="station-building building-three">
                        <span />
                    </div>

                    <div className="station-tower">
                        <i />
                        <i />
                        <i />
                    </div>

                    <div className="station-road" />

                </div>


                {/* Interactive hotspots */}

                <TwinHotspot
                    className="hotspot-power"
                    label="POWER HOUSE"
                    status="ONLINE"
                />

                <TwinHotspot
                    className="hotspot-living"
                    label="LIVING MODULE"
                    status="NORMAL"
                />

                <TwinHotspot
                    className="hotspot-hvac"
                    label="HVAC PLANT"
                    status="NORMAL"
                />

                <TwinHotspot
                    className="hotspot-water"
                    label="WATER PLANT"
                    status="ONLINE"
                />

                <TwinHotspot
                    className="hotspot-lab"
                    label="LABORATORY"
                    status="ACTIVE"
                />


                <div className="stage-instructions">
                    DRAG TO ROTATE · SCROLL TO ZOOM · CLICK COMPONENT
                </div>

            </div>

        </div>
    );
}


function TwinHotspot({
    className,
    label,
    status,
}) {

    return (
        <div className={`twin-hotspot ${className}`}>

            <div className="hotspot-line" />

            <div className="hotspot-label">

                <strong>
                    {label}
                </strong>

                <span>
                    <i />
                    {status}
                </span>

            </div>

        </div>
    );
}


/* =====================================================
   STATION HEALTH
===================================================== */

function StationHealth({ data }) {

    return (
        <div className="dashboard-panel health-panel">

            <PanelTitle title="STATION HEALTH" />


            <div className="health-content">

                <div
                    className="health-ring"
                    style={{
                        "--health": `${data.health * 3.6}deg`,
                    }}
                >
                    <strong>
                        {data.health}%
                    </strong>

                    <span>
                        OVERALL HEALTH
                    </span>
                </div>


                <div className="health-list">

                    <HealthRow label="POWER" value={data.power} />
                    <HealthRow label="FUEL" value={data.fuel} />
                    <HealthRow label="HVAC" value={data.hvac} />
                    <HealthRow label="WATER" value={data.water} />
                    <HealthRow label="ENVIRONMENT" value={data.environment} />
                    <HealthRow label="LOGISTICS" value={data.logistics} />

                </div>

            </div>

        </div>
    );
}


function HealthRow({ label, value }) {

    return (
        <div className="health-row">

            <span>
                {label}
            </span>

            <strong>
                {value}%
            </strong>

        </div>
    );
}


/* =====================================================
   ALERTS
===================================================== */

function ActiveAlerts() {

    return (
        <div className="dashboard-panel alerts-panel">

            <PanelTitle
                title="ACTIVE ALERTS"
                action="VIEW ALL"
            />

            <Alert
                type="critical"
                title="Generator 02 Overload"
                time="14:40 UTC"
            />

            <Alert
                type="warning"
                title="Fuel Level Low in Tank-02"
                time="14:15 UTC"
            />

            <Alert
                type="warning"
                title="High Wind Speed Detected"
                time="13:55 UTC"
            />

        </div>
    );
}


function Alert({
    type,
    title,
    time,
}) {

    return (
        <div className={`alert-item ${type}`}>

            <span className="alert-symbol">
                {type === "critical" ? "▲" : "△"}
            </span>

            <div>
                <strong>
                    {type.toUpperCase()}
                </strong>

                <p>
                    {title}
                </p>
            </div>

            <time>
                {time}
            </time>

        </div>
    );
}


/* =====================================================
   WEATHER
===================================================== */

function WeatherSnapshot({ data }) {
    let envData = null;
    try {
        const envContext = useEnvironment();
        envData = envContext?.environment;
    } catch {
        // Fallback if rendered outside EnvironmentProvider
    }

    const tempDisplay = envData?.current?.temperature_c !== null && envData?.current?.temperature_c !== undefined
        ? `${envData.current.temperature_c > 0 ? "+" : ""}${envData.current.temperature_c}°C`
        : data?.temperature || "−21°C";

    const conditionDisplay = (envData?.conditions?.weather || "POLAR CONDITIONS").toUpperCase();
    const windDisplay = envData?.current?.wind_speed_kmh !== null && envData?.current?.wind_speed_kmh !== undefined
        ? `${envData.current.wind_speed_kmh} km/h`
        : data?.wind || "34 km/h";
    const windDir = envData?.current?.wind_direction_cardinal || "SE";
    const humidityDisplay = envData?.current?.humidity_percent !== null && envData?.current?.humidity_percent !== undefined
        ? `${envData.current.humidity_percent}%`
        : data?.humidity || "71%";
    const pressureDisplay = envData?.current?.pressure_hpa !== null && envData?.current?.pressure_hpa !== undefined
        ? `${envData.current.pressure_hpa} hPa`
        : data?.pressure || "982 hPa";
    const blizzardRisk = envData?.polar_indices?.blizzard_risk || "LOW";

    return (
        <div className="dashboard-panel weather-panel">

            <PanelTitle title="WEATHER SNAPSHOT" />

            <div className="weather-main">

                <div className="temperature">
                    {tempDisplay}
                </div>

                <div>
                    <strong>
                        {conditionDisplay}
                    </strong>

                    <span>
                        ANTARCTIC CONDITIONS
                    </span>
                </div>

            </div>


            <div className="weather-details">

                <WeatherRow label="WIND SPEED" value={windDisplay} />
                <WeatherRow label="WIND DIRECTION" value={windDir} />
                <WeatherRow label="HUMIDITY" value={humidityDisplay} />
                <WeatherRow label="PRESSURE" value={pressureDisplay} />

            </div>


            <div className="blizzard-status">

                <span>
                    BLIZZARD PROBABILITY
                </span>

                <strong>
                    {blizzardRisk}
                </strong>

                <div>
                    <i />
                </div>

            </div>

        </div>
    );
}


function WeatherRow({ label, value }) {

    return (
        <div className="weather-row">
            <span>{label}</span>
            <strong>{value}</strong>
        </div>
    );
}


/* =====================================================
   KPI GRID
===================================================== */

function KpiGrid({ data }) {

    const items = [
        ["POWER AVAILABILITY", `${data.power}%`, "4.1 MW / 5.0 MW", "power"],
        ["FUEL LEVEL", `${data.fuel}%`, "17,520 L / 25,800 L", "fuel"],
        ["HVAC STATUS", "NORMAL", "All Systems Operational", "hvac"],
        ["WATER LEVEL", `${data.water}%`, "45,600 L / 50,000 L", "water"],
        ["LOGISTICS SCORE", `${data.logistics}%`, "Supplies Sufficient", "logistics"],
        ["ENVIRONMENT SCORE", `${data.environment}%`, "Conditions Stable", "environment"],
    ];

    return (
        <div className="kpi-grid">

            {items.map(([title, value, subtitle, type]) => (

                <div
                    className={`kpi-card kpi-${type}`}
                    key={title}
                >

                    <div className="kpi-title">
                        {title}
                    </div>

                    <strong className="kpi-value">
                        {value}
                    </strong>

                    <span className="kpi-subtitle">
                        {subtitle}
                    </span>

                    <div className="mini-chart">
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                        <i />
                    </div>

                </div>

            ))}

        </div>
    );
}


/* =====================================================
   GENERATORS
===================================================== */

function GeneratorPanel() {

    return (
        <div className="dashboard-panel generator-panel">

            <PanelTitle
                title="POWER GENERATORS"
                action="VIEW ALL"
            />

            <Generator
                name="GENERATOR 01"
                status="ONLINE"
                load="72%"
                voltage="415 V"
            />

            <Generator
                name="GENERATOR 02"
                status="ONLINE"
                load="91%"
                voltage="414 V"
                warning
            />

            <Generator
                name="GENERATOR 03"
                status="STANDBY"
                load="0%"
                voltage="0 V"
                standby
            />

        </div>
    );
}


function Generator({
    name,
    status,
    load,
    voltage,
    warning,
    standby,
}) {

    return (
        <div
            className={
                `generator-row
                ${warning ? "generator-warning" : ""}
                ${standby ? "generator-standby" : ""}`
            }
        >

            <div>
                <strong>{name}</strong>

                <span>
                    ● {status}
                </span>
            </div>

            <div>
                Load: {load}
            </div>

            <div>
                {voltage}
            </div>

            <div>
                50 Hz
            </div>

        </div>
    );
}


/* =====================================================
   POWER TREND
===================================================== */

function PowerTrend() {

    return (
        <div className="dashboard-panel chart-panel">

            <PanelTitle
                title="POWER TREND"
                action="LAST 24 HOURS"
            />

            <div className="fake-chart">

                <div className="chart-y">
                    <span>100%</span>
                    <span>75%</span>
                    <span>50%</span>
                    <span>25%</span>
                    <span>0%</span>
                </div>

                <svg
                    viewBox="0 0 500 180"
                    preserveAspectRatio="none"
                >

                    <polyline
                        points="0,95 35,115 70,90 105,100 140,72 175,84 210,65 245,78 280,55 315,67 350,48 385,56 420,38 455,45 500,32"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                    />

                    <polyline
                        points="0,130 35,135 70,118 105,126 140,105 175,113 210,100 245,108 280,92 315,100 350,82 385,90 420,72 455,82 500,65"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        opacity="0.35"
                    />

                </svg>

            </div>

        </div>
    );
}


/* =====================================================
   FUEL
===================================================== */

function FuelConsumption() {

    const bars = [62, 38, 70, 82, 54, 76, 66];

    return (
        <div className="dashboard-panel chart-panel">

            <PanelTitle
                title="FUEL CONSUMPTION"
                action="LAST 7 DAYS"
            />

            <div className="fuel-chart">

                {bars.map((height, index) => (

                    <div
                        className="fuel-bar-wrapper"
                        key={index}
                    >

                        <div
                            className="fuel-bar"
                            style={{
                                height: `${height}%`,
                            }}
                        />

                        <span>
                            {["06", "07", "08", "09", "11", "12", "13"][index]}
                        </span>

                    </div>

                ))}

            </div>

        </div>
    );
}


/* =====================================================
   SATCOM
===================================================== */

function SatcomPanel({ data }) {

    return (
        <div className="dashboard-panel satcom-panel">

            <div>

                <PanelTitle title="SATCOM STATUS" />

                <div className="satcom-status">

                    <span className="online-dot" />

                    <strong>
                        {data.satcom}
                    </strong>

                </div>

            </div>


            <div className="satcom-metrics">

                <SatcomMetric
                    label="UPLINK"
                    value="82%"
                />

                <SatcomMetric
                    label="DOWNLINK"
                    value="76%"
                />

                <SatcomMetric
                    label="LATENCY"
                    value="640 ms"
                />

            </div>


            <button
                className="sync-button"
                type="button"
            >
                SYNC STATION DATA
            </button>

        </div>
    );
}


function SatcomMetric({
    label,
    value,
}) {

    return (
        <div className="satcom-metric">

            <span>
                {label}
            </span>

            <strong>
                {value}
            </strong>

            {label !== "LATENCY" && (
                <div className="metric-bar">
                    <i
                        style={{
                            width: value,
                        }}
                    />
                </div>
            )}

        </div>
    );
}


/* =====================================================
   RECENT ACTIVITY
===================================================== */

function RecentActivity() {

    return (
        <div className="recent-activity">

            <span>
                RECENT ACTIVITY
            </span>

            <div>
                <i className="activity-green" />
                14:42 UTC · Station data synchronized successfully
            </div>

            <div>
                <i className="activity-red" />
                14:40 UTC · Generator 02 overload
            </div>

            <div>
                <i className="activity-orange" />
                14:15 UTC · Fuel level low in Tank-02
            </div>

            <div>
                <i className="activity-yellow" />
                13:55 UTC · High wind speed detected
            </div>

        </div>
    );
}


/* =====================================================
   HELPERS
===================================================== */

function PanelTitle({
    title,
    action,
}) {

    return (
        <div className="panel-title">

            <h3>
                {title}
            </h3>

            {action && (
                <span>
                    {action}
                </span>
            )}

        </div>
    );
}


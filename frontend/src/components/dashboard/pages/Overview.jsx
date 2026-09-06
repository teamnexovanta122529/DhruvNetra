import PageHeader from "../common/PageHeader";
import MetricCard from "../common/MetricCard";
import StatusBadge from "../common/StatusBadge";
import { useStation } from "../../../context/StationContext";
import { useEnvironment } from "../../../context/EnvironmentContext";

export default function Overview() {
    const { station, stationInfo } = useStation();
    const { environment, isLoading, isUnavailable } = useEnvironment();

    return (
        <div className="dashboard-page">

            <PageHeader
                eyebrow={`DHRUVNETRA / STATION CONTROL · ${stationInfo.coordinates || ""}`}
                title={`${station} STATION OVERVIEW`}
                description={`REAL-TIME OPERATIONAL STATUS OF ${station} ANTARCTIC RESEARCH STATION (${stationInfo.location})`}
                status="STATION ONLINE"
            />

            {/* =========================================
                PRIMARY METRICS
            ========================================= */}

            <section className="metrics-grid">

                <MetricCard
                    label="POWER AVAILABILITY"
                    value={stationInfo.power || "82"}
                    unit="%"
                    status="NORMAL"
                    trend="↑ 2.4% from yesterday"
                />

                <MetricCard
                    label="FUEL LEVEL"
                    value={stationInfo.fuel || "68"}
                    unit="%"
                    status="NORMAL"
                    trend={stationInfo.fuelReserveDays || "12.4 DAYS REMAINING"}
                />

                <MetricCard
                    label="WATER LEVEL"
                    value={stationInfo.water || "91"}
                    unit="%"
                    status="NORMAL"
                    trend={stationInfo.waterCapacity || "↑ 4.1% capacity"}
                />

                <MetricCard
                    label="HVAC STATUS"
                    value={stationInfo.hvac || "NORMAL"}
                    status="STABLE"
                    trend={`INDOOR ${stationInfo.indoorTemp || "−18°C"}`}
                />

            </section>


            {/* =========================================
                SYSTEM STATUS
            ========================================= */}

            <section className="dashboard-section">

                <div className="section-heading">
                    <div>
                        <span>SYSTEM MONITORING</span>
                        <h2>CORE SYSTEM STATUS</h2>
                    </div>

                    <span className="section-live">
                        ● LIVE
                    </span>
                </div>


                <div className="system-status-grid">

                    <SystemStatus
                        name="POWER SYSTEM"
                        value="82%"
                        detail="3 GENERATORS"
                        status="NORMAL"
                    />

                    <SystemStatus
                        name="FUEL SYSTEM"
                        value="68%"
                        detail="2 STORAGE TANKS"
                        status="NORMAL"
                    />

                    <SystemStatus
                        name="HVAC SYSTEM"
                        value="NORMAL"
                        detail="6 ACTIVE ZONES"
                        status="NORMAL"
                    />

                    <SystemStatus
                        name="WATER SYSTEM"
                        value="91%"
                        detail="MAIN RESERVOIR"
                        status="NORMAL"
                    />

                    <SystemStatus
                        name="ENVIRONMENT"
                        value={
                            isLoading
                                ? "..."
                                : isUnavailable
                                ? "OFFLINE"
                                : environment?.current?.temperature_c !== null && environment?.current?.temperature_c !== undefined
                                ? `${environment.current.temperature_c > 0 ? "+" : ""}${environment.current.temperature_c}°C`
                                : "N/A"
                        }
                        detail={
                            isLoading
                                ? "FETCHING LIVE..."
                                : isUnavailable
                                ? "DATA UNAVAILABLE"
                                : `BLIZZARD ${environment?.polar_indices?.blizzard_risk || "LOW"} · ${environment?.conditions?.weather || "POLAR"}`.toUpperCase()
                        }
                        status={
                            isUnavailable
                                ? "WARNING"
                                : environment?.alert?.level === "CRITICAL" || environment?.alert?.level === "WARNING"
                                ? "WARNING"
                                : "NORMAL"
                        }
                    />

                    <SystemStatus
                        name="SATCOM"
                        value="CONNECTED"
                        detail="LINK STABLE"
                        status="NORMAL"
                    />

                </div>

            </section>


            {/* =========================================
                LOWER INFORMATION
            ========================================= */}

            <div className="overview-lower-grid">

                {/* ALERTS */}

                <section className="dashboard-panel">

                    <div className="panel-heading">
                        <span>RECENT ALERTS</span>

                        <button>
                            VIEW ALL →
                        </button>
                    </div>

                    <div className="alert-list">

                        <AlertItem
                            type="warning"
                            title="HIGH WIND SPEED"
                            detail="Wind velocity exceeded 30 km/h"
                            time="12 MIN AGO"
                        />

                        <AlertItem
                            type="info"
                            title="FUEL READING UPDATED"
                            detail="Tank 02 telemetry synchronized"
                            time="28 MIN AGO"
                        />

                        <AlertItem
                            type="normal"
                            title="GENERATOR 03 ONLINE"
                            detail="Generator successfully synchronized"
                            time="41 MIN AGO"
                        />

                    </div>

                </section>


                {/* SATCOM */}

                <section className="dashboard-panel">

                    <div className="panel-heading">
                        <span>SATCOM LINK</span>

                        <StatusBadge
                            status="CONNECTED"
                            type="normal"
                        />
                    </div>

                    <div className="satcom-panel">

                        <div className="satcom-main">
                            <strong>98.7%</strong>
                            <span>LINK QUALITY</span>
                        </div>

                        <div className="satcom-data">
                            <div>
                                <span>LATENCY</span>
                                <strong>742 ms</strong>
                            </div>

                            <div>
                                <span>UPLINK</span>
                                <strong>ACTIVE</strong>
                            </div>

                            <div>
                                <span>LAST SYNC</span>
                                <strong>02:14 UTC</strong>
                            </div>
                        </div>

                    </div>

                </section>

            </div>


            {/* =========================================
                ACTIVITY
            ========================================= */}

            <section className="dashboard-panel activity-panel">

                <div className="panel-heading">
                    <span>RECENT ACTIVITY</span>
                    <span className="activity-date">
                        05 SEP 2026 · UTC
                    </span>
                </div>

                <div className="activity-row">

                    <Activity
                        time="14:21"
                        text="Station telemetry synchronized"
                    />

                    <Activity
                        time="14:08"
                        text="Generator 03 maintenance cycle completed"
                    />

                    <Activity
                        time="13:46"
                        text="Weather data updated"
                    />

                    <Activity
                        time="13:12"
                        text="Inventory status recalculated"
                    />

                </div>

            </section>

        </div>
    );
}


/* =========================================
   SYSTEM STATUS
========================================= */

function SystemStatus({
    name,
    value,
    detail,
    status,
}) {
    const warning = status === "WARNING";

    return (
        <div className="system-status-card">

            <div className="system-status-top">

                <span className="system-name">
                    {name}
                </span>

                <span
                    className={
                        warning
                            ? "system-indicator warning"
                            : "system-indicator"
                    }
                />

            </div>

            <strong>
                {value}
            </strong>

            <span className="system-detail">
                {detail}
            </span>

            <span
                className={
                    warning
                        ? "system-state warning"
                        : "system-state"
                }
            >
                {status}
            </span>

        </div>
    );
}


/* =========================================
   ALERT
========================================= */

function AlertItem({
    type,
    title,
    detail,
    time,
}) {
    return (
        <div className="alert-item">

            <span className={`alert-indicator ${type}`} />

            <div className="alert-content">
                <strong>{title}</strong>
                <span>{detail}</span>
            </div>

            <time>{time}</time>

        </div>
    );
}


/* =========================================
   ACTIVITY
========================================= */

function Activity({
    time,
    text,
}) {
    return (
        <div className="activity-item">

            <span>{time}</span>

            <i />

            <p>{text}</p>

        </div>
    );
}


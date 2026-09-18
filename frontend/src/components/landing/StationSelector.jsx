import { useEffect, useState } from "react";
import { stationData } from "../../data/stationData";

export default function StationSelector({
    onClose,
    onSelectStation,
}) {
    const [visible, setVisible] = useState(false);
    const [closing, setClosing] = useState(false);
    const [selectedStation, setSelectedStation] = useState(null);
    const [selecting, setSelecting] = useState(false);

    // ==========================================
    // OPEN ANIMATION
    // ==========================================
    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(true);
        }, 30);

        return () => clearTimeout(timer);
    }, []);

    // ==========================================
    // CLOSE HANDLER
    // ==========================================
    const handleClose = () => {
        if (closing || selecting) return;

        setClosing(true);

        setTimeout(() => {
            onClose?.();
        }, 350);
    };

    // ==========================================
    // KEYBOARD ESCAPE LISTENER
    // ==========================================
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                if (closing || selecting) return;
                setClosing(true);
                setTimeout(() => {
                    onClose?.();
                }, 350);
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [closing, selecting, onClose]);

    // ==========================================
    // STATION SELECT
    // ==========================================
    const handleStationSelect = (stationKey) => {
        if (selecting || closing) return;

        setSelecting(true);
        setSelectedStation(stationKey);

        setTimeout(() => {
            onSelectStation?.(stationKey);
        }, 400);
    };

    const maitri = stationData.MAITRI;
    const bharati = stationData.BHARATI;

    return (
        <div
            className={`
                mission-station-view
                ${visible ? "mission-view-visible" : ""}
                ${closing ? "mission-view-closing" : ""}
                ${selecting ? "mission-view-selecting" : ""}
            `}
            role="dialog"
            aria-modal="true"
            aria-label="Select Operating Station"
        >
            {/* Minimal Top Header */}
            <header className="mission-nav-header">
                <div className="mission-brand-left">
                    <div className="mission-brand-title">
                        <img
                            src="/dhruvnetra_favicon.svg"
                            alt="DhruvNetra Emblem"
                            className="mission-brand-emblem"
                        />
                        <span className="brand-primary-text">DHRUVNETRA</span>
                    </div>
                    <span className="mission-brand-divider">/</span>
                    <span className="mission-network-tag">ANTARCTIC DIGITAL TWIN NETWORK</span>
                </div>

                <div className="mission-nav-right">
                    <span className="mission-select-heading">SELECT OPERATING STATION</span>
                    <button
                        type="button"
                        className="mission-esc-button"
                        onClick={handleClose}
                        disabled={selecting}
                        aria-label="Close Station Selection"
                        data-cursor="pointer"
                    >
                        <span className="esc-key-tag">ESC</span>
                        <span className="esc-close-icon">✕</span>
                    </button>
                </div>
            </header>

            {/* Split Screen 50/50 Viewport Stations */}
            <main className="mission-stations-split">
                {/* MAITRI STATION SECTION */}
                <StationSection
                    stationKey="MAITRI"
                    name="MAITRI"
                    location="Schirmacher Oasis, Queen Maud Land"
                    coordinates="70°45′58″ S · 11°44′09″ E"
                    established="1989"
                    elevation="117 m"
                    temperature={maitri.outdoorTemp || maitri.environment || "−24.3°C"}
                    windSpeed={maitri.windSpeed || "34 km/h"}
                    powerLoad={`${maitri.power}% · ${maitri.totalPowerDemandKw || 295} kW`}
                    operationDuration="36+ YRS CONTINUOUS"
                    crewCount={`${maitri.winterCrew} Winter / ${maitri.summerCrew} Summer`}
                    imageSrc="/images/maitri.jpg"
                    isSelected={selectedStation === "MAITRI"}
                    isDimmed={selecting && selectedStation !== "MAITRI"}
                    disabled={selecting}
                    onSelect={() => handleStationSelect("MAITRI")}
                />

                {/* Subtle Divider Line */}
                <div className="mission-split-divider">
                    <div className="divider-glow-line" />
                </div>

                {/* BHARATI STATION SECTION */}
                <StationSection
                    stationKey="BHARATI"
                    name="BHARATI"
                    location="Larsemann Hills, Prydz Bay, East Antarctica"
                    coordinates="69°24′28″ S · 76°11′14″ E"
                    established="2012"
                    elevation="35 m"
                    temperature={bharati.outdoorTemp || bharati.environment || "−18.2°C"}
                    windSpeed={bharati.windSpeed || "28 km/h"}
                    powerLoad={`${bharati.power}% · ${bharati.totalPowerDemandKw || 335} kW`}
                    operationDuration="14+ YRS CONTINUOUS"
                    crewCount={`${bharati.winterCrew} Winter / ${bharati.summerCrew} Summer`}
                    imageSrc="/images/bharati.jpg"
                    isSelected={selectedStation === "BHARATI"}
                    isDimmed={selecting && selectedStation !== "BHARATI"}
                    disabled={selecting}
                    onSelect={() => handleStationSelect("BHARATI")}
                />
            </main>

            {/* Minimal Mission Information Footer Strip */}
            <footer className="mission-info-footer">
                <span className="footer-agency">NATIONAL CENTRE FOR POLAR AND OCEAN RESEARCH</span>
                <span className="footer-dot">·</span>
                <span className="footer-agency">MINISTRY OF EARTH SCIENCES</span>
                <span className="footer-dot">·</span>
                <span className="footer-agency">GOVERNMENT OF INDIA</span>
            </footer>
        </div>
    );
}

/* =========================================================
   INDIVIDUAL FULL-BLEED HORIZONTAL STATION SECTION
========================================================= */
function StationSection({
    stationKey,
    name,
    location,
    coordinates,
    established,
    elevation,
    temperature,
    windSpeed,
    powerLoad,
    operationDuration,
    crewCount,
    imageSrc,
    isSelected,
    isDimmed,
    disabled,
    onSelect,
}) {
    return (
        <section
            className={`
                mission-station-row
                ${isSelected ? "station-row-selected" : ""}
                ${isDimmed ? "station-row-dimmed" : ""}
            `}
            data-station={stationKey}
            onClick={onSelect}
            role="button"
            tabIndex={0}
            aria-label={`Select ${name} Station`}
            onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    onSelect();
                }
            }}
            data-cursor="pointer"
        >
            {/* Full-bleed Background Photograph */}
            <div
                className="station-row-bg"
                style={{ backgroundImage: `url(${imageSrc})` }}
            />

            {/* Dark Navy / Near-Black Gradients for Crisp Legibility */}
            <div className="station-row-overlay-primary" />
            <div className="station-row-overlay-vignette" />

            {/* Foreground Mission Dossier & Telemetry Content */}
            <div className="station-row-container">
                {/* Left Block: Identity, Location, Coordinates */}
                <div className="station-identity-block">
                    {/* Operational Status Tag */}
                    <div className="station-operational-badge">
                        <span className="operational-dot" />
                        <span className="operational-label">
                            {isSelected ? "INITIALIZING TWIN..." : "OPERATIONAL"}
                        </span>
                    </div>

                    {/* Large Editorial Station Heading */}
                    <h2 className="station-title-editorial">{name}</h2>

                    {/* Geographic Location Subheading */}
                    <p className="station-geo-location">{location}</p>

                    {/* Coordinates & Technical Metadata Strip */}
                    <div className="station-coords-strip">
                        <span className="coord-value">{coordinates}</span>
                        <span className="coord-bullet">·</span>
                        <span className="coord-est">EST. {established}</span>
                        <span className="coord-bullet">·</span>
                        <span className="coord-elev">ELEV {elevation}</span>
                        <span className="coord-bullet">·</span>
                        <span className="coord-crew">{crewCount}</span>
                    </div>
                </div>

                {/* Center Block: Telemetry Indicators */}
                <div className="station-telemetry-strip">
                    <div className="telemetry-item">
                        <span className="telemetry-label">CURRENT TEMP</span>
                        <span className="telemetry-value">{temperature}</span>
                    </div>

                    <div className="telemetry-item">
                        <span className="telemetry-label">WIND SPEED</span>
                        <span className="telemetry-value">{windSpeed}</span>
                    </div>

                    <div className="telemetry-item">
                        <span className="telemetry-label">POWER LOAD</span>
                        <span className="telemetry-value">{powerLoad}</span>
                    </div>

                    <div className="telemetry-item">
                        <span className="telemetry-label">OPERATION</span>
                        <span className="telemetry-value">{operationDuration}</span>
                    </div>
                </div>

                {/* Right Block: Action Button */}
                <div className="station-action-block">
                    <button
                        type="button"
                        className="station-enter-action"
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelect();
                        }}
                        disabled={disabled}
                        data-cursor="pointer"
                        aria-label={`Enter ${name} Station Digital Twin`}
                    >
                        <span className="enter-action-text">
                            {isSelected ? "CONNECTING..." : "ENTER STATION"}
                        </span>
                        <span className="enter-action-arrow">→</span>
                    </button>
                </div>
            </div>
        </section>
    );
}
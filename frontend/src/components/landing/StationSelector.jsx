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
        }, 40);

        return () => {
            clearTimeout(timer);
        };
    }, []);

    // ==========================================
    // CLOSE HANDLER
    // ==========================================
    const handleClose = () => {
        if (closing || selecting) return;

        setClosing(true);

        setTimeout(() => {
            onClose?.();
        }, 400);
    };

    // ==========================================
    // KEYBOARD ESCAPE LISTENER
    // ==========================================
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === "Escape") {
                handleClose();
            }
        };

        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [closing, selecting]);

    // ==========================================
    // STATION SELECT
    // ==========================================
    const handleStationSelect = (stationKey) => {
        if (selecting || closing) return;

        console.log("STATION CLICKED:", stationKey);

        setSelecting(true);
        setSelectedStation(stationKey);

        // Transition delay for subtle feedback
        setTimeout(() => {
            console.log("NAVIGATING TO STATION:", stationKey);
            onSelectStation?.(stationKey);
        }, 450);
    };

    const maitriData = stationData.MAITRI;
    const bharatiData = stationData.BHARATI;

    return (
        <div
            className={`
                station-selector
                ${visible ? "station-selector-visible" : ""}
                ${closing ? "station-selector-closing" : ""}
                ${selecting ? "station-selector-selecting" : ""}
            `}
            role="dialog"
            aria-modal="true"
            aria-label="Select Research Station"
        >
            {/* Background & Atmospheric Overlay */}
            <div className="station-selector-bg" />
            <div className="station-scan-line" />
            <div className="station-ambient-glow" />

            {/* Top Navigation & Status Bar */}
            <header className="station-selector-header">
                <div className="station-header-branding">
                    <div className="station-selector-kicker">
                        <span className="kicker-badge">DHRUVNETRA</span>
                        <span className="kicker-separator">/</span>
                        <span>ANTARCTIC DIGITAL TWIN NETWORK</span>
                    </div>
                    <h2 className="station-selector-title">
                        SELECT RESEARCH STATION
                    </h2>
                    <p className="station-selector-subtitle">
                        ACCESS THE DIGITAL TWIN NETWORK
                    </p>
                </div>

                <div className="station-header-actions">
                    <div className="station-network-status">
                        <span className="status-ping" />
                        <span className="status-text">NODES ACTIVE [2/2]</span>
                    </div>

                    <button
                        type="button"
                        className="station-close"
                        onClick={handleClose}
                        disabled={selecting}
                        aria-label="Close station selection"
                        data-cursor="pointer"
                    >
                        <span className="close-icon">✕</span>
                        <span className="close-label">ESC</span>
                    </button>
                </div>
            </header>

            {/* Central Expedition Station Panels */}
            <main className="station-selection-content">
                <div className="station-cards-container">
                    {/* MAITRI PANEL */}
                    <StationPanel
                        stationKey="MAITRI"
                        data={maitriData}
                        imageSrc="/images/maitri.jpg"
                        index="01"
                        code="MT"
                        sector="SECTOR 70°S"
                        selected={selectedStation === "MAITRI"}
                        otherSelected={selecting && selectedStation !== "MAITRI"}
                        disabled={selecting}
                        onClick={() => handleStationSelect("MAITRI")}
                    />

                    {/* BHARATI PANEL */}
                    <StationPanel
                        stationKey="BHARATI"
                        data={bharatiData}
                        imageSrc="/images/bharati.jpg"
                        index="02"
                        code="BH"
                        sector="SECTOR 69°S"
                        selected={selectedStation === "BHARATI"}
                        otherSelected={selecting && selectedStation !== "BHARATI"}
                        disabled={selecting}
                        onClick={() => handleStationSelect("BHARATI")}
                    />
                </div>
            </main>

            {/* Mission System Footer */}
            <footer className="station-selector-footer">
                <div className="footer-meta-left">
                    <span className="meta-label">GOVERNMENT OF INDIA</span>
                    <span className="meta-dot">·</span>
                    <span className="meta-sub">MINISTRY OF EARTH SCIENCES · NCPOR</span>
                </div>

                <div className="footer-meta-center">
                    <span className="meta-indicator" />
                    <span>
                        {selecting
                            ? `INITIALIZING ${selectedStation} DIGITAL TWIN...`
                            : "REAL-TIME TELEMETRY STREAM ONLINE"}
                    </span>
                </div>

                <div className="footer-meta-right">
                    <span>SECURE SATELLITE LINK · SATCOM 256-BIT</span>
                </div>
            </footer>
        </div>
    );
}

/* =====================================================
   STATION EXPEDITION PANEL COMPONENT
===================================================== */
function StationPanel({
    stationKey,
    data,
    imageSrc,
    index,
    code,
    sector,
    selected,
    otherSelected,
    disabled,
    onClick,
}) {
    return (
        <button
            type="button"
            className={`
                station-panel
                station-card
                ${selected ? "station-panel-selected" : ""}
                ${otherSelected ? "station-panel-dimmed" : ""}
            `}
            onClick={onClick}
            disabled={disabled}
            data-cursor="pointer"
            aria-label={`Select ${stationKey} Research Station`}
        >
            {/* Corner Precision Brackets */}
            <span className="station-bracket bracket-tl" />
            <span className="station-bracket bracket-tr" />
            <span className="station-bracket bracket-bl" />
            <span className="station-bracket bracket-br" />

            {/* Panel Top Header Bar */}
            <div className="panel-header-bar">
                <div className="panel-id-badge">
                    <span className="station-code-pill">{code}-{index}</span>
                    <span className="station-sector-tag">{sector}</span>
                </div>

                <div className="panel-telemetry-badge">
                    <span className="telemetry-live-dot" />
                    <span className="telemetry-live-label">
                        {selected ? "INITIALIZING..." : "TELEMETRY ACTIVE"}
                    </span>
                </div>
            </div>

            {/* Photographic Viewport */}
            <div className="station-image-frame">
                <img
                    src={imageSrc}
                    alt={`${data.name} Indian Antarctic Research Station`}
                    className="station-photo"
                    loading="eager"
                />

                {/* Subtle Image Vignette & Atmosphere Gradient */}
                <div className="station-photo-gradient" />
                <div className="station-photo-top-tint" />

                {/* Technical Coordinates Stamp */}
                <div className="station-coordinate-tag">
                    <span className="coord-icon">⌖</span>
                    <span>{data.coordinates}</span>
                    <span className="coord-divider">|</span>
                    <span>ELEV {data.elevation}</span>
                </div>

                {/* Station Establishment Tag */}
                <div className="station-est-tag">
                    <span>EST. {data.established}</span>
                </div>
            </div>

            {/* Station Dossier & Info Deck */}
            <div className="station-info-deck">
                <div className="station-name-row">
                    <div className="station-title-group">
                        <h3 className="station-name">{data.name}</h3>
                        <p className="station-subheading">
                            INDIAN ANTARCTIC RESEARCH STATION
                        </p>
                    </div>

                    <div className="station-symbol-badge">
                        <span>{code}</span>
                    </div>
                </div>

                <p className="station-location-text">
                    <span className="location-pin-icon">📍</span>
                    {data.location}
                </p>

                {/* Live Micro Telemetry Metrics */}
                <div className="station-quick-metrics">
                    <div className="metric-pill">
                        <span className="metric-label">TEMP</span>
                        <span className="metric-value">{data.environment}</span>
                    </div>
                    <div className="metric-pill">
                        <span className="metric-label">POWER</span>
                        <span className="metric-value">{data.power}%</span>
                    </div>
                    <div className="metric-pill">
                        <span className="metric-label">SATCOM</span>
                        <span className="metric-value">{data.satcomQuality}</span>
                    </div>
                    <div className="metric-pill">
                        <span className="metric-label">HEALTH</span>
                        <span className="metric-value">{data.health}%</span>
                    </div>
                </div>
            </div>

            {/* Mission CTA Control Bar */}
            <div className="station-cta-bar">
                <div className="cta-action-content">
                    <span className="cta-dot" />
                    <span className="cta-label">
                        {selected
                            ? "INITIALIZING DIGITAL TWIN..."
                            : "ENTER DIGITAL TWIN"}
                    </span>
                </div>

                <div className="cta-arrow-wrapper">
                    <span className="cta-arrow">→</span>
                </div>
            </div>

            {/* Scanning Glow Border Effect */}
            <div className="panel-glow-layer" />
        </button>
    );
}
import { useEffect, useState } from "react";

export default function StationSelector({ onClose }) {
    const [visible, setVisible] = useState(false);
    const [closing, setClosing] = useState(false);
    const [selectedStation, setSelectedStation] = useState(null);

    // ==========================================
    // OPEN ANIMATION
    // ==========================================

    useEffect(() => {
        const timer = setTimeout(() => {
            setVisible(true);
        }, 50);

        return () => clearTimeout(timer);
    }, []);

    // ==========================================
    // CLOSE WITH ANIMATION
    // ==========================================

    const handleClose = () => {
        if (closing) return;

        setClosing(true);

        setTimeout(() => {
            onClose();
        }, 450);
    };

    // ==========================================
    // STATION SELECT
    // ==========================================

    const handleStationSelect = (station) => {
        setSelectedStation(station);

        console.log(`Selected station: ${station}`);
    };

    return (
        <div
            className={`
                station-selector
                ${visible ? "station-selector-visible" : ""}
                ${closing ? "station-selector-closing" : ""}
            `}
        >

            {/* ==========================================
                BACKGROUND
            ========================================== */}

            <div className="station-selector-bg" />


            {/* ==========================================
                SCAN LINE
            ========================================== */}

            <div className="station-scan-line" />


            {/* ==========================================
                HEADER
            ========================================== */}

            <div className="station-selector-header">

                <div>
                    <div className="station-selector-kicker">
                        DHRUVNETRA / SYSTEM ACCESS
                    </div>

                    <h2>
                        SELECT RESEARCH STATION
                    </h2>
                </div>


                {/* ==========================================
                    CLOSE BUTTON
                ========================================== */}

                <button
                    type="button"
                    className="station-close"
                    onClick={handleClose}
                    aria-label="Close station selection"
                >
                    <span>×</span>
                </button>

            </div>


            {/* ==========================================
                MAIN CONTENT
            ========================================== */}

            <div className="station-selection-content">

                <p className="station-selection-description">
                    SELECT A STATION TO INITIALIZE ITS DIGITAL TWIN
                </p>


                {/* ==========================================
                    STATION CARDS
                ========================================== */}

                <div className="station-cards">

                    <StationCard
                        station="MAITRI"
                        location="SCHIRMACHER OASIS · EAST ANTARCTICA"
                        code="MT"
                        index="01"
                        description="INDIAN ANTARCTIC RESEARCH STATION"
                        selected={selectedStation === "MAITRI"}
                        onClick={() => handleStationSelect("MAITRI")}
                    />


                    <StationCard
                        station="BHARATI"
                        location="LARSEN ICE SHELF · EAST ANTARCTICA"
                        code="BH"
                        index="02"
                        description="INDIAN ANTARCTIC RESEARCH STATION"
                        selected={selectedStation === "BHARATI"}
                        onClick={() => handleStationSelect("BHARATI")}
                    />

                </div>

            </div>


            {/* ==========================================
                FOOTER
            ========================================== */}

            <div className="station-selector-footer">

                <span>
                    DIGITAL TWIN INITIALIZATION
                </span>

                <span>
                    SELECT STATION TO CONTINUE
                </span>

            </div>

        </div>
    );
}


/* =========================================================
   STATION CARD
========================================================= */

function StationCard({
    station,
    location,
    code,
    index,
    description,
    selected,
    onClick,
}) {
    return (
        <button
            type="button"
            className={`
                station-card
                ${selected ? "station-card-selected" : ""}
            `}
            onClick={onClick}
        >

            {/* INDEX */}

            <div className="station-card-index">
                {index}
            </div>


            {/* TOP */}

            <div className="station-card-top">

                <span>
                    DHRUVNETRA
                </span>

                <span>
                    DIGITAL TWIN
                </span>

            </div>


            {/* MAIN */}

            <div className="station-card-main">

                <div className="station-symbol">
                    {code}
                </div>


                <div>

                    <h3>
                        {station}
                    </h3>

                    <p className="station-location">
                        {location}
                    </p>

                    <p className="station-description">
                        {description}
                    </p>

                </div>

            </div>


            {/* BOTTOM */}

            <div className="station-card-bottom">

                <span>
                    INITIALIZE 3D MODEL
                </span>

                <span className="station-card-arrow">
                    →
                </span>

            </div>


            {/* CORNERS */}

            <span className="station-card-corner station-corner-tl" />
            <span className="station-card-corner station-corner-tr" />
            <span className="station-card-corner station-corner-bl" />
            <span className="station-card-corner station-corner-br" />

        </button>
    );
}


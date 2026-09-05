import { useEffect, useState } from "react";

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
        }, 50);

        return () => {
            clearTimeout(timer);
        };
    }, []);

    // ==========================================
    // CLOSE
    // ==========================================

    const handleClose = () => {
        if (closing || selecting) return;

        setClosing(true);

        setTimeout(() => {
            onClose?.();
        }, 450);
    };

    // ==========================================
    // STATION SELECT
    // ==========================================

    const handleStationSelect = (station) => {
        if (selecting || closing) return;

        console.log("STATION CLICKED:", station);

        setSelecting(true);
        setSelectedStation(station);

        // Selection animation
        setTimeout(() => {
            console.log(
                "SENDING STATION TO LANDING PAGE:",
                station
            );

            onSelectStation?.(station);
        }, 500);
    };

    return (
        <div
            className={`
                station-selector
                ${visible ? "station-selector-visible" : ""}
                ${closing ? "station-selector-closing" : ""}
                ${selecting ? "station-selector-selecting" : ""}
            `}
        >

            {/* ==========================================
                BACKGROUND
            ========================================== */}

            <div className="station-selector-bg" />

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


                <button
                    type="button"
                    className="station-close"
                    onClick={handleClose}
                    disabled={selecting}
                >
                    <span>×</span>
                </button>

            </div>


            {/* ==========================================
                CONTENT
            ========================================== */}

            <div className="station-selection-content">

                <p className="station-selection-description">
                    SELECT A STATION TO INITIALIZE ITS DIGITAL TWIN
                </p>


                <div className="station-cards">

                    {/* MAITRI */}

                    <StationCard
                        station="MAITRI"
                        location="SCHIRMACHER OASIS · EAST ANTARCTICA"
                        code="MT"
                        index="01"
                        description="INDIAN ANTARCTIC RESEARCH STATION"
                        selected={
                            selectedStation === "MAITRI"
                        }
                        disabled={selecting}
                        onClick={() =>
                            handleStationSelect("MAITRI")
                        }
                    />


                    {/* BHARATI */}

                    <StationCard
                        station="BHARATI"
                        location="LARSEN ICE SHELF · EAST ANTARCTICA"
                        code="BH"
                        index="02"
                        description="INDIAN ANTARCTIC RESEARCH STATION"
                        selected={
                            selectedStation === "BHARATI"
                        }
                        disabled={selecting}
                        onClick={() =>
                            handleStationSelect("BHARATI")
                        }
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
                    {selecting
                        ? "INITIALIZING STATION..."
                        : "SELECT STATION TO CONTINUE"
                    }
                </span>

            </div>

        </div>
    );
}


/* =====================================================
   STATION CARD
===================================================== */

function StationCard({
    station,
    location,
    code,
    index,
    description,
    selected,
    disabled,
    onClick,
}) {
    return (
        <button
            type="button"
            className={`
                station-card
                ${selected ? "station-card-selected" : ""}
                ${
                    disabled && !selected
                        ? "station-card-disabled"
                        : ""
                }
            `}
            onClick={onClick}
            disabled={disabled}
        >

            {/* ==========================================
                TOP
            ========================================== */}

            <div className="station-card-top">

                <span className="station-card-index">
                    {index}
                </span>

                <span className="station-status">

                    <i />

                    {selected
                        ? "INITIALIZING"
                        : "SYSTEM READY"
                    }

                </span>

            </div>


            {/* ==========================================
                MAIN
            ========================================== */}

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


            {/* ==========================================
                BOTTOM
            ========================================== */}

            <div className="station-card-bottom">

                <span>
                    {selected
                        ? "INITIALIZING DIGITAL TWIN"
                        : "INITIALIZE DIGITAL TWIN"
                    }
                </span>

                <span className="station-arrow">
                    →
                </span>

            </div>


            {/* ==========================================
                CORNERS
            ========================================== */}

            <span className="station-card-corner top-left" />
            <span className="station-card-corner top-right" />
            <span className="station-card-corner bottom-left" />
            <span className="station-card-corner bottom-right" />

        </button>
    );
}
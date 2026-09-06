import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useStation } from "../../context/StationContext";

import AntarcticaBackground from "./AntarcticaBackground";
import AtmosphericEffects from "./AtmosphericEffects";
import SnowOverlay from "./SnowOverlay";
import AtmosphereCanvas from "./AtmosphereCanvas";
import AuroraEffect from "./AuroraEffect";
import StationSelector from "./StationSelector";

export default function LandingPage() {
    const mouse = useRef({ x: 0, y: 0 });
    const navigatingRef = useRef(false);

    const navigate = useNavigate();
    const { isAuthenticated, setSelectedStation } = useAuth();
    const { setStation } = useStation();

    const [loaded, setLoaded] = useState(false);
    const [showStations, setShowStations] = useState(false);
    const [zooming, setZooming] = useState(false);

    // ==========================================
    // ENTER SYSTEM
    // ==========================================

    const handleEnterSystem = () => {
        if (zooming || showStations) return;

        setZooming(true);

        setTimeout(() => {
            setShowStations(true);
            setZooming(false);
        }, 1500);
    };

    // ==========================================
    // STATION SELECTED
    // ==========================================

    const handleStationSelect = (station) => {
        if (navigatingRef.current) return;

        navigatingRef.current = true;

        console.log("STATION SELECTED:", station);

        // Save selected station in auth & station contexts
        setSelectedStation(station);
        setStation(station);

        // Close selector
        setShowStations(false);
        setZooming(false);

        // If authenticated -> go to dashboard; else -> go to secure login portal
        if (isAuthenticated) {
            navigate("/dashboard/overview", {
                replace: true,
            });
        } else {
            navigate("/login", {
                replace: true,
                state: {
                    station,
                    from: { pathname: "/dashboard/overview" },
                },
            });
        }
    };

    // ==========================================
    // MOUSE MOVEMENT + ESCAPE
    // ==========================================

    useEffect(() => {
        let targetX = 0;
        let targetY = 0;

        let currentX = 0;
        let currentY = 0;

        let animationFrame;

        const handleMouseMove = (event) => {
            targetX =
                event.clientX / window.innerWidth - 0.5;

            targetY =
                event.clientY / window.innerHeight - 0.5;
        };

        const handleEscape = (event) => {
            if (event.key === "Escape") {
                setShowStations(false);
                setZooming(false);
            }
        };

        const animate = () => {
            currentX +=
                (targetX - currentX) * 0.035;

            currentY +=
                (targetY - currentY) * 0.035;

            mouse.current.x = currentX;
            mouse.current.y = currentY;

            animationFrame =
                requestAnimationFrame(animate);
        };

        window.addEventListener(
            "mousemove",
            handleMouseMove
        );

        window.addEventListener(
            "keydown",
            handleEscape
        );

        animationFrame =
            requestAnimationFrame(animate);

        const loadTimer = setTimeout(() => {
            setLoaded(true);
        }, 150);

        return () => {
            window.removeEventListener(
                "mousemove",
                handleMouseMove
            );

            window.removeEventListener(
                "keydown",
                handleEscape
            );

            cancelAnimationFrame(
                animationFrame
            );

            clearTimeout(loadTimer);
        };
    }, []);

    // ==========================================
    // CLOSE STATION SELECTOR
    // ==========================================

    const handleCloseStations = () => {
        if (navigatingRef.current) return;

        setShowStations(false);
        setZooming(false);
    };

    // ==========================================
    // UI
    // ==========================================

    return (
        <main
            className={`
                landing-page
                relative
                h-screen
                w-full
                overflow-hidden
                bg-[#020b12]
                text-white
                ${loaded ? "page-loaded" : ""}
                ${zooming ? "system-zooming" : ""}
            `}
        >

            {/* ==========================================
                BACKGROUND
            ========================================== */}

            <div className="cinematic-layer cinematic-background">
                <AntarcticaBackground
                    mouse={mouse}
                />
            </div>


            {/* ==========================================
                ATMOSPHERE
            ========================================== */}

            <div className="cinematic-layer cinematic-atmosphere">
                <AuroraEffect />

                <AtmosphericEffects
                    mouse={mouse}
                />
            </div>


            {/* ==========================================
                SNOW
            ========================================== */}

            <div className="cinematic-layer cinematic-snow">
                <SnowOverlay
                    mouse={mouse}
                />
            </div>


            {/* ==========================================
                FLOATING ICE
            ========================================== */}

            <div className="cinematic-layer cinematic-ice">
                <AtmosphereCanvas
                    mouse={mouse}
                />
            </div>


            {/* ==========================================
                TOP VIGNETTE
            ========================================== */}

            <div
                className="
                    pointer-events-none
                    absolute
                    inset-x-0
                    top-0
                    z-20
                    h-40
                    bg-gradient-to-b
                    from-[#01070d]/60
                    to-transparent
                "
            />


            {/* ==========================================
                BOTTOM VIGNETTE
            ========================================== */}

            <div
                className="
                    pointer-events-none
                    absolute
                    inset-x-0
                    bottom-0
                    z-20
                    h-56
                    bg-gradient-to-t
                    from-[#01070d]/80
                    to-transparent
                "
            />


            {/* ==========================================
                CENTER HERO CONTENT
            ========================================== */}

            <section
                className="
                    pointer-events-none
                    absolute
                    inset-0
                    z-30
                    flex
                    items-center
                    justify-center
                "
            >

                <div className="hero-content text-center">

                    {/* Eyebrow */}

                    <p className="hero-eyebrow">
                        The Eye of Polar Region
                    </p>


                    {/* Main Title */}

                    <h1 className="hero-title">
                        DHRUVNETRA
                    </h1>


                    {/* Divider */}

                    <div className="hero-line" />


                    {/* Subtitle */}

                    <p className="hero-subtitle">
                        AI-POWERED DIGITAL TWIN
                    </p>


                    {/* Description */}

                    <p className="hero-description">
                        REMOTE INTELLIGENCE · MISSION RELIABILITY · ANTARCTICA
                    </p>


                    {/* Enter System */}

                    <button
                        type="button"
                        className="
                            enter-system
                            pointer-events-auto
                        "
                        onClick={handleEnterSystem}
                        disabled={zooming || showStations}
                    >

                        <span className="enter-dot" />

                        <span>
                            ENTER SYSTEM
                        </span>

                        <span className="enter-arrow">
                            →
                        </span>

                    </button>

                </div>

            </section>


            {/* ==========================================
                HUD
            ========================================== */}

            <div className="z-40">
                <LandingHUD />
            </div>


            {/* ==========================================
                CINEMATIC INTRO OVERLAY
            ========================================== */}

            <div className="intro-overlay pointer-events-none" />


            {/* ==========================================
                STATION SELECTOR
            ========================================== */}

            {showStations && (
                <StationSelector
                    onClose={handleCloseStations}
                    onSelectStation={handleStationSelect}
                />
            )}

        </main>
    );
}


/* =========================================================
   HUD
========================================================= */

function LandingHUD() {
    return (
        <>
            {/* ==========================================
                TOP LEFT
            ========================================== */}

            <div className="hud hud-top-left">

                <div className="hud-brand">

                    <span className="hud-brand-mark">
                        D
                    </span>

                    <div>

                        <div className="hud-brand-title">
                            DHRUVNETRA
                        </div>

                        <div className="hud-brand-subtitle">
                            REMOTE INTELLIGENCE SYSTEM
                        </div>

                    </div>

                </div>

            </div>


            {/* ==========================================
                TOP RIGHT
            ========================================== */}

            <div className="hud hud-top-right">

                <div className="status-row">

                    <span className="status-indicator" />

                    <span>
                        SYSTEM ONLINE
                    </span>

                </div>

                <div className="hud-small">
                    ANTARCTIC NETWORK
                </div>

                <div className="hud-small">
                    LINK STATUS : STABLE
                </div>

            </div>


            {/* ==========================================
                BOTTOM LEFT
            ========================================== */}

            <div className="hud hud-bottom-left">

                <div className="coordinates">

                    <span>
                        LAT
                    </span>

                    <strong>
                        70° 46′ S
                    </strong>

                </div>


                <div className="coordinates">

                    <span>
                        LON
                    </span>

                    <strong>
                        11° 43′ E
                    </strong>

                </div>

            </div>


            {/* ==========================================
                BOTTOM RIGHT
            ========================================== */}

            <div className="hud hud-bottom-right">

                <div className="hud-small">
                    SATCOM
                </div>


                <div className="signal-bars">

                    <i />
                    <i />
                    <i />
                    <i />
                    <i />

                </div>


                <div className="hud-small">
                    SECURE LINK
                </div>

            </div>


            {/* ==========================================
                CORNER LINES
            ========================================== */}

            <div className="hud-corner corner-tl" />
            <div className="hud-corner corner-tr" />
            <div className="hud-corner corner-bl" />
            <div className="hud-corner corner-br" />

        </>
    );
}






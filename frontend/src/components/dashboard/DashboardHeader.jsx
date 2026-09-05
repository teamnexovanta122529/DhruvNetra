import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useStation } from "../../context/StationContext";

const pageNames = {
  overview: "OVERVIEW",
  "digital-twin": "3D DIGITAL TWIN",
  power: "POWER SYSTEMS",
  fuel: "FUEL SYSTEMS",
  hvac: "HVAC SYSTEMS",
  water: "WATER SYSTEMS",
  environment: "ENVIRONMENT",
  logistics: "LOGISTICS",
  alerts: "ALERTS",
  "what-if": "WHAT-IF ANALYSIS",
  government: "GOVERNMENT COMMAND",
  reports: "REPORTS",
};

export default function DashboardHeader({ sidebarCollapsed, onToggleSidebar }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { station, setStation, stationInfo, availableStations, stationData } = useStation();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // UTC Time clock
  const [utcTime, setUtcTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = String(now.getUTCHours()).padStart(2, "0");
      const minutes = String(now.getUTCMinutes()).padStart(2, "0");
      const seconds = String(now.getUTCSeconds()).padStart(2, "0");
      setUtcTime(`${hours}:${minutes}:${seconds} UTC`);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const currentPage =
    location.pathname.replace(/\/$/, "").split("/").pop();

  const pageTitle =
    pageNames[currentPage] || "DASHBOARD";

  const handleSelectStation = (stName) => {
    setStation(stName);
    setDropdownOpen(false);
  };

  const handleBackToLanding = () => {
    navigate("/");
  };

  return (
    <header className="dashboard-header">

      {/* =========================================
          LEFT: SIDEBAR TOGGLE & BRAND
      ========================================= */}
      <div className="dashboard-header-left">

        <button
          type="button"
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          title={sidebarCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          ☰
        </button>

        <Link
          to="/"
          className="header-logo"
          style={{ textDecoration: "none", color: "inherit", cursor: "pointer" }}
          title="Return to Landing Page"
        >
          DHRUVNETRA
        </Link>

        <div className="header-divider" />

        <div className="header-context">
          AI-POWERED DIGITAL TWIN
        </div>

      </div>


      {/* =========================================
          CENTER: STATION SWITCHER & PAGE TITLE
      ========================================= */}
      <div className="dashboard-header-center">

        <div className="station-switcher-container" ref={dropdownRef}>

          <button
            type="button"
            className={`station-switcher-btn ${dropdownOpen ? "open" : ""}`}
            onClick={() => setDropdownOpen((prev) => !prev)}
            title="Switch Antarctic Research Station"
          >
            <span className="status-dot" />
            <span className="station-pill-code">
              {stationInfo?.code || "MT"}
            </span>
            <span className="station-switcher-name">
              {station} STATION
            </span>
            <span className="station-switcher-chevron">
              ▼
            </span>
          </button>

          {/* DROPDOWN MENU */}
          {dropdownOpen && (
            <div className="station-switcher-dropdown">

              <div className="station-dropdown-header">
                SELECT RESEARCH STATION
              </div>

              {availableStations.map((stKey) => {
                const info = stationData[stKey];
                const isActive = station === stKey;

                return (
                  <button
                    key={stKey}
                    type="button"
                    className={`station-dropdown-item ${isActive ? "active" : ""}`}
                    onClick={() => handleSelectStation(stKey)}
                  >
                    <div className="station-item-left">
                      <span className="station-item-code">
                        {info.code}
                      </span>
                      <div>
                        <div className="station-item-title">
                          {info.name} STATION
                        </div>
                        <div className="station-item-loc">
                          {info.location}
                        </div>
                      </div>
                    </div>

                    <div className="station-item-badge">
                      <span className="status-dot" style={{ width: 5, height: 5 }} />
                      {isActive ? "ACTIVE" : "ONLINE"}
                    </div>
                  </button>
                );
              })}

            </div>
          )}

        </div>

        <div className="current-page">
          {pageTitle}
        </div>

      </div>


      {/* =========================================
          RIGHT: STATUS, CLOCK & BACK TO LANDING
      ========================================= */}
      <div className="dashboard-header-right">

        <div className="header-status">
          <span className="status-dot" />
          <div>
            <strong>STATION ONLINE</strong>
            <small>SATCOM {stationInfo?.satcom || "CONNECTED"}</small>
          </div>
        </div>

        <div className="header-sync">
          <span>LIVE TELEMETRY</span>
          <strong>{utcTime || "02:14:36 UTC"}</strong>
        </div>

        <button
          className="header-notification"
          type="button"
          title="Active Alerts"
          onClick={() => navigate("/dashboard/alerts")}
        >
          !
          <span className="notification-badge">
            3
          </span>
        </button>

        {/* BACK TO LANDING PAGE BUTTON */}
        <button
          type="button"
          className="header-back-btn"
          onClick={handleBackToLanding}
          title="Return to Landing Page"
        >
          <span className="btn-arrow">←</span>
          <span>LANDING PAGE</span>
        </button>

      </div>

    </header>
  );
}
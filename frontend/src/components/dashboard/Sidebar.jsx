import { NavLink, useNavigate } from "react-router-dom";
import { useStation } from "../../context/StationContext";

const navigationSections = [
  {
    title: "MAIN",
    items: [
      { path: "/dashboard/overview", label: "Overview", icon: "⌘", badge: null },
      { path: "/dashboard/digital-twin", label: "3D Digital Twin", icon: "◇", badge: "3D" },
    ],
  },
  {
    title: "MONITORING",
    items: [
      { path: "/dashboard/power", label: "Power Systems", icon: "ϟ", badge: null },
      { path: "/dashboard/fuel", label: "Fuel Systems", icon: "◉", badge: null },
      { path: "/dashboard/hvac", label: "HVAC Systems", icon: "✣", badge: null },
      { path: "/dashboard/water", label: "Water Systems", icon: "◌", badge: null },
      { path: "/dashboard/environment", label: "Environment", icon: "△", badge: null },
    ],
  },
  {
    title: "OPERATIONS",
    items: [
      { path: "/dashboard/logistics", label: "Logistics", icon: "▣", badge: null },
      { path: "/dashboard/alerts", label: "Alerts", icon: "!", badge: "3", alert: true },
      { path: "/dashboard/what-if", label: "What-If Analysis", icon: "⌁", badge: null },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { path: "/dashboard/government", label: "Government Command", icon: "⛨", badge: null },
      { path: "/dashboard/reports", label: "Reports", icon: "▤", badge: null },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, onItemClick }) {
  const navigate = useNavigate();
  const { station, stationInfo } = useStation();

  const handleNavClick = () => {
    if (onItemClick) {
      onItemClick();
    }
  };

  const handleBackToLanding = () => {
    if (onItemClick) {
      onItemClick();
    }
    navigate("/");
  };

  return (
    <aside className={`dashboard-sidebar ${collapsed ? "is-collapsed" : ""}`}>

      {/* =========================================
          SIDEBAR HEADER & BRANDING
      ========================================= */}
      <div className="sidebar-header">

        <div className="sidebar-header-left">
          <div className="sidebar-brand-mark">
            <span>◈</span>
          </div>

          {!collapsed && (
            <div className="sidebar-brand-text">
              <div className="sidebar-brand-title">
                DHRUVNETRA
              </div>
              <div className="sidebar-brand-subtitle">
                Antarctic Digital Twin
              </div>
            </div>
          )}
        </div>

        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={onToggle}
          title={collapsed ? "Expand Sidebar (»)" : "Collapse Sidebar («)"}
          data-cursor="pointer"
        >
          <span>{collapsed ? "»" : "«"}</span>
        </button>

      </div>


      {/* =========================================
          NAVIGATION SECTIONS
      ========================================= */}
      <div className="sidebar-navigation">

        {navigationSections.map((section) => (
          <div key={section.title} className="sidebar-section">

            {!collapsed && (
              <div className="sidebar-section-header">
                <span>{section.title}</span>
                <div className="sidebar-section-line" />
              </div>
            )}

            <nav className="dashboard-nav">
              {section.items.map((item) => (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={handleNavClick}
                  className={({ isActive }) =>
                    `dashboard-nav-item ${isActive ? "active" : ""}`
                  }
                  title={collapsed ? `${section.title} / ${item.label}` : undefined}
                  data-cursor="pointer"
                >
                  <span className="nav-icon">{item.icon}</span>

                  {!collapsed && (
                    <span className="nav-label">{item.label}</span>
                  )}

                  {!collapsed && item.badge && (
                    <span className={`nav-badge ${item.alert ? "alert" : ""}`}>
                      {item.badge}
                    </span>
                  )}
                </NavLink>
              ))}
            </nav>

          </div>
        ))}

      </div>


      {/* =========================================
          SIDEBAR FOOTER & CONTROLS
      ========================================= */}
      <div className="sidebar-footer">

        {/* ACTIVE STATION CARD */}
        {!collapsed ? (
          <div className="sidebar-station-card">
            <div className="sidebar-station-top">
              <div className="sidebar-station-indicator">
                <span className="station-dot-pulse" />
                <span className="station-indicator-text">STATION ONLINE</span>
              </div>
              <span className="sidebar-station-code">
                {stationInfo?.code || "MT"}
              </span>
            </div>

            <div className="sidebar-station-name">
              {station} STATION
            </div>

            <div className="sidebar-station-coords">
              {stationInfo?.coordinates || "SCHIRMACHER OASIS"}
            </div>
          </div>
        ) : (
          <div
            className="sidebar-station-collapsed"
            title={`${station} Station · Online (${stationInfo?.coordinates || ""})`}
          >
            <span className="station-dot-pulse" />
            <span>{stationInfo?.code || "MT"}</span>
          </div>
        )}

        {/* BACK TO LANDING PAGE BUTTON */}
        <button
          type="button"
          className="sidebar-landing-btn"
          onClick={handleBackToLanding}
          title="Return to Landing Page (/)"
          data-cursor="pointer"
        >
          <span className="landing-btn-icon">←</span>
          {!collapsed && <span>LANDING PAGE</span>}
        </button>

        {/* PROJECT METADATA */}
        {!collapsed && (
          <div className="sidebar-meta-block">
            <div className="sidebar-meta-title">SIH 2026 · NEXOVANTA</div>
            <div className="sidebar-meta-status">
              <span>SATCOM ENCRYPTED</span>
              <strong>UTC LINK ACTIVE</strong>
            </div>
          </div>
        )}

      </div>

    </aside>
  );
}
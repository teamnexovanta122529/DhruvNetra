import { NavLink, useNavigate } from "react-router-dom";
import { useStation } from "../../context/StationContext";
import { useAuth } from "../../context/AuthContext";
import { ADMIN_ONLY_ROUTES } from "../../data/authData";

const rawNavigationSections = [
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
      { path: "/dashboard/what-if", label: "What-If Analysis", icon: "⌁", badge: null, adminOnly: true },
    ],
  },
  {
    title: "ADMINISTRATION",
    items: [
      { path: "/dashboard/government", label: "Government Command", icon: "⛨", badge: null, adminOnly: true },
      { path: "/dashboard/reports", label: "Reports", icon: "▤", badge: null, adminOnly: true },
    ],
  },
];

export default function Sidebar({ collapsed, onToggle, onItemClick }) {
  const navigate = useNavigate();
  const { station, stationInfo } = useStation();
  const { user, role, isAdmin } = useAuth();

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

  // Filter sections and items based on role
  const filteredSections = rawNavigationSections
    .map((section) => {
      const allowedItems = section.items.filter((item) => {
        if (item.adminOnly || ADMIN_ONLY_ROUTES.includes(item.path)) {
          return isAdmin;
        }
        return true;
      });

      return {
        ...section,
        items: allowedItems,
      };
    })
    .filter((section) => section.items.length > 0);

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
          NAVIGATION SECTIONS (FILTERED BY ROLE)
      ========================================= */}
      <div className="sidebar-navigation">

        {filteredSections.map((section) => (
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

            {/* Role & User Badge in Card */}
            {user && (
              <div
                style={{
                  marginTop: "0.5rem",
                  paddingTop: "0.4rem",
                  borderTop: "1px solid rgba(107, 226, 242, 0.12)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  fontSize: "0.65rem",
                  fontFamily: "monospace",
                }}
              >
                <span style={{ color: "#6be2f2" }}>USER: {user.username}</span>
                <span
                  style={{
                    color: isAdmin ? "#ffb84d" : "#00f0ff",
                    fontWeight: 700,
                  }}
                >
                  [{role}]
                </span>
              </div>
            )}
          </div>
        ) : (
          <div
            className="sidebar-station-collapsed"
            title={`${station} Station · Online (${stationInfo?.coordinates || ""}) · User: ${user?.username || ""} [${role || ""}]`}
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
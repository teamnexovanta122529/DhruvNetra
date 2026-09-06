import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useStation } from "../../context/StationContext";
import "./Auth.css";

export default function AccessDenied({
  type = "station", // "station" | "role"
  requiredRole = "ADMIN",
  deniedStation = null,
  customReason = null,
}) {
  const navigate = useNavigate();
  const { user, role, authorizedStations, setSelectedStation } = useAuth();
  const { station, setStation } = useStation();

  const activeStation = deniedStation || station;
  const isStationDenial = type === "station";

  // If user has an authorized station, get the first one for quick switch
  const firstAuthorizedStation =
    authorizedStations.length > 0 ? authorizedStations[0] : "MAITRI";

  const handleReturnToDashboard = () => {
    // If current station is unauthorized, switch to the user's authorized station first
    if (authorizedStations.length > 0 && !authorizedStations.includes(station)) {
      setSelectedStation(firstAuthorizedStation);
      setStation(firstAuthorizedStation);
    }
    navigate("/dashboard/overview", { replace: true });
  };

  const handleSwitchToAuthorized = () => {
    setSelectedStation(firstAuthorizedStation);
    setStation(firstAuthorizedStation);
    navigate("/dashboard/overview", { replace: true });
  };

  const handleReturnToStationSelection = () => {
    navigate("/", { replace: true });
  };

  return (
    <div className="access-denied-container">
      <div className="access-denied-card" role="alert" aria-live="assertive">
        {/* Corner Precision Brackets */}
        <span className="auth-bracket tl" />
        <span className="auth-bracket tr" />
        <span className="auth-bracket bl" />
        <span className="auth-bracket br" />

        <div className="denied-icon-wrap">
          <span>🔒</span>
        </div>

        <div className="denied-kicker">
          {isStationDenial
            ? "STATION AUTHORIZATION FAULT"
            : "RESTRICTED ACCESS LEVEL"}
        </div>

        <h1 className="denied-title">
          {isStationDenial ? "ACCESS DENIED" : "RESTRICTED MODULE"}
        </h1>

        <p className="denied-description">
          {customReason ||
            (isStationDenial
              ? `Your account does not have clearance to access ${activeStation} Research Station telemetry and controls.`
              : "This operational module requires Administrator clearance level (LEVEL-4 POLAR COMMAND).")}
        </p>

        {/* Technical Dossier Grid */}
        <div className="denied-meta-grid">
          {isStationDenial ? (
            <>
              <div className="denied-meta-item">
                <span className="denied-meta-label">TARGET STATION</span>
                <span className="denied-meta-value highlight-red">
                  {activeStation} STATION
                </span>
              </div>

              <div className="denied-meta-item">
                <span className="denied-meta-label">AUTHORIZED STATIONS</span>
                <span className="denied-meta-value highlight-cyan">
                  {authorizedStations.length > 0
                    ? authorizedStations.join(", ")
                    : "NONE"}
                </span>
              </div>

              <div className="denied-meta-item">
                <span className="denied-meta-label">CURRENT USER</span>
                <span className="denied-meta-value">
                  {user?.username || "UNAUTHENTICATED"}
                </span>
              </div>

              <div className="denied-meta-item">
                <span className="denied-meta-label">SECURITY CLEARANCE</span>
                <span className="denied-meta-value">
                  {user?.clearance || role || "OPERATOR"}
                </span>
              </div>
            </>
          ) : (
            <>
              <div className="denied-meta-item">
                <span className="denied-meta-label">REQUIRED ROLE</span>
                <span className="denied-meta-value highlight-red">
                  {requiredRole}
                </span>
              </div>

              <div className="denied-meta-item">
                <span className="denied-meta-label">CURRENT ROLE</span>
                <span className="denied-meta-value highlight-cyan">
                  {role || "OPERATOR"}
                </span>
              </div>

              <div className="denied-meta-item">
                <span className="denied-meta-label">ACTIVE STATION</span>
                <span className="denied-meta-value">
                  {station} NODE
                </span>
              </div>

              <div className="denied-meta-item">
                <span className="denied-meta-label">DIRECTIVE AUDIT</span>
                <span className="denied-meta-value">
                  UNAUTHORIZED ACCESS LOGGED
                </span>
              </div>
            </>
          )}
        </div>

        {/* Action Buttons */}
        <div className="denied-actions">
          {isStationDenial ? (
            <>
              {authorizedStations.length > 0 &&
                authorizedStations[0] !== activeStation && (
                  <button
                    type="button"
                    className="denied-primary-btn"
                    onClick={handleSwitchToAuthorized}
                  >
                    Switch to {firstAuthorizedStation} Station →
                  </button>
                )}

              <button
                type="button"
                className="denied-secondary-btn"
                onClick={handleReturnToStationSelection}
              >
                Return to Station Selection
              </button>
            </>
          ) : (
            <button
              type="button"
              className="denied-primary-btn"
              onClick={handleReturnToDashboard}
            >
              Return to Dashboard
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

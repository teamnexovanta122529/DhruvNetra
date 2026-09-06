import { useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useStation } from "../../context/StationContext";
import AntarcticaBackground from "../landing/AntarcticaBackground";
import AtmosphericEffects from "../landing/AtmosphericEffects";
import SnowOverlay from "../landing/SnowOverlay";
import "./Auth.css";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, selectedStation, setSelectedStation, authError, clearAuthError, isLoading } =
    useAuth();
  const { setStation } = useStation();

  // Target redirect path (if user was redirected here from a protected route)
  const fromLocation = location.state?.from?.pathname || "/dashboard/overview";

  // Initial station from location state or active context
  const currentStation = location.state?.station || selectedStation || "MAITRI";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [activeStation, setActiveStation] = useState(currentStation);
  const [localError, setLocalError] = useState("");

  const handleSubmit = async (e) => {
    e?.preventDefault();
    setLocalError("");
    clearAuthError();

    if (!username.trim()) {
      setLocalError("Please enter your mission username or email.");
      return;
    }
    if (!password.trim()) {
      setLocalError("Please enter your security access password.");
      return;
    }

    const result = await login(username, password, activeStation);

    if (result.success) {
      setStation(activeStation);
      navigate(fromLocation, { replace: true });
    }
  };

  const handleQuickFill = (u, p, st) => {
    setUsername(u);
    setPassword(p);
    if (st) {
      setActiveStation(st);
      setSelectedStation(st);
      setStation(st);
    }
    setLocalError("");
    clearAuthError();
  };

  const handleBackToStationSelect = () => {
    navigate("/", { replace: true });
  };

  const errorMessage = localError || authError;

  return (
    <main className="auth-page">
      {/* Cinematic Background Atmosphere */}
      <div className="auth-bg-overlay" />
      <div className="auth-scanlines" />

      {/* Subtle Background Canvas Elements */}
      <div
        className="cinematic-layer cinematic-background"
        style={{ opacity: 0.45, position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <AntarcticaBackground mouse={{ current: { x: 0, y: 0 } }} />
      </div>
      <div
        className="cinematic-layer cinematic-snow"
        style={{ opacity: 0.35, position: "absolute", inset: 0, pointerEvents: "none" }}
      >
        <SnowOverlay mouse={{ current: { x: 0, y: 0 } }} />
      </div>

      <div className="auth-container">
        {/* Precision Corner Brackets */}
        <span className="auth-bracket tl" />
        <span className="auth-bracket tr" />
        <span className="auth-bracket bl" />
        <span className="auth-bracket br" />

        {/* Portal Header */}
        <header className="auth-header">
          <div className="auth-kicker">
            <span className="auth-badge-dot" />
            <span>NCPOR · POLAR TELEMETRY GATEWAY</span>
          </div>
          <h1 className="auth-title">DHRUVNETRA SECURE ACCESS</h1>
          <p className="auth-subtitle">
            Indian Antarctic Research Station Telemetry & Management Portal
          </p>
        </header>

        {/* Station Target Banner */}
        <section className="auth-station-banner" aria-label="Selected Station">
          <div className="station-banner-left">
            <span className="station-banner-label">TARGET RESEARCH STATION</span>
            <span className="station-banner-name">{activeStation} STATION</span>
          </div>
          <span className="station-banner-pill">
            {activeStation === "MAITRI" ? "SECTOR 70°S" : "SECTOR 69°S"}
          </span>
        </section>

        {/* Error State Banner */}
        {errorMessage && (
          <div className="auth-error-alert" role="alert" style={{ marginBottom: "1.25rem" }}>
            <span className="error-icon">⚠</span>
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-form-group">
            <label className="auth-label" htmlFor="auth-username">
              Username or Official Email
            </label>
            <div className="auth-input-wrapper">
              <input
                id="auth-username"
                type="text"
                className="auth-input"
                placeholder="e.g. admin or operator"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setLocalError("");
                }}
                disabled={isLoading}
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="auth-form-group">
            <label className="auth-label" htmlFor="auth-password">
              Security Access Key / Password
            </label>
            <div className="auth-input-wrapper">
              <input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                className="auth-input auth-input-password"
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setLocalError("");
                }}
                disabled={isLoading}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="auth-toggle-pwd"
                onClick={() => setShowPassword((prev) => !prev)}
                title={showPassword ? "Hide password" : "Show password"}
                tabIndex={-1}
              >
                {showPassword ? "HIDE" : "SHOW"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={isLoading}
            data-cursor="pointer"
          >
            {isLoading ? (
              <>
                <span className="auth-spinner" />
                <span>AUTHENTICATING SECURE SESSION...</span>
              </>
            ) : (
              <span>AUTHENTICATE & CONTINUE →</span>
            )}
          </button>

          <button
            type="button"
            className="auth-back-btn"
            onClick={handleBackToStationSelect}
            disabled={isLoading}
          >
            ← Back to Station Selection
          </button>
        </form>

        {/* Demo Quick-Fill Credentials */}
        <footer className="auth-demo-shortcuts">
          <div className="demo-title">TEST CREDENTIALS (CLICK TO FILL)</div>
          <div className="demo-chips">
            <button
              type="button"
              className="demo-chip-btn"
              onClick={() => handleQuickFill("admin", "admin123", activeStation)}
              title="Full system access across all stations and admin modules"
            >
              <span className="chip-role">ADMIN:</span>
              <span className="chip-creds">admin / admin123</span>
              <span className="chip-stations">MAITRI & BHARATI</span>
            </button>

            <button
              type="button"
              className="demo-chip-btn"
              onClick={() => handleQuickFill("operator", "operator123", "BHARATI")}
              title="Telemetry monitoring access for Bharati station"
            >
              <span className="chip-role">OPERATOR:</span>
              <span className="chip-creds">operator / operator123</span>
              <span className="chip-stations">BHARATI ONLY</span>
            </button>

            <button
              type="button"
              className="demo-chip-btn"
              onClick={() => handleQuickFill("maitri.operator", "maitri123", "MAITRI")}
              title="Telemetry monitoring access for Maitri station"
            >
              <span className="chip-role">MAITRI OPERATOR:</span>
              <span className="chip-creds">maitri.operator / maitri123</span>
              <span className="chip-stations">MAITRI ONLY</span>
            </button>
          </div>
        </footer>
      </div>
    </main>
  );
}

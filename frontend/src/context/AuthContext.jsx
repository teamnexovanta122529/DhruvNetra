import { createContext, useContext, useEffect, useState } from "react";
import {
  ROLES,
  mockAuthenticate,
  isUserAuthorizedForStation,
  isRoleAuthorizedForRoute,
} from "../data/authData";

const AuthContext = createContext(null);

const STORAGE_KEY_USER = "dhruvnetra_user";
const STORAGE_KEY_STATION = "selectedStation";

export function AuthProvider({ children }) {
  // Initialize user from sessionStorage
  const [user, setUser] = useState(() => {
    try {
      const savedUser = sessionStorage.getItem(STORAGE_KEY_USER);
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  // Initialize selected station from sessionStorage or default to MAITRI
  const [selectedStation, setSelectedStationState] = useState(() => {
    return sessionStorage.getItem(STORAGE_KEY_STATION) || "MAITRI";
  });

  const [isLoading, setIsLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Sync selectedStation to sessionStorage
  const setSelectedStation = (newStation) => {
    const validStation = newStation === "BHARATI" ? "BHARATI" : "MAITRI";
    setSelectedStationState(validStation);
    sessionStorage.setItem(STORAGE_KEY_STATION, validStation);
    window.dispatchEvent(new CustomEvent("dhruvnetra_station_change", { detail: validStation }));
  };

  // Login handler
  const login = async (username, password, targetStation = null) => {
    setIsLoading(true);
    setAuthError(null);

    try {
      const authenticatedUser = await mockAuthenticate(username, password);
      setUser(authenticatedUser);
      sessionStorage.setItem(STORAGE_KEY_USER, JSON.stringify(authenticatedUser));

      // If a target station is specified, set it
      if (targetStation) {
        setSelectedStation(targetStation);
      } else if (authenticatedUser.stations?.length > 0) {
        // Default to first authorized station if none selected
        if (!authenticatedUser.stations.includes(selectedStation)) {
          setSelectedStation(authenticatedUser.stations[0]);
        }
      }

      setIsLoading(false);
      return { success: true, user: authenticatedUser };
    } catch (err) {
      setIsLoading(false);
      const message = err?.message || "Authentication failed.";
      setAuthError(message);
      return { success: false, error: message };
    }
  };

  // Logout handler
  const logout = () => {
    setUser(null);
    setAuthError(null);
    sessionStorage.removeItem(STORAGE_KEY_USER);
    sessionStorage.removeItem(STORAGE_KEY_STATION);
    setSelectedStationState("MAITRI");
    window.dispatchEvent(new CustomEvent("dhruvnetra_station_change", { detail: "MAITRI" }));
  };

  // Clear any active auth error
  const clearAuthError = () => {
    setAuthError(null);
  };

  // Check if current user is authorized for a given station
  const isStationAuthorized = (stationName = selectedStation) => {
    return isUserAuthorizedForStation(user, stationName);
  };

  // Check if current user is authorized for a given route
  const isRouteAuthorized = (routePath) => {
    if (!user) return false;
    return isRoleAuthorizedForRoute(user.role, routePath);
  };

  // Listen for storage and local events
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === STORAGE_KEY_USER) {
        try {
          setUser(e.newValue ? JSON.parse(e.newValue) : null);
        } catch {
          setUser(null);
        }
      }
      if (e.key === STORAGE_KEY_STATION && e.newValue) {
        setSelectedStationState(e.newValue);
      }
    };

    const handleLocalStationChange = (e) => {
      if (e.detail) {
        setSelectedStationState(e.detail);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("dhruvnetra_station_change", handleLocalStationChange);
    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("dhruvnetra_station_change", handleLocalStationChange);
    };
  }, []);

  const value = {
    user,
    role: user?.role || null,
    isAdmin: user?.role === ROLES.ADMIN,
    isOperator: user?.role === ROLES.OPERATOR,
    authorizedStations: user?.stations || [],
    selectedStation,
    setSelectedStation,
    isAuthenticated: Boolean(user),
    isLoading,
    authError,
    login,
    logout,
    clearAuthError,
    isStationAuthorized,
    isRouteAuthorized,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

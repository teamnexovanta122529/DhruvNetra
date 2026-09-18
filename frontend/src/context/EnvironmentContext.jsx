/**
 * DHRUVNETRA - Environment Context & Live State Provider
 * SIH 2026: Antarctic Digital Twin Platform (Maitri & Bharati)
 * Centralized Real-Time Meteorological Polling, Caching, and Transparency State
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { useStation } from "./StationContext";
import { fetchStationEnvironment, fetchAllStationsEnvironment } from "../services/environmentApi";

const EnvironmentContext = createContext(null);

export function EnvironmentProvider({ children }) {
  const { station } = useStation();
  
  // Environment data state keyed by station: { MAITRI: {...}, BHARATI: {...} }
  const [stationDataMap, setStationDataMap] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastFetchedAt, setLastFetchedAt] = useState(null);
  const [timeSinceUpdate, setTimeSinceUpdate] = useState("Just now");

  // Keep ref of active station to avoid stale closures in timers
  const activeStationRef = useRef(station);
  useEffect(() => {
    activeStationRef.current = station;
  }, [station]);

  /**
   * Format elapsed time into human-readable label
   */
  const updateRelativeTime = useCallback(() => {
    if (!lastFetchedAt) {
      setTimeSinceUpdate("Syncing...");
      return;
    }
    const now = Date.now();
    const elapsedSec = Math.floor((now - lastFetchedAt.getTime()) / 1000);
    
    if (elapsedSec < 10) {
      setTimeSinceUpdate("Updated just now");
    } else if (elapsedSec < 60) {
      setTimeSinceUpdate(`Updated ${elapsedSec}s ago`);
    } else {
      const elapsedMin = Math.floor(elapsedSec / 60);
      setTimeSinceUpdate(`Updated ${elapsedMin}m ago`);
    }
  }, [lastFetchedAt]);

  /**
   * Fetch live environment data for stations
   */
  const loadEnvironmentData = useCallback(async (isManualRefresh = false) => {
    if (isManualRefresh) {
      setIsRefreshing(true);
    }

    try {
      // Fetch both stations so tab switching is instantaneous
      const allStationsResp = await fetchAllStationsEnvironment(isManualRefresh);
      if (allStationsResp && allStationsResp.stations) {
        setStationDataMap(allStationsResp.stations);
        setError(null);
        setLastFetchedAt(new Date());
      }
    } catch (err) {
      console.warn("Failed to fetch batch environment, falling back to single station fetch:", err);
      // Fallback to active station single fetch
      try {
        const singleResp = await fetchStationEnvironment(activeStationRef.current, isManualRefresh);
        if (singleResp && singleResp.success) {
          const stKey = (singleResp.station || activeStationRef.current).toUpperCase();
          setStationDataMap((prev) => ({
            ...prev,
            [stKey]: singleResp,
          }));
          setError(null);
          setLastFetchedAt(new Date());
        }
      } catch (singleErr) {
        console.error("Environment fetch failed entirely:", singleErr);
        setError(singleErr.message || "Environment telemetry temporarily unavailable");
      }
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Initial Fetch & Station change effect
  useEffect(() => {
    loadEnvironmentData(false);
  }, [loadEnvironmentData, station]);

  // Polling Interval: Refresh every 60 seconds
  useEffect(() => {
    const pollInterval = setInterval(() => {
      loadEnvironmentData(false);
    }, 60000);

    return () => clearInterval(pollInterval);
  }, [loadEnvironmentData]);

  // Relative time counter interval: Update every 5 seconds
  useEffect(() => {
    updateRelativeTime();
    const timeInterval = setInterval(updateRelativeTime, 5000);
    return () => clearInterval(timeInterval);
  }, [updateRelativeTime]);

  // Current active station environment object
  const currentKey = (station || "MAITRI").toUpperCase();
  const currentEnvironment = stationDataMap[currentKey] || null;

  const value = {
    environment: currentEnvironment,
    allStationsEnvironment: stationDataMap,
    isLoading: isLoading && !currentEnvironment,
    isRefreshing,
    error,
    isUnavailable: Boolean(error && !currentEnvironment),
    lastFetchedAt,
    timeSinceUpdate,
    refreshEnvironment: () => loadEnvironmentData(true),
  };

  return (
    <EnvironmentContext.Provider value={value}>
      {children}
    </EnvironmentContext.Provider>
  );
}

export function useEnvironment() {
  const context = useContext(EnvironmentContext);
  if (!context) {
    throw new Error("useEnvironment must be used within an EnvironmentProvider");
  }
  return context;
}

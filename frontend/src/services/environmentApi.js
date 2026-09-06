/**
 * DHRUVNETRA - Environment Service Frontend API Client
 * SIH 2026: Antarctic Digital Twin Platform (Maitri & Bharati)
 * Fetches real-time polar meteorological observations from FastAPI backend
 */

const API_BASE = "/api/environment";

/**
 * Fetch live normalized environment data for a specific station.
 * @param {string} station - Station name ('MAITRI' or 'BHARATI')
 * @param {boolean} forceRefresh - Whether to bypass backend cache
 * @returns {Promise<object>} Normalized EnvironmentResponse
 */
export async function fetchStationEnvironment(station = "MAITRI", forceRefresh = false) {
  const stationParam = encodeURIComponent(station.toLowerCase());
  const url = `${API_BASE}/${stationParam}${forceRefresh ? "?force_refresh=true" : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    let errorDetail = "Failed to fetch Antarctic environment data";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.error || errorDetail;
    } catch {
      errorDetail = `Server returned status ${response.status}`;
    }
    throw new Error(errorDetail);
  }

  return await response.json();
}

/**
 * Fetch live environment data for all supported Antarctic stations simultaneously.
 * @param {boolean} forceRefresh - Whether to bypass backend cache
 * @returns {Promise<object>} AllStationsEnvironmentResponse
 */
export async function fetchAllStationsEnvironment(forceRefresh = false) {
  const url = `${API_BASE}${forceRefresh ? "?force_refresh=true" : ""}`;

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    let errorDetail = "Failed to fetch all stations environment";
    try {
      const errJson = await response.json();
      errorDetail = errJson.detail || errJson.error || errorDetail;
    } catch {
      errorDetail = `Server returned status ${response.status}`;
    }
    throw new Error(errorDetail);
  }

  return await response.json();
}

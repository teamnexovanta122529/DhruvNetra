/**
 * DHRUVNETRA - Polar Environment Reference & Station Canonical Metadata
 * SIH 2026: Antarctic Digital Twin Platform (Maitri & Bharati)
 * 
 * NOTE: Current live meteorological observations are fetched dynamically in real-time
 * from the FastAPI backend service (/api/environment/{station}).
 * This file provides canonical station geography and reference operational thresholds.
 */

export const stationCoordinates = {
  MAITRI: {
    name: "Maitri",
    code: "MT",
    region: "Schirmacher Oasis, Queen Maud Land, East Antarctica",
    latitude: -70.7661,
    longitude: 11.7358,
    elevationM: 117,
    coordinatesDisplay: "70°45′58″ S · 11°44′09″ E",
    established: 1989,
    climateZone: "Polar Coastal / Ice-Free Oasis",
  },
  BHARATI: {
    name: "Bharati",
    code: "BH",
    region: "Larsemann Hills, Princess Elizabeth Land, East Antarctica",
    latitude: -69.4078,
    longitude: 76.1872,
    elevationM: 35,
    coordinatesDisplay: "69°24′28″ S · 76°11′14″ E",
    established: 2012,
    climateZone: "Polar Maritime Coastal",
  },
};

export const polarThresholds = {
  temperature: {
    extremeColdCriticalC: -35.0,
    severeColdWarningC: -25.0,
    coldWatchC: -15.0,
    nominalC: 0.0,
  },
  windSpeedMs: {
    hurricaneForceCriticalMs: 32.7,
    stormForceWarningMs: 24.5,
    galeWatchMs: 17.2,
    moderateMs: 10.8,
  },
  windChillC: {
    extremeDangerCriticalC: -45.0,
    severeDangerWarningC: -35.0,
    cautionWatchC: -25.0,
  },
};

export const dataProvenance = {
  provider: "Open-Meteo Polar Weather API",
  numericalModels: "ECMWF IFS / DWD ICON / NOAA GFS Ensemble",
  telemetryMode: "EXTERNAL_NUMERICAL_WEATHER_MODEL",
  stationSensorsStatus: "PENDING_SATCOM_LINK",
};

export default {
  stationCoordinates,
  polarThresholds,
  dataProvenance,
};

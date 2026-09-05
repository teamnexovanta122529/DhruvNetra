import { createContext, useContext, useEffect, useState } from "react";
import { stationData } from "../data/stationData";

const StationContext = createContext(null);

export function StationProvider({ children }) {
  const [station, setStationState] = useState(() => {
    return sessionStorage.getItem("selectedStation") || "MAITRI";
  });

  const setStation = (newStation) => {
    const validStation = stationData[newStation] ? newStation : "MAITRI";
    setStationState(validStation);
    sessionStorage.setItem("selectedStation", validStation);
  };

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === "selectedStation" && e.newValue && stationData[e.newValue]) {
        setStationState(e.newValue);
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const stationInfo = stationData[station] || stationData.MAITRI;

  return (
    <StationContext.Provider
      value={{
        station,
        setStation,
        stationInfo,
        stationData,
        availableStations: ["MAITRI", "BHARATI"],
      }}
    >
      {children}
    </StationContext.Provider>
  );
}

export function useStation() {
  const context = useContext(StationContext);
  if (!context) {
    // Fallback if rendered outside StationProvider
    const fallbackStation = sessionStorage.getItem("selectedStation") || "MAITRI";
    return {
      station: fallbackStation,
      setStation: (s) => sessionStorage.setItem("selectedStation", s),
      stationInfo: stationData[fallbackStation] || stationData.MAITRI,
      stationData,
      availableStations: ["MAITRI", "BHARATI"],
    };
  }
  return context;
}

/* =========================================================
   DHRUVNETRA 3D DIGITAL TWIN - STATION METADATA & ANCHORS
========================================================= */

// Canonical ID Normalization
export function normalizeComponentId(id) {
  if (!id) return null;
  const upper = String(id).toUpperCase();

  if (upper.includes("GEN") || upper.includes("POWER")) return "powerhouse";
  if (upper.includes("MAIN") || upper.includes("HABITAT") || upper.includes("SHELL")) return "habitat";
  if (upper.includes("LIVING") || upper.includes("CABIN") || upper.includes("RESIDENTIAL")) return "living";
  if (upper.includes("LOUNGE")) return "lounge";
  if (upper.includes("DINING") || upper.includes("GALLEY")) return "dining";
  if (upper.includes("HEAT") || upper.includes("BOILER")) return "heating";
  if (upper.includes("LAB") || upper.includes("SCIENCE")) return "lab";
  if (upper.includes("SATCOM") || upper.includes("COMM") || upper.includes("RADOME")) return "satcom";
  if (upper.includes("FUEL") || upper.includes("TANK")) return "fuel";
  if (upper.includes("SEAWATER") || upper.includes("COASTAL")) return "seawater_pump";
  if (upper.includes("WATER") || upper.includes("PUMP") || upper.includes("LAKE")) return "water";
  if (upper.includes("GARAGE") || upper.includes("VEHICLE")) return "garage";
  if (upper.includes("SUMMER") || upper.includes("CAMP")) return "summer_camp";
  if (upper.includes("HELIPAD") || upper.includes("APRON")) return "helipad";
  if (upper.includes("CONTAINER") || upper.includes("YARD") || upper.includes("WORKSHOP") || upper.includes("LOGISTICS")) return "workshop";
  if (upper.includes("STRUCT") || upper.includes("STILT")) return "structure";

  return id.toLowerCase();
}

// 3D World Anchor Coordinates (for leader line & pulsing beacon)
export const STATION_ANCHORS = {
  MAITRI: {
    powerhouse: [-82, 4.5, -15],
    habitat: [0, 6.2, 0],
    living: [25, 5.5, 20],
    dining: [0, 6.0, 8],
    heating: [0, 4.8, -5],
    lab: [-25, 5.5, 20],
    satcom: [-58, 8.8, 27],
    fuel: [-122, 4.2, 12],
    water: [260, 2.5, 14],
    garage: [-58, 4.5, 45],
    summer_camp: [86, 3.5, 92],
    helipad: [86, 3.5, 92],
    workshop: [-58, 4.5, 45],
    structure: [0, 1.8, 0],
  },
  BHARATI: {
    powerhouse: [-4, 5.5, -12],
    habitat: [0, 8.8, 0],
    living: [-3, 8.8, -5],
    lounge: [0, 8.8, 22],
    dining: [4, 8.8, 12],
    lab: [-4, 5.5, 10],
    water: [4, 5.5, -12],
    seawater_pump: [106, 1.5, 292],
    fuel: [-82, 4.8, -42],
    helipad: [76, 3.8, 232],
    satcom: [-36, 14.0, 78],
    comms: [4, 8.8, -5],
    workshop: [48, 2.8, 85],
    structure: [0, 2.5, 0],
  },
};

// Optimized Camera Bookmarks (Station visually prominent in 650px viewport)
export const CAMERA_BOOKMARKS = {
  BHARATI: {
    overview: { position: [-46, 30, -50], target: [0, 6, 0] },
    north: { position: [-4, 16, 56], target: [0, 7.5, 14] },
    entrance: { position: [42, 12, -15], target: [11, 5.5, -5] },
    lounge: { position: [30, 14, 34], target: [0, 8, 20] },
    laboratory: { position: [14, 12, 22], target: [0, 4.9, 11] },
    utilities: { position: [14, 12, 6], target: [0, 4.9, -5] },
    site: { position: [-190, 150, -230], target: [0, -2, 88] },
  },
  MAITRI: {
    overview: { position: [-52, 34, -58], target: [0, 4, 10] },
    north: { position: [0, 16, -52], target: [0, 5, 1] },
    entrance: { position: [24, 11, -28], target: [0, 4.5, -5] },
    lounge: { position: [32, 13, -12], target: [-10, 3.2, 0] },
    laboratory: { position: [30, 12, 32], target: [23, 3.4, 27] },
    utilities: { position: [-40, 22, -48], target: [-82, 2.5, -15] },
    site: { position: [-220, 165, -240], target: [35, -1, 20] },
  },
};

// Get Component 3D Anchor Coordinate
export function getComponentAnchor(stationName, componentId) {
  const stKey = String(stationName).toUpperCase() === "BHARATI" ? "BHARATI" : "MAITRI";
  const normId = normalizeComponentId(componentId);
  const anchors = STATION_ANCHORS[stKey];

  if (anchors && normId && anchors[normId]) {
    return anchors[normId];
  }
  // Fallbacks
  return stKey === "BHARATI" ? [0, 8.8, 0] : [0, 5.5, 0];
}

// Get Live Telemetry & Factual Metadata for any component
export function getComponentMetadata(stationName, componentId, telemetry) {
  const isBharati = String(stationName).toUpperCase() === "BHARATI";
  const normId = normalizeComponentId(componentId);
  // Dynamic live values from telemetry
  const pwr = telemetry?.power?.summary;
  const fl = telemetry?.fuel?.summary;
  const wtr = telemetry?.water?.summary;
  const hvc = telemetry?.hvac?.summary;

  const data = {
    powerhouse: {
      id: "powerhouse",
      title: isBharati
        ? "3 × 100 kVA Jet A-1 CHP Microgrid Plant"
        : "6 × 62.5 kW Jet A-1 Polar Powerhouse Generator Hall",
      subsystem: "POWER MICROGRID",
      route: "/dashboard/power",
      icon: "⚡",
      status: pwr?.status || "RUNNING",
      health: isBharati ? 96 : 91,
      confidence: "VERIFIED",
      source: isBharati ? "NCPOR OMRC 2022 §3.2" : "Antarctic Treaty inspection 2001 §4.7",
      metrics: [
        {
          label: "TOTAL GENERATION",
          value: pwr ? `${pwr.currentGenerationKw} kW` : (isBharati ? "450 kW" : "187.5 kW"),
          state: "OPTIMAL",
        },
        {
          label: "GRID LOAD",
          value: pwr ? `${pwr.loadPercentage}%` : "72.4%",
          state: "RUNNING",
        },
        {
          label: "ACTIVE GENERATORS",
          value: pwr ? `${pwr.activeGeneratorsCount} Online` : (isBharati ? "3 Online" : "4 Online"),
          state: "RUNNING",
        },
        {
          label: "GRID FREQUENCY",
          value: pwr ? `${pwr.frequencyHz || "50.02"} Hz` : "50.04 Hz",
          state: "NOMINAL",
        },
        {
          label: "VOLTAGE BUS",
          value: pwr ? `${pwr.voltageV || "415.4"} V` : "415.2 V",
          state: "NOMINAL",
        },
        {
          label: "HEAT RECOVERY",
          value: isBharati ? "112 kW (Thermal)" : "74 kW (Thermal)",
          state: "ACTIVE",
        },
      ],
      description: isBharati
        ? "Three 100 kVA Jet-A1 combined heat and power units on Level 2 with acoustic enclosures, LV switchgear, and recovered heat distribution headers."
        : "Six 62.5 kW Jet A-1 generators (four overwintering + two summer units) supplying uninterrupted power with secondary heat loop recovery.",
    },

    habitat: {
      id: "habitat",
      title: isBharati
        ? "Aerodynamic Envelope & 134 ISO Module Complex"
        : "Two-Storey U-Shaped Main Complex (~1,200 m²)",
      subsystem: "HVAC & LIFE SUPPORT",
      route: "/dashboard/hvac",
      icon: "✣",
      status: "OPTIMAL",
      health: isBharati ? 98 : 94,
      confidence: "VERIFIED",
      source: isBharati ? "Dlubal/KSF & bof architekten" : "Engineering & Communications in Antarctica §2.9",
      metrics: [
        {
          label: "INDOOR TEMP",
          value: hvc ? `+${hvc.indoorAvgTempC}°C` : (isBharati ? "+22.1°C" : "+21.4°C"),
          state: "OPTIMAL",
        },
        {
          label: "TARGET SETPOINT",
          value: "+22.0°C",
          state: "NOMINAL",
        },
        {
          label: "HUMIDITY",
          value: isBharati ? "43.8%" : "41.2%",
          state: "NOMINAL",
        },
        {
          label: "GLYCOL SUPPLY",
          value: isBharati ? "65.0°C" : "62.4°C",
          state: "ACTIVE",
        },
        {
          label: "HEATING LOAD",
          value: isBharati ? "74.2 kW" : "68.5 kW",
          state: "ACTIVE",
        },
        {
          label: "STILT CLEARANCE",
          value: isBharati ? "1.83 - 4.33 m" : "~2.0 m (Adjustable)",
          state: "STABLE",
        },
      ],
      description: isBharati
        ? "Thermal insulated aerodynamic shell over 134 prefabricated ISO containers, elevated on 86 steel columns to prevent snow accumulation."
        : "Two-storey 4-block main complex raised on adjustable telescopic steel stilts with cross-bracing over Schirmacher Oasis rock.",
    },

    living: {
      id: "living",
      title: isBharati
        ? "Level 3 Living Modules (20 Overwintering Cabins)"
        : "East Block Living Accommodations (26 Cabins)",
      subsystem: "HABITAT & LIFE SUPPORT",
      route: "/dashboard/hvac",
      icon: "🏠",
      status: "OPTIMAL",
      health: 97,
      confidence: "VERIFIED",
      source: isBharati ? "bof architekten Floor Plans" : "NCPOR Maitri Architectural Survey",
      metrics: [
        { label: "CABIN TEMP", value: "+21.8°C", state: "OPTIMAL" },
        { label: "AIR EXCHANGE", value: "850 m³/h (HEPA)", state: "NOMINAL" },
        { label: "OCCUPANCY", value: isBharati ? "24 Crew (Winter)" : "25 Crew (Winter)", state: "NOMINAL" },
        { label: "NOISE LEVEL", value: "< 32 dBA (Insulated)", state: "OPTIMAL" },
      ],
      description: "Individual thermal-insulated sleeping cabins with dedicated fresh air ventilation, heated floor coils, and ergonomic crew facilities.",
    },

    lounge: {
      id: "lounge",
      title: isBharati
        ? "North 15° Panoramic Observation Lounge"
        : "Central Common Lounge & Meeting Hall",
      subsystem: "HABITAT & CREW",
      route: "/dashboard/hvac",
      icon: "🪟",
      status: "OPTIMAL",
      health: 99,
      confidence: "VERIFIED",
      source: isBharati ? "bof architekten Panorama Deck" : "NCPOR Maitri Survey",
      metrics: [
        { label: "INDOOR TEMP", value: "+22.5°C", state: "OPTIMAL" },
        { label: "GLAZING TYPE", value: "Triple-Layer Heated Argon", state: "NOMINAL" },
        { label: "VIEW ORIENTATION", value: isBharati ? "Prydz Bay / Icebergs" : "Priyadarshini Lake", state: "CLEAR" },
        { label: "AIR QUALITY", value: "CO₂ 420 ppm (Nominal)", state: "OPTIMAL" },
      ],
      description: "Heated triple-glazed panoramic observation salon designed to withstand wind gusts over 260 km/h without thermal bridging.",
    },

    dining: {
      id: "dining",
      title: isBharati
        ? "Level 3 Galley & Crew Dining Hall"
        : "Central Galley & Overwintering Dining Hall",
      subsystem: "HABITAT & LIFE SUPPORT",
      route: "/dashboard/hvac",
      icon: "🍽️",
      status: "OPTIMAL",
      health: 96,
      confidence: "VERIFIED",
      source: "NCPOR Polar Station Facility Log",
      metrics: [
        { label: "AREA TEMP", value: "+22.0°C", state: "OPTIMAL" },
        { label: "GALLEY EXHAUST", value: "Active (Grease + Heat Ext)", state: "RUNNING" },
        { label: "POTABLE SUPPLY", value: "Direct Line (Heated)", state: "OPTIMAL" },
        { label: "SEATING CAP", value: isBharati ? "45 Personnel" : "35 Personnel", state: "NOMINAL" },
      ],
      description: "Central dining and commercial polar induction kitchen supplying hot meals throughout the 9-month overwintering isolation.",
    },

    heating: {
      id: "heating",
      title: "Block B Central Heating Boilers & Glycol Loop",
      subsystem: "HVAC & THERMAL",
      route: "/dashboard/hvac",
      icon: "♨",
      status: "ACTIVE",
      health: 93,
      confidence: "VERIFIED",
      source: "Engineering and Communications in Antarctica §2.10",
      metrics: [
        { label: "BOILER 01", value: "68.5°C (Active)", state: "RUNNING" },
        { label: "BOILER 02", value: "65.0°C (Standby)", state: "OPTIMAL" },
        { label: "GLYCOL LOOP", value: "4.2 bar / 64.8°C", state: "OPTIMAL" },
        { label: "BUFFER VESSELS", value: "2 Vessels (94% Vol)", state: "OPTIMAL" },
      ],
      description: "Dual-skid heating boiler system and pressurized insulated water distribution loop supplying Block B and living accommodations.",
    },

    lab: {
      id: "lab",
      title: isBharati
        ? "Level 2 Science Labs (Earth, Life, Chem, Electrical)"
        : "West Block Multi-Disciplinary Science Laboratories",
      subsystem: "SCIENTIFIC PAYLOADS",
      route: "/dashboard/environment",
      icon: "🔬",
      status: "ACTIVE",
      health: 98,
      confidence: "VERIFIED",
      source: isBharati ? "NCPOR Planning Advisory 2025" : "NCPOR Maitri Science Archive",
      metrics: [
        { label: "SPECTROMETRY", value: "UV-Vis Online", state: "OPTIMAL" },
        { label: "ATMOSPHERE", value: "Aerosol LIDAR Active", state: "OPTIMAL" },
        { label: "CRYOSPHERE", value: "Ice Core Cold Stage -20°C", state: "OPTIMAL" },
        { label: "GEOPHYSICS", value: "Fluxgate Magnetometer Active", state: "OPTIMAL" },
      ],
      description: "Specialized research laboratories conducting real-time spectrometry, geomagnetic observation, meteorology, and cryosphere science.",
    },

    satcom: {
      id: "satcom",
      title: isBharati
        ? "18 m Radome & INSAT-4CR High-Gain SATCOM Link"
        : "6.2 m SATCOM Radome & 16.5 m Meteorological Mast",
      subsystem: "COMMUNICATIONS & SATCOM",
      route: "/dashboard/overview",
      icon: "📡",
      status: "CONNECTED",
      health: 99,
      confidence: "VERIFIED",
      source: "NCPOR Polar Communications Network",
      metrics: [
        { label: "CARRIER UPLINK", value: "INSAT-4CR (C-Band)", state: "LOCKED" },
        { label: "LINK SNR", value: isBharati ? "14.8 dB (99.4%)" : "14.1 dB (98.7%)", state: "OPTIMAL" },
        { label: "LATENCY", value: isBharati ? "612 ms" : "742 ms", state: "OPTIMAL" },
        { label: "SECURITY", value: "AES-256 SCADA Tunnel", state: "SECURE" },
      ],
      description: "Continuous encrypted satellite telemetry link transmitting station SCADA data to NCPOR Goa and MoES New Delhi.",
    },

    fuel: {
      id: "fuel",
      title: isBharati
        ? "13 × 24 m³ Double-Hull Bulk Fuel Farm (296 kL)"
        : "7-Tank Insulated Bulk Fuel Depot & Heated Transfer Piping",
      subsystem: "FUEL SYSTEMS",
      route: "/dashboard/fuel",
      icon: "⛽",
      status: fl?.status || "STABLE",
      health: isBharati ? 94 : 88,
      confidence: "VERIFIED",
      source: isBharati ? "NCPOR OMRC 2022 §3.2" : "2001 Treaty Inspection §4.7",
      metrics: [
        {
          label: "STORAGE LEVEL",
          value: fl ? `${fl.currentLevelL.toLocaleString()} L (${fl.fuelPercentage}%)` : (isBharati ? "224,960 L (76.0%)" : "74,800 L (68.0%)"),
          state: "NORMAL",
        },
        {
          label: "DAYS REMAINING",
          value: fl ? `${Math.round(fl.estimatedDaysRemaining)} Days Buffer` : (isBharati ? "235 Days" : "119 Days"),
          state: "OPTIMAL",
        },
        {
          label: "CONSUMPTION RATE",
          value: fl ? `${fl.consumptionRateLh} L/h` : (isBharati ? "24.2 L/h" : "28.5 L/h"),
          state: "NORMAL",
        },
        {
          label: "TRACE HEATING",
          value: "ACTIVE (Glycol Header)",
          state: "ENGAGED",
        },
      ],
      description: "Arctic low-pour Jet A-1 double-hull tank farm equipped with bund containment, leak sensors, and pump transfer skid.",
    },

    water: {
      id: "water",
      title: isBharati
        ? "Seawater Desalination RO & Coastal Pump House"
        : "Priyadarshini Lake Pump House & 260 m Insulated Line",
      subsystem: "WATER & LIFE SUPPORT",
      route: "/dashboard/water",
      icon: "💧",
      status: wtr?.status || "OPTIMAL",
      health: isBharati ? 95 : 91,
      confidence: "VERIFIED",
      source: isBharati ? "Final CEE §3.7" : "Engineering in Antarctica §2.11.1",
      metrics: [
        {
          label: "BUFFER VOLUME",
          value: wtr ? `${wtr.currentLevelL.toLocaleString()} L (${wtr.percentage}%)` : (isBharati ? "23,500 L (94%)" : "18,200 L (91%)"),
          state: "OPTIMAL",
        },
        {
          label: "DAILY BALANCE",
          value: wtr ? `${wtr.netDailyBalanceL || "+180 L/day"}` : "+180 L/day",
          state: "ACCUMULATING",
        },
        {
          label: "DAILY PRODUCTION",
          value: isBharati ? "1,900 L/day (RO)" : "1,600 L/day (Lake)",
          state: "OPTIMAL",
        },
        {
          label: "PURIFICATION",
          value: "UV Sterilization + Ozonation",
          state: "OPTIMAL",
        },
      ],
      description: isBharati
        ? "Potable water production from seawater reverse osmosis (RO) backed by MBR wastewater treatment and coastal pump house."
        : "Freshwater intake pumped from Priyadarshini Lake through a 260 m heat-traced elevated pipeline.",
    },

    seawater_pump: {
      id: "seawater_pump",
      title: "Coastal Seawater Intake Pump House & Heated Line",
      subsystem: "WATER & LIFE SUPPORT",
      route: "/dashboard/water",
      icon: "🌊",
      status: "OPTIMAL",
      health: 96,
      confidence: "VERIFIED",
      source: "Final CEE §3.7",
      metrics: [
        { label: "PUMP STATUS", value: "Submersible Pump 01 Active", state: "RUNNING" },
        { label: "INTAKE FLOW", value: "3.2 m³/h", state: "OPTIMAL" },
        { label: "LINE HEATING", value: "Self-Regulating Electric Trace", state: "ACTIVE" },
        { label: "SALINITY IN", value: "34.2 PSU (Prydz Bay)", state: "NOMINAL" },
      ],
      description: "Heated marine intake pump station drawing coastal seawater from Prydz Bay to feed the Level 2 Reverse Osmosis desalination system.",
    },

    helipad: {
      id: "helipad",
      title: isBharati
        ? "900 m² Concrete Helipad & Aviation Fuelling Unit"
        : "Summer Camp Accommodations & Helipad Apron",
      subsystem: "LOGISTICS & FLEET",
      route: "/dashboard/logistics",
      icon: "🚁",
      status: "READY",
      health: 96,
      confidence: "VERIFIED",
      source: "NCPOR Logistics Master Plan",
      metrics: [
        { label: "APRON STATUS", value: "ICE-FREE / READY", state: "READY" },
        { label: "AV-FUEL BOWSER", value: "10,800 L Ready", state: "READY" },
        { label: "WIND DIRECTION", value: "NNE (Approach 04/22)", state: "NOMINAL" },
        { label: "LIGHTING RIG", value: "Perimeter Strobes Armed", state: "ACTIVE" },
      ],
      description: "Elevated reinforced helicopter landing pad and aviation refuelling station handling Kamov Ka-32 and Bell 412 operations.",
    },

    garage: {
      id: "garage",
      title: "Tracked Snowcat Garage, Workshop & Spares Depot",
      subsystem: "LOGISTICS & FLEET",
      route: "/dashboard/logistics",
      icon: "🚜",
      status: "OPTIMAL",
      health: 94,
      confidence: "VERIFIED",
      source: "NCPOR Maitri Station Infrastructure Plan",
      metrics: [
        { label: "VEHICLES ONLINE", value: "PistenBully & Prinoth Active", state: "OPTIMAL" },
        { label: "WORKSHOP HEATING", value: "+14.0°C (Active)", state: "RUNNING" },
        { label: "FUEL DISPENSER", value: "Jet A-1 Skid Ready", state: "READY" },
        { label: "SPARES BUFFER", value: "Full Winter Contingency", state: "NOMINAL" },
      ],
      description: "Heated vehicle maintenance bay equipped with overhead crane, hydraulic tools, and heavy tracked snow vehicle maintenance tooling.",
    },

    summer_camp: {
      id: "summer_camp",
      title: "Summer Camp Emergency Shelters & Container Tents",
      subsystem: "LOGISTICS & FLEET",
      route: "/dashboard/logistics",
      icon: "⛺",
      status: "READY",
      health: 95,
      confidence: "VERIFIED",
      source: "NCPOR Logistics Plan",
      metrics: [
        { label: "SHELTER STATUS", value: "Emergency Shelters Ready", state: "READY" },
        { label: "SUMMER BEDDING", value: "40 Additional Berths", state: "NOMINAL" },
        { label: "BACKUP GENERATOR", value: "25 kVA Standby", state: "OPTIMAL" },
        { label: "HEATING SKID", value: "Diesel Space Heaters Tested", state: "READY" },
      ],
      description: "Insulated polar living modules and summer scientific team accommodations used during peak expedition operations.",
    },

    workshop: {
      id: "workshop",
      title: isBharati
        ? "Container Logistics Staging Yard & Tracked Convoy"
        : "Cargo Marshalling Yard & Snowcat Vehicle Garage",
      subsystem: "LOGISTICS & FLEET",
      route: "/dashboard/logistics",
      icon: "📦",
      status: "READY",
      health: 96,
      confidence: "VERIFIED",
      source: "NCPOR Logistics Master Plan",
      metrics: [
        { label: "CONTAINER STACK", value: "18 ISO Spares Containers", state: "OPTIMAL" },
        { label: "CONVOY STATUS", value: "3 Sled Convoys Ready", state: "READY" },
        { label: "CRANE UNLOADER", value: "Hydraulic Slew Ready", state: "OPTIMAL" },
        { label: "CARGO LOG", value: "100% Manifested", state: "SECURE" },
      ],
      description: "Bulk cargo marshalling, container staging, and overland traverse convoy preparation yards.",
    },

    structure: {
      id: "structure",
      title: isBharati
        ? "86 Elevated Support Pillars & Steel Portal Frame"
        : "42 Telescopic Steel Stilts & Cross-Bracing Frame",
      subsystem: "STRUCTURAL INTEGRITY",
      route: "/dashboard/overview",
      icon: "⛯",
      status: "STABLE",
      health: 98,
      confidence: "VERIFIED",
      source: isBharati ? "Dlubal Structural Engineering Report" : "Antarctic Treaty inspection 2001 §4.5",
      metrics: [
        { label: "WIND LOAD DESIGN", value: "Up to 269 km/h (Gale Safe)", state: "SOLID" },
        { label: "SUPPORT COLUMNS", value: isBharati ? "86 Columns (8 Y-Bents)" : "42 Telescopic Columns", state: "OPTIMAL" },
        { label: "GROUND CLEARANCE", value: isBharati ? "1.83 - 4.33 m" : "~2.0 m Elevated", state: "STABLE" },
        { label: "FOUNDATION SEAT", value: isBharati ? "Larsemann Granite" : "Schirmacher Gneiss", state: "SOLID" },
      ],
      description: "Engineered heavy structural steel framework elevated on stilts to allow Antarctic drift snow and high-velocity katabatic winds to pass unimpeded below the building.",
    },
  };

  return (normId && data[normId]) || data.powerhouse;
}

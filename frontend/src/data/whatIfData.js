// What-If Simulation Mock Data & Scenario Models for DHRUVNETRA

export const quickScenarios = [
  {
    id: "gen1_shutdown_7h",
    title: "Generator 1 Shutdown (7 hrs)",
    category: "POWER",
    query: "What if Generator 1 is turned off for 7 hours for maintenance?",
    impact: {
      fuelSaved: "42 L",
      fuelBurnChange: "-6.0 L/h",
      currentConsumption: "28.5 L/h",
      projectedConsumption: "22.5 L/h",
      currentLoad: "82 kW (68%)",
      projectedLoad: "82 kW (92% on Gen 2)",
      backupLoad: "Gen 3 Standby (+18% dependency)",
      riskLevel: "LOW",
      riskScore: 24,
      recommendation: "RECOMMENDED",
      recommendationText:
        "Shutdown can be executed safely under current ambient temperature (−24°C). Generator 2 has sufficient capacity to handle base load. Maintain Generator 3 on pre-heated warm standby.",
      systemsAffected: [
        { name: "Gen 1 (Diesel 125kVA)", status: "OFFLINE (MAINTENANCE)" },
        { name: "Gen 2 (Diesel 125kVA)", status: "ACTIVE (92% LOAD)" },
        { name: "Gen 3 (Standby 100kVA)", status: "ARMED STANDBY" },
        { name: "Main Life Support Bus", status: "NOMINAL (230V STABLE)" },
      ],
      chartData: {
        labels: ["T-0", "T+1h", "T+2h", "T+4h", "T+6h", "T+7h"],
        currentFuel: [28.5, 28.5, 29.0, 28.5, 29.2, 28.5],
        projectedFuel: [28.5, 22.5, 22.4, 22.6, 22.5, 28.5],
        currentPower: [82, 82, 84, 83, 85, 82],
        projectedPower: [82, 82, 84, 83, 85, 82],
      },
    },
    aiResponse: `DHRUVNETRA AI OPERATIONAL ASSESSMENT:

Analyzing current station conditions at Schirmacher Oasis...

Generator 1 shutdown for 7.0 hours simulation results:
• Projected Fuel Conservation: ~42.0 Litres of Arctic Grade High-Speed Diesel (HSD-A).
• Base Electrical Load will shift entirely to Generator 2, increasing its load from 46% to 92%.
• Temperature drop inside the generator housing: Minimal (~1.4°C over 7 hours).
• Critical life support and research laboratory power buses remain at 100% nominal voltage.

OVERALL OPERATIONAL RISK: LOW
RECOMMENDATION: RECOMMENDED. Ensure secondary generator fuel filters are primed before executing shutdown.`,
  },
  {
    id: "fuel_opt_24h",
    title: "Fuel Optimization Mode (24 hrs)",
    category: "FUEL",
    query: "What if we engage Fuel Optimization Mode for the next 24 hours across non-critical zones?",
    impact: {
      fuelSaved: "118 L",
      fuelBurnChange: "-4.9 L/h",
      currentConsumption: "28.5 L/h",
      projectedConsumption: "23.6 L/h",
      currentLoad: "82 kW (68%)",
      projectedLoad: "64 kW (53%)",
      backupLoad: "All systems buffered",
      riskLevel: "LOW",
      riskScore: 16,
      recommendation: "HIGHLY RECOMMENDED",
      recommendationText:
        "Non-critical laboratory heaters, auxiliary corridors, and snow melter pre-heaters throttled to eco-band. Substantially extends winter stock endurance by +3.8 days.",
      systemsAffected: [
        { name: "Main Accommodation Heating", status: "NOMINAL (+19°C)" },
        { name: "Non-Critical Storage Labs", status: "ECO-BAND (+8°C)" },
        { name: "Snow Melting Facility", status: "BATCH CYCLE (NIGHT)" },
        { name: "Secondary Battery Banks", status: "TRICKLE CHARGE" },
      ],
      chartData: {
        labels: ["00:00", "04:00", "08:00", "12:00", "16:00", "20:00"],
        currentFuel: [28.5, 27.8, 30.2, 31.0, 29.5, 28.5],
        projectedFuel: [23.6, 22.8, 24.5, 25.1, 24.0, 23.6],
        currentPower: [82, 78, 88, 92, 86, 82],
        projectedPower: [64, 60, 68, 71, 66, 64],
      },
    },
    aiResponse: `DHRUVNETRA AI OPERATIONAL ASSESSMENT:

Simulating 24-Hour Fuel Conservation Protocol:
• Fuel Savings: ~118 Litres (extends station fuel reserve window by +3.8 days).
• Non-essential thermal loops (unoccupied bays and cold-storage docks) throttled to +8°C.
• Water melter operations rescheduled to off-peak night cycles.
• Primary living quarters maintain comfortable +19°C with zero disruption to crew welfare.

OVERALL OPERATIONAL RISK: LOW
RECOMMENDATION: HIGHLY RECOMMENDED for storm preparation or extended resupply delay contingency.`,
  },
  {
    id: "hvac_setback_6h",
    title: "HVAC Setback to −22°C External (6 hrs)",
    category: "HVAC",
    query: "What if outside temperature plunges to −38°C and HVAC thermal setback is applied for 6 hours?",
    impact: {
      fuelSaved: "−28 L (Extra Burn)",
      fuelBurnChange: "+4.6 L/h",
      currentConsumption: "28.5 L/h",
      projectedConsumption: "33.1 L/h",
      currentLoad: "82 kW (68%)",
      projectedLoad: "96 kW (80%)",
      backupLoad: "Glycol auxiliary heaters engaged",
      riskLevel: "MEDIUM",
      riskScore: 54,
      recommendation: "CAUTION ADVISED",
      recommendationText:
        "Severe external cold delta requires auxiliary glycol loop circulation. Thermal retention in living block remains stable, but perimeter airlocks require active trace heating.",
      systemsAffected: [
        { name: "Living Quarters HVAC", status: "TARGET +18°C STABLE" },
        { name: "Perimeter Airlocks", status: "TRACE HEATING ACTIVE" },
        { name: "Glycol Loop Pump 2", status: "HIGH SPEED (100%)" },
        { name: "Ventilation Heat Exchanger", status: "DE-ICE CYCLE ENGAGED" },
      ],
      chartData: {
        labels: ["T-0", "T+1h", "T+2h", "T+3h", "T+4h", "T+6h"],
        currentFuel: [28.5, 28.5, 29.0, 29.0, 28.5, 28.5],
        projectedFuel: [28.5, 31.2, 33.0, 33.5, 33.1, 32.8],
        currentPower: [82, 82, 84, 84, 82, 82],
        projectedPower: [82, 90, 95, 96, 95, 94],
      },
    },
    aiResponse: `DHRUVNETRA AI OPERATIONAL ASSESSMENT:

Simulating Extreme Temperature Drop (−38°C Ambient with 45 km/h katabatic winds):
• Thermal loss through peripheral skin increases by 34%.
• Auxiliary glycol heaters will automatically cycle on, adding +14 kW electrical draw.
• Fuel consumption will rise by ~4.6 L/h to counteract thermal gradient.
• Airlock seal integrity must be visually confirmed to prevent ice crystallization.

OVERALL OPERATIONAL RISK: MEDIUM
RECOMMENDATION: CAUTION. Ensure glycol loop expansion vessel pressure is at 1.8 bar prior to temperature drop.`,
  },
  {
    id: "water_melting_reduce_12h",
    title: "Water Melting Reduced 40% (12 hrs)",
    category: "WATER",
    query: "What if snow melter operation is throttled by 40% for the next 12 hours?",
    impact: {
      fuelSaved: "31 L",
      fuelBurnChange: "-2.6 L/h",
      currentConsumption: "28.5 L/h",
      projectedConsumption: "25.9 L/h",
      currentLoad: "82 kW (68%)",
      projectedLoad: "71 kW (59%)",
      backupLoad: "Main reservoir 91% (18,200 L)",
      riskLevel: "LOW",
      riskScore: 18,
      recommendation: "RECOMMENDED",
      recommendationText:
        "Station water reserve currently stands at 91% capacity (18,200 Litres), representing 14 days of domestic buffer. Throttling melter has negligible impact on crew supply.",
      systemsAffected: [
        { name: "Snow Melter Calandria", status: "THROTTLED (60% OUTPUT)" },
        { name: "Potable Water Buffer", status: "18,200 L AVAILABLE" },
        { name: "Graywater Recycling", status: "NOMINAL (84% RECOVERY)" },
        { name: "Melter Electrical Coil", status: "CYCLING ON 50% DUTY" },
      ],
      chartData: {
        labels: ["T-0", "T+2h", "T+4h", "T+6h", "T+8h", "T+12h"],
        currentFuel: [28.5, 28.5, 28.7, 28.5, 28.4, 28.5],
        projectedFuel: [28.5, 25.9, 25.8, 25.9, 26.0, 25.9],
        currentPower: [82, 82, 83, 82, 82, 82],
        projectedPower: [82, 71, 71, 72, 71, 71],
      },
    },
    aiResponse: `DHRUVNETRA AI OPERATIONAL ASSESSMENT:

Snow Melter Throttling Simulation (12 Hours):
• Power Demand Reduction: −11.0 kW electrical load.
• Fuel Conserved: ~31.0 Litres.
• Station potable water storage: drops from 91% to 88.5% over 12 hours (safe threshold is >45%).
• Water production can catch up within 3 hours of full restoration.

OVERALL OPERATIONAL RISK: LOW
RECOMMENDATION: RECOMMENDED during peak electrical demand hours.`,
  },
  {
    id: "blizzard_protocol_prep",
    title: "Severe Blizzard Protocol (Cat-3 Storm)",
    category: "EMERGENCY",
    query: "What if Category 3 Blizzard hits with 110 km/h winds and power grid isolates into storm mode?",
    impact: {
      fuelSaved: "0 L (Grid Hardening)",
      fuelBurnChange: "+6.8 L/h",
      currentConsumption: "28.5 L/h",
      projectedConsumption: "35.3 L/h",
      currentLoad: "82 kW (68%)",
      projectedLoad: "105 kW (87.5%)",
      backupLoad: "Dual Gen Active + Emergency Battery Bank",
      riskLevel: "HIGH",
      riskScore: 78,
      recommendation: "ACTION REQUIRED — PROTOCOL 4B",
      recommendationText:
        "Isolate external telemetry masts. Spin up dual synchronized generators. Lock all storm airlocks. Switch SATCOM antenna to heated radome high-torque tracking.",
      systemsAffected: [
        { name: "Primary SATCOM Radome", status: "HEATED TRACKING (100% TORQUE)" },
        { name: "External Scientific Masts", status: "AUTOMATIC RETRACTION" },
        { name: "Generators 1 & 2", status: "SYNCHRONIZED CO-GEN ACTIVE" },
        { name: "Emergency Life Support", status: "ISOLATION READY" },
      ],
      chartData: {
        labels: ["T-0", "T+1h", "T+3h", "T+6h", "T+12h", "T+24h"],
        currentFuel: [28.5, 28.5, 28.5, 28.5, 28.5, 28.5],
        projectedFuel: [28.5, 34.0, 35.5, 36.0, 35.2, 34.8],
        currentPower: [82, 82, 82, 82, 82, 82],
        projectedPower: [82, 98, 105, 108, 104, 102],
      },
    },
    aiResponse: `DHRUVNETRA AI OPERATIONAL ASSESSMENT:

SIMULATING CATEGORY-3 BLIZZARD CONTINGENCY (Winds >110 km/h, Visibility <5m):
• Microgrid isolates into dual-generator redundant load sharing (Gen 1 + Gen 2 active).
• External sensor masts automatically stow to prevent aerodynamic shear fatigue.
• Radome heating coils consume +8 kW to prevent wet-snow accumulation on SATCOM dish.
• Total Station Power Draw escalates to 105 kW (87.5% capacity).

OVERALL OPERATIONAL RISK: HIGH
RECOMMENDATION: EXECUTE PROTOCOL 4B. Restrict all outdoor movement and verify emergency communication beacon handshake with NCPOR Command.`,
  },
  {
    id: "main_bus_failure_sim",
    title: "Main Power Bus Failure & Auto-Transfer",
    category: "POWER",
    query: "What if Bus A experiences an abrupt breaker trip while drawing 55 kW?",
    impact: {
      fuelSaved: "N/A (Emergency Fault)",
      fuelBurnChange: "0.0 L/h",
      currentConsumption: "28.5 L/h",
      projectedConsumption: "28.5 L/h",
      currentLoad: "82 kW (68%)",
      projectedLoad: "82 kW (UPS + Bus B Transfer in 18ms)",
      backupLoad: "UPS Inverters Active (0.018s switch)",
      riskLevel: "CRITICAL",
      riskScore: 92,
      recommendation: "EMERGENCY SAFETY INTERVENTION",
      recommendationText:
        "Automatic static transfer switch (STS) redirects critical life support to Bus B within 18ms. Non-essential labs shed automatically. Physical inspection of main busbar required.",
      systemsAffected: [
        { name: "Power Bus A (Main)", status: "TRIPPED (OVERCURRENT SIM)" },
        { name: "Power Bus B (Emergency)", status: "AUTOMATIC TAKEOVER (18ms)" },
        { name: "UPS Battery Inverters", status: "DISCHARGING BUFFER (100%)" },
        { name: "Life Support Circuits", status: "UNINTERRUPTED (0ms DOWNTIME)" },
      ],
      chartData: {
        labels: ["T-0s", "T+0.02s", "T+1s", "T+5s", "T+30s", "T+60s"],
        currentFuel: [28.5, 28.5, 28.5, 28.5, 28.5, 28.5],
        projectedFuel: [28.5, 28.5, 28.5, 28.5, 28.5, 28.5],
        currentPower: [82, 0, 82, 82, 82, 82],
        projectedPower: [82, 27, 82, 82, 82, 82],
      },
    },
    aiResponse: `DHRUVNETRA AI OPERATIONAL ASSESSMENT:

SIMULATING POWER BUS A ABRUPT TRIPPING FAULT:
• Static Transfer Switch (STS) triggers sub-cycle transfer in 18 milliseconds.
• Class-1 Critical Loads (Life Support, SATCOM, SCADA) maintain continuous sinus wave without reset.
• Class-3 Laboratory loads shed automatically to preserve battery buffer.
• SCADA telemetry alerts technician workstation with trip diagnostic code E-4081.

OVERALL OPERATIONAL RISK: CRITICAL
RECOMMENDATION: Verify STS relay trip response time and inspect Bus A circuit breaker contacts before manual re-closure.`,
  },
];

export const simulationHistory = [
  {
    id: "sim-1092",
    timestamp: "14:15 IST",
    date: "05 Sep 2026",
    station: "MAITRI",
    title: "Generator 1 shutdown — 7 hours",
    fuelSaved: "42 L",
    risk: "LOW",
    status: "COMPLETED",
  },
  {
    id: "sim-1091",
    timestamp: "11:30 IST",
    date: "05 Sep 2026",
    station: "MAITRI",
    title: "Fuel optimization mode — 24 hours",
    fuelSaved: "118 L",
    risk: "LOW",
    status: "COMPLETED",
  },
  {
    id: "sim-1090",
    timestamp: "09:05 IST",
    date: "05 Sep 2026",
    station: "BHARATI",
    title: "HVAC thermal reduction — 6 hours",
    fuelSaved: "−28 L",
    risk: "MEDIUM",
    status: "COMPLETED",
  },
  {
    id: "sim-1089",
    timestamp: "16:40 IST",
    date: "04 Sep 2026",
    station: "BHARATI",
    title: "Category 3 Blizzard grid hardening",
    fuelSaved: "0 L",
    risk: "HIGH",
    status: "COMPLETED",
  },
];

export const initialChatMessages = [
  {
    id: "msg-1",
    sender: "system",
    text: "DHRUVNETRA AI Operational Simulation Engine initialized. Connected to real-time SCADA telemetry for Indian Antarctic Stations (Maitri & Bharati). Select a scenario preset or type a natural-language operational query.",
    timestamp: "14:30:00",
  },
  {
    id: "msg-2",
    sender: "user",
    text: "What if Generator 1 is turned off for 7 hours?",
    timestamp: "14:30:45",
  },
  {
    id: "msg-3",
    sender: "ai",
    text: `DHRUVNETRA AI OPERATIONAL ASSESSMENT:

Analyzing current station conditions at Schirmacher Oasis...

Generator 1 shutdown for 7.0 hours simulation results:
• Projected Fuel Conservation: ~42.0 Litres of Arctic Grade High-Speed Diesel (HSD-A).
• Base Electrical Load will shift entirely to Generator 2, increasing its load from 46% to 92%.
• Temperature drop inside the generator housing: Minimal (~1.4°C over 7 hours).
• Critical life support and research laboratory power buses remain at 100% nominal voltage.

OVERALL OPERATIONAL RISK: LOW
RECOMMENDATION: RECOMMENDED. Ensure secondary generator fuel filters are primed before executing shutdown.`,
    timestamp: "14:30:46",
    scenarioId: "gen1_shutdown_7h",
  },
];

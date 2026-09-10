// What-If Simulation Data & Scenario Models for DHRUVNETRA (SIH 2026)

export const quickScenarios = [
  {
    id: "gen1_shutdown_7h",
    title: "Generator 1 Shutdown (7 hrs)",
    category: "POWER",
    query: "What if Generator 1 is turned off for 7 hours for maintenance?",
    health: {
      baseline_score: 100.0,
      projected_score: 73.0,
      delta: -27.0,
      status: "OPTIMAL",
      deductions: [
        { penalty: 20.0, reason: "Loss of N-1 Redundancy", metric: "Active fleet: G2 only" },
        { penalty: 7.0, reason: "High Generator Operating Load", metric: "G2 at 98.3% rating" },
      ],
    },
    impact: {
      fuelSaved: "42 L",
      fuelBurnChange: "-6.0 L/h",
      currentConsumption: "28.5 L/h",
      projectedConsumption: "22.5 L/h",
      currentLoad: "98 kW (68%)",
      projectedLoad: "98 kW (98% on Gen 2)",
      backupLoad: "Gen 3 Standby (+18% dependency)",
      riskLevel: "MEDIUM",
      riskScore: 55,
      healthScore: 73.0,
      healthDelta: -27.0,
      recommendation: "CAUTION ADVISED",
      recommendationText:
        "Shutdown can be executed safely under current ambient temperature (−24°C). Generator 2 carries base electrical load. Spin up secondary generator to restore N-1 redundancy.",
      systemsAffected: [
        { name: "Gen 1 (Diesel 125kVA)", status: "OFFLINE (MAINTENANCE)" },
        { name: "Gen 2 (Diesel 125kVA)", status: "ACTIVE (98% LOAD)" },
        { name: "Gen 3 (Standby 100kVA)", status: "WARM STANDBY READY" },
        { name: "Main Life Support Bus", status: "NOMINAL (230V STABLE)" },
      ],
      chartData: {
        labels: ["T-0", "T+1h", "T+2h", "T+4h", "T+6h", "T+7h"],
        currentFuel: [28.5, 28.5, 29.0, 28.5, 29.2, 28.5],
        projectedFuel: [28.5, 22.5, 22.4, 22.6, 22.5, 28.5],
        currentPower: [98, 98, 98, 98, 98, 98],
        projectedPower: [98, 98, 98, 98, 98, 98],
        indoorTemp: [21.4, 21.8, 22.5, 23.2, 24.1, 24.6],
        waterReserve: [18200, 18100, 17950, 17700, 17500, 17350],
        healthScore: [100, 78, 75, 74, 73, 73],
      },
    },
    cascadingEffects: [
      { step: 1, system: "PRIMARY_TRIGGER", title: "Generator G1 Outage", description: "Generator G1 isolated from primary 415V busbar", severity: "MEDIUM", trigger_time: "T+0m", mitigation_target: "G3 Standby Start" },
      { step: 2, system: "MICROGRID_BUS", title: "Single Generator Dispatch", description: "Generator G2 absorbs total demand (98.3 kW)", severity: "MEDIUM", trigger_time: "T+10s", mitigation_target: "Class-2 Load Shedding" },
      { step: 3, system: "BESS_STORAGE", title: "BESS Trickle Charging Buffer", description: "BESS buffer remains active at 94.2% SOC", severity: "LOW", trigger_time: "T+1m", mitigation_target: "BESS Peak Shaving" },
    ],
    thresholdBreaches: [],
    mitigationStrategies: [
      { strategy_id: "STRAT-A", name: "Standby Unit Fast-Start", description: "Spin up Generator 3 (80 kW warm standby) to share load", power_deficit_kw: 0.0, delivered_power_kw: 98.0, active_generators: ["G2", "G3"], fuel_delta: "+1.2 L", risk_level: "LOW", risk_score: 20, health_score: 95.0, is_recommended: true, action_steps: ["Verify G3 block heaters", "Close synchronized vacuum breaker"] },
      { strategy_id: "STRAT-B", name: "Class-2 Non-Critical Shedding", description: "Shed 20 kW of non-essential lab heaters", power_deficit_kw: 0.0, delivered_power_kw: 78.0, active_generators: ["G2"], fuel_delta: "-4.0 L", risk_level: "MEDIUM", risk_score: 40, health_score: 82.0, is_recommended: false, action_steps: ["Shed snow melter electrical coil", "Throttle auxiliary bay heaters"] },
    ],
    aiResponse: `DHRUVNETRA AI OPERATIONAL ASSESSMENT:

Station: MAITRI | Scenario: G1 SHUTDOWN | Duration: 7.0 hours
Calculated Risk: MEDIUM (Index: 55/100) | Redundancy: N-0 / SINGLE POINT OF FAILURE

## POWER IMPACT
• Current Demand: 98.3 kW | Remaining Generation: 100.0 kW
• Net Power Deficit: 0.0 kW (Load supportable by remaining fleet).
• Active Generators: G2 (Operating load: 98.3%).

## SUBSYSTEM IMPACTS
• Fuel Consumption: Projected delta -0.6 L (Extra Burn) (Rate: 26.9 L/h vs 26.8 L/h baseline).
• Battery BESS Buffer: Projected reserve SOC at 94.2% (TRICKLE_CHARGING).
• Thermal Profile: Indoor temperature shifts by +3.2°C (Est: 24.6°C).
• Station Health: Baseline 100/100 -> Projected 73/100 (Δ -27 pts).

OPERATIONAL DIRECTIVE:
CAUTION ADVISED. Spin up secondary synchronized generator to share microgrid load. Verify static transfer switch (STS) and standby jacket water heaters are active.`,
  },
  {
    id: "dual_gen_outage",
    title: "Dual Gen Outage (G1 + G2 Off)",
    category: "POWER",
    query: "What if I turned the generator 1 and 2 off?",
    health: {
      baseline_score: 100.0,
      projected_score: 5.0,
      delta: -95.0,
      status: "CRITICAL",
      deductions: [
        { penalty: 50.0, reason: "Severe Power Deficit", metric: "Unserved Load: 98.3 kW" },
        { penalty: 20.0, reason: "Complete Loss of Redundancy", metric: "Active fleet: 0 units" },
        { penalty: 15.0, reason: "BESS Rapid Depletion", metric: "UPS runtime: <1.8h" },
        { penalty: 10.0, reason: "Life Support Thermal Drift", metric: "Indoor Temp drops to -8°C" },
      ],
    },
    impact: {
      fuelSaved: "187.6 L",
      fuelBurnChange: "-26.8 L/h",
      currentConsumption: "26.8 L/h",
      projectedConsumption: "0.0 L/h",
      currentLoad: "98 kW (68%)",
      projectedLoad: "0 kW",
      backupLoad: "DEFICIT: 98.3 kW",
      riskLevel: "CRITICAL",
      riskScore: 98,
      healthScore: 5.0,
      healthDelta: -95.0,
      recommendation: "CRITICAL RISK: REJECTED",
      recommendationText:
        "Total loss of primary generation capacity. Station electrical load cannot be served by zero active generators. Emergency BESS buffer provides maximum 1.8 hours before black start failure.",
      systemsAffected: [
        { name: "Generator 1 (Primary)", status: "SIMULATED OFFLINE" },
        { name: "Generator 2 (Secondary)", status: "SIMULATED OFFLINE" },
        { name: "Microgrid 415V Bus", status: "CRITICAL BLACKOUT THREAT" },
        { name: "BESS Inverter System", status: "DISCHARGING BUFFER (1.8h RUNTIME)" },
      ],
      chartData: {
        labels: ["T-0", "T+0.5h", "T+1.0h", "T+2.0h", "T+4.0h"],
        currentFuel: [26.8, 26.8, 26.8, 26.8, 26.8],
        projectedFuel: [26.8, 0.0, 0.0, 0.0, 0.0],
        currentPower: [98, 98, 98, 98, 98],
        projectedPower: [98, 0, 0, 0, 0],
        indoorTemp: [21.4, 18.2, 14.5, 8.2, -1.5],
        waterReserve: [18200, 18200, 18200, 18100, 18000],
        healthScore: [100, 25, 12, 8, 5],
      },
    },
    cascadingEffects: [
      { step: 1, system: "PRIMARY_TRIGGER", title: "Dual Generator Outage", description: "Both primary generators disconnected from microgrid", severity: "CRITICAL", trigger_time: "T+0m", mitigation_target: "Emergency Standby G3" },
      { step: 2, system: "MICROGRID_BUS", title: "Bus De-energization", description: "Microgrid voltage drops to 0V. Static transfer to BESS", severity: "CRITICAL", trigger_time: "T+10s", mitigation_target: "Class-1 Isolation" },
      { step: 3, system: "BESS_STORAGE", title: "Emergency BESS Discharge", description: "Battery buffer discharges at maximum C-rate (1.8h floor)", severity: "HIGH", trigger_time: "T+1m", mitigation_target: "Shed non-critical loads" },
      { step: 4, system: "LIFE_SUPPORT_HVAC", title: "HVAC Thermal Decay", description: "Living quarters temperature decays toward ambient (-24°C)", severity: "HIGH", trigger_time: "T+15m", mitigation_target: "Seal perimeter bulkheads" },
    ],
    thresholdBreaches: [
      { metric: "POWER_DEFICIT", threshold: "> 0.0 kW", breach_time: "T+0.0h (IMMEDIATE)", criticality: "CRITICAL", description: "Generation shortfall of 98.3 kW begins immediately upon shutdown." },
      { metric: "BATTERY_UPS_FLOOR", threshold: "< 30.0% SOC", breach_time: "T+1.8h", criticality: "CRITICAL", description: "Station backup UPS drops to 0.0%, exceeding 30% emergency threshold." },
    ],
    mitigationStrategies: [
      { strategy_id: "STRAT-A", name: "Emergency Standby Start", description: "Fast-start Generator 3 to deliver 80 kW", power_deficit_kw: 18.3, delivered_power_kw: 80.0, active_generators: ["G3"], fuel_delta: "-6.2 L", risk_level: "HIGH", risk_score: 70, health_score: 45.0, is_recommended: false, action_steps: ["Emergency crank G3", "Load shed non-essential scientific circuits"] },
      { strategy_id: "STRAT-C", name: "Standby Start + 20 kW Load Shedding", description: "Engage G3 (80 kW) and shed non-critical loads (20 kW) to balance grid", power_deficit_kw: 0.0, delivered_power_kw: 78.3, active_generators: ["G3"], fuel_delta: "-6.5 L", risk_level: "LOW", risk_score: 25, health_score: 92.0, is_recommended: true, action_steps: ["Spin up G3", "Shed secondary thermal coils", "Maintain living block life support"] },
    ],
    aiResponse: `DHRUVNETRA AI OPERATIONAL ASSESSMENT:

Station: MAITRI | Scenario: G1 + G2 SHUTDOWN | Duration: 7.0 hours
Calculated Risk: CRITICAL (Index: 98/100) | Redundancy: ZERO ACTIVE FLEET

## POWER IMPACT
• Current Demand: 98.3 kW | Remaining Generation: 0.0 kW
• Net Power Deficit: 98.3 kW (UNSERVED ELECTRICAL LOAD).
• Active Generators: None (100% capacity loss).

## SUBSYSTEM IMPACTS
• Fuel Consumption: Projected delta 187.6 L saved, BUT microgrid is unpowered.
• Battery BESS Buffer: Projected runtime 1.8 hours before complete depletion.
• Thermal Profile: Indoor temperature drops from +21.4°C to -1.5°C over 4 hours.
• Station Health: Baseline 100/100 -> Projected 5/100 (Δ -95 pts).

OPERATIONAL DIRECTIVE:
CRITICAL RISK: REJECTED. Emergency safety intervention required. Must start Generator 3 immediately and shed Class-2 loads.`,
  },
  {
    id: "water_purification_outage",
    title: "Water Purification Plant Outage (24 hrs)",
    category: "WATER",
    query: "What if water purification plant fails for 24 hours?",
    health: {
      baseline_score: 100.0,
      projected_score: 75.0,
      delta: -25.0,
      status: "OPTIMAL",
      deductions: [
        { penalty: 25.0, reason: "Water Purification Plant Offline", metric: "Reserve depletion: 1,450 L/day" },
      ],
    },
    impact: {
      fuelSaved: "0 L",
      fuelBurnChange: "0.0 L/h",
      currentConsumption: "26.8 L/h",
      projectedConsumption: "26.8 L/h",
      currentLoad: "98 kW",
      projectedLoad: "92 kW (Melter Offline)",
      backupLoad: "Reservoir Buffer Active",
      riskLevel: "MEDIUM",
      riskScore: 48,
      healthScore: 75.0,
      healthDelta: -25.0,
      recommendation: "CAUTION ADVISED",
      recommendationText:
        "Potable water reserve currently stands at 18,200 Litres (12.6 days buffer). A 24-hour outage consumes 1,450 L (8.0% of reserve), safely above critical threshold.",
      systemsAffected: [
        { name: "RO Water Purification Unit", status: "OFFLINE_FAULT" },
        { name: "Priyadarshini Lake Pipeline", status: "STANDBY TRACE HEATING" },
        { name: "Potable Storage Tanks", status: "16,750 L REMAINING (92%)" },
      ],
      chartData: {
        labels: ["T-0", "T+6h", "T+12h", "T+18h", "T+24h"],
        currentFuel: [26.8, 26.8, 26.8, 26.8, 26.8],
        projectedFuel: [26.8, 26.8, 26.8, 26.8, 26.8],
        currentPower: [98, 98, 98, 98, 98],
        projectedPower: [92, 92, 92, 92, 92],
        indoorTemp: [21.4, 21.4, 21.4, 21.4, 21.4],
        waterReserve: [18200, 17837, 17475, 17112, 16750],
        healthScore: [100, 85, 80, 78, 75],
      },
    },
    cascadingEffects: [
      { step: 1, system: "PRIMARY_TRIGGER", title: "Purification Plant Fault", description: "Water purification unit tripped offline", severity: "MEDIUM", trigger_time: "T+0m", mitigation_target: "Engage backup filters" },
      { step: 2, system: "WATER_SYSTEM", title: "Storage Reservoir Drawdown", description: "Station draws from 18,200 L potable tank", severity: "LOW", trigger_time: "T+1h", mitigation_target: "Ration non-essential galley wash" },
    ],
    thresholdBreaches: [],
    mitigationStrategies: [
      { strategy_id: "STRAT-A", name: "Backup Snow Melter Cycle", description: "Engage secondary thermal snow melter to replenish buffer", power_deficit_kw: 0.0, delivered_power_kw: 98.0, active_generators: ["G1", "G2"], fuel_delta: "+8.0 L", risk_level: "LOW", risk_score: 20, health_score: 95.0, is_recommended: true, action_steps: ["Ignite melter glycol circuit", "Feed clean snow hopper"] },
    ],
    aiResponse: `DHRUVNETRA AI OPERATIONAL ASSESSMENT:

Station: MAITRI | Scenario: WATER PURIFICATION OUTAGE | Duration: 24.0 hours
Calculated Risk: MEDIUM (Index: 48/100) | Potable Reserve: 16,750 L Remaining

## WATER SUBSYSTEM IMPACT
• Initial Reserve: 18,200 L | Projected Reserve: 16,750 L (−1,450 L).
• Runway: 11.6 days of remaining potable buffer at standard consumption.
• Station Health: Baseline 100/100 -> Projected 75/100 (Δ -25 pts).

OPERATIONAL DIRECTIVE:
CAUTION ADVISED. Isolate faulted RO membrane filter and activate secondary snow melter batch cycle.`,
  },
  {
    id: "logistics_delay_7d",
    title: "Supply Ship Delivery Delayed (7 Days)",
    category: "LOGISTICS",
    query: "What if fuel delivery is delayed by 7 days?",
    health: {
      baseline_score: 100.0,
      projected_score: 82.0,
      delta: -18.0,
      status: "OPTIMAL",
      deductions: [
        { penalty: 18.0, reason: "Logistics Resupply Delay", metric: "Safety margin: 119.8 days remaining" },
      ],
    },
    impact: {
      fuelSaved: "0 L",
      fuelBurnChange: "0.0 L/h",
      currentConsumption: "26.8 L/h",
      projectedConsumption: "26.8 L/h",
      currentLoad: "98 kW",
      projectedLoad: "98 kW",
      backupLoad: "Bulk Storage Active",
      riskLevel: "LOW",
      riskScore: 28,
      healthScore: 82.0,
      healthDelta: -18.0,
      recommendation: "RECOMMENDED (MONITOR LOGISTICS)",
      recommendationText:
        "Station fuel stock stands at 81,600 L (126.8 days runway). A 7-day delivery delay leaves 119.8 days of safety margin, well above the 30-day emergency reserve floor.",
      systemsAffected: [
        { name: "Bulk Fuel Farm", status: "81,600 L (68.0% CAPACITY)" },
        { name: "Day Storage Tanks", status: "NOMINAL (100% FILLED)" },
        { name: "Fuel Trace Heaters", status: "ENGAGED (-24°C AMBIENT)" },
      ],
      chartData: {
        labels: ["Day 0", "Day 2", "Day 4", "Day 6", "Day 7"],
        currentFuel: [26.8, 26.8, 26.8, 26.8, 26.8],
        projectedFuel: [26.8, 26.8, 26.8, 26.8, 26.8],
        currentPower: [98, 98, 98, 98, 98],
        projectedPower: [98, 98, 98, 98, 98],
        indoorTemp: [21.4, 21.4, 21.4, 21.4, 21.4],
        waterReserve: [18200, 18200, 18200, 18200, 18200],
        healthScore: [100, 95, 90, 85, 82],
      },
    },
    cascadingEffects: [
      { step: 1, system: "PRIMARY_TRIGGER", title: "Resupply Delay", description: "Vessel arrival deferred by 7.0 days due to pack-ice", severity: "LOW", trigger_time: "T+0d", mitigation_target: "Engage Fuel Conservation" },
      { step: 2, system: "HABITAT_SAFETY", title: "Bulk Fuel Drawdown", description: "Fuel buffer draws down to 77,098 L", severity: "LOW", trigger_time: "T+7d", mitigation_target: "No rationing required" },
    ],
    thresholdBreaches: [],
    mitigationStrategies: [
      { strategy_id: "STRAT-A", name: "Eco-Mode Power Setback", description: "Reduce non-critical heating by 5% to preserve fuel", power_deficit_kw: 0.0, delivered_power_kw: 93.0, active_generators: ["G1", "G2"], fuel_delta: "+220 L Saved", risk_level: "LOW", risk_score: 15, health_score: 96.0, is_recommended: true, action_steps: ["Throttle auxiliary lab heating"] },
    ],
    aiResponse: `DHRUVNETRA AI OPERATIONAL ASSESSMENT:

Station: MAITRI | Scenario: LOGISTICS SUPPLY DELAY | Duration: 7.0 days
Calculated Risk: LOW (Index: 28/100) | Fuel Runway: 119.8 Days Remaining

## LOGISTICS IMPACT
• Current Bulk Reserve: 81,600 L (126.8 days endurance).
• Projected Stock at T+7d: ~77,098 L (119.8 days endurance).
• Safe Margin: Substantially exceeds mandatory 30-day polar reserve floor.
• Station Health: Baseline 100/100 -> Projected 82/100 (Δ -18 pts).

OPERATIONAL DIRECTIVE:
RECOMMENDED. Zero emergency rationing required. Maintain standard generator rotation schedule.`,
  },
  {
    id: "blizzard_protocol_prep",
    title: "Severe Blizzard Protocol (Cat-3 Storm)",
    category: "EMERGENCY",
    query: "What if Category 3 Blizzard hits with 110 km/h winds and power grid isolates into storm mode?",
    health: {
      baseline_score: 100.0,
      projected_score: 68.0,
      delta: -32.0,
      status: "DEGRADED",
      deductions: [
        { penalty: 20.0, reason: "Extreme Blizzard Weather", metric: "Wind speed: 110 km/h" },
        { penalty: 12.0, reason: "Elevated Electrical Draw", metric: "Heating load: 105 kW" },
      ],
    },
    impact: {
      fuelSaved: "0 L (Grid Hardening)",
      fuelBurnChange: "+6.8 L/h",
      currentConsumption: "28.5 L/h",
      projectedConsumption: "35.3 L/h",
      currentLoad: "98 kW (68%)",
      projectedLoad: "105 kW (87.5%)",
      backupLoad: "Dual Gen Active + Emergency Battery Bank",
      riskLevel: "HIGH",
      riskScore: 78,
      healthScore: 68.0,
      healthDelta: -32.0,
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
        currentPower: [98, 98, 98, 98, 98, 98],
        projectedPower: [98, 102, 105, 108, 104, 102],
        indoorTemp: [21.4, 20.2, 19.5, 19.0, 18.8, 18.5],
        waterReserve: [18200, 18100, 17900, 17500, 17000, 16500],
        healthScore: [100, 80, 75, 70, 68, 68],
      },
    },
    cascadingEffects: [
      { step: 1, system: "PRIMARY_TRIGGER", title: "Katabatic Blizzard", description: "Wind speed escalates to 110 km/h with -38°C wind chill", severity: "HIGH", trigger_time: "T+0m", mitigation_target: "Grid Hardening" },
      { step: 2, system: "LIFE_SUPPORT_HVAC", title: "Perimeter Thermal Loss", description: "Heating coils engage at 100% duty to counteract chill", severity: "MEDIUM", trigger_time: "T+15m", mitigation_target: "Radome Trace Heating" },
    ],
    thresholdBreaches: [],
    mitigationStrategies: [
      { strategy_id: "STRAT-A", name: "Dual-Gen Load Sharing", description: "Synchronize G1 and G2 to deliver 125 kW capacity", power_deficit_kw: 0.0, delivered_power_kw: 105.0, active_generators: ["G1", "G2"], fuel_delta: "+6.8 L/h", risk_level: "MEDIUM", risk_score: 45, health_score: 85.0, is_recommended: true, action_steps: ["Lock airlocks", "Stow external anemometers"] },
    ],
    aiResponse: `DHRUVNETRA AI OPERATIONAL ASSESSMENT:

SIMULATING CATEGORY-3 BLIZZARD CONTINGENCY (Winds >110 km/h, Visibility <5m):
• Microgrid isolates into dual-generator redundant load sharing (Gen 1 + Gen 2 active).
• External sensor masts automatically stow to prevent aerodynamic shear fatigue.
• Radome heating coils consume +8 kW to prevent wet-snow accumulation on SATCOM dish.
• Total Station Power Draw escalates to 105 kW (87.5% capacity).

OVERALL OPERATIONAL RISK: HIGH
RECOMMENDATION: EXECUTE PROTOCOL 4B. Restrict all outdoor movement and verify emergency communication beacon handshake with NCPOR Command.`,
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
    risk: "MEDIUM",
    status: "COMPLETED",
  },
  {
    id: "sim-1091",
    timestamp: "11:30 IST",
    date: "05 Sep 2026",
    station: "MAITRI",
    title: "Dual Gen 1 + Gen 2 shutdown",
    fuelSaved: "187.6 L",
    risk: "CRITICAL",
    status: "REJECTED (CRITICAL)",
  },
  {
    id: "sim-1090",
    timestamp: "09:05 IST",
    date: "05 Sep 2026",
    station: "BHARATI",
    title: "Water purification fault — 24h",
    fuelSaved: "0 L",
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
    text: "DHRUVNETRA AI Mission Assistant online. Connected to prototype station digital twin telemetry for Maitri & Bharati stations.",
    timestamp: "14:30:00",
  },
  {
    id: "msg-2",
    sender: "ai",
    text: "Welcome, Mission Commander. You can ask direct factual telemetry questions (e.g. \"What is the fuel level till now?\", \"What is the condition of generator 1?\", \"Is G1 running?\", \"What is the outdoor temperature?\") or pose hypothetical contingency simulations (e.g. \"What if I turned generator 1 and 2 off?\", \"What if Generator 1 shuts down for 7 hours?\", \"What if water purification plant fails for 24 hours?\").",
    timestamp: "14:30:01",
  },
];

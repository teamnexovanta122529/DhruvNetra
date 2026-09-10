/**
 * DHRUVNETRA - Potable Water & Life Support Telemetry
 * SIH 2026: Antarctic Digital Twin Platform (Maitri & Bharati)
 */

export const waterData = {
  MAITRI: {
    stationId: "MAITRI",
    summary: {
      totalCapacityL: 20000,
      currentLevelL: 18200,
      percentage: 91.0,
      dailyConsumptionL: 1450,
      dailyProductionL: 1600,
      estimatedDaysRemaining: 12.5,
      netDailyBalanceL: "+150 L/day (ACCUMULATING)",
      productionSource: "Priyadarshini Lake Heated Water Line & Snow Melter",
      purificationMethod: "Multi-Stage Sand Filter + UV + Activated Carbon",
      waterQualityTdsPpm: 42,
      waterPh: 7.2,
      pipelineFrostProtection: "ACTIVE (45°C TRACE)",
      leakageStatus: "ZERO_LEAKAGE",
      greywaterRecyclingEfficiencyPercent: 78.5,
      status: "NORMAL",
    },
    tanks: [
      {
        id: "WTANK-01",
        name: "Main Potable Reservoir A",
        capacityL: 10000,
        currentL: 9200,
        percentage: 92.0,
        tempC: 14.5,
        status: "OPTIMAL",
      },
      {
        id: "WTANK-02",
        name: "Secondary Potable Reservoir B",
        capacityL: 10000,
        currentL: 9000,
        percentage: 90.0,
        tempC: 14.2,
        status: "OPTIMAL",
      },
    ],
    productionUnits: [
      {
        id: "MELTER-01",
        name: "Thermal Snow Melt Plant",
        status: "RUNNING",
        outputLh: 45,
        energyKw: 12.4,
        health: "OPTIMAL",
      },
      {
        id: "LAKE-PUMP-01",
        name: "Priyadarshini Lake Sub-Ice Pump",
        status: "CYCLING",
        outputLh: 65,
        energyKw: 8.2,
        health: "OPTIMAL",
      },
    ],
    history24h: {
      timestamps: ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00", "Now"],
      storageL: [18050, 18020, 17980, 18120, 18250, 18200, 18180, 18210, 18200],
      consumptionRateLh: [25, 20, 45, 95, 110, 85, 90, 75, 60],
      productionRateLh: [60, 60, 70, 75, 75, 70, 65, 65, 65],
    },
  },

  BHARATI: {
    stationId: "BHARATI",
    summary: {
      totalCapacityL: 25000,
      currentLevelL: 23500,
      percentage: 94.0,
      dailyConsumptionL: 1720,
      dailyProductionL: 1900,
      estimatedDaysRemaining: 13.6,
      netDailyBalanceL: "+180 L/day (ACCUMULATING)",
      productionSource: "Desalination Reverse Osmosis (RO) & High-Yield Snow Melter",
      purificationMethod: "Seawater Desalination RO + Ozonation + Mineralization",
      waterQualityTdsPpm: 58,
      waterPh: 7.4,
      pipelineFrostProtection: "ACTIVE (48°C TRACE)",
      leakageStatus: "ZERO_LEAKAGE",
      greywaterRecyclingEfficiencyPercent: 88.2,
      status: "OPTIMAL",
    },
    tanks: [
      {
        id: "WTANK-01",
        name: "Central Potable Reservoir Alpha",
        capacityL: 12500,
        currentL: 11800,
        percentage: 94.4,
        tempC: 15.0,
        status: "OPTIMAL",
      },
      {
        id: "WTANK-02",
        name: "Central Potable Reservoir Beta",
        capacityL: 12500,
        currentL: 11700,
        percentage: 93.6,
        tempC: 14.8,
        status: "OPTIMAL",
      },
    ],
    productionUnits: [
      {
        id: "RO-DESAL-01",
        name: "Seawater RO Desalination Unit A",
        status: "RUNNING",
        outputLh: 55,
        energyKw: 14.0,
        health: "OPTIMAL",
      },
      {
        id: "MELTER-02",
        name: "Continuous Polar Snow Melter",
        status: "RUNNING",
        outputLh: 40,
        energyKw: 10.5,
        health: "OPTIMAL",
      },
    ],
    history24h: {
      timestamps: ["00:00", "03:00", "06:00", "09:00", "12:00", "15:00", "18:00", "21:00", "Now"],
      storageL: [23320, 23280, 23240, 23410, 23560, 23510, 23480, 23520, 23500],
      consumptionRateLh: [30, 25, 55, 115, 130, 100, 105, 90, 72],
      productionRateLh: [75, 75, 80, 85, 85, 80, 80, 78, 79],
    },
  },
};

export default waterData;

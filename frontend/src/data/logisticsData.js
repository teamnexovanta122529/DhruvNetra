/**
 * DHRUVNETRA - Logistics, Cargo & Expedition Fleet Telemetry
 * SIH 2026: Antarctic Digital Twin Platform (Maitri & Bharati)
 */

export const logisticsData = {
  MAITRI: {
    stationId: "MAITRI",
    summary: {
      essentialStockDays: 145,
      foodProvisionsPercent: 88,
      medicalSuppliesPercent: 95,
      generatorSparesPercent: 84,
      winterReadinessScore: 92,
      activeVehiclesCount: 6,
      totalVehiclesCount: 8,
      nextAirDropDate: "12 NOV 2026",
      nextVoyageShip: "MV Vasiliy Golovnin (Voyage 46)",
      status: "OPTIMAL",
    },
    criticalInventory: [
      { id: "INV-01", item: "Freeze-Dried Rations & Dry Provisions", quantity: "4,200 kg", daysSupply: 160, status: "OPTIMAL", minThreshold: "1,500 kg" },
      { id: "INV-02", item: "Diesel Engine Oil & Filters (15W-40)", quantity: "18 Drums / 32 Filters", daysSupply: 180, status: "OPTIMAL", minThreshold: "6 Drums" },
      { id: "INV-03", item: "Potable Water Micro-Filter Membranes", quantity: "14 Cartridges", daysSupply: 210, status: "OPTIMAL", minThreshold: "4 Cartridges" },
      { id: "INV-04", item: "Medical Oxygen & Critical Resuscitation", quantity: "8 Cylinders", daysSupply: 240, status: "OPTIMAL", minThreshold: "3 Cylinders" },
      { id: "INV-05", item: "Ethylene Glycol Thermal Fluid (60/40)", quantity: "1,200 L", daysSupply: 190, status: "OPTIMAL", minThreshold: "400 L" },
      { id: "INV-06", item: "SATCOM Terminal BUC/LNB Spare Kits", quantity: "2 Modular Spares", daysSupply: 365, status: "OPTIMAL", minThreshold: "1 Unit" },
    ],
    shipments: [
      {
        id: "VOY-46-MT",
        vessel: "MV Vasiliy Golovnin (Icebreaker Charter)",
        origin: "Cape Town Port, South Africa",
        destination: "Schirmacher Oasis Ice Edge (India Bay)",
        cargoManifest: "60,000 L Fuel, Fresh Produce, Generator 04 Overhaul Kit",
        status: "IN_TRANSIT",
        progressPercent: 35,
        eta: "14 JAN 2027",
        distanceRemainingNm: "1,420 NM",
      },
      {
        id: "DRO-09-MT",
        vessel: "DROMLAN Polar Air Corridor (Basler BT-67)",
        origin: "Novo Runway / Cape Town",
        destination: "Maitri Skiway",
        cargoManifest: "Scientific Sensors, Medical Blood Bank, Mail Packets",
        status: "SCHEDULED",
        progressPercent: 0,
        eta: "12 NOV 2026",
        distanceRemainingNm: "Pending Flight Window",
      },
    ],
    vehicles: [
      { id: "VEH-01", name: "PistenBully 300 Polar Snowcat", type: "Heavy Groomer / Cargo", status: "OPERATIONAL", battery: "100%", fuelL: 180, location: "North Garage" },
      { id: "VEH-02", name: "PistenBully 100 Utility Cat", type: "Utility / Personnel", status: "OPERATIONAL", battery: "98%", fuelL: 110, location: "Lake Pump Staging" },
      { id: "VEH-03", name: "Ski-Doo Expedition Snowmobile 01", type: "Light Recon", status: "OPERATIONAL", battery: "95%", fuelL: 40, location: "Main Airlock" },
      { id: "VEH-04", name: "Ski-Doo Expedition Snowmobile 02", type: "Light Recon", status: "OPERATIONAL", battery: "92%", fuelL: 38, location: "Main Airlock" },
      { id: "VEH-05", name: "Kässbohrer Crane Sledge", type: "Heavy Lifting", status: "STANDBY", battery: "N/A", fuelL: 0, location: "Cargo Yard" },
      { id: "VEH-06", name: "Toyota Hilux Arctic Truck (Studded)", type: "Wheeled Transporter", status: "MAINTENANCE", battery: "84%", fuelL: 65, location: "Workshop Bay" },
    ],
  },

  BHARATI: {
    stationId: "BHARATI",
    summary: {
      essentialStockDays: 190,
      foodProvisionsPercent: 94,
      medicalSuppliesPercent: 98,
      generatorSparesPercent: 90,
      winterReadinessScore: 96,
      activeVehiclesCount: 8,
      totalVehiclesCount: 9,
      nextAirDropDate: "05 DEC 2026",
      nextVoyageShip: "MV Vasiliy Golovnin (Voyage 46)",
      status: "OPTIMAL",
    },
    criticalInventory: [
      { id: "INV-01", item: "Long-Life Polar Rations & Hydroponics Feeds", quantity: "5,800 kg", daysSupply: 220, status: "OPTIMAL", minThreshold: "2,000 kg" },
      { id: "INV-02", item: "Volvo Penta Engine Lubricants & Filters", quantity: "24 Drums / 48 Filters", daysSupply: 240, status: "OPTIMAL", minThreshold: "8 Drums" },
      { id: "INV-03", item: "RO High-Pressure Desalination Membranes", quantity: "18 Modules", daysSupply: 280, status: "OPTIMAL", minThreshold: "6 Modules" },
      { id: "INV-04", item: "Emergency Tele-Medicine & Surgical Packs", quantity: "12 Sealed Crates", daysSupply: 365, status: "OPTIMAL", minThreshold: "4 Crates" },
      { id: "INV-05", item: "Aviation Turbine Fuel (Jet A-1 Anti-Ice)", quantity: "15,000 L", daysSupply: 300, status: "OPTIMAL", minThreshold: "3,000 L" },
      { id: "INV-06", item: "Solid-State Inverter Power Electronics Spares", quantity: "4 Plug-In Packs", daysSupply: 365, status: "OPTIMAL", minThreshold: "2 Units" },
    ],
    shipments: [
      {
        id: "VOY-46-BH",
        vessel: "MV Vasiliy Golovnin (Icebreaker Charter)",
        origin: "Cape Town Port, South Africa",
        destination: "Larsemann Hills (Prydz Bay Anchorage)",
        cargoManifest: "90,000 L Polar Jet A-1, Lab Upgrades, Hydroponics Seeds",
        status: "IN_TRANSIT",
        progressPercent: 42,
        eta: "08 JAN 2027",
        distanceRemainingNm: "1,180 NM",
      },
      {
        id: "AIR-04-BH",
        vessel: "Kamov Ka-32 Polar Heavy Helicopter",
        origin: "Prydz Bay Research Fleet",
        destination: "Bharati Helipad",
        cargoManifest: "Radome Electronics & Scientific Cryo Cylinders",
        status: "STANDBY_WEATHER",
        progressPercent: 0,
        eta: "05 DEC 2026",
        distanceRemainingNm: "Helipad Ready",
      },
    ],
    vehicles: [
      { id: "VEH-01", name: "PistenBully 300 Polar Snowcat A", type: "Heavy Groomer / Cargo", status: "OPERATIONAL", battery: "100%", fuelL: 210, location: "Stilts Lower Garage" },
      { id: "VEH-02", name: "PistenBully 300 Polar Snowcat B", type: "Heavy Groomer / Cargo", status: "OPERATIONAL", battery: "99%", fuelL: 195, location: "Stilts Lower Garage" },
      { id: "VEH-03", name: "PistenBully 100 Expedition", type: "Utility / Personnel", status: "OPERATIONAL", battery: "96%", fuelL: 120, location: "Prydz Bay Track" },
      { id: "VEH-04", name: "Ski-Doo Skandic Snowmobile 01", type: "Fast Response", status: "OPERATIONAL", battery: "98%", fuelL: 42, location: "Main Vestibule" },
      { id: "VEH-05", name: "Ski-Doo Skandic Snowmobile 02", type: "Fast Response", status: "OPERATIONAL", battery: "95%", fuelL: 40, location: "Main Vestibule" },
      { id: "VEH-06", name: "Ski-Doo Skandic Snowmobile 03", type: "Fast Response", status: "OPERATIONAL", battery: "94%", fuelL: 40, location: "Helipad Apron" },
      { id: "VEH-07", name: "Hägglunds BV206 All-Terrain Tracked", type: "Amphibious Polar Carrier", status: "OPERATIONAL", battery: "92%", fuelL: 140, location: "North Bay Track" },
      { id: "VEH-08", name: "Kamov Ka-32 Helipad Ground Bowser", type: "Aviation Refueling", status: "OPERATIONAL", battery: "100%", fuelL: 320, location: "Bharati Helipad" },
      { id: "VEH-09", name: "Polar CAT 924K Wheel Loader", type: "Heavy Snow Clearing", status: "STANDBY", battery: "88%", fuelL: 150, location: "Workshop Yard" },
    ],
  },
};

export default logisticsData;

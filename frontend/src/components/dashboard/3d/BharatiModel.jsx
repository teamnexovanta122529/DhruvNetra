import React, { useMemo } from "react";
import * as THREE from "three";
import {
  TubeBetween,
  SiteContainer,
  TrackedVehicle,
  FuelTankAssembly,
  HelipadPlatform,
  StationAreaLabel,
} from "./StationComponents";
import {
  createTerrainGeometry,
  createRockOutcropGeometry,
  createSurfacePatchGeometry,
  createTerrainRibbonGeometry,
  createMergedBoxesGeometry,
  createTaperedPrismGeometry,
  terrainHeight,
} from "./station3dGeometry";

/* =========================================================
   BHARATI STATION HIGH-FIDELITY 3D DIGITAL TWIN
   (Larsemann Hills, East Antarctica · Commissioned 2012)
   
   Architecture & Verification:
   - 50m × 30m × 12m wrap-around aerodynamic shell with 12° skirts
   - 134 ISO container module packing enclosed in steel portal frame
   - 86 Elevated support pillars including 8 heavy Y-shaped bents
   - North & South 15° forward-inclined panoramic observation lounges
   - Level 2: 4 specialized science labs, 3×100 kVA CHP microgrid, RO/MBR water plant
   - Level 3: 20 living cabins, panoramic lounge, dining/kitchen, comms
   - Level 4: Rooftop AHU tapered plant room & open observation terrace
   - 13-Tank Fuel Farm (296 kL), 900 m² Helipad, 18m SATCOM Radome, Seawater Pump
========================================================= */

export default function BharatiModel({
  sceneMode = "exterior",
  floorMode = "all",
  selectedComponent: _selectedComponent = null,
  hoveredComponent: _hoveredComponent = null,
  onSelectComponent = null,
  onHoverComponent = null,
  showLabels = false,
}) {
  const isCutaway = sceneMode === "cutaway";
  const isInterior = sceneMode === "interior";
  const isStructure = sceneMode === "structure";
  const isExterior = sceneMode === "exterior";

  const showShell = isExterior || isCutaway;
  const showEastCutaway = isExterior; // removed in cutaway
  const showInterior = isCutaway || isInterior;
  const showLower = showInterior && floorMode !== "upper";
  const showUpper = showInterior && floorMode !== "lower";
  const showStructure = isStructure || isCutaway || isInterior;

  const handlePointerOver = (e, id) => {
    e.stopPropagation();
    document.body.style.cursor = "pointer";
    onHoverComponent?.(id);
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    document.body.style.cursor = "default";
    onHoverComponent?.(null);
  };

  const handleClick = (e, id) => {
    e.stopPropagation();
    onSelectComponent?.(id);
  };

  /* =======================================================
     1. ENVIRONMENT & GEOLOGICAL TERRAIN (LARSEMANN HILLS)
  ======================================================= */
  const terrainGeo = useMemo(() => createTerrainGeometry(760, 110, "granite"), []);

  const rockOutcrops = useMemo(() => {
    const zones = [
      { center: [-78, -4], spread: [58, 42], count: 11, scale: [2.5, 9] },
      { center: [82, 28], spread: [54, 65], count: 12, scale: [2.2, 8] },
      { center: [-145, 125], spread: [72, 68], count: 14, scale: [3, 13] },
      { center: [148, 155], spread: [85, 72], count: 14, scale: [3, 14] },
      { center: [-95, -155], spread: [92, 62], count: 13, scale: [3, 15] },
      { center: [155, -145], spread: [90, 75], count: 13, scale: [3, 15] },
    ];
    const items = [];
    let idx = 0;
    for (const zone of zones) {
      for (let r = 0; r < zone.count; r += 1) {
        let x = zone.center[0] + (Math.sin(idx * 3.7) * 0.5) * zone.spread[0] * 2;
        const z = zone.center[1] + (Math.cos(idx * 2.3) * 0.5) * zone.spread[1] * 2;
        if (Math.abs(x) < 34 && Math.abs(z) < 39) x += x < 0 ? -38 : 38;
        const radius = zone.scale[0] + ((idx * 17) % 10) / 10 * (zone.scale[1] - zone.scale[0]);
        items.push({
          key: `rock-${idx}`,
          geometry: createRockOutcropGeometry(x, z, radius * 1.8, radius * 0.6, 0.45 + radius * 0.25, 5300 + idx * 17),
          dark: idx % 4 === 0,
        });
        idx += 1;
      }
    }
    return items;
  }, []);

  const snowDrifts = useMemo(() => {
    const drifts = [
      [-42, -30, 16, 3.2, -12], [34, -41, 20, 3.8, 18], [-44, 16, 14, 2.8, 22],
      [46, 27, 18, 3.2, -18], [-75, 70, 25, 4.5, 10], [72, 96, 28, 5.5, -7],
      [-126, 147, 38, 7, -14], [122, 170, 42, 8, 16], [-175, -82, 36, 6, 12],
      [168, -115, 46, 8, -9], [-68, -176, 34, 6, -4], [42, -205, 45, 8, 18],
      [-215, 40, 50, 9, 9], [224, 52, 48, 8, -12], [-132, 238, 39, 7, 13],
      [142, 248, 55, 9, -8], [7, 142, 22, 4, 2], [13, -74, 17, 3.5, -16],
    ];
    return drifts.map(([x, z, rx, rz, rot], i) => ({
      key: `snow-${i}`,
      geometry: createSurfacePatchGeometry(x, z, rx, rz, rot, 9200 + i * 37, 0.11, 22),
    }));
  }, []);

  const frozenPools = useMemo(() => {
    const pools = [
      [-55, -12, 17, 7, -14],
      [73, 122, 23, 11, 7],
      [-117, 198, 33, 14, -9],
    ];
    return pools.map(([x, z, rx, rz, rot], i) => ({
      key: `pool-${i}`,
      geometry: createSurfacePatchGeometry(x, z, rx, rz, rot, 11100 + i * 53, 0.14, 26),
    }));
  }, []);

  const roads = useMemo(() => {
    const stationLoop = [
      [-17, -33], [-34, -25], [-41, -8], [-38, 18], [-24, 31], [4, 35],
      [32, 29], [42, 10], [40, -17], [25, -31], [-17, -33],
    ];
    const northApproach = [
      [-24, 31], [-35, 59], [-29, 92], [-10, 124], [22, 151], [48, 178], [69, 214], [77, 235],
    ];
    const coastalAccess = [
      [34, 27], [58, 62], [76, 108], [91, 157], [102, 211], [107, 272], [106, 292],
    ];
    const westService = [
      [-39, 7], [-65, 14], [-88, 7], [-108, -9], [-124, -31],
    ];
    return [
      createTerrainRibbonGeometry(stationLoop, 6.8, 0.12),
      createTerrainRibbonGeometry(northApproach, 6.4, 0.11),
      createTerrainRibbonGeometry(coastalAccess, 5.4, 0.11),
      createTerrainRibbonGeometry(westService, 5.2, 0.11),
    ];
  }, []);

  /* =======================================================
     2. STRUCTURAL 86 PILLARS & Y-BENTS
  ======================================================= */
  const { supportColumns, columnFootings } = useMemo(() => {
    const posts = [];
    const footings = [];
    const xPositions = [-10.5, -3.5, 3.5, 10.5];
    for (let row = 0; row < 20; row += 1) {
      const z = -22.4 + row * 2.36;
      for (const x of xPositions) {
        const h = 2.4 + ((row + Math.round(x)) % 4) * 0.16;
        posts.push({ position: [x, 1.55, z], scale: [0.22, h, 0.22] });
        footings.push({ position: [x, 0.1, z], scale: [0.65, 0.18, 0.65] });
      }
    }
    return {
      supportColumns: createMergedBoxesGeometry(posts),
      columnFootings: createMergedBoxesGeometry(footings),
    };
  }, []);

  /* =======================================================
     3. 134 ISO CONTAINER MODULES & STEEL PORTAL FRAME
  ======================================================= */
  const { upperModules, lowerModules, portalFrame } = useMemo(() => {
    const modW = 2.4384;
    const modL = 6.096;
    const modH = 2.8956;

    const uParts = [];
    const upperRows = [-9.15, -3.05, 3.05, 9.15];
    const upperStart = -23.16;
    for (let slot = 0; slot < 20; slot += 1) {
      for (let row = 0; row < upperRows.length; row += 1) {
        uParts.push({
          position: [upperRows[row], 8.02, upperStart + slot * modW],
          scale: [modL - 0.16, modH - 0.18, modW - 0.12],
          colorIdx: (slot + row * 2) % 3,
        });
      }
    }

    const lParts = [];
    const lowerRows = [-7.0, 0, 7.0];
    const lowerStart = -20.72;
    for (let slot = 0; slot < 18; slot += 1) {
      for (let row = 0; row < lowerRows.length; row += 1) {
        lParts.push({
          position: [lowerRows[row], 4.92, lowerStart + slot * modW],
          scale: [modL - 0.16, modH - 0.18, modW - 0.12],
          colorIdx: (slot + row + 1) % 3,
        });
      }
    }

    const frameParts = [];
    for (let st = 0; st < 22; st += 1) {
      const z = -25.2 + st * 2.4;
      frameParts.push({ position: [0, 3.35, z], scale: [29.2, 0.22, 0.22] });
      frameParts.push({ position: [0, 6.52, z], scale: [29.8, 0.18, 0.18] });
      frameParts.push({ position: [0, 9.92, z], scale: [29.8, 0.2, 0.2] });
      frameParts.push({ position: [-14.65, 6.6, z], scale: [0.18, 6.6, 0.18] });
      frameParts.push({ position: [14.65, 6.6, z], scale: [0.18, 6.6, 0.18] });
    }
    for (const x of [-12.2, -6.1, 0, 6.1, 12.2]) {
      frameParts.push({ position: [x, 3.35, 0], scale: [0.2, 0.2, 50.4] });
      frameParts.push({ position: [x, 6.55, 0], scale: [0.16, 0.16, 50.4] });
      frameParts.push({ position: [x, 9.95, 0], scale: [0.18, 0.18, 50.4] });
    }

    return {
      upperModules: uParts,
      lowerModules: lParts,
      portalFrame: createMergedBoxesGeometry(frameParts),
    };
  }, []);

  const ahuPrism = useMemo(() => createTaperedPrismGeometry(11.5, 8.5, 2.55, 11.5), []);

  return (
    <group position={[0, 0, 0]}>
      {/* =====================================================
          1. ENVIRONMENT & GEOLOGICAL TERRAIN (LARSEMANN HILLS)
      ===================================================== */}
      <group name="BharatiEnvironment">
        {/* Procedural Vertex-Shaded Granite Mesh */}
        <mesh geometry={terrainGeo} receiveShadow castShadow>
          <meshStandardMaterial vertexColors roughness={0.88} metalness={0.05} />
        </mesh>

        {/* Metamorphic Rock Outcrops */}
        {rockOutcrops.map((rock) => (
          <mesh key={rock.key} geometry={rock.geometry} castShadow receiveShadow>
            <meshStandardMaterial color={rock.dark ? "#334155" : "#64748b"} roughness={0.9} metalness={0.05} />
          </mesh>
        ))}

        {/* Wind-Packed Snow Drifts */}
        {snowDrifts.map((snow) => (
          <mesh key={snow.key} geometry={snow.geometry} receiveShadow>
            <meshStandardMaterial color="#f8fafc" roughness={0.6} metalness={0.02} />
          </mesh>
        ))}

        {/* Seasonal Frozen Meltwater Ponds */}
        {frozenPools.map((pool) => (
          <mesh key={pool.key} geometry={pool.geometry} receiveShadow>
            <meshStandardMaterial color="#38bdf8" roughness={0.15} metalness={0.3} transparent opacity={0.85} />
          </mesh>
        ))}

        {/* Station Road Network */}
        {roads.map((road, idx) => (
          <mesh key={idx} geometry={road} receiveShadow>
            <meshStandardMaterial color="#334155" roughness={0.95} metalness={0.05} />
          </mesh>
        ))}

        {/* Quilty Bay Water Body */}
        <mesh position={[0, -14.2, 335]} receiveShadow>
          <boxGeometry args={[900, 0.55, 330]} />
          <meshStandardMaterial color="#0369a1" roughness={0.1} metalness={0.2} transparent opacity={0.9} />
        </mesh>
      </group>

      {/* =====================================================
          2. STRUCTURAL STILTS & Y-SUPPORT COLUMNS
      ===================================================== */}
      {showStructure && (
        <group name="SupportStructure">
          {/* Concrete Footing Pads */}
          <mesh geometry={columnFootings} receiveShadow>
            <meshStandardMaterial color="#334155" roughness={0.9} />
          </mesh>

          {/* Steel Support Columns */}
          <mesh geometry={supportColumns} castShadow>
            <meshStandardMaterial color="#475569" metalness={0.85} roughness={0.28} />
          </mesh>

          {/* 3 Heavy Y-Support Bents with GEWI Footings */}
          {[[-9.5, 21], [0, 21], [9.5, 21]].map(([yx, yz], i) => (
            <group key={i}>
              <mesh position={[yx, 0.12, yz]} receiveShadow>
                <boxGeometry args={[1.35, 0.24, 1.35]} />
                <meshStandardMaterial color="#334155" roughness={0.85} />
              </mesh>
              <TubeBetween start={[yx - 1.4, 0.2, yz]} end={[yx, 3.35, yz]} radius={0.17} color="#475569" />
              <TubeBetween start={[yx + 1.4, 0.2, yz]} end={[yx, 3.35, yz]} radius={0.17} color="#475569" />
            </group>
          ))}

          {/* Exterior Entrance Stairs */}
          {[-16.3, 16.3].map((sx) => (
            <group key={sx}>
              {[...Array(15)].map((_, step) => (
                <mesh key={step} position={[sx, 0.05 + (step + 0.5) * (3.4 / 15), -5.5 - (step + 0.5) * (6.2 / 15)]} castShadow>
                  <boxGeometry args={[3, 3.4 / 15, 6.2 / 15 + 0.05]} />
                  <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.35} />
                </mesh>
              ))}
              <TubeBetween start={[sx - 1.4, 0.9, -5.5]} end={[sx - 1.4, 4.3, -11.7]} radius={0.045} color="#1e293b" />
              <TubeBetween start={[sx + 1.4, 0.9, -5.5]} end={[sx + 1.4, 4.3, -11.7]} radius={0.045} color="#1e293b" />
            </group>
          ))}
        </group>
      )}

      {/* =====================================================
          3. 134 ISO MODULES & PORTAL STEEL FRAME (STRUCTURE MODE)
      ===================================================== */}
      {showStructure && (
        <group name="StructureModules">
          <mesh geometry={portalFrame} castShadow>
            <meshStandardMaterial color="#475569" metalness={0.88} roughness={0.3} />
          </mesh>

          {upperModules.map((m, idx) => (
            <mesh key={`up-${idx}`} position={m.position} castShadow>
              <boxGeometry args={m.scale} />
              <meshStandardMaterial
                color={m.colorIdx === 0 ? "#7a291a" : m.colorIdx === 1 ? "#29613d" : "#cbd5e1"}
                metalness={0.4}
                roughness={0.35}
              />
            </mesh>
          ))}

          {lowerModules.map((m, idx) => (
            <mesh key={`low-${idx}`} position={m.position} castShadow>
              <boxGeometry args={m.scale} />
              <meshStandardMaterial
                color={m.colorIdx === 0 ? "#7a291a" : m.colorIdx === 1 ? "#29613d" : "#cbd5e1"}
                metalness={0.4}
                roughness={0.35}
              />
            </mesh>
          ))}
        </group>
      )}

      {/* =====================================================
          4. MAIN ARCHITECTURAL EXTERIOR ENVELOPE
      ===================================================== */}
      {showShell && !isStructure && (
        <group
          name="ArchitecturalShell"
          onClick={(e) => handleClick(e, "MAIN_BUILDING")}
          onPointerOver={(e) => handlePointerOver(e, "MAIN_BUILDING")}
          onPointerOut={handlePointerOut}
        >
          {/* Base Platform */}
          <mesh position={[0, 3.35, 0]} castShadow receiveShadow>
            <boxGeometry args={[29.5, 0.48, 50.4]} />
            <meshStandardMaterial color="#1e293b" metalness={0.65} roughness={0.38} />
          </mesh>

          {/* Aerodynamic Lower Skirts (West & East) */}
          <mesh position={[-14.45, 5.05, 0]} rotation={[0, 0, THREE.MathUtils.degToRad(-12)]} castShadow>
            <boxGeometry args={[0.75, 3.2, 50.1]} />
            <meshStandardMaterial
              color="#0f172a"
              metalness={0.5}
              roughness={0.38}
              transparent={isCutaway}
              opacity={isCutaway ? 0.35 : 1.0}
            />
          </mesh>
          {showEastCutaway && (
            <mesh position={[14.45, 5.05, 0]} rotation={[0, 0, THREE.MathUtils.degToRad(12)]} castShadow>
              <boxGeometry args={[0.75, 3.2, 50.1]} />
              <meshStandardMaterial color="#0f172a" metalness={0.5} roughness={0.38} />
            </mesh>
          )}

          {/* Long Façade Windows & Panels (West Side) */}
          {[...Array(21)].map((_, bay) => {
            const z = -24.2 + bay * 2.42;
            const warm = bay % 5 === 0;
            return (
              <group key={`west-bay-${bay}`}>
                <mesh position={[-14.92, 9.42, z]} castShadow>
                  <boxGeometry args={[0.34, 1.05, 2.31]} />
                  <meshStandardMaterial color="#e2e8f0" metalness={0.6} roughness={0.35} />
                </mesh>
                <mesh position={[-15.11, 8.18, z]}>
                  <boxGeometry args={[0.18, 1.5, 2.14]} />
                  <meshStandardMaterial
                    color={warm ? "#0284c7" : "#0f172a"}
                    emissive={warm ? "#f59e0b" : "#0369a1"}
                    emissiveIntensity={warm ? 0.5 : 0.2}
                    metalness={0.3}
                    roughness={0.08}
                    transparent
                    opacity={0.82}
                  />
                </mesh>
                <mesh position={[-14.9, 6.98, z]} castShadow>
                  <boxGeometry args={[0.32, 0.82, 2.31]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.78} roughness={0.38} />
                </mesh>
              </group>
            );
          })}

          {/* East Side Façade (Removable in Cutaway) */}
          {showEastCutaway &&
            [...Array(21)].map((_, bay) => {
              const z = -24.2 + bay * 2.42;
              return (
                <group key={`east-bay-${bay}`}>
                  <mesh position={[14.92, 9.42, z]} castShadow>
                    <boxGeometry args={[0.34, 1.05, 2.31]} />
                    <meshStandardMaterial color="#e2e8f0" metalness={0.6} roughness={0.35} />
                  </mesh>
                  <mesh position={[15.11, 8.18, z]}>
                    <boxGeometry args={[0.18, 1.5, 2.14]} />
                    <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.2} metalness={0.3} roughness={0.08} transparent opacity={0.82} />
                  </mesh>
                  <mesh position={[14.9, 6.98, z]} castShadow>
                    <boxGeometry args={[0.32, 0.82, 2.31]} />
                    <meshStandardMaterial color="#94a3b8" metalness={0.78} roughness={0.38} />
                  </mesh>
                </group>
              );
            })}

          {/* North and South Glazed Façades with Inclined Mullions */}
          {[1, -1].map((end) => {
            const z = end * 25.35;
            return (
              <group key={end}>
                <mesh position={[-11.35, 8.52, z]} castShadow>
                  <boxGeometry args={[6.6, 3.75, 0.34]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.38} />
                </mesh>
                <mesh position={[11.35, 8.52, z]} castShadow>
                  <boxGeometry args={[6.6, 3.75, 0.34]} />
                  <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.38} />
                </mesh>
                {[...Array(7)].map((_, b) => {
                  const x = -7.2 + b * 2.4;
                  return (
                    <group key={b}>
                      <mesh position={[x, 8.42, z + end * 0.18]} rotation={[THREE.MathUtils.degToRad(end * -15), 0, 0]}>
                        <boxGeometry args={[2.25, 3.25, 0.2]} />
                        <meshStandardMaterial
                          color="#0284c7"
                          emissive="#f59e0b"
                          emissiveIntensity={0.5}
                          metalness={0.2}
                          roughness={0.08}
                          transparent
                          opacity={0.82}
                        />
                      </mesh>
                      <mesh position={[x - 1.18, 8.42, z + end * 0.3]} rotation={[THREE.MathUtils.degToRad(end * -15), 0, 0]}>
                        <boxGeometry args={[0.11, 3.55, 0.13]} />
                        <meshStandardMaterial color="#334155" metalness={0.85} />
                      </mesh>
                    </group>
                  );
                })}
              </group>
            );
          })}

          {/* South Vehicle Garage Doors */}
          <mesh position={[0, 4.75, -25.28]} castShadow>
            <boxGeometry args={[23.8, 3.0, 0.42]} />
            <meshStandardMaterial color="#0f172a" metalness={0.6} roughness={0.38} />
          </mesh>
          {[-6.1, 0, 6.1].map((dx, i) => (
            <mesh key={i} position={[dx, 4.72, -25.55]} castShadow>
              <boxGeometry args={[5.45, 2.62, 0.18]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.78} roughness={0.38} />
            </mesh>
          ))}

          {/* Roof Panels & AHU Tapered Prism Enclosure */}
          {showEastCutaway && (
            <group>
              {[...Array(10)].map((_, st) => (
                <mesh key={st} position={[-13.45 + st * 2.99, 10.27, 0]} castShadow>
                  <boxGeometry args={[2.86, 0.22, 50.55]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.78} roughness={0.38} />
                </mesh>
              ))}
              <mesh position={[-2.1, 11.52, 3.2]} geometry={ahuPrism} castShadow>
                <meshStandardMaterial color="#cbd5e1" metalness={0.8} roughness={0.35} />
              </mesh>
              {/* Roof Observation Deck */}
              <mesh position={[3.1, 10.5, -5.6]} castShadow>
                <boxGeometry args={[10.5, 0.18, 8.2]} />
                <meshStandardMaterial color="#0f172a" roughness={0.6} />
              </mesh>
              {/* Perimeter Deck Handrails */}
              <TubeBetween start={[-2.1, 11.1, -9.6]} end={[8.3, 11.1, -9.6]} radius={0.03} color="#cbd5e1" />
              <TubeBetween start={[-2.1, 11.1, -1.6]} end={[8.3, 11.1, -1.6]} radius={0.03} color="#cbd5e1" />
            </group>
          )}
        </group>
      )}

      {/* =====================================================
          5. LEVEL 2 INTERIOR (LABORATORIES & UTILITIES)
      ===================================================== */}
      {showLower && !isStructure && (
        <group name="Level2_Interior">
          {/* Level 2 Floor Plate */}
          <mesh position={[0, 3.62, 0]} receiveShadow>
            <boxGeometry args={[24.4, 0.18, 45.2]} />
            <meshStandardMaterial color="#475569" roughness={0.6} />
          </mesh>

          {/* Central Corridor */}
          <mesh position={[0, 3.75, 2]} receiveShadow>
            <boxGeometry args={[3.4, 0.08, 39]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.4} />
          </mesh>

          {/* 4 Specialized Laboratories (Interactive) */}
          <group
            name="Laboratories"
            onClick={(e) => handleClick(e, "LAB_AREA")}
            onPointerOver={(e) => handlePointerOver(e, "LAB_AREA")}
            onPointerOut={handlePointerOut}
          >
            {/* Electrical & Electronics Lab */}
            <mesh position={[-7.3, 3.82, 15.7]} receiveShadow>
              <boxGeometry args={[8.8, 0.22, 9.2]} />
              <meshStandardMaterial color="#0284c7" roughness={0.5} />
            </mesh>
            <mesh position={[-7.3, 4.3, 15.7]} castShadow>
              <boxGeometry args={[1.2, 0.76, 5.7]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.3} />
            </mesh>
            {[13.75, 15.05, 16.35, 17.65].map((oz) => (
              <mesh key={oz} position={[-7.3, 4.98, oz]} castShadow>
                <boxGeometry args={[0.55, 0.38, 0.48]} />
                <meshStandardMaterial color="#1e293b" emissive="#0284c7" emissiveIntensity={0.6} />
              </mesh>
            ))}

            {/* Life Sciences Lab */}
            <mesh position={[7.3, 3.82, 15.7]} receiveShadow>
              <boxGeometry args={[8.8, 0.22, 9.2]} />
              <meshStandardMaterial color="#16a34a" roughness={0.5} />
            </mesh>
            <mesh position={[7.3, 4.3, 15.7]} castShadow>
              <boxGeometry args={[1.2, 0.76, 5.7]} />
              <meshStandardMaterial color="#f8fafc" roughness={0.3} />
            </mesh>

            {/* Chemical Sciences Lab */}
            <mesh position={[-7.3, 3.82, 6.2]} receiveShadow>
              <boxGeometry args={[8.8, 0.22, 8.3]} />
              <meshStandardMaterial color="#0284c7" roughness={0.5} />
            </mesh>
            <mesh position={[-10.55, 4.55, 6.2]} castShadow>
              <boxGeometry args={[1.35, 1.25, 3.25]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>

            {/* Earth Sciences Lab */}
            <mesh position={[7.3, 3.82, 6.2]} receiveShadow>
              <boxGeometry args={[8.8, 0.22, 8.3]} />
              <meshStandardMaterial color="#16a34a" roughness={0.5} />
            </mesh>
            {[4.2, 6.2, 8.2].map((rz) => (
              <mesh key={rz} position={[10.55, 4.75, rz]} castShadow>
                <boxGeometry args={[1.25, 1.55, 1.55]} />
                <meshStandardMaterial color="#334155" />
              </mesh>
            ))}
          </group>

          {/* CHP Power Plant (Interactive) */}
          <group
            name="GeneratorPlant"
            onClick={(e) => handleClick(e, "GENERATOR_AREA")}
            onPointerOver={(e) => handlePointerOver(e, "GENERATOR_AREA")}
            onPointerOut={handlePointerOut}
          >
            <mesh position={[-7.3, 3.82, -5.0]} receiveShadow>
              <boxGeometry args={[8.8, 0.22, 10.3]} />
              <meshStandardMaterial color="#d97706" roughness={0.5} />
            </mesh>
            {[-8.2, -5.1, -2.0].map((uz, i) => (
              <group key={i} position={[-7.2, 3.73, uz]}>
                <mesh position={[0, 0.12, 0]} castShadow>
                  <boxGeometry args={[5.1, 0.22, 2.35]} />
                  <meshStandardMaterial color="#0f172a" />
                </mesh>
                <mesh position={[0, 0.86, 0]} castShadow>
                  <boxGeometry args={[4.7, 1.35, 2.12]} />
                  <meshStandardMaterial color="#f59e0b" metalness={0.3} roughness={0.4} />
                </mesh>
                <TubeBetween start={[-1.2, 1.42, -0.55]} end={[-1.2, 3.0, -0.55]} radius={0.13} color="#475569" />
              </group>
            ))}
            <TubeBetween start={[-4.9, 4.08, -9.4]} end={[-4.9, 4.08, -0.9]} radius={0.07} color="#dc2626" />
            <TubeBetween start={[-9.5, 5.45, -9.4]} end={[-9.5, 5.45, -0.9]} radius={0.09} color="#0284c7" />
          </group>

          {/* Water Treatment Plant (Interactive) */}
          <group
            name="WaterTreatment"
            onClick={(e) => handleClick(e, "WATER_TREATMENT")}
            onPointerOver={(e) => handlePointerOver(e, "WATER_TREATMENT")}
            onPointerOut={handlePointerOut}
          >
            <mesh position={[7.3, 3.82, -5.0]} receiveShadow>
              <boxGeometry args={[8.8, 0.22, 10.3]} />
              <meshStandardMaterial color="#0284c7" roughness={0.5} />
            </mesh>
            <mesh position={[7.1, 3.83, -4.1]} castShadow>
              <boxGeometry args={[6.2, 0.18, 3.2]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            {[0, 1, 2, 3, 4, 5].map((m) => (
              <TubeBetween
                key={m}
                start={[4.85, 4.41 + Math.floor(m / 2) * 0.72, -4.75 + (m % 2) * 1.05]}
                end={[8.9, 4.41 + Math.floor(m / 2) * 0.72, -4.75 + (m % 2) * 1.05]}
                radius={0.14}
                color="#f8fafc"
              />
            ))}
          </group>
        </group>
      )}

      {/* =====================================================
          6. LEVEL 3 INTERIOR (LIVING, LOUNGE & COMMON DECK)
      ===================================================== */}
      {showUpper && !isStructure && (
        <group name="Level3_Interior">
          {/* Level 3 Floor Plate */}
          <mesh position={[0, 6.74, 0]} receiveShadow>
            <boxGeometry args={[25.2, 0.2, 47.2]} />
            <meshStandardMaterial color="#334155" roughness={0.6} />
          </mesh>

          {/* Living Quarters (Interactive) */}
          <group
            name="LivingCabins"
            onClick={(e) => handleClick(e, "LIVING_AREA")}
            onPointerOver={(e) => handlePointerOver(e, "LIVING_AREA")}
            onPointerOut={handlePointerOut}
          >
            {[-1, 1].map((side) =>
              [...Array(10)].map((_, r) => {
                const z = -12.1 + r * 2.82;
                const x = side * 9.2;
                return (
                  <group key={`room-${side}-${r}`}>
                    <mesh position={[x, 7.02, z]} receiveShadow>
                      <boxGeometry args={[6.2, 0.22, 2.62]} />
                      <meshStandardMaterial color="#f8fafc" />
                    </mesh>
                    <mesh position={[x + side * 0.55, 7.36, z]} castShadow>
                      <boxGeometry args={[1.05, 0.35, 1.92]} />
                      <meshStandardMaterial color="#0284c7" />
                    </mesh>
                    <mesh position={[x - side * 1.45, 7.4, z]} castShadow>
                      <boxGeometry args={[0.7, 0.7, 1.3]} />
                      <meshStandardMaterial color="#b45309" />
                    </mesh>
                  </group>
                );
              })
            )}
          </group>

          {/* Panoramic Lounge (North Glazed End) */}
          <group
            name="ObservationLounge"
            onClick={(e) => handleClick(e, "LOUNGE")}
            onPointerOver={(e) => handlePointerOver(e, "LOUNGE")}
            onPointerOut={handlePointerOut}
          >
            <mesh position={[0, 6.92, 20.5]} receiveShadow>
              <boxGeometry args={[17.4, 0.08, 7.3]} />
              <meshStandardMaterial color="#091726" roughness={0.9} />
            </mesh>
            {[
              [-5.5, 18.6], [-2.0, 21.3], [2.0, 21.3], [5.5, 18.6], [-4.4, 22.4], [4.4, 22.4],
            ].map(([lx, lz], i) => (
              <mesh key={i} position={[lx, 7.4, lz]} castShadow>
                <boxGeometry args={[0.8, 0.8, 0.75]} />
                <meshStandardMaterial color="#020617" roughness={0.3} metalness={0.7} />
              </mesh>
            ))}
            <mesh position={[0, 7.22, 20.1]} castShadow>
              <boxGeometry args={[3.0, 0.26, 1.45]} />
              <meshStandardMaterial color="#b45309" roughness={0.4} />
            </mesh>
          </group>

          {/* Dining Hall & Kitchen (South End) */}
          <group
            name="DiningAndGalley"
            onClick={(e) => handleClick(e, "DINING_AREA")}
            onPointerOver={(e) => handlePointerOver(e, "DINING_AREA")}
            onPointerOut={handlePointerOut}
          >
            <mesh position={[-3.7, 6.92, -20.2]} receiveShadow>
              <boxGeometry args={[11, 0.08, 7.5]} />
              <meshStandardMaterial color="#b45309" roughness={0.5} />
            </mesh>
            {[[-6.2, -21.4], [-1.7, -21.4], [-6.2, -17.5], [-1.7, -17.5]].map(([tx, tz], i) => (
              <mesh key={i} position={[tx, 7.72, tz]} castShadow>
                <cylinderGeometry args={[1.05, 1.05, 0.08, 16]} />
                <meshStandardMaterial color="#d97706" />
              </mesh>
            ))}
            <mesh position={[7.8, 7.0, -19.9]} castShadow>
              <boxGeometry args={[6.5, 0.22, 7.7]} />
              <meshStandardMaterial color="#ea580c" />
            </mesh>
          </group>

          {/* Communications Room */}
          <group
            name="CommunicationsRoom"
            onClick={(e) => handleClick(e, "COMMUNICATION_AREA")}
            onPointerOver={(e) => handlePointerOver(e, "COMMUNICATION_AREA")}
            onPointerOut={handlePointerOut}
          >
            <mesh position={[-4.5, 7.0, -2.4]} receiveShadow>
              <boxGeometry args={[4.8, 0.22, 4.8]} />
              <meshStandardMaterial color="#ea580c" />
            </mesh>
            {[0, 1, 2, 3].map((rk) => (
              <mesh key={rk} position={[-5.8 + (rk % 2) * 1.45, 8.02, -3.4 + Math.floor(rk / 2) * 1.85]} castShadow>
                <boxGeometry args={[1.05, 2.05, 1.25]} />
                <meshStandardMaterial color="#0f172a" emissive="#0284c7" emissiveIntensity={0.5} />
              </mesh>
            ))}
          </group>
        </group>
      )}

      {/* =====================================================
          7. EXTERNAL INFRASTRUCTURE & LOGISTICS
      ===================================================== */}
      <group name="ExternalInfrastructure">
        {/* Fuel Farm (13 × 24 m³ Double-Hull Tanks) */}
        <group
          name="FuelFarm"
          onClick={(e) => handleClick(e, "FUEL_FARM")}
          onPointerOver={(e) => handlePointerOver(e, "FUEL_FARM")}
          onPointerOut={handlePointerOut}
        >
          <mesh position={[76, terrainHeight(76, 232) + 0.18, 232]} receiveShadow>
            <boxGeometry args={[27, 0.3, 21]} />
            <meshStandardMaterial color="#475569" roughness={0.8} />
          </mesh>
          {[...Array(13)].map((_, t) => {
            const row = t < 7 ? -1 : 1;
            const slot = t < 7 ? t : t - 7;
            const fx = 76 - 9 + slot * 3.1;
            const fz = 232 + row * 5;
            return (
              <FuelTankAssembly
                key={t}
                index={t + 1}
                position={[fx, terrainHeight(76, 232) + 0.28, fz]}
              />
            );
          })}
          <SiteContainer
            name="FuelPumpContainer"
            position={[89.5, terrainHeight(76, 232) + 1.65, 232]}
            color="#dc2626"
          />
        </group>

        {/* Helipads & Refuelling Container */}
        <group
          name="Helipads"
          onClick={(e) => handleClick(e, "HELIPAD")}
          onPointerOver={(e) => handlePointerOver(e, "HELIPAD")}
          onPointerOut={handlePointerOut}
        >
          <HelipadPlatform x={-72} z={-24} size={30} name="Primary Helipad" />
          <HelipadPlatform x={-103} z={4} size={20} name="Secondary Helipad" />
          <HelipadPlatform x={-101} z={-45} size={17} name="Wooden Helipad" />
          <SiteContainer
            name="HelipadFuelUnit"
            position={[-51, terrainHeight(-51, -25) + 1.3, -25]}
            color="#16a34a"
          />
        </group>

        {/* 18m SATCOM Radome */}
        <group
          name="SATCOM_Radome"
          onClick={(e) => handleClick(e, "SATCOM")}
          onPointerOver={(e) => handlePointerOver(e, "SATCOM")}
          onPointerOut={handlePointerOut}
        >
          <mesh position={[-86, terrainHeight(-86, 48) + 0.7, 48]} castShadow receiveShadow>
            <boxGeometry args={[20, 1.2, 20]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[-86, terrainHeight(-86, 48) + 10.4, 48]} castShadow>
            <sphereGeometry args={[9, 32, 32]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.4} />
          </mesh>
        </group>

        {/* Summer Camp & Emergency Shelters */}
        <group name="SummerCamp">
          {[...Array(8)].map((_, i) => (
            <SiteContainer
              key={i}
              name={`CampModule-${i + 1}`}
              position={[-82 + (i % 4) * 7, terrainHeight(-82 + (i % 4) * 7, 218 + Math.floor(i / 4) * 4) + 1.4, 218 + Math.floor(i / 4) * 4]}
              color={i % 3 === 0 ? "#0284c7" : "#f8fafc"}
            />
          ))}
        </group>

        {/* Seawater Pump House */}
        <group
          name="SeawaterPumpHouse"
          onClick={(e) => handleClick(e, "SEAWATER_PUMP")}
          onPointerOver={(e) => handlePointerOver(e, "SEAWATER_PUMP")}
          onPointerOut={handlePointerOut}
        >
          <SiteContainer
            name="SeawaterPump"
            position={[106, terrainHeight(106, 286) + 1.35, 286]}
            color="#94a3b8"
          />
        </group>

        {/* Logistics Yards & Refrigerated Food Stores */}
        <group
          name="LogisticsYard"
          onClick={(e) => handleClick(e, "CONTAINER_YARD")}
          onPointerOver={(e) => handlePointerOver(e, "CONTAINER_YARD")}
          onPointerOut={handlePointerOut}
        >
          {[
            [-46.5, -39, "#dc2626"], [-39.8, -39, "#f8fafc"], [-33.1, -39, "#16a34a"],
            [-46.5, -33.6, "#f8fafc"], [-39.8, -33.6, "#dc2626"], [-33.1, -33.6, "#0284c7"],
          ].map(([lx, lz, col], i) => (
            <SiteContainer
              key={i}
              name={`WestContainer-${i}`}
              position={[lx, terrainHeight(lx, lz) + 1.35, lz]}
              color={col}
            />
          ))}

          {[0, 1, 2].map((s) => (
            <SiteContainer
              key={s}
              name={`FoodStore-${s}`}
              position={[12 + s * 6.7, terrainHeight(12 + s * 6.7, -48) + 1.35, -48]}
              color="#f8fafc"
            />
          ))}
        </group>

        {/* Tracked Utility Vehicles (PistenBully Snowcats) */}
        <TrackedVehicle position={[22, -42]} rotation={-28} />
        <TrackedVehicle position={[42, 42]} rotation={158} />
      </group>

      {/* =====================================================
          8. 3D ROOM & COMPONENT LABELS (OPTIONAL OVERLAY)
      ===================================================== */}
      {showLabels && (
        <group name="Bharati3DLabels">
          {isExterior && (
            <StationAreaLabel
              position={[0, 13.5, 0]}
              text="Bharati Main Station"
              onClick={(e) => handleClick(e, "MAIN_BUILDING")}
            />
          )}
          {showLower && (
            <>
              <StationAreaLabel
                position={[0, 6.2, 11]}
                text="L2 Science Laboratories"
                onClick={(e) => handleClick(e, "LAB_AREA")}
              />
              <StationAreaLabel
                position={[-7.3, 6.2, -5]}
                text="L2 CHP Power Microgrid"
                onClick={(e) => handleClick(e, "GENERATOR_AREA")}
              />
              <StationAreaLabel
                position={[7.3, 6.2, -5]}
                text="L2 Water Treatment & RO"
                onClick={(e) => handleClick(e, "WATER_TREATMENT")}
              />
            </>
          )}
          {showUpper && (
            <>
              <StationAreaLabel
                position={[0, 9.8, 20.5]}
                text="L3 Panoramic Lounge"
                onClick={(e) => handleClick(e, "LOUNGE")}
              />
              <StationAreaLabel
                position={[0, 9.8, 7]}
                text="L3 Living Quarters"
                onClick={(e) => handleClick(e, "LIVING_AREA")}
              />
            </>
          )}
          <StationAreaLabel
            position={[76, terrainHeight(76, 232) + 5.5, 232]}
            text="296 kL Fuel Farm"
            onClick={(e) => handleClick(e, "FUEL_FARM")}
          />
          <StationAreaLabel
            position={[-72, terrainHeight(-72, -24) + 4.2, -24]}
            text="900 m² Helipad"
            onClick={(e) => handleClick(e, "HELIPAD")}
          />
          <StationAreaLabel
            position={[-86, terrainHeight(-86, 48) + 21.5, 48]}
            text="18 m SATCOM Radome"
            onClick={(e) => handleClick(e, "SATCOM")}
          />
        </group>
      )}
    </group>
  );
}

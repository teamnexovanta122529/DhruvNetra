import React, { useMemo, Fragment } from "react";
import * as THREE from "three";
import {
  TubeBetween,
  SiteContainer,
  TrackedVehicle,
  StationAreaLabel,
} from "./StationComponents";
import {
  createTerrainGeometry,
  createRockOutcropGeometry,
  createSurfacePatchGeometry,
  createTerrainRibbonGeometry,
  createMergedBoxesGeometry,
  terrainHeight,
} from "./station3dGeometry";

/* =========================================================
   MAITRI STATION HIGH-FIDELITY 3D DIGITAL TWIN
   (Schirmacher Oasis, Queen Maud Land, East Antarctica · 1989)
   
   Architecture & Verification:
   - 56m × 12m Main Block + Two 27m × 10m Wings (U-shaped 2-storey complex)
   - ~1,200 m² Area elevated ~2.0m on adjustable telescopic steel stilts
   - 6 × 62.5 kW Generator Hall (4 overwintering + 2 summer units)
   - 7-Tank Fuel Depot (110 kL low-pour Jet A-1 double-walled storage)
   - Priyadarshini Lake Freshwater Pumping & 260m Heated Insulated Pipeline
   - 26 Single Overwintering Living Cabins, Dining Hall, Galley, Boilers, Labs
   - 6.2m SATCOM Radome, 16.5m Met Mast, Workshop/Garage & Summer Camp
   - Schirmacher Gneiss Terrain, Bedrock Shelves, Meltwater Ponds & Gullies
========================================================= */

export default function MaitriModel({
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
  const showFrontCutaway = isExterior; // removed in cutaway / interior
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
     1. SCHIRMACHER OASIS PROCEDURAL GEOLOGY & ENVIRONMENT
  ======================================================= */
  const terrainGeo = useMemo(() => createTerrainGeometry(980, 110, "gneiss"), []);

  const bedrockShelves = useMemo(() => {
    const shelves = [
      [-8, -42, 84, 24, -7], [-82, 5, 62, 27, 10], [76, 67, 72, 28, 17],
      [2, 80, 100, 24, -4], [-176, 118, 94, 30, -12], [178, -52, 108, 32, 8],
      [-246, -115, 112, 34, 11], [265, 126, 98, 28, -16],
    ];
    return shelves.map(([x, z, rx, rz, rot], i) => ({
      key: `shelf-${i}`,
      geometry: createSurfacePatchGeometry(x, z, rx, rz, rot, 1200 + i * 47, 0.055, 30),
      dark: i % 3 === 0,
    }));
  }, []);

  const gneissBands = useMemo(() => {
    const bands = [
      [[-330, -142], [-282, -126], [-232, -106], [-184, -91], [-136, -69]],
      [[92, -205], [112, -164], [145, -118], [178, -70], [232, -31]],
      [[-302, 181], [-244, 164], [-184, 146], [-126, 130], [-70, 108]],
      [[132, 205], [171, 181], [215, 166], [268, 154], [325, 137]],
    ];
    return bands.map((points, i) => ({
      key: `band-${i}`,
      geometry: createTerrainRibbonGeometry(points, 7.5 + i, 0.07),
    }));
  }, []);

  const rockRidges = useMemo(() => {
    const items = [];
    for (let i = 0; i < 58; i += 1) {
      let x = (Math.sin(i * 4.7) * 0.5) * 760;
      const z = (Math.cos(i * 3.1) * 0.5) * 560;
      if (Math.abs(x) < 62 && Math.abs(z) < 58) x += x < 0 ? -75 : 75;
      const size = 4 + ((i * 13) % 13);
      items.push({
        key: `ridge-${i}`,
        geometry: createRockOutcropGeometry(x, z, size * 1.8, size * 0.6, 0.8 + size * 0.22, 2400 + i * 29),
        dark: i % 4 === 0,
      });
    }
    return items;
  }, []);

  const snowGullies = useMemo(() => {
    const gullies = [
      [-74, -22, 36, 7, 8], [58, 28, 42, 8, -7], [-125, 76, 62, 12, 11],
      [110, -96, 58, 11, -10], [-230, -45, 78, 14, 7], [218, 116, 72, 13, -6],
      [-48, -164, 52, 10, 3], [72, 177, 66, 12, -8], [292, -118, 84, 14, 4],
    ];
    return gullies.map(([x, z, rx, rz, rot], i) => ({
      key: `snow-${i}`,
      geometry: createSurfacePatchGeometry(x, z, rx, rz, rot, 4100 + i * 41, 0.1, 24),
    }));
  }, []);

  const frozenPonds = useMemo(() => {
    const ponds = [
      [-165, -20, 30, 9, 5], [122, 146, 27, 8, -9], [222, 73, 22, 7, 12],
    ];
    return ponds.map(([x, z, rx, rz, rot], i) => ({
      key: `pond-${i}`,
      geometry: createSurfacePatchGeometry(x, z, rx, rz, rot, 5200 + i * 31, 0.115, 26),
    }));
  }, []);

  const roads = useMemo(() => {
    const mainRoad = [[-230, 92], [-170, 65], [-112, 48], [-58, 28], [0, 12], [72, 15], [142, 34]];
    const lakeTrack = [[32, 22], [86, 17], [145, 5], [205, 2], [260, 14]];
    const loop = [[-36, -15], [0, -18], [36, -15], [40, 5], [36, 39], [18, 44], [-18, 44], [-36, 39], [-40, 5], [-36, -15]];
    const generatorSpur = [[-37, 8], [-58, 2], [-82, -15], [-103, -6], [-122, 12]];
    const summerTrack = [[18, 34], [37, 47], [57, 67], [86, 92]];
    const meltwaterChannel = [[35, -12], [54, -7], [75, 0], [98, 8], [124, 7]];
    return [
      { geo: createTerrainRibbonGeometry(mainRoad, 7.2, 0.11), color: "#334155" },
      { geo: createTerrainRibbonGeometry(lakeTrack, 5.4, 0.1), color: "#334155" },
      { geo: createTerrainRibbonGeometry(loop, 4.4, 0.125), color: "#334155" },
      { geo: createTerrainRibbonGeometry(generatorSpur, 5.2, 0.13), color: "#334155" },
      { geo: createTerrainRibbonGeometry(summerTrack, 2.4, 0.14), color: "#334155" },
      { geo: createTerrainRibbonGeometry(meltwaterChannel, 1.5, 0.14), color: "#38bdf8" },
    ];
  }, []);

  const hardstands = useMemo(() => {
    return [
      { geo: createSurfacePatchGeometry(0, -12, 20, 8, 0, 5602, 0.13, 28) },
      { geo: createSurfacePatchGeometry(0, 20, 15.5, 18, 0, 5621, 0.12, 28) },
      { geo: createSurfacePatchGeometry(-82, -15, 19, 13, -4, 5640, 0.12, 26) },
      { geo: createSurfacePatchGeometry(-122, 12, 25, 17, 6, 5650, 0.12, 26) },
      { geo: createSurfacePatchGeometry(-58, 27, 48, 25, -5, 5660, 0.11, 28) },
      { geo: createSurfacePatchGeometry(86, 92, 44, 20, 7, 5690, 0.11, 24) },
      { geo: createSurfacePatchGeometry(0, -330, 430, 105, 0, 6100, 0.18, 46), isGlacier: true },
    ];
  }, []);

  /* =======================================================
     2. TELESCOPIC STEEL STILTS GRID & ENTRANCE STAIRS
  ======================================================= */
  const { stiltColumns, stiltFootings, stiltBeams } = useMemo(() => {
    const columns = [];
    const footings = [];
    const beams = [];

    // Main Block Columns
    for (let x = -25; x <= 25; x += 5) {
      for (const z of [-5, 5]) {
        columns.push({ position: [x, 1.1, z], scale: [0.24, 2.2, 0.24] });
        footings.push({ position: [x, 0.08, z], scale: [0.65, 0.16, 0.65] });
      }
    }
    // Wing Columns
    for (const x of [-25, 25]) {
      for (let z = 9; z <= 31; z += 5.5) {
        columns.push({ position: [x, 1.1, z], scale: [0.24, 2.2, 0.24] });
        footings.push({ position: [x, 0.08, z], scale: [0.65, 0.16, 0.65] });
      }
    }

    // Floor-Level I-Beam Structural Grillage
    beams.push({ position: [0, 2.15, -5], scale: [50.4, 0.18, 0.2] });
    beams.push({ position: [0, 2.15, 5], scale: [50.4, 0.18, 0.2] });
    beams.push({ position: [-25, 2.15, 20], scale: [0.2, 0.18, 22.4] });
    beams.push({ position: [25, 2.15, 20], scale: [0.2, 0.18, 22.4] });

    return {
      stiltColumns: createMergedBoxesGeometry(columns),
      stiltFootings: createMergedBoxesGeometry(footings),
      stiltBeams: createMergedBoxesGeometry(beams),
    };
  }, []);

  const facadeJoints = useMemo(() => {
    const joints = [];
    for (let x = -26; x <= 26; x += 2) {
      joints.push({ position: [x, 4.95, -6.27], scale: [0.035, 5.28, 0.025] });
    }
    return createMergedBoxesGeometry(joints);
  }, []);

  /* =======================================================
     3. 3D "MAITRI" WORDMARK SEGMENTS
  ======================================================= */
  const wordmarkSegments = useMemo(() => {
    const segments = [];
    const addV = (x, y, h = 0.82) => { segments.push([x, y, 0.11, h, 0]); };
    const addH = (x, y, w = 0.72) => { segments.push([x, y, w, 0.11, 0]); };
    const bX = 7;
    // M
    addV(bX, 6.72); addV(bX + 0.72, 6.72);
    segments.push([bX + 0.2, 6.91, 0.1, 0.48, -28], [bX + 0.52, 6.91, 0.1, 0.48, 28]);
    // A
    const a = bX + 1.45; addV(a, 6.72); addV(a + 0.72, 6.72); addH(a + 0.36, 7.1); addH(a + 0.36, 6.75);
    // I
    const i1 = bX + 2.9; addV(i1 + 0.36, 6.72); addH(i1 + 0.36, 7.1); addH(i1 + 0.36, 6.34);
    // T
    const t = bX + 4.35; addH(t + 0.36, 7.1); addV(t + 0.36, 6.72);
    // R
    const r = bX + 5.8; addV(r, 6.72); addH(r + 0.36, 7.1); addH(r + 0.36, 6.75); addV(r + 0.72, 6.93, 0.35);
    segments.push([r + 0.53, 6.5, 0.1, 0.5, -34]);
    // I
    const i2 = bX + 7.25; addV(i2 + 0.36, 6.72); addH(i2 + 0.36, 7.1); addH(i2 + 0.36, 6.34);

    return segments;
  }, []);

  return (
    <group position={[0, 0, 0]}>
      {/* =====================================================
          1. SCHIRMACHER OASIS TERRAIN & PRIYADARSHINI LAKE
      ===================================================== */}
      <group name="MaitriEnvironment">
        <mesh geometry={terrainGeo} receiveShadow castShadow>
          <meshStandardMaterial vertexColors roughness={0.92} metalness={0.05} />
        </mesh>

        {bedrockShelves.map((shelf) => (
          <mesh key={shelf.key} geometry={shelf.geometry} receiveShadow>
            <meshStandardMaterial color={shelf.dark ? "#1e293b" : "#475569"} roughness={0.9} />
          </mesh>
        ))}

        {gneissBands.map((band) => (
          <mesh key={band.key} geometry={band.geometry} receiveShadow>
            <meshStandardMaterial color="#1e293b" roughness={0.92} />
          </mesh>
        ))}

        {rockRidges.map((ridge) => (
          <mesh key={ridge.key} geometry={ridge.geometry} castShadow receiveShadow>
            <meshStandardMaterial color={ridge.dark ? "#0f172a" : "#334155"} roughness={0.95} />
          </mesh>
        ))}

        {snowGullies.map((snow) => (
          <mesh key={snow.key} geometry={snow.geometry} receiveShadow>
            <meshStandardMaterial color="#f8fafc" roughness={0.6} />
          </mesh>
        ))}

        {frozenPonds.map((pond) => (
          <mesh key={pond.key} geometry={pond.geometry} receiveShadow>
            <meshStandardMaterial color="#bae6fd" roughness={0.1} metalness={0.4} transparent opacity={0.85} />
          </mesh>
        ))}

        {roads.map((road, idx) => (
          <mesh key={idx} geometry={road.geo} receiveShadow>
            <meshStandardMaterial color={road.color} roughness={0.95} />
          </mesh>
        ))}

        {hardstands.map((hs, idx) => (
          <mesh key={idx} geometry={hs.geo} receiveShadow>
            <meshStandardMaterial color={hs.isGlacier ? "#f8fafc" : "#334155"} roughness={hs.isGlacier ? 0.5 : 0.95} />
          </mesh>
        ))}

        {/* Route Markers (Alternating Red/White) */}
        {[
          [-213, 85], [-181, 70], [-146, 58], [-112, 48], [-80, 37], [-55, 26],
          [48, 16], [76, 17], [106, 23], [136, 32], [55, 64], [75, 84],
        ].map(([rx, rz], idx) => (
          <mesh key={idx} position={[rx, terrainHeight(rx, rz) + 0.65, rz]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 1.25, 8]} />
            <meshStandardMaterial color={idx % 2 === 0 ? "#dc2626" : "#ffffff"} roughness={0.3} />
          </mesh>
        ))}

        {/* Priyadarshini Lake Water Body */}
        <mesh position={[330, -4.2, 18]} receiveShadow>
          <cylinderGeometry args={[190, 74, 0.2, 42]} />
          <meshStandardMaterial color="#0284c7" roughness={0.12} metalness={0.4} transparent opacity={0.88} />
        </mesh>
      </group>

      {/* =====================================================
          2. SUPPORT STILTS, CROSS-BRACING & ENTRANCE STAIRS
      ===================================================== */}
      {showStructure && (
        <group
          name="MaitriFoundations"
          onClick={(e) => handleClick(e, "MAITRI_STRUCTURE")}
          onPointerOver={(e) => handlePointerOver(e, "MAITRI_STRUCTURE")}
          onPointerOut={handlePointerOut}
        >
          {/* Concrete Footings */}
          <mesh geometry={stiltFootings} receiveShadow>
            <meshStandardMaterial color="#334155" roughness={0.9} />
          </mesh>

          {/* Telescopic Steel Columns */}
          <mesh geometry={stiltColumns} castShadow>
            <meshStandardMaterial color="#475569" metalness={0.88} roughness={0.28} />
          </mesh>

          {/* Floor-Level Steel I-Beams */}
          <mesh geometry={stiltBeams} castShadow>
            <meshStandardMaterial color="#334155" metalness={0.88} roughness={0.3} />
          </mesh>

          {/* Main-block Foundation Cross-Braces */}
          {[-25, -20, -15, -10, -5, 0, 5, 10, 15, 20].map((x) => (
            <React.Fragment key={x}>
              <TubeBetween start={[x, 0.2, -5]} end={[x + 5, 2.05, -5]} radius={0.045} color="#475569" />
              <TubeBetween start={[x + 5, 0.2, 5]} end={[x, 2.05, 5]} radius={0.045} color="#475569" />
            </React.Fragment>
          ))}

          {/* Wing Foundation Cross-Braces */}
          {[-25, 25].map((wx) =>
            [9, 14.5, 20, 25.5].map((wz) => (
              <React.Fragment key={`${wx}-${wz}`}>
                <TubeBetween start={[wx, 0.2, wz]} end={[wx, 2.05, wz + 5.5]} radius={0.045} color="#475569" />
                <TubeBetween start={[wx, 2.05, wz]} end={[wx, 0.2, wz + 5.5]} radius={0.045} color="#475569" />
              </React.Fragment>
            ))
          )}

          {/* Entrance Staircase (11 Steps + Landing Platform + Handrails) */}
          <mesh position={[0, 2.2, -6.8]} castShadow receiveShadow>
            <boxGeometry args={[3.2, 0.16, 1.8]} />
            <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.35} />
          </mesh>
          {[...Array(11)].map((_, s) => (
            <mesh key={s} position={[0, 0.12 + s * 0.2, -9.6 + s * 0.34]} castShadow>
              <boxGeometry args={[2.8, 0.18, 0.44]} />
              <meshStandardMaterial color="#334155" metalness={0.8} roughness={0.35} />
            </mesh>
          ))}
          {[-1.35, 1.35].map((side) => (
            <React.Fragment key={side}>
              <TubeBetween start={[side, 0.8, -9.8]} end={[side, 2.95, -6.2]} radius={0.045} color="#1e293b" />
              <TubeBetween start={[side, 0.45, -9.8]} end={[side, 2.6, -6.2]} radius={0.03} color="#1e293b" />
            </React.Fragment>
          ))}
        </group>
      )}

      {/* =====================================================
          3. MAIN ARCHITECTURAL EXTERIOR ENVELOPE
      ===================================================== */}
      {showShell && !isStructure && (
        <group
          name="MaitriShell"
          onClick={(e) => handleClick(e, "MAITRI_MAIN")}
          onPointerOver={(e) => handlePointerOver(e, "MAITRI_MAIN")}
          onPointerOut={handlePointerOut}
        >
          {/* Main Block Opaque Rear & End Walls */}
          <mesh position={[0, 4.95, 6]} castShadow>
            <boxGeometry args={[56, 5.5, 0.24]} />
            <meshStandardMaterial
              color="#29613d"
              metalness={0.35}
              roughness={0.32}
              transparent={isCutaway}
              opacity={isCutaway ? 0.35 : 1.0}
            />
          </mesh>
          <mesh position={[-28, 4.95, 0]} castShadow>
            <boxGeometry args={[0.24, 5.5, 12]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.25} roughness={0.35} />
          </mesh>
          <mesh position={[28, 4.95, 0]} castShadow>
            <boxGeometry args={[0.24, 5.5, 12]} />
            <meshStandardMaterial color="#f8fafc" metalness={0.25} roughness={0.35} />
          </mesh>

          {/* Removable Front Cutaway Wall */}
          {showFrontCutaway && (
            <group>
              <mesh position={[0, 4.95, -6]} castShadow>
                <boxGeometry args={[56, 5.5, 0.24]} />
                <meshStandardMaterial color="#29613d" metalness={0.35} roughness={0.32} />
              </mesh>
              <mesh geometry={facadeJoints}>
                <meshStandardMaterial color="#1e293b" metalness={0.8} />
              </mesh>
            </group>
          )}

          {/* East & West Wings */}
          {[-23, 23].map((wx) => {
            const outX = wx < 0 ? -28 : 28;
            const inX = wx < 0 ? -18 : 18;
            return (
              <group key={wx}>
                <mesh position={[outX, 4.95, 19.5]} castShadow>
                  <boxGeometry args={[0.24, 5.5, 27]} />
                  <meshStandardMaterial
                    color="#29613d"
                    metalness={0.35}
                    roughness={0.32}
                    transparent={isCutaway}
                    opacity={isCutaway ? 0.35 : 1.0}
                  />
                </mesh>
                <mesh position={[wx, 4.95, 33]} castShadow>
                  <boxGeometry args={[10, 5.5, 0.24]} />
                  <meshStandardMaterial color="#f8fafc" metalness={0.25} roughness={0.35} />
                </mesh>
                {showFrontCutaway && (
                  <mesh position={[inX, 4.95, 19.5]} castShadow>
                    <boxGeometry args={[0.24, 5.5, 27]} />
                    <meshStandardMaterial color="#f8fafc" metalness={0.25} roughness={0.35} />
                  </mesh>
                )}
              </group>
            );
          })}

          {/* Roof Plates & Parapet Fascia */}
          {showFrontCutaway && (
            <group>
              <mesh position={[0, 7.7, 0]} castShadow>
                <boxGeometry args={[57, 0.32, 13.2]} />
                <meshStandardMaterial color="#94a3b8" metalness={0.78} roughness={0.38} />
              </mesh>
              {[-23, 23].map((wx) => (
                <mesh key={wx} position={[wx, 7.7, 19.5]} castShadow>
                  <boxGeometry args={[11, 0.32, 28.2]} />
                  <meshStandardMaterial color="#94a3b8" metalness={0.78} roughness={0.38} />
                </mesh>
              ))}
            </group>
          )}

          {/* Indian Tricolour Entrance Feature & Door */}
          {showFrontCutaway && (
            <group>
              <mesh position={[-3.2, 4.95, -6.24]}>
                <boxGeometry args={[3.2, 5.5, 0.08]} />
                <meshStandardMaterial color="#ea580c" roughness={0.3} />
              </mesh>
              <mesh position={[0, 4.95, -6.24]}>
                <boxGeometry args={[3.2, 5.5, 0.08]} />
                <meshStandardMaterial color="#ffffff" roughness={0.3} />
              </mesh>
              <mesh position={[3.2, 4.95, -6.24]}>
                <boxGeometry args={[3.2, 5.5, 0.08]} />
                <meshStandardMaterial color="#16a34a" roughness={0.3} />
              </mesh>

              {/* Main Entrance Dark Door with Viewing Porthole & Frame */}
              <mesh position={[0, 3.35, -6.31]} castShadow>
                <boxGeometry args={[2.0, 2.3, 0.12]} />
                <meshStandardMaterial color="#0f172a" metalness={0.8} roughness={0.4} />
              </mesh>
              <mesh position={[0, 3.65, -6.38]}>
                <cylinderGeometry args={[0.22, 0.22, 0.04, 16]} rotation={[Math.PI / 2, 0, 0]} />
                <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.1} />
              </mesh>

              {/* 3D "MAITRI" Extruded Wordmark */}
              {wordmarkSegments.map(([sx, sy, sw, sh, srot], idx) => (
                <mesh
                  key={idx}
                  position={[sx, sy, -6.37]}
                  rotation={[0, 0, THREE.MathUtils.degToRad(srot)]}
                >
                  <boxGeometry args={[sw, sh, 0.055]} />
                  <meshStandardMaterial color="#ffffff" roughness={0.2} metalness={0.1} />
                </mesh>
              ))}

              {/* Double-Row Front Windows with Metallic Framing */}
              {[3.65, 6.15].map((wy) =>
                [-5, -4, -3, -2, 2, 3, 4, 5].map((wIdx) => (
                  <group key={`${wy}-${wIdx}`} position={[wIdx * 4.4, wy, -6.13]}>
                    {/* Frame */}
                    <mesh>
                      <boxGeometry args={[2.3, 0.92, 0.05]} />
                      <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
                    </mesh>
                    {/* Glass Pane */}
                    <mesh position={[0, 0, 0.015]}>
                      <boxGeometry args={[2.14, 0.76, 0.04]} />
                      <meshStandardMaterial
                        color="#0284c7"
                        emissive="#0369a1"
                        emissiveIntensity={0.25}
                        metalness={0.4}
                        roughness={0.08}
                        transparent
                        opacity={0.85}
                      />
                    </mesh>
                  </group>
                ))
              )}
            </group>
          )}

          {/* Roof Communications & Meteorological Mast */}
          <mesh position={[12, 10.0, 0]} castShadow>
            <sphereGeometry args={[2.4, 32, 32]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.3} />
          </mesh>
          <TubeBetween start={[-15, 7.7, 1]} end={[-15, 16.5, 1]} radius={0.09} color="#475569" />
          {[10, 12.5, 15].map((mh) => (
            <TubeBetween key={mh} start={[-17.1, mh, 1]} end={[-12.9, mh, 1]} radius={0.045} color="#475569" />
          ))}
        </group>
      )}

      {/* =====================================================
          4. LEVEL 1 INTERIOR FIT-OUT (DINING, HEATING, LABS)
      ===================================================== */}
      {showLower && !isStructure && (
        <group name="MaitriLowerDeck">
          {/* Main Floor Plate & Wing Floors */}
          <mesh position={[0, 2.2, 0]} receiveShadow>
            <boxGeometry args={[55.4, 0.18, 11.4]} />
            <meshStandardMaterial color="#475569" roughness={0.6} />
          </mesh>
          {[-23, 23].map((wx) => (
            <mesh key={wx} position={[wx, 2.2, 19.5]} receiveShadow>
              <boxGeometry args={[9.4, 0.18, 26.4]} />
              <meshStandardMaterial color="#475569" roughness={0.6} />
            </mesh>
          ))}

          {/* Internal Lower Dividers & Partitions */}
          {[-22.8, -2.6, 2.2, 19.7].map((px) => (
            <mesh key={px} position={[px, 3.45, 0]} castShadow>
              <boxGeometry args={[0.1, 2.35, 10.6]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
          ))}
          {[-3.8, 3.8].map((pz) => (
            <mesh key={pz} position={[-2, 3.45, pz]} castShadow>
              <boxGeometry args={[0.12, 2.35, 3.2]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
          ))}

          {/* Dining Hall & Galley (Life Support Subsystem) */}
          <group
            name="DiningAndGalley"
            onClick={(e) => handleClick(e, "MAITRI_DINING")}
            onPointerOver={(e) => handlePointerOver(e, "MAITRI_DINING")}
            onPointerOut={handlePointerOut}
          >
            {[-19.2, -14.7, -10.2].map((dx, i) => (
              <group key={i}>
                <mesh position={[dx, 3.2, 0]} castShadow>
                  <boxGeometry args={[3.35, 0.14, 1.4]} />
                  <meshStandardMaterial color="#b45309" roughness={0.4} />
                </mesh>
                {[-1.18, 1.18].map((legX) => (
                  <mesh key={legX} position={[dx + legX, 2.82, 0]} castShadow>
                    <boxGeometry args={[0.12, 0.72, 0.82]} />
                    <meshStandardMaterial color="#0f172a" />
                  </mesh>
                ))}
                {[-1.08, 1.08].map((dz) =>
                  [-1.05, 0, 1.05].map((cx) => (
                    <group key={`${dz}-${cx}`} position={[dx + cx, 0, dz]} rotation={[0, dz < 0 ? Math.PI : 0, 0]}>
                      <mesh position={[0, 2.74, 0]} castShadow>
                        <boxGeometry args={[0.58, 0.12, 0.58]} />
                        <meshStandardMaterial color="#b45309" />
                      </mesh>
                      <mesh position={[0, 3.12, 0.25]} castShadow>
                        <boxGeometry args={[0.58, 0.68, 0.09]} />
                        <meshStandardMaterial color="#b45309" />
                      </mesh>
                    </group>
                  ))
                )}
              </group>
            ))}

            {/* Galley Stainless Line & Appliances */}
            <mesh position={[-4.15, 2.96, 0]} castShadow>
              <boxGeometry args={[1.25, 1.25, 8.6]} />
              <meshStandardMaterial color="#cbd5e1" metalness={0.85} roughness={0.25} />
            </mesh>
            <mesh position={[-3.72, 4.08, 1.25]} castShadow>
              <boxGeometry args={[0.42, 0.82, 5.2]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh position={[-4.82, 3.02, -2.3]} castShadow>
              <boxGeometry args={[0.16, 0.16, 2.0]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            {[-2.9, -2.3, -1.7].map((bz) => (
              <mesh key={bz} position={[-4.92, 3.14, bz]} rotation={[0, 0, Math.PI / 2]}>
                <cylinderGeometry args={[0.09, 0.09, 0.025, 12]} />
                <meshStandardMaterial color="#0f172a" />
              </mesh>
            ))}
            <mesh position={[-4.32, 4.18, -2.3]} castShadow>
              <boxGeometry args={[1.15, 0.34, 2.35]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} />
            </mesh>
            <mesh position={[-5.0, 3.48, 3.42]} castShadow>
              <boxGeometry args={[1.55, 2.25, 1.65]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
          </group>

          {/* Common Room & Library */}
          <group name="CommonRoomAndLibrary">
            {[
              [6.2, -2.7, 0],
              [11.2, -3.7, 90],
              [15.8, -2.7, 0],
            ].map(([sx, sz, srot], idx) => (
              <group key={idx} position={[sx, 0, sz]} rotation={[0, THREE.MathUtils.degToRad(srot), 0]}>
                <mesh position={[0, 2.7, 0]} castShadow>
                  <boxGeometry args={[3.1, 0.42, 1.12]} />
                  <meshStandardMaterial color="#0284c7" roughness={0.6} />
                </mesh>
                <mesh position={[0, 3.22, 0.46]} castShadow>
                  <boxGeometry args={[3.1, 0.92, 0.22]} />
                  <meshStandardMaterial color="#0284c7" roughness={0.6} />
                </mesh>
              </group>
            ))}
            <mesh position={[10.7, 2.78, -0.1]} castShadow>
              <boxGeometry args={[3.1, 0.38, 1.55]} />
              <meshStandardMaterial color="#b45309" />
            </mesh>
            {[5.0, 9.2, 13.4, 17.6].map((bx) => (
              <mesh key={bx} position={[bx, 3.5, 4.5]} castShadow>
                <boxGeometry args={[3.45, 2.15, 0.45]} />
                <meshStandardMaterial color="#b45309" />
              </mesh>
            ))}
          </group>

          {/* Central Heating Boiler Plant & Water Distribution */}
          <group
            name="HeatingAndWaterPlant"
            onClick={(e) => handleClick(e, "MAITRI_HEATING")}
            onPointerOver={(e) => handlePointerOver(e, "MAITRI_HEATING")}
            onPointerOut={handlePointerOut}
          >
            {[10.2, 14.2].map((bz, i) => (
              <group key={i} position={[-25.7, 2.53, bz]}>
                <mesh position={[0, 0, 0]} castShadow>
                  <boxGeometry args={[2.65, 0.22, 2.2]} />
                  <meshStandardMaterial color="#0f172a" />
                </mesh>
                <mesh position={[0, 0.72, 0]} castShadow>
                  <cylinderGeometry args={[0.36, 0.36, 1.35, 16]} />
                  <meshStandardMaterial color="#d97706" metalness={0.4} roughness={0.4} />
                </mesh>
                <mesh position={[0.78, 0.59, 0]} castShadow>
                  <boxGeometry args={[0.72, 0.62, 0.78]} />
                  <meshStandardMaterial color="#1e293b" />
                </mesh>
              </group>
            ))}
            {[18.0, 21.4].map((vz) => (
              <group key={vz} position={[-25.4, 3.42, vz]}>
                <mesh castShadow>
                  <cylinderGeometry args={[0.39, 0.39, 1.82, 16]} />
                  <meshStandardMaterial color="#0284c7" metalness={0.5} roughness={0.3} />
                </mesh>
                <mesh position={[0.85, 0.63, 0]}>
                  <sphereGeometry args={[0.08, 12, 12]} />
                  <meshStandardMaterial color="#ffffff" />
                </mesh>
              </group>
            ))}
            <mesh position={[-19.05, 3.5, 14.0]} castShadow>
              <boxGeometry args={[0.48, 2.25, 5.2]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <TubeBetween start={[-26.5, 4.55, 8]} end={[-19.3, 4.55, 8]} radius={0.11} color="#dc2626" />
            <TubeBetween start={[-26.5, 4.25, 8.45]} end={[-19.3, 4.25, 8.45]} radius={0.11} color="#0284c7" />
          </group>

          {/* Medical Bay & Gym / Health Club */}
          <group name="MedicalAndHealthClub">
            <mesh position={[21.3, 2.92, 10.4]} castShadow>
              <boxGeometry args={[1.35, 0.62, 3.4]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh position={[21.3, 3.28, 9.2]}>
              <boxGeometry args={[0.85, 0.18, 0.55]} />
              <meshStandardMaterial color="#0284c7" />
            </mesh>
            <mesh position={[25.7, 2.82, 11.3]} castShadow>
              <boxGeometry args={[0.95, 0.72, 0.75]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} />
            </mesh>
            <mesh position={[25.7, 3.72, 11.3]} castShadow>
              <boxGeometry args={[0.78, 0.62, 0.12]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            {[24.8, 26.0].map((ox) => (
              <mesh key={ox} position={[ox, 3.12, 8.3]} castShadow>
                <cylinderGeometry args={[0.125, 0.125, 1.35, 12]} />
                <meshStandardMaterial color="#16a34a" />
              </mesh>
            ))}
            <mesh position={[21.0, 2.58, 19.2]} castShadow>
              <boxGeometry args={[1.35, 0.18, 3.25]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
            <TubeBetween start={[21.0, 2.62, 18.0]} end={[21.0, 3.72, 18.0]} radius={0.07} color="#94a3b8" />
            <mesh position={[25.0, 2.75, 19.5]} castShadow>
              <boxGeometry args={[1.15, 0.32, 2.25]} />
              <meshStandardMaterial color="#0284c7" />
            </mesh>
            <TubeBetween start={[24.0, 3.35, 18.8]} end={[26.0, 3.35, 18.8]} radius={0.07} color="#94a3b8" />
          </group>

          {/* Laundry & Sanitary Block */}
          <group name="LaundryAndSanitary">
            {[25.0, 27.4, 29.8].map((wz) => (
              <group key={wz} position={[-25.5, 3.2, wz]}>
                <mesh castShadow>
                  <boxGeometry args={[1.8, 1.65, 1.85]} />
                  <meshStandardMaterial color="#f8fafc" />
                </mesh>
                <mesh position={[0.94, -0.03, 0]} rotation={[0, 0, Math.PI / 2]}>
                  <cylinderGeometry args={[0.25, 0.25, 0.06, 16]} />
                  <meshStandardMaterial color="#0f172a" />
                </mesh>
              </group>
            ))}
            <mesh position={[-20.8, 3.0, 27.2]} castShadow>
              <boxGeometry args={[2.8, 0.16, 5.8]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.8} />
            </mesh>
          </group>

          {/* Laboratories & Communications Racks (Interactive Subsystem) */}
          <group
            name="MaitriLabs"
            onClick={(e) => handleClick(e, "MAITRI_LABS")}
            onPointerOver={(e) => handlePointerOver(e, "MAITRI_LABS")}
            onPointerOut={handlePointerOut}
          >
            {[0, 1, 2, 3].map((r) => (
              <mesh key={r} position={[23, 3.35, 24 + r * 2.15]} castShadow>
                <boxGeometry args={[1.15, 2.1, 1.35]} />
                <meshStandardMaterial color="#1e293b" metalness={0.8} />
              </mesh>
            ))}
            <mesh position={[23, 3.45, 31.35]} castShadow>
              <boxGeometry args={[9.2, 2.35, 0.14]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh position={[27.55, 3.45, 27]} castShadow>
              <boxGeometry args={[0.14, 2.35, 8.8]} />
              <meshStandardMaterial color="#f8fafc" />
            </mesh>
            <mesh position={[25.5, 3.02, 27]} castShadow>
              <boxGeometry args={[2.7, 0.16, 7.2]} />
              <meshStandardMaterial color="#b45309" />
            </mesh>
            {[24.5, 27, 29.5].map((lz) => (
              <group key={lz} position={[25.5, 3.36, lz]}>
                <mesh castShadow>
                  <boxGeometry args={[1.45, 0.55, 0.92]} />
                  <meshStandardMaterial color="#f8fafc" />
                </mesh>
                <mesh position={[-0.76, 0.06, 0]}>
                  <boxGeometry args={[0.04, 0.28, 0.56]} />
                  <meshStandardMaterial color="#0284c7" emissive="#0369a1" emissiveIntensity={0.6} />
                </mesh>
              </group>
            ))}
            {[25.2, 28.8].map((mz) => (
              <group key={mz} position={[24.7, 3.35, mz]}>
                <mesh castShadow>
                  <boxGeometry args={[0.55, 0.12, 0.62]} />
                  <meshStandardMaterial color="#0f172a" />
                </mesh>
                <TubeBetween start={[0, 0.05, 0]} end={[0, 0.67, 0.18]} radius={0.075} color="#94a3b8" />
                <mesh position={[0, 0.69, 0.2]} rotation={[Math.PI / 2, 0, 0]}>
                  <cylinderGeometry args={[0.09, 0.09, 0.34, 12]} />
                  <meshStandardMaterial color="#0f172a" />
                </mesh>
              </group>
            ))}
          </group>

          {/* Ceiling Linear Luminaires */}
          {[-25, -19, -13, -7, 0, 7, 13, 19, 25].map((lx) => (
            <mesh key={lx} position={[lx, 4.56, 0]}>
              <boxGeometry args={[2.8, 0.06, 0.35]} />
              <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={1.4} />
            </mesh>
          ))}
          {[-23, 23].map((wx) =>
            [10, 16, 22, 28].map((wz) => (
              <mesh key={`${wx}-${wz}`} position={[wx, 4.56, wz]}>
                <boxGeometry args={[2.8, 0.06, 0.35]} />
                <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={1.4} />
              </mesh>
            ))
          )}
        </group>
      )}

      {/* =====================================================
          5. LEVEL 2 INTERIOR FIT-OUT (26 LIVING QUARTERS)
      ===================================================== */}
      {showUpper && !isStructure && (
        <group
          name="MaitriUpperDeck"
          onClick={(e) => handleClick(e, "MAITRI_LIVING")}
          onPointerOver={(e) => handlePointerOver(e, "MAITRI_LIVING")}
          onPointerOut={handlePointerOut}
        >
          {/* Upper Floor Plates */}
          <mesh position={[0, 4.85, 0]} receiveShadow>
            <boxGeometry args={[55.4, 0.18, 11.4]} />
            <meshStandardMaterial color="#334155" roughness={0.6} />
          </mesh>
          {[-23, 23].map((wx) => (
            <mesh key={wx} position={[wx, 4.85, 19.5]} receiveShadow>
              <boxGeometry args={[9.4, 0.18, 26.4]} />
              <meshStandardMaterial color="#334155" roughness={0.6} />
            </mesh>
          ))}

          {/* 12 Main Block Overwintering Rooms */}
          {[...Array(12)].map((_, r) => {
            const rx = -25.3 + r * 4.6;
            return (
              <group key={`m-room-${r}`}>
                <mesh position={[rx, 4.98, 0]}>
                  <boxGeometry args={[4.32, 0.16, 10.6]} />
                  <meshStandardMaterial color="#334155" />
                </mesh>
                <mesh position={[rx - 2.25, 6.15, 0]} castShadow>
                  <boxGeometry args={[0.11, 2.45, 10.5]} />
                  <meshStandardMaterial color="#f8fafc" />
                </mesh>
                {/* Bed Frame & Blue Mattress */}
                <mesh position={[rx - 0.75, 5.32, 1.25]} castShadow>
                  <boxGeometry args={[0.9, 0.34, 1.95]} />
                  <meshStandardMaterial color="#0f172a" />
                </mesh>
                <mesh position={[rx - 0.75, 5.52, 1.25]}>
                  <boxGeometry args={[0.82, 0.18, 1.82]} />
                  <meshStandardMaterial color="#0284c7" />
                </mesh>
                <mesh position={[rx - 0.75, 5.65, 1.87]}>
                  <boxGeometry args={[0.58, 0.12, 0.45]} />
                  <meshStandardMaterial color="#ffffff" />
                </mesh>
                {/* Desk & Wardrobe */}
                <mesh position={[rx + 1.1, 5.48, -1.55]} castShadow>
                  <boxGeometry args={[0.9, 0.68, 1.25]} />
                  <meshStandardMaterial color="#b45309" />
                </mesh>
                <mesh position={[rx + 1.55, 6.05, 1.78]} castShadow>
                  <boxGeometry args={[0.82, 2.15, 1.15]} />
                  <meshStandardMaterial color="#f8fafc" />
                </mesh>
                <mesh position={[rx, 7.0, 0]}>
                  <sphereGeometry args={[0.09, 8, 8]} />
                  <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={1.5} />
                </mesh>
              </group>
            );
          })}

          {/* 14 Wing Living Modules (7 per wing) */}
          {[-23, 23].map((wx) =>
            [...Array(7)].map((_, r) => {
              const rz = 9.2 + r * 3.7;
              return (
                <group key={`w-room-${wx}-${r}`}>
                  <mesh position={[wx, 4.98, rz]}>
                    <boxGeometry args={[9.35, 0.16, 3.35]} />
                    <meshStandardMaterial color="#334155" />
                  </mesh>
                  <mesh position={[wx, 6.15, rz - 1.78]} castShadow>
                    <boxGeometry args={[9.2, 2.45, 0.11]} />
                    <meshStandardMaterial color="#f8fafc" />
                  </mesh>
                  {/* Bed */}
                  <mesh position={[wx - 1.7, 5.32, rz]} castShadow>
                    <boxGeometry args={[1.95, 0.34, 0.9]} />
                    <meshStandardMaterial color="#0f172a" />
                  </mesh>
                  <mesh position={[wx - 1.7, 5.52, rz]}>
                    <boxGeometry args={[1.82, 0.18, 0.82]} />
                    <meshStandardMaterial color="#0284c7" />
                  </mesh>
                  <mesh position={[wx - 2.32, 5.65, rz]}>
                    <boxGeometry args={[0.45, 0.12, 0.58]} />
                    <meshStandardMaterial color="#ffffff" />
                  </mesh>
                  {/* Desk & Wardrobe */}
                  <mesh position={[wx + 1.65, 5.48, rz + 0.7]} castShadow>
                    <boxGeometry args={[0.9, 0.68, 1.25]} />
                    <meshStandardMaterial color="#b45309" />
                  </mesh>
                  <mesh position={[wx + 2.8, 6.05, rz - 0.7]} castShadow>
                    <boxGeometry args={[0.82, 2.15, 1.15]} />
                    <meshStandardMaterial color="#f8fafc" />
                  </mesh>
                  <mesh position={[wx, 7.0, rz]}>
                    <sphereGeometry args={[0.09, 8, 8]} />
                    <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={1.5} />
                  </mesh>
                </group>
              );
            })
          )}
        </group>
      )}

      {/* =====================================================
          6. EXTERNAL SITE INFRASTRUCTURE
      ===================================================== */}
      <group name="MaitriSiteInfrastructure">
        {/* 6 × 62.5 kW Generator Hall (Power Microgrid Subsystem) */}
        <group
          name="GeneratorHall"
          onClick={(e) => handleClick(e, "MAITRI_GENERATORS")}
          onPointerOver={(e) => handlePointerOver(e, "MAITRI_GENERATORS")}
          onPointerOut={handlePointerOut}
        >
          <mesh position={[-82, terrainHeight(-82, -15) + 0.12, -15]} receiveShadow>
            <boxGeometry args={[21, 0.24, 11]} />
            <meshStandardMaterial color="#475569" roughness={0.8} />
          </mesh>
          <mesh position={[-82, terrainHeight(-82, -15) + 2.15, -9.6]} castShadow>
            <boxGeometry args={[21, 4.1, 0.22]} />
            <meshStandardMaterial color="#29613d" />
          </mesh>
          {[-1, 1].map((s) => (
            <mesh key={s} position={[-82 + s * 10.4, terrainHeight(-82, -15) + 2.15, -15]} castShadow>
              <boxGeometry args={[0.22, 4.1, 11]} />
              <meshStandardMaterial color="#29613d" />
            </mesh>
          ))}
          <mesh position={[-82, terrainHeight(-82, -15) + 4.28, -15]} castShadow>
            <boxGeometry args={[21.6, 0.2, 11.6]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.78} />
          </mesh>
          {[-89.2, -82, -74.8].map((cx) => (
            <mesh key={cx} position={[cx, terrainHeight(-82, -15) + 2.1, -20.35]} castShadow>
              <boxGeometry args={[0.28, 4.1, 0.28]} />
              <meshStandardMaterial color="#475569" metalness={0.8} />
            </mesh>
          ))}
          <mesh position={[-82, terrainHeight(-82, -15) + 4.02, -20.35]} castShadow>
            <boxGeometry args={[21, 0.3, 0.28]} />
            <meshStandardMaterial color="#475569" metalness={0.8} />
          </mesh>

          {/* 6 Genset Packages with Stacks & Headers */}
          {[0, 1, 2, 3, 4, 5].map((u) => {
            const gx = -82 - 7.2 + (u % 3) * 7.2;
            const gz = -15 - 2.6 + Math.floor(u / 3) * 5.2;
            const gy = terrainHeight(-82, -15);
            return (
              <group key={u}>
                <mesh position={[gx, gy + 0.5, gz]} castShadow>
                  <boxGeometry args={[4.5, 0.22, 2.25]} />
                  <meshStandardMaterial color="#0f172a" />
                </mesh>
                <mesh position={[gx, gy + 1.25, gz]} castShadow>
                  <boxGeometry args={[4.15, 1.32, 2]} />
                  <meshStandardMaterial color="#f59e0b" metalness={0.3} roughness={0.4} />
                </mesh>
                <mesh position={[gx + 2.12, gy + 1.35, gz]} castShadow>
                  <boxGeometry args={[0.18, 1.18, 1.5]} />
                  <meshStandardMaterial color="#0f172a" />
                </mesh>
                <mesh position={[gx - 2.09, gy + 1.25, gz]} castShadow>
                  <boxGeometry args={[0.08, 1.02, 1.55]} />
                  <meshStandardMaterial color="#0f172a" />
                </mesh>
                <mesh position={[gx + 2.24, gy + 1.62, gz]}>
                  <sphereGeometry args={[0.055, 8, 8]} />
                  <meshStandardMaterial color="#0284c7" emissive="#0284c7" emissiveIntensity={1.5} />
                </mesh>
                <TubeBetween start={[gx - 1.4, gy + 1.8, gz]} end={[gx - 1.4, gy + 5.5, gz]} radius={0.13} color="#475569" />
              </group>
            );
          })}

          <TubeBetween start={[-82 - 9.2, terrainHeight(-82, -15) + 0.55, -15 + 4.35]} end={[-82 + 9.2, terrainHeight(-82, -15) + 0.55, -15 + 4.35]} radius={0.08} color="#dc2626" />
          {[-82 - 6, -82 - 2, -82 + 2, -82 + 6].map((cx) => (
            <mesh key={cx} position={[cx, terrainHeight(-82, -15) + 1.25, -15 + 5.0]} castShadow>
              <boxGeometry args={[2.7, 2.15, 0.45]} />
              <meshStandardMaterial color="#0f172a" />
            </mesh>
          ))}
        </group>

        {/* 7-Tank Fuel Depot in Concrete Bund (Fuel Subsystem) */}
        <group
          name="FuelDepot"
          onClick={(e) => handleClick(e, "MAITRI_FUEL")}
          onPointerOver={(e) => handlePointerOver(e, "MAITRI_FUEL")}
          onPointerOut={handlePointerOut}
        >
          <mesh position={[-122, terrainHeight(-122, 12) + 0.18, 12]} receiveShadow>
            <boxGeometry args={[31, 0.28, 18]} />
            <meshStandardMaterial color="#475569" roughness={0.8} />
          </mesh>
          {[...Array(7)].map((_, tk) => {
            const tx = -122 - 10.5 + (tk % 4) * 7;
            const tz = 12 - 4 + Math.floor(tk / 4) * 8;
            const ty = terrainHeight(-122, 12);
            return (
              <group key={tk} position={[tx, ty + 1.55, tz]}>
                <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
                  <cylinderGeometry args={[1.2, 1.2, 5.4, 20]} />
                  <meshStandardMaterial color="#cbd5e1" metalness={0.78} roughness={0.35} />
                </mesh>
                <TubeBetween start={[0, 0.65, 0]} end={[0, 1.6, 0]} radius={0.05} color="#dc2626" />
              </group>
            );
          })}
          <TubeBetween start={[-122 - 13, terrainHeight(-122, 12) + 0.72, 12]} end={[-122 + 13, terrainHeight(-122, 12) + 0.72, 12]} radius={0.1} color="#dc2626" />
        </group>

        {/* Vehicle Workshop & Garage (Logistics Subsystem) */}
        <group
          name="GarageWorkshop"
          onClick={(e) => handleClick(e, "MAITRI_GARAGE")}
          onPointerOver={(e) => handlePointerOver(e, "MAITRI_GARAGE")}
          onPointerOut={handlePointerOut}
        >
          <mesh position={[-124, terrainHeight(-124, 66) + 3.1, 66]} castShadow receiveShadow>
            <boxGeometry args={[29, 5.8, 18]} />
            <meshStandardMaterial color="#29613d" metalness={0.35} roughness={0.3} />
          </mesh>
          {[-132, -124, -116].map((gx) => (
            <mesh key={gx} position={[gx, terrainHeight(-124, 66) + 2.75, 56.9]} castShadow>
              <boxGeometry args={[6.2, 4.7, 0.18]} />
              <meshStandardMaterial color="#1e293b" metalness={0.8} roughness={0.4} />
            </mesh>
          ))}
          {/* Parked Heavy Tracked Snowcat Vehicles */}
          <TrackedVehicle position={[-68, 24]} rotation={-25} />
          <TrackedVehicle position={[-52, 34]} rotation={15} />
        </group>

        {/* Summer & Emergency Camp (10 Container Modules) */}
        <group
          name="SummerCamp"
          onClick={(e) => handleClick(e, "MAITRI_SUMMER_CAMP")}
          onPointerOver={(e) => handlePointerOver(e, "MAITRI_SUMMER_CAMP")}
          onPointerOut={handlePointerOut}
        >
          {[...Array(10)].map((_, c) => {
            const cx = 64 + (c % 5) * 7;
            const cz = 82 + Math.floor(c / 5) * 5;
            return (
              <SiteContainer
                key={c}
                name={`MaitriCamp-${c + 1}`}
                position={[cx, terrainHeight(cx, cz) + 1.35, cz]}
                color={c % 3 === 0 ? "#dc2626" : c % 3 === 1 ? "#29613d" : "#f8fafc"}
              />
            );
          })}
        </group>

        {/* Priyadarshini Lake Water Pump House & 260m Heated Pipeline */}
        <group
          name="LakeWaterSystem"
          onClick={(e) => handleClick(e, "MAITRI_WATER")}
          onPointerOver={(e) => handlePointerOver(e, "MAITRI_WATER")}
          onPointerOut={handlePointerOut}
        >
          <SiteContainer
            name="LakePumpHouse"
            position={[260, terrainHeight(260, 14) + 1.35, 14]}
            color="#f8fafc"
          />
          <mesh position={[260, terrainHeight(260, 14) + 0.35, 11.8]} castShadow>
            <boxGeometry args={[3.2, 0.2, 1.2]} />
            <meshStandardMaterial color="#0f172a" />
          </mesh>
          {[11.45, 12.15].map((pz) => (
            <mesh key={pz} position={[260, terrainHeight(260, 14) + 0.78, pz]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.24, 0.24, 1.05, 16]} />
              <meshStandardMaterial color="#0284c7" metalness={0.6} roughness={0.3} />
            </mesh>
          ))}

          {/* 260m Elevated Insulated Heated Pipeline */}
          {[
            [29, 10], [72, 12], [118, 9], [165, 4], [211, 8], [260, 14],
          ].map(([wx, wz], idx, arr) => {
            if (idx === arr.length - 1) return null;
            const [nx, nz] = arr[idx + 1];
            return (
              <React.Fragment key={idx}>
                <TubeBetween
                  start={[wx, terrainHeight(wx, wz) + 1.45, wz]}
                  end={[nx, terrainHeight(nx, nz) + 1.45, nz]}
                  radius={0.13}
                  color="#0284c7"
                />
                <TubeBetween
                  start={[wx, terrainHeight(wx, wz), wz]}
                  end={[wx, terrainHeight(wx, wz) + 1.45, wz]}
                  radius={0.06}
                  color="#475569"
                />
              </React.Fragment>
            );
          })}
        </group>

        {/* 6.2m SATCOM Radome on Steel Base */}
        <group
          name="MaitriSATCOM"
          onClick={(e) => handleClick(e, "MAITRI_SATCOM")}
          onPointerOver={(e) => handlePointerOver(e, "MAITRI_SATCOM")}
          onPointerOut={handlePointerOut}
        >
          <mesh position={[38, terrainHeight(38, 55) + 0.5, 55]} castShadow receiveShadow>
            <boxGeometry args={[8, 0.8, 8]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
          </mesh>
          <mesh position={[38, terrainHeight(38, 55) + 4.2, 55]} castShadow>
            <sphereGeometry args={[3.1, 32, 32]} />
            <meshStandardMaterial color="#f8fafc" roughness={0.2} metalness={0.3} />
          </mesh>
        </group>
      </group>

      {/* =====================================================
          7. 3D ROOM & COMPONENT LABELS (OPTIONAL OVERLAY)
      ===================================================== */}
      {showLabels && (
        <group name="Maitri3DLabels">
          {isExterior && (
            <StationAreaLabel
              position={[0, 9.5, 10]}
              text="Maitri Main Station"
              onClick={(e) => handleClick(e, "MAITRI_MAIN")}
            />
          )}
          {showLower && (
            <>
              <StationAreaLabel
                position={[-13, 5.2, 0]}
                text="Dining Hall & Galley"
                onClick={(e) => handleClick(e, "MAITRI_DINING")}
              />
              <StationAreaLabel
                position={[-23, 5.5, 16]}
                text="Boilers & Heating Plant"
                onClick={(e) => handleClick(e, "MAITRI_HEATING")}
              />
              <StationAreaLabel
                position={[23, 5.2, 27]}
                text="Laboratories & Comms"
                onClick={(e) => handleClick(e, "MAITRI_LABS")}
              />
            </>
          )}
          {showUpper && (
            <StationAreaLabel
              position={[0, 7.8, 0]}
              text="26 Overwintering Cabins"
              onClick={(e) => handleClick(e, "MAITRI_LIVING")}
            />
          )}
          <StationAreaLabel
            position={[-82, terrainHeight(-82, -15) + 6.2, -15]}
            text="6 × 62.5 kW Generator Hall"
            onClick={(e) => handleClick(e, "MAITRI_GENERATORS")}
          />
          <StationAreaLabel
            position={[-122, terrainHeight(-122, 12) + 5.2, 12]}
            text="7-Tank Fuel Depot (110 kL)"
            onClick={(e) => handleClick(e, "MAITRI_FUEL")}
          />
          <StationAreaLabel
            position={[-124, terrainHeight(-124, 66) + 8.5, 66]}
            text="Workshop & Garage"
            onClick={(e) => handleClick(e, "MAITRI_GARAGE")}
          />
          <StationAreaLabel
            position={[78, terrainHeight(78, 85) + 5.5, 85]}
            text="Emergency & Summer Camp"
            onClick={(e) => handleClick(e, "MAITRI_SUMMER_CAMP")}
          />
          <StationAreaLabel
            position={[260, terrainHeight(260, 14) + 4.2, 14]}
            text="Priyadarshini Lake Pump"
            onClick={(e) => handleClick(e, "MAITRI_WATER")}
          />
          <StationAreaLabel
            position={[38, terrainHeight(38, 55) + 8.5, 55]}
            text="6.2m SATCOM Radome"
            onClick={(e) => handleClick(e, "MAITRI_SATCOM")}
          />
        </group>
      )}
    </group>
  );
}

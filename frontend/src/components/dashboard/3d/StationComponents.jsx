import React, { useMemo, Fragment } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import {
  terrainHeight,
  createMergedBoxesGeometry,
} from "./station3dGeometry";

/* =========================================================
   3D ROOM / SUBSYSTEM FLOATING BADGE LABEL
========================================================= */
export function StationAreaLabel({ position, text, onClick }) {
  return (
    <Html position={position} center distanceFactor={85}>
      <button
        type="button"
        onClick={onClick}
        style={{
          background: "rgba(15, 23, 42, 0.92)",
          color: "#f8fafc",
          border: "1px solid rgba(56, 189, 248, 0.75)",
          padding: "3px 9px",
          borderRadius: "4px",
          fontSize: "11px",
          fontWeight: 700,
          fontFamily: "ui-monospace, monospace",
          cursor: "pointer",
          whiteSpace: "nowrap",
          pointerEvents: "auto",
          backdropFilter: "blur(8px)",
          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(56, 189, 248, 0.2)",
          letterSpacing: "0.06em",
          display: "flex",
          alignItems: "center",
          gap: "5px",
          transition: "all 0.15s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = "#38bdf8";
          e.currentTarget.style.background = "rgba(2, 132, 199, 0.95)";
          e.currentTarget.style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = "rgba(56, 189, 248, 0.75)";
          e.currentTarget.style.background = "rgba(15, 23, 42, 0.92)";
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#38bdf8" }} />
        {text}
      </button>
    </Html>
  );
}

/* =========================================================
   CYLINDER / PIPE BETWEEN POINTS WITH JOINTS & FITTINGS
========================================================= */
export function TubeBetween({
  start,
  end,
  radius = 0.05,
  material,
  color,
  metalness = 0.85,
  roughness = 0.3,
}) {
  const { position, rotation, length } = useMemo(() => {
    const p1 = new THREE.Vector3(...start);
    const p2 = new THREE.Vector3(...end);
    const mid = new THREE.Vector3().addVectors(p1, p2).multiplyScalar(0.5);
    const len = p1.distanceTo(p2);

    const dir = new THREE.Vector3().subVectors(p2, p1).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
    const euler = new THREE.Euler().setFromQuaternion(quat);

    return {
      position: [mid.x, mid.y, mid.z],
      rotation: [euler.x, euler.y, euler.z],
      length: len,
    };
  }, [start, end]);

  return (
    <group position={position} rotation={rotation}>
      <mesh castShadow receiveShadow>
        <cylinderGeometry args={[radius, radius, length, 12]} />
        {material ? (
          <primitive object={material} attach="material" />
        ) : (
          <meshStandardMaterial color={color || "#64748b"} metalness={metalness} roughness={roughness} />
        )}
      </mesh>
      {/* Flange Rings on Ends */}
      {[-length / 2, length / 2].map((fy, idx) => (
        <mesh key={idx} position={[0, fy, 0]} castShadow>
          <cylinderGeometry args={[radius * 1.5, radius * 1.5, radius * 0.4, 12]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.3} />
        </mesh>
      ))}
    </group>
  );
}

/* =========================================================
   DETAILED ISO SHIPPING CONTAINER MODULE
========================================================= */
export function SiteContainer({
  name = "Container",
  position = [0, 0, 0],
  rotation = 0,
  color = "#cbd5e1",
  material,
}) {
  const corrugations = useMemo(() => {
    const parts = [];
    for (let rib = 0; rib < 9; rib += 1) {
      const x = -2.7 + rib * 0.68;
      parts.push({ position: [x, 0, -1.22], scale: [0.065, 2.38, 0.05] });
      parts.push({ position: [x, 0, 1.22], scale: [0.065, 2.38, 0.05] });
    }
    // Top Stiffener Ribs
    for (let rib = 0; rib < 5; rib += 1) {
      const x = -2.4 + rib * 1.2;
      parts.push({ position: [x, 1.3, 0], scale: [0.05, 0.04, 2.3] });
    }
    return createMergedBoxesGeometry(parts);
  }, []);

  return (
    <group name={name} position={position} rotation={[0, THREE.MathUtils.degToRad(rotation), 0]}>
      {/* Main Structural Core */}
      <mesh castShadow receiveShadow>
        <boxGeometry args={[6.06, 2.58, 2.42]} />
        {material ? <primitive object={material} attach="material" /> : <meshStandardMaterial color={color} roughness={0.38} metalness={0.25} />}
      </mesh>

      {/* Corrugation Profile Ribs */}
      <mesh geometry={corrugations} castShadow receiveShadow>
        {material ? <primitive object={material} attach="material" /> : <meshStandardMaterial color={color} roughness={0.38} metalness={0.25} />}
      </mesh>

      {/* 8 Chamfered ISO Corner Casting Blocks */}
      {[-2.95, 2.95].map((cx) =>
        [-1.2, 1.2].map((cy) =>
          [-1.12, 1.12].map((cz) => (
            <mesh key={`${cx}-${cy}-${cz}`} position={[cx, cy, cz]} castShadow>
              <boxGeometry args={[0.22, 0.22, 0.22]} />
              <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.3} />
            </mesh>
          ))
        )
      )}

      {/* End Cargo Door Frame & Locking Hardware */}
      <mesh position={[-3.04, 0, 0]} castShadow>
        <boxGeometry args={[0.04, 2.4, 2.2]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.4} />
      </mesh>
      {[-0.55, 0.55].map((dz) => (
        <group key={dz} position={[-3.08, 0, dz]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.025, 0.025, 2.2, 8]} />
            <meshStandardMaterial color="#cbd5e1" metalness={0.9} roughness={0.2} />
          </mesh>
          {/* Cam Handle */}
          <mesh position={[0, -0.2, 0]} rotation={[0, 0, Math.PI / 4]}>
            <boxGeometry args={[0.03, 0.18, 0.03]} />
            <meshStandardMaterial color="#dc2626" />
          </mesh>
        </group>
      ))}

      {/* Raised Timber Foundation Sleepers */}
      {[-2.4, 2.4].map((bx) => (
        <mesh key={bx} position={[bx, -1.36, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.3, 0.16, 2.6]} />
          <meshStandardMaterial color="#451a03" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/* =========================================================
   HIGH-FIDELITY TRACKED SNOWCAT (PISTENBULLY)
========================================================= */
export function TrackedVehicle({ position, rotation = 0 }) {
  const [x, z] = position;
  const y = terrainHeight(x, z);

  return (
    <group position={[x, y, z]} rotation={[0, THREE.MathUtils.degToRad(rotation), 0]}>
      {/* Left and Right Continuous Track Belts */}
      {[-1.35, 1.35].map((tx) => (
        <group key={tx}>
          {/* Rubber/Steel Track Loop */}
          <mesh position={[tx, 0.48, 0]} castShadow>
            <boxGeometry args={[0.55, 0.72, 4.0]} />
            <meshStandardMaterial color="#090d16" metalness={0.8} roughness={0.5} />
          </mesh>
          {/* 5 Road Wheels / Bogies */}
          {[-1.4, -0.7, 0, 0.7, 1.4].map((wz, wi) => (
            <mesh key={wi} position={[tx > 0 ? tx + 0.28 : tx - 0.28, 0.45, wz]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.22, 0.22, 0.12, 16]} />
              <meshStandardMaterial color="#475569" metalness={0.9} roughness={0.25} />
            </mesh>
          ))}
          {/* Front Idler & Rear Drive Sprocket */}
          <mesh position={[tx, 0.65, -1.8]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.52, 16]} />
            <meshStandardMaterial color="#334155" metalness={0.9} />
          </mesh>
          <mesh position={[tx, 0.65, 1.8]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.24, 0.24, 0.52, 16]} />
            <meshStandardMaterial color="#334155" metalness={0.9} />
          </mesh>
        </group>
      ))}

      {/* Main Heavy Chassis & Engine Deck */}
      <mesh position={[0, 1.05, 0]} castShadow>
        <boxGeometry args={[2.4, 0.9, 3.6]} />
        <meshStandardMaterial color="#1e293b" metalness={0.7} roughness={0.35} />
      </mesh>

      {/* High-Visibility Polar Orange Cabin */}
      <mesh position={[0, 1.78, -0.4]} castShadow>
        <boxGeometry args={[2.3, 1.15, 2.2]} />
        <meshStandardMaterial color="#ea580c" roughness={0.3} metalness={0.35} />
      </mesh>

      {/* Tinted Panoramic Windscreen & Windows */}
      <mesh position={[0, 1.88, -1.48]} rotation={[THREE.MathUtils.degToRad(-15), 0, 0]} castShadow>
        <boxGeometry args={[2.1, 0.85, 0.1]} />
        <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.08} transparent opacity={0.82} />
      </mesh>
      {[-1.16, 1.16].map((sx) => (
        <mesh key={sx} position={[sx, 1.88, -0.4]} castShadow>
          <boxGeometry args={[0.08, 0.75, 1.6]} />
          <meshStandardMaterial color="#0284c7" metalness={0.8} roughness={0.08} transparent opacity={0.82} />
        </mesh>
      ))}

      {/* Roof Amber Flashing Beacon */}
      <mesh position={[0, 2.45, -0.4]}>
        <cylinderGeometry args={[0.08, 0.1, 0.18, 12]} />
        <meshStandardMaterial color="#f59e0b" emissive="#f59e0b" emissiveIntensity={2.5} />
      </mesh>

      {/* Front Hydraulic 12-Way Snow Blade */}
      <group position={[0, 0.72, -2.5]}>
        <mesh rotation={[THREE.MathUtils.degToRad(15), 0, 0]} castShadow>
          <boxGeometry args={[4.2, 0.9, 0.18]} />
          <meshStandardMaterial color="#475569" metalness={0.88} roughness={0.25} />
        </mesh>
        {/* Hydraulic Push Rams */}
        {[-0.9, 0.9].map((rx) => (
          <TubeBetween key={rx} start={[rx, 0.25, 0.6]} end={[rx, 0, 0]} radius={0.06} color="#1e293b" />
        ))}
      </group>

      {/* Dual Headlamps */}
      {[-0.8, 0.8].map((hx) => (
        <mesh key={hx} position={[hx, 1.45, -1.55]}>
          <boxGeometry args={[0.26, 0.18, 0.08]} />
          <meshStandardMaterial color="#ffffff" emissive="#fef08a" emissiveIntensity={1.8} />
        </mesh>
      ))}
    </group>
  );
}

/* =========================================================
   HIGH-FIDELITY 24 m³ DOUBLE-HULL FUEL TANK ASSEMBLY
========================================================= */
export function FuelTankAssembly({ index = 0, position }) {
  const [x, y, z] = position;

  return (
    <group name={`FuelTank-${index}`} position={[x, y, z]}>
      {/* Heavy Steel Saddle Support Base */}
      {[-1.8, 1.8].map((sx) => (
        <group key={sx} position={[sx, 0.45, 0]}>
          {/* Concrete Footing */}
          <mesh position={[0, -0.35, 0]} receiveShadow>
            <boxGeometry args={[0.5, 0.22, 2.8]} />
            <meshStandardMaterial color="#475569" roughness={0.8} />
          </mesh>
          {/* Steel Saddle Curve */}
          <mesh position={[0, 0.15, 0]} castShadow>
            <boxGeometry args={[0.28, 0.7, 2.6]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.3} />
          </mesh>
        </group>
      ))}

      {/* Main Cylindrical Shell */}
      <mesh position={[0, 1.55, 0]} rotation={[0, 0, Math.PI / 2]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.2, 5.2, 24]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.78} roughness={0.32} />
      </mesh>

      {/* Dished End Caps (Spherical Bulge) */}
      {[-2.6, 2.6].map((cx, idx) => (
        <mesh key={idx} position={[cx, 1.55, 0]} rotation={[0, 0, cx < 0 ? -Math.PI / 2 : Math.PI / 2]} castShadow>
          <sphereGeometry args={[1.2, 24, 16, 0, Math.PI * 2, 0, Math.PI * 0.35]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.78} roughness={0.32} />
        </mesh>
      ))}

      {/* Red Identification Stencil Band & Hazard Mark */}
      <mesh position={[0, 1.55, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[1.205, 1.205, 0.65, 24]} />
        <meshStandardMaterial color="#dc2626" roughness={0.4} metalness={0.4} />
      </mesh>

      {/* Top Inspection Platform Walkway & Safety Handrails */}
      <mesh position={[0, 2.82, 0]} castShadow>
        <boxGeometry args={[4.2, 0.08, 1.1]} />
        <meshStandardMaterial color="#0f172a" metalness={0.85} roughness={0.4} />
      </mesh>
      <TubeBetween start={[-2.1, 3.42, -0.52]} end={[2.1, 3.42, -0.52]} radius={0.03} color="#cbd5e1" />
      <TubeBetween start={[-2.1, 3.42, 0.52]} end={[2.1, 3.42, 0.52]} radius={0.03} color="#cbd5e1" />
      {[-2.0, -0.7, 0.7, 2.0].map((px) => (
        <Fragment key={px}>
          <TubeBetween start={[px, 2.84, -0.52]} end={[px, 3.42, -0.52]} radius={0.025} color="#cbd5e1" />
          <TubeBetween start={[px, 2.84, 0.52]} end={[px, 3.42, 0.52]} radius={0.025} color="#cbd5e1" />
        </Fragment>
      ))}

      {/* Vertical Access Ladder */}
      <group position={[-2.72, 1.45, 0]}>
        <TubeBetween start={[0, -1.2, -0.22]} end={[0, 1.4, -0.22]} radius={0.025} color="#94a3b8" />
        <TubeBetween start={[0, -1.2, 0.22]} end={[0, 1.4, 0.22]} radius={0.025} color="#94a3b8" />
        {[-1.0, -0.6, -0.2, 0.2, 0.6, 1.0].map((ry) => (
          <TubeBetween key={ry} start={[0, ry, -0.22]} end={[0, ry, 0.22]} radius={0.02} color="#94a3b8" />
        ))}
      </group>

      {/* Top Fill Hatch & Vent Riser */}
      <mesh position={[1.2, 2.95, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.16, 0.24, 16]} />
        <meshStandardMaterial color="#dc2626" metalness={0.6} />
      </mesh>
      <TubeBetween start={[-1.2, 2.75, 0]} end={[-1.2, 3.75, 0]} radius={0.04} color="#1e293b" />
    </group>
  );
}

/* =========================================================
   PRECISION HELIPAD HARDSTAND WITH LIGHTING
========================================================= */
export function HelipadPlatform({ x, z, size, name = "Helipad" }) {
  const y = terrainHeight(x, z) + 0.22;

  const markings = useMemo(() => {
    const items = [];
    const segments = 32;
    for (let s = 0; s < segments; s += 1) {
      const angle = (s / segments) * Math.PI * 2;
      const radius = size * 0.38;
      items.push({
        position: [x + Math.sin(angle) * radius, y + 0.1, z + Math.cos(angle) * radius],
        rotation: [0, angle, 0],
        scale: [size * 0.075, 0.02, 0.38],
      });
    }
    return items;
  }, [x, y, z, size]);

  return (
    <group name={name}>
      {/* Reinforced Concrete Slab with Chamfered Curb */}
      <mesh position={[x, y, z]} receiveShadow>
        <boxGeometry args={[size, 0.22, size]} />
        <meshStandardMaterial color="#475569" roughness={0.88} metalness={0.08} />
      </mesh>

      {/* Circular Boundary Ring */}
      {markings.map((m, idx) => (
        <mesh key={idx} position={m.position} rotation={m.rotation}>
          <boxGeometry args={m.scale} />
          <meshStandardMaterial color="#ffffff" roughness={0.3} />
        </mesh>
      ))}

      {/* High-Contrast "H" Marking */}
      <mesh position={[x, y + 0.1, z]}>
        <boxGeometry args={[size * 0.42, 0.02, 0.85]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <mesh position={[x - size * 0.21, y + 0.1, z]}>
        <boxGeometry args={[0.75, 0.02, size * 0.42]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>
      <mesh position={[x + size * 0.21, y + 0.1, z]}>
        <boxGeometry args={[0.75, 0.02, size * 0.42]} />
        <meshStandardMaterial color="#ffffff" roughness={0.3} />
      </mesh>

      {/* Perimeter Green/Amber Runway Beacons */}
      {[-size / 2 + 0.5, size / 2 - 0.5].map((bx) =>
        [-size / 2 + 0.5, size / 2 - 0.5].map((bz) => (
          <mesh key={`${bx}-${bz}`} position={[x + bx, y + 0.22, z + bz]}>
            <cylinderGeometry args={[0.08, 0.08, 0.18, 12]} />
            <meshStandardMaterial color="#16a34a" emissive="#22c55e" emissiveIntensity={2.0} />
          </mesh>
        ))
      )}
    </group>
  );
}

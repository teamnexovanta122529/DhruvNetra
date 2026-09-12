import { useEffect, useRef, useState } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";

/* =========================================================
   MAITRI STATION 3D MODEL WITH INTERACTIVE MODULES
   (Schirmacher Oasis, East Antarctica · Light Polar Theme)
========================================================= */
function MaitriStation({ selectedComponent, onSelectComponent }) {
  const [hovered, setHovered] = useState(null);

  const handleClick = (e, id) => {
    e.stopPropagation();
    onSelectComponent?.(id);
  };

  const handlePointerOver = (e, id) => {
    e.stopPropagation();
    setHovered(id);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    setHovered(null);
    document.body.style.cursor = "auto";
  };

  const isSelected = (id) => selectedComponent === id;
  const isHovered = (id) => hovered === id;

  return (
    <group position={[0, 0, 0]}>
      {/* Structural Foundation / Base Platform */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[4.2, 0.1, 2.6]} />
        <meshStandardMaterial color="#475569" roughness={0.7} metalness={0.4} />
      </mesh>

      {/* Main Habitat Module (Interactive) */}
      <mesh
        position={[0, 0.45, 0]}
        onClick={(e) => handleClick(e, "habitat")}
        onPointerOver={(e) => handlePointerOver(e, "habitat")}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[3.6, 0.9, 2.0]} />
        <meshStandardMaterial
          color={isSelected("habitat") ? "#38bdf8" : isHovered("habitat") ? "#e0f2fe" : "#ffffff"}
          emissive={isSelected("habitat") ? "#0284c7" : isHovered("habitat") ? "#0369a1" : "#000000"}
          emissiveIntensity={isSelected("habitat") ? 0.6 : isHovered("habitat") ? 0.25 : 0}
          roughness={0.3}
          metalness={0.2}
        />
      </mesh>

      {/* Living & Control Deck (Upper Level) */}
      <mesh
        position={[-0.4, 1.05, 0]}
        onClick={(e) => handleClick(e, "habitat")}
        onPointerOver={(e) => handlePointerOver(e, "habitat")}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[2.2, 0.5, 1.4]} />
        <meshStandardMaterial
          color={isSelected("habitat") ? "#0284c7" : isHovered("habitat") ? "#bae6fd" : "#f1f5f9"}
          emissive={isSelected("habitat") ? "#0284c7" : "#000000"}
          emissiveIntensity={isSelected("habitat") ? 0.5 : 0}
          roughness={0.35}
          metalness={0.25}
        />
      </mesh>

      {/* Laboratory & Workshop Module (Interactive) */}
      <mesh
        position={[1.4, 0.45, 0.3]}
        onClick={(e) => handleClick(e, "lab")}
        onPointerOver={(e) => handlePointerOver(e, "lab")}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[1.0, 0.8, 1.2]} />
        <meshStandardMaterial
          color={isSelected("lab") ? "#38bdf8" : isHovered("lab") ? "#e0f2fe" : "#f8fafc"}
          emissive={isSelected("lab") ? "#0ea5e9" : isHovered("lab") ? "#0284c7" : "#000000"}
          emissiveIntensity={isSelected("lab") ? 0.7 : 0}
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>

      {/* Observatory Dome (Interactive) */}
      <mesh
        position={[-0.9, 1.45, 0]}
        onClick={(e) => handleClick(e, "lab")}
        onPointerOver={(e) => handlePointerOver(e, "lab")}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.32, 24, 24, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#38bdf8"
          emissive={isSelected("lab") ? "#00f0ff" : "#0284c7"}
          emissiveIntensity={isSelected("lab") ? 1.2 : 0.4}
          roughness={0.15}
          metalness={0.6}
        />
      </mesh>

      {/* SATCOM & Met Mast (Interactive) */}
      <mesh
        position={[0.7, 1.5, -0.4]}
        onClick={(e) => handleClick(e, "satcom")}
        onPointerOver={(e) => handlePointerOver(e, "satcom")}
        onPointerOut={handlePointerOut}
      >
        <cylinderGeometry args={[0.04, 0.05, 1.8, 8]} />
        <meshStandardMaterial
          color={isSelected("satcom") ? "#0284c7" : "#64748b"}
          emissive={isSelected("satcom") ? "#00f0ff" : "#000000"}
          emissiveIntensity={isSelected("satcom") ? 0.8 : 0}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>

      {/* Parabolic Antenna Dish (Interactive) */}
      <mesh
        position={[0.7, 2.4, -0.4]}
        rotation={[0.4, 0.3, 0]}
        onClick={(e) => handleClick(e, "satcom")}
        onPointerOver={(e) => handlePointerOver(e, "satcom")}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.24, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={isSelected("satcom") ? "#0284c7" : "#ffffff"}
          emissive={isSelected("satcom") ? "#00f0ff" : "#0284c7"}
          emissiveIntensity={isSelected("satcom") ? 1.2 : 0.3}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>

      {/* Solar Array Left (Interactive) */}
      <mesh
        position={[-2.3, 0.3, 0.6]}
        rotation={[0.4, 0, 0]}
        onClick={(e) => handleClick(e, "solar")}
        onPointerOver={(e) => handlePointerOver(e, "solar")}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[0.9, 0.04, 1.4]} />
        <meshStandardMaterial
          color={isSelected("solar") ? "#0284c7" : "#1e3a8a"}
          emissive={isSelected("solar") ? "#38bdf8" : "#000000"}
          emissiveIntensity={isSelected("solar") ? 0.6 : 0}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Solar Array Right (Interactive) */}
      <mesh
        position={[-2.3, 0.3, -0.6]}
        rotation={[-0.4, 0, 0]}
        onClick={(e) => handleClick(e, "solar")}
        onPointerOver={(e) => handlePointerOver(e, "solar")}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[0.9, 0.04, 1.4]} />
        <meshStandardMaterial
          color={isSelected("solar") ? "#0284c7" : "#1e3a8a"}
          emissive={isSelected("solar") ? "#38bdf8" : "#000000"}
          emissiveIntensity={isSelected("solar") ? 0.6 : 0}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Fuel & Generator Shelter / Powerhouse (Interactive) */}
      <mesh
        position={[1.5, 0.3, -0.8]}
        onClick={(e) => handleClick(e, "powerhouse")}
        onPointerOver={(e) => handlePointerOver(e, "powerhouse")}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[1.1, 0.6, 0.9]} />
        <meshStandardMaterial
          color={isSelected("powerhouse") ? "#38bdf8" : isHovered("powerhouse") ? "#7dd3fc" : "#94a3b8"}
          emissive={isSelected("powerhouse") ? "#0284c7" : "#000000"}
          emissiveIntensity={isSelected("powerhouse") ? 0.8 : 0}
          roughness={0.5}
          metalness={0.3}
        />
      </mesh>

      {/* Status Beacon */}
      <mesh position={[0.7, 2.65, -0.4]}>
        <sphereGeometry args={[0.06, 16, 16]} />
        <meshStandardMaterial
          color="#0284c7"
          emissive="#38bdf8"
          emissiveIntensity={2.0}
        />
      </mesh>
    </group>
  );
}

/* =========================================================
   BHARATI STATION 3D MODEL WITH INTERACTIVE MODULES
   (Larsemann Hills / Coastal Aerodynamic Design · Light Theme)
========================================================= */
function BharatiStation({ selectedComponent, onSelectComponent }) {
  const [hovered, setHovered] = useState(null);

  const handleClick = (e, id) => {
    e.stopPropagation();
    onSelectComponent?.(id);
  };

  const handlePointerOver = (e, id) => {
    e.stopPropagation();
    setHovered(id);
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    setHovered(null);
    document.body.style.cursor = "auto";
  };

  const isSelected = (id) => selectedComponent === id;
  const isHovered = (id) => hovered === id;

  return (
    <group position={[0, 0, 0]}>
      {/* Hydraulic Support Stilts */}
      {[-1.8, -0.6, 0.6, 1.8].map((x) =>
        [-0.8, 0.8].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.25, z]}>
            <cylinderGeometry args={[0.06, 0.06, 0.7, 12]} />
            <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
          </mesh>
        ))
      )}

      {/* Elevated Aerodynamic Central Complex (Habitat & Control) */}
      <mesh
        position={[0, 0.9, 0]}
        onClick={(e) => handleClick(e, "habitat")}
        onPointerOver={(e) => handlePointerOver(e, "habitat")}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[4.6, 0.85, 2.2]} />
        <meshStandardMaterial
          color={isSelected("habitat") ? "#38bdf8" : isHovered("habitat") ? "#e0f2fe" : "#ffffff"}
          emissive={isSelected("habitat") ? "#0284c7" : isHovered("habitat") ? "#0369a1" : "#000000"}
          emissiveIntensity={isSelected("habitat") ? 0.6 : isHovered("habitat") ? 0.25 : 0}
          roughness={0.25}
          metalness={0.25}
        />
      </mesh>

      {/* Aerodynamic Chamfered Upper Module (Labs & Operations) */}
      <mesh
        position={[0, 1.5, 0]}
        onClick={(e) => handleClick(e, "lab")}
        onPointerOver={(e) => handlePointerOver(e, "lab")}
        onPointerOut={handlePointerOut}
      >
        <boxGeometry args={[3.8, 0.55, 1.6]} />
        <meshStandardMaterial
          color={isSelected("lab") ? "#0284c7" : isHovered("lab") ? "#bae6fd" : "#f1f5f9"}
          emissive={isSelected("lab") ? "#0284c7" : "#000000"}
          emissiveIntensity={isSelected("lab") ? 0.6 : 0}
          roughness={0.3}
          metalness={0.3}
        />
      </mesh>

      {/* Polar Expedition Signature Orange Accent Band */}
      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={[4.64, 0.12, 2.24]} />
        <meshStandardMaterial
          color="#ea580c"
          emissive="#9a3412"
          emissiveIntensity={0.3}
          roughness={0.35}
          metalness={0.3}
        />
      </mesh>

      {/* Primary Satellite Radome Dome (Interactive) */}
      <mesh
        position={[-1.2, 1.95, 0]}
        onClick={(e) => handleClick(e, "satcom")}
        onPointerOver={(e) => handlePointerOver(e, "satcom")}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={isSelected("satcom") ? "#00f0ff" : "#0284c7"}
          emissiveIntensity={isSelected("satcom") ? 1.2 : 0.3}
          roughness={0.15}
          metalness={0.5}
        />
      </mesh>

      {/* Secondary Met Radome (Interactive) */}
      <mesh
        position={[1.4, 1.9, 0.3]}
        onClick={(e) => handleClick(e, "satcom")}
        onPointerOver={(e) => handlePointerOver(e, "satcom")}
        onPointerOut={handlePointerOut}
      >
        <sphereGeometry args={[0.26, 20, 20]} />
        <meshStandardMaterial
          color="#f8fafc"
          emissive={isSelected("satcom") ? "#00f0ff" : "#0284c7"}
          emissiveIntensity={isSelected("satcom") ? 1.0 : 0.25}
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>

      {/* High-Gain Telecommunications Tower */}
      <mesh position={[0.4, 2.2, -0.4]}>
        <cylinderGeometry args={[0.03, 0.04, 1.6, 8]} />
        <meshStandardMaterial color="#64748b" metalness={0.8} roughness={0.2} />
      </mesh>

      {/* Radome Mast Beacon */}
      <mesh position={[0.4, 3.05, -0.4]}>
        <sphereGeometry args={[0.07, 16, 16]} />
        <meshStandardMaterial
          color="#0284c7"
          emissive="#38bdf8"
          emissiveIntensity={2.2}
        />
      </mesh>

      {/* Helipad Observation Platform (Interactive) */}
      <mesh
        position={[2.7, 0.65, 0]}
        onClick={(e) => handleClick(e, "helipad")}
        onPointerOver={(e) => handlePointerOver(e, "helipad")}
        onPointerOut={handlePointerOut}
      >
        <cylinderGeometry args={[0.8, 0.8, 0.1, 24]} />
        <meshStandardMaterial
          color={isSelected("helipad") ? "#0284c7" : "#cbd5e1"}
          emissive={isSelected("helipad") ? "#38bdf8" : "#000000"}
          emissiveIntensity={isSelected("helipad") ? 0.6 : 0}
          roughness={0.5}
          metalness={0.2}
        />
      </mesh>

      <mesh position={[2.7, 0.72, 0]}>
        <ringGeometry args={[0.3, 0.4, 24]} />
        <meshBasicMaterial color="#ea580c" />
      </mesh>
    </group>
  );
}

/* =========================================================
   CAMERA CONTROLLER WITH RESET SUPPORT
========================================================= */
function CameraController({ resetTrigger, station }) {
  const { camera } = useThree();
  const controlsRef = useRef(null);

  const defaultPos = [4.8, 3.0, 5.2];
  const defaultTarget = [0, 0.85, 0];

  useEffect(() => {
    if (controlsRef.current) {
      controlsRef.current.reset();
      camera.position.set(...defaultPos);
      camera.zoom = 1;
      camera.updateProjectionMatrix();

      controlsRef.current.target.set(...defaultTarget);
      controlsRef.current.update();
    }
  }, [resetTrigger, station, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      minDistance={3}
      maxDistance={14}
      target={defaultTarget}
      makeDefault
    />
  );
}

/* =========================================================
   MAIN 3D STATION SCENE WITH LIGHT ANTARCTIC ENVIRONMENT
========================================================= */
export default function StationScene({
  station = "MAITRI",
  resetTrigger = 0,
  selectedComponent = null,
  onSelectComponent = null,
}) {
  const isBharati = station.toUpperCase() === "BHARATI";

  return (
    <Canvas
      camera={{
        position: [4.8, 3.0, 5.2],
        fov: 36,
      }}
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: false,
      }}
    >
      {/* Light Polar Atmospheric Sky Background & Horizon Fog */}
      <color attach="background" args={["#e8f3f8"]} />
      <fog attach="fog" args={["#e8f3f8", 12, 28]} />

      {/* Balanced Polar Daylight Lighting Setup */}
      <ambientLight intensity={0.95} color="#f0f9ff" />

      <hemisphereLight args={["#f0f9ff", "#c8e2f0", 0.85]} />

      <directionalLight
        position={[7, 12, 7]}
        intensity={1.8}
        color="#ffffff"
        castShadow
      />

      <directionalLight
        position={[-6, 4, -6]}
        intensity={0.65}
        color="#bae6fd"
      />

      {/* Polar Ice Ground Disc */}
      <mesh position={[0, -0.06, 0]}>
        <cylinderGeometry args={[8.5, 8.5, 0.08, 64]} />
        <meshStandardMaterial
          color="#f1f7fa"
          roughness={0.7}
          metalness={0.05}
        />
      </mesh>

      {/* Subtle Digital-Twin Coordinate Grid */}
      <gridHelper
        args={[16, 16, "#0284c7", "#cbd5e1"]}
        position={[0, -0.015, 0]}
      />

      {/* 3D Station Model with interactive selection */}
      <Float speed={0.4} rotationIntensity={0.02} floatIntensity={0.04}>
        {isBharati ? (
          <BharatiStation
            selectedComponent={selectedComponent}
            onSelectComponent={onSelectComponent}
          />
        ) : (
          <MaitriStation
            selectedComponent={selectedComponent}
            onSelectComponent={onSelectComponent}
          />
        )}
      </Float>

      {/* Interactive Orbit Controls with Reset Handler */}
      <CameraController resetTrigger={resetTrigger} station={station} />
    </Canvas>
  );
}


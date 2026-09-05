import { useEffect, useRef } from "react";
import { Canvas, useThree } from "@react-three/fiber";
import { OrbitControls, Float } from "@react-three/drei";

/* =========================================================
   MAITRI STATION 3D MODEL
   (Schirmacher Oasis, East Antarctica)
========================================================= */
function MaitriStation() {
  return (
    <group position={[0, 0, 0]}>
      {/* Main Base Platform */}
      <mesh position={[0, -0.05, 0]}>
        <boxGeometry args={[4.2, 0.1, 2.6]} />
        <meshStandardMaterial color="#1a2f3a" roughness={0.7} />
      </mesh>

      {/* Main Habitat Module */}
      <mesh position={[0, 0.45, 0]}>
        <boxGeometry args={[3.6, 0.9, 2.0]} />
        <meshStandardMaterial
          color="#d2edf5"
          roughness={0.4}
          metalness={0.2}
        />
      </mesh>

      {/* Living & Control Deck (Upper Level) */}
      <mesh position={[-0.4, 1.05, 0]}>
        <boxGeometry args={[2.2, 0.5, 1.4]} />
        <meshStandardMaterial
          color="#a8d8e6"
          roughness={0.35}
          metalness={0.25}
        />
      </mesh>

      {/* Laboratory & Workshop Module */}
      <mesh position={[1.4, 0.45, 0.3]}>
        <boxGeometry args={[1.0, 0.8, 1.2]} />
        <meshStandardMaterial color="#bfe5ee" roughness={0.4} />
      </mesh>

      {/* Observatory Dome */}
      <mesh position={[-0.9, 1.45, 0]}>
        <sphereGeometry args={[0.32, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#7be5f3"
          emissive="#123d47"
          roughness={0.2}
          metalness={0.5}
        />
      </mesh>

      {/* SATCOM & Met Mast */}
      <mesh position={[0.7, 1.5, -0.4]}>
        <cylinderGeometry args={[0.04, 0.05, 1.8, 8]} />
        <meshStandardMaterial color="#88b5bf" metalness={0.7} />
      </mesh>

      {/* Parabolic Antenna Dish */}
      <mesh position={[0.7, 2.4, -0.4]} rotation={[0.4, 0.3, 0]}>
        <sphereGeometry args={[0.22, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color="#dffaff"
          emissive="#245d68"
          roughness={0.3}
          metalness={0.6}
        />
      </mesh>

      {/* Solar Array Left */}
      <mesh position={[-2.3, 0.3, 0.6]} rotation={[0.4, 0, 0]}>
        <boxGeometry args={[0.9, 0.04, 1.4]} />
        <meshStandardMaterial
          color="#15364d"
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Solar Array Right */}
      <mesh position={[-2.3, 0.3, -0.6]} rotation={[-0.4, 0, 0]}>
        <boxGeometry args={[0.9, 0.04, 1.4]} />
        <meshStandardMaterial
          color="#15364d"
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Fuel & Generator Shelter */}
      <mesh position={[1.5, 0.3, -0.8]}>
        <boxGeometry args={[1.1, 0.6, 0.9]} />
        <meshStandardMaterial color="#4f7a8c" roughness={0.6} />
      </mesh>

      {/* Glowing Status Beacon */}
      <mesh position={[0.7, 2.65, -0.4]}>
        <sphereGeometry args={[0.06, 12, 12]} />
        <meshStandardMaterial
          color="#67e8f9"
          emissive="#67e8f9"
          emissiveIntensity={2}
        />
      </mesh>
    </group>
  );
}

/* =========================================================
   BHARATI STATION 3D MODEL
   (Larsen Ice Shelf / Larsemann Hills, East Antarctica)
   Aerodynamic elevated modular architectural design
========================================================= */
function BharatiStation() {
  return (
    <group position={[0, 0, 0]}>
      {/* Hydraulic Support Stilts (Anti-Snowdrift Foundation) */}
      {[-1.8, -0.6, 0.6, 1.8].map((x) =>
        [-0.8, 0.8].map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.25, z]}>
            <cylinderGeometry args={[0.06, 0.06, 0.7, 8]} />
            <meshStandardMaterial color="#2d4a58" metalness={0.8} roughness={0.3} />
          </mesh>
        ))
      )}

      {/* Elevated Aerodynamic Central Complex */}
      <mesh position={[0, 0.9, 0]}>
        <boxGeometry args={[4.6, 0.85, 2.2]} />
        <meshStandardMaterial
          color="#e6f4f8"
          roughness={0.25}
          metalness={0.35}
        />
      </mesh>

      {/* Aerodynamic Chamfered Upper Module */}
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[3.8, 0.55, 1.6]} />
        <meshStandardMaterial
          color="#c8e8f2"
          roughness={0.3}
          metalness={0.4}
        />
      </mesh>

      {/* Bharati Aerospace Thermal Accent Band */}
      <mesh position={[0, 1.15, 0]}>
        <boxGeometry args={[4.64, 0.12, 2.24]} />
        <meshStandardMaterial
          color="#e08d65"
          emissive="#5c2612"
          roughness={0.4}
          metalness={0.5}
        />
      </mesh>

      {/* Primary Satellite Radome Dome */}
      <mesh position={[-1.2, 1.95, 0]}>
        <sphereGeometry args={[0.42, 24, 24]} />
        <meshStandardMaterial
          color="#dffffa"
          emissive="#155561"
          roughness={0.15}
          metalness={0.7}
        />
      </mesh>

      {/* Secondary Met Radome */}
      <mesh position={[1.4, 1.9, 0.3]}>
        <sphereGeometry args={[0.26, 16, 16]} />
        <meshStandardMaterial
          color="#a5ebf5"
          emissive="#124854"
          roughness={0.2}
          metalness={0.6}
        />
      </mesh>

      {/* High-Gain Telecommunications Tower */}
      <mesh position={[0.4, 2.2, -0.4]}>
        <cylinderGeometry args={[0.03, 0.04, 1.6, 8]} />
        <meshStandardMaterial color="#9cd8e6" metalness={0.8} />
      </mesh>

      {/* Radome Mast Beacon */}
      <mesh position={[0.4, 3.05, -0.4]}>
        <sphereGeometry args={[0.07, 12, 12]} />
        <meshStandardMaterial
          color="#78e5ee"
          emissive="#78e5ee"
          emissiveIntensity={2}
        />
      </mesh>

      {/* Helipad Observation Platform */}
      <mesh position={[2.7, 0.65, 0]}>
        <cylinderGeometry args={[0.8, 0.8, 0.1, 16]} />
        <meshStandardMaterial color="#1a3544" roughness={0.6} />
      </mesh>

      <mesh position={[2.7, 0.72, 0]}>
        <ringGeometry args={[0.3, 0.4, 16]} />
        <meshBasicMaterial color="#e08d65" />
      </mesh>
    </group>
  );
}

/* =========================================================
   CAMERA CONTROLLER WITH RESET SUPPORT
========================================================= */
function CameraController({ resetTrigger }) {
  const { camera } = useThree();
  const controlsRef = useRef(null);

  const defaultPos = [6, 4, 7];
  const defaultTarget = [0, 0.5, 0];

  useEffect(() => {
    if (resetTrigger > 0 && controlsRef.current) {
      // 1. Reset OrbitControls internal state
      controlsRef.current.reset();

      // 2. Explicitly reposition camera & look target
      camera.position.set(...defaultPos);
      camera.zoom = 1;
      camera.updateProjectionMatrix();

      controlsRef.current.target.set(...defaultTarget);
      controlsRef.current.update();
    }
  }, [resetTrigger, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      minDistance={3}
      maxDistance={16}
      target={defaultTarget}
      makeDefault
    />
  );
}

/* =========================================================
   MAIN 3D STATION SCENE
========================================================= */
export default function StationScene({ station = "MAITRI", resetTrigger = 0 }) {
  const isBharati = station === "BHARATI";

  return (
    <Canvas
      camera={{
        position: [6, 4, 7],
        fov: 42,
      }}
      dpr={[1, 1.75]}
      gl={{
        antialias: true,
        alpha: true,
      }}
    >
      {/* Lighting Setup */}
      <ambientLight intensity={1.1} />

      <directionalLight
        position={[6, 9, 6]}
        intensity={2.2}
        color="#eafaff"
      />

      <directionalLight
        position={[-6, 3, -5]}
        intensity={0.7}
        color="#70cde3"
      />

      {/* Grid Floor with Polar Glow */}
      <gridHelper
        args={[22, 22, "#2e5c6e", "#0e2430"]}
        position={[0, -0.01, 0]}
      />

      {/* 3D Station Model */}
      <Float speed={0.4} rotationIntensity={0.02} floatIntensity={0.04}>
        {isBharati ? <BharatiStation /> : <MaitriStation />}
      </Float>

      {/* Interactive Orbit Controls with Reset Handler */}
      <CameraController resetTrigger={resetTrigger} />
    </Canvas>
  );
}

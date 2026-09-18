import React, { useEffect, useRef, useState, useCallback } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import BharatiModel from "./BharatiModel";
import MaitriModel from "./MaitriModel";
import AnchoredFloatingCard from "./AnchoredFloatingCard";
import {
  CAMERA_BOOKMARKS,
  getComponentAnchor,
  normalizeComponentId,
} from "./stationMetadata";

/* =========================================================
   3D ANCHOR PULSING BEACON IN SCENE
========================================================= */
function StationAnchorBeacon({ position }) {
  const meshRef = useRef();
  const ringRef = useRef();

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (ringRef.current) {
      const s = 1 + Math.sin(t * 3.5) * 0.25;
      ringRef.current.scale.set(s, s, s);
      ringRef.current.rotation.y = t * 0.8;
    }
  });

  if (!position) return null;

  return (
    <group position={position}>
      {/* Central Target Orb */}
      <mesh ref={meshRef}>
        <sphereGeometry args={[0.45, 16, 16]} />
        <meshBasicMaterial color="#38bdf8" />
      </mesh>

      {/* Horizontal Pulsing Reticle Ring */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.9, 1.25, 32]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.65} side={THREE.DoubleSide} />
      </mesh>

      {/* Vertical Indicator Needle */}
      <mesh position={[0, -0.9, 0]}>
        <cylinderGeometry args={[0.04, 0.04, 1.8, 8]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

/* =========================================================
   REAL-TIME 3D-TO-SCREEN PROJECTION TRACKER (60 FPS)
========================================================= */
function ScreenProjectionTracker({
  station,
  selectedComponent,
  onScreenPosUpdate,
}) {
  const { camera, size } = useThree();
  const tempVec = useRef(new THREE.Vector3());
  const lastSent = useRef(null);

  useFrame(() => {
    if (!selectedComponent) {
      if (lastSent.current !== null) {
        lastSent.current = null;
        onScreenPosUpdate(null);
      }
      return;
    }

    const anchorPos = getComponentAnchor(station, selectedComponent);
    if (!anchorPos) {
      if (lastSent.current !== null) {
        lastSent.current = null;
        onScreenPosUpdate(null);
      }
      return;
    }

    tempVec.current.set(...anchorPos);
    tempVec.current.project(camera);

    // Convert Normalized Device Coordinates [-1, 1] to Canvas Pixels
    const x = ((tempVec.current.x + 1) / 2) * size.width;
    const y = ((-tempVec.current.y + 1) / 2) * size.height;
    const isVisible =
      Number.isFinite(x) &&
      Number.isFinite(y) &&
      tempVec.current.z < 1.0 &&
      x >= -50 &&
      x <= size.width + 50 &&
      y >= -50 &&
      y <= size.height + 50;

    const prev = lastSent.current;
    if (
      !prev ||
      prev.isVisible !== isVisible ||
      Math.abs(prev.x - x) > 1.2 ||
      Math.abs(prev.y - y) > 1.2 ||
      prev.containerWidth !== size.width ||
      prev.containerHeight !== size.height
    ) {
      const nextPos = {
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        isVisible,
        containerWidth: size.width,
        containerHeight: size.height,
      };
      lastSent.current = nextPos;
      onScreenPosUpdate(nextPos);
    }
  });

  return null;
}

/* =========================================================
   SMOOTH CAMERA & ORBIT CONTROLLER
========================================================= */
function DynamicCameraController({
  station,
  bookmark,
  selectedComponent,
  resetTrigger,
}) {
  const { camera } = useThree();
  const controlsRef = useRef(null);
  const stKey = String(station).toUpperCase() === "BHARATI" ? "BHARATI" : "MAITRI";

  const targetPos = useRef(new THREE.Vector3());
  const targetLook = useRef(new THREE.Vector3());
  const isTransitioning = useRef(false);

  // Initialize and React to Bookmark / Station / Reset changes
  useEffect(() => {
    const config = (CAMERA_BOOKMARKS[stKey] && CAMERA_BOOKMARKS[stKey][bookmark]) || CAMERA_BOOKMARKS[stKey].overview;
    targetPos.current.set(...config.position);
    targetLook.current.set(...config.target);
    isTransitioning.current = true;
  }, [stKey, bookmark, resetTrigger]);

  // Subtle Focus on Selected Component Behavior
  useEffect(() => {
    if (selectedComponent && controlsRef.current) {
      const anchor = getComponentAnchor(stKey, selectedComponent);
      if (anchor) {
        // Smoothly interpolate look target toward component while keeping overview perspective
        const compVec = new THREE.Vector3(...anchor);
        const currentTarget = controlsRef.current.target;
        
        // Soft blend: move look-at 65% towards the component
        targetLook.current.copy(currentTarget).lerp(compVec, 0.65);

        // Adjust camera position slightly to maintain comfortable distance
        const camDir = camera.position.clone().sub(currentTarget).normalize();
        const dist = Math.max(38, Math.min(85, camera.position.distanceTo(currentTarget) * 0.9));
        targetPos.current.copy(targetLook.current).add(camDir.multiplyScalar(dist));

        isTransitioning.current = true;
      }
    }
  }, [selectedComponent, stKey, camera]);

  useFrame((_, delta) => {
    if (isTransitioning.current && controlsRef.current) {
      const step = 1 - Math.exp(-delta * 5.5);
      camera.position.lerp(targetPos.current, step);
      controlsRef.current.target.lerp(targetLook.current, step);
      controlsRef.current.update();

      if (
        camera.position.distanceTo(targetPos.current) < 0.25 &&
        controlsRef.current.target.distanceTo(targetLook.current) < 0.25
      ) {
        isTransitioning.current = false;
      }
    }
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.06}
      minDistance={8}
      maxDistance={450}
      minPolarAngle={0.12}
      maxPolarAngle={Math.PI / 2 - 0.05} // clamp to prevent clipping underground
      target={CAMERA_BOOKMARKS[stKey].overview.target}
      makeDefault
    />
  );
}

/* =========================================================
   POLAR LIGHTING ENVIRONMENT
========================================================= */
function PolarLighting({ lightingMode = "day" }) {
  const isNight = lightingMode === "night";
  const isOvercast = lightingMode === "overcast";

  return (
    <group>
      {/* Sky & Ambient Fill */}
      <ambientLight
        intensity={isNight ? 0.15 : isOvercast ? 0.8 : 0.72}
        color={isNight ? "#1e293b" : "#f0f9ff"}
      />
      <hemisphereLight
        args={[
          isNight ? "#0f172a" : "#f8fafc",
          isNight ? "#020617" : "#94a3b8",
          isNight ? 0.25 : isOvercast ? 0.75 : 0.6,
        ]}
      />

      {/* Directional Sun */}
      <directionalLight
        position={isNight ? [-20, 30, -20] : isOvercast ? [15, 50, 15] : [45, 65, 45]}
        intensity={isNight ? 0.3 : isOvercast ? 1.1 : 2.5}
        color={isNight ? "#38bdf8" : isOvercast ? "#e2e8f0" : "#fffdf5"}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-near={1}
        shadow-camera-far={600}
        shadow-camera-left={-120}
        shadow-camera-right={120}
        shadow-camera-top={120}
        shadow-camera-bottom={-120}
        shadow-bias={-0.0001}
      />

      {/* Night Occupied Station Glow */}
      {isNight && (
        <group>
          <pointLight position={[0, 8, 15]} intensity={3.5} distance={45} color="#f59e0b" />
          <pointLight position={[0, 8, -15]} intensity={3.5} distance={45} color="#f59e0b" />
          <pointLight position={[76, 6, 232]} intensity={4.0} distance={55} color="#38bdf8" />
          <pointLight position={[-82, 5, -15]} intensity={3.0} distance={40} color="#f59e0b" />
        </group>
      )}
    </group>
  );
}

/* =========================================================
   MAIN 3D DIGITAL TWIN SCENE COMPONENT
========================================================= */
export default function StationScene({
  station = "MAITRI",
  resetTrigger = 0,
  selectedComponent = null,
  onSelectComponent = null,
  telemetry = null,
  sceneMode = "exterior",
  floorMode = "all",
  lightingMode = "day",
  bookmark = "overview",
  showLabels = false,
}) {
  const isBharati = String(station).toUpperCase() === "BHARATI";
  const [screenPos, setScreenPos] = useState(null);
  const [hoveredComponent, setHoveredComponent] = useState(null);

  const normalizedSelected = normalizeComponentId(selectedComponent);
  const selectedAnchor = normalizedSelected ? getComponentAnchor(station, normalizedSelected) : null;

  const backgroundColor =
    lightingMode === "night"
      ? "#020617"
      : lightingMode === "overcast"
      ? "#cbd5e1"
      : "#e2e8f0";

  // Deselect on clicking empty canvas background
  const handlePointerMissed = useCallback(() => {
    if (onSelectComponent) {
      onSelectComponent(null);
    }
  }, [onSelectComponent]);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>
      <Canvas
        shadows
        camera={{
          position: isBharati ? [-46, 30, -50] : [-52, 34, -58],
          fov: 36,
          near: 0.1,
          far: 2000,
        }}
        dpr={[1, 2]}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: lightingMode === "night" ? 0.9 : 1.15,
        }}
        onPointerMissed={handlePointerMissed}
      >
        {/* Background & Atmospheric Depth Fog */}
        <color attach="background" args={[backgroundColor]} />
        <fog
          attach="fog"
          args={[
            backgroundColor,
            lightingMode === "night" ? 180 : 280,
            lightingMode === "night" ? 650 : 950,
          ]}
        />

        {/* Polar Lighting Environment */}
        <PolarLighting lightingMode={lightingMode} />

        {/* 3D Station Models */}
        {isBharati ? (
          <BharatiModel
            sceneMode={sceneMode}
            floorMode={floorMode}
            selectedComponent={normalizedSelected}
            hoveredComponent={hoveredComponent}
            onSelectComponent={onSelectComponent}
            onHoverComponent={setHoveredComponent}
            showLabels={showLabels}
          />
        ) : (
          <MaitriModel
            sceneMode={sceneMode}
            floorMode={floorMode}
            selectedComponent={normalizedSelected}
            hoveredComponent={hoveredComponent}
            onSelectComponent={onSelectComponent}
            onHoverComponent={setHoveredComponent}
            showLabels={showLabels}
          />
        )}

        {/* Pulsing 3D Anchor Beacon */}
        {selectedAnchor && <StationAnchorBeacon position={selectedAnchor} />}

        {/* 60fps Real-Time Screen Coordinate Tracker */}
        <ScreenProjectionTracker
          station={station}
          selectedComponent={normalizedSelected}
          onScreenPosUpdate={setScreenPos}
        />

        {/* Camera Navigation Controller */}
        <DynamicCameraController
          station={station}
          bookmark={bookmark}
          selectedComponent={normalizedSelected}
          resetTrigger={resetTrigger}
        />
      </Canvas>

      {/* Dynamic 3D-to-Screen Anchored Telemetry Card */}
      {normalizedSelected && screenPos && (
        <AnchoredFloatingCard
          station={station}
          componentId={normalizedSelected}
          telemetry={telemetry}
          screenPos={screenPos}
          onClose={() => onSelectComponent?.(null)}
        />
      )}

      {/* Subtle Hover Tooltip */}
      {hoveredComponent && !normalizedSelected && (
        <div
          style={{
            position: "absolute",
            bottom: "16px",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(15, 23, 42, 0.88)",
            border: "1px solid rgba(56, 189, 248, 0.5)",
            color: "#f8fafc",
            padding: "4px 12px",
            borderRadius: "4px",
            fontSize: "11px",
            fontFamily: "ui-monospace, monospace",
            fontWeight: 700,
            letterSpacing: "0.08em",
            pointerEvents: "none",
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            zIndex: 15,
          }}
        >
          <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#38bdf8" }} />
          <span>INSPECT: {hoveredComponent.replace(/_/g, " ").toUpperCase()}</span>
        </div>
      )}
    </div>
  );
}

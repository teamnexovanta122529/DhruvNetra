import { Canvas, useFrame } from "@react-three/fiber";
import { useRef } from "react";
import FloatingIce from "./FloatingIce";

function Scene({ mouse }) {
  const groupRef = useRef();

  useFrame(() => {
    if (!groupRef.current) return;

    const targetX = mouse.current.x * 0.12;
    const targetY = mouse.current.y * 0.08;

    groupRef.current.rotation.y = THREE_LERP(
      groupRef.current.rotation.y,
      targetX * 0.1,
      0.025
    );

    groupRef.current.rotation.x = THREE_LERP(
      groupRef.current.rotation.x,
      -targetY * 0.1,
      0.025
    );

    groupRef.current.position.x +=
      (targetX - groupRef.current.position.x) * 0.025;

    groupRef.current.position.y +=
      (targetY - groupRef.current.position.y) * 0.025;
  });

  return (
    <group ref={groupRef}>
      <FloatingIce mouse={mouse} />
    </group>
  );
}

function THREE_LERP(current, target, amount) {
  return current + (target - current) * amount;
}

export default function AtmosphereCanvas({ mouse }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        camera={{
          position: [0, 0, 8],
          fov: 45,
        }}
        dpr={[1, 1.5]}
        gl={{
          alpha: true,
          antialias: true,
        }}
      >
        <ambientLight intensity={0.5} />

        <directionalLight
          position={[4, 5, 6]}
          intensity={1.1}
          color="#dffaff"
        />

        <Scene mouse={mouse} />
      </Canvas>
    </div>
  );
}
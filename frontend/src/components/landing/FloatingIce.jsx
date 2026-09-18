import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function IceChunk({ position, scale, speed, rotationSpeed, mouse }) {
  const meshRef = useRef();

  const geometry = useMemo(() => {
    return new THREE.IcosahedronGeometry(0.12, 0);
  }, []);

  useFrame((state) => {
    if (!meshRef.current) return;

    const time = state.clock.elapsedTime;

    meshRef.current.rotation.x += rotationSpeed;
    meshRef.current.rotation.y += rotationSpeed * 0.7;

    meshRef.current.position.y =
      position[1] + Math.sin(time * speed + position[0]) * 0.08;

    meshRef.current.position.x =
      position[0] + Math.sin(time * speed * 0.4) * 0.12;

    meshRef.current.position.x += mouse.current.x * 0.018;
    meshRef.current.position.y += mouse.current.y * 0.012;
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      scale={scale}
      geometry={geometry}
    >
      <meshPhysicalMaterial
        color="#d9f6ff"
        roughness={0.32}
        metalness={0.05}
        transmission={0.25}
        transparent
        opacity={0.32}
        clearcoat={0.45}
        clearcoatRoughness={0.25}
      />
    </mesh>
  );
}

// Deterministic pseudo-random sequence for pure useMemo rendering
function seededRand(seed) {
  const x = Math.sin(seed * 9999) * 10000;
  return x - Math.floor(x);
}

export default function FloatingIce({ mouse }) {
  const pieces = useMemo(() => {
    return Array.from({ length: 22 }, (_, index) => {
      const r1 = seededRand(index * 4 + 1);
      const r2 = seededRand(index * 4 + 2);
      const r3 = seededRand(index * 4 + 3);
      const r4 = seededRand(index * 4 + 4);
      const depth = r1;

      return {
        id: index,
        position: [
          (r2 - 0.5) * 16,
          (r3 - 0.5) * 9,
          THREE.MathUtils.lerp(-1, 7, depth),
        ],
        scale: THREE.MathUtils.lerp(0.25, 0.75, depth),
        speed: THREE.MathUtils.lerp(0.25, 0.65, r4),
        rotationSpeed: THREE.MathUtils.lerp(0.0008, 0.003, r1),
      };
    });
  }, []);

  return (
    <>
      {pieces.map((piece) => (
        <IceChunk
          key={piece.id}
          {...piece}
          mouse={mouse}
        />
      ))}
    </>
  );
}
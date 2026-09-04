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

export default function FloatingIce({ mouse }) {
  const pieces = useMemo(() => {
    return Array.from({ length: 22 }, (_, index) => {
      const depth = Math.random();

      return {
        id: index,

        position: [
          (Math.random() - 0.5) * 16,
          (Math.random() - 0.5) * 9,
          THREE.MathUtils.lerp(-1, 7, depth),
        ],

        scale: THREE.MathUtils.lerp(0.25, 0.75, depth),

        speed: THREE.MathUtils.lerp(0.25, 0.65, Math.random()),

        rotationSpeed: THREE.MathUtils.lerp(
          0.0008,
          0.003,
          Math.random()
        ),
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
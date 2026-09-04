import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

function SnowParticles({ mouse }) {
  const pointsRef = useRef();

  const particleCount = 850;

  const { positions, sizes, speeds, drift } = useMemo(() => {
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const speeds = new Float32Array(particleCount);
    const drift = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      positions[i3] = (Math.random() - 0.5) * 28;
      positions[i3 + 1] = (Math.random() - 0.5) * 18;
      positions[i3 + 2] = Math.random() * 18 - 8;

      const depth = Math.random();

      sizes[i] = THREE.MathUtils.lerp(0.025, 0.075, depth);

      speeds[i] = THREE.MathUtils.lerp(0.08, 0.22, Math.random());

      drift[i] = THREE.MathUtils.lerp(-0.08, 0.08, Math.random());
    }

    return {
      positions,
      sizes,
      speeds,
      drift,
    };
  }, []);

  const geometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();

    geometry.setAttribute(
      "position",
      new THREE.BufferAttribute(positions, 3)
    );

    geometry.setAttribute(
      "aSize",
      new THREE.BufferAttribute(sizes, 1)
    );

    return geometry;
  }, [positions, sizes]);

  useFrame((state, delta) => {
    if (!pointsRef.current) return;

    const positionAttribute =
      pointsRef.current.geometry.attributes.position;

    const array = positionAttribute.array;

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;

      // Downward movement
      array[i3 + 1] -= speeds[i] * delta;

      // Antarctic wind
      array[i3] += drift[i] * delta;

      // Mouse influence
      array[i3] += mouse.current.x * 0.004;
      array[i3 + 1] += mouse.current.y * 0.002;

      // Recycle particles
      if (array[i3 + 1] < -9) {
        array[i3 + 1] = 9;
        array[i3] = (Math.random() - 0.5) * 28;
      }

      if (array[i3] > 15) {
        array[i3] = -15;
      }

      if (array[i3] < -15) {
        array[i3] = 15;
      }
    }

    positionAttribute.needsUpdate = true;

    pointsRef.current.rotation.y += delta * 0.003;
  });

  return (
    <points ref={pointsRef} geometry={geometry}>
      <pointsMaterial
        size={0.045}
        color="#eafaff"
        transparent
        opacity={0.52}
        depthWrite={false}
        sizeAttenuation
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}

export default function SnowOverlay({ mouse }) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      <Canvas
        camera={{
          position: [0, 0, 10],
          fov: 50,
        }}
        dpr={[1, 1.5]}
        gl={{
          alpha: true,
          antialias: false,
        }}
      >
        <SnowParticles mouse={mouse} />
      </Canvas>
    </div>
  );
}
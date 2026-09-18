import * as THREE from "three";

/* =========================================================
   NOISE & PROCEDURAL TERRAIN MATH
========================================================= */
export function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let result = value;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
}

export function smoothNoise(x, z) {
  const waveA = Math.sin(x * 0.034 + Math.cos(z * 0.017) * 1.7);
  const waveB = Math.cos(z * 0.027 - x * 0.011) * 0.72;
  const ridge = Math.abs(Math.sin((x + z) * 0.015)) * 0.9;
  const fine = Math.sin(x * 0.11) * Math.cos(z * 0.087) * 0.22;
  const longRockBands = Math.pow(Math.abs(Math.sin(x * 0.043 + z * 0.014)), 7) * 0.72;
  const crossFracture = Math.pow(Math.abs(Math.sin(z * 0.052 - x * 0.009)), 12) * 0.3;
  return waveA + waveB + ridge + fine + longRockBands + crossFracture;
}

export function terrainHeight(x, z) {
  const radialPad = Math.max(0, 1 - Math.hypot(x / 46, z / 60));
  const stationFootprint = Math.max(
    0,
    Math.min(
      1,
      (39 - Math.abs(x)) / 8,
      (45 - z) / 8,
      (z + 33) / 8
    )
  );
  const natural = smoothNoise(x, z) * 3.2 + Math.sin(z * 0.009) * 2.4;
  const flattened = THREE.MathUtils.lerp(natural, 0, Math.max(radialPad * 0.88, stationFootprint * 0.94));
  const coastDrop = z > 205 ? -(z - 205) * 0.12 : 0;
  return flattened + coastDrop;
}

/* =========================================================
   GEOMETRY BATCHING UTILITIES
========================================================= */
const BOX_FACES = [
  { normal: [1, 0, 0], corners: [[1, -1, -1], [1, -1, 1], [1, 1, 1], [1, 1, -1]] },
  { normal: [-1, 0, 0], corners: [[-1, -1, 1], [-1, -1, -1], [-1, 1, -1], [-1, 1, 1]] },
  { normal: [0, 1, 0], corners: [[-1, 1, -1], [1, 1, -1], [1, 1, 1], [-1, 1, 1]] },
  { normal: [0, -1, 0], corners: [[-1, -1, 1], [1, -1, 1], [1, -1, -1], [-1, -1, -1]] },
  { normal: [0, 0, 1], corners: [[1, -1, 1], [-1, -1, 1], [-1, 1, 1], [1, 1, 1]] },
  { normal: [0, 0, -1], corners: [[-1, -1, -1], [1, -1, -1], [1, 1, -1], [-1, 1, -1]] },
];

export function createMergedBoxesGeometry(parts) {
  const positions = [];
  const normals = [];
  const indices = [];

  const point = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const transformed = new THREE.Vector3();
  const matrix = new THREE.Matrix4();
  const normalMatrix = new THREE.Matrix4();
  const quat = new THREE.Quaternion();
  const euler = new THREE.Euler();

  for (const part of parts) {
    const [rotX, rotY, rotZ] = part.rotation ?? [0, 0, 0];
    euler.set(
      THREE.MathUtils.degToRad(rotX),
      THREE.MathUtils.degToRad(rotY),
      THREE.MathUtils.degToRad(rotZ)
    );
    quat.setFromEuler(euler);

    matrix.compose(
      new THREE.Vector3(...part.position),
      quat,
      new THREE.Vector3(...part.scale)
    );
    normalMatrix.makeRotationFromQuaternion(quat);

    for (const face of BOX_FACES) {
      const base = positions.length / 3;
      normal.set(face.normal[0], face.normal[1], face.normal[2]);
      transformed.copy(normal).applyMatrix4(normalMatrix).normalize();

      for (const corner of face.corners) {
        point.set(corner[0] * 0.5, corner[1] * 0.5, corner[2] * 0.5);
        point.applyMatrix4(matrix);
        positions.push(point.x, point.y, point.z);
        normals.push(transformed.x, transformed.y, transformed.z);
      }
      indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  return geometry;
}

export function createTaperedPrismGeometry(widthBottom, widthTop, height, length) {
  const xb = widthBottom / 2;
  const xt = widthTop / 2;
  const yb = -height / 2;
  const yt = height / 2;
  const z = length / 2;

  const vertices = [
    [-xb, yb, -z], [xb, yb, -z], [xb, yb, z], [-xb, yb, z],
    [-xt, yt, -z], [xt, yt, -z], [xt, yt, z], [-xt, yt, z],
  ];
  const faces = [
    [0, 3, 2, 1], [4, 5, 6, 7], [0, 1, 5, 4],
    [3, 7, 6, 2], [1, 2, 6, 5], [0, 4, 7, 3],
  ];

  const positions = [];
  const normals = [];
  const indices = [];

  for (const face of faces) {
    const a = new THREE.Vector3(...vertices[face[0]]);
    const b = new THREE.Vector3(...vertices[face[1]]);
    const c = new THREE.Vector3(...vertices[face[2]]);
    const ab = new THREE.Vector3().subVectors(b, a);
    const ac = new THREE.Vector3().subVectors(c, a);
    const n = new THREE.Vector3().crossVectors(ab, ac).normalize();

    const base = positions.length / 3;
    for (const index of face) {
      positions.push(...vertices[index]);
      normals.push(n.x, n.y, n.z);
    }
    indices.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  return geometry;
}

export function createTerrainGeometry(size = 700, resolution = 96, colorTone = "granite") {
  const positions = [];
  const normals = [];
  const indices = [];
  const colors = [];

  const step = size / (resolution - 1);
  const half = size / 2;

  for (let zIndex = 0; zIndex < resolution; zIndex += 1) {
    for (let xIndex = 0; xIndex < resolution; xIndex += 1) {
      const x = -half + xIndex * step;
      const z = -half + zIndex * step;
      const y = terrainHeight(x, z);
      positions.push(x, y, z);

      const dx = terrainHeight(x + 0.5, z) - terrainHeight(x - 0.5, z);
      const dz = terrainHeight(x, z + 0.5) - terrainHeight(x - 0.5, z);
      const n = new THREE.Vector3(-dx, 1, -dz).normalize();
      normals.push(n.x, n.y, n.z);

      const striation = Math.sin(x * 0.22 + z * 0.055) * 0.5 + 0.5;
      const broadTone = Math.sin(x * 0.017 - z * 0.012) * 0.5 + 0.5;
      const slope = THREE.MathUtils.clamp(1 - n.y, 0, 1);

      let grey = 0.24 + striation * 0.11 + broadTone * 0.06;
      let r = grey;
      let g = grey;
      let b = grey - 0.01;

      if (colorTone === "gneiss") {
        r = 0.52 * grey * 1.55;
        g = 0.61 * grey * 1.55;
        b = 0.66 * grey * 1.55;
      } else {
        const mineralWarmth = (1 - slope) * (0.015 + broadTone * 0.015);
        r += mineralWarmth * 1.2;
        g += mineralWarmth * 0.9;
      }

      colors.push(r, g, b);
    }
  }

  for (let zIndex = 0; zIndex < resolution - 1; zIndex += 1) {
    for (let xIndex = 0; xIndex < resolution - 1; xIndex += 1) {
      const a = zIndex * resolution + xIndex;
      const b = a + 1;
      const c = a + resolution;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  return geometry;
}

export function createSurfacePatchGeometry(centerX, centerZ, radiusX, radiusZ, rotationDeg, seed, lift = 0.1, segments = 22) {
  const random = seededRandom(seed);
  const positions = [centerX, terrainHeight(centerX, centerZ) + lift, centerZ];
  const normals = [0, 1, 0];
  const indices = [];
  const rotation = THREE.MathUtils.degToRad(rotationDeg);

  for (let index = 0; index < segments; index += 1) {
    const angle = (index / segments) * Math.PI * 2;
    const irregularity = 0.75 + random() * 0.32;
    const localX = Math.cos(angle) * radiusX * irregularity;
    const localZ = Math.sin(angle) * radiusZ * irregularity;
    const x = centerX + localX * Math.cos(rotation) - localZ * Math.sin(rotation);
    const z = centerZ + localX * Math.sin(rotation) + localZ * Math.cos(rotation);
    positions.push(x, terrainHeight(x, z) + lift, z);
    normals.push(0, 1, 0);
  }

  for (let index = 0; index < segments; index += 1) {
    indices.push(0, ((index + 1) % segments) + 1, index + 1);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  return geometry;
}

export function createRockOutcropGeometry(centerX, centerZ, radiusX, radiusZ, height, seed) {
  const random = seededRandom(seed);
  const segments = 10;
  const baseY = terrainHeight(centerX, centerZ) - 0.08;
  const positions = [];
  const indices = [];

  for (let ring = 0; ring < 2; ring += 1) {
    for (let index = 0; index < segments; index += 1) {
      const angle = (index / segments) * Math.PI * 2;
      const jitter = 0.78 + random() * 0.3;
      const taper = ring === 0 ? 1 : 0.6 + random() * 0.18;
      positions.push(
        centerX + Math.cos(angle) * radiusX * jitter * taper,
        baseY + (ring === 0 ? 0 : height * (0.75 + random() * 0.25)),
        centerZ + Math.sin(angle) * radiusZ * jitter * taper
      );
    }
  }
  positions.push(
    centerX + (random() - 0.5) * radiusX * 0.2,
    baseY + height * 1.1,
    centerZ + (random() - 0.5) * radiusZ * 0.2
  );

  const peak = segments * 2;
  for (let index = 0; index < segments; index += 1) {
    const next = (index + 1) % segments;
    indices.push(index, segments + next, next, index, segments + index, segments + next);
    indices.push(segments + index, peak, segments + next);
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  return geometry;
}

export function createTerrainRibbonGeometry(points, width, lift = 0.09) {
  const positions = [];
  const normals = [];
  const indices = [];

  points.forEach(([x, z], index) => {
    const prev = points[Math.max(0, index - 1)];
    const next = points[Math.min(points.length - 1, index + 1)];
    const tanX = next[0] - prev[0];
    const tanZ = next[1] - prev[1];
    const len = Math.hypot(tanX, tanZ) || 1;
    const sideX = (-tanZ / len) * width * 0.5;
    const sideZ = (tanX / len) * width * 0.5;

    for (const side of [-1, 1]) {
      const px = x + sideX * side;
      const pz = z + sideZ * side;
      positions.push(px, terrainHeight(px, pz) + lift, pz);
      normals.push(0, 1, 0);
    }

    if (index < points.length - 1) {
      const base = index * 2;
      indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3);
    }
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute("normal", new THREE.Float32BufferAttribute(normals, 3));
  geometry.setIndex(indices);
  return geometry;
}

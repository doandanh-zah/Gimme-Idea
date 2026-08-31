'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useMemo, useRef, useState } from 'react';
import type { Group } from 'three';

const nodes: [number, number, number][] = [
  [-1.4, 0.9, 0],
  [-0.65, 1.35, 0.2],
  [0.15, 1.15, -0.1],
  [1.1, 0.7, 0.1],
  [-1.55, 0.05, 0.1],
  [-0.65, 0.3, 0.45],
  [0.35, 0.35, 0.25],
  [1.45, -0.1, 0],
  [-1.1, -0.85, 0.1],
  [-0.15, -0.55, 0.4],
  [0.75, -0.75, 0.15],
  [0.15, -1.4, 0],
];
const paths = [
  [0, 1, 2, 3],
  [0, 4, 5, 6, 3],
  [4, 8, 9, 10, 7],
  [8, 11, 10],
  [2, 6, 9, 11],
  [3, 7, 10],
];
const linePositions = new Float32Array(
  paths.flatMap((path) =>
    path
      .slice(1)
      .flatMap((nodeIndex, edgeIndex) => [...nodes[path[edgeIndex]!]!, ...nodes[nodeIndex]!]),
  ),
);
const particlePositions = new Float32Array(
  Array.from({ length: 18 }, (_, index) => [
    Math.sin(index * 2.17) * 2,
    Math.cos(index * 1.31) * 1.8,
    Math.sin(index * 0.73) * 0.55,
  ]).flat(),
);

function Network() {
  const group = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (group.current) {
      group.current.rotation.y = Math.sin(clock.elapsedTime * 0.18) * 0.18;
      group.current.rotation.x = Math.cos(clock.elapsedTime * 0.14) * 0.06;
    }
  });
  return (
    <group ref={group}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[linePositions, 3]} />
        </bufferGeometry>
        <lineBasicMaterial color="#FFD700" transparent opacity={0.38} />
      </lineSegments>
      {nodes.map((position, index) => (
        <mesh key={index} position={position}>
          <sphereGeometry args={[index % 4 === 0 ? 0.09 : 0.055, 12, 12]} />
          <meshBasicMaterial color={index % 3 === 0 ? '#FFD700' : '#F4F0E8'} />
        </mesh>
      ))}
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particlePositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#9945FF" size={0.028} transparent opacity={0.65} />
      </points>
    </group>
  );
}

export function BrainScene() {
  const [available, setAvailable] = useState(true);
  const dpr = useMemo(() => Math.min(window.devicePixelRatio, 1.35), []);
  if (!available) return null;
  return (
    <Canvas
      className="brain-canvas"
      dpr={dpr}
      camera={{ position: [0, 0, 5], fov: 42 }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onCreated={({ gl }) => {
        gl.domElement.addEventListener('webglcontextlost', () => setAvailable(false), {
          once: true,
        });
      }}
    >
      <Network />
    </Canvas>
  );
}

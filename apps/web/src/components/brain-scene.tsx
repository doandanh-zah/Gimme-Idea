'use client';

import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useNarrativeStage } from '@/lib/narrative-stage';
import { Group, MathUtils } from 'three';

// Deterministic paired hemispheres: a neural sculpture, not a medical model.
function hemisphere(side: number) {
  const points: number[] = [];
  const lines: number[] = [];
  const rows = 18,
    columns = 30;
  for (let row = 0; row <= rows; row++) {
    const phi = (Math.PI * row) / rows;
    for (let column = 0; column <= columns; column++) {
      const theta = (Math.PI * 2 * column) / columns;
      const fold = 1 + 0.055 * Math.sin(theta * 6 + phi * 7);
      points.push(
        side * (0.7 + 0.68 * Math.sin(phi) * Math.cos(theta) * fold),
        1.06 * Math.cos(phi) * fold,
        0.85 * Math.sin(phi) * Math.sin(theta) * fold,
      );
    }
  }
  for (let row = 0; row < rows; row++)
    for (let column = 0; column < columns; column++) {
      const index = (row * (columns + 1) + column) * 3;
      for (const next of [index + 3, index + (columns + 1) * 3])
        lines.push(...points.slice(index, index + 3), ...points.slice(next, next + 3));
    }
  return { points: new Float32Array(points), lines: new Float32Array(lines) };
}
const left = hemisphere(-1);
const right = hemisphere(1);

function Hemisphere({ side, stage }: { side: number; stage: number }) {
  const group = useRef<Group>(null);
  const data = side < 0 ? left : right;
  useFrame((_, delta) => {
    if (!group.current) return;
    const spread =
      stage >= 2 && stage <= 3
        ? 0.42
        : stage === 4
          ? 0.12
          : stage === 5
            ? 0.24
            : stage === 6
              ? 0.06
              : 0;
    group.current.position.x = MathUtils.damp(group.current.position.x, side * spread, 4, delta);
    group.current.rotation.z = MathUtils.damp(
      group.current.rotation.z,
      side * (stage === 3 ? -0.18 : 0),
      4,
      delta,
    );
  });
  return (
    <group ref={group}>
      <lineSegments>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.lines, 3]} />
        </bufferGeometry>
        <lineBasicMaterial
          color={side < 0 ? '#BA91F5' : '#F9D65C'}
          transparent
          opacity={stage === 4 ? 0.16 : 0.32}
        />
      </lineSegments>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[data.points, 3]} />
        </bufferGeometry>
        <pointsMaterial
          color={side < 0 ? '#BA91F5' : '#F9D65C'}
          size={0.022}
          transparent
          opacity={0.8}
          sizeAttenuation
        />
      </points>
    </group>
  );
}
function Network({ stage }: { stage: number }) {
  const group = useRef<Group>(null);
  useFrame(({ clock, pointer }, delta) => {
    if (!group.current) return;
    group.current.rotation.y = MathUtils.damp(
      group.current.rotation.y,
      Math.sin(clock.elapsedTime * 0.13) * 0.22 + pointer.x * 0.12,
      3,
      delta,
    );
    group.current.rotation.x = MathUtils.damp(
      group.current.rotation.x,
      -0.08 + pointer.y * 0.06,
      3,
      delta,
    );
  });
  return (
    <group ref={group} rotation={[0, 0.2, 0.06]}>
      <Hemisphere side={-1} stage={stage} />
      <Hemisphere side={1} stage={stage} />
      {Array.from({ length: 8 }, (_, i) => (
        <mesh
          key={i}
          position={[
            Math.sin(i * 2.1) * (stage >= 2 ? 1.9 : 1.45),
            Math.cos(i * 1.6) * 1.55,
            Math.sin(i) * 0.5,
          ]}
          rotation={[i * 0.3, i * 0.5, 0]}
        >
          {stage === 6 ? (
            <torusGeometry args={[0.08, 0.025, 6, 12]} />
          ) : stage === 4 || stage === 5 ? (
            <boxGeometry args={[0.13, 0.13, 0.13]} />
          ) : (
            <octahedronGeometry args={[0.055]} />
          )}
          <meshBasicMaterial color={i % 2 === 0 ? '#BA91F5' : '#F9D65C'} wireframe={stage === 4} />
        </mesh>
      ))}
    </group>
  );
}

function RenderFrame({ onReady }: { onReady: () => void }) {
  const ready = useRef(false);
  useFrame(({ gl, scene, camera }) => {
    gl.render(scene, camera);
    if (!ready.current) {
      ready.current = true;
      onReady();
    }
  }, 1);
  return null;
}
export function BrainScene({
  paused = false,
  onReady,
  onFailure,
}: {
  paused?: boolean;
  onReady: () => void;
  onFailure: () => void;
}) {
  const [available, setAvailable] = useState(true);
  const [active, setActive] = useState(true);
  const [visible, setVisible] = useState(true);
  const stage = useNarrativeStage();
  const [ready, setReady] = useState(false);
  const wrapper = useRef<HTMLDivElement>(null);
  const dpr = useMemo(() => Math.min(window.devicePixelRatio, 1.35), []);
  useEffect(() => {
    const visibility = () => setVisible(document.visibilityState === 'visible');
    document.addEventListener('visibilitychange', visibility);
    const observer = new IntersectionObserver(([entry]) =>
      setActive(Boolean(entry?.isIntersecting)),
    );
    if (wrapper.current) observer.observe(wrapper.current);
    return () => {
      observer.disconnect();
      document.removeEventListener('visibilitychange', visibility);
    };
  }, []);
  if (!available) return null;
  return (
    <div ref={wrapper} className="brain-canvas" data-scene-ready={ready} aria-hidden="true">
      <Canvas
        dpr={dpr}
        frameloop={active && visible && !paused ? 'always' : 'never'}
        camera={{ position: [0, 0, 5], fov: 43 }}
        gl={{ antialias: true, alpha: true, powerPreference: 'low-power' }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener(
            'webglcontextlost',
            () => {
              setAvailable(false);
              onFailure();
            },
            {
              once: true,
            },
          );
        }}
      >
        <Network stage={stage} />
        <RenderFrame
          onReady={() => {
            setReady(true);
            onReady();
          }}
        />
      </Canvas>
    </div>
  );
}

import React, { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Html, OrbitControls, Sparkles, Stars } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { SceneCanvas } from './SceneCanvas';
import { WORLDS_META } from '../core/store';
import { useUniverseStore } from '../core/store';
import type { WorldId, WorldMeta } from '../core/types';
import { audioEngine } from '../systems/audioEngine';

function StylizedTrees() {
  const trunkRef = useRef<THREE.InstancedMesh>(null);
  const crownRef = useRef<THREE.InstancedMesh>(null);

  const treeCoords = useMemo(
    () => [
      [-9.2, 0.9, -1.2, 1.0],
      [-8.5, 0.9, 2.2, 0.85],
      [-3.5, 1.05, -8.5, 1.1],
      [4.5, 1.05, -7.8, 0.95],
      [8.8, 0.95, -0.6, 1.05],
      [8.2, 0.95, 5.2, 0.88],
      [-2.8, 1.0, 8.2, 0.92],
      [1.8, 0.95, 8.6, 1.0],
      [-6.4, 0.95, -6.4, 0.9],
      [5.4, 0.95, 6.2, 0.8],
      [-4.2, 1.1, 1.2, 0.78],
      [3.5, 1.1, -1.2, 0.84],
    ],
    []
  );

  useMemo(() => {
    // Applied after mount in ref callback below
  }, []);

  const setInstances = (type: 'trunk' | 'crown', mesh: THREE.InstancedMesh | null) => {
    if (!mesh) return;
    const dummy = new THREE.Object3D();
    const color = new THREE.Color();
    treeCoords.forEach(([x, y, z, s], idx) => {
      if (type === 'trunk') {
        dummy.position.set(x, y + 0.45 * s, z);
        dummy.scale.set(s, s, s);
        dummy.rotation.set(0, idx * 0.7, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);
      } else {
        dummy.position.set(x, y + 1.15 * s, z);
        dummy.scale.set(s * 1.05, s * 1.2, s * 1.05);
        dummy.rotation.set(0, idx * 1.1, 0);
        dummy.updateMatrix();
        mesh.setMatrixAt(idx, dummy.matrix);
        color.set(idx % 3 === 0 ? '#D9A9C5' : idx % 2 === 0 ? '#A6BBAA' : '#8ea894');
        mesh.setColorAt(idx, color);
      }
    });
    mesh.instanceMatrix.needsUpdate = true;
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
    mesh.computeBoundingSphere();
  };

  return (
    <group>
      <instancedMesh
        ref={(m) => {
          trunkRef.current = m;
          setInstances('trunk', m);
        }}
        args={[undefined, undefined, treeCoords.length]}
        castShadow
      >
        <cylinderGeometry args={[0.1, 0.16, 0.95, 8]} />
        <meshStandardMaterial color="#7b5a46" roughness={0.9} />
      </instancedMesh>
      <instancedMesh
        ref={(m) => {
          crownRef.current = m;
          setInstances('crown', m);
        }}
        args={[undefined, undefined, treeCoords.length]}
        castShadow
      >
        <dodecahedronGeometry args={[0.68, 1]} />
        <meshStandardMaterial roughness={0.82} />
      </instancedMesh>
    </group>
  );
}

function SoaringBirds() {
  const groupRef = useRef<THREE.Group>(null);
  const birds = useMemo(() => [0, 1.4, 2.8, 4.1, 5.2], []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!groupRef.current) return;
    groupRef.current.children.forEach((bird, idx) => {
      const angle = t * 0.28 + birds[idx];
      const radius = 8.5 + (idx % 2) * 2.4;
      bird.position.set(Math.cos(angle) * radius, 5.2 + Math.sin(t * 1.2 + idx) * 0.45, Math.sin(angle) * radius);
      bird.rotation.y = -angle;
      const wingL = bird.children[0];
      const wingR = bird.children[1];
      if (wingL && wingR) {
        const flap = Math.sin(t * 7 + idx * 2) * 0.45;
        wingL.rotation.z = flap;
        wingR.rotation.z = -flap;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {birds.map((_, i) => (
        <group key={i}>
          <mesh position={[-0.14, 0, 0]}>
            <boxGeometry args={[0.26, 0.03, 0.1]} />
            <meshStandardMaterial color="#F1DCCB" roughness={0.6} />
          </mesh>
          <mesh position={[0.14, 0, 0]}>
            <boxGeometry args={[0.26, 0.03, 0.1]} />
            <meshStandardMaterial color="#F1DCCB" roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function DriftingClouds() {
  const groupRef = useRef<THREE.Group>(null);
  const clouds = useMemo(
    () => [
      { pos: [-16, -2.2, -10] as [number, number, number], scale: 1.5, speed: 0.25 },
      { pos: [17, -1.5, -8] as [number, number, number], scale: 1.7, speed: 0.18 },
      { pos: [-14, 3.8, -16] as [number, number, number], scale: 1.3, speed: 0.22 },
      { pos: [12, 4.5, 14] as [number, number, number], scale: 1.4, speed: 0.16 },
      { pos: [0, -3.4, 16] as [number, number, number], scale: 1.8, speed: 0.2 },
      { pos: [-18, 1.2, 8] as [number, number, number], scale: 1.25, speed: 0.24 },
    ],
    []
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!groupRef.current) return;
    groupRef.current.children.forEach((cloud, i) => {
      const cfg = clouds[i];
      cloud.position.x = cfg.pos[0] + Math.sin(t * cfg.speed + i) * 2.2;
      cloud.position.y = cfg.pos[1] + Math.cos(t * 0.35 + i) * 0.35;
    });
  });

  return (
    <group ref={groupRef}>
      {clouds.map((c, idx) => (
        <group key={idx} position={c.pos} scale={c.scale}>
          <mesh>
            <sphereGeometry args={[1.1, 14, 14]} />
            <meshStandardMaterial color="#F1DCCB" roughness={0.95} transparent opacity={0.85} />
          </mesh>
          <mesh position={[0.95, -0.2, 0.15]}>
            <sphereGeometry args={[0.85, 12, 12]} />
            <meshStandardMaterial color="#D9A9C5" roughness={0.95} transparent opacity={0.82} />
          </mesh>
          <mesh position={[-0.9, -0.25, -0.1]}>
            <sphereGeometry args={[0.8, 12, 12]} />
            <meshStandardMaterial color="#F1DCCB" roughness={0.95} transparent opacity={0.82} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function WaterfallAndLagoon() {
  const streamRef = useRef<THREE.Mesh>(null);
  const mistRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (streamRef.current) {
      streamRef.current.position.y = -1.6 + Math.sin(t * 6) * 0.04;
      const mat = streamRef.current.material as THREE.MeshStandardMaterial;
      mat.emissiveIntensity = 0.25 + Math.sin(t * 3) * 0.08;
    }
    if (mistRef.current) {
      mistRef.current.children.forEach((m, i) => {
        m.position.y = -4.2 + ((t * 0.9 + i * 0.4) % 1.4);
        m.scale.setScalar(0.5 + ((t * 0.7 + i * 0.3) % 1.0) * 0.7);
      });
    }
  });

  return (
    <group>
      {/* Lagoon Pond on island */}
      <mesh position={[3.2, 1.02, 5.1]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[2.35, 28]} />
        <meshPhysicalMaterial
          color="#6fa6b8"
          roughness={0.1}
          metalness={0.1}
          clearcoat={1}
          transparent
          opacity={0.86}
        />
      </mesh>
      {/* Cascading Waterfall off cliff */}
      <mesh ref={streamRef} position={[4.8, -1.6, 7.6]} rotation={[0.14, -0.5, 0]}>
        <cylinderGeometry args={[0.55, 0.78, 5.4, 14]} />
        <meshStandardMaterial
          color="#8ec7d8"
          emissive="#4a7c96"
          emissiveIntensity={0.25}
          roughness={0.2}
          transparent
          opacity={0.78}
        />
      </mesh>
      {/* Waterfall mist */}
      <group ref={mistRef} position={[5.1, 0, 8.1]}>
        {[0, 1, 2, 3].map((i) => (
          <mesh key={i} position={[(i - 1.5) * 0.4, -4.1, (i % 2) * 0.3]}>
            <sphereGeometry args={[0.45, 10, 10]} />
            <meshStandardMaterial color="#F1DCCB" transparent opacity={0.45} roughness={1} />
          </mesh>
        ))}
      </group>
      {/* Arched Stone Bridge */}
      <group position={[1.7, 1.15, 5.5]} rotation={[0, -0.45, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[2.1, 0.18, 0.85]} />
          <meshStandardMaterial color="#d8c3b3" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.28, 0.38]}>
          <boxGeometry args={[2.1, 0.35, 0.08]} />
          <meshStandardMaterial color="#b39c8c" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.28, -0.38]}>
          <boxGeometry args={[2.1, 0.35, 0.08]} />
          <meshStandardMaterial color="#b39c8c" roughness={0.85} />
        </mesh>
      </group>
    </group>
  );
}

function BuildingMesh({
  meta,
  hovered,
  onHover,
  onSelect,
}: {
  meta: WorldMeta;
  hovered: boolean;
  onHover: (id: WorldId | null) => void;
  onSelect: (meta: WorldMeta) => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (!groupRef.current) return;
    const targetScale = hovered ? 1.08 : 1.0;
    groupRef.current.scale.setScalar(THREE.MathUtils.damp(groupRef.current.scale.x, targetScale, 8, delta));
  });

  const warmGlow = (
    <meshStandardMaterial color="#ffe2a8" emissive="#D6B875" emissiveIntensity={hovered ? 2.1 : 1.2} />
  );

  return (
    <group
      ref={groupRef}
      position={meta.islandPosition}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
        onHover(meta.id);
      }}
      onPointerOut={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'default';
        onHover(null);
      }}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(meta);
      }}
    >
      {/* Stone foundation plinth */}
      <mesh position={[0, -0.15, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[1.35, 1.5, 0.25, 16]} />
        <meshStandardMaterial color="#c9baa9" roughness={0.85} />
      </mesh>

      {meta.id === 'museum' && (
        <group>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[1.05, 1.1, 1.1, 8]} />
            <meshStandardMaterial color="#F1DCCB" roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.2, 0]} castShadow>
            <sphereGeometry args={[0.92, 18, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#7771A8" roughness={0.35} metalness={0.3} />
          </mesh>
          <mesh position={[0, 2.2, 0]}>
            <octahedronGeometry args={[0.2, 0]} />
            <meshStandardMaterial color="#D6B875" emissive="#D6B875" emissiveIntensity={0.8} metalness={0.8} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.5, 1.06]}>{warmGlow}<boxGeometry args={[0.42, 0.65, 0.08]} /></mesh>
        </group>
      )}

      {meta.id === 'music' && (
        <group>
          <mesh position={[0, 0.5, 0]} castShadow>
            <boxGeometry args={[1.55, 1.0, 1.35]} />
            <meshStandardMaterial color="#e6cbb7" roughness={0.7} />
          </mesh>
          <mesh position={[0, 1.3, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[1.25, 0.85, 4]} />
            <meshStandardMaterial color="#D9A9C5" roughness={0.55} />
          </mesh>
          {/* Decorative gramophone horn */}
          <mesh position={[0.45, 1.45, 0.25]} rotation={[0.4, 0, -0.5]}>
            <coneGeometry args={[0.38, 0.6, 16, 1, true]} />
            <meshStandardMaterial color="#D6B875" metalness={0.85} roughness={0.2} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 0.45, 0.69]}>{warmGlow}<circleGeometry args={[0.22, 16]} /></mesh>
        </group>
      )}

      {meta.id === 'cat' && (
        <group>
          <mesh position={[0, 0.48, 0]} castShadow>
            <boxGeometry args={[1.45, 0.95, 1.35]} />
            <meshStandardMaterial color="#F1DCCB" roughness={0.75} />
          </mesh>
          <mesh position={[0, 1.25, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[1.18, 0.78, 4]} />
            <meshStandardMaterial color="#D9A9C5" roughness={0.6} />
          </mesh>
          {/* Cat ears on roof */}
          <mesh position={[-0.42, 1.48, 0.25]} rotation={[0, 0, 0.2]}>
            <coneGeometry args={[0.22, 0.48, 8]} />
            <meshStandardMaterial color="#D9A9C5" roughness={0.6} />
          </mesh>
          <mesh position={[0.42, 1.48, 0.25]} rotation={[0, 0, -0.2]}>
            <coneGeometry args={[0.22, 0.48, 8]} />
            <meshStandardMaterial color="#D9A9C5" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.42, 0.69]}>{warmGlow}<boxGeometry args={[0.36, 0.55, 0.06]} /></mesh>
        </group>
      )}

      {meta.id === 'home' && (
        <group>
          <mesh position={[0, 0.65, 0]} castShadow>
            <boxGeometry args={[2.0, 1.3, 1.6]} />
            <meshStandardMaterial color="#f5e3d3" roughness={0.72} />
          </mesh>
          <mesh position={[0, 1.68, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
            <coneGeometry args={[1.65, 1.0, 4]} />
            <meshStandardMaterial color="#7771A8" roughness={0.55} />
          </mesh>
          {/* Chimney */}
          <mesh position={[0.55, 1.85, -0.35]} castShadow>
            <boxGeometry args={[0.28, 0.7, 0.28]} />
            <meshStandardMaterial color="#a98a7c" roughness={0.85} />
          </mesh>
          {/* Warm bay windows */}
          <mesh position={[-0.45, 0.72, 0.81]}>{warmGlow}<boxGeometry args={[0.35, 0.4, 0.06]} /></mesh>
          <mesh position={[0.45, 0.72, 0.81]}>{warmGlow}<boxGeometry args={[0.35, 0.4, 0.06]} /></mesh>
          <mesh position={[0, 0.36, 0.81]}>
            <boxGeometry args={[0.38, 0.7, 0.08]} />
            <meshStandardMaterial color="#8b5f4d" roughness={0.7} />
          </mesh>
        </group>
      )}

      {meta.id === 'wishes' && (
        <group>
          {/* Gazebo pillars */}
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <mesh key={i} position={[Math.cos(a) * 0.85, 0.6, Math.sin(a) * 0.85]} castShadow>
                <cylinderGeometry args={[0.07, 0.09, 1.2, 10]} />
                <meshStandardMaterial color="#F1DCCB" roughness={0.5} />
              </mesh>
            );
          })}
          <mesh position={[0, 1.45, 0]} castShadow>
            <coneGeometry args={[1.15, 0.75, 12]} />
            <meshStandardMaterial color="#7771A8" roughness={0.45} />
          </mesh>
          <mesh position={[0, 2.05, 0]}>
            <octahedronGeometry args={[0.25, 0]} />
            <meshStandardMaterial color="#D6B875" emissive="#D6B875" emissiveIntensity={1.5} />
          </mesh>
        </group>
      )}

      {meta.id === 'greenhouse' && (
        <group>
          <mesh position={[0, 0.22, 0]} castShadow>
            <boxGeometry args={[1.7, 0.44, 1.3]} />
            <meshStandardMaterial color="#9bb39f" roughness={0.75} />
          </mesh>
          <mesh position={[0, 0.85, 0]}>
            <boxGeometry args={[1.56, 0.9, 1.16]} />
            <meshPhysicalMaterial color="#d8f0e2" transparent opacity={0.48} roughness={0.1} clearcoat={1} />
          </mesh>
          <mesh position={[0, 1.5, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[1.18, 0.65, 4]} />
            <meshPhysicalMaterial color="#c4e6d2" transparent opacity={0.55} roughness={0.12} />
          </mesh>
          {/* Glowing plant inside */}
          <mesh position={[0, 0.75, 0]}>
            <dodecahedronGeometry args={[0.35, 0]} />
            <meshStandardMaterial color="#A6BBAA" emissive="#A6BBAA" emissiveIntensity={0.6} />
          </mesh>
        </group>
      )}

      {meta.id === 'cafe' && (
        <group>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.95, 1.0, 1.0, 12]} />
            <meshStandardMaterial color="#f1dccb" roughness={0.65} />
          </mesh>
          <mesh position={[0, 1.25, 0]} castShadow>
            <coneGeometry args={[1.3, 0.65, 12]} />
            <meshStandardMaterial color="#D9A9C5" roughness={0.55} />
          </mesh>
          <mesh position={[0, 1.72, 0]}>
            <cylinderGeometry args={[0.22, 0.16, 0.3, 12]} />
            <meshStandardMaterial color="#D6B875" metalness={0.6} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.5, 0.96]}>{warmGlow}<boxGeometry args={[0.55, 0.45, 0.08]} /></mesh>
        </group>
      )}

      {meta.id === 'aquarium' && (
        <group>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[1.05, 1.15, 0.9, 16]} />
            <meshPhysicalMaterial color="#7ac2d6" transparent opacity={0.65} roughness={0.1} clearcoat={1} />
          </mesh>
          <mesh position={[0, 1.08, 0]}>
            <torusGeometry args={[1.02, 0.09, 10, 24]} />
            <meshStandardMaterial color="#D6B875" metalness={0.7} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.55, 0]}>
            <sphereGeometry args={[0.32, 12, 12]} />
            <meshStandardMaterial color="#D9A9C5" emissive="#7ac2d6" emissiveIntensity={0.7} />
          </mesh>
        </group>
      )}

      {meta.id === 'observatory' && (
        <group>
          <mesh position={[0, 0.75, 0]} castShadow>
            <cylinderGeometry args={[0.92, 1.05, 1.5, 16]} />
            <meshStandardMaterial color="#2a2b52" roughness={0.6} />
          </mesh>
          <mesh position={[0, 1.55, 0]} castShadow>
            <sphereGeometry args={[0.95, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color="#D6B875" metalness={0.72} roughness={0.28} />
          </mesh>
          {/* Telescope barrel sticking out */}
          <mesh position={[0.6, 1.95, 0.4]} rotation={[0.5, 0.4, -0.6]}>
            <cylinderGeometry args={[0.12, 0.16, 0.95, 12]} />
            <meshStandardMaterial color="#F1DCCB" metalness={0.7} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.85, 0.95]}>{warmGlow}<circleGeometry args={[0.2, 12]} /></mesh>
        </group>
      )}

      {hovered && (
        <Html position={[0, 2.75, 0]} center distanceFactor={14} style={{ pointerEvents: 'none' }}>
          <div className="px-3.5 py-2 rounded-2xl bg-[#17172F]/95 border border-[#D6B875]/60 text-center shadow-xl whitespace-nowrap">
            <div className="text-sm font-bold text-[#F1DCCB]">{meta.title}</div>
            <div className="text-[11px] text-[#D9A9C5] mt-0.5">کلیک برای ورود</div>
          </div>
        </Html>
      )}
    </group>
  );
}

function IslandWorldContent({ onSelectWorld }: { onSelectWorld: (id: WorldId) => void }) {
  const timeOfDay = useUniverseStore((s) => s.environment.timeOfDay);
  const [hoveredId, setHoveredId] = useState<WorldId | null>(null);
  const [flyingTo, setFlyingTo] = useState<WorldMeta | null>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const islandGroupRef = useRef<THREE.Group>(null);
  const { camera } = useThree();

  const handleSelectBuilding = (meta: WorldMeta) => {
    audioEngine.playSfx('sparkle');
    setFlyingTo(meta);
    window.setTimeout(() => {
      onSelectWorld(meta.id);
    }, 650);
  };

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    if (islandGroupRef.current && !flyingTo) {
      islandGroupRef.current.position.y = Math.sin(t * 0.55) * 0.14;
    }

    if (flyingTo && controlsRef.current) {
      const [bx, by, bz] = flyingTo.islandPosition;
      const targetPos = new THREE.Vector3(bx, by + 1.2, bz);
      const camGoal = new THREE.Vector3(bx * 1.15, by + 3.5, bz + 4.5);
      controlsRef.current.target.lerp(targetPos, Math.min(1, delta * 5));
      camera.position.lerp(camGoal, Math.min(1, delta * 4));
      controlsRef.current.update();
    }
  });

  const isNight = timeOfDay === 'night';
  const isDay = timeOfDay === 'day';

  return (
    <>
      <ambientLight intensity={isDay ? 0.55 : 0.35} color={isNight ? '#7771A8' : '#F1DCCB'} />
      <hemisphereLight
        args={[isDay ? '#ffe8d6' : '#D9A9C5', '#2a2a4f', isDay ? 0.85 : 0.6]}
      />
      <directionalLight
        position={[14, 18, 12]}
        intensity={isDay ? 1.55 : isNight ? 0.85 : 1.25}
        color={isNight ? '#a7b0e6' : '#ffe3bd'}
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
        shadow-camera-left={-14}
        shadow-camera-right={14}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
        shadow-bias={-0.0004}
      />
      <pointLight position={[0, 4, 0]} color="#D6B875" intensity={1.4} distance={22} />

      {/* Sun or Moon */}
      <mesh position={[-16, 16, -24]}>
        <sphereGeometry args={[2.2, 24, 24]} />
        <meshBasicMaterial color={isNight ? '#F1DCCB' : '#D6B875'} />
      </mesh>

      <Stars radius={65} depth={40} count={isDay ? 400 : 1800} factor={4} saturation={0.4} fade speed={0.5} />
      <Sparkles count={70} scale={[22, 9, 22]} size={3} speed={0.35} color="#D6B875" />

      <group ref={islandGroupRef}>
        {/* Main sculpted floating island base */}
        <mesh position={[0, 0.55, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[10.8, 9.6, 1.0, 28]} />
          <meshStandardMaterial color="#83a38a" roughness={0.88} />
        </mesh>
        {/* Elevated central terrace */}
        <mesh position={[0, 1.12, -1.2]} receiveShadow castShadow>
          <cylinderGeometry args={[4.4, 5.2, 0.45, 22]} />
          <meshStandardMaterial color="#96b39c" roughness={0.85} />
        </mesh>
        {/* Rocky tapered underside */}
        <mesh position={[0, -1.95, 0]} castShadow>
          <coneGeometry args={[9.6, 4.3, 14]} />
          <meshStandardMaterial color="#4e4b73" roughness={0.92} flatShading />
        </mesh>
        <mesh position={[-2.5, -2.5, 1.5]}>
          <coneGeometry args={[4.2, 3.6, 9]} />
          <meshStandardMaterial color="#3c3a5e" roughness={0.95} flatShading />
        </mesh>
        {/* Glowing underside crystals */}
        {[
          [-3.2, -3.5, 1.2],
          [2.4, -3.8, -1.5],
          [0.2, -4.4, 0.4],
        ].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} rotation={[0.2 * i, 0.4, 0.15]}>
            <octahedronGeometry args={[0.65, 0]} />
            <meshStandardMaterial
              color={i === 1 ? '#D6B875' : '#D9A9C5'}
              emissive={i === 1 ? '#D6B875' : '#7771A8'}
              emissiveIntensity={1.1}
              roughness={0.2}
            />
          </mesh>
        ))}

        {/* Stone stepping paths radiating from center */}
        {WORLDS_META.map((w, idx) => {
          const [bx, , bz] = w.islandPosition;
          const steps = 4;
          return Array.from({ length: steps }).map((_, s) => {
            const frac = (s + 1) / (steps + 1);
            return (
              <mesh
                key={`${idx}-${s}`}
                position={[bx * frac, 1.07, bz * frac]}
                rotation={[-Math.PI / 2, 0, s * 0.6]}
                receiveShadow
              >
                <circleGeometry args={[0.32, 8]} />
                <meshStandardMaterial color="#d8c6b8" roughness={0.9} />
              </mesh>
            );
          });
        })}

        {/* Warm lanterns */}
        {[
          [-3.4, 1.1, -1.8],
          [3.2, 1.1, -1.6],
          [-2.8, 1.05, 3.5],
          [2.6, 1.05, 3.2],
        ].map(([x, y, z], i) => (
          <group key={i} position={[x, y, z]}>
            <mesh position={[0, 0.35, 0]}>
              <cylinderGeometry args={[0.04, 0.06, 0.7, 8]} />
              <meshStandardMaterial color="#3c3a5e" metalness={0.5} roughness={0.4} />
            </mesh>
            <mesh position={[0, 0.75, 0]}>
              <sphereGeometry args={[0.14, 10, 10]} />
              <meshStandardMaterial color="#ffe4a3" emissive="#D6B875" emissiveIntensity={1.8} />
            </mesh>
          </group>
        ))}

        <WaterfallAndLagoon />
        <StylizedTrees />

        {/* 9 Interactive Buildings */}
        {WORLDS_META.map((meta) => (
          <BuildingMesh
            key={meta.id}
            meta={meta}
            hovered={hoveredId === meta.id}
            onHover={setHoveredId}
            onSelect={handleSelectBuilding}
          />
        ))}
      </group>

      <SoaringBirds />
      <DriftingClouds />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={8}
        maxDistance={28}
        minPolarAngle={0.25}
        maxPolarAngle={Math.PI * 0.48}
        target={[0, 1.2, 0]}
      />
    </>
  );
}

export const FloatingIslandScene: React.FC = () => {
  const setActiveWorld = useUniverseStore((s) => s.setActiveWorld);
  const timeOfDay = useUniverseStore((s) => s.environment.timeOfDay);

  const bgColor =
    timeOfDay === 'day' ? '#4a5687' : timeOfDay === 'night' ? '#0e0e22' : '#17172F';

  return (
    <div className="w-full h-full relative">
      <SceneCanvas cameraPosition={[0, 9.5, 19.5]} fov={44} bgColor={bgColor} fogNear={24} fogFar={72}>
        <IslandWorldContent onSelectWorld={setActiveWorld} />
      </SceneCanvas>

      {/* Subtle bottom hint for desktop/mobile */}
      <div className="pointer-events-none absolute bottom-4 inset-x-0 flex justify-center px-4">
        <div className="px-4 py-2 rounded-2xl bg-[#17172F]/85 border border-[#7771A8]/35 text-xs sm:text-sm text-[#F1DCCB] text-center">
          روی هر ساختمان کلیک کن یا از نقشه بالا دنیاها را انتخاب کن
        </div>
      </div>
    </div>
  );
};

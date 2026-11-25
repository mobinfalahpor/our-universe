import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  CloudRain,
  Disc3,
  ListMusic,
  Moon,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Sunset,
  Upload,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { SceneCanvas } from '../../components/SceneCanvas';
import { createWoodTexture } from '../../systems/proceduralTextures';
import { getPersianCarpetByColor } from '../../systems/persianMansionTextures';
import {
  createVictorianDamaskTexture,
  createVictorianOilPaintingTexture,
  createVictorianParquetTexture,
  createVictorianWainscotTexture,
} from './victorianTextures';
import { VictorianGramophone3D } from './VictorianGramophone3D';
import { audioEngine, type MusicTrack, type PlayerSnapshot } from '../../systems/audioEngine';
import { useUniverseStore } from '../../core/store';
import { toPersianDigits } from '../../core/persianUtils';

type MusicMood = 'rainy' | 'midnight' | 'sunset';

function formatTimeFa(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return toPersianDigits('00:00');
  const total = Math.floor(seconds);
  const mins = Math.floor(total / 60);
  const secs = total % 60;
  return toPersianDigits(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
}

// =====================================================================
// Animated Classic Victorian Fireplace (شومینه سنگی و چوبی با شعله طبیعی)
// =====================================================================
function VictorianFireplace({
  position,
  rotationY,
  mahoganyTex,
}: {
  position: [number, number, number];
  rotationY: number;
  mahoganyTex: THREE.CanvasTexture;
}) {
  const flameGroupRef = useRef<THREE.Group>(null);
  const fireLightRef = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (flameGroupRef.current) {
      flameGroupRef.current.children.forEach((child, idx) => {
        const s = 0.85 + Math.sin(t * (7 + idx * 1.9) + idx * 1.3) * 0.2;
        child.scale.set(1, s, 1);
        child.rotation.z = Math.sin(t * 5.2 + idx) * 0.08;
      });
    }
    if (fireLightRef.current) {
      fireLightRef.current.intensity = 2.0 + Math.sin(t * 8.5) * 0.22 + Math.cos(t * 13) * 0.12;
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Stone Hearth Slab */}
      <mesh position={[0, 0.05, 0.25]} receiveShadow>
        <boxGeometry args={[2.15, 0.1, 0.78]} />
        <meshStandardMaterial color="#3c3734" roughness={0.75} />
      </mesh>
      {/* Stone Surround Pillars */}
      <mesh position={[-0.78, 0.74, 0.14]} castShadow receiveShadow>
        <boxGeometry args={[0.36, 1.28, 0.48]} />
        <meshStandardMaterial color="#4e4640" roughness={0.78} />
      </mesh>
      <mesh position={[0.78, 0.74, 0.14]} castShadow receiveShadow>
        <boxGeometry args={[0.36, 1.28, 0.48]} />
        <meshStandardMaterial color="#4e4640" roughness={0.78} />
      </mesh>
      {/* Dark Firebox Interior */}
      <mesh position={[0, 0.65, 0.04]}>
        <boxGeometry args={[1.22, 1.1, 0.34]} />
        <meshStandardMaterial color="#14100f" roughness={0.95} />
      </mesh>
      {/* Mahogany Carved Mantelpiece */}
      <mesh position={[0, 1.44, 0.2]} castShadow receiveShadow>
        <boxGeometry args={[2.22, 0.14, 0.56]} />
        <meshStandardMaterial map={mahoganyTex} roughness={0.38} />
      </mesh>
      <mesh position={[0, 1.28, 0.18]} castShadow>
        <boxGeometry args={[1.98, 0.2, 0.48]} />
        <meshStandardMaterial map={mahoganyTex} roughness={0.42} />
      </mesh>

      {/* Brass Fender Rail */}
      <mesh position={[0, 0.14, 0.45]}>
        <boxGeometry args={[1.38, 0.05, 0.04]} />
        <meshStandardMaterial color="#c99c42" metalness={0.88} roughness={0.24} />
      </mesh>

      {/* Burning Wood Logs */}
      {[-0.22, 0.04, 0.24].map((lx, idx) => (
        <mesh key={idx} position={[lx, 0.18 + (idx % 2) * 0.04, 0.16]} rotation={[0, 0.3 * (idx - 1), Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.07, 0.52, 8]} />
          <meshStandardMaterial color="#2b1910" emissive="#5c1b06" emissiveIntensity={0.6} roughness={0.92} />
        </mesh>
      ))}

      {/* Natural Multi-Tongue Flames */}
      <group ref={flameGroupRef} position={[0, 0.24, 0.16]}>
        {[
          [-0.14, 0.12, 0.0, '#ff8e2b', 0.09, 0.28],
          [0.02, 0.16, 0.02, '#ffb647', 0.11, 0.34],
          [0.16, 0.11, -0.02, '#ff771c', 0.08, 0.25],
          [-0.04, 0.1, 0.05, '#ffe08a', 0.06, 0.2],
        ].map(([fx, fy, fz, col, rad, h], idx) => (
          <mesh key={idx} position={[fx as number, fy as number, fz as number]}>
            <coneGeometry args={[rad as number, h as number, 8]} />
            <meshBasicMaterial color={col as string} transparent opacity={0.88} />
          </mesh>
        ))}
      </group>
      <pointLight ref={fireLightRef} position={[0, 0.55, 0.58]} color="#ff9d47" intensity={2.1} distance={6.5} decay={2} />

      {/* Mantelpiece Gilded Mirror & Brass Candlesticks */}
      <mesh position={[0, 2.38, 0.04]} castShadow>
        <boxGeometry args={[1.45, 1.55, 0.07]} />
        <meshStandardMaterial color="#c99c42" metalness={0.78} roughness={0.28} />
      </mesh>
      <mesh position={[0, 2.38, 0.08]}>
        <planeGeometry args={[1.22, 1.32]} />
        <meshStandardMaterial color="#b9c7ce" metalness={0.94} roughness={0.07} />
      </mesh>
      {[-0.82, 0.82].map((cx, idx) => (
        <group key={idx} position={[cx, 1.52, 0.24]}>
          <mesh>
            <cylinderGeometry args={[0.04, 0.07, 0.22, 10]} />
            <meshStandardMaterial color="#d4a64a" metalness={0.88} roughness={0.22} />
          </mesh>
          <mesh position={[0, 0.17, 0]}>
            <cylinderGeometry args={[0.018, 0.018, 0.14, 8]} />
            <meshStandardMaterial color="#f5ebd8" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.26, 0]}>
            <sphereGeometry args={[0.02, 8, 8]} />
            <meshBasicMaterial color="#ffd575" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// =====================================================================
// Tufted Chesterfield Velvet Armchair (مبل چستر مخملی ویکتوریایی)
// =====================================================================
function ChesterfieldArmchair({
  position,
  rotationY,
  velvetColor,
}: {
  position: [number, number, number];
  rotationY: number;
  velvetColor: string;
}) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Turned Walnut Bun Feet */}
      {[
        [-0.38, 0.07, -0.34],
        [0.38, 0.07, -0.34],
        [-0.38, 0.07, 0.34],
        [0.38, 0.07, 0.34],
      ].map((fp, i) => (
        <mesh key={i} position={fp as [number, number, number]} castShadow>
          <sphereGeometry args={[0.075, 10, 10]} />
          <meshStandardMaterial color="#3b2013" roughness={0.45} />
        </mesh>
      ))}
      {/* Base Apron & Plush Seat */}
      <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.98, 0.22, 0.9]} />
        <meshStandardMaterial color={velvetColor} roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.37, 0.06]} castShadow receiveShadow>
        <boxGeometry args={[0.74, 0.13, 0.72]} />
        <meshStandardMaterial color={velvetColor} roughness={0.88} />
      </mesh>
      {/* Rolled Tufted Backrest & Rolled Arms */}
      <mesh position={[0, 0.64, -0.33]} castShadow>
        <boxGeometry args={[0.98, 0.64, 0.24]} />
        <meshStandardMaterial color={velvetColor} roughness={0.86} />
      </mesh>
      <mesh position={[0, 0.94, -0.33]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.12, 0.12, 0.98, 12]} />
        <meshStandardMaterial color={velvetColor} roughness={0.86} />
      </mesh>
      {[-0.44, 0.44].map((ax, i) => (
        <group key={i} position={[ax, 0.48, 0]}>
          <mesh castShadow>
            <boxGeometry args={[0.18, 0.34, 0.88]} />
            <meshStandardMaterial color={velvetColor} roughness={0.86} />
          </mesh>
          <mesh position={[0, 0.17, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.11, 0.11, 0.88, 12]} />
            <meshStandardMaterial color={velvetColor} roughness={0.86} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// =====================================================================
// Complete Victorian Mansion Music Room 3D Scene
// =====================================================================
function VictorianRoomScene({
  isPlaying,
  mood,
}: {
  isPlaying: boolean;
  mood: MusicMood;
}) {
  const parquetTex = useMemo(() => createVictorianParquetTexture(), []);
  const damaskTex = useMemo(() => createVictorianDamaskTexture(), []);
  const wainscotTex = useMemo(() => createVictorianWainscotTexture(), []);
  const mahoganyTex = useMemo(() => createWoodTexture('#522618', '#30140b', 3), []);
  const persianRugTex = useMemo(() => getPersianCarpetByColor('#5e1621'), []);
  const paintingLandscapeTex = useMemo(() => createVictorianOilPaintingTexture('landscape'), []);
  const paintingStillTex = useMemo(() => createVictorianOilPaintingTexture('still_life'), []);

  const curtainLRef = useRef<THREE.Group>(null);
  const curtainRRef = useRef<THREE.Group>(null);
  const rainRef = useRef<THREE.Points>(null);
  const dustRef = useRef<THREE.Points>(null);
  const candleLightRef = useRef<THREE.PointLight>(null);

  useEffect(() => {
    return () => {
      parquetTex.dispose();
      damaskTex.dispose();
      wainscotTex.dispose();
      mahoganyTex.dispose();
      paintingLandscapeTex.dispose();
      paintingStillTex.dispose();
    };
  }, [parquetTex, damaskTex, wainscotTex, mahoganyTex, paintingLandscapeTex, paintingStillTex]);

  const rainPositions = useMemo(() => {
    const arr = new Float32Array(180 * 3);
    for (let i = 0; i < 180; i++) {
      arr[i * 3] = (Math.random() > 0.5 ? 1 : -1) * (1.2 + Math.random() * 1.9);
      arr[i * 3 + 1] = 0.6 + Math.random() * 3.4;
      arr[i * 3 + 2] = -4.25 - Math.random() * 0.8;
    }
    return arr;
  }, []);

  const dustPositions = useMemo(() => {
    const arr = new Float32Array(55 * 3);
    for (let i = 0; i < 55; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 6.4;
      arr[i * 3 + 1] = 0.6 + Math.random() * 3.0;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 5.2;
    }
    return arr;
  }, []);

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(0.05, rawDelta);
    const t = clock.getElapsedTime();

    // Very gentle curtain breeze sway
    if (curtainLRef.current) {
      curtainLRef.current.rotation.z = Math.sin(t * 0.7) * 0.015;
    }
    if (curtainRRef.current) {
      curtainRRef.current.rotation.z = Math.cos(t * 0.65) * 0.015;
    }

    // Subtle candle flicker
    if (candleLightRef.current) {
      candleLightRef.current.intensity = 1.05 + Math.sin(t * 6.5) * 0.1;
    }

    // Gentle window rain
    if (rainRef.current && mood === 'rainy') {
      const pos = rainRef.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < 180; i++) {
        let y = pos.getY(i) - dt * 4.4;
        if (y < 0.6) y = 4.0;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }

    // Slow floating dust motes in warm light
    if (dustRef.current) {
      const pos = dustRef.current.geometry.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < 55; i++) {
        let y = pos.getY(i) + dt * 0.05;
        if (y > 3.6) y = 0.6;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }
  });

  const skyColor = mood === 'sunset' ? '#7a4b4e' : mood === 'rainy' ? '#1c2638' : '#101526';

  return (
    <>
      {/* Warm Cinematic Victorian Lighting */}
      <ambientLight intensity={0.34} color={mood === 'sunset' ? '#ffd2a8' : '#e6d3b8'} />
      <hemisphereLight args={[mood === 'sunset' ? '#cfa182' : '#707d94', '#261810', 0.48]} />
      <directionalLight
        position={[3.5, 6.2, 4.0]}
        intensity={mood === 'sunset' ? 1.15 : 0.78}
        color={mood === 'sunset' ? '#ffbe8a' : '#f7dfb8'}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />

      {/* ============================================================= */}
      {/* 1. PARQUET FLOOR & TRADITIONAL PERSIAN CARPET                 */}
      {/* ============================================================= */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10.0, 8.6]} />
        <meshStandardMaterial map={parquetTex} roughness={0.44} metalness={0.05} />
      </mesh>
      {/* Large Traditional Crimson Persian Carpet */}
      <mesh position={[0, 0.01, -0.15]} receiveShadow>
        <boxGeometry args={[5.4, 0.018, 3.8]} />
        <meshStandardMaterial map={persianRugTex} roughness={0.92} />
      </mesh>

      {/* ============================================================= */}
      {/* 2. VICTORIAN WALLS: WAINSCOT + EMERALD DAMASK + CORNICES      */}
      {/* ============================================================= */}
      {/* Back Wall (Z = -4.1) */}
      <group position={[0, 0, -4.1]}>
        {/* Upper Damask Wallpaper */}
        <mesh position={[0, 2.75, 0]} receiveShadow>
          <boxGeometry args={[10.0, 2.9, 0.22]} />
          <meshStandardMaterial map={damaskTex} roughness={0.85} />
        </mesh>
        {/* Lower Dark Walnut Wainscot Paneling */}
        <mesh position={[0, 0.65, 0.02]} receiveShadow>
          <boxGeometry args={[10.0, 1.3, 0.24]} />
          <meshStandardMaterial map={wainscotTex} roughness={0.48} />
        </mesh>
        {/* Dado Rail & Cream Crown Cornice */}
        <mesh position={[0, 1.32, 0.14]}>
          <boxGeometry args={[10.0, 0.09, 0.08]} />
          <meshStandardMaterial color="#3c2214" roughness={0.45} />
        </mesh>
        <mesh position={[0, 4.14, 0.14]}>
          <boxGeometry args={[10.0, 0.18, 0.12]} />
          <meshStandardMaterial color="#dfd3be" roughness={0.75} />
        </mesh>
      </group>

      {/* Left Wall (X = -4.8) */}
      <group position={[-4.8, 0, 0]}>
        <mesh position={[0, 2.75, 0]} receiveShadow>
          <boxGeometry args={[0.22, 2.9, 8.6]} />
          <meshStandardMaterial map={damaskTex} roughness={0.85} />
        </mesh>
        <mesh position={[0.02, 0.65, 0]} receiveShadow>
          <boxGeometry args={[0.24, 1.3, 8.6]} />
          <meshStandardMaterial map={wainscotTex} roughness={0.48} />
        </mesh>
        <mesh position={[0.14, 1.32, 0]}>
          <boxGeometry args={[0.08, 0.09, 8.6]} />
          <meshStandardMaterial color="#3c2214" roughness={0.45} />
        </mesh>
        <mesh position={[0.14, 4.14, 0]}>
          <boxGeometry args={[0.12, 0.18, 8.6]} />
          <meshStandardMaterial color="#dfd3be" roughness={0.75} />
        </mesh>
      </group>

      {/* Right Wall (X = +4.8) */}
      <group position={[4.8, 0, 0]}>
        <mesh position={[0, 2.75, 0]} receiveShadow>
          <boxGeometry args={[0.22, 2.9, 8.6]} />
          <meshStandardMaterial map={damaskTex} roughness={0.85} />
        </mesh>
        <mesh position={[-0.02, 0.65, 0]} receiveShadow>
          <boxGeometry args={[0.24, 1.3, 8.6]} />
          <meshStandardMaterial map={wainscotTex} roughness={0.48} />
        </mesh>
        <mesh position={[-0.14, 1.32, 0]}>
          <boxGeometry args={[0.08, 0.09, 8.6]} />
          <meshStandardMaterial color="#3c2214" roughness={0.45} />
        </mesh>
        <mesh position={[-0.14, 4.14, 0]}>
          <boxGeometry args={[0.12, 0.18, 8.6]} />
          <meshStandardMaterial color="#dfd3be" roughness={0.75} />
        </mesh>
      </group>

      {/* High Coffered Ceiling & Brass Crystal Chandelier */}
      <mesh position={[0, 4.28, 0]} receiveShadow>
        <boxGeometry args={[10.0, 0.2, 8.6]} />
        <meshStandardMaterial color="#e3d7c3" roughness={0.78} />
      </mesh>
      {[-2.4, 0, 2.4].map((bx, i) => (
        <mesh key={i} position={[bx, 4.15, 0]}>
          <boxGeometry args={[0.24, 0.16, 8.4]} />
          <meshStandardMaterial color="#3a2013" roughness={0.5} />
        </mesh>
      ))}

      {/* Grand Victorian Brass Chandelier */}
      <group position={[0, 3.35, -0.35]}>
        <mesh position={[0, 0.45, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.9, 10]} />
          <meshStandardMaterial color="#c99c42" metalness={0.9} roughness={0.22} />
        </mesh>
        <mesh position={[0, 0.85, 0]}>
          <cylinderGeometry args={[0.38, 0.46, 0.06, 24]} />
          <meshStandardMaterial color="#dfd3be" roughness={0.72} />
        </mesh>
        <mesh>
          <torusGeometry args={[0.56, 0.032, 10, 32]} />
          <meshStandardMaterial color="#d4a64a" metalness={0.9} roughness={0.2} />
        </mesh>
        {[0, 1, 2, 3, 4, 5].map((i) => {
          const a = (i / 6) * Math.PI * 2;
          return (
            <group key={i} position={[Math.cos(a) * 0.56, 0.09, Math.sin(a) * 0.56]}>
              <mesh>
                <cylinderGeometry args={[0.024, 0.028, 0.14, 8]} />
                <meshStandardMaterial color="#f5ebd8" roughness={0.5} />
              </mesh>
              <mesh position={[0, 0.09, 0]}>
                <sphereGeometry args={[0.024, 8, 8]} />
                <meshBasicMaterial color="#ffd885" />
              </mesh>
            </group>
          );
        })}
        <pointLight position={[0, -0.1, 0]} color="#ffd58c" intensity={2.4} distance={11} decay={2} />
      </group>

      {/* ============================================================= */}
      {/* 3. TALL VICTORIAN WINDOWS, VELVET CURTAINS & WALL SCONCES     */}
      {/* ============================================================= */}
      {[-2.25, 2.25].map((wx, idx) => (
        <group key={idx} position={[wx, 2.38, -3.96]}>
          {/* Window Sky Backdrop */}
          <mesh position={[0, 0, -0.02]}>
            <planeGeometry args={[1.42, 2.42]} />
            <meshBasicMaterial color={skyColor} />
          </mesh>
          {/* Dark Timber Outer Frame & Mullions */}
          <mesh position={[0, 0, 0.02]}>
            <boxGeometry args={[0.06, 2.45, 0.06]} />
            <meshStandardMaterial color="#381f13" roughness={0.52} />
          </mesh>
          {[-0.4, 0.4].map((my, mi) => (
            <mesh key={mi} position={[0, my, 0.02]}>
              <boxGeometry args={[1.44, 0.06, 0.06]} />
              <meshStandardMaterial color="#381f13" roughness={0.52} />
            </mesh>
          ))}
          {/* Velvet Pelmet Valance (والان پرده) */}
          <mesh position={[0, 1.32, 0.14]} castShadow>
            <boxGeometry args={[1.82, 0.24, 0.16]} />
            <meshStandardMaterial color="#5e1621" roughness={0.86} />
          </mesh>
          <mesh position={[0, 1.2, 0.15]}>
            <boxGeometry args={[1.84, 0.035, 0.18]} />
            <meshStandardMaterial color="#c99c42" metalness={0.7} roughness={0.3} />
          </mesh>
          {/* Heavy Crimson Velvet Drapes */}
          <group ref={idx === 0 ? curtainLRef : curtainRRef}>
            {[-0.76, 0.76].map((cx, ci) => (
              <mesh key={ci} position={[cx, -0.12, 0.12]} castShadow>
                <cylinderGeometry args={[0.14, 0.2, 2.75, 14]} />
                <meshStandardMaterial color="#5e1621" roughness={0.88} />
              </mesh>
            ))}
          </group>
        </group>
      ))}

      {/* Rain Outside Windows */}
      {mood === 'rainy' && (
        <points ref={rainRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[rainPositions, 3]} />
          </bufferGeometry>
          <pointsMaterial color="#9bb4d4" size={0.045} transparent opacity={0.65} />
        </points>
      )}

      {/* Center Oil Painting & Twin Brass Wall Sconces on Back Wall */}
      <group position={[0, 2.48, -3.96]}>
        <mesh castShadow>
          <boxGeometry args={[1.64, 1.24, 0.06]} />
          <meshStandardMaterial color="#c99c42" metalness={0.78} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[1.42, 1.04]} />
          <meshStandardMaterial map={paintingLandscapeTex} roughness={0.52} />
        </mesh>
        {[-1.08, 1.08].map((sx, si) => (
          <group key={si} position={[sx, 0.05, 0.08]}>
            <mesh>
              <boxGeometry args={[0.09, 0.22, 0.04]} />
              <meshStandardMaterial color="#c99c42" metalness={0.88} roughness={0.22} />
            </mesh>
            <mesh position={[0, 0.08, 0.1]}>
              <cylinderGeometry args={[0.015, 0.018, 0.12, 8]} />
              <meshStandardMaterial color="#f5ebd8" roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.16, 0.1]}>
              <sphereGeometry args={[0.018, 8, 8]} />
              <meshBasicMaterial color="#ffd57a" />
            </mesh>
          </group>
        ))}
        <pointLight position={[0, 0.2, 0.45]} color="#ffcf85" intensity={0.95} distance={5.2} decay={2} />
      </group>

      {/* ============================================================= */}
      {/* 4. LEFT WALL: CLASSIC VICTORIAN FIREPLACE & VELVET LOUNGE     */}
      {/* ============================================================= */}
      <VictorianFireplace position={[-4.62, 0, -0.35]} rotationY={Math.PI / 2} mahoganyTex={mahoganyTex} />
      <ChesterfieldArmchair position={[-2.35, 0, 1.25]} rotationY={Math.PI * 0.72} velvetColor="#5e1621" />

      {/* ============================================================= */}
      {/* 5. RIGHT WALL: ANTIQUE MAHOGANY BOOKCASE & CHESTERFIELD       */}
      {/* ============================================================= */}
      <group position={[4.35, 0, -1.65]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh position={[0, 1.38, 0]} castShadow receiveShadow>
          <boxGeometry args={[2.15, 2.75, 0.46]} />
          <meshStandardMaterial map={mahoganyTex} roughness={0.46} />
        </mesh>
        {[0.48, 1.02, 1.56, 2.1].map((sy, sIdx) => (
          <group key={sIdx} position={[0, sy, 0.06]}>
            <mesh position={[0, -0.18, 0]}>
              <boxGeometry args={[1.95, 0.04, 0.38]} />
              <meshStandardMaterial color="#381d11" roughness={0.5} />
            </mesh>
            {Array.from({ length: 11 }).map((_, bi) => {
              const colors = ['#5e1621', '#1b382c', '#1e2c4a', '#704d24', '#402619'];
              return (
                <mesh
                  key={bi}
                  position={[-0.82 + bi * 0.16, 0.02, 0.02]}
                  rotation={[0, 0, bi === 10 && sIdx % 2 === 0 ? -0.16 : 0]}
                  castShadow
                >
                  <boxGeometry args={[0.1, 0.3 + ((bi + sIdx) % 3) * 0.04, 0.24]} />
                  <meshStandardMaterial color={colors[(bi + sIdx) % colors.length]} roughness={0.62} />
                </mesh>
              );
            })}
          </group>
        ))}
      </group>

      {/* Right Wall Still-Life Oil Painting */}
      <group position={[4.66, 2.38, 1.35]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh castShadow>
          <boxGeometry args={[1.28, 0.98, 0.06]} />
          <meshStandardMaterial color="#c99c42" metalness={0.78} roughness={0.28} />
        </mesh>
        <mesh position={[0, 0, 0.035]}>
          <planeGeometry args={[1.1, 0.8]} />
          <meshStandardMaterial map={paintingStillTex} roughness={0.52} />
        </mesh>
      </group>

      {/* Emerald Velvet Chesterfield Armchair + Brass Side Table on Right */}
      <ChesterfieldArmchair position={[2.35, 0, 0.9]} rotationY={-Math.PI * 0.68} velvetColor="#1a4031" />
      <group position={[1.72, 0, -0.05]}>
        <mesh position={[0, 0.56, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.34, 0.32, 0.045, 22]} />
          <meshStandardMaterial map={mahoganyTex} roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.065, 0.54, 12]} />
          <meshStandardMaterial color="#3a2013" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.04, 0]}>
          <cylinderGeometry args={[0.2, 0.24, 0.06, 14]} />
          <meshStandardMaterial color="#3a2013" roughness={0.48} />
        </mesh>
        {/* Brass Candlestick on Side Table */}
        <mesh position={[0.06, 0.65, 0]}>
          <cylinderGeometry args={[0.035, 0.06, 0.16, 12]} />
          <meshStandardMaterial color="#d4a64a" metalness={0.88} roughness={0.22} />
        </mesh>
        <mesh position={[0.06, 0.77, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.1, 8]} />
          <meshStandardMaterial color="#f5ebd8" roughness={0.5} />
        </mesh>
        <mesh position={[0.06, 0.835, 0]}>
          <sphereGeometry args={[0.018, 8, 8]} />
          <meshBasicMaterial color="#ffd578" />
        </mesh>
        <pointLight ref={candleLightRef} position={[0.06, 0.88, 0]} color="#ffc970" intensity={1.05} distance={4.5} decay={2} />
      </group>

      {/* ============================================================= */}
      {/* 6. HERO ANTIQUE BRASS HORN GRAMOPHONE (CENTERPIECE)            */}
      {/* ============================================================= */}
      <VictorianGramophone3D isPlaying={isPlaying} position={[0, 0, -0.35]} />

      {/* Subtle Golden Dust Motes in Warm Chandelier Light */}
      <points ref={dustRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[dustPositions, 3]} />
        </bufferGeometry>
        <pointsMaterial color="#f2dfb8" size={0.028} transparent opacity={0.26} />
      </points>

      <OrbitControls
        enableDamping
        dampingFactor={0.055}
        minDistance={2.2}
        maxDistance={6.6}
        maxPolarAngle={Math.PI * 0.48}
        minPolarAngle={Math.PI * 0.18}
        minAzimuthAngle={-Math.PI * 0.48}
        maxAzimuthAngle={Math.PI * 0.48}
        target={[0, 1.32, -0.35]}
      />
    </>
  );
}

// =====================================================================
// Main Component + Compact Minimalist Classical Victorian Player UI
// =====================================================================
export const MusicRoomWorld: React.FC = () => {
  const audio = useUniverseStore((s) => s.audio);
  const setAudioSettings = useUniverseStore((s) => s.setAudioSettings);

  const [playerSnap, setPlayerSnap] = useState<PlayerSnapshot>(() => audioEngine.getSnapshot());
  const [tracks, setTracks] = useState<MusicTrack[]>(() => audioEngine.getAllTracks());
  const [mood, setMood] = useState<MusicMood>('rainy');
  const [isMinimized, setIsMinimized] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [coverFailedId, setCoverFailedId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const unsub = audioEngine.subscribe((snap) => {
      setPlayerSnap(snap);
    });
    return unsub;
  }, []);

  useEffect(() => {
    audioEngine.setVolume(audio.volume);
    audioEngine.setMuted(audio.muted);
  }, [audio.volume, audio.muted]);

  useEffect(() => {
    if (playerSnap.currentTrackId && playerSnap.currentTrackId !== audio.activeTrackId) {
      setAudioSettings({ activeTrackId: playerSnap.currentTrackId });
    }
  }, [playerSnap.currentTrackId, audio.activeTrackId, setAudioSettings]);

  const activeTrack =
    tracks.find((t) => t.id === (playerSnap.currentTrackId || audio.activeTrackId)) || tracks[0];

  const handleTogglePlay = (trackId?: string) => {
    const id = trackId || activeTrack?.id;
    if (id) setAudioSettings({ activeTrackId: id });
    audioEngine.togglePlay(id);
  };

  const handleSelectMood = (m: MusicMood) => {
    setMood(m);
    const ambient = m === 'rainy' ? 'rain' : m === 'midnight' ? 'night' : 'none';
    audioEngine.setAmbient(ambient);
    setAudioSettings({ ambientMode: ambient });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const added = audioEngine.addCustomAudioFile(file);
    setTracks(audioEngine.getAllTracks());
    setAudioSettings({ activeTrackId: added.id });
    void audioEngine.playTrack(added.id);
    e.target.value = '';
  };

  const progressMax = Math.max(playerSnap.duration, 0.01);
  const remainingTime = Math.max(0, playerSnap.duration - playerSnap.currentTime);

  return (
    <div className="relative w-full h-full select-none">
      <SceneCanvas
        cameraPosition={[0.45, 2.05, 4.15]}
        fov={44}
        bgColor="#120d0a"
        fogColor="#140e0b"
        fogNear={9}
        fogFar={22}
      >
        <VictorianRoomScene isPlaying={playerSnap.isPlaying} mood={mood} />
      </SceneCanvas>

      {/* Hidden File Input (MP3 / WAV / OGG) */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".mp3,.wav,.ogg,audio/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Error Toast if Audio File Missing / Unplayable */}
      {playerSnap.errorMessage && (
        <div className="fixed top-16 inset-x-0 z-30 flex justify-center px-3 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-2 rounded-xl bg-[#2a1216]/92 border border-[#c99c42]/50 px-3 py-1.5 text-[11px] text-[#efe4ce]">
            <AlertCircle className="w-3.5 h-3.5 text-[#d4a64a] shrink-0" />
            <span>{playerSnap.errorMessage}</span>
          </div>
        </div>
      )}

      {/* ================================================================= */}
      {/* REFINED, COMPACT, MINIMALIST VICTORIAN PLAYER BAR (BOTTOM CENTER) */}
      {/* ================================================================= */}
      <div className="fixed bottom-2.5 inset-x-0 z-20 flex flex-col items-center px-3 pointer-events-none">
        {/* Compact Expandable Playlist & Atmosphere Popover (opens above bar) */}
        {!isMinimized && playlistOpen && (
          <div className="pointer-events-auto mb-1.5 w-full max-w-md rounded-xl bg-[#160f0b]/90 border border-[#c99c42]/35 p-2.5 space-y-2">
            <div className="flex items-center justify-between gap-2 pb-1.5 border-b border-[#c99c42]/20">
              <span className="text-[11px] font-medium text-[#d4af63]">فهرست صفحه‌های گرامافون</span>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-[#281b14] border border-[#c99c42]/35 text-[10px] text-[#efe4ce] hover:border-[#d4af63] cursor-pointer"
              >
                <Upload className="w-3 h-3 text-[#d4af63]" />
                <span>افزودن فایل صوتی</span>
              </button>
            </div>

            <div className="max-h-36 overflow-y-auto space-y-1">
              {tracks.map((tr) => {
                const isSelected = activeTrack?.id === tr.id;
                return (
                  <button
                    key={tr.id}
                    type="button"
                    onClick={() => {
                      setAudioSettings({ activeTrackId: tr.id });
                      void audioEngine.playTrack(tr.id);
                    }}
                    className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg text-right transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-[#5e1621]/70 border border-[#c99c42]/50 text-[#f5ebd8]'
                        : 'hover:bg-white/5 text-[#e6d7bd]/85'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <img
                        src={tr.coverUrl}
                        alt={tr.title}
                        onError={(ev) => {
                          (ev.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                        className="w-6 h-6 rounded object-cover shrink-0 bg-[#231710]"
                      />
                      <div className="min-w-0">
                        <div className="text-[11px] font-medium truncate">{tr.title}</div>
                        <div className="text-[10px] opacity-70 truncate">{tr.artist}</div>
                      </div>
                    </div>
                    {isSelected && playerSnap.isPlaying && (
                      <span className="text-[9px] text-[#d4af63] shrink-0">در حال پخش</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Volume (Mobile Accessible) & Room Atmosphere Mood */}
            <div className="flex items-center justify-between gap-2 pt-1.5 border-t border-[#c99c42]/20 flex-wrap">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const nextMuted = !audio.muted;
                    setAudioSettings({ muted: nextMuted });
                    audioEngine.setMuted(nextMuted);
                  }}
                  aria-label={audio.muted ? 'وصل صدا' : 'بی‌صدا'}
                  className="w-7 h-7 flex items-center justify-center text-[#d4af63] cursor-pointer"
                >
                  {audio.muted || audio.volume === 0 ? (
                    <VolumeX className="w-3.5 h-3.5" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                </button>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={audio.muted ? 0 : audio.volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setAudioSettings({ volume: v, muted: v === 0 });
                    audioEngine.setVolume(v);
                    audioEngine.setMuted(v === 0);
                  }}
                  className="w-20 h-1 accent-[#d4af63] cursor-pointer"
                  aria-label="تنظیم صدا"
                />
              </div>

              <div className="flex items-center gap-1">
                {(
                  [
                    ['rainy', 'بارانی', CloudRain],
                    ['midnight', 'نیمه‌شب', Moon],
                    ['sunset', 'شفق', Sunset],
                  ] as const
                ).map(([mId, label, Icon]) => (
                  <button
                    key={mId}
                    type="button"
                    onClick={() => handleSelectMood(mId)}
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] cursor-pointer ${
                      mood === mId
                        ? 'bg-[#c99c42] text-[#160f0b] font-semibold'
                        : 'bg-[#261a13] text-[#e6d7bd]/80'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* COLLAPSED MINI-BAR vs COMPACT FULL BAR */}
        {isMinimized ? (
          <div className="pointer-events-auto flex items-center gap-2 px-2.5 py-1.5 rounded-full bg-[#160f0b]/82 border border-[#c99c42]/40">
            <button
              type="button"
              onClick={() => handleTogglePlay()}
              className="w-8 h-8 rounded-full border border-[#c99c42]/65 text-[#d4af63] hover:bg-[#c99c42]/15 flex items-center justify-center shrink-0 cursor-pointer"
              aria-label={playerSnap.isPlaying ? 'توقف' : 'پخش'}
            >
              {playerSnap.isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => setIsMinimized(false)}
              className="flex items-center gap-1.5 text-right max-w-[170px] sm:max-w-[240px] px-1 cursor-pointer"
              title="باز کردن کنترل‌های گرامافون"
            >
              <span className="text-[11px] font-medium text-[#efe4ce] truncate">
                {activeTrack?.title ?? 'گرامافون ویکتوریایی'}
              </span>
              <ChevronUp className="w-3.5 h-3.5 text-[#d4af63] shrink-0" />
            </button>
          </div>
        ) : (
          <div className="pointer-events-auto w-full max-w-xl rounded-xl bg-[#160f0b]/84 border border-[#c99c42]/35 px-3 py-2 space-y-1.5">
            {/* Slim Progress Bar + Elapsed/Remaining Time */}
            <div className="flex items-center gap-2" dir="ltr">
              <span className="text-[10px] text-[#e6d7bd]/80 tabular-nums w-9 text-center">
                {formatTimeFa(playerSnap.currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={progressMax}
                step={0.1}
                value={Math.min(playerSnap.currentTime, progressMax)}
                onChange={(e) => audioEngine.seek(parseFloat(e.target.value))}
                className="flex-1 h-1 accent-[#d4af63] cursor-pointer"
                aria-label="پیشرفت آهنگ"
              />
              <span className="text-[10px] text-[#d4af63]/85 tabular-nums w-10 text-center">
                {playerSnap.duration > 0 ? `-${formatTimeFa(remainingTime)}` : toPersianDigits('00:00')}
              </span>
            </div>

            {/* Compact Transport Row (Track + Minimal Controls + Subtle Utilities) */}
            <div className="flex items-center justify-between gap-2">
              {/* Song Info + Tiny Cover */}
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="w-8 h-8 rounded-lg overflow-hidden border border-[#c99c42]/40 bg-[#241812] shrink-0 flex items-center justify-center">
                  {activeTrack && coverFailedId !== activeTrack.id ? (
                    <img
                      src={activeTrack.coverUrl}
                      alt={activeTrack.title}
                      onError={() => setCoverFailedId(activeTrack.id)}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Disc3 className={`w-4 h-4 text-[#d4af63] ${playerSnap.isPlaying ? 'animate-spin' : ''}`} />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-medium text-[#efe4ce] truncate leading-tight">
                    {activeTrack?.title ?? 'آهنگی انتخاب نشده'}
                  </div>
                  <div className="text-[10px] text-[#d4af63]/80 truncate leading-tight">
                    {playerSnap.isLoading ? 'در حال بارگذاری...' : activeTrack?.artist ?? ''}
                  </div>
                </div>
              </div>

              {/* Minimal Classic Transport Buttons (44px touch targets, delicate icons) */}
              <div className="flex items-center gap-0.5 shrink-0">
                <button
                  type="button"
                  onClick={() => audioEngine.prevTrack()}
                  className="w-9 h-9 rounded-full text-[#efe4ce]/85 hover:text-[#d4af63] hover:bg-white/5 flex items-center justify-center cursor-pointer"
                  aria-label="آهنگ قبلی"
                  title="آهنگ قبلی"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => handleTogglePlay()}
                  className="w-10 h-10 rounded-full border border-[#c99c42]/70 bg-[#2a1c14]/70 text-[#d4af63] hover:bg-[#c99c42]/20 flex items-center justify-center cursor-pointer"
                  aria-label={playerSnap.isPlaying ? 'توقف' : 'پخش'}
                >
                  {playerSnap.isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => audioEngine.nextTrack(true)}
                  className="w-9 h-9 rounded-full text-[#efe4ce]/85 hover:text-[#d4af63] hover:bg-white/5 flex items-center justify-center cursor-pointer"
                  aria-label="آهنگ بعدی"
                  title="آهنگ بعدی"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Desktop Slim Volume + Playlist & Minimize */}
              <div className="flex items-center gap-0.5 shrink-0">
                <div className="hidden sm:flex items-center gap-1 ml-1">
                  <button
                    type="button"
                    onClick={() => {
                      const nextMuted = !audio.muted;
                      setAudioSettings({ muted: nextMuted });
                      audioEngine.setMuted(nextMuted);
                    }}
                    aria-label={audio.muted ? 'وصل صدا' : 'بی‌صدا'}
                    className="w-8 h-8 flex items-center justify-center text-[#d4af63]/90 hover:text-[#d4af63] cursor-pointer"
                  >
                    {audio.muted || audio.volume === 0 ? (
                      <VolumeX className="w-3.5 h-3.5" />
                    ) : (
                      <Volume2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={audio.muted ? 0 : audio.volume}
                    onChange={(e) => {
                      const v = parseFloat(e.target.value);
                      setAudioSettings({ volume: v, muted: v === 0 });
                      audioEngine.setVolume(v);
                      audioEngine.setMuted(v === 0);
                    }}
                    className="w-16 h-1 accent-[#d4af63] cursor-pointer"
                    aria-label="تنظیم صدا"
                  />
                </div>

                <button
                  type="button"
                  onClick={() => setPlaylistOpen((v) => !v)}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center cursor-pointer ${
                    playlistOpen ? 'text-[#d4af63] bg-[#c99c42]/15' : 'text-[#efe4ce]/80 hover:text-[#d4af63]'
                  }`}
                  aria-label="فهرست آهنگ‌ها و فضا"
                  title="فهرست آهنگ‌ها و حال‌وهوای اتاق"
                >
                  <ListMusic className="w-4 h-4" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setPlaylistOpen(false);
                    setIsMinimized(true);
                  }}
                  className="w-9 h-9 rounded-lg text-[#efe4ce]/75 hover:text-[#d4af63] flex items-center justify-center cursor-pointer"
                  aria-label="جمع کردن نوار پخش"
                  title="حالت مینیمال"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

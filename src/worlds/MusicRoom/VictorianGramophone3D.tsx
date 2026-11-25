import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createWoodTexture } from '../../systems/proceduralTextures';
import { createVictorianVinylTexture } from './victorianTextures';

interface VictorianGramophone3DProps {
  isPlaying: boolean;
  position?: [number, number, number];
}

export const VictorianGramophone3D: React.FC<VictorianGramophone3DProps> = ({
  isPlaying,
  position = [0, 0, -0.35],
}) => {
  const mahoganyTex = useMemo(() => createWoodTexture('#572919', '#32150c', 3), []);
  const walnutTex = useMemo(() => createWoodTexture('#3e2114', '#221008', 3), []);
  const vinylTex = useMemo(() => createVictorianVinylTexture('#781d29'), []);

  const recordRef = useRef<THREE.Mesh>(null);
  const armPivotRef = useRef<THREE.Group>(null);
  const armLiftRef = useRef<THREE.Group>(null);
  const crankRef = useRef<THREE.Group>(null);
  const hornGlowRef = useRef<THREE.PointLight>(null);

  useEffect(() => {
    return () => {
      mahoganyTex.dispose();
      walnutTex.dispose();
      vinylTex.dispose();
    };
  }, [mahoganyTex, walnutTex, vinylTex]);

  // Curved brass swan-neck elbow connecting rear bracket to horn throat
  const swanNeckGeo = useMemo(() => {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.0, 0.0, 0.0),
      new THREE.Vector3(0.0, 0.24, -0.06),
      new THREE.Vector3(-0.04, 0.44, -0.02),
      new THREE.Vector3(-0.08, 0.56, 0.14),
    ]);
    return new THREE.TubeGeometry(curve, 24, 0.046, 14, false);
  }, []);

  // Large flared Morning-Glory brass horn (Lathe profile opening dramatically)
  const hornBellGeo = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    const steps = 28;
    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      // Exponential morning-glory flare from throat (0.044) to wide bell (0.52)
      const r = 0.044 + 0.055 * t + 0.42 * Math.pow(t, 2.75);
      const y = t * 0.92;
      pts.push(new THREE.Vector2(r, y));
    }
    const geo = new THREE.LatheGeometry(pts, 40);
    // Add subtle 10-petal Victorian morning-glory scalloping near the wide rim
    const pos = geo.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const t = Math.max(0, Math.min(1, y / 0.92));
      if (t > 0.45) {
        const angle = Math.atan2(z, x);
        const wave = Math.sin(angle * 10) * 0.024 * Math.pow((t - 0.45) / 0.55, 1.8);
        const rad = Math.hypot(x, z);
        if (rad > 0.001) {
          const scale = (rad + wave) / rad;
          pos.setX(i, x * scale);
          pos.setZ(i, z * scale);
        }
      }
    }
    geo.computeVertexNormals();
    return geo;
  }, []);

  useEffect(() => {
    return () => {
      swanNeckGeo.dispose();
      hornBellGeo.dispose();
    };
  }, [swanNeckGeo, hornBellGeo]);

  useFrame(({ clock }, rawDelta) => {
    const dt = Math.min(0.05, rawDelta);
    const t = clock.getElapsedTime();

    // Smooth vinyl rotation strictly while playing
    if (recordRef.current && isPlaying) {
      recordRef.current.rotation.y += dt * 1.48;
    }

    // Smooth articulated tonearm swing & needle drop
    if (armPivotRef.current) {
      const targetYaw = isPlaying ? 0.42 : -0.04;
      armPivotRef.current.rotation.y = THREE.MathUtils.damp(
        armPivotRef.current.rotation.y,
        targetYaw,
        4.6,
        dt
      );
    }
    if (armLiftRef.current) {
      const targetPitch = isPlaying ? 0.0 : -0.17;
      armLiftRef.current.rotation.z = THREE.MathUtils.damp(
        armLiftRef.current.rotation.z,
        targetPitch,
        5.5,
        dt
      );
    }

    // Subtle mechanical governor shimmer on brass horn while playing
    if (hornGlowRef.current) {
      const targetIntensity = isPlaying ? 0.85 + Math.sin(t * 2.4) * 0.14 : 0.35;
      hornGlowRef.current.intensity = THREE.MathUtils.damp(
        hornGlowRef.current.intensity,
        targetIntensity,
        5,
        dt
      );
    }
    if (crankRef.current && isPlaying) {
      crankRef.current.rotation.x = Math.sin(t * 0.6) * 0.02;
    }
  });

  return (
    <group position={position}>
      {/* ============================================================= */}
      {/* 1. ANTIQUE MAHOGANY GRAMOPHONE PEDESTAL TABLE (h = 0.78m)     */}
      {/* ============================================================= */}
      <group>
        {/* Tabletop with stepped molded apron */}
        <mesh position={[0, 0.75, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.68, 0.075, 1.32]} />
          <meshStandardMaterial map={mahoganyTex} roughness={0.34} metalness={0.08} />
        </mesh>
        <mesh position={[0, 0.67, 0]} castShadow>
          <boxGeometry args={[1.52, 0.11, 1.16]} />
          <meshStandardMaterial map={walnutTex} roughness={0.45} />
        </mesh>
        {/* Brass inlaid trim strip */}
        <mesh position={[0, 0.755, 0.665]}>
          <boxGeometry args={[1.62, 0.02, 0.015]} />
          <meshStandardMaterial color="#c99c42" metalness={0.85} roughness={0.24} />
        </mesh>

        {/* 4 Turned Fluted Pedestal Legs */}
        {[
          [-0.68, 0.35, -0.5],
          [0.68, 0.35, -0.5],
          [-0.68, 0.35, 0.5],
          [0.68, 0.35, 0.5],
        ].map(([lx, ly, lz], idx) => (
          <group key={idx} position={[lx, ly, lz]}>
            <mesh castShadow>
              <cylinderGeometry args={[0.055, 0.036, 0.68, 14]} />
              <meshStandardMaterial map={walnutTex} roughness={0.42} />
            </mesh>
            {/* Brass Foot Cap */}
            <mesh position={[0, -0.31, 0]}>
              <cylinderGeometry args={[0.042, 0.038, 0.065, 12]} />
              <meshStandardMaterial color="#c99c42" metalness={0.85} roughness={0.25} />
            </mesh>
          </group>
        ))}

        {/* Lower Shelf & Antique Shellac Record Albums */}
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.38, 0.045, 1.02]} />
          <meshStandardMaterial map={walnutTex} roughness={0.48} />
        </mesh>
        {['#5e1621', '#1b382c', '#3d281a', '#705224'].map((col, idx) => (
          <mesh key={idx} position={[-0.38 + idx * 0.22, 0.262, 0.05]} rotation={[0, 0.06 * (idx - 1.5), 0]} castShadow>
            <boxGeometry args={[0.36, 0.024, 0.36]} />
            <meshStandardMaterial color={col} roughness={0.68} />
          </mesh>
        ))}
      </group>

      {/* ============================================================= */}
      {/* 2. CARVED MAHOGANY GRAMOPHONE CABINET BODY (y = 0.788m base)  */}
      {/* ============================================================= */}
      <group position={[0, 0.788, 0.04]}>
        {/* Lower Stepped Plinth */}
        <mesh position={[0, 0.035, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.98, 0.07, 0.88]} />
          <meshStandardMaterial map={walnutTex} roughness={0.38} />
        </mesh>
        {/* Main Glossy Mahogany Cabinet */}
        <mesh position={[0, 0.19, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.88, 0.25, 0.78]} />
          <meshPhysicalMaterial
            map={mahoganyTex}
            roughness={0.28}
            clearcoat={0.55}
            clearcoatRoughness={0.22}
          />
        </mesh>
        {/* Upper Molded Crown Lip */}
        <mesh position={[0, 0.325, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.94, 0.05, 0.84]} />
          <meshStandardMaterial map={walnutTex} roughness={0.35} />
        </mesh>

        {/* Decorative Carved Front & Side Relief Trim + Brass Corner Hardware */}
        <mesh position={[0, 0.19, 0.395]}>
          <boxGeometry args={[0.68, 0.15, 0.025]} />
          <meshStandardMaterial color="#3c1e12" roughness={0.42} />
        </mesh>
        {/* Brass Nameplate & Drawer Knobs */}
        <mesh position={[0, 0.22, 0.412]}>
          <boxGeometry args={[0.18, 0.045, 0.01]} />
          <meshStandardMaterial color="#d4a64a" metalness={0.9} roughness={0.2} />
        </mesh>
        {[-0.22, 0.22].map((kx, i) => (
          <mesh key={i} position={[kx, 0.16, 0.415]}>
            <sphereGeometry args={[0.02, 10, 10]} />
            <meshStandardMaterial color="#d4a64a" metalness={0.9} roughness={0.2} />
          </mesh>
        ))}
        {/* Brass Corner Brackets */}
        {[
          [-0.44, 0.05, 0.39],
          [0.44, 0.05, 0.39],
          [-0.44, 0.05, -0.39],
          [0.44, 0.05, -0.39],
        ].map((cp, i) => (
          <mesh key={i} position={cp as [number, number, number]}>
            <boxGeometry args={[0.06, 0.08, 0.06]} />
            <meshStandardMaterial color="#c99c42" metalness={0.88} roughness={0.22} />
          </mesh>
        ))}

        {/* Side Winding Crank Handle (دسته کوک مکانیکی برنجی) */}
        <group ref={crankRef} position={[0.45, 0.19, 0.04]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.026, 0.03, 0.06, 12]} />
            <meshStandardMaterial color="#c99c42" metalness={0.88} roughness={0.22} />
          </mesh>
          <mesh position={[0.08, -0.04, 0]} rotation={[0.4, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.012, 0.012, 0.14, 8]} />
            <meshStandardMaterial color="#d4a64a" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0.14, -0.09, 0.05]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.018, 0.016, 0.09, 10]} />
            <meshStandardMaterial color="#2a160c" roughness={0.45} />
          </mesh>
        </group>

        {/* Speed Regulator & Brass Brake Lever */}
        <mesh position={[-0.34, 0.356, 0.24]}>
          <cylinderGeometry args={[0.028, 0.032, 0.022, 12]} />
          <meshStandardMaterial color="#d4a64a" metalness={0.88} roughness={0.22} />
        </mesh>

        {/* ============================================================= */}
        {/* 3. TURNTABLE PLATTER, GROOVED VINYL & ARTICULATED TONEARM     */}
        {/* ============================================================= */}
        <group position={[-0.06, 0.352, 0.04]}>
          {/* Heavy Brass Platter Rim */}
          <mesh castShadow>
            <cylinderGeometry args={[0.36, 0.38, 0.03, 36]} />
            <meshStandardMaterial color="#c99c42" metalness={0.88} roughness={0.22} />
          </mesh>
          {/* Green Velvet Platter Mat */}
          <mesh position={[0, 0.017, 0]}>
            <cylinderGeometry args={[0.345, 0.345, 0.006, 32]} />
            <meshStandardMaterial color="#184231" roughness={0.92} />
          </mesh>
          {/* Spinning Black Shellac/Vinyl Record */}
          <mesh ref={recordRef} position={[0, 0.026, 0]} castShadow>
            <cylinderGeometry args={[0.335, 0.335, 0.01, 40]} />
            <meshPhysicalMaterial
              map={vinylTex}
              roughness={0.22}
              metalness={0.12}
              clearcoat={0.65}
              clearcoatRoughness={0.18}
            />
          </mesh>
          {/* Center Brass Spindle */}
          <mesh position={[0, 0.044, 0]}>
            <cylinderGeometry args={[0.014, 0.016, 0.032, 12]} />
            <meshStandardMaterial color="#e0b861" metalness={0.92} roughness={0.16} />
          </mesh>
        </group>

        {/* Articulated Brass Tonearm & Needle Reproducer */}
        <group ref={armPivotRef} position={[0.32, 0.365, -0.22]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.048, 0.062, 0.09, 16]} />
            <meshStandardMaterial color="#c99c42" metalness={0.9} roughness={0.2} />
          </mesh>
          <group ref={armLiftRef} position={[0, 0.048, 0]}>
            {/* Tapered Brass Tonearm */}
            <mesh position={[-0.14, 0.015, 0.16]} rotation={[0, -0.68, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.011, 0.02, 0.42, 12]} />
              <meshStandardMaterial color="#d4a64a" metalness={0.92} roughness={0.18} />
            </mesh>
            {/* Circular Antique Soundbox Reproducer Head */}
            <mesh position={[-0.29, -0.005, 0.3]} rotation={[Math.PI / 2, 0.68, 0]} castShadow>
              <cylinderGeometry args={[0.048, 0.048, 0.026, 18]} />
              <meshStandardMaterial color="#d4a64a" metalness={0.92} roughness={0.18} />
            </mesh>
            {/* Fine Steel Needle Point */}
            <mesh position={[-0.31, -0.036, 0.315]} rotation={[0.22, 0, 0]}>
              <coneGeometry args={[0.006, 0.04, 8]} />
              <meshStandardMaterial color="#d8dde6" metalness={0.95} roughness={0.12} />
            </mesh>
          </group>
        </group>

        {/* Brass Tonearm Rest Cradle */}
        <mesh position={[0.31, 0.38, 0.16]}>
          <cylinderGeometry args={[0.012, 0.018, 0.06, 8]} />
          <meshStandardMaterial color="#c99c42" metalness={0.85} roughness={0.25} />
        </mesh>

        {/* ============================================================= */}
        {/* 4. GRAND FLARED BRASS MORNING-GLORY HORN (شیپور بزرگ برنجی)  */}
        {/* ============================================================= */}
        <group position={[0.24, 0.35, -0.34]}>
          {/* Heavy Cast Brass Rear Mounting Bracket bolted to Cabinet */}
          <mesh position={[0, 0.04, -0.02]} castShadow>
            <boxGeometry args={[0.16, 0.16, 0.09]} />
            <meshStandardMaterial color="#a67c30" metalness={0.88} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.08, -0.05]}>
            <cylinderGeometry args={[0.055, 0.068, 0.12, 14]} />
            <meshStandardMaterial color="#c99c42" metalness={0.9} roughness={0.22} />
          </mesh>

          {/* Curved Brass Swan-Neck */}
          <mesh geometry={swanNeckGeo} castShadow>
            <meshPhysicalMaterial
              color="#d4a546"
              metalness={0.92}
              roughness={0.18}
              clearcoat={0.45}
            />
          </mesh>

          {/* Collar Coupling Ring */}
          <mesh position={[-0.08, 0.56, 0.14]} rotation={[0.92, 0, 0.2]}>
            <torusGeometry args={[0.052, 0.014, 10, 20]} />
            <meshStandardMaterial color="#b38534" metalness={0.92} roughness={0.22} />
          </mesh>

          {/* Hero Flared Morning-Glory Brass Bell */}
          <group position={[-0.08, 0.56, 0.14]} rotation={[0.98, 0.12, 0.24]}>
            <mesh geometry={hornBellGeo} castShadow>
              <meshPhysicalMaterial
                color="#d8aa4c"
                metalness={0.92}
                roughness={0.16}
                clearcoat={0.5}
                clearcoatRoughness={0.14}
                side={THREE.DoubleSide}
              />
            </mesh>
            {/* Inner Warm Brass Acoustic Rim Highlight */}
            <mesh position={[0, 0.92, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.515, 0.016, 12, 42]} />
              <meshStandardMaterial color="#e6be6a" metalness={0.95} roughness={0.14} />
            </mesh>
          </group>

          {/* Subtle Warm Reflection Light Inside Horn Bell */}
          <pointLight
            ref={hornGlowRef}
            position={[-0.25, 1.05, 0.72]}
            color="#ffd88c"
            intensity={0.45}
            distance={3.2}
            decay={2}
          />
        </group>
      </group>
    </group>
  );
};

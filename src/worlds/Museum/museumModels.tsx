import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { audioEngine } from '../../systems/audioEngine';

export type FrameStyle = 'classic_gold' | 'ornate_salon' | 'walnut_gilt' | 'empire_ebony';

export interface PhotoSlot {
  index: number;
  src: string;
  hall: 'hall1' | 'hall2' | 'hall4' | 'hall5';
  position: [number, number, number];
  rotationY: number;
  normal: [number, number, number];
  style: FrameStyle;
  baseSize: number;
}

/**
 * ستون کلاسیک با پایه، تنه شیاردار و سرستون کورنتین (Corinthian)
 */
export const CorinthianColumn: React.FC<{
  position: [number, number, number];
  height?: number;
  stoneColor?: string;
  goldColor?: string;
}> = ({ position, height = 7.6, stoneColor = '#e9decb', goldColor = '#cfa95b' }) => {
  const shaftH = Math.max(3.0, height - 1.15);
  return (
    <group position={position}>
      {/* Stepped Attic Plinth */}
      <mesh position={[0, 0.14, 0]} receiveShadow>
        <boxGeometry args={[0.92, 0.28, 0.92]} />
        <meshStandardMaterial color="#d8cbb5" roughness={0.62} />
      </mesh>
      <mesh position={[0, 0.34, 0]}>
        <cylinderGeometry args={[0.39, 0.44, 0.14, 18]} />
        <meshStandardMaterial color={stoneColor} roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.45, 0]}>
        <torusGeometry args={[0.36, 0.045, 8, 20]} />
        <meshStandardMaterial color={stoneColor} roughness={0.5} />
      </mesh>

      {/* Fluted Classical Shaft (subtle entasis taper) */}
      <mesh position={[0, 0.48 + shaftH / 2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.28, 0.33, shaftH, 16]} />
        <meshStandardMaterial color={stoneColor} roughness={0.58} metalness={0.04} />
      </mesh>

      {/* Astragal Gilt Collar */}
      <mesh position={[0, 0.48 + shaftH + 0.04, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.295, 0.032, 8, 20]} />
        <meshStandardMaterial color={goldColor} metalness={0.85} roughness={0.26} />
      </mesh>

      {/* Lower & Upper Acanthus Leaf Bell Tiers */}
      <mesh position={[0, 0.48 + shaftH + 0.22, 0]}>
        <cylinderGeometry args={[0.37, 0.29, 0.3, 14]} />
        <meshStandardMaterial color={stoneColor} roughness={0.52} />
      </mesh>
      <mesh position={[0, 0.48 + shaftH + 0.36, 0]}>
        <cylinderGeometry args={[0.42, 0.35, 0.2, 12]} />
        <meshStandardMaterial color={goldColor} metalness={0.72} roughness={0.32} />
      </mesh>

      {/* 4 Corner Corinthian Volute Scrolls */}
      {[
        [-0.36, -0.36],
        [0.36, -0.36],
        [-0.36, 0.36],
        [0.36, 0.36],
      ].map(([vx, vz], idx) => (
        <mesh key={idx} position={[vx, 0.48 + shaftH + 0.46, vz]}>
          <sphereGeometry args={[0.095, 10, 10]} />
          <meshStandardMaterial color={goldColor} metalness={0.82} roughness={0.26} />
        </mesh>
      ))}

      {/* Molded Abacus Cap */}
      <mesh position={[0, 0.48 + shaftH + 0.58, 0]}>
        <boxGeometry args={[0.92, 0.16, 0.92]} />
        <meshStandardMaterial color="#dfd3be" roughness={0.56} />
      </mesh>
    </group>
  );
};

/**
 * لوستر کریستالی باشکوه فرانسوی (Gilt-Bronze & Crystal Chandelier)
 */
export const CrystalChandelier: React.FC<{
  position: [number, number, number];
  scale?: number;
  lightIntensity?: number;
  lightColor?: string;
  withRealLight?: boolean;
}> = ({
  position,
  scale = 1,
  lightIntensity = 2.6,
  lightColor = '#ffe4b8',
  withRealLight = true,
}) => {
  const outerArms = useMemo(() => Array.from({ length: 8 }, (_, i) => (i / 8) * Math.PI * 2), []);
  const innerDrops = useMemo(() => Array.from({ length: 10 }, (_, i) => (i / 10) * Math.PI * 2), []);

  return (
    <group position={position} scale={scale}>
      {/* Ceiling Rosette & Suspension Chain */}
      <mesh position={[0, 1.35, 0]}>
        <cylinderGeometry args={[0.32, 0.18, 0.14, 16]} />
        <meshStandardMaterial color="#cfa95b" metalness={0.88} roughness={0.22} />
      </mesh>
      <mesh position={[0, 0.72, 0]}>
        <cylinderGeometry args={[0.032, 0.032, 1.28, 10]} />
        <meshStandardMaterial color="#cfa95b" metalness={0.88} roughness={0.22} />
      </mesh>

      {/* Central Turned Brass & Crystal Column */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.12, 0.19, 0.62, 14]} />
        <meshStandardMaterial color="#d4af61" metalness={0.88} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.34, 0]}>
        <sphereGeometry args={[0.16, 14, 14]} />
        <meshPhysicalMaterial color="#f5f8ff" roughness={0.05} metalness={0.08} clearcoat={1} />
      </mesh>

      {/* Main Gilded Crown Ring */}
      <mesh position={[0, 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.78, 0.038, 10, 28]} />
        <meshStandardMaterial color="#cfa95b" metalness={0.88} roughness={0.2} />
      </mesh>
      <mesh position={[0, -0.18, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.48, 0.026, 8, 24]} />
        <meshStandardMaterial color="#cfa95b" metalness={0.88} roughness={0.2} />
      </mesh>

      {/* 8 Candle Arms + Glowing Wax Bulbs */}
      {outerArms.map((angle, i) => {
        const ax = Math.cos(angle) * 0.88;
        const az = Math.sin(angle) * 0.88;
        return (
          <group key={i}>
            <mesh
              position={[ax * 0.52, -0.02, az * 0.52]}
              rotation={[0, -angle, Math.PI / 2.4]}
            >
              <cylinderGeometry args={[0.018, 0.022, 0.86, 8]} />
              <meshStandardMaterial color="#cfa95b" metalness={0.86} roughness={0.24} />
            </mesh>
            <mesh position={[ax, 0.14, az]}>
              <cylinderGeometry args={[0.03, 0.03, 0.16, 8]} />
              <meshStandardMaterial color="#f6efe2" roughness={0.65} />
            </mesh>
            <mesh position={[ax, 0.25, az]}>
              <sphereGeometry args={[0.048, 10, 10]} />
              <meshStandardMaterial
                color="#fff3d1"
                emissive="#ffd685"
                emissiveIntensity={2.2}
                roughness={0.2}
              />
            </mesh>
          </group>
        );
      })}

      {/* Tiered Crystal Garland Prisms */}
      {innerDrops.map((angle, i) => (
        <mesh
          key={`drop-${i}`}
          position={[Math.cos(angle) * 0.58, -0.06, Math.sin(angle) * 0.58]}
        >
          <octahedronGeometry args={[0.068, 0]} />
          <meshPhysicalMaterial
            color="#eef5ff"
            roughness={0.04}
            metalness={0.1}
            clearcoat={1}
          />
        </mesh>
      ))}
      <mesh position={[0, -0.58, 0]}>
        <octahedronGeometry args={[0.13, 0]} />
        <meshPhysicalMaterial color="#eef5ff" roughness={0.04} metalness={0.1} clearcoat={1} />
      </mesh>

      {withRealLight && (
        <pointLight
          position={[0, -0.25, 0]}
          color={lightColor}
          intensity={lightIntensity}
          distance={22}
          decay={1.4}
        />
      )}
    </group>
  );
};

/**
 * شمعدان دیواری برنجی و کلاسیک
 */
export const BrassWallSconce: React.FC<{
  position: [number, number, number];
  rotationY?: number;
}> = ({ position, rotationY = 0 }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <mesh position={[0, 0, 0.02]}>
      <cylinderGeometry args={[0.11, 0.14, 0.04, 14]} />
      <meshStandardMaterial color="#c9a353" metalness={0.88} roughness={0.24} />
    </mesh>
    {[-0.12, 0.12].map((ox, i) => (
      <group key={i} position={[ox, 0.04, 0.14]}>
        <mesh position={[0, -0.06, -0.06]} rotation={[Math.PI / 3, 0, 0]}>
          <cylinderGeometry args={[0.014, 0.016, 0.16, 8]} />
          <meshStandardMaterial color="#c9a353" metalness={0.86} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.022, 0.022, 0.14, 8]} />
          <meshStandardMaterial color="#f5ecdc" roughness={0.65} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.042, 8, 8]} />
          <meshStandardMaterial color="#fff1cc" emissive="#ffd582" emissiveIntensity={2.0} />
        </mesh>
      </group>
    ))}
  </group>
);

/**
 * پنجره بلند قوسی پاریسی با نور طبیعی ملایم
 */
export const ArchedBeauxArtsWindow: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  width?: number;
  height?: number;
  skyColor?: string;
  withLightBeam?: boolean;
}> = ({
  position,
  rotationY = 0,
  width = 2.6,
  height = 4.6,
  skyColor = '#f4f7ff',
  withLightBeam = true,
}) => {
  const archR = width / 2;
  const rectH = height - archR;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Stone Surround Arch Frame */}
      <mesh position={[-archR - 0.12, rectH / 2, 0.06]}>
        <boxGeometry args={[0.24, rectH, 0.14]} />
        <meshStandardMaterial color="#d8cbb4" roughness={0.6} />
      </mesh>
      <mesh position={[archR + 0.12, rectH / 2, 0.06]}>
        <boxGeometry args={[0.24, rectH, 0.14]} />
        <meshStandardMaterial color="#d8cbb4" roughness={0.6} />
      </mesh>
      <mesh position={[0, rectH, 0.06]} rotation={[0, 0, 0]}>
        <torusGeometry args={[archR + 0.12, 0.12, 10, 22, Math.PI]} />
        <meshStandardMaterial color="#d8cbb4" roughness={0.6} />
      </mesh>
      {/* Stone Window Sill */}
      <mesh position={[0, -0.08, 0.12]}>
        <boxGeometry args={[width + 0.52, 0.16, 0.26]} />
        <meshStandardMaterial color="#cfc0a5" roughness={0.55} />
      </mesh>

      {/* Luminous Frosted Daylight Glass */}
      <mesh position={[0, rectH / 2, 0.03]}>
        <planeGeometry args={[width, rectH]} />
        <meshStandardMaterial
          color={skyColor}
          emissive={skyColor}
          emissiveIntensity={0.95}
          roughness={0.2}
        />
      </mesh>
      <mesh position={[0, rectH, 0.03]}>
        <circleGeometry args={[archR, 22, 0, Math.PI]} />
        <meshStandardMaterial
          color={skyColor}
          emissive={skyColor}
          emissiveIntensity={0.95}
          roughness={0.2}
        />
      </mesh>

      {/* Dark Wrought-Iron French Muntin Mullions */}
      {[-width * 0.25, 0, width * 0.25].map((mx, i) => (
        <mesh key={`v-${i}`} position={[mx, rectH / 2 + archR * 0.25, 0.05]}>
          <boxGeometry args={[0.045, rectH + archR * 0.5, 0.05]} />
          <meshStandardMaterial color="#2c2a29" metalness={0.65} roughness={0.35} />
        </mesh>
      ))}
      {[0.28, 0.56, 0.84].map((t, i) => (
        <mesh key={`h-${i}`} position={[0, rectH * t, 0.05]}>
          <boxGeometry args={[width, 0.045, 0.05]} />
          <meshStandardMaterial color="#2c2a29" metalness={0.65} roughness={0.35} />
        </mesh>
      ))}

      {/* Subtle Soft Volumetric Daylight Beam */}
      {withLightBeam && (
        <mesh position={[0, rectH * 0.45, 2.1]} rotation={[-Math.PI / 3.4, 0, 0]}>
          <planeGeometry args={[width * 0.86, 5.2]} />
          <meshBasicMaterial
            color={skyColor}
            transparent
            opacity={0.055}
            depthWrite={false}
            side={THREE.DoubleSide}
          />
        </mesh>
      )}
    </group>
  );
};

/**
 * درهای چوبی بلند و باشکوه ورودی کاخ (Monumental Double Oak Palace Doors)
 */
export const MonumentalOakDoors: React.FC<{ position: [number, number, number]; rotationY?: number }> = ({
  position,
  rotationY = 0,
}) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    {/* Limestone Door Jamb & Gilded Pediment */}
    <mesh position={[-1.95, 2.35, 0.08]}>
      <boxGeometry args={[0.42, 4.7, 0.22]} />
      <meshStandardMaterial color="#d9ccb6" roughness={0.58} />
    </mesh>
    <mesh position={[1.95, 2.35, 0.08]}>
      <boxGeometry args={[0.42, 4.7, 0.22]} />
      <meshStandardMaterial color="#d9ccb6" roughness={0.58} />
    </mesh>
    <mesh position={[0, 4.82, 0.12]}>
      <boxGeometry args={[4.45, 0.34, 0.28]} />
      <meshStandardMaterial color="#cfc0a4" roughness={0.55} />
    </mesh>
    <mesh position={[0, 5.15, 0.16]}>
      <boxGeometry args={[4.7, 0.18, 0.34]} />
      <meshStandardMaterial color="#cfa857" metalness={0.82} roughness={0.25} />
    </mesh>

    {/* Left & Right Tall Carved Oak Panels */}
    {[-0.86, 0.86].map((dx, i) => (
      <group key={i} position={[dx, 2.32, 0.05]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[1.66, 4.62, 0.12]} />
          <meshStandardMaterial color="#4a2e1d" roughness={0.52} metalness={0.06} />
        </mesh>
        {/* Recessed Carved Wood Coffer Panels */}
        {[1.35, -0.15, -1.5].map((py, j) => (
          <mesh key={j} position={[0, py, 0.068]}>
            <boxGeometry args={[1.18, 1.05, 0.035]} />
            <meshStandardMaterial color="#5b3924" roughness={0.46} />
          </mesh>
        ))}
        {/* Ornate Brass Door Pull & Escutcheon */}
        <mesh position={[i === 0 ? 0.56 : -0.56, -0.25, 0.09]}>
          <boxGeometry args={[0.1, 0.32, 0.03]} />
          <meshStandardMaterial color="#d2ab58" metalness={0.88} roughness={0.2} />
        </mesh>
        <mesh position={[i === 0 ? 0.56 : -0.56, -0.25, 0.13]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.075, 0.018, 8, 16]} />
          <meshStandardMaterial color="#d2ab58" metalness={0.88} roughness={0.2} />
        </mesh>
      </group>
    ))}
  </group>
);

/**
 * مجسمه تمام‌قد کلاسیک مرمرین روی پایه حکاکی‌شده (مرکز تالار مجسمه پتی پاله)
 */
export const ClassicalSculptureFull: React.FC<{
  position: [number, number, number];
  contactTex: THREE.Texture;
}> = ({ position, contactTex }) => {
  const cloakProfile = useMemo(() => {
    return [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.46, 0.02),
      new THREE.Vector2(0.42, 0.35),
      new THREE.Vector2(0.32, 0.85),
      new THREE.Vector2(0.24, 1.25),
      new THREE.Vector2(0.26, 1.55),
      new THREE.Vector2(0.18, 1.75),
      new THREE.Vector2(0.0, 1.76),
    ];
  }, []);

  return (
    <group position={position}>
      {/* Ground Contact Shadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
        <planeGeometry args={[2.9, 2.9]} />
        <meshBasicMaterial map={contactTex} transparent depthWrite={false} />
      </mesh>

      {/* Multi-tiered Stepped Carrara Marble Plinth */}
      <mesh position={[0, 0.14, 0]} receiveShadow castShadow>
        <boxGeometry args={[2.05, 0.28, 2.05]} />
        <meshStandardMaterial color="#ded6c9" roughness={0.38} />
      </mesh>
      <mesh position={[0, 0.82, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.72, 0.8, 1.12, 24]} />
        <meshStandardMaterial color="#ebe4d8" roughness={0.32} />
      </mesh>
      <mesh position={[0, 1.44, 0]}>
        <cylinderGeometry args={[0.84, 0.78, 0.14, 24]} />
        <meshStandardMaterial color="#d2b068" metalness={0.8} roughness={0.24} />
      </mesh>
      <mesh position={[0, 1.58, 0]}>
        <boxGeometry args={[1.25, 0.14, 1.25]} />
        <meshStandardMaterial color="#f2ece2" roughness={0.28} />
      </mesh>

      {/* Full-Length Sculpted Marble Figure */}
      <group position={[0, 1.65, 0]}>
        {/* Flowing Draped Gown Skirt */}
        <mesh castShadow>
          <latheGeometry args={[cloakProfile, 22]} />
          <meshPhysicalMaterial color="#f5f1ea" roughness={0.26} clearcoat={0.25} clearcoatRoughness={0.4} />
        </mesh>

        {/* Classical Shoulders & Draped Sash */}
        <mesh position={[0, 1.52, 0]} castShadow>
          <capsuleGeometry args={[0.24, 0.34, 8, 14]} />
          <meshPhysicalMaterial color="#f5f1ea" roughness={0.26} clearcoat={0.25} />
        </mesh>

        {/* Swept Classical Marble Wings (Louvre Nike / Winged Victory tribute) */}
        {[-1, 1].map((side) => (
          <group
            key={side}
            position={[side * 0.22, 1.56, -0.14]}
            rotation={[0.22, side * 0.42, side * -0.45]}
          >
            <mesh castShadow>
              <boxGeometry args={[0.72, 1.08, 0.1]} />
              <meshPhysicalMaterial color="#f2ede4" roughness={0.28} clearcoat={0.2} />
            </mesh>
            <mesh position={[side * 0.22, 0.36, -0.02]} rotation={[0, 0, side * -0.25]}>
              <boxGeometry args={[0.45, 0.56, 0.08]} />
              <meshPhysicalMaterial color="#f7f3ec" roughness={0.25} />
            </mesh>
          </group>
        ))}

        {/* Raised Graceful Arms Holding Gilded Laurel Crown */}
        <mesh position={[-0.28, 1.72, 0.16]} rotation={[0.45, 0, 0.45]}>
          <capsuleGeometry args={[0.072, 0.42, 6, 10]} />
          <meshPhysicalMaterial color="#f5f1ea" roughness={0.26} />
        </mesh>
        <mesh position={[0.28, 1.78, 0.18]} rotation={[0.55, 0, -0.38]}>
          <capsuleGeometry args={[0.072, 0.44, 6, 10]} />
          <meshPhysicalMaterial color="#f5f1ea" roughness={0.26} />
        </mesh>
        <mesh position={[0, 2.02, 0.32]} rotation={[Math.PI / 3, 0, 0]}>
          <torusGeometry args={[0.16, 0.025, 8, 22]} />
          <meshStandardMaterial color="#d4af5e" metalness={0.88} roughness={0.2} />
        </mesh>

        {/* Neck & Sculpted Classical Head */}
        <mesh position={[0, 1.84, 0.02]}>
          <cylinderGeometry args={[0.085, 0.1, 0.18, 12]} />
          <meshPhysicalMaterial color="#f5f1ea" roughness={0.25} />
        </mesh>
        <mesh position={[0, 2.03, 0.04]} castShadow>
          <sphereGeometry args={[0.17, 16, 16]} />
          <meshPhysicalMaterial color="#f7f3ec" roughness={0.24} clearcoat={0.28} />
        </mesh>
        {/* Hair Chignon */}
        <mesh position={[0, 2.09, -0.1]}>
          <sphereGeometry args={[0.11, 12, 12]} />
          <meshPhysicalMaterial color="#ede6da" roughness={0.32} />
        </mesh>
      </group>
    </group>
  );
};

/**
 * نیم‌تنه سنگی مرمرین روی پایه تزئینی حکاکی‌شده
 */
export const MarbleBustExhibit: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  contactTex: THREE.Texture;
}> = ({ position, rotationY = 0, contactTex }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
      <planeGeometry args={[1.45, 1.45]} />
      <meshBasicMaterial map={contactTex} transparent depthWrite={false} />
    </mesh>

    {/* Carved Stone Pedestal */}
    <mesh position={[0, 0.09, 0]} receiveShadow>
      <boxGeometry args={[0.88, 0.18, 0.88]} />
      <meshStandardMaterial color="#d7cbb8" roughness={0.48} />
    </mesh>
    <mesh position={[0, 0.68, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.66, 1.02, 0.66]} />
      <meshStandardMaterial color="#e7dfd0" roughness={0.42} />
    </mesh>
    {/* Carved Recessed Pedestal Frame */}
    <mesh position={[0, 0.68, 0.335]}>
      <boxGeometry args={[0.44, 0.72, 0.03]} />
      <meshStandardMaterial color="#d4c7b0" roughness={0.5} />
    </mesh>
    <mesh position={[0, 1.24, 0]}>
      <boxGeometry args={[0.8, 0.12, 0.8]} />
      <meshStandardMaterial color="#efe8dc" roughness={0.36} />
    </mesh>

    {/* Marble Bust Socle & Draped Shoulders */}
    <mesh position={[0, 1.38, 0]}>
      <cylinderGeometry args={[0.12, 0.18, 0.16, 14]} />
      <meshStandardMaterial color="#cfc3b0" roughness={0.35} />
    </mesh>
    <mesh position={[0, 1.62, 0]} castShadow>
      <boxGeometry args={[0.52, 0.34, 0.28]} />
      <meshPhysicalMaterial color="#f5f1ea" roughness={0.26} clearcoat={0.22} />
    </mesh>
    <mesh position={[0, 1.84, 0]}>
      <cylinderGeometry args={[0.075, 0.09, 0.18, 12]} />
      <meshPhysicalMaterial color="#f5f1ea" roughness={0.25} />
    </mesh>
    <mesh position={[0, 2.02, 0.02]} castShadow>
      <sphereGeometry args={[0.155, 16, 16]} />
      <meshPhysicalMaterial color="#f7f3ec" roughness={0.24} clearcoat={0.25} />
    </mesh>
    {/* Sculpted Hair Crown */}
    <mesh position={[0, 2.1, -0.02]}>
      <torusGeometry args={[0.135, 0.042, 8, 16]} />
      <meshPhysicalMaterial color="#ece5d8" roughness={0.34} />
    </mesh>
  </group>
);

/**
 * گلدان بزرگ کلاسیک موزه‌ای (Amphora Urn on Plinth)
 */
export const ClassicalAmphoraUrn: React.FC<{
  position: [number, number, number];
  contactTex: THREE.Texture;
  bodyColor?: string;
}> = ({ position, contactTex, bodyColor = '#28405a' }) => {
  const urnProfile = useMemo(
    () => [
      new THREE.Vector2(0.0, 0.0),
      new THREE.Vector2(0.22, 0.04),
      new THREE.Vector2(0.14, 0.18),
      new THREE.Vector2(0.34, 0.56),
      new THREE.Vector2(0.32, 0.78),
      new THREE.Vector2(0.16, 1.02),
      new THREE.Vector2(0.24, 1.18),
      new THREE.Vector2(0.18, 1.22),
      new THREE.Vector2(0.0, 1.22),
    ],
    []
  );

  return (
    <group position={position}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
        <planeGeometry args={[1.3, 1.3]} />
        <meshBasicMaterial map={contactTex} transparent depthWrite={false} />
      </mesh>
      <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.74, 0.9, 0.74]} />
        <meshStandardMaterial color="#e5dccb" roughness={0.44} />
      </mesh>
      <mesh position={[0, 0.94, 0]}>
        <boxGeometry args={[0.84, 0.09, 0.84]} />
        <meshStandardMaterial color="#cfa857" metalness={0.82} roughness={0.24} />
      </mesh>
      <group position={[0, 0.99, 0]}>
        <mesh castShadow>
          <latheGeometry args={[urnProfile, 20]} />
          <meshPhysicalMaterial color={bodyColor} roughness={0.18} clearcoat={0.85} clearcoatRoughness={0.15} />
        </mesh>
        {/* Gilt Twin Handles & Finial */}
        {[-1, 1].map((side) => (
          <mesh key={side} position={[side * 0.34, 0.74, 0]} rotation={[0, 0, side * -0.22]}>
            <torusGeometry args={[0.14, 0.022, 8, 16, Math.PI * 1.1]} />
            <meshStandardMaterial color="#d2ab58" metalness={0.88} roughness={0.2} />
          </mesh>
        ))}
        <mesh position={[0, 1.28, 0]}>
          <sphereGeometry args={[0.07, 10, 10]} />
          <meshStandardMaterial color="#d2ab58" metalness={0.88} roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
};

/**
 * نیمکت چوبی آنتیک با نشیمن مخمل
 */
export const AntiqueMuseumBench: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  length?: number;
  velvetColor?: string;
  contactTex: THREE.Texture;
}> = ({ position, rotationY = 0, length = 2.4, velvetColor = '#6f1f2a', contactTex }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
      <planeGeometry args={[length + 0.5, 1.35]} />
      <meshBasicMaterial map={contactTex} transparent depthWrite={false} />
    </mesh>

    {/* Tufted Velvet Seat Cushion */}
    <mesh position={[0, 0.46, 0]} castShadow receiveShadow>
      <boxGeometry args={[length, 0.14, 0.84]} />
      <meshPhysicalMaterial color={velvetColor} roughness={0.86} sheen={0.85} sheenColor="#d9b2b8" />
    </mesh>
    {/* Carved Walnut Skirt Apron & Brass Trim */}
    <mesh position={[0, 0.36, 0]} castShadow>
      <boxGeometry args={[length - 0.06, 0.09, 0.78]} />
      <meshStandardMaterial color="#4e301e" roughness={0.45} />
    </mesh>
    <mesh position={[0, 0.39, 0]}>
      <boxGeometry args={[length + 0.01, 0.02, 0.85]} />
      <meshStandardMaterial color="#c9a252" metalness={0.85} roughness={0.25} />
    </mesh>

    {/* 4 Fluted Tapered Legs with Brass Tips */}
    {[
      [-length / 2 + 0.16, -0.3],
      [length / 2 - 0.16, -0.3],
      [-length / 2 + 0.16, 0.3],
      [length / 2 - 0.16, 0.3],
    ].map(([lx, lz], idx) => (
      <group key={idx} position={[lx, 0, lz]}>
        <mesh position={[0, 0.19, 0]} castShadow>
          <cylinderGeometry args={[0.048, 0.03, 0.36, 10]} />
          <meshStandardMaterial color="#4a2c1b" roughness={0.48} />
        </mesh>
        <mesh position={[0, 0.03, 0]}>
          <cylinderGeometry args={[0.032, 0.028, 0.06, 10]} />
          <meshStandardMaterial color="#cfa857" metalness={0.88} roughness={0.22} />
        </mesh>
      </group>
    ))}
  </group>
);

/**
 * میز دکوراتیو فرانسوی با رویه سنگ مرمر و گلدان تزئینی
 */
export const DecorativeConsoleTable: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  contactTex: THREE.Texture;
}> = ({ position, rotationY = 0, contactTex }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.014, 0]}>
      <planeGeometry args={[1.95, 1.1]} />
      <meshBasicMaterial map={contactTex} transparent depthWrite={false} />
    </mesh>

    {/* Marble Top Slab */}
    <mesh position={[0, 0.86, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.55, 0.07, 0.62]} />
      <meshPhysicalMaterial color="#f2ece1" roughness={0.2} clearcoat={0.5} />
    </mesh>
    {/* Carved Gilded Apron */}
    <mesh position={[0, 0.78, 0]}>
      <boxGeometry args={[1.44, 0.11, 0.54]} />
      <meshStandardMaterial color="#c8a14f" metalness={0.84} roughness={0.26} />
    </mesh>

    {/* 4 Fluted Gilded Legs */}
    {[
      [-0.64, -0.22],
      [0.64, -0.22],
      [-0.64, 0.22],
      [0.64, 0.22],
    ].map(([lx, lz], i) => (
      <mesh key={i} position={[lx, 0.38, lz]} castShadow>
        <cylinderGeometry args={[0.042, 0.026, 0.76, 10]} />
        <meshStandardMaterial color="#c59d4b" metalness={0.82} roughness={0.28} />
      </mesh>
    ))}

    {/* Tabletop Porcelain Centerpiece & Brass Candlesticks */}
    <mesh position={[0, 1.07, 0]} castShadow>
      <cylinderGeometry args={[0.11, 0.08, 0.34, 14]} />
      <meshPhysicalMaterial color="#274764" roughness={0.14} clearcoat={0.9} />
    </mesh>
    {[-0.45, 0.45].map((cx, i) => (
      <group key={i} position={[cx, 0.9, 0]}>
        <mesh position={[0, 0.1, 0]}>
          <cylinderGeometry args={[0.025, 0.055, 0.2, 10]} />
          <meshStandardMaterial color="#d2ac59" metalness={0.88} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.1, 8]} />
          <meshStandardMaterial color="#f8f0df" roughness={0.7} />
        </mesh>
      </group>
    ))}
  </group>
);

/**
 * بازدیدکننده ظریف و آرام موزه در فاصله دور برای زنده کردن فضا بدون ایجاد شلوغی
 */
export const AmbientVisitorNPC: React.FC<{
  waypoints: [number, number, number][];
  coatColor: string;
  speed?: number;
  phaseOffset?: number;
}> = ({ waypoints, coatColor, speed = 0.65, phaseOffset = 0 }) => {
  const groupRef = useRef<THREE.Group>(null);
  const leftLegRef = useRef<THREE.Mesh>(null);
  const rightLegRef = useRef<THREE.Mesh>(null);

  const segmentLengths = useMemo(() => {
    const lens: number[] = [];
    for (let i = 0; i < waypoints.length; i++) {
      const a = waypoints[i];
      const b = waypoints[(i + 1) % waypoints.length];
      lens.push(Math.hypot(b[0] - a[0], b[2] - a[2]));
    }
    return lens;
  }, [waypoints]);

  const totalLen = useMemo(() => segmentLengths.reduce((acc, v) => acc + v, 0), [segmentLengths]);

  useFrame(({ clock }) => {
    if (!groupRef.current || waypoints.length < 2 || totalLen < 0.1) return;
    const t = clock.getElapsedTime();
    // Smooth periodic pause at exhibit stops + calm stroll
    const cycle = (t * speed + phaseOffset) % totalLen;
    let accum = 0;
    let segIdx = 0;
    let localDist = cycle;
    for (let i = 0; i < segmentLengths.length; i++) {
      if (accum + segmentLengths[i] >= cycle) {
        segIdx = i;
        localDist = cycle - accum;
        break;
      }
      accum += segmentLengths[i];
    }

    const a = waypoints[segIdx];
    const b = waypoints[(segIdx + 1) % waypoints.length];
    const segLen = Math.max(0.01, segmentLengths[segIdx]);
    const rawU = localDist / segLen;
    // Gentle linger at each waypoint
    const u = THREE.MathUtils.smoothstep(rawU, 0.08, 0.92);

    const px = THREE.MathUtils.lerp(a[0], b[0], u);
    const pz = THREE.MathUtils.lerp(a[2], b[2], u);
    const isMoving = rawU > 0.08 && rawU < 0.92;

    groupRef.current.position.set(px, 0, pz);
    const dirX = b[0] - a[0];
    const dirZ = b[2] - a[2];
    if (Math.hypot(dirX, dirZ) > 0.01) {
      groupRef.current.rotation.y = Math.atan2(dirX, dirZ);
    }

    const stride = isMoving ? Math.sin(t * 4.2 + phaseOffset) * 0.22 : 0;
    if (leftLegRef.current) leftLegRef.current.rotation.x = stride;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -stride;
  });

  return (
    <group ref={groupRef}>
      {/* Legs */}
      <mesh ref={leftLegRef} position={[-0.085, 0.42, 0]} castShadow>
        <capsuleGeometry args={[0.055, 0.62, 6, 8]} />
        <meshStandardMaterial color="#24232c" roughness={0.78} />
      </mesh>
      <mesh ref={rightLegRef} position={[0.085, 0.42, 0]} castShadow>
        <capsuleGeometry args={[0.055, 0.62, 6, 8]} />
        <meshStandardMaterial color="#24232c" roughness={0.78} />
      </mesh>
      {/* Tailored Museum Coat */}
      <mesh position={[0, 1.06, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.23, 0.84, 12]} />
        <meshStandardMaterial color={coatColor} roughness={0.82} />
      </mesh>
      {/* Shoulders & Subtle Head */}
      <mesh position={[0, 1.48, 0]}>
        <sphereGeometry args={[0.16, 10, 10]} />
        <meshStandardMaterial color={coatColor} roughness={0.82} />
      </mesh>
      <mesh position={[0, 1.69, 0]} castShadow>
        <sphereGeometry args={[0.105, 12, 12]} />
        <meshStandardMaterial color="#e7cbb7" roughness={0.62} />
      </mesh>
      <mesh position={[0, 1.74, -0.02]}>
        <sphereGeometry args={[0.108, 10, 10]} />
        <meshStandardMaterial color="#362821" roughness={0.85} />
      </mesh>
    </group>
  );
};

/**
 * قاب سهبعدی کلاسیک موزه پاریسی با عمق واقعی، حکاکی گوشه، پاسپارتو و چراغ برنجی (کاملاً بدون متن)
 */
export const OrnatePhotoFrame3D: React.FC<{
  slot: PhotoSlot;
  active: boolean;
  onSelect: (slot: PhotoSlot) => void;
  suppressClickUntilRef: React.MutableRefObject<number>;
}> = ({ slot, active, onSelect, suppressClickUntilRef }) => {
  const { gl } = useThree();
  const [texture, setTexture] = useState<THREE.Texture | null>(null);
  const [aspect, setAspect] = useState(4 / 3);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const loader = new THREE.TextureLoader();
    loader.load(
      slot.src,
      (loaded) => {
        if (cancelled) {
          loaded.dispose();
          return;
        }
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.minFilter = THREE.LinearMipmapLinearFilter;
        loaded.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
        const img = loaded.image as { width?: number; height?: number } | undefined;
        if (img?.width && img?.height) {
          setAspect(img.width / img.height);
        }
        setTexture(loaded);
      },
      undefined,
      () => {
        // Ignore broken image gracefully without exposing filenames
      }
    );
    return () => {
      cancelled = true;
    };
  }, [slot.src, gl]);

  useEffect(() => {
    return () => {
      if (texture) texture.dispose();
    };
  }, [texture]);

  // Preserve exact natural photo aspect ratio without cropping
  const maxSpan = slot.baseSize;
  const artW = aspect >= 1 ? maxSpan : maxSpan * aspect;
  const artH = aspect >= 1 ? maxSpan / aspect : maxSpan;
  const matPad = slot.style === 'empire_ebony' ? 0.12 : 0.18;
  const borderW = slot.style === 'ornate_salon' ? 0.17 : slot.style === 'classic_gold' ? 0.14 : 0.11;

  const totalW = artW + matPad * 2 + borderW * 2;
  const totalH = artH + matPad * 2 + borderW * 2;

  const frameColor =
    slot.style === 'classic_gold'
      ? '#cfa753'
      : slot.style === 'ornate_salon'
        ? '#d9b563'
        : slot.style === 'walnut_gilt'
          ? '#523421'
          : '#25211f';
  const frameMetal = slot.style === 'classic_gold' || slot.style === 'ornate_salon' ? 0.86 : 0.18;
  const frameRough = slot.style === 'classic_gold' || slot.style === 'ornate_salon' ? 0.24 : 0.46;

  return (
    <group
      position={slot.position}
      rotation={[0, slot.rotationY, 0]}
      onClick={(e) => {
        e.stopPropagation();
        if (performance.now() < suppressClickUntilRef.current) return;
        audioEngine.playSfx('sparkle');
        onSelect(slot);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        if (!document.pointerLockElement) {
          document.body.style.cursor = 'pointer';
        }
      }}
      onPointerOut={() => {
        setHovered(false);
        document.body.style.cursor = 'default';
      }}
    >
      {/* Dynamic spotlight ONLY mounted when hovered or selected to keep GPU light count optimal */}
      {(active || hovered) && (
        <pointLight
          position={[0, totalH * 0.65, 1.05]}
          color="#ffe6ba"
          intensity={active ? 2.8 : 1.9}
          distance={6.0}
        />
      )}

      {/* Soft Wall Drop-Shadow Backing Plane (depth separation off gallery wall) */}
      <mesh position={[0, -0.04, 0.006]}>
        <planeGeometry args={[totalW + 0.14, totalH + 0.14]} />
        <meshBasicMaterial color="#0b0807" transparent opacity={0.28} depthWrite={false} />
      </mesh>

      {/* Overhead Brass Museum Picture Lamp */}
      <group position={[0, totalH * 0.5 + 0.24, 0.2]}>
        <mesh position={[0, 0, -0.11]}>
          <boxGeometry args={[0.09, 0.07, 0.26]} />
          <meshStandardMaterial color="#cfa753" metalness={0.86} roughness={0.22} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.04, 0.04, Math.min(1.05, totalW * 0.52), 12]} />
          <meshStandardMaterial
            color="#cfa753"
            emissive="#ffe29a"
            emissiveIntensity={active || hovered ? 1.1 : 0.55}
            metalness={0.84}
            roughness={0.22}
          />
        </mesh>
      </group>

      {/* Outer Stepped Sculpted Molding Depth */}
      <mesh position={[0, 0, 0.055]} castShadow>
        <boxGeometry args={[totalW, totalH, 0.11]} />
        <meshStandardMaterial color={frameColor} metalness={frameMetal} roughness={frameRough} />
      </mesh>

      {/* Secondary Recessed Stepped Bevel Frame */}
      <mesh position={[0, 0, 0.105]}>
        <boxGeometry args={[totalW - borderW * 0.72, totalH - borderW * 0.72, 0.04]} />
        <meshStandardMaterial color="#cfa753" metalness={0.88} roughness={0.2} />
      </mesh>

      {/* Carved Corner Acanthus Rosettes on Salon & Classic Gold Frames */}
      {(slot.style === 'ornate_salon' || slot.style === 'classic_gold') &&
        [
          [-totalW * 0.455, totalH * 0.455],
          [totalW * 0.455, totalH * 0.455],
          [-totalW * 0.455, -totalH * 0.455],
          [totalW * 0.455, -totalH * 0.455],
        ].map(([cx, cy], idx) => (
          <mesh key={idx} position={[cx, cy, 0.118]}>
            <sphereGeometry args={[0.075, 10, 10]} />
            <meshStandardMaterial color="#e0bf6f" metalness={0.9} roughness={0.18} />
          </mesh>
        ))}

      {/* Inner Gold Fillet Liner */}
      <mesh position={[0, 0, 0.118]}>
        <boxGeometry args={[artW + matPad * 2 + 0.05, artH + matPad * 2 + 0.05, 0.018]} />
        <meshStandardMaterial color="#d4af5e" metalness={0.88} roughness={0.22} />
      </mesh>

      {/* Warm Museum Linen Passe-Partout Mat */}
      <mesh position={[0, 0, 0.128]}>
        <boxGeometry args={[artW + matPad * 2, artH + matPad * 2, 0.016]} />
        <meshStandardMaterial color="#f5ede1" roughness={0.86} />
      </mesh>

      {/* User Artwork Surface (Unmodified, Zero Text Metadata) */}
      <mesh position={[0, 0, 0.141]}>
        <planeGeometry args={[artW, artH]} />
        {texture ? (
          <meshBasicMaterial map={texture} toneMapped={false} />
        ) : (
          <meshStandardMaterial color="#382d2a" roughness={0.7} />
        )}
      </mesh>
    </group>
  );
};

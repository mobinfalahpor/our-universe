import React, { useEffect, useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { createFrenchVelvetTexture } from './museumTextures';

// Shared reusable geometries for repeated Corinthian columns & urns (performance-friendly)
function buildCorinthianBaseGeo(): THREE.LatheGeometry {
  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.41, 0.0),
    new THREE.Vector2(0.41, 0.07),
    new THREE.Vector2(0.36, 0.11),
    new THREE.Vector2(0.39, 0.16),
    new THREE.Vector2(0.33, 0.22),
    new THREE.Vector2(0.36, 0.27),
    new THREE.Vector2(0.29, 0.32),
    new THREE.Vector2(0.0, 0.32),
  ];
  return new THREE.LatheGeometry(pts, 20);
}

function buildCorinthianCapitalGeo(): THREE.LatheGeometry {
  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.27, 0.0),
    new THREE.Vector2(0.31, 0.08),
    new THREE.Vector2(0.29, 0.18),
    new THREE.Vector2(0.36, 0.34),
    new THREE.Vector2(0.43, 0.48),
    new THREE.Vector2(0.45, 0.56),
    new THREE.Vector2(0.0, 0.56),
  ];
  return new THREE.LatheGeometry(pts, 20);
}

function buildMediciUrnGeo(): THREE.LatheGeometry {
  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.24, 0.0),
    new THREE.Vector2(0.24, 0.06),
    new THREE.Vector2(0.11, 0.14),
    new THREE.Vector2(0.09, 0.28),
    new THREE.Vector2(0.22, 0.38),
    new THREE.Vector2(0.32, 0.54),
    new THREE.Vector2(0.29, 0.78),
    new THREE.Vector2(0.38, 0.90),
    new THREE.Vector2(0.34, 0.93),
    new THREE.Vector2(0.24, 0.84),
    new THREE.Vector2(0.0, 0.72),
  ];
  return new THREE.LatheGeometry(pts, 22);
}

function buildDrapedRobeGeo(): THREE.LatheGeometry {
  const pts = [
    new THREE.Vector2(0.0, 0.0),
    new THREE.Vector2(0.34, 0.0),
    new THREE.Vector2(0.31, 0.18),
    new THREE.Vector2(0.26, 0.48),
    new THREE.Vector2(0.22, 0.86),
    new THREE.Vector2(0.24, 1.08),
    new THREE.Vector2(0.18, 1.24),
    new THREE.Vector2(0.0, 1.24),
  ];
  return new THREE.LatheGeometry(pts, 18);
}

function buildWingGeo(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.quadraticCurveTo(0.38, 0.24, 0.58, 0.72);
  shape.quadraticCurveTo(0.42, 0.78, 0.22, 0.54);
  shape.quadraticCurveTo(0.14, 0.28, 0, 0.16);
  shape.closePath();
  return new THREE.ExtrudeGeometry(shape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.015,
    bevelSize: 0.015,
    bevelSegments: 2,
  });
}

function buildUrnHandleGeo(): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.27, 0.48, 0),
    new THREE.Vector3(0.43, 0.56, 0),
    new THREE.Vector3(0.44, 0.76, 0),
    new THREE.Vector3(0.31, 0.82, 0),
  ]);
  return new THREE.TubeGeometry(curve, 14, 0.028, 8, false);
}

/**
 * ستون بلند کلاسیک با سرستون کرینتیان و گچ‌بری طلایی
 */
export const CorinthianColumn3D: React.FC<{
  position: [number, number, number];
  height?: number;
}> = ({ position, height = 7.6 }) => {
  const { baseGeo, capGeo } = useMemo(
    () => ({
      baseGeo: buildCorinthianBaseGeo(),
      capGeo: buildCorinthianCapitalGeo(),
    }),
    []
  );

  useEffect(() => {
    return () => {
      baseGeo.dispose();
      capGeo.dispose();
    };
  }, [baseGeo, capGeo]);

  const plinthH = 0.44;
  const baseH = 0.32;
  const capH = 0.56;
  const abacusH = 0.16;
  const shaftH = Math.max(2, height - plinthH - baseH - capH - abacusH);
  const shaftY = plinthH + baseH + shaftH / 2;
  const capY = plinthH + baseH + shaftH;

  return (
    <group position={position}>
      {/* Square Attic Plinth */}
      <mesh position={[0, plinthH / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.88, plinthH, 0.88]} />
        <meshStandardMaterial color="#d8cebe" roughness={0.62} />
      </mesh>
      <mesh position={[0, plinthH + 0.02, 0]}>
        <boxGeometry args={[0.82, 0.05, 0.82]} />
        <meshStandardMaterial color="#c49f52" metalness={0.78} roughness={0.28} />
      </mesh>

      {/* Lathe Attic Torus/Scotia Base */}
      <mesh geometry={baseGeo} position={[0, plinthH, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#e6ddd0" roughness={0.48} />
      </mesh>

      {/* Tall Fluted Limestone/Marble Shaft */}
      <mesh position={[0, shaftY, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.255, 0.295, shaftH, 18]} />
        <meshStandardMaterial color="#ece5d8" roughness={0.42} metalness={0.04} />
      </mesh>

      {/* Subtle Gilt Neck Astragal Collar */}
      <mesh position={[0, capY - 0.04, 0]}>
        <torusGeometry args={[0.27, 0.025, 8, 20]} />
        <meshStandardMaterial color="#c9a252" metalness={0.85} roughness={0.24} />
      </mesh>

      {/* Corinthian Bell Capital */}
      <mesh geometry={capGeo} position={[0, capY, 0]} castShadow>
        <meshStandardMaterial color="#e5dccb" roughness={0.48} />
      </mesh>

      {/* 8 Carved Gilded Acanthus Leaf Scrolls */}
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh
            key={i}
            position={[Math.cos(a) * 0.31, capY + 0.31, Math.sin(a) * 0.31]}
            rotation={[0.32, -a, 0]}
          >
            <boxGeometry args={[0.1, 0.24, 0.08]} />
            <meshStandardMaterial color="#cda657" metalness={0.75} roughness={0.3} />
          </mesh>
        );
      })}

      {/* Stepped Corinthian Abacus */}
      <mesh position={[0, capY + capH + abacusH / 2, 0]}>
        <boxGeometry args={[0.92, abacusH, 0.92]} />
        <meshStandardMaterial color="#dfd6c7" roughness={0.55} />
      </mesh>
    </group>
  );
};

/**
 * مجسمه تمام‌قد مرمرین یا برنزی روی پایه سنگی کلاسیک
 */
export const ClassicalStatue3D: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  variant: 'winged_muse' | 'apollo' | 'draped_venus';
  finish?: 'marble' | 'bronze';
}> = ({ position, rotationY = 0, variant, finish = 'marble' }) => {
  const { robeGeo, wingGeo } = useMemo(
    () => ({
      robeGeo: buildDrapedRobeGeo(),
      wingGeo: buildWingGeo(),
    }),
    []
  );

  useEffect(() => {
    return () => {
      robeGeo.dispose();
      wingGeo.dispose();
    };
  }, [robeGeo, wingGeo]);

  const statueColor = finish === 'bronze' ? '#4a3d30' : '#f1ebe2';
  const statueMetal = finish === 'bronze' ? 0.82 : 0.04;
  const statueRough = finish === 'bronze' ? 0.34 : 0.28;
  const pedH = variant === 'winged_muse' ? 1.25 : 1.15;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Tiered Classical Stone Pedestal */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.18, 0.2, 1.18]} />
        <meshStandardMaterial color="#cfc5b4" roughness={0.55} />
      </mesh>
      <mesh position={[0, pedH / 2 + 0.08, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.88, pedH - 0.16, 0.88]} />
        <meshStandardMaterial color="#dfd7c8" roughness={0.48} />
      </mesh>
      {/* Brass Museum Plaque Detail (no text) */}
      <mesh position={[0, pedH * 0.55, 0.445]}>
        <boxGeometry args={[0.34, 0.14, 0.015]} />
        <meshStandardMaterial color="#c8a252" metalness={0.86} roughness={0.24} />
      </mesh>
      <mesh position={[0, pedH + 0.05, 0]} castShadow>
        <boxGeometry args={[1.04, 0.12, 1.04]} />
        <meshStandardMaterial color="#d4cab9" roughness={0.52} />
      </mesh>

      {/* Full-Figure Sculpted Statue */}
      <group position={[0, pedH + 0.11, 0]}>
        {/* Sculpted Draped Lower Garment */}
        <mesh geometry={robeGeo} castShadow>
          <meshPhysicalMaterial
            color={statueColor}
            metalness={statueMetal}
            roughness={statueRough}
            clearcoat={finish === 'marble' ? 0.38 : 0.2}
            clearcoatRoughness={0.35}
          />
        </mesh>

        {/* Upper Torso & Draped Toga Sash */}
        <mesh position={[0, 1.38, 0]} castShadow>
          <cylinderGeometry args={[0.21, 0.17, 0.42, 14]} />
          <meshPhysicalMaterial
            color={statueColor}
            metalness={statueMetal}
            roughness={statueRough}
            clearcoat={0.35}
          />
        </mesh>
        <mesh position={[0.02, 1.38, 0.03]} rotation={[0.45, 0.2, -0.55]}>
          <torusGeometry args={[0.19, 0.045, 8, 18]} />
          <meshPhysicalMaterial color={statueColor} metalness={statueMetal} roughness={statueRough} />
        </mesh>

        {/* Classical Head & Curled Coiffure */}
        <mesh position={[0, 1.78, 0.02]} castShadow>
          <sphereGeometry args={[0.145, 16, 16]} />
          <meshPhysicalMaterial color={statueColor} metalness={statueMetal} roughness={statueRough} clearcoat={0.35} />
        </mesh>
        <mesh position={[0, 1.86, -0.02]}>
          <sphereGeometry args={[0.145, 12, 12]} />
          <meshPhysicalMaterial color={statueColor} metalness={statueMetal} roughness={statueRough + 0.1} />
        </mesh>

        {/* Raised & Poised Classical Arms */}
        <mesh
          position={[0.25, 1.54, 0.1]}
          rotation={[variant === 'apollo' ? -0.9 : -0.45, 0, -0.55]}
          castShadow
        >
          <cylinderGeometry args={[0.048, 0.055, 0.52, 10]} />
          <meshPhysicalMaterial color={statueColor} metalness={statueMetal} roughness={statueRough} />
        </mesh>
        <mesh position={[-0.24, 1.36, 0.06]} rotation={[0.28, 0, 0.38]} castShadow>
          <cylinderGeometry args={[0.048, 0.055, 0.48, 10]} />
          <meshPhysicalMaterial color={statueColor} metalness={statueMetal} roughness={statueRough} />
        </mesh>

        {/* Winged Muse Feathered Wings or Apollo Golden Lyre */}
        {variant === 'winged_muse' && (
          <>
            <mesh geometry={wingGeo} position={[0.12, 1.48, -0.14]} rotation={[0.12, -0.42, 0.15]} castShadow>
              <meshPhysicalMaterial color={statueColor} metalness={statueMetal} roughness={statueRough} />
            </mesh>
            <mesh
              geometry={wingGeo}
              position={[-0.12, 1.48, -0.14]}
              rotation={[0.12, Math.PI + 0.42, 0.15]}
              castShadow
            >
              <meshPhysicalMaterial color={statueColor} metalness={statueMetal} roughness={statueRough} />
            </mesh>
          </>
        )}

        {variant === 'apollo' && (
          <mesh position={[-0.3, 1.42, 0.18]} rotation={[0.1, 0.4, 0.2]}>
            <torusGeometry args={[0.14, 0.02, 8, 18, Math.PI * 1.4]} />
            <meshStandardMaterial color="#cda657" metalness={0.88} roughness={0.22} />
          </mesh>
        )}
      </group>
    </group>
  );
};

/**
 * نیم‌تنه سنگی کلاسیک روی ستون پایه تزئینی
 */
export const ClassicalBust3D: React.FC<{
  position: [number, number, number];
  rotationY?: number;
}> = ({ position, rotationY = 0 }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    {/* Fluted Stone Pedestal */}
    <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
      <boxGeometry args={[0.64, 0.16, 0.64]} />
      <meshStandardMaterial color="#cfc5b5" roughness={0.55} />
    </mesh>
    <mesh position={[0, 0.66, 0]} castShadow receiveShadow>
      <cylinderGeometry args={[0.21, 0.24, 1.0, 14]} />
      <meshStandardMaterial color="#e0d8ca" roughness={0.48} />
    </mesh>
    <mesh position={[0, 1.2, 0]} castShadow>
      <boxGeometry args={[0.56, 0.1, 0.56]} />
      <meshStandardMaterial color="#d2c7b6" roughness={0.52} />
    </mesh>

    {/* Marble Socle + Draped Chest + Head */}
    <group position={[0, 1.25, 0]}>
      <mesh position={[0, 0.06, 0]}>
        <cylinderGeometry args={[0.12, 0.15, 0.12, 14]} />
        <meshPhysicalMaterial color="#f2ece2" roughness={0.28} clearcoat={0.35} />
      </mesh>
      <mesh position={[0, 0.24, 0]} scale={[1.25, 0.85, 0.68]} castShadow>
        <sphereGeometry args={[0.21, 16, 14]} />
        <meshPhysicalMaterial color="#f2ece2" roughness={0.28} clearcoat={0.35} />
      </mesh>
      <mesh position={[0, 0.42, 0]}>
        <cylinderGeometry args={[0.072, 0.085, 0.15, 12]} />
        <meshPhysicalMaterial color="#f2ece2" roughness={0.28} clearcoat={0.35} />
      </mesh>
      <mesh position={[0, 0.58, 0.015]} castShadow>
        <sphereGeometry args={[0.135, 16, 16]} />
        <meshPhysicalMaterial color="#f2ece2" roughness={0.26} clearcoat={0.4} />
      </mesh>
      <mesh position={[0, 0.64, -0.02]}>
        <sphereGeometry args={[0.135, 12, 12]} />
        <meshPhysicalMaterial color="#ebe4d7" roughness={0.42} />
      </mesh>
    </group>
  </group>
);

/**
 * گلدان / کوزه بزرگ کلاسیک مدیچی (Medici Urn)
 */
export const ClassicalVase3D: React.FC<{
  position: [number, number, number];
  rotationY?: number;
}> = ({ position, rotationY = 0 }) => {
  const { urnGeo, handleGeo } = useMemo(
    () => ({
      urnGeo: buildMediciUrnGeo(),
      handleGeo: buildUrnHandleGeo(),
    }),
    []
  );

  useEffect(() => {
    return () => {
      urnGeo.dispose();
      handleGeo.dispose();
    };
  }, [urnGeo, handleGeo]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <mesh position={[0, 0.34, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.72, 0.68, 0.72]} />
        <meshStandardMaterial color="#d8cebe" roughness={0.54} />
      </mesh>
      <mesh position={[0, 0.71, 0]}>
        <boxGeometry args={[0.78, 0.08, 0.78]} />
        <meshStandardMaterial color="#c9a354" metalness={0.78} roughness={0.28} />
      </mesh>

      <group position={[0, 0.75, 0]}>
        <mesh geometry={urnGeo} castShadow>
          <meshPhysicalMaterial color="#ede5d8" roughness={0.3} clearcoat={0.35} />
        </mesh>
        <mesh geometry={handleGeo} castShadow>
          <meshStandardMaterial color="#c8a252" metalness={0.82} roughness={0.25} />
        </mesh>
        <mesh geometry={handleGeo} rotation={[0, Math.PI, 0]} castShadow>
          <meshStandardMaterial color="#c8a252" metalness={0.82} roughness={0.25} />
        </mesh>
      </group>
    </group>
  );
};

/**
 * نیمکت چوبی آنتیک با روکش مخمل فرانسوی
 */
export const MuseumBench3D: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  velvetHex?: string;
}> = ({ position, rotationY = 0, velvetHex = '#5f1d28' }) => {
  const velvetTex = useMemo(() => createFrenchVelvetTexture(velvetHex), [velvetHex]);

  useEffect(() => {
    return () => {
      velvetTex.dispose();
    };
  }, [velvetTex]);

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Carved Walnut Frame & Legs */}
      {[
        [-0.86, -0.24],
        [0.86, -0.24],
        [-0.86, 0.24],
        [0.86, 0.24],
      ].map(([lx, lz], idx) => (
        <group key={idx} position={[lx, 0, lz]}>
          <mesh position={[0, 0.21, 0]} castShadow>
            <cylinderGeometry args={[0.042, 0.028, 0.42, 10]} />
            <meshStandardMaterial color="#3d2415" roughness={0.48} />
          </mesh>
          <mesh position={[0, 0.025, 0]}>
            <cylinderGeometry args={[0.032, 0.034, 0.05, 10]} />
            <meshStandardMaterial color="#cfa857" metalness={0.85} roughness={0.22} />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.16, 0]}>
        <boxGeometry args={[1.68, 0.04, 0.06]} />
        <meshStandardMaterial color="#3d2415" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.39, 0]} castShadow>
        <boxGeometry args={[2.04, 0.1, 0.68]} />
        <meshStandardMaterial color="#452817" roughness={0.45} />
      </mesh>
      {/* Gilt Nailhead Trim */}
      <mesh position={[0, 0.41, 0]}>
        <boxGeometry args={[2.06, 0.025, 0.7]} />
        <meshStandardMaterial color="#c9a352" metalness={0.8} roughness={0.28} />
      </mesh>
      {/* Plush Tufted Velvet Seat Cushion */}
      <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.98, 0.11, 0.64]} />
        <meshStandardMaterial map={velvetTex} roughness={0.86} />
      </mesh>
    </group>
  );
};

/**
 * میز کنسول دکوراتیو فرانسوی با رویه مرمر و گلدان برنزی
 */
export const ConsoleTable3D: React.FC<{
  position: [number, number, number];
  rotationY?: number;
}> = ({ position, rotationY = 0 }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    {[
      [-0.64, -0.22],
      [0.64, -0.22],
      [-0.64, 0.22],
      [0.64, 0.22],
    ].map(([lx, lz], idx) => (
      <mesh key={idx} position={[lx, 0.42, lz]} castShadow>
        <cylinderGeometry args={[0.038, 0.024, 0.84, 10]} />
        <meshStandardMaterial color="#3d2314" roughness={0.45} />
      </mesh>
    ))}
    <mesh position={[0, 0.78, 0]} castShadow>
      <boxGeometry args={[1.44, 0.1, 0.56]} />
      <meshStandardMaterial color="#c9a354" metalness={0.82} roughness={0.28} />
    </mesh>
    {/* Marble Slab Top */}
    <mesh position={[0, 0.855, 0]} castShadow receiveShadow>
      <boxGeometry args={[1.52, 0.055, 0.62]} />
      <meshPhysicalMaterial color="#efe7da" roughness={0.22} clearcoat={0.5} />
    </mesh>
    {/* Small Bronze Table Vase */}
    <mesh position={[0, 1.04, 0]} castShadow>
      <cylinderGeometry args={[0.09, 0.06, 0.3, 14]} />
      <meshStandardMaterial color="#b99043" metalness={0.86} roughness={0.24} />
    </mesh>
  </group>
);

/**
 * لوستر کریستالی باشکوه فرانسوی (قرن نوزدهم) با درخشش طبیعی
 */
export const CrystalChandelier3D: React.FC<{
  position: [number, number, number];
  scale?: number;
  lightColor?: string;
  intensity?: number;
}> = ({ position, scale = 1, lightColor = '#ffe5b8', intensity = 2.6 }) => {
  const lightRef = useRef<THREE.PointLight>(null);
  const crystalsRef = useRef<THREE.Group>(null);
  const phase = useMemo(() => (position[0] * 1.3 + position[2] * 0.7) % 6.28, [position]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (lightRef.current) {
      lightRef.current.intensity = intensity * (0.96 + Math.sin(t * 2.1 + phase) * 0.04);
    }
    if (crystalsRef.current) {
      crystalsRef.current.rotation.y = Math.sin(t * 0.35 + phase) * 0.015;
    }
  });

  const arms = [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <group position={position} scale={scale}>
      {/* Ceiling Medallion Rose & Suspension Rod */}
      <mesh position={[0, 1.68, 0]}>
        <cylinderGeometry args={[0.28, 0.14, 0.12, 16]} />
        <meshStandardMaterial color="#c9a354" metalness={0.85} roughness={0.24} />
      </mesh>
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[0.024, 0.024, 1.65, 8]} />
        <meshStandardMaterial color="#c9a354" metalness={0.88} roughness={0.22} />
      </mesh>

      <group ref={crystalsRef}>
        {/* Upper & Lower Gilded Brass Rings */}
        <mesh position={[0, 0.25, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.52, 0.032, 10, 28]} />
          <meshStandardMaterial color="#d2ab58" metalness={0.88} roughness={0.22} />
        </mesh>
        <mesh position={[0, -0.22, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.88, 0.036, 10, 32]} />
          <meshStandardMaterial color="#d2ab58" metalness={0.88} roughness={0.22} />
        </mesh>

        {/* Central Crystal Finial Drop */}
        <mesh position={[0, -0.58, 0]}>
          <octahedronGeometry args={[0.14, 0]} />
          <meshPhysicalMaterial color="#ffffff" roughness={0.04} clearcoat={1} transparent opacity={0.88} />
        </mesh>

        {/* 8 Brass Candle Arms + Crystal Prisms */}
        {arms.map((i) => {
          const a = (i / arms.length) * Math.PI * 2;
          const rOuter = 0.88;
          const ax = Math.cos(a) * rOuter;
          const az = Math.sin(a) * rOuter;
          return (
            <group key={i}>
              <mesh
                position={[ax * 0.52, -0.2, az * 0.52]}
                rotation={[0, -a, Math.PI / 2]}
              >
                <cylinderGeometry args={[0.015, 0.015, rOuter, 6]} />
                <meshStandardMaterial color="#cfa752" metalness={0.86} roughness={0.24} />
              </mesh>
              <mesh position={[ax, -0.06, az]}>
                <cylinderGeometry args={[0.025, 0.025, 0.16, 8]} />
                <meshStandardMaterial color="#fff7e6" roughness={0.45} />
              </mesh>
              <mesh position={[ax, 0.06, az]}>
                <sphereGeometry args={[0.038, 8, 8]} />
                <meshStandardMaterial
                  color="#fff3d2"
                  emissive="#ffcf75"
                  emissiveIntensity={1.9}
                  toneMapped={false}
                />
              </mesh>
              {/* Faceted Crystal Prism */}
              <mesh position={[ax * 0.84, -0.34, az * 0.84]}>
                <octahedronGeometry args={[0.068, 0]} />
                <meshPhysicalMaterial
                  color="#f9fcff"
                  roughness={0.04}
                  clearcoat={1}
                  transparent
                  opacity={0.85}
                />
              </mesh>
            </group>
          );
        })}
      </group>

      <pointLight ref={lightRef} position={[0, -0.15, 0]} color={lightColor} intensity={intensity} distance={15} decay={1.6} />
    </group>
  );
};

/**
 * شمعدان دیواری برنجی و کریستالی کلاسیک
 */
export const WallSconce3D: React.FC<{
  position: [number, number, number];
  rotationY?: number;
  glowColor?: string;
}> = ({ position, rotationY = 0, glowColor = '#ffd58a' }) => (
  <group position={position} rotation={[0, rotationY, 0]}>
    <mesh position={[0, 0, 0.02]}>
      <boxGeometry args={[0.14, 0.34, 0.04]} />
      <meshStandardMaterial color="#c9a252" metalness={0.86} roughness={0.25} />
    </mesh>
    {[-0.1, 0.1].map((ox, idx) => (
      <group key={idx} position={[ox, 0.04, 0.15]}>
        <mesh position={[0, -0.04, -0.06]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.012, 0.012, 0.14, 6]} />
          <meshStandardMaterial color="#c9a252" metalness={0.86} roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.018, 0.018, 0.14, 8]} />
          <meshStandardMaterial color="#faf2e1" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <sphereGeometry args={[0.03, 8, 8]} />
          <meshStandardMaterial
            color="#fff0c8"
            emissive={glowColor}
            emissiveIntensity={1.7}
            toneMapped={false}
          />
        </mesh>
      </group>
    ))}
  </group>
);

/**
 * بازدیدکنندگان باوقار در دوردست تالارها برای جان‌بخشی ظریف به فضای موزه
 */
export const MuseumVisitors3D: React.FC<{ salonExtraDepth: number }> = ({ salonExtraDepth }) => {
  const v1Ref = useRef<THREE.Group>(null);
  const v2Ref = useRef<THREE.Group>(null);
  const v3Ref = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();

    // Visitor 1: slow respectful walk in Sculpture Rotunda perimeter
    if (v1Ref.current) {
      const walkT = t * 0.18;
      const vx = Math.sin(walkT) * 3.1;
      const vz = -26.8 - salonExtraDepth + Math.cos(walkT) * 2.2;
      const nextVx = Math.sin(walkT + 0.05) * 3.1;
      const nextVz = -26.8 - salonExtraDepth + Math.cos(walkT + 0.05) * 2.2;
      v1Ref.current.position.set(vx, Math.abs(Math.sin(t * 2.2)) * 0.014, vz);
      v1Ref.current.rotation.y = Math.atan2(nextVx - vx, nextVz - vz);
    }

    // Visitor 2: contemplating sunlit window & paintings in Orangery
    if (v2Ref.current) {
      v2Ref.current.rotation.y = -Math.PI * 0.65 + Math.sin(t * 0.35) * 0.22;
      v2Ref.current.position.y = Math.sin(t * 1.1) * 0.004;
    }

    // Visitor 3: slow stroll along East flank of Salon Carré
    if (v3Ref.current) {
      const zTravel = -11.5 - salonExtraDepth * 0.4 + Math.sin(t * 0.14) * 3.8;
      const dir = Math.cos(t * 0.14) >= 0 ? 0 : Math.PI;
      v3Ref.current.position.set(4.5, Math.abs(Math.sin(t * 2.0)) * 0.012, zTravel);
      v3Ref.current.rotation.y = dir;
    }
  });

  const renderVisitor = (
    ref: React.RefObject<THREE.Group | null>,
    coatHex: string,
    accentHex: string,
    initPos: [number, number, number]
  ) => (
    <group ref={ref} position={initPos}>
      {/* Long Tailored Wool Coat / Skirt */}
      <mesh position={[0, 0.56, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.24, 1.08, 12]} />
        <meshStandardMaterial color={coatHex} roughness={0.85} />
      </mesh>
      {/* Upper Shoulders & Collar */}
      <mesh position={[0, 1.24, 0]} scale={[1.25, 0.9, 0.72]} castShadow>
        <sphereGeometry args={[0.18, 12, 12]} />
        <meshStandardMaterial color={coatHex} roughness={0.82} />
      </mesh>
      <mesh position={[0, 1.38, 0.01]}>
        <torusGeometry args={[0.09, 0.032, 6, 12]} />
        <meshStandardMaterial color={accentHex} roughness={0.78} />
      </mesh>
      {/* Head & Hair Silhouette */}
      <mesh position={[0, 1.54, 0]} castShadow>
        <sphereGeometry args={[0.105, 12, 12]} />
        <meshStandardMaterial color="#d8bfa9" roughness={0.68} />
      </mesh>
      <mesh position={[0, 1.59, -0.02]}>
        <sphereGeometry args={[0.106, 10, 10]} />
        <meshStandardMaterial color="#2c221e" roughness={0.78} />
      </mesh>
    </group>
  );

  return (
    <group>
      {renderVisitor(v1Ref, '#23273a', '#7c6f64', [0, 0, -24.6 - salonExtraDepth])}
      {renderVisitor(v2Ref, '#3e272f', '#b89f8d', [14.8, 0, -23.6 - salonExtraDepth])}
      {renderVisitor(v3Ref, '#2b2d2a', '#9c8b78', [4.5, 0, -11.5])}
    </group>
  );
};

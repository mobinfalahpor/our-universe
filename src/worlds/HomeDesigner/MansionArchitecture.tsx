import React, { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Stars } from '@react-three/drei';
import * as THREE from 'three';
import {
  getAinehKariTexture,
  getCourtyardStoneTexture,
  getGachboriStuccoTexture,
  getOrosiStainedGlassTexture,
  getPersianBrickWallTexture,
  getTurquoiseMosaicTexture,
  getWaterRippleBumpTexture,
} from '../../systems/persianMansionTextures';
import { createWoodTexture } from '../../systems/proceduralTextures';
import { COURTYARD_GARDEN_BEDS } from './mansionCatalog';
import type { FloorMaterialId, HomeTimeMode, SeasonType } from '../../core/types';

interface MansionArchitectureProps {
  timeMode: HomeTimeMode;
  season: SeasonType;
  wallColor: string;
  floorMaterial: FloorMaterialId;
  lightWarmth: number;
  cutawayMode: boolean;
}

// =====================================================================
// Central Turquoise Pool + Animated Water + Fountain + Swimming Goldfish
// =====================================================================
function CentralPersianPool({ isNight }: { isNight: boolean }) {
  const waterMatRef = useRef<THREE.MeshPhysicalMaterial>(null);
  const bumpTex = useMemo(() => getWaterRippleBumpTexture(), []);
  const mosaicTex = useMemo(() => getTurquoiseMosaicTexture(6, 1), []);
  const dropletsRef = useRef<THREE.Group>(null);
  const fishGroupRef = useRef<THREE.Group>(null);

  const fishData = useMemo(
    () => [
      { radiusX: 1.05, radiusZ: 0.65, speed: 0.62, phase: 0.2, color: '#ef5b25', size: 1.0 },
      { radiusX: 0.85, radiusZ: 0.52, speed: -0.54, phase: 1.7, color: '#f58427', size: 0.9 },
      { radiusX: 1.28, radiusZ: 0.78, speed: 0.45, phase: 3.1, color: '#e84323', size: 1.1 },
      { radiusX: 0.72, radiusZ: 0.44, speed: 0.78, phase: 4.5, color: '#f7a638', size: 0.85 },
      { radiusX: 1.15, radiusZ: 0.68, speed: -0.5, phase: 5.4, color: '#f06430', size: 0.95 },
    ],
    []
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    bumpTex.offset.set(t * 0.035, Math.sin(t * 0.4) * 0.025);

    if (dropletsRef.current) {
      const children = dropletsRef.current.children;
      for (let i = 0; i < children.length; i++) {
        const angle = (i / children.length) * Math.PI * 2;
        const phase = (t * 1.45 + i * 0.13) % 1;
        const r = phase * 0.55;
        const y = 0.78 + Math.sin(phase * Math.PI) * 0.45 - phase * 0.52;
        children[i].position.set(Math.cos(angle) * r, y, Math.sin(angle) * r);
        const s = 0.7 + (1 - phase) * 0.5;
        children[i].scale.setScalar(s);
      }
    }

    if (fishGroupRef.current) {
      fishGroupRef.current.children.forEach((fish, idx) => {
        const fd = fishData[idx];
        const angle = t * fd.speed + fd.phase;
        const nx = Math.cos(angle) * fd.radiusX;
        const nz = Math.sin(angle) * fd.radiusZ;
        const dx = -Math.sin(angle) * fd.radiusX * fd.speed;
        const dz = Math.cos(angle) * fd.radiusZ * fd.speed;
        fish.position.set(nx, 0.14 + Math.sin(t * 2 + idx) * 0.02, nz);
        fish.rotation.y = Math.atan2(dx, dz);
        // Subtle tail wiggle
        const tail = fish.children[1];
        if (tail) tail.rotation.y = Math.sin(t * 9 + idx) * 0.35;
      });
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Outer Turquoise Tile Pool Rim */}
      <mesh position={[0, 0.17, -1.42]} castShadow receiveShadow>
        <boxGeometry args={[4.1, 0.34, 0.24]} />
        <meshStandardMaterial map={mosaicTex} roughness={0.3} />
      </mesh>
      <mesh position={[0, 0.17, 1.42]} castShadow receiveShadow>
        <boxGeometry args={[4.1, 0.34, 0.24]} />
        <meshStandardMaterial map={mosaicTex} roughness={0.3} />
      </mesh>
      <mesh position={[-1.93, 0.17, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.24, 0.34, 2.62]} />
        <meshStandardMaterial map={mosaicTex} roughness={0.3} />
      </mesh>
      <mesh position={[1.93, 0.17, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.24, 0.34, 2.62]} />
        <meshStandardMaterial map={mosaicTex} roughness={0.3} />
      </mesh>

      {/* Travertine Stone Coping Cap */}
      <mesh position={[0, 0.355, -1.42]} receiveShadow>
        <boxGeometry args={[4.2, 0.05, 0.29]} />
        <meshStandardMaterial color="#e5d7be" roughness={0.62} />
      </mesh>
      <mesh position={[0, 0.355, 1.42]} receiveShadow>
        <boxGeometry args={[4.2, 0.05, 0.29]} />
        <meshStandardMaterial color="#e5d7be" roughness={0.62} />
      </mesh>
      <mesh position={[-1.93, 0.355, 0]} receiveShadow>
        <boxGeometry args={[0.29, 0.05, 2.62]} />
        <meshStandardMaterial color="#e5d7be" roughness={0.62} />
      </mesh>
      <mesh position={[1.93, 0.355, 0]} receiveShadow>
        <boxGeometry args={[0.29, 0.05, 2.62]} />
        <meshStandardMaterial color="#e5d7be" roughness={0.62} />
      </mesh>

      {/* Pool Floor Basin (Deep Turquoise Ceramic) */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.72, 2.68]} />
        <meshStandardMaterial color="#145863" roughness={0.35} />
      </mesh>

      {/* Animated Crystal Water Surface */}
      <mesh position={[0, 0.25, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[3.68, 2.64]} />
        <meshPhysicalMaterial
          ref={waterMatRef}
          color={isNight ? '#1b7a85' : '#2fb7bd'}
          roughness={0.08}
          metalness={0.05}
          transmission={0.42}
          transparent
          opacity={0.78}
          ior={1.33}
          bumpMap={bumpTex}
          bumpScale={0.025}
          clearcoat={0.9}
          clearcoatRoughness={0.08}
        />
      </mesh>

      {/* Central Carved Stone & Turquoise Ceramic Fountain */}
      <group position={[0, 0.02, 0]}>
        <mesh position={[0, 0.18, 0]} castShadow>
          <cylinderGeometry args={[0.24, 0.34, 0.36, 12]} />
          <meshStandardMaterial color="#dfd1b8" roughness={0.65} />
        </mesh>
        <mesh position={[0, 0.42, 0]} castShadow>
          <cylinderGeometry args={[0.52, 0.18, 0.16, 16]} />
          <meshStandardMaterial color="#1f7b83" roughness={0.25} />
        </mesh>
        <mesh position={[0, 0.62, 0]} castShadow>
          <cylinderGeometry args={[0.1, 0.14, 0.32, 12]} />
          <meshStandardMaterial color="#dfd1b8" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.8, 0]}>
          <sphereGeometry args={[0.09, 12, 12]} />
          <meshStandardMaterial color="#d4a84f" metalness={0.75} roughness={0.25} />
        </mesh>
      </group>

      {/* Animated Fountain Water Jets */}
      <group ref={dropletsRef}>
        {Array.from({ length: 14 }).map((_, i) => (
          <mesh key={i}>
            <sphereGeometry args={[0.028, 6, 6]} />
            <meshPhysicalMaterial color="#cff8fc" roughness={0.1} transparent opacity={0.82} />
          </mesh>
        ))}
      </group>

      {/* Swimming Goldfish (ماهی‌های قرمز حوض) */}
      <group ref={fishGroupRef}>
        {fishData.map((fd, idx) => (
          <group key={idx} scale={fd.size}>
            <mesh scale={[0.7, 0.75, 1.45]}>
              <sphereGeometry args={[0.048, 8, 8]} />
              <meshStandardMaterial color={fd.color} roughness={0.3} />
            </mesh>
            <mesh position={[0, 0, -0.08]} rotation={[Math.PI / 2, 0, 0]}>
              <coneGeometry args={[0.036, 0.06, 4]} />
              <meshStandardMaterial color="#ffd0a6" roughness={0.35} />
            </mesh>
          </group>
        ))}
      </group>

      {/* Night Pool Glow */}
      {isNight && (
        <pointLight position={[0, 0.6, 0]} color="#4ad4db" intensity={1.8} distance={7.5} decay={2} />
      )}
    </group>
  );
}

// =====================================================================
// Diverse Botanical Persian Garden Beds (باغچه‌ها و گل‌های متنوع)
// =====================================================================
const FLOWER_PALETTES = [
  { name: 'rose', petal: '#b82841', center: '#f2c85b', height: 0.36, style: 'rosette' },
  { name: 'tulip', petal: '#e0533c', center: '#382419', height: 0.32, style: 'cup' },
  { name: 'lily', petal: '#f5efe6', center: '#e3a63b', height: 0.44, style: 'star' },
  { name: 'lavender', petal: '#7a5ba8', center: '#997bc7', height: 0.38, style: 'spire' },
  { name: 'peony', petal: '#d97b98', center: '#f3d06b', height: 0.35, style: 'rosette' },
  { name: 'marigold', petal: '#eb8d1f', center: '#8c3d0d', height: 0.28, style: 'rosette' },
  { name: 'hydrangea', petal: '#5fa4cc', center: '#dcecf5', height: 0.4, style: 'cluster' },
  { name: 'narcissus', petal: '#f7f1de', center: '#e8a225', height: 0.31, style: 'star' },
  { name: 'geranium', petal: '#cf344a', center: '#f5d9a6', height: 0.33, style: 'cluster' },
  { name: 'violet', petal: '#543e8a', center: '#e6c24c', height: 0.22, style: 'star' },
];

function GardenFlowerClump({
  x,
  y,
  z,
  variantIdx,
  scale,
}: {
  x: number;
  y: number;
  z: number;
  variantIdx: number;
  scale: number;
}) {
  const f = FLOWER_PALETTES[variantIdx % FLOWER_PALETTES.length];
  return (
    <group position={[x, y, z]} scale={scale}>
      {/* Leaf rosette */}
      {[0, 1, 2, 3].map((li) => {
        const a = (li / 4) * Math.PI * 2 + variantIdx * 0.4;
        return (
          <mesh
            key={li}
            position={[Math.cos(a) * 0.08, 0.05, Math.sin(a) * 0.08]}
            rotation={[0.45, a, 0]}
            scale={[0.8, 0.35, 1.35]}
          >
            <sphereGeometry args={[0.075, 6, 6]} />
            <meshStandardMaterial color="#3c6e46" roughness={0.75} />
          </mesh>
        );
      })}
      {/* Stems + Blooms */}
      {[-0.04, 0.04, 0].map((ox, bi) => {
        const oz = bi === 2 ? 0.05 : -0.03;
        const h = f.height * (0.85 + bi * 0.12);
        return (
          <group key={bi} position={[ox, 0, oz]}>
            <mesh position={[0, h * 0.5, 0]}>
              <cylinderGeometry args={[0.008, 0.012, h, 5]} />
              <meshStandardMaterial color="#427345" roughness={0.75} />
            </mesh>
            {f.style === 'spire' ? (
              <mesh position={[0, h, 0]} scale={[0.7, 1.6, 0.7]}>
                <dodecahedronGeometry args={[0.052, 0]} />
                <meshStandardMaterial color={f.petal} roughness={0.45} />
              </mesh>
            ) : f.style === 'cluster' ? (
              <group position={[0, h, 0]}>
                {[0, 1, 2, 3].map((ci) => {
                  const ca = (ci / 4) * Math.PI * 2;
                  return (
                    <mesh key={ci} position={[Math.cos(ca) * 0.03, (ci % 2) * 0.02, Math.sin(ca) * 0.03]}>
                      <sphereGeometry args={[0.032, 6, 6]} />
                      <meshStandardMaterial color={f.petal} roughness={0.42} />
                    </mesh>
                  );
                })}
              </group>
            ) : (
              <group position={[0, h, 0]}>
                <mesh>
                  <sphereGeometry args={[0.032, 7, 7]} />
                  <meshStandardMaterial color={f.center} roughness={0.4} />
                </mesh>
                {[0, 1, 2, 3, 4].map((pi) => {
                  const pa = (pi / 5) * Math.PI * 2;
                  return (
                    <mesh
                      key={pi}
                      position={[Math.cos(pa) * 0.04, 0, Math.sin(pa) * 0.04]}
                      rotation={[f.style === 'cup' ? -0.4 : 0.25, pa, 0]}
                      scale={[0.8, 0.55, 1.1]}
                    >
                      <sphereGeometry args={[0.028, 6, 6]} />
                      <meshStandardMaterial color={f.petal} roughness={0.38} />
                    </mesh>
                  );
                })}
              </group>
            )}
          </group>
        );
      })}
    </group>
  );
}

function PersianGardenBeds({ season }: { season: SeasonType }) {
  const leafTint =
    season === 'autumn' ? '#9e6b3b' : season === 'winter' ? '#4d6357' : '#356642';

  const flowerInstances = useMemo(() => {
    const out: { x: number; z: number; variantIdx: number; scale: number }[] = [];
    COURTYARD_GARDEN_BEDS.forEach((bed, bIdx) => {
      for (let i = 0; i < 12; i++) {
        const cols = 4;
        const row = Math.floor(i / cols);
        const col = i % cols;
        const spanX = bed.maxX - bed.minX - 0.55;
        const spanZ = bed.maxZ - bed.minZ - 0.55;
        const jitterX = Math.sin(i * 17.3 + bIdx * 3.1) * 0.22;
        const jitterZ = Math.cos(i * 13.7 + bIdx * 5.2) * 0.2;
        out.push({
          x: bed.minX + 0.3 + (col / (cols - 1)) * spanX + jitterX,
          z: bed.minZ + 0.3 + (row / 2) * spanZ + jitterZ,
          variantIdx: i + bIdx * 3,
          scale: 0.85 + ((i * 7 + bIdx) % 5) * 0.09,
        });
      }
    });
    return out;
  }, []);

  return (
    <group>
      {COURTYARD_GARDEN_BEDS.map((bed) => {
        const w = bed.maxX - bed.minX;
        const d = bed.maxZ - bed.minZ;
        const cx = (bed.minX + bed.maxX) / 2;
        const cz = (bed.minZ + bed.maxZ) / 2;
        return (
          <group key={bed.id} position={[cx, 0, cz]}>
            {/* Travertine/brick bed border */}
            <mesh position={[0, 0.11, 0]} castShadow receiveShadow>
              <boxGeometry args={[w + 0.22, 0.22, d + 0.22]} />
              <meshStandardMaterial color="#b98a62" roughness={0.78} />
            </mesh>
            {/* Dark rich garden soil */}
            <mesh position={[0, 0.215, 0]} receiveShadow>
              <boxGeometry args={[w, 0.03, d]} />
              <meshStandardMaterial color="#422e21" roughness={0.95} />
            </mesh>
            {/* Low boxwood shrub border */}
            {[
              [-w * 0.42, -d * 0.42],
              [w * 0.42, -d * 0.42],
              [-w * 0.42, d * 0.42],
              [w * 0.42, d * 0.42],
            ].map(([sx, sz], si) => (
              <mesh key={si} position={[sx, 0.34, sz]} castShadow>
                <dodecahedronGeometry args={[0.24, 1]} />
                <meshStandardMaterial color={leafTint} roughness={0.82} />
              </mesh>
            ))}
          </group>
        );
      })}

      {/* Diverse non-repetitive flowers in all 4 باغچه‌ها */}
      {flowerInstances.map((fl, idx) => (
        <GardenFlowerClump
          key={idx}
          x={fl.x}
          y={0.22}
          z={fl.z}
          variantIdx={fl.variantIdx}
          scale={fl.scale}
        />
      ))}

      {/* Climbing Jasmine Vines (یاس رونده) on Courtyard Pillars */}
      {[
        [-7.25, -3.5],
        [-7.25, 2.5],
        [7.25, -3.5],
        [7.25, 2.5],
      ].map(([vx, vz], vi) => (
        <group key={vi} position={[vx, 0, vz]}>
          {[0.4, 0.95, 1.5, 2.05, 2.6].map((vy, step) => (
            <group key={step} position={[Math.sin(step + vi) * 0.08, vy, Math.cos(step) * 0.08]}>
              <mesh>
                <dodecahedronGeometry args={[0.14, 0]} />
                <meshStandardMaterial color="#386b42" roughness={0.8} />
              </mesh>
              <mesh position={[0.08, 0.04, 0.08]}>
                <sphereGeometry args={[0.042, 6, 6]} />
                <meshStandardMaterial color="#f7f1e3" roughness={0.4} />
              </mesh>
            </group>
          ))}
        </group>
      ))}
    </group>
  );
}

// =====================================================================
// Carved Wooden Eyvan Column (ستون چوبی منبت‌کاری ایوان)
// =====================================================================
function EyvanCarvedColumn({ position, woodTex }: { position: [number, number, number]; woodTex: THREE.CanvasTexture }) {
  return (
    <group position={position}>
      {/* Carved Travertine Stone Plinth */}
      <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.22, 0.27, 0.36, 8]} />
        <meshStandardMaterial color="#dfd1b8" roughness={0.62} />
      </mesh>
      {/* Turned Walnut Column Shaft */}
      <mesh position={[0, 2.05, 0]} castShadow>
        <cylinderGeometry args={[0.13, 0.16, 3.38, 16]} />
        <meshStandardMaterial map={woodTex} color="#5e3721" roughness={0.55} />
      </mesh>
      {/* Decorative Brass Collar */}
      <mesh position={[0, 3.66, 0]}>
        <cylinderGeometry args={[0.155, 0.155, 0.08, 14]} />
        <meshStandardMaterial color="#d4a84f" metalness={0.75} roughness={0.28} />
      </mesh>
      {/* Carved Capital Brackets (سرستون) */}
      <mesh position={[0, 3.84, 0]} castShadow>
        <boxGeometry args={[0.68, 0.24, 0.34]} />
        <meshStandardMaterial map={woodTex} color="#4d2c19" roughness={0.55} />
      </mesh>
      <mesh position={[0, 3.98, 0]}>
        <boxGeometry args={[0.88, 0.12, 0.42]} />
        <meshStandardMaterial color="#d4a84f" roughness={0.45} metalness={0.3} />
      </mesh>
    </group>
  );
}

// =====================================================================
// Persian Chandelier (لوستر برنجی و کریستالی تالار)
// =====================================================================
function PersianChandelier({ position, isLit }: { position: [number, number, number]; isLit: boolean }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.72, 8]} />
        <meshStandardMaterial color="#c99b42" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[0.52, 0.032, 8, 28]} />
        <meshStandardMaterial color="#d4a84f" metalness={0.85} roughness={0.22} />
      </mesh>
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2;
        return (
          <group key={i} position={[Math.cos(a) * 0.52, 0.1, Math.sin(a) * 0.52]}>
            <mesh>
              <cylinderGeometry args={[0.045, 0.06, 0.12, 8]} />
              <meshStandardMaterial
                color="#fff3d6"
                emissive={isLit ? '#ffca78' : '#000000'}
                emissiveIntensity={isLit ? 1.5 : 0}
                roughness={0.25}
              />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, -0.14, 0]}>
        <octahedronGeometry args={[0.13, 0]} />
        <meshPhysicalMaterial
          color="#eef6fa"
          roughness={0.08}
          transmission={0.5}
          emissive={isLit ? '#ffe0a3' : '#000000'}
          emissiveIntensity={isLit ? 0.4 : 0}
        />
      </mesh>
      {isLit && <pointLight position={[0, -0.1, 0]} color="#ffd591" intensity={2.6} distance={10} decay={2} />}
    </group>
  );
}

// =====================================================================
// Main Persian Mansion Architecture & Dynamic Day/Sunset/Night Lighting
// =====================================================================
export const MansionArchitecture: React.FC<MansionArchitectureProps> = ({
  timeMode,
  season,
  wallColor,
  floorMaterial,
  lightWarmth,
  cutawayMode,
}) => {
  const stoneTex = useMemo(() => getCourtyardStoneTexture(), []);
  const brickTex = useMemo(() => getPersianBrickWallTexture(), []);
  const mosaicTex = useMemo(() => getTurquoiseMosaicTexture(4, 1), []);
  const orosiTex = useMemo(() => getOrosiStainedGlassTexture(), []);
  const ainehTex = useMemo(() => getAinehKariTexture(), []);
  const gachTex = useMemo(() => getGachboriStuccoTexture(), []);
  const woodTex = useMemo(() => createWoodTexture('#6b4128', '#462815', 3), []);
  const lightWoodTex = useMemo(() => createWoodTexture('#9c714d', '#754e30', 3), []);

  const isNight = timeMode === 'night';
  const isSunset = timeMode === 'sunset';

  const floorTint =
    floorMaterial === 'walnut'
      ? '#663e26'
      : floorMaterial === 'oak'
        ? '#9d7452'
        : floorMaterial === 'marble'
          ? '#eae1d4'
          : '#dfd2be';

  const interiorWallHex = wallColor || '#ebe0ce';

  // Atmospheric Light Config
  const ambientColor = isNight ? '#586aa3' : isSunset ? '#ffd0a6' : '#fff5e4';
  const ambientInt = isNight ? 0.42 : isSunset ? 0.65 : 0.78;
  const sunColor = isNight ? '#96b4ff' : isSunset ? '#ff9f5a' : '#fff2d6';
  const sunPos: [number, number, number] = isNight
    ? [-12, 18, 10]
    : isSunset
      ? [-18, 8.5, 11]
      : [12, 22, 10];
  const sunInt = isNight ? 0.55 : isSunset ? 1.45 : 1.75;

  const isLampLit = isNight || isSunset || lightWarmth > 0.72;

  return (
    <group>
      {/* Atmosphere Lighting Rig */}
      <ambientLight color={ambientColor} intensity={ambientInt} />
      <hemisphereLight
        args={[isNight ? '#354980' : isSunset ? '#ffbf8a' : '#e8f4ff', '#6a5644', isNight ? 0.45 : 0.72]}
      />
      <directionalLight
        position={sunPos}
        color={sunColor}
        intensity={sunInt}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={18}
        shadow-camera-bottom={-18}
        shadow-camera-near={1}
        shadow-camera-far={55}
        shadow-bias={-0.0005}
      />

      {isNight && <Stars radius={70} depth={30} count={1400} factor={3.2} saturation={0.4} fade speed={0.4} />}

      {/* Warm Interior Point Lights */}
      <pointLight
        position={[0, 3.2, -8.1]}
        color="#ffcf8a"
        intensity={isNight ? 2.4 : 1.1}
        distance={9}
        decay={2}
      />
      <pointLight
        position={[10.5, 3.1, -3.2]}
        color="#ffd496"
        intensity={isNight ? 2.0 : 0.9}
        distance={10}
        decay={2}
      />
      <pointLight
        position={[10.5, 3.1, 3.2]}
        color="#ffd496"
        intensity={isNight ? 2.0 : 0.9}
        distance={9}
        decay={2}
      />
      <pointLight
        position={[-10.5, 3.1, -6.5]}
        color="#ffd496"
        intensity={isNight ? 2.0 : 0.9}
        distance={10}
        decay={2}
      />

      {/* Surrounding Garden Ground Horizon */}
      <mesh position={[0, -0.05, -2]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[76, 76]} />
        <meshStandardMaterial color={isNight ? '#1e2c24' : '#4a6345'} roughness={0.95} />
      </mesh>

      {/* ================================================================= */}
      {/* 1. CENTRAL COURTYARD FLOOR (حیاط مرکزی سنگفرش)                   */}
      {/* ================================================================= */}
      <mesh position={[0, 0, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[15.2, 13.4]} />
        <meshStandardMaterial map={stoneTex} roughness={0.78} />
      </mesh>

      <CentralPersianPool isNight={isNight} />
      <PersianGardenBeds season={season} />

      {/* ================================================================= */}
      {/* 2. SOUTH MAIN ENTRANCE PORTAL & HASHTI (سردر ورودی و دیوار حیاط)  */}
      {/* ================================================================= */}
      <group position={[0, 0, 6.75]}>
        {/* Left & Right Brick Perimeter Walls */}
        <mesh position={[-5.1, 1.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[5.0, 3.1, 0.38]} />
          <meshStandardMaterial map={brickTex} roughness={0.82} />
        </mesh>
        <mesh position={[5.1, 1.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[5.0, 3.1, 0.38]} />
          <meshStandardMaterial map={brickTex} roughness={0.82} />
        </mesh>
        {/* Turquoise Mosaic Coping Strip */}
        <mesh position={[-5.1, 3.14, 0]}>
          <boxGeometry args={[5.05, 0.14, 0.44]} />
          <meshStandardMaterial map={mosaicTex} roughness={0.35} />
        </mesh>
        <mesh position={[5.1, 3.14, 0]}>
          <boxGeometry args={[5.05, 0.14, 0.44]} />
          <meshStandardMaterial map={mosaicTex} roughness={0.35} />
        </mesh>

        {/* Grand Entrance Sardarb / Portal Arch (سردر ورودی کاشی‌کاری) */}
        <mesh position={[-1.85, 2.0, 0]} castShadow>
          <boxGeometry args={[1.6, 4.0, 0.6]} />
          <meshStandardMaterial map={brickTex} roughness={0.8} />
        </mesh>
        <mesh position={[1.85, 2.0, 0]} castShadow>
          <boxGeometry args={[1.6, 4.0, 0.6]} />
          <meshStandardMaterial map={brickTex} roughness={0.8} />
        </mesh>
        {/* Turquoise Mosaic Spandrel Top */}
        <mesh position={[0, 3.6, 0]} castShadow>
          <boxGeometry args={[5.3, 1.0, 0.64]} />
          <meshStandardMaterial map={mosaicTex} roughness={0.32} />
        </mesh>
        {/* Open Carved Double Walnut Entrance Doors (در منبت با کوبه برنجی) */}
        <group position={[-1.02, 1.45, 0.15]} rotation={[0, -0.78, 0]}>
          <mesh position={[0.45, 0, 0]} castShadow>
            <boxGeometry args={[0.92, 2.9, 0.1]} />
            <meshStandardMaterial map={woodTex} color="#4d2d1b" roughness={0.6} />
          </mesh>
          <mesh position={[0.72, 0.1, -0.07]}>
            <torusGeometry args={[0.07, 0.015, 6, 16]} />
            <meshStandardMaterial color="#d4a84f" metalness={0.85} roughness={0.25} />
          </mesh>
        </group>
        <group position={[1.02, 1.45, 0.15]} rotation={[0, 0.78, 0]}>
          <mesh position={[-0.45, 0, 0]} castShadow>
            <boxGeometry args={[0.92, 2.9, 0.1]} />
            <meshStandardMaterial map={woodTex} color="#4d2d1b" roughness={0.6} />
          </mesh>
          <mesh position={[-0.72, 0.1, -0.07]}>
            <torusGeometry args={[0.07, 0.015, 6, 16]} />
            <meshStandardMaterial color="#d4a84f" metalness={0.85} roughness={0.25} />
          </mesh>
        </group>
      </group>

      {/* ================================================================= */}
      {/* 3. GRAND NORTH EYVAN (ایوان اصلی ستوندار مشرف به حوض)              */}
      {/* ================================================================= */}
      <group position={[0, 0, 0]}>
        {/* Raised Eyvan Stone Platform */}
        <mesh position={[0, 0.12, -8.1]} receiveShadow castShadow>
          <boxGeometry args={[12.2, 0.24, 3.2]} />
          <meshStandardMaterial map={stoneTex} color="#e2d4bc" roughness={0.68} />
        </mesh>
        {/* Two Travertine Steps down to Courtyard */}
        <mesh position={[0, 0.06, -6.38]} receiveShadow>
          <boxGeometry args={[4.4, 0.12, 0.36]} />
          <meshStandardMaterial color="#d9cab1" roughness={0.68} />
        </mesh>

        {/* 4 Carved Walnut Columns */}
        <EyvanCarvedColumn position={[-4.8, 0.24, -6.72]} woodTex={woodTex} />
        <EyvanCarvedColumn position={[-1.75, 0.24, -6.72]} woodTex={woodTex} />
        <EyvanCarvedColumn position={[1.75, 0.24, -6.72]} woodTex={woodTex} />
        <EyvanCarvedColumn position={[4.8, 0.24, -6.72]} woodTex={woodTex} />

        {/* Decorative Carved Beam & Turquoise Frieze above Eyvan */}
        <mesh position={[0, 4.32, -6.72]} castShadow>
          <boxGeometry args={[12.2, 0.42, 0.45]} />
          <meshStandardMaterial map={mosaicTex} roughness={0.34} />
        </mesh>

        {/* Side Wing Walls flanking Eyvan */}
        <mesh position={[-6.7, 2.25, -8.1]} castShadow receiveShadow>
          <boxGeometry args={[1.4, 4.5, 3.2]} />
          <meshStandardMaterial map={brickTex} roughness={0.8} />
        </mesh>
        <mesh position={[6.7, 2.25, -8.1]} castShadow receiveShadow>
          <boxGeometry args={[1.4, 4.5, 3.2]} />
          <meshStandardMaterial map={brickTex} roughness={0.8} />
        </mesh>

        {/* Orosi Stained-Glass Facade between Eyvan & Main Hall (Z = -9.65) */}
        <group position={[0, 0.24, -9.65]}>
          {/* Left & Right Orosi Windows */}
          <mesh position={[-3.7, 2.05, 0]} castShadow>
            <boxGeometry args={[4.4, 3.3, 0.16]} />
            <meshStandardMaterial
              map={orosiTex}
              emissive="#f7bc63"
              emissiveIntensity={isNight ? 0.52 : 0.18}
              roughness={0.35}
            />
          </mesh>
          <mesh position={[3.7, 2.05, 0]} castShadow>
            <boxGeometry args={[4.4, 3.3, 0.16]} />
            <meshStandardMaterial
              map={orosiTex}
              emissive="#f7bc63"
              emissiveIntensity={isNight ? 0.52 : 0.18}
              roughness={0.35}
            />
          </mesh>
          {/* Open Central Grand Archway Doorway into Main Hall */}
          <mesh position={[0, 3.65, 0]} castShadow>
            <boxGeometry args={[3.2, 1.15, 0.26]} />
            <meshStandardMaterial map={gachTex} roughness={0.75} />
          </mesh>
          {/* Carved Side Piers */}
          <mesh position={[-1.55, 2.1, 0]} castShadow>
            <boxGeometry args={[0.28, 4.2, 0.34]} />
            <meshStandardMaterial map={woodTex} color="#4d2c19" roughness={0.58} />
          </mesh>
          <mesh position={[1.55, 2.1, 0]} castShadow>
            <boxGeometry args={[0.28, 4.2, 0.34]} />
            <meshStandardMaterial map={woodTex} color="#4d2c19" roughness={0.58} />
          </mesh>
        </group>

        {!cutawayMode && (
          <group>
            {/* Eyvan Painted Coffered Ceiling */}
            <mesh position={[0, 4.42, -8.1]} castShadow receiveShadow>
              <boxGeometry args={[12.4, 0.22, 3.35]} />
              <meshStandardMaterial map={woodTex} color="#4a2a18" roughness={0.6} />
            </mesh>
            <PersianChandelier position={[0, 3.88, -8.1]} isLit={isLampLit} />
          </group>
        )}
      </group>

      {/* ================================================================= */}
      {/* 4. MAIN GRAND HALL (تالار آینه و پذیرایی Z ∈ [-16.2, -9.65])      */}
      {/* ================================================================= */}
      <group position={[0, 0, 0]}>
        {/* Main Hall Floor */}
        <mesh position={[0, 0.12, -12.95]} receiveShadow>
          <boxGeometry args={[15.0, 0.24, 6.6]} />
          <meshStandardMaterial
            map={floorMaterial === 'walnut' || floorMaterial === 'oak' ? lightWoodTex : stoneTex}
            color={floorTint}
            roughness={floorMaterial === 'marble' ? 0.28 : 0.58}
          />
        </mesh>

        {/* North Mirrorwork & Stucco Wall (Z = -16.15) */}
        <mesh position={[0, 2.35, -16.15]} receiveShadow castShadow>
          <boxGeometry args={[15.2, 4.5, 0.32]} />
          <meshStandardMaterial color={interiorWallHex} roughness={0.8} />
        </mesh>
        {/* Center Aineh-Kari (آینه‌کاری اصیل) Grand Niche */}
        <mesh position={[0, 2.45, -15.96]}>
          <boxGeometry args={[4.4, 3.2, 0.08]} />
          <meshStandardMaterial
            map={ainehTex}
            metalness={0.82}
            roughness={0.14}
          />
        </mesh>
        {/* Flanking Gachbori Stucco Panels */}
        <mesh position={[-4.5, 2.45, -15.96]}>
          <boxGeometry args={[3.4, 3.0, 0.06]} />
          <meshStandardMaterial map={gachTex} roughness={0.72} />
        </mesh>
        <mesh position={[4.5, 2.45, -15.96]}>
          <boxGeometry args={[3.4, 3.0, 0.06]} />
          <meshStandardMaterial map={gachTex} roughness={0.72} />
        </mesh>
        {/* Walnut Wainscot Trim */}
        <mesh position={[0, 0.65, -15.95]}>
          <boxGeometry args={[14.8, 0.85, 0.08]} />
          <meshStandardMaterial map={woodTex} color="#543320" roughness={0.55} />
        </mesh>

        {/* West & East Hall Walls with Arched Passageways to Side Wings */}
        {/* West Wall (X = -7.5) opening to Kitchen */}
        <mesh position={[-7.5, 2.35, -14.8]} receiveShadow castShadow>
          <boxGeometry args={[0.3, 4.5, 2.7]} />
          <meshStandardMaterial color={interiorWallHex} roughness={0.8} />
        </mesh>
        <mesh position={[-7.5, 2.35, -10.5]} receiveShadow castShadow>
          <boxGeometry args={[0.3, 4.5, 1.8]} />
          <meshStandardMaterial color={interiorWallHex} roughness={0.8} />
        </mesh>
        <mesh position={[-7.5, 3.85, -12.45]} castShadow>
          <boxGeometry args={[0.3, 1.5, 2.1]} />
          <meshStandardMaterial map={gachTex} roughness={0.75} />
        </mesh>

        {/* East Wall (X = +7.5) opening to Living Room */}
        <mesh position={[7.5, 2.35, -14.8]} receiveShadow castShadow>
          <boxGeometry args={[0.3, 4.5, 2.7]} />
          <meshStandardMaterial color={interiorWallHex} roughness={0.8} />
        </mesh>
        <mesh position={[7.5, 2.35, -10.5]} receiveShadow castShadow>
          <boxGeometry args={[0.3, 4.5, 1.8]} />
          <meshStandardMaterial color={interiorWallHex} roughness={0.8} />
        </mesh>
        <mesh position={[7.5, 3.85, -12.45]} castShadow>
          <boxGeometry args={[0.3, 1.5, 2.1]} />
          <meshStandardMaterial map={gachTex} roughness={0.75} />
        </mesh>

        {!cutawayMode && (
          <group>
            <mesh position={[0, 4.55, -12.95]} receiveShadow>
              <boxGeometry args={[15.2, 0.24, 6.7]} />
              <meshStandardMaterial map={gachTex} color="#ede2cf" roughness={0.7} />
            </mesh>
            {/* Turquoise & Brick Pitched Persian Roof Over Main Wing */}
            <mesh position={[0, 4.95, -12.95]} castShadow>
              <boxGeometry args={[15.6, 0.55, 7.0]} />
              <meshStandardMaterial color="#b48a62" roughness={0.82} />
            </mesh>
            <PersianChandelier position={[0, 4.02, -13.0]} isLit={isLampLit} />
          </group>
        )}
      </group>

      {/* ================================================================= */}
      {/* 5. EAST WING: LIVING ROOM + LIBRARY + BEDROOM (X ∈ [7.5, 13.5])   */}
      {/* ================================================================= */}
      <group position={[0, 0, 0]}>
        {/* East Wing Slab Floor */}
        <mesh position={[10.5, 0.12, -3.5]} receiveShadow>
          <boxGeometry args={[6.1, 0.24, 20.2]} />
          <meshStandardMaterial
            map={floorMaterial === 'walnut' || floorMaterial === 'oak' ? lightWoodTex : stoneTex}
            color={floorTint}
            roughness={0.55}
          />
        </mesh>

        {/* Courtyard-Facing East Facade Wall (X = +7.5) with Orosi Windows & Doorways */}
        <mesh position={[7.5, 2.15, -7.2]} castShadow receiveShadow>
          <boxGeometry args={[0.32, 4.2, 1.9]} />
          <meshStandardMaterial map={brickTex} roughness={0.8} />
        </mesh>
        {/* Library Courtyard Orosi Window */}
        <mesh position={[7.5, 2.0, -3.3]} castShadow>
          <boxGeometry args={[0.24, 2.6, 2.8]} />
          <meshStandardMaterial
            map={orosiTex}
            emissive="#f7bc63"
            emissiveIntensity={isNight ? 0.45 : 0.14}
          />
        </mesh>
        <mesh position={[7.5, 0.48, -3.3]} castShadow>
          <boxGeometry args={[0.34, 0.96, 3.0]} />
          <meshStandardMaterial map={brickTex} roughness={0.8} />
        </mesh>
        <mesh position={[7.5, 3.75, -3.3]} castShadow>
          <boxGeometry args={[0.34, 0.95, 3.0]} />
          <meshStandardMaterial map={mosaicTex} roughness={0.35} />
        </mesh>

        {/* Wall Pillar between Library & Bedroom */}
        <mesh position={[7.5, 2.15, -0.05]} castShadow receiveShadow>
          <boxGeometry args={[0.34, 4.2, 3.5]} />
          <meshStandardMaterial map={brickTex} roughness={0.8} />
        </mesh>
        {/* Bedroom Courtyard Window */}
        <mesh position={[7.5, 2.0, 3.25]} castShadow>
          <boxGeometry args={[0.24, 2.5, 2.4]} />
          <meshStandardMaterial
            map={orosiTex}
            emissive="#f7bc63"
            emissiveIntensity={isNight ? 0.45 : 0.14}
          />
        </mesh>
        <mesh position={[7.5, 0.48, 3.25]} castShadow>
          <boxGeometry args={[0.34, 0.96, 2.6]} />
          <meshStandardMaterial map={brickTex} roughness={0.8} />
        </mesh>
        <mesh position={[7.5, 3.75, 3.25]} castShadow>
          <boxGeometry args={[0.34, 0.95, 2.6]} />
          <meshStandardMaterial map={mosaicTex} roughness={0.35} />
        </mesh>
        <mesh position={[7.5, 2.15, 5.5]} castShadow receiveShadow>
          <boxGeometry args={[0.34, 4.2, 2.1]} />
          <meshStandardMaterial map={brickTex} roughness={0.8} />
        </mesh>

        {/* East Outer Perimeter Wall (X = +13.45) */}
        <mesh position={[13.45, 2.15, -3.5]} castShadow receiveShadow>
          <boxGeometry args={[0.34, 4.2, 20.2]} />
          <meshStandardMaterial color={interiorWallHex} roughness={0.82} />
        </mesh>
        {/* North & South End Walls of East Wing */}
        <mesh position={[10.5, 2.15, -13.45]} castShadow receiveShadow>
          <boxGeometry args={[6.1, 4.2, 0.32]} />
          <meshStandardMaterial color={interiorWallHex} roughness={0.82} />
        </mesh>
        <mesh position={[10.5, 2.15, 6.5]} castShadow receiveShadow>
          <boxGeometry args={[6.1, 4.2, 0.34]} />
          <meshStandardMaterial map={brickTex} roughness={0.82} />
        </mesh>

        {/* Interior Dividers inside East Wing (with open arched doorways) */}
        {/* Living <-> Library Divider (Z = -6.5) */}
        <mesh position={[11.6, 2.15, -6.5]} receiveShadow>
          <boxGeometry args={[3.7, 4.2, 0.24]} />
          <meshStandardMaterial color={interiorWallHex} roughness={0.8} />
        </mesh>
        <mesh position={[8.6, 3.65, -6.5]}>
          <boxGeometry args={[2.3, 1.2, 0.24]} />
          <meshStandardMaterial map={gachTex} roughness={0.75} />
        </mesh>

        {/* Library <-> Bedroom Divider (Z = +0.0) */}
        <mesh position={[11.6, 2.15, 0.0]} receiveShadow>
          <boxGeometry args={[3.7, 4.2, 0.24]} />
          <meshStandardMaterial color={interiorWallHex} roughness={0.8} />
        </mesh>
        <mesh position={[8.6, 3.65, 0.0]}>
          <boxGeometry args={[2.3, 1.2, 0.24]} />
          <meshStandardMaterial map={gachTex} roughness={0.75} />
        </mesh>

        {!cutawayMode && (
          <group>
            <mesh position={[10.5, 4.3, -3.5]} castShadow>
              <boxGeometry args={[6.3, 0.32, 20.4]} />
              <meshStandardMaterial color="#b48a62" roughness={0.82} />
            </mesh>
            <PersianChandelier position={[10.5, 3.85, 3.2]} isLit={isLampLit} />
          </group>
        )}
      </group>

      {/* ================================================================= */}
      {/* 6. WEST WING: KITCHEN + CAT ROOM (X ∈ [-13.5, -7.5])              */}
      {/* ================================================================= */}
      <group position={[0, 0, 0]}>
        {/* West Wing Slab Floor */}
        <mesh position={[-10.5, 0.12, -5.8]} receiveShadow>
          <boxGeometry args={[6.1, 0.24, 15.6]} />
          <meshStandardMaterial
            map={floorMaterial === 'walnut' || floorMaterial === 'oak' ? lightWoodTex : stoneTex}
            color={floorTint}
            roughness={0.55}
          />
        </mesh>

        {/* Courtyard-Facing West Facade Wall (X = -7.5) */}
        <mesh position={[-7.5, 2.15, -7.3]} castShadow receiveShadow>
          <boxGeometry args={[0.32, 4.2, 2.4]} />
          <meshStandardMaterial map={brickTex} roughness={0.8} />
        </mesh>
        {/* Cat Room Sunny Courtyard Orosi Window */}
        <mesh position={[-7.5, 2.0, -2.2]} castShadow>
          <boxGeometry args={[0.24, 2.5, 2.8]} />
          <meshStandardMaterial
            map={orosiTex}
            emissive="#f7bc63"
            emissiveIntensity={isNight ? 0.45 : 0.16}
          />
        </mesh>
        <mesh position={[-7.5, 0.46, -2.2]} castShadow>
          <boxGeometry args={[0.34, 0.92, 3.0]} />
          <meshStandardMaterial map={brickTex} roughness={0.8} />
        </mesh>
        <mesh position={[-7.5, 3.72, -2.2]} castShadow>
          <boxGeometry args={[0.34, 0.96, 3.0]} />
          <meshStandardMaterial map={mosaicTex} roughness={0.35} />
        </mesh>
        <mesh position={[-7.5, 2.15, 0.7]} castShadow receiveShadow>
          <boxGeometry args={[0.34, 4.2, 2.9]} />
          <meshStandardMaterial map={brickTex} roughness={0.8} />
        </mesh>
        {/* West Perimeter Courtyard Wall Extension (Z ∈ [2.0, 6.75]) */}
        <mesh position={[-7.5, 1.55, 4.4]} castShadow receiveShadow>
          <boxGeometry args={[0.36, 3.1, 4.8]} />
          <meshStandardMaterial map={brickTex} roughness={0.82} />
        </mesh>

        {/* West Outer Wall (X = -13.45) */}
        <mesh position={[-13.45, 2.15, -5.8]} castShadow receiveShadow>
          <boxGeometry args={[0.34, 4.2, 15.6]} />
          <meshStandardMaterial color={interiorWallHex} roughness={0.82} />
        </mesh>
        {/* North & South End Walls of West Wing */}
        <mesh position={[-10.5, 2.15, -13.45]} castShadow receiveShadow>
          <boxGeometry args={[6.1, 4.2, 0.32]} />
          <meshStandardMaterial color={interiorWallHex} roughness={0.82} />
        </mesh>
        <mesh position={[-10.5, 2.15, 1.9]} castShadow receiveShadow>
          <boxGeometry args={[6.1, 4.2, 0.34]} />
          <meshStandardMaterial map={brickTex} roughness={0.82} />
        </mesh>

        {/* Kitchen Turquoise Tile Backsplash Accent */}
        <mesh position={[-13.24, 1.75, -9.8]}>
          <boxGeometry args={[0.06, 1.6, 5.2]} />
          <meshStandardMaterial map={mosaicTex} roughness={0.28} />
        </mesh>

        {/* Kitchen <-> Cat Room Interior Divider (Z = -5.5) */}
        <mesh position={[-11.6, 2.15, -5.5]} receiveShadow>
          <boxGeometry args={[3.7, 4.2, 0.24]} />
          <meshStandardMaterial color={interiorWallHex} roughness={0.8} />
        </mesh>
        <mesh position={[-8.6, 3.65, -5.5]}>
          <boxGeometry args={[2.3, 1.2, 0.24]} />
          <meshStandardMaterial map={gachTex} roughness={0.75} />
        </mesh>

        {!cutawayMode && (
          <mesh position={[-10.5, 4.3, -5.8]} castShadow>
            <boxGeometry args={[6.3, 0.32, 15.8]} />
            <meshStandardMaterial color="#b48a62" roughness={0.82} />
          </mesh>
        )}
      </group>
    </group>
  );
};

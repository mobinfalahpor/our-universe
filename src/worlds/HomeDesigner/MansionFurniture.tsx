import React, { useMemo } from 'react';
import * as THREE from 'three';
import {
  getMiniaturePaintingTexture,
  getPersianCarpetByColor,
  getTermehTexture,
  getTurquoiseMosaicTexture,
} from '../../systems/persianMansionTextures';
import { createRugTexture, createWoodTexture } from '../../systems/proceduralTextures';
import { PLANT_SPECIES_INFO, POT_STYLES_INFO } from '../../core/plantCatalog';
import { audioEngine } from '../../systems/audioEngine';
import { getCatalogMeta } from './mansionCatalog';
import type { HomeTimeMode, PlacedFurniture } from '../../core/types';

interface MansionFurnitureItemProps {
  item: PlacedFurniture;
  selected: boolean;
  editMode: boolean;
  timeMode: HomeTimeMode;
  onPointerStart: (uid: string, e: { stopPropagation: () => void; point: THREE.Vector3 }) => void;
}

// =====================================================================
// Lathe Ceramic Vase & Samovar Profiles
// =====================================================================
function useVaseGeometry() {
  return useMemo(() => {
    const pts = [
      new THREE.Vector2(0.0, 0),
      new THREE.Vector2(0.09, 0.01),
      new THREE.Vector2(0.14, 0.14),
      new THREE.Vector2(0.15, 0.25),
      new THREE.Vector2(0.06, 0.36),
      new THREE.Vector2(0.095, 0.44),
      new THREE.Vector2(0.08, 0.45),
    ];
    return new THREE.LatheGeometry(pts, 18);
  }, []);
}

function useSamovarGeometry() {
  return useMemo(() => {
    const pts = [
      new THREE.Vector2(0.0, 0),
      new THREE.Vector2(0.1, 0.02),
      new THREE.Vector2(0.06, 0.09),
      new THREE.Vector2(0.13, 0.18),
      new THREE.Vector2(0.11, 0.32),
      new THREE.Vector2(0.075, 0.38),
      new THREE.Vector2(0.09, 0.42),
      new THREE.Vector2(0.0, 0.44),
    ];
    return new THREE.LatheGeometry(pts, 18);
  }, []);
}

// =====================================================================
// Multi-Part Sculpted Model Renderer per FurnitureKind
// =====================================================================
function FurnitureModel({ item, timeMode }: { item: PlacedFurniture; timeMode: HomeTimeMode }) {
  const vaseGeo = useVaseGeometry();
  const samovarGeo = useSamovarGeometry();
  const woodTex = useMemo(() => createWoodTexture('#5e3721', '#3b2112', 2), []);
  const carpetTex = useMemo(() => getPersianCarpetByColor(item.color), [item.color]);
  const roundRugTex = useMemo(() => createRugTexture(item.color), [item.color]);
  const termehTex = useMemo(() => getTermehTexture(item.color), [item.color]);
  const mosaicTex = useMemo(() => getTurquoiseMosaicTexture(2, 1), []);
  const paintingTex = useMemo(
    () => getMiniaturePaintingTexture(item.variantSeed ?? 1),
    [item.variantSeed]
  );

  const isLit = timeMode === 'night' || timeMode === 'sunset';

  switch (item.kind) {
    // -----------------------------------------------------------------
    // مبل سلطنتی ایرانی و کاناپه
    // -----------------------------------------------------------------
    case 'persian_sofa':
    case 'sofa': {
      const isRoyal = item.kind === 'persian_sofa';
      return (
        <group>
          {/* Carved Walnut Base & Legs */}
          <mesh position={[0, 0.18, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.06, 0.16, 0.88]} />
            <meshStandardMaterial map={woodTex} color="#52301c" roughness={0.55} />
          </mesh>
          {[
            [-0.92, 0.07, -0.34],
            [0.92, 0.07, -0.34],
            [-0.92, 0.07, 0.34],
            [0.92, 0.07, 0.34],
          ].map((lp, idx) => (
            <mesh key={idx} position={lp as [number, number, number]} castShadow>
              <cylinderGeometry args={[0.045, 0.032, 0.14, 10]} />
              <meshStandardMaterial color={isRoyal ? '#c99b42' : '#4a2b18'} roughness={0.45} metalness={isRoyal ? 0.5 : 0} />
            </mesh>
          ))}
          {/* Seat Velvet Cushions */}
          {[-0.62, 0, 0.62].map((cx, idx) => (
            <mesh key={idx} position={[cx, 0.33, 0.04]} castShadow receiveShadow>
              <boxGeometry args={[0.6, 0.17, 0.72]} />
              <meshStandardMaterial color={item.color} roughness={0.78} />
            </mesh>
          ))}
          {/* Crowned Backrest */}
          <mesh position={[0, 0.64, -0.32]} castShadow>
            <boxGeometry args={[1.98, 0.56, 0.18]} />
            <meshStandardMaterial color={item.color} roughness={0.78} />
          </mesh>
          {isRoyal && (
            <mesh position={[0, 0.96, -0.32]} castShadow>
              <cylinderGeometry args={[0.1, 0.42, 0.2, 12]} />
              <meshStandardMaterial color="#c99b42" metalness={0.55} roughness={0.35} />
            </mesh>
          )}
          {/* Rolled Armrests */}
          {[-0.95, 0.95].map((ax, i) => (
            <mesh key={i} position={[ax, 0.46, 0]} castShadow>
              <boxGeometry args={[0.16, 0.38, 0.84]} />
              <meshStandardMaterial color={item.color} roughness={0.78} />
            </mesh>
          ))}
          {/* Embroidered Throw Pillows */}
          {[-0.65, 0.65].map((px, i) => (
            <mesh
              key={i}
              position={[px, 0.52, -0.14]}
              rotation={[0.2, i === 0 ? 0.3 : -0.3, 0]}
              castShadow
            >
              <boxGeometry args={[0.3, 0.26, 0.11]} />
              <meshStandardMaterial map={termehTex} roughness={0.7} />
            </mesh>
          ))}
        </group>
      );
    }

    // -----------------------------------------------------------------
    // صندلی منبت و مبل تک‌نفره
    // -----------------------------------------------------------------
    case 'royal_chair':
    case 'armchair': {
      const isArmchair = item.kind === 'armchair';
      return (
        <group>
          {[
            [-0.24, 0.21, -0.22],
            [0.24, 0.21, -0.22],
            [-0.24, 0.21, 0.22],
            [0.24, 0.21, 0.22],
          ].map((lp, idx) => (
            <mesh key={idx} position={lp as [number, number, number]} castShadow>
              <cylinderGeometry args={[0.03, 0.022, 0.42, 8]} />
              <meshStandardMaterial color="#4e2e1b" roughness={0.55} />
            </mesh>
          ))}
          <mesh position={[0, 0.44, 0]} castShadow receiveShadow>
            <boxGeometry args={[isArmchair ? 0.72 : 0.54, 0.12, isArmchair ? 0.66 : 0.52]} />
            <meshStandardMaterial color={item.color} roughness={0.78} />
          </mesh>
          <mesh position={[0, 0.78, -0.23]} castShadow>
            <boxGeometry args={[isArmchair ? 0.68 : 0.5, 0.6, 0.1]} />
            <meshStandardMaterial color={item.color} roughness={0.78} />
          </mesh>
          <mesh position={[0, 1.1, -0.23]}>
            <sphereGeometry args={[0.075, 10, 10]} />
            <meshStandardMaterial color="#c99b42" metalness={0.6} roughness={0.3} />
          </mesh>
          {isArmchair &&
            [-0.34, 0.34].map((ax, i) => (
              <mesh key={i} position={[ax, 0.58, 0]} castShadow>
                <boxGeometry args={[0.1, 0.24, 0.62]} />
                <meshStandardMaterial color={item.color} roughness={0.75} />
              </mesh>
            ))}
        </group>
      );
    }

    // -----------------------------------------------------------------
    // میز پذیرایی و ناهارخوری و تحریر و پاتختی و آرایش
    // -----------------------------------------------------------------
    case 'coffee_table':
      return (
        <group>
          <mesh position={[0, 0.43, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.18, 0.06, 0.76]} />
            <meshStandardMaterial map={woodTex} color={item.color} roughness={0.38} />
          </mesh>
          <mesh position={[0, 0.39, 0]}>
            <boxGeometry args={[1.1, 0.04, 0.68]} />
            <meshStandardMaterial color="#c99b42" metalness={0.45} roughness={0.4} />
          </mesh>
          {[
            [-0.48, 0.21, -0.28],
            [0.48, 0.21, -0.28],
            [-0.48, 0.21, 0.28],
            [0.48, 0.21, 0.28],
          ].map((lp, i) => (
            <mesh key={i} position={lp as [number, number, number]} castShadow>
              <cylinderGeometry args={[0.04, 0.025, 0.42, 10]} />
              <meshStandardMaterial color="#4a2b18" roughness={0.5} />
            </mesh>
          ))}
        </group>
      );

    case 'dining_table':
    case 'desk': {
      const isDesk = item.kind === 'desk';
      return (
        <group>
          <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
            <boxGeometry args={[isDesk ? 1.38 : 1.72, 0.07, isDesk ? 0.74 : 0.96]} />
            <meshStandardMaterial map={woodTex} color={item.color} roughness={0.42} />
          </mesh>
          {[
            [-0.6, 0.36, -0.34],
            [0.6, 0.36, -0.34],
            [-0.6, 0.36, 0.34],
            [0.6, 0.36, 0.34],
          ].map((lp, i) => (
            <mesh key={i} position={lp as [number, number, number]} castShadow>
              <cylinderGeometry args={[0.045, 0.03, 0.72, 10]} />
              <meshStandardMaterial color="#4a2b18" roughness={0.5} />
            </mesh>
          ))}
          {isDesk && (
            <>
              <mesh position={[0.42, 0.56, 0]} castShadow>
                <boxGeometry args={[0.38, 0.32, 0.62]} />
                <meshStandardMaterial color="#52311d" roughness={0.55} />
              </mesh>
              {/* Open book on desk */}
              <mesh position={[-0.22, 0.79, 0.05]} rotation={[0, 0.2, 0]}>
                <boxGeometry args={[0.28, 0.03, 0.2]} />
                <meshStandardMaterial color="#f2e6cf" roughness={0.8} />
              </mesh>
            </>
          )}
        </group>
      );
    }

    case 'nightstand':
      return (
        <group>
          <mesh position={[0, 0.28, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.52, 0.52, 0.44]} />
            <meshStandardMaterial map={woodTex} color={item.color} roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.55, 0]} castShadow>
            <boxGeometry args={[0.56, 0.04, 0.48]} />
            <meshStandardMaterial color="#4d2c19" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.38, 0.23]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshStandardMaterial color="#d4a84f" metalness={0.8} roughness={0.25} />
          </mesh>
        </group>
      );

    case 'vanity':
      return (
        <group>
          <mesh position={[0, 0.74, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.05, 0.06, 0.48]} />
            <meshStandardMaterial map={woodTex} color={item.color} roughness={0.48} />
          </mesh>
          <mesh position={[-0.36, 0.36, 0]} castShadow>
            <boxGeometry args={[0.28, 0.7, 0.42]} />
            <meshStandardMaterial color={item.color} roughness={0.55} />
          </mesh>
          <mesh position={[0.36, 0.36, 0]} castShadow>
            <boxGeometry args={[0.28, 0.7, 0.42]} />
            <meshStandardMaterial color={item.color} roughness={0.55} />
          </mesh>
          {/* Oval Carved Mirror */}
          <mesh position={[0, 1.24, -0.18]} castShadow>
            <cylinderGeometry args={[0.36, 0.36, 0.05, 24]} />
            <meshStandardMaterial color="#d4a84f" metalness={0.7} roughness={0.3} />
          </mesh>
          <mesh position={[0, 1.24, -0.15]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.31, 0.31, 0.02, 24]} />
            <meshStandardMaterial color="#dbe8f0" metalness={0.95} roughness={0.05} />
          </mesh>
        </group>
      );

    // -----------------------------------------------------------------
    // قفسه کتاب و کتاب‌ها
    // -----------------------------------------------------------------
    case 'bookshelf': {
      const bookColors = ['#8c2330', '#1d3663', '#2d634a', '#b88c3b', '#6e3d28', '#3c5f78'];
      return (
        <group>
          <mesh position={[0, 1.05, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.3, 2.1, 0.38]} />
            <meshStandardMaterial map={woodTex} color={item.color} roughness={0.58} />
          </mesh>
          {/* Shelves & Packed Books */}
          {[0.38, 0.84, 1.3, 1.76].map((sy, sIdx) => (
            <group key={sIdx} position={[0, sy, 0.06]}>
              <mesh position={[0, -0.16, 0]}>
                <boxGeometry args={[1.18, 0.035, 0.32]} />
                <meshStandardMaterial color="#462816" roughness={0.6} />
              </mesh>
              {Array.from({ length: 9 }).map((_, bi) => (
                <mesh
                  key={bi}
                  position={[-0.48 + bi * 0.115, 0.02, 0.02]}
                  rotation={[0, 0, bi === 8 && sIdx % 2 === 0 ? -0.18 : 0]}
                  castShadow
                >
                  <boxGeometry args={[0.078, 0.25 + ((bi + sIdx) % 3) * 0.035, 0.22]} />
                  <meshStandardMaterial
                    color={bookColors[(bi * 3 + sIdx) % bookColors.length]}
                    roughness={0.65}
                  />
                </mesh>
              ))}
            </group>
          ))}
        </group>
      );
    }

    // -----------------------------------------------------------------
    // شاه‌نشین و پشتی سنتی
    // -----------------------------------------------------------------
    case 'bolster_set':
      return (
        <group>
          <mesh position={[0, 0.09, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.45, 0.16, 0.85]} />
            <meshStandardMaterial map={termehTex} roughness={0.82} />
          </mesh>
          {[-0.45, 0.45].map((bx, i) => (
            <mesh key={i} position={[bx, 0.32, -0.26]} rotation={[0, 0, Math.PI / 2]} castShadow>
              <cylinderGeometry args={[0.14, 0.14, 0.56, 14]} />
              <meshStandardMaterial map={termehTex} roughness={0.78} />
            </mesh>
          ))}
          <mesh position={[0, 0.28, -0.3]} castShadow>
            <boxGeometry args={[1.38, 0.32, 0.15]} />
            <meshStandardMaterial map={termehTex} roughness={0.8} />
          </mesh>
        </group>
      );

    // -----------------------------------------------------------------
    // فرش دست‌بافت تبریز، کناره، قالیچه گرد
    // -----------------------------------------------------------------
    case 'persian_carpet_large':
      return (
        <group>
          <mesh position={[0, 0.008, 0]} receiveShadow>
            <boxGeometry args={[3.4, 0.016, 2.3]} />
            <meshStandardMaterial map={carpetTex} roughness={0.92} />
          </mesh>
          {/* Fringe edges (ریشه‌های ابریشمی فرش) */}
          {[-1.74, 1.74].map((fx, i) => (
            <mesh key={i} position={[fx, 0.005, 0]}>
              <boxGeometry args={[0.08, 0.008, 2.22]} />
              <meshStandardMaterial color="#f2e6cf" roughness={0.95} />
            </mesh>
          ))}
        </group>
      );

    case 'persian_carpet_runner':
      return (
        <mesh position={[0, 0.008, 0]} receiveShadow>
          <boxGeometry args={[1.45, 0.016, 2.65]} />
          <meshStandardMaterial map={carpetTex} roughness={0.92} />
        </mesh>
      );

    case 'rug_round':
      return (
        <mesh position={[0, 0.008, 0]} receiveShadow>
          <cylinderGeometry args={[1.15, 1.15, 0.016, 32]} />
          <meshStandardMaterial map={roundRugTex} roughness={0.9} />
        </mesh>
      );

    // -----------------------------------------------------------------
    // روشنایی: آباژور ایستاده، چراغ رومیزی، دیواری، فانوس حیاط
    // -----------------------------------------------------------------
    case 'lamp_floor':
      return (
        <group>
          <mesh position={[0, 0.04, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.24, 0.08, 16]} />
            <meshStandardMaterial color={item.color} metalness={0.78} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0.85, 0]} castShadow>
            <cylinderGeometry args={[0.03, 0.04, 1.56, 10]} />
            <meshStandardMaterial color={item.color} metalness={0.78} roughness={0.28} />
          </mesh>
          <mesh position={[0, 1.65, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.3, 0.34, 18]} />
            <meshStandardMaterial
              color="#f3e2be"
              emissive={isLit ? '#ffc870' : '#4a381f'}
              emissiveIntensity={isLit ? 0.95 : 0.1}
              roughness={0.5}
            />
          </mesh>
          {isLit && <pointLight position={[0, 1.6, 0]} color="#ffd085" intensity={1.1} distance={5} decay={2} />}
        </group>
      );

    case 'table_lamp':
      return (
        <group>
          <mesh position={[0, 0.04, 0]}>
            <cylinderGeometry args={[0.09, 0.11, 0.06, 12]} />
            <meshStandardMaterial color="#cfa146" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.022, 0.028, 0.24, 8]} />
            <meshStandardMaterial color="#cfa146" metalness={0.8} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.34, 0]}>
            <cylinderGeometry args={[0.08, 0.16, 0.16, 14]} />
            <meshStandardMaterial
              color={item.color}
              emissive={isLit ? item.color : '#000000'}
              emissiveIntensity={isLit ? 0.75 : 0}
              roughness={0.3}
            />
          </mesh>
          {isLit && <pointLight position={[0, 0.3, 0]} color="#ffe0a6" intensity={0.75} distance={3.2} decay={2} />}
        </group>
      );

    case 'wall_sconce':
      return (
        <group>
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[0.14, 0.28, 0.05]} />
            <meshStandardMaterial color={item.color} metalness={0.75} roughness={0.3} />
          </mesh>
          <mesh position={[0, 0.05, 0.16]}>
            <cylinderGeometry args={[0.07, 0.05, 0.2, 8]} />
            <meshStandardMaterial
              color="#ffe9bf"
              emissive={isLit ? '#ffbd59' : '#000000'}
              emissiveIntensity={isLit ? 1.2 : 0}
            />
          </mesh>
          {isLit && <pointLight position={[0, 0.05, 0.22]} color="#ffcf80" intensity={0.8} distance={4} decay={2} />}
        </group>
      );

    case 'courtyard_lantern':
      return (
        <group>
          <mesh position={[0, 0.08, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.2, 0.16, 8]} />
            <meshStandardMaterial color="#d9cab1" roughness={0.7} />
          </mesh>
          <mesh position={[0, 0.82, 0]} castShadow>
            <cylinderGeometry args={[0.045, 0.06, 1.35, 8]} />
            <meshStandardMaterial color={item.color} metalness={0.7} roughness={0.4} />
          </mesh>
          {/* Lantern Cage */}
          <mesh position={[0, 1.62, 0]} castShadow>
            <cylinderGeometry args={[0.16, 0.12, 0.32, 6]} />
            <meshStandardMaterial
              color="#ffebbf"
              emissive={isLit ? '#ffba52' : '#33291a'}
              emissiveIntensity={isLit ? 1.35 : 0.1}
              roughness={0.3}
            />
          </mesh>
          <mesh position={[0, 1.84, 0]}>
            <coneGeometry args={[0.2, 0.16, 6]} />
            <meshStandardMaterial color={item.color} metalness={0.7} roughness={0.35} />
          </mesh>
          {isLit && <pointLight position={[0, 1.62, 0]} color="#ffc76b" intensity={1.8} distance={7.5} decay={2} />}
        </group>
      );

    // -----------------------------------------------------------------
    // آثار هنری: تابلو نگارگری، آینه قدی، پرده
    // -----------------------------------------------------------------
    case 'persian_painting':
      return (
        <group>
          <mesh position={[0, 0, 0.03]} castShadow>
            <boxGeometry args={[0.92, 1.18, 0.05]} />
            <meshStandardMaterial color={item.color} metalness={0.55} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0, 0.06]}>
            <planeGeometry args={[0.78, 1.02]} />
            <meshStandardMaterial map={paintingTex} roughness={0.55} />
          </mesh>
        </group>
      );

    case 'wall_mirror':
      return (
        <group>
          <mesh position={[0, 0, 0.03]} castShadow>
            <boxGeometry args={[0.92, 1.35, 0.06]} />
            <meshStandardMaterial color={item.color} metalness={0.75} roughness={0.28} />
          </mesh>
          <mesh position={[0, 0, 0.065]}>
            <planeGeometry args={[0.74, 1.16]} />
            <meshStandardMaterial color="#d8e6f0" metalness={0.96} roughness={0.04} />
          </mesh>
        </group>
      );

    case 'curtain':
      return (
        <group>
          <mesh position={[0, 2.4, 0.04]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, 1.9, 10]} />
            <meshStandardMaterial color="#d4a84f" metalness={0.75} roughness={0.25} />
          </mesh>
          {[-0.74, 0.74].map((cx, i) => (
            <mesh key={i} position={[cx, 1.18, 0.06]} castShadow>
              <cylinderGeometry args={[0.16, 0.22, 2.38, 10]} />
              <meshStandardMaterial color={item.color} roughness={0.85} />
            </mesh>
          ))}
        </group>
      );

    // -----------------------------------------------------------------
    // وسایل تزئینی رومیزی: گلدان فیروزه، شمعدان، سماور، ظروف مس
    // -----------------------------------------------------------------
    case 'turquoise_vase':
      return (
        <group>
          <mesh geometry={vaseGeo} castShadow>
            <meshPhysicalMaterial
              color={item.color}
              roughness={0.18}
              clearcoat={0.85}
              clearcoatRoughness={0.1}
            />
          </mesh>
          <mesh position={[0, 0.44, 0]}>
            <torusGeometry args={[0.088, 0.012, 8, 16]} />
            <meshStandardMaterial color="#d4a84f" metalness={0.8} roughness={0.25} />
          </mesh>
        </group>
      );

    case 'brass_candlestick':
      return (
        <group>
          <mesh position={[0, 0.04, 0]} castShadow>
            <cylinderGeometry args={[0.07, 0.1, 0.06, 12]} />
            <meshStandardMaterial color={item.color} metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.18, 0]} castShadow>
            <cylinderGeometry args={[0.02, 0.035, 0.24, 10]} />
            <meshStandardMaterial color={item.color} metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.34, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.12, 8]} />
            <meshStandardMaterial color="#fff3dc" roughness={0.45} />
          </mesh>
          <mesh position={[0, 0.42, 0]}>
            <sphereGeometry args={[0.022, 8, 8]} />
            <meshStandardMaterial
              color="#ffd269"
              emissive={isLit ? '#ffaa2b' : '#4a3519'}
              emissiveIntensity={isLit ? 1.8 : 0.2}
            />
          </mesh>
        </group>
      );

    case 'samovar_set':
      return (
        <group>
          {/* Brass Tray */}
          <mesh position={[0, 0.015, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.26, 0.03, 20]} />
            <meshStandardMaterial color="#d4a84f" metalness={0.82} roughness={0.22} />
          </mesh>
          {/* Samovar Body */}
          <mesh position={[0, 0.03, 0]} geometry={samovarGeo} castShadow>
            <meshStandardMaterial color={item.color} metalness={0.85} roughness={0.22} />
          </mesh>
          {/* Teapot on top */}
          <mesh position={[0, 0.49, 0]} castShadow>
            <sphereGeometry args={[0.068, 12, 12]} />
            <meshStandardMaterial color="#f0e4d2" roughness={0.25} />
          </mesh>
          {/* Two Persian Tea Glasses */}
          {[0.16, -0.15].map((tx, i) => (
            <mesh key={i} position={[tx, 0.06, 0.12]}>
              <cylinderGeometry args={[0.026, 0.02, 0.065, 10]} />
              <meshPhysicalMaterial color="#a83520" transmission={0.3} roughness={0.1} />
            </mesh>
          ))}
        </group>
      );

    case 'copper_vessel':
      return (
        <group>
          <mesh position={[-0.08, 0.12, 0]} castShadow>
            <sphereGeometry args={[0.14, 14, 14]} />
            <meshStandardMaterial color={item.color} metalness={0.78} roughness={0.28} />
          </mesh>
          <mesh position={[0.12, 0.09, 0.06]} geometry={vaseGeo} scale={0.55} castShadow>
            <meshStandardMaterial color="#237a82" roughness={0.22} />
          </mesh>
        </group>
      );

    // -----------------------------------------------------------------
    // تخت خواب و آشپزخانه
    // -----------------------------------------------------------------
    case 'bed':
      return (
        <group>
          {/* Carved Wooden Bed Frame */}
          <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.95, 0.28, 2.25]} />
            <meshStandardMaterial map={woodTex} color="#54311d" roughness={0.52} />
          </mesh>
          {/* Carved Tall Headboard */}
          <mesh position={[0, 0.78, -1.06]} castShadow>
            <boxGeometry args={[2.02, 1.18, 0.12]} />
            <meshStandardMaterial map={woodTex} color="#4d2c19" roughness={0.52} />
          </mesh>
          {/* Mattress & Silk Duvet */}
          <mesh position={[0, 0.4, 0.03]} castShadow receiveShadow>
            <boxGeometry args={[1.8, 0.2, 2.08]} />
            <meshStandardMaterial color="#f5ede0" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.43, 0.34]} castShadow receiveShadow>
            <boxGeometry args={[1.84, 0.18, 1.44]} />
            <meshStandardMaterial color={item.color} roughness={0.76} />
          </mesh>
          {/* Pillows */}
          {[-0.44, 0.44].map((px, i) => (
            <mesh key={i} position={[px, 0.56, -0.76]} castShadow>
              <boxGeometry args={[0.65, 0.13, 0.42]} />
              <meshStandardMaterial color="#f7efe2" roughness={0.85} />
            </mesh>
          ))}
        </group>
      );

    case 'kitchen_counter':
      return (
        <group>
          <mesh position={[0, 0.45, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.25, 0.9, 0.72]} />
            <meshStandardMaterial map={woodTex} color={item.color} roughness={0.55} />
          </mesh>
          {/* Travertine Marble Countertop */}
          <mesh position={[0, 0.92, 0]} castShadow receiveShadow>
            <boxGeometry args={[2.32, 0.06, 0.78]} />
            <meshStandardMaterial color="#ede3d3" roughness={0.3} />
          </mesh>
          {/* Turquoise Tile Trim Strip */}
          <mesh position={[0, 0.46, 0.37]}>
            <boxGeometry args={[2.12, 0.64, 0.02]} />
            <meshStandardMaterial map={mosaicTex} roughness={0.3} />
          </mesh>
        </group>
      );

    // -----------------------------------------------------------------
    // وسایل گربه
    // -----------------------------------------------------------------
    case 'cat_basket':
      return (
        <group>
          <mesh position={[0, 0.11, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[0.45, 0.38, 0.2, 20]} />
            <meshStandardMaterial color="#c4945e" roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.15, 0]} receiveShadow>
            <cylinderGeometry args={[0.37, 0.35, 0.12, 20]} />
            <meshStandardMaterial color={item.color} roughness={0.9} />
          </mesh>
        </group>
      );

    case 'cat_tower':
      return (
        <group>
          <mesh position={[0, 0.04, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.72, 0.08, 0.62]} />
            <meshStandardMaterial color={item.color} roughness={0.85} />
          </mesh>
          <mesh position={[-0.16, 0.42, 0]} castShadow>
            <cylinderGeometry args={[0.06, 0.06, 0.74, 12]} />
            <meshStandardMaterial color="#b99262" roughness={0.92} />
          </mesh>
          <mesh position={[0.18, 0.28, 0]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.38, 16]} />
            <meshStandardMaterial color="#8d2433" roughness={0.85} />
          </mesh>
          <mesh position={[-0.16, 0.81, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.25, 0.06, 16]} />
            <meshStandardMaterial color="#f0e4d2" roughness={0.85} />
          </mesh>
        </group>
      );

    case 'cat_bowls':
      return (
        <group>
          <mesh position={[0, 0.02, 0]} receiveShadow>
            <boxGeometry args={[0.52, 0.03, 0.28]} />
            <meshStandardMaterial color="#4e2e1b" roughness={0.6} />
          </mesh>
          {[-0.13, 0.13].map((bx, i) => (
            <group key={i} position={[bx, 0.055, 0]}>
              <mesh castShadow>
                <cylinderGeometry args={[0.095, 0.075, 0.065, 16]} />
                <meshStandardMaterial color={item.color} roughness={0.28} />
              </mesh>
              <mesh position={[0, 0.025, 0]}>
                <cylinderGeometry args={[0.08, 0.08, 0.01, 14]} />
                <meshStandardMaterial color={i === 0 ? '#87c5d6' : '#a8673a'} roughness={0.35} />
              </mesh>
            </group>
          ))}
        </group>
      );

    case 'cat_toy':
      return (
        <group>
          <mesh position={[0, 0.1, 0]} castShadow>
            <sphereGeometry args={[0.11, 14, 14]} />
            <meshStandardMaterial color={item.color} roughness={0.9} />
          </mesh>
          <mesh position={[0.15, 0.04, 0.1]} rotation={[0, 0.6, 0]}>
            <sphereGeometry args={[0.055, 10, 10]} />
            <meshStandardMaterial color="#cfc8c2" roughness={0.85} />
          </mesh>
        </group>
      );

    // -----------------------------------------------------------------
    // حیاط، درختان باغ ایرانی و گلدان‌های گلخانه
    // -----------------------------------------------------------------
    case 'courtyard_bench':
      return (
        <group>
          {/* Traditional Persian Takht (تخت چوبی حیاط با قالی و پشتی) */}
          <mesh position={[0, 0.36, 0]} castShadow receiveShadow>
            <boxGeometry args={[1.65, 0.1, 0.88]} />
            <meshStandardMaterial map={woodTex} color={item.color} roughness={0.55} />
          </mesh>
          {[
            [-0.72, 0.18, -0.36],
            [0.72, 0.18, -0.36],
            [-0.72, 0.18, 0.36],
            [0.72, 0.18, 0.36],
          ].map((lp, i) => (
            <mesh key={i} position={lp as [number, number, number]} castShadow>
              <boxGeometry args={[0.1, 0.36, 0.1]} />
              <meshStandardMaterial color="#4a2a17" roughness={0.6} />
            </mesh>
          ))}
          <mesh position={[0, 0.425, 0]} receiveShadow>
            <boxGeometry args={[1.52, 0.03, 0.76]} />
            <meshStandardMaterial map={termehTex} roughness={0.85} />
          </mesh>
          <mesh position={[0, 0.54, -0.32]} castShadow>
            <boxGeometry args={[1.46, 0.24, 0.14]} />
            <meshStandardMaterial map={termehTex} roughness={0.82} />
          </mesh>
        </group>
      );

    case 'tree_pomegranate':
    case 'tree_orange': {
      const isPomegranate = item.kind === 'tree_pomegranate';
      const fruitColor = isPomegranate ? '#b82128' : '#eb7d1c';
      return (
        <group>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.075, 0.12, 1.1, 10]} />
            <meshStandardMaterial color="#593a27" roughness={0.88} />
          </mesh>
          {[
            [0, 1.38, 0, 0.56],
            [-0.28, 1.18, 0.18, 0.38],
            [0.3, 1.24, -0.15, 0.4],
            [0.05, 1.56, 0.15, 0.35],
          ].map(([cx, cy, cz, r], i) => (
            <mesh key={i} position={[cx, cy, cz]} castShadow>
              <dodecahedronGeometry args={[r, 1]} />
              <meshStandardMaterial color={i % 2 === 0 ? '#31613b' : '#3d7548'} roughness={0.82} />
            </mesh>
          ))}
          {/* Fruits (انار یا نارنج) */}
          {[
            [0.32, 1.28, 0.26],
            [-0.3, 1.2, 0.28],
            [0.12, 1.52, -0.25],
            [-0.18, 1.44, -0.2],
            [0.24, 1.12, -0.24],
          ].map(([fx, fy, fz], i) => (
            <mesh key={i} position={[fx, fy, fz]} castShadow>
              <sphereGeometry args={[0.072, 10, 10]} />
              <meshStandardMaterial color={fruitColor} roughness={0.42} />
            </mesh>
          ))}
        </group>
      );
    }

    case 'tree_cypress':
      return (
        <group>
          <mesh position={[0, 0.45, 0]} castShadow>
            <cylinderGeometry args={[0.08, 0.11, 0.9, 10]} />
            <meshStandardMaterial color="#4e3222" roughness={0.9} />
          </mesh>
          <mesh position={[0, 1.9, 0]} castShadow>
            <coneGeometry args={[0.48, 2.5, 12]} />
            <meshStandardMaterial color="#234832" roughness={0.85} />
          </mesh>
          <mesh position={[0, 1.25, 0]} castShadow>
            <coneGeometry args={[0.56, 1.5, 12]} />
            <meshStandardMaterial color="#2c593d" roughness={0.85} />
          </mesh>
        </group>
      );

    case 'flower_pot_clay':
    case 'flower_pot_turquoise':
    case 'greenhouse_planter': {
      const speciesMeta = item.plantSpecies ? PLANT_SPECIES_INFO[item.plantSpecies] : null;
      const potInfo = item.potStyle ? POT_STYLES_INFO.find((p) => p.id === item.potStyle) : null;
      const potColor = potInfo?.color ?? item.color;
      const bloomColor = speciesMeta?.color ?? (item.kind === 'flower_pot_turquoise' ? '#cf3c54' : '#e68c9e');
      return (
        <group>
          <mesh position={[0, 0.19, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.17, 0.38, 16]} />
            <meshStandardMaterial
              color={potColor}
              roughness={item.kind === 'flower_pot_turquoise' ? 0.24 : 0.7}
              metalness={item.potStyle === 'gold_trimmed' ? 0.55 : 0.05}
            />
          </mesh>
          <mesh position={[0, 0.37, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.03, 14]} />
            <meshStandardMaterial color="#453023" roughness={0.95} />
          </mesh>
          {/* Leaves */}
          {[0, 1, 2, 3, 4].map((li) => {
            const a = (li / 5) * Math.PI * 2;
            return (
              <mesh key={li} position={[Math.cos(a) * 0.13, 0.48, Math.sin(a) * 0.13]} rotation={[0.5, a, 0]}>
                <sphereGeometry args={[0.1, 8, 8]} />
                <meshStandardMaterial color="#3c7348" roughness={0.68} />
              </mesh>
            );
          })}
          {/* Multi-bloom top */}
          {[
            [0, 0.65, 0, 0.095],
            [-0.1, 0.58, 0.09, 0.072],
            [0.11, 0.6, -0.07, 0.075],
          ].map(([bx, by, bz, br], bi) => (
            <mesh key={bi} position={[bx, by, bz]} castShadow>
              <dodecahedronGeometry args={[br, 0]} />
              <meshStandardMaterial
                color={bloomColor}
                emissive={speciesMeta?.rare ? bloomColor : '#000000'}
                emissiveIntensity={speciesMeta?.rare ? 0.4 : 0}
                roughness={0.38}
              />
            </mesh>
          ))}
        </group>
      );
    }

    case 'plant_monstera':
    case 'plant_fern':
    default:
      return (
        <group>
          <mesh position={[0, 0.19, 0]} castShadow>
            <cylinderGeometry args={[0.25, 0.18, 0.38, 16]} />
            <meshStandardMaterial color="#be724f" roughness={0.72} />
          </mesh>
          {[0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 6) * Math.PI * 2;
            return (
              <mesh
                key={i}
                position={[Math.cos(a) * 0.18, 0.52 + (i % 2) * 0.1, Math.sin(a) * 0.18]}
                rotation={[0.45, a, 0]}
                scale={[1, 0.4, 1.4]}
                castShadow
              >
                <sphereGeometry args={[0.16, 8, 8]} />
                <meshStandardMaterial color={item.color} roughness={0.62} />
              </mesh>
            );
          })}
        </group>
      );
  }
}

export const MansionFurnitureItem: React.FC<MansionFurnitureItemProps> = ({
  item,
  selected,
  editMode,
  timeMode,
  onPointerStart,
}) => {
  const meta = getCatalogMeta(item.kind);
  const scale = item.scale ?? meta.defaultScale;
  const ringRadius = Math.max(0.32, meta.radius * 0.92);

  return (
    <group
      position={item.position}
      rotation={[0, item.rotationY, 0]}
      scale={scale}
      onPointerDown={(e) => {
        if (!editMode) return;
        e.stopPropagation();
        audioEngine.playSfx('click');
        onPointerStart(item.uid, e);
      }}
    >
      <FurnitureModel item={item} timeMode={timeMode} />

      {selected && editMode && (
        <group position={[0, 0.03, 0]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[ringRadius, ringRadius + 0.085, 32]} />
            <meshBasicMaterial color="#d9aa4e" side={THREE.DoubleSide} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[ringRadius, 32]} />
            <meshBasicMaterial color="#d9aa4e" transparent opacity={0.14} side={THREE.DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  );
};

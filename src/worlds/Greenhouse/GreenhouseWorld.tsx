import React, { useEffect, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { Droplets, Sprout, Trash2 } from 'lucide-react';
import { SceneCanvas } from '../../components/SceneCanvas';
import { useUniverseStore } from '../../core/store';
import { toPersianDigits } from '../../core/persianUtils';
import { audioEngine } from '../../systems/audioEngine';
import type { PlantSlot, PlantSpecies, PotStyle } from '../../core/types';

const SPECIES_INFO: Record<PlantSpecies, { label: string; color: string; rare?: boolean }> = {
  dream_rose: { label: 'رز رؤیایی', color: '#D9A9C5' },
  moon_lavender: { label: 'اسطوخودوس مهتاب', color: '#7771A8' },
  crystal_lotus: { label: 'نیلوفر بلورین', color: '#a8e0e8', rare: true },
  golden_sun: { label: 'آفتابگردان طلایی', color: '#D6B875' },
  night_orchid: { label: 'ارکیده شب', color: '#c486d9', rare: true },
  star_cactus: { label: 'کاکتوس ستاره‌ای', color: '#A6BBAA' },
};

const POT_STYLES: { id: PotStyle; label: string; color: string }[] = [
  { id: 'terracotta', label: 'سفال گرم', color: '#c97e5d' },
  { id: 'rose_ceramic', label: 'سرامیک رز', color: '#D9A9C5' },
  { id: 'gold_trimmed', label: 'طلاکوب', color: '#D6B875' },
  { id: 'mossy_stone', label: 'سنگ خزه‌دار', color: '#8a9c8e' },
];

const SLOT_COORDS: [number, number, number][] = [
  [-2.2, 0.72, -1.0],
  [0, 0.72, -1.0],
  [2.2, 0.72, -1.0],
  [-2.2, 0.72, 1.2],
  [0, 0.72, 1.2],
  [2.2, 0.72, 1.2],
];

function PlantPot3D({
  slot,
  position,
  selected,
  watering,
  onSelect,
}: {
  slot: PlantSlot;
  position: [number, number, number];
  selected: boolean;
  watering: boolean;
  onSelect: () => void;
}) {
  const plantRef = useRef<THREE.Group>(null);
  const dropsRef = useRef<THREE.Group>(null);

  const potColor = POT_STYLES.find((p) => p.id === slot.potStyle)?.color || '#c97e5d';
  const flowerMeta = slot.species ? SPECIES_INFO[slot.species] : null;
  const stageFactor = Math.max(0.15, slot.growthProgress / 100);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (plantRef.current) {
      plantRef.current.rotation.z = Math.sin(t * 1.4 + slot.slotIndex) * 0.04;
    }
    if (dropsRef.current && watering) {
      dropsRef.current.children.forEach((d, i) => {
        d.position.y = 1.4 - ((t * 2.2 + i * 0.25) % 1.1);
      });
    }
  });

  return (
    <group
      position={position}
      onClick={(e) => {
        e.stopPropagation();
        audioEngine.playSfx('click');
        onSelect();
      }}
    >
      {selected && (
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.52, 0.62, 24]} />
          <meshBasicMaterial color="#D6B875" side={THREE.DoubleSide} />
        </mesh>
      )}

      {/* Pot */}
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.36, 0.26, 0.44, 18]} />
        <meshStandardMaterial color={potColor} roughness={slot.potStyle === 'gold_trimmed' ? 0.25 : 0.65} metalness={slot.potStyle === 'gold_trimmed' ? 0.65 : 0.05} />
      </mesh>
      {/* Soil */}
      <mesh position={[0, 0.43, 0]}>
        <cylinderGeometry args={[0.32, 0.32, 0.04, 16]} />
        <meshStandardMaterial color="#4a3428" roughness={0.95} />
      </mesh>

      {/* Growing Plant */}
      {slot.species && flowerMeta && (
        <group ref={plantRef} position={[0, 0.45, 0]}>
          {/* Stem */}
          <mesh position={[0, 0.32 * stageFactor, 0]} castShadow>
            <cylinderGeometry args={[0.025, 0.04, 0.65 * stageFactor, 8]} />
            <meshStandardMaterial color="#6e9674" roughness={0.7} />
          </mesh>

          {/* Leaves appear >= 25% */}
          {slot.growthProgress >= 20 && (
            <>
              <mesh position={[0.14 * stageFactor, 0.25 * stageFactor, 0]} rotation={[0, 0, -0.6]}>
                <sphereGeometry args={[0.14 * stageFactor, 10, 10]} />
                <meshStandardMaterial color="#87b08e" roughness={0.6} />
              </mesh>
              <mesh position={[-0.14 * stageFactor, 0.32 * stageFactor, 0]} rotation={[0, 0, 0.6]}>
                <sphereGeometry args={[0.14 * stageFactor, 10, 10]} />
                <meshStandardMaterial color="#87b08e" roughness={0.6} />
              </mesh>
            </>
          )}

          {/* Bud / Full Bloom >= 55% */}
          {slot.growthProgress >= 50 && (
            <group position={[0, 0.68 * stageFactor, 0]}>
              <mesh>
                <dodecahedronGeometry args={[0.18 * stageFactor, 0]} />
                <meshStandardMaterial
                  color={flowerMeta.color}
                  emissive={flowerMeta.rare ? flowerMeta.color : '#000000'}
                  emissiveIntensity={flowerMeta.rare ? 0.55 : 0}
                  roughness={0.35}
                />
              </mesh>
              {slot.growthProgress >= 82 &&
                [0, 1, 2, 3, 4, 5].map((p) => {
                  const a = (p / 6) * Math.PI * 2;
                  return (
                    <mesh
                      key={p}
                      position={[Math.cos(a) * 0.19, 0.02, Math.sin(a) * 0.19]}
                      rotation={[0.4, a, 0]}
                    >
                      <sphereGeometry args={[0.11, 10, 10]} />
                      <meshStandardMaterial color={flowerMeta.color} roughness={0.35} />
                    </mesh>
                  );
                })}
            </group>
          )}
        </group>
      )}

      {/* Water droplets animation */}
      {watering && (
        <group ref={dropsRef}>
          {[0, 1, 2, 3, 4].map((i) => (
            <mesh key={i} position={[(i - 2) * 0.08, 1.2, (i % 2) * 0.06]}>
              <sphereGeometry args={[0.035, 8, 8]} />
              <meshBasicMaterial color="#9ae0f5" />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

function GreenhouseSceneContent({
  selectedSlot,
  onSelectSlot,
  wateringSlot,
}: {
  selectedSlot: number;
  onSelectSlot: (idx: number) => void;
  wateringSlot: number | null;
}) {
  const greenhouse = useUniverseStore((s) => s.greenhouse);

  return (
    <>
      <ambientLight intensity={greenhouse.theme === 'firefly' ? 0.35 : 0.55} color="#F1DCCB" />
      <hemisphereLight args={['#e6f5ea', '#273830', 0.7]} />
      <directionalLight position={[5, 10, 4]} intensity={greenhouse.theme === 'firefly' ? 0.8 : 1.35} color="#fff2d6" castShadow />

      {greenhouse.theme === 'firefly' && (
        <Sparkles count={75} scale={[9, 5, 8]} size={3.2} speed={0.4} color="#D6B875" />
      )}

      {/* Stone Greenhouse Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[8.5, 36]} />
        <meshStandardMaterial color="#58695c" roughness={0.88} />
      </mesh>

      {/* Glass Dome Arches */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} rotation={[0, (i / 4) * Math.PI, 0]}>
          <torusGeometry args={[6.8, 0.08, 8, 40, Math.PI]} />
          <meshStandardMaterial color="#A6BBAA" metalness={0.5} roughness={0.35} />
        </mesh>
      ))}
      <mesh>
        <sphereGeometry args={[6.75, 24, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshPhysicalMaterial color="#dff2e7" transparent opacity={0.18} roughness={0.1} side={THREE.DoubleSide} />
      </mesh>

      {/* Two Wooden Potting Benches */}
      {[-1.0, 1.2].map((bz, idx) => (
        <group key={idx} position={[0, 0, bz]}>
          <mesh position={[0, 0.68, 0]} castShadow receiveShadow>
            <boxGeometry args={[6.2, 0.1, 1.25]} />
            <meshStandardMaterial color="#9c7353" roughness={0.68} />
          </mesh>
          {[-2.8, 2.8].map((lx) => (
            <mesh key={lx} position={[lx, 0.34, 0]} castShadow>
              <boxGeometry args={[0.14, 0.68, 1.05]} />
              <meshStandardMaterial color="#6e4e37" roughness={0.75} />
            </mesh>
          ))}
        </group>
      ))}

      {greenhouse.slots.map((slot, idx) => (
        <PlantPot3D
          key={slot.slotIndex}
          slot={slot}
          position={SLOT_COORDS[idx]}
          selected={selectedSlot === slot.slotIndex}
          watering={wateringSlot === slot.slotIndex}
          onSelect={() => onSelectSlot(slot.slotIndex)}
        />
      ))}

      <OrbitControls enableDamping dampingFactor={0.05} minDistance={3.2} maxDistance={10} maxPolarAngle={Math.PI * 0.46} target={[0, 0.9, 0.1]} />
    </>
  );
}

export const GreenhouseWorld: React.FC = () => {
  const greenhouse = useUniverseStore((s) => s.greenhouse);
  const plantSeed = useUniverseStore((s) => s.plantSeed);
  const waterPlant = useUniverseStore((s) => s.waterPlant);
  const changePotStyle = useUniverseStore((s) => s.changePotStyle);
  const clearPlantSlot = useUniverseStore((s) => s.clearPlantSlot);
  const setGreenhouseTheme = useUniverseStore((s) => s.setGreenhouseTheme);
  const tickGreenhouseGrowth = useUniverseStore((s) => s.tickGreenhouseGrowth);

  const [selectedSlotIdx, setSelectedSlotIdx] = useState(0);
  const [wateringSlot, setWateringSlot] = useState<number | null>(null);
  const [dockOpen, setDockOpen] = useState(true);

  useEffect(() => {
    tickGreenhouseGrowth();
    const id = window.setInterval(tickGreenhouseGrowth, 10000);
    return () => window.clearInterval(id);
  }, [tickGreenhouseGrowth]);

  const activeSlot = greenhouse.slots[selectedSlotIdx];
  const stageText =
    !activeSlot.species
      ? 'گلدان خالی'
      : activeSlot.growthProgress >= 82
        ? 'شکوفه کامل'
        : activeSlot.growthProgress >= 50
          ? 'غنچه'
          : activeSlot.growthProgress >= 20
            ? 'جوانه'
            : 'بذر تازه‌کاشته';

  return (
    <div className="relative w-full h-full">
      <SceneCanvas
        cameraPosition={[0, 3.6, 6.2]}
        fov={46}
        bgColor={greenhouse.theme === 'firefly' ? '#141e21' : '#263834'}
      >
        <GreenhouseSceneContent
          selectedSlot={selectedSlotIdx}
          onSelectSlot={setSelectedSlotIdx}
          wateringSlot={wateringSlot}
        />
      </SceneCanvas>

      {/* Active Pot Inspector Card */}
      <div className="fixed top-16 sm:top-20 right-3 sm:right-5 z-20 w-56 sm:w-64 rounded-2xl bg-[#17172F]/92 border border-[#A6BBAA]/45 p-3.5 shadow-xl space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-bold text-sm text-[#F1DCCB]">
            گلدان شماره {toPersianDigits(selectedSlotIdx + 1)}
          </div>
          {activeSlot.species && (
            <button
              type="button"
              onClick={() => clearPlantSlot(selectedSlotIdx)}
              className="p-1.5 rounded-lg bg-[#2f2338] text-[#D9A9C5] cursor-pointer"
              title="خالی کردن گلدان"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="text-xs text-[#A6BBAA]">
          {activeSlot.species ? SPECIES_INFO[activeSlot.species].label : 'آماده کاشت بذر جدید'} · {stageText}
        </div>

        {activeSlot.species && (
          <div className="space-y-1.5 pt-1">
            <div className="flex justify-between text-[11px] text-[#F1DCCB]">
              <span>رشد گیاه</span>
              <span className="tabular-nums">{toPersianDigits(activeSlot.growthProgress)}٪</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#242942] overflow-hidden">
              <div className="h-full bg-[#A6BBAA] transition-all" style={{ width: `${activeSlot.growthProgress}%` }} />
            </div>
            <div className="flex justify-between text-[11px] text-[#F1DCCB]">
              <span>رطوبت خاک</span>
              <span className="tabular-nums">{toPersianDigits(activeSlot.hydration)}٪</span>
            </div>
            <div className="h-1.5 rounded-full bg-[#242942] overflow-hidden">
              <div className="h-full bg-[#77b6d4] transition-all" style={{ width: `${activeSlot.hydration}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Collapsible Bottom Control Dock */}
      <div className="fixed bottom-3 inset-x-0 z-20 flex flex-col items-center px-3 pointer-events-none">
        <button
          type="button"
          onClick={() => setDockOpen((v) => !v)}
          className="pointer-events-auto mb-1.5 px-3 py-1 rounded-t-xl bg-[#17172F]/90 border border-b-0 border-[#A6BBAA]/40 text-[11px] text-[#F1DCCB] cursor-pointer"
        >
          {dockOpen ? 'جمع کردن ابزار باغبانی' : 'باز کردن کاشت و آبیاری'}
        </button>

        {dockOpen && (
          <div className="pointer-events-auto w-full max-w-3xl rounded-2xl bg-[#17172F]/92 border border-[#A6BBAA]/40 p-3 shadow-2xl space-y-2.5">
            {!activeSlot.species ? (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                <span className="text-xs text-[#D6B875] shrink-0 flex items-center gap-1">
                  <Sprout className="w-3.5 h-3.5" />
                  کاشت بذر:
                </span>
                {(Object.keys(SPECIES_INFO) as PlantSpecies[]).map((sp) => (
                  <button
                    key={sp}
                    type="button"
                    onClick={() => {
                      plantSeed(selectedSlotIdx, sp);
                      audioEngine.playSfx('sparkle');
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#222940] hover:bg-[#2c3852] border border-[#A6BBAA]/35 text-xs text-[#F1DCCB] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    {SPECIES_INFO[sp].label} {SPECIES_INFO[sp].rare ? '(کمیاب)' : ''}
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    waterPlant(selectedSlotIdx);
                    setWateringSlot(selectedSlotIdx);
                    audioEngine.playSfx('water');
                    window.setTimeout(() => setWateringSlot(null), 1600);
                  }}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#A6BBAA] text-[#17172F] text-xs font-bold cursor-pointer"
                >
                  <Droplets className="w-4 h-4" />
                  <span>آبیاری گیاه</span>
                </button>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-[#D6B875]">گلدان:</span>
                  {POT_STYLES.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => changePotStyle(selectedSlotIdx, p.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs cursor-pointer ${
                        activeSlot.potStyle === p.id ? 'bg-[#D9A9C5] text-[#17172F] font-bold' : 'bg-[#212142] text-[#F1DCCB]'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between gap-2 border-t border-[#7771A8]/25 pt-2 flex-wrap">
              <span className="text-xs text-[#D6B875]">فضای گلخانه:</span>
              <div className="flex items-center gap-1.5">
                {(
                  [
                    ['sunny', 'آفتاب بهاری'],
                    ['misty', 'مه صبحگاهی'],
                    ['firefly', 'شب کرم‌شب‌تاب'],
                  ] as const
                ).map(([tId, label]) => (
                  <button
                    key={tId}
                    type="button"
                    onClick={() => setGreenhouseTheme(tId)}
                    className={`px-3 py-1.5 rounded-xl text-xs cursor-pointer ${
                      greenhouse.theme === tId ? 'bg-[#7771A8] text-[#F1DCCB] font-semibold' : 'bg-[#212142] text-[#D9A9C5]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

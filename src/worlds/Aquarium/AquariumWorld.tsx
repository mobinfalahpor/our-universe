import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { Fish, Plus, Sparkles as SparklesIcon, Trash2 } from 'lucide-react';
import { SceneCanvas } from '../../components/SceneCanvas';
import { useUniverseStore } from '../../core/store';
import { toPersianDigits } from '../../core/persianUtils';
import { audioEngine } from '../../systems/audioEngine';
import type { AquariumDecor, AquariumDecorKind, AquariumFish, FishSpecies } from '../../core/types';

const FISH_CATALOG: { species: FishSpecies; label: string; color: string; accent: string }[] = [
  { species: 'clown', label: 'دلقک‌ماهی', color: '#eb7d4b', accent: '#ffffff' },
  { species: 'angelfish', label: 'فرشته‌ماهی طلایی', color: '#D6B875', accent: '#F1DCCB' },
  { species: 'betta', label: 'بتای اسطوخودوسی', color: '#7771A8', accent: '#D9A9C5' },
  { species: 'neon', label: 'ماهی نئون', color: '#6fd0e8', accent: '#D9A9C5' },
  { species: 'turtle', label: 'لاک‌پشت کوچولو', color: '#8ba88e', accent: '#627d65' },
];

const DECOR_CATALOG: { kind: AquariumDecorKind; label: string }[] = [
  { kind: 'coral_pink', label: 'مرجان صورتی' },
  { kind: 'coral_lavender', label: 'مرجان بنفش' },
  { kind: 'shell_pearl', label: 'صدف مروارید' },
  { kind: 'sea_rock', label: 'صخره دریایی' },
  { kind: 'kelp_clump', label: 'گیاه دریایی' },
];

function SwimmingFish3D({
  fish,
  index,
  feeding,
}: {
  fish: AquariumFish;
  index: number;
  feeding: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const tailRef = useRef<THREE.Mesh>(null);
  const meta = FISH_CATALOG.find((f) => f.species === fish.species) || FISH_CATALOG[0];

  const swimParams = useMemo(
    () => ({
      rx: 1.6 + (index % 3) * 0.85,
      rz: 1.1 + (index % 2) * 0.7,
      speed: 0.45 + (index % 4) * 0.12,
      yBase: -0.6 + (index % 4) * 0.55,
      phase: index * 1.4,
    }),
    [index]
  );

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!groupRef.current) return;

    const a = t * swimParams.speed + swimParams.phase;
    const x = Math.cos(a) * swimParams.rx;
    const z = Math.sin(a * 1.2) * swimParams.rz;
    const targetY = feeding ? 0.85 + Math.sin(t * 2 + index) * 0.25 : swimParams.yBase + Math.sin(t * 1.5 + index) * 0.2;

    const prevX = groupRef.current.position.x;
    const prevZ = groupRef.current.position.z;

    groupRef.current.position.x = THREE.MathUtils.lerp(prevX, x, 0.08);
    groupRef.current.position.z = THREE.MathUtils.lerp(prevZ, z, 0.08);
    groupRef.current.position.y = THREE.MathUtils.lerp(groupRef.current.position.y, targetY, 0.04);

    const dx = groupRef.current.position.x - prevX;
    const dz = groupRef.current.position.z - prevZ;
    if (Math.hypot(dx, dz) > 0.001) {
      groupRef.current.rotation.y = Math.atan2(dx, dz);
    }

    if (tailRef.current) {
      tailRef.current.rotation.y = Math.sin(t * 9 + index) * 0.4;
    }
  });

  if (fish.species === 'turtle') {
    return (
      <group ref={groupRef} scale={fish.size}>
        <mesh scale={[1, 0.55, 1.2]} castShadow>
          <sphereGeometry args={[0.32, 16, 16]} />
          <meshStandardMaterial color={meta.accent} roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.02, 0.34]}>
          <sphereGeometry args={[0.12, 12, 12]} />
          <meshStandardMaterial color={meta.color} roughness={0.55} />
        </mesh>
        <mesh ref={tailRef} position={[0, -0.04, -0.35]} rotation={[0.2, 0, 0]}>
          <coneGeometry args={[0.06, 0.16, 8]} />
          <meshStandardMaterial color={meta.color} />
        </mesh>
      </group>
    );
  }

  return (
    <group ref={groupRef} scale={fish.size}>
      {/* Body */}
      <mesh scale={[0.7, 0.95, 1.45]} castShadow>
        <sphereGeometry args={[0.2, 16, 16]} />
        <meshStandardMaterial color={meta.color} roughness={0.3} metalness={0.1} />
      </mesh>
      {/* Stripe / Fin */}
      <mesh position={[0, 0.18, 0]} rotation={[0.3, 0, 0]}>
        <coneGeometry args={[0.08, 0.22, 6]} />
        <meshStandardMaterial color={meta.accent} roughness={0.4} />
      </mesh>
      {/* Tail Fin */}
      <mesh ref={tailRef} position={[0, 0, -0.32]} rotation={[Math.PI / 2, 0, 0]}>
        <coneGeometry args={[0.16, 0.24, 6]} />
        <meshStandardMaterial color={meta.accent} roughness={0.35} />
      </mesh>
      {/* Eye */}
      <mesh position={[0.1, 0.05, 0.18]}>
        <sphereGeometry args={[0.032, 8, 8]} />
        <meshBasicMaterial color="#17172F" />
      </mesh>
      <mesh position={[-0.1, 0.05, 0.18]}>
        <sphereGeometry args={[0.032, 8, 8]} />
        <meshBasicMaterial color="#17172F" />
      </mesh>
    </group>
  );
}

function CoralAndDecor3D({
  dec,
  selected,
  onSelect,
}: {
  dec: AquariumDecor;
  selected: boolean;
  onSelect: () => void;
}) {
  const kelpRef = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (kelpRef.current) {
      kelpRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 1.6 + dec.position[0]) * 0.12;
    }
  });

  return (
    <group
      position={dec.position}
      rotation={[0, dec.rotationY, 0]}
      scale={dec.scale}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      {selected && (
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.5, 0.6, 20]} />
          <meshBasicMaterial color="#D6B875" side={THREE.DoubleSide} />
        </mesh>
      )}

      {(dec.kind === 'coral_pink' || dec.kind === 'coral_lavender') && (
        <group>
          {[0, 1, 2, 3].map((i) => (
            <mesh
              key={i}
              position={[(i - 1.5) * 0.15, 0.35 + (i % 2) * 0.15, ((i % 3) - 1) * 0.1]}
              rotation={[0.2 * (i - 1), 0, 0.18 * (i - 1.5)]}
            >
              <capsuleGeometry args={[0.08, 0.45, 6, 10]} />
              <meshStandardMaterial color={dec.kind === 'coral_pink' ? '#D9A9C5' : '#7771A8'} roughness={0.65} />
            </mesh>
          ))}
        </group>
      )}

      {dec.kind === 'shell_pearl' && (
        <group>
          <mesh rotation={[0.15, 0, 0]}>
            <cylinderGeometry args={[0.42, 0.18, 0.12, 12]} />
            <meshStandardMaterial color="#F1DCCB" roughness={0.4} />
          </mesh>
          <mesh position={[0, 0.16, 0]}>
            <sphereGeometry args={[0.14, 16, 16]} />
            <meshPhysicalMaterial color="#fff8f2" roughness={0.1} clearcoat={1} />
          </mesh>
        </group>
      )}

      {dec.kind === 'sea_rock' && (
        <mesh position={[0, 0.25, 0]}>
          <dodecahedronGeometry args={[0.45, 0]} />
          <meshStandardMaterial color="#585a78" roughness={0.9} flatShading />
        </mesh>
      )}

      {dec.kind === 'kelp_clump' && (
        <group ref={kelpRef}>
          {[-0.12, 0, 0.12].map((kx, i) => (
            <mesh key={i} position={[kx, 0.75 + i * 0.1, (i - 1) * 0.08]}>
              <capsuleGeometry args={[0.06, 1.35, 6, 10]} />
              <meshStandardMaterial color="#7da886" roughness={0.65} />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

function AquariumSceneContent({
  feeding,
  selectedDecorId,
  onSelectDecor,
}: {
  feeding: boolean;
  selectedDecorId: string | null;
  onSelectDecor: (id: string | null) => void;
}) {
  const aquarium = useUniverseStore((s) => s.aquarium);
  const moveAquariumDecor = useUniverseStore((s) => s.moveAquariumDecor);
  const bubblesRef = useRef<THREE.Group>(null);
  const foodRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (bubblesRef.current) {
      bubblesRef.current.children.forEach((b, i) => {
        b.position.y = -1.6 + ((t * (0.65 + (i % 3) * 0.15) + i * 0.45) % 3.4);
      });
    }
    if (foodRef.current && feeding) {
      foodRef.current.children.forEach((f, i) => {
        f.position.y = 1.6 - ((t * 0.8 + i * 0.2) % 2.4);
      });
    }
  });

  const lightTint =
    aquarium.lightMode === 'deep_moon'
      ? '#4b5591'
      : aquarium.lightMode === 'coral_glow'
        ? '#b57ba6'
        : '#6bc4d6';

  return (
    <>
      <ambientLight intensity={0.48} color={lightTint} />
      <hemisphereLight args={[lightTint, '#17172F', 0.75]} />
      <directionalLight position={[2, 8, 4]} intensity={1.3} color="#d4f4ff" castShadow />

      <Sparkles count={40} scale={[8, 4, 5]} size={2} speed={0.2} color="#b8f0ff" />

      {/* Sandy Seabed */}
      <mesh
        position={[0, -1.75, 0]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
        onClick={(e) => {
          if (selectedDecorId) {
            e.stopPropagation();
            moveAquariumDecor(selectedDecorId, [
              THREE.MathUtils.clamp(e.point.x, -3.5, 3.5),
              -1.65,
              THREE.MathUtils.clamp(e.point.z, -1.8, 1.8),
            ]);
          }
        }}
      >
        <planeGeometry args={[8.4, 4.8]} />
        <meshStandardMaterial color="#e0cbb3" roughness={0.95} />
      </mesh>

      {/* Glass Tank Frame */}
      <mesh position={[0, 0.15, 0]}>
        <boxGeometry args={[8.5, 3.85, 4.9]} />
        <meshPhysicalMaterial
          color={lightTint}
          transparent
          opacity={0.14 + (100 - aquarium.waterClarity) * 0.003}
          roughness={0.08}
          side={THREE.BackSide}
        />
      </mesh>

      {/* Rising Bubbles */}
      <group ref={bubblesRef}>
        {Array.from({ length: 18 }).map((_, i) => (
          <mesh key={i} position={[((i % 6) - 2.5) * 1.2, -1.5, ((i % 3) - 1) * 1.1]}>
            <sphereGeometry args={[0.045 + (i % 3) * 0.02, 10, 10]} />
            <meshPhysicalMaterial color="#ffffff" transparent opacity={0.55} roughness={0.05} />
          </mesh>
        ))}
      </group>

      {/* Fish Food Flakes */}
      {feeding && (
        <group ref={foodRef}>
          {Array.from({ length: 10 }).map((_, i) => (
            <mesh key={i} position={[(i - 4.5) * 0.45, 1.4, (i % 3) * 0.4 - 0.4]}>
              <boxGeometry args={[0.06, 0.03, 0.06]} />
              <meshStandardMaterial color="#D6B875" />
            </mesh>
          ))}
        </group>
      )}

      {/* Decor */}
      {aquarium.decor.map((dec) => (
        <CoralAndDecor3D
          key={dec.id}
          dec={dec}
          selected={selectedDecorId === dec.id}
          onSelect={() => onSelectDecor(selectedDecorId === dec.id ? null : dec.id)}
        />
      ))}

      {/* Swimming Fish */}
      {aquarium.fish.map((fish, idx) => (
        <SwimmingFish3D key={fish.id} fish={fish} index={idx} feeding={feeding} />
      ))}

      <OrbitControls enableDamping dampingFactor={0.05} minDistance={4.2} maxDistance={11} maxPolarAngle={Math.PI * 0.6} target={[0, -0.2, 0]} />
    </>
  );
}

export const AquariumWorld: React.FC = () => {
  const aquarium = useUniverseStore((s) => s.aquarium);
  const addFish = useUniverseStore((s) => s.addFish);
  const removeFish = useUniverseStore((s) => s.removeFish);
  const addAquariumDecor = useUniverseStore((s) => s.addAquariumDecor);
  const removeAquariumDecor = useUniverseStore((s) => s.removeAquariumDecor);
  const cleanAquarium = useUniverseStore((s) => s.cleanAquarium);
  const setAquariumLight = useUniverseStore((s) => s.setAquariumLight);
  const addStars = useUniverseStore((s) => s.addStars);

  const [feeding, setFeeding] = useState(false);
  const [selectedDecorId, setSelectedDecorId] = useState<string | null>(null);
  const [tab, setTab] = useState<'care' | 'fish' | 'decor'>('care');
  const [dockOpen, setDockOpen] = useState(true);

  const handleFeed = () => {
    setFeeding(true);
    addStars(5);
    audioEngine.playSfx('water');
    window.setTimeout(() => setFeeding(false), 3800);
  };

  return (
    <div className="relative w-full h-full">
      <SceneCanvas
        cameraPosition={[0, 1.2, 7.6]}
        fov={46}
        bgColor={aquarium.lightMode === 'deep_moon' ? '#101533' : '#182b45'}
        fogNear={10}
        fogFar={32}
      >
        <AquariumSceneContent
          feeding={feeding}
          selectedDecorId={selectedDecorId}
          onSelectDecor={setSelectedDecorId}
        />
      </SceneCanvas>

      {/* Top-Right Tank Clarity & Fish Count */}
      <div className="fixed top-16 sm:top-20 right-3 sm:right-5 z-20 rounded-2xl bg-[#17172F]/90 border border-[#A6BBAA]/40 px-4 py-2.5 text-xs text-[#F1DCCB] space-y-1">
        <div>
          تعداد آبزیان: <span className="font-bold text-[#D6B875] tabular-nums">{toPersianDigits(aquarium.fish.length)}</span>
        </div>
        <div>
          شفافیت آب: <span className="font-bold text-[#A6BBAA] tabular-nums">{toPersianDigits(aquarium.waterClarity)}٪</span>
        </div>
      </div>

      {/* Selected Decor Remove Action */}
      {selectedDecorId && (
        <div className="fixed top-16 sm:top-20 left-3 sm:left-5 z-20 flex items-center gap-2 rounded-2xl bg-[#17172F]/92 border border-[#D6B875]/50 px-3 py-2 text-xs text-[#F1DCCB]">
          <span>روی کف شنی کلیک کن تا جابه‌جا شود</span>
          <button
            type="button"
            onClick={() => {
              removeAquariumDecor(selectedDecorId);
              setSelectedDecorId(null);
            }}
            className="p-1.5 rounded-lg bg-[#38233a] text-[#D9A9C5] cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Collapsible Bottom Control Dock */}
      <div className="fixed bottom-3 inset-x-0 z-20 flex flex-col items-center px-3 pointer-events-none">
        <button
          type="button"
          onClick={() => setDockOpen((v) => !v)}
          className="pointer-events-auto mb-1.5 px-3 py-1 rounded-t-xl bg-[#17172F]/90 border border-b-0 border-[#A6BBAA]/40 text-[11px] text-[#F1DCCB] cursor-pointer"
        >
          {dockOpen ? 'جمع کردن ابزار آکواریوم' : 'باز کردن مراقبت و چیدمان آکواریوم'}
        </button>

        {dockOpen && (
          <div className="pointer-events-auto w-full max-w-3xl rounded-2xl bg-[#17172F]/92 border border-[#7771A8]/40 p-3 shadow-2xl space-y-2.5">
            <div className="flex items-center gap-1.5">
              {(
                [
                  ['care', 'مراقبت و نور'],
                  ['fish', 'ماهی‌ها'],
                  ['decor', 'مرجان و چیدمان'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => setTab(id)}
                  className={`px-3 py-1.5 rounded-xl text-xs cursor-pointer ${
                    tab === id ? 'bg-[#7771A8] text-[#F1DCCB] font-semibold' : 'bg-[#212142] text-[#D9A9C5]'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'care' && (
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFeed}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#D6B875] text-[#17172F] text-xs font-bold cursor-pointer"
                  >
                    <Fish className="w-4 h-4" />
                    <span>غذا دادن به ماهی‌ها</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      cleanAquarium();
                      audioEngine.playSfx('sparkle');
                    }}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#A6BBAA] text-[#17172F] text-xs font-bold cursor-pointer"
                  >
                    <SparklesIcon className="w-4 h-4" />
                    <span>شفاف‌سازی آب</span>
                  </button>
                </div>

                <div className="flex items-center gap-1.5">
                  {(
                    [
                      ['lagoon', 'تالاب آبی'],
                      ['deep_moon', 'اعماق شب'],
                      ['coral_glow', 'درخشش مرجان'],
                    ] as const
                  ).map(([mId, label]) => (
                    <button
                      key={mId}
                      type="button"
                      onClick={() => setAquariumLight(mId)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs cursor-pointer ${
                        aquarium.lightMode === mId ? 'bg-[#D9A9C5] text-[#17172F] font-bold' : 'bg-[#212142] text-[#F1DCCB]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {tab === 'fish' && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <span className="text-xs text-[#D6B875] shrink-0">افزودن:</span>
                  {FISH_CATALOG.map((fc) => (
                    <button
                      key={fc.species}
                      type="button"
                      onClick={() => {
                        addFish(fc.species, fc.label);
                        audioEngine.playSfx('water');
                      }}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#222246] text-xs text-[#F1DCCB] whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5 text-[#D6B875]" />
                      <span>{fc.label}</span>
                    </button>
                  ))}
                </div>
                {aquarium.fish.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto">
                    <span className="text-[11px] text-[#D9A9C5] shrink-0">موجود:</span>
                    {aquarium.fish.map((f) => (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => removeFish(f.id)}
                        className="px-2 py-1 rounded-lg bg-[#2a2240] text-[11px] text-[#F1DCCB] whitespace-nowrap shrink-0 hover:text-[#D9A9C5] cursor-pointer"
                        title="حذف از آکواریوم"
                      >
                        {f.name} ×
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {tab === 'decor' && (
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {DECOR_CATALOG.map((dc) => (
                  <button
                    key={dc.kind}
                    type="button"
                    onClick={() => {
                      addAquariumDecor(dc.kind, [(Math.random() - 0.5) * 5, -1.65, (Math.random() - 0.5) * 2.5]);
                      audioEngine.playSfx('click');
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#222246] border border-[#7771A8]/35 text-xs text-[#F1DCCB] whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#A6BBAA]" />
                    <span>{dc.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

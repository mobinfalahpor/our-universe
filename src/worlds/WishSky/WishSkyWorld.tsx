import React, { useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Sparkles, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { Plus, Trash2, X } from 'lucide-react';
import { SceneCanvas } from '../../components/SceneCanvas';
import { useUniverseStore } from '../../core/store';
import { formatPersianDate, toPersianDigits } from '../../core/persianUtils';
import { audioEngine } from '../../systems/audioEngine';
import type { StarColorHex, WishCategory, WishItem } from '../../core/types';

const CATEGORIES: { id: WishCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'همه آرزوها' },
  { id: 'love', label: 'عشق و باهم‌بودن' },
  { id: 'travel', label: 'سفر و ماجراجویی' },
  { id: 'dreams', label: 'رویاهای آینده' },
  { id: 'peace', label: 'آرامش و سلامتی' },
  { id: 'moments', label: 'لحظه‌های کوچک' },
];

const STAR_COLORS: { hex: StarColorHex; label: string }[] = [
  { hex: '#D6B875', label: 'طلایی' },
  { hex: '#D9A9C5', label: 'رز' },
  { hex: '#7771A8', label: 'اسطوخودوس' },
  { hex: '#F1DCCB', label: 'کرم مهتابی' },
  { hex: '#A6BBAA', label: 'سبز مریم‌گلی' },
];

function WishStarMesh({
  wish,
  selected,
  onSelect,
}: {
  wish: WishItem;
  selected: boolean;
  onSelect: (w: WishItem) => void;
}) {
  const starRef = useRef<THREE.Group>(null);
  const offset = useMemo(() => Math.random() * 6, []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime() + offset;
    if (starRef.current) {
      starRef.current.rotation.y = t * 0.6;
      const pulse = selected ? 1.45 : 1 + Math.sin(t * 2.2) * 0.12;
      starRef.current.scale.setScalar(pulse);
    }
  });

  return (
    <group
      ref={starRef}
      position={wish.position}
      onClick={(e) => {
        e.stopPropagation();
        audioEngine.playSfx('sparkle');
        onSelect(wish);
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        document.body.style.cursor = 'pointer';
      }}
      onPointerOut={() => {
        document.body.style.cursor = 'default';
      }}
    >
      <mesh>
        <octahedronGeometry args={[0.45, 0]} />
        <meshStandardMaterial color={wish.color} emissive={wish.color} emissiveIntensity={selected ? 2.6 : 1.5} />
      </mesh>
      <mesh rotation={[0, Math.PI / 4, Math.PI / 4]}>
        <octahedronGeometry args={[0.36, 0]} />
        <meshStandardMaterial color="#ffffff" emissive={wish.color} emissiveIntensity={1.2} />
      </mesh>
      {/* Halo ring */}
      <mesh>
        <torusGeometry args={[0.72, 0.02, 8, 24]} />
        <meshBasicMaterial color={wish.color} transparent opacity={selected ? 0.9 : 0.35} />
      </mesh>
      <pointLight color={wish.color} intensity={selected ? 3 : 1} distance={6} />
    </group>
  );
}

function ShootingStar({ trigger }: { trigger: number }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const progress = useRef(1);
  const lastTrigger = useRef(trigger);

  useFrame((_, delta) => {
    if (trigger !== lastTrigger.current) {
      lastTrigger.current = trigger;
      progress.current = 0;
    }
    if (meshRef.current) {
      if (progress.current < 1) {
        progress.current += delta * 1.1;
        const p = progress.current;
        meshRef.current.visible = true;
        meshRef.current.position.set(
          THREE.MathUtils.lerp(-18, 18, p),
          THREE.MathUtils.lerp(14, 4, p),
          -14
        );
      } else {
        meshRef.current.visible = false;
      }
    }
  });

  return (
    <mesh ref={meshRef} visible={false} rotation={[0, 0, -0.45]}>
      <cylinderGeometry args={[0.04, 0.14, 2.2, 8]} />
      <meshBasicMaterial color="#ffe8ad" />
    </mesh>
  );
}

function WishSkySceneContent({
  wishes,
  selectedWish,
  onSelectWish,
  shootingTrigger,
}: {
  wishes: WishItem[];
  selectedWish: WishItem | null;
  onSelectWish: (w: WishItem) => void;
  shootingTrigger: number;
}) {
  return (
    <>
      <ambientLight intensity={0.35} color="#7771A8" />
      <hemisphereLight args={['#D9A9C5', '#17172F', 0.5]} />
      <directionalLight position={[10, 14, 6]} intensity={0.9} color="#F1DCCB" />

      <Stars radius={70} depth={45} count={2400} factor={4.5} saturation={0.5} fade speed={0.4} />
      <Sparkles count={90} scale={[26, 16, 26]} size={3} speed={0.25} color="#D6B875" />

      {/* Crescent Moon */}
      <group position={[-11, 10, -24]}>
        <mesh>
          <sphereGeometry args={[2.3, 28, 28]} />
          <meshStandardMaterial color="#F1DCCB" emissive="#D6B875" emissiveIntensity={0.75} roughness={0.6} />
        </mesh>
      </group>

      {/* Ringed Pastel Planet */}
      <group position={[13, 8, -26]} rotation={[0.4, 0.2, -0.3]}>
        <mesh>
          <sphereGeometry args={[2.0, 24, 24]} />
          <meshStandardMaterial color="#D9A9C5" roughness={0.55} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[2.6, 3.8, 40]} />
          <meshStandardMaterial color="#D6B875" transparent opacity={0.65} side={THREE.DoubleSide} />
        </mesh>
      </group>

      {/* Cliff Balcony Floor */}
      <mesh position={[0, -2.5, 2]} receiveShadow>
        <cylinderGeometry args={[6.5, 4.5, 1.2, 24]} />
        <meshStandardMaterial color="#252445" roughness={0.85} />
      </mesh>

      <ShootingStar trigger={shootingTrigger} />

      {wishes.map((w) => (
        <WishStarMesh
          key={w.id}
          wish={w}
          selected={selectedWish?.id === w.id}
          onSelect={onSelectWish}
        />
      ))}

      <OrbitControls enableDamping dampingFactor={0.05} minDistance={4} maxDistance={24} target={[0, 5, -10]} />
    </>
  );
}

export const WishSkyWorld: React.FC = () => {
  const wishes = useUniverseStore((s) => s.wishes);
  const addWish = useUniverseStore((s) => s.addWish);
  const removeWish = useUniverseStore((s) => s.removeWish);

  const [filter, setFilter] = useState<WishCategory | 'all'>('all');
  const [selectedWish, setSelectedWish] = useState<WishItem | null>(wishes[0] ?? null);
  const [modalOpen, setModalOpen] = useState(false);
  const [shootingTrigger, setShootingTrigger] = useState(0);

  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [category, setCategory] = useState<WishCategory>('love');
  const [color, setColor] = useState<StarColorHex>('#D6B875');

  const filteredWishes = useMemo(
    () => (filter === 'all' ? wishes : wishes.filter((w) => w.category === filter)),
    [wishes, filter]
  );

  const handleCreateWish = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !text.trim()) return;
    const created = addWish(title, text, category, color);
    setSelectedWish(created);
    setShootingTrigger((n) => n + 1);
    audioEngine.playSfx('portal');
    setTitle('');
    setText('');
    setModalOpen(false);
  };

  return (
    <div className="relative w-full h-full">
      <SceneCanvas cameraPosition={[0, 3.2, 8]} fov={52} bgColor="#121229" fogNear={24} fogFar={85}>
        <WishSkySceneContent
          wishes={filteredWishes}
          selectedWish={selectedWish}
          onSelectWish={setSelectedWish}
          shootingTrigger={shootingTrigger}
        />
      </SceneCanvas>

      {/* Selected Wish Card */}
      {selectedWish && (
        <div className="fixed top-16 sm:top-20 right-3 sm:right-5 z-20 w-[calc(100%-1.5rem)] max-w-xs rounded-2xl bg-[#17172F]/92 border border-[#D6B875]/45 p-4 shadow-2xl">
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-[#F1DCCB]">{selectedWish.title}</h3>
              <div className="text-[11px] text-[#D9A9C5] mt-0.5">
                {CATEGORIES.find((c) => c.id === selectedWish.category)?.label} · {formatPersianDate(selectedWish.createdAt)}
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  removeWish(selectedWish.id);
                  setSelectedWish(null);
                }}
                aria-label="حذف آرزو"
                className="p-1.5 rounded-lg bg-[#2a213d] text-[#D9A9C5] hover:text-white cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setSelectedWish(null)}
                aria-label="بستن"
                className="p-1.5 rounded-lg bg-[#232346] text-[#F1DCCB] cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-[#F1DCCB]/90 leading-relaxed mt-2">{selectedWish.text}</p>
        </div>
      )}

      {/* Bottom Filter & New Wish Dock */}
      <div className="fixed bottom-3 inset-x-0 z-20 flex justify-center px-3 pointer-events-none">
        <div className="pointer-events-auto w-full max-w-3xl rounded-2xl bg-[#17172F]/92 border border-[#7771A8]/40 p-3 shadow-2xl flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full sm:max-w-[70%]">
            {CATEGORIES.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setFilter(c.id)}
                className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shrink-0 cursor-pointer ${
                  filter === c.id ? 'bg-[#7771A8] text-[#F1DCCB] font-semibold' : 'bg-[#212142] text-[#D9A9C5]'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-l from-[#D6B875] to-[#D9A9C5] text-[#17172F] text-xs font-bold whitespace-nowrap cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>ثبت آرزو ({toPersianDigits(wishes.length)})</span>
          </button>
        </div>
      </div>

      {/* Create Wish Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-[#0d0d1f]/80 flex items-center justify-center p-4"
          onClick={() => setModalOpen(false)}
        >
          <form
            onSubmit={handleCreateWish}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-3xl bg-[#17172F] border border-[#D6B875]/45 p-6 shadow-2xl space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-[#F1DCCB]">تبدیل آرزو به ستاره</h3>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl bg-[#242447] text-[#F1DCCB] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs text-[#D9A9C5] mb-1.5">عنوان آرزو</label>
              <input
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="مثلاً: یک سفر دونفره به شمال"
                className="w-full rounded-xl bg-[#212142] border border-[#7771A8]/45 px-3 py-2.5 text-sm text-[#F1DCCB] outline-none focus:border-[#D6B875]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#D9A9C5] mb-1.5">متن آرزو</label>
              <textarea
                required
                rows={3}
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="آرزوی قشنگت را اینجا بنویس..."
                className="w-full rounded-xl bg-[#212142] border border-[#7771A8]/45 px-3 py-2.5 text-sm text-[#F1DCCB] outline-none focus:border-[#D6B875]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#D9A9C5] mb-1.5">دسته‌بندی</label>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORIES.filter((c) => c.id !== 'all').map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setCategory(c.id as WishCategory)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs cursor-pointer ${
                      category === c.id ? 'bg-[#7771A8] text-[#F1DCCB] font-semibold' : 'bg-[#212142] text-[#D9A9C5]'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs text-[#D9A9C5] mb-1.5">رنگ ستاره</label>
              <div className="flex items-center gap-2.5">
                {STAR_COLORS.map((sc) => (
                  <button
                    key={sc.hex}
                    type="button"
                    onClick={() => setColor(sc.hex)}
                    title={sc.label}
                    className={`w-8 h-8 rounded-full border-2 cursor-pointer transition-transform ${
                      color === sc.hex ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: sc.hex }}
                  />
                ))}
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 rounded-2xl bg-gradient-to-l from-[#D6B875] to-[#D9A9C5] text-[#17172F] font-bold text-sm cursor-pointer"
            >
              درخشش ستاره آرزو ✨
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

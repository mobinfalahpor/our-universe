import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls, Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import { Coffee, CloudRain, Snowflake, Sun, Volume2 } from 'lucide-react';
import { SceneCanvas } from '../../components/SceneCanvas';
import { useUniverseStore } from '../../core/store';
import { createWoodTexture } from '../../systems/proceduralTextures';
import { audioEngine } from '../../systems/audioEngine';

interface MenuDrink {
  id: string;
  label: string;
  desc: string;
  liquidColor: string;
  foamColor: string;
}

const MENU_DRINKS: MenuDrink[] = [
  { id: 'hot_choc', label: 'هات‌چاکلت مارشمالو', desc: 'شکلات داغ غلیظ با مارشمالوی نرم', liquidColor: '#5c331d', foamColor: '#fff5ee' },
  { id: 'heart_latte', label: 'لاته قلبی', desc: 'اسپرسوی ملایم با شیر بخارداده‌شده', liquidColor: '#a66f46', foamColor: '#f7ece1' },
  { id: 'espresso', label: 'اسپرسو کلاسیک', desc: 'عطر تازه دانه قهوه برشته', liquidColor: '#361f12', foamColor: '#c99768' },
  { id: 'honey_tea', label: 'چای لیمو و عسل', desc: 'دمنوش گرم و آرام‌بخش کنار ابرها', liquidColor: '#d6a44b', foamColor: '#f5dc93' },
  { id: 'matcha', label: 'ماچا لاته', desc: 'چای سبز ژاپنی با کف شیر لطیف', liquidColor: '#7ea37d', foamColor: '#e8f2e6' },
];

function CloudCafeScene({
  selectedDrink,
  brewProgress,
}: {
  selectedDrink: MenuDrink;
  brewProgress: number; // 0 = idle, 0..1 = brewing, >1 = ready
}) {
  const env = useUniverseStore((s) => s.environment);
  const addStars = useUniverseStore((s) => s.addStars);
  const deckTex = useMemo(() => createWoodTexture('#a67f5f', '#7d593e', 4), []);
  const streamRef = useRef<THREE.Mesh>(null);
  const steamRef = useRef<THREE.Group>(null);
  const weatherRef = useRef<THREE.Points>(null);

  useEffect(() => {
    return () => {
      deckTex.dispose();
    };
  }, [deckTex]);

  const weatherCoords = useMemo(() => {
    const arr = new Float32Array(200 * 3);
    for (let i = 0; i < 200; i++) {
      arr[i * 3] = (Math.random() - 0.5) * 14;
      arr[i * 3 + 1] = Math.random() * 8;
      arr[i * 3 + 2] = (Math.random() - 0.5) * 12;
    }
    return arr;
  }, []);

  useFrame(({ clock }, delta) => {
    const t = clock.getElapsedTime();
    if (steamRef.current && brewProgress > 0.4) {
      steamRef.current.children.forEach((p, idx) => {
        p.position.y = 1.25 + ((t * 0.7 + idx * 0.25) % 0.85);
        p.position.x = 0.2 + Math.sin(t * 2 + idx) * 0.06;
        p.scale.setScalar(0.7 + ((t * 0.6 + idx * 0.2) % 0.6));
      });
    }
    if (weatherRef.current && env.cafeWeather !== 'sunny') {
      const pos = weatherRef.current.geometry.attributes.position as THREE.BufferAttribute;
      const speed = env.cafeWeather === 'rainy' ? 6.5 : 1.5;
      for (let i = 0; i < 200; i++) {
        let y = pos.getY(i) - delta * speed;
        if (y < -0.5) y = 7.5;
        pos.setY(i, y);
      }
      pos.needsUpdate = true;
    }
  });

  const awningColor =
    env.cafeTheme === 'rose_romantic'
      ? '#D9A9C5'
      : env.cafeTheme === 'starry_night'
        ? '#7771A8'
        : '#F1DCCB';

  const isNight = env.cafeTime === 'night';
  const isSunset = env.cafeTime === 'sunset';

  return (
    <>
      <ambientLight intensity={isNight ? 0.32 : 0.52} color={isSunset ? '#ffd1b8' : '#F1DCCB'} />
      <hemisphereLight args={[isSunset ? '#D9A9C5' : '#ffe9d6', '#17172F', 0.65]} />
      <directionalLight position={[6, 10, 6]} intensity={isNight ? 0.6 : 1.3} color={isSunset ? '#ffb997' : '#fff5e6'} castShadow />
      <pointLight position={[0, 2.8, 0.5]} color="#D6B875" intensity={2.2} distance={12} />

      {isNight && <Sparkles count={60} scale={[12, 6, 12]} size={2.8} color="#D6B875" />}

      {/* Surrounding Cloud Platform */}
      {[
        [-4.2, -0.5, -2.5, 1.5],
        [4.5, -0.4, -1.8, 1.6],
        [-3.5, -0.6, 3.2, 1.4],
        [3.8, -0.5, 3.5, 1.5],
        [0, -0.9, -4.5, 1.8],
      ].map(([cx, cy, cz, cs], i) => (
        <mesh key={i} position={[cx, cy, cz]} scale={cs}>
          <sphereGeometry args={[1.3, 14, 14]} />
          <meshStandardMaterial color="#F1DCCB" roughness={0.95} transparent opacity={0.9} />
        </mesh>
      ))}

      {/* Wooden Cafe Terrace Deck */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <cylinderGeometry args={[4.8, 4.9, 0.25, 32]} />
        <meshStandardMaterial map={deckTex} roughness={0.68} />
      </mesh>

      {/* Cafe Bar Counter */}
      <group position={[0, 0, -1.6]}>
        <mesh position={[0, 0.55, 0]} castShadow receiveShadow>
          <boxGeometry args={[3.4, 1.0, 1.0]} />
          <meshStandardMaterial color="#4e372d" roughness={0.65} />
        </mesh>
        <mesh position={[0, 1.08, 0]}>
          <boxGeometry args={[3.55, 0.08, 1.12]} />
          <meshStandardMaterial color="#F1DCCB" roughness={0.35} />
        </mesh>

        {/* Canopy Posts & Awning */}
        <mesh position={[-1.55, 2.0, -0.38]}>
          <cylinderGeometry args={[0.05, 0.05, 2.8, 10]} />
          <meshStandardMaterial color="#D6B875" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[1.55, 2.0, -0.38]}>
          <cylinderGeometry args={[0.05, 0.05, 2.8, 10]} />
          <meshStandardMaterial color="#D6B875" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 3.25, 0.15]} rotation={[0.25, 0, 0]} castShadow>
          <boxGeometry args={[3.9, 0.12, 1.8]} />
          <meshStandardMaterial color={awningColor} roughness={0.75} />
        </mesh>

        {/* Espresso Machine */}
        <group position={[-0.55, 1.12, -0.1]}>
          <mesh position={[0, 0.32, 0]} castShadow>
            <boxGeometry args={[0.72, 0.64, 0.55]} />
            <meshStandardMaterial color="#D6B875" metalness={0.85} roughness={0.2} />
          </mesh>
          <mesh position={[0, 0.45, 0.32]}>
            <cylinderGeometry args={[0.06, 0.05, 0.14, 12]} />
            <meshStandardMaterial color="#2c2a3e" metalness={0.6} roughness={0.3} />
          </mesh>
        </group>

        {/* Animated Drink Cup on Counter */}
        <group position={[0.2, 1.12, 0.18]}>
          <mesh position={[0, 0.14, 0]} castShadow>
            <cylinderGeometry args={[0.13, 0.1, 0.26, 18]} />
            <meshStandardMaterial color="#F1DCCB" roughness={0.25} />
          </mesh>
          {/* Cup handle */}
          <mesh position={[0.13, 0.14, 0]} rotation={[0, 0, Math.PI / 2]}>
            <torusGeometry args={[0.06, 0.018, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#F1DCCB" roughness={0.25} />
          </mesh>

          {/* Liquid level rises with brewProgress */}
          {brewProgress > 0.05 && (
            <mesh position={[0, 0.06 + Math.min(1, brewProgress) * 0.16, 0]}>
              <cylinderGeometry args={[0.115, 0.1, 0.04, 16]} />
              <meshStandardMaterial color={selectedDrink.liquidColor} roughness={0.2} />
            </mesh>
          )}
          {/* Foam / Marshmallows when nearly done */}
          {brewProgress > 0.72 && (
            <mesh position={[0, 0.25, 0]}>
              <cylinderGeometry args={[0.115, 0.115, 0.04, 16]} />
              <meshStandardMaterial color={selectedDrink.foamColor} roughness={0.85} />
            </mesh>
          )}
          {/* Pouring stream */}
          {brewProgress > 0.05 && brewProgress < 0.75 && (
            <mesh ref={streamRef} position={[0, 0.38, 0]}>
              <cylinderGeometry args={[0.018, 0.014, 0.45, 8]} />
              <meshStandardMaterial color={selectedDrink.liquidColor} />
            </mesh>
          )}
        </group>

        {/* Steam Puffs */}
        {brewProgress > 0.4 && (
          <group ref={steamRef}>
            {[0, 1, 2, 3].map((i) => (
              <mesh key={i} position={[0.2, 1.3 + i * 0.15, 0.18]}>
                <sphereGeometry args={[0.05, 8, 8]} />
                <meshStandardMaterial color="#ffffff" transparent opacity={0.45} />
              </mesh>
            ))}
          </group>
        )}

        {/* Pastry Display Dome */}
        <group position={[1.1, 1.12, 0.05]}>
          <mesh position={[0, 0.03, 0]}>
            <cylinderGeometry args={[0.32, 0.32, 0.05, 18]} />
            <meshStandardMaterial color="#D6B875" metalness={0.7} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.18, 0.2, 0.15, 16]} />
            <meshStandardMaterial color="#D9A9C5" roughness={0.6} />
          </mesh>
          <mesh position={[0, 0.18, 0]}>
            <sphereGeometry args={[0.28, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshPhysicalMaterial color="#ffffff" transparent opacity={0.35} roughness={0.05} clearcoat={1} />
          </mesh>
        </group>
      </group>

      {/* Cozy Bistro Table in Front */}
      <group position={[-1.4, 0, 1.4]} onClick={() => addStars(2)}>
        <mesh position={[0, 0.75, 0]} castShadow>
          <cylinderGeometry args={[0.62, 0.62, 0.06, 22]} />
          <meshStandardMaterial color="#F1DCCB" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.38, 0]}>
          <cylinderGeometry args={[0.06, 0.08, 0.75, 10]} />
          <meshStandardMaterial color="#D6B875" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.85, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.16, 8]} />
          <meshStandardMaterial color="#D9A9C5" emissive="#D6B875" emissiveIntensity={1.2} />
        </mesh>
      </group>

      {/* Rain / Snow Weather */}
      {env.cafeWeather !== 'sunny' && (
        <points ref={weatherRef}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" args={[weatherCoords, 3]} />
          </bufferGeometry>
          <pointsMaterial
            color={env.cafeWeather === 'rainy' ? '#9fd0f0' : '#ffffff'}
            size={env.cafeWeather === 'rainy' ? 0.06 : 0.1}
            transparent
            opacity={0.8}
          />
        </points>
      )}

      <OrbitControls enableDamping dampingFactor={0.05} minDistance={3.5} maxDistance={11} maxPolarAngle={Math.PI * 0.48} target={[0, 1.1, -0.4]} />
    </>
  );
}

export const CloudCafeWorld: React.FC = () => {
  const env = useUniverseStore((s) => s.environment);
  const setEnvironmentSettings = useUniverseStore((s) => s.setEnvironmentSettings);
  const addStars = useUniverseStore((s) => s.addStars);

  const [selectedDrink, setSelectedDrink] = useState<MenuDrink>(MENU_DRINKS[0]);
  const [brewProgress, setBrewProgress] = useState(0);
  const [brewing, setBrewing] = useState(false);
  const [cafeAmbientOn, setCafeAmbientOn] = useState(false);
  const [dockOpen, setDockOpen] = useState(true);

  const startBrew = () => {
    if (brewing) return;
    setBrewing(true);
    setBrewProgress(0.08);
    audioEngine.playSfx('water');
    const start = performance.now();
    const duration = 2600;
    const step = (now: number) => {
      const p = Math.min(1, (now - start) / duration);
      setBrewProgress(p);
      if (p < 1) {
        requestAnimationFrame(step);
      } else {
        setBrewing(false);
        setBrewProgress(1.1);
        addStars(10);
        audioEngine.playSfx('sparkle');
      }
    };
    requestAnimationFrame(step);
  };

  const toggleCafeAmbient = () => {
    const next = !cafeAmbientOn;
    setCafeAmbientOn(next);
    audioEngine.setAmbient(next ? 'cafe' : 'none');
  };

  const bgColor =
    env.cafeTime === 'night' ? '#13132b' : env.cafeTime === 'sunset' ? '#4f3a5c' : '#5e739e';

  return (
    <div className="relative w-full h-full">
      <SceneCanvas cameraPosition={[0.6, 2.8, 5.8]} fov={46} bgColor={bgColor}>
        <CloudCafeScene selectedDrink={selectedDrink} brewProgress={brewProgress} />
      </SceneCanvas>

      {/* Brew Status Toast */}
      {brewProgress > 1 && (
        <div className="fixed top-16 sm:top-20 right-3 sm:right-5 z-20 rounded-2xl bg-[#17172F]/92 border border-[#D6B875]/45 px-4 py-2.5 text-xs sm:text-sm text-[#F1DCCB] shadow-xl">
          {selectedDrink.label} آماده شد و با عشق سرو شد! (+۱۰ ستاره)
        </div>
      )}

      {/* Collapsible Bottom Control Dock */}
      <div className="fixed bottom-3 inset-x-0 z-20 flex flex-col items-center px-3 pointer-events-none">
        <button
          type="button"
          onClick={() => setDockOpen((v) => !v)}
          className="pointer-events-auto mb-1.5 px-3 py-1 rounded-t-xl bg-[#17172F]/90 border border-b-0 border-[#D6B875]/40 text-[11px] text-[#F1DCCB] cursor-pointer"
        >
          {dockOpen ? 'جمع کردن منوی کافه' : 'باز کردن منو و حال‌وهوای کافه'}
        </button>

        {dockOpen && (
          <div className="pointer-events-auto w-full max-w-3xl rounded-2xl bg-[#17172F]/92 border border-[#D6B875]/35 p-3 shadow-2xl space-y-2.5">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full sm:max-w-[70%]">
                {MENU_DRINKS.map((drink) => (
                  <button
                    key={drink.id}
                    type="button"
                    onClick={() => {
                      setSelectedDrink(drink);
                      setBrewProgress(0);
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shrink-0 border cursor-pointer ${
                      selectedDrink.id === drink.id
                        ? 'bg-[#7771A8]/50 border-[#D6B875] text-[#F1DCCB] font-semibold'
                        : 'bg-[#212142] border-transparent text-[#D9A9C5]'
                    }`}
                  >
                    {drink.label}
                  </button>
                ))}
              </div>

              <button
                type="button"
                disabled={brewing}
                onClick={startBrew}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-l from-[#D6B875] to-[#D9A9C5] text-[#17172F] text-xs font-bold whitespace-nowrap cursor-pointer disabled:opacity-60"
              >
                <Coffee className="w-4 h-4" />
                <span>{brewing ? 'در حال آماده‌سازی...' : 'آماده‌سازی نوشیدنی'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between gap-2 flex-wrap border-t border-[#7771A8]/25 pt-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setEnvironmentSettings({ cafeWeather: 'sunny' })}
                  className={`p-1.5 px-2.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer ${
                    env.cafeWeather === 'sunny' ? 'bg-[#D6B875] text-[#17172F] font-bold' : 'bg-[#212142] text-[#F1DCCB]'
                  }`}
                >
                  <Sun className="w-3.5 h-3.5" />
                  <span>صاف</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEnvironmentSettings({ cafeWeather: 'rainy' })}
                  className={`p-1.5 px-2.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer ${
                    env.cafeWeather === 'rainy' ? 'bg-[#7771A8] text-[#F1DCCB] font-bold' : 'bg-[#212142] text-[#F1DCCB]'
                  }`}
                >
                  <CloudRain className="w-3.5 h-3.5" />
                  <span>بارانی</span>
                </button>
                <button
                  type="button"
                  onClick={() => setEnvironmentSettings({ cafeWeather: 'snowy' })}
                  className={`p-1.5 px-2.5 rounded-xl text-xs flex items-center gap-1 cursor-pointer ${
                    env.cafeWeather === 'snowy' ? 'bg-[#D9A9C5] text-[#17172F] font-bold' : 'bg-[#212142] text-[#F1DCCB]'
                  }`}
                >
                  <Snowflake className="w-3.5 h-3.5" />
                  <span>برفی</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                {(
                  [
                    ['morning', 'صبح'],
                    ['sunset', 'غروب'],
                    ['night', 'شب'],
                  ] as const
                ).map(([tId, label]) => (
                  <button
                    key={tId}
                    type="button"
                    onClick={() => setEnvironmentSettings({ cafeTime: tId })}
                    className={`px-2.5 py-1.5 rounded-xl text-xs cursor-pointer ${
                      env.cafeTime === tId ? 'bg-[#7771A8] text-[#F1DCCB]' : 'bg-[#212142] text-[#D9A9C5]'
                    }`}
                  >
                    {label}
                  </button>
                ))}

                <button
                  type="button"
                  onClick={toggleCafeAmbient}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs cursor-pointer ${
                    cafeAmbientOn ? 'bg-[#A6BBAA] text-[#17172F] font-bold' : 'bg-[#212142] text-[#F1DCCB]'
                  }`}
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>صدای کافه</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

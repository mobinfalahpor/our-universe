import React, { useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Line } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import { Eye, Telescope } from 'lucide-react';
import { SceneCanvas } from '../../components/SceneCanvas';
import { audioEngine } from '../../systems/audioEngine';

interface CelestialTarget {
  id: string;
  name: string;
  kind: 'planet' | 'constellation';
  note: string;
  position: [number, number, number];
  azimuth: number;
  elevation: number;
  color: string;
}

const TARGETS: CelestialTarget[] = [
  {
    id: 'moon',
    name: 'ماه نقره‌ای',
    kind: 'planet',
    note: 'درخشش آرام ماه، نور نقره‌ای‌اش را بر سقف رصدخانه می‌پاشد؛ همیشه ثابت و وفادار در آسمان شب.',
    position: [-10, 12, -26],
    azimuth: -0.36,
    elevation: 0.42,
    color: '#F1DCCB',
  },
  {
    id: 'saturn',
    name: 'سیاره زحل',
    kind: 'planet',
    note: 'حلقه‌های طلایی زحل از میان عدسی تلسکوپ مثل جواهری معلق در مخمل سرمه‌ای آسمان می‌درخشند.',
    position: [12, 13, -28],
    azimuth: 0.4,
    elevation: 0.42,
    color: '#D6B875',
  },
  {
    id: 'jupiter',
    name: 'سیاره مشتری',
    kind: 'planet',
    note: 'بزرگ‌ترین سیاره منظومه با نوارهای کرم و رز که با قمرهای کوچکش در تاریکی می‌رقصد.',
    position: [2, 17, -30],
    azimuth: 0.06,
    elevation: 0.52,
    color: '#D9A9C5',
  },
  {
    id: 'mars',
    name: 'مریخ سرخ',
    kind: 'planet',
    note: 'نگین گرم و نارنجی شب که در میان اقیانوس ستاره‌های دوردست می‌درخشد.',
    position: [-17, 9, -22],
    azimuth: -0.65,
    elevation: 0.32,
    color: '#d98a6c',
  },
  {
    id: 'ursa',
    name: 'صورت فلکی دب اکبر',
    kind: 'constellation',
    note: 'هفت ستاره راهنما که از دیرباز جهت شمال و ستاره قطبی را به مسافران شب نشان می‌دادند.',
    position: [-5, 16, -24],
    azimuth: -0.2,
    elevation: 0.58,
    color: '#D6B875',
  },
  {
    id: 'orion',
    name: 'صورت فلکی شکارچی',
    kind: 'constellation',
    note: 'سه ستاره هم‌ردیف کمربند شکارچی که در شب‌های سرد زمستان روشن‌ترین جلوه آسمان است.',
    position: [9, 9, -24],
    azimuth: 0.35,
    elevation: 0.34,
    color: '#A6BBAA',
  },
  {
    id: 'heart',
    name: 'صورت فلکی قلب آسمان',
    kind: 'constellation',
    note: 'صورت فلکی اختصاصی جهان کوچولوی ما؛ نقش‌گرفته از شش ستاره درخشان به شکل یک قلب.',
    position: [0, 11, -24],
    azimuth: 0,
    elevation: 0.42,
    color: '#D9A9C5',
  },
];

function ConstellationGroup({
  points,
  color,
  position,
  highlighted,
}: {
  points: [number, number, number][];
  color: string;
  position: [number, number, number];
  highlighted: boolean;
}) {
  return (
    <group position={position}>
      {points.map((pt, i) => (
        <mesh key={i} position={pt}>
          <sphereGeometry args={[highlighted ? 0.22 : 0.14, 10, 10]} />
          <meshBasicMaterial color={color} />
        </mesh>
      ))}
      <Line points={points} color={color} lineWidth={highlighted ? 2.2 : 1.1} transparent opacity={highlighted ? 0.95 : 0.45} />
    </group>
  );
}

function ObservatorySceneContent({
  azimuth,
  elevation,
  eyepieceMode,
  selectedTarget,
  onSelectTarget,
}: {
  azimuth: number;
  elevation: number;
  eyepieceMode: boolean;
  selectedTarget: CelestialTarget;
  onSelectTarget: (t: CelestialTarget) => void;
}) {
  const telescopeYawRef = useRef<THREE.Group>(null);
  const telescopePitchRef = useRef<THREE.Group>(null);
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  const ursaPts = useMemo<[number, number, number][]>(
    () => [
      [-2.2, 0.8, 0],
      [-1.3, 1.0, 0],
      [-0.5, 0.7, 0],
      [0.3, 0.5, 0],
      [0.5, -0.3, 0],
      [1.5, -0.2, 0],
      [1.7, 0.6, 0],
      [0.3, 0.5, 0],
    ],
    []
  );

  const orionPts = useMemo<[number, number, number][]>(
    () => [
      [-1.1, 1.4, 0],
      [1.0, 1.3, 0],
      [0.3, 0.2, 0],
      [0, 0.1, 0],
      [-0.3, 0.0, 0],
      [-0.9, -1.2, 0],
      [1.1, -1.1, 0],
      [0.3, 0.2, 0],
    ],
    []
  );

  const heartPts = useMemo<[number, number, number][]>(
    () => [
      [0, -1.2, 0],
      [-1.2, 0.1, 0],
      [-0.8, 1.0, 0],
      [0, 0.5, 0],
      [0.8, 1.0, 0],
      [1.2, 0.1, 0],
      [0, -1.2, 0],
    ],
    []
  );

  useFrame((_, delta) => {
    if (telescopeYawRef.current) {
      telescopeYawRef.current.rotation.y = THREE.MathUtils.damp(telescopeYawRef.current.rotation.y, -azimuth, 6, delta);
    }
    if (telescopePitchRef.current) {
      telescopePitchRef.current.rotation.x = THREE.MathUtils.damp(telescopePitchRef.current.rotation.x, elevation, 6, delta);
    }

    if (eyepieceMode && controlsRef.current) {
      const [tx, ty, tz] = selectedTarget.position;
      const targetPos = new THREE.Vector3(tx, ty, tz);
      const dir = targetPos.clone().normalize();
      const camGoal = targetPos.clone().sub(dir.multiplyScalar(7.5));
      camera.position.lerp(camGoal, Math.min(1, delta * 3.5));
      controlsRef.current.target.lerp(targetPos, Math.min(1, delta * 4.5));
      controlsRef.current.update();
    } else if (!eyepieceMode && controlsRef.current) {
      const defaultTarget = new THREE.Vector3(0, 1.8, -1);
      controlsRef.current.target.lerp(defaultTarget, Math.min(1, delta * 3));
      controlsRef.current.update();
    }
  });

  return (
    <>
      <ambientLight intensity={0.3} color="#7771A8" />
      <hemisphereLight args={['#a5a0e0', '#121226', 0.55]} />
      <pointLight position={[2.2, 2.2, 1.5]} color="#D6B875" intensity={1.8} distance={9} />

      <Stars radius={75} depth={45} count={2800} factor={4.5} saturation={0.45} fade speed={0.35} />

      {/* Observatory Stone Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[5.5, 36]} />
        <meshStandardMaterial color="#1f1f3d" roughness={0.75} />
      </mesh>
      {/* Brass Floor Compass Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[2.5, 2.65, 48]} />
        <meshStandardMaterial color="#D6B875" metalness={0.8} roughness={0.25} />
      </mesh>

      {/* Low Dome Wall Rim */}
      <mesh position={[0, 0.85, 0]}>
        <cylinderGeometry args={[5.4, 5.4, 1.7, 32, 1, true]} />
        <meshStandardMaterial color="#27274d" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>

      {/* Brass Telescope Assembly */}
      <group position={[0, 0, 0]}>
        {/* Tripod / Pedestal */}
        <mesh position={[0, 0.75, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.35, 1.5, 14]} />
          <meshStandardMaterial color="#302d54" metalness={0.4} roughness={0.5} />
        </mesh>

        <group ref={telescopeYawRef} position={[0, 1.55, 0]}>
          <mesh>
            <sphereGeometry args={[0.22, 14, 14]} />
            <meshStandardMaterial color="#D6B875" metalness={0.88} roughness={0.22} />
          </mesh>
          <group ref={telescopePitchRef}>
            {/* Main Brass Optical Tube */}
            <mesh position={[0, 0.1, -0.45]} rotation={[Math.PI / 2, 0, 0]} castShadow>
              <cylinderGeometry args={[0.16, 0.12, 2.1, 20]} />
              <meshStandardMaterial color="#D6B875" metalness={0.85} roughness={0.2} />
            </mesh>
            <mesh position={[0, 0.1, -1.52]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.19, 0.17, 0.16, 20]} />
              <meshStandardMaterial color="#F1DCCB" metalness={0.7} roughness={0.25} />
            </mesh>
            <mesh position={[0, 0.1, 0.65]} rotation={[Math.PI / 2, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.08, 0.25, 14]} />
              <meshStandardMaterial color="#262545" metalness={0.7} roughness={0.3} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Planets */}
      <mesh
        position={TARGETS[0].position}
        onClick={(e) => {
          e.stopPropagation();
          onSelectTarget(TARGETS[0]);
        }}
      >
        <sphereGeometry args={[1.65, 24, 24]} />
        <meshStandardMaterial color="#F1DCCB" emissive="#F1DCCB" emissiveIntensity={0.45} roughness={0.8} />
      </mesh>

      <group
        position={TARGETS[1].position}
        rotation={[0.4, 0.2, -0.25]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectTarget(TARGETS[1]);
        }}
      >
        <mesh>
          <sphereGeometry args={[1.3, 24, 24]} />
          <meshStandardMaterial color="#D6B875" emissive="#8f7236" emissiveIntensity={0.3} roughness={0.5} />
        </mesh>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.7, 2.6, 36]} />
          <meshStandardMaterial color="#F1DCCB" transparent opacity={0.78} side={THREE.DoubleSide} />
        </mesh>
      </group>

      <mesh
        position={TARGETS[2].position}
        onClick={(e) => {
          e.stopPropagation();
          onSelectTarget(TARGETS[2]);
        }}
      >
        <sphereGeometry args={[1.55, 24, 24]} />
        <meshStandardMaterial color="#D9A9C5" emissive="#7771A8" emissiveIntensity={0.25} roughness={0.55} />
      </mesh>

      <mesh
        position={TARGETS[3].position}
        onClick={(e) => {
          e.stopPropagation();
          onSelectTarget(TARGETS[3]);
        }}
      >
        <sphereGeometry args={[1.05, 22, 22]} />
        <meshStandardMaterial color="#d98a6c" emissive="#7a3520" emissiveIntensity={0.3} roughness={0.7} />
      </mesh>

      {/* Constellations */}
      <ConstellationGroup points={ursaPts} color="#D6B875" position={TARGETS[4].position} highlighted={selectedTarget.id === 'ursa'} />
      <ConstellationGroup points={orionPts} color="#A6BBAA" position={TARGETS[5].position} highlighted={selectedTarget.id === 'orion'} />
      <ConstellationGroup points={heartPts} color="#D9A9C5" position={TARGETS[6].position} highlighted={selectedTarget.id === 'heart'} />

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={2.5}
        maxDistance={12}
        maxPolarAngle={Math.PI * 0.55}
      />
    </>
  );
}

export const ObservatoryWorld: React.FC = () => {
  const [selectedTarget, setSelectedTarget] = useState<CelestialTarget>(TARGETS[1]);
  const [azimuth, setAzimuth] = useState(TARGETS[1].azimuth);
  const [elevation, setElevation] = useState(TARGETS[1].elevation);
  const [eyepieceMode, setEyepieceMode] = useState(false);
  const [dockOpen, setDockOpen] = useState(true);

  const selectCelestial = (t: CelestialTarget) => {
    setSelectedTarget(t);
    setAzimuth(t.azimuth);
    setElevation(t.elevation);
    audioEngine.playSfx('sparkle');
  };

  return (
    <div className="relative w-full h-full">
      <SceneCanvas cameraPosition={[0, 2.5, 5.6]} fov={48} bgColor="#0d0d22" fogNear={35} fogFar={110}>
        <ObservatorySceneContent
          azimuth={azimuth}
          elevation={elevation}
          eyepieceMode={eyepieceMode}
          selectedTarget={selectedTarget}
          onSelectTarget={selectCelestial}
        />
      </SceneCanvas>

      {/* Astronomical Info Plaque */}
      <div className="fixed top-16 sm:top-20 right-3 sm:right-5 z-20 w-[calc(100%-1.5rem)] max-w-xs rounded-2xl bg-[#17172F]/90 border border-[#D6B875]/40 p-4 shadow-xl">
        <div className="text-xs text-[#D6B875] mb-0.5">
          {selectedTarget.kind === 'planet' ? 'جرم آسمانی' : 'صورت فلکی'}
        </div>
        <h3 className="text-base font-bold text-[#F1DCCB] mb-1.5">{selectedTarget.name}</h3>
        <p className="text-xs sm:text-sm text-[#D9A9C5]/90 leading-relaxed">{selectedTarget.note}</p>
      </div>

      {/* Collapsible Bottom Control Dock */}
      <div className="fixed bottom-3 inset-x-0 z-20 flex flex-col items-center px-3 pointer-events-none">
        <button
          type="button"
          onClick={() => setDockOpen((v) => !v)}
          className="pointer-events-auto mb-1.5 px-3 py-1 rounded-t-xl bg-[#17172F]/90 border border-b-0 border-[#7771A8]/40 text-[11px] text-[#F1DCCB] cursor-pointer"
        >
          {dockOpen ? 'جمع کردن کنترل تلسکوپ' : 'باز کردن تلسکوپ و آسمان'}
        </button>

        {dockOpen && (
          <div className="pointer-events-auto w-full max-w-3xl rounded-2xl bg-[#17172F]/92 border border-[#7771A8]/40 p-3 shadow-2xl space-y-2.5">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {TARGETS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => selectCelestial(t)}
                  className={`px-3 py-1.5 rounded-xl text-xs whitespace-nowrap shrink-0 border cursor-pointer ${
                    selectedTarget.id === t.id
                      ? 'bg-[#7771A8]/50 border-[#D6B875] text-[#F1DCCB] font-semibold'
                      : 'bg-[#212142] border-transparent text-[#D9A9C5]'
                  }`}
                >
                  {t.name}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between gap-3 flex-wrap border-t border-[#7771A8]/25 pt-2">
              <div className="flex items-center gap-3 flex-wrap">
                <label className="flex items-center gap-2 text-xs text-[#F1DCCB]">
                  <span className="text-[#D6B875]">چرخش افقی:</span>
                  <input
                    type="range"
                    min={-1.2}
                    max={1.2}
                    step={0.04}
                    value={azimuth}
                    onChange={(e) => setAzimuth(parseFloat(e.target.value))}
                    className="w-24 accent-[#D6B875]"
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-[#F1DCCB]">
                  <span className="text-[#D6B875]">زاویه ارتفاع:</span>
                  <input
                    type="range"
                    min={0.1}
                    max={0.85}
                    step={0.03}
                    value={elevation}
                    onChange={(e) => setElevation(parseFloat(e.target.value))}
                    className="w-24 accent-[#D9A9C5]"
                  />
                </label>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEyepieceMode((v) => !v);
                  audioEngine.playSfx('click');
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold cursor-pointer ${
                  eyepieceMode ? 'bg-[#D6B875] text-[#17172F]' : 'bg-[#7771A8] text-[#F1DCCB]'
                }`}
              >
                {eyepieceMode ? <Eye className="w-4 h-4" /> : <Telescope className="w-4 h-4" />}
                <span>{eyepieceMode ? 'بازگشت به رصدخانه' : 'نگاه از چشمی تلسکوپ'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

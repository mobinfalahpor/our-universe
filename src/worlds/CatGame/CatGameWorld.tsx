import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sparkles } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import {
  Bath,
  Camera,
  Droplets,
  Edit3,
  Eye,
  Heart,
  Megaphone,
  Moon,
  ShoppingBag,
  Sparkles as SparklesIcon,
  Sun,
  Upload,
  Utensils,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { SceneCanvas } from '../../components/SceneCanvas';
import { CatActor3D, type CatAnimationName } from '../../components/CatActor3D';
import { useUniverseStore } from '../../core/store';
import {
  createPersianBolsterTexture,
  createPersianRugTexture,
  createPersianTileTexture,
  createWoodTexture,
} from '../../systems/proceduralTextures';
import { audioEngine } from '../../systems/audioEngine';
import { CAT_EMOTION_LABELS, deriveCatEmotion } from '../../systems/catHomeBridge';
import { toPersianDigits } from '../../core/persianUtils';
import type { CatAccessory, CatBreed, CatEmotion, CatToyItemId } from '../../core/types';

const BREEDS: { id: CatBreed; label: string; color: string }[] = [
  { id: 'honey', label: 'نارنجی کلاسیک', color: '#f47b16' },
  { id: 'calico', label: 'نارنجی سه‌رنگ', color: '#d46b27' },
  { id: 'snow', label: 'برفی سفید', color: '#f6f0ea' },
  { id: 'mist', label: 'طوسی دودی', color: '#8c91a6' },
  { id: 'midnight', label: 'شب‌پرست', color: '#2a2b45' },
];

const ACCESSORIES: { id: CatAccessory; label: string }[] = [
  { id: 'none', label: 'بدون اکسسوری' },
  { id: 'rose_bow', label: 'پاپیون رز' },
  { id: 'gold_crown', label: 'تاج طلایی' },
  { id: 'lavender_scarf', label: 'شالگردن' },
  { id: 'round_glasses', label: 'عینک گرد' },
  { id: 'bell_collar', label: 'زنگوله طلایی' },
];

const CAT_SHOP_ITEMS: { id: CatToyItemId; label: string; desc: string; cost: number }[] = [
  { id: 'yarn_ball', label: 'کلاف کاموا', desc: 'توپ نرم برای بازی و دویدن', cost: 0 },
  { id: 'velvet_cushion', label: 'تشک مخملی دنج', desc: 'جای خواب گرم و نرم گربه', cost: 0 },
  { id: 'toy_mouse', label: 'موش اسباب‌بازی', desc: 'اسباب‌بازی شیطون کنار فرش', cost: 15 },
  { id: 'gold_bowl', label: 'ظرف غذای طلایی', desc: 'ظرف سلطنتی با جلای طلا', cost: 25 },
  { id: 'play_tower', label: 'برج بازی چندطبقه', desc: 'سکو و آویز بازی اختصاصی', cost: 40 },
];

type CameraPreset = 'room' | 'closeup' | 'play';

const _camGoal = new THREE.Vector3();
const _targetGoal = new THREE.Vector3();

function CatRoomScene({
  activeAction,
  emotion,
  cameraPreset,
  callTrigger,
  ballTrigger,
  customGlbBuffer,
  onPetHead,
  onPetBody,
  onAutoState,
}: {
  activeAction: CatAnimationName | null;
  emotion: CatEmotion;
  cameraPreset: CameraPreset;
  callTrigger: number;
  ballTrigger: number;
  customGlbBuffer?: ArrayBuffer;
  onPetHead: () => void;
  onPetBody: () => void;
  onAutoState: (status: string, anim: CatAnimationName) => void;
}) {
  const cat = useUniverseStore((s) => s.cat);
  const woodTex = useMemo(() => createWoodTexture('#96633d', '#683f22', 4), []);
  const rugTex = useMemo(() => createPersianRugTexture(), []);
  const tileTex = useMemo(() => createPersianTileTexture(), []);
  const bolsterTex = useMemo(() => createPersianBolsterTexture(), []);

  const [catPos, setCatPos] = useState<[number, number, number]>([0, 0, 0.25]);
  const [catRot, setCatRot] = useState(0);
  const [autoAnim, setAutoAnim] = useState<CatAnimationName>('Idle');
  const [lookTarget, setLookTarget] = useState<[number, number, number] | null>(null);
  const [lookAtUser, setLookAtUser] = useState(true);
  const [earPerked, setEarPerked] = useState(false);

  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const isManualCamRef = useRef(false);

  const posVec = useRef(new THREE.Vector3(0, 0, 0.25));
  const targetVec = useRef(new THREE.Vector3(0, 0, 0.25));
  const ballPos = useRef(new THREE.Vector3(1.5, 0.22, 1.1));
  const ballVel = useRef(new THREE.Vector3(0, 0, 0));
  const ballRef = useRef<THREE.Mesh>(null);
  const mouseRef = useRef<THREE.Group>(null);
  const pomPomRef = useRef<THREE.Mesh>(null);
  const bubblesRef = useRef<THREE.Group>(null);
  const wanderTimer = useRef(5.5);
  const idleChoiceRef = useRef<CatAnimationName>('Idle');
  const chaseBallRef = useRef(false);
  const comeToUserRef = useRef(false);

  const hasYarn = cat.unlockedItems.includes('yarn_ball');
  const hasCushion = cat.unlockedItems.includes('velvet_cushion');
  const hasMouse = cat.unlockedItems.includes('toy_mouse');
  const hasGoldBowl = cat.unlockedItems.includes('gold_bowl');
  const hasPlayTower = cat.unlockedItems.includes('play_tower');

  useEffect(() => {
    return () => {
      woodTex.dispose();
      rugTex.dispose();
      tileTex.dispose();
      bolsterTex.dispose();
    };
  }, [woodTex, rugTex, tileTex, bolsterTex]);

  useEffect(() => {
    isManualCamRef.current = false;
  }, [cameraPreset]);

  // React to Yarn Ball throw -> Cat tracks & chases the ball energetically!
  useEffect(() => {
    if (ballTrigger === 0) return;
    const angle = Math.random() * Math.PI * 2;
    ballPos.current.set(Math.cos(angle) * 2.0, 0.65, Math.sin(angle) * 2.0);
    ballVel.current.set(-Math.cos(angle) * 1.5, 2.4, -Math.sin(angle) * 1.5);
    targetVec.current.set(Math.cos(angle) * 1.3, 0, Math.sin(angle) * 1.3);
    chaseBallRef.current = true;
    comeToUserRef.current = false;
    setLookAtUser(false);
    setLookTarget([ballPos.current.x, 0.25, ballPos.current.z]);
    audioEngine.playSfx('toy');
  }, [ballTrigger]);

  // React to Call Cat -> Ear perk, look directly at user, trot warmly toward front-center!
  useEffect(() => {
    if (callTrigger === 0) return;
    chaseBallRef.current = false;
    comeToUserRef.current = true;
    setEarPerked(true);
    setLookAtUser(true);
    setLookTarget(null);
    targetVec.current.set(0, 0, 1.45);
    const id = window.setTimeout(() => setEarPerked(false), 2400);
    return () => window.clearTimeout(id);
  }, [callTrigger]);

  // Direct Care Action targets (smooth locomotion, never snapping)
  useEffect(() => {
    if (!activeAction) return;
    chaseBallRef.current = activeAction === 'Play';
    comeToUserRef.current = false;
    if (activeAction === 'Eat') {
      targetVec.current.set(-1.42, 0, 0.88);
      setLookAtUser(false);
      setLookTarget([-1.7, 0.14, 0.9]);
    } else if (activeAction === 'Drink') {
      targetVec.current.set(-1.02, 0, 1.06);
      setLookAtUser(false);
      setLookTarget([-1.14, 0.14, 1.08]);
    } else if (activeAction === 'Sleep') {
      targetVec.current.set(1.85, 0.08, -1.25);
      setLookAtUser(false);
      setLookTarget(null);
    } else if (activeAction === 'Bath') {
      targetVec.current.set(0, 0, 0.25);
      setLookAtUser(true);
    } else if (activeAction === 'Happy' || activeAction === 'Yawn' || activeAction === 'Stretch') {
      setLookAtUser(true);
      setLookTarget(null);
    }
  }, [activeAction]);

  useFrame(({ clock }, delta) => {
    const dt = Math.min(delta, 0.05);
    const t = clock.getElapsedTime();

    // Camera preset smooth glide
    if (controlsRef.current && !isManualCamRef.current) {
      const [cx, cy, cz] = [posVec.current.x, posVec.current.y, posVec.current.z];
      if (cameraPreset === 'closeup') {
        const faceOffsetX = Math.sin(catRot) * 1.12;
        const faceOffsetZ = Math.cos(catRot) * 1.12;
        _camGoal.set(cx + faceOffsetX, cy + 0.68, cz + faceOffsetZ);
        _targetGoal.set(cx + Math.sin(catRot) * 0.22, cy + 0.56, cz + Math.cos(catRot) * 0.22);
      } else if (cameraPreset === 'play') {
        _camGoal.set(0, 1.65, 4.4);
        _targetGoal.set(cx * 0.5, 0.45, cz * 0.5);
      } else {
        _camGoal.set(0, 2.45, 5.3);
        _targetGoal.set(0, 0.58, 0);
      }
      camera.position.lerp(_camGoal, Math.min(1, dt * 4.2));
      controlsRef.current.target.lerp(_targetGoal, Math.min(1, dt * 5.0));
      controlsRef.current.update();
    }

    // Yarn ball bounce physics
    if (ballRef.current) {
      ballVel.current.y -= 9.5 * dt;
      ballPos.current.addScaledVector(ballVel.current, dt);
      if (ballPos.current.y < 0.22) {
        ballPos.current.y = 0.22;
        ballVel.current.y = Math.abs(ballVel.current.y) > 0.4 ? -ballVel.current.y * 0.52 : 0;
        ballVel.current.x *= 0.82;
        ballVel.current.z *= 0.82;
      }
      ballPos.current.x = THREE.MathUtils.clamp(ballPos.current.x, -2.5, 2.5);
      ballPos.current.z = THREE.MathUtils.clamp(ballPos.current.z, -2.2, 2.2);
      ballRef.current.position.copy(ballPos.current);
      ballRef.current.rotation.x += ballVel.current.z * dt * 2;
      ballRef.current.rotation.z -= ballVel.current.x * dt * 2;
    }

    if (mouseRef.current) {
      mouseRef.current.rotation.y = Math.sin(t * 2.3) * 0.28 + 0.4;
    }
    if (pomPomRef.current) {
      pomPomRef.current.position.x = Math.sin(t * 2.5) * 0.09;
    }

    // Autonomous lifelike behavior when untouched by user
    if (!activeAction) {
      wanderTimer.current -= dt;
      if (wanderTimer.current <= 0) {
        wanderTimer.current = 5.5 + Math.random() * 5.0;
        chaseBallRef.current = false;
        comeToUserRef.current = false;

        const roll = Math.random();
        if (cat.energy < 34) {
          targetVec.current.set(1.85, 0.08, -1.25);
          idleChoiceRef.current = 'Sleep';
          setLookAtUser(false);
          onAutoState(`${cat.name} خوابش گرفته و روی تشک جمع شده است`, 'Sleep');
        } else if (roll < 0.22) {
          // Comes up warmly to check on user
          targetVec.current.set((Math.random() - 0.5) * 0.9, 0, 1.35);
          idleChoiceRef.current = 'Sit';
          setLookAtUser(true);
          onAutoState(`${cat.name} به سمتت آمد و با کنجکاوی نگاهت می‌کند`, 'Sit');
        } else if (roll < 0.40) {
          targetVec.current.set((Math.random() - 0.5) * 2.6, 0, (Math.random() - 0.5) * 2.1);
          idleChoiceRef.current = 'LickPaw';
          setLookAtUser(false);
          onAutoState(`${cat.name} نشسته و پنجه‌هایش را لیس می‌زند`, 'LickPaw');
        } else if (roll < 0.56) {
          idleChoiceRef.current = 'Groom';
          setLookAtUser(false);
          onAutoState(`${cat.name} مشغول تمیز کردن خزهایش است`, 'Groom');
        } else if (roll < 0.72) {
          idleChoiceRef.current = 'Stretch';
          setLookAtUser(true);
          onAutoState(`${cat.name} یک کش‌وقوس حسابی می‌آید`, 'Stretch');
        } else if (roll < 0.86) {
          idleChoiceRef.current = 'Yawn';
          audioEngine.playSfx('yawn');
          setLookAtUser(true);
          onAutoState(`${cat.name} خمیازه نرمی می‌کشد`, 'Yawn');
        } else {
          targetVec.current.set((Math.random() - 0.5) * 2.8, 0, -0.6 + Math.random() * 1.8);
          idleChoiceRef.current = 'Sit';
          setLookAtUser(true);
          onAutoState(`${cat.name} در اتاق قدم می‌زند`, 'Sit');
        }
      }
    }

    const dx = targetVec.current.x - posVec.current.x;
    const dz = targetVec.current.z - posVec.current.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 0.14) {
      const isRunning = chaseBallRef.current || comeToUserRef.current || dist > 2.2;
      const speed = isRunning ? 2.45 : 1.25;
      posVec.current.x += (dx / dist) * speed * dt;
      posVec.current.z += (dz / dist) * speed * dt;
      posVec.current.y = THREE.MathUtils.lerp(posVec.current.y, targetVec.current.y, dt * 5);
      setCatPos([posVec.current.x, posVec.current.y, posVec.current.z]);
      setCatRot(Math.atan2(dx, dz));
      setAutoAnim(isRunning ? 'Run' : 'Walk');
    } else {
      posVec.current.y = THREE.MathUtils.lerp(posVec.current.y, targetVec.current.y, dt * 5);
      setCatPos([posVec.current.x, posVec.current.y, posVec.current.z]);
      if (comeToUserRef.current) {
        // Face smoothly toward camera when arriving near user
        setCatRot(Math.atan2(camera.position.x - posVec.current.x, camera.position.z - posVec.current.z));
      }
      setAutoAnim(activeAction ?? (cat.energy < 28 ? 'Sleep' : idleChoiceRef.current));
    }

    if (bubblesRef.current && activeAction === 'Bath') {
      bubblesRef.current.children.forEach((b, idx) => {
        b.position.y = 0.3 + ((t * 0.9 + idx * 0.35) % 1.8);
        b.position.x = Math.sin(t * 2 + idx) * 0.45;
      });
    }
  });

  const currentAnim: CatAnimationName =
    autoAnim === 'Walk' || autoAnim === 'Run' ? autoAnim : activeAction || autoAnim;

  return (
    <>
      {/* Warm Iranian Golden-Hour Sunlight & Lantern Lighting */}
      <ambientLight intensity={0.38} color="#fff0d6" />
      <hemisphereLight args={['#fff2db', '#59311e', 0.68]} />
      <directionalLight position={[3.6, 7.2, 5.2]} intensity={1.18} color="#ffebd0" castShadow />
      <pointLight position={[-2.5, 2.2, -2.4]} color="#ffb75e" intensity={0.95} distance={10} />
      <pointLight position={[2.2, 2.5, 1.8]} color="#ffe0ba" intensity={0.7} distance={10} />

      {/* Warm Iranian Walnut Wood Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[14, 12]} />
        <meshStandardMaterial map={woodTex} roughness={0.58} />
      </mesh>

      {/* Authentic Rectangular Persian Carpet (فرش ایرانی لچک و ترنج) + Cream Fringes */}
      <group position={[0, 0.014, 0.15]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[5.2, 3.45]} />
          <meshStandardMaterial map={rugTex} roughness={0.94} />
        </mesh>
        {[-2.65, 2.65].map((fx, idx) => (
          <mesh key={idx} rotation={[-Math.PI / 2, 0, 0]} position={[fx, -0.001, 0]}>
            <planeGeometry args={[0.14, 3.38]} />
            <meshStandardMaterial color="#f2e4cb" roughness={0.95} />
          </mesh>
        ))}
      </group>

      {/* Soft Contact Shadow Grounding beneath Cat */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[catPos[0], 0.018, catPos[2]]}>
        <circleGeometry args={[0.42, 24]} />
        <meshBasicMaterial color="#1a0d12" transparent opacity={0.34} depthWrite={false} />
      </mesh>

      {/* Iranian Cream Plaster Back & Side Walls + Turquoise Tile Dado */}
      <mesh position={[0, 2.5, -3.5]} receiveShadow>
        <boxGeometry args={[13.2, 5.2, 0.22]} />
        <meshStandardMaterial color="#efe0c9" roughness={0.88} />
      </mesh>
      <mesh position={[-6.4, 2.5, 0.5]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[10, 5.2, 0.2]} />
        <meshStandardMaterial color="#e8d6bc" roughness={0.88} />
      </mesh>
      <mesh position={[6.4, 2.5, 0.5]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <boxGeometry args={[10, 5.2, 0.2]} />
        <meshStandardMaterial color="#e8d6bc" roughness={0.88} />
      </mesh>

      {/* Lower Iranian Ceramic Tile Dado & Gold/Walnut Molding */}
      <mesh position={[0, 0.58, -3.37]} receiveShadow>
        <boxGeometry args={[12.8, 1.16, 0.05]} />
        <meshStandardMaterial map={tileTex} roughness={0.42} />
      </mesh>
      <mesh position={[0, 1.18, -3.35]}>
        <boxGeometry args={[12.8, 0.07, 0.08]} />
        <meshStandardMaterial color="#7b4d2b" roughness={0.55} />
      </mesh>
      <mesh position={[0, 1.13, -3.34]}>
        <boxGeometry args={[12.8, 0.025, 0.085]} />
        <meshStandardMaterial color="#d4a84f" metalness={0.65} roughness={0.28} />
      </mesh>

      {/* Arched Iranian Orosi Window (پنجره ارسی با شیشه‌های رنگی) */}
      <group position={[0, 2.55, -3.36]}>
        {/* Outer Walnut Frame + Arch Crown */}
        <mesh position={[0, 0, -0.02]}>
          <boxGeometry args={[2.52, 1.75, 0.06]} />
          <meshStandardMaterial color="#6e4324" roughness={0.58} />
        </mesh>
        <mesh position={[0, 0.88, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[1.26, 1.26, 0.06, 24, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#6e4324" roughness={0.58} />
        </mesh>

        {/* Warm Sunlit Stained Glass Panes (فیروزه‌ای، کهربایی، لاجوردی، اناری) */}
        <mesh position={[0, 0, 0.015]}>
          <planeGeometry args={[2.28, 1.56]} />
          <meshStandardMaterial color="#ffdf9e" emissive="#ffd180" emissiveIntensity={0.42} roughness={0.2} />
        </mesh>
        <mesh position={[-0.76, 0, 0.02]}>
          <planeGeometry args={[0.56, 1.5]} />
          <meshStandardMaterial color="#2a9d98" emissive="#258783" emissiveIntensity={0.32} roughness={0.22} />
        </mesh>
        <mesh position={[0.76, 0, 0.02]}>
          <planeGeometry args={[0.56, 1.5]} />
          <meshStandardMaterial color="#2a9d98" emissive="#258783" emissiveIntensity={0.32} roughness={0.22} />
        </mesh>
        <mesh position={[0, 0.86, 0.018]} rotation={[0, 0, 0]}>
          <circleGeometry args={[1.12, 24, 0, Math.PI]} />
          <meshStandardMaterial color="#e09a3e" emissive="#d4882e" emissiveIntensity={0.35} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.86, 0.024]}>
          <circleGeometry args={[0.55, 20, 0, Math.PI]} />
          <meshStandardMaterial color="#a82438" emissive="#8f1e30" emissiveIntensity={0.35} roughness={0.2} />
        </mesh>

        {/* Wooden Orosi Lattice Mullions */}
        {[-0.46, 0, 0.46].map((mx, idx) => (
          <mesh key={idx} position={[mx, 0.16, 0.035]}>
            <boxGeometry args={[0.045, 1.9, 0.04]} />
            <meshStandardMaterial color="#5c361c" roughness={0.6} />
          </mesh>
        ))}
        {[-0.36, 0.22, 0.78].map((my, idx) => (
          <mesh key={idx} position={[0, my, 0.035]}>
            <boxGeometry args={[2.32, 0.045, 0.04]} />
            <meshStandardMaterial color="#5c361c" roughness={0.6} />
          </mesh>
        ))}
      </group>

      {/* Traditional Iranian Arched Niches (طاقچه‌های قوسی چپ و راست) */}
      <group position={[-2.65, 2.02, -3.35]}>
        <mesh>
          <boxGeometry args={[0.92, 1.05, 0.05]} />
          <meshStandardMaterial color="#1d355e" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.46, 0.46, 0.05, 20, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#1d355e" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.52, 0.08]}>
          <boxGeometry args={[1.0, 0.07, 0.22]} />
          <meshStandardMaterial color="#7b4d2b" roughness={0.5} />
        </mesh>
        {/* Brass Persian Lantern (فانوس برنجی) */}
        <mesh position={[0, -0.3, 0.1]}>
          <cylinderGeometry args={[0.11, 0.14, 0.32, 6]} />
          <meshStandardMaterial color="#ffca73" emissive="#ffb240" emissiveIntensity={0.85} roughness={0.25} />
        </mesh>
        <mesh position={[0, -0.09, 0.1]}>
          <coneGeometry args={[0.14, 0.14, 6]} />
          <meshStandardMaterial color="#d4a84f" metalness={0.82} roughness={0.22} />
        </mesh>
      </group>

      <group position={[2.65, 2.02, -3.35]}>
        <mesh>
          <boxGeometry args={[0.92, 1.05, 0.05]} />
          <meshStandardMaterial color="#1d355e" roughness={0.6} />
        </mesh>
        <mesh position={[0, 0.52, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.46, 0.46, 0.05, 20, 1, false, 0, Math.PI]} />
          <meshStandardMaterial color="#1d355e" roughness={0.6} />
        </mesh>
        <mesh position={[0, -0.52, 0.08]}>
          <boxGeometry args={[1.0, 0.07, 0.22]} />
          <meshStandardMaterial color="#7b4d2b" roughness={0.5} />
        </mesh>
        {/* Turquoise Glazed Persian Vase (گلدان فیروزه‌ای) */}
        <mesh position={[0, -0.32, 0.1]} castShadow>
          <cylinderGeometry args={[0.07, 0.12, 0.34, 16]} />
          <meshPhysicalMaterial color="#278c8c" roughness={0.18} clearcoat={0.8} />
        </mesh>
        <mesh position={[0, -0.11, 0.1]}>
          <cylinderGeometry args={[0.085, 0.06, 0.1, 16]} />
          <meshPhysicalMaterial color="#278c8c" roughness={0.18} clearcoat={0.8} />
        </mesh>
      </group>

      {/* Embroidered Iranian Bolster Cushions (پشتی ایرانی) */}
      {[-1.08, 1.08].map((bx, idx) => (
        <group key={idx} position={[bx, 0.32, -2.55]} rotation={[-0.18, 0, 0]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[0.96, 0.58, 0.34]} />
            <meshStandardMaterial map={bolsterTex} roughness={0.86} />
          </mesh>
          <mesh position={[0, 0.29, 0]}>
            <boxGeometry args={[0.98, 0.05, 0.36]} />
            <meshStandardMaterial color="#d4a84f" roughness={0.65} />
          </mesh>
        </group>
      ))}

      {/* Low Carved Wooden Persian Tea Table (میز چوبی کوچک با سینی چای) */}
      <group position={[2.65, 0, 1.45]}>
        <mesh position={[0, 0.22, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.42, 0.42, 0.05, 8]} />
          <meshStandardMaterial color="#784a28" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.11, 0]} castShadow>
          <cylinderGeometry args={[0.32, 0.36, 0.2, 8]} />
          <meshStandardMaterial color="#623a1e" roughness={0.58} />
        </mesh>
        <mesh position={[0, 0.255, 0]}>
          <cylinderGeometry args={[0.28, 0.26, 0.02, 20]} />
          <meshStandardMaterial color="#d6b05c" metalness={0.85} roughness={0.22} />
        </mesh>
        {/* Teacup & Teapot */}
        <mesh position={[-0.08, 0.34, -0.04]} castShadow>
          <sphereGeometry args={[0.085, 14, 12]} />
          <meshPhysicalMaterial color="#f5ead7" roughness={0.18} clearcoat={0.7} />
        </mesh>
        <mesh position={[0.1, 0.3, 0.06]}>
          <cylinderGeometry args={[0.036, 0.028, 0.07, 12]} />
          <meshPhysicalMaterial color="#9e2432" roughness={0.18} transparent opacity={0.85} />
        </mesh>
      </group>

      {/* Cat Cushion Bed (تشک مخملی با رنگ‌های گرم ایرانی) */}
      <group position={[1.85, 0, -1.25]}>
        <mesh position={[0, 0.08, 0]} castShadow receiveShadow>
          <cylinderGeometry args={[0.72, 0.78, 0.16, 24]} />
          <meshStandardMaterial color={hasCushion ? '#9e2432' : '#b89a84'} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.14, 0]}>
          <torusGeometry args={[0.62, 0.12, 12, 24]} />
          <meshStandardMaterial color={hasCushion ? '#d4a84f' : '#8c6f5a'} roughness={0.82} />
        </mesh>
      </group>

      {/* Food & Water Bowls (ظرف غذا و آب با کاشی فیروزه‌ای و مس/طلا) */}
      <group position={[-1.7, 0, 0.9]}>
        <mesh position={[0, 0.07, 0]} castShadow>
          <cylinderGeometry args={[0.25, 0.29, 0.14, 18]} />
          <meshStandardMaterial
            color={hasGoldBowl ? '#D6B875' : '#c96f3b'}
            roughness={hasGoldBowl ? 0.2 : 0.45}
            metalness={hasGoldBowl ? 0.8 : 0.35}
          />
        </mesh>
        <mesh position={[0, 0.12, 0]}>
          <cylinderGeometry args={[0.19, 0.19, 0.04, 16]} />
          <meshStandardMaterial color="#9e6442" roughness={0.8} />
        </mesh>
        <mesh position={[0.56, 0.07, 0.18]} castShadow>
          <cylinderGeometry args={[0.22, 0.26, 0.14, 18]} />
          <meshStandardMaterial color="#2b8685" roughness={0.3} />
        </mesh>
        <mesh position={[0.56, 0.12, 0.18]}>
          <cylinderGeometry args={[0.18, 0.18, 0.03, 16]} />
          <meshPhysicalMaterial color="#8ecbe0" roughness={0.1} clearcoat={1} />
        </mesh>
      </group>

      {/* Scratching Post / Play Tower */}
      <group position={[-2.2, 0, -1.8]}>
        <mesh position={[0, 0.06, 0]} castShadow>
          <boxGeometry args={[0.88, 0.12, 0.88]} />
          <meshStandardMaterial color="#f2e4cb" roughness={0.85} />
        </mesh>
        <mesh position={[0, 0.65, 0]} castShadow>
          <cylinderGeometry args={[0.11, 0.11, 1.15, 14]} />
          <meshStandardMaterial color="#c9a57b" roughness={0.95} />
        </mesh>
        <mesh position={[0, 1.25, 0]} castShadow>
          <cylinderGeometry args={[0.38, 0.38, 0.08, 18]} />
          <meshStandardMaterial color="#9e2432" roughness={0.85} />
        </mesh>
        {hasPlayTower && (
          <group>
            <mesh position={[0.42, 1.55, 0]} castShadow>
              <cylinderGeometry args={[0.07, 0.07, 0.65, 10]} />
              <meshStandardMaterial color="#c9a57b" roughness={0.95} />
            </mesh>
            <mesh position={[0.42, 1.9, 0]} castShadow>
              <cylinderGeometry args={[0.32, 0.32, 0.07, 16]} />
              <meshStandardMaterial color="#2b8685" roughness={0.85} />
            </mesh>
            <mesh ref={pomPomRef} position={[0.58, 1.62, 0]}>
              <sphereGeometry args={[0.08, 12, 12]} />
              <meshStandardMaterial color="#d4a84f" roughness={0.8} />
            </mesh>
          </group>
        )}
      </group>

      {/* Interactive Yarn Ball */}
      {hasYarn && (
        <mesh
          ref={ballRef}
          position={[1.5, 0.22, 1.1]}
          castShadow
          onClick={(e) => {
            e.stopPropagation();
            const a = Math.random() * Math.PI * 2;
            ballVel.current.set(Math.cos(a) * 2.5, 2.8, Math.sin(a) * 2.5);
            targetVec.current.set(Math.cos(a) * 1.4, 0, Math.sin(a) * 1.4);
            chaseBallRef.current = true;
            audioEngine.playSfx('toy');
          }}
        >
          <sphereGeometry args={[0.21, 18, 18]} />
          <meshStandardMaterial color="#e0744a" roughness={0.88} />
        </mesh>
      )}

      {/* Unlocked Toy Mouse */}
      {hasMouse && (
        <group
          ref={mouseRef}
          position={[-0.75, 0.09, 1.35]}
          onClick={(e) => {
            e.stopPropagation();
            audioEngine.playSfx('toy');
            chaseBallRef.current = true;
            setLookAtUser(false);
            setLookTarget([-0.75, 0.1, 1.35]);
            targetVec.current.set(-0.55, 0, 1.15);
          }}
        >
          <mesh scale={[1.3, 0.75, 0.8]} castShadow>
            <sphereGeometry args={[0.13, 14, 14]} />
            <meshStandardMaterial color="#a6a9bd" roughness={0.85} />
          </mesh>
          <mesh position={[0.09, 0.07, 0.06]}>
            <sphereGeometry args={[0.04, 10, 10]} />
            <meshStandardMaterial color="#f2a2b4" roughness={0.8} />
          </mesh>
          <mesh position={[0.09, 0.07, -0.06]}>
            <sphereGeometry args={[0.04, 10, 10]} />
            <meshStandardMaterial color="#f2a2b4" roughness={0.8} />
          </mesh>
          <mesh position={[-0.2, 0.02, 0]} rotation={[0, 0, 0.3]}>
            <cylinderGeometry args={[0.012, 0.015, 0.22, 8]} />
            <meshStandardMaterial color="#f2a2b4" roughness={0.8} />
          </mesh>
        </group>
      )}

      {/* Sculpted Expressive Orange Cat */}
      <CatActor3D
        breed={cat.breed}
        customFurColor={cat.customFurColor}
        accessory={cat.accessory}
        stage={cat.stage}
        animation={currentAnim}
        emotion={emotion}
        position={catPos}
        rotationY={catRot}
        lookAtUser={lookAtUser}
        lookTarget={lookTarget}
        isPetting={activeAction === 'Happy'}
        earPerked={earPerked}
        customGlbBuffer={customGlbBuffer}
        onHeadClick={onPetHead}
        onBodyClick={onPetBody}
        onFootstep={() => audioEngine.playSfx('step')}
      />

      {/* Bath Bubbles */}
      {activeAction === 'Bath' && (
        <group ref={bubblesRef} position={catPos}>
          {[0, 1, 2, 3, 4, 5, 6].map((i) => (
            <mesh key={i} position={[(i - 3) * 0.2, 0.5, ((i % 3) - 1) * 0.25]}>
              <sphereGeometry args={[0.08 + (i % 3) * 0.03, 12, 12]} />
              <meshPhysicalMaterial color="#ffffff" transparent opacity={0.55} roughness={0.05} clearcoat={1} />
            </mesh>
          ))}
        </group>
      )}

      {(activeAction === 'Happy' || activeAction === 'Stretch') && (
        <Sparkles count={24} position={[catPos[0], 0.9, catPos[2]]} scale={1.4} size={4} color="#D9A9C5" />
      )}

      <OrbitControls
        ref={controlsRef}
        enableDamping
        dampingFactor={0.05}
        minDistance={1.05}
        maxDistance={9}
        maxPolarAngle={Math.PI * 0.48}
        target={[0, 0.65, 0]}
        onStart={() => {
          isManualCamRef.current = true;
        }}
      />
    </>
  );
}

export const CatGameWorld: React.FC = () => {
  const cat = useUniverseStore((s) => s.cat);
  const audio = useUniverseStore((s) => s.audio);
  const starsCurrency = useUniverseStore((s) => s.starsCurrency);
  const updateCatProfile = useUniverseStore((s) => s.updateCatProfile);
  const interactWithCat = useUniverseStore((s) => s.interactWithCat);
  const unlockCatItem = useUniverseStore((s) => s.unlockCatItem);
  const tickCatNeeds = useUniverseStore((s) => s.tickCatNeeds);
  const setAudioSettings = useUniverseStore((s) => s.setAudioSettings);

  const [activeAction, setActiveAction] = useState<CatAnimationName | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('room');
  const [ballTrigger, setBallTrigger] = useState(0);
  const [callTrigger, setCallTrigger] = useState(0);
  const [tab, setTab] = useState<'care' | 'shop' | 'style'>('care');
  const [dockOpen, setDockOpen] = useState(true);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(cat.name);
  const [shopNotice, setShopNotice] = useState<string | null>(null);
  const [liveStatus, setLiveStatus] = useState<string>(`${cat.name} با چشم‌های براقش کنارت نشسته است`);
  const [emotionOverride, setEmotionOverride] = useState<CatEmotion | null>(null);
  const [customGlbBuffer, setCustomGlbBuffer] = useState<ArrayBuffer | undefined>();
  const glbInputRef = useRef<HTMLInputElement>(null);
  const actionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    tickCatNeeds();
    const id = window.setInterval(tickCatNeeds, 15000);
    return () => window.clearInterval(id);
  }, [tickCatNeeds]);

  useEffect(() => {
    audioEngine.setMuted(audio.muted);
  }, [audio.muted]);

  const currentEmotion: CatEmotion = emotionOverride || deriveCatEmotion(cat, activeAction);

  const scheduleActionClear = (ms = 3400) => {
    if (actionTimerRef.current) window.clearTimeout(actionTimerRef.current);
    actionTimerRef.current = window.setTimeout(() => {
      setActiveAction(null);
      setEmotionOverride(null);
    }, ms);
  };

  const triggerCare = (
    care: 'feed' | 'drink' | 'pet' | 'play' | 'bath' | 'sleep' | 'stretch' | 'yawn' | 'lick_paw' | 'groom' | 'call',
    anim: CatAnimationName,
    customText?: string,
    forcedEmotion?: CatEmotion
  ) => {
    interactWithCat(care);
    setActiveAction(anim);
    if (forcedEmotion) setEmotionOverride(forcedEmotion);

    if (care === 'play') {
      setBallTrigger((n) => n + 1);
      audioEngine.playSfx('meow');
      setLiveStatus(customText || `${cat.name} با ذوق دنبال توپ می‌دود!`);
    } else if (care === 'pet') {
      audioEngine.playSfx('purr');
      setLiveStatus(customText || `${cat.name} چشم‌هایش را نیمه‌بسته کرده و خرخر می‌کند`);
    } else if (care === 'call') {
      setCallTrigger((n) => n + 1);
      audioEngine.playSfx('meow');
      setLiveStatus(customText || `${cat.name} گوش‌هایش را تیز کرد و به طرفت دوید!`);
    } else if (care === 'bath' || care === 'drink') {
      audioEngine.playSfx('water');
      setLiveStatus(customText || (care === 'bath' ? `${cat.name} در حال تمیز شدن است` : `${cat.name} آب گوارا می‌نوشد`));
    } else if (care === 'yawn') {
      audioEngine.playSfx('yawn');
      setLiveStatus(customText || `${cat.name} خمیازه نرم و دوست‌داشتنی می‌کشد`);
    } else {
      audioEngine.playSfx('sparkle');
      setLiveStatus(customText || `${cat.name} با حس خوب مشغول است`);
    }

    scheduleActionClear(care === 'sleep' ? 4500 : 3400);
  };

  const handleBuyItem = (item: (typeof CAT_SHOP_ITEMS)[number]) => {
    if (cat.unlockedItems.includes(item.id)) {
      setShopNotice(`«${item.label}» همین الان در اتاق آماده است.`);
      return;
    }
    const ok = unlockCatItem(item.id, item.cost);
    if (ok) {
      audioEngine.playSfx('sparkle');
      setShopNotice(`«${item.label}» خریداری و به اتاق اضافه شد!`);
    } else {
      setShopNotice(`برای خرید «${item.label}» به ${toPersianDigits(item.cost)} ستاره نیاز داری.`);
    }
  };

  const stageLabel = cat.stage === 'kitten' ? 'بچه‌گربه' : cat.stage === 'young' ? 'گربه جوان' : 'گربه بالغ';

  const handleGlbUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const buf = await file.arrayBuffer();
    setCustomGlbBuffer(buf);
  };

  return (
    <div className="relative w-full h-full">
      <SceneCanvas cameraPosition={[0, 2.45, 5.3]} fov={44} bgColor="#2a1d24">
        <CatRoomScene
          activeAction={activeAction}
          emotion={currentEmotion}
          cameraPreset={cameraPreset}
          callTrigger={callTrigger}
          ballTrigger={ballTrigger}
          customGlbBuffer={customGlbBuffer}
          onPetHead={() =>
            triggerCare('pet', 'Happy', `${cat.name} سرش را به دستت می‌ساید و آرام خرخر می‌کند`, 'affectionate')
          }
          onPetBody={() =>
            triggerCare('stretch', 'Stretch', `${cat.name} از نوازش لذت می‌برد و کش‌وقوس می‌آید`, 'happy')
          }
          onAutoState={(status) => setLiveStatus(status)}
        />
      </SceneCanvas>

      {/* Cat Identity, Emotion Badge, Sound Toggle & 5 Care Status Bars */}
      <div className="fixed top-16 sm:top-20 right-3 sm:right-5 z-20 w-56 sm:w-64 rounded-2xl bg-[#17172F]/92 border border-[#D9A9C5]/35 p-3 shadow-xl space-y-2">
        <div className="flex items-center justify-between gap-2">
          {editingName ? (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (nameInput.trim()) updateCatProfile({ name: nameInput.trim() });
                setEditingName(false);
              }}
              className="flex items-center gap-1 w-full"
            >
              <input
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                className="w-full px-2 py-1 rounded-lg bg-[#25254a] text-xs text-[#F1DCCB] outline-none border border-[#D6B875]"
                autoFocus
              />
              <button type="submit" className="text-xs text-[#D6B875] px-1.5 cursor-pointer">
                ثبت
              </button>
            </form>
          ) : (
            <>
              <div className="min-w-0">
                <div className="font-bold text-sm text-[#F1DCCB] truncate">{cat.name}</div>
                <div className="text-[11px] text-[#D9A9C5] truncate">
                  {stageLabel} · {CAT_EMOTION_LABELS[currentEmotion]}
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const nextMuted = !audio.muted;
                    setAudioSettings({ muted: nextMuted });
                    audioEngine.setMuted(nextMuted);
                  }}
                  aria-label={audio.muted ? 'روشن کردن صدای گربه' : 'بی‌صدا کردن گربه'}
                  title={audio.muted ? 'روشن کردن صدا' : 'بی‌صدا'}
                  className="p-1.5 rounded-lg bg-[#232347] text-[#A6BBAA] hover:text-[#F1DCCB] cursor-pointer"
                >
                  {audio.muted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setNameInput(cat.name);
                    setEditingName(true);
                  }}
                  aria-label="تغییر نام گربه"
                  className="p-1.5 rounded-lg bg-[#232347] text-[#D6B875] cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </>
          )}
        </div>

        {(
          [
            ['سیری', cat.hunger, '#D6B875'],
            ['شادی', cat.happiness, '#D9A9C5'],
            ['انرژی', cat.energy, '#7771A8'],
            ['تمیزی', cat.cleanliness, '#A6BBAA'],
            ['محبت', cat.affection, '#eb8d3b'],
          ] as [string, number, string][]
        ).map(([label, val, col]) => (
          <div key={label} className="space-y-0.5">
            <div className="flex justify-between text-[11px] text-[#F1DCCB]">
              <span>{label}</span>
              <span className="tabular-nums">{toPersianDigits(Math.round(val))}٪</span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-[#26264a] overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{ width: `${val}%`, backgroundColor: col }}
              />
            </div>
          </div>
        ))}

        <div className="text-[11px] text-[#F1DCCB]/85 border-t border-[#7771A8]/25 pt-1.5 leading-relaxed">
          {liveStatus}
        </div>
      </div>

      {/* Camera Inspection Presets (Close-up Face Check vs Room View) */}
      <div className="fixed top-16 sm:top-20 left-3 sm:left-5 z-20 flex flex-col gap-1.5">
        <button
          type="button"
          onClick={() => setCameraPreset('closeup')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border shadow-lg cursor-pointer ${
            cameraPreset === 'closeup'
              ? 'bg-[#D6B875] border-[#D6B875] text-[#17172F] font-bold'
              : 'bg-[#17172F]/90 border-[#7771A8]/45 text-[#F1DCCB]'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>نمای نزدیک چهره</span>
        </button>
        <button
          type="button"
          onClick={() => setCameraPreset('room')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border shadow-lg cursor-pointer ${
            cameraPreset === 'room'
              ? 'bg-[#7771A8] border-[#7771A8] text-[#F1DCCB] font-semibold'
              : 'bg-[#17172F]/90 border-[#7771A8]/45 text-[#F1DCCB]'
          }`}
        >
          <Camera className="w-3.5 h-3.5" />
          <span>نمای اتاق</span>
        </button>
      </div>

      {/* Collapsible Bottom Control Dock */}
      <div className="fixed bottom-3 inset-x-0 z-20 flex flex-col items-center px-3 pointer-events-none">
        <button
          type="button"
          onClick={() => setDockOpen((v) => !v)}
          className="pointer-events-auto mb-1.5 px-3.5 py-1 rounded-t-xl bg-[#17172F]/92 border border-b-0 border-[#D9A9C5]/40 text-[11px] text-[#F1DCCB] cursor-pointer"
        >
          {dockOpen ? 'جمع کردن ابزارهای گربه' : 'باز کردن مراقبت و فروشگاه گربه'}
        </button>

        {dockOpen && (
          <div className="pointer-events-auto w-full max-w-3xl rounded-2xl bg-[#17172F]/94 border border-[#7771A8]/40 p-3 shadow-2xl space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setTab('care')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer ${
                    tab === 'care' ? 'bg-[#7771A8] text-[#F1DCCB]' : 'bg-[#212142] text-[#D9A9C5]'
                  }`}
                >
                  مراقبت و تعامل
                </button>
                <button
                  type="button"
                  onClick={() => setTab('shop')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer ${
                    tab === 'shop' ? 'bg-[#7771A8] text-[#F1DCCB]' : 'bg-[#212142] text-[#D9A9C5]'
                  }`}
                >
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span>فروشگاه وسایل</span>
                </button>
                <button
                  type="button"
                  onClick={() => setTab('style')}
                  className={`px-3 py-1.5 rounded-xl text-xs font-medium cursor-pointer ${
                    tab === 'style' ? 'bg-[#7771A8] text-[#F1DCCB]' : 'bg-[#212142] text-[#D9A9C5]'
                  }`}
                >
                  احساس، رنگ و اکسسوری
                </button>
              </div>
              <input ref={glbInputRef} type="file" accept=".glb,.gltf" onChange={handleGlbUpload} className="hidden" />
              <button
                type="button"
                onClick={() => glbInputRef.current?.click()}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#212142] text-[11px] text-[#D6B875] cursor-pointer"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>مدل GLB دلخواه</span>
              </button>
            </div>

            {tab === 'care' && (
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => triggerCare('call', 'Happy', undefined, 'curious')}
                  className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl bg-[#292652] hover:bg-[#36326b] border border-[#D6B875]/35 text-xs text-[#F1DCCB] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Megaphone className="w-4 h-4 text-[#D6B875]" />
                  <span>صدا زدن</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerCare('pet', 'Happy', undefined, 'affectionate')}
                  className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl bg-[#222246] hover:bg-[#2d2d59] text-xs text-[#F1DCCB] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Heart className="w-4 h-4 text-[#D9A9C5]" />
                  <span>نوازش</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerCare('feed', 'Eat', `${cat.name} با اشتها غذا می‌خورد`, 'happy')}
                  className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl bg-[#222246] hover:bg-[#2d2d59] text-xs text-[#F1DCCB] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Utensils className="w-4 h-4 text-[#D6B875]" />
                  <span>غذا</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerCare('drink', 'Drink', `${cat.name} جرعه‌جرعه آب می‌نوشد`, 'happy')}
                  className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl bg-[#222246] hover:bg-[#2d2d59] text-xs text-[#F1DCCB] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Droplets className="w-4 h-4 text-[#8ecbe0]" />
                  <span>آب</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerCare('play', 'Play', undefined, 'excited')}
                  className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl bg-[#222246] hover:bg-[#2d2d59] text-xs text-[#F1DCCB] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <SparklesIcon className="w-4 h-4 text-[#D6B875]" />
                  <span>بازی</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerCare('bath', 'Bath', undefined, 'happy')}
                  className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl bg-[#222246] hover:bg-[#2d2d59] text-xs text-[#F1DCCB] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Bath className="w-4 h-4 text-[#A6BBAA]" />
                  <span>حمام</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerCare('sleep', 'Sleep', `${cat.name} آرام چشمانش را بسته و می‌خوابد`, 'sleepy')}
                  className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl bg-[#222246] hover:bg-[#2d2d59] text-xs text-[#F1DCCB] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Moon className="w-4 h-4 text-[#7771A8]" />
                  <span>خواب</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerCare('stretch', 'Stretch', `${cat.name} یک کش‌وقوس آرامش‌بخش می‌آید`, 'happy')}
                  className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl bg-[#222246] hover:bg-[#2d2d59] text-xs text-[#F1DCCB] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Sun className="w-4 h-4 text-[#eb8d3b]" />
                  <span>کش‌وقوس</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerCare('yawn', 'Yawn', undefined, 'sleepy')}
                  className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl bg-[#222246] hover:bg-[#2d2d59] text-xs text-[#F1DCCB] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Moon className="w-4 h-4 text-[#D9A9C5]" />
                  <span>خمیازه</span>
                </button>
                <button
                  type="button"
                  onClick={() => triggerCare('lick_paw', 'LickPaw', `${cat.name} پنجه‌های تمیزش را لیس می‌زند`, 'affectionate')}
                  className="flex flex-col items-center gap-1 py-2 px-3 rounded-xl bg-[#222246] hover:bg-[#2d2d59] text-xs text-[#F1DCCB] whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <SparklesIcon className="w-4 h-4 text-[#A6BBAA]" />
                  <span>لیسیدن پنجه</span>
                </button>
              </div>
            )}

            {tab === 'shop' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[11px] text-[#D6B875]">
                  <span>موجودی ستاره‌ها: {toPersianDigits(starsCurrency)} ستاره</span>
                  {shopNotice && <span className="text-[#A6BBAA]">{shopNotice}</span>}
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {CAT_SHOP_ITEMS.map((item) => {
                    const owned = cat.unlockedItems.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleBuyItem(item)}
                        className={`flex flex-col items-start gap-0.5 px-3 py-2 rounded-xl border text-right whitespace-nowrap shrink-0 cursor-pointer ${
                          owned
                            ? 'bg-[#2a334d] border-[#A6BBAA]/60 text-[#F1DCCB]'
                            : 'bg-[#222246] border-[#7771A8]/35 text-[#F1DCCB] hover:border-[#D6B875]'
                        }`}
                      >
                        <div className="flex items-center gap-1.5 text-xs font-semibold">
                          <span>{item.label}</span>
                          <span className="text-[10px] text-[#D6B875]">
                            {owned ? 'موجود ✓' : `${toPersianDigits(item.cost)} ستاره`}
                          </span>
                        </div>
                        <div className="text-[10px] text-[#D9A9C5]/80">{item.desc}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {tab === 'style' && (
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <span className="text-xs text-[#D6B875] shrink-0">حالت احساسی:</span>
                  {(Object.entries(CAT_EMOTION_LABELS) as [CatEmotion, string][]).map(([em, label]) => (
                    <button
                      key={em}
                      type="button"
                      onClick={() => setEmotionOverride(em)}
                      className={`px-2.5 py-1.5 rounded-xl text-xs whitespace-nowrap shrink-0 border cursor-pointer ${
                        currentEmotion === em
                          ? 'bg-[#7771A8] border-[#D6B875] text-[#F1DCCB] font-semibold'
                          : 'bg-[#212142] border-transparent text-[#D9A9C5]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <span className="text-xs text-[#D6B875] shrink-0">رنگ خز:</span>
                  {BREEDS.map((b) => (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => updateCatProfile({ breed: b.id, customFurColor: undefined })}
                      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs whitespace-nowrap shrink-0 border cursor-pointer ${
                        cat.breed === b.id && !cat.customFurColor
                          ? 'bg-[#7771A8]/45 border-[#D6B875] text-[#F1DCCB]'
                          : 'bg-[#212142] border-transparent text-[#D9A9C5]'
                      }`}
                    >
                      <span className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: b.color }} />
                      <span>{b.label}</span>
                    </button>
                  ))}
                  <label className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs whitespace-nowrap shrink-0 bg-[#212142] border border-[#D6B875]/35 text-[#F1DCCB] cursor-pointer">
                    <input
                      type="color"
                      value={cat.customFurColor || '#f47b16'}
                      onChange={(e) => updateCatProfile({ breed: 'honey', customFurColor: e.target.value })}
                      className="w-4 h-4 rounded border-0 bg-transparent cursor-pointer p-0"
                    />
                    <span>رنگ دلخواه</span>
                  </label>
                </div>
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <span className="text-xs text-[#D6B875] shrink-0">اکسسوری:</span>
                  {ACCESSORIES.map((a) => (
                    <button
                      key={a.id}
                      type="button"
                      onClick={() => updateCatProfile({ accessory: a.id })}
                      className={`px-2.5 py-1.5 rounded-xl text-xs whitespace-nowrap shrink-0 border cursor-pointer ${
                        cat.accessory === a.id
                          ? 'bg-[#D9A9C5] border-[#D9A9C5] text-[#17172F] font-semibold'
                          : 'bg-[#212142] border-transparent text-[#F1DCCB]'
                      }`}
                    >
                      {a.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

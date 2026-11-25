import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { Sparkles } from '@react-three/drei';
import * as THREE from 'three';
import photoFiles from 'virtual:museum-photos';
import {
  ChevronLeft,
  ChevronRight,
  Compass,
  Crosshair,
  RotateCcw,
  SlidersHorizontal,
  Sun,
  X,
} from 'lucide-react';
import { SceneCanvas } from '../../components/SceneCanvas';
import { createMarbleTileTexture } from '../../systems/proceduralTextures';
import { audioEngine } from '../../systems/audioEngine';
import { toPersianDigits } from '../../core/persianUtils';
import {
  buildMuseumCollisionWorld,
  movePlayerWithCollision,
  MUSEUM_HALL2_POS,
  MUSEUM_START_POS,
  PLAYER_EYE_HEIGHT,
  resolveCapsulePosition2D,
  type MuseumCollisionWorld,
} from './museumPhysics';

type GalleryMood = 'gallery' | 'golden' | 'midnight';
type FrameStyle = 'classic_gold' | 'warm_wood' | 'minimal_modern' | 'ornate_artistic';

interface PhotoSlot {
  index: number;
  src: string;
  position: [number, number, number];
  rotationY: number;
  normal: [number, number, number];
  style: FrameStyle;
  baseSize: number;
}

interface MovementSettings {
  walkSpeed: number;
  moveSensitivity: number;
  lookSensitivity: number;
  touchControls: boolean;
}

interface TeleportRequest {
  target: 'start' | 'hall1' | 'hall2';
  seq: number;
}

function getPhotoUrl(filename: string): string {
  const base = import.meta.env.BASE_URL || './';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}museum/photos/${encodeURIComponent(filename)}`;
}

function buildGalleryLayout(files: string[]): { slots: PhotoSlot[]; hall2DepthExtra: number } {
  const styles: FrameStyle[] = ['classic_gold', 'warm_wood', 'ornate_artistic', 'minimal_modern'];
  const basePresets: Omit<PhotoSlot, 'index' | 'src'>[] = [
    // Hall 1 (Golden Rotunda, z: 3 to -7)
    { position: [-6.75, 2.35, 1.4], rotationY: Math.PI / 2, normal: [1, 0, 0], style: 'classic_gold', baseSize: 2.05 },
    { position: [-6.75, 2.45, -3.2], rotationY: Math.PI / 2, normal: [1, 0, 0], style: 'warm_wood', baseSize: 1.85 },
    { position: [6.75, 2.35, 1.4], rotationY: -Math.PI / 2, normal: [-1, 0, 0], style: 'ornate_artistic', baseSize: 2.05 },
    { position: [6.75, 2.45, -3.2], rotationY: -Math.PI / 2, normal: [-1, 0, 0], style: 'minimal_modern', baseSize: 1.85 },
    // Hall 1 flank walls near archway
    { position: [-4.2, 2.4, -7.25], rotationY: 0, normal: [0, 0, 1], style: 'ornate_artistic', baseSize: 1.75 },
    { position: [4.2, 2.4, -7.25], rotationY: 0, normal: [0, 0, 1], style: 'classic_gold', baseSize: 1.75 },
    // Hall 2 (Moonlight Wing, z: -11 to -22)
    { position: [-6.75, 2.35, -13.2], rotationY: Math.PI / 2, normal: [1, 0, 0], style: 'minimal_modern', baseSize: 2.0 },
    { position: [-6.75, 2.4, -17.8], rotationY: Math.PI / 2, normal: [1, 0, 0], style: 'classic_gold', baseSize: 1.95 },
    { position: [6.75, 2.35, -13.2], rotationY: -Math.PI / 2, normal: [-1, 0, 0], style: 'warm_wood', baseSize: 2.0 },
    { position: [6.75, 2.4, -17.8], rotationY: -Math.PI / 2, normal: [-1, 0, 0], style: 'ornate_artistic', baseSize: 1.95 },
    // Hall 2 feature end wall
    { position: [-2.1, 2.5, -21.75], rotationY: 0, normal: [0, 0, 1], style: 'classic_gold', baseSize: 2.1 },
    { position: [2.1, 2.5, -21.75], rotationY: 0, normal: [0, 0, 1], style: 'warm_wood', baseSize: 2.1 },
  ];

  const slots: PhotoSlot[] = [];
  let extraBays = 0;

  if (files.length <= basePresets.length) {
    files.forEach((f, i) => {
      slots.push({
        ...basePresets[i],
        index: i,
        src: getPhotoUrl(f),
      });
    });
  } else {
    const fixedSide = basePresets.slice(0, 10);
    fixedSide.forEach((preset, i) => {
      slots.push({ ...preset, index: i, src: getPhotoUrl(files[i]) });
    });

    let cursor = 10;
    let bayZ = -22.4;
    while (cursor < files.length - 2) {
      extraBays += 1;
      slots.push({
        index: cursor,
        src: getPhotoUrl(files[cursor]),
        position: [-6.75, 2.38, bayZ],
        rotationY: Math.PI / 2,
        normal: [1, 0, 0],
        style: styles[cursor % styles.length],
        baseSize: 1.95,
      });
      cursor++;
      if (cursor < files.length - 2) {
        slots.push({
          index: cursor,
          src: getPhotoUrl(files[cursor]),
          position: [6.75, 2.38, bayZ],
          rotationY: -Math.PI / 2,
          normal: [-1, 0, 0],
          style: styles[cursor % styles.length],
          baseSize: 1.95,
        });
        cursor++;
      }
      bayZ -= 4.6;
    }

    const endZ = -21.75 - extraBays * 4.6;
    if (cursor < files.length) {
      slots.push({
        index: cursor,
        src: getPhotoUrl(files[cursor]),
        position: cursor + 1 < files.length ? [-2.1, 2.5, endZ] : [0, 2.5, endZ],
        rotationY: 0,
        normal: [0, 0, 1],
        style: 'classic_gold',
        baseSize: 2.15,
      });
      cursor++;
    }
    if (cursor < files.length) {
      slots.push({
        index: cursor,
        src: getPhotoUrl(files[cursor]),
        position: [2.1, 2.5, endZ],
        rotationY: 0,
        normal: [0, 0, 1],
        style: 'ornate_artistic',
        baseSize: 2.15,
      });
    }
  }

  return { slots, hall2DepthExtra: extraBays * 4.6 };
}

function wrapAngleDelta(current: number, target: number): number {
  let diff = (target - current) % (Math.PI * 2);
  if (diff > Math.PI) diff -= Math.PI * 2;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return diff;
}

function detectTouchCapable(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(pointer: coarse)').matches ||
    'ontouchstart' in window ||
    window.innerWidth < 768
  );
}

function PhotoFrame3D({
  slot,
  active,
  onSelect,
  suppressClickUntilRef,
}: {
  slot: PhotoSlot;
  active: boolean;
  onSelect: (slot: PhotoSlot) => void;
  suppressClickUntilRef: React.MutableRefObject<number>;
}) {
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
        loaded.minFilter = THREE.LinearFilter;
        const img = loaded.image as { width?: number; height?: number } | undefined;
        if (img?.width && img?.height) {
          setAspect(img.width / img.height);
        }
        setTexture(loaded);
      },
      undefined,
      () => {
        // Ignore broken image gracefully without displaying filenames
      }
    );
    return () => {
      cancelled = true;
    };
  }, [slot.src]);

  useEffect(() => {
    return () => {
      if (texture) texture.dispose();
    };
  }, [texture]);

  const maxSpan = slot.baseSize;
  const artW = aspect >= 1 ? maxSpan : maxSpan * aspect;
  const artH = aspect >= 1 ? maxSpan / aspect : maxSpan;
  const matPad = slot.style === 'minimal_modern' ? 0.1 : 0.16;
  const borderW = slot.style === 'ornate_artistic' ? 0.14 : slot.style === 'minimal_modern' ? 0.06 : 0.11;

  const totalW = artW + matPad * 2 + borderW * 2;
  const totalH = artH + matPad * 2 + borderW * 2;

  const frameColor =
    slot.style === 'classic_gold'
      ? '#D6B875'
      : slot.style === 'warm_wood'
        ? '#5b3c2b'
        : slot.style === 'ornate_artistic'
          ? '#D9A9C5'
          : '#1e1d38';
  const frameMetal = slot.style === 'classic_gold' || slot.style === 'ornate_artistic' ? 0.85 : 0.15;
  const frameRough = slot.style === 'classic_gold' ? 0.22 : slot.style === 'warm_wood' ? 0.55 : 0.35;

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
      <pointLight
        position={[0, totalH * 0.68, 0.85]}
        color={active || hovered ? '#ffe6b3' : '#f3dec3'}
        intensity={active ? 2.4 : hovered ? 1.8 : 1.15}
        distance={5.5}
      />

      {/* Overhead Brass Gallery Picture Lamp */}
      <group position={[0, totalH * 0.5 + 0.22, 0.16]}>
        <mesh position={[0, 0, -0.08]}>
          <boxGeometry args={[0.08, 0.06, 0.22]} />
          <meshStandardMaterial color="#D6B875" metalness={0.85} roughness={0.22} />
        </mesh>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.038, 0.038, Math.min(0.85, totalW * 0.48), 12]} />
          <meshStandardMaterial
            color="#D6B875"
            emissive="#ffe29a"
            emissiveIntensity={active || hovered ? 0.8 : 0.45}
            metalness={0.82}
            roughness={0.22}
          />
        </mesh>
      </group>

      {/* Frame Backing & Outer Molding */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[totalW, totalH, 0.09]} />
        <meshStandardMaterial color={frameColor} metalness={frameMetal} roughness={frameRough} />
      </mesh>

      {slot.style === 'ornate_artistic' &&
        [
          [-totalW * 0.46, totalH * 0.46],
          [totalW * 0.46, totalH * 0.46],
          [-totalW * 0.46, -totalH * 0.46],
          [totalW * 0.46, -totalH * 0.46],
        ].map(([cx, cy], idx) => (
          <mesh key={idx} position={[cx, cy, 0.055]}>
            <sphereGeometry args={[0.065, 10, 10]} />
            <meshStandardMaterial color="#D6B875" metalness={0.9} roughness={0.18} />
          </mesh>
        ))}

      {(slot.style === 'warm_wood' || slot.style === 'minimal_modern') && (
        <mesh position={[0, 0, 0.048]}>
          <boxGeometry args={[artW + matPad * 2 + 0.04, artH + matPad * 2 + 0.04, 0.012]} />
          <meshStandardMaterial color="#D6B875" metalness={0.85} roughness={0.24} />
        </mesh>
      )}

      {/* Museum Cream Passe-Partout Mat */}
      <mesh position={[0, 0, 0.055]}>
        <boxGeometry args={[artW + matPad * 2, artH + matPad * 2, 0.015]} />
        <meshStandardMaterial color="#f5ede4" roughness={0.88} />
      </mesh>

      {/* Actual Photo Surface (zero text metadata anywhere) */}
      <mesh position={[0, 0, 0.068]}>
        <planeGeometry args={[artW, artH]} />
        {texture ? (
          <meshBasicMaterial map={texture} toneMapped={false} />
        ) : (
          <meshStandardMaterial color="#2a284a" roughness={0.7} />
        )}
      </mesh>
    </group>
  );
}

function CentralSculpture({ position, variant }: { position: [number, number, number]; variant: 'heart' | 'nebula' }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (!ref.current) return;
    ref.current.rotation.y = t * 0.42;
    if (variant === 'heart') {
      ref.current.position.y = 1.65 + Math.sin(t * 1.4) * 0.08;
    }
  });

  return (
    <group position={position}>
      <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.58, 0.7, 0.96, 20]} />
        <meshStandardMaterial color="#252444" roughness={0.35} metalness={0.15} />
      </mesh>
      <mesh position={[0, 0.98, 0]}>
        <cylinderGeometry args={[0.64, 0.64, 0.07, 20]} />
        <meshStandardMaterial color="#D6B875" metalness={0.85} roughness={0.22} />
      </mesh>
      <group ref={ref} position={[0, 1.65, 0]}>
        {variant === 'heart' ? (
          <>
            <mesh castShadow>
              <octahedronGeometry args={[0.48, 1]} />
              <meshPhysicalMaterial
                color="#D9A9C5"
                emissive="#7771A8"
                emissiveIntensity={0.35}
                roughness={0.08}
                clearcoat={1}
              />
            </mesh>
            <mesh rotation={[Math.PI / 3, 0, 0]}>
              <torusGeometry args={[0.74, 0.022, 10, 36]} />
              <meshStandardMaterial color="#D6B875" metalness={0.9} roughness={0.16} />
            </mesh>
          </>
        ) : (
          <>
            <mesh>
              <sphereGeometry args={[0.45, 22, 22]} />
              <meshPhysicalMaterial color="#7771A8" transparent opacity={0.42} roughness={0.06} clearcoat={1} />
            </mesh>
            <mesh>
              <icosahedronGeometry args={[0.25, 1]} />
              <meshStandardMaterial color="#D9A9C5" emissive="#D6B875" emissiveIntensity={1.2} wireframe />
            </mesh>
          </>
        )}
      </group>
    </group>
  );
}

/**
 * کنترلر اول‌شخص حرفه‌ای موزه با کپسول برخوردسنجی، Pointer Lock، کشیدن ماوس و کنترل لمسی
 */
function FirstPersonMuseumController({
  collisionWorld,
  activeSlot,
  teleportRequest,
  settings,
  joystickRef,
  suppressClickUntilRef,
  onPointerLockChange,
  onCanvasElement,
}: {
  collisionWorld: MuseumCollisionWorld;
  activeSlot: PhotoSlot | null;
  teleportRequest: TeleportRequest;
  settings: MovementSettings;
  joystickRef: React.MutableRefObject<{ x: number; y: number }>;
  suppressClickUntilRef: React.MutableRefObject<number>;
  onPointerLockChange: (locked: boolean) => void;
  onCanvasElement: (el: HTMLCanvasElement | null) => void;
}) {
  const { camera, gl } = useThree();

  const physicsRef = useRef({
    x: MUSEUM_START_POS.x,
    z: MUSEUM_START_POS.z,
    yaw: MUSEUM_START_POS.yaw,
    pitch: MUSEUM_START_POS.pitch,
  });

  const renderRef = useRef({
    x: MUSEUM_START_POS.x,
    z: MUSEUM_START_POS.z,
    yaw: MUSEUM_START_POS.yaw,
    pitch: MUSEUM_START_POS.pitch,
  });

  const savedBeforeInspectRef = useRef({
    x: MUSEUM_START_POS.x,
    z: MUSEUM_START_POS.z,
    yaw: MUSEUM_START_POS.yaw,
    pitch: MUSEUM_START_POS.pitch,
  });

  const isReturningRef = useRef(false);
  const prevSlotRef = useRef<PhotoSlot | null>(null);
  const keysRef = useRef<Record<string, boolean>>({});
  const settingsRef = useRef(settings);
  const activeSlotRef = useRef(activeSlot);
  settingsRef.current = settings;
  activeSlotRef.current = activeSlot;

  // Register canvas element with parent so UI buttons can requestPointerLock
  useEffect(() => {
    const dom = gl.domElement;
    onCanvasElement(dom);
    return () => {
      onCanvasElement(null);
      if (document.pointerLockElement === dom) {
        try {
          document.exitPointerLock?.();
        } catch {
          // Ignore exit errors
        }
      }
      document.body.style.cursor = 'default';
    };
  }, [gl, onCanvasElement]);

  // Initial camera orientation
  useEffect(() => {
    camera.rotation.order = 'YXZ';
    camera.position.set(MUSEUM_START_POS.x, PLAYER_EYE_HEIGHT, MUSEUM_START_POS.z);
    camera.rotation.set(MUSEUM_START_POS.pitch, MUSEUM_START_POS.yaw, 0);
  }, [camera]);

  // Handle Hall Jumps & Reset Camera teleports safely via collision resolution
  useEffect(() => {
    if (teleportRequest.seq === 0) return;
    const baseTarget =
      teleportRequest.target === 'hall2' ? MUSEUM_HALL2_POS : MUSEUM_START_POS;
    const safe = resolveCapsulePosition2D(baseTarget.x, baseTarget.z, collisionWorld);
    physicsRef.current = {
      x: safe.x,
      z: safe.z,
      yaw: baseTarget.yaw,
      pitch: baseTarget.pitch,
    };
    renderRef.current = { ...physicsRef.current };
    isReturningRef.current = false;
  }, [teleportRequest, collisionWorld]);

  // Handle opening / closing artwork lightbox cleanly
  useEffect(() => {
    if (activeSlot && !prevSlotRef.current) {
      savedBeforeInspectRef.current = { ...physicsRef.current };
      isReturningRef.current = false;
      keysRef.current = {};
      if (document.pointerLockElement) {
        try {
          document.exitPointerLock?.();
        } catch {
          // Ignore
        }
      }
      document.body.style.cursor = 'default';
    } else if (!activeSlot && prevSlotRef.current) {
      const safeRestore = resolveCapsulePosition2D(
        savedBeforeInspectRef.current.x,
        savedBeforeInspectRef.current.z,
        collisionWorld
      );
      physicsRef.current = {
        ...savedBeforeInspectRef.current,
        x: safeRestore.x,
        z: safeRestore.z,
      };
      isReturningRef.current = true;
    }
    prevSlotRef.current = activeSlot;
  }, [activeSlot, collisionWorld]);

  // Keyboard listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (activeSlotRef.current) return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
      keysRef.current[e.code] = true;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    const onBlur = () => {
      keysRef.current = {};
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
    };
  }, []);

  // Pointer Lock + Fallback Mouse Drag + Right-Side Touch Look
  useEffect(() => {
    const dom = gl.domElement;
    let dragPointerId: number | null = null;
    let lastX = 0;
    let lastY = 0;
    let dragTravel = 0;

    const applyLookDelta = (dx: number, dy: number, scale: number) => {
      const sens = settingsRef.current.lookSensitivity * scale;
      physicsRef.current.yaw -= dx * sens;
      physicsRef.current.pitch = THREE.MathUtils.clamp(
        physicsRef.current.pitch - dy * sens * 0.9,
        -1.22,
        1.22
      );
      isReturningRef.current = false;
    };

    const onLockChange = () => {
      onPointerLockChange(document.pointerLockElement === dom);
    };
    const onLockError = () => {
      onPointerLockChange(false);
    };

    const onMouseMove = (e: MouseEvent) => {
      if (document.pointerLockElement !== dom || activeSlotRef.current) return;
      applyLookDelta(e.movementX, e.movementY, 0.0022);
    };

    const onPointerDown = (e: PointerEvent) => {
      if (activeSlotRef.current || document.pointerLockElement === dom) return;
      if (e.pointerType === 'touch') {
        if (!settingsRef.current.touchControls) return;
        // Right side of viewport reserved for touch look so bottom-left joystick stays isolated
        if (e.clientX < window.innerWidth * 0.34) return;
      }
      dragPointerId = e.pointerId;
      lastX = e.clientX;
      lastY = e.clientY;
      dragTravel = 0;
    };

    const onPointerMove = (e: PointerEvent) => {
      if (dragPointerId !== e.pointerId || activeSlotRef.current) return;
      const dx = e.clientX - lastX;
      const dy = e.clientY - lastY;
      lastX = e.clientX;
      lastY = e.clientY;
      dragTravel += Math.hypot(dx, dy);
      if (dragTravel > 6) {
        suppressClickUntilRef.current = performance.now() + 200;
      }
      const scale = e.pointerType === 'touch' ? 0.0044 : 0.0034;
      applyLookDelta(dx, dy, scale);
    };

    const endDrag = (e: PointerEvent) => {
      if (dragPointerId === e.pointerId) {
        dragPointerId = null;
      }
    };

    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('pointerlockerror', onLockError);
    document.addEventListener('mousemove', onMouseMove);
    dom.addEventListener('pointerdown', onPointerDown);
    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', endDrag);
    window.addEventListener('pointercancel', endDrag);

    return () => {
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('pointerlockerror', onLockError);
      document.removeEventListener('mousemove', onMouseMove);
      dom.removeEventListener('pointerdown', onPointerDown);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
      window.removeEventListener('pointercancel', endDrag);
    };
  }, [gl, onPointerLockChange, suppressClickUntilRef]);

  useFrame((_, rawDelta) => {
    const dt = Math.min(rawDelta, 0.05);
    const curSettings = settingsRef.current;

    if (activeSlot) {
      // Glide safely inside walkable space in front of the selected artwork
      const [px, py, pz] = activeSlot.position;
      const [nx, , nz] = activeSlot.normal;
      const rawGoalX = px + nx * 2.45;
      const rawGoalZ = pz + nz * 2.45;
      const safeGoal = resolveCapsulePosition2D(rawGoalX, rawGoalZ, collisionWorld);
      const distToFrame = Math.max(0.8, Math.hypot(px - safeGoal.x, pz - safeGoal.z));
      const targetYaw = Math.atan2(nx, nz);
      const targetPitch = THREE.MathUtils.clamp(
        Math.atan2(py - PLAYER_EYE_HEIGHT, distToFrame),
        -0.75,
        0.75
      );

      renderRef.current.x = THREE.MathUtils.damp(renderRef.current.x, safeGoal.x, 7.5, dt);
      renderRef.current.z = THREE.MathUtils.damp(renderRef.current.z, safeGoal.z, 7.5, dt);
      renderRef.current.yaw +=
        wrapAngleDelta(renderRef.current.yaw, targetYaw) * (1 - Math.exp(-7.5 * dt));
      renderRef.current.pitch = THREE.MathUtils.damp(renderRef.current.pitch, targetPitch, 7.5, dt);
    } else {
      const k = keysRef.current;
      const joy = curSettings.touchControls ? joystickRef.current : { x: 0, y: 0 };

      // Keyboard yaw turning with Left/Right arrows
      const arrowTurn = (k.ArrowLeft ? 1 : 0) - (k.ArrowRight ? 1 : 0);
      if (arrowTurn !== 0) {
        physicsRef.current.yaw += arrowTurn * 1.7 * curSettings.lookSensitivity * dt;
        isReturningRef.current = false;
      }

      const keyForward = (k.KeyW || k.ArrowUp ? 1 : 0) - (k.KeyS || k.ArrowDown ? 1 : 0);
      const keyStrafe = (k.KeyD ? 1 : 0) - (k.KeyA ? 1 : 0);

      let localFwd = keyForward + joy.y;
      let localStrafe = keyStrafe + joy.x;
      const mag = Math.hypot(localFwd, localStrafe);
      if (mag > 1) {
        localFwd /= mag;
        localStrafe /= mag;
      }

      if (mag > 0.001) {
        isReturningRef.current = false;
        const sprintMul = k.ShiftLeft || k.ShiftRight ? 1.58 : 1;
        const speed = curSettings.walkSpeed * curSettings.moveSensitivity * sprintMul;
        const yaw = physicsRef.current.yaw;
        const fx = -Math.sin(yaw);
        const fz = -Math.cos(yaw);
        const rx = Math.cos(yaw);
        const rz = -Math.sin(yaw);

        const deltaX = (fx * localFwd + rx * localStrafe) * speed * dt;
        const deltaZ = (fz * localFwd + rz * localStrafe) * speed * dt;

        const moved = movePlayerWithCollision(
          physicsRef.current.x,
          physicsRef.current.z,
          deltaX,
          deltaZ,
          collisionWorld
        );
        physicsRef.current.x = moved.x;
        physicsRef.current.z = moved.z;
      } else {
        // Ensure standing point remains strictly collision-safe
        const safeStand = resolveCapsulePosition2D(
          physicsRef.current.x,
          physicsRef.current.z,
          collisionWorld
        );
        physicsRef.current.x = safeStand.x;
        physicsRef.current.z = safeStand.z;
      }

      const posDamp = isReturningRef.current ? 8 : 22;
      const rotDamp = isReturningRef.current ? 8 : 26;

      const dampedX = THREE.MathUtils.damp(renderRef.current.x, physicsRef.current.x, posDamp, dt);
      const dampedZ = THREE.MathUtils.damp(renderRef.current.z, physicsRef.current.z, posDamp, dt);
      // Hard invariant: clamp damped eye coordinate as well so corner smoothing never shaves walls
      const clampedRender = resolveCapsulePosition2D(dampedX, dampedZ, collisionWorld);
      renderRef.current.x = clampedRender.x;
      renderRef.current.z = clampedRender.z;

      renderRef.current.yaw +=
        wrapAngleDelta(renderRef.current.yaw, physicsRef.current.yaw) * (1 - Math.exp(-rotDamp * dt));
      renderRef.current.pitch = THREE.MathUtils.damp(
        renderRef.current.pitch,
        physicsRef.current.pitch,
        rotDamp,
        dt
      );

      if (
        isReturningRef.current &&
        Math.hypot(renderRef.current.x - physicsRef.current.x, renderRef.current.z - physicsRef.current.z) < 0.05
      ) {
        isReturningRef.current = false;
      }
    }

    camera.rotation.order = 'YXZ';
    camera.position.set(renderRef.current.x, PLAYER_EYE_HEIGHT, renderRef.current.z);
    camera.rotation.set(renderRef.current.pitch, renderRef.current.yaw, 0);
  });

  return null;
}

function MuseumSceneContent({
  slots,
  hall2DepthExtra,
  collisionWorld,
  activeSlot,
  teleportRequest,
  settings,
  joystickRef,
  suppressClickUntilRef,
  onSelectSlot,
  onPointerLockChange,
  onCanvasElement,
  mood,
}: {
  slots: PhotoSlot[];
  hall2DepthExtra: number;
  collisionWorld: MuseumCollisionWorld;
  activeSlot: PhotoSlot | null;
  teleportRequest: TeleportRequest;
  settings: MovementSettings;
  joystickRef: React.MutableRefObject<{ x: number; y: number }>;
  suppressClickUntilRef: React.MutableRefObject<number>;
  onSelectSlot: (slot: PhotoSlot | null) => void;
  onPointerLockChange: (locked: boolean) => void;
  onCanvasElement: (el: HTMLCanvasElement | null) => void;
  mood: GalleryMood;
}) {
  const floorTex = useMemo(() => createMarbleTileTexture('#242342', '#7771A8', 8), []);

  useEffect(() => {
    return () => {
      floorTex.dispose();
    };
  }, [floorTex]);

  const moodLight = mood === 'golden' ? '#ffdfa8' : mood === 'midnight' ? '#8c87cc' : '#F1DCCB';
  const endWallZ = -22 - hall2DepthExtra;
  // Exact alignment of floor & ceiling with front (Z=4.5 ± 0.175) and back (endWallZ ± 0.175) outer walls
  const frontOuterZ = 4.675;
  const backOuterZ = endWallZ - 0.175;
  const totalDepth = frontOuterZ - backOuterZ;
  const centerZ = (frontOuterZ + backOuterZ) / 2;

  const columnZs = [3.5, -1.0, -5.8, -11.4, -15.6, -20.0];
  for (let z = -24.6; z > endWallZ + 1; z -= 4.6) {
    columnZs.push(z);
  }

  return (
    <>
      <ambientLight intensity={mood === 'midnight' ? 0.3 : 0.48} color={moodLight} />
      <hemisphereLight args={[moodLight, '#17172F', 0.65]} />
      <directionalLight position={[4, 10, 6]} intensity={mood === 'golden' ? 1.25 : 0.95} color={moodLight} castShadow />

      <Sparkles count={65} scale={[13.6, 5.2, totalDepth]} position={[0, 2.6, centerZ]} size={2.2} speed={0.22} color="#D6B875" />

      {/* Grand Marble Floor seamlessly bounded to outer walls */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, centerZ]}
        receiveShadow
        onClick={() => {
          if (performance.now() < suppressClickUntilRef.current) return;
          onSelectSlot(null);
        }}
      >
        <planeGeometry args={[14.35, totalDepth]} />
        <meshStandardMaterial map={floorTex} roughness={0.28} metalness={0.12} />
      </mesh>

      {/* Ceiling & Gold Arch Beams */}
      <mesh position={[0, 5.4, centerZ]}>
        <boxGeometry args={[14.35, 0.25, totalDepth]} />
        <meshStandardMaterial color="#191833" roughness={0.85} />
      </mesh>
      {columnZs.map((z, idx) => (
        <mesh key={`beam-${idx}`} position={[0, 5.18, z]}>
          <boxGeometry args={[14, 0.24, 0.28]} />
          <meshStandardMaterial color="#D6B875" metalness={0.72} roughness={0.28} />
        </mesh>
      ))}

      {/* Left & Right Museum Walls */}
      <mesh position={[-7.0, 2.7, centerZ]} receiveShadow>
        <boxGeometry args={[0.35, 5.4, totalDepth]} />
        <meshStandardMaterial color="#242242" roughness={0.82} />
      </mesh>
      <mesh position={[7.0, 2.7, centerZ]} receiveShadow>
        <boxGeometry args={[0.35, 5.4, totalDepth]} />
        <meshStandardMaterial color="#242242" roughness={0.82} />
      </mesh>

      {/* Front & Back End Walls */}
      <mesh position={[0, 2.7, 4.5]} receiveShadow>
        <boxGeometry args={[14.35, 5.4, 0.35]} />
        <meshStandardMaterial color="#242242" roughness={0.82} />
      </mesh>
      <mesh position={[0, 2.7, endWallZ]} receiveShadow>
        <boxGeometry args={[14.35, 5.4, 0.35]} />
        <meshStandardMaterial color="#242242" roughness={0.82} />
      </mesh>

      {/* Dividing Archway between Hall 1 & Hall 2 (open 4m doorway in center) */}
      <group position={[0, 0, -7.45]}>
        <mesh position={[-4.5, 2.7, 0]} receiveShadow>
          <boxGeometry args={[5.0, 5.4, 0.36]} />
          <meshStandardMaterial color="#28264a" roughness={0.8} />
        </mesh>
        <mesh position={[4.5, 2.7, 0]} receiveShadow>
          <boxGeometry args={[5.0, 5.4, 0.36]} />
          <meshStandardMaterial color="#28264a" roughness={0.8} />
        </mesh>
        <mesh position={[0, 4.65, 0]}>
          <boxGeometry args={[4.2, 1.5, 0.38]} />
          <meshStandardMaterial color="#28264a" roughness={0.8} />
        </mesh>
        <mesh position={[0, 3.85, 0]}>
          <boxGeometry args={[4.2, 0.14, 0.44]} />
          <meshStandardMaterial color="#D6B875" metalness={0.8} roughness={0.25} />
        </mesh>
      </group>

      {/* Fluted Architectural Columns */}
      {columnZs.map((z, idx) => (
        <React.Fragment key={`cols-${idx}`}>
          {[-6.25, 6.25].map((x, sideIdx) => (
            <group key={sideIdx} position={[x, 0, z]}>
              <mesh position={[0, 2.55, 0]} castShadow>
                <cylinderGeometry args={[0.24, 0.28, 5.1, 14]} />
                <meshStandardMaterial color="#32305a" roughness={0.5} />
              </mesh>
              <mesh position={[0, 5.12, 0]}>
                <boxGeometry args={[0.68, 0.24, 0.68]} />
                <meshStandardMaterial color="#D6B875" metalness={0.75} roughness={0.28} />
              </mesh>
            </group>
          ))}
        </React.Fragment>
      ))}

      {/* Central Sculptural Centerpieces */}
      <CentralSculpture position={[0, 0, -1.6]} variant="heart" />
      <CentralSculpture position={[0, 0, -15.6]} variant="nebula" />

      {/* All Photo Frames */}
      {slots.map((slot) => (
        <PhotoFrame3D
          key={slot.index}
          slot={slot}
          active={activeSlot?.index === slot.index}
          onSelect={(s) => onSelectSlot(s)}
          suppressClickUntilRef={suppressClickUntilRef}
        />
      ))}

      <FirstPersonMuseumController
        collisionWorld={collisionWorld}
        activeSlot={activeSlot}
        teleportRequest={teleportRequest}
        settings={settings}
        joystickRef={joystickRef}
        suppressClickUntilRef={suppressClickUntilRef}
        onPointerLockChange={onPointerLockChange}
        onCanvasElement={onCanvasElement}
      />
    </>
  );
}

function VirtualJoystick({
  joystickRef,
  bottomClass,
}: {
  joystickRef: React.MutableRefObject<{ x: number; y: number }>;
  bottomClass: string;
}) {
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const activePointerId = useRef<number | null>(null);
  const centerRef = useRef({ x: 0, y: 0 });
  const maxRadius = 32;

  useEffect(() => {
    return () => {
      joystickRef.current = { x: 0, y: 0 };
    };
  }, [joystickRef]);

  const updateFromClient = (clientX: number, clientY: number) => {
    let dx = clientX - centerRef.current.x;
    let dy = clientY - centerRef.current.y;
    const dist = Math.hypot(dx, dy);
    if (dist > maxRadius) {
      dx = (dx / dist) * maxRadius;
      dy = (dy / dist) * maxRadius;
    }
    setKnobOffset({ x: dx, y: dy });

    const normX = dx / maxRadius;
    const normY = -dy / maxRadius; // Pushing upward = +Y forward
    const mag = Math.hypot(normX, normY);
    if (mag < 0.08) {
      joystickRef.current = { x: 0, y: 0 };
    } else {
      joystickRef.current = { x: normX, y: normY };
    }
  };

  const resetStick = () => {
    activePointerId.current = null;
    setKnobOffset({ x: 0, y: 0 });
    joystickRef.current = { x: 0, y: 0 };
  };

  return (
    <div
      className={`fixed left-4 ${bottomClass} z-20 w-24 h-24 rounded-full bg-[#17172F]/70 border border-[#D6B875]/45 backdrop-blur-sm flex items-center justify-center touch-none select-none shadow-xl transition-all`}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        activePointerId.current = e.pointerId;
        const rect = e.currentTarget.getBoundingClientRect();
        centerRef.current = {
          x: rect.left + rect.width / 2,
          y: rect.top + rect.height / 2,
        };
        updateFromClient(e.clientX, e.clientY);
      }}
      onPointerMove={(e) => {
        if (activePointerId.current !== e.pointerId) return;
        e.stopPropagation();
        updateFromClient(e.clientX, e.clientY);
      }}
      onPointerUp={(e) => {
        if (activePointerId.current !== e.pointerId) return;
        e.stopPropagation();
        resetStick();
      }}
      onPointerCancel={(e) => {
        if (activePointerId.current !== e.pointerId) return;
        e.stopPropagation();
        resetStick();
      }}
      aria-label="اهرم حرکت در موزه"
    >
      <div className="absolute inset-2.5 rounded-full border border-dashed border-[#7771A8]/45 pointer-events-none" />
      <div
        className="w-9 h-9 rounded-full bg-gradient-to-br from-[#F1DCCB] to-[#D6B875] border border-[#17172F]/60 shadow-md pointer-events-none"
        style={{
          transform: `translate(${knobOffset.x}px, ${knobOffset.y}px)`,
        }}
      />
    </div>
  );
}

export const MuseumWorld: React.FC = () => {
  const { slots, hall2DepthExtra } = useMemo(() => buildGalleryLayout(photoFiles), []);
  const collisionWorld = useMemo(() => buildMuseumCollisionWorld(hall2DepthExtra), [hall2DepthExtra]);

  const [activeSlot, setActiveSlot] = useState<PhotoSlot | null>(null);
  const [hallTarget, setHallTarget] = useState<'hall1' | 'hall2'>('hall1');
  const [teleportRequest, setTeleportRequest] = useState<TeleportRequest>({ target: 'start', seq: 0 });
  const [mood, setMood] = useState<GalleryMood>('gallery');
  const [dockOpen, setDockOpen] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [pointerLocked, setPointerLocked] = useState(false);

  const [settings, setSettings] = useState<MovementSettings>(() => ({
    walkSpeed: 3.6,
    moveSensitivity: 1.0,
    lookSensitivity: 1.0,
    touchControls: detectTouchCapable(),
  }));

  const joystickRef = useRef({ x: 0, y: 0 });
  const suppressClickUntilRef = useRef(0);
  const canvasElementRef = useRef<HTMLCanvasElement | null>(null);

  const handleCanvasElement = useCallback((el: HTMLCanvasElement | null) => {
    canvasElementRef.current = el;
  }, []);

  const requestWalkLock = () => {
    const el = canvasElementRef.current;
    if (!el || activeSlot) return;
    if (document.pointerLockElement === el) {
      try {
        document.exitPointerLock?.();
      } catch {
        // Ignore
      }
      return;
    }
    try {
      const maybePromise = el.requestPointerLock?.() as unknown as Promise<void> | undefined;
      if (maybePromise && typeof maybePromise.catch === 'function') {
        maybePromise.catch(() => {
          // Fallback mouse-drag look remains active automatically
        });
      }
    } catch {
      // Fallback mouse-drag look remains active automatically
    }
  };

  const triggerTeleport = (target: 'start' | 'hall1' | 'hall2') => {
    setActiveSlot(null);
    if (target === 'hall1' || target === 'start') setHallTarget('hall1');
    else setHallTarget('hall2');
    setTeleportRequest((prev) => ({ target, seq: prev.seq + 1 }));
  };

  const goPrevPhoto = useCallback(() => {
    if (!activeSlot || slots.length === 0) return;
    const prevIdx = (activeSlot.index - 1 + slots.length) % slots.length;
    setActiveSlot(slots[prevIdx]);
  }, [activeSlot, slots]);

  const goNextPhoto = useCallback(() => {
    if (!activeSlot || slots.length === 0) return;
    const nextIdx = (activeSlot.index + 1) % slots.length;
    setActiveSlot(slots[nextIdx]);
  }, [activeSlot, slots]);

  // Keyboard navigation in lightbox
  useEffect(() => {
    if (!activeSlot) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveSlot(null);
      else if (e.key === 'ArrowRight') goPrevPhoto();
      else if (e.key === 'ArrowLeft') goNextPhoto();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeSlot, goPrevPhoto, goNextPhoto]);

  return (
    <div className="relative w-full h-full select-none">
      <SceneCanvas
        cameraPosition={[MUSEUM_START_POS.x, PLAYER_EYE_HEIGHT, MUSEUM_START_POS.z]}
        fov={52}
        bgColor={mood === 'midnight' ? '#101024' : '#17172F'}
      >
        <MuseumSceneContent
          slots={slots}
          hall2DepthExtra={hall2DepthExtra}
          collisionWorld={collisionWorld}
          activeSlot={activeSlot}
          teleportRequest={teleportRequest}
          settings={settings}
          joystickRef={joystickRef}
          suppressClickUntilRef={suppressClickUntilRef}
          onSelectSlot={setActiveSlot}
          onPointerLockChange={setPointerLocked}
          onCanvasElement={handleCanvasElement}
          mood={mood}
        />
      </SceneCanvas>

      {/* Subtle centered dot only while mouse-look pointer lock is active */}
      {pointerLocked && !activeSlot && (
        <div className="fixed inset-0 z-10 pointer-events-none flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-[#D6B875]/85 ring-2 ring-[#17172F]/70" />
        </div>
      )}

      {/* Top-Left Compact Movement Toolbar & Settings Popover */}
      {!activeSlot && (
        <div className="fixed top-16 left-3 sm:left-5 z-20 flex flex-col items-end gap-2 pointer-events-none">
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={requestWalkLock}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-colors cursor-pointer ${
                pointerLocked
                  ? 'bg-[#D6B875] text-[#17172F] border-[#D6B875] font-bold'
                  : 'bg-[#17172F]/90 text-[#F1DCCB] border-[#7771A8]/45 hover:border-[#D6B875]'
              }`}
            >
              <Crosshair className="w-3.5 h-3.5" />
              <span>{pointerLocked ? 'خروج از قفل ماوس' : 'چرخش آزاد ماوس'}</span>
            </button>

            <button
              type="button"
              onClick={() => setSettingsOpen((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-colors cursor-pointer ${
                settingsOpen
                  ? 'bg-[#7771A8] text-[#F1DCCB] border-[#D6B875]'
                  : 'bg-[#17172F]/90 text-[#F1DCCB] border-[#7771A8]/45 hover:border-[#D6B875]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#D6B875]" />
              <span>تنظیمات حرکت</span>
            </button>
          </div>

          {settingsOpen && (
            <div className="pointer-events-auto w-72 rounded-2xl bg-[#17172F]/95 border border-[#D6B875]/40 p-3.5 shadow-2xl space-y-3 text-right">
              <div className="flex items-center justify-between border-b border-[#7771A8]/25 pb-2">
                <span className="text-xs font-bold text-[#F1DCCB]">تنظیمات حرکت و دوربین</span>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  aria-label="بستن تنظیمات حرکت"
                  className="p-1 rounded-lg bg-[#232347] text-[#F1DCCB] hover:bg-[#313160] cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-[#F1DCCB] mb-1">
                  <span>سرعت قدم‌زدن</span>
                  <span className="text-[#D6B875] tabular-nums">{toPersianDigits(settings.walkSpeed.toFixed(1))}</span>
                </div>
                <input
                  type="range"
                  min={2.2}
                  max={6.0}
                  step={0.2}
                  value={settings.walkSpeed}
                  onChange={(e) => setSettings((s) => ({ ...s, walkSpeed: parseFloat(e.target.value) }))}
                  className="w-full accent-[#D6B875]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-[#F1DCCB] mb-1">
                  <span>حساسیت حرکت</span>
                  <span className="text-[#D6B875] tabular-nums">{toPersianDigits(settings.moveSensitivity.toFixed(1))}</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={1.8}
                  step={0.1}
                  value={settings.moveSensitivity}
                  onChange={(e) => setSettings((s) => ({ ...s, moveSensitivity: parseFloat(e.target.value) }))}
                  className="w-full accent-[#D6B875]"
                />
              </div>

              <div>
                <div className="flex items-center justify-between text-[11px] text-[#F1DCCB] mb-1">
                  <span>حساسیت چرخش دوربین</span>
                  <span className="text-[#D6B875] tabular-nums">{toPersianDigits(settings.lookSensitivity.toFixed(1))}</span>
                </div>
                <input
                  type="range"
                  min={0.5}
                  max={2.0}
                  step={0.1}
                  value={settings.lookSensitivity}
                  onChange={(e) => setSettings((s) => ({ ...s, lookSensitivity: parseFloat(e.target.value) }))}
                  className="w-full accent-[#D6B875]"
                />
              </div>

              <label className="flex items-center justify-between p-2 rounded-xl bg-[#222245] text-[11px] text-[#F1DCCB] cursor-pointer">
                <span>اهرم و چرخش لمسی موبایل</span>
                <input
                  type="checkbox"
                  checked={settings.touchControls}
                  onChange={(e) => setSettings((s) => ({ ...s, touchControls: e.target.checked }))}
                  className="w-4 h-4 accent-[#D6B875]"
                />
              </label>

              <div className="grid grid-cols-2 gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => triggerTeleport('start')}
                  className="py-1.5 px-2 rounded-xl bg-[#232347] border border-[#7771A8]/40 text-[11px] text-[#F1DCCB] hover:border-[#D6B875] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3 text-[#D6B875]" />
                  <span>نقطه شروع</span>
                </button>
                <button
                  type="button"
                  onClick={requestWalkLock}
                  className="py-1.5 px-2 rounded-xl bg-[#232347] border border-[#7771A8]/40 text-[11px] text-[#D9A9C5] hover:border-[#D6B875] flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Crosshair className="w-3 h-3" />
                  <span>{pointerLocked ? 'آزادسازی ماوس' : 'قفل ماوس'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Mobile Touch Virtual Joystick (bottom-left; auto-hidden when photo modal is open) */}
      {settings.touchControls && !activeSlot && (
        <VirtualJoystick
          joystickRef={joystickRef}
          bottomClass={dockOpen ? 'bottom-36 sm:bottom-24' : 'bottom-12'}
        />
      )}

      {/* Pure Image Lightbox Modal — ZERO text metadata / titles / captions / filenames */}
      {activeSlot && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-[#0d0d1d]/92 p-4 sm:p-8"
          onClick={() => setActiveSlot(null)}
        >
          <button
            type="button"
            onClick={() => setActiveSlot(null)}
            aria-label="بستن"
            className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 w-11 h-11 rounded-2xl bg-[#17172F]/90 border border-[#D6B875]/45 text-[#F1DCCB] hover:border-[#D6B875] flex items-center justify-center shadow-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {slots.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goPrevPhoto();
              }}
              aria-label="قبلی"
              className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-2xl bg-[#17172F]/90 border border-[#7771A8]/50 text-[#F1DCCB] hover:border-[#D6B875] flex items-center justify-center shadow-lg cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          <div
            className="relative max-w-[90vw] max-h-[84vh] rounded-2xl p-2 sm:p-3 bg-gradient-to-br from-[#D6B875]/35 via-[#242345] to-[#D9A9C5]/30 border border-[#D6B875]/55 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={activeSlot.src}
              alt=""
              className="block max-w-[85vw] max-h-[78vh] object-contain rounded-xl select-none"
            />
          </div>

          {slots.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                goNextPhoto();
              }}
              aria-label="بعدی"
              className="fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-2xl bg-[#17172F]/90 border border-[#7771A8]/50 text-[#F1DCCB] hover:border-[#D6B875] flex items-center justify-center shadow-lg cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
        </div>
      )}

      {/* Collapsible Bottom Control Dock (Halls & Lighting Only, Zero Photo Metadata) */}
      <div className="fixed bottom-3 inset-x-0 z-20 flex flex-col items-center px-3 pointer-events-none">
        <button
          type="button"
          onClick={() => setDockOpen((v) => !v)}
          className="pointer-events-auto mb-1.5 px-3.5 py-1 rounded-t-xl bg-[#17172F]/90 border border-b-0 border-[#7771A8]/40 text-[11px] text-[#F1DCCB] cursor-pointer"
        >
          {dockOpen ? 'جمع کردن راهنمای موزه' : 'نمایش تالارها و نورپردازی'}
        </button>

        {dockOpen && (
          <div className="pointer-events-auto w-full max-w-2xl rounded-2xl bg-[#17172F]/92 border border-[#7771A8]/40 p-3 shadow-2xl space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-[#D6B875] flex items-center gap-1 ml-1">
                  <Compass className="w-3.5 h-3.5" />
                  تالارها:
                </span>
                <button
                  type="button"
                  onClick={() => triggerTeleport('hall1')}
                  className={`px-3 py-1.5 rounded-xl text-xs cursor-pointer ${
                    hallTarget === 'hall1'
                      ? 'bg-[#7771A8] text-[#F1DCCB] font-semibold'
                      : 'bg-[#222245] text-[#D9A9C5]'
                  }`}
                >
                  تالار طلایی
                </button>
                <button
                  type="button"
                  onClick={() => triggerTeleport('hall2')}
                  className={`px-3 py-1.5 rounded-xl text-xs cursor-pointer ${
                    hallTarget === 'hall2'
                      ? 'bg-[#7771A8] text-[#F1DCCB] font-semibold'
                      : 'bg-[#222245] text-[#D9A9C5]'
                  }`}
                >
                  رواق مهتاب
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-[#D6B875]" />
                {(
                  [
                    ['gallery', 'کلاسیک'],
                    ['golden', 'طلایی'],
                    ['midnight', 'مهتابی'],
                  ] as [GalleryMood, string][]
                ).map(([m, label]) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMood(m)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs whitespace-nowrap cursor-pointer ${
                      mood === m ? 'bg-[#D6B875] text-[#17172F] font-bold' : 'bg-[#222245] text-[#F1DCCB]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="text-[11px] text-[#A6BBAA] text-center border-t border-[#7771A8]/25 pt-1.5">
              با کلیدهای صفحه‌کلید یا اهرم لمسی قدم بزن، با کشیدن صفحه اطراف را ببین و برای بزرگ‌نمایی روی قاب‌ها کلیک کن.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

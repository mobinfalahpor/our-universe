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
import { audioEngine } from '../../systems/audioEngine';
import { toPersianDigits } from '../../core/persianUtils';
import { useUniverseStore } from '../../core/store';
import { getGraphicsProfile } from '../../core/graphicsProfile';
import {
  buildMuseumCollisionWorld,
  getHall4Bounds,
  getHallAtPosition,
  movePlayerWithCollision,
  MUSEUM_HALL_SPAWNS,
  MUSEUM_START_POS,
  PLAYER_EYE_HEIGHT,
  resolveCapsulePosition2D,
  type MuseumCollisionWorld,
  type MuseumHallId,
} from './museumPhysics';
import {
  createBeauxArtsMarbleTextures,
  createBoiserieWallTexture,
  createCeilingFrescoTexture,
  createContactShadowTexture,
  createDamaskWallTexture,
  createHerringboneParquetTextures,
  createPalaceClockTexture,
} from './museumTextures';
import {
  AmbientVisitorNPC,
  AntiqueMuseumBench,
  ArchedBeauxArtsWindow,
  BrassWallSconce,
  ClassicalAmphoraUrn,
  ClassicalSculptureFull,
  CorinthianColumn,
  CrystalChandelier,
  DecorativeConsoleTable,
  MarbleBustExhibit,
  MonumentalOakDoors,
  OrnatePhotoFrame3D,
  type FrameStyle,
  type PhotoSlot,
} from './museumModels';
import { museumAcoustics } from './museumAcoustics';

type GalleryMood = 'daylight' | 'golden' | 'evening';

interface MovementSettings {
  walkSpeed: number;
  moveSensitivity: number;
  lookSensitivity: number;
  touchControls: boolean;
}

interface TeleportRequest {
  target: MuseumHallId;
  seq: number;
}

const HALL_TABS: { id: MuseumHallId; label: string }[] = [
  { id: 'hall1', label: 'تالار بزرگ' },
  { id: 'hall2', label: 'تالار نقاشی' },
  { id: 'hall3', label: 'تالار مجسمه' },
  { id: 'hall4', label: 'گالری نورگیر' },
  { id: 'hall5', label: 'تالار منتخب' },
];

function getPhotoUrl(filename: string): string {
  const base = import.meta.env.BASE_URL || './';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  return `${cleanBase}museum/photos/${encodeURIComponent(filename)}`;
}

function buildGalleryLayout(files: string[]): { slots: PhotoSlot[]; hall2DepthExtra: number } {
  const styles: FrameStyle[] = ['ornate_salon', 'classic_gold', 'walnut_gilt', 'empire_ebony'];
  const extraBays = files.length > 18 ? Math.ceil((files.length - 18) / 2) : 0;
  const hall2DepthExtra = extraBays * 4.8;
  const { hall4SouthZ } = getHall4Bounds(hall2DepthExtra);

  // Curated Salon & Beaux-Arts slots blending grand hero frames and intimate salon groupings
  const presets: Omit<PhotoSlot, 'index' | 'src'>[] = [
    // 0–3: Anchor hero works across Hall 2 (Salon Carré), Hall 4 (Skylight), & Hall 5 (Intimate Cabinet)
    { hall: 'hall2', position: [-8.48, 2.85, -13.6], rotationY: Math.PI / 2, normal: [1, 0, 0], style: 'ornate_salon', baseSize: 2.55 },
    { hall: 'hall2', position: [8.48, 2.85, -13.6], rotationY: -Math.PI / 2, normal: [-1, 0, 0], style: 'classic_gold', baseSize: 2.55 },
    { hall: 'hall4', position: [-8.48, 2.75, hall4SouthZ - 6.8], rotationY: Math.PI / 2, normal: [1, 0, 0], style: 'walnut_gilt', baseSize: 2.45 },
    { hall: 'hall5', position: [-18.48, 2.6, -2.0], rotationY: Math.PI / 2, normal: [1, 0, 0], style: 'ornate_salon', baseSize: 2.5 },

    // 4–7: Salon Carré secondary & staggered smaller frames
    { hall: 'hall2', position: [-8.48, 2.85, -19.6], rotationY: Math.PI / 2, normal: [1, 0, 0], style: 'classic_gold', baseSize: 2.3 },
    { hall: 'hall2', position: [8.48, 2.85, -19.6], rotationY: -Math.PI / 2, normal: [-1, 0, 0], style: 'ornate_salon', baseSize: 2.3 },
    { hall: 'hall4', position: [8.48, 2.75, hall4SouthZ - 6.8], rotationY: -Math.PI / 2, normal: [-1, 0, 0], style: 'classic_gold', baseSize: 2.45 },
    { hall: 'hall1', position: [-5.4, 2.85, -8.23], rotationY: 0, normal: [0, 0, 1], style: 'ornate_salon', baseSize: 2.2 },

    // 8–11: Intimate Cabinet flanking works + Grande Galerie East pier
    { hall: 'hall1', position: [5.4, 2.85, -8.23], rotationY: 0, normal: [0, 0, 1], style: 'classic_gold', baseSize: 2.2 },
    { hall: 'hall5', position: [-15.8, 2.5, -6.48], rotationY: 0, normal: [0, 0, 1], style: 'walnut_gilt', baseSize: 1.65 },
    { hall: 'hall5', position: [-11.2, 2.5, -6.48], rotationY: 0, normal: [0, 0, 1], style: 'classic_gold', baseSize: 1.65 },
    { hall: 'hall5', position: [-18.48, 2.5, 0.7], rotationY: Math.PI / 2, normal: [1, 0, 0], style: 'empire_ebony', baseSize: 1.55 },

    // 12–17: Salon Carré tiered upper/lower smaller cabinet frames & Orsay wing additions
    { hall: 'hall5', position: [-18.48, 2.5, -4.7], rotationY: Math.PI / 2, normal: [1, 0, 0], style: 'empire_ebony', baseSize: 1.55 },
    { hall: 'hall2', position: [-8.48, 2.25, -11.4], rotationY: Math.PI / 2, normal: [1, 0, 0], style: 'walnut_gilt', baseSize: 1.45 },
    { hall: 'hall2', position: [8.48, 2.25, -11.4], rotationY: -Math.PI / 2, normal: [-1, 0, 0], style: 'walnut_gilt', baseSize: 1.45 },
    { hall: 'hall2', position: [-8.48, 2.25, -21.6], rotationY: Math.PI / 2, normal: [1, 0, 0], style: 'empire_ebony', baseSize: 1.45 },
    { hall: 'hall2', position: [8.48, 2.25, -21.6], rotationY: -Math.PI / 2, normal: [-1, 0, 0], style: 'empire_ebony', baseSize: 1.45 },
    { hall: 'hall4', position: [-5.4, 2.65, hall4SouthZ + 0.25], rotationY: Math.PI, normal: [0, 0, -1], style: 'classic_gold', baseSize: 1.95 },
  ];

  const slots: PhotoSlot[] = [];
  const fixedCount = Math.min(files.length, presets.length);
  for (let i = 0; i < fixedCount; i++) {
    slots.push({
      ...presets[i],
      index: i,
      src: getPhotoUrl(files[i]),
    });
  }

  // Dynamic Salon Carré extension bays if user uploads > 18 photos
  let cursor = fixedCount;
  let bayZ = -25.6;
  while (cursor < files.length) {
    slots.push({
      index: cursor,
      src: getPhotoUrl(files[cursor]),
      hall: 'hall2',
      position: [-8.48, 2.75, bayZ],
      rotationY: Math.PI / 2,
      normal: [1, 0, 0],
      style: styles[cursor % styles.length],
      baseSize: 2.3,
    });
    cursor++;
    if (cursor < files.length) {
      slots.push({
        index: cursor,
        src: getPhotoUrl(files[cursor]),
        hall: 'hall2',
        position: [8.48, 2.75, bayZ],
        rotationY: -Math.PI / 2,
        normal: [-1, 0, 0],
        style: styles[cursor % styles.length],
        baseSize: 2.3,
      });
      cursor++;
    }
    bayZ -= 4.8;
  }

  return { slots, hall2DepthExtra };
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

/**
 * کنترلر اول‌شخص موزه با برخوردسنجی دقیق ۵ تالار، حرکت آرام دوربین هنگام قدم زدن و صدای قدم متناسب با جنس کف
 */
function FirstPersonMuseumController({
  collisionWorld,
  hall2DepthExtra,
  activeSlot,
  teleportRequest,
  settings,
  reducedMotion,
  joystickRef,
  suppressClickUntilRef,
  onPointerLockChange,
  onHallChange,
  onCanvasElement,
}: {
  collisionWorld: MuseumCollisionWorld;
  hall2DepthExtra: number;
  activeSlot: PhotoSlot | null;
  teleportRequest: TeleportRequest;
  settings: MovementSettings;
  reducedMotion: boolean;
  joystickRef: React.MutableRefObject<{ x: number; y: number }>;
  suppressClickUntilRef: React.MutableRefObject<number>;
  onPointerLockChange: (locked: boolean) => void;
  onHallChange: (hall: MuseumHallId) => void;
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
  const currentHallRef = useRef<MuseumHallId>('hall1');
  const strideDistRef = useRef(0);
  const bobPhaseRef = useRef(0);
  const bobOffsetRef = useRef(0);

  settingsRef.current = settings;
  activeSlotRef.current = activeSlot;

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

  useEffect(() => {
    camera.rotation.order = 'YXZ';
    camera.position.set(MUSEUM_START_POS.x, PLAYER_EYE_HEIGHT, MUSEUM_START_POS.z);
    camera.rotation.set(MUSEUM_START_POS.pitch, MUSEUM_START_POS.yaw, 0);
  }, [camera]);

  // Hall teleports / resets validated via collision world
  useEffect(() => {
    if (teleportRequest.seq === 0) return;
    const spawn = MUSEUM_HALL_SPAWNS[teleportRequest.target] || MUSEUM_START_POS;
    const safe = resolveCapsulePosition2D(spawn.x, spawn.z, collisionWorld);
    physicsRef.current = {
      x: safe.x,
      z: safe.z,
      yaw: spawn.yaw,
      pitch: spawn.pitch,
    };
    renderRef.current = { ...physicsRef.current };
    isReturningRef.current = false;
    bobOffsetRef.current = 0;
  }, [teleportRequest, collisionWorld]);

  // Photo inspection glide & safe restore
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
    } else if (activeSlot && prevSlotRef.current && activeSlot.index !== prevSlotRef.current.index) {
      // Switching directly between paintings in Lightbox: snap renderRef immediately so camera never passes through walls
      const [px, py, pz] = activeSlot.position;
      const [nx, , nz] = activeSlot.normal;
      const safeGoal = resolveCapsulePosition2D(px + nx * 2.55, pz + nz * 2.55, collisionWorld);
      const dist = Math.max(0.8, Math.hypot(px - safeGoal.x, pz - safeGoal.z));
      renderRef.current = {
        x: safeGoal.x,
        z: safeGoal.z,
        yaw: Math.atan2(nx, nz),
        pitch: THREE.MathUtils.clamp(Math.atan2(py - PLAYER_EYE_HEIGHT, dist), -0.75, 0.75),
      };
    } else if (!activeSlot && prevSlotRef.current) {
      const safeRestore = resolveCapsulePosition2D(
        savedBeforeInspectRef.current.x,
        savedBeforeInspectRef.current.z,
        collisionWorld
      );
      const jumpDist = Math.hypot(
        renderRef.current.x - safeRestore.x,
        renderRef.current.z - safeRestore.z
      );
      physicsRef.current = {
        ...savedBeforeInspectRef.current,
        x: safeRestore.x,
        z: safeRestore.z,
      };
      if (jumpDist > 12) {
        // Snap cleanly if returning from another distant wing visited via Next/Prev
        renderRef.current = { ...physicsRef.current };
        isReturningRef.current = false;
      } else {
        isReturningRef.current = true;
      }
    }
    prevSlotRef.current = activeSlot;
  }, [activeSlot, collisionWorld]);

  // Keyboard inputs
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

  // Pointer Lock + Mouse Drag + Right-Side Touch Drag
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
        -1.2,
        1.2
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
      const [px, py, pz] = activeSlot.position;
      const [nx, , nz] = activeSlot.normal;
      const safeGoal = resolveCapsulePosition2D(px + nx * 2.55, pz + nz * 2.55, collisionWorld);
      const distToFrame = Math.max(0.8, Math.hypot(px - safeGoal.x, pz - safeGoal.z));
      const targetYaw = Math.atan2(nx, nz);
      const targetPitch = THREE.MathUtils.clamp(
        Math.atan2(py - PLAYER_EYE_HEIGHT, distToFrame),
        -0.75,
        0.75
      );

      // Only glide smoothly if within same visual corridor; snap if across distant wings
      if (Math.hypot(renderRef.current.x - safeGoal.x, renderRef.current.z - safeGoal.z) > 12) {
        renderRef.current.x = safeGoal.x;
        renderRef.current.z = safeGoal.z;
        renderRef.current.yaw = targetYaw;
        renderRef.current.pitch = targetPitch;
      } else {
        renderRef.current.x = THREE.MathUtils.damp(renderRef.current.x, safeGoal.x, 7.5, dt);
        renderRef.current.z = THREE.MathUtils.damp(renderRef.current.z, safeGoal.z, 7.5, dt);
        renderRef.current.yaw +=
          wrapAngleDelta(renderRef.current.yaw, targetYaw) * (1 - Math.exp(-7.5 * dt));
        renderRef.current.pitch = THREE.MathUtils.damp(renderRef.current.pitch, targetPitch, 7.5, dt);
      }
      bobOffsetRef.current = THREE.MathUtils.damp(bobOffsetRef.current, 0, 12, dt);
    } else {
      const k = keysRef.current;
      const joy = curSettings.touchControls ? joystickRef.current : { x: 0, y: 0 };

      const arrowTurn = (k.ArrowLeft ? 1 : 0) - (k.ArrowRight ? 1 : 0);
      if (arrowTurn !== 0) {
        physicsRef.current.yaw += arrowTurn * 1.75 * curSettings.lookSensitivity * dt;
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

      let movedStep = 0;

      if (mag > 0.001) {
        isReturningRef.current = false;
        const sprintMul = k.ShiftLeft || k.ShiftRight ? 1.56 : 1;
        const speed = curSettings.walkSpeed * curSettings.moveSensitivity * sprintMul;
        const yaw = physicsRef.current.yaw;
        const fx = -Math.sin(yaw);
        const fz = -Math.cos(yaw);
        const rx = Math.cos(yaw);
        const rz = -Math.sin(yaw);

        const deltaX = (fx * localFwd + rx * localStrafe) * speed * dt;
        const deltaZ = (fz * localFwd + rz * localStrafe) * speed * dt;

        const prevX = physicsRef.current.x;
        const prevZ = physicsRef.current.z;
        const moved = movePlayerWithCollision(prevX, prevZ, deltaX, deltaZ, collisionWorld);
        physicsRef.current.x = moved.x;
        physicsRef.current.z = moved.z;
        movedStep = Math.hypot(moved.x - prevX, moved.z - prevZ);
      } else {
        const safeStand = resolveCapsulePosition2D(
          physicsRef.current.x,
          physicsRef.current.z,
          collisionWorld
        );
        physicsRef.current.x = safeStand.x;
        physicsRef.current.z = safeStand.z;
      }

      // Track current hall + stride-based footsteps & gentle walking head bob
      const hallNow = getHallAtPosition(
        physicsRef.current.x,
        physicsRef.current.z,
        hall2DepthExtra
      );
      if (hallNow !== currentHallRef.current) {
        currentHallRef.current = hallNow;
        onHallChange(hallNow);
      }

      if (movedStep > 0.002) {
        strideDistRef.current += movedStep;
        bobPhaseRef.current += movedStep * 3.1;
        if (!reducedMotion) {
          bobOffsetRef.current = THREE.MathUtils.damp(
            bobOffsetRef.current,
            Math.sin(bobPhaseRef.current) * 0.017,
            16,
            dt
          );
        } else {
          bobOffsetRef.current = 0;
        }
        if (strideDistRef.current >= 0.88) {
          strideDistRef.current = 0;
          const floorKind = hallNow === 'hall3' || hallNow === 'hall4' ? 'marble' : 'parquet';
          museumAcoustics.playFootstep(floorKind);
        }
      } else {
        bobOffsetRef.current = THREE.MathUtils.damp(bobOffsetRef.current, 0, 10, dt);
      }

      const posDamp = isReturningRef.current ? 8 : 22;
      const rotDamp = isReturningRef.current ? 8 : 26;

      const dampedX = THREE.MathUtils.damp(renderRef.current.x, physicsRef.current.x, posDamp, dt);
      const dampedZ = THREE.MathUtils.damp(renderRef.current.z, physicsRef.current.z, posDamp, dt);
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
    camera.position.set(
      renderRef.current.x,
      PLAYER_EYE_HEIGHT + bobOffsetRef.current,
      renderRef.current.z
    );
    camera.rotation.set(renderRef.current.pitch, renderRef.current.yaw, 0);
  });

  return null;
}

/**
 * صحنه سه‌بعدی موزه خیال با ۵ تالار مجزای بوزآر پاریسی، نور طبیعی، لوستر کریستالی و مجسمه‌ها
 */
function MuseumSceneContent({
  slots,
  hall2DepthExtra,
  collisionWorld,
  activeSlot,
  teleportRequest,
  settings,
  reducedMotion,
  particleScale,
  joystickRef,
  suppressClickUntilRef,
  onSelectSlot,
  onPointerLockChange,
  onHallChange,
  onCanvasElement,
  mood,
}: {
  slots: PhotoSlot[];
  hall2DepthExtra: number;
  collisionWorld: MuseumCollisionWorld;
  activeSlot: PhotoSlot | null;
  teleportRequest: TeleportRequest;
  settings: MovementSettings;
  reducedMotion: boolean;
  particleScale: number;
  joystickRef: React.MutableRefObject<{ x: number; y: number }>;
  suppressClickUntilRef: React.MutableRefObject<number>;
  onSelectSlot: (slot: PhotoSlot | null) => void;
  onPointerLockChange: (locked: boolean) => void;
  onHallChange: (hall: MuseumHallId) => void;
  onCanvasElement: (el: HTMLCanvasElement | null) => void;
  mood: GalleryMood;
}) {
  const { gl } = useThree();
  const maxAniso = useMemo(() => Math.min(8, gl.capabilities.getMaxAnisotropy()), [gl]);

  // Rich procedural PBR textures
  const textures = useMemo(() => {
    const parquetH1 = createHerringboneParquetTextures(6, 5.5, maxAniso);
    const parquetH2 = createHerringboneParquetTextures(6, 7 + Math.round(hall2DepthExtra / 3), maxAniso);
    const parquetH5 = createHerringboneParquetTextures(4, 3.6, maxAniso);
    const marbleH3 = createBeauxArtsMarbleTextures(5, 4.5, maxAniso);
    const marbleH4 = createBeauxArtsMarbleTextures(6, 5, maxAniso);
    const boiserie = createBoiserieWallTexture('#ede3d0', '#e3d5bd', '#c8a355', 4, 1, maxAniso);
    const claretDamask = createDamaskWallTexture('#5d2028', '#46141b', '#dfd1b9', 5, 1, maxAniso);
    const emeraldDamask = createDamaskWallTexture('#1e443d', '#15312c', '#dfd1b9', 4, 1, maxAniso);
    const fresco = createCeilingFrescoTexture(maxAniso);
    const clockTex = createPalaceClockTexture(maxAniso);
    const contactTex = createContactShadowTexture();

    return {
      parquetH1,
      parquetH2,
      parquetH5,
      marbleH3,
      marbleH4,
      boiserie,
      claretDamask,
      emeraldDamask,
      fresco,
      clockTex,
      contactTex,
    };
  }, [maxAniso, hall2DepthExtra]);

  useEffect(() => {
    return () => {
      textures.parquetH1.map.dispose();
      textures.parquetH1.roughnessMap.dispose();
      textures.parquetH2.map.dispose();
      textures.parquetH2.roughnessMap.dispose();
      textures.parquetH5.map.dispose();
      textures.parquetH5.roughnessMap.dispose();
      textures.marbleH3.map.dispose();
      textures.marbleH3.roughnessMap.dispose();
      textures.marbleH4.map.dispose();
      textures.marbleH4.roughnessMap.dispose();
      textures.boiserie.map.dispose();
      textures.boiserie.bumpMap.dispose();
      textures.claretDamask.dispose();
      textures.emeraldDamask.dispose();
      textures.fresco.dispose();
      textures.clockTex.dispose();
      textures.contactTex.dispose();
    };
  }, [textures]);

  const { hall2NorthZ, hall4SouthZ, hall4NorthZ } = useMemo(
    () => getHall4Bounds(hall2DepthExtra),
    [hall2DepthExtra]
  );

  const hall2Length = Math.abs(hall2NorthZ - -8.5);
  const hall2CenterZ = (-8.5 + hall2NorthZ) / 2;
  const hall4CenterZ = (hall4SouthZ + hall4NorthZ) / 2;

  // Dynamic gentle illumination shimmer across chandeliers & daylight mood
  const keyLightRef = useRef<THREE.DirectionalLight>(null);
  const moodConfig =
    mood === 'golden'
      ? {
          ambient: 0.44,
          sunColor: '#ffe0a8',
          sunIntensity: 1.35,
          skyColor: '#fff1d1',
          windowGlow: '#ffdfb0',
          chandelierIntensity: 3.1,
          chandelierColor: '#ffda9b',
        }
      : mood === 'evening'
        ? {
            ambient: 0.28,
            sunColor: '#a3b3dc',
            sunIntensity: 0.72,
            skyColor: '#7a8ab8',
            windowGlow: '#43537e',
            chandelierIntensity: 3.4,
            chandelierColor: '#ffd996',
          }
        : {
            ambient: 0.5,
            sunColor: '#fff6e8',
            sunIntensity: 1.18,
            skyColor: '#f3f7ff',
            windowGlow: '#eef4ff',
            chandelierIntensity: 2.35,
            chandelierColor: '#ffe6bd',
          };

  useFrame(({ clock }) => {
    if (keyLightRef.current && !reducedMotion) {
      const t = clock.getElapsedTime();
      keyLightRef.current.intensity = moodConfig.sunIntensity + Math.sin(t * 0.45) * 0.04;
    }
  });

  const hall2ColumnZs = useMemo(() => {
    const zs = [-10.6, -16.6, -22.6];
    for (let z = -27.4; z > hall2NorthZ + 1.2; z -= 4.8) {
      zs.push(z);
    }
    return zs;
  }, [hall2NorthZ]);

  const dustCount = Math.max(24, Math.round(70 * particleScale));

  return (
    <>
      {/* 3-Point Beaux-Arts Lighting Rig (Max 6 Lights Total for High Mobile/Desktop FPS) */}
      <ambientLight intensity={moodConfig.ambient} color={moodConfig.sunColor} />
      <hemisphereLight args={[moodConfig.skyColor, '#3b2b20', 0.68]} />
      <directionalLight
        ref={keyLightRef}
        position={[14, 18, 6]}
        intensity={moodConfig.sunIntensity}
        color={moodConfig.sunColor}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0004}
        shadow-normalBias={0.02}
        shadow-camera-left={-22}
        shadow-camera-right={22}
        shadow-camera-top={22}
        shadow-camera-bottom={-32}
        shadow-camera-far={55}
      />
      <directionalLight position={[-12, 10, -18]} intensity={0.42} color="#e5dcff" />

      {/* Subtle Floating Dust Motes in Shafts of Parisian Light */}
      <Sparkles
        count={dustCount}
        scale={[15, 5.5, 13]}
        position={[0, 3.6, -1.0]}
        size={1.6}
        speed={reducedMotion ? 0 : 0.14}
        opacity={0.42}
        color="#ffe6b5"
      />
      <Sparkles
        count={Math.max(18, Math.round(50 * particleScale))}
        scale={[12, 6, 10]}
        position={[15.5, 4.2, -1.5]}
        size={1.7}
        speed={reducedMotion ? 0 : 0.16}
        opacity={0.46}
        color="#fff2d2"
      />
      <Sparkles
        count={Math.max(18, Math.round(50 * particleScale))}
        scale={[14, 6, 12]}
        position={[0, 4.4, hall4CenterZ]}
        size={1.6}
        speed={reducedMotion ? 0 : 0.15}
        opacity={0.44}
        color="#fff4db"
      />

      {/* ================================================================= */}
      {/* 1. HALL 1: GRANDE GALERIE ENTRANCE (X ∈ [-8.5, 8.5], Z ∈ [-8.5, 6.5]) */}
      {/* ================================================================= */}
      <group>
        {/* Herringbone Oak Parquet Floor */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, -1.0]}
          receiveShadow
          onClick={() => {
            if (performance.now() < suppressClickUntilRef.current) return;
            onSelectSlot(null);
          }}
        >
          <planeGeometry args={[17.2, 15.2]} />
          <meshStandardMaterial
            map={textures.parquetH1.map}
            roughnessMap={textures.parquetH1.roughnessMap}
            roughness={0.52}
            metalness={0.05}
          />
        </mesh>

        {/* Painted Coffered Ceiling & Gold Ribs */}
        <mesh position={[0, 8.4, -1.0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[17.2, 15.2]} />
          <meshStandardMaterial map={textures.fresco} roughness={0.62} />
        </mesh>
        {[-6.5, -1.0, 4.5].map((z, i) => (
          <mesh key={`h1-beam-${i}`} position={[0, 8.15, z]}>
            <boxGeometry args={[17.0, 0.42, 0.48]} />
            <meshStandardMaterial color="#dfd1b8" roughness={0.55} />
          </mesh>
        ))}

        {/* South Entrance Wall (Z = 6.7) + Monumental Double Oak Doors */}
        <mesh position={[0, 4.2, 6.7]} receiveShadow>
          <boxGeometry args={[17.4, 8.4, 0.4]} />
          <meshStandardMaterial
            map={textures.boiserie.map}
            bumpMap={textures.boiserie.bumpMap}
            bumpScale={0.04}
            roughness={0.68}
          />
        </mesh>
        <MonumentalOakDoors position={[0, 0, 6.5]} rotationY={Math.PI} />

        {/* Arched Beaux-Arts Windows flanking entrance */}
        <ArchedBeauxArtsWindow position={[-5.3, 1.45, 6.46]} rotationY={Math.PI} width={2.3} height={4.4} skyColor={moodConfig.windowGlow} />
        <ArchedBeauxArtsWindow position={[5.3, 1.45, 6.46]} rotationY={Math.PI} width={2.3} height={4.4} skyColor={moodConfig.windowGlow} />

        {/* West Wall (Z ∈ [-8.5, 6.5] with Archway Z ∈ [-3.5, 0.5] to Hall 5) */}
        <mesh position={[-8.7, 4.2, -6.0]} receiveShadow>
          <boxGeometry args={[0.4, 8.4, 5.0]} />
          <meshStandardMaterial map={textures.boiserie.map} bumpMap={textures.boiserie.bumpMap} bumpScale={0.04} roughness={0.68} />
        </mesh>
        <mesh position={[-8.7, 4.2, 3.5]} receiveShadow>
          <boxGeometry args={[0.4, 8.4, 6.0]} />
          <meshStandardMaterial map={textures.boiserie.map} bumpMap={textures.boiserie.bumpMap} bumpScale={0.04} roughness={0.68} />
        </mesh>
        <mesh position={[-8.7, 6.4, -1.5]}>
          <boxGeometry args={[0.42, 4.0, 4.1]} />
          <meshStandardMaterial color="#e5d8c1" roughness={0.6} />
        </mesh>
        <mesh position={[-8.48, 4.42, -1.5]}>
          <boxGeometry args={[0.22, 0.24, 4.2]} />
          <meshStandardMaterial color="#cfa857" metalness={0.82} roughness={0.25} />
        </mesh>

        {/* East Wall (Z ∈ [-8.5, 6.5] with Archway Z ∈ [-3.8, 0.8] to Hall 3) */}
        <mesh position={[8.7, 4.2, -6.15]} receiveShadow>
          <boxGeometry args={[0.4, 8.4, 4.7]} />
          <meshStandardMaterial map={textures.boiserie.map} bumpMap={textures.boiserie.bumpMap} bumpScale={0.04} roughness={0.68} />
        </mesh>
        <mesh position={[8.7, 4.2, 3.65]} receiveShadow>
          <boxGeometry args={[0.4, 8.4, 5.7]} />
          <meshStandardMaterial map={textures.boiserie.map} bumpMap={textures.boiserie.bumpMap} bumpScale={0.04} roughness={0.68} />
        </mesh>
        <mesh position={[8.7, 6.5, -1.5]}>
          <boxGeometry args={[0.42, 3.8, 4.7]} />
          <meshStandardMaterial color="#e5d8c1" roughness={0.6} />
        </mesh>
        <mesh position={[8.48, 4.62, -1.5]}>
          <boxGeometry args={[0.22, 0.24, 4.8]} />
          <meshStandardMaterial color="#cfa857" metalness={0.82} roughness={0.25} />
        </mesh>

        {/* North Dividing Archway Wall to Hall 2 (Z = -8.5, open X ∈ [-2.4, +2.4]) */}
        <mesh position={[-5.45, 4.2, -8.5]} receiveShadow>
          <boxGeometry args={[6.1, 8.4, 0.5]} />
          <meshStandardMaterial map={textures.boiserie.map} bumpMap={textures.boiserie.bumpMap} bumpScale={0.04} roughness={0.68} />
        </mesh>
        <mesh position={[5.45, 4.2, -8.5]} receiveShadow>
          <boxGeometry args={[6.1, 8.4, 0.5]} />
          <meshStandardMaterial map={textures.boiserie.map} bumpMap={textures.boiserie.bumpMap} bumpScale={0.04} roughness={0.68} />
        </mesh>
        <mesh position={[0, 6.65, -8.5]}>
          <boxGeometry args={[4.9, 3.5, 0.52]} />
          <meshStandardMaterial color="#e6dac4" roughness={0.6} />
        </mesh>
        <mesh position={[0, 4.92, -8.5]}>
          <boxGeometry args={[5.1, 0.24, 0.62]} />
          <meshStandardMaterial color="#cfa857" metalness={0.84} roughness={0.24} />
        </mesh>

        {/* Hall 1 Corinthian Columns */}
        {[-7.2, -4.4, 1.4, 4.2].map((z, i) => (
          <React.Fragment key={`h1-col-${i}`}>
            <CorinthianColumn position={[-7.55, 0, z]} height={7.9} />
            <CorinthianColumn position={[7.55, 0, z]} height={7.9} />
          </React.Fragment>
        ))}

        {/* Brass Wall Sconces, Benches, Classical Urns & Central Crystal Chandelier */}
        <BrassWallSconce position={[-8.48, 3.2, -6.0]} rotationY={Math.PI / 2} />
        <BrassWallSconce position={[8.48, 3.2, -6.0]} rotationY={-Math.PI / 2} />
        <BrassWallSconce position={[-8.48, 3.2, 3.2]} rotationY={Math.PI / 2} />
        <BrassWallSconce position={[8.48, 3.2, 3.2]} rotationY={-Math.PI / 2} />

        <AntiqueMuseumBench position={[-3.95, 0, -1.0]} rotationY={Math.PI / 2} length={2.3} velvetColor="#6c1e2a" contactTex={textures.contactTex} />
        <AntiqueMuseumBench position={[3.95, 0, -1.0]} rotationY={Math.PI / 2} length={2.3} velvetColor="#6c1e2a" contactTex={textures.contactTex} />
        <ClassicalAmphoraUrn position={[-4.4, 0, 4.6]} contactTex={textures.contactTex} bodyColor="#27425d" />
        <ClassicalAmphoraUrn position={[4.4, 0, 4.6]} contactTex={textures.contactTex} bodyColor="#27425d" />

        <CrystalChandelier
          position={[0, 6.85, -1.0]}
          scale={1.35}
          lightIntensity={moodConfig.chandelierIntensity}
          lightColor={moodConfig.chandelierColor}
          withRealLight
        />
      </group>

      {/* ================================================================= */}
      {/* 2. HALL 2: SALON CARRÉ PAINTING GALLERY (Z ∈ [hall2NorthZ, -8.5]) */}
      {/* ================================================================= */}
      <group>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, hall2CenterZ]}
          receiveShadow
          onClick={() => {
            if (performance.now() < suppressClickUntilRef.current) return;
            onSelectSlot(null);
          }}
        >
          <planeGeometry args={[17.2, hall2Length + 0.2]} />
          <meshStandardMaterial
            map={textures.parquetH2.map}
            roughnessMap={textures.parquetH2.roughnessMap}
            roughness={0.5}
            metalness={0.05}
          />
        </mesh>

        {/* Painted Fresco & Coffered Ceiling */}
        <mesh position={[0, 8.2, hall2CenterZ]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[17.2, hall2Length + 0.2]} />
          <meshStandardMaterial map={textures.fresco} roughness={0.62} />
        </mesh>

        {/* Burgundy Damask West & East Gallery Walls */}
        <mesh position={[-8.7, 4.1, hall2CenterZ]} receiveShadow>
          <boxGeometry args={[0.4, 8.2, hall2Length + 0.4]} />
          <meshStandardMaterial map={textures.claretDamask} roughness={0.78} />
        </mesh>
        <mesh position={[8.7, 4.1, hall2CenterZ]} receiveShadow>
          <boxGeometry args={[0.4, 8.2, hall2Length + 0.4]} />
          <meshStandardMaterial map={textures.claretDamask} roughness={0.78} />
        </mesh>

        {/* North Dividing Archway Wall to Hall 4 (Z = hall2NorthZ, open X ∈ [-2.4, +2.4]) */}
        <mesh position={[-5.45, 4.1, hall2NorthZ]} receiveShadow>
          <boxGeometry args={[6.1, 8.2, 0.5]} />
          <meshStandardMaterial map={textures.boiserie.map} bumpMap={textures.boiserie.bumpMap} bumpScale={0.04} roughness={0.68} />
        </mesh>
        <mesh position={[5.45, 4.1, hall2NorthZ]} receiveShadow>
          <boxGeometry args={[6.1, 8.2, 0.5]} />
          <meshStandardMaterial map={textures.boiserie.map} bumpMap={textures.boiserie.bumpMap} bumpScale={0.04} roughness={0.68} />
        </mesh>
        <mesh position={[0, 6.55, hall2NorthZ]}>
          <boxGeometry args={[4.9, 3.3, 0.52]} />
          <meshStandardMaterial color="#e6dac4" roughness={0.6} />
        </mesh>
        <mesh position={[0, 4.92, hall2NorthZ]}>
          <boxGeometry args={[5.1, 0.24, 0.62]} />
          <meshStandardMaterial color="#cfa857" metalness={0.84} roughness={0.24} />
        </mesh>

        {/* Corinthian Columns & Gilt Ceiling Beams */}
        {hall2ColumnZs.map((z, i) => (
          <React.Fragment key={`h2-col-${i}`}>
            <CorinthianColumn position={[-7.55, 0, z]} height={7.7} />
            <CorinthianColumn position={[7.55, 0, z]} height={7.7} />
            <mesh position={[0, 7.98, z]}>
              <boxGeometry args={[17.0, 0.36, 0.42]} />
              <meshStandardMaterial color="#dfd1b8" roughness={0.55} />
            </mesh>
          </React.Fragment>
        ))}

        {/* Salon Carré Furniture, Busts, Sconces & Twin Chandeliers */}
        <AntiqueMuseumBench position={[0, 0, -16.5]} rotationY={Math.PI / 2} length={2.5} velvetColor="#6a1e29" contactTex={textures.contactTex} />
        <DecorativeConsoleTable position={[-5.4, 0, -9.3]} contactTex={textures.contactTex} />
        <DecorativeConsoleTable position={[5.4, 0, -9.3]} contactTex={textures.contactTex} />
        <MarbleBustExhibit position={[-7.2, 0, -16.6]} rotationY={Math.PI / 2} contactTex={textures.contactTex} />
        <MarbleBustExhibit position={[7.2, 0, -16.6]} rotationY={-Math.PI / 2} contactTex={textures.contactTex} />

        <BrassWallSconce position={[-8.48, 3.3, -10.8]} rotationY={Math.PI / 2} />
        <BrassWallSconce position={[8.48, 3.3, -10.8]} rotationY={-Math.PI / 2} />
        <BrassWallSconce position={[-8.48, 3.3, -22.2]} rotationY={Math.PI / 2} />
        <BrassWallSconce position={[8.48, 3.3, -22.2]} rotationY={-Math.PI / 2} />

        <CrystalChandelier
          position={[0, 6.7, -13.2]}
          scale={1.22}
          lightIntensity={moodConfig.chandelierIntensity * 0.95}
          lightColor={moodConfig.chandelierColor}
          withRealLight
        />
        <CrystalChandelier
          position={[0, 6.7, -20.5]}
          scale={1.18}
          withRealLight={false}
        />
      </group>

      {/* ================================================================= */}
      {/* 3. HALL 3: PETIT PALAIS SCULPTURE HALL (X ∈ [8.5, 22.5], Z ∈ [-7.5, 4.5]) */}
      {/* ================================================================= */}
      <group>
        {/* Checkered Carrara & Cream Marble Floor */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[15.5, 0, -1.5]}
          receiveShadow
          onClick={() => {
            if (performance.now() < suppressClickUntilRef.current) return;
            onSelectSlot(null);
          }}
        >
          <planeGeometry args={[14.2, 12.2]} />
          <meshStandardMaterial
            map={textures.marbleH3.map}
            roughnessMap={textures.marbleH3.roughnessMap}
            roughness={0.28}
            metalness={0.08}
          />
        </mesh>

        {/* High Coffered Ceiling with Central Cupola Oculus Skylight */}
        <mesh position={[15.5, 8.8, -1.5]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[14.2, 12.2]} />
          <meshStandardMaterial color="#e6dcc9" roughness={0.62} />
        </mesh>
        {/* Octagonal/Circular Oculus Skylight Ring */}
        <mesh position={[15.5, 8.74, -1.5]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[3.1, 0.22, 12, 32]} />
          <meshStandardMaterial color="#cfa857" metalness={0.82} roughness={0.24} />
        </mesh>
        <mesh position={[15.5, 8.76, -1.5]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[3.0, 28]} />
          <meshStandardMaterial
            color={moodConfig.windowGlow}
            emissive={moodConfig.windowGlow}
            emissiveIntensity={mood === 'evening' ? 0.45 : 1.05}
            roughness={0.18}
          />
        </mesh>

        {/* Outer East, North, South Limestone Boiserie Walls */}
        <mesh position={[22.7, 4.4, -1.5]} receiveShadow>
          <boxGeometry args={[0.4, 8.8, 12.4]} />
          <meshStandardMaterial map={textures.boiserie.map} bumpMap={textures.boiserie.bumpMap} bumpScale={0.04} roughness={0.65} />
        </mesh>
        <mesh position={[15.5, 4.4, -7.7]} receiveShadow>
          <boxGeometry args={[14.4, 8.8, 0.4]} />
          <meshStandardMaterial map={textures.boiserie.map} bumpMap={textures.boiserie.bumpMap} bumpScale={0.04} roughness={0.65} />
        </mesh>
        <mesh position={[15.5, 4.4, 4.7]} receiveShadow>
          <boxGeometry args={[14.4, 8.8, 0.4]} />
          <meshStandardMaterial map={textures.boiserie.map} bumpMap={textures.boiserie.bumpMap} bumpScale={0.04} roughness={0.65} />
        </mesh>

        {/* Tall Arched French Windows along East Outer Wall */}
        <ArchedBeauxArtsWindow position={[22.46, 1.45, -4.2]} rotationY={-Math.PI / 2} width={2.4} height={4.8} skyColor={moodConfig.windowGlow} />
        <ArchedBeauxArtsWindow position={[22.46, 1.45, 1.2]} rotationY={-Math.PI / 2} width={2.4} height={4.8} skyColor={moodConfig.windowGlow} />

        {/* 4 Monumental Corinthian Columns */}
        {[10.1, 20.9].map((cx) =>
          [-6.0, 3.0].map((cz) => (
            <CorinthianColumn key={`h3-col-${cx}-${cz}`} position={[cx, 0, cz]} height={8.2} />
          ))
        )}

        {/* Central Winged Classical Marble Statue + 4 Marble Busts + Benches */}
        <ClassicalSculptureFull position={[15.5, 0, -1.5]} contactTex={textures.contactTex} />
        <MarbleBustExhibit position={[11.8, 0, -5.2]} rotationY={Math.PI * 0.25} contactTex={textures.contactTex} />
        <MarbleBustExhibit position={[19.2, 0, -5.2]} rotationY={-Math.PI * 0.25} contactTex={textures.contactTex} />
        <MarbleBustExhibit position={[11.8, 0, 2.2]} rotationY={Math.PI * 0.75} contactTex={textures.contactTex} />
        <MarbleBustExhibit position={[19.2, 0, 2.2]} rotationY={-Math.PI * 0.75} contactTex={textures.contactTex} />

        <AntiqueMuseumBench position={[15.5, 0, -5.5]} length={2.2} velvetColor="#293d54" contactTex={textures.contactTex} />
        <AntiqueMuseumBench position={[15.5, 0, 2.5]} length={2.2} velvetColor="#293d54" contactTex={textures.contactTex} />

        <pointLight position={[15.5, 7.2, -1.5]} color={moodConfig.skyColor} intensity={mood === 'evening' ? 1.8 : 2.9} distance={19} decay={1.3} />
      </group>

      {/* ================================================================= */}
      {/* 4. HALL 4: MUSÉE D'ORSAY SKYLIGHT GALLERY (Z ∈ [hall4NorthZ, hall4SouthZ]) */}
      {/* ================================================================= */}
      <group>
        {/* Polished Cream & Carrara Marble Floor */}
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[0, 0, hall4CenterZ]}
          receiveShadow
          onClick={() => {
            if (performance.now() < suppressClickUntilRef.current) return;
            onSelectSlot(null);
          }}
        >
          <planeGeometry args={[17.2, 14.2]} />
          <meshStandardMaterial
            map={textures.marbleH4.map}
            roughnessMap={textures.marbleH4.roughnessMap}
            roughness={0.26}
            metalness={0.08}
          />
        </mesh>

        {/* West, East & North Limestone Walls */}
        <mesh position={[-8.7, 3.8, hall4CenterZ]} receiveShadow>
          <boxGeometry args={[0.4, 7.6, 14.4]} />
          <meshStandardMaterial map={textures.boiserie.map} bumpMap={textures.boiserie.bumpMap} bumpScale={0.04} roughness={0.62} />
        </mesh>
        <mesh position={[8.7, 3.8, hall4CenterZ]} receiveShadow>
          <boxGeometry args={[0.4, 7.6, 14.4]} />
          <meshStandardMaterial map={textures.boiserie.map} bumpMap={textures.boiserie.bumpMap} bumpScale={0.04} roughness={0.62} />
        </mesh>
        <mesh position={[0, 4.4, hall4NorthZ - 0.2]} receiveShadow>
          <boxGeometry args={[17.4, 8.8, 0.4]} />
          <meshStandardMaterial map={textures.boiserie.map} bumpMap={textures.boiserie.bumpMap} bumpScale={0.04} roughness={0.62} />
        </mesh>

        {/* Musée d'Orsay Barrel-Vaulted Glass & Wrought-Iron Skylight Roof */}
        <mesh position={[0, 7.6, hall4CenterZ]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[8.4, 8.4, 14.2, 24, 1, true, -Math.PI / 2, Math.PI]} />
          <meshStandardMaterial
            color={moodConfig.windowGlow}
            emissive={moodConfig.windowGlow}
            emissiveIntensity={mood === 'evening' ? 0.38 : 0.92}
            roughness={0.2}
            side={THREE.BackSide}
          />
        </mesh>
        {/* Wrought-Iron & Gilt Ribbed Skylight Trusses */}
        {[hall4SouthZ - 2.2, hall4SouthZ - 5.2, hall4SouthZ - 8.2, hall4SouthZ - 11.2].map((rz, idx) => (
          <mesh key={`orsay-rib-${idx}`} position={[0, 7.55, rz]}>
            <torusGeometry args={[8.2, 0.12, 8, 28, Math.PI]} />
            <meshStandardMaterial color="#36383e" metalness={0.72} roughness={0.34} />
          </mesh>
        ))}

        {/* Monumental Arched North Windows + Ornamental Beaux-Arts Gilded Clock (Zero Text) */}
        <ArchedBeauxArtsWindow position={[-5.0, 1.35, hall4NorthZ + 0.04]} width={2.3} height={4.4} skyColor={moodConfig.windowGlow} />
        <ArchedBeauxArtsWindow position={[5.0, 1.35, hall4NorthZ + 0.04]} width={2.3} height={4.4} skyColor={moodConfig.windowGlow} />
        <group position={[0, 5.2, hall4NorthZ + 0.08]}>
          <mesh>
            <cylinderGeometry args={[1.28, 1.28, 0.14, 28]} />
            <meshStandardMaterial color="#cfa857" metalness={0.88} roughness={0.22} />
          </mesh>
          <mesh position={[0, 0, 0.08]} rotation={[Math.PI / 2, 0, 0]}>
            <circleGeometry args={[1.15, 28]} />
            <meshStandardMaterial map={textures.clockTex} roughness={0.35} />
          </mesh>
        </group>

        {/* Columns, Urns, Central Bench & Daylight */}
        {[hall4SouthZ - 3.2, hall4SouthZ - 10.6].map((cz, i) => (
          <React.Fragment key={`h4-col-${i}`}>
            <CorinthianColumn position={[-7.55, 0, cz]} height={7.1} />
            <CorinthianColumn position={[7.55, 0, cz]} height={7.1} />
          </React.Fragment>
        ))}
        <ClassicalAmphoraUrn position={[-4.6, 0, hall4NorthZ + 1.35]} contactTex={textures.contactTex} bodyColor="#c6bfb2" />
        <ClassicalAmphoraUrn position={[4.6, 0, hall4NorthZ + 1.35]} contactTex={textures.contactTex} bodyColor="#c6bfb2" />
        <AntiqueMuseumBench position={[0, 0, hall4SouthZ - 7.0]} length={2.5} velvetColor="#293d54" contactTex={textures.contactTex} />

        <pointLight position={[0, 7.2, hall4CenterZ]} color={moodConfig.skyColor} intensity={mood === 'evening' ? 1.7 : 2.75} distance={20} decay={1.3} />
      </group>

      {/* ================================================================= */}
      {/* 5. HALL 5: INTIMATE SELECTED WORKS CABINET (X ∈ [-18.5, -8.5], Z ∈ [-6.5, 2.5]) */}
      {/* ================================================================= */}
      <group>
        <mesh
          rotation={[-Math.PI / 2, 0, 0]}
          position={[-13.5, 0, -2.0]}
          receiveShadow
          onClick={() => {
            if (performance.now() < suppressClickUntilRef.current) return;
            onSelectSlot(null);
          }}
        >
          <planeGeometry args={[10.2, 9.2]} />
          <meshStandardMaterial
            map={textures.parquetH5.map}
            roughnessMap={textures.parquetH5.roughnessMap}
            roughness={0.48}
            metalness={0.05}
          />
        </mesh>

        {/* Coffered Plaster Ceiling */}
        <mesh position={[-13.5, 6.4, -2.0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10.2, 9.2]} />
          <meshStandardMaterial map={textures.fresco} roughness={0.62} />
        </mesh>

        {/* Deep Parisian Emerald Damask Walls */}
        <mesh position={[-18.7, 3.2, -2.0]} receiveShadow>
          <boxGeometry args={[0.4, 6.4, 9.4]} />
          <meshStandardMaterial map={textures.emeraldDamask} roughness={0.78} />
        </mesh>
        <mesh position={[-13.5, 3.2, -6.7]} receiveShadow>
          <boxGeometry args={[10.4, 6.4, 0.4]} />
          <meshStandardMaterial map={textures.emeraldDamask} roughness={0.78} />
        </mesh>
        <mesh position={[-13.5, 3.2, 2.7]} receiveShadow>
          <boxGeometry args={[10.4, 6.4, 0.4]} />
          <meshStandardMaterial map={textures.emeraldDamask} roughness={0.78} />
        </mesh>

        <ArchedBeauxArtsWindow position={[-13.5, 1.2, 2.46]} rotationY={Math.PI} width={2.2} height={4.0} skyColor={moodConfig.windowGlow} />

        <DecorativeConsoleTable position={[-13.5, 0, -5.9]} contactTex={textures.contactTex} />
        <AntiqueMuseumBench position={[-13.4, 0, -2.0]} rotationY={Math.PI / 2} length={2.1} velvetColor="#1d443c" contactTex={textures.contactTex} />
        <ClassicalAmphoraUrn position={[-17.3, 0, -5.3]} contactTex={textures.contactTex} bodyColor="#1e443d" />
        <ClassicalAmphoraUrn position={[-17.3, 0, 1.3]} contactTex={textures.contactTex} bodyColor="#1e443d" />

        <BrassWallSconce position={[-18.48, 3.0, -4.6]} rotationY={Math.PI / 2} />
        <BrassWallSconce position={[-18.48, 3.0, 0.6]} rotationY={Math.PI / 2} />

        <CrystalChandelier
          position={[-13.5, 5.1, -2.0]}
          scale={0.95}
          lightIntensity={moodConfig.chandelierIntensity * 0.85}
          lightColor={moodConfig.chandelierColor}
          withRealLight
        />
      </group>

      {/* ================================================================= */}
      {/* USER ARTWORKS (Sculpted 3D Museum Frames, Uncropped & Zero Text)  */}
      {/* ================================================================= */}
      {slots.map((slot) => (
        <OrnatePhotoFrame3D
          key={slot.index}
          slot={slot}
          active={activeSlot?.index === slot.index}
          onSelect={(s) => onSelectSlot(s)}
          suppressClickUntilRef={suppressClickUntilRef}
        />
      ))}

      {/* ================================================================= */}
      {/* CALM DISTANT MUSEUM VISITORS (Quiet Parisian Atmosphere)          */}
      {/* ================================================================= */}
      {!reducedMotion && (
        <>
          <AmbientVisitorNPC
            coatColor="#333847"
            speed={0.55}
            phaseOffset={0}
            waypoints={[
              [-1.8, 0, -11.5],
              [1.8, 0, -11.5],
              [2.2, 0, -20.5],
              [-2.2, 0, -20.5],
            ]}
          />
          <AmbientVisitorNPC
            coatColor="#574740"
            speed={0.48}
            phaseOffset={6.5}
            waypoints={[
              [12.4, 0, -3.2],
              [18.6, 0, -3.2],
              [18.6, 0, 0.4],
              [12.4, 0, 0.4],
            ]}
          />
          <AmbientVisitorNPC
            coatColor="#3f343c"
            speed={0.5}
            phaseOffset={3.2}
            waypoints={[
              [-3.0, 0, hall4SouthZ - 4.0],
              [3.0, 0, hall4SouthZ - 4.0],
              [3.0, 0, hall4NorthZ + 3.2],
              [-3.0, 0, hall4NorthZ + 3.2],
            ]}
          />
        </>
      )}

      <FirstPersonMuseumController
        collisionWorld={collisionWorld}
        hall2DepthExtra={hall2DepthExtra}
        activeSlot={activeSlot}
        teleportRequest={teleportRequest}
        settings={settings}
        reducedMotion={reducedMotion}
        joystickRef={joystickRef}
        suppressClickUntilRef={suppressClickUntilRef}
        onPointerLockChange={onPointerLockChange}
        onHallChange={onHallChange}
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
    const normY = -dy / maxRadius;
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
      className={`fixed left-4 ${bottomClass} z-20 w-24 h-24 rounded-full bg-[#17172F]/82 border border-[#D6B875]/55 flex items-center justify-center touch-none select-none shadow-xl transition-all`}
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
      <div className="absolute inset-2.5 rounded-full border border-dashed border-[#D6B875]/35 pointer-events-none" />
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

  const quality = useUniverseStore((s) => s.environment.quality);
  const reducedMotion = useUniverseStore((s) => s.environment.reducedMotion);
  const audioMuted = useUniverseStore((s) => s.audio.muted);
  const audioVolume = useUniverseStore((s) => s.audio.volume);

  const profile = useMemo(
    () => getGraphicsProfile(quality, reducedMotion),
    [quality, reducedMotion]
  );

  const [activeSlot, setActiveSlot] = useState<PhotoSlot | null>(null);
  const [currentHall, setCurrentHall] = useState<MuseumHallId>('hall1');
  const [teleportRequest, setTeleportRequest] = useState<TeleportRequest>({ target: 'hall1', seq: 0 });
  const [mood, setMood] = useState<GalleryMood>('daylight');
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

  // Start & cleanup quiet Parisian museum hall acoustic tone
  useEffect(() => {
    const startAudio = () => {
      museumAcoustics.startAmbientHallTone();
    };
    startAudio();
    window.addEventListener('pointerdown', startAudio, { once: true });
    window.addEventListener('keydown', startAudio, { once: true });
    return () => {
      window.removeEventListener('pointerdown', startAudio);
      window.removeEventListener('keydown', startAudio);
      museumAcoustics.stopAmbientHallTone();
    };
  }, []);

  useEffect(() => {
    museumAcoustics.syncGlobalVolume();
  }, [audioMuted, audioVolume]);

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
          // Drag look remains active cleanly
        });
      }
    } catch {
      // Drag look remains active cleanly
    }
  };

  const triggerTeleport = (target: MuseumHallId) => {
    setActiveSlot(null);
    setCurrentHall(target);
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

  const activeHallLabel = MUSEUM_HALL_SPAWNS[currentHall]?.label ?? 'تالار بزرگ فرانسوی';

  const bgColor =
    mood === 'evening' ? '#161a2b' : mood === 'golden' ? '#362b22' : '#303442';

  return (
    <div className="relative w-full h-full select-none">
      <SceneCanvas
        cameraPosition={[MUSEUM_START_POS.x, PLAYER_EYE_HEIGHT, MUSEUM_START_POS.z]}
        fov={52}
        bgColor={bgColor}
        fogNear={22}
        fogFar={78}
      >
        <MuseumSceneContent
          slots={slots}
          hall2DepthExtra={hall2DepthExtra}
          collisionWorld={collisionWorld}
          activeSlot={activeSlot}
          teleportRequest={teleportRequest}
          settings={settings}
          reducedMotion={profile.systemReducedMotion}
          particleScale={profile.particleScale}
          joystickRef={joystickRef}
          suppressClickUntilRef={suppressClickUntilRef}
          onSelectSlot={setActiveSlot}
          onPointerLockChange={setPointerLocked}
          onHallChange={setCurrentHall}
          onCanvasElement={handleCanvasElement}
          mood={mood}
        />
      </SceneCanvas>

      {/* Subtle centered dot only while pointer lock is active */}
      {pointerLocked && !activeSlot && (
        <div className="fixed inset-0 z-10 pointer-events-none flex items-center justify-center">
          <div className="w-2 h-2 rounded-full bg-[#D6B875]/90 ring-2 ring-[#17172F]/75" />
        </div>
      )}

      {/* Top-Left Compact Toolbar + Active Hall Indicator */}
      {!activeSlot && (
        <div className="fixed top-16 left-3 sm:left-5 z-20 flex flex-col items-end gap-2 pointer-events-none">
          <div className="flex flex-wrap items-center justify-end gap-1.5 pointer-events-auto">
            <div className="px-3 py-1.5 rounded-xl bg-[#17172F]/92 border border-[#D6B875]/35 text-[#F1DCCB] text-xs font-medium">
              {activeHallLabel}
            </div>

            <button
              type="button"
              onClick={requestWalkLock}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-colors cursor-pointer ${
                pointerLocked
                  ? 'bg-[#D6B875] text-[#17172F] border-[#D6B875] font-bold'
                  : 'bg-[#17172F]/92 text-[#F1DCCB] border-[#7771A8]/45 hover:border-[#D6B875]'
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
                  : 'bg-[#17172F]/92 text-[#F1DCCB] border-[#7771A8]/45 hover:border-[#D6B875]'
              }`}
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-[#D6B875]" />
              <span>تنظیمات حرکت</span>
            </button>
          </div>

          {settingsOpen && (
            <div className="pointer-events-auto w-72 rounded-2xl bg-[#17172F]/96 border border-[#D6B875]/45 p-3.5 shadow-2xl space-y-3 text-right">
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
                  onClick={() => triggerTeleport('hall1')}
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

      {/* Mobile Touch Virtual Joystick */}
      {settings.touchControls && !activeSlot && (
        <VirtualJoystick
          joystickRef={joystickRef}
          bottomClass={dockOpen ? 'bottom-40 sm:bottom-28' : 'bottom-12'}
        />
      )}

      {/* Pure Image Lightbox Modal — ZERO text metadata / titles / captions / filenames */}
      {activeSlot && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-[#0d0d1d]/94 p-4 sm:p-8"
          onClick={() => setActiveSlot(null)}
        >
          <button
            type="button"
            onClick={() => setActiveSlot(null)}
            aria-label="بستن"
            className="fixed top-4 left-4 sm:top-6 sm:left-6 z-50 w-11 h-11 rounded-2xl bg-[#17172F]/95 border border-[#D6B875]/45 text-[#F1DCCB] hover:border-[#D6B875] flex items-center justify-center shadow-lg cursor-pointer"
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
              className="fixed right-3 sm:right-6 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-2xl bg-[#17172F]/95 border border-[#7771A8]/50 text-[#F1DCCB] hover:border-[#D6B875] flex items-center justify-center shadow-lg cursor-pointer"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}

          <div
            className="relative max-w-[90vw] max-h-[84vh] rounded-2xl p-2 sm:p-3 bg-gradient-to-br from-[#D6B875]/40 via-[#242345] to-[#D9A9C5]/30 border border-[#D6B875]/55 shadow-2xl"
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
              className="fixed left-3 sm:left-6 top-1/2 -translate-y-1/2 z-50 w-11 h-11 rounded-2xl bg-[#17172F]/95 border border-[#7771A8]/50 text-[#F1DCCB] hover:border-[#D6B875] flex items-center justify-center shadow-lg cursor-pointer"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}
        </div>
      )}

      {/* Collapsible Bottom Control Dock (5 French Halls & Lighting Moods, Zero Photo Text) */}
      <div className="fixed bottom-3 inset-x-0 z-20 flex flex-col items-center px-3 pointer-events-none">
        <button
          type="button"
          onClick={() => setDockOpen((v) => !v)}
          className="pointer-events-auto mb-1.5 px-3.5 py-1 rounded-t-xl bg-[#17172F]/92 border border-b-0 border-[#7771A8]/45 text-[11px] text-[#F1DCCB] cursor-pointer"
        >
          {dockOpen ? 'جمع کردن راهنمای موزه' : 'نمایش تالارها و نورپردازی'}
        </button>

        {dockOpen && (
          <div className="pointer-events-auto w-full max-w-4xl rounded-2xl bg-[#17172F]/94 border border-[#7771A8]/45 p-3 shadow-2xl space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-xs text-[#D6B875] flex items-center gap-1 ml-1">
                  <Compass className="w-3.5 h-3.5" />
                  تالارها:
                </span>
                {HALL_TABS.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => triggerTeleport(tab.id)}
                    className={`px-2.5 py-1.5 rounded-xl text-xs whitespace-nowrap cursor-pointer ${
                      currentHall === tab.id
                        ? 'bg-[#7771A8] text-[#F1DCCB] font-semibold border border-[#D6B875]/60'
                        : 'bg-[#222245] text-[#D9A9C5] hover:bg-[#2a2a55]'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-1.5">
                <Sun className="w-3.5 h-3.5 text-[#D6B875]" />
                {(
                  [
                    ['daylight', 'نور روز'],
                    ['golden', 'طلایی'],
                    ['evening', 'شامگاهی'],
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
              در پنج تالار پاریسی قدم بزن، با کشیدن صفحه اطراف را ببین و برای تماشای نزدیک روی هر قاب عکس کلیک کن.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

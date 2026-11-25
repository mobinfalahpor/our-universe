import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import * as THREE from 'three';
import {
  Camera,
  Check,
  Copy,
  Eye,
  EyeOff,
  Flower2,
  Grid,
  Heart,
  Layers,
  Minus,
  Moon,
  Move,
  Palette,
  Pencil,
  Plus,
  RotateCcw,
  RotateCw,
  Save,
  Sparkles,
  Sun,
  Sunset,
  Trash2,
  Undo2,
} from 'lucide-react';
import { SceneCanvas } from '../../components/SceneCanvas';
import { useUniverseStore } from '../../core/store';
import { toPersianDigits } from '../../core/persianUtils';
import { audioEngine } from '../../systems/audioEngine';
import { PLANT_SPECIES_INFO } from '../../core/plantCatalog';
import {
  CAT_EMOTION_LABELS,
  deriveCatEmotion,
  pickCatHomeBehavior,
  type CatHomeBehaviorTarget,
} from '../../systems/catHomeBridge';
import { CatActor3D, type CatAnimationName } from '../../components/CatActor3D';
import { MansionArchitecture } from './MansionArchitecture';
import { MansionFurnitureItem } from './MansionFurniture';
import {
  CATALOG_CATEGORIES,
  MANSION_CAMERA_PRESETS,
  MANSION_CATALOG,
  clampScaleForKind,
  getCatalogMeta,
  getZoneMeta,
  isInsideCentralPool,
  resolveSmartPlacement,
  type CatalogCategoryId,
  type CameraPresetMeta,
} from './mansionCatalog';
import type {
  CatEmotion,
  FloorMaterialId,
  FurnitureKind,
  HomeTimeMode,
  PlacedFurniture,
  RoomType,
  SeasonType,
} from '../../core/types';

// =====================================================================
// Mini SVG Thumbnail for Catalog Items (تصویرک اختصاصی و سبک)
// =====================================================================
function CatalogPreviewThumb({ category, color }: { category: CatalogCategoryId; color: string }) {
  return (
    <div
      className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-white/15"
      style={{ background: `linear-gradient(135deg, ${color}33, rgba(23,23,47,0.9))` }}
    >
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="#f2e4cb" strokeWidth="1.6">
        {category === 'carpets' && (
          <>
            <rect x="3" y="5" width="18" height="14" rx="1.5" fill={color} fillOpacity="0.6" />
            <rect x="6" y="8" width="12" height="8" stroke="#d4a84f" />
            <circle cx="12" cy="12" r="2" fill="#d4a84f" />
          </>
        )}
        {category === 'lighting' && (
          <>
            <path d="M9 5h6l2 5H7l2-5z" fill="#ffcf75" fillOpacity="0.8" />
            <path d="M12 10v9M8 19h8" />
          </>
        )}
        {(category === 'plants' || category === 'greenhouse') && (
          <>
            <path d="M8 14h8l-1 6H9l-1-6z" fill={color} fillOpacity="0.7" />
            <path d="M12 14V7m0 3c-2-3-5-2-5 0s3 3 5 1m0-1c2-3 5-2 5 0s-3 3-5 1" />
          </>
        )}
        {category === 'art' && (
          <>
            <rect x="5" y="3" width="14" height="18" rx="1" stroke="#d4a84f" />
            <path d="M8 15l3-4 2 2 3-4v8H8v-2z" fill={color} fillOpacity="0.7" />
          </>
        )}
        {category === 'cat' && (
          <>
            <path d="M6 10l2-4 3 2h2l3-2 2 4v6a4 4 0 01-4 4h-4a4 4 0 01-4-4v-6z" fill="#f47b16" fillOpacity="0.7" />
            <circle cx="10" cy="13" r="0.8" fill="#fff" />
            <circle cx="14" cy="13" r="0.8" fill="#fff" />
          </>
        )}
        {category !== 'carpets' &&
          category !== 'lighting' &&
          category !== 'plants' &&
          category !== 'greenhouse' &&
          category !== 'art' &&
          category !== 'cat' && (
            <>
              <rect x="4" y="10" width="16" height="6" rx="1.5" fill={color} fillOpacity="0.7" />
              <path d="M6 16v3m12-3v3M7 10V7h10v3" />
            </>
          )}
      </svg>
    </div>
  );
}

// =====================================================================
// Camera Smooth Preset Choreography + WASD/Arrow Navigation + Collision
// =====================================================================
function MansionCameraRig({
  presetRequest,
  draggingUid,
  walkInputRef,
  onClearPresetTransition,
}: {
  presetRequest: { pos: [number, number, number]; target: [number, number, number]; nonce: number } | null;
  draggingUid: string | null;
  walkInputRef: React.MutableRefObject<{ forward: number; right: number }>;
  onClearPresetTransition: () => void;
}) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();
  const keysRef = useRef<Record<string, boolean>>({});
  const transitionRef = useRef<{
    active: boolean;
    pos: THREE.Vector3;
    target: THREE.Vector3;
  }>({
    active: false,
    pos: new THREE.Vector3(0.6, 8.9, 13.4),
    target: new THREE.Vector3(0, 0.9, -1.6),
  });

  useEffect(() => {
    if (!presetRequest) return;
    transitionRef.current.active = true;
    transitionRef.current.pos.set(...presetRequest.pos);
    transitionRef.current.target.set(...presetRequest.target);
  }, [presetRequest]);

  useEffect(() => {
    const onDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      keysRef.current[e.code] = true;
    };
    const onUp = (e: KeyboardEvent) => {
      keysRef.current[e.code] = false;
    };
    window.addEventListener('keydown', onDown);
    window.addEventListener('keyup', onUp);
    return () => {
      window.removeEventListener('keydown', onDown);
      window.removeEventListener('keyup', onUp);
    };
  }, []);

  useFrame((_, rawDelta) => {
    const controls = controlsRef.current;
    if (!controls) return;
    const dt = Math.min(0.05, rawDelta);

    // Smoothly interpolate toward preset camera
    if (transitionRef.current.active) {
      const alpha = 1 - Math.exp(-5.2 * dt);
      camera.position.lerp(transitionRef.current.pos, alpha);
      controls.target.lerp(transitionRef.current.target, alpha);
      if (
        camera.position.distanceTo(transitionRef.current.pos) < 0.06 &&
        controls.target.distanceTo(transitionRef.current.target) < 0.06
      ) {
        transitionRef.current.active = false;
        onClearPresetTransition();
      }
    }

    // Keyboard WASD / Arrow & touch pad walking
    const k = keysRef.current;
    let f = walkInputRef.current.forward;
    let r = walkInputRef.current.right;
    if (k.KeyW || k.ArrowUp) f += 1;
    if (k.KeyS || k.ArrowDown) f -= 1;
    if (k.KeyD || k.ArrowRight) r += 1;
    if (k.KeyA || k.ArrowLeft) r -= 1;

    if ((Math.abs(f) > 0.05 || Math.abs(r) > 0.05) && !draggingUid) {
      transitionRef.current.active = false;
      const forwardVec = new THREE.Vector3();
      camera.getWorldDirection(forwardVec);
      forwardVec.y = 0;
      if (forwardVec.lengthSq() > 0.0001) forwardVec.normalize();
      const rightVec = new THREE.Vector3().crossVectors(forwardVec, new THREE.Vector3(0, 1, 0)).normalize();

      const speed = 5.2 * dt;
      const move = new THREE.Vector3()
        .addScaledVector(forwardVec, f * speed)
        .addScaledVector(rightVec, r * speed);

      const nextCamX = THREE.MathUtils.clamp(camera.position.x + move.x, -16.5, 16.5);
      const nextCamZ = THREE.MathUtils.clamp(camera.position.z + move.z, -16.2, 22.0);
      const dx = nextCamX - camera.position.x;
      const dz = nextCamZ - camera.position.z;
      camera.position.x = nextCamX;
      camera.position.z = nextCamZ;
      controls.target.x = THREE.MathUtils.clamp(controls.target.x + dx, -13.2, 13.2);
      controls.target.z = THREE.MathUtils.clamp(controls.target.z + dz, -15.8, 7.5);
    }

    // Clamp camera height & outer bounds so camera stays cleanly above floors & never clips under ground
    camera.position.y = THREE.MathUtils.clamp(camera.position.y, 1.05, 28);
    controls.update();
  });

  return (
    <OrbitControls
      ref={controlsRef}
      enabled={!draggingUid}
      enableDamping
      dampingFactor={0.07}
      minDistance={2.2}
      maxDistance={32}
      maxPolarAngle={Math.PI * 0.48}
      onStart={() => {
        transitionRef.current.active = false;
      }}
    />
  );
}

// =====================================================================
// Real Pointer & Touch Dragging Controller on Horizontal Surface Plane
// =====================================================================
function MansionDragController({
  draggingUid,
  items,
  snapToGrid,
  onMoveItem,
  onStopDrag,
}: {
  draggingUid: string | null;
  items: PlacedFurniture[];
  snapToGrid: boolean;
  onMoveItem: (uid: string, pos: [number, number, number], rotY: number, room: RoomType) => void;
  onStopDrag: () => void;
}) {
  const { camera, gl } = useThree();
  const itemsRef = useRef(items);
  itemsRef.current = items;

  useEffect(() => {
    if (!draggingUid) return;
    const dom = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hitPoint = new THREE.Vector3();

    const onPointerMove = (ev: PointerEvent) => {
      const currentItem = itemsRef.current.find((i) => i.uid === draggingUid);
      if (!currentItem) return;
      const rect = dom.getBoundingClientRect();
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;

      const planeY = getZoneMeta(currentItem.room).floorY;
      const dragPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY);
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(dragPlane, hitPoint)) {
        const resolved = resolveSmartPlacement(
          currentItem,
          hitPoint.x,
          hitPoint.z,
          itemsRef.current,
          snapToGrid
        );
        onMoveItem(draggingUid, resolved.position, resolved.rotationY, resolved.room);
      }
    };

    const onPointerUp = () => {
      onStopDrag();
    };

    window.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
    window.addEventListener('pointercancel', onPointerUp);
    return () => {
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      window.removeEventListener('pointercancel', onPointerUp);
    };
  }, [draggingUid, camera, gl, snapToGrid, onMoveItem, onStopDrag]);

  return null;
}

// =====================================================================
// Living Orange Cat Navigating Across the Entire Persian Mansion
// =====================================================================
function MansionLiveCat({
  allItems,
  activeRoom,
  onStatusChange,
  onPet,
}: {
  allItems: PlacedFurniture[];
  activeRoom: RoomType;
  onStatusChange: (text: string, emotion: CatEmotion) => void;
  onPet: () => void;
}) {
  const cat = useUniverseStore((s) => s.cat);
  const posRef = useRef(new THREE.Vector3(-2.3, 0, 2.0));
  const targetRef = useRef<CatHomeBehaviorTarget>({
    position: [-2.35, 0, 0.3],
    animation: 'Sit',
    emotion: 'curious',
    statusText: `${cat.name} کنار حوض فیروزه‌ای نشسته و ماهی‌های قرمز را تماشا می‌کند`,
    lookTarget: [0, 0.25, 0],
  });
  const walkingRef = useRef(false);
  const rotYRef = useRef(0.6);
  const groupRef = useRef<THREE.Group>(null);
  const [activeAnim, setActiveAnim] = useState<CatAnimationName>('Sit');
  const [recentAction, setRecentAction] = useState<CatAnimationName | null>(null);
  const petTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    onStatusChange(targetRef.current.statusText, targetRef.current.emotion);
  }, [onStatusChange]);

  useEffect(() => {
    const chooseNext = () => {
      const next = pickCatHomeBehavior(cat, allItems, activeRoom);
      targetRef.current = next;
      walkingRef.current = true;
      setActiveAnim('Walk');
      onStatusChange(`${cat.name} در عمارت قدم می‌زند...`, next.emotion);
    };

    const id = window.setInterval(chooseNext, 9000);
    return () => window.clearInterval(id);
  }, [cat, allItems, activeRoom, onStatusChange]);

  useEffect(() => {
    return () => {
      if (petTimeoutRef.current) window.clearTimeout(petTimeoutRef.current);
    };
  }, []);

  useFrame((_, rawDelta) => {
    const dt = Math.min(0.05, rawDelta);
    const tPos = targetRef.current.position;
    const cur = posRef.current;

    if (walkingRef.current) {
      const dx = tPos[0] - cur.x;
      const dz = tPos[2] - cur.z;
      const distXZ = Math.hypot(dx, dz);

      if (distXZ < 0.08) {
        cur.set(tPos[0], tPos[1], tPos[2]);
        walkingRef.current = false;
        setActiveAnim(targetRef.current.animation);
        onStatusChange(targetRef.current.statusText, targetRef.current.emotion);
      } else {
        const speed = 1.35 * dt;
        let nx = cur.x + (dx / distXZ) * Math.min(speed, distXZ);
        let nz = cur.z + (dz / distXZ) * Math.min(speed, distXZ);

        // Steer cleanly around central courtyard pool water
        if (isInsideCentralPool(nx, nz, 0.28)) {
          if (Math.abs(nx) < 2.28) nx = Math.sign(nx || 1) * 2.32;
        }
        const groundY = Math.abs(nx) > 7.4 || nz < -6.5 ? 0.24 : 0;
        const targetY = distXZ < 0.5 ? tPos[1] : groundY;
        cur.x = nx;
        cur.z = nz;
        cur.y = THREE.MathUtils.lerp(cur.y, targetY, 8 * dt);

        const desiredAngle = Math.atan2(dx, dz);
        let diff = desiredAngle - rotYRef.current;
        while (diff > Math.PI) diff -= Math.PI * 2;
        while (diff < -Math.PI) diff += Math.PI * 2;
        rotYRef.current += diff * Math.min(1, 7 * dt);
      }
    } else if (targetRef.current.lookTarget) {
      const lx = targetRef.current.lookTarget[0] - cur.x;
      const lz = targetRef.current.lookTarget[2] - cur.z;
      const desiredAngle = Math.atan2(lx, lz);
      let diff = desiredAngle - rotYRef.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      rotYRef.current += diff * Math.min(1, 4 * dt);
    }

    if (groupRef.current) {
      groupRef.current.position.copy(cur);
      groupRef.current.rotation.y = rotYRef.current;
    }
  });

  const emotion = deriveCatEmotion(cat, recentAction);

  return (
    <group
      ref={groupRef}
      position={[-2.3, 0, 2.0]}
    >
      <CatActor3D
        breed={cat.breed}
        customFurColor={cat.customFurColor}
        accessory={cat.accessory}
        stage={cat.stage}
        animation={recentAction ?? activeAnim}
        emotion={emotion}
        lookTarget={targetRef.current.lookTarget ?? null}
        isPetting={recentAction === 'Happy'}
        onClick={() => {
          audioEngine.playSfx('purr');
          setRecentAction('Happy');
          onStatusChange(`${cat.name} با نوازش تو خرخر شیرینی می‌کند`, 'affectionate');
          onPet();
          if (petTimeoutRef.current) window.clearTimeout(petTimeoutRef.current);
          petTimeoutRef.current = window.setTimeout(() => setRecentAction(null), 2600);
        }}
      />
    </group>
  );
}

// =====================================================================
// Main HomeDesignerWorld Component (عمارت رؤیایی ایرانی)
// =====================================================================
const WALL_PALETTE = [
  { label: 'کرم عاجی', hex: '#e9dcc8' },
  { label: 'گچی گرم', hex: '#f2e8d9' },
  { label: 'پسته‌ای ملایم', hex: '#d3dfd1' },
  { label: 'فیروزه‌ای پودری', hex: '#cde2e3' },
  { label: 'شنی کاشان', hex: '#dfc9ae' },
];

const FLOOR_MATERIALS: { id: FloorMaterialId; label: string }[] = [
  { id: 'walnut', label: 'چوب گردو' },
  { id: 'oak', label: 'بلوط گرم' },
  { id: 'cream_tile', label: 'سنگ کرم' },
  { id: 'marble', label: 'مرمر یزد' },
];

const SEASONS: { id: SeasonType; label: string }[] = [
  { id: 'spring', label: 'بهار' },
  { id: 'summer', label: 'تابستان' },
  { id: 'autumn', label: 'پاییز' },
  { id: 'winter', label: 'زمستان' },
];

export const HomeDesignerWorld: React.FC = () => {
  const home = useUniverseStore((s) => s.home);
  const greenhouse = useUniverseStore((s) => s.greenhouse);
  const homeUndoStack = useUniverseStore((s) => s.homeUndoStack);
  const setActiveRoom = useUniverseStore((s) => s.setActiveRoom);
  const setHomeStyle = useUniverseStore((s) => s.setHomeStyle);
  const pushHomeUndoSnapshot = useUniverseStore((s) => s.pushHomeUndoSnapshot);
  const undoHomeChange = useUniverseStore((s) => s.undoHomeChange);
  const placeFurniture = useUniverseStore((s) => s.placeFurniture);
  const updateFurnitureTransform = useUniverseStore((s) => s.updateFurnitureTransform);
  const rotateFurniture = useUniverseStore((s) => s.rotateFurniture);
  const scaleFurniture = useUniverseStore((s) => s.scaleFurniture);
  const duplicateFurniture = useUniverseStore((s) => s.duplicateFurniture);
  const removeFurniture = useUniverseStore((s) => s.removeFurniture);
  const resetHomeLayout = useUniverseStore((s) => s.resetHomeLayout);
  const revertLastSavedHome = useUniverseStore((s) => s.revertLastSavedHome);
  const saveHomePreset = useUniverseStore((s) => s.saveHomePreset);
  const loadHomePreset = useUniverseStore((s) => s.loadHomePreset);
  const placeGreenhousePlantInHome = useUniverseStore((s) => s.placeGreenhousePlantInHome);
  const interactWithCat = useUniverseStore((s) => s.interactWithCat);

  const [editMode, setEditMode] = useState(false);
  const [cutawayMode, setCutawayMode] = useState(false);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [draggingUid, setDraggingUid] = useState<string | null>(null);
  const [dockOpen, setDockOpen] = useState(false);
  const [dockTab, setDockTab] = useState<'catalog' | 'style'>('catalog');
  const [activeCategory, setActiveCategory] = useState<CatalogCategoryId>('furniture');
  const [presetName, setPresetName] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [catStatus, setCatStatus] = useState('');
  const [catEmotion, setCatEmotion] = useState<CatEmotion>('curious');
  const [activePresetId, setActivePresetId] = useState<string>('overview_courtyard');
  const [cameraRequest, setCameraRequest] = useState<{
    pos: [number, number, number];
    target: [number, number, number];
    nonce: number;
  } | null>({
    pos: MANSION_CAMERA_PRESETS[0].position,
    target: MANSION_CAMERA_PRESETS[0].target,
    nonce: 1,
  });

  const walkInputRef = useRef({ forward: 0, right: 0 });
  const timeMode: HomeTimeMode = home.timeMode ?? 'day';
  const snapToGrid = home.snapToGrid ?? true;

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const t = window.setTimeout(() => setToastMsg(null), 2600);
    return () => window.clearTimeout(t);
  }, [toastMsg]);

  const selectedItem = useMemo(
    () => home.items.find((i) => i.uid === selectedUid) ?? null,
    [home.items, selectedUid]
  );

  const selectedMeta = useMemo(
    () => (selectedItem ? getCatalogMeta(selectedItem.kind) : null),
    [selectedItem]
  );

  const applyCameraPreset = useCallback(
    (preset: CameraPresetMeta) => {
      audioEngine.playSfx('click');
      setActivePresetId(preset.id);
      if (preset.zone) setActiveRoom(preset.zone);
      if (preset.cutawayRecommended !== undefined) {
        setCutawayMode(preset.cutawayRecommended);
      }
      setCameraRequest((prev) => ({
        pos: preset.position,
        target: preset.target,
        nonce: (prev?.nonce ?? 0) + 1,
      }));
    },
    [setActiveRoom]
  );

  const handleToggleEditMode = () => {
    audioEngine.playSfx('click');
    const next = !editMode;
    setEditMode(next);
    if (next) {
      setDockOpen(true);
      setDockTab('catalog');
      showToast('حالت چیدمان فعال شد؛ روی هر وسیله بزنید و با کشیدن جابه‌جا کنید');
    } else {
      setSelectedUid(null);
      setDraggingUid(null);
    }
  };

  const handleStartItemDrag = useCallback(
    (uid: string) => {
      setSelectedUid(uid);
      setDraggingUid(uid);
      pushHomeUndoSnapshot();
    },
    [pushHomeUndoSnapshot]
  );

  const handleDragMove = useCallback(
    (uid: string, position: [number, number, number], rotationY: number, room: RoomType) => {
      updateFurnitureTransform(uid, { position, rotationY, room }, false);
    },
    [updateFurnitureTransform]
  );

  const handleStopDrag = useCallback(() => {
    setDraggingUid(null);
  }, []);

  const handleAddCatalogItem = (kind: FurnitureKind) => {
    const meta = getCatalogMeta(kind);
    const zone = getZoneMeta(home.activeRoom);
    const basePos: [number, number, number] = [
      Number(((zone.minX + zone.maxX) / 2 + (Math.random() - 0.5) * 1.1).toFixed(2)),
      zone.floorY,
      Number(((zone.minZ + zone.maxZ) / 2 + (Math.random() - 0.5) * 1.1).toFixed(2)),
    ];
    const draft: PlacedFurniture = {
      uid: 'temp-place',
      kind,
      room: zone.id,
      position: basePos,
      rotationY: 0,
      color: meta.defaultColor,
      scale: meta.defaultScale,
      surface: meta.surface,
    };
    const resolved = resolveSmartPlacement(draft, basePos[0], basePos[2], home.items, snapToGrid);
    const newUid = placeFurniture(kind, resolved.room, resolved.position, meta.defaultColor, {
      rotationY: resolved.rotationY,
      scale: meta.defaultScale,
      surface: meta.surface,
    });
    setSelectedUid(newUid);
    setEditMode(true);
    audioEngine.playSfx('sparkle');
    showToast(`«${meta.label}» به ${getZoneMeta(resolved.room).label} اضافه شد`);
  };

  const handleAddGreenhousePlant = (slotIndex: number) => {
    const slot = greenhouse.slots.find((s) => s.slotIndex === slotIndex);
    if (!slot || !slot.species) return;
    const zone = getZoneMeta(home.activeRoom);
    const seedX = zone.id === 'courtyard' ? -3.8 + (slotIndex % 3) * 0.9 : (zone.minX + zone.maxX) / 2;
    const seedZ = zone.id === 'courtyard' ? -3.4 + Math.floor(slotIndex / 3) * 6.5 : (zone.minZ + zone.maxZ) / 2;
    const newUid = placeGreenhousePlantInHome(slotIndex, zone.id, [seedX, zone.floorY, seedZ]);
    if (newUid) {
      const placed = useUniverseStore.getState().home.items.find((i) => i.uid === newUid);
      if (placed) {
        const resolved = resolveSmartPlacement(placed, seedX, seedZ, home.items, snapToGrid);
        updateFurnitureTransform(newUid, {
          position: resolved.position,
          room: resolved.room,
        });
      }
      setSelectedUid(newUid);
      setEditMode(true);
      audioEngine.playSfx('sparkle');
      showToast(`«${PLANT_SPECIES_INFO[slot.species].label}» از گلخانه به عمارت آورده شد`);
    }
  };

  const handleCatStatusChange = useCallback((text: string, emotion: CatEmotion) => {
    setCatStatus(text);
    setCatEmotion(emotion);
  }, []);

  const sceneBg =
    timeMode === 'night'
      ? '#10162d'
      : timeMode === 'sunset'
        ? '#c97b5d'
        : '#a9cfe2';

  const fogColor =
    timeMode === 'night'
      ? '#151c38'
      : timeMode === 'sunset'
        ? '#d98f6c'
        : '#cde2ed';

  const filteredCatalog = useMemo(
    () => MANSION_CATALOG.filter((item) => item.category === activeCategory),
    [activeCategory]
  );

  const grownGreenhouseSlots = useMemo(
    () => greenhouse.slots.filter((s) => s.species !== null),
    [greenhouse.slots]
  );

  return (
    <div className="relative w-full h-full select-none">
      <SceneCanvas
        cameraPosition={[0.6, 8.9, 13.4]}
        fov={48}
        bgColor={sceneBg}
        fogColor={fogColor}
        fogNear={26}
        fogFar={78}
      >
        <MansionArchitecture
          timeMode={timeMode}
          season={home.season}
          wallColor={home.wallColor}
          floorMaterial={home.floorMaterial}
          lightWarmth={home.lightWarmth}
          cutawayMode={cutawayMode}
        />

        {home.items.map((item) => (
          <MansionFurnitureItem
            key={item.uid}
            item={item}
            selected={selectedUid === item.uid}
            editMode={editMode}
            timeMode={timeMode}
            onPointerStart={(uid) => handleStartItemDrag(uid)}
          />
        ))}

        <MansionLiveCat
          allItems={home.items}
          activeRoom={home.activeRoom}
          onStatusChange={handleCatStatusChange}
          onPet={() => interactWithCat('pet')}
        />

        <MansionDragController
          draggingUid={draggingUid}
          items={home.items}
          snapToGrid={snapToGrid}
          onMoveItem={handleDragMove}
          onStopDrag={handleStopDrag}
        />

        <MansionCameraRig
          presetRequest={cameraRequest}
          draggingUid={draggingUid}
          walkInputRef={walkInputRef}
          onClearPresetTransition={() => {}}
        />
      </SceneCanvas>

      {/* ============================================================= */}
      {/* TOP BAR: Zone Camera Presets + Time of Day + Edit & Cutaway   */}
      {/* ============================================================= */}
      <div className="fixed top-14 sm:top-16 inset-x-0 z-20 px-3 pointer-events-none flex flex-col gap-1.5 items-center">
        <div className="pointer-events-auto w-full max-w-5xl flex items-center justify-between gap-2 flex-wrap">
          {/* Action Chips */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <button
              type="button"
              onClick={handleToggleEditMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                editMode
                  ? 'bg-[#d4a84f] text-[#17172F] border-[#f2e4cb]'
                  : 'bg-[#17172F]/90 text-[#F1DCCB] border-[#d4a84f]/45 hover:bg-[#232346]'
              }`}
            >
              <Pencil className="w-3.5 h-3.5" />
              <span>{editMode ? 'خروج از ویرایش' : 'چیدمان خانه'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                audioEngine.playSfx('click');
                setCutawayMode((v) => !v);
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs border transition-all cursor-pointer ${
                cutawayMode
                  ? 'bg-[#257d82] text-[#F1DCCB] border-[#96e3e6]/60'
                  : 'bg-[#17172F]/90 text-[#F1DCCB] border-white/15 hover:bg-[#232346]'
              }`}
              title="باز کردن سقف برای چیدمان و دید کل‌نگر"
            >
              {cutawayMode ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{cutawayMode ? 'نمای باز (بدون سقف)' : 'سقف کامل'}</span>
            </button>
          </div>

          {/* Day / Sunset / Night Atmosphere Switcher */}
          <div className="flex items-center gap-1 bg-[#17172F]/90 border border-white/15 rounded-xl p-1">
            {(
              [
                ['day', 'روز', Sun],
                ['sunset', 'غروب', Sunset],
                ['night', 'شب', Moon],
              ] as const
            ).map(([modeId, label, Icon]) => (
              <button
                key={modeId}
                type="button"
                onClick={() => {
                  audioEngine.playSfx('click');
                  setHomeStyle({ timeMode: modeId });
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-medium cursor-pointer transition-colors ${
                  timeMode === modeId
                    ? 'bg-[#d4a84f] text-[#17172F] font-bold'
                    : 'text-[#F1DCCB]/85 hover:bg-white/10'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Camera & Wing Presets Strip */}
        <div className="pointer-events-auto w-full max-w-5xl flex items-center gap-1.5 overflow-x-auto pb-1">
          <span className="text-[11px] text-[#d4a84f] shrink-0 flex items-center gap-1 bg-[#17172F]/85 px-2 py-1.5 rounded-xl border border-white/10">
            <Camera className="w-3.5 h-3.5" />
            <span>بخش‌های عمارت:</span>
          </span>
          {MANSION_CAMERA_PRESETS.map((preset) => (
            <button
              key={preset.id}
              type="button"
              onClick={() => applyCameraPreset(preset)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] whitespace-nowrap shrink-0 border cursor-pointer transition-all ${
                activePresetId === preset.id
                  ? 'bg-[#8a1e2b] text-[#f2e4cb] border-[#d4a84f]'
                  : 'bg-[#17172F]/85 text-[#F1DCCB] border-white/15 hover:bg-[#232346]'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* ============================================================= */}
      {/* FLOATING STATUS BADGES (Cat Live Status + Toast Feedback)     */}
      {/* ============================================================= */}
      <div className="fixed top-36 sm:top-38 right-3 sm:right-5 z-20 pointer-events-none flex flex-col gap-1.5 max-w-[235px]">
        {catStatus && (
          <div className="rounded-xl bg-[#17172F]/88 border border-[#d4a84f]/35 px-2.5 py-1.5 shadow-lg">
            <div className="flex items-center gap-1 text-[10px] text-[#d4a84f] font-semibold">
              <Heart className="w-3 h-3" />
              <span>حس گربه: {CAT_EMOTION_LABELS[catEmotion]}</span>
            </div>
            <p className="text-[11px] text-[#F1DCCB] leading-snug mt-0.5">{catStatus}</p>
          </div>
        )}
        {toastMsg && (
          <div className="rounded-xl bg-[#257d82]/95 border border-white/25 px-3 py-1.5 text-[11px] text-white shadow-xl">
            {toastMsg}
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* SUBTLE WALK CONTROLS HINT / MINI MOBILE D-PAD                 */}
      {/* ============================================================= */}
      <div className="fixed left-3 top-38 z-20 pointer-events-auto hidden md:flex flex-col items-center gap-1 bg-[#17172F]/80 border border-white/15 rounded-xl p-1.5 text-[10px] text-[#F1DCCB]/80">
        <span>حرکت: W A S D</span>
        <div className="grid grid-cols-3 gap-0.5">
          <div />
          <button
            type="button"
            onPointerDown={() => (walkInputRef.current.forward = 1)}
            onPointerUp={() => (walkInputRef.current.forward = 0)}
            onPointerLeave={() => (walkInputRef.current.forward = 0)}
            className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 cursor-pointer"
          >
            ▲
          </button>
          <div />
          <button
            type="button"
            onPointerDown={() => (walkInputRef.current.right = -1)}
            onPointerUp={() => (walkInputRef.current.right = 0)}
            onPointerLeave={() => (walkInputRef.current.right = 0)}
            className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 cursor-pointer"
          >
            ◀
          </button>
          <button
            type="button"
            onPointerDown={() => (walkInputRef.current.forward = -1)}
            onPointerUp={() => (walkInputRef.current.forward = 0)}
            onPointerLeave={() => (walkInputRef.current.forward = 0)}
            className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 cursor-pointer"
          >
            ▼
          </button>
          <button
            type="button"
            onPointerDown={() => (walkInputRef.current.right = 1)}
            onPointerUp={() => (walkInputRef.current.right = 0)}
            onPointerLeave={() => (walkInputRef.current.right = 0)}
            className="w-6 h-6 rounded bg-white/10 hover:bg-white/20 cursor-pointer"
          >
            ▶
          </button>
        </div>
      </div>

      {/* ============================================================= */}
      {/* SELECTED ITEM COMPACT ACTION BAR (ویرایش دقیق شیء انتخاب‌شده) */}
      {/* ============================================================= */}
      {editMode && selectedItem && selectedMeta && (
        <div className="fixed bottom-52 sm:bottom-56 inset-x-0 z-30 flex justify-center px-3 pointer-events-none">
          <div className="pointer-events-auto w-full max-w-2xl rounded-2xl bg-[#17172F]/95 border border-[#d4a84f]/65 px-3 py-2.5 shadow-2xl space-y-2">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-[#d4a84f]">{selectedMeta.label}</span>
                <span className="text-[11px] text-[#F1DCCB]/75 bg-white/10 px-2 py-0.5 rounded-lg">
                  {getZoneMeta(selectedItem.room).label}
                </span>
                <span className="text-[10px] text-[#9be0dc] flex items-center gap-1">
                  <Move className="w-3 h-3" />
                  <span>بکشید تا جابه‌جا شود</span>
                </span>
              </div>

              <div className="flex items-center gap-1.5">
                {selectedMeta.colorOptions.map((c) => (
                  <button
                    key={c.hex}
                    type="button"
                    onClick={() => updateFurnitureTransform(selectedItem.uid, { color: c.hex }, true)}
                    className={`w-5 h-5 rounded-full border-2 cursor-pointer ${
                      selectedItem.color === c.hex ? 'border-white scale-110' : 'border-transparent'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.label}
                  />
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between gap-1.5 flex-wrap">
              {/* Rotation */}
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playSfx('click');
                    rotateFurniture(selectedItem.uid, -Math.PI / 12);
                  }}
                  className="px-2 py-1 rounded-lg bg-[#232645] hover:bg-[#313661] text-[11px] text-[#F1DCCB] flex items-center gap-1 cursor-pointer"
                  title="چرخش ۱۵ درجه چپ"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>۱۵°</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    audioEngine.playSfx('click');
                    rotateFurniture(selectedItem.uid, Math.PI / 12);
                  }}
                  className="px-2 py-1 rounded-lg bg-[#232645] hover:bg-[#313661] text-[11px] text-[#F1DCCB] flex items-center gap-1 cursor-pointer"
                  title="چرخش ۱۵ درجه راست"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  <span>۱۵°</span>
                </button>
              </div>

              {/* Scale +/- */}
              <div className="flex items-center gap-1 bg-[#232645] px-2 py-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => {
                    const cur = selectedItem.scale ?? selectedMeta.defaultScale;
                    scaleFurniture(selectedItem.uid, clampScaleForKind(selectedItem.kind, cur - 0.08));
                  }}
                  className="p-0.5 rounded hover:bg-white/10 text-[#F1DCCB] cursor-pointer"
                  title="کوچک‌تر"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="text-[11px] text-[#d4a84f] min-w-[42px] text-center tabular-nums">
                  {toPersianDigits(Math.round((selectedItem.scale ?? selectedMeta.defaultScale) * 100))}٪
                </span>
                <button
                  type="button"
                  onClick={() => {
                    const cur = selectedItem.scale ?? selectedMeta.defaultScale;
                    scaleFurniture(selectedItem.uid, clampScaleForKind(selectedItem.kind, cur + 0.08));
                  }}
                  className="p-0.5 rounded hover:bg-white/10 text-[#F1DCCB] cursor-pointer"
                  title="بزرگ‌تر"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Duplicate, Reset Size, Delete, Confirm */}
              <div className="flex items-center gap-1">
                {selectedMeta.allowMultiple && (
                  <button
                    type="button"
                    onClick={() => {
                      const copyUid = duplicateFurniture(selectedItem.uid);
                      if (copyUid) {
                        setSelectedUid(copyUid);
                        audioEngine.playSfx('sparkle');
                        showToast('یک نسخه مشابه اضافه شد');
                      }
                    }}
                    className="px-2 py-1 rounded-lg bg-[#257d82] text-white text-[11px] flex items-center gap-1 cursor-pointer"
                    title="تکرار"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>تکرار</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    updateFurnitureTransform(
                      selectedItem.uid,
                      { scale: selectedMeta.defaultScale, rotationY: 0 },
                      true
                    );
                    showToast('اندازه و زاویه به حالت اولیه برگشت');
                  }}
                  className="px-2 py-1 rounded-lg bg-[#232645] text-[#F1DCCB] text-[11px] cursor-pointer"
                >
                  اندازه اصلی
                </button>

                <button
                  type="button"
                  onClick={() => {
                    removeFurniture(selectedItem.uid);
                    setSelectedUid(null);
                    audioEngine.playSfx('click');
                  }}
                  className="p-1.5 rounded-lg bg-[#7a2232] text-white cursor-pointer"
                  title="حذف وسیله"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedUid(null);
                    audioEngine.playSfx('click');
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[#d4a84f] text-[#17172F] text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>تأیید</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================= */}
      {/* BOTTOM COLLAPSIBLE DESIGNER & CATALOG DOCK                    */}
      {/* ============================================================= */}
      <div className="fixed bottom-2.5 inset-x-0 z-20 flex flex-col items-center px-3 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-1.5 mb-1">
          <button
            type="button"
            onClick={() => setDockOpen((v) => !v)}
            className="px-3.5 py-1 rounded-t-xl bg-[#17172F]/92 border border-b-0 border-[#d4a84f]/45 text-[11px] font-medium text-[#F1DCCB] cursor-pointer"
          >
            {dockOpen ? 'جمع کردن منوی چیدمان' : 'باز کردن کاتالوگ و چیدمان عمارت'}
          </button>

          {homeUndoStack.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (undoHomeChange()) {
                  audioEngine.playSfx('click');
                  showToast('آخرین تغییر بازگردانده شد');
                }
              }}
              className="px-2.5 py-1 rounded-t-xl bg-[#2a2748]/95 border border-b-0 border-[#d4a84f]/40 text-[11px] text-[#d4a84f] flex items-center gap-1 cursor-pointer"
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span>لغو</span>
            </button>
          )}
        </div>

        {dockOpen && (
          <div className="pointer-events-auto w-full max-w-4xl rounded-2xl bg-[#17172F]/94 border border-[#d4a84f]/45 p-3 shadow-2xl space-y-2.5 max-h-[44vh] overflow-y-auto">
            {/* Top Mode Tabs + Grid Snap + Quick Save */}
            <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-2 flex-wrap">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setDockTab('catalog')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs cursor-pointer ${
                    dockTab === 'catalog'
                      ? 'bg-[#8a1e2b] text-[#f2e4cb] font-bold'
                      : 'bg-[#222542] text-[#F1DCCB]'
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>وسایل، فرش و گل‌ها</span>
                </button>
                <button
                  type="button"
                  onClick={() => setDockTab('style')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs cursor-pointer ${
                    dockTab === 'style'
                      ? 'bg-[#8a1e2b] text-[#f2e4cb] font-bold'
                      : 'bg-[#222542] text-[#F1DCCB]'
                  }`}
                >
                  <Palette className="w-3.5 h-3.5" />
                  <span>معماری و ذخیره چیدمان</span>
                </button>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setHomeStyle({ snapToGrid: !snapToGrid })}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-[11px] border cursor-pointer ${
                    snapToGrid
                      ? 'bg-[#257d82] text-white border-[#8fdcdf]/50'
                      : 'bg-[#222542] text-[#F1DCCB]/80 border-white/10'
                  }`}
                >
                  <Grid className="w-3.5 h-3.5" />
                  <span>{snapToGrid ? 'چسبندگی شبکه: روشن' : 'آزاد'}</span>
                </button>
                <span className="text-[11px] text-[#d4a84f] hidden sm:inline">
                  فضای فعال: {getZoneMeta(home.activeRoom).label}
                </span>
              </div>
            </div>

            {dockTab === 'catalog' ? (
              <div className="space-y-2.5">
                {/* Category Tabs */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  {CATALOG_CATEGORIES.map((catMeta) => (
                    <button
                      key={catMeta.id}
                      type="button"
                      onClick={() => setActiveCategory(catMeta.id)}
                      className={`px-2.5 py-1.5 rounded-xl text-[11px] whitespace-nowrap shrink-0 cursor-pointer transition-colors ${
                        activeCategory === catMeta.id
                          ? 'bg-[#d4a84f] text-[#17172F] font-bold'
                          : 'bg-[#222542] text-[#F1DCCB] hover:bg-[#2d3258]'
                      }`}
                    >
                      {catMeta.label}
                    </button>
                  ))}
                </div>

                {/* Live Greenhouse Plants Bridge OR Standard Catalog Items */}
                {activeCategory === 'greenhouse' ? (
                  <div className="space-y-1.5">
                    <p className="text-[11px] text-[#9be0dc]">
                      گیاهان و گل‌هایی که در «گلخانه جادویی» کاشته‌اید، اینجا مستقیماً به باغچه و اتاق‌های عمارت منتقل می‌شوند:
                    </p>
                    {grownGreenhouseSlots.length === 0 ? (
                      <div className="p-3 rounded-xl bg-[#222542] text-xs text-[#F1DCCB]/80">
                        فعلاً در گلخانه بذری کاشته نشده است؛ می‌توانید از دنیای «گلخانه جادویی» بذر بکارید و به عمارت بیاورید.
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 overflow-x-auto pb-1">
                        {grownGreenhouseSlots.map((slot) => {
                          const spInfo = PLANT_SPECIES_INFO[slot.species!];
                          return (
                            <button
                              key={slot.slotIndex}
                              type="button"
                              onClick={() => handleAddGreenhousePlant(slot.slotIndex)}
                              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[#222542] hover:bg-[#2e355b] border border-[#9be0dc]/35 text-right shrink-0 cursor-pointer"
                            >
                              <Flower2 className="w-5 h-5 shrink-0" style={{ color: spInfo.color }} />
                              <div>
                                <div className="text-xs font-semibold text-[#F1DCCB]">
                                  {spInfo.label} (گلدان {toPersianDigits(slot.slotIndex + 1)})
                                </div>
                                <div className="text-[10px] text-[#9be0dc]">
                                  رشد {toPersianDigits(slot.growthProgress)}٪ · افزودن به عمارت
                                </div>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 overflow-x-auto pb-1">
                    {filteredCatalog.map((item) => (
                      <button
                        key={item.kind}
                        type="button"
                        onClick={() => handleAddCatalogItem(item.kind)}
                        className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-[#222542] hover:bg-[#2f345a] border border-white/10 text-right shrink-0 cursor-pointer transition-colors"
                      >
                        <CatalogPreviewThumb category={item.category} color={item.defaultColor} />
                        <div>
                          <div className="text-xs font-medium text-[#F1DCCB] whitespace-nowrap">
                            {item.label}
                          </div>
                          <div className="text-[10px] text-[#d4a84f]">
                            {item.surface === 'table'
                              ? 'رومیزی (چسبان به میز)'
                              : item.surface === 'wall'
                                ? 'دیواری (چسبان به دیوار)'
                                : item.surface === 'rug'
                                  ? 'فرش زیر مبلمان'
                                  : item.surface === 'garden'
                                    ? 'مناسب باغچه و حیاط'
                                    : 'چیدمان روی زمین'}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-2.5">
                {/* Wall, Floor, Season Controls */}
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-[#d4a84f]">رنگ گچ دیوارها:</span>
                    {WALL_PALETTE.map((w) => (
                      <button
                        key={w.hex}
                        type="button"
                        onClick={() => setHomeStyle({ wallColor: w.hex })}
                        className={`w-6 h-6 rounded-full border-2 cursor-pointer ${
                          home.wallColor === w.hex ? 'border-[#d4a84f] scale-110' : 'border-white/25'
                        }`}
                        style={{ backgroundColor: w.hex }}
                        title={w.label}
                      />
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-[#d4a84f]">کف‌پوش:</span>
                    {FLOOR_MATERIALS.map((fm) => (
                      <button
                        key={fm.id}
                        type="button"
                        onClick={() => setHomeStyle({ floorMaterial: fm.id })}
                        className={`px-2 py-1 rounded-lg text-[11px] cursor-pointer ${
                          home.floorMaterial === fm.id
                            ? 'bg-[#d4a84f] text-[#17172F] font-bold'
                            : 'bg-[#222542] text-[#F1DCCB]'
                        }`}
                      >
                        {fm.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-[#d4a84f]">فصل باغ:</span>
                    {SEASONS.map((se) => (
                      <button
                        key={se.id}
                        type="button"
                        onClick={() => setHomeStyle({ season: se.id })}
                        className={`px-2 py-1 rounded-lg text-[11px] cursor-pointer ${
                          home.season === se.id
                            ? 'bg-[#257d82] text-white font-bold'
                            : 'bg-[#222542] text-[#F1DCCB]'
                        }`}
                      >
                        {se.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Save / Revert / Reset / Presets */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/10 flex-wrap">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="text"
                      value={presetName}
                      onChange={(e) => setPresetName(e.target.value)}
                      placeholder="نام چیدمان (مثلاً شب یلدا)..."
                      className="px-2.5 py-1.5 rounded-xl bg-[#222542] border border-white/15 text-xs text-[#F1DCCB] w-44 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        saveHomePreset(presetName);
                        setPresetName('');
                        audioEngine.playSfx('sparkle');
                        showToast('چیدمان فعلی در حافظه مرورگر ذخیره شد');
                      }}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#d4a84f] text-[#17172F] text-xs font-bold cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>ذخیره</span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        if (revertLastSavedHome()) {
                          audioEngine.playSfx('click');
                          showToast('به آخرین چیدمان ذخیره‌شده برگشتید');
                        }
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-[#222542] hover:bg-[#2d3258] text-[11px] text-[#F1DCCB] cursor-pointer"
                    >
                      بازگشت به آخرین ذخیره
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        resetHomeLayout();
                        setSelectedUid(null);
                        audioEngine.playSfx('click');
                        showToast('عمارت به چیدمان اصیل پیش‌فرض بازگردانی شد');
                      }}
                      className="px-2.5 py-1.5 rounded-xl bg-[#7a2232] hover:bg-[#912b3d] text-[11px] text-white cursor-pointer"
                    >
                      بازنشانی پیش‌فرض
                    </button>
                  </div>
                </div>

                {home.savedPresets.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                    <span className="text-[11px] text-[#d4a84f] shrink-0 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      <span>چیدمان‌های ذخیره‌شده:</span>
                    </span>
                    {home.savedPresets.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => {
                          loadHomePreset(p.id);
                          audioEngine.playSfx('click');
                          showToast(`چیدمان «${p.name}» بارگذاری شد`);
                        }}
                        className={`px-2.5 py-1 rounded-xl text-[11px] shrink-0 cursor-pointer ${
                          home.activePresetId === p.id
                            ? 'bg-[#257d82] text-white font-semibold'
                            : 'bg-[#222542] text-[#F1DCCB]'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

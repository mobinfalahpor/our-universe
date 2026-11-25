import { create } from 'zustand';
import { loadUniverseState, saveUniverseState } from './db';
import { MUSIC_TRACKS_CONFIG } from '../config/musicConfig';
import {
  ALL_UNLOCKED_MANSION_KINDS,
  DEFAULT_MANSION_ITEMS,
  clampScaleForKind,
  getCatalogMeta,
} from '../worlds/HomeDesigner/mansionCatalog';
import { POT_STYLES_INFO } from './plantCatalog';
import type {
  AquariumDecor,
  AquariumDecorKind,
  AquariumFish,
  AquariumState,
  AudioSettings,
  CatStage,
  CatState,
  CatToyItemId,
  EnvironmentSettings,
  FishSpecies,
  FloorMaterialId,
  FurnitureKind,
  GreenhouseState,
  HomeDesignPreset,
  HomeState,
  HomeTimeMode,
  PlacedFurniture,
  PlantSpecies,
  PotStyle,
  RoomType,
  SeasonType,
  StarColorHex,
  UniversePersistedState,
  WishCategory,
  WishItem,
  WorldId,
  WorldMeta,
} from './types';

export const WORLDS_META: WorldMeta[] = [
  {
    id: 'museum',
    title: 'موزه خیال',
    subtitle: 'تالار قاب‌های هنری و نورهای شاعرانه',
    accentColor: '#D6B875',
    islandPosition: [-6.8, 1.35, -3.5],
  },
  {
    id: 'music',
    title: 'اتاق موسیقی',
    subtitle: 'گرامافون قدیمی و نوای باران',
    accentColor: '#D9A9C5',
    islandPosition: [-5.5, 1.25, 4.2],
  },
  {
    id: 'cat',
    title: 'گربه نارنجی من',
    subtitle: 'همبازی پشمالو و دوست‌داشتنی',
    accentColor: '#F1DCCB',
    islandPosition: [0.2, 1.3, 6.2],
  },
  {
    id: 'home',
    title: 'خانه رؤیایی ما',
    subtitle: 'چیدمان خانه‌ای گرم با گربه‌مان',
    accentColor: '#D9A9C5',
    islandPosition: [0.0, 1.55, 0.2],
  },
  {
    id: 'wishes',
    title: 'آسمان آرزوها',
    subtitle: 'آرزوهایی که ستاره می‌شوند',
    accentColor: '#7771A8',
    islandPosition: [6.2, 1.4, -3.8],
  },
  {
    id: 'greenhouse',
    title: 'گلخانه جادویی',
    subtitle: 'کاشت و پرورش گل‌های کمیاب',
    accentColor: '#A6BBAA',
    islandPosition: [6.4, 1.25, 3.4],
  },
  {
    id: 'cafe',
    title: 'کافه روی ابرها',
    subtitle: 'عطر قهوه و هات‌چاکلت میان ابرها',
    accentColor: '#D6B875',
    islandPosition: [-1.8, 1.45, -6.5],
  },
  {
    id: 'aquarium',
    title: 'دنیای زیر آب',
    subtitle: 'آکواریوم مرجانی و رقص ماهی‌ها',
    accentColor: '#A6BBAA',
    islandPosition: [4.2, 0.85, 6.4],
  },
  {
    id: 'observatory',
    title: 'رصدخانه ستاره‌ها',
    subtitle: 'تلسکوپ و تماشای صورت‌های فلکی',
    accentColor: '#7771A8',
    islandPosition: [2.6, 1.9, -6.2],
  },
];

const INITIAL_WISHES: WishItem[] = [
  {
    id: 'w-init-1',
    title: 'شب‌های پرستاره کنار هم',
    text: 'آرزو می‌کنم همیشه آسمان بالای سرمان پر از آرامش، لبخند و ستاره‌هایی باشد که با هم می‌شماریم.',
    category: 'love',
    color: '#D6B875',
    createdAt: Date.now() - 86400000 * 3,
    position: [-8, 7, -14],
  },
  {
    id: 'w-init-2',
    title: 'سفر به شهرهای بارانی',
    text: 'یک صبح بارانی در کافه‌ای دنج، دو فنجان هات‌چاکلت داغ و قدم‌زدن بدون عجله زیر چتر.',
    category: 'travel',
    color: '#D9A9C5',
    createdAt: Date.now() - 86400000 * 2,
    position: [9, 9, -16],
  },
  {
    id: 'w-init-3',
    title: 'خانه‌ای پر از گل و نور',
    text: 'خانه‌ای گرم با پنجره‌های بزرگ، گلدان‌های شمعدانی و گربه‌ای که روی مبل خوابیده باشد.',
    category: 'dreams',
    color: '#A6BBAA',
    createdAt: Date.now() - 86400000,
    position: [0, 11, -18],
  },
];

const DEFAULT_HOME_ITEMS: PlacedFurniture[] = DEFAULT_MANSION_ITEMS;

export const DEFAULT_UNIVERSE_STATE: UniversePersistedState = {
  hasEntered: false,
  starsCurrency: 260,
  cat: {
    adopted: true,
    name: 'نارنگی',
    breed: 'honey',
    catOrangeMigrated: true,
    accessory: 'rose_bow',
    hunger: 84,
    happiness: 88,
    energy: 86,
    cleanliness: 85,
    affection: 78,
    affectionXp: 35,
    stage: 'young',
    personality: 'مهربان و بازیگوش',
    unlockedItems: ['yarn_ball', 'velvet_cushion'],
    lastUpdatedAt: Date.now(),
  },
  home: {
    activeRoom: 'courtyard',
    wallColor: '#e9dcc8',
    floorMaterial: 'walnut',
    season: 'spring',
    lightWarmth: 0.78,
    timeMode: 'day',
    snapToGrid: true,
    mansionMigrated: true,
    unlockedKinds: ALL_UNLOCKED_MANSION_KINDS,
    items: DEFAULT_HOME_ITEMS,
    savedPresets: [
      {
        id: 'preset-persian-mansion-default',
        name: 'عمارت اصیل ایرانی (پیش‌فرض)',
        wallColor: '#e9dcc8',
        floorMaterial: 'walnut',
        season: 'spring',
        lightWarmth: 0.78,
        timeMode: 'day',
        items: DEFAULT_HOME_ITEMS,
        savedAt: Date.now(),
      },
    ],
    activePresetId: 'preset-persian-mansion-default',
  },
  wishes: INITIAL_WISHES,
  greenhouse: {
    theme: 'sunny',
    slots: [
      {
        slotIndex: 0,
        species: 'dream_rose',
        potStyle: 'rose_ceramic',
        plantedAt: Date.now() - 600000,
        hydration: 85,
        growthProgress: 92,
        lastWateredAt: Date.now() - 120000,
      },
      {
        slotIndex: 1,
        species: 'moon_lavender',
        potStyle: 'terracotta',
        plantedAt: Date.now() - 300000,
        hydration: 72,
        growthProgress: 60,
        lastWateredAt: Date.now() - 180000,
      },
      {
        slotIndex: 2,
        species: null,
        potStyle: 'gold_trimmed',
        plantedAt: 0,
        hydration: 100,
        growthProgress: 0,
        lastWateredAt: 0,
      },
      {
        slotIndex: 3,
        species: null,
        potStyle: 'mossy_stone',
        plantedAt: 0,
        hydration: 100,
        growthProgress: 0,
        lastWateredAt: 0,
      },
      {
        slotIndex: 4,
        species: 'crystal_lotus',
        potStyle: 'gold_trimmed',
        plantedAt: Date.now() - 450000,
        hydration: 68,
        growthProgress: 42,
        lastWateredAt: Date.now() - 240000,
      },
      {
        slotIndex: 5,
        species: null,
        potStyle: 'rose_ceramic',
        plantedAt: 0,
        hydration: 100,
        growthProgress: 0,
        lastWateredAt: 0,
      },
    ],
  },
  aquarium: {
    waterClarity: 92,
    lightMode: 'lagoon',
    fish: [
      { id: 'fish-1', species: 'clown', name: 'مرجان', size: 1 },
      { id: 'fish-2', species: 'angelfish', name: 'طلا', size: 1.1 },
      { id: 'fish-3', species: 'betta', name: 'نیلوفر', size: 1 },
      { id: 'fish-4', species: 'neon', name: 'ستاره', size: 0.85 },
      { id: 'fish-5', species: 'turtle', name: 'صدف', size: 1.15 },
    ],
    decor: [
      { id: 'dec-1', kind: 'coral_pink', position: [-2.2, -1.6, -0.6], rotationY: 0.4, scale: 1 },
      { id: 'dec-2', kind: 'coral_lavender', position: [2.0, -1.6, 0.3], rotationY: -0.6, scale: 1.1 },
      { id: 'dec-3', kind: 'shell_pearl', position: [0.2, -1.65, 0.6], rotationY: 0.1, scale: 1 },
      { id: 'dec-4', kind: 'kelp_clump', position: [-3.1, -1.7, 0.8], rotationY: 0, scale: 1.2 },
      { id: 'dec-5', kind: 'kelp_clump', position: [3.0, -1.7, -0.8], rotationY: 1.2, scale: 1.1 },
      { id: 'dec-6', kind: 'sea_rock', position: [-0.8, -1.7, -1.0], rotationY: 0.5, scale: 1 },
    ],
  },
  audio: {
    muted: false,
    volume: 0.65,
    activeTrackId: MUSIC_TRACKS_CONFIG[0]?.id ?? 'rainy-night-dream',
    ambientMode: 'none',
  },
  environment: {
    quality: 'auto',
    reducedMotion: false,
    timeOfDay: 'twilight',
    cafeTheme: 'rose_romantic',
    cafeWeather: 'sunny',
    cafeTime: 'sunset',
  },
};

function computeCatStage(xp: number): CatStage {
  if (xp >= 120) return 'adult';
  if (xp >= 30) return 'young';
  return 'kitten';
}

function computePersonality(cat: CatState): string {
  if (cat.affection >= 85 && cat.happiness >= 80) return 'بسیار مهربان و بغلی';
  if (cat.happiness > 82 && cat.energy > 65) return 'پرانرژی و بازیگوش';
  if (cat.energy < 42) return 'خواب‌آلود و آرام';
  return 'کنجکاو و دوست‌داشتنی';
}

interface UniverseStore extends UniversePersistedState {
  hydrated: boolean;
  activeWorld: WorldId;
  enteringTransition: boolean;
  hydrate: () => Promise<void>;
  setHasEntered: (entered: boolean) => void;
  setActiveWorld: (world: WorldId) => void;
  setEnteringTransition: (active: boolean) => void;
  addStars: (amount: number) => void;

  // Cat actions
  updateCatProfile: (patch: Partial<Pick<CatState, 'name' | 'breed' | 'customFurColor' | 'accessory' | 'adopted'>>) => void;
  interactWithCat: (
    action: 'feed' | 'drink' | 'pet' | 'play' | 'bath' | 'sleep' | 'stretch' | 'yawn' | 'lick_paw' | 'groom' | 'call'
  ) => void;
  unlockCatItem: (item: CatToyItemId, cost: number) => boolean;
  tickCatNeeds: () => void;

  // Home actions
  homeUndoStack: PlacedFurniture[][];
  setActiveRoom: (room: RoomType) => void;
  setHomeStyle: (patch: Partial<Pick<HomeState, 'wallColor' | 'floorMaterial' | 'season' | 'lightWarmth' | 'timeMode' | 'snapToGrid'>>) => void;
  pushHomeUndoSnapshot: () => void;
  undoHomeChange: () => boolean;
  placeFurniture: (
    kind: FurnitureKind,
    room: RoomType,
    position: [number, number, number],
    color: string,
    extra?: Partial<Pick<PlacedFurniture, 'scale' | 'surface' | 'rotationY' | 'plantSpecies' | 'potStyle' | 'greenhouseSlotIndex'>>
  ) => string;
  updateFurnitureTransform: (
    uid: string,
    patch: Partial<Pick<PlacedFurniture, 'position' | 'rotationY' | 'scale' | 'room' | 'color' | 'plantSpecies' | 'potStyle'>>,
    recordUndo?: boolean
  ) => void;
  moveFurniture: (uid: string, position: [number, number, number]) => void;
  rotateFurniture: (uid: string, deltaRad?: number) => void;
  scaleFurniture: (uid: string, nextScale: number) => void;
  duplicateFurniture: (uid: string) => string | null;
  removeFurniture: (uid: string) => void;
  resetHomeLayout: () => void;
  revertLastSavedHome: () => boolean;
  saveHomePreset: (name: string) => void;
  loadHomePreset: (id: string) => void;
  unlockFurnitureKind: (kind: FurnitureKind, cost: number) => boolean;
  placeGreenhousePlantInHome: (slotIndex: number, room: RoomType, position: [number, number, number]) => string | null;

  // Wishes
  addWish: (title: string, text: string, category: WishCategory, color: StarColorHex) => WishItem;
  removeWish: (id: string) => void;

  // Greenhouse
  plantSeed: (slotIndex: number, species: PlantSpecies) => void;
  waterPlant: (slotIndex: number) => void;
  changePotStyle: (slotIndex: number, potStyle: PotStyle) => void;
  clearPlantSlot: (slotIndex: number) => void;
  setGreenhouseTheme: (theme: GreenhouseState['theme']) => void;
  tickGreenhouseGrowth: () => void;

  // Aquarium
  addFish: (species: FishSpecies, name: string) => void;
  removeFish: (id: string) => void;
  addAquariumDecor: (kind: AquariumDecorKind, position: [number, number, number]) => void;
  moveAquariumDecor: (id: string, position: [number, number, number]) => void;
  removeAquariumDecor: (id: string) => void;
  cleanAquarium: () => void;
  setAquariumLight: (mode: AquariumState['lightMode']) => void;

  // Audio & Environment
  setAudioSettings: (patch: Partial<AudioSettings>) => void;
  setEnvironmentSettings: (patch: Partial<EnvironmentSettings>) => void;
}

let persistTimer: number | null = null;
function schedulePersist(getState: () => UniverseStore) {
  if (typeof window === 'undefined') return;
  if (persistTimer) window.clearTimeout(persistTimer);
  persistTimer = window.setTimeout(() => {
    const s = getState();
    const persisted: UniversePersistedState = {
      hasEntered: s.hasEntered,
      starsCurrency: s.starsCurrency,
      cat: s.cat,
      home: s.home,
      wishes: s.wishes,
      greenhouse: s.greenhouse,
      aquarium: s.aquarium,
      audio: s.audio,
      environment: s.environment,
    };
    void saveUniverseState(persisted);
  }, 220);
}

export const useUniverseStore = create<UniverseStore>((set, get) => ({
  ...DEFAULT_UNIVERSE_STATE,
  hydrated: false,
  activeWorld: 'island',
  enteringTransition: false,
  homeUndoStack: [],

  hydrate: async () => {
    const saved = await loadUniverseState();
    if (saved) {
      const needsOrangeMigration = !saved.cat?.catOrangeMigrated;
      const needsMansionMigration = !saved.home?.mansionMigrated;
      const nextHome: HomeState = needsMansionMigration
        ? {
            ...DEFAULT_UNIVERSE_STATE.home,
            savedPresets: [
              ...DEFAULT_UNIVERSE_STATE.home.savedPresets,
              ...(saved.home?.savedPresets ?? []).filter(
                (p) => p.id !== 'preset-cozy-default' && p.id !== 'preset-persian-mansion-default'
              ),
            ].slice(0, 8),
            mansionMigrated: true,
          }
        : {
            ...DEFAULT_UNIVERSE_STATE.home,
            ...saved.home,
            mansionMigrated: true,
            unlockedKinds: Array.from(
              new Set([
                ...(saved.home?.unlockedKinds ?? []),
                ...ALL_UNLOCKED_MANSION_KINDS,
              ])
            ),
          };
      set({
        ...DEFAULT_UNIVERSE_STATE,
        ...saved,
        cat: {
          ...DEFAULT_UNIVERSE_STATE.cat,
          ...saved.cat,
          breed: needsOrangeMigration ? 'honey' : (saved.cat?.breed ?? 'honey'),
          catOrangeMigrated: true,
          affection: saved.cat?.affection ?? DEFAULT_UNIVERSE_STATE.cat.affection,
          unlockedItems: saved.cat?.unlockedItems ?? DEFAULT_UNIVERSE_STATE.cat.unlockedItems,
        },
        home: nextHome,
        greenhouse: { ...DEFAULT_UNIVERSE_STATE.greenhouse, ...saved.greenhouse },
        aquarium: { ...DEFAULT_UNIVERSE_STATE.aquarium, ...saved.aquarium },
        audio: { ...DEFAULT_UNIVERSE_STATE.audio, ...saved.audio },
        environment: { ...DEFAULT_UNIVERSE_STATE.environment, ...saved.environment },
        hydrated: true,
      });
      get().tickCatNeeds();
      if (needsOrangeMigration || needsMansionMigration) schedulePersist(get);
    } else {
      set({ hydrated: true });
    }
  },

  setHasEntered: (entered) => {
    set({ hasEntered: entered });
    schedulePersist(get);
  },

  setActiveWorld: (world) => set({ activeWorld: world }),
  setEnteringTransition: (active) => set({ enteringTransition: active }),

  addStars: (amount) => {
    set((s) => ({ starsCurrency: Math.max(0, s.starsCurrency + amount) }));
    schedulePersist(get);
  },

  updateCatProfile: (patch) => {
    set((s) => {
      const nextCat = { ...s.cat, ...patch, lastUpdatedAt: Date.now() };
      return { cat: nextCat };
    });
    schedulePersist(get);
  },

  interactWithCat: (action) => {
    set((s) => {
      const c = { ...s.cat };
      let starReward = 5;
      switch (action) {
        case 'feed':
          c.hunger = Math.min(100, c.hunger + 26);
          c.happiness = Math.min(100, c.happiness + 8);
          c.affection = Math.min(100, c.affection + 5);
          c.affectionXp += 10;
          break;
        case 'drink':
          c.hunger = Math.min(100, c.hunger + 12);
          c.energy = Math.min(100, c.energy + 10);
          c.happiness = Math.min(100, c.happiness + 6);
          c.affection = Math.min(100, c.affection + 4);
          c.affectionXp += 6;
          break;
        case 'pet':
          c.happiness = Math.min(100, c.happiness + 18);
          c.affection = Math.min(100, c.affection + 14);
          c.affectionXp += 14;
          break;
        case 'play':
          c.happiness = Math.min(100, c.happiness + 24);
          c.energy = Math.max(10, c.energy - 12);
          c.cleanliness = Math.max(15, c.cleanliness - 5);
          c.affection = Math.min(100, c.affection + 10);
          c.affectionXp += 16;
          starReward = 10;
          break;
        case 'bath':
          c.cleanliness = 100;
          c.happiness = Math.min(100, c.happiness + 10);
          c.affection = Math.min(100, c.affection + 6);
          c.affectionXp += 8;
          break;
        case 'sleep':
          c.energy = Math.min(100, c.energy + 35);
          c.hunger = Math.max(15, c.hunger - 5);
          c.affection = Math.min(100, c.affection + 4);
          c.affectionXp += 6;
          break;
        case 'stretch':
          c.energy = Math.min(100, c.energy + 8);
          c.happiness = Math.min(100, c.happiness + 8);
          c.affectionXp += 4;
          starReward = 3;
          break;
        case 'yawn':
          c.energy = Math.min(100, c.energy + 6);
          c.happiness = Math.min(100, c.happiness + 4);
          starReward = 2;
          break;
        case 'lick_paw':
        case 'groom':
          c.cleanliness = Math.min(100, c.cleanliness + 14);
          c.happiness = Math.min(100, c.happiness + 6);
          c.affectionXp += 4;
          starReward = 3;
          break;
        case 'call':
          c.happiness = Math.min(100, c.happiness + 7);
          c.affection = Math.min(100, c.affection + 6);
          c.affectionXp += 5;
          starReward = 3;
          break;
      }
      c.stage = computeCatStage(c.affectionXp);
      c.personality = computePersonality(c);
      c.lastUpdatedAt = Date.now();
      return { cat: c, starsCurrency: s.starsCurrency + starReward };
    });
    schedulePersist(get);
  },

  unlockCatItem: (item, cost) => {
    const s = get();
    if (s.cat.unlockedItems.includes(item)) return true;
    if (s.starsCurrency < cost) return false;
    set({
      starsCurrency: s.starsCurrency - cost,
      cat: {
        ...s.cat,
        unlockedItems: [...s.cat.unlockedItems, item],
        happiness: Math.min(100, s.cat.happiness + 10),
        affection: Math.min(100, s.cat.affection + 8),
        lastUpdatedAt: Date.now(),
      },
    });
    schedulePersist(get);
    return true;
  },

  tickCatNeeds: () => {
    set((s) => {
      const now = Date.now();
      const hoursElapsed = Math.max(0, (now - s.cat.lastUpdatedAt) / 3600000);
      if (hoursElapsed < 0.015) return s;

      // Gentle, fair decay: ~2.5 pts/hour, capped at max 32 pts drop even after many days!
      const gentleLoss = Math.min(32, hoursElapsed * 2.5);
      const c = {
        ...s.cat,
        hunger: Math.max(28, Math.round(s.cat.hunger - gentleLoss)),
        happiness: Math.max(32, Math.round(s.cat.happiness - gentleLoss * 0.75)),
        energy: Math.max(30, Math.round(s.cat.energy - gentleLoss * 0.6)),
        cleanliness: Math.max(35, Math.round(s.cat.cleanliness - gentleLoss * 0.5)),
        affection: Math.max(40, Math.round(s.cat.affection - gentleLoss * 0.35)),
        lastUpdatedAt: now,
      };
      c.personality = computePersonality(c);
      return { cat: c };
    });
    schedulePersist(get);
  },

  setActiveRoom: (room) => {
    set((s) => ({ home: { ...s.home, activeRoom: room } }));
    schedulePersist(get);
  },

  setHomeStyle: (patch) => {
    set((s) => ({ home: { ...s.home, ...patch } }));
    schedulePersist(get);
  },

  pushHomeUndoSnapshot: () => {
    set((s) => ({
      homeUndoStack: [
        s.home.items.map((item) => ({ ...item, position: [...item.position] as [number, number, number] })),
        ...s.homeUndoStack,
      ].slice(0, 25),
    }));
  },

  undoHomeChange: () => {
    const s = get();
    if (s.homeUndoStack.length === 0) return false;
    const [prevItems, ...rest] = s.homeUndoStack;
    set({
      homeUndoStack: rest,
      home: {
        ...s.home,
        items: prevItems.map((i) => ({ ...i })),
      },
    });
    schedulePersist(get);
    return true;
  },

  placeFurniture: (kind, room, position, color, extra) => {
    const meta = getCatalogMeta(kind);
    const uid = `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const newItem: PlacedFurniture = {
      uid,
      kind,
      room,
      position,
      rotationY: extra?.rotationY ?? 0,
      color,
      scale: extra?.scale ?? meta.defaultScale,
      surface: extra?.surface ?? meta.surface,
      variantSeed: Math.floor(Math.random() * 1000),
      plantSpecies: extra?.plantSpecies,
      potStyle: extra?.potStyle,
      greenhouseSlotIndex: extra?.greenhouseSlotIndex,
    };
    get().pushHomeUndoSnapshot();
    set((s) => ({
      home: { ...s.home, items: [...s.home.items, newItem] },
    }));
    schedulePersist(get);
    return uid;
  },

  updateFurnitureTransform: (uid, patch, recordUndo = false) => {
    if (recordUndo) {
      get().pushHomeUndoSnapshot();
    }
    set((s) => ({
      home: {
        ...s.home,
        items: s.home.items.map((item) => {
          if (item.uid !== uid) return item;
          const nextScale =
            patch.scale !== undefined ? clampScaleForKind(item.kind, patch.scale) : item.scale;
          return {
            ...item,
            ...patch,
            scale: nextScale,
          };
        }),
      },
    }));
    schedulePersist(get);
  },

  moveFurniture: (uid, position) => {
    set((s) => ({
      home: {
        ...s.home,
        items: s.home.items.map((item) => (item.uid === uid ? { ...item, position } : item)),
      },
    }));
    schedulePersist(get);
  },

  rotateFurniture: (uid, deltaRad = Math.PI / 6) => {
    get().pushHomeUndoSnapshot();
    set((s) => ({
      home: {
        ...s.home,
        items: s.home.items.map((item) =>
          item.uid === uid ? { ...item, rotationY: (item.rotationY + deltaRad) % (Math.PI * 2) } : item
        ),
      },
    }));
    schedulePersist(get);
  },

  scaleFurniture: (uid, nextScale) => {
    get().pushHomeUndoSnapshot();
    set((s) => ({
      home: {
        ...s.home,
        items: s.home.items.map((item) =>
          item.uid === uid ? { ...item, scale: clampScaleForKind(item.kind, nextScale) } : item
        ),
      },
    }));
    schedulePersist(get);
  },

  duplicateFurniture: (uid) => {
    const s = get();
    const target = s.home.items.find((i) => i.uid === uid);
    if (!target) return null;
    const meta = getCatalogMeta(target.kind);
    if (!meta.allowMultiple) return null;
    const copyUid = `f-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const copy: PlacedFurniture = {
      ...target,
      uid: copyUid,
      position: [
        Number((target.position[0] + 0.65).toFixed(3)),
        target.position[1],
        Number((target.position[2] + 0.45).toFixed(3)),
      ],
      variantSeed: Math.floor(Math.random() * 1000),
    };
    get().pushHomeUndoSnapshot();
    set({
      home: {
        ...s.home,
        items: [...s.home.items, copy],
      },
    });
    schedulePersist(get);
    return copyUid;
  },

  removeFurniture: (uid) => {
    get().pushHomeUndoSnapshot();
    set((s) => ({
      home: {
        ...s.home,
        items: s.home.items.filter((item) => item.uid !== uid),
      },
    }));
    schedulePersist(get);
  },

  resetHomeLayout: () => {
    get().pushHomeUndoSnapshot();
    set((s) => ({
      home: {
        ...s.home,
        wallColor: DEFAULT_UNIVERSE_STATE.home.wallColor,
        floorMaterial: DEFAULT_UNIVERSE_STATE.home.floorMaterial,
        season: DEFAULT_UNIVERSE_STATE.home.season,
        lightWarmth: DEFAULT_UNIVERSE_STATE.home.lightWarmth,
        items: DEFAULT_HOME_ITEMS.map((i) => ({ ...i })),
      },
    }));
    schedulePersist(get);
  },

  revertLastSavedHome: () => {
    const s = get();
    const target =
      s.home.savedPresets.find((p) => p.id === s.home.activePresetId) ?? s.home.savedPresets[0];
    if (!target) return false;
    get().pushHomeUndoSnapshot();
    set({
      home: {
        ...s.home,
        wallColor: target.wallColor,
        floorMaterial: target.floorMaterial,
        season: target.season,
        lightWarmth: target.lightWarmth,
        timeMode: (target.timeMode as HomeTimeMode | undefined) ?? s.home.timeMode ?? 'day',
        items: target.items.map((i) => ({ ...i })),
        activePresetId: target.id,
      },
    });
    schedulePersist(get);
    return true;
  },

  saveHomePreset: (name) => {
    const trimmed = name.trim() || 'چیدمان دلخواه عمارت';
    set((s) => {
      const preset: HomeDesignPreset = {
        id: `preset-${Date.now()}`,
        name: trimmed,
        wallColor: s.home.wallColor,
        floorMaterial: s.home.floorMaterial,
        season: s.home.season,
        lightWarmth: s.home.lightWarmth,
        timeMode: s.home.timeMode ?? 'day',
        items: s.home.items.map((i) => ({ ...i })),
        savedAt: Date.now(),
      };
      return {
        home: {
          ...s.home,
          savedPresets: [preset, ...s.home.savedPresets].slice(0, 8),
          activePresetId: preset.id,
        },
      };
    });
    schedulePersist(get);
  },

  loadHomePreset: (id) => {
    get().pushHomeUndoSnapshot();
    set((s) => {
      const found = s.home.savedPresets.find((p) => p.id === id);
      if (!found) return s;
      return {
        home: {
          ...s.home,
          wallColor: found.wallColor,
          floorMaterial: found.floorMaterial,
          season: found.season,
          lightWarmth: found.lightWarmth,
          timeMode: (found.timeMode as HomeTimeMode | undefined) ?? s.home.timeMode ?? 'day',
          items: found.items.map((i) => ({ ...i })),
          activePresetId: found.id,
        },
      };
    });
    schedulePersist(get);
  },

  placeGreenhousePlantInHome: (slotIndex, room, position) => {
    const s = get();
    const slot = s.greenhouse.slots.find((sl) => sl.slotIndex === slotIndex);
    if (!slot || !slot.species) return null;
    const potColor = POT_STYLES_INFO.find((p) => p.id === slot.potStyle)?.color ?? '#c46f4a';
    return get().placeFurniture('greenhouse_planter', room, position, potColor, {
      plantSpecies: slot.species,
      potStyle: slot.potStyle,
      greenhouseSlotIndex: slot.slotIndex,
      surface: 'garden',
      scale: 1.05,
    });
  },

  unlockFurnitureKind: (kind, cost) => {
    const s = get();
    if (s.home.unlockedKinds.includes(kind)) return true;
    if (s.starsCurrency < cost) return false;
    set({
      starsCurrency: s.starsCurrency - cost,
      home: {
        ...s.home,
        unlockedKinds: [...s.home.unlockedKinds, kind],
      },
    });
    schedulePersist(get);
    return true;
  },

  addWish: (title, text, category, color) => {
    const angle = (Math.random() - 0.5) * Math.PI * 0.9;
    const radius = 12 + Math.random() * 7;
    const y = 3.5 + Math.random() * 8.5;
    const wish: WishItem = {
      id: `wish-${Date.now()}`,
      title: title.trim(),
      text: text.trim(),
      category,
      color,
      createdAt: Date.now(),
      position: [Math.sin(angle) * radius, y, -Math.cos(angle) * radius],
    };
    set((s) => ({
      wishes: [wish, ...s.wishes],
      starsCurrency: s.starsCurrency + 15,
    }));
    schedulePersist(get);
    return wish;
  },

  removeWish: (id) => {
    set((s) => ({ wishes: s.wishes.filter((w) => w.id !== id) }));
    schedulePersist(get);
  },

  plantSeed: (slotIndex, species) => {
    const now = Date.now();
    set((s) => ({
      greenhouse: {
        ...s.greenhouse,
        slots: s.greenhouse.slots.map((slot) =>
          slot.slotIndex === slotIndex
            ? {
                ...slot,
                species,
                plantedAt: now,
                hydration: 95,
                growthProgress: 12,
                lastWateredAt: now,
              }
            : slot
        ),
      },
    }));
    schedulePersist(get);
  },

  waterPlant: (slotIndex) => {
    const now = Date.now();
    set((s) => ({
      starsCurrency: s.starsCurrency + 6,
      greenhouse: {
        ...s.greenhouse,
        slots: s.greenhouse.slots.map((slot) =>
          slot.slotIndex === slotIndex && slot.species
            ? {
                ...slot,
                hydration: 100,
                growthProgress: Math.min(100, slot.growthProgress + 18),
                lastWateredAt: now,
              }
            : slot
        ),
      },
    }));
    schedulePersist(get);
  },

  changePotStyle: (slotIndex, potStyle) => {
    set((s) => ({
      greenhouse: {
        ...s.greenhouse,
        slots: s.greenhouse.slots.map((slot) =>
          slot.slotIndex === slotIndex ? { ...slot, potStyle } : slot
        ),
      },
    }));
    schedulePersist(get);
  },

  clearPlantSlot: (slotIndex) => {
    set((s) => ({
      greenhouse: {
        ...s.greenhouse,
        slots: s.greenhouse.slots.map((slot) =>
          slot.slotIndex === slotIndex
            ? { ...slot, species: null, growthProgress: 0, plantedAt: 0 }
            : slot
        ),
      },
    }));
    schedulePersist(get);
  },

  setGreenhouseTheme: (theme) => {
    set((s) => ({ greenhouse: { ...s.greenhouse, theme } }));
    schedulePersist(get);
  },

  tickGreenhouseGrowth: () => {
    const now = Date.now();
    set((s) => ({
      greenhouse: {
        ...s.greenhouse,
        slots: s.greenhouse.slots.map((slot) => {
          if (!slot.species) return slot;
          const minsSinceWater = Math.max(0, (now - slot.lastWateredAt) / 60000);
          const hydration = Math.max(20, Math.round(100 - minsSinceWater * 1.4));
          const ageMins = Math.max(0, (now - slot.plantedAt) / 60000);
          const passiveGrowth = Math.min(100, slot.growthProgress + Math.min(1.5, ageMins * 0.03));
          return {
            ...slot,
            hydration,
            growthProgress: Math.max(slot.growthProgress, Math.round(passiveGrowth)),
          };
        }),
      },
    }));
  },

  addFish: (species, name) => {
    const fish: AquariumFish = {
      id: `fish-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      species,
      name: name.trim() || 'ماهی کوچولو',
      size: 0.9 + Math.random() * 0.3,
    };
    set((s) => ({
      aquarium: { ...s.aquarium, fish: [...s.aquarium.fish, fish] },
      starsCurrency: s.starsCurrency + 5,
    }));
    schedulePersist(get);
  },

  removeFish: (id) => {
    set((s) => ({
      aquarium: { ...s.aquarium, fish: s.aquarium.fish.filter((f) => f.id !== id) },
    }));
    schedulePersist(get);
  },

  addAquariumDecor: (kind, position) => {
    const dec: AquariumDecor = {
      id: `dec-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      kind,
      position,
      rotationY: Math.random() * Math.PI * 2,
      scale: 0.95 + Math.random() * 0.25,
    };
    set((s) => ({
      aquarium: { ...s.aquarium, decor: [...s.aquarium.decor, dec] },
    }));
    schedulePersist(get);
  },

  moveAquariumDecor: (id, position) => {
    set((s) => ({
      aquarium: {
        ...s.aquarium,
        decor: s.aquarium.decor.map((d) => (d.id === id ? { ...d, position } : d)),
      },
    }));
    schedulePersist(get);
  },

  removeAquariumDecor: (id) => {
    set((s) => ({
      aquarium: { ...s.aquarium, decor: s.aquarium.decor.filter((d) => d.id !== id) },
    }));
    schedulePersist(get);
  },

  cleanAquarium: () => {
    set((s) => ({
      aquarium: { ...s.aquarium, waterClarity: 100 },
      starsCurrency: s.starsCurrency + 8,
    }));
    schedulePersist(get);
  },

  setAquariumLight: (lightMode) => {
    set((s) => ({ aquarium: { ...s.aquarium, lightMode } }));
    schedulePersist(get);
  },

  setAudioSettings: (patch) => {
    set((s) => ({ audio: { ...s.audio, ...patch } }));
    schedulePersist(get);
  },

  setEnvironmentSettings: (patch) => {
    set((s) => ({ environment: { ...s.environment, ...patch } }));
    schedulePersist(get);
  },
}));

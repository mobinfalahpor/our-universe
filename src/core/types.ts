export type WorldId =
  | 'island'
  | 'museum'
  | 'music'
  | 'cat'
  | 'home'
  | 'wishes'
  | 'greenhouse'
  | 'cafe'
  | 'aquarium'
  | 'observatory';

export interface WorldMeta {
  id: Exclude<WorldId, 'island'>;
  title: string;
  subtitle: string;
  accentColor: string;
  islandPosition: [number, number, number];
}

export type CatBreed = 'honey' | 'snow' | 'mist' | 'calico' | 'midnight';
export type CatAccessory = 'none' | 'rose_bow' | 'gold_crown' | 'lavender_scarf' | 'round_glasses' | 'bell_collar';
export type CatStage = 'kitten' | 'young' | 'adult';
export type CatMood = 'happy' | 'sleepy' | 'hungry' | 'playful' | 'clean_needed';
export type CatEmotion = 'happy' | 'sleepy' | 'curious' | 'affectionate' | 'excited' | 'stubborn';
export type CatToyItemId = 'yarn_ball' | 'toy_mouse' | 'velvet_cushion' | 'gold_bowl' | 'play_tower';

export interface CatState {
  adopted: boolean;
  name: string;
  breed: CatBreed;
  customFurColor?: string;
  catOrangeMigrated?: boolean;
  accessory: CatAccessory;
  hunger: number;      // 0 - 100 (100 = full)
  happiness: number;   // 0 - 100
  energy: number;      // 0 - 100
  cleanliness: number; // 0 - 100
  affection: number;   // 0 - 100 (محبت)
  affectionXp: number; // Determines growth stage
  stage: CatStage;
  personality: string;
  unlockedItems: CatToyItemId[];
  lastUpdatedAt: number;
}

export type RoomType =
  | 'courtyard'
  | 'eyvan'
  | 'hall'
  | 'living'
  | 'bedroom'
  | 'library'
  | 'kitchen'
  | 'cat_room'
  | 'bathroom';

export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';
export type FloorMaterialId = 'oak' | 'cream_tile' | 'marble' | 'walnut';
export type HomeTimeMode = 'day' | 'sunset' | 'night';
export type SurfaceKind = 'floor' | 'rug' | 'table' | 'wall' | 'garden';

export type FurnitureKind =
  | 'sofa'
  | 'persian_sofa'
  | 'royal_chair'
  | 'armchair'
  | 'bed'
  | 'coffee_table'
  | 'dining_table'
  | 'desk'
  | 'nightstand'
  | 'vanity'
  | 'bookshelf'
  | 'kitchen_counter'
  | 'bathtub'
  | 'curtain'
  | 'rug_round'
  | 'persian_carpet_large'
  | 'persian_carpet_runner'
  | 'bolster_set'
  | 'samovar_set'
  | 'lamp_floor'
  | 'table_lamp'
  | 'chandelier'
  | 'wall_sconce'
  | 'courtyard_lantern'
  | 'courtyard_bench'
  | 'turquoise_vase'
  | 'brass_candlestick'
  | 'persian_painting'
  | 'wall_mirror'
  | 'copper_vessel'
  | 'plant_monstera'
  | 'plant_fern'
  | 'flower_pot_clay'
  | 'flower_pot_turquoise'
  | 'greenhouse_planter'
  | 'tree_pomegranate'
  | 'tree_orange'
  | 'tree_cypress'
  | 'cat_basket'
  | 'cat_tower'
  | 'cat_bowls'
  | 'cat_toy';

export interface PlacedFurniture {
  uid: string;
  kind: FurnitureKind;
  room: RoomType;
  position: [number, number, number];
  rotationY: number;
  color: string;
  scale?: number;
  surface?: SurfaceKind;
  variantSeed?: number;
  plantSpecies?: PlantSpecies;
  potStyle?: PotStyle;
  greenhouseSlotIndex?: number;
}

export interface HomeDesignPreset {
  id: string;
  name: string;
  wallColor: string;
  floorMaterial: FloorMaterialId;
  season: SeasonType;
  lightWarmth: number; // 0 - 1
  timeMode?: HomeTimeMode;
  items: PlacedFurniture[];
  savedAt: number;
}

export interface HomeState {
  activeRoom: RoomType;
  wallColor: string;
  floorMaterial: FloorMaterialId;
  season: SeasonType;
  lightWarmth: number;
  timeMode?: HomeTimeMode;
  snapToGrid?: boolean;
  mansionMigrated?: boolean;
  unlockedKinds: FurnitureKind[];
  items: PlacedFurniture[];
  savedPresets: HomeDesignPreset[];
  activePresetId: string | null;
}

export type WishCategory =
  | 'love'
  | 'travel'
  | 'dreams'
  | 'peace'
  | 'moments';

export type StarColorHex = '#D6B875' | '#D9A9C5' | '#7771A8' | '#F1DCCB' | '#A6BBAA';

export interface WishItem {
  id: string;
  title: string;
  text: string;
  category: WishCategory;
  color: StarColorHex;
  createdAt: number;
  position: [number, number, number];
}

export type PlantSpecies =
  | 'dream_rose'
  | 'moon_lavender'
  | 'crystal_lotus'
  | 'golden_sun'
  | 'night_orchid'
  | 'star_cactus';

export type PotStyle = 'terracotta' | 'rose_ceramic' | 'gold_trimmed' | 'mossy_stone';

export interface PlantSlot {
  slotIndex: number;
  species: PlantSpecies | null;
  potStyle: PotStyle;
  plantedAt: number;
  hydration: number;
  growthProgress: number;
  lastWateredAt: number;
}

export interface GreenhouseState {
  slots: PlantSlot[];
  theme: 'sunny' | 'misty' | 'firefly';
}

export type FishSpecies = 'clown' | 'angelfish' | 'betta' | 'neon' | 'turtle';
export type AquariumDecorKind = 'coral_pink' | 'coral_lavender' | 'sea_rock' | 'shell_pearl' | 'kelp_clump';

export interface AquariumFish {
  id: string;
  species: FishSpecies;
  name: string;
  size: number;
}

export interface AquariumDecor {
  id: string;
  kind: AquariumDecorKind;
  position: [number, number, number];
  rotationY: number;
  scale: number;
}

export interface AquariumState {
  fish: AquariumFish[];
  decor: AquariumDecor[];
  waterClarity: number;
  lightMode: 'lagoon' | 'deep_moon' | 'coral_glow';
}

export interface AudioSettings {
  muted: boolean;
  volume: number;
  activeTrackId: string;
  ambientMode: 'none' | 'rain' | 'cafe' | 'night';
}

export type GraphicsQuality = 'auto' | 'high' | 'medium' | 'low';

export interface EnvironmentSettings {
  quality: GraphicsQuality;
  reducedMotion: boolean;
  timeOfDay: 'twilight' | 'day' | 'night';
  cafeTheme: 'cream_classic' | 'rose_romantic' | 'starry_night';
  cafeWeather: 'sunny' | 'rainy' | 'snowy';
  cafeTime: 'morning' | 'sunset' | 'night';
}

export interface UniversePersistedState {
  hasEntered: boolean;
  starsCurrency: number;
  cat: CatState;
  home: HomeState;
  wishes: WishItem[];
  greenhouse: GreenhouseState;
  aquarium: AquariumState;
  audio: AudioSettings;
  environment: EnvironmentSettings;
}

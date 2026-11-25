import type {
  FurnitureKind,
  PlacedFurniture,
  RoomType,
  SurfaceKind,
} from '../../core/types';

export type CatalogCategoryId =
  | 'furniture'
  | 'carpets'
  | 'lighting'
  | 'plants'
  | 'decor'
  | 'art'
  | 'bedroom'
  | 'kitchen'
  | 'cat'
  | 'courtyard'
  | 'greenhouse';

export interface CatalogCategoryMeta {
  id: CatalogCategoryId;
  label: string;
}

export const CATALOG_CATEGORIES: CatalogCategoryMeta[] = [
  { id: 'furniture', label: 'مبلمان' },
  { id: 'carpets', label: 'فرش و قالیچه' },
  { id: 'lighting', label: 'روشنایی' },
  { id: 'plants', label: 'گلدان و گل' },
  { id: 'greenhouse', label: 'گل‌های گلخانه' },
  { id: 'decor', label: 'وسایل تزئینی' },
  { id: 'art', label: 'آثار هنری' },
  { id: 'bedroom', label: 'وسایل اتاق خواب' },
  { id: 'kitchen', label: 'وسایل آشپزخانه' },
  { id: 'cat', label: 'وسایل گربه' },
  { id: 'courtyard', label: 'وسایل حیاط' },
];

export interface MansionZoneMeta {
  id: Exclude<RoomType, 'bathroom'>;
  label: string;
  subtitle: string;
  floorY: number;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  cameraPos: [number, number, number];
  cameraTarget: [number, number, number];
  isInterior: boolean;
}

export const MANSION_ZONES: MansionZoneMeta[] = [
  {
    id: 'courtyard',
    label: 'حیاط مرکزی و حوض',
    subtitle: 'قلب باغ ایرانی با حوض فیروزه‌ای و درختان انار و نارنج',
    floorY: 0,
    minX: -7.1,
    maxX: 7.1,
    minZ: -6.1,
    maxZ: 6.1,
    cameraPos: [0, 8.8, 12.6],
    cameraTarget: [0, 0.8, -1.2],
    isInterior: false,
  },
  {
    id: 'eyvan',
    label: 'ایوان ستوندار',
    subtitle: 'ایوان باشکوه مشرف به حوض و باغچه‌ها',
    floorY: 0.24,
    minX: -5.4,
    maxX: 5.4,
    minZ: -9.3,
    maxZ: -6.7,
    cameraPos: [0, 2.3, -2.5],
    cameraTarget: [0, 1.35, -8.3],
    isInterior: false,
  },
  {
    id: 'hall',
    label: 'تالار آینه و پذیرایی',
    subtitle: 'سالن اصلی با آینه‌کاری، گچ‌بری، ارسی و فرش تبریز',
    floorY: 0.24,
    minX: -7.1,
    maxX: 7.1,
    minZ: -15.8,
    maxZ: -9.9,
    cameraPos: [0, 2.35, -10.5],
    cameraTarget: [0, 1.35, -14.8],
    isInterior: true,
  },
  {
    id: 'living',
    label: 'اتاق نشیمن',
    subtitle: 'نشیمن دنج و گرم مشرف به حیاط',
    floorY: 0.24,
    minX: 7.8,
    maxX: 13.1,
    minZ: -13.1,
    maxZ: -6.8,
    cameraPos: [8.4, 2.15, -7.2],
    cameraTarget: [11.2, 1.05, -10.8],
    isInterior: true,
  },
  {
    id: 'library',
    label: 'کتابخانه',
    subtitle: 'قفسه‌های چوبی کتاب، میز تحریر و نور آرامش‌بخش',
    floorY: 0.24,
    minX: 7.8,
    maxX: 13.1,
    minZ: -6.2,
    maxZ: -0.3,
    cameraPos: [8.4, 2.1, -0.8],
    cameraTarget: [11.2, 1.1, -3.9],
    isInterior: true,
  },
  {
    id: 'bedroom',
    label: 'اتاق خواب',
    subtitle: 'تخت منبت‌کاری‌شده، قالی کاشان و پنجره رو به باغ',
    floorY: 0.24,
    minX: 7.8,
    maxX: 13.1,
    minZ: 0.3,
    maxZ: 6.1,
    cameraPos: [8.4, 2.1, 5.5],
    cameraTarget: [11.1, 1.05, 2.5],
    isInterior: true,
  },
  {
    id: 'kitchen',
    label: 'آشپزخانه سنتی',
    subtitle: 'کابینت چوبی، ظروف مسی و سفالی و میز ناهارخوری',
    floorY: 0.24,
    minX: -13.1,
    maxX: -7.8,
    minZ: -13.1,
    maxZ: -5.8,
    cameraPos: [-8.4, 2.15, -6.3],
    cameraTarget: [-11.2, 1.05, -10.3],
    isInterior: true,
  },
  {
    id: 'cat_room',
    label: 'اتاق گربه',
    subtitle: 'گوشه‌ای آفتابی و دنج برای استراحت و بازی نارنگی',
    floorY: 0.24,
    minX: -13.1,
    maxX: -7.8,
    minZ: -5.2,
    maxZ: 1.5,
    cameraPos: [-8.3, 1.85, 1.0],
    cameraTarget: [-11.0, 0.85, -2.5],
    isInterior: true,
  },
];

export interface CameraPresetMeta {
  id: string;
  label: string;
  zone?: Exclude<RoomType, 'bathroom'>;
  position: [number, number, number];
  target: [number, number, number];
  cutawayRecommended?: boolean;
}

export const MANSION_CAMERA_PRESETS: CameraPresetMeta[] = [
  {
    id: 'overview_courtyard',
    label: 'نمای کلی حیاط و حوض',
    zone: 'courtyard',
    position: [0.6, 8.9, 13.4],
    target: [0, 0.9, -1.6],
  },
  {
    id: 'eyvan',
    label: 'نمای ایوان',
    zone: 'eyvan',
    position: [0.3, 2.35, -2.2],
    target: [0, 1.45, -8.5],
  },
  {
    id: 'hall',
    label: 'نمای سالن اصلی',
    zone: 'hall',
    position: [0, 2.4, -10.4],
    target: [0, 1.35, -14.8],
  },
  {
    id: 'carpets_sofa',
    label: 'نمای فرش و مبلمان',
    zone: 'hall',
    position: [3.1, 2.25, -11.1],
    target: [-0.2, 0.75, -13.3],
  },
  {
    id: 'gardens',
    label: 'نمای باغچه‌ها',
    zone: 'courtyard',
    position: [-5.8, 3.3, 5.4],
    target: [-2.2, 0.8, -1.5],
  },
  {
    id: 'living',
    label: 'اتاق نشیمن',
    zone: 'living',
    position: [8.4, 2.15, -7.2],
    target: [11.2, 1.05, -10.8],
  },
  {
    id: 'bedroom',
    label: 'نمای اتاق خواب',
    zone: 'bedroom',
    position: [8.4, 2.1, 5.5],
    target: [11.1, 1.05, 2.5],
  },
  {
    id: 'library',
    label: 'کتابخانه',
    zone: 'library',
    position: [8.4, 2.1, -0.8],
    target: [11.2, 1.1, -3.9],
  },
  {
    id: 'kitchen',
    label: 'آشپزخانه',
    zone: 'kitchen',
    position: [-8.4, 2.15, -6.3],
    target: [-11.2, 1.05, -10.3],
  },
  {
    id: 'cat_room',
    label: 'اتاق گربه',
    zone: 'cat_room',
    position: [-8.3, 1.85, 1.0],
    target: [-11.0, 0.85, -2.5],
  },
  {
    id: 'architect_top',
    label: 'نمای کل‌نگر عمارت',
    position: [0, 21.5, 16.5],
    target: [0, 0.3, -3.5],
    cutawayRecommended: true,
  },
];

export interface CatalogItemMeta {
  kind: FurnitureKind;
  label: string;
  category: CatalogCategoryId;
  surface: SurfaceKind;
  radius: number;
  defaultColor: string;
  colorOptions: { label: string; hex: string }[];
  minScale: number;
  maxScale: number;
  defaultScale: number;
  supportHeight?: number;
  supportRadius?: number;
  allowMultiple: boolean;
  cost: number;
  wallHeight?: number;
}

export const MANSION_CATALOG: CatalogItemMeta[] = [
  // مبلمان
  {
    kind: 'persian_sofa',
    label: 'مبل سلطنتی ایرانی',
    category: 'furniture',
    surface: 'floor',
    radius: 1.05,
    defaultColor: '#7a2232',
    colorOptions: [
      { label: 'زرشکی اناری', hex: '#7a2232' },
      { label: 'لاجوردی', hex: '#1c355e' },
      { label: 'زمردی', hex: '#235c4b' },
      { label: 'عاجی طلایی', hex: '#d8c5a8' },
    ],
    minScale: 0.78,
    maxScale: 1.35,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'sofa',
    label: 'کاناپه دنج کلاسیک',
    category: 'furniture',
    surface: 'floor',
    radius: 1.0,
    defaultColor: '#8d5b4c',
    colorOptions: [
      { label: 'کرم مخمل', hex: '#d7c3ae' },
      { label: 'سبز زیتونی', hex: '#4f6d58' },
      { label: 'لاجوردی', hex: '#243c66' },
      { label: 'رز پودری', hex: '#b36b7e' },
    ],
    minScale: 0.78,
    maxScale: 1.35,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'royal_chair',
    label: 'صندلی منبت‌کاری چوبی',
    category: 'furniture',
    surface: 'floor',
    radius: 0.56,
    defaultColor: '#8f2c3c',
    colorOptions: [
      { label: 'زرشکی', hex: '#8f2c3c' },
      { label: 'فیروزه‌ای', hex: '#287e85' },
      { label: 'طلایی مات', hex: '#b8944c' },
    ],
    minScale: 0.75,
    maxScale: 1.35,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'armchair',
    label: 'مبل تک‌نفره راحتی',
    category: 'furniture',
    surface: 'floor',
    radius: 0.62,
    defaultColor: '#256c70',
    colorOptions: [
      { label: 'فیروزه‌ای تیره', hex: '#256c70' },
      { label: 'کرم', hex: '#decab2' },
      { label: 'عنابی', hex: '#7c2530' },
    ],
    minScale: 0.78,
    maxScale: 1.35,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'coffee_table',
    label: 'میز پذیرایی گردویی',
    category: 'furniture',
    surface: 'floor',
    radius: 0.72,
    defaultColor: '#5c3824',
    colorOptions: [
      { label: 'گردویی تیره', hex: '#5c3824' },
      { label: 'ماهگونی', hex: '#6e2d24' },
      { label: 'عاجی طلاکوب', hex: '#dfd0b8' },
    ],
    minScale: 0.75,
    maxScale: 1.4,
    defaultScale: 1,
    supportHeight: 0.46,
    supportRadius: 0.65,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'bookshelf',
    label: 'قفسه کتاب چوبی',
    category: 'furniture',
    surface: 'floor',
    radius: 0.75,
    defaultColor: '#5c3824',
    colorOptions: [
      { label: 'گردویی اصیل', hex: '#5c3824' },
      { label: 'بلوط گرم', hex: '#85583a' },
    ],
    minScale: 0.8,
    maxScale: 1.35,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'desk',
    label: 'میز تحریر مطالعه',
    category: 'furniture',
    surface: 'floor',
    radius: 0.78,
    defaultColor: '#5a3723',
    colorOptions: [
      { label: 'گردویی', hex: '#5a3723' },
      { label: 'ماهگونی', hex: '#6d3025' },
    ],
    minScale: 0.8,
    maxScale: 1.3,
    defaultScale: 1,
    supportHeight: 0.77,
    supportRadius: 0.65,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'bolster_set',
    label: 'شاه‌نشین و پشتی سنتی',
    category: 'furniture',
    surface: 'floor',
    radius: 0.88,
    defaultColor: '#8d202f',
    colorOptions: [
      { label: 'لاکی ترمه', hex: '#8d202f' },
      { label: 'لاجوردی ترمه', hex: '#1c325e' },
      { label: 'فیروزه‌ای', hex: '#287a7e' },
    ],
    minScale: 0.78,
    maxScale: 1.35,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },

  // فرش و قالیچه
  {
    kind: 'persian_carpet_large',
    label: 'فرش دست‌بافت تبریز (بزرگ)',
    category: 'carpets',
    surface: 'rug',
    radius: 1.65,
    defaultColor: '#8a1e2b',
    colorOptions: [
      { label: 'لاکی اناری', hex: '#8a1e2b' },
      { label: 'لاجوردی اصیل', hex: '#1b2c54' },
      { label: 'کرم شاه‌عباسی', hex: '#dfd1b6' },
      { label: 'فیروزه‌ای کاشان', hex: '#22696c' },
    ],
    minScale: 0.7,
    maxScale: 1.5,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'persian_carpet_runner',
    label: 'قالیچه و کناره دست‌بافت',
    category: 'carpets',
    surface: 'rug',
    radius: 1.0,
    defaultColor: '#1b2c54',
    colorOptions: [
      { label: 'لاجوردی', hex: '#1b2c54' },
      { label: 'لاکی', hex: '#8a1e2b' },
      { label: 'زیتونی', hex: '#385745' },
    ],
    minScale: 0.7,
    maxScale: 1.5,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'rug_round',
    label: 'قالیچه گرد ابریشمی',
    category: 'carpets',
    surface: 'rug',
    radius: 1.05,
    defaultColor: '#c9a66b',
    colorOptions: [
      { label: 'طلایی کرم', hex: '#c9a66b' },
      { label: 'فیروزه‌ای', hex: '#2b8685' },
      { label: 'زرشکی', hex: '#8d2433' },
    ],
    minScale: 0.7,
    maxScale: 1.5,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },

  // روشنایی
  {
    kind: 'lamp_floor',
    label: 'آباژور ایستاده برنجی',
    category: 'lighting',
    surface: 'floor',
    radius: 0.36,
    defaultColor: '#d4a84f',
    colorOptions: [
      { label: 'طلایی برنجی', hex: '#d4a84f' },
      { label: 'مسی آنتیک', hex: '#b86843' },
    ],
    minScale: 0.75,
    maxScale: 1.4,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'table_lamp',
    label: 'چراغ رومیزی کلاسیک',
    category: 'lighting',
    surface: 'table',
    radius: 0.22,
    defaultColor: '#2a6f59',
    colorOptions: [
      { label: 'شیشه سبز زمردی', hex: '#2a6f59' },
      { label: 'طلایی عاجی', hex: '#e7cf9e' },
      { label: 'فیروزه‌ای', hex: '#2d8c91' },
    ],
    minScale: 0.72,
    maxScale: 1.45,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'wall_sconce',
    label: 'چراغ دیواری فانوسی',
    category: 'lighting',
    surface: 'wall',
    radius: 0.25,
    defaultColor: '#d4a84f',
    colorOptions: [
      { label: 'برنجی', hex: '#d4a84f' },
      { label: 'آهنی مشکی', hex: '#2f323b' },
    ],
    minScale: 0.75,
    maxScale: 1.4,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
    wallHeight: 2.05,
  },
  {
    kind: 'courtyard_lantern',
    label: 'فانوس سنتی حیاط',
    category: 'lighting',
    surface: 'floor',
    radius: 0.35,
    defaultColor: '#2f323a',
    colorOptions: [
      { label: 'فلزی آنتیک', hex: '#2f323a' },
      { label: 'برنجی طلایی', hex: '#c89b44' },
    ],
    minScale: 0.75,
    maxScale: 1.45,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },

  // گلدان و گل
  {
    kind: 'flower_pot_clay',
    label: 'گلدان سفالی پرگل',
    category: 'plants',
    surface: 'garden',
    radius: 0.38,
    defaultColor: '#c26d48',
    colorOptions: [
      { label: 'سفال سرخ', hex: '#c26d48' },
      { label: 'سفال خاکی', hex: '#ab7452' },
    ],
    minScale: 0.68,
    maxScale: 1.55,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'flower_pot_turquoise',
    label: 'گلدان لعابی فیروزه‌ای',
    category: 'plants',
    surface: 'garden',
    radius: 0.38,
    defaultColor: '#247f86',
    colorOptions: [
      { label: 'فیروزه‌ای اصفهان', hex: '#247f86' },
      { label: 'لاجوردی لعاب‌دار', hex: '#1c3b6e' },
    ],
    minScale: 0.68,
    maxScale: 1.55,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'plant_monstera',
    label: 'گلدان برگ‌انجیری',
    category: 'plants',
    surface: 'floor',
    radius: 0.44,
    defaultColor: '#3f7652',
    colorOptions: [
      { label: 'سبز جنگلی', hex: '#3f7652' },
      { label: 'سبز زیتونی', hex: '#5b7a4f' },
    ],
    minScale: 0.7,
    maxScale: 1.5,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'plant_fern',
    label: 'گلدان سرخس و شمعدانی',
    category: 'plants',
    surface: 'floor',
    radius: 0.4,
    defaultColor: '#4c825a',
    colorOptions: [
      { label: 'سبز روشن', hex: '#4c825a' },
      { label: 'سبز تیره', hex: '#336143' },
    ],
    minScale: 0.7,
    maxScale: 1.5,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'greenhouse_planter',
    label: 'گل انتقالی از گلخانه',
    category: 'greenhouse',
    surface: 'garden',
    radius: 0.38,
    defaultColor: '#D9A9C5',
    colorOptions: [{ label: 'رنگ طبیعی گل', hex: '#D9A9C5' }],
    minScale: 0.72,
    maxScale: 1.5,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },

  // وسایل تزئینی
  {
    kind: 'turquoise_vase',
    label: 'گلدان میناکاری و فیروزه‌کوب',
    category: 'decor',
    surface: 'table',
    radius: 0.24,
    defaultColor: '#1f7c86',
    colorOptions: [
      { label: 'فیروزه‌ای', hex: '#1f7c86' },
      { label: 'لاجوردی طلاکوب', hex: '#1b3564' },
    ],
    minScale: 0.68,
    maxScale: 1.55,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'brass_candlestick',
    label: 'شمعدان لاله و برنجی',
    category: 'decor',
    surface: 'table',
    radius: 0.18,
    defaultColor: '#d4a84f',
    colorOptions: [
      { label: 'برنجی طلایی', hex: '#d4a84f' },
      { label: 'نقره‌کوب', hex: '#c7ccd4' },
    ],
    minScale: 0.7,
    maxScale: 1.5,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'samovar_set',
    label: 'سماور ذغالی و سینی چای',
    category: 'decor',
    surface: 'table',
    radius: 0.28,
    defaultColor: '#cfa146',
    colorOptions: [
      { label: 'برنجی طلایی', hex: '#cfa146' },
      { label: 'مسی سرخ', hex: '#b96441' },
    ],
    minScale: 0.75,
    maxScale: 1.35,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'curtain',
    label: 'پرده مخمل بلند',
    category: 'decor',
    surface: 'wall',
    radius: 0.5,
    defaultColor: '#7a2533',
    colorOptions: [
      { label: 'زرشکی مخمل', hex: '#7a2533' },
      { label: 'عاجی ابریشم', hex: '#e8dcc6' },
      { label: 'فیروزه‌ای تیره', hex: '#215e63' },
    ],
    minScale: 0.8,
    maxScale: 1.3,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
    wallHeight: 0.24,
  },

  // آثار هنری
  {
    kind: 'persian_painting',
    label: 'تابلو نگارگری ایرانی',
    category: 'art',
    surface: 'wall',
    radius: 0.45,
    defaultColor: '#c99b42',
    colorOptions: [
      { label: 'قاب طلایی منبت', hex: '#c99b42' },
      { label: 'قاب گردویی', hex: '#593723' },
    ],
    minScale: 0.75,
    maxScale: 1.5,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
    wallHeight: 1.95,
  },
  {
    kind: 'wall_mirror',
    label: 'آینه قدی و قاب منبت',
    category: 'art',
    surface: 'wall',
    radius: 0.45,
    defaultColor: '#d4a84f',
    colorOptions: [
      { label: 'طلایی عتیقه', hex: '#d4a84f' },
      { label: 'نقره‌ای', hex: '#cfd4dc' },
    ],
    minScale: 0.75,
    maxScale: 1.4,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
    wallHeight: 1.75,
  },

  // وسایل اتاق خواب
  {
    kind: 'bed',
    label: 'تخت خواب دو نفره منبت',
    category: 'bedroom',
    surface: 'floor',
    radius: 1.25,
    defaultColor: '#1f365c',
    colorOptions: [
      { label: 'لاجوردی ابریشم', hex: '#1f365c' },
      { label: 'کرم عاجی', hex: '#e6d8c3' },
      { label: 'زرشکی ترمه', hex: '#7d2433' },
    ],
    minScale: 0.85,
    maxScale: 1.25,
    defaultScale: 1,
    allowMultiple: false,
    cost: 0,
  },
  {
    kind: 'nightstand',
    label: 'پاتختی گردویی',
    category: 'bedroom',
    surface: 'floor',
    radius: 0.42,
    defaultColor: '#5c3824',
    colorOptions: [
      { label: 'گردویی', hex: '#5c3824' },
      { label: 'عاجی', hex: '#dfd0b8' },
    ],
    minScale: 0.78,
    maxScale: 1.3,
    defaultScale: 1,
    supportHeight: 0.56,
    supportRadius: 0.36,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'vanity',
    label: 'میز آرایش و آینه',
    category: 'bedroom',
    surface: 'floor',
    radius: 0.65,
    defaultColor: '#66402a',
    colorOptions: [
      { label: 'چوب گردو', hex: '#66402a' },
      { label: 'سفید استخوانی', hex: '#ebe0cf' },
    ],
    minScale: 0.8,
    maxScale: 1.3,
    defaultScale: 1,
    supportHeight: 0.78,
    supportRadius: 0.55,
    allowMultiple: true,
    cost: 0,
  },

  // وسایل آشپزخانه
  {
    kind: 'kitchen_counter',
    label: 'پیشخوان و کابینت چوبی',
    category: 'kitchen',
    surface: 'floor',
    radius: 1.15,
    defaultColor: '#6b432b',
    colorOptions: [
      { label: 'چوب و کاشی فیروزه', hex: '#6b432b' },
      { label: 'چوب و سنگ عاجی', hex: '#7d5438' },
    ],
    minScale: 0.85,
    maxScale: 1.25,
    defaultScale: 1,
    supportHeight: 0.9,
    supportRadius: 0.9,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'dining_table',
    label: 'میز ناهارخوری چوبی',
    category: 'kitchen',
    surface: 'floor',
    radius: 1.0,
    defaultColor: '#603b25',
    colorOptions: [
      { label: 'گردویی', hex: '#603b25' },
      { label: 'بلوط گرم', hex: '#885c3d' },
    ],
    minScale: 0.8,
    maxScale: 1.35,
    defaultScale: 1,
    supportHeight: 0.78,
    supportRadius: 0.85,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'copper_vessel',
    label: 'ظروف مسی و سفالی اصیل',
    category: 'kitchen',
    surface: 'table',
    radius: 0.24,
    defaultColor: '#b96441',
    colorOptions: [
      { label: 'مس قلم‌زنی', hex: '#b96441' },
      { label: 'سفال فیروزه‌ای', hex: '#237a82' },
    ],
    minScale: 0.7,
    maxScale: 1.5,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },

  // وسایل گربه
  {
    kind: 'cat_basket',
    label: 'سبد و تشک خواب گربه',
    category: 'cat',
    surface: 'floor',
    radius: 0.48,
    defaultColor: '#8d2433',
    colorOptions: [
      { label: 'مخمل زرشکی', hex: '#8d2433' },
      { label: 'فیروزه‌ای نرم', hex: '#287d83' },
      { label: 'کرم پشمی', hex: '#e5d4bc' },
    ],
    minScale: 0.78,
    maxScale: 1.45,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'cat_tower',
    label: 'برج بازی گربه',
    category: 'cat',
    surface: 'floor',
    radius: 0.5,
    defaultColor: '#c49e76',
    colorOptions: [
      { label: 'کنفی و کرم', hex: '#c49e76' },
      { label: 'چوب گردو و مخمل', hex: '#7a4d34' },
    ],
    minScale: 0.8,
    maxScale: 1.35,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'cat_bowls',
    label: 'ظرف آب و غذای گربه',
    category: 'cat',
    surface: 'floor',
    radius: 0.3,
    defaultColor: '#257d85',
    colorOptions: [
      { label: 'سرامیک فیروزه‌ای', hex: '#257d85' },
      { label: 'طلایی', hex: '#cfa146' },
    ],
    minScale: 0.75,
    maxScale: 1.4,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'cat_toy',
    label: 'کلاف کاموا و موش بازی',
    category: 'cat',
    surface: 'floor',
    radius: 0.28,
    defaultColor: '#d97f36',
    colorOptions: [
      { label: 'نارنجی گرم', hex: '#d97f36' },
      { label: 'فیروزه‌ای', hex: '#2d898e' },
      { label: 'زرشکی', hex: '#942838' },
    ],
    minScale: 0.75,
    maxScale: 1.5,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },

  // وسایل حیاط
  {
    kind: 'courtyard_bench',
    label: 'تخت و نیمکت چوبی حیاط',
    category: 'courtyard',
    surface: 'floor',
    radius: 0.95,
    defaultColor: '#694028',
    colorOptions: [
      { label: 'چوب گردو با فرش', hex: '#694028' },
      { label: 'چوب بلوط', hex: '#8b5b3c' },
    ],
    minScale: 0.8,
    maxScale: 1.35,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'tree_pomegranate',
    label: 'درختچه انار پربار',
    category: 'courtyard',
    surface: 'garden',
    radius: 0.72,
    defaultColor: '#b5282c',
    colorOptions: [{ label: 'انار سرخ', hex: '#b5282c' }],
    minScale: 0.72,
    maxScale: 1.45,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'tree_orange',
    label: 'درخت نارنج بهارنارنج',
    category: 'courtyard',
    surface: 'garden',
    radius: 0.75,
    defaultColor: '#e07b1f',
    colorOptions: [{ label: 'نارنج تازه', hex: '#e07b1f' }],
    minScale: 0.72,
    maxScale: 1.45,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },
  {
    kind: 'tree_cypress',
    label: 'سرو بلند باغ ایرانی',
    category: 'courtyard',
    surface: 'garden',
    radius: 0.65,
    defaultColor: '#254a36',
    colorOptions: [{ label: 'سبز سرو', hex: '#254a36' }],
    minScale: 0.75,
    maxScale: 1.45,
    defaultScale: 1,
    allowMultiple: true,
    cost: 0,
  },
];

export const CATALOG_BY_KIND: Record<FurnitureKind, CatalogItemMeta> = MANSION_CATALOG.reduce(
  (acc, item) => {
    acc[item.kind] = item;
    return acc;
  },
  {} as Record<FurnitureKind, CatalogItemMeta>
);

export function getCatalogMeta(kind: FurnitureKind): CatalogItemMeta {
  return (
    CATALOG_BY_KIND[kind] ?? {
      kind,
      label: 'شیء تزئینی',
      category: 'decor',
      surface: 'floor',
      radius: 0.45,
      defaultColor: '#d4a84f',
      colorOptions: [{ label: 'طلایی', hex: '#d4a84f' }],
      minScale: 0.7,
      maxScale: 1.4,
      defaultScale: 1,
      allowMultiple: true,
      cost: 0,
    }
  );
}

// 4 Garden beds around central pool in courtyard
export const COURTYARD_GARDEN_BEDS = [
  { id: 'nw', minX: -6.5, maxX: -2.75, minZ: -5.5, maxZ: -2.35 },
  { id: 'ne', minX: 2.75, maxX: 6.5, minZ: -5.5, maxZ: -2.35 },
  { id: 'sw', minX: -6.5, maxX: -2.75, minZ: 2.35, maxZ: 5.5 },
  { id: 'se', minX: 2.75, maxX: 6.5, minZ: 2.35, maxZ: 5.5 },
] as const;

export function isInsideGardenBed(x: number, z: number, margin = 0): boolean {
  return COURTYARD_GARDEN_BEDS.some(
    (b) => x >= b.minX + margin && x <= b.maxX - margin && z >= b.minZ + margin && z <= b.maxZ - margin
  );
}

export function isInsideCentralPool(x: number, z: number, margin = 0.35): boolean {
  return Math.abs(x) < 2.0 + margin && Math.abs(z) < 1.5 + margin;
}

export function detectMansionZone(x: number, z: number): MansionZoneMeta {
  // Check wings first so borders behave predictably
  for (const zMeta of MANSION_ZONES) {
    if (zMeta.id === 'courtyard') continue;
    if (x >= zMeta.minX - 0.35 && x <= zMeta.maxX + 0.35 && z >= zMeta.minZ - 0.35 && z <= zMeta.maxZ + 0.35) {
      return zMeta;
    }
  }
  return MANSION_ZONES[0]; // courtyard fallback
}

export function getZoneMeta(room: RoomType): MansionZoneMeta {
  if (room === 'bathroom') return MANSION_ZONES.find((z) => z.id === 'bedroom')!;
  return MANSION_ZONES.find((z) => z.id === room) ?? MANSION_ZONES[0];
}

export function clampScaleForKind(kind: FurnitureKind, scale: number): number {
  const meta = getCatalogMeta(kind);
  return Number(Math.min(meta.maxScale, Math.max(meta.minScale, scale)).toFixed(2));
}

/**
 * هوشمندسازی چیدمان روی سطوح، جلوگیری از برخورد با استخر و دیوارها و مبلمان هم‌تراز، و چسبندگی به شبکه
 */
export function resolveSmartPlacement(
  movingItem: PlacedFurniture,
  rawX: number,
  rawZ: number,
  allItems: PlacedFurniture[],
  snapToGrid: boolean
): { position: [number, number, number]; rotationY: number; room: RoomType } {
  const meta = getCatalogMeta(movingItem.kind);
  const scale = movingItem.scale ?? meta.defaultScale;
  const effRadius = meta.radius * scale;
  const surface = movingItem.surface ?? meta.surface;

  let x = rawX;
  let z = rawZ;

  if (snapToGrid) {
    const step = surface === 'table' ? 0.125 : 0.25;
    x = Math.round(x / step) * step;
    z = Math.round(z / step) * step;
  }

  // Clamp to overall mansion walkable envelope
  x = Math.max(-13.0, Math.min(13.0, x));
  z = Math.max(-15.6, Math.min(6.0, z));

  const zone = detectMansionZone(x, z);
  // Clamp strictly inside the detected zone minus item radius (with graceful wall buffer)
  const margin = Math.min(0.65, effRadius * 0.45);
  x = Math.max(zone.minX + margin, Math.min(zone.maxX - margin, x));
  z = Math.max(zone.minZ + margin, Math.min(zone.maxZ - margin, z));

  // Keep floor/rug items outside central turquoise pool
  if (zone.id === 'courtyard' && isInsideCentralPool(x, z, effRadius * 0.65)) {
    const dx = x === 0 ? 0.1 : x;
    const dz = z === 0 ? 0.1 : z;
    const minPoolX = 2.0 + effRadius * 0.65;
    const minPoolZ = 1.5 + effRadius * 0.65;
    if (Math.abs(dx) / minPoolX > Math.abs(dz) / minPoolZ) {
      x = Math.sign(dx) * minPoolX;
    } else {
      z = Math.sign(dz) * minPoolZ;
    }
  }

  // Non-garden heavy floor furniture stays on stone walkways outside raised garden beds
  if (
    zone.id === 'courtyard' &&
    surface === 'floor' &&
    isInsideGardenBed(x, z, -effRadius * 0.4)
  ) {
    for (const b of COURTYARD_GARDEN_BEDS) {
      if (x >= b.minX - 0.3 && x <= b.maxX + 0.3 && z >= b.minZ - 0.3 && z <= b.maxZ + 0.3) {
        const dLeft = Math.abs(x - (b.minX - 0.35));
        const dRight = Math.abs(b.maxX + 0.35 - x);
        const dTop = Math.abs(z - (b.minZ - 0.35));
        const dBottom = Math.abs(b.maxZ + 0.35 - z);
        const m = Math.min(dLeft, dRight, dTop, dBottom);
        if (m === dLeft) x = b.minX - 0.35;
        else if (m === dRight) x = b.maxX + 0.35;
        else if (m === dTop) z = b.minZ - 0.35;
        else z = b.maxZ + 0.35;
      }
    }
  }

  let y = zone.floorY;
  let rotationY = movingItem.rotationY;

  // Tabletop snapping: snap onto nearest support surface (tables, desks, counters, nightstands)
  if (surface === 'table') {
    let bestSupport: { item: PlacedFurniture; topY: number; dist: number; supR: number } | null = null;
    for (const other of allItems) {
      if (other.uid === movingItem.uid) continue;
      const otherMeta = getCatalogMeta(other.kind);
      if (!otherMeta.supportHeight) continue;
      const oScale = other.scale ?? otherMeta.defaultScale;
      const supR = (otherMeta.supportRadius ?? 0.55) * oScale;
      const dist = Math.hypot(x - other.position[0], z - other.position[2]);
      if (dist <= supR + 0.55 && (!bestSupport || dist < bestSupport.dist)) {
        const oZone = getZoneMeta(other.room);
        bestSupport = {
          item: other,
          topY: oZone.floorY + otherMeta.supportHeight * oScale,
          dist,
          supR,
        };
      }
    }
    if (bestSupport) {
      const dx = x - bestSupport.item.position[0];
      const dz = z - bestSupport.item.position[2];
      const d = Math.hypot(dx, dz);
      const maxOffset = Math.max(0.08, bestSupport.supR - effRadius * 0.6);
      if (d > maxOffset && d > 0.001) {
        x = bestSupport.item.position[0] + (dx / d) * maxOffset;
        z = bestSupport.item.position[2] + (dz / d) * maxOffset;
      }
      y = bestSupport.topY;
    } else {
      y = zone.floorY;
    }
  } else if (surface === 'wall') {
    // Snap cleanly against the closest wall of the current zone
    const walls = [
      { edge: 'north', dist: Math.abs(z - zone.minZ), x, z: zone.minZ + 0.1, rotY: 0 },
      { edge: 'south', dist: Math.abs(zone.maxZ - z), x, z: zone.maxZ - 0.1, rotY: Math.PI },
      { edge: 'west', dist: Math.abs(x - zone.minX), x: zone.minX + 0.1, z, rotY: Math.PI / 2 },
      { edge: 'east', dist: Math.abs(zone.maxX - x), x: zone.maxX - 0.1, z, rotY: -Math.PI / 2 },
    ];
    walls.sort((a, b) => a.dist - b.dist);
    const chosen = walls[0];
    x = chosen.x;
    z = chosen.z;
    rotationY = chosen.rotY;
    y = zone.floorY + (meta.wallHeight ?? 1.85);
  } else if (surface === 'rug') {
    y = zone.floorY + 0.015;
  } else if (surface === 'garden') {
    y = zone.id === 'courtyard' && isInsideGardenBed(x, z) ? 0.21 : zone.floorY;
  }

  // Prevent overlapping with sibling items on the same surface tier
  if (surface !== 'rug' && surface !== 'wall') {
    for (let pass = 0; pass < 2; pass++) {
      for (const other of allItems) {
        if (other.uid === movingItem.uid) continue;
        const oMeta = getCatalogMeta(other.kind);
        const oSurface = other.surface ?? oMeta.surface;
        if (oSurface === 'rug' || oSurface === 'wall') continue;
        // Allow tabletop items over tables without colliding with the table itself!
        if (surface === 'table' && oMeta.supportHeight) continue;
        if (oSurface === 'table' && meta.supportHeight) continue;
        if (Math.abs(other.position[1] - y) > 0.35) continue;

        const oRadius = oMeta.radius * (other.scale ?? oMeta.defaultScale);
        const minDist = (effRadius + oRadius) * 0.82;
        const dx = x - other.position[0];
        const dz = z - other.position[2];
        const dist = Math.hypot(dx, dz);
        if (dist < minDist) {
          const angle = dist > 0.001 ? Math.atan2(dz, dx) : 0.7;
          const push = minDist - dist + 0.02;
          x += Math.cos(angle) * push;
          z += Math.sin(angle) * push;
          x = Math.max(zone.minX + margin, Math.min(zone.maxX - margin, x));
          z = Math.max(zone.minZ + margin, Math.min(zone.maxZ - margin, z));
        }
      }
    }
  }

  return {
    position: [Number(x.toFixed(3)), Number(y.toFixed(3)), Number(z.toFixed(3))],
    rotationY,
    room: zone.id,
  };
}

export const ALL_UNLOCKED_MANSION_KINDS: FurnitureKind[] = MANSION_CATALOG.map((c) => c.kind);

export const DEFAULT_MANSION_ITEMS: PlacedFurniture[] = [
  // === حیاط مرکزی (Central Courtyard & Gardens) ===
  { uid: 'm-tree-pom-nw', kind: 'tree_pomegranate', room: 'courtyard', position: [-4.9, 0.21, -4.3], rotationY: 0.4, color: '#b5282c', scale: 1.08, surface: 'garden' },
  { uid: 'm-tree-or-ne', kind: 'tree_orange', room: 'courtyard', position: [4.8, 0.21, -4.2], rotationY: 1.2, color: '#e07b1f', scale: 1.05, surface: 'garden' },
  { uid: 'm-tree-cyp-sw', kind: 'tree_cypress', room: 'courtyard', position: [-5.6, 0.21, 4.4], rotationY: 0.2, color: '#254a36', scale: 1.15, surface: 'garden' },
  { uid: 'm-tree-pom-se', kind: 'tree_pomegranate', room: 'courtyard', position: [5.1, 0.21, 4.1], rotationY: 2.1, color: '#b5282c', scale: 0.98, surface: 'garden' },
  { uid: 'm-pot-turq-1', kind: 'flower_pot_turquoise', room: 'courtyard', position: [-2.4, 0, -2.1], rotationY: 0.3, color: '#247f86', scale: 1.05, surface: 'garden' },
  { uid: 'm-pot-turq-2', kind: 'flower_pot_turquoise', room: 'courtyard', position: [2.4, 0, -2.1], rotationY: -0.4, color: '#247f86', scale: 1.05, surface: 'garden' },
  { uid: 'm-pot-clay-1', kind: 'flower_pot_clay', room: 'courtyard', position: [-2.4, 0, 2.1], rotationY: 0.8, color: '#c26d48', scale: 1.0, surface: 'garden' },
  { uid: 'm-pot-clay-2', kind: 'flower_pot_clay', room: 'courtyard', position: [2.4, 0, 2.1], rotationY: -0.8, color: '#c26d48', scale: 1.0, surface: 'garden' },
  { uid: 'm-bench-1', kind: 'courtyard_bench', room: 'courtyard', position: [-3.9, 0, 0.0], rotationY: Math.PI / 2, color: '#694028', scale: 1, surface: 'floor' },
  { uid: 'm-bench-2', kind: 'courtyard_bench', room: 'courtyard', position: [3.9, 0, 0.0], rotationY: -Math.PI / 2, color: '#694028', scale: 1, surface: 'floor' },
  { uid: 'm-lantern-1', kind: 'courtyard_lantern', room: 'courtyard', position: [-2.2, 0, 4.9], rotationY: 0, color: '#2f323a', scale: 1, surface: 'floor' },
  { uid: 'm-lantern-2', kind: 'courtyard_lantern', room: 'courtyard', position: [2.2, 0, 4.9], rotationY: 0, color: '#2f323a', scale: 1, surface: 'floor' },

  // === ایوان اصلی (Grand Eyvan) ===
  { uid: 'm-eyvan-rug', kind: 'persian_carpet_large', room: 'eyvan', position: [0, 0.255, -8.1], rotationY: 0, color: '#8a1e2b', scale: 1.05, surface: 'rug' },
  { uid: 'm-eyvan-bolster-1', kind: 'bolster_set', room: 'eyvan', position: [-2.5, 0.24, -8.65], rotationY: 0, color: '#8d202f', scale: 1, surface: 'floor' },
  { uid: 'm-eyvan-bolster-2', kind: 'bolster_set', room: 'eyvan', position: [2.5, 0.24, -8.65], rotationY: 0, color: '#1c325e', scale: 1, surface: 'floor' },
  { uid: 'm-eyvan-table', kind: 'coffee_table', room: 'eyvan', position: [0, 0.24, -8.0], rotationY: 0, color: '#5c3824', scale: 0.95, surface: 'floor' },
  { uid: 'm-eyvan-samovar', kind: 'samovar_set', room: 'eyvan', position: [0, 0.68, -8.0], rotationY: 0.2, color: '#cfa146', scale: 1, surface: 'table' },

  // === تالار آینه و پذیرایی (Main Grand Hall) ===
  { uid: 'm-hall-carpet', kind: 'persian_carpet_large', room: 'hall', position: [0, 0.255, -13.0], rotationY: 0, color: '#8a1e2b', scale: 1.35, surface: 'rug' },
  { uid: 'm-hall-sofa', kind: 'persian_sofa', room: 'hall', position: [0, 0.24, -14.75], rotationY: 0, color: '#7a2232', scale: 1.08, surface: 'floor' },
  { uid: 'm-hall-chair-l', kind: 'royal_chair', room: 'hall', position: [-2.7, 0.24, -13.1], rotationY: Math.PI / 2.4, color: '#8f2c3c', scale: 1.02, surface: 'floor' },
  { uid: 'm-hall-chair-r', kind: 'royal_chair', room: 'hall', position: [2.7, 0.24, -13.1], rotationY: -Math.PI / 2.4, color: '#8f2c3c', scale: 1.02, surface: 'floor' },
  { uid: 'm-hall-table', kind: 'coffee_table', room: 'hall', position: [0, 0.24, -12.9], rotationY: 0, color: '#5c3824', scale: 1.15, surface: 'floor' },
  { uid: 'm-hall-vase', kind: 'turquoise_vase', room: 'hall', position: [-0.28, 0.77, -12.9], rotationY: 0, color: '#1f7c86', scale: 1, surface: 'table' },
  { uid: 'm-hall-candle', kind: 'brass_candlestick', room: 'hall', position: [0.32, 0.77, -12.9], rotationY: 0, color: '#d4a84f', scale: 1, surface: 'table' },
  { uid: 'm-hall-lamp-l', kind: 'lamp_floor', room: 'hall', position: [-4.6, 0.24, -14.9], rotationY: 0, color: '#d4a84f', scale: 1.05, surface: 'floor' },
  { uid: 'm-hall-lamp-r', kind: 'lamp_floor', room: 'hall', position: [4.6, 0.24, -14.9], rotationY: 0, color: '#d4a84f', scale: 1.05, surface: 'floor' },
  { uid: 'm-hall-art-1', kind: 'persian_painting', room: 'hall', position: [-3.2, 2.2, -15.7], rotationY: 0, color: '#c99b42', scale: 1.1, surface: 'wall' },
  { uid: 'm-hall-art-2', kind: 'wall_mirror', room: 'hall', position: [3.2, 2.0, -15.7], rotationY: 0, color: '#d4a84f', scale: 1.05, surface: 'wall' },

  // === اتاق نشیمن (Cozy Living Room - East North) ===
  { uid: 'm-liv-rug', kind: 'persian_carpet_runner', room: 'living', position: [10.4, 0.255, -10.1], rotationY: Math.PI / 2, color: '#1b2c54', scale: 1.15, surface: 'rug' },
  { uid: 'm-liv-sofa', kind: 'sofa', room: 'living', position: [11.8, 0.24, -10.2], rotationY: -Math.PI / 2, color: '#4f6d58', scale: 1.0, surface: 'floor' },
  { uid: 'm-liv-armchair', kind: 'armchair', room: 'living', position: [9.4, 0.24, -11.9], rotationY: 0.45, color: '#256c70', scale: 1, surface: 'floor' },
  { uid: 'm-liv-table', kind: 'coffee_table', room: 'living', position: [10.1, 0.24, -10.1], rotationY: 0, color: '#5c3824', scale: 0.85, surface: 'floor' },
  { uid: 'm-liv-plant', kind: 'plant_monstera', room: 'living', position: [8.6, 0.24, -8.1], rotationY: 0.3, color: '#3f7652', scale: 1, surface: 'floor' },

  // === کتابخانه (Study / Library - East Mid) ===
  { uid: 'm-lib-shelf-1', kind: 'bookshelf', room: 'library', position: [12.3, 0.24, -4.6], rotationY: -Math.PI / 2, color: '#5c3824', scale: 1.05, surface: 'floor' },
  { uid: 'm-lib-shelf-2', kind: 'bookshelf', room: 'library', position: [12.3, 0.24, -2.0], rotationY: -Math.PI / 2, color: '#5c3824', scale: 1.05, surface: 'floor' },
  { uid: 'm-lib-desk', kind: 'desk', room: 'library', position: [9.8, 0.24, -3.3], rotationY: Math.PI / 2, color: '#5a3723', scale: 1, surface: 'floor' },
  { uid: 'm-lib-chair', kind: 'royal_chair', room: 'library', position: [10.8, 0.24, -3.3], rotationY: -Math.PI / 2, color: '#8f2c3c', scale: 0.92, surface: 'floor' },
  { uid: 'm-lib-lamp', kind: 'table_lamp', room: 'library', position: [9.7, 1.01, -2.85], rotationY: 0, color: '#2a6f59', scale: 1, surface: 'table' },
  { uid: 'm-lib-rug', kind: 'rug_round', room: 'library', position: [10.1, 0.255, -3.3], rotationY: 0, color: '#c9a66b', scale: 1.05, surface: 'rug' },

  // === اتاق خواب (Master Bedroom - East South) ===
  { uid: 'm-bed-rug', kind: 'persian_carpet_large', room: 'bedroom', position: [10.3, 0.255, 3.2], rotationY: 0, color: '#1b2c54', scale: 0.95, surface: 'rug' },
  { uid: 'm-bed-main', kind: 'bed', room: 'bedroom', position: [11.2, 0.24, 3.2], rotationY: -Math.PI / 2, color: '#1f365c', scale: 1, surface: 'floor' },
  { uid: 'm-bed-ns-1', kind: 'nightstand', room: 'bedroom', position: [12.1, 0.24, 1.7], rotationY: -Math.PI / 2, color: '#5c3824', scale: 1, surface: 'floor' },
  { uid: 'm-bed-ns-2', kind: 'nightstand', room: 'bedroom', position: [12.1, 0.24, 4.7], rotationY: -Math.PI / 2, color: '#5c3824', scale: 1, surface: 'floor' },
  { uid: 'm-bed-lamp-1', kind: 'table_lamp', room: 'bedroom', position: [12.1, 0.8, 1.7], rotationY: 0, color: '#e7cf9e', scale: 0.9, surface: 'table' },
  { uid: 'm-bed-vanity', kind: 'vanity', room: 'bedroom', position: [9.4, 0.24, 5.3], rotationY: Math.PI, color: '#66402a', scale: 1, surface: 'floor' },
  { uid: 'm-bed-curtain', kind: 'curtain', room: 'bedroom', position: [8.0, 0.48, 3.2], rotationY: Math.PI / 2, color: '#7a2533', scale: 1, surface: 'wall' },

  // === آشپزخانه سنتی (Kitchen - West North) ===
  { uid: 'm-kit-counter', kind: 'kitchen_counter', room: 'kitchen', position: [-12.2, 0.24, -10.0], rotationY: Math.PI / 2, color: '#6b432b', scale: 1.05, surface: 'floor' },
  { uid: 'm-kit-copper', kind: 'copper_vessel', room: 'kitchen', position: [-12.1, 1.18, -9.8], rotationY: 0.3, color: '#b96441', scale: 1.05, surface: 'table' },
  { uid: 'm-kit-table', kind: 'dining_table', room: 'kitchen', position: [-9.7, 0.24, -9.4], rotationY: 0, color: '#603b25', scale: 0.95, surface: 'floor' },
  { uid: 'm-kit-chair-1', kind: 'royal_chair', room: 'kitchen', position: [-9.7, 0.24, -10.6], rotationY: 0, color: '#287e85', scale: 0.92, surface: 'floor' },
  { uid: 'm-kit-chair-2', kind: 'royal_chair', room: 'kitchen', position: [-9.7, 0.24, -8.2], rotationY: Math.PI, color: '#287e85', scale: 0.92, surface: 'floor' },

  // === اتاق گربه (Cat Room - West South) ===
  { uid: 'm-cat-rug', kind: 'persian_carpet_runner', room: 'cat_room', position: [-10.5, 0.255, -2.0], rotationY: 0, color: '#8a1e2b', scale: 1.05, surface: 'rug' },
  { uid: 'm-cat-basket', kind: 'cat_basket', room: 'cat_room', position: [-11.5, 0.24, -2.8], rotationY: 0.5, color: '#8d2433', scale: 1.05, surface: 'floor' },
  { uid: 'm-cat-tower', kind: 'cat_tower', room: 'cat_room', position: [-11.9, 0.24, -0.5], rotationY: 0.8, color: '#c49e76', scale: 1, surface: 'floor' },
  { uid: 'm-cat-bowls', kind: 'cat_bowls', room: 'cat_room', position: [-9.6, 0.24, -3.5], rotationY: 0, color: '#257d85', scale: 1, surface: 'floor' },
  { uid: 'm-cat-toy', kind: 'cat_toy', room: 'cat_room', position: [-9.7, 0.24, -1.2], rotationY: 0, color: '#d97f36', scale: 1, surface: 'floor' },
];

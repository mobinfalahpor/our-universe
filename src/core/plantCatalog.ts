import type { PlantSpecies, PotStyle } from './types';

export interface PlantSpeciesMeta {
  species: PlantSpecies;
  label: string;
  color: string;
  accentColor: string;
  rare?: boolean;
  description: string;
}

export const PLANT_SPECIES_INFO: Record<PlantSpecies, PlantSpeciesMeta> = {
  dream_rose: {
    species: 'dream_rose',
    label: 'رز رؤیایی',
    color: '#D9A9C5',
    accentColor: '#b55b88',
    description: 'گلبرگ‌های مخملی صورتی با عطر لطیف',
  },
  moon_lavender: {
    species: 'moon_lavender',
    label: 'اسطوخودوس مهتاب',
    color: '#7771A8',
    accentColor: '#9b95cc',
    description: 'خوشه‌های بنفش آرامش‌بخش شبانه',
  },
  crystal_lotus: {
    species: 'crystal_lotus',
    label: 'نیلوفر بلورین',
    color: '#8bd8e6',
    accentColor: '#d9f8ff',
    rare: true,
    description: 'نیلوفر کمیاب با درخشش فیروزه‌ای',
  },
  golden_sun: {
    species: 'golden_sun',
    label: 'آفتابگردان طلایی',
    color: '#D6B875',
    accentColor: '#946224',
    description: 'شکوفه گرم و آفتابی با مرکز قهوه‌ای',
  },
  night_orchid: {
    species: 'night_orchid',
    label: 'ارکیده شب',
    color: '#c486d9',
    accentColor: '#7a3b96',
    rare: true,
    description: 'ارکیده نجیب با شکوفه‌های شب‌تاب',
  },
  star_cactus: {
    species: 'star_cactus',
    label: 'کاکتوس ستاره‌ای',
    color: '#7da688',
    accentColor: '#e8b4c8',
    description: 'گیاه مقاوم و ستاره‌ای با گل صورتی',
  },
};

export const POT_STYLES_INFO: { id: PotStyle; label: string; color: string }[] = [
  { id: 'terracotta', label: 'سفال گرم', color: '#c46f4a' },
  { id: 'rose_ceramic', label: 'سرامیک رز', color: '#D9A9C5' },
  { id: 'gold_trimmed', label: 'طلاکوب', color: '#D6B875' },
  { id: 'mossy_stone', label: 'سنگ خزه‌دار', color: '#6b8577' },
];

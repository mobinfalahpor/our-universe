import type { CatEmotion, CatState, FurnitureKind, PlacedFurniture, RoomType } from '../core/types';
import type { CatAnimationName } from '../components/CatActor3D';

export interface CatHomeBehaviorTarget {
  position: [number, number, number];
  animation: CatAnimationName;
  emotion: CatEmotion;
  statusText: string;
  targetUid?: string;
  targetKind?: FurnitureKind;
  lookTarget?: [number, number, number];
}

export function deriveCatEmotion(cat: CatState, recentAction?: string | null): CatEmotion {
  if (recentAction === 'Play' || recentAction === 'Run') return 'excited';
  if (recentAction === 'Happy') return 'affectionate';
  if (recentAction === 'Sleep' || recentAction === 'Yawn') return 'sleepy';
  if (cat.energy < 34) return 'sleepy';
  if (cat.hunger < 36 || cat.cleanliness < 38) return 'stubborn';
  if (cat.affection >= 82 && cat.happiness >= 75) return 'affectionate';
  if (cat.happiness >= 85 && cat.energy >= 70) return 'excited';
  if (cat.happiness >= 65) return 'happy';
  return 'curious';
}

export const CAT_EMOTION_LABELS: Record<CatEmotion, string> = {
  happy: 'خوشحال و بازیگوش',
  sleepy: 'خواب‌آلود',
  curious: 'کنجکاو',
  affectionate: 'آرام و مهربان',
  excited: 'هیجان‌زده',
  stubborn: 'کمی لجباز',
};

function sampleItem(items: PlacedFurniture[], predicate: (item: PlacedFurniture) => boolean): PlacedFurniture | undefined {
  const matched = items.filter(predicate);
  if (matched.length === 0) return undefined;
  return matched[Math.floor(Math.random() * matched.length)];
}

/**
 * انتخاب رفتار هوشمند گربه بر اساس وسایل و بخش‌های زنده عمارت ایرانی
 * گربه پیوسته بین حیاط، حوض، ایوان، تالار، اتاق خواب و اتاق گربه قدم می‌زند و با وسایل جابه‌جاشده تعامل می‌کند.
 */
export function pickCatHomeBehavior(
  cat: CatState,
  allItems: PlacedFurniture[],
  preferredZone?: RoomType
): CatHomeBehaviorTarget {
  const catName = cat.name;
  // Bias slightly toward items in the currently viewed zone so Zahra sees the cat interact nearby, while still roaming!
  const zonePool =
    preferredZone && Math.random() < 0.65
      ? allItems.filter((i) => i.room === preferredZone)
      : allItems;
  const pool = zonePool.length > 0 ? zonePool : allItems;

  const basket = sampleItem(pool, (i) => i.kind === 'cat_basket');
  const tower = sampleItem(pool, (i) => i.kind === 'cat_tower');
  const bowls = sampleItem(pool, (i) => i.kind === 'cat_bowls');
  const sofa = sampleItem(
    pool,
    (i) => i.kind === 'sofa' || i.kind === 'persian_sofa' || i.kind === 'armchair' || i.kind === 'royal_chair'
  );
  const bed = sampleItem(pool, (i) => i.kind === 'bed');
  const bolster = sampleItem(pool, (i) => i.kind === 'bolster_set' || i.kind === 'courtyard_bench');
  const toy = sampleItem(pool, (i) => i.kind === 'cat_toy');
  const rug = sampleItem(
    pool,
    (i) => i.kind === 'persian_carpet_large' || i.kind === 'persian_carpet_runner' || i.kind === 'rug_round'
  );
  const tree = sampleItem(pool, (i) => i.kind === 'tree_pomegranate' || i.kind === 'tree_orange' || i.kind === 'tree_cypress');
  const flowerPot = sampleItem(
    pool,
    (i) =>
      i.kind === 'flower_pot_clay' ||
      i.kind === 'flower_pot_turquoise' ||
      i.kind === 'greenhouse_planter' ||
      i.kind === 'plant_monstera'
  );

  const candidates: CatHomeBehaviorTarget[] = [];

  if (basket) {
    candidates.push({
      position: [basket.position[0], basket.position[1] + 0.14, basket.position[2]],
      animation: cat.energy < 60 ? 'Sleep' : 'LickPaw',
      emotion: cat.energy < 60 ? 'sleepy' : 'affectionate',
      statusText:
        cat.energy < 60
          ? `${catName} داخل سبد مخملی‌اش جمع شده و می‌خوابد`
          : `${catName} روی تشک گرمش پنجه‌هایش را تمیز می‌کند`,
      targetUid: basket.uid,
      targetKind: basket.kind,
    });
  }

  if (tower) {
    candidates.push({
      position: [tower.position[0] - 0.16, tower.position[1] + 0.84, tower.position[2]],
      animation: 'Sit',
      emotion: 'curious',
      statusText: `${catName} بالای برج بازی رفته و حیاط را زیر نظر دارد`,
      targetUid: tower.uid,
      targetKind: tower.kind,
    });
  }

  if (bowls) {
    candidates.push({
      position: [bowls.position[0], bowls.position[1], bowls.position[2] + 0.34],
      animation: 'Groom',
      emotion: 'happy',
      statusText: `${catName} کنار ظرف آب و غذایش سرک می‌کشد`,
      targetUid: bowls.uid,
      targetKind: bowls.kind,
      lookTarget: [bowls.position[0], bowls.position[1] + 0.08, bowls.position[2]],
    });
  }

  if (sofa) {
    candidates.push({
      position: [sofa.position[0], sofa.position[1] + 0.43, sofa.position[2] + 0.05],
      animation: 'Sleep',
      emotion: 'sleepy',
      statusText: `${catName} روی مبل باشکوه عمارت چرت می‌زند`,
      targetUid: sofa.uid,
      targetKind: sofa.kind,
    });
  }

  if (bed) {
    candidates.push({
      position: [bed.position[0], bed.position[1] + 0.54, bed.position[2] + 0.15],
      animation: Math.random() > 0.35 ? 'Sleep' : 'Yawn',
      emotion: 'sleepy',
      statusText: `${catName} روی تخت نرم اتاق خواب استراحت می‌کند`,
      targetUid: bed.uid,
      targetKind: bed.kind,
    });
  }

  if (bolster) {
    candidates.push({
      position: [bolster.position[0], bolster.position[1] + 0.22, bolster.position[2] + 0.15],
      animation: 'Stretch',
      emotion: 'affectionate',
      statusText: `${catName} کنار شاه‌نشین و پشتی سنتی آفتاب می‌گیرد`,
      targetUid: bolster.uid,
      targetKind: bolster.kind,
    });
  }

  if (toy) {
    candidates.push({
      position: [toy.position[0] + 0.36, toy.position[1], toy.position[2] + 0.3],
      animation: 'Play',
      emotion: 'excited',
      statusText: `${catName} با کلاف کاموا بازیگوشی می‌کند`,
      targetUid: toy.uid,
      targetKind: toy.kind,
      lookTarget: [toy.position[0], toy.position[1] + 0.18, toy.position[2]],
    });
  }

  if (rug) {
    const roll = Math.random();
    candidates.push({
      position: [
        rug.position[0] + (Math.random() - 0.5) * 0.85,
        rug.position[1] + 0.01,
        rug.position[2] + (Math.random() - 0.5) * 0.7,
      ],
      animation: roll < 0.4 ? 'Stretch' : roll < 0.75 ? 'Sleep' : 'Groom',
      emotion: roll < 0.4 ? 'happy' : 'affectionate',
      statusText:
        roll < 0.4
          ? `${catName} روی فرش دست‌بافت کش‌وقوس می‌آید`
          : `${catName} روی نقش‌ونگار فرش ایرانی آرام گرفته است`,
      targetUid: rug.uid,
      targetKind: rug.kind,
    });
  }

  if (tree) {
    candidates.push({
      position: [
        tree.position[0] > 0 ? tree.position[0] - 0.85 : tree.position[0] + 0.85,
        0,
        tree.position[2] > 0 ? tree.position[2] - 0.7 : tree.position[2] + 0.7,
      ],
      animation: 'Sit',
      emotion: 'curious',
      statusText: `${catName} زیر سایه درختان انار و نارنج نشسته است`,
      targetUid: tree.uid,
      targetKind: tree.kind,
      lookTarget: [tree.position[0], 1.1, tree.position[2]],
    });
  }

  if (flowerPot) {
    candidates.push({
      position: [flowerPot.position[0] + 0.46, flowerPot.position[1], flowerPot.position[2] + 0.35],
      animation: 'Sit',
      emotion: 'curious',
      statusText: `${catName} عطر گل‌های حیاط و گلخانه را بو می‌کشد`,
      targetUid: flowerPot.uid,
      targetKind: flowerPot.kind,
      lookTarget: [flowerPot.position[0], flowerPot.position[1] + 0.6, flowerPot.position[2]],
    });
  }

  // Always offer watching goldfish at the Central Turquoise Pool when in/near courtyard!
  if (!preferredZone || preferredZone === 'courtyard' || Math.random() < 0.35) {
    const side = Math.random() > 0.5 ? 1 : -1;
    candidates.push({
      position: [side * 2.38, 0, (Math.random() - 0.5) * 1.4],
      animation: 'Sit',
      emotion: 'curious',
      statusText: `${catName} کنار حوض فیروزه‌ای نشسته و ماهی‌های قرمز را تماشا می‌کند`,
      lookTarget: [0, 0.25, 0],
    });
  }

  if (candidates.length === 0) {
    return {
      position: [(Math.random() - 0.5) * 3.8, 0, 2.2 + (Math.random() - 0.5) * 1.4],
      animation: 'Idle',
      emotion: deriveCatEmotion(cat),
      statusText: `${catName} در حیاط عمارت قدم می‌زند`,
    };
  }

  return candidates[Math.floor(Math.random() * candidates.length)];
}

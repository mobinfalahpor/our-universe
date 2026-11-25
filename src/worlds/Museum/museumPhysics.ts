export interface BoxCollider2D {
  id: string;
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

export interface CircleCollider2D {
  id: string;
  x: number;
  z: number;
  radius: number;
}

export type MuseumHallId = 'hall1' | 'hall2' | 'hall3' | 'hall4' | 'hall5';

export interface MuseumCollisionWorld {
  safeRects: BoxCollider2D[];
  boxes: BoxCollider2D[];
  circles: CircleCollider2D[];
  hall2NorthZ: number;
  hall4SouthZ: number;
  hall4NorthZ: number;
}

export const PLAYER_CAPSULE_RADIUS = 0.42;
export const PLAYER_EYE_HEIGHT = 1.72;

export const MUSEUM_HALL_SPAWNS: Record<
  MuseumHallId,
  { x: number; y: number; z: number; yaw: number; pitch: number; label: string }
> = {
  hall1: { x: 0, y: PLAYER_EYE_HEIGHT, z: 4.35, yaw: 0, pitch: 0.04, label: 'تالار بزرگ فرانسوی' },
  hall2: { x: 0, y: PLAYER_EYE_HEIGHT, z: -10.8, yaw: 0, pitch: 0.03, label: 'تالار نقاشی' },
  hall3: { x: 10.6, y: PLAYER_EYE_HEIGHT, z: -1.5, yaw: -Math.PI / 2, pitch: 0.04, label: 'تالار مجسمه' },
  hall4: { x: 0, y: PLAYER_EYE_HEIGHT, z: -26.8, yaw: 0, pitch: 0.04, label: 'گالری نورگیر' },
  hall5: { x: -10.6, y: PLAYER_EYE_HEIGHT, z: -2.0, yaw: Math.PI / 2, pitch: 0.03, label: 'تالار منتخب' },
};

export const MUSEUM_START_POS = MUSEUM_HALL_SPAWNS.hall1;

export function getHall4Bounds(hall2DepthExtra: number) {
  const hall2NorthZ = -24.5 - hall2DepthExtra;
  const hall4SouthZ = hall2NorthZ;
  const hall4NorthZ = hall4SouthZ - 14.0;
  return { hall2NorthZ, hall4SouthZ, hall4NorthZ };
}

export function getHallAtPosition(x: number, z: number, hall2DepthExtra: number): MuseumHallId {
  const { hall2NorthZ } = getHall4Bounds(hall2DepthExtra);
  if (x > 8.5) return 'hall3';
  if (x < -8.5) return 'hall5';
  if (z < hall2NorthZ) return 'hall4';
  if (z < -8.5) return 'hall2';
  return 'hall1';
}

/**
 * ساخت کلابدرهای دقیق ۵ تالار موزه پاریسی، درگاه‌های اتصال، ستون‌های کرنتین، مجسمه‌ها، نیم‌تنه‌ها، نیمکت‌ها و میزهای دکوراتیو
 */
export function buildMuseumCollisionWorld(hall2DepthExtra: number): MuseumCollisionWorld {
  const r = PLAYER_CAPSULE_RADIUS;
  const { hall2NorthZ, hall4SouthZ, hall4NorthZ } = getHall4Bounds(hall2DepthExtra);

  // Shrunken walkable interior rectangles (always >= r inside every perimeter wall)
  const safeRects: BoxCollider2D[] = [
    // Hall 1: Grande Galerie (X ∈ [-8.5, 8.5], Z ∈ [-8.5, 6.5])
    { id: 'safe-hall1', minX: -8.5 + r, maxX: 8.5 - r, minZ: -8.5 + r, maxZ: 6.5 - r },
    // Hall 2: Salon Carré (X ∈ [-8.5, 8.5], Z ∈ [hall2NorthZ, -8.5])
    { id: 'safe-hall2', minX: -8.5 + r, maxX: 8.5 - r, minZ: hall2NorthZ + r, maxZ: -8.5 - r },
    // Hall 3: Petit Palais Sculpture Wing (X ∈ [8.5, 22.5], Z ∈ [-7.5, 4.5])
    { id: 'safe-hall3', minX: 8.5 + r, maxX: 22.5 - r, minZ: -7.5 + r, maxZ: 4.5 - r },
    // Hall 4: Musée d'Orsay Skylight Gallery (X ∈ [-8.5, 8.5], Z ∈ [hall4NorthZ, hall4SouthZ])
    { id: 'safe-hall4', minX: -8.5 + r, maxX: 8.5 - r, minZ: hall4NorthZ + r, maxZ: hall4SouthZ - r },
    // Hall 5: Intimate Cabinet d'Or (X ∈ [-18.5, -8.5], Z ∈ [-6.5, 2.5])
    { id: 'safe-hall5', minX: -18.5 + r, maxX: -8.5 - r, minZ: -6.5 + r, maxZ: 2.5 - r },

    // Doorway Bridges (open passage axis spans inside both adjacent rooms; jamb axis inset by r)
    // Archway Hall 1 <-> Hall 2 (at Z = -8.5, X ∈ [-2.4, +2.4])
    { id: 'door-h1-h2', minX: -2.4 + r, maxX: 2.4 - r, minZ: -8.5 - r - 0.65, maxZ: -8.5 + r + 0.65 },
    // Archway Hall 2 <-> Hall 4 (at Z = hall2NorthZ, X ∈ [-2.4, +2.4])
    { id: 'door-h2-h4', minX: -2.4 + r, maxX: 2.4 - r, minZ: hall2NorthZ - r - 0.65, maxZ: hall2NorthZ + r + 0.65 },
    // Archway Hall 1 <-> Hall 3 (at X = +8.5, Z ∈ [-3.8, +0.8])
    { id: 'door-h1-h3', minX: 8.5 - r - 0.65, maxX: 8.5 + r + 0.65, minZ: -3.8 + r, maxZ: 0.8 - r },
    // Archway Hall 1 <-> Hall 5 (at X = -8.5, Z ∈ [-3.5, +0.5])
    { id: 'door-h1-h5', minX: -8.5 - r - 0.65, maxX: -8.5 + r + 0.65, minZ: -3.5 + r, maxZ: 0.5 - r },
  ];

  // Solid interior furniture & console table AABBs
  const boxes: BoxCollider2D[] = [
    // Hall 1 Benches (flanking main central promenade symmetrically)
    { id: 'bench-h1-w', minX: -4.45, maxX: -3.45, minZ: -2.25, maxZ: 0.25 },
    { id: 'bench-h1-e', minX: 3.45, maxX: 4.45, minZ: -2.25, maxZ: 0.25 },

    // Hall 2 Salon Carré Central Grand Bench + Console Tables
    { id: 'bench-h2-center', minX: -0.68, maxX: 0.68, minZ: -17.85, maxZ: -15.15 },
    { id: 'console-h2-w', minX: -6.2, maxX: -4.6, minZ: -9.75, maxZ: -8.85 },
    { id: 'console-h2-e', minX: 4.6, maxX: 6.2, minZ: -9.75, maxZ: -8.85 },

    // Hall 3 Sculpture Hall Viewing Benches
    { id: 'bench-h3-n', minX: 14.3, maxX: 16.7, minZ: -5.95, maxZ: -5.05 },
    { id: 'bench-h3-s', minX: 14.3, maxX: 16.7, minZ: 2.05, maxZ: 2.95 },

    // Hall 4 Skylight Gallery Viewing Bench
    { id: 'bench-h4-center', minX: -1.35, maxX: 1.35, minZ: hall4SouthZ - 7.45, maxZ: hall4SouthZ - 6.55 },

    // Hall 5 Intimate Cabinet Bench & North Decorative Console Table
    { id: 'bench-h5-center', minX: -13.9, maxX: -12.9, minZ: -3.15, maxZ: -0.85 },
    { id: 'console-h5-n', minX: -14.6, maxX: -12.4, minZ: -6.35, maxZ: -5.45 },
  ];

  // Corinthian columns, sculpture pedestals, classical busts & amphora urns
  const circles: CircleCollider2D[] = [
    // Hall 1 Corinthian Columns (keep Z ∈ [-3.8, 0.8] portal aisles clear)
    ...[-7.2, -4.4, 1.4, 4.2].flatMap((z, i) => [
      { id: `col-h1-w-${i}`, x: -7.55, z, radius: 0.42 },
      { id: `col-h1-e-${i}`, x: 7.55, z, radius: 0.42 },
    ]),
    // Hall 1 Entrance Classical Amphora Urns
    { id: 'urn-h1-sw', x: -4.4, z: 4.6, radius: 0.56 },
    { id: 'urn-h1-se', x: 4.4, z: 4.6, radius: 0.56 },

    // Hall 2 Corinthian Columns (plus extra bays if dynamic expansion active)
    ...[-10.6, -16.6, -22.6].flatMap((z, i) => [
      { id: `col-h2-w-${i}`, x: -7.55, z, radius: 0.42 },
      { id: `col-h2-e-${i}`, x: 7.55, z, radius: 0.42 },
    ]),
  ];

  for (let z = -27.4; z > hall2NorthZ + 1.2; z -= 4.8) {
    circles.push({ id: `col-h2-ext-w-${z}`, x: -7.55, z, radius: 0.42 });
    circles.push({ id: `col-h2-ext-e-${z}`, x: 7.55, z, radius: 0.42 });
  }

  // Hall 2 Classical Busts flanking middle piers
  circles.push({ id: 'bust-h2-w', x: -7.2, z: -16.6, radius: 0.48 });
  circles.push({ id: 'bust-h2-e', x: 7.2, z: -16.6, radius: 0.48 });

  // Hall 3 Petit Palais Sculpture Hall: Central Hero Statue + 4 Classical Busts + 4 Corinthian Columns
  circles.push({ id: 'statue-h3-hero', x: 15.5, z: -1.5, radius: 1.12 });
  circles.push({ id: 'bust-h3-nw', x: 11.8, z: -5.2, radius: 0.58 });
  circles.push({ id: 'bust-h3-ne', x: 19.2, z: -5.2, radius: 0.58 });
  circles.push({ id: 'bust-h3-sw', x: 11.8, z: 2.2, radius: 0.58 });
  circles.push({ id: 'bust-h3-se', x: 19.2, z: 2.2, radius: 0.58 });
  for (const cx of [10.1, 20.9]) {
    for (const cz of [-6.0, 3.0]) {
      circles.push({ id: `col-h3-${cx}-${cz}`, x: cx, z: cz, radius: 0.42 });
    }
  }

  // Hall 4 Skylight Gallery: 4 columns + 2 grand marble amphora urns near North window
  for (const cz of [hall4SouthZ - 3.2, hall4SouthZ - 10.6]) {
    circles.push({ id: `col-h4-w-${cz}`, x: -7.55, z: cz, radius: 0.42 });
    circles.push({ id: `col-h4-e-${cz}`, x: 7.55, z: cz, radius: 0.42 });
  }
  circles.push({ id: 'urn-h4-nw', x: -4.6, z: hall4NorthZ + 1.35, radius: 0.58 });
  circles.push({ id: 'urn-h4-ne', x: 4.6, z: hall4NorthZ + 1.35, radius: 0.58 });

  // Hall 5 Intimate Cabinet corner decorative urns
  circles.push({ id: 'urn-h5-nw', x: -17.3, z: -5.3, radius: 0.5 });
  circles.push({ id: 'urn-h5-sw', x: -17.3, z: 1.3, radius: 0.5 });

  return {
    safeRects,
    boxes,
    circles,
    hall2NorthZ,
    hall4SouthZ,
    hall4NorthZ,
  };
}

function clampPointToSafeRectUnion(
  x: number,
  z: number,
  safeRects: BoxCollider2D[]
): { x: number; z: number; clamped: boolean } {
  for (const rect of safeRects) {
    if (x >= rect.minX && x <= rect.maxX && z >= rect.minZ && z <= rect.maxZ) {
      return { x, z, clamped: false };
    }
  }

  let bestX = x;
  let bestZ = z;
  let bestDistSq = Infinity;

  for (const rect of safeRects) {
    const cx = Math.max(rect.minX, Math.min(x, rect.maxX));
    const cz = Math.max(rect.minZ, Math.min(z, rect.maxZ));
    const dx = x - cx;
    const dz = z - cz;
    const distSq = dx * dx + dz * dz;
    if (distSq < bestDistSq) {
      bestDistSq = distSq;
      bestX = cx;
      bestZ = cz;
    }
  }

  return { x: bestX, z: bestZ, clamped: true };
}

/**
 * حل برخورد کپسول بازیکن با اتحاد نواحی مجاز تالارها و تمام اشیاء داخلی با لغزش روان
 */
export function resolveCapsulePosition2D(
  x: number,
  z: number,
  world: MuseumCollisionWorld,
  radius = PLAYER_CAPSULE_RADIUS
): { x: number; z: number; collided: boolean } {
  let px = x;
  let pz = z;
  let collided = false;

  for (let pass = 0; pass < 6; pass++) {
    const u1 = clampPointToSafeRectUnion(px, pz, world.safeRects);
    px = u1.x;
    pz = u1.z;
    if (u1.clamped) collided = true;

    // Push out of solid benches & console tables
    for (const box of world.boxes) {
      const closestX = Math.max(box.minX, Math.min(px, box.maxX));
      const closestZ = Math.max(box.minZ, Math.min(pz, box.maxZ));
      const dx = px - closestX;
      const dz = pz - closestZ;
      const distSq = dx * dx + dz * dz;

      if (distSq < radius * radius) {
        collided = true;
        if (distSq > 1e-8) {
          const dist = Math.sqrt(distSq);
          const overlap = radius - dist;
          px += (dx / dist) * overlap;
          pz += (dz / dist) * overlap;
        } else {
          const dLeft = Math.abs(px - box.minX);
          const dRight = Math.abs(box.maxX - px);
          const dTop = Math.abs(pz - box.minZ);
          const dBottom = Math.abs(box.maxZ - pz);
          const m = Math.min(dLeft, dRight, dTop, dBottom);
          if (m === dLeft) px = box.minX - radius;
          else if (m === dRight) px = box.maxX + radius;
          else if (m === dTop) pz = box.minZ - radius;
          else pz = box.maxZ + radius;
        }
      }
    }

    // Push out of Corinthian columns, sculpture plinths, busts & urns
    for (const cir of world.circles) {
      const dx = px - cir.x;
      const dz = pz - cir.z;
      const minDist = radius + cir.radius;
      const distSq = dx * dx + dz * dz;
      if (distSq < minDist * minDist) {
        collided = true;
        const dist = Math.sqrt(distSq);
        if (dist > 1e-6) {
          const overlap = minDist - dist;
          px += (dx / dist) * overlap;
          pz += (dz / dist) * overlap;
        } else {
          px += cir.x <= 0 ? minDist : -minDist;
        }
      }
    }

    // Hard boundary post-condition guaranteeing zero penetration of any hall or doorway jamb wall
    const u2 = clampPointToSafeRectUnion(px, pz, world.safeRects);
    px = u2.x;
    pz = u2.z;
    if (u2.clamped) collided = true;
  }

  return { x: px, z: pz, collided };
}

/**
 * حرکت پیوسته با زیرگام‌بندی ضدعبور (Anti-Tunneling Swept Sub-stepping)
 */
export function movePlayerWithCollision(
  startX: number,
  startZ: number,
  deltaX: number,
  deltaZ: number,
  world: MuseumCollisionWorld,
  radius = PLAYER_CAPSULE_RADIUS
): { x: number; z: number; collided: boolean } {
  const dist = Math.hypot(deltaX, deltaZ);
  if (dist < 1e-6) {
    return resolveCapsulePosition2D(startX, startZ, world, radius);
  }

  const maxStep = Math.max(0.08, radius * 0.28);
  const steps = Math.max(1, Math.ceil(dist / maxStep));
  const stepX = deltaX / steps;
  const stepZ = deltaZ / steps;

  let cx = startX;
  let cz = startZ;
  let anyCollision = false;

  for (let i = 0; i < steps; i++) {
    const res = resolveCapsulePosition2D(cx + stepX, cz + stepZ, world, radius);
    cx = res.x;
    cz = res.z;
    if (res.collided) anyCollision = true;
  }

  return { x: cx, z: cz, collided: anyCollision };
}

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

export interface MuseumCollisionWorld {
  bounds: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    minY: number;
    maxY: number;
  };
  boxes: BoxCollider2D[];
  circles: CircleCollider2D[];
}

export const PLAYER_CAPSULE_RADIUS = 0.42;
export const PLAYER_EYE_HEIGHT = 1.72;
export const MUSEUM_START_POS = { x: 0, y: PLAYER_EYE_HEIGHT, z: 2.85, yaw: 0, pitch: 0 };
export const MUSEUM_HALL2_POS = { x: 0, y: PLAYER_EYE_HEIGHT, z: -10.4, yaw: 0, pitch: 0 };

/**
 * ساخت کلابدرهای دقیق منطبق بر هندسه واقعی دیوارها، ستون‌ها، طاق میانی و مجسمه‌های موزه
 */
export function buildMuseumCollisionWorld(hall2DepthExtra: number): MuseumCollisionWorld {
  const endWallZ = -22 - hall2DepthExtra;
  const frontWallInnerZ = 4.5 - 0.175; // front wall center 4.5, thickness 0.35 -> inner face 4.325
  const backWallInnerZ = endWallZ + 0.175; // back wall center endWallZ, thickness 0.35
  const sideWallInnerX = 7.0 - 0.175; // side walls at ±7.0, thickness 0.35 -> inner face ±6.825

  const boxes: BoxCollider2D[] = [
    // Left & Right Outer Walls (for double-sided defense + clamping)
    { id: 'wall-west', minX: -7.4, maxX: -sideWallInnerX, minZ: endWallZ - 0.4, maxZ: 4.9 },
    { id: 'wall-east', minX: sideWallInnerX, maxX: 7.4, minZ: endWallZ - 0.4, maxZ: 4.9 },
    { id: 'wall-south-front', minX: -7.4, maxX: 7.4, minZ: frontWallInnerZ, maxZ: 4.9 },
    { id: 'wall-north-back', minX: -7.4, maxX: 7.4, minZ: endWallZ - 0.4, maxZ: backWallInnerZ },

    // Dividing Archway between Hall 1 and Hall 2 (at Z = -7.45, thickness = 0.36)
    // Open doorway cleanly spans X ∈ [-2.0, +2.0] (4.0m wide)
    { id: 'arch-flank-west', minX: -7.0, maxX: -2.0, minZ: -7.63, maxZ: -7.27 },
    { id: 'arch-flank-east', minX: 2.0, maxX: 7.0, minZ: -7.63, maxZ: -7.27 },
  ];

  // Columns along both halls (at X = ±6.25, radius = 0.28)
  const columnZs = [3.5, -1.0, -5.8, -11.4, -15.6, -20.0];
  for (let z = -24.6; z > endWallZ + 1; z -= 4.6) {
    columnZs.push(z);
  }
  const circles: CircleCollider2D[] = [];
  columnZs.forEach((z, idx) => {
    circles.push({ id: `col-w-${idx}`, x: -6.25, z, radius: 0.28 });
    circles.push({ id: `col-e-${idx}`, x: 6.25, z, radius: 0.28 });
  });

  // Central Sculptures (pedestal radius = 0.70)
  circles.push({ id: 'sculpture-heart', x: 0, z: -1.6, radius: 0.72 });
  circles.push({ id: 'sculpture-nebula', x: 0, z: -15.6, radius: 0.72 });

  return {
    bounds: {
      minX: -sideWallInnerX,
      maxX: sideWallInnerX,
      minZ: backWallInnerZ,
      maxZ: frontWallInnerZ,
      minY: 1.0,
      maxY: 4.85,
    },
    boxes,
    circles,
  };
}

/**
 * حل برخورد دایره کپسول با جعبه‌ها و دایره‌ها (با لغزش روان در امتداد دیوار و گوشه‌ها)
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

  const minX = world.bounds.minX + radius;
  const maxX = world.bounds.maxX - radius;
  const minZ = world.bounds.minZ + radius;
  const maxZ = world.bounds.maxZ - radius;

  const clampBounds = () => {
    if (px < minX) {
      px = minX;
      collided = true;
    } else if (px > maxX) {
      px = maxX;
      collided = true;
    }
    if (pz < minZ) {
      pz = minZ;
      collided = true;
    } else if (pz > maxZ) {
      pz = maxZ;
      collided = true;
    }
  };

  for (let pass = 0; pass < 6; pass++) {
    clampBounds();

    // 2. Push out of interior wall boxes (archway flanks, etc.)
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
          // Center inside AABB fallback: push out via nearest edge
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

    // 3. Push out of columns & sculptural pedestals
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
          let pushX = (dx / dist) * overlap;
          let pushZ = (dz / dist) * overlap;
          // If pinched between a side/end wall and a perimeter column, steer inward along X
          const nearSideWall =
            (cir.x < 0 && px <= minX + 0.05 && pushX < 0) ||
            (cir.x > 0 && px >= maxX - 0.05 && pushX > 0);
          if (nearSideWall) {
            pushX = (cir.x < 0 ? 1 : -1) * overlap;
          }
          px += pushX;
          pz += pushZ;
        } else {
          px += cir.x <= 0 ? minDist : -minDist;
        }
      }
    }

    // Hard boundary post-condition so no obstacle push can ever force capsule outside room walls
    clampBounds();
  }

  return { x: px, z: pz, collided };
}

/**
 * حرکت پیوسته با زیرگام‌بندی ضدعبور (Anti-Tunneling Swept Sub-stepping)
 * تضمین می‌کند حتی در سرعت‌های بالا یا افت فریم، دوربین از دیوار عبور نکند.
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

  const maxStep = Math.max(0.08, radius * 0.28); // <= 0.117m per step
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

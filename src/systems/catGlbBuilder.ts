import * as THREE from 'three';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import type { CatBreed } from '../core/types';

export interface BreedPalette {
  fur: string;
  furHighlight: string;
  furShadow: string;
  belly: string;
  earInner: string;
  nose: string;
  irisOuter: string;
  irisInner: string;
  stripe: string;
}

/**
 * رنگ اصلی خز گربه نارنجی — برای تغییر دستی رنگ خز، این کد رنگ را تغییر دهید
 */
export const DEFAULT_ORANGE_CAT_COLOR = '#f47b16';

export const BREED_PALETTES: Record<CatBreed, BreedPalette> = {
  honey: {
    fur: DEFAULT_ORANGE_CAT_COLOR,
    furHighlight: '#ffa347',
    furShadow: '#c74d08',
    belly: '#fff4e3',
    earInner: '#f4a5b5',
    nose: '#e67285',
    irisOuter: '#448b56',
    irisInner: '#e7c454',
    stripe: '#9e3304',
  },
  calico: {
    fur: '#f6ede3',
    furHighlight: '#ffffff',
    furShadow: '#df833f',
    belly: '#ffffff',
    earInner: '#f4adc0',
    nose: '#e68c9d',
    irisOuter: '#508a66',
    irisInner: '#e6bd5d',
    stripe: '#d9691f',
  },
  snow: {
    fur: '#f7f1eb',
    furHighlight: '#ffffff',
    furShadow: '#dfd5cb',
    belly: '#ffffff',
    earInner: '#f2b7c8',
    nose: '#ea9cb0',
    irisOuter: '#5691bc',
    irisInner: '#add9ee',
    stripe: '#e4d8cd',
  },
  mist: {
    fur: '#8c92a8',
    furHighlight: '#b0b6cc',
    furShadow: '#646980',
    belly: '#e6e8f2',
    earInner: '#e2b0be',
    nose: '#cc8899',
    irisOuter: '#b89440',
    irisInner: '#f2d374',
    stripe: '#585d73',
  },
  midnight: {
    fur: '#2a2c48',
    furHighlight: '#41446b',
    furShadow: '#17172b',
    belly: '#51547d',
    earInner: '#b9859e',
    nose: '#c88fa5',
    irisOuter: '#cda842',
    irisInner: '#fae17d',
    stripe: '#171729',
  },
};

function resolvePalette(breed: CatBreed, customFurColor?: string): BreedPalette {
  const base = BREED_PALETTES[breed] ?? BREED_PALETTES.honey;
  if (!customFurColor) return base;

  const main = new THREE.Color(customFurColor);
  const highlight = main.clone().lerp(new THREE.Color('#ffd8b0'), 0.36);
  const shadow = main.clone().lerp(new THREE.Color('#3a1503'), 0.32);
  const stripe = main.clone().lerp(new THREE.Color('#280c01'), 0.45);
  return {
    ...base,
    fur: `#${main.getHexString()}`,
    furHighlight: `#${highlight.getHexString()}`,
    furShadow: `#${shadow.getHexString()}`,
    stripe: `#${stripe.getHexString()}`,
  };
}

interface FurMapBundle {
  albedo: THREE.CanvasTexture;
  headAlbedo: THREE.CanvasTexture;
  normal: THREE.CanvasTexture;
  roughness: THREE.CanvasTexture;
  iris: THREE.CanvasTexture;
}

function paintFurStrokes(
  ctx: CanvasRenderingContext2D,
  size: number,
  highlight: string,
  shadow: string,
  count: number,
  alphaScale = 1
) {
  for (let i = 0; i < count; i++) {
    const x = (i * 73.13 + (i % 19) * 11) % size;
    const y = (i * 139.7 + (i % 23) * 7) % size;
    const len = 7 + (i % 8);
    const lean = ((i % 5) - 2) * 0.7;
    ctx.globalAlpha = (i % 3 === 0 ? 0.2 : 0.12) * alphaScale;
    ctx.strokeStyle = i % 3 === 0 ? highlight : shadow;
    ctx.lineWidth = 1.15;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + lean, y + len);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
}

function createFurMaps(p: BreedPalette): FurMapBundle {
  const size = 512;

  // 1. Body Fur Stripe/Luminance Map (multiplied cleanly by explicit furMat.color = palette.fur!)
  const albedoCanvas = document.createElement('canvas');
  albedoCanvas.width = size;
  albedoCanvas.height = size;
  const ctx = albedoCanvas.getContext('2d')!;

  ctx.fillStyle = '#f8f2ec';
  ctx.fillRect(0, 0, size, size);

  for (let i = 0; i < 55; i++) {
    const px = (i * 97) % size;
    const py = (i * 151) % size;
    const r = 34 + (i % 4) * 14;
    const rg = ctx.createRadialGradient(px, py, 2, px, py, r);
    rg.addColorStop(0, i % 2 === 0 ? '#ffffff' : '#d4a682');
    rg.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.globalAlpha = 0.22;
    ctx.fillStyle = rg;
    ctx.beginPath();
    ctx.arc(px, py, r, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.globalAlpha = 0.48;
  ctx.strokeStyle = '#9c542c';
  ctx.lineCap = 'round';
  for (let y = 26; y < size; y += 54) {
    ctx.lineWidth = 14 + (y % 7);
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.bezierCurveTo(size * 0.28, y + 15, size * 0.72, y - 15, size, y + 6);
    ctx.stroke();

    ctx.lineWidth = 6;
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.moveTo(0, y + 18);
    ctx.bezierCurveTo(size * 0.35, y + 4, size * 0.65, y + 24, size, y + 14);
    ctx.stroke();
    ctx.globalAlpha = 0.48;
  }

  paintFurStrokes(ctx, size, '#ffffff', '#b2683e', 3200, 1);

  const albedo = new THREE.CanvasTexture(albedoCanvas);
  albedo.colorSpace = THREE.SRGBColorSpace;
  albedo.wrapS = THREE.RepeatWrapping;
  albedo.wrapT = THREE.RepeatWrapping;
  albedo.needsUpdate = true;

  // 2. Dedicated Anatomically Painted Head Fur Map
  // HeadMesh uses SphereGeometry(phiStart = -PI/2, phiLength = 2*PI), so u=0.5 (x=256) is dead-center front face!
  const headCanvas = document.createElement('canvas');
  headCanvas.width = size;
  headCanvas.height = size;
  const hctx = headCanvas.getContext('2d')!;

  const hGrad = hctx.createRadialGradient(256, 235, 30, 256, 240, 270);
  hGrad.addColorStop(0, p.furHighlight);
  hGrad.addColorStop(0.55, p.fur);
  hGrad.addColorStop(1, p.furShadow);
  hctx.fillStyle = hGrad;
  hctx.fillRect(0, 0, size, size);

  // Subtle top-of-crown & back-of-head tabby bands
  hctx.strokeStyle = p.stripe;
  hctx.lineCap = 'round';
  hctx.globalAlpha = 0.32;
  for (let i = 0; i < 3; i++) {
    hctx.lineWidth = 8 - i * 1.4;
    const offset = (i - 1) * 18;
    hctx.beginPath();
    hctx.moveTo(256 + offset * 0.7, 152);
    hctx.quadraticCurveTo(256 + offset * 1.15, 92, 256 + offset * 1.45, 32);
    hctx.stroke();
  }

  // Classic cute ginger tabby "M" forehead marking centered right above the eyes (y ~ 154..206)
  hctx.strokeStyle = p.stripe;
  hctx.lineWidth = 6.5;
  hctx.globalAlpha = 0.48;
  hctx.beginPath();
  hctx.moveTo(222, 198);
  hctx.quadraticCurveTo(228, 166, 238, 162);
  hctx.quadraticCurveTo(248, 175, 256, 194);
  hctx.quadraticCurveTo(264, 175, 274, 162);
  hctx.quadraticCurveTo(284, 166, 290, 198);
  hctx.stroke();

  // Delicate outer brow arches above each eye
  hctx.lineWidth = 4.2;
  hctx.globalAlpha = 0.36;
  for (const dir of [-1, 1]) {
    hctx.beginPath();
    hctx.moveTo(256 + dir * 22, 206);
    hctx.quadraticCurveTo(256 + dir * 48, 192, 256 + dir * 68, 214);
    hctx.stroke();
  }

  // Cute tabby cheek whisker-stripes sweeping smoothly from outer eye corners toward cheeks
  hctx.globalAlpha = 0.38;
  for (const dir of [-1, 1]) {
    hctx.lineWidth = 5.5;
    hctx.beginPath();
    hctx.moveTo(256 + dir * 56, 254);
    hctx.quadraticCurveTo(256 + dir * 92, 260, 256 + dir * 124, 274);
    hctx.stroke();

    hctx.lineWidth = 4.2;
    hctx.beginPath();
    hctx.moveTo(256 + dir * 58, 272);
    hctx.quadraticCurveTo(256 + dir * 90, 282, 256 + dir * 118, 298);
    hctx.stroke();
  }

  // Soft warm cream-apricot highlight around under-eyes, nose bridge, and lower muzzle blend
  for (const dir of [-1, 1]) {
    const eyeGlow = hctx.createRadialGradient(256 + dir * 35, 246, 3, 256 + dir * 35, 246, 22);
    eyeGlow.addColorStop(0, p.belly);
    eyeGlow.addColorStop(1, 'rgba(255,244,227,0)');
    hctx.globalAlpha = 0.2;
    hctx.fillStyle = eyeGlow;
    hctx.beginPath();
    hctx.arc(256 + dir * 35, 246, 22, 0, Math.PI * 2);
    hctx.fill();
  }

  const muzzleBlend = hctx.createRadialGradient(256, 328, 8, 256, 328, 52);
  muzzleBlend.addColorStop(0, p.belly);
  muzzleBlend.addColorStop(0.55, p.furHighlight);
  muzzleBlend.addColorStop(1, 'rgba(255,244,227,0)');
  hctx.globalAlpha = 0.45;
  hctx.fillStyle = muzzleBlend;
  hctx.beginPath();
  hctx.arc(256, 328, 52, 0, Math.PI * 2);
  hctx.fill();

  // Gentle soft fur strokes on head (keeps face velvety & clean without muddy noise)
  paintFurStrokes(hctx, size, p.furHighlight, p.furShadow, 2100, 0.55);

  const headAlbedo = new THREE.CanvasTexture(headCanvas);
  headAlbedo.colorSpace = THREE.SRGBColorSpace;
  headAlbedo.wrapS = THREE.ClampToEdgeWrapping;
  headAlbedo.wrapT = THREE.ClampToEdgeWrapping;

  // 3. Tangent-space Normal Map encoding delicate velvety fur ridges
  const normCanvas = document.createElement('canvas');
  normCanvas.width = 256;
  normCanvas.height = 256;
  const nctx = normCanvas.getContext('2d')!;
  nctx.fillStyle = 'rgb(128,128,255)';
  nctx.fillRect(0, 0, 256, 256);

  for (let i = 0; i < 1500; i++) {
    const x = (i * 61) % 256;
    const y = (i * 113) % 256;
    const nx = 116 + (i % 25);
    const ny = 123 + (i % 12);
    nctx.strokeStyle = `rgb(${nx},${ny},244)`;
    nctx.lineWidth = 1.25;
    nctx.beginPath();
    nctx.moveTo(x, y);
    nctx.lineTo(x + 1, y + 8);
    nctx.stroke();
  }
  const normal = new THREE.CanvasTexture(normCanvas);
  normal.wrapS = THREE.RepeatWrapping;
  normal.wrapT = THREE.RepeatWrapping;

  // 4. Roughness Map (velvety matte coat 0.74..0.90)
  const roughCanvas = document.createElement('canvas');
  roughCanvas.width = 256;
  roughCanvas.height = 256;
  const rctx = roughCanvas.getContext('2d')!;
  rctx.fillStyle = '#d4d4d4';
  rctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 1200; i++) {
    const x = (i * 53) % 256;
    const y = (i * 97) % 256;
    const v = 188 + (i % 50);
    rctx.strokeStyle = `rgb(${v},${v},${v})`;
    rctx.lineWidth = 1.4;
    rctx.beginPath();
    rctx.moveTo(x, y);
    rctx.lineTo(x + 1, y + 8);
    rctx.stroke();
  }
  const roughness = new THREE.CanvasTexture(roughCanvas);
  roughness.wrapS = THREE.RepeatWrapping;
  roughness.wrapT = THREE.RepeatWrapping;

  // 5. High-Res Luminous Feline Iris Texture (planar frontal mapped: crystal sharp!)
  const irisCanvas = document.createElement('canvas');
  irisCanvas.width = 512;
  irisCanvas.height = 512;
  const ictx = irisCanvas.getContext('2d')!;
  const cx = 256;
  const cy = 256;

  // Warm sclera-to-limbal outer margin
  ictx.fillStyle = '#132419';
  ictx.fillRect(0, 0, 512, 512);

  const irad = ictx.createRadialGradient(cx, cy, 40, cx, cy, 232);
  irad.addColorStop(0, p.irisInner);
  irad.addColorStop(0.45, p.irisOuter);
  irad.addColorStop(0.84, '#1b3e28');
  irad.addColorStop(1, '#0e1b13');
  ictx.fillStyle = irad;
  ictx.beginPath();
  ictx.arc(cx, cy, 240, 0, Math.PI * 2);
  ictx.fill();

  // Golden inner starburst ring around pupil
  for (let a = 0; a < 120; a++) {
    const ang = (a / 120) * Math.PI * 2;
    const r0 = 56 + (a % 3) * 8;
    const r1 = 196 + (a % 5) * 6;
    ictx.strokeStyle = a % 2 === 0 ? 'rgba(255,244,195,0.28)' : 'rgba(14,36,22,0.28)';
    ictx.lineWidth = a % 3 === 0 ? 2.6 : 1.6;
    ictx.beginPath();
    ictx.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0);
    ictx.lineTo(cx + Math.cos(ang) * r1, cy + Math.sin(ang) * r1);
    ictx.stroke();
  }

  // Subtle upper eyelid ambient cast-shadow gradient for soulful depth
  const lidShadow = ictx.createLinearGradient(0, 20, 0, 240);
  lidShadow.addColorStop(0, 'rgba(8, 12, 10, 0.52)');
  lidShadow.addColorStop(0.5, 'rgba(8, 12, 10, 0.14)');
  lidShadow.addColorStop(1, 'rgba(8, 12, 10, 0)');
  ictx.fillStyle = lidShadow;
  ictx.fillRect(0, 0, 512, 240);

  const iris = new THREE.CanvasTexture(irisCanvas);
  iris.colorSpace = THREE.SRGBColorSpace;
  iris.wrapS = THREE.ClampToEdgeWrapping;
  iris.wrapT = THREE.ClampToEdgeWrapping;
  iris.needsUpdate = true;
  headAlbedo.needsUpdate = true;
  normal.needsUpdate = true;
  roughness.needsUpdate = true;

  return { albedo, headAlbedo, normal, roughness, iris };
}

function createSculptedTorsoGeometry(): THREE.LatheGeometry {
  const pts = [
    new THREE.Vector2(0.01, -0.27),
    new THREE.Vector2(0.115, -0.25),
    new THREE.Vector2(0.18, -0.19),
    new THREE.Vector2(0.198, -0.10),
    new THREE.Vector2(0.178, 0.01),
    new THREE.Vector2(0.20, 0.13),
    new THREE.Vector2(0.17, 0.22),
    new THREE.Vector2(0.108, 0.27),
    new THREE.Vector2(0.01, 0.285),
  ];
  const geo = new THREE.LatheGeometry(pts, 28);
  geo.rotateX(Math.PI / 2);
  geo.scale(0.93, 1.0, 1.06);
  geo.computeVertexNormals();
  return geo;
}

function createSculptedHeadGeometry(): THREE.BufferGeometry {
  // phiStart = -PI/2 ensures seam is cleanly at the back of the skull (-Z) and u=0.5 is dead-center front (+Z)
  const geo = new THREE.SphereGeometry(0.205, 36, 28, -Math.PI / 2, Math.PI * 2);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    let y = pos.getY(i);
    let z = pos.getZ(i);

    // Appeal-oriented rounded feline cheek flare + soft crown dome
    const cheekFactor = Math.exp(-Math.pow((y + 0.032) / 0.105, 2));
    x *= 1.08 + 0.14 * cheekFactor;

    if (y > 0.045) {
      y *= 0.91;
    } else {
      x *= 0.96;
    }

    // Smooth forward nose bridge, eye socket recess hint, & rounded muzzle contour
    if (z > 0.02) {
      const browFactor = Math.exp(-Math.pow((y - 0.062) / 0.085, 2));
      const bridgeFactor = Math.exp(-Math.pow(x / 0.055, 2)) * Math.exp(-Math.pow((y + 0.015) / 0.075, 2));
      const muzzleFactor = Math.exp(-Math.pow((y + 0.052) / 0.075, 2)) * Math.exp(-Math.pow(x / 0.115, 2));
      z += 0.018 * browFactor + 0.032 * bridgeFactor + 0.046 * muzzleFactor;
    }

    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  return geo;
}

function createSculptedEarGeometry(width: number, height: number, depth: number): THREE.BufferGeometry {
  // Lathe profile with softly rounded tip (never a sharp needle spike!)
  const pts = [
    new THREE.Vector2(0.0, -height * 0.5),
    new THREE.Vector2(width * 0.98, -height * 0.45),
    new THREE.Vector2(width * 0.86, -height * 0.15),
    new THREE.Vector2(width * 0.62, height * 0.16),
    new THREE.Vector2(width * 0.34, height * 0.39),
    new THREE.Vector2(width * 0.13, height * 0.48),
    new THREE.Vector2(0.0, height * 0.5),
  ];
  const geo = new THREE.LatheGeometry(pts, 20);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i);
    const y = pos.getY(i);
    let z = pos.getZ(i);

    const hNorm = THREE.MathUtils.clamp((y + height * 0.5) / height, 0, 1);
    // Flatten & softly cup the front face while rounding the back pinna
    z *= depth / width;
    if (z > 0) {
      z *= 0.42;
    } else {
      z -= Math.sin(hNorm * Math.PI) * 0.014;
    }
    x *= 1 + Math.sin(hNorm * Math.PI) * 0.06;
    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  return geo;
}

function createIrisDomeGeometry(radius: number): THREE.BufferGeometry {
  // Front-facing dome (phi: 0..PI -> strictly +Z) with planar XY frontal UV mapping so iris rings have zero pinch
  const geo = new THREE.SphereGeometry(radius, 28, 22, 0, Math.PI, 0, Math.PI);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i);
    const y = pos.getY(i);
    const u = 0.5 + (x / radius) * 0.47;
    const v = 0.5 + (y / radius) * 0.47;
    uv.setXY(i, u, v);
  }
  uv.needsUpdate = true;
  geo.computeVertexNormals();
  return geo;
}

function createNoseGeometry(): THREE.ExtrudeGeometry {
  const shape = new THREE.Shape();
  shape.moveTo(0, -0.017);
  shape.quadraticCurveTo(0.023, 0.002, 0.025, 0.015);
  shape.quadraticCurveTo(0, 0.022, -0.025, 0.015);
  shape.quadraticCurveTo(-0.023, 0.002, 0, -0.017);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.015,
    bevelEnabled: true,
    bevelSegments: 4,
    steps: 1,
    bevelSize: 0.006,
    bevelThickness: 0.006,
  });
  geo.center();
  return geo;
}

function createWhiskerTube(points: THREE.Vector3[]): THREE.TubeGeometry {
  const curve = new THREE.CatmullRomCurve3(points);
  return new THREE.TubeGeometry(curve, 12, 0.0017, 6, false);
}

function quatTrack(nodeName: string, times: number[], eulerPoints: [number, number, number][]) {
  const values: number[] = [];
  const q = new THREE.Quaternion();
  const e = new THREE.Euler();
  for (const [x, y, z] of eulerPoints) {
    e.set(x, y, z, 'XYZ');
    q.setFromEuler(e);
    values.push(q.x, q.y, q.z, q.w);
  }
  return new THREE.QuaternionKeyframeTrack(`${nodeName}.quaternion`, times, values);
}

function posTrack(nodeName: string, times: number[], points: [number, number, number][]) {
  return new THREE.VectorKeyframeTrack(`${nodeName}.position`, times, points.flat());
}

function scaleTrack(nodeName: string, times: number[], scales: [number, number, number][]) {
  return new THREE.VectorKeyframeTrack(`${nodeName}.scale`, times, scales.flat());
}

function buildCatAnimationClips(): THREE.AnimationClip[] {
  const idleClip = new THREE.AnimationClip('Idle', 3.4, [
    posTrack('BodyPivot', [0, 1.7, 3.4], [[0, 0.36, 0], [0, 0.376, 0], [0, 0.36, 0]]),
    quatTrack('BodyPivot', [0, 3.4], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('HeadPivot', [0, 1.1, 2.3, 3.4], [[0.02, 0, 0], [-0.03, 0.09, 0.04], [0.01, -0.08, -0.03], [0.02, 0, 0]]),
    quatTrack('JawPivot', [0, 3.4], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('LegFL', [0, 3.4], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('LegFR', [0, 3.4], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('LegBL', [0, 3.4], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('LegBR', [0, 3.4], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('TailPivot1', [0, 0.85, 1.7, 2.55, 3.4], [[0.42, 0, 0], [0.46, 0.24, 0.08], [0.42, 0, 0], [0.46, -0.24, -0.08], [0.42, 0, 0]]),
    quatTrack('TailPivot2', [0, 0.85, 1.7, 2.55, 3.4], [[0.28, 0, 0], [0.36, 0.32, 0], [0.28, 0, 0], [0.36, -0.32, 0], [0.28, 0, 0]]),
    quatTrack('TailPivot3', [0, 0.85, 1.7, 2.55, 3.4], [[0.18, 0, 0], [0.25, 0.28, 0], [0.18, 0, 0], [0.25, -0.28, 0], [0.18, 0, 0]]),
    quatTrack('EarL', [0, 2.0, 2.15, 2.3, 3.4], [[0, 0, -0.22], [0, 0, -0.22], [0.18, 0, -0.34], [0, 0, -0.22], [0, 0, -0.22]]),
  ]);

  const walkClip = new THREE.AnimationClip('Walk', 0.85, [
    posTrack('BodyPivot', [0, 0.21, 0.425, 0.64, 0.85], [[0, 0.36, 0], [0, 0.388, 0], [0, 0.36, 0], [0, 0.388, 0], [0, 0.36, 0]]),
    quatTrack('BodyPivot', [0, 0.425, 0.85], [[0, 0, 0.025], [0, 0, -0.025], [0, 0, 0.025]]),
    quatTrack('LegFL', [0, 0.21, 0.425, 0.64, 0.85], [[0.42, 0, 0], [0, 0, 0], [-0.44, 0, 0], [0, 0, 0], [0.42, 0, 0]]),
    quatTrack('LegBR', [0, 0.21, 0.425, 0.64, 0.85], [[0.42, 0, 0], [0, 0, 0], [-0.44, 0, 0], [0, 0, 0], [0.42, 0, 0]]),
    quatTrack('LegFR', [0, 0.21, 0.425, 0.64, 0.85], [[-0.44, 0, 0], [0, 0, 0], [0.42, 0, 0], [0, 0, 0], [-0.44, 0, 0]]),
    quatTrack('LegBL', [0, 0.21, 0.425, 0.64, 0.85], [[-0.44, 0, 0], [0, 0, 0], [0.42, 0, 0], [0, 0, 0], [-0.44, 0, 0]]),
    quatTrack('HeadPivot', [0, 0.425, 0.85], [[-0.03, 0.05, 0], [-0.03, -0.05, 0], [-0.03, 0.05, 0]]),
    quatTrack('JawPivot', [0, 0.85], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('TailPivot1', [0, 0.425, 0.85], [[0.78, 0.2, 0], [0.78, -0.2, 0], [0.78, 0.2, 0]]),
    quatTrack('TailPivot2', [0, 0.425, 0.85], [[0.25, 0.28, 0], [0.25, -0.28, 0], [0.25, 0.28, 0]]),
    quatTrack('TailPivot3', [0, 0.425, 0.85], [[0.15, 0.2, 0], [0.15, -0.2, 0], [0.15, 0.2, 0]]),
  ]);

  const runClip = new THREE.AnimationClip('Run', 0.56, [
    posTrack('BodyPivot', [0, 0.14, 0.28, 0.42, 0.56], [[0, 0.36, 0], [0, 0.47, 0.04], [0, 0.35, 0], [0, 0.44, -0.03], [0, 0.36, 0]]),
    quatTrack('BodyPivot', [0, 0.14, 0.28, 0.42, 0.56], [[0.12, 0, 0], [-0.14, 0, 0], [0.1, 0, 0], [-0.08, 0, 0], [0.12, 0, 0]]),
    quatTrack('LegFL', [0, 0.14, 0.28, 0.42, 0.56], [[-0.75, 0, 0], [-0.1, 0, 0], [0.68, 0, 0], [-0.2, 0, 0], [-0.75, 0, 0]]),
    quatTrack('LegFR', [0, 0.14, 0.28, 0.42, 0.56], [[-0.55, 0, 0], [-0.2, 0, 0], [0.72, 0, 0], [-0.1, 0, 0], [-0.55, 0, 0]]),
    quatTrack('LegBL', [0, 0.14, 0.28, 0.42, 0.56], [[0.72, 0, 0], [0.1, 0, 0], [-0.68, 0, 0], [0.15, 0, 0], [0.72, 0, 0]]),
    quatTrack('LegBR', [0, 0.14, 0.28, 0.42, 0.56], [[0.58, 0, 0], [0.15, 0, 0], [-0.72, 0, 0], [0.1, 0, 0], [0.58, 0, 0]]),
    quatTrack('HeadPivot', [0, 0.28, 0.56], [[-0.1, 0, 0], [0.06, 0, 0], [-0.1, 0, 0]]),
    quatTrack('JawPivot', [0, 0.56], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('TailPivot1', [0, 0.28, 0.56], [[0.92, 0.18, 0], [0.92, -0.18, 0], [0.92, 0.18, 0]]),
  ]);

  const sitClip = new THREE.AnimationClip('Sit', 2.8, [
    posTrack('BodyPivot', [0, 1.4, 2.8], [[0, 0.29, -0.04], [0, 0.30, -0.04], [0, 0.29, -0.04]]),
    quatTrack('BodyPivot', [0, 2.8], [[-0.32, 0, 0], [-0.32, 0, 0]]),
    quatTrack('HeadPivot', [0, 1.4, 2.8], [[0.24, 0.08, 0.03], [0.26, -0.08, -0.03], [0.24, 0.08, 0.03]]),
    quatTrack('JawPivot', [0, 2.8], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('LegBL', [0, 2.8], [[1.18, 0, 0], [1.18, 0, 0]]),
    quatTrack('LegBR', [0, 2.8], [[1.18, 0, 0], [1.18, 0, 0]]),
    quatTrack('LegFL', [0, 2.8], [[0.24, 0, 0], [0.24, 0, 0]]),
    quatTrack('LegFR', [0, 2.8], [[0.24, 0, 0], [0.24, 0, 0]]),
    quatTrack('TailPivot1', [0, 1.4, 2.8], [[-0.1, 0.55, 0.2], [-0.1, 0.35, 0.1], [-0.1, 0.55, 0.2]]),
    quatTrack('TailPivot2', [0, 1.4, 2.8], [[0.2, 0.45, 0], [0.2, 0.65, 0], [0.2, 0.45, 0]]),
    quatTrack('TailPivot3', [0, 1.4, 2.8], [[0.2, 0.35, 0], [0.2, 0.5, 0], [0.2, 0.35, 0]]),
  ]);

  const sleepClip = new THREE.AnimationClip('Sleep', 3.4, [
    posTrack('BodyPivot', [0, 1.7, 3.4], [[0, 0.18, 0], [0, 0.198, 0], [0, 0.18, 0]]),
    quatTrack('BodyPivot', [0, 3.4], [[0.04, 0, 0.12], [0.04, 0, 0.12]]),
    quatTrack('HeadPivot', [0, 1.7, 3.4], [[0.34, 0.35, 0.18], [0.38, 0.35, 0.18], [0.34, 0.35, 0.18]]),
    quatTrack('JawPivot', [0, 3.4], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('LegFL', [0, 3.4], [[-1.18, 0, 0.1], [-1.18, 0, 0.1]]),
    quatTrack('LegFR', [0, 3.4], [[-1.18, 0, -0.1], [-1.18, 0, -0.1]]),
    quatTrack('LegBL', [0, 3.4], [[1.16, 0, 0], [1.16, 0, 0]]),
    quatTrack('LegBR', [0, 3.4], [[1.16, 0, 0], [1.16, 0, 0]]),
    quatTrack('TailPivot1', [0, 1.7, 3.4], [[-0.22, 0.95, 0.32], [-0.22, 0.88, 0.32], [-0.22, 0.95, 0.32]]),
    quatTrack('TailPivot2', [0, 1.7, 3.4], [[-0.1, 0.72, 0.2], [-0.1, 0.65, 0.2], [-0.1, 0.72, 0.2]]),
    quatTrack('TailPivot3', [0, 1.7, 3.4], [[0, 0.65, 0], [0, 0.6, 0], [0, 0.65, 0]]),
  ]);

  const stretchClip = new THREE.AnimationClip('Stretch', 2.4, [
    posTrack('BodyPivot', [0, 0.6, 1.6, 2.4], [[0, 0.36, 0], [0, 0.27, 0.08], [0, 0.27, 0.08], [0, 0.36, 0]]),
    quatTrack('BodyPivot', [0, 0.6, 1.6, 2.4], [[0, 0, 0], [0.34, 0, 0], [0.34, 0, 0], [0, 0, 0]]),
    quatTrack('LegFL', [0, 0.6, 1.6, 2.4], [[0, 0, 0], [-1.05, 0, 0.08], [-1.05, 0, 0.08], [0, 0, 0]]),
    quatTrack('LegFR', [0, 0.6, 1.6, 2.4], [[0, 0, 0], [-1.05, 0, -0.08], [-1.05, 0, -0.08], [0, 0, 0]]),
    quatTrack('LegBL', [0, 2.4], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('LegBR', [0, 2.4], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('HeadPivot', [0, 0.6, 1.6, 2.4], [[0, 0, 0], [-0.3, 0, 0], [-0.3, 0, 0], [0, 0, 0]]),
    quatTrack('JawPivot', [0, 0.8, 1.5, 2.4], [[0, 0, 0], [0.18, 0, 0], [0.18, 0, 0], [0, 0, 0]]),
    quatTrack('TailPivot1', [0, 0.6, 1.6, 2.4], [[0.45, 0, 0], [1.18, 0, 0], [1.18, 0, 0], [0.45, 0, 0]]),
    quatTrack('TailPivot2', [0, 0.6, 1.6, 2.4], [[0.25, 0, 0], [0.45, 0, 0], [0.45, 0, 0], [0.25, 0, 0]]),
  ]);

  const yawnClip = new THREE.AnimationClip('Yawn', 2.2, [
    posTrack('BodyPivot', [0, 0.9, 1.6, 2.2], [[0, 0.32, -0.02], [0, 0.34, -0.02], [0, 0.33, -0.02], [0, 0.32, -0.02]]),
    quatTrack('BodyPivot', [0, 2.2], [[-0.22, 0, 0], [-0.22, 0, 0]]),
    quatTrack('LegBL', [0, 2.2], [[0.9, 0, 0], [0.9, 0, 0]]),
    quatTrack('LegBR', [0, 2.2], [[0.9, 0, 0], [0.9, 0, 0]]),
    quatTrack('HeadPivot', [0, 0.55, 1.45, 2.2], [[0.14, 0, 0], [-0.22, 0.06, 0], [-0.2, -0.04, 0], [0.14, 0, 0]]),
    quatTrack('JawPivot', [0, 0.45, 1.15, 1.65, 2.2], [[0, 0, 0], [0.58, 0, 0], [0.64, 0, 0], [0.12, 0, 0], [0, 0, 0]]),
    quatTrack('EarL', [0, 0.55, 1.45, 2.2], [[0, 0, -0.22], [0.18, 0, -0.52], [0.18, 0, -0.52], [0, 0, -0.22]]),
    quatTrack('EarR', [0, 0.55, 1.45, 2.2], [[0, 0, 0.22], [0.18, 0, 0.52], [0.18, 0, 0.52], [0, 0, 0.22]]),
    scaleTrack('EyeL', [0, 0.5, 1.5, 2.2], [[1, 1, 1], [1, 0.3, 1], [1, 0.3, 1], [1, 1, 1]]),
    scaleTrack('EyeR', [0, 0.5, 1.5, 2.2], [[1, 1, 1], [1, 0.3, 1], [1, 0.3, 1], [1, 1, 1]]),
  ]);

  const lickPawClip = new THREE.AnimationClip('LickPaw', 2.4, [
    posTrack('BodyPivot', [0, 2.4], [[0, 0.3, -0.03], [0, 0.3, -0.03]]),
    quatTrack('BodyPivot', [0, 2.4], [[-0.28, 0, 0], [-0.28, 0, 0]]),
    quatTrack('LegBL', [0, 2.4], [[1.1, 0, 0], [1.1, 0, 0]]),
    quatTrack('LegBR', [0, 2.4], [[1.1, 0, 0], [1.1, 0, 0]]),
    quatTrack('LegFR', [0, 2.4], [[0.2, 0, 0], [0.2, 0, 0]]),
    quatTrack('LegFL', [0, 0.35, 1.9, 2.4], [[0.2, 0, 0], [-1.18, -0.2, -0.28], [-1.18, -0.2, -0.28], [0.2, 0, 0]]),
    quatTrack('HeadPivot', [0, 0.4, 0.75, 1.1, 1.45, 1.85, 2.4], [
      [0.2, 0, 0],
      [0.42, 0.16, 0.12],
      [0.24, 0.12, 0.08],
      [0.44, 0.18, 0.14],
      [0.24, 0.12, 0.08],
      [0.36, 0.24, 0.22],
      [0.2, 0, 0],
    ]),
    quatTrack('JawPivot', [0, 0.5, 0.75, 1.1, 1.45, 2.4], [[0, 0, 0], [0.24, 0, 0], [0, 0, 0], [0.24, 0, 0], [0, 0, 0], [0, 0, 0]]),
  ]);

  const groomClip = new THREE.AnimationClip('Groom', 2.6, [
    posTrack('BodyPivot', [0, 2.6], [[0, 0.28, -0.02], [0, 0.28, -0.02]]),
    quatTrack('BodyPivot', [0, 1.3, 2.6], [[-0.2, 0, 0], [-0.22, 0.08, 0], [-0.2, 0, 0]]),
    quatTrack('LegBL', [0, 2.6], [[1.0, 0, 0], [1.0, 0, 0]]),
    quatTrack('LegBR', [0, 2.6], [[1.0, 0, 0], [1.0, 0, 0]]),
    quatTrack('LegFL', [0, 2.6], [[0.15, 0, 0.1], [0.15, 0, 0.1]]),
    quatTrack('LegFR', [0, 2.6], [[0.15, 0, -0.1], [0.15, 0, -0.1]]),
    quatTrack('HeadPivot', [0, 0.45, 0.9, 1.35, 1.8, 2.2, 2.6], [
      [0.22, 0.1, 0],
      [0.52, -0.45, -0.22],
      [0.34, -0.35, -0.15],
      [0.54, -0.45, -0.22],
      [0.36, 0.35, 0.18],
      [0.52, 0.42, 0.2],
      [0.22, 0.1, 0],
    ]),
    quatTrack('JawPivot', [0, 0.5, 1.0, 1.5, 2.0, 2.6], [[0, 0, 0], [0.22, 0, 0], [0, 0, 0], [0.22, 0, 0], [0, 0, 0], [0, 0, 0]]),
  ]);

  const playClip = new THREE.AnimationClip('Play', 0.96, [
    posTrack('BodyPivot', [0, 0.24, 0.48, 0.72, 0.96], [[0, 0.36, 0], [0, 0.58, 0.08], [0, 0.35, 0], [0, 0.52, -0.04], [0, 0.36, 0]]),
    quatTrack('BodyPivot', [0, 0.24, 0.48, 0.72, 0.96], [[0, 0, 0], [-0.22, 0.1, 0], [0, 0, 0], [-0.14, -0.1, 0], [0, 0, 0]]),
    quatTrack('LegFL', [0, 0.24, 0.48, 0.96], [[0, 0, 0], [-0.95, 0, 0.2], [0, 0, 0], [0, 0, 0]]),
    quatTrack('LegFR', [0, 0.24, 0.48, 0.96], [[0, 0, 0], [-0.65, 0, -0.2], [0, 0, 0], [0, 0, 0]]),
    quatTrack('LegBL', [0, 0.96], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('LegBR', [0, 0.96], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('JawPivot', [0, 0.96], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('TailPivot1', [0, 0.24, 0.48, 0.72, 0.96], [[0.9, 0, 0], [1.1, 0.4, 0], [0.9, 0, 0], [1.1, -0.4, 0], [0.9, 0, 0]]),
  ]);

  const eatClip = new THREE.AnimationClip('Eat', 1.0, [
    posTrack('BodyPivot', [0, 0.5, 1.0], [[0, 0.32, 0], [0, 0.31, 0], [0, 0.32, 0]]),
    quatTrack('BodyPivot', [0, 1.0], [[0.08, 0, 0], [0.08, 0, 0]]),
    quatTrack('LegFL', [0, 1.0], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('LegFR', [0, 1.0], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('LegBL', [0, 1.0], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('LegBR', [0, 1.0], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('HeadPivot', [0, 0.25, 0.5, 0.75, 1.0], [[0.48, 0, 0], [0.64, 0, 0], [0.46, 0, 0], [0.64, 0, 0], [0.48, 0, 0]]),
    quatTrack('JawPivot', [0, 0.25, 0.5, 0.75, 1.0], [[0, 0, 0], [0.25, 0, 0], [0.02, 0, 0], [0.25, 0, 0], [0, 0, 0]]),
    quatTrack('TailPivot1', [0, 0.5, 1.0], [[0.65, 0.25, 0], [0.65, -0.25, 0], [0.65, 0.25, 0]]),
  ]);

  const drinkClip = new THREE.AnimationClip('Drink', 1.2, [
    posTrack('BodyPivot', [0, 0.6, 1.2], [[0, 0.31, 0], [0, 0.305, 0], [0, 0.31, 0]]),
    quatTrack('BodyPivot', [0, 1.2], [[0.08, 0, 0], [0.08, 0, 0]]),
    quatTrack('LegFL', [0, 1.2], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('LegFR', [0, 1.2], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('LegBL', [0, 1.2], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('LegBR', [0, 1.2], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('HeadPivot', [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2], [
      [0.52, 0, 0],
      [0.62, 0, 0],
      [0.5, 0, 0],
      [0.62, 0, 0],
      [0.5, 0, 0],
      [0.62, 0, 0],
      [0.52, 0, 0],
    ]),
    quatTrack('JawPivot', [0, 0.2, 0.4, 0.6, 0.8, 1.0, 1.2], [[0, 0, 0], [0.22, 0, 0], [0, 0, 0], [0.22, 0, 0], [0, 0, 0], [0.22, 0, 0], [0, 0, 0]]),
    quatTrack('TailPivot1', [0, 0.6, 1.2], [[0.5, 0.15, 0], [0.5, -0.15, 0], [0.5, 0.15, 0]]),
  ]);

  const bathClip = new THREE.AnimationClip('Bath', 1.4, [
    posTrack('BodyPivot', [0, 0.7, 1.4], [[0, 0.33, 0], [0, 0.34, 0], [0, 0.33, 0]]),
    quatTrack('BodyPivot', [0, 1.4], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('HeadPivot', [0, 0.35, 0.7, 1.05, 1.4], [[0.1, 0, 0.2], [0.2, 0.25, 0.1], [0.1, 0, -0.2], [0.2, -0.25, -0.1], [0.1, 0, 0.2]]),
    quatTrack('JawPivot', [0, 1.4], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('LegFL', [0, 0.35, 0.7, 1.05, 1.4], [[0, 0, 0], [-0.85, 0, 0.15], [-0.6, 0, 0.1], [-0.85, 0, 0.15], [0, 0, 0]]),
    quatTrack('LegFR', [0, 1.4], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('LegBL', [0, 1.4], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('LegBR', [0, 1.4], [[0, 0, 0], [0, 0, 0]]),
  ]);

  const happyClip = new THREE.AnimationClip('Happy', 1.4, [
    posTrack('BodyPivot', [0, 0.35, 0.7, 1.05, 1.4], [[0, 0.36, 0], [0, 0.4, 0], [0, 0.36, 0], [0, 0.4, 0], [0, 0.36, 0]]),
    quatTrack('BodyPivot', [0, 1.4], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('HeadPivot', [0, 0.35, 0.7, 1.05, 1.4], [[0, 0, 0.16], [-0.08, 0.14, -0.14], [0, 0, 0.16], [-0.08, -0.14, -0.14], [0, 0, 0.16]]),
    quatTrack('JawPivot', [0, 1.4], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('LegFL', [0, 1.4], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('LegFR', [0, 1.4], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('LegBL', [0, 1.4], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('LegBR', [0, 1.4], [[0, 0, 0], [0, 0, 0]]),
    quatTrack('TailPivot1', [0, 0.35, 0.7, 1.05, 1.4], [[0.98, 0.25, 0], [0.98, -0.25, 0], [0.98, 0.25, 0], [0.98, -0.25, 0], [0.98, 0.25, 0]]),
    quatTrack('TailPivot2', [0, 0.7, 1.4], [[0.25, 0.15, 0], [0.25, -0.15, 0], [0.25, 0.15, 0]]),
    quatTrack('TailPivot3', [0, 0.7, 1.4], [[0.28, 0, 0], [0.28, 0, 0], [0.28, 0, 0]]),
  ]);

  return [
    idleClip,
    walkClip,
    runClip,
    sitClip,
    sleepClip,
    stretchClip,
    yawnClip,
    lickPawClip,
    groomClip,
    playClip,
    eatClip,
    drinkClip,
    bathClip,
    happyClip,
  ];
}

function buildArticulatedCatGroup(breed: CatBreed, customFurColor?: string): THREE.Group {
  const palette = resolvePalette(breed, customFurColor);
  const maps = createFurMaps(palette);

  const furMat = new THREE.MeshStandardMaterial({
    name: 'CatFurMat',
    color: palette.fur,
    map: maps.albedo,
    normalMap: maps.normal,
    normalScale: new THREE.Vector2(0.28, 0.28),
    roughnessMap: maps.roughness,
    roughness: 0.82,
    metalness: 0.01,
  });

  const headMat = new THREE.MeshStandardMaterial({
    name: 'CatHeadMat',
    color: '#ffffff',
    map: maps.headAlbedo,
    normalMap: maps.normal,
    normalScale: new THREE.Vector2(0.18, 0.18),
    roughnessMap: maps.roughness,
    roughness: 0.78,
    metalness: 0.01,
  });

  const earOuterMat = new THREE.MeshStandardMaterial({
    name: 'CatFurMat',
    color: palette.fur,
    normalMap: maps.normal,
    normalScale: new THREE.Vector2(0.18, 0.18),
    roughness: 0.82,
    metalness: 0.01,
  });

  const bellyMat = new THREE.MeshStandardMaterial({
    name: 'CatBellyMat',
    color: palette.belly,
    normalMap: maps.normal,
    normalScale: new THREE.Vector2(0.16, 0.16),
    roughness: 0.84,
    metalness: 0.0,
  });

  const earInnerMat = new THREE.MeshStandardMaterial({
    name: 'CatEarInnerMat',
    color: palette.earInner,
    roughness: 0.68,
    metalness: 0.0,
  });

  const noseMat = new THREE.MeshStandardMaterial({
    name: 'CatNoseMat',
    color: palette.nose,
    roughness: 0.24,
    metalness: 0.04,
  });

  const mouthInnerMat = new THREE.MeshStandardMaterial({
    name: 'CatMouthInnerMat',
    color: '#c95c70',
    roughness: 0.48,
  });

  const eyelinerMat = new THREE.MeshStandardMaterial({
    name: 'CatEyelinerMat',
    color: '#2a1810',
    roughness: 0.42,
    metalness: 0.04,
  });

  const irisMat = new THREE.MeshStandardMaterial({
    name: 'CatIrisMat',
    map: maps.iris,
    roughness: 0.14,
    metalness: 0.04,
  });

  const pupilMat = new THREE.MeshStandardMaterial({
    name: 'CatPupilMat',
    color: '#07080d',
    roughness: 0.06,
    metalness: 0.12,
  });

  const corneaMat = new THREE.MeshStandardMaterial({
    name: 'CatCorneaMat',
    color: '#ffffff',
    roughness: 0.03,
    metalness: 0.04,
    transparent: true,
    opacity: 0.16,
  });

  const whiskerMat = new THREE.MeshStandardMaterial({
    name: 'CatWhiskerMat',
    color: '#fff8ef',
    roughness: 0.3,
    transparent: true,
    opacity: 0.9,
  });

  const highlightMat = new THREE.MeshBasicMaterial({ color: '#ffffff' });
  const padPinkMat = new THREE.MeshStandardMaterial({ color: palette.earInner, roughness: 0.65 });

  const root = new THREE.Group();
  root.name = 'CatRoot';

  const bodyPivot = new THREE.Group();
  bodyPivot.name = 'BodyPivot';
  bodyPivot.position.set(0, 0.36, 0);
  root.add(bodyPivot);

  // 1. Sculpted Organic Torso + Soft Cream Chest Collar (zero spiky cones!)
  const torso = new THREE.Mesh(createSculptedTorsoGeometry(), furMat);
  torso.name = 'TorsoMesh';
  torso.castShadow = true;
  torso.receiveShadow = true;
  bodyPivot.add(torso);

  const chestBib = new THREE.Mesh(new THREE.SphereGeometry(0.165, 20, 16), bellyMat);
  chestBib.scale.set(0.88, 1.04, 0.88);
  chestBib.position.set(0, -0.015, 0.158);
  bodyPivot.add(chestBib);

  const chestFluff = new THREE.Mesh(new THREE.SphereGeometry(0.105, 16, 14), bellyMat);
  chestFluff.scale.set(1.06, 0.9, 0.72);
  chestFluff.position.set(0, -0.038, 0.232);
  bodyPivot.add(chestFluff);

  const underbelly = new THREE.Mesh(new THREE.CapsuleGeometry(0.132, 0.24, 6, 14), bellyMat);
  underbelly.rotation.x = Math.PI / 2;
  underbelly.position.set(0, -0.095, -0.02);
  bodyPivot.add(underbelly);

  const haunchGeo = new THREE.SphereGeometry(0.13, 14, 14);
  for (const xSign of [1, -1]) {
    const haunch = new THREE.Mesh(haunchGeo, furMat);
    haunch.scale.set(0.76, 1.02, 1.15);
    haunch.position.set(xSign * 0.115, -0.02, -0.155);
    haunch.castShadow = true;
    bodyPivot.add(haunch);
  }

  // 2. Expressive Sculpted Cat Head Rig
  const headPivot = new THREE.Group();
  headPivot.name = 'HeadPivot';
  headPivot.position.set(0, 0.145, 0.245);
  bodyPivot.add(headPivot);

  const headLookPivot = new THREE.Group();
  headLookPivot.name = 'HeadLookPivot';
  headPivot.add(headLookPivot);

  const headMesh = new THREE.Mesh(createSculptedHeadGeometry(), headMat);
  headMesh.name = 'HeadMesh';
  headMesh.position.set(0, 0.1, 0.035);
  headMesh.castShadow = true;
  headLookPivot.add(headMesh);

  // Soft rounded cheek puffs blending smoothly into cheeks (no pointy cones!)
  for (const xSign of [1, -1]) {
    const cheekPuff = new THREE.Mesh(new THREE.SphereGeometry(0.088, 16, 14), earOuterMat);
    cheekPuff.scale.set(1.18, 0.84, 0.92);
    cheekPuff.position.set(xSign * 0.145, 0.048, 0.068);
    cheekPuff.castShadow = true;
    headLookPivot.add(cheekPuff);
  }

  // Smooth sloped orange nose bridge connecting forehead between eyes cleanly to the pink nose
  const noseBridge = new THREE.Mesh(new THREE.CapsuleGeometry(0.024, 0.044, 6, 12), earOuterMat);
  noseBridge.scale.set(1.05, 1.0, 0.78);
  noseBridge.position.set(0, 0.094, 0.214);
  noseBridge.rotation.x = -0.58;
  headLookPivot.add(noseBridge);

  // Soft Cream Whisker Pads (plump, snug, blended smoothly with cheek & mouth)
  const padGeo = new THREE.SphereGeometry(0.056, 18, 14);
  const padL = new THREE.Mesh(padGeo, bellyMat);
  padL.scale.set(1.1, 0.84, 0.86);
  padL.position.set(0.044, 0.042, 0.206);
  const padR = new THREE.Mesh(padGeo, bellyMat);
  padR.scale.set(1.1, 0.84, 0.86);
  padR.position.set(-0.044, 0.042, 0.206);
  headLookPivot.add(padL, padR);

  // Articulated Lower Jaw + Chin + Little Pink Tongue
  const jawPivot = new THREE.Group();
  jawPivot.name = 'JawPivot';
  jawPivot.position.set(0, 0.022, 0.145);
  headLookPivot.add(jawPivot);

  const chin = new THREE.Mesh(new THREE.SphereGeometry(0.052, 16, 12), bellyMat);
  chin.scale.set(1.04, 0.72, 0.98);
  chin.position.set(0, -0.015, 0.045);
  const tongue = new THREE.Mesh(new THREE.SphereGeometry(0.025, 10, 10), mouthInnerMat);
  tongue.scale.set(0.95, 0.36, 1.25);
  tongue.position.set(0, -0.002, 0.05);
  jawPivot.add(chin, tongue);

  // Delicate Sculpted Pink Nose
  const nose = new THREE.Mesh(createNoseGeometry(), noseMat);
  nose.name = 'CatNose';
  nose.position.set(0, 0.068, 0.248);
  headLookPivot.add(nose);

  // Cute ":3" Feline Smile (vertical philtrum stem + left/right gentle upturned lip curves)
  const mouthStem = new THREE.Mesh(new THREE.CylinderGeometry(0.0024, 0.0024, 0.016, 6), eyelinerMat);
  mouthStem.position.set(0, 0.05, 0.248);
  headLookPivot.add(mouthStem);

  for (const xSign of [1, -1]) {
    const lipArc = new THREE.Mesh(new THREE.TorusGeometry(0.0165, 0.0026, 8, 16, Math.PI * 0.88), eyelinerMat);
    lipArc.position.set(xSign * 0.016, 0.044, 0.245);
    lipArc.rotation.z = Math.PI + xSign * 0.18;
    lipArc.rotation.y = xSign * 0.26;
    headLookPivot.add(lipArc);
  }

  // Curved Delicate 3D Whiskers + Subtle Follicle Dots
  const whiskerRows: [number, number, number, number][] = [
    [0.048, 0.228, 0.032, -0.03],
    [0.039, 0.23, 0.002, -0.05],
    [0.03, 0.226, -0.032, -0.08],
  ];
  for (const xSign of [1, -1]) {
    whiskerRows.forEach(([wy, wz, tipDy, tipDz], idx) => {
      const baseX = xSign * 0.056;
      const dot = new THREE.Mesh(new THREE.SphereGeometry(0.0032, 6, 6), eyelinerMat);
      dot.position.set(baseX, wy, wz + 0.008);
      headLookPivot.add(dot);

      const span = 0.185 - idx * 0.014;
      const wGeo = createWhiskerTube([
        new THREE.Vector3(baseX, wy, wz),
        new THREE.Vector3(baseX + xSign * span * 0.45, wy + tipDy * 0.4, wz - 0.02 + tipDz * 0.4),
        new THREE.Vector3(baseX + xSign * span, wy + tipDy - 0.014, wz - 0.055 + tipDz),
      ]);
      headLookPivot.add(new THREE.Mesh(wGeo, whiskerMat));
    });

    // Delicate brow whisker above outer eye
    const browGeo = createWhiskerTube([
      new THREE.Vector3(xSign * 0.068, 0.172, 0.188),
      new THREE.Vector3(xSign * 0.095, 0.212, 0.168),
      new THREE.Vector3(xSign * 0.125, 0.238, 0.135),
    ]);
    headLookPivot.add(new THREE.Mesh(browGeo, whiskerMat));
  }

  // 3. Sculpted Rounded-Tip 3D Ears with Inner Rose Cup & Soft Cream Fluff
  const makeEar = (name: string, xSign: number) => {
    const earGroup = new THREE.Group();
    earGroup.name = name;
    earGroup.position.set(xSign * 0.132, 0.225, 0.028);
    earGroup.rotation.z = -xSign * 0.22;

    const outer = new THREE.Mesh(createSculptedEarGeometry(0.084, 0.17, 0.055), earOuterMat);
    outer.position.set(0, 0.062, 0);
    outer.castShadow = true;

    const inner = new THREE.Mesh(createSculptedEarGeometry(0.05, 0.115, 0.022), earInnerMat);
    inner.position.set(0, 0.052, 0.018);

    const earFluff = new THREE.Mesh(new THREE.SphereGeometry(0.024, 10, 10), bellyMat);
    earFluff.scale.set(0.75, 1.35, 0.65);
    earFluff.position.set(-xSign * 0.02, 0.022, 0.026);
    earFluff.rotation.z = xSign * 0.48;

    earGroup.add(outer, inner, earFluff);
    return earGroup;
  };
  headLookPivot.add(makeEar('EarL', 1), makeEar('EarR', -1));

  // 4. Crystal-Clear Expressive Luminous Eyes (Planar Frontal Iris UV + Eyeliner + Front-Only Lids)
  const makeEye = (side: 'L' | 'R', xSign: number) => {
    const eyeGroup = new THREE.Group();
    eyeGroup.name = `Eye${side}`;
    eyeGroup.position.set(xSign * 0.080, 0.118, 0.194);
    eyeGroup.rotation.y = xSign * 0.14;

    // Undistorted planar-UV iris dome facing +Z
    const iris = new THREE.Mesh(createIrisDomeGeometry(0.048), irisMat);
    iris.scale.set(1.02, 1.08, 0.56);

    // Dynamic vertical almond pupil seated cleanly in front of iris center
    const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.024, 18, 16), pupilMat);
    pupil.name = `Pupil${side}`;
    pupil.scale.set(0.58, 1.18, 0.26);
    pupil.position.set(0, 0, 0.0245);

    // Subtle dark feline eyeliner arch framing upper/outer rim
    const eyeliner = new THREE.Mesh(new THREE.TorusGeometry(0.049, 0.0042, 8, 24, Math.PI * 1.05), eyelinerMat);
    eyeliner.scale.set(1.02, 1.08, 0.65);
    eyeliner.position.set(0, 0.002, 0.006);
    eyeliner.rotation.z = -0.08 * xSign;

    // Glossy front cornea dome + crisp dual catchlights
    const cornea = new THREE.Mesh(
      new THREE.SphereGeometry(0.0505, 22, 18, 0, Math.PI, 0, Math.PI),
      corneaMat
    );
    cornea.name = `EyeCornea${side}`;
    cornea.scale.set(1.02, 1.08, 0.62);

    const glintMain = new THREE.Mesh(new THREE.SphereGeometry(0.0105, 8, 8), highlightMat);
    glintMain.position.set(0.015, 0.016, 0.032);
    const glintSoft = new THREE.Mesh(new THREE.SphereGeometry(0.005, 8, 8), highlightMat);
    glintSoft.position.set(-0.012, -0.012, 0.0305);

    // Front-only Upper Eyelid Cap (phi: 0..PI -> +Z front only; -0.84 open, +0.18 closed)
    const upperLidPivot = new THREE.Group();
    upperLidPivot.name = `UpperLid${side}`;
    upperLidPivot.rotation.x = -0.84;
    const upperLidMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.053, 20, 14, 0, Math.PI, 0, Math.PI * 0.54),
      earOuterMat
    );
    upperLidMesh.scale.set(1.05, 1.1, 0.66);
    upperLidPivot.add(upperLidMesh);

    // Front-only Lower Eyelid Cap (+0.84 open down below eye, -0.10 happy squint up!)
    const lowerLidPivot = new THREE.Group();
    lowerLidPivot.name = `LowerLid${side}`;
    lowerLidPivot.rotation.x = 0.84;
    const lowerLidMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.052, 20, 14, 0, Math.PI, Math.PI * 0.46, Math.PI * 0.54),
      earOuterMat
    );
    lowerLidMesh.scale.set(1.04, 1.09, 0.65);
    lowerLidPivot.add(lowerLidMesh);

    eyeGroup.add(iris, pupil, eyeliner, cornea, glintMain, glintSoft, upperLidPivot, lowerLidPivot);
    return eyeGroup;
  };
  headLookPivot.add(makeEye('L', 1), makeEye('R', -1));

  const accMount = new THREE.Group();
  accMount.name = 'AccessoryMount';
  accMount.position.set(0, 0.1, 0.035);
  headLookPivot.add(accMount);

  // 5. Four Articulated Legs with Multi-Toe Soft Cream Paws
  const makeLeg = (name: string, x: number, z: number, isBack: boolean) => {
    const legPivot = new THREE.Group();
    legPivot.name = name;
    legPivot.position.set(x, -0.055, z);

    const upperLeg = new THREE.Mesh(
      new THREE.CapsuleGeometry(isBack ? 0.068 : 0.058, 0.12, 6, 14),
      furMat
    );
    upperLeg.position.set(0, -0.08, isBack ? -0.01 : 0);
    upperLeg.castShadow = true;

    const lowerLeg = new THREE.Mesh(new THREE.CapsuleGeometry(0.048, 0.14, 6, 12), furMat);
    lowerLeg.position.set(0, -0.18, 0.01);
    lowerLeg.castShadow = true;

    const pawGroup = new THREE.Group();
    pawGroup.position.set(0, -0.275, 0.025);
    const pawBase = new THREE.Mesh(new THREE.SphereGeometry(0.054, 14, 12), bellyMat);
    pawBase.scale.set(1.02, 0.62, 1.15);
    pawGroup.add(pawBase);

    for (const toeX of [-0.026, 0, 0.026]) {
      const toe = new THREE.Mesh(new THREE.SphereGeometry(0.021, 10, 10), bellyMat);
      toe.scale.set(0.9, 0.72, 1.15);
      toe.position.set(toeX, -0.008, 0.046);
      pawGroup.add(toe);
    }

    const mainPad = new THREE.Mesh(new THREE.SphereGeometry(0.022, 8, 8), padPinkMat);
    mainPad.scale.set(1.1, 0.25, 1.0);
    mainPad.position.set(0, -0.032, 0.01);
    pawGroup.add(mainPad);

    legPivot.add(upperLeg, lowerLeg, pawGroup);
    return legPivot;
  };

  bodyPivot.add(
    makeLeg('LegFL', 0.112, 0.175, false),
    makeLeg('LegFR', -0.112, 0.175, false),
    makeLeg('LegBL', 0.116, -0.18, true),
    makeLeg('LegBR', -0.116, -0.18, true)
  );

  // 6. 4-Segment Flowing Fluffy Tail
  const tailPivot1 = new THREE.Group();
  tailPivot1.name = 'TailPivot1';
  tailPivot1.position.set(0, 0.055, -0.265);
  tailPivot1.rotation.x = 0.42;
  bodyPivot.add(tailPivot1);

  const tailSeg1 = new THREE.Mesh(new THREE.CapsuleGeometry(0.054, 0.15, 6, 14), furMat);
  tailSeg1.position.set(0, 0.08, -0.025);
  tailSeg1.rotation.x = -0.18;
  tailSeg1.castShadow = true;
  tailPivot1.add(tailSeg1);

  const tailPivot2 = new THREE.Group();
  tailPivot2.name = 'TailPivot2';
  tailPivot2.position.set(0, 0.165, -0.055);
  tailPivot1.add(tailPivot2);

  const tailSeg2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.05, 0.15, 6, 14), furMat);
  tailSeg2.position.set(0, 0.08, -0.015);
  tailSeg2.castShadow = true;
  tailPivot2.add(tailSeg2);

  const tailPivot3 = new THREE.Group();
  tailPivot3.name = 'TailPivot3';
  tailPivot3.position.set(0, 0.165, -0.03);
  tailPivot2.add(tailPivot3);

  const tailSeg3 = new THREE.Mesh(new THREE.CapsuleGeometry(0.045, 0.13, 6, 14), furMat);
  tailSeg3.position.set(0, 0.07, -0.01);
  tailSeg3.castShadow = true;
  tailPivot3.add(tailSeg3);

  const tailTipPivot = new THREE.Group();
  tailTipPivot.name = 'TailTipPivot';
  tailTipPivot.position.set(0, 0.145, -0.015);
  tailPivot3.add(tailTipPivot);

  const tailTip = new THREE.Mesh(new THREE.SphereGeometry(0.054, 14, 14), bellyMat);
  tailTip.scale.set(1, 1.25, 1);
  tailTip.position.set(0, 0.03, 0);
  tailTip.castShadow = true;
  tailTipPivot.add(tailTip);

  return root;
}

const glbCache = new Map<CatBreed, ArrayBuffer>();

export async function exportCatGlbBuffer(breed: CatBreed, customFurColor?: string): Promise<ArrayBuffer> {
  const cacheKey = `${breed}:${customFurColor ?? ''}` as CatBreed;
  const cached = glbCache.get(cacheKey);
  if (cached) return cached;

  const group = buildArticulatedCatGroup(breed, customFurColor);
  const animations = buildCatAnimationClips();
  const exporter = new GLTFExporter();

  const buffer = await new Promise<ArrayBuffer>((resolve, reject) => {
    exporter.parse(
      group,
      (result) => {
        if (result instanceof ArrayBuffer) {
          resolve(result);
        } else {
          const json = JSON.stringify(result);
          resolve(new TextEncoder().encode(json).buffer);
        }
      },
      (err) => reject(err),
      { binary: true, animations }
    );
  });

  glbCache.set(cacheKey, buffer);
  return buffer;
}

export async function loadCatGltf(
  breed: CatBreed,
  customBuffer?: ArrayBuffer,
  customFurColor?: string
): Promise<Pick<GLTF, 'scene' | 'animations'>> {
  if (customBuffer) {
    const loader = new GLTFLoader();
    return new Promise<GLTF>((resolve, reject) => {
      loader.parse(customBuffer, '', resolve, reject);
    });
  }

  // Native Three.js scene + AnimationClips avoids CanvasTexture PNG/Blob loss in GLTFExporter -> GLTFLoader
  return {
    scene: buildArticulatedCatGroup(breed, customFurColor),
    animations: buildCatAnimationClips(),
  };
}


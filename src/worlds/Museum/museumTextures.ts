import * as THREE from 'three';

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function finalizeColorTex(
  canvas: HTMLCanvasElement,
  repeatX = 1,
  repeatY = 1,
  anisotropy = 8
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  return tex;
}

function finalizeDataTex(
  canvas: HTMLCanvasElement,
  repeatX = 1,
  repeatY = 1,
  anisotropy = 8
): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  // Data maps (roughness / bump) stay in linear NoColorSpace
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeatX, repeatY);
  tex.anisotropy = anisotropy;
  return tex;
}

/**
 * پارکت چوبی هفت‌وهشتی اصیل پاریسی (Point de Hongrie / Chevron Oak)
 */
export function createHerringboneParquetTextures(
  repeatX = 6,
  repeatY = 6,
  anisotropy = 8
): { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const S = 512;
  const [canvas, ctx] = makeCanvas(S, S);
  const [rCanvas, rCtx] = makeCanvas(S, S);

  ctx.fillStyle = '#7d5333';
  ctx.fillRect(0, 0, S, S);
  rCtx.fillStyle = '#686868';
  rCtx.fillRect(0, 0, S, S);

  const cols = 4;
  const rows = 8;
  const colW = S / cols;
  const rowH = S / rows;

  const tones = ['#8b5d3b', '#7b4f30', '#966642', '#6f4629', '#a0704b'];

  for (let row = -2; row < rows + 2; row++) {
    for (let col = 0; col < cols; col++) {
      const dir = col % 2 === 0 ? -1 : 1;
      const x0 = col * colW;
      const x1 = x0 + colW;
      const y0 = row * rowH;
      const shift = dir === -1 ? -rowH * 0.65 : rowH * 0.65;
      const seed = (row * 17 + col * 31) & 1023;
      const tone = tones[seed % tones.length];

      // Albedo chevron plank
      ctx.beginPath();
      ctx.moveTo(x0, y0);
      ctx.lineTo(x1, y0 + shift);
      ctx.lineTo(x1, y0 + shift + rowH);
      ctx.lineTo(x0, y0 + rowH);
      ctx.closePath();
      ctx.fillStyle = tone;
      ctx.fill();

      // Subtle wood fiber striations along plank
      ctx.save();
      ctx.clip();
      ctx.strokeStyle = 'rgba(42, 24, 12, 0.22)';
      ctx.lineWidth = 1.2;
      for (let g = 1; g < 6; g++) {
        const gy = y0 + (g / 6) * rowH;
        ctx.beginPath();
        ctx.moveTo(x0, gy);
        ctx.lineTo(x1, gy + shift);
        ctx.stroke();
      }
      ctx.restore();

      // Crisp plank bevel seam
      ctx.strokeStyle = 'rgba(34, 20, 10, 0.45)';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Matching roughness variation per plank (subtle satin polish)
      const rVal = 82 + (seed % 38);
      rCtx.beginPath();
      rCtx.moveTo(x0, y0);
      rCtx.lineTo(x1, y0 + shift);
      rCtx.lineTo(x1, y0 + shift + rowH);
      rCtx.lineTo(x0, y0 + rowH);
      rCtx.closePath();
      rCtx.fillStyle = `rgb(${rVal},${rVal},${rVal})`;
      rCtx.fill();
      rCtx.strokeStyle = 'rgb(165,165,165)';
      rCtx.lineWidth = 2;
      rCtx.stroke();
    }
  }

  return {
    map: finalizeColorTex(canvas, repeatX, repeatY, anisotropy),
    roughnessMap: finalizeDataTex(rCanvas, repeatX, repeatY, anisotropy),
  };
}

/**
 * سنگ مرمر کلاسیک کارارا و کرم پاریسی با لوزی‌های مرمر تیره
 */
export function createBeauxArtsMarbleTextures(
  repeatX = 5,
  repeatY = 5,
  anisotropy = 8
): { map: THREE.CanvasTexture; roughnessMap: THREE.CanvasTexture } {
  const S = 512;
  const [canvas, ctx] = makeCanvas(S, S);
  const [rCanvas, rCtx] = makeCanvas(S, S);

  ctx.fillStyle = '#ebe3d5';
  ctx.fillRect(0, 0, S, S);
  rCtx.fillStyle = '#383838'; // Polished marble base roughness
  rCtx.fillRect(0, 0, S, S);

  const tiles = 4;
  const tile = S / tiles;

  for (let ty = 0; ty < tiles; ty++) {
    for (let tx = 0; tx < tiles; tx++) {
      const isAlt = (tx + ty) % 2 === 1;
      const x = tx * tile;
      const y = ty * tile;
      ctx.fillStyle = isAlt ? '#dfd4c1' : '#f1ebe0';
      ctx.fillRect(x, y, tile, tile);

      // Soft organic marble veining inside each slab
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, y, tile, tile);
      ctx.clip();
      ctx.strokeStyle = isAlt ? 'rgba(136, 122, 104, 0.25)' : 'rgba(155, 148, 138, 0.22)';
      for (let v = 0; v < 5; v++) {
        ctx.beginPath();
        let vx = x + ((v * 37 + tx * 29) % tile);
        let vy = y;
        ctx.moveTo(vx, vy);
        for (let s = 1; s <= 4; s++) {
          vx += Math.sin(v * 2.1 + s + ty) * 22;
          vy = y + (s / 4) * tile;
          ctx.lineTo(vx, vy);
        }
        ctx.lineWidth = 1.1 + (v % 2) * 0.7;
        ctx.stroke();
      }
      ctx.restore();
    }
  }

  // Grout lines & roughness breaks
  ctx.strokeStyle = 'rgba(128, 114, 98, 0.38)';
  ctx.lineWidth = 3;
  rCtx.strokeStyle = 'rgb(145, 145, 145)';
  rCtx.lineWidth = 3;
  for (let i = 0; i <= tiles; i++) {
    const p = i * tile;
    ctx.beginPath();
    ctx.moveTo(p, 0);
    ctx.lineTo(p, S);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, p);
    ctx.lineTo(S, p);
    ctx.stroke();

    rCtx.beginPath();
    rCtx.moveTo(p, 0);
    rCtx.lineTo(p, S);
    rCtx.stroke();
    rCtx.beginPath();
    rCtx.moveTo(0, p);
    rCtx.lineTo(S, p);
    rCtx.stroke();
  }

  // Dark Belgian slate cabochon diamonds at slab intersections
  for (let ty = 0; ty <= tiles; ty++) {
    for (let tx = 0; tx <= tiles; tx++) {
      const cx = tx * tile;
      const cy = ty * tile;
      const d = 14;
      ctx.beginPath();
      ctx.moveTo(cx, cy - d);
      ctx.lineTo(cx + d, cy);
      ctx.lineTo(cx, cy + d);
      ctx.lineTo(cx - d, cy);
      ctx.closePath();
      ctx.fillStyle = '#3c3b38';
      ctx.fill();
      ctx.strokeStyle = '#c8a962';
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
  }

  return {
    map: finalizeColorTex(canvas, repeatX, repeatY, anisotropy),
    roughnessMap: finalizeDataTex(rCanvas, repeatX, repeatY, anisotropy),
  };
}

/**
 * دیوار سنگی کرم و عاجی بوزآر با قاب‌بندی گچ‌بری و نوار طلایی
 */
export function createBoiserieWallTexture(
  baseColor = '#ece2cf',
  panelColor = '#e2d4bc',
  goldColor = '#c9a65b',
  repeatX = 4,
  repeatY = 1,
  anisotropy = 8
): { map: THREE.CanvasTexture; bumpMap: THREE.CanvasTexture } {
  const W = 512;
  const H = 512;
  const [canvas, ctx] = makeCanvas(W, H);
  const [bCanvas, bCtx] = makeCanvas(W, H);

  ctx.fillStyle = baseColor;
  ctx.fillRect(0, 0, W, H);
  bCtx.fillStyle = '#808080';
  bCtx.fillRect(0, 0, W, H);

  // Subtle limestone grain
  for (let i = 0; i < 650; i++) {
    const x = (i * 197) % W;
    const y = (i * 313) % H;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.08)' : 'rgba(90,75,55,0.04)';
    ctx.fillRect(x, y, 4, 2);
  }

  // Lower stone dado rail (ازاره پایین دیوار)
  const dadoTop = 376;
  ctx.fillStyle = panelColor;
  ctx.fillRect(0, dadoTop, W, H - dadoTop);

  // Dado chair rail molding
  ctx.fillStyle = '#d4c3a4';
  ctx.fillRect(0, dadoTop - 14, W, 16);
  ctx.fillStyle = goldColor;
  ctx.fillRect(0, dadoTop - 4, W, 4);

  bCtx.fillStyle = '#c8c8c8';
  bCtx.fillRect(0, dadoTop - 14, W, 16);

  // Lower wainscot recessed panel
  ctx.strokeStyle = '#bfa986';
  ctx.lineWidth = 4;
  ctx.strokeRect(38, dadoTop + 20, W - 76, H - dadoTop - 42);
  bCtx.strokeStyle = '#d4d4d4';
  bCtx.lineWidth = 6;
  bCtx.strokeRect(38, dadoTop + 20, W - 76, H - dadoTop - 42);

  // Upper tall Boiserie molding frame
  ctx.fillStyle = panelColor;
  ctx.fillRect(42, 46, W - 84, dadoTop - 86);
  ctx.strokeStyle = '#cab794';
  ctx.lineWidth = 8;
  ctx.strokeRect(42, 46, W - 84, dadoTop - 86);

  // Inner gilt fillet trim
  ctx.strokeStyle = goldColor;
  ctx.lineWidth = 3;
  ctx.strokeRect(56, 60, W - 112, dadoTop - 114);

  bCtx.strokeStyle = '#ededed';
  bCtx.lineWidth = 10;
  bCtx.strokeRect(42, 46, W - 84, dadoTop - 86);

  // Upper crown cornice band
  ctx.fillStyle = '#ded0b6';
  ctx.fillRect(0, 0, W, 24);
  ctx.fillStyle = goldColor;
  ctx.fillRect(0, 22, W, 4);
  bCtx.fillStyle = '#dedede';
  bCtx.fillRect(0, 0, W, 24);

  return {
    map: finalizeColorTex(canvas, repeatX, repeatY, anisotropy),
    bumpMap: finalizeDataTex(bCanvas, repeatX, repeatY, anisotropy),
  };
}

/**
 * کاغذ دیواری پارچه‌ای داماسک کلاسیک (برای تالار نقاشی سالن کاره و تالار صمیمی)
 */
export function createDamaskWallTexture(
  bgHex = '#5d2129',
  motifHex = '#48161d',
  dadoHex = '#d9cbb3',
  repeatX = 5,
  repeatY = 1,
  anisotropy = 8
): THREE.CanvasTexture {
  const W = 512;
  const H = 512;
  const [canvas, ctx] = makeCanvas(W, H);

  ctx.fillStyle = bgHex;
  ctx.fillRect(0, 0, W, H);

  // Damask floral motif grid in upper section
  const step = 128;
  for (let y = 32; y < 350; y += step) {
    for (let x = 32; x < W; x += step) {
      const cx = x + 32;
      const cy = y + 32;
      ctx.save();
      ctx.translate(cx, cy);
      ctx.fillStyle = motifHex;
      for (let p = 0; p < 8; p++) {
        ctx.save();
        ctx.rotate((p / 8) * Math.PI * 2);
        ctx.beginPath();
        ctx.ellipse(0, -18, 7, 15, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(0, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  // Subtle fabric weave vertical lines
  ctx.fillStyle = 'rgba(255,245,230,0.03)';
  for (let x = 0; x < W; x += 4) {
    ctx.fillRect(x, 0, 1, 376);
  }

  // Gold & Ivory Boiserie dado at bottom
  ctx.fillStyle = dadoHex;
  ctx.fillRect(0, 376, W, H - 376);
  ctx.fillStyle = '#c9a65b';
  ctx.fillRect(0, 370, W, 7);
  ctx.fillRect(0, 22, W, 5);
  ctx.strokeStyle = '#b4a285';
  ctx.lineWidth = 4;
  ctx.strokeRect(36, 396, W - 72, H - 418);

  return finalizeColorTex(canvas, repeatX, repeatY, anisotropy);
}

/**
 * نقاشی سقفی کلاسیک پاریسی (Fresco Celestial Ceiling Medallion)
 */
export function createCeilingFrescoTexture(anisotropy = 8): THREE.CanvasTexture {
  const S = 1024;
  const [canvas, ctx] = makeCanvas(S, S);

  // Outer carved stone coffer border
  ctx.fillStyle = '#e7dcc8';
  ctx.fillRect(0, 0, S, S);

  ctx.strokeStyle = '#c8a355';
  ctx.lineWidth = 22;
  ctx.strokeRect(28, 28, S - 56, S - 56);
  ctx.strokeStyle = '#9a8668';
  ctx.lineWidth = 8;
  ctx.strokeRect(52, 52, S - 104, S - 104);

  // Inner oval fresco sky dome
  const cx = S / 2;
  const cy = S / 2;
  const rad = S * 0.41;

  const sky = ctx.createRadialGradient(cx, cy, 40, cx, cy, rad);
  sky.addColorStop(0, '#f8edd2');
  sky.addColorStop(0.38, '#d9e3ea');
  sky.addColorStop(0.75, '#9cb6c9');
  sky.addColorStop(1, '#687e99');

  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, rad, 0, Math.PI * 2);
  ctx.fillStyle = sky;
  ctx.fill();
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#c9a456';
  ctx.stroke();
  ctx.clip();

  // Soft baroque clouds
  const cloudCenters = [
    [cx - 170, cy - 120, 120, 62],
    [cx + 150, cy - 150, 130, 68],
    [cx - 210, cy + 130, 140, 74],
    [cx + 185, cy + 110, 125, 65],
    [cx, cy - 220, 110, 52],
    [cx, cy + 225, 115, 58],
  ];
  for (const [x, y, rx, ry] of cloudCenters) {
    const cg = ctx.createRadialGradient(x, y, 8, x, y, rx);
    cg.addColorStop(0, 'rgba(255, 246, 232, 0.72)');
    cg.addColorStop(0.6, 'rgba(241, 224, 200, 0.35)');
    cg.addColorStop(1, 'rgba(241, 224, 200, 0)');
    ctx.fillStyle = cg;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Central golden sunburst rays
  ctx.strokeStyle = 'rgba(255, 228, 165, 0.35)';
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.lineWidth = i % 2 === 0 ? 5 : 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * 32, cy + Math.sin(a) * 32);
    ctx.lineTo(cx + Math.cos(a) * 260, cy + Math.sin(a) * 260);
    ctx.stroke();
  }

  // Laurel ring around central rosette
  for (let i = 0; i < 24; i++) {
    const a = (i / 24) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * 340, cy + Math.sin(a) * 340);
    ctx.rotate(a + Math.PI / 2);
    ctx.fillStyle = 'rgba(210, 174, 96, 0.72)';
    ctx.beginPath();
    ctx.ellipse(0, 0, 16, 6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  ctx.restore();

  // Corner architectural rosettes on plaster spandrels
  const corners = [
    [115, 115],
    [S - 115, 115],
    [115, S - 115],
    [S - 115, S - 115],
  ];
  for (const [rx, ry] of corners) {
    ctx.beginPath();
    ctx.arc(rx, ry, 42, 0, Math.PI * 2);
    ctx.fillStyle = '#d2b26a';
    ctx.fill();
    ctx.beginPath();
    ctx.arc(rx, ry, 24, 0, Math.PI * 2);
    ctx.fillStyle = '#efe5d2';
    ctx.fill();
  }

  return finalizeColorTex(canvas, 1, 1, anisotropy);
}

/**
 * صفحه ساعت تزئینی تالار نورگیر اورسی (بدون نوشته و متن، فقط خطوط شعاعی و طلایی)
 */
export function createPalaceClockTexture(anisotropy = 8): THREE.CanvasTexture {
  const S = 512;
  const [canvas, ctx] = makeCanvas(S, S);
  const cx = S / 2;
  const cy = S / 2;

  ctx.fillStyle = '#f5eedc';
  ctx.fillRect(0, 0, S, S);

  ctx.beginPath();
  ctx.arc(cx, cy, 242, 0, Math.PI * 2);
  ctx.fillStyle = '#f8f2e4';
  ctx.fill();
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#c59f4b';
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, 198, 0, Math.PI * 2);
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#332c24';
  ctx.stroke();

  // Pure geometric gilt hour markers (no letters or digits)
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.fillStyle = '#241e18';
    ctx.fillRect(-5, -225, 10, 26);
    ctx.restore();
  }
  for (let i = 0; i < 60; i++) {
    if (i % 5 === 0) continue;
    const a = (i / 60) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(a);
    ctx.fillStyle = 'rgba(36,30,24,0.55)';
    ctx.fillRect(-1.5, -220, 3, 10);
    ctx.restore();
  }

  // Ornate hands
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(-0.85);
  ctx.fillStyle = '#1d1814';
  ctx.fillRect(-6, -125, 12, 135);
  ctx.restore();

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(1.1);
  ctx.fillStyle = '#1d1814';
  ctx.fillRect(-4, -172, 8, 182);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(cx, cy, 14, 0, Math.PI * 2);
  ctx.fillStyle = '#c59f4b';
  ctx.fill();

  return finalizeColorTex(canvas, 1, 1, anisotropy);
}

/**
 * بافت نرم سایه تماس زیر مجسمه‌ها و مبلمان
 */
export function createContactShadowTexture(): THREE.CanvasTexture {
  const S = 128;
  const [canvas, ctx] = makeCanvas(S, S);
  const grad = ctx.createRadialGradient(64, 64, 8, 64, 64, 62);
  grad.addColorStop(0, 'rgba(12, 10, 16, 0.52)');
  grad.addColorStop(0.55, 'rgba(12, 10, 16, 0.22)');
  grad.addColorStop(1, 'rgba(12, 10, 16, 0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, S, S);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

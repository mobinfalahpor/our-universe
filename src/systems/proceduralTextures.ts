import * as THREE from 'three';

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

export function createWoodTexture(baseHex = '#9c7454', grainHex = '#7c583c', repeat = 3): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  const plankCount = 8;
  const plankH = 512 / plankCount;
  for (let i = 0; i < plankCount; i++) {
    const y = i * plankH;
    ctx.fillStyle = i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.04)';
    ctx.fillRect(0, y, 512, plankH);

    // Wood grain lines
    ctx.strokeStyle = grainHex;
    ctx.globalAlpha = 0.22;
    for (let g = 0; g < 12; g++) {
      ctx.beginPath();
      const gy = y + (g / 12) * plankH;
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(170, gy + Math.sin(g + i) * 4, 340, gy - Math.cos(g) * 4, 512, gy);
      ctx.lineWidth = 1.2;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;

    // Plank seam
    ctx.fillStyle = 'rgba(23,23,47,0.22)';
    ctx.fillRect(0, y, 512, 2);
    const jointX = ((i * 173 + 90) % 420) + 40;
    ctx.fillRect(jointX, y, 2, plankH);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  return tex;
}

export function createMarbleTileTexture(baseHex = '#efe4dc', veinHex = '#c5b8cf', repeat = 3): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = baseHex;
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = veinHex;
  ctx.globalAlpha = 0.25;
  for (let i = 0; i < 18; i++) {
    ctx.beginPath();
    let x = (i * 53) % 512;
    let y = (i * 89) % 512;
    ctx.moveTo(x, y);
    for (let s = 0; s < 5; s++) {
      x += Math.sin(i + s * 1.4) * 70 + 30;
      y += Math.cos(i * 0.7 + s) * 60 + 20;
      ctx.lineTo(x, y);
    }
    ctx.lineWidth = 1.5 + (i % 3);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // Tile grout lines
  ctx.strokeStyle = 'rgba(119, 113, 168, 0.22)';
  ctx.lineWidth = 3;
  for (let g = 0; g <= 512; g += 128) {
    ctx.beginPath();
    ctx.moveTo(g, 0);
    ctx.lineTo(g, 512);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, g);
    ctx.lineTo(512, g);
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(repeat, repeat);
  return tex;
}

export function createRugTexture(accentHex = '#7771A8'): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = '#F1DCCB';
  ctx.fillRect(0, 0, 512, 512);

  const cx = 256;
  const cy = 256;
  const rings = [
    { r: 245, color: accentHex, width: 18 },
    { r: 210, color: '#D6B875', width: 8 },
    { r: 175, color: '#D9A9C5', width: 20 },
    { r: 115, color: accentHex, width: 10 },
    { r: 55, color: '#D6B875', width: 12 },
  ];
  for (const ring of rings) {
    ctx.beginPath();
    ctx.arc(cx, cy, ring.r, 0, Math.PI * 2);
    ctx.strokeStyle = ring.color;
    ctx.lineWidth = ring.width;
    ctx.stroke();
  }

  // Petals around center
  ctx.fillStyle = '#D9A9C5';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.save();
    ctx.translate(cx + Math.cos(a) * 145, cy + Math.sin(a) * 145);
    ctx.rotate(a);
    ctx.beginPath();
    ctx.ellipse(0, 0, 18, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createVinylTexture(labelColor = '#D9A9C5'): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = '#151526';
  ctx.fillRect(0, 0, 512, 512);

  for (let r = 95; r < 245; r += 3) {
    ctx.beginPath();
    ctx.arc(256, 256, r, 0, Math.PI * 2);
    ctx.strokeStyle = r % 9 === 0 ? 'rgba(241,220,203,0.12)' : 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(256, 256, 86, 0, Math.PI * 2);
  ctx.fillStyle = labelColor;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(256, 256, 72, 0, Math.PI * 2);
  ctx.strokeStyle = '#D6B875';
  ctx.lineWidth = 3;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(256, 256, 12, 0, Math.PI * 2);
  ctx.fillStyle = '#17172F';
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export function createRadialGlowTexture(inner = 'rgba(255,245,225,1)', outer = 'rgba(255,245,225,0)'): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(128, 128);
  const grad = ctx.createRadialGradient(64, 64, 2, 64, 64, 64);
  grad.addColorStop(0, inner);
  grad.addColorStop(0.45, inner.replace('1)', '0.45)'));
  grad.addColorStop(1, outer);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function drawPersianRosette(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radius: number,
  petals: number,
  fillOuter: string,
  fillInner: string,
  strokeCol: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = fillOuter;
  ctx.strokeStyle = strokeCol;
  ctx.lineWidth = Math.max(1.2, radius * 0.07);
  for (let i = 0; i < petals; i++) {
    ctx.save();
    ctx.rotate((i / petals) * Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(radius * 0.42, -radius * 0.28, radius, 0);
    ctx.quadraticCurveTo(radius * 0.42, radius * 0.28, 0, 0);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, radius * 0.34, 0, Math.PI * 2);
  ctx.fillStyle = fillInner;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function createPersianRugTexture(): THREE.CanvasTexture {
  const W = 1024;
  const H = 680;
  const [canvas, ctx] = makeCanvas(W, H);

  // Rich pomegranate crimson base field (لاکی / قرمز اناری اصیل)
  const bg = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, W * 0.62);
  bg.addColorStop(0, '#9e2432');
  bg.addColorStop(0.65, '#821a27');
  bg.addColorStop(1, '#68121d');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);

  // Outer lapis border (حاشیه لاجوردی اصلی)
  ctx.strokeStyle = '#182850';
  ctx.lineWidth = 74;
  ctx.strokeRect(37, 37, W - 74, H - 74);

  // Outer ivory & gold guard stripes
  ctx.strokeStyle = '#f2e4cb';
  ctx.lineWidth = 10;
  ctx.strokeRect(10, 10, W - 20, H - 20);

  ctx.strokeStyle = '#d4a84f';
  ctx.lineWidth = 6;
  ctx.strokeRect(78, 78, W - 156, H - 156);

  // Turquoise inner frame stripe
  ctx.strokeStyle = '#2b8685';
  ctx.lineWidth = 18;
  ctx.strokeRect(94, 94, W - 188, H - 188);

  ctx.strokeStyle = '#f2e4cb';
  ctx.lineWidth = 5;
  ctx.strokeRect(110, 110, W - 220, H - 220);

  // Shah-Abbasi rosettes along the lapis main border
  for (let x = 55; x <= W - 55; x += 68) {
    drawPersianRosette(ctx, x, 37, 19, 8, '#d4a84f', '#2b8685', '#f2e4cb');
    drawPersianRosette(ctx, x, H - 37, 19, 8, '#d4a84f', '#2b8685', '#f2e4cb');
  }
  for (let y = 105; y <= H - 105; y += 68) {
    drawPersianRosette(ctx, 37, y, 19, 8, '#d4a84f', '#2b8685', '#f2e4cb');
    drawPersianRosette(ctx, W - 37, y, 19, 8, '#d4a84f', '#2b8685', '#f2e4cb');
  }

  // Corner Spandrels (لچک‌های چهارگوشه)
  const corners: [number, number, number, number][] = [
    [114, 114, 1, 1],
    [W - 114, 114, -1, 1],
    [114, H - 114, 1, -1],
    [W - 114, H - 114, -1, -1],
  ];
  for (const [cx, cy, sx, sy] of corners) {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(sx, sy);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(148, 0);
    ctx.quadraticCurveTo(96, 86, 0, 148);
    ctx.closePath();
    ctx.fillStyle = '#f2e4cb';
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = '#182850';
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(106, 0);
    ctx.quadraticCurveTo(68, 62, 0, 106);
    ctx.closePath();
    ctx.fillStyle = '#2b8685';
    ctx.fill();

    drawPersianRosette(ctx, 38, 38, 22, 8, '#d4a84f', '#9e2432', '#f2e4cb');
    ctx.restore();
  }

  // Delicate Persian Eslimi vine scroll motifs in the crimson field
  ctx.strokeStyle = 'rgba(242, 228, 203, 0.34)';
  ctx.lineWidth = 2.6;
  for (let row = -1; row <= 1; row += 2) {
    for (let col = -1; col <= 1; col += 2) {
      const fx = W / 2 + col * 235;
      const fy = H / 2 + row * 125;
      drawPersianRosette(ctx, fx, fy, 32, 10, 'rgba(212,168,79,0.52)', 'rgba(43,134,133,0.75)', '#f2e4cb');
      drawPersianRosette(ctx, fx - col * 85, fy, 18, 6, 'rgba(242,228,203,0.45)', '#182850', '#d4a84f');
      drawPersianRosette(ctx, fx, fy - row * 56, 16, 6, 'rgba(43,134,133,0.65)', '#d4a84f', '#f2e4cb');
    }
  }

  // Center Medallion Pendants (سرترنج چپ و راست)
  for (const dir of [-1, 1]) {
    const px = W / 2 + dir * 215;
    const py = H / 2;
    ctx.beginPath();
    ctx.ellipse(px, py, 44, 30, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#182850';
    ctx.fill();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#f2e4cb';
    ctx.stroke();
    drawPersianRosette(ctx, px, py, 24, 8, '#d4a84f', '#2b8685', '#f2e4cb');
  }

  // Grand Center Medallion (ترنج مرکزی)
  ctx.save();
  ctx.translate(W / 2, H / 2);
  ctx.beginPath();
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    const lobe = 1 + 0.1 * Math.cos(a * 8);
    const rx = Math.cos(a) * 165 * lobe;
    const ry = Math.sin(a) * 124 * lobe;
    if (i === 0) ctx.moveTo(rx, ry);
    else ctx.lineTo(rx, ry);
  }
  ctx.closePath();
  ctx.fillStyle = '#182850';
  ctx.fill();
  ctx.lineWidth = 7;
  ctx.strokeStyle = '#f2e4cb';
  ctx.stroke();

  ctx.beginPath();
  for (let i = 0; i < 32; i++) {
    const a = (i / 32) * Math.PI * 2;
    const lobe = 1 + 0.08 * Math.cos(a * 8);
    const rx = Math.cos(a) * 124 * lobe;
    const ry = Math.sin(a) * 92 * lobe;
    if (i === 0) ctx.moveTo(rx, ry);
    else ctx.lineTo(rx, ry);
  }
  ctx.closePath();
  ctx.fillStyle = '#2b8685';
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = '#d4a84f';
  ctx.stroke();

  drawPersianRosette(ctx, 0, 0, 74, 16, '#f2e4cb', '#d4a84f', '#821a27');
  drawPersianRosette(ctx, 0, 0, 32, 8, '#9e2432', '#182850', '#f2e4cb');
  ctx.restore();

  // Woven carpet pile grain (بافت ریز گره‌های فرش)
  ctx.fillStyle = 'rgba(255, 244, 224, 0.06)';
  for (let y = 0; y < H; y += 3) {
    ctx.fillRect(0, y, W, 1);
  }
  ctx.fillStyle = 'rgba(20, 10, 12, 0.08)';
  for (let x = 0; x < W; x += 4) {
    ctx.fillRect(x, 0, 1, H);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

export function createPersianTileTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = '#1f5e66';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle ceramic glaze variation
  const tileSize = 128;
  for (let gy = 0; gy < 4; gy++) {
    for (let gx = 0; gx < 4; gx++) {
      const x = gx * tileSize;
      const y = gy * tileSize;
      ctx.fillStyle = (gx + gy) % 2 === 0 ? '#236e73' : '#1b506b';
      ctx.fillRect(x + 3, y + 3, tileSize - 6, tileSize - 6);

      ctx.strokeStyle = '#d4a84f';
      ctx.lineWidth = 2;
      ctx.strokeRect(x + 8, y + 8, tileSize - 16, tileSize - 16);

      drawPersianRosette(ctx, x + tileSize / 2, y + tileSize / 2, 34, 8, '#f2e4cb', '#d4a84f', '#182850');
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 1);
  return tex;
}

export function createPersianBolsterTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = '#8b1f2c';
  ctx.fillRect(0, 0, 512, 512);

  ctx.strokeStyle = '#d4a84f';
  ctx.lineWidth = 14;
  ctx.strokeRect(18, 18, 476, 476);

  ctx.strokeStyle = '#2b8685';
  ctx.lineWidth = 10;
  ctx.strokeRect(42, 42, 428, 428);

  drawPersianRosette(ctx, 256, 256, 118, 12, '#182850', '#d4a84f', '#f2e4cb');
  drawPersianRosette(ctx, 256, 256, 56, 8, '#f2e4cb', '#2b8685', '#8b1f2c');

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}


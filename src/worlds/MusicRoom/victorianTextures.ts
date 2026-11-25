import * as THREE from 'three';

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

/**
 * کاغذدیواری ویکتوریایی سبز زمردی تیره با نقش گلدار دمشقی طلایی-زیتونی
 */
export function createVictorianDamaskTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = '#183328';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle vertical woven silk stripe
  for (let x = 0; x < 512; x += 32) {
    ctx.fillStyle = x % 64 === 0 ? 'rgba(255,245,220,0.03)' : 'rgba(0,0,0,0.07)';
    ctx.fillRect(x, 0, 16, 512);
  }

  // Damask diamond-floral motif repeat
  const drawMotif = (cx: number, cy: number) => {
    ctx.save();
    ctx.translate(cx, cy);
    ctx.strokeStyle = 'rgba(182, 149, 78, 0.28)';
    ctx.fillStyle = 'rgba(38, 79, 59, 0.62)';
    ctx.lineWidth = 2;

    // Outer ogee frame
    ctx.beginPath();
    ctx.moveTo(0, -56);
    ctx.bezierCurveTo(38, -28, 38, 28, 0, 56);
    ctx.bezierCurveTo(-38, 28, -38, -28, 0, -56);
    ctx.fill();
    ctx.stroke();

    // Inner Victorian fleur-de-lis / acanthus
    ctx.fillStyle = 'rgba(196, 162, 88, 0.22)';
    for (let i = 0; i < 6; i++) {
      ctx.save();
      ctx.rotate((i / 6) * Math.PI * 2);
      ctx.beginPath();
      ctx.ellipse(0, -18, 6, 14, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 7, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(208, 173, 98, 0.34)';
    ctx.fill();
    ctx.restore();
  };

  for (let gy = 0; gy <= 512; gy += 128) {
    for (let gx = 0; gx <= 512; gx += 128) {
      drawMotif(gx, gy);
      drawMotif(gx + 64, gy + 64);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(4, 2);
  tex.anisotropy = 4;
  return tex;
}

/**
 * پنل‌بندی چوب گردو و ماهگونی دیوارهای ویکتوریایی
 */
export function createVictorianWainscotTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 256);
  ctx.fillStyle = '#331d12';
  ctx.fillRect(0, 0, 512, 256);

  const panels = 4;
  const pw = 512 / panels;
  for (let i = 0; i < panels; i++) {
    const x = i * pw;
    ctx.fillStyle = '#3d2316';
    ctx.fillRect(x + 12, 18, pw - 24, 220);

    // Bevel highlight & shadow
    ctx.strokeStyle = '#5c3824';
    ctx.lineWidth = 4;
    ctx.strokeRect(x + 14, 20, pw - 28, 216);

    ctx.strokeStyle = '#1f1009';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 24, 32, pw - 48, 192);

    // Subtle wood grain
    ctx.strokeStyle = 'rgba(18, 8, 4, 0.25)';
    ctx.lineWidth = 1.2;
    for (let g = 0; g < 10; g++) {
      const gx = x + 28 + g * 8;
      ctx.beginPath();
      ctx.moveTo(gx, 32);
      ctx.bezierCurveTo(gx + 3, 95, gx - 3, 160, gx, 224);
      ctx.stroke();
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.repeat.set(3, 1);
  tex.anisotropy = 4;
  return tex;
}

/**
 * کفپوش پارکت چوب گردوی تیره اشرافی
 */
export function createVictorianParquetTexture(): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = '#2d1a10';
  ctx.fillRect(0, 0, 512, 512);

  const plankH = 42.66;
  for (let r = 0; r < 12; r++) {
    const y = r * plankH;
    const tones = ['#361f13', '#2e1a10', '#3d2416', '#28160d'];
    ctx.fillStyle = tones[r % tones.length];
    ctx.fillRect(0, y, 512, plankH - 1.5);

    ctx.strokeStyle = 'rgba(18, 9, 4, 0.32)';
    ctx.lineWidth = 1;
    for (let g = 0; g < 6; g++) {
      const gy = y + 6 + g * 6;
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.bezierCurveTo(170, gy + 2, 340, gy - 2, 512, gy);
      ctx.stroke();
    }
    const splitX = ((r * 197 + 80) % 420) + 40;
    ctx.fillStyle = 'rgba(14, 7, 3, 0.5)';
    ctx.fillRect(splitX, y, 2, plankH);
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  tex.repeat.set(5, 5);
  tex.anisotropy = 8;
  return tex;
}

/**
 * صفحه وینیل مشکی با شیارهای ریز و برچسب کلاسیک ویکتوریایی
 */
export function createVictorianVinylTexture(labelAccent = '#781d29'): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 512);
  ctx.fillStyle = '#0e0e12';
  ctx.fillRect(0, 0, 512, 512);

  // Subtle glossy sheen wedge
  const sheen = ctx.createConicGradient(0, 256, 256);
  sheen.addColorStop(0, 'rgba(255,255,255,0.02)');
  sheen.addColorStop(0.18, 'rgba(255,244,220,0.12)');
  sheen.addColorStop(0.35, 'rgba(255,255,255,0.02)');
  sheen.addColorStop(0.68, 'rgba(255,244,220,0.10)');
  sheen.addColorStop(1, 'rgba(255,255,255,0.02)');
  ctx.fillStyle = sheen;
  ctx.beginPath();
  ctx.arc(256, 256, 248, 0, Math.PI * 2);
  ctx.fill();

  // Concentric vinyl grooves
  for (let r = 92; r < 246; r += 3) {
    ctx.beginPath();
    ctx.arc(256, 256, r, 0, Math.PI * 2);
    ctx.strokeStyle = r % 12 === 0 ? 'rgba(255,240,210,0.12)' : 'rgba(255,255,255,0.04)';
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  // Deep crimson & antique gold central shellac label
  ctx.beginPath();
  ctx.arc(256, 256, 84, 0, Math.PI * 2);
  ctx.fillStyle = labelAccent;
  ctx.fill();

  ctx.beginPath();
  ctx.arc(256, 256, 76, 0, Math.PI * 2);
  ctx.strokeStyle = '#d4a84f';
  ctx.lineWidth = 3.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(256, 256, 56, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(242,226,190,0.55)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(256, 256, 12, 0, Math.PI * 2);
  ctx.fillStyle = '#18130f';
  ctx.fill();

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/**
 * نقاشی رنگ روغن کلاسیک قرن نوزدهم برای تابلوهای دیواری
 */
export function createVictorianOilPaintingTexture(variant: 'landscape' | 'still_life'): THREE.CanvasTexture {
  const [canvas, ctx] = makeCanvas(512, 384);

  if (variant === 'landscape') {
    const sky = ctx.createLinearGradient(0, 0, 0, 240);
    sky.addColorStop(0, '#2a3342');
    sky.addColorStop(0.55, '#8c694a');
    sky.addColorStop(1, '#d9b47e');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, 512, 384);

    // Distant hills
    ctx.fillStyle = '#3b4238';
    ctx.beginPath();
    ctx.moveTo(0, 220);
    ctx.quadraticCurveTo(150, 150, 310, 210);
    ctx.quadraticCurveTo(420, 165, 512, 220);
    ctx.lineTo(512, 384);
    ctx.lineTo(0, 384);
    ctx.closePath();
    ctx.fill();

    // Moonlit river reflection
    ctx.fillStyle = '#4f5d5b';
    ctx.fillRect(0, 245, 512, 139);
    const refGrad = ctx.createLinearGradient(220, 245, 290, 384);
    refGrad.addColorStop(0, 'rgba(235, 200, 135, 0.65)');
    refGrad.addColorStop(1, 'rgba(235, 200, 135, 0.05)');
    ctx.fillStyle = refGrad;
    ctx.fillRect(210, 245, 92, 139);

    // Dark romantic oak silhouettes
    ctx.fillStyle = '#1d2218';
    ctx.beginPath();
    ctx.arc(88, 185, 68, 0, Math.PI * 2);
    ctx.arc(135, 205, 52, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillStyle = '#1f1612';
    ctx.fillRect(0, 0, 512, 384);

    // Table surface
    ctx.fillStyle = '#3b2419';
    ctx.fillRect(0, 270, 512, 114);

    // Antique brass pitcher & deep crimson roses
    const pitcherGrad = ctx.createLinearGradient(200, 150, 280, 280);
    pitcherGrad.addColorStop(0, '#d9b05b');
    pitcherGrad.addColorStop(1, '#75531f');
    ctx.fillStyle = pitcherGrad;
    ctx.beginPath();
    ctx.ellipse(245, 225, 42, 62, 0, 0, Math.PI * 2);
    ctx.fill();

    const flowers: [number, number, string][] = [
      [220, 125, '#8c1d2b'],
      [265, 115, '#a82c3a'],
      [240, 95, '#d9b37e'],
      [205, 148, '#7a1925'],
      [285, 145, '#9e2634'],
    ];
    for (const [fx, fy, col] of flowers) {
      ctx.beginPath();
      ctx.arc(fx, fy, 22, 0, Math.PI * 2);
      ctx.fillStyle = col;
      ctx.fill();
    }
  }

  // Aged oil varnish vignette
  const vig = ctx.createRadialGradient(256, 192, 80, 256, 192, 310);
  vig.addColorStop(0, 'rgba(0,0,0,0)');
  vig.addColorStop(1, 'rgba(15,10,6,0.48)');
  ctx.fillStyle = vig;
  ctx.fillRect(0, 0, 512, 384);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

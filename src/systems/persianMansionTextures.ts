import * as THREE from 'three';

const textureCache = new Map<string, THREE.CanvasTexture>();

function makeCanvas(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;
  return [canvas, ctx];
}

function cached(key: string, build: () => THREE.CanvasTexture): THREE.CanvasTexture {
  const existing = textureCache.get(key);
  if (existing) return existing;
  const tex = build();
  textureCache.set(key, tex);
  return tex;
}

function drawRosette(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  petals: number,
  outerCol: string,
  innerCol: string,
  strokeCol: string
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = outerCol;
  ctx.strokeStyle = strokeCol;
  ctx.lineWidth = Math.max(1, r * 0.06);
  for (let i = 0; i < petals; i++) {
    ctx.save();
    ctx.rotate((i / petals) * Math.PI * 2);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(r * 0.42, -r * 0.3, r, 0);
    ctx.quadraticCurveTo(r * 0.42, r * 0.3, 0, 0);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
  ctx.beginPath();
  ctx.arc(0, 0, r * 0.33, 0, Math.PI * 2);
  ctx.fillStyle = innerCol;
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

export function getCourtyardStoneTexture(): THREE.CanvasTexture {
  return cached('courtyard_stone', () => {
    const [canvas, ctx] = makeCanvas(512, 512);
    ctx.fillStyle = '#d4c3a8';
    ctx.fillRect(0, 0, 512, 512);

    const tile = 128;
    const shades = ['#d9c9af', '#cfc0a4', '#dfd1b8', '#c9b799'];
    for (let gy = 0; gy < 4; gy++) {
      for (let gx = 0; gx < 4; gx++) {
        ctx.fillStyle = shades[(gx * 3 + gy * 5) % shades.length];
        ctx.fillRect(gx * tile + 2, gy * tile + 2, tile - 4, tile - 4);
        // Subtle stone speckle
        ctx.fillStyle = 'rgba(110, 88, 65, 0.08)';
        for (let k = 0; k < 18; k++) {
          const px = gx * tile + ((k * 37 + gx * 19) % (tile - 12)) + 6;
          const py = gy * tile + ((k * 53 + gy * 29) % (tile - 12)) + 6;
          ctx.fillRect(px, py, 3, 2);
        }
      }
    }

    // Grout lines
    ctx.strokeStyle = 'rgba(92, 76, 58, 0.38)';
    ctx.lineWidth = 3;
    for (let g = 0; g <= 512; g += tile) {
      ctx.beginPath();
      ctx.moveTo(g, 0);
      ctx.lineTo(g, 512);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, g);
      ctx.lineTo(512, g);
      ctx.stroke();
    }

    // Subtle turquoise diamond accents at intersections
    for (let gy = 1; gy < 4; gy += 2) {
      for (let gx = 1; gx < 4; gx += 2) {
        const cx = gx * tile;
        const cy = gy * tile;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate(Math.PI / 4);
        ctx.fillStyle = '#257c82';
        ctx.fillRect(-10, -10, 20, 20);
        ctx.strokeStyle = '#efe2ca';
        ctx.lineWidth = 2;
        ctx.strokeRect(-10, -10, 20, 20);
        ctx.restore();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(5, 5);
    tex.anisotropy = 8;
    return tex;
  });
}

export function getPersianBrickWallTexture(): THREE.CanvasTexture {
  return cached('persian_brick', () => {
    const [canvas, ctx] = makeCanvas(512, 512);
    ctx.fillStyle = '#c9a67a';
    ctx.fillRect(0, 0, 512, 512);

    const rows = 16;
    const cols = 8;
    const bh = 512 / rows;
    const bw = 512 / cols;
    const tones = ['#cfad82', '#c39c6e', '#d6b68c', '#ba9266'];

    for (let r = 0; r < rows; r++) {
      const offset = (r % 2) * (bw / 2);
      for (let c = -1; c <= cols; c++) {
        const x = c * bw + offset;
        const y = r * bh;
        ctx.fillStyle = tones[(r * 7 + c * 3 + 16) % tones.length];
        ctx.fillRect(x + 2, y + 2, bw - 4, bh - 4);
        ctx.fillStyle = 'rgba(78, 52, 28, 0.14)';
        ctx.fillRect(x + 2, y + bh - 5, bw - 4, 3);
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(4, 2);
    tex.anisotropy = 4;
    return tex;
  });
}

export function getTurquoiseMosaicTexture(repeatX = 4, repeatY = 1): THREE.CanvasTexture {
  return cached(`turquoise_mosaic_${repeatX}_${repeatY}`, () => {
    const [canvas, ctx] = makeCanvas(512, 512);
    ctx.fillStyle = '#18305a';
    ctx.fillRect(0, 0, 512, 512);

    const tile = 128;
    for (let gy = 0; gy < 4; gy++) {
      for (let gx = 0; gx < 4; gx++) {
        const x = gx * tile;
        const y = gy * tile;
        ctx.fillStyle = (gx + gy) % 2 === 0 ? '#1f7b83' : '#18426f';
        ctx.fillRect(x + 3, y + 3, tile - 6, tile - 6);
        ctx.strokeStyle = '#d4a84f';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x + 8, y + 8, tile - 16, tile - 16);
        drawRosette(ctx, x + tile / 2, y + tile / 2, 38, 8, '#f0e2c8', '#d4a84f', '#18305a');
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.anisotropy = 8;
    return tex;
  });
}

export function getOrosiStainedGlassTexture(): THREE.CanvasTexture {
  return cached('orosi_glass', () => {
    const [canvas, ctx] = makeCanvas(512, 512);
    ctx.fillStyle = '#3c2113';
    ctx.fillRect(0, 0, 512, 512);

    const jewelColors = ['#b82334', '#1d8c93', '#234696', '#d99e26', '#2a7d4f'];
    const cell = 64;
    for (let gy = 0; gy < 8; gy++) {
      for (let gx = 0; gx < 8; gx++) {
        const cx = gx * cell + cell / 2;
        const cy = gy * cell + cell / 2;
        const col = jewelColors[(gx + gy * 2) % jewelColors.length];
        ctx.fillStyle = col;
        ctx.beginPath();
        ctx.moveTo(cx, cy - 26);
        ctx.lineTo(cx + 26, cy);
        ctx.lineTo(cx, cy + 26);
        ctx.lineTo(cx - 26, cy);
        ctx.closePath();
        ctx.fill();
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#3b2113';
        ctx.stroke();

        // Corner triangle glass panes
        ctx.fillStyle = jewelColors[(gx + gy + 2) % jewelColors.length];
        ctx.beginPath();
        ctx.arc(cx, cy, 9, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    }

    // Center Shamseh medallion
    drawRosette(ctx, 256, 256, 118, 12, '#d99e26', '#1d8c93', '#3b2113');
    drawRosette(ctx, 256, 256, 56, 8, '#b82334', '#f2e2be', '#3b2113');

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

export function getAinehKariTexture(): THREE.CanvasTexture {
  return cached('aineh_kari', () => {
    const [canvas, ctx] = makeCanvas(512, 512);
    const bg = ctx.createLinearGradient(0, 0, 512, 512);
    bg.addColorStop(0, '#eef3f7');
    bg.addColorStop(0.5, '#c8d6e2');
    bg.addColorStop(1, '#f4efe6');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, 512, 512);

    // Geometric mirror facets (گره آینه‌کاری)
    const step = 64;
    for (let y = 0; y < 512; y += step) {
      for (let x = 0; x < 512; x += step) {
        const cx = x + step / 2;
        const cy = y + step / 2;
        ctx.fillStyle = (x + y) % 128 === 0 ? 'rgba(255,255,255,0.78)' : 'rgba(205,222,235,0.68)';
        ctx.beginPath();
        for (let i = 0; i < 8; i++) {
          const a = (i / 8) * Math.PI * 2;
          const rad = i % 2 === 0 ? 28 : 16;
          const px = cx + Math.cos(a) * rad;
          const py = cy + Math.sin(a) * rad;
          if (i === 0) ctx.moveTo(px, py);
          else ctx.lineTo(px, py);
        }
        ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = 'rgba(130, 125, 112, 0.55)';
        ctx.lineWidth = 1.6;
        ctx.stroke();
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 1);
    return tex;
  });
}

export function getGachboriStuccoTexture(): THREE.CanvasTexture {
  return cached('gachbori', () => {
    const [canvas, ctx] = makeCanvas(512, 512);
    ctx.fillStyle = '#efe5d4';
    ctx.fillRect(0, 0, 512, 512);

    ctx.strokeStyle = '#d3c2a4';
    ctx.lineWidth = 4;
    ctx.strokeRect(18, 18, 476, 476);
    ctx.strokeRect(36, 36, 440, 440);

    drawRosette(ctx, 256, 256, 130, 12, '#e4d5bc', '#f7efe1', '#cbb896');
    drawRosette(ctx, 110, 110, 42, 8, '#e4d5bc', '#f7efe1', '#cbb896');
    drawRosette(ctx, 402, 110, 42, 8, '#e4d5bc', '#f7efe1', '#cbb896');
    drawRosette(ctx, 110, 402, 42, 8, '#e4d5bc', '#f7efe1', '#cbb896');
    drawRosette(ctx, 402, 402, 42, 8, '#e4d5bc', '#f7efe1', '#cbb896');

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

export function getPersianCarpetByColor(primaryHex = '#8a1e2b'): THREE.CanvasTexture {
  return cached(`carpet_${primaryHex}`, () => {
    const W = 1024;
    const H = 680;
    const [canvas, ctx] = makeCanvas(W, H);

    const isLight = primaryHex.toLowerCase() === '#dfd1b6' || primaryHex.toLowerCase() === '#c9a66b';
    const borderHex = primaryHex.toLowerCase() === '#1b2c54' ? '#7a1f2b' : '#182850';
    const accentHex = primaryHex.toLowerCase() === '#22696c' ? '#b3343f' : '#267f82';
    const creamHex = '#f2e4cb';
    const goldHex = '#d4a84f';

    const bg = ctx.createRadialGradient(W / 2, H / 2, 60, W / 2, H / 2, W * 0.65);
    bg.addColorStop(0, primaryHex);
    bg.addColorStop(1, isLight ? '#cbb899' : '#12101a');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = borderHex;
    ctx.lineWidth = 74;
    ctx.strokeRect(37, 37, W - 74, H - 74);

    ctx.strokeStyle = creamHex;
    ctx.lineWidth = 10;
    ctx.strokeRect(10, 10, W - 20, H - 20);

    ctx.strokeStyle = goldHex;
    ctx.lineWidth = 6;
    ctx.strokeRect(78, 78, W - 156, H - 156);

    ctx.strokeStyle = accentHex;
    ctx.lineWidth = 16;
    ctx.strokeRect(94, 94, W - 188, H - 188);

    for (let x = 55; x <= W - 55; x += 68) {
      drawRosette(ctx, x, 37, 19, 8, goldHex, accentHex, creamHex);
      drawRosette(ctx, x, H - 37, 19, 8, goldHex, accentHex, creamHex);
    }
    for (let y = 105; y <= H - 105; y += 68) {
      drawRosette(ctx, 37, y, 19, 8, goldHex, accentHex, creamHex);
      drawRosette(ctx, W - 37, y, 19, 8, goldHex, accentHex, creamHex);
    }

    // Lachak corners
    const corners: [number, number, number, number][] = [
      [112, 112, 1, 1],
      [W - 112, 112, -1, 1],
      [112, H - 112, 1, -1],
      [W - 112, H - 112, -1, -1],
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
      ctx.fillStyle = creamHex;
      ctx.fill();
      ctx.lineWidth = 4;
      ctx.strokeStyle = borderHex;
      ctx.stroke();
      drawRosette(ctx, 40, 40, 22, 8, goldHex, primaryHex, borderHex);
      ctx.restore();
    }

    // Field botanical Shah-Abbasi motifs
    for (let row = -1; row <= 1; row += 2) {
      for (let col = -1; col <= 1; col += 2) {
        drawRosette(ctx, W / 2 + col * 240, H / 2 + row * 125, 30, 10, goldHex, accentHex, creamHex);
        drawRosette(ctx, W / 2 + col * 145, H / 2 + row * 125, 16, 6, creamHex, borderHex, goldHex);
      }
    }

    // Grand Toranj medallion
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
    ctx.fillStyle = borderHex;
    ctx.fill();
    ctx.lineWidth = 7;
    ctx.strokeStyle = creamHex;
    ctx.stroke();
    drawRosette(ctx, 0, 0, 82, 16, creamHex, accentHex, goldHex);
    drawRosette(ctx, 0, 0, 34, 8, primaryHex, goldHex, borderHex);
    ctx.restore();

    // Knotted weave texture overlay
    ctx.fillStyle = 'rgba(255, 245, 226, 0.05)';
    for (let y = 0; y < H; y += 3) ctx.fillRect(0, y, W, 1);

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    return tex;
  });
}

export function getTermehTexture(baseHex = '#8d202f'): THREE.CanvasTexture {
  return cached(`termeh_${baseHex}`, () => {
    const [canvas, ctx] = makeCanvas(256, 256);
    ctx.fillStyle = baseHex;
    ctx.fillRect(0, 0, 256, 256);

    ctx.strokeStyle = '#d8b058';
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, 236, 236);

    for (let gx = 48; gx <= 208; gx += 80) {
      for (let gy = 48; gy <= 208; gy += 80) {
        drawRosette(ctx, gx, gy, 24, 8, '#d8b058', '#257d82', '#f3e5cc');
      }
    }

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    return tex;
  });
}

export function getMiniaturePaintingTexture(seed = 1): THREE.CanvasTexture {
  return cached(`miniature_${seed % 3}`, () => {
    const [canvas, ctx] = makeCanvas(512, 640);
    // Gold-leaf Tazhib margin (تذهیب حاشیه)
    ctx.fillStyle = '#192a54';
    ctx.fillRect(0, 0, 512, 640);
    ctx.strokeStyle = '#d4a84f';
    ctx.lineWidth = 10;
    ctx.strokeRect(18, 18, 476, 604);

    // Sky & Iranian garden scenery inside frame
    const sky = ctx.createLinearGradient(0, 52, 0, 588);
    if (seed % 2 === 0) {
      sky.addColorStop(0, '#c89b45');
      sky.addColorStop(0.55, '#e8d4ac');
      sky.addColorStop(1, '#587856');
    } else {
      sky.addColorStop(0, '#2b4d82');
      sky.addColorStop(0.6, '#d9b58a');
      sky.addColorStop(1, '#3e6348');
    }
    ctx.fillStyle = sky;
    ctx.fillRect(52, 52, 408, 536);

    // Stylized mountains & cypress tree + blossom tree
    ctx.fillStyle = '#a3897a';
    ctx.beginPath();
    ctx.moveTo(52, 340);
    ctx.quadraticCurveTo(170, 210, 290, 320);
    ctx.quadraticCurveTo(380, 220, 460, 340);
    ctx.lineTo(460, 588);
    ctx.lineTo(52, 588);
    ctx.closePath();
    ctx.fill();

    // Green hillside
    ctx.fillStyle = '#476e4a';
    ctx.beginPath();
    ctx.moveTo(52, 390);
    ctx.quadraticCurveTo(260, 340, 460, 400);
    ctx.lineTo(460, 588);
    ctx.lineTo(52, 588);
    ctx.closePath();
    ctx.fill();

    // Cypress silhouette
    ctx.fillStyle = '#20422b';
    ctx.beginPath();
    ctx.ellipse(150, 340, 28, 115, 0, 0, Math.PI * 2);
    ctx.fill();

    // Flowering pomegranate / almond branch
    ctx.strokeStyle = '#4c2c1b';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(390, 540);
    ctx.quadraticCurveTo(350, 380, 270, 260);
    ctx.stroke();

    ctx.fillStyle = '#e5a3b4';
    const blossoms = [
      [270, 260],
      [295, 295],
      [330, 320],
      [245, 290],
      [310, 250],
    ];
    for (const [bx, by] of blossoms) {
      ctx.beginPath();
      ctx.arc(bx, by, 16, 0, Math.PI * 2);
      ctx.fill();
    }

    // Tazhib corner rosettes
    drawRosette(ctx, 52, 52, 22, 8, '#d4a84f', '#257d82', '#f3e5cc');
    drawRosette(ctx, 460, 52, 22, 8, '#d4a84f', '#257d82', '#f3e5cc');
    drawRosette(ctx, 52, 588, 22, 8, '#d4a84f', '#257d82', '#f3e5cc');
    drawRosette(ctx, 460, 588, 22, 8, '#d4a84f', '#257d82', '#f3e5cc');

    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    return tex;
  });
}

export function getWaterRippleBumpTexture(): THREE.CanvasTexture {
  return cached('water_bump', () => {
    const [canvas, ctx] = makeCanvas(256, 256);
    ctx.fillStyle = '#808080';
    ctx.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 42; i++) {
      const cx = (i * 73) % 256;
      const cy = (i * 137) % 256;
      const r = 16 + (i % 5) * 10;
      const g = ctx.createRadialGradient(cx, cy, 2, cx, cy, r);
      g.addColorStop(0, 'rgba(220,220,220,0.35)');
      g.addColorStop(0.5, 'rgba(60,60,60,0.2)');
      g.addColorStop(1, 'rgba(128,128,128,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(3, 2);
    return tex;
  });
}

import type { GraphicsQuality } from './types';

export interface GraphicsProfile {
  isSoftwareGl: boolean;
  isMobile: boolean;
  systemReducedMotion: boolean;
  maxDpr: number;
  shadowsEnabled: boolean;
  particleScale: number;
}

let cachedSoftwareGl: boolean | null = null;

export function detectSoftwareWebGL(): boolean {
  if (cachedSoftwareGl !== null) return cachedSoftwareGl;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) {
      cachedSoftwareGl = true;
      return true;
    }
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    cachedSoftwareGl = /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    return cachedSoftwareGl;
  } catch {
    cachedSoftwareGl = false;
    return false;
  }
}

export function getGraphicsProfile(quality: GraphicsQuality, userReducedMotion: boolean): GraphicsProfile {
  const isSoftwareGl = detectSoftwareWebGL();
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;
  const systemReducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

  const effectiveQuality: Exclude<GraphicsQuality, 'auto'> =
    quality !== 'auto'
      ? quality
      : isSoftwareGl
        ? 'low'
        : isMobile
          ? 'medium'
          : 'high';

  const deviceDpr = typeof window !== 'undefined' ? window.devicePixelRatio || 1 : 1;

  if (isSoftwareGl) {
    return {
      isSoftwareGl: true,
      isMobile,
      systemReducedMotion: systemReducedMotion || userReducedMotion,
      maxDpr: 1,
      shadowsEnabled: false,
      particleScale: 0.75,
    };
  }

  switch (effectiveQuality) {
    case 'low':
      return {
        isSoftwareGl: false,
        isMobile,
        systemReducedMotion: systemReducedMotion || userReducedMotion,
        maxDpr: 1,
        shadowsEnabled: false,
        particleScale: 0.55,
      };
    case 'medium':
      return {
        isSoftwareGl: false,
        isMobile,
        systemReducedMotion: systemReducedMotion || userReducedMotion,
        maxDpr: Math.min(deviceDpr, 1.5),
        shadowsEnabled: true,
        particleScale: 0.8,
      };
    case 'high':
    default:
      return {
        isSoftwareGl: false,
        isMobile,
        systemReducedMotion: systemReducedMotion || userReducedMotion,
        maxDpr: Math.min(deviceDpr, 2),
        shadowsEnabled: true,
        particleScale: 1,
      };
  }
}

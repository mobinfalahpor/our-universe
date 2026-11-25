import React, { useEffect, useMemo, useState } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { getGraphicsProfile } from '../core/graphicsProfile';
import { useUniverseStore } from '../core/store';

function StudioEnvironment({ bgColor, fogColor, fogNear = 18, fogFar = 65 }: {
  bgColor: string;
  fogColor?: string;
  fogNear?: number;
  fogFar?: number;
}) {
  const { gl, scene } = useThree();

  useEffect(() => {
    const pmrem = new THREE.PMREMGenerator(gl);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    return () => {
      scene.environment = null;
      envTex.dispose();
    };
  }, [gl, scene]);

  useEffect(() => {
    scene.background = new THREE.Color(bgColor);
    scene.fog = new THREE.Fog(fogColor ?? bgColor, fogNear, fogFar);
  }, [scene, bgColor, fogColor, fogNear, fogFar]);

  return null;
}

interface SceneCanvasProps {
  children: React.ReactNode;
  cameraPosition?: [number, number, number];
  fov?: number;
  bgColor?: string;
  fogColor?: string;
  fogNear?: number;
  fogFar?: number;
  className?: string;
}

export const SceneCanvas: React.FC<SceneCanvasProps> = ({
  children,
  cameraPosition = [0, 4, 10],
  fov = 45,
  bgColor = '#17172F',
  fogColor,
  fogNear = 18,
  fogFar = 65,
  className = '',
}) => {
  const quality = useUniverseStore((s) => s.environment.quality);
  const reducedMotion = useUniverseStore((s) => s.environment.reducedMotion);
  const [contextLost, setContextLost] = useState(false);
  const [tabHidden, setTabHidden] = useState(false);

  const profile = useMemo(
    () => getGraphicsProfile(quality, reducedMotion),
    [quality, reducedMotion]
  );

  useEffect(() => {
    const onVis = () => setTabHidden(document.hidden);
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  if (contextLost) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center bg-[#17172F] text-[#F1DCCB] p-6 text-center">
        <p className="text-lg font-semibold mb-2">نمایشگر سه‌بعدی در حال بازیابی است</p>
        <p className="text-sm text-[#D9A9C5]/80 mb-4">لطفاً چند لحظه صبر کنید یا صفحه را تازه‌سازی کنید.</p>
        <button
          type="button"
          onClick={() => setContextLost(false)}
          className="px-5 py-2.5 rounded-xl bg-[#7771A8] text-[#F1DCCB] text-sm font-medium hover:bg-[#8a83be] transition-colors cursor-pointer"
        >
          تلاش مجدد
        </button>
      </div>
    );
  }

  return (
    <div className={`relative w-full h-full ${className}`}>
      <Canvas
        dpr={profile.maxDpr}
        shadows={profile.shadowsEnabled}
        frameloop={tabHidden ? 'demand' : 'always'}
        camera={{ position: cameraPosition, fov, near: 0.1, far: 180 }}
        gl={{
          antialias: !profile.isSoftwareGl,
          powerPreference: 'high-performance',
          toneMapping: THREE.ACESFilmicToneMapping,
          toneMappingExposure: 1.08,
        }}
        onCreated={({ gl }) => {
          gl.outputColorSpace = THREE.SRGBColorSpace;
          const canvas = gl.domElement;
          const onLost = (e: Event) => {
            e.preventDefault();
            setContextLost(true);
          };
          const onRestored = () => setContextLost(false);
          canvas.addEventListener('webglcontextlost', onLost);
          canvas.addEventListener('webglcontextrestored', onRestored);
        }}
      >
        <StudioEnvironment bgColor={bgColor} fogColor={fogColor} fogNear={fogNear} fogFar={fogFar} />
        {children}
      </Canvas>
    </div>
  );
};

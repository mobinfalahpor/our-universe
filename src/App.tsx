import React, { Suspense, lazy, useEffect } from 'react';
import { useUniverseStore } from './core/store';
import { EntryGate } from './components/EntryGate';
import { WorldHUD } from './components/WorldHUD';
import { audioEngine } from './systems/audioEngine';

const FloatingIslandScene = lazy(() =>
  import('./components/FloatingIslandScene').then((m) => ({ default: m.FloatingIslandScene }))
);
const MuseumWorld = lazy(() =>
  import('./worlds/Museum/MuseumWorld').then((m) => ({ default: m.MuseumWorld }))
);
const MusicRoomWorld = lazy(() =>
  import('./worlds/MusicRoom/MusicRoomWorld').then((m) => ({ default: m.MusicRoomWorld }))
);
const CatGameWorld = lazy(() =>
  import('./worlds/CatGame/CatGameWorld').then((m) => ({ default: m.CatGameWorld }))
);
const HomeDesignerWorld = lazy(() =>
  import('./worlds/HomeDesigner/HomeDesignerWorld').then((m) => ({ default: m.HomeDesignerWorld }))
);
const WishSkyWorld = lazy(() =>
  import('./worlds/WishSky/WishSkyWorld').then((m) => ({ default: m.WishSkyWorld }))
);
const GreenhouseWorld = lazy(() =>
  import('./worlds/Greenhouse/GreenhouseWorld').then((m) => ({ default: m.GreenhouseWorld }))
);
const CloudCafeWorld = lazy(() =>
  import('./worlds/CloudCafe/CloudCafeWorld').then((m) => ({ default: m.CloudCafeWorld }))
);
const AquariumWorld = lazy(() =>
  import('./worlds/Aquarium/AquariumWorld').then((m) => ({ default: m.AquariumWorld }))
);
const ObservatoryWorld = lazy(() =>
  import('./worlds/Observatory/ObservatoryWorld').then((m) => ({ default: m.ObservatoryWorld }))
);

function WorldLoadingFallback() {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-[#17172F] text-[#F1DCCB] p-6">
      <div className="w-12 h-12 rounded-full border-2 border-[#D6B875]/30 border-t-[#D6B875] animate-spin mb-4" />
      <p className="text-sm sm:text-base font-medium text-[#F1DCCB]">در حال آماده‌سازی این دنیا...</p>
      <p className="text-xs text-[#D9A9C5] mt-1">کمی صبر کن، ستاره‌ها در حال چیدمان هستند</p>
    </div>
  );
}

export default function App() {
  const hydrated = useUniverseStore((s) => s.hydrated);
  const hasEntered = useUniverseStore((s) => s.hasEntered);
  const activeWorld = useUniverseStore((s) => s.activeWorld);
  const audio = useUniverseStore((s) => s.audio);
  const hydrate = useUniverseStore((s) => s.hydrate);
  const setHasEntered = useUniverseStore((s) => s.setHasEntered);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  useEffect(() => {
    if (!hydrated) return;
    audioEngine.setVolume(audio.volume);
    audioEngine.setMuted(audio.muted);
  }, [hydrated, audio.volume, audio.muted]);

  if (!hydrated) {
    return <WorldLoadingFallback />;
  }

  if (!hasEntered) {
    return <EntryGate onSuccessEnter={() => setHasEntered(true)} />;
  }

  return (
    <main className="relative w-full h-full overflow-hidden bg-[#17172F]">
      <WorldHUD />

      <Suspense fallback={<WorldLoadingFallback />}>
        {activeWorld === 'island' && <FloatingIslandScene />}
        {activeWorld === 'museum' && <MuseumWorld />}
        {activeWorld === 'music' && <MusicRoomWorld />}
        {activeWorld === 'cat' && <CatGameWorld />}
        {activeWorld === 'home' && <HomeDesignerWorld />}
        {activeWorld === 'wishes' && <WishSkyWorld />}
        {activeWorld === 'greenhouse' && <GreenhouseWorld />}
        {activeWorld === 'cafe' && <CloudCafeWorld />}
        {activeWorld === 'aquarium' && <AquariumWorld />}
        {activeWorld === 'observatory' && <ObservatoryWorld />}
      </Suspense>
    </main>
  );
}

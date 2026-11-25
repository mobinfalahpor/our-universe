import React, { useState } from 'react';
import {
  Compass,
  Home,
  Map as MapIcon,
  Settings,
  Star,
  Volume2,
  VolumeX,
  X,
  ArrowRight,
  RotateCcw,
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useUniverseStore, WORLDS_META } from '../core/store';
import { toPersianDigits } from '../core/persianUtils';
import { audioEngine } from '../systems/audioEngine';
import type { GraphicsQuality } from '../core/types';

export const WorldHUD: React.FC = () => {
  const activeWorld = useUniverseStore((s) => s.activeWorld);
  const setActiveWorld = useUniverseStore((s) => s.setActiveWorld);
  const starsCurrency = useUniverseStore((s) => s.starsCurrency);
  const audio = useUniverseStore((s) => s.audio);
  const environment = useUniverseStore((s) => s.environment);
  const setAudioSettings = useUniverseStore((s) => s.setAudioSettings);
  const setEnvironmentSettings = useUniverseStore((s) => s.setEnvironmentSettings);
  const setHasEntered = useUniverseStore((s) => s.setHasEntered);

  const [mapOpen, setMapOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const currentWorldMeta = WORLDS_META.find((w) => w.id === activeWorld);
  const currentTitle = currentWorldMeta ? currentWorldMeta.title : 'جزیره شناور';

  const toggleMute = () => {
    const nextMuted = !audio.muted;
    setAudioSettings({ muted: nextMuted });
    audioEngine.setMuted(nextMuted);
  };

  return (
    <>
      {/* Top RTL Navigation Bar (Compact 1-row, mobile-first) */}
      <header className="fixed top-3 inset-x-3 sm:inset-x-5 z-30 flex items-center justify-between gap-2 pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto">
          {activeWorld !== 'island' && (
            <button
              type="button"
              onClick={() => {
                audioEngine.playSfx('click');
                setActiveWorld('island');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#17172F]/90 border border-[#D6B875]/40 text-[#F1DCCB] text-xs sm:text-sm font-medium hover:border-[#D6B875] transition-colors cursor-pointer"
            >
              <ArrowRight className="w-4 h-4 text-[#D6B875]" />
              <span className="whitespace-nowrap">بازگشت به جزیره</span>
            </button>
          )}

          <div className="px-3.5 py-2 rounded-2xl bg-[#17172F]/90 border border-[#7771A8]/35 text-[#F1DCCB] flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#D9A9C5] shrink-0" />
            <span className="text-xs sm:text-sm font-bold whitespace-nowrap">{currentTitle}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <div
            title="ستاره‌های شما"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-[#17172F]/90 border border-[#D6B875]/35 text-[#D6B875] text-xs sm:text-sm font-semibold tabular-nums"
          >
            <Star className="w-4 h-4 fill-[#D6B875]" />
            <span>{toPersianDigits(starsCurrency)}</span>
          </div>

          <button
            type="button"
            onClick={() => {
              audioEngine.playSfx('click');
              setMapOpen(true);
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-2xl bg-[#7771A8] text-[#F1DCCB] text-xs sm:text-sm font-semibold hover:bg-[#8781b8] transition-colors cursor-pointer"
          >
            <MapIcon className="w-4 h-4" />
            <span className="whitespace-nowrap">نقشه دنیاها</span>
          </button>

          <button
            type="button"
            onClick={toggleMute}
            aria-label={audio.muted ? 'فعال کردن صدا' : 'بی‌صدا کردن'}
            className="p-2.5 rounded-2xl bg-[#17172F]/90 border border-[#7771A8]/35 text-[#F1DCCB] hover:border-[#D9A9C5] transition-colors cursor-pointer"
          >
            {audio.muted ? <VolumeX className="w-4 h-4 text-[#D9A9C5]" /> : <Volume2 className="w-4 h-4 text-[#A6BBAA]" />}
          </button>

          <button
            type="button"
            onClick={() => {
              audioEngine.playSfx('click');
              setSettingsOpen(true);
            }}
            aria-label="تنظیمات"
            className="p-2.5 rounded-2xl bg-[#17172F]/90 border border-[#7771A8]/35 text-[#F1DCCB] hover:border-[#D6B875] transition-colors cursor-pointer"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* World Map Drawer */}
      <AnimatePresence>
        {mapOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0d0d1f]/80 flex items-center justify-center p-4"
            onClick={() => setMapOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-3xl max-h-[86vh] overflow-y-auto rounded-3xl bg-[#17172F] border border-[#D6B875]/35 p-5 sm:p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-xl font-bold text-[#F1DCCB]">نقشه جهان کوچولوی ما</h2>
                  <p className="text-xs sm:text-sm text-[#D9A9C5] mt-1">هر مکانی را که دوست داری انتخاب کن تا به آنجا سفر کنیم</p>
                </div>
                <button
                  type="button"
                  onClick={() => setMapOpen(false)}
                  className="p-2 rounded-xl bg-[#242447] text-[#F1DCCB] hover:bg-[#323261] cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  audioEngine.playSfx('sparkle');
                  setActiveWorld('island');
                  setMapOpen(false);
                }}
                className={`w-full mb-4 p-4 rounded-2xl border text-right flex items-center justify-between transition-colors cursor-pointer ${
                  activeWorld === 'island'
                    ? 'bg-[#7771A8]/30 border-[#D6B875]'
                    : 'bg-[#212142] border-[#7771A8]/30 hover:border-[#D9A9C5]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#D6B875]/20 flex items-center justify-center text-[#D6B875]">
                    <Home className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-[#F1DCCB]">جزیره شناور اصلی</div>
                    <div className="text-xs text-[#D9A9C5]">نمای کلی دنیای سه‌بعدی و ساختمان‌ها</div>
                  </div>
                </div>
                <span className="text-xs text-[#D6B875] font-medium">مرکز جهان</span>
              </button>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {WORLDS_META.map((w, i) => {
                  const isActive = activeWorld === w.id;
                  return (
                    <button
                      key={w.id}
                      type="button"
                      onClick={() => {
                        audioEngine.playSfx('sparkle');
                        setActiveWorld(w.id);
                        setMapOpen(false);
                      }}
                      className={`p-4 rounded-2xl border text-right transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#7771A8]/30 border-[#D6B875]'
                          : 'bg-[#202040] border-[#7771A8]/25 hover:border-[#D9A9C5]'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs text-[#D6B875] tabular-nums font-medium">
                          {toPersianDigits(i + 1)}.
                        </span>
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: w.accentColor }}
                        />
                      </div>
                      <div className="font-bold text-sm text-[#F1DCCB]">{w.title}</div>
                      <div className="text-xs text-[#D9A9C5]/85 mt-1 leading-relaxed">{w.subtitle}</div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Modal */}
      <AnimatePresence>
        {settingsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0d0d1f]/80 flex items-center justify-center p-4"
            onClick={() => setSettingsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.94, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md rounded-3xl bg-[#17172F] border border-[#7771A8]/45 p-6 shadow-2xl space-y-5"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-[#F1DCCB]">تنظیمات جهان</h2>
                <button
                  type="button"
                  onClick={() => setSettingsOpen(false)}
                  className="p-2 rounded-xl bg-[#242447] text-[#F1DCCB] hover:bg-[#323261] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div>
                <div className="flex items-center justify-between text-sm text-[#F1DCCB] mb-2">
                  <span>بلندی صدا</span>
                  <span className="tabular-nums text-xs text-[#D6B875]">{toPersianDigits(Math.round(audio.volume * 100))}٪</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={audio.volume}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setAudioSettings({ volume: v, muted: v === 0 });
                    audioEngine.setVolume(v);
                    audioEngine.setMuted(v === 0);
                  }}
                  className="w-full accent-[#D6B875]"
                />
              </div>

              <div>
                <div className="text-sm text-[#F1DCCB] mb-2">زمان آسمان جزیره</div>
                <div className="grid grid-cols-3 gap-2">
                  {(
                    [
                      ['twilight', 'گرگ‌ومیش'],
                      ['day', 'روز روشن'],
                      ['night', 'شب مهتابی'],
                    ] as const
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEnvironmentSettings({ timeOfDay: val })}
                      className={`py-2 rounded-xl text-xs font-medium border cursor-pointer ${
                        environment.timeOfDay === val
                          ? 'bg-[#7771A8] border-[#D6B875] text-[#F1DCCB]'
                          : 'bg-[#212142] border-[#7771A8]/30 text-[#D9A9C5]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="text-sm text-[#F1DCCB] mb-2">کیفیت گرافیک سه‌بعدی</div>
                <div className="grid grid-cols-4 gap-2">
                  {(
                    [
                      ['auto', 'خودکار'],
                      ['high', 'بالا'],
                      ['medium', 'متعادل'],
                      ['low', 'سبک'],
                    ] as [GraphicsQuality, string][]
                  ).map(([val, label]) => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setEnvironmentSettings({ quality: val })}
                      className={`py-2 rounded-xl text-xs font-medium border cursor-pointer ${
                        environment.quality === val
                          ? 'bg-[#7771A8] border-[#D6B875] text-[#F1DCCB]'
                          : 'bg-[#212142] border-[#7771A8]/30 text-[#D9A9C5]'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <label className="flex items-center justify-between p-3 rounded-2xl bg-[#212142] cursor-pointer">
                <span className="text-sm text-[#F1DCCB]">کاهش انیمیشن و حرکت (برای راحتی چشم)</span>
                <input
                  type="checkbox"
                  checked={environment.reducedMotion}
                  onChange={(e) => setEnvironmentSettings({ reducedMotion: e.target.checked })}
                  className="w-4 h-4 accent-[#D6B875]"
                />
              </label>

              <button
                type="button"
                onClick={() => {
                  setSettingsOpen(false);
                  setHasEntered(false);
                }}
                className="w-full py-2.5 px-4 rounded-xl bg-[#25254a] border border-[#D9A9C5]/35 text-xs sm:text-sm text-[#D9A9C5] flex items-center justify-center gap-2 hover:bg-[#2f2f5c] cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>نمایش دوباره دروازه ورود</span>
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

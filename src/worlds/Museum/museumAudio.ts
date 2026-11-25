/**
 * موتور صوتی آکوستیک موزه (فضای تالار بزرگ + صدای قدم متناسب با پارکت یا مرمر)
 * تماماً روی Web Audio API به‌صورت رویه‌ای بدون نیاز به فایل خارجی
 */
class MuseumAcousticAudio {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private roomToneSource: AudioBufferSourceNode | null = null;
  private roomToneGain: GainNode | null = null;
  private isAmbientRunning = false;
  private muted = false;
  private volume = 0.65;
  private ambientEnabled = true;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.muted ? 0 : this.volume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  setGlobalAudio(volume: number, muted: boolean) {
    this.volume = Math.max(0, Math.min(1, volume));
    this.muted = muted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(this.muted ? 0 : this.volume, this.ctx.currentTime, 0.05);
    }
    if (this.roomToneGain && this.ctx) {
      this.roomToneGain.gain.setTargetAtTime(
        !this.muted && this.ambientEnabled ? 0.045 : 0,
        this.ctx.currentTime,
        0.12
      );
    }
  }

  setAmbientEnabled(enabled: boolean) {
    this.ambientEnabled = enabled;
    if (enabled) {
      this.startRoomTone();
    } else if (this.roomToneGain && this.ctx) {
      this.roomToneGain.gain.setTargetAtTime(0, this.ctx.currentTime, 0.12);
    }
  }

  startRoomTone() {
    if (!this.ambientEnabled || this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    if (this.isAmbientRunning && this.roomToneGain) {
      this.roomToneGain.gain.setTargetAtTime(0.045, ctx.currentTime, 0.25);
      return;
    }

    // Soft Parisian stone-hall room air (pink-filtered gentle acoustic bed)
    const sampleRate = ctx.sampleRate;
    const length = sampleRate * 4;
    const buffer = ctx.createBuffer(1, length, sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < length; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.998 * b0 + white * 0.022;
      b1 = 0.988 * b1 + white * 0.024;
      b2 = 0.94 * b2 + white * 0.028;
      data[i] = (b0 + b1 + b2) * 0.22;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 310;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.045, ctx.currentTime + 0.8);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start();

    this.roomToneSource = src;
    this.roomToneGain = gain;
    this.isAmbientRunning = true;
  }

  playFootstep(surface: 'parquet' | 'marble') {
    if (this.muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;
    const now = ctx.currentTime;

    // 1. Primary step transient
    const osc = ctx.createOscillator();
    const stepFilter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    if (surface === 'marble') {
      // Crisp stone heel click + subtle hall echo
      osc.type = 'triangle';
      const baseFreq = 265 + (Math.random() - 0.5) * 35;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(110, now + 0.045);

      stepFilter.type = 'bandpass';
      stepFilter.frequency.value = 1150;
      stepFilter.Q.value = 1.6;

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.055, now + 0.006);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.075);

      // Soft stone-gallery acoustic slapback reflection (135ms)
      const echoOsc = ctx.createOscillator();
      const echoGain = ctx.createGain();
      echoOsc.type = 'sine';
      echoOsc.frequency.setValueAtTime(baseFreq * 0.88, now + 0.12);
      echoOsc.frequency.exponentialRampToValueAtTime(98, now + 0.19);
      echoGain.gain.setValueAtTime(0.001, now + 0.12);
      echoGain.gain.exponentialRampToValueAtTime(0.016, now + 0.13);
      echoGain.gain.exponentialRampToValueAtTime(0.001, now + 0.21);
      echoOsc.connect(echoGain);
      echoGain.connect(this.masterGain);
      echoOsc.start(now + 0.12);
      echoOsc.stop(now + 0.22);
    } else {
      // Warm resonant oak parquet tap
      osc.type = 'sine';
      const baseFreq = 148 + (Math.random() - 0.5) * 20;
      osc.frequency.setValueAtTime(baseFreq, now);
      osc.frequency.exponentialRampToValueAtTime(64, now + 0.065);

      stepFilter.type = 'lowpass';
      stepFilter.frequency.value = 480;

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.052, now + 0.008);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
    }

    osc.connect(stepFilter);
    stepFilter.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.095);
  }

  dispose() {
    if (this.roomToneSource) {
      try {
        this.roomToneSource.stop();
        this.roomToneSource.disconnect();
      } catch {
        // Ignore
      }
      this.roomToneSource = null;
    }
    if (this.roomToneGain) {
      this.roomToneGain.disconnect();
      this.roomToneGain = null;
    }
    this.isAmbientRunning = false;
  }
}

export const museumAudio = new MuseumAcousticAudio();

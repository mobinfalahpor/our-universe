import { useUniverseStore } from '../../core/store';

class MuseumAcousticsEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private roomToneSrc: AudioBufferSourceNode | null = null;
  private roomToneGain: GainNode | null = null;
  private stepNoiseBuffer: AudioBuffer | null = null;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.connect(this.ctx.destination);

      // Reusable short filtered-noise burst buffer for natural footsteps
      const sr = this.ctx.sampleRate;
      const len = Math.floor(sr * 0.14);
      const buf = this.ctx.createBuffer(1, len, sr);
      const ch = buf.getChannelData(0);
      for (let i = 0; i < len; i++) {
        const env = Math.exp(-i / (sr * 0.022));
        ch[i] = (Math.random() * 2 - 1) * env;
      }
      this.stepNoiseBuffer = buf;
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    this.syncGlobalVolume();
    return this.ctx;
  }

  syncGlobalVolume() {
    if (!this.ctx || !this.masterGain) return;
    const { volume, muted } = useUniverseStore.getState().audio;
    const target = muted ? 0 : Math.max(0, Math.min(1, volume));
    this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.05);
  }

  startAmbientHallTone() {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.roomToneSrc) return;

    // Very soft grand museum air & distant acoustic resonance
    const sr = ctx.sampleRate;
    const len = sr * 4;
    const buf = ctx.createBuffer(1, len, sr);
    const data = buf.getChannelData(0);
    let b0 = 0;
    let b1 = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      b0 = 0.996 * b0 + w * 0.018;
      b1 = 0.985 * b1 + w * 0.022;
      data[i] = (b0 + b1) * 0.22;
    }

    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 340;
    filter.Q.value = 0.7;

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.001, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.055, ctx.currentTime + 1.2);

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start();

    this.roomToneSrc = src;
    this.roomToneGain = gain;
  }

  stopAmbientHallTone() {
    if (this.roomToneSrc) {
      try {
        this.roomToneSrc.stop();
        this.roomToneSrc.disconnect();
      } catch {
        // Ignore stop errors
      }
      this.roomToneSrc = null;
    }
    if (this.roomToneGain) {
      try {
        this.roomToneGain.disconnect();
      } catch {
        // Ignore
      }
      this.roomToneGain = null;
    }
  }

  /**
   * صدای قدم طبیعی متناسب با جنس کف (پارکت چوبی یا سنگ مرمر) همراه با انعکاس ملایم تالار
   */
  playFootstep(surface: 'parquet' | 'marble') {
    const { muted } = useUniverseStore.getState().audio;
    if (muted) return;
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || !this.stepNoiseBuffer) return;

    const now = ctx.currentTime;
    const pitchJitter = 0.92 + Math.random() * 0.16;

    // 1. Primary shoe sole contact impulse
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    osc.type = surface === 'parquet' ? 'triangle' : 'sine';

    if (surface === 'parquet') {
      osc.frequency.setValueAtTime(128 * pitchJitter, now);
      osc.frequency.exponentialRampToValueAtTime(52 * pitchJitter, now + 0.075);
      oscGain.gain.setValueAtTime(0.055, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.085);
    } else {
      osc.frequency.setValueAtTime(460 * pitchJitter, now);
      osc.frequency.exponentialRampToValueAtTime(165 * pitchJitter, now + 0.055);
      oscGain.gain.setValueAtTime(0.042, now);
      oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);
    }

    osc.connect(oscGain);
    oscGain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.1);

    // 2. Crisp heel click + subtle hall reverb tail
    const noise = ctx.createBufferSource();
    noise.buffer = this.stepNoiseBuffer;

    const band = ctx.createBiquadFilter();
    band.type = 'bandpass';
    band.frequency.value = (surface === 'parquet' ? 680 : 1450) * pitchJitter;
    band.Q.value = surface === 'parquet' ? 1.8 : 2.6;

    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(surface === 'parquet' ? 0.028 : 0.036, now);
    nGain.gain.exponentialRampToValueAtTime(0.001, now + (surface === 'parquet' ? 0.09 : 0.13));

    noise.connect(band);
    band.connect(nGain);
    nGain.connect(this.masterGain);
    noise.start(now);

    // 3. Soft architectural hall slap-back echo
    const echoDelay = surface === 'marble' ? 0.095 : 0.075;
    const echoGain = ctx.createGain();
    echoGain.gain.setValueAtTime(surface === 'marble' ? 0.015 : 0.009, now + echoDelay);
    echoGain.gain.exponentialRampToValueAtTime(0.0008, now + echoDelay + 0.14);

    const echoFilter = ctx.createBiquadFilter();
    echoFilter.type = 'lowpass';
    echoFilter.frequency.value = surface === 'marble' ? 980 : 520;

    const echoNoise = ctx.createBufferSource();
    echoNoise.buffer = this.stepNoiseBuffer;
    echoNoise.connect(echoFilter);
    echoFilter.connect(echoGain);
    echoGain.connect(this.masterGain);
    echoNoise.start(now + echoDelay);
  }
}

export const museumAcoustics = new MuseumAcousticsEngine();

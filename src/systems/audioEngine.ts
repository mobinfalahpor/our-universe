import { MUSIC_TRACKS_CONFIG, type MusicTrackConfig } from '../config/musicConfig';

export interface MusicTrack extends MusicTrackConfig {
  srcUrl: string;
  coverUrl: string;
  isCustomUpload?: boolean;
}

export interface PlayerSnapshot {
  isPlaying: boolean;
  isLoading: boolean;
  currentTrackId: string;
  currentTime: number;
  duration: number;
  errorMessage: string | null;
  ambient: 'none' | 'rain' | 'cafe' | 'night';
}

function withBaseUrl(relPath: string): string {
  const base = import.meta.env.BASE_URL || './';
  const cleanBase = base.endsWith('/') ? base : `${base}/`;
  const cleanPath = relPath.startsWith('/') ? relPath.slice(1) : relPath;
  return `${cleanBase}${cleanPath}`;
}

class CozyAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private analyser: AnalyserNode | null = null;
  private freqBuffer: Uint8Array<ArrayBuffer> | null = null;

  private audioEl: HTMLAudioElement | null = null;
  private audioElSource: MediaElementAudioSourceNode | null = null;

  private customTracks: MusicTrack[] = [];
  private listeners = new Set<(snap: PlayerSnapshot) => void>();

  private isPlaying = false;
  private isLoading = false;
  private currentTrackId = MUSIC_TRACKS_CONFIG[0]?.id ?? '';
  private currentTime = 0;
  private duration = 0;
  private errorMessage: string | null = null;

  private ambientNode: AudioBufferSourceNode | null = null;
  private ambientGain: GainNode | null = null;
  private currentAmbient: 'none' | 'rain' | 'cafe' | 'night' = 'none';

  private volume = 0.65;
  private muted = false;

  private ensureContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return null;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.freqBuffer = new Uint8Array(new ArrayBuffer(this.analyser.frequencyBinCount));
      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);
      this.applyGain();
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
    return this.ctx;
  }

  private ensureAudioElement(): HTMLAudioElement | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioEl) {
      const el = new Audio();
      el.preload = 'metadata';
      el.crossOrigin = 'anonymous';
      el.volume = this.muted ? 0 : this.volume;

      el.addEventListener('timeupdate', () => {
        this.currentTime = el.currentTime || 0;
        this.duration = Number.isFinite(el.duration) ? el.duration : 0;
        this.emit();
      });

      el.addEventListener('loadedmetadata', () => {
        this.duration = Number.isFinite(el.duration) ? el.duration : 0;
        this.isLoading = false;
        this.emit();
      });

      el.addEventListener('playing', () => {
        this.isPlaying = true;
        this.isLoading = false;
        this.errorMessage = null;
        this.emit();
      });

      el.addEventListener('pause', () => {
        this.isPlaying = false;
        this.emit();
      });

      el.addEventListener('ended', () => {
        this.isPlaying = false;
        this.nextTrack(true);
      });

      el.addEventListener('error', () => {
        const track = this.getAllTracks().find((t) => t.id === this.currentTrackId);
        this.isPlaying = false;
        this.isLoading = false;
        this.errorMessage = track
          ? `فایل صوتی «${track.filename}» در پوشه public/audio/ پیدا نشد یا قابل پخش نیست.`
          : 'فایل صوتی پیدا نشد یا قابل پخش نیست.';
        this.emit();
      });

      this.audioEl = el;
    }

    const ctx = this.ensureContext();
    if (ctx && this.masterGain && !this.audioElSource) {
      try {
        this.audioElSource = ctx.createMediaElementSource(this.audioEl);
        this.audioElSource.connect(this.masterGain);
      } catch {
        // Ignore if already connected
      }
    }
    return this.audioEl;
  }

  private applyGain() {
    if (this.masterGain && this.ctx) {
      const target = this.muted ? 0 : this.volume;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.04);
    }
    if (this.audioEl) {
      this.audioEl.muted = this.muted;
      this.audioEl.volume = this.muted ? 0 : this.volume;
    }
  }

  subscribe(listener: (snap: PlayerSnapshot) => void): () => void {
    this.listeners.add(listener);
    listener(this.getSnapshot());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit() {
    const snap = this.getSnapshot();
    this.listeners.forEach((cb) => cb(snap));
  }

  getSnapshot(): PlayerSnapshot {
    return {
      isPlaying: this.isPlaying,
      isLoading: this.isLoading,
      currentTrackId: this.currentTrackId,
      currentTime: this.currentTime,
      duration: this.duration,
      errorMessage: this.errorMessage,
      ambient: this.currentAmbient,
    };
  }

  getAllTracks(): MusicTrack[] {
    const configured: MusicTrack[] = MUSIC_TRACKS_CONFIG.map((cfg) => ({
      ...cfg,
      srcUrl: withBaseUrl(`audio/${cfg.filename}`),
      coverUrl: cfg.cover.startsWith('blob:') || cfg.cover.startsWith('data:')
        ? cfg.cover
        : withBaseUrl(cfg.cover),
    }));
    return [...configured, ...this.customTracks];
  }

  setVolume(vol: number) {
    this.volume = Math.max(0, Math.min(1, vol));
    this.applyGain();
  }

  setMuted(muted: boolean) {
    this.muted = muted;
    this.applyGain();
  }

  addCustomAudioFile(file: File): MusicTrack {
    const url = URL.createObjectURL(file);
    const track: MusicTrack = {
      id: `custom-${Date.now()}`,
      filename: file.name,
      title: file.name.replace(/\.[^/.]+$/, ''),
      artist: 'فایل انتخاب‌شده',
      cover: withBaseUrl('audio/covers/rainy-night.jpg'),
      accentColor: '#D9A9C5',
      srcUrl: url,
      coverUrl: withBaseUrl('audio/covers/rainy-night.jpg'),
      isCustomUpload: true,
    };
    this.customTracks.push(track);
    this.emit();
    return track;
  }

  selectTrackOnly(trackId: string) {
    const tracks = this.getAllTracks();
    const found = tracks.find((t) => t.id === trackId);
    if (!found) return;
    this.currentTrackId = found.id;
    this.errorMessage = null;
    this.currentTime = 0;
    this.duration = 0;
    if (this.audioEl) {
      this.audioEl.pause();
      this.audioEl.src = found.srcUrl;
      this.audioEl.load();
    }
    this.isPlaying = false;
    this.emit();
  }

  async playTrack(trackId?: string) {
    const tracks = this.getAllTracks();
    const targetId = trackId || this.currentTrackId || tracks[0]?.id;
    const track = tracks.find((t) => t.id === targetId) || tracks[0];
    if (!track) {
      this.errorMessage = 'هیچ آهنگی در فهرست موسیقی تعریف نشده است.';
      this.emit();
      return;
    }

    const el = this.ensureAudioElement();
    if (!el) return;

    this.errorMessage = null;
    const changingTrack = this.currentTrackId !== track.id || el.src === '';
    this.currentTrackId = track.id;

    if (changingTrack) {
      this.isLoading = true;
      this.currentTime = 0;
      this.duration = 0;
      el.src = track.srcUrl;
      el.load();
    }
    this.emit();

    try {
      await el.play();
      this.isPlaying = true;
      this.isLoading = false;
      this.emit();
    } catch {
      this.isPlaying = false;
      this.isLoading = false;
      if (!this.errorMessage) {
        this.errorMessage = `فایل صوتی «${track.filename}» در پوشه public/audio/ پیدا نشد یا مرورگر اجازه پخش نداد.`;
      }
      this.emit();
    }
  }

  pause() {
    if (this.audioEl) {
      this.audioEl.pause();
    }
    this.isPlaying = false;
    this.emit();
  }

  togglePlay(trackId?: string) {
    if (this.isPlaying && (!trackId || trackId === this.currentTrackId)) {
      this.pause();
    } else {
      void this.playTrack(trackId);
    }
  }

  seek(seconds: number) {
    if (!this.audioEl || !Number.isFinite(seconds)) return;
    this.audioEl.currentTime = Math.max(0, Math.min(this.duration || seconds, seconds));
    this.currentTime = this.audioEl.currentTime;
    this.emit();
  }

  nextTrack(autoStart = true) {
    const tracks = this.getAllTracks();
    if (tracks.length === 0) return;
    const idx = tracks.findIndex((t) => t.id === this.currentTrackId);
    const next = tracks[(idx + 1) % tracks.length];
    if (autoStart) {
      void this.playTrack(next.id);
    } else {
      this.selectTrackOnly(next.id);
    }
  }

  prevTrack() {
    const tracks = this.getAllTracks();
    if (tracks.length === 0) return;
    const idx = tracks.findIndex((t) => t.id === this.currentTrackId);
    const prev = tracks[(idx - 1 + tracks.length) % tracks.length];
    void this.playTrack(prev.id);
  }

  getPlayingState() {
    return {
      isPlaying: this.isPlaying,
      trackId: this.currentTrackId,
      ambient: this.currentAmbient,
    };
  }

  setAmbient(mode: 'none' | 'rain' | 'cafe' | 'night') {
    if (this.ambientNode) {
      try {
        this.ambientNode.stop();
        this.ambientNode.disconnect();
      } catch {
        // ignore
      }
      this.ambientNode = null;
    }
    if (this.ambientGain) {
      this.ambientGain.disconnect();
      this.ambientGain = null;
    }
    this.currentAmbient = mode;
    this.emit();
    if (mode === 'none') return;

    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain) return;

    const sampleRate = ctx.sampleRate;
    const len = sampleRate * 3;
    const buffer = ctx.createBuffer(1, len, sampleRate);
    const data = buffer.getChannelData(0);
    let b0 = 0, b1 = 0, b2 = 0;
    for (let i = 0; i < len; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.997 * b0 + white * 0.029;
      b1 = 0.985 * b1 + white * 0.032;
      b2 = 0.950 * b2 + white * 0.048;
      data[i] = (b0 + b1 + b2) * 0.32;
    }

    const src = ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;

    const filter = ctx.createBiquadFilter();
    filter.type = mode === 'rain' ? 'bandpass' : 'lowpass';
    filter.frequency.value = mode === 'rain' ? 920 : mode === 'cafe' ? 420 : 280;

    const gain = ctx.createGain();
    gain.gain.value = mode === 'rain' ? 0.14 : 0.08;

    src.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);
    src.start();

    this.ambientNode = src;
    this.ambientGain = gain;
  }

  getFrequencyBands(outArray: number[]) {
    if (!this.analyser || !this.freqBuffer || !this.isPlaying) {
      for (let i = 0; i < outArray.length; i++) {
        outArray[i] = outArray[i] * 0.85;
      }
      return;
    }
    this.analyser.getByteFrequencyData(this.freqBuffer);
    const step = Math.max(1, Math.floor(this.freqBuffer.length / outArray.length));
    for (let i = 0; i < outArray.length; i++) {
      const val = (this.freqBuffer[i * step] || 0) / 255;
      outArray[i] = outArray[i] * 0.35 + val * 0.65;
    }
  }

  playSfx(
    type: 'meow' | 'purr' | 'step' | 'toy' | 'yawn' | 'sparkle' | 'water' | 'portal' | 'click'
  ) {
    const ctx = this.ensureContext();
    if (!ctx || !this.masterGain || this.muted) return;
    const now = ctx.currentTime;

    if (type === 'meow') {
      // Multi-formant natural meow with expressive pitch contour
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc2.type = 'triangle';
      const pitchOffset = (Math.random() - 0.5) * 45;
      osc.frequency.setValueAtTime(490 + pitchOffset, now);
      osc.frequency.exponentialRampToValueAtTime(760 + pitchOffset, now + 0.13);
      osc.frequency.exponentialRampToValueAtTime(410 + pitchOffset, now + 0.42);
      osc2.frequency.setValueAtTime(980 + pitchOffset, now);
      osc2.frequency.exponentialRampToValueAtTime(1450 + pitchOffset, now + 0.13);
      osc2.frequency.exponentialRampToValueAtTime(780 + pitchOffset, now + 0.42);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(900, now);
      filter.frequency.exponentialRampToValueAtTime(1450, now + 0.12);
      filter.frequency.exponentialRampToValueAtTime(720, now + 0.42);
      filter.Q.value = 2.6;

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.16, now + 0.07);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.44);

      osc.connect(filter);
      osc2.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc2.start(now);
      osc.stop(now + 0.46);
      osc2.stop(now + 0.46);
    } else if (type === 'purr') {
      const osc = ctx.createOscillator();
      const harmonic = ctx.createOscillator();
      const lfo = ctx.createOscillator();
      const lfoGain = ctx.createGain();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      harmonic.type = 'sine';
      osc.frequency.setValueAtTime(54, now);
      harmonic.frequency.setValueAtTime(108, now);
      lfo.frequency.setValueAtTime(25, now);
      lfoGain.gain.setValueAtTime(0.065, now);
      filter.type = 'lowpass';
      filter.frequency.value = 240;

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.11, now + 0.12);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.95);
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      osc.connect(filter);
      harmonic.connect(filter);
      filter.connect(gain);
      gain.connect(this.masterGain);
      lfo.start(now);
      osc.start(now);
      harmonic.start(now);
      lfo.stop(now + 0.96);
      osc.stop(now + 0.96);
      harmonic.stop(now + 0.96);
    } else if (type === 'step') {
      // Soft padded paw step
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(145, now);
      osc.frequency.exponentialRampToValueAtTime(62, now + 0.055);
      gain.gain.setValueAtTime(0.038, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.065);
    } else if (type === 'toy') {
      // Gentle playful toy jingle + soft bounce
      [1320, 1760].forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + idx * 0.045);
        gain.gain.setValueAtTime(0.001, now + idx * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.09, now + idx * 0.045 + 0.015);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.045 + 0.24);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now + idx * 0.045);
        osc.stop(now + idx * 0.045 + 0.26);
      });
    } else if (type === 'yawn') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(240, now + 0.65);
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.exponentialRampToValueAtTime(0.075, now + 0.16);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.68);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.7);
    } else if (type === 'sparkle' || type === 'portal') {
      const freqs = type === 'portal' ? [392, 493.88, 587.33, 783.99, 987.77] : [587.33, 783.99, 1046.5];
      freqs.forEach((f, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, now + idx * 0.07);
        gain.gain.setValueAtTime(0.001, now + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.14, now + idx * 0.07 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.07 + 0.6);
        osc.connect(gain);
        gain.connect(this.masterGain!);
        osc.start(now + idx * 0.07);
        osc.stop(now + idx * 0.07 + 0.65);
      });
    } else if (type === 'water') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(360, now);
      osc.frequency.exponentialRampToValueAtTime(920, now + 0.14);
      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.18);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(640, now);
      gain.gain.setValueAtTime(0.06, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(now);
      osc.stop(now + 0.09);
    }
  }
}

export const audioEngine = new CozyAudioEngine();

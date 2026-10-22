// Procedural Web Audio Sound Synthesizer - 0 external files needed, instant response!

export class SoundSynth {
  private static instance: SoundSynth;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private isMuted: boolean = false;
  private initialized: boolean = false;

  private constructor() {}

  public static getInstance(): SoundSynth {
    if (!SoundSynth.instance) {
      SoundSynth.instance = new SoundSynth();
    }
    return SoundSynth.instance;
  }

  public init(): void {
    if (this.initialized) return;

    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;

      this.ctx = new AudioCtxClass();
      this.masterGain = this.ctx.createGain();
      this.sfxGain = this.ctx.createGain();

      this.masterGain.gain.setValueAtTime(0.7, this.ctx.currentTime);
      this.sfxGain.gain.setValueAtTime(0.8, this.ctx.currentTime);

      this.sfxGain.connect(this.masterGain);
      this.masterGain.connect(this.ctx.destination);

      this.initialized = true;
    } catch (e) {
      console.warn('Web Audio not supported or blocked:', e);
    }
  }

  public resumeContext(): void {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public toggleMute(): boolean {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : 0.7, this.ctx.currentTime);
    }
    return this.isMuted;
  }

  public setVolume(volume: number): void {
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime);
    }
  }

  // --- Sound Effects Generation ---

  public playLaser(frequency = 750, duration = 0.12): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(frequency, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + duration);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + duration);
  }

  public playBladeSlash(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const bufferSize = this.ctx.sampleRate * 0.15;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / bufferSize);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1200, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.15);
    filter.Q.value = 3;

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.15);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    noise.start(t);
  }

  public playDash(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(220, t);
    osc.frequency.exponentialRampToValueAtTime(55, t + 0.18);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.linearRampToValueAtTime(0.01, t + 0.18);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.18);
  }

  public playExplosion(intensity = 1): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const duration = 0.35 * Math.min(intensity, 2);

    // Low boom oscillator
    const osc = this.ctx.createOscillator();
    const oscGain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(120, t);
    osc.frequency.exponentialRampToValueAtTime(25, t + duration);

    oscGain.gain.setValueAtTime(0.6 * intensity, t);
    oscGain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    osc.connect(oscGain);
    oscGain.connect(this.sfxGain);
    osc.start(t);
    osc.stop(t + duration);

    // Noise rumble
    const bufferSize = Math.floor(this.ctx.sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(600, t);
    filter.frequency.exponentialRampToValueAtTime(80, t + duration);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.5 * intensity, t);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, t + duration);

    noise.connect(filter);
    filter.connect(noiseGain);
    noiseGain.connect(this.sfxGain);
    noise.start(t);
  }

  public playHit(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(320, t);
    osc.frequency.exponentialRampToValueAtTime(80, t + 0.08);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.08);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.08);
  }

  public playXpChime(pitchMultiplier = 1): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    // Pentatonic scale note base
    const baseFreq = 523.25; // C5
    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq * pitchMultiplier, t);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * pitchMultiplier * 1.5, t + 0.1);

    gain.gain.setValueAtTime(0.2, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.12);
  }

  public playLevelUp(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resumeContext();

    // C-E-G-B-C chord fanfare
    const notes = [523.25, 659.25, 783.99, 987.77, 1046.5];
    notes.forEach((freq, index) => {
      const delay = index * 0.07;
      const t = this.ctx!.currentTime + delay;
      const osc = this.ctx!.createOscillator();
      const gain = this.ctx!.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.3, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.35);

      osc.connect(gain);
      gain.connect(this.sfxGain!);

      osc.start(t);
      osc.stop(t + 0.35);
    });
  }

  public playMenuBeep(isSelect = false): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(isSelect ? 880 : 440, t);
    if (isSelect) {
      osc.frequency.exponentialRampToValueAtTime(1320, t + 0.06);
    }

    gain.gain.setValueAtTime(0.15, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + (isSelect ? 0.08 : 0.04));

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + (isSelect ? 0.08 : 0.04));
  }

  public playOverdrive(): void {
    if (!this.ctx || !this.sfxGain || this.isMuted) return;
    this.resumeContext();

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(150, t);
    osc.frequency.exponentialRampToValueAtTime(1200, t + 0.4);

    gain.gain.setValueAtTime(0.4, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(t);
    osc.stop(t + 0.4);
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  public getMasterGain(): GainNode | null {
    return this.masterGain;
  }
}

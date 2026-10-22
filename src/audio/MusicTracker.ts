// Procedural Cyberpunk Synthwave Background Music Generator

import { SoundSynth } from './SoundSynth';

export class MusicTracker {
  private static instance: MusicTracker;
  private isPlaying: boolean = false;
  private currentStep: number = 0;
  private tempo: number = 124; // 124 BPM cyberpunk groove
  private timerId: number | null = null;
  private musicGain: GainNode | null = null;

  // Bass chord progression in F minor (F -> Db -> Eb -> C)
  private chordProgression = [
    { root: 87.31, third: 104.82, fifth: 130.81 }, // F2
    { root: 69.30, third: 87.31, fifth: 103.83 },  // Db2
    { root: 77.78, third: 97.99, fifth: 116.54 },  // Eb2
    { root: 65.41, third: 82.41, fifth: 97.99 }    // C2
  ];

  // Lead arpeggio notes (F minor pentatonic across octaves 4 and 5)
  private leadScale = [349.23, 392.00, 415.30, 523.25, 622.25, 698.46, 783.99, 830.61];

  private constructor() {}

  public static getInstance(): MusicTracker {
    if (!MusicTracker.instance) {
      MusicTracker.instance = new MusicTracker();
    }
    return MusicTracker.instance;
  }

  public start(): void {
    if (this.isPlaying) return;

    const synth = SoundSynth.getInstance();
    const ctx = synth.getContext();
    const masterGain = synth.getMasterGain();

    if (!ctx || !masterGain) return;

    this.musicGain = ctx.createGain();
    this.musicGain.gain.setValueAtTime(0.35, ctx.currentTime);
    this.musicGain.connect(masterGain);

    this.isPlaying = true;
    this.currentStep = 0;

    const stepInterval = (60 / this.tempo / 4) * 1000; // 16th note in ms
    this.timerId = window.setInterval(() => this.step(), stepInterval);
  }

  public stop(): void {
    if (!this.isPlaying) return;
    this.isPlaying = false;
    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }
  }

  private step(): void {
    if (!this.isPlaying) return;

    const synth = SoundSynth.getInstance();
    const ctx = synth.getContext();
    if (!ctx || !this.musicGain) return;

    const t = ctx.currentTime;
    const measure = Math.floor(this.currentStep / 16) % 4;
    const stepInMeasure = this.currentStep % 16;
    const chord = this.chordProgression[measure];

    // 1. Kick on beats 0, 4, 8, 12
    if (stepInMeasure % 4 === 0) {
      this.playKick(ctx, t);
    }

    // 2. Snare on beats 4 and 12
    if (stepInMeasure === 4 || stepInMeasure === 12) {
      this.playSnare(ctx, t);
    }

    // 3. Hi-Hat on every 2nd 16th note
    if (stepInMeasure % 2 === 1) {
      this.playHiHat(ctx, t, stepInMeasure % 4 === 2);
    }

    // 4. Bass pulse on 16th notes
    if (stepInMeasure % 2 === 0) {
      this.playBassNote(ctx, t, chord.root);
    }

    // 5. Generative Cyber Arpeggiator
    if (stepInMeasure % 2 === 1 && Math.random() > 0.25) {
      const noteIdx = (this.currentStep * 3 + measure) % this.leadScale.length;
      const freq = this.leadScale[noteIdx];
      this.playLeadNote(ctx, t, freq);
    }

    this.currentStep++;
  }

  private playKick(ctx: AudioContext, t: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.frequency.setValueAtTime(140, t);
    osc.frequency.exponentialRampToValueAtTime(35, t + 0.12);

    gain.gain.setValueAtTime(0.7, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    osc.connect(gain);
    gain.connect(this.musicGain!);

    osc.start(t);
    osc.stop(t + 0.14);
  }

  private playSnare(ctx: AudioContext, t: number): void {
    // Noise buffer
    const bufferSize = ctx.sampleRate * 0.12;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 1.5);
    }

    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.setValueAtTime(800, t);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.12);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain!);

    noise.start(t);
  }

  private playHiHat(ctx: AudioContext, t: number, accent: boolean): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'square';
    osc.frequency.setValueAtTime(7500, t);

    gain.gain.setValueAtTime(accent ? 0.08 : 0.035, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);

    osc.connect(gain);
    gain.connect(this.musicGain!);

    osc.start(t);
    osc.stop(t + 0.03);
  }

  private playBassNote(ctx: AudioContext, t: number, freq: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(350, t);
    filter.frequency.exponentialRampToValueAtTime(120, t + 0.1);

    gain.gain.setValueAtTime(0.28, t);
    gain.gain.exponentialRampToValueAtTime(0.01, t + 0.11);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.musicGain!);

    osc.start(t);
    osc.stop(t + 0.11);
  }

  private playLeadNote(ctx: AudioContext, t: number, freq: number): void {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    osc.connect(gain);
    gain.connect(this.musicGain!);

    osc.start(t);
    osc.stop(t + 0.18);
  }
}

// All sound is synthesised live with the Web Audio API: no audio files, no licences.
// Browsers only allow audio after the player clicks or presses a key, so nothing plays until `unlock()`.

type Ambience = 'outdoor' | 'indoor';

const A_MINOR_CHORDS: ReadonlyArray<readonly number[]> = [
  [110.0, 164.81, 261.63], // Am
  [87.31, 130.81, 220.0], // F
  [146.83, 174.61, 220.0], // Dm
  [82.41, 123.47, 207.65], // E
];
const MELODY = [440.0, 523.25, 587.33, 659.25, 783.99, 880.0]; // A minor pentatonic
const CHORD_SECONDS = 8;
const MUTE_KEY = 'case-files-serdang-raya:muted';

class Sound {
  private ctx: AudioContext | null = null;
  private master!: GainNode;
  private musicBus!: GainNode;
  private ambienceBus!: GainNode;
  private sfxBus!: GainNode;
  private noise!: AudioBuffer;
  private muted = readMuted();
  private ambience: Ambience | null = null;
  private ambienceStop: Array<() => void> = [];
  private nextChordAt = 0;
  private chordIndex = 0;
  private nextNoteAt = 0;
  private nextChirpAt = 0;

  /** Starts audio. Call from a click or key press; safe to call again. */
  unlock(): void {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return; // no Web Audio: the game simply stays silent
    const ctx = new Ctor();
    this.ctx = ctx;
    this.master = ctx.createGain();
    this.master.gain.value = this.muted ? 0 : 0.9;
    this.master.connect(ctx.destination);
    this.musicBus = this.bus(0.55);
    this.ambienceBus = this.bus(0.8);
    this.sfxBus = this.bus(0.9);
    this.noise = makeNoise(ctx);
    this.nextChordAt = ctx.currentTime + 0.1;
    this.nextNoteAt = ctx.currentTime + 2;
    this.nextChirpAt = ctx.currentTime + 1;
    window.setInterval(() => this.schedule(), 200);
    if (this.ambience) this.startAmbience(this.ambience);
  }

  get isMuted(): boolean {
    return this.muted;
  }

  toggleMute(): boolean {
    this.muted = !this.muted;
    try {
      localStorage.setItem(MUTE_KEY, this.muted ? '1' : '0');
    } catch {
      // ignore: the setting just won't be remembered
    }
    if (this.ctx) this.master.gain.setTargetAtTime(this.muted ? 0 : 0.9, this.ctx.currentTime, 0.05);
    return this.muted;
  }

  /** Background for where the player is: crickets and wind outside, a quiet hum indoors. */
  setAmbience(kind: Ambience): void {
    if (this.ambience === kind) return;
    this.ambience = kind;
    if (this.ctx) this.startAmbience(kind);
  }

  // --- Sound effects ------------------------------------------------------------

  step(kind: Ambience): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const src = this.noiseSource();
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = (kind === 'indoor' ? 1700 : 700) * (0.85 + Math.random() * 0.3);
    filter.Q.value = kind === 'indoor' ? 3 : 1.2;
    const g = this.envelope(t, 0.002, kind === 'indoor' ? 0.05 : 0.08, kind === 'indoor' ? 0.09 : 0.07);
    src.connect(filter).connect(g).connect(this.sfxBus);
    src.start(t);
    src.stop(t + 0.15);
  }

  pickup(): void {
    this.tone(1318.5, 0, 0.35, 0.12, 'sine');
    this.tone(1975.5, 0.09, 0.5, 0.1, 'sine');
  }

  talk(): void {
    this.tone(620, 0, 0.08, 0.06, 'triangle');
  }

  select(): void {
    this.tone(880, 0, 0.05, 0.05, 'triangle');
  }

  connect(): void {
    [440, 554.37, 659.25, 880].forEach((f, i) => this.tone(f, i * 0.07, 0.45, 0.08, 'sine'));
  }

  reject(): void {
    this.tone(110, 0, 0.3, 0.07, 'sawtooth', 600);
  }

  door(): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime;
    const src = this.noiseSource();
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.Q.value = 1.5;
    filter.frequency.setValueAtTime(300, t);
    filter.frequency.exponentialRampToValueAtTime(1400, t + 0.35);
    const g = this.envelope(t, 0.05, 0.35, 0.1);
    src.connect(filter).connect(g).connect(this.sfxBus);
    src.start(t);
    src.stop(t + 0.5);
  }

  /** A low bell for the start of each day. */
  dayStart(): void {
    this.tone(110, 0, 3.5, 0.16, 'sine');
    this.tone(220, 0, 2.5, 0.08, 'sine');
    this.tone(330.8, 0, 1.6, 0.04, 'sine');
  }

  ending(kind: 'true' | 'unproven' | 'wrong'): void {
    const chord = kind === 'true' ? [261.63, 329.63, 392.0, 523.25] : kind === 'unproven' ? [220, 261.63, 311.13] : [110, 116.54, 155.56];
    chord.forEach((f, i) => this.tone(f, i * 0.12, 4, kind === 'true' ? 0.08 : 0.07, kind === 'wrong' ? 'sawtooth' : 'triangle', 1200));
  }

  // --- Internals -------------------------------------------------------------------

  private bus(level: number): GainNode {
    const g = this.ctx!.createGain();
    g.gain.value = level;
    g.connect(this.master);
    return g;
  }

  private noiseSource(): AudioBufferSourceNode {
    const src = this.ctx!.createBufferSource();
    src.buffer = this.noise;
    src.loop = true;
    src.loopStart = Math.random();
    return src;
  }

  /** A gain node that rises over `attack` seconds to `peak`, then dies away over `decay`. */
  private envelope(t: number, attack: number, decay: number, peak: number): GainNode {
    const g = this.ctx!.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
    return g;
  }

  private tone(freq: number, delay: number, length: number, peak: number, type: OscillatorType, lowpass?: number, bus = this.sfxBus): void {
    const ctx = this.ctx;
    if (!ctx) return;
    const t = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = freq;
    const g = this.envelope(t, 0.01, length, peak);
    let out: AudioNode = osc.connect(g);
    if (lowpass) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = lowpass;
      out = out.connect(f);
    }
    out.connect(bus);
    osc.start(t);
    osc.stop(t + length + 0.1);
  }

  /** Called a few times a second: queues the next chord, melody note and cricket chirp. */
  private schedule(): void {
    const ctx = this.ctx;
    if (!ctx || ctx.state !== 'running') return;
    const horizon = ctx.currentTime + 0.5;

    while (this.nextChordAt < horizon) {
      this.playChord(A_MINOR_CHORDS[this.chordIndex % A_MINOR_CHORDS.length], this.nextChordAt);
      this.chordIndex++;
      this.nextChordAt += CHORD_SECONDS;
    }
    while (this.nextNoteAt < horizon) {
      const f = MELODY[Math.floor(Math.random() * MELODY.length)];
      this.tone(f, this.nextNoteAt - ctx.currentTime, 2.2, 0.03, 'sine', undefined, this.musicBus);
      this.tone(f * 2, this.nextNoteAt - ctx.currentTime, 0.8, 0.008, 'sine', undefined, this.musicBus);
      this.nextNoteAt += 1.6 + Math.random() * 2.4;
    }
    if (this.ambience === 'outdoor') {
      while (this.nextChirpAt < horizon) {
        this.chirp(this.nextChirpAt);
        this.nextChirpAt += 0.6 + Math.random() * 1.4;
      }
    } else {
      this.nextChirpAt = horizon;
    }
  }

  private playChord(freqs: readonly number[], at: number): void {
    const ctx = this.ctx!;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 700;
    filter.connect(this.musicBus);
    for (const f of freqs) {
      for (const detune of [-6, 6]) {
        const osc = ctx.createOscillator();
        osc.type = 'triangle';
        osc.frequency.value = f;
        osc.detune.value = detune;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, at);
        g.gain.exponentialRampToValueAtTime(0.022, at + 2.5);
        g.gain.setValueAtTime(0.022, at + CHORD_SECONDS - 2);
        g.gain.exponentialRampToValueAtTime(0.0001, at + CHORD_SECONDS + 1);
        osc.connect(g).connect(filter);
        osc.start(at);
        osc.stop(at + CHORD_SECONDS + 1.2);
      }
    }
  }

  /** A cricket: a few fast high pulses, panned somewhere in the dark. */
  private chirp(at: number): void {
    const ctx = this.ctx!;
    const pan = ctx.createStereoPanner();
    pan.pan.value = Math.random() * 1.6 - 0.8;
    pan.connect(this.ambienceBus);
    const f = 4200 + Math.random() * 600;
    for (let i = 0; i < 3; i++) {
      const t = at + i * 0.045;
      const osc = ctx.createOscillator();
      osc.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.012, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.03);
      osc.connect(g).connect(pan);
      osc.start(t);
      osc.stop(t + 0.04);
    }
  }

  private startAmbience(kind: Ambience): void {
    const ctx = this.ctx!;
    const t = ctx.currentTime;
    this.ambienceStop.forEach((stop) => stop());
    this.ambienceStop = [];

    const fadeIn = (g: GainNode, level: number) => {
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(level, t + 1.5);
    };
    const keep = (nodes: AudioScheduledSourceNode[], g: GainNode) =>
      this.ambienceStop.push(() => {
        const now = ctx.currentTime;
        g.gain.cancelScheduledValues(now);
        g.gain.setTargetAtTime(0.0001, now, 0.3);
        nodes.forEach((n) => n.stop(now + 1.5));
      });

    if (kind === 'outdoor') {
      // Wind: noise through a low filter that slowly opens and closes.
      const src = this.noiseSource();
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = 380;
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoDepth = ctx.createGain();
      lfoDepth.gain.value = 180;
      lfo.connect(lfoDepth).connect(filter.frequency);
      const g = ctx.createGain();
      fadeIn(g, 0.05);
      src.connect(filter).connect(g).connect(this.ambienceBus);
      src.start(t);
      lfo.start(t);
      keep([src, lfo], g);
    } else {
      // Fluorescent hum and a little air-conditioning hiss.
      const hum = ctx.createOscillator();
      hum.frequency.value = 100;
      const hum2 = ctx.createOscillator();
      hum2.frequency.value = 200;
      const humGain = ctx.createGain();
      fadeIn(humGain, 0.012);
      const hum2Gain = ctx.createGain();
      hum2Gain.gain.value = 0.4;
      hum.connect(humGain);
      hum2.connect(hum2Gain).connect(humGain);
      humGain.connect(this.ambienceBus);
      const air = this.noiseSource();
      const airFilter = ctx.createBiquadFilter();
      airFilter.type = 'lowpass';
      airFilter.frequency.value = 260;
      const airGain = ctx.createGain();
      fadeIn(airGain, 0.03);
      air.connect(airFilter).connect(airGain).connect(this.ambienceBus);
      hum.start(t);
      hum2.start(t);
      air.start(t);
      keep([hum, hum2], humGain);
      keep([air], airGain);
    }
  }
}

function makeNoise(ctx: AudioContext): AudioBuffer {
  const buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  let last = 0;
  for (let i = 0; i < data.length; i++) {
    // Slightly smoothed white noise: softer, less hissy.
    last = 0.6 * last + 0.4 * (Math.random() * 2 - 1);
    data[i] = last;
  }
  return buffer;
}

function readMuted(): boolean {
  try {
    return localStorage.getItem(MUTE_KEY) === '1';
  } catch {
    return false;
  }
}

/** The one sound system for the whole game. */
export const sound = new Sound();

// Generative ambient ocean & harmonic chime synthesizer via Web Audio API

class GenerativeAudioSynth {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = true;
  private masterGain: GainNode | null = null;
  private oceanFilter: BiquadFilterNode | null = null;
  private oceanNoiseNode: AudioBufferSourceNode | null = null;
  private lfoGain: GainNode | null = null;
  private isRunning: boolean = false;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(0.0, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);
      this.setupOceanWaveNode();
    } catch (e) {
      console.warn('Web Audio API not supported or blocked:', e);
    }
  }

  private setupOceanWaveNode() {
    if (!this.ctx || !this.masterGain) return;

    // Create 5-second buffer of filtered brown noise
    const bufferSize = this.ctx.sampleRate * 4;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    let lastOut = 0.0;

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise integration
      output[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = output[i];
      output[i] *= 3.5; // boost
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;

    // Ocean filter simulating swell surf
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(320, this.ctx.currentTime);
    filter.Q.setValueAtTime(2.5, this.ctx.currentTime);
    this.oceanFilter = filter;

    const oceanGain = this.ctx.createGain();
    oceanGain.gain.setValueAtTime(0.4, this.ctx.currentTime);

    noiseSource.connect(filter);
    filter.connect(oceanGain);
    oceanGain.connect(this.masterGain);

    noiseSource.start();
    this.oceanNoiseNode = noiseSource;
    this.isRunning = true;
  }

  public updateOceanSwell(wavePeriod: number, waveHeight: number) {
    if (!this.ctx || !this.oceanFilter) return;
    const now = this.ctx.currentTime;
    // Oscillate filter cutoff based on wave period
    const cycleTime = Math.max(4, Math.min(20, wavePeriod));
    const baseFreq = 180 + waveHeight * 120;
    const peakFreq = baseFreq + waveHeight * 380;

    try {
      this.oceanFilter.frequency.cancelScheduledValues(now);
      this.oceanFilter.frequency.setValueAtTime(baseFreq, now);
      this.oceanFilter.frequency.exponentialRampToValueAtTime(peakFreq, now + cycleTime * 0.45);
      this.oceanFilter.frequency.exponentialRampToValueAtTime(baseFreq, now + cycleTime);
    } catch {
      // Ignore audio ramp errors
    }
  }

  public playHarmonicNote(frequency: number = 440, duration: number = 1.2) {
    if (this.isMuted || !this.ctx || !this.masterGain) return;
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();

    // Pure crystal sine wave with gentle overtone
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, now);

    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.exponentialRampToValueAtTime(0.12, now + 0.04);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

    osc.connect(noteGain);
    noteGain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 0.1);
  }

  public playCharSound(char: string, index: number) {
    if (this.isMuted) return;
    const code = char.charCodeAt(0) || 65;
    // Pentatonic scale (C, D, E, G, A) across octaves
    const pentatonicRatios = [1, 9/8, 5/4, 3/2, 5/3, 2];
    const octave = 2 + (code % 3);
    const degree = (code + index) % pentatonicRatios.length;
    const baseFreq = 130.81 * Math.pow(2, octave) * pentatonicRatios[degree];

    this.playHarmonicNote(baseFreq, 1.4);
  }

  public toggleMute(): boolean {
    this.init();
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }

    this.isMuted = !this.isMuted;
    if (this.masterGain && this.ctx) {
      const targetGain = this.isMuted ? 0.0 : 0.6;
      this.masterGain.gain.setValueAtTime(this.masterGain.gain.value, this.ctx.currentTime);
      this.masterGain.gain.linearRampToValueAtTime(targetGain, this.ctx.currentTime + 0.3);
    }
    return !this.isMuted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }
}

export const audioSynth = new GenerativeAudioSynth();

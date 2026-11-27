// Tiny WebAudio synth for TURKEY RUN: every sound is an oscillator or two, no audio files.
// The context is created lazily on the first user gesture (unlock), and every method is a
// safe no-op before that, so screenshot scenes and muted tabs never throw.

class Sfx {
  constructor() {
    this.ctx = null;
    this.master = null;
  }

  /** Create the context on a user gesture; later calls just resume it. */
  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  /** One oscillator note with a quick envelope; the building block of every sound here. */
  tone(freqFrom, freqTo, seconds, type = 'square', volume = 0.2, delay = 0) {
    if (!this.ctx || !this.master) return;
    try {
      const t0 = this.ctx.currentTime + delay;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freqFrom, t0);
      osc.frequency.exponentialRampToValueAtTime(Math.max(30, freqTo), t0 + seconds);
      gain.gain.setValueAtTime(volume, t0);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t0);
      osc.stop(t0 + seconds + 0.02);
    } catch {
      /* a failed note is silent, never fatal */
    }
  }

  /** Short rising blip when the turkey leaves the ground. */
  jump() {
    this.tone(340, 720, 0.14, 'square', 0.12);
  }

  /** The second, higher blip of the double jump. */
  doubleJump() {
    this.tone(520, 980, 0.14, 'square', 0.12);
  }

  /** A happy warbling gobble for the title screen and the escape. */
  gobble() {
    for (let i = 0; i < 5; i += 1) {
      this.tone(300 + (i % 2) * 130, 240, 0.07, 'sawtooth', 0.10, i * 0.07);
    }
  }

  /** A harsh squawk when a hazard costs a heart. */
  squawk() {
    this.tone(880, 220, 0.22, 'sawtooth', 0.22);
    this.tone(1240, 300, 0.16, 'sawtooth', 0.14, 0.05);
  }

  /** Two-note alarm sting for the moment the farmer spots the turkey again. */
  alarm() {
    this.tone(196, 196, 0.12, 'triangle', 0.3);
    this.tone(147, 147, 0.2, 'triangle', 0.3, 0.12);
  }

  /** Bright pickup chirp; the pitch climbs with the combo multiplier. */
  pickup(combo = 1) {
    const base = 620 + Math.min(5, combo) * 90;
    this.tone(base, base * 1.5, 0.09, 'square', 0.10);
  }

  /** A dull thud for the farmer tripping over a pumpkin. */
  thud() {
    this.tone(120, 55, 0.18, 'sine', 0.35);
  }

  /** Little arpeggio for reaching the forest: the win jingle. */
  win() {
    const notes = [523, 659, 784, 1047];
    notes.forEach((f, i) => this.tone(f, f, 0.22, 'triangle', 0.2, i * 0.13));
    this.gobble();
  }

  /** Descending slide for the caught screen. */
  lose() {
    this.tone(392, 98, 0.7, 'triangle', 0.22);
  }
}

/** The one shared sound box the game modules call. */
export const sfx = new Sfx();

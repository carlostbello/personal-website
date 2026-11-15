// A tiny guitar rig in Web Audio: Karplus-Strong strings into a drive
// pedal (waveshaper) and an echo pedal (feedback delay). Nothing is
// created until the first pluck, which always comes from a user gesture.

/** Standard tuning, low E to high E. */
const TUNING = [82.41, 110.0, 146.83, 196.0, 246.94, 329.63];

export interface Rig {
  wake(): void;
  pluck(string: number, velocity?: number, delay?: number): void;
  setDrive(on: boolean): void;
  setEcho(on: boolean): void;
  setMuted(muted: boolean): void;
  dispose(): void;
}

/** One plucked string, rendered offline into a buffer. */
function karplusStrong(ctx: BaseAudioContext, freq: number, seconds = 3.2): AudioBuffer {
  const sr = ctx.sampleRate;
  const length = Math.floor(sr * seconds);
  const buffer = ctx.createBuffer(1, length, sr);
  const out = buffer.getChannelData(0);
  // The two-point average adds half a sample of delay.
  const n = Math.max(2, Math.round(sr / freq - 0.5));
  // Excitation: a burst of noise, lightly smoothed so it sounds like a
  // pick rather than a hiss.
  let prev = 0;
  for (let i = 0; i < n; i++) {
    prev = prev * 0.4 + (Math.random() * 2 - 1) * 0.6;
    out[i] = prev;
  }
  // Low strings ring longer than high ones.
  const decay = Math.min(0.9992, 0.9955 + (1 - freq / 400) * 0.0035);
  for (let i = n; i < length; i++) {
    out[i] = decay * 0.5 * (out[i - n] + out[i - n - 1 < 0 ? 0 : i - n - 1]);
  }
  // Normalize and fade the tail so nothing clicks.
  let peak = 0;
  for (let i = 0; i < length; i++) peak = Math.max(peak, Math.abs(out[i]));
  const gain = peak > 0 ? 0.6 / peak : 1;
  const fade = Math.floor(sr * 0.2);
  for (let i = 0; i < length; i++) {
    const tail = i > length - fade ? (length - i) / fade : 1;
    out[i] *= gain * tail;
  }
  return buffer;
}

function driveCurve(amount: number): Float32Array<ArrayBuffer> {
  const n = 1024;
  const curve = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const x = (i / (n - 1)) * 2 - 1;
    curve[i] = Math.tanh(x * amount) / Math.tanh(amount);
  }
  return curve;
}

export function createRig(): Rig {
  let ctx: AudioContext | null = null;
  let buffers: AudioBuffer[] = [];
  let input: GainNode;
  let dry: GainNode;
  let driven: GainNode;
  let echoWet: GainNode;
  let master: GainNode;
  let drive = false;
  let echo = false;
  let muted = false;

  const level = () => (muted ? 0 : 0.7);

  function build() {
    if (ctx) return ctx;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    buffers = TUNING.map((f) => karplusStrong(ctx!, f));

    input = ctx.createGain();
    dry = ctx.createGain();
    driven = ctx.createGain();
    const pre = ctx.createGain();
    const shaper = ctx.createWaveShaper();
    const tone = ctx.createBiquadFilter();
    const mix = ctx.createGain();
    const delay = ctx.createDelay(1);
    const feedback = ctx.createGain();
    const damp = ctx.createBiquadFilter();
    echoWet = ctx.createGain();
    master = ctx.createGain();
    const comp = ctx.createDynamicsCompressor();

    pre.gain.value = 9;
    shaper.curve = driveCurve(3.2);
    shaper.oversample = '4x';
    tone.type = 'lowpass';
    tone.frequency.value = 3400;
    delay.delayTime.value = 0.31;
    feedback.gain.value = 0.42;
    damp.type = 'lowpass';
    damp.frequency.value = 2600;

    dry.gain.value = drive ? 0 : 1;
    driven.gain.value = drive ? 0.32 : 0;
    echoWet.gain.value = echo ? 0.55 : 0;
    master.gain.value = level();

    input.connect(dry).connect(mix);
    input.connect(pre).connect(shaper).connect(tone).connect(driven).connect(mix);
    mix.connect(master);
    mix.connect(delay);
    delay.connect(damp).connect(feedback).connect(delay);
    damp.connect(echoWet).connect(master);
    master.connect(comp).connect(ctx.destination);
    return ctx;
  }

  const ramp = (param: AudioParam, value: number) => {
    if (!ctx) return;
    param.setTargetAtTime(value, ctx.currentTime, 0.02);
  };

  return {
    wake() {
      if (muted) return;
      const c = build();
      if (c && c.state === 'suspended') void c.resume();
    },
    pluck(string, velocity = 1, delay = 0) {
      if (muted) return;
      const c = build();
      if (!c) return;
      if (c.state === 'suspended') void c.resume();
      const src = c.createBufferSource();
      src.buffer = buffers[string];
      src.playbackRate.value = 1 + (Math.random() - 0.5) * 0.002;
      const g = c.createGain();
      g.gain.value = 0.55 * velocity;
      src.connect(g).connect(input);
      src.start(c.currentTime + delay);
      src.onended = () => g.disconnect();
    },
    setDrive(on) {
      drive = on;
      if (!ctx) return;
      ramp(dry.gain, on ? 0 : 1);
      ramp(driven.gain, on ? 0.32 : 0);
    },
    setEcho(on) {
      echo = on;
      if (!ctx) return;
      ramp(echoWet.gain, on ? 0.55 : 0);
    },
    setMuted(m) {
      muted = m;
      if (!ctx) return;
      ramp(master.gain, level());
    },
    dispose() {
      void ctx?.close();
      ctx = null;
    },
  };
}

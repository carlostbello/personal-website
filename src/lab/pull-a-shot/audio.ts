// Synthesized machine noises: a vibratory pump hum, a hiss when water
// hits the puck and when the three-way valve dumps, and a trickle that
// follows the flow. Nothing is created until the first press, so the
// AudioContext always starts inside a user gesture.

export interface RigAudio {
  start(): void;
  update(pressure: number, flow: number): void;
  dump(): void;
  stop(): void;
  setMuted(muted: boolean): void;
  dispose(): void;
}

export function createAudio(initiallyMuted: boolean): RigAudio {
  let muted = initiallyMuted;
  let ctx: AudioContext | null = null;
  let master: GainNode, pump: GainNode, hiss: GainNode, trickle: GainNode;
  let hum: OscillatorNode, buzz: OscillatorNode;
  const sources: AudioScheduledSourceNode[] = [];

  function ensure() {
    if (ctx) return ctx;
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = muted ? 0 : 0.5;
    master.connect(ctx.destination);

    // Pump: a low sawtooth plus its octave, muffled like it is inside a case.
    const body = ctx.createBiquadFilter();
    body.type = 'lowpass';
    body.frequency.value = 340;
    pump = ctx.createGain();
    pump.gain.value = 0;
    hum = ctx.createOscillator();
    hum.type = 'sawtooth';
    hum.frequency.value = 58;
    buzz = ctx.createOscillator();
    buzz.type = 'square';
    buzz.frequency.value = 116;
    const buzzLevel = ctx.createGain();
    buzzLevel.gain.value = 0.25;
    hum.connect(body);
    buzz.connect(buzzLevel).connect(body);
    body.connect(pump).connect(master);

    // One loop of white noise feeds both the hiss and the trickle.
    const noise = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
    const data = noise.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = noise;
    src.loop = true;

    const hissBand = ctx.createBiquadFilter();
    hissBand.type = 'bandpass';
    hissBand.frequency.value = 2600;
    hissBand.Q.value = 0.6;
    hiss = ctx.createGain();
    hiss.gain.value = 0;
    src.connect(hissBand).connect(hiss).connect(master);

    const pour = ctx.createBiquadFilter();
    pour.type = 'bandpass';
    pour.frequency.value = 820;
    pour.Q.value = 3;
    trickle = ctx.createGain();
    trickle.gain.value = 0;
    src.connect(pour).connect(trickle).connect(master);

    for (const s of [hum, buzz, src]) {
      s.start();
      sources.push(s);
    }
    return ctx;
  }

  const burst = (level: number, length: number) => {
    if (!ctx) return;
    const t = ctx.currentTime;
    hiss.gain.cancelScheduledValues(t);
    hiss.gain.setValueAtTime(hiss.gain.value, t);
    hiss.gain.linearRampToValueAtTime(level, t + 0.03);
    hiss.gain.exponentialRampToValueAtTime(0.0001, t + length);
  };

  return {
    start() {
      const c = ensure();
      if (!c) return;
      void c.resume();
      const t = c.currentTime;
      pump.gain.cancelScheduledValues(t);
      pump.gain.setTargetAtTime(0.16, t, 0.06);
      burst(0.12, 0.9);
    },
    update(pressure, flow) {
      if (!ctx) return;
      const t = ctx.currentTime;
      // The pump labors and drops in pitch as the puck pushes back.
      hum.frequency.setTargetAtTime(60 - pressure * 0.9, t, 0.05);
      buzz.frequency.setTargetAtTime(120 - pressure * 1.8, t, 0.05);
      trickle.gain.setTargetAtTime(Math.min(0.09, flow * 0.008), t, 0.08);
    },
    dump() {
      if (!ctx) return;
      const t = ctx.currentTime;
      pump.gain.cancelScheduledValues(t);
      pump.gain.setTargetAtTime(0, t, 0.03);
      burst(0.3, 0.55);
    },
    stop() {
      if (!ctx) return;
      const t = ctx.currentTime;
      pump.gain.setTargetAtTime(0, t, 0.03);
      trickle.gain.setTargetAtTime(0, t, 0.1);
    },
    setMuted(m) {
      muted = m;
      if (ctx) master.gain.setTargetAtTime(m ? 0 : 0.5, ctx.currentTime, 0.02);
    },
    dispose() {
      sources.forEach((s) => {
        try {
          s.stop();
        } catch {
          /* already stopped */
        }
      });
      void ctx?.close();
      ctx = null;
    },
  };
}

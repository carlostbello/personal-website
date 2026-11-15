// "Air gap": the day-job diagram printed on a sheet of paper that unfolds
// as it scrolls in. Hand-written shaders: the vertex shader folds the
// sheet into an accordion (uProgress), lifts it under the pointer
// (uPointer/uPress) and ripples it where a packet hits the gap (uHit).
// The fragment shader does a two-step toon light printed as halftone dots
// and inks the fold creases. Packets are small sprites riding the same
// deformation, computed on the CPU with a mirror of the vertex math.

import * as THREE from 'three';
import { drawBurst, drawDiagram, drawPacket, layoutFor, type Layout, type Palette, type Pt } from './diagram';

const vert = /* glsl */ `
uniform float uProgress;
uniform float uPanels;
uniform float uVertical;
uniform vec2 uSize;
uniform vec2 uPointer;
uniform float uPress;
uniform vec4 uHit;
varying vec2 vUv;
varying vec3 vN;

void main() {
  vUv = uv;
  float len = uVertical > 0.5 ? uSize.y : uSize.x;
  float a = uVertical > 0.5 ? 1.0 - uv.y : uv.x;
  float s = a * len;
  float w = len / uPanels;
  float i = min(floor(s / w), uPanels - 1.0);
  float l = s - i * w;
  float th = (1.0 - uProgress) * 1.32;
  float c = cos(th);
  float sn = sin(th);
  bool odd = mod(i, 2.0) > 0.5;
  float A = (i * w + l) * c - len * c * 0.5;
  float Z = (odd ? w - l : l) * sn - w * sn * 0.5;
  float dz = odd ? -sn : sn;

  vec3 p;
  vec3 n;
  if (uVertical > 0.5) {
    p = vec3((uv.x - 0.5) * uSize.x, -A, Z);
    n = vec3(0.0, dz, c);
  } else {
    p = vec3(A, (uv.y - 0.5) * uSize.y, Z);
    n = vec3(-dz, 0.0, c);
  }

  // Flat coordinates on the sheet, for the pointer lift and the ripple.
  vec2 f = (uv - 0.5) * uSize;

  vec2 dp = f - uPointer;
  float r2 = 0.85;
  float g = exp(-dot(dp, dp) / r2);
  float h = uPress * 0.42 * g;
  vec2 grad = h * (-2.0 * dp / r2);

  vec2 dh = f - uHit.xy;
  float d = length(dh) + 1e-4;
  float env = uHit.w * exp(-uHit.z * 2.6) * exp(-d * 0.9);
  float ph = d * 7.0 - uHit.z * 22.0;
  float rip = 0.07 * env * sin(ph) * step(0.0, uHit.z * 22.0 / 7.0 - d + 0.6);
  float drip = 0.07 * env * (7.0 * cos(ph) - 0.9 * sin(ph)) * step(0.0, uHit.z * 22.0 / 7.0 - d + 0.6);
  grad += drip * dh / d;

  p += n * (h + rip);
  n = normalize(n - vec3(grad, 0.0));
  vN = normalize(mat3(modelMatrix) * n);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
}
`;

const frag = /* glsl */ `
uniform sampler2D uMap;
uniform vec3 uInk;
uniform vec3 uDot;
uniform vec3 uLight;
uniform float uProgress;
uniform float uPanels;
uniform float uVertical;
uniform float uDotSize;
varying vec2 vUv;
varying vec3 vN;

void main() {
  vec3 col = texture2D(uMap, vUv).rgb;
  vec3 n = normalize(vN);
  if (!gl_FrontFacing) n = -n;
  float l = dot(n, normalize(uLight));
  float tone = l > 0.7 ? 0.0 : (l > 0.38 ? 0.55 : 1.0);

  // Halftone screen at 45 degrees, in screen space like a print.
  vec2 q = gl_FragCoord.xy / uDotSize;
  q = mat2(0.7071, -0.7071, 0.7071, 0.7071) * q;
  vec2 cell = fract(q) - 0.5;
  float d = length(cell);
  float rad = tone * 0.36;
  float aa = fwidth(d) * 0.9;
  float dots = tone > 0.0 ? 1.0 - smoothstep(rad - aa, rad + aa, d) : 0.0;
  col *= mix(vec3(1.0), uDot, dots);

  // Ink the creases. They stay faintly visible once flat: paper remembers.
  float a = uVertical > 0.5 ? 1.0 - vUv.y : vUv.x;
  float k = a * uPanels;
  float fr = fract(k);
  float dd = min(fr, 1.0 - fr);
  float px = dd / max(fwidth(k), 1e-5);
  float inside = step(0.5, k) * step(k, uPanels - 0.5);
  float crease = (1.0 - smoothstep(0.7, 1.9, px)) * inside;
  float strength = mix(1.0, 0.28, smoothstep(0.55, 0.98, uProgress));
  col = mix(col, uInk, crease * strength);

  gl_FragColor = vec4(col, 1.0);
}
`;

type Escape = {
  from: Pt;
  to: Pt;
  t: number;
  out: number;
  phase: 'out' | 'squash' | 'back';
  mesh: THREE.Mesh;
};

type Burst = { mesh: THREE.Mesh; t: number; rot: number; active: boolean };

const smooth = (e0: number, e1: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
};
const backOut = (t: number) => {
  const c1 = 1.9;
  return 1 + (c1 + 1) * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

function palette(): Palette {
  const s = getComputedStyle(document.documentElement);
  const v = (name: string, fb: string) => s.getPropertyValue(name).trim() || fb;
  return {
    ink: v('--ink', '#0b0b0c'),
    accent: v('--accent', '#f3b53f'),
    page: v('--page', '#ffffff'),
    field: v('--field', '#3b5a8c'),
    fieldDeep: v('--field-deep', '#2b4470'),
  };
}

async function fontsReady() {
  if (!document.fonts) return;
  const load = Promise.all([
    document.fonts.load('34px "Bowlby One"'),
    document.fonts.load('28px "Patrick Hand"'),
  ]).catch(() => undefined);
  await Promise.race([load, new Promise((r) => setTimeout(r, 1800))]);
}

/** Mount the sheet into `stage`. Returns a cleanup function. */
export async function mountAirGap(stage: HTMLElement): Promise<() => void> {
  const canvas = stage.querySelector<HTMLCanvasElement>('canvas')!;
  const sendBtn = stage.parentElement?.querySelector<HTMLButtonElement>('[data-send]') ?? null;
  const tallQuery = matchMedia('(max-width: 640px)');
  const fine = matchMedia('(pointer: fine)').matches;

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    stage.classList.add('no-gl');
    return () => {};
  }
  await fontsReady();

  const colors = palette();
  const col3 = (hex: string) => new THREE.Color().setStyle(hex, THREE.NoColorSpace);
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(22, 2, 0.1, 100);
  const group = new THREE.Group();
  scene.add(group);

  const paperCanvas = document.createElement('canvas');
  const paperTex = new THREE.CanvasTexture(paperCanvas);
  paperTex.colorSpace = THREE.NoColorSpace;
  paperTex.anisotropy = renderer.capabilities.getMaxAnisotropy();

  const uniforms = {
    uMap: { value: paperTex },
    uProgress: { value: 0 },
    uPanels: { value: 4 },
    uVertical: { value: 0 },
    uSize: { value: new THREE.Vector2(12, 5.2) },
    uPointer: { value: new THREE.Vector2(99, 99) },
    uPress: { value: 0 },
    uHit: { value: new THREE.Vector4(99, 99, 9, 0) },
    uInk: { value: col3(colors.ink) },
    uDot: { value: col3(colors.fieldDeep) },
    uLight: { value: new THREE.Vector3(-0.55, 0.35, 0.75) },
    uDotSize: { value: 6 },
  };
  const paperMat = new THREE.ShaderMaterial({ vertexShader: vert, fragmentShader: frag, uniforms, side: THREE.DoubleSide });
  let paperGeo: THREE.PlaneGeometry | null = null;
  const paper = new THREE.Mesh(new THREE.BufferGeometry(), paperMat);
  group.add(paper);

  // Sprites.
  const spriteGeo = new THREE.PlaneGeometry(1, 1);
  const packetCanvas = document.createElement('canvas');
  drawPacket(packetCanvas, colors);
  const packetTex = new THREE.CanvasTexture(packetCanvas);
  packetTex.colorSpace = THREE.SRGBColorSpace;
  const words = ['THUNK!', 'BLOCKED!'];
  const burstTex = words.map((w, i) => {
    const c = document.createElement('canvas');
    drawBurst(c, w, colors, 3 + i * 5);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
  const spriteMat = (map: THREE.Texture) =>
    new THREE.MeshBasicMaterial({ map, transparent: true, depthTest: false, depthWrite: false, opacity: 0 });

  const loopPackets: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const m = new THREE.Mesh(spriteGeo, spriteMat(packetTex));
    m.renderOrder = 2;
    group.add(m);
    loopPackets.push(m);
  }
  const bursts: Burst[] = [0, 1, 2, 3].map((i) => {
    const m = new THREE.Mesh(spriteGeo, spriteMat(burstTex[i % 2]));
    m.renderOrder = 4;
    m.visible = false;
    group.add(m);
    return { mesh: m, t: 0, rot: 0, active: false };
  });
  let burstWord = 0;
  const escapes: Escape[] = [];
  const escapePool: THREE.Mesh[] = [];

  // Layout state.
  let L: Layout = layoutFor('wide');
  let Wp = 12;
  let Hp = 5.2;
  let loopLen = 0;
  let segs: { a: Pt; b: Pt; len: number; start: number }[] = [];
  let packetSize = 0.34;
  let burstW = 1.9;

  function applyLayout() {
    L = layoutFor(tallQuery.matches ? 'tall' : 'wide');
    const tall = L.kind === 'tall';
    Wp = tall ? 6 : 12;
    Hp = (Wp * L.h) / L.w;
    drawDiagram(paperCanvas, L, colors, tall ? 2 : 2);
    paperTex.dispose();
    paperTex.image = paperCanvas;
    paperTex.needsUpdate = true;
    uniforms.uVertical.value = tall ? 1 : 0;
    uniforms.uPanels.value = L.panels;
    uniforms.uSize.value.set(Wp, Hp);
    paperGeo?.dispose();
    const along = L.panels * 48;
    paperGeo = tall ? new THREE.PlaneGeometry(Wp, Hp, 40, along) : new THREE.PlaneGeometry(Wp, Hp, along, 32);
    paper.geometry = paperGeo;
    packetSize = tall ? 0.42 : 0.36;
    burstW = tall ? 2.6 : 2.35;
    segs = [];
    loopLen = 0;
    for (let i = 0; i < L.loop.length; i++) {
      const a = L.loop[i];
      const b = L.loop[(i + 1) % L.loop.length];
      const len = Math.hypot(b.x - a.x, b.y - a.y);
      segs.push({ a, b, len, start: loopLen });
      loopLen += len;
    }
    escapes.splice(0).forEach((e) => {
      e.mesh.visible = false;
      escapePool.push(e.mesh);
    });
    fit();
  }

  function fit() {
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    const t = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const dist = Math.max(Hp / 2 / t, Wp / 2 / (t * camera.aspect)) * 1.06;
    camera.position.set(0, 0, dist);
    camera.lookAt(0, 0, 0);
    camera.updateProjectionMatrix();
    uniforms.uDotSize.value = 5.5 * renderer.getPixelRatio();
  }

  // CPU mirror of the vertex shader: sheet position + normal at uv.
  const tmpP = new THREE.Vector3();
  const tmpN = new THREE.Vector3();
  function deform(u: number, v: number) {
    const p = uniforms.uProgress.value;
    const tall = L.kind === 'tall';
    const len = tall ? Hp : Wp;
    const a = tall ? 1 - v : u;
    const s = a * len;
    const w = len / L.panels;
    const i = Math.min(Math.floor(s / w), L.panels - 1);
    const l = s - i * w;
    const th = (1 - p) * 1.32;
    const c = Math.cos(th);
    const sn = Math.sin(th);
    const odd = i % 2 === 1;
    const A = (i * w + l) * c - len * c * 0.5;
    const Z = (odd ? w - l : l) * sn - w * sn * 0.5;
    const dz = odd ? -sn : sn;
    if (tall) {
      tmpP.set((u - 0.5) * Wp, -A, Z);
      tmpN.set(0, dz, c);
    } else {
      tmpP.set(A, (v - 0.5) * Hp, Z);
      tmpN.set(-dz, 0, c);
    }
    const fx = (u - 0.5) * Wp - uniforms.uPointer.value.x;
    const fy = (v - 0.5) * Hp - uniforms.uPointer.value.y;
    const h = uniforms.uPress.value * 0.42 * Math.exp(-(fx * fx + fy * fy) / 0.85);
    tmpP.addScaledVector(tmpN, h + 0.03);
    return tmpP;
  }
  const place = (m: THREE.Object3D, pt: Pt) => m.position.copy(deform(pt.x / L.w, 1 - pt.y / L.h));
  const toFlat = (pt: Pt) => new THREE.Vector2((pt.x / L.w - 0.5) * Wp, (0.5 - pt.y / L.h) * Hp);

  function loopPoint(s: number): Pt {
    s = ((s % loopLen) + loopLen) % loopLen;
    for (const g of segs) {
      if (s <= g.start + g.len) {
        const t = (s - g.start) / g.len;
        return { x: g.a.x + (g.b.x - g.a.x) * t, y: g.a.y + (g.b.y - g.a.y) * t };
      }
    }
    return segs[0].a;
  }
  const nodeShrink = (pt: Pt) => {
    let d = Infinity;
    for (const n of Object.values(L.nodes)) d = Math.min(d, Math.hypot(n.x - pt.x, n.y - pt.y));
    return 0.5 + 0.5 * smooth(36, 70, d);
  };

  function sendOut(fromIdx?: number) {
    if (escapes.length >= 4) return;
    const from = L.exits[fromIdx ?? Math.floor(Math.random() * L.exits.length)];
    const tall = L.kind === 'tall';
    const pad = (packetSize * L.w) / Wp / 2 + 4;
    const to = tall ? { x: from.x, y: L.gap.to + pad } : { x: L.gap.to + pad, y: from.y };
    const mesh = escapePool.pop() ?? new THREE.Mesh(spriteGeo, spriteMat(packetTex));
    mesh.renderOrder = 3;
    mesh.visible = true;
    group.add(mesh);
    escapes.push({ from, to, t: 0, out: Math.hypot(to.x - from.x, to.y - from.y) / 300, phase: 'out', mesh });
  }

  function thunk(e: Escape) {
    const tall = L.kind === 'tall';
    const hit = tall ? { x: e.to.x, y: L.gap.to } : { x: L.gap.to, y: e.to.y };
    const f = toFlat(hit);
    uniforms.uHit.value.set(f.x, f.y, 0, 1);
    const b = bursts.find((x) => !x.active) ?? bursts[0];
    b.active = true;
    b.t = 0;
    b.rot = (Math.random() - 0.5) * 0.25;
    (b.mesh.material as THREE.MeshBasicMaterial).map = burstTex[burstWord++ % 2];
    // Sit the burst on the outside of the gap, kept on the paper.
    const bw = (burstW * L.w) / Wp;
    const bh = bw * (340 / 560);
    const at = tall
      ? { x: Math.min(L.w - bw / 2, Math.max(bw / 2, hit.x + (Math.random() - 0.5) * 60)), y: L.gap.from - bh * 0.32 }
      : { x: L.gap.from - bw * 0.47, y: Math.min(L.h - bh / 2, Math.max(bh / 2, hit.y - 30)) };
    b.mesh.userData.at = at;
    b.mesh.visible = true;
  }

  // Interaction.
  const pointerTarget = new THREE.Vector2(99, 99);
  let pressTarget = 0;
  let touchPulse = 0;
  const ray = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
  const ndc = new THREE.Vector2();
  const hitPt = new THREE.Vector3();
  function pointerToSheet(e: PointerEvent) {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const pl = plane.clone().applyMatrix4(group.matrixWorld);
    if (!ray.ray.intersectPlane(pl, hitPt)) return null;
    group.worldToLocal(hitPt);
    return hitPt;
  }
  const onMove = (e: PointerEvent) => {
    const p = pointerToSheet(e);
    if (!p) return;
    pointerTarget.set(p.x, p.y);
    if (e.pointerType === 'mouse' || e.pointerType === 'pen') pressTarget = 1;
    wake();
  };
  const onLeave = () => (pressTarget = 0);
  const onDown = (e: PointerEvent) => {
    onMove(e);
    if (e.pointerType === 'touch') {
      uniforms.uPointer.value.copy(pointerTarget);
      touchPulse = 0.6;
    }
  };
  const onClick = () => {
    if (uniforms.uProgress.value > 0.85) sendOut();
  };
  const onSend = () => {
    sendOut();
    wake();
  };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('click', onClick);
  sendBtn?.addEventListener('click', onSend);
  if (sendBtn) sendBtn.hidden = false;

  // Scroll-driven unfolding: a spring chases the scroll target, so the
  // paper settles with a small overshoot instead of tracking rigidly.
  let progress = 0;
  let vel = 0;
  function scrollTarget() {
    const r = stage.getBoundingClientRect();
    const vh = innerHeight;
    const span = Math.min(r.height * 0.9 + vh * 0.15, vh * 0.6);
    return Math.min(1, Math.max(0, (vh * 0.95 - r.top) / span));
  }

  let running = false;
  let visible = false;
  let raf = 0;
  let last = 0;
  let nextAuto = 1.6;
  let clock = 0;

  function frame(now: number) {
    raf = 0;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now;
    clock += dt;

    const target = scrollTarget();
    vel += (target - progress) * 90 * dt;
    vel *= Math.exp(-11 * dt);
    progress += vel * dt;
    progress = Math.min(1.05, Math.max(0, progress));
    uniforms.uProgress.value = progress;
    group.rotation.x = -(1 - Math.min(1, progress)) * 0.42;
    group.rotation.z = (1 - Math.min(1, progress)) * 0.08;
    group.updateMatrixWorld();

    if (touchPulse > 0) {
      touchPulse -= dt;
      pressTarget = touchPulse > 0 ? 1 : 0;
    }
    uniforms.uPointer.value.lerp(pointerTarget, 1 - Math.exp(-14 * dt));
    uniforms.uPress.value += (pressTarget - uniforms.uPress.value) * (1 - Math.exp(-8 * dt));
    const hit = uniforms.uHit.value;
    hit.z += dt;

    const show = smooth(0.82, 0.99, progress);

    // Packets on the loop.
    const speed = 95;
    loopPackets.forEach((m, i) => {
      const pt = loopPoint(clock * speed + (i * loopLen) / loopPackets.length);
      place(m, pt);
      const s = packetSize * nodeShrink(pt);
      m.scale.set(s, s, 1);
      (m.material as THREE.MeshBasicMaterial).opacity = show;
    });

    // Packets trying to leave.
    if (show > 0.95) {
      nextAuto -= dt;
      if (nextAuto <= 0) {
        sendOut();
        nextAuto = 2.4 + Math.random() * 1.8;
      }
    }
    const tall = L.kind === 'tall';
    for (let k = escapes.length - 1; k >= 0; k--) {
      const e = escapes[k];
      e.t += dt;
      let pt: Pt = e.from;
      let sx = 1;
      let sy = 1;
      if (e.phase === 'out') {
        const t = Math.min(1, e.t / e.out);
        const q = t * t; // speeding up, eager to get out
        pt = { x: e.from.x + (e.to.x - e.from.x) * q, y: e.from.y + (e.to.y - e.from.y) * q };
        const stretch = 1 + 0.35 * t;
        sx = tall ? 1 / stretch : stretch;
        sy = tall ? stretch : 1 / stretch;
        if (t >= 1) {
          e.phase = 'squash';
          e.t = 0;
          thunk(e);
        }
      } else if (e.phase === 'squash') {
        pt = e.to;
        const q = 1 - e.t / 0.14;
        const flat = 1 - 0.55 * Math.max(0, q);
        sx = tall ? 1 / flat : flat;
        sy = tall ? flat : 1 / flat;
        if (e.t >= 0.14) {
          e.phase = 'back';
          e.t = 0;
        }
      } else {
        const t = Math.min(1, e.t / 0.9);
        const q = 1 - Math.pow(1 - t, 3);
        pt = { x: e.to.x + (e.from.x - e.to.x) * q, y: e.to.y + (e.from.y - e.to.y) * q };
        const wob = 1 + 0.3 * Math.exp(-t * 7) * Math.sin(t * 30);
        sx = tall ? wob : 2 - wob;
        sy = tall ? 2 - wob : wob;
        if (t >= 1) {
          e.mesh.visible = false;
          escapePool.push(e.mesh);
          escapes.splice(k, 1);
          continue;
        }
      }
      place(e.mesh, pt);
      const s = packetSize * (e.phase === 'back' ? nodeShrink(pt) : 1);
      e.mesh.scale.set(s * sx, s * sy, 1);
      (e.mesh.material as THREE.MeshBasicMaterial).opacity = show;
    }

    // Sound-effect bursts: pop with a squash, hold, then shrink away.
    for (const b of bursts) {
      if (!b.active) continue;
      b.t += dt;
      const t = b.t;
      const pop = backOut(Math.min(1, t / 0.2));
      const jig = 0.22 * Math.exp(-t * 9) * Math.cos(t * 38);
      const out = smooth(0.8, 1.1, t);
      const s = burstW * Math.max(0.01, pop * (1 - out * 0.6));
      b.mesh.scale.set(s * (1 + jig), s * (340 / 560) * (1 - jig), 1);
      b.mesh.rotation.z = b.rot;
      place(b.mesh, b.mesh.userData.at as Pt);
      b.mesh.position.z += 0.05;
      (b.mesh.material as THREE.MeshBasicMaterial).opacity = show * (1 - out);
      if (t > 1.1) {
        b.active = false;
        b.mesh.visible = false;
      }
    }

    renderer.render(scene, camera);

    // Keep going while on screen; when the sheet is still, idle on the
    // loop packets (they are the point), so this only stops offscreen.
    if (running) raf = requestAnimationFrame(frame);
  }

  function wake() {
    if (running && !raf) raf = requestAnimationFrame(frame);
  }
  function setRunning(on: boolean) {
    running = on && visible && !document.hidden;
    if (running && !raf) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
    if (!running && raf) {
      cancelAnimationFrame(raf);
      raf = 0;
    }
  }

  applyLayout();
  progress = scrollTarget() > 0.99 ? 1 : 0;
  stage.classList.add('live');
  canvas.setAttribute('role', 'img');
  canvas.setAttribute(
    'aria-label',
    'Documents, an index, a model and servers inside a closed network. Packets that try to reach the internet bounce off the air gap.',
  );
  canvas.removeAttribute('aria-hidden');

  const io = new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
      setRunning(true);
    },
    { rootMargin: '120px 0px' },
  );
  io.observe(stage);
  const ro = new ResizeObserver(() => {
    fit();
    if (!running) renderer.render(scene, camera);
  });
  ro.observe(stage);
  const onLayout = () => applyLayout();
  tallQuery.addEventListener('change', onLayout);
  const onVis = () => setRunning(true);
  document.addEventListener('visibilitychange', onVis);
  void fine;

  return () => {
    setRunning(false);
    running = false;
    io.disconnect();
    ro.disconnect();
    tallQuery.removeEventListener('change', onLayout);
    document.removeEventListener('visibilitychange', onVis);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerleave', onLeave);
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('click', onClick);
    sendBtn?.removeEventListener('click', onSend);
    paperGeo?.dispose();
    paperMat.dispose();
    paperTex.dispose();
    spriteGeo.dispose();
    packetTex.dispose();
    burstTex.forEach((t) => t.dispose());
    group.traverse((o) => {
      if (o instanceof THREE.Mesh && o !== paper) (o.material as THREE.Material).dispose();
    });
    escapePool.forEach((m) => (m.material as THREE.Material).dispose());
    renderer.dispose();
  };
}

// The signal path, live: guitar -> drive -> echo -> interface -> monitors.
// Scroll sends a pulse down the cable; plucking the strings sends a
// faster one and makes a sound; pedals switch on and change it.
import * as THREE from 'three';
import { createRig } from './audio';
import { buildDesk, buildGuitar, buildInterface, buildMonitor, buildPedal, buildStand, makeKit, type Pedal } from './gear';
import { cableMaterial, floorMaterial, readPalette, shared } from './materials';

type SpotId = 'guitar' | 'drive' | 'echo' | 'interface' | 'monitors';

interface Pulse {
  t0: number;
  u: number;
}

const PULSE_SECONDS = 1.05;

export function createSignalPath(root: HTMLElement): () => void {
  const stage = root.querySelector<HTMLElement>('[data-sp-stage]')!;
  const overlay = root.querySelector<HTMLElement>('[data-sp-overlay]')!;
  const balloon = root.querySelector<HTMLElement>('[data-sp-balloon]')!;
  const muteBtn = root.querySelector<HTMLButtonElement>('[data-sp-mute]');
  const spots = new Map<SpotId, HTMLButtonElement>();
  root.querySelectorAll<HTMLButtonElement>('[data-spot]').forEach((b) => spots.set(b.dataset.spot as SpotId, b));

  // Flat colors straight from the tokens: no color management.
  const prevCM = THREE.ColorManagement.enabled;
  THREE.ColorManagement.enabled = false;
  const pal = readPalette();
  const kit = makeKit(pal);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(pal.page, 1);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.classList.add('sp-canvas');
  stage.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(26, 1, 0.5, 120);

  // ------------------------------------------------------------------
  // Layout. Floor is y = 0; signal runs left to right.
  // ------------------------------------------------------------------
  const P1 = -4.55;
  const P2 = -2.25;
  const PZ = 0.45;

  const guitar = buildGuitar(kit);
  guitar.group.scale.setScalar(0.66);
  guitar.group.position.set(-7.55, 1.28, 0);
  guitar.group.rotation.set(-0.12, 0.32, 0.04);
  guitar.group.userData.spot = 'guitar';
  scene.add(guitar.group);
  const stand = buildStand(kit);
  stand.position.set(-7.55, 0, 0.05);
  stand.scale.setScalar(1.05);
  stand.rotation.y = 0.32;
  scene.add(stand);

  const drive = buildPedal(kit, 'accent', 'drive');
  drive.group.position.set(P1, 0, PZ);
  drive.group.userData.spot = 'drive';
  scene.add(drive.group);
  const echo = buildPedal(kit, 'field', 'echo');
  echo.group.position.set(P2, 0, PZ);
  echo.group.userData.spot = 'echo';
  scene.add(echo.group);

  const DESK_X = 5.0;
  const DESK_H = 2.1;
  const desk = buildDesk(kit, 8.4, DESK_H, 2.6);
  desk.position.set(DESK_X, 0, -0.4);
  scene.add(desk);

  const iface = buildInterface(kit);
  iface.group.position.set(2.25, DESK_H, -0.15);
  iface.group.rotation.y = 0.05;
  iface.group.userData.spot = 'interface';
  scene.add(iface.group);

  const monA = buildMonitor(kit);
  monA.group.position.set(5.15, DESK_H, -0.65);
  monA.group.rotation.y = -0.16;
  const monB = buildMonitor(kit);
  monB.group.position.set(7.95, DESK_H, -0.75);
  monB.group.rotation.y = -0.32;
  for (const m of [monA, monB]) {
    m.group.userData.spot = 'monitors';
    scene.add(m.group);
  }
  const monitors = [monA, monB];

  scene.updateMatrixWorld(true);

  // Floor shadows (x, z, radius x, radius z).
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 40).rotateX(-Math.PI / 2),
    floorMaterial(pal.field, [
      new THREE.Vector4(-7.4, 0.1, 1.5, 0.75),
      new THREE.Vector4(P1 + 0.15, PZ - 0.1, 1.05, 1.15),
      new THREE.Vector4(P2 + 0.15, PZ - 0.1, 1.05, 1.15),
      new THREE.Vector4(DESK_X + 0.3, -0.5, 4.9, 1.7),
    ]),
  );
  floor.position.y = 0.001;
  floor.renderOrder = -1;
  scene.add(floor);

  // ------------------------------------------------------------------
  // The cable.
  // ------------------------------------------------------------------
  const jack = guitar.jack.getWorldPosition(new THREE.Vector3());
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const C = 0.07; // cable radius, so it rests on surfaces
  const DT = DESK_H + C;
  const points = [
    jack,
    jack.clone().add(v(0.35, -0.35, 0.3)),
    v(-6.35, C, 1.15),
    v(-5.75, C, 1.05),
    v(-5.45, 0.24, PZ + 0.1),
    v(P1 - 0.55, 0.3, PZ),
    v(P1, 0.3, PZ),
    v(P1 + 0.55, 0.3, PZ),
    v(P1 + 0.85, 0.2, PZ + 0.2),
    v(P1 + 1.1, C, PZ + 0.95),
    v(P2 - 1.05, C, PZ + 0.95),
    v(P2 - 0.85, 0.2, PZ + 0.2),
    v(P2 - 0.55, 0.3, PZ),
    v(P2, 0.3, PZ),
    v(P2 + 0.55, 0.3, PZ),
    v(P2 + 0.85, 0.2, PZ + 0.25),
    v(P2 + 1.5, C, PZ + 1.05),
    v(0.15, C, 1.2),
    v(0.62, 0.35, 1.0),
    v(0.66, 1.3, 0.98),
    v(0.7, DT + 0.08, 0.95),
    v(0.95, DT, 0.45),
    v(1.15, DT + 0.25, -0.15),
    v(2.25, DT + 0.25, -0.15),
    v(3.35, DT + 0.25, -0.15),
    v(3.75, DT, 0.2),
    v(4.25, DT, 0.05),
    v(4.6, DT + 0.45, -0.6),
    v(5.15, DT + 0.5, -0.65),
    v(5.7, DT + 0.45, -0.75),
    v(6.15, DT, -0.15),
    v(6.85, DT, -0.15),
    v(7.4, DT + 0.45, -0.7),
    v(7.95, DT + 0.5, -0.75),
  ];
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const cableLen = curve.getLength();
  const cableMat = cableMaterial(pal, cableLen);
  const cableGeo = new THREE.TubeGeometry(curve, 420, C, 10, false);
  const cable = new THREE.Mesh(cableGeo, cableMat);
  const cableHull = new THREE.Mesh(cableGeo, kit.mats.outline);
  cable.add(cableHull);
  scene.add(cable);

  // Where each piece of gear sits along the cable.
  const samples = Array.from({ length: 600 }, (_, i) => curve.getPointAt(i / 599));
  const uNear = (p: THREE.Vector3) => {
    let best = 0;
    let bd = Infinity;
    samples.forEach((s, i) => {
      const d = s.distanceToSquared(p);
      if (d < bd) {
        bd = d;
        best = i / 599;
      }
    });
    return best;
  };
  const stops: { u: number; hit: () => void }[] = [
    { u: uNear(v(P1, 0.3, PZ)), hit: () => bump(drive, pedalOn.drive) },
    { u: uNear(v(P2, 0.3, PZ)), hit: () => bump(echo, pedalOn.echo) },
    { u: uNear(v(2.25, DT + 0.25, -0.15)), hit: () => (meter = 1) },
    { u: uNear(v(5.15, DT + 0.5, -0.65)), hit: () => kick(monA, 1) },
    { u: 0.995, hit: () => kick(monB, 1) },
  ];
  const monitorU = stops[3].u;

  // The pulse head that rides along with scroll.
  const spark = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 12), kit.mats.accent);
  spark.add(new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 12), kit.mats.outline));
  spark.visible = false;
  scene.add(spark);

  // ------------------------------------------------------------------
  // State.
  // ------------------------------------------------------------------
  const rig = createRig();
  const pedalOn = { drive: false, echo: false };
  let muted = false;
  let progress = 0;
  let head = 0;
  let prevHead = 0;
  let meter = 0;
  const pulses: Pulse[] = [];
  const kicks = new Map(monitors.map((m) => [m, 0]));
  const ringNext = new Map(monitors.map((m) => [m, 0]));
  const bumps = new Map<Pedal, number>([
    [drive, 0],
    [echo, 0],
  ]);
  let clock = performance.now() / 1000;
  let beatAt = 0;
  let focusX = -7;
  let lastSfx = 0;

  function bump(p: Pedal, on: boolean) {
    bumps.set(p, on ? 1 : 0.5);
  }
  function kick(m: (typeof monitors)[number], amount: number) {
    kicks.set(m, Math.max(kicks.get(m)!, amount));
    const i = ringNext.get(m)!;
    ringNext.set(m, (i + 1) % m.rings.length);
    const r = m.rings[i];
    r.userData.t = 0;
    r.userData.size = amount;
    r.visible = true;
  }

  // ------------------------------------------------------------------
  // Playing.
  // ------------------------------------------------------------------
  function sfxWord() {
    return pedalOn.drive ? 'KRANG!' : 'TWANG!';
  }

  function spawnSfx(word: string, x: number, y: number, size = 1, delay = 0) {
    const el = document.createElement('div');
    el.className = 'sp-sfx';
    el.setAttribute('aria-hidden', 'true');
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.setProperty('--s', String(size));
    el.style.setProperty('--r', `${(Math.random() * 16 - 10).toFixed(1)}deg`);
    el.style.animationDelay = `${delay}s`;
    el.innerHTML = `${burstSvg()}<span class="lettering">${word}</span>`;
    overlay.append(el);
    el.addEventListener('animationend', () => el.remove());
  }

  function twang() {
    const now = performance.now();
    if (now - lastSfx < 280) return;
    lastSfx = now;
    const p = toScreen(guitar.anchor);
    const w = overlay.clientWidth;
    const x = Math.min(Math.max(p.x + 70, 90), w - 90);
    const y = Math.max(p.y - 30, 70);
    spawnSfx(sfxWord(), x, y, 1);
    if (pedalOn.echo) {
      spawnSfx(sfxWord(), Math.min(x + 70, w - 50), y + 34, 0.62, 0.31);
      spawnSfx(sfxWord(), Math.min(x + 120, w - 40), y + 58, 0.4, 0.62);
    }
  }

  function pluck(i: number, vel = 1, delay = 0) {
    rig.pluck(i, vel, delay);
    const s = guitar.strings[i];
    setTimeout(() => (s.amp = 0.05 * vel), delay * 1000);
  }

  function strum(down = true) {
    for (let k = 0; k < 6; k++) pluck(down ? k : 5 - k, 0.85 + Math.random() * 0.15, k * 0.018);
    sendPulse();
    twang();
  }

  function sendPulse() {
    if (pulses.length >= 4) pulses.shift();
    pulses.push({ t0: clock, u: 0 });
  }

  function setPedal(id: 'drive' | 'echo', on: boolean) {
    pedalOn[id] = on;
    const p = id === 'drive' ? drive : echo;
    (p.led.material as THREE.MeshBasicMaterial).color.copy(on ? pal.accent : pal.ink);
    p.shine.visible = on;
    p.switchCap.userData.press = 1;
    bump(p, on);
    spots.get(id)?.setAttribute('aria-pressed', String(on));
    if (id === 'drive') rig.setDrive(on);
    else rig.setEcho(on);
    if (hovered === id || focused === id) showBalloon(id);
  }

  function activate(id: SpotId) {
    if (id === 'guitar') strum();
    else if (id === 'drive' || id === 'echo') setPedal(id, !pedalOn[id]);
    else if (id === 'monitors') {
      kick(monA, 0.8);
      kick(monB, 0.8);
    } else meter = 1;
  }

  // ------------------------------------------------------------------
  // Screen-space helpers: hotspots, balloon, sound effects.
  // ------------------------------------------------------------------
  const tmp = new THREE.Vector3();
  function toScreen(o: THREE.Object3D) {
    o.getWorldPosition(tmp).project(camera);
    return {
      x: (tmp.x * 0.5 + 0.5) * overlay.clientWidth,
      y: (-tmp.y * 0.5 + 0.5) * overlay.clientHeight,
      on: Math.abs(tmp.x) < 0.94 && Math.abs(tmp.y) < 0.94 && tmp.z < 1,
    };
  }
  const anchorOf: Record<SpotId, THREE.Object3D> = {
    guitar: guitar.neckAnchor,
    drive: drive.anchor,
    echo: echo.anchor,
    interface: iface.anchor,
    monitors: monA.anchor,
  };
  let hovered: SpotId | null = null;
  let focused: SpotId | null = null;
  let balloonFor: SpotId | null = null;

  function placeSpots() {
    for (const [id, btn] of spots) {
      const s = toScreen(anchorOf[id]);
      btn.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px)`;
      btn.classList.toggle('off', !s.on);
    }
    if (balloonFor) placeBalloon(balloonFor);
  }

  function placeBalloon(id: SpotId) {
    const s = toScreen(anchorOf[id]);
    const w = overlay.clientWidth;
    const bw = balloon.offsetWidth;
    const left = Math.min(Math.max(s.x - bw * 0.3, 8), w - bw - 8);
    balloon.style.transform = `translate(${left.toFixed(1)}px, ${(s.y - 26).toFixed(1)}px) translateY(-100%)`;
    // Keep the tail pointing at the gear.
    const tail = Math.min(Math.max(s.x - left - 14, 18), bw - 40);
    balloon.style.setProperty('--tail', `${tail}px`);
  }

  function showBalloon(id: SpotId) {
    const btn = spots.get(id);
    if (!btn) return;
    const say = btn.dataset.spSay ?? '';
    const hint = (pedalOn[id as 'drive'] ? btn.dataset.spHintOn : null) ?? btn.dataset.spHint ?? '';
    balloon.querySelector('[data-sp-say]')!.textContent = say;
    balloon.querySelector('[data-sp-hint]')!.textContent = hint;
    balloonFor = id;
    balloon.hidden = false;
    balloon.classList.remove('pop');
    void balloon.offsetWidth;
    balloon.classList.add('pop');
    placeBalloon(id);
  }
  function hideBalloon() {
    balloonFor = null;
    balloon.hidden = true;
  }
  const refreshBalloon = () => {
    const id = hovered ?? focused;
    if (id && id !== balloonFor) showBalloon(id);
    else if (!id) hideBalloon();
  };

  // ------------------------------------------------------------------
  // Pointer + keyboard.
  // ------------------------------------------------------------------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const targets = [guitar.group, drive.group, echo.group, iface.group, monA.group, monB.group];
  function pick(e: PointerEvent | MouseEvent) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(targets, true)[0];
    if (!hit) return null;
    let o: THREE.Object3D | null = hit.object;
    while (o && !o.userData.spot) o = o.parent;
    return o ? { id: o.userData.spot as SpotId, point: hit.point } : null;
  }

  let dragString = -1;
  let dragged = false;
  const canvas = renderer.domElement;

  const onMove = (e: PointerEvent) => {
    const hit = pick(e);
    const id = hit?.id ?? null;
    canvas.style.cursor = id === 'guitar' || id === 'drive' || id === 'echo' ? 'pointer' : '';
    if (id !== hovered && e.pointerType === 'mouse') {
      hovered = id;
      refreshBalloon();
    }
    // Drag across the strings to strum them one by one.
    if (e.pointerType === 'mouse' && e.buttons & 1 && hit?.id === 'guitar') {
      const local = guitar.group.worldToLocal(hit.point.clone());
      let idx = 0;
      let bd = Infinity;
      guitar.stringX.forEach((x, i) => {
        const d = Math.abs(local.x - x);
        if (d < bd) {
          bd = d;
          idx = i;
        }
      });
      if (dragString >= 0 && idx !== dragString) {
        const step = idx > dragString ? 1 : -1;
        for (let k = dragString + step; k !== idx + step; k += step) pluck(k, 0.9);
        dragged = true;
        sendPulse();
        twang();
      }
      dragString = idx;
    }
  };
  const onDown = (e: PointerEvent) => {
    rig.wake();
    dragged = false;
    dragString = -1;
    if (e.pointerType === 'mouse' && pick(e)?.id === 'guitar') e.preventDefault();
  };
  const onLeave = () => {
    hovered = null;
    dragString = -1;
    refreshBalloon();
  };
  const onClick = (e: MouseEvent) => {
    if (dragged) {
      dragged = false;
      return;
    }
    const hit = pick(e);
    if (!hit) {
      if (hovered === null) hideBalloon();
      return;
    }
    activate(hit.id);
    if (e instanceof PointerEvent && e.pointerType !== 'mouse') showBalloon(hit.id);
  };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('click', onClick);

  const spotHandlers: Array<() => void> = [];
  for (const [id, btn] of spots) {
    const click = () => {
      rig.wake();
      activate(id);
      showBalloon(id);
    };
    const focus = () => {
      focused = id;
      showBalloon(id);
    };
    const blur = () => {
      focused = null;
      refreshBalloon();
    };
    const key = (e: KeyboardEvent) => {
      if (id !== 'guitar') return;
      const n = Number(e.key);
      if (n >= 1 && n <= 6) {
        rig.wake();
        pluck(6 - n, 1);
        sendPulse();
        twang();
      }
    };
    btn.addEventListener('click', click);
    btn.addEventListener('focus', focus);
    btn.addEventListener('blur', blur);
    btn.addEventListener('keydown', key);
    spotHandlers.push(() => {
      btn.removeEventListener('click', click);
      btn.removeEventListener('focus', focus);
      btn.removeEventListener('blur', blur);
      btn.removeEventListener('keydown', key);
    });
  }

  const onMute = () => {
    muted = !muted;
    rig.setMuted(muted);
    muteBtn?.setAttribute('aria-pressed', String(muted));
    const label = muteBtn?.querySelector('[data-label]');
    if (label && muteBtn) label.textContent = muted ? (muteBtn.dataset.off ?? '') : (muteBtn.dataset.on ?? '');
  };
  muteBtn?.addEventListener('click', onMute);

  // ------------------------------------------------------------------
  // Scroll progress through the section's runway.
  // ------------------------------------------------------------------
  function readScroll() {
    const r = root.getBoundingClientRect();
    const vh = innerHeight;
    const travel = r.height + vh * 0.35;
    progress = THREE.MathUtils.clamp((vh * 0.8 - r.top) / travel, 0, 1);
  }

  // ------------------------------------------------------------------
  // Camera.
  // ------------------------------------------------------------------
  let width = 1;
  let height = 1;
  let wide = true;
  const target = new THREE.Vector3();
  function resize() {
    width = Math.max(1, stage.clientWidth);
    height = Math.max(1, stage.clientHeight);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    renderer.getDrawingBufferSize(shared.uRes.value);
    shared.uOutline.value = (width < 640 ? 1.9 : 2.6) * dpr;
    shared.uDot.value = (width < 640 ? 5 : 6.5) * dpr;
    camera.aspect = width / height;
    wide = camera.aspect > 1.25;
    camera.updateProjectionMatrix();
  }

  function aimCamera(dt: number) {
    const tan = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const headPoint = curve.getPointAt(THREE.MathUtils.clamp(head, 0, 1));
    let frameW: number;
    let fx: number;
    if (wide) {
      // Whole chain in view, with a gentle dolly that follows the signal.
      frameW = 21.2 - head * 0.8;
      fx = THREE.MathUtils.lerp(0.1, 0.5, head);
    } else {
      frameW = 6.8;
      fx = THREE.MathUtils.clamp(headPoint.x + 0.5, -6.7, 6.4);
    }
    focusX += (fx - focusX) * (1 - Math.exp(-dt * 5));
    const dW = frameW / 2 / (tan * camera.aspect);
    const dH = (wide ? 6.0 : 5.6) / 2 / tan;
    const d = Math.max(dW, dH);
    const ty = wide ? 2.35 : 2.4;
    const tilt = THREE.MathUtils.degToRad(19);
    target.set(focusX, ty, 0);
    camera.position.set(focusX, ty + Math.sin(tilt) * d, Math.cos(tilt) * d);
    camera.lookAt(target);
  }

  // ------------------------------------------------------------------
  // Frame loop.
  // ------------------------------------------------------------------
  let running = false;
  let raf = 0;

  function frame() {
    raf = requestAnimationFrame(frame);
    const now = performance.now() / 1000;
    const dt = Math.min(now - clock, 0.05);
    clock = now;

    // Scroll pulse.
    const want = THREE.MathUtils.smoothstep(progress, 0.08, 0.78);
    head += (want - head) * (1 - Math.exp(-dt * 8));
    if (Math.abs(want - head) < 1e-4) head = want;
    for (const s of stops) if (prevHead < s.u && head >= s.u) s.hit();
    prevHead = head;
    cableMat.uniforms.uHead.value = head;
    cableMat.uniforms.uTime.value = now;
    spark.visible = head > 0.002 && head < 0.995;
    if (spark.visible) spark.position.copy(curve.getPointAt(head));

    // Plucked pulses race ahead.
    const pu = cableMat.uniforms.uPulses.value as number[];
    for (let i = pulses.length - 1; i >= 0; i--) {
      const p = pulses[i];
      const u = (now - p.t0) / PULSE_SECONDS;
      for (const s of stops) if (p.u < s.u && u >= s.u) s.hit();
      p.u = u;
      if (u > 1.05) pulses.splice(i, 1);
    }
    for (let i = 0; i < 4; i++) pu[i] = pulses[i] ? pulses[i].u : -1;

    // Once the signal reaches the monitors they keep a steady beat.
    if (head >= monitorU && now - beatAt > 0.6) {
      beatAt = now;
      kick(monA, 0.3);
      kick(monB, 0.3);
      meter = Math.max(meter, 0.45);
    }

    // Strings.
    for (const s of guitar.strings) {
      if (s.amp < 1e-4) {
        s.mat.uniforms.uAmp.value = 0;
        continue;
      }
      s.phase += dt * s.speed;
      s.amp *= Math.exp(-dt * 2.4);
      s.mat.uniforms.uAmp.value = s.amp;
      s.mat.uniforms.uPhase.value = s.phase;
    }

    // Pedals squash when the signal passes; footswitch dips when pressed.
    for (const [p, b] of bumps) {
      const nb = b * Math.exp(-dt * 7);
      bumps.set(p, nb);
      const sq = Math.sin(nb * Math.PI) * 0.08 * Math.min(1, b * 2);
      p.group.scale.set(1 + sq * 0.5, 1 - sq, 1 + sq * 0.5);
      const press = (p.switchCap.userData.press ?? 0) as number;
      p.switchCap.userData.press = press * Math.exp(-dt * 10);
      p.switchCap.position.y = 0.55 + 0.12 - press * 0.07;
      p.shine.scale.setScalar(1 + nb * 0.6);
    }

    // Interface meter.
    meter *= Math.exp(-dt * 2.2);
    const lit = Math.round(meter * iface.meters.length + (meter > 0.05 ? Math.random() * 0.8 : 0));
    iface.meters.forEach((m, i) => (m.material as THREE.MeshBasicMaterial).color.copy(i < lit ? (i === 5 ? pal.page : pal.accent) : pal.ink));

    // Monitors pump.
    for (const m of monitors) {
      const k = kicks.get(m)! * Math.exp(-dt * 5);
      kicks.set(m, k);
      const pump = k * (0.5 + 0.5 * Math.sin(now * 42));
      m.cone.position.z = 0.58 + pump * 0.13;
      m.cone.scale.setScalar(1 + pump * 0.05);
      m.group.scale.set(1 + k * 0.025, 1 - k * 0.02, 1);
      for (const r of m.rings) {
        if (!r.visible) continue;
        const t = (r.userData.t += dt / 0.7);
        if (t >= (r.userData.size > 0.5 ? 0.85 : 0.55)) {
          r.visible = false;
          continue;
        }
        r.scale.setScalar(1.05 + t * (0.6 + r.userData.size * 0.8));
      }
    }

    aimCamera(dt);
    renderer.render(scene, camera);
    placeSpots();
  }

  function start() {
    if (running) return;
    running = true;
    clock = performance.now() / 1000;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }

  let inView = false;
  const io = new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (inView && !document.hidden) start();
    else stop();
  });
  io.observe(stage);
  const onVis = () => (document.hidden ? stop() : inView && start());
  document.addEventListener('visibilitychange', onVis);
  const ro = new ResizeObserver(() => {
    resize();
    if (!running) {
      aimCamera(1);
      renderer.render(scene, camera);
      placeSpots();
    }
  });
  ro.observe(stage);
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', readScroll);

  resize();
  readScroll();
  head = prevHead = THREE.MathUtils.smoothstep(progress, 0.08, 0.78);
  aimCamera(1);
  focusX = wide ? THREE.MathUtils.lerp(0.1, 0.5, head) : focusX;
  renderer.render(scene, camera);
  placeSpots();
  root.classList.add('sp-ready');

  return () => {
    stop();
    io.disconnect();
    ro.disconnect();
    document.removeEventListener('visibilitychange', onVis);
    removeEventListener('scroll', readScroll);
    removeEventListener('resize', readScroll);
    canvas.removeEventListener('pointermove', onMove);
    canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointerleave', onLeave);
    canvas.removeEventListener('click', onClick);
    muteBtn?.removeEventListener('click', onMute);
    spotHandlers.forEach((fn) => fn());
    rig.dispose();
    const geos = new Set<THREE.BufferGeometry>();
    const mats = new Set<THREE.Material>();
    scene.traverse((o) => {
      if (o instanceof THREE.Mesh) {
        geos.add(o.geometry);
        (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => mats.add(m));
      }
    });
    geos.forEach((g) => g.dispose());
    mats.forEach((m) => m.dispose());
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    overlay.querySelectorAll('.sp-sfx').forEach((el) => el.remove());
    root.classList.remove('sp-ready');
    THREE.ColorManagement.enabled = prevCM;
  };
}

/** A spiky white burst behind a sound effect. */
function burstSvg() {
  const n = 14;
  const pts: string[] = [];
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2;
    const r = i % 2 ? 30 + Math.random() * 6 : 46 + Math.random() * 10;
    pts.push(`${(60 + Math.cos(a) * r * 1.25).toFixed(1)},${(50 + Math.sin(a) * r * 0.82).toFixed(1)}`);
  }
  return `<svg viewBox="0 0 120 100" aria-hidden="true"><polygon points="${pts.join(' ')}" fill="var(--page)" stroke="var(--ink)" stroke-width="3" stroke-linejoin="round"/></svg>`;
}

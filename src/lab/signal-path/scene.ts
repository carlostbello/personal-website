// The signal path, live: guitar -> drive -> echo -> amp.
// Scrolling the panel through the viewport sends the signal down the
// cable; plucking the strings sends a quick pulse and makes a sound;
// the two pedals switch on and change it.
import * as THREE from 'three';
import { createRig } from './audio';
import { buildAmp, buildGuitar, buildPedal, buildStand, makeKit, type Pedal } from './gear';
import { cableMaterial, floorMaterial, readPalette, shared } from './materials';

type SpotId = 'guitar' | 'drive' | 'echo' | 'amp';

interface Pulse {
  t0: number;
  u: number;
}

const PULSE_SECONDS = 0.8;

export function createSignalPath(root: HTMLElement): () => void {
  const stage = root.querySelector<HTMLElement>('[data-sigpath-stage]')!;
  const overlay = root.querySelector<HTMLElement>('[data-sigpath-overlay]')!;
  const balloon = root.querySelector<HTMLElement>('[data-sigpath-balloon]')!;
  const muteBtn = root.querySelector<HTMLButtonElement>('[data-sigpath-mute]');
  const spots = new Map<SpotId, HTMLButtonElement>();
  root.querySelectorAll<HTMLButtonElement>('[data-sigpath-spot]').forEach((b) => spots.set(b.dataset.sigpathSpot as SpotId, b));

  const pal = readPalette();
  const kit = makeKit(pal);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'low-power' });
  renderer.outputColorSpace = THREE.LinearSRGBColorSpace;
  renderer.setClearColor(pal.page, 1);
  renderer.domElement.setAttribute('aria-hidden', 'true');
  renderer.domElement.classList.add('sigpath-canvas');
  stage.prepend(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(24, 1, 0.5, 120);

  // ------------------------------------------------------------------
  // Layout. Floor is y = 0; signal runs left to right.
  // ------------------------------------------------------------------
  const GX = -6.3;
  const P1 = -3.2;
  const P2 = -0.75;
  const PZ = 0.85;
  const PS = 1.3; // pedal scale
  const AX = 3.35;
  const AS = 1.12; // amp scale
  const AZ = -0.2;

  const guitar = buildGuitar(kit);
  guitar.group.scale.setScalar(0.7);
  guitar.group.position.set(GX, 1.32, 0);
  guitar.group.rotation.set(-0.12, 0.42, 0.04);
  guitar.group.userData.spot = 'guitar';
  scene.add(guitar.group);
  const stand = buildStand(kit);
  stand.position.set(GX, 0, 0.05);
  stand.scale.setScalar(1.08);
  stand.rotation.y = 0.42;
  scene.add(stand);

  const drive = buildPedal(kit, 'accent', 'drive');
  drive.group.position.set(P1, 0, PZ);
  drive.group.rotation.y = 0.12;
  drive.group.scale.setScalar(PS);
  drive.group.userData.spot = 'drive';
  scene.add(drive.group);
  const echo = buildPedal(kit, 'field', 'echo');
  echo.group.position.set(P2, 0, PZ);
  echo.group.rotation.y = 0.12;
  echo.group.scale.setScalar(PS);
  echo.group.userData.spot = 'echo';
  scene.add(echo.group);

  const amp = buildAmp(kit);
  amp.group.position.set(AX, 0, AZ);
  amp.group.rotation.y = -0.18;
  amp.group.scale.setScalar(AS);
  amp.group.userData.spot = 'amp';
  scene.add(amp.group);

  scene.updateMatrixWorld(true);

  // Floor shadows (x, z, radius x, radius z).
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(80, 40).rotateX(-Math.PI / 2),
    floorMaterial(pal.field, [
      new THREE.Vector4(GX + 0.1, 0.1, 1.3, 0.7),
      new THREE.Vector4(P1 + 0.2, PZ - 0.1, 1.3, 1.4),
      new THREE.Vector4(P2 + 0.2, PZ - 0.1, 1.3, 1.4),
      new THREE.Vector4(AX + 0.4, AZ - 0.2, 2.4, 1.2),
    ]),
  );
  floor.position.y = 0.001;
  floor.renderOrder = -1;
  scene.add(floor);

  // ------------------------------------------------------------------
  // The cable.
  // ------------------------------------------------------------------
  const v = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
  const C = 0.07; // cable radius, so it rests on surfaces
  const jack = guitar.jack.getWorldPosition(new THREE.Vector3());
  const ampJack = amp.jack.getWorldPosition(new THREE.Vector3());
  const ampFwd = v(Math.sin(amp.group.rotation.y), 0, Math.cos(amp.group.rotation.y));
  const out = (d: number, y: number) => ampJack.clone().addScaledVector(ampFwd, d).setY(y);
  const pedalPath = (x: number) => [
    v(x - 1.0 * PS, C, PZ + 0.9 * PS),
    v(x - 0.8 * PS, 0.2 * PS, PZ + 0.15 * PS),
    v(x - 0.55 * PS, 0.3 * PS, PZ),
    v(x, 0.3 * PS, PZ),
    v(x + 0.55 * PS, 0.3 * PS, PZ),
    v(x + 0.8 * PS, 0.2 * PS, PZ + 0.15 * PS),
    v(x + 1.0 * PS, C, PZ + 0.9 * PS),
  ];
  const points = [
    jack,
    jack.clone().add(v(0.3, -0.35, 0.3)),
    v(GX + 1.2, C, 1.35),
    v(P1 - 1.6, C, PZ + 1.2),
    ...pedalPath(P1),
    ...pedalPath(P2),
    v(out(0.7, 0).x - 0.35, C, out(0.7, 0).z + 0.35),
    out(0.62, C),
    out(0.5, 0.45),
    out(0.42, ampJack.y * 0.75),
    out(0.32, ampJack.y),
    out(0.18, ampJack.y),
  ];
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal');
  const cableLen = curve.getLength();
  const cableMat = cableMaterial(pal, cableLen);
  const cableGeo = new THREE.TubeGeometry(curve, 360, C, 10, false);
  const cable = new THREE.Mesh(cableGeo, cableMat);
  cable.add(new THREE.Mesh(cableGeo, kit.mats.outline));
  scene.add(cable);

  // Where each piece of gear sits along the cable.
  const samples = Array.from({ length: 500 }, (_, i) => curve.getPointAt(i / 499));
  const uNear = (p: THREE.Vector3) => {
    let best = 0;
    let bd = Infinity;
    samples.forEach((s, i) => {
      const d = s.distanceToSquared(p);
      if (d < bd) {
        bd = d;
        best = i / 499;
      }
    });
    return best;
  };
  const AMP_U = 0.985;
  const stops: { u: number; hit: () => void }[] = [
    { u: uNear(v(P1, 0.3 * PS, PZ)), hit: () => bump(drive, pedalOn.drive) },
    { u: uNear(v(P2, 0.3 * PS, PZ)), hit: () => bump(echo, pedalOn.echo) },
    { u: AMP_U, hit: () => kick(1) },
  ];

  // The pulse head that rides along with scroll.
  const spark = new THREE.Mesh(new THREE.SphereGeometry(0.15, 18, 12), kit.mats.accent);
  spark.add(new THREE.Mesh(spark.geometry, kit.mats.outline));
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
  let ampKick = 0;
  let pilot = 0;
  let ringNext = 0;
  const pulses: Pulse[] = [];
  const bumps = new Map<Pedal, number>([
    [drive, 0],
    [echo, 0],
  ]);
  let clock = performance.now() / 1000;
  let lastSfx = 0;

  function bump(p: Pedal, on: boolean) {
    bumps.set(p, on ? 1 : 0.5);
  }
  let disposed = false;
  function kick(amount: number) {
    if (disposed) return;
    ampKick = Math.max(ampKick, amount);
    pilot = 1;
    const r = amp.rings[ringNext];
    ringNext = (ringNext + 1) % amp.rings.length;
    r.userData.t = 0;
    r.userData.size = amount;
    r.visible = true;
    if (pedalOn.echo && amount > 0.5) {
      setTimeout(() => {
        kick(amount * 0.5);
        wakeLoop();
      }, 310);
    }
  }

  // ------------------------------------------------------------------
  // Playing.
  // ------------------------------------------------------------------
  const sfxWord = () => (pedalOn.drive ? 'KRANG!' : 'TWANG!');

  function spawnSfx(word: string, x: number, y: number, size = 1, delay = 0) {
    const el = document.createElement('div');
    el.className = 'sigpath-sfx';
    el.setAttribute('aria-hidden', 'true');
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.setProperty('--sigpath-s', String(size));
    el.style.setProperty('--sigpath-r', `${(Math.random() * 16 - 10).toFixed(1)}deg`);
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
    const small = w < 520 ? 0.75 : 1;
    const x = Math.min(Math.max(p.x + 60 * small, 80 * small), w - 80 * small);
    const y = Math.max(p.y - 30, 60 * small);
    spawnSfx(sfxWord(), x, y, small);
    if (pedalOn.echo) {
      spawnSfx(sfxWord(), Math.min(x + 64 * small, w - 50), y + 32 * small, 0.62 * small, 0.31);
      spawnSfx(sfxWord(), Math.min(x + 110 * small, w - 40), y + 54 * small, 0.4 * small, 0.62);
    }
  }

  function pluck(i: number, vel = 1, delay = 0) {
    rig.pluck(i, vel, delay);
    const s = guitar.strings[i];
    setTimeout(() => (s.amp = 0.05 * vel), delay * 1000);
  }

  function sendPulse() {
    if (pulses.length >= 4) pulses.shift();
    pulses.push({ t0: clock, u: 0 });
    wakeLoop();
  }

  function strum(down = true) {
    for (let k = 0; k < 6; k++) pluck(down ? k : 5 - k, 0.85 + Math.random() * 0.15, k * 0.018);
    sendPulse();
    twang();
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
    if (hovered === id || focused === id || balloonFor === id) showBalloon(id);
    wakeLoop();
  }

  function activate(id: SpotId) {
    if (id === 'guitar') strum();
    else if (id === 'drive' || id === 'echo') setPedal(id, !pedalOn[id]);
    else kick(0.8);
    wakeLoop();
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
      on: Math.abs(tmp.x) < 0.96 && Math.abs(tmp.y) < 0.96 && tmp.z < 1,
    };
  }
  const anchorOf: Record<SpotId, THREE.Object3D> = {
    guitar: guitar.neckAnchor,
    drive: drive.anchor,
    echo: echo.anchor,
    amp: amp.anchor,
  };
  let hovered: SpotId | null = null;
  let focused: SpotId | null = null;
  let balloonFor: SpotId | null = null;

  function placeSpots() {
    for (const [id, btn] of spots) {
      const s = toScreen(anchorOf[id]);
      btn.style.transform = `translate(${s.x.toFixed(1)}px, ${s.y.toFixed(1)}px)`;
      btn.classList.toggle('sigpath-off', !s.on);
    }
    if (balloonFor) placeBalloon(balloonFor);
  }

  function placeBalloon(id: SpotId) {
    const s = toScreen(anchorOf[id]);
    const w = overlay.clientWidth;
    const bw = balloon.offsetWidth;
    const bh = balloon.offsetHeight;
    const left = Math.min(Math.max(s.x - bw * 0.3, 8), w - bw - 8);
    // Sit above the stud, but never above the top of the stage.
    const bottom = Math.max(s.y - 26, bh + 8);
    balloon.style.transform = `translate(${left.toFixed(1)}px, ${bottom.toFixed(1)}px) translateY(-100%)`;
    // Keep the tail pointing at the gear.
    const tail = Math.min(Math.max(s.x - left - 14, 18), bw - 40);
    balloon.style.setProperty('--sigpath-tail', `${tail}px`);
  }

  function showBalloon(id: SpotId) {
    const btn = spots.get(id);
    if (!btn) return;
    const say = btn.dataset.sigpathSay ?? '';
    const on = (id === 'drive' || id === 'echo') && pedalOn[id];
    const hint = (on ? btn.dataset.sigpathHintOn : null) ?? btn.dataset.sigpathHint ?? '';
    balloon.querySelector('[data-sigpath-say]')!.textContent = say;
    balloon.querySelector('[data-sigpath-hint]')!.textContent = hint;
    const fresh = balloonFor !== id;
    balloonFor = id;
    balloon.hidden = false;
    if (fresh) {
      balloon.classList.remove('sigpath-pop');
      void balloon.offsetWidth;
      balloon.classList.add('sigpath-pop');
    }
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
  const targets = [guitar.group, drive.group, echo.group, amp.group];
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
    canvas.style.cursor = id ? 'pointer' : '';
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
    const label = muteBtn?.querySelector('[data-sigpath-label]');
    if (label && muteBtn) label.textContent = muted ? (muteBtn.dataset.off ?? '') : (muteBtn.dataset.on ?? '');
  };
  muteBtn?.addEventListener('click', onMute);

  // ------------------------------------------------------------------
  // Scroll progress: no pinning. The signal leaves the guitar when the
  // stage's middle passes 88% of the viewport and reaches the amp when
  // it gets to just above the middle.
  // ------------------------------------------------------------------
  function readScroll() {
    const r = stage.getBoundingClientRect();
    const vh = innerHeight;
    const mid = r.top + r.height / 2;
    progress = THREE.MathUtils.clamp((vh * 0.88 - mid) / (vh * 0.4), 0, 1);
    wakeLoop();
  }

  // ------------------------------------------------------------------
  // Camera: an elevated three-quarter view, fitted to the gear so the
  // chain fills the stage at any aspect ratio.
  // ------------------------------------------------------------------
  // Fit to each piece's own bounds, not one box around everything, so
  // the empty air above the pedals doesn't count.
  const box = new THREE.Box3();
  const corners: THREE.Vector3[] = [];
  for (const o of [guitar.group, stand, drive.group, echo.group, amp.group]) {
    const b = new THREE.Box3().setFromObject(o);
    b.max.y += 0.3; // room for the studs above the gear
    box.union(b);
    for (let i = 0; i < 8; i++) corners.push(v(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z));
  }
  const center = box.getCenter(new THREE.Vector3());

  function fitCamera() {
    const narrow = camera.aspect < 1.2;
    const yaw = narrow ? 0.62 : 0.3;
    const pitch = narrow ? 0.5 : 0.4;
    const dir = v(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), Math.cos(yaw) * Math.cos(pitch));
    // Usable NDC window: leave the top-left free for the caption box.
    const X0 = -0.94;
    const X1 = 0.94;
    const Y0 = -0.9;
    const Y1 = narrow ? 0.74 : 0.86;
    let dist = 30;
    const pos = center.clone().addScaledVector(dir, dist);
    camera.position.copy(pos);
    camera.lookAt(center);
    const right = v(1, 0, 0).applyQuaternion(camera.quaternion);
    const up = v(0, 1, 0).applyQuaternion(camera.quaternion);
    const fwd = v(0, 0, -1).applyQuaternion(camera.quaternion);
    const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const tanH = tanV * camera.aspect;
    for (let it = 0; it < 8; it++) {
      camera.position.copy(pos);
      camera.updateMatrixWorld();
      let x0 = Infinity;
      let x1 = -Infinity;
      let y0 = Infinity;
      let y1 = -Infinity;
      for (const c of corners) {
        tmp.copy(c).project(camera);
        x0 = Math.min(x0, tmp.x);
        x1 = Math.max(x1, tmp.x);
        y0 = Math.min(y0, tmp.y);
        y1 = Math.max(y1, tmp.y);
      }
      const depth = tmp.copy(center).sub(pos).dot(fwd);
      // Shift sideways so the bounds sit in the middle of the window...
      const sx = (x0 + x1) / 2 - (X0 + X1) / 2;
      const sy = (y0 + y1) / 2 - (Y0 + Y1) / 2;
      pos.addScaledVector(right, sx * depth * tanH);
      pos.addScaledVector(up, sy * depth * tanV);
      // ...and dolly so they fill it.
      const fill = Math.max((x1 - x0) / (X1 - X0), (y1 - y0) / (Y1 - Y0));
      pos.addScaledVector(fwd, depth * (1 - fill));
      dist = depth * fill;
    }
    camera.position.copy(pos);
    camera.updateMatrixWorld();
  }

  let width = 1;
  let height = 1;
  function resize() {
    width = Math.max(1, stage.clientWidth);
    height = Math.max(1, stage.clientHeight);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(width, height, false);
    renderer.getDrawingBufferSize(shared.uRes.value);
    shared.uOutline.value = (width < 640 ? 1.8 : 2.5) * dpr;
    shared.uDot.value = (width < 640 ? 5 : 6.5) * dpr;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    fitCamera();
  }

  // ------------------------------------------------------------------
  // Frame loop. It idles (no rAF) once everything has settled.
  // ------------------------------------------------------------------
  let inView = false;
  let running = false;
  let raf = 0;
  let quiet = 0;

  function busy() {
    if (pulses.length || ampKick > 0.002 || Math.abs(progress - head) > 1e-3) return true;
    if (head > 0.002 && head < 0.995) return true;
    if (pilot > 0.01 && head < AMP_U) return true;
    if (amp.rings.some((r) => r.visible)) return true;
    for (const s of guitar.strings) if (s.amp > 1e-4) return true;
    for (const [p, b] of bumps) if (b > 0.002 || (p.switchCap.userData.press ?? 0) > 0.002) return true;
    // Signal dashes keep marching while the cable carries signal.
    return head > 0.002;
  }

  function frame() {
    const now = performance.now() / 1000;
    const dt = Math.min(now - clock, 0.05);
    clock = now;

    // Scroll pulse.
    const want = THREE.MathUtils.smoothstep(progress, 0.02, 0.98);
    head += (want - head) * (1 - Math.exp(-dt * 8));
    if (Math.abs(want - head) < 1e-4) head = want;
    for (const s of stops) if (prevHead < s.u && head >= s.u) s.hit();
    prevHead = head;
    cableMat.uniforms.uHead.value = head;
    cableMat.uniforms.uTime.value = now;
    spark.visible = head > 0.002 && head < AMP_U;
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

    // Strings.
    for (const s of guitar.strings) {
      if (s.amp < 1e-4) {
        s.amp = 0;
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
      bumps.set(p, nb < 0.002 ? 0 : nb);
      const sq = Math.sin(nb * Math.PI) * 0.08 * Math.min(1, b * 2);
      p.group.scale.set(PS * (1 + sq * 0.5), PS * (1 - sq), PS * (1 + sq * 0.5));
      const press = (p.switchCap.userData.press ?? 0) as number;
      p.switchCap.userData.press = press < 0.002 ? 0 : press * Math.exp(-dt * 10);
      p.switchCap.position.y = 0.55 + 0.12 - press * 0.07;
      p.shine.scale.setScalar(1 + nb * 0.6);
    }

    // The amp: pilot stays lit once the signal has arrived; the speaker
    // pumps and ink rings come off the grille.
    if (head < AMP_U) pilot *= Math.exp(-dt * 3);
    (amp.pilot.material as THREE.MeshBasicMaterial).color.copy(pilot > 0.35 ? pal.accent : pal.ink);
    ampKick *= Math.exp(-dt * 5);
    if (ampKick < 0.002) ampKick = 0;
    const pump = ampKick * (0.5 + 0.5 * Math.sin(now * 40));
    amp.cone.scale.setScalar(1 + pump * 0.12);
    amp.group.scale.set(AS * (1 + ampKick * 0.02), AS * (1 - ampKick * 0.018), AS * (1 + ampKick * 0.02));
    for (const r of amp.rings) {
      if (!r.visible) continue;
      const t = (r.userData.t += dt / 0.7);
      if (t >= (r.userData.size > 0.5 ? 0.85 : 0.55)) {
        r.visible = false;
        continue;
      }
      r.scale.setScalar(1 + t * (0.7 + r.userData.size * 0.9));
    }

    renderer.render(scene, camera);
    placeSpots();

    // Settle: stop requesting frames a moment after nothing moves.
    quiet = busy() ? 0 : quiet + dt;
    if (quiet > 0.3) {
      running = false;
      return;
    }
    raf = requestAnimationFrame(frame);
  }

  function wakeLoop() {
    if (running || !inView || document.hidden) return;
    running = true;
    quiet = 0;
    clock = performance.now() / 1000;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    running = false;
    cancelAnimationFrame(raf);
  }
  function renderStill() {
    renderer.render(scene, camera);
    placeSpots();
  }

  const io = new IntersectionObserver(([e]) => {
    inView = e.isIntersecting;
    if (inView) wakeLoop();
    else stop();
  });
  io.observe(stage);
  const onVis = () => (document.hidden ? stop() : wakeLoop());
  document.addEventListener('visibilitychange', onVis);
  const ro = new ResizeObserver(() => {
    resize();
    if (!running) renderStill();
  });
  ro.observe(stage);
  addEventListener('scroll', readScroll, { passive: true });
  addEventListener('resize', readScroll);

  resize();
  readScroll();
  // Start where the scroll already is, without replaying the hits.
  head = prevHead = THREE.MathUtils.smoothstep(progress, 0.02, 0.98);
  if (head >= AMP_U) pilot = 1;
  renderStill();
  root.classList.add('sigpath-ready');

  return () => {
    disposed = true;
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
    overlay.querySelectorAll('.sigpath-sfx').forEach((el) => el.remove());
    root.classList.remove('sigpath-ready');
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

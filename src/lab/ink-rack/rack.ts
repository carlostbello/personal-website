// Mounts the halftone rack into [data-rack]. Returns a cleanup function.
// Without WebGL the static ink drawing in the markup stays put.
import * as THREE from 'three';
import { buildRack, normalMaterial, type Server } from './scene';
import { printMaterial } from './print';

const BASE_YAW = 0.42;
const BASE_PITCH = 0.06;

export function mountRack(root: HTMLElement): () => void {
  const stage = root.querySelector<HTMLElement>('[data-stage]');
  const callout = root.querySelector<HTMLElement>('[data-callout]');
  const hits = root.querySelector<HTMLElement>('[data-hits]');
  if (!stage || !callout || !hits) return () => {};

  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');

  let renderer: THREE.WebGLRenderer;
  try {
    renderer = new THREE.WebGLRenderer({ canvas, antialias: false, alpha: false, powerPreference: 'low-power' });
  } catch {
    return () => {};
  }
  renderer.setClearColor(0x000000, 0);
  renderer.autoClear = true;

  const css = getComputedStyle(document.documentElement);
  const token = (n: string, f: string) => css.getPropertyValue(n).trim() || f;
  const print = printMaterial({
    ink: token('--ink', '#0b0b0c'),
    page: token('--page', '#ffffff'),
    accent: token('--accent', '#f3b53f'),
    field: token('--field', '#3b5a8c'),
  });

  const scene = new THREE.Scene();
  const { rack, servers, dispose: disposeRack } = buildRack();
  const pivot = new THREE.Group();
  pivot.add(rack);
  rack.position.set(-0.04, 0, 0);
  scene.add(pivot);
  const camera = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
  const target = new THREE.Vector3(0.05, 1.12, 0);

  const rtOpts = { depthBuffer: true, minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter };
  const rtColor = new THREE.WebGLRenderTarget(1, 1, rtOpts);
  const rtNormal = new THREE.WebGLRenderTarget(1, 1, rtOpts);
  print.uniforms.tColor.value = rtColor.texture;
  print.uniforms.tNormal.value = rtNormal.texture;
  const quadGeo = new THREE.PlaneGeometry(2, 2);
  const quad = new THREE.Mesh(quadGeo, print);
  quad.frustumCulled = false;
  const quadScene = new THREE.Scene();
  quadScene.add(quad);
  const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);

  let w = 1;
  let h = 1;
  let dpr = 1;
  let cellCss = 6.5;
  const resize = () => {
    const r = stage.getBoundingClientRect();
    w = Math.max(1, Math.round(r.width));
    h = Math.max(1, Math.round(r.height));
    dpr = Math.min(devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    rtColor.setSize(w * dpr, h * dpr);
    rtNormal.setSize(w * dpr, h * dpr);
    print.uniforms.uRes.value.set(w * dpr, h * dpr);
    // Smaller panels get a finer screen and thinner pens.
    cellCss = THREE.MathUtils.clamp(w / 80, 4.6, 6.8);
    print.uniforms.uLine.value = THREE.MathUtils.clamp(w / 330, 1.1, 1.6) * dpr;
    camera.aspect = w / h;
    // Fit the rack's height, and back off further on narrow panels.
    const fitH = 1.5 / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    const fitW = 1.05 / (Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * camera.aspect);
    const dist = Math.max(fitH, fitW);
    camera.position.set(target.x + dist * 0.18, target.y + dist * 0.2, dist);
    camera.lookAt(target);
    camera.updateProjectionMatrix();
    dirty = true;
  };

  // ---- state --------------------------------------------------------
  let dirty = true;
  let yaw = 0;
  let yawV = 0;
  let pitch = 0;
  let pitchV = 0;
  let yawT = 0;
  let pitchT = 0;
  let dragging = false;
  let dragX = 0;
  let dragY = 0;
  let dragStartYaw = 0;
  let dragStartPitch = 0;
  let moved = 0;
  let lean = 0;
  let scrollK = 0;
  let active: Server | null = null;
  let pinned = false;
  let lastStep = -1;

  // ---- focus targets: one real button per box -------------------------
  const buttons = servers.map((s) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'hit';
    b.textContent = s.label;
    b.addEventListener('focus', () => setActive(s));
    b.addEventListener('blur', () => !pinned && setActive(null));
    b.addEventListener('click', () => {
      pinned = active === s ? !pinned : true;
      setActive(s);
    });
    hits.appendChild(b);
    return b;
  });

  function setActive(s: Server | null) {
    if (active === s) return;
    if (active) active.bodies.forEach((m) => (m.uniforms.uAccent.value = 0));
    active = s;
    if (s) s.bodies.forEach((m) => (m.uniforms.uAccent.value = 0.5));
    callout!.textContent = s ? s.label : '';
    callout!.hidden = !s;
    if (s && !reduced) {
      callout!.classList.remove('pop');
      void callout!.offsetWidth;
      callout!.classList.add('pop');
    }
    canvas.style.cursor = s ? 'pointer' : 'grab';
    dirty = true;
  }

  // ---- pointer --------------------------------------------------------
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const pick = (e: PointerEvent): Server | null => {
    const r = canvas.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    for (const hit of ray.intersectObject(rack, true)) {
      const s = hit.object.userData.server as Server | undefined;
      if (s) return s;
    }
    return null;
  };

  const onDown = (e: PointerEvent) => {
    if (reduced || e.button > 0) return;
    dragging = true;
    moved = 0;
    dragX = e.clientX;
    dragY = e.clientY;
    dragStartYaw = yawT;
    dragStartPitch = pitchT;
    canvas.setPointerCapture(e.pointerId);
    canvas.style.cursor = 'grabbing';
  };
  const onMove = (e: PointerEvent) => {
    if (dragging) {
      const dx = e.clientX - dragX;
      const dy = e.clientY - dragY;
      moved = Math.max(moved, Math.abs(dx) + Math.abs(dy));
      yawT = THREE.MathUtils.clamp(dragStartYaw + dx * 0.007, -0.85, 0.85);
      pitchT = THREE.MathUtils.clamp(dragStartPitch + dy * 0.003, -0.15, 0.25);
      return;
    }
    if (e.pointerType === 'mouse') {
      if (!pinned) setActive(pick(e));
      const r = canvas.getBoundingClientRect();
      lean = ((e.clientX - r.left) / r.width - 0.5) * 2;
      dirty = true;
    }
  };
  const onUp = (e: PointerEvent) => {
    const wasDrag = dragging && moved > 6;
    dragging = false;
    // Spring back home: he likes it tidy.
    yawT = 0;
    pitchT = 0;
    canvas.style.cursor = active ? 'pointer' : 'grab';
    if (!wasDrag) {
      const s = pick(e);
      pinned = !!s && !(pinned && active === s);
      setActive(s);
    }
  };
  const onLeave = () => {
    if (!pinned && !dragging) setActive(null);
    lean = 0;
    dirty = true;
  };
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onUp);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.style.cursor = reduced ? 'default' : 'grab';

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && active) {
      pinned = false;
      setActive(null);
      (document.activeElement as HTMLElement | null)?.blur();
    }
  };
  root.addEventListener('keydown', onKey);

  // The dot screen turns a few degrees as the hero scrolls away.
  const onScroll = () => {
    const r = root.getBoundingClientRect();
    scrollK = THREE.MathUtils.clamp(-r.top / Math.max(1, r.height), 0, 1);
    dirty = true;
  };
  addEventListener('scroll', onScroll, { passive: true });

  // ---- layout helpers ---------------------------------------------------
  const v = new THREE.Vector3();
  const corners = Array.from({ length: 8 }, () => new THREE.Vector3());
  const screenBox = (s: Server) => {
    const b = s.box;
    let i = 0;
    for (const x of [b.min.x, b.max.x])
      for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) corners[i++].set(x, y, z);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const c of corners) {
      v.copy(c).applyMatrix4(rack.matrixWorld).project(camera);
      const sx = (v.x * 0.5 + 0.5) * w;
      const sy = (-v.y * 0.5 + 0.5) * h;
      x0 = Math.min(x0, sx); x1 = Math.max(x1, sx);
      y0 = Math.min(y0, sy); y1 = Math.max(y1, sy);
    }
    return { x0, y0, x1, y1 };
  };

  const layout = () => {
    // Front faces only, so the buttons hug what you see, not the depth.
    servers.forEach((s, i) => {
      const r = screenBox(s);
      const b = buttons[i];
      b.style.left = `${r.x0.toFixed(1)}px`;
      b.style.top = `${r.y0.toFixed(1)}px`;
      b.style.width = `${(r.x1 - r.x0).toFixed(1)}px`;
      b.style.height = `${(r.y1 - r.y0).toFixed(1)}px`;
    });
    if (active) {
      const r = screenBox(active);
      const cw = callout.offsetWidth;
      const ch = callout.offsetHeight;
      const x = THREE.MathUtils.clamp(r.x0 + (r.x1 - r.x0) * 0.6 - cw * 0.3, 8, w - cw - 8);
      const above = r.y0 - ch - 18;
      const y = above > 8 ? above : Math.min(r.y1 + 18, h - ch - 8);
      callout.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      callout.dataset.below = above > 8 ? '' : 'yes';
    }
  };

  // ---- frame ------------------------------------------------------------
  const render = () => {
    pivot.rotation.set(BASE_PITCH + pitch, BASE_YAW + yaw + lean * 0.06, 0);
    print.uniforms.uAngle.value = 0.785 + scrollK * 0.35 + lean * 0.05;
    print.uniforms.uCell.value = cellCss * (1 + scrollK * 0.4) * dpr;
    scene.updateMatrixWorld();

    renderer.setRenderTarget(rtColor);
    renderer.setClearColor(0x000000, 0);
    renderer.clear();
    renderer.render(scene, camera);
    scene.overrideMaterial = normalMaterial;
    renderer.setRenderTarget(rtNormal);
    renderer.clear();
    renderer.render(scene, camera);
    scene.overrideMaterial = null;
    renderer.setRenderTarget(null);
    renderer.render(quadScene, quadCam);
    layout();
  };

  const fan = servers.find((s) => s.key === 'gpu')?.group.userData.fan as THREE.Group | undefined;

  const tick = (now: number) => {
    raf = requestAnimationFrame(tick);
    const t = now / 1000;

    // Springs, integrated with a fixed small step for stability.
    const k = 120;
    const damp = 14;
    const dt = 1 / 60;
    if (dragging) {
      yawV = pitchV = 0;
      yaw += (yawT - yaw) * 0.5;
      pitch += (pitchT - pitch) * 0.5;
    } else {
      yawV += ((yawT - yaw) * k - yawV * damp) * dt;
      yaw += yawV * dt;
      pitchV += ((pitchT - pitch) * k - pitchV * damp) * dt;
      pitch += pitchV * dt;
    }
    const moving = Math.abs(yawT - yaw) + Math.abs(yawV) + Math.abs(pitchT - pitch) + Math.abs(pitchV) > 1e-4;

    // LEDs and ink boil step at 8fps, like the rest of the site's motion.
    const step = Math.floor(t * 8);
    if (step !== lastStep) {
      lastStep = step;
      print.uniforms.uBoil.value = step % 3;
      for (const s of servers) {
        const hot = s === active;
        for (const l of s.leds) {
          // Idle: a few slow activity blinks. Pointed at: everything chatters.
          const on = hot
            ? Math.sin(t * (9 + l.rate * 6) + l.phase) > -0.2
            : !l.idle || Math.sin(t * l.rate * 2.2 + l.phase) > -0.3;
          l.mat.uniforms.uAccent.value = on ? 1 : 0;
          l.mat.uniforms.uBase.value = on ? 0 : 0.85;
        }
      }
      if (fan) fan.rotation.z -= active?.key === 'gpu' ? 0.9 : 0.25;
      dirty = true;
    }

    if (dirty || moving) {
      dirty = false;
      render();
    }
  };

  // ---- lifecycle --------------------------------------------------------
  let raf = 0;
  let visible = false;
  const start = () => {
    if (!raf && visible && !document.hidden && !reduced) raf = requestAnimationFrame(tick);
  };
  const stop = () => {
    cancelAnimationFrame(raf);
    raf = 0;
  };
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    if (visible) start();
    else stop();
  });
  const onVis = () => (document.hidden ? stop() : start());
  document.addEventListener('visibilitychange', onVis);

  const ro = new ResizeObserver(() => {
    resize();
    if (reduced || !raf) render();
  });

  stage.prepend(canvas);
  resize();
  try {
    render();
  } catch {
    // Leave the drawing in place if the GPU says no.
  }
  root.classList.add('live');
  ro.observe(stage);
  io.observe(root);

  // Reduced motion: a single complete frame, re-printed only on hover/focus.
  if (reduced) {
    const still = () => {
      if (dirty) {
        dirty = false;
        render();
      }
    };
    canvas.addEventListener('pointermove', still);
    hits.addEventListener('focusin', () => queueMicrotask(still));
    hits.addEventListener('focusout', () => queueMicrotask(still));
    canvas.addEventListener('pointerup', still);
  }

  return () => {
    stop();
    io.disconnect();
    ro.disconnect();
    removeEventListener('scroll', onScroll);
    document.removeEventListener('visibilitychange', onVis);
    root.removeEventListener('keydown', onKey);
    buttons.forEach((b) => b.remove());
    disposeRack();
    rtColor.dispose();
    rtNormal.dispose();
    quadGeo.dispose();
    print.dispose();
    renderer.dispose();
    renderer.forceContextLoss();
    canvas.remove();
    root.classList.remove('live');
  };
}

// The gear, modeled from primitives. Every solid gets an ink hull.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { flatMaterial, grilleMaterial, hullOf, outlineMaterial, stringMaterial, toonMaterial, type Palette } from './materials';

export interface Kit {
  p: Palette;
  mats: {
    accent: THREE.Material;
    page: THREE.Material;
    field: THREE.Material;
    deep: THREE.Material;
    ink: THREE.Material;
    outline: THREE.Material;
  };
}

export function makeKit(p: Palette): Kit {
  return {
    p,
    mats: {
      accent: toonMaterial(p.accent, p.ink, 0.8),
      page: toonMaterial(p.page, p.field, 1),
      field: toonMaterial(p.field, p.ink, 0.9),
      deep: toonMaterial(p.fieldDeep, p.ink, 0.9),
      ink: flatMaterial(p.ink),
      outline: outlineMaterial(p.ink),
    },
  };
}

type MatName = keyof Kit['mats'];

function solid(kit: Kit, geo: THREE.BufferGeometry, mat: MatName, outline = true): THREE.Mesh {
  const m = new THREE.Mesh(geo, kit.mats[mat]);
  if (outline) {
    const hull = new THREE.Mesh(hullOf(geo), kit.mats.outline);
    hull.userData.hull = true;
    m.add(hull);
  }
  return m;
}

function place<T extends THREE.Object3D>(o: T, x: number, y: number, z: number, parent?: THREE.Object3D): T {
  o.position.set(x, y, z);
  parent?.add(o);
  return o;
}

/** Cylinder whose axis points at the camera (+z). */
function disc(r: number, h: number, seg = 24): THREE.BufferGeometry {
  return new THREE.CylinderGeometry(r, r, h, seg).rotateX(Math.PI / 2);
}

// ---------------------------------------------------------------------
// Guitar: a single-cut slab body, bolt-on neck, six strings.
// ---------------------------------------------------------------------

export interface Guitar {
  group: THREE.Group;
  strings: { mesh: THREE.Mesh; mat: THREE.ShaderMaterial; amp: number; phase: number; speed: number }[];
  jack: THREE.Object3D;
  anchor: THREE.Object3D;
  neckAnchor: THREE.Object3D;
  /** Local x of each string at the 12th fret, for drag-strumming. */
  stringX: number[];
}

function bodyShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0, -1.6);
  s.bezierCurveTo(0.95, -1.62, 1.36, -1.15, 1.3, -0.5);
  s.bezierCurveTo(1.26, -0.08, 0.96, 0.1, 0.96, 0.45);
  s.bezierCurveTo(0.96, 0.78, 0.74, 0.98, 0.42, 0.98);
  s.lineTo(-0.3, 1.0);
  s.bezierCurveTo(-0.42, 1.42, -0.92, 1.52, -1.12, 1.24);
  s.bezierCurveTo(-1.3, 0.98, -0.98, 0.5, -1.02, 0.1);
  s.bezierCurveTo(-1.06, -0.25, -1.32, -0.42, -1.33, -0.75);
  s.bezierCurveTo(-1.36, -1.25, -0.9, -1.6, 0, -1.6);
  return s;
}

function guardShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.3, 0.97);
  s.lineTo(0.38, 0.95);
  s.bezierCurveTo(0.7, 0.92, 0.88, 0.7, 0.86, 0.38);
  s.bezierCurveTo(0.84, 0.05, 0.6, -0.12, 0.5, -0.38);
  s.lineTo(-0.42, -0.42);
  s.bezierCurveTo(-0.8, -0.3, -0.92, -0.05, -0.9, 0.28);
  s.bezierCurveTo(-0.88, 0.62, -0.62, 0.9, -0.3, 0.97);
  return s;
}

function headShape(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(-0.25, 0);
  s.lineTo(0.25, 0);
  s.bezierCurveTo(0.32, 0.28, 0.2, 0.5, 0.24, 0.78);
  s.bezierCurveTo(0.28, 1.12, 0.08, 1.32, -0.16, 1.34);
  s.bezierCurveTo(-0.44, 1.38, -0.52, 1.1, -0.44, 0.82);
  s.lineTo(-0.28, 0.22);
  s.lineTo(-0.25, 0);
  return s;
}

export function buildGuitar(kit: Kit): Guitar {
  const g = new THREE.Group();
  const front = 0.2; // body top surface

  const body = new THREE.ExtrudeGeometry(bodyShape(), {
    depth: 0.3,
    bevelEnabled: true,
    bevelThickness: 0.05,
    bevelSize: 0.05,
    bevelSegments: 2,
    curveSegments: 32,
  }).translate(0, 0, -0.15);
  g.add(solid(kit, body, 'accent'));

  const guard = new THREE.ExtrudeGeometry(guardShape(), { depth: 0.03, bevelEnabled: false, curveSegments: 24 });
  place(solid(kit, guard, 'page'), 0, 0, front, g);

  // Neck and headstock.
  const nutY = 4.55;
  const bridgeY = -0.95;
  const neck = new RoundedBoxGeometry(0.5, 3.75, 0.16, 2, 0.05);
  place(solid(kit, neck, 'page'), 0, 0.85 + 3.75 / 2, front + 0.06, g);
  const head = new THREE.ExtrudeGeometry(headShape(), { depth: 0.1, bevelEnabled: true, bevelThickness: 0.02, bevelSize: 0.02, bevelSegments: 1 });
  place(solid(kit, head, 'page'), 0, nutY - 0.02, front - 0.03, g);
  // Tuner posts down the bass side.
  const post = disc(0.045, 0.12, 12);
  for (let i = 0; i < 6; i++) {
    const t = i / 5;
    place(solid(kit, post, 'ink', false), -0.28 + t * 0.04 - Math.sin(t * Math.PI) * 0.06, nutY + 0.2 + t * 0.98, front + 0.12, g);
  }
  place(new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.05, 0.05), kit.mats.ink), 0, nutY, front + 0.16, g);

  // Frets and inlays.
  const scale = nutY - bridgeY;
  const fret = new THREE.BoxGeometry(0.5, 0.022, 0.02);
  const fretY = (i: number) => nutY - scale * (1 - Math.pow(2, -i / 12));
  for (let i = 1; i <= 21; i++) place(new THREE.Mesh(fret, kit.mats.ink), 0, fretY(i), front + 0.145, g);
  const dot = new THREE.CircleGeometry(0.04, 12);
  for (const i of [3, 5, 7, 9, 15, 17]) place(new THREE.Mesh(dot, kit.mats.ink), 0, (fretY(i) + fretY(i - 1)) / 2, front + 0.142, g);
  for (const x of [-0.1, 0.1]) place(new THREE.Mesh(dot, kit.mats.ink), x, (fretY(12) + fretY(11)) / 2, front + 0.142, g);

  // Hardware.
  place(solid(kit, new RoundedBoxGeometry(0.86, 0.6, 0.05, 2, 0.02), 'page'), 0, bridgeY - 0.05, front + 0.02, g);
  for (const x of [-0.17, 0, 0.17]) place(new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.08, 0.08), kit.mats.ink), x, bridgeY, front + 0.08, g);
  const bridgePickup = place(solid(kit, new RoundedBoxGeometry(0.62, 0.2, 0.08, 2, 0.03), 'deep'), 0, bridgeY + 0.3, front + 0.06, g);
  bridgePickup.rotation.z = -0.12;
  place(solid(kit, new RoundedBoxGeometry(0.55, 0.24, 0.07, 2, 0.04), 'page'), 0, 0.55, front + 0.06, g);
  const plate = place(solid(kit, new RoundedBoxGeometry(0.32, 1.05, 0.04, 2, 0.015), 'page'), 0.82, -0.68, front + 0.02, g);
  plate.rotation.z = 0.55;
  const knob = disc(0.11, 0.12, 20);
  place(solid(kit, knob, 'page'), 0.98, -0.95, front + 0.08, g);
  place(solid(kit, knob, 'page'), 0.73, -0.55, front + 0.08, g);
  place(solid(kit, new THREE.SphereGeometry(0.06, 12, 8), 'ink', false), 0.57, -0.29, front + 0.1, g);

  // Strings: one shader each so they can vibrate independently.
  const zS = front + 0.2;
  const strings: Guitar['strings'] = [];
  const stringX: number[] = [];
  for (let i = 0; i < 6; i++) {
    const t = i / 5 - 0.5;
    const xb = t * 0.38;
    const xn = t * 0.3;
    const len = Math.hypot(xn - xb, nutY - bridgeY);
    const r = 0.022 - i * 0.0018;
    const mat = stringMaterial(kit.p.ink);
    mat.uniforms.uLen.value = len;
    const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 5, 24), mat);
    mesh.position.set((xb + xn) / 2, (bridgeY + nutY) / 2, zS);
    mesh.rotation.z = -Math.atan2(xn - xb, nutY - bridgeY);
    g.add(mesh);
    strings.push({ mesh, mat, amp: 0, phase: 0, speed: 60 + i * 9 });
    stringX.push((xb + xn) / 2);
  }

  // Output jack on the lower bout's edge, with a plug in it.
  const jack = place(new THREE.Object3D(), 1.36, -0.72, 0, g);
  const plug = place(solid(kit, new THREE.CylinderGeometry(0.09, 0.09, 0.32, 14), 'page'), 1.42, -0.72, 0, g);
  plug.rotation.z = Math.PI / 2 + 0.25;

  const anchor = place(new THREE.Object3D(), 0, 1.1, front, g);
  const neckAnchor = place(new THREE.Object3D(), 0, 2.6, front, g);

  return { group: g, strings, jack, anchor, neckAnchor, stringX };
}

/** A two-leg stand under the guitar. */
export function buildStand(kit: Kit): THREE.Group {
  const g = new THREE.Group();
  const leg = new THREE.BoxGeometry(0.09, 1.5, 0.09);
  for (const s of [-1, 1]) {
    const l = place(solid(kit, leg, 'ink', false), s * 0.45, 0.62, -0.25, g);
    l.rotation.z = s * 0.25;
    l.rotation.x = 0.2;
  }
  place(solid(kit, new RoundedBoxGeometry(1.5, 0.12, 0.3, 2, 0.04), 'ink', false), 0, 0.16, 0.12, g);
  const back = place(solid(kit, new THREE.BoxGeometry(0.08, 1.3, 0.08), 'ink', false), 0, 0.6, -0.65, g);
  back.rotation.x = -0.35;
  return g;
}

// ---------------------------------------------------------------------
// Pedals.
// ---------------------------------------------------------------------

export interface Pedal {
  group: THREE.Group;
  led: THREE.Mesh;
  shine: THREE.Group;
  switchCap: THREE.Object3D;
  anchor: THREE.Object3D;
}

function bolt(): THREE.Shape {
  const s = new THREE.Shape();
  s.moveTo(0.06, 0.2);
  s.lineTo(-0.1, -0.01);
  s.lineTo(0.0, -0.01);
  s.lineTo(-0.06, -0.2);
  s.lineTo(0.11, 0.04);
  s.lineTo(0.01, 0.04);
  s.lineTo(0.06, 0.2);
  return s;
}

export function buildPedal(kit: Kit, body: MatName, kind: 'drive' | 'echo'): Pedal {
  const g = new THREE.Group();
  const H = 0.55;
  place(solid(kit, new RoundedBoxGeometry(1.3, H, 1.7, 3, 0.1), body), 0, H / 2, 0, g);
  const top = H;

  // Knobs with an ink pointer line.
  const knob = new THREE.CylinderGeometry(0.15, 0.16, 0.14, 20);
  const pointer = new THREE.BoxGeometry(0.03, 0.02, 0.13);
  [-0.34, 0.34].forEach((x, i) => {
    const k = place(solid(kit, knob, 'page'), x, top + 0.07, -0.46, g);
    const ptr = place(new THREE.Mesh(pointer, kit.mats.ink), 0, 0.075, -0.06, k);
    k.rotation.y = i ? -0.7 : 0.5;
    void ptr;
  });

  // LED in an ink bezel, plus shine ticks that show when it's on.
  place(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.03, 18), kit.mats.ink), 0, top + 0.01, -0.12, g);
  const led = place(new THREE.Mesh(new THREE.SphereGeometry(0.075, 14, 10), flatMaterial(kit.p.ink)), 0, top + 0.04, -0.12, g);
  const shine = place(new THREE.Group(), 0, top + 0.05, -0.12, g);
  const tick = new THREE.BoxGeometry(0.035, 0.02, 0.12);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2 + 0.3;
    const t = place(new THREE.Mesh(tick, kit.mats.ink), Math.cos(a) * 0.25, 0, Math.sin(a) * 0.25, shine);
    t.rotation.y = -a + Math.PI / 2;
  }
  shine.visible = false;

  // The pedal's mark, printed flat on top.
  const mark = place(new THREE.Group(), 0, top + 0.004, 0.18, g);
  mark.rotation.x = -Math.PI / 2;
  if (kind === 'drive') {
    mark.add(new THREE.Mesh(new THREE.ShapeGeometry(bolt()).scale(1.3, 1.3, 1), kit.mats.ink));
  } else {
    for (const r of [0.08, 0.15, 0.22]) {
      mark.add(new THREE.Mesh(new THREE.RingGeometry(r - 0.025, r, 28, 1, -0.9, 1.8), kit.mats.ink));
    }
    mark.add(new THREE.Mesh(new THREE.CircleGeometry(0.035, 12), kit.mats.ink));
  }

  // Footswitch on a hex nut.
  place(solid(kit, new THREE.CylinderGeometry(0.21, 0.21, 0.06, 6), 'page'), 0, top + 0.03, 0.5, g);
  const switchCap = place(solid(kit, new THREE.CylinderGeometry(0.15, 0.17, 0.16, 18), 'page'), 0, top + 0.12, 0.5, g);

  // Jacks on both sides.
  const jack = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 14).rotateZ(Math.PI / 2);
  place(new THREE.Mesh(jack, kit.mats.ink), -0.68, 0.3, 0, g);
  place(new THREE.Mesh(jack, kit.mats.ink), 0.68, 0.3, 0, g);

  const anchor = place(new THREE.Object3D(), 0, top + 0.25, 0, g);
  return { group: g, led, shine, switchCap, anchor };
}

// ---------------------------------------------------------------------
// Combo amp: tolex cabinet, a control strip along the top, grille cloth
// over one speaker, a strap handle.
// ---------------------------------------------------------------------

export interface Amp {
  group: THREE.Group;
  /** The speaker you can make out through the cloth. It pumps. */
  cone: THREE.Object3D;
  rings: THREE.Mesh[];
  pilot: THREE.Mesh;
  jack: THREE.Object3D;
  anchor: THREE.Object3D;
}

export function buildAmp(kit: Kit): Amp {
  const g = new THREE.Group();
  const W = 3.1;
  const H = 2.45;
  const D = 1.3;
  const face = D / 2;
  place(solid(kit, new RoundedBoxGeometry(W, H, D, 3, 0.14), 'deep'), 0, H / 2, 0, g);

  // Control strip.
  const stripH = 0.46;
  const stripY = H - 0.13 - stripH / 2;
  place(solid(kit, new RoundedBoxGeometry(W - 0.26, stripH, 0.05, 2, 0.02), 'page'), 0, stripY, face + 0.01, g);
  const knob = disc(0.1, 0.1, 20);
  const pointer = new THREE.BoxGeometry(0.025, 0.09, 0.02);
  const knobs = 6;
  for (let i = 0; i < knobs; i++) {
    const k = place(solid(kit, knob, 'ink', false), -0.62 + i * 0.32, stripY, face + 0.08, g);
    place(new THREE.Mesh(pointer, kit.mats.page), 0, 0.045, 0.055, k);
    k.rotation.z = [0.9, -0.4, 0.3, -1.1, 0.6, -0.2][i];
  }
  // Input jack on the left, pilot jewel on the right.
  const jx = -W / 2 + 0.36;
  place(new THREE.Mesh(disc(0.11, 0.03, 18), kit.mats.ink), jx, stripY, face + 0.045, g);
  const jack = place(new THREE.Object3D(), jx, stripY, face + 0.05, g);
  const plug = place(solid(kit, disc(0.075, 0.26, 14), 'page'), jx, stripY, face + 0.17, g);
  void plug;
  place(new THREE.Mesh(disc(0.11, 0.03, 18), kit.mats.ink), W / 2 - 0.34, stripY, face + 0.045, g);
  const pilot = place(
    new THREE.Mesh(new THREE.SphereGeometry(0.085, 14, 10), flatMaterial(kit.p.ink)),
    W / 2 - 0.34,
    stripY,
    face + 0.07,
    g,
  );

  // Grille cloth, framed in white piping.
  const gW = W - 0.34;
  const gH = H - stripH - 0.5;
  const gY = 0.17 + gH / 2;
  place(solid(kit, new RoundedBoxGeometry(gW + 0.08, gH + 0.08, 0.04, 2, 0.02), 'page'), 0, gY, face + 0.005, g);
  place(new THREE.Mesh(new THREE.PlaneGeometry(gW, gH), grilleMaterial(kit.p, gW, gH)), 0, gY, face + 0.03, g);

  // The speaker under the cloth: an ink ring and dust cap.
  const cone = place(new THREE.Group(), 0, gY, face + 0.035, g);
  cone.add(new THREE.Mesh(new THREE.RingGeometry(0.56, 0.62, 48), kit.mats.ink));
  cone.add(new THREE.Mesh(new THREE.RingGeometry(0.2, 0.25, 32), kit.mats.ink));

  // Rings that ripple off the grille when the signal arrives.
  const rings: THREE.Mesh[] = [];
  const ringGeo = new THREE.TorusGeometry(0.7, 0.04, 4, 48, Math.PI * 1.1).rotateZ(-Math.PI * 0.05);
  for (let i = 0; i < 3; i++) {
    const r = place(new THREE.Mesh(ringGeo, flatMaterial(kit.p.ink)), 0, gY, face + 0.2 + i * 0.01, g);
    r.visible = false;
    rings.push(r);
  }

  // Strap handle on top, between two ink caps.
  for (const s of [-1, 1]) place(new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.1, 0.3, 2, 0.03), kit.mats.ink), s * 0.5, H + 0.03, 0, g);
  const strap = new THREE.TorusGeometry(0.5, 0.055, 8, 28, Math.PI).scale(1, 0.32, 1);
  place(new THREE.Mesh(strap, kit.mats.ink), 0, H + 0.05, 0, g);

  // Corner protectors at the bottom.
  for (const s of [-1, 1]) place(new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.22, D + 0.04, 2, 0.05), kit.mats.ink), s * (W / 2 - 0.08), 0.1, 0, g);

  const anchor = place(new THREE.Object3D(), 0, H + 0.35, 0, g);
  return { group: g, cone, rings, pilot, jack, anchor };
}

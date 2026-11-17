// Carlos's real homelab, built from boxes: a 10-inch mini rack (router on
// a shelf, the switch, a brush panel, a power strip) with the UniFi access
// point on top, the Dell XPS tower and the Mac Studio beside it. Every surface is drawn with one
// tiny shader that writes "print data" instead of color:
//   r = how much ink this pixel wants (toon-stepped light, 0..1)
//   g = spot color: 1 flat marigold, 0.5 marigold dots, 0 none
//   b = object id (for ink outlines between parts)
//   a = 1 on the object, 0 on paper
// The halftone pass in print.ts turns that into ink on paper.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export type DeviceKey = 'xps' | 'ap' | 'switch' | 'router' | 'mac';

export type Server = {
  key: DeviceKey;
  label: string;
  group: THREE.Group;
  /** Body materials that get marigold dots when the box is pointed at. */
  bodies: THREE.ShaderMaterial[];
  leds: Led[];
  box: THREE.Box3; // in rack space
};

export type Led = { mat: THREE.ShaderMaterial; phase: number; rate: number; idle: boolean };

const LIGHT = new THREE.Vector3(-0.55, 0.75, 0.6).normalize();

const vert = /* glsl */ `
  varying vec3 vN;
  void main() {
    vN = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const frag = /* glsl */ `
  uniform float uBase;
  uniform float uAccent;
  uniform float uId;
  uniform float uFlat;
  uniform vec3 uLight;
  varying vec3 vN;
  void main() {
    float ndl = dot(normalize(vN), uLight);
    // Three toon steps: lit, half, shadow.
    float lit = ndl > 0.35 ? 1.0 : (ndl > -0.1 ? 0.8 : 0.58);
    float ink = mix(1.0 - (1.0 - uBase) * lit, uBase, uFlat);
    gl_FragColor = vec4(ink, uAccent, uId, 1.0);
  }
`;

const floorFrag = /* glsl */ `
  varying vec2 vUv;
  void main() {
    float d = length((vUv - 0.5) * 2.0);
    float shade = 0.6 * (1.0 - smoothstep(0.42, 1.0, d));
    // Writes alpha 0: the shadow is printed on paper, not on an object.
    gl_FragColor = vec4(shade, 0.0, 0.0, 0.0);
  }
`;

const floorVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const normalMaterial = new THREE.ShaderMaterial({
  vertexShader: /* glsl */ `
    varying vec3 vN;
    void main() {
      vN = normalize(normalMatrix * normal);
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: /* glsl */ `
    varying vec3 vN;
    void main() { gl_FragColor = vec4(normalize(vN) * 0.5 + 0.5, 1.0); }
  `,
  blending: THREE.NoBlending,
});

// Units: 1 = 10 cm, floor at y = 0, fronts face +z. Sizes follow the real
// machines so they sit right next to each other.
const U = 0.4445; // one rack unit
const FRONT = 1.15; // every front face lines up here

export const DEFAULT_LABELS: Record<DeviceKey, string> = {
  xps: 'Dell XPS 8930: hypervisor and NAS',
  ap: 'UniFi access point: powered by the switch',
  switch: 'Hasivo 8-port switch: 10 Gb / 2.5 Gb, powers the AP',
  router: 'Lenovo ThinkCentre Tiny: the router',
  mac: 'Mac Studio: runs the models and all my development',
};

export function buildRack(labels: Partial<Record<DeviceKey, string>> = {}) {
  const disposables: { dispose(): void }[] = [normalMaterial];
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const cyl = new THREE.CylinderGeometry(1, 1, 1, 24);
  disposables.push(unit, cyl);

  let nextId = 1;
  const mat = (base: number, accent = 0, flat = 0) => {
    const m = new THREE.ShaderMaterial({
      uniforms: {
        uBase: { value: base },
        uAccent: { value: accent },
        uId: { value: (nextId++ % 250) / 255 },
        uFlat: { value: flat },
        uLight: { value: LIGHT },
      },
      vertexShader: vert,
      fragmentShader: frag,
      blending: THREE.NoBlending,
    });
    disposables.push(m);
    return m;
  };

  const add = (
    parent: THREE.Object3D,
    geo: THREE.BufferGeometry,
    m: THREE.ShaderMaterial,
    [x, y, z]: number[],
    [sx, sy, sz]: number[] = [1, 1, 1],
  ) => {
    const mesh = new THREE.Mesh(geo, m);
    mesh.position.set(x, y, z);
    mesh.scale.set(sx, sy, sz);
    parent.add(mesh);
    return mesh;
  };
  const box = (parent: THREE.Object3D, base: number, pos: number[], size: number[], accent = 0) => {
    const m = mat(base, accent);
    add(parent, unit, m, pos, size);
    return m;
  };
  /** Many small boxes (vents, ports) as one mesh: [x, y, z, w, h, d][] */
  const many = (parent: THREE.Object3D, base: number, boxes: number[][]) => {
    const geos = boxes.map(([x, y, z, w, hh, d]) => new THREE.BoxGeometry(w, hh, d).translate(x, y, z));
    const geo = mergeGeometries(geos)!;
    geos.forEach((g) => g.dispose());
    disposables.push(geo);
    const m = mat(base);
    add(parent, geo, m, [0, 0, 0]);
    return m;
  };
  /** A round thing facing the viewer (buttons, jacks). */
  const knob = (parent: THREE.Object3D, base: number, pos: number[], r: number, depth = 0.04, accent = 0, flat = 0) => {
    const m = mat(base, accent, flat);
    const mesh = add(parent, cyl, m, pos, [r, depth, r]);
    mesh.rotation.x = Math.PI / 2;
    return m;
  };

  const rack = new THREE.Group();
  const servers: Server[] = [];
  const shadows: number[][] = []; // [x, z, w, d]

  const device = (key: DeviceKey, pos: number[], build: (g: THREE.Group, s: Server) => void) => {
    const g = new THREE.Group();
    g.position.set(pos[0], pos[1], pos[2]);
    rack.add(g);
    const s: Server = { key, label: labels[key] || DEFAULT_LABELS[key], group: g, bodies: [], leds: [], box: new THREE.Box3() };
    build(g, s);
    servers.push(s);
    return s;
  };
  const body = (g: THREE.Group, s: Server, base: number, pos: number[], size: number[]) => {
    const m = box(g, base, pos, size);
    s.bodies.push(m);
    return m;
  };
  const led = (g: THREE.Group, s: Server, pos: number[], idle = false, size = 0.06) => {
    const m = mat(0, 1, 1);
    add(g, unit, m, pos, [size, size * 0.8, 0.03]);
    s.leds.push({ mat: m, phase: Math.random() * 10, rate: 0.6 + Math.random() * 1.6, idle });
  };

  // ---- the 10-inch rack: 6U, open frame ---------------------------------
  const RW = 2.76; // outer width
  const RD = 2.3; // outer depth
  const railTop = 0.24 + 6 * U;
  const TOP = railTop + 0.2; // top of the top plate
  const slot = (n: number, size = 1) => railTop - (n - 1) * U - (size * U) / 2;
  const rz = FRONT - RD / 2; // rack centre z
  {
    const frame = mat(0.3);
    for (const x of [-1, 1])
      for (const z of [-1, 1]) {
        add(rack, unit, frame, [x * (RW / 2 - 0.07), (0.16 + TOP - 0.12) / 2, rz + z * (RD / 2 - 0.07)], [0.14, TOP - 0.28, 0.14]);
        knob(rack, 0.7, [x * (RW / 2 - 0.2), 0.04, rz + z * (RD / 2 - 0.2)], 0.1, 0.08);
      }
    box(rack, 0.2, [0, 0.14, rz], [RW, 0.1, RD]); // bottom plate
    box(rack, 0.12, [0, TOP - 0.06, rz], [RW, 0.12, RD]); // top plate
    // Front rails with their square holes, one pair per U.
    const holes: number[][] = [];
    for (const x of [-1, 1]) {
      add(rack, unit, frame, [x * 1.2, (0.2 + railTop) / 2, FRONT - 0.06], [0.18, railTop - 0.2, 0.06]);
      for (let i = 0; i < 6; i++) {
        holes.push([x * 1.2, slot(i + 1) + 0.12, FRONT - 0.02, 0.06, 0.06, 0.02]);
        holes.push([x * 1.2, slot(i + 1) - 0.12, FRONT - 0.02, 0.06, 0.06, 0.02]);
      }
    }
    many(rack, 0.9, holes);
    shadows.push([0, rz, RW + 0.9, RD + 0.9]);
  }
  /** A 10-inch faceplate with its ears, sitting on the rails. */
  const faceplate = (parent: THREE.Object3D, base: number, y: number, size = 1) => {
    const m = box(parent, base, [0, y, FRONT + 0.02], [2.54, size * U - 0.02, 0.05]);
    many(parent, 0.75, [-1, 1].flatMap((x) => [[x * 1.2, y + (size * U) / 2 - 0.1, FRONT + 0.05, 0.08, 0.05, 0.02], [x * 1.2, y - (size * U) / 2 + 0.1, FRONT + 0.05, 0.08, 0.05, 0.02]]));
    return m;
  };

  // U2: brush panel under the switch. The patch cables dive through it.
  const brushY = slot(2);
  faceplate(rack, 0.15, brushY);
  box(rack, 0.88, [0, brushY, FRONT + 0.05], [1.9, 0.13, 0.03]);

  // U1: the Hasivo switch, 8 ports.
  const switchY = slot(1);
  const ports: THREE.Vector3[] = [];
  device('switch', [0, switchY, 0], (g, s) => {
    body(g, s, 0.25, [0, 0, FRONT - 0.8], [2.2, U - 0.04, 1.6]);
    s.bodies.push(faceplate(g, 0.42, 0));
    const holes: number[][] = [];
    for (let i = 0; i < 8; i++) {
      const x = -0.5 + i * 0.19;
      holes.push([x, -0.04, FRONT + 0.05, 0.15, 0.13, 0.02]);
      led(g, s, [x, 0.11, FRONT + 0.05], i % 3 === 1, 0.06);
      ports.push(new THREE.Vector3(x, switchY - 0.04, FRONT + 0.06));
    }
    many(g, 0.95, holes);
    led(g, s, [-0.95, 0.06, FRONT + 0.05], true, 0.05);
  });

  // U3-4: a shelf, and the ThinkCentre Tiny lying on it.
  const shelfY = slot(3, 2) - U + 0.03;
  box(rack, 0.15, [0, shelfY, FRONT - 1.0], [2.36, 0.04, 2.0]);
  box(rack, 0.15, [0, shelfY + 0.06, FRONT - 0.02], [2.54, 0.14, 0.04]); // lip
  const tinyH = 0.345;
  device('router', [0, shelfY + 0.02 + tinyH / 2, FRONT - 0.15 - 0.915], (g, s) => {
    body(g, s, 0.35, [0, 0, 0], [1.79, tinyH, 1.83]);
    const front = 0.915;
    s.bodies.push(box(g, 0.3, [0, 0, front + 0.01], [1.75, tinyH - 0.05, 0.02]));
    knob(g, 0.15, [-0.72, 0.03, front + 0.03], 0.055, 0.03);
    // USB ports and the headset jack on the left, a vent on the right.
    many(g, 0.95, [
      [-0.5, 0.05, front + 0.03, 0.13, 0.05, 0.02],
      [-0.32, 0.05, front + 0.03, 0.13, 0.05, 0.02],
      [-0.5, -0.06, front + 0.03, 0.06, 0.06, 0.02],
      ...Array.from({ length: 14 }, (_, i) => [0.18 + i * 0.045, 0, front + 0.03, 0.022, 0.2, 0.02]),
    ]);
    led(g, s, [-0.72, -0.09, front + 0.03], true, 0.04);
  });

  // U5: a vented blank. U6: the power strip.
  const blankY = slot(5);
  faceplate(rack, 0.12, blankY);
  many(rack, 0.8, Array.from({ length: 12 }, (_, i) => [-0.77 + i * 0.14, blankY, FRONT + 0.05, 0.05, 0.22, 0.02]));
  const pduY = slot(6);
  box(rack, 0.2, [0, pduY, FRONT - 0.4], [2.2, U - 0.06, 0.8]);
  faceplate(rack, 0.18, pduY);
  box(rack, 0, [-0.85, pduY, FRONT + 0.06], [0.16, 0.2, 0.04], 1); // lit rocker
  for (let i = 0; i < 4; i++) {
    const x = -0.45 + i * 0.36;
    box(rack, 0.08, [x, pduY, FRONT + 0.05], [0.26, 0.26, 0.03]);
    many(rack, 0.95, [
      [x - 0.05, pduY + 0.03, FRONT + 0.07, 0.03, 0.08, 0.02],
      [x + 0.05, pduY + 0.03, FRONT + 0.07, 0.03, 0.08, 0.02],
      [x, pduY - 0.07, FRONT + 0.07, 0.04, 0.04, 0.02],
    ]);
  }

  // ---- UniFi access point on a little angled stand on top ---------------
  const apTilt = 1.05; // radians back from flat: the face looks at you
  const apPos = new THREE.Vector3(0, TOP + 0.95, rz - 0.15);
  device('ap', [apPos.x, apPos.y, apPos.z], (g, s) => {
    const stand = mat(0.5);
    add(g, unit, stand, [0, -0.5, -0.14], [0.18, 0.8, 0.18]);
    add(g, unit, stand, [0, -0.9, -0.1], [0.7, 0.06, 0.55]);
    const puck = new THREE.Group();
    puck.rotation.x = apTilt;
    g.add(puck);
    const profile = [
      [0, 0], [0.62, 0], [0.76, 0.03], [0.8, 0.11], [0.78, 0.2], [0.68, 0.27], [0.5, 0.3], [0, 0.3],
    ].map(([x, y]) => new THREE.Vector2(x, y - 0.15));
    const shell = new THREE.LatheGeometry(profile, 40);
    disposables.push(shell);
    const sm = mat(0.04);
    s.bodies.push(sm);
    add(puck, shell, sm, [0, 0, 0]);
    // The light ring, steady marigold.
    const ring = new THREE.TorusGeometry(0.4, 0.035, 8, 48);
    disposables.push(ring);
    const rm = mat(0, 1, 1);
    const r = add(puck, ring, rm, [0, 0.155, 0]);
    r.rotation.x = Math.PI / 2;
    s.leds.push({ mat: rm, phase: 0, rate: 0.3, idle: false });
  });

  // ---- Dell XPS 8930: mid tower standing to the left --------------------
  const T = { w: 1.75, h: 3.86, d: 4.3 };
  const tx = -RW / 2 - 0.85 - T.w / 2;
  device('xps', [tx, 0, FRONT - T.d / 2], (g, s) => {
    const front = T.d / 2;
    body(g, s, 0.32, [0, T.h / 2 + 0.06, 0], [T.w, T.h - 0.12, T.d]);
    s.bodies.push(box(g, 0.16, [0, T.h / 2 + 0.06, front + 0.03], [T.w - 0.04, T.h - 0.16, 0.06]));
    many(g, 0.8, [
      [-0.3, 0.03, -front + 0.4, 0.3, 0.06, 0.3],
      [0.3, 0.03, -front + 0.4, 0.3, 0.06, 0.3],
      [-0.3, 0.03, front - 0.4, 0.3, 0.06, 0.3],
      [0.3, 0.03, front - 0.4, 0.3, 0.06, 0.3],
    ]);
    const f = front + 0.07;
    // Optical bay, then the front ports and card slot.
    box(g, 0.3, [0, 3.45, f], [1.3, 0.22, 0.02]);
    box(g, 0.95, [0, 3.38, f + 0.01], [0.9, 0.03, 0.02]);
    many(g, 0.95, [
      [-0.45, 3.0, f, 0.16, 0.06, 0.02],
      [-0.2, 3.0, f, 0.16, 0.06, 0.02],
      [0.05, 3.0, f, 0.16, 0.06, 0.02],
      [0.35, 3.0, f, 0.24, 0.035, 0.02],
      [0.6, 3.0, f, 0.06, 0.06, 0.02],
    ]);
    // The perforated lower front.
    const vents: number[][] = [];
    for (let r = 0; r < 14; r++)
      for (let c = 0; c < 7; c++) vents.push([-0.6 + c * 0.2 + (r % 2) * 0.1 - 0.05, 0.55 + r * 0.16, f, 0.1, 0.07, 0.02]);
    many(g, 0.85, vents);
    knob(g, 0.12, [0, 3.72, f], 0.09, 0.04);
    led(g, s, [0, 3.72, f + 0.03], true, 0.05);
    led(g, s, [0.7, 3.0, f + 0.01], false, 0.04);
  });
  shadows.push([tx, FRONT - T.d / 2, T.w + 1.1, T.d + 0.9]);

  // ---- Mac Studio: squat aluminium box to the right ---------------------
  const mx = RW / 2 + 0.85 + 1.97 / 2;
  device('mac', [mx, 0, FRONT - 1.97 / 2], (g, s) => {
    const shell = new RoundedBoxGeometry(1.97, 0.87, 1.97, 6, 0.16);
    disposables.push(shell);
    const sm = mat(0.06);
    s.bodies.push(sm);
    add(g, shell, sm, [0, 0.08 + 0.435, 0]);
    // The vented ring it stands on.
    const ring = mat(0.7);
    add(g, cyl, ring, [0, 0.05, 0], [0.84, 0.1, 0.84]);
    const f = 0.985;
    // Two USB-C ports and the SD slot on the right, power light on the left.
    many(g, 0.9, [
      [0.12, 0.33, f, 0.1, 0.04, 0.02],
      [0.3, 0.33, f, 0.1, 0.04, 0.02],
      [0.6, 0.33, f, 0.3, 0.03, 0.02],
    ]);
    led(g, s, [-0.72, 0.3, f], true, 0.035);
  });
  shadows.push([mx, FRONT - 1.97 / 2, 3.0, 3.0]);

  // ---- cables -------------------------------------------------------------
  // Each patch lead leaves a switch port, drops through the brush panel
  // and runs out the back of the rack to its machine.
  const cable = (port: number, rest: number[][], r = 0.03, base = 0.03, accent = 0) => {
    const p = ports[port];
    const pts = [
      p.clone(),
      new THREE.Vector3(p.x, p.y - 0.06, p.z + 0.1),
      new THREE.Vector3(p.x * 0.95, brushY + 0.06, FRONT + 0.16),
      new THREE.Vector3(p.x * 0.9, brushY, FRONT + 0.03),
      new THREE.Vector3(p.x * 0.85, brushY, FRONT - 0.35),
      ...rest.map(([x, y, z]) => new THREE.Vector3(x, y, z)),
    ];
    const geo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 120, r, 8, false);
    disposables.push(geo);
    add(rack, geo, mat(accent ? 0 : base, accent, accent), [0, 0, 0]);
  };
  const back = rz - RD / 2;
  const tBack = FRONT - T.d;
  // To the tower: down the back of the rack, across the floor.
  cable(0, [
    [-0.7, brushY - 0.05, back + 0.2],
    [-1.05, brushY - 0.3, back - 0.15],
    [-1.35, 0.9, back - 0.1],
    [-1.6, 0.04, back + 0.5],
    [-1.95, 0.04, back + 1.1],
    [tx + T.w / 2 + 0.15, 0.04, back + 0.4],
    [tx + T.w / 2 + 0.12, 0.04, tBack + 0.3],
    [tx + 0.3, 0.9, tBack - 0.12],
    [tx + 0.1, 1.4, tBack + 0.05],
  ]);
  // To the router on the shelf below.
  cable(2, [
    [-0.15, brushY - 0.05, back + 0.4],
    [-0.1, shelfY + 0.3, back + 0.2],
    [0, shelfY + 0.2, FRONT - 0.15 - 1.83 - 0.05],
  ]);
  // To the Mac Studio.
  cable(5, [
    [0.7, brushY - 0.05, back + 0.2],
    [1.05, brushY - 0.3, back - 0.15],
    [1.35, 0.8, back - 0.1],
    [1.6, 0.04, back + 0.6],
    [mx - 1.1, 0.04, back + 0.9],
    [mx - 0.6, 0.04, FRONT - 1.97 - 0.25],
    [mx - 0.2, 0.35, FRONT - 1.97 - 0.05],
  ]);
  // PoE, in marigold: up the back of the rack to the access point.
  {
    const apBack = new THREE.Vector3(0, -0.16, 0.1).applyAxisAngle(new THREE.Vector3(1, 0, 0), apTilt).add(apPos);
    cable(7, [
      [0.75, brushY - 0.05, back + 0.3],
      [0.95, brushY + 0.2, back - 0.12],
      [0.9, TOP + 0.08, back - 0.12],
      [0.55, TOP + 0.12, back + 0.25],
      [apBack.x + 0.12, apBack.y - 0.15, apBack.z - 0.35],
      [apBack.x, apBack.y, apBack.z - 0.05],
    ], 0.04, 0, 1);
  }
  // The power strip's lead, off the floor to the wall.
  {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.6, pduY, back + 0.4),
      new THREE.Vector3(0.8, pduY - 0.1, back - 0.2),
      new THREE.Vector3(0.9, 0.04, back - 0.5),
      new THREE.Vector3(0.6, 0.04, back - 1.6),
    ]);
    const geo = new THREE.TubeGeometry(curve, 40, 0.045, 8, false);
    disposables.push(geo);
    add(rack, geo, mat(0.3), [0, 0, 0]);
  }

  // ---- floor shadows, printed on the paper ----------------------------------
  const floorGeo = new THREE.PlaneGeometry(1, 1);
  const floorMat = new THREE.ShaderMaterial({
    vertexShader: floorVert,
    fragmentShader: floorFrag,
    blending: THREE.NoBlending,
  });
  disposables.push(floorGeo, floorMat);
  shadows.forEach(([x, z, w, d], i) => {
    const f = new THREE.Mesh(floorGeo, floorMat);
    f.rotation.x = -Math.PI / 2;
    f.position.set(x, 0.002 + i * 0.001, z);
    f.scale.set(w, d, 1);
    rack.add(f);
  });

  // Recentre on the machines so the camera can frame them.
  rack.updateMatrixWorld(true);
  const bounds = new THREE.Box3();
  for (const s of servers) bounds.union(new THREE.Box3().setFromObject(s.group));
  const centre = bounds.getCenter(new THREE.Vector3());
  rack.children.forEach((c) => {
    c.position.x -= centre.x;
    c.position.z -= centre.z;
  });
  bounds.translate(new THREE.Vector3(-centre.x, 0, -centre.z));
  rack.updateMatrixWorld(true);

  // Bounding boxes in rack space, for captions and focus targets. Only the
  // front 40 cm of the deep tower counts, so its target hugs what you see.
  const inv = new THREE.Matrix4().copy(rack.matrixWorld).invert();
  for (const s of servers) {
    s.box.setFromObject(s.group).applyMatrix4(inv);
    s.box.min.z = Math.max(s.box.min.z, s.box.max.z - 2.2);
    s.group.traverse((o) => (o.userData.server = s));
  }
  // Keyboard order follows the picture, left to right, top to bottom.
  const order: DeviceKey[] = ['xps', 'ap', 'switch', 'router', 'mac'];
  servers.sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));

  return {
    rack,
    servers,
    size: bounds.getSize(new THREE.Vector3()),
    centreY: bounds.getCenter(new THREE.Vector3()).y,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}

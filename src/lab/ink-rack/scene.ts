// The homelab rack, built from boxes. Every surface is drawn with one
// tiny shader that writes "print data" instead of color:
//   r = how much ink this pixel wants (toon-stepped light, 0..1)
//   g = spot color: 1 flat marigold, 0.5 marigold dots, 0 none
//   b = object id (for ink outlines between parts)
//   a = 1 on the object, 0 on paper
// The halftone pass in print.ts turns that into ink on paper.
import * as THREE from 'three';

export type Server = {
  key: string;
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
    vec2 p = (vUv - 0.5) * vec2(1.0, 1.7);
    float d = length(p);
    float shade = 0.62 * (1.0 - smoothstep(0.18, 0.5, d));
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

export function buildRack() {
  const disposables: { dispose(): void }[] = [normalMaterial];
  const unit = new THREE.BoxGeometry(1, 1, 1);
  const cyl = new THREE.CylinderGeometry(1, 1, 1, 20);
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
    [sx, sy, sz]: number[],
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

  const rack = new THREE.Group();
  const servers: Server[] = [];

  // ---- frame -------------------------------------------------------
  const H = 2.2;
  const postMat = mat(0.32);
  for (const x of [-0.56, 0.56])
    for (const z of [-0.42, 0.42]) add(rack, unit, postMat, [x, H / 2, z], [0.07, H, 0.07]);
  box(rack, 0.2, [0, H + 0.03, 0], [1.22, 0.06, 0.94]);
  box(rack, 0.35, [0, 0.07, 0], [1.22, 0.06, 0.94]);
  const casterMat = mat(0.8);
  for (const x of [-0.5, 0.5])
    for (const z of [-0.36, 0.36]) add(rack, cyl, casterMat, [x, 0.025, z], [0.045, 0.05, 0.045]);

  // A shelf for the router, which was never meant to be rack mounted.
  box(rack, 0.25, [0, 1.6, 0], [1.08, 0.025, 0.8]);

  const server = (key: string, label: string, y: number, build: (g: THREE.Group, s: Server) => void) => {
    const g = new THREE.Group();
    g.position.y = y;
    rack.add(g);
    const s: Server = { key, label, group: g, bodies: [], leds: [], box: new THREE.Box3() };
    build(g, s);
    servers.push(s);
    return s;
  };
  const body = (g: THREE.Group, s: Server, base: number, pos: number[], size: number[]) => {
    const m = box(g, base, pos, size);
    s.bodies.push(m);
    return m;
  };
  const led = (g: THREE.Group, s: Server, pos: number[], idle = false, size = 0.028) => {
    const m = mat(0, 1, 1);
    add(g, unit, m, pos, [size, size, 0.02]);
    s.leds.push({ mat: m, phase: Math.random() * 10, rate: 0.6 + Math.random() * 1.6, idle });
  };

  // ---- UPS (2U, bottom) -------------------------------------------
  server('ups', 'TK The UPS', 0.25, (g, s) => {
    body(g, s, 0.12, [0, 0, 0], [0.94, 0.24, 0.7]);
    box(g, 0.75, [-0.18, 0.02, 0.355], [0.36, 0.13, 0.02]); // display bezel
    const screen = mat(0.05, 1, 1);
    add(g, unit, screen, [-0.18, 0.02, 0.368], [0.3, 0.08, 0.01]);
    for (const x of [0.14, 0.24, 0.34]) {
      const b = mat(0.7);
      const m = add(g, cyl, b, [x, 0.0, 0.36], [0.025, 0.03, 0.025]);
      m.rotation.x = Math.PI / 2;
    }
    led(g, s, [0.34, 0.075, 0.36], true);
  });

  // ---- the box nobody wanted (1U, crooked) -------------------------
  server('old', 'TK The box nobody wanted', 0.47, (g, s) => {
    g.rotation.z = 0.03;
    g.position.x = -0.02;
    body(g, s, 0.2, [0, 0, 0.02], [0.88, 0.11, 0.66]);
    for (let i = 0; i < 5; i++) box(g, 0.85, [0.06 + i * 0.06, 0, 0.36], [0.025, 0.06, 0.01]);
    led(g, s, [-0.36, 0.012, 0.36]);
    led(g, s, [-0.3, 0.012, 0.36], true);
  });

  // ---- the model box (3U, deep, sticks out) ------------------------
  server('gpu', 'TK The model box', 0.8, (g, s) => {
    body(g, s, 0.4, [0, 0, 0.07], [1.0, 0.38, 0.92]);
    // grille
    for (let i = 0; i < 6; i++) box(g, 0.95, [-0.22, 0.13 - i * 0.052, 0.535], [0.42, 0.02, 0.01]);
    // fan: ring, hub, blades
    const ring = new THREE.TorusGeometry(0.13, 0.022, 10, 36);
    disposables.push(ring);
    const rm = mat(0.2);
    s.bodies.push(rm);
    add(g, ring, rm, [0.26, 0, 0.54], [1, 1, 1]);
    const fan = new THREE.Group();
    fan.position.set(0.26, 0, 0.54);
    g.add(fan);
    const hub = add(fan, cyl, mat(0.15), [0, 0, 0], [0.035, 0.03, 0.035]);
    hub.rotation.x = Math.PI / 2;
    const bladeMat = mat(0.1);
    for (let i = 0; i < 5; i++) {
      const b = add(fan, unit, bladeMat, [0, 0, 0], [0.1, 0.035, 0.01]);
      const a = (i / 5) * Math.PI * 2;
      b.position.set(Math.cos(a) * 0.065, Math.sin(a) * 0.065, 0);
      b.rotation.z = a + 0.5;
    }
    g.userData.fan = fan;
    led(g, s, [-0.44, 0.15, 0.535], true);
    led(g, s, [-0.44, 0.1, 0.535]);
    led(g, s, [-0.44, 0.05, 0.535]);
  });

  // ---- file server (2U, drive bays) ---------------------------------
  server('nas', 'TK The file server', 1.2, (g, s) => {
    body(g, s, 0.18, [0, 0, 0], [1.0, 0.25, 0.76]);
    for (let i = 0; i < 4; i++) {
      const x = -0.16 + i * 0.205;
      box(g, 0.45, [x, -0.01, 0.39], [0.18, 0.2, 0.03]);
      box(g, 0.9, [x, -0.07, 0.41], [0.12, 0.025, 0.02]); // handle
      led(g, s, [x + 0.06, 0.065, 0.41], i === 1);
    }
    const p = mat(0.75);
    const pb = add(g, cyl, p, [-0.42, 0.04, 0.39], [0.03, 0.03, 0.03]);
    pb.rotation.x = Math.PI / 2;
    led(g, s, [-0.42, -0.05, 0.39]);
  });

  // ---- tired switch (1U) -------------------------------------------
  const ports: THREE.Vector3[] = [];
  server('switch', 'TK The tired switch', 1.46, (g, s) => {
    body(g, s, 0.45, [0, 0, 0], [1.0, 0.11, 0.5]);
    const portMat = mat(0.95);
    for (let i = 0; i < 8; i++) {
      const x = -0.05 + i * 0.07;
      add(g, unit, portMat, [x, -0.015, 0.255], [0.045, 0.04, 0.02]);
      led(g, s, [x, 0.03, 0.255], i % 3 === 0, 0.02);
      ports.push(new THREE.Vector3(x, 1.46 - 0.015, 0.27));
    }
    led(g, s, [-0.4, 0, 0.255], true);
  });

  // ---- router (on the shelf, with antennas) --------------------------
  server('router', 'TK The router', 1.66, (g, s) => {
    g.rotation.y = -0.08;
    g.position.x = -0.15;
    body(g, s, 0.1, [0, 0, 0], [0.5, 0.09, 0.42]);
    const antMat = mat(0.6);
    s.bodies.push(antMat);
    for (const [x, tilt] of [
      [-0.19, 0.28],
      [0.19, -0.2],
    ]) {
      const a = add(g, cyl, antMat, [x + tilt * 0.38, 0.22, -0.17], [0.018, 0.4, 0.018]);
      a.rotation.z = tilt;
    }
    for (let i = 0; i < 3; i++) led(g, s, [-0.16 + i * 0.07, 0, 0.215], i === 0, 0.022);
  });

  // ---- an espresso cup on top, obviously -----------------------------
  const cupMat = mat(0.05);
  add(rack, cyl, cupMat, [0.3, H + 0.11, 0.15], [0.07, 0.11, 0.07]);
  const handle = new THREE.TorusGeometry(0.035, 0.011, 8, 18);
  disposables.push(handle);
  const h = add(rack, handle, cupMat, [0.385, H + 0.11, 0.15], [1, 1, 1]);
  h.rotation.y = 0.2;
  add(rack, cyl, mat(0.3), [0.3, H + 0.065, 0.15], [0.11, 0.012, 0.11]); // saucer

  // ---- cables -------------------------------------------------------
  // Patch cables leave the switch ports and droop around the left post.
  const cableTo = [
    { y: 1.66, z: 0.2, port: 0, sag: 0.06 }, // router (goes up)
    { y: 1.2, z: 0.25, port: 2, sag: 0.08 },
    { y: 0.85, z: 0.3, port: 3, sag: 0.12 },
    { y: 0.47, z: 0.2, port: 5, sag: 0.2 },
    { y: 0.95, z: 0.1, port: 6, sag: 0.16 },
  ];
  cableTo.forEach((c, i) => {
    const p = ports[c.port];
    const up = c.y > p.y;
    const pts = [
      p.clone(),
      new THREE.Vector3(p.x, p.y - 0.04, p.z + 0.08),
      new THREE.Vector3(p.x * 0.4 - 0.2, p.y - c.sag, 0.4 + i * 0.02),
      new THREE.Vector3(-0.58, (p.y + c.y) / 2 - (up ? 0 : c.sag), 0.44),
      new THREE.Vector3(-0.64, c.y, c.z),
      new THREE.Vector3(-0.6, c.y - 0.02, -0.2),
    ];
    const curve = new THREE.CatmullRomCurve3(pts);
    const geo = new THREE.TubeGeometry(curve, 64, i === 2 ? 0.02 : 0.013, 8, false);
    disposables.push(geo);
    add(rack, geo, mat(i === 2 ? 0 : 0.08, i === 2 ? 1 : 0), [0, 0, 0], [1, 1, 1]);
  });
  // One fat power lead from the UPS, sagging on the floor.
  {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0.38, 0.22, 0.36),
      new THREE.Vector3(0.5, 0.12, 0.6),
      new THREE.Vector3(0.75, 0.02, 0.65),
      new THREE.Vector3(1.05, 0.02, 0.3),
    ]);
    const geo = new THREE.TubeGeometry(curve, 40, 0.024, 8, false);
    disposables.push(geo);
    add(rack, geo, mat(0.3), [0, 0, 0], [1, 1, 1]);
  }

  // ---- floor shadow -----------------------------------------------
  const floorGeo = new THREE.PlaneGeometry(2.6, 2.6);
  const floorMat = new THREE.ShaderMaterial({
    vertexShader: floorVert,
    fragmentShader: floorFrag,
    blending: THREE.NoBlending,
  });
  disposables.push(floorGeo, floorMat);
  const floor = new THREE.Mesh(floorGeo, floorMat);
  floor.rotation.x = -Math.PI / 2;
  floor.position.set(0.18, 0, 0.12);
  rack.add(floor);

  // Bounding boxes in rack space, for captions and focus targets.
  rack.updateMatrixWorld(true);
  const inv = new THREE.Matrix4().copy(rack.matrixWorld).invert();
  for (const s of servers) {
    s.box.setFromObject(s.group).applyMatrix4(inv);
    s.group.traverse((o) => (o.userData.server = s));
  }

  return {
    rack,
    servers,
    dispose: () => disposables.forEach((d) => d.dispose()),
  };
}

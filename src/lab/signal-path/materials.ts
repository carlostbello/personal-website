// Comic materials: flat fills with halftone-dot shading, inverted-hull
// ink outlines with a constant on-screen width, and a halftone floor
// that only shows where things cast shadow.
import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export interface Palette {
  field: THREE.Color;
  fieldDeep: THREE.Color;
  ink: THREE.Color;
  accent: THREE.Color;
  page: THREE.Color;
}

export function readPalette(): Palette {
  const css = getComputedStyle(document.documentElement);
  // Parsed as-is (no sRGB to linear conversion) so the flat fills match
  // the CSS tokens exactly, without touching three's global color
  // management that other scenes on the page may rely on.
  const get = (name: string, fallback: string) =>
    new THREE.Color().setStyle(css.getPropertyValue(name).trim() || fallback, THREE.LinearSRGBColorSpace);
  return {
    field: get('--field', '#3b5a8c'),
    fieldDeep: get('--field-deep', '#2b4470'),
    ink: get('--ink', '#0b0b0c'),
    accent: get('--accent', '#f3b53f'),
    page: get('--page', '#ffffff'),
  };
}

/** Shared uniforms: device-pixel sizes that change with the viewport. */
export const shared = {
  uRes: { value: new THREE.Vector2(1, 1) },
  uOutline: { value: 2.5 },
  uDot: { value: 7 },
};

// Light direction in view space: upper left, toward the viewer.
const LIGHT = new THREE.Vector3(-0.5, 0.55, 0.75).normalize();

const halftone = /* glsl */ `
  float halftone(float dark, vec2 frag, float size) {
    vec2 p = mat2(0.7071, -0.7071, 0.7071, 0.7071) * frag / size;
    vec2 c = fract(p) - 0.5;
    float r = length(c);
    float R = sqrt(clamp(dark, 0.0, 1.0)) * 0.66;
    float aa = fwidth(r) * 0.8;
    return (1.0 - smoothstep(R - aa, R + aa, r)) * step(0.02, dark);
  }
`;

export function toonMaterial(color: THREE.Color, shade: THREE.Color, strength = 1): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: color },
      uShade: { value: shade },
      uLight: { value: LIGHT },
      uStrength: { value: strength },
      uDot: shared.uDot,
    },
    vertexShader: /* glsl */ `
      varying vec3 vN;
      void main() {
        vN = normalize(normalMatrix * normal);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform vec3 uShade;
      uniform vec3 uLight;
      uniform float uStrength;
      uniform float uDot;
      varying vec3 vN;
      ${halftone}
      void main() {
        float ndl = dot(normalize(vN), uLight);
        // Two flat tones: lit, and a halftone shadow that thickens as
        // the surface turns away.
        float dark = ndl > 0.3 ? 0.0 : clamp(0.3 + (0.3 - ndl) * 0.6, 0.0, 1.0) * uStrength;
        float m = halftone(dark, gl_FragCoord.xy, uDot);
        gl_FragColor = vec4(mix(uColor, uShade, m), 1.0);
      }
    `,
  });
}

export function flatMaterial(color: THREE.Color): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ color });
}

export function outlineMaterial(ink: THREE.Color): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uInk: { value: ink }, uRes: shared.uRes, uPx: shared.uOutline },
    side: THREE.BackSide,
    vertexShader: /* glsl */ `
      uniform vec2 uRes;
      uniform float uPx;
      void main() {
        vec4 clip = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        vec3 vn = normalize(normalMatrix * normal);
        vec2 dir = (projectionMatrix * vec4(vn, 0.0)).xy;
        float l = length(dir);
        dir = l > 1e-5 ? dir / l : vec2(0.0);
        clip.xy += dir * uPx * 2.0 / uRes * clip.w;
        gl_Position = clip;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uInk;
      void main() { gl_FragColor = vec4(uInk, 1.0); }
    `,
  });
}

/** Smooth-normal copy of a geometry, so the hull has no cracks at corners. */
const hulls = new WeakMap<THREE.BufferGeometry, THREE.BufferGeometry>();
export function hullOf(geo: THREE.BufferGeometry): THREE.BufferGeometry {
  let h = hulls.get(geo);
  if (h) return h;
  const copy = new THREE.BufferGeometry();
  copy.setAttribute('position', geo.getAttribute('position').clone());
  if (geo.index) copy.setIndex(geo.index.clone());
  h = mergeVertices(copy, 1e-3);
  h.computeVertexNormals();
  copy.dispose();
  hulls.set(geo, h);
  return h;
}

/** Floor: white, with halftone shadows under the gear. */
export function floorMaterial(dots: THREE.Color, blobs: THREE.Vector4[]): THREE.ShaderMaterial {
  const list = blobs.slice(0, 10);
  while (list.length < 10) list.push(new THREE.Vector4(0, 0, 0, 0));
  return new THREE.ShaderMaterial({
    uniforms: { uDots: { value: dots }, uBlobs: { value: list }, uDot: shared.uDot },
    transparent: true,
    depthWrite: false,
    vertexShader: /* glsl */ `
      varying vec2 vXZ;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vXZ = w.xz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uDots;
      uniform vec4 uBlobs[10];
      uniform float uDot;
      varying vec2 vXZ;
      ${halftone}
      void main() {
        float dark = 0.0;
        for (int i = 0; i < 10; i++) {
          vec4 b = uBlobs[i];
          if (b.z <= 0.0) continue;
          float d = length((vXZ - b.xy) / b.zw);
          dark = max(dark, (1.0 - smoothstep(0.35, 1.0, d)) * 0.75);
        }
        float m = halftone(dark, gl_FragCoord.xy, uDot);
        if (m < 0.01) discard;
        gl_FragColor = vec4(uDots, m);
      }
    `,
  });
}

/** The cable: ink, with marigold signal flowing behind the pulse. */
export function cableMaterial(p: Palette, length: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uInk: { value: p.ink },
      uAccent: { value: p.accent },
      uHead: { value: 0 },
      uPulses: { value: [-1, -1, -1, -1] },
      uTime: { value: 0 },
      uLen: { value: length },
    },
    vertexShader: /* glsl */ `
      varying float vU;
      void main() {
        vU = uv.x;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uInk;
      uniform vec3 uAccent;
      uniform float uHead;
      uniform float uPulses[4];
      uniform float uTime;
      uniform float uLen;
      varying float vU;
      void main() {
        float s = vU * uLen;
        float lit = 0.0;
        // Signal already through: marigold dashes running downstream.
        if (vU < uHead) lit = step(0.62, fract(s * 1.2 - uTime * 2.2));
        // The pulse head itself is solid.
        if (abs(s - uHead * uLen) < 0.32 && uHead > 0.0 && uHead < 1.0) lit = 1.0;
        for (int i = 0; i < 4; i++) {
          float pu = uPulses[i];
          if (pu >= 0.0 && abs(s - pu * uLen) < 0.5) lit = 1.0;
        }
        gl_FragColor = vec4(mix(uInk, uAccent, lit), 1.0);
      }
    `,
  });
}

/** A string that can vibrate: a standing wave along its length. */
export function stringMaterial(ink: THREE.Color): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uInk: { value: ink }, uAmp: { value: 0 }, uPhase: { value: 0 }, uLen: { value: 1 } },
    vertexShader: /* glsl */ `
      uniform float uAmp;
      uniform float uPhase;
      uniform float uLen;
      void main() {
        vec3 p = position;
        float v = p.y / uLen + 0.5;
        p.x += uAmp * sin(3.14159 * v) * sin(uPhase);
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uInk;
      void main() { gl_FragColor = vec4(uInk, 1.0); }
    `,
  });
}

/** Grille cloth: white with a fine blue basket weave. */
export function grilleMaterial(p: Palette, w: number, h: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: { uPage: { value: p.page }, uWeave: { value: p.field }, uSize: { value: new THREE.Vector2(w, h) } },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() {
        vUv = uv;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uPage;
      uniform vec3 uWeave;
      uniform vec2 uSize;
      varying vec2 vUv;
      float line(float v) {
        float f = abs(fract(v) - 0.5);
        float aa = fwidth(v) * 0.9;
        return 1.0 - smoothstep(0.08 - aa, 0.08 + aa, f);
      }
      void main() {
        vec2 p = vUv * uSize * 7.0;
        float m = max(line(p.x + p.y), line(p.x - p.y)) * 0.85;
        gl_FragColor = vec4(mix(uPage, uWeave, m), 1.0);
      }
    `,
  });
}

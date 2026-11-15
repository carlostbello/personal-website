// The print pass: reads the "print data" targets and lays down ink the
// way a comic printer would. Ink outlines from id/normal breaks, a black
// halftone screen whose dots grow with shadow, a marigold spot plate, and
// a pale blue Ben-Day screen on the paper around the rack.
import * as THREE from 'three';

const hex = (v: string) => new THREE.Color().setStyle(v, THREE.NoColorSpace);

export function printMaterial(colors: { ink: string; page: string; accent: string; field: string }) {
  return new THREE.ShaderMaterial({
    uniforms: {
      tColor: { value: null },
      tNormal: { value: null },
      uRes: { value: new THREE.Vector2(1, 1) },
      uCell: { value: 12 },
      uAngle: { value: 0.785 },
      uLine: { value: 3 },
      uBoil: { value: 0 },
      uInk: { value: hex(colors.ink) },
      uPage: { value: hex(colors.page) },
      uAccent: { value: hex(colors.accent) },
      uField: { value: hex(colors.field) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      void main() { vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }
    `,
    fragmentShader: /* glsl */ `
      uniform sampler2D tColor;
      uniform sampler2D tNormal;
      uniform vec2 uRes;
      uniform float uCell;
      uniform float uAngle;
      uniform float uLine;
      uniform float uBoil;
      uniform vec3 uInk;
      uniform vec3 uPage;
      uniform vec3 uAccent;
      uniform vec3 uField;
      varying vec2 vUv;

      float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

      // Coverage of a round dot screen at a given angle and density.
      float screen(vec2 px, float angle, float cell, float d) {
        if (d < 0.02) return 0.0;
        float c = cos(angle), s = sin(angle);
        vec2 p = mat2(c, -s, s, c) * px / cell;
        float dist = length(fract(p) - 0.5) * cell;
        float r = sqrt(d) * 0.74 * cell;
        return 1.0 - smoothstep(r - 0.9, r + 0.9, dist);
      }

      void main() {
        vec4 c0 = texture2D(tColor, vUv);
        vec3 n0 = texture2D(tNormal, vUv).xyz * 2.0 - 1.0;
        vec2 px = gl_FragCoord.xy;

        // Hand-inked lines: the sampling radius wobbles a little, re-rolled
        // at ~8fps (uBoil) like the boiling panel borders.
        float wob = 0.75 + 0.5 * hash(floor(px / 18.0) + uBoil);
        float r = uLine * wob;
        float edge = 0.0;
        for (int i = 0; i < 8; i++) {
          float a = float(i) * 0.785398;
          vec2 dir = vec2(cos(a), sin(a));
          // Inner ring: part and crease lines.
          vec2 o = dir * r / uRes;
          vec4 c = texture2D(tColor, vUv + o);
          if (c0.a > 0.5 && c.a > 0.5) {
            vec3 n = texture2D(tNormal, vUv + o).xyz * 2.0 - 1.0;
            if (abs(c.b - c0.b) > 0.002 || dot(n, n0) < 0.8) edge = 1.0;
          }
          // Outer ring: a heavier silhouette.
          vec4 cs = texture2D(tColor, vUv + o * 1.7);
          if (abs(cs.a - c0.a) > 0.5) edge = 1.0;
        }

        vec3 col = uPage;
        float ink;
        if (c0.a > 0.5) {
          // Spot plate: flat marigold, or a marigold dot screen at 15deg off.
          if (c0.g > 0.75) col = uAccent;
          else if (c0.g > 0.25) col = mix(col, uAccent, screen(px, uAngle + 0.52, uCell * 0.8, 0.5));
          ink = screen(px, uAngle, uCell, c0.r);
        } else {
          // Paper: floor shadow in ink, then a blue screen that thickens
          // toward the panel edges so the rack sits in a pool of white.
          ink = screen(px, uAngle, uCell, c0.r);
          vec2 q = (vUv - vec2(0.5, 0.52)) * vec2(uRes.x / uRes.y, 1.0);
          float bd = smoothstep(0.28, 0.85, length(q)) * 0.42 * (1.0 - step(0.04, c0.r));
          col = mix(col, uField, screen(px, uAngle - 0.52, uCell * 0.75, bd));
        }
        col = mix(col, uInk, max(ink, edge));
        gl_FragColor = vec4(col, 1.0);
      }
    `,
    depthTest: false,
    depthWrite: false,
  });
}

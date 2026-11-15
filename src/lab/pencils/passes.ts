// Production passes for the avatar, drawn by one fragment shader.
// A single `progress` uniform runs 0 -> 4 through the comic pipeline:
//   0..1 pencils  (sobel edges, jittered, non-photo blue, grainy)
//   1..2 inks     (dark areas brushed in top to bottom)
//   2..3 flats    (colour plates bucket-fill and slide into register; pencils erased)
//   3..4 print    (Ben-Day dots grow in the cast shadows)
// A lens uniform shows the pencils underneath the finished art.

const VERT = `
attribute vec2 a_pos;
void main() { gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

const FRAG = `
precision highp float;
uniform sampler2D u_tex;
uniform vec2 u_res;
uniform float u_p;
uniform float u_frame;
uniform float u_dpr;
uniform vec3 u_lens;   // x, y (gl px), radius (px)
uniform float u_lensA;
uniform vec3 u_pencil;
uniform vec3 u_ink;
uniform vec3 u_paper;

const vec3 LW = vec3(0.299, 0.587, 0.114);

float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

// Luminance with transparency treated as white paper.
float lumAt(vec2 uv) {
  vec4 c = texture2D(u_tex, uv);
  return mix(1.0, dot(c.rgb, LW), c.a);
}

float sobel(vec2 uv, float d) {
  float tl = lumAt(uv + vec2(-d, d)), t = lumAt(uv + vec2(0.0, d)), tr = lumAt(uv + vec2(d, d));
  float l = lumAt(uv + vec2(-d, 0.0)), r = lumAt(uv + vec2(d, 0.0));
  float bl = lumAt(uv + vec2(-d, -d)), b = lumAt(uv + vec2(0.0, -d)), br = lumAt(uv + vec2(d, -d));
  float gx = -tl - 2.0 * l - bl + tr + 2.0 * r + br;
  float gy = -bl - 2.0 * b - br + tl + 2.0 * t + tr;
  return length(vec2(gx, gy));
}

// Two loose, wobbly passes of blue pencil over the contours, with paper tooth.
float pencil(vec2 uv) {
  float f = u_frame;
  vec2 j1 = (vec2(noise(uv * 7.0 + f * 3.1), noise(uv * 7.0 + 17.0 + f * 1.7)) - 0.5) * 0.006;
  vec2 j2 = (vec2(noise(uv * 3.0 + 40.0 + f), noise(uv * 3.0 + 80.0 - f)) - 0.5) * 0.016;
  float d = 1.7 / 834.0;
  float e1 = smoothstep(0.35, 1.3, sobel(uv + j1, d));
  float e2 = smoothstep(0.5, 1.6, sobel(uv + j2 + vec2(0.004, -0.003), d * 1.3)) * 0.55;
  float tooth = 0.5 + 0.5 * hash(floor(gl_FragCoord.xy / u_dpr) + f * 7.0);
  return clamp(max(e1, e2) * tooth * 1.25, 0.0, 1.0);
}

// Soft reveal: t runs 0..1, f is where in that run this pixel turns on.
float rev(float t, float f) { return smoothstep(f, f + 0.07, t * 1.2 - 0.1); }

void main() {
  vec2 uv = gl_FragCoord.xy / u_res;
  float p = u_p;
  vec4 c = texture2D(u_tex, uv);
  float l = dot(c.rgb, LW);

  // 1. pencils
  float fP = noise(uv * 3.0) * 0.55 + (1.0 - uv.y) * 0.45;
  float erase = smoothstep(2.0, 2.7, p);
  float pa = pencil(uv) * rev(clamp(p, 0.0, 1.0), fP) * (1.0 - erase) * 0.95;
  vec4 col = vec4(u_pencil, 1.0) * pa;

  // 3. flats: colour plate, starts out of register and slides home.
  vec2 off = (1.0 - smoothstep(2.1, 3.0, p)) * vec2(0.016, -0.011);
  vec4 fc = texture2D(u_tex, uv + off);
  float nonInk = smoothstep(0.25, 0.45, dot(fc.rgb, LW));
  float fF = clamp(distance(uv, vec2(0.55, 0.45)) * 1.25 + noise(uv * 5.0) * 0.2, 0.0, 1.0);
  float fa = fc.a * nonInk * rev(clamp(p - 2.0, 0.0, 1.0), fF);
  col = vec4(fc.rgb, 1.0) * fa + col * (1.0 - fa);

  // 2. inks: brushed top to bottom with a ragged wet edge.
  float inkM = c.a * (1.0 - smoothstep(0.2, 0.42, l));
  float fI = (1.0 - uv.y) * 0.75 + noise(uv * 9.0) * 0.25;
  float ia = inkM * rev(clamp(p - 1.0, 0.0, 1.0), fI);
  col = vec4(u_ink, 1.0) * ia + col * (1.0 - ia);

  // Settle onto the exact original art.
  col = mix(col, vec4(c.rgb * c.a, c.a), smoothstep(3.0, 3.5, p));

  // 4. print: Ben-Day dots in the shadows the hair and chin cast on skin.
  float k = smoothstep(3.0, 4.0, p);
  if (k > 0.0) {
    float skin = c.a * step(0.55, l) * smoothstep(0.08, 0.18, c.r - c.b);
    vec4 oc = texture2D(u_tex, uv + vec2(-0.016, 0.028));
    float occ = oc.a * (1.0 - smoothstep(0.2, 0.42, dot(oc.rgb, LW)));
    float cell = 6.5 * u_dpr;
    vec2 q = mat2(0.7071, -0.7071, 0.7071, 0.7071) * gl_FragCoord.xy / cell;
    float d = length(fract(q) - 0.5);
    float r = 0.38 * k;
    float dots = (1.0 - smoothstep(r - 0.07, r + 0.05, d)) * smoothstep(0.0, 0.15, k);
    vec3 shade = c.rgb * vec3(0.86, 0.72, 0.64);
    col.rgb = mix(col.rgb, shade * col.a, skin * occ * dots);
  }

  // Lens: a window down to the pencils on the board.
  if (u_lensA > 0.0) {
    float ld = length(gl_FragCoord.xy - u_lens.xy);
    float rad = u_lens.z;
    float inside = (1.0 - smoothstep(rad - 1.0, rad, ld)) * u_lensA;
    if (inside > 0.0) {
      vec3 under = mix(u_paper, u_pencil, pencil(uv) * 0.95);
      col = mix(col, vec4(under, 1.0), inside);
    }
    float w = 3.0 * u_dpr;
    float ring = smoothstep(rad - 1.0, rad, ld) * (1.0 - smoothstep(rad + w - 1.0, rad + w, ld)) * u_lensA;
    col = mix(col, vec4(u_ink, 1.0), ring);
  }

  gl_FragColor = col;
}
`;

export interface Passes {
  set(p: number): void;
  lens(x: number, y: number): void;
  lensOff(): void;
  dispose(): void;
}

type RGB = [number, number, number];

function hex(v: string): RGB {
  const m = v.trim().replace('#', '');
  const n = parseInt(m.length === 3 ? [...m].map((c) => c + c).join('') : m, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const s = gl.createShader(type)!;
  gl.shaderSource(s, src);
  gl.compileShader(s);
  if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? 'shader');
  return s;
}

export async function createPasses(canvas: HTMLCanvasElement, src: string, start: number): Promise<Passes | null> {
  const gl = canvas.getContext('webgl', { premultipliedAlpha: true, antialias: false, alpha: true });
  if (!gl) return null;

  const img = new Image();
  img.src = src;
  try {
    await img.decode();
  } catch {
    return null;
  }

  let prog: WebGLProgram;
  try {
    prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl, gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl, gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
  } catch {
    return null;
  }
  gl.useProgram(prog);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPos = gl.getAttribLocation(prog, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  const u = (n: string) => gl.getUniformLocation(prog, n);
  const U = {
    res: u('u_res'),
    p: u('u_p'),
    frame: u('u_frame'),
    dpr: u('u_dpr'),
    lens: u('u_lens'),
    lensA: u('u_lensA'),
  };

  // Colours come from the design tokens.
  const css = getComputedStyle(document.documentElement);
  const field = hex(css.getPropertyValue('--field') || '#3b5a8c');
  const paper = hex(css.getPropertyValue('--page') || '#ffffff');
  const ink = hex(css.getPropertyValue('--ink') || '#0b0b0c');
  const pencilC = field.map((v, i) => v * 0.52 + paper[i] * 0.48) as RGB;
  gl.uniform1i(u('u_tex'), 0);
  gl.uniform3fv(u('u_pencil'), pencilC);
  gl.uniform3fv(u('u_ink'), ink);
  gl.uniform3fv(u('u_paper'), paper);
  gl.clearColor(0, 0, 0, 0);

  const state = { p: start, frame: 0, lx: 0, ly: 0, lensA: 0, lensTarget: 0, dpr: 1 };
  let raf = 0;
  let visible = true;

  const resize = () => {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
    state.dpr = dpr;
    invalidate();
  };

  const draw = () => {
    raf = 0;
    // Ease the lens in and out.
    const dl = state.lensTarget - state.lensA;
    state.lensA = Math.abs(dl) < 0.02 ? state.lensTarget : state.lensA + dl * 0.25;
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform2f(U.res, canvas.width, canvas.height);
    gl.uniform1f(U.p, state.p);
    gl.uniform1f(U.frame, state.frame);
    gl.uniform1f(U.dpr, state.dpr);
    gl.uniform3f(U.lens, state.lx * state.dpr, (canvas.clientHeight - state.ly) * state.dpr, 64 * state.dpr);
    gl.uniform1f(U.lensA, state.lensA);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (state.lensA !== state.lensTarget) invalidate();
  };

  function invalidate() {
    if (!raf && visible && !document.hidden) raf = requestAnimationFrame(draw);
  }

  // Pencil lines boil at ~8fps like the site's ink, only while they show.
  const boil = setInterval(() => {
    if (state.p < 2.7 || state.lensA > 0) {
      state.frame = (state.frame + 1) % 3;
      invalidate();
    }
  }, 125);

  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  const io = new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    invalidate();
  });
  io.observe(canvas);
  const onVis = () => invalidate();
  document.addEventListener('visibilitychange', onVis);
  resize();
  draw();

  return {
    set(p) {
      state.p = p;
      invalidate();
    },
    lens(x, y) {
      state.lx = x;
      state.ly = y;
      state.lensTarget = 1;
      invalidate();
    },
    lensOff() {
      state.lensTarget = 0;
      invalidate();
    },
    dispose() {
      cancelAnimationFrame(raf);
      clearInterval(boil);
      ro.disconnect();
      io.disconnect();
      document.removeEventListener('visibilitychange', onVis);
      gl.deleteTexture(tex);
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.getExtension('WEBGL_lose_context')?.loseContext();
    },
  };
}

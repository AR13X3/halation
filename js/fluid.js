// GPU "stable fluids" solver (Jos Stam), in the style popularised by
// Pavel Dobryakov's WebGL Fluid Simulation. The dye is a single density
// channel; the palette turns density into color in the field pass.

import { createProgram, createTarget, createDoubleTarget, draw } from './gl/gl.js';

const BASE_VERT = /* glsl */ `#version 300 es
layout(location = 0) in vec2 a_pos;
out vec2 vUv, vL, vR, vT, vB;
uniform vec2 texelSize;
void main() {
  vUv = a_pos * 0.5 + 0.5;
  vL = vUv - vec2(texelSize.x, 0.0);
  vR = vUv + vec2(texelSize.x, 0.0);
  vT = vUv + vec2(0.0, texelSize.y);
  vB = vUv - vec2(0.0, texelSize.y);
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const head = /* glsl */ `#version 300 es
precision highp float;
in vec2 vUv, vL, vR, vT, vB;
out vec4 o;
`;

const SPLAT = head + /* glsl */ `
uniform sampler2D uTarget;
uniform float aspectRatio;
uniform vec3 color;
uniform vec2 point;
uniform float radius;
void main() {
  vec2 p = vUv - point;
  p.x *= aspectRatio;
  vec3 s = exp(-dot(p, p) / radius) * color;
  o = vec4(texture(uTarget, vUv).xyz + s, 1.0);
}`;

const ADVECT = head + /* glsl */ `
uniform sampler2D uVelocity, uSource;
uniform vec2 texelSize;
uniform float dt, dissipation;
void main() {
  vec2 coord = vUv - dt * texture(uVelocity, vUv).xy * texelSize;
  o = texture(uSource, coord) / (1.0 + dissipation * dt);
}`;

const DIVERGENCE = head + /* glsl */ `
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).x;
  float R = texture(uVelocity, vR).x;
  float T = texture(uVelocity, vT).y;
  float B = texture(uVelocity, vB).y;
  vec2 C = texture(uVelocity, vUv).xy;
  if (vL.x < 0.0) L = -C.x;
  if (vR.x > 1.0) R = -C.x;
  if (vT.y > 1.0) T = -C.y;
  if (vB.y < 0.0) B = -C.y;
  o = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;

const CURL = head + /* glsl */ `
uniform sampler2D uVelocity;
void main() {
  float L = texture(uVelocity, vL).y;
  float R = texture(uVelocity, vR).y;
  float T = texture(uVelocity, vT).x;
  float B = texture(uVelocity, vB).x;
  o = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`;

const VORTICITY = head + /* glsl */ `
uniform sampler2D uVelocity, uCurl;
uniform float curl, dt;
void main() {
  float L = texture(uCurl, vL).x;
  float R = texture(uCurl, vR).x;
  float T = texture(uCurl, vT).x;
  float B = texture(uCurl, vB).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001;
  force *= curl * C;
  force.y *= -1.0;
  vec2 v = texture(uVelocity, vUv).xy + force * dt;
  o = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0);
}`;

const PRESSURE = head + /* glsl */ `
uniform sampler2D uPressure, uDivergence;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  float div = texture(uDivergence, vUv).x;
  o = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
}`;

const GRADIENT = head + /* glsl */ `
uniform sampler2D uPressure, uVelocity;
void main() {
  float L = texture(uPressure, vL).x;
  float R = texture(uPressure, vR).x;
  float T = texture(uPressure, vT).x;
  float B = texture(uPressure, vB).x;
  vec2 v = texture(uVelocity, vUv).xy - vec2(R - L, T - B);
  o = vec4(v, 0.0, 1.0);
}`;

const CLEAR = head + /* glsl */ `
uniform sampler2D uTexture;
uniform float value;
void main() { o = value * texture(uTexture, vUv); }`;

const QUALITY = {
  low: { sim: 96, dye: 512 },
  med: { sim: 160, dye: 1024 },
  high: { sim: 256, dye: 1600 },
};

export class Fluid {
  constructor(ctx) {
    this.ctx = ctx;
    const gl = (this.gl = ctx.gl);
    const mk = (fs, n) => createProgram(gl, BASE_VERT, fs, n);
    this.p = {
      splat: mk(SPLAT, 'splat'),
      advect: mk(ADVECT, 'advect'),
      divergence: mk(DIVERGENCE, 'divergence'),
      curl: mk(CURL, 'curl'),
      vorticity: mk(VORTICITY, 'vorticity'),
      pressure: mk(PRESSURE, 'pressure'),
      gradient: mk(GRADIENT, 'gradient'),
      clear: mk(CLEAR, 'clear'),
    };
    this.aspect = 1;
    this.quality = null;
    this.simTime = 0;
    this.pointers = [];
    this.ready = false;
  }

  ensure(aspect, quality) {
    if (this.ready && Math.abs(aspect - this.aspect) < 1e-4 && quality === this.quality) return;
    this.dispose();
    this.aspect = aspect;
    this.quality = quality;
    const { gl, caps } = this.ctx;
    const q = QUALITY[quality] || QUALITY.med;
    const res = (n) => (aspect >= 1 ? [Math.round(n * aspect), n] : [n, Math.round(n / aspect)]);
    const [sw, sh] = res(q.sim);
    let [dw, dh] = res(q.dye);
    const lim = caps.maxTexture;
    if (dw > lim || dh > lim) { const k = lim / Math.max(dw, dh); dw = Math.floor(dw * k); dh = Math.floor(dh * k); }
    const lin = { filter: gl.LINEAR };
    this.velocity = createDoubleTarget(gl, sw, sh, caps.rg, lin);
    this.dye = createDoubleTarget(gl, dw, dh, caps.r, lin);
    this.divergence = createTarget(gl, sw, sh, caps.r, { filter: gl.NEAREST });
    this.curl = createTarget(gl, sw, sh, caps.r, { filter: gl.NEAREST });
    this.pressure = createDoubleTarget(gl, sw, sh, caps.r, { filter: gl.NEAREST });
    this.ready = true;
    this.seed();
  }

  dispose() {
    if (!this.ready) return;
    for (const t of [this.velocity, this.dye, this.divergence, this.curl, this.pressure]) t.dispose();
    this.ready = false;
  }

  get dyeTexture() { return this.ready ? this.dye.read.tex : null; }

  reset() {
    if (!this.ready) return;
    const { gl } = this;
    for (const t of [this.velocity.read, this.velocity.write, this.dye.read, this.dye.write, this.pressure.read, this.pressure.write]) {
      t.bind();
      gl.clearColor(0, 0, 0, 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }
    this.seed();
  }

  // A few random splashes so the canvas never starts empty.
  seed() {
    for (let i = 0; i < 7; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = 250 + Math.random() * 450;
      this.splat(0.15 + Math.random() * 0.7, 0.15 + Math.random() * 0.7, Math.cos(a) * sp, Math.sin(a) * sp, 0.8 + Math.random() * 1.2, 0.35);
    }
  }

  // x, y in uv; dx, dy velocity in sim texels/sec; ink = dye amount; radius = brush size param.
  splat(x, y, dx, dy, ink, radius) {
    if (!this.ready) return;
    const { gl } = this;
    const r = (radius * radius * 0.025 + 0.0004) * (this.aspect > 1 ? this.aspect : 1);
    const p = this.p.splat.use();
    p.set({ aspectRatio: this.aspect, point: [x, y], radius: r, texelSize: [1 / this.velocity.w, 1 / this.velocity.h] });
    p.texture('uTarget', 0, this.velocity.read.tex);
    p.set('color', [dx, dy, 0]);
    this.velocity.write.bind();
    draw(gl);
    this.velocity.swap();

    if (ink > 0) {
      p.texture('uTarget', 0, this.dye.read.tex);
      p.set('color', [ink, 0, 0]);
      this.dye.write.bind();
      draw(gl);
      this.dye.swap();
    }
  }

  step(dt, s) {
    if (!this.ready) return;
    const { gl, p } = this;
    dt = Math.min(dt, 1 / 30);
    this.simTime += dt;

    // automatic ink streams
    const n = s.fluidStreams;
    for (let i = 0; i < n; i++) {
      const t = this.simTime * 0.45;
      const fx = 0.55 + 0.13 * i, fy = 0.43 + 0.11 * i;
      const px = i * 1.7, py = i * 0.9 + 1.3;
      const x = 0.5 + 0.36 * Math.sin(t * fx + px);
      const y = 0.5 + 0.36 * Math.cos(t * fy + py);
      const vx = 0.36 * fx * Math.cos(t * fx + px) * 0.45;
      const vy = -0.36 * fy * Math.sin(t * fy + py) * 0.45;
      const k = 900 * s.fluidForce * dt * 8;
      this.splat(x, y, vx * this.velocity.w * k * 0.02, vy * this.velocity.h * k * 0.02, s.fluidInk * dt * 2.4, s.fluidRadius * 0.5);
    }

    const texel = [1 / this.velocity.w, 1 / this.velocity.h];

    p.curl.use().set('texelSize', texel).texture('uVelocity', 0, this.velocity.read.tex);
    this.curl.bind();
    draw(gl);

    p.vorticity.use().set({ texelSize: texel, curl: s.fluidCurl, dt });
    p.vorticity.texture('uVelocity', 0, this.velocity.read.tex).texture('uCurl', 1, this.curl.tex);
    this.velocity.write.bind();
    draw(gl);
    this.velocity.swap();

    p.divergence.use().set('texelSize', texel).texture('uVelocity', 0, this.velocity.read.tex);
    this.divergence.bind();
    draw(gl);

    p.clear.use().set({ texelSize: texel, value: 0.8 }).texture('uTexture', 0, this.pressure.read.tex);
    this.pressure.write.bind();
    draw(gl);
    this.pressure.swap();

    p.pressure.use().set('texelSize', texel).texture('uDivergence', 1, this.divergence.tex);
    for (let i = 0; i < 22; i++) {
      p.pressure.texture('uPressure', 0, this.pressure.read.tex);
      this.pressure.write.bind();
      draw(gl);
      this.pressure.swap();
    }

    p.gradient.use().set('texelSize', texel);
    p.gradient.texture('uPressure', 0, this.pressure.read.tex).texture('uVelocity', 1, this.velocity.read.tex);
    this.velocity.write.bind();
    draw(gl);
    this.velocity.swap();

    p.advect.use().set({ texelSize: texel, dt, dissipation: s.fluidVelFade });
    p.advect.texture('uVelocity', 0, this.velocity.read.tex).texture('uSource', 1, this.velocity.read.tex);
    this.velocity.write.bind();
    draw(gl);
    this.velocity.swap();

    p.advect.set('dissipation', s.fluidInkFade);
    p.advect.texture('uVelocity', 0, this.velocity.read.tex).texture('uSource', 1, this.dye.read.tex);
    this.dye.write.bind();
    draw(gl);
    this.dye.swap();
  }
}

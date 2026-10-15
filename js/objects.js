// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 AR13X3 — Halation (https://github.com/AR13X3/halation)
// Objects floating in front of the flow: where they are at a given moment
// (shared by the shaders and canvas dragging), the shader data, and the
// upgrade of looks made with the old Shapes flow.

import { MAX_OBJECTS, OBJECT_SHAPES, objectValue } from './schema.js';
import { hexToRgb } from './palette.js';

const TAU = Math.PI * 2;
const DEG = Math.PI / 180;

// GLSL's "hash without sine" (shaders.js), rounded step by step the way the
// GPU computes it: 32-bit floats, with a·b + c fused into one rounding (a
// "mad"), and dot products as a multiply followed by two mads. The hash is
// chaotic, so anything less exact moves objects; this matches the GPU bit for
// bit (checked on NVIDIA and AMD under Direct3D).
const f = Math.fround;
const fract = (x) => f(x - Math.floor(x));
const mad = (a, b, c) => f(f(a) * f(b) + f(c));
function hash11(p) {
  p = fract(f(f(p) * f(0.1031)));
  p = f(p * f(p + f(33.33)));
  p = f(p * f(p + p));
  return fract(p);
}
function hash22(x, y) {
  let a = fract(f(f(x) * f(0.1031))), b = fract(f(f(y) * f(0.103))), c = fract(f(f(x) * f(0.0973)));
  const d = mad(c, f(a + f(33.33)), mad(b, f(c + f(33.33)), f(a * f(b + f(33.33)))));
  a = f(a + d); b = f(b + d); c = f(c + d);
  return [fract(f(f(a + b) * c)), fract(f(f(a + c) * b))];
}

// Each object's drift has its own phase, taken from the drift seed.
const driftHash = (i, seed) => hash22(mad(i, 3.17, 1.3), mad(seed, 0.211, 5));

/**
 * Every object as it is at loop angle `phase` (see Renderer.uniforms), in
 * object space: center, rotation (radians) and radius, plus its other settings.
 */
export function objectFrames(state, phase) {
  const o = state.objects;
  const out = [];
  for (let i = 1; i <= o.count; i++) {
    const v = (name) => objectValue(state, i, name);
    const [hx, hy] = driftHash(i - 1, o.seed);
    const sp = 1 + ((i - 1) % 2);
    out.push({
      x: v('X') + 0.07 * o.drift * Math.sin(phase * sp + hx * TAU),
      y: v('Y') + 0.07 * o.drift * Math.cos(phase * (3 - sp) + hy * TAU),
      angle: v('Angle') * DEG + 0.35 * o.drift * Math.sin(phase + (i - 1) * 1.7),
      R: v('Size') * 0.5,
      length: v('Length'),
      corner: v('Corner'),
      kind: Math.max(0, OBJECT_SHAPES.findIndex((s) => s.value === v('Shape'))),
      glass: v('Material') === 'glass',
      fill: Math.max(0, ['palette', 'custom', 'gradient'].indexOf(v('Fill'))),
      gradAngle: v('GradAngle') * DEG,
      rgb: hexToRgb(v('Color')),
      tone: v('Tone'),
      tint: v('Tint'),
      frost: v('Frost'),
    });
  }
  return out;
}

/** Shader uniforms for the objects (see OBJECTS in shaders.js). */
export function objectUniforms(state, phase) {
  const A = new Float32Array(MAX_OBJECTS * 4), B = new Float32Array(MAX_OBJECTS * 4);
  const C = new Float32Array(MAX_OBJECTS * 4), D = new Float32Array(MAX_OBJECTS * 4);
  let glass = 0, frost = 0;
  objectFrames(state, phase).forEach((ob, k) => {
    A.set([ob.x, ob.y, ob.R * 2, ob.length], k * 4);
    B.set([ob.kind, ob.glass ? 1 : 0, ob.angle, ob.corner], k * 4);
    C.set([...ob.rgb, ob.tone], k * 4);
    D.set([ob.fill, ob.tint, ob.frost, ob.gradAngle], k * 4);
    if (ob.glass) { glass++; frost = Math.max(frost, ob.frost); }
  });
  return { u_objA: A, u_objB: B, u_objC: C, u_objD: D, u_objGlass: glass, u_objFrost: frost };
}

// ── shapes (mirrors objShape in shaders.js) ─────────────────────────────────
function segDist(qx, qy, half) {
  const cy = Math.max(-half, Math.min(half, qy));
  return Math.hypot(qx, qy - cy);
}

function shapeDist(ob, qx, qy) {
  const R = ob.R;
  switch (ob.kind) {
    case 0: return Math.hypot(qx, qy) - R;
    case 1: return segDist(qx, qy, R * 0.55 * ob.length) - R * 0.42;
    case 2: {
      const hx = R * 0.6, hy = R * 0.6 * ob.length, cr = ob.corner * Math.min(hx, hy);
      const ax = Math.abs(qx) - hx + cr, ay = Math.abs(qy) - hy + cr;
      return Math.hypot(Math.max(ax, 0), Math.max(ay, 0)) + Math.min(Math.max(ax, ay), 0) - cr;
    }
    default: return Math.abs(segDist(qx, qy, R * 0.38 * ob.length) - R * 0.6) - R * 0.24;
  }
}

/** Canvas point (height units) → object space, undoing "Arrange all". */
export function toObjectSpace(state, px, py) {
  const o = state.objects;
  const a = -o.rotation * DEG, c = Math.cos(a), s = Math.sin(a);
  return [(c * px - s * py) / o.scale - o.offsetX, (s * px + c * py) / o.scale - o.offsetY];
}

/** A drag on the canvas (height units) as a move in object space. */
export function toObjectDelta(state, dx, dy) {
  const o = state.objects;
  const a = -o.rotation * DEG, c = Math.cos(a), s = Math.sin(a);
  return [(c * dx - s * dy) / o.scale, (s * dx + c * dy) / o.scale];
}

/**
 * The frontmost object under a canvas point, as its number (1–6), or 0.
 * `slop` widens the target a little (height units).
 */
export function objectAt(state, phase, px, py, slop = 0) {
  if (!state.objects.count) return 0;
  const [ax, ay] = toObjectSpace(state, px, py);
  const frames = objectFrames(state, phase);
  for (let k = frames.length - 1; k >= 0; k--) {          // later objects are in front
    const ob = frames[k];
    const c = Math.cos(-ob.angle), s = Math.sin(-ob.angle);
    const dx = ax - ob.x, dy = ay - ob.y;
    if (shapeDist(ob, c * dx - s * dy, s * dx + c * dy) < slop / state.objects.scale) return k + 1;
  }
  return 0;
}

// ── upgrading old looks ─────────────────────────────────────────────────────
/**
 * Halation 1.1 drew objects as the "Shapes" flow. Such a look becomes no flow
 * over a gradient background identical to the old backdrop, plus the same
 * objects placed exactly where the old shader put them. The flow's scale,
 * rotation and pan become the objects' Arrange all settings, and are folded
 * into the background gradient's angle, length and offset.
 */
export function upgradeShapes(look) {
  const s = look.source;
  const n = Math.min(MAX_OBJECTS, Math.max(1, Math.round(s.shapeCount ?? 1)));
  const size = s.shapeSize ?? 0.7;
  const seed = s.seed ?? 7;
  const ca = hash11(mad(seed, 0.37, 2.1)) * TAU;
  const objects = {
    count: n, drift: s.shapeDrift ?? 0.6, seed, soft: s.shapeSoft ?? 0.02, shadow: 0,
    scale: s.scale ?? 1, rotation: -(s.rotation ?? 0), offsetX: -(s.offsetX ?? 0), offsetY: -(s.offsetY ?? 0),
  };
  const kinds = ['sphere', 'link', 'pill'];
  for (let k = 0; k < n; k++) {
    const [hx, hy] = driftHash(k, seed);
    const R = size * 0.5 * (n > 1 ? 0.8 + 0.2 * fract(f(hx * f(7.3))) : 1);
    const along = (k - (n - 1) * 0.5) * size * 0.62;
    const shape = (s.shape ?? 'sphere') === 'mixed' ? kinds[k % 3] : kinds.includes(s.shape) ? s.shape : 'sphere';
    const o = `o${k + 1}`;
    Object.assign(objects, {
      [o + 'Material']: 'solid',
      [o + 'Shape']: shape,
      [o + 'Fill']: 'palette',
      [o + 'Tone']: n > 1 ? 0.62 + 0.38 * (k / (n - 1)) : 1,
      [o + 'Size']: R * 2,
      [o + 'Length']: 1,
      [o + 'X']: Math.cos(ca) * along + (hx - 0.5) * size * 0.18,
      [o + 'Y']: Math.sin(ca) * along + (hy - 0.5) * size * 0.18,
      [o + 'Angle']: (hy - 0.5) * 2.4 / DEG,
    });
  }
  // the backdrop was 0.5 + 0.85·dot(p′, d) with p′ = rotate(p) / scale + pan
  const bg = (s.bgAngle ?? -90) * DEG;
  const source = {
    ...s, type: 'none', bgFill: 'gradient', gradShape: 'linear', gradRange: 0.4,
    bgAngle: ((((s.bgAngle ?? -90) - (s.rotation ?? 0) + 180) % 360) + 360) % 360 - 180,
    gradLength: s.scale ?? 1,
    gradShift: 0.85 * ((s.offsetX ?? 0) * Math.cos(bg) + (s.offsetY ?? 0) * Math.sin(bg)),
  };
  for (const key of ['shape', 'shapeCount', 'shapeSize', 'shapeSoft', 'shapeDrift']) delete source[key];
  return { ...look, source, objects: { ...objects, ...(look.objects || {}) } };
}

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 AR13X3 — Halation (https://github.com/AR13X3/halation)
// "Surprise me" and the per-section dice.
//
// Surprise me picks one art direction (a recipe) and builds a few candidate
// looks from it: one hero effect, a palette that suits it, everything else
// left at its neutral default. The app renders the candidates small and keeps
// the one that scores best (scoreImage), so washed-out, blown, muddy or noisy
// results are rare.

import { PARAMS, setPath } from './schema.js';
import { PALETTES, randomPalette, hexToRgb, rgbToHex, rgbToOklab, oklabToRgb, oklchToHex } from './palette.js';
import { PRESETS } from './presets.js';

const rand = (a, b) => a + Math.random() * (b - a);
const chance = (p) => Math.random() < p;
const r = (a, b, digits = 2) => +rand(a, b).toFixed(digits);
const ri = (a, b) => Math.floor(rand(a, b + 1));
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

function weighted(table) {
  const total = Object.values(table).reduce((a, b) => a + b, 0);
  let x = Math.random() * total;
  for (const [k, w] of Object.entries(table)) if ((x -= w) <= 0) return k;
  return Object.keys(table)[0];
}

// ── palettes ────────────────────────────────────────────────────────────────
const lab = (hex) => rgbToOklab(hexToRgb(hex));
const lum = (hex) => lab(hex)[0];
const chroma = (hex) => Math.hypot(lab(hex)[1], lab(hex)[2]);

// Every gradient the app ships: the library plus the built-in looks.
const POOL = [...new Map(
  [...PALETTES.map((p) => p.stops), ...PRESETS.map((p) => p.look.color?.stops).filter(Boolean)]
    .map((s) => [JSON.stringify(s), s]),
).values()];

// Sorted copy; flipped if needed so it runs dark → light.
function darkFirst(stops) {
  const s = [...stops].sort((a, b) => a.pos - b.pos).map((x) => ({ ...x }));
  if (lum(s[0].color) <= lum(s[s.length - 1].color)) return s;
  return s.map((x) => ({ pos: +(1 - x.pos).toFixed(3), color: x.color })).reverse();
}

// Quiet near-neutral ramps for polished metal.
function metalPalette() {
  const H = rand(0, 360), C = rand(0.008, 0.045);
  return [0.15, 0.4, 0.72, 0.94].map((L, i) => ({
    pos: +(i / 3).toFixed(3),
    color: oklchToHex(L + rand(-0.03, 0.03), C * (i === 3 ? 0.5 : 1), H + i * rand(-10, 10)),
  }));
}

/**
 * A palette suited to a recipe.
 *   any    — anything with enough tonal range (usually dark → light)
 *   dark   — starts near black, for light and glow on a dark ground
 *   glow   — dark start, saturated middle, bright end (threads, ribbons)
 *   metal  — low-chroma ramps (chrome mirrors a horizon built from them)
 */
function palette(kind = 'any') {
  for (let i = 0; i < 40; i++) {
    let stops;
    if (kind === 'metal' && chance(0.5)) stops = metalPalette();
    else if (chance(0.8)) stops = structuredClone(pick(POOL));
    else stops = randomPalette({ dark: kind !== 'any' || chance(0.85), harmonious: true });
    if (kind !== 'any' || chance(0.85)) stops = darkFirst(stops);
    const L = stops.map((s) => lum(s.color));
    const Cs = stops.map((s) => chroma(s.color));
    const C = Math.max(...Cs);
    if (Math.max(...L) - Math.min(...L) < 0.45) continue;           // too flat
    if (kind !== 'metal' && C < 0.06) continue;                     // gray
    if (Cs.reduce((a, b) => a + b, 0) / Cs.length > 0.17) continue; // garish
    if (kind === 'dark' && L[0] > 0.3) continue;
    if (kind === 'glow' && (L[0] > 0.25 || L[L.length - 1] < 0.78 || C < 0.08)) continue;
    if (kind === 'metal' && C > 0.13) continue;
    return stops;
  }
  return darkFirst(structuredClone(PALETTES[0].stops));
}

// A backdrop for silhouettes: the palette's darkest color, deeper and calmer.
function backdrop(stops) {
  const [L, a, b] = lab(darkFirst(stops)[0].color);
  return rgbToHex(oklabToRgb([Math.min(L, 0.3) * 0.45, a * 0.5, b * 0.5]));
}

const INK_PAPER = [
  ['#1a1a1a', '#f3efe6'], ['#ff3d7f', '#f6f0e4'], ['#1f3fbf', '#f2efe8'], ['#f2efe8', '#141217'],
  ['#ffd23f', '#121019'], ['#0f5c4d', '#efe9dc'], ['#e5482d', '#f7f1e3'], ['#7fd1ff', '#0b1020'],
];

// ── building blocks ─────────────────────────────────────────────────────────
// Calm flows that sit well behind glass or a screen.
function smoothFlow() {
  const t = weighted({ mesh: 4, silk: 2, bands: 2.5 });
  if (t === 'mesh') return { type: 'mesh', meshCount: ri(3, 6), meshBlend: r(1, 2), meshMotion: r(0.5, 1.2), warp: r(0.4, 1.3) };
  if (t === 'silk') return { type: 'silk', scale: r(1.4, 2.2), warp: r(0.6, 1.2), detail: 2, blur: r(0.08, 0.2) };
  return { type: 'bands', bandCount: ri(1, 3), bandWidth: r(0.1, 0.28), bandSpacing: r(0.2, 0.45), bandAngle: ri(-60, 60), bandLength: chance(0.5) ? 3 : r(1, 2.5), warp: r(0.5, 1.4) };
}

// Crisp edges for heavily distorting glass to break up.
const crispFlow = () => weighted({ shapes: 4, bands: 3, mesh: 3 }) === 'shapes' ? shapesFlow()
  : chance(0.5) ? { type: 'bands', bandCount: ri(2, 4), bandWidth: r(0.06, 0.16), bandSpacing: r(0.15, 0.35), bandAngle: ri(-60, 60), bandLength: 3, warp: r(0.6, 1.4) }
  : { type: 'mesh', meshCount: ri(4, 7), meshBlend: r(2, 3), warp: r(0.4, 1) };

// Something crisp to look through glass at.
const shapesFlow = () => ({ type: 'shapes', shape: pick(['sphere', 'sphere', 'link', 'pill', 'mixed']), shapeCount: ri(1, 3), shapeSize: r(0.55, 0.85), shapeSoft: r(0, 0.04), shapeDrift: r(0.3, 0.8), bgAngle: ri(-180, 180) });

const light = () => ({ angle: ri(0, 359), elevation: ri(35, 65), env: weighted({ studio: 4, palette: 2, window: 1 }) });
const finish = () => ({ grain: r(0.02, 0.1), vignette: chance(0.3) ? r(0.15, 0.35) : 0 });
const pane = (p) => (chance(p) ? { panel: pick(['right', 'left', 'band']), panelSize: r(0.45, 0.65) } : {});

// Natural glass: refraction does the work, highlights and reflections stay low.
const glassBase = () => ({ shadow: r(0.1, 0.35), highlight: r(0, 0.08), reflect: r(0.05, 0.18) });

// A built-in look with a new seed, usually a new palette of the same kind, and
// its numbers nudged a little: the composition stays, the result is new.
const REMIXABLE = PRESETS.filter((p) => !['fluid', 'image'].includes(p.look.source?.type));
const NUDGE = ['source', 'glass', 'screen', 'surface', 'finish'];
function remix(preset) {
  const look = structuredClone(preset.look);
  for (const sec of NUDGE) {
    for (const [k, v] of Object.entries(look[sec] || {})) {
      if (typeof v !== 'number' || k === 'seed' || v === 0) continue;
      const deg = /angle|rotation|Angle/.test(k);
      const nv = deg ? v + rand(-20, 20) : v * rand(0.85, 1.15);
      look[sec][k] = Number.isInteger(v) && !deg ? Math.round(nv) : +nv.toFixed(3);
    }
  }
  const stops = look.color?.stops || [];
  const L = stops.map((s) => lum(s.color));
  const kind = look.surface?.chrome ? 'metal'
    : ['threads', 'ribbons'].includes(look.source?.type) ? 'glow'
    : L.length && Math.min(...L) < 0.22 && L[0] < L[L.length - 1] ? 'dark' : 'any';
  if (chance(0.75)) look.color = { ...look.color, stops: palette(kind) };
  if (look.source?.form && look.source.form !== 'none') look.source.formBg = backdrop(look.color.stops);
  return look;
}

// ── recipes ─────────────────────────────────────────────────────────────────
// Each returns a partial look; anything it leaves out is the neutral default.
// `dark` tells the scorer that a mostly black frame is intended.
const RECIPES = {
  remix: { w: 4, make: ({ preset }) => remix(preset) },

  // a clean gradient wallpaper: defined color fields, a little grain
  gradient: { w: 0.9, make: () => ({
    source: chance(0.65)
      ? { type: 'mesh', meshCount: ri(4, 7), meshBlend: r(1.3, 2), meshMotion: r(0.5, 1), warp: r(0.6, 1.3) }
      : { type: 'bands', bandCount: ri(2, 4), bandWidth: r(0.08, 0.2), bandSpacing: r(0.18, 0.4), bandAngle: ri(-60, 60), bandLength: 3, warp: r(0.8, 1.6) },
    color: { stops: palette(), spread: r(1.2, 1.6) },
    finish: { grain: r(0.06, 0.16), bloom: chance(0.3) ? r(0.2, 0.4) : 0 },
  }) },

  fluted: { w: 2.2, make: () => {
    const type = weighted({ reeded: 4, wavy: 1.5, rings: 1 });
    const g = {
      type, ...glassBase(),
      count: type === 'rings' ? r(6, 16, 1) : r(7, 24, 1),
      strength: r(0.35, 0.85) * (chance(0.15) ? -1 : 1),
      profile: weighted({ round: 3, linear: 1, wave: 1, block: 1, prism: 0.5 }),
      frost: chance(0.3) ? r(0.1, 0.35) : 0,
      dispersion: chance(0.25) ? r(0.2, 0.5) : 0,
      caustics: chance(0.3) ? r(0.15, 0.4) : 0,
      streak: chance(0.15) ? r(0.2, 0.5) : 0,
      ...pane(0.12),
    };
    if (type === 'reeded' && chance(0.3)) g.angle = pick([90, ri(-25, 25)]);
    if (type === 'wavy') Object.assign(g, { wave: r(0.3, 1), waveFreq: r(0.6, 2) });
    if (type === 'rings') Object.assign(g, { centerX: r(-1, 1), centerY: r(-1, 1) });
    return { source: smoothFlow(), color: { stops: palette(), spread: r(1.1, 1.5) }, glass: g, light: light(), finish: finish() };
  } },

  blocks: { w: 1.2, make: () => {
    const type = weighted({ tiles: 2, pyramid: 1.2, crystal: 1 });
    const g = {
      type, ...glassBase(),
      count: type === 'tiles' ? r(4, 12, 1) : type === 'pyramid' ? r(6, 18, 1) : r(3, 8, 1),
      strength: r(0.45, 0.9),
      frost: chance(0.5) ? r(0.1, 0.5) : 0,
      dispersion: chance(0.3) ? r(0.2, 0.5) : 0,
      ...pane(0.2),
    };
    if (type === 'tiles') g.profile = weighted({ block: 3, round: 1, bevel: 1 });
    return { source: chance(0.6) ? shapesFlow() : smoothFlow(), color: { stops: palette(), spread: r(1.1, 1.5) }, glass: g, light: light(), finish: finish() };
  } },

  weathered: { w: 0.7, make: () => {
    const type = weighted({ hammered: 1, water: 0.6, rain: 1.2 });
    const g = type === 'hammered' ? { count: r(6, 14, 1), strength: r(0.5, 0.9), jitter: r(0.3, 0.7), caustics: chance(0.5) ? r(0.2, 0.4) : 0 }
      : type === 'water' ? { count: r(3, 8, 1), strength: r(0.5, 1), caustics: r(0, 0.3) }
      : { count: r(7, 14, 1), strength: r(0.7, 1), frost: r(0.35, 0.7), coverage: r(0.35, 0.65), jitter: r(0.2, 0.5), highlight: r(0.1, 0.25) };
    return { source: type === 'water' ? shapesFlow() : crispFlow(), color: { stops: palette(), spread: r(1.1, 1.5) }, glass: { type, ...glassBase(), ...g }, light: light(), finish: finish() };
  } },

  print: { w: 1.1, make: () => {
    const type = weighted({ halftone: 3, moire: 2, contour: 2, dither: 1, lines: 1, led: 1, mosaic: 1, crt: 0.5 });
    const sc = { type, contrast: r(1, 1.35), background: r(0.05, 0.3) };
    const fin = { grain: r(0, 0.05) };
    if (type === 'halftone') Object.assign(sc, { size: ri(50, 140), angle: pick([15, 45, 75, ri(0, 90)]), dotShape: pick(['circle', 'circle', 'square', 'diamond']), dotScale: r(0.8, 1.05) });
    if (type === 'lines') Object.assign(sc, { size: ri(50, 110), lineShape: pick(['rings', 'waves', 'straight']), angle: ri(0, 90), dotScale: r(0.6, 1), background: r(0.3, 0.6) });
    if (type === 'moire') Object.assign(sc, { size: ri(120, 260), angle: ri(0, 90), bend: r(0.6, 1.6), interference: chance(0.6) ? r(1.5, 6) : 0, dotScale: r(0.7, 1.1), background: r(0.15, 0.45) });
    if (type === 'dither') Object.assign(sc, { size: ri(140, 300), levels: ri(2, 4) });
    if (type === 'contour') Object.assign(sc, { lineCount: ri(8, 24), lineWidth: r(1, 2.4), fill: chance(0.6), indexEvery: pick([0, 4, 5]), glow: r(0.3, 1) });
    if (type === 'led') { Object.assign(sc, { size: ri(60, 130), ledShape: pick(['round', 'square', 'rgb']), dotScale: r(0.7, 0.95), glow: r(0.2, 0.5), background: 0 }); fin.bloom = r(0.25, 0.45); }
    if (type === 'mosaic') Object.assign(sc, { size: ri(24, 60), mosaicShape: pick(['square', 'hex']), dotScale: r(0.85, 0.95), glow: r(0.3, 0.6) });
    if (type === 'crt') { Object.assign(sc, { size: ri(100, 200), dotScale: r(0.7, 0.9), glow: r(0.3, 0.5) }); Object.assign(fin, { bloom: r(0.3, 0.5), vignette: r(0.3, 0.45) }); }
    if (['halftone', 'lines', 'moire', 'dither', 'contour'].includes(type) && chance(0.35)) {
      const [ink, paper] = pick(INK_PAPER);
      Object.assign(sc, { colorMode: 'mono', ink, paper });
    }
    return { source: smoothFlow(), color: { stops: palette(), spread: r(1.1, 1.6) }, screen: sc, finish: fin };
  } },

  metal: { w: 1, make: () => {
    const chrome = chance(0.6);
    const surface = chrome
      ? { chrome: r(0.8, 1), gloss: r(0.2, 0.5), glossSize: r(0.5, 0.8), iridescence: chance(0.45) ? r(0.3, 0.6) : 0, film: r(0.2, 0.7), sparkle: chance(0.3) ? r(0.1, 0.3) : 0 }
      : { relief: r(0.5, 0.8), gloss: r(0.5, 0.9), glossSize: r(0.4, 0.7) };
    return {
      source: { type: 'silk', scale: r(1.3, 2), warp: r(0.9, 1.4), ridge: r(0.15, 0.45), detail: 2, blur: r(0.05, 0.12), rotation: ri(-180, 180) },
      color: { stops: palette(chrome ? 'metal' : 'dark'), spread: r(1.1, 1.4) },
      surface, light: { angle: ri(0, 359), elevation: ri(35, 65) },
      finish: { grain: r(0.02, 0.05), vignette: chance(0.4) ? r(0.2, 0.35) : 0 },
    };
  } },

  liquid: { w: 0.6, make: () => ({
    source: { type: 'silk', scale: r(1.1, 1.6), warp: r(1, 1.6), ridge: r(0.6, 0.9), detail: 1, twist: r(-1, 1) },
    color: { stops: palette('dark'), spread: r(0.95, 1.2) },
    surface: { liquid: r(0.6, 0.9), gloss: r(0.4, 0.7), glossSize: r(0.75, 0.9), sparkle: chance(0.6) ? r(0.3, 0.6) : 0, sparkleDensity: r(0.2, 0.5), iridescence: chance(0.25) ? r(0.2, 0.4) : 0 },
    light: { angle: ri(0, 359), elevation: ri(35, 65) },
    finish: { bloom: r(0.3, 0.5), bloomThreshold: 0.6, grain: r(0.02, 0.05) },
  }) },

  trails: { w: 1.3, dark: true, make: () => {
    const mode = weighted({ parallel: 1, hourglass: 1, burst: 1 });
    const s = { type: 'threads', thrWeight: r(1.2, 2.2), thrGlow: r(0.4, 0.7), thrDepth: r(0.3, 0.8), thrBreak: r(0.1, 0.6) };
    if (mode === 'parallel') Object.assign(s, { thrCount: r(10, 30, 1), thrConverge: 0, thrSpread: chance(0.5) ? r(0.3, 0.8) : 3, warp: r(0.8, 2.5), rotation: ri(-30, 30) });
    if (mode === 'hourglass') Object.assign(s, { thrCount: r(40, 80, 0), thrConverge: r(0.5, 0.75), thrSpread: r(0.3, 0.5), warp: r(0.3, 0.8), rotation: pick([0, 90, 90]) });
    if (mode === 'burst') Object.assign(s, { thrCount: r(7, 16, 1), thrConverge: 1, thrSpread: r(0.9, 3), warp: r(1.2, 2.5), rotation: ri(-45, 45) });
    const f = { bloom: r(0.5, 0.8), grain: r(0.02, 0.05) };
    if (chance(0.6)) Object.assign(f, { aberration: r(0.3, 0.8), aberrationMode: mode === 'parallel' ? 'lens' : 'orbit' });
    if (mode !== 'parallel' && chance(0.3)) Object.assign(f, { streak: r(0.1, 0.25), streakType: 'zoom' });
    return { source: s, color: { stops: palette('glow') }, surface: chance(0.3) ? { sparkle: r(0.3, 0.5), sparkleDensity: r(0.6, 0.9) } : {}, finish: f };
  } },

  neon: { w: 0.8, dark: true, make: () => ({
    source: { type: 'ribbons', ribLines: ri(14, 50), ribWidth: r(0.3, 0.8), ribThick: r(0.04, 0.12), ribGlow: r(0.4, 0.8), ribAmp: r(0.5, 1.5), ribFreq: r(0.6, 1.6), ribFan: r(-0.8, 0.8), ribAngle: ri(-40, 40), warp: r(0.3, 0.8) },
    color: { stops: palette('glow'), spread: r(1, 1.3) },
    surface: chance(0.4) ? { relief: r(0.2, 0.4), gloss: r(0.2, 0.4) } : {},
    finish: { bloom: r(0.3, 0.6), bloomThreshold: r(0.45, 0.6), grain: r(0.02, 0.06) },
  }) },

  sculpture: { w: 1.1, dark: true, make: ({ aspect }) => {
    const form = aspect < 0.85 ? weighted({ ribbon: 3, blob: 1 }) : aspect > 1.2 ? weighted({ wave: 3, blob: 1 }) : weighted({ ribbon: 1, wave: 1, blob: 1.5 });
    const w = Math.min(aspect, 1);
    const stops = palette('dark');
    const flow = chance(0.6)
      ? { type: 'mesh', meshCount: ri(4, 7), meshBlend: r(1, 1.6), warp: r(0.6, 1.2) }
      : { type: 'silk', scale: r(1.2, 1.8), warp: r(0.6, 1.2), detail: 2 };
    const look = {
      source: {
        ...flow, form, formSoft: 0, formBg: backdrop(stops),
        formSize: form === 'wave' ? r(0.35, 0.55) : r(0.5, 0.72) * w,
        formWave: r(0.8, 1.6), formDepth: r(0.5, 0.85),
      },
      color: { stops, spread: r(1, 1.3) },
      finish: { grain: r(0.02, 0.06) },
    };
    const mat = weighted({ relief: 1, iridescence: 1, chrome: 0.6, plain: 0.6 });
    look.surface = mat === 'relief' ? { relief: r(0.3, 0.6), gloss: r(0.3, 0.6) }
      : mat === 'iridescence' ? { iridescence: r(0.3, 0.6), film: r(0.2, 0.5) }
      : mat === 'chrome' ? { chrome: r(0.7, 1), gloss: 0.3 } : {};
    if (chance(0.35)) look.screen = { type: 'moire', size: ri(160, 280), angle: ri(0, 60), bend: r(1, 2), interference: chance(0.6) ? r(1.5, 4) : 0, background: r(0.4, 0.6), dotScale: r(0.8, 1.1), glow: 0.2 };
    return look;
  } },
};

let lastRecipe = '';
let lastPreset = null;

/**
 * Candidate looks for Surprise me, all from one recipe (or variations of one
 * built-in look); the same recipe never comes twice in a row. The user's
 * motion settings are kept.
 */
export function surpriseCandidates(state, n = 4) {
  const table = {};
  for (const [k, v] of Object.entries(RECIPES)) if (k !== lastRecipe || k === 'remix') table[k] = v.w;
  const recipe = weighted(table);
  lastRecipe = recipe;
  const aspect = state.doc.width / state.doc.height;
  const preset = pick(REMIXABLE.filter((p) => p !== lastPreset));
  if (recipe === 'remix') lastPreset = preset;
  const anim = structuredClone(state.anim);
  delete anim.time;
  delete anim.playing;
  return Array.from({ length: n }, () => {
    const look = RECIPES[recipe].make({ aspect, preset });
    look.source = { seed: ri(0, 9999), ...look.source };
    look.anim = anim;
    const dark = !!RECIPES[recipe].dark || ['threads', 'ribbons'].includes(look.source.type) || (look.source.form ?? 'none') !== 'none';
    return { recipe, dark, look };
  });
}

/**
 * Scores a small RGBA8 render of a candidate; higher is better. It only aims
 * to catch failures: flat, blown-out, crushed, noisy or garish frames.
 */
export function scoreImage(px, w, h, { dark = false, screen = false } = {}) {
  const n = w * h;
  const L = new Float32Array(n);
  let sum = 0, clip = 0, black = 0, rg = 0, yb = 0, rg2 = 0, yb2 = 0;
  for (let i = 0; i < n; i++) {
    const R = px[i * 4] / 255, G = px[i * 4 + 1] / 255, B = px[i * 4 + 2] / 255;
    const l = 0.2126 * R + 0.7152 * G + 0.0722 * B;
    L[i] = l;
    sum += l;
    if (l > 0.96) clip++;
    if (l < 0.035) black++;
    const a = R - G, b = 0.5 * (R + G) - B;
    rg += a; yb += b; rg2 += a * a; yb2 += b * b;
  }
  const mean = sum / n;
  // tonal range of the image itself, measured on 4×4 block averages so a
  // screen's dot or line pattern doesn't count as contrast
  const B = [];
  for (let y = 0; y + 4 <= h; y += 4) {
    for (let x = 0; x + 4 <= w; x += 4) {
      let b = 0;
      for (let k = 0; k < 16; k++) b += L[(y + (k >> 2)) * w + x + (k & 3)];
      B.push(b / 16);
    }
  }
  B.sort((a, b) => a - b);
  const range = B[Math.floor(B.length * 0.97)] - B[Math.floor(B.length * 0.03)];
  const mrg = rg / n, myb = yb / n;
  const colorful = Math.sqrt(Math.max(0, rg2 / n - mrg * mrg + yb2 / n - myb * myb)) + 0.3 * Math.hypot(mrg, myb);
  let hf = 0;
  for (let y = 0; y < h - 1; y++) {
    for (let x = 0; x < w - 1; x++) {
      const i = y * w + x;
      hf += Math.abs(L[i] - L[i + 1]) + Math.abs(L[i] - L[i + w]);
    }
  }
  hf /= 2 * (w - 1) * (h - 1);

  let s = Math.min(range, 0.8) * 0.5 + Math.min(colorful, 0.45) * 0.4;   // some richness is good
  s -= Math.max(0, 0.4 - range) * 3;                                      // flat
  s -= Math.max(0, clip / n - 0.06) * 5;                                  // blown out
  s -= Math.max(0, black / n - (dark ? 0.8 : 0.35)) * 3;                  // crushed
  s -= Math.max(0, (dark ? 0.04 : 0.1) - mean) * 4 + Math.max(0, mean - 0.8) * 4;
  if (!screen) s -= Math.max(0, hf - 0.055) * 7;                          // busy
  s -= Math.max(0, colorful - 0.7) * 1.5;                                 // garish
  return s;
}

// ── per-section dice ─────────────────────────────────────────────────────────
function randomizeParams(state, section) {
  for (const p of PARAMS) {
    if (!p.key.startsWith(section + '.') || p.rnd === false || p.type === 'chips' || p.type === 'color') continue;
    if (p.type === 'select') {
      setPath(state, p.key, p.options[Math.floor(Math.random() * p.options.length)].value);
      continue;
    }
    if (p.type === 'toggle') continue;
    const [lo, hi] = p.rnd || [p.min, p.max];
    let v = rand(lo, hi);
    if (p.type !== 'range') v = Math.round(v);
    else v = +v.toFixed(3);
    setPath(state, p.key, v);
  }
}

export function randomizeSection(state, section) {
  switch (section) {
    case 'source': {
      if (state.source.type === 'fluid' || state.source.type === 'image') state.source.type = 'silk';
      const form = state.source.form;
      randomizeParams(state, 'source');
      state.source.form = form;
      state.source.offsetX = 0;
      state.source.offsetY = 0;
      if (chance(0.6)) state.source.twist = 0;
      if (chance(0.7)) state.source.blur = 0;
      if (chance(0.5)) state.source.ridge = 0;
      if (state.source.type === 'threads' && chance(0.5)) state.source.thrConverge = 0;
      break;
    }
    case 'color': {
      state.color.stops = palette();
      randomizeParams(state, 'color');
      if (chance(0.12)) {
        state.color.repeat = r(1.5, 3.5);
        state.color.mirror = true;
      } else state.color.repeat = 1;
      break;
    }
    case 'surface': {
      // one material at a time
      const f = state.surface;
      Object.assign(f, { relief: 0, gloss: 0, chrome: 0, liquid: 0, iridescence: 0, sparkle: 0 });
      const mat = weighted({ relief: 2, chrome: 1, liquid: 1, iridescence: 1 });
      if (mat === 'relief') Object.assign(f, { relief: r(0.3, 0.7), gloss: r(0.2, 0.7), glossSize: r(0.3, 0.8) });
      if (mat === 'chrome') Object.assign(f, { chrome: r(0.7, 1), gloss: r(0.2, 0.5), iridescence: chance(0.4) ? r(0.3, 0.6) : 0, film: r(0.2, 0.7) });
      if (mat === 'liquid') Object.assign(f, { liquid: r(0.5, 0.9), gloss: r(0.4, 0.7), glossSize: r(0.7, 0.9) });
      if (mat === 'iridescence') Object.assign(f, { iridescence: r(0.3, 0.7), film: r(0.15, 0.7) });
      if (chance(0.25)) Object.assign(f, { sparkle: r(0.2, 0.5), sparkleDensity: r(0.3, 0.8) });
      break;
    }
    case 'glass': {
      if (state.glass.type === 'none') {
        state.glass.type = weighted({ reeded: 4, wavy: 1.5, rings: 1, tiles: 1.2, hammered: 1, water: 1, crystal: 1, rain: 1, pyramid: 1.2 });
      }
      randomizeParams(state, 'glass');
      const g = state.glass;
      if (g.type === 'water') g.count = r(3, 10, 1);
      if (g.type === 'tiles' || g.type === 'hammered' || g.type === 'crystal') g.count = r(5, 18, 1);
      if (g.type === 'rain') { g.count = r(6, 16, 1); g.frost = r(0.3, 0.7); }
      else if (chance(0.6)) g.frost = 0;
      if (chance(0.6)) g.dispersion = 0;
      if (chance(0.7)) g.jitter = 0;
      if (chance(0.5)) g.angle = 0;
      if (chance(0.7)) g.streak = 0;
      if (chance(0.6)) g.caustics = 0;
      if (chance(0.75)) g.tintAmount = 0;
      g.highlight = Math.min(g.highlight, 0.12);
      g.reflect = Math.min(g.reflect, 0.25);
      g.panel = 'full';
      g.backType = chance(0.85) ? 'none' : pick(['reeded', 'tiles', 'hammered', 'water']);
      break;
    }
    case 'light': {
      randomizeParams(state, 'light');
      state.light.env = weighted({ studio: 4, palette: 2, window: 1.5, dark: 1 });
      break;
    }
    case 'screen': {
      if (state.screen.type === 'none') state.screen.type = weighted({ halftone: 3, lines: 2, moire: 1.5, led: 2, crt: 1, mosaic: 1, contour: 1.5, dither: 1 });
      randomizeParams(state, 'screen');
      state.screen.colorMode = chance(0.75) ? 'source' : 'mono';
      if (state.screen.colorMode === 'mono') [state.screen.ink, state.screen.paper] = pick(INK_PAPER);
      if (state.screen.type === 'mosaic') state.screen.size = ri(20, 70);
      if (state.screen.type === 'dither') state.screen.size = ri(140, 320);
      state.screen.mix = 1;
      break;
    }
    case 'finish': {
      // Effects only; the grading (brightness, contrast, saturation, hue) stays as it is.
      const keep = (({ exposure, contrast, saturation, hue }) => ({ exposure, contrast, saturation, hue }))(state.finish);
      randomizeParams(state, 'finish');
      Object.assign(state.finish, keep);
      state.finish.grain = r(0, 0.12);
      if (chance(0.7)) state.finish.bloom = 0;
      if (chance(0.75)) state.finish.aberration = 0;
      if (chance(0.85)) state.finish.streak = 0;
      if (chance(0.5)) state.finish.vignette = 0;
      break;
    }
  }
}

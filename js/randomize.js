// "Surprise me" — randomizes within ranges that tend to look good.

import { PARAMS, setPath, getPath } from './schema.js';
import { PALETTES, randomPalette } from './palette.js';

const rand = (a, b) => a + Math.random() * (b - a);
const chance = (p) => Math.random() < p;

function weighted(table) {
  const total = Object.values(table).reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (const [k, w] of Object.entries(table)) if ((r -= w) <= 0) return k;
  return Object.keys(table)[0];
}

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

export function randomizeSection(state, section, { pickType = false } = {}) {
  switch (section) {
    case 'source': {
      const cur = state.source.type;
      if (pickType || cur === 'fluid' || cur === 'image') {
        if (pickType) state.source.type = weighted({ silk: 3, bands: 2, mesh: 2.5, ribbons: 1.3, shapes: 1.5 });
      }
      randomizeParams(state, 'source');
      state.source.offsetX = 0;
      state.source.offsetY = 0;
      if (chance(0.6)) state.source.twist = 0;
      if (chance(0.7)) state.source.blur = 0;
      if (chance(0.5)) state.source.ridge = 0;
      break;
    }
    case 'color': {
      state.color.stops = chance(0.55)
        ? structuredClone(PALETTES[Math.floor(Math.random() * PALETTES.length)].stops)
        : randomPalette();
      randomizeParams(state, 'color');
      if (chance(0.65)) state.color.relief = 0;
      if (chance(0.6)) state.color.gloss = 0;
      if (chance(0.12)) {
        state.color.repeat = +rand(1.5, 3.5).toFixed(2);
        state.color.mirror = true;
      } else state.color.repeat = 1;
      break;
    }
    case 'glass': {
      if (pickType || state.glass.type === 'none') {
        state.glass.type = weighted(pickType
          ? { none: 2, reeded: 4, wavy: 1.5, rings: 1, tiles: 1.2, hammered: 1, water: 1, crystal: 1, rain: 1, pyramid: 1.2 }
          : { reeded: 4, wavy: 1.5, rings: 1, tiles: 1.2, hammered: 1, water: 1, crystal: 1, rain: 1, pyramid: 1.2 });
      }
      randomizeParams(state, 'glass');
      const g = state.glass;
      if (g.type === 'water') g.count = +rand(3, 10).toFixed(1);
      if (g.type === 'tiles' || g.type === 'hammered' || g.type === 'crystal') g.count = +rand(5, 18).toFixed(1);
      if (g.type === 'rain') { g.count = +rand(6, 16).toFixed(1); g.frost = +rand(0.3, 0.7).toFixed(2); }
      else if (chance(0.6)) g.frost = 0;
      if (chance(0.6)) g.dispersion = 0;
      if (chance(0.7)) g.jitter = 0;
      if (chance(0.5)) g.angle = 0;
      if (chance(0.7)) g.streak = 0;
      if (chance(0.6)) g.caustics = 0;
      if (chance(0.75)) g.tintAmount = 0;
      if (chance(0.5)) g.highlight = 0;
      g.backType = chance(0.8) ? 'none' : ['reeded', 'tiles', 'hammered', 'water'][Math.floor(Math.random() * 4)];
      break;
    }
    case 'light': {
      randomizeParams(state, 'light');
      state.light.env = weighted({ studio: 4, palette: 2, window: 1.5, dark: 1 });
      break;
    }
    case 'screen': {
      if (pickType || state.screen.type === 'none') {
        state.screen.type = pickType && chance(0.55)
          ? 'none'
          : weighted({ halftone: 3, lines: 2, led: 2, crt: 1, mosaic: 1, contour: 1.5, dither: 1 });
      }
      randomizeParams(state, 'screen');
      state.screen.colorMode = chance(0.75) ? 'source' : 'mono';
      if (state.screen.type === 'mosaic') state.screen.size = Math.round(rand(20, 70));
      if (state.screen.type === 'dither') state.screen.size = Math.round(rand(140, 320));
      state.screen.mix = 1;
      break;
    }
    case 'finish': {
      randomizeParams(state, 'finish');
      if (chance(0.7)) state.finish.bloom = 0;
      if (chance(0.75)) state.finish.aberration = 0;
      if (chance(0.5)) state.finish.vignette = 0;
      if (chance(0.3)) state.finish.grain = 0;
      state.finish.hue = 0;
      break;
    }
  }
}

export function randomizeAll(state) {
  for (const s of ['source', 'color', 'glass', 'light', 'screen', 'finish']) randomizeSection(state, s, { pickType: true });
  // Glass *and* a screen on top of a busy flow is usually too much — mostly pick one.
  if (state.glass.type !== 'none' && state.screen.type !== 'none' && chance(0.7)) state.screen.type = 'none';
  if (state.glass.type !== 'none' || state.screen.type !== 'none') {
    state.color.relief = Math.min(state.color.relief, 0.3);
    if (state.source.type === 'silk') state.source.detail = Math.min(state.source.detail, 4);
  }
}

export { getPath };

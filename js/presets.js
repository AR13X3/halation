// Built-in looks. Each preset only lists values that differ from the defaults
// in schema.js — everything else falls back to the default.
// Every look shows off a different feature (flow source, glass type, screen…).

// Evenly spaced gradient stops.
const P = (...colors) => colors.map((color, i) => ({ pos: +(i / (colors.length - 1)).toFixed(3), color }));

export const PRESETS = [
  {
    id: 'coral-reeds', // reeded glass, linear profile, negative refraction = stepped bands
    name: 'Coral Reeds',
    look: {
      source: { type: 'bands', bandCount: 2, bandWidth: 0.16, bandSpacing: 0.34, bandAngle: -40, bandLength: 1.3, warp: 0.6, seed: 21 },
      color: { stops: P('#1b0f2e', '#7a2e5c', '#ff7a59', '#ffd8b0'), spread: 1.15 },
      glass: { type: 'reeded', count: 12, strength: -0.8, profile: 'linear', shadow: 0.2, highlight: 0, reflect: 0 },
      finish: { grain: 0.3 },
      anim: { speed: 0.5 },
    },
  },
  {
    id: 'plum-halftone', // diamond halftone screen
    name: 'Plum Halftone',
    look: {
      source: { type: 'silk', scale: 1.2, warp: 1.2, ridge: 0.3, detail: 3, twist: -1.2, seed: 58 },
      color: { stops: P('#14060f', '#5a1640', '#c94f7c', '#f7d6c4'), spread: 1.35, shift: 0.02 },
      screen: { type: 'halftone', size: 72, angle: 15, dotShape: 'diamond', background: 0.15, glow: 0.1, contrast: 1.2 },
      finish: { grain: 0.05 },
    },
  },
  {
    id: 'lava-flutes', // round flutes with caustics
    name: 'Lava Flutes',
    look: {
      source: { type: 'mesh', meshCount: 4, meshBlend: 1.3, warp: 1, seed: 8 },
      color: { stops: P('#050101', '#4a0a07', '#d12d0f', '#ffb02e'), spread: 1.35 },
      glass: { type: 'reeded', count: 26, strength: 0.5, profile: 'round', shadow: 0.5, highlight: 0.08, reflect: 0.12, caustics: 0.35 },
      finish: { grain: 0.02, vignette: 0.3 },
    },
  },
  {
    id: 'amber-terminal', // LED matrix, square pixels
    name: 'Amber Terminal',
    look: {
      source: { type: 'silk', scale: 1.5, warp: 0.9, detail: 3, twist: -1.5, seed: 12 },
      color: { stops: P('#000000', '#2a1300', '#ff9a1f', '#ffe0a3'), spread: 2.2, shift: -0.25 },
      screen: { type: 'led', size: 90, ledShape: 'square', dotScale: 0.72, glow: 0.35, background: 0 },
      finish: { bloom: 0.4, bloomRadius: 0.35, bloomThreshold: 0.45, grain: 0 },
    },
  },
  {
    id: 'lilac-waves', // wavy line screen
    name: 'Lilac Waves',
    look: {
      source: { type: 'mesh', meshCount: 5, meshBlend: 1.2, warp: 1.1, seed: 44 },
      color: { stops: P('#2b1a4a', '#7d5fc4', '#c9b6f2', '#fbf7ff'), spread: 1.4 },
      screen: { type: 'lines', lineShape: 'waves', size: 80, angle: 0, dotScale: 0.6, background: 0.85, glow: 0.35, invert: true },
      finish: { grain: 0.25 },
    },
  },
  {
    id: 'dune-contours', // contour lines over the image
    name: 'Dune Contours',
    look: {
      source: { type: 'silk', scale: 2.4, warp: 0.5, detail: 3, seed: 90 },
      color: { stops: P('#3d2414', '#a8683a', '#e8c08a', '#fff3dc'), spread: 1.1 },
      screen: { type: 'contour', lineCount: 16, lineWidth: 1.6, colorMode: 'source', glow: 1, fill: true, indexEvery: 4 },
      finish: { grain: 0.06 },
      anim: { speed: 0.35 },
    },
  },
  {
    id: 'lagoon-ribbons', // ribbons with relief + gloss
    name: 'Lagoon Ribbons',
    look: {
      source: { type: 'ribbons', ribLines: 34, ribWidth: 0.6, ribThick: 0.07, ribGlow: 0.5, ribAmp: 1.3, ribFreq: 0.8, ribFan: -0.6, ribAngle: 15, warp: 0.5, seed: 33 },
      color: { stops: P('#011a1f', '#05515c', '#2ec4b6', '#e8fffb'), spread: 1.15, relief: 0.3, gloss: 0.35 },
      finish: { bloom: 0.4, bloomRadius: 0.45, bloomThreshold: 0.5, grain: 0.04 },
    },
  },
  {
    id: 'rose-metal', // liquid metal via relief + gloss
    name: 'Rose Metal',
    look: {
      source: { type: 'silk', scale: 1.3, warp: 1.1, ridge: 0.6, detail: 4, seed: 412 },
      color: { stops: P('#1a0c0c', '#6e3a35', '#d99a8a', '#fff0ea'), spread: 1.3, relief: 0.75, gloss: 0.85, glossSize: 0.55 },
      light: { angle: 65 },
      finish: { grain: 0.04, vignette: 0.3 },
    },
  },
  {
    id: 'amethyst-facets', // crystal glass with dispersion
    name: 'Amethyst Facets',
    look: {
      source: { type: 'silk', scale: 1.2, warp: 1.3, detail: 4, seed: 141 },
      color: { stops: P('#0e0418', '#4a1a7a', '#b46cf0', '#f6e9ff'), spread: 1.5, shift: -0.05 },
      glass: { type: 'crystal', count: 5, strength: 0.8, dispersion: 0.5, highlight: 0.25, reflect: 0.3, sharpness: 0.55 },
      finish: { grain: 0.03 },
    },
  },
  {
    id: 'neon-rain', // rain drops on a fogged window
    name: 'Neon Rain',
    look: {
      source: { type: 'mesh', meshCount: 7, meshBlend: 2.6, warp: 0.6, seed: 5 },
      color: { stops: P('#03030a', '#1d0a3a', '#ff2e88', '#38e8ff'), spread: 1.6, shift: -0.1 },
      glass: { type: 'rain', count: 10, strength: 0.9, frost: 0.65, coverage: 0.5, jitter: 0.4, highlight: 0.3, reflect: 0.2 },
      finish: { grain: 0.06, vignette: 0.3 },
      anim: { speed: 0.4 },
    },
  },
  {
    id: 'peach-streaks', // streaks + tint + caustics
    name: 'Peach Streaks',
    look: {
      source: { type: 'mesh', meshCount: 5, meshBlend: 1.6, warp: 0.8, seed: 64 },
      color: { stops: P('#0d0612', '#5a2340', '#ff9e7a', '#fff4e8'), spread: 1.35, shift: 0.06 },
      glass: { type: 'reeded', count: 18, strength: 0.7, streak: 0.6, caustics: 0.45, tintAmount: 0.35, tint: '#ffc2a8', highlight: 0.15, reflect: 0.25, sharpness: 0.45 },
      light: { angle: 50, color: '#ffe4d6' },
      finish: { grain: 0.05, bloom: 0.3, bloomThreshold: 0.6 },
    },
  },
  {
    id: 'teal-blocks', // glass-block tiles with frost
    name: 'Teal Blocks',
    look: {
      source: { type: 'mesh', meshCount: 5, meshBlend: 1.4, warp: 1, seed: 71 },
      color: { stops: P('#04222a', '#0f6b70', '#f29b55', '#fff1d6'), spread: 1.25, shift: -0.08 },
      glass: { type: 'tiles', count: 6, profile: 'block', strength: 0.6, frost: 0.2, shadow: 0.08, highlight: 0, reflect: 0.1 },
      finish: { grain: 0.08 },
    },
  },
  {
    id: 'copper-hammered', // hammered glass
    name: 'Copper Hammered',
    look: {
      source: { type: 'mesh', meshCount: 5, meshBlend: 1.5, warp: 1.2, seed: 27 },
      color: { stops: P('#120804', '#5c2a12', '#d9783a', '#ffd9b0'), spread: 1.3 },
      glass: { type: 'hammered', count: 10, strength: 0.8, highlight: 0.12, shadow: 0.3, jitter: 0.6, caustics: 0.35 },
      finish: { grain: 0.05 },
    },
  },
  {
    id: 'dusk-pool', // water surface
    name: 'Dusk Pool',
    look: {
      source: { type: 'bands', bandCount: 3, bandWidth: 0.12, bandSpacing: 0.22, bandAngle: 25, warp: 1.4, seed: 61 },
      color: { stops: P('#1b1035', '#3f3a9c', '#ff8fab', '#ffe6c9'), spread: 1.1 },
      glass: { type: 'water', count: 5, strength: 0.8, shadow: 0.25, highlight: 0, reflect: 0.1, caustics: 0.1 },
      finish: { grain: 0.08, vignette: 0.2 },
    },
  },
  {
    id: 'slate-quilt', // two crossed panes of reeded glass
    name: 'Slate Quilt',
    look: {
      source: { type: 'bands', bandCount: 2, bandWidth: 0.2, bandSpacing: 0.4, bandAngle: 35, warp: 1.1, seed: 5 },
      color: { stops: P('#1e2433', '#55607a', '#d9a5a0', '#f7efe9'), spread: 1.5, shift: -0.05 },
      glass: { type: 'reeded', count: 7, strength: 0.6, backType: 'reeded', backCount: 7, backAngle: 90, backStrength: 0.6, profile: 'wave', highlight: 0, reflect: 0.08, caustics: 0, shadow: 0.25 },
      finish: { grain: 0.06 },
    },
  },
  {
    id: 'pearl-waves', // wavy flutes, dispersion, palette reflections
    name: 'Pearl Waves',
    look: {
      source: { type: 'silk', scale: 1.3, warp: 1, ridge: 0.3, seed: 300 },
      color: { stops: P('#6f63a8', '#8fc8e0', '#f2b8d4', '#fffaf0'), spread: 1.6, shift: -0.05 },
      glass: { type: 'wavy', count: 12, strength: 0.7, wave: 0.7, waveFreq: 1.2, profile: 'round', dispersion: 0.6, highlight: 0.15, reflect: 0.25, shadow: 0.2 },
      light: { env: 'palette' },
      finish: { grain: 0.03 },
    },
  },
  {
    id: 'synth-crt', // CRT shadow mask + bloom + aberration
    name: 'Synth CRT',
    look: {
      source: { type: 'bands', bandCount: 3, bandWidth: 0.1, bandSpacing: 0.2, bandAngle: 0, warp: 1.3, seed: 77 },
      color: { stops: P('#0a0014', '#5b0f8a', '#ff3fa4', '#ffd23f'), spread: 1.3 },
      screen: { type: 'crt', size: 150, dotScale: 0.85, glow: 0.4, contrast: 1.1 },
      finish: { bloom: 0.5, bloomRadius: 0.4, bloomThreshold: 0.4, vignette: 0.45, aberration: 0.3, grain: 0.04 },
    },
  },
  {
    id: 'riso-print', // 1-bit dither in ink & paper
    name: 'Riso Print',
    look: {
      source: { type: 'silk', scale: 1.4, warp: 1.5, detail: 4, seed: 19 },
      color: { stops: P('#000000', '#ffffff'), spread: 1.4 },
      screen: { type: 'dither', size: 240, levels: 2, colorMode: 'mono', ink: '#ff3d7f', paper: '#f6f0e4', contrast: 1.2 },
      finish: { grain: 0 },
    },
  },
  {
    id: 'terracotta-mosaic', // hexagon mosaic
    name: 'Terracotta Mosaic',
    look: {
      source: { type: 'bands', bandCount: 2, bandWidth: 0.2, bandAngle: -30, warp: 1.3, seed: 48 },
      color: { stops: P('#2a120b', '#a0452a', '#e79a6c', '#f8e6d2'), spread: 1.7, shift: -0.2 },
      screen: { type: 'mosaic', mosaicShape: 'hex', size: 34, dotScale: 0.92, glow: 0.5, background: 0.05 },
      finish: { grain: 0.05 },
    },
  },
  {
    id: 'saffron-ink', // interactive fluid behind wavy glass
    name: 'Saffron Ink',
    look: {
      source: { type: 'fluid', fluidStreams: 3, fluidCurl: 18, fluidInk: 2.2, fluidInkFade: 0.3, fluidGain: 1.8, blur: 0.06 },
      color: { stops: P('#0a0a24', '#2b1f6e', '#e0821b', '#ffe7a8'), spread: 1.1 },
      glass: { type: 'wavy', count: 18, strength: 0.5, wave: 0.4, waveFreq: 1, shadow: 0.3, highlight: 0.05 },
      finish: { grain: 0.12 },
    },
  },
];

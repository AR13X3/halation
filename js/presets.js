// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 AR13X3 — Halation (https://github.com/AR13X3/halation)
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
      color: { stops: P('#011a1f', '#05515c', '#2ec4b6', '#e8fffb'), spread: 1.15 },
      surface: { relief: 0.3, gloss: 0.35 },
      finish: { bloom: 0.4, bloomRadius: 0.45, bloomThreshold: 0.5, grain: 0.04 },
    },
  },
  {
    id: 'rose-metal', // liquid metal via relief + gloss
    name: 'Rose Metal',
    look: {
      source: { type: 'silk', scale: 1.3, warp: 1.1, ridge: 0.6, detail: 4, seed: 412 },
      color: { stops: P('#1a0c0c', '#6e3a35', '#d99a8a', '#fff0ea'), spread: 1.3 },
      surface: { relief: 0.75, gloss: 0.85, glossSize: 0.55 },
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
  {
    id: 'moire-ribbon', // silhouette + moiré screen + iridescence
    name: 'Moiré Ribbon',
    look: {
      source: { type: 'mesh', meshCount: 6, meshBlend: 1.2, warp: 0.9, seed: 31, form: 'ribbon', formSize: 0.38, formWave: 1.6, formDepth: 0.85, formSoft: 0, formBg: '#0a0c0b' },
      color: { stops: [{ pos: 0, color: '#050b26' }, { pos: 0.3, color: '#123596' }, { pos: 0.55, color: '#2f6be0' }, { pos: 0.72, color: '#7fb3ff' }, { pos: 0.84, color: '#ff9a7a' }, { pos: 0.93, color: '#ffd37a' }, { pos: 1, color: '#d8ecff' }], spread: 1 },
      surface: { iridescence: 0.35, film: 0.3 },
      screen: { type: 'moire', size: 280, angle: 20, bend: 2, interference: 2.5, background: 0.5, dotScale: 0.9, glow: 0.2 },
      finish: { grain: 0.04 },
    },
  },
  {
    id: 'liquid-glass', // liquid surface + gloss + sparkle
    name: 'Liquid Glass',
    look: {
      source: { type: 'silk', scale: 0.65, warp: 1.3, ridge: 0.85, detail: 1, twist: 0.8, seed: 77 },
      color: { stops: P('#071a3a', '#1b4a86', '#5b8fcc', '#d8ebff'), spread: 0.95 },
      surface: { liquid: 0.8, gloss: 0.6, glossSize: 0.85, sparkle: 0.6, sparkleDensity: 0.3 },
      finish: { bloom: 0.5, bloomThreshold: 0.6, grain: 0.03 },
      anim: { speed: 0.4 },
    },
  },
  {
    id: 'prism-filaments', // converging threads with spectral fringes
    name: 'Prism Filaments',
    look: {
      source: { type: 'threads', thrConverge: 1, thrSpread: 1.1, thrCount: 9, thrDepth: 0.7, thrGlow: 0.45, thrBreak: 0.15, thrWeight: 2, warp: 2, rotation: 25, seed: 3 },
      color: { stops: P('#04050e', '#151a52', '#6e7dff', '#ffffff') },
      finish: { bloom: 0.55, aberration: 0.8, aberrationMode: 'orbit', grain: 0.03 },
      anim: { speed: 0.4 },
    },
  },
  {
    id: 'indigo-harp', // many fine threads, loosely converging
    name: 'Indigo Harp',
    look: {
      source: { type: 'threads', scale: 4, thrConverge: 0.69, thrSpread: 1.1, thrCount: 15.5, thrDepth: 0.68, thrGlow: 0.33, thrBreak: 0.14, thrWeight: 1, warp: 1, rotation: 25, seed: 3 },
      color: { stops: P('#04050e', '#151a52', '#6e7dff', '#ffffff') },
      finish: { bloom: 0.55, aberration: 0.8, aberrationMode: 'orbit', grain: 0.03 },
      anim: { speed: 0.4 },
    },
  },
  {
    id: 'ember-bow', // unbroken threads bowing around an off-frame pinch
    name: 'Ember Bow',
    look: {
      source: { type: 'threads', scale: 2.58, rotation: 90, offsetY: -0.163, thrConverge: 0.6, thrSpread: 0.4, thrCount: 70, thrWeight: 2.1, thrBreak: 0, thrGlow: 0.6, thrDepth: 0.5, warp: 0.5, seed: 9 },
      color: { stops: P('#000000', '#4a1a06', '#ff9a4a', '#fff6ea') },
      surface: { sparkle: 0.5, sparkleDensity: 0.8 },
      finish: { bloom: 0.6, aberration: 0.5, aberrationMode: 'orbit', streak: 0.2, grain: 0.04 },
    },
  },
  {
    id: 'moss-reeds', // a diagonal chain of solid objects behind frosted linear reeds, raking light
    name: 'Moss Reeds',
    look: {
      source: { type: 'none', bgAngle: -158, gradLength: 0.479, gradShift: -0.22525, gradRange: 0.4 },
      objects: {
        count: 5, drift: 1.15, seed: 21, soft: 0, shadow: 0, scale: 0.479, rotation: -68, offsetX: -0.0272, offsetY: -0.265,
        o1Material: 'solid', o1Shape: 'sphere', o1Tone: 0.62, o1Size: 0.5806, o1X: 0.3347, o1Y: 0.8171, o1Angle: 13.8651,
        o2Material: 'solid', o2Shape: 'link', o2Tone: 0.715, o2Size: 0.6483, o2Length: 1, o2X: 0.1109, o2Y: 0.3761, o2Angle: -28.4688,
        o3Material: 'solid', o3Shape: 'pill', o3Tone: 0.81, o3Size: 0.6486, o3X: -0.0348, o3Y: 0.0497, o3Angle: 54.2519,
        o4Material: 'solid', o4Shape: 'sphere', o4Tone: 0.905, o4Size: 0.5696, o4Length: 1, o4X: -0.1386, o4Y: -0.3614, o4Angle: 44.5833,
        o5Material: 'solid', o5Shape: 'link', o5Tone: 1, o5Size: 0.6334, o5X: -0.38, o5Y: -0.8638, o5Angle: -64.7935,
      },
      color: { stops: P('#06120b', '#1c3b26', '#5a8f5e', '#e1edc5'), spread: 1.15 },
      glass: { type: 'reeded', count: 12, profile: 'linear', strength: 0.26, ior: 1.19, frost: 0.21, streak: 0.13, reflect: 0.39, highlight: 0.04, shadow: 0.2 },
      light: { angle: 278, elevation: 7 },
      finish: { grain: 0 },
      anim: { speed: 0.07, duration: 7 },
    },
  },
  {
    id: 'mercury-silk', // liquid chrome, no iridescence
    name: 'Mercury Silk',
    look: {
      source: { type: 'silk', scale: 2.195, warp: 1.6, ridge: 0.25, detail: 3, rotation: 35, seed: 140 },
      color: { stops: P('#18191f', '#4a4e5c', '#a3a8b6', '#d4d8e2') },
      surface: { chrome: 1, liquid: 0.6, film: 0.55, gloss: 0.46, glossSize: 0 },
      light: { angle: 210, elevation: 55 },
      finish: { grain: 0.03 },
      anim: { speed: 0.4 },
    },
  },
  {
    id: 'emerald-pour', // liquid surface + broad gloss + sparse sparkle
    name: 'Emerald Pour',
    look: {
      source: { type: 'silk', scale: 1.53, warp: 1.56, ridge: 0.63, detail: 1, twist: -0.63, seed: 6590 },
      color: { stops: P('#000b04', '#054021', '#0e8352', '#08d399', '#f3fff5'), spread: 0.96 },
      surface: { liquid: 0.89, gloss: 0.67, glossSize: 0.79, sparkle: 0.35, sparkleDensity: 0.21 },
      light: { angle: 211, elevation: 57 },
      finish: { bloom: 0.33, bloomThreshold: 0.6, grain: 0.03 },
    },
  },
];

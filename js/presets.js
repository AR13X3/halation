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
  {
    id: 'berry-wave', // bands behind wavy glass
    name: 'Berry Wave',
    look: {
      source: { type: 'bands', bandCount: 4, bandWidth: 0.14, bandSpacing: 0.32, bandAngle: 20, warp: 0.9, seed: 23 },
      color: { stops: P('#12030d', '#6d0f3c', '#ff4f8b', '#ffd6e5'), spread: 1.25 },
      glass: { type: 'wavy', count: 9, strength: 0.75, wave: 0.8, waveFreq: 1.3, highlight: 0.04, reflect: 0.1, shadow: 0.35 },
      finish: { grain: 0.04 },
    },
  },
  {
    id: 'neon-contours', // glowing contour screen over a mesh
    name: 'Neon Contours',
    look: {
      source: { type: 'mesh', warp: 1.2, seed: 13 },
      color: { stops: P('#05020f', '#2a0b5c', '#ff3fa4', '#ffe36e') },
      screen: { type: 'contour', lineCount: 22, lineWidth: 1.6, indexEvery: 5, glow: 0.8, background: 0.05 },
      finish: { bloom: 0.5, bloomThreshold: 0.35, grain: 0.03 },
    },
  },
  {
    id: 'navy-rings', // ring line screen in ink & paper
    name: 'Navy Rings',
    look: {
      source: { type: 'mesh', meshCount: 4, meshBlend: 1.3, warp: 1, seed: 52 },
      color: { stops: P('#000000', '#ffffff'), spread: 1.3 },
      screen: { type: 'lines', lineShape: 'rings', size: 70, centerX: -0.4, centerY: -0.5, colorMode: 'mono', ink: '#1b2a6b', paper: '#efe9dc', contrast: 1.2 },
      finish: { grain: 0.04 },
    },
  },
  {
    id: 'pearl-orbs', // frosted glass spheres filled with library gradients
    name: 'Pearl Orbs',
    look: {
      source: { type: 'none', gradShape: 'radial', gradLength: 1.4 },
      objects: { count: 3, refraction: 0.35, rim: 0.45, seed: 4, o1Shape: 'sphere', o1Fill: 'gradient', o1Gradient: 'Pearl', o1GradAngle: 60, o1Size: 0.56, o1Y: 0.12, o1Tint: 0.75, o1Frost: 0.85, o2Shape: 'sphere', o2Fill: 'gradient', o2Gradient: 'Candy', o2GradAngle: -30, o2Size: 0.34, o2X: 0.13, o2Y: -0.16, o2Tint: 0.7, o2Frost: 0.85, o3Fill: 'gradient', o3Gradient: 'Lilac', o3GradAngle: 120, o3Size: 0.2, o3X: -0.12, o3Y: -0.28, o3Tint: 0.6, o3Frost: 0.8 },
      color: { stops: P('#fdf7f2', '#efe2f2', '#d8d6f0') },
      light: { angle: 115, elevation: 55 },
      finish: { grain: 0.02 },
    },
  },
  {
    id: 'onyx-prism', // thick converging threads, liquid + iridescent surface, orbit aberration
    name: 'Onyx Prism',
    look: {
      source: { type: 'threads', thrCount: 4, thrSpread: 1, thrConverge: 0.45, thrWeight: 16, thrGlow: 0.12, thrBreak: 0, warp: 1.8, rotation: 35, seed: 12 },
      color: { stops: P('#000000', '#000000', '#060709', '#22252c', '#8a909c') },
      surface: { liquid: 0.8, iridescence: 0.8, film: 0.55, relief: 0.5, gloss: 1, glossSize: 0.7 },
      light: { angle: 50, elevation: 22, intensity: 2 },
      finish: { exposure: 0.35, aberration: 1, aberrationMode: 'orbit', bloom: 0.7, bloomThreshold: 0.35, grain: 0.03, vignette: 0.5 },
    },
  },
  {
    id: 'opal-wave', // ribbon lines with relief + iridescence, like holographic grooves
    name: 'Opal Wave',
    look: {
      source: { type: 'ribbons', ribLines: 30, ribWidth: 0.18, ribThick: 0.07, ribAmp: 1, ribFan: 0.5, warp: 0.2, seed: 8 },
      color: { stops: P('#000000', '#0a0a20', '#8090c0', '#e0e8ff', '#ffffff'), spread: 1.4 },
      surface: { relief: 0.5, iridescence: 1, film: 0.5, gloss: 0.4, glossSize: 0.6 },
      finish: { exposure: 0.45, saturation: 1.35, bloom: 0.55, bloomThreshold: 0.45, aberration: 0.6, aberrationMode: 'orbit', grain: 0.03, contrast: 1.2 },
    },
  },
  {
    id: 'cobalt-flutes', // radial glow on the upper-left third behind fine reeded glass
    name: 'Cobalt Flutes',
    look: {
      source: { type: 'none', gradShape: 'radial', gradX: -0.4, gradY: 0.4, gradLength: 1.2, gradRipple: 0.8, gradRippleSize: 2 },
      color: { stops: P('#9af2ff', '#22b4f0', '#0a5ad0', '#04204e', '#010612', '#000205'), spread: 1 },
      glass: { type: 'reeded', count: 46, jitter: 0.35, shadow: 0.55, highlight: 0.05, streak: 0.35 },
      finish: { grain: 0.04 },
    },
  },
  {
    id: 'indigo-satin', // silhouette ribbon tilted into a diagonal, liquid + gloss satin
    name: 'Indigo Satin',
    look: {
      source: { scale: 2.6, warp: 1.4, ridge: 0.4, detail: 1, rotation: 20, seed: 140, form: 'ribbon', formSize: 0.75, formWave: 1.2, formSoft: 0.05, formAngle: -35, formBg: '#03040e' },
      color: { stops: P('#04051a', '#0a0f4a', '#1e2a90', '#4a5ad0', '#9aa4f0', '#e4e2ff') },
      surface: { liquid: 0.5, relief: 0.5, gloss: 0.9, glossSize: 0.45 },
      light: { angle: 140, elevation: 35, intensity: 1.3 },
      finish: { saturation: 0.85, grain: 0.04 },
    },
  },
  {
    id: 'ivory-matrix', // rippled gradient band on an LED screen
    name: 'Ivory Matrix',
    look: {
      source: { type: 'none', bgAngle: 60, gradLength: 0.9, gradShift: -0.04, gradRipple: 1.6, gradRippleSize: 2.6 },
      color: { stops: P('#000000', '#000000', '#2a2826', '#a8a094', '#f6f1e8'), spread: 1, repeat: 2.6 },
      screen: { type: 'led', size: 90, dotScale: 0.95, glow: 0.25, background: 0 },
      finish: { bloom: 0.15, grain: 0 },
    },
  },
  {
    id: 'neon-hourglass', // converging threads as a soft hourglass, speckle grain
    name: 'Neon Hourglass',
    look: {
      source: { type: 'threads', thrCount: 10, thrConverge: 0.55, thrSpread: 0.22, thrWeight: 3.5, thrGlow: 1, thrDepth: 1, thrBreak: 0, warp: 0.9, blur: 0.4, rotation: 90, seed: 6 },
      color: { stops: P('#000000', '#05030f', '#1a2a8a', '#4a6aff', '#ff5ab0', '#ffa050', '#fff4e0'), shift: 0.12 },
      finish: { speckle: 0.5, grain: 0.14, bloom: 0.25 },
    },
  },
  {
    id: 'amber-smoke', // a few thick, blurred threads like smoke, vignette
    name: 'Amber Smoke',
    look: {
      source: { type: 'threads', thrCount: 3, thrSpread: 0.6, thrConverge: 0.75, thrWeight: 12, thrGlow: 1, thrDepth: 1, thrBreak: 0, warp: 2.6, rotation: 60, blur: 0.4, seed: 19 },
      color: { stops: P('#0e121b', '#1a2030', '#4a4440', '#d8a060', '#fff0d0') },
      finish: { exposure: 0.25, bloom: 0.6, vignette: 0.55, grain: 0.05 },
    },
  },
  {
    id: 'night-survey', // rippled radial gradient read as contour lines: a summit on the right third
    name: 'Night Survey',
    look: {
      source: { type: 'none', gradShape: 'radial', gradX: 0.35, gradY: 0.2, gradLength: 2.2, gradRipple: 1.6, gradRippleSize: 1.4 },
      color: { stops: P('#000000', '#ffffff'), spread: 1 },
      screen: { type: 'contour', lineCount: 16, lineWidth: 1.3, indexEvery: 5, glow: 0.15, background: 0, colorMode: 'mono', ink: '#e8e8e8', paper: '#000000' },
      finish: { grid: true, gridSize: 4, gridOpacity: 0.2, gridDots: 0.5, grain: 0 },
    },
  },
  {
    id: 'pearl-marble', // marbled silk with iridescence + relief
    name: 'Pearl Marble',
    look: {
      source: { scale: 4, warp: 2, ridge: 0.9, detail: 3, rotation: 35, seed: 42 },
      color: { stops: P('#0a0c14', '#3a4054', '#b9c0d0', '#e8ebf2'), spread: 1.3 },
      surface: { iridescence: 0.7, film: 0.12, relief: 0.4, gloss: 0.5, glossSize: 0.6 },
      finish: { grain: 0.03 },
    },
  },
  {
    id: 'blue-mercury', // chrome silk with an off-center vignette
    name: 'Blue Mercury',
    look: {
      source: { scale: 3.6, warp: 1.6, ridge: 0.2, detail: 2, rotation: 25, seed: 61 },
      color: { stops: P('#02040e', '#0a1a40', '#2a4a90', '#8aa4e0') },
      surface: { chrome: 1, liquid: 0.4, gloss: 0.7, glossSize: 0.4 },
      light: { elevation: 45 },
      finish: { vignette: 0.45, vignetteX: 0.3, vignetteY: 0.1, grain: 0.03 },
    },
  },
  {
    id: 'azure-spray', // silhouette wave of ink, speckle
    name: 'Azure Spray',
    look: {
      source: { scale: 2.2, warp: 1.6, detail: 2, rotation: -15, seed: 9, form: 'wave', formSize: 0.5, formWave: 1.3, formSoft: 0.45, formDepth: 0, formAngle: -15, formBg: '#f4f4f2' },
      color: { stops: P('#f4f4f2', '#9bb0e6', '#3a64d0', '#1f4fc4', '#0d36a8') },
      finish: { speckle: 0.7, grainSize: 1.6, grain: 0.1 },
    },
  },
  {
    id: 'violet-aurora', // rippled gradient seen through wide reeded streaks
    name: 'Violet Aurora',
    look: {
      source: { type: 'none', bgAngle: 90, gradRipple: 2, gradRippleSize: 1.6 },
      color: { stops: [{ pos: 0, color: '#b9c8ff' }, { pos: 0.3, color: '#7a6cff' }, { pos: 0.5, color: '#3a1fb0' }, { pos: 0.64, color: '#000000' }, { pos: 1, color: '#000000' }], spread: 1 },
      glass: { type: 'reeded', count: 7, strength: 0.5, streak: 0.7, shadow: 0.2, highlight: 0, reflect: 0.05, jitter: 0.5 },
      finish: { bloom: 0.3, grain: 0.05 },
    },
  },
  {
    id: 'thermal-bloom', // rippled radial heat-map gradient, speckle
    name: 'Thermal Bloom',
    look: {
      source: { type: 'none', gradShape: 'radial', gradX: 0.38, gradY: -0.25, gradLength: 1.3, gradRipple: 1.6, gradRippleSize: 1.6 },
      color: { stops: P('#000000', '#3a0010', '#ff2a00', '#ffb000', '#3dff8a', '#00c8ff', '#1a3aff', '#0a1450', '#040820'), spread: 1 },
      finish: { speckle: 0.35, grain: 0.12 },
    },
  },
  {
    id: 'molten-glow', // soft silhouette flame rounded with depth
    name: 'Molten Glow',
    look: {
      source: { scale: 4, warp: 0.8, detail: 1, blur: 0.3, seed: 27, form: 'ribbon', formSize: 0.38, formWave: 1.2, formSoft: 0.5, formDepth: 0.85, formAngle: 20, formBg: '#000000' },
      color: { stops: P('#000000', '#1a0400', '#7a2000', '#d84a08', '#ff8a2a', '#ffc078', '#ffe8c8'), spread: 0.8, shift: 0.1 },
      finish: { speckle: 0.3, grain: 0.12, bloom: 0.4 },
    },
  },
  {
    id: 'dusk-horizon', // rippled linear gradient with a glowing rim
    name: 'Dusk Horizon',
    look: {
      source: { type: 'none', bgAngle: 90, gradRipple: 1.2, gradRippleSize: 2.5, seed: 52 },
      color: { stops: [{ pos: 0, color: '#0e1c24' }, { pos: 0.38, color: '#1a3240' }, { pos: 0.44, color: '#2a5070' }, { pos: 0.455, color: '#ff6a2a' }, { pos: 0.462, color: '#ffd2a0' }, { pos: 0.47, color: '#5aa0ff' }, { pos: 0.5, color: '#0a1430' }, { pos: 0.6, color: '#000000' }, { pos: 1, color: '#000000' }], spread: 1 },
      finish: { bloom: 0.5, speckle: 0.25 },
    },
  },
  {
    id: 'coral-arcs', // radial gradient from beyond the corner, grainy arcs
    name: 'Coral Arcs',
    look: {
      source: { type: 'none', gradShape: 'radial', gradX: -1.1, gradY: 1.1, gradLength: 2 },
      color: { stops: [{ pos: 0, color: '#ffb35a' }, { pos: 0.1, color: '#ff6a1a' }, { pos: 0.22, color: '#160a06' }, { pos: 0.4, color: '#0e2a2a' }, { pos: 0.52, color: '#d2441a' }, { pos: 0.6, color: '#ff8a3a' }, { pos: 0.68, color: '#c2401c' }, { pos: 0.8, color: '#0e2426' }, { pos: 1, color: '#081416' }], spread: 1 },
      finish: { speckle: 0.5, grain: 0.15 },
    },
  },
  {
    id: 'tangerine-groove', // rippled stripes: repeat + posterize
    name: 'Tangerine Groove',
    look: {
      source: { type: 'none', bgAngle: 35, gradLength: 2.4, gradRipple: 1.4, gradRippleSize: 0.5 },
      color: { stops: P('#f6e3c0', '#f3b24a', '#e3741f', '#a8401a', '#5e2410'), spread: 1, repeat: 12, mirror: false, posterize: 5 },
      finish: { grain: 0.04 },
    },
  },
  {
    id: 'zebra-swirl', // rippled stripes in two flat tones
    name: 'Zebra Swirl',
    look: {
      source: { type: 'none', bgAngle: 20, gradLength: 3, gradRipple: 2, gradRippleSize: 1.2 },
      color: { stops: P('#0a0a0a', '#f4f1ea'), spread: 1, repeat: 26, mirror: false, posterize: 2 },
      finish: { grain: 0.03 },
    },
  },
  {
    id: 'sky-sunburst', // conic gradient with swaying rays
    name: 'Sky Sunburst',
    look: {
      source: { type: 'none', gradShape: 'conic', gradY: -0.3, gradRipple: 0.7 },
      color: { stops: P('#f6efdc', '#8fd0f0', '#2a8fd6'), spread: 1, repeat: 40, posterize: 3 },
      finish: { grain: 0.04 },
    },
  },
  {
    id: 'saffron-river', // soft rippled stripes on cream
    name: 'Saffron River',
    look: {
      source: { type: 'none', bgAngle: 15, gradLength: 0.65, gradRipple: 2, gradRippleSize: 2.4 },
      color: { stops: P('#f4ece0', '#f4ece0', '#f0a040', '#d0501e', '#f2e6d4', '#3a6464', '#8aa0a0', '#e88a30', '#f4ece0', '#f4ece0'), spread: 1, mirror: false },
      finish: { grain: 0.06 },
    },
  },
];

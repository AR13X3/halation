// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 AR13X3 — Halation (https://github.com/AR13X3/halation)
// Every tweakable parameter lives here. The UI, presets, randomizer, URL sharing
// and shader uniforms are all generated from this list.
//
// key      'section.name' -> state path, and uniform `u_section_name` (unless uniform:false)
// type     range | int | select | chips | toggle | color | seed
// show     (state) => boolean  — visibility in the panel
// rnd      [lo, hi] range used by the randomizer, or false to never randomize

export const SOURCE_TYPES = [
  { value: 'silk', label: 'Silk', icon: 'silk' },
  { value: 'bands', label: 'Bands', icon: 'bands' },
  { value: 'mesh', label: 'Mesh', icon: 'mesh' },
  { value: 'ribbons', label: 'Ribbons', icon: 'ribbons' },
  { value: 'shapes', label: 'Shapes', icon: 'shapes' },
  { value: 'fluid', label: 'Fluid', icon: 'fluid' },
  { value: 'image', label: 'Image', icon: 'image' },
];

export const GLASS_TYPES = [
  { value: 'none', label: 'None', icon: 'none' },
  { value: 'reeded', label: 'Reeded', icon: 'reeded' },
  { value: 'wavy', label: 'Wavy', icon: 'wavy' },
  { value: 'rings', label: 'Rings', icon: 'rings' },
  { value: 'tiles', label: 'Tiles', icon: 'tiles' },
  { value: 'hammered', label: 'Hammered', icon: 'hammered' },
  { value: 'water', label: 'Water', icon: 'water' },
  { value: 'crystal', label: 'Crystal', icon: 'crystal' },
  { value: 'rain', label: 'Rain', icon: 'rain' },
  { value: 'pyramid', label: 'Pyramids', icon: 'pyramid' },
];

export const LIGHT_ENVS = [
  { value: 'studio', label: 'Studio softbox' },
  { value: 'palette', label: 'Palette colors' },
  { value: 'window', label: 'Window' },
  { value: 'dark', label: 'Dark room' },
];

export const GLASS_PROFILES = [
  { value: 'round', label: 'Round' },
  { value: 'linear', label: 'Linear' },
  { value: 'prism', label: 'Prism' },
  { value: 'wave', label: 'Wave' },
  { value: 'bevel', label: 'Bevel' },
  { value: 'block', label: 'Glass block' },
];

export const SCREEN_TYPES = [
  { value: 'none', label: 'None', icon: 'none' },
  { value: 'halftone', label: 'Halftone', icon: 'halftone' },
  { value: 'lines', label: 'Lines', icon: 'lines' },
  { value: 'led', label: 'LED', icon: 'led' },
  { value: 'crt', label: 'CRT', icon: 'crt' },
  { value: 'mosaic', label: 'Mosaic', icon: 'mosaic' },
  { value: 'contour', label: 'Contour', icon: 'contour' },
  { value: 'dither', label: 'Dither', icon: 'dither' },
];

export const DOC_SIZES = [
  { value: 'phone', label: 'Phone — 1080 × 1920', w: 1080, h: 1920 },
  { value: 'iphone', label: 'iPhone Pro Max — 1290 × 2796', w: 1290, h: 2796 },
  { value: 'android', label: 'Android QHD — 1440 × 3200', w: 1440, h: 3200 },
  { value: 'story', label: 'Portrait 4:5 — 1080 × 1350', w: 1080, h: 1350 },
  { value: 'square', label: 'Square — 2048 × 2048', w: 2048, h: 2048 },
  { value: 'hd', label: 'Desktop HD — 1920 × 1080', w: 1920, h: 1080 },
  { value: 'qhd', label: 'Desktop QHD — 2560 × 1440', w: 2560, h: 1440 },
  { value: 'uhd', label: 'Desktop 4K — 3840 × 2160', w: 3840, h: 2160 },
  { value: 'mbp', label: 'MacBook Pro 14" — 3024 × 1964', w: 3024, h: 1964 },
  { value: 'ultrawide', label: 'Ultrawide — 3440 × 1440', w: 3440, h: 1440 },
  { value: 'banner', label: 'Banner 3:1 — 1500 × 500', w: 1500, h: 500 },
  { value: 'linkedin', label: 'LinkedIn banner — 1584 × 396', w: 1584, h: 396 },
  { value: 'a4', label: 'A4 @300dpi — 2480 × 3508', w: 2480, h: 3508 },
  { value: 'custom', label: 'Custom', w: 0, h: 0 },
];

const isSrc = (...types) => (s) => types.includes(s.source.type);
const notSrc = (...types) => (s) => !types.includes(s.source.type);
const isGlass = (...types) => (s) => types.includes(s.glass.type) || types.includes(s.glass.backType);
const glassOn = (s) => s.glass.type !== 'none' || s.glass.backType !== 'none';
const isScreen = (...types) => (s) => types.includes(s.screen.type);
const screenOn = (s) => s.screen.type !== 'none';

export const SECTIONS = [
  { id: 'doc', title: 'Canvas', randomizable: false },
  { id: 'source', title: 'Flow' },
  { id: 'color', title: 'Color' },
  { id: 'glass', title: 'Glass' },
  { id: 'light', title: 'Light' },
  { id: 'screen', title: 'Screen' },
  { id: 'finish', title: 'Finish' },
  { id: 'anim', title: 'Motion', randomizable: false },
  { id: 'export', title: 'Export', randomizable: false },
];

export const PARAMS = [
  // ── Canvas ────────────────────────────────────────────────────────────────
  { key: 'doc.size', label: 'Size', type: 'select', options: DOC_SIZES, def: 'phone', uniform: false },
  { key: 'doc.width', label: 'Width', type: 'int', min: 64, max: 8192, step: 1, def: 1080, uniform: false, unit: 'px', noSlider: true },
  { key: 'doc.height', label: 'Height', type: 'int', min: 64, max: 8192, step: 1, def: 1920, uniform: false, unit: 'px', noSlider: true },

  // ── Flow (source) ─────────────────────────────────────────────────────────
  { key: 'source.type', label: 'Pattern', type: 'chips', options: SOURCE_TYPES, def: 'silk', rnd: false },
  { key: 'source.scale', label: 'Scale', type: 'range', min: 0.15, max: 4, step: 0.01, def: 1, rnd: [0.6, 1.8], show: notSrc('fluid') },
  { key: 'source.warp', label: 'Turbulence', type: 'range', min: 0, max: 3, step: 0.01, def: 1.1, rnd: [0.3, 2], show: notSrc('fluid', 'shapes') },
  { key: 'source.detail', label: 'Detail', type: 'int', min: 1, max: 8, step: 1, def: 4, rnd: [2, 6], show: isSrc('silk', 'bands', 'mesh', 'ribbons') },
  { key: 'source.ridge', label: 'Folds', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.7], show: isSrc('silk'), hint: 'Turns soft swirls into sharp silk-like creases' },

  { key: 'source.bandCount', label: 'Bands', type: 'int', min: 1, max: 6, step: 1, def: 2, rnd: [1, 4], show: isSrc('bands') },
  { key: 'source.bandWidth', label: 'Band width', type: 'range', min: 0.02, max: 0.6, step: 0.005, def: 0.16, rnd: [0.06, 0.35], show: isSrc('bands') },
  { key: 'source.bandSpacing', label: 'Spacing', type: 'range', min: 0.05, max: 1, step: 0.01, def: 0.3, rnd: [0.15, 0.6], show: isSrc('bands') },
  { key: 'source.bandAngle', label: 'Angle', type: 'range', min: -90, max: 90, step: 1, def: 35, unit: '°', rnd: [-70, 70], show: isSrc('bands') },
  { key: 'source.bandLength', label: 'Length', type: 'range', min: 0.2, max: 3, step: 0.01, def: 3, rnd: [0.6, 3], show: isSrc('bands'), hint: 'Max = endless bands' },

  { key: 'source.meshCount', label: 'Points', type: 'int', min: 2, max: 8, step: 1, def: 5, rnd: [3, 7], show: isSrc('mesh') },
  { key: 'source.meshBlend', label: 'Sharpness', type: 'range', min: 0.4, max: 4, step: 0.01, def: 1.4, rnd: [0.8, 2.5], show: isSrc('mesh') },
  { key: 'source.meshMotion', label: 'Drift', type: 'range', min: 0, max: 2, step: 0.01, def: 1, rnd: [0.4, 1.5], show: isSrc('mesh') },

  { key: 'source.ribLines', label: 'Lines', type: 'int', min: 2, max: 120, step: 1, def: 28, rnd: [10, 60], show: isSrc('ribbons') },
  { key: 'source.ribWidth', label: 'Bundle width', type: 'range', min: 0.05, max: 2, step: 0.01, def: 0.45, rnd: [0.2, 1], show: isSrc('ribbons') },
  { key: 'source.ribThick', label: 'Line weight', type: 'range', min: 0.01, max: 0.6, step: 0.005, def: 0.08, rnd: [0.04, 0.2], show: isSrc('ribbons') },
  { key: 'source.ribGlow', label: 'Glow', type: 'range', min: 0, max: 1, step: 0.01, def: 0.5, rnd: [0.2, 0.9], show: isSrc('ribbons') },
  { key: 'source.ribAmp', label: 'Wave', type: 'range', min: 0, max: 2, step: 0.01, def: 0.8, rnd: [0.3, 1.5], show: isSrc('ribbons') },
  { key: 'source.ribFreq', label: 'Frequency', type: 'range', min: 0.1, max: 4, step: 0.01, def: 1.2, rnd: [0.5, 2], show: isSrc('ribbons') },
  { key: 'source.ribFan', label: 'Fan', type: 'range', min: -2, max: 2, step: 0.01, def: 0.6, rnd: [-1, 1], show: isSrc('ribbons') },
  { key: 'source.ribAngle', label: 'Angle', type: 'range', min: -90, max: 90, step: 1, def: -20, unit: '°', rnd: [-45, 45], show: isSrc('ribbons') },

  { key: 'source.shape', label: 'Shape', type: 'select', options: [{ value: 'sphere', label: 'Sphere' }, { value: 'link', label: 'Chain link' }, { value: 'pill', label: 'Pill' }, { value: 'mixed', label: 'Mixed' }], def: 'sphere', show: isSrc('shapes') },
  { key: 'source.shapeCount', label: 'Count', type: 'int', min: 1, max: 6, step: 1, def: 1, rnd: [1, 3], show: isSrc('shapes') },
  { key: 'source.shapeSize', label: 'Size', type: 'range', min: 0.1, max: 1.4, step: 0.01, def: 0.7, rnd: [0.4, 0.9], show: isSrc('shapes') },
  { key: 'source.shapeSoft', label: 'Edge softness', type: 'range', min: 0, max: 1, step: 0.01, def: 0.02, rnd: [0, 0.15], show: isSrc('shapes') },
  { key: 'source.shapeDrift', label: 'Drift', type: 'range', min: 0, max: 2, step: 0.01, def: 0.6, rnd: [0.2, 1], show: isSrc('shapes') },
  { key: 'source.bgAngle', label: 'Backdrop angle', type: 'range', min: -180, max: 180, step: 1, def: -90, unit: '°', rnd: [-180, 180], show: isSrc('shapes'), hint: 'Direction of the background gradient (lower part of the palette)' },
  { key: 'source.imgRecolor', label: 'Gradient map', type: 'toggle', def: true, rnd: false, show: isSrc('image'), hint: 'Recolor the image with your palette' },

  { key: 'source.fluidForce', label: 'Force', type: 'range', min: 0, max: 3, step: 0.01, def: 1, rnd: false, show: isSrc('fluid'), uniform: false },
  { key: 'source.fluidRadius', label: 'Brush size', type: 'range', min: 0.05, max: 1, step: 0.01, def: 0.3, rnd: false, show: isSrc('fluid'), uniform: false },
  { key: 'source.fluidCurl', label: 'Vorticity', type: 'range', min: 0, max: 60, step: 0.5, def: 22, rnd: false, show: isSrc('fluid'), uniform: false },
  { key: 'source.fluidVelFade', label: 'Momentum fade', type: 'range', min: 0, max: 4, step: 0.01, def: 0.4, rnd: false, show: isSrc('fluid'), uniform: false },
  { key: 'source.fluidInkFade', label: 'Ink fade', type: 'range', min: 0, max: 3, step: 0.01, def: 0.5, rnd: false, show: isSrc('fluid'), uniform: false },
  { key: 'source.fluidStreams', label: 'Streams', type: 'int', min: 0, max: 6, step: 1, def: 3, rnd: false, show: isSrc('fluid'), uniform: false, hint: 'Automatic ink emitters' },
  { key: 'source.fluidInk', label: 'Ink amount', type: 'range', min: 0, max: 3, step: 0.01, def: 1, rnd: false, show: isSrc('fluid'), uniform: false },
  { key: 'source.fluidGain', label: 'Density', type: 'range', min: 0.2, max: 4, step: 0.01, def: 1.2, rnd: false, show: isSrc('fluid') },
  { key: 'source.fluidQuality', label: 'Sim quality', type: 'select', options: [{ value: 'low', label: 'Low' }, { value: 'med', label: 'Medium' }, { value: 'high', label: 'High' }], def: 'med', rnd: false, show: isSrc('fluid'), uniform: false },

  { key: 'source.blur', label: 'Soften', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.2] },
  { key: 'source.twist', label: 'Swirl', type: 'range', min: -6, max: 6, step: 0.01, def: 0, rnd: [-2, 2], show: notSrc('fluid') },
  { key: 'source.rotation', label: 'Rotate', type: 'range', min: -180, max: 180, step: 1, def: 0, unit: '°', rnd: [-180, 180], show: notSrc('fluid') },
  { key: 'source.offsetX', label: 'Pan X', type: 'range', min: -3, max: 3, step: 0.001, def: 0, rnd: false, show: notSrc('fluid'), hint: 'Tip: drag the canvas to pan, scroll to zoom' },
  { key: 'source.offsetY', label: 'Pan Y', type: 'range', min: -3, max: 3, step: 0.001, def: 0, rnd: false, show: notSrc('fluid') },
  { key: 'source.seed', label: 'Seed', type: 'seed', min: 0, max: 9999, def: 7, rnd: [0, 9999], show: notSrc('fluid', 'image') },

  // ── Color ─────────────────────────────────────────────────────────────────
  // color.stops is edited by the gradient editor (not a schema control)
  { key: 'color.spread', label: 'Contrast', type: 'range', min: 0.2, max: 4, step: 0.01, def: 1.2, rnd: [0.9, 2] },
  { key: 'color.shift', label: 'Balance', type: 'range', min: -0.6, max: 0.6, step: 0.01, def: 0, rnd: [-0.15, 0.15] },
  { key: 'color.repeat', label: 'Repeat', type: 'range', min: 1, max: 8, step: 0.01, def: 1, rnd: false },
  { key: 'color.offset', label: 'Offset', type: 'range', min: 0, max: 1, step: 0.001, def: 0, rnd: false },
  { key: 'color.mirror', label: 'Mirror repeats', type: 'toggle', def: true, rnd: false },
  { key: 'color.cycle', label: 'Color cycle', type: 'int', min: -4, max: 4, step: 1, def: 0, rnd: false, uniform: false, hint: 'Palette cycles per loop' },
  { key: 'color.posterize', label: 'Posterize', type: 'int', min: 0, max: 16, step: 1, def: 0, rnd: false, hint: '0 = smooth' },
  { key: 'color.relief', label: 'Relief', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.6], hint: 'Shade the flow like a 3D surface' },
  { key: 'color.gloss', label: 'Gloss', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.6] },
  { key: 'color.glossSize', label: 'Gloss tightness', type: 'range', min: 0, max: 1, step: 0.01, def: 0.5, rnd: [0.2, 0.9], show: (s) => s.color.gloss > 0 },

  // ── Glass ─────────────────────────────────────────────────────────────────
  { key: 'glass.type', label: 'Glass', type: 'chips', options: GLASS_TYPES, def: 'none', rnd: false },
  { key: 'glass.count', group: 'Shape', label: (s) => ({ water: 'Ripple density', hammered: 'Density', crystal: 'Facets', rain: 'Drop density', rings: 'Rings', tiles: 'Tiles', pyramid: 'Pyramids' })[s.glass.type] || 'Flutes', type: 'range', min: 2, max: 160, step: 0.5, def: 14, rnd: [6, 48], show: (s) => s.glass.type !== 'none', curve: 2 },
  { key: 'glass.angle', group: 'Shape', label: 'Angle', type: 'range', min: -90, max: 90, step: 1, def: 0, unit: '°', rnd: [-20, 20], show: (s) => ['reeded', 'wavy', 'tiles', 'hammered', 'crystal', 'pyramid'].includes(s.glass.type) },
  { key: 'glass.profile', group: 'Shape', label: 'Profile', type: 'select', options: GLASS_PROFILES, def: 'round', show: isGlass('reeded', 'wavy', 'rings', 'tiles'), hint: 'Cross-section of each flute' },
  { key: 'glass.wave', group: 'Shape', label: 'Wave amount', type: 'range', min: 0, max: 3, step: 0.01, def: 0.6, rnd: [0.2, 1.5], show: isGlass('wavy') },
  { key: 'glass.waveFreq', group: 'Shape', label: 'Wave frequency', type: 'range', min: 0.2, max: 8, step: 0.01, def: 1.5, rnd: [0.5, 3], show: isGlass('wavy') },
  { key: 'glass.coverage', group: 'Shape', label: 'Coverage', type: 'range', min: 0.05, max: 1, step: 0.01, def: 0.55, rnd: [0.3, 0.8], show: isGlass('rain'), hint: 'How much of the pane is covered in drops' },
  { key: 'glass.centerX', group: 'Shape', label: 'Center X', type: 'range', min: -1.5, max: 1.5, step: 0.01, def: 0, rnd: [-1, 1], show: isGlass('rings') },
  { key: 'glass.centerY', group: 'Shape', label: 'Center Y', type: 'range', min: -1.5, max: 1.5, step: 0.01, def: 0, rnd: [-1, 1], show: isGlass('rings') },
  { key: 'glass.jitter', group: 'Shape', label: 'Irregularity', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.4], show: isGlass('reeded', 'wavy', 'rings', 'tiles', 'hammered', 'crystal', 'rain', 'pyramid') },

  { key: 'glass.panel', group: 'Coverage', label: 'Pane', type: 'select', options: [{ value: 'full', label: 'Full canvas' }, { value: 'right', label: 'Right side' }, { value: 'left', label: 'Left side' }, { value: 'top', label: 'Top' }, { value: 'bottom', label: 'Bottom' }, { value: 'window', label: 'Centered window' }, { value: 'band', label: 'Vertical band' }], def: 'full', rnd: false, show: glassOn, hint: 'Let the glass cover only part of the image' },
  { key: 'glass.panelSize', group: 'Coverage', label: 'Pane size', type: 'range', min: 0.05, max: 1, step: 0.01, def: 0.55, rnd: [0.35, 0.7], show: (s) => glassOn(s) && s.glass.panel !== 'full' },
  { key: 'glass.panelOffset', group: 'Coverage', label: 'Pane offset', type: 'range', min: -1, max: 1, step: 0.01, def: 0, rnd: [-0.3, 0.3], show: (s) => glassOn(s) && s.glass.panel !== 'full' },

  { key: 'glass.strength', group: 'Light path', label: 'Refraction', type: 'range', min: -2, max: 2, step: 0.01, def: 0.6, rnd: [-1, 1.2], show: glassOn, hint: 'How far light bends — negative = concave flutes' },
  { key: 'glass.ior', group: 'Light path', label: 'Index (IOR)', type: 'range', min: 1.05, max: 2.4, step: 0.01, def: 1.5, rnd: [1.35, 1.8], show: glassOn, hint: 'Index of refraction: 1.33 water · 1.5 glass · 2.4 diamond. Drives reflections and total internal reflection.' },
  { key: 'glass.frost', group: 'Light path', label: (s) => (s.glass.type === 'rain' || s.glass.backType === 'rain' ? 'Fog' : 'Frost'), type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.4], show: glassOn, hint: 'Scatters light passing through (rough / fogged glass)' },
  { key: 'glass.streak', group: 'Light path', label: 'Streak', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.4], show: glassOn, hint: 'Out-of-focus light smears along the flutes, like lights seen through reeded glass' },
  { key: 'glass.dispersion', group: 'Light path', label: 'Dispersion', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.5], show: glassOn, hint: 'Splits light into a rainbow where it bends' },
  { key: 'glass.caustics', group: 'Light path', label: 'Caustics', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.6], show: glassOn, hint: 'Light concentrated by each lens — bright cores and focus lines' },

  { key: 'glass.reflect', group: 'Surface', label: 'Reflections', type: 'range', min: 0, max: 1, step: 0.01, def: 0.15, rnd: [0, 0.5], show: glassOn, hint: 'Fresnel reflections of the light environment (see Light)' },
  { key: 'glass.highlight', group: 'Surface', label: 'Highlight', type: 'range', min: 0, max: 1, step: 0.01, def: 0.08, rnd: [0, 0.4], show: glassOn, hint: 'Reflection of the light source on the glass surface — the bright line on each flute' },
  { key: 'glass.sharpness', group: 'Surface', label: 'Sharpness', type: 'range', min: 0, max: 1, step: 0.01, def: 0.5, rnd: [0.3, 0.85], show: (s) => glassOn(s) && s.glass.highlight > 0 },
  { key: 'glass.shadow', group: 'Surface', label: 'Edge shadow', type: 'range', min: 0, max: 1, step: 0.01, def: 0.25, rnd: [0, 0.7], show: glassOn },
  { key: 'glass.tintAmount', group: 'Surface', label: 'Tint', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.5], show: glassOn, hint: 'Colored glass — thicker parts absorb more' },
  { key: 'glass.tint', group: 'Surface', label: 'Tint color', type: 'color', def: '#7fd1b0', rnd: false, show: (s) => glassOn(s) && s.glass.tintAmount > 0 },

  { key: 'glass.backType', group: 'Second pane', label: 'Back pane', type: 'select', options: GLASS_TYPES, def: 'none', rnd: false, hint: 'Stack a second sheet of glass behind the first' },
  { key: 'glass.backCount', group: 'Second pane', label: 'Density', type: 'range', min: 2, max: 160, step: 0.5, def: 14, rnd: [6, 40], show: (s) => s.glass.backType !== 'none', curve: 2 },
  { key: 'glass.backAngle', group: 'Second pane', label: 'Angle', type: 'range', min: -90, max: 90, step: 1, def: 90, unit: '°', rnd: [-90, 90], show: (s) => s.glass.backType !== 'none' },
  { key: 'glass.backStrength', group: 'Second pane', label: 'Refraction', type: 'range', min: -2, max: 2, step: 0.01, def: 0.5, rnd: [-0.8, 0.8], show: (s) => s.glass.backType !== 'none' },

  // ── Light ─────────────────────────────────────────────────────────────────
  { key: 'light.angle', label: 'Direction', type: 'range', min: 0, max: 360, step: 1, def: 120, unit: '°', rnd: [0, 360] },
  { key: 'light.elevation', label: 'Elevation', type: 'range', min: 5, max: 90, step: 1, def: 50, unit: '°', rnd: [25, 70], hint: 'Low light = long grazing highlights' },
  { key: 'light.intensity', label: 'Intensity', type: 'range', min: 0, max: 3, step: 0.01, def: 1, rnd: [0.8, 1.4] },
  { key: 'light.color', label: 'Color', type: 'color', def: '#ffffff', rnd: false },
  { key: 'light.env', label: 'Environment', type: 'select', options: LIGHT_ENVS, def: 'studio', hint: 'What the glass reflects' },

  // ── Screen ────────────────────────────────────────────────────────────────
  { key: 'screen.type', label: 'Screen', type: 'chips', options: SCREEN_TYPES, def: 'none', rnd: false },
  { key: 'screen.size', label: (s) => (s.screen.type === 'contour' ? 'Detail' : 'Cells'), type: 'range', min: 10, max: 400, step: 1, def: 110, rnd: [60, 220], show: (s) => screenOn(s) && s.screen.type !== 'contour', curve: 2, hint: 'Cells across the canvas height' },
  { key: 'screen.angle', label: 'Angle', type: 'range', min: 0, max: 90, step: 1, def: 45, unit: '°', rnd: [0, 90], show: (s) => isScreen('halftone')(s) || (isScreen('lines')(s) && s.screen.lineShape !== 'rings') },
  { key: 'screen.dotShape', label: 'Dot shape', type: 'select', options: [{ value: 'circle', label: 'Circle' }, { value: 'square', label: 'Square' }, { value: 'diamond', label: 'Diamond' }], def: 'circle', show: isScreen('halftone') },
  { key: 'screen.lineShape', label: 'Line shape', type: 'select', options: [{ value: 'straight', label: 'Straight' }, { value: 'rings', label: 'Rings' }, { value: 'waves', label: 'Waves' }], def: 'straight', show: isScreen('lines') },
  { key: 'screen.ledShape', label: 'Pixel shape', type: 'select', options: [{ value: 'round', label: 'Round' }, { value: 'square', label: 'Square' }, { value: 'rgb', label: 'RGB subpixels' }], def: 'round', show: isScreen('led') },
  { key: 'screen.mosaicShape', label: 'Tile shape', type: 'select', options: [{ value: 'square', label: 'Square' }, { value: 'hex', label: 'Hexagon' }], def: 'square', show: isScreen('mosaic') },
  { key: 'screen.centerX', label: 'Center X', type: 'range', min: -1.5, max: 1.5, step: 0.01, def: 0, rnd: [-1, 1], show: (s) => isScreen('lines')(s) && s.screen.lineShape === 'rings' },
  { key: 'screen.centerY', label: 'Center Y', type: 'range', min: -1.5, max: 1.5, step: 0.01, def: -0.6, rnd: [-1, 1], show: (s) => isScreen('lines')(s) && s.screen.lineShape === 'rings' },
  { key: 'screen.lineCount', label: 'Lines', type: 'range', min: 2, max: 80, step: 1, def: 14, rnd: [6, 30], show: isScreen('contour') },
  { key: 'screen.lineWidth', label: 'Line weight', type: 'range', min: 0.5, max: 8, step: 0.1, def: 1.4, rnd: [0.8, 3], unit: 'px', show: isScreen('contour') },
  { key: 'screen.indexEvery', label: 'Bold every', type: 'int', min: 0, max: 10, step: 1, def: 0, rnd: [0, 5], show: isScreen('contour'), hint: '0 = off' },
  { key: 'screen.levels', label: 'Levels', type: 'int', min: 2, max: 8, step: 1, def: 2, rnd: [2, 4], show: isScreen('dither') },
  { key: 'screen.dotScale', label: (s) => (s.screen.type === 'crt' ? 'Mask strength' : s.screen.type === 'mosaic' ? 'Tile size' : s.screen.type === 'lines' ? 'Line weight' : 'Dot size'), type: 'range', min: 0.1, max: 1.5, step: 0.01, def: 0.9, rnd: [0.6, 1.1], show: isScreen('halftone', 'lines', 'led', 'crt', 'mosaic') },
  { key: 'screen.contrast', label: 'Contrast', type: 'range', min: 0.2, max: 3, step: 0.01, def: 1, rnd: [0.8, 1.6], show: (s) => screenOn(s) && s.screen.type !== 'contour' },
  { key: 'screen.invert', label: 'Invert', type: 'toggle', def: false, rnd: false, show: isScreen('halftone', 'lines', 'dither') },
  { key: 'screen.colorMode', label: 'Color', type: 'select', options: [{ value: 'source', label: 'From image' }, { value: 'mono', label: 'Ink & paper' }], def: 'source', show: (s) => screenOn(s) && s.screen.type !== 'crt' },
  { key: 'screen.ink', label: 'Ink', type: 'color', def: '#ffffff', rnd: false, show: (s) => screenOn(s) && s.screen.colorMode === 'mono' && s.screen.type !== 'crt' },
  { key: 'screen.paper', label: 'Paper', type: 'color', def: '#05060a', rnd: false, show: (s) => screenOn(s) && s.screen.colorMode === 'mono' && s.screen.type !== 'crt' },
  { key: 'screen.background', label: 'Background', type: 'range', min: 0, max: 1, step: 0.01, def: 0.12, rnd: [0, 0.4], show: (s) => isScreen('halftone', 'lines', 'led', 'mosaic', 'contour')(s) && s.screen.colorMode === 'source', hint: 'How much of the image shows between marks' },
  { key: 'screen.fill', label: 'Lines over image', type: 'toggle', def: false, rnd: false, show: isScreen('contour') },
  { key: 'screen.glow', label: (s) => (s.screen.type === 'mosaic' ? 'Bevel' : s.screen.type === 'led' || s.screen.type === 'crt' ? 'Glow' : 'Boost'), type: 'range', min: 0, max: 1, step: 0.01, def: 0.3, rnd: [0, 0.6], show: isScreen('halftone', 'lines', 'led', 'crt', 'mosaic', 'contour') },
  { key: 'screen.mix', label: 'Mix', type: 'range', min: 0, max: 1, step: 0.01, def: 1, rnd: false, show: screenOn },

  // ── Finish ────────────────────────────────────────────────────────────────
  { key: 'finish.exposure', label: 'Brightness', type: 'range', min: -2, max: 2, step: 0.01, def: 0, rnd: [-0.2, 0.2] },
  { key: 'finish.contrast', label: 'Contrast', type: 'range', min: 0, max: 2, step: 0.01, def: 1, rnd: [0.9, 1.2] },
  { key: 'finish.saturation', label: 'Saturation', type: 'range', min: 0, max: 2, step: 0.01, def: 1, rnd: [0.85, 1.25] },
  { key: 'finish.hue', label: 'Hue shift', type: 'range', min: -180, max: 180, step: 1, def: 0, unit: '°', rnd: false },
  { key: 'finish.grain', label: 'Grain', type: 'range', min: 0, max: 1, step: 0.01, def: 0.08, rnd: [0, 0.35] },
  { key: 'finish.grainSize', label: 'Grain size', type: 'range', min: 0.5, max: 4, step: 0.01, def: 1, rnd: [0.8, 1.6], show: (s) => s.finish.grain > 0 },
  { key: 'finish.grainAnim', label: 'Animated grain', type: 'toggle', def: true, rnd: false, show: (s) => s.finish.grain > 0 },
  { key: 'finish.vignette', label: 'Vignette', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.5] },
  { key: 'finish.bloom', label: 'Bloom', type: 'range', min: 0, max: 2, step: 0.01, def: 0, rnd: [0, 0.8] },
  { key: 'finish.bloomRadius', label: 'Bloom radius', type: 'range', min: 0, max: 1, step: 0.01, def: 0.5, rnd: [0.2, 0.8], show: (s) => s.finish.bloom > 0 },
  { key: 'finish.bloomThreshold', label: 'Bloom threshold', type: 'range', min: 0, max: 1, step: 0.01, def: 0.55, rnd: [0.3, 0.8], show: (s) => s.finish.bloom > 0 },
  { key: 'finish.aberration', label: 'Aberration', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.3] },
  { key: 'finish.grid', label: 'Grid overlay', type: 'toggle', def: false, rnd: false },
  { key: 'finish.gridSize', label: 'Grid cells', type: 'range', min: 1, max: 40, step: 0.5, def: 6, rnd: false, show: (s) => s.finish.grid },
  { key: 'finish.gridOpacity', label: 'Grid opacity', type: 'range', min: 0, max: 1, step: 0.01, def: 0.35, rnd: false, show: (s) => s.finish.grid },
  { key: 'finish.gridDots', label: 'Markers', type: 'range', min: 0, max: 1, step: 0.01, def: 0.1, rnd: false, show: (s) => s.finish.grid },
  { key: 'finish.gridColor', label: 'Grid color', type: 'color', def: '#ffffff', rnd: false, show: (s) => s.finish.grid },

  // ── Motion ────────────────────────────────────────────────────────────────
  { key: 'anim.speed', label: 'Speed', type: 'range', min: 0, max: 3, step: 0.01, def: 0.6, uniform: false },
  { key: 'anim.loop', label: 'Seamless loop', type: 'toggle', def: true, uniform: false, hint: 'Animation repeats perfectly — great for video wallpapers' },
  { key: 'anim.duration', label: 'Loop length', type: 'range', min: 2, max: 60, step: 0.5, def: 10, unit: 's', uniform: false, show: (s) => s.anim.loop },
  { key: 'anim.fps', label: 'Video FPS', type: 'select', options: [{ value: '24', label: '24 fps' }, { value: '30', label: '30 fps' }, { value: '60', label: '60 fps' }], def: '30', uniform: false },

  // ── Export ────────────────────────────────────────────────────────────────
  { key: 'export.scale', label: 'Scale', type: 'select', options: [{ value: '0.5', label: '0.5×' }, { value: '1', label: '1×' }, { value: '2', label: '2×' }, { value: '3', label: '3×' }, { value: '4', label: '4×' }], def: '1', uniform: false },
  { key: 'export.format', label: 'Format', type: 'select', options: [{ value: 'png', label: 'PNG 8-bit' }, { value: 'png16', label: 'PNG 16-bit (no banding)' }, { value: 'jpeg', label: 'JPEG' }, { value: 'webp', label: 'WebP' }], def: 'png', uniform: false },
  { key: 'export.quality', label: 'Quality', type: 'range', min: 0.5, max: 1, step: 0.01, def: 0.95, uniform: false, show: (s) => s.export.format === 'jpeg' || s.export.format === 'webp' },
  { key: 'export.burst', label: 'Burst frames', type: 'int', min: 2, max: 60, step: 1, def: 12, uniform: false, hint: 'Frames spread evenly over the loop' },
];

export const PARAM_MAP = Object.fromEntries(PARAMS.map((p) => [p.key, p]));

// Sections that make up a "look" — saved in presets, history, share links.
export const LOOK_SECTIONS = ['source', 'color', 'glass', 'light', 'screen', 'finish', 'anim'];

export const DEFAULT_STOPS = [
  { pos: 0, color: '#1b0f2e' },
  { pos: 0.35, color: '#7a2e5c' },
  { pos: 0.7, color: '#ff7a59' },
  { pos: 1, color: '#ffd8b0' },
];

export function defaultState() {
  const s = {};
  for (const p of PARAMS) setPath(s, p.key, structuredClone(p.def));
  s.color.stops = structuredClone(DEFAULT_STOPS);
  s.anim.time = 0;
  s.anim.playing = true;
  return s;
}

export function getPath(obj, path) {
  const [a, b] = path.split('.');
  return obj[a]?.[b];
}

export function setPath(obj, path, value) {
  const [a, b] = path.split('.');
  (obj[a] ??= {})[b] = value;
}

export function uniformName(key) {
  return 'u_' + key.replace('.', '_');
}

export function optionIndex(param, value) {
  const i = param.options.findIndex((o) => o.value === value);
  return i < 0 ? 0 : i;
}

// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 AR13X3 — Halation (https://github.com/AR13X3/halation)
// Every tweakable parameter lives here. The UI, presets, randomizer, URL sharing
// and shader uniforms are all generated from this list.
//
// key      'section.name' -> state path, and uniform `u_section_name` (unless uniform:false)
// type     range | int | select | chips | toggle | color | seed | picker | gradient
// show     (state) => boolean  — visibility in the panel
// obj      the object (1–6) a per-object setting belongs to
// rnd      [lo, hi] range used by the randomizer, or false to never randomize
// tags     extra words the settings search should match (synonyms)

import { PALETTES } from './palette.js';

export const SOURCE_TYPES = [
  { value: 'none', label: 'None', icon: 'none' },
  { value: 'silk', label: 'Silk', icon: 'silk' },
  { value: 'bands', label: 'Bands', icon: 'bands' },
  { value: 'mesh', label: 'Mesh', icon: 'mesh' },
  { value: 'ribbons', label: 'Ribbons', icon: 'ribbons' },
  { value: 'threads', label: 'Threads', icon: 'threads' },
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
  { value: 'moire', label: 'Moiré', icon: 'moire' },
  { value: 'led', label: 'LED', icon: 'led' },
  { value: 'crt', label: 'CRT', icon: 'crt' },
  { value: 'mosaic', label: 'Mosaic', icon: 'mosaic' },
  { value: 'contour', label: 'Contour', icon: 'contour' },
  { value: 'dither', label: 'Dither', icon: 'dither' },
];

export const FORMS = [
  { value: 'none', label: 'None' },
  { value: 'ribbon', label: 'Ribbon (vertical)' },
  { value: 'wave', label: 'Wave (horizontal)' },
  { value: 'blob', label: 'Blob' },
];

export const STREAK_TYPES = [
  { value: 'zoom', label: 'Zoom' },
  { value: 'spin', label: 'Spin' },
  { value: 'linear', label: 'Directional' },
];

// ── Objects ─────────────────────────────────────────────────────────────────
// Up to six objects float in front of the flow. Each has its own settings
// under objects.o1… objects.o6; the shared ones apply to all of them.
export const MAX_OBJECTS = 6;

export const OBJECT_SHAPES = [
  { value: 'sphere', label: 'Sphere', icon: 'sphere' },
  { value: 'pill', label: 'Pill', icon: 'pill' },
  { value: 'pane', label: 'Pane', icon: 'pane' },
  { value: 'link', label: 'Link', icon: 'link' },
];

export const OBJECT_MATERIALS = [
  { value: 'glass', label: 'Glass', icon: 'glassObject' },
  { value: 'solid', label: 'Solid', icon: 'solidObject' },
];

// Each slot has its own defaults, so objects added one by one build up a
// composition instead of stacking in the middle.
const OBJECT_SLOTS = [
  { shape: 'pane', size: 0.62, length: 1.45, corner: 0.06, x: -0.06, y: 0.08, angle: -24, tone: 0.78, color: '#8ed8e6', gradient: 'Lagoon' },
  { shape: 'pill', size: 0.46, length: 1.5, x: 0.12, y: -0.17, angle: 38, tone: 0.55, color: '#9db8ff', gradient: 'Glacier' },
  { shape: 'sphere', size: 0.34, x: -0.14, y: -0.3, tone: 0.92, color: '#b6f0c8', gradient: 'Candy' },
  { shape: 'pane', size: 0.34, length: 1.2, corner: 0.5, x: 0.17, y: 0.3, angle: 14, tone: 0.66, color: '#ffc9a8', gradient: 'Peach' },
  { shape: 'sphere', size: 0.18, x: 0.2, y: 0.02, tone: 0.45, color: '#f2b6e4', gradient: 'Pearl' },
  { shape: 'pill', size: 0.28, length: 1.2, x: -0.18, y: 0.34, angle: -62, tone: 0.85, color: '#fff1b0', gradient: 'Gold' },
];

// Gradients an object can use: the palette from Color, or one from the library.
export const OBJECT_GRADIENTS = [{ value: 'palette', label: 'Your palette' }, ...PALETTES.map((p) => ({ value: p.name, label: p.name }))];
export const gradientStops = (s, name) => PALETTES.find((p) => p.name === name)?.stops ?? s.color.stops;

export const objectKey = (i, name) => `objects.o${i}${name}`;
export const objectValue = (s, i, name) => s.objects[`o${i}${name}`];
const objectsOn = (s) => s.objects.count > 0;
const hasMaterial = (m) => (s) => Array.from({ length: s.objects.count }, (_, k) => objectValue(s, k + 1, 'Material')).includes(m);
const hasGlassPane = (s) => Array.from({ length: s.objects.count }, (_, k) => k + 1).some((i) => objectValue(s, i, 'Material') === 'glass' && objectValue(s, i, 'Shape') === 'pane');

// The settings of object i, shown while it is the one being edited.
function objectParams(i) {
  const d = OBJECT_SLOTS[i - 1];
  const k = (name) => objectKey(i, name);
  const on = (s) => s.objects.count >= i && s.objects.edit === i;
  const is = (name, ...values) => (s) => on(s) && values.includes(objectValue(s, i, name));
  const common = { obj: i, uniform: false };
  return [
    { ...common, key: k('Material'), label: 'Material', type: 'chips', options: OBJECT_MATERIALS, def: 'glass', rnd: false, show: on },
    { ...common, key: k('Shape'), label: 'Shape', type: 'chips', options: OBJECT_SHAPES, def: d.shape, rnd: false, show: on },
    { ...common, key: k('Fill'), label: 'Color', type: 'select', options: [{ value: 'palette', label: 'From palette' }, { value: 'custom', label: 'Custom color' }, { value: 'gradient', label: 'Gradient' }], def: 'palette', rnd: false, show: on, tags: 'colour tint library' },
    { ...common, key: k('Tone'), label: 'Palette color', type: 'range', min: 0, max: 1, step: 0.01, def: d.tone, rnd: [0.35, 1], show: is('Fill', 'palette'), hint: 'Where along the palette the color is taken from', tags: 'colour hue' },
    { ...common, key: k('Color'), label: 'Custom color', type: 'color', def: d.color, rnd: false, show: is('Fill', 'custom'), tags: 'colour' },
    { ...common, key: k('Gradient'), label: 'Gradient', type: 'gradient', options: OBJECT_GRADIENTS, def: d.gradient, rnd: false, show: is('Fill', 'gradient'), tags: 'library palette colors' },
    { ...common, key: k('GradAngle'), label: 'Gradient angle', type: 'range', min: -180, max: 180, step: 1, def: 90, unit: '°', rnd: [-180, 180], show: is('Fill', 'gradient'), hint: 'Direction of the gradient across the object (it turns with the object)', tags: 'direction' },
    { ...common, key: k('Tint'), label: 'Tint', type: 'range', min: 0, max: 1, step: 0.01, def: 0.5, rnd: [0.25, 0.75], show: is('Material', 'glass'), hint: 'How strongly the glass is colored', tags: 'color stained' },
    { ...common, key: k('Frost'), label: 'Frost', type: 'range', min: 0, max: 1, step: 0.01, def: 0.5, rnd: [0.1, 0.9], show: is('Material', 'glass'), hint: 'Clear glass, or frosted glass that blurs what is behind it', tags: 'blur matte fog' },
    { ...common, key: k('Size'), label: 'Size', type: 'range', min: 0.05, max: 1.5, step: 0.01, def: d.size, rnd: [0.2, 0.7], show: on, tags: 'scale' },
    { ...common, key: k('Length'), label: 'Length', type: 'range', min: 0.5, max: 4, step: 0.01, def: d.length ?? 1, rnd: [0.8, 2], show: is('Shape', 'pill', 'pane', 'link'), tags: 'stretch aspect long' },
    { ...common, key: k('Corner'), label: 'Corners', type: 'range', min: 0, max: 1, step: 0.01, def: d.corner ?? 0.1, rnd: [0, 0.6], show: is('Shape', 'pane'), hint: 'Square or rounded corners', tags: 'radius round' },
    { ...common, key: k('X'), label: 'Position X', type: 'range', min: -2, max: 2, step: 0.001, def: d.x, rnd: [-0.3, 0.3], show: on, hint: 'Tip: drag the object on the canvas', tags: 'move horizontal' },
    { ...common, key: k('Y'), label: 'Position Y', type: 'range', min: -2, max: 2, step: 0.001, def: d.y, rnd: [-0.35, 0.35], show: on, tags: 'move vertical' },
    { ...common, key: k('Angle'), label: 'Rotation', type: 'range', min: -180, max: 180, step: 1, def: d.angle ?? 0, unit: '°', rnd: [-180, 180], show: (s) => on(s) && objectValue(s, i, 'Shape') !== 'sphere', tags: 'angle rotate' },
  ];
}

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
const moving = notSrc('fluid', 'none');            // patterns that scale, turn and pan
const isBg = (fill) => (s) => s.source.type === 'none' && s.source.bgFill === fill;
const isGlass = (...types) => (s) => types.includes(s.glass.type) || types.includes(s.glass.backType);
const glassOn = (s) => s.glass.type !== 'none' || s.glass.backType !== 'none';
const isScreen = (...types) => (s) => types.includes(s.screen.type);
const screenOn = (s) => s.screen.type !== 'none';
const formOn = (s) => s.source.form !== 'none';
const streakOn = (s) => s.finish.streak > 0;

export const SECTIONS = [
  { id: 'doc', title: 'Canvas', randomizable: false },
  { id: 'source', title: 'Flow' },
  { id: 'objects', title: 'Objects' },
  { id: 'color', title: 'Color' },
  { id: 'surface', title: 'Surface' },
  { id: 'glass', title: 'Glass' },
  { id: 'light', title: 'Light' },
  { id: 'screen', title: 'Screen' },
  { id: 'finish', title: 'Finish' },
  { id: 'anim', title: 'Motion', randomizable: false },
  { id: 'export', title: 'Export', randomizable: false },
];

export const PARAMS = [
  // ── Canvas ────────────────────────────────────────────────────────────────
  { key: 'doc.size', label: 'Size', type: 'select', options: DOC_SIZES, def: 'phone', uniform: false, tags: 'resolution dimensions preset wallpaper aspect ratio' },
  { key: 'doc.width', label: 'Width', type: 'int', min: 64, max: 8192, step: 1, def: 1080, uniform: false, unit: 'px', noSlider: true },
  { key: 'doc.height', label: 'Height', type: 'int', min: 64, max: 8192, step: 1, def: 1920, uniform: false, unit: 'px', noSlider: true },

  // ── Flow (source) ─────────────────────────────────────────────────────────
  { key: 'source.type', label: 'Pattern', type: 'chips', options: SOURCE_TYPES, def: 'silk', rnd: false, tags: 'style source none static still' },
  // None: a still background, a color or a gradient from the palette
  { key: 'source.bgFill', label: 'Background', type: 'select', options: [{ value: 'gradient', label: 'Gradient' }, { value: 'color', label: 'Color' }], def: 'gradient', rnd: false, show: isSrc('none'), tags: 'backdrop still static fill' },
  { key: 'source.bgColor', label: 'Color', type: 'color', def: '#dfe5ec', rnd: false, show: isBg('color'), tags: 'background backdrop solid plain' },
  { key: 'source.gradShape', label: 'Shape', type: 'select', options: [{ value: 'linear', label: 'Linear' }, { value: 'radial', label: 'Radial' }], def: 'linear', rnd: false, show: isBg('gradient'), tags: 'radial linear circle' },
  { key: 'source.bgAngle', label: 'Angle', type: 'range', min: -180, max: 180, step: 1, def: -90, unit: '°', rnd: [-180, 180], show: (s) => isBg('gradient')(s) && s.source.gradShape === 'linear', hint: 'Direction of the gradient, from the start of the palette to its end', tags: 'direction' },
  { key: 'source.gradLength', label: 'Length', type: 'range', min: 0.15, max: 4, step: 0.001, def: 1, rnd: [0.6, 1.6], show: isBg('gradient'), hint: 'How far the gradient stretches', tags: 'scale spread size' },
  { key: 'source.gradShift', label: 'Offset', type: 'range', min: -3, max: 3, step: 0.001, def: 0, rnd: [-0.2, 0.2], show: isBg('gradient'), hint: 'Moves the gradient along its direction', tags: 'position move' },
  { key: 'source.gradRange', label: 'Palette range', type: 'range', min: 0.1, max: 1, step: 0.01, def: 1, rnd: [0.6, 1], show: isBg('gradient'), hint: 'How much of the palette the background uses, from its start. Lower values leave the rest of the palette for objects.', tags: 'portion span' },

  { key: 'source.scale', label: 'Scale', type: 'range', min: 0.15, max: 4, step: 0.01, def: 1, rnd: [0.6, 1.8], show: moving, tags: 'zoom size' },
  { key: 'source.warp', label: 'Turbulence', type: 'range', min: 0, max: 3, step: 0.01, def: 1.1, rnd: [0.3, 2], show: moving, tags: 'warp distortion noise' },
  { key: 'source.detail', label: 'Detail', type: 'int', min: 1, max: 8, step: 1, def: 4, rnd: [2, 6], show: isSrc('silk', 'bands', 'mesh', 'ribbons'), tags: 'octaves complexity' },
  { key: 'source.ridge', label: 'Folds', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.7], show: isSrc('silk'), hint: 'Turns soft swirls into sharp silk-like creases', tags: 'creases ridges' },

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

  { key: 'source.thrCount', label: 'Threads', type: 'range', min: 2, max: 80, step: 0.5, def: 16, rnd: [8, 30], show: isSrc('threads'), curve: 2, hint: 'Threads across the canvas height', tags: 'filaments lines density' },
  { key: 'source.thrWeight', label: 'Thread weight', type: 'range', min: 0.3, max: 8, step: 0.05, def: 1.4, unit: 'px', rnd: [0.8, 2.5], show: isSrc('threads'), tags: 'thickness width' },
  { key: 'source.thrGlow', label: 'Glow', type: 'range', min: 0, max: 1, step: 0.01, def: 0.45, rnd: [0.2, 0.8], show: isSrc('threads') },
  { key: 'source.thrSpread', label: 'Bundle width', type: 'range', min: 0.05, max: 3, step: 0.01, def: 3, rnd: [0.3, 3], show: isSrc('threads'), hint: 'Max = threads fill the canvas' },
  { key: 'source.thrConverge', label: 'Converge', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 1], show: isSrc('threads'), hint: 'Pinch the threads toward the center: an hourglass, then a starburst', tags: 'focus pinch burst hourglass warp' },
  { key: 'source.thrDepth', label: 'Depth of field', type: 'range', min: 0, max: 1, step: 0.01, def: 0.4, rnd: [0, 0.8], show: isSrc('threads'), hint: 'Soft, out-of-focus threads behind the sharp ones', tags: 'bokeh blur layers defocus' },
  { key: 'source.thrBreak', label: 'Breakup', type: 'range', min: 0, max: 1, step: 0.01, def: 0.3, rnd: [0, 0.8], show: isSrc('threads'), hint: 'Breaks threads into streaks of light that race along them', tags: 'dashes streaks speed trails' },

  { key: 'source.imgRecolor', label: 'Gradient map', type: 'toggle', def: true, rnd: false, show: isSrc('image'), hint: 'Recolor the image with your palette' },

  { key: 'source.fluidForce', label: 'Force', type: 'range', min: 0, max: 3, step: 0.01, def: 1, rnd: false, show: isSrc('fluid'), uniform: false },
  { key: 'source.fluidRadius', label: 'Brush size', type: 'range', min: 0.05, max: 1, step: 0.01, def: 0.3, rnd: false, show: isSrc('fluid'), uniform: false },
  { key: 'source.fluidCurl', label: 'Vorticity', type: 'range', min: 0, max: 60, step: 0.5, def: 22, rnd: false, show: isSrc('fluid'), uniform: false, tags: 'curl swirl' },
  { key: 'source.fluidVelFade', label: 'Momentum fade', type: 'range', min: 0, max: 4, step: 0.01, def: 0.4, rnd: false, show: isSrc('fluid'), uniform: false },
  { key: 'source.fluidInkFade', label: 'Ink fade', type: 'range', min: 0, max: 3, step: 0.01, def: 0.5, rnd: false, show: isSrc('fluid'), uniform: false },
  { key: 'source.fluidStreams', label: 'Streams', type: 'int', min: 0, max: 6, step: 1, def: 3, rnd: false, show: isSrc('fluid'), uniform: false, hint: 'Automatic ink emitters' },
  { key: 'source.fluidInk', label: 'Ink amount', type: 'range', min: 0, max: 3, step: 0.01, def: 1, rnd: false, show: isSrc('fluid'), uniform: false },
  { key: 'source.fluidGain', label: 'Density', type: 'range', min: 0.2, max: 4, step: 0.01, def: 1.2, rnd: false, show: isSrc('fluid') },
  { key: 'source.fluidQuality', label: 'Sim quality', type: 'select', options: [{ value: 'low', label: 'Low' }, { value: 'med', label: 'Medium' }, { value: 'high', label: 'High' }], def: 'med', rnd: false, show: isSrc('fluid'), uniform: false, tags: 'resolution performance' },

  { key: 'source.blur', label: 'Soften', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.2], tags: 'blur smooth' },
  { key: 'source.twist', label: 'Swirl', type: 'range', min: -6, max: 6, step: 0.01, def: 0, rnd: [-2, 2], show: moving, tags: 'twist spiral vortex' },
  { key: 'source.rotation', label: 'Rotate', type: 'range', min: -180, max: 180, step: 1, def: 0, unit: '°', rnd: [-180, 180], show: moving, tags: 'rotation angle' },
  { key: 'source.offsetX', label: 'Pan X', type: 'range', min: -3, max: 3, step: 0.001, def: 0, rnd: false, show: moving, hint: 'Tip: drag the canvas to pan, scroll to zoom', tags: 'position move' },
  { key: 'source.offsetY', label: 'Pan Y', type: 'range', min: -3, max: 3, step: 0.001, def: 0, rnd: false, show: moving, tags: 'position move' },
  { key: 'source.seed', label: 'Seed', type: 'seed', min: 0, max: 9999, def: 7, rnd: [0, 9999], show: notSrc('fluid', 'image', 'none'), tags: 'random variation' },

  { key: 'source.form', group: 'Silhouette', label: 'Form', type: 'select', options: FORMS, def: 'none', rnd: false, hint: 'Shape the flow into a sculpted form over a plain backdrop', tags: 'mask shape cutout silhouette sculpture' },
  { key: 'source.formSize', group: 'Silhouette', label: 'Size', type: 'range', min: 0.1, max: 1.5, step: 0.01, def: 0.55, rnd: [0.35, 0.8], show: formOn, tags: 'width' },
  { key: 'source.formWave', group: 'Silhouette', label: 'Meander', type: 'range', min: 0, max: 2, step: 0.01, def: 0.8, rnd: [0.3, 1.4], show: formOn, hint: 'How much the form bends and swells', tags: 'wobble wave bend' },
  { key: 'source.formSoft', group: 'Silhouette', label: 'Edge softness', type: 'range', min: 0, max: 1, step: 0.01, def: 0.02, rnd: [0, 0.1], show: formOn, tags: 'feather blur' },
  { key: 'source.formDepth', group: 'Silhouette', label: 'Depth', type: 'range', min: 0, max: 1, step: 0.01, def: 0.5, rnd: [0.2, 0.8], show: formOn, hint: 'Shades the form toward its edges so it reads as a rounded body', tags: 'volume 3d shading roundness' },
  { key: 'source.formBg', group: 'Silhouette', label: 'Backdrop', type: 'color', def: '#060709', rnd: false, show: formOn, tags: 'background color' },

  // ── Objects ───────────────────────────────────────────────────────────────
  { key: 'objects.count', label: 'Objects', type: 'int', min: 0, max: MAX_OBJECTS, step: 1, def: 0, rnd: false, hint: 'Solid or glass objects floating in front of the flow', tags: 'shapes glass panes pills spheres links add' },
  // Which object the panel is editing: an interface setting, not part of the look.
  { key: 'objects.edit', label: 'Edit', type: 'picker', min: 1, max: MAX_OBJECTS, def: 1, rnd: false, uniform: false, show: objectsOn },
  ...Array.from({ length: MAX_OBJECTS }, (_, k) => objectParams(k + 1)).flat(),

  { key: 'objects.refraction', group: 'All objects', label: 'Refraction', type: 'range', min: -1, max: 2, step: 0.01, def: 0.5, rnd: [0.2, 1.1], show: hasMaterial('glass'), hint: 'How strongly rounded glass bends what is behind it: spheres and pills act as lenses, and past about 0.7 they turn the view upside down', tags: 'lens bend magnify distortion' },
  { key: 'objects.bevel', group: 'All objects', label: 'Bevel', type: 'range', min: 0, max: 1, step: 0.01, def: 0.3, rnd: [0.1, 0.6], show: hasGlassPane, hint: 'Width of the rounded edge of panes', tags: 'edge round' },
  { key: 'objects.rim', group: 'All objects', label: 'Edge light', type: 'range', min: 0, max: 1, step: 0.01, def: 0.35, rnd: [0.15, 0.6], show: hasMaterial('glass'), hint: 'Reflections and highlights caught by the edges of the glass (see Light)', tags: 'highlight reflection shine rim' },
  { key: 'objects.thickness', group: 'All objects', label: 'Thickness', type: 'range', min: 0, max: 1, step: 0.01, def: 0.25, rnd: [0, 0.6], show: hasMaterial('glass'), hint: 'The visible side of each piece of glass', tags: 'depth edge 3d extrude side' },
  { key: 'objects.shadow', group: 'All objects', label: 'Shadow', type: 'range', min: 0, max: 1, step: 0.01, def: 0.35, rnd: [0.15, 0.6], show: objectsOn, hint: 'Soft shadows on the flow behind, colored by glass. They fall away from the light (see Light)', tags: 'drop shadow depth' },
  { key: 'objects.soft', group: 'All objects', label: 'Edge softness', type: 'range', min: 0, max: 1, step: 0.01, def: 0.02, rnd: [0, 0.1], show: hasMaterial('solid'), hint: 'Blurs the outline of solid objects', tags: 'feather blur' },

  { key: 'objects.scale', group: 'Arrange all', label: 'Scale', type: 'range', min: 0.2, max: 3, step: 0.001, def: 1, rnd: false, show: objectsOn, tags: 'size zoom group' },
  { key: 'objects.rotation', group: 'Arrange all', label: 'Rotate', type: 'range', min: -180, max: 180, step: 1, def: 0, unit: '°', rnd: false, show: objectsOn, tags: 'angle group' },
  { key: 'objects.offsetX', group: 'Arrange all', label: 'Move X', type: 'range', min: -2, max: 2, step: 0.001, def: 0, rnd: false, show: objectsOn, tags: 'position group pan' },
  { key: 'objects.offsetY', group: 'Arrange all', label: 'Move Y', type: 'range', min: -2, max: 2, step: 0.001, def: 0, rnd: false, show: objectsOn, tags: 'position group pan' },

  // drift is applied in objects.js, before the shaders see the positions
  { key: 'objects.drift', group: 'Motion', label: 'Drift', type: 'range', min: 0, max: 2, step: 0.01, def: 0.3, rnd: [0.1, 0.8], uniform: false, show: objectsOn, hint: 'Objects float gently as the animation plays', tags: 'float move animate' },
  { key: 'objects.seed', group: 'Motion', label: 'Drift seed', type: 'seed', min: 0, max: 9999, def: 7, rnd: [0, 9999], uniform: false, show: (s) => objectsOn(s) && s.objects.drift > 0, tags: 'random variation' },

  // ── Color ─────────────────────────────────────────────────────────────────
  // color.stops is edited by the gradient editor (not a schema control)
  { key: 'color.spread', label: 'Contrast', type: 'range', min: 0.2, max: 4, step: 0.01, def: 1.2, rnd: [0.9, 2], tags: 'spread range' },
  { key: 'color.shift', label: 'Balance', type: 'range', min: -0.6, max: 0.6, step: 0.01, def: 0, rnd: [-0.15, 0.15], tags: 'shift bias' },
  { key: 'color.repeat', label: 'Repeat', type: 'range', min: 1, max: 8, step: 0.01, def: 1, rnd: false, tags: 'cycles' },
  { key: 'color.offset', label: 'Offset', type: 'range', min: 0, max: 1, step: 0.001, def: 0, rnd: false },
  { key: 'color.mirror', label: 'Mirror repeats', type: 'toggle', def: true, rnd: false },
  { key: 'color.cycle', label: 'Color cycle', type: 'int', min: -4, max: 4, step: 1, def: 0, rnd: false, uniform: false, hint: 'Palette cycles per loop', tags: 'animate rotate palette' },
  { key: 'color.posterize', label: 'Posterize', type: 'int', min: 0, max: 16, step: 1, def: 0, rnd: false, hint: '0 = smooth', tags: 'steps quantize flat' },

  // ── Surface ───────────────────────────────────────────────────────────────
  // The flow's value doubles as a height field; these settings light it.
  { key: 'surface.relief', label: 'Relief', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.6], hint: 'Shade the flow like a 3D surface', tags: 'emboss depth 3d bump shading' },
  { key: 'surface.gloss', label: 'Gloss', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.6], tags: 'shine specular' },
  { key: 'surface.glossSize', label: 'Gloss tightness', type: 'range', min: 0, max: 1, step: 0.01, def: 0.5, rnd: [0.2, 0.9], show: (s) => s.surface.gloss > 0 },
  { key: 'surface.chrome', label: 'Chrome', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.9], hint: 'Polished metal: the surface mirrors a horizon lit in your palette colors', tags: 'metal mirror liquid mercury reflective silver' },
  { key: 'surface.liquid', label: 'Liquid', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.8], hint: 'Clear liquid: each fold bends the colors beneath it and catches light along its edges', tags: 'glass transparent refraction clear water translucent' },
  { key: 'surface.iridescence', label: 'Iridescence', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.7], hint: 'Thin-film interference: the rainbow sheen of soap bubbles, oil and holographic foil', tags: 'holographic rainbow pearl oil soap opal foil' },
  { key: 'surface.film', label: 'Film thickness', type: 'range', min: 0, max: 1, step: 0.01, def: 0.35, rnd: [0.1, 0.8], show: (s) => s.surface.iridescence > 0, hint: 'Thin films give a few vivid bands; thick films give many pale ones' },
  { key: 'surface.sparkle', label: 'Sparkle', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.6], hint: 'Tiny glints that twinkle on the bright parts of the flow', tags: 'glitter glints stars dust shimmer' },
  { key: 'surface.sparkleDensity', label: 'Sparkle density', type: 'range', min: 0, max: 1, step: 0.01, def: 0.45, rnd: [0.2, 0.8], show: (s) => s.surface.sparkle > 0 },
  { key: 'surface.sparkleSize', label: 'Sparkle size', type: 'range', min: 0, max: 1, step: 0.01, def: 0.35, rnd: [0.15, 0.7], show: (s) => s.surface.sparkle > 0 },

  // ── Glass ─────────────────────────────────────────────────────────────────
  { key: 'glass.type', label: 'Glass', type: 'chips', options: GLASS_TYPES, def: 'none', rnd: false, tags: 'pane texture' },
  { key: 'glass.count', group: 'Shape', label: (s) => ({ water: 'Ripple density', hammered: 'Density', crystal: 'Facets', rain: 'Drop density', rings: 'Rings', tiles: 'Tiles', pyramid: 'Pyramids' })[s.glass.type] || 'Flutes', type: 'range', min: 2, max: 160, step: 0.5, def: 14, rnd: [6, 48], show: (s) => s.glass.type !== 'none', curve: 2, tags: 'density flutes ripples facets rings tiles pyramids drops' },
  { key: 'glass.angle', group: 'Shape', label: 'Angle', type: 'range', min: -90, max: 90, step: 1, def: 0, unit: '°', rnd: [-20, 20], show: (s) => ['reeded', 'wavy', 'tiles', 'hammered', 'crystal', 'pyramid'].includes(s.glass.type) },
  { key: 'glass.profile', group: 'Shape', label: 'Profile', type: 'select', options: GLASS_PROFILES, def: 'round', show: isGlass('reeded', 'wavy', 'rings', 'tiles'), hint: 'Cross-section of each flute', tags: 'shape cross section' },
  { key: 'glass.wave', group: 'Shape', label: 'Wave amount', type: 'range', min: 0, max: 3, step: 0.01, def: 0.6, rnd: [0.2, 1.5], show: isGlass('wavy') },
  { key: 'glass.waveFreq', group: 'Shape', label: 'Wave frequency', type: 'range', min: 0.2, max: 8, step: 0.01, def: 1.5, rnd: [0.5, 3], show: isGlass('wavy') },
  { key: 'glass.coverage', group: 'Shape', label: 'Coverage', type: 'range', min: 0.05, max: 1, step: 0.01, def: 0.55, rnd: [0.3, 0.8], show: isGlass('rain'), hint: 'How much of the pane is covered in drops' },
  { key: 'glass.centerX', group: 'Shape', label: 'Center X', type: 'range', min: -1.5, max: 1.5, step: 0.01, def: 0, rnd: [-1, 1], show: isGlass('rings') },
  { key: 'glass.centerY', group: 'Shape', label: 'Center Y', type: 'range', min: -1.5, max: 1.5, step: 0.01, def: 0, rnd: [-1, 1], show: isGlass('rings') },
  { key: 'glass.jitter', group: 'Shape', label: 'Irregularity', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.4], show: isGlass('reeded', 'wavy', 'rings', 'tiles', 'hammered', 'crystal', 'rain', 'pyramid') },

  { key: 'glass.panel', group: 'Coverage', label: 'Pane', type: 'select', options: [{ value: 'full', label: 'Full canvas' }, { value: 'right', label: 'Right side' }, { value: 'left', label: 'Left side' }, { value: 'top', label: 'Top' }, { value: 'bottom', label: 'Bottom' }, { value: 'window', label: 'Centered window' }, { value: 'band', label: 'Vertical band' }], def: 'full', rnd: false, show: glassOn, hint: 'Let the glass cover only part of the image', tags: 'mask area region split' },
  { key: 'glass.panelSize', group: 'Coverage', label: 'Pane size', type: 'range', min: 0.05, max: 1, step: 0.01, def: 0.55, rnd: [0.35, 0.7], show: (s) => glassOn(s) && s.glass.panel !== 'full' },
  { key: 'glass.panelOffset', group: 'Coverage', label: 'Pane offset', type: 'range', min: -1, max: 1, step: 0.01, def: 0, rnd: [-0.3, 0.3], show: (s) => glassOn(s) && s.glass.panel !== 'full' },

  { key: 'glass.strength', group: 'Light path', label: 'Refraction', type: 'range', min: -2, max: 2, step: 0.01, def: 0.6, rnd: [-1, 1.2], show: glassOn, hint: 'How far light bends — negative = concave flutes', tags: 'bend distortion lens' },
  { key: 'glass.ior', group: 'Light path', label: 'Index (IOR)', type: 'range', min: 1.05, max: 2.4, step: 0.01, def: 1.5, rnd: [1.35, 1.8], show: glassOn, hint: 'Index of refraction: 1.33 water · 1.5 glass · 2.4 diamond. Drives reflections and total internal reflection.', tags: 'refractive index' },
  { key: 'glass.frost', group: 'Light path', label: (s) => (s.glass.type === 'rain' || s.glass.backType === 'rain' ? 'Fog' : 'Frost'), type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.4], show: glassOn, hint: 'Scatters light passing through (rough / fogged glass)', tags: 'frost fog blur rough matte' },
  { key: 'glass.streak', group: 'Light path', label: 'Streak', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.4], show: glassOn, hint: 'Out-of-focus light smears along the flutes, like lights seen through reeded glass', tags: 'smear' },
  { key: 'glass.dispersion', group: 'Light path', label: 'Dispersion', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.5], show: glassOn, hint: 'Splits light into a rainbow where it bends', tags: 'rainbow chromatic prism spectrum' },
  { key: 'glass.caustics', group: 'Light path', label: 'Caustics', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.6], show: glassOn, hint: 'Light concentrated by each lens — bright cores and focus lines' },

  { key: 'glass.reflect', group: 'Surface', label: 'Reflections', type: 'range', min: 0, max: 1, step: 0.01, def: 0.15, rnd: [0, 0.5], show: glassOn, hint: 'Fresnel reflections of the light environment (see Light)', tags: 'fresnel mirror' },
  { key: 'glass.highlight', group: 'Surface', label: 'Highlight', type: 'range', min: 0, max: 1, step: 0.01, def: 0.08, rnd: [0, 0.4], show: glassOn, hint: 'Reflection of the light source on the glass surface — the bright line on each flute', tags: 'specular shine' },
  { key: 'glass.sharpness', group: 'Surface', label: 'Sharpness', type: 'range', min: 0, max: 1, step: 0.01, def: 0.5, rnd: [0.3, 0.85], show: (s) => glassOn(s) && s.glass.highlight > 0 },
  { key: 'glass.shadow', group: 'Surface', label: 'Edge shadow', type: 'range', min: 0, max: 1, step: 0.01, def: 0.25, rnd: [0, 0.7], show: glassOn, tags: 'edges darken' },
  { key: 'glass.tintAmount', group: 'Surface', label: 'Tint', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.5], show: glassOn, hint: 'Colored glass — thicker parts absorb more', tags: 'color stained' },
  { key: 'glass.tint', group: 'Surface', label: 'Tint color', type: 'color', def: '#7fd1b0', rnd: false, show: (s) => glassOn(s) && s.glass.tintAmount > 0 },

  { key: 'glass.backType', group: 'Second pane', label: 'Back pane', type: 'select', options: GLASS_TYPES, def: 'none', rnd: false, hint: 'Stack a second sheet of glass behind the first', tags: 'second double layer stack' },
  { key: 'glass.backCount', group: 'Second pane', label: 'Density', type: 'range', min: 2, max: 160, step: 0.5, def: 14, rnd: [6, 40], show: (s) => s.glass.backType !== 'none', curve: 2 },
  { key: 'glass.backAngle', group: 'Second pane', label: 'Angle', type: 'range', min: -90, max: 90, step: 1, def: 90, unit: '°', rnd: [-90, 90], show: (s) => s.glass.backType !== 'none' },
  { key: 'glass.backStrength', group: 'Second pane', label: 'Refraction', type: 'range', min: -2, max: 2, step: 0.01, def: 0.5, rnd: [-0.8, 0.8], show: (s) => s.glass.backType !== 'none' },

  // ── Light ─────────────────────────────────────────────────────────────────
  { key: 'light.angle', label: 'Direction', type: 'range', min: 0, max: 360, step: 1, def: 120, unit: '°', rnd: [0, 360], tags: 'angle sun' },
  { key: 'light.elevation', label: 'Elevation', type: 'range', min: 5, max: 90, step: 1, def: 50, unit: '°', rnd: [25, 70], hint: 'Low light = long grazing highlights', tags: 'height altitude' },
  { key: 'light.intensity', label: 'Intensity', type: 'range', min: 0, max: 3, step: 0.01, def: 1, rnd: [0.8, 1.4], tags: 'brightness strength' },
  { key: 'light.color', label: 'Color', type: 'color', def: '#ffffff', rnd: false },
  { key: 'light.env', label: 'Environment', type: 'select', options: LIGHT_ENVS, def: 'studio', hint: 'What the glass reflects', tags: 'reflection surroundings' },

  // ── Screen ────────────────────────────────────────────────────────────────
  { key: 'screen.type', label: 'Screen', type: 'chips', options: SCREEN_TYPES, def: 'none', rnd: false, tags: 'texture effect overlay moire engraving' },
  { key: 'screen.size', label: (s) => (s.screen.type === 'lines' || s.screen.type === 'moire' ? 'Lines' : 'Cells'), type: 'range', min: 10, max: 400, step: 1, def: 110, rnd: [60, 220], show: (s) => screenOn(s) && s.screen.type !== 'contour', curve: 2, hint: 'Cells across the canvas height', tags: 'resolution density scale' },
  { key: 'screen.angle', label: 'Angle', type: 'range', min: 0, max: 90, step: 1, def: 45, unit: '°', rnd: [0, 90], show: (s) => isScreen('halftone', 'moire')(s) || (isScreen('lines')(s) && s.screen.lineShape !== 'rings') },
  { key: 'screen.bend', label: 'Bend', type: 'range', min: 0, max: 2, step: 0.01, def: 0.8, rnd: [0.3, 1.5], show: isScreen('moire'), hint: 'How far the lines follow the shapes in the image', tags: 'warp follow engrave' },
  { key: 'screen.interference', label: 'Interference', type: 'range', min: 0, max: 30, step: 0.1, def: 4, unit: '°', rnd: [0, 10], show: isScreen('moire'), hint: 'Angle of a second layer of lines. Small angles make broad moiré fringes; 0 = one layer', tags: 'moire second layer cross' },
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
  { key: 'screen.dotScale', label: (s) => (s.screen.type === 'crt' ? 'Mask strength' : s.screen.type === 'mosaic' ? 'Tile size' : s.screen.type === 'lines' || s.screen.type === 'moire' ? 'Line weight' : 'Dot size'), type: 'range', min: 0.1, max: 1.5, step: 0.01, def: 0.9, rnd: [0.6, 1.1], show: isScreen('halftone', 'lines', 'moire', 'led', 'crt', 'mosaic') },
  { key: 'screen.contrast', label: 'Contrast', type: 'range', min: 0.2, max: 3, step: 0.01, def: 1, rnd: [0.8, 1.6], show: (s) => screenOn(s) && s.screen.type !== 'contour' },
  { key: 'screen.invert', label: 'Invert', type: 'toggle', def: false, rnd: false, show: isScreen('halftone', 'lines', 'moire', 'dither') },
  { key: 'screen.colorMode', label: 'Color', type: 'select', options: [{ value: 'source', label: 'From image' }, { value: 'mono', label: 'Ink & paper' }], def: 'source', show: (s) => screenOn(s) && s.screen.type !== 'crt', tags: 'monochrome mono' },
  { key: 'screen.ink', label: 'Ink', type: 'color', def: '#ffffff', rnd: false, show: (s) => screenOn(s) && s.screen.colorMode === 'mono' && s.screen.type !== 'crt' },
  { key: 'screen.paper', label: 'Paper', type: 'color', def: '#05060a', rnd: false, show: (s) => screenOn(s) && s.screen.colorMode === 'mono' && s.screen.type !== 'crt' },
  { key: 'screen.background', label: 'Background', type: 'range', min: 0, max: 1, step: 0.01, def: 0.12, rnd: [0, 0.4], show: (s) => isScreen('halftone', 'lines', 'moire', 'led', 'mosaic', 'contour')(s) && s.screen.colorMode === 'source', hint: 'How much of the image shows between marks' },
  { key: 'screen.fill', label: 'Lines over image', type: 'toggle', def: false, rnd: false, show: isScreen('contour') },
  { key: 'screen.glow', label: (s) => (s.screen.type === 'mosaic' ? 'Bevel' : s.screen.type === 'led' || s.screen.type === 'crt' ? 'Glow' : 'Boost'), type: 'range', min: 0, max: 1, step: 0.01, def: 0.3, rnd: [0, 0.6], show: isScreen('halftone', 'lines', 'moire', 'led', 'crt', 'mosaic', 'contour') },
  { key: 'screen.mix', label: 'Mix', type: 'range', min: 0, max: 1, step: 0.01, def: 1, rnd: false, show: screenOn, tags: 'opacity amount blend' },

  // ── Finish ────────────────────────────────────────────────────────────────
  { key: 'finish.exposure', label: 'Brightness', type: 'range', min: -2, max: 2, step: 0.01, def: 0, rnd: [-0.2, 0.2], tags: 'exposure' },
  { key: 'finish.contrast', label: 'Contrast', type: 'range', min: 0, max: 2, step: 0.01, def: 1, rnd: [0.9, 1.2] },
  { key: 'finish.saturation', label: 'Saturation', type: 'range', min: 0, max: 2, step: 0.01, def: 1, rnd: [0.85, 1.25], tags: 'vibrance gray grey' },
  { key: 'finish.hue', label: 'Hue shift', type: 'range', min: -180, max: 180, step: 1, def: 0, unit: '°', rnd: false, tags: 'color rotate' },
  { key: 'finish.grain', label: 'Grain', type: 'range', min: 0, max: 1, step: 0.01, def: 0.08, rnd: [0, 0.35], tags: 'noise film texture' },
  { key: 'finish.grainSize', label: 'Grain size', type: 'range', min: 0.5, max: 4, step: 0.01, def: 1, rnd: [0.8, 1.6], show: (s) => s.finish.grain > 0 },
  { key: 'finish.grainAnim', label: 'Animated grain', type: 'toggle', def: true, rnd: false, show: (s) => s.finish.grain > 0 },
  { key: 'finish.vignette', label: 'Vignette', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.5], tags: 'darken edges corners' },
  { key: 'finish.bloom', label: 'Bloom', type: 'range', min: 0, max: 2, step: 0.01, def: 0, rnd: [0, 0.8], tags: 'glow halation' },
  { key: 'finish.bloomRadius', label: 'Bloom radius', type: 'range', min: 0, max: 1, step: 0.01, def: 0.5, rnd: [0.2, 0.8], show: (s) => s.finish.bloom > 0 },
  { key: 'finish.bloomThreshold', label: 'Bloom threshold', type: 'range', min: 0, max: 1, step: 0.01, def: 0.55, rnd: [0.3, 0.8], show: (s) => s.finish.bloom > 0 },
  { key: 'finish.aberration', label: 'Aberration', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.3], hint: 'Rainbow fringes from an imperfect lens', tags: 'chromatic rgb fringe prism' },
  { key: 'finish.aberrationMode', label: 'Aberration style', type: 'select', options: [{ value: 'lens', label: 'Lens (radial)' }, { value: 'orbit', label: 'Orbit (around the center)' }], def: 'lens', show: (s) => s.finish.aberration > 0, hint: 'Orbit fringes the sides of lines that point at the center' },
  { key: 'finish.streak', label: 'Streaks', type: 'range', min: 0, max: 1, step: 0.01, def: 0, rnd: [0, 0.5], hint: 'Motion streaks: light smears away from a center (zoom), around it (spin) or in one direction', tags: 'zoom blur radial motion speed warp hyperspace spin' },
  { key: 'finish.streakType', label: 'Streak type', type: 'select', options: STREAK_TYPES, def: 'zoom', show: streakOn },
  { key: 'finish.streakAngle', label: 'Streak angle', type: 'range', min: -180, max: 180, step: 1, def: 0, unit: '°', rnd: [-180, 180], show: (s) => streakOn(s) && s.finish.streakType === 'linear' },
  { key: 'finish.streakX', label: 'Streak center X', type: 'range', min: -1.5, max: 1.5, step: 0.01, def: 0, rnd: [-0.5, 0.5], show: (s) => streakOn(s) && s.finish.streakType !== 'linear' },
  { key: 'finish.streakY', label: 'Streak center Y', type: 'range', min: -1.5, max: 1.5, step: 0.01, def: 0, rnd: [-0.5, 0.5], show: (s) => streakOn(s) && s.finish.streakType !== 'linear' },
  { key: 'finish.grid', label: 'Grid overlay', type: 'toggle', def: false, rnd: false, tags: 'guides lines' },
  { key: 'finish.gridSize', label: 'Grid cells', type: 'range', min: 1, max: 40, step: 0.5, def: 6, rnd: false, show: (s) => s.finish.grid },
  { key: 'finish.gridOpacity', label: 'Grid opacity', type: 'range', min: 0, max: 1, step: 0.01, def: 0.35, rnd: false, show: (s) => s.finish.grid },
  { key: 'finish.gridDots', label: 'Markers', type: 'range', min: 0, max: 1, step: 0.01, def: 0.1, rnd: false, show: (s) => s.finish.grid },
  { key: 'finish.gridColor', label: 'Grid color', type: 'color', def: '#ffffff', rnd: false, show: (s) => s.finish.grid },

  // ── Motion ────────────────────────────────────────────────────────────────
  { key: 'anim.speed', label: 'Speed', type: 'range', min: 0, max: 3, step: 0.01, def: 0.6, uniform: false, tags: 'animation tempo fast slow' },
  { key: 'anim.loop', label: 'Seamless loop', type: 'toggle', def: true, uniform: false, hint: 'Animation repeats perfectly — great for video wallpapers' },
  { key: 'anim.duration', label: 'Loop length', type: 'range', min: 2, max: 60, step: 0.5, def: 10, unit: 's', uniform: false, show: (s) => s.anim.loop, tags: 'length time seconds' },
  { key: 'anim.fps', label: 'Video FPS', type: 'select', options: [{ value: '24', label: '24 fps' }, { value: '30', label: '30 fps' }, { value: '60', label: '60 fps' }], def: '30', uniform: false, tags: 'frame rate framerate' },

  // ── Export ────────────────────────────────────────────────────────────────
  { key: 'export.scale', label: 'Scale', type: 'select', options: [{ value: '0.5', label: '0.5×' }, { value: '1', label: '1×' }, { value: '2', label: '2×' }, { value: '3', label: '3×' }, { value: '4', label: '4×' }], def: '1', uniform: false, tags: 'resolution size multiplier' },
  { key: 'export.format', label: 'Format', type: 'select', options: [{ value: 'png', label: 'PNG 8-bit' }, { value: 'png16', label: 'PNG 16-bit (no banding)' }, { value: 'jpeg', label: 'JPEG' }, { value: 'webp', label: 'WebP' }], def: 'png', uniform: false, tags: 'file type jpg' },
  { key: 'export.quality', label: 'Quality', type: 'range', min: 0.5, max: 1, step: 0.01, def: 0.95, uniform: false, show: (s) => s.export.format === 'jpeg' || s.export.format === 'webp', tags: 'compression' },
  { key: 'export.burst', label: 'Burst frames', type: 'int', min: 2, max: 60, step: 1, def: 12, uniform: false, hint: 'Frames spread evenly over the loop', tags: 'sequence zip' },
];

export const PARAM_MAP = Object.fromEntries(PARAMS.map((p) => [p.key, p]));

// Sections that make up a "look" — saved in presets, history, share links.
export const LOOK_SECTIONS = ['source', 'objects', 'color', 'surface', 'glass', 'light', 'screen', 'finish', 'anim'];

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

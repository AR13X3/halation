// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 AR13X3 — Halation (https://github.com/AR13X3/halation)
// Inline SVG icons (20×20, stroke = currentColor).

const svg = (body, extra = '') =>
  `<svg viewBox="0 0 20 20" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round" ${extra}>${body}</svg>`;

const dots = (pts) => `<g fill="currentColor" stroke="none">${pts.map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}"/>`).join('')}</g>`;

export const ICONS = {
  // patterns
  silk: svg('<path d="M2 13c3-6 6 2 9-4s5-4 7-6"/><path d="M2 17.5c3-6 6 2 9-4s5-4 7-6" opacity=".55"/>'),
  bands: svg('<path d="M3 17L17 3" stroke-width="3" opacity=".35"/><path d="M3 11L11 3M9 17l8-8"/>'),
  mesh: svg('<circle cx="7" cy="8" r="4.2"/><circle cx="13" cy="12.5" r="4.8" opacity=".6"/>'),
  ribbons: svg('<path d="M2 6c4-3 8 3 16 0M2 10c4-3 8 3 16 0M2 14c4-3 8 3 16 0"/>'),
  fluid: svg('<path d="M10 2.5c3 4 5.5 6.6 5.5 9.8a5.5 5.5 0 0 1-11 0C4.5 9.1 7 6.5 10 2.5z"/><path d="M7.5 12.5a2.6 2.6 0 0 0 2.5 2.6" opacity=".6"/>'),
  image: svg('<rect x="2.5" y="4" width="15" height="12" rx="2"/><path d="M3 14l4-4 3 3 3-3 4 4"/><circle cx="13" cy="8" r="1.3"/>'),
  // glass
  none: svg('<circle cx="10" cy="10" r="7"/><path d="M5 15L15 5"/>'),
  reeded: svg('<path d="M4 3v14M8 3v14M12 3v14M16 3v14"/>'),
  wavy: svg('<path d="M4 3c-2 3 2 4 0 7s2 4 0 7M10 3c-2 3 2 4 0 7s2 4 0 7M16 3c-2 3 2 4 0 7s2 4 0 7"/>'),
  rings: svg('<circle cx="10" cy="10" r="2.2"/><circle cx="10" cy="10" r="5.2"/><circle cx="10" cy="10" r="8.2"/>'),
  tiles: svg('<rect x="3" y="3" width="6" height="6" rx="1.2"/><rect x="11" y="3" width="6" height="6" rx="1.2"/><rect x="3" y="11" width="6" height="6" rx="1.2"/><rect x="11" y="11" width="6" height="6" rx="1.2"/>'),
  hammered: svg('<circle cx="6" cy="6" r="3"/><circle cx="14" cy="6.5" r="3.4"/><circle cx="6.5" cy="14" r="3.4"/><circle cx="14.5" cy="14.5" r="2.6"/>'),
  water: svg('<path d="M2 6.5c2-2 4-2 6 0s4 2 6 0 3-1.5 4-1M2 11c2-2 4-2 6 0s4 2 6 0 3-1.5 4-1M2 15.5c2-2 4-2 6 0s4 2 6 0 3-1.5 4-1"/>'),
  crystal: svg('<path d="M10 2.5l6.5 5-2.5 9.5h-8L3.5 7.5z"/><path d="M3.5 7.5h13M10 2.5L7.5 7.5 10 17M10 2.5l2.5 5L10 17" opacity=".6"/>'),
  pyramid: svg('<rect x="3" y="3" width="14" height="14" rx="1"/><path d="M3 3l14 14M17 3L3 17M10 3v14M3 10h14" opacity=".55"/>'),
  shapes: svg('<circle cx="8" cy="8" r="5"/><rect x="10.5" y="9" width="6" height="9" rx="3" opacity=".6"/>'),
  rain: svg('<path d="M6.5 3.5c1.5 2 2.5 3.3 2.5 4.6a2.5 2.5 0 0 1-5 0c0-1.3 1-2.6 2.5-4.6zM13.5 9c1.5 2 2.5 3.3 2.5 4.6a2.5 2.5 0 0 1-5 0c0-1.3 1-2.6 2.5-4.6z"/><circle cx="6" cy="15.5" r="1.2"/><circle cx="15" cy="4.5" r="0.9"/>'),
  // screens
  halftone: svg(dots([[4, 4, 0.8], [10, 4, 1.3], [16, 4, 1.9], [4, 10, 1.3], [10, 10, 1.9], [16, 10, 2.4], [4, 16, 1.9], [10, 16, 2.4], [16, 16, 2.8]])),
  lines: svg('<path d="M3 4h14" stroke-width=".8"/><path d="M3 8h14" stroke-width="1.4"/><path d="M3 12h14" stroke-width="2.2"/><path d="M3 16h14" stroke-width="3"/>'),
  led: svg(dots([4, 8, 12, 16].flatMap((y) => [4, 8, 12, 16].map((x) => [x, y, 1.3])))),
  crt: svg('<path d="M4 3v14" stroke-width="2.4"/><path d="M10 3v14" stroke-width="2.4" opacity=".6"/><path d="M16 3v14" stroke-width="2.4" opacity=".3"/>'),
  mosaic: svg('<g fill="currentColor" stroke="none"><rect x="3" y="3" width="6.5" height="6.5" rx="1"/><rect x="10.5" y="3" width="6.5" height="6.5" rx="1" opacity=".5"/><rect x="3" y="10.5" width="6.5" height="6.5" rx="1" opacity=".3"/><rect x="10.5" y="10.5" width="6.5" height="6.5" rx="1" opacity=".75"/></g>'),
  contour: svg('<path d="M3 13c2-6 6-9 10-7s4 7 0 9-8 2-10-2z"/><path d="M6.5 12c1-3 3.5-4.5 5.5-3.5s2 3.5 0 4.5-4.5 1-5.5-1z"/>'),
  dither: svg('<g fill="currentColor" stroke="none">' + [0, 1, 2, 3].flatMap((y) => [0, 1, 2, 3].filter((x) => (x + y) % 2 === 0).map((x) => `<rect x="${3 + x * 3.5}" y="${3 + y * 3.5}" width="3.5" height="3.5"/>`)).join('') + '</g>'),

  // ui
  dice: svg('<rect x="3" y="3" width="14" height="14" rx="3"/><g fill="currentColor" stroke="none"><circle cx="7" cy="7" r="1.1"/><circle cx="13" cy="13" r="1.1"/><circle cx="10" cy="10" r="1.1"/></g>'),
  reset: svg('<path d="M4 10a6 6 0 1 0 2-4.5"/><path d="M4 4v3h3"/>'),
  play: svg('<path d="M6 4l10 6-10 6z" fill="currentColor"/>'),
  pause: svg('<rect x="5" y="4" width="3.2" height="12" rx="1" fill="currentColor"/><rect x="11.8" y="4" width="3.2" height="12" rx="1" fill="currentColor"/>'),
  camera: svg('<path d="M3 7.5A1.5 1.5 0 0 1 4.5 6h2l1.3-2h4.4L13.5 6h2A1.5 1.5 0 0 1 17 7.5v7a1.5 1.5 0 0 1-1.5 1.5h-11A1.5 1.5 0 0 1 3 14.5z"/><circle cx="10" cy="11" r="3"/>'),
  copy: svg('<rect x="6.5" y="6.5" width="10" height="10" rx="2"/><path d="M13.5 6.5V5a1.5 1.5 0 0 0-1.5-1.5H5A1.5 1.5 0 0 0 3.5 5v7A1.5 1.5 0 0 0 5 13.5h1.5"/>'),
  record: svg('<circle cx="10" cy="10" r="6.5"/><circle cx="10" cy="10" r="3.2" fill="currentColor"/>'),
  stop: svg('<rect x="5" y="5" width="10" height="10" rx="2" fill="currentColor"/>'),
  burst: svg('<rect x="2.5" y="5.5" width="10" height="10" rx="1.5"/><path d="M5.5 3.5h10a1.5 1.5 0 0 1 1.5 1.5v10"/>'),
  link: svg('<path d="M8.5 11.5a3.5 3.5 0 0 0 5 0l2.5-2.5a3.5 3.5 0 0 0-5-5l-1 1"/><path d="M11.5 8.5a3.5 3.5 0 0 0-5 0L4 11a3.5 3.5 0 0 0 5 5l1-1"/>'),
  undo: svg('<path d="M7 5L3.5 8.5 7 12"/><path d="M4 8.5h8a4.5 4.5 0 0 1 0 9H9"/>'),
  redo: svg('<path d="M13 5l3.5 3.5L13 12"/><path d="M16 8.5H8a4.5 4.5 0 0 0 0 9h3"/>'),
  loop: svg('<path d="M15 7.5A6 6 0 0 0 4.5 6.5M5 12.5a6 6 0 0 0 10.5 1"/><path d="M15.5 3.5v4h-4M4.5 16.5v-4h4"/>'),
  chevron: svg('<path d="M6 8l4 4 4-4"/>'),
  swap: svg('<path d="M6 3v14M6 3L3 6M6 3l3 3M14 17V3M14 17l-3-3M14 17l3-3"/>'),
  upload: svg('<path d="M10 13V3M6 7l4-4 4 4"/><path d="M3.5 13v2.5A1.5 1.5 0 0 0 5 17h10a1.5 1.5 0 0 0 1.5-1.5V13"/>'),
  download: svg('<path d="M10 3v10M6 9l4 4 4-4"/><path d="M3.5 13v2.5A1.5 1.5 0 0 0 5 17h10a1.5 1.5 0 0 0 1.5-1.5V13"/>'),
  trash: svg('<path d="M4 6h12M8 6V4h4v2M5.5 6l.8 10.5h7.4L14.5 6"/>'),
  plus: svg('<path d="M10 4v12M4 10h12"/>'),
  reverse: svg('<path d="M3 7h13M13 4l3 3-3 3M17 13H4M7 10l-3 3 3 3"/>'),
  eye: svg('<path d="M2 10s3-5.5 8-5.5S18 10 18 10s-3 5.5-8 5.5S2 10 2 10z"/><circle cx="10" cy="10" r="2.5"/>'),
  expand: svg('<path d="M3 8V3h5M17 8V3h-5M3 12v5h5M17 12v5h-5"/>'),
  sparkle: svg('<path d="M10 2.5l1.6 4.4 4.4 1.6-4.4 1.6L10 14.5l-1.6-4.4L4 8.5l4.4-1.6zM15.5 13l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7z"/>'),
  github: svg('<path d="M10 2a8 8 0 0 0-2.5 15.6c.4 0 .5-.2.5-.4v-1.5c-2.2.5-2.7-1-2.7-1-.4-.9-.9-1.2-.9-1.2-.7-.5.1-.5.1-.5.8.1 1.2.8 1.2.8.7 1.2 1.9.9 2.3.7.1-.5.3-.9.5-1.1-1.8-.2-3.6-.9-3.6-4 0-.9.3-1.6.8-2.1-.1-.2-.4-1 .1-2.1 0 0 .7-.2 2.2.8a7.6 7.6 0 0 1 4 0c1.5-1 2.2-.8 2.2-.8.4 1.1.2 1.9.1 2.1.5.6.8 1.3.8 2.1 0 3.1-1.9 3.8-3.6 4 .3.3.6.8.6 1.5v2.2c0 .2.1.5.6.4A8 8 0 0 0 10 2z" fill="currentColor" stroke="none"/>'),
  save: svg('<path d="M4 3.5h9.5L16.5 6.5v10a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-12a1 1 0 0 1 1-1z"/><path d="M6.5 3.5v4h6v-4M6.5 17.5v-5h7v5"/>'),
  close: svg('<path d="M5 5l10 10M15 5L5 15"/>'),
  search: svg('<circle cx="8.75" cy="8.75" r="5.25"/><path d="M12.6 12.6L17 17"/>'),
  keyboard: svg('<rect x="2" y="5" width="16" height="10" rx="2"/><path d="M5 8h1M8 8h1M11 8h1M14 8h1M6 12h8"/>'),
};

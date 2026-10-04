// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 AR13X3 — Halation (https://github.com/AR13X3/halation)
// Gradient editor: draggable stops, click-to-add, drag-off-to-delete,
// a palette library and a generator.

import { h } from './controls.js';
import { ICONS } from './icons.js';
import { PALETTES, gradientCss, sampleGradient, rgbToHex, randomPalette, sortStops } from '../palette.js';

export function gradientEditor(store) {
  let stops = structuredClone(store.get('color.stops'));
  let sel = 0;
  let dragging = null;

  const bar = h('div', { class: 'grad-bar', title: 'Click to add a color stop' });
  const handles = h('div', { class: 'grad-handles' });
  const track = h('div', { class: 'grad-track' }, bar, handles);

  const colorInput = h('input', { type: 'color', class: 'color-input' });
  const swatch = h('label', { class: 'swatch' }, colorInput);
  const hex = h('input', { type: 'text', class: 'num num-wide hex', maxlength: 7, spellcheck: 'false' });
  const pos = h('input', { type: 'text', class: 'num', inputmode: 'decimal' });
  const del = h('button', { class: 'icon-btn', title: 'Delete stop (or drag it off the bar)', html: ICONS.trash });
  const stopRow = h('div', { class: 'grad-stop-row' },
    swatch,
    h('div', { class: 'num-wrap num-wrap-wide' }, hex),
    h('div', { class: 'num-wrap' }, pos, h('span', { class: 'unit' }, '%')),
    del);

  const reverseBtn = h('button', { class: 'text-btn', html: `${ICONS.reverse}<span>Reverse</span>` });
  const randomBtn = h('button', { class: 'text-btn', html: `${ICONS.sparkle}<span>Generate</span>` });
  const libToggle = h('button', { class: 'text-btn', html: `<span>Library</span>${ICONS.chevron}` });
  const actions = h('div', { class: 'grad-actions' }, reverseBtn, randomBtn, h('div', { class: 'spacer' }), libToggle);

  const lib = h('div', { class: 'grad-lib' },
    PALETTES.map((p) => h('button', {
      class: 'grad-swatch',
      title: p.name,
      style: { background: gradientCss(p.stops) },
      onclick: () => { stops = structuredClone(p.stops); sel = 0; push(true); },
    })));
  lib.hidden = localStorage.getItem('halation.libOpen') !== '1';
  libToggle.classList.toggle('open', !lib.hidden);
  libToggle.addEventListener('click', () => {
    lib.hidden = !lib.hidden;
    libToggle.classList.toggle('open', !lib.hidden);
    try { localStorage.setItem('halation.libOpen', lib.hidden ? '0' : '1'); } catch {}
  });

  const el = h('div', { class: 'grad-editor' }, track, stopRow, actions, lib);

  function push(commit) {
    store.set('color.stops', structuredClone(stops));
    if (commit) store.commit();
    render();
  }

  function render() {
    bar.style.background = gradientCss(stops);
    handles.replaceChildren(...stops.map((s, i) => {
      const hd = h('div', {
        class: 'grad-handle' + (i === sel ? ' active' : '') + (dragging?.index === i && dragging.remove ? ' removing' : ''),
        style: { left: `${s.pos * 100}%` },
      }, h('span', { style: { background: s.color } }));
      hd.addEventListener('pointerdown', (e) => startDrag(e, i));
      return hd;
    }));
    const s = stops[sel];
    if (s) {
      colorInput.value = s.color;
      swatch.style.background = s.color;
      if (document.activeElement !== hex) hex.value = s.color;
      if (document.activeElement !== pos) pos.value = Math.round(s.pos * 100);
    }
    del.disabled = stops.length <= 2;
  }

  function startDrag(e, i) {
    e.preventDefault();
    e.stopPropagation();
    sel = i;
    const rect = track.getBoundingClientRect();
    dragging = { index: i, startY: e.clientY, remove: false, moved: false };
    const move = (ev) => {
      const x = Math.min(1, Math.max(0, (ev.clientX - rect.left) / rect.width));
      dragging.moved = true;
      dragging.remove = stops.length > 2 && Math.abs(ev.clientY - dragging.startY) > 36;
      stops[i].pos = +x.toFixed(4);
      push(false);
    };
    const up = () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      const d = dragging;
      dragging = null;
      if (d.remove) {
        stops.splice(i, 1);
        sel = Math.max(0, Math.min(sel, stops.length - 1));
      } else {
        const ref = stops[i];
        stops = sortStops(stops);
        sel = stops.indexOf(ref);
      }
      push(d.moved || d.remove);
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    render();
  }

  bar.addEventListener('pointerdown', (e) => {
    const rect = track.getBoundingClientRect();
    const x = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
    const color = rgbToHex(sampleGradient(stops, x));
    const ref = { pos: +x.toFixed(4), color };
    stops = sortStops([...stops, ref]);
    sel = stops.indexOf(ref);
    push(true);
    startDrag(e, sel);
  });

  colorInput.addEventListener('input', () => {
    if (!stops[sel]) return;
    stops[sel].color = colorInput.value;
    push(false);
  });
  colorInput.addEventListener('change', () => store.commit());

  hex.addEventListener('change', () => {
    let v = hex.value.trim();
    if (!v.startsWith('#')) v = '#' + v;
    if (/^#[0-9a-f]{6}$/i.test(v) && stops[sel]) {
      stops[sel].color = v.toLowerCase();
      push(true);
    } else render();
  });
  hex.addEventListener('keydown', (e) => { if (e.key === 'Enter') hex.blur(); });

  pos.addEventListener('change', () => {
    const v = parseFloat(pos.value);
    if (Number.isFinite(v) && stops[sel]) {
      const ref = stops[sel];
      ref.pos = Math.min(1, Math.max(0, v / 100));
      stops = sortStops(stops);
      sel = stops.indexOf(ref);
      push(true);
    } else render();
  });
  pos.addEventListener('keydown', (e) => { if (e.key === 'Enter') pos.blur(); });

  del.addEventListener('click', () => {
    if (stops.length <= 2) return;
    stops.splice(sel, 1);
    sel = Math.max(0, sel - 1);
    push(true);
  });

  reverseBtn.addEventListener('click', () => {
    stops = sortStops(stops.map((s) => ({ pos: +(1 - s.pos).toFixed(4), color: s.color })));
    sel = stops.length - 1 - sel;
    push(true);
  });

  randomBtn.addEventListener('click', () => {
    stops = randomPalette();
    sel = 0;
    push(true);
  });

  function sync() {
    if (dragging) return;
    const s = store.get('color.stops');
    if (JSON.stringify(s) !== JSON.stringify(stops)) {
      stops = structuredClone(s);
      sel = Math.min(sel, stops.length - 1);
    }
    render();
  }

  render();
  return { el, sync };
}

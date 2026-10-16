// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 AR13X3 — Halation (https://github.com/AR13X3/halation)
// Schema-driven controls. Each returns { el, sync } — sync() pulls the latest
// value + visibility from the store.

import { ICONS } from './icons.js';
import { objectValue, gradientStops } from '../schema.js';
import { sampleGradient, rgbToHex, gradientCss, PALETTES } from '../palette.js';

const PALETTE_OPTIONS = PALETTES.map((p) => ({ value: p.name, label: p.name, stops: p.stops }));

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'html') el.innerHTML = v;
    else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const labelText = (p, s) => (typeof p.label === 'function' ? p.label(s) : p.label);

function decimals(step) {
  const s = String(step);
  return s.includes('.') ? s.split('.')[1].length : 0;
}

function formatNum(v, p) {
  if (p.type === 'int' || p.type === 'seed') return String(Math.round(v));
  const d = Math.min(decimals(p.step ?? 0.01), 3);
  return Number(v).toFixed(d);
}

export function createControl(p, store) {
  switch (p.type) {
    case 'range':
    case 'int':
      return p.noSlider ? numberControl(p, store) : rangeControl(p, store);
    case 'seed': return seedControl(p, store);
    case 'select': return selectControl(p, store);
    case 'chips': return chipsControl(p, store);
    case 'toggle': return toggleControl(p, store);
    case 'color': return colorControl(p, store);
    case 'picker': return pickerControl(p, store);
    case 'gradient': return gradientPickControl(p, store);
    default: throw new Error('Unknown control type ' + p.type);
  }
}

function wrap(p, store, body, extraClass = '') {
  const label = h('label', { class: 'ctl-label', title: p.hint ? `${p.hint}\n(double-click to reset)` : 'Double-click to reset' });
  const el = h('div', { class: `ctl ${extraClass}` }, label, body);
  label.addEventListener('dblclick', () => {
    store.set(p.key, structuredClone(p.def));
    store.commit();
  });
  return { el, label };
}

function visible(p, store, el) {
  const show = p.show ? p.show(store.state) : true;
  el.hidden = !show;
  return show;
}

// ── range ───────────────────────────────────────────────────────────────────
function rangeControl(p, store) {
  const curve = p.curve || 1;
  const toPos = (v) => Math.pow((v - p.min) / (p.max - p.min), 1 / curve);
  const fromPos = (u) => p.min + (p.max - p.min) * Math.pow(u, curve);
  const snap = (v) => {
    const st = p.type === 'int' ? 1 : p.step || 0.01;
    v = Math.round(v / st) * st;
    return +Math.min(p.max, Math.max(p.min, v)).toFixed(6);
  };

  const slider = h('input', { type: 'range', class: 'slider', min: 0, max: 1000, step: 1 });
  const num = h('input', { type: 'text', class: 'num', inputmode: 'decimal', spellcheck: 'false' });
  const unit = p.unit ? h('span', { class: 'unit' }, p.unit) : null;
  const body = h('div', { class: 'ctl-body' }, slider, h('div', { class: 'num-wrap' }, num, unit));
  const { el, label } = wrap(p, store, body, 'ctl-range');
  // The label sits on the slider (the whole bar), so the bar carries its
  // tooltip and double-clicking anywhere on it resets the value.
  el.title = label.title;
  el.addEventListener('dblclick', (e) => {
    if (e.target === num) return;
    store.set(p.key, structuredClone(p.def));
    store.commit();
  });

  slider.addEventListener('input', () => {
    store.set(p.key, snap(fromPos(slider.value / 1000)));
  });
  slider.addEventListener('change', () => store.commit());

  const commitNum = () => {
    const v = parseFloat(num.value);
    if (Number.isFinite(v)) store.set(p.key, snap(v));
    store.commit();
    sync();
  };
  num.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { num.blur(); }
    else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
      e.preventDefault();
      const st = (p.type === 'int' ? 1 : p.step || 0.01) * (e.shiftKey ? 10 : 1);
      store.set(p.key, snap(store.get(p.key) + (e.key === 'ArrowUp' ? st : -st)));
      store.commit();
    } else if (e.key === 'Escape') { sync(true); num.blur(); }
  });
  num.addEventListener('blur', commitNum);
  num.addEventListener('focus', () => num.select());

  // Drag on the number to scrub.
  let scrub = null;
  num.addEventListener('pointerdown', (e) => {
    if (document.activeElement === num) return;
    scrub = { x: e.clientX, v: store.get(p.key), moved: false };
    num.setPointerCapture(e.pointerId);
    e.preventDefault();
  });
  num.addEventListener('pointermove', (e) => {
    if (!scrub) return;
    const dx = e.clientX - scrub.x;
    if (Math.abs(dx) > 2) scrub.moved = true;
    if (!scrub.moved) return;
    const range = p.max - p.min;
    store.set(p.key, snap(scrub.v + (dx / 200) * range * (e.shiftKey ? 0.1 : 1)));
  });
  num.addEventListener('pointerup', () => {
    if (!scrub) return;
    if (!scrub.moved) num.focus();
    else store.commit();
    scrub = null;
  });

  function sync(force) {
    if (!visible(p, store, el)) return;
    const v = store.get(p.key);
    label.textContent = labelText(p, store.state);
    const pos = toPos(v);
    slider.value = Math.round(pos * 1000);
    slider.style.setProperty('--fill', `${(pos * 100).toFixed(2)}%`);
    if (force || document.activeElement !== num) num.value = formatNum(v, p);
  }
  return { el, sync };
}

function numberControl(p, store) {
  const num = h('input', { type: 'number', class: 'num num-wide', min: p.min, max: p.max, step: p.step || 1 });
  const body = h('div', { class: 'ctl-body' }, h('div', { class: 'num-wrap num-wrap-wide' }, num, p.unit ? h('span', { class: 'unit' }, p.unit) : null));
  const { el, label } = wrap(p, store, body, 'ctl-number');
  const commit = () => {
    let v = Math.round(parseFloat(num.value));
    if (!Number.isFinite(v)) return sync(true);
    v = Math.min(p.max, Math.max(p.min, v));
    store.set(p.key, v);
    store.commit();
  };
  num.addEventListener('change', commit);
  num.addEventListener('keydown', (e) => { if (e.key === 'Enter') num.blur(); });
  function sync(force) {
    if (!visible(p, store, el)) return;
    label.textContent = labelText(p, store.state);
    if (force || document.activeElement !== num) num.value = store.get(p.key);
  }
  return { el, sync };
}

function seedControl(p, store) {
  const num = h('input', { type: 'text', class: 'num num-wide', inputmode: 'numeric' });
  const dice = h('button', { class: 'icon-btn', title: 'New random seed', 'aria-label': 'New random seed', html: ICONS.dice });
  const body = h('div', { class: 'ctl-body' }, h('div', { class: 'num-wrap num-wrap-wide' }, num), dice);
  const { el, label } = wrap(p, store, body, 'ctl-seed');
  dice.addEventListener('click', () => {
    store.set(p.key, Math.floor(Math.random() * (p.max + 1)));
    store.commit();
  });
  num.addEventListener('change', () => {
    const v = Math.round(parseFloat(num.value));
    if (Number.isFinite(v)) store.set(p.key, Math.min(p.max, Math.max(p.min, v)));
    store.commit();
  });
  num.addEventListener('keydown', (e) => { if (e.key === 'Enter') num.blur(); });
  function sync() {
    if (!visible(p, store, el)) return;
    label.textContent = labelText(p, store.state);
    if (document.activeElement !== num) num.value = store.get(p.key);
  }
  return { el, sync };
}

function selectControl(p, store) {
  const sel = h('select', { class: 'select' }, p.options.map((o) => h('option', { value: o.value }, o.label)));
  const body = h('div', { class: 'ctl-body' }, h('div', { class: 'select-wrap' }, sel, h('span', { class: 'select-caret', html: ICONS.chevron })));
  const { el, label } = wrap(p, store, body, 'ctl-select');
  sel.addEventListener('change', () => {
    store.set(p.key, sel.value);
    store.commit();
  });
  function sync() {
    if (!visible(p, store, el)) return;
    label.textContent = labelText(p, store.state);
    sel.value = store.get(p.key);
  }
  return { el, sync };
}

function chipsControl(p, store) {
  const buttons = p.options.map((o) =>
    h('button', { class: 'chip', 'data-value': o.value, title: o.label, onclick: () => { store.set(p.key, o.value); store.commit(); } },
      h('span', { class: 'chip-icon', html: ICONS[o.icon] || '' }),
      h('span', { class: 'chip-label' }, o.label)),
  );
  // Rows of four or five, whichever splits the options more evenly.
  const n = buttons.length;
  const cols = n <= 5 ? n : n === 6 ? 3 : n <= 8 ? 4 : 5;
  const grid = h('div', { class: 'chips' }, buttons);
  grid.style.setProperty('--cols', cols);
  const el = h('div', { class: 'ctl ctl-chips' }, grid);
  function sync() {
    if (!visible(p, store, el)) return;
    const v = store.get(p.key);
    for (const b of buttons) b.classList.toggle('active', b.dataset.value === v);
  }
  return { el, sync };
}

function toggleControl(p, store) {
  const input = h('input', { type: 'checkbox', class: 'switch-input' });
  const sw = h('label', { class: 'switch' }, input, h('span', { class: 'switch-track' }));
  const body = h('div', { class: 'ctl-body ctl-body-end' }, sw);
  const { el, label } = wrap(p, store, body, 'ctl-toggle');
  input.addEventListener('change', () => {
    store.set(p.key, input.checked);
    store.commit();
  });
  function sync() {
    if (!visible(p, store, el)) return;
    label.textContent = labelText(p, store.state);
    input.checked = !!store.get(p.key);
  }
  return { el, sync };
}

function colorControl(p, store) {
  const input = h('input', { type: 'color', class: 'color-input' });
  const swatch = h('label', { class: 'swatch' }, input);
  const hex = h('input', { type: 'text', class: 'num num-wide hex', spellcheck: 'false', maxlength: 7 });
  const body = h('div', { class: 'ctl-body' }, swatch, h('div', { class: 'num-wrap num-wrap-wide' }, hex));
  const { el, label } = wrap(p, store, body, 'ctl-color');
  input.addEventListener('input', () => store.set(p.key, input.value));
  input.addEventListener('change', () => store.commit());
  hex.addEventListener('change', () => {
    let v = hex.value.trim();
    if (!v.startsWith('#')) v = '#' + v;
    if (/^#[0-9a-f]{6}$/i.test(v)) { store.set(p.key, v.toLowerCase()); store.commit(); }
    sync(true);
  });
  hex.addEventListener('keydown', (e) => { if (e.key === 'Enter') hex.blur(); });
  function sync(force) {
    if (!visible(p, store, el)) return;
    label.textContent = labelText(p, store.state);
    const v = store.get(p.key);
    input.value = v;
    swatch.style.background = v;
    if (force || document.activeElement !== hex) hex.value = v;
  }
  return { el, sync };
}

// The color an object shows in the interface (a CSS background).
export function objectSwatch(s, i) {
  const fill = objectValue(s, i, 'Fill');
  if (fill === 'custom') return objectValue(s, i, 'Color');
  if (fill === 'gradient') return gradientCss(gradientStops(s, objectValue(s, i, 'Gradient')), 135);
  return rgbToHex(sampleGradient(s.color.stops, objectValue(s, i, 'Tone')));
}

/**
 * A grid of gradient swatches: the library, as in the Color section. `get`
 * says which one is chosen, `choose` applies one; `palette` adds a swatch
 * for the current palette first.
 */
export function gradientGrid({ store, palette = false, get, choose }) {
  const items = [...(palette ? [{ value: 'palette', label: 'Your palette' }] : []), ...PALETTE_OPTIONS];
  const buttons = items.map((o) => h('button', { class: 'grad-swatch', title: o.label, 'aria-label': o.label, onclick: () => choose(o) }));
  const el = h('div', { class: 'grad-lib grad-pick' }, buttons);
  const sync = () => {
    const cur = get();
    items.forEach((o, k) => {
      buttons[k].classList.toggle('active', o.value === cur);
      buttons[k].style.background = gradientCss(o.value === 'palette' ? store.state.color.stops : o.stops);
    });
  };
  return { el, sync };
}

// An object's gradient, picked from the library.
function gradientPickControl(p, store) {
  const grid = gradientGrid({ store, palette: true, get: () => store.get(p.key), choose: (o) => { store.set(p.key, o.value); store.commit(); } });
  const el = h('div', { class: 'ctl ctl-gradients' }, h('label', { class: 'ctl-label', title: 'Double-click to reset' }, p.label), grid.el);
  el.querySelector('.ctl-label').addEventListener('dblclick', () => { store.set(p.key, p.def); store.commit(); });
  function sync() {
    if (visible(p, store, el)) grid.sync();
  }
  return { el, sync };
}

// One numbered button per object, to choose the one the panel edits.
function pickerControl(p, store) {
  const row = h('div', { class: 'obj-picker', role: 'group', 'aria-label': 'Object to edit' });
  const el = h('div', { class: 'ctl ctl-picker' }, h('label', { class: 'ctl-label' }, p.label), row);
  let sig = '';
  function sync() {
    if (!visible(p, store, el)) return;
    const s = store.state;
    const cur = store.get(p.key);
    const colors = Array.from({ length: s.objects.count }, (_, k) => objectSwatch(s, k + 1));
    const next = `${cur}|${colors.join()}`;
    if (next === sig) return;
    sig = next;
    row.replaceChildren(...colors.map((c, k) => {
      const on = k + 1 === cur;
      return h('button', { class: on ? 'obj-pick active' : 'obj-pick', 'aria-pressed': String(on), title: `Edit object ${k + 1}`, onclick: () => store.set(p.key, k + 1) },
        h('span', { class: 'obj-dot', style: { background: c } }), String(k + 1));
    }));
  }
  return { el, sync };
}

// ── toast ───────────────────────────────────────────────────────────────────
let toastEl;
export function toast(msg, { type = 'info', duration = 2600, html = false } = {}) {
  if (!toastEl) {
    toastEl = h('div', { class: 'toasts' });
    document.body.append(toastEl);
  }
  const t = h('div', { class: `toast toast-${type}` });
  if (html) t.innerHTML = msg; else t.textContent = msg;
  toastEl.append(t);
  requestAnimationFrame(() => t.classList.add('show'));
  const close = () => {
    t.classList.remove('show');
    setTimeout(() => t.remove(), 300);
  };
  if (duration > 0) setTimeout(close, duration);
  return { el: t, close, update(m) { if (html) t.innerHTML = m; else t.textContent = m; } };
}

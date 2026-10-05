// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 AR13X3 — Halation (https://github.com/AR13X3/halation)
// Builds the right-hand control panel from the schema, with a search box that
// filters it.

import { PARAMS, SECTIONS, PARAM_MAP, DOC_SIZES } from '../schema.js';
import { createControl, h, labelText } from './controls.js';
import { gradientEditor } from './gradient.js';
import { ICONS } from './icons.js';

// Sections start collapsed except these; the user's own choices are remembered.
const OPEN_BY_DEFAULT = new Set(['doc', 'color']);
const FOLDS_KEY = 'halation.sections';

function loadFolds() {
  try { return JSON.parse(localStorage.getItem(FOLDS_KEY) || '{}'); } catch { return {}; }
}

export function buildPanel(root, store, actions) {
  const syncers = [];
  const folds = loadFolds();
  const sections = []; // { sec, el }
  const groups = [];   // subheads: { sec, name, el }
  const items = [];    // rows the search can find: { sec, el, p?, core(), context }
  const search = searchBox({ onChange: () => { filter(); root.scrollTop = 0; }, onEnter: focusFirstResult });
  root.append(search.el);

  for (const sec of SECTIONS) {
    const body = h('div', { class: 'section-body' });
    const headBtns = h('div', { class: 'section-btns' });
    if (sec.randomizable !== false) {
      headBtns.append(
        h('button', { class: 'icon-btn sm', title: `Randomize ${sec.title.toLowerCase()}`, html: ICONS.dice, onclick: (e) => { e.stopPropagation(); actions.randomizeSection(sec.id); } }),
        h('button', { class: 'icon-btn sm', title: `Reset ${sec.title.toLowerCase()}`, html: ICONS.reset, onclick: (e) => { e.stopPropagation(); actions.resetSection(sec.id); } }),
      );
    }
    const head = h('div', { class: 'section-head', role: 'button', tabindex: 0 },
      h('span', { class: 'section-caret', html: ICONS.chevron }),
      h('span', { class: 'section-title' }, sec.title),
      h('span', { class: 'section-badge' }),
      headBtns);
    const section = h('section', { class: 'section', 'data-id': sec.id }, head, body);
    const badge = head.querySelector('.section-badge');
    section.classList.toggle('collapsed', folds[sec.id] ?? !OPEN_BY_DEFAULT.has(sec.id));
    head.addEventListener('click', () => {
      if (search.active()) return; // every section with results stays open while searching
      folds[sec.id] = section.classList.toggle('collapsed');
      try { localStorage.setItem(FOLDS_KEY, JSON.stringify(folds)); } catch {}
    });
    head.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); head.click(); } });

    // Makes a row findable. Controls match on their label, key, tags and
    // options; other rows on their text plus `words`.
    const track = (el, p, words = '') => items.push(p
      ? { sec, el, p, core: () => paramWords(p, store.state), context: [sec.title, p.group, p.hint].join(' ').toLowerCase() }
      : { sec, el, core: () => `${words} ${el.textContent}`.toLowerCase(), context: sec.title.toLowerCase() });

    if (sec.id === 'doc') {
      syncers.push(docSection(body, store, track));
    } else {
      if (sec.id === 'color') {
        const g = gradientEditor(store);
        body.append(g.el);
        track(g.el, null, 'gradient palette colors stops swatches');
        syncers.push(g.sync);
      }
      let group = null;
      for (const p of PARAMS.filter((p) => p.key.startsWith(sec.id + '.'))) {
        if (p.group && p.group !== group) {
          group = p.group;
          const sub = h('div', { class: 'subhead' }, p.group);
          const members = PARAMS.filter((q) => q.key.startsWith(sec.id + '.') && q.group === p.group);
          body.append(sub);
          groups.push({ sec, name: p.group, el: sub });
          syncers.push(() => { sub.hidden = !members.some((q) => !q.show || q.show(store.state)); });
        }
        const c = createControl(p, store);
        body.append(c.el);
        track(c.el, p);
        syncers.push(c.sync);
        if (p.key === 'source.type') syncers.push(sourceExtras(body, store, actions, track));
      }
      if (sec.id === 'export') syncers.push(exportActions(body, store, actions, track));
      if (sec.id === 'anim') {
        const hint = h('p', { class: 'hint' }, 'With “Seamless loop” on, the last frame flows back into the first — record one loop for a perfect video wallpaper.');
        body.append(hint);
        track(hint);
      }
    }

    // Small summary next to the title (e.g. current glass type).
    syncers.push(() => {
      let t = '';
      if (sec.id === 'source') t = optLabel('source.type', store);
      else if (sec.id === 'glass') {
        const g = store.state.glass;
        t = [g.type, g.backType].filter((x) => x !== 'none').map((x) => PARAM_MAP['glass.type'].options.find((o) => o.value === x).label).join(' + ');
      } else if (sec.id === 'light') t = optLabel('light.env', store);
      else if (sec.id === 'screen') t = store.state.screen.type === 'none' ? '' : optLabel('screen.type', store);
      else if (sec.id === 'doc') t = `${store.state.doc.width} × ${store.state.doc.height}`;
      badge.textContent = t;
    });

    root.append(section);
    sections.push({ sec, el: section });
  }

  // ── search results ──
  // Controls that match but are hidden by the current setup (e.g. "Band width"
  // while the pattern is Silk) are listed last, with the change that shows them.
  const unavailableBox = h('div', { class: 'search-unavailable', hidden: true });
  const empty = h('p', { class: 'search-empty', hidden: true });
  root.append(unavailableBox, empty);
  let unavailableSig = '';

  function filter() {
    const words = search.words();
    const on = words.length > 0;
    root.classList.toggle('searching', on);
    const shown = [];
    const unavailable = [];
    for (const it of items) {
      const core = on ? it.core() : '';
      it.match = !on || words.every((w) => core.includes(w) || it.context.includes(w));
      it.el.classList.toggle('miss', !it.match);
      if (!on) continue;
      if (it.match && !it.el.hidden) shown.push(it);
      else if (it.p && it.el.hidden && words.every((w) => core.includes(w))) unavailable.push(it);
    }
    for (const g of groups) g.el.classList.toggle('miss', on && !shown.some((it) => it.sec === g.sec && it.p?.group === g.name));
    for (const s of sections) s.el.classList.toggle('miss', on && !shown.some((it) => it.sec === s.sec));
    listUnavailable(unavailable.slice(0, 24));
    empty.hidden = !on || shown.length > 0 || unavailable.length > 0;
    if (!empty.hidden) empty.textContent = `No settings match “${search.text()}”.`;
  }

  // One row per change, naming every matching control it would show.
  function listUnavailable(list) {
    const rows = [];
    for (const it of list) {
      const fix = enabler(it.p, store.state);
      const id = fix ? `${fix.q.key}=${fix.v}` : it.p.key;
      const row = rows.find((r) => r.id === id);
      if (row) row.its.push(it);
      else if (rows.length < 6) rows.push({ id, fix, its: [it] });
    }
    for (const r of rows) {
      r.names = r.its.map((it) => labelText(it.p, store.state)).join(', ');
      r.secs = [...new Set(r.its.map((it) => it.sec.title))].join(', ');
    }
    const sig = rows.map((r) => `${r.id}:${r.names}`).join('|');
    if (sig === unavailableSig) return;
    unavailableSig = sig;
    unavailableBox.hidden = !rows.length;
    unavailableBox.replaceChildren(
      h('div', { class: 'subhead' }, 'Hidden by current settings'),
      ...rows.map((r) => {
        const name = [h('span', { class: 'un-name' }, r.names), h('span', { class: 'un-sec' }, r.secs)];
        if (!r.fix) return h('div', { class: 'un-row' }, ...name, h('span', { class: 'un-fix muted' }, 'Needs other settings'));
        const setting = labelText(r.fix.q, store.state);
        const value = fixValue(r.fix);
        return h('button', { class: 'un-row', title: `Set ${setting} to ${value} to show ${r.names}`, onclick: () => reveal(r.its, r.fix) },
          ...name, h('span', { class: 'un-fix' }, `${setting}: ${value}`));
      }));
  }

  function reveal(its, { q, v }) {
    store.set(q.key, v);
    store.commit();
    sync();
    its[0].el.scrollIntoView({ block: 'nearest' });
    for (const { el } of its) {
      el.classList.remove('flash');
      void el.offsetWidth; // restart the animation
      el.classList.add('flash');
    }
  }

  function focusFirstResult() {
    const it = items.find((x) => x.match && !x.el.hidden);
    if (!it) return;
    ['input.num', 'select', 'button', 'input'].map((s) => it.el.querySelector(s)).find(Boolean)?.focus();
  }

  const sync = () => {
    for (const s of syncers) s();
    filter();
  };
  sync();
  return {
    sync,
    focusSearch() { search.input.focus(); search.input.select(); },
    clearSearch() { if (search.active()) search.clear(); },
  };
}

function searchBox({ onChange, onEnter }) {
  const input = h('input', { type: 'search', class: 'search-input', placeholder: 'Search settings', 'aria-label': 'Search settings', spellcheck: 'false', autocomplete: 'off' });
  const clear = h('button', { class: 'icon-btn sm search-clear', title: 'Clear search (Esc)', 'aria-label': 'Clear search', html: ICONS.close });
  const el = h('div', { class: 'panel-search', role: 'search' },
    h('span', { class: 'search-icon', html: ICONS.search }),
    input,
    h('kbd', { class: 'search-key', title: 'Press / to search' }, '/'),
    clear);
  let words = [];
  const update = () => {
    words = input.value.toLowerCase().split(/\s+/).filter(Boolean);
    el.classList.toggle('has-text', input.value !== '');
    onChange();
  };
  const reset = () => { input.value = ''; update(); };
  input.addEventListener('input', update);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') onEnter();
    else if (e.key === 'Escape') { if (input.value) reset(); else input.blur(); }
  });
  clear.addEventListener('click', () => { reset(); input.focus(); });
  return { el, input, clear: reset, words: () => words, text: () => input.value.trim(), active: () => words.length > 0 };
}

const paramWords = (p, s) => [
  labelText(p, s),
  p.key.split('.')[1].replace(/([a-z])([A-Z])/g, '$1 $2'),
  p.tags,
  p.options?.map((o) => o.label).join(' '),
].join(' ').toLowerCase();

// Finds a single setting change that would show a hidden control, trying the
// sibling settings first. Values are tried on the live state and restored.
function enabler(p, state) {
  const own = p.key.split('.')[0] + '.';
  const order = [...PARAMS.filter((q) => q.key.startsWith(own)), ...PARAMS.filter((q) => !q.key.startsWith(own))];
  for (const q of order) {
    if (q === p || (q.show && !q.show(state))) continue;
    const [a, b] = q.key.split('.');
    const cur = state[a][b];
    for (const v of candidates(q)) {
      if (v === cur) continue;
      state[a][b] = v;
      const ok = p.show(state);
      state[a][b] = cur;
      if (ok) return { q, v };
    }
  }
  return null;
}

function candidates(q) {
  if (q.key.startsWith('doc.')) return [];
  if (q.type === 'chips' || q.type === 'select') return q.options.map((o) => o.value);
  if (q.type === 'toggle') return [true, false];
  if (q.type === 'range' || q.type === 'int') {
    const st = q.type === 'int' ? 1 : q.step || 0.01;
    const mid = Array.isArray(q.rnd) ? (q.rnd[0] + q.rnd[1]) / 2 : (q.min + q.max) / 2;
    return [q.def, +(Math.round(mid / st) * st).toFixed(6)];
  }
  return [];
}

function fixValue({ q, v }) {
  if (q.options) return q.options.find((o) => o.value === v).label;
  if (q.type === 'toggle') return v ? 'On' : 'Off';
  return `${v}${q.unit || ''}`;
}

function optLabel(key, store) {
  const p = PARAM_MAP[key];
  return p.options.find((o) => o.value === store.get(key))?.label ?? '';
}

// ── Canvas size ─────────────────────────────────────────────────────────────
function docSection(body, store, track) {
  const sizeCtl = createControl(PARAM_MAP['doc.size'], store);
  const w = h('input', { type: 'number', class: 'num num-wide', min: 64, max: 8192 });
  const hh = h('input', { type: 'number', class: 'num num-wide', min: 64, max: 8192 });
  const swap = h('button', { class: 'icon-btn', title: 'Swap orientation', html: ICONS.swap });
  const row = h('div', { class: 'ctl ctl-dims' },
    h('label', { class: 'ctl-label' }, 'Pixels'),
    h('div', { class: 'ctl-body dims' },
      h('div', { class: 'num-wrap num-wrap-wide' }, h('span', { class: 'unit pre' }, 'W'), w),
      h('div', { class: 'num-wrap num-wrap-wide' }, h('span', { class: 'unit pre' }, 'H'), hh),
      swap));
  body.append(sizeCtl.el, row);
  track(sizeCtl.el, PARAM_MAP['doc.size']);
  track(row, null, 'width height dimensions resolution custom');

  const matchPreset = (W, H) => DOC_SIZES.find((s) => s.w === W && s.h === H)?.value ?? 'custom';
  const setDims = (W, H) => {
    W = Math.min(8192, Math.max(64, Math.round(W) || 64));
    H = Math.min(8192, Math.max(64, Math.round(H) || 64));
    store.state.doc.width = W;
    store.state.doc.height = H;
    store.state.doc.size = matchPreset(W, H);
    store.emit('doc');
  };
  w.addEventListener('change', () => setDims(+w.value, store.state.doc.height));
  hh.addEventListener('change', () => setDims(store.state.doc.width, +hh.value));
  for (const i of [w, hh]) i.addEventListener('keydown', (e) => { if (e.key === 'Enter') i.blur(); });
  swap.addEventListener('click', () => setDims(store.state.doc.height, store.state.doc.width));

  return () => {
    sizeCtl.sync();
    if (document.activeElement !== w) w.value = store.state.doc.width;
    if (document.activeElement !== hh) hh.value = store.state.doc.height;
  };
}

// ── Flow extras (image upload / fluid reset) ────────────────────────────────
function sourceExtras(body, store, actions, track) {
  const upload = h('button', { class: 'btn', html: `${ICONS.upload}<span>Choose image…</span>`, onclick: () => actions.uploadImage() });
  const imgBox = h('div', { class: 'extra' }, upload, h('p', { class: 'hint' }, 'Or drop an image anywhere on the canvas. It stays on your device.'));
  const clear = h('button', { class: 'btn', html: `${ICONS.reset}<span>Clear fluid</span>`, onclick: () => actions.resetFluid() });
  const fluidBox = h('div', { class: 'extra' }, clear, h('p', { class: 'hint' }, 'Drag on the canvas to push ink around.'));
  const panHint = h('p', { class: 'hint' }, 'Drag the canvas to pan · scroll to zoom · double-click to recenter.');
  body.append(imgBox, fluidBox, panHint);
  track(imgBox, null, 'image upload photo file');
  track(fluidBox, null, 'fluid ink paint reset');
  track(panHint, null, 'position move');
  return () => {
    const t = store.state.source.type;
    imgBox.hidden = t !== 'image';
    fluidBox.hidden = t !== 'fluid';
    panHint.hidden = t === 'fluid';
  };
}

// ── Export buttons ──────────────────────────────────────────────────────────
function exportActions(body, store, actions, track) {
  const info = h('div', { class: 'export-info' });
  const dl = h('button', { class: 'btn primary wide', html: `${ICONS.download}<span>Download image</span>`, onclick: () => actions.exportImage() });
  const copy = h('button', { class: 'btn', title: 'Copy PNG to clipboard (paste into Figma, etc.)', html: `${ICONS.copy}<span>Copy</span>`, onclick: () => actions.copyImage() });
  const burst = h('button', { class: 'btn', title: 'Capture several frames across the animation as a .zip', html: `${ICONS.burst}<span>Burst</span>`, onclick: () => actions.burst() });
  const rec = h('button', { class: 'btn', title: 'Record a video of the animation', html: `${ICONS.record}<span>Video</span>`, onclick: () => actions.toggleRecord() });
  const row = h('div', { class: 'btn-row' }, copy, burst, rec);
  body.append(info, dl, row);
  track(info, null, 'resolution size');
  track(dl, null, 'save export png');
  track(row, null, 'clipboard frames zip record mp4 webm');
  return () => {
    const s = store.state;
    const k = parseFloat(s.export.scale);
    const W = Math.round(s.doc.width * k), H = Math.round(s.doc.height * k);
    const mp = (W * H) / 1e6;
    info.innerHTML = `<span>Output</span><b>${W} × ${H}</b><span class="muted">${mp.toFixed(1)} MP</span>`;
    rec.classList.toggle('recording', !!actions.isRecording());
    rec.querySelector('span').textContent = actions.isRecording() ? 'Stop' : 'Video';
  };
}

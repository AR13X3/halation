// Builds the right-hand control panel from the schema.

import { PARAMS, SECTIONS, PARAM_MAP, DOC_SIZES } from '../schema.js';
import { createControl, h } from './controls.js';
import { gradientEditor } from './gradient.js';
import { ICONS } from './icons.js';

function loadCollapsed() {
  try { return JSON.parse(localStorage.getItem('halation.collapsed') || '{}'); } catch { return {}; }
}

export function buildPanel(root, store, actions) {
  const syncers = [];
  const collapsed = { export: false, ...loadCollapsed() };

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
    const setCollapsed = (v) => {
      section.classList.toggle('collapsed', v);
      collapsed[sec.id] = v;
      try { localStorage.setItem('halation.collapsed', JSON.stringify(collapsed)); } catch {}
    };
    setCollapsed(!!collapsed[sec.id]);
    head.addEventListener('click', () => setCollapsed(!section.classList.contains('collapsed')));
    head.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); head.click(); } });

    if (sec.id === 'doc') {
      syncers.push(docSection(body, store));
    } else {
      if (sec.id === 'color') {
        const g = gradientEditor(store);
        body.append(g.el);
        syncers.push(g.sync);
      }
      let group = null;
      for (const p of PARAMS.filter((p) => p.key.startsWith(sec.id + '.'))) {
        if (p.group && p.group !== group) {
          group = p.group;
          const sub = h('div', { class: 'subhead' }, p.group);
          const members = PARAMS.filter((q) => q.key.startsWith(sec.id + '.') && q.group === p.group);
          body.append(sub);
          syncers.push(() => { sub.hidden = !members.some((q) => !q.show || q.show(store.state)); });
        }
        const c = createControl(p, store);
        body.append(c.el);
        syncers.push(c.sync);
        if (p.key === 'source.type') syncers.push(sourceExtras(body, store, actions));
      }
      if (sec.id === 'export') syncers.push(exportActions(body, store, actions));
      if (sec.id === 'anim') body.append(h('p', { class: 'hint' }, 'With “Seamless loop” on, the last frame flows back into the first — record one loop for a perfect video wallpaper.'));
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
  }

  const sync = () => { for (const s of syncers) s(); };
  sync();
  return { sync };
}

function optLabel(key, store) {
  const p = PARAM_MAP[key];
  return p.options.find((o) => o.value === store.get(key))?.label ?? '';
}

// ── Canvas size ─────────────────────────────────────────────────────────────
function docSection(body, store) {
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
function sourceExtras(body, store, actions) {
  const upload = h('button', { class: 'btn', html: `${ICONS.upload}<span>Choose image…</span>`, onclick: () => actions.uploadImage() });
  const imgBox = h('div', { class: 'extra' }, upload, h('p', { class: 'hint' }, 'Or drop an image anywhere on the canvas. It stays on your device.'));
  const clear = h('button', { class: 'btn', html: `${ICONS.reset}<span>Clear fluid</span>`, onclick: () => actions.resetFluid() });
  const fluidBox = h('div', { class: 'extra' }, clear, h('p', { class: 'hint' }, 'Drag on the canvas to push ink around.'));
  const panHint = h('p', { class: 'hint' }, 'Drag the canvas to pan · scroll to zoom · double-click to recenter.');
  body.append(imgBox, fluidBox, panHint);
  return () => {
    const t = store.state.source.type;
    imgBox.hidden = t !== 'image';
    fluidBox.hidden = t !== 'fluid';
    panHint.hidden = t === 'fluid';
  };
}

// ── Export buttons ──────────────────────────────────────────────────────────
function exportActions(body, store, actions) {
  const info = h('div', { class: 'export-info' });
  const dl = h('button', { class: 'btn primary wide', html: `${ICONS.download}<span>Download image</span>`, onclick: () => actions.exportImage() });
  const copy = h('button', { class: 'btn', title: 'Copy PNG to clipboard (paste into Figma, etc.)', html: `${ICONS.copy}<span>Copy</span>`, onclick: () => actions.copyImage() });
  const burst = h('button', { class: 'btn', title: 'Capture several frames across the animation as a .zip', html: `${ICONS.burst}<span>Burst</span>`, onclick: () => actions.burst() });
  const rec = h('button', { class: 'btn', title: 'Record a video of the animation', html: `${ICONS.record}<span>Video</span>`, onclick: () => actions.toggleRecord() });
  const row = h('div', { class: 'btn-row' }, copy, burst, rec);
  body.append(info, dl, row);
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

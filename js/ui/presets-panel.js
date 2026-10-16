// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 AR13X3 — Halation (https://github.com/AR13X3/halation)
// Looks: the filmstrip in the dock, and the browser it opens with every
// built-in look plus the user's own saved looks (My looks).

import { h, toast } from './controls.js';
import { ICONS } from './icons.js';
import { PRESETS } from '../presets.js';

const KEY = 'halation.userPresets';

function loadUser() {
  try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
}
function saveUser(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch {
    toast('Could not save — browser storage is full or blocked.', { type: 'error' });
    return false;
  }
}

export function buildPresetsPanel({ strip, sheet, opener }, store, actions) {
  let active = null;
  let view = 'builtin';
  const thumbs = new Map(); // look id → thumbnail URL

  // ── filmstrip ──
  const userFilms = h('div', { style: { display: 'contents' } });
  const filmSep = h('span', { class: 'film-sep', hidden: true });
  strip.append(userFilms, filmSep);
  // Vertical wheels scroll the strip sideways.
  strip.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
    strip.scrollLeft += e.deltaY;
    e.preventDefault();
  }, { passive: false });

  // ── browser sheet ──
  const tabBuiltin = h('button', { role: 'tab', 'aria-selected': 'true', onclick: () => show('builtin') }, 'Built-in', h('span', { class: 'count' }, String(PRESETS.length)));
  const mineCount = h('span', { class: 'count' });
  const tabMine = h('button', { role: 'tab', 'aria-selected': 'false', onclick: () => show('mine') }, 'My looks', mineCount);
  const close = h('button', { class: 'icon-btn', title: 'Close (Esc)', 'aria-label': 'Close', html: ICONS.close, onclick: () => setOpen(false) });
  const grid = h('div', { class: 'look-grid' });
  const userGrid = h('div', { class: 'look-grid' });
  const empty = h('p', { class: 'mine-empty' }, 'Save the current look to keep it here. Saved looks live in this browser — export them as a file to share or back them up.');

  const nameInput = h('input', { type: 'text', class: 'text-input', placeholder: 'Name this look…', maxlength: 40, 'aria-label': 'Look name' });
  const saveBtn = h('button', { class: 'btn primary', html: `${ICONS.save}<span>Save current look</span>` });
  const saveRow = h('form', { class: 'save-row' }, nameInput, saveBtn);
  saveRow.addEventListener('submit', (e) => { e.preventDefault(); saveCurrent(); });

  const importInput = h('input', { type: 'file', accept: '.json,application/json', hidden: true });
  const importBtn = h('button', { class: 'text-btn', html: `${ICONS.upload}<span>Import</span>`, onclick: () => importInput.click() });
  const exportBtn = h('button', { class: 'text-btn', html: `${ICONS.download}<span>Export</span>`, onclick: () => exportAll() });
  const mine = h('div', { hidden: true }, saveRow, userGrid, empty, h('div', { class: 'mine-foot' }, importBtn, exportBtn), importInput);
  const body = h('div', { class: 'sheet-body' }, grid, mine);
  sheet.append(
    h('div', { class: 'sheet-head' }, h('div', { class: 'seg', role: 'tablist' }, tabBuiltin, tabMine), h('span', { class: 'spacer' }), close),
    body,
  );

  function show(v) {
    view = v;
    tabBuiltin.setAttribute('aria-selected', String(v === 'builtin'));
    tabMine.setAttribute('aria-selected', String(v === 'mine'));
    grid.hidden = v !== 'builtin';
    mine.hidden = v !== 'mine';
    body.scrollTop = 0;
  }

  function apply(item) {
    active = item.id;
    actions.applyLook(item.look, item.name);
    highlight({ reveal: true });
  }

  function film(item) {
    const el = h('button', { class: 'film', title: item.name, 'aria-label': item.name, 'data-id': item.id, onclick: () => apply(item) });
    if (item.thumb) el.style.backgroundImage = `url(${item.thumb})`;
    return el;
  }

  function card(item, { removable } = {}) {
    const img = h('span', { class: 'thumb' });
    if (item.thumb) img.style.backgroundImage = `url(${item.thumb})`;
    const del = removable ? h('button', { class: 'card-del', title: 'Delete', 'aria-label': `Delete ${item.name}`, html: ICONS.close }) : null;
    const el = h('div', { class: 'look-card', 'data-id': item.id },
      h('button', { class: 'look-pick', onclick: () => apply(item) }, img, h('span', { class: 'name' }, item.name)),
      del);
    del?.addEventListener('click', (e) => {
      e.stopPropagation();
      saveUser(loadUser().filter((u) => u.id !== item.id));
      renderUser();
    });
    return { el, img };
  }

  const builtin = PRESETS.map((p) => ({ ...p, film: film(p), card: card(p) }));
  strip.append(...builtin.map((b) => b.film));
  grid.append(...builtin.map((b) => b.card.el));

  // Render thumbnails progressively so startup stays snappy, starting with
  // the ones around the current look (where the strip is scrolled to). Looks
  // whose shaders are still compiling wait their turn.
  const pending = builtin.map((b, k) => ({ b, k }));
  const next = () => {
    if (!pending.length) return;
    const at = Math.max(0, builtin.findIndex((b) => b.id === active));
    pending.sort((x, y) => Math.abs(x.k - at) - Math.abs(y.k - at));
    const k = pending.findIndex((x) => actions.thumbnailReady(x.b.look));
    if (k < 0) { setTimeout(next, 250); return; }
    const { b } = pending.splice(k, 1)[0];
    const url = actions.thumbnail(b.look);
    if (url) {
      thumbs.set(b.id, url);
      b.film.style.backgroundImage = `url(${url})`;
      b.card.img.style.backgroundImage = `url(${url})`;
    }
    setTimeout(next, 16);
  };
  setTimeout(next, 120);

  function renderUser() {
    const list = loadUser();
    userGrid.replaceChildren(...list.map((u) => card(u, { removable: true }).el));
    userFilms.replaceChildren(...list.map((u) => film(u)));
    filmSep.hidden = !list.length;
    empty.hidden = list.length > 0;
    mineCount.textContent = list.length ? String(list.length) : '';
    highlight();
  }

  function saveCurrent() {
    const name = nameInput.value.trim() || `Look ${loadUser().length + 1}`;
    const look = store.look();
    const item = { id: 'u' + Date.now().toString(36), name, look, thumb: actions.thumbnail(look) };
    if (saveUser([item, ...loadUser()])) {
      nameInput.value = '';
      active = item.id;
      actions.renameLook?.(name);
      renderUser();
      toast(`Saved “${name}”`);
    }
  }

  function exportAll() {
    const list = loadUser().map(({ name, look }) => ({ name, look }));
    const payload = list.length ? list : [{ name: 'Current look', look: store.look() }];
    const blob = new Blob([JSON.stringify({ app: 'halation', version: 1, looks: payload }, null, 2)], { type: 'application/json' });
    actions.download(blob, 'halation-looks.json');
  }

  importInput.addEventListener('change', async () => {
    const file = importInput.files[0];
    importInput.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const looks = Array.isArray(data) ? data : data.looks || (data.look ? [data] : []);
      if (!looks.length) throw new Error('No looks in file');
      const items = looks.map((l, k) => ({
        id: 'u' + Date.now().toString(36) + k,
        name: String(l.name || `Imported ${k + 1}`).slice(0, 40),
        look: l.look || l,
        thumb: actions.thumbnail(l.look || l),
      }));
      saveUser([...items, ...loadUser()]);
      renderUser();
      toast(`Imported ${items.length} look${items.length > 1 ? 's' : ''}`);
    } catch (err) {
      toast('That file doesn’t look like a Halation looks file.', { type: 'error' });
    }
  });

  function highlight({ reveal = false } = {}) {
    for (const el of [...strip.querySelectorAll('.film'), ...sheet.querySelectorAll('.look-card')]) {
      const on = !!active && el.dataset.id === active;
      el.classList.toggle('active', on);
      if (on && reveal && el.classList.contains('film')) {
        const r = el.getBoundingClientRect(), s = strip.getBoundingClientRect();
        if (r.left < s.left || r.right > s.right) strip.scrollLeft += r.left - s.left - (s.width - r.width) / 2;
      }
    }
  }

  // ── open / close ──
  const isOpen = () => !sheet.hidden;
  function setOpen(on) {
    if (on === isOpen()) return;
    sheet.hidden = !on;
    for (const o of opener) o.setAttribute('aria-expanded', String(on));
    if (on) {
      show(view);
      sheet.querySelector('.look-card.active')?.scrollIntoView({ block: 'nearest' });
    }
  }
  // Clicks outside the browser close it (its openers toggle it themselves).
  document.addEventListener('pointerdown', (e) => {
    if (isOpen() && !sheet.contains(e.target) && !opener.some((o) => o.contains(e.target))) setOpen(false);
  });

  renderUser();
  return {
    clearActive() { active = null; highlight(); },
    setActive(id) { active = id; highlight({ reveal: true }); },
    open: () => setOpen(true),
    close: () => setOpen(false),
    toggle: () => setOpen(!isOpen()),
    isOpen,
  };
}

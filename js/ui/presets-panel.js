// Left sidebar: built-in looks + the user's own saved looks.

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

export function buildPresetsPanel(root, store, actions) {
  let active = null;
  const grid = h('div', { class: 'preset-grid' });
  const userGrid = h('div', { class: 'preset-grid' });
  const empty = h('p', { class: 'hint' }, 'Save the current look to keep it here. Saved looks live in this browser — export them as a file to share.');

  const nameInput = h('input', { type: 'text', class: 'text-input', placeholder: 'Name this look…', maxlength: 40 });
  const saveBtn = h('button', { class: 'icon-btn', title: 'Save current look', html: ICONS.save });
  const saveRow = h('form', { class: 'save-row' }, nameInput, saveBtn);
  saveRow.addEventListener('submit', (e) => { e.preventDefault(); saveCurrent(); });

  const importInput = h('input', { type: 'file', accept: '.json,application/json', hidden: true });
  const importBtn = h('button', { class: 'text-btn', html: `${ICONS.upload}<span>Import</span>`, onclick: () => importInput.click() });
  const exportBtn = h('button', { class: 'text-btn', html: `${ICONS.download}<span>Export</span>`, onclick: () => exportAll() });

  root.append(
    h('div', { class: 'side-head' }, h('span', {}, 'Looks'), h('span', { class: 'muted' }, String(PRESETS.length))),
    grid,
    h('div', { class: 'side-head' }, h('span', {}, 'My looks')),
    saveRow,
    userGrid,
    empty,
    h('div', { class: 'grad-actions' }, importBtn, exportBtn),
    importInput,
  );

  function card(item, { removable } = {}) {
    const img = h('div', { class: 'thumb' });
    if (item.thumb) img.style.backgroundImage = `url(${item.thumb})`;
    const del = removable ? h('button', { class: 'card-del', title: 'Delete', html: ICONS.close }) : null;
    const el = h('button', { class: 'preset-card', title: item.name }, img, h('span', { class: 'preset-name' }, item.name), del);
    el.addEventListener('click', (e) => {
      if (del && del.contains(e.target)) return;
      active = item.id;
      actions.applyLook(item.look, item.name);
      highlight();
    });
    del?.addEventListener('click', (e) => {
      e.stopPropagation();
      const list = loadUser().filter((u) => u.id !== item.id);
      saveUser(list);
      renderUser();
    });
    el.dataset.id = item.id;
    return { el, img };
  }

  const builtin = PRESETS.map((p) => ({ ...p, card: card(p) }));
  grid.append(...builtin.map((b) => b.card.el));

  // Render thumbnails progressively so startup stays snappy.
  let i = 0;
  const next = () => {
    if (i >= builtin.length) return;
    const b = builtin[i++];
    const url = actions.thumbnail(b.look);
    if (url) b.card.img.style.backgroundImage = `url(${url})`;
    setTimeout(next, 16);
  };
  setTimeout(next, 120);

  function renderUser() {
    const list = loadUser();
    userGrid.replaceChildren(...list.map((u) => card(u, { removable: true }).el));
    empty.hidden = list.length > 0;
    highlight();
  }

  function saveCurrent() {
    const name = nameInput.value.trim() || `Look ${loadUser().length + 1}`;
    const look = store.look();
    const item = { id: 'u' + Date.now().toString(36), name, look, thumb: actions.thumbnail(look) };
    if (saveUser([item, ...loadUser()])) {
      nameInput.value = '';
      active = item.id;
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

  function highlight() {
    for (const el of root.querySelectorAll('.preset-card')) el.classList.toggle('active', el.dataset.id === active);
  }

  renderUser();
  return {
    clearActive() { active = null; highlight(); },
    setActive(id) { active = id; highlight(); },
  };
}

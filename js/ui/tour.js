// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 AR13X3 — Halation (https://github.com/AR13X3/halation)
// Guided tour of the basics, started from the Tutorial button. Each step
// spotlights part of the interface; steps with a "Try it" prompt move on by
// themselves once the user has done it. Next, Back and End tutorial are always
// available, and Esc ends the tour. The dimming never blocks the app, so
// everything stays usable while the tour is open.

import { h, toast } from './controls.js';
import { ICONS } from './icons.js';
import { track } from '../analytics.js';

const $ = (s) => document.querySelector(s);
const section = (id) => $(`#panel .section[data-id="${id}"]`);
const head = (id) => section(id)?.querySelector('.section-head');
const tab = (id) => $(`#panel .tab[data-id="${id}"]`);
const SETTLE = 1200; // ms after the last interaction before a "Try it" step moves on

const typing = (t) => t instanceof HTMLInputElement && !['range', 'checkbox', 'color'].includes(t.type)
  || t instanceof HTMLSelectElement || t instanceof HTMLTextAreaElement;

// Step waits: (ctx, done) => cleanup. `done` may fire repeatedly (e.g. while
// dragging); the step moves on once it has been quiet for SETTLE ms.
const onStore = (test) => ({ store }, done) => store.on((path) => { if (test(path)) done(); });
const onEvents = (list) => (ctx, done) => {
  const offs = list.map(([get, type, test]) => {
    const el = get();
    const fn = (e) => { if (!test || test(e)) done(); };
    el?.addEventListener(type, fn, { passive: true });
    return () => el?.removeEventListener(type, fn);
  });
  return () => offs.forEach((off) => off());
};
const openSection = (id) => (ctx) => { ctx.clearSearch(); ctx.showSection(id); };

const STEPS = [
  {
    title: 'Welcome to Halation',
    body: 'Halation turns color into backgrounds: a flowing field or a still gradient, seen through glass, materials and screen textures, and exported as images or seamless video loops. This tour covers the basics in about a minute.',
    next: 'Start',
  },
  {
    target: () => [$('#presets'), $('#btn-looks')],
    side: 'top',
    prep: (ctx) => ctx.showDock(),
    title: 'Start from a look',
    body: 'Each look is a complete recipe you can change. Scroll the strip for more, or open All looks to see every look at once and to keep your own under My looks.',
    try: 'Click any look to load it.',
    wait: onStore((p) => p === '*'),
  },
  {
    target: () => $('#frame'),
    side: 'right',
    prep: (ctx) => ctx.showDock(),
    title: 'Frame it on the canvas',
    body: 'The preview has the exact proportions of your export.',
    try: 'Drag to pan and scroll to zoom. Double-click recenters.',
    wait: onEvents([[() => $('#canvas'), 'pointerup'], [() => $('#canvas'), 'wheel']]),
  },
  {
    target: () => section('doc'),
    side: 'left',
    block: 'start',
    prep: openSection('doc'),
    title: 'Pick a size',
    body: 'Choose a phone, desktop or print preset, or type exact pixels. Effects scale with the canvas, so larger exports are simply sharper. A phone and a desktop frame the same look differently, so check the composition at the size you will use.',
  },
  {
    target: () => [head('source'), section('source')?.querySelector('.ctl-chips')],
    reveal: () => section('source'),
    side: 'left',
    block: 'start',
    prep: openSection('source'),
    title: 'Choose a flow',
    body: 'The flow is the moving pattern underneath everything: silk, bands, mesh, ribbons, threads, a fluid you paint with the mouse, or your own image. None gives a still color or gradient instead, from smooth fades to rippled retro stripes and sunbursts.',
    try: 'Pick a different pattern.',
    wait: onStore((p) => p === 'source.type'),
  },
  {
    target: () => section('color'),
    side: 'left',
    block: 'start',
    prep: openSection('color'),
    title: 'Color it',
    body: 'The gradient maps the flow to colors. Drag a stop to move it, click the bar to add one, or open Library for ready-made palettes.',
    try: 'Change a color or pick a palette.',
    wait: onStore((p) => p.startsWith('color')),
  },
  {
    target: () => ['objects', 'surface', 'glass', 'light', 'screen', 'finish'].map(tab),
    side: 'left',
    prep: openSection('glass'),
    title: 'Layer the effects',
    body: 'Objects float frosted glass or solid shapes in front of the flow (drag them on the canvas), Surface adds materials such as chrome and liquid, Glass refracts everything through ribbed, tiled or frosted panes, Screen adds print and display textures, and Finish grades the result and adds grain, speckle and a vignette you can aim at your focal point. Each has a tab here, with dice (randomize) and reset buttons next to its title.',
  },
  {
    target: () => $('#panel .panel-search'),
    side: 'left',
    prep: (ctx) => ctx.showSection(),
    title: 'Find any setting',
    body: 'Search by name or by effect: “blur” finds Soften and Frost. Press / to jump here from anywhere.',
    try: 'Type a word, such as “blur”.',
    wait: onEvents([[() => $('#panel .search-input'), 'input', (e) => e.target.value.trim() !== '']]),
    leave: (ctx) => ctx.clearSearch(),
  },
  {
    target: () => $('#transport'),
    side: 'top',
    prep: (ctx) => ctx.showDock(),
    title: 'Play, pause and loop',
    body: 'Pause when the motion looks right: a paused preview sharpens to full quality in a moment. With the loop on, the animation repeats seamlessly, ready for video.',
    try: 'Press Space or the play button.',
    wait: onEvents([[() => $('#btn-play'), 'click'], [() => window, 'keydown', (e) => e.key === ' ' && !typing(e.target)]]),
  },
  {
    target: () => $('#btn-surprise'),
    side: 'bottom',
    title: 'Surprise me',
    body: 'Out of ideas? Surprise me picks a fresh art direction and keeps the best of several tries. Undo brings back your previous look.',
    try: 'Click Surprise me or press R.',
    wait: onStore((p) => p === '*'),
  },
  {
    target: () => $('#btn-export'),
    side: 'bottom',
    title: 'Export',
    body: 'Download a high-resolution PNG, JPEG or WebP. The Export section adds copy to clipboard, frame bursts and video, and Share copies a link that recreates this exact look.',
  },
  {
    title: 'You’re ready',
    body: (guideUrl) => {
      const link = h('a', { href: guideUrl, target: '_blank', rel: 'noopener' }, 'user guide');
      return ['Save looks you like under My looks, press ? for keyboard shortcuts, and see the ', link, ' for every setting in depth. You can replay this tour from the Help menu at any time.'];
    },
    next: 'Finish',
  },
];

export function createTour({ store, showUI, clearSearch, showSection, showDock, guideUrl }) {
  const ctx = { store, clearSearch, showSection, showDock };
  let ui = null;
  let index = -1;
  let stopWait = null;
  let settleTimer = 0;
  let lastFocus = null;
  const resize = new ResizeObserver(() => place());

  function build() {
    const count = h('span', { class: 'tour-count' });
    const close = h('button', { class: 'icon-btn sm', title: 'End tutorial (Esc)', 'aria-label': 'End tutorial', html: ICONS.close, onclick: () => end() });
    const title = h('b', { class: 'tour-title', id: 'tour-title' });
    const body = h('p', { class: 'tour-body', id: 'tour-body' });
    const tryIcon = h('span', { class: 'tour-try-icon' });
    const tryText = h('span');
    const tryEl = h('p', { class: 'tour-try' }, tryIcon, tryText);
    const quit = h('button', { class: 'text-btn', onclick: () => end() }, 'End tutorial');
    const back = h('button', { class: 'btn ghost', onclick: () => go(index - 1, true) }, 'Back');
    const next = h('button', { class: 'btn primary', onclick: () => go(index + 1, true) }, 'Next');
    const card = h('div', { class: 'tour-card', role: 'dialog', 'aria-labelledby': 'tour-title', 'aria-describedby': 'tour-body', tabindex: -1 },
      h('div', { class: 'tour-head' }, count, close),
      title, body, tryEl,
      h('div', { class: 'tour-foot' }, quit, h('span', { class: 'spacer' }), back, next));
    const spot = h('div', { class: 'tour-spot' });
    card.addEventListener('keydown', (e) => {
      if (typing(e.target) || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
      e.preventDefault();
      e.stopPropagation(); // keep the canvas from stepping frames
      go(index + (e.key === 'ArrowRight' ? 1 : -1), true);
    });
    document.body.append(spot, card);
    resize.observe(card);
    return { spot, card, count, title, body, tryEl, tryIcon, tryText, quit, back, next };
  }

  function start() {
    if (ui) { go(0, true); return; }
    lastFocus = document.activeElement;
    track('tutorial/start', 'Tutorial started');
    showUI();
    ui = build();
    window.addEventListener('keydown', onKey, true);
    window.addEventListener('resize', place);
    document.addEventListener('scroll', place, { capture: true, passive: true });
    go(0, true);
  }

  function end(finished = false) {
    if (!ui) return;
    // Where people leave the tour shows which steps need work.
    track(finished ? 'tutorial/finish' : `tutorial/quit-${index + 1}`, finished ? 'Tutorial finished' : `Tutorial ended at step ${index + 1}`);
    leave();
    resize.disconnect();
    window.removeEventListener('keydown', onKey, true);
    window.removeEventListener('resize', place);
    document.removeEventListener('scroll', place, { capture: true });
    ui.spot.remove();
    ui.card.remove();
    ui = null;
    index = -1;
    if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
    if (!finished) toast('Tutorial ended. Replay it any time from the Help menu.');
  }

  function onKey(e) {
    if (e.key === 'Escape' && !typing(e.target) && !$('dialog[open]')) end();
  }

  function leave() {
    stopWait?.();
    stopWait = null;
    clearTimeout(settleTimer);
    STEPS[index]?.leave?.(ctx);
  }

  function go(n, focus = false) {
    if (!ui || n < 0) return;
    if (n >= STEPS.length) { end(true); return; }
    leave();
    index = n;
    const step = STEPS[n];
    step.prep?.(ctx);

    ui.count.textContent = `${n + 1} of ${STEPS.length}`;
    ui.title.textContent = step.title;
    ui.body.replaceChildren(...[typeof step.body === 'function' ? step.body(guideUrl) : step.body].flat());
    ui.tryEl.hidden = !step.try;
    setTried(false);
    ui.back.hidden = n === 0;
    ui.quit.hidden = n === STEPS.length - 1;
    ui.next.textContent = step.next || 'Next';

    // Steps can name a plain element to scroll into view instead of their
    // target. The spotlight animates the move, so the scroll itself is instant.
    (step.reveal?.() || targets(step)[0])?.scrollIntoView({ block: step.block || 'nearest', inline: 'nearest' });
    if (step.wait) stopWait = step.wait(ctx, () => tried(n));
    place();
    setTimeout(place, 300); // after opened sections and thumbnails settle
    if (focus) ui.card.focus({ preventScroll: true });
  }

  // The user did what the step asked: confirm it, then move on once they pause.
  function tried(n) {
    if (index !== n) return;
    setTried(true);
    clearTimeout(settleTimer);
    settleTimer = setTimeout(() => { if (index === n) go(n + 1); }, SETTLE);
  }

  function setTried(done) {
    const step = STEPS[index];
    ui.tryEl.classList.toggle('done', done);
    ui.tryIcon.innerHTML = done ? ICONS.check : ICONS.sparkle;
    ui.tryText.textContent = done ? 'Nice — moving on…' : `Try it: ${step.try || ''}`;
  }

  // Visible elements of a step's target.
  function targets(step) {
    return [step.target?.()].flat().filter((el) => el && el.getClientRects().length);
  }

  // Union of the targets, clipped to their scrolling panel and the viewport.
  function targetRect(els) {
    let r = null;
    for (const el of els) {
      const b = el.getBoundingClientRect();
      if (!b.width || !b.height) continue;
      r = r ? { left: Math.min(r.left, b.left), top: Math.min(r.top, b.top), right: Math.max(r.right, b.right), bottom: Math.max(r.bottom, b.bottom) }
        : { left: b.left, top: b.top, right: b.right, bottom: b.bottom };
    }
    if (!r) return null;
    const clips = [{ left: 0, top: 0, right: document.documentElement.clientWidth, bottom: innerHeight }];
    const side = els[0].closest('.clip');
    if (side) clips.push(side.getBoundingClientRect());
    for (const c of clips) {
      r = { left: Math.max(r.left, c.left), top: Math.max(r.top, c.top), right: Math.min(r.right, c.right), bottom: Math.min(r.bottom, c.bottom) };
    }
    return r.right - r.left > 4 && r.bottom - r.top > 4 ? r : null;
  }

  function place() {
    if (!ui) return;
    const step = STEPS[index];
    const vw = document.documentElement.clientWidth, vh = innerHeight;
    const M = 12, GAP = 14, PAD = 6;
    const cw = ui.card.offsetWidth, ch = ui.card.offsetHeight;
    const r = targetRect(targets(step));
    const box = (el, x, y, w, hh) => Object.assign(el.style, { left: `${x}px`, top: `${y}px`, width: w == null ? '' : `${w}px`, height: hh == null ? '' : `${hh}px` });
    ui.spot.classList.toggle('none', !r);
    if (!r) {
      box(ui.spot, vw / 2, vh / 2, 0, 0);
      box(ui.card, Math.round((vw - cw) / 2), Math.round((vh - ch) / 2));
      return;
    }
    // Padded, but kept on screen so the ring stays visible at the window edges.
    const s = { left: Math.max(2, r.left - PAD), top: Math.max(2, r.top - PAD), right: Math.min(vw - 2, r.right + PAD), bottom: Math.min(vh - 2, r.bottom + PAD) };
    box(ui.spot, s.left, s.top, s.right - s.left, s.bottom - s.top);

    // First side with room for the card, else the roomiest one (clamped on screen).
    const room = { right: vw - s.right - GAP - M - cw, left: s.left - GAP - M - cw, bottom: vh - s.bottom - GAP - M - ch, top: s.top - GAP - M - ch };
    const order = [step.side, 'bottom', 'top', 'right', 'left'].filter(Boolean);
    const sideName = order.find((k) => room[k] >= 0) || order.reduce((a, b) => (room[b] > room[a] ? b : a));
    const cx = (s.left + s.right) / 2, cy = (s.top + s.bottom) / 2;
    let x = cx - cw / 2, y = cy - ch / 2;
    if (sideName === 'right') x = s.right + GAP;
    else if (sideName === 'left') x = s.left - GAP - cw;
    else if (sideName === 'bottom') y = s.bottom + GAP;
    else y = s.top - GAP - ch;
    const clamp = (v, lo, hi) => Math.min(Math.max(v, lo), Math.max(lo, hi));
    box(ui.card, Math.round(clamp(x, M, vw - cw - M)), Math.round(clamp(y, M, vh - ch - M)));
  }

  return { start };
}

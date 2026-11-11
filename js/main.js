// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 AR13X3 — Halation (https://github.com/AR13X3/halation)
import { createContext, createTarget } from './gl/gl.js';
import { Renderer, TargetSet, loopPhase } from './renderer.js';
import { Fluid } from './fluid.js';
import { Store, sanitize, encodeLook, decodeLook, migrateLook } from './store.js';
import { DOC_SIZES, LOOK_SECTIONS, defaultState, objectKey, objectValue } from './schema.js';
import { objectAt, toObjectDelta } from './objects.js';
import { PRESETS } from './presets.js';
import { buildPanel } from './ui/panel.js';
import { buildPresetsPanel } from './ui/presets-panel.js';
import { createTour } from './ui/tour.js';
import { ICONS } from './ui/icons.js';
import { toast } from './ui/controls.js';
import { randomizeSection, surpriseCandidates, recipeWeights, scoreImage, LOCKABLE, withSeed } from './randomize.js';
import { encodePNG, makeZip, download, copyImage, pickVideoMime, timestamp, slug } from './export.js';
import { track } from './analytics.js';

// Source repository (forks: point this at your own).
const REPO_URL = 'https://github.com/AR13X3/halation';
const COFFEE_URL = 'https://buymeacoffee.com/ar13x3';

const $ = (s) => document.querySelector(s);
// ?timer drives the loop with timers instead of rAF (headless capture / hidden tabs).
const raf = new URLSearchParams(location.search).has('timer')
  ? (f) => setTimeout(() => f(performance.now()), 16)
  : (f) => requestAnimationFrame(f);
const app = $('#app');
// ?wallpaper#look=… shows only the moving look, filling the window: for live
// wallpaper apps (Lively, Wallpaper Engine) and browser kiosks.
// Add &interactive to let the mouse pan, zoom, paint and move objects.
const wallpaper = new URLSearchParams(location.search).has('wallpaper');
const interactive = new URLSearchParams(location.search).has('interactive');
app.classList.toggle('wallpaper', wallpaper);
app.classList.toggle('interactive', interactive);
const canvas = $('#canvas');
const stage = $('#stage');
const frameEl = $('#frame');
const dockEl = $('#dock');
const panelEl = $('#panel');
// Phones and portrait tablets: the dock spans the bottom and settings open as
// a sheet (app.css has the same query).
const PHONE_QUERY = '(max-width: 720px), (max-width: 900px) and (orientation: portrait)';
const phoneQuery = matchMedia(PHONE_QUERY);

function hideBoot() {
  const boot = $("#boot");
  if (!boot) return;
  boot.classList.add("done");
  setTimeout(() => boot.remove(), 400);
}

function fatal(msg) {
  const el = document.createElement('div');
  el.className = 'fatal';
  el.textContent = msg;
  document.body.append(el);
}

// Let the loading screen paint before shaders compile (that can take a few
// seconds on a first visit, and blocks the page while it runs).
await new Promise((resolve) => {
  let done = false;
  const go = () => { if (!done) { done = true; resolve(); } };
  requestAnimationFrame(() => setTimeout(go, 0));
  setTimeout(go, 150);
});

const ctx = createContext(canvas);
if (!ctx) {
  fatal('Halation needs WebGL 2, which isn’t available here.\nTry a recent Chrome, Edge, Firefox or Safari, and make sure hardware acceleration is on.');
  throw new Error('WebGL2 unavailable');
}
const { gl, caps } = ctx;
const RGBA8 = { internal: gl.RGBA8, format: gl.RGBA, type: gl.UNSIGNED_BYTE };

let renderer, fluid;
try {
  renderer = new Renderer(ctx);
  fluid = new Fluid(ctx);
} catch (err) {
  console.error(err);
  fatal('Could not compile the shaders on this GPU:\n\n' + err.message);
  throw err;
}

const store = new Store();
const previewSet = new TargetSet(ctx);
const thumbSet = new TargetSet(ctx);
// First visit: desktops open widescreen on a look that suits it, phones in portrait.
const openingLook = phoneQuery.matches ? PRESETS[0] : PRESETS.find((p) => p.id === 'berry-wave');
let lookName = openingLook.name;
let edited = false; // changed since the look was loaded
let dirty = true;
let busy = false;
let rec = null;
let applyingLook = false;

// ── performance tiers ───────────────────────────────────────────────────────
// Tiers only change how the *moving* preview is rendered. As soon as the
// image stops changing, the preview refines itself to full quality, and
// exports always use the full-quality settings — so a still or an export
// looks identical on a laptop iGPU and a gaming GPU.
const TIERS = {
  eco: { label: 'Eco', dpr: 1, field: 0.33, minScale: 0.45, maxScale: 0.8, fps: 30, samples: 3 },
  balanced: { label: 'Balanced', dpr: 1.5, field: 0.5, minScale: 0.55, maxScale: 1, fps: 60, samples: 5 },
  max: { label: 'Max', dpr: 2, field: 0.75, minScale: 0.8, maxScale: 1, fps: 0, samples: 8 },
};
const REFINE = { field: 1, samples: 8, frames: 16 };    // idle stills
const EXPORT_Q = { field: 1, samples: 12, passes: 8 };   // exports: 96 samples/pixel
let perfMode = localStorage.getItem('halation.perf') || 'auto';
if (perfMode !== 'auto' && !TIERS[perfMode]) perfMode = 'auto';
let autoTier = null;                 // filled in by the benchmark
const tier = () => TIERS[perfMode === 'auto' ? autoTier || 'balanced' : perfMode];
let drs = 1;                         // dynamic resolution scale (multiplies the tier)
let drsChanged = 0;
let frameEma = 0;
let refineK = 0;                     // progressive refinement pass index (0 = not refined)
let lastChange = performance.now();

// ── initial state: share link → last session → first preset ────────────────
async function restore() {
  if (!phoneQuery.matches) Object.assign(store.state.doc, { size: 'hd', width: 1920, height: 1080 });
  const hash = location.hash.match(/look=([\w-]+)/);
  if (hash) {
    // Drop the hash once loaded so later reloads restore the user's own edits.
    // Wallpapers keep it: they reload the same look every time.
    if (!wallpaper) history.replaceState(null, '', location.pathname + location.search);
    try {
      store.applyLook(await decodeLook(hash[1]));
      lookName = 'Shared look';
      track('visit/share-link', 'Opened a share link');
      return;
    } catch (e) {
      console.warn('Bad share link', e);
      toast('That share link looks broken — loading the default look.', { type: 'error' });
    }
  }
  try {
    const sess = JSON.parse(localStorage.getItem('halation.session') || 'null');
    if (sess?.look) {
      Object.assign(store.state.doc, sess.doc || {});
      Object.assign(store.state.export, sess.export || {});
      store.applyLook(sess.look);
      lookName = sess.name || 'Untitled';
      edited = !!sess.edited;
      return;
    }
  } catch {}
  store.applyLook(openingLook.look);
}
await restore();
sanitize(store.state);
store.history = [];
store.index = -1;
store.commit();

let saveTimer = 0;
function saveSession() {
  if (wallpaper) return; // never overwrite the editor's session
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem('halation.session', JSON.stringify({
        look: store.look(), doc: store.state.doc, export: store.state.export, name: lookName, edited,
      }));
    } catch {}
  }, 400);
}

// ── layout ──────────────────────────────────────────────────────────────────
function docAspect() { return store.state.doc.width / store.state.doc.height; }
const view = { cssH: 1, frame: { x: 0, y: 0, w: 1, h: 1 }, W: 1, H: 1 };

// The room the frame has between the floating panels (stage coordinates).
const fullscreen = () => document.fullscreenElement === stage;
// Fullscreen and wallpaper links show the frame alone, with no UI around it.
const bare = () => wallpaper || fullscreen();

// In fullscreen the frame fills the screen, cropping the sides that overhang,
// when that hides little of the design; otherwise it fits inside the screen
// (a phone-shaped design on a wide monitor would lose most of its height).
// Z switches between the two until fullscreen ends.
const MAX_FILL_CROP = 0.25;
let fillOverride = null;   // null = automatic, true = fill, false = fit
function filling(area, doc) {
  if (!fullscreen()) return false;
  if (fillOverride !== null) return fillOverride;
  const sx = area.w / doc.width, sy = area.h / doc.height;
  return 1 - Math.min(sx, sy) / Math.max(sx, sy) <= MAX_FILL_CROP;
}

function frameArea() {
  const W = stage.clientWidth, H = stage.clientHeight;
  if (bare() || app.classList.contains('ui-hidden')) return { x: 0, y: 0, w: W, h: H };
  const phone = phoneQuery.matches;
  const gap = phone ? 12 : 22;
  const top = $('.bar-start').getBoundingClientRect().bottom + gap;
  const right = phone ? W - 12 : panelEl.getBoundingClientRect().left - gap;
  const lower = phone && app.classList.contains('editing') ? panelEl : dockEl;
  const bottom = lower.getBoundingClientRect().top - gap;
  const left = phone ? 12 : 28;
  return { x: left, y: top, w: Math.max(40, right - left), h: Math.max(40, bottom - top) };
}

function layout() {
  const doc = store.state.doc;
  const area = frameArea();
  // Wallpapers take the window's own shape, so nothing is cropped.
  const k = (filling(area, doc) ? Math.max : Math.min)(area.w / doc.width, area.h / doc.height);
  const cssW = wallpaper ? area.w : Math.max(1, Math.round(doc.width * k));
  const cssH = wallpaper ? area.h : Math.max(1, Math.round(doc.height * k));
  frameEl.style.width = cssW + 'px';
  frameEl.style.height = cssH + 'px';
  frameEl.style.left = area.x + area.w / 2 + 'px';
  frameEl.style.top = area.y + area.h / 2 + 'px';
  view.frame = { x: Math.round(area.x + (area.w - cssW) / 2), y: Math.round(area.y + (area.h - cssH) / 2), w: cssW, h: cssH };
  view.W = stage.clientWidth;
  view.H = stage.clientHeight;
  sizeAmbient();

  // The canvas always has full display resolution (that's what refined stills
  // use); the moving preview renders its heavy passes at a lower internal scale.
  let W, H;
  if (rec) { W = rec.W; H = rec.H; }
  else {
    let ratio = Math.min(window.devicePixelRatio || 1, 2);
    const maxPx = 8e6;
    if (cssW * cssH * ratio * ratio > maxPx) ratio = Math.sqrt(maxPx / (cssW * cssH));
    W = Math.max(1, Math.round(cssW * ratio));
    H = Math.max(1, Math.round(cssH * ratio));
  }
  view.cssH = cssH;
  if (canvas.width !== W || canvas.height !== H) {
    canvas.width = W;
    canvas.height = H;
  }
  dirty = true;
}
new ResizeObserver(layout).observe(stage);
// In fullscreen the cursor hides after a few still seconds.
let idleCursor = 0;
function wakeCursor() {
  stage.classList.remove('idle');
  clearTimeout(idleCursor);
  if (bare()) idleCursor = setTimeout(() => stage.classList.add('idle'), 2500);
}
stage.addEventListener('pointermove', wakeCursor);
stage.addEventListener('pointerdown', wakeCursor);
// For the first few seconds of fullscreen a corner hint names the Z key.
const fsHint = document.createElement('div');
fsHint.className = 'fs-hint';
stage.append(fsHint);
let fsHintTimer = 0;
function hideFsHint() { clearTimeout(fsHintTimer); fsHint.classList.remove('show'); }
document.addEventListener('fullscreenchange', () => {
  fillOverride = null;
  stage.classList.toggle('fullscreen', bare());
  wakeCursor();
  layout();
  hideFsHint();
  if (fullscreen()) {
    const fill = filling(frameArea(), store.state.doc);
    fsHint.innerHTML = `Press <kbd>Z</kbd> to ${fill ? 'fit the whole design' : 'fill the screen'}`;
    fsHint.classList.add('show');
    fsHintTimer = setTimeout(hideFsHint, 3000);
  }
});
function toggleFill() {
  if (!fullscreen()) return;
  hideFsHint();
  fillOverride = !filling(frameArea(), store.state.doc);
  layout();
  toast(fillOverride ? 'Fill the screen' : 'Fit the whole design');
}
stage.classList.toggle('fullscreen', bare());
wakeCursor();

// ── ambient light ───────────────────────────────────────────────────────────
// A tiny, blurred copy of the canvas lights the room around the frame: the
// whole picture stretched across the window, with the frame's own pixels at
// its place so the glow continues from its edges. All the blurring happens at
// this tiny size; the browser only scales the result up. Its brightness also
// sets how dark the glass panels are, so their text stays readable.
const ambient = $('#ambient');
const ambientCtx = ambient.getContext('2d', { alpha: false });
const mid = document.createElement('canvas');
const midCtx = mid.getContext('2d', { alpha: false });
const probe = document.createElement('canvas');
probe.width = 6;
probe.height = 4;
const probeCtx = probe.getContext('2d', { willReadFrequently: true });
let ambientAt = 0;
let glassAt = 0;

function sizeAmbient() {
  const w = 256, h = Math.max(1, Math.round((w * view.H) / Math.max(1, view.W)));
  if (ambient.width !== w || ambient.height !== h) { ambient.width = w; ambient.height = h; }
}

// Call right after the canvas was drawn, while its pixels are still readable.
function paintAmbient(now, force = false) {
  if (app.classList.contains('ui-hidden') && !force) return;
  if (!force && now - ambientAt < (app.classList.contains('lite') ? 250 : 80)) return;
  ambientAt = now;
  try {
    const k = Math.min(1, 192 / Math.max(canvas.width, canvas.height));
    const mw = Math.max(1, Math.round(canvas.width * k)), mh = Math.max(1, Math.round(canvas.height * k));
    if (mid.width !== mw || mid.height !== mh) { mid.width = mw; mid.height = mh; }
    midCtx.drawImage(canvas, 0, 0, mw, mh);
    const aw = ambient.width, ah = ambient.height;
    // The stretched picture only sets the mood, so it is blurred to color
    // fields first (drawn oversized so the blur doesn't darken the edges).
    const pad = aw * 0.15;
    ambientCtx.filter = 'blur(18px) saturate(1.25) brightness(.55)';
    ambientCtx.drawImage(mid, -pad, -pad, aw + pad * 2, ah + pad * 2);
    // The ambient element overhangs the stage by 8% on every side (app.css).
    const sx = aw / (view.W * 1.16), sy = ah / (view.H * 1.16);
    const f = view.frame;
    ambientCtx.filter = 'blur(8px) saturate(1.25) brightness(.55)';
    ambientCtx.drawImage(mid, (f.x + view.W * 0.08) * sx, (f.y + view.H * 0.08) * sy, f.w * sx, f.h * sy);
    ambientCtx.filter = 'none';
    ambient.classList.add('on');
    if (now - glassAt > 900) { glassAt = now; adaptGlass(); }
  } catch (err) {
    console.warn('ambient light off', err);
    paintAmbient = () => {};
  }
}

function adaptGlass() {
  probeCtx.drawImage(ambient, 0, 0, probe.width, probe.height);
  const d = probeCtx.getImageData(0, 0, probe.width, probe.height).data;
  let lum = 0;
  for (let i = 0; i < d.length; i += 4) lum += 0.2126 * d[i] + 0.7152 * d[i + 1] + 0.0722 * d[i + 2];
  lum /= (d.length / 4) * 255;
  // The room shows the light at 55% (app.css), so judge what is on screen.
  const a = Math.min(0.72, Math.max(0.36, 0.32 + 0.62 * lum * 0.55));
  app.style.setProperty('--glass-a', a.toFixed(3));
}

// ── render loop ─────────────────────────────────────────────────────────────
function isFluid() { return store.state.source.type === 'fluid'; }
// patterns the canvas can pan and zoom (not the fluid, which is painted, or no flow)
function pannable() { return !['fluid', 'none'].includes(store.state.source.type); }

let liveScale = 1;

// Moving frame: tier settings × dynamic resolution.
function renderLive() {
  const t = tier();
  const cssRatio = canvas.height / Math.max(1, view.cssH);   // canvas px per css px
  liveScale = rec ? 1 : Math.min(1, t.dpr / cssRatio) * drs;
  renderer.render(store.state, previewSet, { w: canvas.width, h: canvas.height, target: null }, {
    internalScale: liveScale,
    fieldScale: rec ? REFINE.field : t.field,
    samples: rec ? REFINE.samples : t.samples,
    dyeTex: isFluid() ? fluid.dyeTexture : null,
  });
}

// Still frame: full resolution, then glass passes averaged progressively.
function renderRefine(k) {
  renderer.render(store.state, previewSet, { w: canvas.width, h: canvas.height, target: null }, {
    internalScale: 1,
    fieldScale: REFINE.field,
    samples: REFINE.samples,
    accum: k,
    dyeTex: isFluid() ? fluid.dyeTexture : null,
  });
}
const refineFrames = () => (Renderer.needsAccumulation(store.state) ? REFINE.frames : 1);

// Dynamic resolution: trade internal resolution for frame rate while moving.
function adaptResolution(interval, t) {
  frameEma = frameEma ? frameEma * 0.85 + interval * 0.15 : interval;
  const target = 1000 / (t.fps || 60);
  const now = performance.now();
  if (frameEma > target * 1.35 && drs > t.minScale && now - drsChanged > 400) {
    drs = Math.max(t.minScale, +(drs - 0.1).toFixed(2));
    drsChanged = now;
    frameEma = target;
  } else if (frameEma < target * 1.12 && drs < t.maxScale && now - drsChanged > 2500) {
    drs = Math.min(t.maxScale, +(drs + 0.05).toFixed(2));
    drsChanged = now;
  }
}

let last = performance.now();
let lastRender = 0;
let simDt = 0;
let fpsT = last, fpsN = 0, liveFps = 0;
const perfEl = $('#fps');

function tick(now) {
  raf(tick);
  const dt = Math.min(0.1, Math.max(0, (now - last) / 1000));
  last = now;
  const s = store.state;
  const a = s.anim;
  const t = tier();

  if (a.playing) {
    a.time += dt;
    if (a.loop) a.time %= a.duration;
    dirty = true;
  }
  const fluidOn = isFluid();
  if (fluidOn) {
    fluid.ensure(docAspect(), s.source.fluidQuality);
    if (a.playing) { simDt += dt; dirty = true; }
  }

  if (dirty) {
    const cap = rec ? 0 : t.fps;
    if (!cap || now - lastRender >= 1000 / cap - 4) {
      if (fluidOn && simDt > 0) { fluid.step((simDt * a.speed) / 0.6, s.source); simDt = 0; }
      if (lastRender && a.playing && !rec) adaptResolution(now - lastRender, t);
      renderLive();
      paintAmbient(now, !lastRender);
      if (!lastRender) {
        hideBoot();
        // get the object shaders ready while the user looks around
        setTimeout(() => renderer.warmObjects(), 200);
      }
      lastRender = now;
      dirty = false;
      refineK = 0;
      lastChange = now;
      fpsN++;
    }
  } else if (!rec && refineK < refineFrames() && now - lastChange > 140) {
    renderRefine(refineK);
    refineK++;
    if (refineK === refineFrames()) paintAmbient(now, true);
  }

  if (rec) {
    rec.elapsed += dt;
    $('#rec-text').textContent = rec.auto
      ? `REC ${rec.elapsed.toFixed(1)} / ${a.duration.toFixed(1)}s`
      : `REC ${rec.elapsed.toFixed(1)}s`;
    if (rec.auto && rec.elapsed >= a.duration) stopRecording();
  }
  if (now - fpsT > 500) {
    liveFps = Math.round((fpsN * 1000) / (now - fpsT));
    fpsT = now;
    fpsN = 0;
  }
  let status;
  if (rec) status = `${liveFps} fps · rec`;
  else if (now - lastChange < 300) status = `${liveFps} fps · ${Math.round(liveScale * 100)}%`;
  else if (refineK < refineFrames()) status = `Refining ${Math.round((refineK / refineFrames()) * 100)}%`;
  else status = 'Full quality';
  if (perfEl.textContent !== status) perfEl.textContent = status;
  syncTransport();
}

// ── UI wiring ───────────────────────────────────────────────────────────────
const setIcon = (sel, icon, label) => { const el = $(sel); el.innerHTML = ICONS[icon] + (label ? `<span>${label}</span>` : ''); return el; };
setIcon('#btn-undo', 'undo').onclick = () => undo();
setIcon('#btn-redo', 'redo').onclick = () => redo();
setIcon('#btn-surprise', 'dice', 'Surprise me').onclick = () => surprise();
setIcon('#btn-similar', 'sparkle', 'Similar').onclick = () => (similarEl.hidden ? openSimilar() : closeSimilar(false));
setIcon('#btn-share', 'link', 'Share');
// Share opens a small panel: open the link in the editor, or full screen
// (with or without the mouse). The last choice is remembered.
const sharePop = $('#share-pop');
const shareBtn = $('#btn-share');
const shareOpts = (() => {
  try { return { full: false, mouse: false, ...JSON.parse(localStorage.getItem('halation.share') || '{}') }; } catch { return { full: false, mouse: false }; }
})();
function syncSharePop() {
  for (const b of sharePop.querySelectorAll('[data-open]')) b.setAttribute('aria-pressed', String((b.dataset.open === 'full') === shareOpts.full));
  $('#share-mouse-row').hidden = !shareOpts.full;
  $('#share-mouse').checked = shareOpts.mouse;
  try { localStorage.setItem('halation.share', JSON.stringify(shareOpts)); } catch {}
}
function setSharePop(on) {
  sharePop.hidden = !on;
  shareBtn.setAttribute('aria-expanded', String(on));
  if (!on) return;
  // Hang it under the Share button, inside the window.
  const r = shareBtn.getBoundingClientRect();
  sharePop.style.right = 'auto';
  sharePop.style.left = Math.max(12, Math.min(r.left, innerWidth - sharePop.offsetWidth - 12)) + 'px';
  syncSharePop();
  $('#share-copy').focus();
}
shareBtn.onclick = () => setSharePop(sharePop.hidden);
for (const b of sharePop.querySelectorAll('[data-open]')) b.onclick = () => { shareOpts.full = b.dataset.open === 'full'; syncSharePop(); };
$('#share-mouse').onchange = (e) => { shareOpts.mouse = e.target.checked; syncSharePop(); };
setIcon('#share-copy', 'link', 'Copy link').onclick = () => {
  setSharePop(false);
  share({ wallpaper: shareOpts.full, interactive: shareOpts.mouse });
};
document.addEventListener('pointerdown', (e) => {
  if (!sharePop.hidden && !sharePop.contains(e.target) && !shareBtn.contains(e.target)) setSharePop(false);
});
setIcon('#btn-repo', 'github', 'GitHub').href = REPO_URL;
setIcon('#btn-export', 'download', 'Export').onclick = () => exportImage();
setIcon('#btn-hide', 'eye').onclick = () => toggleUI();
setIcon('#btn-show', 'eye').onclick = () => toggleUI();
setIcon('#btn-loop', 'loop').onclick = () => { store.set('anim.loop', !store.state.anim.loop); store.commit(); };
setIcon('#btn-looks', 'grid', 'All looks');
setIcon('#btn-edit', 'sliders', 'Edit').onclick = () => setEditing(true);

// The title names the current look and opens the looks browser.
const titleBtn = $('#btn-title');
titleBtn.insertAdjacentHTML('beforeend', ICONS.chevron);
function setLookName(name, isEdited = false) {
  lookName = name;
  edited = isEdited;
  $('#look-name').textContent = name;
  $('#look-edited').hidden = !edited;
  titleBtn.setAttribute('aria-label', `${name}${edited ? ' (edited)' : ''}: browse looks`);
  saveSession();
}

// Help menu: tutorial, shortcuts, guide, source and support (plus Share on phones).
const helpBtn = setIcon('#btn-help', 'help');
const helpMenu = $('#help-menu');
setIcon('#btn-tour', 'compass', 'Tutorial').onclick = () => tour.start();
setIcon('#btn-keys', 'keyboard', 'Keyboard shortcuts').onclick = () => $('#help').showModal();
$('#btn-keys').insertAdjacentHTML('beforeend', '<kbd>?</kbd>');
setIcon('#btn-guide', 'book', 'User guide').href = `${REPO_URL}/blob/main/docs/GUIDE.md`;
setIcon('#btn-github', 'github', 'Source on GitHub').href = REPO_URL;
for (const [sel, label] of [['#btn-support', 'Support'], ['#btn-coffee', 'Buy me a coffee']]) {
  const el = setIcon(sel, 'coffee', label);
  el.href = COFFEE_URL;
  el.addEventListener('click', () => track('support/coffee', 'Buy me a coffee'));
}
{
  const item = document.createElement('button');
  item.className = 'phone-only';
  item.setAttribute('role', 'menuitem');
  item.innerHTML = `${ICONS.link}<span>Copy share link</span>`;
  item.onclick = () => share();
  const wall = document.createElement('button');
  wall.className = 'phone-only';
  wall.setAttribute('role', 'menuitem');
  wall.innerHTML = `${ICONS.expand}<span>Copy full-screen link</span>`;
  wall.onclick = () => share({ wallpaper: true });
  helpMenu.prepend(item, wall);
}
function setMenu(on) {
  helpMenu.hidden = !on;
  helpBtn.setAttribute('aria-expanded', String(on));
  if (on) [...helpMenu.children].find((el) => el.offsetParent)?.focus();
}
helpBtn.onclick = () => setMenu(helpMenu.hidden);
helpMenu.addEventListener('click', (e) => { if (e.target.closest('[role="menuitem"]')) setMenu(false); });
helpMenu.addEventListener('keydown', (e) => {
  if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
  e.preventDefault();
  const items = [...helpMenu.children].filter((el) => el.offsetParent);
  const i = items.indexOf(document.activeElement);
  items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
});
document.addEventListener('pointerdown', (e) => {
  if (!helpMenu.hidden && !helpMenu.contains(e.target) && !helpBtn.contains(e.target)) setMenu(false);
});

// Phones edit in a sheet that takes the dock's place.
function setEditing(on) {
  if (app.classList.contains('editing') === on) return;
  app.classList.toggle('editing', on);
  $('#btn-edit').setAttribute('aria-expanded', String(on));
  if (on) presetsPanel.close();
  layout();
}
phoneQuery.addEventListener('change', () => layout());

const playBtn = $('#btn-play');
playBtn.onclick = () => togglePlay();
$('#help [data-close]').innerHTML = ICONS.close;
$('#help [data-close]').onclick = () => $('#help').close();
$('#help').addEventListener('click', (e) => { if (e.target === $('#help')) $('#help').close(); });

const qualitySel = $('#quality');
function syncPerfSelect() {
  qualitySel.querySelector('option[value="auto"]').textContent = `Auto · ${TIERS[autoTier || 'balanced'].label}`;
  qualitySel.value = perfMode;
  // Live blur behind the panels costs GPU time, so Eco uses solid ones.
  app.classList.toggle('lite', tier() === TIERS.eco);
}
qualitySel.onchange = () => {
  perfMode = qualitySel.value;
  try { localStorage.setItem('halation.perf', perfMode); } catch {}
  drs = tier().maxScale;
  frameEma = 0;
  syncPerfSelect();
  layout();
};

// Quick GPU benchmark for "Auto": renders a heavy-ish look offscreen and picks a tier.
function benchmark() {
  try {
    const s = defaultState();
    Object.assign(s.source, { type: 'silk', detail: 5 });
    Object.assign(s.glass, { type: 'reeded', count: 20, frost: 0.3 });
    const W = 540, H = 960;
    const set = new TargetSet(ctx);
    const tgt = createTarget(gl, W, H, RGBA8, { filter: gl.NEAREST });
    const px = new Uint8Array(4);
    const opts = { fieldScale: 0.5, samples: 5, time: 0 };
    renderer.render(s, set, { w: W, h: H, target: tgt }, opts);
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px); // warm-up + GPU sync
    const n = 6;
    const t0 = performance.now();
    for (let i = 0; i < n; i++) renderer.render(s, set, { w: W, h: H, target: tgt }, { ...opts, time: i * 0.37 });
    gl.readPixels(0, 0, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, px);
    const ms = (performance.now() - t0) / n;
    set.dispose();
    tgt.dispose();
    const est = ms * 2.5; // a Balanced preview is roughly 2–3× this workload
    return { tier: est < 7 ? 'max' : est < 20 ? 'balanced' : 'eco', ms };
  } catch (err) {
    console.warn('benchmark failed', err);
    return { tier: 'balanced', ms: 0 };
  }
}

function gpuName() {
  try {
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    return ext ? gl.getParameter(ext.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
  } catch { return 'unknown GPU'; }
}

{
  const b = benchmark();
  autoTier = b.tier;
  drs = tier().maxScale;
  qualitySel.title = `Preview performance. Only affects the moving preview — stills refine to full quality and exports are identical on every machine.\nGPU: ${gpuName()} (${b.ms.toFixed(1)} ms benchmark → ${TIERS[autoTier].label})`;
  syncPerfSelect();
}

const scrub = $('#scrub');
const scrubWrap = $('#scrub-wrap');
const timeEl = $('#time');
let scrubbing = false;
scrub.addEventListener('pointerdown', () => { scrubbing = true; });
scrub.addEventListener('input', () => {
  const a = store.state.anim;
  a.time = (scrub.value / 1000) * a.duration;
  dirty = true;
});
scrub.addEventListener('change', () => { scrubbing = false; });
window.addEventListener('pointerup', () => { scrubbing = false; });

let lastPlaying = null;
let lastTime = '';
function syncTransport() {
  const a = store.state.anim;
  if (lastPlaying !== a.playing) {
    playBtn.innerHTML = a.playing ? ICONS.pause : ICONS.play;
    lastPlaying = a.playing;
  }
  $('#btn-loop').classList.toggle('active', a.loop);
  scrubWrap.style.visibility = a.loop ? 'visible' : 'hidden';
  if (a.loop) {
    if (!scrubbing) scrub.value = Math.round((a.time / a.duration) * 1000);
    scrub.style.setProperty('--fill', `${(a.time / a.duration) * 100}%`);
  }
  const t = a.loop ? `${a.time.toFixed(1)} <i>/ ${a.duration.toFixed(0)} s</i>` : `${a.time.toFixed(1)} s`;
  if (t !== lastTime) { timeEl.innerHTML = t; lastTime = t; }
}

function togglePlay() {
  store.state.anim.playing = !store.state.anim.playing;
  last = performance.now();
  dirty = true;
}

function toggleUI() {
  app.classList.toggle('ui-hidden');
  setMenu(false);
  presetsPanel.close();
  layout();
  if (app.classList.contains('ui-hidden')) ambient.classList.remove('on');
}

const actions = {
  randomizeSection(id) {
    randomizeSection(store.state, id);
    afterBulkChange();
  },
  resetSection(id) {
    // Reset the section's settings but keep its type and the palette.
    const d = defaultState();
    const cur = store.state[id];
    store.state[id] = { ...d[id] };
    if ('type' in cur) store.state[id].type = cur.type;
    if (id === 'color') store.state.color.stops = cur.stops;
    if (id === 'objects') Object.assign(store.state.objects, { count: cur.count, edit: cur.edit });
    afterBulkChange();
  },
  uploadImage: () => $('#file-image').click(),
  resetFluid: () => { fluid.reset(); dirty = true; },
  exportImage: () => exportImage(),
  copyImage: () => copyToClipboard(),
  burst: () => burst(),
  toggleRecord: () => (rec ? stopRecording() : startRecording()),
  isRecording: () => !!rec,
  applyLook(look, name) {
    applyingLook = true;
    store.applyLook(look);
    store.commit();
    applyingLook = false;
    setLookName(name);
    if (isFluid()) fluid.reset();
  },
  renameLook: (name) => setLookName(name),
  closeEditor: () => setEditing(false),
  thumbnail: (look) => thumbnail(look),
  // false while a look's shaders are still compiling in the background
  thumbnailReady: (look) => !(migrateLook(look)?.objects?.count > 0) || renderer.objectsReady(),
  download: (blob, name) => download(blob, name),
};

function afterBulkChange(name) {
  sanitize(store.state);
  store.emit('*');
  store.commit();
  if (name) setLookName(name);
}

// Surprise me: render a few candidates from one recipe at a tiny size and keep
// the one that scores best (see randomize.js).
const surpriseSet = new TargetSet(ctx);
let surpriseTarget = null;
// With `base` and `lock`, every candidate keeps the locked sections of `base`.
function pickSurprise({ candidates = 6, weights, base, lock = [] } = {}) {
  const doc = store.state.doc;
  const cands = surpriseCandidates(store.state, candidates, weights);
  for (const c of cands) for (const k of lock) c.look[k] = structuredClone(base[k]);
  let best = cands[0];
  let bestScore = -Infinity;
  try {
    const H = 112, W = Math.max(24, Math.min(256, Math.round((H * doc.width) / doc.height)));
    if (!surpriseTarget || surpriseTarget.w !== W) {
      surpriseTarget?.dispose();
      surpriseTarget = createTarget(gl, W, H, RGBA8, { filter: gl.NEAREST });
    }
    const px = new Uint8Array(W * H * 4);
    for (const c of cands) {
      const s = defaultState();
      for (const k of LOOK_SECTIONS) s[k] = { ...s[k], ...structuredClone(c.look[k] || {}) };
      sanitize(s);
      s.doc.width = doc.width;
      s.doc.height = doc.height;
      renderer.render(s, surpriseSet, { w: W, h: H, target: surpriseTarget }, { time: store.state.anim.time, fieldScale: 1, samples: 3 });
      surpriseTarget.bind();
      gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
      const score = scoreImage(px, W, H, { dark: c.dark, screen: c.patterned || s.screen.type !== 'none' });
      if (score > bestScore) { bestScore = score; best = c; }
    }
  } catch (err) {
    console.warn('Surprise me: could not compare candidates', err);
  }
  dirty = true;
  return { ...best, score: bestScore };
}

function surprise() {
  store.applyLook(pickSurprise().look);
  afterBulkChange('Surprise');
  track('surprise', 'Surprise me');
}

// ── similar looks ───────────────────────────────────────────────────────────
// Lock some sections of the current look, then Remix the rest. The canvas
// shows each try; Keep commits it, closing goes back to the starting look. The
// panel also copies wallpaper links that remix themselves every day or on
// every visit.
const similarEl = $('#similar');
const similarLocks = new Set(['color']);
let similarBase = null;
let similarName = '';
let similarAuto = 0;
// While Similar is open, undo and redo step through its remixes.
let similarHist = [];
let similarPos = 0;

for (const sec of LOCKABLE) {
  const b = document.createElement('button');
  b.className = 'lock-chip';
  b.textContent = sec.title;
  b.setAttribute('aria-pressed', similarLocks.has(sec.id));
  b.onclick = () => {
    similarLocks.has(sec.id) ? similarLocks.delete(sec.id) : similarLocks.add(sec.id);
    b.setAttribute('aria-pressed', similarLocks.has(sec.id));
  };
  $('#similar-locks').append(b);
}

function openSimilar() {
  if (!similarEl.hidden) return;
  similarBase = store.look();
  similarName = lookName;
  similarHist = [similarBase];
  queueSync();
  similarPos = 0;
  similarEl.hidden = false;
  $('#similar-keep').disabled = true;
  $('#btn-similar').setAttribute('aria-expanded', 'true');
  track('similar', 'Open Similar');
}

function closeSimilar(keep) {
  if (similarEl.hidden) return;
  setSimilarAuto(false);
  similarEl.hidden = true;
  $('#btn-similar').setAttribute('aria-expanded', 'false');
  // A preset or edit made while the panel was open stays.
  if (similarRebase()) return;
  if (keep && similarPos) { afterBulkChange('Similar look'); return; }
  showLook(similarBase);
  setLookName(similarName, edited);
}

// Shows a look without adding it to the undo history.
function showLook(look) {
  applyingLook = true;
  store.applyLook(look);
  sanitize(store.state);
  store.emit('*');
  applyingLook = false;
}

// If the look changed outside Similar (a preset, an edit), it becomes the new
// starting point. Returns true when that happened.
function similarRebase() {
  if (JSON.stringify(store.look()) === JSON.stringify(similarHist[similarPos])) return false;
  similarBase = store.look();
  similarName = lookName;
  similarHist = [similarBase];
  similarPos = 0;
  $('#similar-keep').disabled = true;
  return true;
}

function shuffleSimilar() {
  similarRebase();
  const look = pickSurprise({ candidates: 4, base: similarBase, lock: [...similarLocks] }).look;
  similarHist = similarHist.slice(0, similarPos + 1);
  similarHist.push(look);
  similarPos = similarHist.length - 1;
  showSimilarStep();
}

function showSimilarStep() {
  showLook(similarHist[similarPos]);
  // Keep the look as the canvas has it, so similarRebase can compare.
  similarHist[similarPos] = store.look();
  $('#similar-keep').disabled = !similarPos;
}

const similarOpen = () => !similarEl.hidden;
const canUndo = () => (similarOpen() && !similarRebase() ? similarPos > 0 : store.canUndo());
const canRedo = () => (similarOpen() && !similarRebase() ? similarPos < similarHist.length - 1 : store.canRedo());
function undo() {
  if (!similarOpen() || similarRebase()) return store.undo();
  if (similarPos > 0) { similarPos--; showSimilarStep(); }
}
function redo() {
  if (!similarOpen() || similarRebase()) return store.redo();
  if (similarPos < similarHist.length - 1) { similarPos++; showSimilarStep(); }
}

function setSimilarAuto(on) {
  clearInterval(similarAuto);
  similarAuto = on ? setInterval(shuffleSimilar, 1600) : 0;
  setIcon('#similar-auto', on ? 'pause' : 'play', on ? 'Stop' : 'Auto').setAttribute('aria-pressed', on);
}

async function copySimilarLink() {
  const code = await encodeLook(similarBase);
  const vary = $('#similar-vary').value;
  const mouse = $('#similar-mouse').checked ? '&interactive' : '';
  const url = `${location.origin}${location.pathname}?wallpaper${mouse}&vary=${vary}&lock=${[...similarLocks].join(',')}#look=${code}`;
  track('share/similar', 'Copy similar wallpaper link');
  try {
    await navigator.clipboard.writeText(url);
    toast(vary === 'day' ? 'Link copied — a new similar look every day' : 'Link copied — a new similar look every time it opens');
  } catch {
    prompt('Copy this wallpaper link:', url);
  }
}

setIcon('#similar-shuffle', 'dice', 'Remix').onclick = () => shuffleSimilar();
setIcon('#similar-keep', 'check', 'Keep').onclick = () => closeSimilar(true);
setIcon('#similar-copy', 'link', 'Copy link').onclick = () => copySimilarLink();
setSimilarAuto(false);
$('#similar-auto').onclick = () => setSimilarAuto(!similarAuto);
$('#similar-close').innerHTML = ICONS.close;
$('#similar-close').onclick = () => closeSimilar(false);

// Wallpaper links with ?vary remix the shared look, keeping the locked sections.
// "day" seeds the remix with the date, so it changes at midnight and stays put
// across reloads; "load" makes a new one on every visit.
function varyWallpaper() {
  const q = new URLSearchParams(location.search);
  const vary = q.get('vary');
  if (!wallpaper || !vary) return;
  const valid = new Set(LOCKABLE.map((x) => x.id));
  const lock = (q.get('lock') || '').split(',').filter((k) => valid.has(k));
  const base = store.look();
  const remix = (seed) => {
    const make = () => pickSurprise({ candidates: 4, base, lock }).look;
    showLook(seed ? withSeed(seed, make) : make());
  };
  if (vary === 'day') {
    let day = new Date().toDateString();
    remix(day);
    setInterval(() => {
      const now = new Date().toDateString();
      if (now !== day) remix(day = now);
    }, 60e3);
  } else remix();
}

const panel = buildPanel($('#panel'), store, actions);
const presetsPanel = buildPresetsPanel({ strip: $('#presets'), sheet: $('#looks-sheet'), opener: [$('#btn-looks'), titleBtn] }, store, actions);
$('#btn-looks').onclick = () => presetsPanel.toggle();
titleBtn.onclick = () => presetsPanel.toggle();
setLookName(lookName, edited);
const tour = createTour({
  store,
  showUI: () => { if (app.classList.contains('ui-hidden')) toggleUI(); },
  clearSearch: () => panel.clearSearch(),
  showSection: (id) => { if (phoneQuery.matches) setEditing(true); if (id) panel.showTab(id); },
  showDock: () => { setEditing(false); presetsPanel.close(); },
  guideUrl: `${REPO_URL}/blob/main/docs/GUIDE.md`,
});

let syncQueued = false;
function queueSync() {
  if (syncQueued) return;
  syncQueued = true;
  raf(() => {
    syncQueued = false;
    panel.sync();
    $('#btn-undo').disabled = !canUndo();
    $('#btn-redo').disabled = !canRedo();
  });
}

store.on((path) => {
  dirty = true;
  if (path === 'doc.size') {
    const d = DOC_SIZES.find((x) => x.value === store.state.doc.size);
    if (d && d.w) { store.state.doc.width = d.w; store.state.doc.height = d.h; }
  }
  if (path === '*' || path.startsWith('doc')) layout();
  if (!applyingLook && path !== 'objects.edit' && !path.startsWith('doc') && !path.startsWith('export')) {
    presetsPanel.clearActive();
    if (!edited) setLookName(lookName, true);
  }
  queueSync();
  saveSession();
});

// Highlight the restored preset if it matches.
const match = PRESETS.find((p) => p.name === lookName);
if (match && !edited) presetsPanel.setActive(match.id);

// ── canvas interaction: move objects / pan / zoom / paint ───────────────────
// The object (1–6) under the pointer, or 0.
function objectUnder(e, rect) {
  const px = ((e.clientX - rect.left) / rect.width - 0.5) * docAspect();
  const py = 0.5 - (e.clientY - rect.top) / rect.height;
  const a = store.state.anim;
  return objectAt(store.state, loopPhase(a, a.time), px, py, 4 / rect.height);
}

let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  canvas.setPointerCapture(e.pointerId);
  const rect = canvas.getBoundingClientRect();
  const hit = objectUnder(e, rect);
  if (hit) {
    store.set('objects.edit', hit);
    drag = { obj: hit, x: e.clientX, y: e.clientY, ox: objectValue(store.state, hit, 'X'), oy: objectValue(store.state, hit, 'Y'), rect, moved: false };
    canvas.classList.add('grabbing');
    return;
  }
  const s = store.state.source;
  drag = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, ox: s.offsetX, oy: s.offsetY, rect: canvas.getBoundingClientRect(), moved: false };
  canvas.classList.toggle('grabbing', pannable());
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) {
    canvas.classList.toggle('over-object', !!objectUnder(e, canvas.getBoundingClientRect()));
    return;
  }
  const { rect } = drag;
  if (drag.obj) {
    const [dx, dy] = toObjectDelta(store.state, (e.clientX - drag.x) / rect.height, -(e.clientY - drag.y) / rect.height);
    if (Math.abs(dx) + Math.abs(dy) > 0.002) drag.moved = true;
    const clamp = (v) => +Math.min(2, Math.max(-2, v)).toFixed(4);
    store.state.objects[`o${drag.obj}X`] = clamp(drag.ox + dx);
    store.state.objects[`o${drag.obj}Y`] = clamp(drag.oy + dy);
    store.emit(objectKey(drag.obj, 'X'));
    return;
  }
  const s = store.state.source;
  if (isFluid()) {
    const x = (e.clientX - rect.left) / rect.width;
    const y = 1 - (e.clientY - rect.top) / rect.height;
    const dx = (e.clientX - drag.lx) / rect.width;
    const dy = -(e.clientY - drag.ly) / rect.height;
    fluid.ensure(docAspect(), s.fluidQuality);
    fluid.splat(x, y, dx * 5000 * s.fluidForce, dy * 5000 * s.fluidForce, 0.6 * s.fluidInk, s.fluidRadius);
    drag.lx = e.clientX;
    drag.ly = e.clientY;
    dirty = true;
    return;
  }
  if (!pannable()) return;
  const H = rect.height;
  const dX = (e.clientX - drag.x) / H;
  const dY = -(e.clientY - drag.y) / H;
  if (Math.abs(dX) + Math.abs(dY) > 0.002) drag.moved = true;
  const ang = (s.rotation * Math.PI) / 180;
  const c = Math.cos(ang), sn = Math.sin(ang);
  const rx = c * dX - sn * dY, ry = sn * dX + c * dY;
  const clamp = (v) => Math.min(3, Math.max(-3, v));
  s.offsetX = +clamp(drag.ox - rx / s.scale).toFixed(4);
  s.offsetY = +clamp(drag.oy - ry / s.scale).toFixed(4);
  store.emit('source.offset');
});
const endDrag = () => {
  if (drag?.moved) store.commit();
  drag = null;
  canvas.classList.remove('grabbing');
};
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointerleave', () => canvas.classList.remove('over-object'));
canvas.addEventListener('pointercancel', endDrag);

let wheelTimer = 0;
canvas.addEventListener('wheel', (e) => {
  if (!pannable()) return;
  e.preventDefault();
  const s = store.state.source;
  const k = Math.exp(-e.deltaY * 0.0015);
  store.set('source.scale', +Math.min(4, Math.max(0.15, s.scale * k)).toFixed(3));
  clearTimeout(wheelTimer);
  wheelTimer = setTimeout(() => store.commit(), 300);
}, { passive: false });

canvas.addEventListener('dblclick', () => {
  if (!pannable()) return;
  store.state.source.offsetX = 0;
  store.state.source.offsetY = 0;
  store.emit('source.offset');
  store.commit();
});

function syncCanvasCursor() { canvas.classList.toggle('paint', isFluid()); }
store.on(syncCanvasCursor);
syncCanvasCursor();

// ── images: upload + drag & drop ────────────────────────────────────────────
async function loadImageFile(file) {
  if (!file || !file.type.startsWith('image/')) { toast('That’s not an image file.', { type: 'error' }); return; }
  const url = URL.createObjectURL(file);
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    renderer.setImage(img);
    if (store.state.source.type !== 'image') store.set('source.type', 'image');
    store.commit();
    dirty = true;
    toast(`Using “${file.name}” as the flow source`);
  } catch {
    toast('Could not read that image.', { type: 'error' });
  } finally {
    URL.revokeObjectURL(url);
  }
}
$('#file-image').addEventListener('change', (e) => { loadImageFile(e.target.files[0]); e.target.value = ''; });
let dragDepth = 0;
stage.addEventListener('dragenter', (e) => { if ([...e.dataTransfer.types].includes('Files')) { dragDepth++; stage.classList.add('dragging'); e.preventDefault(); } });
stage.addEventListener('dragover', (e) => { if ([...e.dataTransfer.types].includes('Files')) e.preventDefault(); });
stage.addEventListener('dragleave', () => { if (--dragDepth <= 0) { dragDepth = 0; stage.classList.remove('dragging'); } });
stage.addEventListener('drop', (e) => {
  e.preventDefault();
  dragDepth = 0;
  stage.classList.remove('dragging');
  loadImageFile(e.dataTransfer.files[0]);
});
store.on((path) => {
  if ((path === 'source.type' || path === '*') && store.state.source.type === 'image' && !renderer.hasImage) {
    toast('Choose or drop an image to use as the source');
  }
});

// ── thumbnails ──────────────────────────────────────────────────────────────
let thumbTarget = null;
const thumbCanvas = document.createElement('canvas');
function thumbnail(look) {
  try {
    const W = 180, H = 240;
    const s = defaultState();
    look = migrateLook(look);
    for (const k of LOOK_SECTIONS) s[k] = { ...s[k], ...structuredClone(look?.[k] || {}) };
    sanitize(s);
    s.doc.width = W;
    s.doc.height = H;
    if (s.source.type === 'fluid' || s.source.type === 'image') {
      Object.assign(s.source, { type: 'silk', warp: 1.7, twist: 2.2, scale: 1.1, seed: 404 });
    }
    thumbTarget ??= createTarget(gl, W, H, RGBA8, { filter: gl.NEAREST });
    renderer.render(s, thumbSet, { w: W, h: H, target: thumbTarget }, { time: 2.2, fieldScale: 1, samples: 8, passes: 3, flipY: true });
    const px = new Uint8Array(W * H * 4);
    gl.readPixels(0, 0, W, H, gl.RGBA, gl.UNSIGNED_BYTE, px);
    thumbCanvas.width = W;
    thumbCanvas.height = H;
    thumbCanvas.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(px.buffer), W, H), 0, 0);
    dirty = true;
    return thumbCanvas.toDataURL('image/jpeg', 0.86);
  } catch (err) {
    console.warn('thumbnail failed', err);
    return null;
  }
}

// ── export ──────────────────────────────────────────────────────────────────
const busyEl = $('#busy');
let busyTimer = 0;
function setBusy(text) {
  busy = !!text;
  clearTimeout(busyTimer);
  if (text) {
    $('#busy-text').textContent = text;
    $('#busy-bar').style.width = '0%';
    busyTimer = setTimeout(() => { busyEl.hidden = false; }, 120);
  } else busyEl.hidden = true;
}
function setProgress(f) { $('#busy-bar').style.width = `${Math.round(f * 100)}%`; }
const nextFrame = () => new Promise((r) => raf(() => setTimeout(r, 0)));

function exportSize(scale) {
  const s = store.state;
  return [Math.max(1, Math.round(s.doc.width * scale)), Math.max(1, Math.round(s.doc.height * scale))];
}

async function renderImage({ scale, format, quality: q = 0.95, time, onProgress }) {
  const s = store.state;
  const [W, H] = exportSize(scale);
  const maxDim = Math.min(caps.maxTexture, caps.maxRenderbuffer, caps.maxViewport[0], caps.maxViewport[1]);
  if (W > maxDim || H > maxDim) throw new Error(`${W} × ${H} is larger than your GPU allows (${maxDim}px). Try a smaller scale.`);
  if (W * H > 80e6) throw new Error(`${W} × ${H} is too large to export in the browser. Try a smaller scale.`);
  const want16 = format === 'png16';
  const fmt = want16 ? caps.float32 : RGBA8;
  if (!fmt) throw new Error('16-bit export needs float render targets, which this browser/GPU doesn’t support. Use PNG 8-bit.');

  const set = new TargetSet(ctx);
  let target = null;
  try {
    target = createTarget(gl, W, H, fmt, { filter: gl.NEAREST });
    renderer.render(s, set, { w: W, h: H, target }, {
      time: time ?? s.anim.time,
      fieldScale: EXPORT_Q.field,
      samples: EXPORT_Q.samples,
      passes: EXPORT_Q.passes,
      flipY: true,
      dither: !want16,
      dyeTex: isFluid() ? fluid.dyeTexture : null,
    });
    set.dispose();
    const err = gl.getError();
    if (err === gl.OUT_OF_MEMORY) throw new Error('The GPU ran out of memory. Try a smaller scale.');

    const readStrip = (y0, rows) => {
      target.bind();
      const arr = want16 ? new Float32Array(W * rows * 4) : new Uint8Array(W * rows * 4);
      gl.readPixels(0, y0, W, rows, gl.RGBA, want16 ? gl.FLOAT : gl.UNSIGNED_BYTE, arr);
      return arr;
    };
    if (format === 'png' || want16) return await encodePNG(W, H, want16 ? 16 : 8, readStrip, onProgress);

    const data = readStrip(0, H);
    const c = document.createElement('canvas');
    c.width = W;
    c.height = H;
    c.getContext('2d').putImageData(new ImageData(new Uint8ClampedArray(data.buffer), W, H), 0, 0);
    const blob = await new Promise((res) => c.toBlob(res, format === 'jpeg' ? 'image/jpeg' : 'image/webp', q));
    if (!blob) throw new Error('The browser could not encode an image this large.');
    return blob;
  } finally {
    set.dispose();
    target?.dispose();
    dirty = true;
  }
}

const EXT = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
const FORMAT_LABEL = { png: 'PNG', png16: '16-bit PNG', jpeg: 'JPEG', webp: 'WebP' };

async function exportImage() {
  if (busy) return;
  const e = store.state.export;
  const scale = parseFloat(e.scale);
  const [W, H] = exportSize(scale);
  setBusy(`Rendering ${W} × ${H}…`);
  try {
    await nextFrame();
    const blob = await renderImage({ scale, format: e.format, quality: e.quality, onProgress: setProgress });
    download(blob, `${slug(lookName)}-${W}x${H}-${timestamp()}.${EXT[blob.type] || 'png'}`);
    toast(`Saved ${W} × ${H} ${FORMAT_LABEL[e.format]}`);
    track(`export/${e.format}`, `Export ${FORMAT_LABEL[e.format]}`);
  } catch (err) {
    console.error(err);
    toast(err.message, { type: 'error', duration: 6000 });
  } finally {
    setBusy(false);
  }
}

async function copyToClipboard() {
  if (busy) return;
  const e = store.state.export;
  let scale = parseFloat(e.scale);
  // Keep clipboard images to a sensible size.
  const maxSide = Math.max(store.state.doc.width, store.state.doc.height) * scale;
  if (maxSide > 4096) scale *= 4096 / maxSide;
  setBusy('Copying…');
  try {
    await nextFrame();
    const blob = await renderImage({ scale, format: 'png' });
    await copyImage(blob);
    toast('Copied — paste it into Figma, Photoshop, Slack…');
    track('export/copy', 'Copy image');
  } catch (err) {
    console.error(err);
    toast(err.message || 'Could not copy the image.', { type: 'error', duration: 5000 });
  } finally {
    setBusy(false);
  }
}

async function burst() {
  if (busy) return;
  const s = store.state;
  const e = s.export;
  const n = e.burst;
  const scale = parseFloat(e.scale);
  const [W, H] = exportSize(scale);
  const fluidMode = isFluid();
  const start = s.anim.time;
  const span = s.anim.loop ? s.anim.duration : 8;
  setBusy(`Capturing ${n} frames…`);
  const files = [];
  try {
    await nextFrame();
    for (let i = 0; i < n; i++) {
      if (fluidMode && i > 0) {
        for (let k = 0; k < 40; k++) fluid.step(1 / 60, s.source);
      }
      const time = s.anim.loop ? (start + (i * span) / n) % span : start + (i * span) / n;
      const blob = await renderImage({ scale, format: e.format, quality: e.quality, time });
      files.push({ name: `${slug(lookName)}-${String(i + 1).padStart(2, '0')}.${EXT[blob.type] || 'png'}`, data: blob });
      setProgress((i + 1) / n);
      await nextFrame();
    }
    setBusy('Packing zip…');
    const zip = await makeZip(files);
    download(zip, `${slug(lookName)}-${W}x${H}-burst-${timestamp()}.zip`);
    toast(`Saved ${n} frames`);
    track('export/burst', 'Export burst');
  } catch (err) {
    console.error(err);
    toast(err.message, { type: 'error', duration: 6000 });
  } finally {
    setBusy(false);
  }
}

// ── video recording ─────────────────────────────────────────────────────────
function startRecording() {
  if (busy) return;
  const mime = pickVideoMime();
  if (!mime || !canvas.captureStream) {
    toast('Video recording isn’t supported in this browser.', { type: 'error' });
    return;
  }
  const s = store.state;
  const fps = parseInt(s.anim.fps, 10) || 30;
  let W = s.doc.width, H = s.doc.height;
  const maxSide = 3840;
  if (Math.max(W, H) > maxSide) { const k = maxSide / Math.max(W, H); W *= k; H *= k; }
  if (W * H > 8.3e6) { const k = Math.sqrt(8.3e6 / (W * H)); W *= k; H *= k; }
  W = Math.round(W / 2) * 2;
  H = Math.round(H / 2) * 2;

  const auto = s.anim.loop;
  if (auto) s.anim.time = 0;
  s.anim.playing = true;
  rec = { W, H, fps, mime, chunks: [], elapsed: 0, auto };
  layout();
  renderLive();

  const stream = canvas.captureStream(fps);
  const bitrate = Math.round(Math.min(80e6, Math.max(10e6, W * H * fps * 0.25)));
  let recorder;
  try {
    recorder = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: bitrate });
  } catch (err) {
    rec = null;
    layout();
    toast('Could not start the recorder: ' + err.message, { type: 'error' });
    return;
  }
  const r = rec;
  r.recorder = recorder;
  recorder.ondataavailable = (ev) => { if (ev.data.size) r.chunks.push(ev.data); };
  recorder.onstop = () => {
    const type = mime.split(';')[0];
    const blob = new Blob(r.chunks, { type });
    const ext = type.includes('mp4') ? 'mp4' : 'webm';
    download(blob, `${slug(lookName)}-${W}x${H}-${r.auto ? 'loop' : 'clip'}-${timestamp()}.${ext}`);
    toast(`Saved ${ext.toUpperCase()} video (${W} × ${H})`);
    track('export/video', 'Export video');
  };
  recorder.start(500);
  $('#rec-badge').hidden = false;
  qualitySel.disabled = true;
  queueSync();
  toast(auto ? `Recording one ${s.anim.duration}s loop…` : 'Recording — press Video again to stop');
}

function stopRecording() {
  if (!rec) return;
  const r = rec;
  rec = null;
  try { r.recorder.state !== 'inactive' && r.recorder.stop(); } catch {}
  $('#rec-badge').hidden = true;
  qualitySel.disabled = false;
  layout();
  queueSync();
}

// ── share link ──────────────────────────────────────────────────────────────
// A full-screen link opens just the moving look, filling the screen, with no
// editor: for live wallpaper apps (Lively) and kiosks.
async function share({ wallpaper: wall = false, interactive: mouse = false } = {}) {
  track(wall ? 'share/wallpaper' : 'share', wall ? 'Copy full-screen link' : 'Copy share link');
  const code = await encodeLook(store.look());
  const search = wall ? `?wallpaper${mouse ? '&interactive' : ''}` : '';
  const url = `${location.origin}${location.pathname}${search}#look=${code}`;
  try {
    await navigator.clipboard.writeText(url);
    toast(store.state.source.type === 'image'
      ? 'Link copied — note: your image itself isn’t included in links'
      : wall ? 'Link copied — it shows this look full screen, without the editor'
      : 'Link copied — it opens this exact look');
  } catch {
    if (wall) { prompt('Copy this link:', url); return; }
    history.replaceState(null, '', `#look=${code}`);
    toast('Couldn’t access the clipboard — the link is in the address bar.');
  }
}

// ── keyboard ────────────────────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  if (wallpaper) return;
  const t = e.target;
  const typing = t instanceof HTMLInputElement && !['range', 'checkbox', 'color'].includes(t.type) || t instanceof HTMLSelectElement || t instanceof HTMLTextAreaElement;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
  if (mod && e.key.toLowerCase() === 'y' && !typing) { e.preventDefault(); redo(); return; }
  if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); exportImage(); return; }
  if (typing || mod || e.altKey) return;
  const a = store.state.anim;
  switch (e.key) {
    case ' ': e.preventDefault(); togglePlay(); break;
    case 's': case 'S': exportImage(); break;
    case 'c': case 'C': copyToClipboard(); break;
    case 'r': case 'R': surprise(); break;
    case 'l': case 'L':
      if (app.classList.contains('ui-hidden')) toggleUI();
      setEditing(false);
      presetsPanel.toggle();
      break;
    case 'h': case 'H': toggleUI(); break;
    case 'f': case 'F':
      if (document.fullscreenElement) document.exitFullscreen();
      else stage.requestFullscreen?.();
      break;
    case 'z': case 'Z': toggleFill(); break;
    case '?': $('#help').showModal(); break;
    case '/':
      e.preventDefault();
      if (app.classList.contains('ui-hidden')) toggleUI();
      if (phoneQuery.matches) setEditing(true);
      panel.focusSearch();
      break;
    case 'Escape':
      if ($('#help').open) break;
      if (!similarEl.hidden) { closeSimilar(false); break; }
      if (!sharePop.hidden) { setSharePop(false); shareBtn.focus(); break; }
      if (!helpMenu.hidden) { setMenu(false); helpBtn.focus(); }
      else if (presetsPanel.isOpen()) presetsPanel.close();
      else if (app.classList.contains('editing')) setEditing(false);
      else panel.clearSearch();
      break;
    case 'ArrowLeft':
    case 'ArrowRight': {
      e.preventDefault();
      const step = (e.shiftKey ? 1 : 1 / 30) * (e.key === 'ArrowLeft' ? -1 : 1);
      a.playing = false;
      a.time += step;
      if (a.loop) a.time = ((a.time % a.duration) + a.duration) % a.duration;
      else a.time = Math.max(0, a.time);
      dirty = true;
      break;
    }
    default:
      if (/^[1-9]$/.test(e.key)) {
        const p = PRESETS[+e.key - 1];
        if (p) { actions.applyLook(p.look, p.name); presetsPanel.setActive(p.id); track(`look/${p.id}`, `Look: ${p.name}`); }
      }
  }
});

canvas.addEventListener('webglcontextlost', (e) => {
  e.preventDefault();
  fatal('The GPU context was lost (often after an export that was too large).\nReload the page to continue — your last look is saved.');
});

// ── go ──────────────────────────────────────────────────────────────────────
layout();
queueSync();
raf(tick);

// For the console and tools/render-service.mjs.
window.halation = {
  store, renderer, fluid, caps, renderImage, pickSurprise, recipeWeights, encodeLook,
  showLook: (look) => { store.applyLook(look); sanitize(store.state); },
  perf: () => ({ mode: perfMode, autoTier, tier: tier().label, drs, liveScale, refineK, refineOf: refineFrames(), fps: liveFps }),
};

varyWallpaper();

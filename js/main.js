import { createContext, createTarget } from './gl/gl.js';
import { Renderer, TargetSet } from './renderer.js';
import { Fluid } from './fluid.js';
import { Store, sanitize, encodeLook, decodeLook, migrateLook } from './store.js';
import { DOC_SIZES, LOOK_SECTIONS, defaultState } from './schema.js';
import { PRESETS } from './presets.js';
import { buildPanel } from './ui/panel.js';
import { buildPresetsPanel } from './ui/presets-panel.js';
import { ICONS } from './ui/icons.js';
import { toast } from './ui/controls.js';
import { randomizeSection, randomizeAll } from './randomize.js';
import { encodePNG, makeZip, download, copyImage, pickVideoMime, timestamp, slug } from './export.js';

// Source repository (forks: point this at your own).
const REPO_URL = 'https://github.com/AR13X3/halation';

const $ = (s) => document.querySelector(s);
// ?timer drives the loop with timers instead of rAF (headless capture / hidden tabs).
const raf = new URLSearchParams(location.search).has('timer')
  ? (f) => setTimeout(() => f(performance.now()), 16)
  : (f) => requestAnimationFrame(f);
const app = $('#app');
const canvas = $('#canvas');
const stage = $('#stage');
const frameEl = $('#frame');

function fatal(msg) {
  const el = document.createElement('div');
  el.className = 'fatal';
  el.textContent = msg;
  document.body.append(el);
}

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
let lookName = PRESETS[0].name;
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
  const hash = location.hash.match(/look=([\w-]+)/);
  if (hash) {
    // Drop the hash once loaded so later reloads restore the user's own edits.
    history.replaceState(null, '', location.pathname + location.search);
    try {
      store.applyLook(await decodeLook(hash[1]));
      lookName = 'Shared look';
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
      return;
    }
  } catch {}
  store.applyLook(PRESETS[0].look);
}
await restore();
sanitize(store.state);
store.history = [];
store.index = -1;
store.commit();

let saveTimer = 0;
function saveSession() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem('halation.session', JSON.stringify({
        look: store.look(), doc: store.state.doc, export: store.state.export, name: lookName,
      }));
    } catch {}
  }, 400);
}

// ── layout ──────────────────────────────────────────────────────────────────
function docAspect() { return store.state.doc.width / store.state.doc.height; }
const view = { cssH: 1 };

function layout() {
  const doc = store.state.doc;
  const hidden = app.classList.contains('ui-hidden');
  const r = stage.getBoundingClientRect();
  const padX = hidden ? 0 : 36;
  const padTop = hidden ? 0 : 26;
  const padBottom = hidden ? 0 : 72;
  const availW = Math.max(40, r.width - padX * 2);
  const availH = Math.max(40, r.height - padTop - padBottom);
  const k = Math.min(availW / doc.width, availH / doc.height);
  const cssW = Math.max(1, Math.round(doc.width * k));
  const cssH = Math.max(1, Math.round(doc.height * k));
  frameEl.style.width = cssW + 'px';
  frameEl.style.height = cssH + 'px';
  frameEl.style.top = padTop + availH / 2 + 'px';

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

// ── render loop ─────────────────────────────────────────────────────────────
function isFluid() { return store.state.source.type === 'fluid'; }

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
      lastRender = now;
      dirty = false;
      refineK = 0;
      lastChange = now;
      fpsN++;
    }
  } else if (!rec && refineK < refineFrames() && now - lastChange > 140) {
    renderRefine(refineK);
    refineK++;
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
setIcon('#btn-undo', 'undo').onclick = () => store.undo();
setIcon('#btn-redo', 'redo').onclick = () => store.redo();
setIcon('#btn-surprise', 'dice', 'Surprise me').onclick = () => surprise();
setIcon('#btn-share', 'link', 'Share').onclick = () => share();
setIcon('#btn-help', 'keyboard').onclick = () => $('#help').showModal();
setIcon('#btn-export', 'download', 'Export').onclick = () => exportImage();
setIcon('#btn-hide', 'eye').onclick = () => toggleUI();
setIcon('#btn-loop', 'loop').onclick = () => { store.set('anim.loop', !store.state.anim.loop); store.commit(); };
const githubBtn = setIcon('#btn-github', 'github');
githubBtn.href = REPO_URL;
const playBtn = $('#btn-play');
playBtn.onclick = () => togglePlay();
$('#help [data-close]').innerHTML = ICONS.close;
$('#help [data-close]').onclick = () => $('#help').close();
$('#help').addEventListener('click', (e) => { if (e.target === $('#help')) $('#help').close(); });

const qualitySel = $('#quality');
function syncPerfSelect() {
  qualitySel.querySelector('option[value="auto"]').textContent = `Auto · ${TIERS[autoTier || 'balanced'].label}`;
  qualitySel.value = perfMode;
}
qualitySel.onchange = () => {
  perfMode = qualitySel.value;
  try { localStorage.setItem('halation.perf', perfMode); } catch {}
  drs = tier().maxScale;
  frameEma = 0;
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
    timeEl.textContent = `${a.time.toFixed(1)} / ${a.duration.toFixed(0)}s`;
  } else {
    timeEl.textContent = `${a.time.toFixed(1)}s`;
  }
}

function togglePlay() {
  store.state.anim.playing = !store.state.anim.playing;
  last = performance.now();
  dirty = true;
}

function toggleUI() {
  app.classList.toggle('ui-hidden');
  layout();
}

const actions = {
  randomizeSection(id) {
    randomizeSection(store.state, id);
    afterBulkChange('Remix');
  },
  resetSection(id) {
    // Reset the section's settings but keep its type and the palette.
    const d = defaultState();
    const cur = store.state[id];
    store.state[id] = { ...d[id] };
    if ('type' in cur) store.state[id].type = cur.type;
    if (id === 'color') store.state.color.stops = cur.stops;
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
    lookName = name;
    if (isFluid()) fluid.reset();
  },
  thumbnail: (look) => thumbnail(look),
  download: (blob, name) => download(blob, name),
};

function afterBulkChange(name) {
  sanitize(store.state);
  if (name) lookName = name;
  store.emit('*');
  store.commit();
}

function surprise() {
  randomizeAll(store.state);
  afterBulkChange('Surprise');
}

const panel = buildPanel($('#panel'), store, actions);
const presetsPanel = buildPresetsPanel($('#presets'), store, actions);

let syncQueued = false;
function queueSync() {
  if (syncQueued) return;
  syncQueued = true;
  raf(() => {
    syncQueued = false;
    panel.sync();
    $('#btn-undo').disabled = !store.canUndo();
    $('#btn-redo').disabled = !store.canRedo();
  });
}

store.on((path) => {
  dirty = true;
  if (path === 'doc.size') {
    const d = DOC_SIZES.find((x) => x.value === store.state.doc.size);
    if (d && d.w) { store.state.doc.width = d.w; store.state.doc.height = d.h; }
  }
  if (path === '*' || path.startsWith('doc')) layout();
  if (!applyingLook && path !== 'doc.size' && !path.startsWith('doc') && !path.startsWith('export')) presetsPanel.clearActive();
  queueSync();
  saveSession();
});

// Highlight the restored preset if it matches.
const match = PRESETS.find((p) => p.name === lookName);
if (match) presetsPanel.setActive(match.id);

// ── canvas interaction: pan / zoom / paint ──────────────────────────────────
let drag = null;
canvas.addEventListener('pointerdown', (e) => {
  if (e.button !== 0) return;
  canvas.setPointerCapture(e.pointerId);
  const s = store.state.source;
  drag = { x: e.clientX, y: e.clientY, lx: e.clientX, ly: e.clientY, ox: s.offsetX, oy: s.offsetY, rect: canvas.getBoundingClientRect(), moved: false };
  canvas.classList.toggle('grabbing', !isFluid());
});
canvas.addEventListener('pointermove', (e) => {
  if (!drag) return;
  const { rect } = drag;
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
canvas.addEventListener('pointercancel', endDrag);

let wheelTimer = 0;
canvas.addEventListener('wheel', (e) => {
  if (isFluid()) return;
  e.preventDefault();
  const s = store.state.source;
  const k = Math.exp(-e.deltaY * 0.0015);
  store.set('source.scale', +Math.min(4, Math.max(0.15, s.scale * k)).toFixed(3));
  clearTimeout(wheelTimer);
  wheelTimer = setTimeout(() => store.commit(), 300);
}, { passive: false });

canvas.addEventListener('dblclick', () => {
  if (isFluid()) return;
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
async function share() {
  const code = await encodeLook(store.look());
  const url = `${location.origin}${location.pathname}#look=${code}`;
  try {
    await navigator.clipboard.writeText(url);
    toast(store.state.source.type === 'image'
      ? 'Link copied — note: your image itself isn’t included in links'
      : 'Link copied — it opens this exact look');
  } catch {
    history.replaceState(null, '', `#look=${code}`);
    toast('Couldn’t access the clipboard — the link is in the address bar.');
  }
}

// ── keyboard ────────────────────────────────────────────────────────────────
window.addEventListener('keydown', (e) => {
  const t = e.target;
  const typing = t instanceof HTMLInputElement && !['range', 'checkbox', 'color'].includes(t.type) || t instanceof HTMLSelectElement || t instanceof HTMLTextAreaElement;
  const mod = e.ctrlKey || e.metaKey;
  if (mod && e.key.toLowerCase() === 'z' && !typing) { e.preventDefault(); e.shiftKey ? store.redo() : store.undo(); return; }
  if (mod && e.key.toLowerCase() === 'y' && !typing) { e.preventDefault(); store.redo(); return; }
  if (mod && e.key.toLowerCase() === 's') { e.preventDefault(); exportImage(); return; }
  if (typing || mod || e.altKey) return;
  const a = store.state.anim;
  switch (e.key) {
    case ' ': e.preventDefault(); togglePlay(); break;
    case 's': case 'S': exportImage(); break;
    case 'c': case 'C': copyToClipboard(); break;
    case 'r': case 'R': surprise(); break;
    case 'h': case 'H': toggleUI(); break;
    case 'f': case 'F':
      if (document.fullscreenElement) document.exitFullscreen();
      else stage.requestFullscreen?.();
      break;
    case '?': $('#help').showModal(); break;
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
        if (p) { actions.applyLook(p.look, p.name); presetsPanel.setActive(p.id); }
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

// Handy for debugging from the console.
window.halation = {
  store, renderer, fluid, caps, renderImage,
  perf: () => ({ mode: perfMode, autoTier, tier: tier().label, drs, liveScale, refineK, refineOf: refineFrames(), fps: liveFps }),
};

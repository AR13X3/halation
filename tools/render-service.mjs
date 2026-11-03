// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 AR13X3 — Halation (https://github.com/AR13X3/halation)
// Zero-dependency render service: runs Halation in headless Chromium and answers
// HTTP requests with finished images. See docs/RENDER-SERVICE.md.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { randomBytes } from 'node:crypto';
import { existsSync, mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { readFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const HOST = process.env.HOST || '127.0.0.1';
const PORT = Number(process.env.PORT || 8787);
const CHROME = process.env.HALATION_CHROME;
const CHROME_ARGS = (process.env.HALATION_CHROME_ARGS || '').split(/\s+/).filter(Boolean);
const KEEP = Number(process.env.HALATION_KEEP || 20);
const APP_URL = 'https://ar13x3.github.io/halation/';
const JOB_TIMEOUT = 180e3;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.webp': 'image/webp',
};
const FORMATS = { jpeg: 'jpg', png: 'png', webp: 'webp' };

if (!CHROME) {
  console.error('Set HALATION_CHROME to the path of a Chromium or Chrome binary.');
  process.exit(1);
}

// ── finished images, newest last ────────────────────────────────────────────
const images = new Map();
function keepImage(name, body) {
  images.set(name, body);
  while (images.size > KEEP) images.delete(images.keys().next().value);
}

const readBody = async (req, limit) => {
  const chunks = [];
  let size = 0;
  for await (const c of req) {
    size += c.length;
    if (size > limit) throw Object.assign(new Error('Request too large'), { status: 413 });
    chunks.push(c);
  }
  return Buffer.concat(chunks);
};

// ── the app, for the browser only ───────────────────────────────────────────
const appServer = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'POST' && url.pathname.startsWith('/__upload/')) {
      keepImage(url.pathname.slice(10), await readBody(req, 200e6));
      res.writeHead(204).end();
      return;
    }
    let path = normalize(join(root, decodeURIComponent(url.pathname)));
    if (path !== root && !path.startsWith(root + sep)) { res.writeHead(403).end(); return; }
    if ((await stat(path).catch(() => null))?.isDirectory()) path = join(path, 'index.html');
    const body = await readFile(path);
    res.writeHead(200, { 'Content-Type': TYPES[extname(path).toLowerCase()] || 'application/octet-stream' });
    res.end(body);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => appServer.listen(0, '127.0.0.1', r));

// ── the browser ─────────────────────────────────────────────────────────────
const profile = mkdtempSync(join(tmpdir(), 'halation-render-'));
const browser = spawn(CHROME, ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--window-size=1280,800', '--no-first-run', ...CHROME_ARGS, 'about:blank'], { stdio: 'ignore' });
const quit = (code) => {
  browser.kill();
  try { rmSync(profile, { recursive: true, force: true, maxRetries: 3 }); } catch { /* the browser may still hold it */ }
  process.exit(code);
};
browser.on('exit', () => { console.error('The browser exited.'); quit(1); });
process.on('SIGTERM', () => quit(0));
process.on('SIGINT', () => quit(0));

const portFile = join(profile, 'DevToolsActivePort');
for (let i = 0; i < 150 && !existsSync(portFile); i++) await new Promise((r) => setTimeout(r, 200));
if (!existsSync(portFile)) { console.error('The browser did not start.'); quit(1); }
const cdpPort = readFileSync(portFile, 'utf8').split('\n')[0].trim();
const targets = await (await fetch(`http://127.0.0.1:${cdpPort}/json/list`)).json();
const ws = new WebSocket(targets.find((t) => t.type === 'page').webSocketDebuggerUrl);
await new Promise((r) => { ws.onopen = r; });

let lastId = 0;
const pending = new Map();
ws.onmessage = (e) => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); }
};
ws.onclose = () => { console.error('Lost the browser connection.'); quit(1); };
const send = (method, params = {}) => new Promise((r) => {
  const id = ++lastId;
  pending.set(id, r);
  ws.send(JSON.stringify({ id, method, params }));
});

async function evaluate(expression) {
  const timer = setTimeout(() => { console.error('A render timed out.'); quit(1); }, JOB_TIMEOUT);
  const m = await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  clearTimeout(timer);
  const failure = m.error?.message || m.result?.exceptionDetails?.exception?.description || m.result?.exceptionDetails?.text;
  if (failure) throw new Error(failure);
  return m.result.result.value;
}

await send('Page.enable');
await send('Runtime.enable');
await send('Page.navigate', { url: `http://127.0.0.1:${appServer.address().port}/?timer` });

// Runs in the page. Results come back through CDP; images go through /__upload,
// because a large image in a CDP reply can stall it.
const inPage = () => {
  window.__render = async ({ name, look, width, height, time, format, quality, candidates, weights, minScore }) => {
    const h = window.halation, s = h.store.state;
    s.anim.playing = false;
    s.doc.width = width;
    s.doc.height = height;
    s.anim.time = time ?? Math.random() * (s.anim.duration || 10);
    let picked = null;
    if (!look) {
      // A low score tries another direction rather than settling.
      for (let i = 0; i < 5; i++) {
        const c = h.pickSurprise({ candidates, weights });
        if (!picked || c.score > picked.score) picked = c;
        if (minScore == null || picked.score >= minScore) break;
      }
      look = picked.look;
    }
    h.showLook(look);
    const blob = await h.renderImage({ scale: 1, format, quality, time: s.anim.time });
    await fetch(`/__upload/${name}`, { method: 'POST', body: blob });
    const full = h.store.look();
    return { recipe: picked?.recipe ?? null, score: picked?.score ?? null, time: s.anim.time, look: full, link: await h.encodeLook(full), bytes: blob.size };
  };
};

await evaluate(`(async () => {
  while (!window.halation) await new Promise((r) => setTimeout(r, 100));
  (${inPage})();
})()`);
const info = await evaluate(`(() => {
  const gl = document.createElement('canvas').getContext('webgl2');
  const d = gl?.getExtension('WEBGL_debug_renderer_info');
  return { renderer: d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : null, recipes: window.halation.recipeWeights() };
})()`);
const software = /swiftshader|llvmpipe/i.test(info.renderer || '');
console.log(`Rendering on ${info.renderer}`);

// ── the API ─────────────────────────────────────────────────────────────────
const ALPHABET = 'ABCDEFGHJKMNPQRSTVWXYZ23456789';
const newCode = () => Array.from(randomBytes(10), (b) => ALPHABET[b % ALPHABET.length]).join('');

const size = (v, def) => {
  const n = v === undefined ? def : Number(v);
  if (!Number.isInteger(n) || n < 64 || n > 8192) throw Object.assign(new Error('width and height must be whole numbers from 64 to 8192'), { status: 400 });
  return n;
};

function featuresOf(look) {
  const material = ['chrome', 'liquid', 'iridescence', 'relief'].find((k) => look.surface?.[k] > 0) || 'none';
  return {
    flow: look.source?.type, form: look.source?.form ?? 'none', glass: look.glass?.type ?? 'none',
    screen: look.screen?.type ?? 'none', material, objects: look.objects?.count ?? 0,
  };
}

// One page renders one job at a time.
let queue = Promise.resolve();
const enqueue = (job) => {
  const run = queue.then(job, job);
  queue = run.catch(() => {});
  return run;
};

async function render(body) {
  const format = body.format ?? 'jpeg';
  if (!FORMATS[format]) throw Object.assign(new Error('format must be jpeg, png or webp'), { status: 400 });
  const code = newCode();
  const image = `${code}.${FORMATS[format]}`;
  const args = {
    name: image, look: body.look, width: size(body.width, 1000), height: size(body.height, 1500),
    time: body.time, format, quality: body.quality ?? 0.93,
    candidates: Math.min(64, Math.max(1, Number(body.candidates ?? 24))), weights: body.weights, minScore: body.minScore,
  };
  const r = await enqueue(() => evaluate(`window.__render(${JSON.stringify(args)})`));
  return {
    code, recipe: r.recipe, score: r.score, time: r.time, width: args.width, height: args.height, bytes: r.bytes,
    features: featuresOf(r.look), look: r.look, shareUrl: `${APP_URL}#look=${r.link}`, image: `/images/${image}`,
  };
}

const json = (res, status, value) => {
  res.writeHead(status, { 'Content-Type': TYPES['.json'] });
  res.end(JSON.stringify(value));
};

createServer(async (req, res) => {
  try {
    const url = new URL(req.url, 'http://localhost');
    if (req.method === 'GET' && url.pathname === '/health') {
      json(res, 200, { ok: true, renderer: info.renderer, software, recipes: info.recipes });
    } else if (req.method === 'GET' && url.pathname.startsWith('/images/')) {
      const body = images.get(url.pathname.slice(8));
      if (!body) { json(res, 404, { error: 'Image not found or no longer kept' }); return; }
      res.writeHead(200, { 'Content-Type': TYPES[extname(url.pathname)] || 'application/octet-stream', 'Content-Length': body.length });
      res.end(body);
    } else if (req.method === 'POST' && (url.pathname === '/surprise' || url.pathname === '/render')) {
      const raw = await readBody(req, 1e6);
      let body;
      try { body = JSON.parse(raw.toString() || '{}'); } catch { json(res, 400, { error: 'Send a JSON body' }); return; }
      if (url.pathname === '/render' && !body.look) { json(res, 400, { error: 'look is required' }); return; }
      if (url.pathname === '/surprise') delete body.look;
      json(res, 200, await render(body));
    } else {
      json(res, 404, { error: 'Not found' });
    }
  } catch (err) {
    json(res, err.status || 500, { error: err.message });
  }
}).listen(PORT, HOST, () => {
  console.log(`Halation render service at http://${HOST}:${PORT}`);
});

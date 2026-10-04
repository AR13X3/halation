// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 AR13X3 — Halation (https://github.com/AR13X3/halation)
// Central app state with change notifications, undo/redo and share-link encoding.

import { defaultState, getPath, setPath, LOOK_SECTIONS, PARAMS } from './schema.js';

export class Store {
  constructor() {
    this.state = defaultState();
    this.listeners = new Set();
    this.history = [];
    this.index = -1;
    this.commit();
  }

  get(path) { return getPath(this.state, path); }

  set(path, value) {
    if (getPath(this.state, path) === value) return;
    setPath(this.state, path, value);
    this.emit(path);
  }

  on(fn) { this.listeners.add(fn); return () => this.listeners.delete(fn); }
  emit(path) { for (const fn of this.listeners) fn(path); }

  // The parts of the state that define a "look" (what presets/history/links save).
  look() {
    const out = {};
    for (const k of LOOK_SECTIONS) out[k] = structuredClone(this.state[k]);
    delete out.anim.time;
    delete out.anim.playing;
    return out;
  }

  // Apply a (possibly partial) look on top of defaults.
  applyLook(look) {
    look = migrateLook(look);
    const time = this.state.anim?.time ?? 0;
    const playing = this.state.anim?.playing ?? true;
    const d = defaultState();
    for (const k of LOOK_SECTIONS) {
      this.state[k] = { ...d[k], ...structuredClone(look?.[k] || {}) };
    }
    this.state.anim.time = time;
    this.state.anim.playing = playing;
    sanitize(this.state);
    this.emit('*');
  }

  commit() {
    const snap = JSON.stringify(this.look());
    if (this.history[this.index] === snap) return;
    this.history = this.history.slice(0, this.index + 1);
    this.history.push(snap);
    if (this.history.length > 120) this.history.shift();
    this.index = this.history.length - 1;
  }

  canUndo() { return this.index > 0; }
  canRedo() { return this.index < this.history.length - 1; }

  undo() {
    if (!this.canUndo()) return;
    this.index--;
    this.restore();
  }

  redo() {
    if (!this.canRedo()) return;
    this.index++;
    this.restore();
  }

  restore() {
    this.applyLook(JSON.parse(this.history[this.index]));
  }
}

// Upgrade looks saved by older versions (presets, share links, sessions).
export function migrateLook(look) {
  if (!look || typeof look !== 'object') return look;
  look = structuredClone(look);
  // v1 kept the light angle in the color section.
  if (look.color && 'light' in look.color) {
    look.light = { angle: look.color.light, ...(look.light || {}) };
    delete look.color.light;
  }
  return look;
}

// Clamp numbers into range and drop unknown option values (protects against
// stale presets and hand-edited share links).
export function sanitize(state) {
  for (const p of PARAMS) {
    const v = getPath(state, p.key);
    if (p.type === 'range' || p.type === 'int' || p.type === 'seed') {
      let n = Number(v);
      if (!Number.isFinite(n)) n = p.def;
      if (p.key.startsWith('doc.')) continue;
      n = Math.min(p.max, Math.max(p.min, n));
      setPath(state, p.key, p.type === 'range' ? n : Math.round(n));
    } else if (p.type === 'select' || p.type === 'chips') {
      if (!p.options.some((o) => o.value === v)) setPath(state, p.key, p.def);
    } else if (p.type === 'toggle') {
      setPath(state, p.key, !!v);
    } else if (p.type === 'color') {
      if (typeof v !== 'string' || !/^#[0-9a-f]{6}$/i.test(v)) setPath(state, p.key, p.def);
    }
  }
  const stops = state.color.stops;
  if (!Array.isArray(stops) || stops.length < 2) state.color.stops = defaultState().color.stops;
  else {
    state.color.stops = stops
      .filter((s) => s && typeof s.color === 'string' && /^#[0-9a-f]{6}$/i.test(s.color))
      .map((s) => ({ pos: Math.min(1, Math.max(0, Number(s.pos) || 0)), color: s.color.toLowerCase() }));
    if (state.color.stops.length < 2) state.color.stops = defaultState().color.stops;
  }
}

// ── share links ─────────────────────────────────────────────────────────────
// Only values that differ from defaults are stored, then deflated + base64url.
export function diffFromDefaults(look) {
  const d = defaultState();
  const out = {};
  for (const k of Object.keys(look)) {
    for (const [key, val] of Object.entries(look[k])) {
      if (JSON.stringify(val) !== JSON.stringify(d[k]?.[key])) (out[k] ??= {})[key] = val;
    }
  }
  return out;
}

export async function encodeLook(look) {
  const json = JSON.stringify(diffFromDefaults(look));
  const bytes = new TextEncoder().encode(json);
  if ('CompressionStream' in window) {
    const stream = new Blob([bytes]).stream().pipeThrough(new CompressionStream('deflate-raw'));
    const buf = new Uint8Array(await new Response(stream).arrayBuffer());
    return 'z' + toB64(buf);
  }
  return 'j' + toB64(bytes);
}

export async function decodeLook(str) {
  const kind = str[0];
  const bytes = fromB64(str.slice(1));
  let json;
  if (kind === 'z') {
    const stream = new Blob([bytes]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
    json = await new Response(stream).text();
  } else {
    json = new TextDecoder().decode(bytes);
  }
  return JSON.parse(json);
}

function toB64(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function fromB64(str) {
  const s = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}

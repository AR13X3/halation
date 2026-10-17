// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 AR13X3 — Halation (https://github.com/AR13X3/halation)
// Anonymous usage counts with GoatCounter (https://www.goatcounter.com): no
// cookies and nothing personal, only visits and a few named actions such as
// "exported a PNG". It runs on the official site only, so local copies and
// forks send nothing, and it stays off when the browser asks not to be
// tracked (Do Not Track or Global Privacy Control).

// Forks: point SITE at your own GoatCounter site and HOSTS at your domain.
const SITE = 'https://halation.goatcounter.com/count';
const HOSTS = ['ar13x3.github.io'];

const enabled = HOSTS.includes(location.hostname)
  && navigator.doNotTrack !== '1'
  && navigator.globalPrivacyControl !== true;
const queue = [];
const recent = new Map();

if (enabled) {
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://gc.zgo.at/count.js';
  script.dataset.goatcounter = SITE;
  script.addEventListener('load', () => { for (const e of queue.splice(0)) send(e); });
  document.head.append(script);
}

function send(e) {
  try { window.goatcounter?.count?.(e); } catch {}
}

/**
 * Counts a named action, such as 'export/png'. Repeats of the same action
 * within a few seconds count once, so a burst of Surprise me presses or
 * look clicks doesn't flood the stats.
 */
export function track(name, title = name) {
  if (!enabled) return;
  const now = Date.now();
  if (now - (recent.get(name) || 0) < 3000) return;
  recent.set(name, now);
  const e = { path: name, title, event: true };
  if (window.goatcounter?.count) send(e);
  else queue.push(e);
}

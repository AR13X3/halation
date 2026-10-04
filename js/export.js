// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 AR13X3 — Halation (https://github.com/AR13X3/halation)
// Encoders and file helpers. No dependencies: PNG is written by hand (so we can
// do 16-bit, which browsers' canvas.toBlob can't), deflate comes from the
// browser's native CompressionStream.

// ── CRC32 ───────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(bytes, crc = 0) {
  let c = crc ^ 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = CRC_TABLE[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

// ── PNG ─────────────────────────────────────────────────────────────────────
function chunk(type, data) {
  const out = new Uint8Array(12 + data.length);
  const dv = new DataView(out.buffer);
  dv.setUint32(0, data.length);
  for (let i = 0; i < 4; i++) out[4 + i] = type.charCodeAt(i);
  out.set(data, 8);
  dv.setUint32(8 + data.length, crc32(out.subarray(4, 8 + data.length)));
  return out;
}

/**
 * Streams a PNG (RGB, 8 or 16 bit) without ever holding the raw image in memory.
 * readStrip(y0, rows) must resolve to RGBA data for image rows y0..y0+rows (top-down):
 *   Uint8Array for 8-bit, Float32Array (0..1) for 16-bit.
 */
export async function encodePNG(width, height, bitDepth, readStrip, onProgress) {
  const bpp = bitDepth === 16 ? 6 : 3;
  const rowLen = width * bpp;
  const stripRows = Math.max(1, Math.min(height, Math.floor((8 << 20) / (width * 16))));

  const cs = new CompressionStream('deflate');
  const writer = cs.writable.getWriter();
  const compressed = new Response(cs.readable).arrayBuffer();

  let prev = new Uint8Array(rowLen);
  let cur = new Uint8Array(rowLen);
  for (let y0 = 0; y0 < height; y0 += stripRows) {
    const rows = Math.min(stripRows, height - y0);
    const src = await readStrip(y0, rows);
    const out = new Uint8Array(rows * (rowLen + 1));
    for (let r = 0; r < rows; r++) {
      // unpack RGBA → RGB(16)
      const base = r * width * 4;
      if (bitDepth === 16) {
        for (let x = 0, o = 0; x < width; x++) {
          for (let c = 0; c < 3; c++, o += 2) {
            let v = src[base + x * 4 + c];
            v = Math.round(Math.min(1, Math.max(0, v)) * 65535);
            cur[o] = v >> 8;
            cur[o + 1] = v & 255;
          }
        }
      } else {
        for (let x = 0, o = 0; x < width; x++, o += 3) {
          const i = base + x * 4;
          cur[o] = src[i];
          cur[o + 1] = src[i + 1];
          cur[o + 2] = src[i + 2];
        }
      }
      // Paeth filter
      const ro = r * (rowLen + 1);
      out[ro] = 4;
      const first = y0 + r === 0;
      for (let i = 0; i < rowLen; i++) {
        const a = i >= bpp ? cur[i - bpp] : 0;
        const b = first ? 0 : prev[i];
        const c = i >= bpp && !first ? prev[i - bpp] : 0;
        const p = a + b - c;
        const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
        const pred = pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
        out[ro + 1 + i] = (cur[i] - pred) & 255;
      }
      const t = prev; prev = cur; cur = t;
    }
    await writer.write(out);
    onProgress?.((y0 + rows) / height);
  }
  await writer.close();
  const idat = new Uint8Array(await compressed);

  const ihdr = new Uint8Array(13);
  const dv = new DataView(ihdr.buffer);
  dv.setUint32(0, width);
  dv.setUint32(4, height);
  ihdr[8] = bitDepth;
  ihdr[9] = 2; // truecolor RGB
  const sig = new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]);
  const srgb = chunk('sRGB', new Uint8Array([0]));
  return new Blob([sig, chunk('IHDR', ihdr), srgb, chunk('IDAT', idat), chunk('IEND', new Uint8Array(0))], { type: 'image/png' });
}

// ── ZIP (store only — PNGs are already compressed) ──────────────────────────
export async function makeZip(files) {
  const parts = [];
  const central = [];
  let offset = 0;
  const now = new Date();
  const dosTime = (now.getHours() << 11) | (now.getMinutes() << 5) | (now.getSeconds() >> 1);
  const dosDate = ((now.getFullYear() - 1980) << 9) | ((now.getMonth() + 1) << 5) | now.getDate();
  const enc = new TextEncoder();

  for (const f of files) {
    const data = f.data instanceof Blob ? new Uint8Array(await f.data.arrayBuffer()) : f.data;
    const name = enc.encode(f.name);
    const crc = crc32(data);
    const lh = new Uint8Array(30 + name.length);
    const l = new DataView(lh.buffer);
    l.setUint32(0, 0x04034b50, true);
    l.setUint16(4, 20, true);
    l.setUint16(6, 0x0800, true);
    l.setUint16(8, 0, true);
    l.setUint16(10, dosTime, true);
    l.setUint16(12, dosDate, true);
    l.setUint32(14, crc, true);
    l.setUint32(18, data.length, true);
    l.setUint32(22, data.length, true);
    l.setUint16(26, name.length, true);
    l.setUint16(28, 0, true);
    lh.set(name, 30);

    const ch = new Uint8Array(46 + name.length);
    const c = new DataView(ch.buffer);
    c.setUint32(0, 0x02014b50, true);
    c.setUint16(4, 20, true);
    c.setUint16(6, 20, true);
    c.setUint16(8, 0x0800, true);
    c.setUint16(10, 0, true);
    c.setUint16(12, dosTime, true);
    c.setUint16(14, dosDate, true);
    c.setUint32(16, crc, true);
    c.setUint32(20, data.length, true);
    c.setUint32(24, data.length, true);
    c.setUint16(28, name.length, true);
    c.setUint32(42, offset, true);
    ch.set(name, 46);

    parts.push(lh, data);
    central.push(ch);
    offset += lh.length + data.length;
  }

  const cdSize = central.reduce((n, c) => n + c.length, 0);
  const end = new Uint8Array(22);
  const e = new DataView(end.buffer);
  e.setUint32(0, 0x06054b50, true);
  e.setUint16(8, files.length, true);
  e.setUint16(10, files.length, true);
  e.setUint32(12, cdSize, true);
  e.setUint32(16, offset, true);
  return new Blob([...parts, ...central, end], { type: 'application/zip' });
}

// ── helpers ─────────────────────────────────────────────────────────────────
export function download(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export async function copyImage(blob) {
  if (!navigator.clipboard || !window.ClipboardItem) throw new Error('Clipboard images are not supported in this browser.');
  await navigator.clipboard.write([new ClipboardItem({ [blob.type]: blob })]);
}

export function pickVideoMime() {
  if (!window.MediaRecorder) return null;
  const candidates = [
    'video/mp4;codecs=avc1.640033',
    'video/mp4;codecs=avc1',
    'video/mp4',
    'video/webm;codecs=vp9',
    'video/webm;codecs=vp8',
    'video/webm',
  ];
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) || null;
}

export function timestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`;
}

export function slug(s) {
  return String(s || 'halation').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'halation';
}

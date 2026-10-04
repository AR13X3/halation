// Gradient palettes: OKLab interpolation, a curated library and a generator.

export const PALETTE_SIZE = 512;

// ── color conversion ─────────────────────────────────────────────────────────
export function hexToRgb(hex) {
  let h = hex.replace('#', '').trim();
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
}

export function rgbToHex([r, g, b]) {
  const c = (v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0');
  return '#' + c(r) + c(g) + c(b);
}

const toLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const toSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

export function rgbToOklab([r, g, b]) {
  r = toLinear(r); g = toLinear(g); b = toLinear(b);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

export function oklabToRgb([L, a, b]) {
  const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
  const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
  const s = Math.pow(L - 0.0894841775 * a - 1.291485548 * b, 3);
  return [
    toSrgb(4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s),
    toSrgb(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s),
    toSrgb(-0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s),
  ];
}

export function oklchToHex(L, C, H) {
  // Reduce chroma until the color fits in sRGB.
  for (let c = C; c >= 0; c -= 0.005) {
    const h = (H * Math.PI) / 180;
    const rgb = oklabToRgb([L, c * Math.cos(h), c * Math.sin(h)]);
    if (rgb.every((v) => v >= -0.001 && v <= 1.001)) return rgbToHex(rgb);
  }
  return rgbToHex(oklabToRgb([L, 0, 0]));
}

// ── gradient sampling ────────────────────────────────────────────────────────
export function sortStops(stops) {
  return [...stops].sort((a, b) => a.pos - b.pos);
}

export function sampleGradient(stops, t) {
  const s = sortStops(stops);
  if (t <= s[0].pos) return hexToRgb(s[0].color);
  if (t >= s[s.length - 1].pos) return hexToRgb(s[s.length - 1].color);
  for (let i = 0; i < s.length - 1; i++) {
    const a = s[i], b = s[i + 1];
    if (t >= a.pos && t <= b.pos) {
      const k = b.pos - a.pos < 1e-6 ? 0 : (t - a.pos) / (b.pos - a.pos);
      const la = rgbToOklab(hexToRgb(a.color));
      const lb = rgbToOklab(hexToRgb(b.color));
      return oklabToRgb([la[0] + (lb[0] - la[0]) * k, la[1] + (lb[1] - la[1]) * k, la[2] + (lb[2] - la[2]) * k]);
    }
  }
  return hexToRgb(s[s.length - 1].color);
}

export function buildPaletteData(stops) {
  const data = new Float32Array(PALETTE_SIZE * 4);
  for (let i = 0; i < PALETTE_SIZE; i++) {
    const [r, g, b] = sampleGradient(stops, i / (PALETTE_SIZE - 1));
    data[i * 4] = Math.min(1, Math.max(0, r));
    data[i * 4 + 1] = Math.min(1, Math.max(0, g));
    data[i * 4 + 2] = Math.min(1, Math.max(0, b));
    data[i * 4 + 3] = 1;
  }
  return data;
}

export function gradientCss(stops, angle = 90) {
  const s = sortStops(stops);
  // Approximate the OKLab ramp with extra CSS stops so previews match the render.
  const parts = [];
  const n = 24;
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    parts.push(`${rgbToHex(sampleGradient(s, t))} ${(t * 100).toFixed(1)}%`);
  }
  return `linear-gradient(${angle}deg, ${parts.join(', ')})`;
}

// ── library ──────────────────────────────────────────────────────────────────
const P = (name, ...colors) => ({
  name,
  stops: colors.map((c, i) => ({ pos: +(i / (colors.length - 1)).toFixed(3), color: c })),
});

export const PALETTES = [
  P('Coral', '#1b0f2e', '#7a2e5c', '#ff7a59', '#ffd8b0'),
  P('Plum', '#14060f', '#5a1640', '#c94f7c', '#f7d6c4'),
  P('Lava', '#050101', '#4a0a07', '#d12d0f', '#ffb02e'),
  P('Amber', '#000000', '#2a1300', '#ff9a1f', '#ffe0a3'),
  P('Lilac', '#2b1a4a', '#7d5fc4', '#c9b6f2', '#fbf7ff'),
  P('Dune', '#3d2414', '#a8683a', '#e8c08a', '#fff3dc'),
  P('Lagoon', '#011a1f', '#05515c', '#2ec4b6', '#e8fffb'),
  P('Rose Metal', '#1a0c0c', '#6e3a35', '#d99a8a', '#fff0ea'),
  P('Amethyst', '#0e0418', '#4a1a7a', '#b46cf0', '#f6e9ff'),
  P('Cyber', '#03030a', '#1d0a3a', '#ff2e88', '#38e8ff'),
  P('Peach', '#0d0612', '#5a2340', '#ff9e7a', '#fff4e8'),
  P('Teal & Tang', '#04222a', '#0f6b70', '#f29b55', '#fff1d6'),
  P('Copper', '#120804', '#5c2a12', '#d9783a', '#ffd9b0'),
  P('Dusk', '#1b1035', '#3f3a9c', '#ff8fab', '#ffe6c9'),
  P('Slate', '#1e2433', '#55607a', '#d9a5a0', '#f7efe9'),
  P('Pearl', '#6f63a8', '#8fc8e0', '#f2b8d4', '#fffaf0'),
  P('Synth', '#0a0014', '#5b0f8a', '#ff3fa4', '#ffd23f'),
  P('Terracotta', '#2a120b', '#a0452a', '#e79a6c', '#f8e6d2'),
  P('Saffron', '#0a0a24', '#2b1f6e', '#e0821b', '#ffe7a8'),
  P('Graphite', '#08090b', '#3a3d44', '#9aa0aa', '#f4f5f7'),
  P('Forest', '#06120b', '#1c3b26', '#5a8f5e', '#e1edc5'),
  P('Glacier', '#e9f4ff', '#a6c8ff', '#3e6fd8', '#0b1b3f'),
  P('Gold', '#0c0802', '#4d3608', '#c99a2e', '#fbe7a6'),
  P('Candy', '#ff9ec7', '#ffd6a5', '#bde0fe', '#a0c4ff'),
];

// ── generator ────────────────────────────────────────────────────────────────
const rand = (a, b) => a + Math.random() * (b - a);
const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

export function randomPalette() {
  const H = rand(0, 360);
  const scheme = pick(['mono', 'analogous', 'complement', 'split', 'duo']);
  const n = pick([3, 4, 4, 5]);
  const darkStart = Math.random() < 0.8; // backgrounds usually want a dark end
  const stops = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    let L = darkStart ? 0.12 + t * 0.84 : 0.97 - t * 0.6;
    L += rand(-0.03, 0.03);
    let hue = H;
    let C = 0.04 + Math.sin(t * Math.PI) * rand(0.1, 0.19);
    switch (scheme) {
      case 'mono': hue = H + t * rand(-15, 15); break;
      case 'analogous': hue = H + t * rand(40, 90); break;
      case 'complement': hue = t < 0.5 ? H : H + 180; break;
      case 'split': hue = H + (t < 0.34 ? 0 : t < 0.67 ? 150 : 210); break;
      case 'duo': hue = H + t * 120; C += 0.03; break;
    }
    if (darkStart && i === 0) C = Math.min(C, 0.06);
    if (i === n - 1) C *= 0.6;
    stops.push({ pos: +t.toFixed(3), color: oklchToHex(Math.min(0.99, Math.max(0.02, L)), C, ((hue % 360) + 360) % 360) });
  }
  return stops;
}

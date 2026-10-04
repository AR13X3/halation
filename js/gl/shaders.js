// GLSL for the main pipeline:  field → (blur) → glass → screen → (bloom) → final
//
// Coordinates: `p` is in "height units" — the canvas spans p.y ∈ [-0.5, 0.5] and
// p.x ∈ [-aspect/2, aspect/2]. Everything is defined in these units so the
// preview and a 4× export look identical, just sharper.

export const VERT = /* glsl */ `#version 300 es
layout(location = 0) in vec2 a_pos;
out vec2 v_uv;
void main() {
  v_uv = a_pos * 0.5 + 0.5;
  gl_Position = vec4(a_pos, 0.0, 1.0);
}`;

const HEADER = /* glsl */ `#version 300 es
precision highp float;
precision highp int;
in vec2 v_uv;
out vec4 fragColor;

uniform vec2 u_res;       // size of the target being rendered, in px
uniform float u_aspect;   // document width / height
uniform float u_pxScale;  // u_res.y / 1080 — keeps pixel-sized things consistent
uniform float u_time;     // seconds
uniform float u_phase;    // loop angle (radians); integer multiples loop seamlessly
uniform vec2 u_W;         // position on the noise "time circle"
uniform float u_source_seed;
// Always 0. Added to loop bounds so they are not compile-time constants:
// Direct3D's shader compiler (used by browsers on Windows) otherwise unrolls
// and inlines every loop, which can make a shader take many seconds to compile.
uniform int u_zero;

#define PI 3.14159265359
#define TAU 6.28318530718

mat2 rot2(float a) { float c = cos(a), s = sin(a); return mat2(c, s, -s, c); }
float luma(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
vec2 toP(vec2 uv) { return (uv - 0.5) * vec2(u_aspect, 1.0); }
vec2 toUV(vec2 p) { return p / vec2(u_aspect, 1.0) + 0.5; }

// Hash without sine — Dave Hoskins (MIT)
float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
float hash12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
vec2 hash22(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * vec3(0.1031, 0.1030, 0.0973)); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.xx + p3.yz) * p3.zy); }
`;

// 4D simplex noise — Ashima Arts / Stefan Gustavson (MIT). 4D lets us move the
// time axis around a circle, which is what makes seamless loops possible.
const NOISE = /* glsl */ `
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
float mod289(float x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
float permute(float x) { return mod289(((x * 34.0) + 10.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }
float taylorInvSqrt(float r) { return 1.79284291400159 - 0.85373472095314 * r; }

vec4 grad4(float j, vec4 ip) {
  const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
  vec4 p, s;
  p.xyz = floor(fract(vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
  p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
  s = vec4(lessThan(p, vec4(0.0)));
  p.xyz = p.xyz + (s.xyz * 2.0 - 1.0) * s.www;
  return p;
}

float snoise(vec4 v) {
  const vec4 C = vec4(0.138196601125011, 0.276393202250021, 0.414589803375032, -0.447213595499958);
  vec4 i = floor(v + dot(v, vec4(0.309016994374947451)));
  vec4 x0 = v - i + dot(i, C.xxxx);
  vec4 i0;
  vec3 isX = step(x0.yzw, x0.xxx);
  vec3 isYZ = step(x0.zww, x0.yyz);
  i0.x = isX.x + isX.y + isX.z;
  i0.yzw = 1.0 - isX;
  i0.y += isYZ.x + isYZ.y;
  i0.zw += 1.0 - isYZ.xy;
  i0.z += isYZ.z;
  i0.w += 1.0 - isYZ.z;
  vec4 i3 = clamp(i0, 0.0, 1.0);
  vec4 i2 = clamp(i0 - 1.0, 0.0, 1.0);
  vec4 i1 = clamp(i0 - 2.0, 0.0, 1.0);
  vec4 x1 = x0 - i1 + C.xxxx;
  vec4 x2 = x0 - i2 + C.yyyy;
  vec4 x3 = x0 - i3 + C.zzzz;
  vec4 x4 = x0 + C.wwww;
  i = mod289(i);
  float j0 = permute(permute(permute(permute(i.w) + i.z) + i.y) + i.x);
  vec4 j1 = permute(permute(permute(permute(
              i.w + vec4(i1.w, i2.w, i3.w, 1.0))
            + i.z + vec4(i1.z, i2.z, i3.z, 1.0))
            + i.y + vec4(i1.y, i2.y, i3.y, 1.0))
            + i.x + vec4(i1.x, i2.x, i3.x, 1.0));
  vec4 ip = vec4(1.0 / 294.0, 1.0 / 49.0, 1.0 / 7.0, 0.0);
  vec4 p0 = grad4(j0, ip);
  vec4 p1 = grad4(j1.x, ip);
  vec4 p2 = grad4(j1.y, ip);
  vec4 p3 = grad4(j1.z, ip);
  vec4 p4 = grad4(j1.w, ip);
  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
  p4 *= taylorInvSqrt(dot(p4, p4));
  vec3 m0 = max(0.6 - vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2)), 0.0);
  vec2 m1 = max(0.6 - vec2(dot(x3, x3), dot(x4, x4)), 0.0);
  m0 = m0 * m0;
  m1 = m1 * m1;
  return 49.0 * (dot(m0 * m0, vec3(dot(p0, x0), dot(p1, x1), dot(p2, x2)))
               + dot(m1 * m1, vec2(dot(p3, x3), dot(p4, x4))));
}

// Fractal noise. w is the 2D "time" coordinate; scaling + offsetting it per
// octave keeps it on a circle, so loops stay seamless.
float fbm(vec2 p, vec2 w, int oct) {
  float sum = 0.0, amp = 0.5, norm = 0.0;
  for (int i = 0; i < oct + u_zero; i++) {
    sum += amp * snoise(vec4(p, w));
    norm += amp;
    p = rot2(0.62) * p * 2.03 + vec2(1.7, 9.2);
    w = w * 1.3 + vec2(3.1, -1.7);
    amp *= 0.5;
  }
  return sum / norm;
}

// Two independent fbm values from a single loop, so the compiler inlines one
// copy of fbm instead of two (much faster shader compiles on Windows).
vec2 fbm2(vec2 pa, vec2 wa, int oa, vec2 pb, vec2 wb, int ob) {
  vec2 r = vec2(0.0);
  for (int j = 0; j < 2 + u_zero; j++) {
    float v = fbm(j == 0 ? pa : pb, j == 0 ? wa : wb, j == 0 ? oa : ob);
    if (j == 0) r.x = v; else r.y = v;
  }
  return r;
}
`;

// ── 1. Field ────────────────────────────────────────────────────────────────
export const FIELD_FRAG = HEADER + NOISE + /* glsl */ `
uniform sampler2D u_palette;
uniform sampler2D u_dye;
uniform sampler2D u_image;
uniform vec2 u_imageSize;
uniform float u_paletteSize;
uniform float u_cycleOffset;

uniform int u_source_type;
uniform float u_source_scale, u_source_warp, u_source_ridge, u_source_twist, u_source_rotation;
uniform float u_source_offsetX, u_source_offsetY;
uniform int u_source_detail;
uniform int u_source_bandCount;
uniform float u_source_bandWidth, u_source_bandSpacing, u_source_bandAngle, u_source_bandLength;
uniform int u_source_meshCount;
uniform float u_source_meshBlend, u_source_meshMotion;
uniform int u_source_ribLines;
uniform float u_source_ribWidth, u_source_ribThick, u_source_ribGlow, u_source_ribAmp, u_source_ribFreq, u_source_ribFan, u_source_ribAngle;
uniform int u_source_imgRecolor;
uniform int u_source_shape, u_source_shapeCount;
uniform float u_source_shapeSize, u_source_shapeSoft, u_source_shapeDrift, u_source_bgAngle;
uniform float u_source_fluidGain;

uniform float u_color_spread, u_color_shift, u_color_repeat, u_color_offset, u_color_posterize;
uniform int u_color_mirror;

vec2 seedOffset() { return (hash22(vec2(u_source_seed * 0.1371 + 0.5, 3.7)) - 0.5) * 240.0; }

float silk(vec2 p, vec2 so) {
  vec2 W = u_W;
  vec2 q = fbm2(p + so, W, 3, p + so + vec2(5.2, 1.3), W + vec2(4.1, 2.7), 3);
  vec2 r = p + u_source_warp * 1.6 * q;
  float f = fbm(r + so + vec2(1.7, 9.2), W * 1.1 + vec2(8.3, 2.8), u_source_detail);
  float smoothV = f * 0.95 + 0.5;
  float ridged = 1.0 - abs(f) * 2.4;
  return mix(smoothV, ridged, u_source_ridge);
}

float bands(vec2 p, vec2 so) {
  float a = radians(u_source_bandAngle);
  vec2 n = vec2(cos(a), sin(a));
  float d = dot(p, n);
  float along = dot(p, vec2(-n.y, n.x));
  vec2 bw = fbm2(p * 1.3 + so, u_W, u_source_detail, p * 0.9 + so + 4.3, u_W + 2.0, 2);
  d += u_source_warp * 0.16 * bw.x;
  along += u_source_warp * 0.2 * bw.y;
  float cnt = float(u_source_bandCount);
  float sum = 0.0;
  for (int i = 0; i < u_source_bandCount + u_zero; i++) {
    float fi = float(i);
    float h = hash11(fi * 7.31 + u_source_seed * 0.71);
    float c = (fi - (cnt - 1.0) * 0.5) * u_source_bandSpacing
            + 0.07 * sin(u_phase * (1.0 + mod(fi, 2.0)) + h * TAU);
    float w = u_source_bandWidth * (0.75 + 0.5 * hash11(fi * 3.17 + u_source_seed));
    sum += exp(-pow((d - c) / w, 2.0)) * (0.7 + 0.3 * h);
  }
  float len = u_source_bandLength;
  float fall = exp(-pow(along / len, 2.0));
  sum *= mix(fall, 1.0, smoothstep(2.6, 3.0, len));
  return 1.0 - exp(-1.9 * sum);
}

float mesh(vec2 p, vec2 so) {
  vec2 wp = p + u_source_warp * 0.2 * fbm2(p * 1.1 + so, u_W, u_source_detail, p * 1.1 + so + vec2(7.7, 3.3), u_W + vec2(2.0, 5.0), u_source_detail);
  float cnt = float(u_source_meshCount);
  float ws = 0.0, ts = 0.0;
  for (int i = 0; i < u_source_meshCount + u_zero; i++) {
    float fi = float(i);
    vec2 h = hash22(vec2(fi * 1.37 + 0.5, u_source_seed * 0.173 + 2.0));
    vec2 base = (h - 0.5) * vec2(u_aspect, 1.0) * 1.15;
    float sp = 1.0 + mod(fi, 3.0);
    vec2 mo = 0.2 * u_source_meshMotion * vec2(sin(u_phase * sp + h.x * TAU), cos(u_phase * (4.0 - sp) + h.y * TAU));
    vec2 d = wp - (base + mo);
    float wgt = 1.0 / pow(dot(d, d) + 0.002, u_source_meshBlend);
    ws += wgt;
    ts += wgt * (cnt > 1.0 ? fi / (cnt - 1.0) : 0.5);
  }
  return ts / ws;
}

float ribbons(vec2 p, vec2 so) {
  p = rot2(radians(u_source_ribAngle)) * p;
  float fq = u_source_ribFreq * 3.0;
  float v = p.y
    + u_source_ribAmp * 0.16 * sin(p.x * fq + u_phase)
    + u_source_ribAmp * 0.07 * sin(p.x * fq * 2.1 - 2.0 * u_phase + 1.3)
    + u_source_warp * 0.1 * fbm(p * 0.9 + so, u_W, u_source_detail);
  float k = v * exp(-u_source_ribFan * p.x * 1.5);
  float W = max(u_source_ribWidth, 0.01);
  float env = exp(-pow(k / W, 2.0));
  float lines = k * float(u_source_ribLines) / (2.0 * W);
  float d = abs(fract(lines + 0.5) - 0.5);
  float aa = fwidth(lines);
  float th = u_source_ribThick * 0.5;
  float core = 1.0 - smoothstep(th - aa, th + aa, d);
  float glow = exp(-d * d / (th * th * 6.0 + 1e-4)) * u_source_ribGlow;
  float lineMask = smoothstep(0.01, 0.35, env);
  return env * 0.42 + clamp(core + glow * 0.6, 0.0, 1.0) * lineMask * 0.58;
}

float sdSeg(vec2 q, vec2 a, vec2 b, out vec2 closest) {
  vec2 pa = q - a, ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  closest = a + ba * h;
  return length(q - closest);
}

// Crisp, softly lit objects (spheres, chain links, pills) floating over a
// gradient — something solid for the glass to break up. The backdrop uses the
// lower part of the palette, the objects the upper part.
float shapes(vec2 p) {
  float ba = radians(u_source_bgAngle);
  float t = clamp(0.5 + dot(p, vec2(cos(ba), sin(ba))) * 0.85, 0.0, 1.0) * 0.4;
  vec3 L = normalize(vec3(-0.45, 0.65, 0.62));
  float n = float(u_source_shapeCount);
  for (int i = 0; i < u_source_shapeCount + u_zero; i++) {
    float fi = float(i);
    vec2 h = hash22(vec2(fi * 3.17 + 1.3, u_source_seed * 0.211 + 5.0));
    float R = u_source_shapeSize * 0.5 * (n > 1.0 ? mix(0.8, 1.0, fract(h.x * 7.3)) : 1.0);
    float ca = hash11(u_source_seed * 0.37 + 2.1) * TAU;
    vec2 c = vec2(cos(ca), sin(ca)) * (fi - (n - 1.0) * 0.5) * u_source_shapeSize * 0.62 + (h - 0.5) * u_source_shapeSize * 0.18;
    float sp = 1.0 + mod(fi, 2.0);
    c += 0.07 * u_source_shapeDrift * vec2(sin(u_phase * sp + h.x * TAU), cos(u_phase * (3.0 - sp) + h.y * TAU));
    int kind = u_source_shape == 3 ? int(mod(fi, 3.0)) : u_source_shape;
    float ang = (h.y - 0.5) * 2.4 + 0.35 * u_source_shapeDrift * sin(u_phase + fi * 1.7);
    vec2 q = rot2(-ang) * (p - c);
    float d;
    vec3 nrm;
    if (kind == 0) {                               // sphere
      float r = length(q);
      d = r - R;
      nrm = normalize(vec3(q, sqrt(max(R * R - r * r, 0.0)) + 1e-4));
    } else if (kind == 1) {                        // chain link: a stadium-shaped tube
      float rr = R * 0.6, tube = R * 0.24;
      vec2 cl;
      float ds = sdSeg(q, vec2(0.0, -R * 0.38), vec2(0.0, R * 0.38), cl);
      float dd = ds - rr;
      d = abs(dd) - tube;
      float u = clamp(dd / tube, -1.0, 1.0);
      nrm = normalize(vec3((q - cl) / max(ds, 1e-5) * u, sqrt(max(1.0 - u * u, 0.0)) + 1e-4));
    } else {                                       // pill
      float tube = R * 0.42;
      vec2 cl;
      float ds = sdSeg(q, vec2(0.0, -R * 0.55), vec2(0.0, R * 0.55), cl);
      d = ds - tube;
      float u = clamp(ds / tube, 0.0, 1.0);
      nrm = normalize(vec3((q - cl) / max(ds, 1e-5) * u, sqrt(max(1.0 - u * u, 0.0)) + 1e-4));
    }
    nrm.xy = rot2(ang) * nrm.xy;
    float aa = fwidth(d) * 1.2 + u_source_shapeSoft * R * 0.5 + 1e-5;
    float cov = 1.0 - smoothstep(-aa, aa, d);
    float diff = clamp(dot(nrm, L), 0.0, 1.0);
    float spec = pow(max(reflect(-L, nrm).z, 0.0), 30.0);
    float tone = n > 1.0 ? mix(0.62, 1.0, fi / (n - 1.0)) : 1.0;
    float st = clamp(mix(max(0.47, tone - 0.26), tone, 0.2 + 0.8 * diff) + spec * 0.05, 0.0, 1.0);
    t = mix(t, st, cov);
  }
  return t;
}

vec4 imageSample(vec2 p, vec2 so) {
  vec2 wp = p + u_source_warp * 0.06 * fbm2(p * 1.5 + so, u_W, 3, p * 1.5 + so + 9.1, u_W + 3.3, 3);
  float ia = u_imageSize.x / max(u_imageSize.y, 1.0);
  vec2 uv = ia > u_aspect ? vec2(wp.x / ia, wp.y) + 0.5 : vec2(wp.x / u_aspect, wp.y * ia / u_aspect) + 0.5;
  return texture(u_image, uv);
}

void main() {
  vec2 p = toP(v_uv);
  int type = u_source_type;
  float t = 0.5;
  vec3 col = vec3(0.0);
  bool direct = false;

  if (type == 5) {
    float d = texture(u_dye, v_uv).r;
    t = 1.0 - exp(-max(d, 0.0) * u_source_fluidGain);
  } else {
    p = rot2(u_source_twist * exp(-dot(p, p) * 3.0)) * p;
    p = rot2(radians(u_source_rotation)) * p;
    p = p / u_source_scale + vec2(u_source_offsetX, u_source_offsetY);
    vec2 so = seedOffset();
    if (type == 0) t = silk(p * 1.4, so);
    else if (type == 1) t = bands(p, so);
    else if (type == 2) t = mesh(p, so);
    else if (type == 3) t = ribbons(p, so);
    else if (type == 4) t = shapes(p);
    else {
      vec4 im = imageSample(p, so);
      t = luma(im.rgb);
      if (u_source_imgRecolor == 0) { col = im.rgb; direct = true; }
    }
  }

  // value shaping
  t = clamp((t - 0.5) * u_color_spread + 0.5 + u_color_shift, 0.0, 1.0);
  float tv = t;
  float pt = t * u_color_repeat + u_color_offset + u_cycleOffset;
  if (u_color_mirror == 1) pt = 1.0 - abs(mod(pt, 2.0) - 1.0);
  else if (pt > 1.0 || pt < 0.0) pt = fract(pt);
  if (u_color_posterize > 1.5) {
    float n = u_color_posterize;
    pt = floor(pt * n * 0.9999) / (n - 1.0);
  }
  if (!direct) col = texture(u_palette, vec2((pt * (u_paletteSize - 1.0) + 0.5) / u_paletteSize, 0.5)).rgb;
  fragColor = vec4(col, tv);
}
`;

// ── Separable gaussian blur (field softening + bloom) ───────────────────────
export const BLUR_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_src;
uniform vec2 u_dir; // uv step per tap
void main() {
  vec4 c = texture(u_src, v_uv) * 0.2270270270;
  c += (texture(u_src, v_uv + u_dir * 1.0) + texture(u_src, v_uv - u_dir * 1.0)) * 0.1945945946;
  c += (texture(u_src, v_uv + u_dir * 2.0) + texture(u_src, v_uv - u_dir * 2.0)) * 0.1216216216;
  c += (texture(u_src, v_uv + u_dir * 3.0) + texture(u_src, v_uv - u_dir * 3.0)) * 0.0540540541;
  c += (texture(u_src, v_uv + u_dir * 4.0) + texture(u_src, v_uv - u_dir * 4.0)) * 0.0162162162;
  fragColor = c;
}`;

// ── 2. Glass: physically-based light transport ───────────────────────────────
// Each glass type defines a surface (slope, lateral ray displacement, local
// magnification). Light from the flow behind the glass is then traced:
//   refraction (Snell) → frost / streak / spectral dispersion (Monte Carlo)
//   → Beer–Lambert tint → caustics → Fresnel reflection of a light environment
//   → total internal reflection at steep seams → specular highlight.
// Samples are stratified with a per-pixel random rotation; the renderer
// averages several passes (different u_frameSeed) for noise-free stills.
export const GLASS_FRAG = HEADER + NOISE + /* glsl */ `
uniform sampler2D u_field;
uniform sampler2D u_palette;
uniform float u_paletteSize;
uniform int u_glass_type, u_glass_profile, u_glass_backType;
uniform float u_glass_count, u_glass_angle, u_glass_strength, u_glass_frost, u_glass_dispersion;
uniform float u_glass_highlight, u_glass_sharpness, u_glass_shadow, u_glass_wave, u_glass_waveFreq;
uniform float u_glass_centerX, u_glass_centerY, u_glass_jitter, u_glass_coverage;
uniform float u_glass_ior, u_glass_reflect, u_glass_streak, u_glass_caustics, u_glass_tintAmount;
uniform vec3 u_glass_tint;
uniform float u_glass_backCount, u_glass_backAngle, u_glass_backStrength;
uniform float u_color_relief, u_color_gloss, u_color_glossSize;
uniform float u_light_angle, u_light_elevation, u_light_intensity;
uniform vec3 u_light_color;
uniform int u_light_env;
uniform int u_glass_panel;
uniform float u_glass_panelSize, u_glass_panelOffset;
uniform vec2 u_jitter;       // sub-pixel offset of this accumulation pass (antialiasing)
uniform float u_samples;     // Monte Carlo samples per pixel in this pass
uniform float u_frameSeed;   // changes per accumulation pass

vec4 tap(vec2 p) { return texture(u_field, toUV(p)); }

struct Surf {
  vec2 g;       // surface slope → lighting normal = normalize(vec3(-g, 1))
  vec2 off;     // lateral displacement of the transmitted ray (height units)
  float M;      // local magnification of the background (1 = none, <0 = inverted)
  float edge;   // 0 = middle of a flute/cell … 1 = at its seam
  vec2 along;   // direction light streaks along
  float clear;  // 1 where the pane is clear (inside rain drops: no fog)
  float aniso;  // 1 for cylindrical flutes (highlights run along them)
};

Surf noSurf() { Surf S; S.g = vec2(0.0); S.off = vec2(0.0); S.M = 1.0; S.edge = 0.0; S.along = vec2(0.0, 1.0); S.clear = 0.0; S.aniso = 0.0; return S; }

// Displacement across a flute, s ∈ [-1, 1] (shaped for good-looking refraction).
float profOffset(float s) {
  int pr = u_glass_profile;
  if (pr == 0) return s / sqrt(max(1.0 - s * s, 0.06)) * 0.35;   // round (cylinder)
  if (pr == 1) return s;                                           // linear
  if (pr == 2) return sign(s) * 0.5;                               // prism (V)
  if (pr == 3) return sin(s * PI) * 0.5;                           // wave
  if (pr == 5) return s * 0.5 + sign(s) * smoothstep(0.9, 1.0, abs(s)) * 0.25;  // glass block: flat lens + thin bevel
  return sign(s) * smoothstep(0.5, 1.0, abs(s)) * 0.8;            // bevel
}
// True geometric slope of the flute surface (drives Fresnel, TIR and highlights).
float profSlope(float s) {
  int pr = u_glass_profile;
  if (pr == 0) return s / sqrt(max(1.0 - s * s, 0.004));
  if (pr == 1) return s * 1.1;
  if (pr == 2) return sign(s) * 0.9;
  if (pr == 3) return sin(s * PI) * 1.2;
  if (pr == 5) return s * 0.15 + sign(s) * smoothstep(0.9, 1.0, abs(s)) * 1.6;
  return sign(s) * smoothstep(0.5, 1.0, abs(s)) * 2.5;
}
float profEdge(float s) {
  float e = abs(s);
  if (u_glass_profile == 4) return smoothstep(0.5, 1.0, e);
  if (u_glass_profile == 5) return smoothstep(0.93, 1.0, e);
  if (u_glass_profile == 2) return max(pow(e, 6.0), 0.6 * (1.0 - smoothstep(0.0, 0.12, e)));
  return pow(e, 4.0);
}
// Lighting follows the refraction strength (flat glass has flat normals).
float bump(float str) { return sign(str) * clamp(abs(str) * 1.6, 0.0, 1.0); }

Surf flutes(float x, vec2 dir, vec2 alongv, float w, float str, float salt) {
  Surf S = noSurf();
  float id = floor(x);
  float s = fract(x) * 2.0 - 1.0;
  float j = (hash11(id * 1.618 + u_source_seed * 0.37 + salt) - 0.5) * u_glass_jitter * 2.0;
  float s0 = max(s - 0.02, -1.0), s1 = min(s + 0.02, 1.0);
  float dO = (profOffset(s1) - profOffset(s0)) / (s1 - s0);
  S.off = dir * (profOffset(s) * str + j) * w;
  S.M = 1.0 + 2.0 * str * dO;
  S.g = dir * profSlope(s) * bump(str);
  S.edge = profEdge(s);
  S.along = alongv;
  S.aniso = 1.0;
  return S;
}

// Smooth distance to the nearest cell center (smooth voronoi) — soft dimples.
float hammerH(vec2 g, float salt) {
  vec2 ig = floor(g), fg = fract(g);
  float res = 0.0;
  for (int k = 0; k < 9 + u_zero; k++) {
    vec2 b = vec2(float(k % 3 - 1), float(k / 3 - 1));
    vec2 o = hash22(ig + b + u_source_seed * 0.013 + salt);
    o = 0.5 + (o - 0.5) * (0.4 + 0.6 * u_glass_jitter);
    res += exp(-9.0 * length(b + o - fg));
  }
  float f = -log(res) / 9.0;
  return f * f;
}

// Voronoi: distance to the nearest cell border (Inigo Quilez), plus the cell
// id and the direction toward that border (for bevelled facet edges).
float voronoiBorder(vec2 x, float salt, out vec2 cell, out vec2 toBorder) {
  vec2 n = floor(x), f = fract(x);
  vec2 mg = vec2(0.0), mr = vec2(0.0);
  float md = 8.0;
  for (int k = 0; k < 9 + u_zero; k++) {
    vec2 g = vec2(float(k % 3 - 1), float(k / 3 - 1));
    vec2 o = 0.5 + (hash22(n + g + salt) - 0.5) * (0.6 + 0.4 * u_glass_jitter);
    vec2 r = g + o - f;
    float d = dot(r, r);
    if (d < md) { md = d; mr = r; mg = g; }
  }
  md = 8.0;
  toBorder = vec2(0.0);
  for (int k = 0; k < 25 + u_zero; k++) {
    vec2 g = mg + vec2(float(k % 5 - 2), float(k / 5 - 2));
    vec2 o = 0.5 + (hash22(n + g + salt) - 0.5) * (0.6 + 0.4 * u_glass_jitter);
    vec2 r = g + o - f;
    if (dot(mr - r, mr - r) > 1e-5) {
      vec2 nb = normalize(r - mr);
      float d = dot(0.5 * (mr + r), nb);
      if (d < md) { md = d; toBorder = nb; }
    }
  }
  cell = n + mg;
  return md;
}

// Finite-difference stencil: center, +x, +y, -x, -y.
vec2 stencil(int k, float e) {
  return k == 1 ? vec2(e, 0.0) : k == 2 ? vec2(0.0, e) : k == 3 ? vec2(-e, 0.0) : k == 4 ? vec2(0.0, -e) : vec2(0.0);
}

float waterH(vec2 q, vec2 W) {
  return snoise(vec4(q, W)) + 0.45 * snoise(vec4(q * 2.1 + 3.1, W * 1.6 + 1.7));
}

// Rain on a window: two layers of drops act as tiny lenses (each shows an
// inverted, shrunken view of the scene); big drops leave clear trails
// through the fog as they slide down.
Surf rain(vec2 p, float w, float str, float salt) {
  Surf S = noSurf();
  for (int L = 0; L < 2 + u_zero; L++) {
    float fl = float(L);
    float cs = w * (L == 0 ? 2.4 : 0.9);
    vec2 q = p / cs;
    vec2 id = floor(q);
    // trails left by big drops (look a few cells below for the drop that made them)
    if (L == 0) {
      for (int k = 0; k < 12 + u_zero; k++) {
        vec2 cid = id + vec2(float(k % 3 - 1), float(k / 3 - 3));
        float hr = hash12(cid * 1.31 + u_source_seed * 0.07 + salt);
        if (hr > u_glass_coverage || fract(hr * 29.3) > 0.55) continue;
        vec2 hp = hash22(cid + u_source_seed * 0.11 + salt);
        vec2 c = cid + 0.5 + (hp - 0.5) * 0.7;
        float r = mix(0.22, 0.48, fract(hr * 37.1));
        float len = r * (2.0 + 5.0 * fract(hr * 53.7));
        float u = (q.y - c.y) / len;                       // 0 at the drop … 1 at the trail's top
        float wob = 0.06 * sin(q.y * 9.0 + hr * 40.0);
        float halfW = r * 0.32 * (1.0 - 0.6 * u);
        if (u > 0.0 && u < 1.0 && abs(q.x - c.x - wob) < halfW) S.clear = max(S.clear, smoothstep(1.0, 0.6, u));
      }
    }
    for (int k = 0; k < 9 + u_zero; k++) {
      vec2 cid = id + vec2(float(k % 3 - 1), float(k / 3 - 1));
      float hr = hash12(cid * 1.31 + u_source_seed * 0.07 + salt + fl * 17.3);
      if (hr > u_glass_coverage) continue;
      vec2 hp = hash22(cid + u_source_seed * 0.11 + salt + fl * 7.7);
      vec2 c = cid + 0.5 + (hp - 0.5) * 0.7;
      float r = mix(0.22, 0.48, fract(hr * 37.1)) * mix(1.0, 0.45 + fract(hr * 91.7), u_glass_jitter);
      vec2 v = (q - c) / r;
      v.y *= 0.86;                                         // drops sag a little
      float th = atan(v.y, v.x);
      v *= 1.0 + 0.035 * sin(3.0 * th + hr * 31.0) + 0.02 * sin(5.0 * th + hr * 17.0);  // not perfect circles
      float s2 = dot(v, v);
      if (s2 >= 1.0) continue;
      float s = sqrt(s2);
      float rad = r * cs;
      S.off = -v * rad * str * 1.8;                        // inverting lens
      S.M = 1.0 - str * 1.8;
      S.g = v / sqrt(max(1.0 - s2, 0.05)) * 0.5 * bump(str);
      S.edge = smoothstep(0.72, 1.0, s) * 1.8;             // thin dark rims
      S.clear = smoothstep(1.0, 0.85, s);
      S.along = vec2(0.0, 1.0);
    }
  }
  return S;
}

Surf surface(int gt, vec2 p, float count, float angleDeg, float str, float salt) {
  Surf S = noSurf();
  if (gt == 0) return S;
  float a = radians(angleDeg);
  vec2 dir = vec2(cos(a), sin(a));
  vec2 alongv = vec2(-dir.y, dir.x);
  float w = min(u_aspect, 1.0) / max(count, 1.0);

  if (gt == 1 || gt == 2) {                       // reeded / wavy reeded
    vec2 d = dir;
    float x = dot(p, dir) / w;
    if (gt == 2) {
      float y = dot(p, alongv);
      float ph = y * u_glass_waveFreq * TAU;
      x += u_glass_wave * sin(ph);
      d = normalize(dir + alongv * u_glass_wave * u_glass_waveFreq * TAU * cos(ph) * w);
    }
    S = flutes(x, d, vec2(-d.y, d.x), w, str, salt);
  } else if (gt == 3) {                           // concentric rings
    vec2 c = vec2(u_glass_centerX * u_aspect, u_glass_centerY) * 0.5;
    vec2 dd = p - c;
    float r = length(dd);
    vec2 rd = dd / max(r, 1e-5);
    S = flutes(r / w, rd, vec2(-rd.y, rd.x), w, str, salt);
  } else if (gt == 4) {                           // glass-block tiles
    vec2 g2 = vec2(dot(p, dir), dot(p, alongv)) / w;
    Surf X = flutes(g2.x, dir, alongv, w, str, salt);
    Surf Y = flutes(g2.y, alongv, dir, w, str, salt + 7.7);
    S.off = X.off + Y.off;
    S.g = X.g + Y.g;
    S.M = X.M * Y.M;
    S.edge = max(X.edge, Y.edge);
    S.along = alongv;
  } else if (gt == 5) {                           // hammered: smooth dimples
    vec2 g = rot2(a) * p / w;
    float e = 0.02;
    float hs[5];
    int nh = u_glass_caustics > 0.001 ? 5 : 3;   // the curvature is only needed for caustics
    for (int k = 0; k < nh + u_zero; k++) hs[k] = hammerH(g + stencil(k, e), salt);
    float h0 = hs[0];
    vec2 grad = rot2(-a) * vec2(hs[1] - h0, hs[2] - h0) / e;
    float lap = nh == 5 ? (hs[1] + hs[3] + hs[2] + hs[4] - 4.0 * h0) / (e * e) : 0.0;
    S.off = grad * str * w * 0.9;
    S.M = 1.0 + str * 0.9 * lap;
    S.g = grad * 0.9 * bump(str);
    S.edge = smoothstep(0.08, 0.35, h0);
    S.along = alongv;
  } else if (gt == 6) {                           // water surface
    vec2 q = p / w * 0.22;
    vec2 W = u_W * 1.5;
    float e = 0.02;
    float hs[5];
    int nh = u_glass_caustics > 0.001 ? 5 : 3;
    for (int k = 0; k < nh + u_zero; k++) hs[k] = waterH(q + stencil(k, e), W);
    float h0 = hs[0];
    vec2 grad = vec2(hs[1] - h0, hs[2] - h0) / e;
    float lap = nh == 5 ? (hs[1] + hs[3] + hs[2] + hs[4] - 4.0 * h0) / (e * e) : 0.0;
    S.off = grad * str * w * 0.16;
    S.M = 1.0 + str * 0.035 * lap;
    S.g = grad * 0.35 * bump(str);
    S.along = alongv;
  } else if (gt == 7) {                           // crystal: tilted facets with bevelled edges
    vec2 g = rot2(a) * p / w;
    vec2 cell, tb;
    float bd = voronoiBorder(g, salt + u_source_seed * 0.1, cell, tb);
    vec2 tilt = (hash22(cell * 1.37 + salt + u_source_seed * 0.1) - 0.5) * 1.6;
    float bev = 1.0 - smoothstep(0.0, 0.09, bd);   // bevel band along each edge
    vec2 slope = tilt * 0.6 + tb * bev * 1.8;
    vec2 t = rot2(-a) * slope;
    S.off = t * str * w * 0.6;
    S.g = t * bump(str);
    S.M = 1.0 / (1.0 + bev * 2.0 * abs(str));     // bevels spread light thin
    S.edge = 1.0 - smoothstep(0.0, 0.025, bd);
    S.along = alongv;
  } else if (gt == 8) {                           // rain drops
    S = rain(p, w, str, salt);
  } else if (gt == 9) {                           // pyramids: four flat facets per cell
    vec2 g2 = vec2(dot(p, dir), dot(p, alongv)) / w;
    vec2 id = floor(g2);
    vec2 s = fract(g2) * 2.0 - 1.0;
    vec2 j = (hash22(id + u_source_seed * 0.37 + salt) - 0.5) * u_glass_jitter;
    vec2 face = abs(s.x) > abs(s.y) ? vec2(sign(s.x), 0.0) : vec2(0.0, sign(s.y));
    vec2 t = dir * face.x + alongv * face.y;
    S.off = (t * 0.5 * str + dir * j.x + alongv * j.y) * w;
    S.g = t * 0.75 * bump(str);
    S.M = 1.0;
    float de = min(abs(abs(s.x) - abs(s.y)) * 0.7071, 1.0 - max(abs(s.x), abs(s.y)));
    S.edge = (1.0 - smoothstep(0.0, 0.05, de)) * 0.6;
    S.along = alongv;
  }
  return S;
}

// Where the glass is. Returns a signed distance to the pane's border
// (negative inside), in height units.
float panelDist(vec2 p) {
  int m = u_glass_panel;
  float hx = u_aspect * 0.5, hy = 0.5;
  float sz = u_glass_panelSize, o = u_glass_panelOffset;
  if (m == 1) return (hx - 2.0 * hx * sz + o * hx) - p.x;            // right
  if (m == 2) return p.x - (-hx + 2.0 * hx * sz + o * hx);           // left
  if (m == 3) return (hy - 2.0 * hy * sz + o * hy) - p.y;            // top
  if (m == 4) return p.y - (-hy + 2.0 * hy * sz + o * hy);           // bottom
  if (m == 5) {                                                      // centered window
    vec2 q = abs(p - vec2(o * hx, 0.0)) - vec2(hx, hy) * sz;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0);
  }
  if (m == 6) return abs(p.x - o * hx) - hx * sz;                    // vertical band
  return -1e3;                                                       // full
}

// What the glass reflects.
// keyAmt scales the light source itself (the softbox) within the reflection.
vec3 environment(vec3 r, vec3 Ld, float keyAmt) {
  vec3 lc = u_light_color * u_light_intensity;
  float key = smoothstep(0.86, 0.985, dot(r, Ld));
  float up = clamp(r.y * 0.5 + 0.5, 0.0, 1.0);
  vec3 base;
  if (u_light_env == 0) {                         // studio: dark room, soft gradient, big softbox
    base = mix(vec3(0.008), vec3(0.11), up * up);
  } else if (u_light_env == 1) {                  // palette: reflect the image's own colors
    base = texture(u_palette, vec2((up * (u_paletteSize - 1.0) + 0.5) / u_paletteSize, 0.5)).rgb * 0.8;
  } else if (u_light_env == 2) {                  // window with mullions
    vec2 w = r.xy / (r.z + 1.0) - Ld.xy / (Ld.z + 1.0);
    float pane = step(abs(w.x), 0.3) * step(abs(w.y), 0.42);
    vec2 m = abs(fract(w / vec2(0.3, 0.42) + 0.5) - 0.5);
    pane *= smoothstep(0.02, 0.06, min(m.x, m.y));
    base = vec3(0.02) + vec3(1.1) * pane;
    key = 0.0;
  } else {
    base = vec3(0.0);                             // dark room: only the light itself
  }
  return base * mix(vec3(1.0), lc, 0.6) + key * keyAmt * lc * 1.2;
}

// Smooth rainbow weights for spectral sampling (x: 0 = red … 1 = violet).
vec3 spectrum(float x) {
  return clamp(vec3(1.6 - abs(x * 4.2 - 0.45), 1.6 - abs(x * 4.2 - 2.1), 1.6 - abs(x * 4.2 - 3.6)), 0.0, 1.0) + 0.02;
}

void main() {
  vec2 p = toP(v_uv + u_jitter / u_res);
  float la = radians(u_light_angle), le = radians(u_light_elevation);
  vec3 Ld = normalize(vec3(cos(la) * cos(le), sin(la) * cos(le), sin(le)));
  vec3 lc = u_light_color * u_light_intensity;

  // the pane may cover only part of the canvas
  float pd = panelDist(p);
  bool inPane = pd < 0.0;
  int gt = inPane ? u_glass_type : 0;
  int bt = inPane ? u_glass_backType : 0;
  bool anyGlass = gt > 0 || bt > 0;

  // ── surfaces: front pane, then (optionally) a back pane hit by the bent ray
  Surf A = noSurf(), B = noSurf();
  int panes = bt > 0 ? 2 : gt > 0 ? 1 : 0;
  for (int k = 0; k < panes + u_zero; k++) {
    bool back = k == 1;
    Surf S = surface(back ? bt : gt, back ? p + A.off : p,
                     back ? u_glass_backCount : u_glass_count, back ? u_glass_backAngle : u_glass_angle,
                     back ? u_glass_backStrength : u_glass_strength, back ? 3.3 : 0.0);
    if (back) B = S; else A = S;
  }
  vec2 off = A.off;
  float M = A.M;
  float shade = max(1.0 - u_glass_shadow * A.edge, 0.0);
  vec2 g = A.g;
  vec2 along = A.along;
  float clear = A.clear;
  float aniso = A.aniso;
  if (bt > 0) {
    off += B.off;
    M *= B.M;
    shade *= max(1.0 - u_glass_shadow * 0.7 * B.edge, 0.0);
    if (gt == 0) { g = B.g; along = B.along; aniso = B.aniso; } else { g += B.g * 0.35; aniso *= 0.5; }
    clear = max(clear, B.clear);
  }

  // ── transmitted light (Monte Carlo over frost, streak and wavelength)
  float frostR = anyGlass ? u_glass_frost * u_glass_frost * 0.06 * (1.0 - clear) : 0.0;
  float streakL = anyGlass ? u_glass_streak * u_glass_streak * 0.14 : 0.0;
  float disp = anyGlass ? u_glass_dispersion : 0.0;
  bool multi = frostR > 1e-5 || streakL > 1e-5 || disp > 0.001;
  int N = multi ? int(u_samples) : 1;
  float r1 = hash12(gl_FragCoord.xy + u_frameSeed * 61.7);
  float r2 = hash12(gl_FragCoord.yx * 1.37 + u_frameSeed * 17.3 + 4.1);
  vec2 sp0 = p + off;
  vec3 acc = vec3(0.0), wsum = vec3(0.0);
  float aacc = 0.0;
  for (int i = 0; i < N + u_zero; i++) {
    float fi = float(i);
    vec2 sp = sp0;
    if (frostR > 0.0) {
      float u = (fi + r1) / float(N);
      float r = (u < 0.7 ? sqrt(u / 0.7) * 0.55 : 0.55 + (u - 0.7) / 0.3 * 1.6) * frostR;
      float th = fi * 2.39996323 + r2 * TAU;
      sp += r * vec2(cos(th), sin(th));
    }
    if (streakL > 0.0) sp += along * (fract(fi * 0.618034 + r2) * 2.0 - 1.0) * streakL;
    vec3 wgt = vec3(1.0);
    if (disp > 0.001) {
      float lam = fract(fi * 0.7548777 + r1);
      sp += (off + along * 0.004) * (lam - 0.5) * disp * 1.2;
      wgt = spectrum(lam);
    }
    vec4 c = tap(sp);
    acc += c.rgb * wgt;
    wsum += wgt;
    aacc += c.a;
  }
  vec3 col = acc / max(wsum, vec3(1e-4));
  float tval = aacc / float(N);

  // ── relief lighting of the flow itself (seen through the glass)
  if (u_color_relief > 0.001 || u_color_gloss > 0.001) {
    float e = 0.004;
    float hx = tap(sp0 + vec2(e, 0.0)).a - tap(sp0 - vec2(e, 0.0)).a;
    float hy = tap(sp0 + vec2(0.0, e)).a - tap(sp0 - vec2(0.0, e)).a;
    vec2 grad = vec2(hx, hy) / (2.0 * e);
    float H = 0.04 + u_color_relief * 0.22;
    vec3 n = normalize(vec3(-grad * H, 1.0));
    float diff = max(dot(n, Ld), 0.0) / max(Ld.z, 0.2);
    col *= mix(1.0, diff, u_color_relief);
    vec3 Hv = normalize(Ld + vec3(0.0, 0.0, 1.0));
    float shin = mix(6.0, 180.0, u_color_glossSize * u_color_glossSize);
    float spec0 = pow(Hv.z, shin);
    float spec = max(pow(max(dot(n, Hv), 0.0), shin) - spec0, 0.0) / (1.0 - spec0);
    vec3 tint = mix(vec3(1.0), texture(u_palette, vec2(0.99, 0.5)).rgb, 0.35);
    col += spec * u_color_gloss * 1.25 * tint * mix(vec3(1.0), lc, 0.7);
  }

  // ── glass optics
  if (anyGlass) {
    vec3 n = normalize(vec3(-g, 1.0));
    float ior = u_glass_ior;
    float F0 = pow((ior - 1.0) / (ior + 1.0), 2.0);
    float F = F0 + (1.0 - F0) * pow(1.0 - n.z, 5.0);

    // total internal reflection where the ray leaves the flat back face
    vec3 t1 = refract(vec3(0.0, 0.0, -1.0), n, 1.0 / ior);
    float k2 = 1.0 - ior * ior * (1.0 - t1.z * t1.z);
    float trans = smoothstep(-0.04, 0.04, k2);

    // Beer–Lambert absorption: tilted glass = longer path = deeper tint
    float path = 1.0 / max(-t1.z, 0.25);
    vec3 absorb = mix(vec3(1.0), pow(max(u_glass_tint, vec3(0.002)), vec3(path)), u_glass_tintAmount);

    // caustics: where the lens gathers light it glows, where it spreads it dims
    float I = clamp(1.0 / max(abs(M), 0.1), 0.0, 3.5);
    float Iref = 1.0 / (1.0 + 0.6 * abs(u_glass_strength));
    col *= mix(1.0, I / Iref, u_glass_caustics);

    // frosted / fogged glass scatters room light too: milky, lower contrast
    float fogAmt = u_glass_frost * (1.0 - clear);
    col = mix(col, col * 0.8 + 0.1 * mix(vec3(1.0), lc, 0.5), fogAmt * 0.55);

    col *= absorb * shade * trans * (1.0 - F) / (1.0 - F0);

    // Flutes behave like cylinders under a long softbox: drop the light's
    // component along the flute so every flute gets a clean highlight line.
    vec3 ax = vec3(along, 0.0);
    vec3 Lk = normalize(mix(Ld, Ld - ax * dot(Ld, ax), aniso) + vec3(0.0, 0.0, 1e-4));

    // Fresnel reflection of the environment (+ internal reflection at TIR seams)
    vec3 R = reflect(vec3(0.0, 0.0, -1.0), n);
    float refl = min(F * mix(0.0, 9.0, u_glass_reflect), 1.0);
    col += environment(R, Lk, 1.0) * refl;
    // light trapped by total internal reflection is dim: mostly the room, barely the lamp
    col += environment(R, Lk, 0.12) * (1.0 - trans) * (0.25 + 0.75 * u_glass_reflect);

    // sharp highlight of the light source
    vec3 Hv = normalize(Lk + vec3(0.0, 0.0, 1.0));
    float shin = mix(14.0, 700.0, u_glass_sharpness * u_glass_sharpness);
    float sp0v = pow(Hv.z, shin);
    float spec = max(pow(max(dot(n, Hv), 0.0), shin) - sp0v, 0.0) / (1.0 - sp0v);
    col += spec * u_glass_highlight * 1.8 * lc;
  }

  // edge of a partial pane: a thin line catching the light + a little thickness shadow
  if (u_glass_panel > 0 && (u_glass_type > 0 || u_glass_backType > 0)) {
    float px = 1.0 / u_res.y;
    float ed = abs(pd);
    col += lc * 0.2 * (1.0 - smoothstep(0.0, 1.6 * px, ed));
    if (inPane) col *= 1.0 - 0.22 * exp(-ed / 0.012);
  }

  fragColor = vec4(col, tval);
}
`;

// ── 3. Screen: halftone, lines, LED, CRT, mosaic, contour, dither ────────────
export const SCREEN_FRAG = HEADER + /* glsl */ `
uniform sampler2D u_src;
uniform int u_screen_type, u_screen_dotShape, u_screen_lineShape, u_screen_ledShape, u_screen_mosaicShape;
uniform int u_screen_colorMode, u_screen_indexEvery, u_screen_levels, u_screen_fill, u_screen_invert;
uniform float u_screen_size, u_screen_angle, u_screen_contrast, u_screen_dotScale, u_screen_background;
uniform float u_screen_glow, u_screen_lineCount, u_screen_lineWidth, u_screen_centerX, u_screen_centerY, u_screen_mix;
uniform vec3 u_screen_ink, u_screen_paper;
uniform float u_light_angle;

vec4 src(vec2 p) { return texture(u_src, toUV(p)); }
float adj(float L) {
  L = clamp((L - 0.5) * u_screen_contrast + 0.5, 0.0, 1.0);
  return u_screen_invert == 1 ? 1.0 - L : L;
}
vec3 adjc(vec3 c) { return clamp((c - 0.5) * u_screen_contrast + 0.5, 0.0, 1.0); }

float bayer2(vec2 a) { a = floor(a); return fract(dot(a, vec2(0.5, a.y * 0.75))); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }

const vec2 HEXS = vec2(1.0, 1.7320508);
vec4 hexCell(vec2 q) {
  vec4 hC = floor(vec4(q, q - vec2(0.5, 1.0)) / HEXS.xyxy) + 0.5;
  vec4 h = vec4(q - hC.xy * HEXS, q - (hC.zw + 0.5) * HEXS);
  return dot(h.xy, h.xy) < dot(h.zw, h.zw) ? vec4(h.xy, hC.xy * HEXS) : vec4(h.zw, (hC.zw + 0.5) * HEXS);
}

void main() {
  vec2 p = toP(v_uv);
  vec4 base = texture(u_src, v_uv);
  vec3 col = base.rgb;
  vec3 outc = col;
  int st = u_screen_type;
  float N = u_screen_size;
  float px = 1.0 / u_res.y;
  float aa = N * px * 0.8;           // one pixel, in cell units
  bool mono = u_screen_colorMode == 1;
  float boost = 1.0 + u_screen_glow;

  if (st == 1) {                                         // halftone dots
    mat2 R = rot2(radians(u_screen_angle));
    vec2 q = R * p * N;
    vec2 cell = floor(q) + 0.5;
    vec2 f = q - cell;
    vec3 cc = src(transpose(R) * (cell / N)).rgb;
    float L = adj(luma(cc));
    float d, rmax;
    if (u_screen_dotShape == 0) { d = length(f); rmax = 0.7071; }
    else if (u_screen_dotShape == 1) { d = max(abs(f.x), abs(f.y)); rmax = 0.5; }
    else { d = (abs(f.x) + abs(f.y)) * 0.7071; rmax = 0.7071; }
    float r = sqrt(L) * rmax * u_screen_dotScale;
    float m = 1.0 - smoothstep(r - aa, r + aa, d);
    vec3 ink = mono ? u_screen_ink : cc * boost;
    vec3 bg = mono ? u_screen_paper : cc * u_screen_background;
    outc = mix(bg, ink, m);
  } else if (st == 2) {                                  // line screen
    float v;
    if (u_screen_lineShape == 1) {
      vec2 c = vec2(u_screen_centerX * u_aspect, u_screen_centerY) * 0.5;
      v = length(p - c) * N;
    } else {
      vec2 q = rot2(radians(u_screen_angle)) * p * N;
      if (u_screen_lineShape == 2) q.y += 1.6 * sin(q.x * TAU / 14.0) + 0.8 * sin(q.x * TAU / 37.0 + 1.0);
      v = q.y;
    }
    float L = adj(luma(col));
    float f = abs(fract(v) - 0.5);
    float hw = 0.5 * L * u_screen_dotScale;
    float m = 1.0 - smoothstep(hw - aa, hw + aa, f);
    vec3 ink = mono ? u_screen_ink : col * boost;
    vec3 bg = mono ? u_screen_paper : col * u_screen_background;
    outc = mix(bg, ink, m);
  } else if (st == 3) {                                  // LED matrix
    vec2 q = p * N;
    vec2 cell = floor(q) + 0.5;
    vec2 f = q - cell;
    vec3 cc = adjc(src(cell / N).rgb);
    if (mono) cc = u_screen_ink * luma(cc);
    vec3 lit;
    if (u_screen_ledShape == 2) {
      float sx = (f.x + 0.5) * 3.0;
      float idx = clamp(floor(sx), 0.0, 2.0);
      vec3 mask = idx < 0.5 ? vec3(1.0, 0.0, 0.0) : idx < 1.5 ? vec3(0.0, 1.0, 0.0) : vec3(0.0, 0.0, 1.0);
      vec2 lp = vec2((fract(sx) - 0.5) / 3.0, f.y);
      vec2 hs = vec2(0.5 / 3.0, 0.5) * u_screen_dotScale * 0.9;
      vec2 dd = abs(lp) - hs + 0.06;
      float sd = length(max(dd, 0.0)) + min(max(dd.x, dd.y), 0.0) - 0.06;
      float m = 1.0 - smoothstep(-aa, aa, sd);
      lit = mask * cc * m * 3.0 * (1.0 + u_screen_glow * 0.5);
      lit += cc * exp(-dot(f, f) * 6.0) * u_screen_glow * 0.5;
    } else {
      float d = u_screen_ledShape == 0 ? length(f) : max(abs(f.x), abs(f.y));
      float r = 0.5 * u_screen_dotScale;
      float m = 1.0 - smoothstep(r - aa, r + aa, d);
      float g = exp(-d * d / (r * r * 1.4 + 1e-4)) * u_screen_glow;
      lit = cc * (m * (1.0 + u_screen_glow * 0.6) + g * 0.7);
    }
    vec3 bg = mono ? u_screen_paper : cc * u_screen_background * 0.4;
    outc = bg + lit;
  } else if (st == 4) {                                  // CRT shadow mask + scanlines
    vec2 q = p * N;
    float row = floor(q.y);
    float sub = floor(q.x * 3.0 + mod(row, 2.0) * 1.5);
    float k = mod(sub, 3.0);
    vec3 mask = k < 0.5 ? vec3(1.0, 0.2, 0.2) : k < 1.5 ? vec3(0.2, 1.0, 0.2) : vec3(0.2, 0.2, 1.0);
    float ms = clamp(u_screen_dotScale, 0.0, 1.0);
    mask = mix(vec3(1.0), mask * 1.7, ms);
    float scan = pow(sin(fract(q.y) * PI), 1.5);
    scan = mix(1.0, scan * 1.3, ms);
    vec3 c2 = adjc(col);
    outc = c2 * mask * scan * (1.0 + u_screen_glow * 0.6);
  } else if (st == 5) {                                  // mosaic tiles
    vec2 center, f;
    float d;
    if (u_screen_mosaicShape == 1) {
      vec4 h = hexCell(p * N);
      f = h.xy; center = h.zw / N;
      vec2 a = abs(f);
      d = max(dot(a, HEXS * 0.5), a.x);
    } else {
      vec2 q = p * N;
      vec2 cell = floor(q) + 0.5;
      f = q - cell; center = cell / N;
      d = max(abs(f.x), abs(f.y));
    }
    vec3 cc = adjc(src(center).rgb);
    float la = radians(u_light_angle);
    float bevel = 1.0 + u_screen_glow * 0.9 * dot(f, vec2(cos(la), sin(la))) * smoothstep(0.2, 0.5, d);
    float edge = 0.5 * min(u_screen_dotScale, 1.0);
    float m = 1.0 - smoothstep(edge - aa, edge + aa, d);
    vec3 tile = mono ? mix(u_screen_paper, u_screen_ink, luma(cc)) : cc;
    vec3 bg = mono ? u_screen_paper : cc * u_screen_background;
    outc = mix(bg, tile * bevel, m);
  } else if (st == 6) {                                  // topographic contours
    float t = base.a;
    float v = t * u_screen_lineCount;
    float fw = fwidth(v);
    float d = abs(fract(v + 0.5) - 0.5) / max(fw, 1e-6);
    float idx = floor(v + 0.5);
    float wpx = u_screen_lineWidth * u_pxScale;
    if (u_screen_indexEvery > 0 && mod(idx, float(u_screen_indexEvery)) < 0.5) wpx *= 2.2;
    float m = 1.0 - smoothstep(wpx * 0.5 - 0.6, wpx * 0.5 + 0.6, d);
    m *= step(1e-5, fw) * step(0.5, idx) * step(idx, u_screen_lineCount - 0.5);
    vec3 ink = mono ? u_screen_ink : col * boost;
    vec3 bg = u_screen_fill == 1 ? col : mono ? u_screen_paper : col * u_screen_background;
    outc = mix(bg, ink, m);
  } else if (st == 7) {                                  // ordered dither
    vec2 q = p * N;
    vec2 cell = floor(q);
    vec3 cc = src((cell + 0.5) / N).rgb;
    float th = bayer8(mod(cell, 8.0));
    float lv = float(u_screen_levels) - 1.0;
    if (mono) {
      float qv = floor(adj(luma(cc)) * lv + th) / lv;
      outc = mix(u_screen_paper, u_screen_ink, clamp(qv, 0.0, 1.0));
    } else {
      vec3 c3 = adjc(cc);
      if (u_screen_invert == 1) c3 = 1.0 - c3;
      outc = clamp(floor(c3 * lv + th) / lv, 0.0, 1.0);
    }
  }

  fragColor = vec4(mix(col, outc, u_screen_mix), base.a);
}
`;

// ── 4. Bloom bright-pass + 4× downsample ────────────────────────────────────
export const BRIGHT_FRAG = /* glsl */ `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 fragColor;
uniform sampler2D u_src;
uniform vec2 u_srcTexel;
uniform float u_finish_bloomThreshold;
void main() {
  vec3 c = vec3(0.0);
  c += texture(u_src, v_uv + u_srcTexel * vec2(-1.0, -1.0)).rgb;
  c += texture(u_src, v_uv + u_srcTexel * vec2( 1.0, -1.0)).rgb;
  c += texture(u_src, v_uv + u_srcTexel * vec2(-1.0,  1.0)).rgb;
  c += texture(u_src, v_uv + u_srcTexel * vec2( 1.0,  1.0)).rgb;
  c *= 0.25;
  float l = max(c.r, max(c.g, c.b));
  float th = u_finish_bloomThreshold;
  float k = smoothstep(th - 0.1, th + 0.25, l);
  fragColor = vec4(c * k, 1.0);
}`;

// ── 5. Final: grading, bloom, aberration, vignette, grid, grain ─────────────
export const FINAL_FRAG = HEADER + /* glsl */ `
uniform sampler2D u_src;
uniform sampler2D u_bloom;
uniform float u_bloomOn;
uniform float u_flipY;
uniform float u_dither;
uniform float u_grainSeed;
uniform float u_finish_exposure, u_finish_contrast, u_finish_saturation, u_finish_hue, u_finish_vignette;
uniform float u_finish_grain, u_finish_grainSize, u_finish_bloom, u_finish_aberration;
uniform float u_finish_gridSize, u_finish_gridOpacity, u_finish_gridDots;
uniform int u_finish_grid;
uniform vec3 u_finish_gridColor;

vec3 hueShift(vec3 c, float a) {
  const mat3 toYIQ = mat3(0.299, 0.596, 0.211, 0.587, -0.274, -0.523, 0.114, -0.322, 0.312);
  const mat3 toRGB = mat3(1.0, 1.0, 1.0, 0.956, -0.272, -1.106, 0.621, -0.647, 1.703);
  vec3 yiq = toYIQ * c;
  yiq.yz = rot2(a) * yiq.yz;
  return toRGB * yiq;
}

float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash12(i), b = hash12(i + vec2(1.0, 0.0));
  float c = hash12(i + vec2(0.0, 1.0)), d = hash12(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void main() {
  vec2 uv = v_uv;
  vec2 frag = gl_FragCoord.xy;
  if (u_flipY > 0.5) { uv.y = 1.0 - uv.y; frag.y = u_res.y - frag.y; }
  vec2 p = toP(uv);

  vec3 col;
  if (u_finish_aberration > 0.001) {
    vec2 dir = uv - 0.5;
    float k = u_finish_aberration * 0.025;
    col.r = texture(u_src, uv + dir * k).r;
    col.g = texture(u_src, uv).g;
    col.b = texture(u_src, uv - dir * k).b;
  } else {
    col = texture(u_src, uv).rgb;
  }
  if (u_bloomOn > 0.5) col += texture(u_bloom, uv).rgb * u_finish_bloom;

  col *= exp2(u_finish_exposure);
  col = (col - 0.5) * u_finish_contrast + 0.5;
  float l = luma(col);
  col = mix(vec3(l), col, u_finish_saturation);
  if (abs(u_finish_hue) > 0.01) col = hueShift(col, radians(u_finish_hue));

  if (u_finish_vignette > 0.001) {
    float vd = length((uv - 0.5) * 2.0) * 0.7071;
    col *= 1.0 - u_finish_vignette * smoothstep(0.25, 1.05, vd);
  }

  if (u_finish_grid == 1) {
    float N = u_finish_gridSize;
    vec2 g = p * N;
    float cellsPerPx = N / u_res.y;
    vec2 fr = fract(g + 0.5) - 0.5;
    vec2 dpx = abs(fr) / cellsPerPx;
    float lw = 0.55 * u_pxScale;
    float lineM = 1.0 - smoothstep(lw - 0.5, lw + 0.5, min(dpx.x, dpx.y));
    float crossL = 7.0 * u_pxScale;
    float cr = max((1.0 - smoothstep(lw, lw + 1.0, dpx.x)) * step(dpx.y, crossL),
                   (1.0 - smoothstep(lw, lw + 1.0, dpx.y)) * step(dpx.x, crossL));
    vec2 gid = floor(g + 0.5);
    float hasDot = step(1.0 - u_finish_gridDots, hash12(gid + 13.1 + u_source_seed));
    float dd = length(fr) / cellsPerPx;
    float dotR = 4.5 * u_pxScale;
    float dotM = hasDot * (1.0 - smoothstep(dotR - 0.75, dotR + 0.75, dd));
    float a = clamp(lineM * u_finish_gridOpacity * 0.55 + cr * u_finish_gridOpacity + dotM, 0.0, 1.0);
    col = mix(col, u_finish_gridColor, a);
  }

  if (u_finish_grain > 0.001) {
    float gs = max(u_finish_grainSize * u_pxScale, 0.5);
    vec2 gp = frag / gs + u_grainSeed * vec2(17.13, 31.71);
    float n = gs <= 1.25 ? hash12(floor(gp)) : vnoise(gp);
    float n2 = gs <= 1.25 ? hash12(floor(gp) + 71.3) : vnoise(gp + 71.3);
    float g = (n + n2 - 1.0) * (gs <= 1.25 ? 1.0 : 1.6);
    float lm = luma(clamp(col, 0.0, 1.0));
    float amt = u_finish_grain * 0.32 * (0.55 + 0.45 * (1.0 - abs(lm * 2.0 - 1.0)));
    col += g * amt;
  }

  col = clamp(col, 0.0, 1.0);
  if (u_dither > 0.5) col += (hash12(frag + 0.71) + hash12(frag + 3.37) - 1.0) / 255.0;
  fragColor = vec4(col, 1.0);
}
`;

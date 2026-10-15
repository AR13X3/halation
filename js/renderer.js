// SPDX-License-Identifier: AGPL-3.0-only
// Copyright (C) 2026 AR13X3 — Halation (https://github.com/AR13X3/halation)
// Orchestrates the render passes. The same code path renders the live preview,
// preset thumbnails and full-resolution exports — only the target size changes.

import { createProgram, startProgram, createTarget, draw } from './gl/gl.js';
import { VERT, FIELD_FRAG, BLUR_FRAG, GLASS_FRAG, SCREEN_FRAG, STREAK_FRAG, BRIGHT_FRAG, FINAL_FRAG, withObjects } from './gl/shaders.js';
import { PARAMS, getPath, uniformName, optionIndex, objectValue, gradientStops, MAX_OBJECTS } from './schema.js';
import { buildPaletteData, hexToRgb, PALETTE_SIZE } from './palette.js';
import { objectUniforms } from './objects.js';

const TAU = Math.PI * 2;

/**
 * Loop angle at `time`: periodic motion (mesh points, object drift, streaks)
 * uses whole multiples of it, so seamless loops stay seamless.
 */
export function loopPhase(anim, time) {
  if (!anim.loop) return time * anim.speed * 0.5;
  const L = Math.max(anim.duration, 0.1);
  const cycles = anim.speed > 0 ? Math.max(1, Math.round((anim.speed * 0.5 * L) / TAU)) : 0;
  return (time / L) * TAU * cycles;
}

const countMaterial = (state, m) => Array.from({ length: state.objects.count }, (_, k) => objectValue(state, k + 1, 'Material')).filter((x) => x === m).length;

// Low-discrepancy sequence for sub-pixel jitter.
function halton(i, base) {
  let f = 1, r = 0;
  for (; i > 0; i = Math.floor(i / base)) { f /= base; r += f * (i % base); }
  return r;
}

export class TargetSet {
  constructor(ctx) {
    this.ctx = ctx;
    this.t = {};
  }
  get(name, w, h, fmt, opts) {
    w = Math.max(1, Math.round(w));
    h = Math.max(1, Math.round(h));
    const cur = this.t[name];
    if (cur && cur.w === w && cur.h === h && cur.fmt === fmt) return cur;
    if (cur) cur.dispose();
    return (this.t[name] = createTarget(this.ctx.gl, w, h, fmt, opts));
  }
  dispose() {
    for (const k in this.t) this.t[k].dispose();
    this.t = {};
  }
}

export class Renderer {
  constructor(ctx) {
    this.ctx = ctx;
    const gl = (this.gl = ctx.gl);
    this.prog = {
      field: createProgram(gl, VERT, FIELD_FRAG, 'field'),
      blur: createProgram(gl, VERT, BLUR_FRAG, 'blur'),
      glass: createProgram(gl, VERT, GLASS_FRAG, 'glass'),
      screen: createProgram(gl, VERT, SCREEN_FRAG, 'screen'),
      streak: createProgram(gl, VERT, STREAK_FRAG, 'streak'),
      bright: createProgram(gl, VERT, BRIGHT_FRAG, 'bright'),
      final: createProgram(gl, VERT, FINAL_FRAG, 'final'),
    };
    // field and glass with the object code: compiled when first needed, or
    // ahead of time in the background (warmObjects)
    this.objPending = null;
    this.objProg = null;

    this.paletteTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.paletteTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.paletteKey = '';

    // one gradient per row, for objects filled with a gradient
    this.objPalTex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, this.objPalTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    this.objPalKey = null;

    this.blackTex = this.solidTexture([0, 0, 0, 255]);
    this.imageTex = this.solidTexture([128, 128, 128, 255]);
    this.imageSize = [1, 1];
    this.hasImage = false;
  }

  solidTexture(rgba) {
    const gl = this.gl;
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array(rgba));
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    return t;
  }

  setImage(img) {
    const gl = this.gl;
    let src = img;
    const max = Math.min(this.ctx.caps.maxTexture, 8192);
    const w = img.naturalWidth || img.width, h = img.naturalHeight || img.height;
    if (w > max || h > max) {
      const k = max / Math.max(w, h);
      const c = document.createElement('canvas');
      c.width = Math.round(w * k);
      c.height = Math.round(h * k);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      src = c;
    }
    if (this.hasImage) gl.deleteTexture(this.imageTex);
    const t = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, t);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, gl.RGBA, gl.UNSIGNED_BYTE, src);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.MIRRORED_REPEAT);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.MIRRORED_REPEAT);
    this.imageTex = t;
    this.imageSize = [src.width || w, src.height || h];
    this.hasImage = true;
  }

  /** Starts compiling the object shaders in the background, if the browser can. */
  warmObjects() {
    if (this.objPending || !this.gl.getExtension('KHR_parallel_shader_compile')) return;
    this.startObjects();
  }

  /**
   * True once the object shaders can be used without waiting: compiled, or
   * nothing to wait for because this browser compiles them on demand anyway.
   */
  objectsReady() {
    if (this.objProg || !this.gl.getExtension('KHR_parallel_shader_compile')) return true;
    const p = this.startObjects();
    return p.field.done() && p.glass.done();
  }

  startObjects() {
    const gl = this.gl;
    this.objPending ??= {
      field: startProgram(gl, VERT, withObjects(FIELD_FRAG), 'field+objects'),
      glass: startProgram(gl, VERT, withObjects(GLASS_FRAG), 'glass+objects'),
    };
    return this.objPending;
  }

  // The field and glass programs a look needs.
  programsFor(state) {
    if (!state.objects.count) return this.prog;
    if (!this.objProg) {
      const p = this.startObjects();
      this.objProg = { field: p.field.finish(), glass: p.glass.finish() };
    }
    return this.objProg;
  }

  updatePalette(stops) {
    const key = JSON.stringify(stops);
    if (key === this.paletteKey) return;
    this.paletteKey = key;
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.paletteTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, PALETTE_SIZE, 1, 0, gl.RGBA, gl.FLOAT, buildPaletteData(stops));
  }

  updateObjectPalettes(state) {
    const rows = Array.from({ length: MAX_OBJECTS }, (_, k) =>
      k < state.objects.count && objectValue(state, k + 1, 'Fill') === 'gradient' ? gradientStops(state, objectValue(state, k + 1, 'Gradient')) : null);
    const key = JSON.stringify(rows);
    if (key === this.objPalKey) return;
    this.objPalKey = key;
    const data = new Float32Array(PALETTE_SIZE * MAX_OBJECTS * 4);
    rows.forEach((stops, k) => { if (stops) data.set(buildPaletteData(stops), k * PALETTE_SIZE * 4); });
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.objPalTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, PALETTE_SIZE, MAX_OBJECTS, 0, gl.RGBA, gl.FLOAT, data);
  }

  // Converts the state into a dictionary of uniform values.
  uniforms(state, time) {
    const U = {};
    for (const p of PARAMS) {
      if (p.uniform === false) continue;
      const v = getPath(state, p.key);
      const name = uniformName(p.key);
      if (p.type === 'select' || p.type === 'chips') U[name] = optionIndex(p, v);
      else if (p.type === 'toggle') U[name] = v ? 1 : 0;
      else if (p.type === 'color') U[name] = hexToRgb(v);
      else U[name] = Number(v);
    }

    const a = state.anim;
    const rate = a.speed * 0.1; // noise-space units per second
    if (a.loop) {
      const L = Math.max(a.duration, 0.1);
      const ang = (time / L) * TAU;
      const R = (rate * L) / TAU;
      U.u_W = [R * Math.cos(ang), R * Math.sin(ang)];
      U.u_cycleOffset = (state.color.cycle * (state.color.mirror ? 2 : 1) * time) / L;
    } else {
      U.u_W = [time * rate, 0];
      U.u_cycleOffset = state.color.cycle * time * 0.05;
    }
    U.u_phase = loopPhase(a, time);
    Object.assign(U, objectUniforms(state, U.u_phase));
    U.u_time = time;
    U.u_grainSeed = state.finish.grainAnim ? Math.floor(time * 24) % 97 : 0;
    U.u_paletteSize = PALETTE_SIZE;
    U.u_zero = 0;
    return U;
  }

  // True when averaging several jittered glass passes improves the image:
  // it removes Monte Carlo noise (frost / streak / dispersion) and antialiases
  // the hard seams between flutes, tiles and facets.
  static needsAccumulation(state) {
    const g = state.glass;
    return g.type !== 'none' || g.backType !== 'none' || countMaterial(state, 'glass') > 0;
  }

  /**
   * Render a frame.
   * @param state   full app state
   * @param set     TargetSet holding intermediates for this output size
   * @param out     { w, h, target }  — target null = the canvas
   * @param opts    time, fieldScale, flipY, dither, dyeTex,
   *                internalScale  resolution of the glass/screen passes relative to the output
   *                samples        Monte Carlo samples per pixel in the glass pass
   *                passes         glass passes averaged in this call (exports)
   *                accum          index of a progressive pass (>0 blends into the previous
   *                               result and reuses the field — used to refine stills)
   */
  render(state, set, out, opts) {
    const { gl, ctx, prog } = this;
    const progs = this.programsFor(state);
    const { w, h } = out;
    const hdr = ctx.caps.hdr;
    const docAspect = state.doc.width / state.doc.height;
    const time = opts.time ?? state.anim.time;
    const scale = Math.min(1, opts.internalScale ?? 1);
    const iw = Math.max(1, Math.round(w * scale));
    const ih = Math.max(1, Math.round(h * scale));
    const accum = opts.accum ?? 0;

    this.updatePalette(state.color.stops);
    this.updateObjectPalettes(state);
    const U = this.uniforms(state, time);
    U.u_aspect = docAspect;

    // 1. field -------------------------------------------------------------
    let fs = opts.fieldScale ?? 0.5;
    // thin lines and crisp edges need the field at full resolution
    if (state.screen.type === 'contour' || ['ribbons', 'threads'].includes(state.source.type) || state.source.form !== 'none' || countMaterial(state, 'solid') > 0) fs = Math.max(fs, 1);
    const maxField = Math.min(ctx.caps.maxTexture, 4096);
    let fw = iw * fs, fh = ih * fs;
    if (Math.max(fw, fh) > maxField) { const k = maxField / Math.max(fw, fh); fw *= k; fh *= k; }
    const mirror = { filter: gl.LINEAR, wrap: gl.MIRRORED_REPEAT };
    const field = set.get('field', fw, fh, hdr, mirror);
    if (accum === 0) {
      field.bind();
      U.u_res = [field.w, field.h];
      U.u_pxScale = field.h / 1080;
      const pf = progs.field.use().apply(U);
      pf.texture('u_palette', 0, this.paletteTex);
      pf.texture('u_dye', 1, opts.dyeTex || this.blackTex);
      pf.texture('u_image', 2, this.imageTex);
      pf.texture('u_objPal', 3, this.objPalTex);
      pf.set('u_imageSize', this.imageSize);
      draw(gl);
    }

    // optional soften
    if (accum === 0 && state.source.blur > 0.001) {
      const tmp = set.get('fieldTmp', field.w, field.h, hdr, mirror);
      const sigma = state.source.blur * state.source.blur * 0.05 * field.h; // in texels
      const step = Math.max(sigma / 2.2, 0.5);
      const pb = prog.blur.use();
      for (let i = 0; i < 2; i++) {
        tmp.bind();
        pb.texture('u_src', 0, field.tex).set('u_dir', [step / field.w, 0]);
        draw(gl);
        field.bind();
        pb.texture('u_src', 0, tmp.tex).set('u_dir', [0, step / field.h]);
        draw(gl);
      }
    }

    U.u_res = [iw, ih];
    U.u_pxScale = ih / 1080;

    // 2. glass (light transport) ------------------------------------------
    // Several passes with different seeds are averaged with constant-alpha
    // blending: pass k contributes 1/(k+1), giving a running mean.
    const glass = set.get('glass', iw, ih, hdr);
    glass.bind();
    const pg = progs.glass.use().apply(U);
    pg.texture('u_field', 0, field.tex).texture('u_palette', 1, this.paletteTex).texture('u_objPal', 2, this.objPalTex);
    pg.set('u_samples', Math.max(1, Math.round(opts.samples ?? 6)));
    const passes = Renderer.needsAccumulation(state) ? Math.max(1, opts.passes ?? 1) : 1;
    for (let k = 0; k < passes; k++) {
      const idx = accum + k;
      pg.set('u_frameSeed', (idx * 7.31) % 113);
      pg.set('u_jitter', idx === 0 ? [0, 0] : [halton(idx, 2) - 0.5, halton(idx, 3) - 0.5]);
      if (idx > 0) {
        gl.enable(gl.BLEND);
        gl.blendColor(0, 0, 0, 1 / (idx + 1));
        gl.blendFunc(gl.CONSTANT_ALPHA, gl.ONE_MINUS_CONSTANT_ALPHA);
      }
      draw(gl);
    }
    gl.disable(gl.BLEND);

    // 3. screen -----------------------------------------------------------
    const screen = set.get('screen', iw, ih, hdr);
    screen.bind();
    prog.screen.use().apply(U).texture('u_src', 0, glass.tex);
    draw(gl);
    let scene = screen;

    // 3b. streaks: three passes, each 8× longer than the last ----------------
    if (state.finish.streak > 0.001) {
      const A = set.get('streakA', iw, ih, hdr);
      const B = set.get('streakB', iw, ih, hdr);
      const len = state.finish.streak ** 1.5;
      const ps = prog.streak.use().apply(U);
      const outs = [A, B, A];
      for (let k = 0; k < 3; k++) {
        outs[k].bind();
        ps.texture('u_src', 0, scene.tex).set('u_len', len / 8 ** (2 - k));
        draw(gl);
        scene = outs[k];
      }
    }

    // 4. bloom ------------------------------------------------------------
    const bloomOn = state.finish.bloom > 0.001;
    let bloomTex = this.blackTex;
    if (bloomOn) {
      const bw = Math.max(1, Math.round(iw / 4)), bh = Math.max(1, Math.round(ih / 4));
      const A = set.get('bloomA', bw, bh, hdr);
      const B = set.get('bloomB', bw, bh, hdr);
      A.bind();
      prog.bright.use().apply(U).set('u_srcTexel', [1 / iw, 1 / ih]).texture('u_src', 0, scene.tex);
      draw(gl);
      const sigma = (0.004 + state.finish.bloomRadius * 0.045) * bh;
      const step = Math.max(sigma / 2.2, 0.5);
      const pb = prog.blur.use();
      for (let i = 0; i < 3; i++) {
        const k = step * (1 + i * 0.6);
        B.bind();
        pb.texture('u_src', 0, A.tex).set('u_dir', [k / bw, 0]);
        draw(gl);
        A.bind();
        pb.texture('u_src', 0, B.tex).set('u_dir', [0, k / bh]);
        draw(gl);
      }
      bloomTex = A.tex;
    }

    // 5. final (always at full output resolution, so grain stays crisp) --
    if (out.target) out.target.bind();
    else {
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, w, h);
    }
    U.u_res = [w, h];
    U.u_pxScale = h / 1080;
    const pfin = prog.final.use().apply(U);
    pfin.set({ u_bloomOn: bloomOn ? 1 : 0, u_flipY: opts.flipY ? 1 : 0, u_dither: opts.dither === false ? 0 : 1 });
    pfin.texture('u_src', 0, scene.tex).texture('u_bloom', 1, bloomTex);
    draw(gl);
  }
}

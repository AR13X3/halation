// Small WebGL2 helper layer: programs with auto-bound uniforms, render targets.

export function createContext(canvas) {
  const gl = canvas.getContext('webgl2', {
    alpha: false,
    antialias: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: 'high-performance',
  });
  if (!gl) return null;

  const colorBufferFloat = !!gl.getExtension('EXT_color_buffer_float');
  const colorBufferHalf = !!gl.getExtension('EXT_color_buffer_half_float');
  const floatLinear = !!gl.getExtension('OES_texture_float_linear');

  const caps = {
    colorBufferFloat,
    floatLinear,
    maxTexture: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    maxRenderbuffer: gl.getParameter(gl.MAX_RENDERBUFFER_SIZE),
    maxViewport: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
  };

  // Pick the best renderable format for intermediate buffers.
  caps.hdr = pickFormat(gl, [
    colorBufferFloat || colorBufferHalf ? { internal: gl.RGBA16F, format: gl.RGBA, type: gl.HALF_FLOAT } : null,
    { internal: gl.RGBA8, format: gl.RGBA, type: gl.UNSIGNED_BYTE },
  ]);
  caps.r = pickFormat(gl, [
    colorBufferFloat ? { internal: gl.R16F, format: gl.RED, type: gl.HALF_FLOAT } : null,
    colorBufferFloat || colorBufferHalf ? { internal: gl.RGBA16F, format: gl.RGBA, type: gl.HALF_FLOAT } : null,
    { internal: gl.RGBA8, format: gl.RGBA, type: gl.UNSIGNED_BYTE },
  ]);
  caps.rg = pickFormat(gl, [
    colorBufferFloat ? { internal: gl.RG16F, format: gl.RG, type: gl.HALF_FLOAT } : null,
    colorBufferFloat || colorBufferHalf ? { internal: gl.RGBA16F, format: gl.RGBA, type: gl.HALF_FLOAT } : null,
    { internal: gl.RGBA8, format: gl.RGBA, type: gl.UNSIGNED_BYTE },
  ]);
  caps.float32 = colorBufferFloat ? pickFormat(gl, [{ internal: gl.RGBA32F, format: gl.RGBA, type: gl.FLOAT }]) : null;
  caps.halfFloat = caps.hdr.type === gl.HALF_FLOAT;

  // Fullscreen triangle.
  const vao = gl.createVertexArray();
  gl.bindVertexArray(vao);
  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);

  return { gl, caps, vao };
}

function pickFormat(gl, candidates) {
  for (const c of candidates) {
    if (!c) continue;
    if (testRenderable(gl, c)) return c;
  }
  return null;
}

function testRenderable(gl, fmt) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texImage2D(gl.TEXTURE_2D, 0, fmt.internal, 4, 4, 0, fmt.format, fmt.type, null);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const ok = gl.checkFramebufferStatus(gl.FRAMEBUFFER) === gl.FRAMEBUFFER_COMPLETE;
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.deleteFramebuffer(fbo);
  gl.deleteTexture(tex);
  return ok;
}

// ── programs ────────────────────────────────────────────────────────────────
export function createProgram(gl, vsSrc, fsSrc, name = 'program') {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSrc, name);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc, name);
  const prog = gl.createProgram();
  gl.attachShader(prog, vs);
  gl.attachShader(prog, fs);
  gl.bindAttribLocation(prog, 0, 'a_pos');
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
    throw new Error(`[${name}] link failed: ${gl.getProgramInfoLog(prog)}`);
  }
  gl.deleteShader(vs);
  gl.deleteShader(fs);

  const uniforms = [];
  const byName = {};
  const n = gl.getProgramParameter(prog, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < n; i++) {
    const info = gl.getActiveUniform(prog, i);
    const uname = info.name.replace(/\[0\]$/, '');
    const u = { name: uname, type: info.type, loc: gl.getUniformLocation(prog, info.name) };
    uniforms.push(u);
    byName[uname] = u;
  }

  return {
    prog,
    name,
    use() { gl.useProgram(prog); return this; },
    has(n) { return n in byName; },
    // Set every active uniform found in the dictionary.
    apply(dict) {
      for (const u of uniforms) {
        if (!(u.name in dict)) continue;
        setUniform(gl, u, dict[u.name]);
      }
      return this;
    },
    set(nameOrObj, value) {
      if (typeof nameOrObj === 'object') return this.apply(nameOrObj);
      const u = byName[nameOrObj];
      if (u) setUniform(gl, u, value);
      return this;
    },
    texture(name, unit, tex) {
      const u = byName[name];
      gl.activeTexture(gl.TEXTURE0 + unit);
      gl.bindTexture(gl.TEXTURE_2D, tex);
      if (u) gl.uniform1i(u.loc, unit);
      return this;
    },
  };
}

function setUniform(gl, u, v) {
  if (typeof v === 'boolean') v = v ? 1 : 0;
  switch (u.type) {
    case gl.FLOAT: gl.uniform1f(u.loc, v); break;
    case gl.FLOAT_VEC2: gl.uniform2f(u.loc, v[0], v[1]); break;
    case gl.FLOAT_VEC3: gl.uniform3f(u.loc, v[0], v[1], v[2]); break;
    case gl.FLOAT_VEC4: gl.uniform4f(u.loc, v[0], v[1], v[2], v[3]); break;
    case gl.INT:
    case gl.BOOL: gl.uniform1i(u.loc, Math.round(v)); break;
    case gl.SAMPLER_2D: gl.uniform1i(u.loc, v); break;
    default: break;
  }
}

function compile(gl, type, src, name) {
  const sh = gl.createShader(type);
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    const lines = src.split('\n').map((l, i) => `${String(i + 1).padStart(4)}: ${l}`).join('\n');
    console.error(`[${name}] shader compile error\n${log}\n${lines}`);
    throw new Error(`[${name}] ${type === gl.VERTEX_SHADER ? 'vertex' : 'fragment'} shader failed: ${log}`);
  }
  return sh;
}

// ── render targets ──────────────────────────────────────────────────────────
export function createTarget(gl, w, h, fmt, { filter = gl.LINEAR, wrap = gl.CLAMP_TO_EDGE } = {}) {
  w = Math.max(1, Math.round(w));
  h = Math.max(1, Math.round(h));
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
  gl.texImage2D(gl.TEXTURE_2D, 0, fmt.internal, w, h, 0, fmt.format, fmt.type, null);
  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, tex, 0);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    gl.deleteFramebuffer(fbo);
    gl.deleteTexture(tex);
    throw new Error(`Could not allocate a ${w}×${h} render target (status ${status}).`);
  }
  return {
    tex, fbo, w, h, fmt,
    bind() {
      gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
      gl.viewport(0, 0, w, h);
    },
    dispose() {
      gl.deleteFramebuffer(fbo);
      gl.deleteTexture(tex);
    },
  };
}

export function createDoubleTarget(gl, w, h, fmt, opts) {
  let a = createTarget(gl, w, h, fmt, opts);
  let b = createTarget(gl, w, h, fmt, opts);
  return {
    get read() { return a; },
    get write() { return b; },
    get w() { return a.w; },
    get h() { return a.h; },
    swap() { const t = a; a = b; b = t; },
    dispose() { a.dispose(); b.dispose(); },
  };
}

export function draw(gl) {
  gl.drawArrays(gl.TRIANGLES, 0, 3);
}

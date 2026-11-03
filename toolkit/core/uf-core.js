/*!
 * Unfiction GFX Toolkit — core
 * Stage, timeline, film-look post-processing, playback controls and MP4 export.
 * Every component draws on a 1920x1080 logical canvas; the stage handles scaling.
 */
(function (global) {
  'use strict';

  const UF = global.UF = global.UF || {};
  UF.version = '1.5.0';
  UF.W = 1920;
  UF.H = 1080;

  /* ------------------------------------------------------------------ */
  /* Theme                                                               */
  /* ------------------------------------------------------------------ */
  UF.theme = {
    colors: {
      black:    '#07080a',
      graphite: '#14171c',
      panel:    '#0c0f13',
      line:     '#2a3038',
      blue:     '#3a6ea5',
      paper:    '#e8e4da',
      dim:      '#8d8a82',
      red:      '#c1121f',
      amber:    '#d9a441',
      green:    '#4caf7a',
      key:      '#00ff00',
    },
    fonts: {
      display: ['Impact', 'Haettenschweiler', 'Arial Narrow', 'Oswald', 'Arial'],
      mono:    'Consolas, "Lucida Console", "Courier New", monospace',
      type:    '"Courier New", Courier, monospace',
      sans:    '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
      serif:   'Georgia, "Times New Roman", serif',
    },
  };

  /** Theme colour by name (or any CSS colour), optionally with alpha. */
  UF.c = function (name, alpha) {
    const hex = UF.theme.colors[name] || name;
    if (alpha === undefined || alpha >= 1) return hex;
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return hex;
    const n = parseInt(hex.slice(1), 16);
    return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${Math.max(0, alpha)})`;
  };

  /** [r, g, b] for a theme name or #rrggbb. */
  UF.rgb = function (name) {
    const hex = UF.theme.colors[name] || name;
    const n = parseInt(String(hex).slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };

  /** Blend two colours (theme names or #rrggbb) by k, with optional alpha. */
  UF.mix = function (a, b, k, alpha = 1) {
    const A = UF.rgb(a), B = UF.rgb(b);
    const m = i => Math.round(A[i] + (B[i] - A[i]) * Math.min(1, Math.max(0, k)));
    return `rgba(${m(0)},${m(1)},${m(2)},${Math.max(0, alpha)})`;
  };

  /* ------------------------------------------------------------------ */
  /* Maths and easing                                                    */
  /* ------------------------------------------------------------------ */
  UF.clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  UF.lerp = (a, b, t) => a + (b - a) * t;
  /** Normalised progress of t through [at, at + dur]. */
  UF.seg = (t, at, dur) => (dur <= 0 ? (t >= at ? 1 : 0) : UF.clamp((t - at) / dur));
  /** Exponential decay pulse that starts at `at`. */
  UF.pulse = (t, at, decay = 10) => (t < at ? 0 : Math.exp(-(t - at) * decay));

  UF.ease = {
    linear:     x => x,
    inQuad:     x => x * x,
    outQuad:    x => 1 - (1 - x) * (1 - x),
    inCubic:    x => x * x * x,
    outCubic:   x => 1 - Math.pow(1 - x, 3),
    inOutCubic: x => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2),
    inExpo:     x => (x <= 0 ? 0 : Math.pow(2, 10 * x - 10)),
    outExpo:    x => (x >= 1 ? 1 : 1 - Math.pow(2, -10 * x)),
    inOutExpo:  x => (x <= 0 ? 0 : x >= 1 ? 1 : x < 0.5 ? Math.pow(2, 20 * x - 10) / 2 : (2 - Math.pow(2, -20 * x + 10)) / 2),
    inOutSine:  x => -(Math.cos(Math.PI * x) - 1) / 2,
    outBack:    x => { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2); },
  };
  UF.easeFn = e => (typeof e === 'function' ? e : UF.ease[e] || UF.ease.inOutCubic);

  /** Seeded random generator (mulberry32). */
  UF.rng = function (seed) {
    let a = seed >>> 0;
    return () => {
      a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  };

  /** Visibility window: fades in at `inAt`, out at `outAt`. Returns 0..1. */
  UF.win = function (t, inAt = 0, outAt = Infinity, fadeIn = 0.4, fadeOut = 0.4) {
    const a = fadeIn > 0 ? UF.ease.outCubic(UF.seg(t, inAt, fadeIn)) : (t >= inAt ? 1 : 0);
    const b = outAt === Infinity ? 1 : fadeOut > 0 ? 1 - UF.ease.inCubic(UF.seg(t, outAt, fadeOut)) : (t < outAt ? 1 : 0);
    return Math.min(a, b);
  };

  /**
   * Base for components. Every option becomes a property; `at` and `out` drive the
   * default visibility window. Subclasses implement draw(ctx, t, fx, scene).
   */
  UF.Component = class {
    constructor(defaults, opts) {
      Object.assign(this, { at: 0, out: Infinity, fadeIn: 0.4, fadeOut: 0.4 }, defaults, opts);
    }
    vis(t) { return UF.win(t, this.at, this.out, this.fadeIn, this.fadeOut); }
  };

  /** Wrap a plain function as a layer: UF.layer((ctx, t, fx, scene) => { ... }). */
  UF.layer = fn => ({ draw: fn });

  UF.canvas = function (w, h) {
    const c = document.createElement('canvas');
    c.width = Math.ceil(w);
    c.height = Math.ceil(h);
    return c;
  };

  /*
   * Images must be embedded as data URLs (tools/embed_images.py writes the file). An image
   * loaded from a file:// path taints the canvas, which breaks the film-look pass and export.
   */
  UF.images = {};
  UF.addImages = function (map) {
    for (const [name, src] of Object.entries(map)) {
      if (!/^data:image\//.test(src)) throw new Error(`Image "${name}" must be a data:image URL — use tools/embed_images.py.`);
      const img = new Image();
      img.src = src;
      UF.images[name] = img;
    }
  };
  UF.imagesReady = () => Promise.all(Object.values(UF.images).map(img => img.decode().catch(() => {})));

  /* ------------------------------------------------------------------ */
  /* Fonts (system only)                                                 */
  /* ------------------------------------------------------------------ */
  function fontAvailable(name) {
    const c = document.createElement('canvas').getContext('2d');
    const s = 'UNFICTION 0123456789 mmmwwwiii';
    for (const base of ['monospace', 'serif']) {
      c.font = `72px ${base}`;
      const a = c.measureText(s).width;
      c.font = `72px "${name}", ${base}`;
      if (Math.abs(c.measureText(s).width - a) > 0.5) return true;
    }
    return false;
  }
  let displayFamily = null;
  function display() {
    if (!displayFamily) displayFamily = UF.theme.fonts.display.find(fontAvailable) || 'Arial';
    return displayFamily;
  }
  UF.font = {
    display: px => `${/impact|haettenschweiler/i.test(display()) ? 'normal' : 'bold'} ${px}px "${display()}", sans-serif`,
    mono:  (px, w = 'normal') => `${w} ${px}px ${UF.theme.fonts.mono}`,
    type:  (px, w = 'normal') => `${w} ${px}px ${UF.theme.fonts.type}`,
    sans:  (px, w = 'normal') => `${w} ${px}px ${UF.theme.fonts.sans}`,
    serif: (px, style = 'normal', w = 'normal') => `${style} ${w} ${px}px ${UF.theme.fonts.serif}`,
  };

  /* ------------------------------------------------------------------ */
  /* Per-frame effects accumulator                                       */
  /* ------------------------------------------------------------------ */
  class FX {
    constructor() {
      this.shakeAmt = 0;
      this.exposure = 1;
      this.rgbAmt = 0;
      this.glitchAmt = 0;
      this.glitchSeed = 0;
      this.slices = 8;
      this.sliceAll = 0;
      this.grain = 0.065;
      this.scan = 1;   // 1 = the channel's fine scanline; a scene may set 0 to drop it
      this.zoom = 1;
    }
    shake(a) { this.shakeAmt += a; return this; }
    flash(a) { this.exposure += a; return this; }
    rgb(a) { this.rgbAmt += a; return this; }
    glitch(a, seed = 1, slices = 8, all = false) {
      if (a > this.glitchAmt) { this.glitchAmt = a; this.glitchSeed = seed; this.slices = slices; this.sliceAll = all ? 1 : 0; }
      return this;
    }
    /** Impact at time `at`: decaying shake / flash / colour split, plus a 2-3 frame glitch. */
    kick(t, at, o = {}) {
      const dt = t - at;
      if (dt < 0 || dt > 2) return this;
      if (this.cues) this.cues.push({ at, o, source: this.source });
      const e = Math.exp(-dt * (o.decay || 14));
      if (o.shake) this.shake(o.shake * e);
      if (o.flash) this.flash(o.flash * e);
      if (o.rgb) this.rgb(o.rgb * e);
      if (o.glitch && dt < (o.glitchDur || 0.05)) this.glitch(o.glitch, Math.floor(at * 997) % 1000 + 1, o.slices || 9);
      return this;
    }
  }
  UF.FX = FX;

  /* ------------------------------------------------------------------ */
  /* Post-processing (WebGL2)                                            */
  /* ------------------------------------------------------------------ */
  const VERT = `#version 300 es
out vec2 vUv;
void main() {
  vec2 p = vec2(float((gl_VertexID << 1) & 2), float(gl_VertexID & 2));
  vUv = p;
  gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
}`;

  const POST = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 outColor;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform float uTime, uZoom, uRGB, uGlitch, uSeed, uSlices, uSliceAll, uGrain, uExposure, uFade, uKey, uVignette, uScan;
uniform vec2 uShake;

float hash12(vec2 p) {
  vec3 p3 = fract(vec3(p.xyx) * 0.1031);
  p3 += dot(p3, p3.yzx + 33.33);
  return fract((p3.x + p3.y) * p3.z);
}
vec3 samp(vec2 uv, vec2 off) {
  float m = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  return vec3(texture(uTex, uv + off).r, texture(uTex, uv).g, texture(uTex, uv - off).b) * m;
}
void main() {
  if (uKey > 0.5) { outColor = vec4(texture(uTex, vUv).rgb, 1.0); return; }
  float A = uRes.x / uRes.y;
  vec2 c = vUv - 0.5;
  if (uGlitch > 0.0) {
    float id = floor((vUv.y + hash12(vec2(uSeed, 1.3)) * 0.25) * uSlices);
    float h = hash12(vec2(id, uSeed));
    float dir = mod(id, 2.0) < 1.0 ? 1.0 : -1.0;
    float amt = uSliceAll > 0.5 ? dir * (0.35 + 0.65 * h) : (h > 0.55 ? (h - 0.775) * 4.0 : 0.0);
    c.x += amt * uGlitch * 0.09;
  }
  c = c / uZoom + uShake;
  vec2 uv = c + 0.5;
  vec2 off = c * (0.0014 + uRGB * 0.010) * 1.6 + vec2(uRGB * 0.004, 0.0);
  vec3 col = samp(uv, off) * uExposure;
  col = col / (1.0 + col * 0.10);
  vec2 vc = (vUv - 0.5) * vec2(A, 1.0);
  col *= mix(1.0 - uVignette, 1.0, smoothstep(1.25, 0.2, length(vc * vec2(0.85, 1.0))));
  col *= 1.0 + uScan * (0.03 * sin(vUv.y * uRes.y * 3.14159265) - 0.03);
  float g = hash12(floor(gl_FragCoord.xy / 1.5) + fract(uTime * 37.0) * vec2(113.1, 71.7)) - 0.5;
  float lum = dot(col, vec3(0.299, 0.587, 0.114));
  col += g * uGrain * (0.4 + 0.6 * (1.0 - clamp(lum, 0.0, 1.0)));
  outColor = vec4(max(col, 0.0) * uFade, 1.0);
}`;

  function makePost(canvas) {
    const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, premultipliedAlpha: false, preserveDrawingBuffer: false });
    if (!gl) return null;
    const sh = (type, src) => {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
      return s;
    };
    const p = gl.createProgram();
    gl.attachShader(p, sh(gl.VERTEX_SHADER, VERT));
    gl.attachShader(p, sh(gl.FRAGMENT_SHADER, POST));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const loc = {};
    for (let i = 0; i < gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); i++) {
      const n = gl.getActiveUniform(p, i).name;
      loc[n] = gl.getUniformLocation(p, n);
    }
    const tex = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, tex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const vao = gl.createVertexArray();
    return {
      draw(src, u) {
        gl.viewport(0, 0, canvas.width, canvas.height);
        gl.useProgram(p);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src);
        gl.uniform1i(loc.uTex, 0);
        gl.uniform2f(loc.uRes, canvas.width, canvas.height);
        for (const k of ['uTime', 'uZoom', 'uRGB', 'uGlitch', 'uSeed', 'uSlices', 'uSliceAll', 'uGrain', 'uExposure', 'uFade', 'uKey', 'uVignette', 'uScan']) gl.uniform1f(loc[k], u[k]);
        gl.uniform2f(loc.uShake, u.uShake[0], u.uShake[1]);
        gl.bindVertexArray(vao);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      },
    };
  }

  /* ------------------------------------------------------------------ */
  /* Stage                                                               */
  /* ------------------------------------------------------------------ */
  const CSS = `
  html, body { margin: 0; height: 100%; background: #000; overflow: hidden; }
  body.uf-playing, body.uf-playing * { cursor: none !important; }
  #uf-wrap { position: absolute; left: 50%; top: 50%; transform: translate(-50%, -50%);
    width: min(100vw, calc(100vh * 16 / 9)); height: min(100vh, calc(100vw * 9 / 16)); background: #000; }
  #uf-wrap canvas { display: block; width: 100%; height: 100%; }
  #uf-hud { position: fixed; left: 18px; bottom: 18px; max-width: 560px; padding: 16px 18px 14px;
    background: rgba(7,8,10,.86); border: 1px solid #2a3038; color: #e8e4da;
    font: 12px/1.6 Consolas, "Courier New", monospace; letter-spacing: .04em; transition: opacity .25s; }
  #uf-hud.hidden { opacity: 0; pointer-events: none; }
  #uf-hud h1 { margin: 0 0 8px; font-size: 12px; letter-spacing: .35em; color: #c1121f; font-weight: normal; }
  #uf-hud table { border-collapse: collapse; width: 100%; }
  #uf-hud td { padding: 1px 10px 1px 0; white-space: nowrap; color: #8d8a82; cursor: pointer; }
  #uf-hud tr.on td { color: #e8e4da; }
  #uf-hud tr:hover td { color: #e8e4da; }
  #uf-hud .keys { margin-top: 10px; color: #8d8a82; }
  #uf-hud .keys b { color: #e8e4da; font-weight: normal; }
  #uf-hud .status { margin-top: 8px; color: #3a6ea5; }
  #uf-hud .status.rec { color: #c1121f; }
  #uf-hud .check { margin-top: 8px; color: #4caf7a; cursor: pointer; }
  #uf-hud .check.warning { color: #d9a441; }
  #uf-hud .check.error { color: #c1121f; }
  #uf-hud .findings { display: none; margin-top: 6px; max-height: 260px; overflow: auto; white-space: normal; }
  #uf-hud .findings.open { display: block; }
  #uf-hud .findings div { margin: 4px 0; color: #e8e4da; }
  #uf-hud .findings .error { color: #c1121f; }
  #uf-hud .findings .warning { color: #d9a441; }
  `;

  const fmt = s => {
    s = Math.max(0, s);
    const m = Math.floor(s / 60), r = s - m * 60;
    return `${String(m).padStart(2, '0')}:${r.toFixed(2).padStart(5, '0')}`;
  };

  /** HH:MM:SS:FF timecode, the format editors type into a timeline. */
  const timecode = (s, fps) => {
    const f = Math.round(Math.max(0, s) * fps), sec = Math.floor(f / fps);
    return [Math.floor(sec / 3600), Math.floor(sec / 60) % 60, sec % 60, f % fps].map(v => String(v).padStart(2, '0')).join(':');
  };

  /** Transition name -> default length in seconds (null: the stage's fadeIn / fadeOut). */
  const TRANSITIONS = { fade: null, cut: 0, glitch: 0.3, wipe: 0.6, flash: 0.45, zoom: 0.6 };
  const RULES = ['missing-source', 'unlabelled-recreation', 'untagged-illustration', 'stamp-near-person'];
  /** Words that state guilt; on screen with a real person they need a conviction behind them. */
  const LOADED = /\b(FAKE|GUILTY|FRAUD|FRAUDSTER|FRAUDULENT|SCAM|SCAMMER|LIAR|CRIMINAL|THIEF|CROOK|CON ?MAN)\b/i;
  /** Labels under which a graphic is understood as illustrative, so it needs no source. */
  const EXEMPT = /ILLUSTRATION|DRAMATI[SZ]ATION/i;

  class Stage {
    /**
     * @param {object} o
     * @param {Array}  o.scenes   [{ id, title, duration, layers: [component...] } | { ..., render(ctx, t, fx, scene) }]
     * @param {string} [o.title]  Shown in the HUD and used for export filenames.
     * @param {number} [o.gap=1]  Seconds of pure black between scenes.
     * @param {number} [o.lead=0.6] Black before the first scene.
     * @param {number} [o.tail=1]   Black after the last scene.
     * @param {number} [o.fps=60]
     *
     * Scene options besides id / title / duration / layers:
     *   transition  'fade' | 'cut' | 'glitch' | 'wipe' | 'flash' | 'zoom', or { in, out, dur } (dur may be { in, out })
     *   pushIn      slow camera push across the scene (default o.pushIn)
     *   factual     true: the scene states facts even if no layer says so; false: skip the source check
     *   source      a source cited somewhere other than a SourceTag (e.g. read out in the voice-over)
     *   label       a RECREATION / ILLUSTRATION label shown outside the toolkit (e.g. burnt into footage)
     *   ignore      editorial rule ids to skip for this scene, e.g. ['missing-source']
     */
    constructor(o) {
      this.o = Object.assign({ title: 'UNFICTION', slug: 'unfiction', gap: 1, lead: 0.6, tail: 1, fps: 60, fadeIn: 0.35, fadeOut: 0.35, pushIn: 0.03, vignette: 0.5, grain: 0.065 }, o);
      const q = this.params = new URLSearchParams(location.search);
      this.scale = UF.clamp(parseFloat(q.get('scale') || '1'), 0.5, 2);
      this.key = q.has('key');
      this.loop = q.has('loop');
      this.scenes = this.o.scenes.map((s, i) => {
        const sc = Object.assign({ index: i, pushIn: this.o.pushIn }, s);
        sc.tr = this.parseTransition(sc);
        for (const r of [].concat(sc.ignore || [])) {
          if (!RULES.includes(r)) throw new Error(`Scene "${sc.id}": ignore lists unknown rule "${r}" — use ${RULES.join(', ')}.`);
        }
        return sc;
      });
      this.solo = q.has('scene') ? UF.clamp(parseInt(q.get('scene'), 10) - 1, 0, this.scenes.length - 1) : null;
      this.layout();

      const style = document.createElement('style');
      style.textContent = CSS;
      document.head.appendChild(style);
      document.title = `${this.o.title} — GFX`;

      this.wrap = document.createElement('div');
      this.wrap.id = 'uf-wrap';
      this.canvas = UF.canvas(UF.W * this.scale, UF.H * this.scale);
      this.wrap.appendChild(this.canvas);
      document.body.appendChild(this.wrap);

      this.comp = UF.canvas(UF.W * this.scale, UF.H * this.scale);
      this.ctx = this.comp.getContext('2d');

      try { this.post = makePost(this.canvas); } catch (e) { console.error(e); this.post = null; }
      if (!this.post) this.out2d = this.canvas.getContext('2d');

      this.buildHud();
      this.bindKeys();

      this.t = 0;
      this.playing = false;
      this.last = 0;
      this.frozen = q.has('frame') ? parseFloat(q.get('frame')) : null;
      if (this.frozen !== null) {
        this.hud.classList.add('hidden');
        this.t = this.solo !== null ? this.o.lead + this.frozen : this.frozen;
      }
      for (const s of this.scenes) for (const l of s.layers || []) if (l.setup) l.setup(this);
      this.showFindings(this.check());

      // Decoding runs on real time, which headless virtual time does not wait for; check and cues need no pixels.
      const textOnly = (q.has('check') || q.has('cues')) && !q.has('sheet') && !q.has('thumb') && !q.has('perf');
      (textOnly ? Promise.resolve() : UF.imagesReady()).then(() => {
        const reports = { check: () => JSON.stringify(this.checkReport(), null, 2), cues: () => this.cuesCsv(),
          sheet: () => this.contactSheet(parseInt(q.get('sheet'), 10) || 4), thumb: () => this.thumbnail(),
          perf: () => JSON.stringify(this.perfReport(parseInt(q.get('perf'), 10) || 12), null, 2) };
        const asked = Object.keys(reports).filter(k => q.has(k));
        if (asked.length) {
          // Report pages are read by the tools/ scripts, so they draw one frame and do not animate.
          for (const k of asked) this.writeReport(`uf-${k}`, reports[k]);
          this.hud.classList.add('hidden');
          this.render(this.t);
          return;
        }
        requestAnimationFrame(ts => this.frame(ts));
        if (q.has('autoplay') && this.frozen === null) this.play();
      });
    }

    /** { in: { type, dur }, out: { type, dur } } from a scene's `transition` option. */
    parseTransition(s) {
      const spec = s.transition ?? 'fade';
      const o = typeof spec === 'string' ? { in: spec, out: spec } : spec;
      if (!o || typeof o !== 'object') throw new Error(`Scene "${s.id}": transition must be a name or { in, out, dur }.`);
      const bad = Object.keys(o).filter(k => !['in', 'out', 'dur'].includes(k));
      if (bad.length) throw new Error(`Scene "${s.id}": transition has unknown key "${bad[0]}" — use in, out, dur.`);
      const perEnd = o.dur != null && typeof o.dur === 'object';
      if (perEnd) {
        const badDur = Object.keys(o.dur).filter(k => !['in', 'out'].includes(k));
        if (badDur.length) throw new Error(`Scene "${s.id}": transition dur has unknown key "${badDur[0]}" — use in, out.`);
      }
      const side = (type, which) => {
        type = type ?? 'fade';
        if (!(type in TRANSITIONS)) throw new Error(`Scene "${s.id}": unknown transition "${type}" — use ${Object.keys(TRANSITIONS).join(', ')}.`);
        const want = perEnd ? o.dur[which] : o.dur;
        const dur = type === 'cut' ? 0 : want ?? TRANSITIONS[type] ?? (which === 'in' ? this.o.fadeIn : this.o.fadeOut);
        if (typeof dur !== 'number' || !(dur >= 0)) throw new Error(`Scene "${s.id}": the ${which} transition length must be a number of seconds, not ${JSON.stringify(dur)}.`);
        if (dur > s.duration / 2) throw new Error(`Scene "${s.id}": the ${which} transition lasts ${dur}s, more than half the scene.`);
        return { type, dur };
      };
      return { in: side(o.in, 'in'), out: side(o.out, 'out') };
    }

    /** Runs fn and puts its text in a hidden <pre id> for the command-line tools; failures are written there too. */
    writeReport(id, fn) {
      const pre = document.createElement('pre');
      pre.id = id;
      pre.hidden = true;
      try { pre.textContent = fn(); } catch (e) { console.error(e); pre.textContent = `ERROR: ${e.message}`; }
      document.body.appendChild(pre);
    }

    layout() {
      let t = this.o.lead;
      const list = this.solo !== null ? [this.scenes[this.solo]] : this.scenes;
      for (const s of this.scenes) { s.start = null; s.end = null; }
      list.forEach((s, i) => {
        s.start = t;
        s.end = t + s.duration;
        t = s.end + (i < list.length - 1 ? this.o.gap : 0);
      });
      this.active = list;
      this.total = t + this.o.tail;
    }

    locate(T) {
      for (const s of this.active) if (T >= s.start && T < s.end) return { scene: s, t: T - s.start };
      return null;
    }

    /* ---------------- HUD ---------------- */
    buildHud() {
      const hud = this.hud = document.createElement('div');
      hud.id = 'uf-hud';
      const rows = this.scenes.map((s, i) =>
        `<tr data-i="${i}"><td>${String(i + 1).padStart(2, '0')}</td><td>${s.title || s.id}</td><td>${s.start !== null ? fmt(s.start) : '—'}</td><td>${s.duration.toFixed(1)}s</td></tr>`).join('');
      hud.innerHTML = `<h1>${this.o.title}</h1><table>${rows}</table>
        <div class="keys"><b>SPACE</b> play/pause · <b>R</b> restart · <b>← →</b> scene · <b>1-9</b> jump<br>
        <b>E</b> export ${this.solo !== null ? 'this scene' : 'all as one'} · <b>SHIFT+E</b> export each scene · <b>S</b> still · <b>F</b> fullscreen · <b>H</b> hide<br>
        <b>T</b> thumbnail · <b>C</b> cue sheet · <b>K</b> editorial check</div>
        <div class="check"></div><div class="findings"></div>
        <div class="status"></div>`;
      hud.querySelectorAll('tr').forEach(tr => tr.addEventListener('click', () => this.jump(+tr.dataset.i)));
      document.body.appendChild(hud);
      this.status = hud.querySelector('.status');
      this.checkLine = hud.querySelector('.check');
      this.findingsBox = hud.querySelector('.findings');
      this.checkLine.addEventListener('click', () => this.findingsBox.classList.toggle('open'));
      this.setStatus(`${fmt(0)} / ${fmt(this.total)}${this.solo !== null ? `  ·  solo scene ${this.solo + 1}` : ''}`);
    }
    showFindings(list) {
      this.findings = list;
      const errors = list.filter(f => f.level === 'error').length, warnings = list.length - errors;
      const esc = s => String(s).replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
      this.checkLine.className = `check${errors ? ' error' : warnings ? ' warning' : ''}`;
      this.checkLine.textContent = list.length
        ? `EDITORIAL CHECK · ${errors} error${errors === 1 ? '' : 's'} · ${warnings} warning${warnings === 1 ? '' : 's'} — K for details`
        : 'EDITORIAL CHECK · clean';
      this.findingsBox.innerHTML = list.map(f =>
        `<div><span class="${f.level}">${f.level.toUpperCase()}</span> ${String(f.scene).padStart(2, '0')} ${esc(f.id)} · ${f.rule} — ${esc(f.message)}</div>`).join('');
      for (const f of list) console[f.level === 'error' ? 'error' : 'warn'](`Editorial ${f.level}: scene ${f.scene} (${f.id}) · ${f.rule} — ${f.message}`);
    }
    setStatus(text, rec) {
      this.status.textContent = text;
      this.status.classList.toggle('rec', !!rec);
    }
    showHud(show) {
      if (this.recording) show = false;
      this.hud.classList.toggle('hidden', !show);
    }

    /* ---------------- Controls ---------------- */
    bindKeys() {
      this.canvas.addEventListener('click', () => this.toggle());
      window.addEventListener('keydown', e => {
        if (this.recording && e.key !== 'Escape') return;
        const k = e.key;
        if (k === ' ') { e.preventDefault(); this.toggle(); }
        else if (k === 'r' || k === 'R') { this.seek(0); this.play(); }
        else if (k === 'ArrowRight') this.step(1);
        else if (k === 'ArrowLeft') this.step(-1);
        else if (/^[1-9]$/.test(k)) this.jump(+k - 1);
        else if (k === 'f' || k === 'F') this.fullscreen();
        else if (k === 'h' || k === 'H') this.hudPinned = this.hud.classList.contains('hidden') ? (this.showHud(true), true) : (this.showHud(false), false);
        else if (k === 's' || k === 'S') this.wantStill = true;
        else if (k === 't' || k === 'T') this.saveThumbnail();
        else if (k === 'c' || k === 'C') this.saveCues();
        else if (k === 'k' || k === 'K') { this.showHud(true); this.hudPinned = true; this.findingsBox.classList.toggle('open'); }
        else if (k === 'E') this.exportEach();
        else if (k === 'e') this.exportAll();
        else if (k === 'Escape' && this.recording) this.cancelRecording = true;
      });
      document.addEventListener('fullscreenchange', () => {});
    }
    toggle() { this.playing ? this.pause() : this.play(); }
    play() {
      if (this.t >= this.total) this.t = 0;
      this.playing = true;
      this.last = performance.now();
      document.body.classList.add('uf-playing');
      if (!this.hudPinned) this.showHud(false);
    }
    pause() {
      this.playing = false;
      document.body.classList.remove('uf-playing');
      this.showHud(true);
    }
    seek(T) { this.t = UF.clamp(T, 0, this.total); this.last = performance.now(); }
    jump(i) {
      const s = this.scenes[i];
      if (!s) return;
      if (s.start === null) {
        const url = new URL(location.href);
        url.searchParams.set('scene', i + 1);
        location.href = url.toString();
        return;
      }
      this.seek(Math.max(0, s.start - 0.3));
    }
    step(dir) {
      const starts = this.active.map(s => s.start);
      const cur = this.t + 0.31;
      let target = dir > 0 ? starts.find(s => s > cur) : [...starts].reverse().find(s => s < this.t - 0.5);
      if (target === undefined) target = dir > 0 ? this.total : 0;
      this.seek(Math.max(0, target - 0.3));
    }
    fullscreen() {
      if (document.fullscreenElement) document.exitFullscreen();
      else document.documentElement.requestFullscreen();
    }

    /* ---------------- Render ---------------- */
    frame(ts) {
      if (this.frozen !== null) {
        this._stillFrames = (this._stillFrames || 0) + 1;
        if (this._stillFrames > 3) return;
      }
      requestAnimationFrame(n => this.frame(n));
      if (this.playing && this.frozen === null) {
        this.t += (ts - this.last) / 1000;
        this.last = ts;
        if (this.stopAt !== undefined && this.t >= this.stopAt) { this.t = this.stopAt; this.finishRecording(); }
        else if (this.t >= this.total) {
          if (this.loop) this.t = 0;
          else { this.t = this.total; this.pause(); }
        }
      }
      this.render(this.t);
      if (!this.recording && this.playing) this.setStatus(`${fmt(this.t)} / ${fmt(this.total)}`);
      const hit = this.locate(this.t);
      const idx = hit ? hit.scene.index : -1;
      if (idx !== this._hudIdx) {
        this._hudIdx = idx;
        this.hud.querySelectorAll('tr').forEach(tr => tr.classList.toggle('on', +tr.dataset.i === idx));
      }
      if (this.wantStill) { this.wantStill = false; this.saveStill(); }
    }

    render(T) {
      const ctx = this.ctx;
      const hit = this.locate(T);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = this.key ? UF.theme.colors.key : '#000';
      ctx.fillRect(0, 0, this.comp.width, this.comp.height);

      const fx = new FX();
      fx.grain = this.grainOverride ?? this.o.grain;
      let fade = 0;
      if (hit) {
        const s = hit.scene, t = hit.t;
        fx.zoom = 1 + (s.pushIn || 0) * UF.ease.inOutSine(UF.clamp(t / s.duration));
        ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
        ctx.save();
        this.drawScene(ctx, s, t, fx);
        ctx.restore();
        fade = this.key ? 1 : this.transition(ctx, s, t, fx);
      }

      if (this.key) fade = hit ? 1 : 0;
      if (this.post) {
        const sx = fx.shakeAmt * (Math.sin(T * 97.3) + 0.5 * Math.sin(T * 211.1));
        const sy = fx.shakeAmt * (Math.cos(T * 83.7) + 0.5 * Math.sin(T * 173.3));
        this.post.draw(this.comp, {
          uTime: T, uZoom: fx.zoom, uRGB: fx.rgbAmt, uGlitch: fx.glitchAmt, uSeed: fx.glitchSeed, uSlices: fx.slices,
          uSliceAll: fx.sliceAll, uGrain: fx.grain, uExposure: fx.exposure, uFade: fade, uKey: this.key ? 1 : 0, uScan: fx.scan,
          uVignette: this.o.vignette, uShake: [sx, sy],
        });
      } else {
        const o = this.out2d;
        o.globalAlpha = 1;
        o.fillStyle = '#000';
        o.fillRect(0, 0, this.canvas.width, this.canvas.height);
        o.globalAlpha = fade;
        o.drawImage(this.comp, 0, 0);
      }
    }

    /**
     * Milliseconds to draw each scene at n points through it, without the film-look pass, for
     * tools/perf.py. Export runs in real time, so a scene that cannot draw inside one frame drops frames.
     */
    perfReport(n) {
      // Its own canvas, kept in software from the start: a canvas that is read back often gets moved
      // from the GPU to software part-way through, which would time early and late scenes differently.
      const cv = UF.canvas(this.comp.width, this.comp.height);
      const ctx = cv.getContext('2d', { willReadFrequently: true }), rows = [];
      const draw = T => {
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = 1;
        ctx.globalCompositeOperation = 'source-over';
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, cv.width, cv.height);
        const hit = this.locate(T);
        if (hit) {
          ctx.setTransform(this.scale, 0, 0, this.scale, 0, 0);
          ctx.save();
          this.drawScene(ctx, hit.scene, hit.t, new FX());
          ctx.restore();
        }
        ctx.getImageData(0, 0, 1, 1);
      };
      let floor = 0;
      for (let i = 0; i < 6; i++) { const a = performance.now(); draw(-1); if (i) floor += (performance.now() - a) / 5; }
      for (const s of this.active) {
        const ms = [];
        for (let k = 0; k < n; k++) {
          const T = s.start + (k + 0.5) * s.duration / n;
          draw(T);
          const a = performance.now();
          draw(T);
          ms.push(performance.now() - a);
        }
        const worst = ms.indexOf(Math.max(...ms));
        rows.push({ scene: s.index + 1, id: s.id, mean: ms.reduce((p, q) => p + q, 0) / n, max: ms[worst],
          at: (worst + 0.5) * s.duration / n });
      }
      return { title: this.o.title, samples: n, floor, rows };
    }

    /** Draws a scene's layers at scene time t; fx.source names the layer, for the cue sheet. */
    drawScene(ctx, s, t, fx) {
      const scene = Object.assign({ key: this.key, stage: this }, s);
      if (s.render) { fx.source = s.id; s.render(ctx, t, fx, scene); return; }
      for (const l of s.layers || []) {
        fx.source = l.constructor === Object ? s.id : l.constructor.name;
        ctx.save();
        l.draw(ctx, t, fx, scene);
        ctx.restore();
      }
    }

    /** Applies the scene's in and out transitions at scene time t and returns the picture's fade (0..1). */
    transition(ctx, s, t, fx) {
      const { in: a, out: b } = s.tr;
      const pin = a.dur > 0 ? UF.clamp(t / a.dur) : 1;
      const pout = b.dur > 0 ? UF.clamp((s.duration - t) / b.dur) : 1;
      return Math.min(this.edge(ctx, a.type, pin, t, fx, 'in'), this.edge(ctx, b.type, pout, t, fx, 'out'));
    }

    /** One side of a transition; p runs 0 -> 1 as the picture arrives, and 1 -> 0 as it leaves. */
    edge(ctx, type, p, t, fx, side) {
      if (p >= 1 || type === 'cut') return 1;
      const E = UF.ease, k = 1 - p;
      if (type === 'fade') return E.outCubic(p);
      if (type === 'zoom') {
        fx.zoom *= 1 + (side === 'in' ? 0.2 : 0.25) * (1 - E.outCubic(p));
        return E.outCubic(p);
      }
      if (type === 'glitch') {
        fx.glitch(0.9 * k, 1 + Math.floor(t * 24) % 997, 14, true);
        fx.rgb(k);
        return UF.clamp(p * 3);
      }
      if (type === 'flash') {
        fx.rgb(0.5 * k);
        ctx.fillStyle = `rgba(255,255,255,${k * k})`;
        ctx.fillRect(0, 0, UF.W, UF.H);
        return 1;
      }
      const x = E.inOutCubic(side === 'in' ? p : k) * (UF.W + 60) - 30;
      ctx.fillStyle = '#000';
      if (side === 'in') ctx.fillRect(x, 0, UF.W - x, UF.H);
      else ctx.fillRect(0, 0, x, UF.H);
      ctx.fillStyle = UF.c('red');
      ctx.fillRect(x - 2, 0, 4, UF.H);
      return 1;
    }

    /* ---------------- Stills and export ---------------- */
    saveStill() {
      const hit = this.locate(this.t);
      const name = `${this.o.slug}-${hit ? `${String(hit.scene.index + 1).padStart(2, '0')}-${hit.scene.id}` : 'frame'}-${this.t.toFixed(2)}s.png`;
      const a = document.createElement('a');
      a.href = this.canvas.toDataURL('image/png');
      a.download = name;
      a.click();
    }

    pickMime() {
      const list = ['video/mp4;codecs=avc1.640033', 'video/mp4;codecs=avc1.4d0033', 'video/mp4;codecs=avc1', 'video/mp4',
        'video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm'];
      return list.find(m => window.MediaRecorder && MediaRecorder.isTypeSupported(m)) || '';
    }

    record(from, to, filename) {
      return new Promise(resolve => {
        const mime = this.pickMime();
        if (!mime) { alert('This browser cannot record video. Use a recent Chrome or Edge.'); resolve(); return; }
        const ext = mime.startsWith('video/mp4') ? 'mp4' : 'webm';
        const stream = this.canvas.captureStream(this.o.fps);
        const rec = new MediaRecorder(stream, { mimeType: mime, videoBitsPerSecond: Math.round(40e6 * this.scale * this.scale) });
        const chunks = [];
        rec.ondataavailable = e => { if (e.data && e.data.size) chunks.push(e.data); };
        rec.onstop = () => {
          stream.getTracks().forEach(tr => tr.stop());
          if (!this.cancelRecording) {
            const a = document.createElement('a');
            a.href = URL.createObjectURL(new Blob(chunks, { type: mime }));
            a.download = `${filename}.${ext}`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 4000);
          }
          resolve();
        };
        this.recording = true;
        this.showHud(false);
        this.seek(from);
        this.stopAt = to;
        this._finish = () => rec.state !== 'inactive' && rec.stop();
        this.render(from);
        rec.start(250);
        this.play();
      });
    }
    finishRecording() {
      this.stopAt = undefined;
      this.playing = false;
      document.body.classList.remove('uf-playing');
      if (this._finish) this._finish();
    }
    async exportAll() {
      if (this.recording) return;
      this.cancelRecording = false;
      const name = this.solo !== null ? `${this.o.slug}-${String(this.solo + 1).padStart(2, '0')}-${this.scenes[this.solo].id}` : `${this.o.slug}-all-scenes`;
      this.setStatus('● RECORDING — press ESC to cancel', true);
      await this.record(0, this.total, name);
      this.endExport();
    }
    async exportEach() {
      if (this.recording) return;
      this.cancelRecording = false;
      for (const s of this.active) {
        if (this.cancelRecording) break;
        this.setStatus(`● RECORDING scene ${s.index + 1}/${this.scenes.length} — ESC to cancel`, true);
        await this.record(Math.max(0, s.start - 0.25), Math.min(this.total, s.end + 0.25), `${this.o.slug}-${String(s.index + 1).padStart(2, '0')}-${s.id}`);
        await new Promise(r => setTimeout(r, 400));
      }
      this.endExport();
    }
    endExport() {
      this.recording = false;
      this.setStatus(this.cancelRecording ? 'Export cancelled.' : 'Export finished — check your Downloads folder.');
      this.pause();
    }
    download(href, name, revoke) {
      const a = document.createElement('a');
      a.href = href;
      a.download = name;
      a.click();
      if (revoke) setTimeout(() => URL.revokeObjectURL(href), 4000);
    }

    /* ---------------- Editorial check ---------------- */
    /**
     * Reads each layer's editorial() metadata. Returns [{ level: 'error' | 'warning', rule, scene, id, message }].
     * Metadata keys: factual, source, sourced, recreation, illustration, label, sceneLabel, person, status,
     * stamps (full-frame), personStamps (on a person's photo), cardStamps (on another card beside one).
     */
    check() {
      const out = [];
      for (const s of this.scenes) {
        const ignore = new Set([].concat(s.ignore || []));
        const add = (level, rule, message) => { if (!ignore.has(rule)) out.push({ level, rule, scene: s.index + 1, id: s.id, message }); };
        const metas = (s.layers || []).map(l => ({
          name: l.constructor.name,
          m: (typeof l.editorial === 'function' && l.editorial()) || {},
          from: l.at ?? 0, to: (l.out ?? Infinity) + (l.fadeOut || 0),
        }));
        const sceneLabel = s.label || (metas.find(x => x.m.sceneLabel) || { m: {} }).m.sceneLabel || '';
        const cited = !!s.source || metas.some(x => x.m.source);
        const labelled = x => !!(x.m.label || sceneLabel);
        const exempt = x => EXEMPT.test(`${x.m.label || ''} ${sceneLabel}`);
        const names = list => [...new Set(list.map(x => x.name))].join(', ');

        if (s.factual !== false && !cited) {
          const bare = metas.filter(x => x.m.factual && !x.m.sourced && !exempt(x));
          if (bare.length) add('warning', 'missing-source', `${names(bare)} ${bare.length > 1 ? 'show' : 'shows'} facts but the scene cites no source — add a SourceTag, a note on the layer, or the scene's source option.`);
          else if (s.factual === true && !EXEMPT.test(sceneLabel)) add('warning', 'missing-source', 'The scene is marked factual but cites no source — add a SourceTag or the scene\'s source option.');
        }
        for (const x of metas) {
          if (x.m.recreation && !labelled(x)) add('error', 'unlabelled-recreation', `${x.name} recreates material rather than showing the original — give it a RECREATION or ILLUSTRATION label, or add a DramaLabel.`);
          if (x.m.illustration && !labelled(x)) add('warning', 'untagged-illustration', `${x.name} is illustrative — label it ILLUSTRATION so it is not taken for the real thing.`);
        }
        const persons = metas.filter(x => x.m.person);
        const verdict = st => (LOADED.test(st) ? ', and the word reads as a verdict on them — keep it to a conviction, and away from the face' : ' — check it cannot be read as a verdict on them');
        for (const x of metas) {
          for (const st of x.m.personStamps || []) add(LOADED.test(st) ? 'error' : 'warning', 'stamp-near-person', `A stamp reading "${st}" is on a person's photo in ${x.name}${verdict(st)}.`);
          const near = persons.filter(p => p === x || (p.from < x.to && x.from < p.to));
          if (!near.length) continue;
          const who = names(near);
          for (const st of x.m.stamps || []) add(LOADED.test(st) ? 'error' : 'warning', 'stamp-near-person', `A stamp reading "${st}" (${x.name}) is on screen with a real person (${who})${verdict(st)}.`);
          for (const st of x.m.cardStamps || []) {
            if (LOADED.test(st)) add('warning', 'stamp-near-person', `A card stamped "${st}" in ${x.name} shares the board with a person — check it cannot be read as a verdict on them.`);
          }
        }
      }
      return out;
    }
    checkReport() {
      const f = this.check();
      const errors = f.filter(x => x.level === 'error').length;
      return { title: this.o.title, version: UF.version, scenes: this.scenes.length, errors, warnings: f.length - errors, findings: f };
    }

    /* ---------------- Cue sheet ---------------- */
    /** Every impact the scenes fire, plus glitch and flash transitions, in reel order. */
    collectCues() {
      const cv = UF.canvas(UF.W / 4, UF.H / 4), ctx = cv.getContext('2d');
      const rows = [];
      for (const s of this.active) {
        const seen = new Map();
        const times = [];
        // A kick stays live for 2 s after it fires, so sampling every 0.2 s sees each one; its exact time comes from the kick.
        for (let i = 0; i * 0.2 < s.duration; i++) times.push(i * 0.2);
        times.push(Math.max(0, s.duration - 0.001));
        for (const t of times) {
          const fx = new FX();
          fx.cues = [];
          ctx.setTransform(0.25, 0, 0, 0.25, 0, 0);
          ctx.save();
          this.drawScene(ctx, s, t, fx);
          ctx.restore();
          for (const c of fx.cues) {
            const key = `${c.source}|${c.at.toFixed(3)}|${JSON.stringify(c.o)}`;
            if (!seen.has(key)) seen.set(key, c);
          }
        }
        const list = [...seen.values()].filter(c => c.at >= 0 && c.at < s.duration).map(c => Object.assign({ at: c.at, source: c.source }, this.cueKind(c.o)));
        for (const [side, tr] of [['in', s.tr.in], ['out', s.tr.out]]) {
          if (tr.type === 'glitch' || tr.type === 'flash') list.push({ at: side === 'in' ? 0 : s.duration - tr.dur, type: tr.type.toUpperCase(), strength: 'medium', source: `${side} transition` });
        }
        const fileStart = Math.max(0, s.start - 0.25);
        for (const c of list) rows.push({ reel: s.start + c.at, scene: s.index + 1, id: s.id, t: c.at, file: s.start - fileStart + c.at, type: c.type, strength: c.strength, source: c.source });
      }
      return rows.sort((p, q) => p.reel - q.reel || p.scene - q.scene);
    }
    /** GLITCH / IMPACT / HIT / FLASH / ACCENT and soft / medium / hard, from a kick's options. */
    cueKind(o) {
      const flash = (o.flash || 0) >= 0.1;
      const type = o.glitch ? 'GLITCH' : o.shake && flash ? 'IMPACT' : o.shake ? 'HIT' : flash ? 'FLASH' : 'ACCENT';
      const k = Math.max((o.shake || 0) / 0.012, (o.flash || 0) / 0.35, (o.rgb || 0) / 0.8, (o.glitch || 0) / 0.8);
      return { type, strength: k >= 0.75 ? 'hard' : k >= 0.4 ? 'medium' : 'soft' };
    }
    cuesCsv() {
      const q = v => (/[",\n]/.test(String(v)) ? `"${String(v).replace(/"/g, '""')}"` : v);
      const lines = ['reel_seconds,reel_tc,scene,scene_id,scene_time,each_file_seconds,type,strength,source'];
      for (const r of this.collectCues()) {
        lines.push([r.reel.toFixed(3), timecode(r.reel, this.o.fps), r.scene, q(r.id), r.t.toFixed(3), r.file.toFixed(3), r.type, r.strength, q(r.source)].join(','));
      }
      return `${lines.join('\n')}\n`;
    }
    saveCues() {
      this.setStatus('Collecting cues…');
      setTimeout(() => {
        const csv = this.cuesCsv();
        this.download(URL.createObjectURL(new Blob([csv], { type: 'text/csv' })), `${this.o.slug}-cues.csv`, true);
        this.setStatus(`Cue sheet saved — ${csv.trim().split('\n').length - 1} cues.`);
      }, 30);
    }

    /* ---------------- Contact sheet ---------------- */
    /** JPEG data URL with n frames of every scene, one row per scene, for checking a reel at a glance. */
    contactSheet(n = 4) {
      n = UF.clamp(Math.round(n), 1, 12);
      const tw = 480, th = 270, pad = 18, rowHead = 34, head = 84;
      const list = this.active;
      const sheet = UF.canvas(pad + n * (tw + pad), head + list.length * (rowHead + th + pad));
      const x = sheet.getContext('2d');
      const half = UF.canvas(UF.W / 2, UF.H / 2), hx = half.getContext('2d');
      const fit = (text, maxW) => {
        let s = String(text);
        if (x.measureText(s).width <= maxW) return s;
        while (s.length > 1 && x.measureText(`${s}…`).width > maxW) s = s.slice(0, -1);
        return `${s}…`;
      };
      x.fillStyle = '#0b0c0e';
      x.fillRect(0, 0, sheet.width, sheet.height);
      x.font = UF.font.mono(22, 'bold');
      x.fillStyle = UF.c('paper');
      x.fillText(fit(this.o.title, sheet.width - pad * 2), pad, 44);
      x.font = UF.font.mono(15);
      x.fillStyle = UF.c('dim');
      x.fillText(`${list.length} scene${list.length === 1 ? '' : 's'} · ${n} frame${n === 1 ? '' : 's'} each · reel ${fmt(this.total)} · toolkit ${UF.version}`, pad, 68);
      list.forEach((s, r) => {
        const y = head + r * (rowHead + th + pad);
        x.font = UF.font.mono(14);
        const info = `${s.id} · ${s.duration.toFixed(1)}s · ${s.tr.in.type} in / ${s.tr.out.type} out`;
        const infoW = x.measureText(info).width;
        x.fillStyle = UF.c('dim');
        x.textAlign = 'right';
        x.fillText(info, sheet.width - pad, y + 22);
        x.textAlign = 'left';
        x.font = UF.font.mono(16, 'bold');
        x.fillStyle = UF.c('red');
        x.fillText(String(s.index + 1).padStart(2, '0'), pad, y + 22);
        x.fillStyle = UF.c('paper');
        x.fillText(fit(s.title || s.id, sheet.width - pad * 2 - 34 - infoW - 24), pad + 34, y + 22);
        for (let i = 0; i < n; i++) {
          const t = s.duration * (i + 0.5) / n;
          this.render(s.start + t);
          hx.drawImage(this.canvas, 0, 0, half.width, half.height);
          const tx = pad + i * (tw + pad), ty = y + rowHead;
          x.drawImage(half, tx, ty, tw, th);
          x.fillStyle = 'rgba(0,0,0,.72)';
          x.fillRect(tx, ty + th - 26, 74, 26);
          x.font = UF.font.mono(14, 'bold');
          x.fillStyle = UF.c('paper');
          x.fillText(`${t.toFixed(1)}s`, tx + 10, ty + th - 8);
        }
      });
      this.render(this.t);
      return sheet.toDataURL('image/jpeg', 0.86);
    }

    /* ---------------- Thumbnail ---------------- */
    /** The current frame as a 1280x720 JPEG data URL under YouTube's 2 MB limit, with grain turned down so it compresses cleanly. */
    thumbnail() {
      this.grainOverride = 0.012;
      this.render(this.t);
      const cv = UF.canvas(1280, 720), cx = cv.getContext('2d');
      cx.imageSmoothingQuality = 'high';
      cx.drawImage(this.canvas, 0, 0, 1280, 720);
      this.grainOverride = null;
      this.render(this.t);
      const bytes = url => Math.floor((url.length - url.indexOf(',') - 1) * 0.75);
      for (let i = 0; i <= 7; i++) {
        const url = cv.toDataURL('image/jpeg', 0.92 - i * 0.06);
        if (bytes(url) < 2e6) return url;
      }
      throw new Error('The thumbnail is over 2 MB even at JPEG quality 0.5 — simplify the background.');
    }
    saveThumbnail() {
      const hit = this.locate(this.t);
      const url = this.thumbnail();
      const where = hit ? `${String(hit.scene.index + 1).padStart(2, '0')}-${hit.scene.id}` : 'frame';
      this.download(url, `${this.o.slug}-thumb-${where}-${this.t.toFixed(2)}s.jpg`);
      this.setStatus(`Thumbnail saved — 1280×720, ${Math.round((url.length - url.indexOf(',') - 1) * 0.75 / 1024)} KB.`);
    }
  }

  UF.Stage = Stage;
  UF.fmtTime = fmt;
})(window);

/*!
 * Unfiction GFX Toolkit — Sets
 * Camera moves, lighting, floating tags and outdoor sets for dramatised scenes.
 *
 *   Camera    groups layers and moves over them (push-ins, pans), with parallax per layer
 *   Light     additive pools and beams, darkening shades and vignettes, with levels over time
 *   Tag       floating label tied to a point, which can follow a moving prop
 *   Bokeh     soft out-of-focus lights for backgrounds
 *   Street    sky, distant towers and the road for a street-level shot
 *   Traffic   cars, vans and jeepneys driving across in lanes
 *   Skyline   a low-poly night city seen from the air, with a camera glide to one building
 *   Prop types car, streetLamp, branch, building, tree and streetSign (centimetres, like UF.Prop)
 *
 *   const room = new UF.Camera({ layers: [wall, desk, figure], moves: [{ at: 0, dur: 12, x: 900, y: 600, zoom: 1.4 }] });
 *
 * Load after uf-props.js and uf-character.js.
 */
(function (UF) {
  'use strict';

  if (!UF.props) throw new Error('uf-sets.js needs uf-props.js loaded first.');
  const { clamp, lerp, seg, ease } = UF;
  const D = UF.draw;
  const W = UF.W, H = UF.H, TAU = Math.PI * 2;
  const T = UF.props.types;
  const { hash, list, ell, poly, glow } = UF.props.kit;

  /* ------------------------------------------------------------------ */
  /* Camera                                                              */
  /* ------------------------------------------------------------------ */
  /**
   * new UF.Camera({ layers, x: 960, y: 540, zoom: 1, rotate: 0, moves: [{ at, dur, x, y, zoom, rotate, ease }],
   *   handheld: 0, clamp: true })
   * (x, y) is the world point at the centre of the frame. Each move glides from wherever the camera is
   * when it starts. A layer's `parallax` (default 1) scales how far it follows: 0 stays fixed to the
   * frame, 0.5 drifts at half speed like a far wall, above 1 sweeps past like a foreground object.
   * `clamp` keeps the frame inside the 1920x1080 world when zoomed in. Keep overlays (labels, chips)
   * outside the camera; `toScreen(point, t)` tells them where a world point lands.
   */
  class Camera extends UF.Component {
    constructor(o) {
      super({ layers: [], x: W / 2, y: H / 2, zoom: 1, rotate: 0, moves: [], handheld: 0, clamp: true, seed: 1, fadeIn: 0, fadeOut: 0 }, o);
      this.moves = [...list(this.moves)].sort((p, q) => p.at - q.at);
      for (const m of this.moves) if (typeof m.at !== 'number') throw new Error('Camera: every move needs a number `at`.');
      for (const l of this.layers) if (!l || typeof l.draw !== 'function') throw new Error('Camera: every layer needs a draw method.');
    }

    /** { x, y, zoom, rotate } at time t. */
    view(t) {
      let s = { x: this.x, y: this.y, zoom: this.zoom, rotate: this.rotate };
      for (const m of this.moves) {
        if (t < m.at) break;
        const k = UF.easeFn(m.ease || 'inOutSine')(seg(t, m.at, m.dur ?? 2));
        s = {
          x: m.x != null ? lerp(s.x, m.x, k) : s.x,
          y: m.y != null ? lerp(s.y, m.y, k) : s.y,
          zoom: m.zoom != null ? s.zoom * Math.pow(m.zoom / s.zoom, k) : s.zoom,
          rotate: m.rotate != null ? lerp(s.rotate, m.rotate, k) : s.rotate,
        };
      }
      if (this.handheld) {
        const h = this.handheld, q = this.seed * 1.7;
        s.x += h * (Math.sin(t * 0.63 + q) + 0.5 * Math.sin(t * 1.41 + q * 2));
        s.y += h * 0.7 * (Math.sin(t * 0.52 + q * 3) + 0.5 * Math.sin(t * 1.17 + q));
        s.rotate += h * 0.00035 * Math.sin(t * 0.41 + q);
      }
      if (this.clamp && s.zoom >= 1) {
        const hw = W / 2 / s.zoom, hh = H / 2 / s.zoom;
        s.x = clamp(s.x, hw, W - hw);
        s.y = clamp(s.y, hh, H - hh);
      }
      return s;
    }

    transform(ctx, s, par = 1) {
      const z = 1 + (s.zoom - 1) * par;
      ctx.translate(W / 2, H / 2);
      if (s.rotate) ctx.rotate(s.rotate * par);
      ctx.scale(z, z);
      ctx.translate(-(W / 2 + (s.x - W / 2) * par), -(H / 2 + (s.y - H / 2) * par));
    }

    /** Where world point [x, y] lands on the frame at time t. */
    toScreen(pt, t, par = 1) {
      const s = this.view(t), z = 1 + (s.zoom - 1) * par;
      let dx = (pt[0] - (W / 2 + (s.x - W / 2) * par)) * z, dy = (pt[1] - (H / 2 + (s.y - H / 2) * par)) * z;
      const r = (s.rotate || 0) * par;
      if (r) { const c = Math.cos(r), sn = Math.sin(r); [dx, dy] = [dx * c - dy * sn, dx * sn + dy * c]; }
      return [W / 2 + dx, H / 2 + dy];
    }

    setup(stage) { for (const l of this.layers) if (l.setup) l.setup(stage); }

    draw(ctx, t, fx, scene) {
      const a = this.vis(t);
      if (a <= 0) return;
      const s = this.view(t);
      for (const l of this.layers) {
        ctx.save();
        if (a < 1) ctx.globalAlpha *= a;
        this.transform(ctx, s, l.parallax ?? 1);
        fx.source = l.constructor === Object ? 'Camera' : l.constructor.name;
        l.draw(ctx, t, fx, scene);
        ctx.restore();
      }
    }

    /** The layers' metadata merged, so the editorial check sees what the camera shows. */
    editorial() {
      const out = {};
      for (const l of this.layers) {
        const m = (typeof l.editorial === 'function' && l.editorial()) || {};
        for (const [k, v] of Object.entries(m)) {
          if (Array.isArray(v)) out[k] = (out[k] || []).concat(v);
          else if (typeof v === 'boolean') out[k] = out[k] || v;
          else if (v != null && v !== '' && out[k] == null) out[k] = v;
        }
      }
      return out;
    }
  }
  UF.Camera = Camera;

  /* ------------------------------------------------------------------ */
  /* Light                                                               */
  /* ------------------------------------------------------------------ */
  const LIGHTS = ['pool', 'beam', 'shade', 'vignette'];
  /**
   * new UF.Light({ type: 'pool', x, y, r, ry, color, alpha })                       soft additive glow
   * new UF.Light({ type: 'beam', from: [[x, y], [x, y]], to: [[x, y], [x, y]] })     shaft from an opening to where it lands
   * new UF.Light({ type: 'shade', color: '#050810', alpha: 0.5, rect, blend })       darkens the frame (or a rect)
   * new UF.Light({ type: 'vignette', x, y, r, color, alpha })                        darkens towards the edges
   * level (default 1) scales the light; levels: [{ at, to, dur, ease }] changes it over time;
   * flicker: { at, dur, rate } switches it on and off at random.
   */
  class Light extends UF.Component {
    constructor(o) {
      super({ type: 'pool', x: W / 2, y: H / 2, r: 400, ry: null, color: '#ffffff', alpha: 0.2, blend: null,
        rect: null, from: null, to: null, level: 1, levels: [], flicker: null, seed: 1, fadeIn: 0 }, o);
      if (!LIGHTS.includes(this.type)) throw new Error(`Light: type is ${LIGHTS.join(', ')}.`);
      if (this.type === 'beam' && !(this.from && this.to)) throw new Error('Light: a beam needs from: [[x, y], [x, y]] and to: [[x, y], [x, y]].');
      this.levels = [...list(this.levels)].sort((p, q) => p.at - q.at);
    }

    levelAt(t) {
      let v = this.level;
      for (const l of this.levels) {
        if (t < l.at) break;
        v = lerp(v, l.to, UF.easeFn(l.ease || 'inOutSine')(seg(t, l.at, l.dur ?? 0.5)));
      }
      const f = this.flicker;
      if (f && t >= f.at && t < f.at + (f.dur ?? 1)) v *= hash(Math.floor((t - f.at) * (f.rate || 14)), this.seed + 3) > 0.42 ? 1 : 0.12;
      return v;
    }

    draw(ctx, t) {
      const lv = this.vis(t) * this.levelAt(t);
      if (lv <= 0.001) return;
      const al = this.alpha * lv;
      ctx.save();
      ctx.globalCompositeOperation = this.blend || (this.type === 'shade' || this.type === 'vignette' ? 'source-over' : 'lighter');
      if (this.type === 'pool') {
        const ry = this.ry ?? this.r;
        ctx.translate(this.x, this.y);
        ctx.scale(1, ry / this.r);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, this.r);
        g.addColorStop(0, UF.c(this.color, al));
        g.addColorStop(0.42, UF.c(this.color, al * 0.42));
        g.addColorStop(1, UF.c(this.color, 0));
        ctx.fillStyle = g;
        ctx.fillRect(-this.r, -this.r, this.r * 2, this.r * 2);
      } else if (this.type === 'beam') {
        const [a0, a1] = this.from, [b0, b1] = this.to;
        const g = ctx.createLinearGradient((a0[0] + a1[0]) / 2, (a0[1] + a1[1]) / 2, (b0[0] + b1[0]) / 2, (b0[1] + b1[1]) / 2);
        g.addColorStop(0, UF.c(this.color, al));
        g.addColorStop(1, UF.c(this.color, 0));
        ctx.fillStyle = g;
        poly(ctx, [a0, a1, b1, b0]);
        ctx.fill();
      } else if (this.type === 'shade') {
        const [x, y, w, h] = this.rect || [-W, -H, W * 3, H * 3];
        ctx.fillStyle = UF.c(this.color, al);
        ctx.fillRect(x, y, w, h);
      } else {
        const g = ctx.createRadialGradient(this.x, this.y, Math.min(this.r * 0.35, H * 0.3), this.x, this.y, this.r);
        g.addColorStop(0, UF.c(this.color, 0));
        g.addColorStop(1, UF.c(this.color, al));
        ctx.fillStyle = g;
        ctx.fillRect(-W, -H, W * 3, H * 3);
      }
      ctx.restore();
    }

    editorial() { return {}; }
  }
  UF.Light = Light;

  /* ------------------------------------------------------------------ */
  /* Tag                                                                 */
  /* ------------------------------------------------------------------ */
  /**
   * new UF.Tag({ text: 'SWIFT MESSAGE', at: 1.2, anchor: t => envelope.point('top', t), dy: -90 })
   * A label that floats above a point on a short leader line. anchor is [x, y] or a function of t;
   * without one the tag sits on (x, y). When the anchor lives inside a UF.Camera, pass `camera` so the
   * tag stays a constant size outside it. color: accent name; icon: any UF.draw icon; sub: second line.
   */
  class Tag extends UF.Component {
    constructor(o) {
      super({ text: '', sub: '', anchor: null, camera: null, x: W / 2, y: H / 2, dx: 0, dy: -90, color: 'blue', icon: null,
        size: 24, bob: 3, leader: true, seed: 1, fadeIn: 0.25, fadeOut: 0.3 }, o);
    }

    anchorAt(t) {
      const p = typeof this.anchor === 'function' ? this.anchor(t) : this.anchor;
      if (!p) return null;
      return this.camera ? this.camera.toScreen(p, t) : p;
    }

    draw(ctx, t) {
      const a = this.vis(t);
      if (a <= 0) return;
      const s = this.size, acc = UF.c(this.color), an = this.anchorAt(t);
      const pop = ease.outBack(seg(t, this.at, 0.4));
      const bob = this.bob * Math.sin(t * 1.7 + this.seed);
      const cx = an ? an[0] + this.dx : this.x, cy = (an ? an[1] + this.dy : this.y) + bob;
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.font = UF.font.mono(s, 'bold');
      const tw = D.measure(ctx, this.text, s * 0.14);
      let sw = 0;
      if (this.sub) { ctx.font = UF.font.mono(Math.round(s * 0.62), 'bold'); sw = D.measure(ctx, this.sub, s * 0.08); }
      const iw = this.icon ? s * 1.45 : 0;
      const w = s * 1.25 + iw + Math.max(tw, sw) + s * 0.95, h = this.sub ? s * 2.7 : s * 1.9;
      if (an && this.leader) {
        const lk = ease.outCubic(seg(t, this.at, 0.35));
        ctx.strokeStyle = UF.c(acc, 0.85);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(cx, cy + h / 2); ctx.lineTo(lerp(cx, an[0], lk), lerp(cy + h / 2, an[1], lk)); ctx.stroke();
        ctx.fillStyle = acc;
        ctx.beginPath(); ctx.arc(an[0], an[1], 4.5 * lk, 0, TAU); ctx.fill();
      }
      ctx.translate(cx, cy);
      const sc = lerp(0.7, 1, pop);
      ctx.scale(sc, sc);
      const x0 = -w / 2, y0 = -h / 2;
      D.roundRect(ctx, x0, y0, w, h, 6);
      ctx.fillStyle = 'rgba(8,10,13,0.88)';
      ctx.fill();
      ctx.strokeStyle = UF.c(acc, 0.9);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.fillStyle = acc;
      ctx.fillRect(x0 + 2, y0 + 7, 4, h - 14);
      let tx = x0 + s * 0.8;
      if (this.icon) { D.icon(ctx, this.icon, tx + s * 0.5, 0, s * 1.05, { color: acc, width: 9 }); tx += iw; }
      ctx.font = UF.font.mono(s, 'bold');
      D.text(ctx, this.text, tx, this.sub ? -s * 0.16 : s * 0.36, { color: UF.c('paper'), spacing: s * 0.14 });
      if (this.sub) {
        ctx.font = UF.font.mono(Math.round(s * 0.62), 'bold');
        D.text(ctx, this.sub, tx, s * 0.84, { color: UF.c('dim'), spacing: s * 0.08 });
      }
      ctx.restore();
    }

    editorial() { return {}; }
  }
  UF.Tag = Tag;

  /* ------------------------------------------------------------------ */
  /* Bokeh                                                               */
  /* ------------------------------------------------------------------ */
  /** new UF.Bokeh({ count: 26, colors: ['#ffd59a'], size: [18, 64], alpha: 0.14, rect: [x, y, w, h], drift: 8 }) */
  const bokehCache = new Map();
  class Bokeh extends UF.Component {
    constructor(o) {
      super({ count: 26, colors: ['#ffd59a', '#ffb366', '#f2e3c4'], size: [18, 64], alpha: 0.14, rect: null, drift: 8, seed: 3, fadeIn: 0 }, o);
    }
    sprite(color) {
      let cv = bokehCache.get(color);
      if (cv) return cv;
      cv = UF.canvas(128, 128);
      const x = cv.getContext('2d'), g = x.createRadialGradient(64, 64, 0, 64, 64, 63);
      g.addColorStop(0, UF.c(color, 0.5));
      g.addColorStop(0.78, UF.c(color, 0.62));
      g.addColorStop(0.92, UF.c(color, 0.8));
      g.addColorStop(1, UF.c(color, 0));
      x.fillStyle = g;
      x.fillRect(0, 0, 128, 128);
      bokehCache.set(color, cv);
      return cv;
    }
    draw(ctx, t) {
      const a = this.vis(t);
      if (a <= 0) return;
      const r = UF.rng(this.seed), [x0, y0, w, h] = this.rect || [0, 0, W, H];
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (let i = 0; i < this.count; i++) {
        const bx = x0 + r() * w, by = y0 + r() * h, s = lerp(this.size[0], this.size[1], r());
        const col = this.colors[Math.floor(r() * this.colors.length)], ph = r() * TAU, sp = 0.3 + r() * 0.5;
        const x = bx + Math.sin(t * sp * 0.4 + ph) * this.drift, y = by + Math.cos(t * sp * 0.33 + ph) * this.drift * 0.6;
        ctx.globalAlpha = a * this.alpha * (0.65 + 0.35 * Math.sin(t * sp + ph));
        ctx.drawImage(this.sprite(col), x - s, y - s, s * 2, s * 2);
      }
      ctx.restore();
    }
    editorial() { return {}; }
  }
  UF.Bokeh = Bokeh;

  /* ------------------------------------------------------------------ */
  /* Outdoor prop types                                                  */
  /* ------------------------------------------------------------------ */
  const CAR_STYLES = ['sedan', 'van', 'jeepney'];
  const openAt = (v, t) => (v == null ? 0 : typeof v === 'number' ? v : lerp(v.from || 0, v.to ?? 1, ease.inOutCubic(seg(t, v.at, v.dur ?? 0.8))));

  function wheel(ctx, p, x, r, spin) {
    ell(ctx, x, -r, r, r);
    ctx.fillStyle = p.col('#0c0d0f');
    ctx.fill();
    ell(ctx, x, -r, r * 0.68, r * 0.68);
    const g = ctx.createRadialGradient(x - r * 0.2, -r * 1.2, r * 0.1, x, -r, r * 0.7);
    g.addColorStop(0, p.col('#c9ccd0'));
    g.addColorStop(1, p.col('#5d6268'));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.save();
    ctx.translate(x, -r);
    ctx.rotate(spin);
    ctx.fillStyle = p.col('#2a2d31');
    for (let i = 0; i < 5; i++) {
      ctx.rotate(TAU / 5);
      ctx.beginPath();
      ctx.moveTo(-r * 0.07, -r * 0.16); ctx.lineTo(-r * 0.13, -r * 0.6); ctx.lineTo(r * 0.13, -r * 0.6); ctx.lineTo(r * 0.07, -r * 0.16);
      ctx.closePath();
      ctx.fill();
    }
    ell(ctx, 0, 0, r * 0.17, r * 0.17);
    ctx.fillStyle = p.col('#a7adb4');
    ctx.fill();
    ctx.restore();
  }

  function arch(ctx, p, x, r) {
    ctx.beginPath();
    ctx.moveTo(x - r - 5, -30);
    ctx.arc(x, -r, r + 5, Math.PI, 0, false);
    ctx.lineTo(x + r + 5, -30);
    ctx.closePath();
    ctx.fillStyle = p.col('#060607');
    ctx.fill();
  }

  /** Light at (x, y) with a forward beam of length len when beam is on. */
  function lamp(ctx, p, x, y, color, dir, beam, k = 1) {
    glow(ctx, p, x, y, 46, color, 0.55 * k);
    if (!beam) return;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createLinearGradient(x, y, x + dir * 520, y);
    g.addColorStop(0, UF.c(p.col(color), 0.22 * k * (1 - p.dim)));
    g.addColorStop(1, UF.c(p.col(color), 0));
    ctx.fillStyle = g;
    poly(ctx, [[x, y - 6], [x + dir * 520, y - 70], [x + dir * 520, y + 40], [x, y + 6]]);
    ctx.fill();
    ctx.restore();
  }

  function bodyPaint(ctx, p, c, top, bottom) {
    const g = ctx.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, p.col(D.shade(c, 0.2)));
    g.addColorStop(0.42, p.col(D.shade(c, 0.06)));
    g.addColorStop(1, p.col(D.shade(c, -0.42)));
    return g;
  }

  function glass(ctx, p, top, bottom, day) {
    const g = ctx.createLinearGradient(0, top, 0, bottom);
    g.addColorStop(0, p.col(day ? '#9fb2c2' : '#2a3a48'));
    g.addColorStop(1, p.col(day ? '#3a4652' : '#0b1016'));
    return g;
  }

  function sedan(ctx, p, t, part) {
    const c = p.color, day = !p.lights;
    const lid = openAt(p.boot, t) * 1.12;
    if (part !== 'front') {
      ell(ctx, 0, 0, 236, 9);
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.fill();
      if (lid > 0.01) {
        poly(ctx, [[-162, -82], [-224, -80], [-222, -92], [-160, -100]]);
        ctx.fillStyle = p.col('#0a0b0d');
        ctx.fill();
        if (p.lights) glow(ctx, p, -192, -92, 34, '#ffe2a8', 0.35 * Math.min(1, lid));
      }
    }
    if (part === 'back') return;
    const spin = (p.cur ? (p.cur.x - p.x) * (p.flip ? -1 : 1) : 0) / (32 * p.scale * (p.cur ? p.cur.size : p.size));
    ctx.beginPath();
    ctx.moveTo(-228, -30);
    ctx.quadraticCurveTo(-235, -52, -228, -74);
    ctx.lineTo(-224, -80);
    ctx.lineTo(-162, -82);
    ctx.lineTo(-158, -96);
    ctx.quadraticCurveTo(-118, -138, -92, -141);
    ctx.quadraticCurveTo(-20, -148, 42, -141);
    ctx.quadraticCurveTo(70, -128, 106, -98);
    ctx.quadraticCurveTo(170, -94, 212, -84);
    ctx.quadraticCurveTo(232, -78, 233, -60);
    ctx.quadraticCurveTo(235, -40, 228, -30);
    ctx.closePath();
    ctx.fillStyle = bodyPaint(ctx, p, c, -148, -30);
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(-148, -98);
    ctx.quadraticCurveTo(-114, -132, -90, -135);
    ctx.quadraticCurveTo(-20, -141, 38, -135);
    ctx.quadraticCurveTo(62, -122, 94, -99);
    ctx.closePath();
    ctx.fillStyle = glass(ctx, p, -141, -98, day);
    ctx.fill();
    ctx.save();
    ctx.clip();
    ctx.globalCompositeOperation = 'lighter';
    ctx.fillStyle = `rgba(255,255,255,${day ? 0.16 : 0.06})`;
    poly(ctx, [[-70, -142], [-40, -142], [-90, -96], [-120, -96]]);
    ctx.fill();
    poly(ctx, [[20, -142], [32, -142], [-8, -96], [-20, -96]]);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = p.col(D.shade(c, -0.25));
    ctx.fillRect(-24, -139, 9, 42);
    ctx.strokeStyle = 'rgba(0,0,0,0.38)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.moveTo(-150, -96); ctx.quadraticCurveTo(-156, -60, -150, -34);
    ctx.moveTo(-20, -97); ctx.lineTo(-20, -34);
    ctx.moveTo(96, -97); ctx.quadraticCurveTo(104, -64, 100, -36);
    ctx.stroke();
    ctx.fillStyle = p.col(D.shade(c, -0.3));
    D.roundRect(ctx, -66, -91, 14, 3.4, 1.4); ctx.fill();
    D.roundRect(ctx, 50, -91, 14, 3.4, 1.4); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.18)';
    ctx.lineWidth = 0.8;
    ctx.beginPath(); ctx.moveTo(-222, -73); ctx.quadraticCurveTo(0, -77, 224, -70); ctx.stroke();
    poly(ctx, [[88, -100], [99, -109], [108, -105], [104, -97]]);
    ctx.fillStyle = p.col(D.shade(c, -0.12));
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-206, -38, 418, 8);
    arch(ctx, p, -140, 32);
    arch(ctx, p, 145, 32);
    wheel(ctx, p, -140, 32, spin);
    wheel(ctx, p, 145, 32, spin);
    poly(ctx, [[206, -86], [226, -80], [229, -71], [212, -74]]);
    ctx.fillStyle = p.col(p.lights ? '#fff6dc' : '#d9d6cc');
    ctx.fill();
    ctx.fillStyle = p.col('#15171a');
    ctx.fillRect(226, -57, 6, 12);
    poly(ctx, [[-222, -82], [-231, -79], [-232, -68], [-225, -70]]);
    ctx.fillStyle = p.col(p.lights || p.brake ? '#e0262f' : '#7c141a');
    ctx.fill();
    if (p.lights) lamp(ctx, p, 222, -78, '#fff2cc', 1, p.beam);
    if (p.lights || p.brake) lamp(ctx, p, -229, -75, '#ff2a2a', -1, false, p.brake ? 1 : 0.6);
    ctx.save();
    ctx.translate(-160, -96);
    ctx.rotate(-lid);
    ctx.beginPath();
    ctx.moveTo(0, 0); ctx.lineTo(-62, 10); ctx.lineTo(-66, 18); ctx.lineTo(-64, 16); ctx.lineTo(-2, 14);
    ctx.closePath();
    ctx.fillStyle = bodyPaint(ctx, p, c, 0, 18);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 0.8;
    ctx.stroke();
    ctx.restore();
  }

  function van(ctx, p, t, part) {
    const c = p.color, day = !p.lights;
    if (part !== 'front') {
      ell(ctx, 0, 0, 246, 9);
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.fill();
    }
    if (part === 'back') return;
    const spin = (p.cur ? (p.cur.x - p.x) * (p.flip ? -1 : 1) : 0) / (34 * p.scale * (p.cur ? p.cur.size : p.size));
    ctx.beginPath();
    ctx.moveTo(-240, -32);
    ctx.lineTo(-242, -198);
    ctx.quadraticCurveTo(-240, -212, -226, -213);
    ctx.lineTo(112, -213);
    ctx.quadraticCurveTo(146, -211, 166, -172);
    ctx.lineTo(196, -122);
    ctx.quadraticCurveTo(236, -114, 240, -88);
    ctx.lineTo(242, -34);
    ctx.closePath();
    ctx.fillStyle = bodyPaint(ctx, p, c, -213, -32);
    ctx.fill();
    poly(ctx, [[-214, -194], [108, -194], [150, -128], [-214, -128]]);
    ctx.fillStyle = glass(ctx, p, -194, -128, day);
    ctx.fill();
    ctx.fillStyle = p.col(D.shade(c, -0.18));
    for (const x of [-134, -54, 26]) ctx.fillRect(x, -196, 9, 70);
    ctx.strokeStyle = 'rgba(0,0,0,0.35)';
    ctx.lineWidth = 0.9;
    ctx.beginPath(); ctx.moveTo(-54, -128); ctx.lineTo(-54, -36); ctx.moveTo(30, -128); ctx.lineTo(30, -36); ctx.moveTo(150, -126); ctx.lineTo(156, -38); ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.fillRect(-220, -40, 444, 8);
    arch(ctx, p, -150, 34);
    arch(ctx, p, 162, 34);
    wheel(ctx, p, -150, 34, spin);
    wheel(ctx, p, 162, 34, spin);
    poly(ctx, [[222, -112], [238, -104], [240, -92], [224, -94]]);
    ctx.fillStyle = p.col(p.lights ? '#fff6dc' : '#d9d6cc');
    ctx.fill();
    ctx.fillStyle = p.col(p.lights || p.brake ? '#e0262f' : '#7c141a');
    ctx.fillRect(-244, -150, 6, 30);
    if (p.lights) lamp(ctx, p, 234, -100, '#fff2cc', 1, p.beam);
    if (p.lights || p.brake) lamp(ctx, p, -242, -136, '#ff2a2a', -1, false, p.brake ? 1 : 0.6);
  }

  const JEEP_STRIPES = [['#c1121f', '#d9a441', '#2f5d8a'], ['#2f7d4f', '#d9a441', '#c1121f'], ['#2f5d8a', '#e8e4da', '#c1121f']];
  function jeepney(ctx, p, t, part) {
    const c = p.color, day = !p.lights;
    if (part !== 'front') {
      ell(ctx, 0, 0, 300, 10);
      ctx.fillStyle = 'rgba(0,0,0,0.42)';
      ctx.fill();
    }
    if (part === 'back') return;
    const spin = (p.cur ? (p.cur.x - p.x) * (p.flip ? -1 : 1) : 0) / (34 * p.scale * (p.cur ? p.cur.size : p.size));
    const stripes = JEEP_STRIPES[(p.seed || 0) % JEEP_STRIPES.length];
    p.slab(ctx, -296, -132, 520, 100, c, 4, { k: 0.2 });
    ctx.fillStyle = p.col('#17130f');
    ctx.fillRect(-290, -200, 506, 68);
    ctx.fillStyle = p.col(D.shade(c, -0.1));
    for (let x = -290; x <= 216; x += 46) ctx.fillRect(x, -200, 6, 68);
    p.slab(ctx, -312, -214, 548, 15, D.shade(c, 0.08), 3, { k: 0.3 });
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(-312, -200, 548, 1.6);
    stripes.forEach((s, i) => { ctx.fillStyle = p.col(s); ctx.fillRect(-290, -122 + i * 9, 506, 5); });
    ctx.beginPath();
    ctx.moveTo(220, -132); ctx.lineTo(220, -186); ctx.quadraticCurveTo(226, -198, 238, -198); ctx.lineTo(244, -150);
    ctx.quadraticCurveTo(296, -146, 302, -112); ctx.lineTo(304, -40); ctx.lineTo(220, -36);
    ctx.closePath();
    ctx.fillStyle = bodyPaint(ctx, p, c, -198, -36);
    ctx.fill();
    poly(ctx, [[226, -188], [236, -192], [242, -152], [228, -152]]);
    ctx.fillStyle = glass(ctx, p, -192, -152, day);
    ctx.fill();
    p.slab(ctx, 290, -108, 14, 52, '#c9ccd0', 2, { h: true, k: 0.4 });
    ctx.fillStyle = p.col('#3a3f46');
    for (let i = 0; i < 5; i++) ctx.fillRect(292, -102 + i * 9, 10, 2);
    ell(ctx, 296, -116, 6, 6);
    ctx.fillStyle = p.col(p.lights ? '#fff6dc' : '#d9d6cc');
    ctx.fill();
    p.slab(ctx, -300, -44, 608, 10, '#c9ccd0', 3, { k: 0.4 });
    ctx.fillStyle = p.col('#0f0d0b');
    ctx.fillRect(-300, -128, 8, 88);
    arch(ctx, p, -190, 34);
    arch(ctx, p, 205, 34);
    wheel(ctx, p, -190, 34, spin);
    wheel(ctx, p, 205, 34, spin);
    ctx.fillStyle = p.col(p.lights || p.brake ? '#e0262f' : '#7c141a');
    ctx.fillRect(-302, -96, 6, 16);
    if (p.lights) lamp(ctx, p, 300, -116, '#fff2cc', 1, p.beam);
    if (p.lights || p.brake) lamp(ctx, p, -300, -88, '#ff2a2a', -1, false, p.brake ? 1 : 0.6);
  }

  /**
   * Side view, facing right (flip for left). style: sedan | van | jeepney. lights: head and tail lights on;
   * beam: headlight beam; brake: tail lights bright. boot (sedan): 0..1 or { at, dur, from, to } opens the
   * boot lid. part: 'back' draws the shadow and the open boot's inside, 'front' the rest, so a bag can be
   * listed between the two and drop out of sight into the boot. Wheels turn as the car moves.
   */
  T.car = {
    anchor: 'bottom',
    defaults: { style: 'sedan', color: '#7a1d24', lights: false, beam: false, brake: false, boot: null, part: 'all', seed: 0 },
    points: p => (p.style === 'jeepney'
      ? { front: [304, -80], rear: [-300, -80], top: [0, -214] }
      : p.style === 'van'
        ? { front: [242, -90], rear: [-242, -90], top: [0, -213] }
        : { front: [233, -60], rear: [-230, -70], boot: [-192, -88], top: [0, -146], door: [-40, -70] }),
    init(p) {
      if (!CAR_STYLES.includes(p.style)) throw new Error(`Prop car: style is ${CAR_STYLES.join(', ')}.`);
      if (!['all', 'back', 'front'].includes(p.part)) throw new Error('Prop car: part is all, back or front.');
    },
    draw(ctx, p, t) {
      const fn = p.style === 'van' ? van : p.style === 'jeepney' ? jeepney : sedan;
      fn(ctx, p, t, p.part);
    },
  };

  /** Street lamp on a pole, arm reaching right. on: lit with a cone and a pool on the ground. */
  T.streetLamp = {
    anchor: 'bottom',
    defaults: { height: 620, arm: 150, on: true, color: '#ffbf73', cone: true, alpha: 0.16, pole: '#2a2d32' },
    points: p => ({ lamp: [p.arm, -p.height + 12], pool: [p.arm, 0] }),
    draw(ctx, p, t) {
      const Hh = p.height, ax = p.arm, hy = -Hh + 12;
      if (p.on && p.cone) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(0, hy, 0, 0);
        g.addColorStop(0, UF.c(p.col(p.color), p.alpha * (1 - p.dim)));
        g.addColorStop(1, UF.c(p.col(p.color), p.alpha * 0.25 * (1 - p.dim)));
        ctx.fillStyle = g;
        poly(ctx, [[ax - 24, hy], [ax + 24, hy], [ax + Hh * 0.42, 0], [ax - Hh * 0.42, 0]]);
        ctx.fill();
        ctx.translate(ax, 0);
        ctx.scale(1, 0.14);
        const r = Hh * 0.55, pg = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        pg.addColorStop(0, UF.c(p.col(p.color), p.alpha * 1.4 * (1 - p.dim)));
        pg.addColorStop(1, UF.c(p.col(p.color), 0));
        ctx.fillStyle = pg;
        ctx.fillRect(-r, -r, r * 2, r * 2);
        ctx.restore();
      }
      p.slab(ctx, -14, -46, 28, 46, D.shade(p.pole, 0.06), 2, { h: true, k: 0.2 });
      poly(ctx, [[-7, -46], [7, -46], [4.5, -Hh + 30], [-4.5, -Hh + 30]]);
      const pg = ctx.createLinearGradient(-7, 0, 7, 0);
      pg.addColorStop(0, p.col(D.shade(p.pole, 0.25)));
      pg.addColorStop(1, p.col(D.shade(p.pole, -0.3)));
      ctx.fillStyle = pg;
      ctx.fill();
      ctx.strokeStyle = p.col(p.pole);
      ctx.lineWidth = 6;
      ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(0, -Hh + 34); ctx.quadraticCurveTo(0, -Hh - 6, ax - 30, -Hh + 2); ctx.stroke();
      poly(ctx, [[ax - 40, -Hh - 2], [ax + 34, -Hh + 2], [ax + 30, hy + 2], [ax - 36, hy]]);
      ctx.fillStyle = p.col(D.shade(p.pole, 0.1));
      ctx.fill();
      ctx.fillStyle = p.col(p.on ? '#fff3dc' : '#4a4f56');
      ctx.fillRect(ax - 30, hy - 1, 58, 3.4);
      if (p.on) glow(ctx, p, ax, hy + 2, 90, p.color, 0.5);
    },
  };

  const MODES = ['day', 'night'];
  /**
   * Generic bank branch front, centred on x, standing on y: glass shopfront with a door, a plain sign
   * band (text only, no logo) and an upper floor. mode: day | night; lit: interior and sign lit (night).
   */
  T.branch = {
    anchor: 'bottom',
    defaults: { w: 900, h: 640, sign: 'BANK', sub: null, mode: 'day', lit: true, color: '#d8d2c5', trim: '#22344a', ink: '#f2efe6', seed: 2 },
    points: p => ({ door: [0, 0], sign: [0, -362], left: [-p.w / 2, 0], right: [p.w / 2, 0], top: [0, -p.h] }),
    init(p) { if (!MODES.includes(p.mode)) throw new Error('Prop branch: mode is day or night.'); },
    draw(ctx, p) {
      const w = p.w, Hh = p.h, hw = w / 2, night = p.mode === 'night';
      p.slab(ctx, -hw, -Hh, w, Hh, night ? D.shade(p.color, -0.72) : p.color, 0, { k: 0.1 });
      p.slab(ctx, -hw - 10, -Hh - 12, w + 20, 16, night ? D.shade(p.color, -0.6) : D.shade(p.color, 0.08), 0, { k: 0.2 });
      const upY0 = -Hh + 40, upY1 = -410, cols = Math.max(3, Math.round(w / 150));
      for (let i = 0; i < cols; i++) {
        const cw = (w - 80) / cols, x = -hw + 40 + i * cw + cw * 0.14, ww = cw * 0.72;
        const lit = night && p.lit && hash(i, p.seed + 5) > 0.55;
        const g = ctx.createLinearGradient(0, upY0, 0, upY1);
        g.addColorStop(0, p.col(lit ? '#f2d8a2' : night ? '#10151c' : '#9cb2c4'));
        g.addColorStop(1, p.col(lit ? '#b98d4a' : night ? '#07090c' : '#5d6f80'));
        ctx.fillStyle = g;
        ctx.fillRect(x, upY0, ww, upY1 - upY0);
        ctx.fillStyle = p.col(night ? '#05070a' : D.shade(p.color, -0.35));
        ctx.fillRect(x - 3, upY1, ww + 6, 5);
        ctx.fillRect(x + ww / 2 - 1.5, upY0, 3, upY1 - upY0);
      }
      const sy0 = -398, sy1 = -330;
      p.slab(ctx, -hw + 12, sy0, w - 24, sy1 - sy0, night ? D.shade(p.trim, -0.35) : p.trim, 2, { k: 0.18 });
      if (night && p.lit) glow(ctx, p, 0, (sy0 + sy1) / 2, w * 0.45, p.ink, 0.12);
      const size = p.sub ? 40 : 48;
      p.write(ctx, p.sign, 0, (sy0 + sy1) / 2 - (p.sub ? 8 : 0) + 2, { size, font: 'display', color: night && !p.lit ? '#5a5f66' : p.ink, spacing: size * 0.16 });
      if (p.sub) p.write(ctx, p.sub, 0, sy1 - 12, { size: 11, font: 'sans', color: night && !p.lit ? '#5a5f66' : D.shade(p.ink, -0.15), spacing: 2.4 });
      const gy0 = -322, gy1 = -16;
      p.slab(ctx, -hw + 20, gy0 - 8, w - 40, gy1 - gy0 + 16, night ? '#0e1116' : '#3a4048', 0, { k: 0.1 });
      const inside = night && p.lit;
      const gg = ctx.createLinearGradient(0, gy0, 0, gy1);
      gg.addColorStop(0, p.col(inside ? '#e9d3a6' : night ? '#0b0e12' : '#a8bccb'));
      gg.addColorStop(1, p.col(inside ? '#a87d44' : night ? '#06080a' : '#56687a'));
      ctx.fillStyle = gg;
      ctx.fillRect(-hw + 28, gy0, w - 56, gy1 - gy0);
      if (inside) {
        ctx.fillStyle = 'rgba(40,28,14,0.35)';
        for (let i = 0; i < 5; i++) ctx.fillRect(-hw + 60 + i * (w - 120) / 5, -150, (w - 120) / 5 - 30, 60);
      }
      ctx.save();
      ctx.beginPath(); ctx.rect(-hw + 28, gy0, w - 56, gy1 - gy0); ctx.clip();
      ctx.globalCompositeOperation = 'lighter';
      ctx.fillStyle = `rgba(255,255,255,${night ? 0.03 : 0.12})`;
      for (let i = 0; i < 4; i++) {
        const x = -hw + 80 + i * w * 0.27;
        poly(ctx, [[x, gy0], [x + 50, gy0], [x - 90, gy1], [x - 140, gy1]]);
        ctx.fill();
      }
      ctx.restore();
      const mull = night ? '#1b2027' : '#2b3138';
      ctx.fillStyle = p.col(mull);
      const n = Math.max(3, Math.round((w - 56) / 140));
      for (let i = 0; i <= n; i++) ctx.fillRect(-hw + 26 + i * (w - 56) / n - 2, gy0, 5, gy1 - gy0);
      ctx.fillRect(-hw + 26, -110, w - 52, 5);
      p.slab(ctx, -104, -262, 208, 248, mull, 0, { k: 0.1 });
      const dg = ctx.createLinearGradient(0, -256, 0, -16);
      dg.addColorStop(0, p.col(inside ? '#f2e0b8' : night ? '#0d1116' : '#b3c5d2'));
      dg.addColorStop(1, p.col(inside ? '#b48a50' : night ? '#07090c' : '#617486'));
      ctx.fillStyle = dg;
      ctx.fillRect(-98, -256, 94, 240);
      ctx.fillRect(4, -256, 94, 240);
      ctx.fillStyle = p.col('#b9bcc0');
      ctx.fillRect(-14, -150, 4, 46);
      ctx.fillRect(10, -150, 4, 46);
      p.slab(ctx, -hw - 6, -16, w + 12, 16, night ? '#1a1c20' : '#8f8a80', 0, { k: 0.15 });
      if (inside) glow(ctx, p, 0, -60, w * 0.55, '#ffcf8a', 0.16);
    },
  };

  /** Plain mid-rise facade for street backdrops: windows by floor and a shopfront with an awning. */
  T.building = {
    anchor: 'bottom',
    defaults: { w: 700, h: 1500, color: '#b8b1a4', mode: 'day', awning: '#2f5d8a', shop: true, seed: 3, lit: 0.35 },
    points: p => ({ top: [0, -p.h], left: [-p.w / 2, 0], right: [p.w / 2, 0] }),
    init(p) { if (!MODES.includes(p.mode)) throw new Error('Prop building: mode is day or night.'); },
    draw(ctx, p) {
      const w = p.w, Hh = p.h, hw = w / 2, night = p.mode === 'night';
      const base = night ? D.shade(p.color, -0.74) : p.color;
      p.slab(ctx, -hw, -Hh, w, Hh, base, 0, { k: 0.08 });
      p.slab(ctx, -hw - 8, -Hh - 10, w + 16, 14, D.shade(base, 0.08), 0);
      const top = p.shop ? -380 : -40, floors = Math.floor((Hh + top - 60) / 320), cols = Math.max(2, Math.round(w / 160));
      for (let f = 0; f < floors; f++) {
        for (let i = 0; i < cols; i++) {
          const cw = (w - 60) / cols, x = -hw + 30 + i * cw + cw * 0.16, ww = cw * 0.68;
          const y1 = top - 60 - f * 320, y0 = y1 - 190;
          const lit = night && hash(i + f * 13, p.seed) < p.lit;
          ctx.fillStyle = p.col(lit ? '#e8c98e' : night ? '#0a0d11' : hash(i, f + p.seed) > 0.7 ? '#7d8e9c' : '#9db1c1');
          ctx.fillRect(x, y0, ww, 190);
          if (!night && hash(i + 7, f + p.seed) > 0.55) { ctx.fillStyle = 'rgba(230,226,214,0.55)'; ctx.fillRect(x, y0, ww, 190 * (0.3 + 0.5 * hash(i, f + 3))); }
          ctx.fillStyle = p.col(D.shade(base, -0.32));
          ctx.fillRect(x - 4, y1, ww + 8, 6);
        }
      }
      if (!p.shop) return;
      p.slab(ctx, -hw + 14, -330, w - 28, 314, night ? '#0b0d10' : '#2a2f36', 0, { k: 0.1 });
      const g = ctx.createLinearGradient(0, -300, 0, -16);
      g.addColorStop(0, p.col(night ? '#1a1712' : '#7f93a3'));
      g.addColorStop(1, p.col(night ? '#0a0908' : '#404c58'));
      ctx.fillStyle = g;
      ctx.fillRect(-hw + 24, -300, w - 48, 284);
      ctx.fillStyle = p.col('#1e2329');
      for (let i = 1; i < 4; i++) ctx.fillRect(-hw + 24 + i * (w - 48) / 4 - 2, -300, 4, 284);
      const ac = night ? D.shade(p.awning, -0.6) : p.awning;
      poly(ctx, [[-hw + 6, -350], [hw - 6, -350], [hw + 14, -300], [-hw - 14, -300]]);
      ctx.fillStyle = p.col(ac);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.14)';
      for (let x = -hw + 6; x < hw; x += 60) { poly(ctx, [[x, -350], [x + 30, -350], [x + 34, -300], [x + 2, -300]]); ctx.fill(); }
      ctx.fillStyle = p.col(D.shade(ac, -0.3));
      ctx.fillRect(-hw - 14, -302, w + 28, 6);
    },
  };

  /** Low-poly tree: trunk and a faceted crown that sways slightly. */
  T.tree = {
    anchor: 'bottom',
    defaults: { height: 520, crown: '#3d6a44', trunk: '#4a3a2c', seed: 3, sway: 1 },
    points: p => ({ top: [0, -p.height] }),
    draw(ctx, p, t) {
      const Hh = p.height, r = UF.rng(p.seed), tw = Hh * 0.035;
      poly(ctx, [[-tw, 0], [tw, 0], [tw * 0.55, -Hh * 0.55], [-tw * 0.55, -Hh * 0.55]]);
      const tg = ctx.createLinearGradient(-tw, 0, tw, 0);
      tg.addColorStop(0, p.col(D.shade(p.trunk, 0.2)));
      tg.addColorStop(1, p.col(D.shade(p.trunk, -0.35)));
      ctx.fillStyle = tg;
      ctx.fill();
      ctx.save();
      ctx.translate(0, -Hh * 0.5);
      ctx.rotate(p.sway * 0.012 * Math.sin(t * 0.9 + p.seed));
      const blobs = 7;
      for (let i = 0; i < blobs; i++) {
        const a = (i / blobs) * TAU + r() * 0.5;
        const cx = Math.cos(a) * Hh * 0.17 * (0.6 + r() * 0.5), cy = -Hh * 0.22 + Math.sin(a) * Hh * 0.13;
        const rr = Hh * (0.14 + r() * 0.06), n = 6 + Math.floor(r() * 2);
        const pts = [];
        for (let k = 0; k < n; k++) {
          const b = (k / n) * TAU + r() * 0.3;
          pts.push([cx + Math.cos(b) * rr * (0.85 + r() * 0.25), cy + Math.sin(b) * rr * (0.75 + r() * 0.25)]);
        }
        poly(ctx, pts);
        const lit = (Math.cos(a + 2.4) + 1) / 2;
        ctx.fillStyle = p.col(D.shade(p.crown, -0.32 + lit * 0.4 + (r() - 0.5) * 0.08));
        ctx.fill();
      }
      ctx.restore();
    },
  };

  /** Street-name plate on a post, in the same style as UF.draw.sign. letter: lettering size in cm. */
  T.streetSign = {
    anchor: 'bottom',
    defaults: { text: 'JUPITER ST', color: '#1f5c3c', ink: '#f1efe8', height: 300, letter: 16, pole: '#5b6068' },
    points: p => ({ sign: [0, -p.height] }),
    init(p) {
      const m = UF.canvas(8, 8).getContext('2d');
      m.font = UF.font.sans(100, 'bold');
      p._tw = (m.measureText(p.text).width / 100) * p.letter + p.text.length * p.letter * 0.04;
    },
    draw(ctx, p) {
      const s = p.letter, w = p._tw + s * 1.1, h = s * 1.55, y = -p.height;
      p.slab(ctx, -2.6, y, 5.2, p.height, p.pole, 0, { h: true, k: 0.3 });
      p.slab(ctx, -6, -6, 12, 6, D.shade(p.pole, -0.2), 1);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      D.roundRect(ctx, -w / 2 + 0.8, y - h / 2 + 1.2, w, h, s * 0.16);
      ctx.fill();
      D.roundRect(ctx, -w / 2, y - h / 2, w, h, s * 0.16);
      ctx.fillStyle = p.col(p.color);
      ctx.fill();
      ctx.strokeStyle = p.col(p.ink);
      ctx.lineWidth = s * 0.05;
      D.roundRect(ctx, -w / 2 + s * 0.12, y - h / 2 + s * 0.12, w - s * 0.24, h - s * 0.24, s * 0.1);
      ctx.stroke();
      p.write(ctx, p.text, 0, y + s * 0.04, { size: s, font: 'sans', color: p.ink, spacing: s * 0.04 });
    },
  };

  /* ------------------------------------------------------------------ */
  /* Street                                                              */
  /* ------------------------------------------------------------------ */
  const STREET = {
    day:   { sky: ['#8fb0ca', '#dde3e3'], far: '#a7b5c0', near: '#8796a3', win: '#c6d3dc', walk: ['#a39d92', '#8a857b'], curb: '#cfcabe', road: ['#56585c', '#34363a'], line: '#ece8de' },
    night: { sky: ['#04060c', '#1f1a22'], far: '#11151d', near: '#0b0e14', win: '#ffcf7a', walk: ['#2a2b2e', '#1c1d20'], curb: '#3e4044', road: ['#1a1b1e', '#0c0d0f'], line: '#77746c' },
  };
  /**
   * new UF.Street({ mode: 'day', part: 'all' | 'sky' | 'city' | 'ground', walk: 700, curb: 790, lanes: [880] })
   * Sky and distant towers down to the building line `walk`, the pavement down to the kerb `curb`, and
   * the road below it with dashed lines between `lanes` (y of each lane divider). Split it into parts to
   * give each its own camera parallax.
   */
  class Street extends UF.Component {
    constructor(o) {
      super({ mode: 'day', part: 'all', walk: 700, curb: 790, lanes: [], seed: 5, fadeIn: 0 }, o);
      if (!STREET[this.mode]) throw new Error('Street: mode is day or night.');
      if (!['all', 'sky', 'city', 'ground'].includes(this.part)) throw new Error('Street: part is all, sky, city or ground.');
    }
    draw(ctx, t, fx, scene) {
      const a = this.vis(t);
      if (a <= 0 || (scene && scene.key)) return;
      const S = STREET[this.mode], pt = this.part;
      ctx.save();
      ctx.globalAlpha *= a;
      if (pt === 'all' || pt === 'sky') this.sky(ctx, S);
      if (pt === 'all' || pt === 'city') this.city(ctx, S);
      if (pt === 'all' || pt === 'ground') this.ground(ctx, S);
      ctx.restore();
    }
    sky(ctx, S) {
      const g = ctx.createLinearGradient(0, -200, 0, this.walk);
      g.addColorStop(0, S.sky[0]);
      g.addColorStop(1, S.sky[1]);
      ctx.fillStyle = g;
      ctx.fillRect(-W, -400, W * 3, this.walk + 400);
      if (this.mode === 'day') {
        const s = ctx.createRadialGradient(W * 0.78, 60, 0, W * 0.78, 60, 700);
        s.addColorStop(0, 'rgba(255,248,230,0.55)');
        s.addColorStop(1, 'rgba(255,248,230,0)');
        ctx.fillStyle = s;
        ctx.fillRect(-W, -400, W * 3, this.walk + 400);
      } else {
        const hz = ctx.createLinearGradient(0, this.walk - 260, 0, this.walk);
        hz.addColorStop(0, 'rgba(120,80,60,0)');
        hz.addColorStop(1, 'rgba(120,80,60,0.28)');
        ctx.fillStyle = hz;
        ctx.fillRect(-W, this.walk - 260, W * 3, 260);
      }
    }
    city(ctx, S) {
      const r = UF.rng(this.seed), night = this.mode === 'night';
      for (const [row, col, scale] of [[0, S.far, 0.7], [1, S.near, 1]]) {
        let x = -W * 0.6;
        while (x < W * 1.6) {
          const bw = (70 + r() * 150) * scale, bh = (160 + r() * 420 + (r() < 0.25 ? r() * 260 : 0)) * scale;
          const y0 = this.walk - bh - (row === 0 ? 30 : 0);
          ctx.fillStyle = D.hexMix(col, night ? '#000000' : '#ffffff', (r() - 0.5) * 0.12 + 0.06);
          ctx.fillRect(x, y0, bw, bh + 40);
          if (r() < 0.3) { ctx.fillRect(x + bw * 0.4, y0 - 26 * scale, bw * 0.2, 26 * scale); }
          const rows = Math.floor(bh / (16 * scale)), cols = Math.max(1, Math.floor(bw / (13 * scale)));
          ctx.fillStyle = night ? UF.c(S.win, 0.55) : UF.c(S.win, 0.28 + row * 0.1);
          for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
            if (r() > (night ? 0.3 : 0.55)) continue;
            ctx.fillRect(x + 4 * scale + j * 13 * scale, y0 + 8 * scale + i * 16 * scale, 6 * scale, 8 * scale);
          }
          x += bw + (4 + r() * 22) * scale;
        }
        if (!night) {
          const hz = ctx.createLinearGradient(0, this.walk - 500, 0, this.walk);
          hz.addColorStop(0, 'rgba(225,230,230,0)');
          hz.addColorStop(1, `rgba(225,230,230,${row === 0 ? 0.5 : 0.25})`);
          ctx.fillStyle = hz;
          ctx.fillRect(-W, this.walk - 500, W * 3, 500);
        }
      }
    }
    ground(ctx, S) {
      const wg = ctx.createLinearGradient(0, this.walk, 0, this.curb);
      wg.addColorStop(0, S.walk[1]);
      wg.addColorStop(1, S.walk[0]);
      ctx.fillStyle = wg;
      ctx.fillRect(-W, this.walk, W * 3, this.curb - this.walk);
      ctx.strokeStyle = 'rgba(0,0,0,0.12)';
      ctx.lineWidth = 1.5;
      for (let x = -W; x < W * 2; x += 90) { ctx.beginPath(); ctx.moveTo(x, this.walk); ctx.lineTo(x - 30, this.curb); ctx.stroke(); }
      ctx.fillStyle = S.curb;
      ctx.fillRect(-W, this.curb - 6, W * 3, 10);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(-W, this.curb + 4, W * 3, 4);
      const rg = ctx.createLinearGradient(0, this.curb, 0, H + 200);
      rg.addColorStop(0, S.road[0]);
      rg.addColorStop(1, S.road[1]);
      ctx.fillStyle = rg;
      ctx.fillRect(-W, this.curb + 8, W * 3, H + 400);
      ctx.fillStyle = S.line;
      for (const y of this.lanes) for (let x = -W; x < W * 2; x += 160) ctx.fillRect(x, y - 3, 80, 6);
    }
    editorial() { return {}; }
  }
  UF.Street = Street;

  /* ------------------------------------------------------------------ */
  /* Traffic                                                             */
  /* ------------------------------------------------------------------ */
  const CAR_COLORS = ['#7a1d24', '#2f4d6b', '#c9c6bd', '#1b1d21', '#e8e4da', '#55606b', '#8a6a3a', '#3f5a48'];
  const LEN = { sedan: 466, van: 486, jeepney: 616 };
  /**
   * new UF.Traffic({ mode: 'day', lanes: [{ y: 1000, dir: 1, speed: 380, scale: 1.1, gap: [160, 520],
   *   styles: ['sedan', 'van', 'jeepney'], seed: 1 }] })
   * Each lane is an endless loop of vehicles crossing the frame at `speed` px/s (dir -1 drives left).
   * List lanes far to near. Night mode turns the lights on.
   */
  class Traffic extends UF.Component {
    constructor(o) {
      super({ lanes: [], mode: 'day', seed: 9, fadeIn: 0 }, o);
      if (!MODES.includes(this.mode)) throw new Error('Traffic: mode is day or night.');
      this.loops = this.lanes.map((ln, li) => {
        const r = UF.rng((ln.seed ?? li + 1) * 7919 + this.seed), styles = ln.styles || ['sedan'], k = ln.scale || 1;
        const cars = [];
        let s = 0;
        const n = ln.count || 10;
        for (let i = 0; i < n; i++) {
          const style = styles[Math.floor(r() * styles.length)];
          const color = style === 'jeepney' ? ['#c9ccd0', '#d8d2c4', '#b8862e'][Math.floor(r() * 3)] : CAR_COLORS[Math.floor(r() * CAR_COLORS.length)];
          const prop = new UF.Prop({ type: 'car', style, color, seed: Math.floor(r() * 9), lights: this.mode === 'night', x: 0, y: 0, scale: k, flip: (ln.dir || 1) < 0 });
          const len = LEN[style] * k;
          cars.push({ prop, s, len });
          const gap = ln.gap || [160, 520];
          s += len + lerp(gap[0], gap[1], r());
        }
        return { ln, cars, total: Math.max(s, W + 1400) };
      });
    }
    draw(ctx, t) {
      const a = this.vis(t);
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha *= a;
      for (const L of this.loops) {
        const { ln, cars, total } = L, dir = ln.dir || 1, margin = 700;
        const shift = (ln.offset || 0) + (ln.speed || 380) * t;
        for (const c of cars) {
          const u = (((c.s + shift) % total) + total) % total;
          const x = dir > 0 ? u - margin : W + margin - u;
          if (x < -margin || x > W + margin) continue;
          const p = c.prop;
          p.cur = { x, y: ln.y, rotate: 0, size: 1 };
          ctx.save();
          ctx.translate(x, ln.y);
          ctx.scale(p.scale * (dir < 0 ? -1 : 1), p.scale);
          p.def.draw(ctx, p, t, null);
          ctx.restore();
        }
      }
      ctx.restore();
    }
    editorial() { return {}; }
  }
  UF.Traffic = Traffic;

  /* ------------------------------------------------------------------ */
  /* Skyline — low-poly night city from the air                          */
  /* ------------------------------------------------------------------ */
  function clipNear(pts, near) {
    const out = [];
    for (let i = 0; i < pts.length; i++) {
      const a = pts[i], b = pts[(i + 1) % pts.length], ain = a[2] >= near, bin = b[2] >= near;
      if (ain) out.push(a);
      if (ain !== bin) {
        const k = (near - a[2]) / (b[2] - a[2]);
        out.push([a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, near]);
      }
    }
    return out;
  }

  /**
   * new UF.Skyline({ glide: { at: 0, dur: 18, ease: 'inOutSine' }, from: { pos, look }, to: { pos, look } })
   * A city of flat-shaded towers on a road grid, lit windows and streaks of car lights, seen by a camera
   * that glides from `from` to `to` (positions and look-at points in metres; y is up). The building at
   * the origin is the plain landmark tower the glide ends on; `tower: { w, d, h, color }` sizes it.
   * Draws the whole frame.
   */
  class Skyline extends UF.Component {
    constructor(o) {
      super({
        seed: 11, glide: { at: 0, dur: 18, ease: 'inOutSine' },
        from: { pos: [-230, 470, -1180], look: [30, 0, 260] },
        to: { pos: [0, 104, -350], look: [0, 62, 0] },
        fov: 56, grid: [9, 8, 13], block: 92, road: 24, fog: 1500,
        tower: { w: 62, d: 46, h: 136, color: '#d6d0c2' },
        sky: ['#03050b', '#171628'], haze: '#2c2430', ground: '#06070a', warm: '#ffc874', cool: '#cfe0ff', traffic: 240, sway: 1,
        fadeIn: 0,
      }, o);
      this.build();
    }

    build() {
      const r = UF.rng(this.seed), B = this.block, P = B + this.road, [nx, nb, nf] = this.grid;
      this.P = P;
      const blds = [];
      const tones = ['#3a4150', '#454b57', '#2f3644', '#4d4a4a', '#384048', '#423f47'];
      for (let i = -nx; i <= nx; i++) for (let j = -nb; j <= nf; j++) {
        if (i === 0 && j === 0) continue;
        const cx = i * P, cz = j * P, centre = Math.exp(-((i * i) / 26 + ((j - 2) * (j - 2)) / 50));
        const clear = Math.abs(i) <= 1 && j < 0;
        const lots = [];
        const q = r(), x0 = cx - B / 2 + 3, x1 = cx + B / 2 - 3, z0 = cz - B / 2 + 3, z1 = cz + B / 2 - 3, mx = lerp(x0, x1, 0.35 + r() * 0.3), mz = lerp(z0, z1, 0.35 + r() * 0.3);
        if (q < 0.28) lots.push([x0, x1, z0, z1]);
        else if (q < 0.62) { if (r() < 0.5) lots.push([x0, mx - 2, z0, z1], [mx + 2, x1, z0, z1]); else lots.push([x0, x1, z0, mz - 2], [x0, x1, mz + 2, z1]); }
        else lots.push([x0, mx - 2, z0, mz - 2], [mx + 2, x1, z0, mz - 2], [x0, mx - 2, mz + 2, z1], [mx + 2, x1, mz + 2, z1]);
        for (const [a0, a1, b0, b1] of lots) {
          let h = 9 + r() * 24 + (r() < 0.18 + 0.45 * centre ? r() * 70 * (0.5 + centre) : 0);
          if (clear) h = Math.min(h, 22);
          blds.push({ x0: a0, x1: a1, z0: b0, z1: b1, h, color: tones[Math.floor(r() * tones.length)], warm: r() < 0.64, lit: 0.16 + r() * 0.34, seed: Math.floor(r() * 1e6) });
        }
      }
      const T0 = this.tower;
      blds.push({ x0: -T0.w / 2, x1: T0.w / 2, z0: -T0.d / 2, z1: T0.d / 2, h: T0.h, color: T0.color, warm: false, lit: 0.62, seed: 99, landmark: true });
      blds.push({ x0: -50, x1: 50, z0: T0.d / 2 + 4, z1: T0.d / 2 + 30, h: 20, color: D.shade(T0.color, -0.12), warm: true, lit: 0.5, seed: 98 });
      this.blds = blds;
      this.ext = { x0: -(nx + 0.5) * P, x1: (nx + 0.5) * P, z0: -(nb + 0.5) * P, z1: (nf + 0.5) * P };
      this.roads = [];
      for (let i = -nx - 1; i <= nx; i++) this.roads.push({ along: 'z', c: (i + 0.5) * P });
      for (let j = -nb - 1; j <= nf; j++) this.roads.push({ along: 'x', c: (j + 0.5) * P });
      this.cars = [];
      for (let k = 0; k < this.traffic; k++) {
        const road = this.roads[Math.floor(r() * this.roads.length)], dir = r() < 0.5 ? 1 : -1;
        this.cars.push({ road, dir, lane: dir * (3 + r() * 3), speed: 9 + r() * 11, phase: r(), len: 16 + r() * 22 });
      }
    }

    cam(t) {
      const g = this.glide, k = UF.easeFn(g.ease || 'inOutSine')(seg(t, g.at || 0, g.dur || 18));
      const L3 = (a, b) => [lerp(a[0], b[0], k), lerp(a[1], b[1], k), lerp(a[2], b[2], k)];
      const pos = L3(this.from.pos, this.to.pos), look = L3(this.from.look, this.to.look);
      if (this.sway) { pos[0] += this.sway * 1.6 * Math.sin(t * 0.37); pos[1] += this.sway * 1.1 * Math.sin(t * 0.29 + 1); }
      const dx = look[0] - pos[0], dy = look[1] - pos[1], dz = look[2] - pos[2];
      const yaw = Math.atan2(dx, dz), pitch = Math.atan2(-dy, Math.hypot(dx, dz));
      return { pos, f: (W / 2) / Math.tan((this.fov * Math.PI / 180) / 2), pitch,
        cy: Math.cos(yaw), sy: Math.sin(yaw), cp: Math.cos(pitch), sp: Math.sin(pitch) };
    }

    toCam(C, x, y, z) {
      const dx = x - C.pos[0], dy = y - C.pos[1], dz = z - C.pos[2];
      const xr = dx * C.cy - dz * C.sy, zr = dx * C.sy + dz * C.cy;
      return [xr, dy * C.cp + zr * C.sp, zr * C.cp - dy * C.sp];
    }

    /** Builds a path for a world polygon clipped at the near plane; false when nothing is in front. */
    path3(ctx, C, pts) {
      let q = pts.map(p => this.toCam(C, p[0], p[1], p[2]));
      if (q.every(v => v[2] < 1.5)) return false;
      if (q.some(v => v[2] < 1.5)) q = clipNear(q, 1.5);
      if (q.length < 3) return false;
      ctx.beginPath();
      for (let i = 0; i < q.length; i++) {
        const sx = W / 2 + C.f * q[i][0] / q[i][2], sy = H / 2 - C.f * q[i][1] / q[i][2];
        if (i) ctx.lineTo(sx, sy); else ctx.moveTo(sx, sy);
      }
      ctx.closePath();
      return true;
    }

    screen(C, x, y, z) {
      const v = this.toCam(C, x, y, z);
      return v[2] < 1.5 ? null : [W / 2 + C.f * v[0] / v[2], H / 2 - C.f * v[1] / v[2], v[2]];
    }

    windows(ctx, C, c3, wm, hm, b, face, fog) {
      const s = c3.map(p => this.screen(C, p[0], p[1], p[2]));
      if (s.some(v => !v)) return;
      const hpx = Math.max(Math.hypot(s[3][0] - s[0][0], s[3][1] - s[0][1]), Math.hypot(s[2][0] - s[1][0], s[2][1] - s[1][1]));
      const wpx = Math.max(Math.hypot(s[1][0] - s[0][0], s[1][1] - s[0][1]), Math.hypot(s[2][0] - s[3][0], s[2][1] - s[3][1]));
      const rows = Math.min(40, Math.max(1, Math.floor(hm / 3.8))), cols = Math.min(16, Math.max(1, Math.floor(wm / 4.4)));
      const color = b.landmark ? '#e6efff' : b.warm ? this.warm : this.cool;
      const alpha = (1 - fog * 0.8) * (b.landmark ? 0.95 : 0.85);
      if (hpx < rows * 1.7 || wpx < cols * 1.4) {
        if (this.path3(ctx, C, c3)) {
          ctx.fillStyle = UF.c(color, b.lit * 0.32 * alpha);
          ctx.fill();
        }
        return;
      }
      const ww = (wpx / cols) * (b.landmark ? 0.62 : 0.5), wh = (hpx / rows) * 0.46;
      ctx.beginPath();
      for (let rr = 0; rr < rows; rr++) {
        const v = (rr + 0.5) / rows;
        for (let cc = 0; cc < cols; cc++) {
          if (hash(b.seed + face * 7919 + cc * 31, rr) > b.lit) continue;
          const u = (cc + 0.5) / cols;
          const bx = s[0][0] + (s[1][0] - s[0][0]) * u, by = s[0][1] + (s[1][1] - s[0][1]) * u;
          const tx = s[3][0] + (s[2][0] - s[3][0]) * u, ty = s[3][1] + (s[2][1] - s[3][1]) * u;
          ctx.rect(bx + (tx - bx) * v - ww / 2, by + (ty - by) * v - wh / 2, ww, wh);
        }
      }
      ctx.fillStyle = UF.c(color, alpha);
      ctx.fill();
    }

    building(ctx, C, b, t) {
      const { x0, x1, z0, z1, h } = b, P = C.pos;
      const dist = Math.hypot((x0 + x1) / 2 - P[0], h / 2 - P[1], (z0 + z1) / 2 - P[2]);
      const fog = 1 - Math.exp(-dist / this.fog);
      const col = k => D.hexMix(D.shade(b.color, k), this.haze, fog * 0.85);
      if (P[1] > h && this.path3(ctx, C, [[x0, h, z0], [x1, h, z0], [x1, h, z1], [x0, h, z1]])) {
        ctx.fillStyle = col(b.landmark ? 0.05 : 0.1);
        ctx.fill();
      }
      const faces = [];
      if (P[2] < z0) faces.push([[[x0, 0, z0], [x1, 0, z0], [x1, h, z0], [x0, h, z0]], x1 - x0, -0.12, 0]);
      if (P[2] > z1) faces.push([[[x1, 0, z1], [x0, 0, z1], [x0, h, z1], [x1, h, z1]], x1 - x0, -0.42, 1]);
      if (P[0] < x0) faces.push([[[x0, 0, z1], [x0, 0, z0], [x0, h, z0], [x0, h, z1]], z1 - z0, -0.36, 2]);
      if (P[0] > x1) faces.push([[[x1, 0, z0], [x1, 0, z1], [x1, h, z1], [x1, h, z0]], z1 - z0, -0.28, 3]);
      for (const [c3, wm, k, id] of faces) {
        if (!this.path3(ctx, C, c3)) continue;
        if (b.landmark) {
          const top = this.screen(C, c3[0][0], h, c3[0][2]), bot = this.screen(C, c3[0][0], 0, c3[0][2]);
          if (top && bot) {
            const g = ctx.createLinearGradient(0, bot[1], 0, top[1]);
            g.addColorStop(0, col(k + 0.16));
            g.addColorStop(1, col(k - 0.08));
            ctx.fillStyle = g;
          } else ctx.fillStyle = col(k);
        } else ctx.fillStyle = col(k);
        ctx.fill();
        this.windows(ctx, C, c3, wm, h, b, id, fog);
        if (b.landmark && id === 0) {
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          if (this.path3(ctx, C, [[x0, 0, z0 - 0.5], [x1, 0, z0 - 0.5], [x1, h * 0.3, z0 - 0.5], [x0, h * 0.3, z0 - 0.5]])) {
            const a = this.screen(C, 0, 0, z0), c = this.screen(C, 0, h * 0.3, z0);
            if (a && c) {
              const g = ctx.createLinearGradient(0, a[1], 0, c[1]);
              g.addColorStop(0, UF.c('#ffe2b0', 0.32));
              g.addColorStop(1, UF.c('#ffe2b0', 0));
              ctx.fillStyle = g;
              ctx.fill();
            }
          }
          ctx.restore();
        }
      }
    }

    draw(ctx, t) {
      const a = this.vis(t);
      if (a <= 0) return;
      const C = this.cam(t), P = this.P, E = this.ext;
      ctx.save();
      ctx.globalAlpha *= a;
      const hy = H / 2 - C.f * Math.tan(C.pitch);
      const sg = ctx.createLinearGradient(0, Math.min(hy, H) - 700, 0, hy);
      sg.addColorStop(0, this.sky[0]);
      sg.addColorStop(1, this.sky[1]);
      ctx.fillStyle = sg;
      ctx.fillRect(0, 0, W, H);
      const gy = clamp(hy, -200, H + 200);
      ctx.fillStyle = this.ground;
      ctx.fillRect(0, gy, W, H - gy + 10);
      if (hy > -400) {
        const hz = ctx.createLinearGradient(0, hy - 160, 0, hy + 120);
        hz.addColorStop(0, 'rgba(110,70,55,0)');
        hz.addColorStop(0.6, 'rgba(110,70,55,0.35)');
        hz.addColorStop(1, 'rgba(110,70,55,0)');
        ctx.fillStyle = hz;
        ctx.fillRect(0, hy - 160, W, 280);
      }
      const half = this.road / 2;
      for (const rd of this.roads) {
        const pts = rd.along === 'z'
          ? [[rd.c - half, 0, E.z0], [rd.c + half, 0, E.z0], [rd.c + half, 0, E.z1], [rd.c - half, 0, E.z1]]
          : [[E.x0, 0, rd.c - half], [E.x1, 0, rd.c - half], [E.x1, 0, rd.c + half], [E.x0, 0, rd.c + half]];
        if (!this.path3(ctx, C, pts)) continue;
        ctx.fillStyle = '#1b1814';
        ctx.fill();
      }
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const rd of this.roads) {
        const pts = rd.along === 'z'
          ? [[rd.c - 1.2, 0, E.z0], [rd.c + 1.2, 0, E.z0], [rd.c + 1.2, 0, E.z1], [rd.c - 1.2, 0, E.z1]]
          : [[E.x0, 0, rd.c - 1.2], [E.x1, 0, rd.c - 1.2], [E.x1, 0, rd.c + 1.2], [E.x0, 0, rd.c + 1.2]];
        if (!this.path3(ctx, C, pts)) continue;
        ctx.fillStyle = 'rgba(255,170,90,0.10)';
        ctx.fill();
      }
      if (this.path3(ctx, C, [[-60, 0.2, -this.tower.d / 2 - 46], [60, 0.2, -this.tower.d / 2 - 46], [60, 0.2, this.tower.d / 2 + 34], [-60, 0.2, this.tower.d / 2 + 34]])) {
        ctx.fillStyle = 'rgba(255,214,160,0.07)';
        ctx.fill();
      }
      ctx.lineCap = 'round';
      for (const c of this.cars) {
        const rd = c.road, span = rd.along === 'z' ? E.z1 - E.z0 : E.x1 - E.x0, start = rd.along === 'z' ? E.z0 : E.x0;
        const s = start + ((((c.phase * span + c.dir * c.speed * t) % span) + span) % span);
        const s2 = s - c.dir * c.len;
        const A = rd.along === 'z' ? [rd.c + c.lane, 0.6, s] : [s, 0.6, rd.c + c.lane];
        const Bp = rd.along === 'z' ? [rd.c + c.lane, 0.6, s2] : [s2, 0.6, rd.c + c.lane];
        let qa = this.toCam(C, ...A), qb = this.toCam(C, ...Bp);
        if (qa[2] < 1.5 && qb[2] < 1.5) continue;
        if (qa[2] < 1.5 || qb[2] < 1.5) {
          const [inn, out] = qa[2] >= 1.5 ? [qa, qb] : [qb, qa];
          const k = (1.5 - inn[2]) / (out[2] - inn[2]);
          const cut = [inn[0] + (out[0] - inn[0]) * k, inn[1] + (out[1] - inn[1]) * k, 1.5];
          if (qa[2] >= 1.5) qb = cut; else qa = cut;
        }
        const ax = W / 2 + C.f * qa[0] / qa[2], ay = H / 2 - C.f * qa[1] / qa[2];
        const bx = W / 2 + C.f * qb[0] / qb[2], by = H / 2 - C.f * qb[1] / qb[2];
        const toward = (rd.along === 'z' ? c.dir < 0 : c.dir * (rd.c > C.pos[2] ? 1 : -1) < 0);
        const z = (qa[2] + qb[2]) / 2, wpx = Math.max(0.9, C.f * 1.4 / z);
        const fog = 1 - Math.exp(-z / this.fog);
        ctx.strokeStyle = toward ? `rgba(255,236,200,${(0.55 * (1 - fog * 0.7)).toFixed(3)})` : `rgba(255,60,50,${(0.6 * (1 - fog * 0.7)).toFixed(3)})`;
        ctx.lineWidth = wpx;
        ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
      }
      ctx.restore();
      const order = this.blds.map(b => {
        const dx = (b.x0 + b.x1) / 2 - C.pos[0], dz = (b.z0 + b.z1) / 2 - C.pos[2];
        return { b, d: dx * dx + dz * dz };
      }).sort((p, q) => q.d - p.d);
      for (const { b } of order) {
        const c = this.screen(C, (b.x0 + b.x1) / 2, b.h / 2, (b.z0 + b.z1) / 2);
        if (c) {
          const rad = C.f * Math.max(b.x1 - b.x0, b.z1 - b.z0, b.h) / c[2];
          if (c[0] + rad < -40 || c[0] - rad > W + 40 || c[1] + rad < -40 || c[1] - rad > H + 40) continue;
        } else if (Math.min(...[b.x0, b.x1].map(x => Math.abs(x - C.pos[0]))) > 200) continue;
        this.building(ctx, C, b, t);
      }
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      for (const b of this.blds) {
        if (b.h < 62) continue;
        const on = Math.sin(t * 3.1 + b.seed) > 0.2;
        if (!on) continue;
        for (const [x, z] of [[b.x0 + 2, b.z0 + 2], [b.x1 - 2, b.z1 - 2]]) {
          const s = this.screen(C, x, b.h + 1.5, z);
          if (!s) continue;
          const r = Math.max(1.4, C.f * 1.6 / s[2]);
          const g = ctx.createRadialGradient(s[0], s[1], 0, s[0], s[1], r * 4);
          g.addColorStop(0, 'rgba(255,60,50,0.85)');
          g.addColorStop(1, 'rgba(255,60,50,0)');
          ctx.fillStyle = g;
          ctx.fillRect(s[0] - r * 4, s[1] - r * 4, r * 8, r * 8);
        }
      }
      ctx.restore();
      const vg = ctx.createLinearGradient(0, 0, 0, H);
      vg.addColorStop(0, 'rgba(10,8,16,0.35)');
      vg.addColorStop(0.3, 'rgba(10,8,16,0)');
      vg.addColorStop(0.8, 'rgba(10,8,16,0)');
      vg.addColorStop(1, 'rgba(10,8,16,0.4)');
      ctx.fillStyle = vg;
      ctx.fillRect(0, 0, W, H);
      ctx.restore();
    }

    editorial() { return {}; }
  }
  UF.Skyline = Skyline;
})(window.UF);

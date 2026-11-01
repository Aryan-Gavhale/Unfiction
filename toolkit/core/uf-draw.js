/*!
 * Unfiction GFX Toolkit — drawing helpers
 * Stateless Canvas 2D helpers shared by every component.
 */
(function (UF) {
  'use strict';

  const D = UF.draw = {};
  const { clamp, lerp, c } = UF;

  /* ------------------------------------------------------------------ */
  /* Text                                                                */
  /* ------------------------------------------------------------------ */

  /** Width of text drawn with extra letter spacing (px between glyphs). */
  D.measure = function (ctx, text, spacing = 0) {
    return ctx.measureText(text).width + Math.max(0, text.length - 1) * spacing;
  };

  /**
   * Draw text with letter spacing. align: 'left' | 'center' | 'right'.
   * Returns the drawn width.
   */
  D.text = function (ctx, text, x, y, o = {}) {
    text = String(text);
    if (o.font) ctx.font = o.font;
    if (o.color) ctx.fillStyle = o.color;
    ctx.textBaseline = o.baseline || 'alphabetic';
    const sp = o.spacing || 0;
    const w = D.measure(ctx, text, sp);
    let cx = x - (o.align === 'center' ? w / 2 : o.align === 'right' ? w : 0);
    ctx.textAlign = 'left';
    if (!sp) {
      if (o.stroke) ctx.strokeText(text, cx, y);
      else ctx.fillText(text, cx, y);
      return w;
    }
    for (const ch of text) {
      if (o.stroke) ctx.strokeText(ch, cx, y);
      else ctx.fillText(ch, cx, y);
      cx += ctx.measureText(ch).width + sp;
    }
    return w;
  };

  /** Words of one paragraph, with every phrase in `keep` merged into a single unbreakable word. */
  function wrapWords(para, keep) {
    const words = [...para.matchAll(/\S+/g)].map(m => ({ w: m[0], s: m.index, e: m.index + m[0].length }));
    if (!keep || !keep.length) return words.map(o => o.w);
    const spans = [];
    for (const k of keep) {
      if (!k) continue;
      for (let i = para.indexOf(k); i >= 0; i = para.indexOf(k, i + k.length)) spans.push([i, i + k.length]);
    }
    const out = [];
    let group = null;
    for (const o of words) {
      const span = spans.find(([s, e]) => o.s < e && o.e > s) || null;
      if (group && span && group.span === span) { group.w += ` ${o.w}`; continue; }
      if (group) out.push(group.w);
      group = { w: o.w, span };
    }
    if (group) out.push(group.w);
    return out;
  }

  /** Split text into lines that fit maxWidth with the current font. Phrases listed in `keep` never break across lines. */
  D.wrap = function (ctx, text, maxWidth, keep) {
    const out = [];
    for (const para of String(text).split('\n')) {
      let line = '';
      for (const word of wrapWords(para, keep)) {
        const test = line ? `${line} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && line) { out.push(line); line = word; }
        else line = test;
      }
      out.push(line);
    }
    return out;
  };

  /** Like wrap, but narrows the width as far as the line count allows, so lines come out even instead of leaving one word alone on the last line. */
  D.wrapBalanced = function (ctx, text, maxWidth, keep) {
    const n = D.wrap(ctx, text, maxWidth, keep).length;
    if (n < 2) return D.wrap(ctx, text, maxWidth, keep);
    let lo = 0, hi = maxWidth;
    for (let i = 0; i < 14; i++) {
      const mid = (lo + hi) / 2;
      if (D.wrap(ctx, text, mid, keep).length > n) lo = mid; else hi = mid;
    }
    return D.wrap(ctx, text, hi, keep);
  };

  /** Truncate text with an ellipsis so it fits maxWidth with the current font. */
  D.fit = function (ctx, text, maxWidth, spacing = 0) {
    text = String(text);
    if (D.measure(ctx, text, spacing) <= maxWidth) return text;
    let lo = 0, hi = text.length;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (D.measure(ctx, `${text.slice(0, mid)}…`, spacing) <= maxWidth) lo = mid; else hi = mid - 1;
    }
    return `${text.slice(0, lo).trimEnd()}…`;
  };

  /** Typewriter: number of visible chars of `text` at progress p (0..1). */
  D.typed = (text, p) => String(text).slice(0, Math.floor(clamp(p) * String(text).length + 1e-6));

  /** Blinking block cursor. */
  D.cursor = function (ctx, x, y, h, t, color, rate = 2.2) {
    if (Math.floor(t * rate * 2) % 2) return;
    ctx.fillStyle = color || c('paper');
    ctx.fillRect(x, y - h * 0.82, h * 0.5, h);
  };

  /** Scramble a string towards `target`; chars left of p*len are resolved. */
  D.scramble = function (target, p, seed = 1, pool = '0123456789ABCDEF') {
    const r = UF.rng(seed);
    const n = Math.floor(clamp(p) * target.length);
    let s = '';
    for (let i = 0; i < target.length; i++) {
      const ch = target[i];
      s += i < n || ch === ' ' ? ch : pool[Math.floor(r() * pool.length)];
    }
    return s;
  };

  /* ------------------------------------------------------------------ */
  /* Shapes                                                              */
  /* ------------------------------------------------------------------ */
  D.roundRect = function (ctx, x, y, w, h, r = 8) {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  /** Case-file panel: dark fill, hairline border, corner ticks. */
  D.panel = function (ctx, x, y, w, h, o = {}) {
    ctx.save();
    if (o.shadow !== false) { ctx.shadowColor = 'rgba(0,0,0,.55)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 12; }
    ctx.fillStyle = o.fill || c('panel', 0.92);
    D.roundRect(ctx, x, y, w, h, o.radius ?? 4);
    ctx.fill();
    ctx.restore();
    ctx.save();
    ctx.strokeStyle = o.stroke || c('line');
    ctx.lineWidth = 1.5;
    D.roundRect(ctx, x + 0.5, y + 0.5, w - 1, h - 1, o.radius ?? 4);
    ctx.stroke();
    if (o.ticks !== false) {
      const L = o.tick || 18;
      ctx.strokeStyle = o.tickColor || c('blue');
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      for (const [px, py, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
        ctx.moveTo(px, py + dy * L); ctx.lineTo(px, py); ctx.lineTo(px + dx * L, py);
      }
      ctx.stroke();
    }
    if (o.label) {
      ctx.font = UF.font.mono(16);
      D.text(ctx, o.label, x + 22, y + 34, { color: o.labelColor || c('dim'), spacing: 4 });
    }
    ctx.restore();
  };

  /** Horizontal rule drawn left-to-right with progress p. */
  D.rule = function (ctx, x, y, w, p = 1, color, lw = 2) {
    if (p <= 0) return;
    ctx.fillStyle = color || c('red');
    ctx.fillRect(x, y - lw / 2, w * clamp(p), lw);
  };

  /** Marker highlight behind text, swept left-to-right. */
  D.highlight = function (ctx, x, y, w, h, p, color) {
    if (p <= 0) return;
    ctx.save();
    ctx.globalCompositeOperation = 'multiply';
    ctx.fillStyle = color || 'rgba(217,164,65,.55)';
    const r = UF.rng(Math.floor(x + y));
    ctx.beginPath();
    const ww = w * clamp(p);
    ctx.moveTo(x - 4, y + r() * 4);
    ctx.lineTo(x + ww, y + r() * 4 - 2);
    ctx.lineTo(x + ww + 2, y + h - r() * 4);
    ctx.lineTo(x - 2, y + h + r() * 3);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  /** Hand-drawn ellipse around a rect, drawn with progress p. */
  D.circleMark = function (ctx, cx, cy, rx, ry, p, o = {}) {
    if (p <= 0) return;
    const r = UF.rng(o.seed || 7);
    const turns = 1.12;
    const start = -Math.PI * 0.6 + r() * 0.4;
    const steps = 90;
    const n = Math.max(2, Math.floor(steps * clamp(p)));
    ctx.save();
    ctx.strokeStyle = o.color || c('red');
    ctx.lineWidth = o.width || 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    const wob = [r() * 0.06, r() * 0.06, r() * 6];
    for (let i = 0; i <= n; i++) {
      const k = i / steps;
      const a = start + k * Math.PI * 2 * turns;
      const g = 1 + wob[0] * Math.sin(a * 2 + wob[2]) + k * 0.06;
      const x = cx + Math.cos(a) * rx * g;
      const y = cy + Math.sin(a) * ry * (1 + wob[1] * Math.cos(a * 3));
      i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  };

  /** Hand-drawn underline. */
  D.underline = function (ctx, x, y, w, p, o = {}) {
    if (p <= 0) return;
    const r = UF.rng(o.seed || 3);
    ctx.save();
    ctx.strokeStyle = o.color || c('red');
    ctx.lineWidth = o.width || 4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    const n = 24, m = Math.floor(n * clamp(p));
    for (let i = 0; i <= m; i++) {
      const k = i / n;
      const yy = y + Math.sin(k * 5 + r() * 0.3) * 2 + k * 3;
      i ? ctx.lineTo(x + w * k, yy) : ctx.moveTo(x, yy);
    }
    ctx.stroke();
    ctx.restore();
  };

  D.arrowHead = function (ctx, x, y, angle, size = 14, color) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.fillStyle = color || c('red');
    ctx.beginPath();
    ctx.moveTo(size * 0.6, 0);
    ctx.lineTo(-size * 0.6, -size * 0.5);
    ctx.lineTo(-size * 0.3, 0);
    ctx.lineTo(-size * 0.6, size * 0.5);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  };

  /** Small capsule label. */
  D.pill = function (ctx, text, x, y, o = {}) {
    ctx.save();
    ctx.font = o.font || UF.font.mono(16, 'bold');
    const sp = o.spacing ?? 2;
    const w = D.measure(ctx, text, sp) + (o.padX ?? 14) * 2;
    const h = o.h || 30;
    const left = o.align === 'center' ? x - w / 2 : o.align === 'right' ? x - w : x;
    ctx.fillStyle = o.fill || c('red');
    D.roundRect(ctx, left, y - h / 2, w, h, o.radius ?? 3);
    ctx.fill();
    if (o.stroke) { ctx.strokeStyle = o.stroke; ctx.lineWidth = 1.5; ctx.stroke(); }
    D.text(ctx, text, left + (o.padX ?? 14), y + 1, { color: o.color || c('paper'), spacing: sp, baseline: 'middle' });
    ctx.restore();
    return w;
  };

  /**
   * Street-name plate centred at (x, y): coloured plate, inset border, bold sans text.
   * o: { size: 72, fill, color, angle (degrees), pole (length of a post under the plate) }. Returns { w, h }.
   */
  D.sign = function (ctx, text, x, y, o = {}) {
    const size = o.size || 72, ink = o.color || '#f1efe8';
    ctx.save();
    ctx.font = UF.font.sans(size, 'bold');
    const sp = size * 0.04;
    const w = D.measure(ctx, text, sp) + size * 1.1, h = size * 1.55, r = size * 0.16, inset = size * 0.12;
    ctx.translate(x, y);
    if (o.angle) ctx.rotate(o.angle * Math.PI / 180);
    if (o.pole) {
      ctx.fillStyle = '#5b6068';
      ctx.fillRect(-size * 0.09, h / 2 - 2, size * 0.18, o.pole);
    }
    ctx.fillStyle = o.fill || '#1f5c3c';
    D.roundRect(ctx, -w / 2, -h / 2, w, h, r);
    ctx.fill();
    ctx.strokeStyle = ink;
    ctx.lineWidth = Math.max(2, size * 0.05);
    D.roundRect(ctx, -w / 2 + inset, -h / 2 + inset, w - inset * 2, h - inset * 2, r * 0.6);
    ctx.stroke();
    D.text(ctx, text, 0, size * 0.36, { color: ink, spacing: sp, align: 'center' });
    ctx.restore();
    return { w, h };
  };

  /** Draw a polyline up to progress p (0..1) by arc length. Returns the head point and angle. */
  D.partialPath = function (ctx, pts, p) {
    if (pts.length < 2 || p <= 0) return null;
    const seg = [];
    let total = 0;
    for (let i = 1; i < pts.length; i++) {
      const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      seg.push(d); total += d;
    }
    let left = total * clamp(p);
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    let head = { x: pts[0][0], y: pts[0][1], a: 0 };
    for (let i = 1; i < pts.length; i++) {
      const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
      const a = Math.atan2(y1 - y0, x1 - x0);
      if (left >= seg[i - 1]) { ctx.lineTo(x1, y1); left -= seg[i - 1]; head = { x: x1, y: y1, a }; }
      else { const k = seg[i - 1] ? left / seg[i - 1] : 0; head = { x: lerp(x0, x1, k), y: lerp(y0, y1, k), a }; ctx.lineTo(head.x, head.y); break; }
    }
    return head;
  };

  /** Points along a quadratic bezier. */
  D.quadPoints = function (x0, y0, cx, cy, x1, y1, n = 64) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      pts.push([u * u * x0 + 2 * u * t * cx + t * t * x1, u * u * y0 + 2 * u * t * cy + t * t * y1]);
    }
    return pts;
  };

  /** Points along a cubic bezier. */
  D.cubicPoints = function (x0, y0, c1x, c1y, c2x, c2y, x1, y1, n = 64) {
    const pts = [];
    for (let i = 0; i <= n; i++) {
      const t = i / n, u = 1 - t;
      pts.push([
        u * u * u * x0 + 3 * u * u * t * c1x + 3 * u * t * t * c2x + t * t * t * x1,
        u * u * u * y0 + 3 * u * u * t * c1y + 3 * u * t * t * c2y + t * t * t * y1,
      ]);
    }
    return pts;
  };

  /** Point at progress k (0..1) on a polyline. */
  D.pointAt = function (pts, k) {
    k = clamp(k);
    const f = k * (pts.length - 1);
    const i = Math.min(pts.length - 2, Math.floor(f));
    const r = f - i;
    return [lerp(pts[i][0], pts[i + 1][0], r), lerp(pts[i][1], pts[i + 1][1], r)];
  };

  /* ------------------------------------------------------------------ */
  /* Textures                                                            */
  /* ------------------------------------------------------------------ */
  const texCache = {};

  /** Cached paper texture (warm off-white with fibres and blotches). */
  D.paperTexture = function (w, h, seed = 11, tone = UF.theme.colors.paper) {
    const key = `${w}x${h}:${seed}:${tone}`;
    if (texCache[key]) return texCache[key];
    const cv = UF.canvas(w, h), x = cv.getContext('2d');
    const r = UF.rng(seed);
    x.fillStyle = tone;
    x.fillRect(0, 0, w, h);
    for (let i = 0; i < 26; i++) {
      const g = x.createRadialGradient(r() * w, r() * h, 0, r() * w, r() * h, 60 + r() * 260);
      g.addColorStop(0, `rgba(120,100,70,${0.025 + r() * 0.04})`);
      g.addColorStop(1, 'rgba(120,100,70,0)');
      x.fillStyle = g;
      x.fillRect(0, 0, w, h);
    }
    x.strokeStyle = 'rgba(90,80,60,.06)';
    for (let i = 0; i < w * h / 900; i++) {
      const px = r() * w, py = r() * h, a = r() * Math.PI;
      x.lineWidth = 0.5 + r();
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * (3 + r() * 9), py + Math.sin(a) * (3 + r() * 9)); x.stroke();
    }
    const edge = x.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.max(w, h) * 0.75);
    edge.addColorStop(0, 'rgba(60,45,25,0)');
    edge.addColorStop(1, 'rgba(60,45,25,.22)');
    x.fillStyle = edge;
    x.fillRect(0, 0, w, h);
    return (texCache[key] = cv);
  };

  /**
   * Cached blurred silhouette of a rounded rect, for drop shadows that cost one drawImage per frame.
   * The canvas is padded by `sprite.pad` on every side: draw it at (x - pad, y - pad).
   */
  D.shadowSprite = function (w, h, r = 8, blur = 24) {
    w = Math.round(w); h = Math.round(h);
    const key = `shadow:${w}x${h}:${r}:${blur}`;
    if (texCache[key]) return texCache[key];
    const pad = Math.ceil(blur * 2.5), cv = UF.canvas(w + pad * 2, h + pad * 2), x = cv.getContext('2d');
    x.filter = `blur(${blur}px)`;
    x.fillStyle = '#000';
    D.roundRect(x, pad, pad, w, h, r);
    x.fill();
    cv.pad = pad;
    return (texCache[key] = cv);
  };

  /* ------------------------------------------------------------------ */
  /* Phone                                                               */
  /* ------------------------------------------------------------------ */
  /**
   * Phone body centred at (x, y), with a cached drop shadow. Returns the screen rect { x, y, w, h, r };
   * draw the screen content inside it, then call D.deviceNotch(ctx, screen).
   */
  D.device = function (ctx, x, y, w, h, o = {}) {
    const r = o.radius ?? Math.round(w * 0.14), bezel = o.bezel ?? Math.round(w * 0.032);
    const left = x - w / 2, top = y - h / 2;
    if (o.shadow !== false) {
      const sh = D.shadowSprite(w, h, r, 34);
      ctx.save();
      ctx.globalAlpha *= 0.75;
      ctx.drawImage(sh, left - sh.pad, top - sh.pad + 26);
      ctx.restore();
    }
    ctx.save();
    ctx.fillStyle = o.body || '#1c1f24';
    ctx.fillRect(left - 5, top + h * 0.19, 6, h * 0.06);
    ctx.fillRect(left - 5, top + h * 0.28, 6, h * 0.1);
    ctx.fillRect(left + w - 1, top + h * 0.24, 6, h * 0.12);
    D.roundRect(ctx, left, top, w, h, r);
    ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.16)';
    ctx.lineWidth = 2;
    D.roundRect(ctx, left + 2, top + 2, w - 4, h - 4, r - 2);
    ctx.stroke();
    const s = { x: left + bezel, y: top + bezel, w: w - bezel * 2, h: h - bezel * 2, r: r - bezel };
    ctx.fillStyle = o.screen || '#0b0d10';
    D.roundRect(ctx, s.x, s.y, s.w, s.h, s.r);
    ctx.fill();
    ctx.restore();
    return s;
  };

  /** Camera cut-out at the top of a phone screen returned by D.device. */
  D.deviceNotch = function (ctx, s) {
    const nw = s.w * 0.3, nh = s.w * 0.075;
    ctx.save();
    ctx.fillStyle = '#000';
    D.roundRect(ctx, s.x + (s.w - nw) / 2, s.y + s.w * 0.035, nw, nh, nh / 2);
    ctx.fill();
    ctx.restore();
  };

  /** Clock, signal and battery along the top of a phone screen. */
  D.statusBar = function (ctx, s, time = '9:41', color = c('paper')) {
    const y = s.y + s.w * 0.075;
    ctx.save();
    ctx.font = UF.font.sans(Math.round(s.w * 0.048), '600');
    D.text(ctx, time, s.x + s.w * 0.12, y + s.w * 0.018, { color, align: 'center' });
    ctx.fillStyle = color;
    const bx = s.x + s.w * 0.8;
    for (let i = 0; i < 4; i++) {
      const bh = s.w * (0.012 + i * 0.008);
      ctx.fillRect(bx - s.w * 0.1 + i * s.w * 0.016, y + s.w * 0.012 - bh, s.w * 0.01, bh);
    }
    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    D.roundRect(ctx, bx, y - s.w * 0.022, s.w * 0.06, s.w * 0.034, 3);
    ctx.stroke();
    ctx.fillRect(bx + 2.5, y - s.w * 0.022 + 2.5, s.w * 0.042, s.w * 0.034 - 5);
    ctx.restore();
  };

  /* ------------------------------------------------------------------ */
  /* Legal status badges                                                 */
  /* ------------------------------------------------------------------ */
  /*
   * Vocabulary for describing a real person's legal position on screen. Everything short of a
   * conviction says so, so a caption can never imply guilt by omission.
   */
  D.STATUS = {
    'alleged':     { text: 'ALLEGED · NOT PROVEN', color: 'amber' },
    'suspect':     { text: 'SUSPECT · NOT CHARGED', color: 'amber' },
    'arrested':    { text: 'ARRESTED · NOT CHARGED', color: 'amber' },
    'charged':     { text: 'CHARGED · NOT CONVICTED', color: 'amber' },
    'on-trial':    { text: 'ON TRIAL · NOT CONVICTED', color: 'amber' },
    'wanted':      { text: 'WANTED · NOT CONVICTED', color: 'amber' },
    'convicted':   { text: 'CONVICTED', color: 'red' },
    'acquitted':   { text: 'ACQUITTED', color: 'green' },
    'cleared':     { text: 'CLEARED', color: 'green' },
    'not-charged': { text: 'NOT CHARGED', color: 'green' },
    'witness':     { text: 'WITNESS', color: 'blue' },
    'victim':      { text: 'VICTIM', color: 'blue' },
    'official':    { text: 'OFFICIAL', color: 'blue' },
    'deceased':    { text: 'DECEASED', color: 'dim' },
  };

  /** { text, color } for a status key (case-insensitive) or a custom { text, color }. Throws on an unknown key. */
  D.statusInfo = function (s) {
    if (s && typeof s === 'object') {
      if (!s.text) throw new Error('A custom status needs text, e.g. { text: "EXTRADITED", color: "amber" }.');
      return { text: String(s.text).toUpperCase(), color: s.color || 'amber' };
    }
    const hit = D.STATUS[String(s).toLowerCase()];
    if (!hit) throw new Error(`Unknown status "${s}" — use one of ${Object.keys(D.STATUS).join(', ')}, or { text, color }.`);
    return hit;
  };

  /** Status pill. o: { align: 'left' | 'center' | 'right', size: 16, h: 32 }. Returns its width. */
  D.statusBadge = function (ctx, s, x, y, o = {}) {
    const info = D.statusInfo(s);
    const dark = ['amber', 'green', 'dim'].includes(info.color);
    return D.pill(ctx, info.text, x, y, {
      align: o.align || 'left', fill: c(info.color), color: dark ? c('black') : c('paper'),
      font: UF.font.mono(o.size || 16, 'bold'), h: o.h || 32, spacing: 3, radius: 2,
    });
  };

  /* ------------------------------------------------------------------ */
  /* Colour                                                              */
  /* ------------------------------------------------------------------ */
  const hexRgb = h => {
    const v = UF.theme.colors[h] || h;
    if (!/^#[0-9a-f]{6}$/i.test(v)) throw new Error(`Colour "${h}" must be a theme name or #rrggbb.`);
    const n = parseInt(v.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  };
  const rgbHex = rgb => `#${rgb.map(v => Math.round(clamp(v, 0, 255)).toString(16).padStart(2, '0')).join('')}`;

  /** Blend two colours (theme names or #rrggbb) by k and return #rrggbb, so the result can be blended again. */
  D.hexMix = function (a, b, k) {
    const A = hexRgb(a), B = hexRgb(b);
    return rgbHex(A.map((v, i) => v + (B[i] - v) * clamp(k)));
  };

  /** Lighten (k > 0, towards white) or darken (k < 0, towards black) a colour; returns #rrggbb. */
  D.shade = (color, k) => D.hexMix(color, k >= 0 ? '#ffffff' : '#000000', Math.abs(k));

  /* ------------------------------------------------------------------ */
  /* Formatting                                                          */
  /* ------------------------------------------------------------------ */
  D.money = function (v, o = {}) {
    const cur = o.currency ?? '$';
    if (o.compact) {
      const a = Math.abs(v);
      if (a >= 1e9) return `${cur}${(v / 1e9).toFixed(o.decimals ?? 1)}B`;
      if (a >= 1e6) return `${cur}${(v / 1e6).toFixed(o.decimals ?? 0)}M`;
      if (a >= 1e3) return `${cur}${(v / 1e3).toFixed(o.decimals ?? 0)}K`;
    }
    return cur + Math.round(v).toLocaleString('en-US') + (o.cents ? '.00' : '');
  };

  /* ------------------------------------------------------------------ */
  /* Icons — line icons on a 100x100 grid, drawn centred at (x, y)       */
  /* ------------------------------------------------------------------ */
  const ICONS = {
    email(x) { x.rect(12, 24, 76, 52); x.moveTo(12, 26); x.lineTo(50, 54); x.lineTo(88, 26); },
    fax(x) { x.rect(16, 40, 68, 40); x.rect(28, 16, 44, 24); x.moveTo(30, 56); x.lineTo(70, 56); x.moveTo(30, 66); x.lineTo(56, 66); },
    phone(x) {
      x.moveTo(30, 14); x.lineTo(42, 14); x.lineTo(46, 32); x.lineTo(38, 40);
      x.bezierCurveTo(44, 54, 50, 60, 62, 64); x.lineTo(70, 56); x.lineTo(86, 60); x.lineTo(86, 72);
      x.bezierCurveTo(86, 80, 78, 86, 70, 86); x.bezierCurveTo(40, 82, 18, 58, 14, 30); x.bezierCurveTo(14, 22, 22, 14, 30, 14);
    },
    bank(x) {
      x.moveTo(10, 36); x.lineTo(50, 12); x.lineTo(90, 36); x.closePath();
      for (const px of [22, 40, 60, 78]) { x.moveTo(px, 42); x.lineTo(px, 74); }
      x.moveTo(12, 80); x.lineTo(88, 80); x.moveTo(8, 88); x.lineTo(92, 88);
    },
    vault(x) {
      x.rect(12, 14, 76, 72); x.moveTo(62, 50); x.arc(50, 50, 12, 0, Math.PI * 2);
      x.moveTo(50, 38); x.lineTo(50, 30); x.moveTo(50, 62); x.lineTo(50, 70); x.moveTo(38, 50); x.lineTo(30, 50); x.moveTo(62, 50); x.lineTo(70, 50);
      x.moveTo(18, 86); x.lineTo(18, 92); x.moveTo(82, 86); x.lineTo(82, 92);
    },
    casino(x) {
      x.moveTo(84, 50); x.arc(50, 50, 34, 0, Math.PI * 2); x.moveTo(68, 50); x.arc(50, 50, 18, 0, Math.PI * 2);
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; x.moveTo(50 + Math.cos(a) * 24, 50 + Math.sin(a) * 24); x.lineTo(50 + Math.cos(a) * 34, 50 + Math.sin(a) * 34); }
    },
    jet(x) {
      x.moveTo(50, 8); x.bezierCurveTo(56, 14, 56, 30, 56, 40); x.lineTo(90, 58); x.lineTo(90, 66); x.lineTo(56, 56);
      x.lineTo(56, 76); x.lineTo(68, 86); x.lineTo(68, 92); x.lineTo(50, 86); x.lineTo(32, 92); x.lineTo(32, 86); x.lineTo(44, 76);
      x.lineTo(44, 56); x.lineTo(10, 66); x.lineTo(10, 58); x.lineTo(44, 40); x.bezierCurveTo(44, 30, 44, 14, 50, 8);
    },
    doc(x) { x.moveTo(22, 10); x.lineTo(62, 10); x.lineTo(80, 28); x.lineTo(80, 90); x.lineTo(22, 90); x.closePath(); x.moveTo(62, 10); x.lineTo(62, 28); x.lineTo(80, 28); for (const y of [44, 56, 68]) { x.moveTo(32, y); x.lineTo(70, y); } },
    moon(x) {
      const A = [48, 54, 36], B = [68, 38, 30];
      const dx = B[0] - A[0], dy = B[1] - A[1], d = Math.hypot(dx, dy);
      const a = (A[2] * A[2] - B[2] * B[2] + d * d) / (2 * d), h = Math.sqrt(A[2] * A[2] - a * a);
      const mx = A[0] + a * dx / d, my = A[1] + a * dy / d;
      const p1 = [mx + h * dy / d, my - h * dx / d], p2 = [mx - h * dy / d, my + h * dx / d];
      const ang = (c, p) => Math.atan2(p[1] - c[1], p[0] - c[0]);
      x.moveTo(p1[0], p1[1]);
      x.arc(A[0], A[1], A[2], ang(A, p1), ang(A, p2), true);
      x.arc(B[0], B[1], B[2], ang(B, p2), ang(B, p1), false);
      x.closePath();
    },
    sun(x) {
      x.moveTo(68, 50); x.arc(50, 50, 18, 0, Math.PI * 2);
      for (let i = 0; i < 8; i++) { const a = i * Math.PI / 4; x.moveTo(50 + Math.cos(a) * 28, 50 + Math.sin(a) * 28); x.lineTo(50 + Math.cos(a) * 40, 50 + Math.sin(a) * 40); }
    },
    lock(x) { x.rect(20, 44, 60, 44); x.moveTo(32, 44); x.lineTo(32, 32); x.arc(50, 32, 18, Math.PI, 0); x.lineTo(68, 44); x.moveTo(50, 60); x.lineTo(50, 72); },
    alert(x) { x.moveTo(50, 10); x.lineTo(92, 86); x.lineTo(8, 86); x.closePath(); x.moveTo(50, 36); x.lineTo(50, 62); x.moveTo(50, 72); x.lineTo(50, 76); },
    user(x) { x.moveTo(66, 32); x.arc(50, 32, 16, 0, Math.PI * 2); x.moveTo(16, 90); x.bezierCurveTo(16, 66, 30, 56, 50, 56); x.bezierCurveTo(70, 56, 84, 66, 84, 90); },
    computer(x) { x.rect(10, 14, 80, 54); x.moveTo(40, 68); x.lineTo(36, 84); x.moveTo(60, 68); x.lineTo(64, 84); x.moveTo(26, 86); x.lineTo(74, 86); },
    server(x) { for (const y of [12, 40, 68]) { x.rect(14, y, 72, 22); x.moveTo(26, y + 11); x.lineTo(30, y + 11); x.moveTo(60, y + 11); x.lineTo(76, y + 11); } },
    money(x) { x.rect(8, 26, 84, 48); x.moveTo(62, 50); x.arc(50, 50, 12, 0, Math.PI * 2); x.moveTo(20, 38); x.lineTo(26, 38); x.moveTo(74, 62); x.lineTo(80, 62); },
    exchange(x) { x.moveTo(14, 36); x.lineTo(80, 36); x.moveTo(66, 22); x.lineTo(82, 36); x.lineTo(66, 50); x.moveTo(86, 64); x.lineTo(20, 64); x.moveTo(34, 50); x.lineTo(18, 64); x.lineTo(34, 78); },
    printer(x) { x.rect(14, 38, 72, 34); x.rect(28, 14, 44, 24); x.rect(28, 62, 44, 26); x.moveTo(72, 50); x.lineTo(76, 50); },
    globe(x) { x.moveTo(88, 50); x.arc(50, 50, 38, 0, Math.PI * 2); x.moveTo(12, 50); x.lineTo(88, 50); x.moveTo(50, 12); x.bezierCurveTo(30, 30, 30, 70, 50, 88); x.moveTo(50, 12); x.bezierCurveTo(70, 30, 70, 70, 50, 88); },
    clock(x) { x.moveTo(88, 50); x.arc(50, 50, 38, 0, Math.PI * 2); x.moveTo(50, 50); x.lineTo(50, 26); x.moveTo(50, 50); x.lineTo(66, 58); },
    calendar(x) { x.rect(12, 20, 76, 68); x.moveTo(12, 38); x.lineTo(88, 38); x.moveTo(30, 12); x.lineTo(30, 26); x.moveTo(70, 12); x.lineTo(70, 26); },
    building(x) { x.rect(24, 10, 52, 80); for (const y of [22, 38, 54]) for (const px of [34, 54]) x.rect(px, y, 10, 8); x.rect(42, 72, 16, 18); },
    cash(x) { x.rect(10, 34, 70, 40); x.moveTo(20, 34); x.lineTo(20, 24); x.lineTo(90, 24); x.lineTo(90, 64); x.lineTo(80, 64); x.moveTo(57, 54); x.arc(45, 54, 12, 0, Math.PI * 2); },
    check(x) { x.moveTo(16, 52); x.lineTo(40, 76); x.lineTo(86, 26); },
    cross(x) { x.moveTo(20, 20); x.lineTo(80, 80); x.moveTo(80, 20); x.lineTo(20, 80); },
    stop(x) { for (let i = 0; i <= 8; i++) { const a = Math.PI / 8 + i * Math.PI / 4; i ? x.lineTo(50 + Math.cos(a) * 40, 50 + Math.sin(a) * 40) : x.moveTo(50 + Math.cos(a) * 40, 50 + Math.sin(a) * 40); } x.moveTo(30, 50); x.lineTo(70, 50); },
    code(x) { x.moveTo(34, 26); x.lineTo(12, 50); x.lineTo(34, 74); x.moveTo(66, 26); x.lineTo(88, 50); x.lineTo(66, 74); x.moveTo(56, 18); x.lineTo(44, 82); },
    ship(x) {
      x.moveTo(6, 56); x.lineTo(96, 56); x.lineTo(86, 74); x.lineTo(10, 74); x.lineTo(6, 64); x.closePath();
      x.rect(12, 38, 18, 18); x.rect(16, 28, 8, 10);
      x.moveTo(36, 50); x.lineTo(88, 50); for (const px of [46, 60, 74]) { x.moveTo(px, 50); x.lineTo(px, 56); }
    },
  };
  D.iconNames = Object.keys(ICONS);

  /**
   * Line icon. o: { color, width (stroke in icon units, default 5), fill }
   */
  D.icon = function (ctx, name, x, y, size, o = {}) {
    const fn = ICONS[name];
    if (!fn) return;
    ctx.save();
    ctx.translate(x - size / 2, y - size / 2);
    ctx.scale(size / 100, size / 100);
    ctx.beginPath();
    fn(ctx);
    ctx.lineWidth = o.width || 5;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    if (o.fill) { ctx.fillStyle = o.fill; ctx.fill(); }
    ctx.strokeStyle = o.color || c('paper');
    ctx.stroke();
    ctx.restore();
  };
})(window.UF);

/*!
 * Unfiction GFX Toolkit — Props
 * Reusable objects for dramatised scenes, drawn in centimetres in the same flat, key-lit style as
 * UF.Character, so a prop and a figure at the same `scale` are the same real-world size.
 *
 *   const atm = new UF.Prop({ type: 'atm', x: 1250, y: 900,
 *     screens: [{ at: 2, screen: 'wait' }, { at: 4, screen: 'approved' }], dispense: [{ at: 4.4, take: 6 }] });
 *   new UF.Character({ ..., actions: [{ at: 1, pose: 'reach', target: atm.point('slot'), hold: 'card' }] });
 *
 * Floor and desk items stand on y (bottom centre); wall and hand items sit on their centre; the
 * ceiling fan hangs from y. `flip` mirrors the prop (text stays readable), `size` scales it.
 * A character holds a prop by name: hold: 'card', or hold: { type: 'cash', style: 'fan' }.
 */
(function (UF) {
  'use strict';

  const { clamp, lerp, seg, ease } = UF;
  const D = UF.draw;
  const TAU = Math.PI * 2;
  const T = {};

  const hash = (a, b) => {
    let h = (Math.imul(a | 0, 374761393) + Math.imul(b | 0, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  };
  const list = v => (v == null ? [] : Array.isArray(v) ? v : [v]);
  const flickAt = f => (typeof f === 'number' ? f : f.at);
  const ell = (ctx, x, y, rx, ry, r = 0) => { ctx.beginPath(); ctx.ellipse(x, y, rx, ry, r, 0, TAU); };
  const poly = (ctx, pts) => { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); ctx.closePath(); };
  const hhmm = v => {
    if (typeof v === 'number') return v;
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(v));
    if (!m) throw new Error(`Prop: time "${v}" must be "HH:MM" or minutes.`);
    return +m[1] * 60 + +m[2];
  };

  /* ------------------------------------------------------------------ */
  /* Screens shared by the monitor, laptop and ATM                       */
  /* ------------------------------------------------------------------ */
  const CONTENT = ['dashboard', 'list', 'code', 'alert', 'email', 'text', 'blank', 'off', 'terminal', 'frozen', 'boot', 'error'];

  /* Interface pieces for screens, drawn in the caller's units (centimetres inside a prop's screen). */
  const ui = {
    /** Arrow pointer with its tip at (x, y), s tall; press (0..1) squashes it for a click. */
    cursor(ctx, x, y, s, press = 0) {
      ctx.save();
      ctx.translate(x, y);
      const k = (s / 26) * (1 - press * 0.15);
      ctx.scale(k, k);
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(0, 22); ctx.lineTo(6, 17); ctx.lineTo(10, 26); ctx.lineTo(14, 24); ctx.lineTo(10, 15); ctx.lineTo(17, 15);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1.6;
      ctx.lineJoin = 'round';
      ctx.stroke();
      ctx.restore();
    },
    /** Ring spreading from a click at (x, y); k runs 0..1 after the click. */
    ripple(ctx, x, y, r, k, color = '#3a6ea5') {
      if (k <= 0 || k >= 1) return;
      ctx.strokeStyle = UF.c(color, 1 - k);
      ctx.lineWidth = r * 0.12;
      ctx.beginPath(); ctx.arc(x, y, r * (0.3 + k), 0, TAU); ctx.stroke();
    },
    /** Application window with a title bar. Returns the body { x, y, w, h }. */
    window(ctx, x, y, w, h, o = {}) {
      const dark = o.theme === 'dark', bar = o.bar ?? h * 0.075;
      ctx.fillStyle = o.fill || (dark ? '#0d1724' : '#eceae4');
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = o.barFill || (dark ? '#16263a' : '#2a2e35');
      ctx.fillRect(x, y, w, bar);
      ['#c1121f', '#d9a441', '#4caf7a'].forEach((c, i) => { ctx.fillStyle = c; ctx.beginPath(); ctx.arc(x + bar * (0.6 + i * 0.55), y + bar / 2, bar * 0.17, 0, TAU); ctx.fill(); });
      if (o.title) {
        ctx.font = UF.font.mono(bar * 0.42, 'bold');
        D.text(ctx, o.title, x + w / 2, y + bar / 2, { color: o.titleColor || '#8d8a82', align: 'center', baseline: 'middle', spacing: bar * 0.06 });
      }
      return { x, y: y + bar, w, h: h - bar };
    },
    /** Push button; hot (0..1) is hover, down (0..1) is pressed. */
    button(ctx, x, y, w, h, text, o = {}) {
      const hot = o.hot || 0, dy = (o.down || 0) * h * 0.05;
      D.roundRect(ctx, x, y + dy, w, h, h * 0.18);
      ctx.fillStyle = o.fill ? UF.mix(o.fill, '#ffffff', hot * 0.2) : UF.mix('#e4ebf3', '#3a6ea5', hot * 0.3);
      ctx.fill();
      ctx.strokeStyle = o.stroke || '#3a6ea5';
      ctx.lineWidth = h * 0.05;
      ctx.stroke();
      ctx.font = UF.font.sans(o.size || h * 0.42, '600');
      D.text(ctx, text, x + w / 2, y + h / 2 + dy, { color: o.color || '#3a6ea5', align: 'center', baseline: 'middle' });
    },
    /** Progress bar filled to k (0..1). */
    progress(ctx, x, y, w, h, k, o = {}) {
      D.roundRect(ctx, x, y, w, h, h / 2);
      ctx.fillStyle = o.track || 'rgba(0,0,0,0.16)';
      ctx.fill();
      if (k <= 0) return;
      D.roundRect(ctx, x, y, Math.max(h, w * clamp(k)), h, h / 2);
      ctx.fillStyle = o.fill || '#3a6ea5';
      ctx.fill();
    },
    /** Modal error box centred on (cx, cy): title, text, a red icon and an OK button. */
    dialog(ctx, cx, cy, w, h, o = {}) {
      const x = cx - w / 2, y = cy - h / 2, bar = h * 0.2;
      ctx.fillStyle = 'rgba(0,0,0,0.4)';
      ctx.fillRect(x + w * 0.015, y + h * 0.05, w, h);
      ctx.fillStyle = '#f1efe9';
      ctx.fillRect(x, y, w, h);
      ctx.fillStyle = o.barFill || '#2a2e35';
      ctx.fillRect(x, y, w, bar);
      ctx.font = UF.font.sans(bar * 0.48, '600');
      D.text(ctx, o.title || 'Error', x + bar * 0.45, y + bar / 2, { color: '#e8e4da', baseline: 'middle' });
      const ir = h * 0.14, ix = x + w * 0.12, iy = y + bar + (h - bar) * 0.38;
      ctx.fillStyle = o.iconColor || '#c1121f';
      ctx.beginPath(); ctx.arc(ix, iy, ir, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = ir * 0.26;
      ctx.lineCap = 'round';
      const q = ir * 0.4;
      ctx.beginPath(); ctx.moveTo(ix - q, iy - q); ctx.lineTo(ix + q, iy + q); ctx.moveTo(ix + q, iy - q); ctx.lineTo(ix - q, iy + q); ctx.stroke();
      ctx.font = UF.font.sans(o.size || h * 0.105);
      const lines = D.wrap(ctx, o.text || '', w * 0.72);
      lines.forEach((ln, i) => D.text(ctx, ln, x + w * 0.23, iy + (i - (lines.length - 1) / 2) * h * 0.14, { color: '#1f2328', baseline: 'middle' }));
      ui.button(ctx, x + w * 0.76, y + h * 0.74, w * 0.18, h * 0.16, o.button || 'OK', { hot: o.hot || 0 });
    },
    /** Notification card: accent icon, a kicker line, a bold line and a grey line. */
    toast(ctx, x, y, w, h, o = {}) {
      const acc = o.accent || '#3a6ea5';
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(x + w * 0.015, y + h * 0.07, w, h);
      D.roundRect(ctx, x, y, w, h, h * 0.1);
      ctx.fillStyle = o.fill || '#f4f2ed';
      ctx.fill();
      ctx.fillStyle = acc;
      ctx.fillRect(x, y + h * 0.1, w * 0.012, h * 0.8);
      const r = h * 0.24, ix = x + h * 0.42, iy = y + h / 2;
      ctx.beginPath(); ctx.arc(ix, iy, r, 0, TAU); ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = r * 0.12;
      ctx.lineJoin = 'round';
      ctx.strokeRect(ix - r * 0.5, iy - r * 0.34, r, r * 0.68);
      ctx.beginPath(); ctx.moveTo(ix - r * 0.5, iy - r * 0.34); ctx.lineTo(ix, iy + r * 0.06); ctx.lineTo(ix + r * 0.5, iy - r * 0.34); ctx.stroke();
      const tx = x + h * 0.84;
      ctx.font = UF.font.sans(h * 0.15, '700');
      D.text(ctx, o.title || '1 NEW MESSAGE', tx, y + h * 0.27, { color: acc, baseline: 'middle', spacing: h * 0.012 });
      ctx.font = UF.font.sans(h * 0.2, '600');
      D.text(ctx, o.text || '', tx, y + h * 0.53, { color: '#1f2328', baseline: 'middle' });
      ctx.font = UF.font.sans(h * 0.15);
      D.text(ctx, o.sub || '', tx, y + h * 0.77, { color: '#6a6f76', baseline: 'middle' });
    },
    /** Ring of dots chasing round, for loading and frozen screens. */
    spinner(ctx, x, y, r, t, color = '#e8e4da') {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * TAU, k = (((i / 8 - t * 1.2) % 1) + 1) % 1;
        ctx.fillStyle = UF.c(color, 0.15 + 0.85 * (1 - k));
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * r, y + Math.sin(a) * r, r * 0.2, 0, TAU); ctx.fill();
      }
    },
  };

  /** Banking message terminal: menu, a table of messages, status bar. rows: { at, dur, n, from } adds rows over time. */
  function terminal(ctx, p, t, x, y, w, h, title) {
    const bar = h * 0.085, foot = h * 0.065, side = w * 0.17;
    ctx.fillStyle = p.col('#0a1828');
    ctx.fillRect(x, y, w, h);
    ctx.fillStyle = p.col('#12263d');
    ctx.fillRect(x, y, w, bar);
    ctx.fillRect(x, y + h - foot, w, foot);
    ctx.font = UF.font.mono(bar * 0.42, 'bold');
    D.text(ctx, title || 'MESSAGE TERMINAL', x + w * 0.025, y + bar / 2, { color: p.col('#8fb3d9'), baseline: 'middle', spacing: bar * 0.05 });
    ctx.fillStyle = p.col('#0e2135');
    ctx.fillRect(x, y + bar, side, h - bar - foot);
    for (let i = 0; i < 7; i++) {
      ctx.fillStyle = p.col(i === 2 ? '#3a6ea5' : '#22405f');
      ctx.fillRect(x + side * 0.12, y + bar + h * (0.05 + i * 0.075), side * (i === 2 ? 0.76 : 0.5 + 0.25 * hash(i, 41)), h * 0.035);
    }
    const tx = x + side + w * 0.03, tw = w - side - w * 0.05, rowH = h * 0.074;
    const top = y + bar + h * 0.045;
    ctx.fillStyle = p.col('#2c4a6b');
    [0, 0.2, 0.42, 0.8].forEach((c, i) => ctx.fillRect(tx + tw * c, top, tw * [0.12, 0.14, 0.2, 0.12][i], h * 0.026));
    const r = p.rows;
    const total = r ? Math.floor(lerp(r.from || 0, r.n, seg(t, r.at, r.dur ?? 4))) : 8;
    const maxRows = Math.floor((h - bar - foot - h * 0.11) / rowH);
    const first = Math.max(0, total - maxRows);
    ctx.font = UF.font.mono(rowH * 0.36, 'bold');
    for (let i = first; i < total; i++) {
      const ry = top + h * 0.05 + (i - first) * rowH;
      const fresh = r ? clamp(1 - (t - lerp(r.at, r.at + (r.dur ?? 4), (i + 1 - (r.from || 0)) / Math.max(1, r.n - (r.from || 0)))) * 3) : 0;
      if (fresh > 0) { ctx.fillStyle = UF.c(p.col('#3a6ea5'), 0.45 * fresh); ctx.fillRect(tx - w * 0.01, ry - rowH * 0.18, tw + w * 0.02, rowH * 0.9); }
      ctx.fillStyle = p.col('#5d7896');
      ctx.fillRect(tx, ry, tw * (0.08 + 0.04 * hash(i, 1)), rowH * 0.42);
      ctx.fillStyle = p.col('#c8d3df');
      ctx.fillRect(tx + tw * 0.2, ry, tw * (0.09 + 0.05 * hash(i, 2)), rowH * 0.42);
      ctx.fillStyle = p.col('#8592a0');
      ctx.fillRect(tx + tw * 0.42, ry, tw * (0.14 + 0.16 * hash(i, 3)), rowH * 0.42);
      const sent = r ? true : hash(i, 4) > 0.3;
      const chip = sent ? '#1f5a3c' : '#4a3a14';
      ctx.fillStyle = p.col(chip);
      ctx.fillRect(tx + tw * 0.8, ry - rowH * 0.06, tw * 0.15, rowH * 0.56);
      D.text(ctx, sent ? 'SENT' : 'QUEUED', tx + tw * 0.875, ry + rowH * 0.22, { color: p.col(sent ? '#7fd3a4' : '#e0b860'), align: 'center', baseline: 'middle' });
    }
    ctx.fillStyle = p.col('green');
    ctx.beginPath(); ctx.arc(x + w * 0.03, y + h - foot / 2, foot * 0.18, 0, TAU); ctx.fill();
    ctx.font = UF.font.mono(foot * 0.42, 'bold');
    D.text(ctx, 'CONNECTED', x + w * 0.05, y + h - foot / 2, { color: p.col('#7f9bb8'), baseline: 'middle', spacing: foot * 0.05 });
  }

  /** Pointer position on a cursor path [[t, u, v], ...] (u, v from 0 to 1 across the screen). */
  function cursorAt(c, t) {
    const path = c.path, n = path.length;
    if (t <= path[0][0]) return [path[0][1], path[0][2]];
    if (t >= path[n - 1][0]) return [path[n - 1][1], path[n - 1][2]];
    let i = 0;
    while (i < n - 2 && t > path[i + 1][0]) i++;
    const p0 = path[Math.max(0, i - 1)], p1 = path[i], p2 = path[i + 1], p3 = path[Math.min(n - 1, i + 2)];
    const u = UF.easeFn(c.ease || 'inOutSine')((t - p1[0]) / (p2[0] - p1[0]));
    const cr = (a, b, q, d) => 0.5 * (2 * b + (q - a) * u + (2 * a - 5 * b + 4 * q - d) * u * u + (3 * b - a - 3 * q + d) * u * u * u);
    return [cr(p0[1], p1[1], p2[1], p3[1]), cr(p0[2], p1[2], p2[2], p3[2])];
  }

  /** Screen content at time t: the prop's `content`, or the latest of its `screens` that has started. */
  const screenAt = (p, t) => {
    let cur = { at: -1e9, content: p.content, text: p.text, highlight: p.highlight };
    for (const s of list(p.screens)) if (s.at <= t && s.at >= cur.at) cur = Object.assign({ text: p.text, highlight: p.highlight }, s);
    return cur;
  };

  function screen(ctx, p, t, x, y, w, h, content) {
    const cur = content === undefined ? screenAt(p, t) : { at: -1e9, content, text: p.text, highlight: p.highlight };
    content = cur.content;
    ctx.save();
    ctx.beginPath();
    ctx.rect(x, y, w, h);
    ctx.clip();
    const u = h / 30;
    const bar = (bx, by, bw, bh, c) => { ctx.fillStyle = p.col(c); ctx.fillRect(x + bx * w, y + by * h, bw * w, bh * h); };
    if (typeof content === 'function') content(ctx, x, y, w, h, t);
    else if (content === 'dashboard') {
      bar(0, 0, 1, 1, '#0d1520');
      bar(0, 0, 1, 0.1, '#16263a');
      bar(0.03, 0.035, 0.18, 0.03, '#5d7896');
      const tiles = [['#16263a', '#5d7896'], ['#16263a', '#5d7896'], ['#123222', 'green']];
      tiles.forEach(([bg, fg], i) => {
        bar(0.03 + i * 0.32, 0.15, 0.3, 0.3, bg);
        bar(0.06 + i * 0.32, 0.2, 0.14, 0.035, fg);
      });
      p.write(ctx, cur.text || 'ABNORMAL: 0', x + w * 0.82, y + h * 0.34, { size: 2.6 * u, font: 'mono', color: 'green' });
      ctx.strokeStyle = p.col('#3a6ea5');
      ctx.lineWidth = 0.5 * u;
      ctx.beginPath();
      for (let i = 0; i <= 24; i++) {
        const v = 0.5 + 0.3 * Math.sin(i * 0.9) * Math.cos(i * 0.37) + 0.08 * Math.sin(t * 2 + i);
        const px = x + w * (0.05 + 0.9 * i / 24), py = y + h * (0.92 - 0.35 * v);
        if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
      }
      ctx.stroke();
    } else if (content === 'list') {
      bar(0, 0, 1, 1, '#0e1218');
      bar(0, 0, 1, 0.1, '#1b2430');
      for (let i = 0; i < 9; i++) {
        const yy = 0.14 + i * 0.095;
        if (i === (cur.highlight ?? -1)) bar(0, yy - 0.015, 1, 0.08, '#3b1b1e');
        bar(0.04, yy, 0.12, 0.04, '#506070');
        bar(0.22, yy, 0.25 + 0.3 * hash(i, 3), 0.04, '#8592a0');
        bar(0.84, yy, 0.12, 0.04, i === (cur.highlight ?? -1) ? 'red' : '#4c8a6a');
      }
    } else if (content === 'code') {
      bar(0, 0, 1, 1, '#0b0e12');
      const cols = ['#5d7896', '#c9a54a', '#8592a0', '#4c8a6a', '#a56a8a'];
      for (let i = 0; i < 12; i++) {
        const ind = Math.floor(hash(i, 9) * 3) * 0.05, yy = 0.06 + i * 0.075;
        bar(0.04 + ind, yy, 0.1 + 0.15 * hash(i, 1), 0.035, cols[i % 5]);
        bar(0.2 + ind + 0.15 * hash(i, 1), yy, 0.08 + 0.3 * hash(i, 2), 0.035, cols[(i + 2) % 5]);
      }
      if ((t * 1.6) % 1 < 0.55) bar(0.04, 0.06 + 12 * 0.075, 0.025, 0.05, '#e8e4da');
    } else if (content === 'alert') {
      const k = 0.5 + 0.5 * Math.sin(t * 6);
      ctx.fillStyle = UF.mix(p.col('#2a0709'), p.col('#6a0e14'), k);
      ctx.fillRect(x, y, w, h);
      const cx = x + w / 2, cy = y + h * 0.42, s = h * 0.22;
      poly(ctx, [[cx, cy - s], [cx + s * 1.1, cy + s * 0.8], [cx - s * 1.1, cy + s * 0.8]]);
      ctx.fillStyle = p.col('red'); ctx.fill();
      p.write(ctx, '!', cx, cy + s * 0.15, { size: s * 1.1, color: '#f4f1ea' });
      p.write(ctx, cur.text || 'ALERT', cx, y + h * 0.82, { size: 3 * u, font: 'mono', color: '#f4f1ea' });
    } else if (content === 'email') {
      bar(0, 0, 1, 1, '#e9e7e1');
      bar(0, 0, 0.26, 1, '#d4d1c9');
      for (let i = 0; i < 7; i++) bar(0.03, 0.06 + i * 0.12, 0.2, 0.05, i === 1 ? '#3a6ea5' : '#a9a59c');
      bar(0.3, 0.06, 0.5, 0.06, '#3b3e44');
      for (let i = 0; i < 8; i++) bar(0.3, 0.22 + i * 0.085, 0.45 + 0.2 * hash(i, 5), 0.035, '#8d8a82');
    } else if (content === 'text') {
      bar(0, 0, 1, 1, '#0d1520');
      p.write(ctx, cur.text || '', x + w / 2, y + h / 2, { size: 3.4 * u, font: 'mono', color: '#e8e4da' });
    } else if (content === 'terminal') {
      terminal(ctx, p, t, x, y, w, h, cur.text);
    } else if (content === 'frozen') {
      terminal(ctx, p, Math.min(t, cur.at), x, y, w, h, `${cur.text || 'MESSAGE TERMINAL'}  (NOT RESPONDING)`);
      bar(0, 0, 1, 1, 'rgba(225,228,232,0.32)');
      ui.spinner(ctx, x + w / 2, y + h / 2, h * 0.06, t, '#1f2a36');
    } else if (content === 'boot') {
      bar(0, 0, 1, 1, '#030405');
      ui.spinner(ctx, x + w / 2, y + h * 0.44, h * 0.06, t);
      ctx.font = UF.font.mono(h * 0.04, 'bold');
      D.text(ctx, cur.text || 'STARTING', x + w / 2, y + h * 0.62, { color: p.col('#8d8a82'), align: 'center', baseline: 'middle', spacing: h * 0.008 });
    } else if (content === 'error') {
      terminal(ctx, p, Math.min(t, cur.at), x, y, w, h, null);
      bar(0, 0, 1, 1, 'rgba(0,0,0,0.5)');
      const k = ease.outBack(seg(t, cur.at, 0.25));
      ctx.save();
      ctx.translate(x + w / 2, y + h / 2);
      ctx.scale(0.85 + 0.15 * k, 0.85 + 0.15 * k);
      ctx.globalAlpha *= seg(t, cur.at, 0.12);
      ui.dialog(ctx, 0, 0, w * 0.58, h * 0.4, { title: 'Error', text: cur.text || 'A file is missing or changed.' });
      ctx.restore();
    } else {
      bar(0, 0, 1, 1, '#06080a');
    }
    const since = t - cur.at;
    if (since >= 0 && since < 0.12 && content !== 'off') bar(0, 0, 1, 1, `rgba(255,255,255,${(0.3 * hash(Math.floor(since * 60), 5)).toFixed(3)})`);
    for (const f of list(p.flickers)) {
      const at = flickAt(f), dt = t - at;
      if (dt < 0 || dt > (typeof f === 'number' ? 0.09 : f.dur ?? 0.09)) continue;
      for (let i = 0; i < 4; i++) {
        const by = hash(i, Math.floor(at * 97)) * 0.9;
        bar(0, by, 1, 0.05 + 0.06 * hash(i, 3), `rgba(${i % 2 ? '255,255,255' : '58,110,165'},${0.35 + 0.3 * hash(i, 8)})`);
      }
      bar(0, 0, 1, 1, 'rgba(255,255,255,0.12)');
    }
    const c = p.cursor;
    if (c && c.path && t >= c.path[0][0] && !(c.out != null && t >= c.out)) {
      const [cu, cv] = cursorAt(c, t);
      const s = (c.size || 0.075) * h;
      let press = 0;
      for (const ck of list(c.clicks)) {
        if (t >= ck && t < ck + 0.18) press = 1 - (t - ck) / 0.18;
        ui.ripple(ctx, x + cu * w, y + cv * h, s * 0.9, seg(t, ck, 0.5), c.ring || '#3a6ea5');
      }
      ui.cursor(ctx, x + cu * w, y + cv * h, s, press);
    }
    const n = p.toast;
    if (n && t >= n.at && !(n.out != null && t >= n.out + 0.4)) {
      const k = ease.outExpo(seg(t, n.at, 0.5)) * (n.out != null ? 1 - ease.inCubic(seg(t, n.out, 0.4)) : 1);
      const tw = w * (n.w || 0.46), th = tw * 0.3;
      ctx.save();
      ctx.globalAlpha *= clamp(k * 1.5);
      ui.toast(ctx, x + w - tw - w * 0.025 + (1 - k) * tw * 0.4, y + h - th - h * 0.05, tw, th, n);
      ctx.restore();
    }
    const g = ctx.createLinearGradient(x, y, x + w, y + h);
    g.addColorStop(0, 'rgba(255,255,255,0.07)');
    g.addColorStop(0.45, 'rgba(255,255,255,0)');
    ctx.fillStyle = g;
    ctx.fillRect(x, y, w, h);
    ctx.restore();
  }

  function glow(ctx, p, x, y, r, color, a = 0.16) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, UF.c(p.col(color), a * (1 - p.dim)));
    g.addColorStop(1, UF.c(p.col(color), 0));
    ctx.fillStyle = g;
    ctx.fillRect(x - r, y - r, r * 2, r * 2);
    ctx.restore();
  }

  /* ------------------------------------------------------------------ */
  /* Bank and money                                                      */
  /* ------------------------------------------------------------------ */
  const ATM_SCREENS = {
    off:      { bg: '#050607' },
    welcome:  { bg: '#0f2f57', fg: '#e8e4da', text: 'WELCOME', sub: 'INSERT CARD' },
    pin:      { bg: '#0f2f57', fg: '#e8e4da', text: 'ENTER PIN', sub: '* * * *' },
    amount:   { bg: '#0f2f57', fg: '#e8e4da', text: 'ENTER AMOUNT', sub: '10,000' },
    wait:     { bg: '#241c07', fg: 'amber', text: 'PLEASE WAIT', dots: true },
    approved: { bg: '#0b2a1a', fg: 'green', text: 'APPROVED', sub: 'TAKE CASH' },
    declined: { bg: '#2e0b0e', fg: 'red', text: 'DECLINED', sub: 'CONTACT YOUR BANK' },
    cash:     { bg: '#0b2a1a', fg: 'green', text: 'DISPENSING', dots: true },
  };
  const atmScreenAt = (p, t) => {
    let cur = { at: -1e9, screen: p.screen };
    for (const s of p.screens) if (s.at <= t && s.at >= cur.at) cur = s;
    return cur;
  };

  T.atm = {
    anchor: 'bottom',
    defaults: { screen: 'welcome', screens: [], brand: 'red', sign: 'ATM', card: null, dispense: [], receipt: null, typing: [], glow: true },
    points: { slot: [21, -100], keypad: [-6, -87], screen: [0, -121], cash: [0, -58], receipt: [-23, -71], top: [0, -170] },
    init(p) {
      for (const s of [{ screen: p.screen }, ...p.screens]) {
        if (!ATM_SCREENS[s.screen]) throw new Error(`Prop atm: unknown screen "${s.screen}" — use ${Object.keys(ATM_SCREENS).join(', ')}.`);
      }
    },
    draw(ctx, p, t, fx) {
      if (fx) for (const s of p.screens) if (s.kick) fx.kick(t, s.at, s.kick);
      p.slab(ctx, -40, -150, 80, 150, '#5b626c', 0, { h: true, k: 0.2 });
      ctx.fillStyle = 'rgba(0,0,0,0.22)';
      ctx.fillRect(33, -150, 7, 150);
      p.slab(ctx, -40, -170, 80, 20, p.brand, 0);
      p.write(ctx, p.sign, 0, -159.5, { size: 10, font: 'display', color: '#f4f1ea', spacing: 1.5 });
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fillRect(-40, -150, 80, 1.2);

      // fascia, screen and side keys
      p.slab(ctx, -35, -146, 70, 80, '#2c3139', 3, { k: 0.08 });
      p.slab(ctx, -26, -140, 52, 37, '#0f1114', 2, { k: 0.05 });
      for (let i = 0; i < 4; i++) {
        ctx.fillStyle = p.col('#80878f');
        ctx.fillRect(-32, -134 + i * 7.5, 4.5, 3);
        ctx.fillRect(27.5, -134 + i * 7.5, 4.5, 3);
      }
      const s = atmScreenAt(p, t), def = Object.assign({}, ATM_SCREENS[s.screen]);
      if (s.text) def.text = s.text;
      if (s.sub !== undefined) def.sub = s.sub;
      const sx = -22, sy = -136, sw = 44, sh = 29;
      ctx.fillStyle = p.col(def.bg);
      ctx.fillRect(sx, sy, sw, sh);
      if (def.text) {
        const since = t - s.at;
        ctx.save();
        if (since < 0.12) ctx.globalAlpha *= 0.4 + 0.6 * hash(Math.floor(since * 60), 3);
        ctx.fillStyle = UF.c(p.col(p.brand), 0.85);
        ctx.fillRect(sx, sy, sw, 2.6);
        p.write(ctx, def.text, 0, sy + sh * 0.44, { size: def.text.length > 10 ? 3.6 : 4.6, font: 'mono', color: def.fg, spacing: 0.25 });
        const sub = def.dots ? '.'.repeat(1 + Math.floor((t * 2.5) % 3)).padEnd(3, ' ') : def.sub;
        if (sub) p.write(ctx, sub, 0, sy + sh * 0.72, { size: 2.3, font: 'mono', color: def.fg, weight: 'normal' });
        ctx.restore();
      }
      const gl = ctx.createLinearGradient(sx, sy, sx + sw, sy + sh);
      gl.addColorStop(0, 'rgba(255,255,255,0.08)');
      gl.addColorStop(0.5, 'rgba(255,255,255,0)');
      ctx.fillStyle = gl;
      ctx.fillRect(sx, sy, sw, sh);

      // keypad: 12 keys plus cancel / clear / enter
      const live = list(p.typing).find(w => t >= w.at && t < w.at + (w.dur ?? 1.5));
      const step = live ? Math.floor((t - live.at) / 0.24) : -1;
      const lit = live && (t - live.at) % 0.24 < 0.12 ? Math.floor(hash(step, 7) * 12) : -1;
      p.slab(ctx, -23, -99.5, 34, 24.5, '#1c1f24', 1.5, { k: 0.05 });
      for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) {
        const i = r * 3 + c;
        p.slab(ctx, -21.5 + c * 7.6, -97.8 + r * 5.6, 6.4, 4.4, i === lit ? '#f4f1ea' : '#a7adb4', 0.8, { k: 0.2 });
      }
      ['red', 'amber', 'green'].forEach((c, r) => p.slab(ctx, 2.4, -97.8 + r * 5.6, 7, 4.4, c, 0.8, { k: 0.15 }));

      // card slot
      p.slab(ctx, 14, -105, 14, 10, '#3a3f47', 1.2, { k: 0.15 });
      ctx.fillStyle = '#050607';
      ctx.fillRect(15.5, -100.8, 11, 1.6);
      ctx.fillStyle = (t * 1.6) % 1 < 0.55 ? p.col('green') : p.col('#1b3a26');
      ell(ctx, 25.6, -103, 0.7, 0.7);
      ctx.fill();
      // card: { in, out, taken } — slides in, sits in the slot, comes back out, is taken
      const c = p.card;
      if (c && c.in != null && t >= c.in && !(c.taken != null && t >= c.taken)) {
        let out = 1 - ease.inOutCubic(seg(t, c.in, 0.35));
        if (c.out != null && t >= c.out) out = ease.outCubic(seg(t, c.out, 0.35));
        const pr = 0.8 + 4.2 * out;
        poly(ctx, [[16, -99.2], [26, -99.2], [26.5, -99.2 + pr * 0.55], [15.5, -99.2 + pr * 0.55]]);
        ctx.fillStyle = p.col(c.color || '#1f3a66');
        ctx.fill();
      }

      // receipt slot
      ctx.fillStyle = '#050607';
      ctx.fillRect(-30, -71.6, 14, 1.2);
      if (p.receipt != null && t >= p.receipt) {
        const k = ease.outCubic(seg(t, p.receipt, 1.2));
        ctx.fillStyle = p.col('#ece9e0');
        ctx.fillRect(-28.6, -71, 11.2, 10 * k);
        ctx.fillStyle = p.col('#8d8a82');
        for (let i = 0; i < 4; i++) if (10 * k > 2 + i * 2) ctx.fillRect(-27.4, -70 + i * 2, 6 + 3 * hash(i, 4), 0.5);
      }

      // cash dispenser
      p.slab(ctx, -21, -63.5, 42, 11, '#1a1d22', 1.5, { k: 0.05 });
      let open = 0, notes = 0;
      for (const d of list(p.dispense)) {
        if (t < d.at) continue;
        const take = d.take ?? d.at + 4;
        open = Math.max(open, ease.outCubic(seg(t, d.at, 0.35)) * (1 - ease.inCubic(seg(t, take + 0.3, 0.35))));
        notes = Math.max(notes, ease.outCubic(seg(t, d.at + 0.4, 0.6)) * (1 - ease.inCubic(seg(t, take, 0.25))));
      }
      ctx.fillStyle = '#030404';
      ctx.fillRect(-17.5, -60.2, 35, 4.6);
      if (open > 0) { ctx.fillStyle = UF.c(p.col('green'), 0.55 * open); ctx.fillRect(-17.5, -56.4, 35, 0.8); }
      ctx.fillStyle = p.col('#4b525b');
      ctx.fillRect(-17.5, -60.2 + 4.6 * open, 35, 4.6 * (1 - open));
      if (notes > 0) {
        const d = 7 * notes;
        poly(ctx, [[-12, -57.5], [12, -57.5], [12.8, -57.5 + d * 0.6], [-12.8, -57.5 + d * 0.6]]);
        ctx.fillStyle = p.col('#b7c6a5');
        ctx.fill();
        ctx.strokeStyle = p.col('#7f9271');
        ctx.lineWidth = 0.25;
        for (let i = 1; i < 5; i++) {
          const yy = -57.5 + d * 0.6 * i / 5;
          ctx.beginPath(); ctx.moveTo(-12 - 0.8 * i / 5, yy); ctx.lineTo(12 + 0.8 * i / 5, yy); ctx.stroke();
        }
      }

      // lower cabinet
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(-40, -50, 80, 1);
      p.slab(ctx, -36, -47, 72, 40, '#4f565f', 2, { k: 0.1 });
      ctx.fillStyle = p.col(p.brand);
      ctx.fillRect(-36, -47, 72, 1.6);
      ctx.fillStyle = p.col('#1d2024');
      ell(ctx, 27, -28, 1, 1); ctx.fill();
      ctx.fillRect(26.6, -28, 0.8, 2.2);
      p.slab(ctx, -40, -6, 80, 6, '#2b2f35', 0);
      if (p.glow && s.screen !== 'off') glow(ctx, p, 0, -121, 75, D.shade(p.col(def.bg), 0.55), 0.2);
    },
  };

  /** Bank card, front or back; style 'bank' or 'blank' (white plastic, as used for cloned cards). */
  function cardFace(ctx, p, style, side, color) {
    const w = 8.56, h = 5.4;
    const c = color || (style === 'blank' ? '#e9e6de' : '#1f3a66');
    p.slab(ctx, -w / 2, -h / 2, w, h, c, 0.35, { k: 0.18 });
    if (side === 'back') {
      ctx.fillStyle = p.col('#0b0b0c');
      ctx.fillRect(-w / 2, -h / 2 + 0.6, w, 1.05);
      if (style === 'bank') { ctx.fillStyle = p.col('#dcd6c8'); ctx.fillRect(-w / 2 + 0.5, -0.5, 4.6, 0.9); }
      return;
    }
    if (style !== 'bank') return;
    p.slab(ctx, -w / 2 + 0.85, -0.95, 1.25, 1, '#c9a54a', 0.15, { k: 0.25 });
    p.write(ctx, `•••• ${p.number || '4821'}`, -w / 2 + 0.85, 1.45, { size: 0.62, font: 'mono', align: 'left', color: '#e8e4da', weight: 'normal' });
    ctx.globalAlpha *= 0.85;
    ell(ctx, w / 2 - 1.7, h / 2 - 1, 0.62, 0.62); ctx.fillStyle = p.col('red'); ctx.fill();
    ell(ctx, w / 2 - 1.05, h / 2 - 1, 0.62, 0.62); ctx.fillStyle = p.col('amber'); ctx.fill();
    ctx.globalAlpha /= 0.85;
  }

  T.card = {
    anchor: 'center',
    defaults: { style: 'bank', side: null, color: null, number: '4821' },
    held: { grip: [-3.2, 0] },
    init(p) {
      if (!['bank', 'blank'].includes(p.style)) throw new Error('Prop card: style is bank or blank.');
      if (!p.side) p.side = p.style === 'blank' ? 'back' : 'front';
    },
    draw(ctx, p) { cardFace(ctx, p, p.style, p.side, p.color); },
  };

  T.cardStack = {
    anchor: 'center',
    defaults: { count: 5, style: 'blank', color: null },
    held: { grip: [-3, 1] },
    draw(ctx, p) {
      const n = Math.max(1, p.count | 0);
      for (let i = 0; i < n; i++) {
        ctx.save();
        ctx.translate(-2.6, 2);
        ctx.rotate(-0.32 + (n > 1 ? 0.64 * i / (n - 1) : 0));
        ctx.translate(2.6, -2);
        cardFace(ctx, p, p.style, 'back', p.color);
        ctx.restore();
      }
    },
  };

  T.cardWriter = {
    anchor: 'bottom',
    defaults: { swipes: [] },
    points: { slot: [0, -6] },
    draw(ctx, p, t) {
      let busy = false;
      for (const at of list(p.swipes)) {
        const u = seg(t, at, 0.6);
        if (t < at || u >= 1) continue;
        busy = true;
        const x = lerp(-14, 14, ease.inOutSine(u));
        ctx.save();
        ctx.translate(x, -7.5);
        cardFace(ctx, p, 'blank', 'back');
        ctx.restore();
      }
      ctx.strokeStyle = p.col('#15171a');
      ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(10, -2.5); ctx.bezierCurveTo(16, -2.5, 15, 0, 22, -0.4); ctx.stroke();
      p.slab(ctx, -11, -6, 22, 6, '#2a2d33', 1, { k: 0.2 });
      ctx.fillStyle = '#050607';
      ctx.fillRect(-10, -6.2, 20, 0.7);
      const on = busy ? (t * 8) % 1 < 0.5 : true;
      ctx.fillStyle = busy ? (on ? p.col('amber') : p.col('#3a2e10')) : p.col('green');
      ell(ctx, 8, -3, 0.55, 0.55); ctx.fill();
      p.write(ctx, 'MSR', -6.5, -3, { size: 1.3, font: 'mono', color: '#8d8a82' });
    },
  };

  /** Generic banknote, deliberately not any real currency. */
  function note(ctx, p, x, y, color) {
    const w = 15, h = 6.6;
    p.slab(ctx, x - w / 2, y - h / 2, w, h, color, 0.2, { k: 0.12 });
    ctx.strokeStyle = p.col(D.shade(color, 0.28));
    ctx.lineWidth = 0.22;
    ctx.strokeRect(x - w / 2 + 0.6, y - h / 2 + 0.6, w - 1.2, h - 1.2);
    ell(ctx, x - 3.4, y, 1.8, 1.8);
    ctx.stroke();
    ell(ctx, x + 4.4, y, 2.1, 2.5);
    ctx.fillStyle = p.col(D.shade(color, 0.18));
    ctx.fill();
  }

  T.cash = {
    anchor: 'center',
    defaults: { style: 'bundle', color: '#6f8a63', count: 6, cols: 2 },
    held: p => (p.style === 'fan' ? { grip: [0, 3.5] } : p.style === 'note' ? { grip: [-6, 0] } : { grip: [0, 0], turn: Math.PI / 2 }),
    init(p) { if (!['note', 'bundle', 'fan', 'stack'].includes(p.style)) throw new Error('Prop cash: style is note, bundle, fan or stack.'); },
    draw(ctx, p) {
      const band = (x, y, h) => { ctx.fillStyle = p.col('#e2dccb'); ctx.fillRect(x - 1.3, y - h / 2, 2.6, h); };
      if (p.style === 'note') note(ctx, p, 0, 0, p.color);
      else if (p.style === 'fan') {
        for (let i = 0; i < 5; i++) {
          ctx.save();
          ctx.translate(0, 4);
          ctx.rotate(-0.55 + i * 0.275);
          note(ctx, p, 0, -5.5, D.shade(p.color, (i - 2) * 0.03));
          ctx.restore();
        }
      } else if (p.style === 'bundle') {
        p.slab(ctx, -7.5, -1.6, 15, 4.9, D.shade(p.color, -0.25), 0.3);
        ctx.strokeStyle = p.col(D.shade(p.color, 0.1));
        ctx.lineWidth = 0.2;
        for (let i = 1; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-7.4, -1.6 + i * 0.8); ctx.lineTo(7.4, -1.6 + i * 0.8); ctx.stroke(); }
        note(ctx, p, 0, -2.4, p.color);
        band(0, -0.8, 8.4);
      } else {
        // bundles stacked like bricks, seen from the front; anchored on the bottom edge
        const n = Math.max(1, p.count | 0), cols = Math.max(1, p.cols | 0), rows = Math.ceil(n / cols);
        let k = 0;
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols && k < n; c++, k++) {
          const x = (c - (cols - 1) / 2) * 15.4, y = -3.2 - r * 3.2;
          p.slab(ctx, x - 7.5, y, 15, 3.2, D.shade(p.color, -0.12 - 0.04 * (r % 2)), 0.3);
          ctx.strokeStyle = p.col(D.shade(p.color, 0.12));
          ctx.lineWidth = 0.16;
          for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - 7.4, y + i * 0.8); ctx.lineTo(x + 7.4, y + i * 0.8); ctx.stroke(); }
          band(x, y + 1.6, 3.2);
        }
        poly(ctx, [[-cols * 7.7 + 1, -rows * 3.2 - 1.6], [cols * 7.7 - 1, -rows * 3.2 - 1.6], [cols * 7.7, -rows * 3.2], [-cols * 7.7, -rows * 3.2]]);
        ctx.fillStyle = p.col(D.shade(p.color, 0.08));
        ctx.fill();
      }
    },
  };

  T.receipt = {
    anchor: 'center',
    defaults: { lines: 7 },
    held: { grip: [-2.5, 3], turn: -Math.PI / 2 },
    draw(ctx, p) {
      const w = 7, h = 13;
      ctx.beginPath();
      ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(w / 2, -h / 2); ctx.lineTo(w / 2, h / 2);
      for (let i = 0; i <= 8; i++) ctx.lineTo(w / 2 - (i * w) / 8, h / 2 - (i % 2 ? 0.45 : 0));
      ctx.closePath();
      ctx.fillStyle = p.col('#efece4');
      ctx.fill();
      ctx.fillStyle = p.col('#9a968c');
      for (let i = 0; i < p.lines; i++) ctx.fillRect(-w / 2 + 0.8, -h / 2 + 1.2 + i * 1.5, 2.5 + 2.8 * hash(i, 8), 0.4);
    },
  };

  /* ------------------------------------------------------------------ */
  /* Office                                                              */
  /* ------------------------------------------------------------------ */
  const DESK = { office: ['#8a8173', '#3b4047'], wood: ['#6e4c33', '#5a3d29'], table: ['#9aa0a7', '#50565e'] };
  T.desk = {
    anchor: 'bottom',
    defaults: { style: 'office', length: 140, height: 75 },
    points: p => ({ top: [0, -p.height], left: [-p.length / 2, -p.height], right: [p.length / 2, -p.height] }),
    init(p) { if (!DESK[p.style]) throw new Error(`Prop desk: style is ${Object.keys(DESK).join(', ')}.`); },
    draw(ctx, p) {
      const L = p.length, H = p.height, hw = L / 2, [top, body] = DESK[p.style];
      poly(ctx, [[-hw + 2.5, -H - 5], [hw - 2.5, -H - 5], [hw, -H], [-hw, -H]]);
      ctx.fillStyle = p.col(D.shade(top, 0.12));
      ctx.fill();
      if (p.style === 'office') {
        p.slab(ctx, -hw + 2, -H + 3, 4, H - 3, body, 0, { h: true });
        p.slab(ctx, -hw + 6, -H + 3, L - 50, 26, D.shade(body, -0.3), 0);
        p.slab(ctx, hw - 44, -H + 3, 42, H - 4, body, 0, { h: true });
        const dh = (H - 10) / 3;
        for (let i = 0; i < 3; i++) {
          const y0 = -H + 6 + i * dh;
          ctx.strokeStyle = 'rgba(0,0,0,0.5)';
          ctx.lineWidth = 0.5;
          ctx.strokeRect(hw - 41.5, y0, 37, dh - 2.5);
          ctx.fillStyle = p.col('#c9ccd0');
          ctx.fillRect(hw - 28.5, y0 + 3, 11, 1.1);
        }
        ctx.fillStyle = p.col('#1a1c20');
        ctx.fillRect(-hw + 1, -1.2, 6, 1.2);
        ctx.fillRect(hw - 45, -1.2, 44, 1.2);
      } else if (p.style === 'wood') {
        p.slab(ctx, -hw + 3, -H + 3, L - 6, 9, D.shade(top, -0.15), 0);
        ell(ctx, 0, -H + 7.5, 1, 1); ctx.fillStyle = p.col('#c9a54a'); ctx.fill();
        for (const x of [-hw + 4, hw - 9]) {
          poly(ctx, [[x, -H + 3], [x + 5, -H + 3], [x + 4.2, 0], [x + 0.8, 0]]);
          ctx.fillStyle = p.col(body);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = p.col(body);
        ctx.fillRect(-hw + 4, -H + 3, 3, H - 3);
        ctx.fillRect(hw - 7, -H + 3, 3, H - 3);
        ctx.fillRect(-hw + 4, -16, L - 8, 2);
      }
      p.slab(ctx, -hw, -H, L, 3.5, top, 0.6);
    },
  };

  T.chair = {
    anchor: 'bottom',
    defaults: { style: 'office', color: null },
    points: p => (p.style === 'plastic' ? { seat: [-4, -45], back: [-22, -86] } : { seat: [-6, -47], back: [-23, -100] }),
    init(p) { if (!['office', 'plastic'].includes(p.style)) throw new Error('Prop chair: style is office or plastic (side view, back on the left; flip for the other way).'); },
    draw(ctx, p) {
      if (p.style === 'plastic') {
        const c = p.color || '#ddd8cc';
        ctx.lineCap = 'round';
        ctx.lineWidth = 3;
        ctx.strokeStyle = p.col(D.shade(c, -0.3));
        ctx.beginPath(); ctx.moveTo(10, -44); ctx.lineTo(17, -1.5); ctx.moveTo(-12, -44); ctx.lineTo(-18, -1.5); ctx.stroke();
        ctx.strokeStyle = p.col(D.shade(c, -0.08));
        ctx.beginPath(); ctx.moveTo(14, -44); ctx.lineTo(22, -1.5); ctx.moveTo(-16, -44); ctx.lineTo(-23, -1.5); ctx.stroke();
        poly(ctx, [[-19.5, -47], [-22.5, -47], [-28, -88], [-19, -90.5], [-14.5, -50]]);
        ctx.fillStyle = p.col(D.shade(c, -0.05));
        ctx.fill();
        ctx.fillStyle = p.col(D.shade(c, -0.35));
        for (let i = 0; i < 3; i++) ctx.fillRect(-23.4 + i * 0.6, -82 + i * 8, 4.6, 1.2);
        p.slab(ctx, -21, -48.5, 42, 5, c, 2.2);
        return;
      }
      const c = p.color || '#23272d';
      ctx.lineCap = 'round';
      ctx.strokeStyle = p.col('#2a2d33');
      ctx.lineWidth = 2.6;
      ctx.beginPath(); ctx.moveTo(0, -9); ctx.lineTo(-25, -5); ctx.moveTo(0, -9); ctx.lineTo(25, -5); ctx.moveTo(0, -9); ctx.lineTo(4, -4.5); ctx.stroke();
      ctx.fillStyle = p.col('#111214');
      for (const x of [-25, 25, 4]) { ell(ctx, x, -2.8, 2.8, 2.8); ctx.fill(); }
      p.slab(ctx, -1.6, -43, 3.2, 34, '#a7adb5', 0, { h: true, k: 0.3 });
      p.slab(ctx, -3, -25, 6, 15, '#1d2024', 0.8, { h: true });
      p.slab(ctx, -10, -46, 20, 3, '#1b1e22', 0.6);
      ctx.strokeStyle = p.col('#1d2024');
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(-12, -47); ctx.quadraticCurveTo(-22, -50, -23, -62); ctx.stroke();
      ctx.beginPath();
      const back = [[-27, -108], [-19.5, -107.5], [-17.5, -86], [-19.5, -63], [-25.5, -61], [-28.5, -85]];
      ctx.moveTo((back[5][0] + back[0][0]) / 2, (back[5][1] + back[0][1]) / 2);
      back.forEach((q, i) => { const n = back[(i + 1) % back.length]; ctx.quadraticCurveTo(q[0], q[1], (q[0] + n[0]) / 2, (q[1] + n[1]) / 2); });
      ctx.closePath();
      const g = ctx.createLinearGradient(-29, 0, -17, 0);
      g.addColorStop(0, p.col(D.shade(c, 0.15)));
      g.addColorStop(1, p.col(D.shade(c, -0.3)));
      ctx.fillStyle = g;
      ctx.fill();
      p.slab(ctx, -5.2, -66, 2.4, 15, '#15171a', 0);
      p.slab(ctx, -14, -69, 20, 3, '#15171a', 1.2);
      p.slab(ctx, -23, -52.5, 46, 7, c, 3);
    },
  };

  const screenLit = (p, t) => {
    const c = screenAt(p, t).content;
    return c === 'off' ? 0 : c === 'boot' ? 0.35 : 1;
  };
  const SCREEN_DEFAULTS = { text: null, highlight: null, glow: false, screens: [], cursor: null, toast: null, rows: null, flickers: [] };

  T.monitor = {
    anchor: 'bottom',
    defaults: Object.assign({ view: 'front', content: 'dashboard' }, SCREEN_DEFAULTS),
    points: { screen: [0, -25], top: [0, -42] },
    init(p) {
      if (!['front', 'back', 'side'].includes(p.view)) throw new Error(`Prop ${p.type}: view is front, back or side.`);
      for (const s of [{ content: p.content }, ...list(p.screens)]) {
        if (typeof s.content !== 'function' && !CONTENT.includes(s.content)) throw new Error(`Prop ${p.type}: content is ${CONTENT.join(', ')} or a function.`);
      }
      if (p.cursor && !(Array.isArray(p.cursor.path) && p.cursor.path.length)) throw new Error(`Prop ${p.type}: cursor needs a path of [t, u, v] points.`);
    },
    draw(ctx, p, t, fx) {
      if (fx) for (const f of list(p.flickers)) fx.kick(t, flickAt(f), { rgb: 0.35, glitch: 0.3, glitchDur: 0.05, decay: 14 });
      const lit = screenLit(p, t);
      if (p.view === 'side') {
        p.slab(ctx, -9, -1.2, 18, 1.2, '#1b1e23', 0.5);
        p.slab(ctx, -1.4, -14, 2.8, 13, '#2a2e35', 0.6, { h: true });
        ctx.save();
        ctx.translate(0, -25);
        ctx.rotate(-0.06);
        p.slab(ctx, -2, -17, 3.4, 34, '#1b1e23', 1, { h: true });
        ctx.fillStyle = p.col('#3a4048');
        ctx.fillRect(-2.6, -17, 0.6, 34);
        ctx.restore();
        if (p.glow && lit) glow(ctx, p, -14, -25, 40, '#9fc0e8', 0.12 * lit);
        return;
      }
      if (p.view === 'back') {
        p.slab(ctx, -27, -42, 54, 33, '#2a2e35', 1.4, { k: 0.12 });
        p.slab(ctx, -7, -31, 14, 11, '#22262c', 1);
        p.slab(ctx, -2, -12, 4, 11, '#22262c', 0.6, { h: true });
        ell(ctx, 0, -0.8, 11, 1.4); ctx.fillStyle = p.col('#1b1e23'); ctx.fill();
        if (p.glow && lit) glow(ctx, p, 0, -25, 46, '#9fc0e8', 0.1 * lit);
        return;
      }
      p.slab(ctx, -2, -9, 4, 8.5, '#22262c', 0.6, { h: true });
      ell(ctx, 0, -0.8, 11, 1.4); ctx.fillStyle = p.col('#1b1e23'); ctx.fill();
      p.slab(ctx, -27, -42, 54, 33, '#121418', 1.4, { k: 0.06 });
      screen(ctx, p, t, -25.6, -40.6, 51.2, 29.2);
      if (p.glow && lit) glow(ctx, p, 0, -26, 60, '#9fc0e8', 0.14 * lit);
    },
  };

  T.laptop = {
    anchor: 'bottom',
    defaults: Object.assign({ view: 'front', content: 'code' }, SCREEN_DEFAULTS),
    points: { screen: [0, -13], keys: [0, -1] },
    init: T.monitor.init,
    draw(ctx, p, t, fx) {
      if (fx) for (const f of list(p.flickers)) fx.kick(t, flickAt(f), { rgb: 0.35, glitch: 0.3, glitchDur: 0.05, decay: 14 });
      const lit = screenLit(p, t);
      if (p.view === 'side') {
        p.slab(ctx, -13, -1.8, 26, 1.8, '#9ba1a8', 0.5);
        ctx.save();
        ctx.translate(12, -1.4);
        ctx.rotate(0.26);
        p.slab(ctx, -0.9, -22, 0.9, 22, '#8e949b', 0.3, { h: true });
        ctx.restore();
        if (p.glow && lit) glow(ctx, p, 4, -12, 28, '#9fc0e8', 0.14 * lit);
        return;
      }
      if (p.view === 'back') {
        poly(ctx, [[-17, -1.6], [17, -1.6], [18.5, 0], [-18.5, 0]]);
        ctx.fillStyle = p.col('#7d838a'); ctx.fill();
        p.slab(ctx, -17, -24, 34, 22.4, '#a5abb2', 1.2, { k: 0.12 });
        D.roundRect(ctx, -2, -15, 4, 4, 1);
        ctx.fillStyle = p.col('#c8ccd1'); ctx.fill();
        if (p.glow && lit) glow(ctx, p, 0, -12, 34, '#9fc0e8', 0.1 * lit);
        return;
      }
      p.slab(ctx, -17, -24.2, 34, 22.6, '#17191d', 1.2, { k: 0.06 });
      screen(ctx, p, t, -15.8, -23, 31.6, 19.8);
      poly(ctx, [[-17.5, -1.8], [17.5, -1.8], [19.5, 0], [-19.5, 0]]);
      ctx.fillStyle = p.col('#9ba1a8'); ctx.fill();
      if (p.glow && lit) glow(ctx, p, 0, -13, 40, '#9fc0e8', 0.14 * lit);
    },
  };

  T.keyboard = {
    anchor: 'bottom',
    defaults: { length: 40 },
    draw(ctx, p) {
      const hw = p.length / 2;
      poly(ctx, [[-hw + 1, -2.2], [hw - 1, -2.2], [hw, 0], [-hw, 0]]);
      ctx.fillStyle = p.col('#22262c');
      ctx.fill();
      ctx.fillStyle = p.col('#4a5059');
      for (let i = 0; i < p.length / 2.2 - 1; i++) ctx.fillRect(-hw + 1.6 + i * 2.2, -1.9, 1.6, 0.7);
      ctx.fillRect(-hw * 0.4, -1.0, hw * 0.8, 0.6);
    },
  };

  T.deskPhone = {
    anchor: 'bottom',
    defaults: { ring: [], lifted: false },
    points: { handset: [0, -9] },
    draw(ctx, p, t) {
      const ring = list(p.ring).find(r => t >= r.at && t < r.at + (r.dur ?? 3));
      const lifted = p.lifted === true || (typeof p.lifted === 'number' && t >= p.lifted);
      const buzz = ring && (t - ring.at) % 1 < 0.6;
      ctx.save();
      if (buzz) ctx.translate(Math.sin(t * 90) * 0.4, 0);
      poly(ctx, [[-11, 0], [11, 0], [9, -7], [-9, -7]]);
      const g = ctx.createLinearGradient(0, -7, 0, 0);
      g.addColorStop(0, p.col('#30343a')); g.addColorStop(1, p.col('#1a1c20'));
      ctx.fillStyle = g; ctx.fill();
      p.slab(ctx, -8, -6, 6, 2.6, '#6f8f7a', 0.3);
      ctx.fillStyle = p.col('#9aa0a7');
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) ctx.fillRect(0.5 + c * 2.2, -6 + r * 1.8, 1.5, 1.1);
      ctx.fillStyle = buzz && (t * 6) % 1 < 0.5 ? p.col('red') : p.col('#3a1214');
      ell(ctx, 8.4, -1.6, 0.5, 0.5); ctx.fill();
      if (!lifted) {
        ctx.strokeStyle = p.col('#15171a');
        ctx.lineWidth = 0.35;
        ctx.beginPath();
        for (let i = 0; i <= 14; i++) ctx.lineTo(-11.5 - 1.2 * Math.sin(i * 1.4), -8 + i * 0.4);
        ctx.stroke();
        p.slab(ctx, -12, -11, 24, 3.6, '#24272c', 1.8, { k: 0.2 });
        ell(ctx, -9.5, -9.4, 3.2, 2.3); ctx.fillStyle = p.col('#24272c'); ctx.fill();
        ell(ctx, 9.5, -9.4, 3.2, 2.3); ctx.fill();
      }
      ctx.restore();
      if (ring && buzz) {
        ctx.strokeStyle = UF.c(p.col('amber'), 0.8);
        ctx.lineWidth = 0.6;
        for (const s of [-1, 1]) for (const r of [3, 5.5]) {
          ctx.beginPath();
          ctx.arc(s * 13, -9, r, s > 0 ? -0.7 : Math.PI - 0.7, s > 0 ? 0.7 : Math.PI + 0.7);
          ctx.stroke();
        }
      }
    },
  };

  T.handset = {
    anchor: 'center',
    defaults: { color: '#24272c' },
    held: { grip: [0, 0], turn: Math.PI / 2 },
    draw(ctx, p) {
      p.slab(ctx, -10, -1.6, 20, 3.4, p.color, 1.6, { k: 0.2 });
      ell(ctx, -8.4, 0.6, 3, 2.2); ctx.fillStyle = p.col(p.color); ctx.fill();
      ell(ctx, 8.4, 0.6, 3, 2.2); ctx.fill();
    },
  };

  T.mobile = {
    anchor: 'center',
    defaults: { content: 'lock', text: null, glow: false },
    held: { grip: [0, 2] },
    init(p) { if (!['lock', 'call', 'otp', 'message', 'off'].includes(p.content)) throw new Error('Prop mobile: content is lock, call, otp, message or off.'); },
    draw(ctx, p, t) {
      p.slab(ctx, -3.8, -7.8, 7.6, 15.6, '#15171b', 1.1, { k: 0.12 });
      const x = -3.45, y = -7.45, w = 6.9, h = 14.9;
      ctx.save();
      D.roundRect(ctx, x, y, w, h, 0.8);
      ctx.clip();
      const bg = { lock: '#1d2b45', call: '#0f1a14', otp: '#0d121c', message: '#e9e7e1', off: '#050607' }[p.content];
      ctx.fillStyle = p.col(bg);
      ctx.fillRect(x, y, w, h);
      if (p.content === 'lock') {
        p.write(ctx, p.text || '9:41', 0, -3.6, { size: 2, font: 'sans', color: '#e8e4da', weight: '300' });
        ctx.fillStyle = UF.c(p.col('#e8e4da'), 0.5); ctx.fillRect(-1.6, -1.8, 3.2, 0.35);
      } else if (p.content === 'call') {
        p.write(ctx, p.text || 'UNKNOWN', 0, -4.6, { size: 0.9, color: '#e8e4da' });
        p.write(ctx, 'calling' + '.'.repeat(1 + Math.floor((t * 2) % 3)).padEnd(3, ' '), 0, -3.3, { size: 0.6, color: '#8d8a82', weight: 'normal' });
        const pulse = (t * 1.2) % 1;
        ctx.strokeStyle = UF.c(p.col('green'), 0.6 * (1 - pulse));
        ctx.lineWidth = 0.15;
        ell(ctx, -1.8, 4.6, 0.9 + pulse * 1.2, 0.9 + pulse * 1.2); ctx.stroke();
        ell(ctx, -1.8, 4.6, 0.9, 0.9); ctx.fillStyle = p.col('green'); ctx.fill();
        ell(ctx, 1.8, 4.6, 0.9, 0.9); ctx.fillStyle = p.col('red'); ctx.fill();
      } else if (p.content === 'otp') {
        p.write(ctx, 'ONE-TIME CODE', 0, -3, { size: 0.55, color: '#8d8a82' });
        p.write(ctx, p.text || '482 913', 0, -1.2, { size: 1.25, font: 'mono', color: '#e8e4da' });
      } else if (p.content === 'message') {
        for (let i = 0; i < 5; i++) {
          const right = i % 2 === 1, bw = 2.6 + 1.6 * hash(i, 6);
          D.roundRect(ctx, right ? 3 - bw : -3, -5.8 + i * 2.4, bw, 1.6, 0.6);
          ctx.fillStyle = p.col(right ? '#3a6ea5' : '#c9c5bc');
          ctx.fill();
        }
      }
      ctx.restore();
      ctx.fillStyle = '#050607';
      D.roundRect(ctx, -1, -7.1, 2, 0.5, 0.25);
      ctx.fill();
      if (p.glow && p.content !== 'off') glow(ctx, p, 0, 0, 14, '#9fc0e8', 0.12);
    },
  };

  /* ------------------------------------------------------------------ */
  /* Bags and paper                                                      */
  /* ------------------------------------------------------------------ */
  T.backpack = {
    anchor: 'bottom',
    defaults: { color: '#363c33' },
    held: { grip: [0, -47], hang: true },
    draw(ctx, p) {
      const c = p.color;
      ctx.strokeStyle = p.col(D.shade(c, -0.3));
      ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-4, -44); ctx.quadraticCurveTo(0, -50, 4, -44); ctx.stroke();
      p.slab(ctx, -15, -45, 30, 45, c, 9, { h: true, k: 0.18 });
      p.slab(ctx, -11, -22, 22, 18, D.shade(c, -0.1), 4);
      ctx.strokeStyle = p.col(D.shade(c, 0.25));
      ctx.lineWidth = 0.35;
      ctx.beginPath(); ctx.moveTo(-10, -21); ctx.quadraticCurveTo(0, -23, 10, -21); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-12, -38); ctx.quadraticCurveTo(0, -43, 12, -38); ctx.stroke();
      p.slab(ctx, 9, -22.5, 1, 3, '#8d8a82', 0.3);
    },
  };

  T.duffel = {
    anchor: 'bottom',
    defaults: { color: '#2b2f2a', open: false, cash: '#6f8a63' },
    held: { grip: [0, -40], hang: true },
    draw(ctx, p) {
      const c = p.color;
      ctx.strokeStyle = p.col(D.shade(c, -0.25));
      ctx.lineWidth = 1.6;
      ctx.beginPath(); ctx.moveTo(-10, -27); ctx.quadraticCurveTo(-6, -42, 0, -41); ctx.quadraticCurveTo(6, -42, 10, -27); ctx.stroke();
      if (p.open) {
        ell(ctx, 0, -27.5, 22, 3.2); ctx.fillStyle = p.col('#0c0d0e'); ctx.fill();
        for (let i = 0; i < 6; i++) {
          ctx.save();
          ctx.translate(-14 + i * 5.6, -28.6 - 1.4 * hash(i, 2));
          ctx.rotate(-0.2 + 0.4 * hash(i, 3));
          p.slab(ctx, -3.6, -1.4, 7.2, 2.8, D.shade(p.cash, -0.05 * (i % 2)), 0.3);
          ctx.fillStyle = p.col('#e2dccb'); ctx.fillRect(-0.6, -1.4, 1.2, 2.8);
          ctx.restore();
        }
      }
      p.slab(ctx, -29, -28, 58, 28, c, 12, { k: 0.18 });
      ell(ctx, -26, -14, 3.4, 12.5); ctx.fillStyle = p.col(D.shade(c, -0.25)); ctx.fill();
      ell(ctx, 26, -14, 3.4, 12.5); ctx.fill();
      ctx.strokeStyle = p.col(D.shade(c, 0.22));
      ctx.lineWidth = 0.4;
      ctx.beginPath(); ctx.moveTo(-20, -25.5); ctx.lineTo(20, -25.5); ctx.stroke();
      p.slab(ctx, -10, -24, 20, 1.6, D.shade(c, -0.3), 0.6);
    },
  };

  /** Wax seal centred on (x, y): `green` (0..1) turns it from red to green with a glow. */
  function waxSeal(ctx, p, x, y, r, color, green = 0, t = 0) {
    const col = green > 0 ? D.hexMix(UF.theme.colors[color] || color, '#3fae6e', green) : color;
    if (green > 0) {
      glow(ctx, p, x, y, r * 5, '#4caf7a', 0.55 * green * (0.8 + 0.2 * Math.sin(t * 5)));
    }
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * TAU, rr = r * (1 + 0.07 * Math.sin(i * 2.7));
      if (i) ctx.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); else ctx.moveTo(x + rr, y);
    }
    ctx.closePath();
    const g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r * 1.1);
    g.addColorStop(0, p.col(D.shade(col, 0.28)));
    g.addColorStop(1, p.col(D.shade(col, -0.32)));
    ctx.fillStyle = g;
    ctx.fill();
    ctx.strokeStyle = UF.c(p.col(D.shade(col, -0.45)), 0.8);
    ctx.lineWidth = r * 0.09;
    ell(ctx, x, y, r * 0.62, r * 0.62);
    ctx.stroke();
    ctx.strokeStyle = UF.c('#ffffff', 0.18 + 0.4 * green);
    ctx.beginPath(); ctx.arc(x, y, r * 0.62, -2.4, -1.0); ctx.stroke();
  }

  /** Wax seal that presses on at p.sealAt (always there when sealAt is null). */
  function sealIn(ctx, p, t, x, y, color, green) {
    const k = p.sealAt == null ? 1 : seg(t, p.sealAt, 0.16);
    if (k <= 0) return;
    ctx.save();
    ctx.translate(x, y);
    const s = 1 + 1.4 * (1 - ease.outCubic(k));
    ctx.scale(s, s);
    ctx.globalAlpha *= clamp(k * 1.6);
    waxSeal(ctx, p, 0, 0, 1.7, color, green, t);
    ctx.restore();
  }

  /** Ink stamp impression in prop units: bordered word, slammed in at `at`. */
  function inkStamp(ctx, p, t, s, x, y, maxW) {
    const k = seg(t, s.at, 0.12);
    if (k <= 0) return;
    const color = p.col(s.color || 'red');
    const size = s.size || 2.6;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(s.angle ?? -0.12);
    const sc = 1 + 0.6 * (1 - ease.outCubic(k));
    ctx.scale(sc, sc);
    ctx.globalAlpha *= 0.9 * k;
    ctx.font = UF.font.display(size);
    let tw = D.measure(ctx, s.text, size * 0.04);
    let sw = 1;
    if (tw > maxW) { sw = maxW / tw; tw = maxW; }
    const sub = s.sub ? size * 0.42 : 0;
    const bw = tw + size * 0.7, bh = size * 1.05 + (sub ? sub * 1.4 : 0);
    ctx.strokeStyle = color;
    ctx.lineWidth = size * 0.09;
    D.roundRect(ctx, -bw / 2, -bh / 2, bw, bh, size * 0.12);
    ctx.stroke();
    ctx.save();
    ctx.scale(sw, 1);
    D.text(ctx, s.text, 0, -bh / 2 + size * 0.58, { color, align: 'center', baseline: 'middle', spacing: size * 0.04 });
    ctx.restore();
    if (sub) {
      ctx.font = UF.font.sans(sub, 'bold');
      D.text(ctx, s.sub, 0, bh / 2 - sub * 0.85, { color, align: 'center', baseline: 'middle', spacing: sub * 0.08 });
    }
    ctx.restore();
  }

  /** Padlock centred on its body; the shackle drops shut at `snap`. */
  function padlock(ctx, p, t, snap, color) {
    const shut = snap == null || t >= snap;
    const lift = shut ? 0 : 1.3;
    const q = snap != null ? seg(t, snap, 0.25) : 1;
    const bounce = snap != null && t >= snap ? Math.sin(q * Math.PI) * 0.35 * (1 - q) : 0;
    ctx.save();
    ctx.translate(0, bounce);
    ctx.strokeStyle = p.col('#a7adb4');
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(-1.35, -1.4);
    ctx.lineTo(-1.35, -2.6 - lift);
    ctx.arc(0, -2.6 - lift, 1.35, Math.PI, 0);
    ctx.lineTo(1.35, shut ? -1.4 : -2.3 - lift);
    ctx.stroke();
    D.roundRect(ctx, -2.1, -1.8, 4.2, 3.6, 0.6);
    const g = ctx.createLinearGradient(0, -1.8, 0, 1.8);
    g.addColorStop(0, p.col(D.shade(color, 0.3)));
    g.addColorStop(1, p.col(D.shade(color, -0.3)));
    ctx.fillStyle = g;
    ctx.fill();
    ell(ctx, 0, -0.25, 0.42, 0.42);
    ctx.fillStyle = p.col('#2a2216');
    ctx.fill();
    ctx.fillRect(-0.16, -0.1, 0.32, 0.9);
    ctx.restore();
  }

  T.envelope = {
    anchor: 'center',
    defaults: { color: '#d9d0bb', side: 'back', seal: true, sealAt: null, sealGlow: null, tints: [], lock: null, stamps: [], open: null, part: 'all', tag: null },
    held: { grip: [-9, 0] },
    points: { seal: [0, 1], top: [0, -5.5], center: [0, 0] },
    init(p) {
      if (!['all', 'back', 'front'].includes(p.part)) throw new Error('Prop envelope: part is all, back or front.');
      if (!['back', 'front'].includes(p.side)) throw new Error('Prop envelope: side is back (flap and seal) or front (address).');
      for (const s of list(p.stamps)) if (typeof s.at !== 'number' || !s.text) throw new Error('Prop envelope: each stamp is { at, text }.');
    },
    draw(ctx, p, t, fx) {
      const w = 22, h = 11;
      let body = UF.theme.colors[p.color] || p.color, halo = null, haloK = 0;
      for (const s of list(p.tints)) {
        if (t < s.at) continue;
        const k = seg(t, s.at, s.dur ?? 0.4);
        body = D.hexMix(body, UF.theme.colors[s.color] || s.color, k);
        if (s.glow) { halo = s.glow; haloK = k; } else if (k >= 1) halo = null;
      }
      const back = p.part !== 'front', front = p.part !== 'back';
      if (halo && back) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        ctx.scale(1, 0.62);
        const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 22);
        g.addColorStop(0, UF.c(p.col(halo), 0.5 * haloK * (0.85 + 0.15 * Math.sin(t * 4))));
        g.addColorStop(1, UF.c(p.col(halo), 0));
        ctx.fillStyle = g;
        ctx.fillRect(-22, -22, 44, 44);
        ctx.restore();
      }
      const seam = D.shade(body, -0.25);
      if (p.side === 'front') {
        if (front) {
          p.slab(ctx, -w / 2, -h / 2, w, h, body, 0.3, { k: 0.08 });
          ctx.fillStyle = p.col(D.shade(body, -0.35));
          for (let i = 0; i < 3; i++) ctx.fillRect(-1, -0.5 + i * 1.5, 7 - i * 1.5, 0.45);
          ctx.strokeStyle = p.col(seam);
          ctx.lineWidth = 0.3;
          ctx.strokeRect(w / 2 - 4, -h / 2 + 1, 3, 3.6);
        }
      } else {
        const fl = p.open ? lerp(p.open.from ?? 0, p.open.to ?? 1, ease.inOutCubic(seg(t, p.open.at, p.open.dur ?? 0.5))) : 0;
        const th = fl * Math.PI, apex = -h / 2 + 6.7 * Math.cos(th);
        const sealCol = p.seal === true ? 'red' : p.seal;
        const green = p.sealGlow != null ? ease.outCubic(seg(t, p.sealGlow, 0.5)) : 0;
        if (fl <= 0) {
          if (front) {
            p.slab(ctx, -w / 2, -h / 2, w, h, body, 0.3, { k: 0.08 });
            ctx.strokeStyle = p.col(seam);
            ctx.lineWidth = 0.3;
            ctx.beginPath(); ctx.moveTo(-w / 2, -h / 2); ctx.lineTo(0, 1.2); ctx.lineTo(w / 2, -h / 2); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(-w / 2, h / 2); ctx.lineTo(-2, -0.2); ctx.moveTo(w / 2, h / 2); ctx.lineTo(2, -0.2); ctx.stroke();
            if (p.seal) sealIn(ctx, p, t, 0, 1, sealCol, green);
          }
        } else {
          if (back) {
            p.slab(ctx, -w / 2, -h / 2, w, h, D.shade(body, -0.38), 0.3, { k: 0.05 });
            if (th > Math.PI / 2) {
              poly(ctx, [[-w / 2, -h / 2], [w / 2, -h / 2], [0, apex]]);
              ctx.fillStyle = p.col(D.shade(body, -0.1));
              ctx.fill();
            }
          }
          if (front) {
            poly(ctx, [[-w / 2, -h / 2], [0, -h / 2 + 2.2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]);
            const g = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
            g.addColorStop(0, p.col(D.shade(body, 0.08)));
            g.addColorStop(1, p.col(D.shade(body, -0.12)));
            ctx.fillStyle = g;
            ctx.fill();
            ctx.strokeStyle = p.col(seam);
            ctx.lineWidth = 0.3;
            ctx.beginPath(); ctx.moveTo(-w / 2, h / 2); ctx.lineTo(-2, -0.2); ctx.moveTo(w / 2, h / 2); ctx.lineTo(2, -0.2); ctx.stroke();
            if (th <= Math.PI / 2) {
              poly(ctx, [[-w / 2, -h / 2], [w / 2, -h / 2], [0, apex]]);
              ctx.fillStyle = p.col(D.shade(body, 0.04));
              ctx.fill();
              ctx.stroke();
              if (p.seal && apex > -h / 2 + 1.5) sealIn(ctx, p, t, 0, apex - 0.2, sealCol, green);
            }
          }
        }
        if (front && green > 0 && p.sealGlow != null) {
          const r = seg(t, p.sealGlow, 0.7);
          if (r < 1) {
            ctx.strokeStyle = UF.c(p.col('green'), 0.8 * (1 - r));
            ctx.lineWidth = 0.25;
            ell(ctx, 0, 1, 1.7 + r * 5, 1.7 + r * 5);
            ctx.stroke();
          }
        }
      }
      if (!front) return;
      if (fx && p.seal && p.sealAt != null && p.side === 'back') fx.kick(t, p.sealAt, { shake: 0.004, rgb: 0.3, decay: 12 });
      for (const s of list(p.stamps)) {
        if (fx && s.kick) fx.kick(t, s.at, s.kick);
        inkStamp(ctx, p, t, s, 0, 0.4, w - 3);
      }
      if (p.lock != null && t >= p.lock - 0.3) {
        const k = ease.outBack(seg(t, p.lock - 0.3, 0.25));
        ctx.save();
        ctx.translate(0, 0.8);
        ctx.scale(1.25 * k, 1.25 * k);
        padlock(ctx, p, t, p.lock, '#9aa0a7');
        ctx.restore();
      }
      if (p.tag) {
        ctx.save();
        ctx.translate(w / 2 - 4.2, -h / 2 - 2.6);
        ctx.rotate(-0.06);
        ctx.strokeStyle = p.col('#8d8a82');
        ctx.lineWidth = 0.18;
        ctx.beginPath(); ctx.moveTo(-2.6, 0); ctx.lineTo(-3.4, 2.6); ctx.stroke();
        p.slab(ctx, -2.8, -1.25, 7.4, 2.5, '#f2efe6', 0.25, { k: 0.06 });
        ell(ctx, -2.1, 0, 0.25, 0.25);
        ctx.fillStyle = p.col('#8d8a82');
        ctx.fill();
        p.write(ctx, p.tag, 1.0, 0.05, { size: 1.3, font: 'mono', color: '#1d2024' });
        ctx.restore();
      }
    },
  };

  /**
   * Payment message on paper: a title, then label / value rows. A value of { redact: n } is an
   * n-character black bar. mark: { word, at, style: 'pulse' | 'circle', note, noteAt } picks out one word;
   * a circle's note goes under it when the word is on the last row and beside it otherwise.
   * point('mark') is its centre, for a camera to push in on.
   */
  T.message = {
    anchor: 'center',
    defaults: { title: 'PAYMENT INSTRUCTION', sub: null, fields: [], mark: null, w: 21, h: 26, color: '#efece4' },
    points: p => ({ mark: p._mark ? p._mark.c : [0, 0], top: [0, -p.h / 2], center: [0, 0] }),
    init(p) {
      const m = UF.canvas(8, 8).getContext('2d');
      m.font = UF.font.type(100, 'bold');
      const cw = m.measureText('M').width / 100;
      const x0 = -p.w / 2 + 1.7;
      let y = -p.h / 2 + 6.6;
      p._rows = p.fields.map(([label, value]) => {
        const r = { label, value, y };
        y += 3.4;
        return r;
      });
      p._val = 1.05;
      p._x0 = x0;
      p._mark = null;
      if (p.mark) {
        const row = p._rows.find(r => typeof r.value === 'string' && r.value.includes(p.mark.word));
        if (!row) throw new Error(`Prop message: no field contains "${p.mark.word}".`);
        const i = row.value.indexOf(p.mark.word);
        const pre = cw * i * p._val, ww = cw * p.mark.word.length * p._val;
        p._mark = { row, x: x0 + pre, w: ww, c: [x0 + pre + ww / 2, row.y + 1.35] };
      }
    },
    draw(ctx, p, t) {
      const w = p.w, h = p.h, x0 = p._x0;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(-w / 2 + 0.4, -h / 2 + 0.6, w, h);
      ctx.fillStyle = p.col(p.color);
      ctx.fillRect(-w / 2, -h / 2, w, h);
      const fold = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      fold.addColorStop(0, 'rgba(0,0,0,0)');
      fold.addColorStop(0.33, 'rgba(0,0,0,0.05)');
      fold.addColorStop(0.335, 'rgba(255,255,255,0.08)');
      fold.addColorStop(0.66, 'rgba(0,0,0,0.04)');
      fold.addColorStop(0.665, 'rgba(255,255,255,0.07)');
      fold.addColorStop(1, 'rgba(0,0,0,0.03)');
      ctx.fillStyle = fold;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      p.write(ctx, p.title, x0, -h / 2 + 2.5, { size: 1.15, font: 'sans', color: '#1d2024', align: 'left', spacing: 0.08 });
      if (p.sub) p.write(ctx, p.sub, w / 2 - 1.7, -h / 2 + 2.55, { size: 0.62, font: 'mono', color: '#6a6f76', align: 'right' });
      ctx.fillStyle = p.col('#1d2024');
      ctx.fillRect(x0, -h / 2 + 3.6, w - 3.4, 0.12);
      const mk = p.mark, M = p._mark;
      const on = mk ? seg(t, mk.at ?? 0, 0.3) : 0;
      for (const r of p._rows) {
        p.write(ctx, r.label, x0, r.y, { size: 0.6, font: 'mono', color: '#6a6f76', align: 'left', spacing: 0.06 });
        if (r.value && typeof r.value === 'object') {
          ctx.fillStyle = p.col('#111214');
          ctx.fillRect(x0, r.y + 0.75, (r.value.redact || 8) * 0.63 * p._val, 1.0);
        } else {
          p.write(ctx, r.value, x0, r.y + 1.35, { size: p._val, font: 'type', color: '#1d2024', align: 'left', weight: 'bold' });
        }
      }
      const noteBelow = M && mk.note && mk.style === 'circle' && M.row === p._rows[p._rows.length - 1];
      ctx.fillStyle = p.col('#a9a59c');
      const fy = (p._rows.length ? p._rows[p._rows.length - 1].y : -h / 2 + 5) + 4.2 + (noteBelow ? 2.8 : 0);
      for (let i = 0; i < 4 && fy + i * 1.2 < h / 2 - 1.2; i++) ctx.fillRect(x0, fy + i * 1.2, (w - 3.4) * (0.4 + 0.5 * hash(i, 61)), 0.3);
      if (!M || on <= 0) return;
      const cy = M.c[1], col = mk.color || 'red';
      if (mk.style === 'circle') {
        D.circleMark(ctx, M.c[0], cy - 0.2, M.w / 2 + 1.1, 1.5, ease.outCubic(seg(t, mk.at, 0.7)), { color: p.col(col), width: 0.22, seed: 4 });
        if (mk.note) {
          const k = ease.outCubic(seg(t, mk.noteAt ?? mk.at + 0.9, 0.4));
          if (k > 0) {
            ctx.save();
            ctx.globalAlpha *= k;
            ctx.strokeStyle = p.col(col);
            ctx.lineWidth = 0.16;
            if (noteBelow) {
              ctx.beginPath(); ctx.moveTo(M.c[0], cy + 1.4); ctx.lineTo(M.c[0], cy + 2.3); ctx.stroke();
              D.arrowHead(ctx, M.c[0], cy + 1.3, -Math.PI / 2, 0.55, p.col(col));
              p.write(ctx, mk.note, M.c[0], cy + 3.3 - (1 - k) * 0.6, { size: 1.3, font: 'sans', color: col, spacing: 0.06 });
            } else {
              const ex = M.x + M.w + 1.5;
              ctx.beginPath(); ctx.moveTo(ex + 0.1, cy - 0.2); ctx.lineTo(ex + 1.1, cy - 0.2); ctx.stroke();
              D.arrowHead(ctx, ex, cy - 0.2, Math.PI, 0.55, p.col(col));
              p.write(ctx, mk.note, ex + 1.5 + (1 - k) * 0.6, cy - 0.2, { size: 1.3, font: 'sans', color: col, align: 'left', spacing: 0.06 });
            }
            ctx.restore();
          }
        }
      } else {
        const beat = 0.5 + 0.5 * Math.sin((t - mk.at) * 6.5 - Math.PI / 2);
        ctx.fillStyle = UF.c(p.col(col), on * (0.12 + 0.16 * beat));
        ctx.fillRect(M.x - 0.3, cy - 1.25, M.w + 0.6, 1.75);
        p.write(ctx, mk.word, M.x, cy, { size: p._val, font: 'type', color: col, align: 'left', weight: 'bold' });
        ctx.fillStyle = p.col(col);
        ctx.fillRect(M.x, cy + 0.62, M.w * ease.outCubic(on), 0.14);
        const r = ((t - mk.at) % 1.1) / 1.1;
        ctx.strokeStyle = UF.c(p.col(col), 0.6 * (1 - r) * on);
        ctx.lineWidth = 0.12;
        D.roundRect(ctx, M.x - 0.3 - r * 1.2, cy - 1.25 - r * 0.8, M.w + 0.6 + r * 2.4, 1.75 + r * 1.6, 0.3);
        ctx.stroke();
      }
    },
  };

  T.document = {
    anchor: 'center',
    defaults: { title: null, lines: 14, redact: [], stamp: null, color: '#ece8df' },
    held: { grip: [-8.5, 6] },
    draw(ctx, p) {
      const w = 21, h = 29.7;
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(-w / 2 + 0.5, -h / 2 + 0.6, w, h);
      ctx.fillStyle = p.col(p.color);
      ctx.fillRect(-w / 2, -h / 2, w, h);
      let y = -h / 2 + 3;
      if (p.title) { p.write(ctx, p.title, 0, y + 0.6, { size: 1.5, font: 'sans', color: '#1d2024', spacing: 0.08 }); y += 3; }
      const red = list(p.redact);
      for (let i = 0; i < p.lines; i++, y += 1.6) {
        const lw = (i % 5 === 4 ? 0.5 : 0.75 + 0.2 * hash(i, 11)) * (w - 4);
        ctx.fillStyle = red.includes(i) ? p.col('#0b0b0c') : p.col('#a9a59c');
        ctx.fillRect(-w / 2 + 2, y, lw, red.includes(i) ? 1.1 : 0.45);
      }
      if (p.stamp) {
        ctx.save();
        ctx.translate(3, h / 2 - 7);
        ctx.rotate(-0.22);
        ctx.strokeStyle = UF.c(p.col('red'), 0.85);
        ctx.lineWidth = 0.4;
        ctx.strokeRect(-7, -1.6, 14, 3.2);
        p.write(ctx, p.stamp, 0, 0.1, { size: 1.5, font: 'mono', color: UF.c(p.col('red'), 0.85), spacing: 0.15 });
        ctx.restore();
      }
    },
  };

  T.paperStack = {
    anchor: 'bottom',
    defaults: { count: 40, title: null, color: '#ece8df' },
    draw(ctx, p) {
      const h = 1.5 + p.count * 0.22, w = 23;
      p.slab(ctx, -w / 2, -h, w, h, p.color, 0.3, { k: 0.06 });
      ctx.strokeStyle = p.col(D.shade(p.color, -0.18));
      ctx.lineWidth = 0.12;
      for (let y = -h + 0.5; y < -0.3; y += 0.45) {
        ctx.beginPath(); ctx.moveTo(-w / 2 + 0.2 * hash(y * 10, 1), y); ctx.lineTo(w / 2 - 0.2 * hash(y * 10, 2), y); ctx.stroke();
      }
      poly(ctx, [[-w / 2 + 1.2, -h - 2], [w / 2 - 1.2, -h - 2], [w / 2, -h], [-w / 2, -h]]);
      ctx.fillStyle = p.col(D.shade(p.color, 0.06));
      ctx.fill();
      p.slab(ctx, -3, -h - 2.4, 6, 3.4, '#15171a', 0.4);
      if (p.title) {
        p.slab(ctx, -8, -h * 0.5 - 1.8, 16, 3.6, '#f6f3ec', 0.2);
        p.write(ctx, p.title, 0, -h * 0.5, { size: 1.3, font: 'mono', color: '#1d2024' });
      }
    },
  };

  /* ------------------------------------------------------------------ */
  /* Rooms                                                               */
  /* ------------------------------------------------------------------ */
  T.wallClock = {
    anchor: 'center',
    defaults: { time: '10:10', spin: null, seconds: true, run: false, sec: 0 },
    draw(ctx, p, t) {
      let m = hhmm(p.time);
      if (p.spin) m = lerp(hhmm(p.spin.from), hhmm(p.spin.to), ease.inOutSine(seg(t, p.spin.at || 0, p.spin.dur || 2)));
      else if (p.run) m += Math.floor(t + p.sec) / 60;
      ell(ctx, 0, 0, 15.5, 15.5); ctx.fillStyle = p.col('#1d2024'); ctx.fill();
      ell(ctx, 0, 0, 14, 14);
      const g = ctx.createRadialGradient(-4, -5, 1, 0, 0, 14);
      g.addColorStop(0, p.col('#f4f1ea')); g.addColorStop(1, p.col('#d6d1c5'));
      ctx.fillStyle = g; ctx.fill();
      ctx.fillStyle = p.col('#1d2024');
      for (let i = 0; i < 60; i++) {
        ctx.save(); ctx.rotate(i * TAU / 60);
        const big = i % 5 === 0;
        ctx.fillRect(-(big ? 0.45 : 0.15), -13, big ? 0.9 : 0.3, big ? 2.2 : 0.9);
        ctx.restore();
      }
      const hand = (a, len, wd, col) => {
        ctx.save(); ctx.rotate(a);
        ctx.fillStyle = p.col(col);
        ctx.beginPath(); ctx.moveTo(-wd / 2, 1.6); ctx.lineTo(-wd / 3, -len); ctx.lineTo(wd / 3, -len); ctx.lineTo(wd / 2, 1.6); ctx.closePath(); ctx.fill();
        ctx.restore();
      };
      hand(((m / 60) % 12) / 12 * TAU, 7.5, 1.1, '#15171a');
      hand((m % 60) / 60 * TAU, 11, 0.8, '#15171a');
      if (p.seconds && !p.spin) hand(Math.floor(t + p.sec) / 60 * TAU, 11.8, 0.3, 'red');
      ell(ctx, 0, 0, 0.8, 0.8); ctx.fillStyle = p.col('red'); ctx.fill();
    },
  };

  T.ceilingFan = {
    anchor: 'top',
    defaults: { speed: 1.1, phase: 0 },
    points: { hub: [0, 25] },
    draw(ctx, p, t) {
      const R = 64, sq = 0.14, hy = 25;
      const spin = t * p.speed * TAU + p.phase;
      const blade = (th, alpha) => {
        const P = (a, r) => [Math.cos(a) * r, hy + Math.sin(a) * r * sq];
        const pts = [P(th - 0.28, 9), P(th - 0.1, R), P(th + 0.1, R), P(th + 0.28, 9)];
        ctx.save();
        ctx.globalAlpha *= alpha;
        ctx.fillStyle = p.col(D.shade('#3a3f46', 0.18 * Math.sin(th)));
        poly(ctx, pts);
        ctx.fill();
        ctx.restore();
      };
      const ghosts = p.speed > 0.3 ? 4 : 1;
      const draw = front => {
        for (let i = 0; i < 3; i++) {
          for (let g = 0; g < ghosts; g++) {
            const th = spin + i * TAU / 3 - g * 0.09 * Math.min(p.speed, 2);
            if ((Math.sin(th) > 0) !== front) continue;
            blade(th, g === 0 ? 1 : 0.32 / g);
          }
        }
      };
      poly(ctx, [[-4.5, 0], [4.5, 0], [3, 2.5], [-3, 2.5]]);
      ctx.fillStyle = p.col('#2a2e35'); ctx.fill();
      p.slab(ctx, -0.8, 2.5, 1.6, 19, '#3a3f46', 0, { h: true });
      draw(false);
      ell(ctx, 0, hy, 10, 4.2);
      const g = ctx.createLinearGradient(-10, 0, 10, 0);
      g.addColorStop(0, p.col('#565c64')); g.addColorStop(1, p.col('#22262c'));
      ctx.fillStyle = g; ctx.fill();
      ell(ctx, 0, hy + 3, 6, 2.2); ctx.fillStyle = p.col('#1b1e22'); ctx.fill();
      draw(true);
    },
  };

  T.serverRack = {
    anchor: 'bottom',
    defaults: { alarm: false, label: null },
    points: { top: [0, -200], face: [0, -100] },
    draw(ctx, p, t) {
      const alarm = p.alarm === true || (typeof p.alarm === 'number' && t >= p.alarm);
      p.slab(ctx, -30, -200, 60, 200, '#16181c', 1, { h: true, k: 0.12 });
      ctx.fillStyle = '#07080a';
      ctx.fillRect(-26, -194, 52, 186);
      const U = 4.45, plan = [2, 1, 1, 2, 4, 1, 0, 2, 1, 1, 2, 1, 0, 4, 2, 1, 1, 2, 1, 2, 1, 0, 2, 1, 1, 2, 2, 1, 1, 2, 1, 1, 2];
      let y = -10, n = 0;
      for (const u of plan) {
        const h = Math.max(1, u) * U;
        if (y - h < -193) break;
        y -= h;
        n++;
        if (!u) { ctx.fillStyle = p.col('#1d2024'); ctx.fillRect(-25, y + 0.2, 50, h - 0.4); continue; }
        p.slab(ctx, -25, y + 0.2, 50, h - 0.4, u === 4 ? '#262a31' : '#2b3038', 0.4, { k: 0.12 });
        ctx.fillStyle = p.col('#1a1d22');
        for (let i = 0; i < (u === 4 ? 10 : 5); i++) ctx.fillRect(-22 + i * (u === 4 ? 2.6 : 3.4), y + 1, u === 4 ? 1.8 : 2.4, h - 2);
        const leds = u === 1 && n % 3 === 0 ? 10 : 3;
        for (let i = 0; i < leds; i++) {
          const rate = 2 + 7 * hash(n, i), on = hash(n * 31 + i, Math.floor(t * rate)) > 0.35;
          const bad = alarm && hash(n, i + 50) > 0.6;
          const col = bad ? ((t * 3) % 1 < 0.6 ? 'red' : '#3a0b0e') : i === 0 ? 'green' : on ? (hash(n, i + 9) > 0.85 ? 'amber' : 'green') : '#123222';
          ctx.fillStyle = p.col(col);
          ctx.fillRect(leds > 3 ? -2 + i * 2.2 : 14 + i * 2.6, y + h / 2 - 0.5, 1.2, 1);
        }
      }
      const gl = ctx.createLinearGradient(-26, -194, 26, -8);
      gl.addColorStop(0, 'rgba(255,255,255,0.05)'); gl.addColorStop(0.35, 'rgba(255,255,255,0)');
      ctx.fillStyle = gl;
      ctx.fillRect(-26, -194, 52, 186);
      if (p.label) {
        p.slab(ctx, -14, -199, 28, 4, '#d6d1c5', 0.4);
        p.write(ctx, p.label, 0, -197, { size: 2, font: 'mono', color: '#15171a' });
      }
      if (alarm) glow(ctx, p, 0, -100, 110, 'red', 0.1 + 0.08 * Math.sin(t * 6));
    },
  };

  T.cctv = {
    anchor: 'center',
    defaults: { sweep: 0.25, period: 8 },
    draw(ctx, p, t) {
      p.slab(ctx, -3, -7, 4, 14, '#2a2e35', 0.8, { h: true });
      ctx.strokeStyle = p.col('#3a3f46'); ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(9, 2); ctx.stroke();
      ctx.save();
      ctx.translate(9, 2);
      ctx.rotate(0.32 + p.sweep * Math.sin(TAU * t / p.period));
      p.slab(ctx, -2, -4.5, 22, 9, '#d6d1c5', 2, { k: 0.15 });
      p.slab(ctx, 18, -5.5, 5, 11, '#2a2e35', 1, { h: true });
      ell(ctx, 22.6, 0, 1.2, 3.4); ctx.fillStyle = p.col('#0b1a24'); ctx.fill();
      ctx.fillStyle = (t * 1.25) % 1 < 0.5 ? p.col('red') : p.col('#3a0b0e');
      ell(ctx, 2, -2.2, 0.7, 0.7); ctx.fill();
      ctx.restore();
    },
  };

  T.lamp = {
    anchor: 'bottom',
    defaults: { on: true, light: '#ffd9a0' },
    draw(ctx, p) {
      if (p.on) {
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        const g = ctx.createLinearGradient(22, -36, 30, 0);
        g.addColorStop(0, UF.c(p.col(p.light), 0.26 * (1 - p.dim)));
        g.addColorStop(1, UF.c(p.col(p.light), 0));
        ctx.fillStyle = g;
        poly(ctx, [[17.5, -34], [25.5, -36], [48, 0], [6, 0]]);
        ctx.fill();
        ctx.restore();
      }
      ctx.lineCap = 'round';
      ctx.strokeStyle = p.col('#2a2e35'); ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(5, -28); ctx.lineTo(18, -38); ctx.stroke();
      p.slab(ctx, -9, -2.4, 18, 2.4, '#22262c', 1);
      ctx.save();
      ctx.translate(20, -37);
      ctx.rotate(0.5);
      poly(ctx, [[-3, -2], [3, -2], [6, 6], [-6, 6]]);
      ctx.fillStyle = p.col('#2f343b'); ctx.fill();
      if (p.on) { ell(ctx, 0, 6, 5.6, 1.2); ctx.fillStyle = p.col('#fff2d6'); ctx.fill(); }
      ctx.restore();
    },
  };

  T.mug = {
    anchor: 'bottom',
    defaults: { color: '#e6e1d6', steam: true },
    held: { grip: [6.4, -5], hang: true },
    draw(ctx, p, t) {
      ctx.strokeStyle = p.col(D.shade(p.color, -0.15));
      ctx.lineWidth = 1.3;
      ctx.beginPath(); ctx.moveTo(4, -7.8); ctx.bezierCurveTo(7.6, -7.8, 7.6, -2.4, 4, -2.4); ctx.stroke();
      p.slab(ctx, -4.2, -9.6, 8.4, 9.6, p.color, 0.8, { h: true, k: 0.2 });
      ell(ctx, 0, -9.6, 4.2, 0.9); ctx.fillStyle = p.col('#3b2a1f'); ctx.fill();
      if (!p.steam) return;
      ctx.lineWidth = 0.5;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        for (let k = 0; k <= 12; k++) {
          const y = -11 - k * 1.2, x = (i - 1) * 1.6 + Math.sin(k * 0.6 - t * 2.4 + i * 2) * 0.9;
          if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y);
        }
        const g = ctx.createLinearGradient(0, -11, 0, -26);
        g.addColorStop(0, 'rgba(232,228,218,0.28)'); g.addColorStop(1, 'rgba(232,228,218,0)');
        ctx.strokeStyle = g;
        ctx.stroke();
      }
    },
  };

  T.notice = {
    anchor: 'center',
    defaults: { title: 'NOTICE', text: null, color: '#ece8df', band: 'red' },
    draw(ctx, p) {
      const w = 32, h = 42;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(-w / 2 + 0.6, -h / 2 + 0.8, w, h);
      ctx.fillStyle = p.col(p.color);
      ctx.fillRect(-w / 2, -h / 2, w, h);
      if (p.band) { ctx.fillStyle = p.col(p.band); ctx.fillRect(-w / 2, -h / 2, w, 6); }
      p.write(ctx, p.title, 0, -h / 2 + (p.band ? 3.1 : 5), { size: 3.6, font: 'display', color: p.band ? '#f4f1ea' : '#15171a', spacing: 0.3 });
      if (p.text) {
        String(p.text).split('\n').forEach((line, i) => p.write(ctx, line, 0, -h / 2 + 11 + i * 3, { size: 1.8, font: 'sans', color: '#1d2024' }));
      } else {
        ctx.fillStyle = p.col('#a9a59c');
        for (let i = 0; i < 10; i++) ctx.fillRect(-w / 2 + 3, -h / 2 + 10 + i * 2.6, (w - 6) * (0.6 + 0.4 * hash(i, 13)), 0.6);
      }
      ctx.fillStyle = UF.c(p.col('#d8cfae'), 0.75);
      for (const s of [-1, 1]) {
        ctx.save(); ctx.translate(s * (w / 2 - 2), -h / 2); ctx.rotate(s * 0.6);
        ctx.fillRect(-3.5, -1.2, 7, 2.4);
        ctx.restore();
      }
    },
  };

  T.clapperboard = {
    anchor: 'center',
    defaults: { clap: null, fields: {} },
    held: { grip: [-12, 4] },
    draw(ctx, p, t, fx) {
      if (fx && p.clap != null) fx.kick(t, p.clap, { shake: 0.008, flash: 0.12, decay: 12 });
      const w = 30, f = Object.assign({ prod: 'UNFICTION', scene: '1', take: '1', roll: 'A001', date: '' }, p.fields);
      p.slab(ctx, -w / 2, -9, w, 20, '#1b1d21', 0.6, { k: 0.08 });
      ctx.strokeStyle = p.col('#d6d1c5');
      ctx.lineWidth = 0.25;
      ctx.beginPath();
      ctx.moveTo(-w / 2 + 1, -2); ctx.lineTo(w / 2 - 1, -2);
      ctx.moveTo(-w / 2 + 1, 4.5); ctx.lineTo(w / 2 - 1, 4.5);
      ctx.moveTo(-5, -2); ctx.lineTo(-5, 4.5); ctx.moveTo(5, -2); ctx.lineTo(5, 4.5);
      ctx.stroke();
      const lab = (s, x, y) => p.write(ctx, s, x, y, { size: 0.9, font: 'mono', color: '#8d8a82', align: 'left', weight: 'normal' });
      const val = (s, x, y, size = 2.4) => p.write(ctx, s, x, y, { size, font: 'sans', color: '#f4f1ea', align: 'left' });
      lab('PROD', -w / 2 + 1.2, -7.6); val(f.prod, -w / 2 + 1.2, -4.6, 2.4);
      lab('ROLL', -w / 2 + 1.2, -0.8); val(f.roll, -w / 2 + 1.2, 2.2, 1.9);
      lab('SCENE', -3.8, -0.8); val(f.scene, -3.8, 2.2, 2.2);
      lab('TAKE', 6.2, -0.8); val(f.take, 6.2, 2.2, 2.2);
      lab('DATE', -w / 2 + 1.2, 6); val(f.date, -w / 2 + 1.2, 8.8, 1.5);
      let open = 0;
      if (p.clap != null) open = t < p.clap ? ease.outCubic(seg(t, p.clap - 0.9, 0.4)) : 1 - seg(t, p.clap, 0.06);
      const stripes = y => {
        ctx.save();
        ctx.beginPath(); ctx.rect(-w / 2, y, w, 3.6); ctx.clip();
        ctx.fillStyle = p.col('#f4f1ea'); ctx.fillRect(-w / 2, y, w, 3.6);
        ctx.fillStyle = p.col('#15171a');
        for (let x = -w / 2 - 4; x < w / 2 + 4; x += 6) { poly(ctx, [[x, y + 3.6], [x + 3, y + 3.6], [x + 6, y], [x + 3, y]]); ctx.fill(); }
        ctx.restore();
      };
      stripes(-12.8);
      ctx.save();
      ctx.translate(-w / 2, -12.8);
      ctx.rotate(-0.5 * open);
      ctx.translate(w / 2, 12.8);
      stripes(-16.6);
      ctx.restore();
      ell(ctx, -w / 2 + 1.2, -12.8, 0.8, 0.8); ctx.fillStyle = p.col('#8d8a82'); ctx.fill();
    },
  };

  T.stopwatch = {
    anchor: 'center',
    defaults: { seconds: 0, run: null },
    held: { grip: [0, 9.5], hang: true },
    draw(ctx, p, t) {
      let s = p.seconds;
      if (p.run) s = lerp(p.run.from || 0, p.run.to ?? 60, seg(t, p.run.at || 0, p.run.dur || 10));
      p.slab(ctx, -1.6, -12.6, 3.2, 3.2, '#9aa0a7', 0.6, { h: true });
      ctx.strokeStyle = p.col('#9aa0a7'); ctx.lineWidth = 0.6;
      ctx.beginPath(); ctx.arc(0, -13.6, 1.6, Math.PI, 0); ctx.stroke();
      ctx.save(); ctx.rotate(0.8); p.slab(ctx, -1, -11, 2, 2.4, '#9aa0a7', 0.4); ctx.restore();
      ell(ctx, 0, 0, 9.4, 9.4);
      const g = ctx.createLinearGradient(-9, -9, 9, 9);
      g.addColorStop(0, p.col('#d9dde2')); g.addColorStop(1, p.col('#6d737a'));
      ctx.fillStyle = g; ctx.fill();
      ell(ctx, 0, 0, 8, 8); ctx.fillStyle = p.col('#f2efe8'); ctx.fill();
      ctx.fillStyle = p.col('#1d2024');
      for (let i = 0; i < 60; i++) {
        ctx.save(); ctx.rotate(i * TAU / 60);
        const big = i % 5 === 0;
        ctx.fillRect(-(big ? 0.2 : 0.08), -7.6, big ? 0.4 : 0.16, big ? 1.3 : 0.6);
        ctx.restore();
      }
      const n = Math.max(0, Math.floor(s));
      p.slab(ctx, -3.9, 1.8, 7.8, 2.6, '#101418', 0.3);
      const txt = `${Math.floor(n / 3600)}:${String(Math.floor(n / 60) % 60).padStart(2, '0')}:${String(n % 60).padStart(2, '0')}`;
      p.write(ctx, txt, 0, 3.15, { size: 1.5, font: 'mono', color: 'green' });
      ctx.save();
      ctx.rotate((s % 60) / 60 * TAU);
      ctx.fillStyle = p.col('red');
      poly(ctx, [[-0.2, 1.4], [-0.1, -7], [0.1, -7], [0.2, 1.4]]);
      ctx.fill();
      ctx.restore();
      ell(ctx, 0, 0, 0.6, 0.6); ctx.fillStyle = p.col('red'); ctx.fill();
    },
  };

  /* ------------------------------------------------------------------ */
  /* Office machines and fittings                                        */
  /* ------------------------------------------------------------------ */
  const PRINTER = { ready: ['green', 'READY'], busy: ['green', 'PRINTING'], error: ['red', 'ERROR'], off: [null, ''] };
  T.printer = {
    anchor: 'bottom',
    defaults: { status: 'ready', states: [], tray: 0, feed: [], pages: [], press: [], whir: [], color: '#cdcac3' },
    points: { tray: [0, -33], panel: [18.5, -24.4], slot: [0, -37.6], top: [0, -39] },
    init(p) {
      for (const s of [{ status: p.status }, ...list(p.states)]) {
        if (!PRINTER[s.status]) throw new Error(`Prop printer: status is ${Object.keys(PRINTER).join(', ')}.`);
      }
    },
    draw(ctx, p, t, fx) {
      let st = { at: -1e9, status: p.status, lcd: null };
      for (const s of list(p.states)) {
        if (fx && s.kick) fx.kick(t, s.at, s.kick);
        if (t >= s.at && s.at >= st.at) st = s;
      }
      const busy = list(p.whir).some(w => t >= w.at && t < w.at + (w.dur ?? 1.5));
      const c = p.color;
      ctx.save();
      if (busy) ctx.translate(Math.sin(t * 97) * 0.1, Math.sin(t * 73) * 0.05);
      ell(ctx, 0, 0, 26, 1.4);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fill();
      poly(ctx, [[-24, -28], [24, -28], [22.6, -39], [-22.6, -39]]);
      const gt = ctx.createLinearGradient(0, -39, 0, -28);
      gt.addColorStop(0, p.col(D.shade(c, 0.02)));
      gt.addColorStop(1, p.col(D.shade(c, 0.16)));
      ctx.fillStyle = gt;
      ctx.fill();
      p.slab(ctx, -24, -28, 48, 28, c, 0.8, { k: 0.08 });
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(-24, -28, 48, 0.35);
      ctx.fillStyle = p.col(D.shade(c, -0.1));
      ctx.fillRect(-23, -10.5, 46, 9.6);
      ctx.fillStyle = 'rgba(0,0,0,0.32)';
      ctx.fillRect(-23, -10.6, 46, 0.35);
      D.roundRect(ctx, -6, -7.4, 12, 2, 1);
      ctx.fillStyle = p.col(D.shade(c, -0.45));
      ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.16)';
      for (let i = 0; i < 6; i++) ctx.fillRect(-21, -24 + i * 1.6, 9, 0.5);
      poly(ctx, [[-15.5, -29.2], [15.5, -29.2], [14.6, -37], [-14.6, -37]]);
      ctx.fillStyle = p.col(D.shade(c, -0.36));
      ctx.fill();
      ctx.fillStyle = p.col('#151618');
      ctx.fillRect(-14.6, -38.2, 29.2, 1.2);
      const yb = -37.6, hw = y => lerp(10, 10.6, (y - yb) / 8.4);
      const sheet = (yf, printed) => {
        if (yf <= yb + 0.05) return;
        poly(ctx, [[-hw(yb), yb], [hw(yb), yb], [hw(yf), yf], [-hw(yf), yf]]);
        ctx.fillStyle = p.col('#f4f2ec');
        ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,0.14)';
        ctx.fillRect(-hw(yf), yf - 0.22, hw(yf) * 2, 0.22);
        if (!printed) return;
        ctx.fillStyle = p.col('#9a978f');
        for (let i = 0; i < 10; i++) {
          const ly = yf - 0.9 - i * 0.62;
          if (ly < yb + 0.3) break;
          ctx.fillRect(-hw(ly) + 1.6, ly, (hw(ly) * 2 - 3.2) * (i === 0 ? 0.45 : 0.6 + 0.35 * hash(i, 21)), 0.22);
        }
      };
      for (let i = 0; i < p.tray; i++) sheet(-29.2 - i * 0.14, true);
      for (const pg of list(p.pages)) {
        if (t < pg.at) continue;
        sheet(lerp(yb, -29.2, ease.outCubic(seg(t, pg.at, pg.dur ?? 1.6))), true);
      }
      for (const f of list(p.feed)) {
        if (t < f.at) continue;
        const stop = f.stop ?? 0.25, dur = f.dur ?? 1.6, halt = f.at + dur * stop;
        const k = Math.min(stop, seg(t, f.at, dur));
        const jit = t > halt && t < halt + 0.35 ? Math.sin(t * 80) * 0.1 : 0;
        sheet(lerp(yb, -29.2, k) + jit, false);
      }
      p.slab(ctx, 7.5, -26.6, 15, 8.4, '#2a2c30', 0.6, { k: 0.1 });
      const [led, word] = PRINTER[st.status];
      const lcd = st.status !== 'off';
      ctx.fillStyle = p.col(lcd ? (st.status === 'error' ? '#4a2a1c' : '#2b4436') : '#151617');
      ctx.fillRect(8.6, -25.6, 7.6, 4);
      if (lcd) p.write(ctx, st.lcd || word, 12.4, -23.55, { size: st.status === 'busy' && !st.lcd ? 0.85 : 1.05, font: 'mono', color: st.status === 'error' ? '#ffb48a' : '#9fe0b8' });
      const pressed = list(p.press).some(q => t >= q && t < q + 0.16);
      [[18.2, -24.4], [20.9, -24.4]].forEach(([bx, by], i) => {
        ell(ctx, bx, by + (pressed && i === 0 ? 0.12 : 0), 0.95, 0.95);
        ctx.fillStyle = p.col(pressed && i === 0 ? '#e8e4da' : '#8d9096');
        ctx.fill();
      });
      let on = !!led;
      if (st.status === 'error') on = (t * 2) % 1 < 0.55;
      if (st.status === 'busy') on = (t * 4) % 1 < 0.6;
      ell(ctx, 19.6, -20.6, 0.6, 0.6);
      ctx.fillStyle = p.col(on ? led : '#2a2c2e');
      ctx.fill();
      if (on) glow(ctx, p, 19.6, -20.6, 6, led, 0.55);
      ctx.restore();
    },
  };

  T.pc = {
    anchor: 'bottom',
    defaults: { on: true, restart: null, press: [], color: '#212428' },
    points: { power: [0, -36], top: [0, -44] },
    draw(ctx, p, t) {
      const c = p.color;
      ell(ctx, 0, 0, 11, 0.9);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fill();
      poly(ctx, [[-9.5, -42], [9.5, -42], [8.6, -44.6], [-8.6, -44.6]]);
      ctx.fillStyle = p.col(D.shade(c, 0.18));
      ctx.fill();
      p.slab(ctx, -9.5, -42, 19, 42, c, 0.5, { h: true, k: 0.1 });
      ctx.fillStyle = p.col(D.shade(c, -0.25));
      ctx.fillRect(-7.5, -30, 15, 2.4);
      ctx.fillRect(-7.5, -26.8, 15, 2.4);
      for (let i = 0; i < 9; i++) ctx.fillRect(-6, -18 + i * 1.6, 12, 0.6);
      ctx.fillStyle = p.col(D.shade(c, 0.14));
      ctx.fillRect(-9.5, -42, 0.5, 42);
      let on = p.on, blink = false;
      if (p.restart != null && t >= p.restart) {
        const dt = t - p.restart;
        on = dt >= 1.6;
        blink = dt >= 0.8 && dt < 1.6;
      }
      const pressed = list(p.press).concat(p.restart != null ? [p.restart] : []).some(q => t >= q && t < q + 0.2);
      ell(ctx, 0, -36, 1.5, 1.5);
      ctx.fillStyle = p.col(pressed ? '#5a6068' : '#33373d');
      ctx.fill();
      ctx.strokeStyle = p.col(on ? '#7fb8ff' : '#4a4f56');
      ctx.lineWidth = 0.3;
      ctx.stroke();
      const lit = on || (blink && (t * 4) % 1 < 0.5);
      ell(ctx, 0, -33, 0.45, 0.45);
      ctx.fillStyle = p.col(lit ? (blink ? 'amber' : '#7fb8ff') : '#1b2430');
      ctx.fill();
      if (lit) glow(ctx, p, 0, -33, 3.5, blink ? 'amber' : '#7fb8ff', 0.45);
    },
  };

  T.door = {
    anchor: 'bottom',
    defaults: { color: '#5d4a3c', frame: '#2c2f34', open: 0, sign: null },
    points: { handle: [31, -100], center: [0, -105] },
    draw(ctx, p, t) {
      const o = typeof p.open === 'number' ? p.open : lerp(p.open.from || 0, p.open.to ?? 1, ease.inOutCubic(seg(t, p.open.at, p.open.dur ?? 1)));
      p.slab(ctx, -50, -216, 100, 216, p.frame, 0, { h: true, k: 0.12 });
      ctx.fillStyle = p.col('#07080a');
      ctx.fillRect(-45, -211, 90, 211);
      const lw = 90 * Math.cos(o * 1.3);
      if (o > 0.02) {
        const g = ctx.createLinearGradient(-45 + lw, 0, 45, 0);
        g.addColorStop(0, UF.c(p.col('#b8c4d0'), 0));
        g.addColorStop(1, UF.c(p.col('#b8c4d0'), 0.22 * o));
        ctx.fillStyle = g;
        ctx.fillRect(-45 + lw, -211, 90 - lw, 211);
      }
      p.slab(ctx, -45, -211, lw, 211, p.color, 0, { h: true, k: 0.08 + 0.2 * o });
      ctx.strokeStyle = 'rgba(0,0,0,0.28)';
      ctx.lineWidth = 0.6;
      ctx.strokeRect(-45 + lw * 0.12, -196, lw * 0.76, 82);
      ctx.strokeRect(-45 + lw * 0.12, -100, lw * 0.76, 82);
      p.slab(ctx, -45 + lw * 0.84, -102, Math.max(1, lw * 0.11), 3, '#b9bcc0', 0.8);
      if (p.sign && o < 0.05) {
        const lines = String(p.sign).split('\n');
        p.slab(ctx, -32, -168, 64, 6 + lines.length * 4.4, '#e8e4da', 0.6);
        lines.forEach((ln, i) => p.write(ctx, ln, 0, -163.6 + i * 4.4 + (lines.length === 1 ? 0.8 : 0), { size: 3, font: 'sans', color: '#8f1d1d', spacing: 0.2 }));
      }
    },
  };

  const SKY = {
    night: { sky: ['#070c16', '#16233a'], city: '#05080e', lit: '#ffcf7a', slat: '#1b2028', frame: '#14171b' },
    dawn:  { sky: ['#5f7a96', '#c9d3d9'], city: '#47576a', lit: '#e8eef2', slat: '#a7aaa8', frame: '#3a3e44' },
    day:   { sky: ['#8fb0cc', '#e3e7e6'], city: '#7d8e9e', lit: '#eef2f4', slat: '#c9c6bd', frame: '#4a4f56' },
  };
  T.window = {
    anchor: 'center',
    defaults: { w: 150, h: 140, mode: 'night', blinds: 0.45, city: true, seed: 4 },
    points: p => ({ center: [0, 0], sill: [0, p.h / 2 + 4] }),
    init(p) { if (!SKY[p.mode]) throw new Error(`Prop window: mode is ${Object.keys(SKY).join(', ')}.`); },
    draw(ctx, p) {
      const S = SKY[p.mode], w = p.w, h = p.h, x0 = -w / 2, y0 = -h / 2, night = p.mode === 'night';
      p.slab(ctx, x0 - 6, y0 - 6, w + 12, h + 12, S.frame, 0.6);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x0, y0, w, h);
      ctx.clip();
      const g = ctx.createLinearGradient(0, y0, 0, y0 + h);
      g.addColorStop(0, p.col(S.sky[0]));
      g.addColorStop(1, p.col(S.sky[1]));
      ctx.fillStyle = g;
      ctx.fillRect(x0, y0, w, h);
      if (p.city) {
        const r = UF.rng(p.seed);
        let x = x0 - 4;
        while (x < x0 + w) {
          const bw = 10 + r() * 22, bh = h * (0.22 + r() * 0.5);
          ctx.fillStyle = p.col(D.shade(S.city, (r() - 0.5) * 0.25));
          ctx.fillRect(x, y0 + h - bh, bw, bh);
          const rows = Math.floor(bh / 4.2), cols = Math.max(1, Math.floor(bw / 4));
          for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) {
            if (r() > (night ? 0.3 : 0.14)) continue;
            ctx.fillStyle = UF.c(p.col(S.lit), night ? 0.5 + 0.45 * r() : 0.3);
            ctx.fillRect(x + 1.2 + j * 4, y0 + h - bh + 1.6 + i * 4.2, 1.6, 1.8);
          }
          x += bw + 1 + r() * 3;
        }
      }
      const gl = ctx.createLinearGradient(x0, y0, x0 + w, y0 + h);
      gl.addColorStop(0, 'rgba(255,255,255,0.06)');
      gl.addColorStop(0.5, 'rgba(255,255,255,0)');
      gl.addColorStop(0.75, 'rgba(255,255,255,0.04)');
      gl.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = gl;
      ctx.fillRect(x0, y0, w, h);
      const n = Math.round(h / 7);
      for (let i = 0; i < n; i++) {
        const sy = y0 + i * (h / n);
        if (sy > y0 + h * p.blinds) break;
        const sg = ctx.createLinearGradient(0, sy, 0, sy + 4.2);
        sg.addColorStop(0, p.col(D.shade(S.slat, 0.12)));
        sg.addColorStop(1, p.col(D.shade(S.slat, -0.2)));
        ctx.fillStyle = sg;
        ctx.fillRect(x0, sy, w, 4.2);
      }
      ctx.restore();
      ctx.fillStyle = p.col(S.frame);
      ctx.fillRect(-1.5, y0, 3, h);
      p.slab(ctx, x0 - 2, y0 - 3, w + 4, 4, D.shade(S.slat, -0.1), 0.4);
      p.slab(ctx, x0 - 10, y0 + h + 4, w + 20, 4, D.shade(S.frame, 0.25), 0.4);
      ctx.strokeStyle = p.col(D.shade(S.slat, -0.3));
      ctx.lineWidth = 0.4;
      ctx.beginPath(); ctx.moveTo(x0 + w - 8, y0); ctx.lineTo(x0 + w - 8, y0 + h * p.blinds + 18); ctx.stroke();
    },
  };

  T.fluorescent = {
    anchor: 'top',
    defaults: { length: 120, on: true, flicker: null, color: '#eef5ff' },
    draw(ctx, p, t) {
      const hw = p.length / 2;
      let lvl = p.on ? 1 : 0;
      const f = p.flicker;
      if (f && t < f.at + (f.dur ?? 1.2)) lvl = t < f.at ? 0 : hash(Math.floor((t - f.at) * 16), 7) > 0.45 ? 1 : 0.1;
      p.slab(ctx, -hw, 0, p.length, 5.5, '#bfc3c8', 0.4);
      ctx.fillStyle = p.col(D.hexMix('#7e858c', UF.theme.colors[p.color] || p.color, lvl));
      ctx.fillRect(-hw + 2.5, 5.5, p.length - 5, 2.6);
      if (lvl < 0.5) return;
      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      ctx.translate(0, 8);
      ctx.scale(1, 0.35);
      const r = hw * 1.2, g = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
      g.addColorStop(0, UF.c(p.col(p.color), 0.22 * lvl * (1 - p.dim)));
      g.addColorStop(1, UF.c(p.col(p.color), 0));
      ctx.fillStyle = g;
      ctx.fillRect(-r, -r, r * 2, r * 2);
      ctx.restore();
    },
  };

  T.folder = {
    anchor: 'center',
    defaults: { color: '#2f5d8a', label: null },
    held: { grip: [-11, 3] },
    draw(ctx, p) {
      const w = 24, h = 31;
      ctx.fillStyle = p.col('#ebe7dd');
      ctx.fillRect(-w / 2 + 1.4, -h / 2 - 0.7, w - 2.6, h);
      p.slab(ctx, -w / 2, -h / 2, w, h, p.color, 0.6, { k: 0.1 });
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(-w / 2, -h / 2, 1.6, h);
      p.slab(ctx, -6, -h / 2 + 5, 12, 4.2, '#f2efe8', 0.3);
      if (p.label) p.write(ctx, p.label, 0, -h / 2 + 7.1, { size: 1.6, font: 'mono', color: '#1d2024' });
      else { ctx.fillStyle = p.col('#9a968c'); ctx.fillRect(-4.4, -h / 2 + 6.6, 8.8, 0.7); }
    },
  };

  /* ------------------------------------------------------------------ */
  /* Bank: licences, stamps, locks, vault, models, counter               */
  /* ------------------------------------------------------------------ */
  T.idCard = {
    anchor: 'center',
    defaults: { title: "DRIVER'S LICENSE", name: null, color: '#2f6b6a', seed: 1 },
    held: { grip: [-3.4, 0.6] },
    draw(ctx, p) {
      const w = 8.56, h = 5.4, x0 = -w / 2, y0 = -h / 2, r = UF.rng(p.seed);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      D.roundRect(ctx, x0 + 0.08, y0 + 0.12, w, h, 0.32);
      ctx.fill();
      ctx.save();
      D.roundRect(ctx, x0, y0, w, h, 0.32);
      ctx.clip();
      const g = ctx.createLinearGradient(x0, y0, x0 + w, y0 + h);
      g.addColorStop(0, p.col('#eef0ea'));
      g.addColorStop(1, p.col('#d6dad2'));
      ctx.fillStyle = g;
      ctx.fillRect(x0, y0, w, h);
      ctx.strokeStyle = UF.c(p.col(p.color), 0.14);
      ctx.lineWidth = 0.03;
      for (let i = 0; i < 9; i++) {
        ctx.beginPath();
        for (let k = 0; k <= 40; k++) {
          const xx = x0 + k * w / 40, yy = y0 + 1.5 + i * 0.45 + Math.sin(k * 0.5 + i) * 0.18;
          if (k) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy);
        }
        ctx.stroke();
      }
      ctx.fillStyle = p.col(p.color);
      ctx.fillRect(x0, y0, w, 1.05);
      p.write(ctx, p.title, x0 + 0.38, y0 + 0.55, { size: 0.46, font: 'sans', color: '#f4f1ea', align: 'left', spacing: 0.03 });
      const px = x0 + 0.38, py = y0 + 1.38, pw = 2.25, ph = 2.85;
      ctx.fillStyle = p.col('#b8c3ca');
      ctx.fillRect(px, py, pw, ph);
      ctx.fillStyle = p.col('#7b8892');
      ell(ctx, px + pw / 2, py + 1.08, 0.62, 0.74);
      ctx.fill();
      ctx.beginPath(); ctx.moveTo(px + 0.15, py + ph); ctx.quadraticCurveTo(px + pw / 2, py + 1.45, px + pw - 0.15, py + ph); ctx.fill();
      const fx0 = x0 + 3.0;
      const field = (label, yy, wv, txt) => {
        p.write(ctx, label, fx0, yy, { size: 0.24, font: 'sans', color: '#6a6f76', align: 'left', weight: '600' });
        if (txt) p.write(ctx, txt, fx0, yy + 0.44, { size: 0.4, font: 'sans', color: '#1d2024', align: 'left' });
        else { ctx.fillStyle = p.col('#3a3f46'); ctx.fillRect(fx0, yy + 0.27, wv, 0.3); }
      };
      field('NAME', y0 + 1.45, 3.2 + 1.2 * r(), p.name);
      field('DATE OF BIRTH', y0 + 2.35, 1.8 + 0.6 * r());
      field('ADDRESS', y0 + 3.25, 3.4 + 1.0 * r());
      field('LICENSE NO.', y0 + 4.15, 2.4 + 0.8 * r());
      ctx.strokeStyle = p.col('#26324a');
      ctx.lineWidth = 0.05;
      ctx.beginPath();
      const ph0 = r() * 2;
      for (let k = 0; k <= 24; k++) {
        const xx = px + 0.2 + k * 0.08, yy = y0 + h - 0.45 + Math.sin(k * 0.9 + ph0) * 0.13;
        if (k) ctx.lineTo(xx, yy); else ctx.moveTo(xx, yy);
      }
      ctx.stroke();
      const hg = ctx.createLinearGradient(x0 + w - 1.6, y0 + h - 1.6, x0 + w - 0.4, y0 + h - 0.4);
      hg.addColorStop(0, 'rgba(160,220,255,0.4)');
      hg.addColorStop(0.5, 'rgba(255,190,240,0.35)');
      hg.addColorStop(1, 'rgba(200,255,190,0.4)');
      ell(ctx, x0 + w - 1.0, y0 + h - 1.0, 0.6, 0.6);
      ctx.fillStyle = hg;
      ctx.fill();
      ctx.restore();
      ctx.strokeStyle = 'rgba(0,0,0,0.25)';
      ctx.lineWidth = 0.04;
      D.roundRect(ctx, x0, y0, w, h, 0.32);
      ctx.stroke();
    },
  };

  T.rubberStamp = {
    anchor: 'center',
    defaults: { view: 'top', color: '#6e4a2e', ink: 'red' },
    init(p) { if (!['top', 'side'].includes(p.view)) throw new Error('Prop rubberStamp: view is top or side.'); },
    draw(ctx, p) {
      const wood = p.color;
      if (p.view === 'side') {
        p.slab(ctx, -4.6, -0.6, 9.2, 0.6, p.ink, 0.1);
        p.slab(ctx, -4.4, -2.4, 8.8, 1.8, wood, 0.3);
        p.slab(ctx, -0.8, -5.2, 1.6, 2.8, D.shade(wood, -0.1), 0.2, { h: true });
        ell(ctx, 0, -6.4, 2, 1.6);
        const g = ctx.createRadialGradient(-0.6, -7, 0.2, 0, -6.4, 2);
        g.addColorStop(0, p.col(D.shade(wood, 0.35)));
        g.addColorStop(1, p.col(D.shade(wood, -0.25)));
        ctx.fillStyle = g;
        ctx.fill();
        return;
      }
      const lift = p.cur ? clamp((p.cur.size / p.size - 1) * 2.5) : 0;
      if (lift > 0) {
        ctx.save();
        ctx.globalAlpha *= 0.4 * (1 - lift * 0.5);
        D.roundRect(ctx, -4.6 + lift * 2.4, -2.5 + lift * 3.2, 9.2, 5, 0.7);
        ctx.fillStyle = '#000';
        ctx.fill();
        ctx.restore();
      }
      p.slab(ctx, -4.6, -2.5, 9.2, 5, wood, 0.7, { k: 0.18 });
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 0.12;
      D.roundRect(ctx, -4.6, -2.5, 9.2, 5, 0.7);
      ctx.stroke();
      ell(ctx, 0.25, 0.35, 2.1, 2.1);
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fill();
      ell(ctx, 0, 0, 2.1, 2.1);
      const g = ctx.createRadialGradient(-0.7, -0.8, 0.2, 0, 0, 2.1);
      g.addColorStop(0, p.col(D.shade(wood, 0.35)));
      g.addColorStop(1, p.col(D.shade(wood, -0.25)));
      ctx.fillStyle = g;
      ctx.fill();
    },
  };

  T.padlock = {
    anchor: 'center',
    defaults: { snap: null, color: '#c9a54a', kick: null },
    draw(ctx, p, t, fx) {
      if (fx && p.kick && p.snap != null) fx.kick(t, p.snap, p.kick);
      padlock(ctx, p, t, p.snap, p.color);
    },
  };

  T.vault = {
    anchor: 'bottom',
    defaults: { open: null, spin: null, color: '#8a9098', frame: '#3b4148' },
    points: { door: [0, -66], inside: [0, -66], top: [0, -132] },
    draw(ctx, p, t) {
      const R = 44, cy = -66;
      p.slab(ctx, -62, -132, 124, 132, p.frame, 2, { k: 0.12 });
      ctx.fillStyle = p.col(D.shade(p.frame, 0.22));
      for (const [bx, by] of [[-55, -125], [55, -125], [-55, -7], [55, -7]]) { ell(ctx, bx, by, 2, 2); ctx.fill(); }
      ell(ctx, 0, cy, R + 8, R + 8);
      const rg = ctx.createRadialGradient(0, cy, R, 0, cy, R + 8);
      rg.addColorStop(0, p.col('#121519'));
      rg.addColorStop(1, p.col(D.shade(p.frame, 0.2)));
      ctx.fillStyle = rg;
      ctx.fill();
      const o = p.open ? ease.inOutCubic(seg(t, p.open.at, p.open.dur ?? 1.8)) : 0;
      if (o > 0) {
        ell(ctx, 0, cy, R, R);
        ctx.fillStyle = p.col('#0b0c0e');
        ctx.fill();
        ctx.save();
        ell(ctx, 0, cy, R, R);
        ctx.clip();
        ctx.fillStyle = p.col('#1d2024');
        ctx.fillRect(-R, cy - 4, R * 2, 2);
        ctx.fillRect(-R, cy + 22, R * 2, 2);
        for (let i = 0; i < 6; i++) {
          p.slab(ctx, -30 + i * 10.4, cy - 15, 9, 11, '#5f7d57', 0.6, { k: 0.2 });
          ctx.fillStyle = p.col('#e2dccb');
          ctx.fillRect(-30 + i * 10.4, cy - 11, 9, 2);
        }
        const bar = (x, y) => {
          poly(ctx, [[x - 6, y], [x + 6, y], [x + 4.5, y - 4.6], [x - 4.5, y - 4.6]]);
          const bg = ctx.createLinearGradient(0, y - 4.6, 0, y);
          bg.addColorStop(0, p.col('#f2cf6a'));
          bg.addColorStop(1, p.col('#a87b22'));
          ctx.fillStyle = bg;
          ctx.fill();
        };
        for (let i = 0; i < 4; i++) bar(-19.5 + i * 13, cy + 22);
        for (let i = 0; i < 3; i++) bar(-13 + i * 13, cy + 17.4);
        for (let i = 0; i < 2; i++) bar(-6.5 + i * 13, cy + 12.8);
        ctx.restore();
        glow(ctx, p, 0, cy + 6, R * 1.6, '#f2cf6a', 0.28 * o);
      }
      const ang = o * 1.35, sx = Math.cos(ang);
      ctx.save();
      ctx.translate(-R, cy);
      ctx.scale(sx, 1);
      ell(ctx, R, 0, R, R);
      const dg = ctx.createRadialGradient(R - 14, -16, 4, R, 0, R);
      dg.addColorStop(0, p.col(D.shade(p.color, 0.3)));
      dg.addColorStop(1, p.col(D.shade(p.color, -0.35)));
      ctx.fillStyle = dg;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,0.35)';
      ctx.lineWidth = 1;
      for (const k of [0.82, 0.56]) { ell(ctx, R, 0, R * k, R * k); ctx.stroke(); }
      ctx.fillStyle = p.col(D.shade(p.color, 0.15));
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * TAU;
        ell(ctx, R + Math.cos(a) * R * 0.91, Math.sin(a) * R * 0.91, 1.8, 1.8);
        ctx.fill();
      }
      const spin = p.spin ? ease.inOutCubic(seg(t, p.spin.at, p.spin.dur ?? 1.2)) * TAU * 0.75 : 0;
      ctx.save();
      ctx.translate(R, 0);
      ctx.rotate(spin);
      ctx.strokeStyle = p.col('#c9ccd0');
      ctx.lineWidth = 2.6;
      ctx.lineCap = 'round';
      for (let i = 0; i < 3; i++) {
        const a = (i / 3) * TAU;
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(Math.cos(a) * R * 0.42, Math.sin(a) * R * 0.42); ctx.stroke();
        ell(ctx, Math.cos(a) * R * 0.42, Math.sin(a) * R * 0.42, 2.6, 2.6);
        ctx.fillStyle = p.col('#dfe2e5');
        ctx.fill();
      }
      ell(ctx, 0, 0, 6, 6);
      ctx.fillStyle = p.col('#aeb3b8');
      ctx.fill();
      ctx.restore();
      ctx.restore();
      if (o > 0) {
        const ex = -R + 2 * R * sx, th = 9 * Math.sin(ang);
        const eg = ctx.createLinearGradient(ex, 0, ex + th, 0);
        eg.addColorStop(0, p.col(D.shade(p.color, -0.2)));
        eg.addColorStop(1, p.col(D.shade(p.color, -0.5)));
        ctx.fillStyle = eg;
        ctx.beginPath();
        ctx.ellipse(ex + th / 2, cy, Math.max(0.1, th / 2), R, 0, 0, TAU);
        ctx.fill();
      }
      p.slab(ctx, -R - 9, cy - 26, 7, 12, '#2a2e33', 1, { h: true });
      p.slab(ctx, -R - 9, cy + 14, 7, 12, '#2a2e33', 1, { h: true });
    },
  };

  T.plinth = {
    anchor: 'bottom',
    defaults: { w: 90, h: 28, label: null, sub: null, color: '#1d2026' },
    points: p => ({ top: [0, -p.h - 2.5] }),
    draw(ctx, p) {
      const w = p.w, h = p.h;
      poly(ctx, [[-w / 2, -h], [w / 2, -h], [w / 2 - 4, -h - 5], [-w / 2 + 4, -h - 5]]);
      ctx.fillStyle = p.col(D.shade(p.color, 0.22));
      ctx.fill();
      p.slab(ctx, -w / 2, -h, w, h, p.color, 0, { k: 0.1 });
      if (!p.label) return;
      const ph = p.sub ? h * 0.5 : h * 0.4;
      p.slab(ctx, -w * 0.4, -h * 0.5 - ph / 2, w * 0.8, ph, '#c9b27a', 0.6, { k: 0.2 });
      p.write(ctx, p.label, 0, -h * 0.5 - (p.sub ? ph * 0.17 : 0), { size: h * 0.16, font: 'sans', color: '#1d1a12', spacing: h * 0.012 });
      if (p.sub) p.write(ctx, p.sub, 0, -h * 0.5 + ph * 0.25, { size: h * 0.085, font: 'sans', color: '#3a3324', weight: '600', spacing: h * 0.006 });
    },
  };

  T.bankModel = {
    anchor: 'bottom',
    defaults: { color: '#d8d2c4', lit: true },
    points: { door: [0, -12], top: [0, -64], roof: [0, -52] },
    draw(ctx, p) {
      const c = p.color;
      for (let i = 0; i < 3; i++) p.slab(ctx, -40 + i * 2.5, -3 - i * 3, 80 - i * 5, 3, D.shade(c, -0.06 * i), 0, { k: 0.15 });
      p.slab(ctx, -33, -44, 66, 35, D.shade(c, -0.3), 0);
      if (p.lit) {
        const dg = ctx.createLinearGradient(0, -27, 0, -9);
        dg.addColorStop(0, p.col('#ffd9a0'));
        dg.addColorStop(1, p.col('#b8732e'));
        ctx.fillStyle = dg;
        ctx.fillRect(-4.5, -27, 9, 18);
        for (const x of [-21, 21]) { ctx.fillStyle = UF.c(p.col('#ffd9a0'), 0.7); ctx.fillRect(x - 3, -34, 6, 9); }
        glow(ctx, p, 0, -16, 26, '#ffd9a0', 0.2);
      }
      for (let i = 0; i < 6; i++) {
        const x = -30 + i * 12;
        p.slab(ctx, x - 2.3, -44, 4.6, 35, c, 0, { h: true, k: 0.28 });
        p.slab(ctx, x - 3.2, -46, 6.4, 2.2, D.shade(c, 0.08), 0);
        p.slab(ctx, x - 3.2, -10.5, 6.4, 1.6, D.shade(c, -0.05), 0);
      }
      p.slab(ctx, -37, -52, 74, 6.5, c, 0, { k: 0.12 });
      ctx.fillStyle = 'rgba(0,0,0,0.18)';
      ctx.fillRect(-37, -47.2, 74, 1.2);
      poly(ctx, [[-39, -52], [39, -52], [0, -65]]);
      const pg = ctx.createLinearGradient(0, -65, 0, -52);
      pg.addColorStop(0, p.col(D.shade(c, 0.12)));
      pg.addColorStop(1, p.col(D.shade(c, -0.08)));
      ctx.fillStyle = pg;
      ctx.fill();
      poly(ctx, [[-31, -53.6], [31, -53.6], [0, -62.4]]);
      ctx.fillStyle = p.col(D.shade(c, -0.18));
      ctx.fill();
    },
  };

  T.counter = {
    anchor: 'bottom',
    defaults: { depth: 70, height: 105, glass: 58, color: '#5b4a3b', top: '#d3cab9' },
    points: p => ({ top: [-p.depth / 2 + 6, -p.height - 4], window: [-2, -p.height - 12] }),
    draw(ctx, p) {
      const d = p.depth, H = p.height, x0 = -d / 2;
      p.slab(ctx, x0, -H, d, H, p.color, 0, { h: true, k: 0.12 });
      ctx.fillStyle = 'rgba(0,0,0,0.25)';
      ctx.fillRect(x0, -12, d, 12);
      ctx.fillStyle = p.col(D.shade(p.color, 0.18));
      ctx.fillRect(x0, -H, 1.2, H);
      p.slab(ctx, x0 - 8, -H - 4, d + 10, 4, p.top, 0.6);
      const gy = -H - 20, gh = p.glass;
      ctx.fillStyle = p.col('#8a8f96');
      ctx.fillRect(-2.4, gy, 1.2, 16);
      ctx.fillStyle = UF.c(p.col('#bcd3e0'), 0.24);
      ctx.fillRect(-3, gy - gh, 2.4, gh);
      ctx.fillStyle = 'rgba(255,255,255,0.35)';
      ctx.fillRect(-2.6, gy - gh, 0.5, gh);
      p.slab(ctx, -3.6, gy - gh - 2, 3.6, 2, '#8a8f96', 0.3);
      p.slab(ctx, -3.6, gy, 3.6, 1.6, '#8a8f96', 0.3);
    },
  };

  T.stanchion = {
    anchor: 'bottom',
    defaults: { posts: 4, gap: 120, rope: '#7a1d24', color: '#b9a46a' },
    points: p => ({ start: [0, -95], end: [(p.posts - 1) * p.gap, -95] }),
    draw(ctx, p) {
      ctx.lineCap = 'round';
      for (let i = 0; i < p.posts - 1; i++) {
        const x0 = i * p.gap, x1 = x0 + p.gap;
        ctx.strokeStyle = p.col(D.shade(p.rope, -0.3));
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(x0, -88); ctx.quadraticCurveTo((x0 + x1) / 2, -70, x1, -88); ctx.stroke();
        ctx.strokeStyle = p.col(p.rope);
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x0, -88.6); ctx.quadraticCurveTo((x0 + x1) / 2, -70.6, x1, -88.6); ctx.stroke();
      }
      for (let i = 0; i < p.posts; i++) {
        const x = i * p.gap;
        ell(ctx, x, -1.6, 14, 3);
        ctx.fillStyle = p.col(D.shade(p.color, -0.3));
        ctx.fill();
        p.slab(ctx, x - 1.7, -94, 3.4, 92, p.color, 0, { h: true, k: 0.35 });
        ell(ctx, x, -95, 2.6, 2.2);
        ctx.fillStyle = p.col(D.shade(p.color, 0.25));
        ctx.fill();
      }
    },
  };

  T.calendar = {
    anchor: 'center',
    defaults: { month: 'MAY', day: 15, year: 2015, color: '#c1121f' },
    draw(ctx, p) {
      const w = 26, h = 32;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(-w / 2 + 0.6, -h / 2 + 0.8, w, h);
      ctx.fillStyle = p.col('#f2efe8');
      ctx.fillRect(-w / 2, -h / 2, w, h);
      ctx.fillStyle = p.col(p.color);
      ctx.fillRect(-w / 2, -h / 2, w, 8);
      p.write(ctx, `${p.month} ${p.year}`, 0, -h / 2 + 4.3, { size: 3, font: 'sans', color: '#f4f1ea', spacing: 0.3 });
      p.write(ctx, String(p.day), 0, 3.5, { size: 15, font: 'display', color: '#1d2024' });
      for (const s of [-1, 1]) { ell(ctx, s * 7, -h / 2, 1, 1); ctx.fillStyle = p.col('#3a3f46'); ctx.fill(); }
    },
  };

  T.plaque = {
    anchor: 'center',
    defaults: { text: 'BANK', sub: null, w: 120, h: 34, color: '#1d2a3a', ink: '#e8e4da', lit: false, font: 'display' },
    draw(ctx, p) {
      const w = p.w, h = p.h;
      if (p.lit) glow(ctx, p, 0, 0, w * 0.75, p.ink, 0.16);
      p.slab(ctx, -w / 2, -h / 2, w, h, p.color, Math.min(w, h) * 0.06, { k: 0.12 });
      const size = p.sub ? h * 0.45 : h * 0.58;
      p.write(ctx, p.text, 0, p.sub ? -h * 0.1 : h * 0.02, { size, font: p.font, color: p.ink, spacing: size * 0.08 });
      if (p.sub) p.write(ctx, p.sub, 0, h * 0.3, { size: h * 0.16, font: 'sans', color: p.ink, spacing: h * 0.02 });
    },
  };

  T.plant = {
    anchor: 'bottom',
    defaults: { height: 110, pot: '#6b5d52', leaf: '#3c6b46' },
    draw(ctx, p, t) {
      const H = p.height, n = 9;
      for (let i = 0; i < n; i++) {
        const a = (i - (n - 1) / 2) * 0.27 + Math.sin(t * 0.8 + i) * 0.015;
        const len = (H - 30) * (0.6 + 0.4 * hash(i, 71));
        ctx.save();
        ctx.translate(0, -30);
        ctx.rotate(a);
        ell(ctx, 0, -len / 2, len * 0.085, len / 2);
        ctx.fillStyle = p.col(D.shade(p.leaf, (hash(i, 72) - 0.5) * 0.4));
        ctx.fill();
        ctx.restore();
      }
      poly(ctx, [[-14, -32], [14, -32], [11, 0], [-11, 0]]);
      const g = ctx.createLinearGradient(-14, 0, 14, 0);
      g.addColorStop(0, p.col(D.shade(p.pot, 0.15)));
      g.addColorStop(1, p.col(D.shade(p.pot, -0.35)));
      ctx.fillStyle = g;
      ctx.fill();
      p.slab(ctx, -15, -34, 30, 4, D.shade(p.pot, 0.1), 0.6);
    },
  };

  /* ------------------------------------------------------------------ */
  /* Casino                                                              */
  /* ------------------------------------------------------------------ */
  const CHIPS = { red: ['#c0262f', '#7c161c'], black: ['#2a2d32', '#111215'], amber: ['#d29a34', '#8e6420'], white: ['#ebe6da', '#a8a295'], green: ['#2f7d4f', '#1b4a2f'], blue: ['#2f5d8a', '#1b3653'] };
  /** Stack of n chips standing on (0, 0), 2 cm in radius; tilt is how far the camera looks down (0..1). */
  function chipStack(ctx, p, n, color, tilt) {
    const face = p.col(CHIPS[color][0]), side = p.col(CHIPS[color][1]);
    const rx = 2, ry = rx * tilt, hh = 0.378, s = rx / 74;
    const mark = color === 'white' ? 'rgba(170,32,40,.9)' : 'rgba(255,255,255,.72)';
    const shade = ctx.createLinearGradient(-rx, 0, rx, 0);
    shade.addColorStop(0, 'rgba(0,0,0,.45)');
    shade.addColorStop(0.35, 'rgba(0,0,0,0)');
    shade.addColorStop(0.75, 'rgba(0,0,0,.1)');
    shade.addColorStop(1, 'rgba(0,0,0,.5)');
    const band = cy => {
      ctx.beginPath();
      ctx.ellipse(0, cy, rx, ry, 0, 0, Math.PI);
      ctx.lineTo(-rx, cy - hh);
      ctx.ellipse(0, cy - hh, rx, ry, 0, Math.PI, 0, true);
      ctx.closePath();
    };
    for (let i = 0; i < n; i++) {
      const cy = -i * hh;
      band(cy);
      ctx.fillStyle = side;
      ctx.fill();
      ctx.fillStyle = mark;
      const turn = (i * 0.83) % 1.1;
      for (let k = 0; k < 5; k++) {
        const a0 = 0.25 + turn * 0.5 + k * 0.62, a1 = a0 + 0.17;
        if (a1 > Math.PI - 0.08) continue;
        ctx.beginPath();
        ctx.moveTo(rx * Math.cos(a0), cy - hh + ry * Math.sin(a0) + 3 * s);
        ctx.lineTo(rx * Math.cos(a1), cy - hh + ry * Math.sin(a1) + 3 * s);
        ctx.lineTo(rx * Math.cos(a1), cy + ry * Math.sin(a1) - 3 * s);
        ctx.lineTo(rx * Math.cos(a0), cy + ry * Math.sin(a0) - 3 * s);
        ctx.closePath();
        ctx.fill();
      }
      band(cy);
      ctx.fillStyle = shade;
      ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.4)';
      ctx.lineWidth = 1.5 * s;
      ctx.beginPath(); ctx.ellipse(0, cy - hh, rx, ry, 0, 0, Math.PI); ctx.stroke();
    }
    const ty = -n * hh;
    ctx.fillStyle = face;
    ctx.beginPath(); ctx.ellipse(0, ty, rx, ry, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,.22)';
    ctx.lineWidth = 1.5 * s;
    ctx.stroke();
    ctx.strokeStyle = mark;
    ctx.lineWidth = 3 * s;
    ctx.setLineDash([10 * s, 9 * s]);
    ctx.beginPath(); ctx.ellipse(0, ty, rx * 0.84, ry * 0.84, 0, 0, TAU); ctx.stroke();
    ctx.setLineDash([]);
    ctx.lineWidth = 2 * s;
    ctx.beginPath(); ctx.ellipse(0, ty, rx * 0.52, ry * 0.52, 0, 0, TAU); ctx.stroke();
  }

  T.chips = {
    anchor: 'bottom',
    defaults: { count: 5, color: 'red', tilt: 0.34, lean: 0 },
    points: p => ({ top: [0, -p.count * 0.378] }),
    init(p) { if (!CHIPS[p.color]) throw new Error(`Prop chips: color is ${Object.keys(CHIPS).join(', ')}.`); },
    draw(ctx, p) {
      if (p.lean) ctx.rotate(p.lean);
      ell(ctx, 0.2, 0.15, 2.2, 2 * p.tilt * 1.1 + 0.1);
      ctx.fillStyle = 'rgba(0,0,0,0.35)';
      ctx.fill();
      chipStack(ctx, p, p.count, p.color, p.tilt);
    },
  };

  const SUITS = { heart: ['\u2665', '#c1121f'], diamond: ['\u2666', '#c1121f'], club: ['\u2663', '#15171a'], spade: ['\u2660', '#15171a'] };
  T.playingCard = {
    anchor: 'center',
    defaults: { face: 'down', rank: '9', suit: 'heart', back: '#7a1d24' },
    held: { grip: [-2.4, 2.4] },
    init(p) { if (!SUITS[p.suit]) throw new Error(`Prop playingCard: suit is ${Object.keys(SUITS).join(', ')}.`); },
    draw(ctx, p) {
      const w = 6.3, h = 8.8;
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      D.roundRect(ctx, -w / 2 + 0.15, -h / 2 + 0.2, w, h, 0.45);
      ctx.fill();
      D.roundRect(ctx, -w / 2, -h / 2, w, h, 0.45);
      ctx.fillStyle = p.col('#f5f2ea');
      ctx.fill();
      if (p.face === 'down') {
        ctx.save();
        D.roundRect(ctx, -w / 2 + 0.4, -h / 2 + 0.4, w - 0.8, h - 0.8, 0.3);
        ctx.fillStyle = p.col(p.back);
        ctx.fill();
        ctx.clip();
        ctx.strokeStyle = 'rgba(255,255,255,0.28)';
        ctx.lineWidth = 0.08;
        for (let i = -12; i < 12; i++) {
          ctx.beginPath(); ctx.moveTo(i * 0.8, -h / 2); ctx.lineTo(i * 0.8 + h, h / 2); ctx.moveTo(i * 0.8 + h, -h / 2); ctx.lineTo(i * 0.8, h / 2); ctx.stroke();
        }
        ctx.restore();
        return;
      }
      const [sym, col] = SUITS[p.suit];
      p.write(ctx, p.rank, -w / 2 + 0.95, -h / 2 + 1.1, { size: 1.3, font: 'serif', color: col });
      p.write(ctx, sym, -w / 2 + 0.95, -h / 2 + 2.3, { size: 1.1, font: 'sans', color: col });
      p.write(ctx, sym, 0, 0.4, { size: 3.6, font: 'sans', color: col });
    },
  };

  /** Felt seen from a low camera: near edge on y = 0, far edge 90 cm up, printed PLAYER / BANKER / TIE boxes. */
  function feltTop(ctx, p) {
    const near = 150, far = 96, depth = 90;
    const X = (u, v) => [u * lerp(near, far, v), -v * depth];
    poly(ctx, [X(-1, 0), X(1, 0), X(1, 1), X(-1, 1)]);
    const g = ctx.createLinearGradient(0, -depth, 0, 0);
    g.addColorStop(0, p.col(D.shade(p.felt, -0.4)));
    g.addColorStop(1, p.col(D.shade(p.felt, 0.06)));
    ctx.fillStyle = g;
    ctx.fill();
    const gold = p.col('#c9a54a');
    ctx.strokeStyle = UF.c(gold, 0.7);
    ctx.lineWidth = 0.55;
    const box = (v0, v1, label) => {
      poly(ctx, [X(-0.64, v0), X(0.64, v0), X(0.64, v1), X(-0.64, v1)]);
      ctx.stroke();
      const [, y0] = X(0, v0), [, y1] = X(0, v1);
      ctx.save();
      ctx.translate(0, (y0 + y1) / 2);
      ctx.scale(1, 0.55);
      p.write(ctx, label, 0, 0, { size: 7.5 * lerp(1, far / near, (v0 + v1) / 2), font: 'serif', color: UF.c(gold, 0.85), spacing: 1.2 });
      ctx.restore();
    };
    box(0.08, 0.32, 'PLAYER');
    box(0.38, 0.6, 'BANKER');
    box(0.66, 0.84, 'TIE');
    p.slab(ctx, -far - 14, -depth - 12, (far + 14) * 2, 12, p.rail, 6, { k: 0.3 });
  }

  T.baccaratTable = {
    anchor: 'bottom',
    defaults: { view: 'side', length: 260, felt: '#1f5c3e', rail: '#2a1a14', wood: '#4a2c1e' },
    points: p => (p.view === 'top'
      ? { player: [0, -18], banker: [0, -44], tie: [0, -68], center: [0, -45] }
      : { top: [0, -84], left: [-p.length / 2 + 26, -84], right: [p.length / 2 - 26, -84] }),
    init(p) { if (!['side', 'top'].includes(p.view)) throw new Error('Prop baccaratTable: view is side or top.'); },
    draw(ctx, p) {
      if (p.view === 'top') { feltTop(ctx, p); return; }
      const L = p.length, hw = L / 2;
      p.slab(ctx, -14, -62, 28, 56, D.shade(p.wood, -0.25), 0, { h: true });
      p.slab(ctx, -46, -7, 92, 6, D.shade(p.wood, -0.1), 3);
      poly(ctx, [[-hw + 14, -80], [hw - 14, -80], [hw - 26, -90], [-hw + 26, -90]]);
      const g = ctx.createLinearGradient(0, -90, 0, -80);
      g.addColorStop(0, p.col(D.shade(p.felt, -0.3)));
      g.addColorStop(1, p.col(D.shade(p.felt, 0.08)));
      ctx.fillStyle = g;
      ctx.fill();
      p.slab(ctx, -hw + 10, -73, L - 20, 12, p.wood, 2, { k: 0.18 });
      p.slab(ctx, -hw, -81.5, L, 9.5, p.rail, 4.7, { k: 0.3 });
      ctx.fillStyle = 'rgba(255,255,255,0.08)';
      ctx.fillRect(-hw + 5, -80.6, L - 10, 1);
    },
  };

  T.pendant = {
    anchor: 'top',
    defaults: { drop: 60, reach: 170, spread: 0.5, color: '#ffd59a', on: true, alpha: 0.2, shade: '#17191c' },
    points: p => ({ lamp: [0, p.drop + 12], pool: [0, p.drop + 12 + p.reach] }),
    draw(ctx, p) {
      const y0 = p.drop + 12;
      if (p.on) {
        const hw = Math.tan(p.spread) * p.reach;
        ctx.save();
        ctx.globalCompositeOperation = 'lighter';
        for (const [wk, ak] of [[1.35, 0.45], [1, 1]]) {
          const g = ctx.createLinearGradient(0, y0, 0, y0 + p.reach);
          g.addColorStop(0, UF.c(p.col(p.color), p.alpha * ak * (1 - p.dim)));
          g.addColorStop(1, UF.c(p.col(p.color), 0));
          ctx.fillStyle = g;
          poly(ctx, [[-13, y0], [13, y0], [hw * wk, y0 + p.reach], [-hw * wk, y0 + p.reach]]);
          ctx.fill();
        }
        ctx.translate(0, y0 + p.reach);
        ctx.scale(1, 0.2);
        const r = hw * 1.15, pg = ctx.createRadialGradient(0, 0, 0, 0, 0, r);
        pg.addColorStop(0, UF.c(p.col(p.color), p.alpha * 1.1 * (1 - p.dim)));
        pg.addColorStop(1, UF.c(p.col(p.color), 0));
        ctx.fillStyle = pg;
        ctx.fillRect(-r, -r, r * 2, r * 2);
        ctx.restore();
      }
      ctx.strokeStyle = p.col('#2a2c30');
      ctx.lineWidth = 0.7;
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, p.drop); ctx.stroke();
      poly(ctx, [[-14, y0], [14, y0], [6, p.drop], [-6, p.drop]]);
      const sg = ctx.createLinearGradient(-14, 0, 14, 0);
      sg.addColorStop(0, p.col(D.shade(p.shade, 0.35)));
      sg.addColorStop(0.4, p.col(D.shade(p.shade, 0.1)));
      sg.addColorStop(1, p.col(D.shade(p.shade, -0.3)));
      ctx.fillStyle = sg;
      ctx.fill();
      if (p.on) {
        ell(ctx, 0, y0, 13, 1.8);
        ctx.fillStyle = p.col('#fff1d0');
        ctx.fill();
      }
    },
  };

  /* ------------------------------------------------------------------ */
  /* Component                                                           */
  /* ------------------------------------------------------------------ */
  const COMMON = { type: null, x: 960, y: 900, scale: 2.6, size: 1, flip: false, rotate: 0, dim: 0, moves: [] };
  class Prop extends UF.Component {
    constructor(o = {}) {
      const def = T[o.type];
      if (!def) throw new Error(`Prop: unknown type "${o.type}" — use ${Object.keys(T).join(', ')}.`);
      // A type default with a common option's name would replace it for every prop of that type.
      for (const k in def.defaults || {}) if (k in COMMON) throw new Error(`Prop type "${o.type}": default \`${k}\` clashes with the common Prop option of that name.`);
      super(Object.assign({}, COMMON, def.defaults), o);
      this.def = def;
      this.moves = [...list(this.moves)].sort((p, q) => p.at - q.at);
      for (const m of this.moves) {
        if (typeof m.at !== 'number') throw new Error(`Prop ${this.type}: every move needs a number \`at\`.`);
        if (m.to && !(Array.isArray(m.to) && m.to.length === 2)) throw new Error(`Prop ${this.type}: a move's \`to\` is [x, y].`);
      }
      if (def.init) def.init(this);
    }

    /**
     * Position, rotation and size at time t. Each move { at, dur, to: [x, y], rotate, size, arc, ease }
     * glides from wherever the prop is when it starts; `arc` lifts the path by that many pixels mid-way.
     */
    posAt(t) {
      let s = { x: this.x, y: this.y, rotate: this.rotate, size: this.size };
      if (t == null) return s;
      for (const m of this.moves) {
        if (t < m.at) break;
        const k = UF.easeFn(m.ease || 'inOutCubic')(seg(t, m.at, m.dur ?? 0.8));
        const to = m.to || [s.x, s.y];
        s = {
          x: lerp(s.x, to[0], k),
          y: lerp(s.y, to[1], k) - (m.arc || 0) * 4 * k * (1 - k),
          rotate: m.rotate != null ? lerp(s.rotate, m.rotate, k) : s.rotate,
          size: m.size != null ? lerp(s.size, m.size, k) : s.size,
        };
      }
      return s;
    }

    /** World position of a named point on the prop, e.g. atm.point('slot'); pass t to follow its moves. */
    point(name, t) {
      const pts = typeof this.def.points === 'function' ? this.def.points(this) : this.def.points || {};
      const v = pts[name];
      if (!v) throw new Error(`Prop ${this.type}: no point "${name}" — use ${Object.keys(pts).join(', ') || 'none defined'}.`);
      const s = this.posAt(t);
      const k = this.scale * s.size, x = v[0] * (this.flip ? -1 : 1), y = v[1];
      const c = Math.cos(s.rotate), sn = Math.sin(s.rotate);
      return [s.x + (x * c - y * sn) * k, s.y + (x * sn + y * c) * k];
    }

    /** Colour with the prop's dimming applied. */
    col(color) {
      const hex = UF.theme.colors[color] || color;
      if (!this.dim || !/^#[0-9a-f]{6}$/i.test(hex)) return hex;
      return D.hexMix(hex, '#07080a', this.dim);
    }

    /** Rectangle with a soft top-lit (or left-lit with o.h) gradient. */
    slab(ctx, x, y, w, h, color, r = 0, o = {}) {
      const base = this.col(color), k = o.k ?? 0.14;
      const g = o.h ? ctx.createLinearGradient(x, 0, x + w, 0) : ctx.createLinearGradient(0, y, 0, y + h);
      g.addColorStop(0, D.shade(base, k));
      g.addColorStop(1, D.shade(base, -k * 1.4));
      ctx.fillStyle = g;
      if (r > 0) { D.roundRect(ctx, x, y, w, h, r); ctx.fill(); } else ctx.fillRect(x, y, w, h);
    }

    /** Text in prop units that stays readable when the prop, or the hand holding it, is mirrored. */
    write(ctx, text, x, y, o = {}) {
      ctx.save();
      ctx.translate(x, y);
      const m = ctx.getTransform();
      if (m.a * m.d - m.b * m.c < 0) ctx.scale(-1, 1);
      const face = o.font || 'sans', size = o.size || 3;
      ctx.font = face === 'display' ? UF.font.display(size) : UF.font[face](size, o.weight || 'bold');
      const color = typeof o.color === 'string' && o.color.startsWith('rgba') ? o.color : this.col(o.color || '#e8e4da');
      D.text(ctx, String(text), 0, 0, { color, align: o.align || 'center', baseline: o.baseline || 'middle', spacing: o.spacing || 0 });
      ctx.restore();
    }

    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      const s = this.posAt(t);
      this.cur = s;
      const k = this.scale * s.size;
      ctx.save();
      ctx.globalAlpha *= a;
      ctx.translate(s.x, s.y);
      if (s.rotate) ctx.rotate(s.rotate);
      ctx.scale(k * (this.flip ? -1 : 1), k);
      this.def.draw(ctx, this, t, fx);
      ctx.restore();
    }

    editorial() { return {}; }
  }

  /**
   * Plain interior for character scenes: wall, floor, skirting and a soft key light from the same
   * side as the characters' light. window: { x, y, w, h } adds a blinded window.
   */
  class Room extends UF.Component {
    constructor(o) {
      super({ floor: 900, wall: '#171b21', ground: '#0e1014', light: 'left', skirting: true, window: null, dim: 0 }, o);
    }
    col(color) { return Prop.prototype.col.call(this, color); }
    draw(ctx, t) {
      const a = this.vis(t);
      if (a <= 0) return;
      const W = UF.W, H = UF.H, fy = this.floor, lx = this.light === 'right' ? W * 0.8 : W * 0.2;
      ctx.save();
      ctx.globalAlpha *= a;
      const wall = ctx.createLinearGradient(0, 0, 0, fy);
      wall.addColorStop(0, this.col(D.shade(this.wall, -0.35)));
      wall.addColorStop(1, this.col(this.wall));
      ctx.fillStyle = wall;
      ctx.fillRect(0, 0, W, fy);
      const key = ctx.createRadialGradient(lx, fy * 0.35, 0, lx, fy * 0.35, W * 0.7);
      key.addColorStop(0, `rgba(190,205,225,${0.09 * (1 - this.dim)})`);
      key.addColorStop(1, 'rgba(190,205,225,0)');
      ctx.fillStyle = key;
      ctx.fillRect(0, 0, W, fy);
      const w = this.window;
      if (w) {
        ctx.fillStyle = this.col('#0b0d10');
        ctx.fillRect(w.x - 10, w.y - 10, w.w + 20, w.h + 20);
        const sky = ctx.createLinearGradient(0, w.y, 0, w.y + w.h);
        sky.addColorStop(0, this.col('#2b3a4d'));
        sky.addColorStop(1, this.col('#4a5a6c'));
        ctx.fillStyle = sky;
        ctx.fillRect(w.x, w.y, w.w, w.h);
        ctx.fillStyle = this.col('#1a1f26');
        for (let y = w.y; y < w.y + w.h; y += 22) ctx.fillRect(w.x, y, w.w, 11);
      }
      const floor = ctx.createLinearGradient(0, fy, 0, H);
      floor.addColorStop(0, this.col(D.shade(this.ground, 0.06)));
      floor.addColorStop(1, this.col(D.shade(this.ground, -0.5)));
      ctx.fillStyle = floor;
      ctx.fillRect(0, fy, W, H - fy);
      const pool = ctx.createRadialGradient(lx, fy + 40, 0, lx, fy + 40, W * 0.45);
      pool.addColorStop(0, `rgba(190,205,225,${0.05 * (1 - this.dim)})`);
      pool.addColorStop(1, 'rgba(190,205,225,0)');
      ctx.fillStyle = pool;
      ctx.fillRect(0, fy, W, H - fy);
      if (this.skirting) {
        ctx.fillStyle = this.col(D.shade(this.wall, -0.45));
        ctx.fillRect(0, fy - 16, W, 16);
        ctx.fillStyle = 'rgba(255,255,255,0.05)';
        ctx.fillRect(0, fy - 16, W, 1.5);
      }
      ctx.fillStyle = 'rgba(0,0,0,0.45)';
      ctx.fillRect(0, fy, W, 2);
      ctx.restore();
    }
    editorial() { return {}; }
  }
  UF.Room = Room;

  /* ------------------------------------------------------------------ */
  /* Held items                                                          */
  /* ------------------------------------------------------------------ */
  const heldCache = new Map();
  const heldProp = (spec, dim) => {
    const o = typeof spec === 'string' ? { type: spec } : spec;
    const key = `${typeof spec === 'string' ? spec : JSON.stringify(spec)}|${dim}`;
    let p = heldCache.get(key);
    if (!p) {
      const type = o.type === 'phone' ? 'mobile' : o.type === 'bag' ? 'duffel' : o.type;
      if (!T[type] || !T[type].held) {
        const ok = Object.keys(T).filter(n => T[n].held);
        throw new Error(`Character can't hold "${o.type}" — holdable props: ${ok.join(', ')}, phone, bag.`);
      }
      p = new Prop(Object.assign({}, o, { type, x: 0, y: 0, scale: 1, dim }));
      heldCache.set(key, p);
    }
    return p;
  };

  UF.props = {
    types: T,
    screens: CONTENT,
    atmScreens: Object.keys(ATM_SCREENS),
    screen,
    ui,
    /** Drawing helpers for files that register more prop types. */
    kit: { hash, list, ell, poly, glow, hhmm },
    /** Draws a held prop at the hand. angle is the forearm direction in the caller's frame. */
    drawHeld(ctx, spec, angle, t, who = {}) {
      const p = heldProp(spec, who.silhouette ? 0.85 : who.dim || 0);
      const h = typeof p.def.held === 'function' ? p.def.held(p) : p.def.held;
      ctx.save();
      if (!h.hang) ctx.rotate(angle + (h.turn || 0));
      ctx.scale(p.size, p.size);
      ctx.translate(-h.grip[0], -h.grip[1]);
      p.def.draw(ctx, p, t, null);
      ctx.restore();
    },
  };
  UF.Prop = Prop;
})(window.UF);

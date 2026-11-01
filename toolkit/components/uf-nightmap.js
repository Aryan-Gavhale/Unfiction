/*!
 * Unfiction GFX Toolkit — NightMap
 * A stylised "seen from space at night" map: dark land, city lights that switch on in waves,
 * dashed borders, region outlines and labels. Built from UF.geo, so load uf-geo.js first.
 *
 *   new UF.NightMap({
 *     center: [127.5, 38.3], span: 11,
 *     lights:  [{ place: 'SEOUL', weight: 1.6, spread: 0.22 }, { place: [129.07, 35.18], weight: 1 }],
 *     scatter: [{ area: [lon, lat, lon, lat, ...], count: 900, weight: 0.25 }],
 *     borders: [{ points: [lon, lat, ...], at: 4, dashed: true }],
 *     outlines: [{ points: [lon, lat, ...], at: 6, color: 'blue' }],
 *     labels:  [{ text: 'SOUTH KOREA', place: [128.2, 36.3], at: 3.5 }],
 *     lightsAt: 1, lightsDur: 2.6,
 *   })
 *
 * span is the degrees of latitude from the top of the frame to the bottom. Lights only land on land.
 * Lights are where the episode says they are, so pair the map with a credit line naming the imagery.
 */
(function (UF) {
  'use strict';

  const { c, seg, ease, clamp } = UF;
  const D = UF.draw, G = UF.geo;
  const W = UF.W, H = UF.H;
  const GROUPS = 5;
  const glowCache = {};

  function glowSprite(color) {
    if (glowCache[color]) return glowCache[color];
    const cv = UF.canvas(64, 64), x = cv.getContext('2d');
    const [r, g, b] = UF.rgb(color);
    const grd = x.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, `rgba(${r},${g},${b},1)`);
    grd.addColorStop(0.25, `rgba(${r},${g},${b},.45)`);
    grd.addColorStop(1, `rgba(${r},${g},${b},0)`);
    x.fillStyle = grd;
    x.fillRect(0, 0, 64, 64);
    return (glowCache[color] = cv);
  }

  class NightMap extends UF.Component {
    constructor(o) {
      super({
        center: [127.5, 38.3], span: 11, lights: [], scatter: [], borders: [], outlines: [], labels: [],
        landAt: null, lightsAt: null, lightsDur: 2.6, color: '#ffc46b', land: '#0d1116', coast: null,
        label: 'ILLUSTRATION', seed: 17,
      }, o);
      this.center = G.place(this.center);
      if (this.landAt == null) this.landAt = this.at;
      if (this.lightsAt == null) this.lightsAt = this.landAt + 0.9;
      this.lights.forEach(l => G.place(l.place));
      for (const [name, list] of [['scatter', this.scatter.map(s => s.area)], ['borders', this.borders.map(b => b.points)], ['outlines', this.outlines.map(b => b.points)]]) {
        list.forEach((p, i) => {
          if (!Array.isArray(p) || p.length < 4 || p.length % 2) throw new Error(`NightMap: ${name} ${i + 1} needs a flat [lon, lat, lon, lat, ...] list.`);
        });
      }
    }

    proj(lon, lat) {
      const k = H / this.span, cl = Math.cos(this.center[1] * Math.PI / 180);
      return [W / 2 + (lon - this.center[0]) * k * cl, H / 2 - (lat - this.center[1]) * k];
    }

    path(flat, close) {
      const p = new Path2D();
      for (let i = 0; i < flat.length; i += 2) {
        const [x, y] = this.proj(flat[i], flat[i + 1]);
        i ? p.lineTo(x, y) : p.moveTo(x, y);
      }
      if (close) p.closePath();
      return p;
    }

    /** Land plate and light layers, drawn once. Lights are split into groups that switch on one after another. */
    bake() {
      if (this.plate) return;
      const land = new Path2D();
      for (const poly of G.LAND) land.addPath(this.path(poly, true));
      const plate = UF.canvas(W, H), px = plate.getContext('2d');
      px.fillStyle = this.land;
      px.fill(land);
      px.strokeStyle = this.coast || c('blue', 0.3);
      px.lineWidth = 1.2;
      px.stroke(land);

      const r = UF.rng(this.seed);
      const gauss = () => { let u = 0; while (!u) u = r(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * r()); };
      const onLand = (x, y) => px.isPointInPath(land, x, y);
      const groups = Array.from({ length: GROUPS }, () => UF.canvas(W, H));
      const gx = groups.map(g => { const x = g.getContext('2d'); x.globalCompositeOperation = 'lighter'; return x; });
      const glows = UF.canvas(W, H), wx = glows.getContext('2d');
      wx.globalCompositeOperation = 'lighter';
      const sprite = glowSprite(this.color);
      const k = H / this.span, cl = Math.cos(this.center[1] * Math.PI / 180);
      const dot = (x, y, b) => {
        const g = gx[Math.floor(r() * GROUPS)];
        const R = 3 + 7 * b;
        g.globalAlpha = clamp(0.1 + 0.35 * b);
        g.drawImage(sprite, x - R, y - R, R * 2, R * 2);
        g.globalAlpha = clamp(0.45 + 0.55 * b);
        g.fillStyle = '#fff1cf';
        const s = 0.8 + b;
        g.fillRect(x - s / 2, y - s / 2, s, s);
      };

      for (const L of this.lights) {
        const [lon, lat] = G.place(L.place);
        const wgt = L.weight ?? 1, spread = L.spread ?? 0.15, n = L.count ?? Math.round(18 + 50 * wgt);
        for (let i = 0; i < n; i++) {
          const g1 = gauss(), g2 = gauss();
          const [x, y] = this.proj(lon + g1 * spread / cl, lat + g2 * spread);
          if (!onLand(x, y)) continue;
          dot(x, y, clamp(wgt * Math.exp(-(g1 * g1 + g2 * g2) / 3) * (0.5 + 0.5 * r()), 0, 1.6));
        }
        const [cx, cy] = this.proj(lon, lat);
        const R = k * spread * 3.2 * Math.sqrt(wgt);
        wx.globalAlpha = clamp(0.32 * wgt);
        wx.drawImage(sprite, cx - R, cy - R, R * 2, R * 2);
      }

      for (const S of this.scatter) {
        const area = this.path(S.area, true);
        const xs = [], ys = [];
        for (let i = 0; i < S.area.length; i += 2) { const [x, y] = this.proj(S.area[i], S.area[i + 1]); xs.push(x); ys.push(y); }
        const x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        const n = S.count ?? 300, wgt = S.weight ?? 0.25;
        for (let i = 0, placed = 0; i < n * 6 && placed < n; i++) {
          const x = x0 + r() * (x1 - x0), y = y0 + r() * (y1 - y0);
          if (!px.isPointInPath(area, x, y) || !onLand(x, y)) continue;
          placed++;
          dot(x, y, wgt * (0.3 + 0.7 * r() * r()));
        }
      }

      const merged = UF.canvas(W, H), mx = merged.getContext('2d');
      mx.globalCompositeOperation = 'lighter';
      for (const g of groups) mx.drawImage(g, 0, 0);
      mx.drawImage(glows, 0, 0);
      Object.assign(this, { plate, groups, glows, merged });
    }

    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      this.bake();
      ctx.save();
      ctx.globalAlpha = a * ease.outCubic(seg(t, this.landAt, 1.2));
      ctx.drawImage(this.plate, 0, 0);

      for (const o of this.outlines) {
        const p = seg(t, o.at ?? this.at, o.dur ?? 1.4);
        if (p <= 0 || (o.out != null && t > o.out + 0.5)) continue;
        const fade = o.out != null ? 1 - seg(t, o.out, 0.5) : 1;
        const pts = [];
        for (let i = 0; i < o.points.length; i += 2) pts.push(this.proj(o.points[i], o.points[i + 1]));
        pts.push(pts[0]);
        ctx.save();
        ctx.globalAlpha = a * fade;
        ctx.lineJoin = 'round';
        if (p >= 1) {
          ctx.fillStyle = c(o.color || 'blue', o.fill ?? 0.07);
          ctx.fill(this.path(o.points, true));
        }
        ctx.strokeStyle = c(o.color || 'blue', 0.3);
        ctx.lineWidth = 9;
        D.partialPath(ctx, pts, ease.inOutCubic(p));
        ctx.stroke();
        ctx.strokeStyle = c(o.color || 'blue', 0.9);
        ctx.lineWidth = 2.5;
        D.partialPath(ctx, pts, ease.inOutCubic(p));
        ctx.stroke();
        ctx.restore();
      }

      ctx.save();
      ctx.globalCompositeOperation = 'lighter';
      if (t >= this.lightsAt + this.lightsDur) {
        ctx.globalAlpha = a;
        ctx.drawImage(this.merged, 0, 0);
      } else {
        for (let i = 0; i < GROUPS; i++) {
          const k = ease.outCubic(seg(t, this.lightsAt + (i / GROUPS) * this.lightsDur * 0.75, this.lightsDur * 0.3));
          if (k <= 0) continue;
          ctx.globalAlpha = a * k;
          ctx.drawImage(this.groups[i], 0, 0);
        }
        const gk = seg(t, this.lightsAt + this.lightsDur * 0.3, this.lightsDur * 0.7);
        if (gk > 0) { ctx.globalAlpha = a * gk; ctx.drawImage(this.glows, 0, 0); }
      }
      ctx.restore();

      for (const b of this.borders) {
        const p = seg(t, b.at ?? this.at, b.dur ?? 1.2);
        if (p <= 0) continue;
        const pts = [];
        for (let i = 0; i < b.points.length; i += 2) pts.push(this.proj(b.points[i], b.points[i + 1]));
        ctx.save();
        ctx.globalAlpha = a * (b.alpha ?? 0.7);
        if (b.dashed !== false) ctx.setLineDash([10, 8]);
        ctx.strokeStyle = c(b.color || 'paper');
        ctx.lineWidth = b.width || 2.5;
        D.partialPath(ctx, pts, ease.inOutCubic(p));
        ctx.stroke();
        ctx.restore();
      }

      for (const l of this.labels) {
        const p = seg(t, l.at ?? this.at, 0.6);
        if (p <= 0 || (l.out != null && t > l.out + 0.4)) continue;
        const fade = l.out != null ? 1 - seg(t, l.out, 0.4) : 1;
        const [px, py] = this.proj(...G.place(l.place));
        const [ox, oy] = l.offset || [0, 0];
        const align = l.align || 'center', size = l.size || 28;
        ctx.globalAlpha = a * fade * clamp(p * 2);
        if (l.dot) {
          ctx.fillStyle = c(l.color || 'paper');
          ctx.beginPath();
          ctx.arc(px, py, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.font = UF.font.mono(size, 'bold');
        D.text(ctx, D.typed(l.text, p), px + ox, py + oy, { color: c(l.color || 'paper'), spacing: size * 0.22, align });
        if (l.sub) {
          ctx.globalAlpha = a * fade * seg(t, (l.at ?? this.at) + 0.4, 0.5);
          ctx.font = UF.font.mono(Math.round(size * 0.62));
          D.text(ctx, l.sub, px + ox, py + oy + size * 1.05, { color: c('dim'), spacing: 2, align });
        }
      }

      if (this.label) {
        ctx.globalAlpha = a * seg(t, this.at + 0.5, 0.5);
        D.pill(ctx, this.label, W - 96, 80, { align: 'right', fill: c('black', 0.75), stroke: c('red'), font: UF.font.mono(15, 'bold'), h: 30, spacing: 3 });
      }
      ctx.restore();
    }

    editorial() { return { factual: true, illustration: true, label: this.label }; }
  }

  UF.NightMap = NightMap;
})(window.UF);

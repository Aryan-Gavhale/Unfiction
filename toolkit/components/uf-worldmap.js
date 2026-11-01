/*!
 * Unfiction GFX Toolkit — WorldMap
 * Dot-matrix world map with a keyframed camera, pins and animated money arcs.
 *
 *   new UF.WorldMap({
 *     span: 252,                                  // degrees of longitude across the frame at zoom 1
 *     camera: [ { t: 0, center: [16, 14], zoom: 1 },
 *               { t: 6, center: 'MANILA', zoom: 2.4, dur: 2 } ],
 *     pins:   [ { place: 'DHAKA', label: 'DHAKA', sub: 'Bangladesh Bank', at: 0.8, side: 'right', icon: 'bank' } ],
 *     arcs:   [ { from: 'DHAKA', to: 'NEW YORK', at: 1.5, dur: 1.6, lift: 0.3, label: '$101M',
 *                 stop: { at: 9, label: 'STOPPED' } } ],
 *   })
 *
 * Places are city names from UF.geo.CITIES or [lon, lat]. All times are scene-local seconds.
 */
(function (UF) {
  'use strict';

  const { c, clamp, seg, ease, lerp } = UF;
  const D = UF.draw;
  const G = UF.geo;
  const W = UF.W, H = UF.H;
  const LAT_TOP = 85, LAT_BOTTOM = -60;

  const dotCache = {};

  class WorldMap extends UF.Component {
    constructor(o) {
      super({
        span: 252,
        camera: [{ t: 0, center: [16, 14], zoom: 1 }],
        step: 10,
        dotSize: 2.35,
        reveal: { at: 0, dur: 1.4 },
        graticule: true,
        pins: [],
        arcs: [],
        seed: 37,
      }, o);
      this.k = W / this.span;
    }

    /* ---------------- geometry ---------------- */
    base(place) {
      const [lon, lat] = G.place(place);
      return [(lon + 180) * this.k, (LAT_TOP - lat) * this.k];
    }

    dots() {
      const key = `${this.k.toFixed(4)}:${this.step}:${this.seed}`;
      if (dotCache[key]) return dotCache[key];
      const ww = Math.ceil(360 * this.k), hh = Math.ceil((LAT_TOP - LAT_BOTTOM) * this.k);
      const cv = UF.canvas(ww, hh), x = cv.getContext('2d');
      const proj = (lon, lat) => [(lon + 180) * this.k, (LAT_TOP - lat) * this.k];
      x.fillStyle = '#fff';
      G.fillPolys(x, G.LAND, proj);
      x.globalCompositeOperation = 'destination-out';
      G.fillPolys(x, G.WATER, proj);
      const data = x.getImageData(0, 0, ww, hh).data;
      const land = (px, py) => {
        const ix = px | 0, iy = py | 0;
        return ix >= 0 && iy >= 0 && ix < ww && iy < hh && data[(iy * ww + ix) * 4 + 3] > 127;
      };
      const r = UF.rng(this.seed);
      const s = this.step;
      const levels = [[], [], []];
      const add = (lv, px, py) => {
        if (!land(px, py)) return;
        const v = r();
        levels[lv].push(px, py, v > 0.975 ? 3 : v > 0.66 ? 2 : v > 0.33 ? 1 : 0);
      };
      for (let py = s / 2; py < hh; py += s) {
        for (let px = s / 2; px < ww; px += s) {
          add(0, px, py);
          add(1, px + s / 2, py + s / 2);
          add(2, px + s / 2, py);
          add(2, px, py + s / 2);
        }
      }
      return (dotCache[key] = levels.map(l => new Float32Array(l)));
    }

    camAt(t) {
      const kf = this.camera;
      const toState = f => ({ c: this.base(f.center), z: f.zoom || 1 });
      let cur = toState(kf[0]);
      for (let i = 1; i < kf.length; i++) {
        const f = kf[i];
        if (t < f.t) break;
        const p = UF.easeFn(f.ease || 'inOutCubic')(seg(t, f.t, f.dur ?? 1.6));
        const nxt = toState(f);
        cur = {
          c: [lerp(cur.c[0], nxt.c[0], p), lerp(cur.c[1], nxt.c[1], p)],
          z: Math.exp(lerp(Math.log(cur.z), Math.log(nxt.z), p)),
        };
      }
      return cur;
    }

    arcPoints(a) {
      if (a._pts) return a._pts;
      const [x0, y0] = this.base(a.from), [x1, y1] = this.base(a.to);
      const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
      const lift = a.lift ?? 0.25;
      const cx = (x0 + x1) / 2 + (-dy / len) * lift * len;
      const cy = (y0 + y1) / 2 + (dx / len) * lift * len;
      return (a._pts = D.quadPoints(x0, y0, cx, cy, x1, y1, 72));
    }

    /* ---------------- draw ---------------- */
    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      const cam = this.camAt(t);
      const z = cam.z;
      const tx = p => [(p[0] - cam.c[0]) * z + W / 2, (p[1] - cam.c[1]) * z + H / 2];
      const rv = this.reveal ? ease.inOutCubic(seg(t, this.reveal.at, this.reveal.dur)) : 1;
      const scanX = lerp(-60, W + 60, rv);

      ctx.save();
      ctx.globalAlpha = a;
      ctx.beginPath();
      ctx.rect(0, 0, scanX, H);
      ctx.clip();

      if (this.graticule) this.drawGraticule(ctx, cam, tx);
      this.drawDots(ctx, cam);
      ctx.restore();

      if (rv > 0 && rv < 1) {
        const g = ctx.createLinearGradient(scanX - 120, 0, scanX + 4, 0);
        g.addColorStop(0, c('blue', 0));
        g.addColorStop(1, c('blue', 0.35));
        ctx.fillStyle = g;
        ctx.fillRect(scanX - 120, 0, 124, H);
        ctx.fillStyle = c('paper', 0.7);
        ctx.fillRect(scanX, 0, 2, H);
      }

      ctx.save();
      ctx.globalAlpha = a;
      for (const p of this.pins) this.drawPinGlow(ctx, t, p, tx);
      for (const arc of this.arcs) this.drawArc(ctx, t, arc, tx, fx);
      for (const p of this.pins) this.drawPin(ctx, t, p, tx);
      for (const arc of this.arcs) this.drawArcLabel(ctx, t, arc, tx);
      ctx.restore();
    }

    drawGraticule(ctx, cam, tx) {
      ctx.strokeStyle = c('blue', 0.08);
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let lon = -180; lon <= 180; lon += 15) {
        const [x] = tx(this.base([lon, 0]));
        if (x < -2 || x > W + 2) continue;
        ctx.moveTo(x, 0); ctx.lineTo(x, H);
      }
      for (let lat = -60; lat <= 75; lat += 15) {
        const [, y] = tx(this.base([0, lat]));
        if (y < -2 || y > H + 2) continue;
        ctx.moveTo(0, y); ctx.lineTo(W, y);
      }
      ctx.stroke();
    }

    drawDots(ctx, cam) {
      const levels = this.dots();
      const z = cam.z;
      const ox = W / 2 - cam.c[0] * z, oy = H / 2 - cam.c[1] * z;
      const rad = this.dotSize * Math.pow(z, 0.5) * (this.step / 10);
      const lvAlpha = [1, ease.outCubic(seg(z, 1.45, 0.6)), ease.outCubic(seg(z, 2.6, 0.9))];
      const fills = [c('blue', 0.46), c('blue', 0.64), c('blue', 0.84), c('paper', 0.72)];
      for (let lv = 0; lv < 3; lv++) {
        if (lvAlpha[lv] <= 0.01) continue;
        const arr = levels[lv];
        const paths = [new Path2D(), new Path2D(), new Path2D(), new Path2D()];
        const r = rad * (lv === 0 ? 1 : 0.9);
        for (let i = 0; i < arr.length; i += 3) {
          const x = arr[i] * z + ox, y = arr[i + 1] * z + oy;
          if (x < -r || y < -r || x > W + r || y > H + r) continue;
          const p = paths[arr[i + 2]];
          if (r < 1.6) p.rect(x - r, y - r, r * 2, r * 2);
          else { p.moveTo(x + r, y); p.arc(x, y, r, 0, Math.PI * 2); }
        }
        const ga = ctx.globalAlpha;
        ctx.globalAlpha = ga * lvAlpha[lv];
        for (let b = 0; b < 4; b++) { ctx.fillStyle = fills[b]; ctx.fill(paths[b]); }
        ctx.globalAlpha = ga;
      }
    }

    drawPinGlow(ctx, t, p, tx) {
      const pa = seg(t, p.at ?? 0, 0.6) * UF.win(t, p.at ?? 0, p.out ?? Infinity, 0.6, 0.5);
      if (pa <= 0) return;
      const [x, y] = tx(this.base(p.place));
      const g = ctx.createRadialGradient(x, y, 0, x, y, 120);
      g.addColorStop(0, c(p.color || 'red', 0.22 * pa));
      g.addColorStop(1, c(p.color || 'red', 0));
      ctx.fillStyle = g;
      ctx.fillRect(x - 120, y - 120, 240, 240);
    }

    drawPin(ctx, t, p, tx) {
      const at = p.at ?? 0;
      if (t < at) return;
      const pa = UF.win(t, at, p.out ?? Infinity, 0.25, 0.5);
      const [x, y] = tx(this.base(p.place));
      const col = c(p.color || 'red');
      const drop = seg(t, at, 0.35);
      ctx.save();
      ctx.globalAlpha *= pa;

      if (drop < 1) {
        ctx.strokeStyle = c('paper', 0.8 * (1 - drop));
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x, y - 90 * (1 - ease.inQuad(drop)) - 20); ctx.lineTo(x, y); ctx.stroke();
      }
      const land = ease.outBack(seg(t, at + 0.3, 0.4));
      const period = p.pulse ?? 2.2;
      const ph = ((t - at - 0.3) % period) / period;
      if (t > at + 0.3) {
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        ctx.save();
        ctx.globalAlpha *= (1 - ph) * 0.8;
        ctx.beginPath(); ctx.arc(x, y, 8 + ph * 38, 0, Math.PI * 2); ctx.stroke();
        ctx.restore();
      }
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x, y, 6.5 * land, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(x, y, 13 * land, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = c('paper');
      ctx.beginPath(); ctx.arc(x, y, 2.2 * land, 0, Math.PI * 2); ctx.fill();

      if (p.label) this.drawPinLabel(ctx, t - at - 0.35, p, x, y);
      ctx.restore();
    }

    drawPinLabel(ctx, lt, p, x, y) {
      if (lt <= 0) return;
      const side = p.side || 'right';
      const lead = p.lead ?? 46;
      const diag = ['tr', 'tl', 'br', 'bl'].includes(side);
      const sx = ['left', 'tl', 'bl'].includes(side) ? -1 : ['top', 'bottom'].includes(side) ? 0 : 1;
      const sy = ['top', 'tl', 'tr'].includes(side) ? -1 : ['bottom', 'bl', 'br'].includes(side) ? 1 : 0;
      let ax, ay, align;
      if (sx === 0) { ax = x; ay = y + sy * 34; align = 'center'; }
      else if (diag) { ax = x + sx * lead; ay = y + sy * lead * 0.8; align = sx > 0 ? 'left' : 'right'; }
      else { ax = x + sx * 26; ay = y; align = sx > 0 ? 'left' : 'right'; }

      const lp = ease.outExpo(seg(lt, 0, 0.5));
      if (diag) {
        ctx.strokeStyle = c('paper', 0.55);
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(x + sx * 14 * 0.7, y + sy * 14 * 0.7);
        ctx.lineTo(lerp(x, ax, lp), lerp(y, ay, lp));
        ctx.stroke();
      }
      const label = D.typed(p.label, seg(lt, 0.05, 0.45));
      const sub = p.sub ? D.typed(p.sub, seg(lt, 0.25, 0.6)) : '';
      ctx.font = UF.font.mono(p.size || 22, 'bold');
      const lw = D.measure(ctx, p.label, 3);
      ctx.font = UF.font.mono(16);
      const sw = p.sub ? D.measure(ctx, p.sub, 1.5) : 0;
      const icon = p.icon ? 44 : 0;
      const bw = Math.max(lw, sw) + icon + (icon ? 14 : 0) + 28;
      const bh = p.sub ? 70 : 44;
      let bx = align === 'left' ? ax + (diag ? 6 : 0) : align === 'right' ? ax - bw - (diag ? 6 : 0) : ax - bw / 2;
      let by = side === 'top' ? ay - bh : side === 'bottom' ? ay : ay - bh / 2;
      if (diag && sy < 0) by = ay - bh + 8;
      if (diag && sy > 0) by = ay - 8;

      ctx.save();
      ctx.globalAlpha *= lp;
      ctx.fillStyle = c('black', 0.78);
      D.roundRect(ctx, bx, by, bw, bh, 3);
      ctx.fill();
      ctx.fillStyle = c(p.color || 'red');
      ctx.fillRect(align === 'right' ? bx + bw - 3 : bx, by, 3, bh);
      let tx0 = bx + 16;
      if (icon) {
        D.icon(ctx, p.icon, tx0 + 20, by + bh / 2, 34, { color: c('paper'), width: 6 });
        tx0 += icon + 12;
      }
      ctx.font = UF.font.mono(p.size || 22, 'bold');
      D.text(ctx, label, tx0, by + (p.sub ? 30 : 29), { color: c('paper'), spacing: 3 });
      if (sub) {
        ctx.font = UF.font.mono(16);
        D.text(ctx, sub, tx0, by + 56, { color: c('dim'), spacing: 1.5 });
      }
      ctx.restore();
    }

    arcState(t, arc) {
      const p = ease.inOutCubic(seg(t, arc.at ?? 0, arc.dur ?? 1.4));
      const stopped = arc.stop ? seg(t, arc.stop.at, 0.5) : 0;
      return { p, stopped };
    }

    drawArc(ctx, t, arc, tx, fx) {
      const at = arc.at ?? 0;
      if (t < at) return;
      const { p, stopped } = this.arcState(t, arc);
      const fade = UF.win(t, at, arc.out ?? Infinity, 0.01, 0.5);
      if (fade <= 0) return;
      const pts = this.arcPoints(arc).map(tx);
      const col = arc.color || 'red';
      const strokeCol = stopped > 0 ? UF.mix(col, '#6e6e73', stopped) : c(col);
      ctx.save();
      ctx.globalAlpha *= fade;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (arc.dashed) ctx.setLineDash([10, 9]);

      ctx.strokeStyle = strokeCol;
      ctx.globalAlpha *= 0.18;
      ctx.lineWidth = (arc.width || 2.6) * 4;
      D.partialPath(ctx, pts, p);
      ctx.stroke();
      ctx.globalAlpha /= 0.18;
      ctx.lineWidth = arc.width || 2.6;
      const head = D.partialPath(ctx, pts, p);
      ctx.stroke();
      ctx.setLineDash([]);

      if (p >= 1 && arc.flow !== false && stopped < 1) {
        ctx.save();
        ctx.globalAlpha *= 1 - stopped;
        ctx.setLineDash([3, 24]);
        ctx.lineDashOffset = -t * (arc.speed || 110);
        ctx.strokeStyle = c('paper', 0.85);
        ctx.lineWidth = (arc.width || 2.6) + 1.2;
        D.partialPath(ctx, pts, 1);
        ctx.stroke();
        ctx.restore();
      }

      if (head && p < 1) {
        const g = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, 22);
        g.addColorStop(0, c(col, 0.6));
        g.addColorStop(1, c(col, 0));
        ctx.fillStyle = g;
        ctx.fillRect(head.x - 22, head.y - 22, 44, 44);
        ctx.fillStyle = c('paper');
        ctx.beginPath(); ctx.arc(head.x, head.y, 4.5, 0, Math.PI * 2); ctx.fill();
      }
      if (p >= 1 && arc.endRing !== false) {
        const e = pts[pts.length - 1];
        const ep = seg(t, at + (arc.dur ?? 1.4), 0.5);
        ctx.strokeStyle = strokeCol;
        ctx.globalAlpha *= 1 - ep;
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(e[0], e[1], 8 + ep * 30, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();

      if (arc.stop && t >= arc.stop.at) {
        const sp = ease.outBack(seg(t, arc.stop.at, 0.35));
        const [sx, sy] = D.pointAt(pts, arc.stop.pos ?? 0.93);
        ctx.save();
        ctx.fillStyle = c('red');
        ctx.beginPath(); ctx.arc(sx, sy, 20 * sp, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = c('paper');
        ctx.lineWidth = 3.5;
        ctx.lineCap = 'round';
        const k = 7 * sp;
        ctx.beginPath(); ctx.moveTo(sx - k, sy - k); ctx.lineTo(sx + k, sy + k); ctx.moveTo(sx + k, sy - k); ctx.lineTo(sx - k, sy + k); ctx.stroke();
        ctx.restore();
        if (arc.stop.kick !== false) fx.kick(t, arc.stop.at, { shake: 0.006, rgb: 0.5, decay: 12 });
      }
    }

    drawArcLabel(ctx, t, arc, tx) {
      const at = arc.at ?? 0;
      const fade = UF.win(t, at, arc.out ?? Infinity, 0.01, 0.5);
      if (fade <= 0) return;
      const { p, stopped } = this.arcState(t, arc);
      const pts = this.arcPoints(arc).map(tx);
      ctx.save();
      ctx.globalAlpha *= fade;
      const la = arc.labelAt ?? 0.5;
      const lo = arc.labelOut !== undefined ? 1 - seg(t, arc.labelOut, 0.4) : 1;
      if (arc.label && p >= la && lo > 0) {
        const q = ease.outBack(seg(t, at + (arc.dur ?? 1.4) * la, 0.35)) * lo;
        const [lx, ly] = D.pointAt(pts, la);
        const off = arc.labelOffset || [0, -30];
        ctx.save();
        ctx.translate(lx + off[0], ly + off[1]);
        ctx.scale(q, q);
        D.pill(ctx, arc.label, 0, 0, {
          align: 'center',
          fill: stopped > 0.5 ? c('graphite') : c(arc.color || 'red'),
          stroke: stopped > 0.5 ? c('line') : null,
          color: stopped > 0.5 ? c('dim') : c('paper'),
          font: UF.font.mono(arc.labelSize || 20, 'bold'), h: (arc.labelSize || 20) + 16,
        });
        if (stopped > 0.5 && arc.strikeLabel !== false) {
          ctx.font = UF.font.mono(arc.labelSize || 20, 'bold');
          const w = D.measure(ctx, arc.label, 2);
          ctx.fillStyle = c('red');
          ctx.fillRect(-w / 2 - 4, -1.5, (w + 8) * seg(t, arc.stop.at + 0.2, 0.3), 3);
        }
        ctx.restore();
      }
      if (arc.stop && arc.stop.label && t >= arc.stop.at + 0.15) {
        const [sx, sy] = D.pointAt(pts, arc.stop.pos ?? 0.93);
        const so = arc.stop.labelOffset || [0, 46];
        const q = ease.outExpo(seg(t, arc.stop.at + 0.15, 0.4));
        ctx.globalAlpha *= q;
        D.pill(ctx, arc.stop.label, sx + so[0], sy + so[1], { align: 'center', fill: c('red'), font: UF.font.mono(18, 'bold'), h: 34 });
        if (arc.stop.sub) {
          ctx.font = UF.font.mono(16);
          D.text(ctx, D.typed(arc.stop.sub, seg(t, arc.stop.at + 0.4, 0.6)), sx + so[0], sy + so[1] + 36, { color: c('paper'), spacing: 1.5, align: 'center' });
        }
      }
      ctx.restore();
    }

    /** Arcs claim that something moved between places, so they need a source; pins alone are geography. */
    editorial() { return { factual: this.arcs.length > 0 }; }
  }

  UF.WorldMap = WorldMap;
})(window.UF);

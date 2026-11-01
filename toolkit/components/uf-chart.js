/*!
 * Unfiction GFX Toolkit — LineChart and BarChart
 *
 *   new UF.LineChart({
 *     yFormat: 'money', xTicks: [2002, 2004, 2006, 2008],
 *     series: [ { label: 'REPORTED', color: 'paper', points: [[2002, 2e9], [2008, 65e9]], at: 1, dur: 3 },
 *               { label: 'ACTUAL',   color: 'red',   points: [[2002, 1e9], [2008, 0.3e9]], at: 2, dur: 3 } ],
 *     markers: [ { x: 2008, at: 6, label: 'COLLAPSE' } ],
 *   })
 *
 *   new UF.BarChart({
 *     format: 'money', orientation: 'vertical',
 *     bars: [ { label: 'REQUESTED', value: 951e6 }, { label: 'LOST', value: 81e6, highlight: { at: 6 } } ],
 *   })
 *
 * x, y, w, h is the whole chart box, labels included.
 * Formats: 'number', 'money' ($81M), 'compact' (81M), 'percent', or a function v => string.
 */
(function (UF) {
  'use strict';

  const { c, clamp, seg, ease, lerp } = UF;
  const D = UF.draw;
  const UNITS = [[1e12, 'T'], [1e9, 'B'], [1e6, 'M'], [1e3, 'K']];

  /** Fixed decimals, or up to `auto` decimals with trailing zeros removed. */
  function num(v, decimals, auto = 1) {
    if (decimals != null) return v.toFixed(decimals);
    return String(+v.toFixed(auto));
  }

  /** 81000000 -> '81M', 1500000000 -> '1.5B', 999960 -> '1M'. */
  function compact(v, cur, decimals) {
    const sign = v < 0 ? '-' : '', a = Math.abs(v);
    for (let i = 0; i < UNITS.length; i++) {
      const [u, s] = UNITS[i];
      if (a < u) continue;
      const n = a / u;
      const str = num(n, decimals, n < 100 ? 1 : 0);
      if (parseFloat(str) >= 1000 && i > 0) return `${sign}${cur}${num(1, decimals)}${UNITS[i - 1][1]}`;
      return `${sign}${cur}${str}${s}`;
    }
    const str = num(a, decimals, a < 10 ? 1 : 0);
    if (parseFloat(str) >= 1000) return `${sign}${cur}${num(1, decimals)}K`;
    return `${sign}${cur}${str}`;
  }

  function formatter(f, decimals) {
    if (typeof f === 'function') return f;
    if (f === 'money') return v => compact(v, '$', decimals);
    if (f === 'compact') return v => compact(v, '', decimals);
    if (f === 'percent') return v => `${num(v, decimals)}%`;
    if (f && f !== 'number') throw new Error(`Chart: unknown format "${f}" — use number, money, compact, percent or a function.`);
    const d = decimals ?? 0;
    return v => v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
  }

  /** Tick labels need enough decimals to tell neighbouring ticks apart. */
  function tickFormatter(f, decimals, step) {
    if (typeof f === 'function' || decimals != null || f === 'money' || f === 'compact') return formatter(f, decimals);
    return formatter(f, Math.max(0, Math.ceil(-Math.log10(step) - 1e-9)));
  }

  function niceStep(range, count) {
    const raw = range / Math.max(1, count);
    const mag = Math.pow(10, Math.floor(Math.log10(raw)));
    const n = raw / mag;
    return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * mag;
  }

  /** Axis range and ticks. Explicit min / max / step / ticks win over the automatic choice. */
  function niceAxis(lo, hi, o) {
    if (o.ticks && o.ticks.length) {
      const t = [...o.ticks].sort((p, q) => p - q);
      const min = o.min ?? Math.min(t[0], lo), max = o.max ?? Math.max(t[t.length - 1], hi);
      return { lo: min, hi: max, step: t.length > 1 ? t[1] - t[0] : max - min, ticks: t };
    }
    let min = o.min ?? Math.min(0, lo), max = o.max ?? hi;
    if (max <= min) max = min + 1;
    const step = o.step ?? niceStep(max - min, 5);
    if (o.min == null) min = Math.floor(min / step + 1e-9) * step;
    if (o.max == null) max = Math.ceil(max / step - 1e-9) * step;
    const ticks = [];
    for (let v = min; v <= max + step * 1e-6; v += step) ticks.push(+v.toPrecision(12));
    return { lo: min, hi: max, step, ticks };
  }

  function yAt(pts, xv) {
    if (xv <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) {
      if (xv <= pts[i][0]) {
        const [x0, y0] = pts[i - 1], [x1, y1] = pts[i];
        return lerp(y0, y1, (xv - x0) / (x1 - x0 || 1));
      }
    }
    return pts[pts.length - 1][1];
  }

  UF.chart = { compact, formatter, niceAxis };

  /* ------------------------------------------------------------------ */
  /* LineChart                                                           */
  /* ------------------------------------------------------------------ */
  class LineChart extends UF.Component {
    constructor(o) {
      super({
        x: 160, y: 190, w: 1600, h: 720,
        series: [], markers: [],
        xMin: null, xMax: null, xTicks: null, xFormat: v => String(v),
        yMin: null, yMax: null, yStep: null, yTicks: null, yFormat: 'number', decimals: null, yLabel: '',
        grid: true, axisDur: 0.9, headValue: true, endLabel: true,
      }, o);
      this.series.forEach((s, i) => {
        if (!s.points || s.points.length < 2) throw new Error(`LineChart: series ${i} needs at least two points.`);
        s.points = [...s.points].sort((p, q) => p[0] - q[0]);
      });
      this.markers.forEach(m => {
        if (m.series != null && !this.series[m.series]) throw new Error(`LineChart: marker refers to missing series ${m.series}.`);
      });
      const xs = this.series.flatMap(s => s.points.map(p => p[0]));
      const ys = this.series.flatMap(s => s.points.map(p => p[1]));
      this.xLo = this.xMin ?? (xs.length ? Math.min(...xs) : 0);
      this.xHi = this.xMax ?? (xs.length ? Math.max(...xs) : 1);
      if (this.xHi <= this.xLo) this.xHi = this.xLo + 1;
      this.yAxis = niceAxis(ys.length ? Math.min(...ys) : 0, ys.length ? Math.max(...ys) : 1,
        { min: this.yMin, max: this.yMax, step: this.yStep, ticks: this.yTicks });
      this.xTickList = this.xTicks || this.autoXTicks(xs);
      this.valueFmt = formatter(this.yFormat, this.decimals);
      this.tickFmt = tickFormatter(this.yFormat, this.decimals, this.yAxis.step);
      this.plotRect = {
        left: this.x + 120, right: this.x + this.w - (this.endLabel ? 240 : 30),
        top: this.y + 56, bottom: this.y + this.h - 64,
      };
      this.endY = this.layoutEndLabels();
    }

    autoXTicks(xs) {
      const uniq = [...new Set(xs)].sort((p, q) => p - q);
      if (uniq.length <= 12) return uniq;
      return niceAxis(this.xLo, this.xHi, { min: this.xLo, max: this.xHi, step: niceStep(this.xHi - this.xLo, 8) }).ticks;
    }

    toX(v) { return lerp(this.plotRect.left, this.plotRect.right, (v - this.xLo) / (this.xHi - this.xLo)); }
    toY(v) { return lerp(this.plotRect.bottom, this.plotRect.top, (v - this.yAxis.lo) / (this.yAxis.hi - this.yAxis.lo)); }
    baseY() { return this.toY(clamp(0, this.yAxis.lo, this.yAxis.hi)); }

    /** End labels sit beside each line's last point, pushed apart so they never overlap. */
    layoutEndLabels() {
      const order = this.series.map((s, i) => ({ i, y: this.toY(s.points[s.points.length - 1][1]) })).sort((p, q) => p.y - q.y);
      for (let k = 1; k < order.length; k++) order[k].y = Math.max(order[k].y, order[k - 1].y + 70);
      const out = [];
      for (const o of order) out[o.i] = o.y;
      return out;
    }

    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      this.drawAxes(ctx, t, a);
      this.series.forEach((s, i) => this.drawSeries(ctx, t, s, i, a, fx));
      for (const m of this.markers) this.drawMarker(ctx, t, m, a, fx);
      ctx.restore();
    }

    drawAxes(ctx, t, a) {
      const R = this.plotRect, lt = t - this.at;
      const p = ease.outExpo(seg(lt, 0, this.axisDur));
      ctx.font = UF.font.mono(18);
      this.yAxis.ticks.forEach((v, i) => {
        const k = ease.outCubic(seg(lt, 0.1 + i * 0.06, 0.5));
        if (k <= 0) return;
        const y = this.toY(v);
        ctx.globalAlpha = a * k;
        if (this.grid) { ctx.fillStyle = c('line'); ctx.fillRect(R.left, y - 0.5, (R.right - R.left) * k, 1); }
        D.text(ctx, this.tickFmt(v), R.left - 22, y + 6, { color: c('dim'), spacing: 1, align: 'right' });
      });
      ctx.globalAlpha = a;
      ctx.fillStyle = c('dim');
      ctx.fillRect(R.left, this.baseY() - 1, (R.right - R.left) * p, 2);
      this.xTickList.forEach((v, i) => {
        const k = ease.outCubic(seg(lt, 0.2 + i * 0.05, 0.5));
        if (k <= 0) return;
        const x = this.toX(v);
        ctx.globalAlpha = a * k;
        ctx.fillStyle = c('dim');
        ctx.fillRect(x - 1, R.bottom, 2, 10);
        D.text(ctx, this.xFormat(v), x, R.bottom + 40, { color: c('dim'), spacing: 1, align: 'center' });
      });
      if (this.yLabel) {
        ctx.globalAlpha = a * seg(lt, 0.3, 0.5);
        ctx.font = UF.font.mono(15, 'bold');
        D.text(ctx, this.yLabel, R.left - 22, R.top - 30, { color: c('dim'), spacing: 3, align: 'right' });
      }
      ctx.globalAlpha = a;
    }

    drawSeries(ctx, t, s, i, a, fx) {
      const at = s.at ?? this.at + 0.6, dur = s.dur ?? 2.5;
      const p = ease.inOutSine(seg(t, at, dur));
      if (p <= 0) return;
      const pts = s.points, R = this.plotRect;
      const xHead = lerp(pts[0][0], pts[pts.length - 1][0], p);
      const path = [];
      for (const pt of pts) if (pt[0] < xHead) path.push([this.toX(pt[0]), this.toY(pt[1])]);
      const yh = yAt(pts, xHead);
      const head = [this.toX(xHead), this.toY(yh)];
      path.push(head);
      const colName = s.color || 'red', col = c(colName), lw = s.width || 4;

      ctx.save();
      if (s.area) {
        const by = this.baseY();
        const g = ctx.createLinearGradient(0, R.top, 0, by);
        g.addColorStop(0, c(colName, 0.3));
        g.addColorStop(1, c(colName, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(path[0][0], by);
        for (const pt of path) ctx.lineTo(pt[0], pt[1]);
        ctx.lineTo(head[0], by);
        ctx.closePath();
        ctx.fill();
      }
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      if (s.dashed) ctx.setLineDash([14, 10]);
      const stroke = (style, width) => {
        ctx.strokeStyle = style;
        ctx.lineWidth = width;
        ctx.beginPath();
        path.forEach((pt, k) => (k ? ctx.lineTo(pt[0], pt[1]) : ctx.moveTo(pt[0], pt[1])));
        ctx.stroke();
      };
      stroke(c(colName, 0.22), lw + 8);
      stroke(col, lw);
      ctx.setLineDash([]);
      if (s.dots !== false) {
        for (const pt of pts) {
          if (pt[0] > xHead) break;
          ctx.fillStyle = c('black');
          ctx.beginPath(); ctx.arc(this.toX(pt[0]), this.toY(pt[1]), lw + 3, 0, Math.PI * 2); ctx.fill();
          ctx.fillStyle = col;
          ctx.beginPath(); ctx.arc(this.toX(pt[0]), this.toY(pt[1]), lw, 0, Math.PI * 2); ctx.fill();
        }
      }

      const doneAt = at + dur;
      if (t < doneAt) {
        ctx.fillStyle = c(colName, 0.3);
        ctx.beginPath(); ctx.arc(head[0], head[1], lw + 10, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = c('paper');
        ctx.beginPath(); ctx.arc(head[0], head[1], lw + 2, 0, Math.PI * 2); ctx.fill();
        if (this.headValue) {
          D.pill(ctx, this.valueFmt(yh), head[0], head[1] - 36, {
            align: 'center', fill: c('black', 0.85), stroke: col, color: c('paper'), font: UF.font.mono(18, 'bold'), h: 30,
          });
        }
      } else if (this.endLabel) {
        const k = ease.outCubic(seg(t, doneAt, 0.5));
        const last = pts[pts.length - 1];
        const lx = this.toX(last[0]) + 26, ly = this.endY[i];
        ctx.globalAlpha = a * k;
        ctx.font = UF.font.display(40);
        D.text(ctx, s.display ?? this.valueFmt(last[1]), lx + (1 - k) * 14, ly + 8, { color: col, spacing: 1 });
        if (s.label) {
          ctx.font = UF.font.mono(16, 'bold');
          D.text(ctx, D.fit(ctx, s.label, this.x + this.w - lx - 10, 3), lx + (1 - k) * 14, ly + 34, { color: c('dim'), spacing: 3 });
        }
        ctx.globalAlpha = a;
        if (s.kick !== false) fx.kick(t, doneAt, { rgb: 0.2, decay: 10 });
      }
      ctx.restore();
    }

    drawMarker(ctx, t, m, a, fx) {
      if (t < m.at) return;
      const R = this.plotRect, by = this.baseY();
      const k = ease.outCubic(seg(t, m.at, 0.5));
      const x = this.toX(m.x), colName = m.color || 'amber', col = c(colName);
      ctx.save();
      ctx.strokeStyle = col;
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 7]);
      ctx.globalAlpha = a * 0.85;
      ctx.beginPath(); ctx.moveTo(x, R.top); ctx.lineTo(x, lerp(R.top, by, k)); ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = a * clamp(k * 1.5);
      if (m.label) {
        D.pill(ctx, m.label, x, R.top - 20, { align: 'center', fill: col, color: c('black'), font: UF.font.mono(16, 'bold'), h: 30, spacing: 3 });
      }
      if (m.series != null) {
        const y = this.toY(yAt(this.series[m.series].points, m.x));
        const r = lerp(22, 11, ease.outBack(k));
        ctx.strokeStyle = col;
        ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
      }
      ctx.restore();
      if (m.kick !== false) fx.kick(t, m.at, { rgb: 0.35, decay: 10 });
    }

    editorial() { return { factual: true }; }
  }
  UF.LineChart = LineChart;

  /* ------------------------------------------------------------------ */
  /* BarChart                                                            */
  /* ------------------------------------------------------------------ */
  class BarChart extends UF.Component {
    constructor(o) {
      super({
        x: 160, y: 190, w: 1600, h: 720,
        bars: [], orientation: 'vertical', format: 'number', decimals: null, max: null,
        stagger: 0.25, dur: 1.1, gap: 0.38, color: 'blue', sort: false, labelW: 380,
      }, o);
      if (this.orientation !== 'vertical' && this.orientation !== 'horizontal') {
        throw new Error(`BarChart: orientation must be 'vertical' or 'horizontal', not "${this.orientation}".`);
      }
      this.bars.forEach((b, i) => {
        if (typeof b.value !== 'number' || b.value < 0) throw new Error(`BarChart: bar ${i} needs a value of 0 or more.`);
      });
      this.items = this.bars.map(b => Object.assign({}, b));
      if (this.sort === 'desc') this.items.sort((p, q) => q.value - p.value);
      else if (this.sort === 'asc') this.items.sort((p, q) => p.value - q.value);
      this.items.forEach((b, k) => { b.start = b.at ?? this.at + 0.4 + k * this.stagger; });
      this.top = this.max ?? (Math.max(0, ...this.items.map(b => b.value)) || 1);
      this.headroom = this.items.some(b => b.highlight && b.highlight.label) ? 124 : 70;
      this.valueFmt = formatter(this.format, this.decimals);
    }

    highlightAt(t, b) {
      return b.highlight ? ease.outCubic(seg(t, b.highlight.at, 0.4)) : 0;
    }

    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      const dim = Math.max(0, ...this.items.map(b => this.highlightAt(t, b)));
      ctx.save();
      ctx.globalAlpha = a;
      const p = ease.outExpo(seg(t - this.at, 0, 0.9));
      const vertical = this.orientation === 'vertical';
      ctx.fillStyle = c('dim');
      if (vertical) ctx.fillRect(this.x, this.y + this.h - 80 - 1, this.w * p, 2);
      else ctx.fillRect(this.x + this.labelW - 1, this.y, 2, this.h * p);
      this.items.forEach((b, k) => {
        const hk = this.highlightAt(t, b);
        const alpha = a * (b.highlight ? 1 : 1 - 0.55 * dim);
        if (vertical) this.drawColumn(ctx, t, b, k, alpha, hk);
        else this.drawRow(ctx, t, b, k, alpha, hk);
        if (b.highlight && b.highlight.kick !== false) fx.kick(t, b.highlight.at, { rgb: 0.4, shake: 0.004, decay: 10 });
      });
      ctx.restore();
    }

    barFill(b, hk) {
      const base = b.color || this.color;
      return hk > 0 ? UF.mix(base, b.highlight.color || 'red', hk) : c(base);
    }

    valueText(b, grow) {
      return grow >= 1 && b.display != null ? b.display : this.valueFmt(b.value * grow);
    }

    drawColumn(ctx, t, b, k, alpha, hk) {
      const appear = seg(t, b.start, 0.3);
      if (appear <= 0) return;
      const grow = ease.outExpo(seg(t, b.start, this.dur));
      const n = this.items.length, left = this.x, bottom = this.y + this.h - 80, top = this.y + this.headroom;
      const slot = this.w / n, bw = slot * (1 - this.gap), cx = left + slot * (k + 0.5);
      const bh = (bottom - top) * clamp(b.value / this.top) * grow;
      ctx.globalAlpha = alpha * appear;
      ctx.fillStyle = this.barFill(b, hk);
      ctx.fillRect(cx - bw / 2, bottom - bh, bw, bh);
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      ctx.fillRect(cx - bw / 2, bottom - bh, bw, Math.min(3, bh));

      const size = Math.round(clamp(bw * 0.3, 26, 48));
      ctx.font = UF.font.display(size);
      D.text(ctx, this.valueText(b, grow), cx, bottom - bh - 16, { color: c('paper'), spacing: 1, align: 'center' });

      ctx.font = UF.font.mono(18, 'bold');
      const lines = D.wrap(ctx, b.label || '', slot - 24).slice(0, 2);
      lines.forEach((ln, i) => D.text(ctx, ln, cx, bottom + 34 + i * 24, { color: c('paper'), align: 'center' }));
      if (b.sub) {
        ctx.font = UF.font.mono(15);
        D.text(ctx, D.fit(ctx, b.sub, slot - 24), cx, bottom + 34 + lines.length * 24, { color: c('dim'), align: 'center' });
      }
      if (b.highlight && b.highlight.label && hk > 0) {
        ctx.globalAlpha = alpha * hk;
        D.pill(ctx, b.highlight.label, cx, bottom - bh - size - 40, {
          align: 'center', fill: c(b.highlight.color || 'red'), font: UF.font.mono(16, 'bold'), h: 30, spacing: 3,
        });
      }
    }

    rowSize() {
      return Math.round(clamp((this.h / this.items.length) * (1 - this.gap) * 0.8, 24, 44));
    }

    /** Right end of the bar area, chosen so every finished bar keeps its value and highlight label inside the box. */
    rowRight(ctx) {
      if (this._right != null) return this._right;
      const box = this.x + this.w, left = this.x + this.labelW;
      let right = box - 200;
      ctx.save();
      for (const b of this.items) {
        const frac = clamp(b.value / this.top);
        if (frac <= 0) continue;
        ctx.font = UF.font.display(this.rowSize());
        let need = 18 + D.measure(ctx, this.valueText(b, 1), 1);
        if (b.highlight && b.highlight.label) {
          ctx.font = UF.font.mono(16, 'bold');
          need += 18 + D.measure(ctx, b.highlight.label, 3) + 28;
        }
        right = Math.min(right, left + (box - need - left) / frac);
      }
      ctx.restore();
      return (this._right = Math.max(left + 40, right));
    }

    drawRow(ctx, t, b, k, alpha, hk) {
      const appear = seg(t, b.start, 0.3);
      if (appear <= 0) return;
      const grow = ease.outExpo(seg(t, b.start, this.dur));
      const n = this.items.length, left = this.x + this.labelW, right = this.rowRight(ctx);
      const slot = this.h / n, bh = slot * (1 - this.gap), cy = this.y + slot * (k + 0.5);
      const bw = (right - left) * clamp(b.value / this.top) * grow;
      ctx.globalAlpha = alpha * appear;
      ctx.fillStyle = this.barFill(b, hk);
      ctx.fillRect(left, cy - bh / 2, bw, bh);
      ctx.fillStyle = 'rgba(255,255,255,.18)';
      ctx.fillRect(left + Math.max(0, bw - 3), cy - bh / 2, Math.min(3, bw), bh);

      ctx.font = UF.font.mono(20, 'bold');
      const labelY = b.sub ? cy - 3 : cy + 7;
      D.text(ctx, D.fit(ctx, b.label || '', this.labelW - 40, 1), left - 24, labelY, { color: c('paper'), spacing: 1, align: 'right' });
      if (b.sub) {
        ctx.font = UF.font.mono(15);
        D.text(ctx, D.fit(ctx, b.sub, this.labelW - 40), left - 24, cy + 21, { color: c('dim'), align: 'right' });
      }
      const size = this.rowSize();
      ctx.font = UF.font.display(size);
      const vx = left + bw + 18;
      const vw = D.text(ctx, this.valueText(b, grow), vx, cy + size * 0.36, { color: c('paper'), spacing: 1 });
      if (b.highlight && b.highlight.label && hk > 0) {
        ctx.globalAlpha = alpha * hk;
        D.pill(ctx, b.highlight.label, vx + vw + 18, cy, {
          fill: c(b.highlight.color || 'red'), font: UF.font.mono(16, 'bold'), h: 30, spacing: 3,
        });
      }
    }

    editorial() { return { factual: true }; }
  }
  UF.BarChart = BarChart;
})(window.UF);

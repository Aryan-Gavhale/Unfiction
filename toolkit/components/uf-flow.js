/*!
 * Unfiction GFX Toolkit — FlowChart (money flow / Sankey-style diagram)
 *
 *   new UF.FlowChart({
 *     nodes: [
 *       { id: 'a', x: 250, y: 330, w: 300, h: 100, title: 'ACCOUNT 1', sub: 'USD', value: 6e6, icon: 'user', at: 0.8 },
 *       { id: 'p', x: 1110, y: 525, title: 'PHILREM', icon: 'exchange', swap: { from: 'USD', to: 'PHP', at: 5.6 } },
 *       { id: 'x', ..., tag: { text: 'CASH', color: 'amber', at: 9.5 } },
 *     ],
 *     edges: [ { from: 'a', to: 'p', at: 2.2, dur: 1, weight: 6 } ],
 *   })
 *
 * x / y are node centres. Edge `weight` is the stroke width; use it to show relative amounts.
 * Edge endpoints spread automatically along the node sides when several edges meet.
 */
(function (UF) {
  'use strict';

  const { c, seg, ease, lerp } = UF;
  const D = UF.draw;

  class FlowChart extends UF.Component {
    constructor(o) {
      super({ nodes: [], edges: [], nodeW: 300, nodeH: 110, color: 'red', particleColor: 'amber' }, o);
      this.byId = {};
      for (const n of this.nodes) {
        n.w = n.w || this.nodeW;
        n.h = n.h || this.nodeH;
        n.at = n.at ?? 0;
        this.byId[n.id] = n;
      }
      this.layoutEdges();
    }

    layoutEdges() {
      const ins = {}, outs = {};
      for (const e of this.edges) {
        (outs[e.from] = outs[e.from] || []).push(e);
        (ins[e.to] = ins[e.to] || []).push(e);
      }
      const spread = (list, node, key) => {
        list.sort((a, b) => this.byId[a[key]].y - this.byId[b[key]].y);
        const n = list.length;
        list.forEach((e, i) => {
          const off = n === 1 ? 0 : lerp(-0.28, 0.28, i / (n - 1)) * node.h;
          if (key === 'from') e._inOff = off; else e._outOff = off;
        });
      };
      for (const id in ins) spread(ins[id], this.byId[id], 'from');
      for (const id in outs) spread(outs[id], this.byId[id], 'to');
      for (const e of this.edges) {
        const a = this.byId[e.from], b = this.byId[e.to];
        const x0 = a.x + a.w / 2, y0 = a.y + (e._outOff || 0);
        const x1 = b.x - b.w / 2, y1 = b.y + (e._inOff || 0);
        const k = (x1 - x0) * 0.55;
        e._pts = D.cubicPoints(x0, y0, x0 + k, y0, x1 - k, y1, x1, y1, 60);
        e.dur = e.dur ?? 1;
        e.at = e.at ?? 0;
      }
    }

    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      for (const e of this.edges) this.drawEdge(ctx, t, e);
      for (const n of this.nodes) this.drawNode(ctx, t, n, fx);
      ctx.restore();
    }

    drawEdge(ctx, t, e) {
      if (t < e.at) return;
      const p = ease.inOutCubic(seg(t, e.at, e.dur));
      const col = e.color || this.color;
      const w = e.weight || 3;
      ctx.save();
      ctx.lineCap = 'round';
      ctx.strokeStyle = c(col, 0.22);
      ctx.lineWidth = w + 8;
      D.partialPath(ctx, e._pts, p);
      ctx.stroke();
      ctx.strokeStyle = c(col);
      ctx.lineWidth = w;
      const head = D.partialPath(ctx, e._pts, p);
      ctx.stroke();
      if (head && p < 1) {
        ctx.fillStyle = c('paper');
        ctx.beginPath(); ctx.arc(head.x, head.y, Math.max(4, w * 0.6), 0, Math.PI * 2); ctx.fill();
      }
      if (p >= 1 && e.particles !== false) {
        const n = Math.round(4 + w * 0.7);
        const speed = e.speed || 0.32;
        const rad = 1.6 + w * 0.22;
        ctx.fillStyle = c(e.particleColor || this.particleColor);
        const settle = seg(t, e.at + e.dur, 0.6);
        for (let i = 0; i < n; i++) {
          const k = ((t - e.at) * speed + i / n) % 1;
          const [px, py] = D.pointAt(e._pts, k);
          ctx.globalAlpha = settle * Math.min(1, k * 8, (1 - k) * 8) * 0.95;
          ctx.beginPath(); ctx.arc(px, py, rad, 0, Math.PI * 2); ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
      if (e.label && p > 0.5) {
        const [lx, ly] = D.pointAt(e._pts, e.labelAt ?? 0.5);
        ctx.globalAlpha = seg(t, e.at + e.dur * 0.5, 0.3);
        D.pill(ctx, e.label, lx, ly - w - 18, { align: 'center', fill: c('black', 0.85), stroke: c(col), font: UF.font.mono(16, 'bold'), h: 28 });
      }
      ctx.restore();
    }

    arrivals(n) {
      return this.edges.filter(e => e.to === n.id).map(e => e.at + e.dur);
    }

    drawNode(ctx, t, n, fx) {
      if (t < n.at) return;
      const lt = t - n.at;
      const na = ease.outCubic(seg(lt, 0, 0.45));
      const s = lerp(0.94, 1, ease.outExpo(seg(lt, 0, 0.6)));
      const x = n.x - n.w / 2, y = n.y - n.h / 2;
      let flash = 0;
      for (const at of this.arrivals(n)) flash = Math.max(flash, UF.pulse(t, at, 3));

      ctx.save();
      ctx.globalAlpha *= na;
      ctx.translate(n.x, n.y);
      ctx.scale(s, s);
      ctx.translate(-n.x, -n.y);
      D.panel(ctx, x, y, n.w, n.h, {
        tickColor: c(n.accent || 'blue'), tick: 14,
        stroke: flash > 0.02 ? UF.mix('line', n.accent || this.color, flash) : c('line'),
      });

      let tx = x + 22;
      if (n.icon) {
        const bs = Math.min(64, n.h - 30);
        ctx.fillStyle = c('graphite');
        D.roundRect(ctx, tx, n.y - bs / 2, bs, bs, 4);
        ctx.fill();
        D.icon(ctx, n.icon, tx + bs / 2, n.y, bs * 0.62, { color: c(n.iconColor || 'paper'), width: 6 });
        tx += bs + 18;
      }
      const hasValue = n.value !== undefined;
      const titleY = hasValue ? n.y - n.h * 0.16 : n.y - (n.sub ? 4 : -7);
      const textW = x + n.w - 22 - tx;
      ctx.font = UF.font.mono(n.titleSize || 21, 'bold');
      D.text(ctx, D.typed(D.fit(ctx, n.title || '', textW, 2), seg(lt, 0.1, 0.5)), tx, titleY, { color: c('paper'), spacing: 2 });
      let valueW = 0;
      let v = '';
      if (hasValue) {
        const vp = ease.outExpo(seg(t, n.valueAt ?? n.at + 0.3, n.valueDur ?? 1.2));
        v = typeof n.value === 'number'
          ? `${n.prefix || ''}${D.money(n.value * vp, { compact: true, decimals: n.decimals ?? 0 })}`
          : n.value;
        ctx.font = UF.font.display(n.valueSize || 42);
        const full = typeof n.value === 'number' ? `${n.prefix || ''}${D.money(n.value, { compact: true, decimals: n.decimals ?? 0 })}` : n.value;
        valueW = D.measure(ctx, full, 1.5) + 16;
        D.text(ctx, v, x + n.w - 22, n.y + n.h * 0.36, { color: c(n.valueColor || 'paper'), spacing: 1.5, align: 'right' });
      }
      if (n.sub) {
        ctx.font = UF.font.mono(15);
        const subW = hasValue && n.h < 130 ? textW - valueW : textW;
        D.text(ctx, D.fit(ctx, n.sub, subW, 1.2), tx, titleY + 24, { color: c('dim'), spacing: 1.2 });
      }
      ctx.restore();

      if (n.tag && t >= n.tag.at) {
        const tp = ease.outBack(seg(t, n.tag.at, 0.35));
        ctx.save();
        ctx.translate(x + n.w - 18, y);
        ctx.scale(tp, tp);
        D.pill(ctx, n.tag.text, 0, 0, { align: 'right', fill: c(n.tag.color || 'red'), color: c(n.tag.textColor || 'black'), font: UF.font.mono(16, 'bold'), h: 28, spacing: 3 });
        ctx.restore();
        if (n.tag.kick !== false) fx.kick(t, n.tag.at, { rgb: 0.3, decay: 10 });
      }
      if (n.swap && t >= n.at) this.drawSwap(ctx, t, n, fx);
    }

    drawSwap(ctx, t, n, fx) {
      const sw = n.swap;
      const cx = n.x, cy = n.y + n.h / 2 + 44;
      const appear = ease.outCubic(seg(t, n.at + 0.4, 0.4));
      const p = ease.inOutCubic(seg(t, sw.at, 0.8));
      ctx.save();
      ctx.globalAlpha *= appear;
      ctx.font = UF.font.mono(22, 'bold');
      const bw = 96, gap = 70;
      const box = (label, bx, on) => {
        ctx.fillStyle = on ? c('amber') : c('graphite');
        D.roundRect(ctx, bx - bw / 2, cy - 20, bw, 40, 3);
        ctx.fill();
        if (!on) { ctx.strokeStyle = c('line'); ctx.lineWidth = 1.5; ctx.stroke(); }
        D.text(ctx, label, bx, cy + 8, { color: on ? c('black') : c('dim'), spacing: 3, align: 'center' });
      };
      box(sw.from, cx - gap - bw / 2 + 20, p < 0.5);
      box(p > 0.5 ? sw.to : D.scramble(sw.to, p * 2, 9, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'), cx + gap + bw / 2 - 20, p >= 0.5);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(p * Math.PI);
      D.icon(ctx, 'exchange', 0, 0, 40, { color: c(p > 0 && p < 1 ? 'amber' : 'paper'), width: 7 });
      ctx.restore();
      ctx.restore();
      fx.kick(t, sw.at + 0.4, { rgb: 0.35, flash: 0.08, decay: 10 });
    }

    editorial() { return { factual: true }; }
  }

  UF.FlowChart = FlowChart;
})(window.UF);

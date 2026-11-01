/*!
 * Unfiction GFX Toolkit — NetworkSpread
 * Infection spreading machine to machine through a network until it reaches a target,
 * then everything freezes and a "waiting" timer counts up.
 *
 *   new UF.NetworkSpread({
 *     cols: 9, rows: 5, start: [0, 4], target: { col: 8, row: 0, label: 'SWIFT TERMINAL' },
 *     startLabel: 'ONE INFECTED PC', at: 0.3, infectAt: 2, hop: 0.5,
 *     wait: { label: 'WAITING', to: 12, unit: 'MONTHS', dur: 3 },
 *   })
 */
(function (UF) {
  'use strict';

  const { c, seg, ease, lerp } = UF;
  const D = UF.draw;
  const W = UF.W, H = UF.H;

  class NetworkSpread extends UF.Component {
    constructor(o) {
      super({
        cols: 9, rows: 5, x0: 260, x1: 1660, y0: 290, y1: 830, jitter: 0.32,
        start: [0, 4], target: { col: 8, row: 0, label: 'TARGET', icon: 'server' }, startLabel: '',
        infectAt: 2, hop: 0.5, wait: null, seed: 15, nodeSize: 46,
      }, o);
      this.build();
    }

    build() {
      const r = UF.rng(this.seed);
      const dx = (this.x1 - this.x0) / (this.cols - 1), dy = (this.y1 - this.y0) / (this.rows - 1);
      const id = (col, row) => row * this.cols + col;
      this.nodes = [];
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          this.nodes.push({
            x: this.x0 + col * dx + (r() - 0.5) * this.jitter * dx,
            y: this.y0 + row * dy + (r() - 0.5) * this.jitter * dy,
            adj: [],
          });
        }
      }
      const tgt = this.nodes[id(this.target.col, this.target.row)];
      tgt.x = this.x0 + this.target.col * dx;
      tgt.y = this.y0 + this.target.row * dy;
      this.edges = [];
      const link = (a, b) => { this.edges.push([a, b]); this.nodes[a].adj.push(b); this.nodes[b].adj.push(a); };
      for (let row = 0; row < this.rows; row++) {
        for (let col = 0; col < this.cols; col++) {
          const a = id(col, row);
          if (col + 1 < this.cols && r() > 0.12) link(a, id(col + 1, row));
          if (row + 1 < this.rows && r() > 0.18) link(a, id(col, row + 1));
          if (col + 1 < this.cols && row + 1 < this.rows && r() < 0.3) link(a, id(col + 1, row + 1));
          if (col > 0 && row + 1 < this.rows && r() < 0.18) link(a, id(col - 1, row + 1));
        }
      }
      const s = id(this.start[0], this.start[1]);
      const dist = new Array(this.nodes.length).fill(Infinity);
      const parent = new Array(this.nodes.length).fill(-1);
      dist[s] = 0;
      const q = [s];
      while (q.length) {
        const u = q.shift();
        for (const v of this.nodes[u].adj) if (dist[v] === Infinity) { dist[v] = dist[u] + 1; parent[v] = u; q.push(v); }
      }
      if (dist[id(this.target.col, this.target.row)] === Infinity) {
        this.seed += 1;
        this.build();
        return;
      }
      this.nodes.forEach((n, i) => {
        n.dist = dist[i];
        n.parent = parent[i];
        n.t = dist[i] === Infinity ? Infinity : this.infectAt + dist[i] * this.hop + r() * this.hop * 0.4;
      });
      this.startId = s;
      this.targetId = id(this.target.col, this.target.row);
      this.path = new Set();
      for (let v = this.targetId; v !== -1 && parent[v] !== -1; v = parent[v]) this.path.add(`${Math.min(v, parent[v])}-${Math.max(v, parent[v])}`);
      this.freezeAt = this.nodes[this.targetId].t + 0.45;
    }

    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      const lt = t - this.at;
      const tt = Math.min(t, this.freezeAt);
      const frozen = seg(t, this.freezeAt, 0.4);
      ctx.save();
      ctx.globalAlpha = a;

      for (const [i, j] of this.edges) {
        const A = this.nodes[i], B = this.nodes[j];
        const ea = seg(lt, 0.2 + (A.x - this.x0) / (this.x1 - this.x0) * 0.8, 0.4);
        if (ea <= 0) continue;
        ctx.globalAlpha = a * ea;
        ctx.strokeStyle = c('line');
        ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(A.x, A.y); ctx.lineTo(B.x, B.y); ctx.stroke();
        const [E, L] = A.t <= B.t ? [A, B] : [B, A];
        if (tt < E.t) continue;
        const onPath = this.path.has(`${Math.min(i, j)}-${Math.max(i, j)}`);
        const tree = L.dist === E.dist + 1;
        const p = tree ? seg(tt, E.t, Math.max(0.05, L.t - E.t)) : seg(tt, L.t, 0.3);
        if (p <= 0) continue;
        ctx.strokeStyle = c('red', onPath && t >= this.nodes[this.targetId].t ? 1 : 0.55);
        ctx.lineWidth = onPath && t >= this.nodes[this.targetId].t ? 4 : 2.5;
        ctx.beginPath();
        ctx.moveTo(E.x, E.y);
        ctx.lineTo(lerp(E.x, L.x, p), lerp(E.y, L.y, p));
        ctx.stroke();
      }

      this.nodes.forEach((n, i) => {
        const na = ease.outBack(seg(lt, 0.1 + (n.x - this.x0) / (this.x1 - this.x0) * 0.8, 0.4));
        if (na <= 0) return;
        const isT = i === this.targetId;
        const inf = tt >= n.t;
        const flash = inf ? UF.pulse(tt, n.t, 5) : 0;
        const s = (isT ? 1.7 : 1) * this.nodeSize * na * (1 + flash * 0.25);
        ctx.globalAlpha = a;
        if (inf) {
          const g = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, s * 1.6);
          g.addColorStop(0, c('red', 0.35 + flash * 0.3));
          g.addColorStop(1, c('red', 0));
          ctx.fillStyle = g;
          ctx.fillRect(n.x - s * 1.6, n.y - s * 1.6, s * 3.2, s * 3.2);
        }
        ctx.fillStyle = inf ? '#2a0c0f' : c('panel');
        D.roundRect(ctx, n.x - s / 2, n.y - s / 2, s, s, 6);
        ctx.fill();
        ctx.strokeStyle = inf ? c('red') : isT ? c('blue') : c('line');
        ctx.lineWidth = isT ? 3 : 2;
        ctx.stroke();
        D.icon(ctx, isT ? (this.target.icon || 'server') : 'computer', n.x, n.y, s * 0.62, { color: inf ? c('red') : isT ? c('paper') : c('dim'), width: 6 });
        if (isT && this.target.label) {
          ctx.font = UF.font.mono(20, 'bold');
          D.text(ctx, this.target.label, n.x, n.y - s / 2 - 18, { color: inf ? c('red') : c('paper'), spacing: 4, align: 'center' });
        }
        if (i === this.startId && this.startLabel && inf) {
          ctx.globalAlpha = a * seg(tt, n.t, 0.4);
          ctx.font = UF.font.mono(18, 'bold');
          D.text(ctx, this.startLabel, n.x, n.y + s / 2 + 34, { color: c('red'), spacing: 3, align: 'center' });
        }
      });
      fx.kick(t, this.nodes[this.targetId].t, { shake: 0.008, rgb: 0.7, flash: 0.2, glitch: 0.6, glitchDur: 0.06, decay: 10 });
      fx.kick(t, this.nodes[this.startId].t, { rgb: 0.4, decay: 10 });

      if (frozen > 0) {
        ctx.globalAlpha = a * frozen * 0.55;
        ctx.fillStyle = c('black');
        ctx.fillRect(0, 0, W, H);
        if (this.wait) this.drawWait(ctx, t, a * frozen);
      }
      ctx.restore();
    }

    drawWait(ctx, t, alpha) {
      const w = this.wait;
      const t0 = this.freezeAt + 0.4;
      const p = ease.inOutCubic(seg(t, t0 + 0.3, w.dur ?? 3));
      const v = Math.round(lerp(w.from ?? 0, w.to ?? 12, p));
      const cx = W / 2, cy = H / 2;
      ctx.globalAlpha = alpha;
      D.panel(ctx, cx - 330, cy - 170, 660, 340, { tickColor: c('red') });
      const dots = '.'.repeat(1 + (Math.floor(t * 2.5) % 3));
      ctx.font = UF.font.mono(26, 'bold');
      D.text(ctx, `${w.label || 'WAITING'}${dots}`, cx - 120, cy - 92, { color: c('red'), spacing: 8 });
      ctx.font = UF.font.display(170);
      D.text(ctx, String(v).padStart(2, '0'), cx - 40, cy + 92, { color: c('paper'), spacing: 4, align: 'right' });
      ctx.font = UF.font.mono(34, 'bold');
      D.text(ctx, w.unit || 'MONTHS', cx - 10, cy + 88, { color: c('dim'), spacing: 6 });
      ctx.fillStyle = c('line');
      ctx.fillRect(cx - 270, cy + 120, 540, 4);
      ctx.fillStyle = c('red');
      ctx.fillRect(cx - 270, cy + 120, 540 * p, 4);
    }

    editorial() { return { factual: true }; }
  }

  UF.NetworkSpread = NetworkSpread;
})(window.UF);

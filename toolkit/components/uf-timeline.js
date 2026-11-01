/*!
 * Unfiction GFX Toolkit — Timeline and TimeChip
 *
 *   new UF.Timeline({
 *     events: [ { at: 0.6, pos: 0.0, date: 'FRI 5 FEB', time: '10:30', text: 'Printer tray empty' },
 *               { at: 2.4, pos: 0.4, date: 'SAT 6 FEB', time: '12:30', text: 'Messages printed by hand', color: 'red' } ],
 *   })
 *   Events appear at `at`; the red progress line follows the latest event.
 *
 *   new UF.TimeChip({ items: [ { at: 0.3, date: 'FRIDAY 5 FEB', time: '10:30 AM', place: 'DHAKA' },
 *                              { at: 4.0, date: 'SATURDAY 6 FEB', time: '12:30 PM', place: 'DHAKA' } ] })
 *   A compact date/time chip for overlays on ANIM shots; switches with a digit scramble.
 */
(function (UF) {
  'use strict';

  const { c, seg, ease, lerp } = UF;
  const D = UF.draw;
  const W = UF.W;

  class Timeline extends UF.Component {
    constructor(o) { super({ x0: 180, x1: W - 180, y: 600, events: [], lineDur: 0.9, textWidth: 300 }, o); }

    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      const lt = t - this.at;
      const lp = ease.outExpo(seg(lt, 0, this.lineDur));
      const X = pos => lerp(this.x0, this.x1, pos);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.fillStyle = c('line');
      ctx.fillRect(this.x0, this.y - 1.5, (this.x1 - this.x0) * lp, 3);
      for (let i = 0; i <= 20; i++) {
        const x = lerp(this.x0, this.x1, i / 20);
        if (x > this.x0 + (this.x1 - this.x0) * lp) break;
        ctx.fillRect(x - 1, this.y - (i % 5 ? 5 : 10), 2, i % 5 ? 10 : 20);
      }

      let head = null, headAt = -1;
      for (const e of this.events) if (t >= e.at && e.at > headAt) { head = e; headAt = e.at; }
      let prog = 0;
      const shown = this.events.filter(e => t >= e.at).sort((p, q) => p.at - q.at);
      if (shown.length) {
        const last = shown[shown.length - 1];
        const prev = shown.length > 1 ? shown[shown.length - 2].pos : 0;
        prog = lerp(prev, last.pos, ease.inOutCubic(seg(t, last.at, 0.7)));
      }
      ctx.fillStyle = c('red');
      ctx.fillRect(this.x0, this.y - 2, X(prog) - this.x0, 4);

      this.events.forEach((e, i) => {
        if (t < e.at) return;
        const ep = seg(t, e.at + 0.35, 0.5);
        const x = X(e.pos);
        const active = e === head;
        const col = c(e.color || (active ? 'red' : 'paper'));
        const up = e.side ? e.side === 'up' : i % 2 === 0;
        ctx.globalAlpha = a * ep * (active ? 1 : 0.62);
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(x, this.y, active ? 9 : 6, 0, Math.PI * 2); ctx.fill();
        if (active) {
          const ph = ((t - e.at) % 1.6) / 1.6;
          ctx.strokeStyle = col;
          ctx.lineWidth = 2;
          ctx.globalAlpha = a * ep * (1 - ph);
          ctx.beginPath(); ctx.arc(x, this.y, 9 + ph * 26, 0, Math.PI * 2); ctx.stroke();
          ctx.globalAlpha = a * ep;
        }
        const stem = 46 * ease.outExpo(ep);
        ctx.fillStyle = col;
        ctx.fillRect(x - 1, up ? this.y - 12 - stem : this.y + 12, 2, stem);
        const ty = up ? this.y - 70 : this.y + 92;
        ctx.font = UF.font.mono(20, 'bold');
        D.text(ctx, e.date || '', x, ty - (up ? 60 : 0), { color: col, spacing: 3, align: 'center' });
        if (e.time) {
          ctx.font = UF.font.display(44);
          D.text(ctx, e.time, x, ty - (up ? 14 : -46), { color: c('paper'), spacing: 1, align: 'center' });
        }
        if (e.text) {
          ctx.font = UF.font.sans(22);
          const lines = D.wrap(ctx, e.text, this.textWidth);
          lines.forEach((ln, k) => {
            const yy = up ? ty - 100 - (lines.length - 1 - k) * 28 : ty + 84 + k * 28;
            D.text(ctx, D.typed(ln, seg(t, e.at + 0.5 + k * 0.15, 0.5)), x, yy, { color: c('dim'), align: 'center' });
          });
        }
        if (e.kick !== false) fx.kick(t, e.at, { rgb: 0.2, decay: 10 });
      });
      ctx.restore();
    }

    editorial() { return { factual: true }; }
  }
  UF.Timeline = Timeline;

  class TimeChip extends UF.Component {
    constructor(o) { super({ x: 96, y: 96, items: [], align: 'left' }, o); }
    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0 || !this.items.length) return;
      let idx = -1;
      this.items.forEach((it, i) => { if (t >= it.at) idx = i; });
      if (idx < 0) return;
      const it = this.items[idx];
      const sw = seg(t, it.at, 0.45);
      const enter = ease.outExpo(seg(t, this.items[0].at, 0.7));
      const time = sw < 1 ? D.scramble(it.time || '', sw, Math.floor(t * 24), '0123456789') : it.time || '';
      ctx.save();
      ctx.globalAlpha = a * enter;
      ctx.font = UF.font.display(58);
      const tw = D.measure(ctx, it.time || '', 2);
      ctx.font = UF.font.mono(20, 'bold');
      const dw = Math.max(D.measure(ctx, it.date || '', 4), D.measure(ctx, it.place || '', 4));
      const w = 44 + tw + 30 + dw + 36;
      const h = 104;
      const x = this.align === 'right' ? this.x - w : this.x;
      ctx.fillStyle = c('black', 0.8);
      ctx.fillRect(x, this.y, w * enter, h);
      ctx.fillStyle = c('red');
      ctx.fillRect(x, this.y, 6, h);
      ctx.save();
      ctx.beginPath(); ctx.rect(x, this.y, w * enter, h); ctx.clip();
      ctx.font = UF.font.display(58);
      D.text(ctx, time, x + 30, this.y + 74, { color: c('paper'), spacing: 2 });
      ctx.fillStyle = c('line');
      ctx.fillRect(x + 30 + tw + 16, this.y + 20, 2, h - 40);
      ctx.font = UF.font.mono(20, 'bold');
      ctx.globalAlpha = a * enter * seg(t, it.at + 0.15, 0.4);
      D.text(ctx, it.date || '', x + 30 + tw + 34, this.y + 46, { color: c('paper'), spacing: 4 });
      ctx.font = UF.font.mono(18);
      D.text(ctx, it.place || '', x + 30 + tw + 34, this.y + 76, { color: c('dim'), spacing: 4 });
      ctx.restore();
      ctx.restore();
      if (idx > 0) fx.kick(t, it.at, { rgb: 0.3, decay: 10 });
    }
  }
  UF.TimeChip = TimeChip;
})(window.UF);

/*!
 * Unfiction GFX Toolkit — WorldClocks and CalendarStrip
 *
 *   new UF.WorldClocks({
 *     clocks: [ { city: 'DHAKA', zone: 'UTC+6', from: 'THU 09:00', time: 'THU 20:36',
 *                 notes: [{ at: 7, text: 'GOING HOME', color: 'red' }] }, ... ],
 *     at: 0.4, spinAt: 4.5, spinDur: 2.2,
 *     focus: [{ at: 11, dur: 3.5, index: 0 }],
 *   })
 *
 *   new UF.CalendarStrip({
 *     days: ['THU 4', 'FRI 5', 'SAT 6', 'SUN 7', 'MON 8'], rows: ['DHAKA', 'NEW YORK', 'MANILA'],
 *     marks: [{ row: 0, from: 1, to: 3, at: 11, label: 'WEEKEND' }],      // columns: from inclusive, to exclusive
 *     markers: [{ row: 0, pos: 0.86, at: 7.5, label: '20:36' }],          // fractional column position
 *     merge: { at: 24, from: 0.86, to: 5, label: '≈ 5 DAYS' },
 *   })
 */
(function (UF) {
  'use strict';

  const { c, clamp, seg, ease, lerp } = UF;
  const D = UF.draw;
  const W = UF.W;
  const DAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
  const DAY_NAMES = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

  /** 'THU 20:36' or '20:36' -> absolute minutes in a Mon-based week. */
  function parseTime(s) {
    const m = String(s).trim().toUpperCase().match(/^(?:([A-Z]{3})\s+)?(\d{1,2}):(\d{2})$/);
    if (!m) throw new Error(`Bad clock time "${s}" — use "THU 20:36" or "20:36".`);
    const d = m[1] ? DAYS.indexOf(m[1]) : 0;
    return Math.max(0, d) * 1440 + parseInt(m[2], 10) * 60 + parseInt(m[3], 10);
  }
  UF.parseClock = parseTime;

  /* ------------------------------------------------------------------ */
  /* WorldClocks                                                         */
  /* ------------------------------------------------------------------ */
  class WorldClocks extends UF.Component {
    constructor(o) {
      super({ x: W / 2, y: 300, radius: 116, gap: 520, clocks: [], spinAt: 1, spinDur: 2.2, stagger: 0.15, focus: [], digital: true }, o);
    }

    minutesAt(clk, t) {
      if (clk.times) {
        let cur = parseTime(clk.times[0].value);
        for (let i = 1; i < clk.times.length; i++) {
          const k = clk.times[i];
          if (t < k.at) break;
          const p = ease.inOutCubic(seg(t, k.at, k.dur ?? this.spinDur));
          cur = lerp(cur, parseTime(k.value), p);
        }
        return cur;
      }
      const to = parseTime(clk.time);
      const from = clk.from !== undefined ? parseTime(clk.from) : to;
      return lerp(from, to, ease.inOutCubic(seg(t, this.spinAt, this.spinDur)));
    }

    focusAt(t, i) {
      let f = 0, any = 0;
      for (const fc of this.focus) {
        const w = UF.win(t, fc.at, fc.at + (fc.dur ?? 3), 0.4, 0.5);
        any = Math.max(any, w);
        if (fc.index === i || (Array.isArray(fc.index) && fc.index.includes(i))) f = Math.max(f, w);
      }
      return { f, dim: any * (1 - f) };
    }

    draw(ctx, t) {
      const a = this.vis(t);
      if (a <= 0) return;
      const n = this.clocks.length;
      this.clocks.forEach((clk, i) => {
        const cx = this.x + (i - (n - 1) / 2) * this.gap;
        const ca = a * ease.outCubic(seg(t, this.at + i * this.stagger, 0.6));
        if (ca <= 0) return;
        const { f, dim } = this.focusAt(t, i);
        ctx.save();
        ctx.globalAlpha = ca * (1 - dim * 0.6);
        const rise = (1 - ease.outExpo(seg(t, this.at + i * this.stagger, 0.9))) * 30;
        this.drawClock(ctx, t, clk, cx, this.y + rise, f);
        ctx.restore();
      });
    }

    drawClock(ctx, t, clk, cx, cy, focus) {
      const r = this.radius;
      const mins = this.minutesAt(clk, t);
      const dayMin = ((mins % 1440) + 1440) % 1440;
      const hour = dayMin / 60;
      const dayness = clamp((hour - 5.5) / 1) * clamp((18.5 - hour) / 1);
      const accent = UF.mix('blue', 'amber', dayness);

      const glow = ctx.createRadialGradient(cx, cy, r * 0.8, cx, cy, r * 1.6);
      glow.addColorStop(0, UF.mix('blue', 'amber', dayness, 0.16 + focus * 0.22));
      glow.addColorStop(1, UF.mix('blue', 'amber', dayness, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(cx - r * 1.6, cy - r * 1.6, r * 3.2, r * 3.2);

      const face = ctx.createRadialGradient(cx, cy - r * 0.3, r * 0.1, cx, cy, r);
      face.addColorStop(0, '#161b22');
      face.addColorStop(1, '#0a0c0f');
      ctx.fillStyle = face;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = c('line');
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = accent;
      ctx.lineWidth = 3 + focus * 2;
      ctx.beginPath(); ctx.arc(cx, cy, r + 9, 0, Math.PI * 2); ctx.stroke();

      for (let i = 0; i < 60; i++) {
        const ang = i / 60 * Math.PI * 2;
        const major = i % 5 === 0;
        const r0 = r - (major ? 17 : 8), r1 = r - 4;
        ctx.strokeStyle = major ? c('paper', 0.85) : c('dim', 0.45);
        ctx.lineWidth = major ? 3 : 1.4;
        ctx.beginPath();
        ctx.moveTo(cx + Math.sin(ang) * r0, cy - Math.cos(ang) * r0);
        ctx.lineTo(cx + Math.sin(ang) * r1, cy - Math.cos(ang) * r1);
        ctx.stroke();
      }
      ctx.font = UF.font.mono(r * 0.15, 'bold');
      ctx.fillStyle = c('dim');
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      [['12', 0, -1], ['3', 1, 0], ['6', 0, 1], ['9', -1, 0]].forEach(([s, dx, dy]) => ctx.fillText(s, cx + dx * r * 0.7, cy + dy * r * 0.7));

      const iy = cy + r * 0.36;
      if (dayness < 1) D.icon(ctx, 'moon', cx, iy, r * 0.3, { color: c('blue'), width: 7, fill: c('blue', 0.25 * (1 - dayness)) });
      if (dayness > 0) {
        ctx.save(); ctx.globalAlpha *= dayness;
        D.icon(ctx, 'sun', cx, iy, r * 0.32, { color: c('amber'), width: 7 });
        ctx.restore();
      }

      const hand = (ang, len, w, col, tail = 0) => {
        ctx.strokeStyle = col;
        ctx.lineWidth = w;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(cx - Math.sin(ang) * tail, cy + Math.cos(ang) * tail);
        ctx.lineTo(cx + Math.sin(ang) * len, cy - Math.cos(ang) * len);
        ctx.stroke();
      };
      const settled = t > this.spinAt + this.spinDur || !!clk.times;
      const secs = settled ? Math.floor(t) % 60 : (mins * 60) % 60;
      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.6)';
      ctx.shadowBlur = 8;
      hand((hour % 12) / 12 * Math.PI * 2, r * 0.5, 7, c('paper'));
      hand((dayMin % 60) / 60 * Math.PI * 2, r * 0.74, 4.5, c('paper'));
      hand(secs / 60 * Math.PI * 2, r * 0.84, 2, c('red'), r * 0.16);
      ctx.restore();
      ctx.fillStyle = c('red');
      ctx.beginPath(); ctx.arc(cx, cy, 7, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = c('paper');
      ctx.beginPath(); ctx.arc(cx, cy, 2.5, 0, Math.PI * 2); ctx.fill();

      ctx.font = UF.font.display(r * 0.4);
      D.text(ctx, clk.city, cx, cy - r - 52, { color: c('paper'), spacing: 4, align: 'center' });
      if (clk.zone) {
        ctx.font = UF.font.mono(17);
        D.text(ctx, clk.zone, cx, cy - r - 24, { color: c('dim'), spacing: 4, align: 'center' });
      }
      if (this.digital) {
        const hh = String(Math.floor(hour)).padStart(2, '0'), mm = String(Math.floor(dayMin % 60)).padStart(2, '0');
        ctx.font = UF.font.mono(r * 0.36, 'bold');
        D.text(ctx, `${hh}:${mm}`, cx, cy + r + 58, { color: c('paper'), spacing: 2, align: 'center' });
        const di = ((Math.floor(mins / 1440) % 7) + 7) % 7;
        ctx.font = UF.font.mono(18);
        D.text(ctx, DAY_NAMES[di], cx, cy + r + 88, { color: accent, spacing: 6, align: 'center' });
      }
      for (const nt of clk.notes || []) {
        const na = UF.win(t, nt.at, nt.out ?? Infinity, 0.3, 0.4);
        if (na <= 0) continue;
        ctx.save();
        ctx.globalAlpha *= na;
        const s = 0.9 + 0.1 * ease.outBack(seg(t, nt.at, 0.35));
        ctx.translate(cx, cy + r + 128);
        ctx.scale(s, s);
        D.pill(ctx, nt.text, 0, 0, { align: 'center', fill: c(nt.color || 'graphite'), font: UF.font.mono(17, 'bold'), h: 32, spacing: 3 });
        ctx.restore();
      }
    }
  }
  UF.WorldClocks = WorldClocks;

  /* ------------------------------------------------------------------ */
  /* CalendarStrip                                                       */
  /* ------------------------------------------------------------------ */
  class CalendarStrip extends UF.Component {
    constructor(o) {
      super({
        x: 160, y: 610, labelW: 250, cellW: 272, rowH: 84, headH: 60, gapY: 8,
        days: [], rows: [], month: '', marks: [], markers: [], columns: [], merge: null,
      }, o);
    }

    colX(col) { return this.x + this.labelW + col * this.cellW; }
    rowY(row) { return this.y + this.headH + this.gapY + row * this.rowH; }

    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      const lt = t - this.at;
      const nC = this.days.length, nR = this.rows.length;
      const mg = this.merge ? ease.inOutCubic(seg(t, this.merge.at, 1.2)) : 0;
      const dimGrid = 1 - 0.55 * mg;
      ctx.save();
      ctx.globalAlpha = a;

      if (this.month) {
        ctx.font = UF.font.mono(18, 'bold');
        D.text(ctx, this.month, this.x, this.y + this.headH * 0.62, { color: c('red'), spacing: 6 });
      }
      this.days.forEach((d, ci) => {
        const ca = ease.outCubic(seg(lt, ci * 0.07, 0.5));
        if (ca <= 0) return;
        const [dow, ...rest] = String(d).split(' ');
        const x = this.colX(ci);
        ctx.globalAlpha = a * ca;
        ctx.fillStyle = c('graphite');
        ctx.fillRect(x + 3, this.y, this.cellW - 6, this.headH);
        ctx.font = UF.font.mono(20, 'bold');
        D.text(ctx, dow, x + 22, this.y + this.headH * 0.64, { color: c('dim'), spacing: 5 });
        ctx.font = UF.font.display(40);
        D.text(ctx, rest.join(' '), x + this.cellW - 22, this.y + this.headH * 0.76, { color: c('paper'), align: 'right' });
      });

      this.rows.forEach((label, ri) => {
        const y = this.rowY(ri);
        const ra = ease.outCubic(seg(lt, 0.2 + ri * 0.12, 0.5));
        if (ra <= 0) return;
        ctx.globalAlpha = a * ra * dimGrid;
        ctx.font = UF.font.mono(22, 'bold');
        D.text(ctx, label, this.x, y + this.rowH * 0.56, { color: c('paper'), spacing: 4 });
        for (let ci = 0; ci < nC; ci++) {
          const x = this.colX(ci);
          ctx.fillStyle = c('panel', 0.9);
          ctx.fillRect(x + 3, y + 3, this.cellW - 6, this.rowH - 6);
          ctx.strokeStyle = c('line');
          ctx.lineWidth = 1;
          ctx.strokeRect(x + 3.5, y + 3.5, this.cellW - 7, this.rowH - 7);
        }
      });

      for (const col of this.columns) {
        const ca = UF.win(t, col.at, col.out ?? Infinity, 0.3, 0.4) * dimGrid;
        if (ca <= 0) continue;
        const x = this.colX(col.col);
        ctx.globalAlpha = a * ca;
        ctx.strokeStyle = c(col.color || 'paper', 0.9);
        ctx.lineWidth = 2.5;
        ctx.strokeRect(x + 1, this.y - 4, this.cellW - 2, this.headH + this.gapY + nR * this.rowH + 4);
        if (col.label) {
          ctx.font = UF.font.mono(16, 'bold');
          D.text(ctx, col.label, x + this.cellW / 2, this.y - 16, { color: c(col.color || 'paper'), spacing: 4, align: 'center' });
        }
      }

      const merged = this.merge ? this.mergeRect() : null;
      for (const m of this.marks) {
        if (t < m.at) continue;
        const sw = ease.outExpo(seg(t, m.at, 0.7));
        const x0 = this.colX(m.from) + 6, x1 = this.colX(m.to) - 6;
        const y0 = this.rowY(m.row) + 8, y1 = y0 + this.rowH - 16;
        let r = { x: x0, y: y0, w: (x1 - x0) * sw, h: y1 - y0 };
        if (merged && mg > 0) r = { x: lerp(r.x, merged.x, mg), y: lerp(r.y, merged.y, mg), w: lerp(r.w, merged.w, mg), h: lerp(r.h, merged.h, mg) };
        const colr = m.color || 'blue';
        ctx.globalAlpha = a * (1 - (mg >= 1 ? 1 : 0));
        ctx.fillStyle = c(colr, 0.28);
        ctx.fillRect(r.x, r.y, r.w, r.h);
        ctx.strokeStyle = c(colr);
        ctx.lineWidth = 2.5;
        ctx.strokeRect(r.x, r.y, r.w, r.h);
        if (m.label && mg < 0.4) {
          ctx.save();
          ctx.globalAlpha = a * seg(t, m.at + 0.25, 0.4) * (1 - mg / 0.4);
          ctx.beginPath(); ctx.rect(r.x, r.y, r.w, r.h); ctx.clip();
          ctx.font = UF.font.mono(m.size || 22, 'bold');
          D.text(ctx, m.label, r.x + (x1 - x0) / 2, r.y + r.h / 2 + 8, { color: c('paper'), spacing: 5, align: 'center' });
          ctx.restore();
        }
        if (m.kick !== false) fx.kick(t, m.at, { rgb: 0.25, decay: 9 });
      }

      for (const mk of this.markers) {
        const ma = UF.win(t, mk.at, mk.out ?? Infinity, 0.3, 0.4) * dimGrid;
        if (ma <= 0) continue;
        const x = this.colX(mk.pos);
        const y0 = this.rowY(mk.row), y1 = y0 + this.rowH;
        const grow = ease.outExpo(seg(t, mk.at, 0.5));
        ctx.globalAlpha = a * ma;
        ctx.fillStyle = c(mk.color || 'red');
        ctx.fillRect(x - 1.5, y1 - (y1 - y0 + 10) * grow, 3, (y1 - y0 + 10) * grow);
        ctx.beginPath(); ctx.arc(x, y1 - (y1 - y0 + 10) * grow, 6, 0, Math.PI * 2); ctx.fill();
        if (mk.label) {
          ctx.font = UF.font.mono(17, 'bold');
          D.text(ctx, mk.label, x - 14, y0 + this.rowH * 0.6, { color: c(mk.color || 'red'), spacing: 2, align: 'right' });
        }
      }

      if (merged && mg > 0) {
        const done = seg(t, this.merge.at + 1.1, 0.5);
        const r = merged;
        if (done > 0) {
          const pulse = 0.5 + 0.5 * Math.sin((t - this.merge.at) * 3.2);
          ctx.globalAlpha = a * done;
          const g = ctx.createLinearGradient(0, r.y - 40, 0, r.y + r.h + 40);
          g.addColorStop(0, c('red', 0));
          g.addColorStop(0.5, c('red', 0.25 + 0.1 * pulse));
          g.addColorStop(1, c('red', 0));
          ctx.fillStyle = g;
          ctx.fillRect(r.x - 30, r.y - 40, r.w + 60, r.h + 80);
          ctx.fillStyle = c('red', 0.42);
          ctx.fillRect(r.x, r.y, r.w, r.h);
          ctx.strokeStyle = c('red');
          ctx.lineWidth = 3;
          ctx.strokeRect(r.x, r.y, r.w, r.h);
          ctx.fillStyle = c('paper');
          ctx.fillRect(r.x - 2, r.y - 14, 4, r.h + 28);
          ctx.fillRect(r.x + r.w - 2, r.y - 14, 4, r.h + 28);
          const lp = ease.outExpo(seg(t, this.merge.at + 1.3, 0.8));
          ctx.font = UF.font.display(this.merge.size || 64);
          ctx.globalAlpha = a * lp;
          D.text(ctx, this.merge.label || '', r.x + r.w / 2, r.y + r.h / 2 + (this.merge.size || 64) * 0.36, { color: c('paper'), spacing: lerp(30, 8, lp), align: 'center' });
          if (this.merge.sub) {
            ctx.font = UF.font.mono(20, 'bold');
            ctx.globalAlpha = a * seg(t, this.merge.at + 1.8, 0.5);
            D.text(ctx, this.merge.sub, r.x + r.w / 2, this.rowY(this.rows.length) + 44, { color: c('paper'), spacing: 6, align: 'center' });
          }
          fx.kick(t, this.merge.at + 1.15, { shake: 0.006, flash: 0.18, rgb: 0.5, decay: 8 });
        }
      }
      ctx.restore();
    }

    mergeRect() {
      const m = this.merge;
      const row = m.row ?? (this.rows.length - 1) / 2;
      const x0 = this.colX(m.from ?? 0), x1 = this.colX(m.to ?? this.days.length);
      const y = this.rowY(row) + 4;
      return { x: x0, y, w: x1 - x0, h: this.rowH - 8 };
    }
  }
  UF.CalendarStrip = CalendarStrip;
})(window.UF);

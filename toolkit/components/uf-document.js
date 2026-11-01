/*!
 * Unfiction GFX Toolkit — EmailCard
 * A recreated email in a generic mail window, with typed body, a link, and an optional click.
 *
 *   new UF.EmailCard({
 *     from: 'Rasel Ahlam', to: 'Bangladesh Bank staff', subject: 'Job application', date: 'January 2015',
 *     body: 'Dear Sir,\nI am very enthusiastic to work in your organisation…',
 *     link: 'Download my CV and cover letter',
 *     label: 'RECREATION', note: 'Recreation based on FBI complaint, 2018',
 *     at: 0.2, typeAt: 1.4, clickAt: 6,
 *   })
 * Every name, address and line of text is yours to write; nothing is fetched.
 */
(function (UF) {
  'use strict';

  const { c, seg, ease, lerp } = UF;
  const D = UF.draw;
  const W = UF.W, H = UF.H;

  class EmailCard extends UF.Component {
    constructor(o) {
      super({
        from: '', fromAddr: '', to: '', subject: '', date: '', body: '', link: '',
        label: 'RECREATION', note: '', app: 'INBOX',
        x: W / 2, y: H / 2, w: 1240, h: 700, typeAt: 1.4, cps: 45, clickAt: null,
      }, o);
    }

    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      const lt = t - this.at;
      const enter = ease.outExpo(seg(lt, 0, 0.9));
      const x = this.x - this.w / 2, y = this.y - this.h / 2 + (1 - enter) * 50;
      const ink = '#1f2328', inkDim = '#6a6f76', rule = 'rgba(31,35,40,.14)';
      ctx.save();
      ctx.globalAlpha = a * enter;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.7)';
      ctx.shadowBlur = 70;
      ctx.shadowOffsetY = 26;
      ctx.fillStyle = '#f3f1ec';
      D.roundRect(ctx, x, y, this.w, this.h, 10);
      ctx.fill();
      ctx.restore();

      ctx.save();
      D.roundRect(ctx, x, y, this.w, this.h, 10);
      ctx.clip();
      ctx.fillStyle = c('graphite');
      ctx.fillRect(x, y, this.w, 58);
      ['#c1121f', '#d9a441', '#4caf7a'].forEach((col, i) => { ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + 30 + i * 24, y + 29, 7, 0, Math.PI * 2); ctx.fill(); });
      ctx.font = UF.font.mono(18, 'bold');
      D.text(ctx, this.app, x + this.w / 2, y + 36, { color: c('dim'), spacing: 6, align: 'center' });
      ctx.restore();

      if (this.label) {
        ctx.font = UF.font.mono(16, 'bold');
        D.pill(ctx, this.label, x + this.w - 24, y + 29, { align: 'right', fill: c('red'), font: UF.font.mono(15, 'bold'), h: 28, spacing: 3 });
      }

      const fx0 = x + 60;
      let fy = y + 116;
      ctx.font = UF.font.sans(34, '600');
      D.text(ctx, D.typed(this.subject, seg(lt, 0.4, 0.5)), fx0, fy, { color: ink });
      fy += 28;
      ctx.fillStyle = rule;
      ctx.fillRect(fx0, fy, this.w - 120, 1.5);
      fy += 46;

      ctx.fillStyle = c('blue');
      ctx.beginPath(); ctx.arc(fx0 + 26, fy - 8, 26, 0, Math.PI * 2); ctx.fill();
      ctx.font = UF.font.sans(24, '700');
      D.text(ctx, (this.from || '?').trim().charAt(0).toUpperCase(), fx0 + 26, fy, { color: '#fff', align: 'center' });
      ctx.font = UF.font.sans(24, '600');
      const nameW = D.measure(ctx, this.from);
      D.text(ctx, this.from, fx0 + 70, fy - 14, { color: ink });
      if (this.fromAddr) {
        ctx.font = UF.font.sans(20);
        D.text(ctx, this.fromAddr, fx0 + 70 + nameW + 12, fy - 14, { color: inkDim });
      }
      ctx.font = UF.font.sans(20);
      D.text(ctx, `to ${this.to}`, fx0 + 70, fy + 14, { color: inkDim });
      if (this.date) D.text(ctx, this.date, x + this.w - 60, fy - 14, { color: inkDim, align: 'right' });
      fy += 66;

      ctx.font = UF.font.sans(27);
      const lines = D.wrap(ctx, this.body, this.w - 140);
      const n = Math.max(0, Math.floor((t - this.typeAt) * this.cps));
      let used = 0;
      for (const ln of lines) {
        const show = Math.max(0, Math.min(ln.length, n - used));
        if (show > 0) D.text(ctx, ln.slice(0, show), fx0, fy, { color: ink });
        used += ln.length + 1;
        fy += 40;
      }
      const bodyDone = this.typeAt + this.body.length / this.cps;

      if (this.link) {
        const lp = seg(t, bodyDone + 0.3, 0.4);
        if (lp > 0) {
          fy += 20;
          ctx.globalAlpha = a * enter * lp;
          ctx.font = UF.font.sans(26, '600');
          const lw = D.measure(ctx, this.link) + 84;
          const hover = this.clickAt !== null ? seg(t, this.clickAt - 0.9, 0.5) : 0;
          ctx.fillStyle = hover > 0 ? UF.mix('#e4ebf3', 'blue', hover * 0.25, 1) : '#e4ebf3';
          D.roundRect(ctx, fx0, fy - 38, lw, 58, 6);
          ctx.fill();
          ctx.strokeStyle = c('blue');
          ctx.lineWidth = 2;
          ctx.stroke();
          D.icon(ctx, 'doc', fx0 + 32, fy - 9, 30, { color: c('blue'), width: 7 });
          D.text(ctx, this.link, fx0 + 60, fy, { color: c('blue') });
          ctx.fillStyle = c('blue');
          ctx.fillRect(fx0 + 60, fy + 5, D.measure(ctx, this.link), 2);

          if (this.clickAt !== null) {
            const tx = fx0 + lw * 0.62, ty = fy - 8;
            const mp = ease.inOutCubic(seg(t, this.clickAt - 1.4, 1.2));
            const cx = lerp(x + this.w * 0.82, tx, mp), cy = lerp(y + this.h * 0.95, ty, mp);
            const press = t >= this.clickAt ? Math.max(0, 1 - (t - this.clickAt) * 4) : 0;
            if (t >= this.clickAt) {
              const rp = seg(t, this.clickAt, 0.6);
              ctx.strokeStyle = c('blue');
              ctx.lineWidth = 3;
              ctx.globalAlpha = a * enter * (1 - rp);
              ctx.beginPath(); ctx.arc(tx, ty, 10 + rp * 40, 0, Math.PI * 2); ctx.stroke();
              ctx.globalAlpha = a * enter;
            }
            this.pointer(ctx, cx, cy, 1 - press * 0.15);
            fx.kick(t, this.clickAt, { rgb: 0.6, glitch: 0.5, glitchDur: 0.06, decay: 10 });
          }
        }
      }

      if (this.note) {
        ctx.globalAlpha = a * enter * seg(t, bodyDone + 0.6, 0.5);
        ctx.font = UF.font.mono(17);
        D.text(ctx, this.note, x + this.w, y + this.h + 44, { color: c('dim'), spacing: 2, align: 'right' });
      }
      ctx.restore();
    }

    pointer(ctx, x, y, s) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(s * 1.6, s * 1.6);
      ctx.beginPath();
      ctx.moveTo(0, 0); ctx.lineTo(0, 22); ctx.lineTo(6, 17); ctx.lineTo(10, 26); ctx.lineTo(14, 24); ctx.lineTo(10, 15); ctx.lineTo(17, 15);
      ctx.closePath();
      ctx.fillStyle = '#fff';
      ctx.fill();
      ctx.strokeStyle = '#111';
      ctx.lineWidth = 1.4;
      ctx.stroke();
      ctx.restore();
    }

    editorial() { return { factual: true, recreation: true, label: this.label, sourced: !!this.note }; }
  }

  UF.EmailCard = EmailCard;
})(window.UF);

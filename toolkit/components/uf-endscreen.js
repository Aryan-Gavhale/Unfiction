/*!
 * Unfiction GFX Toolkit — EndScreen
 * The last 5–20 seconds of a video: the channel name and tagline, plus framed slots where
 * YouTube's end-screen elements (a video and the subscribe button) are placed in YouTube Studio.
 *
 *   new UF.EndScreen({
 *     channel: 'UNFICTION', tagline: 'Real Scams. Real Crimes. Untold Stories.',
 *     video: { kicker: 'NEXT EPISODE', title: 'COMING SOON' }, subscribe: { label: 'SUBSCRIBE' },
 *   })
 *
 * The slot text sits underneath YouTube's elements, so it only shows where no element is placed.
 * guides: true draws dashed alignment boxes with their sizes, for lining the elements up in Studio.
 */
(function (UF) {
  'use strict';

  const { c, seg, ease, clamp } = UF;
  const D = UF.draw;
  const W = UF.W, H = UF.H;
  const POOL = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ#%&@';

  class EndScreen extends UF.Component {
    constructor(o) {
      super({
        channel: 'UNFICTION', tagline: 'Real Scams. Real Crimes. Untold Stories.', kicker: '',
        video: { kicker: 'NEXT EPISODE', title: 'COMING SOON' }, subscribe: { label: 'SUBSCRIBE' },
        videoRect: [140, 420, 896, 504], subCenter: [1490, 672], subRadius: 160,
        titleX: 140, titleY: 250, titleSize: 150, accent: 'red', guides: false,
      }, o);
      if (!Array.isArray(this.videoRect) || this.videoRect.length !== 4) throw new Error('EndScreen: videoRect is [x, y, w, h].');
    }

    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      const lt = t - this.at;
      ctx.save();
      ctx.globalAlpha = a;

      if (this.kicker) {
        ctx.font = UF.font.mono(22, 'bold');
        D.text(ctx, D.typed(this.kicker, seg(lt, 0, 0.5)), this.titleX, this.titleY - this.titleSize * 0.82, { color: c(this.accent), spacing: 8 });
      }
      const sp = seg(lt, 0.2, 0.9);
      ctx.font = UF.font.display(this.titleSize);
      const name = sp >= 1 ? this.channel : D.scramble(this.channel, sp, Math.floor(t * 24), POOL);
      ctx.globalAlpha = a * clamp(sp * 3);
      D.text(ctx, name, this.titleX, this.titleY, { color: c('paper'), spacing: this.titleSize * 0.06 });
      ctx.globalAlpha = a;
      ctx.fillStyle = c(this.accent);
      ctx.fillRect(this.titleX, this.titleY + 22, 120 * ease.outExpo(seg(lt, 0.9, 0.7)), 5);
      if (this.tagline) {
        ctx.font = UF.font.mono(26);
        D.text(ctx, D.typed(this.tagline, seg(lt, 1.0, 1.0)), this.titleX, this.titleY + 74, { color: c('dim'), spacing: 3 });
      }
      fx.kick(t, this.at + 0.2, { glitch: 0.5, rgb: 0.7, decay: 10 });
      fx.kick(t, this.at + 1.1, { flash: 0.1, rgb: 0.3, decay: 8 });

      if (this.video) this.drawVideo(ctx, t, lt, a);
      if (this.subscribe) this.drawSubscribe(ctx, t, lt, a);
      ctx.restore();
    }

    drawVideo(ctx, t, lt, a) {
      const [x, y, w, h] = this.videoRect;
      const p = ease.outExpo(seg(lt, 1.4, 0.9));
      if (p <= 0) return;
      ctx.save();
      ctx.globalAlpha = a * p;
      ctx.fillStyle = c('panel', 0.92);
      ctx.fillRect(x, y, w, h);
      ctx.strokeStyle = c('line');
      ctx.lineWidth = 1.5;
      ctx.strokeRect(x + 0.75, y + 0.75, w - 1.5, h - 1.5);
      const L = 40 * p;
      ctx.strokeStyle = c(this.accent);
      ctx.lineWidth = 4;
      ctx.beginPath();
      for (const [px, py, dx, dy] of [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]]) {
        ctx.moveTo(px, py + dy * L); ctx.lineTo(px, py); ctx.lineTo(px + dx * L, py);
      }
      ctx.stroke();
      const cx = x + w / 2, cy = y + h / 2;
      ctx.strokeStyle = c('paper', 0.5);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy - 50, 46, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = c('paper', 0.8);
      ctx.beginPath();
      ctx.moveTo(cx - 14, cy - 74); ctx.lineTo(cx + 24, cy - 50); ctx.lineTo(cx - 14, cy - 26);
      ctx.closePath();
      ctx.fill();
      const v = this.video;
      if (v.kicker) {
        ctx.font = UF.font.mono(22, 'bold');
        D.text(ctx, v.kicker, cx, cy + 46, { color: c(this.accent), spacing: 8, align: 'center' });
      }
      if (v.title) {
        ctx.font = UF.font.display(72);
        D.text(ctx, v.title, cx, cy + 124, { color: c('paper'), spacing: 4, align: 'center' });
      }
      if (this.guides) this.guide(ctx, x, y, w, h, `VIDEO ELEMENT · ${w}×${h}`);
      ctx.restore();
    }

    drawSubscribe(ctx, t, lt, a) {
      const [cx, cy] = this.subCenter, r = this.subRadius;
      const p = ease.outExpo(seg(lt, 1.8, 0.9));
      if (p <= 0) return;
      ctx.save();
      ctx.globalAlpha = a * p;
      ctx.fillStyle = c('panel', 0.92);
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = c('paper', 0.18);
      ctx.lineWidth = 2;
      ctx.stroke();
      ctx.strokeStyle = c(this.accent);
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      const spin = t * 0.5;
      for (let i = 0; i < 3; i++) {
        const a0 = spin + i * Math.PI * 2 / 3;
        ctx.beginPath();
        ctx.arc(cx, cy, r + 16, a0, a0 + 1.1 * p);
        ctx.stroke();
      }
      ctx.font = UF.font.display(Math.round(r * 1.1));
      D.text(ctx, this.channel.slice(0, 1), cx, cy + r * 0.4, { color: c('paper'), align: 'center' });
      const label = this.subscribe.label;
      if (label) {
        const pulse = 1 + 0.04 * Math.sin(lt * 3.2);
        ctx.save();
        ctx.translate(cx, cy + r + 72);
        ctx.scale(pulse, pulse);
        D.pill(ctx, label, 0, 0, { align: 'center', fill: c(this.accent), font: UF.font.mono(26, 'bold'), h: 56, padX: 26, spacing: 5 });
        ctx.restore();
      }
      if (this.guides) this.guide(ctx, cx - r, cy - r, r * 2, r * 2, `SUBSCRIBE · ${r * 2}px`);
      ctx.restore();
    }

    guide(ctx, x, y, w, h, text) {
      ctx.save();
      ctx.setLineDash([12, 8]);
      ctx.strokeStyle = c('green');
      ctx.lineWidth = 2;
      ctx.strokeRect(x, y, w, h);
      ctx.font = UF.font.mono(16, 'bold');
      D.text(ctx, text, x + 8, y - 10, { color: c('green'), spacing: 2 });
      ctx.restore();
    }

    editorial() { return {}; }
  }

  UF.EndScreen = EndScreen;
})(window.UF);

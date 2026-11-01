/*!
 * Unfiction GFX Toolkit — QuoteCard
 * A typed statement on paper (or a dark card) with a marker highlight on the key phrase.
 *
 *   new UF.QuoteCard({
 *     quote: 'We thought it was a common problem, just like any other day.',
 *     highlight: 'common problem',
 *     attribution: '— Joint director, Bangladesh Bank',
 *     header: 'STATEMENT TO POLICE', headerRight: 'EXCERPT',
 *     at: 0.2, typeAt: 1.2, cps: 20, style: 'paper',
 *   })
 * Pair it with UF.SourceTag for the on-screen source line.
 */
(function (UF) {
  'use strict';

  const { c, seg, ease } = UF;
  const D = UF.draw;
  const W = UF.W, H = UF.H;

  class QuoteCard extends UF.Component {
    constructor(o) {
      super({
        quote: '', highlight: '', attribution: '', header: '', headerRight: '',
        x: W / 2, y: H / 2 - 20, w: 1420, h: 600, angle: -1.1, textWidth: null,
        typeAt: 1.2, cps: 20, size: 54, lineH: 76, style: 'paper', seed: 21,
        highlightColor: 'rgba(217,164,65,.62)', tape: true,
      }, o);
    }

    layout(ctx) {
      if (this._lines) return this._lines;
      ctx.font = UF.font.type(this.size, 'bold');
      const lines = D.wrap(ctx, this.quote, this.textWidth || this.w - 290);
      let idx = 0;
      this._lines = lines.map(text => {
        const start = this.quote.indexOf(text, idx);
        idx = start + text.length;
        return { text, start };
      });
      return this._lines;
    }

    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      const lt = t - this.at;
      const paper = this.style === 'paper';
      const ink = paper ? '#1d1b18' : c('paper');
      const inkDim = paper ? 'rgba(29,27,24,.6)' : c('dim');
      const enter = ease.outExpo(seg(lt, 0, 1.1));
      const drift = 1 + 0.025 * ease.inOutSine(seg(lt, 0, 14));

      ctx.save();
      ctx.globalAlpha = a * enter;
      ctx.translate(this.x, this.y + (1 - enter) * 60);
      ctx.rotate((this.angle + (1 - enter) * 2.5) * Math.PI / 180);
      ctx.scale(drift, drift);
      const x = -this.w / 2, y = -this.h / 2;

      ctx.save();
      ctx.shadowColor = 'rgba(0,0,0,.7)';
      ctx.shadowBlur = 60;
      ctx.shadowOffsetY = 24;
      if (paper) ctx.drawImage(D.paperTexture(this.w, this.h, this.seed), x, y);
      else { ctx.fillStyle = c('panel'); ctx.fillRect(x, y, this.w, this.h); }
      ctx.restore();
      if (!paper) { ctx.strokeStyle = c('line'); ctx.lineWidth = 1.5; ctx.strokeRect(x + 0.5, y + 0.5, this.w - 1, this.h - 1); }

      if (paper && this.tape) {
        for (const [tx, rot] of [[x + 110, -0.12], [x + this.w - 110, 0.1]]) {
          ctx.save();
          ctx.translate(tx, y + 4);
          ctx.rotate(rot);
          ctx.fillStyle = 'rgba(232,222,196,.72)';
          ctx.fillRect(-80, -20, 160, 40);
          ctx.fillStyle = 'rgba(255,255,255,.12)';
          ctx.fillRect(-80, -20, 160, 8);
          ctx.restore();
        }
      }

      if (this.header) {
        ctx.font = UF.font.type(22, 'bold');
        D.text(ctx, this.header, x + 70, y + 78, { color: inkDim, spacing: 5 });
        if (this.headerRight) D.text(ctx, this.headerRight, x + this.w - 70, y + 78, { color: inkDim, spacing: 5, align: 'right' });
        ctx.fillStyle = paper ? 'rgba(29,27,24,.35)' : c('line');
        ctx.fillRect(x + 70, y + 98, this.w - 140, 2);
      }

      ctx.font = UF.font.serif(260, 'normal', 'bold');
      ctx.fillStyle = c('red', 0.9);
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
      ctx.fillText('\u201C', x + 46, y + 330);

      const lines = this.layout(ctx);
      const tx0 = x + 210;
      const ty0 = y + 210 + (4 - lines.length) * this.lineH * 0.35;
      const typedN = Math.max(0, Math.floor((t - this.typeAt) * this.cps));
      const total = this.quote.length;
      const doneAt = this.typeAt + total / this.cps;

      if (this.highlight) {
        const hs = this.quote.indexOf(this.highlight);
        const he = hs + this.highlight.length;
        const hp = ease.inOutCubic(seg(t, doneAt + 0.5, 0.9));
        if (hs >= 0 && hp > 0) {
          ctx.font = UF.font.type(this.size, 'bold');
          const span = he - hs;
          let shown = span * hp;
          lines.forEach((ln, i) => {
            const s = Math.max(hs, ln.start), e = Math.min(he, ln.start + ln.text.length);
            if (e <= s || shown <= 0) return;
            const take = Math.min(e - s, shown);
            shown -= take;
            const x0 = tx0 + ctx.measureText(ln.text.slice(0, s - ln.start)).width;
            const x1 = tx0 + ctx.measureText(ln.text.slice(0, s - ln.start + Math.ceil(take))).width;
            const yy = ty0 + i * this.lineH;
            if (paper) D.highlight(ctx, x0 - 6, yy - this.size * 0.78, x1 - x0 + 12, this.size * 1.0, 1, this.highlightColor);
            else D.underline(ctx, x0, yy + 12, x1 - x0, 1, { color: c('red'), width: 5 });
          });
        }
        fx.kick(t, doneAt + 0.5, { rgb: 0.2, decay: 8 });
      }

      ctx.font = UF.font.type(this.size, 'bold');
      const r = UF.rng(this.seed * 7);
      let cursorX = tx0, cursorY = ty0;
      lines.forEach((ln, i) => {
        const yy = ty0 + i * this.lineH;
        let cx = tx0;
        for (let j = 0; j < ln.text.length; j++) {
          const gi = ln.start + j;
          const jit = r(), al = r();
          const ch = ln.text[j];
          const w = ctx.measureText(ch).width;
          if (gi < typedN) {
            ctx.fillStyle = ink;
            ctx.globalAlpha = a * enter * (paper ? 0.8 + al * 0.2 : 1);
            ctx.fillText(ch, cx, yy + (jit - 0.5) * 2.4);
            cursorX = cx + w; cursorY = yy;
          }
          cx += w;
        }
        if (typedN >= ln.start + ln.text.length && i < lines.length - 1 && typedN < lines[i + 1].start + 1) { cursorX = tx0; cursorY = ty0 + (i + 1) * this.lineH; }
      });
      ctx.globalAlpha = a * enter;
      if (t >= this.typeAt - 0.6 && t < doneAt + 1.6) D.cursor(ctx, cursorX + 4, cursorY, this.size * 0.9, t, paper ? ink : c('red'));

      if (this.attribution) {
        const ap = seg(t, doneAt + 1.2, 0.6);
        ctx.globalAlpha = a * enter * ap;
        ctx.font = UF.font.type(28, 'bold');
        D.text(ctx, D.typed(this.attribution, seg(t, doneAt + 1.2, 0.9)), x + this.w - 90, y + this.h - 70, { color: inkDim, spacing: 2, align: 'right' });
      }
      ctx.restore();
    }

    editorial() { return { factual: true }; }
  }

  UF.QuoteCard = QuoteCard;
})(window.UF);

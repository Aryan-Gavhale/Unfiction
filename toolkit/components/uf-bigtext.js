/*!
 * Unfiction GFX Toolkit — BigText
 * Kinetic narration: a few short lines set large, each word landing in time with the voice-over.
 * Stands in for an on-camera line (the channel is faceless), on black or keyed over another shot.
 *
 *   new UF.BigText({
 *     lines: [
 *       { text: 'RASEL AHLAM', at: 0.3, strike: 1.6 },
 *       { text: 'DID NOT EXIST.', at: 2.0, color: 'red', hit: true },
 *       { text: 'The FBI says the name was a cover', at: 3.2, sub: true },
 *     ],
 *     kicker: 'THE CV EMAIL', size: 120, dimPrev: false,
 *   })
 *
 * Line options: text, at, size, color ('paper' | 'red' | 'gold' | any CSS colour), sub (small mono line),
 * strike (time a red line crosses it out), mark (time a red underline sweeps under it), hit (camera kick on landing).
 * With ?key and no Background layer the stage exports it on green for keying over footage.
 */
(function (UF) {
  'use strict';

  const { c, seg, ease } = UF;
  const W = UF.W, H = UF.H;

  class BigText extends UF.Component {
    constructor(o) {
      super({
        lines: [], kicker: '', kickerAt: null, x: W / 2, y: H / 2, size: 120, gap: 0.2, align: 'center',
        stagger: 0.07, dimPrev: false, outline: true,
      }, o);
      for (const ln of this.lines) if (ln.at == null) throw new Error(`BigText: line "${ln.text}" needs "at".`);
    }

    sizeOf(ln) { return ln.size || (ln.sub ? Math.round(this.size * 0.3) : this.size); }
    fontOf(ln) { return ln.sub ? UF.font.mono(this.sizeOf(ln), 'bold') : UF.font.display(this.sizeOf(ln)); }
    colorOf(ln) {
      const k = ln.color || (ln.sub ? 'dim' : 'paper');
      return /^(#|rgb|hsl)/.test(k) ? k : c(k);
    }

    /** Word positions per line, measured once. */
    layout(ctx) {
      if (this._lay) return this._lay;
      const rows = this.lines.map(ln => {
        ctx.font = this.fontOf(ln);
        const sp = ctx.measureText(' ').width;
        const words = ln.text.split(' ').map(w => ({ w, width: ctx.measureText(w).width }));
        const width = words.reduce((s, x) => s + x.width, 0) + sp * (words.length - 1);
        let x = this.align === 'center' ? -width / 2 : this.align === 'right' ? -width : 0;
        for (const wd of words) { wd.x = x; x += wd.width + sp; }
        const s = this.sizeOf(ln);
        return { ln, words, width, h: s * (1 + (ln.sub ? 0.9 : this.gap)), s };
      });
      const total = rows.reduce((s, r) => s + r.h, 0);
      let y = -total / 2;
      for (const r of rows) { r.y = y + r.s * 0.82; y += r.h; }
      return (this._lay = rows);
    }

    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      const rows = this.layout(ctx);
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';

      if (this.kicker) {
        const ka = ease.outCubic(seg(t, this.kickerAt ?? this.at, 0.5));
        ctx.globalAlpha = a * ka;
        ctx.font = UF.font.mono(22, 'bold');
        const ky = rows.length ? rows[0].y - rows[0].s * 0.82 - 46 : -60;
        UF.draw.text(ctx, this.kicker, this.align === 'center' ? 0 : 0, ky, { color: c('red'), spacing: 6, align: this.align });
      }

      rows.forEach((r, i) => {
        const { ln } = r;
        if (t < ln.at) return;
        const later = rows.slice(i + 1).find(n => !n.ln.sub && t >= n.ln.at);
        const dim = this.dimPrev && !ln.sub && later ? 0.32 + 0.68 * (1 - seg(t, later.ln.at, 0.4)) : 1;
        ctx.font = this.fontOf(ln);
        r.words.forEach((wd, j) => {
          const p = ease.outCubic(seg(t, ln.at + j * this.stagger, 0.42));
          if (p <= 0) return;
          const yy = r.y + (1 - p) * r.s * 0.24;
          ctx.globalAlpha = a * p * dim;
          if (this.outline && !ln.sub) {
            ctx.lineJoin = 'round';
            ctx.lineWidth = Math.max(3, r.s * 0.07);
            ctx.strokeStyle = 'rgba(0,0,0,.55)';
            ctx.strokeText(wd.w, wd.x, yy);
          }
          ctx.fillStyle = this.colorOf(ln);
          ctx.fillText(wd.w, wd.x, yy);
        });
        const x0 = r.words[0].x;
        if (ln.strike != null && t >= ln.strike) {
          ctx.globalAlpha = a * dim;
          ctx.fillStyle = c('red');
          ctx.fillRect(x0 - 10, r.y - r.s * 0.36, (r.width + 20) * ease.outCubic(seg(t, ln.strike, 0.35)), Math.max(4, r.s * 0.08));
        }
        if (ln.mark != null && t >= ln.mark) {
          ctx.globalAlpha = a * dim;
          ctx.fillStyle = c('red');
          ctx.fillRect(x0, r.y + r.s * 0.14, r.width * ease.inOutCubic(seg(t, ln.mark, 0.5)), Math.max(4, r.s * 0.06));
        }
        if (fx && ln.hit) fx.kick(t, ln.at, { rgb: 0.25, shake: 0.006, decay: 10 });
        if (fx && ln.strike != null) fx.kick(t, ln.strike, { rgb: 0.3, decay: 12 });
      });
      ctx.restore();
    }

    editorial() { return {}; }
  }

  UF.BigText = BigText;
})(window.UF);

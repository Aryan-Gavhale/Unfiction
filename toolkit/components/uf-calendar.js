/*!
 * Unfiction GFX Toolkit — CalendarFlip
 * A split-flap calendar that flips from one month or year to another, slow at both ends and
 * fast in the middle, then lands with a hit.
 *
 *   new UF.CalendarFlip({ from: 'FEB 2016', to: 'JAN 2015', flipAt: 1.6, flipDur: 1.6,
 *                         kicker: 'THE STORY STARTS', caption: 'MORE THAN A YEAR BEFORE THE HEIST' })
 *   new UF.CalendarFlip({ from: '2016', to: '2026', flipAt: 0.8, flipDur: 2.2 })
 *
 * 'MMM YYYY' (or the full month name) flips month by month; 'YYYY' flips year by year. Either direction works.
 */
(function (UF) {
  'use strict';

  const { c, seg, ease, clamp } = UF;
  const D = UF.draw;
  const W = UF.W, H = UF.H;
  const MONTHS = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
  const BAND = 70;
  const INK = '#1d1b18';

  /** { kind: 'year' | 'month', n } where n is the year, or year * 12 + month index. */
  function parse(s, which) {
    const str = String(s).trim().toUpperCase();
    let m = /^(\d{3,4})$/.exec(str);
    if (m) return { kind: 'year', n: +m[1] };
    m = /^([A-Z]{3,})\.?\s+(\d{4})$/.exec(str);
    if (m) {
      const mi = MONTHS.findIndex(name => name.startsWith(m[1]));
      if (mi < 0) throw new Error(`CalendarFlip: ${which} "${s}" — "${m[1]}" is not a month.`);
      return { kind: 'month', n: +m[2] * 12 + mi };
    }
    throw new Error(`CalendarFlip: ${which} must be 'YYYY' or 'MMM YYYY', not "${s}".`);
  }

  class CalendarFlip extends UF.Component {
    constructor(o) {
      super({
        from: '', to: '', flipAt: null, flipDur: null, easing: 'inOutSine',
        x: W / 2, y: H / 2 + 10, w: 780, h: 560, header: '', kicker: '', caption: '', captionAt: null,
        accent: 'red', seed: 31,
      }, o);
      const a = parse(this.from, 'from'), b = parse(this.to, 'to');
      if (a.kind !== b.kind) throw new Error('CalendarFlip: from and to must both be years or both be months.');
      const n = Math.abs(b.n - a.n), dir = Math.sign(b.n - a.n);
      if (n > 240) throw new Error(`CalendarFlip: ${n} pages is too many to flip — keep it under 240.`);
      this.kind = a.kind;
      this.pages = Array.from({ length: n + 1 }, (_, i) => a.n + dir * i);
      if (this.flipAt == null) this.flipAt = this.at + 1;
      if (this.flipDur == null) this.flipDur = clamp(0.6 + n * 0.12, 0.8, 3.2);
      if (this.captionAt == null) this.captionAt = this.flipAt + this.flipDur + 0.3;
      this.sprites = new Map();
    }

    /** One calendar page, drawn once and cached. Month pages put the month above the hinge and the year below. */
    pageSprite(i, res) {
      const key = `${i}:${res}`;
      if (this.sprites.has(key)) return this.sprites.get(key);
      const w = this.w, h = this.h, n = this.pages[i];
      const cv = UF.canvas(w * res, h * res), x = cv.getContext('2d');
      x.scale(res, res);
      D.roundRect(x, 0, 0, w, h, 16);
      x.save();
      x.clip();
      x.drawImage(D.paperTexture(w, h, this.seed, '#ece8de'), 0, 0);
      x.fillStyle = c(this.accent);
      x.fillRect(0, 0, w, BAND);
      if (this.header) {
        x.font = UF.font.mono(22, 'bold');
        D.text(x, this.header, w / 2, BAND / 2 + 8, { color: c('paper'), spacing: 8, align: 'center' });
      }
      if (this.kind === 'month') {
        const name = MONTHS[n % 12];
        x.font = UF.font.display(132);
        const size = Math.min(132, Math.floor(132 * (w - 110) / D.measure(x, name, 4)));
        x.font = UF.font.display(size);
        D.text(x, name, w / 2, BAND + (h / 2 - BAND) / 2 + size * 0.36, { color: INK, spacing: 4, align: 'center' });
        x.font = UF.font.display(170);
        D.text(x, String(Math.floor(n / 12)), w / 2, h * 0.75 + 170 * 0.36, { color: INK, spacing: 8, align: 'center' });
      } else {
        x.font = UF.font.display(300);
        D.text(x, String(n), w / 2, h / 2 + BAND / 2 + 300 * 0.36, { color: INK, spacing: 10, align: 'center' });
      }
      x.restore();
      this.sprites.set(key, cv);
      return cv;
    }

    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      const enter = ease.outExpo(seg(t - this.at, 0, 0.8));
      const w = this.w, h = this.h;
      const left = Math.round(this.x - w / 2), top = Math.round(this.y - h / 2 - (1 - enter) * 30), mid = top + h / 2;
      const m = ctx.getTransform();
      const res = Math.min(2, Math.max(1, Math.ceil(Math.hypot(m.a, m.b))));
      const N = this.pages.length - 1;
      const P = N * UF.easeFn(this.easing)(seg(t, this.flipAt, this.flipDur));
      const i = Math.min(N, Math.floor(P)), k = i >= N ? 0 : P - i;
      const cur = this.pageSprite(i, res), nxt = this.pageSprite(Math.min(N, i + 1), res);
      const sw = cur.width, half = cur.height / 2;

      ctx.save();
      ctx.globalAlpha = a * enter;
      const sh = D.shadowSprite(w, h, 16, 32);
      ctx.save();
      ctx.globalAlpha *= 0.75;
      ctx.drawImage(sh, left - sh.pad, top + 24 - sh.pad);
      ctx.restore();

      // Behind the flap: the next page's top half is already showing, the current page's bottom half still is.
      ctx.drawImage(k > 0 ? nxt : cur, 0, 0, sw, half, left, top, w, h / 2);
      ctx.drawImage(cur, 0, half, sw, half, left, mid, w, h / 2);
      if (k > 0) {
        const s = Math.abs(Math.cos(k * Math.PI)), fh = h / 2 * s;
        if (fh > 0.5) {
          if (k < 0.5) {
            ctx.drawImage(cur, 0, 0, sw, half, left, mid - fh, w, fh);
            ctx.fillStyle = `rgba(0,0,0,${0.55 * (1 - s)})`;
            ctx.fillRect(left, mid - fh, w, fh);
          } else {
            ctx.drawImage(nxt, 0, half, sw, half, left, mid, w, fh);
            ctx.fillStyle = `rgba(0,0,0,${0.4 * (1 - s)})`;
            ctx.fillRect(left, mid, w, fh);
          }
        }
      }

      const g = ctx.createLinearGradient(0, mid - 26, 0, mid + 26);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(0.5, 'rgba(0,0,0,.22)');
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.fillRect(left, mid - 26, w, 52);
      ctx.fillStyle = 'rgba(0,0,0,.7)';
      ctx.fillRect(left, mid - 2, w, 4);
      ctx.fillStyle = '#2a2d33';
      ctx.fillRect(left - 10, mid - 14, 10, 28);
      ctx.fillRect(left + w, mid - 14, 10, 28);

      if (this.kicker) {
        ctx.font = UF.font.mono(24, 'bold');
        D.text(ctx, D.typed(this.kicker, seg(t, this.at + 0.2, 0.5)), this.x, top - 50, { color: c(this.accent), spacing: 8, align: 'center' });
      }
      if (this.caption) {
        const p = seg(t, this.captionAt, 0.5);
        if (p > 0) {
          const rw = 280 * ease.outExpo(p);
          ctx.fillStyle = c(this.accent);
          ctx.fillRect(this.x - rw, top + h + 52, rw * 2, 3);
          ctx.globalAlpha = a * enter * p;
          ctx.font = UF.font.mono(28);
          D.text(ctx, this.caption, this.x, top + h + 104, { color: c('paper'), spacing: 6, align: 'center' });
        }
      }
      ctx.restore();
      fx.kick(t, this.flipAt, { rgb: 0.15, decay: 12 });
      fx.kick(t, this.flipAt + this.flipDur, { rgb: 0.5, flash: 0.12, shake: 0.004, decay: 10 });
    }

    editorial() { return {}; }
  }

  UF.CalendarFlip = CalendarFlip;
})(window.UF);

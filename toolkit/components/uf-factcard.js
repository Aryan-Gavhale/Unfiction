/*!
 * Unfiction GFX Toolkit — FactCard
 * A dated source card: the date lands, the statement rises in line by line, a key phrase is
 * marked, and the source sits in the card's own footer.
 *
 *   new UF.FactCard({
 *     kicker: 'RCBC · JUPITER ST BRANCH', date: '9 FEBRUARY 2016',
 *     text: 'The stop request reaches RCBC. $58.15 million already withdrawn.',
 *     highlight: '$58.15 million',
 *     source: 'Philippine Daily Inquirer timeline',
 *     at: 0.2,
 *   })
 *
 * A highlight up to 60% of the text width is never split across lines.
 * quote: true sets the text as a quoted headline. figure: { value: 98, label: 'DEADLINE EXTENSIONS' } adds a
 * big counter under the text. A card that singles out a named person (person: 'Name') must carry a status.
 */
(function (UF) {
  'use strict';

  const { c, seg, ease, lerp } = UF;
  const D = UF.draw;
  const W = UF.W, H = UF.H;
  const PAD = 84;
  const FIGURE_KEYS = ['value', 'from', 'prefix', 'suffix', 'decimals', 'label', 'color', 'size', 'dur'];

  class FactCard extends UF.Component {
    constructor(o) {
      super({
        kicker: '', date: '', text: '', highlight: '', quote: false, note: '',
        figure: null, person: '', status: null, statusNote: '', source: '', sourceLabel: 'SOURCE',
        x: W / 2, y: H / 2, w: 1320, size: 52, dateSize: 92, style: 'dark', accent: 'red', highlightColor: 'amber',
        dateAt: null, textAt: null, lineStep: 0.22, highlightAt: null, figureAt: null, statusAt: null, sourceAt: null,
        seed: 13,
      }, o);
      if (!['dark', 'paper'].includes(this.style)) throw new Error(`FactCard: style must be 'dark' or 'paper', not "${this.style}".`);
      if (!this.text) throw new Error('FactCard: text is empty.');
      if (this.highlight && !this.text.includes(this.highlight)) throw new Error(`FactCard: highlight "${this.highlight}" does not appear in the text.`);
      if (this.person && !this.status) throw new Error(`FactCard: the card singles out ${this.person}, so it needs a status — see Legal status in the README.`);
      if (this.status) D.statusInfo(this.status);
      if (this.figure) {
        const bad = Object.keys(this.figure).filter(k => !FIGURE_KEYS.includes(k));
        if (bad.length) throw new Error(`FactCard: figure has unknown key "${bad[0]}" — use ${FIGURE_KEYS.join(', ')}.`);
        if (!Number.isFinite(this.figure.value)) throw new Error('FactCard: figure needs a numeric value.');
      }
      this.measure();
    }

    textFont() { return UF.font.serif(this.size, this.quote ? 'italic' : 'normal'); }

    /** Line breaks, vertical positions inside the card, card height, and the default beat times. */
    measure() {
      const m = UF.canvas(4, 4).getContext('2d');
      this.shown = this.quote ? `\u201C${this.text}\u201D` : this.text;
      m.font = this.textFont();
      const width = this.w - PAD * 2;
      const keep = this.highlight && m.measureText(this.highlight).width <= width * 0.6 ? [this.highlight] : null;
      let idx = 0;
      this.lines = D.wrapBalanced(m, this.shown, width, keep).map(text => {
        const start = this.shown.indexOf(text, idx);
        idx = start + text.length;
        return { text, start };
      });
      this.lineH = Math.round(this.size * 1.34);

      const P = this.pos = {};
      let y = 72;
      if (this.kicker) { P.kicker = y + 16; y += 52; }
      if (this.date) {
        P.dateTop = y - 8;
        P.date = y + this.dateSize * 0.8;
        P.rule = P.date + 26;
        y = P.rule + 62;
      }
      P.text = y + this.size * 0.8;
      y += this.lines.length * this.lineH;
      if (this.note) { P.note = y + 14; y += 44; }
      if (this.figure) {
        const fs = this.figure.size || 150;
        P.figure = y + 20 + fs * 0.8;
        P.figureLabel = P.figure + 44;
        y = P.figureLabel + 12;
      }
      if (this.status) { P.status = y + 40; y += 72; }
      if (this.source) { P.rule2 = y + 30; P.source = P.rule2 + 46; y = P.source + 36; }
      else y += 36;
      this.h = Math.round(y);

      if (this.dateAt == null) this.dateAt = this.at + 0.35;
      if (this.textAt == null) this.textAt = this.date ? this.dateAt + 0.55 : this.at + 0.5;
      this.textDone = this.textAt + (this.lines.length - 1) * this.lineStep + 0.5;
      if (this.highlightAt == null) this.highlightAt = this.textDone + 0.4;
      const figDur = this.figure ? this.figure.dur || 1.6 : 0;
      if (this.figureAt == null) this.figureAt = this.highlight ? this.highlightAt + 0.5 : this.textDone + 0.3;
      if (this.statusAt == null) {
        this.statusAt = this.figure ? this.figureAt + figDur * 0.6 : this.highlight ? this.highlightAt + 0.9 : this.textDone + 0.4;
      }
      if (this.sourceAt == null) this.sourceAt = this.at + 0.9;
    }

    /** Panel, ticks and the footer rule: everything that never moves. */
    sprite(res) {
      if (this._sprite && this._spriteRes === res) return this._sprite;
      const w = this.w, h = this.h, paper = this.style === 'paper';
      const cv = UF.canvas(w * res, h * res), x = cv.getContext('2d');
      x.scale(res, res);
      if (paper) {
        D.roundRect(x, 0, 0, w, h, 4);
        x.save();
        x.clip();
        x.drawImage(D.paperTexture(w, h, this.seed), 0, 0);
        x.restore();
        x.fillStyle = c(this.accent);
        x.fillRect(0, 0, 8, h);
      } else {
        D.panel(x, 0, 0, w, h, { shadow: false, fill: c('panel', 0.96), tickColor: c(this.accent), tick: 22 });
      }
      if (this.source) {
        x.fillStyle = paper ? 'rgba(29,27,24,.2)' : c('line');
        x.fillRect(PAD, this.pos.rule2, w - PAD * 2, 1.5);
      }
      this._sprite = cv;
      this._spriteRes = res;
      return cv;
    }

    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      const paper = this.style === 'paper';
      const ink = paper ? '#1d1b18' : c('paper');
      const dim = paper ? 'rgba(29,27,24,.62)' : c('dim');
      const enter = ease.outExpo(seg(t - this.at, 0, 0.9));
      const w = this.w, h = this.h, P = this.pos;
      const x = Math.round(this.x - w / 2), y = Math.round(this.y - h / 2 + (1 - enter) * 40);
      const m = ctx.getTransform();
      const res = Math.min(2, Math.max(1, Math.ceil(Math.hypot(m.a, m.b))));
      const base = a * enter;

      ctx.save();
      ctx.globalAlpha = base;
      const sh = D.shadowSprite(w, h, 4, 30);
      ctx.save();
      ctx.globalAlpha *= 0.7;
      ctx.drawImage(sh, x - sh.pad, y + 20 - sh.pad);
      ctx.restore();
      ctx.drawImage(this.sprite(res), x, y, w, h);

      if (this.kicker) {
        ctx.font = UF.font.mono(20, 'bold');
        D.text(ctx, D.typed(this.kicker, seg(t, this.at + 0.2, 0.5)), x + PAD, y + P.kicker, { color: c(this.accent), spacing: 6 });
      }

      if (this.date) {
        const p = ease.outExpo(seg(t, this.dateAt, 0.7));
        if (p > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(x, y + P.dateTop, w, this.dateSize * 1.08);
          ctx.clip();
          ctx.font = UF.font.display(this.dateSize);
          D.text(ctx, this.date, x + PAD, y + P.date + (1 - p) * this.dateSize * 1.1, { color: ink, spacing: 2 });
          ctx.restore();
          ctx.fillStyle = c(this.accent);
          ctx.fillRect(x + PAD, y + P.rule, 72 * ease.outExpo(seg(t, this.dateAt + 0.2, 0.6)), 4);
          fx.kick(t, this.dateAt + 0.15, { rgb: 0.3, decay: 9 });
        }
      }

      this.drawText(ctx, t, x, y, ink, base, paper);
      if (this.highlight) fx.kick(t, this.highlightAt + 0.7, { rgb: 0.25, decay: 8 });

      if (this.note) {
        ctx.globalAlpha = base * seg(t, this.textDone, 0.5);
        ctx.font = UF.font.mono(20);
        D.text(ctx, this.note, x + PAD, y + P.note, { color: dim, spacing: 1 });
      }

      if (this.figure) {
        const f = this.figure, fs = f.size || 150, dur = f.dur || 1.6;
        const p = seg(t, this.figureAt, 0.3);
        if (p > 0) {
          const d = f.decimals || 0;
          const v = lerp(f.from || 0, f.value, ease.outExpo(seg(t, this.figureAt, dur)));
          const str = `${f.prefix || ''}${v.toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d })}${f.suffix || ''}`;
          ctx.globalAlpha = base * p;
          ctx.font = UF.font.display(fs);
          D.text(ctx, str, x + PAD, y + P.figure, { color: c(f.color || this.accent), spacing: fs * 0.02 });
          if (f.label) {
            ctx.font = UF.font.mono(22, 'bold');
            D.text(ctx, f.label, x + PAD, y + P.figureLabel, { color: dim, spacing: 5 });
          }
          fx.kick(t, this.figureAt + dur * 0.5, { flash: 0.1, rgb: 0.25, decay: 7 });
        }
      }

      if (this.status) {
        const p = ease.outExpo(seg(t, this.statusAt, 0.5));
        if (p > 0) {
          ctx.globalAlpha = base * p;
          const bw = D.statusBadge(ctx, this.status, x + PAD - (1 - p) * 16, y + P.status, { size: 18, h: 36 });
          if (this.statusNote) {
            ctx.font = UF.font.mono(20);
            D.text(ctx, this.statusNote, x + PAD + bw + 18, y + P.status + 7, { color: ink, spacing: 1 });
          }
        }
      }

      if (this.source) {
        ctx.globalAlpha = base * seg(t, this.sourceAt, 0.4);
        let sx = x + PAD;
        ctx.fillStyle = c('blue');
        ctx.fillRect(sx, y + P.source - 11, 8, 8);
        sx += 18;
        ctx.font = UF.font.mono(17, 'bold');
        sx += D.text(ctx, this.sourceLabel, sx, y + P.source, { color: c('blue'), spacing: 4 }) + 20;
        ctx.font = UF.font.mono(18);
        D.text(ctx, D.typed(this.source, seg(t, this.sourceAt + 0.1, 0.8)), sx, y + P.source, { color: dim, spacing: 1 });
      }
      ctx.restore();
    }

    /** Statement lines rising in one by one, with the highlight swept across them in reading order. */
    drawText(ctx, t, x, y, ink, base, paper) {
      const P = this.pos, size = this.size;
      const off = this.quote ? 1 : 0;
      const hs = this.highlight ? this.text.indexOf(this.highlight) + off : -1;
      const he = hs + this.highlight.length;
      let budget = hs >= 0 ? ease.inOutCubic(seg(t, this.highlightAt, 0.7)) * (he - hs) : 0;
      ctx.font = this.textFont();
      ctx.textBaseline = 'alphabetic';
      ctx.textAlign = 'left';
      this.lines.forEach((ln, i) => {
        const k = ease.outCubic(seg(t, this.textAt + i * this.lineStep, 0.5));
        if (k <= 0) return;
        const lx = x + PAD, ly = y + P.text + i * this.lineH + (1 - k) * 24;
        let span = null;
        if (budget > 0) {
          const s = Math.max(hs, ln.start), e = Math.min(he, ln.start + ln.text.length);
          if (e > s) {
            const take = Math.min(e - s, budget);
            budget -= take;
            const x0 = lx + ctx.measureText(ln.text.slice(0, s - ln.start)).width;
            const xe = lx + ctx.measureText(ln.text.slice(0, e - ln.start)).width;
            const f = take / (e - s);
            const next = ln.text[e - ln.start];
            const padR = next && next !== ' ' ? 1 : 8;
            span = { x0: x0 - 8, x1: x0 + (xe - x0) * f + padR * f };
          }
        }
        ctx.globalAlpha = base * k;
        if (paper && span) D.highlight(ctx, span.x0, ly - size * 0.8, span.x1 - span.x0, size * 1.02, 1, c(this.highlightColor, 0.6));
        ctx.fillStyle = ink;
        ctx.fillText(ln.text, lx, ly);
        if (!paper && span) {
          const top = ly - size * 0.86, hh = size * 1.1;
          ctx.save();
          ctx.beginPath();
          ctx.rect(span.x0, top, span.x1 - span.x0, hh);
          ctx.clip();
          ctx.fillStyle = c(this.highlightColor);
          ctx.fillRect(span.x0, top, span.x1 - span.x0, hh);
          ctx.fillStyle = c('black');
          ctx.fillText(ln.text, lx, ly);
          ctx.restore();
        }
      });
    }

    editorial() { return { factual: true, source: !!this.source, person: !!this.person, status: this.status }; }
  }

  UF.FactCard = FactCard;
})(window.UF);

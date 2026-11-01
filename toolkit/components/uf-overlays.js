/*!
 * Unfiction GFX Toolkit — backgrounds and overlays
 * Background, Heading, SourceTag, TitleCard, LowerThird, StatusBadge, Caption, DramaLabel,
 * Disclaimer, Stamp, DataPanel, Counter.
 */
(function (UF) {
  'use strict';

  const { c, clamp, seg, ease, lerp } = UF;
  const D = UF.draw;
  const W = UF.W, H = UF.H;

  /* ------------------------------------------------------------------ */
  /* Background                                                          */
  /* ------------------------------------------------------------------ */
  /**
   * new UF.Background({ style: 'void' | 'grid' | 'desk', dust: true, seed: 3 })
   * Draws nothing in green-screen mode (?key), so overlays stay keyable.
   */
  class Background extends UF.Component {
    constructor(o) { super({ style: 'void', dust: true, dustCount: 70, seed: 3, glow: c('blue', 0.10) }, o); }

    plate() {
      if (this._plate) return this._plate;
      const cv = UF.canvas(W, H), x = cv.getContext('2d');
      const g = x.createRadialGradient(W * 0.5, H * 0.45, 80, W * 0.5, H * 0.5, W * 0.75);
      g.addColorStop(0, this.style === 'desk' ? '#1a1814' : '#13171d');
      g.addColorStop(1, this.style === 'desk' ? '#060505' : c('black'));
      x.fillStyle = g;
      x.fillRect(0, 0, W, H);
      const glow = x.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, W * 0.45);
      glow.addColorStop(0, this.glow);
      glow.addColorStop(1, 'rgba(0,0,0,0)');
      x.fillStyle = glow;
      x.fillRect(0, 0, W, H);
      if (this.style === 'grid') {
        x.strokeStyle = c('blue', 0.06);
        x.lineWidth = 1;
        for (let gx = 0; gx <= W; gx += 40) { x.beginPath(); x.moveTo(gx + 0.5, 0); x.lineTo(gx + 0.5, H); x.stroke(); }
        for (let gy = 0; gy <= H; gy += 40) { x.beginPath(); x.moveTo(0, gy + 0.5); x.lineTo(W, gy + 0.5); x.stroke(); }
        x.strokeStyle = c('blue', 0.11);
        for (let gx = 0; gx <= W; gx += 200) { x.beginPath(); x.moveTo(gx + 0.5, 0); x.lineTo(gx + 0.5, H); x.stroke(); }
        for (let gy = 0; gy <= H; gy += 200) { x.beginPath(); x.moveTo(0, gy + 0.5); x.lineTo(W, gy + 0.5); x.stroke(); }
      }
      if (this.style === 'desk') {
        const r = UF.rng(this.seed);
        x.strokeStyle = 'rgba(255,240,210,.018)';
        for (let i = 0; i < 260; i++) {
          const y = r() * H;
          x.lineWidth = 1 + r() * 3;
          x.beginPath(); x.moveTo(0, y); x.bezierCurveTo(W * 0.3, y + (r() - 0.5) * 30, W * 0.7, y + (r() - 0.5) * 30, W, y + (r() - 0.5) * 20); x.stroke();
        }
      }
      return (this._plate = cv);
    }

    draw(ctx, t, fx, scene) {
      if (scene.key) return;
      ctx.drawImage(this.plate(), 0, 0);
      if (!this.dust) return;
      const r = UF.rng(this.seed * 31 + 7);
      ctx.fillStyle = c('paper');
      for (let i = 0; i < this.dustCount; i++) {
        const bx = r() * W, by = r() * H, sp = 6 + r() * 18, size = 0.8 + r() * 1.8, ph = r() * 6.28;
        const x = (bx + t * sp * 0.6 + Math.sin(t * 0.3 + ph) * 20) % W;
        const y = (by - t * sp + H * 4) % H;
        ctx.globalAlpha = (0.05 + 0.12 * (0.5 + 0.5 * Math.sin(t * 1.3 + ph))) * this.vis(t);
        ctx.fillRect(x, y, size, size);
      }
      ctx.globalAlpha = 1;
    }
  }
  UF.Background = Background;

  /* ------------------------------------------------------------------ */
  /* Heading — kicker + title in a top corner                            */
  /* ------------------------------------------------------------------ */
  /**
   * new UF.Heading({ kicker: 'FUNDS TRACE · FEB 2016', title: 'Where the money went', at: 0.3 })
   */
  class Heading extends UF.Component {
    constructor(o) { super({ kicker: '', title: '', x: 96, y: 96, align: 'left', size: 64, color: c('paper'), accent: c('red'), maxWidth: 1100 }, o); }
    draw(ctx, t) {
      const a = this.vis(t);
      if (a <= 0) return;
      const lt = t - this.at;
      ctx.globalAlpha = a;
      const ax = this.x;
      ctx.font = UF.font.mono(20, 'bold');
      D.text(ctx, D.typed(this.kicker, seg(lt, 0, 0.5)), ax, this.y, { color: this.accent, spacing: 6, align: this.align });
      const rw = 64 * ease.outExpo(seg(lt, 0.15, 0.6));
      ctx.fillStyle = this.accent;
      ctx.fillRect(this.align === 'right' ? ax - rw : this.align === 'center' ? ax - rw / 2 : ax, this.y + 18, rw, 3);
      if (this.title) {
        const p = ease.outExpo(seg(lt, 0.25, 0.9));
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, this.y + 26, W, this.size * 1.25);
        ctx.clip();
        ctx.font = UF.font.display(this.size);
        D.text(ctx, this.title, ax, this.y + 26 + this.size * 1.02 + (1 - p) * this.size * 1.2, { color: this.color, spacing: 1.5, align: this.align });
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  }
  UF.Heading = Heading;

  /* ------------------------------------------------------------------ */
  /* SourceTag — "SOURCE · Reuters, March 2016"                           */
  /* ------------------------------------------------------------------ */
  class SourceTag extends UF.Component {
    /** backing: true puts a dark plate behind the line, for scenes where paper or cards pass under it. */
    constructor(o) { super({ text: '', label: 'SOURCE', x: 96, y: H - 70, align: 'left', color: c('dim'), backing: false }, o); }
    draw(ctx, t) {
      const a = this.vis(t);
      if (a <= 0 || !this.text) return;
      ctx.globalAlpha = a;
      ctx.font = UF.font.mono(17, 'bold');
      const lw = D.measure(ctx, this.label, 4);
      ctx.font = UF.font.mono(17);
      const tw = D.measure(ctx, this.text, 1);
      const total = 18 + lw + 20 + tw;
      let x = this.align === 'right' ? this.x - total : this.align === 'center' ? this.x - total / 2 : this.x;
      if (this.backing) {
        ctx.fillStyle = c('black', 0.78);
        D.roundRect(ctx, Math.round(x - 14), this.y - 25, Math.round(total + 28), 36, 3);
        ctx.fill();
      }
      ctx.fillStyle = c('blue');
      ctx.fillRect(x, this.y - 11, 8, 8);
      x += 18;
      ctx.font = UF.font.mono(17, 'bold');
      D.text(ctx, this.label, x, this.y, { color: c('blue'), spacing: 4 });
      x += lw + 20;
      ctx.font = UF.font.mono(17);
      D.text(ctx, D.typed(this.text, seg(t - this.at, 0.1, 0.8)), x, this.y, { color: this.color, spacing: 1 });
      ctx.globalAlpha = 1;
    }
    editorial() { return { source: !!this.text }; }
  }
  UF.SourceTag = SourceTag;

  /* ------------------------------------------------------------------ */
  /* TitleCard — centred chapter / statement card                        */
  /* ------------------------------------------------------------------ */
  /**
   * new UF.TitleCard({ kicker: 'ACT 2', title: 'BUILDING THE ESCAPE ROUTE', sub: 'May 2015 — Feb 2016' })
   */
  class TitleCard extends UF.Component {
    constructor(o) { super({ kicker: '', title: '', sub: '', x: W / 2, y: H / 2, size: 120, accent: c('red') }, o); }
    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      const lt = t - this.at;
      ctx.globalAlpha = a;
      ctx.font = UF.font.mono(24, 'bold');
      D.text(ctx, this.kicker, this.x, this.y - this.size * 0.75, { color: this.accent, spacing: 12, align: 'center' });
      const p = ease.outExpo(seg(lt, 0.1, 1.1));
      ctx.font = UF.font.display(this.size);
      const sp = lerp(26, 6, p);
      ctx.globalAlpha = a * clamp(p * 1.6);
      D.text(ctx, this.title, this.x, this.y + this.size * 0.36, { color: c('paper'), spacing: sp, align: 'center' });
      ctx.globalAlpha = a;
      const rw = 360 * ease.outExpo(seg(lt, 0.35, 0.9));
      ctx.fillStyle = this.accent;
      ctx.fillRect(this.x - rw / 2, this.y + this.size * 0.62, rw, 3);
      if (this.sub) {
        ctx.font = UF.font.mono(26);
        ctx.globalAlpha = a * seg(lt, 0.6, 0.6);
        D.text(ctx, this.sub, this.x, this.y + this.size * 0.62 + 56, { color: c('dim'), spacing: 4, align: 'center' });
      }
      ctx.globalAlpha = 1;
      fx.kick(t, this.at + 0.1, { rgb: 0.25, decay: 8 });
    }
  }
  UF.TitleCard = TitleCard;

  /* ------------------------------------------------------------------ */
  /* LowerThird                                                          */
  /* ------------------------------------------------------------------ */
  /**
   * new UF.LowerThird({ name: 'Jane Doe', role: 'Former bank official', style: 'bar', status: 'charged' })
   * style: 'bar' (panel with red edge) | 'minimal' (no panel, for busy footage) | 'tag' (compact box).
   * status: a key from UF.draw.STATUS or { text, color }; statusNote adds a short line beside it.
   */
  class LowerThird extends UF.Component {
    constructor(o) {
      super({ name: '', role: '', style: 'bar', status: null, statusNote: '', x: 96, y: H - 190, align: 'left', accent: c('red') }, o);
      if (!['bar', 'minimal', 'tag'].includes(this.style)) throw new Error(`LowerThird: style must be 'bar', 'minimal' or 'tag', not "${this.style}".`);
      if (this.status) D.statusInfo(this.status);
    }

    draw(ctx, t) {
      const a = this.vis(t);
      if (a <= 0) return;
      const lt = t - this.at;
      ctx.globalAlpha = a;
      const box = this.style === 'minimal' ? this.drawMinimal(ctx, lt) : this.style === 'tag' ? this.drawTag(ctx, lt) : this.drawBar(ctx, lt);
      if (this.status) {
        const sp = ease.outExpo(seg(lt, 0.45, 0.5));
        const right = this.align === 'right';
        const bx = right ? box.x + box.w : box.x, by = box.y + box.h + 28;
        ctx.globalAlpha = a * sp;
        const bw = D.statusBadge(ctx, this.status, bx + (right ? 1 : -1) * (1 - sp) * 16, by, { align: right ? 'right' : 'left', size: 18, h: 36 });
        if (this.statusNote) {
          ctx.font = UF.font.mono(18);
          D.text(ctx, this.statusNote, right ? bx - bw - 16 : bx + bw + 16, by + 6, { color: c('paper'), spacing: 1, align: right ? 'right' : 'left' });
        }
      }
      ctx.globalAlpha = 1;
    }

    left(w) { return this.align === 'right' ? this.x - w : this.x; }

    drawBar(ctx, lt) {
      const p = ease.outExpo(seg(lt, 0, 0.8));
      ctx.font = UF.font.display(54);
      const nw = D.measure(ctx, this.name, 2);
      ctx.font = UF.font.mono(20);
      const rw = D.measure(ctx, this.role, 3);
      const w = Math.max(nw, rw) + 64, x = this.left(w);
      const right = this.align === 'right';
      const rx = right ? x + w * (1 - p) : x;
      ctx.fillStyle = c('panel', 0.88);
      ctx.fillRect(rx, this.y, w * p, 120);
      ctx.fillStyle = this.accent;
      ctx.fillRect(right ? x + w - 6 : x, this.y, 6, 120 * ease.outExpo(seg(lt, 0, 0.5)));
      ctx.save();
      ctx.beginPath(); ctx.rect(rx, this.y, w * p, 120); ctx.clip();
      ctx.font = UF.font.display(54);
      D.text(ctx, this.name, x + 32, this.y + 66, { color: c('paper'), spacing: 2 });
      ctx.font = UF.font.mono(20);
      D.text(ctx, this.role, x + 34, this.y + 98, { color: c('dim'), spacing: 3 });
      ctx.restore();
      return { x, y: this.y, w, h: 120 };
    }

    drawMinimal(ctx, lt) {
      ctx.font = UF.font.display(50);
      const nw = D.measure(ctx, this.name, 2);
      ctx.font = UF.font.mono(20, 'bold');
      const rw = D.measure(ctx, this.role, 3);
      const w = Math.max(nw, rw), x = this.left(w);
      const right = this.align === 'right';
      const rule = 64 * ease.outExpo(seg(lt, 0, 0.6));
      ctx.fillStyle = this.accent;
      ctx.fillRect(right ? x + w - rule : x, this.y, rule, 3);
      const p = ease.outExpo(seg(lt, 0.12, 0.8));
      ctx.save();
      ctx.beginPath(); ctx.rect(x - 20, this.y + 6, w + 40, 64); ctx.clip();
      ctx.font = UF.font.display(50);
      D.text(ctx, this.name, right ? x + w : x, this.y + 60 + (1 - p) * 60, { color: c('paper'), spacing: 2, align: right ? 'right' : 'left' });
      ctx.restore();
      ctx.globalAlpha *= seg(lt, 0.35, 0.5);
      ctx.font = UF.font.mono(20, 'bold');
      D.text(ctx, this.role, right ? x + w : x, this.y + 94, { color: c('paper', 0.8), spacing: 3, align: right ? 'right' : 'left' });
      return { x, y: this.y, w, h: 104 };
    }

    drawTag(ctx, lt) {
      const p = ease.outExpo(seg(lt, 0, 0.7));
      const name = this.name.toUpperCase();
      ctx.font = UF.font.mono(28, 'bold');
      const nw = D.measure(ctx, name, 3);
      ctx.font = UF.font.mono(17);
      const rw = D.measure(ctx, this.role, 2);
      const w = Math.max(nw, rw) + 64, h = 86, x = this.left(w);
      const right = this.align === 'right';
      const rx = right ? x + w * (1 - p) : x;
      ctx.fillStyle = c('black', 0.86);
      ctx.fillRect(rx, this.y, w * p, h);
      ctx.fillStyle = this.accent;
      ctx.fillRect(right ? x + w - 16 - 12 : x + 16, this.y + 22, 12 * p, 12 * p);
      ctx.save();
      ctx.beginPath(); ctx.rect(rx, this.y, w * p, h); ctx.clip();
      const tx = right ? x + w - 40 : x + 40, align = right ? 'right' : 'left';
      ctx.font = UF.font.mono(28, 'bold');
      D.text(ctx, name, tx, this.y + 38, { color: c('paper'), spacing: 3, align });
      ctx.font = UF.font.mono(17);
      D.text(ctx, this.role, tx, this.y + 68, { color: c('dim'), spacing: 2, align });
      ctx.restore();
      return { x, y: this.y, w, h };
    }

    editorial() { return { person: !!this.name, status: this.status }; }
  }
  UF.LowerThird = LowerThird;

  /* ------------------------------------------------------------------ */
  /* StatusBadge — legal status pill on its own                          */
  /* ------------------------------------------------------------------ */
  /**
   * new UF.StatusBadge({ status: 'charged', x: 96, y: 300, note: 'Denies the charges' })
   * status: a key from UF.draw.STATUS or { text, color }.
   */
  class StatusBadge extends UF.Component {
    constructor(o) {
      super({ status: 'charged', note: '', x: 96, y: 96, align: 'left', size: 18 }, o);
      D.statusInfo(this.status);
    }
    draw(ctx, t) {
      const a = this.vis(t);
      if (a <= 0) return;
      const p = ease.outExpo(seg(t - this.at, 0, 0.5));
      const right = this.align === 'right';
      ctx.globalAlpha = a;
      const bw = D.statusBadge(ctx, this.status, this.x + (right ? 1 : -1) * (1 - p) * 20, this.y, { align: this.align, size: this.size, h: this.size * 2 });
      if (this.note) {
        ctx.globalAlpha = a * seg(t - this.at, 0.25, 0.4);
        ctx.font = UF.font.mono(Math.round(this.size * 0.95));
        D.text(ctx, this.note, right ? this.x - bw - 16 : this.x + bw + 16, this.y + this.size * 0.36, { color: c('paper'), spacing: 1, align: right ? 'right' : 'left' });
      }
      ctx.globalAlpha = 1;
    }
    editorial() { return { status: this.status }; }
  }
  UF.StatusBadge = StatusBadge;

  /* ------------------------------------------------------------------ */
  /* Caption — subtitles and short quotes over footage                   */
  /* ------------------------------------------------------------------ */
  /**
   * new UF.Caption({ style: 'subtitle', note: 'Translated from Spanish',
   *   lines: [ { at: 1, text: 'I thought it was my bank calling.', speaker: 'VICTIM' },
   *            { at: 4, out: 7, text: 'The number matched my card.' } ] })
   * Each line stays until the next one starts (or its own `out`). For one line, pass `text` and `speaker`.
   * style: 'subtitle' (boxed lines) | 'quote' (serif, in quotation marks, with "— speaker").
   */
  class Caption extends UF.Component {
    constructor(o) {
      super({ text: '', speaker: '', lines: null, style: 'subtitle', note: '', x: W / 2, y: H - 120, maxWidth: 1400, size: 40 }, o);
      if (!['subtitle', 'quote'].includes(this.style)) throw new Error(`Caption: style must be 'subtitle' or 'quote', not "${this.style}".`);
      const list = this.lines || [{ text: this.text, speaker: this.speaker }];
      this.items = list.map((ln, i) => ({
        text: ln.text || '', speaker: ln.speaker || '',
        at: ln.at ?? (i === 0 ? this.at : null),
        out: ln.out,
      }));
      this.items.forEach((it, i) => {
        if (it.at == null) throw new Error(`Caption: line ${i + 1} needs an "at" time.`);
        if (it.out == null) it.out = i < this.items.length - 1 ? this.items[i + 1].at : this.out;
      });
    }

    draw(ctx, t) {
      const a = this.vis(t);
      if (a <= 0) return;
      for (const it of this.items) {
        const ia = UF.win(t, it.at, it.out, 0.2, 0.2);
        if (ia > 0) this.drawItem(ctx, t, it, a * ia);
      }
      if (this.note) {
        ctx.globalAlpha = a;
        ctx.font = UF.font.mono(16, 'bold');
        D.text(ctx, this.note.toUpperCase(), this.x, this.y + 44, { color: c('dim'), spacing: 4, align: 'center' });
      }
      ctx.globalAlpha = 1;
    }

    drawItem(ctx, t, it, a) {
      const quote = this.style === 'quote';
      const size = this.size;
      ctx.font = quote ? UF.font.serif(size, 'italic') : UF.font.sans(size, '600');
      if (!it.lines) it.lines = D.wrapBalanced(ctx, quote ? `\u201C${it.text}\u201D` : it.text, this.maxWidth);
      const lines = it.lines;
      const lh = Math.round(size * 1.38);
      const rise = (1 - ease.outCubic(seg(t, it.at, 0.3))) * 12;
      const lastY = this.y - (quote && it.speaker ? 44 : 0) + rise;
      ctx.globalAlpha = a;
      lines.forEach((ln, i) => {
        const y = lastY - (lines.length - 1 - i) * lh;
        if (!quote) {
          const w = D.measure(ctx, ln) + 36;
          ctx.fillStyle = 'rgba(0,0,0,.62)';
          ctx.fillRect(this.x - w / 2, y - size * 0.98, w, lh);
        }
        D.text(ctx, ln, this.x, y, { color: c('paper'), align: 'center' });
      });
      if (!it.speaker) return;
      ctx.font = UF.font.mono(18, 'bold');
      if (quote) {
        D.text(ctx, `\u2014 ${it.speaker.toUpperCase()}`, this.x, lastY + 44, { color: c('red'), spacing: 4, align: 'center' });
      } else {
        const top = lastY - (lines.length - 1) * lh - size * 0.98;
        D.pill(ctx, it.speaker.toUpperCase(), this.x, top - 26, { align: 'center', fill: c('red'), font: UF.font.mono(16, 'bold'), h: 30, spacing: 3 });
      }
    }

    editorial() { return { factual: this.style === 'quote' }; }
  }
  UF.Caption = Caption;

  /* ------------------------------------------------------------------ */
  /* DramaLabel — small "DRAMATISATION" tag for ANIM overlays            */
  /* ------------------------------------------------------------------ */
  /** plate: a dark backing, for shots where something light can pass under the corner. */
  class DramaLabel extends UF.Component {
    constructor(o) { super({ text: 'DRAMATISATION', corner: 'br', margin: 56, plate: false }, o); }
    draw(ctx, t) {
      const a = this.vis(t);
      if (a <= 0) return;
      ctx.save();
      ctx.font = UF.font.mono(16, 'bold');
      const w = D.measure(ctx, this.text, 4) + 30;
      const x = this.corner.includes('r') ? W - this.margin - w : this.margin;
      const y = this.corner.includes('b') ? H - this.margin : this.margin + 20;
      if (this.plate) {
        ctx.globalAlpha = a;
        D.roundRect(ctx, x - 12, y - 23, w + 16, 34, 6);
        ctx.fillStyle = 'rgba(5,6,8,0.78)';
        ctx.fill();
      }
      ctx.globalAlpha = a * 0.85;
      ctx.shadowColor = 'rgba(0,0,0,0.7)';
      ctx.shadowBlur = 6;
      ctx.fillStyle = c('red');
      ctx.beginPath(); ctx.arc(x + 6, y - 6, 5, 0, Math.PI * 2); ctx.fill();
      D.text(ctx, this.text, x + 22, y, { color: c('paper'), spacing: 4 });
      ctx.restore();
    }
    editorial() { return { sceneLabel: this.text }; }
  }
  UF.DramaLabel = DramaLabel;

  /* ------------------------------------------------------------------ */
  /* Disclaimer — legal / "charged, not convicted" card                  */
  /* ------------------------------------------------------------------ */
  class Disclaimer extends UF.Component {
    constructor(o) { super({ title: 'PLEASE NOTE', text: '', x: W / 2, y: H / 2, width: 1100 }, o); }
    draw(ctx, t) {
      const a = this.vis(t);
      if (a <= 0) return;
      ctx.globalAlpha = a;
      ctx.font = UF.font.serif(46);
      const lines = D.wrap(ctx, this.text, this.width - 120);
      const h = 150 + lines.length * 64;
      const x = this.x - this.width / 2, y = this.y - h / 2;
      D.panel(ctx, x, y, this.width, h, { tickColor: c('amber') });
      D.icon(ctx, 'alert', x + 76, y + 68, 40, { color: c('amber'), width: 7 });
      ctx.font = UF.font.mono(20, 'bold');
      D.text(ctx, this.title, x + 116, y + 76, { color: c('amber'), spacing: 6 });
      ctx.font = UF.font.serif(46);
      ctx.fillStyle = c('paper');
      lines.forEach((ln, i) => { ctx.globalAlpha = a * seg(t - this.at, 0.2 + i * 0.12, 0.4); ctx.fillText(ln, x + 60, y + 150 + i * 64); });
      ctx.globalAlpha = 1;
    }
  }
  UF.Disclaimer = Disclaimer;

  /* ------------------------------------------------------------------ */
  /* Stamp — rubber stamp that slams in                                  */
  /* ------------------------------------------------------------------ */
  class Stamp extends UF.Component {
    constructor(o) { super({ text: 'FAKE', x: W / 2, y: H / 2, size: 120, angle: -12, color: c('red'), fadeIn: 0, kick: true, seed: 5 }, o); }
    texture() {
      if (this._tex) return this._tex;
      const fnt = UF.font.display(this.size);
      const m = UF.canvas(10, 10).getContext('2d');
      m.font = fnt;
      const tw = D.measure(m, this.text, this.size * 0.08);
      const w = tw + this.size * 0.9, h = this.size * 1.55;
      const cv = UF.canvas(w, h), x = cv.getContext('2d');
      x.strokeStyle = this.color;
      x.fillStyle = this.color;
      x.lineWidth = this.size * 0.07;
      D.roundRect(x, x.lineWidth, x.lineWidth, w - x.lineWidth * 2, h - x.lineWidth * 2, this.size * 0.12);
      x.stroke();
      x.font = fnt;
      D.text(x, this.text, w / 2, h / 2 + this.size * 0.36, { align: 'center', spacing: this.size * 0.08 });
      x.globalCompositeOperation = 'destination-out';
      const r = UF.rng(this.seed);
      for (let i = 0; i < w * h / 60; i++) {
        x.globalAlpha = 0.25 + r() * 0.75;
        x.fillRect(r() * w, r() * h, 1 + r() * 3, 1 + r() * 2);
      }
      return (this._tex = cv);
    }
    draw(ctx, t, fx) {
      if (t < this.at) return;
      const a = this.vis(t);
      const p = seg(t, this.at, 0.14);
      const s = lerp(1.9, 1, ease.inCubic(p));
      const tex = this.texture();
      ctx.save();
      ctx.globalAlpha = a * (0.25 + 0.75 * p) * 0.92;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle * Math.PI / 180);
      ctx.scale(s, s);
      ctx.drawImage(tex, -tex.width / 2, -tex.height / 2);
      ctx.restore();
      if (this.kick) fx.kick(t, this.at + 0.14, { shake: 0.012, rgb: 0.6, flash: 0.15, decay: 11 });
    }
    editorial() { return { stamps: [this.text] }; }
  }
  UF.Stamp = Stamp;

  /* ------------------------------------------------------------------ */
  /* Counter — big rolling number                                        */
  /* ------------------------------------------------------------------ */
  /**
   * new UF.Counter({ value: 951e6, prefix: '$', at: 0.2, dur: 2.4, x: 960, y: 560, size: 150 })
   * Set `cents: true` to append ".00"; `label` draws a caption underneath.
   */
  class Counter extends UF.Component {
    constructor(o) { super({ value: 0, from: 0, prefix: '$', suffix: '', cents: false, dur: 2.4, x: W / 2, y: H / 2, size: 150, color: c('paper'), label: '', strike: null, easing: 'outExpo', kick: true }, o); }
    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      const lt = t - this.at;
      const p = UF.easeFn(this.easing)(seg(lt, 0, this.dur));
      const v = lerp(this.from, this.value, p);
      const s = `${this.prefix}${Math.floor(v).toLocaleString('en-US')}${this.cents ? '.00' : ''}${this.suffix}`;
      ctx.globalAlpha = a;
      ctx.font = UF.font.display(this.size);
      const w = D.text(ctx, s, this.x, this.y, { color: this.color, spacing: this.size * 0.03, align: 'center' });
      if (this.label) {
        ctx.font = UF.font.mono(this.size * 0.17);
        D.text(ctx, this.label, this.x, this.y + this.size * 0.5, { color: c('dim'), spacing: 6, align: 'center' });
      }
      if (this.strike !== null && t > this.strike) {
        const sp = ease.outExpo(seg(t, this.strike, 0.35));
        ctx.fillStyle = c('red');
        ctx.fillRect(this.x - w / 2 - 20, this.y - this.size * 0.36, (w + 40) * sp, this.size * 0.07);
        if (this.kick) fx.kick(t, this.strike, { shake: 0.008, rgb: 0.4, decay: 12 });
      }
      if (this.kick) fx.kick(t, this.at + this.dur * 0.55, { flash: 0.12, rgb: 0.25, decay: 6 });
      ctx.globalAlpha = 1;
    }
    editorial() { return { factual: true }; }
  }
  UF.Counter = Counter;

  /* ------------------------------------------------------------------ */
  /* DataPanel — rows of label / value that tick in one by one           */
  /* ------------------------------------------------------------------ */
  /**
   * new UF.DataPanel({ x, y, w, title: 'THE 35 ORDERS', rows: [
   *   { at: 1, label: 'Sent', value: 951e6, money: true },
   *   { at: 2, label: 'Held', value: '30 orders', color: 'blue' } ] })
   */
  class DataPanel extends UF.Component {
    constructor(o) { super({ x: 1300, y: 300, w: 520, title: '', rows: [], rowH: 64, count: 0.9 }, o); }
    draw(ctx, t) {
      const a = this.vis(t);
      if (a <= 0) return;
      const lt = t - this.at;
      const h = 76 + this.rows.length * this.rowH + 20;
      const open = ease.outExpo(seg(lt, 0, 0.6));
      ctx.globalAlpha = a;
      ctx.save();
      ctx.beginPath(); ctx.rect(this.x - 30, this.y - 30, this.w + 60, (h + 60) * open); ctx.clip();
      D.panel(ctx, this.x, this.y, this.w, h, { label: this.title });
      this.rows.forEach((r, i) => {
        const ra = seg(t, r.at, 0.35);
        if (ra <= 0) return;
        const y = this.y + 76 + i * this.rowH + this.rowH * 0.62;
        ctx.globalAlpha = a * ra;
        ctx.fillStyle = c('line');
        ctx.fillRect(this.x + 22, y - this.rowH * 0.62, this.w - 44, 1);
        ctx.font = UF.font.mono(20);
        D.text(ctx, r.label, this.x + 24 + (1 - ra) * 12, y, { color: c(r.labelColor || 'dim'), spacing: 2 });
        let val = r.value;
        if (typeof val === 'number') {
          const v = val * ease.outExpo(seg(t, r.at, r.dur || this.count));
          val = r.money ? D.money(v, { compact: r.compact !== false, decimals: r.decimals }) : Math.round(v).toLocaleString('en-US');
        }
        ctx.font = UF.font.mono(r.size || 26, 'bold');
        D.text(ctx, val, this.x + this.w - 24, y, { color: c(r.color || 'paper'), spacing: 1, align: 'right' });
        if (r.strike && t > r.strike) {
          const sw = D.measure(ctx, val, 1) * ease.outExpo(seg(t, r.strike, 0.3));
          ctx.fillStyle = c('red');
          ctx.fillRect(this.x + this.w - 24 - D.measure(ctx, val, 1), y - 10, sw, 3);
        }
      });
      ctx.restore();
      ctx.globalAlpha = 1;
    }
    editorial() { return { factual: true }; }
  }
  UF.DataPanel = DataPanel;
})(window.UF);

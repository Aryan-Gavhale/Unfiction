/*!
 * Unfiction GFX Toolkit — Compare
 * Two panels side by side that turn out to match: a word against a word or an icon, or two code
 * listings whose matching lines glow and join. A verdict lands between them, and an optional word
 * can be stamped across the whole frame afterwards.
 *
 *   new UF.Compare({
 *     left:  { label: 'PAYMENT ADDRESS', title: 'JUPITER ST', sub: 'Street name · Makati', sign: true },
 *     right: { label: 'US SANCTIONS LIST', title: 'JUPITER', sub: 'Oil tanker · Iran', icon: 'ship' },
 *     link:  { at: 4, label: 'MATCH' },
 *   })
 *
 *   new UF.Compare({ label: 'ILLUSTRATION',
 *     left:  { label: 'BANGLADESH BANK · 2016', code: [ ... ], match: [2, 6] },
 *     right: { label: 'SONY PICTURES · 2014', code: [ ... ], match: [3, 7] },
 *     link:  { at: 5, label: 'MATCHING CODE' }, overlay: { at: 9, text: 'LAZARUS' } })
 *
 * match is a line range [first, last] (0-based, inclusive) or a list of ranges; the two sides pair up in order.
 * Code on screen is illustrative unless it is the real listing, so code panels need a label.
 */
(function (UF) {
  'use strict';

  const { c, seg, ease, lerp, clamp } = UF;
  const D = UF.draw;
  const W = UF.W, H = UF.H;
  const SIDE_KEYS = ['label', 'title', 'sub', 'sign', 'icon', 'code', 'match', 'at'];
  const KEYWORDS = /^(void|int|char|for|while|if|else|return|DWORD|HANDLE|BOOL|LPCSTR|LPSTR|BYTE|static|const|unsigned|sizeof|NULL)$/;
  const LINE_H = 36, CODE_TOP = 92;

  class Compare extends UF.Component {
    constructor(o) {
      super({
        left: null, right: null, link: null, overlay: null,
        x: W / 2, y: 580, w: 1700, h: 640, gap: 180, titleSize: 120, codeSize: 21,
        label: '', color: 'red', matchColor: 'amber',
      }, o);
      this.pw = Math.round((this.w - this.gap) / 2);
      this.py = Math.round(this.y - this.h / 2);
      this.sides = ['left', 'right'].map((k, i) => {
        const s = this[k];
        if (!s || typeof s !== 'object') throw new Error(`Compare: pass ${k}: { ... }.`);
        const bad = Object.keys(s).filter(q => !SIDE_KEYS.includes(q));
        if (bad.length) throw new Error(`Compare: ${k} has unknown key "${bad[0]}" — use ${SIDE_KEYS.join(', ')}.`);
        if (!!s.title === !!s.code) throw new Error(`Compare: ${k} needs a title or code, not both.`);
        if (s.icon && !D.iconNames.includes(s.icon)) throw new Error(`Compare: ${k} icon "${s.icon}" is not one of ${D.iconNames.join(', ')}.`);
        const ranges = s.match == null ? [] : Array.isArray(s.match[0]) ? s.match : [s.match];
        for (const r of ranges) {
          if (!s.code || r.length !== 2 || !(r[0] >= 0 && r[0] <= r[1] && r[1] < s.code.length)) {
            throw new Error(`Compare: ${k} match ${JSON.stringify(r)} is not a line range in its code.`);
          }
        }
        const px = Math.round(i === 0 ? this.x - this.w / 2 : this.x + this.gap / 2);
        return Object.assign({ side: k, at: this.at + i * 0.5 }, s, { ranges, px, index: i });
      });
      const [L, R] = this.sides;
      if (!!L.code !== !!R.code) throw new Error('Compare: both sides must be code, or neither.');
      if (L.ranges.length !== R.ranges.length) throw new Error('Compare: left and right need the same number of match ranges — they pair up in order.');
      this.isCode = !!L.code;
      if (this.link && !Number.isFinite(this.link.at)) throw new Error('Compare: link needs an at time.');
      if (this.overlay && (!Number.isFinite(this.overlay.at) || !this.overlay.text)) throw new Error('Compare: overlay needs at and text.');
      for (const s of this.sides) if (!this.isCode) this.place(s);
    }

    /** Where a word panel's title sits, so the link can join the two titles. */
    place(s) {
      const m = UF.canvas(4, 4).getContext('2d');
      const cy = this.h / 2 + 10;
      if (s.sign) {
        m.font = UF.font.sans(88, 'bold');
        const sw = D.measure(m, s.title, 88 * 0.04) + 88 * 1.1;
        s.titleY = cy - 20;
        s.subY = s.titleY + 88 * 0.78 + 58;
        s.half = sw / 2;
      } else {
        const size = s.icon ? 96 : this.titleSize;
        m.font = UF.font.display(size);
        s.size = size;
        s.titleY = s.icon ? cy + 100 : cy;
        s.subY = s.titleY + size * 0.36 + 58;
        s.half = D.measure(m, s.title, 3) / 2;
      }
    }

    /** Panel, label and static content of one side, drawn once. */
    panelSprite(s, res) {
      if (s.sprite && s.spriteRes === res) return s.sprite;
      const w = this.pw, h = this.h;
      const cv = UF.canvas(w * res, h * res), x = cv.getContext('2d');
      x.scale(res, res);
      D.panel(x, 0, 0, w, h, { shadow: false, fill: c('panel', 0.95), tickColor: c('blue') });
      if (s.label) {
        x.font = UF.font.mono(18, 'bold');
        D.text(x, s.label, 30, 46, { color: c('dim'), spacing: 4 });
        x.fillStyle = c('line');
        x.fillRect(30, 64, w - 60, 1.5);
      }
      if (this.isCode) this.drawCode(x, s);
      else this.drawWord(x, s);
      s.sprite = cv;
      s.spriteRes = res;
      return cv;
    }

    drawWord(x, s) {
      const cx = this.pw / 2;
      if (s.icon) {
        const iy = this.h / 2 - 80;
        D.icon(x, s.icon, cx, iy, 250, { color: c('paper'), width: 3.2, fill: c('paper', 0.1) });
        x.strokeStyle = c('blue', 0.45);
        x.lineWidth = 2;
        for (let r = 0; r < 3; r++) {
          const wy = iy + 72 + r * 14, half = 150 - r * 30;
          x.beginPath();
          for (let k = 0; k <= 24; k++) {
            const px = cx - half + (half * 2) * k / 24;
            k ? x.lineTo(px, wy + Math.sin(k * 1.3 + r) * 3) : x.moveTo(px, wy);
          }
          x.stroke();
        }
      }
      if (s.sign) D.sign(x, s.title, cx, s.titleY, { size: 88 });
      else {
        x.font = UF.font.display(s.size);
        D.text(x, s.title, cx, s.titleY + s.size * 0.36, { color: c('paper'), spacing: 3, align: 'center' });
      }
      if (s.sub) {
        x.font = UF.font.mono(22);
        D.text(x, s.sub, cx, s.subY, { color: c('dim'), spacing: 3, align: 'center' });
      }
    }

    drawCode(x, s) {
      x.font = UF.font.mono(this.codeSize);
      x.textBaseline = 'alphabetic';
      s.code.forEach((ln, i) => {
        const y = CODE_TOP + 25 + i * LINE_H;
        x.fillStyle = c('dim', 0.55);
        x.textAlign = 'right';
        x.fillText(String(i + 1), 52, y);
        x.textAlign = 'left';
        let cx = 72;
        for (const tok of ln.match(/\s+|\/\/.*|"[^"]*"|0x[0-9A-Fa-f]+|\d+|[A-Za-z_]\w*|./g) || []) {
          x.fillStyle = /^\/\//.test(tok) ? c('dim') : KEYWORDS.test(tok) ? '#6e9fd6'
            : /^(0x[0-9A-Fa-f]+|\d+)$/.test(tok) ? c('amber') : /^"/.test(tok) ? c('green') : c('paper', 0.88);
          x.fillText(tok, cx, y);
          cx += x.measureText(tok).width;
        }
      });
    }

    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      const m = ctx.getTransform();
      const res = Math.min(2, Math.max(1, Math.ceil(Math.hypot(m.a, m.b))));
      const dimUnder = this.overlay ? 1 - 0.45 * ease.outCubic(seg(t, this.overlay.at, 0.6)) : 1;
      ctx.save();
      for (const s of this.sides) {
        const k = ease.outExpo(seg(t, s.at, 0.8));
        if (k <= 0) continue;
        const ox = Math.round((1 - k) * (s.index ? 70 : -70));
        ctx.globalAlpha = a * k * dimUnder;
        const sh = D.shadowSprite(this.pw, this.h, 4, 28);
        ctx.save();
        ctx.globalAlpha *= 0.65;
        ctx.drawImage(sh, s.px + ox - sh.pad, this.py + 18 - sh.pad);
        ctx.restore();
        ctx.drawImage(this.panelSprite(s, res), s.px + ox, this.py, this.pw, this.h);
      }
      ctx.globalAlpha = a * dimUnder;
      if (this.label) {
        D.pill(ctx, this.label, this.x + this.w / 2, this.py - 30, { align: 'right', fill: c('red'), font: UF.font.mono(15, 'bold'), h: 28, spacing: 3 });
      }
      if (this.link) {
        if (this.isCode) this.drawRibbons(ctx, t, fx, a * dimUnder);
        else this.drawLink(ctx, t, fx, a * dimUnder);
      }
      if (this.overlay) this.drawOverlay(ctx, t, fx, a);
      ctx.restore();
    }

    /** Matching code ranges light up and a band joins each pair across the gap. */
    drawRibbons(ctx, t, fx, alpha) {
      const [L, R] = this.sides, lk = this.link, col = this.matchColor;
      const rowTop = (r, i) => this.py + CODE_TOP + r[i === 0 ? 0 : 1] * LINE_H + (i === 0 ? 0 : LINE_H);
      L.ranges.forEach((lr, j) => {
        const rr = R.ranges[j];
        const at = lk.at + j * 0.5;
        const p = ease.outCubic(seg(t, at, 0.5));
        if (p <= 0) return;
        const pulse = 0.8 + 0.2 * Math.sin((t - at) * 3.2);
        for (const [s, r] of [[L, lr], [R, rr]]) {
          const y0 = rowTop(r, 0) - 2, y1 = rowTop(r, 1) + 2;
          ctx.save();
          ctx.globalCompositeOperation = 'lighter';
          ctx.globalAlpha = alpha * p * pulse;
          ctx.fillStyle = c(col, 0.2);
          ctx.fillRect(s.px + 16, y0, this.pw - 32, y1 - y0);
          ctx.restore();
          ctx.globalAlpha = alpha * p;
          ctx.fillStyle = c(col);
          ctx.fillRect(s.index ? s.px + 16 : s.px + this.pw - 20, y0, 4, y1 - y0);
        }
        const bp = ease.inOutCubic(seg(t, at + 0.25, 0.7));
        if (bp <= 0) return;
        const xa = L.px + this.pw - 16, xb = R.px + 16, d = (xb - xa) / 2;
        const ya0 = rowTop(lr, 0), ya1 = rowTop(lr, 1), yb0 = rowTop(rr, 0), yb1 = rowTop(rr, 1);
        ctx.save();
        ctx.beginPath();
        ctx.rect(xa, 0, (xb - xa) * bp, H);
        ctx.clip();
        ctx.beginPath();
        ctx.moveTo(xa, ya0);
        ctx.bezierCurveTo(xa + d, ya0, xb - d, yb0, xb, yb0);
        ctx.lineTo(xb, yb1);
        ctx.bezierCurveTo(xb - d, yb1, xa + d, ya1, xa, ya1);
        ctx.closePath();
        ctx.globalAlpha = alpha * pulse;
        ctx.fillStyle = c(col, 0.24);
        ctx.fill();
        ctx.strokeStyle = c(col, 0.8);
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.restore();
        if (lk.kick !== false) fx.kick(t, at + 0.95, { rgb: 0.4, flash: 0.08, decay: 10 });
      });
      if (lk.label) {
        const p = ease.outBack(seg(t, lk.at + 0.6, 0.45));
        if (p > 0) {
          ctx.save();
          ctx.globalAlpha = alpha * clamp(p);
          ctx.translate(this.x, this.py - 34);
          ctx.scale(lerp(0.6, 1, clamp(p)), lerp(0.6, 1, clamp(p)));
          D.pill(ctx, lk.label, 0, 0, { align: 'center', fill: c(col), color: c('black'), font: UF.font.mono(24, 'bold'), h: 48, padX: 22, spacing: 4 });
          ctx.restore();
        }
      }
    }

    /** A red line from one title to the other, then the verdict pill at its middle. */
    drawLink(ctx, t, fx, alpha) {
      const [L, R] = this.sides, lk = this.link, col = lk.color || this.color;
      const ax = L.px + this.pw / 2 + L.half + 26, ay = this.py + L.titleY;
      const bx = R.px + this.pw / 2 - R.half - 26, by = this.py + R.titleY;
      const p = ease.inOutCubic(seg(t, lk.at, 0.6));
      if (p <= 0) return;
      const pts = [[ax, ay], [bx, by]];
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.lineCap = 'round';
      ctx.strokeStyle = c(col, 0.25);
      ctx.lineWidth = 14;
      D.partialPath(ctx, pts, p);
      ctx.stroke();
      ctx.strokeStyle = c(col);
      ctx.lineWidth = 5;
      D.partialPath(ctx, pts, p);
      ctx.stroke();
      ctx.fillStyle = c(col);
      ctx.beginPath();
      ctx.arc(ax, ay, 8, 0, Math.PI * 2);
      if (p >= 1) ctx.arc(bx, by, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      if (lk.label) {
        const q = ease.outBack(seg(t, lk.at + 0.55, 0.4));
        if (q > 0) {
          ctx.save();
          ctx.globalAlpha = alpha * clamp(q);
          ctx.translate((ax + bx) / 2, (ay + by) / 2);
          ctx.scale(lerp(1.6, 1, clamp(q)), lerp(1.6, 1, clamp(q)));
          D.pill(ctx, lk.label, 0, 0, { align: 'center', fill: c(col), font: UF.font.display(54), h: 84, padX: 30, spacing: 8, radius: 4 });
          ctx.restore();
        }
        if (lk.kick !== false) fx.kick(t, lk.at + 0.6, { shake: 0.01, rgb: 0.7, flash: 0.15, decay: 11 });
      }
    }

    /** One word stamped across the frame on a dark band. */
    drawOverlay(ctx, t, fx, alpha) {
      const o = this.overlay, p = seg(t, o.at, 0.9);
      if (p <= 0) return;
      const e = ease.outExpo(p), size = o.size || 230;
      ctx.save();
      ctx.globalAlpha = alpha * clamp(p * 2.5);
      const bh = size * 1.25 + (o.sub ? 60 : 0);
      ctx.fillStyle = c('black', 0.78);
      ctx.fillRect(0, this.y - bh / 2, W, bh * clamp(e * 1.2));
      ctx.fillStyle = c(o.color || this.color);
      ctx.fillRect(0, this.y - bh / 2, W * e, 3);
      ctx.fillRect(W * (1 - e), this.y + bh / 2 - 3, W * e, 3);
      ctx.font = UF.font.display(size);
      const ty = this.y + size * 0.36 - (o.sub ? 26 : 0);
      D.text(ctx, o.text, W / 2, ty, { color: c(o.color || this.color), spacing: lerp(70, 16, e), align: 'center' });
      if (o.sub) {
        ctx.globalAlpha = alpha * seg(t, o.at + 0.6, 0.5);
        ctx.font = UF.font.mono(26, 'bold');
        D.text(ctx, o.sub, W / 2, ty + 64, { color: c('paper'), spacing: 6, align: 'center' });
      }
      ctx.restore();
      fx.kick(t, o.at, { glitch: 0.6, rgb: 0.9, flash: 0.2, shake: 0.008, decay: 9 });
    }

    editorial() { return { factual: true, illustration: this.isCode, label: this.label }; }
  }

  UF.Compare = Compare;
})(window.UF);

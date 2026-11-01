/*!
 * Unfiction GFX Toolkit — Thumbnail
 * A YouTube thumbnail layout: a big headline with one highlighted phrase, and optionally a subject
 * image, a stamp, a legal-status badge and a label. Press T on the page, or run tools/thumbnail.py,
 * to save the frame as a 1280x720 JPEG under 2 MB.
 *
 *   new UF.Thumbnail({
 *     kicker: 'BANGLADESH BANK · 2016',
 *     headline: 'THE $81M HACK',
 *     highlight: '$81M',
 *     image: 'suspect', person: true, status: 'charged',
 *   })
 *
 * Make it the only layer of a scene with transition: 'cut' and pushIn: 0, so the saved frame is
 * the frame you designed. When `image` shows a real person, leave `person` true (the default with an
 * image) and pass their `status`; the editorial check flags any guilt word stamped beside them.
 * YouTube covers the bottom-right corner with the video length, so nothing important goes there.
 */
(function (UF) {
  'use strict';

  const { c } = UF;
  const D = UF.draw;
  const W = UF.W, H = UF.H;
  const SIDES = ['left', 'right', 'center'];
  const PLATES = ['grid', 'void', 'desk'];
  const NBSP = '\u00A0';

  class Thumbnail extends UF.Component {
    constructor(o) {
      super({
        kicker: '', headline: '', highlight: '', image: null, person: null, status: null, stamp: null,
        background: 'grid', accent: 'red', side: 'left', label: '', mono: false, fadeIn: 0, fadeOut: 0,
      }, o);
      if (!UF.Background || !UF.Stamp) throw new Error('Thumbnail: load components/uf-overlays.js before uf-thumbnail.js.');
      if (!String(this.headline).trim()) throw new Error('Thumbnail: headline is empty.');
      if (!SIDES.includes(this.side)) throw new Error(`Thumbnail: side must be 'left', 'right' or 'center', not "${this.side}".`);
      if (this.side === 'center' && this.image) throw new Error("Thumbnail: side 'center' leaves no room for an image — use 'left' or 'right'.");
      if (this.image && !UF.images[this.image]) throw new Error(`Thumbnail: unknown image "${this.image}" — run tools/embed_images.py and load images.js after uf-core.js.`);
      if (!PLATES.includes(this.background) && !UF.images[this.background]) {
        throw new Error(`Thumbnail: background must be ${PLATES.join(', ')} or an image name, not "${this.background}".`);
      }
      const flat = String(this.headline).replace(/\s+/g, ' ');
      if (this.highlight && !flat.includes(this.highlight)) throw new Error(`Thumbnail: highlight "${this.highlight}" is not in the headline.`);
      if (this.person == null) this.person = !!this.image;
      if (this.status) D.statusInfo(this.status);
    }

    /** Headline lines and font size: the largest size at which it fits in three lines. The highlight never breaks across lines. */
    layout(ctx) {
      if (this._layout) return this._layout;
      const hl = this.highlight;
      const glued = hl ? String(this.headline).split(hl).join(hl.replace(/ /g, NBSP)) : String(this.headline);
      const maxW = this.side === 'center' ? 1640 : this.image ? 960 : this.stamp ? 1180 : 1640;
      const room = H - 230 - (this.kicker ? 90 : 0) - (this.status ? 100 : 0);
      for (let size = 250; size >= 70; size -= 6) {
        ctx.font = UF.font.display(size);
        const sp = size * 0.01;
        const lines = [];
        for (const para of glued.split('\n')) {
          let line = '';
          for (const word of para.trim().split(/ +/)) {
            const test = line ? `${line} ${word}` : word;
            if (line && D.measure(ctx, test, sp) > maxW) { lines.push(line); line = word; } else line = test;
          }
          lines.push(line);
        }
        const widest = Math.max(...lines.map(l => D.measure(ctx, l, sp)));
        if (lines.length <= 3 && widest <= maxW && lines.length * size * 1.0 <= room) return (this._layout = { lines, size, sp, maxW });
      }
      throw new Error('Thumbnail: the headline is too long to read at thumbnail size — cut it to a few words.');
    }

    sprite(res) {
      if (this._sprite && this._res === res) return this._sprite;
      const imgs = [this.image, PLATES.includes(this.background) ? null : this.background].filter(Boolean).map(n => UF.images[n]);
      const ready = imgs.every(img => img.complete && img.naturalWidth > 0);
      const cv = UF.canvas(W * res, H * res), x = cv.getContext('2d');
      x.scale(res, res);
      this.drawBackground(x);
      const imgSide = this.side === 'left' ? 'right' : 'left';
      if (this.image) this.drawSubject(x, imgSide);
      this.drawText(x);
      if (this.stamp) {
        const st = new UF.Stamp({ text: this.stamp, size: 118, angle: -11, kick: false });
        const tex = st.texture();
        // With a subject, the stamp sits low on the image side: off the face, and clear of the
        // duration badge YouTube puts in the bottom-right corner.
        const sx = this.image ? (imgSide === 'right' ? W * 0.72 : W * 0.28) : W - 330;
        const sy = this.image ? H - 220 : H / 2;
        x.save();
        x.translate(sx, sy);
        x.rotate(st.angle * Math.PI / 180);
        x.globalAlpha = 0.95;
        x.drawImage(tex, -tex.width / 2, -tex.height / 2);
        x.restore();
      }
      if (this.label) {
        const right = this.side !== 'right';
        D.pill(x, this.label, right ? W - 70 : 70, 70, { align: right ? 'right' : 'left', fill: c('red'), font: UF.font.mono(22, 'bold'), h: 42, spacing: 3 });
      }
      if (ready) { this._sprite = cv; this._res = res; }
      return cv;
    }

    drawBackground(x) {
      if (PLATES.includes(this.background)) {
        x.drawImage(new UF.Background({ style: this.background, dust: false }).plate(), 0, 0, W, H);
      } else {
        this.cover(x, UF.images[this.background], 0, 0, W, H, 0.5);
        x.fillStyle = 'rgba(0,0,0,.5)';
        x.fillRect(0, 0, W, H);
      }
      const gx = this.side === 'left' ? W * 0.78 : this.side === 'right' ? W * 0.22 : W / 2;
      const g = x.createRadialGradient(gx, H * 0.45, 0, gx, H * 0.45, W * 0.55);
      g.addColorStop(0, c(this.accent, 0.28));
      g.addColorStop(1, c(this.accent, 0));
      x.fillStyle = g;
      x.fillRect(0, 0, W, H);
    }

    /** Draws img cropped to fill the rect; ay picks the vertical crop (0 top, 0.5 centre). */
    cover(x, img, rx, ry, rw, rh, ay) {
      if (!img.complete || !img.naturalWidth) return;
      const k = Math.max(rw / img.naturalWidth, rh / img.naturalHeight);
      const sw = rw / k, sh = rh / k;
      x.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) * ay, sw, sh, rx, ry, rw, rh);
    }

    /** Subject image on one half, fading into the background on its inner edge. */
    drawSubject(x, side) {
      const iw = Math.round(W * 0.56), ix = side === 'right' ? W - iw : 0;
      const layer = UF.canvas(iw, H), lx = layer.getContext('2d');
      if (this.mono) lx.filter = 'grayscale(1) contrast(1.1)';
      this.cover(lx, UF.images[this.image], 0, 0, iw, H, 0.25);
      lx.filter = 'none';
      // destination-in clears everything outside the filled shape, so each mask covers the whole layer.
      lx.globalCompositeOperation = 'destination-in';
      const fade = side === 'right' ? lx.createLinearGradient(0, 0, 300, 0) : lx.createLinearGradient(iw, 0, iw - 300, 0);
      fade.addColorStop(0, 'rgba(0,0,0,0)');
      fade.addColorStop(1, 'rgba(0,0,0,1)');
      lx.fillStyle = fade;
      lx.fillRect(0, 0, iw, H);
      const bottom = lx.createLinearGradient(0, 0, 0, H);
      bottom.addColorStop(0, 'rgba(0,0,0,1)');
      bottom.addColorStop(0.7, 'rgba(0,0,0,1)');
      bottom.addColorStop(1, 'rgba(0,0,0,.35)');
      lx.fillStyle = bottom;
      lx.fillRect(0, 0, iw, H);
      x.drawImage(layer, ix, 0);
    }

    drawText(x) {
      const { lines, size, sp, maxW } = this.layout(x);
      const right = this.side === 'right', center = this.side === 'center';
      const left = center ? W / 2 : right ? W - 100 - maxW : 100;
      const lh = size * 1.0;
      const kickH = this.kicker ? 90 : 0, badgeH = this.status ? 100 : 0;
      const top = (H - (kickH + lines.length * lh + badgeH)) / 2 + kickH;
      const align = center ? 'center' : 'left';
      if (this.kicker) {
        x.font = UF.font.mono(36, 'bold');
        D.text(x, this.kicker, left, top - 44, { color: c(this.accent === 'red' ? 'paper' : this.accent), spacing: 8, align });
        const kw = Math.min(D.measure(x, this.kicker, 8), 160);
        x.fillStyle = c(this.accent);
        x.fillRect(center ? left - kw / 2 : left, top - 26, kw, 6);
      }
      const hl = this.highlight ? this.highlight.replace(/ /g, NBSP) : '';
      const dark = ['amber', 'green', 'paper'].includes(this.accent);
      x.font = UF.font.display(size);
      lines.forEach((ln, i) => {
        const base = top + (i + 0.86) * lh;
        const lw = D.measure(x, ln, sp);
        const lx = center ? left - lw / 2 : left;
        const at = hl ? ln.indexOf(hl) : -1;
        if (at >= 0) {
          const pre = D.measure(x, ln.slice(0, at), sp) + (at > 0 ? sp : 0);
          const hw = D.measure(x, hl, sp);
          const pad = size * 0.08;
          x.fillStyle = c(this.accent);
          x.fillRect(lx + pre - pad, base - size * 0.86, hw + pad * 2, size * 0.98);
        }
        x.save();
        x.shadowColor = 'rgba(0,0,0,.85)';
        x.shadowBlur = size * 0.12;
        x.shadowOffsetY = size * 0.03;
        if (at < 0) D.text(x, ln, lx, base, { color: c('paper'), spacing: sp });
        else {
          const pre = ln.slice(0, at), post = ln.slice(at + hl.length);
          let cx = lx;
          if (pre) cx += D.text(x, pre, cx, base, { color: c('paper'), spacing: sp }) + sp;
          x.shadowColor = 'rgba(0,0,0,0)';
          cx += D.text(x, hl, cx, base, { color: dark ? c('black') : c('paper'), spacing: sp }) + sp;
          x.shadowColor = 'rgba(0,0,0,.85)';
          if (post) D.text(x, post, cx, base, { color: c('paper'), spacing: sp });
        }
        x.restore();
      });
      if (this.status) D.statusBadge(x, this.status, left, top + lines.length * lh + 56, { align, size: 30, h: 60 });
    }

    draw(ctx, t) {
      if (this.vis(t) <= 0) return;
      const m = ctx.getTransform();
      const res = Math.min(2, Math.max(1, Math.ceil(Math.hypot(m.a, m.b))));
      ctx.drawImage(this.sprite(res), 0, 0, W, H);
    }

    editorial() {
      return { person: this.person, status: this.status, stamps: this.stamp ? [this.stamp] : [], label: this.label };
    }
  }

  UF.Thumbnail = Thumbnail;
})(window.UF);

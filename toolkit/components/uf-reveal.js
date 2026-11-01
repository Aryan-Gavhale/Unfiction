/*!
 * Unfiction GFX Toolkit — DocumentReveal
 * A typeset (or scanned) page with a highlighter sweep, redaction bars that slide off,
 * hand-drawn circles and a camera that pushes in on one clause.
 *
 *   new UF.DocumentReveal({
 *     docket: 'Case 1:00-cv-00000  Document 1  Filed 01/01/00  Page 4 of 31',
 *     header: ['IN THE DISTRICT COURT', 'FOR THE EXAMPLE DISTRICT'],
 *     title: 'COMPLAINT',
 *     body: ['The defendants sent 12 payment orders…', 'Nine were held…'],
 *     highlights: [ { find: '12 payment orders', at: 2 } ],
 *     redactions: [ { find: 'John Doe', at: 6 } ],
 *     marks:      [ { find: 'Nine were held', at: 8 } ],
 *     camera:     [ { t: 0, zoom: 1 }, { t: 4, find: '12 payment orders', zoom: 2.2 } ],
 *   })
 *
 * Effects find their text by `find` (exact words; `nth` picks a later occurrence) or by
 * `rect: [x, y, w, h]` in page pixels from the page's top-left, which is the only option on a scan.
 * A typeset page is a recreation and carries a RECREATION label unless you pass `image`.
 */
(function (UF) {
  'use strict';

  const { c, seg, ease, lerp } = UF;
  const D = UF.draw;
  const W = UF.W, H = UF.H;
  const RAD = Math.PI / 180;
  const INK = '#1b1a17';

  const norm = s => String(s).replace(/\s+/g, ' ').trim();

  class DocumentReveal extends UF.Component {
    constructor(o) {
      super({
        x: W / 2, y: 620, w: 820, h: null, angle: -0.6, seed: 17, tone: null,
        docket: '', header: [], title: '', body: [], footer: '', numbered: false,
        font: 'serif', size: 23, image: null,
        highlights: [], redactions: [], marks: [],
        camera: [{ t: 0, center: [W / 2, H / 2], zoom: 1 }],
        label: null, labelCorner: 'tr',
      }, o);
      if (!['serif', 'type', 'sans'].includes(this.font)) throw new Error(`DocumentReveal: font must be 'serif', 'type' or 'sans', not "${this.font}".`);
      if (this.image && !UF.images[this.image]) {
        throw new Error(`DocumentReveal: unknown image "${this.image}" — run tools/embed_images.py and load the generated images.js after uf-core.js.`);
      }
      if (this.label === null) this.label = this.image ? '' : 'RECREATION';
      this.userH = this.h;
      if (this.h == null) this.h = Math.round(this.w * 1.414);
      this.blocks = this.image ? [] : this.layout();
      const targets = [...this.highlights, ...this.redactions, ...this.marks, ...this.camera.filter(f => f.find || f.rect)];
      for (const tg of targets) this.rectsOf(tg);
      this.maxZoom = Math.max(1, ...this.camera.map(f => f.zoom || 1));
    }

    /* ---------------- layout ---------------- */
    fontAt(size, bold) {
      const wgt = bold ? 'bold' : 'normal';
      if (this.font === 'type') return UF.font.type(size, wgt);
      if (this.font === 'sans') return UF.font.sans(size, wgt);
      return UF.font.serif(size, 'normal', wgt);
    }

    /** Every printed line as { text, x, y, font, size, align }, grouped in blocks for searching. */
    layout() {
      const m = UF.canvas(4, 4).getContext('2d');
      const S = this.size, w = this.w;
      const margin = Math.round(w * 0.11), textW = w - margin * 2;
      const blocks = [];
      let y = margin * 0.55;
      const add = (text, font, size, align, lh, x0 = margin, width = textW, extra = {}) => {
        m.font = font;
        const lines = D.wrap(m, norm(text), width);
        const block = { lines: [], ...extra };
        for (const ln of lines) {
          y += lh;
          const x = align === 'center' ? x0 + width / 2 : x0;
          block.lines.push({ text: ln, x, y, font, size, align });
        }
        blocks.push(block);
        return block;
      };
      if (this.docket) add(this.docket, this.fontAt(Math.round(S * 0.62)), Math.round(S * 0.62), 'center', S * 0.62);
      y += this.docket ? S * 0.9 : S * 0.4;
      for (const ln of [].concat(this.header)) add(ln, this.fontAt(S, true), S, 'center', S * 1.4);
      if (this.title) {
        y += S * 0.8;
        add(this.title, this.fontAt(Math.round(S * 1.15), true), Math.round(S * 1.15), 'center', S * 1.6, margin, textW, { underline: true });
      }
      y += S * 0.9;
      const paras = Array.isArray(this.body) ? this.body : String(this.body).split(/\n\s*\n/);
      paras.forEach((p, i) => {
        const indent = this.numbered ? 0 : S * 2;
        m.font = this.fontAt(S);
        const first = D.wrap(m, norm(p), textW - indent)[0] || '';
        const rest = norm(p).slice(first.length).trim();
        const block = add(first, this.fontAt(S), S, 'left', S * 1.7, margin + indent, textW - indent, this.numbered ? { number: i + 1 } : {});
        if (rest) {
          const more = add(rest, this.fontAt(S), S, 'left', S * 1.7);
          block.lines.push(...more.lines);
          blocks.pop();
        }
        y += S * 0.55;
      });
      if (this.footer) {
        const fs = Math.round(S * 0.7);
        blocks.push({ footer: true, lines: [{ text: norm(this.footer), x: margin + textW / 2, y: this.h - margin * 0.6, font: this.fontAt(fs), size: fs, align: 'center' }] });
      }
      this.bottom = this.h - margin * (this.footer ? 1.2 : 0.5);
      return blocks;
    }

    /** Page-space rects for an effect's `find` or `rect`. Throws when the text is not on the page. */
    rectsOf(tg) {
      if (tg._rects) return tg._rects;
      if (tg.rect) return (tg._rects = [tg.rect]);
      if (!tg.find) throw new Error('DocumentReveal: every highlight, redaction, mark and camera target needs "find" or "rect".');
      if (this.image) throw new Error(`DocumentReveal: a scanned page has no searchable text — use rect: [x, y, w, h] instead of find: "${tg.find}".`);
      const needle = norm(tg.find);
      const m = UF.canvas(4, 4).getContext('2d');
      let skip = tg.nth || 0;
      for (const b of this.blocks) {
        const hay = b.lines.map(l => l.text).join(' ');
        let from = 0, idx;
        while ((idx = hay.indexOf(needle, from)) !== -1) {
          if (skip-- > 0) { from = idx + 1; continue; }
          const rects = [];
          let pos = 0;
          for (const ln of b.lines) {
            const s = Math.max(idx, pos), e = Math.min(idx + needle.length, pos + ln.text.length);
            if (e > s) {
              m.font = ln.font;
              const lineW = D.measure(m, ln.text);
              const left = ln.align === 'center' ? ln.x - lineW / 2 : ln.x;
              const x0 = left + D.measure(m, ln.text.slice(0, s - pos));
              const x1 = left + D.measure(m, ln.text.slice(0, e - pos));
              rects.push([x0, ln.y - ln.size * 0.84, x1 - x0, ln.size * 1.1]);
              if (ln.y > this.bottom && !b.footer) throw new Error(`DocumentReveal: "${tg.find}" falls below the bottom of the page — shorten the body or raise h.`);
            }
            pos += ln.text.length + 1;
          }
          return (tg._rects = rects);
        }
      }
      throw new Error(`DocumentReveal: "${tg.find}"${tg.nth ? ` (occurrence ${tg.nth + 1})` : ''} is not in the page text.`);
    }

    bounds(tg) {
      const rs = this.rectsOf(tg);
      const x0 = Math.min(...rs.map(r => r[0])), y0 = Math.min(...rs.map(r => r[1]));
      const x1 = Math.max(...rs.map(r => r[0] + r[2])), y1 = Math.max(...rs.map(r => r[1] + r[3]));
      return [x0, y0, x1 - x0, y1 - y0];
    }

    /** Page point to board point at zoom 1 (the page is rotated about its centre). */
    toBoard(px, py) {
      const a = this.angle * RAD, dx = px - this.w / 2, dy = py - this.h / 2;
      return [this.x + dx * Math.cos(a) - dy * Math.sin(a), this.y + dx * Math.sin(a) + dy * Math.cos(a)];
    }

    camAt(t) {
      const toState = f => {
        let p = f.center || [W / 2, H / 2];
        if (f.find || f.rect) { const [bx, by, bw, bh] = this.bounds(f); p = this.toBoard(bx + bw / 2, by + bh / 2); }
        return { c: p, z: f.zoom || 1 };
      };
      let cur = toState(this.camera[0]);
      for (let i = 1; i < this.camera.length; i++) {
        const f = this.camera[i];
        if (t < f.t) break;
        const p = UF.easeFn(f.ease || 'inOutCubic')(seg(t, f.t, f.dur ?? 1.6));
        const nxt = toState(f);
        cur = { c: [lerp(cur.c[0], nxt.c[0], p), lerp(cur.c[1], nxt.c[1], p)], z: Math.exp(lerp(Math.log(cur.z), Math.log(nxt.z), p)) };
      }
      return cur;
    }

    /* ---------------- page bitmap ---------------- */
    /** The page and its drop shadow baked into one bitmap at res, cached per res. Drawn at (-o, -o) page units, o = this.pageOrigin(). */
    page(res) {
      const img = this.image ? UF.images[this.image] : null;
      const ready = !img || (img.complete && img.naturalWidth > 0);
      if (img && ready && this.userH == null) this.h = Math.round(this.w * img.naturalHeight / img.naturalWidth);
      if (!this._pages) this._pages = new Map();
      if (this._pages.has(res)) return this._pages.get(res);
      const w = this.w, h = this.h, sh = D.shadowSprite(w, h, 2, 26);
      const [ox, oy] = this.pageOrigin();
      const cv = UF.canvas(sh.width * res, sh.height * res), x = cv.getContext('2d');
      x.globalAlpha = 0.62;
      x.drawImage(sh, 0, 0, cv.width, cv.height);
      x.globalAlpha = 1;
      x.scale(res, res);
      x.translate(ox, oy);
      if (img) {
        x.fillStyle = '#d9d5cb';
        x.fillRect(0, 0, w, h);
        if (ready) x.drawImage(img, 0, 0, w, h);
      } else {
        x.drawImage(D.paperTexture(w, h, this.seed, this.tone || '#ece8df'), 0, 0);
        x.fillStyle = INK;
        for (const b of this.blocks) {
          for (const ln of b.lines) {
            if (ln.y > this.bottom && !b.footer) continue;
            x.font = ln.font;
            D.text(x, ln.text, ln.x, ln.y, { color: INK, align: ln.align });
            if (b.underline) {
              const lw = D.measure(x, ln.text);
              x.fillRect(ln.x - lw / 2, ln.y + 6, lw, 2);
            }
          }
          if (b.number) {
            const ln = b.lines[0];
            x.font = ln.font;
            D.text(x, `${b.number}.`, ln.x - 18, ln.y, { color: INK, align: 'right' });
          }
        }
      }
      if (!ready) return cv;
      this._pages.set(res, cv);
      return cv;
    }

    /** Where the page's top-left sits inside its baked bitmap: the shadow is offset (12, 26) and padded by its blur. */
    pageOrigin() {
      const pad = D.shadowSprite(this.w, this.h, 2, 26).pad;
      return [pad - 12, pad - 26];
    }

    /** Lowest cached resolution that still covers the on-screen size, so the page is never shrunk below half or enlarged. */
    resFor(sc, zoom) {
      const base = UF.clamp(Math.ceil(sc * 3) / 2, 1, 3);
      const full = Math.min(3, Math.max(base, Math.ceil(sc * this.maxZoom * 2) / 2));
      const levels = full / base > 2 ? [base, Math.round(Math.sqrt(base * full) * 2) / 2, full] : [base, full];
      return levels.find(l => l >= sc * zoom - 1e-6) ?? full;
    }

    /* ---------------- draw ---------------- */
    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      const m = ctx.getTransform();
      const enter = ease.outExpo(seg(t - this.at, 0, 0.9));
      const cam = this.camAt(t);
      const pg = this.page(this.resFor(Math.hypot(m.a, m.b), cam.z));
      const w = this.w, h = this.h;
      const [ox, oy] = this.pageOrigin();

      ctx.save();
      ctx.globalAlpha = a * enter;
      ctx.translate(W / 2, H / 2);
      ctx.scale(cam.z, cam.z);
      ctx.translate(-cam.c[0], -cam.c[1]);
      ctx.translate(this.x, this.y + (1 - enter) * 60);
      ctx.rotate(this.angle * RAD);
      ctx.translate(-w / 2, -h / 2);

      const sh = D.shadowSprite(w, h, 2, 26);
      ctx.drawImage(pg, -ox, -oy, sh.width, sh.height);

      for (const hl of this.highlights) this.drawHighlight(ctx, t, hl);
      for (const rd of this.redactions) this.drawRedaction(ctx, t, rd, fx);
      for (const mk of this.marks) this.drawMark(ctx, t, mk);
      ctx.restore();

      if (this.label) {
        const right = this.labelCorner.includes('r'), bottom = this.labelCorner.includes('b');
        ctx.save();
        ctx.globalAlpha = a * enter;
        D.pill(ctx, this.label, right ? W - 96 : 96, bottom ? H - 88 : 88, { align: right ? 'right' : 'left', fill: c('red'), font: UF.font.mono(16, 'bold'), h: 32, spacing: 3 });
        ctx.restore();
      }
    }

    drawHighlight(ctx, t, hl) {
      const p = seg(t, hl.at ?? 0, hl.dur ?? 0.7);
      if (p <= 0) return;
      const rs = this.rectsOf(hl);
      const total = rs.reduce((s, r) => s + r[2], 0);
      let left = total * ease.inOutSine(p);
      const color = hl.color ? c(hl.color, 0.5) : 'rgba(232,190,60,.6)';
      for (const r of rs) {
        if (left <= 0) break;
        const k = Math.min(1, left / r[2]);
        D.highlight(ctx, r[0] - 3, r[1] + 2, r[2] + 6, r[3] - 2, k, color);
        left -= r[2];
      }
    }

    /** One circle per printed line, drawn in turn, so a wrapped phrase never gets an ellipse spanning the paragraph. */
    drawMark(ctx, t, mk) {
      const rs = this.rectsOf(mk);
      const p = seg(t, mk.at ?? 0, (mk.dur ?? 0.7) * rs.length) * rs.length;
      rs.forEach((r, i) => {
        const k = ease.inOutCubic(UF.clamp(p - i));
        if (k <= 0) return;
        const [bx, by, bw, bh] = r;
        const rx = bw * 0.6 + 10;
        const ry = (bh / 2) / Math.sqrt(1 - Math.pow(bw / 2 / rx, 2)) + 4;
        D.circleMark(ctx, bx + bw / 2, by + bh / 2, rx, ry, k, { color: c(mk.color || 'red'), width: 4.5, seed: Math.round(bx + by) });
      });
    }

    drawRedaction(ctx, t, rd, fx) {
      const rs = this.rectsOf(rd);
      const on = !!rd.on;
      // Without `at` the bar is permanent: fully on, or not yet lifted.
      const p = rd.at == null ? (on ? 1 : 0) : ease.inOutCubic(seg(t, rd.at, rd.dur ?? 0.6));
      const cover = on ? p : 1 - p;
      if (cover <= 0) return;
      ctx.save();
      ctx.fillStyle = '#0e0e0f';
      for (const r of rs) {
        const x0 = r[0] - 4, ww = r[2] + 8;
        if (on) ctx.fillRect(x0, r[1], ww * cover, r[3]);
        else ctx.fillRect(x0 + ww * (1 - cover), r[1], ww * cover, r[3]);
      }
      ctx.restore();
      if (rd.at != null && rd.kick !== false) fx.kick(t, rd.at, { rgb: 0.35, decay: 12 });
    }

    editorial() {
      return { factual: true, recreation: !this.image, label: this.label };
    }
  }

  UF.DocumentReveal = DocumentReveal;
})(window.UF);

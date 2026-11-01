/*!
 * Unfiction GFX Toolkit — PhotoWall
 * A wall of portraits that dims down to one person of interest, who steps forward with a
 * caption and a legal-status badge.
 *
 *   new UF.PhotoWall({
 *     title: 'ACCOUNT HOLDERS · 8',
 *     tiles: [
 *       { id: 'a', name: 'Person A', sub: 'Account opener', image: 'personA' },
 *       { id: 'b', name: 'Person B', sub: 'Branch manager', status: 'charged', note: 'Denies wrongdoing' },
 *       …
 *     ],
 *     focus: 'b',
 *   })
 *
 * Photos are shown in black and white, cropped towards the top so faces stay in frame; a tile
 * without `image` shows a silhouette. Without `focus` the wall simply assembles. The focus tile
 * must carry a `status` (see UF.draw.STATUS), because a face singled out on screen must say
 * where that person stands legally.
 */
(function (UF) {
  'use strict';

  const { c, seg, ease, lerp } = UF;
  const D = UF.draw;
  const W = UF.W, H = UF.H;

  const TILE_KEYS = ['id', 'name', 'sub', 'image', 'status', 'note'];
  const ASPECT = 0.8;

  class PhotoWall extends UF.Component {
    constructor(o) {
      super({
        tiles: [], focus: null, cols: null, title: '',
        dimAt: null, dimStep: 0.09, focusAt: null,
        x: W / 2, y: H / 2 + 24, w: 1580, h: 780, gap: 16, seed: 9,
        label: '', labelCorner: 'tr',
      }, o);
      if (!this.tiles.length) throw new Error('PhotoWall: tiles is empty.');
      const ids = new Set();
      this.list = this.tiles.map((tl, i) => {
        const unknown = Object.keys(tl).filter(k => !TILE_KEYS.includes(k));
        if (unknown.length) throw new Error(`PhotoWall: tile ${i + 1} has unknown key "${unknown[0]}" — use ${TILE_KEYS.join(', ')}.`);
        const id = tl.id ?? String(i);
        if (ids.has(id)) throw new Error(`PhotoWall: two tiles share the id "${id}".`);
        ids.add(id);
        if (tl.image && !UF.images[tl.image]) throw new Error(`PhotoWall: unknown image "${tl.image}" — run tools/embed_images.py and load images.js after uf-core.js.`);
        if (tl.status) D.statusInfo(tl.status);
        return { id, name: String(tl.name || ''), sub: String(tl.sub || ''), image: tl.image || null, status: tl.status || null, note: String(tl.note || ''), appear: this.at + 0.3 + i * 0.035 };
      });
      this.focusTile = null;
      if (this.focus != null) {
        this.focusTile = this.list.find(tl => tl.id === this.focus);
        if (!this.focusTile) throw new Error(`PhotoWall: focus "${this.focus}" is not a tile id.`);
        if (!this.focusTile.status) {
          throw new Error(`PhotoWall: the focus tile "${this.focusTile.name || this.focus}" needs a status (${Object.keys(D.STATUS).join(', ')}) — a person singled out on screen must carry their legal position.`);
        }
        const allIn = this.list[this.list.length - 1].appear + 0.4;
        const others = this.list.filter(tl => tl !== this.focusTile);
        const r = UF.rng(this.seed);
        const order = others.map(tl => ({ tl, k: r() })).sort((p, q) => p.k - q.k).map(p => p.tl);
        const dimAt = this.dimAt ?? allIn + 0.8;
        order.forEach((tl, i) => { tl.dimAt = dimAt + i * this.dimStep; });
        if (this.focusAt == null) this.focusAt = dimAt + Math.max(0, order.length - 1) * this.dimStep + 0.7;
      }
      this.layout();
    }

    layout() {
      const n = this.list.length, g = this.gap;
      let best = null;
      for (let cols = 1; cols <= n; cols++) {
        if (this.cols && cols !== this.cols) continue;
        const rows = Math.ceil(n / cols);
        const tw = Math.min((this.w - g * (cols - 1)) / cols, ((this.h - g * (rows - 1)) / rows) * ASPECT);
        if (!best || tw > best.tw) best = { cols, rows, tw };
      }
      if (!best) throw new Error(`PhotoWall: cols must be between 1 and ${n}.`);
      const { cols, rows } = best, tw = Math.floor(best.tw), th = Math.round(tw / ASPECT);
      const top = Math.round(this.y - (rows * th + (rows - 1) * g) / 2);
      this.list.forEach((tl, i) => {
        const r = Math.floor(i / cols), col = i % cols;
        const inRow = r === rows - 1 ? n - r * cols : cols;
        const rowW = inRow * tw + (inRow - 1) * g;
        tl.rect = [Math.round(this.x - rowW / 2 + col * (tw + g)), top + r * (th + g), tw, th];
      });
      this.tw = tw;
      this.th = th;
      this.gridTop = top;
      this.gridLeft = Math.min(...this.list.map(tl => tl.rect[0]));
    }

    /** Cached tile bitmap of size (bw, bh) at res; strip: false leaves out the name strip (used once the tile is in focus). */
    sprite(tl, res, strip = true, bw = this.tw, bh = this.th) {
      const w = Math.round(bw * res), h = Math.round(bh * res);
      const key = `_s${w}x${h}${strip ? 's' : ''}`;
      if (tl[key]) return tl[key];
      const img = tl.image ? UF.images[tl.image] : null;
      const ready = !img || (img.complete && img.naturalWidth > 0);
      const cv = UF.canvas(w, h), x = cv.getContext('2d');
      if (img && ready) {
        x.filter = 'grayscale(1) contrast(1.08) brightness(.94)';
        const k = Math.max(w / img.naturalWidth, h / img.naturalHeight);
        const dw = img.naturalWidth * k, dh = img.naturalHeight * k;
        x.drawImage(img, (w - dw) / 2, (h - dh) * 0.3, dw, dh);
        x.filter = 'none';
      } else {
        const g = x.createLinearGradient(0, 0, 0, h);
        g.addColorStop(0, '#1c2026');
        g.addColorStop(1, '#0f1216');
        x.fillStyle = g;
        x.fillRect(0, 0, w, h);
        x.fillStyle = '#2b3038';
        x.beginPath();
        x.arc(w / 2, h * 0.37, w * 0.17, 0, Math.PI * 2);
        x.fill();
        x.beginPath();
        x.ellipse(w / 2, h * 0.9, w * 0.37, h * 0.3, 0, Math.PI, 0);
        x.fill();
      }
      if (strip && (tl.name || tl.sub)) {
        const g = x.createLinearGradient(0, h * 0.55, 0, h);
        g.addColorStop(0, 'rgba(0,0,0,0)');
        g.addColorStop(1, 'rgba(0,0,0,.9)');
        x.fillStyle = g;
        x.fillRect(0, h * 0.55, w, h * 0.45);
        const nameSize = UF.clamp(Math.round(this.tw * 0.07), 15, 26), subSize = UF.clamp(Math.round(this.tw * 0.056), 13, 20);
        const pad = Math.round(UF.clamp(this.tw * 0.045, 10, 18) * res);
        x.font = UF.font.mono(Math.round(nameSize * res), 'bold');
        D.text(x, D.fit(x, tl.name.toUpperCase(), w - 2 * pad, 1.5 * res), pad, h - pad - (tl.sub ? (subSize + 9) * res : 0), { color: c('paper'), spacing: 1.5 * res });
        if (tl.sub) {
          x.font = UF.font.mono(Math.round(subSize * res));
          D.text(x, D.fit(x, tl.sub, w - 2 * pad), pad, h - pad, { color: c('dim') });
        }
      }
      x.strokeStyle = 'rgba(255,255,255,.14)';
      x.lineWidth = 1.5 * res;
      x.strokeRect(0.75 * res, 0.75 * res, w - 1.5 * res, h - 1.5 * res);
      if (ready) tl[key] = cv;
      return cv;
    }

    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      const m = ctx.getTransform(), sc = Math.hypot(m.a, m.b);
      const res = Math.min(2, Math.max(1, Math.ceil(sc)));
      const fp = this.focusTile ? ease.inOutCubic(seg(t, this.focusAt, 0.9)) : 0;
      ctx.save();
      ctx.globalAlpha = a;
      if (this.title) {
        ctx.save();
        ctx.globalAlpha *= ease.outCubic(seg(t, this.at, 0.5)) * (1 - fp);
        ctx.font = UF.font.mono(18, 'bold');
        D.text(ctx, this.title, this.gridLeft, this.gridTop - 24, { color: c('dim'), spacing: 4 });
        ctx.restore();
      }
      for (const tl of this.list) {
        if (tl === this.focusTile && fp > 0) continue;
        const ap = seg(t, tl.appear, 0.4);
        if (ap <= 0) continue;
        const k = ease.outCubic(ap);
        let alpha = k * (1 - 0.9 * fp);
        if (tl.dimAt != null) alpha *= 1 - 0.76 * ease.inOutCubic(seg(t, tl.dimAt, 0.3));
        const [x, y, w, h] = tl.rect;
        ctx.save();
        ctx.globalAlpha = a * alpha;
        if (k < 1) {
          const s = 0.92 + 0.08 * k;
          ctx.translate(x + w / 2, y + h / 2);
          ctx.scale(s, s);
          ctx.translate(-x - w / 2, -y - h / 2);
        }
        ctx.drawImage(this.sprite(tl, res), x, y, w, h);
        ctx.restore();
      }
      if (fp > 0) this.drawFocus(ctx, t, fx, fp, sc);
      if (this.label) {
        const right = this.labelCorner.includes('r'), bottom = this.labelCorner.includes('b');
        D.pill(ctx, this.label, right ? W - 96 : 96, bottom ? H - 88 : 88, { align: right ? 'right' : 'left', fill: c('red'), font: UF.font.mono(16, 'bold'), h: 32, spacing: 3 });
      }
      ctx.restore();
    }

    drawFocus(ctx, t, fx, fp, sc) {
      const tl = this.focusTile;
      const [gx, gy, gw, gh] = tl.rect;
      const th = Math.round(Math.min(this.h * 0.86, 700)), tw = Math.round(th * ASPECT);
      const tx = Math.round(W * 0.3 - tw / 2), ty = Math.round(Math.max(70, this.y - th / 2));
      const x = lerp(gx, tx, fp), y = lerp(gy, ty, fp), w = lerp(gw, tw, fp), h = lerp(gh, th, fp);
      const sh = D.shadowSprite(Math.round(tw), Math.round(th), 2, 30), ks = w / tw;
      ctx.save();
      ctx.globalAlpha *= 0.7 * fp;
      ctx.drawImage(sh, x - sh.pad * ks, y - sh.pad * ks + 20 * ks, sh.width * ks, sh.height * ks);
      ctx.restore();
      ctx.drawImage(this.sprite(tl, Math.min(2, Math.max(1, Math.ceil(sc))), false, tw, th), x, y, w, h);
      ctx.save();
      ctx.globalAlpha *= 1 - fp;
      ctx.drawImage(this.sprite(tl, Math.min(2, Math.max(1, Math.ceil(sc)))), x, y, w, h);
      ctx.restore();
      ctx.save();
      ctx.globalAlpha *= fp;
      ctx.strokeStyle = c('red');
      ctx.lineWidth = 3;
      ctx.strokeRect(x - 1.5, y - 1.5, w + 3, h + 3);
      ctx.restore();
      fx.kick(t, this.focusAt, { rgb: 0.3, decay: 10 });

      const cp = ease.outCubic(seg(t, this.focusAt + 0.55, 0.5));
      if (cp <= 0) return;
      const cx = tx + tw + 70 + (1 - cp) * 30, cw = W - 110 - cx, cy = ty + th / 2;
      ctx.save();
      ctx.globalAlpha *= cp;
      ctx.font = UF.font.display(84);
      D.text(ctx, D.fit(ctx, tl.name.toUpperCase(), cw, 2), cx, cy - 26, { color: c('paper'), spacing: 2 });
      if (tl.sub) {
        ctx.font = UF.font.mono(24);
        D.text(ctx, D.fit(ctx, tl.sub, cw, 1), cx, cy + 18, { color: c('dim'), spacing: 1 });
      }
      D.statusBadge(ctx, tl.status, cx, cy + 74, { size: 20, h: 40 });
      if (tl.note) {
        ctx.font = UF.font.mono(21);
        D.text(ctx, D.fit(ctx, tl.note, cw, 1.5), cx, cy + 136, { color: c('dim'), spacing: 1.5 });
      }
      ctx.restore();
    }

    editorial() {
      return { factual: true, person: this.list.some(tl => tl.image), status: this.focusTile ? this.focusTile.status : null, label: this.label };
    }
  }

  UF.PhotoWall = PhotoWall;
})(window.UF);

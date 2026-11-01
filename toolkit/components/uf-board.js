/*!
 * Unfiction GFX Toolkit — EvidenceBoard
 * Cards pinned to a board, joined by red string, with a camera that moves between them.
 *
 *   new UF.EvidenceBoard({
 *     cards: [
 *       { id: 'holder', kind: 'photo', x: 380, y: 330, title: 'ACCOUNT HOLDER', sub: 'Name withheld', at: 0.6 },
 *       { id: 'may',    kind: 'note',  x: 840, y: 280, title: '15 MAY 2015', text: 'Four accounts opened with $500 each', at: 1.4 },
 *       { id: 'order',  kind: 'doc',   x: 1340, y: 330, title: 'PAYMENT ORDER', at: 2.2, stamp: { text: 'HELD', at: 6 } },
 *       { id: 'sum',    kind: 'tag',   x: 640, y: 740, title: '$81M', sub: 'REACHED MANILA', at: 3 },
 *     ],
 *     strings: [ { from: 'holder', to: 'may', at: 3.8, label: 'OPENED' } ],
 *     camera:  [ { t: 0, center: [960, 540], zoom: 1 }, { t: 8, center: 'order', zoom: 1.8, dur: 1.6 } ],
 *     focus:   [ { at: 8.4, dur: 3, ids: ['order'] } ],
 *   })
 *
 * Board coordinates equal screen coordinates at zoom 1; card x / y are centres.
 * kind: 'photo' (instant photo), 'note' (index card), 'doc' (document page), 'tag' (dark label).
 * A photo shows `image` (see tools/embed_images.py), else `initials`, else `icon` (default 'user').
 */
(function (UF) {
  'use strict';

  const { c, clamp, seg, ease, lerp } = UF;
  const D = UF.draw;
  const W = UF.W, H = UF.H;
  const RAD = Math.PI / 180;
  const INK = '#1d1b18', INK_DIM = 'rgba(29,27,24,.7)';
  const SIZES = { photo: [230, 290], note: [300, 210], doc: [250, 320], tag: [0, 0] };
  const TONES = { photo: '#ece8de', note: '#e6dfc8', doc: '#e8e4da' };
  const SHADOW_PAD = 40;
  const NOTE_RULE = 64;
  const tiles = {};
  let lightCache = null;

  /** Use the largest of `sizes` at which text fits; truncate only below the smallest. */
  function fitFont(ctx, text, maxW, font, sizes, spacing = 0) {
    for (const s of sizes) {
      ctx.font = font(s);
      if (D.measure(ctx, text, spacing) <= maxW) return text;
    }
    return D.fit(ctx, text, maxW, spacing);
  }

  function imageReady(img) { return !!img && img.complete && img.naturalWidth > 0; }

  /** Draw an image cropped to fill the rect. `ay` picks the vertical crop (0 top, 0.5 centre). */
  function drawCover(ctx, img, x, y, w, h, ay, mono) {
    const s = Math.max(w / img.naturalWidth, h / img.naturalHeight);
    const sw = w / s, sh = h / s;
    ctx.save();
    if (mono) ctx.filter = 'grayscale(1) contrast(1.08) brightness(.95)';
    ctx.drawImage(img, (img.naturalWidth - sw) / 2, (img.naturalHeight - sh) * ay, sw, sh, x, y, w, h);
    ctx.restore();
  }

  class EvidenceBoard extends UF.Component {
    constructor(o) {
      super({
        surface: 'cork', cards: [], strings: [], camera: [{ t: 0, center: [W / 2, H / 2], zoom: 1 }],
        focus: [], stringColor: 'red', light: true, seed: 9,
      }, o);
      const r = UF.rng(this.seed);
      this.byId = {};
      this.cards.forEach((cd, i) => {
        const angle = (r() - 0.5) * 6, seed = Math.floor(r() * 997) + 1;
        cd.kind = cd.kind || 'note';
        if (!SIZES[cd.kind]) throw new Error(`EvidenceBoard: unknown card kind "${cd.kind}" — use photo, note, doc or tag.`);
        if (cd.image && !UF.images[cd.image]) {
          throw new Error(`EvidenceBoard: unknown image "${cd.image}" — run tools/embed_images.py and load the generated images.js after uf-core.js.`);
        }
        cd.id = cd.id ?? `card${i}`;
        if (this.byId[cd.id]) throw new Error(`EvidenceBoard: two cards share the id "${cd.id}".`);
        cd.at = cd.at ?? 0;
        cd.out = cd.out ?? Infinity;
        cd.angle = cd.angle ?? angle;
        cd.seed = cd.seed ?? seed;
        this.byId[cd.id] = cd;
      });
      const known = id => {
        if (!this.byId[id]) throw new Error(`EvidenceBoard: no card with id "${id}".`);
      };
      for (const s of this.strings) { known(s.from); known(s.to); }
      for (const f of this.camera) if (typeof f.center === 'string') known(f.center);
      for (const f of this.focus) (f.ids || []).forEach(known);
      this.maxZoom = Math.max(1, ...this.camera.map(f => f.zoom || 1));
      this.res = 2;
    }

    /** Called once by the stage, so the first frame of the scene does not stall. */
    setup() {
      this.tile();
      this.lightSprite();
    }

    /* ---------------- geometry ---------------- */
    size(ctx, cd) {
      if (cd._size) return cd._size;
      if (cd.kind === 'tag') {
        ctx.save();
        ctx.font = UF.font.display(cd.titleSize || 44);
        let tw = D.measure(ctx, cd.title || '', 1);
        ctx.font = UF.font.mono(15, 'bold');
        tw = Math.max(tw, D.measure(ctx, cd.sub || '', 3));
        ctx.restore();
        return (cd._size = [cd.w || Math.ceil(tw + 56), cd.h || (cd.sub ? 106 : 78)]);
      }
      const [w, h] = SIZES[cd.kind];
      return (cd._size = [cd.w || w, cd.h || h]);
    }

    pinPos(ctx, cd) {
      const h = this.size(ctx, cd)[1];
      const oy = -h / 2 + (cd.kind === 'tag' ? 12 : 15);
      const a = cd.angle * RAD;
      return [cd.x - oy * Math.sin(a), cd.y + oy * Math.cos(a)];
    }

    stringPoints(ctx, s) {
      if (s._pts) return s._pts;
      const [x0, y0] = this.pinPos(ctx, this.byId[s.from]);
      const [x1, y1] = this.pinPos(ctx, this.byId[s.to]);
      const sag = (s.sag ?? 0.12) * Math.hypot(x1 - x0, y1 - y0);
      return (s._pts = D.quadPoints(x0, y0, (x0 + x1) / 2, (y0 + y1) / 2 + sag, x1, y1, 48));
    }

    labelPos(ctx, s) {
      if (!this._labelsDone) this.layoutLabels(ctx);
      return s._label;
    }

    /**
     * Each label sits at the point nearest the middle of its string that is clear of every card
     * and of every label placed before it, so earlier strings get the better spots.
     */
    layoutLabels(ctx) {
      const placed = [];
      ctx.save();
      ctx.font = UF.font.mono(15, 'bold');
      for (const s of this.strings) {
        if (!s.label) continue;
        const pts = this.stringPoints(ctx, s);
        const hw = D.measure(ctx, s.label, 2) / 2 + 14, hh = 14;
        const clear = ([px, py]) =>
          this.cards.every(cd => {
            const [w, h] = this.size(ctx, cd);
            return Math.abs(px - cd.x) > w / 2 + hw || Math.abs(py - cd.y) > h / 2 + hh + 2;
          }) &&
          placed.every(([qx, qy, qw]) => Math.abs(px - qx) > hw + qw + 8 || Math.abs(py - qy) > hh * 2 + 6);
        const ks = s.labelAt != null ? [s.labelAt] : [0.5, 0.42, 0.58, 0.34, 0.66, 0.26, 0.74, 0.18, 0.82];
        const k = ks.find(v => clear(D.pointAt(pts, v))) ?? ks[0];
        s._label = D.pointAt(pts, k);
        placed.push([s._label[0], s._label[1], hw]);
      }
      ctx.restore();
      this._labelsDone = true;
    }

    camAt(t) {
      const toState = f => {
        const p = typeof f.center === 'string' ? [this.byId[f.center].x, this.byId[f.center].y] : f.center || [W / 2, H / 2];
        return { c: p, z: f.zoom || 1 };
      };
      let cur = toState(this.camera[0]);
      for (let i = 1; i < this.camera.length; i++) {
        const f = this.camera[i];
        if (t < f.t) break;
        const p = UF.easeFn(f.ease || 'inOutCubic')(seg(t, f.t, f.dur ?? 1.6));
        const nxt = toState(f);
        cur = {
          c: [lerp(cur.c[0], nxt.c[0], p), lerp(cur.c[1], nxt.c[1], p)],
          z: Math.exp(lerp(Math.log(cur.z), Math.log(nxt.z), p)),
        };
      }
      return cur;
    }

    focusAt(t) {
      let k = 0, ids = [];
      for (const f of this.focus) {
        const w = UF.win(t, f.at, f.at + (f.dur ?? 3), 0.4, 0.4);
        if (w > k) { k = w; ids = f.ids || []; }
      }
      return { k, ids: new Set(ids) };
    }

    cardVis(t, cd) { return UF.win(t, cd.at, cd.out, 0.35, 0.4); }

    /* ---------------- cached bitmaps ---------------- */
    tile() {
      const key = `${this.surface}:${this.seed}`;
      if (tiles[key]) return tiles[key];
      const S = 1024, cv = UF.canvas(S, S), x = cv.getContext('2d');
      const r = UF.rng(this.seed * 31 + 7);
      const cork = this.surface !== 'felt';
      const wrap = (px, py, rad, fn) => {
        for (const ox of [-S, 0, S]) for (const oy of [-S, 0, S]) {
          const X = px + ox, Y = py + oy;
          if (X + rad >= 0 && X - rad <= S && Y + rad >= 0 && Y - rad <= S) fn(X, Y);
        }
      };
      x.fillStyle = cork ? '#3a2a1c' : '#161a20';
      x.fillRect(0, 0, S, S);
      for (let i = 0; i < 70; i++) {
        const rad = 80 + r() * 220, dark = r() < 0.5, al = 0.05 + r() * 0.07;
        const tint = cork ? (dark ? '20,12,6' : '96,68,42') : (dark ? '0,0,0' : '58,110,165');
        wrap(r() * S, r() * S, rad, (X, Y) => {
          const g = x.createRadialGradient(X, Y, 0, X, Y, rad);
          g.addColorStop(0, `rgba(${tint},${cork ? al : al * 0.5})`);
          g.addColorStop(1, `rgba(${tint},0)`);
          x.fillStyle = g;
          x.fillRect(X - rad, Y - rad, rad * 2, rad * 2);
        });
      }
      if (cork) {
        for (let i = 0; i < 11000; i++) {
          const v = r(), rad = 0.8 + r() * 2.6, al = 0.22 + r() * 0.35;
          const col = v < 0.5 ? `rgba(16,10,5,${al})` : v < 0.88 ? `rgba(104,76,48,${al})` : `rgba(150,116,80,${al * 0.8})`;
          wrap(r() * S, r() * S, rad, (X, Y) => { x.fillStyle = col; x.beginPath(); x.arc(X, Y, rad, 0, Math.PI * 2); x.fill(); });
        }
      } else {
        x.lineWidth = 1.2;
        for (let i = 0; i < 16000; i++) {
          const px = r() * S, py = r() * S, a = r() * Math.PI, l = 3 + r() * 9;
          x.strokeStyle = r() < 0.45 ? `rgba(255,255,255,${0.02 + r() * 0.035})` : `rgba(0,0,0,${0.1 + r() * 0.1})`;
          x.beginPath(); x.moveTo(px, py); x.lineTo(px + Math.cos(a) * l, py + Math.sin(a) * l); x.stroke();
        }
      }
      return (tiles[key] = cv);
    }

    /** Spotlight falloff at quarter resolution; it is a smooth gradient, so scaling up is invisible. */
    lightSprite() {
      if (lightCache) return lightCache;
      const cv = UF.canvas(W / 4, H / 4), x = cv.getContext('2d');
      const g = x.createRadialGradient(W / 8, H / 8 - 10, W * 0.045, W / 8, H / 8, W * 0.18);
      g.addColorStop(0, 'rgba(0,0,0,0)');
      g.addColorStop(1, 'rgba(0,0,0,.5)');
      x.fillStyle = g;
      x.fillRect(0, 0, cv.width, cv.height);
      return (lightCache = cv);
    }

    /** Paper and fixed content, rendered once at `res` pixels per board unit. */
    face(cd, w, h) {
      const res = this.res;
      if (cd._face && cd._faceRes === res) return cd._face;
      const cv = UF.canvas(w * res, h * res), x = cv.getContext('2d');
      x.scale(res, res);
      x.translate(w / 2, h / 2);
      if (cd.kind === 'tag') {
        x.fillStyle = c('panel');
        D.roundRect(x, -w / 2, -h / 2, w, h, 3);
        x.fill();
      } else {
        x.drawImage(D.paperTexture(w, h, cd.seed, cd.tone || TONES[cd.kind]), -w / 2, -h / 2);
      }
      if (cd.kind === 'photo') this.photoFace(x, cd, w, h);
      else if (cd.kind === 'note') this.noteFace(x, cd, w, h);
      else if (cd.kind === 'doc') this.docFace(x, cd, w, h);
      else this.tagFace(x, cd, w, h);
      if (cd.image && !imageReady(UF.images[cd.image])) return cv;
      cd._face = cv;
      cd._faceRes = res;
      return cv;
    }

    shadowOf(cd, w, h) {
      if (cd._shadow) return cd._shadow;
      const m = SHADOW_PAD, cv = UF.canvas(w + m * 2, h + m * 2), x = cv.getContext('2d');
      x.filter = 'blur(9px)';
      x.fillStyle = '#000';
      D.roundRect(x, m, m, w, h, 3);
      x.fill();
      return (cd._shadow = cv);
    }

    drawSurface(ctx, cam) {
      if (!this._pat || this._patCtx !== ctx) {
        this._pat = ctx.createPattern(this.tile(), 'repeat');
        this._pat.setTransform(new DOMMatrix([0.5, 0, 0, 0.5, 0, 0]));
        this._patCtx = ctx;
      }
      const hw = W / 2 / cam.z + 60, hh = H / 2 / cam.z + 60;
      ctx.fillStyle = this._pat;
      ctx.fillRect(cam.c[0] - hw, cam.c[1] - hh, hw * 2, hh * 2);
    }

    /* ---------------- draw ---------------- */
    draw(ctx, t, fx, scene) {
      const a = this.vis(t);
      if (a <= 0) return;
      const m = ctx.getTransform();
      this.res = Math.min(3, Math.max(2, Math.ceil(Math.hypot(m.a, m.b) * this.maxZoom * 2) / 2));
      const key = !!(scene && scene.key);
      const cam = this.camAt(t);
      const foc = this.focusAt(t);
      const view = [cam.c[0] - W / 2 / cam.z, cam.c[1] - H / 2 / cam.z, W / cam.z, H / cam.z];
      ctx.save();
      ctx.globalAlpha = a;
      ctx.translate(W / 2, H / 2);
      ctx.scale(cam.z, cam.z);
      ctx.translate(-cam.c[0], -cam.c[1]);
      if (!key) this.drawSurface(ctx, cam);
      this.drawSet(ctx, t, fx, () => true, true);
      if (!key && this.light) ctx.drawImage(this.lightSprite(), view[0] - 2, view[1] - 2, view[2] + 4, view[3] + 4);
      if (!key && foc.k > 0 && foc.ids.size) {
        ctx.fillStyle = `rgba(0,0,0,${0.62 * foc.k})`;
        ctx.fillRect(view[0] - 60, view[1] - 60, view[2] + 120, view[3] + 120);
        this.drawSet(ctx, t, fx, cd => foc.ids.has(cd.id), false);
      }
      ctx.restore();
    }

    drawSet(ctx, t, fx, pick, withFx) {
      const cards = this.cards.filter(pick);
      const strings = this.strings.filter(s => pick(this.byId[s.from]) || pick(this.byId[s.to]));
      for (const cd of cards) this.drawCard(ctx, t, cd, fx, withFx);
      for (const s of strings) this.drawString(ctx, t, s);
      for (const cd of cards) this.drawPin(ctx, t, cd, fx, withFx);
      for (const s of strings) this.drawStringLabel(ctx, t, s);
      for (const cd of cards) this.drawMark(ctx, t, cd);
    }

    drawCard(ctx, t, cd, fx, withFx) {
      const ca = this.cardVis(t, cd);
      if (ca <= 0) return;
      const drop = ease.outCubic(seg(t - cd.at, 0, 0.45));
      const lift = 1 - drop;
      const s = lerp(1.14, 1, drop);
      const angle = (cd.angle + lift * 4) * RAD;
      const [w, h] = this.size(ctx, cd);

      ctx.save();
      ctx.globalAlpha *= ca * lerp(0.72, 0.42, lift);
      ctx.translate(cd.x + lerp(4, 16, lift), cd.y + lerp(9, 36, lift));
      ctx.rotate(angle);
      ctx.scale(s * (1 + lift * 0.08), s * (1 + lift * 0.08));
      ctx.drawImage(this.shadowOf(cd, w, h), -w / 2 - SHADOW_PAD, -h / 2 - SHADOW_PAD);
      ctx.restore();

      ctx.save();
      ctx.globalAlpha *= ca;
      ctx.translate(cd.x, cd.y);
      ctx.rotate(angle);
      ctx.scale(s, s);
      // 'medium'/'high' quality rebuilds mipmaps of a canvas source on every draw (~5 ms per card).
      ctx.imageSmoothingQuality = 'low';
      ctx.drawImage(this.face(cd, w, h), -w / 2, -h / 2, w, h);
      if (cd.kind === 'note') this.noteText(ctx, t, cd, w, h);
      if (cd.stamp && t >= cd.stamp.at) this.drawStamp(ctx, t, cd, w, fx, withFx);
      ctx.restore();
    }

    photoFace(x, cd, w, h) {
      const pad = 16, iw = w - pad * 2, ih = Math.min(iw, h - pad - 76);
      const ix = -w / 2 + pad, iy = -h / 2 + pad;
      x.fillStyle = '#1a1d22';
      x.fillRect(ix, iy, iw, ih);
      const img = cd.image ? UF.images[cd.image] : null;
      if (imageReady(img)) drawCover(x, img, ix, iy, iw, ih, cd.imageY ?? 0.3, cd.mono !== false);
      else if (cd.initials) {
        x.font = UF.font.display(Math.round(iw * 0.4));
        D.text(x, cd.initials, 0, iy + ih / 2 + iw * 0.15, { color: c('paper', 0.5), spacing: 4, align: 'center' });
      } else {
        D.icon(x, cd.icon || 'user', 0, iy + ih / 2 + 6, iw * 0.58, { color: c('paper', 0.4), width: 4 });
      }
      const sheen = x.createLinearGradient(ix, iy, ix + iw, iy + ih);
      sheen.addColorStop(0, 'rgba(255,255,255,.10)');
      sheen.addColorStop(0.45, 'rgba(255,255,255,0)');
      x.fillStyle = sheen;
      x.fillRect(ix, iy, iw, ih);
      const cy = iy + ih;
      const title = fitFont(x, cd.title || '', w - 28, px => UF.font.type(px, 'bold'), [24, 22, 20, 18], 1);
      D.text(x, title, 0, cy + 36, { color: INK, spacing: 1, align: 'center' });
      if (cd.sub) {
        const sub = fitFont(x, cd.sub, w - 28, px => UF.font.type(px, 'bold'), [16, 15, 14]);
        D.text(x, sub, 0, cy + 62, { color: INK_DIM, align: 'center' });
      }
    }

    noteFace(x, cd, w, h) {
      const left = -w / 2, top = -h / 2, rule0 = top + NOTE_RULE, step = 30;
      x.fillStyle = 'rgba(58,110,165,.22)';
      for (let ly = rule0 + step; ly < top + h - 8; ly += step) x.fillRect(left + 12, ly, w - 24, 1.5);
      x.fillStyle = c('red', 0.5);
      x.fillRect(left + 12, rule0, w - 24, 2);
      const title = fitFont(x, cd.title || '', w - 48, px => UF.font.type(px, 'bold'), [24, 22, 20, 18], 1);
      D.text(x, title, left + 24, rule0 - 14, { color: INK, spacing: 1 });
    }

    /** Note body, typed in line by line after the card lands. */
    noteText(ctx, t, cd, w, h) {
      if (!cd.text) return;
      const left = -w / 2, top = -h / 2, rule0 = top + NOTE_RULE, step = 30;
      ctx.font = UF.font.type(20, 'bold');
      const lines = D.wrap(ctx, cd.text, w - 48);
      const max = Math.floor((top + h - 8 - rule0) / step);
      lines.slice(0, max).forEach((ln, i) => {
        const shown = D.typed(ln, seg(t, cd.at + 0.45 + i * 0.3, 0.4));
        if (shown) D.text(ctx, shown, left + 24, rule0 + step * (i + 1) - 7, { color: INK });
      });
    }

    docFace(x, cd, w, h) {
      const left = -w / 2, top = -h / 2;
      const title = fitFont(x, (cd.title || '').toUpperCase(), w - 44, px => UF.font.type(px, 'bold'), [17, 16, 15, 14], 2);
      D.text(x, title, left + 22, top + 50, { color: INK, spacing: 2 });
      x.fillStyle = 'rgba(29,27,24,.35)';
      x.fillRect(left + 22, top + 62, w - 44, 2);
      const bottom = top + h - (cd.sub ? 52 : 26);
      if (cd.text) {
        x.font = UF.font.type(16);
        D.wrap(x, cd.text, w - 44).forEach((ln, i) => {
          const ly = top + 92 + i * 22;
          if (ly <= bottom) D.text(x, ln, left + 22, ly, { color: INK });
        });
      } else {
        const r = UF.rng(cd.seed * 13);
        x.fillStyle = 'rgba(29,27,24,.2)';
        for (let ly = top + 84; ly + 6 <= bottom; ly += 20) {
          if (r() < 0.12) continue;
          x.fillRect(left + 22, ly, (w - 44) * (0.45 + r() * 0.55), 6);
        }
      }
      if (cd.sub) {
        const sub = fitFont(x, cd.sub, w - 44, px => UF.font.type(px, 'bold'), [15, 14, 13], 1);
        D.text(x, sub, left + w - 22, top + h - 22, { color: INK_DIM, spacing: 1, align: 'right' });
      }
    }

    tagFace(x, cd, w, h) {
      const top = -h / 2;
      x.strokeStyle = c(cd.color || 'red');
      x.lineWidth = 2;
      D.roundRect(x, -w / 2 + 1, top + 1, w - 2, h - 2, 3);
      x.stroke();
      x.font = UF.font.display(cd.titleSize || 44);
      D.text(x, cd.title || '', 0, cd.sub ? top + 62 : top + h / 2 + 16, { color: c('paper'), spacing: 1, align: 'center' });
      if (cd.sub) {
        x.font = UF.font.mono(15, 'bold');
        D.text(x, cd.sub, 0, top + 88, { color: c('dim'), spacing: 3, align: 'center' });
      }
    }

    drawStamp(ctx, t, cd, w, fx, withFx) {
      const st = cd.stamp;
      const sp = seg(t, st.at, 0.18);
      const sc = lerp(1.7, 1, ease.outCubic(sp));
      const col = c(st.color || 'red', 0.86);
      ctx.save();
      ctx.globalAlpha *= sp;
      if (cd.kind !== 'tag') ctx.globalCompositeOperation = 'multiply';
      ctx.rotate((st.angle ?? -14) * RAD);
      ctx.scale(sc, sc);
      let size = Math.min(52, Math.round(w * 0.2));
      ctx.font = UF.font.display(size);
      let tw = D.measure(ctx, st.text, 3);
      if (tw + 32 > w * 0.92) {
        size = Math.max(14, Math.floor(size * (w * 0.92 - 32) / tw));
        ctx.font = UF.font.display(size);
        tw = D.measure(ctx, st.text, 3);
      }
      ctx.strokeStyle = col;
      ctx.lineWidth = 4;
      D.roundRect(ctx, -tw / 2 - 16, -size * 0.62 - 8, tw + 32, size * 1.24 + 16, 4);
      ctx.stroke();
      D.text(ctx, st.text, 0, size * 0.36, { color: col, spacing: 3, align: 'center' });
      ctx.restore();
      if (withFx && st.kick !== false) fx.kick(t, st.at + 0.1, { shake: 0.008, rgb: 0.5, flash: 0.1, decay: 11 });
    }

    drawPin(ctx, t, cd, fx, withFx) {
      const ca = this.cardVis(t, cd);
      const pp = seg(t, cd.at + 0.4, 0.2);
      if (ca <= 0 || pp <= 0) return;
      const [px, py] = this.pinPos(ctx, cd);
      const s = lerp(1.8, 1, ease.outCubic(pp));
      const col = cd.pin || 'red';
      ctx.save();
      ctx.globalAlpha *= ca * pp;
      ctx.translate(px, py);
      ctx.scale(s, s);
      ctx.fillStyle = 'rgba(0,0,0,.45)';
      ctx.beginPath(); ctx.ellipse(5, 7, 10, 8, 0, 0, Math.PI * 2); ctx.fill();
      const g = ctx.createRadialGradient(-3, -3, 1, 0, 0, 10);
      g.addColorStop(0, UF.mix(col, '#ffffff', 0.55));
      g.addColorStop(0.45, c(col));
      g.addColorStop(1, UF.mix(col, '#000000', 0.5));
      ctx.fillStyle = g;
      ctx.beginPath(); ctx.arc(0, 0, 10, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      if (withFx && cd.kick !== false) fx.kick(t, cd.at + 0.45, { rgb: 0.15, decay: 12 });
    }

    stringVis(t, s) {
      const A = this.byId[s.from], B = this.byId[s.to];
      return Math.min(this.cardVis(t, A), this.cardVis(t, B), UF.win(t, s.at, s.out ?? Infinity, 0, 0.4));
    }

    drawString(ctx, t, s) {
      const sa = this.stringVis(t, s);
      const p = ease.inOutCubic(seg(t, s.at, s.dur ?? 0.9));
      if (sa <= 0 || p <= 0) return;
      const pts = this.stringPoints(ctx, s);
      const pass = (dx, dy, style, width) => {
        ctx.save();
        ctx.translate(dx, dy);
        ctx.strokeStyle = style;
        ctx.lineWidth = width;
        D.partialPath(ctx, pts, p);
        ctx.stroke();
        ctx.restore();
      };
      ctx.save();
      ctx.globalAlpha *= sa;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      pass(3, 6, 'rgba(0,0,0,.42)', 3.5);
      pass(0, 0, c(s.color || this.stringColor), 3);
      pass(-0.6, -0.8, 'rgba(255,255,255,.16)', 1);
      ctx.restore();
    }

    drawStringLabel(ctx, t, s) {
      if (!s.label) return;
      const sa = this.stringVis(t, s);
      const lp = seg(t, s.at + (s.dur ?? 0.9) * 0.6, 0.35);
      if (sa <= 0 || lp <= 0) return;
      const [lx, ly] = this.labelPos(ctx, s);
      const k = ease.outBack(lp);
      ctx.save();
      ctx.globalAlpha *= sa * clamp(lp * 2);
      ctx.translate(lx, ly);
      ctx.rotate(-2 * RAD);
      ctx.scale(k, k);
      D.pill(ctx, s.label, 0, 0, { align: 'center', fill: '#e8e4da', color: INK, font: UF.font.mono(15, 'bold'), h: 28, radius: 2 });
      ctx.restore();
    }

    drawMark(ctx, t, cd) {
      if (!cd.mark) return;
      const ca = this.cardVis(t, cd);
      const p = ease.inOutCubic(seg(t, cd.mark.at, 0.7));
      if (ca <= 0 || p <= 0) return;
      const [w, h] = this.size(ctx, cd);
      ctx.save();
      ctx.globalAlpha *= ca;
      D.circleMark(ctx, cd.x, cd.y, w * 0.68, h * 0.64, p, { color: c(cd.mark.color || 'red'), width: 6, seed: cd.seed });
      ctx.restore();
    }

    editorial() {
      const isPerson = cd => cd.kind === 'photo' && !!(cd.image || cd.initials || (cd.icon || 'user') === 'user');
      const stamped = this.cards.filter(cd => cd.stamp && cd.stamp.text);
      return {
        factual: true,
        person: this.cards.some(isPerson),
        personStamps: stamped.filter(isPerson).map(cd => cd.stamp.text),
        cardStamps: stamped.filter(cd => !isPerson(cd)).map(cd => cd.stamp.text),
      };
    }
  }

  UF.EvidenceBoard = EvidenceBoard;
})(window.UF);

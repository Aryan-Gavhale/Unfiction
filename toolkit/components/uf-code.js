/*!
 * Unfiction GFX Toolkit — HexPatch
 * "Software block → zoom into memory → bytes get patched" explainer.
 *
 *   new UF.HexPatch({
 *     title: 'SWIFT software', check: 'SECURITY CHECK',
 *     from: ['75', '04'], to: ['90', '90'],
 *     fromLabel: 'Conditional jump', toLabel: 'Do nothing',
 *     fromAsm: 'JNZ +4', toAsm: 'NOP  NOP',
 *     at: 0.3, zoomAt: 3, highlightAt: 5.6, pushAt: 6.4, morphAt: 10.5, captionAt: 11.6,
 *   })
 * Surrounding bytes are illustrative; the panel carries an ILLUSTRATION tag.
 */
(function (UF) {
  'use strict';

  const { c, seg, ease, lerp, clamp } = UF;
  const D = UF.draw;
  const W = UF.W, H = UF.H;
  const HEX = '0123456789ABCDEF';

  class HexPatch extends UF.Component {
    constructor(o) {
      super({
        title: 'SWIFT software', check: 'SECURITY CHECK', tag: 'ILLUSTRATION',
        from: ['75', '04'], to: ['90', '90'],
        before: ['8B', '45', 'F8', '85', 'C0'], after: ['33', 'C0', 'EB', '05'],
        fromLabel: 'Conditional jump', toLabel: 'Do nothing',
        fromAsm: '', toAsm: '',
        rows: 10, target: { row: 5, col: 7 }, base: 0x00412A40,
        zoomAt: 3, highlightAt: 5.6, pushAt: 6.4, pushDur: 1.8, push: 1.3,
        morphAt: 10.5, captionAt: 11.6, seed: 77,
      }, o);
      this.build();
    }

    build() {
      const r = UF.rng(this.seed);
      const rnd = () => HEX[Math.floor(r() * 16)] + HEX[Math.floor(r() * 16)];
      this.grid = [];
      for (let i = 0; i < this.rows; i++) {
        const row = [];
        for (let j = 0; j < 16; j++) row.push(rnd());
        this.grid.push(row);
      }
      const flat = this.target.row * 16 + this.target.col;
      const put = (k, v) => { if (k >= 0 && k < this.rows * 16) this.grid[Math.floor(k / 16)][k % 16] = v; };
      this.before.forEach((v, i) => put(flat - this.before.length + i, v));
      this.from.forEach((v, i) => put(flat + i, v));
      this.after.forEach((v, i) => put(flat + this.from.length + i, v));
      this.ascii = this.grid.map(row => row.map(b => {
        const n = parseInt(b, 16);
        return n >= 0x41 && n <= 0x5A ? String.fromCharCode(n) : '.';
      }).join(''));
    }

    /* Dump panel geometry (unscaled, centred on screen). */
    geo() {
      const pw = 1480, ph = 150 + this.rows * 52;
      const px = W / 2 - pw / 2, py = H / 2 - ph / 2 - 50;
      const bx = px + 290, pitch = 52, ax = bx + 16 * pitch + 40;
      const rowY = i => py + 120 + i * 52;
      const tx = bx + this.target.col * pitch, ty = rowY(this.target.row);
      return { pw, ph, px, py, bx, pitch, ax, rowY, tx, ty, tw: pitch * this.from.length - 12 };
    }

    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      ctx.save();
      ctx.globalAlpha = a;
      const zt = seg(t, this.zoomAt, 1.3);
      const blockA = 1 - seg(t, this.zoomAt + 0.85, 0.35);
      const dumpA = seg(t, this.zoomAt + 0.95, 0.45);
      if (blockA > 0) this.drawBlock(ctx, t, ease.inExpo(zt), blockA);
      if (zt > 0 && zt < 1) fx.rgb(Math.sin(zt * Math.PI) * 0.9);
      fx.kick(t, this.zoomAt + 1.0, { flash: 0.35, decay: 9 });
      if (dumpA > 0) this.drawDump(ctx, t, dumpA, fx);
      ctx.restore();
    }

    drawBlock(ctx, t, z, alpha) {
      const lt = t - this.at;
      const bw = 720, bh = 400;
      const cx = W / 2, cy = H / 2 - 20;
      const lockX = cx, lockY = cy + 30;
      const s = lerp(1, 14, z);
      const enter = ease.outExpo(seg(lt, 0, 0.9));
      ctx.save();
      ctx.globalAlpha *= alpha * enter;
      ctx.translate(lockX, lockY);
      ctx.scale(s * lerp(0.94, 1, enter), s * lerp(0.94, 1, enter));
      ctx.translate(-lockX, -lockY);
      const x = cx - bw / 2, y = cy - bh / 2;
      D.panel(ctx, x, y, bw, bh, { tick: 22 });
      ctx.fillStyle = c('graphite');
      ctx.fillRect(x + 1, y + 1, bw - 2, 56);
      for (let i = 0; i < 3; i++) { ctx.fillStyle = c('line'); ctx.beginPath(); ctx.arc(x + 30 + i * 22, y + 29, 6, 0, Math.PI * 2); ctx.fill(); }
      ctx.font = UF.font.mono(22, 'bold');
      D.text(ctx, this.title.toUpperCase(), cx, y + 37, { color: c('paper'), spacing: 6, align: 'center' });

      const ok = seg(lt, 1.0, 0.4);
      ctx.fillStyle = c('panel');
      D.roundRect(ctx, lockX - 170, lockY - 92, 340, 184, 6);
      ctx.fill();
      ctx.strokeStyle = UF.mix('line', 'green', ok);
      ctx.lineWidth = 2;
      ctx.stroke();
      D.icon(ctx, 'lock', lockX, lockY - 22, 86, { color: c('paper'), width: 6 });
      ctx.font = UF.font.mono(18, 'bold');
      D.text(ctx, this.check, lockX, lockY + 56, { color: c('dim'), spacing: 4, align: 'center' });
      if (ok > 0) {
        ctx.globalAlpha *= ok;
        ctx.fillStyle = c('green');
        ctx.beginPath(); ctx.arc(lockX + 132, lockY - 64, 20, 0, Math.PI * 2); ctx.fill();
        D.icon(ctx, 'check', lockX + 132, lockY - 64, 24, { color: c('black'), width: 14 });
      }
      ctx.restore();
    }

    byteColor(t, isTarget) {
      if (!isTarget) return c('paper', 0.82);
      const hl = seg(t, this.highlightAt, 0.4);
      const m = seg(t, this.morphAt + 0.35, 0.3);
      return m > 0 ? UF.mix('red', 'green', m) : UF.mix('paper', 'red', hl);
    }

    drawDump(ctx, t, alpha, fx) {
      const g = this.geo();
      const lt = t - (this.zoomAt + 0.95);
      const settle = ease.outExpo(seg(lt, 0, 1.1));
      const pz = lerp(1, this.push, ease.inOutCubic(seg(t, this.pushAt, this.pushDur)));
      const focusX = g.tx + g.tw / 2, focusY = g.ty - 10;
      const pk = ease.inOutCubic(seg(t, this.pushAt, this.pushDur));
      const scale = lerp(1.35, 1, settle) * pz;
      const fxX = lerp(W / 2, focusX, pk), fxY = lerp(H / 2 - 50, focusY, pk);
      const morph = seg(t, this.morphAt, 0.7);
      const underCaption = 1 - 0.45 * seg(t, this.captionAt, 0.5);

      ctx.save();
      ctx.globalAlpha *= alpha * underCaption;
      alpha *= underCaption;
      ctx.translate(W / 2, H / 2 - 50 - pk * 10);
      ctx.scale(scale, scale);
      ctx.translate(-fxX, -fxY);

      D.panel(ctx, g.px, g.py, g.pw, g.ph, { tick: 20 });
      ctx.font = UF.font.mono(17, 'bold');
      ctx.save();
      ctx.globalAlpha *= 1 - pk;
      D.text(ctx, 'MEMORY', g.px + 34, g.py + 48, { color: c('blue'), spacing: 6 });
      D.text(ctx, `${this.title.toUpperCase()} · ${this.check}`, g.px + g.pw - 34, g.py + 48, { color: c('dim'), spacing: 3, align: 'right' });
      ctx.restore();
      if (this.tag) D.pill(ctx, this.tag, g.px + g.pw / 2, g.py + g.ph - 30, { align: 'center', fill: c('graphite'), color: c('dim'), font: UF.font.mono(13, 'bold'), h: 24, stroke: c('line') });
      ctx.fillStyle = c('line');
      ctx.fillRect(g.px + 30, g.py + 72, g.pw - 60, 1);

      ctx.font = UF.font.mono(26);
      for (let i = 0; i < this.rows; i++) {
        const ra = seg(lt, 0.15 + i * 0.06, 0.25);
        if (ra <= 0) continue;
        const y = g.rowY(i);
        ctx.globalAlpha = alpha * ra * (i === this.target.row ? 1 : 0.9);
        ctx.font = UF.font.mono(22);
        D.text(ctx, `0x${(this.base + i * 16).toString(16).toUpperCase().padStart(8, '0')}`, g.px + 40, y, { color: c('blue', 0.85), spacing: 1 });
        ctx.font = UF.font.mono(26);
        for (let j = 0; j < 16; j++) {
          const k = j - this.target.col;
          const isT = i === this.target.row && k >= 0 && k < this.from.length;
          let b = this.grid[i][j];
          if (isT && morph > 0) b = morph < 1 ? D.scramble(this.to[k], (morph - 0.5) * 2, Math.floor(t * 30) + k, HEX) : this.to[k];
          ctx.fillStyle = this.byteColor(t, isT);
          if (isT) ctx.font = UF.font.mono(26, 'bold');
          ctx.fillText(b, g.bx + j * g.pitch, y);
          if (isT) ctx.font = UF.font.mono(26);
        }
        ctx.font = UF.font.mono(22);
        D.text(ctx, this.ascii[i], g.ax, y, { color: c('dim', 0.7), spacing: 2 });
      }
      ctx.globalAlpha = alpha;

      const hl = ease.outBack(seg(t, this.highlightAt, 0.45));
      if (hl > 0) {
        const m = seg(t, this.morphAt + 0.35, 0.3);
        const col = m > 0 ? UF.mix('red', 'green', m) : c('red');
        const pulse = 0.5 + 0.5 * Math.sin((t - this.highlightAt) * 5);
        const bx0 = g.tx - 12, by0 = g.ty - 32, bw = g.tw + 24, bh = 44;
        ctx.save();
        ctx.translate(bx0 + bw / 2, by0 + bh / 2);
        ctx.scale(lerp(1.6, 1, clamp(hl)), lerp(1.6, 1, clamp(hl)));
        ctx.strokeStyle = col;
        ctx.lineWidth = 3;
        ctx.strokeRect(-bw / 2, -bh / 2, bw, bh);
        ctx.globalAlpha *= 0.12 + 0.1 * pulse;
        ctx.fillStyle = col;
        ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
        ctx.restore();
      }
      ctx.restore();

      if (morph > 0) {
        fx.kick(t, this.morphAt + 0.35, { flash: 0.4, rgb: 1.2, shake: 0.008, glitch: 0.8, glitchDur: 0.08, decay: 9 });
      }
      this.drawCaptions(ctx, t, alpha / underCaption);
    }

    drawCaptions(ctx, t, alpha) {
      const ca = seg(t, this.captionAt, 0.5);
      if (ca <= 0) return;
      const asm = !!(this.fromAsm && this.toAsm);
      const y = H - (asm ? 196 : 150);
      const cx = W / 2;
      ctx.save();
      ctx.globalAlpha *= alpha * ca;
      ctx.fillStyle = c('black', 0.97);
      D.roundRect(ctx, cx - 640, y - 66, 1280, asm ? 186 : 134, 6);
      ctx.fill();
      ctx.strokeStyle = c('line');
      ctx.lineWidth = 1.5;
      ctx.stroke();

      const left = cx - 330, right = cx + 330;
      ctx.font = UF.font.mono(40, 'bold');
      D.text(ctx, this.from.join(' '), left, y - 2, { color: c('red'), spacing: 4, align: 'center' });
      ctx.font = UF.font.mono(22);
      D.text(ctx, `"${this.fromLabel}"`, left, y + 40, { color: c('paper', 0.75), spacing: 1, align: 'center' });
      const sp = ease.outExpo(seg(t, this.captionAt + 0.5, 0.4));
      ctx.font = UF.font.mono(22);
      const lw = D.measure(ctx, `"${this.fromLabel}"`, 1);
      ctx.fillStyle = c('red');
      ctx.fillRect(left - lw / 2 - 6, y + 32, (lw + 12) * sp, 3);

      const ar = ease.outExpo(seg(t, this.captionAt + 0.5, 0.5));
      ctx.strokeStyle = c('paper', 0.8);
      ctx.lineWidth = 3;
      ctx.beginPath(); ctx.moveTo(cx - 70, y + 4); ctx.lineTo(cx - 70 + 140 * ar, y + 4); ctx.stroke();
      if (ar > 0.9) D.arrowHead(ctx, cx + 72, y + 4, 0, 20, c('paper', 0.8));

      const ra = seg(t, this.captionAt + 0.8, 0.4);
      ctx.globalAlpha = alpha * ca * ra;
      ctx.font = UF.font.mono(40, 'bold');
      D.text(ctx, this.to.join(' '), right, y - 2, { color: c('green'), spacing: 4, align: 'center' });
      ctx.font = UF.font.mono(22);
      D.text(ctx, `"${this.toLabel}"`, right, y + 40, { color: c('paper'), spacing: 1, align: 'center' });

      if (asm) {
        ctx.globalAlpha = alpha * seg(t, this.captionAt + 1.6, 0.5);
        ctx.font = UF.font.mono(20);
        D.text(ctx, `${this.fromAsm}   →   ${this.toAsm}`, cx, y + 96, { color: c('paper', 0.6), spacing: 2, align: 'center' });
      }
      ctx.restore();
    }

    editorial() { return { factual: true, illustration: true, label: this.tag }; }
  }

  UF.HexPatch = HexPatch;
})(window.UF);

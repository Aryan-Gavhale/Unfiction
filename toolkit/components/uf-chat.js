/*!
 * Unfiction GFX Toolkit — ChatThread
 * A recreated message thread on a phone: typing dots, bubbles that pop in, an outgoing message
 * typed into the input bar, timestamps, read ticks, and `mark` to single out one message
 * (the rest dim and a red outline traces round it until the next message starts).
 *
 *   new UF.ChatThread({
 *     contact: 'Unknown number', sub: '+44 •••• 0192',
 *     messages: [
 *       { divider: 'TODAY' },
 *       { from: 'them', text: 'Your parcel could not be delivered.', time: '10:02' },
 *       { from: 'me', text: 'What parcel?', time: '10:03', read: true, mark: 7 },
 *     ],
 *     note: 'Recreation based on <source>',
 *   })
 *
 * Messages without `at` follow each other: incoming ones show typing dots for `typing` seconds,
 * outgoing ones are typed into the input bar at `cps` characters a second (at most 2.5 s), and
 * `gap` seconds separate one message from the next typing.
 */
(function (UF) {
  'use strict';

  const { c, seg, ease, lerp } = UF;
  const D = UF.draw;
  const W = UF.W, H = UF.H;

  const KEYS = ['from', 'text', 'at', 'time', 'typing', 'read', 'mark', 'divider'];
  const ME = c('blue'), THEM = '#262b33';

  /** Closed rounded-rectangle outline as points, starting at the top-left, for tracing on. */
  const outline = (x, y, w, h, r) => {
    const pts = [];
    const arc = (cx, cy, a0) => { for (let i = 0; i <= 8; i++) { const a = a0 + (i / 8) * Math.PI / 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
    arc(x + r, y + r, Math.PI);
    arc(x + w - r, y + r, -Math.PI / 2);
    arc(x + w - r, y + h - r, 0);
    arc(x + r, y + h - r, Math.PI / 2);
    pts.push(pts[0]);
    return pts;
  };

  class ChatThread extends UF.Component {
    constructor(o) {
      super({
        contact: 'Unknown', sub: '', initials: null, avatar: null, clock: '9:41',
        messages: [], gap: 0.8, typing: 1.0, cps: 24,
        x: W / 2, y: H / 2 + 6, w: 470, h: 960, size: 23,
        label: 'RECREATION', labelCorner: null, note: '',
      }, o);
      if (!this.messages.length) throw new Error('ChatThread: messages is empty.');
      if (this.avatar && !UF.images[this.avatar]) throw new Error(`ChatThread: unknown avatar image "${this.avatar}".`);
      if (this.initials == null) this.initials = String(this.contact).split(/\s+/).filter(w => /^[A-Za-z]/.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
      const side = this.x > W / 2 + 1 ? 'l' : 'r';
      if (!this.labelCorner) this.labelCorner = `t${side}`;
      this.noteSide = side;

      const bezel = Math.round(this.w * 0.032);
      this.screenW = this.w - bezel * 2;
      this.headH = Math.round(this.screenW * 0.29);
      this.inputH = Math.round(this.screenW * 0.21);
      this.viewH = this.h - bezel * 2 - this.headH - this.inputH;

      const m = UF.canvas(4, 4).getContext('2d');
      const S = this.size, padX = 18, padY = 12, lh = Math.round(S * 1.3);
      const maxW = Math.round(this.screenW * 0.74);
      let cursor = this.at + 0.9, lastAt = -Infinity, lastFrom = null;
      this.items = this.messages.map((msg, i) => {
        const unknown = Object.keys(msg).filter(k => !KEYS.includes(k));
        if (unknown.length) throw new Error(`ChatThread: message ${i + 1} has unknown key "${unknown[0]}" — use ${KEYS.join(', ')}.`);
        let it;
        if (msg.divider) {
          const at = msg.at ?? cursor;
          it = { kind: 'divider', text: String(msg.divider).toUpperCase(), at, start: at, h: 46 };
          cursor = at + 0.4;
          lastFrom = null;
        } else {
          if (msg.from !== 'me' && msg.from !== 'them') throw new Error(`ChatThread: message ${i + 1} needs from: 'me' or 'them'.`);
          if (!msg.text) throw new Error(`ChatThread: message ${i + 1} has no text.`);
          const text = String(msg.text);
          const pre = msg.typing ?? (msg.from === 'them' ? this.typing : Math.min(2.5, text.length / this.cps));
          const at = msg.at ?? cursor + pre;
          m.font = UF.font.sans(S);
          const lines = D.wrap(m, text, maxW - padX * 2);
          const textW = Math.max(...lines.map(l => D.measure(m, l)));
          m.font = UF.font.mono(13);
          const metaW = (msg.time ? D.measure(m, msg.time) : 0) + (msg.from === 'me' ? 26 : 0);
          const bw = Math.min(maxW, Math.max(textW, metaW) + padX * 2);
          const bh = lines.length * lh + padY * 2 + (metaW ? 16 : 0);
          if (bh > this.viewH - 40) throw new Error(`ChatThread: message ${i + 1} is too long to fit on the screen — split it.`);
          const space = lastFrom === msg.from ? 8 : 18;
          it = { kind: 'msg', from: msg.from, text, lines, lh, padX, padY, bw, bh, at, pre, start: at - pre, time: msg.time || '', read: !!msg.read, mark: msg.mark ?? null, h: bh + space, space };
          cursor = at + this.gap;
          lastFrom = msg.from;
        }
        if (it.at < lastAt) throw new Error(`ChatThread: message ${i + 1} (at ${it.at}s) comes before the message above it — keep messages in time order.`);
        if (it.mark != null && it.mark < it.at) throw new Error(`ChatThread: message ${i + 1} is marked at ${it.mark}s, before it appears at ${it.at.toFixed(2)}s.`);
        lastAt = it.at;
        return it;
      });
      for (const it of this.items) {
        if (it.mark == null) continue;
        const next = this.items.find(n => n.start > it.mark);
        it.markEnd = next ? next.start : Infinity;
      }
      this.typingH = 54 + 18;
    }

    /** The marked message in focus at time t and how far the focus has eased in (k, 0..1). */
    focusAt(t) {
      let best = null;
      for (const it of this.items) {
        if (it.mark == null) continue;
        const k = ease.inOutCubic(seg(t, it.mark, 0.4)) * (1 - ease.inOutCubic(seg(t, it.markEnd, 0.4)));
        if (k > 0 && (!best || k > best.k)) best = { it, k };
      }
      return best;
    }

    /** Height an item takes in the thread at time t (0 before it starts). */
    itemHeight(it, t) {
      if (it.kind === 'msg' && it.from === 'them' && it.pre > 0) {
        if (t < it.start) return 0;
        const grow = ease.outCubic(seg(t, it.start, 0.3));
        return lerp(this.typingH * grow, it.h, ease.outCubic(seg(t, it.at, 0.25)));
      }
      return it.h * ease.outCubic(seg(t, it.at, 0.3));
    }

    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      const enter = ease.outExpo(seg(t - this.at, 0, 0.9));
      ctx.save();
      ctx.globalAlpha = a * enter;
      const cy = this.y + (1 - enter) * 60;
      const s = D.device(ctx, this.x, cy, this.w, this.h, { screen: '#0b0d10' });
      ctx.save();
      D.roundRect(ctx, s.x, s.y, s.w, s.h, s.r);
      ctx.clip();

      const viewTop = s.y + this.headH, viewBottom = viewTop + this.viewH;
      let total = 12;
      for (const it of this.items) total += this.itemHeight(it, t);
      const offset = Math.max(0, total - this.viewH + 10);
      const focus = this.focusAt(t);
      let focusBox = null;
      ctx.save();
      ctx.beginPath();
      ctx.rect(s.x, viewTop, s.w, this.viewH);
      ctx.clip();
      let yy = viewTop + 12 - offset;
      for (const it of this.items) {
        const ih = this.itemHeight(it, t);
        if (ih > 0 && yy < viewBottom && yy + ih > viewTop) {
          ctx.save();
          if (focus && it !== focus.it) ctx.globalAlpha *= 1 - 0.68 * focus.k;
          if (it.kind === 'divider') this.drawDivider(ctx, s, it, yy, t);
          else if (t < it.at) { if (it.from === 'them') this.drawTyping(ctx, s, it, yy, t); }
          else {
            const box = this.drawBubble(ctx, s, it, yy, t);
            if (focus && it === focus.it) focusBox = box;
          }
          ctx.restore();
        }
        yy += ih;
      }
      if (focusBox) {
        const [bx, by, bw, bh] = focusBox, it = focus.it;
        ctx.save();
        ctx.globalAlpha *= 1 - ease.inOutCubic(seg(t, it.markEnd, 0.4));
        ctx.strokeStyle = c('red');
        ctx.lineWidth = 4;
        ctx.lineJoin = 'round';
        ctx.lineCap = 'round';
        D.partialPath(ctx, outline(bx - 8, by - 8, bw + 16, bh + 16, 26), ease.inOutCubic(seg(t, it.mark, 0.6)));
        ctx.stroke();
        ctx.restore();
        fx.kick(t, it.mark, { rgb: 0.3, decay: 10 });
      }
      ctx.restore();

      this.drawHeader(ctx, s);
      this.drawInput(ctx, s, t);
      D.deviceNotch(ctx, s);
      D.statusBar(ctx, s, this.clock);
      ctx.restore();

      if (this.label) {
        const right = this.labelCorner.includes('r'), bottom = this.labelCorner.includes('b');
        D.pill(ctx, this.label, right ? W - 96 : 96, bottom ? H - 88 : 88, { align: right ? 'right' : 'left', fill: c('red'), font: UF.font.mono(16, 'bold'), h: 32, spacing: 3 });
      }
      if (this.note) {
        ctx.font = UF.font.mono(17);
        const right = this.noteSide === 'r';
        D.text(ctx, this.note, right ? W - 96 : 96, H - 56, { color: c('dim'), spacing: 2, align: right ? 'right' : 'left' });
      }
      ctx.restore();
    }

    drawHeader(ctx, s) {
      const y0 = s.y + s.w * 0.11, hh = this.headH - s.w * 0.11;
      ctx.fillStyle = '#12151a';
      ctx.fillRect(s.x, s.y, s.w, this.headH);
      ctx.fillStyle = 'rgba(255,255,255,.07)';
      ctx.fillRect(s.x, s.y + this.headH - 1, s.w, 1);
      const my = y0 + hh / 2;
      ctx.strokeStyle = ME;
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s.x + 30, my - 11); ctx.lineTo(s.x + 20, my); ctx.lineTo(s.x + 30, my + 11);
      ctx.stroke();
      const ar = hh * 0.34, ax = s.x + 48 + ar;
      ctx.save();
      ctx.beginPath();
      ctx.arc(ax, my, ar, 0, Math.PI * 2);
      ctx.fillStyle = '#3b424d';
      ctx.fill();
      const img = this.avatar ? UF.images[this.avatar] : null;
      if (img && img.complete && img.naturalWidth) {
        ctx.clip();
        const k = Math.max((ar * 2) / img.naturalWidth, (ar * 2) / img.naturalHeight);
        ctx.drawImage(img, ax - img.naturalWidth * k / 2, my - img.naturalHeight * k / 2, img.naturalWidth * k, img.naturalHeight * k);
      } else {
        ctx.font = UF.font.sans(Math.round(ar * 0.85), '600');
        D.text(ctx, this.initials, ax, my + ar * 0.3, { color: c('paper'), align: 'center' });
      }
      ctx.restore();
      const tx = ax + ar + 16, tw = s.x + s.w - 24 - tx;
      ctx.font = UF.font.sans(24, '600');
      D.text(ctx, D.fit(ctx, this.contact, tw), tx, this.sub ? my - 2 : my + 8, { color: c('paper') });
      if (this.sub) {
        ctx.font = UF.font.sans(16);
        D.text(ctx, D.fit(ctx, this.sub, tw), tx, my + 22, { color: c('dim') });
      }
    }

    drawInput(ctx, s, t) {
      const top = s.y + s.h - this.inputH;
      ctx.fillStyle = '#12151a';
      ctx.fillRect(s.x, top, s.w, this.inputH);
      const bh = 48, by = top + 14, bx = s.x + 18, bw = s.w - 36 - bh - 12;
      ctx.fillStyle = '#1d2128';
      D.roundRect(ctx, bx, by, bw, bh, bh / 2);
      ctx.fill();
      const typing = this.items.find(it => it.kind === 'msg' && it.from === 'me' && it.pre > 0 && t >= it.start && t < it.at);
      ctx.font = UF.font.sans(20);
      let sendGlow = 0;
      if (typing) {
        const shown = D.typed(typing.text, (t - typing.start) / typing.pre);
        let tail = shown;
        while (tail.length && D.measure(ctx, tail) > bw - 44) tail = tail.slice(1);
        const tw = D.text(ctx, tail, bx + 20, by + bh / 2 + 7, { color: c('paper') });
        if (Math.floor(t * 2.5) % 2 === 0) { ctx.fillStyle = ME; ctx.fillRect(bx + 22 + tw, by + 13, 2, bh - 26); }
        sendGlow = 1;
      } else {
        D.text(ctx, 'Message', bx + 20, by + bh / 2 + 7, { color: '#5d636c' });
        const sent = this.items.filter(it => it.kind === 'msg' && it.from === 'me' && t >= it.at).pop();
        if (sent) sendGlow = 1 - seg(t, sent.at, 0.35);
      }
      const sx = s.x + s.w - 18 - bh / 2, sy = by + bh / 2;
      ctx.fillStyle = sendGlow > 0 ? UF.mix('#2a2f37', ME, sendGlow) : '#2a2f37';
      ctx.beginPath();
      ctx.arc(sx, sy, bh / 2, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = c('paper');
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(sx, sy + 9); ctx.lineTo(sx, sy - 9);
      ctx.moveTo(sx - 7, sy - 2); ctx.lineTo(sx, sy - 9); ctx.lineTo(sx + 7, sy - 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(232,228,218,.55)';
      D.roundRect(ctx, s.x + s.w / 2 - 60, s.y + s.h - 14, 120, 5, 2.5);
      ctx.fill();
    }

    drawDivider(ctx, s, it, y, t) {
      const k = ease.outCubic(seg(t, it.at, 0.3));
      ctx.save();
      ctx.globalAlpha *= k;
      D.pill(ctx, it.text, s.x + s.w / 2, y + 22, { align: 'center', fill: '#1d2128', color: c('dim'), font: UF.font.mono(13, 'bold'), h: 26, spacing: 2 });
      ctx.restore();
    }

    drawTyping(ctx, s, it, y, t) {
      const k = ease.outCubic(seg(t, it.start, 0.25));
      const x = s.x + 16, bw = 78, bh = 46, top = y + 18;
      ctx.save();
      ctx.globalAlpha *= k;
      ctx.fillStyle = THEM;
      D.roundRect(ctx, x, top, bw, bh, 22);
      ctx.fill();
      for (let i = 0; i < 3; i++) {
        const b = Math.max(0, Math.sin((t - it.start) * 7 - i * 0.9));
        ctx.fillStyle = UF.mix('#6b717b', 'paper', b * 0.7);
        ctx.beginPath();
        ctx.arc(x + 22 + i * 17, top + bh / 2 - b * 5, 5, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    /** Draws one message bubble and returns its box [x, y, w, h] on screen. */
    drawBubble(ctx, s, it, y, t) {
      const me = it.from === 'me';
      const x = me ? s.x + s.w - 16 - it.bw : s.x + 16;
      const top = y + it.space;
      const k = ease.outBack(seg(t, it.at, 0.35));
      const ax = me ? x + it.bw : x, ay = top + it.bh;
      ctx.save();
      ctx.globalAlpha *= Math.min(1, seg(t, it.at, 0.15));
      ctx.translate(ax, ay);
      ctx.scale(0.6 + 0.4 * k, 0.6 + 0.4 * k);
      ctx.translate(-ax, -ay);
      ctx.fillStyle = me ? ME : THEM;
      D.roundRect(ctx, x, top, it.bw, it.bh, 20);
      ctx.fill();
      ctx.beginPath();
      if (me) { ctx.moveTo(x + it.bw - 14, ay - 18); ctx.quadraticCurveTo(x + it.bw + 2, ay, x + it.bw + 9, ay); ctx.lineTo(x + it.bw - 22, ay - 1); }
      else { ctx.moveTo(x + 14, ay - 18); ctx.quadraticCurveTo(x - 2, ay, x - 9, ay); ctx.lineTo(x + 22, ay - 1); }
      ctx.fill();
      ctx.font = UF.font.sans(this.size);
      it.lines.forEach((ln, i) => D.text(ctx, ln, x + it.padX, top + it.padY + (i + 1) * it.lh - it.lh * 0.27, { color: me ? '#fff' : c('paper') }));
      if (it.time || me) {
        const my = top + it.bh - 11;
        let right = x + it.bw - it.padX;
        if (me) {
          ctx.strokeStyle = it.read ? '#9fd0ff' : 'rgba(255,255,255,.7)';
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          const tick = ox => { ctx.beginPath(); ctx.moveTo(right - 14 + ox, my - 4); ctx.lineTo(right - 10 + ox, my); ctx.lineTo(right - 3 + ox, my - 9); ctx.stroke(); };
          tick(0);
          if (it.read) tick(-6);
          right -= 24;
        }
        if (it.time) {
          ctx.font = UF.font.mono(13);
          D.text(ctx, it.time, right, my, { color: me ? 'rgba(255,255,255,.72)' : c('dim'), align: 'right' });
        }
      }
      ctx.restore();
      return [x, top, it.bw, it.bh];
    }

    editorial() {
      return { factual: true, recreation: true, label: this.label, sourced: !!this.note };
    }
  }

  UF.ChatThread = ChatThread;
})(window.UF);

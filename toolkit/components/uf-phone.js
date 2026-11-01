/*!
 * Unfiction GFX Toolkit — PhoneCall
 * A recreated phone call: lock screen, incoming call with pulsing rings and vibration,
 * the answer, an in-call timer with a live waveform, and "Call ended" (or "Missed call").
 * An optional transcript types out beside the phone and drives the waveform.
 *
 *   new UF.PhoneCall({
 *     name: 'Unknown caller', number: '+00 •••• 1180', place: 'Overseas',
 *     ringAt: 0.8, answerAt: 3.2, endAt: 12, callLength: 252,
 *     transcript: [
 *       { at: 4.2, speaker: 'Caller', text: 'The money has arrived. Withdraw it today.' },
 *       { at: 7.5, speaker: 'Account holder', text: 'All of it?' },
 *     ],
 *     note: 'Recreation based on <source>',
 *   })
 *
 * Leave answerAt out for a missed call. callLength (seconds) is the real length shown on the
 * timer, spread across answerAt…endAt, so a four-minute call can play out in eight seconds.
 */
(function (UF) {
  'use strict';

  const { c, seg, ease, lerp } = UF;
  const D = UF.draw;
  const W = UF.W, H = UF.H;

  const LINE_KEYS = ['at', 'speaker', 'text'];
  const VOICES = ['amber', 'blue', 'green', 'paper'];
  const ACCEPT = '#34c759', DECLINE = '#ff3b30';

  const clock = s => {
    s = Math.max(0, Math.floor(s));
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
    const two = n => String(n).padStart(2, '0');
    return h ? `${h}:${two(m)}:${two(sec)}` : `${two(m)}:${two(sec)}`;
  };

  class PhoneCall extends UF.Component {
    constructor(o) {
      super({
        name: 'Unknown', number: '', place: '', initials: null, avatar: null,
        clock: '9:41', date: '', ringAt: null, answerAt: null, endAt: null, callLength: null,
        transcript: [], cps: 38,
        x: null, y: H / 2 + 6, w: 440, h: 900,
        label: 'RECREATION', labelCorner: null, note: '',
      }, o);
      if (this.avatar && !UF.images[this.avatar]) throw new Error(`PhoneCall: unknown avatar image "${this.avatar}".`);
      if (this.ringAt == null) this.ringAt = this.at + 0.6;
      if (this.answerAt != null && this.answerAt < this.ringAt) throw new Error('PhoneCall: answerAt comes before ringAt.');
      if (this.endAt != null && this.endAt <= (this.answerAt ?? this.ringAt)) throw new Error('PhoneCall: endAt must come after answerAt (or ringAt for a missed call).');
      if (this.callLength != null && (this.answerAt == null || this.endAt == null)) throw new Error('PhoneCall: callLength needs both answerAt and endAt.');
      if (this.initials == null) this.initials = String(this.name).split(/\s+/).filter(w => /^[A-Za-z]/.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';

      const speakers = [];
      let last = -Infinity;
      this.lines = this.transcript.map((ln, i) => {
        const unknown = Object.keys(ln).filter(k => !LINE_KEYS.includes(k));
        if (unknown.length) throw new Error(`PhoneCall: transcript line ${i + 1} has unknown key "${unknown[0]}" — use ${LINE_KEYS.join(', ')}.`);
        if (ln.at == null || !ln.text) throw new Error(`PhoneCall: transcript line ${i + 1} needs at and text.`);
        if (ln.at < last) throw new Error(`PhoneCall: transcript line ${i + 1} comes before the line above it.`);
        last = ln.at;
        const speaker = String(ln.speaker || '').toUpperCase();
        if (speaker && !speakers.includes(speaker)) speakers.push(speaker);
        return { at: ln.at, speaker, text: String(ln.text), color: speaker ? VOICES[speakers.indexOf(speaker) % VOICES.length] : 'dim', end: ln.at + String(ln.text).length / this.cps + 0.3 };
      });
      if (this.x == null) this.x = this.lines.length ? Math.round(W * 0.29) : W / 2;
      const side = this.x > W / 2 + 1 ? 'l' : 'r';
      if (!this.labelCorner) this.labelCorner = `t${side}`;
      this.noteSide = side;

      if (this.lines.length) {
        const m = UF.canvas(4, 4).getContext('2d');
        m.font = UF.font.sans(34);
        this.colX = this.x + this.w / 2 + 110;
        this.colW = W - 130 - this.colX;
        if (this.colW < 400) throw new Error('PhoneCall: not enough room for the transcript — move the phone left (x) or make it narrower (w).');
        for (const ln of this.lines) {
          ln.wrapped = D.wrap(m, ln.text, this.colW);
          ln.h = (ln.speaker ? 38 : 0) + ln.wrapped.length * 46 + 30;
        }
      }
    }

    timerAt(t) {
      if (this.answerAt == null || t < this.answerAt) return 0;
      const stop = this.endAt ?? Infinity;
      if (this.callLength != null) return this.callLength * seg(Math.min(t, stop), this.answerAt, stop - this.answerAt);
      return Math.min(t, stop) - this.answerAt;
    }

    speaking(t) {
      if (!this.lines.length) return 0.6;
      let v = 0.18;
      for (const ln of this.lines) if (t >= ln.at && t < ln.end) v = Math.max(v, Math.min(1, (t - ln.at) * 6, (ln.end - t) * 6));
      return v;
    }

    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      const enter = ease.outExpo(seg(t - this.at, 0, 0.9));
      const answered = this.answerAt != null && t >= this.answerAt;
      const ended = this.endAt != null && t >= this.endAt;
      const ringing = t >= this.ringAt && !answered && !ended;
      let shake = 0;
      if (ringing && ((t - this.ringAt) % 1.6) < 0.7) shake = Math.sin(t * 110) * 3;

      ctx.save();
      ctx.globalAlpha = a * enter;
      const s = D.device(ctx, this.x + shake, this.y + (1 - enter) * 60, this.w, this.h);
      ctx.save();
      D.roundRect(ctx, s.x, s.y, s.w, s.h, s.r);
      ctx.clip();
      const g = ctx.createRadialGradient(s.x + s.w / 2, s.y + s.h * 0.3, 20, s.x + s.w / 2, s.y + s.h * 0.45, s.h * 0.7);
      g.addColorStop(0, '#1b2733');
      g.addColorStop(1, '#090b0e');
      ctx.fillStyle = g;
      ctx.fillRect(s.x, s.y, s.w, s.h);

      const lockK = 1 - seg(t, this.ringAt, 0.35);
      if (lockK > 0) this.drawLock(ctx, s, lockK);
      const incomingK = Math.min(seg(t, this.ringAt, 0.35), answered ? 1 - seg(t, this.answerAt + 0.15, 0.4) : 1);
      if (incomingK > 0) this.drawIncoming(ctx, s, t, incomingK, ended && !answered);
      if (answered) this.drawInCall(ctx, s, t, seg(t, this.answerAt + 0.2, 0.4), ended);
      if (answered) fx.kick(t, this.answerAt, { rgb: 0.25, decay: 12 });

      D.deviceNotch(ctx, s);
      D.statusBar(ctx, s, this.clock);
      ctx.fillStyle = 'rgba(232,228,218,.55)';
      D.roundRect(ctx, s.x + s.w / 2 - 60, s.y + s.h - 14, 120, 5, 2.5);
      ctx.fill();
      ctx.restore();

      if (this.lines.length) this.drawTranscript(ctx, t);
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

    avatarAt(ctx, cx, cy, r) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fillStyle = '#3b424d';
      ctx.fill();
      const img = this.avatar ? UF.images[this.avatar] : null;
      if (img && img.complete && img.naturalWidth) {
        ctx.clip();
        const k = Math.max((r * 2) / img.naturalWidth, (r * 2) / img.naturalHeight);
        ctx.drawImage(img, cx - img.naturalWidth * k / 2, cy - img.naturalHeight * k / 2, img.naturalWidth * k, img.naturalHeight * k);
      } else {
        ctx.font = UF.font.sans(Math.round(r * 0.8), '600');
        D.text(ctx, this.initials, cx, cy + r * 0.28, { color: c('paper'), align: 'center' });
      }
      ctx.restore();
    }

    button(ctx, x, y, r, color, angle, scale = 1) {
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(scale, scale);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.rotate(angle);
      D.icon(ctx, 'phone', 0, 0, r * 1.15, { fill: '#fff', color: '#fff', width: 2 });
      ctx.restore();
    }

    drawLock(ctx, s, k) {
      ctx.save();
      ctx.globalAlpha *= k;
      ctx.font = UF.font.sans(Math.round(s.w * 0.24), '300');
      D.text(ctx, this.clock, s.x + s.w / 2, s.y + s.h * 0.27, { color: c('paper'), align: 'center' });
      if (this.date) {
        ctx.font = UF.font.sans(Math.round(s.w * 0.05), '500');
        D.text(ctx, this.date, s.x + s.w / 2, s.y + s.h * 0.15, { color: c('paper'), align: 'center' });
      }
      ctx.restore();
    }

    drawIncoming(ctx, s, t, k, missed) {
      const cx = s.x + s.w / 2, ay = s.y + s.h * 0.3, ar = s.w * 0.15;
      ctx.save();
      ctx.globalAlpha *= k;
      ctx.font = UF.font.mono(15, 'bold');
      D.text(ctx, missed ? 'MISSED CALL' : 'INCOMING CALL', cx, s.y + s.h * 0.13, { color: missed ? DECLINE : c('dim'), spacing: 4, align: 'center' });
      if (!missed) {
        for (let i = 0; i < 2; i++) {
          const ph = (((t - this.ringAt) / 1.6) + i * 0.5) % 1;
          ctx.strokeStyle = `rgba(232,228,218,${(1 - ph) * 0.35})`;
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.arc(cx, ay, ar * (1 + ph * 0.9), 0, Math.PI * 2);
          ctx.stroke();
        }
      }
      this.avatarAt(ctx, cx, ay, ar);
      ctx.font = UF.font.sans(Math.round(s.w * 0.085), '600');
      D.text(ctx, D.fit(ctx, this.name, s.w - 40), cx, s.y + s.h * 0.47, { color: c('paper'), align: 'center' });
      ctx.font = UF.font.sans(Math.round(s.w * 0.046));
      const sub = [this.number, this.place].filter(Boolean).join('  ·  ');
      if (sub) D.text(ctx, D.fit(ctx, sub, s.w - 40), cx, s.y + s.h * 0.47 + s.w * 0.09, { color: c('dim'), align: 'center' });
      if (!missed) {
        const by = s.y + s.h * 0.83, br = s.w * 0.09;
        const press = this.answerAt != null ? Math.sin(Math.PI * seg(t, this.answerAt, 0.25)) : 0;
        const bob = this.answerAt != null && t >= this.answerAt ? 1 : 1 + 0.06 * Math.sin((t - this.ringAt) * 6);
        this.button(ctx, s.x + s.w * 0.25, by, br, DECLINE, Math.PI * 0.75);
        this.button(ctx, s.x + s.w * 0.75, by, br, ACCEPT, 0, bob * (1 - press * 0.15));
        if (this.answerAt != null && t >= this.answerAt) {
          const rp = seg(t, this.answerAt, 0.5);
          ctx.save();
          ctx.strokeStyle = ACCEPT;
          ctx.globalAlpha *= 1 - rp;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(s.x + s.w * 0.75, by, br * (1 + rp * 1.2), 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        ctx.font = UF.font.sans(Math.round(s.w * 0.04));
        D.text(ctx, 'Decline', s.x + s.w * 0.25, by + br + 30, { color: c('paper'), align: 'center' });
        D.text(ctx, 'Accept', s.x + s.w * 0.75, by + br + 30, { color: c('paper'), align: 'center' });
      }
      ctx.restore();
    }

    drawInCall(ctx, s, t, k, ended) {
      const cx = s.x + s.w / 2;
      const endK = ended ? ease.outCubic(seg(t, this.endAt, 0.5)) : 0;
      ctx.save();
      ctx.globalAlpha *= k;
      this.avatarAt(ctx, cx, s.y + s.h * 0.2, s.w * 0.11);
      ctx.font = UF.font.sans(Math.round(s.w * 0.075), '600');
      D.text(ctx, D.fit(ctx, this.name, s.w - 40), cx, s.y + s.h * 0.33, { color: c('paper'), align: 'center' });
      ctx.font = UF.font.mono(Math.round(s.w * 0.05));
      D.text(ctx, clock(this.timerAt(t)), cx, s.y + s.h * 0.33 + s.w * 0.1, { color: ended ? DECLINE : c('dim'), align: 'center', spacing: 2 });
      if (ended) {
        ctx.save();
        ctx.globalAlpha *= endK;
        ctx.font = UF.font.mono(15, 'bold');
        D.text(ctx, 'CALL ENDED', cx, s.y + s.h * 0.33 + s.w * 0.18, { color: DECLINE, align: 'center', spacing: 4 });
        ctx.restore();
      }

      const amp = this.speaking(t) * (1 - endK);
      const n = 30, ww = s.w * 0.72, wy = s.y + s.h * 0.55, bw = ww / n;
      ctx.fillStyle = c('green', 0.9);
      for (let i = 0; i < n; i++) {
        const env = Math.sin(Math.PI * (i + 0.5) / n);
        const nse = Math.abs(Math.sin(i * 1.7 + t * 9.3) * Math.sin(i * 0.63 - t * 5.1 + 1.3) + 0.35 * Math.sin(i * 3.1 + t * 13.7));
        const bh = 4 + 70 * amp * env * nse;
        D.roundRect(ctx, cx - ww / 2 + i * bw + bw * 0.2, wy - bh / 2, bw * 0.6, bh, bw * 0.3);
        ctx.fill();
      }

      ctx.globalAlpha *= 1 - endK * 0.6;
      const gy = s.y + s.h * 0.7, gr = s.w * 0.075;
      [['mute', 0.22], ['keypad', 0.5], ['speaker', 0.78]].forEach(([name, fxp]) => {
        const gx = s.x + s.w * fxp;
        ctx.fillStyle = 'rgba(255,255,255,.12)';
        ctx.beginPath();
        ctx.arc(gx, gy, gr, 0, Math.PI * 2);
        ctx.fill();
        this.glyph(ctx, name, gx, gy, gr * 0.5);
        ctx.font = UF.font.sans(Math.round(s.w * 0.036));
        D.text(ctx, name, gx, gy + gr + 24, { color: c('dim'), align: 'center' });
      });
      const press = ended ? Math.sin(Math.PI * seg(t, this.endAt, 0.25)) : 0;
      this.button(ctx, cx, s.y + s.h * 0.86, s.w * 0.09, DECLINE, Math.PI * 0.75, 1 - press * 0.15);
      ctx.restore();
    }

    glyph(ctx, name, x, y, r) {
      ctx.save();
      ctx.strokeStyle = c('paper');
      ctx.fillStyle = c('paper');
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      if (name === 'mute') {
        D.roundRect(ctx, x - r * 0.32, y - r, r * 0.64, r * 1.25, r * 0.32);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y - r * 0.1, r * 0.62, 0.15 * Math.PI, 0.85 * Math.PI);
        ctx.moveTo(x, y + r * 0.52); ctx.lineTo(x, y + r * 0.9);
        ctx.stroke();
      } else if (name === 'keypad') {
        for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.arc(x + ((i % 3) - 1) * r * 0.7, y + (Math.floor(i / 3) - 1) * r * 0.7, r * 0.15, 0, Math.PI * 2); ctx.fill(); }
      } else {
        ctx.beginPath();
        ctx.moveTo(x - r * 0.9, y - r * 0.3); ctx.lineTo(x - r * 0.45, y - r * 0.3); ctx.lineTo(x, y - r * 0.8);
        ctx.lineTo(x, y + r * 0.8); ctx.lineTo(x - r * 0.45, y + r * 0.3); ctx.lineTo(x - r * 0.9, y + r * 0.3); ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(x + r * 0.1, y, r * 0.45, -0.3 * Math.PI, 0.3 * Math.PI);
        ctx.moveTo(x + r * 0.42, y - r * 0.68);
        ctx.arc(x + r * 0.1, y, r * 0.8, -0.3 * Math.PI, 0.3 * Math.PI);
        ctx.stroke();
      }
      ctx.restore();
    }

    drawTranscript(ctx, t) {
      const top = H * 0.24, bottom = H * 0.84;
      let total = 0;
      const shown = this.lines.map(ln => { const k = ease.outCubic(seg(t, ln.at, 0.35)); total += ln.h * k; return k; });
      const room = bottom - top;
      const offset = total > room ? total - room : -(room - total) / 2;
      ctx.save();
      ctx.beginPath();
      ctx.rect(this.colX - 20, top - 10, this.colW + 40, bottom - top + 20);
      ctx.clip();
      let y = top - offset;
      this.lines.forEach((ln, i) => {
        const k = shown[i];
        if (k <= 0) return;
        const next = this.lines[i + 1];
        const dim = next ? 1 - 0.62 * ease.inOutCubic(seg(t, next.at, 0.4)) : 1;
        ctx.save();
        ctx.globalAlpha *= k * dim;
        let yy = y + (1 - k) * 20;
        if (ln.speaker) {
          ctx.font = UF.font.mono(19, 'bold');
          D.text(ctx, ln.speaker, this.colX, yy + 20, { color: c(ln.color), spacing: 3 });
          yy += 38;
        }
        ctx.font = UF.font.sans(34);
        let left = Math.floor((t - ln.at) * this.cps);
        for (const row of ln.wrapped) {
          yy += 46;
          if (left <= 0) break;
          D.text(ctx, row.slice(0, left), this.colX, yy - 10, { color: c('paper') });
          left -= row.length + 1;
        }
        ctx.restore();
        y += ln.h * k;
      });
      ctx.restore();
    }

    editorial() {
      return { factual: true, recreation: true, label: this.label, sourced: !!this.note };
    }
  }

  UF.PhoneCall = PhoneCall;
})(window.UF);

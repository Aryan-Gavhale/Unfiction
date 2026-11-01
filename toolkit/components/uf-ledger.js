/*!
 * Unfiction GFX Toolkit — Ledger
 * A recreated bank statement: rows slide in one by one, the running balance counts to each
 * new value, a flagged row lights up, and the table scrolls once it is full.
 *
 *   new UF.Ledger({
 *     bank: 'EXAMPLE NATIONAL BANK', holder: 'ACME TRADING LTD', account: '•••• 4471',
 *     period: '01 FEB – 10 FEB 2016', currency: '$', opening: 500,
 *     rows: [
 *       { date: '04 FEB', text: 'INWARD SWIFT — FEDERAL RESERVE BANK NY', credit: 20000000 },
 *       { date: '05 FEB', text: 'CASH WITHDRAWAL — BRANCH 0412', debit: 19500000, flag: 'WITHDRAWN NEXT DAY' },
 *     ],
 *     note: 'Recreation based on <source>',
 *   })
 *
 * A row has a debit or a credit, or neither for a memo line such as 'ACCOUNT FROZEN'. Balances run from `opening`; give a row its own
 * `balance` when the source statement prints one and the running total restarts from it.
 * Rows without `at` follow each other every `rowStep` seconds from `startAt` (default at + 1).
 * `erase: 6.5` (or { at: 6.5, label: 'DELETED' }) wipes a row out at 6.5 s: the rows below close the gap and every
 * balance after it recounts as if the row had never been there.
 */
(function (UF) {
  'use strict';

  const { c, seg, ease, lerp } = UF;
  const D = UF.draw;
  const W = UF.W, H = UF.H;

  const STYLES = {
    dark: {
      bg: '#0f1318', band: c('blue'), head: 'rgba(255,255,255,.04)', ink: c('paper'), dim: c('dim'),
      rule: 'rgba(232,228,218,.09)', debit: '#e0605a', credit: c('green'), zebra: 'rgba(255,255,255,.022)', flash: c('blue', 0.22),
    },
    paper: {
      bg: null, band: '#1d3557', head: 'rgba(31,35,40,.06)', ink: '#1f2328', dim: '#6a6f76',
      rule: 'rgba(31,35,40,.14)', debit: '#a4161a', credit: '#1e7046', zebra: 'rgba(31,35,40,.035)', flash: 'rgba(217,164,65,.28)',
    },
  };
  const HEAD = 118, COLS = 48, FOOT = 74, PAD = 40;
  const ROW_KEYS = ['date', 'text', 'debit', 'credit', 'balance', 'at', 'flag', 'erase'];
  const WIPE = 0.32, COLLAPSE = 0.4, RECOUNT = 0.7;

  class Ledger extends UF.Component {
    constructor(o) {
      super({
        bank: '', holder: '', account: '', period: '', currency: '$', decimals: 2, opening: 0,
        rows: [], visible: 7, rowStep: 0.55, startAt: null, style: 'dark', seed: 5,
        showOpening: true, closingLabel: 'CLOSING BALANCE',
        label: 'RECREATION', note: '',
        x: W / 2, y: H / 2 + 10, w: 1400, rowH: 60,
      }, o);
      if (!STYLES[this.style]) throw new Error(`Ledger: style must be 'dark' or 'paper', not "${this.style}".`);
      if (!this.rows.length) throw new Error('Ledger: rows is empty.');

      let bal = this.opening, next = this.startAt ?? this.at + 1;
      this.items = this.rows.map((r, i) => {
        const unknown = Object.keys(r).filter(k => !ROW_KEYS.includes(k));
        if (unknown.length) throw new Error(`Ledger: row ${i + 1} has unknown key "${unknown[0]}" — use ${ROW_KEYS.join(', ')}.`);
        const hasD = r.debit != null, hasC = r.credit != null;
        if (hasD && hasC) throw new Error(`Ledger: row ${i + 1} ("${r.text || ''}") has both debit and credit — split it into two rows.`);
        const amt = hasD ? r.debit : hasC ? r.credit : 0;
        if (!Number.isFinite(amt) || amt < 0) throw new Error(`Ledger: row ${i + 1} amount must be a number of zero or more, not ${amt}.`);
        if (r.balance != null && !Number.isFinite(r.balance)) throw new Error(`Ledger: row ${i + 1} balance must be a number.`);
        const prev = bal;
        bal = r.balance != null ? r.balance : bal + (hasC ? amt : -amt);
        const at = r.at ?? next;
        next = at + this.rowStep;
        let flag = null;
        if (r.flag) {
          const f = typeof r.flag === 'string' ? { text: r.flag } : r.flag;
          if (!f.text) throw new Error(`Ledger: row ${i + 1} flag needs text.`);
          flag = { text: String(f.text).toUpperCase(), at: f.at ?? at + 0.6, color: f.color || 'red' };
        }
        let erase = null;
        if (r.erase != null) {
          const e = typeof r.erase === 'number' ? { at: r.erase } : r.erase;
          if (!Number.isFinite(e.at)) throw new Error(`Ledger: row ${i + 1} erase needs a time — erase: 6.5 or erase: { at: 6.5, label: 'DELETED' }.`);
          if (e.at < at + 0.35) throw new Error(`Ledger: row ${i + 1} is erased at ${e.at}s, before it has finished arriving at ${at}s.`);
          erase = { at: e.at, label: e.label === undefined ? 'DELETED' : String(e.label).toUpperCase() };
        }
        return {
          date: String(r.date || ''), text: String(r.text || ''), debit: hasD ? amt : null, credit: hasC ? amt : null, prev, bal, at, flag,
          erase, delta: hasD ? amt : hasC ? -amt : 0, restart: r.balance != null, shifts: [],
        };
      });
      // An erased row's amount comes back into every balance after it, up to the next printed balance.
      this.items.forEach((it, e) => {
        if (!it.erase || !it.delta) return;
        for (let i = e + 1; i < this.items.length && !this.items[i].restart; i++) this.items[i].shifts.push(it);
      });
      this.layout();
    }

    /** 0 -> 1 as an erased row's amount is written back into the balances. */
    recount(it, t) {
      return it.erase ? ease.inOutCubic(seg(t, it.erase.at + WIPE, RECOUNT)) : 0;
    }

    /** Share of its row height a row still takes up (an erased row shrinks to nothing). */
    rowFrac(it, t) {
      return it.erase ? 1 - ease.inOutCubic(seg(t, it.erase.at + WIPE, COLLAPSE)) : 1;
    }

    money(v) {
      const s = Math.abs(v).toLocaleString('en-US', { minimumFractionDigits: this.decimals, maximumFractionDigits: this.decimals });
      return `${v < 0 ? '−' : ''}${this.currency}${s}`;
    }

    layout() {
      const inner = this.w - PAD * 2;
      const dateW = Math.round(inner * 0.11), moneyW = Math.round(inner * 0.15), balW = Math.round(inner * 0.165);
      const descW = inner - dateW - moneyW * 2 - balW;
      const x0 = PAD;
      this.cols = {
        date: x0, desc: x0 + dateW, descW,
        debit: x0 + dateW + descW + moneyW, credit: x0 + dateW + descW + moneyW * 2, balance: x0 + inner, dateW, moneyW,
      };
      const m = UF.canvas(4, 4).getContext('2d');
      m.font = UF.font.mono(22);
      const restored = it => it.bal + it.shifts.reduce((s, e) => s + e.delta, 0) + (it.erase ? it.delta : 0);
      const values = [this.opening, ...this.items.flatMap(it => [it.prev, it.bal, restored(it), it.debit ?? 0, it.credit ?? 0])];
      const widest = Math.max(...values.map(v => D.measure(m, this.money(v))));
      this.moneySize = Math.max(14, Math.min(22, Math.floor(22 * (moneyW - 18) / widest)));
      m.font = UF.font.mono(26, 'bold');
      const widestBold = Math.max(...values.map(v => D.measure(m, this.money(v))));
      this.closingSize = Math.max(16, Math.min(26, Math.floor(26 * (balW - 12) / widestBold)));
      m.font = UF.font.mono(14, 'bold');
      for (const it of this.items) if (it.flag) it.flag.w = D.measure(m, it.flag.text, 2) + 28;
      this.bodyRows = Math.min(this.visible, this.items.length);
      this.h = HEAD + COLS + this.bodyRows * this.rowH + FOOT;
    }

    /** Panel, header, column titles and footer captions: everything that never moves. */
    sprite(res) {
      if (this._sprite && this._spriteRes === res) return this._sprite;
      const S = STYLES[this.style], w = this.w, h = this.h, k = this.cols;
      const cv = UF.canvas(w * res, h * res), x = cv.getContext('2d');
      x.scale(res, res);
      D.roundRect(x, 0, 0, w, h, 8);
      x.save();
      x.clip();
      if (S.bg) { x.fillStyle = S.bg; x.fillRect(0, 0, w, h); } else x.drawImage(D.paperTexture(w, h, this.seed, '#efece4'), 0, 0);
      x.fillStyle = S.band;
      x.fillRect(0, 0, w, 6);
      x.font = UF.font.sans(30, '600');
      D.text(x, D.fit(x, this.bank, w * 0.6), PAD, 58, { color: S.ink });
      const who = [this.holder, this.account && `ACCOUNT ${this.account}`].filter(Boolean).join('   ·   ');
      x.font = UF.font.mono(17);
      D.text(x, D.fit(x, who, w * 0.6, 1), PAD, 90, { color: S.dim, spacing: 1 });
      if (this.period) {
        x.font = UF.font.mono(14, 'bold');
        D.text(x, 'STATEMENT PERIOD', w - PAD, 56, { color: S.dim, spacing: 3, align: 'right' });
        x.font = UF.font.mono(20);
        D.text(x, this.period, w - PAD, 86, { color: S.ink, align: 'right' });
      }
      x.fillStyle = S.head;
      x.fillRect(0, HEAD, w, COLS);
      x.fillStyle = S.rule;
      x.fillRect(0, HEAD, w, 1.5);
      x.fillRect(0, HEAD + COLS - 1.5, w, 1.5);
      x.font = UF.font.mono(15, 'bold');
      const cy = HEAD + COLS / 2 + 5;
      D.text(x, 'DATE', k.date, cy, { color: S.dim, spacing: 3 });
      D.text(x, 'DESCRIPTION', k.desc, cy, { color: S.dim, spacing: 3 });
      D.text(x, 'DEBIT', k.debit, cy, { color: S.dim, spacing: 3, align: 'right' });
      D.text(x, 'CREDIT', k.credit, cy, { color: S.dim, spacing: 3, align: 'right' });
      D.text(x, 'BALANCE', k.balance, cy, { color: S.dim, spacing: 3, align: 'right' });
      const fy = h - FOOT;
      x.fillStyle = S.rule;
      x.fillRect(0, fy, w, 1.5);
      x.font = UF.font.mono(14, 'bold');
      if (this.showOpening) {
        D.text(x, 'OPENING BALANCE', PAD, fy + 30, { color: S.dim, spacing: 3 });
        x.font = UF.font.mono(20);
        D.text(x, this.money(this.opening), PAD, fy + 56, { color: S.ink });
        x.font = UF.font.mono(14, 'bold');
      }
      D.text(x, this.closingLabel, k.credit, fy + 44, { color: S.dim, spacing: 3, align: 'right' });
      x.restore();
      x.strokeStyle = this.style === 'dark' ? c('line') : 'rgba(31,35,40,.25)';
      x.lineWidth = 1.5;
      D.roundRect(x, 0.75, 0.75, w - 1.5, h - 1.5, 8);
      x.stroke();
      this._sprite = cv;
      this._spriteRes = res;
      return cv;
    }

    balanceAt(it, t) {
      let v = lerp(it.prev, it.bal, ease.outCubic(seg(t, it.at + 0.1, 0.6)));
      for (const e of it.shifts) v += e.delta * this.recount(e, t);
      return v;
    }

    draw(ctx, t, fx) {
      const a = this.vis(t);
      if (a <= 0) return;
      const S = STYLES[this.style];
      const enter = ease.outExpo(seg(t - this.at, 0, 0.9));
      const w = this.w, h = this.h;
      const x = this.x - w / 2, y = this.y - h / 2 + (1 - enter) * 50;
      const m = ctx.getTransform();
      const res = Math.min(2, Math.max(1, Math.ceil(Math.hypot(m.a, m.b))));

      ctx.save();
      ctx.globalAlpha = a * enter;
      const sh = D.shadowSprite(w, h, 8, 30);
      ctx.save();
      ctx.globalAlpha *= 0.7;
      ctx.drawImage(sh, x - sh.pad, y + 22 - sh.pad);
      ctx.restore();
      ctx.drawImage(this.sprite(res), x, y, w, h);

      const top = y + HEAD + COLS, bodyH = this.bodyRows * this.rowH;
      // Rows below an erased row close the gap, so positions add up row heights rather than counting rows.
      let occupied = 0;
      for (const it of this.items) occupied += ease.inOutCubic(seg(t, it.at, 0.45)) * this.rowFrac(it, t);
      const scroll = Math.max(0, occupied - this.bodyRows);
      ctx.save();
      ctx.beginPath();
      ctx.rect(x, top, w, bodyH);
      ctx.clip();
      let latest = null, slot = 0, stripe = 0;
      this.items.forEach(it => {
        const frac = this.rowFrac(it, t), p = seg(t, it.at, 0.35);
        const ry = top + (slot - scroll) * this.rowH;
        slot += frac;
        if (p <= 0) return;
        latest = it;
        if (frac <= 0) return;
        const zebra = stripe++ % 2 === 1;
        if (ry >= top + bodyH || ry + this.rowH * frac <= top) return;
        ctx.save();
        if (frac < 1) {
          ctx.beginPath();
          ctx.rect(x, ry, w, this.rowH * frac);
          ctx.clip();
        }
        this.drawRow(ctx, t, fx, it, zebra, x, ry, p, S, a * enter * (frac < 1 ? frac : 1));
        ctx.restore();
      });
      ctx.restore();

      const fy = y + h - FOOT;
      let closing = latest ? this.balanceAt(latest, t) : this.opening;
      if (latest && latest.erase) closing += latest.delta * this.recount(latest, t);
      let change = 0;
      for (const it of this.items) if (it.erase && it.delta) change = Math.max(change, Math.sin(Math.PI * this.recount(it, t)));
      ctx.font = UF.font.mono(this.closingSize, 'bold');
      if (change > 0.01) {
        const cw = D.measure(ctx, this.money(closing)) + 24;
        ctx.save();
        ctx.globalAlpha = a * enter * change;
        ctx.fillStyle = c('amber', 0.3);
        ctx.fillRect(x + this.cols.balance - cw + 12, fy + 14, cw, 46);
        ctx.restore();
      }
      D.text(ctx, this.money(closing), x + this.cols.balance, fy + 47, { color: change > 0.01 ? c('amber') : closing < 0 ? S.debit : S.ink, align: 'right' });

      if (this.label) D.pill(ctx, this.label, x + w, y - 30, { align: 'right', fill: c('red'), font: UF.font.mono(15, 'bold'), h: 28, spacing: 3 });
      if (this.note) {
        ctx.font = UF.font.mono(17);
        D.text(ctx, this.note, x + w, y + h + 42, { color: c('dim'), spacing: 2, align: 'right' });
      }
      ctx.restore();
    }

    drawRow(ctx, t, fx, it, zebra, x, y, p, S, alpha) {
      const k = ease.outCubic(p), rh = this.rowH, w = this.w, col = this.cols;
      const ox = (1 - k) * 28;
      ctx.save();
      ctx.globalAlpha = alpha * k;
      if (zebra) { ctx.fillStyle = S.zebra; ctx.fillRect(x, y, w, rh); }
      // An erasing row: a red bar sweeps left to right and takes the text with it.
      const wp = it.erase ? seg(t, it.erase.at, WIPE) : 0;
      const sweep = x + w * ease.inOutCubic(wp);
      if (wp > 0) {
        fx.kick(t, it.erase.at, { glitch: 0.35, glitchDur: 0.06, rgb: 0.5, decay: 12 });
        ctx.fillStyle = c('red', 0.16);
        ctx.fillRect(x, y, sweep - x, rh);
      }
      const flash = 1 - seg(t, it.at, 1.1);
      if (flash > 0) { ctx.globalAlpha = alpha * k * flash; ctx.fillStyle = S.flash; ctx.fillRect(x, y, w, rh); ctx.globalAlpha = alpha * k; }
      let flagW = 0;
      if (it.flag) {
        const fp = ease.outCubic(seg(t, it.flag.at, 0.4));
        if (fp > 0) {
          ctx.globalAlpha = alpha * k * fp;
          ctx.fillStyle = c(it.flag.color, this.style === 'dark' ? 0.17 : 0.13);
          ctx.fillRect(x, y, w, rh);
          ctx.fillStyle = c(it.flag.color);
          ctx.fillRect(x, y, 5, rh);
          D.pill(ctx, it.flag.text, x + col.desc + col.descW - 14, y + rh / 2, {
            align: 'right', fill: c(it.flag.color), font: UF.font.mono(14, 'bold'), h: 26, spacing: 2,
            color: ['amber', 'green'].includes(it.flag.color) ? '#000' : c('paper'),
          });
          ctx.globalAlpha = alpha * k;
          flagW = it.flag.w + 14;
          fx.kick(t, it.flag.at, { rgb: 0.4, shake: 0.004, decay: 10 });
        }
      }
      const by = y + rh / 2 + 8;
      if (wp > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(sweep, y, x + w - sweep, rh);
        ctx.clip();
      }
      ctx.translate(ox, 0);
      ctx.font = UF.font.mono(19);
      D.text(ctx, D.fit(ctx, it.date, col.dateW - 14), x + col.date, by - 1, { color: S.dim });
      ctx.font = UF.font.sans(22);
      D.text(ctx, D.fit(ctx, it.text, col.descW - 24 - flagW), x + col.desc, by, { color: S.ink });
      ctx.font = UF.font.mono(this.moneySize);
      if (it.debit != null) D.text(ctx, this.money(it.debit), x + col.debit, by, { color: S.debit, align: 'right' });
      if (it.credit != null) D.text(ctx, this.money(it.credit), x + col.credit, by, { color: S.credit, align: 'right' });
      const bal = this.balanceAt(it, t);
      D.text(ctx, this.money(bal), x + col.balance, by, { color: bal < 0 ? S.debit : S.ink, align: 'right' });
      ctx.translate(-ox, 0);
      if (wp > 0) {
        ctx.restore();
        if (wp < 1) {
          ctx.fillStyle = c('red');
          ctx.fillRect(sweep - 3, y + 4, 6, rh - 8);
        }
        if (it.erase.label && sweep > x + col.desc + 120) {
          ctx.globalAlpha = alpha * k * Math.min(1, (sweep - x - col.desc - 120) / 80);
          D.pill(ctx, it.erase.label, x + col.desc, y + rh / 2, {
            fill: c('red'), font: UF.font.mono(14, 'bold'), h: 26, spacing: 3,
          });
        }
      }
      ctx.fillStyle = S.rule;
      ctx.fillRect(x, y + rh - 1, w, 1);
      ctx.restore();
    }

    editorial() {
      return { factual: true, recreation: true, label: this.label, sourced: !!this.note };
    }
  }

  UF.Ledger = Ledger;
})(window.UF);
